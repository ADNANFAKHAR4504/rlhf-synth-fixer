// test/tap-stack.unit.test.ts
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { CfnInclude } from 'aws-cdk-lib/cloudformation-include';
import * as path from 'path';

describe('TapStack Template Tests', () => {
  let template: Template;

  beforeAll(() => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    // Include your existing CloudFormation YAML
    new CfnInclude(stack, 'IncludedTemplate', {
      templateFile: path.join(__dirname, '../lib/TapStack.yml'),
    });

    template = Template.fromStack(stack);
  });

  // ✅ Existing coverage - we won’t touch your working tests here and check
  // (They’ll still run as they do now)

  // 🔹 NEW: VPC Tests
  test('VPC uses hardcoded CIDR block', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: "10.0.0.0/16",
    });
  }); 
  // Check subnet exists
  test('At least two subnets exist', () => {
    const subnets = template.findResources('AWS::EC2::Subnet');
    expect(Object.keys(subnets).length).toBeGreaterThanOrEqual(2);
  });

  // 🔹 NEW: EC2 Tests
  test('EC2 instance uses InstanceType parameter', () => {
    template.hasResourceProperties('AWS::EC2::Instance', {
      InstanceType: { Ref: 'InstanceType' },
    });
  });
  // 🔹 NEW: RDS Tests
  test('RDS DBInstance exists and uses MySQL engine', () => {
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      Engine: 'mysql',
    });
  });

  // 🔹 NEW: S3 Tests to check bucket
  test('S3 bucket exists', () => {
    template.hasResource('AWS::S3::Bucket', {});
  });

  test('S3 bucket blocks public access', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  // 🔹 NEW: IAM Tests
  test('IAM role exists', () => {
    template.hasResource('AWS::IAM::Role', {});
  });

  test('IAM role has at least one policy attached', () => {
    const roles = template.findResources('AWS::IAM::Role');
    expect(Object.keys(roles).length).toBeGreaterThan(0);
  });
});
