import { TapStack } from './lib/tap-stack';
import { ComplianceScanner } from './lib/compliance-scanner';
import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config();
const environmentSuffix =
  config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = config.get('region') || process.env.AWS_REGION || 'us-east-1';
const dryRun = config.getBoolean('dryRun') || false;

// Create the stack (no infrastructure deployment, just configuration)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const stack = new TapStack('tap-stack', {
  environmentSuffix,
  region,
  dryRun,
});

// Run the compliance scan
async function runComplianceScan() {
  const scanner = new ComplianceScanner(region, environmentSuffix, dryRun);

  try {
    const report = await scanner.scanAll();
    scanner.printSummary(report);

    const outputPath = `compliance-report-${environmentSuffix}-${new Date().toISOString().split('T')[0]}.json`;
    await scanner.saveReport(report, outputPath);

    return report;
  } catch (error) {
    console.error('Compliance scan failed:', error);
    throw error;
  }
}

// Export the scan function to be called externally
export const scan = runComplianceScan;

// If running directly, execute the scan
if (require.main === module) {
  runComplianceScan().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
