from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse
from app.core.storage import storage

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.get("")
async def list_reports():
    reports = storage.get_reports()
    return [r.model_dump() for r in reports]

@router.get("/{test_id}")
async def get_report(test_id: str):
    report = storage.get_report_by_id(test_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report.model_dump()

@router.get("/{test_id}/html", response_class=HTMLResponse)
async def get_report_html(test_id: str):
    report = storage.get_report_by_id(test_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    rec_items = "".join(f"<li>{r}</li>" for r in report.recommendations)
    status_codes_html = "".join(f"<span class='badge'>{k}: {v}</span>" for k, v in report.status_codes.items()) or "None"

    verdict_color = "#10b981" if report.sla_verdict in ("EXCELLENT", "HEALTHY") else "#f59e0b" if report.sla_verdict == "DEGRADED" else "#ef4444"

    html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Resilience Assessment Report - {report.test_id}</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; margin: 0; }}
    .container {{ max-width: 900px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 32px; border: 1px solid #334155; }}
    .header {{ display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 20px; }}
    .title {{ font-size: 24px; font-weight: bold; color: #38bdf8; margin: 0; }}
    .verdict {{ font-size: 16px; font-weight: bold; padding: 6px 14px; border-radius: 20px; background: {verdict_color}22; color: {verdict_color}; border: 1px solid {verdict_color}; }}
    .grid {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 24px 0; }}
    .card {{ background: #0f172a; padding: 16px; border-radius: 8px; border: 1px solid #334155; }}
    .card .label {{ font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }}
    .card .val {{ font-size: 20px; font-weight: bold; margin-top: 6px; color: #f8fafc; }}
    .section {{ margin-top: 28px; }}
    .section h3 {{ font-size: 16px; color: #38bdf8; border-bottom: 1px solid #334155; padding-bottom: 8px; }}
    ul {{ padding-left: 20px; color: #cbd5e1; line-height: 1.6; }}
    .badge {{ background: #334155; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-right: 6px; }}
    .footer {{ margin-top: 40px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #334155; padding-top: 16px; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1 class="title">Network Resilience Assessment Report</h1>
        <div style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Target: <b>{report.target_host}:{report.target_port}</b> | Protocol: <b>{report.protocol}</b> | Preset: <b>{report.intensity}</b></div>
      </div>
      <div class="verdict">SLA: {report.sla_verdict}</div>
    </div>

    <div class="grid">
      <div class="card"><div class="label">Total Generated Traffic</div><div class="val">{report.total_requests or report.total_packets_sent} Ops</div></div>
      <div class="card"><div class="label">Packet Loss Rate</div><div class="val" style="color: {'#ef4444' if report.packet_loss_pct > 2 else '#10b981'};">{report.packet_loss_pct}%</div></div>
      <div class="card"><div class="label">Peak Throughput</div><div class="val">{report.peak_throughput_kbps} KB/s</div></div>
      <div class="card"><div class="label">Average Latency</div><div class="val">{report.avg_latency_ms} ms</div></div>
      <div class="card"><div class="label">P95 Tail Latency</div><div class="val">{report.p95_latency_ms} ms</div></div>
      <div class="card"><div class="label">P99 Tail Latency</div><div class="val">{report.p99_latency_ms} ms</div></div>
      <div class="card"><div class="label">Average Jitter</div><div class="val">{report.avg_jitter_ms} ms</div></div>
      <div class="card"><div class="label">Duration</div><div class="val">{report.duration_sec} s</div></div>
      <div class="card"><div class="label">Status</div><div class="val">{report.status}</div></div>
    </div>

    <div class="section">
      <h3>HTTP Status Code Breakdown</h3>
      <div>{status_codes_html}</div>
    </div>

    <div class="section">
      <h3>Resilience Engineering Findings & Recommendations</h3>
      <ul>{rec_items}</ul>
    </div>

    <div class="footer">
      Generated automatically by Antigravity Network Load Testing Platform &bull; Test ID: {report.test_id} &bull; Timestamp: {report.finished_at}
    </div>
  </div>
</body>
</html>"""
    return HTMLResponse(content=html)
