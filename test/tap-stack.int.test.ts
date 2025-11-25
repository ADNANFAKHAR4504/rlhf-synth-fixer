import * as cloudwatch from '@aws-sdk/client-cloudwatch-logs';
import * as config from '@aws-sdk/client-config-service';
import * as dynamodb from '@aws-sdk/client-dynamodb';
import * as ec2 from '@aws-sdk/client-ec2';
import * as kms from '@aws-sdk/client-kms';
import * as lambda from '@aws-sdk/client-lambda';
import * as aws from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

describe('Integration Tests', () => {
  let outputs: any;
  let s3Client: aws.S3Client;
  let dynamoClient: dynamodb.DynamoDBClient;
  let lambdaClient: lambda.LambdaClient;
  let kmsClient: kms.KMSClient;
  let ec2Client: ec2.EC2Client;
  let cloudwatchClient: cloudwatch.CloudWatchLogsClient;
  let configClient: config.ConfigServiceClient;

  beforeAll(async () => {
    // Load outputs from cfn-outputs/flat-outputs.json
    const outputsPath = path.join(
      __dirname,
      '../cfn-outputs/flat-outputs.json'
    );

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Outputs file not found at ${outputsPath}. Please deploy the stack first.`
      );
    }

    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

    const region = process.env.AWS_REGION || 'us-east-1';

    // Initialize AWS clients
    s3Client = new aws.S3Client({ region });
    dynamoClient = new dynamodb.DynamoDBClient({ region });
    lambdaClient = new lambda.LambdaClient({ region });
    kmsClient = new kms.KMSClient({ region });
    ec2Client = new ec2.EC2Client({ region });
    cloudwatchClient = new cloudwatch.CloudWatchLogsClient({ region });
    configClient = new config.ConfigServiceClient({ region });
  });

  describe('VPC Configuration', () => {
    it('should have VPC created', async () => {
      const vpcId = outputs.vpcId;
      expect(vpcId).toBeDefined();

      const response = await ec2Client.send(
        new ec2.DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    });

    it('should have 3 private subnets across availability zones', async () => {
      const vpcId = outputs.vpcId;

      const response = await ec2Client.send(
        new ec2.DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
          ],
        })
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(3);

      // Check that subnets are in different AZs
      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(3);
    });

    it('should have VPC endpoints for S3, DynamoDB, and KMS', async () => {
      const vpcId = outputs.vpcId;

      const response = await ec2Client.send(
        new ec2.DescribeVpcEndpointsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
          ],
        })
      );

      expect(response.VpcEndpoints).toBeDefined();

      const serviceNames = response.VpcEndpoints!.map(e => e.ServiceName);

      // Check for required endpoints
      const hasS3 = serviceNames.some(name => name?.includes('s3'));
      const hasDynamoDB = serviceNames.some(name => name?.includes('dynamodb'));
      const hasKMS = serviceNames.some(name => name?.includes('kms'));

      expect(hasS3).toBe(true);
      expect(hasDynamoDB).toBe(true);
      expect(hasKMS).toBe(true);
    });

    it('should have no internet gateway attached', async () => {
      const vpcId = outputs.vpcId;

      const response = await ec2Client.send(
        new ec2.DescribeInternetGatewaysCommand({
          Filters: [
            {
              Name: 'attachment.vpc-id',
              Values: [vpcId],
            },
          ],
        })
      );

      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways!.length).toBe(0);
    });

    it('should have no NAT gateways', async () => {
      const vpcId = outputs.vpcId;

      const response = await ec2Client.send(
        new ec2.DescribeNatGatewaysCommand({
          Filter: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
          ],
        })
      );

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBe(0);
    });
  });

  describe('KMS Configuration', () => {
    it('should have KMS key with rotation enabled', async () => {
      const kmsKeyArn = outputs.kmsKeyArn;
      expect(kmsKeyArn).toBeDefined();

      const keyId = kmsKeyArn.split('/').pop();

      const response = await kmsClient.send(
        new kms.DescribeKeyCommand({
          KeyId: keyId,
        })
      );

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.Enabled).toBe(true);

      const rotationResponse = await kmsClient.send(
        new kms.GetKeyRotationStatusCommand({
          KeyId: keyId,
        })
      );

      expect(rotationResponse.KeyRotationEnabled).toBe(true);
    });

    it("should have KMS alias 'financial-data-key'", async () => {
      const response = await kmsClient.send(new kms.ListAliasesCommand({}));

      const alias = response.Aliases?.find(
        a => a.AliasName === 'alias/financial-data-key'
      );

      expect(alias).toBeDefined();
      expect(alias!.TargetKeyId).toBeDefined();
    });
  });

  describe('S3 Bucket Configuration', () => {
    it('should have S3 bucket with versioning enabled', async () => {
      const bucketName = outputs.bucketName;
      expect(bucketName).toBeDefined();

      const response = await s3Client.send(
        new aws.GetBucketVersioningCommand({
          Bucket: bucketName,
        })
      );

      expect(response.Status).toBe('Enabled');
    });

    it('should have S3 bucket with KMS encryption', async () => {
      const bucketName = outputs.bucketName;

      const response = await s3Client.send(
        new aws.GetBucketEncryptionCommand({
          Bucket: bucketName,
        })
      );

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe(
        'aws:kms'
      );
    });

    it('should have S3 bucket with public access blocked', async () => {
      const bucketName = outputs.bucketName;

      const response = await s3Client.send(
        new aws.GetPublicAccessBlockCommand({
          Bucket: bucketName,
        })
      );

      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(
        true
      );
      expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(
        true
      );
      expect(response.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(
        true
      );
      expect(
        response.PublicAccessBlockConfiguration!.RestrictPublicBuckets
      ).toBe(true);
    });
  });

  describe('DynamoDB Table Configuration', () => {
    it('should have DynamoDB table with encryption enabled', async () => {
      const tableName = outputs.auditTableName;
      expect(tableName).toBeDefined();

      const response = await dynamoClient.send(
        new dynamodb.DescribeTableCommand({
          TableName: tableName,
        })
      );

      expect(response.Table).toBeDefined();
      expect(response.Table!.SSEDescription).toBeDefined();
      expect(response.Table!.SSEDescription!.Status).toBe('ENABLED');
      expect(response.Table!.SSEDescription!.SSEType).toBe('KMS');
    });

    it('should have DynamoDB table with point-in-time recovery enabled', async () => {
      const tableName = outputs.auditTableName;

      const response = await dynamoClient.send(
        new dynamodb.DescribeContinuousBackupsCommand({
          TableName: tableName,
        })
      );

      expect(response.ContinuousBackupsDescription).toBeDefined();
      expect(
        response.ContinuousBackupsDescription!.PointInTimeRecoveryDescription!
          .PointInTimeRecoveryStatus
      ).toBe('ENABLED');
    });

    it('should have DynamoDB table with on-demand billing', async () => {
      const tableName = outputs.auditTableName;

      const response = await dynamoClient.send(
        new dynamodb.DescribeTableCommand({
          TableName: tableName,
        })
      );

      expect(response.Table!.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
    });
  });

  describe('Lambda Function Configuration', () => {
    it('should have Lambda function in VPC', async () => {
      const lambdaArn = outputs.lambdaArn;
      expect(lambdaArn).toBeDefined();

      const functionName = lambdaArn.split(':').pop();

      const response = await lambdaClient.send(
        new lambda.GetFunctionConfigurationCommand({
          FunctionName: functionName,
        })
      );

      expect(response.VpcConfig).toBeDefined();
      expect(response.VpcConfig!.VpcId).toBe(outputs.vpcId);
      expect(response.VpcConfig!.SubnetIds).toBeDefined();
      expect(response.VpcConfig!.SubnetIds!.length).toBeGreaterThan(0);
    });

    it('should have Lambda function with 1024MB memory', async () => {
      const lambdaArn = outputs.lambdaArn;
      const functionName = lambdaArn.split(':').pop();

      const response = await lambdaClient.send(
        new lambda.GetFunctionConfigurationCommand({
          FunctionName: functionName,
        })
      );

      expect(response.MemorySize).toBe(1024);
    });

    it('should have Lambda function with correct environment variables', async () => {
      const lambdaArn = outputs.lambdaArn;
      const functionName = lambdaArn.split(':').pop();

      const response = await lambdaClient.send(
        new lambda.GetFunctionConfigurationCommand({
          FunctionName: functionName,
        })
      );

      expect(response.Environment).toBeDefined();
      expect(response.Environment!.Variables).toBeDefined();
      expect(response.Environment!.Variables!.BUCKET_NAME).toBe(
        outputs.bucketName
      );
      expect(response.Environment!.Variables!.AUDIT_TABLE).toBe(
        outputs.auditTableName
      );
      expect(response.Environment!.Variables!.KMS_KEY_ID).toBeDefined();
    });
  });

  describe('CloudWatch Logs Configuration', () => {
    it('should have log group with 90 day retention', async () => {
      const lambdaArn = outputs.lambdaArn;
      const functionName = lambdaArn.split(':').pop();
      const logGroupName = `/aws/lambda/${functionName}`;

      const response = await cloudwatchClient.send(
        new cloudwatch.DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName,
        })
      );

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const logGroup = response.logGroups!.find(
        lg => lg.logGroupName === logGroupName
      );
      expect(logGroup).toBeDefined();
      expect(logGroup!.retentionInDays).toBe(90);
    });

    it('should have log group with KMS encryption', async () => {
      const lambdaArn = outputs.lambdaArn;
      const functionName = lambdaArn.split(':').pop();
      const logGroupName = `/aws/lambda/${functionName}`;

      const response = await cloudwatchClient.send(
        new cloudwatch.DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName,
        })
      );

      const logGroup = response.logGroups!.find(
        lg => lg.logGroupName === logGroupName
      );
      expect(logGroup).toBeDefined();
      expect(logGroup!.kmsKeyId).toBeDefined();
    });
  });

  describe('End-to-End Data Processing', () => {
    it('should process uploaded file and create audit log', async () => {
      const bucketName = outputs.bucketName;
      const tableName = outputs.auditTableName;
      const testKey = `test-${Date.now()}.txt`;
      const testData = 'This is a test file for integration testing';

      // Upload test file to S3
      await s3Client.send(
        new aws.PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          Body: testData,
        })
      );

      // Wait for Lambda to process (async)
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check audit log in DynamoDB
      const response = await dynamoClient.send(
        new dynamodb.ScanCommand({
          TableName: tableName,
          FilterExpression: 'contains(fileName, :key)',
          ExpressionAttributeValues: {
            ':key': { S: testKey },
          },
        })
      );

      expect(response.Items).toBeDefined();
      expect(response.Items!.length).toBeGreaterThan(0);

      const auditLog = response.Items![0];
      expect(auditLog.fileName.S).toBe(testKey);
      expect(auditLog.status.S).toBe('SUCCESS');
      expect(auditLog.action.S).toBe('FILE_PROCESSED');

      // Cleanup
      await s3Client.send(
        new aws.DeleteObjectCommand({
          Bucket: bucketName,
          Key: testKey,
        })
      );
    }, 30000);

    it('should write logs to CloudWatch', async () => {
      const lambdaArn = outputs.lambdaArn;
      const functionName = lambdaArn.split(':').pop();
      const logGroupName = `/aws/lambda/${functionName}`;

      // Trigger Lambda by uploading a file
      const bucketName = outputs.bucketName;
      const testKey = `log-test-${Date.now()}.txt`;

      await s3Client.send(
        new aws.PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          Body: 'Test for logging',
        })
      );

      // Wait for logs to appear
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Check for log streams
      const response = await cloudwatchClient.send(
        new cloudwatch.DescribeLogStreamsCommand({
          logGroupName: logGroupName,
          orderBy: 'LastEventTime',
          descending: true,
          limit: 5,
        })
      );

      expect(response.logStreams).toBeDefined();
      expect(response.logStreams!.length).toBeGreaterThan(0);

      // Cleanup
      await s3Client.send(
        new aws.DeleteObjectCommand({
          Bucket: bucketName,
          Key: testKey,
        })
      );
    }, 30000);
  });

  describe('AWS Config Compliance', () => {
    it('should have Config recorder active', async () => {
      const response = await configClient.send(
        new config.DescribeConfigurationRecordersCommand({})
      );

      expect(response.ConfigurationRecorders).toBeDefined();
      expect(response.ConfigurationRecorders!.length).toBeGreaterThan(0);

      const recorderStatus = await configClient.send(
        new config.DescribeConfigurationRecorderStatusCommand({})
      );

      expect(recorderStatus.ConfigurationRecordersStatus).toBeDefined();
      expect(recorderStatus.ConfigurationRecordersStatus![0].recording).toBe(
        true
      );
    });

    it('should have Config rules for encryption', async () => {
      const response = await configClient.send(
        new config.DescribeConfigRulesCommand({})
      );

      expect(response.ConfigRules).toBeDefined();

      const ruleNames = response.ConfigRules!.map(r => r.ConfigRuleName);

      const hasS3EncryptionRule = ruleNames.some(name =>
        name?.includes('s3-encryption')
      );
      const hasDynamoEncryptionRule = ruleNames.some(name =>
        name?.includes('dynamo-encryption')
      );

      expect(hasS3EncryptionRule).toBe(true);
      expect(hasDynamoEncryptionRule).toBe(true);
    });
  });

  describe('Security Validation', () => {
    it('should have no security groups allowing 0.0.0.0/0', async () => {
      const vpcId = outputs.vpcId;

      const response = await ec2Client.send(
        new ec2.DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
          ],
        })
      );

      expect(response.SecurityGroups).toBeDefined();

      for (const sg of response.SecurityGroups!) {
        const hasPublicIngress = sg.IpPermissions?.some(perm =>
          perm.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')
        );
        const hasPublicEgress = sg.IpPermissionsEgress?.some(perm =>
          perm.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')
        );

        expect(hasPublicIngress).toBe(false);
        expect(hasPublicEgress).toBe(false);
      }
    });

    it('should have all resources tagged correctly', async () => {
      const bucketName = outputs.bucketName;

      const bucketTagsResponse = await s3Client.send(
        new aws.GetBucketTaggingCommand({
          Bucket: bucketName,
        })
      );

      expect(bucketTagsResponse.TagSet).toBeDefined();

      const tags = bucketTagsResponse.TagSet!.reduce((acc: any, tag) => {
        acc[tag.Key!] = tag.Value!;
        return acc;
      }, {});

      expect(tags.Environment).toBeDefined();
      expect(tags.DataClassification).toBe('PCI-DSS');
      expect(tags.Owner).toBe('SecurityTeam');
    });
  });
});

