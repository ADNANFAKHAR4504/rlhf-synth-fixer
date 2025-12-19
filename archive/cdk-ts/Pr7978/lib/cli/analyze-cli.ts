// eslint-disable-next-line import/no-extraneous-dependencies
import * as yargs from 'yargs';
import * as fs from 'fs';
import { StackComparator } from '../comparator/stack-comparator';
import { ValidationRegistry } from '../core/validation-registry';

export class AnalyzeCLI {
  static run(): void {
    const argv = yargs
      .default(process.argv.slice(2))
      .command(
        'compare <template1> <template2>',
        'Compare two CloudFormation templates',
        (yargs: any) => {
          return yargs
            .positional('template1', {
              describe: 'Path to first template',
              type: 'string',
            })
            .positional('template2', {
              describe: 'Path to second template',
              type: 'string',
            })
            .option('output', {
              alias: 'o',
              describe: 'Output file for comparison report',
              type: 'string',
            });
        }
      )
      .command(
        'validate <reportPath>',
        'Check validation report for issues',
        (yargs: any) => {
          return yargs
            .positional('reportPath', {
              describe: 'Path to validation report JSON',
              type: 'string',
            })
            .option('severity', {
              alias: 's',
              describe: 'Minimum severity level to report',
              choices: ['critical', 'warning', 'info'] as const,
              default: 'warning',
            })
            .option('category', {
              alias: 'c',
              describe: 'Filter by category',
              type: 'string',
            });
        }
      )
      .command(
        'report',
        'Generate validation report from current findings',
        (yargs: any) => {
          return yargs.option('output', {
            alias: 'o',
            describe: 'Output file for report',
            type: 'string',
            default: './validation-report.json',
          });
        }
      )
      .demandCommand(1, 'You must provide a command')
      .help().argv as any;

    const command = argv._[0];

    switch (command) {
      case 'compare':
        this.handleCompare(argv.template1, argv.template2, argv.output);
        break;
      case 'validate':
        this.handleValidate(argv.reportPath, argv.severity, argv.category);
        break;
      case 'report':
        this.handleReport(argv.output);
        break;
    }
  }

  private static handleCompare(
    template1: string,
    template2: string,
    outputPath?: string
  ): void {
    if (!fs.existsSync(template1)) {
      console.error(`Error: Template not found: ${template1}`);
      process.exit(1);
    }
    if (!fs.existsSync(template2)) {
      console.error(`Error: Template not found: ${template2}`);
      process.exit(1);
    }

    const differences = StackComparator.compareTemplates(template1, template2);
    const report = StackComparator.generateReport(differences);

    console.log(report);

    if (outputPath) {
      fs.writeFileSync(outputPath, JSON.stringify(differences, null, 2));
      console.log(`\nDetailed comparison written to: ${outputPath}`);
    }

    process.exit(differences.length > 0 ? 1 : 0);
  }

  private static handleValidate(
    reportPath: string,
    minSeverity: string,
    category?: string
  ): void {
    if (!fs.existsSync(reportPath)) {
      console.error(`Error: Report not found: ${reportPath}`);
      process.exit(1);
    }

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    let findings = report.findings || [];

    // Filter by category if specified
    if (category) {
      findings = findings.filter((f: any) => f.category === category);
    }

    // Filter by severity
    const severityLevels = ['info', 'warning', 'critical'];
    const minLevel = severityLevels.indexOf(minSeverity);
    findings = findings.filter(
      (f: any) => severityLevels.indexOf(f.severity) >= minLevel
    );

    console.log(`\nValidation Report: ${reportPath}`);
    console.log(`Timestamp: ${report.timestamp}`);
    console.log(`Environment: ${report.environmentSuffix}\n`);

    if (findings.length === 0) {
      console.log('No issues found matching the specified criteria');
      process.exit(0);
    }

    console.log(`Found ${findings.length} issue(s):\n`);

    for (const finding of findings) {
      const severityLabel = finding.severity.toUpperCase();
      console.log(`[${severityLabel}] ${finding.category}: ${finding.message}`);
      console.log(`  Resource: ${finding.resource}`);
      console.log(`  Remediation: ${finding.remediation}`);
      console.log('');
    }

    // Exit with error code if critical findings exist
    const criticalCount = findings.filter(
      (f: any) => f.severity === 'critical'
    ).length;
    process.exit(criticalCount > 0 ? 1 : 0);
  }

  private static handleReport(outputPath: string): void {
    const findings = ValidationRegistry.getFindings();
    const summary = ValidationRegistry.getSummary();

    const report = {
      timestamp: new Date().toISOString(),
      summary,
      findings,
    };

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`Report written to: ${outputPath}`);
    console.log(`Total findings: ${summary.total}`);
    console.log(
      `Critical: ${summary.critical}, Warning: ${summary.warning}, Info: ${summary.info}`
    );

    process.exit(summary.critical > 0 ? 1 : 0);
  }
}
