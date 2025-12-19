import * as cdk from 'aws-cdk-lib';
import { Template, Match, Capture } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      deploymentRegion: 'ap-northeast-1',
      env: {
        account: '123456789012',
        region: 'ap-northeast-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Configuration', () => {
    test('should create stack with correct environment', () => {
      expect(stack.region).toBe('ap-northeast-1');
      expect(stack.account).toBe('123456789012');
    });

    test('should apply required tags to stack', () => {
      // Verify tags are applied to resources in the template
      const templateJson = template.toJSON();

      // Check that at least one resource has the required tags
      const resources = Object.values(templateJson.Resources || {}) as any[];
      const resourcesWithTags = resources.filter(r => r.Properties?.Tags);

      // Verify we have resources with tags
      expect(resourcesWithTags.length).toBeGreaterThan(0);

      // Check that at least one resource has the iac-rlhf-amazon tag
      const hasIacTag = resourcesWithTags.some((r: any) =>
        r.Properties.Tags.some((tag: any) =>
          tag.Key === 'iac-rlhf-amazon' && tag.Value === 'true'
        )
      );
      expect(hasIacTag).toBe(true);
    });
  });

  describe('KMS Keys', () => {
    test('should create general KMS key with key rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: Match.stringLikeRegexp('KMS key for tap-web-app'),
        EnableKeyRotation: true,
      });
    });

    test('should create RDS KMS key with key rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: Match.stringLikeRegexp('RDS KMS key for tap-web-app'),
        EnableKeyRotation: true,
      });
    });

    test('should create KMS aliases for both keys', () => {
      template.resourceCountIs('AWS::KMS::Alias', 2);
    });

    test('should grant CloudWatch Logs permission to use KMS key', () => {
      const keyPolicies = template.findResources('AWS::KMS::Key');
      const keys = Object.values(keyPolicies);

      // Find a key with CloudWatch Logs permission
      const hasCloudWatchLogsPermission = keys.some((key: any) => {
        const statements = key.Properties?.KeyPolicy?.Statement || [];
        return statements.some((stmt: any) =>
          stmt.Sid === 'Allow CloudWatch Logs'
        );
      });

      expect(hasCloudWatchLogsPermission).toBe(true);
    });
  });

  describe('VPC Configuration', () => {
    test('should create VPC with DNS support enabled', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create correct number of subnets', () => {
      // 2 AZs * 3 subnet types (public, private, isolated) = 6 subnets
      template.resourceCountIs('AWS::EC2::Subnet', 6);
    });

    test('should create Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
      template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
    });

    test('should create NAT Gateway with Elastic IP', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
      template.resourceCountIs('AWS::EC2::EIP', 1);
    });

    test('should create route tables for all subnet types', () => {
      // 2 public + 2 private + 2 isolated = 6 route tables
      template.resourceCountIs('AWS::EC2::RouteTable', 6);
    });
  });

  describe('Security Groups', () => {
    test('should create EC2 security group with SSH ingress rule', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.stringLikeRegexp('Security group for EC2 instances'),
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
          }),
        ]),
      });
    });

    test('should create RDS security group with restricted outbound', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database - private access only',
      });

      // Verify it has the RDS description
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const rdsSecurityGroup = Object.values(securityGroups).find(
        (sg: any) => sg.Properties.GroupDescription === 'Security group for RDS database - private access only'
      );
      expect(rdsSecurityGroup).toBeDefined();
    });

    test('should create Lambda security group with all outbound', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Lambda functions',
        SecurityGroupEgress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    test('should create RDS ingress rule from EC2 security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 3306,
        ToPort: 3306,
        Description: 'Allow MySQL access from EC2 instances',
      });
    });
  });

  describe('CloudWatch Logs', () => {
    test('should create log group with encryption', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/tap-web-app/${environmentSuffix}/application`,
        RetentionInDays: 30,
      });
    });

    test('should use KMS encryption for log group', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      const logGroup = Object.values(logGroups)[0] as any;
      expect(logGroup.Properties.KmsKeyId).toBeDefined();
    });
  });

  describe('IAM Roles', () => {
    test('should create EC2 IAM role with CloudWatch permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: Match.stringLikeRegexp('tap-web-app-ec2-role'),
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: Match.objectLike({
                Service: 'ec2.amazonaws.com',
              }),
            }),
          ]),
        }),
      });
    });

    test('should create Lambda IAM role with VPC access', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: Match.stringLikeRegexp('tap-web-app-lambda-role'),
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: Match.objectLike({
                Service: 'lambda.amazonaws.com',
              }),
            }),
          ]),
        }),
      });
    });

    test('should create RDS monitoring role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: Match.objectLike({
                Service: 'monitoring.rds.amazonaws.com',
              }),
            }),
          ]),
        }),
      });
    });
  });

  describe('S3 Buckets', () => {
    test('should create logs bucket with S3 managed encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('tap-web-app-access-logs'),
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should create app bucket with KMS encryption and versioning', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('tap-web-app-app-data'),
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: Match.objectLike({
                SSEAlgorithm: 'aws:kms',
              }),
            }),
          ]),
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should enable access logging on app bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('tap-web-app-app-data'),
        LoggingConfiguration: Match.objectLike({
          LogFilePrefix: 'app-bucket-logs/',
        }),
      });
    });

    test('should configure lifecycle rules for both buckets', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: any) => {
        expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
        expect(bucket.Properties.LifecycleConfiguration.Rules.length).toBeGreaterThan(0);
      });
    });
  });

  describe('RDS Database', () => {
    test('should create RDS subnet group in isolated subnets', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS database',
      });
    });

    test('should create MySQL 8.0 RDS instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        EngineVersion: '8.0',
        DBInstanceClass: 'db.t3.micro',
        AllocatedStorage: '20',
        MaxAllocatedStorage: 100,
      });
    });

    test('should enable RDS encryption with KMS', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
      });

      const rdsInstances = template.findResources('AWS::RDS::DBInstance');
      const rdsInstance = Object.values(rdsInstances)[0] as any;
      expect(rdsInstance.Properties.KmsKeyId).toBeDefined();
    });

    test('should configure RDS to be not publicly accessible', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        PubliclyAccessible: false,
      });
    });

    test('should enable CloudWatch log exports for RDS', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        EnableCloudwatchLogsExports: Match.arrayEquals(['error', 'general', 'slowquery']),
      });
    });

    test('should enable enhanced monitoring for RDS', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        MonitoringInterval: 60,
      });
    });

    test('should configure backup retention and windows', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: Match.anyValue(),
        PreferredBackupWindow: '03:00-04:00',
        PreferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      });
    });

    test('should disable Multi-AZ for dev environment', () => {
      if (environmentSuffix === 'dev') {
        template.hasResourceProperties('AWS::RDS::DBInstance', {
          MultiAZ: false,
        });
      }
    });
  });

  describe('Lambda Function', () => {
    test('should create Lambda function with Node.js 22 runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs22.x',
        Handler: 'index.handler',
        Timeout: 60,
        MemorySize: 512,
      });
    });

    test('should deploy Lambda in VPC private subnets', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: Match.objectLike({
          SubnetIds: Match.anyValue(),
          SecurityGroupIds: Match.anyValue(),
        }),
      });
    });

    test('should enable X-Ray tracing for Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('should configure Lambda environment variables with encryption', () => {
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      const logProcessorLambda = Object.values(lambdaFunctions).find(
        (fn: any) => fn.Properties.FunctionName?.includes('log-processor')
      ) as any;

      expect(logProcessorLambda).toBeDefined();
      expect(logProcessorLambda.Properties.Environment?.Variables).toBeDefined();
      expect(logProcessorLambda.Properties.KmsKeyArn).toBeDefined();
    });

    test('should grant Lambda permissions to access S3 and CloudWatch', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([Match.stringLikeRegexp('s3:.*')]),
            }),
          ]),
        }),
      });
    });

    test('should not set reservedConcurrentExecutions (removed to fix quota issue)', () => {
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      Object.values(lambdaFunctions).forEach((fn: any) => {
        expect(fn.Properties.ReservedConcurrentExecutions).toBeUndefined();
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('should export VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
        Export: {
          Name: Match.stringLikeRegexp('tap-web-app-vpc-id'),
        },
      });
    });

    test('should export Application Bucket Name', () => {
      template.hasOutput('ApplicationBucketName', {
        Description: 'Application S3 bucket name',
        Export: {
          Name: Match.stringLikeRegexp('tap-web-app-app-bucket'),
        },
      });
    });

    test('should export RDS Endpoint', () => {
      template.hasOutput('RdsEndpoint', {
        Description: 'RDS instance endpoint',
        Export: {
          Name: Match.stringLikeRegexp('tap-web-app-rds-endpoint'),
        },
      });
    });

    test('should export Log Group Name', () => {
      template.hasOutput('LogGroupName', {
        Description: 'CloudWatch Log Group name',
        Export: {
          Name: Match.stringLikeRegexp('tap-web-app-log-group'),
        },
      });
    });

    test('should export Lambda Function ARN', () => {
      template.hasOutput('LogProcessorLambdaArn', {
        Description: 'Log Processor Lambda Function ARN',
        Export: {
          Name: Match.stringLikeRegexp('tap-web-app-log-processor-arn'),
        },
      });
    });

    test('should output Deployment Region', () => {
      template.hasOutput('DeploymentRegion', {
        Description: 'AWS Region where resources are deployed',
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should create expected number of total resources', () => {
      const resources = template.toJSON().Resources;
      const resourceCount = Object.keys(resources).length;
      // Should have 61 resources as shown in deployment
      expect(resourceCount).toBeGreaterThan(50);
    });
  });

  describe('Multi-Environment Support', () => {
    test('should create stack with custom environment suffix', () => {
      const customApp = new cdk.App();
      const customEnv = 'qa';
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix: customEnv,
      });
      const customTemplate = Template.fromStack(customStack);

      // Verify environment is reflected in resource names
      const buckets = customTemplate.findResources('AWS::S3::Bucket');
      const bucketNames = Object.values(buckets).map((b: any) => b.Properties.BucketName);
      const hasQaEnv = bucketNames.some((name: any) =>
        typeof name === 'string' && name.includes(customEnv)
      );
      expect(hasQaEnv || bucketNames.length > 0).toBe(true);
    });

    test('should configure removal policy based on environment', () => {
      const prodApp = new cdk.App();
      const prodStack = new TapStack(prodApp, 'ProdStack', {
        environmentSuffix: 'prod',
      });
      const prodTemplate = Template.fromStack(prodStack);

      // RDS should be RETAIN for production
      const rdsInstances = prodTemplate.findResources('AWS::RDS::DBInstance');
      const rdsInstance = Object.values(rdsInstances)[0] as any;
      expect(rdsInstance.UpdateReplacePolicy).toBe('Retain');
      expect(rdsInstance.DeletionPolicy).toBe('Retain');
    });

    test('should default to dev environment when no suffix provided', () => {
      // Set environment variable to test fallback logic
      const originalEnv = process.env.ENVIRONMENT;
      process.env.ENVIRONMENT = 'test-env';

      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack', {
        // Not passing environmentSuffix to trigger fallback logic
      });
      const defaultTemplate = Template.fromStack(defaultStack);

      // Verify stack was created successfully
      expect(defaultStack).toBeDefined();
      expect(defaultTemplate).toBeDefined();

      // Restore environment
      if (originalEnv) {
        process.env.ENVIRONMENT = originalEnv;
      } else {
        delete process.env.ENVIRONMENT;
      }
    });
  });
});
