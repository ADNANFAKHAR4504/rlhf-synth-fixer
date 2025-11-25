import * as fs from 'fs';
import * as path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

describe('CloudFormation Stack Integration Tests', () => {
  let outputs: any;
  const region = process.env.AWS_REGION || 'us-east-1';

  beforeAll(() => {
    const outputsPath = path.join(
      __dirname,
      '..',
      'cfn-outputs',
      'flat-outputs.json'
    );
    const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(outputsContent);
  });

  describe('VPC Configuration', () => {
    let ec2Client: EC2Client;

    beforeAll(() => {
      ec2Client = new EC2Client({ region });
    });

    afterAll(() => {
      ec2Client.destroy();
    });

    test('VPC should exist and be properly configured', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);

      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(outputs.VPCId);
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    });

    test('should have 6 subnets (3 public + 3 private)', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(6);

      const publicSubnets = response.Subnets!.filter(
        s => s.MapPublicIpOnLaunch === true
      );
      const privateSubnets = response.Subnets!.filter(
        s => s.MapPublicIpOnLaunch === false
      );

      expect(publicSubnets.length).toBeGreaterThanOrEqual(3);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(3);
    });

    test('should have NAT Gateways for private subnet outbound connectivity', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
          {
            Name: 'state',
            Values: ['available'],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(1);
    });

    test('should have security groups configured', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThan(1);
    });
  });

  describe('Lambda Function', () => {
    let lambdaClient: LambdaClient;

    beforeAll(() => {
      lambdaClient = new LambdaClient({ region });
    });

    afterAll(() => {
      lambdaClient.destroy();
    });

    test('Lambda function should exist and be properly configured', async () => {
      const functionArn = outputs.LambdaFunctionArn;
      const functionName = functionArn.split(':').pop();

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.FunctionArn).toBe(functionArn);
      expect(response.Configuration!.Runtime).toBe('nodejs22.x');
      expect(response.Configuration!.Handler).toBe('index.handler');
    });

    test('Lambda should be in VPC', async () => {
      const functionArn = outputs.LambdaFunctionArn;
      const functionName = functionArn.split(':').pop();

      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.VpcConfig).toBeDefined();
      expect(response.VpcConfig!.VpcId).toBe(outputs.VPCId);
      expect(response.VpcConfig!.SubnetIds).toBeDefined();
      expect(response.VpcConfig!.SubnetIds!.length).toBeGreaterThan(0);
      expect(response.VpcConfig!.SecurityGroupIds).toBeDefined();
      expect(response.VpcConfig!.SecurityGroupIds!.length).toBeGreaterThan(0);
    });

    test('Lambda should have execution role configured', async () => {
      const functionArn = outputs.LambdaFunctionArn;
      const functionName = functionArn.split(':').pop();

      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role).toMatch(/arn:aws:iam::/);
    });

    test('Lambda should have environment variables set', async () => {
      const functionArn = outputs.LambdaFunctionArn;
      const functionName = functionArn.split(':').pop();

      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Environment).toBeDefined();
      expect(response.Environment!.Variables).toBeDefined();
      expect(response.Environment!.Variables!.DB_CLUSTER_ARN).toBeDefined();
      expect(response.Environment!.Variables!.DB_NAME).toBe('creditscoring');
    });
  });

  describe('RDS Aurora Cluster', () => {
    let rdsClient: RDSClient;

    beforeAll(() => {
      rdsClient = new RDSClient({ region });
    });

    afterAll(() => {
      rdsClient.destroy();
    });

    test('DB cluster should exist and be available', async () => {
      const clusterIdentifier = outputs.DBClusterEndpoint.split('.')[0];

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters!.length).toBe(1);

      const cluster = response.DBClusters![0];
      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-postgresql');
      expect(cluster.EngineMode).toBe('provisioned');
    });

    test('DB cluster should have encryption enabled', async () => {
      const clusterIdentifier = outputs.DBClusterEndpoint.split('.')[0];

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters![0];
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.KmsKeyId).toBeDefined();
    });

    test('DB cluster should have backup retention configured', async () => {
      const clusterIdentifier = outputs.DBClusterEndpoint.split('.')[0];

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters![0];
      expect(cluster.BackupRetentionPeriod).toBe(30);
      expect(cluster.PreferredBackupWindow).toBeDefined();
    });

    test('DB cluster should have CloudWatch logs enabled', async () => {
      const clusterIdentifier = outputs.DBClusterEndpoint.split('.')[0];

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters![0];
      expect(cluster.EnabledCloudwatchLogsExports).toBeDefined();
      expect(cluster.EnabledCloudwatchLogsExports!.length).toBeGreaterThan(0);
    });

    test('DB cluster should be in VPC', async () => {
      const clusterIdentifier = outputs.DBClusterEndpoint.split('.')[0];

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters![0];
      expect(cluster.DBSubnetGroup).toBeDefined();
      expect(cluster.VpcSecurityGroups).toBeDefined();
      expect(cluster.VpcSecurityGroups!.length).toBeGreaterThan(0);
    });

    test('DB instance should exist and be serverless v2', async () => {
      const clusterIdentifier = outputs.DBClusterEndpoint.split('.')[0];

      const command = new DescribeDBInstancesCommand({
        Filters: [
          {
            Name: 'db-cluster-id',
            Values: [clusterIdentifier],
          },
        ],
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBeGreaterThanOrEqual(1);

      const instance = response.DBInstances![0];
      expect(instance.DBInstanceClass).toBe('db.serverless');
      expect(instance.PubliclyAccessible).toBe(false);
    });
  });

  describe('Application Load Balancer', () => {
    let elbClient: ElasticLoadBalancingV2Client;

    beforeAll(() => {
      elbClient = new ElasticLoadBalancingV2Client({ region });
    });

    afterAll(() => {
      elbClient.destroy();
    });

    test('ALB should exist and be active', async () => {
      const albDnsName = outputs.ALBDNSName;

      const command = new DescribeLoadBalancersCommand({});
      const response = await elbClient.send(command);

      expect(response.LoadBalancers).toBeDefined();

      const alb = response.LoadBalancers!.find(lb => lb.DNSName === albDnsName);
      expect(alb).toBeDefined();
      expect(alb!.State?.Code).toBe('active');
      expect(alb!.Type).toBe('application');
      expect(alb!.Scheme).toBe('internet-facing');
    });

    test('ALB should be in correct VPC and subnets', async () => {
      const albDnsName = outputs.ALBDNSName;

      const command = new DescribeLoadBalancersCommand({});
      const response = await elbClient.send(command);

      const alb = response.LoadBalancers!.find(lb => lb.DNSName === albDnsName);
      expect(alb!.VpcId).toBe(outputs.VPCId);
      expect(alb!.AvailabilityZones).toBeDefined();
      expect(alb!.AvailabilityZones!.length).toBeGreaterThanOrEqual(2);
    });

    test('should have target group for Lambda', async () => {
      const albDnsName = outputs.ALBDNSName;

      const lbCommand = new DescribeLoadBalancersCommand({});
      const lbResponse = await elbClient.send(lbCommand);
      const alb = lbResponse.LoadBalancers!.find(
        lb => lb.DNSName === albDnsName
      );

      const tgCommand = new DescribeTargetGroupsCommand({
        LoadBalancerArn: alb!.LoadBalancerArn,
      });
      const tgResponse = await elbClient.send(tgCommand);

      expect(tgResponse.TargetGroups).toBeDefined();
      expect(tgResponse.TargetGroups!.length).toBeGreaterThan(0);

      const targetGroup = tgResponse.TargetGroups![0];
      expect(targetGroup.TargetType).toBe('lambda');
    });

    test('should have HTTP listener configured', async () => {
      const albDnsName = outputs.ALBDNSName;

      const lbCommand = new DescribeLoadBalancersCommand({});
      const lbResponse = await elbClient.send(lbCommand);
      const alb = lbResponse.LoadBalancers!.find(
        lb => lb.DNSName === albDnsName
      );

      const listenerCommand = new DescribeListenersCommand({
        LoadBalancerArn: alb!.LoadBalancerArn,
      });
      const listenerResponse = await elbClient.send(listenerCommand);

      expect(listenerResponse.Listeners).toBeDefined();
      expect(listenerResponse.Listeners!.length).toBeGreaterThan(0);

      const httpListener = listenerResponse.Listeners!.find(l => l.Port === 80);
      expect(httpListener).toBeDefined();
      expect(httpListener!.Protocol).toBe('HTTP');
    });
  });

  describe('KMS Key', () => {
    let kmsClient: KMSClient;

    beforeAll(() => {
      kmsClient = new KMSClient({ region });
    });

    afterAll(() => {
      kmsClient.destroy();
    });

    test('KMS key should exist and be enabled', async () => {
      const keyId = outputs.KMSKeyId;

      const command = new DescribeKeyCommand({
        KeyId: keyId,
      });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyId).toBe(keyId);
      expect(response.KeyMetadata!.Enabled).toBe(true);
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
    });

    test('KMS key should have rotation enabled', async () => {
      const keyId = outputs.KMSKeyId;

      const command = new DescribeKeyCommand({
        KeyId: keyId,
      });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyManager).toBe('CUSTOMER');
    });
  });

  describe('CloudWatch Logs', () => {
    let logsClient: CloudWatchLogsClient;

    beforeAll(() => {
      logsClient = new CloudWatchLogsClient({ region });
    });

    afterAll(() => {
      logsClient.destroy();
    });

    test('Lambda log group should exist with 365 day retention', async () => {
      const functionArn = outputs.LambdaFunctionArn;
      const functionName = functionArn.split(':').pop();
      const logGroupName = `/aws/lambda/${functionName}`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();

      const logGroup = response.logGroups!.find(
        lg => lg.logGroupName === logGroupName
      );
      expect(logGroup).toBeDefined();
      expect(logGroup!.retentionInDays).toBe(365);
    });
  });

  describe('End-to-End Workflow', () => {
    test('all required outputs should be present', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.ALBDNSName).toBeDefined();
      expect(outputs.LambdaFunctionArn).toBeDefined();
      expect(outputs.DBClusterEndpoint).toBeDefined();
      expect(outputs.KMSKeyId).toBeDefined();
    });

    test('ALB DNS name should be reachable (HTTP endpoint exists)', () => {
      expect(outputs.ALBDNSName).toMatch(
        /^[a-z0-9-]+\.[a-z0-9-]+\.elb\.amazonaws\.com$/
      );
    });

    test('Lambda function ARN should have correct format', () => {
      expect(outputs.LambdaFunctionArn).toMatch(
        /^arn:aws:lambda:[a-z0-9-]+:\d+:function:[a-z0-9-]+$/
      );
    });

    test('DB cluster endpoint should have correct format', () => {
      expect(outputs.DBClusterEndpoint).toMatch(
        /^[a-z0-9-]+\.cluster-[a-z0-9]+\.[a-z0-9-]+\.rds\.amazonaws\.com$/
      );
    });

    test('KMS Key ID should be a valid UUID', () => {
      expect(outputs.KMSKeyId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });
  });

  describe('Resource Connectivity', () => {
    test('Lambda should be able to connect to database (via security groups)', async () => {
      const ec2Client = new EC2Client({ region });
      const lambdaClient = new LambdaClient({ region });

      const functionArn = outputs.LambdaFunctionArn;
      const functionName = functionArn.split(':').pop();

      const lambdaConfig = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionName })
      );

      expect(lambdaConfig.VpcConfig).toBeDefined();
      expect(lambdaConfig.VpcConfig!.SecurityGroupIds).toBeDefined();
      expect(lambdaConfig.VpcConfig!.SecurityGroupIds!.length).toBeGreaterThan(
        0
      );

      ec2Client.destroy();
      lambdaClient.destroy();
    });

    test('ALB should be able to invoke Lambda (via target group)', async () => {
      const elbClient = new ElasticLoadBalancingV2Client({ region });
      const albDnsName = outputs.ALBDNSName;

      const lbCommand = new DescribeLoadBalancersCommand({});
      const lbResponse = await elbClient.send(lbCommand);
      const alb = lbResponse.LoadBalancers!.find(
        lb => lb.DNSName === albDnsName
      );

      const tgCommand = new DescribeTargetGroupsCommand({
        LoadBalancerArn: alb!.LoadBalancerArn,
      });
      const tgResponse = await elbClient.send(tgCommand);

      expect(tgResponse.TargetGroups).toBeDefined();
      expect(tgResponse.TargetGroups!.length).toBeGreaterThan(0);

      elbClient.destroy();
    });
  });
});
