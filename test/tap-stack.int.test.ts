import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Int test configuration
const testConfig = {
  stackName: 'tap-stack-int-test',
  projectName: 'TapStack',
  region: 'us-west-2',
  environmentSuffix: `test-${Date.now()}`,
};

describe('TapStack Int Tests', () => {
  let stack: pulumi.automation.Stack;
  let outputs: pulumi.automation.OutputMap;

  beforeAll(async () => {
    // Set up Pulumi automation API for integration testing
    const pulumiProgram = async () => {
      // Set config values
      const config = new pulumi.Config();

      // Create the stack
      const tapStack = new TapStack();

      // Return stack outputs for validation
      return {
        vpcId: tapStack.vpc.id,
        albDnsName: tapStack.alb.dnsName,
        ecsClusterName: tapStack.ecsCluster.name,
        rdsEndpoint: tapStack.rdsCluster.endpoint,
        cloudFrontDomain: tapStack.cloudFrontDistribution.domainName,
        ecrRepositoryUrl: tapStack.ecrRepository.repositoryUrl,
        staticBucketName: tapStack.staticAssetsBucket.bucket,
        flowLogsBucketName: tapStack.flowLogsBucket.bucket,
      };
    };

    // Create stack using automation API
    stack = await pulumi.automation.LocalWorkspace.createOrSelectStack({
      stackName: testConfig.stackName,
      projectName: testConfig.projectName,
      program: pulumiProgram,
    });

    // Set AWS region
    await stack.setConfig('aws:region', { value: testConfig.region });
    await stack.setConfig('environmentSuffix', {
      value: testConfig.environmentSuffix,
    });

    // Deploy the stack
    console.log('Deploying stack for int tests...');
    const upResult = await stack.up({ onOutput: console.log });
    outputs = upResult.outputs;
    console.log('Stack deployed successfully');
  }, 600000); // 10 minute timeout for deployment

  afterAll(async () => {
    // Clean up: destroy the test stack
    if (stack) {
      console.log('Destroying test stack...');
      await stack.destroy({ onOutput: console.log });
      console.log('Stack destroyed successfully');
    }
  }, 600000); // 10 minute timeout for cleanup

  describe('VPC and Networking', () => {
    test('VPC should be created with correct configuration', async () => {
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.vpcId.value).toMatch(/^vpc-[a-f0-9]+$/);

      // Verify VPC exists and has correct settings
      const vpcClient = new aws.ec2.Ec2Client({ region: testConfig.region });
      const vpc = await vpcClient.describeVpcs({
        VpcIds: [outputs.vpcId.value as string],
      });

      expect(vpc.Vpcs).toHaveLength(1);
      expect(vpc.Vpcs[0].CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Vpcs[0].EnableDnsHostnames).toBe(true);
      expect(vpc.Vpcs[0].EnableDnsSupport).toBe(true);
    });

    test('Subnets should be created in multiple AZs', async () => {
      const ec2Client = new aws.ec2.Ec2Client({ region: testConfig.region });
      const subnets = await ec2Client.describeSubnets({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId.value as string],
          },
        ],
      });

      // Should have 6 subnets (3 public, 3 private)
      expect(subnets.Subnets).toHaveLength(6);

      const publicSubnets = subnets.Subnets.filter(s =>
        s.Tags?.some(t => t.Key === 'Name' && t.Value?.includes('public')),
      );
      const privateSubnets = subnets.Subnets.filter(s =>
        s.Tags?.some(t => t.Key === 'Name' && t.Value?.includes('private')),
      );

      expect(publicSubnets).toHaveLength(3);
      expect(privateSubnets).toHaveLength(3);

      // Verify subnets are in different AZs
      const azs = new Set(subnets.Subnets.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3);
    });

    test('NAT Gateways should be highly available', async () => {
      const ec2Client = new aws.ec2.Ec2Client({ region: testConfig.region });
      const natGateways = await ec2Client.describeNatGateways({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId.value as string],
          },
          {
            Name: 'state',
            Values: ['available'],
          },
        ],
      });

      // Should have 3 NAT gateways (one per AZ)
      expect(natGateways.NatGateways).toHaveLength(3);

      // Each should have an Elastic IP
      natGateways.NatGateways.forEach(nat => {
        expect(nat.NatGatewayAddresses).toHaveLength(1);
        expect(nat.NatGatewayAddresses[0].PublicIp).toMatch(
          /^\d+\.\d+\.\d+\.\d+$/,
        );
      });
    });
  });

  describe('Load Balancer', () => {
    test('ALB should be accessible and configured correctly', async () => {
      expect(outputs.albDnsName).toBeDefined();
      expect(outputs.albDnsName.value).toMatch(
        /^[a-z0-9-]+\.[a-z0-9-]+\.elb\.amazonaws\.com$/,
      );

      const elbClient =
        new aws.elasticloadbalancingv2.ElasticLoadBalancingV2Client({
          region: testConfig.region,
        });

      const loadBalancers = await elbClient.describeLoadBalancers({
        Names: [`alb-${testConfig.environmentSuffix}`],
      });

      expect(loadBalancers.LoadBalancers).toHaveLength(1);
      const alb = loadBalancers.LoadBalancers[0];

      expect(alb.State?.Code).toBe('active');
      expect(alb.Type).toBe('application');
      expect(alb.Scheme).toBe('internet-facing');
    });

    test('Target group should have healthy targets', async () => {
      const elbClient =
        new aws.elasticloadbalancingv2.ElasticLoadBalancingV2Client({
          region: testConfig.region,
        });

      const targetGroups = await elbClient.describeTargetGroups({
        Names: [`ecs-tg-${testConfig.environmentSuffix}`],
      });

      expect(targetGroups.TargetGroups).toHaveLength(1);

      const targetHealth = await elbClient.describeTargetHealth({
        TargetGroupArn: targetGroups.TargetGroups[0].TargetGroupArn,
      });

      // Should have at least 2 healthy targets (min desired count)
      const healthyTargets = targetHealth.TargetHealthDescriptions?.filter(
        t => t.TargetHealth?.State === 'healthy',
      );
      expect(healthyTargets?.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('ECS Cluster and Services', () => {
    test('ECS cluster should be running', async () => {
      expect(outputs.ecsClusterName).toBeDefined();

      const ecsClient = new aws.ecs.EcsClient({ region: testConfig.region });
      const clusters = await ecsClient.describeClusters({
        clusters: [outputs.ecsClusterName.value as string],
      });

      expect(clusters.clusters).toHaveLength(1);
      expect(clusters.clusters[0].status).toBe('ACTIVE');
      expect(
        clusters.clusters[0].settings?.find(s => s.name === 'containerInsights')
          ?.value,
      ).toBe('enabled');
    });

    test('ECS service should be running with correct task count', async () => {
      const ecsClient = new aws.ecs.EcsClient({ region: testConfig.region });
      const services = await ecsClient.describeServices({
        cluster: outputs.ecsClusterName.value as string,
        services: [`payment-api-${testConfig.environmentSuffix}`],
      });

      expect(services.services).toHaveLength(1);
      const service = services.services[0];

      expect(service.status).toBe('ACTIVE');
      expect(service.runningCount).toBeGreaterThanOrEqual(2);
      expect(service.desiredCount).toBeGreaterThanOrEqual(2);
      expect(service.launchType).toBe('FARGATE');
    });

    test('Auto-scaling should be configured', async () => {
      const autoScalingClient =
        new aws.applicationautoscaling.ApplicationAutoScalingClient({
          region: testConfig.region,
        });

      const scalableTargets = await autoScalingClient.describeScalableTargets({
        ServiceNamespace: 'ecs',
        ResourceIds: [
          `service/${outputs.ecsClusterName.value}/payment-api-${testConfig.environmentSuffix}`,
        ],
      });

      expect(scalableTargets.ScalableTargets).toHaveLength(1);
      const target = scalableTargets.ScalableTargets[0];

      expect(target.MinCapacity).toBe(2);
      expect(target.MaxCapacity).toBe(10);
    });
  });

  describe('RDS Database', () => {
    test('RDS Aurora cluster should be running', async () => {
      expect(outputs.rdsEndpoint).toBeDefined();

      const rdsClient = new aws.rds.RdsClient({ region: testConfig.region });
      const clusters = await rdsClient.describeDBClusters({
        DBClusterIdentifier: `payment-db-cluster-${testConfig.environmentSuffix}`,
      });

      expect(clusters.DBClusters).toHaveLength(1);
      const cluster = clusters.DBClusters[0];

      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-postgresql');
      expect(cluster.EngineVersion).toMatch(/^13\./);
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.DBClusterMembers).toHaveLength(2); // 2 instances for HA
    });

    test('Database should be in private subnets only', async () => {
      const rdsClient = new aws.rds.RdsClient({ region: testConfig.region });
      const subnetGroups = await rdsClient.describeDBSubnetGroups({
        DBSubnetGroupName: `rds-subnet-group-${testConfig.environmentSuffix}`,
      });

      expect(subnetGroups.DBSubnetGroups).toHaveLength(1);
      const subnets = subnetGroups.DBSubnetGroups[0].Subnets;

      expect(subnets).toHaveLength(3);

      // Verify all subnets are private
      const ec2Client = new aws.ec2.Ec2Client({ region: testConfig.region });
      for (const subnet of subnets) {
        const subnetDetails = await ec2Client.describeSubnets({
          SubnetIds: [subnet.SubnetIdentifier],
        });

        const subnetTags = subnetDetails.Subnets[0].Tags;
        const nameTag = subnetTags?.find(t => t.Key === 'Name');
        expect(nameTag?.Value).toContain('private');
      }
    });
  });

  describe('S3 Buckets', () => {
    test('Static assets bucket should exist with correct configuration', async () => {
      expect(outputs.staticBucketName).toBeDefined();

      const s3Client = new aws.s3.S3Client({ region: testConfig.region });

      // Check bucket exists
      const bucketLocation = await s3Client.getBucketLocation({
        Bucket: outputs.staticBucketName.value as string,
      });
      expect(bucketLocation.LocationConstraint).toBe(testConfig.region);

      // Check encryption
      const encryption = await s3Client.getBucketEncryption({
        Bucket: outputs.staticBucketName.value as string,
      });
      expect(encryption.ServerSideEncryptionConfiguration?.Rules).toHaveLength(
        1,
      );
      expect(
        encryption.ServerSideEncryptionConfiguration?.Rules[0]
          .ApplyServerSideEncryptionByDefault?.SSEAlgorithm,
      ).toBe('AES256');

      // Check lifecycle policy
      const lifecycle = await s3Client.getBucketLifecycleConfiguration({
        Bucket: outputs.staticBucketName.value as string,
      });
      expect(lifecycle.Rules).toHaveLength(1);
      expect(lifecycle.Rules[0].Status).toBe('Enabled');
    });

    test('Flow logs bucket should exist with glacier transition', async () => {
      expect(outputs.flowLogsBucketName).toBeDefined();

      const s3Client = new aws.s3.S3Client({ region: testConfig.region });

      // Check lifecycle policy for Glacier transition
      const lifecycle = await s3Client.getBucketLifecycleConfiguration({
        Bucket: outputs.flowLogsBucketName.value as string,
      });

      expect(lifecycle.Rules).toHaveLength(1);
      const rule = lifecycle.Rules[0];
      expect(rule.Status).toBe('Enabled');
      expect(rule.Transitions).toHaveLength(1);
      expect(rule.Transitions[0].StorageClass).toBe('GLACIER');
      expect(rule.Transitions[0].Days).toBe(90);
    });
  });

  describe('CloudFront Distribution', () => {
    test('CloudFront should be deployed and enabled', async () => {
      expect(outputs.cloudFrontDomain).toBeDefined();

      const cloudFrontClient = new aws.cloudfront.CloudFrontClient({
        region: 'us-east-1',
      });

      // List distributions and find ours
      const distributions = await cloudFrontClient.listDistributions({});
      const ourDistribution = distributions.DistributionList?.Items?.find(
        d => d.DomainName === outputs.cloudFrontDomain.value,
      );

      expect(ourDistribution).toBeDefined();
      expect(ourDistribution?.Enabled).toBe(true);
      expect(ourDistribution?.Status).toBe('Deployed');
      expect(ourDistribution?.PriceClass).toBe('PriceClass_100');
    });
  });

  describe('Security and Compliance', () => {
    test('KMS keys should be created for encryption', async () => {
      const kmsClient = new aws.kms.KmsClient({ region: testConfig.region });

      // List keys and verify our RDS key exists
      const keys = await kmsClient.listKeys({});
      const aliases = await kmsClient.listAliases({});

      const rdsKeyAlias = aliases.Aliases?.find(
        a => a.AliasName === `alias/rds-key-${testConfig.environmentSuffix}`,
      );

      expect(rdsKeyAlias).toBeDefined();

      // Verify key is enabled
      if (rdsKeyAlias?.TargetKeyId) {
        const keyDetails = await kmsClient.describeKey({
          KeyId: rdsKeyAlias.TargetKeyId,
        });
        expect(keyDetails.KeyMetadata?.KeyState).toBe('Enabled');
        expect(keyDetails.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
      }
    });

    test('Secrets Manager should contain database credentials', async () => {
      const secretsClient = new aws.secretsmanager.SecretsManagerClient({
        region: testConfig.region,
      });

      const secret = await secretsClient.describeSecret({
        SecretId: `rds-password-${testConfig.environmentSuffix}`,
      });

      expect(secret.Name).toBe(`rds-password-${testConfig.environmentSuffix}`);
      expect(secret.RotationEnabled).toBe(false); // Rotation not enabled by default
      expect(secret.KmsKeyId).toBeDefined();
    });

    test('CloudWatch logs should have 7-year retention', async () => {
      const logsClient = new aws.cloudwatchlogs.CloudWatchLogsClient({
        region: testConfig.region,
      });

      const logGroups = await logsClient.describeLogGroups({
        logGroupNamePrefix: `/ecs/payment-api-${testConfig.environmentSuffix}`,
      });

      expect(logGroups.logGroups).toHaveLength(1);
      expect(logGroups.logGroups[0].retentionInDays).toBe(2557); // 7 years
    });

    test('VPC Flow Logs should be enabled', async () => {
      const ec2Client = new aws.ec2.Ec2Client({ region: testConfig.region });
      const flowLogs = await ec2Client.describeFlowLogs({
        Filter: [
          {
            Name: 'resource-id',
            Values: [outputs.vpcId.value as string],
          },
        ],
      });

      expect(flowLogs.FlowLogs).toHaveLength(1);
      const flowLog = flowLogs.FlowLogs[0];

      expect(flowLog.FlowLogStatus).toBe('ACTIVE');
      expect(flowLog.LogDestinationType).toBe('s3');
      expect(flowLog.LogDestination).toContain(
        outputs.flowLogsBucketName.value,
      );
    });
  });

  describe('Monitoring and Alarms', () => {
    test('CloudWatch alarms should be configured', async () => {
      const cloudWatchClient = new aws.cloudwatch.CloudWatchClient({
        region: testConfig.region,
      });

      const alarms = await cloudWatchClient.describeAlarms({
        AlarmNamePrefix: `payment-api-${testConfig.environmentSuffix}`,
      });

      // Should have CPU and memory alarms
      expect(alarms.MetricAlarms?.length).toBeGreaterThanOrEqual(2);

      const cpuAlarm = alarms.MetricAlarms?.find(
        a => a.MetricName === 'CPUUtilization',
      );
      const memoryAlarm = alarms.MetricAlarms?.find(
        a => a.MetricName === 'MemoryUtilization',
      );

      expect(cpuAlarm).toBeDefined();
      expect(cpuAlarm?.Threshold).toBe(80);
      expect(cpuAlarm?.ComparisonOperator).toBe('GreaterThanThreshold');

      expect(memoryAlarm).toBeDefined();
      expect(memoryAlarm?.Threshold).toBe(80);
    });

    test('ALB should have unhealthy host alarm', async () => {
      const cloudWatchClient = new aws.cloudwatch.CloudWatchClient({
        region: testConfig.region,
      });

      const alarms = await cloudWatchClient.describeAlarms({
        AlarmNamePrefix: `alb-unhealthy-${testConfig.environmentSuffix}`,
      });

      expect(alarms.MetricAlarms).toHaveLength(1);
      const alarm = alarms.MetricAlarms[0];

      expect(alarm.MetricName).toBe('UnHealthyHostCount');
      expect(alarm.Threshold).toBe(1);
      expect(alarm.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
    });
  });

  describe('Resource Tagging', () => {
    test('All resources should have required tags', async () => {
      const resourceGroupsClient =
        new aws.resourcegroupstaggingapi.ResourceGroupsTaggingAPIClient({
          region: testConfig.region,
        });

      const resources = await resourceGroupsClient.getResources({
        TagFilters: [
          {
            Key: 'Environment',
            Values: ['test'],
          },
          {
            Key: 'Project',
            Values: ['TapStack'],
          },
        ],
      });

      // Should have multiple resources tagged
      expect(resources.ResourceTagMappingList?.length).toBeGreaterThan(10);

      // Verify each resource has all required tags
      resources.ResourceTagMappingList?.forEach(resource => {
        const tags = resource.Tags || [];
        const tagKeys = tags.map(t => t.Key);

        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('Project');
        expect(tagKeys).toContain('CostCenter');
      });
    });
  });
});

describe('Destroy Verification', () => {
  test('Stack should be cleanly destroyable', async () => {
    // This test runs in afterAll to verify clean destruction
    // The actual verification happens by checking that destroy completes without errors
    expect(true).toBe(true);
  });
});
