import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'Development';

describe('TapStack CloudFormation Template (LocalStack Community Edition)', () => {
  let template: any;

  beforeAll(() => {
    // Load the simplified CloudFormation template
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
      expect(template.Description).toContain(
        'TAP Stack - Task Assignment Platform Infrastructure'
      );
    });

    test('description should mention LocalStack Community Edition compatibility', () => {
      expect(template.Description).toContain('LocalStack Community Edition');
    });
  });

  describe('Parameters', () => {
    test('should have required parameters', () => {
      const expectedParams = ['Environment', 'ApplicationName'];
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('Development');
      expect(envParam.AllowedValues).toContain('Development');
      expect(envParam.AllowedValues).toContain('Staging');
      expect(envParam.AllowedValues).toContain('Production');
    });

    test('ApplicationName parameter should have correct properties', () => {
      const appParam = template.Parameters.ApplicationName;
      expect(appParam.Type).toBe('String');
      expect(appParam.Default).toBe('tap');
      expect(appParam.MinLength).toBe(1);
      expect(appParam.MaxLength).toBe(20);
    });
  });

  describe('IAM Resources', () => {
    test('should have IAM role for application', () => {
      expect(template.Resources.ApplicationRole).toBeDefined();
      expect(template.Resources.ApplicationRole.Type).toBe('AWS::IAM::Role');
    });

    test('IAM role should have correct assume role policy', () => {
      const role = template.Resources.ApplicationRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;

      expect(assumePolicy.Version).toBe('2012-10-17');
      expect(assumePolicy.Statement).toHaveLength(1);
      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toContain('lambda.amazonaws.com');
    });

    test('IAM role should have S3 access policy', () => {
      const role = template.Resources.ApplicationRole;
      const policies = role.Properties.Policies;
      expect(policies).toBeDefined();
      expect(policies.length).toBeGreaterThan(0);

      const s3Policy = policies.find(
        (p: any) => p.PolicyName === 'S3DataAccess'
      );
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:GetObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:PutObject');
    });

    test('IAM role should have CloudWatch Logs access policy', () => {
      const role = template.Resources.ApplicationRole;
      const logsPolicy = role.Properties.Policies.find(
        (p: any) => p.PolicyName === 'LogsAccess'
      );
      expect(logsPolicy).toBeDefined();
      expect(logsPolicy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogGroup');
      expect(logsPolicy.PolicyDocument.Statement[0].Action).toContain('logs:PutLogEvents');
    });

    test('IAM role should have Lambda basic execution managed policy', () => {
      const role = template.Resources.ApplicationRole;
      const managedPolicies = role.Properties.ManagedPolicyArns;
      expect(managedPolicies).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
    });
  });

  describe('Storage Resources', () => {
    test('should have data S3 bucket', () => {
      expect(template.Resources.DataBucket).toBeDefined();
      expect(template.Resources.DataBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have logs S3 bucket', () => {
      expect(template.Resources.LogsBucket).toBeDefined();
      expect(template.Resources.LogsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('data bucket should have versioning enabled', () => {
      const bucket = template.Resources.DataBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('data bucket should have encryption enabled', () => {
      const bucket = template.Resources.DataBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      const encryption =
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe(
        'AES256'
      );
    });

    test('logs bucket should have encryption enabled', () => {
      const bucket = template.Resources.LogsBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      const encryption =
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe(
        'AES256'
      );
    });

    test('both buckets should block public access', () => {
      const dataBucket = template.Resources.DataBucket;
      const logsBucket = template.Resources.LogsBucket;

      [dataBucket, logsBucket].forEach(bucket => {
        const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      });
    });

    test('data bucket should have lifecycle rules', () => {
      const bucket = template.Resources.DataBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toHaveLength(2);
    });

    test('logs bucket should have log retention lifecycle rule', () => {
      const bucket = template.Resources.LogsBucket;
      const rules = bucket.Properties.LifecycleConfiguration.Rules;
      const deleteRule = rules.find((r: any) => r.Id === 'DeleteOldLogs');
      expect(deleteRule).toBeDefined();
      expect(deleteRule.ExpirationInDays).toBe(90);
    });
  });

  describe('Monitoring Resources', () => {
    test('should have application log group', () => {
      expect(template.Resources.ApplicationLogGroup).toBeDefined();
      expect(template.Resources.ApplicationLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have access log group', () => {
      expect(template.Resources.AccessLogGroup).toBeDefined();
      expect(template.Resources.AccessLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have error log group', () => {
      expect(template.Resources.ErrorLogGroup).toBeDefined();
      expect(template.Resources.ErrorLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('application log group should have correct retention', () => {
      const logGroup = template.Resources.ApplicationLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(14);
    });

    test('error log group should have longer retention than access logs', () => {
      const errorLogGroup = template.Resources.ErrorLogGroup;
      const accessLogGroup = template.Resources.AccessLogGroup;
      expect(errorLogGroup.Properties.RetentionInDays).toBeGreaterThan(
        accessLogGroup.Properties.RetentionInDays
      );
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'DataBucketName',
        'DataBucketArn',
        'LogsBucketName',
        'ApplicationRoleName',
        'ApplicationRoleArn',
        'ApplicationLogGroupName',
        'AccessLogGroupName',
        'ErrorLogGroupName',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('data bucket output should be correct', () => {
      const output = template.Outputs.DataBucketName;
      expect(output.Description).toContain('data');
      expect(output.Value).toEqual({ Ref: 'DataBucket' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-DataBucket',
      });
    });

    test('application role output should be correct', () => {
      const output = template.Outputs.ApplicationRoleName;
      expect(output.Description).toContain('IAM role');
      expect(output.Value).toEqual({ Ref: 'ApplicationRole' });
    });

    test('log group outputs should not have exports', () => {
      const accessLogOutput = template.Outputs.AccessLogGroupName;
      const errorLogOutput = template.Outputs.ErrorLogGroupName;

      expect(accessLogOutput.Export).toBeUndefined();
      expect(errorLogOutput.Export).toBeUndefined();
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
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(8);
    });

    test('should have expected resource count for simplified template', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(6); // 1 IAM role, 2 S3 buckets, 3 log groups
    });

    test('should NOT contain EC2 resources', () => {
      const resourceTypes = Object.values(template.Resources).map((r: any) => r.Type);
      expect(resourceTypes).not.toContain('AWS::EC2::Instance');
      expect(resourceTypes).not.toContain('AWS::EC2::VPC');
      expect(resourceTypes).not.toContain('AWS::EC2::Subnet');
      expect(resourceTypes).not.toContain('AWS::EC2::SecurityGroup');
    });

    test('should NOT contain CloudWatch Alarms', () => {
      const resourceTypes = Object.values(template.Resources).map((r: any) => r.Type);
      expect(resourceTypes).not.toContain('AWS::CloudWatch::Alarm');
    });

    test('should only use LocalStack Community compatible services', () => {
      const resourceTypes = Object.values(template.Resources).map((r: any) => r.Type);
      const communityServices = [
        'AWS::S3::Bucket',
        'AWS::IAM::Role',
        'AWS::Logs::LogGroup'
      ];

      resourceTypes.forEach(type => {
        expect(communityServices).toContain(type);
      });
    });
  });

  describe('Resource Tagging', () => {
    test('all resources should have Environment tag', () => {
      const resourcesWithTags = [
        'ApplicationRole',
        'DataBucket',
        'LogsBucket',
        'ApplicationLogGroup',
        'AccessLogGroup',
        'ErrorLogGroup',
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();

        const envTag = resource.Properties.Tags.find(
          (tag: any) => tag.Key === 'Environment'
        );
        expect(envTag).toBeDefined();
        expect(envTag.Value).toEqual({ Ref: 'Environment' });
      });
    });

    test('resources should follow naming convention', () => {
      const dataBucket = template.Resources.DataBucket;
      const nameTag = dataBucket.Properties.Tags.find(
        (tag: any) => tag.Key === 'Name'
      );
      expect(nameTag.Value['Fn::Sub']).toContain('${ApplicationName}-${Environment}');
    });
  });
});
