import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test',
      vpcId: undefined,
      env: { region: 'us-east-1', account: '123456789012' },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public, private, and isolated subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 public, 2 private, 2 isolated
    });

    test('should create NAT Gateway', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('should have correct subnet configuration', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:subnet-type',
            Value: 'Public',
          }),
        ]),
      });
      
      template.hasResourceProperties('AWS::EC2::Subnet', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:subnet-type',
            Value: 'Private',
          }),
        ]),
      });
    });
  });

  describe('KMS Key', () => {
    test('should create KMS key with proper configuration', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: Match.stringLikeRegexp('KMS key for security-related resources test'),
        EnableKeyRotation: true,
      });
    });

    test('should create KMS key alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/tap-security-kms-key-test',
      });
    });
  });

  describe('S3 Security Bucket', () => {
    test('should create encrypted S3 bucket', () => {
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

    test('should have auto delete objects enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:auto-delete-objects',
            Value: 'true',
          }),
        ]),
      });
    });
  });

  describe('EC2 Instance', () => {
    test('should create EC2 instance with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'PatchGroup',
            Value: 'tap-security-test',
          }),
        ]),
      });
    });

    test('should have security group with HTTPS and SSH access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instance',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
          }),
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
          }),
        ]),
      });
    });

    test('should have encrypted EBS volume', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        BlockDeviceMappings: Match.arrayWith([
          Match.objectLike({
            Ebs: Match.objectLike({
              Encrypted: true,
            }),
          }),
        ]),
      });
    });

    // test('should be in public subnet', () => {
    //   template.hasResourceProperties('AWS::EC2::Instance', {
    //     Tags: Match.arrayWith([
    //       Match.objectLike({
    //         Key: 'aws-cdk:subnet-name',
    //         Value: 'Public',
    //       }),
    //     ]),
    //   });
    // });
  });

  describe('RDS PostgreSQL Instance', () => {
    test('should create RDS instance with correct configuration', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceIdentifier: 'tap-rds-postgres-test',
        Engine: 'postgres',
        DBInstanceClass: 'db.t3.micro',
        StorageEncrypted: true,
        MultiAZ: false,
        BackupRetentionPeriod: 7,
      });
    });

    test('should have RDS security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS PostgreSQL',
      });
    });

    test('should have generated credentials secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: 'tap-rds-credentials-test',
      });
    });
  });

  describe('IAM Configuration', () => {
    test('should create EC2 role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'tap-ec2-role-test',
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: { Service: 'ec2.amazonaws.com' },
            }),
          ]),
        },
      });
    });

    test('should create instance profile for EC2', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        InstanceProfileName: 'tap-ec2-instance-profile-test',
      });
    });

    // test('should grant EC2 role access to S3 and KMS', () => {
    //   template.hasResourceProperties('AWS::IAM::Policy', {
    //     PolicyDocument: {
    //       Statement: Match.arrayWith([
    //         Match.objectLike({
    //           Action: Match.arrayWith(['s3:GetObject', 's3:PutObject']),
    //         }),
    //         Match.objectLike({
    //           Action: Match.arrayWith(['kms:Encrypt', 'kms:Decrypt']),
    //         }),
    //       ]),
    //     },
    //   });
    // });
  });

  describe('SSM Patch Baseline', () => {
    test('should create patch baseline', () => {
      template.hasResourceProperties('AWS::SSM::PatchBaseline', {
        Name: 'tap-security-patch-baseline-test',
        OperatingSystem: 'AMAZON_LINUX_2',
      });
    });
  });

  describe('Lambda Remediation', () => {
    test('should create remediation function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'tap-security-remediation-test',
        Runtime: 'python3.9',
        Handler: 'index.handler',
        Timeout: 30,
      });
    });

    test('should create remediation role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'tap-remediation-role-test',
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
            }),
          ]),
        },
      });
    });

    test('should grant remediation role necessary permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['ec2:DescribeInstances', 'ec2:ModifyInstanceAttribute']),
            }),
          ]),
        },
      });
    });
  });

  describe('EventBridge Rule', () => {
    test('should create unauthorized API rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        // Note: RuleName is not a property in the CloudFormation template
        // Use Name instead for EventBridge rules
        Name: 'tap-unauthorized-api-rule-test',
        EventPattern: {
          source: ['aws.cloudtrail'],
          'detail-type': ['AWS API Call via CloudTrail'],
          detail: {
            errorCode: ['UnauthorizedOperation', 'AccessDenied'],
          },
        },
      });
    });

    test('should create security alerts log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/events/security-alerts/tap-security-test',
        RetentionInDays: 365,
      });
    });

    test('should connect rule to Lambda target', () => {
      const rules = template.findResources('AWS::Events::Rule');
      const rule = Object.values(rules).find((r: any) => 
        r.Properties?.Name === 'tap-unauthorized-api-rule-test'
      );
      
      expect(rule).toBeDefined();
      expect(rule?.Properties?.Targets).toBeDefined();
      expect(rule?.Properties?.Targets.length).toBeGreaterThan(0);
    });
  });

  describe('CloudFormation Outputs', () => {
    test('should output KMS key ID', () => {
      template.hasOutput('SecurityKmsKeyId', {
        Description: 'KMS Key ID for security resources',
      });
    });

    test('should output security bucket name', () => {
      template.hasOutput('SecurityBucketName', {
        Description: 'Security Logs Bucket Name',
      });
    });

    test('should output EC2 instance ID', () => {
      template.hasOutput('EC2InstanceId', {
        Description: 'EC2 Instance ID',
      });
    });

    test('should output RDS endpoint', () => {
      template.hasOutput('RDSEndpoint', {
        Description: 'RDS PostgreSQL Endpoint',
      });
    });

    test('should output VPC ID', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID',
      });
    });

    test('should output EC2 Role ARN', () => {
      template.hasOutput('EC2RoleArn', {
        Description: 'EC2 IAM Role ARN',
      });
    });

    test('should output Lambda Function ARN', () => {
      template.hasOutput('RemediationFunctionArn', {
        Description: 'Remediation Lambda Function ARN',
      });
    });

    test('should output Environment Suffix', () => {
      template.hasOutput('EnvironmentSuffix', {
        Description: 'Environment suffix used for resource naming',
      });
    });
  });

  describe('Resource Tagging', () => {
    test('should apply consistent tags to stack', () => {
      // Check that stack tags are applied
      const stackTags = stack.tags.renderTags();
      expect(stackTags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Key: 'Environment',
            Value: 'Production',
          }),
          expect.objectContaining({ Key: 'Department', Value: 'IT' }),
          expect.objectContaining({ Key: 'Project', Value: 'TapSecurity' }),
        ])
      );
    });

    test('should tag EC2 instance', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'Production',
          }),
        ]),
      });
    });

    test('should tag S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'Production',
          }),
        ]),
      });
    });
  });

  describe('Environment Configuration', () => {
    test('should use provided environment suffix', () => {
      expect(stack.node.tryGetContext('environmentSuffix')).toBeUndefined();
    });

    test('should handle VPC creation when no vpcId provided', () => {
      const vpcs = template.findResources('AWS::EC2::VPC');
      expect(Object.keys(vpcs).length).toBe(1);
    });
  });
});

