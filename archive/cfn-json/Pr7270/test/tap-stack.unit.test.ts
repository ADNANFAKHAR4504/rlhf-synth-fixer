import * as fs from 'fs';
import * as path from 'path';

const templatePath = path.join(__dirname, '../lib/TapStack.json');
const template = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));

describe('TapStack CloudFormation Template - Unit Tests', () => {
  describe('Template Structure Validation', () => {
    test('should have valid AWSTemplateFormatVersion', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have description', () => {
      expect(template.Description).toBe('Automated Infrastructure Compliance Analysis System');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(Object.keys(template.Parameters)).toHaveLength(2);
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources)).toHaveLength(23);
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs)).toHaveLength(3);
    });
  });

  describe('Parameter Validation', () => {
    test('EnvironmentSuffix parameter should be properly defined', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toContain('Unique suffix for resource naming');
    });

    test('SecurityTeamEmail parameter should be properly defined', () => {
      const param = template.Parameters.SecurityTeamEmail;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('security@example.com');
      expect(param.Description).toContain('Email address for security team notifications');
    });
  });

  describe('S3 Bucket Resources', () => {
    test('ComplianceReportsBucket should be properly configured', () => {
      const resource = template.Resources.ComplianceReportsBucket;
      expect(resource.Type).toBe('AWS::S3::Bucket');
      expect(resource.Properties.BucketName['Fn::Sub']).toBe('compliance-reports-${EnvironmentSuffix}-${AWS::AccountId}');
      expect(resource.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('ComplianceReportsBucket should have lifecycle configuration', () => {
      const resource = template.Resources.ComplianceReportsBucket;
      const lifecycleRules = resource.Properties.LifecycleConfiguration.Rules;
      expect(lifecycleRules).toHaveLength(1);
      expect(lifecycleRules[0].Status).toBe('Enabled');
      expect(lifecycleRules[0].Transitions[0].TransitionInDays).toBe(30);
      expect(lifecycleRules[0].Transitions[0].StorageClass).toBe('GLACIER');
    });

    test('ComplianceReportsBucket should have encryption enabled', () => {
      const resource = template.Resources.ComplianceReportsBucket;
      const encryption = resource.Properties.BucketEncryption.ServerSideEncryptionConfiguration;
      expect(encryption).toHaveLength(1);
      expect(encryption[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('ComplianceReportsBucket should block public access', () => {
      const resource = template.Resources.ComplianceReportsBucket;
      const publicAccessBlock = resource.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('IAM Role Resources', () => {
    test('LambdaExecutionRole should be properly configured', () => {
      const resource = template.Resources.LambdaExecutionRole;
      expect(resource.Type).toBe('AWS::IAM::Role');
      expect(resource.Properties.RoleName['Fn::Sub']).toBe('lambda-compliance-role-${EnvironmentSuffix}');
      expect(resource.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
    });

    test('LambdaExecutionRole should have correct assume role policy', () => {
      const resource = template.Resources.LambdaExecutionRole;
      const assumeRolePolicy = resource.Properties.AssumeRolePolicyDocument;
      expect(assumeRolePolicy.Version).toBe('2012-10-17');
      expect(assumeRolePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(assumeRolePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('LambdaExecutionRole should have compliance validation policy', () => {
      const resource = template.Resources.LambdaExecutionRole;
      const policies = resource.Properties.Policies;
      expect(policies).toHaveLength(1);
      expect(policies[0].PolicyName).toBe('ComplianceValidationPolicy');

      const statements = policies[0].PolicyDocument.Statement;
      expect(statements.length).toBeGreaterThanOrEqual(5);

      // Verify Config permissions
      const configStatement = statements.find((s: any) =>
        s.Action.some((a: string) => a.startsWith('config:'))
      );
      expect(configStatement).toBeDefined();
      expect(configStatement.Action).toContain('config:PutEvaluations');

      // Verify S3 permissions
      const s3Statement = statements.find((s: any) =>
        s.Action.some((a: string) => a.startsWith('s3:'))
      );
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Action).toContain('s3:PutObject');

      // Verify SNS permissions
      const snsStatement = statements.find((s: any) =>
        s.Action.includes('sns:Publish')
      );
      expect(snsStatement).toBeDefined();

      // Verify SSM permissions
      const ssmStatement = statements.find((s: any) =>
        s.Action.some((a: string) => a.startsWith('ssm:'))
      );
      expect(ssmStatement).toBeDefined();

      // Verify CloudFormation permissions
      const cfnStatement = statements.find((s: any) =>
        s.Action.some((a: string) => a.startsWith('cloudformation:'))
      );
      expect(cfnStatement).toBeDefined();
    });

    test('ComplianceEventBridgeRole should be properly configured', () => {
      const resource = template.Resources.ComplianceEventBridgeRole;
      expect(resource.Type).toBe('AWS::IAM::Role');
      expect(resource.Properties.RoleName['Fn::Sub']).toBe('eventbridge-compliance-role-${EnvironmentSuffix}');

      const assumeRolePolicy = resource.Properties.AssumeRolePolicyDocument;
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('events.amazonaws.com');
    });

    test('ComplianceEventBridgeRole should have Lambda invoke permissions', () => {
      const resource = template.Resources.ComplianceEventBridgeRole;
      const policies = resource.Properties.Policies;
      expect(policies[0].PolicyName).toBe('InvokeLambdaPolicy');

      const statement = policies[0].PolicyDocument.Statement[0];
      expect(statement.Action).toBe('lambda:InvokeFunction');
      expect(statement.Resource).toHaveLength(3);
    });
  });

  describe('Lambda Function Resources', () => {
    test('TagComplianceFunction should be properly configured', () => {
      const resource = template.Resources.TagComplianceFunction;
      expect(resource.Type).toBe('AWS::Lambda::Function');
      expect(resource.Properties.FunctionName['Fn::Sub']).toBe('tag-compliance-validator-${EnvironmentSuffix}');
      expect(resource.Properties.Runtime).toBe('python3.9');
      expect(resource.Properties.Handler).toBe('index.lambda_handler');
      expect(resource.Properties.MemorySize).toBe(256);
      expect(resource.Properties.Timeout).toBe(60);
    });

    test('TagComplianceFunction should have correct environment variables', () => {
      const resource = template.Resources.TagComplianceFunction;
      const envVars = resource.Properties.Environment.Variables;
      expect(envVars.SNS_TOPIC_ARN).toBeDefined();
      expect(envVars.SNS_TOPIC_ARN.Ref).toBe('ComplianceNotificationTopic');
    });

    test('TagComplianceFunction should have inline code', () => {
      const resource = template.Resources.TagComplianceFunction;
      expect(resource.Properties.Code.ZipFile).toBeDefined();
      expect(resource.Properties.Code.ZipFile).toContain('lambda_handler');
      expect(resource.Properties.Code.ZipFile).toContain('REQUIRED_TAGS');
      expect(resource.Properties.Code.ZipFile).toContain('Environment');
      expect(resource.Properties.Code.ZipFile).toContain('Owner');
      expect(resource.Properties.Code.ZipFile).toContain('CostCenter');
    });

    test('DriftDetectionFunction should be properly configured', () => {
      const resource = template.Resources.DriftDetectionFunction;
      expect(resource.Type).toBe('AWS::Lambda::Function');
      expect(resource.Properties.FunctionName['Fn::Sub']).toBe('drift-detection-validator-${EnvironmentSuffix}');
      expect(resource.Properties.Runtime).toBe('python3.9');
      expect(resource.Properties.Handler).toBe('index.lambda_handler');
      expect(resource.Properties.MemorySize).toBe(256);
      expect(resource.Properties.Timeout).toBe(300);
    });

    test('DriftDetectionFunction should have correct environment variables', () => {
      const resource = template.Resources.DriftDetectionFunction;
      const envVars = resource.Properties.Environment.Variables;
      expect(envVars.SNS_TOPIC_ARN).toBeDefined();
      expect(envVars.REPORTS_BUCKET).toBeDefined();
      expect(envVars.SNS_TOPIC_ARN.Ref).toBe('ComplianceNotificationTopic');
      expect(envVars.REPORTS_BUCKET.Ref).toBe('ComplianceReportsBucket');
    });

    test('DriftDetectionFunction should have inline code for drift detection', () => {
      const resource = template.Resources.DriftDetectionFunction;
      expect(resource.Properties.Code.ZipFile).toBeDefined();
      expect(resource.Properties.Code.ZipFile).toContain('detect_stack_drift');
      expect(resource.Properties.Code.ZipFile).toContain('describe_stack_drift_detection_status');
      expect(resource.Properties.Code.ZipFile).toContain('AWS::CloudFormation::Stack');
    });

    test('SecurityPolicyValidatorFunction should be properly configured', () => {
      const resource = template.Resources.SecurityPolicyValidatorFunction;
      expect(resource.Type).toBe('AWS::Lambda::Function');
      expect(resource.Properties.FunctionName['Fn::Sub']).toBe('security-policy-validator-${EnvironmentSuffix}');
      expect(resource.Properties.Runtime).toBe('python3.9');
      expect(resource.Properties.Handler).toBe('index.lambda_handler');
      expect(resource.Properties.MemorySize).toBe(256);
      expect(resource.Properties.Timeout).toBe(60);
    });

    test('SecurityPolicyValidatorFunction should have correct environment variables', () => {
      const resource = template.Resources.SecurityPolicyValidatorFunction;
      const envVars = resource.Properties.Environment.Variables;
      expect(envVars.SNS_TOPIC_ARN).toBeDefined();
      expect(envVars.ENVIRONMENT_SUFFIX).toBeDefined();
      expect(envVars.SNS_TOPIC_ARN.Ref).toBe('ComplianceNotificationTopic');
      expect(envVars.ENVIRONMENT_SUFFIX.Ref).toBe('EnvironmentSuffix');
    });

    test('SecurityPolicyValidatorFunction should validate EC2, SecurityGroup, and S3', () => {
      const resource = template.Resources.SecurityPolicyValidatorFunction;
      const code = resource.Properties.Code.ZipFile;
      expect(code).toContain('AWS::EC2::Instance');
      expect(code).toContain('AWS::EC2::SecurityGroup');
      expect(code).toContain('AWS::S3::Bucket');
      expect(code).toContain('approved-amis');
      expect(code).toContain('0.0.0.0/0');
    });

    test('all Lambda functions should reference LambdaExecutionRole', () => {
      const functions = ['TagComplianceFunction', 'DriftDetectionFunction', 'SecurityPolicyValidatorFunction'];
      functions.forEach(funcName => {
        const resource = template.Resources[funcName];
        expect(resource.Properties.Role['Fn::GetAtt']).toEqual(['LambdaExecutionRole', 'Arn']);
      });
    });
  });

  describe('AWS Config Resources', () => {
    test('TagComplianceConfigRule should be properly configured', () => {
      const resource = template.Resources.TagComplianceConfigRule;
      expect(resource.Type).toBe('AWS::Config::ConfigRule');
      expect(resource.DependsOn).toContain('TagComplianceFunctionPermission');
      expect(resource.Properties.ConfigRuleName['Fn::Sub']).toBe('tag-compliance-rule-${EnvironmentSuffix}');
      expect(resource.Properties.Source.Owner).toBe('CUSTOM_LAMBDA');
    });

    test('TagComplianceConfigRule should reference TagComplianceFunction', () => {
      const resource = template.Resources.TagComplianceConfigRule;
      expect(resource.Properties.Source.SourceIdentifier['Fn::GetAtt']).toEqual([
        'TagComplianceFunction',
        'Arn'
      ]);
    });

    test('TagComplianceConfigRule should have ConfigurationItemChangeNotification', () => {
      const resource = template.Resources.TagComplianceConfigRule;
      const sourceDetails = resource.Properties.Source.SourceDetails;
      expect(sourceDetails).toHaveLength(1);
      expect(sourceDetails[0].EventSource).toBe('aws.config');
      expect(sourceDetails[0].MessageType).toBe('ConfigurationItemChangeNotification');
    });

    test('DriftDetectionConfigRule should be properly configured', () => {
      const resource = template.Resources.DriftDetectionConfigRule;
      expect(resource.Type).toBe('AWS::Config::ConfigRule');
      expect(resource.DependsOn).toContain('DriftDetectionFunctionPermission');
      expect(resource.Properties.ConfigRuleName['Fn::Sub']).toBe('drift-detection-rule-${EnvironmentSuffix}');
    });

    test('DriftDetectionConfigRule should have scheduled notification', () => {
      const resource = template.Resources.DriftDetectionConfigRule;
      const sourceDetails = resource.Properties.Source.SourceDetails;
      expect(sourceDetails).toHaveLength(2);

      const scheduledNotification = sourceDetails.find((sd: any) =>
        sd.MessageType === 'ScheduledNotification'
      );
      expect(scheduledNotification).toBeDefined();
      expect(scheduledNotification.MaximumExecutionFrequency).toBe('TwentyFour_Hours');
    });

    test('SecurityPolicyConfigRule should be properly configured', () => {
      const resource = template.Resources.SecurityPolicyConfigRule;
      expect(resource.Type).toBe('AWS::Config::ConfigRule');
      expect(resource.DependsOn).toContain('SecurityPolicyFunctionPermission');
      expect(resource.Properties.ConfigRuleName['Fn::Sub']).toBe('security-policy-rule-${EnvironmentSuffix}');
    });
  });

  describe('Lambda Permission Resources', () => {
    test('TagComplianceFunctionPermission should allow Config to invoke function', () => {
      const resource = template.Resources.TagComplianceFunctionPermission;
      expect(resource.Type).toBe('AWS::Lambda::Permission');
      expect(resource.Properties.Action).toBe('lambda:InvokeFunction');
      expect(resource.Properties.Principal).toBe('config.amazonaws.com');
      expect(resource.Properties.FunctionName['Fn::GetAtt']).toEqual([
        'TagComplianceFunction',
        'Arn'
      ]);
    });

    test('DriftDetectionFunctionPermission should allow Config to invoke function', () => {
      const resource = template.Resources.DriftDetectionFunctionPermission;
      expect(resource.Type).toBe('AWS::Lambda::Permission');
      expect(resource.Properties.Action).toBe('lambda:InvokeFunction');
      expect(resource.Properties.Principal).toBe('config.amazonaws.com');
    });

    test('SecurityPolicyFunctionPermission should allow Config to invoke function', () => {
      const resource = template.Resources.SecurityPolicyFunctionPermission;
      expect(resource.Type).toBe('AWS::Lambda::Permission');
      expect(resource.Properties.Action).toBe('lambda:InvokeFunction');
      expect(resource.Properties.Principal).toBe('config.amazonaws.com');
    });

    test('EventBridgeLambdaPermission should allow EventBridge to invoke function', () => {
      const resource = template.Resources.EventBridgeLambdaPermission;
      expect(resource.Type).toBe('AWS::Lambda::Permission');
      expect(resource.Properties.Action).toBe('lambda:InvokeFunction');
      expect(resource.Properties.Principal).toBe('events.amazonaws.com');
      expect(resource.Properties.FunctionName.Ref).toBe('TagComplianceFunction');
    });

    test('all Lambda permissions should include SourceAccount', () => {
      const permissions = [
        'TagComplianceFunctionPermission',
        'DriftDetectionFunctionPermission',
        'SecurityPolicyFunctionPermission'
      ];
      permissions.forEach(permName => {
        const resource = template.Resources[permName];
        expect(resource.Properties.SourceAccount).toBeDefined();
        expect(resource.Properties.SourceAccount.Ref).toBe('AWS::AccountId');
      });
    });
  });

  describe('SNS Resources', () => {
    test('ComplianceNotificationTopic should be properly configured', () => {
      const resource = template.Resources.ComplianceNotificationTopic;
      expect(resource.Type).toBe('AWS::SNS::Topic');
      expect(resource.Properties.TopicName['Fn::Sub']).toBe('compliance-notifications-${EnvironmentSuffix}');
      expect(resource.Properties.DisplayName).toBe('Compliance Notifications');
    });

    test('ComplianceNotificationSubscription should be properly configured', () => {
      const resource = template.Resources.ComplianceNotificationSubscription;
      expect(resource.Type).toBe('AWS::SNS::Subscription');
      expect(resource.Properties.Protocol).toBe('email');
      expect(resource.Properties.TopicArn.Ref).toBe('ComplianceNotificationTopic');
      expect(resource.Properties.Endpoint.Ref).toBe('SecurityTeamEmail');
    });
  });

  describe('EventBridge Resources', () => {
    test('ConfigComplianceChangeRule should be properly configured', () => {
      const resource = template.Resources.ConfigComplianceChangeRule;
      expect(resource.Type).toBe('AWS::Events::Rule');
      expect(resource.Properties.Name['Fn::Sub']).toBe('config-compliance-change-${EnvironmentSuffix}');
      expect(resource.Properties.Description).toContain('AWS Config compliance changes');
      expect(resource.Properties.State).toBe('ENABLED');
    });

    test('ConfigComplianceChangeRule should have correct event pattern', () => {
      const resource = template.Resources.ConfigComplianceChangeRule;
      const eventPattern = resource.Properties.EventPattern;
      expect(eventPattern.source).toContain('aws.config');
      expect(eventPattern['detail-type']).toContain('Config Rules Compliance Change');
    });

    test('ConfigComplianceChangeRule should target TagComplianceFunction', () => {
      const resource = template.Resources.ConfigComplianceChangeRule;
      const targets = resource.Properties.Targets;
      expect(targets).toHaveLength(1);
      expect(targets[0].Id).toBe('TagComplianceTarget');
      expect(targets[0].Arn['Fn::GetAtt']).toEqual(['TagComplianceFunction', 'Arn']);
    });
  });

  describe('SSM Parameter Resources', () => {
    test('ApprovedAMIsParameter should be properly configured', () => {
      const resource = template.Resources.ApprovedAMIsParameter;
      expect(resource.Type).toBe('AWS::SSM::Parameter');
      expect(resource.Properties.Name['Fn::Sub']).toBe('/compliance/approved-amis-${EnvironmentSuffix}');
      expect(resource.Properties.Type).toBe('String');
      expect(resource.Properties.Description).toContain('approved AMI IDs');
    });

    test('ApprovedAMIsParameter should have valid JSON array value', () => {
      const resource = template.Resources.ApprovedAMIsParameter;
      const value = JSON.parse(resource.Properties.Value);
      expect(Array.isArray(value)).toBe(true);
      expect(value.length).toBeGreaterThan(0);
      value.forEach((ami: string) => {
        expect(ami).toMatch(/^ami-[a-f0-9]+$/);
      });
    });

    test('SecurityGroupRulesParameter should be properly configured', () => {
      const resource = template.Resources.SecurityGroupRulesParameter;
      expect(resource.Type).toBe('AWS::SSM::Parameter');
      expect(resource.Properties.Name['Fn::Sub']).toBe('/compliance/security-group-rules-${EnvironmentSuffix}');
      expect(resource.Properties.Type).toBe('String');
      expect(resource.Properties.Description).toContain('Security group validation rules');
    });

    test('SecurityGroupRulesParameter should have valid JSON object value', () => {
      const resource = template.Resources.SecurityGroupRulesParameter;
      const value = JSON.parse(resource.Properties.Value);
      expect(value.max_ports).toBeDefined();
      expect(value.allowed_protocols).toBeDefined();
      expect(value.forbidden_cidrs).toBeDefined();
      expect(Array.isArray(value.allowed_protocols)).toBe(true);
      expect(Array.isArray(value.forbidden_cidrs)).toBe(true);
    });

    test('ComplianceThresholdsParameter should be properly configured', () => {
      const resource = template.Resources.ComplianceThresholdsParameter;
      expect(resource.Type).toBe('AWS::SSM::Parameter');
      expect(resource.Properties.Name['Fn::Sub']).toBe('/compliance/thresholds-${EnvironmentSuffix}');
      expect(resource.Properties.Type).toBe('String');
      expect(resource.Properties.Description).toContain('Compliance thresholds');
    });

    test('ComplianceThresholdsParameter should have valid JSON object value', () => {
      const resource = template.Resources.ComplianceThresholdsParameter;
      const value = JSON.parse(resource.Properties.Value);
      expect(value.max_drift_count).toBeDefined();
      expect(value.critical_resources).toBeDefined();
      expect(typeof value.max_drift_count).toBe('number');
      expect(Array.isArray(value.critical_resources)).toBe(true);
    });
  });

  describe('CloudWatch Resources', () => {
    test('ComplianceDashboard should be properly configured', () => {
      const resource = template.Resources.ComplianceDashboard;
      expect(resource.Type).toBe('AWS::CloudWatch::Dashboard');
      expect(resource.Properties.DashboardName['Fn::Sub']).toBe('compliance-dashboard-${EnvironmentSuffix}');
    });

    test('ComplianceDashboard should have valid dashboard body', () => {
      const resource = template.Resources.ComplianceDashboard;
      expect(resource.Properties.DashboardBody).toBeDefined();
      expect(resource.Properties.DashboardBody['Fn::Sub']).toBeDefined();
    });

    test('TagComplianceFunctionLogGroup should be properly configured', () => {
      const resource = template.Resources.TagComplianceFunctionLogGroup;
      expect(resource.Type).toBe('AWS::Logs::LogGroup');
      expect(resource.Properties.LogGroupName['Fn::Sub']).toBe('/aws/lambda/tag-compliance-validator-${EnvironmentSuffix}');
      expect(resource.Properties.RetentionInDays).toBe(30);
    });

    test('DriftDetectionFunctionLogGroup should be properly configured', () => {
      const resource = template.Resources.DriftDetectionFunctionLogGroup;
      expect(resource.Type).toBe('AWS::Logs::LogGroup');
      expect(resource.Properties.LogGroupName['Fn::Sub']).toBe('/aws/lambda/drift-detection-validator-${EnvironmentSuffix}');
      expect(resource.Properties.RetentionInDays).toBe(30);
    });

    test('SecurityPolicyFunctionLogGroup should be properly configured', () => {
      const resource = template.Resources.SecurityPolicyFunctionLogGroup;
      expect(resource.Type).toBe('AWS::Logs::LogGroup');
      expect(resource.Properties.LogGroupName['Fn::Sub']).toBe('/aws/lambda/security-policy-validator-${EnvironmentSuffix}');
      expect(resource.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('Output Validation', () => {
    test('ComplianceReportsBucketName output should be defined', () => {
      const output = template.Outputs.ComplianceReportsBucketName;
      expect(output.Description).toBe('S3 bucket for compliance reports');
      expect(output.Value.Ref).toBe('ComplianceReportsBucket');
    });

    test('ComplianceNotificationTopicArn output should be defined', () => {
      const output = template.Outputs.ComplianceNotificationTopicArn;
      expect(output.Description).toBe('SNS topic ARN for compliance notifications');
      expect(output.Value.Ref).toBe('ComplianceNotificationTopic');
    });

    test('ComplianceDashboardURL output should be defined', () => {
      const output = template.Outputs.ComplianceDashboardURL;
      expect(output.Description).toBe('CloudWatch dashboard URL');
      expect(output.Value['Fn::Sub']).toContain('console.aws.amazon.com/cloudwatch');
      expect(output.Value['Fn::Sub']).toContain('compliance-dashboard-${EnvironmentSuffix}');
    });
  });

  describe('Cross-Reference Validation', () => {
    test('all resources should use EnvironmentSuffix for naming', () => {
      const resourcesWithNaming = [
        'ComplianceReportsBucket',
        'LambdaExecutionRole',
        'TagComplianceFunction',
        'DriftDetectionFunction',
        'SecurityPolicyValidatorFunction',
        'TagComplianceConfigRule',
        'DriftDetectionConfigRule',
        'SecurityPolicyConfigRule',
        'ComplianceNotificationTopic',
        'ComplianceEventBridgeRole',
        'ConfigComplianceChangeRule'
      ];

      resourcesWithNaming.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const hasEnvSuffix = JSON.stringify(resource).includes('${EnvironmentSuffix}');
        expect(hasEnvSuffix).toBe(true);
      });
    });

    test('Lambda functions should reference correct log groups', () => {
      const functionToLogGroup = {
        'TagComplianceFunction': 'TagComplianceFunctionLogGroup',
        'DriftDetectionFunction': 'DriftDetectionFunctionLogGroup',
        'SecurityPolicyValidatorFunction': 'SecurityPolicyFunctionLogGroup'
      };

      Object.entries(functionToLogGroup).forEach(([funcName, logGroupName]) => {
        const func = template.Resources[funcName];
        const logGroup = template.Resources[logGroupName];

        const funcLogName = func.Properties.FunctionName['Fn::Sub'];
        const logGroupPath = logGroup.Properties.LogGroupName['Fn::Sub'];

        expect(logGroupPath).toContain(funcLogName);
      });
    });

    test('Config rules should depend on corresponding permissions', () => {
      const ruleToDependency = {
        'TagComplianceConfigRule': 'TagComplianceFunctionPermission',
        'DriftDetectionConfigRule': 'DriftDetectionFunctionPermission',
        'SecurityPolicyConfigRule': 'SecurityPolicyFunctionPermission'
      };

      Object.entries(ruleToDependency).forEach(([ruleName, permName]) => {
        const rule = template.Resources[ruleName];
        expect(rule.DependsOn).toContain(permName);
      });
    });

    test('SNS topic should be referenced by Lambda environment variables', () => {
      const functions = ['TagComplianceFunction', 'DriftDetectionFunction', 'SecurityPolicyValidatorFunction'];

      functions.forEach(funcName => {
        const func = template.Resources[funcName];
        const envVars = func.Properties.Environment.Variables;
        expect(envVars.SNS_TOPIC_ARN).toBeDefined();
        expect(envVars.SNS_TOPIC_ARN.Ref).toBe('ComplianceNotificationTopic');
      });
    });

    test('S3 bucket should be referenced by DriftDetectionFunction', () => {
      const func = template.Resources.DriftDetectionFunction;
      const envVars = func.Properties.Environment.Variables;
      expect(envVars.REPORTS_BUCKET).toBeDefined();
      expect(envVars.REPORTS_BUCKET.Ref).toBe('ComplianceReportsBucket');
    });
  });

  describe('Security Best Practices', () => {
    test('S3 bucket should have all security features enabled', () => {
      const bucket = template.Resources.ComplianceReportsBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    });

    test('IAM roles should follow principle of least privilege', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies[0].PolicyDocument;

      policy.Statement.forEach((statement: any) => {
        // Ensure no wildcard actions unless necessary
        if (statement.Resource === '*') {
          // Only allow read-only or specific AWS service operations on wildcard resources
          expect(statement.Action.every((action: string) =>
            action.startsWith('config:') ||
            action.startsWith('cloudformation:Describe') ||
            action.startsWith('cloudformation:Detect')
          )).toBe(true);
        }
      });
    });

    test('Lambda functions should have appropriate timeout values', () => {
      const tagFunc = template.Resources.TagComplianceFunction;
      const secFunc = template.Resources.SecurityPolicyValidatorFunction;
      expect(tagFunc.Properties.Timeout).toBeLessThanOrEqual(60);
      expect(secFunc.Properties.Timeout).toBeLessThanOrEqual(60);

      // Drift detection needs longer timeout
      const driftFunc = template.Resources.DriftDetectionFunction;
      expect(driftFunc.Properties.Timeout).toBe(300);
    });

    test('CloudWatch log groups should have retention policy', () => {
      const logGroups = [
        'TagComplianceFunctionLogGroup',
        'DriftDetectionFunctionLogGroup',
        'SecurityPolicyFunctionLogGroup'
      ];

      logGroups.forEach(logGroupName => {
        const logGroup = template.Resources[logGroupName];
        expect(logGroup.Properties.RetentionInDays).toBeDefined();
        expect(logGroup.Properties.RetentionInDays).toBeGreaterThan(0);
      });
    });
  });
});
