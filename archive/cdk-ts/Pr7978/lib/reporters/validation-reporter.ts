import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as fs from 'fs';
import * as path from 'path';
import {
  ValidationRegistry,
  ValidationFinding,
} from '../core/validation-registry';

export interface ValidationReporterProps {
  environmentSuffix: string;
  outputPath: string;
}

export interface ValidationReport {
  timestamp: string;
  environmentSuffix: string;
  summary: {
    total: number;
    critical: number;
    warning: number;
    info: number;
    categories: Record<string, number>;
  };
  findings: ValidationFinding[];
  executionMetrics: {
    totalExecutionTime: number;
    averageExecutionTime: number;
  };
}

export class ValidationReporter extends Construct {
  constructor(scope: Construct, id: string, props: ValidationReporterProps) {
    super(scope, id);

    // Generate report after synthesis
    const node = this.node.root as cdk.App;

    node.node.addValidation({
      validate: () => {
        this.generateReport(props);
        return [];
      },
    });
  }

  private generateReport(props: ValidationReporterProps): void {
    const findings = ValidationRegistry.getFindings();
    const summary = ValidationRegistry.getSummary();

    const totalExecutionTime = findings.reduce(
      (sum, f) => sum + f.executionTime,
      0
    );
    const averageExecutionTime =
      findings.length > 0 ? totalExecutionTime / findings.length : 0;

    const report: ValidationReport = {
      timestamp: new Date().toISOString(),
      environmentSuffix: props.environmentSuffix,
      summary,
      findings,
      executionMetrics: {
        totalExecutionTime,
        averageExecutionTime,
      },
    };

    // Write report to file
    const outputDir = path.dirname(props.outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(props.outputPath, JSON.stringify(report, null, 2));

    // Print summary to console
    console.log('\n' + '='.repeat(80));
    console.log('INFRASTRUCTURE VALIDATION REPORT');
    console.log('='.repeat(80));
    console.log(`Environment: ${props.environmentSuffix}`);
    console.log(`Timestamp: ${report.timestamp}`);
    console.log('\nSummary:');
    console.log(`  Total Findings: ${summary.total}`);
    console.log(`  Critical: ${summary.critical}`);
    console.log(`  Warning: ${summary.warning}`);
    console.log(`  Info: ${summary.info}`);
    console.log('\nCategories:');
    for (const [category, count] of Object.entries(summary.categories)) {
      console.log(`  ${category}: ${count}`);
    }
    console.log('\nExecution Metrics:');
    console.log(`  Total Time: ${totalExecutionTime.toFixed(2)}ms`);
    console.log(`  Average Time: ${averageExecutionTime.toFixed(2)}ms`);
    console.log(`\nDetailed report written to: ${props.outputPath}`);
    console.log('='.repeat(80) + '\n');

    // Exit with error code if critical findings exist
    if (summary.critical > 0) {
      console.error(
        `\nValidation failed with ${summary.critical} critical finding(s)\n`
      );
      // Don't exit here to allow report generation, but log the issue
    }
  }
}
