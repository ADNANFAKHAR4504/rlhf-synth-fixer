import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If you're testing a YAML template, run: pipenv run cfn-flip-to-json > lib/TapStack.json
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Automated Infrastructure Analysis and Compliance Validation System for Financial Services'
      );
    });
  });

  describe('Parameters', () => {
    test('should have NotificationEmail parameter', () => {
      expect(template.Parameters.NotificationEmail).toBeDefined();
      const param = template.Parameters.NotificationEmail;

      expect(param.Type).toBe('String');

      // Accept both descriptions: with or without "(optional)"
      expect(typeof param.Description).toBe('string');
      expect(param.Description).toMatch(
        /^Email address for compliance violation notifications(\s*\(optional\))?$/
      );

      // Accept either "empty or valid email" OR "valid email only"
      const allowed = String(param.AllowedPattern).replace(/\s+/g, '');
      const emailOnly = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$';
      const emptyOrEmail = '(^$)|(^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$)';

      expect([emailOnly, emptyOrEmail]).toContain(allowed);
    });
    test('should have RequiredTags parameter', () => {
      expect(template.Parameters.RequiredTags).toBeDefined();
      const param = template.Parameters.RequiredTags;
      expect(param.Type).toBe('CommaDelimitedList');
      expect(param.Default).toBe('Owner,CostCenter,Environment,DataClassification,ComplianceLevel');
    });

    test('should have KMSKeyAlias parameter', () => {
      expect(template.Parameters.KMSKeyAlias).toBeDefined();
      const param = template.Parameters.KMSKeyAlias;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('compliance-validation-key');
    });

    test('should have ScanScheduleRate parameter', () => {
      expect(template.Parameters.ScanScheduleRate).toBeDefined();
      const param = template.Parameters.ScanScheduleRate;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('rate(10 minutes)');
      expect(param.AllowedValues).toContain('rate(10 minutes)');
    });
  });

  describe('Resources', () => {
    test('should have ComplianceKMSKey resource', () => {
      expect(template.Resources.ComplianceKMSKey).toBeDefined();
      const kmsKey = template.Resources.ComplianceKMSKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('should have S3 buckets for compliance reports and analysis results', () => {
      expect(template.Resources.ComplianceReportsBucket).toBeDefined();
      expect(template.Resources.AnalysisResultsBucket).toBeDefined();

      const reportsS3 = template.Resources.ComplianceReportsBucket;
      const analysisS3 = template.Resources.AnalysisResultsBucket;

      expect(reportsS3.Type).toBe('AWS::S3::Bucket');
      expect(analysisS3.Type).toBe('AWS::S3::Bucket');

      // Check encryption configuration
      expect(
        reportsS3.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('aws:kms');
      expect(
        analysisS3.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('aws:kms');
    });

    test('should have SNS topic for compliance violations', () => {
      expect(template.Resources.ComplianceViolationsTopic).toBeDefined();
      const snsTopic = template.Resources.ComplianceViolationsTopic;
      expect(snsTopic.Type).toBe('AWS::SNS::Topic');
      expect(snsTopic.Properties.DisplayName).toBe('Compliance Violations Alert');
    });

    test('should have Lambda functions for analyzer and periodic scan', () => {
      expect(template.Resources.AnalyzerFunction).toBeDefined();
      expect(template.Resources.PeriodicScanFunction).toBeDefined();

      const analyzerLambda = template.Resources.AnalyzerFunction;
      const periodicLambda = template.Resources.PeriodicScanFunction;

      expect(analyzerLambda.Type).toBe('AWS::Lambda::Function');
      expect(periodicLambda.Type).toBe('AWS::Lambda::Function');

      expect(analyzerLambda.Properties.Runtime).toBe('python3.12');
      expect(periodicLambda.Properties.Runtime).toBe('python3.12');
    });

    test('should have IAM roles for Lambda functions', () => {
      expect(template.Resources.AnalyzerFunctionRole).toBeDefined();
      expect(template.Resources.PeriodicScanFunctionRole).toBeDefined();

      const analyzerRole = template.Resources.AnalyzerFunctionRole;
      const periodicRole = template.Resources.PeriodicScanFunctionRole;

      expect(analyzerRole.Type).toBe('AWS::IAM::Role');
      expect(periodicRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have EventBridge rules for triggering scans', () => {
      expect(template.Resources.StackChangeEventRule).toBeDefined();
      expect(template.Resources.PeriodicScanScheduleRule).toBeDefined();

      const stackChangeRule = template.Resources.StackChangeEventRule;
      const periodicRule = template.Resources.PeriodicScanScheduleRule;

      expect(stackChangeRule.Type).toBe('AWS::Events::Rule');
      expect(periodicRule.Type).toBe('AWS::Events::Rule');

      expect(stackChangeRule.Properties.State).toBe('ENABLED');
      expect(periodicRule.Properties.State).toBe('ENABLED');
    });

    test('should have CloudWatch Log Groups with proper retention', () => {
      expect(template.Resources.AnalyzerLogGroup).toBeDefined();
      expect(template.Resources.PeriodicScanLogGroup).toBeDefined();

      const analyzerLogs = template.Resources.AnalyzerLogGroup;
      const periodicLogs = template.Resources.PeriodicScanLogGroup;

      expect(analyzerLogs.Type).toBe('AWS::Logs::LogGroup');
      expect(periodicLogs.Type).toBe('AWS::Logs::LogGroup');

      expect(analyzerLogs.Properties.RetentionInDays).toBe(365);
      expect(periodicLogs.Properties.RetentionInDays).toBe(365);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'ComplianceReportsBucketArn',
        'ComplianceReportsBucketName',
        'AnalysisResultsBucketArn',
        'AnalysisResultsBucketName',
        'ComplianceViolationsTopicArn',
        'AnalyzerFunctionArn',
        'PeriodicScanFunctionArn',
        'KMSKeyId',
        'KMSKeyAlias',
        'ReportsBaseURI',
        'StackChangeEventRuleArn',
        'PeriodicScanScheduleRuleArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('ComplianceReportsBucketArn output should be correct', () => {
      const output = template.Outputs.ComplianceReportsBucketArn;
      expect(output.Description).toBe('ARN of the compliance reports S3 bucket');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ComplianceReportsBucket', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-ComplianceReportsBucketArn',
      });
    });

    test('AnalyzerFunctionArn output should be correct', () => {
      const output = template.Outputs.AnalyzerFunctionArn;
      expect(output.Description).toBe('ARN of the compliance analyzer Lambda function');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['AnalyzerFunction', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-AnalyzerFunctionArn',
      });
    });

    test('KMSKeyId output should be correct', () => {
      const output = template.Outputs.KMSKeyId;
      expect(output.Description).toBe('ID of the KMS key used for encryption');
      expect(output.Value).toEqual({ Ref: 'ComplianceKMSKey' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-KMSKeyId',
      });
    });

    test('ReportsBaseURI output should be correct', () => {
      const output = template.Outputs.ReportsBaseURI;
      expect(output.Description).toBe('Base S3 URI for compliance reports');
      expect(output.Value).toEqual({
        'Fn::Sub': 's3://${ComplianceReportsBucket}/',
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
      expect(template.Conditions).not.toBeNull();
    });

    test('should have all necessary resources for compliance validation', () => {
      const resourceCount = Object.keys(template.Resources).length;
      // Template currently has 20 resources; accept >= 20 for future growth.
      expect(resourceCount).toBeGreaterThanOrEqual(20);
    });

    test('should have all required parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      // Now 8 params (includes AlertSeverityThreshold)
      expect(parameterCount).toBe(8);
    });

    test('should have all required outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(12);
    });

    test('should have conditions for bucket creation', () => {
      expect(template.Conditions.CreateComplianceReportsBucket).toBeDefined();
      expect(template.Conditions.CreateAnalysisResultsBucket).toBeDefined();
    });
  });

  describe('Security and Compliance Features', () => {
    test('S3 buckets should have proper security configuration', () => {
      const complianceBucket = template.Resources.ComplianceReportsBucket;
      const analysisBucket = template.Resources.AnalysisResultsBucket;

      // Public access block
      expect(complianceBucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(analysisBucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);

      // Versioning
      expect(complianceBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(analysisBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');

      // Lifecycle
      expect(complianceBucket.Properties.LifecycleConfiguration.Rules).toBeDefined();
      expect(analysisBucket.Properties.LifecycleConfiguration.Rules).toBeDefined();
    });

    test('Lambda functions should use KMS encryption', () => {
      const analyzerFunction = template.Resources.AnalyzerFunction;
      const periodicFunction = template.Resources.PeriodicScanFunction;

      expect(analyzerFunction.Properties.KmsKeyArn).toEqual({
        'Fn::GetAtt': ['ComplianceKMSKey', 'Arn']
      });
      expect(periodicFunction.Properties.KmsKeyArn).toEqual({
        'Fn::GetAtt': ['ComplianceKMSKey', 'Arn']
      });
    });

    test('IAM roles should follow least privilege principle', () => {
      const analyzerRole = template.Resources.AnalyzerFunctionRole;
      const periodicRole = template.Resources.PeriodicScanFunctionRole;

      expect(analyzerRole.Properties.Policies).toBeDefined();
      expect(periodicRole.Properties.Policies).toBeDefined();

      // Check for explicit denies in analyzer role
      const analyzerPolicy = analyzerRole.Properties.Policies[0].PolicyDocument;
      const denyStatement = analyzerPolicy.Statement.find((s: any) => s.Effect === 'Deny');
      expect(denyStatement).toBeDefined();
      expect(denyStatement.Action).toContain('kms:ScheduleKeyDeletion');
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export) {
          expect(output.Export.Name).toEqual({
            'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
          });
        }
      });
    });
  });
});
