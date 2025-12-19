import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'prod';

describe('Crowdfunding Platform CloudFormation Template - Comprehensive Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // Convert YAML to JSON: run `cfn-flip lib/TapStack.yml > lib/TapStack.json`
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // ==================== Template Structure Tests ====================
  describe('Template Structure and Metadata', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have comprehensive description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Crowdfunding Platform');
      expect(template.Description).toContain('milestone-based');
    });

    test('should have metadata section with parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toBeDefined();
    });

    test('should have minimum 30 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(30);
    });

    test('should have minimum 20 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(20);
    });
  });

  // ==================== Parameters Tests ====================
  describe('Parameters Configuration', () => {
    test('should have EnvironmentSuffix parameter with correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('prod');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('should have CampaignMediaBucketName parameter', () => {
      const param = template.Parameters.CampaignMediaBucketName;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toContain('campaign-media');
    });

    test('should have AthenaResultsBucketName parameter', () => {
      const param = template.Parameters.AthenaResultsBucketName;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.AllowedPattern).toBe('^[a-z0-9-]+$');
    });
  });

  // ==================== KMS Security Tests ====================
  describe('KMS Encryption Key Configuration', () => {
    test('should have PaymentDataEncryptionKey resource', () => {
      expect(template.Resources.PaymentDataEncryptionKey).toBeDefined();
      expect(template.Resources.PaymentDataEncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have key rotation enabled', () => {
      const key = template.Resources.PaymentDataEncryptionKey;
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });

    test('should have proper key policy with IAM permissions', () => {
      const key = template.Resources.PaymentDataEncryptionKey;
      expect(key.Properties.KeyPolicy).toBeDefined();
      expect(key.Properties.KeyPolicy.Statement).toBeDefined();
      expect(key.Properties.KeyPolicy.Statement.length).toBeGreaterThanOrEqual(2);
    });

    test('should have KMS key alias', () => {
      const alias = template.Resources.PaymentDataEncryptionKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName['Fn::Sub']).toContain('crowdfunding-payment-key');
    });

    test('should have proper tags on KMS key', () => {
      const key = template.Resources.PaymentDataEncryptionKey;
      expect(key.Properties.Tags).toBeDefined();
      expect(key.Properties.Tags.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ==================== DynamoDB Tables Tests ====================
  describe('CampaignsTable DynamoDB Configuration', () => {
    test('should exist with correct type', () => {
      const table = template.Resources.CampaignsTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('should have correct table name with environment suffix', () => {
      const table = template.Resources.CampaignsTable;
      expect(table.Properties.TableName['Fn::Sub']).toBe('Campaigns${EnvironmentSuffix}');
    });

    test('should use PAY_PER_REQUEST billing mode', () => {
      const table = template.Resources.CampaignsTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should have point-in-time recovery enabled', () => {
      const table = template.Resources.CampaignsTable;
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('should have KMS encryption enabled', () => {
      const table = template.Resources.CampaignsTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(table.Properties.SSESpecification.SSEType).toBe('KMS');
      expect(table.Properties.SSESpecification.KMSMasterKeyId).toEqual({ Ref: 'PaymentDataEncryptionKey' });
    });

    test('should have DynamoDB streams enabled', () => {
      const table = template.Resources.CampaignsTable;
      expect(table.Properties.StreamSpecification).toBeDefined();
      expect(table.Properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('should have correct attribute definitions', () => {
      const table = template.Resources.CampaignsTable;
      const attrs = table.Properties.AttributeDefinitions;
      expect(attrs).toBeDefined();
      expect(attrs.length).toBe(4);
      const attrNames = attrs.map((a: any) => a.AttributeName);
      expect(attrNames).toContain('campaignId');
      expect(attrNames).toContain('creatorId');
      expect(attrNames).toContain('status');
      expect(attrNames).toContain('deadline');
    });

    test('should have correct key schema with campaignId as HASH', () => {
      const table = template.Resources.CampaignsTable;
      const keySchema = table.Properties.KeySchema;
      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('campaignId');
      expect(keySchema[0].KeyType).toBe('HASH');
    });

    test('should have 2 Global Secondary Indexes', () => {
      const table = template.Resources.CampaignsTable;
      expect(table.Properties.GlobalSecondaryIndexes).toBeDefined();
      expect(table.Properties.GlobalSecondaryIndexes.length).toBe(2);
    });

    test('should have CreatorIdIndex GSI', () => {
      const table = template.Resources.CampaignsTable;
      const gsi = table.Properties.GlobalSecondaryIndexes.find((g: any) => g.IndexName === 'CreatorIdIndex');
      expect(gsi).toBeDefined();
      expect(gsi.KeySchema[0].AttributeName).toBe('creatorId');
      expect(gsi.Projection.ProjectionType).toBe('ALL');
    });

    test('should have StatusDeadlineIndex GSI with composite key', () => {
      const table = template.Resources.CampaignsTable;
      const gsi = table.Properties.GlobalSecondaryIndexes.find((g: any) => g.IndexName === 'StatusDeadlineIndex');
      expect(gsi).toBeDefined();
      expect(gsi.KeySchema).toHaveLength(2);
      expect(gsi.KeySchema[0].AttributeName).toBe('status');
      expect(gsi.KeySchema[0].KeyType).toBe('HASH');
      expect(gsi.KeySchema[1].AttributeName).toBe('deadline');
      expect(gsi.KeySchema[1].KeyType).toBe('RANGE');
    });

    test('should have Retain deletion policy', () => {
      const table = template.Resources.CampaignsTable;
      expect(table.DeletionPolicy).toBe('Retain');
      expect(table.UpdateReplacePolicy).toBe('Retain');
    });
  });

  describe('ContributionsTable DynamoDB Configuration', () => {
    test('should exist with correct configuration', () => {
      const table = template.Resources.ContributionsTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.TableName['Fn::Sub']).toBe('Contributions${EnvironmentSuffix}');
    });

    test('should have correct attribute definitions for contributions', () => {
      const table = template.Resources.ContributionsTable;
      const attrs = table.Properties.AttributeDefinitions;
      expect(attrs.length).toBe(4);
      const attrNames = attrs.map((a: any) => a.AttributeName);
      expect(attrNames).toContain('contributionId');
      expect(attrNames).toContain('campaignId');
      expect(attrNames).toContain('backerId');
      expect(attrNames).toContain('timestamp');
    });

    test('should have KMS encryption and PITR enabled', () => {
      const table = template.Resources.ContributionsTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('should have CampaignIdTimestampIndex for query optimization', () => {
      const table = template.Resources.ContributionsTable;
      const gsi = table.Properties.GlobalSecondaryIndexes.find((g: any) => g.IndexName === 'CampaignIdTimestampIndex');
      expect(gsi).toBeDefined();
      expect(gsi.KeySchema[0].AttributeName).toBe('campaignId');
      expect(gsi.KeySchema[1].AttributeName).toBe('timestamp');
    });

    test('should have BackerIdIndex GSI', () => {
      const table = template.Resources.ContributionsTable;
      const gsi = table.Properties.GlobalSecondaryIndexes.find((g: any) => g.IndexName === 'BackerIdIndex');
      expect(gsi).toBeDefined();
      expect(gsi.KeySchema[0].AttributeName).toBe('backerId');
    });
  });

  // ==================== S3 Buckets Tests ====================
  describe('S3 Buckets Configuration', () => {
    test('should have CampaignMediaBucket with correct properties', () => {
      const bucket = template.Resources.CampaignMediaBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('CampaignMediaBucket should have KMS encryption', () => {
      const bucket = template.Resources.CampaignMediaBucket;
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault;
      expect(encryption.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.KMSMasterKeyID).toEqual({ Ref: 'PaymentDataEncryptionKey' });
    });

    test('CampaignMediaBucket should have versioning enabled', () => {
      const bucket = template.Resources.CampaignMediaBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('CampaignMediaBucket should block all public access', () => {
      const bucket = template.Resources.CampaignMediaBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('CampaignMediaBucket should have CORS configuration', () => {
      const bucket = template.Resources.CampaignMediaBucket;
      expect(bucket.Properties.CorsConfiguration).toBeDefined();
      expect(bucket.Properties.CorsConfiguration.CorsRules).toBeDefined();
    });

    test('CampaignMediaBucket should have lifecycle rules', () => {
      const bucket = template.Resources.CampaignMediaBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules.length).toBeGreaterThan(0);
    });

    test('should have AthenaResultsBucket', () => {
      const bucket = template.Resources.AthenaResultsBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('AthenaResultsBucket should have lifecycle expiration', () => {
      const bucket = template.Resources.AthenaResultsBucket;
      const rule = bucket.Properties.LifecycleConfiguration.Rules[0];
      expect(rule.ExpirationInDays).toBe(30);
    });
  });

  // ==================== CloudFront Tests ====================
  describe('CloudFront Distribution Configuration', () => {
    test('should have CloudFront Origin Access Identity', () => {
      const oai = template.Resources.CloudFrontOriginAccessIdentity;
      expect(oai).toBeDefined();
      expect(oai.Type).toBe('AWS::CloudFront::CloudFrontOriginAccessIdentity');
    });

    test('should have bucket policy allowing CloudFront OAI', () => {
      const policy = template.Resources.CampaignMediaBucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.Bucket).toEqual({ Ref: 'CampaignMediaBucket' });
    });

    test('should have CloudFront distribution', () => {
      const dist = template.Resources.CampaignMediaDistribution;
      expect(dist).toBeDefined();
      expect(dist.Type).toBe('AWS::CloudFront::Distribution');
    });

    test('CloudFront should be enabled', () => {
      const dist = template.Resources.CampaignMediaDistribution;
      expect(dist.Properties.DistributionConfig.Enabled).toBe(true);
    });

    test('CloudFront should redirect HTTP to HTTPS', () => {
      const dist = template.Resources.CampaignMediaDistribution;
      expect(dist.Properties.DistributionConfig.DefaultCacheBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    });

    test('CloudFront should have compression enabled', () => {
      const dist = template.Resources.CampaignMediaDistribution;
      expect(dist.Properties.DistributionConfig.DefaultCacheBehavior.Compress).toBe(true);
    });

    test('CloudFront should reference S3 origin with OAI', () => {
      const dist = template.Resources.CampaignMediaDistribution;
      const origin = dist.Properties.DistributionConfig.Origins[0];
      expect(origin.S3OriginConfig).toBeDefined();
      expect(origin.S3OriginConfig.OriginAccessIdentity['Fn::Sub']).toContain('CloudFrontOriginAccessIdentity');
    });
  });

  // ==================== Cognito Tests ====================
  describe('Cognito User Pool Configuration', () => {
    test('should have Cognito User Pool', () => {
      const pool = template.Resources.CrowdfundingUserPool;
      expect(pool).toBeDefined();
      expect(pool.Type).toBe('AWS::Cognito::UserPool');
    });

    test('should use email as username', () => {
      const pool = template.Resources.CrowdfundingUserPool;
      expect(pool.Properties.UsernameAttributes).toContain('email');
      expect(pool.Properties.AutoVerifiedAttributes).toContain('email');
    });

    test('should have strong password policy', () => {
      const pool = template.Resources.CrowdfundingUserPool;
      const policy = pool.Properties.Policies.PasswordPolicy;
      expect(policy.MinimumLength).toBeGreaterThanOrEqual(8);
      expect(policy.RequireUppercase).toBe(true);
      expect(policy.RequireLowercase).toBe(true);
      expect(policy.RequireNumbers).toBe(true);
      expect(policy.RequireSymbols).toBe(true);
    });

    test('should have User Pool Client', () => {
      const client = template.Resources.CrowdfundingUserPoolClient;
      expect(client).toBeDefined();
      expect(client.Type).toBe('AWS::Cognito::UserPoolClient');
      expect(client.Properties.UserPoolId).toEqual({ Ref: 'CrowdfundingUserPool' });
    });

    test('User Pool Client should have correct auth flows', () => {
      const client = template.Resources.CrowdfundingUserPoolClient;
      const flows = client.Properties.ExplicitAuthFlows;
      expect(flows).toContain('ALLOW_USER_PASSWORD_AUTH');
      expect(flows).toContain('ALLOW_REFRESH_TOKEN_AUTH');
      expect(flows).toContain('ALLOW_USER_SRP_AUTH');
    });

    test('should have Creators user group', () => {
      const group = template.Resources.CreatorsUserGroup;
      expect(group).toBeDefined();
      expect(group.Type).toBe('AWS::Cognito::UserPoolGroup');
      expect(group.Properties.GroupName).toBe('Creators');
      expect(group.Properties.Precedence).toBe(1);
    });

    test('should have Backers user group', () => {
      const group = template.Resources.BackersUserGroup;
      expect(group).toBeDefined();
      expect(group.Properties.GroupName).toBe('Backers');
      expect(group.Properties.Precedence).toBe(2);
    });
  });

  // ==================== SNS Topics Tests ====================
  describe('SNS Topics Configuration', () => {
    test('should have MilestoneNotificationsTopic with KMS encryption', () => {
      const topic = template.Resources.MilestoneNotificationsTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.KmsMasterKeyId).toEqual({ Ref: 'PaymentDataEncryptionKey' });
    });

    test('should have CampaignDeadlinesTopic', () => {
      const topic = template.Resources.CampaignDeadlinesTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.DisplayName).toContain('Deadline');
    });
  });

  // ==================== CloudWatch Tests ====================
  describe('CloudWatch Logging and Monitoring', () => {
    test('should have log groups for all Lambda functions', () => {
      expect(template.Resources.CampaignManagementLogGroup).toBeDefined();
      expect(template.Resources.PaymentProcessingLogGroup).toBeDefined();
      expect(template.Resources.ContributionScreeningLogGroup).toBeDefined();
    });

    test('log groups should have KMS encryption', () => {
      const logGroup = template.Resources.CampaignManagementLogGroup;
      expect(logGroup.Properties.KmsKeyId['Fn::GetAtt']).toEqual(['PaymentDataEncryptionKey', 'Arn']);
    });

    test('log groups should have retention policies', () => {
      const logGroup1 = template.Resources.CampaignManagementLogGroup;
      const logGroup2 = template.Resources.PaymentProcessingLogGroup;
      expect(logGroup1.Properties.RetentionInDays).toBe(30);
      expect(logGroup2.Properties.RetentionInDays).toBe(90);
    });

    test('should have CloudWatch Dashboard', () => {
      const dashboard = template.Resources.FundingMetricsDashboard;
      expect(dashboard).toBeDefined();
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('should have CloudWatch Alarm for error rates', () => {
      const alarm = template.Resources.HighErrorRateAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Threshold).toBe(10);
    });

    test('alarm should trigger SNS notification', () => {
      const alarm = template.Resources.HighErrorRateAlarm;
      expect(alarm.Properties.AlarmActions).toBeDefined();
      expect(alarm.Properties.AlarmActions).toContainEqual({ Ref: 'CampaignDeadlinesTopic' });
    });
  });

  // ==================== IAM Roles Tests ====================
  describe('IAM Roles Configuration', () => {
    test('should have CampaignManagementLambdaRole', () => {
      const role = template.Resources.CampaignManagementLambdaRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('CampaignManagementLambdaRole should have Lambda trust policy', () => {
      const role = template.Resources.CampaignManagementLambdaRole;
      const statement = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Principal.Service).toBe('lambda.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });

    test('CampaignManagementLambdaRole should have DynamoDB permissions', () => {
      const role = template.Resources.CampaignManagementLambdaRole;
      const policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'DynamoDBAccess');
      expect(policy).toBeDefined();
      const actions = policy.PolicyDocument.Statement[0].Action;
      expect(actions).toContain('dynamodb:GetItem');
      expect(actions).toContain('dynamodb:PutItem');
      expect(actions).toContain('dynamodb:UpdateItem');
    });

    test('CampaignManagementLambdaRole should have S3 permissions', () => {
      const role = template.Resources.CampaignManagementLambdaRole;
      const policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'S3Access');
      expect(policy).toBeDefined();
    });

    test('CampaignManagementLambdaRole should have KMS permissions', () => {
      const role = template.Resources.CampaignManagementLambdaRole;
      const policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'KMSAccess');
      expect(policy).toBeDefined();
      const actions = policy.PolicyDocument.Statement[0].Action;
      expect(actions).toContain('kms:Decrypt');
      expect(actions).toContain('kms:Encrypt');
    });

    test('should have PaymentProcessingLambdaRole with transaction support', () => {
      const role = template.Resources.PaymentProcessingLambdaRole;
      expect(role).toBeDefined();
      const policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'DynamoDBTransactions');
      expect(policy).toBeDefined();
      // Updated to check for BatchWriteItem instead of TransactWriteItems
      expect(policy.PolicyDocument.Statement[0].Action).toContain('dynamodb:BatchWriteItem');
    });

    test('PaymentProcessingLambdaRole should have Fraud Detector permissions', () => {
      const role = template.Resources.PaymentProcessingLambdaRole;
      const policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'FraudDetectorAccess');
      expect(policy).toBeDefined();
      const actions = policy.PolicyDocument.Statement[0].Action;
      expect(actions).toContain('frauddetector:GetEventPrediction');
    });

    test('PaymentProcessingLambdaRole should have SES permissions', () => {
      const role = template.Resources.PaymentProcessingLambdaRole;
      const policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'SESAccess');
      expect(policy).toBeDefined();
    });

    test('should have ContributionScreeningLambdaRole', () => {
      const role = template.Resources.ContributionScreeningLambdaRole;
      expect(role).toBeDefined();
    });

    test('should have StepFunctionsExecutionRole', () => {
      const role = template.Resources.StepFunctionsExecutionRole;
      expect(role).toBeDefined();
      const statement = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Principal.Service).toBe('states.amazonaws.com');
    });

    test('StepFunctionsExecutionRole should invoke Lambda functions', () => {
      const role = template.Resources.StepFunctionsExecutionRole;
      const policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'LambdaInvocation');
      expect(policy).toBeDefined();
    });

    test('should have EventBridgeInvokeLambdaRole', () => {
      const role = template.Resources.EventBridgeInvokeLambdaRole;
      expect(role).toBeDefined();
      const statement = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Principal.Service).toBe('events.amazonaws.com');
    });
  });

  // ==================== Lambda Functions Tests ====================
  describe('Lambda Functions Configuration', () => {
    test('should have CampaignManagementFunction', () => {
      const fn = template.Resources.CampaignManagementFunction;
      expect(fn).toBeDefined();
      expect(fn.Type).toBe('AWS::Lambda::Function');
    });

    test('CampaignManagementFunction should use Node.js 22', () => {
      const fn = template.Resources.CampaignManagementFunction;
      expect(fn.Properties.Runtime).toBe('nodejs22.x');
    });

    test('CampaignManagementFunction should have correct environment variables', () => {
      const fn = template.Resources.CampaignManagementFunction;
      const env = fn.Properties.Environment.Variables;
      expect(env.CAMPAIGNS_TABLE).toEqual({ Ref: 'CampaignsTable' });
      expect(env.CONTRIBUTIONS_TABLE).toEqual({ Ref: 'ContributionsTable' });
      expect(env.SNS_TOPIC_ARN).toEqual({ Ref: 'MilestoneNotificationsTopic' });
      expect(env.KMS_KEY_ID).toEqual({ Ref: 'PaymentDataEncryptionKey' });
      expect(env.MEDIA_BUCKET).toEqual({ Ref: 'CampaignMediaBucket' });
    });

    test('CampaignManagementFunction should have appropriate timeout and memory', () => {
      const fn = template.Resources.CampaignManagementFunction;
      expect(fn.Properties.Timeout).toBe(30);
      expect(fn.Properties.MemorySize).toBe(512);
    });

    test('should have PaymentProcessingFunction with higher resources', () => {
      const fn = template.Resources.PaymentProcessingFunction;
      expect(fn).toBeDefined();
      expect(fn.Properties.Runtime).toBe('nodejs22.x');
      expect(fn.Properties.Timeout).toBe(60);
      expect(fn.Properties.MemorySize).toBe(1024);
    });

    test('PaymentProcessingFunction should have reserved concurrency', () => {
      const fn = template.Resources.PaymentProcessingFunction;
      expect(fn.Properties.ReservedConcurrentExecutions).toBe(100);
    });

    test('PaymentProcessingFunction should have Fraud Detector configuration', () => {
      const fn = template.Resources.PaymentProcessingFunction;
      const env = fn.Properties.Environment.Variables;
      expect(env.FRAUD_DETECTOR_NAME).toBe('crowdfunding_fraud_detector');
    });

    test('should have ContributionScreeningFunction', () => {
      const fn = template.Resources.ContributionScreeningFunction;
      expect(fn).toBeDefined();
      expect(fn.Properties.Environment.Variables.FRAUD_DETECTOR_EVENT_TYPE).toBe('contribution_event');
    });

    test('all Lambda functions should have correct IAM roles', () => {
      const fn1 = template.Resources.CampaignManagementFunction;
      const fn2 = template.Resources.PaymentProcessingFunction;
      const fn3 = template.Resources.ContributionScreeningFunction;
      expect(fn1.Properties.Role['Fn::GetAtt'][0]).toBe('CampaignManagementLambdaRole');
      expect(fn2.Properties.Role['Fn::GetAtt'][0]).toBe('PaymentProcessingLambdaRole');
      expect(fn3.Properties.Role['Fn::GetAtt'][0]).toBe('ContributionScreeningLambdaRole');
    });
  });

  // ==================== Step Functions Tests ====================
  describe('Step Functions State Machine Configuration', () => {
    test('should have MilestoneWorkflowStateMachine', () => {
      const sm = template.Resources.MilestoneWorkflowStateMachine;
      expect(sm).toBeDefined();
      expect(sm.Type).toBe('AWS::StepFunctions::StateMachine');
    });

    test('should have correct IAM role', () => {
      const sm = template.Resources.MilestoneWorkflowStateMachine;
      expect(sm.Properties.RoleArn['Fn::GetAtt'][0]).toBe('StepFunctionsExecutionRole');
    });

    test('should have comprehensive state machine definition', () => {
      const sm = template.Resources.MilestoneWorkflowStateMachine;
      const definition = JSON.parse(sm.Properties.DefinitionString['Fn::Sub']);
      expect(definition.Comment).toContain('Milestone-based');
      expect(definition.StartAt).toBe('ValidateMilestone');
      expect(definition.States).toBeDefined();
    });

    test('state machine should have ValidateMilestone task', () => {
      const sm = template.Resources.MilestoneWorkflowStateMachine;
      const definition = JSON.parse(sm.Properties.DefinitionString['Fn::Sub']);
      expect(definition.States.ValidateMilestone).toBeDefined();
      expect(definition.States.ValidateMilestone.Type).toBe('Task');
    });

    test('state machine should have retry logic', () => {
      const sm = template.Resources.MilestoneWorkflowStateMachine;
      const definition = JSON.parse(sm.Properties.DefinitionString['Fn::Sub']);
      expect(definition.States.ValidateMilestone.Retry).toBeDefined();
      expect(definition.States.ValidateMilestone.Retry[0].MaxAttempts).toBe(3);
    });

    test('state machine should have error handling with Catch', () => {
      const sm = template.Resources.MilestoneWorkflowStateMachine;
      const definition = JSON.parse(sm.Properties.DefinitionString['Fn::Sub']);
      expect(definition.States.ValidateMilestone.Catch).toBeDefined();
    });

    test('state machine should have Choice state', () => {
      const sm = template.Resources.MilestoneWorkflowStateMachine;
      const definition = JSON.parse(sm.Properties.DefinitionString['Fn::Sub']);
      expect(definition.States.CheckMilestoneStatus).toBeDefined();
      expect(definition.States.CheckMilestoneStatus.Type).toBe('Choice');
    });

    test('state machine should have Wait state for approvals', () => {
      const sm = template.Resources.MilestoneWorkflowStateMachine;
      const definition = JSON.parse(sm.Properties.DefinitionString['Fn::Sub']);
      expect(definition.States.WaitForApproval).toBeDefined();
      expect(definition.States.WaitForApproval.Type).toBe('Wait');
      expect(definition.States.WaitForApproval.Seconds).toBe(300);
    });

    test('state machine should have SNS notification tasks', () => {
      const sm = template.Resources.MilestoneWorkflowStateMachine;
      const definition = JSON.parse(sm.Properties.DefinitionString['Fn::Sub']);
      expect(definition.States.NotifyMilestoneCompletion).toBeDefined();
      expect(definition.States.NotifyMilestoneCompletion.Resource).toContain('sns:publish');
    });

    test('state machine should have Success and Fail terminal states', () => {
      const sm = template.Resources.MilestoneWorkflowStateMachine;
      const definition = JSON.parse(sm.Properties.DefinitionString['Fn::Sub']);
      expect(definition.States.Success).toBeDefined();
      expect(definition.States.Success.Type).toBe('Succeed');
      expect(definition.States.Fail).toBeDefined();
      expect(definition.States.Fail.Type).toBe('Fail');
    });
  });

  // ==================== API Gateway Tests ====================
  describe('API Gateway Configuration', () => {
    test('should have CrowdfundingApiGateway', () => {
      const api = template.Resources.CrowdfundingApiGateway;
      expect(api).toBeDefined();
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('should have Cognito authorizer', () => {
      const auth = template.Resources.ApiGatewayAuthorizer;
      expect(auth).toBeDefined();
      expect(auth.Type).toBe('AWS::ApiGateway::Authorizer');
      expect(auth.Properties.Type).toBe('COGNITO_USER_POOLS');
    });

    test('authorizer should reference Cognito User Pool', () => {
      const auth = template.Resources.ApiGatewayAuthorizer;
      expect(auth.Properties.ProviderARNs).toContainEqual({ 'Fn::GetAtt': ['CrowdfundingUserPool', 'Arn'] });
    });

    test('should have campaigns resource', () => {
      const resource = template.Resources.CampaignsResource;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::ApiGateway::Resource');
      expect(resource.Properties.PathPart).toBe('campaigns');
    });

    test('should have contributions resource', () => {
      const resource = template.Resources.ContributionsResource;
      expect(resource).toBeDefined();
      expect(resource.Properties.PathPart).toBe('contributions');
    });

    test('campaigns should have POST method', () => {
      const method = template.Resources.CampaignsPostMethod;
      expect(method).toBeDefined();
      expect(method.Type).toBe('AWS::ApiGateway::Method');
      expect(method.Properties.HttpMethod).toBe('POST');
      expect(method.Properties.AuthorizationType).toBe('COGNITO_USER_POOLS');
    });

    test('campaigns POST should use Lambda proxy integration', () => {
      const method = template.Resources.CampaignsPostMethod;
      expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
      expect(method.Properties.Integration.Uri['Fn::Sub']).toContain('CampaignManagementFunction');
    });

    test('campaigns should have GET method', () => {
      const method = template.Resources.CampaignsGetMethod;
      expect(method).toBeDefined();
      expect(method.Properties.HttpMethod).toBe('GET');
    });

    test('contributions should have POST method', () => {
      const method = template.Resources.ContributionsPostMethod;
      expect(method).toBeDefined();
      expect(method.Properties.HttpMethod).toBe('POST');
    });

    test('contributions POST should integrate with PaymentProcessingFunction', () => {
      const method = template.Resources.ContributionsPostMethod;
      expect(method.Properties.Integration.Uri['Fn::Sub']).toContain('PaymentProcessingFunction');
    });

    test('should have API deployment', () => {
      const deployment = template.Resources.ApiGatewayDeployment;
      expect(deployment).toBeDefined();
      expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');
    });

    test('API deployment should depend on methods', () => {
      const deployment = template.Resources.ApiGatewayDeployment;
      expect(deployment.DependsOn).toContain('CampaignsPostMethod');
      expect(deployment.DependsOn).toContain('CampaignsGetMethod');
      expect(deployment.DependsOn).toContain('ContributionsPostMethod');
    });

    test('should have Lambda permissions for API Gateway invocation', () => {
      const perm1 = template.Resources.ApiGatewayInvokeLambdaPermission;
      const perm2 = template.Resources.ApiGatewayInvokePaymentLambdaPermission;
      expect(perm1).toBeDefined();
      expect(perm2).toBeDefined();
      expect(perm1.Type).toBe('AWS::Lambda::Permission');
      expect(perm1.Properties.Principal).toBe('apigateway.amazonaws.com');
    });
  });

  // ==================== EventBridge Tests ====================
  describe('EventBridge Rules Configuration', () => {
    test('should have CampaignDeadlineRule', () => {
      const rule = template.Resources.CampaignDeadlineRule;
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::Events::Rule');
    });

    test('rule should run every hour', () => {
      const rule = template.Resources.CampaignDeadlineRule;
      expect(rule.Properties.ScheduleExpression).toBe('rate(1 hour)');
    });

    test('rule should be enabled', () => {
      const rule = template.Resources.CampaignDeadlineRule;
      expect(rule.Properties.State).toBe('ENABLED');
    });

    test('rule should target CampaignManagementFunction', () => {
      const rule = template.Resources.CampaignDeadlineRule;
      expect(rule.Properties.Targets).toBeDefined();
      expect(rule.Properties.Targets[0].Arn['Fn::GetAtt'][0]).toBe('CampaignManagementFunction');
    });

    test('rule should pass custom input to Lambda', () => {
      const rule = template.Resources.CampaignDeadlineRule;
      const input = JSON.parse(rule.Properties.Targets[0].Input['Fn::Sub']);
      expect(input.action).toBe('checkDeadlines');
    });

    test('should have EventBridge Lambda invocation permission', () => {
      const perm = template.Resources.EventBridgeInvokeLambdaPermission;
      expect(perm).toBeDefined();
      expect(perm.Properties.Principal).toBe('events.amazonaws.com');
    });
  });

  // ==================== Athena Tests ====================
  describe('Athena Workgroup Configuration', () => {
    test('should have AthenaWorkgroup', () => {
      const workgroup = template.Resources.AthenaWorkgroup;
      expect(workgroup).toBeDefined();
      expect(workgroup.Type).toBe('AWS::Athena::WorkGroup');
    });

    test('workgroup should be enabled', () => {
      const workgroup = template.Resources.AthenaWorkgroup;
      expect(workgroup.Properties.State).toBe('ENABLED');
    });

    test('workgroup should have result configuration', () => {
      const workgroup = template.Resources.AthenaWorkgroup;
      const config = workgroup.Properties.WorkGroupConfiguration.ResultConfiguration;
      expect(config.OutputLocation['Fn::Sub']).toContain('AthenaResultsBucket');
    });

    test('workgroup should have encryption enabled', () => {
      const workgroup = template.Resources.AthenaWorkgroup;
      const encryption = workgroup.Properties.WorkGroupConfiguration.ResultConfiguration.EncryptionConfiguration;
      expect(encryption.EncryptionOption).toBe('SSE_S3');
    });

    test('workgroup should publish CloudWatch metrics', () => {
      const workgroup = template.Resources.AthenaWorkgroup;
      expect(workgroup.Properties.WorkGroupConfiguration.PublishCloudWatchMetricsEnabled).toBe(true);
    });
  });

  // ==================== Outputs Tests ====================
  describe('Stack Outputs', () => {
    test('should have ApiGatewayUrl output', () => {
      const output = template.Outputs.ApiGatewayUrl;
      expect(output).toBeDefined();
      expect(output.Description).toContain('API Gateway');
      expect(output.Value['Fn::Sub']).toContain('execute-api');
    });

    test('should have DynamoDB table name outputs', () => {
      expect(template.Outputs.CampaignsTableName).toBeDefined();
      expect(template.Outputs.ContributionsTableName).toBeDefined();
    });

    test('should have DynamoDB table ARN outputs', () => {
      expect(template.Outputs.CampaignsTableArn).toBeDefined();
      expect(template.Outputs.ContributionsTableArn).toBeDefined();
    });

    test('should have Lambda function ARN outputs', () => {
      expect(template.Outputs.CampaignManagementFunctionArn).toBeDefined();
      expect(template.Outputs.PaymentProcessingFunctionArn).toBeDefined();
      expect(template.Outputs.ContributionScreeningFunctionArn).toBeDefined();
    });

    test('should have Step Functions ARN output', () => {
      const output = template.Outputs.MilestoneWorkflowArn;
      expect(output).toBeDefined();
      expect(output.Value['Fn::GetAtt'][0]).toBe('MilestoneWorkflowStateMachine');
    });

    test('should have S3 bucket outputs', () => {
      expect(template.Outputs.CampaignMediaBucketName).toBeDefined();
      expect(template.Outputs.AthenaResultsBucketName).toBeDefined();
    });

    test('should have CloudFront domain output', () => {
      const output = template.Outputs.CloudFrontDomainName;
      expect(output).toBeDefined();
      expect(output.Value['Fn::GetAtt']).toEqual(['CampaignMediaDistribution', 'DomainName']);
    });

    test('should have Cognito outputs', () => {
      expect(template.Outputs.UserPoolId).toBeDefined();
      expect(template.Outputs.UserPoolClientId).toBeDefined();
    });

    test('should have SNS topic ARN outputs', () => {
      expect(template.Outputs.MilestoneNotificationsTopicArn).toBeDefined();
      expect(template.Outputs.CampaignDeadlinesTopicArn).toBeDefined();
    });

    test('should have KMS key outputs', () => {
      expect(template.Outputs.PaymentEncryptionKeyId).toBeDefined();
      expect(template.Outputs.PaymentEncryptionKeyArn).toBeDefined();
    });

    test('should have Athena workgroup output', () => {
      expect(template.Outputs.AthenaWorkgroupName).toBeDefined();
    });

    test('should have EventBridge rule output', () => {
      expect(template.Outputs.CampaignDeadlineRuleArn).toBeDefined();
    });

    test('all outputs should be exported', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        expect(output.Export).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
      });
    });
  });

  // ==================== Tags and Best Practices ====================
  describe('Tags and Best Practices', () => {
    test('resources should have Environment and Application tags', () => {
      const checkTags = (resource: any) => {
        if (resource.Properties && resource.Properties.Tags) {
          const tagNames = resource.Properties.Tags.map((t: any) => t.Key);
          return tagNames.includes('Environment') || tagNames.includes('Application');
        }
        if (resource.Properties && resource.Properties.UserPoolTags) {
          return true;
        }
        return false;
      };

      const taggedResources = [
        'PaymentDataEncryptionKey',
        'CampaignsTable',
        'ContributionsTable',
        'CampaignMediaBucket',
        'CampaignManagementFunction'
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource) {
          expect(checkTags(resource)).toBe(true);
        }
      });
    });

    test('production resources should have Retain deletion policy', () => {
      expect(template.Resources.CampaignsTable.DeletionPolicy).toBe('Retain');
      expect(template.Resources.ContributionsTable.DeletionPolicy).toBe('Retain');
      expect(template.Resources.CampaignMediaBucket.DeletionPolicy).toBe('Retain');
    });

    test('IAM roles should follow naming convention', () => {
      const roleNames = [
        'CampaignManagementLambdaRole',
        'PaymentProcessingLambdaRole',
        'ContributionScreeningLambdaRole',
        'StepFunctionsExecutionRole',
        'EventBridgeInvokeLambdaRole'
      ];

      roleNames.forEach(roleName => {
        const role = template.Resources[roleName];
        expect(role).toBeDefined();
        expect(role.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });
  });
});
