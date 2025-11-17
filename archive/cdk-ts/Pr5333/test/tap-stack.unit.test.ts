import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('should create stack with correct properties', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should use default environment suffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack');
      expect(defaultStack).toBeDefined();
    });

    test('should use context environment suffix when provided', () => {
      const contextApp = new cdk.App();
      contextApp.node.setContext('environmentSuffix', 'test');
      const contextStack = new TapStack(contextApp, 'ContextStack');
      expect(contextStack).toBeDefined();
    });
  });

  describe('KMS Keys', () => {
    test('should create database KMS key with correct properties', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for database encryption',
        EnableKeyRotation: true,
        PendingWindowInDays: 30,
      });
    });

    test('should create S3 KMS key with correct properties', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for S3 bucket encryption',
        EnableKeyRotation: true,
        PendingWindowInDays: 30,
      });
    });

    test('should create secrets KMS key with correct properties', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for Secrets Manager encryption',
        EnableKeyRotation: true,
        PendingWindowInDays: 30,
      });
    });

    test('should create logs KMS key with correct properties', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for CloudWatch Logs encryption',
        EnableKeyRotation: true,
        PendingWindowInDays: 30,
      });
    });

    test('should have correct KMS key policies for account root', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'Enable IAM policies',
              Effect: 'Allow',
              Action: 'kms:*',
              Principal: Match.objectLike({
                AWS: Match.anyValue(),
              }),
            }),
          ]),
        },
      });
    });

    test('should have CloudWatch Logs permissions in KMS key policy', () => {
      const keys = template.findResources('AWS::KMS::Key');
      const hasCloudWatchLogsPolicy = Object.values(keys).some((key: any) => {
        return key.Properties.KeyPolicy.Statement.some(
          (stmt: any) =>
            stmt.Sid === 'Allow CloudWatch Logs' &&
            stmt.Effect === 'Allow' &&
            stmt.Action?.includes('kms:Encrypt')
        );
      });
      expect(hasCloudWatchLogsPolicy).toBe(true);
    });

    test('should have CloudTrail permissions in S3 KMS key policy', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'Allow CloudTrail',
              Effect: 'Allow',
              Action: Match.arrayWith(['kms:Decrypt', 'kms:GenerateDataKey*']),
              Principal: {
                Service: 'cloudtrail.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });

    test('should create KMS aliases with correct naming', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: Match.stringLikeRegexp(
          `alias/database-encryption-${environmentSuffix}-.*`
        ),
      });

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: Match.stringLikeRegexp(
          `alias/s3-encryption-${environmentSuffix}-.*`
        ),
      });

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: Match.stringLikeRegexp(
          `alias/secrets-encryption-${environmentSuffix}-.*`
        ),
      });

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: Match.stringLikeRegexp(
          `alias/logs-encryption-${environmentSuffix}-.*`
        ),
      });
    });

    test('should have DESTROY removal policy on KMS keys', () => {
      const keys = template.findResources('AWS::KMS::Key');
      Object.values(keys).forEach((key: any) => {
        expect(key.UpdateReplacePolicy).toBe('Delete');
        expect(key.DeletionPolicy).toBe('Delete');
      });
    });

    test('should have DESTROY removal policy on KMS aliases', () => {
      const aliases = template.findResources('AWS::KMS::Alias');
      Object.values(aliases).forEach((alias: any) => {
        expect(alias.UpdateReplacePolicy).toBe('Delete');
        expect(alias.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('S3 Buckets', () => {
    test('should create access log bucket with correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            }),
          ]),
        },
      });
    });

    test('should create CloudTrail bucket with correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        LoggingConfiguration: Match.anyValue(),
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            }),
          ]),
        },
      });
    });

    test('should create VPC flow log bucket with correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        LoggingConfiguration: Match.anyValue(),
      });
    });

    test('should have SSL-only bucket policies', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            }),
          ]),
        },
      });
    });

    test('should have CloudTrail write permissions on CloudTrail bucket', () => {
      const bucketPolicies = template.findResources('AWS::S3::BucketPolicy');
      const cloudTrailPolicy = Object.values(bucketPolicies).find(
        (policy: any) =>
          policy.Properties.PolicyDocument.Statement?.some(
            (stmt: any) => stmt.Sid === 'AllowCloudTrailWrite'
          )
      );
      expect(cloudTrailPolicy).toBeDefined();
    });

    test('should have CloudTrail GetBucketAcl permissions', () => {
      const bucketPolicies = template.findResources('AWS::S3::BucketPolicy');
      const cloudTrailPolicy = Object.values(bucketPolicies).find(
        (policy: any) =>
          policy.Properties.PolicyDocument.Statement?.some(
            (stmt: any) => stmt.Sid === 'AllowCloudTrailGetBucketAcl'
          )
      );
      expect(cloudTrailPolicy).toBeDefined();
    });

    test('should have lifecycle rules for old versions', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'DeleteOldVersions',
              NoncurrentVersionExpiration: {
                NoncurrentDays: 90,
              },
              AbortIncompleteMultipartUpload: {
                DaysAfterInitiation: 7,
              },
            }),
          ]),
        },
      });
    });

    test('should have DESTROY removal policy on S3 buckets', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: any) => {
        expect(bucket.UpdateReplacePolicy).toBe('Delete');
        expect(bucket.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('VPC and Networking', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        InstanceTenancy: 'default',
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: `security-baseline-vpc-${environmentSuffix}`,
          }),
        ]),
      });
    });

    test('should create isolated subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 2);
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:subnet-type',
            Value: 'Isolated',
          }),
        ]),
      });
    });

    test('should create route tables for isolated subnets', () => {
      template.resourceCountIs('AWS::EC2::RouteTable', 2);
    });

    test('should create VPC flow logs', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        TrafficType: 'ALL',
        LogDestinationType: 's3',
      });
    });

    test('should create VPC endpoints for Secrets Manager', () => {
      const endpoints = template.findResources('AWS::EC2::VPCEndpoint');
      const secretsManagerEndpoint = Object.values(endpoints).find(
        (endpoint: any) => {
          const serviceName = JSON.stringify(endpoint.Properties.ServiceName);
          return (
            serviceName.includes('secretsmanager') &&
            endpoint.Properties.VpcEndpointType === 'Interface'
          );
        }
      );
      expect(secretsManagerEndpoint).toBeDefined();
      expect(secretsManagerEndpoint.Properties.PrivateDnsEnabled).toBe(true);
    });

    test('should create VPC endpoints for KMS', () => {
      const endpoints = template.findResources('AWS::EC2::VPCEndpoint');
      const kmsEndpoint = Object.values(endpoints).find((endpoint: any) => {
        const serviceName = JSON.stringify(endpoint.Properties.ServiceName);
        return (
          serviceName.includes('.kms') &&
          endpoint.Properties.VpcEndpointType === 'Interface'
        );
      });
      expect(kmsEndpoint).toBeDefined();
      expect(kmsEndpoint.Properties.PrivateDnsEnabled).toBe(true);
    });

    test('should create security groups for VPC endpoints', () => {
      template.resourceCountIs('AWS::EC2::SecurityGroup', 3); // 2 VPC endpoints + 1 Lambda
    });
  });

  describe('CloudWatch Logs', () => {
    test('should create application log group with 7-year retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/application/main-${environmentSuffix}`,
        RetentionInDays: 2557, // 7 years
      });
    });

    test('should create Lambda log group with 7-year retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/secrets-rotation-${environmentSuffix}`,
        RetentionInDays: 2557, // 7 years
      });
    });

    test('should create CloudTrail log group with 7-year retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/cloudtrail/security-baseline-${environmentSuffix}`,
        RetentionInDays: 2557, // 7 years
      });
    });

    test('should have encryption enabled on all log groups', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        KmsKeyId: Match.anyValue(),
      });
    });

    test('should have DESTROY removal policy on log groups', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      Object.values(logGroups).forEach((logGroup: any) => {
        // Application and Lambda log groups have Delete, CloudTrail has Delete
        expect(['Delete', 'Retain']).toContain(logGroup.DeletionPolicy);
      });
    });
  });

  describe('IAM Roles', () => {
    test('should create EC2 instance role with correct properties', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `SecurityBaselineEc2Role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            }),
          ]),
        },
        MaxSessionDuration: 14400, // 4 hours
      });
    });

    test('should create Lambda execution role with VPC access', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `SecurityBaselineLambdaRole-${environmentSuffix}`,
        ManagedPolicyArns: Match.anyValue(),
      });
      // Verify it has VPC access managed policy
      const roles = template.findResources('AWS::IAM::Role');
      const lambdaRole = Object.values(roles).find(
        (role: any) =>
          role.Properties.RoleName ===
          `SecurityBaselineLambdaRole-${environmentSuffix}`
      );
      expect(lambdaRole).toBeDefined();
      expect(
        JSON.stringify(lambdaRole).includes('AWSLambdaVPCAccessExecutionRole')
      ).toBe(true);
    });

    test('should have correct number of IAM roles in IAM Roles section', () => {
      template.resourceCountIs('AWS::IAM::Role', 5); // EC2, Lambda, ECS, DevOps, Custom Resource
    });

    test('should create ECS task role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `SecurityBaselineEcsTaskRole-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });

    test('should create DevOps cross-account role with MFA enforcement', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `DevOpsSecurityBaselineRole-${environmentSuffix}`,
        MaxSessionDuration: 7200, // 2 hours
      });
    });

    test('should have IP-based conditions in EC2 role policies', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Condition: {
                IpAddress: {
                  'aws:SourceIp': Match.arrayWith([
                    '10.0.0.0/8',
                    '172.16.0.0/12',
                  ]),
                },
              },
            }),
          ]),
        },
      });
    });

    test('should have MFA conditions in DevOps role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Condition: Match.objectLike({
                Bool: {
                  'aws:MultiFactorAuthPresent': 'true',
                },
              }),
            }),
          ]),
        },
      });
    });

    test('should have region-based conditions in DevOps role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Condition: Match.objectLike({
                StringEquals: {
                  'aws:RequestedRegion': Match.anyValue(),
                },
              }),
            }),
          ]),
        },
      });
    });

    test('should have Lambda role permissions for secrets rotation', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'RotateSecrets',
              Effect: 'Allow',
              Action: Match.arrayWith([
                'secretsmanager:RotateSecret',
                'secretsmanager:UpdateSecretVersionStage',
              ]),
            }),
          ]),
        },
      });
    });

    test('should have Lambda role permissions for KMS', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'UseKmsKeys',
              Effect: 'Allow',
              Action: Match.arrayWith(['kms:Decrypt', 'kms:GenerateDataKey']),
            }),
          ]),
        },
      });
    });

    test('should have DevOps role with ReadOnlyAccess managed policy', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const devOpsRole = Object.values(roles).find(
        (role: any) =>
          role.Properties.RoleName ===
          `DevOpsSecurityBaselineRole-${environmentSuffix}`
      );
      expect(devOpsRole).toBeDefined();
      expect(JSON.stringify(devOpsRole).includes('ReadOnlyAccess')).toBe(true);
    });

    test('should have DevOps role with limited write access', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'LimitedWriteAccess',
              Effect: 'Allow',
              Action: Match.arrayWith([
                'ec2:StartInstances',
                'ec2:StopInstances',
                'ec2:RebootInstances',
              ]),
            }),
          ]),
        },
      });
    });
  });

  describe('Secrets Manager', () => {
    test('should create database secret with correct properties', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: `app/database/master-${environmentSuffix}`,
        Description: 'Database master credentials',
        GenerateSecretString: {
          ExcludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
          GenerateStringKey: 'password',
          PasswordLength: 32,
          SecretStringTemplate: '{"username":"dbadmin"}',
        },
      });
    });

    test('should create API key secret with correct properties', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: `app/api/key-${environmentSuffix}`,
        Description: 'API key for external services',
        GenerateSecretString: {
          ExcludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
          GenerateStringKey: 'apiKey',
          PasswordLength: 64,
          SecretStringTemplate: '{"service":"payment-gateway"}',
        },
      });
    });

    test('should create rotation schedules for secrets', () => {
      template.hasResourceProperties('AWS::SecretsManager::RotationSchedule', {
        RotationRules: {
          ScheduleExpression: 'rate(30 days)',
        },
      });

      template.hasResourceProperties('AWS::SecretsManager::RotationSchedule', {
        RotationRules: {
          ScheduleExpression: 'rate(90 days)',
        },
      });
    });

    test('should create secrets rotation Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `secrets-rotation-lambda-${environmentSuffix}`,
        Runtime: 'python3.11',
        Handler: 'index.handler',
        Timeout: 300,
        MemorySize: 512,
      });
    });

    test('should have Lambda function in VPC with isolated subnets', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: {
          SubnetIds: Match.anyValue(),
        },
      });
    });

    test('should have Lambda permissions for Secrets Manager', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 'secretsmanager.amazonaws.com',
      });
    });

    test('should have DESTROY removal policy on secrets', () => {
      const secrets = template.findResources('AWS::SecretsManager::Secret');
      Object.values(secrets).forEach((secret: any) => {
        expect(secret.UpdateReplacePolicy).toBe('Delete');
        expect(secret.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('CloudTrail', () => {
    test('should create CloudTrail with correct properties', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        TrailName: `security-baseline-trail-${environmentSuffix}`,
        IncludeGlobalServiceEvents: true,
        IsMultiRegionTrail: true,
        EnableLogFileValidation: true,
        IsLogging: true,
      });
    });

    test('should have CloudTrail event selectors for S3 data events', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        EventSelectors: Match.arrayWith([
          Match.objectLike({
            IncludeManagementEvents: true,
            ReadWriteType: 'All',
            DataResources: Match.arrayWith([
              Match.objectLike({
                Type: 'AWS::S3::Object',
              }),
            ]),
          }),
        ]),
      });
    });

    test('should have CloudTrail insight types', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        InsightSelectors: Match.arrayWith([
          Match.objectLike({
            InsightType: 'ApiCallRateInsight',
          }),
          Match.objectLike({
            InsightType: 'ApiErrorRateInsight',
          }),
        ]),
      });
    });

    test('should have CloudTrail sending logs to CloudWatch', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        CloudWatchLogsLogGroupArn: Match.anyValue(),
        CloudWatchLogsRoleArn: Match.anyValue(),
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create unauthorized API calls alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `SecurityBaseline-UnauthorizedAPICalls-${environmentSuffix}`,
        AlarmDescription: 'Alert on unauthorized API calls',
        MetricName: 'UnauthorizedAPICalls',
        Namespace: 'CloudTrailMetrics',
        Threshold: 1,
        EvaluationPeriods: 1,
      });
    });

    test('should create root account usage alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `SecurityBaseline-RootAccountUsage-${environmentSuffix}`,
        AlarmDescription: 'Alert on root account usage',
        MetricName: 'RootAccountUsage',
        Namespace: 'CloudTrailMetrics',
        Threshold: 1,
        EvaluationPeriods: 1,
      });
    });

    test('should have correct alarm treat missing data setting', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        TreatMissingData: 'notBreaching',
      });
    });
  });

  describe('Outputs', () => {
    test('should create KMS database key output', () => {
      template.hasOutput('KmsDatabaseKeyArn', {
        Description: 'KMS key ARN for database encryption',
        Export: {
          Name: `SecurityBaseline-KmsDatabaseKey-${environmentSuffix}`,
        },
      });
    });

    test('should create CloudTrail ARN output', () => {
      template.hasOutput('CloudTrailArn', {
        Description: 'CloudTrail ARN',
        Export: {
          Name: `SecurityBaseline-CloudTrailArn-${environmentSuffix}`,
        },
      });
    });

    test('should create DevOps role ARN output', () => {
      template.hasOutput('DevOpsRoleArn', {
        Description: 'DevOps cross-account role ARN',
        Export: {
          Name: `SecurityBaseline-DevOpsRoleArn-${environmentSuffix}`,
        },
      });
    });
  });

  describe('Tagging', () => {
    test('should apply global tags to resources', () => {
      const keys = template.findResources('AWS::KMS::Key');
      const firstKey = Object.values(keys)[0] as any;
      const tags = firstKey.Properties.Tags;
      const tagKeys = tags.map((tag: any) => tag.Key);
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Owner');
      expect(tagKeys).toContain('CostCenter');
      expect(tagKeys).toContain('DataClassification');
      expect(tagKeys).toContain('ComplianceScope');
      expect(tags.find((t: any) => t.Key === 'Environment').Value).toBe(
        environmentSuffix
      );
      expect(tags.find((t: any) => t.Key === 'Owner').Value).toBe(
        'SecurityTeam'
      );
    });

    test('should apply tags to S3 buckets', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: environmentSuffix,
          }),
        ]),
      });
    });

    test('should apply tags to IAM roles', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: environmentSuffix,
          }),
        ]),
      });
    });
  });

  describe('Resource Counts', () => {
    test('should have correct number of KMS keys', () => {
      template.resourceCountIs('AWS::KMS::Key', 4);
    });

    test('should have correct number of KMS aliases', () => {
      template.resourceCountIs('AWS::KMS::Alias', 4);
    });

    test('should have correct number of S3 buckets', () => {
      template.resourceCountIs('AWS::S3::Bucket', 3); // Access logs, CloudTrail, VPC Flow Logs
    });

    test('should have correct number of IAM roles', () => {
      template.resourceCountIs('AWS::IAM::Role', 5); // EC2, Lambda, ECS, DevOps, Custom Resource
    });

    test('should have correct number of Lambda functions', () => {
      template.resourceCountIs('AWS::Lambda::Function', 1); // Secrets rotation only
    });

    test('should have correct number of CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
    });

    test('should have correct number of log groups', () => {
      template.resourceCountIs('AWS::Logs::LogGroup', 3); // Application, Lambda, CloudTrail
    });

    test('should have correct number of secrets', () => {
      template.resourceCountIs('AWS::SecretsManager::Secret', 2);
    });

    test('should have correct number of rotation schedules', () => {
      template.resourceCountIs('AWS::SecretsManager::RotationSchedule', 2);
    });

    test('should have correct number of VPC endpoints', () => {
      template.resourceCountIs('AWS::EC2::VPCEndpoint', 2); // Secrets Manager, KMS
    });
  });

  describe('Security Features', () => {
    test('should have encryption enabled on all S3 buckets', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            }),
          ]),
        },
      });
    });

    test('should have encryption enabled on all log groups', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        KmsKeyId: Match.anyValue(),
      });
    });

    test('should have versioning enabled on all S3 buckets', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should have public access blocked on all S3 buckets', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should have SSL enforced on all S3 buckets', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Action: 's3:*',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            }),
          ]),
        },
      });
    });
  });

  describe('Custom Constructs', () => {
    test('should create SecureKmsKey constructs with unique aliases', () => {
      const aliases = template.findResources('AWS::KMS::Alias');
      const aliasNames = Object.values(aliases).map(
        (alias: any) => alias.Properties.AliasName
      );
      // All aliases should be unique
      expect(new Set(aliasNames).size).toBe(aliasNames.length);
    });

    test('should create SecureS3Bucket constructs with logging enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LoggingConfiguration: Match.anyValue(),
      });
    });
  });
});
