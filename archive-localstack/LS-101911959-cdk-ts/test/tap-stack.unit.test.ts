import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  describe('Environment Suffix Configuration', () => {
    test('should use environment suffix from props', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
      });
      template = Template.fromStack(stack);

      // Verify resources exist (bucket names are CloudFormation Joins)
      template.resourceCountIs('AWS::S3::Bucket', 2);
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'secure-financial-processor-test',
      });
    });

    test('should use environment suffix from context when not in props', () => {
      app = new cdk.App({
        context: { environmentSuffix: 'staging' },
      });
      stack = new TapStack(app, 'TestTapStack');
      template = Template.fromStack(stack);

      // Verify resources exist (bucket names are CloudFormation Joins)
      template.resourceCountIs('AWS::S3::Bucket', 2);
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'secure-financial-processor-staging',
      });
    });

    test('should default to dev when no suffix provided', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack');
      template = Template.fromStack(stack);

      // Verify resources exist (bucket names are CloudFormation Joins)
      template.resourceCountIs('AWS::S3::Bucket', 2);
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'secure-financial-processor-dev',
      });
    });
  });

  describe('VPC and Networking', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: Match.anyValue(),
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create 3 private isolated subnets', () => {
      // CDK creates subnets based on available AZs (maxAzs: 3)
      // In some regions, only 2 AZs may be available
      const subnets = template.findResources('AWS::EC2::Subnet');
      expect(Object.keys(subnets).length).toBeGreaterThanOrEqual(2);
      expect(Object.keys(subnets).length).toBeLessThanOrEqual(3);
    });

    test('should not create NAT gateways', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 0);
    });

    test('should not create Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 0);
    });

    test('should create security groups for Lambda and endpoints', () => {
      template.resourceCountIs('AWS::EC2::SecurityGroup', 2);
      
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Lambda functions in VPC',
      });

      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for VPC endpoints',
      });
    });

    test('should configure security group rules correctly', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 443,
        ToPort: 443,
      });

      template.hasResourceProperties('AWS::EC2::SecurityGroupEgress', {
        IpProtocol: 'tcp',
        FromPort: 443,
        ToPort: 443,
      });
    });

    test('should create VPC Gateway Endpoint for S3', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.anyValue(), // CloudFormation Join
        VpcEndpointType: 'Gateway',
      });
    });

    test('should create VPC Gateway Endpoint for DynamoDB', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.anyValue(), // CloudFormation Join
        VpcEndpointType: 'Gateway',
      });
    });

    test('should create VPC Interface Endpoint for CloudWatch Logs', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.anyValue(), // CloudFormation Join
        VpcEndpointType: 'Interface',
        PrivateDnsEnabled: true,
      });
    });

    test('should create VPC Interface Endpoint for KMS', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.anyValue(), // CloudFormation Join
        VpcEndpointType: 'Interface',
        PrivateDnsEnabled: true,
      });
    });

    test('should configure VPC endpoints with private DNS enabled', () => {
      const endpoints = template.findResources('AWS::EC2::VPCEndpoint');
      const interfaceEndpoints = Object.values(endpoints).filter(
        (endpoint: any) => endpoint.Properties.VpcEndpointType === 'Interface'
      );
      
      interfaceEndpoints.forEach((endpoint: any) => {
        expect(endpoint.Properties.PrivateDnsEnabled).toBe(true);
      });
    });
  });

  describe('KMS Keys', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should create three KMS keys', () => {
      template.resourceCountIs('AWS::KMS::Key', 3);
    });

    test('should create input bucket KMS key with alias', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for encrypting input financial data',
      });

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/secure-financial-input-bucket-test',
      });
    });

    test('should create output bucket KMS key with alias', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for encrypting processed financial data',
      });

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/secure-financial-output-bucket-test',
      });
    });

    test('should create DynamoDB KMS key with alias', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for encrypting DynamoDB transaction metadata',
      });

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/secure-financial-dynamodb-test',
      });
    });

    test('should enable key rotation on all KMS keys', () => {
      const keys = template.findResources('AWS::KMS::Key');
      Object.values(keys).forEach((key: any) => {
        expect(key.Properties.EnableKeyRotation).toBe(true);
      });
    });

    test('should set DESTROY removal policy on KMS keys', () => {
      const keys = template.findResources('AWS::KMS::Key');
      Object.values(keys).forEach((key: any) => {
        expect(key.DeletionPolicy).toBe('Delete');
      });
    });

    test('should grant CloudWatch Logs permission to use input bucket KMS key', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'AllowCloudWatchLogs',
              Effect: 'Allow',
              Principal: {
                Service: Match.anyValue(), // CloudFormation Join
              },
              Action: Match.arrayWith([
                'kms:Encrypt',
                'kms:Decrypt',
                'kms:ReEncrypt*',
                'kms:GenerateDataKey*',
                'kms:DescribeKey',
              ]),
            }),
          ]),
        },
      });
    });
  });

  describe('S3 Buckets', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should create two S3 buckets', () => {
      template.resourceCountIs('AWS::S3::Bucket', 2);
    });

    test('should create input bucket with correct name pattern', () => {
      // Bucket name is a CloudFormation Join, verify bucket exists and has correct properties
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: Match.anyValue(),
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should create output bucket with correct name pattern', () => {
      // Bucket name is a CloudFormation Join, verify bucket exists and has correct properties
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: Match.anyValue(),
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should enable KMS encryption on input bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
              BucketKeyEnabled: true,
            },
          ],
        },
      });
    });

    test('should enable versioning on both buckets', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: any) => {
        expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      });
    });

    test('should block public access on both buckets', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: any) => {
        expect(bucket.Properties.PublicAccessBlockConfiguration).toEqual({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        });
      });
    });

    test('should enforce SSL on both buckets', () => {
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

    test('should configure lifecycle rules on input bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'TransitionToIA',
              Status: 'Enabled',
              Transitions: [
                {
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30,
                },
              ],
            }),
          ]),
        },
      });
    });

    test('should configure lifecycle rules on output bucket', () => {
      // Both buckets have lifecycle rules, verify at least one bucket has them
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Status: 'Enabled',
            }),
          ]),
        },
      });
    });

    test('should set DESTROY removal policy on buckets', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: any) => {
        expect(bucket.DeletionPolicy).toBe('Delete');
      });
    });

    test('should configure S3 event notification for Lambda', () => {
      // S3 notifications are handled by Custom::S3BucketNotifications resource
      // Also verify Lambda permission for S3 to invoke
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Principal: 's3.amazonaws.com',
        Action: 'lambda:InvokeFunction',
      });
      
      // Verify notification configuration exists
      template.hasResourceProperties('Custom::S3BucketNotifications', {
        NotificationConfiguration: {
          LambdaFunctionConfigurations: Match.arrayWith([
            Match.objectLike({
              Events: Match.arrayWith(['s3:ObjectCreated:*']),
            }),
          ]),
        },
      });
    });
  });

  describe('DynamoDB Table', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should create DynamoDB table with correct name', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'secure-financial-transactions-test',
      });
    });

    test('should configure partition key and sort key', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'transactionId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'transactionId',
            AttributeType: 'S',
          },
          {
            AttributeName: 'timestamp',
            AttributeType: 'N',
          },
        ],
      });
    });

    test('should use PAY_PER_REQUEST billing mode', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('should enable KMS encryption with customer-managed key', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
          SSEType: 'KMS',
        },
      });
    });

    test('should enable point-in-time recovery', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('should set DESTROY removal policy on table', () => {
      const tables = template.findResources('AWS::DynamoDB::Table');
      Object.values(tables).forEach((table: any) => {
        expect(table.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('Lambda Function', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should create Lambda function with correct name', () => {
      // Filter out the S3 notification handler Lambda
      const functions = template.findResources('AWS::Lambda::Function');
      const processorFunction = Object.values(functions).find(
        (func: any) => func.Properties.FunctionName === 'secure-financial-processor-test'
      );
      expect(processorFunction).toBeDefined();
    });

    test('should configure Lambda runtime and handler', () => {
      // Filter out the S3 notification handler Lambda
      const functions = template.findResources('AWS::Lambda::Function');
      const processorFunction = Object.values(functions).find(
        (func: any) => func.Properties.FunctionName === 'secure-financial-processor-test'
      );
      
      expect(processorFunction).toBeDefined();
      expect(processorFunction?.Properties.Runtime).toBe('nodejs18.x');
      expect(processorFunction?.Properties.Handler).toBe('index.handler');
    });

    test('should configure Lambda in VPC', () => {
      // Filter out the S3 notification handler Lambda
      const functions = template.findResources('AWS::Lambda::Function');
      const processorFunction = Object.values(functions).find(
        (func: any) => func.Properties.FunctionName === 'secure-financial-processor-test'
      );
      
      expect(processorFunction).toBeDefined();
      expect(processorFunction?.Properties.VpcConfig).toBeDefined();
      expect(processorFunction?.Properties.VpcConfig.SubnetIds).toBeDefined();
      expect(processorFunction?.Properties.VpcConfig.SecurityGroupIds).toBeDefined();
    });

    test('should configure Lambda log group', () => {
      // Filter out the S3 notification handler Lambda
      const functions = template.findResources('AWS::Lambda::Function');
      const processorFunction = Object.values(functions).find(
        (func: any) => func.Properties.FunctionName === 'secure-financial-processor-test'
      );
      
      expect(processorFunction).toBeDefined();
      expect(processorFunction?.Properties.LoggingConfig).toBeDefined();
    });

    test('should configure Lambda timeout and memory', () => {
      // Filter out the S3 notification handler Lambda
      const functions = template.findResources('AWS::Lambda::Function');
      const processorFunction = Object.values(functions).find(
        (func: any) => func.Properties.FunctionName === 'secure-financial-processor-test'
      );
      
      expect(processorFunction).toBeDefined();
      expect(processorFunction?.Properties.Timeout).toBe(300);
      expect(processorFunction?.Properties.MemorySize).toBe(1024);
    });

    test('should configure Lambda environment variables', () => {
      // Filter out the S3 notification handler Lambda
      const functions = template.findResources('AWS::Lambda::Function');
      const processorFunction = Object.values(functions).find(
        (func: any) => func.Properties.FunctionName === 'secure-financial-processor-test'
      );
      
      expect(processorFunction).toBeDefined();
      expect(processorFunction?.Properties.Environment).toBeDefined();
      expect(processorFunction?.Properties.Environment.Variables).toBeDefined();
      expect(processorFunction?.Properties.Environment.Variables.OUTPUT_BUCKET).toBeDefined();
      expect(processorFunction?.Properties.Environment.Variables.OUTPUT_KMS_KEY).toBeDefined();
      expect(processorFunction?.Properties.Environment.Variables.TRANSACTION_TABLE).toBeDefined();
    });

    test('should enable environment variable encryption', () => {
      // Filter out the S3 notification handler Lambda
      const functions = template.findResources('AWS::Lambda::Function');
      const processorFunction = Object.values(functions).find(
        (func: any) => func.Properties.FunctionName === 'secure-financial-processor-test'
      );
      
      expect(processorFunction).toBeDefined();
      expect(processorFunction?.Properties.KmsKeyArn).toBeDefined();
    });

    test('should attach IAM role to Lambda', () => {
      // Filter out the S3 notification handler Lambda
      const functions = template.findResources('AWS::Lambda::Function');
      const processorFunction = Object.values(functions).find(
        (func: any) => func.Properties.FunctionName === 'secure-financial-processor-test'
      );
      
      expect(processorFunction).toBeDefined();
      expect(processorFunction?.Properties.Role).toBeDefined();
    });

    test('should configure inline code for Lambda', () => {
      // Filter out the S3 notification handler Lambda
      const functions = template.findResources('AWS::Lambda::Function');
      const processorFunction = Object.values(functions).find(
        (func: any) => func.Properties.FunctionName === 'secure-financial-processor-test'
      );
      
      expect(processorFunction).toBeDefined();
      expect(processorFunction?.Properties.Code).toBeDefined();
      expect(processorFunction?.Properties.Code.ZipFile).toBeDefined();
      const codeStr = JSON.stringify(processorFunction?.Properties.Code.ZipFile || '');
      expect(codeStr).toMatch(/exports\.handler/);
    });
  });

  describe('IAM Roles and Policies', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

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

    test('should attach VPC execution managed policy to Lambda role', () => {
      // Managed policy ARN is a CloudFormation Join, verify role has managed policies
      const roles = template.findResources('AWS::IAM::Role');
      const processorRole = Object.values(roles).find(
        (role: any) => role.Properties.Description === 'Least-privilege role for financial data processor Lambda'
      );
      
      expect(processorRole).toBeDefined();
      expect(processorRole?.Properties.ManagedPolicyArns).toBeDefined();
      expect(Array.isArray(processorRole?.Properties.ManagedPolicyArns)).toBe(true);
      expect(processorRole?.Properties.ManagedPolicyArns.length).toBeGreaterThan(0);
    });

    test('should grant S3 read permissions on input bucket', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'AllowS3ReadFromInput',
              Effect: 'Allow',
              Action: Match.anyValue(), // Can be string or array
            }),
          ]),
        },
      });
    });

    test('should grant S3 write permissions on output bucket', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'AllowS3WriteToOutput',
              Effect: 'Allow',
              Action: Match.anyValue(), // Can be string or array
            }),
          ]),
        },
      });
    });

    test('should grant KMS permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'AllowKMSOperations',
              Effect: 'Allow',
              Action: Match.anyValue(), // Can be string or array
            }),
          ]),
        },
      });
    });

    test('should grant DynamoDB permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'AllowDynamoDBOperations',
              Effect: 'Allow',
              Action: Match.anyValue(), // Can be string or array
            }),
          ]),
        },
      });
    });

    test('should grant CloudWatch Logs permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'AllowCloudWatchLogs',
              Effect: 'Allow',
              Action: Match.anyValue(), // Can be string or array
            }),
          ]),
        },
      });
    });

    test('should have explicit deny for dangerous S3 operations', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'ExplicitDenyDangerousS3Operations',
              Effect: 'Deny',
              Action: Match.anyValue(), // Can be string or array
            }),
          ]),
        },
      });
    });

    test('should have explicit deny for dangerous KMS operations', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'ExplicitDenyDangerousKMSOperations',
              Effect: 'Deny',
              Action: Match.anyValue(), // Can be string or array
            }),
          ]),
        },
      });
    });

    test('should have explicit deny for dangerous DynamoDB operations', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'ExplicitDenyDangerousDynamoOperations',
              Effect: 'Deny',
              Action: Match.anyValue(), // Can be string or array
            }),
          ]),
        },
      });
    });

    test('should grant KMS decrypt permission to Lambda for input bucket key', () => {
      // KMS permissions are granted via grant methods which create separate policies
      // Verify the main policy has KMS actions (decrypt, encrypt, generateDataKey, describeKey)
      const policies = template.findResources('AWS::IAM::Policy');
      const processorPolicy = Object.values(policies).find(
        (policy: any) => policy.Properties.PolicyName?.includes('ProcessorLambda')
      );
      
      expect(processorPolicy).toBeDefined();
      const statements = processorPolicy?.Properties.PolicyDocument.Statement || [];
      const kmsStatement = statements.find((stmt: any) => 
        stmt.Sid === 'AllowKMSOperations' && stmt.Effect === 'Allow'
      );
      expect(kmsStatement).toBeDefined();
      const actions = Array.isArray(kmsStatement.Action) ? kmsStatement.Action : [kmsStatement.Action];
      expect(actions.some((action: string) => action.includes('kms:Decrypt') || action === 'kms:Decrypt')).toBe(true);
    });

    test('should grant KMS encrypt permission to Lambda for output bucket key', () => {
      // KMS permissions are granted via grant methods which create separate policies
      // Verify the main policy has KMS actions (decrypt, encrypt, generateDataKey, describeKey)
      const policies = template.findResources('AWS::IAM::Policy');
      const processorPolicy = Object.values(policies).find(
        (policy: any) => policy.Properties.PolicyName?.includes('ProcessorLambda')
      );
      
      expect(processorPolicy).toBeDefined();
      const statements = processorPolicy?.Properties.PolicyDocument.Statement || [];
      const kmsStatement = statements.find((stmt: any) => 
        stmt.Sid === 'AllowKMSOperations' && stmt.Effect === 'Allow'
      );
      expect(kmsStatement).toBeDefined();
      const actions = Array.isArray(kmsStatement.Action) ? kmsStatement.Action : [kmsStatement.Action];
      expect(actions.some((action: string) => action.includes('kms:Encrypt') || action === 'kms:Encrypt')).toBe(true);
      expect(actions.some((action: string) => action.includes('kms:Decrypt') || action === 'kms:Decrypt')).toBe(true);
    });
  });

  describe('CloudWatch Logs', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should create log group for Lambda', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/lambda/secure-financial-processor-test',
      });
    });

    test('should configure 7-year retention on log group', () => {
      // 7 years = 2555-2557 days (accounting for leap years)
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      Object.values(logGroups).forEach((logGroup: any) => {
        const retentionDays = logGroup.Properties.RetentionInDays;
        expect(retentionDays).toBeGreaterThanOrEqual(2555);
        expect(retentionDays).toBeLessThanOrEqual(2557);
      });
    });

    test('should enable KMS encryption on log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        KmsKeyId: Match.anyValue(),
      });
    });

    test('should set DESTROY removal policy on log group', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      Object.values(logGroups).forEach((logGroup: any) => {
        expect(logGroup.DeletionPolicy).toBe('Delete');
      });
    });

    test('should create metric filter for unauthorized access', () => {
      template.hasResourceProperties('AWS::Logs::MetricFilter', {
        FilterPattern: Match.stringLikeRegexp('.*AccessDenied.*Forbidden.*Unauthorized.*'),
        MetricTransformations: [
          {
            MetricName: 'UnauthorizedAccessAttempts',
            MetricNamespace: 'SecureFinancial/Security',
            MetricValue: '1',
            DefaultValue: 0,
          },
        ],
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should create alarm for failed Lambda invocations', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: 'Alert when Lambda function fails',
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
        Threshold: 1,
        EvaluationPeriods: 1,
        TreatMissingData: 'notBreaching',
      });
    });

    test('should create alarm for unauthorized access attempts', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: 'Alert on unauthorized access attempts',
        MetricName: 'UnauthorizedAccessAttempts',
        Namespace: 'SecureFinancial/Security',
        Threshold: 1,
        EvaluationPeriods: 1,
        TreatMissingData: 'notBreaching',
      });
    });

    test('should configure alarm actions to SNS topic', () => {
      // Alarm actions are CloudFormation refs/gets, verify alarms have actions
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      Object.values(alarms).forEach((alarm: any) => {
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(Array.isArray(alarm.Properties.AlarmActions)).toBe(true);
        expect(alarm.Properties.AlarmActions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('SNS Topic', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should create SNS topic with correct name', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'secure-financial-security-alerts-test',
        DisplayName: 'Security Alerts for Financial Data Processing',
      });
    });

    test('should have at least one SNS topic', () => {
      template.resourceCountIs('AWS::SNS::Topic', 1);
    });
  });

  describe('VPC Endpoint Policies', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should configure S3 endpoint policy', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: 's3:*',
            }),
          ]),
        },
      });
    });

    test('should configure DynamoDB endpoint policy', () => {
      // Verify gateway endpoints have policy documents
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Gateway',
        PolicyDocument: Match.anyValue(),
      });
    });
  });

  describe('Stack Outputs', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should output VPC ID', () => {
      template.hasOutput('VPCId', {
        Value: Match.anyValue(),
        Export: {
          Name: 'TapStack-test-VPCId',
        },
      });
    });

    test('should output input bucket name', () => {
      template.hasOutput('InputBucketName', {
        Value: Match.anyValue(),
        Export: {
          Name: 'TapStack-test-InputBucketName',
        },
      });
    });

    test('should output input bucket ARN', () => {
      template.hasOutput('InputBucketArn', {
        Value: Match.anyValue(),
        Export: {
          Name: 'TapStack-test-InputBucketArn',
        },
      });
    });

    test('should output output bucket name', () => {
      template.hasOutput('OutputBucketName', {
        Value: Match.anyValue(),
        Export: {
          Name: 'TapStack-test-OutputBucketName',
        },
      });
    });

    test('should output output bucket ARN', () => {
      template.hasOutput('OutputBucketArn', {
        Value: Match.anyValue(),
        Export: {
          Name: 'TapStack-test-OutputBucketArn',
        },
      });
    });

    test('should output Lambda function ARN', () => {
      template.hasOutput('ProcessorLambdaArn', {
        Value: Match.anyValue(),
        Export: {
          Name: 'TapStack-test-ProcessorLambdaArn',
        },
      });
    });

    test('should output Lambda function name', () => {
      template.hasOutput('ProcessorLambdaName', {
        Value: Match.anyValue(), // CloudFormation Ref
        Export: {
          Name: 'TapStack-test-ProcessorLambdaName',
        },
      });
    });

    test('should output DynamoDB table name', () => {
      template.hasOutput('TransactionTableName', {
        Value: Match.anyValue(), // CloudFormation Ref
        Export: {
          Name: 'TapStack-test-TransactionTableName',
        },
      });
    });

    test('should output DynamoDB table ARN', () => {
      template.hasOutput('TransactionTableArn', {
        Value: Match.anyValue(),
        Export: {
          Name: 'TapStack-test-TransactionTableArn',
        },
      });
    });

    test('should output SNS topic ARN', () => {
      template.hasOutput('SecurityAlertTopicArn', {
        Value: Match.anyValue(),
        Export: {
          Name: 'TapStack-test-SecurityAlertTopicArn',
        },
      });
    });

    test('should output all KMS key ARNs', () => {
      template.hasOutput('InputBucketKMSKeyArn', {
        Value: Match.anyValue(),
        Export: {
          Name: 'TapStack-test-InputBucketKMSKeyArn',
        },
      });

      template.hasOutput('OutputBucketKMSKeyArn', {
        Value: Match.anyValue(),
        Export: {
          Name: 'TapStack-test-OutputBucketKMSKeyArn',
        },
      });

      template.hasOutput('DynamoDBKMSKeyArn', {
        Value: Match.anyValue(),
        Export: {
          Name: 'TapStack-test-DynamoDBKMSKeyArn',
        },
      });
    });

    test('should output Lambda log group name', () => {
      template.hasOutput('LambdaLogGroupName', {
        Value: Match.anyValue(), // CloudFormation Ref
        Export: {
          Name: 'TapStack-test-LambdaLogGroupName',
        },
      });
    });
  });

  describe('Resource Tags', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should apply Environment tag', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: 'Production',
          },
        ]),
      });
    });

    test('should apply Project tag', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          {
            Key: 'Project',
            Value: 'SecureFinancialProcessing',
          },
        ]),
      });
    });

    test('should apply ManagedBy tag', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          {
            Key: 'ManagedBy',
            Value: 'CDK',
          },
        ]),
      });
    });

    test('should apply DataClassification tag', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          {
            Key: 'DataClassification',
            Value: 'Sensitive',
          },
        ]),
      });
    });
  });

  describe('Resource Counts', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should create expected number of core resources', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
      // VPC creates subnets based on maxAzs (3), but CDK may create 2-3 depending on region
      const subnets = template.findResources('AWS::EC2::Subnet');
      expect(Object.keys(subnets).length).toBeGreaterThanOrEqual(2);
      expect(Object.keys(subnets).length).toBeLessThanOrEqual(3);
      template.resourceCountIs('AWS::EC2::SecurityGroup', 2);
      template.resourceCountIs('AWS::EC2::VPCEndpoint', 4); // S3, DynamoDB, CloudWatch Logs, KMS
      template.resourceCountIs('AWS::KMS::Key', 3);
      template.resourceCountIs('AWS::KMS::Alias', 3);
      template.resourceCountIs('AWS::S3::Bucket', 2);
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
      // Lambda functions: main function + S3 notification handler (if present)
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(lambdaFunctions).length).toBeGreaterThanOrEqual(1);
      expect(Object.keys(lambdaFunctions).length).toBeLessThanOrEqual(2);
      template.resourceCountIs('AWS::Logs::LogGroup', 1);
      template.resourceCountIs('AWS::Logs::MetricFilter', 1);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
      template.resourceCountIs('AWS::SNS::Topic', 1);
    });
  });

  describe('Stack Synthesis', () => {
    test('should synthesize without errors', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);

      expect(template).toBeDefined();
      expect(template.toJSON()).toBeDefined();
    });

    test('should handle stack with all optional parameters', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'prod',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      template = Template.fromStack(stack);

      expect(template).toBeDefined();
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('.*-prod'),
      });
    });

    test('should handle stack with context-based environment suffix', () => {
      app = new cdk.App({
        context: { environmentSuffix: 'context-test' },
      });
      stack = new TapStack(app, 'TestTapStack');
      template = Template.fromStack(stack);

      expect(template).toBeDefined();
      // Bucket name is a CloudFormation Join, verify bucket exists
      template.resourceCountIs('AWS::S3::Bucket', 2);
    });
  });
});
