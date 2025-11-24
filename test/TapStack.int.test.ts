/**
 * Integration tests for deployed CloudFormation TapStack
 * Tests actual AWS resources using deployment outputs
 */

import * as fs from 'fs';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  GetItemCommand,
  ScanCommand,
  DescribeTableCommand
} from '@aws-sdk/client-dynamodb';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand
} from '@aws-sdk/client-lambda';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcEndpointsCommand
} from '@aws-sdk/client-ec2';
import {
  IAMClient,
  GetRoleCommand,
  GetRolePolicyCommand,
  ListRolePoliciesCommand
} from '@aws-sdk/client-iam';
import {
  SNSClient,
  GetTopicAttributesCommand
} from '@aws-sdk/client-sns';
import {
  ServiceCatalogClient,
  DescribePortfolioCommand
} from '@aws-sdk/client-service-catalog';
import {
  CloudWatchClient,
  GetDashboardCommand
} from '@aws-sdk/client-cloudwatch';
import { describe, it, expect, beforeAll } from '@jest/globals';

interface StackOutputs {
  DataBucketName: string;
  MetadataTableName: string;
  CSVProcessorFunctionArn: string;
  CSVProcessorFunctionName: string;
  VPCId: string;
  LambdaExecutionRoleArn: string;
  LambdaSecurityGroupId: string;
  PolicyComplianceTopicArn: string;
  DriftDetectionTopicArn: string;
  ServiceCatalogPortfolioId: string;
  DashboardURL: string;
  PublicSubnet1Id: string;
  PublicSubnet2Id: string;
  PrivateSubnet1Id: string;
  PrivateSubnet2Id: string;
}

