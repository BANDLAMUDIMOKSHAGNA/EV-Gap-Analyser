# Data Sources & Provenance Registry — EV Gap Analyser

In strict compliance with the **Data Honesty Rules**, this registry provides full provenance, retrieval dates, licensing terms, and imputation methodologies for all data layers in the system.

---

## 1. Datasets Table

| Dataset ID | Name | Source Authority | Official Portal URL | Retrieved | License | Mode |
|---|---|---|---|---|---|---|
| `ds_bee_chargers` | BEE EV Public Charging Station Database | Bureau of Energy Efficiency (BEE), Ministry of Power | https://beeindia.gov.in/en/programmes/e-mobility | Oct 2024 | GODL (Govt. Open Data License) | Sample/Demo |
| `ds_osm_features` | OSM Highway & Urban POI Graph | OpenStreetMap Contributors | https://www.openstreetmap.org | Nov 2024 | ODbL (Open Database License) | Sample/Demo |
| `ds_vahan_registrations` | Vahan EV Registration Statistics | Ministry of Road Transport and Highways (MoRTH) | https://vahan.parivahan.gov.in/vahan4dashboard/ | Oct 2024 | Public Domain / MoRTH | Sample/Demo |
| `ds_worldpop_census` | Census & WorldPop 100m Population | Census of India / WorldPop Group | https://www.worldpop.org | Sep 2024 | CC BY 4.0 | Sample/Demo |
| `ds_grid_substations` | APEPDCL Power Substation Registry | AP Eastern Power Distribution Company | https://www.apeasternpower.com | Oct 2024 | State Utility Public Disclosure | Sample/Demo |

---

## 2. Ingestion & Handling Rules

1. **Synthetic / Demo Data Generation**:
   All bundled demo data is generated deterministically by `pipelines/generate_sample_data.py`. No random or untraceable mock values exist.
2. **Missing Data & Graceful Imputation**:
   - Where exact street coordinates for small shops are absent in OSM, Voronoi centroid interpolation from nearest commercial zones is used and flagged with `accessibility_score = 0.5`.
   - Where transformer headroom is unmetered, a conservative 16 MVA default is assigned.
3. **Data Mode Switch (`DATA_MODE`)**:
   - `DATA_MODE=demo`: Uses bundled sample files in `/data/sample/`. The UI prominently displays an amber &quot;Demo Data&quot; badge in the navigation header and report views.
   - `DATA_MODE=real`: Ingests live OpenStreetMap Overpass extraction and verified CSV files placed in `/data/raw/`.
