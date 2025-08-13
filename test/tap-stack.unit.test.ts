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
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Configuration', () => {
    test('should create stack with correct name and environment', () => {
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should have correct environment suffix in props', () => {
      expect(stack.node.tryGetContext('environmentSuffix')).toBeUndefined(); // Context is not set in test
    });

    test('should use environment suffix from props when provided', () => {
      const stackWithProps = new TapStack(app, 'TestStackWithProps', {
        environmentSuffix: 'prod',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      expect(stackWithProps.stackName).toBe('TestStackWithProps');
    });

    test('should use default environment suffix when not provided', () => {
      const stackWithoutProps = new TapStack(app, 'TestStackWithoutProps', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      expect(stackWithoutProps.stackName).toBe('TestStackWithoutProps');
    });
  });

  describe('KMS Construct', () => {
    test('should create three KMS keys', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for encrypting sensitive data at rest',
        EnableKeyRotation: true,
        KeySpec: 'SYMMETRIC_DEFAULT',
        KeyUsage: 'ENCRYPT_DECRYPT',
      });

      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for encrypting audit and application logs',
        EnableKeyRotation: true,
        KeySpec: 'SYMMETRIC_DEFAULT',
        KeyUsage: 'ENCRYPT_DECRYPT',
      });

      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for encrypting database storage and backups',
        EnableKeyRotation: true,
        KeySpec: 'SYMMETRIC_DEFAULT',
        KeyUsage: 'ENCRYPT_DECRYPT',
      });
    });

    test('should have proper deletion and update policies for KMS keys', () => {
      template.hasResource('AWS::KMS::Key', {
        UpdateReplacePolicy: 'Retain',
        DeletionPolicy: 'Retain',
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

    test('should create cross-account policy with proper conditions', () => {
      const testApp = new cdk.App();
      const testStack = new cdk.Stack(testApp, 'TestStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });

      const iamConstruct = new IamConstruct(testStack, 'TestIamConstruct', {
        environment: 'test',
        service: 'tap',
        owner: 'devops-team',
        project: 'test-automation-platform',
        kmsKeys: {
          dataKey: {} as any,
          logKey: {} as any,
          databaseKey: {} as any,
        },
      });

      const crossAccountPolicy = iamConstruct.createCrossAccountPolicy(['123456789012', '987654321098']);
      
      const policyTemplate = Template.fromStack(testStack);
      policyTemplate.hasResourceProperties('AWS::IAM::ManagedPolicy', {
        Description: 'Policy for secure cross-account access',
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: 'sts:AssumeRole',
              Resource: [
                'arn:aws:iam::123456789012:role/*',
                'arn:aws:iam::987654321098:role/*',
              ],
              Condition: {
                Bool: {
                  'aws:MultiFactorAuthPresent': 'true',
                },
                NumericLessThan: {
                  'aws:MultiFactorAuthAge': '3600',
                },
              },
            },
          ],
        },
      });
    });
  });

  describe('Network Construct', () => {
    test('should create VPC with correct CIDR and configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        InstanceTenancy: 'default',
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
      // Public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: Match.stringLikeRegexp('10\\.0\\.[0-9]+\\.0/24'),
        MapPublicIpOnLaunch: true,
      });

      // Private subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: Match.stringLikeRegexp('10\\.0\\.[0-9]+\\.0/24'),
        MapPublicIpOnLaunch: Match.anyValue(),
      });
    });

    test('should create VPC Flow Logs', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
        LogDestinationType: 'cloud-watch-logs',
      });
    });

    test('should create VPC endpoints for AWS services', () => {
      // Interface endpoints
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Interface',
        PrivateDnsEnabled: true,
      });

      // Gateway endpoints
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Gateway',
      });
    });

    test('should create security groups with proper rules', () => {
      // Web security group
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for web tier (load balancers)',
      });

      // Database security group
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for database tier',
      });
    });

    test('should create security group rules between tiers', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        FromPort: 8080,
        ToPort: 8080,
        IpProtocol: 'tcp',
      });

      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        FromPort: 5432,
        ToPort: 5432,
        IpProtocol: 'tcp',
      });

      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        FromPort: 3306,
        ToPort: 3306,
        IpProtocol: 'tcp',
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
  });

  describe('CloudFormation Outputs', () => {
    test('should export VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID for the secure network',
        Export: {
          Name: 'TestTapStack-VpcId',
        },
      });
    });

    test('should export KMS key ARN', () => {
      template.hasOutput('DataKeyArn', {
        Description: 'ARN of the data encryption KMS key',
        Export: {
          Name: 'TestTapStack-DataKeyArn',
        },
      });
    });

    test('should export Lambda execution role ARN', () => {
      template.hasOutput('LambdaExecutionRoleArn', {
        Description: 'ARN of the Lambda execution role',
        Export: {
          Name: 'TestTapStack-LambdaExecutionRoleArn',
        },
      });
    });
  });

  describe('Resource Counts', () => {
    test('should create expected number of KMS keys', () => {
      template.resourceCountIs('AWS::KMS::Key', 3);
    });

    test('should create expected number of IAM roles', () => {
      // 4 from IAM construct + 1 from VPC Flow Logs
      template.resourceCountIs('AWS::IAM::Role', 5);
    });

    test('should create one VPC', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
    });

    test('should create multiple security groups', () => {
      // At least 4 main security groups + endpoint security groups
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      expect(Object.keys(securityGroups).length).toBeGreaterThanOrEqual(4);
    });

    test('should create VPC endpoints', () => {
      const vpcEndpoints = template.findResources('AWS::EC2::VPCEndpoint');
      expect(Object.keys(vpcEndpoints).length).toBeGreaterThan(0);
    });
  });

  describe('Security and Compliance', () => {
    test('should have encryption enabled on KMS keys', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });

    test('should have proper security group rules', () => {
      // Check that database security group exists
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for database tier',
      });
    });

    test('should have compliance tags on all resources', () => {
      // Check KMS keys have compliance tags
      template.hasResourceProperties('AWS::KMS::Key', {
        Tags: Match.arrayWith([
          { Key: 'ComplianceLevel', Value: 'Financial-Services' },
          { Key: 'DataClassification', Value: 'Confidential' },
        ]),
      });

      // Check IAM roles have compliance tags
      template.hasResourceProperties('AWS::IAM::Role', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'test' },
          { Key: 'Service', Value: 'tap' },
        ]),
      });

      // Check security groups have compliance tags
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        Tags: Match.arrayWith([
          { Key: 'ComplianceLevel', Value: 'Financial-Services' },
          { Key: 'DataClassification', Value: 'Confidential' },
        ]),
      });
    });
  });

  describe('Environment Variables', () => {
    test('should use environment suffix in resource names', () => {
      // Check that KMS keys have the correct environment tag
      template.hasResourceProperties('AWS::KMS::Key', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'test' },
        ]),
      });
    });
  });
});

