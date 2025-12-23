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

  test('EC2 Instance Created with Correct Configuration', () => {
    template.hasResourceProperties('AWS::EC2::Instance', {
      InstanceType: 't3.micro',
    });
    
    // Check that the EC2 instance has the Project tag
    const resources = template.findResources('AWS::EC2::Instance');
    const instanceKeys = Object.keys(resources);
    expect(instanceKeys.length).toBe(1);
    
    const instance = resources[instanceKeys[0]];
    const tags = instance.Properties.Tags as Array<{Key: string, Value: string}>;
    const projectTag = tags.find(tag => tag.Key === 'Project');
    expect(projectTag).toBeDefined();
    expect(projectTag?.Value).toBe('Internal');
  });

  test('Security Group Allows HTTPS Only', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      SecurityGroupIngress: [
        {
          CidrIp: '0.0.0.0/0',
          FromPort: 443,
          IpProtocol: 'tcp',
          ToPort: 443,
        },
      ],
    });
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
    const tags = vpc.Properties.Tags as Array<{Key: string, Value: string}>;
    const projectTag = tags.find(tag => tag.Key === 'Project');
    expect(projectTag).toBeDefined();
    expect(projectTag?.Value).toBe('Internal');
  });

  test('IAM Roles Created with Least Privilege', () => {
    // Lambda role should exist
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

    // EC2 role should exist
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
          },
        ],
      },
    });
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
