import * as fs from 'fs';
import * as path from 'path';

describe('TapStack CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
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
      expect(template.Parameters.EnvironmentSuffix.Description).toBeDefined();
    });

    test('EnvironmentSuffix should have default value', () => {
      expect(template.Parameters.EnvironmentSuffix.Default).toBeDefined();
      expect(typeof template.Parameters.EnvironmentSuffix.Default).toBe('string');
    });

    test('EnvironmentSuffix should have allowed pattern', () => {
      expect(template.Parameters.EnvironmentSuffix.AllowedPattern).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.AllowedPattern).toBe('[a-z0-9-]+');
    });

    test('EnvironmentSuffix should have constraint description', () => {
      expect(template.Parameters.EnvironmentSuffix.ConstraintDescription).toBeDefined();
    });
  });

  describe('KMS Resources', () => {
    test('should have PriceAlertsKMSKey resource', () => {
      expect(template.Resources.PriceAlertsKMSKey).toBeDefined();
      expect(template.Resources.PriceAlertsKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have proper key policy', () => {
      const kmsKey = template.Resources.PriceAlertsKMSKey;
      expect(kmsKey.Properties.KeyPolicy).toBeDefined();
      expect(kmsKey.Properties.KeyPolicy.Version).toBe('2012-10-17');
      expect(Array.isArray(kmsKey.Properties.KeyPolicy.Statement)).toBe(true);
      expect(kmsKey.Properties.KeyPolicy.Statement.length).toBeGreaterThanOrEqual(3);
    });

    test('KMS key policy should allow root account', () => {
      const kmsKey = template.Resources.PriceAlertsKMSKey;
      const statements = kmsKey.Properties.KeyPolicy.Statement;
      const rootStatement = statements.find((s: any) => s.Sid === 'Enable IAM User Permissions');
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Effect).toBe('Allow');
      expect(rootStatement.Action).toBe('kms:*');
    });

    test('KMS key policy should allow Lambda service', () => {
      const kmsKey = template.Resources.PriceAlertsKMSKey;
      const statements = kmsKey.Properties.KeyPolicy.Statement;
      const lambdaStatement = statements.find((s: any) => s.Sid === 'Allow Lambda to use the key');
      expect(lambdaStatement).toBeDefined();
      expect(lambdaStatement.Principal.Service).toBe('lambda.amazonaws.com');
      expect(lambdaStatement.Action).toContain('kms:Decrypt');
    });

    test('KMS key policy should allow SNS service', () => {
      const kmsKey = template.Resources.PriceAlertsKMSKey;
      const statements = kmsKey.Properties.KeyPolicy.Statement;
      const snsStatement = statements.find((s: any) => s.Sid === 'Allow SNS to use the key');
      expect(snsStatement).toBeDefined();
      expect(snsStatement.Principal.Service).toBe('sns.amazonaws.com');
      expect(snsStatement.Action).toContain('kms:Decrypt');
      expect(snsStatement.Action).toContain('kms:GenerateDataKey');
    });

    test('should have PriceAlertsKMSKeyAlias resource', () => {
      expect(template.Resources.PriceAlertsKMSKeyAlias).toBeDefined();
      expect(template.Resources.PriceAlertsKMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('KMS alias should reference KMS key', () => {
      const alias = template.Resources.PriceAlertsKMSKeyAlias;
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'PriceAlertsKMSKey' });
    });

    test('KMS alias name should include environment suffix', () => {
      const alias = template.Resources.PriceAlertsKMSKeyAlias;
      expect(alias.Properties.AliasName).toEqual({ 'Fn::Sub': 'alias/price-alerts-${EnvironmentSuffix}' });
    });

    test('KMS key should have tags', () => {
      const kmsKey = template.Resources.PriceAlertsKMSKey;
      expect(Array.isArray(kmsKey.Properties.Tags)).toBe(true);
      expect(kmsKey.Properties.Tags.length).toBeGreaterThan(0);
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have PriceAlertsTable resource', () => {
      expect(template.Resources.PriceAlertsTable).toBeDefined();
      expect(template.Resources.PriceAlertsTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('DynamoDB table name should include environment suffix', () => {
      const table = template.Resources.PriceAlertsTable;
      expect(table.Properties.TableName).toEqual({ 'Fn::Sub': 'PriceAlerts-${EnvironmentSuffix}' });
    });

    test('DynamoDB table should have correct attribute definitions', () => {
      const table = template.Resources.PriceAlertsTable;
      expect(Array.isArray(table.Properties.AttributeDefinitions)).toBe(true);
      expect(table.Properties.AttributeDefinitions.length).toBe(2);
      expect(table.Properties.AttributeDefinitions).toContainEqual({
        AttributeName: 'userId',
        AttributeType: 'S'
      });
      expect(table.Properties.AttributeDefinitions).toContainEqual({
        AttributeName: 'alertId',
        AttributeType: 'S'
      });
    });

    test('DynamoDB table should have correct key schema', () => {
      const table = template.Resources.PriceAlertsTable;
      expect(Array.isArray(table.Properties.KeySchema)).toBe(true);
      expect(table.Properties.KeySchema.length).toBe(2);
      expect(table.Properties.KeySchema).toContainEqual({
        AttributeName: 'userId',
        KeyType: 'HASH'
      });
      expect(table.Properties.KeySchema).toContainEqual({
        AttributeName: 'alertId',
        KeyType: 'RANGE'
      });
    });

    test('DynamoDB table should use PAY_PER_REQUEST billing', () => {
      const table = template.Resources.PriceAlertsTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('DynamoDB table should have point-in-time recovery enabled', () => {
      const table = template.Resources.PriceAlertsTable;
      expect(table.Properties.PointInTimeRecoverySpecification).toBeDefined();
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('DynamoDB table should have tags', () => {
      const table = template.Resources.PriceAlertsTable;
      expect(Array.isArray(table.Properties.Tags)).toBe(true);
      expect(table.Properties.Tags.length).toBeGreaterThan(0);
    });
  });

  describe('SNS Resources', () => {
    test('should have PriceAlertNotificationsTopic resource', () => {
      expect(template.Resources.PriceAlertNotificationsTopic).toBeDefined();
      expect(template.Resources.PriceAlertNotificationsTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('SNS topic name should include environment suffix', () => {
      const topic = template.Resources.PriceAlertNotificationsTopic;
      expect(topic.Properties.TopicName).toEqual({ 'Fn::Sub': 'PriceAlertNotifications-${EnvironmentSuffix}' });
    });

    test('SNS topic should use KMS encryption', () => {
      const topic = template.Resources.PriceAlertNotificationsTopic;
      expect(topic.Properties.KmsMasterKeyId).toEqual({ Ref: 'PriceAlertsKMSKey' });
    });

    test('SNS topic should have tags', () => {
      const topic = template.Resources.PriceAlertNotificationsTopic;
      expect(Array.isArray(topic.Properties.Tags)).toBe(true);
      expect(topic.Properties.Tags.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Logs Resources', () => {
    test('should have ProcessPriceChecksLogGroup resource', () => {
      expect(template.Resources.ProcessPriceChecksLogGroup).toBeDefined();
      expect(template.Resources.ProcessPriceChecksLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('log group name should include environment suffix', () => {
      const logGroup = template.Resources.ProcessPriceChecksLogGroup;
      expect(logGroup.Properties.LogGroupName).toEqual({ 'Fn::Sub': '/aws/lambda/ProcessPriceChecks-${EnvironmentSuffix}' });
    });

    test('log group should have retention configured', () => {
      const logGroup = template.Resources.ProcessPriceChecksLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBeDefined();
      expect(typeof logGroup.Properties.RetentionInDays).toBe('number');
      expect(logGroup.Properties.RetentionInDays).toBeGreaterThan(0);
    });

    test('log group should have tags', () => {
      const logGroup = template.Resources.ProcessPriceChecksLogGroup;
      expect(Array.isArray(logGroup.Properties.Tags)).toBe(true);
      expect(logGroup.Properties.Tags.length).toBeGreaterThan(0);
    });
  });

  describe('IAM Resources', () => {
    test('should have ProcessPriceChecksExecutionRole resource', () => {
      expect(template.Resources.ProcessPriceChecksExecutionRole).toBeDefined();
      expect(template.Resources.ProcessPriceChecksExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('IAM role name should include environment suffix', () => {
      const role = template.Resources.ProcessPriceChecksExecutionRole;
      expect(role.Properties.RoleName).toEqual({ 'Fn::Sub': 'ProcessPriceChecksRole-${EnvironmentSuffix}' });
    });

    test('IAM role should have Lambda trust policy', () => {
      const role = template.Resources.ProcessPriceChecksExecutionRole;
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      expect(role.Properties.AssumeRolePolicyDocument.Version).toBe('2012-10-17');
      const statements = role.Properties.AssumeRolePolicyDocument.Statement;
      expect(Array.isArray(statements)).toBe(true);
      expect(statements[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(statements[0].Action).toBe('sts:AssumeRole');
    });

    test('IAM role should have basic execution managed policy', () => {
      const role = template.Resources.ProcessPriceChecksExecutionRole;
      expect(Array.isArray(role.Properties.ManagedPolicyArns)).toBe(true);
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
    });

    test('IAM role should have DynamoDB access policy', () => {
      const role = template.Resources.ProcessPriceChecksExecutionRole;
      const policies = role.Properties.Policies;
      const dynamoPolicy = policies.find((p: any) => p.PolicyName === 'DynamoDBAccess');
      expect(dynamoPolicy).toBeDefined();
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:GetItem');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:Query');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:Scan');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:PutItem');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:UpdateItem');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:DeleteItem');
    });

    test('IAM role should have SNS publish policy', () => {
      const role = template.Resources.ProcessPriceChecksExecutionRole;
      const policies = role.Properties.Policies;
      const snsPolicy = policies.find((p: any) => p.PolicyName === 'SNSPublishAccess');
      expect(snsPolicy).toBeDefined();
      expect(snsPolicy.PolicyDocument.Statement[0].Action).toBe('sns:Publish');
    });

    test('IAM role should have KMS decrypt policy', () => {
      const role = template.Resources.ProcessPriceChecksExecutionRole;
      const policies = role.Properties.Policies;
      const kmsPolicy = policies.find((p: any) => p.PolicyName === 'KMSDecryptAccess');
      expect(kmsPolicy).toBeDefined();
      expect(kmsPolicy.PolicyDocument.Statement[0].Action).toContain('kms:Decrypt');
      expect(kmsPolicy.PolicyDocument.Statement[0].Action).toContain('kms:DescribeKey');
    });

    test('IAM role should have CloudWatch Logs policy', () => {
      const role = template.Resources.ProcessPriceChecksExecutionRole;
      const policies = role.Properties.Policies;
      const logsPolicy = policies.find((p: any) => p.PolicyName === 'CloudWatchLogsAccess');
      expect(logsPolicy).toBeDefined();
      expect(logsPolicy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogStream');
      expect(logsPolicy.PolicyDocument.Statement[0].Action).toContain('logs:PutLogEvents');
    });

    test('IAM role should have tags', () => {
      const role = template.Resources.ProcessPriceChecksExecutionRole;
      expect(Array.isArray(role.Properties.Tags)).toBe(true);
      expect(role.Properties.Tags.length).toBeGreaterThan(0);
    });
  });

  describe('Lambda Resources', () => {
    test('should have ProcessPriceChecksFunction resource', () => {
      expect(template.Resources.ProcessPriceChecksFunction).toBeDefined();
      expect(template.Resources.ProcessPriceChecksFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda function name should include environment suffix', () => {
      const lambda = template.Resources.ProcessPriceChecksFunction;
      expect(lambda.Properties.FunctionName).toEqual({ 'Fn::Sub': 'ProcessPriceChecks-${EnvironmentSuffix}' });
    });

    test('Lambda should depend on log group', () => {
      const lambda = template.Resources.ProcessPriceChecksFunction;
      expect(lambda.DependsOn).toBe('ProcessPriceChecksLogGroup');
    });

    test('Lambda should have correct handler', () => {
      const lambda = template.Resources.ProcessPriceChecksFunction;
      expect(lambda.Properties.Handler).toBe('index.handler');
    });

    test('Lambda should use arm64 architecture', () => {
      const lambda = template.Resources.ProcessPriceChecksFunction;
      expect(Array.isArray(lambda.Properties.Architectures)).toBe(true);
      expect(lambda.Properties.Architectures).toContain('arm64');
    });

    test('Lambda should have correct memory size', () => {
      const lambda = template.Resources.ProcessPriceChecksFunction;
      expect(lambda.Properties.MemorySize).toBe(512);
    });

    test('Lambda should have correct timeout', () => {
      const lambda = template.Resources.ProcessPriceChecksFunction;
      expect(lambda.Properties.Timeout).toBe(60);
    });

    test('Lambda should NOT have ReservedConcurrentExecutions', () => {
      const lambda = template.Resources.ProcessPriceChecksFunction;
      expect(lambda.Properties.ReservedConcurrentExecutions).toBeUndefined();
    });

    test('Lambda should have inline code', () => {
      const lambda = template.Resources.ProcessPriceChecksFunction;
      expect(lambda.Properties.Code).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(typeof lambda.Properties.Code.ZipFile).toBe('string');
      expect(lambda.Properties.Code.ZipFile.length).toBeGreaterThan(0);
    });

    test('Lambda should reference execution role', () => {
      const lambda = template.Resources.ProcessPriceChecksFunction;
      expect(lambda.Properties.Role).toEqual({ 'Fn::GetAtt': ['ProcessPriceChecksExecutionRole', 'Arn'] });
    });

    test('Lambda should have environment variables', () => {
      const lambda = template.Resources.ProcessPriceChecksFunction;
      expect(lambda.Properties.Environment).toBeDefined();
      expect(lambda.Properties.Environment.Variables).toBeDefined();
      expect(lambda.Properties.Environment.Variables.DYNAMODB_TABLE_NAME).toEqual({ Ref: 'PriceAlertsTable' });
      expect(lambda.Properties.Environment.Variables.SNS_TOPIC_ARN).toEqual({ Ref: 'PriceAlertNotificationsTopic' });
      expect(lambda.Properties.Environment.Variables.KMS_KEY_ID).toEqual({ Ref: 'PriceAlertsKMSKey' });
    });

    test('Lambda should use KMS encryption', () => {
      const lambda = template.Resources.ProcessPriceChecksFunction;
      expect(lambda.Properties.KmsKeyArn).toEqual({ 'Fn::GetAtt': ['PriceAlertsKMSKey', 'Arn'] });
    });

    test('Lambda should have tags', () => {
      const lambda = template.Resources.ProcessPriceChecksFunction;
      expect(Array.isArray(lambda.Properties.Tags)).toBe(true);
      expect(lambda.Properties.Tags.length).toBeGreaterThan(0);
    });
  });

  describe('Outputs', () => {
    test('should have LambdaFunctionArn output', () => {
      expect(template.Outputs.LambdaFunctionArn).toBeDefined();
      expect(template.Outputs.LambdaFunctionArn.Description).toBeDefined();
      expect(template.Outputs.LambdaFunctionArn.Value).toEqual({ 'Fn::GetAtt': ['ProcessPriceChecksFunction', 'Arn'] });
      expect(template.Outputs.LambdaFunctionArn.Export).toBeDefined();
    });

    test('should have DynamoDBTableName output', () => {
      expect(template.Outputs.DynamoDBTableName).toBeDefined();
      expect(template.Outputs.DynamoDBTableName.Description).toBeDefined();
      expect(template.Outputs.DynamoDBTableName.Value).toEqual({ Ref: 'PriceAlertsTable' });
      expect(template.Outputs.DynamoDBTableName.Export).toBeDefined();
    });

    test('should have SNSTopicArn output', () => {
      expect(template.Outputs.SNSTopicArn).toBeDefined();
      expect(template.Outputs.SNSTopicArn.Description).toBeDefined();
      expect(template.Outputs.SNSTopicArn.Value).toEqual({ Ref: 'PriceAlertNotificationsTopic' });
      expect(template.Outputs.SNSTopicArn.Export).toBeDefined();
    });

    test('should have KMSKeyArn output', () => {
      expect(template.Outputs.KMSKeyArn).toBeDefined();
      expect(template.Outputs.KMSKeyArn.Description).toBeDefined();
      expect(template.Outputs.KMSKeyArn.Value).toEqual({ 'Fn::GetAtt': ['PriceAlertsKMSKey', 'Arn'] });
      expect(template.Outputs.KMSKeyArn.Export).toBeDefined();
    });

    test('should have LambdaExecutionRoleArn output', () => {
      expect(template.Outputs.LambdaExecutionRoleArn).toBeDefined();
      expect(template.Outputs.LambdaExecutionRoleArn.Description).toBeDefined();
      expect(template.Outputs.LambdaExecutionRoleArn.Value).toEqual({ 'Fn::GetAtt': ['ProcessPriceChecksExecutionRole', 'Arn'] });
      expect(template.Outputs.LambdaExecutionRoleArn.Export).toBeDefined();
    });

    test('all outputs should have export names with stack name', () => {
      const outputs = Object.values(template.Outputs);
      outputs.forEach((output: any) => {
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
      });
    });
  });

  describe('Resource Naming and Environment Suffix', () => {
    test('all resource names should include environment suffix', () => {
      const resourcesWithNames = [
        'PriceAlertsTable',
        'PriceAlertNotificationsTopic',
        'ProcessPriceChecksLogGroup',
        'ProcessPriceChecksExecutionRole',
        'ProcessPriceChecksFunction',
        'PriceAlertsKMSKeyAlias'
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const nameProperty = resource.Properties.TableName ||
          resource.Properties.TopicName ||
          resource.Properties.LogGroupName ||
          resource.Properties.RoleName ||
          resource.Properties.FunctionName ||
          resource.Properties.AliasName;

        expect(nameProperty).toBeDefined();
        expect(nameProperty['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });
  });

  describe('Security and Best Practices', () => {
    test('all resources with tags should have Environment and Service tags', () => {
      const resourcesWithTags = Object.keys(template.Resources).filter(key => {
        return template.Resources[key].Properties.Tags !== undefined;
      });

      resourcesWithTags.forEach(resourceName => {
        const tags = template.Resources[resourceName].Properties.Tags;
        const tagKeys = tags.map((t: any) => t.Key);
        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('Service');
      });
    });

    test('Lambda function should not have reserved concurrency that exceeds limits', () => {
      const lambda = template.Resources.ProcessPriceChecksFunction;
      if (lambda.Properties.ReservedConcurrentExecutions !== undefined) {
        expect(lambda.Properties.ReservedConcurrentExecutions).toBeLessThanOrEqual(10);
      }
    });

    test('all policies should follow least privilege principle', () => {
      const role = template.Resources.ProcessPriceChecksExecutionRole;
      const policies = role.Properties.Policies;

      // Check that policies have specific resources (not *)
      const dynamoPolicy = policies.find((p: any) => p.PolicyName === 'DynamoDBAccess');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Resource).toEqual({ 'Fn::GetAtt': ['PriceAlertsTable', 'Arn'] });

      const snsPolicy = policies.find((p: any) => p.PolicyName === 'SNSPublishAccess');
      expect(snsPolicy.PolicyDocument.Statement[0].Resource).toEqual({ Ref: 'PriceAlertNotificationsTopic' });

      const kmsPolicy = policies.find((p: any) => p.PolicyName === 'KMSDecryptAccess');
      expect(kmsPolicy.PolicyDocument.Statement[0].Resource).toEqual({ 'Fn::GetAtt': ['PriceAlertsKMSKey', 'Arn'] });
    });

    test('SNS topic should be encrypted', () => {
      const topic = template.Resources.PriceAlertNotificationsTopic;
      expect(topic.Properties.KmsMasterKeyId).toBeDefined();
    });

    test('Lambda environment variables should be encrypted', () => {
      const lambda = template.Resources.ProcessPriceChecksFunction;
      expect(lambda.Properties.KmsKeyArn).toBeDefined();
    });

    test('DynamoDB table should have point-in-time recovery', () => {
      const table = template.Resources.PriceAlertsTable;
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });
  });
});
