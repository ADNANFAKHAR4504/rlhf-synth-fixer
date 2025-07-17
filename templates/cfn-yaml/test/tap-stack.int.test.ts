// Configuration - These are coming from cdk-outputs after cdk deploy
import fs from 'fs';
import path from 'path';
const outputs = JSON.parse(
  fs.readFileSync('cdk-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Turn Around Prompt API Integration Tests', () => {
  describe('Hello', () => {
    test('World', async () => {
      expect(true).toBe(true);
    });
  });
});

describe('Secure Web Infrastructure Init Test', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/secure-web-infrastructure.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  test('should contain VPC spanning 3 Availability Zones', () => {
    const subnets = Object.values(template.Resources).filter(
      (r: any) => r.Type === 'AWS::EC2::Subnet'
    );
    expect(subnets.length).toBeGreaterThanOrEqual(3);
  });

  test('should have KMS key configured', () => {
    expect(template.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
  });

  test('should encrypt RDS with KMS', () => {
    const rds = template.Resources.RDSInstance.Properties;
    expect(rds.StorageEncrypted).toBe(true);
    expect(rds.KmsKeyId).toBeDefined();
  });

  test('should use Secrets Manager for RDS credentials', () => {
    expect(template.Resources.Secrets.Type).toBe('AWS::SecretsManager::Secret');
    const rds = template.Resources.RDSInstance.Properties;
    expect(rds.MasterUsername).toContain('resolve:secretsmanager');
    expect(rds.MasterUserPassword).toContain('resolve:secretsmanager');
  });

  test('S3 Bucket should have server-side encryption', () => {
    const s3 = template.Resources.LoggingBucket.Properties;
    expect(s3.BucketEncryption).toBeDefined();
    expect(
      s3.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm
    ).toBe('AES256');
  });

  test('should use IAM roles and instance profile for EC2', () => {
    expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    expect(template.Resources.InstanceRole.Type).toBe('AWS::IAM::Role');
  });

  test('should define Auto Scaling Group with Launch Template', () => {
    expect(template.Resources.ApplicationLaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    expect(template.Resources.AutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
  });

  test('should configure ALB with Listener', () => {
    expect(template.Resources.ALB.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    expect(template.Resources.ALBListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
  });

  test('should include WAF WebACL', () => {
    expect(template.Resources.WAFWebACL.Type).toBe('AWS::WAFv2::WebACL');
  });

  test('should configure CloudFront distribution', () => {
    expect(template.Resources.CloudFrontDistribution.Type).toBe('AWS::CloudFront::Distribution');
  });
});
