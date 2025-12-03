/**
 * Report Generator for Compliance and Inventory
 *
 * Generates comprehensive reports in JSON and optionally other formats.
 */

import {
  ComplianceReport,
  ResourceInventory,
  ViolationSeverity,
  ComplianceStatus,
} from './types';

/**
 * Report format options
 */
export enum ReportFormat {
  JSON = 'json',
  HTML = 'html',
  TEXT = 'text',
}

/**
 * Report Generator class
 */
export class ReportGenerator {
  /**
   * Generate compliance report in specified format
   */
  generateComplianceReport(
    report: ComplianceReport,
    format: ReportFormat = ReportFormat.JSON
  ): string {
    switch (format) {
      case ReportFormat.JSON:
        return this.generateComplianceJSON(report);
      case ReportFormat.TEXT:
        return this.generateComplianceText(report);
      case ReportFormat.HTML:
        return this.generateComplianceHTML(report);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Generate inventory report in specified format
   */
  generateInventoryReport(
    inventory: ResourceInventory,
    format: ReportFormat = ReportFormat.JSON
  ): string {
    switch (format) {
      case ReportFormat.JSON:
        return this.generateInventoryJSON(inventory);
      case ReportFormat.TEXT:
        return this.generateInventoryText(inventory);
      case ReportFormat.HTML:
        return this.generateInventoryHTML(inventory);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Generate compliance report as JSON
   */
  private generateComplianceJSON(report: ComplianceReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Generate compliance report as human-readable text
   */
  private generateComplianceText(report: ComplianceReport): string {
    const lines: string[] = [];

    lines.push('='.repeat(80));
    lines.push('COMPLIANCE REPORT');
    lines.push('='.repeat(80));
    lines.push('');
    lines.push(`Report ID: ${report.reportId}`);
    lines.push(`Generated: ${report.generatedAt.toISOString()}`);
    lines.push('');

    lines.push('SUMMARY');
    lines.push('-'.repeat(80));
    lines.push(`Total Resources: ${report.totalResources}`);
    lines.push(`Compliant Resources: ${report.compliantResources}`);
    lines.push(`Non-Compliant Resources: ${report.nonCompliantResources}`);
    lines.push(`Compliance Score: ${report.complianceScore.toFixed(2)}%`);
    lines.push('');

    lines.push('VIOLATIONS BY SEVERITY');
    lines.push('-'.repeat(80));
    lines.push(`Critical: ${report.summary.criticalViolations}`);
    lines.push(`High: ${report.summary.highViolations}`);
    lines.push(`Medium: ${report.summary.mediumViolations}`);
    lines.push(`Low: ${report.summary.lowViolations}`);
    lines.push('');

    lines.push('RESOURCES BY TYPE');
    lines.push('-'.repeat(80));
    for (const [type, count] of Object.entries(report.resourcesByType)) {
      lines.push(`${type}: ${count}`);
    }
    lines.push('');

    // Non-compliant resources details
    const nonCompliantResults = report.results.filter(
      r => r.status === ComplianceStatus.NON_COMPLIANT
    );

    if (nonCompliantResults.length > 0) {
      lines.push('NON-COMPLIANT RESOURCES');
      lines.push('-'.repeat(80));

      for (const result of nonCompliantResults) {
        lines.push('');
        lines.push(`Resource: ${result.resourceId}`);
        lines.push(`Type: ${result.resourceType}`);
        lines.push(`ARN: ${result.resourceArn}`);
        lines.push('Violations:');

        for (const violation of result.violations) {
          lines.push(`  - [${violation.severity}] ${violation.rule}`);
          lines.push(`    ${violation.description}`);
          lines.push(`    Recommendation: ${violation.recommendation}`);
        }
      }
    }

    lines.push('');
    lines.push('='.repeat(80));
    lines.push('END OF REPORT');
    lines.push('='.repeat(80));

    return lines.join('\n');
  }

  /**
   * Generate compliance report as HTML
   */
  private generateComplianceHTML(report: ComplianceReport): string {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Compliance Report - ${report.reportId}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 30px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
    .metric { background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; }
    .metric-value { font-size: 2em; font-weight: bold; color: #007bff; }
    .metric-label { color: #666; margin-top: 5px; }
    .severity-critical { color: #dc3545; }
    .severity-high { color: #fd7e14; }
    .severity-medium { color: #ffc107; }
    .severity-low { color: #28a745; }
    .violation { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 10px 0; }
    .violation-critical { background: #f8d7da; border-color: #dc3545; }
    .violation-high { background: #fff3cd; border-color: #fd7e14; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #007bff; color: white; }
    tr:hover { background: #f5f5f5; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Compliance Report</h1>
    <p><strong>Report ID:</strong> ${report.reportId}</p>
    <p><strong>Generated:</strong> ${report.generatedAt.toISOString()}</p>

    <div class="summary">
      <div class="metric">
        <div class="metric-value">${report.totalResources}</div>
        <div class="metric-label">Total Resources</div>
      </div>
      <div class="metric">
        <div class="metric-value">${report.compliantResources}</div>
        <div class="metric-label">Compliant</div>
      </div>
      <div class="metric">
        <div class="metric-value">${report.nonCompliantResources}</div>
        <div class="metric-label">Non-Compliant</div>
      </div>
      <div class="metric">
        <div class="metric-value">${report.complianceScore.toFixed(1)}%</div>
        <div class="metric-label">Compliance Score</div>
      </div>
    </div>

    <h2>Violations by Severity</h2>
    <table>
      <tr>
        <th>Severity</th>
        <th>Count</th>
      </tr>
      <tr>
        <td class="severity-critical">Critical</td>
        <td>${report.summary.criticalViolations}</td>
      </tr>
      <tr>
        <td class="severity-high">High</td>
        <td>${report.summary.highViolations}</td>
      </tr>
      <tr>
        <td class="severity-medium">Medium</td>
        <td>${report.summary.mediumViolations}</td>
      </tr>
      <tr>
        <td class="severity-low">Low</td>
        <td>${report.summary.lowViolations}</td>
      </tr>
    </table>

    <h2>Resources by Type</h2>
    <table>
      <tr>
        <th>Resource Type</th>
        <th>Count</th>
      </tr>
      ${Object.entries(report.resourcesByType)
        .map(
          ([type, count]) => `
      <tr>
        <td>${type}</td>
        <td>${count}</td>
      </tr>
      `
        )
        .join('')}
    </table>

    <h2>Non-Compliant Resources</h2>
    ${report.results
      .filter(r => r.status === ComplianceStatus.NON_COMPLIANT)
      .map(
        result => `
    <div class="violation ${result.violations.some(v => v.severity === ViolationSeverity.CRITICAL) ? 'violation-critical' : result.violations.some(v => v.severity === ViolationSeverity.HIGH) ? 'violation-high' : ''}">
      <h3>${result.resourceId}</h3>
      <p><strong>Type:</strong> ${result.resourceType}</p>
      <p><strong>ARN:</strong> ${result.resourceArn}</p>
      <ul>
        ${result.violations
          .map(
            v => `
        <li>
          <strong class="severity-${v.severity.toLowerCase()}">[${v.severity}]</strong> ${v.rule}: ${v.description}
          <br><em>Recommendation: ${v.recommendation}</em>
        </li>
        `
          )
          .join('')}
      </ul>
    </div>
    `
      )
      .join('')}
  </div>
</body>
</html>
    `;

    return html.trim();
  }

  /**
   * Generate inventory report as JSON
   */
  private generateInventoryJSON(inventory: ResourceInventory): string {
    return JSON.stringify(inventory, null, 2);
  }

  /**
   * Generate inventory report as text
   */
  private generateInventoryText(inventory: ResourceInventory): string {
    const lines: string[] = [];

    lines.push('='.repeat(80));
    lines.push('RESOURCE INVENTORY');
    lines.push('='.repeat(80));
    lines.push('');
    lines.push(`Inventory ID: ${inventory.inventoryId}`);
    lines.push(`Generated: ${inventory.generatedAt.toISOString()}`);
    lines.push(`Total Resources: ${inventory.totalResources}`);
    lines.push('');

    lines.push('RESOURCES BY REGION');
    lines.push('-'.repeat(80));
    for (const [region, count] of Object.entries(inventory.resourcesByRegion)) {
      lines.push(`${region}: ${count}`);
    }
    lines.push('');

    lines.push('RESOURCES BY TYPE');
    lines.push('-'.repeat(80));
    for (const [type, count] of Object.entries(inventory.resourcesByType)) {
      lines.push(`${type}: ${count}`);
    }
    lines.push('');

    // Orphaned resources
    const orphanedResources = inventory.entries.filter(e => e.isOrphaned);
    if (orphanedResources.length > 0) {
      lines.push('ORPHANED RESOURCES');
      lines.push('-'.repeat(80));
      for (const entry of orphanedResources) {
        lines.push(
          `${entry.resource.id} (${entry.resource.type}) - Age: ${entry.ageInDays} days`
        );
      }
      lines.push('');
    }

    lines.push('='.repeat(80));
    lines.push('END OF INVENTORY');
    lines.push('='.repeat(80));

    return lines.join('\n');
  }

  /**
   * Generate inventory report as HTML
   */
  private generateInventoryHTML(inventory: ResourceInventory): string {
    const orphanedResources = inventory.entries.filter(e => e.isOrphaned);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Resource Inventory - ${inventory.inventoryId}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    h1 { color: #333; border-bottom: 2px solid #28a745; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 30px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
    .metric { background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; }
    .metric-value { font-size: 2em; font-weight: bold; color: #28a745; }
    .metric-label { color: #666; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #28a745; color: white; }
    tr:hover { background: #f5f5f5; }
    .orphaned { background: #fff3cd; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Resource Inventory</h1>
    <p><strong>Inventory ID:</strong> ${inventory.inventoryId}</p>
    <p><strong>Generated:</strong> ${inventory.generatedAt.toISOString()}</p>

    <div class="summary">
      <div class="metric">
        <div class="metric-value">${inventory.totalResources}</div>
        <div class="metric-label">Total Resources</div>
      </div>
      <div class="metric">
        <div class="metric-value">${Object.keys(inventory.resourcesByRegion).length}</div>
        <div class="metric-label">Regions</div>
      </div>
      <div class="metric">
        <div class="metric-value">${Object.keys(inventory.resourcesByType).length}</div>
        <div class="metric-label">Resource Types</div>
      </div>
      <div class="metric">
        <div class="metric-value">${orphanedResources.length}</div>
        <div class="metric-label">Orphaned Resources</div>
      </div>
    </div>

    <h2>Resources by Region</h2>
    <table>
      <tr>
        <th>Region</th>
        <th>Count</th>
      </tr>
      ${Object.entries(inventory.resourcesByRegion)
        .map(
          ([region, count]) => `
      <tr>
        <td>${region}</td>
        <td>${count}</td>
      </tr>
      `
        )
        .join('')}
    </table>

    <h2>Resources by Type</h2>
    <table>
      <tr>
        <th>Type</th>
        <th>Count</th>
      </tr>
      ${Object.entries(inventory.resourcesByType)
        .map(
          ([type, count]) => `
      <tr>
        <td>${type}</td>
        <td>${count}</td>
      </tr>
      `
        )
        .join('')}
    </table>

    ${
      orphanedResources.length > 0
        ? `
    <h2>Orphaned Resources</h2>
    <table>
      <tr>
        <th>Resource ID</th>
        <th>Type</th>
        <th>Region</th>
        <th>Age (Days)</th>
        <th>Compliance Status</th>
      </tr>
      ${orphanedResources
        .map(
          entry => `
      <tr class="orphaned">
        <td>${entry.resource.id}</td>
        <td>${entry.resource.type}</td>
        <td>${entry.resource.region}</td>
        <td>${entry.ageInDays}</td>
        <td>${entry.complianceStatus}</td>
      </tr>
      `
        )
        .join('')}
    </table>
    `
        : ''
    }
  </div>
</body>
</html>
    `;

    return html.trim();
  }

  /**
   * Generate executive summary for quick overview
   */
  generateExecutiveSummary(report: ComplianceReport): string {
    const lines: string[] = [];

    lines.push('EXECUTIVE SUMMARY');
    lines.push('='.repeat(50));
    lines.push('');
    lines.push(`Compliance Score: ${report.complianceScore.toFixed(2)}%`);
    lines.push(`Total Resources Scanned: ${report.totalResources}`);
    lines.push('');

    lines.push('Key Findings:');
    if (report.summary.criticalViolations > 0) {
      lines.push(
        `  - ${report.summary.criticalViolations} CRITICAL violations require immediate attention`
      );
    }
    if (report.summary.highViolations > 0) {
      lines.push(
        `  - ${report.summary.highViolations} HIGH severity violations`
      );
    }
    if (report.nonCompliantResources === 0) {
      lines.push('  - All resources are compliant!');
    }
    lines.push('');

    lines.push('Recommended Actions:');
    if (report.summary.criticalViolations > 0) {
      lines.push('  1. Address all CRITICAL violations immediately');
    }
    if (report.summary.highViolations > 0) {
      lines.push('  2. Prioritize HIGH severity violations');
    }
    lines.push('  3. Review full report for detailed recommendations');
    lines.push('');

    return lines.join('\n');
  }
}
