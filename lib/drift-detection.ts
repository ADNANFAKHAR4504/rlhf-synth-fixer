import * as automation from '@pulumi/pulumi/automation';
import * as path from 'path';
import * as fs from 'fs';

interface DriftReport {
  environment: string;
  differences: {
    parameter: string;
    stagingValue: unknown;
    prodValue: unknown;
    isControlled: boolean;
  }[];
  timestamp: string;
}

async function getStackOutputs(
  stackName: string
): Promise<automation.OutputMap> {
  const workDir = path.join(__dirname, '..');

  const stack = await automation.LocalWorkspace.createOrSelectStack({
    stackName,
    workDir,
  });

  return await stack.outputs();
}

async function getStackConfig(
  stackName: string
): Promise<Record<string, { value: unknown }>> {
  const workDir = path.join(__dirname, '..');

  const stack = await automation.LocalWorkspace.createOrSelectStack({
    stackName,
    workDir,
  });

  const config = await stack.getAllConfig();
  return config;
}

async function detectDrift(): Promise<DriftReport> {
  console.log('Starting drift detection between staging and prod...');

  // Get configurations
  const stagingConfig = await getStackConfig('staging');
  const prodConfig = await getStackConfig('prod');

  // Get outputs (for future use in drift detection)
  await getStackOutputs('staging');
  await getStackOutputs('prod');

  const differences: DriftReport['differences'] = [];

  // Controlled variations (scaling parameters)
  const controlledParams = [
    'lambdaMemory',
    'lambdaConcurrency',
    'dlqRetries',
    'region',
    'environmentSuffix',
  ];

  // Compare configurations
  const allKeys = new Set([
    ...Object.keys(stagingConfig),
    ...Object.keys(prodConfig),
  ]);

  for (const key of allKeys) {
    const stagingValue = stagingConfig[key]?.value;
    const prodValue = prodConfig[key]?.value;

    if (JSON.stringify(stagingValue) !== JSON.stringify(prodValue)) {
      const paramName = key.split(':')[1] || key;
      differences.push({
        parameter: paramName,
        stagingValue,
        prodValue,
        isControlled: controlledParams.includes(paramName),
      });
    }
  }

  const report: DriftReport = {
    environment: 'staging-vs-prod',
    differences,
    timestamp: new Date().toISOString(),
  };

  return report;
}

async function main() {
  try {
    const report = await detectDrift();

    console.log('\n=== DRIFT DETECTION REPORT ===');
    console.log(`Timestamp: ${report.timestamp}`);
    console.log(`\nTotal Differences Found: ${report.differences.length}`);

    const controlledDiffs = report.differences.filter(d => d.isControlled);
    const uncontrolledDiffs = report.differences.filter(d => !d.isControlled);

    if (controlledDiffs.length > 0) {
      console.log(
        `\nControlled Variations (Expected): ${controlledDiffs.length}`
      );
      controlledDiffs.forEach(diff => {
        console.log(`  - ${diff.parameter}:`);
        console.log(`      Staging: ${JSON.stringify(diff.stagingValue)}`);
        console.log(`      Prod:    ${JSON.stringify(diff.prodValue)}`);
      });
    }

    if (uncontrolledDiffs.length > 0) {
      console.log(
        `\n⚠️  UNCONTROLLED DRIFT DETECTED: ${uncontrolledDiffs.length}`
      );
      uncontrolledDiffs.forEach(diff => {
        console.log(`  - ${diff.parameter}:`);
        console.log(`      Staging: ${JSON.stringify(diff.stagingValue)}`);
        console.log(`      Prod:    ${JSON.stringify(diff.prodValue)}`);
      });
      console.log(
        '\n⚠️  WARNING: Uncontrolled drift may indicate configuration inconsistency!'
      );
    } else {
      console.log(
        '\n✅ No uncontrolled drift detected. Staging and Prod are consistent.'
      );
    }

    // Save report to file
    fs.writeFileSync(
      'drift-report.json',
      JSON.stringify(report, null, 2),
      'utf8'
    );
    console.log('\nReport saved to: drift-report.json');
  } catch (error) {
    console.error('Error during drift detection:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { detectDrift };
export type { DriftReport };
