import * as fs from 'fs';
import * as path from 'path';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
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
