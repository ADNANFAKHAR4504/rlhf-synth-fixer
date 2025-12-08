import * as fs from 'fs';
import { AuditResult, Finding } from './auditor';

export class ReportGenerator {
  constructor(private outputDir: string) {}

  async generateJsonReport(
    result: AuditResult,
    filePath: string
  ): Promise<void> {
    const json = JSON.stringify(result, null, 2);
    fs.writeFileSync(filePath, json);
    console.log(`  JSON report saved: ${filePath}`);
  }

  async generateHtmlReport(
    result: AuditResult,
    filePath: string
  ): Promise<void> {
    const html = this.buildHtmlReport(result);
    fs.writeFileSync(filePath, html);
    console.log(`  HTML report saved: ${filePath}`);
  }

  private buildHtmlReport(result: AuditResult): string {
    const findingsBySeverity = this.groupBySeverity(result.findings);
    const findingsByService = this.groupByService(result.findings);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AWS Security Audit Report</title>
    <style>
        ${this.getStyles()}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>AWS Infrastructure Security Audit Report</h1>
            <div class="meta">
                <p><strong>Environment:</strong> ${result.environment}</p>
                <p><strong>Region:</strong> ${result.region}</p>
                <p><strong>Timestamp:</strong> ${new Date(result.timestamp).toLocaleString()}</p>
            </div>
        </header>

        <section class="dashboard">
            <h2>Executive Summary</h2>
            <div class="metrics">
                <div class="metric">
                    <div class="metric-value">${result.summary.totalResources}</div>
                    <div class="metric-label">Resources Scanned</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${result.summary.totalFindings}</div>
                    <div class="metric-label">Total Findings</div>
                </div>
                <div class="metric ${this.getScoreClass(result.summary.complianceScore)}">
                    <div class="metric-value">${result.summary.complianceScore}/100</div>
                    <div class="metric-label">Compliance Score</div>
                </div>
            </div>

            <div class="severity-chart">
                <h3>Findings by Severity</h3>
                <div class="severity-bars">
                    <div class="severity-bar critical">
                        <span class="label">Critical</span>
                        <div class="bar" style="width: ${this.getBarWidth(result.summary.bySeverity.critical, result.summary.totalFindings)}">
                            ${result.summary.bySeverity.critical}
                        </div>
                    </div>
                    <div class="severity-bar high">
                        <span class="label">High</span>
                        <div class="bar" style="width: ${this.getBarWidth(result.summary.bySeverity.high, result.summary.totalFindings)}">
                            ${result.summary.bySeverity.high}
                        </div>
                    </div>
                    <div class="severity-bar medium">
                        <span class="label">Medium</span>
                        <div class="bar" style="width: ${this.getBarWidth(result.summary.bySeverity.medium, result.summary.totalFindings)}">
                            ${result.summary.bySeverity.medium}
                        </div>
                    </div>
                    <div class="severity-bar low">
                        <span class="label">Low</span>
                        <div class="bar" style="width: ${this.getBarWidth(result.summary.bySeverity.low, result.summary.totalFindings)}">
                            ${result.summary.bySeverity.low}
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="findings">
            <h2>Detailed Findings</h2>
            ${this.renderFindingsBySeverity(findingsBySeverity)}
        </section>

        <section class="service-breakdown">
            <h2>Findings by Service</h2>
            ${this.renderServiceBreakdown(findingsByService)}
        </section>
    </div>
</body>
</html>`;
  }

  private getStyles(): string {
    return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        header {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }

        header h1 {
            color: #232F3E;
            margin-bottom: 15px;
        }

        .meta {
            display: flex;
            gap: 30px;
            color: #666;
        }

        .dashboard {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }

        .metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }

        .metric {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border: 2px solid #e9ecef;
        }

        .metric-value {
            font-size: 36px;
            font-weight: bold;
            color: #232F3E;
        }

        .metric-label {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
        }

        .metric.excellent {
            border-color: #28a745;
            background: #d4edda;
        }

        .metric.good {
            border-color: #17a2b8;
            background: #d1ecf1;
        }

        .metric.fair {
            border-color: #ffc107;
            background: #fff3cd;
        }

        .metric.poor {
            border-color: #dc3545;
            background: #f8d7da;
        }

        .severity-chart {
            margin-top: 30px;
        }

        .severity-bars {
            margin-top: 15px;
        }

        .severity-bar {
            margin-bottom: 15px;
        }

        .severity-bar .label {
            display: inline-block;
            width: 100px;
            font-weight: bold;
        }

        .severity-bar .bar {
            display: inline-block;
            min-width: 40px;
            padding: 8px 12px;
            border-radius: 4px;
            color: white;
            text-align: center;
            font-weight: bold;
        }

        .severity-bar.critical .bar {
            background: #dc3545;
        }

        .severity-bar.high .bar {
            background: #fd7e14;
        }

        .severity-bar.medium .bar {
            background: #ffc107;
            color: #333;
        }

        .severity-bar.low .bar {
            background: #17a2b8;
        }

        .findings, .service-breakdown {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }

        .finding {
            border-left: 4px solid #ccc;
            padding: 15px;
            margin-bottom: 15px;
            background: #f8f9fa;
            border-radius: 4px;
        }

        .finding.critical {
            border-left-color: #dc3545;
        }

        .finding.high {
            border-left-color: #fd7e14;
        }

        .finding.medium {
            border-left-color: #ffc107;
        }

        .finding.low {
            border-left-color: #17a2b8;
        }

        .finding-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }

        .finding-title {
            font-weight: bold;
            font-size: 16px;
        }

        .severity-badge {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            color: white;
        }

        .severity-badge.critical {
            background: #dc3545;
        }

        .severity-badge.high {
            background: #fd7e14;
        }

        .severity-badge.medium {
            background: #ffc107;
            color: #333;
        }

        .severity-badge.low {
            background: #17a2b8;
        }

        .finding-details {
            margin: 10px 0;
        }

        .finding-details p {
            margin-bottom: 8px;
        }

        .finding-details strong {
            color: #232F3E;
        }

        .remediation-code {
            background: #f4f4f4;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 10px;
            margin-top: 10px;
            overflow-x: auto;
        }

        .remediation-code pre {
            margin: 0;
            font-family: 'Courier New', monospace;
            font-size: 13px;
        }

        .aws-link {
            color: #0066cc;
            text-decoration: none;
            font-size: 14px;
        }

        .aws-link:hover {
            text-decoration: underline;
        }

        .service-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }

        .service-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            border-left: 4px solid #007bff;
        }

        .service-item strong {
            display: block;
            margin-bottom: 5px;
        }

        h2 {
            color: #232F3E;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e9ecef;
        }

        h3 {
            color: #232F3E;
            margin: 20px 0 15px 0;
        }
    `;
  }

