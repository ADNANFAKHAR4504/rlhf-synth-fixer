// Integration tests for Payment Processing Stack
// These tests dynamically discover the deployed stack and validate all resources
import {
  CloudFormationClient,
  DescribeStacksCommand,
  ListStacksCommand,
  ListStackResourcesCommand,
} from '@aws-sdk/client-cloudformation';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetGroupsCommand } from '@aws-sdk/client-elastic-load-balancing-v2';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { S3Client, HeadBucketCommand, GetBucketVersioningCommand, GetBucketEncryptionCommand } from '@aws-sdk/client-s3';
import { SQSClient, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';

interface DiscoveredResources {
  stackName: string;
  environmentSuffix: string;
  outputs: Record<string, string>;
  resources: Map<string, { logicalId: string; physicalId: string; resourceType: string }>;
  stackStatus: string;
}

describe('Payment Processing Stack - Integration Tests', () => {
  let discovered: DiscoveredResources;
  const region = process.env.AWS_REGION || 'us-east-1';

  // Initialize AWS clients
  const cfnClient = new CloudFormationClient({ region });
  const ec2Client = new EC2Client({ region });
  const elbClient = new ElasticLoadBalancingV2Client({ region });
  const rdsClient = new RDSClient({ region });
  const s3Client = new S3Client({ region });
  const sqsClient = new SQSClient({ region });
  const lambdaClient = new LambdaClient({ region });

  beforeAll(async () => {
    // Dynamically discover the stack and all resources
    discovered = await discoverStackAndResources(cfnClient);
    
    console.log(`✅ Discovered stack: ${discovered.stackName}`);
    console.log(`✅ Environment suffix: ${discovered.environmentSuffix}`);
    console.log(`✅ Stack status: ${discovered.stackStatus}`);
    console.log(`✅ Found ${Object.keys(discovered.outputs).length} outputs`);
    console.log(`✅ Found ${discovered.resources.size} resources`);
  }, 30000); // 30 second timeout for discovery

  /**
   * Dynamically discover the CloudFormation stack and all its resources
   */
  async function discoverStackAndResources(cfnClient: CloudFormationClient): Promise<DiscoveredResources> {
    const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
    
    // Try to get stack name from environment variable first
    let stackName: string | undefined = process.env.STACK_NAME;
    
    // If ENVIRONMENT_SUFFIX is provided, construct stack name
    if (!stackName) {
      stackName = `TapStack${environmentSuffix}`;
    }

    // Try to find the stack by exact name first
    if (stackName) {
      try {
        const describeCommand = new DescribeStacksCommand({ StackName: stackName });
        const response = await cfnClient.send(describeCommand);
        if (response.Stacks && response.Stacks.length > 0) {
          const stackStatus = response.Stacks[0].StackStatus;
          if (stackStatus === 'CREATE_COMPLETE' || stackStatus === 'UPDATE_COMPLETE') {
            return await extractStackResources(cfnClient, stackName);
          }
        }
      } catch (error: any) {
        console.log(`Stack ${stackName} not found, falling back to discovery: ${error.message}`);
      }
    }

    // Fallback: Discover stack by pattern
    // Include REVIEW_IN_PROGRESS to catch stacks that are being created
    const listCommand = new ListStacksCommand({
      StackStatusFilter: ['CREATE_COMPLETE', 'UPDATE_COMPLETE', 'REVIEW_IN_PROGRESS'],
    });

    const stacks = await cfnClient.send(listCommand);
    
    // Find stacks matching TapStack pattern, prioritizing exact matches
    // Filter out nested stacks (those with hyphens after TapStack)
    const tapStacks = (stacks.StackSummaries || [])
      .filter((stack) => {
        const name = stack.StackName || '';
        // Match TapStack{suffix} pattern but exclude nested stacks
        return name.startsWith('TapStack') && 
               !name.includes('-') && // Exclude nested stacks
               (stack.StackStatus === 'CREATE_COMPLETE' || 
                stack.StackStatus === 'UPDATE_COMPLETE' ||
                stack.StackStatus === 'REVIEW_IN_PROGRESS');
      })
      .sort((a, b) => {
        const aTime = a.CreationTime?.getTime() || 0;
        const bTime = b.CreationTime?.getTime() || 0;
        return bTime - aTime; // Newest first
      });

    if (tapStacks.length === 0) {
      throw new Error(
        `No TapStack found. Searched for: TapStack${environmentSuffix} or TapStack*. ` +
        `Please deploy the stack first using: npm run cfn:deploy-json`
      );
    }

    const selectedStack = tapStacks[0];
    return await extractStackResources(cfnClient, selectedStack.StackName!);
  }

  /**
   * Extract all resources and outputs from a stack
   */
  async function extractStackResources(
    cfnClient: CloudFormationClient,
    stackName: string
  ): Promise<DiscoveredResources> {
    // Get stack details including outputs
    const describeCommand = new DescribeStacksCommand({ StackName: stackName });
    const stackResponse = await cfnClient.send(describeCommand);
    
    if (!stackResponse.Stacks || stackResponse.Stacks.length === 0) {
      throw new Error(`Stack ${stackName} not found`);
    }

    const stack = stackResponse.Stacks[0];
    const stackStatus = stack.StackStatus || 'UNKNOWN';
    
    // Allow REVIEW_IN_PROGRESS for stacks that are being created/updated
    if (stackStatus !== 'CREATE_COMPLETE' && 
        stackStatus !== 'UPDATE_COMPLETE' && 
        stackStatus !== 'REVIEW_IN_PROGRESS') {
      throw new Error(`Stack ${stackName} is not in a valid state. Current status: ${stackStatus}`);
    }
    
    // Extract outputs dynamically
    const outputs: Record<string, string> = {};
    if (stack.Outputs) {
      for (const output of stack.Outputs) {
        if (output.OutputKey && output.OutputValue) {
          outputs[output.OutputKey] = output.OutputValue;
        }
      }
    }

    // Extract environment suffix from stack name (TapStack{suffix})
    const environmentSuffix = stackName.replace(/^TapStack/, '') || 'dev';

    // Get all stack resources dynamically
    const resources = new Map<string, { logicalId: string; physicalId: string; resourceType: string }>();
    let nextToken: string | undefined;
    
    do {
      const resourcesCommand = new ListStackResourcesCommand({
        StackName: stackName,
        NextToken: nextToken,
      });
      const resourcesResponse = await cfnClient.send(resourcesCommand);
      
      if (resourcesResponse.StackResourceSummaries) {
        for (const resource of resourcesResponse.StackResourceSummaries) {
          if (resource.LogicalResourceId && resource.PhysicalResourceId) {
            resources.set(resource.LogicalResourceId, {
              logicalId: resource.LogicalResourceId,
              physicalId: resource.PhysicalResourceId,
              resourceType: resource.ResourceType || 'Unknown',
            });
          }
        }
      }
      
      nextToken = resourcesResponse.NextToken;
    } while (nextToken);

    return {
      stackName,
      environmentSuffix,
      outputs,
      resources,
      stackStatus,
    };
  }

  describe('Stack Discovery and Validation', () => {
    test('should discover stack successfully', () => {
      expect(discovered.stackName).toBeDefined();
      expect(discovered.stackName).toMatch(/^TapStack/);
      expect(discovered.environmentSuffix).toBeDefined();
      // Allow REVIEW_IN_PROGRESS for stacks being created
      expect(discovered.stackStatus).toMatch(/(COMPLETE$|REVIEW_IN_PROGRESS)/);
    });

    test('should have all required outputs', () => {
      expect(discovered.outputs.VPCId).toBeDefined();
      expect(discovered.outputs.LoadBalancerDNS).toBeDefined();
      expect(discovered.outputs.RDSEndpoint).toBeDefined();
      expect(discovered.outputs.PaymentLogsBucketName).toBeDefined();
      expect(discovered.outputs.TransactionArchiveBucketName).toBeDefined();
      expect(discovered.outputs.PaymentQueueURL).toBeDefined();
      expect(discovered.outputs.LambdaFunctionArn).toBeDefined();
    });

    test('VPCId should be a valid VPC ID format', () => {
      expect(discovered.outputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test('LoadBalancerDNS should be a valid DNS format', () => {
      expect(discovered.outputs.LoadBalancerDNS).toMatch(/\.elb\./);
    });

    test('RDSEndpoint should be a valid RDS endpoint format', () => {
      expect(discovered.outputs.RDSEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
    });

    test('bucket names should contain environment suffix', () => {
      expect(discovered.outputs.PaymentLogsBucketName).toContain(discovered.environmentSuffix);
      expect(discovered.outputs.TransactionArchiveBucketName).toContain(discovered.environmentSuffix);
    });

    test('SQS queue URL should be valid', () => {
      expect(discovered.outputs.PaymentQueueURL).toMatch(/^https:\/\/sqs\./);
      expect(discovered.outputs.PaymentQueueURL).toContain(discovered.environmentSuffix);
    });

    test('Lambda ARN should be valid', () => {
      expect(discovered.outputs.LambdaFunctionArn).toMatch(/^arn:aws:lambda:/);
      expect(discovered.outputs.LambdaFunctionArn).toContain(discovered.environmentSuffix);
    });
  });

  describe('VPC Configuration', () => {
    test('VPC should exist and be available', async () => {
      const vpcId = discovered.outputs.VPCId;
      expect(vpcId).toBeDefined();
      
      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId]
      });
      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    });

    test('should have correct subnets', async () => {
      const vpcId = discovered.outputs.VPCId;
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      });
      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(4); // 2 public + 2 private

      const publicSubnets = response.Subnets!.filter(subnet =>
        subnet.MapPublicIpOnLaunch === true
      );
      expect(publicSubnets).toHaveLength(2);

      const privateSubnets = response.Subnets!.filter(subnet =>
        subnet.MapPublicIpOnLaunch === false
      );
      expect(privateSubnets).toHaveLength(2);
    });

    test('should have security groups created', async () => {
      const vpcId = discovered.outputs.VPCId;
      // Get ALB security group from resources
      const albSgResource = discovered.resources.get('ALBSecurityGroup');
      expect(albSgResource).toBeDefined();
      
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          },
          {
            Name: 'group-id',
            Values: [albSgResource!.physicalId]
          }
        ]
      });
      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);
    });
  });

  describe('Load Balancer Configuration', () => {
    test('ALB should be active and accessible', async () => {
      const dnsName = discovered.outputs.LoadBalancerDNS;
      expect(dnsName).toBeDefined();
      
      // Get ALB resource from stack
      const albResource = discovered.resources.get('ApplicationLoadBalancer');
      expect(albResource).toBeDefined();
      
      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [albResource!.physicalId]
      });
      const response = await elbClient.send(command);
      expect(response.LoadBalancers).toHaveLength(1);
      expect(response.LoadBalancers![0].State?.Code).toBe('active');
      expect(response.LoadBalancers![0].Scheme).toBe('internet-facing');
      expect(response.LoadBalancers![0].Type).toBe('application');
      expect(response.LoadBalancers![0].DNSName).toBe(dnsName);
    });

    test('target group should exist with health check configuration', async () => {
      // Get target group resource from stack
      const tgResource = discovered.resources.get('ALBTargetGroup');
      expect(tgResource).toBeDefined();
      
      const command = new DescribeTargetGroupsCommand({
        TargetGroupArns: [tgResource!.physicalId]
      });
      const response = await elbClient.send(command);
      expect(response.TargetGroups).toHaveLength(1);
      expect(response.TargetGroups![0].HealthCheckEnabled).toBe(true);
      expect(response.TargetGroups![0].HealthCheckPath).toBe('/health');
      expect(response.TargetGroups![0].HealthCheckIntervalSeconds).toBe(30);
    });
  });

  describe('RDS Database Configuration', () => {
    test('RDS instance should be available', async () => {
      // Get RDS instance resource from stack
      const rdsResource = discovered.resources.get('RDSInstance');
      expect(rdsResource).toBeDefined();
      
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: rdsResource!.physicalId
      });
      const response = await rdsClient.send(command);
      expect(response.DBInstances).toHaveLength(1);
      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.Engine).toBe('postgres');
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.PubliclyAccessible).toBe(false);
      expect(dbInstance.BackupRetentionPeriod).toBe(7);
    });

    test('RDS endpoint should match stack output', async () => {
      // Get RDS instance resource from stack
      const rdsResource = discovered.resources.get('RDSInstance');
      expect(rdsResource).toBeDefined();
      
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: rdsResource!.physicalId
      });
      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances![0];
      expect(dbInstance.Endpoint?.Address).toBe(discovered.outputs.RDSEndpoint);
    });
  });

  describe('S3 Buckets Configuration', () => {
    test('PaymentLogsBucket should exist and be accessible', async () => {
      const bucketName = discovered.outputs.PaymentLogsBucketName;
      expect(bucketName).toBeDefined();
      
      const command = new HeadBucketCommand({
        Bucket: bucketName
      });
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    test('PaymentLogsBucket should have versioning enabled', async () => {
      const bucketName = discovered.outputs.PaymentLogsBucketName;
      const command = new GetBucketVersioningCommand({
        Bucket: bucketName
      });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('PaymentLogsBucket should have encryption enabled', async () => {
      const bucketName = discovered.outputs.PaymentLogsBucketName;
      const command = new GetBucketEncryptionCommand({
        Bucket: bucketName
      });
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules).toHaveLength(1);
      expect(response.ServerSideEncryptionConfiguration!.Rules[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('TransactionArchiveBucket should exist and be accessible', async () => {
      const bucketName = discovered.outputs.TransactionArchiveBucketName;
      expect(bucketName).toBeDefined();
      
      const command = new HeadBucketCommand({
        Bucket: bucketName
      });
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    test('TransactionArchiveBucket should have versioning enabled', async () => {
      const bucketName = discovered.outputs.TransactionArchiveBucketName;
      const command = new GetBucketVersioningCommand({
        Bucket: bucketName
      });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('TransactionArchiveBucket should have encryption enabled', async () => {
      const bucketName = discovered.outputs.TransactionArchiveBucketName;
      const command = new GetBucketEncryptionCommand({
        Bucket: bucketName
      });
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules).toHaveLength(1);
      expect(response.ServerSideEncryptionConfiguration!.Rules[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });
  });

  describe('SQS Queue Configuration', () => {
    test('PaymentQueue should exist with correct configuration', async () => {
      const queueUrl = discovered.outputs.PaymentQueueURL;
      expect(queueUrl).toBeDefined();
      
      const command = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['All']
      });
      const response = await sqsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.QueueArn).toContain(discovered.environmentSuffix);
      expect(response.Attributes!.MessageRetentionPeriod).toBe('345600');
      expect(response.Attributes!.ReceiveMessageWaitTimeSeconds).toBe('20');
    });

    test('PaymentQueue should have dead letter queue configured', async () => {
      const queueUrl = discovered.outputs.PaymentQueueURL;
      const command = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['RedrivePolicy']
      });
      const response = await sqsClient.send(command);
      expect(response.Attributes?.RedrivePolicy).toBeDefined();
      const redrivePolicy = JSON.parse(response.Attributes!.RedrivePolicy!);
      expect(redrivePolicy.maxReceiveCount).toBe(3);
      expect(redrivePolicy.deadLetterTargetArn).toContain('payment-dlq');
    });
  });

  describe('Lambda Function Configuration', () => {
    test('PaymentValidationFunction should exist and be active', async () => {
      const functionArn = discovered.outputs.LambdaFunctionArn;
      expect(functionArn).toBeDefined();
      
      const functionName = functionArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName!
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.State).toBe('Active');
      expect(response.Configuration!.Runtime).toBe('python3.11');
      expect(response.Configuration!.Handler).toBe('index.lambda_handler');
      expect(response.Configuration!.Timeout).toBe(60);
      expect(response.Configuration!.MemorySize).toBe(256);
    });

    test('Lambda function should have correct environment variables', async () => {
      const functionArn = discovered.outputs.LambdaFunctionArn;
      const functionName = functionArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName!
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      expect(response.Configuration!.Environment!.Variables!.LOGS_BUCKET).toBe(discovered.outputs.PaymentLogsBucketName);
      expect(response.Configuration!.Environment!.Variables!.ENVIRONMENT).toBeDefined();
    });

    test('Lambda function should be in VPC', async () => {
      const functionArn = discovered.outputs.LambdaFunctionArn;
      const functionName = functionArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName!
      });
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.VpcConfig).toBeDefined();
      expect(response.Configuration!.VpcConfig!.VpcId).toBe(discovered.outputs.VPCId);
      expect(response.Configuration!.VpcConfig!.SubnetIds).toHaveLength(2);
      expect(response.Configuration!.VpcConfig!.SecurityGroupIds).toHaveLength(1);
    });
  });

  describe('Resource Naming Conventions', () => {
    test('all resources should include environment suffix', () => {
      expect(discovered.outputs.PaymentLogsBucketName).toContain(discovered.environmentSuffix);
      expect(discovered.outputs.TransactionArchiveBucketName).toContain(discovered.environmentSuffix);
      expect(discovered.outputs.PaymentQueueURL).toContain(discovered.environmentSuffix);
      expect(discovered.outputs.LambdaFunctionArn).toContain(discovered.environmentSuffix);
      expect(discovered.outputs.LoadBalancerDNS).toContain(discovered.environmentSuffix);
    });
  });

  describe('End-to-End Workflow', () => {
    test('all critical infrastructure components should be operational', async () => {
      // VPC should be available
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [discovered.outputs.VPCId]
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      expect(vpcResponse.Vpcs![0].State).toBe('available');

      // ALB should be active
      const albResource = discovered.resources.get('ApplicationLoadBalancer');
      const albCommand = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [albResource!.physicalId]
      });
      const albResponse = await elbClient.send(albCommand);
      expect(albResponse.LoadBalancers![0].State?.Code).toBe('active');

      // RDS should be available
      const rdsResource = discovered.resources.get('RDSInstance');
      const rdsCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: rdsResource!.physicalId
      });
      const rdsResponse = await rdsClient.send(rdsCommand);
      expect(rdsResponse.DBInstances![0].DBInstanceStatus).toBe('available');

      // S3 buckets should be accessible
      await expect(s3Client.send(new HeadBucketCommand({
        Bucket: discovered.outputs.PaymentLogsBucketName
      }))).resolves.toBeDefined();

      await expect(s3Client.send(new HeadBucketCommand({
        Bucket: discovered.outputs.TransactionArchiveBucketName
      }))).resolves.toBeDefined();

      // SQS queue should be accessible
      const sqsCommand = new GetQueueAttributesCommand({
        QueueUrl: discovered.outputs.PaymentQueueURL,
        AttributeNames: ['QueueArn']
      });
      const sqsResponse = await sqsClient.send(sqsCommand);
      expect(sqsResponse.Attributes?.QueueArn).toBeDefined();

      // Lambda should be active
      const functionName = discovered.outputs.LambdaFunctionArn.split(':').pop();
      const lambdaCommand = new GetFunctionCommand({
        FunctionName: functionName!
      });
      const lambdaResponse = await lambdaClient.send(lambdaCommand);
      expect(lambdaResponse.Configuration!.State).toBe('Active');
    });
  });
});
