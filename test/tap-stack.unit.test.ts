import * as fs from 'fs';
import * as path from 'path';

const templatePath = path.join(__dirname, '../templates/development_stack_template.json');
const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

describe('CloudFormation Template Validation', () => {

  test('should include expected parameters', () => {
    const params = template.Parameters;
    expect(params).toHaveProperty('BucketName');
    expect(params).toHaveProperty('EC2KeyName');
    expect(params).toHaveProperty('SubnetId');
    expect(params).toHaveProperty('SecurityGroupId');
  });

  test('should contain an EC2 instance with expected properties', () => {
    const ec2 = template.Resources['DevInstance'];
    expect(ec2).toBeDefined();
    expect(ec2.Type).toBe('AWS::EC2::Instance');
    expect(ec2.Properties.InstanceType).toBe('t2.micro');
    expect(ec2.Properties.ImageId).toMatch(/^ami-/);
  });

  test('should have an S3 bucket with logging enabled', () => {
    const s3 = template.Resources['PublicS3Bucket'];
    expect(s3.Type).toBe('AWS::S3::Bucket');
    expect(s3.Properties.LoggingConfiguration).toBeDefined();
    expect(s3.Properties.LoggingConfiguration.LogFilePrefix).toBe('logs/');
  });

  test('should define IAM role for EC2 with S3 read-only access', () => {
    const role = template.Resources['S3ReadOnlyInstanceRole'];
    expect(role.Type).toBe('AWS::IAM::Role');
    expect(role.Properties.Policies[0].PolicyName).toBe('S3ReadOnlyAccess');
    expect(role.Properties.Policies[0].PolicyDocument.Statement[0].Action).toContain('s3:Get*');
  });

  test('should create a CloudWatch alarm for high CPU usage', () => {
    const alarm = template.Resources['CPUAlarmHigh'];
    expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
    expect(alarm.Properties.Threshold).toBe(80);
    expect(alarm.Properties.MetricName).toBe('CPUUtilization');
  });

});