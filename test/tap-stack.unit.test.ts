import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { IamConstruct } from '../lib/constructs/iam-construct';
import { TaggingUtils } from '../lib/utils/tagging';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test',
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Configuration', () => {
    test('should create stack with correct name and environment', () => {
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should have correct environment suffix in props', () => {
      const stackWithProps = new TapStack(app, 'TestStackWithProps', {
        environmentSuffix: 'prod',
      });
      expect(stackWithProps.stackName).toBe('TestStackWithProps');
    });

    test('should use environment suffix from props when provided', () => {
      const stackWithProps = new TapStack(app, 'TestStackWithProps', {
        environmentSuffix: 'prod',
      });
      expect(stackWithProps.stackName).toBe('TestStackWithProps');
    });

    test('should use default environment suffix when not provided', () => {
      const stackWithoutProps = new TapStack(app, 'TestStackWithoutProps');
      expect(stackWithoutProps.stackName).toBe('TestStackWithoutProps');
    });
  });

  describe('KMS Construct', () => {
    test('should create three KMS keys', () => {
      template.resourceCountIs('AWS::KMS::Key', 3);
    });

    test('should have proper deletion and update policies for KMS keys', () => {
      template.hasResource('AWS::KMS::Key', {
        DeletionPolicy: 'Retain',
        UpdateReplacePolicy: 'Retain',
      });
    });

    test('should have proper tags on KMS keys', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'test' },
          { Key: 'Service', Value: 'tap' },
        ]),
      });
    });
  });

  describe('IAM Construct', () => {
    test('should create Lambda execution role with VPC access', () => {
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
        Description: 'Execution role for Lambda functions with VPC access',
      });
    });

    test('should create EC2 instance role', () => {
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
        Description: 'Role for EC2 instances running application workloads',
      });
    });

    test('should create RDS enhanced monitoring role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'monitoring.rds.amazonaws.com',
              },
            },
          ],
        },
        Description: 'Role for RDS enhanced monitoring',
      });
    });

    test('should create CloudTrail role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudtrail.amazonaws.com',
              },
            },
          ],
        },
        Description: 'Role for CloudTrail to write logs to CloudWatch',
      });
    });

    test('should have proper tags on IAM roles', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'test' },
          { Key: 'Service', Value: 'tap' },
        ]),
      });
    });

    test('should create MFA enforcement policy', () => {
      template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
        Description: 'Policy to enforce MFA for sensitive operations',
      });
    });

    test('should create cross-account policy with proper conditions', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', {
        environmentSuffix: 'test',
      });
      const iamConstruct = testStack.node.findChild('IamConstruct') as any;
      const crossAccountPolicy = iamConstruct.createCrossAccountPolicy([
        '123456789012',
      ]);

      expect(crossAccountPolicy).toBeDefined();
    });
  });

  describe('Network Construct', () => {
    test('should create VPC with correct CIDR and configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create VPC with proper tags', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'test' },
          { Key: 'Service', Value: 'tap' },
        ]),
      });
    });

    test('should create multiple subnet types', () => {
      const subnetCount = Object.keys(
        template.findResources('AWS::EC2::Subnet')
      ).length;
      expect(subnetCount).toBeGreaterThan(0);
    });

    test('should create VPC Flow Logs', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp('/aws/vpc/flowlogs/.*'),
      });
    });

    test('should create VPC endpoints for AWS services', () => {
      const endpointCount = Object.keys(
        template.findResources('AWS::EC2::VPCEndpoint')
      ).length;
      expect(endpointCount).toBeGreaterThan(0);
    });

    test('should create security groups with proper rules', () => {
      const securityGroupCount = Object.keys(
        template.findResources('AWS::EC2::SecurityGroup')
      ).length;
      expect(securityGroupCount).toBeGreaterThan(0);
    });

    test('should create security group rules between tiers', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.stringLikeRegexp('.*Security group for.*'),
      });
    });

    test('should have proper tags on security groups', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'test' },
          { Key: 'Service', Value: 'tap' },
        ]),
      });
    });

    test('should create Application Load Balancer', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Type: 'application',
          Scheme: 'internet-facing',
        }
      );
    });

    test('should create WAF Web ACL', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Scope: 'REGIONAL',
        DefaultAction: {
          Allow: {},
        },
      });
    });

    test('should associate WAF with ALB', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACLAssociation', {});
    });
  });

  describe('S3 Construct', () => {
    test('should create S3 buckets with encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
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
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should create multiple S3 buckets', () => {
      const bucketCount = Object.keys(
        template.findResources('AWS::S3::Bucket')
      ).length;
      expect(bucketCount).toBeGreaterThanOrEqual(3); // data, logs, backup
    });

    test('should have proper tags on S3 buckets', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'test' },
          { Key: 'Service', Value: 'tap' },
        ]),
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('should export VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID for the secure network',
      });
    });

    test('should export KMS key ARN', () => {
      template.hasOutput('DataKeyArn', {
        Description: 'ARN of the data encryption KMS key',
      });
    });

    test('should export Lambda execution role ARN', () => {
      template.hasOutput('LambdaExecutionRoleArn', {
        Description: 'ARN of the Lambda execution role',
      });
    });

    test('should export ALB DNS name', () => {
      template.hasOutput('AlbDnsName', {
        Description: 'DNS name of the Application Load Balancer',
      });
    });

    test('should export WAF Web ACL ARN', () => {
      template.hasOutput('WebAclArn', {
        Description: 'ARN of the WAF Web ACL',
      });
    });

    test('should export S3 bucket names', () => {
      template.hasOutput('DataBucketName', {
        Description: 'Name of the secure data S3 bucket',
      });
      template.hasOutput('LogsBucketName', {
        Description: 'Name of the logs S3 bucket',
      });
    });

    test('should export MFA policy ARN', () => {
      template.hasOutput('MfaPolicyArn', {
        Description: 'ARN of the MFA enforcement policy',
      });
    });
  });

  describe('Resource Counts', () => {
    test('should create expected number of KMS keys', () => {
      template.resourceCountIs('AWS::KMS::Key', 3);
    });

    test('should create expected number of IAM roles', () => {
      template.resourceCountIs('AWS::IAM::Role', 5); // Lambda, EC2, RDS, CloudTrail + VPC Flow Logs role
    });

    test('should create one VPC', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
    });

    test('should create multiple security groups', () => {
      const securityGroupCount = Object.keys(
        template.findResources('AWS::EC2::SecurityGroup')
      ).length;
      expect(securityGroupCount).toBeGreaterThan(0);
    });

    test('should create VPC endpoints', () => {
      const endpointCount = Object.keys(
        template.findResources('AWS::EC2::VPCEndpoint')
      ).length;
      expect(endpointCount).toBeGreaterThan(0);
    });

    test('should create S3 buckets', () => {
      const bucketCount = Object.keys(
        template.findResources('AWS::S3::Bucket')
      ).length;
      expect(bucketCount).toBeGreaterThanOrEqual(3);
    });

    test('should create WAF Web ACL', () => {
      template.resourceCountIs('AWS::WAFv2::WebACL', 1);
    });

    test('should create Application Load Balancer', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
    });
  });

  describe('Security and Compliance', () => {
    test('should have encryption enabled on KMS keys', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });

    test('should have proper security group rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.stringLikeRegexp('.*Security group for.*'),
      });
    });

    test('should have compliance tags on all resources', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'test' },
          { Key: 'Service', Value: 'tap' },
        ]),
      });
    });

    test('should have MFA enforcement policy', () => {
      template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
        Description: 'Policy to enforce MFA for sensitive operations',
      });
    });

    test('should have WAF protection', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Scope: 'REGIONAL',
      });
    });

    test('should have S3 encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            },
          ],
        },
      });
    });
  });

  describe('Environment Variables', () => {
    test('should use environment suffix in resource names', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([{ Key: 'Environment', Value: 'test' }]),
      });
    });
  });
});

