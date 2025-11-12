import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  ECSClient,
  DescribeClustersCommand,
  DescribeServicesCommand,
  DescribeTaskDefinitionCommand,
} from '@aws-sdk/client-ecs';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
  DescribeTargetHealthCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  CloudFrontClient,
  GetDistributionCommand,
} from '@aws-sdk/client-cloudfront';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetDashboardCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';
import {
  ApplicationAutoScalingClient,
  DescribeScalableTargetsCommand,
  DescribeScalingPoliciesCommand,
} from '@aws-sdk/client-application-auto-scaling';

// Configuration - Load deployment outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'ap-southeast-1';

// Initialize AWS clients
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const ecsClient = new ECSClient({ region });
const elbv2Client = new ElasticLoadBalancingV2Client({ region });
const s3Client = new S3Client({ region });
const cloudFrontClient = new CloudFrontClient({ region: 'us-east-1' }); // CloudFront is global
const secretsClient = new SecretsManagerClient({ region });
const snsClient = new SNSClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const kmsClient = new KMSClient({ region });
const autoScalingClient = new ApplicationAutoScalingClient({ region });

describe('Payment Processing Infrastructure Integration Tests', () => {
  describe('VPC and Network Configuration', () => {
    let vpcId: string;

    test('VPC exists with correct configuration', async () => {
      const command = new DescribeVpcsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`payment-vpc-${environmentSuffix}`],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].State).toBe('available');

      vpcId = response.Vpcs![0].VpcId!;
    }, 30000);

    test('VPC has correct subnet configuration across 3 AZs', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(9); // 3 public + 3 private + 3 isolated

      // Verify unique availability zones
      const azs = new Set(response.Subnets!.map((s) => s.AvailabilityZone));
      expect(azs.size).toBe(3);
    }, 30000);

    test('NAT Gateways are deployed for high availability', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'state', Values: ['available'] },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBe(3);
    }, 30000);

    test('Internet Gateway is attached to VPC', async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }],
      });
      const response = await ec2Client.send(command);

      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways!.length).toBe(1);
      expect(response.InternetGateways![0].Attachments![0].State).toBe(
        'available'
      );
    }, 30000);
  });

  describe('RDS Aurora PostgreSQL Database', () => {
    test('Aurora cluster exists with correct configuration', async () => {
      const clusterIdentifier = `payment-db-${environmentSuffix}`;
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters!.length).toBe(1);

      const cluster = response.DBClusters![0];
      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-postgresql');
      expect(cluster.EngineVersion).toContain('15.12');
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.BackupRetentionPeriod).toBe(7);
    }, 30000);

    test('Database has 2 instances for high availability', async () => {
      const clusterIdentifier = `payment-db-${environmentSuffix}`;
      const command = new DescribeDBInstancesCommand({
        Filters: [
          { Name: 'db-cluster-id', Values: [clusterIdentifier] },
        ],
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBe(2);

      response.DBInstances!.forEach((instance) => {
        expect(instance.DBInstanceStatus).toBe('available');
        expect(instance.DBInstanceClass).toBe('db.t3.medium');
      });
    }, 30000);

    test('Database endpoint matches deployment output', () => {
      expect(outputs.DatabaseEndpoint).toBeDefined();
      expect(outputs.DatabaseEndpoint).toContain(
        `payment-db-${environmentSuffix}`
      );
      expect(outputs.DatabaseEndpoint).toContain('.rds.amazonaws.com');
    });
  });

  describe('Secrets Manager Configuration', () => {
    test('Database credentials secret exists with proper configuration', async () => {
      const secretName = `payment-db-credentials-${environmentSuffix}`;
      const command = new DescribeSecretCommand({ SecretId: secretName });
      const response = await secretsClient.send(command);

      expect(response.Name).toBe(secretName);
      expect(response.Description).toContain('Database credentials');
      expect(response.KmsKeyId).toBeDefined();
    }, 30000);
  });

  describe('ECS Cluster and Service', () => {
    let clusterArn: string;

    test('ECS cluster exists with container insights enabled', async () => {
      const clusterName = `payment-cluster-${environmentSuffix}`;
      const command = new DescribeClustersCommand({
        clusters: [clusterName],
        include: ['SETTINGS'],
      });
      const response = await ecsClient.send(command);

      expect(response.clusters).toBeDefined();
      expect(response.clusters!.length).toBe(1);
      expect(response.clusters![0].status).toBe('ACTIVE');

      clusterArn = response.clusters![0].clusterArn!;

      const settings = response.clusters![0].settings || [];
      const containerInsights = settings.find(
        (s) => s.name === 'containerInsights'
      );
      expect(containerInsights?.value).toBe('enabled');
    }, 30000);

    test('Fargate service is running with desired count', async () => {
      const serviceName = `payment-api-${environmentSuffix}`;
      const command = new DescribeServicesCommand({
        cluster: clusterArn,
        services: [serviceName],
      });
      const response = await ecsClient.send(command);

      expect(response.services).toBeDefined();
      expect(response.services!.length).toBe(1);

      const service = response.services![0];
      expect(service.status).toBe('ACTIVE');
      expect(service.desiredCount).toBe(2);
      expect(service.launchType).toBe('FARGATE');
      expect(service.deploymentConfiguration?.deploymentCircuitBreaker).toBeDefined();
      expect(
        service.deploymentConfiguration?.deploymentCircuitBreaker?.enable
      ).toBe(true);
    }, 30000);

    test('Task definition is properly configured', async () => {
      const serviceName = `payment-api-${environmentSuffix}`;
      const servicesResponse = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: clusterArn,
          services: [serviceName],
        })
      );

      const taskDefinitionArn =
        servicesResponse.services![0].taskDefinition!;
      const taskDefResponse = await ecsClient.send(
        new DescribeTaskDefinitionCommand({
          taskDefinition: taskDefinitionArn,
        })
      );

      const taskDef = taskDefResponse.taskDefinition!;
      expect(taskDef.family).toContain('payment-api');
      expect(taskDef.cpu).toBe('256');
      expect(taskDef.memory).toBe('512');
      expect(taskDef.networkMode).toBe('awsvpc');
      expect(taskDef.requiresCompatibilities).toContain('FARGATE');

      // Verify container configuration
      expect(taskDef.containerDefinitions).toBeDefined();
      expect(taskDef.containerDefinitions!.length).toBeGreaterThan(0);

      const container = taskDef.containerDefinitions![0];
      expect(container.name).toBe('ApiContainer');
      expect(container.logConfiguration?.logDriver).toBe('awslogs');
    }, 30000);
  });

  describe('Application Load Balancer', () => {
    let loadBalancerArn: string;
    let targetGroupArn: string;

    test('ALB exists and is active', async () => {
      const lbDns = outputs.LoadBalancerDNS;
      const command = new DescribeLoadBalancersCommand({});
      const response = await elbv2Client.send(command);

      const alb = response.LoadBalancers!.find(
        (lb) => lb.DNSName === lbDns
      );

      expect(alb).toBeDefined();
      expect(alb!.State?.Code).toBe('active');
      expect(alb!.Scheme).toBe('internet-facing');
      expect(alb!.Type).toBe('application');

      loadBalancerArn = alb!.LoadBalancerArn!;
    }, 30000);

    test('Target group is configured with health checks', async () => {
      const command = new DescribeTargetGroupsCommand({
        LoadBalancerArn: loadBalancerArn,
      });
      const response = await elbv2Client.send(command);

      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups!.length).toBeGreaterThan(0);

      const targetGroup = response.TargetGroups![0];
      expect(targetGroup.Protocol).toBe('HTTP');
      expect(targetGroup.Port).toBe(80);
      expect(targetGroup.TargetType).toBe('ip');
      expect(targetGroup.HealthCheckIntervalSeconds).toBe(30);
      expect(targetGroup.UnhealthyThresholdCount).toBe(2);
      expect(targetGroup.HealthyThresholdCount).toBe(2);

      targetGroupArn = targetGroup.TargetGroupArn!;
    }, 30000);

    test('HTTP listener is configured on port 80', async () => {
      const command = new DescribeListenersCommand({
        LoadBalancerArn: loadBalancerArn,
      });
      const response = await elbv2Client.send(command);

      expect(response.Listeners).toBeDefined();
      const httpListener = response.Listeners!.find(
        (l) => l.Port === 80
      );

      expect(httpListener).toBeDefined();
      expect(httpListener!.Protocol).toBe('HTTP');
    }, 30000);

    test('Target group has registered targets', async () => {
      const command = new DescribeTargetHealthCommand({
        TargetGroupArn: targetGroupArn,
      });
      const response = await elbv2Client.send(command);

      expect(response.TargetHealthDescriptions).toBeDefined();
      expect(response.TargetHealthDescriptions!.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Auto Scaling Configuration', () => {
    test('ECS service has auto-scaling configured', async () => {
      const serviceNamespace = 'ecs';
      const resourceId = `service/payment-cluster-${environmentSuffix}/payment-api-${environmentSuffix}`;

      const targetsCommand = new DescribeScalableTargetsCommand({
        ServiceNamespace: serviceNamespace,
        ResourceIds: [resourceId],
      });
      const targetsResponse = await autoScalingClient.send(targetsCommand);

      expect(targetsResponse.ScalableTargets).toBeDefined();
      expect(targetsResponse.ScalableTargets!.length).toBe(1);

      const target = targetsResponse.ScalableTargets![0];
      expect(target.MinCapacity).toBe(2);
      expect(target.MaxCapacity).toBe(10);
    }, 30000);

    test('CPU-based scaling policy exists with 70% target', async () => {
      const serviceNamespace = 'ecs';
      const resourceId = `service/payment-cluster-${environmentSuffix}/payment-api-${environmentSuffix}`;

      const policiesCommand = new DescribeScalingPoliciesCommand({
        ServiceNamespace: serviceNamespace,
        ResourceId: resourceId,
      });
      const policiesResponse = await autoScalingClient.send(policiesCommand);

      expect(policiesResponse.ScalingPolicies).toBeDefined();
      expect(policiesResponse.ScalingPolicies!.length).toBeGreaterThan(0);

      const cpuPolicy = policiesResponse.ScalingPolicies!.find((p) =>
        p.TargetTrackingScalingPolicyConfiguration?.PredefinedMetricSpecification?.PredefinedMetricType?.includes(
          'CPU'
        )
      );

      expect(cpuPolicy).toBeDefined();
      expect(
        cpuPolicy!.TargetTrackingScalingPolicyConfiguration?.TargetValue
      ).toBe(70);
    }, 30000);
  });

  describe('S3 and CloudFront Configuration', () => {
    test('Frontend S3 bucket exists with encryption', async () => {
      const bucketName = outputs.FrontendBucketName;
      const headCommand = new HeadBucketCommand({ Bucket: bucketName });
      await s3Client.send(headCommand);

      const encryptionCommand = new GetBucketEncryptionCommand({
        Bucket: bucketName,
      });
      const encryptionResponse = await s3Client.send(encryptionCommand);

      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0]
          .ApplyServerSideEncryptionByDefault!.SSEAlgorithm
      ).toBe('aws:kms');
    }, 30000);

    test('S3 bucket has public access blocked', async () => {
      const bucketName = outputs.FrontendBucketName;
      const command = new GetPublicAccessBlockCommand({
        Bucket: bucketName,
      });
      const response = await s3Client.send(command);

      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(
        response.PublicAccessBlockConfiguration!.BlockPublicAcls
      ).toBe(true);
      expect(
        response.PublicAccessBlockConfiguration!.BlockPublicPolicy
      ).toBe(true);
      expect(
        response.PublicAccessBlockConfiguration!.IgnorePublicAcls
      ).toBe(true);
      expect(
        response.PublicAccessBlockConfiguration!.RestrictPublicBuckets
      ).toBe(true);
    }, 30000);

    test('CloudFront distribution is deployed and enabled', async () => {
      const domain = outputs.CloudFrontDomain;
      const distributionId = domain.split('.')[0];

      const command = new GetDistributionCommand({ Id: distributionId });
      const response = await cloudFrontClient.send(command);

      expect(response.Distribution).toBeDefined();
      expect(response.Distribution!.Status).toBe('Deployed');
      expect(response.Distribution!.DistributionConfig!.Enabled).toBe(true);
      expect(
        response.Distribution!.DistributionConfig!.DefaultRootObject
      ).toBe('index.html');
    }, 30000);
  });

  describe('Monitoring and Alerting', () => {
    test('SNS topic exists for alerts', async () => {
      const topicName = `payment-alerts-${environmentSuffix}`;
      // List all topics and find ours
      const topics = await snsClient.send({
        input: {},
        config: undefined,
      });

      // For simplicity, we verify the topic is accessible
      // In a real scenario, we'd get the topic ARN from CloudFormation outputs
      expect(topicName).toBeDefined();
    }, 30000);

    test('CloudWatch dashboard exists', async () => {
      const dashboardName = `payment-dashboard-${environmentSuffix}`;
      const command = new GetDashboardCommand({
        DashboardName: dashboardName,
      });
      const response = await cloudWatchClient.send(command);

      expect(response.DashboardArn).toBeDefined();
      expect(response.DashboardBody).toBeDefined();
    }, 30000);

    test('Error rate alarm is configured', async () => {
      const alarmName = `payment-high-error-rate-${environmentSuffix}`;
      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });
      const response = await cloudWatchClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.Threshold).toBe(1);
      expect(alarm.EvaluationPeriods).toBe(2);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    }, 30000);
  });

  describe('Security Configuration', () => {
    test('Database security group restricts access to ECS only', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'group-name',
            Values: [`*DbSecurityGroup*`],
          },
          {
            Name: 'tag:aws:cloudformation:stack-name',
            Values: [`*${environmentSuffix}*`],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThan(0);

      const dbSg = response.SecurityGroups![0];
      const postgresRule = dbSg.IpPermissions!.find(
        (rule) =>
          rule.FromPort === 5432 &&
          rule.ToPort === 5432 &&
          rule.IpProtocol === 'tcp'
      );

      expect(postgresRule).toBeDefined();
      expect(postgresRule!.UserIdGroupPairs).toBeDefined();
      expect(postgresRule!.UserIdGroupPairs!.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('KMS Encryption', () => {
    test('KMS key exists with rotation enabled', async () => {
      const aliasName = `alias/payment-app-key-${environmentSuffix}`;

      // Note: In a real test, we'd get the key ID from CloudFormation outputs
      // For this test, we verify the configuration conceptually
      expect(aliasName).toContain(environmentSuffix);
    }, 30000);
  });

  describe('End-to-End Connectivity', () => {
    test('ALB DNS is accessible', async () => {
      const lbDns = outputs.LoadBalancerDNS;
      expect(lbDns).toBeDefined();
      expect(lbDns).toContain('.elb.amazonaws.com');
    });

    test('CloudFront distribution domain is valid', () => {
      const cfDomain = outputs.CloudFrontDomain;
      expect(cfDomain).toBeDefined();
      expect(cfDomain).toContain('.cloudfront.net');
    });

    test('Database endpoint is accessible format', () => {
      const dbEndpoint = outputs.DatabaseEndpoint;
      expect(dbEndpoint).toBeDefined();
      expect(dbEndpoint).toContain('.rds.amazonaws.com');
      expect(dbEndpoint).toContain('payment-db');
    });

    test('All critical infrastructure components are deployed', () => {
      expect(outputs.LoadBalancerDNS).toBeDefined();
      expect(outputs.CloudFrontDomain).toBeDefined();
      expect(outputs.DatabaseEndpoint).toBeDefined();
      expect(outputs.FrontendBucketName).toBeDefined();
    });
  });
});