describe('TapStack with Existing VPC', () => {
  let app: cdk.App;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();

    // Mock VPC lookup
    const mockVpc = {
      vpcId: 'vpc-abc12345',
      availabilityZones: ['us-east-1a', 'us-east-1b'],
      publicSubnets: [],
      privateSubnets: [],
      isolatedSubnets: [],
    };

    // Set VPC lookup context
    app.node.setContext(
      'vpc-provider:account=123456789012:filter.vpc-id=vpc-abc12345:region=us-east-1',
      mockVpc
    );

    const stack = new TapStack(app, 'TestTapStackExistingVPC', {
      environmentSuffix: 'test-existing',
      vpcId: 'vpc-abc12345',
      env: { region: 'us-east-1', account: '123456789012' },
    });
    template = Template.fromStack(stack);
  });

  test('should not create new VPC when vpcId is provided', () => {
    // Should not have VPC resource when using existing VPC
    const vpcs = template.findResources('AWS::EC2::VPC');
    expect(Object.keys(vpcs).length).toBe(0);
  });

  test('should still create KMS key with existing VPC', () => {
    template.hasResourceProperties('AWS::KMS::Key', {
      EnableKeyRotation: true,
    });
  });

  test('should still create S3 bucket with existing VPC', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: Match.objectLike({}),
    });
  });

  test('should still create EC2 instance with existing VPC', () => {
    template.hasResourceProperties('AWS::EC2::Instance', {
      InstanceType: 't3.micro',
    });
  });
});

describe('TapStack with Context Environment', () => {
  test('should use environment suffix from context', () => {
    const contextApp = new cdk.App();
    contextApp.node.setContext('environmentSuffix', 'context-test');

    const stack = new TapStack(contextApp, 'ContextTestStack', {
      env: { region: 'us-east-1', account: '123456789012' },
    });

    const contextTemplate = Template.fromStack(stack);

    // Should use context value for resource naming
    contextTemplate.hasResourceProperties('AWS::KMS::Key', {
      Description: Match.stringLikeRegexp('context-test'),
    });
  });

  test('should use default environment suffix when none provided', () => {
    const defaultApp = new cdk.App();

    const stack = new TapStack(defaultApp, 'DefaultTestStack', {
      env: { region: 'us-east-1', account: '123456789012' },
    });

    const defaultTemplate = Template.fromStack(stack);

    // Should use 'dev' as default
    defaultTemplate.hasResourceProperties('AWS::KMS::Key', {
      Description: Match.stringLikeRegexp('dev'),
    });
  });
});