describe('CloudFormation TapStack Integration Tests', () => {
  let outputs: StackOutputs;
  const region = process.env.AWS_REGION || 'us-east-1';

  // AWS SDK Clients
  const s3Client = new S3Client({ region });
  const dynamoClient = new DynamoDBClient({ region });
  const lambdaClient = new LambdaClient({ region });
  const ec2Client = new EC2Client({ region });
  const iamClient = new IAMClient({ region });
  const snsClient = new SNSClient({ region });
  const serviceCatalogClient = new ServiceCatalogClient({ region });
  const cloudWatchClient = new CloudWatchClient({ region });

  beforeAll(() => {
    const outputsPath = 'cfn-outputs/flat-outputs.json';
    expect(fs.existsSync(outputsPath)).toBe(true);
    const outputsContent = fs.readFileSync(outputsPath, 'utf8');
    outputs = JSON.parse(outputsContent) as StackOutputs;
  });

  describe('Deployment Outputs', () => {
    it('should have all required outputs', () => {
      expect(outputs).toBeDefined();
      expect(outputs.DataBucketName).toBeDefined();
      expect(outputs.MetadataTableName).toBeDefined();
      expect(outputs.CSVProcessorFunctionArn).toBeDefined();
      expect(outputs.CSVProcessorFunctionName).toBeDefined();
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.LambdaExecutionRoleArn).toBeDefined();
      expect(outputs.LambdaSecurityGroupId).toBeDefined();
      expect(outputs.PolicyComplianceTopicArn).toBeDefined();
      expect(outputs.DriftDetectionTopicArn).toBeDefined();
      expect(outputs.ServiceCatalogPortfolioId).toBeDefined();
      expect(outputs.DashboardURL).toBeDefined();
    });

    it('should have proper resource naming with environment suffix', () => {
      expect(outputs.DataBucketName).toMatch(/analytics-data-dev-/);
      expect(outputs.MetadataTableName).toBe('analytics-metadata-dev');
      expect(outputs.CSVProcessorFunctionName).toBe('analytics-csv-processor-dev');
    });

    it('should have valid ARN formats', () => {
      expect(outputs.CSVProcessorFunctionArn).toMatch(/^arn:aws:lambda:/);
      expect(outputs.LambdaExecutionRoleArn).toMatch(/^arn:aws:iam:/);
      expect(outputs.PolicyComplianceTopicArn).toMatch(/^arn:aws:sns:/);
      expect(outputs.DriftDetectionTopicArn).toMatch(/^arn:aws:sns:/);
    });
  });

  describe('S3 Bucket Tests', () => {
    it('should have S3 bucket created', async () => {
      const command = new ListObjectsV2Command({
        Bucket: outputs.DataBucketName,
        MaxKeys: 1
      });

      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    it('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.DataBucketName
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    it('should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.DataBucketName
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    it('should have lifecycle policy for Glacier transition', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.DataBucketName
      });

      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();
      const glacierRule = response.Rules?.find(r => r.ID === 'TransitionToGlacier');
      expect(glacierRule).toBeDefined();
      expect(glacierRule?.Transitions?.[0].Days).toBe(90);
      expect(glacierRule?.Transitions?.[0].StorageClass).toBe('GLACIER');
    });
  });

  describe('DynamoDB Table Tests', () => {
    it('should have DynamoDB table created', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.MetadataTableName
      });

      const response = await dynamoClient.send(command);
      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(outputs.MetadataTableName);
    });

    it('should use on-demand billing mode', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.MetadataTableName
      });

      const response = await dynamoClient.send(command);
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });

    it('should have proper key schema', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.MetadataTableName
      });

      const response = await dynamoClient.send(command);
      expect(response.Table?.KeySchema).toBeDefined();
      expect(response.Table?.KeySchema?.[0].AttributeName).toBe('file_id');
      expect(response.Table?.KeySchema?.[0].KeyType).toBe('HASH');
    });

    it('should have global secondary index', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.MetadataTableName
      });

      const response = await dynamoClient.send(command);
      expect(response.Table?.GlobalSecondaryIndexes).toBeDefined();
      expect(response.Table?.GlobalSecondaryIndexes?.length).toBeGreaterThan(0);
      expect(response.Table?.GlobalSecondaryIndexes?.[0].IndexName).toBe('timestamp-index');
    });

    it('should be in ACTIVE state', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.MetadataTableName
      });

      const response = await dynamoClient.send(command);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    });
  });

  describe('Lambda Function Tests', () => {
    it('should have Lambda function created', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.CSVProcessorFunctionName
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(outputs.CSVProcessorFunctionName);
    });

    it('should use Python 3.9 runtime', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.CSVProcessorFunctionName
      });

      const response = await lambdaClient.send(command);
      expect(response.Runtime).toBe('python3.9');
    });

    it('should have 3GB memory allocation', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.CSVProcessorFunctionName
      });

      const response = await lambdaClient.send(command);
      expect(response.MemorySize).toBe(3072);
    });

    it('should have 5 minute timeout', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.CSVProcessorFunctionName
      });

      const response = await lambdaClient.send(command);
      expect(response.Timeout).toBe(300);
    });

    it('should have environment variables', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.CSVProcessorFunctionName
      });

      const response = await lambdaClient.send(command);
      expect(response.Environment?.Variables).toBeDefined();
      expect(response.Environment?.Variables?.DYNAMODB_TABLE).toBe(outputs.MetadataTableName);
      expect(response.Environment?.Variables?.ENVIRONMENT_TYPE).toBeDefined();
    });

    it('should be in VPC', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.CSVProcessorFunctionName
      });

      const response = await lambdaClient.send(command);
      expect(response.VpcConfig).toBeDefined();
      expect(response.VpcConfig?.VpcId).toBe(outputs.VPCId);
      expect(response.VpcConfig?.SubnetIds?.length).toBeGreaterThan(0);
      expect(response.VpcConfig?.SecurityGroupIds).toContain(outputs.LambdaSecurityGroupId);
    });

    it('should have proper IAM role', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.CSVProcessorFunctionName
      });

      const response = await lambdaClient.send(command);
      expect(response.Role).toBe(outputs.LambdaExecutionRoleArn);
    });
  });

  describe('VPC Tests', () => {
    it('should have VPC created', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBe(1);
      expect(response.Vpcs?.[0].VpcId).toBe(outputs.VPCId);
    });

    it('should have correct CIDR block', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs?.[0].CidrBlock).toBe('10.0.0.0/16');
    });

    it('should have DNS support and hostnames enabled', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs?.[0].EnableDnsSupport).toBe(true);
      expect(response.Vpcs?.[0].EnableDnsHostnames).toBe(true);
    });

    it('should have subnets created', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId]
          }
        ]
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBeGreaterThanOrEqual(4);
    });

    it('should have public and private subnets', async () => {
      const publicSubnets = [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id];
      const privateSubnets = [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id];

      const command = new DescribeSubnetsCommand({
        SubnetIds: [...publicSubnets, ...privateSubnets]
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets?.length).toBe(4);
    });

    it('should have security group created', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.LambdaSecurityGroupId]
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups?.length).toBe(1);
      expect(response.SecurityGroups?.[0].GroupId).toBe(outputs.LambdaSecurityGroupId);
    });

    it('should have VPC endpoints for S3 and DynamoDB', async () => {
      const command = new DescribeVpcEndpointsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId]
          }
        ]
      });

      const response = await ec2Client.send(command);
      expect(response.VpcEndpoints).toBeDefined();
      expect(response.VpcEndpoints?.length).toBeGreaterThanOrEqual(2);

      const serviceNames = response.VpcEndpoints?.map(ep => ep.ServiceName) || [];
      expect(serviceNames.some(name => name?.includes('s3'))).toBe(true);
      expect(serviceNames.some(name => name?.includes('dynamodb'))).toBe(true);
    });
  });

  describe('IAM Role Tests', () => {
    it('should have Lambda execution role created', async () => {
      const roleName = outputs.LambdaExecutionRoleArn.split('/').pop();
      const command = new GetRoleCommand({
        RoleName: roleName
      });

      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
    });

    it('should have trust relationship with Lambda service', async () => {
      const roleName = outputs.LambdaExecutionRoleArn.split('/').pop();
      const command = new GetRoleCommand({
        RoleName: roleName
      });

      const response = await iamClient.send(command);
      const trustPolicy = JSON.parse(decodeURIComponent(response.Role?.AssumeRolePolicyDocument || ''));
      expect(trustPolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
    });

    it('should have inline policies attached', async () => {
      const roleName = outputs.LambdaExecutionRoleArn.split('/').pop();
      const command = new ListRolePoliciesCommand({
        RoleName: roleName
      });

      const response = await iamClient.send(command);
      expect(response.PolicyNames).toBeDefined();
      expect(response.PolicyNames?.length).toBeGreaterThan(0);
      expect(response.PolicyNames).toContain('S3Access');
      expect(response.PolicyNames).toContain('DynamoDBAccess');
    });
  });

  describe('SNS Topics Tests', () => {
    it('should have policy compliance SNS topic created', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.PolicyComplianceTopicArn
      });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(outputs.PolicyComplianceTopicArn);
    });

    it('should have drift detection SNS topic created', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.DriftDetectionTopicArn
      });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(outputs.DriftDetectionTopicArn);
    });

    it('should have proper topic names with environment suffix', async () => {
      expect(outputs.PolicyComplianceTopicArn).toContain('policy-compliance-dev');
      expect(outputs.DriftDetectionTopicArn).toContain('cloudformation-drift-dev');
    });
  });

  describe('Service Catalog Tests', () => {
    it('should have Service Catalog portfolio created', async () => {
      const command = new DescribePortfolioCommand({
        Id: outputs.ServiceCatalogPortfolioId
      });

      const response = await serviceCatalogClient.send(command);
      expect(response.PortfolioDetail).toBeDefined();
      expect(response.PortfolioDetail?.Id).toBe(outputs.ServiceCatalogPortfolioId);
    });

    it('should have proper portfolio display name', async () => {
      const command = new DescribePortfolioCommand({
        Id: outputs.ServiceCatalogPortfolioId
      });

      const response = await serviceCatalogClient.send(command);
      expect(response.PortfolioDetail?.DisplayName).toContain('Analytics-Platform-dev');
    });
  });

  describe('CloudWatch Dashboard Tests', () => {
    it('should have CloudWatch dashboard created', async () => {
      const dashboardName = 'analytics-platform-dev';
      const command = new GetDashboardCommand({
        DashboardName: dashboardName
      });

      const response = await cloudWatchClient.send(command);
      expect(response.DashboardName).toBe(dashboardName);
      expect(response.DashboardBody).toBeDefined();
    });

    it('should have dashboard with widgets', async () => {
      const dashboardName = 'analytics-platform-dev';
      const command = new GetDashboardCommand({
        DashboardName: dashboardName
      });

      const response = await cloudWatchClient.send(command);
      const dashboardBody = JSON.parse(response.DashboardBody || '{}');
      expect(dashboardBody.widgets).toBeDefined();
      expect(dashboardBody.widgets.length).toBeGreaterThan(0);
    });
  });

  describe('CSV Processing Workflow Test', () => {
    const testFileName = `test-${Date.now()}.csv`;
    const testCSVContent = `id,name,value,timestamp
1,item1,100,2024-01-01T10:00:00
2,item2,200,2024-01-01T11:00:00
3,item3,300,2024-01-01T12:00:00`;

    it('should successfully upload CSV file to S3', async () => {
      const command = new PutObjectCommand({
        Bucket: outputs.DataBucketName,
        Key: testFileName,
        Body: testCSVContent,
        ServerSideEncryption: 'AES256'
      });

      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    it('should verify file was uploaded', async () => {
      const command = new GetObjectCommand({
        Bucket: outputs.DataBucketName,
        Key: testFileName
      });

      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);

      const content = await response.Body?.transformToString();
      expect(content).toBe(testCSVContent);
    });

    it('should verify metadata was stored in DynamoDB after processing', async () => {
      await new Promise(resolve => setTimeout(resolve, 15000));

      const command = new GetItemCommand({
        TableName: outputs.MetadataTableName,
        Key: {
          file_id: { S: testFileName }
        }
      });

      const response = await dynamoClient.send(command);
      expect(response.Item).toBeDefined();
      expect(response.Item?.file_id.S).toBe(testFileName);
      expect(response.Item?.processing_status.S).toBe('completed');
      expect(response.Item?.row_count.N).toBe('3');
    }, 30000);
  });

  describe('End-to-End Workflow Validation', () => {
    it('should have all components properly integrated', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.DataBucketName).toBeDefined();
      expect(outputs.MetadataTableName).toBeDefined();
      expect(outputs.CSVProcessorFunctionArn).toBeDefined();
      expect(outputs.LambdaExecutionRoleArn).toBeDefined();
      expect(outputs.PolicyComplianceTopicArn).toBeDefined();
      expect(outputs.DriftDetectionTopicArn).toBeDefined();
      expect(outputs.ServiceCatalogPortfolioId).toBeDefined();
      expect(outputs.DashboardURL).toBeDefined();
    });

    it('should have proper resource naming across all components', () => {
      const suffix = 'dev';
      expect(outputs.DataBucketName).toContain(suffix);
      expect(outputs.MetadataTableName).toContain(suffix);
      expect(outputs.CSVProcessorFunctionName).toContain(suffix);
      expect(outputs.PolicyComplianceTopicArn).toContain(suffix);
      expect(outputs.DriftDetectionTopicArn).toContain(suffix);
    });
  });
});
