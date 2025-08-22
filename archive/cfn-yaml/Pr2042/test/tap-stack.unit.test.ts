import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
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
        'Comprehensive AWS Security Infrastructure - TAP Stack with Enhanced Security Features'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const requiredParams = ['EnvironmentSuffix', 'AllowedSSHCIDR', 'NotificationEmail', 'EnableGuardDuty', 'EnableDetailedMonitoring'];
      requiredParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });

    test('NotificationEmail parameter should validate email format', () => {
      const emailParam = template.Parameters.NotificationEmail;
      expect(emailParam.Type).toBe('String');
      expect(emailParam.AllowedPattern).toBeDefined();
      expect(emailParam.ConstraintDescription).toBe('Must be a valid email address');
    });
  });

  describe('Security Resources', () => {
    test('should have VPC with proper configuration', () => {
      expect(template.Resources.SecureVPC).toBeDefined();
      const vpc = template.Resources.SecureVPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have public and private subnets', () => {
      expect(template.Resources.PublicSubnet).toBeDefined();
      expect(template.Resources.PrivateSubnet).toBeDefined();
      expect(template.Resources.PublicSubnet.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have security group with restrictive rules', () => {
      expect(template.Resources.WebSecurityGroup).toBeDefined();
      const sg = template.Resources.WebSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(3); // SSH, HTTP, HTTPS
    });

    test('should have IAM role with least privilege', () => {
      expect(template.Resources.EC2SecurityRole).toBeDefined();
      const role = template.Resources.EC2SecurityRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.Policies).toBeDefined();
      expect(role.Properties.Policies[0].PolicyName).toBe('S3ReadOnlyAccess');
    });

    test('should have S3 buckets with encryption', () => {
      expect(template.Resources.SecureDataBucket).toBeDefined();
      const bucket = template.Resources.SecureDataBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have S3 bucket policy enforcing HTTPS', () => {
      expect(template.Resources.SecureDataBucketPolicy).toBeDefined();
      const policy = template.Resources.SecureDataBucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Deny');
      expect(statement.Condition.Bool['aws:SecureTransport']).toBe('false');
    });
  });

  describe('Monitoring and Alerting', () => {
    test('should have SNS topic for security alerts', () => {
      expect(template.Resources.SecurityAlertsTopic).toBeDefined();
      const topic = template.Resources.SecurityAlertsTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.KmsMasterKeyId).toBe('alias/aws/sns');
    });

    test('should have CloudWatch alarms', () => {
      const alarms = ['UnauthorizedAPICallsAlarm', 'HighCPUAlarm', 'UnusualS3ActivityAlarm'];
      alarms.forEach(alarm => {
        expect(template.Resources[alarm]).toBeDefined();
        expect(template.Resources[alarm].Type).toBe('AWS::CloudWatch::Alarm');
      });
    });

    test('should have CloudWatch log groups', () => {
      expect(template.Resources.S3AccessLogGroup).toBeDefined();
      expect(template.Resources.SecurityLogGroup).toBeDefined();
      expect(template.Resources.S3AccessLogGroup.Properties.RetentionInDays).toBe(30);
      expect(template.Resources.SecurityLogGroup.Properties.RetentionInDays).toBe(90);
    });
  });

  describe('GuardDuty Configuration', () => {
    test('should have GuardDuty detector with conditional creation', () => {
      expect(template.Resources.GuardDutyDetector).toBeDefined();
      const detector = template.Resources.GuardDutyDetector;
      expect(detector.Type).toBe('AWS::GuardDuty::Detector');
      expect(detector.Condition).toBe('EnableGuardDutyCondition');
      expect(detector.Properties.Enable).toBe(true);
    });

    test('should have GuardDuty condition defined', () => {
      expect(template.Conditions.EnableGuardDutyCondition).toBeDefined();
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have TurnAroundPromptTable resource', () => {
      expect(template.Resources.TurnAroundPromptTable).toBeDefined();
    });

    test('TurnAroundPromptTable should be a DynamoDB table', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('TurnAroundPromptTable should have correct deletion policies', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
    });

    test('TurnAroundPromptTable should have correct properties', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const properties = table.Properties;

      expect(properties.TableName).toEqual({
        'Fn::Sub': 'TurnAroundPromptTable${EnvironmentSuffix}',
      });
      expect(properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(properties.DeletionProtectionEnabled).toBe(false);
      expect(properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
      expect(properties.SSESpecification.SSEEnabled).toBe(true);
      expect(properties.SSESpecification.SSEType).toBe('KMS');
    });

    test('TurnAroundPromptTable should have correct attribute definitions', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const attributeDefinitions = table.Properties.AttributeDefinitions;

      expect(attributeDefinitions).toHaveLength(1);
      expect(attributeDefinitions[0].AttributeName).toBe('id');
      expect(attributeDefinitions[0].AttributeType).toBe('S');
    });

    test('TurnAroundPromptTable should have correct key schema', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('id');
      expect(keySchema[0].KeyType).toBe('HASH');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'StackName',
        'EnvironmentSuffix',
        'VPCId',
        'PublicSubnetId',
        'PrivateSubnetId',
        'SecureDataBucketName',
        'SecurityAlertsTopicArn',
        'EC2InstanceId'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('TurnAroundPromptTableName output should be correct', () => {
      const output = template.Outputs.TurnAroundPromptTableName;
      expect(output.Description).toBe('Name of the DynamoDB table');
      expect(output.Value).toEqual({ Ref: 'TurnAroundPromptTable' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-TurnAroundPromptTableName',
      });
    });

    test('TurnAroundPromptTableArn output should be correct', () => {
      const output = template.Outputs.TurnAroundPromptTableArn;
      expect(output.Description).toBe('ARN of the DynamoDB table');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['TurnAroundPromptTable', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-TurnAroundPromptTableArn',
      });
    });

    test('VPC and networking outputs should be correct', () => {
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'SecureVPC' });
      expect(template.Outputs.PublicSubnetId.Value).toEqual({ Ref: 'PublicSubnet' });
      expect(template.Outputs.PrivateSubnetId.Value).toEqual({ Ref: 'PrivateSubnet' });
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

    test('should have proper resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(15); // We have many security resources
    });

    test('should have proper parameter count', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(5); // EnvironmentSuffix, AllowedSSHCIDR, NotificationEmail, EnableGuardDuty, EnableDetailedMonitoring
    });
  });

  describe('Resource Naming Convention', () => {
    test('table name should follow naming convention with environment suffix', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const tableName = table.Properties.TableName;

      expect(tableName).toEqual({
        'Fn::Sub': 'TurnAroundPromptTable${EnvironmentSuffix}',
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
        });
      });
    });
  });
});