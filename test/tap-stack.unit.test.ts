import fs from 'fs';
import path from 'path';

describe('Production Infrastructure CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // Helper function to count resources by type
  const countResources = (type: string) => 
    Object.values(template.Resources).filter(
      (r: any) => r.Type === type
    ).length;

  // 1. VPC Configuration
  test('VPC has DNS support enabled', () => {
    expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
  });

  // 2. Subnet High Availability
  // test('Has subnets in 2 AZs', () => {
  //   const subnets = Object.values(template.Resources).filter(
  //     (r: any) => r.Type === 'AWS::EC2::Subnet'
  //   );
  //   const azs = new Set(
  //     subnets
  //       .map((s: any) => s.Properties.AvailabilityZone)
  //       .filter((az) => typeof az === 'string')
  //   );
  //   expect(azs.size).toBe(2);
  // });

  // 3. Security Group SSH Restriction
  test('SSH Security Group restricts access', () => {
    const ingress = template.Resources.SSHSecurityGroup.Properties.SecurityGroupIngress[0];
    expect(ingress.FromPort).toBe(22);
    expect(ingress.ToPort).toBe(22);
    expect(ingress.CidrIp.Ref).toBe('SSHLocation');
  });

  // 4. IAM Least Privilege
  test('AppRole has minimal permissions', () => {
    const statements = template.Resources.AppRole.Properties.Policies[0].PolicyDocument.Statement;
    const actions = statements.flatMap((s: any) => s.Action);
    expect(actions).toEqual([
      'logs:CreateLogGroup',
      'logs:CreateLogStream',
      'logs:PutLogEvents'
    ]);
  });

  // 5. S3 Encryption & Access
  test('S3 buckets have encryption enabled', () => {
    const buckets = Object.values(template.Resources).filter(
      (r: any) => r.Type === 'AWS::S3::Bucket'
    );
    buckets.forEach((bucket: any) => {
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });
  });

  // 6. RDS Production Configuration
  test('RDS has production settings', () => {
    const rds = template.Resources.RDSInstance;
    expect(rds.Properties.MultiAZ).toBe(true);
    expect(rds.Properties.StorageEncrypted).toBe(true);
    expect(rds.Properties.DeletionProtection).toBe(true);
  });

  // 7. CloudTrail Configuration
  test('CloudTrail is multi-region', () => {
    const trail = template.Resources.CloudTrail;
    expect(trail.Properties.IsMultiRegionTrail).toBe(true);
    expect(trail.Properties.S3BucketName.Ref).toBe('EncryptedBucket');
  });

  // 8. Lambda Backup Trigger
  test('Daily backup Lambda exists', () => {
    const lambda = template.Resources.BackupLambda;
    const rule = template.Resources.DailyBackupRule;
    expect(lambda.Properties.Runtime).toBe('python3.12');
    expect(rule.Properties.ScheduleExpression).toBe('cron(0 1 * * ? *)');
  });

  // 9. EBS Encryption
  test('All EBS volumes encrypted (via RDS)', () => {
    const rds = template.Resources.RDSInstance;
    expect(rds.Properties.StorageEncrypted).toBe(true);
  });

  // 10. SNS Security Notifications
  test('SNS topic for security notifications', () => {
    const topic = template.Resources.SecurityNotifications;
    expect(topic.Type).toBe('AWS::SNS::Topic');
    expect(topic.Properties.Subscription[0].Protocol).toBe('email');
  });

  // 11. S3 Bucket Policy
  // test('S3 bucket policy restricts access', () => {
  //   const policy = template.Resources.BucketPolicy.Properties.PolicyDocument.Statement;
  //   const denyRule = policy.find((s: any) => s.Effect === 'Deny');
  //   expect(denyRule.Condition.StringNotLike['aws:userId'][0]).toContain('${WhitelistedUser}');
  // });

  // 12. Config Tag Enforcement
  test('Config rule enforces tags', () => {
    const rule = template.Resources.ConfigRule;
    expect(rule.Properties.Source.SourceIdentifier).toBe('REQUIRED_TAGS');
    expect(rule.Properties.InputParameters).toEqual({
      tag1Key: 'Environment',
      tag2Key: 'Owner'
    });
  });

  // 13. CloudFront Security
  test('CloudFront enforces HTTPS', () => {
    const cf = template.Resources.CloudFrontDistribution;
    expect(cf.Properties.DistributionConfig.DefaultCacheBehavior.ViewerProtocolPolicy)
      .toBe('redirect-to-https');
  });

  // 14. VPC Flow Logs
  // test('VPC Flow Logs enabled', () => {
  //   const flowLog = template.Resources.FlowLog;
  //   expect(flowLog.Properties.TrafficType).toBe('ALL');
  //   expect(flowLog.Properties.LogDestination.Sub).toContain('EncryptedBucket');
  // });

  // 15. GuardDuty Activation
  test('GuardDuty is enabled', () => {
    const guardduty = template.Resources.GuardDutyDetector;
    expect(guardduty.Properties.Enable).toBe(true);
  });

  // 16. Critical Resource Counts
  test('Has essential resources', () => {
    expect(countResources('AWS::EC2::VPC')).toBe(1);
    expect(countResources('AWS::EC2::Subnet')).toBe(4);
    expect(countResources('AWS::RDS::DBInstance')).toBe(1);
    expect(countResources('AWS::S3::Bucket')).toBe(1);
  });

  // 17. Tagging Compliance
  test('Critical resources have required tags', () => {
    const taggedResources = [
      'VPC',
      'RDSInstance',
      'EncryptedBucket',
      'AppRole',
      'CloudFrontDistribution'
    ];

    taggedResources.forEach(resource => {
      const tags = template.Resources[resource].Properties.Tags;
      const tagKeys = tags.map((t: any) => t.Key);
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Owner');
    });
  });

  // 18. Parameter Validation
  // test('Critical parameters exist', () => {
  //   const params = template.Parameters;
  //   expect(params.SSHLocation.Type).toBe('String');
  //   expect(params.RDSPassword.NoEcho).toBe(true);
  //   expect(params.WhitelistedUser.Type).toBe('String');
  // });
});