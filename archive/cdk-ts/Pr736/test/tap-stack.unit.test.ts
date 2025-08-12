import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  describe('With explicit environment suffix', () => {
    let app: cdk.App;
    let stack: TapStack;
    let template: Template;
    const environmentSuffix = 'test';

    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { 
        environmentSuffix,
        stackName: `TapStack${environmentSuffix}` 
      });
      template = Template.fromStack(stack);
    });

  describe('VPC Configuration', () => {
    test('creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'Production' })
        ])
      });
    });

    test('creates public and private subnets', () => {
      // Check for public subnets
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private
      
      // Verify public subnet configuration
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'aws-cdk:subnet-type', Value: 'Public' })
        ])
      });
      
      // Verify private subnet configuration
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'aws-cdk:subnet-type', Value: 'Private' })
        ])
      });
    });

    test('creates Internet Gateway and attaches to VPC', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
      template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
    });

    test('creates NAT Gateway with Elastic IP', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
      template.resourceCountIs('AWS::EC2::EIP', 1);
      
      template.hasResourceProperties('AWS::EC2::EIP', {
        Domain: 'vpc'
      });
    });

    test('creates route tables and associations', () => {
      // Each subnet should have a route table
      template.resourceCountIs('AWS::EC2::RouteTable', 4);
      template.resourceCountIs('AWS::EC2::SubnetRouteTableAssociation', 4);
      
      // Public subnets should have routes to IGW
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0',
        GatewayId: Match.anyValue()
      });
      
      // Private subnets should have routes to NAT Gateway
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0',
        NatGatewayId: Match.anyValue()
      });
    });
  });

  describe('EC2 Instance Configuration', () => {
    test('creates EC2 instance with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't2.micro',
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'Production' })
        ])
      });
    });

    test('creates security group for EC2 with SSH access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `cf-task-ec2-security-group-${environmentSuffix}`,
        GroupDescription: 'Security group for EC2 instance with restricted SSH access',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '10.0.0.0/8',
            FromPort: 22,
            ToPort: 22,
            IpProtocol: 'tcp'
          })
        ])
      });
    });

    test('creates IAM role and instance profile for EC2', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: 'ec2.amazonaws.com'
              })
            })
          ])
        })
      });
      
      template.resourceCountIs('AWS::IAM::InstanceProfile', 1);
    });
  });

  describe('Lambda Function Configuration', () => {
    test('creates Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `cf-task-file-processor-${environmentSuffix}`,
        Runtime: 'python3.12',
        Handler: 'index.lambda_handler',
        MemorySize: 256,
        Timeout: 60,
        Environment: Match.objectLike({
          Variables: Match.objectLike({
            SNS_TOPIC_ARN: Match.anyValue(),
            BUCKET_NAME: Match.anyValue()
          })
        })
      });
    });

    test('creates IAM role for Lambda with correct policies', () => {
      // Find the Lambda role specifically
      const resources = template.findResources('AWS::IAM::Role');
      const lambdaRole = Object.values(resources).find((r: any) => 
        r.Properties?.RoleName === `cf-task-lambda-execution-role-${environmentSuffix}`
      );
      
      expect(lambdaRole).toBeDefined();
      expect(lambdaRole?.Properties?.AssumeRolePolicyDocument?.Statement).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Effect: 'Allow',
            Principal: expect.objectContaining({
              Service: 'lambda.amazonaws.com'
            })
          })
        ])
      );
      expect(lambdaRole?.Properties?.ManagedPolicyArns).toBeDefined();
      expect(lambdaRole?.Properties?.ManagedPolicyArns.length).toBe(2);
      // Check that both policies are included
      const policyArns = JSON.stringify(lambdaRole?.Properties?.ManagedPolicyArns);
      expect(policyArns).toContain('AWSLambdaBasicExecutionRole');
      expect(policyArns).toContain('AWSLambdaVPCAccessExecutionRole');
    });

    test('creates Lambda security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.stringLikeRegexp('.*Lambda Function.*'),
        SecurityGroupEgress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            IpProtocol: '-1'
          })
        ])
      });
    });

    test('Lambda has S3 and SNS permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                's3:GetObject',
                's3:GetObjectVersion',
                's3:PutObject',
                's3:DeleteObject'
              ])
            }),
            Match.objectLike({
              Effect: 'Allow',
              Action: 'sns:Publish'
            })
          ])
        })
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('creates S3 bucket with correct configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled'
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            })
          ])
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    test('S3 bucket has auto-delete objects enabled', () => {
      template.hasResource('Custom::S3AutoDeleteObjects', {
        Properties: {
          BucketName: Match.anyValue()
        }
      });
    });

    test('S3 bucket has event notification for Lambda', () => {
      template.hasResource('Custom::S3BucketNotifications', {
        Properties: {
          NotificationConfiguration: Match.objectLike({
            LambdaFunctionConfigurations: Match.arrayWith([
              Match.objectLike({
                Events: Match.arrayWith(['s3:ObjectCreated:*'])
              })
            ])
          })
        }
      });
    });

    test('Lambda has permission to be invoked by S3', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 's3.amazonaws.com'
      });
    });
  });

  describe('SNS Topic Configuration', () => {
    test('creates SNS topic with correct configuration', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `cf-task-sns-topic-${environmentSuffix}`,
        DisplayName: 'File Upload Notification Topic',
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'Production' })
        ])
      });
    });
  });

  describe('Stack Outputs', () => {
    test('creates all required outputs', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID'
      });
      
      template.hasOutput('EC2InstanceId', {
        Description: 'EC2 Instance ID'
      });
      
      template.hasOutput('S3BucketName', {
        Description: 'S3 Bucket Name'
      });
      
      template.hasOutput('LambdaFunctionArn', {
        Description: 'Lambda Function ARN'
      });
      
      template.hasOutput('LambdaFunctionName', {
        Description: 'Lambda Function Name'
      });
      
      template.hasOutput('SNSTopicArn', {
        Description: 'SNS Topic ARN'
      });
      
      template.hasOutput('EC2InstancePublicIp', {
        Description: 'EC2 Instance Public IP'
      });
      
      template.hasOutput('SecurityGroupId', {
        Description: 'EC2 Security Group ID'
      });
    });
  });

  describe('Resource Tagging', () => {
    test('all resources have Environment tag', () => {
      // VPC
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'Production' })
        ])
      });
      
      // EC2 Instance
      template.hasResourceProperties('AWS::EC2::Instance', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'Production' })
        ])
      });
      
      // S3 Bucket
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'Production' })
        ])
      });
      
      // Lambda Function
      template.hasResourceProperties('AWS::Lambda::Function', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'Production' })
        ])
      });
      
      // SNS Topic
      template.hasResourceProperties('AWS::SNS::Topic', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'Production' })
        ])
      });
    });

    test('resources use cf-task prefix in names', () => {
      // VPC
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: Match.stringLikeRegexp('cf-task-vpc-.*') })
        ])
      });
      
      // Security Group
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: Match.stringLikeRegexp('cf-task-.*')
      });
      
      // Lambda Function
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp('cf-task-.*')
      });
      
      // SNS Topic
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: Match.stringLikeRegexp('cf-task-.*')
      });
    });
  });

  describe('Security Configuration', () => {
    test('S3 bucket blocks all public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    test('S3 bucket has encryption enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            })
          ])
        }
      });
    });

    test('EC2 security group restricts SSH to private network', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '10.0.0.0/8',
            FromPort: 22,
            ToPort: 22,
            IpProtocol: 'tcp',
            Description: 'SSH access from private network'
          })
        ])
      });
    });

    test('Lambda runs in VPC private subnets', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: Match.objectLike({
          SubnetIds: Match.anyValue(),
          SecurityGroupIds: Match.anyValue()
        })
      });
    });
  });

  describe('Cleanup Configuration', () => {
    test('S3 bucket has DESTROY removal policy', () => {
      const resources = template.findResources('AWS::S3::Bucket');
      const bucketLogicalId = Object.keys(resources)[0];
      expect(resources[bucketLogicalId].DeletionPolicy).toBe('Delete');
      expect(resources[bucketLogicalId].UpdateReplacePolicy).toBe('Delete');
    });

    test('S3 bucket has auto-delete objects custom resource', () => {
      template.hasResource('Custom::S3AutoDeleteObjects', {
        Properties: {
          BucketName: Match.anyValue()
        }
      });
    });
  });
  });

  describe('With default environment suffix', () => {
    test('uses dev as default environment suffix', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'DefaultTestStack');
      const template = Template.fromStack(stack);
      
      // Check that resources use 'dev' as suffix
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: 'cf-task-vpc-dev' })
        ])
      });
      
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'cf-task-file-processor-dev'
      });
      
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'cf-task-sns-topic-dev'
      });
    });
  });
});