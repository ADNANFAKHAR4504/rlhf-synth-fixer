import { LocalWorkspace } from '@pulumi/pulumi/automation';
import { SecurityAuditor, AuditResult } from './auditor';
import { ReportGenerator } from './report-generator';
import * as path from 'path';
import * as fs from 'fs';

interface AuditOptions {
  environmentSuffix?: string;
  awsRegion?: string;
  stackNames?: string[];
  outputDir?: string;
  dryRun?: boolean;
}

async function main() {
  const options: AuditOptions = {
    environmentSuffix: process.env.ENVIRONMENT_SUFFIX || 'dev',
    awsRegion: process.env.AWS_REGION || 'us-east-1',
    outputDir: process.env.OUTPUT_DIR || './reports',
    dryRun: process.env.DRY_RUN === 'true',
  };

  console.log('='.repeat(60));
  console.log('AWS Infrastructure Security Audit Tool');
  console.log('='.repeat(60));
  console.log(`Environment: ${options.environmentSuffix}`);
  console.log(`Region: ${options.awsRegion}`);
  console.log(`Dry Run: ${options.dryRun}`);
  console.log('='.repeat(60));

  try {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(options.outputDir!)) {
      fs.mkdirSync(options.outputDir!, { recursive: true });
    }

    // Initialize the security auditor
    const auditor = new SecurityAuditor(
      options.awsRegion!,
      options.environmentSuffix!
    );

    // Discover Pulumi stacks
    console.log('\nDiscovering Pulumi stacks...');
    const stacks = await discoverStacks();
    console.log(`Found ${stacks.length} stack(s): ${stacks.join(', ')}`);

    // Analyze all stacks
    console.log('\nAnalyzing infrastructure...');
    const startTime = Date.now();

    const findings = await auditor.analyzeStacks(stacks);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.log(`\nAnalysis completed in ${duration} seconds`);

    // Generate reports
    console.log('\nGenerating reports...');
    const reportGen = new ReportGenerator(options.outputDir!);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    const jsonReportPath = path.join(
      options.outputDir!,
      `security-audit-${timestamp}.json`
    );
    const htmlReportPath = path.join(
      options.outputDir!,
      `security-audit-${timestamp}.html`
    );

    await reportGen.generateJsonReport(findings, jsonReportPath);
    await reportGen.generateHtmlReport(findings, htmlReportPath);

    console.log(`\nJSON Report: ${jsonReportPath}`);
    console.log(`HTML Report: ${htmlReportPath}`);

    // Print summary
    printSummary(findings);
  } catch (error) {
    console.error('Error during audit:', error);
    process.exit(1);
  }
}

async function discoverStacks(): Promise<string[]> {
  const stacks: string[] = [];

  try {
    const ws = await LocalWorkspace.create({});
    const stackSummaries = await ws.listStacks();

    for (const summary of stackSummaries) {
      stacks.push(summary.name);
    }
  } catch (error) {
    console.warn('Error discovering stacks:', error);
  }

  return stacks;
}

function printSummary(findings: AuditResult) {
  console.log('\n' + '='.repeat(60));
  console.log('AUDIT SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Resources Scanned: ${findings.summary.totalResources}`);
  console.log(`Total Findings: ${findings.summary.totalFindings}`);
  console.log(`Compliance Score: ${findings.summary.complianceScore}/100`);
  console.log('\nFindings by Severity:');
  console.log(`  Critical: ${findings.summary.bySeverity.critical}`);
  console.log(`  High: ${findings.summary.bySeverity.high}`);
  console.log(`  Medium: ${findings.summary.bySeverity.medium}`);
  console.log(`  Low: ${findings.summary.bySeverity.low}`);
  console.log('='.repeat(60));
}

main().catch(console.error);
