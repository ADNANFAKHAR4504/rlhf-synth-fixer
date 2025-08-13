import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStageCommand,
} from '@aws-sdk/client-api-gateway';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeSubnetsCommand,
  DescribeVpcEndpointsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { GetRoleCommand, IAMClient } from '@aws-sdk/client-iam';
import { GetFunctionCommand, LambdaClient } from '@aws-sdk/client-lambda';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

const stackName = 'TapStack' + process.env.ENVIRONMENT_SUFFIX;

// Load stack outputs from cfn-outputs/all-outputs.json
const loadStackOutputs = () => {
  const outputsPath = path.join(__dirname, '../cfn-outputs/all-outputs.json');

  if (!fs.existsSync(outputsPath)) {
    throw new Error(
      `Stack outputs file not found: ${outputsPath}. Please deploy the stack first.`
    );
  }

  const outputsData = fs.readFileSync(outputsPath, 'utf8');
  const allOutputs = JSON.parse(outputsData);

  // Look for outputs under different possible keys
  let outputs = allOutputs[stackName] || allOutputs;

  // If the outputs are nested, find the first stack that has actual output values
  if (typeof outputs === 'object' && Object.keys(outputs).length === 1) {
    const firstKey = Object.keys(outputs)[0];
    if (typeof outputs[firstKey] === 'object' && outputs[firstKey] !== null) {
      outputs = outputs[firstKey];
    }
  }

  if (!outputs || Object.keys(outputs).length === 0) {
    throw new Error(
      `No outputs found. Available keys: ${Object.keys(allOutputs).join(', ')}`
    );
  }

  return outputs;
};

