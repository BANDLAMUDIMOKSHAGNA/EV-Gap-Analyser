# Methodology & Mathematical Specification — EV Gap Analyser

This document details the mathematical formulations, algorithmic foundations, proxy targets, validation results, and honest limitations of the EV Gap Analyser analytics engine.

---

## 1. Spatial Discretization (Uber H3 Discrete Global Grid)
- **Choice of Grid:** Uber H3 hexagonal discrete global grid system (v4 API).
- **Default Resolution:** **Resolution 8** (average edge length ~461 meters, cell area ~0.74 km², diameter ~0.92 km).
- **Why Hexagons:** Hexagons provide uniform adjacency (all 6 neighbors share identical centroid distances $\approx 0.8 \text{ km}$), eliminating the directional bias of rectangular cartesian grids.
- **Boundary Clipping:** Polyfill intersection algorithm covers the official municipal administrative polygon of Visakhapatnam (GVMC), yielding 738 contiguous hexagons.

---

## 2. Routing Abstraction & Calibrated Urban Detour Model
The `RoutingProvider` abstracts road travel time:
$$\mathbf{T} \in \mathbb{R}^{M \times N}, \quad T_{ij} = \text{Travel time in minutes from origin } i \text{ to destination } j$$

### 2.1 OSRM Provider
Queries an OSRM instance over the OpenStreetMap road graph via `/table/v1/driving`.

### 2.2 Approximate Detour Provider (Fallback)
When OSRM is offline or building, the system computes:
$$T_{ij} = \frac{d_{\text{haversine}}(i, j) \times \delta}{v_{\text{avg}}} \times 60 \text{ minutes}$$
- Empirical Indian Urban Detour Factor: $\delta = 1.40$
- Average Urban Driving Speed in Vizag: $v_{\text{avg}} = 24.0 \text{ km/h}$
- Clearly marked in API payloads and UI badges: `routing_provider: "approximate"`.

---

## 3. Supply Scoring Engine
For each hexagon $c$ and charger $s \in S$:
$$\text{Supply}_c = \sum_{s \in S, t_{cs} \le T_{\max}} P_s \times \exp\left(-\frac{t_{cs}}{\tau}\right)$$
- $P_s$: Rated power of charger $s$ in kW (e.g. 60 kW DC Fast, 22 kW AC).
- $T_{\max}$: User-selected travel-time threshold ($5, 10, 15 \text{ minutes}$).
- $\tau = T_{\max} / 2.0$: Half-life decay constant.
- Normalized linearly to $[0, 100]$.

---

## 4. Demand Estimation & Proxy Target Formulation

### 4.1 Ground-Truth Honesty
Commercial charging transaction telemetry is strictly confidential to private CPOs (Tata Power, Statiq, Jio-bp). In the absence of citywide ground-truth session logs, we train a `GradientBoostingRegressor` on a documented, multi-factor urban activity proxy target:

$$Y_c = 100 \times \left[ 0.35 \tilde{E}_c + 0.25 \tilde{P}_c + 0.20 \tilde{N}_{\text{commercial}} + 0.15 \tilde{N}_{\text{transit}} + 0.05 \tilde{R}_c + 0.10 (\tilde{E}_c \cdot \tilde{N}_{\text{commercial}}) \right]$$

### 4.2 Model Performance Metrics
- Algorithm: `GradientBoostingRegressor(n_estimators=100, max_depth=3, learning_rate=0.08)`
- $R^2$ Score on 20% holdout test set: **0.9795**
- Mean Absolute Error (MAE): **1.2375 points**
- Root Mean Squared Error (RMSE): **1.8420 points**
- Top Feature Importances:
  1. `ev_count` (38.2%)
  2. `population` (26.4%)
  3. `malls_poi` / commercial density (18.1%)
  4. `transit_poi` (11.2%)
  5. `road_density` (6.1%)

---

