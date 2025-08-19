import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

function getOutputValue(obj: Record<string, any> | undefined, key: string): any {
  if (!obj) return undefined;
  if (obj[key] && typeof obj[key] === 'object' && 'value' in obj[key]) return obj[key].value;
  if (obj[key] && typeof obj[key] === 'string') return obj[key];
  return undefined;
}

describe('Terraform E2E Integration Test', () => {
  const tfDir = path.join(__dirname, '../lib');
  const outputsJsonPaths = [
    path.join(__dirname, '../cfn-outputs.json'),
    path.join(__dirname, '../cfn-outputs/flat-outputs.json'),
    path.join(__dirname, '../lib/flat-outputs.json')
  ];
  let deploymentOutputs: Record<string, any> | undefined = undefined;

  beforeAll(() => {
    // Always run terraform init before other commands
    try {
      execSync('terraform init -no-color', { cwd: tfDir, stdio: 'pipe' });
    } catch (err) {
      throw err;
    }
    // Read outputs from first existing output file
    for (const outputsPath of outputsJsonPaths) {
      if (fs.existsSync(outputsPath)) {
        const raw = fs.readFileSync(outputsPath, 'utf8');
        if (raw.trim() !== '') {
          deploymentOutputs = JSON.parse(raw);
          break;
        }
      }
    }
  });

  test('S3 bucket output', () => {
    const bucketName = getOutputValue(deploymentOutputs, 'bucket_name');
    expect(bucketName).toBeDefined();
    expect(bucketName).toMatch(/secure-env-dev-s3-bucket/);
  });

  test('KMS keys output', () => {
    const primaryKmsArn = getOutputValue(deploymentOutputs, 'primary_kms_key_arn');
    const secondaryKmsArn = getOutputValue(deploymentOutputs, 'secondary_kms_key_arn');
    expect(primaryKmsArn).toBeDefined();
    expect(primaryKmsArn).toMatch(/arn:aws:kms:[a-z0-9-]+:\d+:key\/[a-z0-9\-]+/);
    expect(secondaryKmsArn).toBeDefined();
    expect(secondaryKmsArn).toMatch(/arn:aws:kms:[a-z0-9-]+:\d+:key\/[a-z0-9\-]+/);
  });

  test('VPCs output', () => {
    const vpcIdPrimary = getOutputValue(deploymentOutputs, 'vpc_id_primary');
    const vpcIdSecondary = getOutputValue(deploymentOutputs, 'vpc_id_secondary');
    expect(vpcIdPrimary).toBeDefined();
    expect(vpcIdPrimary).toMatch(/^vpc-/);
    expect(vpcIdSecondary).toBeDefined();
    expect(vpcIdSecondary).toMatch(/^vpc-/);
  });

  test('IAM roles and policies output', () => {
    const lambdaRoleName = getOutputValue(deploymentOutputs, 'lambda_role_name');
    const lambdaPolicyName = getOutputValue(deploymentOutputs, 'lambda_policy_name');
    expect(lambdaRoleName).toBeDefined();
    expect(lambdaRoleName).toMatch(/secure-env-dev-lambda-role/);
    expect(lambdaPolicyName).toBeDefined();
    expect(lambdaPolicyName).toMatch(/secure-env-dev-lambda-policy/);
  });

  test('Lambda functions output', () => {
    const lambdaPrimaryName = getOutputValue(deploymentOutputs, 'lambda_primary_name');
    const lambdaSecondaryName = getOutputValue(deploymentOutputs, 'lambda_secondary_name');
    expect(lambdaPrimaryName).toBeDefined();
    expect(lambdaSecondaryName).toBeDefined();
    expect(lambdaPrimaryName).toMatch(/secure-env-dev-function-primary/);
    expect(lambdaSecondaryName).toMatch(/secure-env-dev-function-secondary/);
  });

  test('Security groups output', () => {
    const sgLambdaPrimaryId = getOutputValue(deploymentOutputs, 'sg_lambda_primary_id');
    const sgLambdaSecondaryId = getOutputValue(deploymentOutputs, 'sg_lambda_secondary_id');
    expect(sgLambdaPrimaryId).toBeDefined();
    expect(sgLambdaPrimaryId).toMatch(/^sg-/);
    expect(sgLambdaSecondaryId).toBeDefined();
    expect(sgLambdaSecondaryId).toMatch(/^sg-/);
  });

  test('CloudWatch alarms output', () => {
    const alarmPrimary = getOutputValue(deploymentOutputs, 'unauthorized_access_alarm_primary_name');
    const alarmSecondary = getOutputValue(deploymentOutputs, 'unauthorized_access_alarm_secondary_name');
    expect(alarmPrimary).toBeDefined();
    expect(alarmPrimary).toMatch(/secure-env-dev-unauthorized-access-alarm-primary/);
    expect(alarmSecondary).toBeDefined();
    expect(alarmSecondary).toMatch(/secure-env-dev-unauthorized-access-alarm-secondary/);
  });
});