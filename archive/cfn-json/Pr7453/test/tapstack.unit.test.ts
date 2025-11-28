import * as fs from 'fs';
import * as path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have description', () => {
      expect(template.Description).toContain('AWS Config Compliance Analysis System');
    });

    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
    });
  });

  describe('S3 Buckets', () => {
    test('ComplianceReportsBucket should exist with correct properties', () => {
      const bucket = template.Resources.ComplianceReportsBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('ComplianceReportsBucket should have lifecycle policy', () => {
      const bucket = template.Resources.ComplianceReportsBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toHaveLength(1);
      expect(bucket.Properties.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(90);
    });

    test('ConfigBucket should exist with correct properties', () => {
      const bucket = template.Resources.ConfigBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('ConfigBucketPolicy should allow AWS Config service', () => {
      const policy = template.Resources.ConfigBucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.PolicyDocument.Statement).toHaveLength(3);

      const statements = policy.Properties.PolicyDocument.Statement;
      expect(statements[0].Principal.Service).toBe('config.amazonaws.com');
      expect(statements[0].Action).toBe('s3:GetBucketAcl');
    });
  });

  describe('KMS and SNS', () => {
    test('SNSEncryptionKey should exist with correct key policy', () => {
      const key = template.Resources.SNSEncryptionKey;
      expect(key).toBeDefined();
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.DeletionPolicy).toBe('Delete');
      expect(key.Properties.KeyPolicy).toBeDefined();
    });

    test('SNSEncryptionKey should allow SNS service', () => {
      const key = template.Resources.SNSEncryptionKey;
      const statements = key.Properties.KeyPolicy.Statement;
      const snsStatement = statements.find((s: any) => s.Sid === 'Allow SNS to use the key');
      expect(snsStatement).toBeDefined();
      expect(snsStatement.Principal.Service).toBe('sns.amazonaws.com');
    });

    test('SNSEncryptionKeyAlias should exist and reference the key', () => {
      const alias = template.Resources.SNSEncryptionKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'SNSEncryptionKey' });
    });

    test('ComplianceTopic should use KMS encryption', () => {
      const topic = template.Resources.ComplianceTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.KmsMasterKeyId).toBeDefined();
    });

    test('ComplianceTopic name should include environment suffix', () => {
      const topic = template.Resources.ComplianceTopic;
      expect(topic.Properties.TopicName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('IAM Roles', () => {
    test('ConfigRole should exist with custom inline policy', () => {
      const role = template.Resources.ConfigRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.Policies).toBeDefined();
      expect(role.Properties.Policies).toHaveLength(1);
    });

    test('ConfigRole should allow Config service', () => {
      const role = template.Resources.ConfigRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toBe('config.amazonaws.com');
    });

    test('LambdaExecutionRole should exist with custom inline policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.Policies).toBeDefined();
      expect(role.Properties.Policies).toHaveLength(1);
    });

    test('LambdaExecutionRole should have necessary permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      expect(policy.Statement).toBeDefined();

      // Check for CloudWatch Logs permissions
      const logsStatement = policy.Statement.find((s: any) =>
        s.Action.includes('logs:CreateLogGroup')
      );
      expect(logsStatement).toBeDefined();

      // Check for Config permissions
      const configStatement = policy.Statement.find((s: any) =>
        s.Action.includes('config:PutEvaluations')
      );
      expect(configStatement).toBeDefined();
    });
  });

  describe('AWS Config Resources', () => {
    test('ConfigRecorder should exist with correct role', () => {
      const recorder = template.Resources.ConfigRecorder;
      expect(recorder).toBeDefined();
      expect(recorder.Type).toBe('AWS::Config::ConfigurationRecorder');
      expect(recorder.Properties.RoleARN).toBeDefined();
      expect(recorder.Properties.RoleARN['Fn::GetAtt']).toEqual(['ConfigRole', 'Arn']);
    });

    test('ConfigRecorder should record all supported resources', () => {
      const recorder = template.Resources.ConfigRecorder;
      expect(recorder.Properties.RecordingGroup.AllSupported).toBe(true);
      expect(recorder.Properties.RecordingGroup.IncludeGlobalResourceTypes).toBe(true);
    });

    test('ConfigDeliveryChannel should exist with S3 and SNS', () => {
      const channel = template.Resources.ConfigDeliveryChannel;
      expect(channel).toBeDefined();
      expect(channel.Type).toBe('AWS::Config::DeliveryChannel');
      expect(channel.Properties.S3BucketName).toBeDefined();
      expect(channel.Properties.SnsTopicARN).toBeDefined();
    });

    test('ConfigDeliveryChannel should deliver every 24 hours', () => {
      const channel = template.Resources.ConfigDeliveryChannel;
      expect(channel.Properties.ConfigSnapshotDeliveryProperties.DeliveryFrequency).toBe('TwentyFour_Hours');
    });
  });

  describe('Lambda Functions', () => {
    const lambdaFunctions = [
      'TagComplianceFunction',
      'EncryptionComplianceFunction',
      'SecurityGroupComplianceFunction',
      'ComplianceReportFunction'
    ];

    lambdaFunctions.forEach(funcName => {
      test(`${funcName} should exist with correct runtime`, () => {
        const func = template.Resources[funcName];
        expect(func).toBeDefined();
        expect(func.Type).toBe('AWS::Lambda::Function');
        expect(func.Properties.Runtime).toBe('python3.11');
      });

      test(`${funcName} should have 256MB memory`, () => {
        const func = template.Resources[funcName];
        expect(func.Properties.MemorySize).toBe(256);
      });

      test(`${funcName} should have reserved concurrent executions`, () => {
        const func = template.Resources[funcName];
        expect(func.Properties.ReservedConcurrentExecutions).toBe(5);
      });

      test(`${funcName} should have inline code`, () => {
        const func = template.Resources[funcName];
        expect(func.Properties.Code.ZipFile).toBeDefined();
        expect(func.Properties.Code.ZipFile.length).toBeGreaterThan(100);
      });

      test(`${funcName} name should include environment suffix`, () => {
        const func = template.Resources[funcName];
        expect(func.Properties.FunctionName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });

    test('ComplianceReportFunction should have environment variables', () => {
      const func = template.Resources.ComplianceReportFunction;
      expect(func.Properties.Environment).toBeDefined();
      expect(func.Properties.Environment.Variables.REPORTS_BUCKET).toBeDefined();
      expect(func.Properties.Environment.Variables.SNS_TOPIC_ARN).toBeDefined();
    });
  });

  describe('Lambda Function Code', () => {
    test('TagComplianceFunction code should check required tags', () => {
      const func = template.Resources.TagComplianceFunction;
      const code = func.Properties.Code.ZipFile;
      expect(code).toContain('REQUIRED_TAGS');
      expect(code).toContain('Environment');
      expect(code).toContain('Owner');
      expect(code).toContain('CostCenter');
      expect(code).toContain('missing_tags');
    });

    test('EncryptionComplianceFunction code should check RDS, S3, and EBS', () => {
      const func = template.Resources.EncryptionComplianceFunction;
      const code = func.Properties.Code.ZipFile;
      expect(code).toContain('AWS::RDS::DBInstance');
      expect(code).toContain('AWS::S3::Bucket');
      expect(code).toContain('AWS::EC2::Volume');
      expect(code).toContain('StorageEncrypted');
    });

    test('SecurityGroupComplianceFunction code should check ports 22 and 3389', () => {
      const func = template.Resources.SecurityGroupComplianceFunction;
      const code = func.Properties.Code.ZipFile;
      expect(code).toContain('RESTRICTED_PORTS');
      expect(code).toContain('22');
      expect(code).toContain('3389');
      expect(code).toContain('0.0.0.0/0');
    });

    test('ComplianceReportFunction code should generate JSON reports', () => {
      const func = template.Resources.ComplianceReportFunction;
      const code = func.Properties.Code.ZipFile;
      expect(code).toContain('describe_config_rules');
      expect(code).toContain('get_compliance_details_by_config_rule');
      expect(code).toContain('put_object');
      expect(code).toContain('json.dumps');
    });
  });

  describe('Lambda Permissions', () => {
    test('LambdaInvokePermissionTagCompliance should allow Config service', () => {
      const permission = template.Resources.LambdaInvokePermissionTagCompliance;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Principal).toBe('config.amazonaws.com');
    });

    test('LambdaInvokePermissionEncryptionCompliance should allow Config service', () => {
      const permission = template.Resources.LambdaInvokePermissionEncryptionCompliance;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Principal).toBe('config.amazonaws.com');
    });

    test('LambdaInvokePermissionSecurityGroupCompliance should allow Config service', () => {
      const permission = template.Resources.LambdaInvokePermissionSecurityGroupCompliance;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Principal).toBe('config.amazonaws.com');
    });

    test('LambdaInvokePermissionReportSchedule should allow events service', () => {
      const permission = template.Resources.LambdaInvokePermissionReportSchedule;
      expect(permission).toBeDefined();
      expect(permission.Properties.Principal).toBe('events.amazonaws.com');
    });
  });

  describe('Config Rules', () => {
    const configRules = [
      { name: 'ConfigRuleTagCompliance', types: ['AWS::EC2::Instance', 'AWS::S3::Bucket', 'AWS::RDS::DBInstance', 'AWS::Lambda::Function'] },
      { name: 'ConfigRuleEncryptionCompliance', types: ['AWS::RDS::DBInstance', 'AWS::S3::Bucket', 'AWS::EC2::Volume'] },
      { name: 'ConfigRuleSecurityGroupCompliance', types: ['AWS::EC2::SecurityGroup'] }
    ];

    configRules.forEach(rule => {
      test(`${rule.name} should exist with custom Lambda source`, () => {
        const configRule = template.Resources[rule.name];
        expect(configRule).toBeDefined();
        expect(configRule.Type).toBe('AWS::Config::ConfigRule');
        expect(configRule.Properties.Source.Owner).toBe('CUSTOM_LAMBDA');
      });

      test(`${rule.name} should have correct resource types`, () => {
        const configRule = template.Resources[rule.name];
        expect(configRule.Properties.Scope.ComplianceResourceTypes).toEqual(rule.types);
      });

      test(`${rule.name} should have correct event sources`, () => {
        const configRule = template.Resources[rule.name];
        const sourceDetails = configRule.Properties.Source.SourceDetails;
        expect(sourceDetails).toHaveLength(2);
        expect(sourceDetails[0].MessageType).toBe('ConfigurationItemChangeNotification');
        expect(sourceDetails[1].MessageType).toBe('OversizedConfigurationItemChangeNotification');
      });

      test(`${rule.name} name should include environment suffix`, () => {
        const configRule = template.Resources[rule.name];
        expect(configRule.Properties.ConfigRuleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });

    test('ConfigRuleTagCompliance should have MaximumExecutionFrequency', () => {
      const rule = template.Resources.ConfigRuleTagCompliance;
      expect(rule.Properties.MaximumExecutionFrequency).toBe('TwentyFour_Hours');
    });
  });

  describe('EventBridge Rule', () => {
    test('ReportGenerationSchedule should trigger daily', () => {
      const rule = template.Resources.ReportGenerationSchedule;
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::Events::Rule');
      expect(rule.Properties.ScheduleExpression).toBe('rate(1 day)');
      expect(rule.Properties.State).toBe('ENABLED');
    });

    test('ReportGenerationSchedule should target ComplianceReportFunction', () => {
      const rule = template.Resources.ReportGenerationSchedule;
      expect(rule.Properties.Targets).toHaveLength(1);
      expect(rule.Properties.Targets[0].Arn['Fn::GetAtt']).toEqual(['ComplianceReportFunction', 'Arn']);
    });
  });

  describe('SSM Document', () => {
    test('RemediationDocument should exist with correct type', () => {
      const doc = template.Resources.RemediationDocument;
      expect(doc).toBeDefined();
      expect(doc.Type).toBe('AWS::SSM::Document');
      expect(doc.Properties.DocumentType).toBe('Automation');
    });

    test('RemediationDocument should use Python 3.11', () => {
      const doc = template.Resources.RemediationDocument;
      expect(doc.Properties.Content.mainSteps[0].inputs.Runtime).toBe('python3.11');
    });

    test('RemediationDocument should have tag remediation script', () => {
      const doc = template.Resources.RemediationDocument;
      const script = doc.Properties.Content.mainSteps[0].inputs.Script;
      expect(script).toContain('def add_tags');
      expect(script).toContain('boto3.client');
      expect(script).toContain('create_tags');
    });

    test('RemediationDocument name should include environment suffix', () => {
      const doc = template.Resources.RemediationDocument;
      expect(doc.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'ConfigRecorderName',
      'ComplianceReportsBucketName',
      'ComplianceTopicArn',
      'TagComplianceFunctionArn',
      'EncryptionComplianceFunctionArn',
      'SecurityGroupComplianceFunctionArn',
      'ComplianceReportFunctionArn',
      'SNSEncryptionKeyId',
      'RemediationDocumentName',
      'EnvironmentSuffix'
    ];

    expectedOutputs.forEach(outputName => {
      test(`should have ${outputName} output`, () => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
      });

      test(`${outputName} should have export`, () => {
        expect(template.Outputs[outputName].Export).toBeDefined();
        expect(template.Outputs[outputName].Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Naming', () => {
    const resourcesWithNames = [
      'ConfigRole',
      'LambdaExecutionRole',
      'ConfigRecorder',
      'ConfigDeliveryChannel',
      'TagComplianceFunction',
      'EncryptionComplianceFunction',
      'SecurityGroupComplianceFunction',
      'ComplianceReportFunction',
      'ConfigRuleTagCompliance',
      'ConfigRuleEncryptionCompliance',
      'ConfigRuleSecurityGroupCompliance',
      'RemediationDocument'
    ];

    resourcesWithNames.forEach(resourceName => {
      test(`${resourceName} should include environment suffix in name`, () => {
        const resource = template.Resources[resourceName];
        const nameProperty = resource.Properties.Name ||
                            resource.Properties.RoleName ||
                            resource.Properties.FunctionName ||
                            resource.Properties.ConfigRuleName;

        expect(nameProperty).toBeDefined();
        if (typeof nameProperty === 'object' && nameProperty['Fn::Sub']) {
          expect(nameProperty['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });
  });

  describe('DeletionPolicy', () => {
    const deletableResources = [
      'ComplianceReportsBucket',
      'ConfigBucket',
      'SNSEncryptionKey'
    ];

    deletableResources.forEach(resourceName => {
      test(`${resourceName} should have DeletionPolicy: Delete`, () => {
        const resource = template.Resources[resourceName];
        expect(resource.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('Template Dependencies', () => {
    test('ConfigDeliveryChannel should depend on ConfigBucketPolicy', () => {
      const channel = template.Resources.ConfigDeliveryChannel;
      expect(channel.DependsOn).toBe('ConfigBucketPolicy');
    });
  });

  describe('Resource Count', () => {
    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(20);
      expect(resourceCount).toBeLessThanOrEqual(25);
    });
  });
});