  private getScoreClass(score: number): string {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }

  private getBarWidth(count: number, total: number): string {
    if (total === 0) return '0%';
    const percent = (count / total) * 100;
    return `${Math.max(5, percent)}%`;
  }

  private groupBySeverity(findings: Finding[]): Record<string, Finding[]> {
    const grouped: Record<string, Finding[]> = {
      Critical: [],
      High: [],
      Medium: [],
      Low: [],
    };

    for (const finding of findings) {
      grouped[finding.severity].push(finding);
    }

    return grouped;
  }

  private groupByService(findings: Finding[]): Record<string, number> {
    const grouped: Record<string, number> = {};

    for (const finding of findings) {
      grouped[finding.category] = (grouped[finding.category] || 0) + 1;
    }

    return grouped;
  }

  private renderFindingsBySeverity(grouped: Record<string, Finding[]>): string {
    const severities = ['Critical', 'High', 'Medium', 'Low'];
    let html = '';

    for (const severity of severities) {
      const findings = grouped[severity];
      if (findings.length === 0) continue;

      html += `<h3>${severity} Severity (${findings.length})</h3>`;

      for (const finding of findings) {
        html += this.renderFinding(finding);
      }
    }

    return html;
  }

  private renderFinding(finding: Finding): string {
    return `
        <div class="finding ${finding.severity.toLowerCase()}">
            <div class="finding-header">
                <div class="finding-title">${finding.resourceName}</div>
                <span class="severity-badge ${finding.severity.toLowerCase()}">${finding.severity}</span>
            </div>
            <div class="finding-details">
                <p><strong>Resource Type:</strong> ${finding.resourceType}</p>
                <p><strong>Category:</strong> ${finding.category}</p>
                <p><strong>Description:</strong> ${finding.description}</p>
                <p><strong>Remediation:</strong> ${finding.remediation}</p>
                ${finding.awsDocLink ? `<p><a href="${finding.awsDocLink}" class="aws-link" target="_blank">AWS Documentation →</a></p>` : ''}
                ${
                  finding.remediationCode
                    ? `
                    <div class="remediation-code">
                        <strong>Remediation Code:</strong>
                        <pre>${this.escapeHtml(finding.remediationCode)}</pre>
                    </div>
                `
                    : ''
                }
            </div>
        </div>
    `;
  }

  private renderServiceBreakdown(services: Record<string, number>): string {
    let html = '<div class="service-list">';

    for (const [service, count] of Object.entries(services)) {
      html += `
        <div class="service-item">
            <strong>${service}</strong>
            <div>${count} finding(s)</div>
        </div>
      `;
    }

    html += '</div>';
    return html;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
