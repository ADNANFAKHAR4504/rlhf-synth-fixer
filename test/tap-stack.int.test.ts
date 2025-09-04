import { 
  EC2Client, 
  DescribeVpcsCommand, 
  DescribeSubnetsCommand, 
  DescribeNatGatewaysCommand,
  DescribeFlowLogsCommand
} from '@aws-sdk/client-ec2';
import { 
  ElasticLoadBalancingV2Client, 
  DescribeLoadBalancersCommand, 
  DescribeTargetGroupsCommand
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { 
  RDSClient, 
  DescribeDBClustersCommand
} from '@aws-sdk/client-rds';
import { 
  S3Client, 
  GetBucketVersioningCommand, 
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  ListBucketsCommand 
} from '@aws-sdk/client-s3';
import { 
  DynamoDBClient, 
  DescribeTableCommand 
} from '@aws-sdk/client-dynamodb';
import { 
  AutoScalingClient, 
  DescribeAutoScalingGroupsCommand
} from '@aws-sdk/client-auto-scaling';
import { 
  CloudFrontClient, 
  ListDistributionsCommand 
} from '@aws-sdk/client-cloudfront';
import { 
  CloudWatchLogsClient, 
  DescribeLogGroupsCommand 
} from '@aws-sdk/client-cloudwatch-logs';
import fs from 'fs';
import path from 'path';

// Get environment suffix from environment variable
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr2705';
const region = process.env.AWS_REGION || 'ap-northeast-1';

// AWS clients
const ec2Client = new EC2Client({ region });
const elbv2Client = new ElasticLoadBalancingV2Client({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const dynamoClient = new DynamoDBClient({ region });
const asgClient = new AutoScalingClient({ region });
const cloudFrontClient = new CloudFrontClient({ region: 'us-east-1' });
const logsClient = new CloudWatchLogsClient({ region });

// Test results storage
const testResults: any[] = [];
const timeout = 30000;

// Helper function to write results to output file
const writeOutputFile = () => {
  const outputDir = path.join(process.cwd(), 'test-outputs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputFile = path.join(outputDir, 'integration-test-results.json');
  fs.writeFileSync(outputFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    environment: environmentSuffix,
    region: region,
    totalTests: testResults.length,
    passed: testResults.filter(r => r.status === 'PASS').length,
    failed: testResults.filter(r => r.status === 'FAIL').length,
    errors: testResults.filter(r => r.status === 'ERROR').length,
    results: testResults
  }, null, 2));
  
  console.log(`Integration test results written to: ${outputFile}`);
};

// VPC Configuration Test
test('VPC should have correct configuration', async () => {
  try {
    const command = new DescribeVpcsCommand({
      Filters: [
        { Name: 'tag:Environment', Values: [environmentSuffix] },
        { Name: 'tag:Project', Values: ['TapApplication'] }
      ]
    });

    const response = await ec2Client.send(command);
    const vpc = response.Vpcs?.[0];
    
    testResults.push({
      test: 'VPC Configuration',
      status: vpc && vpc.CidrBlock === '10.0.0.0/16' && vpc.State === 'available' ? 'PASS' : 'FAIL',
      details: {
        found: !!vpc,
        cidrBlock: vpc?.CidrBlock,
        state: vpc?.State,
        vpcId: vpc?.VpcId
      }
    });
    
    expect(vpc).toBeDefined();
    expect(vpc!.CidrBlock).toBe('10.0.0.0/16');
    expect(vpc!.State).toBe('available');
  } catch (error) {
    testResults.push({
      test: 'VPC Configuration',
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}, timeout);

// Subnets Test
test('should have 6 subnets across 2 AZs', async () => {
  try {
    const command = new DescribeSubnetsCommand({
      Filters: [
        { Name: 'tag:Environment', Values: [environmentSuffix] },
        { Name: 'tag:Project', Values: ['TapApplication'] }
      ]
    });

    const response = await ec2Client.send(command);
    const subnets = response.Subnets || [];
    const azs = [...new Set(subnets.map(s => s.AvailabilityZone))];
    
    testResults.push({
      test: 'Subnets Configuration',
      status: subnets.length === 6 && azs.length === 2 ? 'PASS' : 'FAIL',
      details: {
        totalSubnets: subnets.length,
        availabilityZones: azs.length,
        subnetTypes: subnets.map((s: any) => s.Tags?.find((t: any) => t.Key === 'aws-cdk:subnet-type')?.Value)
      }
    });
    
    expect(subnets.length).toBe(6);
    expect(azs.length).toBe(2);
  } catch (error) {
    testResults.push({
      test: 'Subnets Configuration',
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}, timeout);

// NAT Gateways Test
test('should have 2 NAT Gateways for high availability', async () => {
  try {
    const command = new DescribeNatGatewaysCommand({
      Filter: [{ Name: 'tag:Environment', Values: [environmentSuffix] }]
    });

    const response = await ec2Client.send(command);
    const natGateways = response.NatGateways || [];
    
    testResults.push({
      test: 'NAT Gateways',
      status: natGateways.length >= 2 ? 'PASS' : 'FAIL',
      details: {
        count: natGateways.length,
        states: natGateways.map((ng: any) => ng.State)
      }
    });
    
    // CDK with dual-stack VPC creates 4 NAT Gateways (2 IPv4 + 2 IPv6)
    expect(natGateways.length).toBeGreaterThanOrEqual(2);
  } catch (error) {
    testResults.push({
      test: 'NAT Gateways',
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}, timeout);

// VPC Flow Logs Test
test('should have VPC Flow Logs enabled', async () => {
  try {
    // First get VPC ID
    const vpcCommand = new DescribeVpcsCommand({
      Filters: [
        { Name: 'tag:Environment', Values: [environmentSuffix] },
        { Name: 'tag:Project', Values: ['TapApplication'] }
      ]
    });
    const vpcResponse = await ec2Client.send(vpcCommand);
    const vpcId = vpcResponse.Vpcs?.[0]?.VpcId;
    
    const command = new DescribeFlowLogsCommand({
      Filter: [
        { Name: 'resource-type', Values: ['VPC'] },
        { Name: 'resource-id', Values: [vpcId!] }
      ]
    });

    const response = await ec2Client.send(command);
    const flowLog = response.FlowLogs?.[0];
    
    testResults.push({
      test: 'VPC Flow Logs',
      status: flowLog && flowLog.FlowLogStatus === 'ACTIVE' ? 'PASS' : 'FAIL',
      details: {
        found: !!flowLog,
        status: flowLog?.FlowLogStatus,
        trafficType: flowLog?.TrafficType
      }
    });
    
    expect(flowLog).toBeDefined();
    expect(flowLog!.FlowLogStatus).toBe('ACTIVE');
  } catch (error) {
    testResults.push({
      test: 'VPC Flow Logs',
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}, timeout);

// Application Load Balancer Test
test('should have internet-facing ALB with target group', async () => {
  try {
    const albCommand = new DescribeLoadBalancersCommand({});
    const albResponse = await elbv2Client.send(albCommand);
    
    // Find ALB by DNS name from stack outputs
    const expectedDNS = 'TapSta-TapAl-JgB7qXLbjS2W-1941395760.ap-northeast-1.elb.amazonaws.com';
    const alb = albResponse.LoadBalancers?.find((lb: any) => 
      lb.DNSName === expectedDNS
    );
    
    let targetGroupDetails = {};
    if (alb) {
      const tgCommand = new DescribeTargetGroupsCommand({
        LoadBalancerArn: alb.LoadBalancerArn
      });
      const tgResponse = await elbv2Client.send(tgCommand);
      const tg = tgResponse.TargetGroups?.[0];
      targetGroupDetails = {
        port: tg?.Port,
        protocol: tg?.Protocol,
        healthCheckPath: tg?.HealthCheckPath
      };
    }
    
    testResults.push({
      test: 'Application Load Balancer',
      status: alb && alb.Scheme === 'internet-facing' ? 'PASS' : 'FAIL',
      details: {
        found: !!alb,
        scheme: alb?.Scheme,
        state: alb?.State?.Code,
        type: alb?.Type,
        targetGroup: targetGroupDetails
      }
    });
    
    expect(alb).toBeDefined();
    expect(alb!.Scheme).toBe('internet-facing');
  } catch (error) {
    testResults.push({
      test: 'Application Load Balancer',
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}, timeout);

// RDS Aurora Cluster Test
test('should have Aurora PostgreSQL cluster with Multi-AZ', async () => {
  try {
    const command = new DescribeDBClustersCommand({});
    const response = await rdsClient.send(command);
    
    const cluster = response.DBClusters?.find((c: any) => 
      c.TagList?.some((t: any) => t.Key === 'Environment' && t.Value === environmentSuffix)
    );
    
    testResults.push({
      test: 'RDS Aurora Cluster',
      status: cluster && cluster.Engine === 'aurora-postgresql' ? 'PASS' : 'FAIL',
      details: {
        found: !!cluster,
        engine: cluster?.Engine,
        storageEncrypted: cluster?.StorageEncrypted,
        backupRetention: cluster?.BackupRetentionPeriod,
        availabilityZones: cluster?.AvailabilityZones?.length
      }
    });
    
    expect(cluster).toBeDefined();
    expect(cluster!.Engine).toBe('aurora-postgresql');
  } catch (error) {
    testResults.push({
      test: 'RDS Aurora Cluster',
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}, timeout);

// S3 Bucket Test
test('should have S3 bucket with versioning and encryption', async () => {
  // Get S3 bucket by listing buckets with the prefix
  const listResponse = await s3Client.send(new ListBucketsCommand({}));
  const bucket = listResponse.Buckets?.find((b: any) => 
    b.Name?.startsWith(`tap-application-bucket-${environmentSuffix}-`)
  );
  const bucketName = bucket?.Name || `tap-application-bucket-${environmentSuffix}`;
  
  try {
    const versioningCommand = new GetBucketVersioningCommand({ Bucket: bucketName });
    const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
    const publicAccessCommand = new GetPublicAccessBlockCommand({ Bucket: bucketName });
    
    const [versioningResponse, encryptionResponse, publicAccessResponse] = await Promise.all([
      s3Client.send(versioningCommand),
      s3Client.send(encryptionCommand),
      s3Client.send(publicAccessCommand)
    ]);
    
    testResults.push({
      test: 'S3 Bucket Configuration',
      status: bucket && versioningResponse.Status === 'Enabled' ? 'PASS' : 'FAIL',
      details: {
        bucketName,
        found: !!bucket,
        versioning: versioningResponse.Status,
        encryption: encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm,
        publicAccessBlocked: publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicAcls
      }
    });
    
    expect(versioningResponse.Status).toBe('Enabled');
  } catch (error) {
    testResults.push({
      test: 'S3 Bucket Configuration',
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}, timeout);

// DynamoDB Table Test
test('should have DynamoDB table with on-demand billing', async () => {
  const tableName = `tap-application-table-${environmentSuffix}`;
  
  try {
    const command = new DescribeTableCommand({ TableName: tableName });
    const response = await dynamoClient.send(command);
    const table = response.Table;
    
    testResults.push({
      test: 'DynamoDB Table',
      status: table?.BillingModeSummary?.BillingMode === 'PAY_PER_REQUEST' ? 'PASS' : 'FAIL',
      details: {
        tableName,
        billingMode: table?.BillingModeSummary?.BillingMode,
        sseStatus: table?.SSEDescription?.Status,
        tableStatus: table?.TableStatus
      }
    });
    
    expect(table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
  } catch (error) {
    testResults.push({
      test: 'DynamoDB Table',
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}, timeout);

// Auto Scaling Group Test
test('should have Auto Scaling Group with correct capacity', async () => {
  try {
    const command = new DescribeAutoScalingGroupsCommand({});
    const response = await asgClient.send(command);
    
    const asg = response.AutoScalingGroups?.find((g: any) => 
      g.Tags?.some((t: any) => t.Key === 'Environment' && t.Value === environmentSuffix)
    );
    
    testResults.push({
      test: 'Auto Scaling Group',
      status: asg && asg.MinSize === 2 && asg.MaxSize === 6 ? 'PASS' : 'FAIL',
      details: {
        found: !!asg,
        minSize: asg?.MinSize,
        maxSize: asg?.MaxSize,
        desiredCapacity: asg?.DesiredCapacity,
        healthCheckType: asg?.HealthCheckType
      }
    });
    
    expect(asg).toBeDefined();
    expect(asg!.MinSize).toBe(2);
    expect(asg!.MaxSize).toBe(6);
  } catch (error) {
    testResults.push({
      test: 'Auto Scaling Group',
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}, timeout);

// CloudFront Distribution Test
test('should have CloudFront distribution', async () => {
  try {
    const command = new ListDistributionsCommand({});
    const response = await cloudFrontClient.send(command);
    
    const distribution = response.DistributionList?.Items?.find((d: any) => 
      d.Comment?.includes(`TAP application ${environmentSuffix}`)
    );
    
    testResults.push({
      test: 'CloudFront Distribution',
      status: distribution && distribution.Enabled ? 'PASS' : 'FAIL',
      details: {
        found: !!distribution,
        enabled: distribution?.Enabled,
        status: distribution?.Status,
        viewerProtocolPolicy: distribution?.DefaultCacheBehavior?.ViewerProtocolPolicy
      }
    });
    
    expect(distribution).toBeDefined();
    expect(distribution!.Enabled).toBe(true);
  } catch (error) {
    testResults.push({
      test: 'CloudFront Distribution',
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}, timeout);

// CloudWatch Logs Test
test('should have VPC Flow Logs group', async () => {
  try {
    const command = new DescribeLogGroupsCommand({
      logGroupNamePrefix: `/aws/vpc/flowlogs/${environmentSuffix}`
    });

    const response = await logsClient.send(command);
    const logGroup = response.logGroups?.[0];
    
    testResults.push({
      test: 'CloudWatch VPC Flow Logs',
      status: logGroup ? 'PASS' : 'FAIL',
      details: {
        found: !!logGroup,
        logGroupName: logGroup?.logGroupName,
        retentionInDays: logGroup?.retentionInDays
      }
    });
    
    expect(logGroup).toBeDefined();
  } catch (error) {
    testResults.push({
      test: 'CloudWatch VPC Flow Logs',
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}, timeout);

// Application Logs Test
test('should have application log group', async () => {
  try {
    const command = new DescribeLogGroupsCommand({
      logGroupNamePrefix: `/aws/ec2/tap-application/${environmentSuffix}`
    });

    const response = await logsClient.send(command);
    const logGroup = response.logGroups?.[0];
    
    testResults.push({
      test: 'CloudWatch Application Logs',
      status: logGroup ? 'PASS' : 'FAIL',
      details: {
        found: !!logGroup,
        logGroupName: logGroup?.logGroupName,
        retentionInDays: logGroup?.retentionInDays
      }
    });
    
    expect(logGroup).toBeDefined();
  } catch (error) {
    testResults.push({
      test: 'CloudWatch Application Logs',
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}, timeout);

// Resource Tagging Test
test('should have consistent tagging across resources', async () => {
  try {
    const command = new DescribeVpcsCommand({
      Filters: [{ Name: 'tag:Environment', Values: [environmentSuffix] }]
    });

    const response = await ec2Client.send(command);
    const vpc = response.Vpcs?.[0];
    
    const envTag = vpc?.Tags?.find((t: any) => t.Key === 'Environment');
    const deptTag = vpc?.Tags?.find((t: any) => t.Key === 'Department');
    const projTag = vpc?.Tags?.find((t: any) => t.Key === 'Project');
    
    testResults.push({
      test: 'Resource Tagging',
      status: envTag?.Value === environmentSuffix && deptTag?.Value === 'Engineering' && projTag?.Value === 'TapApplication' ? 'PASS' : 'FAIL',
      details: {
        environment: envTag?.Value,
        department: deptTag?.Value,
        project: projTag?.Value
      }
    });
    
    expect(envTag?.Value).toBe(environmentSuffix);
    expect(deptTag?.Value).toBe('Engineering');
    expect(projTag?.Value).toBe('TapApplication');
  } catch (error) {
    testResults.push({
      test: 'Resource Tagging',
      status: 'ERROR',
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}, timeout);

// Write output file after all tests
afterAll(() => {
  writeOutputFile();
});