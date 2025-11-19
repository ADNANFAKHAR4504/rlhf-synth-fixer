import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Secure Transaction Processing Pipeline', () => {
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

    test('should have a description for secure transaction processing', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Secure Transaction Processing Pipeline');
      expect(template.Description).toContain('KMS encryption');
      expect(template.Description).toContain('VPC isolation');
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
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(20);
      expect(param.AllowedPattern).toBe('[a-zA-Z0-9-]*');
    });

    test('should have EnableTerminationProtection parameter', () => {
      expect(template.Parameters.EnableTerminationProtection).toBeDefined();
      const param = template.Parameters.EnableTerminationProtection;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('false');
      expect(param.AllowedValues).toEqual(['true', 'false']);
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR and DNS settings', () => {
      const vpc = template.Resources.VPC.Properties;
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    test('should have three private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();
    });

    test('private subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(template.Resources.PrivateSubnet3.Properties.CidrBlock).toBe('10.0.3.0/24');
    });

    test('private subnets should span different availability zones', () => {
      const subnet1 = template.Resources.PrivateSubnet1.Properties.AvailabilityZone;
      const subnet2 = template.Resources.PrivateSubnet2.Properties.AvailabilityZone;
      const subnet3 = template.Resources.PrivateSubnet3.Properties.AvailabilityZone;

      expect(subnet1).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(subnet2).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
      expect(subnet3).toEqual({ 'Fn::Select': [2, { 'Fn::GetAZs': '' }] });
    });
  });

  describe('Security Groups', () => {
    test('should have Lambda security group', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      expect(template.Resources.LambdaSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('Lambda security group should allow HTTPS to VPC endpoints', () => {
      const sg = template.Resources.LambdaSecurityGroup.Properties;
      expect(sg.SecurityGroupEgress).toBeDefined();
      expect(sg.SecurityGroupEgress[0].IpProtocol).toBe('tcp');
      expect(sg.SecurityGroupEgress[0].FromPort).toBe(443);
      expect(sg.SecurityGroupEgress[0].ToPort).toBe(443);
      expect(sg.SecurityGroupEgress[0].CidrIp).toBe('10.0.0.0/16');
    });

    test('should have VPC endpoint security group', () => {
      expect(template.Resources.VPCEndpointSecurityGroup).toBeDefined();
      expect(template.Resources.VPCEndpointSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('VPC endpoint security group should allow HTTPS from Lambda', () => {
      const sg = template.Resources.VPCEndpointSecurityGroup.Properties;
      expect(sg.SecurityGroupIngress).toBeDefined();
      expect(sg.SecurityGroupIngress[0].IpProtocol).toBe('tcp');
      expect(sg.SecurityGroupIngress[0].FromPort).toBe(443);
      expect(sg.SecurityGroupIngress[0].ToPort).toBe(443);
      expect(sg.SecurityGroupIngress[0].SourceSecurityGroupId).toEqual({ Ref: 'LambdaSecurityGroup' });
    });
  });

  describe('VPC Endpoints', () => {
    test('should have DynamoDB VPC endpoint (Gateway)', () => {
      expect(template.Resources.DynamoDBVPCEndpoint).toBeDefined();
      const endpoint = template.Resources.DynamoDBVPCEndpoint.Properties;
      expect(endpoint.VpcEndpointType).toBe('Gateway');
      expect(endpoint.ServiceName).toEqual({ 'Fn::Sub': 'com.amazonaws.${AWS::Region}.dynamodb' });
    });

    test('should have Kinesis VPC endpoint (Interface)', () => {
      expect(template.Resources.KinesisVPCEndpoint).toBeDefined();
      const endpoint = template.Resources.KinesisVPCEndpoint.Properties;
      expect(endpoint.VpcEndpointType).toBe('Interface');
      expect(endpoint.PrivateDnsEnabled).toBe(true);
    });

    test('should have KMS VPC endpoint (Interface)', () => {
      expect(template.Resources.KMSVPCEndpoint).toBeDefined();
      const endpoint = template.Resources.KMSVPCEndpoint.Properties;
      expect(endpoint.VpcEndpointType).toBe('Interface');
      expect(endpoint.PrivateDnsEnabled).toBe(true);
    });

    test('should have CloudWatch Logs VPC endpoint (Interface)', () => {
      expect(template.Resources.CloudWatchLogsVPCEndpoint).toBeDefined();
      const endpoint = template.Resources.CloudWatchLogsVPCEndpoint.Properties;
      expect(endpoint.VpcEndpointType).toBe('Interface');
      expect(endpoint.PrivateDnsEnabled).toBe(true);
    });

    test('should have Lambda VPC endpoint (Interface)', () => {
      expect(template.Resources.LambdaVPCEndpoint).toBeDefined();
      const endpoint = template.Resources.LambdaVPCEndpoint.Properties;
      expect(endpoint.VpcEndpointType).toBe('Interface');
      expect(endpoint.PrivateDnsEnabled).toBe(true);
    });
  });

  describe('KMS Encryption', () => {
    test('should have KMS key resource', () => {
      expect(template.Resources.EncryptionKey).toBeDefined();
      expect(template.Resources.EncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have rotation enabled', () => {
      const key = template.Resources.EncryptionKey.Properties;
      expect(key.EnableKeyRotation).toBe(true);
    });

    test('KMS key should have key policy', () => {
      const policy = template.Resources.EncryptionKey.Properties.KeyPolicy;
      expect(policy).toBeDefined();
      expect(policy.Version).toBe('2012-10-17');
      expect(policy.Statement).toBeDefined();
      expect(Array.isArray(policy.Statement)).toBe(true);
    });

    test('KMS key policy should allow root account', () => {
      const policy = template.Resources.EncryptionKey.Properties.KeyPolicy;
      const rootStatement = policy.Statement.find((s: any) => s.Sid === 'Enable IAM User Permissions');
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Effect).toBe('Allow');
      expect(rootStatement.Action).toBe('kms:*');
    });

    test('KMS key should have alias', () => {
      expect(template.Resources.EncryptionKeyAlias).toBeDefined();
      expect(template.Resources.EncryptionKeyAlias.Type).toBe('AWS::KMS::Alias');
      const alias = template.Resources.EncryptionKeyAlias.Properties;
      expect(alias.AliasName).toEqual({ 'Fn::Sub': 'alias/transaction-key-${EnvironmentSuffix}' });
    });
  });

  describe('DynamoDB Table', () => {
    test('should have DynamoDB table resource', () => {
      expect(template.Resources.TransactionTable).toBeDefined();
      expect(template.Resources.TransactionTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('DynamoDB table should have correct billing mode', () => {
      const table = template.Resources.TransactionTable.Properties;
      expect(table.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('DynamoDB table should have point-in-time recovery enabled', () => {
      const table = template.Resources.TransactionTable.Properties;
      expect(table.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('DynamoDB table should have KMS encryption', () => {
      const table = template.Resources.TransactionTable.Properties;
      expect(table.SSESpecification.SSEEnabled).toBe(true);
      expect(table.SSESpecification.SSEType).toBe('KMS');
      expect(table.SSESpecification.KMSMasterKeyId).toEqual({ Ref: 'EncryptionKey' });
    });

    test('DynamoDB table should have correct key schema', () => {
      const table = template.Resources.TransactionTable.Properties;
      expect(table.KeySchema).toHaveLength(2);
      expect(table.KeySchema[0].AttributeName).toBe('transactionId');
      expect(table.KeySchema[0].KeyType).toBe('HASH');
      expect(table.KeySchema[1].AttributeName).toBe('timestamp');
      expect(table.KeySchema[1].KeyType).toBe('RANGE');
    });
  });

  describe('Kinesis Stream', () => {
    test('should have Kinesis stream resource', () => {
      expect(template.Resources.TransactionStream).toBeDefined();
      expect(template.Resources.TransactionStream.Type).toBe('AWS::Kinesis::Stream');
    });

    test('Kinesis stream should have correct shard count', () => {
      const stream = template.Resources.TransactionStream.Properties;
      expect(stream.ShardCount).toBe(1);
    });

    test('Kinesis stream should have KMS encryption', () => {
      const stream = template.Resources.TransactionStream.Properties;
      expect(stream.StreamEncryption).toBeDefined();
      expect(stream.StreamEncryption.EncryptionType).toBe('KMS');
      expect(stream.StreamEncryption.KeyId).toEqual({ Ref: 'EncryptionKey' });
    });

    test('Kinesis stream should have 24-hour retention', () => {
      const stream = template.Resources.TransactionStream.Properties;
      expect(stream.RetentionPeriodHours).toBe(24);
    });
  });

  describe('CloudWatch Logs', () => {
    test('should have Lambda log group', () => {
      expect(template.Resources.LambdaLogGroup).toBeDefined();
      expect(template.Resources.LambdaLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('log group should have 90-day retention', () => {
      const logGroup = template.Resources.LambdaLogGroup.Properties;
      expect(logGroup.RetentionInDays).toBe(90);
    });

    test('log group should have KMS encryption', () => {
      const logGroup = template.Resources.LambdaLogGroup.Properties;
      expect(logGroup.KmsKeyId).toEqual({ 'Fn::GetAtt': ['EncryptionKey', 'Arn'] });
    });
  });

  describe('IAM Roles', () => {
    test('should have Lambda execution role', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('Lambda role should have VPC execution policy', () => {
      const role = template.Resources.LambdaExecutionRole.Properties;
      expect(role.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
    });

    test('Lambda role should have DynamoDB access policy', () => {
      const role = template.Resources.LambdaExecutionRole.Properties;
      const dynamoPolicy = role.Policies.find((p: any) => p.PolicyName === 'DynamoDBAccess');
      expect(dynamoPolicy).toBeDefined();
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:PutItem');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:GetItem');
    });

    test('Lambda role should have Kinesis access policy', () => {
      const role = template.Resources.LambdaExecutionRole.Properties;
      const kinesisPolicy = role.Policies.find((p: any) => p.PolicyName === 'KinesisAccess');
      expect(kinesisPolicy).toBeDefined();
      expect(kinesisPolicy.PolicyDocument.Statement[0].Action).toContain('kinesis:PutRecord');
      expect(kinesisPolicy.PolicyDocument.Statement[0].Action).toContain('kinesis:PutRecords');
    });

    test('Lambda role should have KMS access policy', () => {
      const role = template.Resources.LambdaExecutionRole.Properties;
      const kmsPolicy = role.Policies.find((p: any) => p.PolicyName === 'KMSAccess');
      expect(kmsPolicy).toBeDefined();
      expect(kmsPolicy.PolicyDocument.Statement[0].Action).toContain('kms:Decrypt');
      expect(kmsPolicy.PolicyDocument.Statement[0].Action).toContain('kms:Encrypt');
    });

    test('Lambda role should have CloudWatch Logs access policy', () => {
      const role = template.Resources.LambdaExecutionRole.Properties;
      const logsPolicy = role.Policies.find((p: any) => p.PolicyName === 'CloudWatchLogsAccess');
      expect(logsPolicy).toBeDefined();
      expect(logsPolicy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogStream');
      expect(logsPolicy.PolicyDocument.Statement[0].Action).toContain('logs:PutLogEvents');
    });
  });

  describe('Lambda Function', () => {
    test('should have Lambda function resource', () => {
      expect(template.Resources.TransactionProcessorFunction).toBeDefined();
      expect(template.Resources.TransactionProcessorFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda should have 1GB memory', () => {
      const lambda = template.Resources.TransactionProcessorFunction.Properties;
      expect(lambda.MemorySize).toBe(1024);
    });

    test('Lambda should have Python 3.11 runtime', () => {
      const lambda = template.Resources.TransactionProcessorFunction.Properties;
      expect(lambda.Runtime).toBe('python3.11');
    });

    test('Lambda should have VPC configuration', () => {
      const lambda = template.Resources.TransactionProcessorFunction.Properties;
      expect(lambda.VpcConfig).toBeDefined();
      expect(lambda.VpcConfig.SubnetIds).toHaveLength(3);
      expect(lambda.VpcConfig.SecurityGroupIds).toHaveLength(1);
    });

    test('Lambda should have environment variables', () => {
      const lambda = template.Resources.TransactionProcessorFunction.Properties;
      expect(lambda.Environment.Variables.DYNAMODB_TABLE_NAME).toEqual({ Ref: 'TransactionTable' });
      expect(lambda.Environment.Variables.KINESIS_STREAM_NAME).toEqual({ Ref: 'TransactionStream' });
      expect(lambda.Environment.Variables.KMS_KEY_ID).toEqual({ Ref: 'EncryptionKey' });
    });

    test('Lambda should have KMS encryption for environment variables', () => {
      const lambda = template.Resources.TransactionProcessorFunction.Properties;
      expect(lambda.KmsKeyArn).toEqual({ 'Fn::GetAtt': ['EncryptionKey', 'Arn'] });
    });

    test('Lambda should have inline code', () => {
      const lambda = template.Resources.TransactionProcessorFunction.Properties;
      expect(lambda.Code.ZipFile).toBeDefined();
      expect(lambda.Code.ZipFile).toContain('import boto3');
      expect(lambda.Code.ZipFile).toContain('def handler(event, context)');
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have Lambda error alarm', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
      expect(template.Resources.LambdaErrorAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('Lambda error alarm should monitor Errors metric', () => {
      const alarm = template.Resources.LambdaErrorAlarm.Properties;
      expect(alarm.MetricName).toBe('Errors');
      expect(alarm.Namespace).toBe('AWS/Lambda');
      expect(alarm.Threshold).toBe(1);
    });

    test('should have DynamoDB throttle alarm', () => {
      expect(template.Resources.DynamoDBThrottleAlarm).toBeDefined();
      expect(template.Resources.DynamoDBThrottleAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('DynamoDB throttle alarm should monitor UserErrors metric', () => {
      const alarm = template.Resources.DynamoDBThrottleAlarm.Properties;
      expect(alarm.MetricName).toBe('UserErrors');
      expect(alarm.Namespace).toBe('AWS/DynamoDB');
      expect(alarm.Threshold).toBe(5);
    });
  });

  describe('Resource Naming with EnvironmentSuffix', () => {
    test('VPC should include environment suffix in name', () => {
      const vpc = template.Resources.VPC.Properties.Tags;
      expect(vpc[0].Value).toEqual({ 'Fn::Sub': 'transaction-vpc-${EnvironmentSuffix}' });
    });

    test('DynamoDB table should include environment suffix', () => {
      const table = template.Resources.TransactionTable.Properties;
      expect(table.TableName).toEqual({ 'Fn::Sub': 'transactions-${EnvironmentSuffix}' });
    });

    test('Kinesis stream should include environment suffix', () => {
      const stream = template.Resources.TransactionStream.Properties;
      expect(stream.Name).toEqual({ 'Fn::Sub': 'transaction-stream-${EnvironmentSuffix}' });
    });

    test('Lambda function should include environment suffix', () => {
      const lambda = template.Resources.TransactionProcessorFunction.Properties;
      expect(lambda.FunctionName).toEqual({ 'Fn::Sub': 'transaction-processor-${EnvironmentSuffix}' });
    });

    test('IAM roles should include environment suffix', () => {
      const lambdaRole = template.Resources.LambdaExecutionRole.Properties;
      expect(lambdaRole.RoleName).toEqual({ 'Fn::Sub': 'lambda-transaction-processor-role-${EnvironmentSuffix}' });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PrivateSubnetIds',
        'KMSKeyId',
        'KMSKeyArn',
        'DynamoDBTableName',
        'DynamoDBTableArn',
        'KinesisStreamName',
        'KinesisStreamArn',
        'LambdaFunctionName',
        'LambdaFunctionArn',
        'CloudWatchLogGroupName',
        'LambdaSecurityGroupId',
        'LambdaErrorAlarmName',
        'DynamoDBThrottleAlarmName',
        'TerminationProtectionEnabled'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should export value', () => {
      const output = template.Outputs.VPCId;
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-VPC-Id' });
    });

    test('outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Description).toBeDefined();
        expect(template.Outputs[outputKey].Description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Security Compliance', () => {
    test('should not have any wildcard resource ARNs in IAM policies', () => {
      const lambdaRole = template.Resources.LambdaExecutionRole.Properties;
      lambdaRole.Policies.forEach((policy: any) => {
        policy.PolicyDocument.Statement.forEach((statement: any) => {
          if (typeof statement.Resource === 'string') {
            expect(statement.Resource).not.toBe('*');
          } else if (Array.isArray(statement.Resource)) {
            statement.Resource.forEach((resource: any) => {
              if (typeof resource === 'string') {
                expect(resource).not.toBe('*');
              }
            });
          }
        });
      });
    });

    test('should not have DeletionProtection enabled', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Properties && resource.Properties.DeletionProtectionEnabled !== undefined) {
          expect(resource.Properties.DeletionProtectionEnabled).toBe(false);
        }
      });
    });

    test('should not have Retain deletion policy', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have all major resource types', () => {
      const resourceTypes = Object.values(template.Resources).map((r: any) => r.Type);
      expect(resourceTypes).toContain('AWS::EC2::VPC');
      expect(resourceTypes).toContain('AWS::Lambda::Function');
      expect(resourceTypes).toContain('AWS::DynamoDB::Table');
      expect(resourceTypes).toContain('AWS::Kinesis::Stream');
      expect(resourceTypes).toContain('AWS::KMS::Key');
      expect(resourceTypes).toContain('AWS::EC2::VPCEndpoint');
    });

    test('template should have at least 20 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(20);
    });
  });
});
