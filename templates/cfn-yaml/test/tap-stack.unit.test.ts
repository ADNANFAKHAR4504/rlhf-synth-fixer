import fs from 'fs';
import path from 'path';

describe('Secure Web Infrastructure Unit Test', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/secure-web-infrastructure.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  test('RDSInstance should use Multi-AZ and KMS encryption', () => {
    const rds = template.Resources.RDSInstance.Properties;
    expect(rds.Engine).toBe('MySQL');
    expect(rds.MultiAZ).toBe(true);
    expect(rds.StorageEncrypted).toBe(true);
    expect(rds.KmsKeyId).toBeDefined();
  });

  test('SecretsManager should store RDS credentials', () => {
    const secret = template.Resources.Secrets;
    expect(secret.Type).toBe('AWS::SecretsManager::Secret');
    expect(secret.Properties.SecretString).toMatch(/"username":/);
  });

  test('S3 logging bucket should have AES256 encryption', () => {
    const s3 = template.Resources.LoggingBucket.Properties;
    expect(
      s3.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm
    ).toBe('AES256');
  });

  test('KMS key should be created and enabled for rotation', () => {
    const kms = template.Resources.KMSKey.Properties;
    expect(kms.Description).toMatch(/Key for/);
    expect(kms.EnableKeyRotation).toBe(true);
  });

  test('AutoScalingGroup should cover 3 AZs and use LaunchTemplate', () => {
    const asg = template.Resources.AutoScalingGroup.Properties;
    expect(asg.MinSize).toBe("2");
    expect(asg.MaxSize).toBe("10");
    expect(asg.LaunchTemplate).toBeDefined();
    expect(asg.VPCZoneIdentifier.length).toBeGreaterThanOrEqual(3);
  });

  test('IAM Role and InstanceProfile should be configured', () => {
    expect(template.Resources.InstanceRole.Type).toBe('AWS::IAM::Role');
    expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    expect(template.Resources.EC2InstanceProfile.Properties.Roles).toContain('InstanceRole');
  });

  test('ALB should exist with a Listener', () => {
    expect(template.Resources.ALB.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    expect(template.Resources.ALBListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    expect(template.Resources.ALBListener.Properties.Port).toBe(80);
  });

  test('CloudWatch alarm should trigger SNS', () => {
    const alarm = template.Resources.CloudWatchAlarm.Properties;
    expect(alarm.MetricName).toBe('CPUUtilization');
    expect(alarm.AlarmActions).toContainEqual(expect.anything());
  });

  test('CloudFront must be configured to serve S3 content securely', () => {
    const cf = template.Resources.CloudFrontDistribution.Properties.DistributionConfig;
    expect(cf.Enabled).toBe(true);
    expect(cf.DefaultCacheBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
  });

  test('WAF should be defined for CloudFront', () => {
    expect(template.Resources.WAFWebACL.Type).toBe('AWS::WAFv2::WebACL');
    expect(template.Resources.WAFWebACL.Properties.Scope).toBe('CLOUDFRONT');
  });
});
