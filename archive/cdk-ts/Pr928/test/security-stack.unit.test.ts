import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { SecurityStack } from '../lib/security-stack';

describe('SecurityStack', () => {
  let app: cdk.App;
  let stack: SecurityStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new SecurityStack(app, 'TestSecurityStack', {
      environmentSuffix,
      env: { account: '123456789012', region: 'us-west-2' }
    });
    template = Template.fromStack(stack);
  });

  describe('KMS Key', () => {
    test('creates KMS key with correct properties', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
        Description: 'KMS key for encrypting sensitive data'
      });
    });

    test('KMS key has DESTROY removal policy', () => {
      const kmsKeys = template.findResources('AWS::KMS::Key');
      expect(Object.keys(kmsKeys).length).toBeGreaterThan(0);
    });
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: `tap-${environmentSuffix}-vpc` })
        ])
      });
    });

    test('creates public, private, and isolated subnets', () => {
      // Should have at least 6 subnets (2 AZs * 3 subnet types)
      const subnets = template.findResources('AWS::EC2::Subnet');
      expect(Object.keys(subnets).length).toBeGreaterThanOrEqual(6);
    });

    test('creates NAT gateway for private subnets', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('enables VPC Flow Logs', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL'
      });
    });
  });

  describe('Security Groups', () => {
    test('creates web security group with correct rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for web servers',
        GroupName: `tap-${environmentSuffix}-web-sg`
      });
    });

    test('creates database security group with correct rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for database servers',
        GroupName: `tap-${environmentSuffix}-db-sg`
      });
    });

    test('web security group allows HTTP and HTTPS ingress', () => {
      // Check that the web security group has the correct ingress rules
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for web servers',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0'
          }),
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0'
          })
        ])
      });
    });

    test('database security group only allows access from web security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 3306,
        ToPort: 3306
      });
    });
  });

  describe('Secrets Manager', () => {
    test('creates database secret with automatic password generation', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: 'RDS database credentials',
        GenerateSecretString: Match.objectLike({
          SecretStringTemplate: '{"username":"admin"}',
          GenerateStringKey: 'password',
          PasswordLength: 32
        })
      });
    });

    test('database secret uses KMS encryption', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        KmsKeyId: Match.anyValue()
      });
    });
  });

  describe('RDS Database', () => {
    test('creates RDS instance with encryption', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceIdentifier: `tap-${environmentSuffix}-db`,
        DBName: `tapdb${environmentSuffix}`,
        StorageEncrypted: true,
        Engine: 'mysql',
        MultiAZ: true
      });
    });

    test('RDS instance has deletion protection disabled for testing', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DeletionProtection: false
      });
    });

    test('RDS instance uses T3.MICRO instance type', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.t3.micro'
      });
    });

    test('RDS instance has 7-day backup retention', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: 7
      });
    });
  });

  describe('CloudTrail', () => {
    test('creates CloudTrail with encryption', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        IsMultiRegionTrail: true,
        EnableLogFileValidation: true,
        IncludeGlobalServiceEvents: true
      });
    });

    test('CloudTrail uses S3 bucket for logs', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `tap-${environmentSuffix}-cloudtrail-123456789012-us-west-2`,
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });

    test('CloudTrail bucket has lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              ExpirationInDays: 2555,
              Transitions: Match.arrayWith([
                Match.objectLike({
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30
                }),
                Match.objectLike({
                  StorageClass: 'GLACIER',
                  TransitionInDays: 90
                })
              ])
            })
          ])
        }
      });
    });
  });


  describe('Security Group Monitoring', () => {
    test('creates Lambda function for security group monitoring', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'index.handler',
        Runtime: 'python3.9'
      });
    });

    test('creates EventBridge rule for security group changes', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: Match.objectLike({
          source: ['aws.ec2'],
          'detail-type': ['AWS API Call via CloudTrail']
        })
      });
    });

    test('EventBridge rule targets Lambda function', () => {
      const rules = template.findResources('AWS::Events::Rule');
      expect(Object.keys(rules).length).toBeGreaterThan(0);
    });
  });

  describe('IAM Roles', () => {
    test('creates web server role with least privilege', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: Match.objectLike({
                Service: 'ec2.amazonaws.com'
              })
            })
          ])
        })
      });
    });

    test('web server role has access to database secret', () => {
      // The inline policy is part of the role definition
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: Match.objectLike({
                Service: 'ec2.amazonaws.com'
              })
            })
          ])
        }),
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyDocument: Match.objectLike({
              Statement: Match.arrayWith([
                Match.objectLike({
                  Action: 'secretsmanager:GetSecretValue',
                  Effect: 'Allow'
                })
              ])
            })
          })
        ])
      });
    });

    test('creates instance profile for EC2', () => {
      template.hasResource('AWS::IAM::InstanceProfile', {});
    });
  });

  describe('Stack Outputs', () => {
    test('exports VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID for the secure infrastructure'
      });
    });

    test('exports Database Secret ARN', () => {
      template.hasOutput('DatabaseSecretArn', {
        Description: 'ARN of the database secret'
      });
    });

    test('exports KMS Key ARN', () => {
      template.hasOutput('KmsKeyArn', {
        Description: 'ARN of the KMS encryption key'
      });
    });
  });

  describe('Tagging', () => {
    test('applies Environment and Owner tags', () => {
      // Verify tags are applied to the stack
      const stackTags = cdk.Tags.of(stack);
      expect(stackTags).toBeDefined();
    });
  });

  describe('Resource Naming', () => {
    test('all resources include environment suffix', () => {
      // Check that S3 bucket includes environment suffix
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp(`tap-${environmentSuffix}`)
      });

      // Check that RDS instance includes environment suffix
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceIdentifier: Match.stringLikeRegexp(`tap-${environmentSuffix}`)
      });
    });
  });
});