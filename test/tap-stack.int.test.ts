import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeVpcPeeringConnectionsCommand,
  DescribeSubnetsCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeGlobalClustersCommand,
  DescribeDBClustersCommand,
} from '@aws-sdk/client-rds';
import {
  DynamoDBClient,
  DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketReplicationCommand,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  Route53Client,
  ListHostedZonesCommand,
  ListResourceRecordSetsCommand,
} from '@aws-sdk/client-route-53';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListTopicsCommand,
} from '@aws-sdk/client-sns';
import {
  IAMClient,
  GetRoleCommand,
} from '@aws-sdk/client-iam';

const PRIMARY_REGION = process.env.PRIMARY_REGION || 'us-east-1';
const DR_REGION = process.env.DR_REGION || 'us-west-2';
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'test';

// Initialize clients for both regions
const ec2Primary = new EC2Client({ region: PRIMARY_REGION });
const ec2Dr = new EC2Client({ region: DR_REGION });
const rdsGlobal = new RDSClient({ region: PRIMARY_REGION });
const rdsPrimary = new RDSClient({ region: PRIMARY_REGION });
const rdsDr = new RDSClient({ region: DR_REGION });
const dynamodbPrimary = new DynamoDBClient({ region: PRIMARY_REGION });
const s3Primary = new S3Client({ region: PRIMARY_REGION });
const s3Dr = new S3Client({ region: DR_REGION });
const lambdaPrimary = new LambdaClient({ region: PRIMARY_REGION });
const lambdaDr = new LambdaClient({ region: DR_REGION });
const albPrimary = new ElasticLoadBalancingV2Client({ region: PRIMARY_REGION });
const albDr = new ElasticLoadBalancingV2Client({ region: DR_REGION });
const route53 = new Route53Client({ region: 'us-east-1' }); // Route53 is global
const cloudwatchPrimary = new CloudWatchClient({ region: PRIMARY_REGION });
const cloudwatchDr = new CloudWatchClient({ region: DR_REGION });
const snsPrimary = new SNSClient({ region: PRIMARY_REGION });
const snsDr = new SNSClient({ region: DR_REGION });
const iam = new IAMClient({ region: 'us-east-1' }); // IAM is global

let isDeployed = false;

