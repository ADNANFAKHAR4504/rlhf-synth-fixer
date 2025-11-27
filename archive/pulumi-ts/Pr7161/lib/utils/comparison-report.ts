import * as fs from 'fs';
import * as path from 'path';

export function generateComparisonReport(
  environment: string,
  outputs: Record<string, string>
): void {
  const reportPath = path.join(
    process.cwd(),
    `comparison-report-${environment}.json`
  );

  const report = {
    environment,
    timestamp: new Date().toISOString(),
    configuration: {
      vpcId: outputs.vpcId,
      clusterArn: outputs.clusterArn,
      albDnsName: outputs.albDns,
      dbEndpoint: outputs.dbEndpoint,
      dbInstanceClass: outputs.dbInstanceClass,
      ecrRepositoryUrl: outputs.ecrUrl,
    },
    metadata: {
      generatedBy: 'pulumi-payment-infrastructure',
      version: '1.0.0',
    },
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Comparison report generated: ${reportPath}`);
}

interface EnvironmentReport {
  env: string;
  data: {
    configuration: {
      vpcId: string;
      clusterArn: string;
      albDnsName: string;
      dbEndpoint: string;
      dbInstanceClass: string;
      ecrRepositoryUrl: string;
    };
  };
}

interface ComparisonResult {
  timestamp: string;
  environments: string[];
  differences: {
    dbInstanceClass: Array<{ env: string; class: string }>;
    vpcIds: Array<{ env: string; vpcId: string }>;
    ecrRepositoryUrls: Array<{ env: string; url: string }>;
  };
}

export function compareEnvironments(
  reports: EnvironmentReport[]
): ComparisonResult {
  const comparison: ComparisonResult = {
    timestamp: new Date().toISOString(),
    environments: reports.map(r => r.env),
    differences: {
      dbInstanceClass: [],
      vpcIds: [],
      ecrRepositoryUrls: [],
    },
  };

  // Compare instance classes
  const instanceClasses = reports.map(r => ({
    env: r.env,
    class: r.data.configuration.dbInstanceClass,
  }));
  comparison.differences.dbInstanceClass = instanceClasses;

  // Compare VPC configurations
  const vpcs = reports.map(r => ({
    env: r.env,
    vpcId: r.data.configuration.vpcId,
  }));
  comparison.differences.vpcIds = vpcs;

  // Compare ECR URLs
  const ecrs = reports.map(r => ({
    env: r.env,
    url: r.data.configuration.ecrRepositoryUrl,
  }));
  comparison.differences.ecrRepositoryUrls = ecrs;

  return comparison;
}
