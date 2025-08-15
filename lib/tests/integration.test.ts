import * as fs from 'fs';
import * as path from 'path';

describe("Integration Tests", () => {
  const outputsPath = path.join(__dirname, '../cdk-outputs/flat-outputs.json');
  let outputs: any;

  beforeAll(() => {
    if (fs.existsSync(outputsPath)) {
      outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
    }
  });

  it("should have deployed resources in both regions", () => {
    expect(outputs).toBeDefined();
    expect(outputs['us-east-1-stack']).toBeDefined();
    expect(outputs['eu-central-1-stack']).toBeDefined();
  });

  it("should have VPCs in different regions with different CIDRs", () => {
    expect(outputs['us-east-1-stack'].VpcId).toMatch(/^vpc-/);
    expect(outputs['eu-central-1-stack'].VpcId).toMatch(/^vpc-/);
    expect(outputs['us-east-1-stack'].VpcId).not.toBe(outputs['eu-central-1-stack'].VpcId);
  });

  it("should have encrypted S3 buckets", () => {
    expect(outputs['us-east-1-stack'].EncryptedBucketId).toBeDefined();
    expect(outputs['us-east-1-stack'].CloudTrailBucketId).toBeDefined();
  });

  it("should have KMS encryption in US East 1", () => {
    expect(outputs['us-east-1-stack'].KmsKeyArn).toMatch(/^arn:aws:kms:us-east-1:/);
  });

  it("should have CloudWatch log groups configured", () => {
    expect(outputs['us-east-1-stack'].CloudWatchLogGroup).toBe('/aws/application/us-east-1-prod');
    expect(outputs['eu-central-1-stack'].CloudWatchLogGroup).toBe('/aws/application/eu-central-1-prod');
  });

  it("should meet all security requirements", () => {
    expect(outputs.security_requirements_met.no_ssh_access).toBe(true);
    expect(outputs.security_requirements_met.vpc_only_traffic).toBe(true);
    expect(outputs.security_requirements_met.encrypted_storage).toBe(true);
    expect(outputs.security_requirements_met.minimal_iam_permissions).toBe(true);
    expect(outputs.security_requirements_met.cross_region_isolation).toBe(true);
  });
});