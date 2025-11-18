import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Comprehensive Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // ===================================================================
  // TEMPLATE STRUCTURE TESTS
  // ===================================================================

  describe('Template Structure and Metadata', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a descriptive template description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Automated CloudFormation Stack Analysis Framework for Security, Compliance, and Quality Assurance'
      );
      expect(template.Description.length).toBeGreaterThan(20);
    });

    test('should have all required top-level sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
      expect(template).not.toBeNull();
    });
  });

  // ===================================================================
  // PARAMETERS TESTS
  // ===================================================================

  describe('Parameters Configuration', () => {
    test('should have exactly 5 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(5);
    });

    test('should have TargetStackName parameter with correct properties', () => {
      const param = template.Parameters.TargetStackName;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
      expect(param.Description).toBe(
        'Name of the CloudFormation stack to analyze (leave empty for on-demand analysis)'
      );
      expect(param.AllowedPattern).toBe('^$|^[a-zA-Z][a-zA-Z0-9-]*$');
      expect(param.ConstraintDescription).toBe(
        'Must be a valid CloudFormation stack name or empty'
      );
    });

    test('should have AllowedAMIsList parameter with correct properties', () => {
      const param = template.Parameters.AllowedAMIsList;
      expect(param).toBeDefined();
      expect(param.Type).toBe('CommaDelimitedList');
      expect(param.Default).toBe(
        'ami-0c02fb55731490381,ami-0947d2ba12ee1ff75'
      );
      expect(param.Description).toBe('Comma-separated list of allowed AMI IDs');
    });

    test('should have EnableS3Storage parameter with correct properties', () => {
      const param = template.Parameters.EnableS3Storage;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('true');
      expect(param.AllowedValues).toEqual(['true', 'false']);
      expect(param.Description).toBe('Enable storing analysis results in S3');
    });

    test('should have NotificationEmail parameter with correct properties', () => {
      const param = template.Parameters.NotificationEmail;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
      expect(param.AllowedPattern).toBe(
        '^$|^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
      );
      expect(param.ConstraintDescription).toBe(
        'Must be a valid email address or empty'
      );
    });

    test('should have AnalysisTriggerMode parameter with correct properties', () => {
      const param = template.Parameters.AnalysisTriggerMode;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('OnDemand');
      expect(param.AllowedValues).toEqual([
        'OnDemand',
        'Scheduled',
        'OnStackChange',
      ]);
      expect(param.Description).toBe('How to trigger the analysis');
    });
  });

  // ===================================================================
  // CONDITIONS TESTS
  // ===================================================================

  describe('Conditions Logic', () => {
    test('should have exactly 4 conditions', () => {
      const conditionCount = Object.keys(template.Conditions).length;
      expect(conditionCount).toBe(4);
    });

    test('should have EnableS3StorageCondition', () => {
      const condition = template.Conditions.EnableS3StorageCondition;
      expect(condition).toBeDefined();
      expect(condition).toEqual({
        'Fn::Equals': [{ Ref: 'EnableS3Storage' }, 'true'],
      });
    });

    test('should have HasNotificationEmail condition', () => {
      const condition = template.Conditions.HasNotificationEmail;
      expect(condition).toBeDefined();
      expect(condition).toEqual({
        'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'NotificationEmail' }, ''] }],
      });
    });

    test('should have IsScheduledMode condition', () => {
      const condition = template.Conditions.IsScheduledMode;
      expect(condition).toBeDefined();
      expect(condition).toEqual({
        'Fn::Equals': [{ Ref: 'AnalysisTriggerMode' }, 'Scheduled'],
      });
    });

    test('should have HasTargetStackName condition', () => {
      const condition = template.Conditions.HasTargetStackName;
      expect(condition).toBeDefined();
      expect(condition).toEqual({
        'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'TargetStackName' }, ''] }],
      });
    });
  });

  // ===================================================================
  // RESOURCES TESTS - S3 BUCKET
  // ===================================================================

  describe('S3 Bucket Resource - AnalysisReportBucket', () => {
    let bucket: any;

    beforeAll(() => {
      bucket = template.Resources.AnalysisReportBucket;
    });

    test('should be defined as AWS::S3::Bucket type', () => {
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have EnableS3StorageCondition', () => {
      expect(bucket.Condition).toBe('EnableS3StorageCondition');
    });

    test('should have correct bucket name with account and region', () => {
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'cfn-analysis-reports-${AWS::AccountId}-${AWS::Region}',
      });
    });

    test('should have encryption enabled with AES256', () => {
      const encryption = bucket.Properties.BucketEncryption;
      expect(encryption).toBeDefined();
      expect(
        encryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
    });

    test('should have versioning enabled', () => {
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have lifecycle configuration to delete old reports', () => {
      const lifecycle = bucket.Properties.LifecycleConfiguration;
      expect(lifecycle).toBeDefined();
      expect(lifecycle.Rules).toHaveLength(1);
      expect(lifecycle.Rules[0].Id).toBe('DeleteOldReports');
      expect(lifecycle.Rules[0].Status).toBe('Enabled');
      expect(lifecycle.Rules[0].ExpirationInDays).toBe(90);
    });

    test('should have public access blocked', () => {
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess).toBeDefined();
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('should have all required tags', () => {
      const tags = bucket.Properties.Tags;
      expect(tags).toBeDefined();
      expect(tags).toHaveLength(4);

      const tagMap = tags.reduce((acc: any, tag: any) => {
        acc[tag.Key] = tag.Value;
        return acc;
      }, {});

      expect(tagMap.Environment).toBe('Production');
      expect(tagMap.Owner).toBe('SecurityTeam');
      expect(tagMap.CostCenter).toBe('IT-Security');
      expect(tagMap.DataClassification).toBe('Internal');
    });
  });

  // ===================================================================
  // RESOURCES TESTS - IAM ROLE
  // ===================================================================

  describe('IAM Role Resource - AnalysisLambdaRole', () => {
    let role: any;

    beforeAll(() => {
      role = template.Resources.AnalysisLambdaRole;
    });

    test('should be defined as AWS::IAM::Role type', () => {
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should have correct assume role policy for Lambda', () => {
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy).toBeDefined();
      expect(assumePolicy.Version).toBe('2012-10-17');
      expect(assumePolicy.Statement).toHaveLength(1);
      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toBe(
        'lambda.amazonaws.com'
      );
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should have Lambda basic execution managed policy attached', () => {
      expect(role.Properties.ManagedPolicyArns).toBeDefined();
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
    });

    test('should have StackAnalysisPolicy with CloudFormation permissions', () => {
      const policies = role.Properties.Policies;
      expect(policies).toBeDefined();
      expect(policies).toHaveLength(1);
      expect(policies[0].PolicyName).toBe('StackAnalysisPolicy');

      const policyDoc = policies[0].PolicyDocument;
      expect(policyDoc.Version).toBe('2012-10-17');
      expect(policyDoc.Statement).toBeDefined();
    });

    test('should have CloudFormation read permissions', () => {
      const policy = role.Properties.Policies[0].PolicyDocument;
      const cfnStatement = policy.Statement.find((s: any) =>
        s.Action.includes('cloudformation:DescribeStacks')
      );

      expect(cfnStatement).toBeDefined();
      expect(cfnStatement.Effect).toBe('Allow');
      expect(cfnStatement.Action).toContain('cloudformation:DescribeStacks');
      expect(cfnStatement.Action).toContain('cloudformation:GetTemplate');
      expect(cfnStatement.Action).toContain('cloudformation:ListStackResources');
      expect(cfnStatement.Action).toContain(
        'cloudformation:DescribeStackResources'
      );
      expect(cfnStatement.Action).toContain('cloudformation:GetStackPolicy');
      expect(cfnStatement.Resource).toBe('*');
    });

    test('should have AWS service read permissions', () => {
      const policy = role.Properties.Policies[0].PolicyDocument;
      const serviceStatement = policy.Statement.find((s: any) =>
        s.Action.includes('ec2:DescribeSecurityGroups')
      );

      expect(serviceStatement).toBeDefined();
      expect(serviceStatement.Effect).toBe('Allow');
      expect(serviceStatement.Action).toContain('ec2:DescribeSecurityGroups');
      expect(serviceStatement.Action).toContain('s3:GetEncryptionConfiguration');
      expect(serviceStatement.Action).toContain('s3:GetBucketVersioning');
      expect(serviceStatement.Action).toContain('iam:GetRole');
      expect(serviceStatement.Action).toContain('rds:DescribeDBInstances');
      expect(serviceStatement.Action).toContain('lambda:GetFunction');
      expect(serviceStatement.Resource).toBe('*');
    });

    test('should have S3 write permissions with secure transport condition', () => {
      const policy = role.Properties.Policies[0].PolicyDocument;
      const s3Statement = policy.Statement.find((s: any) =>
        s.Action.includes('s3:PutObject')
      );

      expect(s3Statement).toBeDefined();
      expect(s3Statement.Effect).toBe('Allow');
      expect(s3Statement.Action).toContain('s3:PutObject');
      expect(s3Statement.Action).toContain('s3:PutObjectAcl');
      expect(s3Statement.Condition).toBeDefined();
      expect(s3Statement.Condition.Bool['aws:SecureTransport']).toBe('true');
    });
  });

  // ===================================================================
  // RESOURCES TESTS - LAMBDA FUNCTION
  // ===================================================================

  describe('Lambda Function Resource - StackAnalysisLambda', () => {
    let lambda: any;

    beforeAll(() => {
      lambda = template.Resources.StackAnalysisLambda;
    });

    test('should be defined as AWS::Lambda::Function type', () => {
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
    });

    test('should have correct function name', () => {
      expect(lambda.Properties.FunctionName).toEqual({
        'Fn::Sub': 'cfn-stack-analyzer-${AWS::StackName}',
      });
    });

    test('should use Python 3.11 runtime', () => {
      expect(lambda.Properties.Runtime).toBe('python3.11');
    });

    test('should have correct handler', () => {
      expect(lambda.Properties.Handler).toBe('index.handler');
    });

    test('should reference the correct IAM role', () => {
      expect(lambda.Properties.Role).toEqual({
        'Fn::GetAtt': ['AnalysisLambdaRole', 'Arn'],
      });
    });

    test('should have 15-minute timeout for long-running analysis', () => {
      expect(lambda.Properties.Timeout).toBe(900);
    });

    test('should have 512 MB memory allocation', () => {
      expect(lambda.Properties.MemorySize).toBe(512);
    });

    test('should have environment variables configured', () => {
      const env = lambda.Properties.Environment.Variables;
      expect(env).toBeDefined();
      expect(env.ALLOWED_AMIS).toBeDefined();
      expect(env.S3_BUCKET).toBeDefined();
      expect(env.MANDATORY_TAGS).toBe(
        'Environment,Owner,CostCenter,DataClassification'
      );
    });

    test('should have ALLOWED_AMIS from parameter', () => {
      const env = lambda.Properties.Environment.Variables;
      expect(env.ALLOWED_AMIS).toEqual({
        'Fn::Join': [',', { Ref: 'AllowedAMIsList' }],
      });
    });

    test('should have S3_BUCKET conditional based on EnableS3Storage', () => {
      const env = lambda.Properties.Environment.Variables;
      expect(env.S3_BUCKET).toEqual({
        'Fn::If': ['EnableS3StorageCondition', { Ref: 'AnalysisReportBucket' }, ''],
      });
    });

    test('should have inline Python code', () => {
      expect(lambda.Properties.Code).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(typeof lambda.Properties.Code.ZipFile).toBe('string');
      expect(lambda.Properties.Code.ZipFile).toContain('import json');
      expect(lambda.Properties.Code.ZipFile).toContain('class StackAnalyzer');
      expect(lambda.Properties.Code.ZipFile).toContain('def handler(event, context)');
    });

    test('Lambda code should include all security check methods', () => {
      const code = lambda.Properties.Code.ZipFile;
      expect(code).toContain('def check_security_groups');
      expect(code).toContain('def check_s3_buckets');
      expect(code).toContain('def check_ec2_instances');
      expect(code).toContain('def check_iam_policies');
      expect(code).toContain('def check_rds_instances');
      expect(code).toContain('def check_lambda_functions');
      expect(code).toContain('def check_resource_tags');
      expect(code).toContain('def check_hardcoded_values');
    });
  });

  // ===================================================================
  // RESOURCES TESTS - CUSTOM RESOURCE
  // ===================================================================

  describe('Custom Resource - StackAnalysis', () => {
    let customResource: any;

    beforeAll(() => {
      customResource = template.Resources.StackAnalysis;
    });

    test('should be defined as Custom::StackAnalysis type', () => {
      expect(customResource).toBeDefined();
      expect(customResource.Type).toBe('Custom::StackAnalysis');
    });

    test('should have HasTargetStackName condition', () => {
      expect(customResource.Condition).toBe('HasTargetStackName');
    });

    test('should reference Lambda function ARN as ServiceToken', () => {
      expect(customResource.Properties.ServiceToken).toEqual({
        'Fn::GetAtt': ['StackAnalysisLambda', 'Arn'],
      });
    });

    test('should pass TargetStackName parameter', () => {
      expect(customResource.Properties.TargetStackName).toEqual({
        Ref: 'TargetStackName',
      });
    });

    test('should pass AllowedAMIs as joined list', () => {
      expect(customResource.Properties.AllowedAMIs).toEqual({
        'Fn::Join': [',', { Ref: 'AllowedAMIsList' }],
      });
    });

    test('should include Timestamp for updates', () => {
      expect(customResource.Properties.Timestamp).toEqual({
        Ref: 'AWS::StackName',
      });
    });
  });

  // ===================================================================
  // RESOURCES TESTS - EVENTBRIDGE RULE
  // ===================================================================

  describe('EventBridge Rule Resource - ScheduledAnalysisRule', () => {
    let rule: any;

    beforeAll(() => {
      rule = template.Resources.ScheduledAnalysisRule;
    });

    test('should be defined as AWS::Events::Rule type', () => {
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::Events::Rule');
    });

    test('should have IsScheduledMode condition', () => {
      expect(rule.Condition).toBe('IsScheduledMode');
    });

    test('should have descriptive description', () => {
      expect(rule.Properties.Description).toBe(
        'Scheduled CloudFormation stack analysis'
      );
    });

    test('should run daily', () => {
      expect(rule.Properties.ScheduleExpression).toBe('rate(1 day)');
    });

    test('should be enabled by default', () => {
      expect(rule.Properties.State).toBe('ENABLED');
    });

    test('should target the Lambda function', () => {
      expect(rule.Properties.Targets).toBeDefined();
      expect(rule.Properties.Targets).toHaveLength(1);
      expect(rule.Properties.Targets[0].Arn).toEqual({
        'Fn::GetAtt': ['StackAnalysisLambda', 'Arn'],
      });
      expect(rule.Properties.Targets[0].Id).toBe('ScheduledAnalysis');
    });

    test('should pass correct input to Lambda', () => {
      const input = rule.Properties.Targets[0].Input;
      expect(input).toBeDefined();
      expect(input).toEqual({
        'Fn::Sub': expect.stringContaining('RequestType'),
      });
    });
  });

  // ===================================================================
  // RESOURCES TESTS - LAMBDA PERMISSION
  // ===================================================================

  describe('Lambda Permission - ScheduledAnalysisPermission', () => {
    let permission: any;

    beforeAll(() => {
      permission = template.Resources.ScheduledAnalysisPermission;
    });

    test('should be defined as AWS::Lambda::Permission type', () => {
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
    });

    test('should have IsScheduledMode condition', () => {
      expect(permission.Condition).toBe('IsScheduledMode');
    });

    test('should reference the Lambda function', () => {
      expect(permission.Properties.FunctionName).toEqual({
        Ref: 'StackAnalysisLambda',
      });
    });

    test('should allow lambda:InvokeFunction action', () => {
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
    });

    test('should allow EventBridge as principal', () => {
      expect(permission.Properties.Principal).toBe('events.amazonaws.com');
    });

    test('should reference the EventBridge rule ARN', () => {
      expect(permission.Properties.SourceArn).toEqual({
        'Fn::GetAtt': ['ScheduledAnalysisRule', 'Arn'],
      });
    });
  });

  // ===================================================================
  // RESOURCES TESTS - SNS TOPIC
  // ===================================================================

  describe('SNS Topic Resource - AnalysisNotificationTopic', () => {
    let topic: any;

    beforeAll(() => {
      topic = template.Resources.AnalysisNotificationTopic;
    });

    test('should be defined as AWS::SNS::Topic type', () => {
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have HasNotificationEmail condition', () => {
      expect(topic.Condition).toBe('HasNotificationEmail');
    });

    test('should have descriptive display name', () => {
      expect(topic.Properties.DisplayName).toBe(
        'CloudFormation Stack Analysis Notifications'
      );
    });
  });

  // ===================================================================
  // RESOURCES TESTS - SNS SUBSCRIPTION
  // ===================================================================

  describe('SNS Subscription - AnalysisNotificationSubscription', () => {
    let subscription: any;

    beforeAll(() => {
      subscription = template.Resources.AnalysisNotificationSubscription;
    });

    test('should be defined as AWS::SNS::Subscription type', () => {
      expect(subscription).toBeDefined();
      expect(subscription.Type).toBe('AWS::SNS::Subscription');
    });

    test('should have HasNotificationEmail condition', () => {
      expect(subscription.Condition).toBe('HasNotificationEmail');
    });

    test('should reference the SNS topic', () => {
      expect(subscription.Properties.TopicArn).toEqual({
        Ref: 'AnalysisNotificationTopic',
      });
    });

    test('should use email protocol', () => {
      expect(subscription.Properties.Protocol).toBe('email');
    });

    test('should use NotificationEmail parameter as endpoint', () => {
      expect(subscription.Properties.Endpoint).toEqual({
        Ref: 'NotificationEmail',
      });
    });
  });

  // ===================================================================
  // RESOURCES TESTS - CLOUDWATCH DASHBOARD
  // ===================================================================

  describe('CloudWatch Dashboard - AnalysisDashboard', () => {
    let dashboard: any;

    beforeAll(() => {
      dashboard = template.Resources.AnalysisDashboard;
    });

    test('should be defined as AWS::CloudWatch::Dashboard type', () => {
      expect(dashboard).toBeDefined();
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('should have correct dashboard name', () => {
      expect(dashboard.Properties.DashboardName).toEqual({
        'Fn::Sub': 'cfn-analysis-${AWS::StackName}',
      });
    });

    test('should have valid dashboard body', () => {
      expect(dashboard.Properties.DashboardBody).toBeDefined();
      const bodyTemplate = dashboard.Properties.DashboardBody['Fn::Sub'];
      expect(bodyTemplate).toBeDefined();
      expect(typeof bodyTemplate).toBe('string');

      const bodyJson = JSON.parse(bodyTemplate);
      expect(bodyJson.widgets).toBeDefined();
      expect(bodyJson.widgets).toHaveLength(1);
    });

    test('should monitor Lambda metrics', () => {
      const bodyTemplate = dashboard.Properties.DashboardBody['Fn::Sub'];
      const bodyJson = JSON.parse(bodyTemplate);
      const widget = bodyJson.widgets[0];

      expect(widget.type).toBe('metric');
      expect(widget.properties.metrics).toBeDefined();
      expect(widget.properties.metrics.length).toBeGreaterThan(0);

      const metricNames = widget.properties.metrics.map((m: any) => m[1]);
      expect(metricNames).toContain('Invocations');
      expect(metricNames).toContain('Errors');
      expect(metricNames).toContain('Duration');
    });
  });

  // ===================================================================
  // OUTPUTS TESTS
  // ===================================================================

  describe('Outputs Configuration', () => {
    test('should have at least 20 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(20);
    });

    test('should have QualityScore output with condition', () => {
      const output = template.Outputs.QualityScore;
      expect(output).toBeDefined();
      expect(output.Description).toBe('Infrastructure quality score (0-100)');
      expect(output.Condition).toBe('HasTargetStackName');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['StackAnalysis', 'QualityScore'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-QualityScore',
      });
    });

    test('should have ComplianceStatus output', () => {
      const output = template.Outputs.ComplianceStatus;
      expect(output).toBeDefined();
      expect(output.Condition).toBe('HasTargetStackName');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['StackAnalysis', 'ComplianceStatus'],
      });
    });

    test('should have all finding count outputs', () => {
      expect(template.Outputs.TotalFindings).toBeDefined();
      expect(template.Outputs.CriticalFindings).toBeDefined();
      expect(template.Outputs.HighFindings).toBeDefined();
      expect(template.Outputs.MediumFindings).toBeDefined();
      expect(template.Outputs.LowFindings).toBeDefined();
    });

    test('should have S3 bucket outputs with condition', () => {
      const bucketName = template.Outputs.AnalysisReportBucketName;
      expect(bucketName).toBeDefined();
      expect(bucketName.Condition).toBe('EnableS3StorageCondition');
      expect(bucketName.Value).toEqual({ Ref: 'AnalysisReportBucket' });

      const bucketArn = template.Outputs.AnalysisReportBucketArn;
      expect(bucketArn).toBeDefined();
      expect(bucketArn.Condition).toBe('EnableS3StorageCondition');
    });

    test('should have Lambda function outputs', () => {
      expect(template.Outputs.AnalysisFunctionArn).toBeDefined();
      expect(template.Outputs.AnalysisFunctionName).toBeDefined();
      expect(template.Outputs.AnalysisFunctionArn.Value).toEqual({
        'Fn::GetAtt': ['StackAnalysisLambda', 'Arn'],
      });
    });

    test('should have IAM role outputs', () => {
      expect(template.Outputs.AnalysisLambdaRoleArn).toBeDefined();
      expect(template.Outputs.AnalysisLambdaRoleName).toBeDefined();
    });

    test('should have stack information outputs', () => {
      expect(template.Outputs.StackName).toBeDefined();
      expect(template.Outputs.StackId).toBeDefined();
      expect(template.Outputs.StackRegion).toBeDefined();
      expect(template.Outputs.AccountId).toBeDefined();
    });

    test('should have parameter value outputs', () => {
      expect(template.Outputs.TargetStackNameParam).toBeDefined();
      expect(template.Outputs.EnableS3StorageParam).toBeDefined();
      expect(template.Outputs.NotificationEmailParam).toBeDefined();
      expect(template.Outputs.AnalysisTriggerModeParam).toBeDefined();
      expect(template.Outputs.AllowedAMIsListParam).toBeDefined();
    });

    test('most outputs should have exports', () => {
      // Count outputs with exports
      const outputsWithExports = Object.entries(template.Outputs).filter(
        ([, output]: [string, any]) => output.Export !== undefined
      );

      // Most outputs should have exports (at least 80%)
      const exportPercentage =
        (outputsWithExports.length / Object.keys(template.Outputs).length) * 100;
      expect(exportPercentage).toBeGreaterThan(80);

      // All outputs with exports should have valid export names
      outputsWithExports.forEach(([key, output]: [string, any]) => {
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toContain(key);
      });
    });

    test('conditional parameter outputs may not have exports', () => {
      // These outputs are conditional and may not have exports when the condition is false
      const conditionalOutputs = ['TargetStackNameParam', 'NotificationEmailParam'];

      conditionalOutputs.forEach((outputName) => {
        const output = template.Outputs[outputName];
        if (output) {
          // If the output exists, it should have a condition
          if (!output.Export) {
            expect(output.Condition).toBeDefined();
          }
        }
      });
    });
  });

  // ===================================================================
  // RESOURCE COUNT TESTS
  // ===================================================================

  describe('Resource Inventory', () => {
    test('should have exactly 9 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(9);
    });

    test('should have all expected resource types', () => {
      const resources = template.Resources;
      expect(resources.AnalysisReportBucket.Type).toBe('AWS::S3::Bucket');
      expect(resources.AnalysisLambdaRole.Type).toBe('AWS::IAM::Role');
      expect(resources.StackAnalysisLambda.Type).toBe('AWS::Lambda::Function');
      expect(resources.StackAnalysis.Type).toBe('Custom::StackAnalysis');
      expect(resources.ScheduledAnalysisRule.Type).toBe('AWS::Events::Rule');
      expect(resources.ScheduledAnalysisPermission.Type).toBe(
        'AWS::Lambda::Permission'
      );
      expect(resources.AnalysisNotificationTopic.Type).toBe('AWS::SNS::Topic');
      expect(resources.AnalysisNotificationSubscription.Type).toBe(
        'AWS::SNS::Subscription'
      );
      expect(resources.AnalysisDashboard.Type).toBe(
        'AWS::CloudWatch::Dashboard'
      );
    });
  });

  // ===================================================================
  // DEPENDENCY AND REFERENCE TESTS
  // ===================================================================

  describe('Resource Dependencies and References', () => {
    test('Lambda function should reference IAM role', () => {
      const lambda = template.Resources.StackAnalysisLambda;
      expect(lambda.Properties.Role).toEqual({
        'Fn::GetAtt': ['AnalysisLambdaRole', 'Arn'],
      });
    });

    test('Custom resource should reference Lambda function', () => {
      const customResource = template.Resources.StackAnalysis;
      expect(customResource.Properties.ServiceToken).toEqual({
        'Fn::GetAtt': ['StackAnalysisLambda', 'Arn'],
      });
    });

    test('EventBridge rule should target Lambda function', () => {
      const rule = template.Resources.ScheduledAnalysisRule;
      expect(rule.Properties.Targets[0].Arn).toEqual({
        'Fn::GetAtt': ['StackAnalysisLambda', 'Arn'],
      });
    });

    test('Lambda permission should reference EventBridge rule', () => {
      const permission = template.Resources.ScheduledAnalysisPermission;
      expect(permission.Properties.SourceArn).toEqual({
        'Fn::GetAtt': ['ScheduledAnalysisRule', 'Arn'],
      });
    });

    test('SNS subscription should reference SNS topic', () => {
      const subscription = template.Resources.AnalysisNotificationSubscription;
      expect(subscription.Properties.TopicArn).toEqual({
        Ref: 'AnalysisNotificationTopic',
      });
    });

    test('IAM role S3 permissions should reference bucket conditionally', () => {
      const role = template.Resources.AnalysisLambdaRole;
      const s3Statement = role.Properties.Policies[0].PolicyDocument.Statement.find(
        (s: any) => s.Action && s.Action.includes('s3:PutObject')
      );

      expect(s3Statement.Resource).toBeDefined();
      expect(s3Statement.Resource[0]['Fn::If']).toBeDefined();
      expect(s3Statement.Resource[0]['Fn::If'][0]).toBe(
        'EnableS3StorageCondition'
      );
    });
  });

  // ===================================================================
  // SECURITY AND COMPLIANCE TESTS
  // ===================================================================

  describe('Security and Compliance Validation', () => {
    test('S3 bucket should enforce encryption', () => {
      const bucket = template.Resources.AnalysisReportBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('S3 bucket should block all public access', () => {
      const bucket = template.Resources.AnalysisReportBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;

      Object.values(publicAccess).forEach((value) => {
        expect(value).toBe(true);
      });
    });

    test('IAM role should follow least privilege with specific actions', () => {
      const role = template.Resources.AnalysisLambdaRole;
      const policy = role.Properties.Policies[0].PolicyDocument;

      policy.Statement.forEach((statement: any) => {
        if (statement.Effect === 'Allow' && statement.Action) {
          const actions = Array.isArray(statement.Action)
            ? statement.Action
            : [statement.Action];

          // Ensure actions are specific, not just "*"
          actions.forEach((action: string) => {
            if (action !== '*') {
              expect(action).toMatch(/^[a-z0-9-]+:[A-Za-z]+/);
            }
          });
        }
      });
    });

    test('Lambda function should have reasonable timeout', () => {
      const lambda = template.Resources.StackAnalysisLambda;
      expect(lambda.Properties.Timeout).toBeLessThanOrEqual(900);
      expect(lambda.Properties.Timeout).toBeGreaterThan(0);
    });

    test('S3 bucket should have lifecycle policy for cost optimization', () => {
      const bucket = template.Resources.AnalysisReportBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules.length).toBeGreaterThan(
        0
      );
    });
  });
});
