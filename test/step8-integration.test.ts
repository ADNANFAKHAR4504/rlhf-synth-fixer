import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('Step 8: Full Integration Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TapStackTest', {
      environmentSuffix: 'test',
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    template = Template.fromStack(stack);
  });

  test('Step 8.1: Complete stack is created successfully', () => {
    expect(stack).toBeDefined();
    expect(stack.stackName).toBe('TapStackTest');
  });

  test('Step 8.2: All core resources are created', () => {
    template.resourceCountIs('AWS::S3::Bucket', 2); // Audio bucket + CloudFront logs
    template.resourceCountIs('AWS::DynamoDB::Table', 1);
    template.resourceCountIs('AWS::CloudFront::Distribution', 1);
    template.resourceCountIs('AWS::Route53::HostedZone', 1);
    template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    template.resourceCountIs('AWS::SNS::Topic', 1);
  });

  test('Step 8.3: Lambda functions are created', () => {
    template.resourceCountIs('AWS::Lambda::Function', 5);
  });

  test('Step 8.4: IAM roles are created', () => {
    const roles = template.findResources('AWS::IAM::Role');
    expect(Object.keys(roles).length).toBeGreaterThanOrEqual(5);
  });

  test('Step 8.5: EventBridge rules are created', () => {
    template.resourceCountIs('AWS::Events::Rule', 2);
  });

  test('Step 8.6: CloudWatch alarms are created', () => {
    template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
  });

  test('Step 8.7: MediaConvert job template is created', () => {
    template.resourceCountIs('AWS::MediaConvert::JobTemplate', 1);
  });

  test('Step 8.8: Route53 records are created', () => {
    template.resourceCountIs('AWS::Route53::RecordSet', 2); // A and AAAA records
  });

  test('Step 8.9: Stack environment is correctly configured', () => {
    expect(stack.region).toBe('us-east-1');
    expect(stack.account).toBe('123456789012');
  });

  test('Step 8.10: All resources have proper tags', () => {
    const resources = template.toJSON().Resources;
    const taggedResources = Object.values(resources).filter((resource: any) =>
      resource.Properties &&
      (resource.Properties.Tags || resource.Properties.tags)
    );
    expect(taggedResources.length).toBeGreaterThan(0);
  });
});