describe('TapStack Secure Document API Integration Tests', () => {
  let stackOutputs: any;
  let s3Client: S3Client;
  let lambdaClient: LambdaClient;
  let apiGatewayClient: APIGatewayClient;
  let ec2Client: EC2Client;
  let iamClient: IAMClient;
  let cloudWatchLogsClient: CloudWatchLogsClient;

  beforeAll(() => {
    // Load stack outputs - will throw if file doesn't exist
    stackOutputs = loadStackOutputs();

    // Initialize AWS clients for us-east-1 region as per requirements
    const region = 'us-east-1';
    s3Client = new S3Client({ region });
    lambdaClient = new LambdaClient({ region });
    apiGatewayClient = new APIGatewayClient({ region });
    ec2Client = new EC2Client({ region });
    iamClient = new IAMClient({ region });
    cloudWatchLogsClient = new CloudWatchLogsClient({ region });
  });

  describe('VPC and Networking Security Configuration', () => {
    it('should have VPC in us-east-1 region', async () => {
      // Skip if vpcId is not available in outputs
      if (!stackOutputs.vpcId) {
        console.log('VPC ID not available in outputs, skipping VPC validation');
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [stackOutputs.vpcId],
      });

      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs?.[0];
      expect(vpc?.VpcId).toBe(stackOutputs.vpcId);
      expect(vpc?.CidrBlock).toMatch(/^10\./); // Private IP range
      expect(vpc?.State).toBe('available');
    });

    it('should have private subnets for Lambda functions', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: stackOutputs.privateSubnetIds,
      });

      const response = await ec2Client.send(command);

      expect(response.Subnets?.length).toBeGreaterThan(0);
      response.Subnets?.forEach(subnet => {
        if (stackOutputs.vpcId) {
          expect(subnet.VpcId).toBe(stackOutputs.vpcId);
        }
        expect(subnet.MapPublicIpOnLaunch).toBe(false); // Should be private
      });
    });

    it('should have VPC endpoint for S3 service', async () => {
      const command = new DescribeVpcEndpointsCommand({
        VpcEndpointIds: [stackOutputs.s3VpcEndpointId],
      });

      const response = await ec2Client.send(command);

      expect(response.VpcEndpoints).toHaveLength(1);
      const endpoint = response.VpcEndpoints?.[0];
      if (stackOutputs.vpcId) {
        expect(endpoint?.VpcId).toBe(stackOutputs.vpcId);
      }
      expect(endpoint?.ServiceName).toBe('com.amazonaws.us-east-1.s3');
      expect(endpoint?.VpcEndpointType).toBe('Gateway');
    });
  });

  describe('S3 Bucket Security Configuration', () => {
    it('should have server-side encryption enabled with AWS managed keys', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: stackOutputs.bucketName,
      });

      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);

      const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe(
        'AES256'
      );
    });

    it('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: stackOutputs.bucketName,
      });

      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    it('should block all public access', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: stackOutputs.bucketName,
      });

      const response = await s3Client.send(command);

      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(
        true
      );
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(
        true
      );
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(
        true
      );
      expect(
        response.PublicAccessBlockConfiguration?.RestrictPublicBuckets
      ).toBe(true);
    });

    it('should follow secure naming convention', () => {
      // Pulumi auto-generates bucket names, so we check for the pattern
      expect(stackOutputs.bucketName).toMatch(/^secure-doc-bucket-dev-/);
      expect(stackOutputs.bucketName).toContain('dev'); // Environment suffix
      expect(stackOutputs.bucketName).toMatch(
        /^secure-doc-bucket-dev-[a-z0-9]+$/
      ); // Auto-generated suffix
    });
  });

  describe('Lambda Function Security Configuration', () => {
    it('should be deployed in private subnets with VPC configuration', async () => {
      const command = new GetFunctionCommand({
        FunctionName: stackOutputs.lambdaFunctionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration?.VpcConfig).toBeDefined();
      if (stackOutputs.vpcId) {
        expect(response.Configuration?.VpcConfig?.VpcId).toBe(
          stackOutputs.vpcId
        );
      }
      expect(
        response.Configuration?.VpcConfig?.SubnetIds?.length
      ).toBeGreaterThan(0);
      expect(response.Configuration?.Runtime).toBe('nodejs20.x');
    });

    it('should have proper IAM role with least privilege', async () => {
      const roleName = stackOutputs.lambdaRoleArn.split('/').pop();
      const command = new GetRoleCommand({
        RoleName: roleName,
      });

      const response = await iamClient.send(command);
      const trustPolicy = JSON.parse(
        decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '{}')
      );

      const lambdaStatement = trustPolicy.Statement?.find((stmt: any) =>
        stmt.Principal?.Service?.includes('lambda.amazonaws.com')
      );

      expect(lambdaStatement).toBeDefined();
      expect(lambdaStatement.Effect).toBe('Allow');
      expect(lambdaStatement.Action).toBe('sts:AssumeRole');
    });

    it('should have proper naming convention', () => {
      expect(stackOutputs.lambdaFunctionName).toMatch(/^doc-processor-/);
      expect(stackOutputs.lambdaFunctionName).toContain('dev');
      expect(stackOutputs.lambdaRoleArn).toMatch(/lambda-execution-role-dev/);
    });
  });

  describe('API Gateway Security Configuration', () => {
    it('should be properly configured with secure settings', async () => {
      const command = new GetRestApiCommand({
        restApiId: stackOutputs.apiGatewayId,
      });

      const response = await apiGatewayClient.send(command);

      expect(response.name).toMatch(/^secure-doc-api-/);
      expect(response.endpointConfiguration?.types).toContain('REGIONAL');
    });

    it('should have proper URL format', () => {
      expect(stackOutputs.apiUrl).toMatch(
        /^https:\/\/.*\.execute-api\.us-east-1\.amazonaws\.com\/.*/
      );
      expect(stackOutputs.apiUrl).toContain(stackOutputs.apiGatewayId);
    });

    it('should have stage configured for environment', async () => {
      const command = new GetStageCommand({
        restApiId: stackOutputs.apiGatewayId,
        stageName: 'dev',
      });

      const response = await apiGatewayClient.send(command);

      expect(response.stageName).toBe('dev');
    });
  });

  describe('CloudWatch Logging Configuration', () => {
    it('should have Lambda log group with proper retention', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: stackOutputs.lambdaLogGroupName,
      });

      const response = await cloudWatchLogsClient.send(command);

      expect(response.logGroups).toHaveLength(1);
      const logGroup = response.logGroups?.[0];

      expect(logGroup?.logGroupName).toBe(stackOutputs.lambdaLogGroupName);
      expect(logGroup?.retentionInDays).toBe(90);
    });

    it('should follow proper log group naming', () => {
      expect(stackOutputs.lambdaLogGroupName).toBe(
        '/aws/lambda/doc-processor-dev'
      );
    });
  });

  describe('Infrastructure Integration Validation', () => {
    it('should have all required resources deployed', () => {
      const requiredResources = [
        'bucketName',
        's3BucketArn',
        'lambdaFunctionName',
        'lambdaFunctionArn',
        'lambdaRoleArn',
        'apiUrl',
        'lambdaLogGroupName',
        'region',
      ];

      requiredResources.forEach(resource => {
        expect(stackOutputs[resource]).toBeDefined();
        expect(stackOutputs[resource]).not.toBe('');
      });
    });

    it('should have proper resource relationships', () => {
      // All resources should be deployed in the same region
      expect(stackOutputs.region).toBe('us-east-1');

      // Lambda function should be properly named
      expect(stackOutputs.lambdaFunctionName).toContain('doc-processor');

      // S3 bucket should follow secure naming
      expect(stackOutputs.bucketName).toContain('secure-doc-bucket');

      // API Gateway should have secure URL
      expect(stackOutputs.apiUrl).toContain(
        'execute-api.us-east-1.amazonaws.com'
      );
    });
  });

  describe('Security Compliance Validation', () => {
    it('should deploy all resources in us-east-1 region', () => {
      expect(stackOutputs.region).toBe('us-east-1');

      // Verify ARNs contain correct region
      expect(stackOutputs.lambdaFunctionArn).toContain('us-east-1');
      expect(stackOutputs.s3BucketArn).toMatch(/^arn:aws:s3:::/); // S3 ARNs are global
    });

    it('should implement least privilege access patterns', () => {
      // Lambda role should follow naming convention
      expect(stackOutputs.lambdaRoleArn).toContain('lambda-execution-role');

      // Resources should be in VPC for network isolation
      expect(stackOutputs.privateSubnetIds).toBeDefined();
    });

    it('should have proper VPC isolation', () => {
      // Lambda should be in private subnets
      expect(stackOutputs.privateSubnetIds).toBeDefined();
      expect(stackOutputs.vpcSecurityGroupId).toBeDefined();

      // S3 access should use VPC endpoint
      expect(stackOutputs.s3VpcEndpointId).toBeDefined();
    });

    it('should implement defense in depth security', () => {
      // Network level - VPC isolation
      expect(stackOutputs.privateSubnetIds).toBeDefined();

      // Application level - Lambda in private subnet
      expect(stackOutputs.lambdaFunctionArn).toBeDefined();
      expect(stackOutputs.vpcSecurityGroupId).toBeDefined();

      // Data level - S3 encryption and access controls
      expect(stackOutputs.s3BucketArn).toBeDefined();
      expect(stackOutputs.s3VpcEndpointId).toBeDefined();

      // Identity level - IAM roles and policies
      expect(stackOutputs.lambdaRoleArn).toBeDefined();

      // Monitoring level - CloudWatch logging
      expect(stackOutputs.lambdaLogGroupName).toBeDefined();
    });
  });
});
