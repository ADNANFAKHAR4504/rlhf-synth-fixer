import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Multi-Region Disaster Recovery', () => {
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
      expect(template.Description).toContain('Multi-Region Disaster Recovery');
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
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('prod');
    });

    test('should have SecondaryRegion parameter', () => {
      expect(template.Parameters.SecondaryRegion).toBeDefined();
      expect(template.Parameters.SecondaryRegion.Type).toBe('String');
      expect(template.Parameters.SecondaryRegion.Default).toBe('us-west-2');
      expect(template.Parameters.SecondaryRegion.AllowedValues).toContain('us-west-2');
    });
  });

  describe('KMS Resources', () => {
    test('should have TransactionKMSKey resource', () => {
      expect(template.Resources.TransactionKMSKey).toBeDefined();
      expect(template.Resources.TransactionKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('TransactionKMSKey should have key rotation enabled', () => {
      const key = template.Resources.TransactionKMSKey;
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });

    test('TransactionKMSKey should have proper key policy', () => {
      const key = template.Resources.TransactionKMSKey;
      expect(key.Properties.KeyPolicy).toBeDefined();
      expect(key.Properties.KeyPolicy.Version).toBe('2012-10-17');
      expect(key.Properties.KeyPolicy.Statement).toBeInstanceOf(Array);
      expect(key.Properties.KeyPolicy.Statement.length).toBeGreaterThan(0);
    });

    test('TransactionKMSKey should allow DynamoDB service access', () => {
      const key = template.Resources.TransactionKMSKey;
      const statements = key.Properties.KeyPolicy.Statement;
      const dynamoDbStatement = statements.find(
        (stmt: any) => stmt.Sid === 'Allow DynamoDB to use the key'
      );
      expect(dynamoDbStatement).toBeDefined();
      expect(dynamoDbStatement.Principal.Service).toBe('dynamodb.amazonaws.com');
    });

    test('TransactionKMSKey should allow S3 service access', () => {
      const key = template.Resources.TransactionKMSKey;
      const statements = key.Properties.KeyPolicy.Statement;
      const s3Statement = statements.find(
        (stmt: any) => stmt.Sid === 'Allow S3 to use the key'
      );
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Principal.Service).toBe('s3.amazonaws.com');
    });

    test('TransactionKMSKey should allow Lambda service access', () => {
      const key = template.Resources.TransactionKMSKey;
      const statements = key.Properties.KeyPolicy.Statement;
      const lambdaStatement = statements.find(
        (stmt: any) => stmt.Sid === 'Allow Lambda to use the key'
      );
      expect(lambdaStatement).toBeDefined();
      expect(lambdaStatement.Principal.Service).toBe('lambda.amazonaws.com');
    });

    test('TransactionKMSKey should allow CloudWatch Logs service access', () => {
      const key = template.Resources.TransactionKMSKey;
      const statements = key.Properties.KeyPolicy.Statement;
      const logsStatement = statements.find(
        (stmt: any) => stmt.Sid === 'Allow CloudWatch Logs'
      );
      expect(logsStatement).toBeDefined();
    });

    test('TransactionKMSKey should include environment suffix in tags', () => {
      const key = template.Resources.TransactionKMSKey;
      expect(key.Properties.Tags).toBeInstanceOf(Array);
      const envTag = key.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
    });

    test('should have TransactionKMSAlias resource', () => {
      expect(template.Resources.TransactionKMSAlias).toBeDefined();
      expect(template.Resources.TransactionKMSAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('TransactionKMSAlias should reference the KMS key', () => {
      const alias = template.Resources.TransactionKMSAlias;
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'TransactionKMSKey' });
    });

    test('TransactionKMSAlias should include environment suffix', () => {
      const alias = template.Resources.TransactionKMSAlias;
      expect(alias.Properties.AliasName).toEqual({
        'Fn::Sub': 'alias/transaction-encryption-${EnvironmentSuffix}'
      });
    });
  });

  describe('DynamoDB Global Table', () => {
    test('should have TransactionDynamoDBTable resource', () => {
      expect(template.Resources.TransactionDynamoDBTable).toBeDefined();
      expect(template.Resources.TransactionDynamoDBTable.Type).toBe(
        'AWS::DynamoDB::GlobalTable'
      );
    });

    test('TransactionDynamoDBTable should have PAY_PER_REQUEST billing', () => {
      const table = template.Resources.TransactionDynamoDBTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('TransactionDynamoDBTable should have proper attribute definitions', () => {
      const table = template.Resources.TransactionDynamoDBTable;
      expect(table.Properties.AttributeDefinitions).toHaveLength(3);
      const attrNames = table.Properties.AttributeDefinitions.map(
        (attr: any) => attr.AttributeName
      );
      expect(attrNames).toContain('transactionId');
      expect(attrNames).toContain('timestamp');
      expect(attrNames).toContain('customerId');
    });

    test('TransactionDynamoDBTable should have correct key schema', () => {
      const table = template.Resources.TransactionDynamoDBTable;
      expect(table.Properties.KeySchema).toHaveLength(2);
      const hashKey = table.Properties.KeySchema.find(
        (key: any) => key.KeyType === 'HASH'
      );
      const rangeKey = table.Properties.KeySchema.find(
        (key: any) => key.KeyType === 'RANGE'
      );
      expect(hashKey.AttributeName).toBe('transactionId');
      expect(rangeKey.AttributeName).toBe('timestamp');
    });

    test('TransactionDynamoDBTable should have CustomerIndex GSI', () => {
      const table = template.Resources.TransactionDynamoDBTable;
      expect(table.Properties.GlobalSecondaryIndexes).toHaveLength(1);
      expect(table.Properties.GlobalSecondaryIndexes[0].IndexName).toBe('CustomerIndex');
    });

    test('TransactionDynamoDBTable should have KMS encryption enabled', () => {
      const table = template.Resources.TransactionDynamoDBTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(table.Properties.SSESpecification.SSEType).toBe('KMS');
    });

    test('TransactionDynamoDBTable should have stream enabled', () => {
      const table = template.Resources.TransactionDynamoDBTable;
      expect(table.Properties.StreamSpecification).toBeDefined();
      expect(table.Properties.StreamSpecification.StreamViewType).toBe(
        'NEW_AND_OLD_IMAGES'
      );
    });

    test('TransactionDynamoDBTable should have replicas in two regions', () => {
      const table = template.Resources.TransactionDynamoDBTable;
      expect(table.Properties.Replicas).toHaveLength(2);
    });

    test('TransactionDynamoDBTable replicas should have point-in-time recovery enabled', () => {
      const table = template.Resources.TransactionDynamoDBTable;
      table.Properties.Replicas.forEach((replica: any) => {
        expect(
          replica.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled
        ).toBe(true);
      });
    });

    test('TransactionDynamoDBTable should include environment suffix in name', () => {
      const table = template.Resources.TransactionDynamoDBTable;
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': 'transactions-${EnvironmentSuffix}'
      });
    });
  });

  describe('S3 Bucket', () => {
    test('should have TransactionDocumentsBucket resource', () => {
      expect(template.Resources.TransactionDocumentsBucket).toBeDefined();
      expect(template.Resources.TransactionDocumentsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('TransactionDocumentsBucket should have versioning enabled', () => {
      const bucket = template.Resources.TransactionDocumentsBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('TransactionDocumentsBucket should have KMS encryption', () => {
      const bucket = template.Resources.TransactionDocumentsBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      const encryption =
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.BucketKeyEnabled).toBe(true);
    });

    test('TransactionDocumentsBucket should block all public access', () => {
      const bucket = template.Resources.TransactionDocumentsBucket;
      const publicAccessConfig = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessConfig.BlockPublicAcls).toBe(true);
      expect(publicAccessConfig.BlockPublicPolicy).toBe(true);
      expect(publicAccessConfig.IgnorePublicAcls).toBe(true);
      expect(publicAccessConfig.RestrictPublicBuckets).toBe(true);
    });

    test('TransactionDocumentsBucket should include environment suffix and region in name', () => {
      const bucket = template.Resources.TransactionDocumentsBucket;
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'transaction-documents-${EnvironmentSuffix}-${AWS::Region}'
      });
    });

    test('TransactionDocumentsBucket should have proper tags', () => {
      const bucket = template.Resources.TransactionDocumentsBucket;
      expect(bucket.Properties.Tags).toBeInstanceOf(Array);
      const nameTag = bucket.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
    });
  });

  describe('IAM Roles', () => {
    test('should have LambdaExecutionRole resource', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('LambdaExecutionRole should have proper assume role policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Version).toBe('2012-10-17');
      const statement = assumePolicy.Statement[0];
      expect(statement.Principal.Service).toBe('lambda.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });

    test('LambdaExecutionRole should have AWSLambdaBasicExecutionRole managed policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
    });

    test('LambdaExecutionRole should have DynamoDB permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const txPolicy = policies.find(
        (p: any) => p.PolicyName === 'TransactionProcessingPolicy'
      );
      expect(txPolicy).toBeDefined();
      const dynamoStatement = txPolicy.PolicyDocument.Statement.find((stmt: any) =>
        stmt.Action.includes('dynamodb:PutItem')
      );
      expect(dynamoStatement).toBeDefined();
    });

    test('LambdaExecutionRole should have S3 permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const txPolicy = policies[0];
      const s3Statement = txPolicy.PolicyDocument.Statement.find((stmt: any) =>
        stmt.Action.includes('s3:GetObject')
      );
      expect(s3Statement).toBeDefined();
    });

    test('LambdaExecutionRole should have KMS permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const txPolicy = policies[0];
      const kmsStatement = txPolicy.PolicyDocument.Statement.find((stmt: any) =>
        stmt.Action.includes('kms:Decrypt')
      );
      expect(kmsStatement).toBeDefined();
    });

    test('LambdaExecutionRole should have SNS permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const txPolicy = policies[0];
      const snsStatement = txPolicy.PolicyDocument.Statement.find((stmt: any) =>
        stmt.Action.includes('sns:Publish')
      );
      expect(snsStatement).toBeDefined();
    });

    test('LambdaExecutionRole should include environment suffix in name', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.RoleName).toEqual({
        'Fn::Sub': 'transaction-lambda-role-${EnvironmentSuffix}-${AWS::Region}'
      });
    });

    test('should have CrossRegionAssumeRole resource', () => {
      expect(template.Resources.CrossRegionAssumeRole).toBeDefined();
      expect(template.Resources.CrossRegionAssumeRole.Type).toBe('AWS::IAM::Role');
    });

    test('CrossRegionAssumeRole should have external ID condition', () => {
      const role = template.Resources.CrossRegionAssumeRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      const statement = assumePolicy.Statement[0];
      expect(statement.Condition).toBeDefined();
      expect(statement.Condition.StringEquals).toBeDefined();
    });

    test('CrossRegionAssumeRole should have cross-region permissions', () => {
      const role = template.Resources.CrossRegionAssumeRole;
      const policies = role.Properties.Policies;
      expect(policies).toHaveLength(1);
      const policy = policies[0];
      expect(policy.PolicyName).toBe('CrossRegionAccessPolicy');
    });
  });

  describe('Lambda Function', () => {
    test('should have TransactionProcessorFunction resource', () => {
      expect(template.Resources.TransactionProcessorFunction).toBeDefined();
      expect(template.Resources.TransactionProcessorFunction.Type).toBe(
        'AWS::Lambda::Function'
      );
    });

    test('TransactionProcessorFunction should have correct runtime', () => {
      const func = template.Resources.TransactionProcessorFunction;
      expect(func.Properties.Runtime).toBe('python3.11');
    });

    test('TransactionProcessorFunction should have correct handler', () => {
      const func = template.Resources.TransactionProcessorFunction;
      expect(func.Properties.Handler).toBe('index.lambda_handler');
    });

    test('TransactionProcessorFunction should reference LambdaExecutionRole', () => {
      const func = template.Resources.TransactionProcessorFunction;
      expect(func.Properties.Role).toEqual({
        'Fn::GetAtt': ['LambdaExecutionRole', 'Arn']
      });
    });

    test('TransactionProcessorFunction should have inline code', () => {
      const func = template.Resources.TransactionProcessorFunction;
      expect(func.Properties.Code.ZipFile).toBeDefined();
      expect(typeof func.Properties.Code.ZipFile).toBe('string');
    });

    test('TransactionProcessorFunction should have environment variables', () => {
      const func = template.Resources.TransactionProcessorFunction;
      expect(func.Properties.Environment).toBeDefined();
      expect(func.Properties.Environment.Variables).toBeDefined();
      expect(func.Properties.Environment.Variables.ENVIRONMENT_SUFFIX).toBeDefined();
      expect(func.Properties.Environment.Variables.BUCKET_NAME).toBeDefined();
      expect(func.Properties.Environment.Variables.SNS_TOPIC_ARN).toBeDefined();
      expect(func.Properties.Environment.Variables.TABLE_NAME).toBeDefined();
    });

    test('TransactionProcessorFunction should have appropriate timeout', () => {
      const func = template.Resources.TransactionProcessorFunction;
      expect(func.Properties.Timeout).toBe(30);
    });

    test('TransactionProcessorFunction should have appropriate memory size', () => {
      const func = template.Resources.TransactionProcessorFunction;
      expect(func.Properties.MemorySize).toBe(512);
    });

    test('TransactionProcessorFunction should have KMS encryption', () => {
      const func = template.Resources.TransactionProcessorFunction;
      expect(func.Properties.KmsKeyArn).toEqual({
        'Fn::GetAtt': ['TransactionKMSKey', 'Arn']
      });
    });

    test('TransactionProcessorFunction should include environment suffix in name', () => {
      const func = template.Resources.TransactionProcessorFunction;
      expect(func.Properties.FunctionName).toEqual({
        'Fn::Sub': 'transaction-processor-${EnvironmentSuffix}'
      });
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have TransactionProcessorLogGroup resource', () => {
      expect(template.Resources.TransactionProcessorLogGroup).toBeDefined();
      expect(template.Resources.TransactionProcessorLogGroup.Type).toBe(
        'AWS::Logs::LogGroup'
      );
    });

    test('TransactionProcessorLogGroup should have 30 day retention', () => {
      const logGroup = template.Resources.TransactionProcessorLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('TransactionProcessorLogGroup should have KMS encryption', () => {
      const logGroup = template.Resources.TransactionProcessorLogGroup;
      expect(logGroup.Properties.KmsKeyId).toEqual({
        'Fn::GetAtt': ['TransactionKMSKey', 'Arn']
      });
    });

    test('TransactionProcessorLogGroup should match Lambda function name', () => {
      const logGroup = template.Resources.TransactionProcessorLogGroup;
      expect(logGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/lambda/transaction-processor-${EnvironmentSuffix}'
      });
    });

    test('should have DynamoDBThrottleAlarm resource', () => {
      expect(template.Resources.DynamoDBThrottleAlarm).toBeDefined();
      expect(template.Resources.DynamoDBThrottleAlarm.Type).toBe(
        'AWS::CloudWatch::Alarm'
      );
    });

    test('DynamoDBThrottleAlarm should monitor UserErrors metric', () => {
      const alarm = template.Resources.DynamoDBThrottleAlarm;
      expect(alarm.Properties.MetricName).toBe('UserErrors');
      expect(alarm.Properties.Namespace).toBe('AWS/DynamoDB');
    });

    test('DynamoDBThrottleAlarm should have SNS action', () => {
      const alarm = template.Resources.DynamoDBThrottleAlarm;
      expect(alarm.Properties.AlarmActions).toHaveLength(1);
      expect(alarm.Properties.AlarmActions[0]).toEqual({ Ref: 'AlertSNSTopic' });
    });

    test('should have LambdaErrorAlarm resource', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
      expect(template.Resources.LambdaErrorAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('LambdaErrorAlarm should monitor Errors metric', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
    });

    test('should have LambdaThrottleAlarm resource', () => {
      expect(template.Resources.LambdaThrottleAlarm).toBeDefined();
      expect(template.Resources.LambdaThrottleAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('LambdaThrottleAlarm should monitor Throttles metric', () => {
      const alarm = template.Resources.LambdaThrottleAlarm;
      expect(alarm.Properties.MetricName).toBe('Throttles');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
    });
  });

  describe('SNS Resources', () => {
    test('should have AlertSNSTopic resource', () => {
      expect(template.Resources.AlertSNSTopic).toBeDefined();
      expect(template.Resources.AlertSNSTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('AlertSNSTopic should have KMS encryption', () => {
      const topic = template.Resources.AlertSNSTopic;
      expect(topic.Properties.KmsMasterKeyId).toEqual({ Ref: 'TransactionKMSKey' });
    });

    test('AlertSNSTopic should have display name', () => {
      const topic = template.Resources.AlertSNSTopic;
      expect(topic.Properties.DisplayName).toBe('Transaction Processing Alerts');
    });

    test('AlertSNSTopic should include environment suffix in name', () => {
      const topic = template.Resources.AlertSNSTopic;
      expect(topic.Properties.TopicName).toEqual({
        'Fn::Sub': 'transaction-alerts-${EnvironmentSuffix}'
      });
    });
  });

  describe('Route 53 Resources', () => {
    // Route 53 resources have been removed from the template
  });

  describe('Outputs', () => {
    test('should have PrimaryRegion output', () => {
      expect(template.Outputs.PrimaryRegion).toBeDefined();
      expect(template.Outputs.PrimaryRegion.Value).toEqual({ Ref: 'AWS::Region' });
    });

    test('should have SecondaryRegion output', () => {
      expect(template.Outputs.SecondaryRegion).toBeDefined();
      expect(template.Outputs.SecondaryRegion.Value).toEqual({
        Ref: 'SecondaryRegion'
      });
    });

    test('should have DynamoDBTableName output', () => {
      expect(template.Outputs.DynamoDBTableName).toBeDefined();
      expect(template.Outputs.DynamoDBTableName.Value).toEqual({
        Ref: 'TransactionDynamoDBTable'
      });
    });

    test('should have DynamoDBTableArn output', () => {
      expect(template.Outputs.DynamoDBTableArn).toBeDefined();
      expect(template.Outputs.DynamoDBTableArn.Value).toEqual({
        'Fn::GetAtt': ['TransactionDynamoDBTable', 'Arn']
      });
    });

    test('should have S3BucketName output', () => {
      expect(template.Outputs.S3BucketName).toBeDefined();
      expect(template.Outputs.S3BucketName.Value).toEqual({
        Ref: 'TransactionDocumentsBucket'
      });
    });

    test('should have S3BucketArn output', () => {
      expect(template.Outputs.S3BucketArn).toBeDefined();
      expect(template.Outputs.S3BucketArn.Value).toEqual({
        'Fn::GetAtt': ['TransactionDocumentsBucket', 'Arn']
      });
    });

    test('should have LambdaFunctionName output', () => {
      expect(template.Outputs.LambdaFunctionName).toBeDefined();
      expect(template.Outputs.LambdaFunctionName.Value).toEqual({
        Ref: 'TransactionProcessorFunction'
      });
    });

    test('should have LambdaFunctionArn output', () => {
      expect(template.Outputs.LambdaFunctionArn).toBeDefined();
      expect(template.Outputs.LambdaFunctionArn.Value).toEqual({
        'Fn::GetAtt': ['TransactionProcessorFunction', 'Arn']
      });
    });

    test('should have KMSKeyId output', () => {
      expect(template.Outputs.KMSKeyId).toBeDefined();
      expect(template.Outputs.KMSKeyId.Value).toEqual({ Ref: 'TransactionKMSKey' });
    });

    test('should have KMSKeyArn output', () => {
      expect(template.Outputs.KMSKeyArn).toBeDefined();
      expect(template.Outputs.KMSKeyArn.Value).toEqual({
        'Fn::GetAtt': ['TransactionKMSKey', 'Arn']
      });
    });

    test('should have SNSTopicArn output', () => {
      expect(template.Outputs.SNSTopicArn).toBeDefined();
      expect(template.Outputs.SNSTopicArn.Value).toEqual({ Ref: 'AlertSNSTopic' });
    });

    test('should have PrimaryEndpoint output', () => {
      expect(template.Outputs.PrimaryEndpoint).toBeDefined();
    });

    test('should have CrossRegionRoleArn output', () => {
      expect(template.Outputs.CrossRegionRoleArn).toBeDefined();
      expect(template.Outputs.CrossRegionRoleArn.Value).toEqual({
        'Fn::GetAtt': ['CrossRegionAssumeRole', 'Arn']
      });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Description).toBeDefined();
        expect(template.Outputs[outputKey].Description.length).toBeGreaterThan(0);
      });
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Export).toBeDefined();
        expect(template.Outputs[outputKey].Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all IAM roles should include environment suffix', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Type === 'AWS::IAM::Role') {
          const roleName = resource.Properties.RoleName;
          expect(roleName).toBeDefined();
          expect(JSON.stringify(roleName)).toContain('EnvironmentSuffix');
        }
      });
    });

    test('all resource tags should include Environment tag (where applicable)', () => {
      const tagsExpectedTypes = [
        'AWS::KMS::Key',
        'AWS::S3::Bucket',
        'AWS::Lambda::Function',
        'AWS::SNS::Topic'
      ];
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Properties.Tags && tagsExpectedTypes.includes(resource.Type)) {
          const envTag = resource.Properties.Tags.find(
            (tag: any) => tag.Key === 'Environment'
          );
          expect(envTag).toBeDefined();
        }
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have 12 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(12);
    });

    test('should have 2 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2);
    });

    test('should have 13 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(13);
    });

    test('all resource references should be valid', () => {
      const resourceNames = Object.keys(template.Resources);
      const checkReferences = (obj: any) => {
        if (typeof obj === 'object' && obj !== null) {
          if (obj.Ref && !template.Parameters[obj.Ref] && obj.Ref.indexOf('AWS::') !== 0) {
            expect(resourceNames).toContain(obj.Ref);
          }
          if (obj['Fn::GetAtt']) {
            const resourceName = Array.isArray(obj['Fn::GetAtt'])
              ? obj['Fn::GetAtt'][0]
              : obj['Fn::GetAtt'];
            if (typeof resourceName === 'string') {
              expect(resourceNames).toContain(resourceName);
            }
          }
          Object.values(obj).forEach(value => checkReferences(value));
        }
      };
      checkReferences(template);
    });
  });
});
