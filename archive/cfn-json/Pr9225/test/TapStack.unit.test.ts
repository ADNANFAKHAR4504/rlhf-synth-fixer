import * as fs from 'fs';
import * as path from 'path';

describe('CloudFormation Template Unit Tests', () => {
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

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Infrastructure Template Validation System');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('EnvironmentSuffix should have AllowedPattern validation', () => {
      expect(template.Parameters.EnvironmentSuffix.AllowedPattern).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.AllowedPattern).toBe('^[a-z0-9-]+$');
    });

    test('EnvironmentSuffix should have ConstraintDescription', () => {
      expect(template.Parameters.EnvironmentSuffix.ConstraintDescription).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.ConstraintDescription).toContain('lowercase');
    });
  });

  describe('S3 Bucket Resource', () => {
    let bucket: any;

    beforeAll(() => {
      bucket = template.Resources.TemplateBucket;
    });

    test('should exist with correct type', () => {
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have bucket name with environmentSuffix', () => {
      expect(bucket.Properties.BucketName).toBeDefined();
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain('${AWS::AccountId}');
    });

    test('should have versioning enabled', () => {
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have encryption configured', () => {
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('should have public access blocked', () => {
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock).toBeDefined();
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('should have EventBridge notifications enabled', () => {
      expect(bucket.Properties.NotificationConfiguration).toBeDefined();
      expect(bucket.Properties.NotificationConfiguration.EventBridgeConfiguration).toBeDefined();
      expect(bucket.Properties.NotificationConfiguration.EventBridgeConfiguration.EventBridgeEnabled).toBe(true);
    });
  });

  describe('DynamoDB Table Resource', () => {
    let table: any;

    beforeAll(() => {
      table = template.Resources.ResultsTable;
    });

    test('should exist with correct type', () => {
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('should have table name with environmentSuffix', () => {
      expect(table.Properties.TableName).toBeDefined();
      expect(table.Properties.TableName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have correct key schema', () => {
      expect(table.Properties.KeySchema).toBeDefined();
      expect(table.Properties.KeySchema.length).toBe(2);

      const hashKey = table.Properties.KeySchema.find((k: any) => k.KeyType === 'HASH');
      const rangeKey = table.Properties.KeySchema.find((k: any) => k.KeyType === 'RANGE');

      expect(hashKey.AttributeName).toBe('TemplateId');
      expect(rangeKey.AttributeName).toBe('Timestamp');
    });

    test('should have correct attribute definitions', () => {
      expect(table.Properties.AttributeDefinitions).toBeDefined();
      expect(table.Properties.AttributeDefinitions.length).toBe(2);

      const templateId = table.Properties.AttributeDefinitions.find((a: any) => a.AttributeName === 'TemplateId');
      const timestamp = table.Properties.AttributeDefinitions.find((a: any) => a.AttributeName === 'Timestamp');

      expect(templateId.AttributeType).toBe('S');
      expect(timestamp.AttributeType).toBe('S');
    });

    test('should use PAY_PER_REQUEST billing mode', () => {
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should have deletion protection disabled for testing', () => {
      expect(table.Properties.DeletionProtectionEnabled).toBe(false);
    });

    test('should have point-in-time recovery enabled', () => {
      expect(table.Properties.PointInTimeRecoverySpecification).toBeDefined();
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });
  });

  describe('Lambda Function Resource', () => {
    let lambda: any;

    beforeAll(() => {
      lambda = template.Resources.ValidatorFunction;
    });

    test('should exist with correct type', () => {
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
    });

    test('should have function name with environmentSuffix', () => {
      expect(lambda.Properties.FunctionName).toBeDefined();
      expect(lambda.Properties.FunctionName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should use Python 3.12 runtime', () => {
      expect(lambda.Properties.Runtime).toBe('python3.12');
    });

    test('should have correct handler', () => {
      expect(lambda.Properties.Handler).toBe('index.handler');
    });

    test('should have appropriate timeout', () => {
      expect(lambda.Properties.Timeout).toBe(300);
      expect(lambda.Properties.Timeout).toBeLessThanOrEqual(900);
    });

    test('should have appropriate memory size', () => {
      expect(lambda.Properties.MemorySize).toBe(512);
      expect(lambda.Properties.MemorySize).toBeGreaterThanOrEqual(128);
      expect(lambda.Properties.MemorySize).toBeLessThanOrEqual(10240);
    });

    test('should have environment variables configured', () => {
      expect(lambda.Properties.Environment).toBeDefined();
      expect(lambda.Properties.Environment.Variables).toBeDefined();
      expect(lambda.Properties.Environment.Variables.RESULTS_TABLE_NAME).toBeDefined();
    });

    test('should reference DynamoDB table in environment variable', () => {
      const tableRef = lambda.Properties.Environment.Variables.RESULTS_TABLE_NAME;
      expect(tableRef.Ref).toBe('ResultsTable');
    });

    test('should have IAM role configured', () => {
      expect(lambda.Properties.Role).toBeDefined();
      expect(lambda.Properties.Role['Fn::GetAtt']).toEqual(['ValidatorRole', 'Arn']);
    });

    test('should have inline code', () => {
      expect(lambda.Properties.Code).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
    });

    test('should depend on log group', () => {
      expect(lambda.DependsOn).toBe('ValidatorLogGroup');
    });

    test('Lambda code should contain validation logic', () => {
      const code = lambda.Properties.Code.ZipFile['Fn::Join'][1];
      expect(code.join('\n')).toContain('def handler(event, context):');
      expect(code.join('\n')).toContain('def validate_template');
      expect(code.join('\n')).toContain('check_iam_wildcards');
      expect(code.join('\n')).toContain('check_s3_public_access');
      expect(code.join('\n')).toContain('check_security_group_rules');
    });
  });

  describe('IAM Role Resource', () => {
    let role: any;

    beforeAll(() => {
      role = template.Resources.ValidatorRole;
    });

    test('should exist with correct type', () => {
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should have role name with environmentSuffix', () => {
      expect(role.Properties.RoleName).toBeDefined();
      expect(role.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have Lambda assume role policy', () => {
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      const statement = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Principal.Service).toBe('lambda.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });

    test('should have AWSLambdaBasicExecutionRole managed policy', () => {
      expect(role.Properties.ManagedPolicyArns).toBeDefined();
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
    });

    test('should have inline policies', () => {
      expect(role.Properties.Policies).toBeDefined();
      expect(role.Properties.Policies.length).toBeGreaterThan(0);
    });

    test('should have S3 read policy', () => {
      const s3Policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'S3ReadAccess');
      expect(s3Policy).toBeDefined();

      const statement = s3Policy.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toContain('s3:GetObject');
      expect(statement.Action).toContain('s3:GetObjectVersion');
    });

    test('S3 policy should reference bucket ARN', () => {
      const s3Policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'S3ReadAccess');
      const statement = s3Policy.PolicyDocument.Statement[0];
      expect(statement.Resource['Fn::Sub']).toContain('${TemplateBucket.Arn}');
    });

    test('should have DynamoDB write policy', () => {
      const dynamoPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'DynamoDBWriteAccess');
      expect(dynamoPolicy).toBeDefined();

      const statement = dynamoPolicy.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toContain('dynamodb:PutItem');
      expect(statement.Action).toContain('dynamodb:UpdateItem');
    });

    test('DynamoDB policy should reference table ARN', () => {
      const dynamoPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'DynamoDBWriteAccess');
      const statement = dynamoPolicy.PolicyDocument.Statement[0];
      expect(statement.Resource['Fn::GetAtt']).toEqual(['ResultsTable', 'Arn']);
    });

    test('should not have wildcard actions', () => {
      const policies = role.Properties.Policies;
      policies.forEach((policy: any) => {
        policy.PolicyDocument.Statement.forEach((statement: any) => {
          const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
          actions.forEach((action: string) => {
            expect(action).not.toBe('*');
          });
        });
      });
    });
  });

  describe('CloudWatch Logs Resource', () => {
    let logGroup: any;

    beforeAll(() => {
      logGroup = template.Resources.ValidatorLogGroup;
    });

    test('should exist with correct type', () => {
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have log group name with environmentSuffix', () => {
      expect(logGroup.Properties.LogGroupName).toBeDefined();
      expect(logGroup.Properties.LogGroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(logGroup.Properties.LogGroupName['Fn::Sub']).toContain('/aws/lambda/template-validator');
    });

    test('should have 30-day retention', () => {
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('EventBridge Rule Resource', () => {
    let rule: any;

    beforeAll(() => {
      rule = template.Resources.ValidationTriggerRule;
    });

    test('should exist with correct type', () => {
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::Events::Rule');
    });

    test('should have rule name with environmentSuffix', () => {
      expect(rule.Properties.Name).toBeDefined();
      expect(rule.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should be enabled', () => {
      expect(rule.Properties.State).toBe('ENABLED');
    });

    test('should have correct event pattern', () => {
      const pattern = rule.Properties.EventPattern;
      expect(pattern.source).toContain('aws.s3');
      expect(pattern['detail-type']).toContain('Object Created');
      expect(pattern.detail.bucket.name).toBeDefined();
    });

    test('should reference S3 bucket in event pattern', () => {
      const pattern = rule.Properties.EventPattern;
      expect(pattern.detail.bucket.name[0].Ref).toBe('TemplateBucket');
    });

    test('should have Lambda function as target', () => {
      expect(rule.Properties.Targets).toBeDefined();
      expect(rule.Properties.Targets.length).toBe(1);
      expect(rule.Properties.Targets[0].Arn['Fn::GetAtt']).toEqual(['ValidatorFunction', 'Arn']);
    });

    test('should have target ID', () => {
      expect(rule.Properties.Targets[0].Id).toBe('TemplateValidatorTarget');
    });
  });

  describe('Lambda Permission Resource', () => {
    let permission: any;

    beforeAll(() => {
      permission = template.Resources.EventBridgeInvokePermission;
    });

    test('should exist with correct type', () => {
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
    });

    test('should reference Lambda function', () => {
      expect(permission.Properties.FunctionName).toBeDefined();
      expect(permission.Properties.FunctionName.Ref).toBe('ValidatorFunction');
    });

    test('should grant InvokeFunction action', () => {
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
    });

    test('should have EventBridge principal', () => {
      expect(permission.Properties.Principal).toBe('events.amazonaws.com');
    });

    test('should reference EventBridge rule ARN', () => {
      expect(permission.Properties.SourceArn).toBeDefined();
      expect(permission.Properties.SourceArn['Fn::GetAtt']).toEqual(['ValidationTriggerRule', 'Arn']);
    });
  });

  describe('Stack Outputs', () => {
    test('should have ValidatorFunctionArn output', () => {
      expect(template.Outputs.ValidatorFunctionArn).toBeDefined();
      expect(template.Outputs.ValidatorFunctionArn.Description).toContain('Lambda function');
      expect(template.Outputs.ValidatorFunctionArn.Value['Fn::GetAtt']).toEqual(['ValidatorFunction', 'Arn']);
    });

    test('should have ResultsTableName output', () => {
      expect(template.Outputs.ResultsTableName).toBeDefined();
      expect(template.Outputs.ResultsTableName.Description).toContain('DynamoDB table');
      expect(template.Outputs.ResultsTableName.Value.Ref).toBe('ResultsTable');
    });

    test('should have TemplateBucketName output', () => {
      expect(template.Outputs.TemplateBucketName).toBeDefined();
      expect(template.Outputs.TemplateBucketName.Description).toContain('S3 bucket');
      expect(template.Outputs.TemplateBucketName.Value.Ref).toBe('TemplateBucket');
    });

    test('should have TemplateBucketArn output', () => {
      expect(template.Outputs.TemplateBucketArn).toBeDefined();
      expect(template.Outputs.TemplateBucketArn.Description).toContain('S3 bucket');
      expect(template.Outputs.TemplateBucketArn.Value['Fn::GetAtt']).toEqual(['TemplateBucket', 'Arn']);
    });

    test('outputs should have exports', () => {
      expect(template.Outputs.ValidatorFunctionArn.Export).toBeDefined();
      expect(template.Outputs.ResultsTableName.Export).toBeDefined();
      expect(template.Outputs.TemplateBucketName.Export).toBeDefined();
    });
  });

  describe('Resource Naming Convention', () => {
    test('all named resources should include environmentSuffix', () => {
      const resourcesWithNames = [
        'TemplateBucket',
        'ResultsTable',
        'ValidatorLogGroup',
        'ValidatorRole',
        'ValidatorFunction',
        'ValidationTriggerRule'
      ];

      resourcesWithNames.forEach((resourceName) => {
        const resource = template.Resources[resourceName];
        const nameProperty = resource.Properties.BucketName ||
                            resource.Properties.TableName ||
                            resource.Properties.LogGroupName ||
                            resource.Properties.RoleName ||
                            resource.Properties.FunctionName ||
                            resource.Properties.Name;

        expect(nameProperty).toBeDefined();
        if (nameProperty['Fn::Sub']) {
          expect(nameProperty['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should not have RemovalPolicy Retain', () => {
      Object.keys(template.Resources).forEach((resourceName) => {
        const resource = template.Resources[resourceName];
        expect(resource.DeletionPolicy).not.toBe('Retain');
        expect(resource.UpdateReplacePolicy).not.toBe('Retain');
      });
    });

    test('DynamoDB should not have DeletionProtection enabled', () => {
      const table = template.Resources.ResultsTable;
      expect(table.Properties.DeletionProtectionEnabled).toBe(false);
    });

    test('S3 bucket should have encryption', () => {
      const bucket = template.Resources.TemplateBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('S3 bucket should block public access', () => {
      const bucket = template.Resources.TemplateBucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
    });

    test('IAM role should not have wildcard resources', () => {
      const role = template.Resources.ValidatorRole;
      role.Properties.Policies.forEach((policy: any) => {
        policy.PolicyDocument.Statement.forEach((statement: any) => {
          if (statement.Resource) {
            expect(statement.Resource).not.toBe('*');
          }
        });
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('Lambda should depend on log group', () => {
      const lambda = template.Resources.ValidatorFunction;
      expect(lambda.DependsOn).toBe('ValidatorLogGroup');
    });

    test('Lambda permission should reference correct resources', () => {
      const permission = template.Resources.EventBridgeInvokePermission;
      expect(permission.Properties.FunctionName.Ref).toBe('ValidatorFunction');
      expect(permission.Properties.SourceArn['Fn::GetAtt'][0]).toBe('ValidationTriggerRule');
    });

    test('EventBridge rule should reference S3 bucket', () => {
      const rule = template.Resources.ValidationTriggerRule;
      expect(rule.Properties.EventPattern.detail.bucket.name[0].Ref).toBe('TemplateBucket');
    });
  });
});
