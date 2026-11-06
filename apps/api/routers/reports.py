import io
import csv
import json
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from apps.api.database import get_db
from apps.api.models import CandidateSite, AnalysisRun, H3Cell, CellScore, Dataset
from apps.api.config import settings
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

router = APIRouter(tags=["Reports & Exports"])

def _lookup_site(db: Session, site_id: str):
    site = db.query(CandidateSite).filter(CandidateSite.id == site_id).first()
    if not site and site_id.isdigit():
        site = db.query(CandidateSite).filter(CandidateSite.rank == int(site_id)).first()
    if not site:
        site = db.query(CandidateSite).filter(CandidateSite.id.like(f"%_{site_id}")).first()
    return site

@router.get("/sites/{site_id}/report")
def get_site_report_json(site_id: str, db: Session = Depends(get_db)):
    site = _lookup_site(db, site_id)
    if not site:
        raise HTTPException(status_code=404, detail=f"Candidate site '{site_id}' not found")

    datasets = db.query(Dataset).all()

    return {
        "site_id": site.id,
        "name": site.name,
        "zone": site.zone,
        "coordinates": {"lat": site.lat, "lon": site.lon},
        "topsis_score": site.topsis_score,
        "rank": site.rank,
        "financials": {
            "est_daily_sessions": site.est_daily_sessions,
            "est_cost_inr": site.est_cost_inr,
            "payback_years": site.payback_years,
            "annual_revenue_projection_inr": round(site.est_daily_sessions * 365 * (28.0 * 9.30 + 50.0), 0),
            "assumptions": "Configured in config/financials.yaml: ₹16.50/kWh tariff, ₹7.20/kWh APERC power, 8% annual O&M"
        },
        "criteria_breakdown": site.criteria_breakdown,
        "datasets_provenance": [
            {"id": d.id, "name": d.name, "source": d.source, "retrieved_at": d.retrieved_at, "licence": d.licence}
            for d in datasets
        ]
    }

@router.get("/sites/{site_id}/report.pdf")
def get_site_report_pdf(site_id: str, db: Session = Depends(get_db)):
    site = _lookup_site(db, site_id)
    if not site:
        raise HTTPException(status_code=404, detail=f"Candidate site '{site_id}' not found")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'ReportTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0B6B50"),
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'ReportSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#475569"),
        spaceAfter=14
    )
    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=10,
        spaceAfter=6
    )

    story = []

    # Title & Header
    story.append(Paragraph("EV Charging Site Feasibility Report", title_style))
    story.append(Paragraph(f"<b>Pilot City:</b> Visakhapatnam (Vizag), AP | <b>Site:</b> {site.name}", subtitle_style))
    story.append(Spacer(1, 8))

    # Executive Summary Table
    summary_data = [
        ["Attribute", "Specification / Assessment"],
        ["Candidate Site ID", site.id],
        ["Geographic Coordinates", f"{site.lat:.6f}°N, {site.lon:.6f}°E"],
        ["Urban Zone / Land Use", site.zone or "Commercial High Traffic"],
        ["Overall TOPSIS Score", f"{site.topsis_score} / 100 (Rank #{site.rank})"],
        ["Estimated Daily Sessions", f"{site.est_daily_sessions:.1f} sessions/day"],
        ["Total Estimated CapEx", f"INR {site.est_cost_inr:,.0f} (₹{site.est_cost_inr/100000:.2f} Lakh)"],
        ["Projected Payback Timeline", f"{site.payback_years} Years (Simple Payback)"]
    ]

    t_summary = Table(summary_data, colWidths=[180, 360])
    t_summary.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0F9D74")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#F8FAFC")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
    ]))
    story.append(t_summary)
    story.append(Spacer(1, 14))

    # Multi-Criteria Explainability Breakdown
    story.append(Paragraph("Multi-Criteria Score Contributions (Why this site?)", heading_style))
    breakdown_data = [["Criterion", "Relative Positive Weight / Contribution"]]
    for k, v in (site.criteria_breakdown or {}).items():
        breakdown_data.append([k.replace("_", " ").title(), f"{v}%"])

    t_breakdown = Table(breakdown_data, colWidths=[270, 270])
    t_breakdown.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1E293B")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
    ]))
    story.append(t_breakdown)
    story.append(Spacer(1, 14))

    # Provenance and Disclaimers
    story.append(Paragraph("Data Traceability & Legal Disclaimer", heading_style))
    disclaimer_text = (
        "<b>DATA PROVENANCE:</b> OpenStreetMap highway graph (ODbL), BEE Public Charger Registry (GODL), "
        "and Vahan Dashboard EV statistics. Mode: <b>DEMO / CALIBRATED PROXY</b>. "
        "Financial figures are decision-support estimates and subject to ground geotechnical, transformer headroom, "
        "and final commercial lease negotiations with GVMC."
    )
    story.append(Paragraph(disclaimer_text, styles['Normal']))

    doc.build(story)
    buffer.seek(0)

    filename = f"feasibility_report_{site.id}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/export/{run_id}")
def export_run_data(
    run_id: str,
    format: str = Query("csv", pattern="^(csv|geojson)$"),
    db: Session = Depends(get_db)
):
    run = db.query(AnalysisRun).filter(AnalysisRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")

    records = (
        db.query(H3Cell, CellScore)
        .join(CellScore, CellScore.cell_id == H3Cell.h3_index)
        .filter(CellScore.run_id == run_id)
        .all()
    )

    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "h3_index", "lat", "lon", "population", "ev_count",
            "gap_score", "demand_score", "supply_score", "feasibility_score",
            "nearest_charger_m", "nearest_charger_min", "chargers_in_reach", "land_use"
        ])
        for cell, sc in records:
            writer.writerow([
                cell.h3_index, cell.lat, cell.lon, cell.population, cell.ev_count,
                sc.gap_score, sc.demand_score, sc.supply_score, sc.feasibility_score,
                sc.nearest_charger_m, sc.nearest_charger_min, sc.chargers_in_reach, cell.land_use
            ])
        output.seek(0)
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=ev_gap_{run_id}.csv"}
        )
    else:
        # GeoJSON export
        import h3
        features = []
        for cell, sc in records:
            raw_pts = h3.cell_to_boundary(cell.h3_index)
            coords = [[round(p[1], 6), round(p[0], 6)] for p in raw_pts]
            if coords and coords[0] != coords[-1]:
                coords.append(coords[0])

            features.append({
                "type": "Feature",
                "geometry": {"type": "Polygon", "coordinates": [coords]},
                "properties": {
                    "h3_index": cell.h3_index,
                    "gap_score": sc.gap_score,
                    "demand_score": sc.demand_score,
                    "supply_score": sc.supply_score,
                    "feasibility_score": sc.feasibility_score,
                    "nearest_charger_m": sc.nearest_charger_m,
                    "population": cell.population,
                    "ev_count": cell.ev_count
                }
            })
        geojson_doc = {
            "type": "FeatureCollection",
            "run_id": run_id,
            "features": features
        }
        return Response(
            content=json.dumps(geojson_doc),
            media_type="application/geo+json",
            headers={"Content-Disposition": f"attachment; filename=ev_gap_{run_id}.geojson"}
        )
