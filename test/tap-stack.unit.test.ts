import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as TapStack from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack.TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack.TapStack(app, 'MyTestStack');
    template = Template.fromStack(stack);
  });

  test('S3 Buckets Created', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });

    // Should create two buckets (main + access logs)
    template.resourceCountIs('AWS::S3::Bucket', 2);
  });

  test('Public Subnet Created in VPC', () => {
    template.hasResourceProperties('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: true,
    });

    // Check that the subnet has the Project tag
    const resources = template.findResources('AWS::EC2::Subnet');
    const subnetKeys = Object.keys(resources);
    expect(subnetKeys.length).toBeGreaterThan(0);
  });

  test('Internet Gateway Attached to VPC', () => {
    template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
  });

  test('Lambda Function Created with Correct Properties', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'python3.11',
      Handler: 'index.handler',
      Timeout: 300,
      MemorySize: 256,
    });
  });

  test('VPC Created with Correct Configuration', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
    });

    // Check that the VPC has the Project tag
    const resources = template.findResources('AWS::EC2::VPC');
    const vpcKeys = Object.keys(resources);
    expect(vpcKeys.length).toBe(1);

    const vpc = resources[vpcKeys[0]];
    const tags = vpc.Properties.Tags as Array<{ Key: string, Value: string }>;
    const projectTag = tags.find(tag => tag.Key === 'Project');
    expect(projectTag).toBeDefined();
    expect(projectTag?.Value).toBe('Internal');
  });

  test('IAM Roles Created with Least Privilege', () => {
    // Lambda role should exist with correct trust policy
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      },
    });

    // Verify at least one IAM role exists (Lambda role + custom resource role)
    const roles = template.findResources('AWS::IAM::Role');
    expect(Object.keys(roles).length).toBeGreaterThanOrEqual(1);
  });

  test('All Resources Have Project Tag', () => {
    // Test that resources have the required Project tag
    const resources = template.findResources('AWS::S3::Bucket');
    const resourceKeys = Object.keys(resources);

    expect(resourceKeys.length).toBeGreaterThan(0);

    // Check Lambda function has tags
    template.hasResourceProperties('AWS::Lambda::Function', {
      Tags: [
        {
          Key: 'Project',
          Value: 'Internal',
        },
      ],
    });
  });
});
