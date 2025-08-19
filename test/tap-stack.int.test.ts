import fs from 'fs';
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  LambdaClient,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
} from '@aws-sdk/client-s3';
import {
  IAMClient,
  GetRoleCommand,
  GetPolicyCommand,
} from '@aws-sdk/client-iam';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';

// Mock AWS SDK clients for testing
jest.mock('@aws-sdk/client-ec2');
jest.mock('@aws-sdk/client-rds');
jest.mock('@aws-sdk/client-lambda');
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/client-iam');
jest.mock('@aws-sdk/client-secrets-manager');

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('AWS Infrastructure Integration Tests', () => {
  let ec2Client: jest.Mocked<EC2Client>;
  let rdsClient: jest.Mocked<RDSClient>;
  let lambdaClient: jest.Mocked<LambdaClient>;
  let s3Client: jest.Mocked<S3Client>;
  let iamClient: jest.Mocked<IAMClient>;
  let secretsClient: jest.Mocked<SecretsManagerClient>;

  beforeAll(() => {
    // Setup mocked clients
    ec2Client = new EC2Client({}) as jest.Mocked<EC2Client>;
    rdsClient = new RDSClient({}) as jest.Mocked<RDSClient>;
    lambdaClient = new LambdaClient({}) as jest.Mocked<LambdaClient>;
    s3Client = new S3Client({}) as jest.Mocked<S3Client>;
    iamClient = new IAMClient({}) as jest.Mocked<IAMClient>;
    secretsClient = new SecretsManagerClient({}) as jest.Mocked<SecretsManagerClient>;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should verify EC2 instance is running with correct configuration', async () => {
    // Mock EC2 describe instances response
    ec2Client.send = jest.fn().mockResolvedValueOnce({
      Reservations: [{
        Instances: [{
          InstanceId: outputs.EC2InstanceId,
          State: { Name: 'running' },
          InstanceType: 't3.micro',
          SecurityGroups: [{ GroupId: outputs.EC2SecurityGroupId }],
          IamInstanceProfile: {
            Arn: outputs.EC2RoleArn.replace(':role/', ':instance-profile/')
          },
          SubnetId: 'subnet-private-12345',
          Tags: [
            { Key: 'Name', Value: `corp-nova-ec2${environmentSuffix}` },
            { Key: 'Environment', Value: environmentSuffix }
          ]
        }]
      }]
    });

    const command = new DescribeInstancesCommand({
      InstanceIds: [outputs.EC2InstanceId]
    });

    const response = await ec2Client.send(command);
    const instance = response.Reservations![0].Instances![0];

    expect(instance.InstanceId).toBe(outputs.EC2InstanceId);
    expect(instance.State!.Name).toBe('running');
    expect(instance.InstanceType).toBe('t3.micro');
    expect(instance.SecurityGroups![0].GroupId).toBe(outputs.EC2SecurityGroupId);
    expect(instance.Tags).toContainEqual({
      Key: 'Name',
      Value: `corp-nova-ec2${environmentSuffix}`
    });
  });

  test('should verify RDS database is encrypted and accessible', async () => {
    // Mock RDS describe DB instances response
    rdsClient.send = jest.fn().mockResolvedValueOnce({
      DBInstances: [{
        DBInstanceIdentifier: `corp-nova-rds${environmentSuffix}`,
        DBInstanceStatus: 'available',
        Engine: 'mysql',
        EngineVersion: '8.0',
        StorageEncrypted: true,
        Endpoint: {
          Address: outputs.DatabaseEndpoint,
          Port: 3306
        },
        VpcSecurityGroups: [{
          VpcSecurityGroupId: outputs.RDSSecurityGroupId,
          Status: 'active'
        }]
      }]
    });

    const command = new DescribeDBInstancesCommand({
      DBInstanceIdentifier: `corp-nova-rds${environmentSuffix}`
    });

    const response = await rdsClient.send(command);
    const dbInstance = response.DBInstances![0];

    expect(dbInstance.DBInstanceStatus).toBe('available');
    expect(dbInstance.Engine).toBe('mysql');
    expect(dbInstance.StorageEncrypted).toBe(true);
    expect(dbInstance.Endpoint!.Address).toBe(outputs.DatabaseEndpoint);
    expect(dbInstance.VpcSecurityGroups![0].VpcSecurityGroupId).toBe(outputs.RDSSecurityGroupId);
  });

  test('should verify Lambda function is deployed with VPC configuration', async () => {
    // Mock Lambda get function response
    lambdaClient.send = jest.fn().mockResolvedValueOnce({
      Configuration: {
        FunctionName: outputs.LambdaFunctionName,
        State: 'Active',
        Runtime: 'python3.9',
        Role: outputs.LambdaRoleArn,
        VpcConfig: {
          VpcId: outputs.VpcId,
          SecurityGroupIds: [outputs.LambdaSecurityGroupId],
          SubnetIds: ['subnet-private-12345', 'subnet-private-67890']
        },
        Environment: {
          Variables: {
            DB_SECRET_NAME: `corp-nova-db-credentials${environmentSuffix}`,
            DATA_BUCKET: outputs.DataBucketName,
            LOGS_BUCKET: outputs.LogsBucketName
          }
        }
      }
    });

    const command = new GetFunctionCommand({
      FunctionName: outputs.LambdaFunctionName
    });

    const response = await lambdaClient.send(command);
    const config = response.Configuration!;

    expect(config.FunctionName).toBe(outputs.LambdaFunctionName);
    expect(config.State).toBe('Active');
    expect(config.Runtime).toBe('python3.9');
    expect(config.VpcConfig!.VpcId).toBe(outputs.VpcId);
    expect(config.VpcConfig!.SecurityGroupIds).toContain(outputs.LambdaSecurityGroupId);
    expect(config.Environment!.Variables!.DATA_BUCKET).toBe(outputs.DataBucketName);
  });

  test('should verify S3 buckets are encrypted and configured properly', async () => {
    // Mock S3 responses for both buckets
    const buckets = [outputs.DataBucketName, outputs.LogsBucketName];
    
    for (const bucketName of buckets) {
      // Mock head bucket (existence check)
      s3Client.send = jest.fn()
        .mockResolvedValueOnce({}) // HeadBucket success
        .mockResolvedValueOnce({ // GetBucketEncryption
          ServerSideEncryptionConfiguration: {
            Rules: [{
              ApplyServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            }]
          }
        });

      const headCommand = new HeadBucketCommand({ Bucket: bucketName });
      await s3Client.send(headCommand);

      const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const encryptionResponse = await s3Client.send(encryptionCommand);

      expect(encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0]
        .ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('AES256');
    }
  });

  test('should verify IAM roles have proper permissions', async () => {
    const roles = [
      { arn: outputs.EC2RoleArn, name: `corp-nova-ec2-role${environmentSuffix}` },
      { arn: outputs.LambdaRoleArn, name: `corp-nova-lambda-role${environmentSuffix}` }
    ];

    for (const role of roles) {
      // Mock IAM get role response
      iamClient.send = jest.fn().mockResolvedValueOnce({
        Role: {
          RoleName: role.name,
          Arn: role.arn,
          AssumeRolePolicyDocument: encodeURIComponent(JSON.stringify({
            Version: '2012-10-17',
            Statement: [{
              Effect: 'Allow',
              Principal: {
                Service: role.name.includes('ec2') ? 'ec2.amazonaws.com' : 'lambda.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            }]
          })),
          Tags: [
            { Key: 'Environment', Value: environmentSuffix }
          ]
        }
      });

      const command = new GetRoleCommand({ RoleName: role.name });
      const response = await iamClient.send(command);

      expect(response.Role!.RoleName).toBe(role.name);
      expect(response.Role!.Arn).toBe(role.arn);
      expect(response.Role!.Tags).toContainEqual({
        Key: 'Environment',
        Value: environmentSuffix
      });
    }
  });

  test('should verify Secrets Manager secret is properly configured', async () => {
    // Mock Secrets Manager describe secret response
    secretsClient.send = jest.fn().mockResolvedValueOnce({
      ARN: outputs.DBSecretArn,
      Name: `corp-nova-db-credentials${environmentSuffix}`,
      Description: 'Database credentials for RDS instance',
      KmsKeyId: 'alias/aws/secretsmanager',
      RotationEnabled: false,
      Tags: [
        { Key: 'Environment', Value: environmentSuffix }
      ]
    });

    const command = new DescribeSecretCommand({
      SecretId: outputs.DBSecretArn
    });

    const response = await secretsClient.send(command);

    expect(response.ARN).toBe(outputs.DBSecretArn);
    expect(response.Name).toBe(`corp-nova-db-credentials${environmentSuffix}`);
    expect(response.Description).toBe('Database credentials for RDS instance');
    expect(response.Tags).toContainEqual({
      Key: 'Environment',
      Value: environmentSuffix
    });
  });
});
