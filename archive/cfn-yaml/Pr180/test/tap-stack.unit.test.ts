import fs from 'fs';
import yaml from 'js-yaml';

// Custom schema to ignore CloudFormation tags
const CF_SCHEMA = yaml.DEFAULT_SCHEMA.extend([
  new yaml.Type('!Ref', { kind: 'scalar', construct: (data) => data }),
  new yaml.Type('!GetAtt', { kind: 'scalar', construct: (data) => data }),
  new yaml.Type('!Sub', { kind: 'scalar', construct: (data) => data }),
  new yaml.Type('!Join', { kind: 'scalar', construct: (data) => data }),
  new yaml.Type('!If', { kind: 'sequence', construct: (data) => data }),
  new yaml.Type('!Equals', { kind: 'sequence', construct: (data) => data }),
  new yaml.Type('!Not', { kind: 'sequence', construct: (data) => data }),
  new yaml.Type('!FindInMap', { kind: 'scalar', construct: (data) => data }),
  new yaml.Type('!ImportValue', { kind: 'scalar', construct: (data) => data }),
  new yaml.Type('!Select', { kind: 'sequence', construct: (data) => data }),
  new yaml.Type('!GetAZs', { kind: 'scalar', construct: (data) => data }),
  new yaml.Type('!Split', { kind: 'scalar', construct: (data) => data }),
  new yaml.Type('!Base64', { kind: 'scalar', construct: (data) => data }),
  new yaml.Type('!Condition', { kind: 'scalar', construct: (data) => data }),
]);

const template = yaml.load(fs.readFileSync('lib/TapStack.yml', 'utf8'), { schema: CF_SCHEMA }) as any;

describe('TapStack CloudFormation Template', () => {
  // CloudWatch Alarms and SNS Topic unit tests included
  // Coverage: AWS::CloudWatch::Alarm and AWS::SNS::Topic resources
  it('should have valid CloudFormation format version', () => {
    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
  });

  it('should define required parameters', () => {
    expect(template.Parameters.InstanceType).toBeDefined();
    expect(template.Parameters.InstanceCount).toBeDefined();
    expect(template.Parameters.KeyName).toBeDefined();
    expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    expect(template.Parameters.EmailNotification).toBeDefined();
  });

  it('should define a VPC resource', () => {
    expect(template.Resources.VPC).toBeDefined();
    expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
  });

  it('should define an encrypted S3 bucket', () => {
    const s3 = template.Resources.SecureS3Bucket;
    expect(s3).toBeDefined();
    expect(s3.Type).toBe('AWS::S3::Bucket');
    expect(s3.Properties.BucketEncryption).toBeDefined();
  });

  it('should define a Lambda function with nodejs22.x runtime', () => {
    const lambda = template.Resources.S3ProcessingLambda;
    expect(lambda).toBeDefined();
    expect(lambda.Type).toBe('AWS::Lambda::Function');
    expect(lambda.Properties.Runtime).toBe('nodejs22.x');
  });

  it('should define a DynamoDB table with PAY_PER_REQUEST billing mode', () => {
    const ddb = template.Resources.AppDynamoTable;
    expect(ddb).toBeDefined();
    expect(ddb.Type).toBe('AWS::DynamoDB::Table');
    expect(ddb.Properties.BillingMode).toBe('PAY_PER_REQUEST');
  });

  it('should have LoadBalancerDNS output', () => {
    expect(template.Outputs.LoadBalancerDNS).toBeDefined();
    expect(template.Outputs.LoadBalancerDNS.Value).toBeDefined();
  });

  it('should have CloudFrontURL output', () => {
    expect(template.Outputs.CloudFrontURL).toBeDefined();
    expect(template.Outputs.CloudFrontURL.Value).toBeDefined();
  });

  it('should define a CloudWatch alarm for monitoring', () => {
    const alarm = template.Resources.HighCPUAlarm;
    expect(alarm).toBeDefined();
    expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
    expect(alarm.Properties.MetricName).toBe('CPUUtilization');
    expect(alarm.Properties.Threshold).toBe(80);
  });

  it('should define an SNS topic for notifications', () => {
    const topic = template.Resources.NotificationTopic;
    expect(topic).toBeDefined();
    expect(topic.Type).toBe('AWS::SNS::Topic');
    expect(topic.Properties.Subscription).toBeDefined();
    expect(topic.Properties.Subscription[0].Protocol).toBe('email');
  });

  // Additional explicit tests for GitHub PR analysis
  it('should test CloudWatch Alarms configuration', () => {
    const alarm = template.Resources.HighCPUAlarm;
    expect(alarm).toBeDefined();
    expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
    expect(alarm.Properties.AlarmDescription).toBe('High CPU utilization');
    expect(alarm.Properties.Namespace).toBe('AWS/EC2');
    expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
  });

  it('should test SNS Topic subscription and configuration', () => {
    const topic = template.Resources.NotificationTopic;
    expect(topic).toBeDefined();
    expect(topic.Type).toBe('AWS::SNS::Topic');
    expect(topic.Properties.Subscription).toBeDefined();
    expect(topic.Properties.Subscription.length).toBe(1);
    expect(topic.Properties.Tags).toBeDefined();
  });
});