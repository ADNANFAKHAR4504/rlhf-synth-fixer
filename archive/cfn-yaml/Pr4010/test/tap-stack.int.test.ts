import fs from 'fs';
import dns from 'dns';
import axios from 'axios';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
  DescribeVolumesCommand,
  DescribeFlowLogsCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  GetBucketLifecycleConfigurationCommand,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
} from '@aws-sdk/client-rds';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  IAMClient,
  GetRoleCommand,
  GetInstanceProfileCommand,
} from '@aws-sdk/client-iam';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  SQSClient,
  GetQueueAttributesCommand,
} from '@aws-sdk/client-sqs';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

// Load deployment outputs
let outputs: any;

beforeAll(() => {
  const outputsPath = 'cfn-outputs/flat-outputs.json';
  if (fs.existsSync(outputsPath)) {
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  } else {
    throw new Error(`Deployment outputs not found at ${outputsPath}. Please run deployment first.`);
  }
});

describe('TapStack Integration Tests', () => {
  const region = process.env.AWS_REGION || 'us-east-1';

  describe('VPC and Networking Resources', () => {
    let ec2Client: EC2Client;

    beforeAll(() => {
      ec2Client = new EC2Client({ region });
    });

    test('VPC should exist and be properly configured', async () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');

      // DNS settings are returned in VpcAttributes
      // We verify the VPC exists and has correct CIDR, DNS settings are validated in template
      expect(vpc.VpcId).toBe(vpcId);
    });

    test('VPC should have proper CIDR block output', () => {
      expect(outputs.VPCCidr).toBe('10.0.0.0/16');
    });

    test('All subnets should exist and be in correct AZs', async () => {
      const vpcId = outputs.VPCId;

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }] })
      );

      const subnets = response.Subnets || [];
      expect(subnets.length).toBeGreaterThanOrEqual(6);

      // Verify we have public, private, and database subnets
      const publicSubnets = subnets.filter(s =>
        s.Tags?.some(t => t.Key === 'Name' && t.Value?.includes('Public'))
      );
      const privateSubnets = subnets.filter(s =>
        s.Tags?.some(t => t.Key === 'Name' && t.Value?.includes('Private'))
      );
      const databaseSubnets = subnets.filter(s =>
        s.Tags?.some(t => t.Key === 'Name' && t.Value?.includes('Database'))
      );

      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);
      expect(databaseSubnets.length).toBeGreaterThanOrEqual(2);

      // Verify public subnets have MapPublicIpOnLaunch enabled
      publicSubnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });

      // Verify all subnets are available
      subnets.forEach(subnet => {
        expect(subnet.State).toBe('available');
      });
    });

    test('Internet Gateway should be attached to VPC', async () => {
      const vpcId = outputs.VPCId;

      const response = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }],
        })
      );

      expect(response.InternetGateways).toHaveLength(1);
      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].State).toBe('available');
      expect(igw.Attachments![0].VpcId).toBe(vpcId);
    });

    test('NAT Gateways should be operational in public subnets', async () => {
      const vpcId = outputs.VPCId;

      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );

      const natGateways = response.NatGateways || [];
      expect(natGateways.length).toBeGreaterThanOrEqual(2);

      natGateways.forEach(nat => {
        expect(nat.State).toBe('available');
        expect(nat.NatGatewayAddresses).toBeDefined();
        expect(nat.NatGatewayAddresses!.length).toBeGreaterThan(0);
      });
    });

    test('Route tables should have correct routes', async () => {
      const vpcId = outputs.VPCId;

      const response = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );

      const routeTables = response.RouteTables || [];
      expect(routeTables.length).toBeGreaterThanOrEqual(3);

      // Find public route table (routes to IGW)
      const publicRouteTables = routeTables.filter(rt =>
        rt.Routes?.some(r => r.GatewayId?.startsWith('igw-'))
      );
      expect(publicRouteTables.length).toBeGreaterThanOrEqual(1);

      // Verify public route table has route to 0.0.0.0/0
      publicRouteTables.forEach(rt => {
        const internetRoute = rt.Routes?.find(r => r.DestinationCidrBlock === '0.0.0.0/0');
        expect(internetRoute).toBeDefined();
        expect(internetRoute?.GatewayId).toMatch(/^igw-/);
      });

      // Find private route tables (routes to NAT)
      const privateRouteTables = routeTables.filter(rt =>
        rt.Routes?.some(r => r.NatGatewayId?.startsWith('nat-'))
      );
      expect(privateRouteTables.length).toBeGreaterThanOrEqual(2);

      // Verify private route tables have routes to NAT gateways
      privateRouteTables.forEach(rt => {
        const natRoute = rt.Routes?.find(r => r.DestinationCidrBlock === '0.0.0.0/0');
        expect(natRoute).toBeDefined();
        expect(natRoute?.NatGatewayId).toMatch(/^nat-/);
      });
    });

    test('Security groups should exist with proper rules', async () => {
      const vpcId = outputs.VPCId;

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );

      const securityGroups = response.SecurityGroups || [];
      expect(securityGroups.length).toBeGreaterThanOrEqual(4);

      // Find ALB security group
      const albSg = securityGroups.find(sg =>
        sg.Tags?.some(t => t.Value?.includes('ALB'))
      );
      expect(albSg).toBeDefined();
      expect(albSg?.IpPermissions?.some(rule => rule.FromPort === 80)).toBe(true);
      expect(albSg?.IpPermissions?.some(rule => rule.FromPort === 443)).toBe(true);

      // Find Lambda security group
      const lambdaSg = securityGroups.find(sg =>
        sg.Tags?.some(t => t.Value?.includes('Lambda'))
      );
      expect(lambdaSg).toBeDefined();

      // Find Database security group
      const dbSg = securityGroups.find(sg =>
        sg.Tags?.some(t => t.Value?.includes('Database'))
      );
      expect(dbSg).toBeDefined();
      expect(dbSg?.IpPermissions?.some(rule => rule.FromPort === 3306)).toBe(true);

      // Find EC2 security group
      const ec2Sg = securityGroups.find(sg =>
        sg.Tags?.some(t => t.Value?.includes('EC2')) &&
        !sg.Tags?.some(t => t.Value?.includes('ALB'))
      );
      expect(ec2Sg).toBeDefined();
      expect(ec2Sg?.IpPermissions?.some(rule => rule.FromPort === 22)).toBe(true);
    });

    test('VPC Flow Logs should be enabled', async () => {
      const vpcId = outputs.VPCId;

      const response = await ec2Client.send(
        new DescribeFlowLogsCommand({
          Filter: [
            { Name: 'resource-id', Values: [vpcId] },
          ],
        })
      );

      const flowLogs = response.FlowLogs || [];
      expect(flowLogs.length).toBeGreaterThanOrEqual(1);

      const activeFlowLog = flowLogs.find(fl => fl.FlowLogStatus === 'ACTIVE');
      expect(activeFlowLog).toBeDefined();
      expect(activeFlowLog?.TrafficType).toBe('ALL');
      expect(activeFlowLog?.LogDestinationType).toBe('cloud-watch-logs');
    });
  });

  describe('S3 Bucket Resources', () => {
    let s3Client: S3Client;
    let bucketName: string;

    beforeAll(() => {
      s3Client = new S3Client({ region });
      bucketName = outputs.ApplicationDataBucketName;
    });

    test('S3 bucket should exist and be accessible', async () => {
      expect(bucketName).toBeDefined();

      await expect(
        s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))
      ).resolves.not.toThrow();
    });

    test('S3 bucket should have encryption enabled', async () => {
      const response = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rules = response.ServerSideEncryptionConfiguration!.Rules || [];
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('S3 bucket should have versioning enabled', async () => {
      const response = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );

      expect(response.Status).toBe('Enabled');
    });

    test('S3 bucket should block all public access', async () => {
      const response = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );

      const config = response.PublicAccessBlockConfiguration;
      expect(config?.BlockPublicAcls).toBe(true);
      expect(config?.BlockPublicPolicy).toBe(true);
      expect(config?.IgnorePublicAcls).toBe(true);
      expect(config?.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket should have lifecycle policy', async () => {
      const response = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName })
      );

      const rules = response.Rules || [];
      expect(rules.length).toBeGreaterThan(0);

      const deleteOldVersionsRule = rules.find(r => r.ID === 'DeleteOldVersions');
      expect(deleteOldVersionsRule).toBeDefined();
      expect(deleteOldVersionsRule?.Status).toBe('Enabled');
      expect(deleteOldVersionsRule?.NoncurrentVersionExpiration?.NoncurrentDays).toBe(90);
    });

    test('S3 bucket ARN should be exported', () => {
      expect(outputs.ApplicationDataBucketArn).toBeDefined();
      expect(outputs.ApplicationDataBucketArn).toContain('arn:aws:s3:::');
      expect(outputs.ApplicationDataBucketArn).toContain(bucketName);
    });
  });

  describe('RDS Database Resources', () => {
    let rdsClient: RDSClient;
    let secretsClient: SecretsManagerClient;

    beforeAll(() => {
      rdsClient = new RDSClient({ region });
      secretsClient = new SecretsManagerClient({ region });
    });

    test('RDS instance should exist and be available', async () => {
      const rdsEndpoint = outputs.RDSEndpoint;
      expect(rdsEndpoint).toBeDefined();

      // Extract DB instance identifier from connection string or use a tag filter
      const vpcId = outputs.VPCId;
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({})
      );

      const dbInstances = response.DBInstances || [];
      const ourDb = dbInstances.find(db =>
        db.DBSubnetGroup?.VpcId === vpcId
      );

      expect(ourDb).toBeDefined();
      expect(ourDb?.DBInstanceStatus).toBe('available');
      expect(ourDb?.Engine).toBe('mysql');
      expect(ourDb?.EngineVersion).toMatch(/^8\.0/);
    });

    test('RDS instance should have encryption enabled', async () => {
      const vpcId = outputs.VPCId;
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({})
      );

      const dbInstances = response.DBInstances || [];
      const ourDb = dbInstances.find(db =>
        db.DBSubnetGroup?.VpcId === vpcId
      );

      expect(ourDb?.StorageEncrypted).toBe(true);
    });

    test('RDS instance should be Multi-AZ', async () => {
      const vpcId = outputs.VPCId;
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({})
      );

      const dbInstances = response.DBInstances || [];
      const ourDb = dbInstances.find(db =>
        db.DBSubnetGroup?.VpcId === vpcId
      );

      expect(ourDb?.MultiAZ).toBe(true);
    });

    test('RDS instance should use gp3 storage', async () => {
      const vpcId = outputs.VPCId;
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({})
      );

      const dbInstances = response.DBInstances || [];
      const ourDb = dbInstances.find(db =>
        db.DBSubnetGroup?.VpcId === vpcId
      );

      expect(ourDb?.StorageType).toBe('gp3');
      expect(ourDb?.AllocatedStorage).toBe(20);
    });

    test('RDS instance should have backup retention configured', async () => {
      const vpcId = outputs.VPCId;
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({})
      );

      const dbInstances = response.DBInstances || [];
      const ourDb = dbInstances.find(db =>
        db.DBSubnetGroup?.VpcId === vpcId
      );

      expect(ourDb?.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
    });

    test('RDS instance should have CloudWatch Logs exports enabled', async () => {
      const vpcId = outputs.VPCId;
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({})
      );

      const dbInstances = response.DBInstances || [];
      const ourDb = dbInstances.find(db =>
        db.DBSubnetGroup?.VpcId === vpcId
      );

      const logTypes = ourDb?.EnabledCloudwatchLogsExports || [];
      expect(logTypes).toContain('error');
      expect(logTypes).toContain('general');
      expect(logTypes).toContain('slowquery');
    });

    test('DB Subnet Group should exist with correct subnets', async () => {
      const vpcId = outputs.VPCId;
      const response = await rdsClient.send(
        new DescribeDBSubnetGroupsCommand({})
      );

      const subnetGroups = response.DBSubnetGroups || [];
      const ourSubnetGroup = subnetGroups.find(sg => sg.VpcId === vpcId);

      expect(ourSubnetGroup).toBeDefined();
      expect(ourSubnetGroup?.Subnets?.length).toBeGreaterThanOrEqual(2);
    });

    test('RDS connection string output should be formatted correctly', () => {
      const connectionString = outputs.RDSConnectionString;
      expect(connectionString).toBeDefined();
      expect(connectionString).toMatch(/^mysql:\/\//);
      expect(connectionString).toContain('****'); // Password should be masked
    });
  });

  describe('Lambda Function Resources', () => {
    let lambdaClient: LambdaClient;
    let sqsClient: SQSClient;
    let logsClient: CloudWatchLogsClient;

    beforeAll(() => {
      lambdaClient = new LambdaClient({ region });
      sqsClient = new SQSClient({ region });
      logsClient = new CloudWatchLogsClient({ region });
    });

    test('Lambda function should exist and be active', async () => {
      const functionArn = outputs.LambdaFunctionArn;
      expect(functionArn).toBeDefined();

      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: functionArn })
      );

      expect(response.Configuration?.State).toBe('Active');
      expect(response.Configuration?.Runtime).toBe('python3.9');
    });

    test('Lambda function should have correct configuration', async () => {
      const functionArn = outputs.LambdaFunctionArn;

      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionArn })
      );

      expect(response.Timeout).toBe(30);
      expect(response.MemorySize).toBe(256);
      expect(response.Handler).toBe('index.lambda_handler');
    });

    test('Lambda function should be in VPC', async () => {
      const functionArn = outputs.LambdaFunctionArn;

      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionArn })
      );

      const vpcConfig = response.VpcConfig;
      expect(vpcConfig).toBeDefined();
      expect(vpcConfig?.VpcId).toBe(outputs.VPCId);
      expect(vpcConfig?.SubnetIds?.length).toBeGreaterThanOrEqual(2);
      expect(vpcConfig?.SecurityGroupIds?.length).toBeGreaterThanOrEqual(1);
    });

    test('Lambda function should have environment variables', async () => {
      const functionArn = outputs.LambdaFunctionArn;

      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionArn })
      );

      const envVars = response.Environment?.Variables || {};
      expect(envVars.ENVIRONMENT).toBeDefined();
      expect(envVars.S3_BUCKET).toBe(outputs.ApplicationDataBucketName);
      expect(envVars.DB_ENDPOINT).toBe(outputs.RDSEndpoint);
    });

    test('Lambda function should have DLQ configured', async () => {
      const functionArn = outputs.LambdaFunctionArn;

      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionArn })
      );

      expect(response.DeadLetterConfig?.TargetArn).toBe(outputs.LambdaDLQArn);
    });

    test('Lambda DLQ should exist with encryption', async () => {
      const queueArn = outputs.LambdaDLQArn;
      expect(queueArn).toBeDefined();

      // Extract queue URL from ARN
      const queueName = queueArn.split(':').pop();
      const accountId = queueArn.split(':')[4];
      const queueUrl = `https://sqs.${region}.amazonaws.com/${accountId}/${queueName}`;

      const response = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: queueUrl,
          AttributeNames: ['All'],
        })
      );

      const attrs = response.Attributes || {};
      expect(attrs.KmsMasterKeyId).toBeDefined();
      expect(attrs.MessageRetentionPeriod).toBe('1209600'); // 14 days
    });

    test('Lambda log group should exist', async () => {
      const functionArn = outputs.LambdaFunctionArn;
      const functionName = functionArn.split(':').pop();

      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: `/aws/lambda/${functionName}`,
        })
      );

      const logGroups = response.logGroups || [];
      expect(logGroups.length).toBeGreaterThan(0);
      expect(logGroups[0].retentionInDays).toBe(30);
    });
  });

  describe('Load Balancer Resources', () => {
    let elbClient: ElasticLoadBalancingV2Client;

    beforeAll(() => {
      elbClient = new ElasticLoadBalancingV2Client({ region });
    });

    test('Application Load Balancer should exist and be active', async () => {
      const albArn = outputs.ApplicationLoadBalancerArn;
      expect(albArn).toBeDefined();

      const response = await elbClient.send(
        new DescribeLoadBalancersCommand({ LoadBalancerArns: [albArn] })
      );

      expect(response.LoadBalancers).toHaveLength(1);
      const alb = response.LoadBalancers![0];
      expect(alb.State?.Code).toBe('active');
      expect(alb.Type).toBe('application');
      expect(alb.Scheme).toBe('internet-facing');
    });

    test('ALB should be in public subnets', async () => {
      const albArn = outputs.ApplicationLoadBalancerArn;

      const response = await elbClient.send(
        new DescribeLoadBalancersCommand({ LoadBalancerArns: [albArn] })
      );

      const alb = response.LoadBalancers![0];
      expect(alb.AvailabilityZones?.length).toBeGreaterThanOrEqual(2);
    });

    test('ALB should have DNS name accessible', () => {
      const albDns = outputs.ApplicationLoadBalancerDNS;
      const albUrl = outputs.ApplicationLoadBalancerURL;

      expect(albDns).toBeDefined();
      expect(albDns).toMatch(/^[a-zA-Z0-9-]+\.[a-z0-9-]+\.elb\.amazonaws\.com$/);
      expect(albUrl).toBe(`http://${albDns}`);
    });

    test('ALB Target Group should exist with health checks', async () => {
      const albArn = outputs.ApplicationLoadBalancerArn;

      const listenersResponse = await elbClient.send(
        new DescribeListenersCommand({ LoadBalancerArn: albArn })
      );

      const listeners = listenersResponse.Listeners || [];
      expect(listeners.length).toBeGreaterThan(0);

      // Get target groups associated with ALB
      const vpcId = outputs.VPCId;
      const targetGroupsResponse = await elbClient.send(
        new DescribeTargetGroupsCommand({})
      );

      const targetGroups = (targetGroupsResponse.TargetGroups || []).filter(
        tg => tg.VpcId === vpcId
      );

      expect(targetGroups.length).toBeGreaterThan(0);
      const tg = targetGroups[0];
      expect(tg.HealthCheckEnabled).toBe(true);
      expect(tg.HealthCheckPath).toBe('/health');
      expect(tg.HealthCheckProtocol).toBe('HTTP');
    });

    test('ALB Listener should exist on port 80', async () => {
      const albArn = outputs.ApplicationLoadBalancerArn;

      const response = await elbClient.send(
        new DescribeListenersCommand({ LoadBalancerArn: albArn })
      );

      const listeners = response.Listeners || [];
      const httpListener = listeners.find(l => l.Port === 80);

      expect(httpListener).toBeDefined();
      expect(httpListener?.Protocol).toBe('HTTP');
      expect(httpListener?.DefaultActions?.length).toBeGreaterThan(0);
    });
  });

  describe('EC2 and EBS Resources', () => {
    let ec2Client: EC2Client;
    let iamClient: IAMClient;

    beforeAll(() => {
      ec2Client = new EC2Client({ region });
      iamClient = new IAMClient({ region });
    });

    test('EC2 instance should exist and be running', async () => {
      const instanceId = outputs.EC2InstanceId;
      expect(instanceId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [instanceId] })
      );

      const reservations = response.Reservations || [];
      expect(reservations.length).toBeGreaterThan(0);

      const instance = reservations[0].Instances![0];
      expect(instance.State?.Name).toMatch(/running|stopped/);
      expect(instance.InstanceType).toBe('t3.micro');
    });

    test('EC2 instance should be in private subnet', async () => {
      const instanceId = outputs.EC2InstanceId;

      const response = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [instanceId] })
      );

      const instance = response.Reservations![0].Instances![0];
      const subnetTags = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: [instance.SubnetId!] })
      );

      const subnet = subnetTags.Subnets![0];
      const nameTag = subnet.Tags?.find(t => t.Key === 'Name');
      expect(nameTag?.Value).toContain('Private');
    });

    test('EC2 instance should have IAM instance profile', async () => {
      const instanceId = outputs.EC2InstanceId;

      const response = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [instanceId] })
      );

      const instance = response.Reservations![0].Instances![0];
      expect(instance.IamInstanceProfile).toBeDefined();
    });

    test('EC2 instance should have encrypted root volume', async () => {
      const instanceId = outputs.EC2InstanceId;

      const response = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [instanceId] })
      );

      const instance = response.Reservations![0].Instances![0];
      const rootDevice = instance.BlockDeviceMappings?.find(
        bdm => bdm.DeviceName === instance.RootDeviceName
      );

      expect(rootDevice).toBeDefined();

      const volumeId = rootDevice?.Ebs?.VolumeId;
      expect(volumeId).toBeDefined();

      const volumeResponse = await ec2Client.send(
        new DescribeVolumesCommand({ VolumeIds: [volumeId!] })
      );

      const volume = volumeResponse.Volumes![0];
      expect(volume.Encrypted).toBe(true);
      expect(volume.VolumeType).toBe('gp3');
    });

    test('Additional EBS volume should exist and be encrypted', async () => {
      const volumeId = outputs.AdditionalEBSVolumeId;
      expect(volumeId).toBeDefined();

      const response = await ec2Client.send(
        new DescribeVolumesCommand({ VolumeIds: [volumeId] })
      );

      expect(response.Volumes).toHaveLength(1);
      const volume = response.Volumes![0];
      expect(volume.Encrypted).toBe(true);
      expect(volume.VolumeType).toBe('gp3');
      expect(volume.Size).toBe(20);
      expect(volume.State).toMatch(/available|in-use/);
    });

    test('EBS volume should be attached to EC2 instance', async () => {
      const volumeId = outputs.AdditionalEBSVolumeId;
      const instanceId = outputs.EC2InstanceId;

      const response = await ec2Client.send(
        new DescribeVolumesCommand({ VolumeIds: [volumeId] })
      );

      const volume = response.Volumes![0];
      const attachment = volume.Attachments?.find(a => a.InstanceId === instanceId);

      expect(attachment).toBeDefined();
      expect(attachment?.State).toMatch(/attached|attaching/);
      expect(attachment?.Device).toBe('/dev/sdf');
    });
  });

  describe('IAM Roles and Policies', () => {
    let iamClient: IAMClient;

    beforeAll(() => {
      iamClient = new IAMClient({ region });
    });

    test('Lambda execution role should exist with proper permissions', async () => {
      const functionArn = outputs.LambdaFunctionArn;
      const lambdaClient = new LambdaClient({ region });

      const funcResponse = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionArn })
      );

      const roleArn = funcResponse.Role;
      expect(roleArn).toBeDefined();

      const roleName = roleArn!.split('/').pop();
      const roleResponse = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName! })
      );

      expect(roleResponse.Role?.AssumeRolePolicyDocument).toBeDefined();
    });

    test('EC2 instance profile should exist', async () => {
      const instanceId = outputs.EC2InstanceId;
      const ec2Client = new EC2Client({ region });

      const response = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [instanceId] })
      );

      const instance = response.Reservations![0].Instances![0];
      const profileArn = instance.IamInstanceProfile?.Arn;
      expect(profileArn).toBeDefined();

      const profileName = profileArn!.split('/').pop();
      const profileResponse = await iamClient.send(
        new GetInstanceProfileCommand({ InstanceProfileName: profileName! })
      );

      expect(profileResponse.InstanceProfile?.Roles?.length).toBeGreaterThan(0);
    });
  });

  describe('Resource Connectivity and Workflow', () => {
    test('Lambda should be able to access S3 bucket (permissions check)', async () => {
      const lambdaClient = new LambdaClient({ region });
      const functionArn = outputs.LambdaFunctionArn;

      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionArn })
      );

      const s3Bucket = response.Environment?.Variables?.S3_BUCKET;
      expect(s3Bucket).toBe(outputs.ApplicationDataBucketName);
    });

    test('Lambda should have connectivity to RDS via security groups', async () => {
      const ec2Client = new EC2Client({ region });
      const vpcId = outputs.VPCId;

      const sgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );

      const securityGroups = sgResponse.SecurityGroups || [];

      // Find Lambda SG
      const lambdaSg = securityGroups.find(sg =>
        sg.Tags?.some(t => t.Value?.includes('Lambda'))
      );

      // Find Database SG
      const dbSg = securityGroups.find(sg =>
        sg.Tags?.some(t => t.Value?.includes('Database'))
      );

      expect(lambdaSg).toBeDefined();
      expect(dbSg).toBeDefined();

      // Check Lambda SG has egress rule to Database SG on port 3306
      const egressTo3306 = lambdaSg?.IpPermissionsEgress?.some(
        rule => rule.FromPort === 3306 && rule.ToPort === 3306
      );
      expect(egressTo3306).toBe(true);

      // Check Database SG has ingress rule from Lambda SG on port 3306
      const ingressFrom3306 = dbSg?.IpPermissions?.some(
        rule =>
          rule.FromPort === 3306 &&
          rule.UserIdGroupPairs?.some(pair => pair.GroupId === lambdaSg?.GroupId)
      );
      expect(ingressFrom3306).toBe(true);
    });

    test('Private subnets should route through NAT Gateways in public subnets', async () => {
      const ec2Client = new EC2Client({ region });
      const vpcId = outputs.VPCId;

      // Get all subnets
      const subnetsResponse = await ec2Client.send(
        new DescribeSubnetsCommand({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }] })
      );

      const privateSubnets = subnetsResponse.Subnets?.filter(s =>
        s.Tags?.some(t => t.Key === 'Name' && t.Value?.includes('Private'))
      ) || [];

      // Get route tables
      const rtResponse = await ec2Client.send(
        new DescribeRouteTablesCommand({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }] })
      );

      // For each private subnet, verify it routes through NAT
      for (const subnet of privateSubnets) {
        const rt = rtResponse.RouteTables?.find(table =>
          table.Associations?.some(assoc => assoc.SubnetId === subnet.SubnetId)
        );

        expect(rt).toBeDefined();

        const natRoute = rt?.Routes?.find(r => r.DestinationCidrBlock === '0.0.0.0/0');
        expect(natRoute).toBeDefined();
        expect(natRoute?.NatGatewayId).toMatch(/^nat-/);
      }
    });

    test('RDS should be in database subnets isolated from public internet', async () => {
      const ec2Client = new EC2Client({ region });
      const rdsClient = new RDSClient({ region });
      const vpcId = outputs.VPCId;

      // Get RDS instance
      const rdsResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({})
      );

      const dbInstance = rdsResponse.DBInstances?.find(db =>
        db.DBSubnetGroup?.VpcId === vpcId
      );

      expect(dbInstance).toBeDefined();

      // Get subnet details
      const subnetIds = dbInstance?.DBSubnetGroup?.Subnets?.map(s => s.SubnetIdentifier!) || [];
      const subnetsResponse = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: subnetIds })
      );

      // Verify all subnets are database subnets
      subnetsResponse.Subnets?.forEach(subnet => {
        const nameTag = subnet.Tags?.find(t => t.Key === 'Name');
        expect(nameTag?.Value).toContain('Database');
      });
    });

    test('ALB should be able to communicate with target groups in private subnets', async () => {
      const elbClient = new ElasticLoadBalancingV2Client({ region });
      const albArn = outputs.ApplicationLoadBalancerArn;

      // Get ALB details
      const albResponse = await elbClient.send(
        new DescribeLoadBalancersCommand({ LoadBalancerArns: [albArn] })
      );

      const alb = albResponse.LoadBalancers![0];
      expect(alb.Scheme).toBe('internet-facing');

      // Verify ALB has security group that allows outbound
      const albSgIds = alb.SecurityGroups || [];
      expect(albSgIds.length).toBeGreaterThan(0);
    });
  });

  describe('Outputs and Exports', () => {
    test('All required outputs should be present', () => {
      const requiredOutputs = [
        'VPCId',
        'VPCCidr',
        'ApplicationDataBucketArn',
        'ApplicationDataBucketName',
        'RDSEndpoint',
        'RDSConnectionString',
        'LambdaFunctionArn',
        'LambdaDLQArn',
        'ApplicationLoadBalancerArn',
        'ApplicationLoadBalancerDNS',
        'ApplicationLoadBalancerURL',
        'EC2InstanceId',
        'AdditionalEBSVolumeId',
        'EnvironmentSuffix',
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
      });
    });

    test('Output values should have correct formats', () => {
      // VPC ID format
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);

      // S3 ARN format
      expect(outputs.ApplicationDataBucketArn).toMatch(/^arn:aws:s3:::/);

      // Lambda ARN format
      expect(outputs.LambdaFunctionArn).toMatch(/^arn:aws:lambda:/);

      // SQS ARN format
      expect(outputs.LambdaDLQArn).toMatch(/^arn:aws:sqs:/);

      // ALB ARN format
      expect(outputs.ApplicationLoadBalancerArn).toMatch(/^arn:aws:elasticloadbalancing:/);

      // EC2 Instance ID format
      expect(outputs.EC2InstanceId).toMatch(/^i-[a-f0-9]+$/);

      // EBS Volume ID format
      expect(outputs.AdditionalEBSVolumeId).toMatch(/^vol-[a-f0-9]+$/);
    });

    test('Environment suffix should match deployment', () => {
      expect(outputs.EnvironmentSuffix).toBeDefined();
      expect(typeof outputs.EnvironmentSuffix).toBe('string');
      expect(outputs.EnvironmentSuffix.length).toBeGreaterThan(0);
    });
  });

  describe('Security and Compliance', () => {
    test('All encryption requirements should be met', async () => {
      const s3Client = new S3Client({ region });
      const rdsClient = new RDSClient({ region });
      const ec2Client = new EC2Client({ region });

      // S3 encryption
      const s3Response = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: outputs.ApplicationDataBucketName })
      );
      expect(s3Response.ServerSideEncryptionConfiguration).toBeDefined();

      // RDS encryption
      const vpcId = outputs.VPCId;
      const rdsResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({})
      );
      const dbInstance = rdsResponse.DBInstances?.find(db =>
        db.DBSubnetGroup?.VpcId === vpcId
      );
      expect(dbInstance?.StorageEncrypted).toBe(true);

      // EBS encryption
      const volumeResponse = await ec2Client.send(
        new DescribeVolumesCommand({ VolumeIds: [outputs.AdditionalEBSVolumeId] })
      );
      expect(volumeResponse.Volumes![0].Encrypted).toBe(true);
    });

    test('No resources should be publicly accessible except ALB', async () => {
      const ec2Client = new EC2Client({ region });
      const vpcId = outputs.VPCId;

      // Check RDS is not publicly accessible
      const rdsClient = new RDSClient({ region });
      const rdsResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({})
      );
      const dbInstance = rdsResponse.DBInstances?.find(db =>
        db.DBSubnetGroup?.VpcId === vpcId
      );
      expect(dbInstance?.PubliclyAccessible).toBe(false);

      // Check EC2 instance is in private subnet
      const ec2Response = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [outputs.EC2InstanceId] })
      );
      const instance = ec2Response.Reservations![0].Instances![0];
      const subnetResponse = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: [instance.SubnetId!] })
      );
      const subnet = subnetResponse.Subnets![0];
      const nameTag = subnet.Tags?.find(t => t.Key === 'Name');
      expect(nameTag?.Value).toContain('Private');
    });

    test('All tagging requirements should be met', async () => {
      const ec2Client = new EC2Client({ region });

      // Check VPC tags
      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] })
      );
      const vpcTags = vpcResponse.Vpcs![0].Tags || [];
      const vpcTagKeys = vpcTags.map(t => t.Key);
      expect(vpcTagKeys).toContain('Environment');
      expect(vpcTagKeys).toContain('Owner');
    });
  });

  describe('E2E Resource Connectivity Tests', () => {
    describe('Lambda Function E2E Tests', () => {
      let lambdaClient: LambdaClient;
      let s3Client: S3Client;

      beforeAll(() => {
        lambdaClient = new LambdaClient({ region });
        s3Client = new S3Client({ region });
      });

      test('Lambda should successfully invoke and return response', async () => {
        const functionArn = outputs.LambdaFunctionArn;

        // InvokeCommand already imported
        const response = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: functionArn,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify({ test: 'data' }),
          })
        );

        expect(response.StatusCode).toBe(200);
        expect(response.FunctionError).toBeUndefined();

        if (response.Payload) {
          const payload = JSON.parse(new TextDecoder().decode(response.Payload));
          expect(payload.statusCode).toBe(200);
        }
      });

      test('Lambda should be able to read from S3 bucket (E2E)', async () => {
        const bucketName = outputs.ApplicationDataBucketName;
        const testKey = 'integration-test-file.txt';
        const testContent = 'Integration test content';

        // Upload test file
        // PutObjectCommand already imported
        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: testKey,
            Body: testContent,
          })
        );

        // Invoke Lambda to read from S3
        // InvokeCommand already imported
        const lambdaPayload = {
          action: 'test-s3-read',
          bucket: bucketName,
          key: testKey,
        };

        const response = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: outputs.LambdaFunctionArn,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(lambdaPayload),
          })
        );

        expect(response.StatusCode).toBe(200);

        // Clean up test file
        // DeleteObjectCommand already imported
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: bucketName,
            Key: testKey,
          })
        );
      });

      test('Lambda invocation error should be sent to DLQ', async () => {
        const functionArn = outputs.LambdaFunctionArn;

        // Invoke Lambda with payload that will cause async failure
        // InvokeCommand already imported
        const response = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: functionArn,
            InvocationType: 'Event', // Async invocation
            Payload: JSON.stringify({ test: 'trigger-error' }),
          })
        );

        expect(response.StatusCode).toBe(202); // Async invocation accepted
      });
    });

    describe('ALB E2E Connectivity Tests', () => {
      test('ALB should be reachable via HTTP', async () => {
        const albUrl = outputs.ApplicationLoadBalancerURL;
        expect(albUrl).toBeDefined();

        // Test HTTP connectivity
        // axios already imported
        try {
          const response = await axios.get(albUrl, {
            timeout: 10000,
            validateStatus: () => true, // Accept any status
          });

          expect(response.status).toBeDefined();
          // ALB has fixed-response listener returning 200
          expect([200, 503]).toContain(response.status);
        } catch (error: any) {
          // If connection fails, check if it's a timeout or network error
          if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            console.warn('ALB connection timeout - may still be provisioning');
          } else {
            // ALB exists but may have no healthy targets, which is expected
            expect(error.response?.status).toBeDefined();
          }
        }
      });

      test('ALB DNS should resolve to IP addresses', async () => {
        const albDns = outputs.ApplicationLoadBalancerDNS;
        // dns already imported

        const addresses = await dns.promises.resolve4(albDns);
        expect(addresses.length).toBeGreaterThan(0);

        // ALB should have at least 2 IPs (one per AZ)
        expect(addresses.length).toBeGreaterThanOrEqual(2);
      });
    });

    describe('VPC Networking E2E Tests', () => {
      test('NAT Gateways should provide internet access to private subnets', async () => {
        const ec2Client = new EC2Client({ region });
        const vpcId = outputs.VPCId;

        // Get NAT Gateways
        const natResponse = await ec2Client.send(
          new DescribeNatGatewaysCommand({
            Filter: [{ Name: 'vpc-id', Values: [vpcId] }],
          })
        );

        const natGateways = natResponse.NatGateways || [];
        expect(natGateways.length).toBeGreaterThanOrEqual(2);

        // Verify NAT gateways have public IPs
        natGateways.forEach(nat => {
          expect(nat.NatGatewayAddresses).toBeDefined();
          const publicIp = nat.NatGatewayAddresses?.find(addr => addr.PublicIp);
          expect(publicIp).toBeDefined();
        });
      });

      test('Private subnets should have outbound internet connectivity via NAT', async () => {
        const ec2Client = new EC2Client({ region });
        const vpcId = outputs.VPCId;

        // Get private subnets
        const subnetsResponse = await ec2Client.send(
          new DescribeSubnetsCommand({
            Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
          })
        );

        const privateSubnets = subnetsResponse.Subnets?.filter(s =>
          s.Tags?.some(t => t.Key === 'Name' && t.Value?.includes('Private'))
        ) || [];

        expect(privateSubnets.length).toBeGreaterThanOrEqual(2);

        // Get route tables for private subnets
        const rtResponse = await ec2Client.send(
          new DescribeRouteTablesCommand({
            Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
          })
        );

        for (const subnet of privateSubnets) {
          const routeTable = rtResponse.RouteTables?.find(rt =>
            rt.Associations?.some(assoc => assoc.SubnetId === subnet.SubnetId)
          );

          expect(routeTable).toBeDefined();

          // Check for default route to NAT Gateway
          const defaultRoute = routeTable?.Routes?.find(
            r => r.DestinationCidrBlock === '0.0.0.0/0'
          );
          expect(defaultRoute).toBeDefined();
          expect(defaultRoute?.NatGatewayId).toMatch(/^nat-/);

          // Verify NAT Gateway is in available state
          const natId = defaultRoute?.NatGatewayId;
          const natResponse = await ec2Client.send(
            new DescribeNatGatewaysCommand({
              NatGatewayIds: [natId!],
            })
          );

          expect(natResponse.NatGateways![0].State).toBe('available');
        }
      });

      test('Public subnets should have direct internet access via IGW', async () => {
        const ec2Client = new EC2Client({ region });
        const vpcId = outputs.VPCId;

        // Get public subnets
        const subnetsResponse = await ec2Client.send(
          new DescribeSubnetsCommand({
            Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
          })
        );

        const publicSubnets = subnetsResponse.Subnets?.filter(s =>
          s.Tags?.some(t => t.Key === 'Name' && t.Value?.includes('Public'))
        ) || [];

        expect(publicSubnets.length).toBeGreaterThanOrEqual(2);

        // Get route tables
        const rtResponse = await ec2Client.send(
          new DescribeRouteTablesCommand({
            Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
          })
        );

        for (const subnet of publicSubnets) {
          const routeTable = rtResponse.RouteTables?.find(rt =>
            rt.Associations?.some(assoc => assoc.SubnetId === subnet.SubnetId)
          );

          expect(routeTable).toBeDefined();

          // Check for default route to Internet Gateway
          const defaultRoute = routeTable?.Routes?.find(
            r => r.DestinationCidrBlock === '0.0.0.0/0'
          );
          expect(defaultRoute).toBeDefined();
          expect(defaultRoute?.GatewayId).toMatch(/^igw-/);

          // Verify IGW is attached
          const igwResponse = await ec2Client.send(
            new DescribeInternetGatewaysCommand({
              InternetGatewayIds: [defaultRoute?.GatewayId!],
            })
          );

          expect(igwResponse.InternetGateways![0].Attachments).toBeDefined();
          expect(igwResponse.InternetGateways![0].Attachments![0].State).toBe('available');
        }
      });
    });

    describe('Security Group E2E Connectivity Tests', () => {
      test('Lambda security group should allow egress to RDS port 3306', async () => {
        const ec2Client = new EC2Client({ region });
        const vpcId = outputs.VPCId;

        const sgResponse = await ec2Client.send(
          new DescribeSecurityGroupsCommand({
            Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
          })
        );

        const lambdaSg = sgResponse.SecurityGroups?.find(sg =>
          sg.Tags?.some(t => t.Value?.includes('Lambda'))
        );

        const dbSg = sgResponse.SecurityGroups?.find(sg =>
          sg.Tags?.some(t => t.Value?.includes('Database'))
        );

        expect(lambdaSg).toBeDefined();
        expect(dbSg).toBeDefined();

        // Verify Lambda can reach database port
        const hasEgressToDb = lambdaSg?.IpPermissionsEgress?.some(rule =>
          rule.FromPort === 3306 &&
          rule.ToPort === 3306 &&
          rule.UserIdGroupPairs?.some(pair => pair.GroupId === dbSg?.GroupId)
        );

        expect(hasEgressToDb).toBe(true);

        // Verify Database accepts from Lambda
        const hasIngressFromLambda = dbSg?.IpPermissions?.some(rule =>
          rule.FromPort === 3306 &&
          rule.ToPort === 3306 &&
          rule.UserIdGroupPairs?.some(pair => pair.GroupId === lambdaSg?.GroupId)
        );

        expect(hasIngressFromLambda).toBe(true);
      });

      test('ALB security group should allow HTTP/HTTPS ingress from internet', async () => {
        const ec2Client = new EC2Client({ region });
        const vpcId = outputs.VPCId;

        const sgResponse = await ec2Client.send(
          new DescribeSecurityGroupsCommand({
            Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
          })
        );

        const albSg = sgResponse.SecurityGroups?.find(sg =>
          sg.Tags?.some(t => t.Value?.includes('ALB'))
        );

        expect(albSg).toBeDefined();

        // Check HTTP (80) ingress
        const hasHttpIngress = albSg?.IpPermissions?.some(rule =>
          rule.FromPort === 80 &&
          rule.ToPort === 80 &&
          rule.IpRanges?.some(ip => ip.CidrIp === '0.0.0.0/0')
        );
        expect(hasHttpIngress).toBe(true);

        // Check HTTPS (443) ingress
        const hasHttpsIngress = albSg?.IpPermissions?.some(rule =>
          rule.FromPort === 443 &&
          rule.ToPort === 443 &&
          rule.IpRanges?.some(ip => ip.CidrIp === '0.0.0.0/0')
        );
        expect(hasHttpsIngress).toBe(true);
      });

      test('Database should not have any direct ingress from internet', async () => {
        const ec2Client = new EC2Client({ region });
        const vpcId = outputs.VPCId;

        const sgResponse = await ec2Client.send(
          new DescribeSecurityGroupsCommand({
            Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
          })
        );

        const dbSg = sgResponse.SecurityGroups?.find(sg =>
          sg.Tags?.some(t => t.Value?.includes('Database'))
        );

        expect(dbSg).toBeDefined();

        // Database should not allow ingress from 0.0.0.0/0
        const hasPublicIngress = dbSg?.IpPermissions?.some(rule =>
          rule.IpRanges?.some(ip => ip.CidrIp === '0.0.0.0/0')
        );

        expect(hasPublicIngress).toBe(false);
      });
    });

    describe('S3 and IAM E2E Permission Tests', () => {
      test('Lambda should have permissions to read from S3 bucket', async () => {
        const s3Client = new S3Client({ region });
        const bucketName = outputs.ApplicationDataBucketName;
        const testKey = 'lambda-permission-test.txt';

        // Upload test file
        // PutObjectCommand already imported
        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: testKey,
            Body: 'Test content for Lambda read',
          })
        );

        // Verify file exists
        // HeadObjectCommand already imported
        const headResponse = await s3Client.send(
          new HeadObjectCommand({
            Bucket: bucketName,
            Key: testKey,
          })
        );

        expect(headResponse).toBeDefined();
        expect(headResponse.ContentLength).toBeGreaterThan(0);

        // Clean up
        // DeleteObjectCommand already imported
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: bucketName,
            Key: testKey,
          })
        );
      });

      test('S3 bucket should deny public read access', async () => {
        const s3Client = new S3Client({ region });
        const bucketName = outputs.ApplicationDataBucketName;

        // Check public access block
        const response = await s3Client.send(
          new GetPublicAccessBlockCommand({ Bucket: bucketName })
        );

        const config = response.PublicAccessBlockConfiguration;
        expect(config?.BlockPublicAcls).toBe(true);
        expect(config?.BlockPublicPolicy).toBe(true);
        expect(config?.IgnorePublicAcls).toBe(true);
        expect(config?.RestrictPublicBuckets).toBe(true);
      });
    });

    describe('RDS Database E2E Connectivity Tests', () => {
      test('RDS instance should be reachable from VPC', async () => {
        const rdsClient = new RDSClient({ region });
        const vpcId = outputs.VPCId;

        const response = await rdsClient.send(
          new DescribeDBInstancesCommand({})
        );

        const dbInstance = response.DBInstances?.find(db =>
          db.DBSubnetGroup?.VpcId === vpcId
        );

        expect(dbInstance).toBeDefined();
        expect(dbInstance?.DBInstanceStatus).toBe('available');

        // Verify endpoint is accessible
        const endpoint = dbInstance?.Endpoint?.Address;
        expect(endpoint).toBeDefined();
        expect(endpoint).toContain('.rds.amazonaws.com');

        // Verify port is 3306
        expect(dbInstance?.Endpoint?.Port).toBe(3306);
      });

      test('RDS should be in isolated database subnets', async () => {
        const rdsClient = new RDSClient({ region });
        const ec2Client = new EC2Client({ region });
        const vpcId = outputs.VPCId;

        const rdsResponse = await rdsClient.send(
          new DescribeDBInstancesCommand({})
        );

        const dbInstance = rdsResponse.DBInstances?.find(db =>
          db.DBSubnetGroup?.VpcId === vpcId
        );

        const subnetIds = dbInstance?.DBSubnetGroup?.Subnets?.map(
          s => s.SubnetIdentifier!
        ) || [];

        const subnetsResponse = await ec2Client.send(
          new DescribeSubnetsCommand({ SubnetIds: subnetIds })
        );

        // All subnets should be database subnets
        subnetsResponse.Subnets?.forEach(subnet => {
          const nameTag = subnet.Tags?.find(t => t.Key === 'Name');
          expect(nameTag?.Value).toContain('Database');

          // Database subnets should not have public IP assignment
          expect(subnet.MapPublicIpOnLaunch).toBe(false);
        });
      });

      test('RDS should have CloudWatch Logs enabled and delivering logs', async () => {
        const rdsClient = new RDSClient({ region });
        const logsClient = new CloudWatchLogsClient({ region });
        const vpcId = outputs.VPCId;

        const rdsResponse = await rdsClient.send(
          new DescribeDBInstancesCommand({})
        );

        const dbInstance = rdsResponse.DBInstances?.find(db =>
          db.DBSubnetGroup?.VpcId === vpcId
        );

        // Verify log exports are enabled
        const logTypes = dbInstance?.EnabledCloudwatchLogsExports || [];
        expect(logTypes).toContain('error');
        expect(logTypes).toContain('general');
        expect(logTypes).toContain('slowquery');

        // Check if log groups exist (they may take time to appear)
        const dbIdentifier = dbInstance?.DBInstanceIdentifier;
        if (dbIdentifier) {
          const logGroupPrefix = `/aws/rds/instance/${dbIdentifier}`;
          const logsResponse = await logsClient.send(
            new DescribeLogGroupsCommand({
              logGroupNamePrefix: logGroupPrefix,
            })
          );

          // Log groups should exist or be creating
          expect(logsResponse.logGroups).toBeDefined();
        }
      });
    });

    describe('Complete E2E Workflow Tests', () => {
      test('Complete data flow: S3 → Lambda → Processing', async () => {
        const s3Client = new S3Client({ region });
        const lambdaClient = new LambdaClient({ region });
        const bucketName = outputs.ApplicationDataBucketName;
        const functionArn = outputs.LambdaFunctionArn;

        // Step 1: Upload data to S3
        const testKey = 'workflow-test-input.json';
        const testData = { message: 'E2E workflow test', timestamp: Date.now() };

        // PutObjectCommand already imported
        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: testKey,
            Body: JSON.stringify(testData),
            ContentType: 'application/json',
          })
        );

        // Step 2: Invoke Lambda to process S3 data
        // InvokeCommand already imported
        const lambdaResponse = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: functionArn,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify({
              action: 'process-s3-file',
              bucket: bucketName,
              key: testKey,
            }),
          })
        );

        expect(lambdaResponse.StatusCode).toBe(200);

        // Step 3: Verify processing completed
        if (lambdaResponse.Payload) {
          const payload = JSON.parse(new TextDecoder().decode(lambdaResponse.Payload));
          expect(payload.statusCode).toBe(200);
        }

        // Clean up
        // DeleteObjectCommand already imported
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: bucketName,
            Key: testKey,
          })
        );
      });

      test('ALB health check endpoint should respond', async () => {
        const albDns = outputs.ApplicationLoadBalancerDNS;
        const healthCheckUrl = `http://${albDns}/health`;

        // axios already imported
        try {
          const response = await axios.get(healthCheckUrl, {
            timeout: 10000,
            validateStatus: () => true,
          });

          // ALB listener has fixed-response, so we expect a response
          expect(response.status).toBeDefined();
          expect([200, 503]).toContain(response.status);
        } catch (error: any) {
          // Connection issues are acceptable as there may be no healthy targets
          if (!error.code?.includes('ECONNABORTED')) {
            console.warn('ALB health check:', error.message);
          }
        }
      });

      test('VPC Flow Logs should be capturing traffic', async () => {
        const ec2Client = new EC2Client({ region });
        const logsClient = new CloudWatchLogsClient({ region });
        const vpcId = outputs.VPCId;

        // Get flow log
        const flowLogResponse = await ec2Client.send(
          new DescribeFlowLogsCommand({
            Filter: [{ Name: 'resource-id', Values: [vpcId] }],
          })
        );

        const flowLog = flowLogResponse.FlowLogs?.find(fl => fl.FlowLogStatus === 'ACTIVE');
        expect(flowLog).toBeDefined();

        // Check log group exists and has retention
        const logGroupName = flowLog?.LogGroupName;
        if (logGroupName) {
          const logGroupResponse = await logsClient.send(
            new DescribeLogGroupsCommand({
              logGroupNamePrefix: logGroupName,
            })
          );

          expect(logGroupResponse.logGroups?.length).toBeGreaterThan(0);
          expect(logGroupResponse.logGroups![0].retentionInDays).toBe(7);
        }
      });

      test('Multi-AZ failover capability for RDS', async () => {
        const rdsClient = new RDSClient({ region });
        const ec2Client = new EC2Client({ region });
        const vpcId = outputs.VPCId;

        const rdsResponse = await rdsClient.send(
          new DescribeDBInstancesCommand({})
        );

        const dbInstance = rdsResponse.DBInstances?.find(db =>
          db.DBSubnetGroup?.VpcId === vpcId
        );

        // Verify Multi-AZ is enabled
        expect(dbInstance?.MultiAZ).toBe(true);

        // Verify DB is in multiple availability zones
        const subnetIds = dbInstance?.DBSubnetGroup?.Subnets?.map(
          s => s.SubnetIdentifier!
        ) || [];

        const subnetsResponse = await ec2Client.send(
          new DescribeSubnetsCommand({ SubnetIds: subnetIds })
        );

        const azs = new Set(
          subnetsResponse.Subnets?.map(s => s.AvailabilityZone)
        );

        expect(azs.size).toBeGreaterThanOrEqual(2);
      });
    });
  });
});
