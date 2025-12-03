#!/usr/bin/env ts-node

import { ComplianceScanner } from './lambda/compliance-scanner';
import * as fs from 'fs';

async function main() {
  console.log('=== AWS Infrastructure Compliance Analysis ===\n');

  // Configuration from environment
  const region = process.env.AWS_REGION || 'us-east-1';
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';
  const approvedAmisStr =
    process.env.APPROVED_AMIS ||
    JSON.stringify(['ami-0c55b159cbfafe1f0', 'ami-0574da719dca65348']);

  const approvedAmis = JSON.parse(approvedAmisStr);

  console.log(`Region: ${region}`);
  console.log(`Environment Suffix: ${environmentSuffix}`);
  console.log(`Approved AMIs: ${approvedAmis.join(', ')}\n`);

  // Create scanner instance
  const scanner = new ComplianceScanner(
    region,
    environmentSuffix,
    approvedAmis
  );

  try {
    // Run all compliance checks
    const report = await scanner.runAllChecks();

    // Display report summary
    console.log('\n=== Compliance Scan Results ===\n');
    console.log(`Scan Timestamp: ${report.scanTimestamp}`);
    console.log(`Region: ${report.region}`);
    console.log(`Environment: ${report.environmentSuffix}\n`);

    console.log('Summary:');
    console.log(
      `  Total Resources Scanned: ${report.summary.totalResourcesScanned}`
    );
    console.log(`  Total Violations: ${report.summary.totalViolations}`);
    console.log(`  Compliance Rate: ${report.summary.complianceRate}%\n`);

    if (Object.keys(report.summary.violationsByType).length > 0) {
      console.log('Violations by Type:');
      for (const [type, count] of Object.entries(
        report.summary.violationsByType
      )) {
        console.log(`  ${type}: ${count}`);
      }
      console.log('');
    }

    // Display detailed violations
    if (report.violations.length > 0) {
      console.log('Detailed Violations:\n');
      for (const violation of report.violations) {
        console.log(`[${violation.severity}] ${violation.violationType}`);
        console.log(
          `  Resource: ${violation.resourceType} - ${violation.resourceId}`
        );
        console.log(`  Details: ${violation.details}`);
        console.log(`  Timestamp: ${violation.timestamp}\n`);
      }
    } else {
      console.log('No violations found! Infrastructure is compliant.\n');
    }

    // Save report to file
    const reportPath = './compliance-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Full report saved to: ${reportPath}\n`);

    // Exit with appropriate code
    if (report.violations.length > 0) {
      console.log('⚠️ Analysis completed with violations found.');
      process.exit(0); // Exit 0 because finding violations is expected behavior
    } else {
      console.log('✅ Analysis completed successfully with no violations.');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error during compliance scan:', error);
    process.exit(1);
  }
}

// Run the analysis
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
