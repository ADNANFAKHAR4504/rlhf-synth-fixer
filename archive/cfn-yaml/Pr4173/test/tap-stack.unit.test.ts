import fs from 'fs';
import path from 'path';

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
        'Multi-AZ Real-time Data Analytics Pipeline for Financial Technology Payment Processing'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentName parameter', () => {
      expect(template.Parameters.EnvironmentName).toBeDefined();
    });

    test('EnvironmentName parameter should have correct properties', () => {
      const envNameParam = template.Parameters.EnvironmentName;
      expect(envNameParam.Type).toBe('String');
      expect(envNameParam.Default).toBe('prod');
      expect(envNameParam.Description).toBe(
        'Environment name for resource tagging'
      );
      expect(envNameParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envNameParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });

    test('KinesisShardCount parameter constraints', () => {
      const param = template.Parameters.KinesisShardCount;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(3);
      expect(param.MinValue).toBeGreaterThanOrEqual(1);
      expect(param.MaxValue).toBeLessThanOrEqual(100);
      expect(param.Description).toMatch(/Number of shards/i);
    });

    test('DynamoDBReadCapacity parameter constraints', () => {
      const param = template.Parameters.DynamoDBReadCapacity;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(100);
      expect(param.MinValue).toBeGreaterThanOrEqual(5);
      expect(param.MaxValue).toBeLessThanOrEqual(40000);
      expect(param.Description).toMatch(/Read capacity units/i);
    });

    test('DynamoDBWriteCapacity parameter constraints', () => {
      const param = template.Parameters.DynamoDBWriteCapacity;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(100);
      expect(param.MinValue).toBeGreaterThanOrEqual(5);
      expect(param.MaxValue).toBeLessThanOrEqual(40000);
      expect(param.Description).toMatch(/Write capacity units/i);
    });

    test('LambdaMemorySize parameter constraints', () => {
      const param = template.Parameters.LambdaMemorySize;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(1024);
      expect(param.MinValue).toBeGreaterThanOrEqual(128);
      expect(param.MaxValue).toBeLessThanOrEqual(10240);
      expect(param.Description).toMatch(/Memory size/i);
    });

    test('DataRetentionHours parameter constraints', () => {
      const param = template.Parameters.DataRetentionHours;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(24);
      expect(param.MinValue).toBeGreaterThanOrEqual(24);
      expect(param.MaxValue).toBeLessThanOrEqual(168);
      expect(param.Description).toMatch(/Data retention period/i);
    });

  });

  describe('Resources', () => {

    test('Lambda function setup', () => {
      const lambdaResource = template.Resources.ProcessorLambdaFunction;
      expect(lambdaResource).toBeDefined();
      expect(lambdaResource.Properties.Runtime).toBe('python3.9');
      expect(lambdaResource.Properties.Handler).toBe('index.handler');
      expect(lambdaResource.Properties.TracingConfig.Mode).toBe('Active');
    });

    test('VPC resource configuration', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toStrictEqual({ "Fn::FindInMap": ["SubnetConfig", "VPC", "CIDR"] });
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('Private subnets defined and have correct CIDRs', () => {
      ['PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3'].forEach(subnetName => {
        const subnet = template.Resources[subnetName];
        expect(subnet).toBeDefined();
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.Properties.CidrBlock).toStrictEqual({ "Fn::FindInMap": ["SubnetConfig", subnetName, "CIDR"] });
      });
    });

    test('Kinesis Data Stream properties', () => {
      const kinesis = template.Resources.KinesisDataStream;
      expect(kinesis).toBeDefined();
      expect(kinesis.Type).toBe('AWS::Kinesis::Stream');
      expect(kinesis.Properties.ShardCount).toStrictEqual({ Ref: 'KinesisShardCount' });
      expect(kinesis.Properties.RetentionPeriodHours).toStrictEqual({ Ref: 'DataRetentionHours' });
      expect(kinesis.Properties.StreamModeDetails.StreamMode).toBe('PROVISIONED');
      expect(kinesis.Properties.StreamEncryption.EncryptionType).toBe('KMS');
    });

    test('DynamoDB Table configuration', () => {
      const table = template.Resources.TransactionMetadataTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.AttributeDefinitions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ AttributeName: 'transactionId', AttributeType: 'S' }),
          expect.objectContaining({ AttributeName: 'timestamp', AttributeType: 'N' }),
          expect.objectContaining({ AttributeName: 'merchantId', AttributeType: 'S' }),
        ])
      );
      expect(table.Properties.KeySchema).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ AttributeName: 'transactionId', KeyType: 'HASH' }),
          expect.objectContaining({ AttributeName: 'timestamp', KeyType: 'RANGE' }),
        ])
      );
      expect(table.Properties.GlobalSecondaryIndexes).toBeDefined();
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('S3 Bucket encryption and lifecycle policies', () => {
      const bucket = template.Resources.ProcessedDataBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      const encryptionConfig = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryptionConfig.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucket.Properties.LifecycleConfiguration.Rules.length).toBeGreaterThan(0);
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    });

    test('Lambda function basic configuration', () => {
      const lambda = template.Resources.ProcessorLambdaFunction;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.9');
      expect(lambda.Properties.Handler).toBe('index.handler');
      expect(lambda.Properties.Timeout).toBe(60);
      expect(lambda.Properties.VpcConfig.SubnetIds.length).toBe(3);
      expect(lambda.Properties.Environment.Variables).toHaveProperty('DYNAMODB_TABLE');
      expect(lambda.Properties.Environment.Variables).toHaveProperty('S3_BUCKET');
    });

    test('Lambda Execution Role IAM policies include expected permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      const policies = role.Properties.Policies;
      const policyNames = policies.map((p: any) => p.PolicyName);
      expect(policyNames).toEqual(expect.arrayContaining([
        'DeadLetterQueuePolicy',
        'KinesisAccessPolicy',
        'DynamoDBAccessPolicy',
        'S3AccessPolicy',
        'CloudWatchLogsPolicy',
      ]));
    });
  });

  describe('Outputs', () => {
    let outputs: any;

    beforeAll(() => {
      outputs = template.Outputs;
    });

    test('Outputs section includes expected keys', () => {
      const expectedKeys = [
        'VPCId',
        'KinesisStreamArn',
        'DynamoDBTableName',
        'S3BucketName',
        'LambdaFunctionArn',
        'DLQUrl'
      ];
      expectedKeys.forEach(key => {
        expect(outputs[key]).toBeDefined();
      });
    });

    test('Each output has a Description and Value', () => {
      for (const key in outputs) {
        expect(outputs[key].Description).toBeDefined();
        expect(outputs[key].Description.length).toBeGreaterThan(0);
        expect(outputs[key].Value).toBeDefined();
      }
    });


    test('VPCId output valid format', () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();
      expect(vpcId.Description).toBe('VPC ID');
      expect(vpcId.Value).toEqual({ 'Ref': "VPC" });
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

    test('should have exactly 37 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(37);
    });

    test('should have exactly six parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(6);
    });

    test('should have exactly six outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(6);
    });
  });

  describe('Resource Naming Convention', () => {

    test('Resource logical IDs follow PascalCase naming convention', () => {
      const resourceNames = Object.keys(template.Resources);
      const pascalCaseRegex = /^[A-Z][A-Za-z0-9]*$/; // PascalCase pattern
      resourceNames.forEach(name => {
        expect(pascalCaseRegex.test(name)).toBe(true);
      });
    });

    test('Parameter names follow camelCase or PascalCase naming convention', () => {
      const paramNames = Object.keys(template.Parameters);
      const paramNameRegex = /^[A-Za-z][A-Za-z0-9]*$/; // Letters and numbers, no underscores
      paramNames.forEach(name => {
        expect(paramNameRegex.test(name)).toBe(true);
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${EnvironmentName}-${outputKey}`,
        });
      });
    });
  });
});
