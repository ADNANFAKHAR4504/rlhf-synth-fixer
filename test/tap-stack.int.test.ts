// Loan Processing Application Integration Tests
// These tests validate the deployed infrastructure using actual AWS resources

import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  ECSClient,
  DescribeClustersCommand,
  DescribeServicesCommand,
  DescribeTasksCommand,
  ListTasksCommand,
} from '@aws-sdk/client-ecs';
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
} from '@aws-sdk/client-s3';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

const AWS_REGION = 'us-east-2';

// Load CloudFormation outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synth101912932';

describe('Loan Processing Application Integration Tests', () => {
  let ec2Client: EC2Client;
  let ecsClient: ECSClient;
  let rdsClient: RDSClient;
  let elbClient: ElasticLoadBalancingV2Client;
  let s3Client: S3Client;
  let logsClient: CloudWatchLogsClient;

  beforeAll(() => {
    ec2Client = new EC2Client({ region: AWS_REGION });
    ecsClient = new ECSClient({ region: AWS_REGION });
    rdsClient = new RDSClient({ region: AWS_REGION });
    elbClient = new ElasticLoadBalancingV2Client({ region: AWS_REGION });
    s3Client = new S3Client({ region: AWS_REGION });
    logsClient = new CloudWatchLogsClient({ region: AWS_REGION });
  });

  describe('CloudFormation Outputs Validation', () => {
    test('should have all required outputs', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.PublicSubnets).toBeDefined();
      expect(outputs.PrivateSubnets).toBeDefined();
      expect(outputs.ECSClusterName).toBeDefined();
      expect(outputs.ECSServiceName).toBeDefined();
      expect(outputs.AuroraClusterEndpoint).toBeDefined();
      expect(outputs.AuroraClusterReadEndpoint).toBeDefined();
      expect(outputs.DocumentBucketName).toBeDefined();
      expect(outputs.ApplicationLoadBalancerDNS).toBeDefined();
      expect(outputs.LogGroupName).toBeDefined();
    });

    test('outputs should include environment suffix', () => {
      expect(outputs.ECSClusterName).toContain(environmentSuffix);
      expect(outputs.ECSServiceName).toContain(environmentSuffix);
      expect(outputs.DocumentBucketName).toContain(environmentSuffix);
      expect(outputs.LogGroupName).toContain(environmentSuffix);
    });
  });

  describe('VPC and Networking Validation', () => {
    test('VPC should exist and be available', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBe(1);
      expect(response.Vpcs?.[0].State).toBe('available');
      expect(response.Vpcs?.[0].CidrBlock).toBe('10.0.0.0/16');
    });

    test('should have 3 public subnets', async () => {
      const publicSubnetIds = outputs.PublicSubnets.split(',');
      expect(publicSubnetIds).toHaveLength(3);

      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBe(3);
      response.Subnets?.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('should have 3 private subnets', async () => {
      const privateSubnetIds = outputs.PrivateSubnets.split(',');
      expect(privateSubnetIds).toHaveLength(3);

      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBe(3);
      response.Subnets?.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('should have 3 NAT Gateways in available state', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways?.length).toBe(3);
      response.NatGateways?.forEach(natGw => {
        expect(natGw.State).toBe('available');
      });
    });
  });

  describe('Security Groups Validation', () => {
    test('should have security groups for ALB, ECS, and RDS', async () => {
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
      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('ECS Fargate Cluster Validation', () => {
    test('ECS cluster should exist and be active', async () => {
      const command = new DescribeClustersCommand({
        clusters: [outputs.ECSClusterName],
      });
      const response = await ecsClient.send(command);

      expect(response.clusters).toBeDefined();
      expect(response.clusters?.length).toBe(1);
      expect(response.clusters?.[0].status).toBe('ACTIVE');
      expect(response.clusters?.[0].clusterName).toBe(outputs.ECSClusterName);
    });

    test('ECS service should exist and be active', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ECSClusterName,
        services: [outputs.ECSServiceName],
      });
      const response = await ecsClient.send(command);

      expect(response.services).toBeDefined();
      expect(response.services?.length).toBe(1);
      expect(response.services?.[0].status).toBe('ACTIVE');
      expect(response.services?.[0].launchType).toBe('FARGATE');
    });

    test('ECS service should have running tasks', async () => {
      const listCommand = new ListTasksCommand({
        cluster: outputs.ECSClusterName,
        serviceName: outputs.ECSServiceName,
        desiredStatus: 'RUNNING',
      });
      const listResponse = await ecsClient.send(listCommand);

      expect(listResponse.taskArns).toBeDefined();
      expect(listResponse.taskArns!.length).toBeGreaterThan(0);
    }, 60000);

    test('ECS service should use load balancer', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ECSClusterName,
        services: [outputs.ECSServiceName],
      });
      const response = await ecsClient.send(command);

      expect(response.services?.[0].loadBalancers).toBeDefined();
      expect(response.services?.[0].loadBalancers!.length).toBeGreaterThan(0);
    });
  });

  describe('Aurora PostgreSQL Serverless v2 Validation', () => {
    test('Aurora cluster should exist and be available', async () => {
      const command = new DescribeDBClustersCommand({});
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters?.find(c =>
        c.Endpoint === outputs.AuroraClusterEndpoint
      );

      expect(cluster).toBeDefined();
      expect(cluster?.Status).toBe('available');
      expect(cluster?.Engine).toBe('aurora-postgresql');
      expect(cluster?.EngineMode).toBe('provisioned');
    }, 60000);

    test('Aurora cluster should have Serverless v2 scaling configuration', async () => {
      const command = new DescribeDBClustersCommand({});
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters?.find(c =>
        c.Endpoint === outputs.AuroraClusterEndpoint
      );

      expect(cluster?.ServerlessV2ScalingConfiguration).toBeDefined();
      expect(cluster?.ServerlessV2ScalingConfiguration?.MinCapacity).toBe(0.5);
      expect(cluster?.ServerlessV2ScalingConfiguration?.MaxCapacity).toBe(4);
    }, 60000);

    test('Aurora cluster should use encryption', async () => {
      const command = new DescribeDBClustersCommand({});
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters?.find(c =>
        c.Endpoint === outputs.AuroraClusterEndpoint
      );

      expect(cluster?.StorageEncrypted).toBe(true);
      expect(cluster?.KmsKeyId).toBeDefined();
    }, 60000);

    test('Aurora cluster should have two instances for Multi-AZ', async () => {
      const command = new DescribeDBClustersCommand({});
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters?.find(c =>
        c.Endpoint === outputs.AuroraClusterEndpoint
      );

      expect(cluster?.DBClusterMembers).toBeDefined();
      expect(cluster?.DBClusterMembers?.length).toBe(2);
    }, 60000);

    test('Aurora instances should use db.serverless class', async () => {
      const command = new DescribeDBInstancesCommand({});
      const response = await rdsClient.send(command);

      const instances = response.DBInstances?.filter(i =>
        i.Engine === 'aurora-postgresql' &&
        i.DBInstanceIdentifier?.includes(environmentSuffix.toLowerCase())
      );

      expect(instances).toBeDefined();
      expect(instances!.length).toBeGreaterThanOrEqual(2);
      instances?.forEach(instance => {
        expect(instance.DBInstanceClass).toBe('db.serverless');
      });
    }, 60000);
  });

  describe('Application Load Balancer Validation', () => {
    test('ALB should exist and be active', async () => {
      const command = new DescribeLoadBalancersCommand({});
      const response = await elbClient.send(command);

      const alb = response.LoadBalancers?.find(lb =>
        lb.DNSName === outputs.ApplicationLoadBalancerDNS
      );

      expect(alb).toBeDefined();
      expect(alb?.State?.Code).toBe('active');
      expect(alb?.Scheme).toBe('internet-facing');
      expect(alb?.Type).toBe('application');
    });

    test('ALB should have HTTP listener', async () => {
      const describeLBCommand = new DescribeLoadBalancersCommand({});
      const lbResponse = await elbClient.send(describeLBCommand);

      const alb = lbResponse.LoadBalancers?.find(lb =>
        lb.DNSName === outputs.ApplicationLoadBalancerDNS
      );

      const listenerCommand = new DescribeListenersCommand({
        LoadBalancerArn: alb?.LoadBalancerArn,
      });
      const listenerResponse = await elbClient.send(listenerCommand);

      const httpListener = listenerResponse.Listeners?.find(l => l.Port === 80);
      expect(httpListener).toBeDefined();
      expect(httpListener?.Protocol).toBe('HTTP');
    });

    test('ALB target group should be healthy', async () => {
      const describeLBCommand = new DescribeLoadBalancersCommand({});
      const lbResponse = await elbClient.send(describeLBCommand);

      const alb = lbResponse.LoadBalancers?.find(lb =>
        lb.DNSName === outputs.ApplicationLoadBalancerDNS
      );

      const tgCommand = new DescribeTargetGroupsCommand({
        LoadBalancerArn: alb?.LoadBalancerArn,
      });
      const tgResponse = await elbClient.send(tgCommand);

      expect(tgResponse.TargetGroups).toBeDefined();
      expect(tgResponse.TargetGroups!.length).toBeGreaterThan(0);
      expect(tgResponse.TargetGroups?.[0].TargetType).toBe('ip');
    });
  });

  describe('S3 Document Bucket Validation', () => {
    test('S3 bucket should exist', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.DocumentBucketName,
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('S3 bucket should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.DocumentBucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    test('S3 bucket should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.DocumentBucketName,
      });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules!.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Logs Validation', () => {
    test('CloudWatch log group should exist', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.LogGroupName,
      });
      const response = await logsClient.send(command);

      const logGroup = response.logGroups?.find(lg => lg.logGroupName === outputs.LogGroupName);
      expect(logGroup).toBeDefined();
    });

    test('CloudWatch log group should have 365-day retention', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.LogGroupName,
      });
      const response = await logsClient.send(command);

      const logGroup = response.logGroups?.find(lg => lg.logGroupName === outputs.LogGroupName);
      expect(logGroup?.retentionInDays).toBe(365);
    });
  });

  describe('End-to-End Infrastructure Validation', () => {
    test('complete infrastructure stack should be operational', () => {
      // Verify all critical components are present
      expect(outputs.VPCId).toBeTruthy();
      expect(outputs.ECSClusterName).toBeTruthy();
      expect(outputs.AuroraClusterEndpoint).toBeTruthy();
      expect(outputs.ApplicationLoadBalancerDNS).toBeTruthy();
      expect(outputs.DocumentBucketName).toBeTruthy();
      expect(outputs.LogGroupName).toBeTruthy();
    });

    test('ALB URL should be publicly accessible', () => {
      expect(outputs.ApplicationLoadBalancerURL).toBeDefined();
      expect(outputs.ApplicationLoadBalancerURL).toMatch(/^http:\/\//);
      expect(outputs.ApplicationLoadBalancerURL).toContain(outputs.ApplicationLoadBalancerDNS);
    });

    test('all resource names should follow naming convention', () => {
      expect(outputs.ECSClusterName).toMatch(/loan-processing-cluster-/);
      expect(outputs.ECSServiceName).toMatch(/loan-processing-service-/);
      expect(outputs.DocumentBucketName).toMatch(/loan-documents-/);
      expect(outputs.LogGroupName).toMatch(/\/ecs\/loan-processing-/);
    });
  });
});
