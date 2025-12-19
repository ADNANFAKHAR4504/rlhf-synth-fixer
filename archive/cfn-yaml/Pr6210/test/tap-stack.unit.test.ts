import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Security Analysis System', () => {
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

    test('should have a description for security analysis system', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Automated Security Analysis System');
      expect(template.Description).toContain('AWS Infrastructure Compliance');
    });

    test('should have metadata section with parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(
        template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups
      ).toBeDefined();
      expect(
        template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups.length
      ).toBe(2);
    });

    test('should have all required top-level sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Metadata).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have TargetStackNames parameter', () => {
      expect(template.Parameters.TargetStackNames).toBeDefined();
      const param = template.Parameters.TargetStackNames;
      expect(param.Type).toBe('CommaDelimitedList');
      expect(param.Description).toContain('CloudFormation stack names');
      expect(param.Default).toBe('');
    });

    test('should have EmailNotification parameter with validation', () => {
      expect(template.Parameters.EmailNotification).toBeDefined();
      const param = template.Parameters.EmailNotification;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
      expect(param.AllowedPattern).toBeDefined();
      expect(param.AllowedPattern).toContain('@');
      expect(param.ConstraintDescription).toContain('valid email');
    });

    test('should have AnalysisSchedule parameter with default', () => {
      expect(template.Parameters.AnalysisSchedule).toBeDefined();
      const param = template.Parameters.AnalysisSchedule;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('rate(24 hours)');
      expect(param.Description).toContain('Schedule expression');
    });

    test('should have CriticalPortsList parameter with default ports', () => {
      expect(template.Parameters.CriticalPortsList).toBeDefined();
      const param = template.Parameters.CriticalPortsList;
      expect(param.Type).toBe('CommaDelimitedList');
      expect(param.Default).toContain('22');
      expect(param.Default).toContain('3389');
      expect(param.Default).toContain('3306');
      expect(param.Default).toContain('443');
    });

    test('should have exactly 4 parameters defined', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4);
    });
  });

  describe('Conditions', () => {
    test('should have HasEmailNotification condition', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.HasEmailNotification).toBeDefined();
      expect(template.Conditions.HasEmailNotification['Fn::Not']).toBeDefined();
    });

    test('HasEmailNotification should check for empty string', () => {
      const condition = template.Conditions.HasEmailNotification;
      expect(condition['Fn::Not'][0]['Fn::Equals']).toBeDefined();
      expect(condition['Fn::Not'][0]['Fn::Equals'][0]).toEqual({
        Ref: 'EmailNotification',
      });
      expect(condition['Fn::Not'][0]['Fn::Equals'][1]).toBe('');
    });
  });

  describe('S3 Bucket - ComplianceReportsBucket', () => {
    let bucket: any;

    beforeAll(() => {
      bucket = template.Resources.ComplianceReportsBucket;
    });

    test('should exist and be of correct type', () => {
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have dynamically generated bucket name', () => {
      expect(bucket.Properties.BucketName).toBeDefined();
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain(
        'security-compliance-reports'
      );
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain('${AWS::AccountId}');
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain('${AWS::Region}');
    });

    test('should have encryption enabled with AES256', () => {
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      const encryption =
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault;
      expect(encryption.SSEAlgorithm).toBe('AES256');
    });

    test('should have all public access blocks enabled', () => {
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock).toBeDefined();
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('should have versioning enabled', () => {
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have lifecycle policy to delete old reports after 90 days', () => {
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      const rules = bucket.Properties.LifecycleConfiguration.Rules;
      expect(rules).toHaveLength(1);
      expect(rules[0].Id).toBe('DeleteOldReports');
      expect(rules[0].Status).toBe('Enabled');
      expect(rules[0].ExpirationInDays).toBe(90);
    });

    test('should have appropriate tags', () => {
      expect(bucket.Properties.Tags).toBeDefined();
      expect(bucket.Properties.Tags).toHaveLength(2);
      const tags = bucket.Properties.Tags;
      expect(tags.find((t: any) => t.Key === 'Purpose')?.Value).toBe(
        'SecurityCompliance'
      );
      expect(tags.find((t: any) => t.Key === 'ManagedBy')?.Value).toBe(
        'SecurityAnalysisSystem'
      );
    });
  });

  describe('SNS Topic - CriticalViolationsTopic', () => {
    let topic: any;

    beforeAll(() => {
      topic = template.Resources.CriticalViolationsTopic;
    });

    test('should exist and be of correct type', () => {
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have correct topic name and display name', () => {
      expect(topic.Properties.TopicName).toBe('SecurityComplianceAlerts');
      expect(topic.Properties.DisplayName).toBe('Critical Security Violations');
    });

    test('should have conditional email subscription', () => {
      expect(topic.Properties.Subscription).toBeDefined();
      expect(topic.Properties.Subscription['Fn::If']).toBeDefined();
      expect(topic.Properties.Subscription['Fn::If'][0]).toBe(
        'HasEmailNotification'
      );
    });

    test('email subscription should have correct structure when condition is true', () => {
      const subscription = topic.Properties.Subscription['Fn::If'][1];
      expect(subscription).toHaveLength(1);
      expect(subscription[0].Endpoint).toEqual({ Ref: 'EmailNotification' });
      expect(subscription[0].Protocol).toBe('email');
    });

    test('should have AWS::NoValue when condition is false', () => {
      const noValue = topic.Properties.Subscription['Fn::If'][2];
      expect(noValue).toEqual({ Ref: 'AWS::NoValue' });
    });

    test('should have appropriate tags', () => {
      expect(topic.Properties.Tags).toBeDefined();
      expect(topic.Properties.Tags).toHaveLength(1);
      expect(topic.Properties.Tags[0].Key).toBe('Purpose');
      expect(topic.Properties.Tags[0].Value).toBe('SecurityAlerts');
    });
  });

  describe('IAM Role - SecurityAnalysisLambdaRole', () => {
    let role: any;

    beforeAll(() => {
      role = template.Resources.SecurityAnalysisLambdaRole;
    });

    test('should exist and be of correct type', () => {
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should have Lambda trust policy', () => {
      const assumeRolePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumeRolePolicy).toBeDefined();
      expect(assumeRolePolicy.Version).toBe('2012-10-17');
      expect(assumeRolePolicy.Statement).toHaveLength(1);
      expect(assumeRolePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe(
        'lambda.amazonaws.com'
      );
      expect(assumeRolePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should have Lambda basic execution managed policy attached', () => {
      expect(role.Properties.ManagedPolicyArns).toBeDefined();
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
    });

    test('should have inline policy for security analysis', () => {
      expect(role.Properties.Policies).toBeDefined();
      expect(role.Properties.Policies).toHaveLength(1);
      expect(role.Properties.Policies[0].PolicyName).toBe('SecurityAnalysisPolicy');
    });

    test('should have CloudFormation permissions', () => {
      const policy = role.Properties.Policies[0].PolicyDocument;
      const cfnStatement = policy.Statement.find((s: any) =>
        s.Action.some((a: string) => a.startsWith('cloudformation:'))
      );
      expect(cfnStatement).toBeDefined();
      expect(cfnStatement.Effect).toBe('Allow');
      expect(cfnStatement.Action).toContain('cloudformation:DescribeStacks');
      expect(cfnStatement.Action).toContain('cloudformation:ListStackResources');
      expect(cfnStatement.Action).toContain('cloudformation:GetTemplate');
    });

    test('should have IAM read permissions', () => {
      const policy = role.Properties.Policies[0].PolicyDocument;
      const iamStatement = policy.Statement.find((s: any) =>
        s.Action.some((a: string) => a.startsWith('iam:'))
      );
      expect(iamStatement).toBeDefined();
      expect(iamStatement.Action).toContain('iam:GetRole');
      expect(iamStatement.Action).toContain('iam:GetRolePolicy');
      expect(iamStatement.Action).toContain('iam:GetPolicy');
    });

    test('should have S3 read permissions', () => {
      const policy = role.Properties.Policies[0].PolicyDocument;
      const s3ReadStatement = policy.Statement.find(
        (s: any) =>
          s.Action.some((a: string) => a.startsWith('s3:Get')) ||
          s.Action.some((a: string) => a === 's3:ListBucket')
      );
      expect(s3ReadStatement).toBeDefined();
      expect(s3ReadStatement.Action).toContain('s3:GetEncryptionConfiguration');
      expect(s3ReadStatement.Action).toContain('s3:GetBucketVersioning');
    });

    test('should have S3 write permissions to reports bucket', () => {
      const policy = role.Properties.Policies[0].PolicyDocument;
      const s3WriteStatement = policy.Statement.find((s: any) =>
        s.Action.some((a: string) => a === 's3:PutObject')
      );
      expect(s3WriteStatement).toBeDefined();
      expect(s3WriteStatement.Resource).toBeDefined();
      expect(s3WriteStatement.Resource['Fn::Sub']).toContain(
        '${ComplianceReportsBucket.Arn}/*'
      );
    });

    test('should have SNS publish permissions', () => {
      const policy = role.Properties.Policies[0].PolicyDocument;
      const snsStatement = policy.Statement.find((s: any) =>
        s.Action.includes('sns:Publish')
      );
      expect(snsStatement).toBeDefined();
      expect(snsStatement.Resource).toEqual({ Ref: 'CriticalViolationsTopic' });
    });

    test('should have CloudWatch metrics permissions', () => {
      const policy = role.Properties.Policies[0].PolicyDocument;
      const cwStatement = policy.Statement.find((s: any) =>
        s.Action.includes('cloudwatch:PutMetricData')
      );
      expect(cwStatement).toBeDefined();
      expect(cwStatement.Resource).toBe('*');
    });

    test('should have RDS read permissions', () => {
      const policy = role.Properties.Policies[0].PolicyDocument;
      const rdsStatement = policy.Statement.find((s: any) =>
        s.Action.some((a: string) => a.startsWith('rds:'))
      );
      expect(rdsStatement).toBeDefined();
      expect(rdsStatement.Action).toContain('rds:DescribeDBInstances');
    });

    test('should have EC2 read permissions for security groups', () => {
      const policy = role.Properties.Policies[0].PolicyDocument;
      const ec2Statement = policy.Statement.find((s: any) =>
        s.Action.some((a: string) => a.startsWith('ec2:'))
      );
      expect(ec2Statement).toBeDefined();
      expect(ec2Statement.Action).toContain('ec2:DescribeSecurityGroups');
    });

    test('should have appropriate tags', () => {
      expect(role.Properties.Tags).toBeDefined();
      expect(role.Properties.Tags[0].Key).toBe('Purpose');
      expect(role.Properties.Tags[0].Value).toBe('SecurityAnalysis');
    });
  });

  describe('Lambda Function - SecurityAnalysisFunction', () => {
    let lambdaFunction: any;

    beforeAll(() => {
      lambdaFunction = template.Resources.SecurityAnalysisFunction;
    });

    test('should exist and be of correct type', () => {
      expect(lambdaFunction).toBeDefined();
      expect(lambdaFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('should have correct function name', () => {
      expect(lambdaFunction.Properties.FunctionName).toBe(
        'SecurityComplianceAnalyzer'
      );
    });

    test('should use Python 3.9 runtime', () => {
      expect(lambdaFunction.Properties.Runtime).toBe('python3.9');
    });

    test('should have correct handler', () => {
      expect(lambdaFunction.Properties.Handler).toBe('index.lambda_handler');
    });

    test('should reference the Lambda execution role', () => {
      expect(lambdaFunction.Properties.Role).toBeDefined();
      expect(lambdaFunction.Properties.Role['Fn::GetAtt']).toEqual([
        'SecurityAnalysisLambdaRole',
        'Arn',
      ]);
    });

    test('should have sufficient timeout for security analysis (900 seconds)', () => {
      expect(lambdaFunction.Properties.Timeout).toBe(900);
    });

    test('should have sufficient memory (1024 MB)', () => {
      expect(lambdaFunction.Properties.MemorySize).toBe(1024);
    });

    test('should have environment variables configured', () => {
      const envVars = lambdaFunction.Properties.Environment.Variables;
      expect(envVars).toBeDefined();
      expect(envVars.REPORTS_BUCKET).toBeDefined();
      expect(envVars.SNS_TOPIC_ARN).toBeDefined();
      expect(envVars.CRITICAL_PORTS).toBeDefined();
      expect(envVars.REGION).toBeDefined();
    });

    test('environment variables should reference stack resources', () => {
      const envVars = lambdaFunction.Properties.Environment.Variables;
      expect(envVars.REPORTS_BUCKET).toEqual({ Ref: 'ComplianceReportsBucket' });
      expect(envVars.SNS_TOPIC_ARN).toEqual({ Ref: 'CriticalViolationsTopic' });
      expect(envVars.REGION).toEqual({ Ref: 'AWS::Region' });
    });

    test('CRITICAL_PORTS should use Fn::Join with parameter reference', () => {
      const envVars = lambdaFunction.Properties.Environment.Variables;
      expect(envVars.CRITICAL_PORTS['Fn::Join']).toBeDefined();
      expect(envVars.CRITICAL_PORTS['Fn::Join'][0]).toBe(',');
      expect(envVars.CRITICAL_PORTS['Fn::Join'][1]).toEqual({
        Ref: 'CriticalPortsList',
      });
    });

    test('should have inline code (ZipFile)', () => {
      expect(lambdaFunction.Properties.Code).toBeDefined();
      expect(lambdaFunction.Properties.Code.ZipFile).toBeDefined();
      expect(lambdaFunction.Properties.Code.ZipFile.length).toBeGreaterThan(1000);
    });

    test('Lambda code should import required AWS SDK clients', () => {
      const code = lambdaFunction.Properties.Code.ZipFile;
      expect(code).toContain('import boto3');
      expect(code).toContain("boto3.client('cloudformation')");
      expect(code).toContain("boto3.client('iam')");
      expect(code).toContain("boto3.client('s3')");
      expect(code).toContain("boto3.client('sns')");
    });

    test('Lambda code should have SecurityAnalyzer class', () => {
      const code = lambdaFunction.Properties.Code.ZipFile;
      expect(code).toContain('class SecurityAnalyzer');
      expect(code).toContain('def analyze_iam_roles');
      expect(code).toContain('def analyze_s3_buckets');
      expect(code).toContain('def analyze_rds_instances');
      expect(code).toContain('def analyze_security_groups');
    });

    test('Lambda code should have lambda_handler function', () => {
      const code = lambdaFunction.Properties.Code.ZipFile;
      expect(code).toContain('def lambda_handler(event, context)');
    });

    test('should have appropriate tags', () => {
      expect(lambdaFunction.Properties.Tags).toBeDefined();
      expect(lambdaFunction.Properties.Tags[0].Key).toBe('Purpose');
      expect(lambdaFunction.Properties.Tags[0].Value).toBe('SecurityAnalysis');
    });
  });

  describe('Custom Resource - InitialAnalysisTrigger', () => {
    let customResource: any;

    beforeAll(() => {
      customResource = template.Resources.InitialAnalysisTrigger;
    });

    test('should exist and be of correct type', () => {
      expect(customResource).toBeDefined();
      expect(customResource.Type).toBe('AWS::CloudFormation::CustomResource');
    });

    test('should reference Lambda function ARN as ServiceToken', () => {
      expect(customResource.Properties.ServiceToken).toBeDefined();
      expect(customResource.Properties.ServiceToken['Fn::GetAtt']).toEqual([
        'SecurityAnalysisFunction',
        'Arn',
      ]);
    });

    test('should pass TargetStacks parameter', () => {
      expect(customResource.Properties.TargetStacks).toBeDefined();
      expect(customResource.Properties.TargetStacks).toEqual({
        Ref: 'TargetStackNames',
      });
    });
  });

  describe('EventBridge Rule - ScheduledAnalysisRule', () => {
    let rule: any;

    beforeAll(() => {
      rule = template.Resources.ScheduledAnalysisRule;
    });

    test('should exist and be of correct type', () => {
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::Events::Rule');
    });

    test('should have correct rule name', () => {
      expect(rule.Properties.Name).toBe('ScheduledSecurityAnalysis');
    });

    test('should have descriptive description', () => {
      expect(rule.Properties.Description).toContain(
        'periodic security compliance analysis'
      );
    });

    test('should use schedule from parameter', () => {
      expect(rule.Properties.ScheduleExpression).toEqual({
        Ref: 'AnalysisSchedule',
      });
    });

    test('should be in ENABLED state', () => {
      expect(rule.Properties.State).toBe('ENABLED');
    });

    test('should have Lambda function as target', () => {
      expect(rule.Properties.Targets).toBeDefined();
      expect(rule.Properties.Targets).toHaveLength(1);
      expect(rule.Properties.Targets[0].Arn['Fn::GetAtt']).toEqual([
        'SecurityAnalysisFunction',
        'Arn',
      ]);
      expect(rule.Properties.Targets[0].Id).toBe('SecurityAnalysisTarget');
    });

    test('should pass TargetStacks in input payload', () => {
      const input = rule.Properties.Targets[0].Input;
      expect(input).toBeDefined();
      expect(input['Fn::Sub']).toBeDefined();
    });
  });

  describe('Lambda Permission - ScheduledAnalysisPermission', () => {
    let permission: any;

    beforeAll(() => {
      permission = template.Resources.ScheduledAnalysisPermission;
    });

    test('should exist and be of correct type', () => {
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
    });

    test('should reference Lambda function', () => {
      expect(permission.Properties.FunctionName).toEqual({
        Ref: 'SecurityAnalysisFunction',
      });
    });

    test('should allow lambda:InvokeFunction action', () => {
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
    });

    test('should grant permission to EventBridge', () => {
      expect(permission.Properties.Principal).toBe('events.amazonaws.com');
    });

    test('should reference EventBridge rule as source', () => {
      expect(permission.Properties.SourceArn).toBeDefined();
      expect(permission.Properties.SourceArn['Fn::GetAtt']).toEqual([
        'ScheduledAnalysisRule',
        'Arn',
      ]);
    });
  });

  describe('CloudWatch Alarm - CriticalViolationsAlarm', () => {
    let alarm: any;

    beforeAll(() => {
      alarm = template.Resources.CriticalViolationsAlarm;
    });

    test('should exist and be of correct type', () => {
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have correct alarm name', () => {
      expect(alarm.Properties.AlarmName).toBe('SecurityComplianceCriticalViolations');
    });

    test('should have descriptive alarm description', () => {
      expect(alarm.Properties.AlarmDescription).toContain('critical security');
    });

    test('should monitor CriticalViolations metric', () => {
      expect(alarm.Properties.MetricName).toBe('CriticalViolations');
      expect(alarm.Properties.Namespace).toBe('SecurityCompliance');
    });

    test('should use Maximum statistic', () => {
      expect(alarm.Properties.Statistic).toBe('Maximum');
    });

    test('should have 5-minute evaluation period', () => {
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.EvaluationPeriods).toBe(1);
    });

    test('should trigger when threshold is greater than 0', () => {
      expect(alarm.Properties.Threshold).toBe(0);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should publish to SNS topic when triggered', () => {
      expect(alarm.Properties.AlarmActions).toBeDefined();
      expect(alarm.Properties.AlarmActions).toHaveLength(1);
      expect(alarm.Properties.AlarmActions[0]).toEqual({
        Ref: 'CriticalViolationsTopic',
      });
    });

    test('should treat missing data as not breaching', () => {
      expect(alarm.Properties.TreatMissingData).toBe('notBreaching');
    });
  });

  describe('CloudWatch Alarm - LowComplianceScoreAlarm', () => {
    let alarm: any;

    beforeAll(() => {
      alarm = template.Resources.LowComplianceScoreAlarm;
    });

    test('should exist and be of correct type', () => {
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have correct alarm name', () => {
      expect(alarm.Properties.AlarmName).toBe('SecurityComplianceLowScore');
    });

    test('should monitor ComplianceScore metric', () => {
      expect(alarm.Properties.MetricName).toBe('ComplianceScore');
      expect(alarm.Properties.Namespace).toBe('SecurityCompliance');
    });

    test('should use Minimum statistic', () => {
      expect(alarm.Properties.Statistic).toBe('Minimum');
    });

    test('should have 15-minute evaluation period', () => {
      expect(alarm.Properties.Period).toBe(900);
      expect(alarm.Properties.EvaluationPeriods).toBe(1);
    });

    test('should trigger when score drops below 70%', () => {
      expect(alarm.Properties.Threshold).toBe(70);
      expect(alarm.Properties.ComparisonOperator).toBe('LessThanThreshold');
    });

    test('should publish to SNS topic when triggered', () => {
      expect(alarm.Properties.AlarmActions).toBeDefined();
      expect(alarm.Properties.AlarmActions).toHaveLength(1);
      expect(alarm.Properties.AlarmActions[0]).toEqual({
        Ref: 'CriticalViolationsTopic',
      });
    });
  });

  describe('CloudWatch Dashboard - ComplianceDashboard', () => {
    let dashboard: any;

    beforeAll(() => {
      dashboard = template.Resources.ComplianceDashboard;
    });

    test('should exist and be of correct type', () => {
      expect(dashboard).toBeDefined();
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('should have correct dashboard name', () => {
      expect(dashboard.Properties.DashboardName).toBe('SecurityComplianceDashboard');
    });

    test('should have dashboard body with widgets', () => {
      expect(dashboard.Properties.DashboardBody).toBeDefined();
      const bodyTemplate = dashboard.Properties.DashboardBody['Fn::Sub'];
      expect(bodyTemplate).toBeDefined();
      expect(bodyTemplate).toContain('widgets');
    });

    test('dashboard should include ComplianceScore widget', () => {
      const bodyTemplate = dashboard.Properties.DashboardBody['Fn::Sub'];
      expect(bodyTemplate).toContain('ComplianceScore');
      expect(bodyTemplate).toContain('Compliance Score');
    });

    test('dashboard should include violations metrics widget', () => {
      const bodyTemplate = dashboard.Properties.DashboardBody['Fn::Sub'];
      expect(bodyTemplate).toContain('CriticalViolations');
      expect(bodyTemplate).toContain('HighViolations');
      expect(bodyTemplate).toContain('TotalViolations');
    });

    test('dashboard should reference the correct region', () => {
      const bodyTemplate = dashboard.Properties.DashboardBody['Fn::Sub'];
      expect(bodyTemplate).toContain('${AWS::Region}');
    });
  });

  describe('Resource Dependencies', () => {
    test('Lambda function should depend on IAM role', () => {
      const lambda = template.Resources.SecurityAnalysisFunction;
      expect(lambda.Properties.Role['Fn::GetAtt'][0]).toBe(
        'SecurityAnalysisLambdaRole'
      );
    });

    test('Custom resource should depend on Lambda function', () => {
      const customResource = template.Resources.InitialAnalysisTrigger;
      expect(customResource.Properties.ServiceToken['Fn::GetAtt'][0]).toBe(
        'SecurityAnalysisFunction'
      );
    });

    test('EventBridge rule should target Lambda function', () => {
      const rule = template.Resources.ScheduledAnalysisRule;
      expect(rule.Properties.Targets[0].Arn['Fn::GetAtt'][0]).toBe(
        'SecurityAnalysisFunction'
      );
    });

    test('Lambda permission should reference EventBridge rule', () => {
      const permission = template.Resources.ScheduledAnalysisPermission;
      expect(permission.Properties.SourceArn['Fn::GetAtt'][0]).toBe(
        'ScheduledAnalysisRule'
      );
    });

    test('CloudWatch alarms should reference SNS topic', () => {
      const criticalAlarm = template.Resources.CriticalViolationsAlarm;
      const scoreAlarm = template.Resources.LowComplianceScoreAlarm;
      expect(criticalAlarm.Properties.AlarmActions[0]).toEqual({
        Ref: 'CriticalViolationsTopic',
      });
      expect(scoreAlarm.Properties.AlarmActions[0]).toEqual({
        Ref: 'CriticalViolationsTopic',
      });
    });

    test('IAM role should have permissions for S3 bucket', () => {
      const role = template.Resources.SecurityAnalysisLambdaRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const s3WriteStatement = policy.Statement.find((s: any) =>
        s.Action.includes('s3:PutObject')
      );
      expect(s3WriteStatement.Resource['Fn::Sub']).toContain(
        '${ComplianceReportsBucket.Arn}'
      );
    });

    test('IAM role should have permissions for SNS topic', () => {
      const role = template.Resources.SecurityAnalysisLambdaRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const snsStatement = policy.Statement.find((s: any) =>
        s.Action.includes('sns:Publish')
      );
      expect(snsStatement.Resource).toEqual({ Ref: 'CriticalViolationsTopic' });
    });
  });

  describe('Outputs', () => {
    test('should have ComplianceReportsBucket output', () => {
      expect(template.Outputs.ComplianceReportsBucket).toBeDefined();
      expect(template.Outputs.ComplianceReportsBucket.Value).toEqual({
        Ref: 'ComplianceReportsBucket',
      });
      expect(template.Outputs.ComplianceReportsBucket.Export).toBeDefined();
    });

    test('should have ComplianceReportLocation output from custom resource', () => {
      expect(template.Outputs.ComplianceReportLocation).toBeDefined();
      expect(template.Outputs.ComplianceReportLocation.Value['Fn::GetAtt']).toEqual(
        ['InitialAnalysisTrigger', 'ReportLocation']
      );
    });

    test('should have InitialComplianceScore output', () => {
      expect(template.Outputs.InitialComplianceScore).toBeDefined();
      expect(template.Outputs.InitialComplianceScore.Value['Fn::GetAtt']).toEqual([
        'InitialAnalysisTrigger',
        'ComplianceScore',
      ]);
    });

    test('should have InitialRiskLevel output', () => {
      expect(template.Outputs.InitialRiskLevel).toBeDefined();
      expect(template.Outputs.InitialRiskLevel.Value['Fn::GetAtt']).toEqual([
        'InitialAnalysisTrigger',
        'RiskLevel',
      ]);
    });

    test('should have SecurityAnalysisFunctionArn output', () => {
      expect(template.Outputs.SecurityAnalysisFunctionArn).toBeDefined();
      expect(
        template.Outputs.SecurityAnalysisFunctionArn.Value['Fn::GetAtt']
      ).toEqual(['SecurityAnalysisFunction', 'Arn']);
    });

    test('should have SNSTopicArn output', () => {
      expect(template.Outputs.SNSTopicArn).toBeDefined();
      expect(template.Outputs.SNSTopicArn.Value).toEqual({
        Ref: 'CriticalViolationsTopic',
      });
    });

    test('should have DashboardURL output', () => {
      expect(template.Outputs.DashboardURL).toBeDefined();
      expect(template.Outputs.DashboardURL.Value['Fn::Sub']).toContain(
        'SecurityComplianceDashboard'
      );
    });

    test('should have SecurityAnalysisLambdaRoleArn output', () => {
      expect(template.Outputs.SecurityAnalysisLambdaRoleArn).toBeDefined();
      expect(
        template.Outputs.SecurityAnalysisLambdaRoleArn.Value['Fn::GetAtt']
      ).toEqual(['SecurityAnalysisLambdaRole', 'Arn']);
    });

    test('should have alarm ARN outputs', () => {
      expect(template.Outputs.CriticalViolationsAlarmArn).toBeDefined();
      expect(template.Outputs.LowComplianceScoreAlarmArn).toBeDefined();
    });

    test('should have StackRegion and StackAccountId outputs', () => {
      expect(template.Outputs.StackRegion).toBeDefined();
      expect(template.Outputs.StackAccountId).toBeDefined();
      expect(template.Outputs.StackRegion.Value).toEqual({ Ref: 'AWS::Region' });
      expect(template.Outputs.StackAccountId.Value).toEqual({
        Ref: 'AWS::AccountId',
      });
    });

    test('all outputs should have exports with stack name prefix', () => {
      const outputsWithExports = [
        'ComplianceReportsBucket',
        'SecurityAnalysisFunctionArn',
        'SNSTopicArn',
        'SecurityAnalysisLambdaRoleArn',
        'ScheduledAnalysisRuleArn',
        'CriticalViolationsAlarmArn',
        'LowComplianceScoreAlarmArn',
        'ComplianceDashboardName',
        'ComplianceReportsBucketArn',
        'StackRegion',
        'StackAccountId',
      ];

      outputsWithExports.forEach((outputName) => {
        const output = template.Outputs[outputName];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
      });
    });
  });

  describe('Template Validation', () => {
    test('should have exactly 10 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(10);
    });

    test('should have exactly 4 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4);
    });

    test('should have exactly 1 condition', () => {
      const conditionCount = Object.keys(template.Conditions).length;
      expect(conditionCount).toBe(1);
    });

    test('should have at least 11 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(11);
    });

    test('all resources should have valid CloudFormation types', () => {
      const validTypes = [
        'AWS::S3::Bucket',
        'AWS::SNS::Topic',
        'AWS::IAM::Role',
        'AWS::Lambda::Function',
        'AWS::CloudFormation::CustomResource',
        'AWS::Events::Rule',
        'AWS::Lambda::Permission',
        'AWS::CloudWatch::Alarm',
        'AWS::CloudWatch::Dashboard',
      ];

      Object.values(template.Resources).forEach((resource: any) => {
        expect(validTypes).toContain(resource.Type);
      });
    });

    test('should not have any null or undefined required properties', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });
  });

  describe('Security Best Practices', () => {
    test('S3 bucket should follow all security best practices', () => {
      const bucket = template.Resources.ComplianceReportsBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('IAM role should follow least privilege principle', () => {
      const role = template.Resources.SecurityAnalysisLambdaRole;
      const policy = role.Properties.Policies[0].PolicyDocument;

      const statements = policy.Statement;
      const hasWildcardResource = statements.some(
        (s: any) => s.Resource === '*' && s.Action.includes('*')
      );
      expect(hasWildcardResource).toBe(false);
    });

    test('Lambda function should have reasonable timeout and memory limits', () => {
      const lambda = template.Resources.SecurityAnalysisFunction;
      expect(lambda.Properties.Timeout).toBeLessThanOrEqual(900);
      expect(lambda.Properties.MemorySize).toBeLessThanOrEqual(10240);
    });

    test('SNS topic should support conditional email subscription', () => {
      const topic = template.Resources.CriticalViolationsTopic;
      expect(topic.Properties.Subscription['Fn::If']).toBeDefined();
    });

    test('CloudWatch alarms should have appropriate evaluation periods', () => {
      const criticalAlarm = template.Resources.CriticalViolationsAlarm;
      const scoreAlarm = template.Resources.LowComplianceScoreAlarm;

      expect(criticalAlarm.Properties.EvaluationPeriods).toBeGreaterThan(0);
      expect(scoreAlarm.Properties.EvaluationPeriods).toBeGreaterThan(0);
    });
  });

  describe('Resource Tagging', () => {
    test('S3 bucket should have tags', () => {
      const bucket = template.Resources.ComplianceReportsBucket;
      expect(bucket.Properties.Tags).toBeDefined();
      expect(bucket.Properties.Tags.length).toBeGreaterThan(0);
    });

    test('SNS topic should have tags', () => {
      const topic = template.Resources.CriticalViolationsTopic;
      expect(topic.Properties.Tags).toBeDefined();
      expect(topic.Properties.Tags.length).toBeGreaterThan(0);
    });

    test('IAM role should have tags', () => {
      const role = template.Resources.SecurityAnalysisLambdaRole;
      expect(role.Properties.Tags).toBeDefined();
      expect(role.Properties.Tags.length).toBeGreaterThan(0);
    });

    test('Lambda function should have tags', () => {
      const lambda = template.Resources.SecurityAnalysisFunction;
      expect(lambda.Properties.Tags).toBeDefined();
      expect(lambda.Properties.Tags.length).toBeGreaterThan(0);
    });
  });
});