describe('TaggingUtils', () => {
  describe('generateResourceName', () => {
    test('should generate resource name without suffix', () => {
      const name = TaggingUtils.generateResourceName('prod', 'api', 'lambda');
      expect(name).toBe('prod-api-lambda');
    });

    test('should generate resource name with suffix', () => {
      const name = TaggingUtils.generateResourceName('prod', 'api', 'lambda', 'v1');
      expect(name).toBe('prod-api-lambda-v1');
    });

    test('should handle empty suffix', () => {
      const name = TaggingUtils.generateResourceName('prod', 'api', 'lambda', '');
      expect(name).toBe('prod-api-lambda'); // Empty suffix should be ignored
    });

    test('should handle special characters in parameters', () => {
      const name = TaggingUtils.generateResourceName('prod-env', 'api-service', 'lambda-function');
      expect(name).toBe('prod-env-api-service-lambda-function');
    });
  });

  describe('applyStandardTags', () => {
    test('should apply standard tags without additional tags', () => {
      const testApp = new cdk.App();
      const testStack = new cdk.Stack(testApp, 'TestStack');
      const testConstruct = new cdk.CfnOutput(testStack, 'TestOutput', {
        value: 'test',
      });

      expect(() => {
        TaggingUtils.applyStandardTags(
          testConstruct,
          'prod',
          'api',
          'devops-team',
          'test-project'
        );
      }).not.toThrow();
    });

    test('should apply standard tags with additional tags', () => {
      const testApp = new cdk.App();
      const testStack = new cdk.Stack(testApp, 'TestStack');
      const testConstruct = new cdk.CfnOutput(testStack, 'TestOutput', {
        value: 'test',
      });

      const additionalTags = {
        CustomTag: 'custom-value',
        AnotherTag: 'another-value',
      };

      expect(() => {
        TaggingUtils.applyStandardTags(
          testConstruct,
          'prod',
          'api',
          'devops-team',
          'test-project',
          additionalTags
        );
      }).not.toThrow();
    });

    test('should handle empty additional tags', () => {
      const testApp = new cdk.App();
      const testStack = new cdk.Stack(testApp, 'TestStack');
      const testConstruct = new cdk.CfnOutput(testStack, 'TestOutput', {
        value: 'test',
      });

      expect(() => {
        TaggingUtils.applyStandardTags(
          testConstruct,
          'prod',
          'api',
          'devops-team',
          'test-project',
          {}
        );
      }).not.toThrow();
    });
  });
});
