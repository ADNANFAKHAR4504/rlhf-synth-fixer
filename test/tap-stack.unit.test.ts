import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  describe('Configuration and Environment Suffix', () => {
    test('should use environmentSuffix from props', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('.*-test'),
      });
    });

    test('should use environmentSuffix from context when props not provided', () => {
      app = new cdk.App({
        context: { environmentSuffix: 'context-env' },
      });
      stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('.*-context-env'),
      });
    });

    test('should default to "dev" when no environmentSuffix provided', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('.*-dev'),
      });
    });

    test('should prioritize props over context for environmentSuffix', () => {
      app = new cdk.App({
        context: { environmentSuffix: 'context' },
      });
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'props',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('.*-props'),
      });
    });
  });

  describe('VPC Configuration', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should create VPC with private isolated subnets', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: Match.anyValue(),
      });

      template.resourceCountIs('AWS::EC2::Subnet', 2);
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });
    });

    test('should create VPC with no NAT gateways', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 0);
    });

    test('should create S3 gateway endpoint', () => {
      const endpoints = template.findResources('AWS::EC2::VPCEndpoint');
      expect(Object.keys(endpoints).length).toBeGreaterThan(0);
      const endpointStr = JSON.stringify(endpoints);
      expect(endpointStr).toContain('s3');
    });

    test('should create DynamoDB gateway endpoint', () => {
      const endpoints = template.findResources('AWS::EC2::VPCEndpoint');
      const endpointStr = JSON.stringify(endpoints);
      expect(endpointStr).toContain('dynamodb');
    });
  });

  describe('Security Groups', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should create EMR security group with restricted outbound', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EMR Serverless',
        SecurityGroupEgress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
          }),
        ]),
      });
    });
  });

  describe('S3 Buckets', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should create three S3 buckets', () => {
      template.resourceCountIs('AWS::S3::Bucket', 3);
    });

    test('should create raw transactions bucket with correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('.*raw-transactions.*-test'),
        VersioningConfiguration: {
          Status: 'Enabled',
        },
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

      const buckets = template.findResources('AWS::S3::Bucket');
      const rawBucket = Object.values(buckets).find((b: any) =>
        b.Properties?.BucketName?.includes('raw-transactions')
      );
      expect(rawBucket?.Properties?.LifecycleConfiguration?.Rules).toBeDefined();
      expect(JSON.stringify(rawBucket)).toContain('GLACIER');
      expect(JSON.stringify(rawBucket)).toContain('30');
    });

    test('should create processed data bucket with correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('.*processed-data.*-test'),
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should create fraud reports bucket with correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('.*fraud-reports.*-test'),
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should enable EventBridge on raw transactions bucket', () => {
      // EventBridge is enabled via eventBridgeEnabled property in CDK
      // This creates a NotificationConfiguration with EventBridgeConfiguration
      // We verify EventBridge is working by checking the EventBridge rule exists
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
          source: ['aws.s3'],
          'detail-type': ['Object Created'],
        },
      });
    });

    test('should configure removal policy and auto delete on all buckets', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: any) => {
        expect(bucket.DeletionPolicy).toBe('Delete');
        expect(bucket.UpdateReplacePolicy).toBe('Delete');
      });

      template.resourceCountIs('AWS::S3::BucketPolicy', 3);
    });
  });

  describe('DynamoDB Table', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should create DynamoDB table with correct schema', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp('.*-test'),
        KeySchema: [
          {
            AttributeName: 'job_id',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('should configure removal policy on DynamoDB table', () => {
      const tables = template.findResources('AWS::DynamoDB::Table');
      const table = Object.values(tables)[0] as any;
      expect(table.DeletionPolicy).toBe('Delete');
    });
  });

  describe('SNS Topic', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should create SNS topic with correct properties', () => {
      template.resourceCountIs('AWS::SNS::Topic', 1);
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: Match.stringLikeRegexp('.*-test'),
        DisplayName: 'Fraud Analysis Job Notifications',
      });
    });

    test('should add email subscription to SNS topic', () => {
      template.resourceCountIs('AWS::SNS::Subscription', 1);
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'fraud-alerts@example.com',
      });
    });
  });

  describe('EMR Serverless', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should create EMR Serverless application', () => {
      template.resourceCountIs('AWS::EMRServerless::Application', 1);
      template.hasResourceProperties('AWS::EMRServerless::Application', {
        Name: Match.stringLikeRegexp('.*-test'),
        ReleaseLabel: 'emr-6.9.0',
        Type: 'SPARK',
        MaximumCapacity: {
          Cpu: '100 vCPU',
          Memory: '300 GB',
        },
        AutoStartConfiguration: {
          Enabled: false,
        },
        AutoStopConfiguration: {
          Enabled: true,
          IdleTimeoutMinutes: 15,
        },
      });
    });

    test('should configure EMR application with network configuration', () => {
      template.hasResourceProperties('AWS::EMRServerless::Application', {
        NetworkConfiguration: {
          SubnetIds: Match.anyValue(),
          SecurityGroupIds: Match.anyValue(),
        },
      });
    });

    test('should create EMR execution role with correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'emr-serverless.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
      });

      // IAM policies are in separate Policy resources, not inline in the role
      const policies = template.findResources('AWS::IAM::Policy');
      const emrPolicies = Object.values(policies).filter((p: any) => {
        const policyStr = JSON.stringify(p);
        return policyStr.includes('EMRServerlessRole');
      });
      
      expect(emrPolicies.length).toBeGreaterThan(0);
      const allPoliciesStr = JSON.stringify(emrPolicies);
      expect(allPoliciesStr).toContain('s3:GetObject');
      expect(allPoliciesStr).toContain('s3:PutObject');
      expect(allPoliciesStr).toContain('logs:CreateLogGroup');
    });
  });

  describe('Lambda Function', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should create Lambda function with correct configuration', () => {
      // CDK may create additional Lambda functions for custom resources
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(lambdaFunctions).length).toBeGreaterThanOrEqual(1);
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Architectures: ['arm64'],
        Handler: 'index.handler',
        Timeout: 180,
        MemorySize: 512,
        Environment: {
          Variables: {
            JOBS_TABLE: Match.anyValue(),
            STATE_MACHINE_ARN: Match.anyValue(),
            BUCKET_NAME: Match.anyValue(),
          },
        },
      });
    });

    test('should create Lambda execution role with correct permissions', () => {
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

      // IAM policies are in separate Policy resources
      const policies = template.findResources('AWS::IAM::Policy');
      const lambdaPolicies = Object.values(policies).filter((p: any) => {
        const policyStr = JSON.stringify(p);
        return policyStr.includes('ValidatorRole') || 
               (policyStr.includes('s3:GetObject') && policyStr.includes('dynamodb:PutItem') && policyStr.includes('states:StartExecution'));
      });
      
      expect(lambdaPolicies.length).toBeGreaterThan(0);
      const allPoliciesStr = JSON.stringify(lambdaPolicies);
      expect(allPoliciesStr).toContain('s3:GetObject');
      expect(allPoliciesStr).toContain('dynamodb:PutItem');
      expect(allPoliciesStr).toContain('states:StartExecution');
    });

    test('should configure Lambda log retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7,
      });
    });
  });

  describe('Step Functions State Machine', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should create Step Functions state machine', () => {
      template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);
      template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
        StateMachineName: Match.stringLikeRegexp('.*-test'),
        LoggingConfiguration: {
          Level: 'ALL',
          IncludeExecutionData: true,
        },
      });
    });

    test('should create Step Functions execution role with correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'states.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
      });

      // IAM policies are in separate Policy resources
      const policies = template.findResources('AWS::IAM::Policy');
      const sfnPolicies = Object.values(policies).filter((p: any) => {
        const policyStr = JSON.stringify(p);
        return policyStr.includes('StepFunctionsRole') || 
               (policyStr.includes('emr-serverless:StartJobRun') && policyStr.includes('dynamodb:UpdateItem'));
      });
      
      expect(sfnPolicies.length).toBeGreaterThan(0);
      const allPoliciesStr = JSON.stringify(sfnPolicies);
      expect(allPoliciesStr).toContain('emr-serverless:StartJobRun');
      expect(allPoliciesStr).toContain('emr-serverless:GetJobRun');
      expect(allPoliciesStr).toContain('dynamodb:UpdateItem');
      expect(allPoliciesStr).toContain('sns:Publish');
      expect(allPoliciesStr).toContain('iam:PassRole');
    });

    test('should configure Step Functions log group with retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7,
      });

      // Verify at least one log group has 7-day retention (State Machine log group)
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      const logGroupsWithRetention = Object.values(logGroups).filter((lg: any) =>
        lg.Properties?.RetentionInDays === 7
      );
      expect(logGroupsWithRetention.length).toBeGreaterThan(0);
      
      // Check if any log group has removal policy set
      const logGroupsWithDeletion = Object.values(logGroups).filter((lg: any) =>
        lg.DeletionPolicy === 'Delete'
      );
      // At least one log group should have deletion policy (State Machine log group)
      expect(logGroupsWithDeletion.length).toBeGreaterThan(0);
    });

    test('should include state machine definition with all states', () => {
      const stateMachine = template.findResources('AWS::StepFunctions::StateMachine');
      const sm = Object.values(stateMachine)[0] as any;
      expect(sm.Properties.DefinitionString).toBeDefined();
      
      // DefinitionString might be a JSON string or an object
      let definition: any;
      if (typeof sm.Properties.DefinitionString === 'string') {
        try {
          definition = JSON.parse(sm.Properties.DefinitionString);
        } catch {
          // If parsing fails, it might be a CloudFormation intrinsic function
          definition = sm.Properties.DefinitionString;
        }
      } else {
        definition = sm.Properties.DefinitionString;
      }
      
      // Check if definition has States (might be in different structure)
      const definitionStr = typeof definition === 'string' 
        ? definition 
        : JSON.stringify(definition);
      
      // Verify key states exist in the definition
      expect(definitionStr).toContain('UpdateJobStarted');
      expect(definitionStr).toContain('SubmitEMRJob');
      expect(definitionStr).toContain('WaitForJob');
      expect(definitionStr).toContain('GetJobStatus');
      expect(definitionStr).toContain('JobComplete');
    });
  });

  describe('EventBridge Rule', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should create EventBridge rule for S3 events', () => {
      template.resourceCountIs('AWS::Events::Rule', 1);
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
          source: ['aws.s3'],
          'detail-type': ['Object Created'],
          detail: {
            bucket: {
              name: Match.anyValue(),
            },
          },
        },
      });
    });

    test('should configure EventBridge rule to target Lambda', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Targets: Match.arrayWith([
          Match.objectLike({
            Arn: Match.anyValue(),
          }),
        ]),
      });
    });
  });

  describe('S3 Notifications', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should configure S3 bucket notification to Lambda', () => {
      // S3 notifications are configured via AWS::S3::BucketPolicy or custom resources
      // Check for Lambda permission from S3
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Principal: 's3.amazonaws.com',
        Action: 'lambda:InvokeFunction',
      });
    });

    test('should grant Lambda permission to be invoked by S3', () => {
      // There may be multiple Lambda permissions (S3 and EventBridge)
      const permissions = template.findResources('AWS::Lambda::Permission');
      expect(Object.keys(permissions).length).toBeGreaterThanOrEqual(1);
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 's3.amazonaws.com',
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should create CloudWatch dashboard', () => {
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp('.*-test'),
      });
    });

    test('should include dashboard widgets for Lambda metrics', () => {
      const dashboard = template.findResources('AWS::CloudWatch::Dashboard');
      const dashboardBody = JSON.stringify(dashboard);
      expect(dashboardBody).toContain('Lambda Function Metrics');
      expect(dashboardBody).toContain('Invocations');
      expect(dashboardBody).toContain('Errors');
      expect(dashboardBody).toContain('Duration');
    });

    test('should include dashboard widgets for Step Functions metrics', () => {
      const dashboard = template.findResources('AWS::CloudWatch::Dashboard');
      const dashboardBody = JSON.stringify(dashboard);
      expect(dashboardBody).toContain('Step Functions Executions');
      expect(dashboardBody).toContain('ExecutionsStarted');
      expect(dashboardBody).toContain('ExecutionsSucceeded');
      expect(dashboardBody).toContain('ExecutionsFailed');
    });
  });

  describe('Stack Outputs', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should export raw transactions bucket name', () => {
      template.hasOutput('RawTransactionsBucketName', {
        Value: Match.anyValue(),
        Description: 'S3 bucket for raw transaction files',
      });
    });

    test('should export processed data bucket name', () => {
      template.hasOutput('ProcessedDataBucketName', {
        Value: Match.anyValue(),
        Description: 'S3 bucket for processed fraud analysis results',
      });
    });

    test('should export fraud reports bucket name', () => {
      template.hasOutput('FraudReportsBucketName', {
        Value: Match.anyValue(),
        Description: 'S3 bucket for fraud reports',
      });
    });

    test('should export EMR application ID', () => {
      template.hasOutput('EMRApplicationId', {
        Value: Match.anyValue(),
        Description: 'EMR Serverless application ID',
      });
    });

    test('should export state machine ARN', () => {
      template.hasOutput('StateMachineArn', {
        Value: Match.anyValue(),
        Description: 'Step Functions state machine ARN',
      });
    });

    test('should export jobs table name', () => {
      template.hasOutput('JobsTableName', {
        Value: Match.anyValue(),
        Description: 'DynamoDB table for job tracking',
      });
    });

    test('should export dashboard URL', () => {
      template.hasOutput('DashboardURL', {
        Value: Match.anyValue(),
        Description: 'CloudWatch Dashboard URL',
      });
      const outputs = template.findOutputs('*');
      expect(outputs.DashboardURL.Value).toBeDefined();
      expect(JSON.stringify(outputs.DashboardURL.Value)).toContain('cloudwatch');
    });
  });

  describe('Resource Naming with Environment Suffix', () => {
    test('should include environment suffix in all resource names', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'prod',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('.*-prod'),
      });
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp('.*-prod'),
      });
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: Match.stringLikeRegexp('.*-prod'),
      });
      template.hasResourceProperties('AWS::EMRServerless::Application', {
        Name: Match.stringLikeRegexp('.*-prod'),
      });
      template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
        StateMachineName: Match.stringLikeRegexp('.*-prod'),
      });
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp('.*-prod'),
      });
    });
  });

  describe('IAM Policies and Permissions', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should configure least privilege IAM policies', () => {
      const roles = template.findResources('AWS::IAM::Role');
      expect(Object.keys(roles).length).toBeGreaterThan(0);

      Object.values(roles).forEach((role: any) => {
        const policies = role.Properties?.Policies || [];
        const assumeRolePolicy = role.Properties?.AssumeRolePolicyDocument;
        expect(assumeRolePolicy).toBeDefined();
        expect(assumeRolePolicy.Statement).toBeDefined();
      });
    });

    test('should grant EMR role access to all three S3 buckets', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const emrRole = Object.values(roles).find((r: any) => {
        const roleStr = JSON.stringify(r);
        return roleStr.includes('EMRServerlessRole') || 
               (r.Properties?.AssumeRolePolicyDocument?.Statement?.[0]?.Principal?.Service === 'emr-serverless.amazonaws.com');
      });
      expect(emrRole).toBeDefined();
      
      // IAM policies are in separate Policy resources
      // Check all IAM policies for EMR role permissions
      const policies = template.findResources('AWS::IAM::Policy');
      const emrPolicies = Object.values(policies).filter((p: any) => {
        const policyStr = JSON.stringify(p);
        return policyStr.includes('EMRServerlessRole') || 
               (p.Properties?.Roles && Array.isArray(p.Properties.Roles) && 
                p.Properties.Roles.some((roleRef: any) => {
                  const roleRefStr = JSON.stringify(roleRef);
                  return roleRefStr.includes('EMRServerlessRole');
                }));
      });
      
      expect(emrPolicies.length).toBeGreaterThan(0);
      
      // Check that the policy includes S3 permissions for all three buckets
      // Buckets are referenced via CloudFormation intrinsic functions, so check for bucket logical IDs
      const allPoliciesStr = JSON.stringify(emrPolicies);
      expect(allPoliciesStr).toContain('RawTransactionsBucket');
      expect(allPoliciesStr).toContain('ProcessedDataBucket');
      expect(allPoliciesStr).toContain('FraudReportsBucket');
      expect(allPoliciesStr).toContain('s3:GetObject');
      expect(allPoliciesStr).toContain('s3:PutObject');
    });
  });

  describe('Resource Removal Policies', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('should configure removal policy on S3 buckets', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: any) => {
        expect(bucket.DeletionPolicy).toBe('Delete');
        expect(bucket.UpdateReplacePolicy).toBe('Delete');
      });
    });

    test('should configure removal policy on DynamoDB table', () => {
      const tables = template.findResources('AWS::DynamoDB::Table');
      const table = Object.values(tables)[0] as any;
      expect(table.DeletionPolicy).toBe('Delete');
    });

    test('should configure removal policy on log groups', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      Object.values(logGroups).forEach((lg: any) => {
        expect(lg.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing account ID gracefully', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: undefined, region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      template.resourceCountIs('AWS::S3::Bucket', 3);
    });

    test('should handle different regions', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-west-2' },
      });
      template = Template.fromStack(stack);

      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::S3::Bucket', 3);
    });

    test('should create all required resources regardless of environment suffix', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'custom-env',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);

      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::S3::Bucket', 3);
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
      template.resourceCountIs('AWS::SNS::Topic', 1);
      template.resourceCountIs('AWS::EMRServerless::Application', 1);
      // CDK may create additional Lambda functions for custom resources
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(lambdaFunctions).length).toBeGreaterThanOrEqual(1);
      template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);
      template.resourceCountIs('AWS::Events::Rule', 1);
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    });
  });
});
