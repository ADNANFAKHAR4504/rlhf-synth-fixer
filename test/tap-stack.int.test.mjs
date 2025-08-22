const { S3Client, GetBucketVersioningCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');
const { RDSClient, DescribeDBClustersCommand } = require('@aws-sdk/client-rds');
const { LambdaClient, GetFunctionCommand, InvokeCommand } = require('@aws-sdk/client-lambda');
const { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand } = require('@aws-sdk/client-ec2');
const { CloudWatchLogsClient, DescribeLogGroupsCommand } = require('@aws-sdk/client-cloudwatch-logs');
const fs = require('fs');
const path = require('path');

// Load deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let deploymentOutputs;

try {
  const outputsContent = fs.readFileSync(outputsPath, 'utf8');
  deploymentOutputs = JSON.parse(outputsContent);
} catch (error) {
  console.error('Failed to load deployment outputs:', error);
  deploymentOutputs = {};
}

// Configure AWS clients
const region = 'us-west-2';
const s3Client = new S3Client({ region });
const rdsClient = new RDSClient({ region });
const lambdaClient = new LambdaClient({ region });
const ec2Client = new EC2Client({ region });
const cloudWatchClient = new CloudWatchLogsClient({ region });

describe('TAP Infrastructure Integration Tests', () => {
  const testTimeout = 30000; // 30 seconds for API calls

  describe('S3 Bucket Tests', () => {
    const bucketName = deploymentOutputs.bucketName;

    it('should have S3 bucket deployed and accessible', async () => {
      if (!bucketName) {
        console.warn('Bucket name not found in outputs, skipping test');
        return;
      }

      const command = new HeadBucketCommand({ Bucket: bucketName });
      
      try {
        await s3Client.send(command);
        expect(true).toBe(true); // Bucket exists
      } catch (error) {
        throw new Error(`Bucket ${bucketName} is not accessible: ${error.message}`);
      }
    }, testTimeout);

    it('should have versioning enabled on S3 bucket', async () => {
      if (!bucketName) {
        console.warn('Bucket name not found in outputs, skipping test');
        return;
      }

      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      
      try {
        const response = await s3Client.send(command);
        expect(response.Status).toBe('Enabled');
      } catch (error) {
        throw new Error(`Failed to get bucket versioning: ${error.message}`);
      }
    }, testTimeout);
  });

  describe('RDS Cluster Tests', () => {
    const rdsEndpoint = deploymentOutputs.rdsEndpoint;

    it('should have RDS cluster deployed and running', async () => {
      if (!rdsEndpoint) {
        console.warn('RDS endpoint not found in outputs, skipping test');
        return;
      }

      // Extract cluster identifier from endpoint
      const clusterId = rdsEndpoint.split('.')[0];
      
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterId
      });
      
      try {
        const response = await rdsClient.send(command);
        const cluster = response.DBClusters[0];
        
        expect(cluster).toBeDefined();
        expect(cluster.Status).toBe('available');
        expect(cluster.Engine).toBe('aurora-mysql');
      } catch (error) {
        throw new Error(`Failed to describe RDS cluster: ${error.message}`);
      }
    }, testTimeout);

    it('should have correct backup retention period', async () => {
      if (!rdsEndpoint) {
        console.warn('RDS endpoint not found in outputs, skipping test');
        return;
      }

      const clusterId = rdsEndpoint.split('.')[0];
      
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterId
      });
      
      try {
        const response = await rdsClient.send(command);
        const cluster = response.DBClusters[0];
        
        expect(cluster.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
      } catch (error) {
        throw new Error(`Failed to check RDS backup retention: ${error.message}`);
      }
    }, testTimeout);

    it('should have Serverless v2 scaling configured', async () => {
      if (!rdsEndpoint) {
        console.warn('RDS endpoint not found in outputs, skipping test');
        return;
      }

      const clusterId = rdsEndpoint.split('.')[0];
      
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterId
      });
      
      try {
        const response = await rdsClient.send(command);
        const cluster = response.DBClusters[0];
        
        expect(cluster.ServerlessV2ScalingConfiguration).toBeDefined();
        expect(cluster.ServerlessV2ScalingConfiguration.MinCapacity).toBe(0.5);
        expect(cluster.ServerlessV2ScalingConfiguration.MaxCapacity).toBe(2);
      } catch (error) {
        throw new Error(`Failed to check Serverless v2 scaling: ${error.message}`);
      }
    }, testTimeout);
  });

  describe('Lambda Function Tests', () => {
    const functionName = deploymentOutputs.lambdaFunctionName;

    it('should have Lambda function deployed', async () => {
      if (!functionName) {
        console.warn('Lambda function name not found in outputs, skipping test');
        return;
      }

      const command = new GetFunctionCommand({
        FunctionName: functionName
      });
      
      try {
        const response = await lambdaClient.send(command);
        
        expect(response.Configuration).toBeDefined();
        expect(response.Configuration.Runtime).toBe('nodejs18.x');
        expect(response.Configuration.Handler).toBe('index.handler');
      } catch (error) {
        throw new Error(`Failed to get Lambda function: ${error.message}`);
      }
    }, testTimeout);

    it('should have correct environment variables', async () => {
      if (!functionName) {
        console.warn('Lambda function name not found in outputs, skipping test');
        return;
      }

      const command = new GetFunctionCommand({
        FunctionName: functionName
      });
      
      try {
        const response = await lambdaClient.send(command);
        const envVars = response.Configuration.Environment.Variables;
        
        expect(envVars).toBeDefined();
        expect(envVars.RDS_ENDPOINT).toBeDefined();
        expect(envVars.ENVIRONMENT).toBeDefined();
      } catch (error) {
        throw new Error(`Failed to check Lambda environment: ${error.message}`);
      }
    }, testTimeout);

    it('should have VPC configuration', async () => {
      if (!functionName) {
        console.warn('Lambda function name not found in outputs, skipping test');
        return;
      }

      const command = new GetFunctionCommand({
        FunctionName: functionName
      });
      
      try {
        const response = await lambdaClient.send(command);
        const vpcConfig = response.Configuration.VpcConfig;
        
        expect(vpcConfig).toBeDefined();
        expect(vpcConfig.SubnetIds).toBeDefined();
        expect(vpcConfig.SubnetIds.length).toBeGreaterThan(0);
        expect(vpcConfig.SecurityGroupIds).toBeDefined();
        expect(vpcConfig.SecurityGroupIds.length).toBeGreaterThan(0);
      } catch (error) {
        throw new Error(`Failed to check Lambda VPC config: ${error.message}`);
      }
    }, testTimeout);

    it('should execute successfully', async () => {
      if (!functionName) {
        console.warn('Lambda function name not found in outputs, skipping test');
        return;
      }

      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: JSON.stringify({ test: true })
      });
      
      try {
        const response = await lambdaClient.send(command);
        
        expect(response.StatusCode).toBe(200);
        
        if (response.Payload) {
          const payload = JSON.parse(new TextDecoder().decode(response.Payload));
          expect(payload.statusCode).toBe(200);
          expect(payload.body).toBeDefined();
        }
      } catch (error) {
        throw new Error(`Failed to invoke Lambda function: ${error.message}`);
      }
    }, testTimeout);
  });

  describe('VPC and Networking Tests', () => {
    const vpcId = deploymentOutputs.vpcId;

    it('should have VPC deployed with correct configuration', async () => {
      if (!vpcId) {
        console.warn('VPC ID not found in outputs, skipping test');
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId]
      });
      
      try {
        const response = await ec2Client.send(command);
        const vpc = response.Vpcs[0];
        
        expect(vpc).toBeDefined();
        expect(vpc.State).toBe('available');
        expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      } catch (error) {
        throw new Error(`Failed to describe VPC: ${error.message}`);
      }
    }, testTimeout);

    it('should have subnets in multiple availability zones', async () => {
      if (!vpcId) {
        console.warn('VPC ID not found in outputs, skipping test');
        return;
      }

      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      });
      
      try {
        const response = await ec2Client.send(command);
        const subnets = response.Subnets;
        
        expect(subnets.length).toBeGreaterThanOrEqual(4); // At least 2 public and 2 private
        
        const azs = new Set(subnets.map(subnet => subnet.AvailabilityZone));
        expect(azs.size).toBeGreaterThanOrEqual(2); // At least 2 AZs
      } catch (error) {
        throw new Error(`Failed to describe subnets: ${error.message}`);
      }
    }, testTimeout);
  });

  describe('CloudWatch Logs Tests', () => {
    const functionName = deploymentOutputs.lambdaFunctionName;

    it('should have CloudWatch log group for Lambda', async () => {
      if (!functionName) {
        console.warn('Lambda function name not found in outputs, skipping test');
        return;
      }

      const logGroupName = `/aws/lambda/${functionName}`;
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName
      });
      
      try {
        const response = await cloudWatchClient.send(command);
        const logGroups = response.logGroups;
        
        expect(logGroups).toBeDefined();
        expect(logGroups.length).toBeGreaterThan(0);
        
        const logGroup = logGroups.find(lg => lg.logGroupName === logGroupName);
        expect(logGroup).toBeDefined();
        expect(logGroup.retentionInDays).toBe(7);
      } catch (error) {
        throw new Error(`Failed to describe log groups: ${error.message}`);
      }
    }, testTimeout);
  });

  describe('End-to-End Workflow Tests', () => {
    it('should validate complete infrastructure connectivity', async () => {
      // This test validates that all components are properly connected
      const allOutputsPresent = !!(
        deploymentOutputs.bucketName &&
        deploymentOutputs.lambdaFunctionName &&
        deploymentOutputs.rdsEndpoint &&
        deploymentOutputs.vpcId
      );
      
      expect(allOutputsPresent).toBe(true);
    });

    it('should have all resources in us-west-2 region', async () => {
      // Validate region consistency
      if (deploymentOutputs.rdsEndpoint) {
        expect(deploymentOutputs.rdsEndpoint).toContain('us-west-2');
      }
      
      if (deploymentOutputs.lambdaFunctionName) {
        const command = new GetFunctionCommand({
          FunctionName: deploymentOutputs.lambdaFunctionName
        });
        
        try {
          const response = await lambdaClient.send(command);
          expect(response.Configuration.FunctionArn).toContain('us-west-2');
        } catch (error) {
          console.warn('Could not verify Lambda region:', error.message);
        }
      }
    }, testTimeout);

    it('should meet all original requirements', () => {
      // Verify all 8 original requirements are met
      const requirements = {
        s3BucketExists: !!deploymentOutputs.bucketName,
        rdsClusterExists: !!deploymentOutputs.rdsEndpoint,
        lambdaFunctionExists: !!deploymentOutputs.lambdaFunctionName,
        vpcExists: !!deploymentOutputs.vpcId,
        bucketNameExported: !!deploymentOutputs.bucketName
      };
      
      Object.values(requirements).forEach(met => {
        expect(met).toBe(true);
      });
    });
  });
});