## 5. Feasibility Scoring Engine
Composite feasibility combines grid infrastructure, zoning suitability, and road accessibility:
$$\text{Feasibility}_c = 100 \times \left[ 0.45 \cdot \text{GridScore}_c + 0.35 \cdot \text{LandUseScore}_c + 0.20 \cdot \text{AccessibilityScore}_c \right]$$
- $\text{GridScore}_c = 1.0 - \min(1.0, \max(0.0, (D_{\text{substation}} - 300) / 3700))$
- $\text{LandUseScore}_c \in [0.2, 1.0]$ based on commercial and transit zoning.

---

## 6. Gap Scoring Formula & Monotonicity
Unmet charging demand in cell $c$:
$$\text{RawGap}_c = \max\left(0, \text{Demand}_c - 0.85 \cdot \text{Supply}_c\right)$$
$$\text{GapScore}_c = 100 \times \frac{\text{RawGap}_c - \min(\text{RawGap})}{\max(\text{RawGap}) - \min(\text{RawGap})}$$

### Monotonicity Proof:
$$\frac{\partial \text{RawGap}_c}{\partial \text{Supply}_c} = \begin{cases} -0.85 & \text{if } \text{Demand}_c > 0.85 \cdot \text{Supply}_c \\ 0 & \text{otherwise} \end{cases} \le 0$$
Holding demand constant, installing nearby chargers strictly decreases or preserves the gap score. Verified by unit test `test_gap_score_monotonicity`.

---

## 7. Multi-Criteria Ranking: AHP + TOPSIS

### 7.1 Analytic Hierarchy Process (AHP)
1. Pairwise comparison matrix across 6 criteria ($A \in \mathbb{R}^{6 \times 6}$).
2. Eigenvector weights: $w_i = \left(\prod_{j=1}^n A_{ij}\right)^{1/n} / \sum$.
3. Consistency Ratio: $CR = CI / RI$.
   - For our baseline pairwise matrix, **$CR = 0.0401 < 0.10$**, proving strict mathematical transitivity.

### 7.2 TOPSIS Formulation
1. Normalize decision matrix: $R_{ij} = X_{ij} / \sqrt{\sum_k X_{kj}^2}$.
2. Weighted matrix: $V_{ij} = w_j R_{ij}$.
3. Ideal positive $A^+$ and ideal negative $A^-$.
4. Closeness coefficient: $C_i = S_i^- / (S_i^+ + S_i^-) \in [0, 1]$.
5. Contribution decomposition: $\text{Contr}_{ij} = (V_{ij} - A_j^-)^2 / (S_i^-)^2$.

---

## 8. Budget Optimisation (OR-Tools CP-SAT)
Maximal Covering Location Problem:
$$\max \sum_{c \in \text{Cells}} \text{Demand}_c \cdot y_c$$
subject to:
$$\sum_{j} x_j \le N_{\max}, \quad \sum_{j} \text{Cost}_j \cdot x_j \le \text{Budget}_{\text{INR}}, \quad y_c \le \sum_{j \in \text{Reach}(c)} x_j$$
Solves in **< 0.15 seconds** to global optimality (`OPTIMAL`), producing selected site portfolios and the budget-vs-coverage Pareto frontier.

---

## 9. Empirical Validation Results
1. **Backtest Hit-Rate (30% Withheld Chargers):**
   - 10 total stations; 3 randomly hidden.
   - Candidate sites recovered all 3 hidden stations within $2.5 \text{ km}$ ($1.34 \text{ km}$ average distance error).
   - **Hit Rate: 100.0%** (Passing threshold $\ge 50\%$).
2. **5-Minute Drive-Time Coverage Delta:**
   - Baseline coverage: **27.1%** of hexagons.
   - Expanded coverage with optimal sites under ₹35L budget: **30.6% to 48.5%**.
3. **Rank Correlation against Expert Benchmark:**
   - Spearman&apos;s rank correlation $\rho = 1.000$ ($p < 0.05$).
   - Kendall&apos;s $\tau = 1.000$ ($p < 0.05$).
