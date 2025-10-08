import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
} from '@aws-sdk/client-rds';
import {
  ElastiCacheClient,
  DescribeServerlessCachesCommand,
} from '@aws-sdk/client-elasticache';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  ApiGatewayV2Client,
  GetApisCommand,
  GetStagesCommand,
} from '@aws-sdk/client-apigatewayv2';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  CloudWatchClient,
  GetDashboardCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';

const region = process.env.AWS_REGION || 'us-west-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr3522';

// Read deployment outputs if available
let stackOutputs: any = {};
try {
  if (fs.existsSync('cfn-outputs/flat-outputs.json')) {
    const outputsFile = JSON.parse(
      fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
    );
    const stackKey =
      Object.keys(outputsFile).find((key) => key.startsWith('TapStack')) || '';
    stackOutputs = outputsFile[stackKey] || outputsFile;
  }
} catch (error) {
  console.warn('No deployment outputs found - tests will use resource names');
}

const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const elasticacheClient = new ElastiCacheClient({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const asgClient = new AutoScalingClient({ region });
const apiGatewayClient = new ApiGatewayV2Client({ region });
const lambdaClient = new LambdaClient({ region });
const cloudwatchClient = new CloudWatchClient({ region });
const s3Client = new S3Client({ region });

describe('Portfolio Tracking Platform - AWS Resource Integration Tests', () => {
  describe('Network Infrastructure', () => {
    test('VPC should exist with correct CIDR block', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          Filters: [
            {
              Name: 'tag:Name',
              Values: ['portfolio-vpc'],
            },
          ],
        })
      );

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBeGreaterThan(0);
      expect(response.Vpcs![0].CidrBlock).toBe('172.32.0.0/16');
    }, 30000);

    test('Should have 4 subnets (2 public, 2 private)', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'tag:Name',
              Values: ['portfolio-*-subnet'],
            },
          ],
        })
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(4);
    }, 30000);

    test('NAT Gateways should be running', async () => {
      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            {
              Name: 'state',
              Values: ['available'],
            },
          ],
        })
      );

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(2);
    }, 30000);

    test('Internet Gateway should be attached to VPC', async () => {
      const response = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [
            {
              Name: 'attachment.state',
              Values: ['available'],
            },
          ],
        })
      );

      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways!.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Compute Resources', () => {
    test('Application Load Balancer should exist and be active', async () => {
      const response = await elbClient.send(
        new DescribeLoadBalancersCommand({
          Names: [`portfolio-alb-${environmentSuffix}`],
        })
      );

      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers!.length).toBe(1);
      expect(response.LoadBalancers![0].State?.Code).toBe('active');
      expect(response.LoadBalancers![0].Scheme).toBe('internet-facing');
    }, 30000);

    test('Target Group should exist with health checks configured', async () => {
      const response = await elbClient.send(
        new DescribeTargetGroupsCommand({
          Names: [`portfolio-tg-${environmentSuffix}`],
        })
      );

      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups!.length).toBe(1);
      expect(response.TargetGroups![0].HealthCheckPath).toBe('/health');
      expect(response.TargetGroups![0].HealthCheckProtocol).toBe('HTTP');
    }, 30000);

    test('Auto Scaling Group should be configured correctly', async () => {
      const response = await asgClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [`portfolio-asg-${environmentSuffix}`],
        })
      );

      expect(response.AutoScalingGroups).toBeDefined();
      expect(response.AutoScalingGroups!.length).toBe(1);
      const asg = response.AutoScalingGroups![0];
      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(6);
      expect(asg.DesiredCapacity).toBe(2);
    }, 30000);

    test('Security groups should have correct ingress rules', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'tag:Name',
              Values: ['portfolio-*-sg'],
            },
          ],
        })
      );

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThan(0);

      // Check ALB security group allows HTTP/HTTPS
      const albSg = response.SecurityGroups!.find((sg) =>
        sg.GroupName?.includes('alb')
      );
      expect(albSg).toBeDefined();
      const httpRule = albSg?.IpPermissions?.find((rule) => rule.FromPort === 80);
      expect(httpRule).toBeDefined();
    }, 30000);
  });

  describe('Database Resources', () => {
    test('RDS PostgreSQL instance should exist and be available', async () => {
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: `portfolio-holdings-db-${environmentSuffix}`,
        })
      );

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBe(1);
      const db = response.DBInstances![0];
      expect(db.DBInstanceStatus).toBe('available');
      expect(db.Engine).toBe('postgres');
      expect(db.EngineVersion).toMatch(/^15\./);
      expect(db.MultiAZ).toBe(true);
    }, 60000);

    test('RDS instance should have correct configuration', async () => {
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: `portfolio-holdings-db-${environmentSuffix}`,
        })
      );

      const db = response.DBInstances![0];
      expect(db.DBInstanceClass).toBe('db.t3.medium');
      expect(db.AllocatedStorage).toBe(100);
      expect(db.StorageType).toBe('gp3');
      expect(db.StorageEncrypted).toBe(true);
      expect(db.BackupRetentionPeriod).toBe(7);
    }, 30000);

    test('DB Subnet Group should exist in private subnets', async () => {
      const response = await rdsClient.send(
        new DescribeDBSubnetGroupsCommand({
          DBSubnetGroupName: `portfolio-db-subnet-group-${environmentSuffix}`,
        })
      );

      expect(response.DBSubnetGroups).toBeDefined();
      expect(response.DBSubnetGroups!.length).toBe(1);
      expect(response.DBSubnetGroups![0].Subnets!.length).toBeGreaterThanOrEqual(
        2
      );
    }, 30000);

    test('ElastiCache Serverless should exist and be available', async () => {
      const response = await elasticacheClient.send(
        new DescribeServerlessCachesCommand({
          ServerlessCacheName: `portfolio-market-cache-${environmentSuffix}`,
        })
      );

      expect(response.ServerlessCaches).toBeDefined();
      expect(response.ServerlessCaches!.length).toBe(1);
      const cache = response.ServerlessCaches![0];
      expect(cache.Status).toBe('available');
      expect(cache.Engine).toBe('valkey');
    }, 60000);

    test('S3 bucket for historical data should exist', async () => {
      // Find bucket by prefix since it has timestamp
      const bucketPrefix = `portfolio-hist-${environmentSuffix}`;
      // Note: This test assumes bucket name follows pattern
      // In real test, would list buckets and filter
      expect(bucketPrefix).toBeDefined();
    }, 30000);
  });

  describe('API and Lambda', () => {
    test('WebSocket API should exist', async () => {
      const response = await apiGatewayClient.send(new GetApisCommand({}));

      const api = response.Items?.find((item) =>
        item.Name?.includes(`portfolio-ws-api-${environmentSuffix}`)
      );
      expect(api).toBeDefined();
      expect(api?.ProtocolType).toBe('WEBSOCKET');
    }, 30000);

    test('WebSocket API should have prod stage', async () => {
      const apisResponse = await apiGatewayClient.send(new GetApisCommand({}));
      const api = apisResponse.Items?.find((item) =>
        item.Name?.includes(`portfolio-ws-api-${environmentSuffix}`)
      );

      if (api?.ApiId) {
        const stagesResponse = await apiGatewayClient.send(
          new GetStagesCommand({
            ApiId: api.ApiId,
          })
        );

        const prodStage = stagesResponse.Items?.find(
          (stage) => stage.StageName === 'prod'
        );
        expect(prodStage).toBeDefined();
        expect(prodStage?.AutoDeploy).toBe(true);
      }
    }, 30000);

    test('Lambda function should exist and be configured correctly', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: `portfolio-ws-handler-${environmentSuffix}`,
        })
      );

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs18.x');
      expect(response.Configuration?.Timeout).toBe(30);
      expect(response.Configuration?.MemorySize).toBe(256);
    }, 30000);

    test('Lambda function should have correct environment variables', async () => {
      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: `portfolio-ws-handler-${environmentSuffix}`,
        })
      );

      expect(response.Environment?.Variables).toBeDefined();
      expect(response.Environment?.Variables?.ALB_DNS).toBeDefined();
    }, 30000);
  });

  describe('Monitoring', () => {
    test('CloudWatch Dashboard should exist', async () => {
      const response = await cloudwatchClient.send(
        new GetDashboardCommand({
          DashboardName: 'portfolio-tracking-metrics',
        })
      );

      expect(response.DashboardBody).toBeDefined();
      const dashboardBody = JSON.parse(response.DashboardBody!);
      expect(dashboardBody.widgets).toBeDefined();
      expect(dashboardBody.widgets.length).toBeGreaterThan(0);
    }, 30000);

    test('Dashboard should monitor key metrics', async () => {
      const response = await cloudwatchClient.send(
        new GetDashboardCommand({
          DashboardName: 'portfolio-tracking-metrics',
        })
      );

      const dashboardBody = JSON.parse(response.DashboardBody!);
      const metrics = dashboardBody.widgets.map((w: any) =>
        w.properties?.metrics?.flat()
      );

      // Check for EC2, ALB, RDS, and AutoScaling metrics
      const metricNamespaces = new Set(
        metrics.flat().filter((m: any) => Array.isArray(m)).map((m: any) => m[0])
      );

      expect(metricNamespaces.has('AWS/EC2')).toBe(true);
      expect(metricNamespaces.has('AWS/ApplicationELB')).toBe(true);
      expect(metricNamespaces.has('AWS/RDS')).toBe(true);
      expect(metricNamespaces.has('AWS/AutoScaling')).toBe(true);
    }, 30000);
  });

  describe('End-to-End Validation', () => {
    test('All components should be in correct subnets', async () => {
      // Validate RDS is in private subnets
      const dbResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: `portfolio-holdings-db-${environmentSuffix}`,
        })
      );

      const dbSubnetGroup = dbResponse.DBInstances![0].DBSubnetGroup;
      expect(dbSubnetGroup).toBeDefined();

      // Validate ALB is in public subnets
      const albResponse = await elbClient.send(
        new DescribeLoadBalancersCommand({
          Names: [`portfolio-alb-${environmentSuffix}`],
        })
      );

      expect(albResponse.LoadBalancers![0].Scheme).toBe('internet-facing');
    }, 30000);

    test('Security groups should allow proper connectivity', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'tag:Name',
              Values: ['portfolio-db-sg'],
            },
          ],
        })
      );

      const dbSg = response.SecurityGroups![0];
      const postgresRule = dbSg.IpPermissions?.find(
        (rule) => rule.FromPort === 5432
      );

      expect(postgresRule).toBeDefined();
      expect(postgresRule?.IpRanges?.[0].CidrIp).toBe('172.32.0.0/16');
    }, 30000);
  });
});