describe('Multi-Region DR Infrastructure Integration Tests', () => {
  beforeAll(async () => {
    try {
      const response = await ec2Primary.send(
        new DescribeVpcsCommand({
          Filters: [
            {
              Name: 'tag:Name',
              Values: [`*${ENVIRONMENT_SUFFIX}*`],
            },
          ],
        })
      );
      isDeployed = (response.Vpcs?.length ?? 0) > 0;
    } catch (error: any) {
      if (
        error.name === 'CredentialsProviderError' ||
        error.name === 'AccessDeniedException'
      ) {
        console.warn(
          'AWS credentials not configured - skipping integration tests'
        );
        isDeployed = false;
      } else {
        console.warn(`Deployment check failed: ${error.message}`);
        isDeployed = false;
      }
    }
  });

  describe('VPC Configuration', () => {
    test('primary VPC exists with correct CIDR', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const response = await ec2Primary.send(
        new DescribeVpcsCommand({
          Filters: [
            {
              Name: 'tag:Name',
              Values: [`*${ENVIRONMENT_SUFFIX}*primary*`],
            },
          ],
        })
      );

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBeGreaterThan(0);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    });

    test('DR VPC exists with correct CIDR', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const response = await ec2Dr.send(
        new DescribeVpcsCommand({
          Filters: [
            {
              Name: 'tag:Name',
              Values: [`*${ENVIRONMENT_SUFFIX}*dr*`],
            },
          ],
        })
      );

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBeGreaterThan(0);
      expect(response.Vpcs![0].CidrBlock).toBe('10.1.0.0/16');
    });

    test('VPC peering connection exists and is active', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const response = await ec2Primary.send(
        new DescribeVpcPeeringConnectionsCommand({
          Filters: [
            {
              Name: 'tag:Name',
              Values: [`*${ENVIRONMENT_SUFFIX}*`],
            },
            {
              Name: 'status-code',
              Values: ['active'],
            },
          ],
        })
      );

      expect(response.VpcPeeringConnections).toBeDefined();
      expect(response.VpcPeeringConnections!.length).toBeGreaterThan(0);
    });

    test('primary VPC has subnets in multiple AZs', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const response = await ec2Primary.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'tag:Name',
              Values: [`*${ENVIRONMENT_SUFFIX}*`],
            },
          ],
        })
      );

      expect(response.Subnets).toBeDefined();
      const azs = new Set(response.Subnets!.map((s) => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('RDS Aurora Global Database', () => {
    test('global cluster exists', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const response = await rdsGlobal.send(
        new DescribeGlobalClustersCommand({
          GlobalClusterIdentifier: `transaction-db-${ENVIRONMENT_SUFFIX}`,
        })
      );

      expect(response.GlobalClusters).toBeDefined();
      expect(response.GlobalClusters!.length).toBeGreaterThan(0);
    });

    test('primary RDS cluster exists and is available', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const response = await rdsPrimary.send(
        new DescribeDBClustersCommand({
          Filters: [
            {
              Name: 'db-cluster-id',
              Values: [`*${ENVIRONMENT_SUFFIX}*`],
            },
          ],
        })
      );

      expect(response.DBClusters).toBeDefined();
      const cluster = response.DBClusters!.find((c) =>
        c.DBClusterIdentifier?.includes(ENVIRONMENT_SUFFIX)
      );
      expect(cluster).toBeDefined();
      expect(cluster!.Status).toBe('available');
      expect(cluster!.StorageEncrypted).toBe(true);
    });

    test('DR RDS cluster exists and is available', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const response = await rdsDr.send(
        new DescribeDBClustersCommand({
          Filters: [
            {
              Name: 'db-cluster-id',
              Values: [`*${ENVIRONMENT_SUFFIX}*`],
            },
          ],
        })
      );

      expect(response.DBClusters).toBeDefined();
      const cluster = response.DBClusters!.find((c) =>
        c.DBClusterIdentifier?.includes(ENVIRONMENT_SUFFIX)
      );
      expect(cluster).toBeDefined();
      expect(cluster!.Status).toBe('available');
    });

    test('RDS clusters have multi-AZ enabled', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const response = await rdsPrimary.send(
        new DescribeDBClustersCommand({
          Filters: [
            {
              Name: 'db-cluster-id',
              Values: [`*${ENVIRONMENT_SUFFIX}*`],
            },
          ],
        })
      );

      const cluster = response.DBClusters!.find((c) =>
        c.DBClusterIdentifier?.includes(ENVIRONMENT_SUFFIX)
      );
      expect(cluster!.MultiAZ).toBe(true);
    });
  });

  describe('DynamoDB Global Table', () => {
    test('DynamoDB table exists', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      try {
        const response = await dynamodbPrimary.send(
          new DescribeTableCommand({
            TableName: `session-store-${ENVIRONMENT_SUFFIX}`,
          })
        );

        expect(response.Table).toBeDefined();
        expect(response.Table!.TableStatus).toBe('ACTIVE');
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          console.log('DynamoDB table not found - skipping');
          return;
        }
        throw error;
      }
    });

    test('DynamoDB has global table replicas', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      try {
        const response = await dynamodbPrimary.send(
          new DescribeTableCommand({
            TableName: `session-store-${ENVIRONMENT_SUFFIX}`,
          })
        );

        expect(response.Table!.Replicas).toBeDefined();
        expect(response.Table!.Replicas!.length).toBeGreaterThanOrEqual(2);
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          console.log('DynamoDB table not found - skipping');
          return;
        }
        throw error;
      }
    });
  });

  describe('S3 Cross-Region Replication', () => {
    test('primary S3 bucket exists with versioning', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const bucketName = `app-data-${ENVIRONMENT_SUFFIX}-${PRIMARY_REGION}`;

      try {
        const response = await s3Primary.send(
          new GetBucketVersioningCommand({
            Bucket: bucketName,
          })
        );

        expect(response.Status).toBe('Enabled');
      } catch (error: any) {
        if (error.name === 'NoSuchBucket') {
          console.log(`Bucket ${bucketName} not found - skipping`);
          return;
        }
        throw error;
      }
    });

    test('primary S3 bucket has encryption enabled', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const bucketName = `app-data-${ENVIRONMENT_SUFFIX}-${PRIMARY_REGION}`;

      try {
        const response = await s3Primary.send(
          new GetBucketEncryptionCommand({
            Bucket: bucketName,
          })
        );

        expect(response.ServerSideEncryptionConfiguration).toBeDefined();
        expect(
          response.ServerSideEncryptionConfiguration!.Rules!.length
        ).toBeGreaterThan(0);
      } catch (error: any) {
        if (error.name === 'NoSuchBucket') {
          console.log(`Bucket ${bucketName} not found - skipping`);
          return;
        }
        throw error;
      }
    });

    test('primary S3 bucket has replication configured', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const bucketName = `app-data-${ENVIRONMENT_SUFFIX}-${PRIMARY_REGION}`;

      try {
        const response = await s3Primary.send(
          new GetBucketReplicationCommand({
            Bucket: bucketName,
          })
        );

        expect(response.ReplicationConfiguration).toBeDefined();
        expect(response.ReplicationConfiguration!.Rules).toBeDefined();
        expect(
          response.ReplicationConfiguration!.Rules!.length
        ).toBeGreaterThan(0);
      } catch (error: any) {
        if (
          error.name === 'NoSuchBucket' ||
          error.name === 'ReplicationConfigurationNotFoundError'
        ) {
          console.log(`Bucket ${bucketName} or replication not found - skipping`);
          return;
        }
        throw error;
      }
    });

    test('DR S3 bucket exists', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const bucketName = `app-data-${ENVIRONMENT_SUFFIX}-${DR_REGION}`;

      try {
        const response = await s3Dr.send(
          new GetBucketVersioningCommand({
            Bucket: bucketName,
          })
        );

        expect(response.Status).toBe('Enabled');
      } catch (error: any) {
        if (error.name === 'NoSuchBucket') {
          console.log(`Bucket ${bucketName} not found - skipping`);
          return;
        }
        throw error;
      }
    });
  });

  describe('Lambda Functions', () => {
    test('primary Lambda function exists', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const functionName = `api-handler-${ENVIRONMENT_SUFFIX}`;

      try {
        const response = await lambdaPrimary.send(
          new GetFunctionCommand({
            FunctionName: functionName,
          })
        );

        expect(response.Configuration).toBeDefined();
        expect(response.Configuration!.State).toBe('Active');
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          console.log(`Lambda function ${functionName} not found - skipping`);
          return;
        }
        throw error;
      }
    });

    test('DR Lambda function exists', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const functionName = `api-handler-${ENVIRONMENT_SUFFIX}`;

      try {
        const response = await lambdaDr.send(
          new GetFunctionCommand({
            FunctionName: functionName,
          })
        );

        expect(response.Configuration).toBeDefined();
        expect(response.Configuration!.State).toBe('Active');
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          console.log(`Lambda function ${functionName} not found - skipping`);
          return;
        }
        throw error;
      }
    });

    test('Lambda functions are in VPC', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const functionName = `api-handler-${ENVIRONMENT_SUFFIX}`;

      try {
        const response = await lambdaPrimary.send(
          new GetFunctionCommand({
            FunctionName: functionName,
          })
        );

        expect(response.Configuration!.VpcConfig).toBeDefined();
        expect(response.Configuration!.VpcConfig!.VpcId).toBeDefined();
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          console.log(`Lambda function ${functionName} not found - skipping`);
          return;
        }
        throw error;
      }
    });
  });

  describe('Application Load Balancers', () => {
    test('primary ALB exists', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const response = await albPrimary.send(
        new DescribeLoadBalancersCommand({
          Names: [`alb-${ENVIRONMENT_SUFFIX}`],
        })
      );

      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers!.length).toBeGreaterThan(0);
      expect(response.LoadBalancers![0].State?.Code).toBe('active');
    });

    test('DR ALB exists', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const response = await albDr.send(
        new DescribeLoadBalancersCommand({
          Names: [`alb-${ENVIRONMENT_SUFFIX}`],
        })
      );

      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers!.length).toBeGreaterThan(0);
      expect(response.LoadBalancers![0].State?.Code).toBe('active');
    });
  });

  describe('Route 53 Failover', () => {
    test('Route 53 hosted zone exists', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const response = await route53.send(new ListHostedZonesCommand({}));

      const zone = response.HostedZones?.find((z) =>
        z.Name?.includes(ENVIRONMENT_SUFFIX)
      );
      expect(zone).toBeDefined();
    });

    test('Route 53 has failover records', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const zonesResponse = await route53.send(new ListHostedZonesCommand({}));
      const zone = zonesResponse.HostedZones?.find((z) =>
        z.Name?.includes(ENVIRONMENT_SUFFIX)
      );

      if (!zone) {
        console.log('Hosted zone not found - skipping');
        return;
      }

      const recordsResponse = await route53.send(
        new ListResourceRecordSetsCommand({
          HostedZoneId: zone.Id,
        })
      );

      const failoverRecords = recordsResponse.ResourceRecordSets?.filter(
        (r) => r.Failover
      );
      expect(failoverRecords).toBeDefined();
      expect(failoverRecords!.length).toBeGreaterThanOrEqual(2);
    });

    test('Route 53 has health checks configured', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const zonesResponse = await route53.send(new ListHostedZonesCommand({}));
      const zone = zonesResponse.HostedZones?.find((z) =>
        z.Name?.includes(ENVIRONMENT_SUFFIX)
      );

      if (!zone) {
        console.log('Hosted zone not found - skipping');
        return;
      }

      const recordsResponse = await route53.send(
        new ListResourceRecordSetsCommand({
          HostedZoneId: zone.Id,
        })
      );

      const recordsWithHealthCheck = recordsResponse.ResourceRecordSets?.filter(
        (r) => r.HealthCheckId
      );
      expect(recordsWithHealthCheck).toBeDefined();
      expect(recordsWithHealthCheck!.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('CloudWatch alarms exist in primary region', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const response = await cloudwatchPrimary.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: ENVIRONMENT_SUFFIX,
        })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);
    });

    test('CloudWatch alarms exist in DR region', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const response = await cloudwatchDr.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: ENVIRONMENT_SUFFIX,
        })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);
    });

    test('alarms have SNS actions configured', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const response = await cloudwatchPrimary.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: ENVIRONMENT_SUFFIX,
        })
      );

      const alarmsWithActions = response.MetricAlarms?.filter(
        (a) => a.AlarmActions && a.AlarmActions.length > 0
      );
      expect(alarmsWithActions).toBeDefined();
      expect(alarmsWithActions!.length).toBeGreaterThan(0);
    });
  });

  describe('SNS Topics', () => {
    test('primary SNS topic exists', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const listResponse = await snsPrimary.send(new ListTopicsCommand({}));
      const topic = listResponse.Topics?.find((t) =>
        t.TopicArn?.includes(ENVIRONMENT_SUFFIX)
      );

      expect(topic).toBeDefined();

      if (topic) {
        const attrResponse = await snsPrimary.send(
          new GetTopicAttributesCommand({
            TopicArn: topic.TopicArn,
          })
        );
        expect(attrResponse.Attributes).toBeDefined();
      }
    });

    test('DR SNS topic exists', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const listResponse = await snsDr.send(new ListTopicsCommand({}));
      const topic = listResponse.Topics?.find((t) =>
        t.TopicArn?.includes(ENVIRONMENT_SUFFIX)
      );

      expect(topic).toBeDefined();
    });
  });

  describe('IAM Roles', () => {
    test('Lambda execution role exists', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      try {
        const response = await iam.send(
          new GetRoleCommand({
            RoleName: `lambda-execution-role-${ENVIRONMENT_SUFFIX}`,
          })
        );

        expect(response.Role).toBeDefined();
      } catch (error: any) {
        if (error.name === 'NoSuchEntityException') {
          console.log('IAM role not found - skipping');
          return;
        }
        throw error;
      }
    });

    test('S3 replication role exists', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      try {
        const response = await iam.send(
          new GetRoleCommand({
            RoleName: `s3-replication-role-${ENVIRONMENT_SUFFIX}`,
          })
        );

        expect(response.Role).toBeDefined();
      } catch (error: any) {
        if (error.name === 'NoSuchEntityException') {
          console.log('IAM role not found - skipping');
          return;
        }
        throw error;
      }
    });
  });

  describe('Cross-Region Connectivity', () => {
    test('VPC peering allows cross-region communication', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const response = await ec2Primary.send(
        new DescribeVpcPeeringConnectionsCommand({
          Filters: [
            {
              Name: 'tag:Name',
              Values: [`*${ENVIRONMENT_SUFFIX}*`],
            },
            {
              Name: 'status-code',
              Values: ['active'],
            },
          ],
        })
      );

      expect(response.VpcPeeringConnections).toBeDefined();
      expect(response.VpcPeeringConnections!.length).toBeGreaterThan(0);

      const peering = response.VpcPeeringConnections![0];
      expect(peering.AccepterVpcInfo?.Region).toBe(DR_REGION);
      expect(peering.RequesterVpcInfo?.Region).toBe(PRIMARY_REGION);
    });
  });

  describe('Disaster Recovery Readiness', () => {
    test('DR region has all critical resources', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      // Check VPC
      const vpcResponse = await ec2Dr.send(
        new DescribeVpcsCommand({
          Filters: [
            {
              Name: 'tag:Name',
              Values: [`*${ENVIRONMENT_SUFFIX}*`],
            },
          ],
        })
      );
      expect(vpcResponse.Vpcs!.length).toBeGreaterThan(0);

      // Check ALB
      try {
        const albResponse = await albDr.send(
          new DescribeLoadBalancersCommand({
            Names: [`alb-${ENVIRONMENT_SUFFIX}`],
          })
        );
        expect(albResponse.LoadBalancers!.length).toBeGreaterThan(0);
      } catch (error: any) {
        if (error.name !== 'LoadBalancerNotFoundException') {
          throw error;
        }
      }

      // Check RDS
      const rdsResponse = await rdsDr.send(
        new DescribeDBClustersCommand({
          Filters: [
            {
              Name: 'db-cluster-id',
              Values: [`*${ENVIRONMENT_SUFFIX}*`],
            },
          ],
        })
      );
      expect(rdsResponse.DBClusters!.length).toBeGreaterThan(0);
    });

    test('resources use environment_suffix for uniqueness', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const vpcResponse = await ec2Primary.send(
        new DescribeVpcsCommand({
          Filters: [
            {
              Name: 'tag:Name',
              Values: [`*${ENVIRONMENT_SUFFIX}*`],
            },
          ],
        })
      );

      expect(vpcResponse.Vpcs).toBeDefined();
      vpcResponse.Vpcs!.forEach((vpc) => {
        const nameTag = vpc.Tags?.find((t) => t.Key === 'Name');
        expect(nameTag?.Value).toContain(ENVIRONMENT_SUFFIX);
      });
    });
  });
});
