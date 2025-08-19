import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Helper: Read output value (supports { value } or flat)
function getOutputValue(obj: Record<string, any> | undefined | null, key: string): any {
  if (!obj) return undefined;
  if (obj[key] && typeof obj[key] === 'object' && 'value' in obj[key]) return obj[key].value;
  if (obj[key] && typeof obj[key] === 'string') return obj[key];
  return undefined;
}

// Finds only backend config files (not provider.tf)
function findBackendFiles(dir: string): string[] {
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.tf'))
    .filter(f => {
      const content = fs.readFileSync(path.join(dir, f), 'utf8');
      return /terraform\s*{[\s\S]*backend\s*"/.test(content);
    });
}

describe('Terraform E2E Integration Test', () => {
  const tfDir = path.join(__dirname, '../lib');
  const localBackendFile = path.join(tfDir, 'zz_local_backend.tf');
  const outputsJsonPaths = [
    path.join(__dirname, '../cfn-outputs.json'),
    path.join(__dirname, '../cfn-outputs/flat-outputs.json'),
    path.join(__dirname, '../lib/flat-outputs.json')
  ];
  let renamedBackendFiles: string[] = [];
  let deploymentOutputs: Record<string, any> | null = null;

  beforeAll(() => {
    // Rename only backend files (not provider.tf)
    renamedBackendFiles = findBackendFiles(tfDir);
    renamedBackendFiles.forEach(f => {
      const fullPath = path.join(tfDir, f);
      fs.renameSync(fullPath, fullPath + '.bak');
    });

    // Write local backend config for test
    fs.writeFileSync(
      localBackendFile,
      `
terraform {
  backend "local" {
    path = "terraform.tfstate"
  }
}
`
    );

    // Run terraform init with -input=false and -no-color (no prompt)
    execSync('terraform init -input=false -no-color', { cwd: tfDir, stdio: 'pipe' });

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

  test('terraform validate passes with no errors', () => {
    expect(() =>
      execSync('terraform validate -no-color', { cwd: tfDir, stdio: 'pipe' })
    ).not.toThrow();
  });

  test('terraform plan produces expected resources', () => {
    const planOutput = execSync('terraform plan -input=false -no-color', { cwd: tfDir }).toString();
    expect(planOutput).toMatch(/aws_s3_bucket/);
    expect(planOutput).toMatch(/aws_kms_key/);
    expect(planOutput).toMatch(/aws_vpc/);
    expect(planOutput).toMatch(/No changes. Infrastructure is up-to-date|Plan:/);
    // Optionally: add checks for other resource types if you want to expand coverage
    expect(planOutput).toMatch(/aws_iam_role/);
    expect(planOutput).toMatch(/aws_lambda_function/);
    expect(planOutput).toMatch(/aws_security_group/);
    expect(planOutput).toMatch(/aws_cloudwatch_metric_alarm/);
  });

  test('deployment output returns expected resource values (full coverage)', () => {
    expect(deploymentOutputs).toBeTruthy();

    // S3 Bucket
    const bucketName = getOutputValue(deploymentOutputs, 'bucket_name');
    expect(bucketName).toBeDefined();
    expect(bucketName).toMatch(/secure-env-dev-s3-bucket/);

    const bucketTags = getOutputValue(deploymentOutputs, 'bucket_tags');
    if (typeof bucketTags === 'string') {
      expect(JSON.parse(bucketTags)).toMatchObject({
        Environment: 'dev',
        ManagedBy: 'terraform',
        Project: 'secure-env'
      });
    } else {
      expect(bucketTags).toMatchObject({
        Environment: 'dev',
        ManagedBy: 'terraform',
        Project: 'secure-env'
      });
    }

    // KMS Keys
    const primaryKmsArn = getOutputValue(deploymentOutputs, 'primary_kms_key_arn');
    const secondaryKmsArn = getOutputValue(deploymentOutputs, 'secondary_kms_key_arn');
    expect(primaryKmsArn).toBeDefined();
    expect(primaryKmsArn).toMatch(/arn:aws:kms:[a-z0-9-]+:\d+:key\/[a-z0-9\-]+/);
    expect(secondaryKmsArn).toBeDefined();
    expect(secondaryKmsArn).toMatch(/arn:aws:kms:[a-z0-9-]+:\d+:key\/[a-z0-9\-]+/);

    // VPCs
    const vpcIdPrimary = getOutputValue(deploymentOutputs, 'vpc_id_primary');
    const vpcIdSecondary = getOutputValue(deploymentOutputs, 'vpc_id_secondary');
    expect(vpcIdPrimary).toBeDefined();
    expect(vpcIdPrimary).toMatch(/^vpc-/);
    expect(vpcIdSecondary).toBeDefined();
    expect(vpcIdSecondary).toMatch(/^vpc-/);

    // IAM Roles & Policies
    const lambdaRoleName = getOutputValue(deploymentOutputs, 'lambda_role_name');
    const lambdaPolicyName = getOutputValue(deploymentOutputs, 'lambda_policy_name');
    expect(lambdaRoleName).toBeDefined();
    expect(lambdaRoleName).toMatch(/secure-env-dev-lambda-role/);
    expect(lambdaPolicyName).toBeDefined();
    expect(lambdaPolicyName).toMatch(/secure-env-dev-lambda-policy/);

    // Lambda Functions
    const lambdaPrimaryName = getOutputValue(deploymentOutputs, 'lambda_primary_name');
    const lambdaSecondaryName = getOutputValue(deploymentOutputs, 'lambda_secondary_name');
    expect(lambdaPrimaryName).toBeDefined();
    expect(lambdaPrimaryName).toMatch(/secure-env-dev-function-primary/);
    expect(lambdaSecondaryName).toBeDefined();
    expect(lambdaSecondaryName).toMatch(/secure-env-dev-function-secondary/);

    // Security Groups
    const sgLambdaPrimaryId = getOutputValue(deploymentOutputs, 'sg_lambda_primary_id');
    const sgLambdaSecondaryId = getOutputValue(deploymentOutputs, 'sg_lambda_secondary_id');
    expect(sgLambdaPrimaryId).toBeDefined();
    expect(sgLambdaPrimaryId).toMatch(/^sg-/);
    expect(sgLambdaSecondaryId).toBeDefined();
    expect(sgLambdaSecondaryId).toMatch(/^sg-/);

    // CloudWatch Alarms
    const alarmPrimary = getOutputValue(deploymentOutputs, 'unauthorized_access_alarm_primary_name');
    const alarmSecondary = getOutputValue(deploymentOutputs, 'unauthorized_access_alarm_secondary_name');
    expect(alarmPrimary).toBeDefined();
    expect(alarmPrimary).toMatch(/secure-env-dev-unauthorized-access-alarm-primary/);
    expect(alarmSecondary).toBeDefined();
    expect(alarmSecondary).toMatch(/secure-env-dev-unauthorized-access-alarm-secondary/);

    // EC2 Bastion Hosts
    const bastionPrimaryId = getOutputValue(deploymentOutputs, 'bastion_primary_id');
    const bastionSecondaryId = getOutputValue(deploymentOutputs, 'bastion_secondary_id');
    expect(bastionPrimaryId).toBeDefined();
    expect(bastionPrimaryId).toMatch(/^i-[a-z0-9]+$/);
    expect(bastionSecondaryId).toBeDefined();
    expect(bastionSecondaryId).toMatch(/^i-[a-z0-9]+$/);
  });

  afterAll(() => {
    // Clean up state files
    ['terraform.tfstate', 'terraform.tfstate.backup'].forEach(f => {
      const filePath = path.join(tfDir, f);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
    // Remove local backend config
    if (fs.existsSync(localBackendFile)) fs.unlinkSync(localBackendFile);
    // Restore original backend config files
    renamedBackendFiles.forEach(f => {
      const orig = path.join(tfDir, f);
      const bak = orig + '.bak';
      if (fs.existsSync(bak)) fs.renameSync(bak, orig);
    });
    // Clean up deployment output files
    outputsJsonPaths.forEach(p => {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });
  });
});