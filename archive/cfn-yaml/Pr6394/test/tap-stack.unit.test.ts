import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Infrastructure Analysis System', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have description for infrastructure analysis system', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Infrastructure Analysis');
      expect(template.Description).toContain('CloudFormation stacks');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('should have NotificationEmail parameter with validation', () => {
      expect(template.Parameters.NotificationEmail).toBeDefined();
      expect(template.Parameters.NotificationEmail.Type).toBe('String');
      expect(template.Parameters.NotificationEmail.AllowedPattern).toBeDefined();
      expect(template.Parameters.NotificationEmail.Description).toContain('Email');
    });

    test('should have AnalysisSchedule parameter with default', () => {
      expect(template.Parameters.AnalysisSchedule).toBeDefined();
      expect(template.Parameters.AnalysisSchedule.Type).toBe('String');
      expect(template.Parameters.AnalysisSchedule.Default).toBe('rate(1 day)');
    });

    test('should have ReportRetentionDays parameter with constraints', () => {
      expect(template.Parameters.ReportRetentionDays).toBeDefined();
      expect(template.Parameters.ReportRetentionDays.Type).toBe('Number');
      expect(template.Parameters.ReportRetentionDays.Default).toBe(90);
      expect(template.Parameters.ReportRetentionDays.MinValue).toBe(1);
      expect(template.Parameters.ReportRetentionDays.MaxValue).toBe(365);
    });
  });

  describe('S3 Bucket Resources', () => {
    test('should have AnalysisReportsBucket resource', () => {
      expect(template.Resources.AnalysisReportsBucket).toBeDefined();
      expect(template.Resources.AnalysisReportsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have bucket name with EnvironmentSuffix', () => {
      const bucket = template.Resources.AnalysisReportsBucket;
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'stack-analysis-reports-${EnvironmentSuffix}',
      });
    });

    test('should have encryption enabled', () => {
      const bucket = template.Resources.AnalysisReportsBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('should block all public access', () => {
      const bucket = template.Resources.AnalysisReportsBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('should have versioning enabled', () => {
      const bucket = template.Resources.AnalysisReportsBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have lifecycle policy for report retention', () => {
      const bucket = template.Resources.AnalysisReportsBucket;
      const lifecycleRules = bucket.Properties.LifecycleConfiguration.Rules;
      expect(lifecycleRules).toHaveLength(1);
      expect(lifecycleRules[0].Status).toBe('Enabled');
      expect(lifecycleRules[0].ExpirationInDays).toEqual({ Ref: 'ReportRetentionDays' });
    });

    test('should have proper tags', () => {
      const bucket = template.Resources.AnalysisReportsBucket;
      expect(bucket.Properties.Tags).toBeDefined();
      const tags = bucket.Properties.Tags;
      expect(tags.some((t: any) => t.Key === 'Name')).toBe(true);
      expect(tags.some((t: any) => t.Key === 'Environment')).toBe(true);
      expect(tags.some((t: any) => t.Key === 'Purpose')).toBe(true);
    });

    test('should not have DeletionPolicy Retain', () => {
      const bucket = template.Resources.AnalysisReportsBucket;
      expect(bucket.DeletionPolicy).not.toBe('Retain');
    });
  });

  describe('S3 Bucket Policy', () => {
    test('should have AnalysisReportsBucketPolicy resource', () => {
      expect(template.Resources.AnalysisReportsBucketPolicy).toBeDefined();
      expect(template.Resources.AnalysisReportsBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });

    test('should reference the correct bucket', () => {
      const policy = template.Resources.AnalysisReportsBucketPolicy;
      expect(policy.Properties.Bucket).toEqual({ Ref: 'AnalysisReportsBucket' });
    });

    test('should deny insecure transport', () => {
      const policy = template.Resources.AnalysisReportsBucketPolicy;
      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Sid).toBe('DenyInsecureTransport');
      expect(statement.Effect).toBe('Deny');
      expect(statement.Condition.Bool['aws:SecureTransport']).toBe(false);
    });
  });

  describe('SNS Topic', () => {
    test('should have AnalysisNotificationTopic resource', () => {
      expect(template.Resources.AnalysisNotificationTopic).toBeDefined();
      expect(template.Resources.AnalysisNotificationTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have topic name with EnvironmentSuffix', () => {
      const topic = template.Resources.AnalysisNotificationTopic;
      expect(topic.Properties.TopicName).toEqual({
        'Fn::Sub': 'stack-analysis-notifications-${EnvironmentSuffix}',
      });
    });

    test('should have email subscription configured', () => {
      const topic = template.Resources.AnalysisNotificationTopic;
      expect(topic.Properties.Subscription).toBeDefined();
      expect(topic.Properties.Subscription).toHaveLength(1);
      expect(topic.Properties.Subscription[0].Protocol).toBe('email');
      expect(topic.Properties.Subscription[0].Endpoint).toEqual({ Ref: 'NotificationEmail' });
    });

    test('should have proper tags', () => {
      const topic = template.Resources.AnalysisNotificationTopic;
      expect(topic.Properties.Tags).toBeDefined();
      const tags = topic.Properties.Tags;
      expect(tags.some((t: any) => t.Key === 'Name')).toBe(true);
      expect(tags.some((t: any) => t.Key === 'Environment')).toBe(true);
    });
  });

  describe('IAM Role', () => {
    test('should have AnalysisLambdaExecutionRole resource', () => {
      expect(template.Resources.AnalysisLambdaExecutionRole).toBeDefined();
      expect(template.Resources.AnalysisLambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have role name with EnvironmentSuffix', () => {
      const role = template.Resources.AnalysisLambdaExecutionRole;
      expect(role.Properties.RoleName).toEqual({
        'Fn::Sub': 'stack-analysis-lambda-role-${EnvironmentSuffix}',
      });
    });

    test('should have Lambda service as trusted entity', () => {
      const role = template.Resources.AnalysisLambdaExecutionRole;
      const statement = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Principal.Service).toBe('lambda.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });

    test('should have basic Lambda execution role', () => {
      const role = template.Resources.AnalysisLambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
    });

    test('should have CloudFormation read permissions', () => {
      const role = template.Resources.AnalysisLambdaExecutionRole;
      const policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'CloudFormationReadAccess');
      expect(policy).toBeDefined();

      const cfnStatement = policy.PolicyDocument.Statement.find((s: any) => s.Sid === 'AllowCloudFormationReadOperations');
      expect(cfnStatement).toBeDefined();
      expect(cfnStatement.Effect).toBe('Allow');
      expect(cfnStatement.Action).toContain('cloudformation:DescribeStacks');
      expect(cfnStatement.Action).toContain('cloudformation:ListStacks');
    });

    test('should have S3 write permissions for reports', () => {
      const role = template.Resources.AnalysisLambdaExecutionRole;
      const policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'CloudFormationReadAccess');

      const s3Statement = policy.PolicyDocument.Statement.find((s: any) => s.Sid === 'AllowS3ReportUpload');
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Effect).toBe('Allow');
      expect(s3Statement.Action).toContain('s3:PutObject');
    });

    test('should have SNS publish permissions', () => {
      const role = template.Resources.AnalysisLambdaExecutionRole;
      const policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'CloudFormationReadAccess');

      const snsStatement = policy.PolicyDocument.Statement.find((s: any) => s.Sid === 'AllowSNSPublish');
      expect(snsStatement).toBeDefined();
      expect(snsStatement.Effect).toBe('Allow');
      expect(snsStatement.Action).toContain('sns:Publish');
    });

    test('should have CloudWatch metrics permissions with namespace condition', () => {
      const role = template.Resources.AnalysisLambdaExecutionRole;
      const policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'CloudFormationReadAccess');

      const cwStatement = policy.PolicyDocument.Statement.find((s: any) => s.Sid === 'AllowCloudWatchMetrics');
      expect(cwStatement).toBeDefined();
      expect(cwStatement.Condition.StringEquals['cloudwatch:namespace']).toBe('StackAnalysis');
    });
  });

  describe('Lambda Function', () => {
    test('should have StackAnalysisFunction resource', () => {
      expect(template.Resources.StackAnalysisFunction).toBeDefined();
      expect(template.Resources.StackAnalysisFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('should have function name with EnvironmentSuffix', () => {
      const func = template.Resources.StackAnalysisFunction;
      expect(func.Properties.FunctionName).toEqual({
        'Fn::Sub': 'stack-analysis-function-${EnvironmentSuffix}',
      });
    });

    test('should use Python 3.11 runtime', () => {
      const func = template.Resources.StackAnalysisFunction;
      expect(func.Properties.Runtime).toBe('python3.11');
    });

    test('should have correct handler', () => {
      const func = template.Resources.StackAnalysisFunction;
      expect(func.Properties.Handler).toBe('index.lambda_handler');
    });

    test('should have appropriate timeout and memory', () => {
      const func = template.Resources.StackAnalysisFunction;
      expect(func.Properties.Timeout).toBe(300);
      expect(func.Properties.MemorySize).toBe(512);
    });

    test('should reference the IAM role', () => {
      const func = template.Resources.StackAnalysisFunction;
      expect(func.Properties.Role).toEqual({
        'Fn::GetAtt': ['AnalysisLambdaExecutionRole', 'Arn'],
      });
    });

    test('should have environment variables configured', () => {
      const func = template.Resources.StackAnalysisFunction;
      expect(func.Properties.Environment.Variables.REPORT_BUCKET).toEqual({ Ref: 'AnalysisReportsBucket' });
      expect(func.Properties.Environment.Variables.SNS_TOPIC_ARN).toEqual({ Ref: 'AnalysisNotificationTopic' });
      expect(func.Properties.Environment.Variables.ENVIRONMENT_SUFFIX).toEqual({ Ref: 'EnvironmentSuffix' });
    });

    test('should have inline code with lambda_handler', () => {
      const func = template.Resources.StackAnalysisFunction;
      expect(func.Properties.Code.ZipFile).toBeDefined();
      expect(func.Properties.Code.ZipFile).toContain('def lambda_handler');
      expect(func.Properties.Code.ZipFile).toContain('import boto3');
    });

    test('should have proper tags', () => {
      const func = template.Resources.StackAnalysisFunction;
      expect(func.Properties.Tags).toBeDefined();
      const tags = func.Properties.Tags;
      expect(tags.some((t: any) => t.Key === 'Name')).toBe(true);
      expect(tags.some((t: any) => t.Key === 'Environment')).toBe(true);
    });
  });

  describe('CloudWatch Log Group', () => {
    test('should have AnalysisLogGroup resource', () => {
      expect(template.Resources.AnalysisLogGroup).toBeDefined();
      expect(template.Resources.AnalysisLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have correct log group name', () => {
      const logGroup = template.Resources.AnalysisLogGroup;
      expect(logGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/lambda/stack-analysis-function-${EnvironmentSuffix}',
      });
    });

    test('should have 30 day retention', () => {
      const logGroup = template.Resources.AnalysisLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('EventBridge Rule', () => {
    test('should have ScheduledAnalysisRule resource', () => {
      expect(template.Resources.ScheduledAnalysisRule).toBeDefined();
      expect(template.Resources.ScheduledAnalysisRule.Type).toBe('AWS::Events::Rule');
    });

    test('should have rule name with EnvironmentSuffix', () => {
      const rule = template.Resources.ScheduledAnalysisRule;
      expect(rule.Properties.Name).toEqual({
        'Fn::Sub': 'stack-analysis-schedule-${EnvironmentSuffix}',
      });
    });

    test('should use schedule from parameter', () => {
      const rule = template.Resources.ScheduledAnalysisRule;
      expect(rule.Properties.ScheduleExpression).toEqual({ Ref: 'AnalysisSchedule' });
    });

    test('should be enabled by default', () => {
      const rule = template.Resources.ScheduledAnalysisRule;
      expect(rule.Properties.State).toBe('ENABLED');
    });

    test('should target Lambda function', () => {
      const rule = template.Resources.ScheduledAnalysisRule;
      expect(rule.Properties.Targets).toHaveLength(1);
      expect(rule.Properties.Targets[0].Arn).toEqual({
        'Fn::GetAtt': ['StackAnalysisFunction', 'Arn'],
      });
    });
  });

  describe('Lambda Permission', () => {
    test('should have AnalysisInvokePermission resource', () => {
      expect(template.Resources.AnalysisInvokePermission).toBeDefined();
      expect(template.Resources.AnalysisInvokePermission.Type).toBe('AWS::Lambda::Permission');
    });

    test('should allow EventBridge to invoke Lambda', () => {
      const permission = template.Resources.AnalysisInvokePermission;
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('events.amazonaws.com');
    });

    test('should reference correct function and rule', () => {
      const permission = template.Resources.AnalysisInvokePermission;
      expect(permission.Properties.FunctionName).toEqual({ Ref: 'StackAnalysisFunction' });
      expect(permission.Properties.SourceArn).toEqual({
        'Fn::GetAtt': ['ScheduledAnalysisRule', 'Arn'],
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have AnalysisFunctionErrorAlarm resource', () => {
      expect(template.Resources.AnalysisFunctionErrorAlarm).toBeDefined();
      expect(template.Resources.AnalysisFunctionErrorAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have alarm name with EnvironmentSuffix', () => {
      const alarm = template.Resources.AnalysisFunctionErrorAlarm;
      expect(alarm.Properties.AlarmName).toEqual({
        'Fn::Sub': 'stack-analysis-errors-${EnvironmentSuffix}',
      });
    });

    test('should monitor Lambda errors', () => {
      const alarm = template.Resources.AnalysisFunctionErrorAlarm;
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
    });

    test('should have CriticalFindingsAlarm resource', () => {
      expect(template.Resources.CriticalFindingsAlarm).toBeDefined();
      expect(template.Resources.CriticalFindingsAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should monitor custom CriticalFindings metric', () => {
      const alarm = template.Resources.CriticalFindingsAlarm;
      expect(alarm.Properties.MetricName).toBe('CriticalFindings');
      expect(alarm.Properties.Namespace).toBe('StackAnalysis');
    });

    test('both alarms should publish to SNS topic', () => {
      const errorAlarm = template.Resources.AnalysisFunctionErrorAlarm;
      const findingsAlarm = template.Resources.CriticalFindingsAlarm;

      expect(errorAlarm.Properties.AlarmActions).toEqual([{ Ref: 'AnalysisNotificationTopic' }]);
      expect(findingsAlarm.Properties.AlarmActions).toEqual([{ Ref: 'AnalysisNotificationTopic' }]);
    });
  });

  describe('Outputs', () => {
    test('should have AnalysisReportsBucketName output', () => {
      expect(template.Outputs.AnalysisReportsBucketName).toBeDefined();
      expect(template.Outputs.AnalysisReportsBucketName.Value).toEqual({ Ref: 'AnalysisReportsBucket' });
    });

    test('should have AnalysisReportsBucketArn output', () => {
      expect(template.Outputs.AnalysisReportsBucketArn).toBeDefined();
      expect(template.Outputs.AnalysisReportsBucketArn.Value).toEqual({
        'Fn::GetAtt': ['AnalysisReportsBucket', 'Arn'],
      });
    });

    test('should have StackAnalysisFunctionArn output', () => {
      expect(template.Outputs.StackAnalysisFunctionArn).toBeDefined();
      expect(template.Outputs.StackAnalysisFunctionArn.Value).toEqual({
        'Fn::GetAtt': ['StackAnalysisFunction', 'Arn'],
      });
    });

    test('should have AnalysisNotificationTopicArn output', () => {
      expect(template.Outputs.AnalysisNotificationTopicArn).toBeDefined();
      expect(template.Outputs.AnalysisNotificationTopicArn.Value).toEqual({ Ref: 'AnalysisNotificationTopic' });
    });

    test('should have ScheduledAnalysisRuleArn output', () => {
      expect(template.Outputs.ScheduledAnalysisRuleArn).toBeDefined();
      expect(template.Outputs.ScheduledAnalysisRuleArn.Value).toEqual({
        'Fn::GetAtt': ['ScheduledAnalysisRule', 'Arn'],
      });
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should have exactly 10 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(10);
    });

    test('should have all expected resource types', () => {
      const resourceTypes = Object.values(template.Resources).map((r: any) => r.Type);
      expect(resourceTypes).toContain('AWS::S3::Bucket');
      expect(resourceTypes).toContain('AWS::S3::BucketPolicy');
      expect(resourceTypes).toContain('AWS::SNS::Topic');
      expect(resourceTypes).toContain('AWS::IAM::Role');
      expect(resourceTypes).toContain('AWS::Lambda::Function');
      expect(resourceTypes).toContain('AWS::Logs::LogGroup');
      expect(resourceTypes).toContain('AWS::Events::Rule');
      expect(resourceTypes).toContain('AWS::Lambda::Permission');
      expect(resourceTypes).toContain('AWS::CloudWatch::Alarm');
    });
  });

  describe('Security Best Practices', () => {
    test('should not have any Retain deletion policies', () => {
      Object.values(template.Resources).forEach((resource: any) => {
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });
    });

    test('should not have DeletionProtection enabled', () => {
      Object.values(template.Resources).forEach((resource: any) => {
        if (resource.Properties) {
          expect(resource.Properties.DeletionProtectionEnabled).not.toBe(true);
        }
      });
    });

    test('all resource names should include EnvironmentSuffix', () => {
      const resourcesWithNames = [
        'AnalysisReportsBucket',
        'AnalysisNotificationTopic',
        'AnalysisLambdaExecutionRole',
        'StackAnalysisFunction',
        'AnalysisLogGroup',
        'ScheduledAnalysisRule',
        'AnalysisFunctionErrorAlarm',
        'CriticalFindingsAlarm',
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const nameProperty = resource.Properties.BucketName ||
                           resource.Properties.TopicName ||
                           resource.Properties.RoleName ||
                           resource.Properties.FunctionName ||
                           resource.Properties.LogGroupName ||
                           resource.Properties.Name ||
                           resource.Properties.AlarmName;

        if (nameProperty) {
          expect(nameProperty['Fn::Sub']).toBeDefined();
          expect(nameProperty['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });
  });

  describe('Lambda Function Code Quality', () => {
    let lambdaCode: string;

    beforeAll(() => {
      lambdaCode = template.Resources.StackAnalysisFunction.Properties.Code.ZipFile;
    });

    test('should import required AWS SDK clients', () => {
      expect(lambdaCode).toContain('boto3.client(\'cloudformation\')');
      expect(lambdaCode).toContain('boto3.client(\'s3\')');
      expect(lambdaCode).toContain('boto3.client(\'sns\')');
      expect(lambdaCode).toContain('boto3.client(\'cloudwatch\')');
    });

    test('should have error handling', () => {
      expect(lambdaCode).toContain('try:');
      expect(lambdaCode).toContain('except');
      expect(lambdaCode).toContain('raise');
    });

    test('should have pagination support', () => {
      expect(lambdaCode).toContain('paginator');
      expect(lambdaCode).toContain('paginate');
    });

    test('should generate reports with proper structure', () => {
      expect(lambdaCode).toContain('generate_report');
      expect(lambdaCode).toContain('store_report');
      expect(lambdaCode).toContain('json.dumps');
    });

    test('should publish CloudWatch metrics', () => {
      expect(lambdaCode).toContain('publish_metrics');
      expect(lambdaCode).toContain('put_metric_data');
      expect(lambdaCode).toContain('StackAnalysis');
    });

    test('should send SNS notifications for critical findings', () => {
      expect(lambdaCode).toContain('send_notification');
      expect(lambdaCode).toContain('sns_client.publish');
      expect(lambdaCode).toContain('critical_count');
    });

    test('should have severity levels defined', () => {
      expect(lambdaCode).toContain('CRITICAL');
      expect(lambdaCode).toContain('severity');
    });

    test('should check for resource compliance', () => {
      expect(lambdaCode).toContain('check_iam_role');
      expect(lambdaCode).toContain('check_s3_bucket');
      expect(lambdaCode).toContain('check_rds_instance');
    });
  });
});
