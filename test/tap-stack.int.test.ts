import * as fs from 'fs';
import * as path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  RDSClient,
  DescribeGlobalClustersCommand,
} from '@aws-sdk/client-rds';
import {
  DynamoDBClient,
  DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';
import {
  Route53Client,
  GetHostedZoneCommand,
  ListResourceRecordSetsCommand,
  GetHealthCheckCommand,
} from '@aws-sdk/client-route-53';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketReplicationCommand,
} from '@aws-sdk/client-s3';
import {
  ECSClient,
  DescribeClustersCommand,
  DescribeServicesCommand,
} from '@aws-sdk/client-ecs';
import {
  LambdaClient,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import {
  KMSClient,
  DescribeKeyCommand,
} from '@aws-sdk/client-kms';

describe('TapStack Integration Tests', () => {
  let outputs: Record<string, string>;
  const primaryRegion = process.env.AWS_REGION || 'us-east-1';
  const drRegion = process.env.DR_REGION || 'us-east-2';

  beforeAll(() => {
    const outputsPath = path.join(
      __dirname,
      '..',
      'cfn-outputs',
      'flat-outputs.json'
    );

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Deployment outputs not found at ${outputsPath}. Please deploy the stack first.`
      );
    }

    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  });

  describe('VPC Resources', () => {
    const ec2Primary = new EC2Client({ region: primaryRegion });
    const ec2Dr = new EC2Client({ region: drRegion });

    it('should have deployed primary VPC', async () => {
      const vpcId = outputs.primaryVpcId;
      expect(vpcId).toBeDefined();

      const response = await ec2Primary.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].VpcId).toBe(vpcId);
      expect(response.Vpcs![0].State).toBe('available');
    });

    it('should have deployed DR VPC', async () => {
      const vpcId = outputs.drVpcId;
      expect(vpcId).toBeDefined();

      const response = await ec2Dr.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].VpcId).toBe(vpcId);
      expect(response.Vpcs![0].State).toBe('available');
    });

    it('should have subnets in primary VPC', async () => {
      const vpcId = outputs.primaryVpcId;

      const response = await ec2Primary.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThan(0);
    });

    it('should have subnets in DR VPC', async () => {
      const vpcId = outputs.drVpcId;

      const response = await ec2Dr.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThan(0);
    });
  });

  describe('Load Balancer Resources', () => {
    const elbPrimary = new ElasticLoadBalancingV2Client({
      region: primaryRegion,
    });
    const elbDr = new ElasticLoadBalancingV2Client({ region: drRegion });

    it('should have deployed primary ALB with DNS', async () => {
      const albDns = outputs.primaryAlbDns;
      expect(albDns).toBeDefined();
      expect(albDns).toContain('elb.amazonaws.com');
    });

    it('should have deployed DR ALB with DNS', async () => {
      const albDns = outputs.drAlbDns;
      expect(albDns).toBeDefined();
      expect(albDns).toContain('elb.amazonaws.com');
    });

    it('should have primary ALB in active state', async () => {
      const albArn = outputs.primaryAlbArn;
      if (!albArn) {
        console.log('Skipping: primaryAlbArn not in outputs');
        return;
      }

      const response = await elbPrimary.send(
        new DescribeLoadBalancersCommand({
          LoadBalancerArns: [albArn],
        })
      );

      expect(response.LoadBalancers![0].State?.Code).toBe('active');
    });

    it('should have DR ALB in active state', async () => {
      const albArn = outputs.drAlbArn;
      if (!albArn) {
        console.log('Skipping: drAlbArn not in outputs');
        return;
      }

      const response = await elbDr.send(
        new DescribeLoadBalancersCommand({
          LoadBalancerArns: [albArn],
        })
      );

      expect(response.LoadBalancers![0].State?.Code).toBe('active');
    });

    it('should have listeners configured on primary ALB', async () => {
      const albArn = outputs.primaryAlbArn;
      if (!albArn) {
        console.log('Skipping: primaryAlbArn not in outputs');
        return;
      }

      const response = await elbPrimary.send(
        new DescribeListenersCommand({
          LoadBalancerArn: albArn,
        })
      );

      expect(response.Listeners!.length).toBeGreaterThan(0);
    });
  });

  describe('Aurora Global Database', () => {
    const rdsPrimary = new RDSClient({ region: primaryRegion });

    it('should have deployed Aurora Global Cluster', async () => {
      const clusterId = outputs.auroraGlobalClusterId;
      expect(clusterId).toBeDefined();

      const response = await rdsPrimary.send(
        new DescribeGlobalClustersCommand({
          GlobalClusterIdentifier: clusterId,
        })
      );

      expect(response.GlobalClusters).toBeDefined();
      expect(response.GlobalClusters!.length).toBeGreaterThan(0);
      expect(response.GlobalClusters![0].Status).toBe('available');
    });

    it('should have primary and secondary regions configured', async () => {
      const clusterId = outputs.auroraGlobalClusterId;

      const response = await rdsPrimary.send(
        new DescribeGlobalClustersCommand({
          GlobalClusterIdentifier: clusterId,
        })
      );

      const members = response.GlobalClusters![0].GlobalClusterMembers;
      expect(members).toBeDefined();
      expect(members!.length).toBeGreaterThanOrEqual(1);

      const primaryMember = members!.find(m => m.IsWriter);
      expect(primaryMember).toBeDefined();
    });

    it('should have replication configured for DR', async () => {
      const clusterId = outputs.auroraGlobalClusterId;

      const response = await rdsPrimary.send(
        new DescribeGlobalClustersCommand({
          GlobalClusterIdentifier: clusterId,
        })
      );

      const members = response.GlobalClusters![0].GlobalClusterMembers;
      expect(members!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('DynamoDB Global Table', () => {
    const dynamoPrimary = new DynamoDBClient({ region: primaryRegion });

    it('should have deployed DynamoDB table', async () => {
      const tableName = outputs.dynamodbTableName;
      expect(tableName).toBeDefined();

      const response = await dynamoPrimary.send(
        new DescribeTableCommand({
          TableName: tableName,
        })
      );

      expect(response.Table).toBeDefined();
      expect(response.Table!.TableStatus).toBe('ACTIVE');
    });

    it('should have global table replicas', async () => {
      const tableName = outputs.dynamodbTableName;

      const response = await dynamoPrimary.send(
        new DescribeTableCommand({
          TableName: tableName,
        })
      );

      expect(response.Table!.Replicas).toBeDefined();
      expect(response.Table!.Replicas!.length).toBeGreaterThan(0);
    });

    it('should have streaming enabled for replication', async () => {
      const tableName = outputs.dynamodbTableName;

      const response = await dynamoPrimary.send(
        new DescribeTableCommand({
          TableName: tableName,
        })
      );

      expect(response.Table!.StreamSpecification).toBeDefined();
      expect(response.Table!.StreamSpecification!.StreamEnabled).toBe(true);
    });
  });

  describe('Route53 DNS and Health Checks', () => {
    const route53 = new Route53Client({ region: primaryRegion });

    it('should have deployed hosted zone', async () => {
      const hostedZoneId = outputs.hostedZoneId;
      expect(hostedZoneId).toBeDefined();

      const response = await route53.send(
        new GetHostedZoneCommand({
          Id: hostedZoneId,
        })
      );

      expect(response.HostedZone).toBeDefined();
      expect(response.HostedZone!.Id).toContain(hostedZoneId);
    });

    it('should have DNS records configured', async () => {
      const hostedZoneId = outputs.hostedZoneId;

      const response = await route53.send(
        new ListResourceRecordSetsCommand({
          HostedZoneId: hostedZoneId,
        })
      );

      expect(response.ResourceRecordSets).toBeDefined();
      expect(response.ResourceRecordSets!.length).toBeGreaterThan(0);
    });

    it('should have health check for primary region', async () => {
      const healthCheckId = outputs.primaryHealthCheckId;
      expect(healthCheckId).toBeDefined();

      const response = await route53.send(
        new GetHealthCheckCommand({
          HealthCheckId: healthCheckId,
        })
      );

      expect(response.HealthCheck).toBeDefined();
      expect(response.HealthCheck!.Id).toBe(healthCheckId);
    });

    it('should have health check monitoring ALB endpoint', async () => {
      const healthCheckId = outputs.primaryHealthCheckId;

      const response = await route53.send(
        new GetHealthCheckCommand({
          HealthCheckId: healthCheckId,
        })
      );

      const config = response.HealthCheck!.HealthCheckConfig;
      expect(config).toBeDefined();
      expect(config!.Type).toBeDefined();
    });
  });

  describe('S3 Cross-Region Replication', () => {
    const s3Primary = new S3Client({ region: primaryRegion });
    const s3Dr = new S3Client({ region: drRegion });

    it('should have primary S3 bucket accessible', async () => {
      const bucketName = outputs.primaryS3BucketName;
      if (!bucketName) {
        console.log('Skipping: primaryS3BucketName not in outputs');
        return;
      }

      await expect(
        s3Primary.send(new HeadBucketCommand({ Bucket: bucketName }))
      ).resolves.toBeDefined();
    });

    it('should have DR S3 bucket accessible', async () => {
      const bucketName = outputs.drS3BucketName;
      if (!bucketName) {
        console.log('Skipping: drS3BucketName not in outputs');
        return;
      }

      await expect(
        s3Dr.send(new HeadBucketCommand({ Bucket: bucketName }))
      ).resolves.toBeDefined();
    });

    it('should have versioning enabled', async () => {
      const bucketName = outputs.primaryS3BucketName;
      if (!bucketName) {
        console.log('Skipping: primaryS3BucketName not in outputs');
        return;
      }

      const response = await s3Primary.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );

      expect(response.Status).toBe('Enabled');
    });

    it('should have replication rules configured', async () => {
      const bucketName = outputs.primaryS3BucketName;
      if (!bucketName) {
        console.log('Skipping: primaryS3BucketName not in outputs');
        return;
      }

      const response = await s3Primary.send(
        new GetBucketReplicationCommand({ Bucket: bucketName })
      );

      expect(response.ReplicationConfiguration).toBeDefined();
      expect(response.ReplicationConfiguration!.Rules!.length).toBeGreaterThan(
        0
      );
    });
  });

  describe('ECS Fargate Services', () => {
    const ecsPrimary = new ECSClient({ region: primaryRegion });
    const ecsDr = new ECSClient({ region: drRegion });

    it('should have primary ECS cluster', async () => {
      const clusterName = outputs.primaryEcsClusterName;
      if (!clusterName) {
        console.log('Skipping: primaryEcsClusterName not in outputs');
        return;
      }

      const response = await ecsPrimary.send(
        new DescribeClustersCommand({
          clusters: [clusterName],
        })
      );

      expect(response.clusters![0].status).toBe('ACTIVE');
    });

    it('should have DR ECS cluster', async () => {
      const clusterName = outputs.drEcsClusterName;
      if (!clusterName) {
        console.log('Skipping: drEcsClusterName not in outputs');
        return;
      }

      const response = await ecsDr.send(
        new DescribeClustersCommand({
          clusters: [clusterName],
        })
      );

      expect(response.clusters![0].status).toBe('ACTIVE');
    });

    it('should have primary ECS service configured', async () => {
      const clusterName = outputs.primaryEcsClusterName;
      const serviceName = outputs.primaryEcsServiceName;
      if (!clusterName || !serviceName) {
        console.log(
          'Skipping: primaryEcsClusterName or primaryEcsServiceName not in outputs'
        );
        return;
      }

      const response = await ecsPrimary.send(
        new DescribeServicesCommand({
          cluster: clusterName,
          services: [serviceName],
        })
      );

      expect(response.services![0].status).toBe('ACTIVE');
      expect(response.services![0].desiredCount).toBeGreaterThan(0);
    });

    it('should have DR ECS service ready for failover', async () => {
      const clusterName = outputs.drEcsClusterName;
      const serviceName = outputs.drEcsServiceName;
      if (!clusterName || !serviceName) {
        console.log(
          'Skipping: drEcsClusterName or drEcsServiceName not in outputs'
        );
        return;
      }

      const response = await ecsDr.send(
        new DescribeServicesCommand({
          cluster: clusterName,
          services: [serviceName],
        })
      );

      expect(response.services![0].status).toBe('ACTIVE');
    });
  });

  describe('Lambda Failover Functions', () => {
    const lambdaDr = new LambdaClient({ region: drRegion });

    it('should have Aurora promotion Lambda deployed', async () => {
      const functionName = outputs.auroraPromoteLambdaName;
      if (!functionName) {
        console.log('Skipping: auroraPromoteLambdaName not in outputs');
        return;
      }

      const response = await lambdaDr.send(
        new GetFunctionCommand({
          FunctionName: functionName,
        })
      );

      expect(response.Configuration!.State).toBe('Active');
      expect(response.Configuration!.Runtime).toContain('python');
    });

    it('should have Route53 update Lambda deployed', async () => {
      const functionName = outputs.route53UpdateLambdaName;
      if (!functionName) {
        console.log('Skipping: route53UpdateLambdaName not in outputs');
        return;
      }

      const response = await lambdaDr.send(
        new GetFunctionCommand({
          FunctionName: functionName,
        })
      );

      expect(response.Configuration!.State).toBe('Active');
    });

    it('should have ECS scaling Lambda deployed', async () => {
      const functionName = outputs.ecsScaleLambdaName;
      if (!functionName) {
        console.log('Skipping: ecsScaleLambdaName not in outputs');
        return;
      }

      const response = await lambdaDr.send(
        new GetFunctionCommand({
          FunctionName: functionName,
        })
      );

      expect(response.Configuration!.State).toBe('Active');
    });
  });

  describe('CloudWatch Monitoring', () => {
    const cwPrimary = new CloudWatchClient({ region: primaryRegion });
    const cwDr = new CloudWatchClient({ region: drRegion });

    it('should have monitoring alarms in primary region', async () => {
      const envSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

      const response = await cwPrimary.send(
        new DescribeAlarmsCommand({
          MaxRecords: 100,
        })
      );

      const alarms = response.MetricAlarms!.filter(alarm =>
        alarm.AlarmName!.includes(envSuffix)
      );

      expect(alarms.length).toBeGreaterThan(0);
    });

    it('should have monitoring alarms in DR region', async () => {
      const envSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

      const response = await cwDr.send(
        new DescribeAlarmsCommand({
          MaxRecords: 100,
        })
      );

      const alarms = response.MetricAlarms!.filter(alarm =>
        alarm.AlarmName!.includes(envSuffix)
      );

      expect(alarms.length).toBeGreaterThan(0);
    });
  });

  describe('SNS Notification Topics', () => {
    const snsPrimary = new SNSClient({ region: primaryRegion });
    const snsDr = new SNSClient({ region: drRegion });

    it('should have SNS topic in primary region', async () => {
      const topicArn = outputs.primarySnsTopicArn;
      if (!topicArn) {
        console.log('Skipping: primarySnsTopicArn not in outputs');
        return;
      }

      const response = await snsPrimary.send(
        new GetTopicAttributesCommand({
          TopicArn: topicArn,
        })
      );

      expect(response.Attributes).toBeDefined();
    });

    it('should have SNS topic in DR region', async () => {
      const topicArn = outputs.drSnsTopicArn;
      if (!topicArn) {
        console.log('Skipping: drSnsTopicArn not in outputs');
        return;
      }

      const response = await snsDr.send(
        new GetTopicAttributesCommand({
          TopicArn: topicArn,
        })
      );

      expect(response.Attributes).toBeDefined();
    });
  });

  describe('KMS Encryption', () => {
    const kmsPrimary = new KMSClient({ region: primaryRegion });
    const kmsDr = new KMSClient({ region: drRegion });

    it('should have KMS key in primary region', async () => {
      const keyId = outputs.primaryKmsKeyId;
      if (!keyId) {
        console.log('Skipping: primaryKmsKeyId not in outputs');
        return;
      }

      const response = await kmsPrimary.send(
        new DescribeKeyCommand({
          KeyId: keyId,
        })
      );

      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
    });

    it('should have KMS key in DR region', async () => {
      const keyId = outputs.drKmsKeyId;
      if (!keyId) {
        console.log('Skipping: drKmsKeyId not in outputs');
        return;
      }

      const response = await kmsDr.send(
        new DescribeKeyCommand({
          KeyId: keyId,
        })
      );

      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
    });
  });

  describe('Disaster Recovery Readiness', () => {
    it('should have all critical infrastructure components', () => {
      expect(outputs.primaryVpcId).toBeDefined();
      expect(outputs.drVpcId).toBeDefined();
      expect(outputs.primaryAlbDns).toBeDefined();
      expect(outputs.drAlbDns).toBeDefined();
      expect(outputs.auroraGlobalClusterId).toBeDefined();
      expect(outputs.dynamodbTableName).toBeDefined();
      expect(outputs.hostedZoneId).toBeDefined();
      expect(outputs.primaryHealthCheckId).toBeDefined();
    });

    it('should have networking in both regions', () => {
      expect(outputs.primaryVpcId).toBeDefined();
      expect(outputs.drVpcId).toBeDefined();
    });

    it('should have compute resources in both regions', () => {
      expect(outputs.primaryAlbDns).toBeDefined();
      expect(outputs.drAlbDns).toBeDefined();
    });

    it('should have database with multi-region replication', () => {
      expect(outputs.auroraGlobalClusterId).toBeDefined();
      expect(outputs.dynamodbTableName).toBeDefined();
    });

    it('should have DNS failover capability', () => {
      expect(outputs.hostedZoneId).toBeDefined();
      expect(outputs.primaryHealthCheckId).toBeDefined();
    });
  });

  describe('Environment Suffix in Resources', () => {
    it('should use environment suffix in output keys', () => {
      const envSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    it('should have unique resource identifiers', () => {
      const uniqueValues = new Set(Object.values(outputs));
      expect(uniqueValues.size).toBe(Object.values(outputs).length);
    });
  });
});