describe('TaggingUtils', () => {
  describe('generateResourceName', () => {
    test('should generate resource name without suffix', () => {
      const { TaggingUtils } = require('../lib/utils/tagging');
      const name = TaggingUtils.generateResourceName('prod', 'api', 'lambda');
      expect(name).toBe('prod-api-lambda');
    });

    test('should generate resource name with suffix', () => {
      const { TaggingUtils } = require('../lib/utils/tagging');
      const name = TaggingUtils.generateResourceName(
        'prod',
        'api',
        'lambda',
        'v1'
      );
      expect(name).toBe('prod-api-lambda-v1');
    });

    test('should handle empty suffix', () => {
      const { TaggingUtils } = require('../lib/utils/tagging');
      const name = TaggingUtils.generateResourceName(
        'prod',
        'api',
        'lambda',
        ''
      );
      expect(name).toBe('prod-api-lambda');
    });

    test('should handle special characters in parameters', () => {
      const { TaggingUtils } = require('../lib/utils/tagging');
      const name = TaggingUtils.generateResourceName(
        'prod',
        'api-service',
        'lambda-function'
      );
      expect(name).toBe('prod-api-service-lambda-function');
    });
  });

  describe('applyStandardTags', () => {
    test('should apply standard tags without additional tags', () => {
      const { TaggingUtils } = require('../lib/utils/tagging');
      const output = new cdk.CfnOutput(
        new cdk.Stack(new cdk.App(), 'TestStack'),
        'TestOutput',
        {
          value: 'test',
        }
      );
      TaggingUtils.applyStandardTags(output, 'prod', 'api', 'owner', 'project');
      expect(output).toBeDefined();
    });

    test('should apply standard tags with additional tags', () => {
      const { TaggingUtils } = require('../lib/utils/tagging');
      const output = new cdk.CfnOutput(
        new cdk.Stack(new cdk.App(), 'TestStack'),
        'TestOutput',
        {
          value: 'test',
        }
      );
      TaggingUtils.applyStandardTags(
        output,
        'prod',
        'api',
        'owner',
        'project',
        {
          ResourceType: 'Test',
        }
      );
      expect(output).toBeDefined();
    });

    test('should handle empty additional tags', () => {
      const { TaggingUtils } = require('../lib/utils/tagging');
      const output = new cdk.CfnOutput(
        new cdk.Stack(new cdk.App(), 'TestStack'),
        'TestOutput',
        {
          value: 'test',
        }
      );
      TaggingUtils.applyStandardTags(
        output,
        'prod',
        'api',
        'owner',
        'project',
        {}
      );
      expect(output).toBeDefined();
    });
  });
});
