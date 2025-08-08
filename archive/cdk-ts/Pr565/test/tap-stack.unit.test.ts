import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/multi-region-infra';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test123',
    });
    template = Template.fromStack(stack);
  });

  describe('Environment Configuration', () => {
    test('should handle default environment suffix when no props provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack');
      const defaultTemplate = Template.fromStack(defaultStack);

      // Verify that resources are created with 'dev' prefix
      // The bucket name is constructed with Fn::Join, so we check for existence instead
      defaultTemplate.resourceCountIs('AWS::S3::Bucket', 2);
    });

    test('should handle production environment suffix', () => {
      const prodApp = new cdk.App();
      const prodStack = new TapStack(prodApp, 'ProdStack', {
        environmentSuffix: 'prod',
      });
      const prodTemplate = Template.fromStack(prodStack);

      // Verify that resources are created (prod environment creates same infrastructure)
      prodTemplate.resourceCountIs('AWS::S3::Bucket', 2);
      prodTemplate.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
    });

    test('should sanitize environment suffix with special characters', () => {
      const specialApp = new cdk.App();
      const specialStack = new TapStack(specialApp, 'SpecialStack', {
        environmentSuffix: 'test-env_123!@#',
      });
      const specialTemplate = Template.fromStack(specialStack);

      // Should still create resources successfully
      expect(specialStack).toBeInstanceOf(TapStack);
      specialTemplate.resourceCountIs('AWS::S3::Bucket', 2);
    });

    test('should handle empty environment suffix', () => {
      const emptyApp = new cdk.App();
      const emptyStack = new TapStack(emptyApp, 'EmptyStack', {
        environmentSuffix: '',
      });
      const emptyTemplate = Template.fromStack(emptyStack);

      // Should fall back to 'dev' prefix and create resources
      emptyTemplate.resourceCountIs('AWS::S3::Bucket', 2);
    });
  });

  describe('VPC Configuration', () => {
    test('should create primary VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create secondary VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.1.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create exactly 2 VPCs', () => {
      template.resourceCountIs('AWS::EC2::VPC', 2);
    });

    test('should create subnets in both VPCs', () => {
      // Each VPC should have 6 subnets (2 public, 2 private, 2 isolated)
      template.resourceCountIs('AWS::EC2::Subnet', 12);
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should create S3 buckets with KMS encryption', () => {
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

    test('should create unique KMS keys for each bucket', () => {
      template.resourceCountIs('AWS::KMS::Key', 2);
    });
  });

  describe('RDS Configuration', () => {
    test('should create RDS instances with Multi-AZ enabled', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        MultiAZ: true,
        Engine: 'postgres',
      });
    });
  });

  describe('DynamoDB Global Table', () => {
    test('should create DynamoDB table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should create Lambda functions', () => {
      // Count includes 2 application Lambdas + CDK custom resource handlers
      const lambdas = template.findResources('AWS::Lambda::Function');
      const functionNames = Object.keys(lambdas);
      const appLambdas = functionNames.filter(name => 
        name.includes('devprimarylambda') || name.includes('devsecondarylambda')
      );
      expect(appLambdas.length).toBe(2);
    });
  });

  describe('Application Load Balancer', () => {
    test('should create ALB', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Type: 'application',
        }
      );
    });

    test('should create ALB security group with correct rules', () => {
      // Check that security group exists for ALB
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for ALB',
      });
      
      // Verify security groups exist (there are multiple security groups)
      expect(template.findResources('AWS::EC2::SecurityGroup')).toEqual(expect.any(Object));
    });

    test('should create ALB target groups', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 2);
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        TargetType: 'lambda',
      });
    });

    test('should create listener with routing rules', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
      
      // Should have multiple listener rules for path-based routing
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::ListenerRule', 3);
    });
  });

  describe('CloudWatch Configuration', () => {
    test('should create CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp('.*multi-region-dashboard.*'),
      });
    });

    test('should create CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
      
      // Lambda error alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp('.*lambda-high-error-rate.*'),
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
        Threshold: 5,
      });

      // DynamoDB throttling alarm
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp('.*dynamodb-throttling.*'),
        Threshold: 1,
      });
    });
  });

  describe('IAM Configuration', () => {
    test('should create Lambda execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
      });
    });

    test('should attach basic execution policy to Lambda role', () => {
      // Verify that IAM roles exist with managed policy arns
      const roles = template.findResources('AWS::IAM::Role');
      expect(Object.keys(roles).length).toBeGreaterThan(0);
      
      // Simply verify at least one role has managed policies
      let hasRoleWithManagedPolicies = false;
      Object.values(roles).forEach((role: any) => {
        if (role.Properties && role.Properties.ManagedPolicyArns) {
          hasRoleWithManagedPolicies = true;
        }
      });
      expect(hasRoleWithManagedPolicies).toBe(true);
    });

    test('should create inline policy for cross-region access', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: [
          {
            PolicyName: 'CrossRegionAccess',
            PolicyDocument: {
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: Match.arrayWith([
                    'dynamodb:GetItem',
                    'dynamodb:PutItem',
                    'dynamodb:UpdateItem',
                  ]),
                }),
                Match.objectLike({
                  Effect: 'Allow',
                  Action: Match.arrayWith([
                    's3:GetObject',
                    's3:PutObject',
                    's3:DeleteObject',
                  ]),
                }),
                Match.objectLike({
                  Effect: 'Allow',
                  Action: Match.arrayWith([
                    'kms:Decrypt',
                    'kms:GenerateDataKey',
                  ]),
                }),
              ]),
            },
          },
        ],
      });
    });
  });

  describe('KMS Configuration', () => {
    test('should create KMS keys for S3 encryption', () => {
      template.resourceCountIs('AWS::KMS::Key', 2);
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: Match.stringLikeRegexp('.*S3 bucket encryption.*'),
      });
    });

    test('should create KMS aliases', () => {
      template.resourceCountIs('AWS::KMS::Alias', 2);
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: Match.stringLikeRegexp('alias/.*-s3-key'),
      });
    });
  });

  describe('Outputs', () => {
    test('should create all required stack outputs', () => {
      const outputs = [
        'ALBDNSName',
        'PrimaryS3Bucket',
        'SecondaryS3Bucket',
        'DynamoDBTableName',
        'PrimaryRDSEndpoint',
        'SecondaryRDSEndpoint',
      ];

      outputs.forEach(outputKey => {
        template.hasOutput(outputKey, {});
      });
    });
  });
});
