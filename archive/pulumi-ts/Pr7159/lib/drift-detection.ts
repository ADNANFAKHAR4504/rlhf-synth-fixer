import * as pulumi from '@pulumi/pulumi';

export interface DriftDetectionConfig {
  environments: string[];
  organizationName: string;
}

export class DriftDetector {
  private config: DriftDetectionConfig;

  constructor(config: DriftDetectionConfig) {
    this.config = config;
  }

  public async detectDrift(): Promise<DriftReport> {
    const report: DriftReport = {
      timestamp: new Date().toISOString(),
      environments: {},
    };

    for (const env of this.config.environments) {
      const stackReference = new pulumi.StackReference(
        `${this.config.organizationName}/trading-platform/${env}`
      );

      const outputs = await stackReference.getOutputValue('infraOutputs');
      report.environments[env] = outputs;
    }

    return report;
  }

  public generateComparisonReport(report: DriftReport): string {
    let comparison = '# Infrastructure Comparison Report\n\n';
    comparison += `Generated: ${report.timestamp}\n\n`;

    const envs = Object.keys(report.environments);
    comparison += '## Environment Comparison\n\n';

    for (let i = 0; i < envs.length - 1; i++) {
      const env1 = envs[i];
      const env2 = envs[i + 1];
      comparison += `### ${env1} vs ${env2}\n\n`;
      comparison += this.compareEnvironments(
        report.environments[env1],
        report.environments[env2]
      );
    }

    return comparison;
  }

  private compareEnvironments(
    env1: Record<string, unknown>,
    env2: Record<string, unknown>
  ): string {
    let diff = '';
    const keys = new Set([...Object.keys(env1), ...Object.keys(env2)]);

    for (const key of keys) {
      if (JSON.stringify(env1[key]) !== JSON.stringify(env2[key])) {
        diff += `- **${key}**\n`;
        diff += `  - Environment 1: ${JSON.stringify(env1[key])}\n`;
        diff += `  - Environment 2: ${JSON.stringify(env2[key])}\n`;
      }
    }

    return diff || 'No differences detected\n';
  }
}

export interface DriftReport {
  timestamp: string;
  environments: {
    [envName: string]: Record<string, unknown>;
  };
}
