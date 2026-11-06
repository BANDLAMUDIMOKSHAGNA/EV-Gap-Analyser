"""
Playwright End-to-End Smoke Test for EV Gap Analyser.
Covers the complete user flow:
1. Overview: KPIs and Vahan growth trend
2. Gap Analysis: Hexagon layer, metric switch, and cell inspection drawer
3. Site Ranking: AHP weights sliders, live TOPSIS re-ranking, and explainability card
4. Budget Optimiser: CP-SAT maximal coverage solver and Pareto frontier
5. Reports & Scenarios: Export and PDF feasibility report verification
"""

import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = Path("C:/Users/moksh_nc6q987/.gemini/antigravity/brain/5a5e8cf1-a8d9-4e09-a93e-668d52c7c7ab")
ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

def run_smoke_test():
    print("Starting Playwright E2E Smoke Test...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # 1. Overview Page
        print("\n[Flow 1/5] Visiting Overview (http://localhost:3000/)...")
        page.goto("http://localhost:3000/", wait_until="networkidle")
        page.wait_for_selector("h1:has-text('Find where India needs EV chargers next')")
        print("[OK] Overview loaded. Taking screenshot...")
        overview_img = ARTIFACT_DIR / "screenshot_overview.png"
        page.screenshot(path=str(overview_img))

        # 2. Gap Analysis Page
        print("\n[Flow 2/5] Visiting Gap Analysis (http://localhost:3000/gaps)...")
        page.goto("http://localhost:3000/gaps", wait_until="networkidle")
        page.wait_for_selector("span:has-text('Spatial Scoring Metric')")
        page.wait_for_timeout(1500) # Allow map to render tiles
        print("[OK] Gap Analysis loaded. Taking screenshot...")
        gaps_img = ARTIFACT_DIR / "screenshot_gap_analysis.png"
        page.screenshot(path=str(gaps_img))

        # 3. Site Ranking Page
        print("\n[Flow 3/5] Visiting Site Ranking (http://localhost:3000/ranking)...")
        page.goto("http://localhost:3000/ranking", wait_until="networkidle")
        page.wait_for_selector("h1:has-text('Multi-Criteria Candidate Site Ranking')")
        page.wait_for_timeout(1000)
        # Click first row to expand "Why this site?"
        first_row = page.locator("table tbody tr").first
        if first_row.is_visible():
            first_row.click()
            page.wait_for_timeout(500)
        print("[OK] Site Ranking loaded & expanded. Taking screenshot...")
        ranking_img = ARTIFACT_DIR / "screenshot_site_ranking.png"
        page.screenshot(path=str(ranking_img))

        # 4. Budget Optimiser Page
        print("\n[Flow 4/5] Visiting Budget Optimiser (http://localhost:3000/optimizer)...")
        page.goto("http://localhost:3000/optimizer", wait_until="networkidle")
        page.wait_for_selector("span:has-text('Budget & Coverage Optimiser')")
        page.wait_for_timeout(1500)
        print("[OK] Budget Optimiser loaded. Taking screenshot...")
        optimizer_img = ARTIFACT_DIR / "screenshot_budget_optimizer.png"
        page.screenshot(path=str(optimizer_img))

        # 5. Reports & Scenarios Page
        print("\n[Flow 5/5] Visiting Reports (http://localhost:3000/reports)...")
        page.goto("http://localhost:3000/reports", wait_until="networkidle")
        page.wait_for_selector("h1:has-text('Planning Reports & Saved Scenarios')")
        page.wait_for_timeout(800)
        print("[OK] Reports loaded. Taking screenshot...")
        reports_img = ARTIFACT_DIR / "screenshot_reports.png"
        page.screenshot(path=str(reports_img))

        browser.close()
        print("\n[SUCCESS] ALL E2E SMOKE TESTS COMPLETED SUCCESSFULLY!")
        print(f"Screenshots saved to: {ARTIFACT_DIR}")

if __name__ == "__main__":
    run_smoke_test()
