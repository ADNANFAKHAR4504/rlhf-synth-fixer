import * as fs from 'fs';
import * as path from 'path';


let template: any;

beforeAll(() => {
  const filePath = path.join(__dirname, '../lib/TapStack.json'); 
  const fileContent = fs.readFileSync(filePath, 'utf8');
  template = JSON.parse(fileContent);
});

describe('TAP Stack Template Unit Tests', () => {
  test('should include a VPC with DNS enabled', () => {
    const vpc = template.Resources?.VPC;
    expect(vpc).toBeDefined();
    expect(vpc.Type).toBe('AWS::EC2::VPC');
    expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
    expect(vpc.Properties.EnableDnsSupport).toBe(true);
    expect(vpc.Properties.EnableDnsHostnames).toBe(true);
  });

  test('should define two public and two private subnets', () => {
    expect(template.Resources?.PublicSubnet1).toBeDefined();
    expect(template.Resources?.PublicSubnet2).toBeDefined();
    expect(template.Resources?.PrivateSubnet1).toBeDefined();
    expect(template.Resources?.PrivateSubnet2).toBeDefined();
  });

  test('should configure an Application Load Balancer', () => {
    const alb = template.Resources?.ApplicationLoadBalancer;
    expect(alb).toBeDefined();
    expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    expect(alb.Properties.Scheme).toBe('internet-facing');
    expect(alb.Properties.Type).toBe('application');
  });

  test('should create a Multi-AZ RDS PostgreSQL instance with encryption', () => {
    const rds = template.Resources?.RDSInstance;
    expect(rds).toBeDefined();
    expect(rds.Type).toBe('AWS::RDS::DBInstance');
    expect(rds.Properties.Engine).toBe('postgres');
    expect(rds.Properties.MultiAZ).toBe(true);
    expect(rds.Properties.StorageEncrypted).toBe(true);
  });

  test('should define Auto Scaling Group with correct size', () => {
    const asg = template.Resources?.AutoScalingGroup;
    expect(asg).toBeDefined();
    expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    expect(asg.Properties.MinSize).toBe(2);
    expect(asg.Properties.MaxSize).toBe(6);
    expect(asg.Properties.DesiredCapacity).toBe(2);
  });

  test('should include Launch Template with instance user data and tags', () => {
    const lt = template.Resources?.LaunchTemplate;
    expect(lt).toBeDefined();
    expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
    const tags = lt.Properties.LaunchTemplateData.TagSpecifications[0].Tags;
    expect(tags).toEqual(expect.arrayContaining([
      expect.objectContaining({ Key: 'Name', Value: 'Production-WebServer' }),
    ]));
  });

  test('should define KMS key and alias for RDS encryption', () => {
    expect(template.Resources?.RDSKMSKey).toBeDefined();
    expect(template.Resources?.RDSKMSKeyAlias).toBeDefined();
  });

  test('should have CloudWatch alarms for ASG and RDS metrics', () => {
    expect(template.Resources?.CPUAlarmHigh).toBeDefined();
    expect(template.Resources?.CPUAlarmLow).toBeDefined();
    expect(template.Resources?.DatabaseCPUAlarm).toBeDefined();
    expect(template.Resources?.DatabaseConnectionsAlarm).toBeDefined();
  });

  test('should define secure S3 bucket with encryption and block public access', () => {
    const bucket = template.Resources?.S3Bucket;
    expect(bucket).toBeDefined();
    const encryption = bucket.Properties.BucketEncryption;
    expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    const access = bucket.Properties.PublicAccessBlockConfiguration;
    expect(access.BlockPublicAcls).toBe(true);
    expect(access.BlockPublicPolicy).toBe(true);
  });

  test('should deny insecure transport in S3 bucket policy', () => {
    const policy = template.Resources?.S3BucketPolicy;
    expect(policy).toBeDefined();
    const statement = policy.Properties.PolicyDocument.Statement.find((s: any) => s.Sid === 'DenyInsecureConnections');
    expect(statement.Condition.Bool['aws:SecureTransport']).toBe('false');
  });

  test('should include required outputs like VPCId, ALBDNSName, RDSEndpoint', () => {
    expect(template.Outputs?.VPCId).toBeDefined();
    expect(template.Outputs?.ALBDNSName).toBeDefined();
    expect(template.Outputs?.RDSEndpoint).toBeDefined();
  });
});
