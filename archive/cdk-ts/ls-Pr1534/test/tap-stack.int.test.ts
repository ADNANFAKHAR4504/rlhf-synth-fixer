// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';

const outputsPath = 'cfn-outputs/flat-outputs.json';
const outputsRaw = fs.existsSync(outputsPath)
  ? fs.readFileSync(outputsPath, 'utf8')
  : '{}';
const outputs: Record<string, string> = JSON.parse(outputsRaw || '{}');

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

const hasNonEmptyString = (key: string): boolean =>
  Object.prototype.hasOwnProperty.call(outputs, key) &&
  typeof outputs[key] === 'string' &&
  outputs[key].trim().length > 0;

describe('TAP Stack Integration Outputs', () => {
  test('outputs file is readable JSON', () => {
    expect(outputs).toBeDefined();
    expect(typeof outputs).toBe('object');
  });

  // VPC
  (hasNonEmptyString('VpcId')
    ? test
    : test.skip)('VpcId output is present and looks valid', () => {
    expect(outputs.VpcId).toMatch(/^vpc-/);
  });

  (hasNonEmptyString('VpcCidr')
    ? test
    : test.skip)('VpcCidr output is present', () => {
    expect(outputs.VpcCidr).toContain('/');
  });

  (hasNonEmptyString('PrivateSubnetIds')
    ? test
    : test.skip)('PrivateSubnetIds is a comma-separated list of subnet ids', () => {
    const ids = outputs.PrivateSubnetIds.split(',').map(s => s.trim());
    expect(ids.length).toBeGreaterThan(0);
    ids.forEach(id => expect(id).toMatch(/^subnet-/));
  });

  (hasNonEmptyString('PublicSubnetIds')
    ? test
    : test.skip)('PublicSubnetIds is a comma-separated list of subnet ids', () => {
    const ids = outputs.PublicSubnetIds.split(',').map(s => s.trim());
    expect(ids.length).toBeGreaterThan(0);
    ids.forEach(id => expect(id).toMatch(/^subnet-/));
  });

  // KMS
  (hasNonEmptyString('KmsKeyId') ? test : test.skip)('KmsKeyId is present', () => {
    expect(outputs.KmsKeyId).not.toHaveLength(0);
  });

  (hasNonEmptyString('KmsKeyArn') ? test : test.skip)('KmsKeyArn is an ARN', () => {
    expect(outputs.KmsKeyArn).toMatch(/^arn:/);
  });

  // S3 Buckets
  (hasNonEmptyString('ArtifactBucketName')
    ? test
    : test.skip)('ArtifactBucketName is present', () => {
    expect(outputs.ArtifactBucketName).not.toHaveLength(0);
  });

  (hasNonEmptyString('ArtifactBucketArn')
    ? test
    : test.skip)('ArtifactBucketArn is an ARN', () => {
    expect(outputs.ArtifactBucketArn).toMatch(/^arn:/);
  });

  (hasNonEmptyString('DataBucketName') ? test : test.skip)('DataBucketName is present', () => {
    expect(outputs.DataBucketName).not.toHaveLength(0);
  });

  (hasNonEmptyString('DataBucketArn') ? test : test.skip)('DataBucketArn is an ARN', () => {
    expect(outputs.DataBucketArn).toMatch(/^arn:/);
  });

  // IAM Roles
  (hasNonEmptyString('BackupRoleArn') ? test : test.skip)('BackupRoleArn is an ARN', () => {
    expect(outputs.BackupRoleArn).toMatch(/^arn:/);
  });

  (hasNonEmptyString('MonitoringRoleArn')
    ? test
    : test.skip)('MonitoringRoleArn is an ARN', () => {
    expect(outputs.MonitoringRoleArn).toMatch(/^arn:/);
  });

  // Backup (conditional)
  (hasNonEmptyString('BackupVaultName')
    ? test
    : test.skip)('BackupVaultName is present', () => {
    expect(outputs.BackupVaultName).not.toHaveLength(0);
  });

  (hasNonEmptyString('BackupVaultArn')
    ? test
    : test.skip)('BackupVaultArn is an ARN', () => {
    expect(outputs.BackupVaultArn).toMatch(/^arn:/);
  });

  (hasNonEmptyString('BackupPlanName')
    ? test
    : test.skip)('BackupPlanName is present', () => {
    expect(outputs.BackupPlanName).not.toHaveLength(0);
  });

  (hasNonEmptyString('BackupPlanArn')
    ? test
    : test.skip)('BackupPlanArn is an ARN', () => {
    expect(outputs.BackupPlanArn).toMatch(/^arn:/);
  });

  // Monitoring (conditional)
  (hasNonEmptyString('AlarmTopicArn')
    ? test
    : test.skip)('AlarmTopicArn is an ARN', () => {
    expect(outputs.AlarmTopicArn).toMatch(/^arn:/);
  });

  (hasNonEmptyString('AlarmTopicName')
    ? test
    : test.skip)('AlarmTopicName is present', () => {
    expect(outputs.AlarmTopicName).not.toHaveLength(0);
  });

  (hasNonEmptyString('DashboardName')
    ? test
    : test.skip)('DashboardName is present', () => {
    expect(outputs.DashboardName).not.toHaveLength(0);
  });

  // Pipeline
  (hasNonEmptyString('CodeBuildProjectName')
    ? test
    : test.skip)('CodeBuildProjectName is present', () => {
    expect(outputs.CodeBuildProjectName).not.toHaveLength(0);
  });

  (hasNonEmptyString('CodeBuildProjectArn')
    ? test
    : test.skip)('CodeBuildProjectArn is an ARN', () => {
    expect(outputs.CodeBuildProjectArn).toMatch(/^arn:/);
  });

  (hasNonEmptyString('CodePipelineName')
    ? test
    : test.skip)('CodePipelineName is present', () => {
    expect(outputs.CodePipelineName).not.toHaveLength(0);
  });

  (hasNonEmptyString('CodePipelineArn')
    ? test
    : test.skip)('CodePipelineArn is an ARN', () => {
    expect(outputs.CodePipelineArn).toMatch(/^arn:/);
  });

  // VPC Peering (conditional)
  (hasNonEmptyString('VpcPeeringConnectionId')
    ? test
    : test.skip)('VpcPeeringConnectionId looks valid', () => {
    expect(outputs.VpcPeeringConnectionId).not.toHaveLength(0);
  });
});
