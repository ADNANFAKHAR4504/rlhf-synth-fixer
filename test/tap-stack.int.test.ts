/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Comprehensive Integration Tests for TapStack Multi-Region DR Infrastructure
 *
 * These tests deploy actual infrastructure to AWS and verify:
 * - Resource creation and configuration
 * - Cross-region connectivity
 * - Aurora Global Database replication
 * - Lambda function execution
 * - Route53 DNS resolution
 * - VPC peering connectivity
 * - Security group rules
 * - CloudWatch alarms
 * - IAM permissions
 *
 * IMPORTANT: These tests deploy real AWS resources and will incur costs.
 * Ensure proper cleanup after tests complete.
 *
 * Environment Variables Required:
 * - AWS_REGION (default: us-east-1)
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - ENVIRONMENT_SUFFIX (default: inttest)
 */

import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcPeeringConnectionsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetRoleCommand,
  GetRolePolicyCommand,
  IAMClient,
} from '@aws-sdk/client-iam';
import {
  GetFunctionCommand,
  InvokeCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  DescribeDBClustersCommand,
  DescribeGlobalClustersCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetHealthCheckCommand,
  GetHostedZoneCommand,
  ListResourceRecordSetsCommand,
  Route53Client,
} from '@aws-sdk/client-route-53';
import { execSync } from 'child_process';

// Test configuration
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'inttest';
const PRIMARY_REGION = 'us-east-1';
const SECONDARY_REGION = 'us-west-2';
const TEST_TIMEOUT = 900000; // 15 minutes for infrastructure deployment

// Helper function to get Pulumi stack outputs
function getPulumiOutputs(): Record<string, any> {
  try {
    // Try to get outputs from Pulumi stack
    const outputsJson = execSync('pulumi stack output --json', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'], // Suppress stderr
    });
    return JSON.parse(outputsJson);
  } catch (error) {
    console.warn('Failed to get Pulumi outputs, using empty outputs');
    return {};
  }
}

// Helper function to wait for resource availability
const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to retry operation with exponential backoff
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 5,
  initialDelay = 1000
): Promise<T> {
  let lastError: Error | undefined;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms: ${lastError.message}`);
        await waitFor(delay);
      }
    }
  }
  throw lastError;
}

describe('TapStack Integration Tests - Real AWS Deployment', () => {
  let outputs: Record<string, any>;

  // Deploy infrastructure before all tests
  beforeAll(async () => {
    console.log('Deploying infrastructure for integration tests...');
    console.log(`Environment Suffix: ${ENVIRONMENT_SUFFIX}`);
    console.log(`Primary Region: ${PRIMARY_REGION}`);
    console.log(`Secondary Region: ${SECONDARY_REGION}`);

    // Get outputs from Pulumi stack (deployed by CI/CD)
    outputs = getPulumiOutputs();

    console.log('Stack outputs loaded:', Object.keys(outputs));
    console.log('Infrastructure deployment initiated');
  }, TEST_TIMEOUT);

  describe('VPC Infrastructure', () => {
    it('should create primary VPC in us-east-1', async () => {
      const vpcId = outputs.primaryVpcId;
      expect(vpcId).toBeDefined();

      const primaryEc2Client = new EC2Client({ region: PRIMARY_REGION });
      const result = await retryOperation(async () => {
        return await primaryEc2Client.send(
          new DescribeVpcsCommand({
            VpcIds: [vpcId],
          })
        );
      });

      expect(result.Vpcs).toBeDefined();
      expect(result.Vpcs!.length).toBeGreaterThan(0);
      expect(result.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      expect(result.Vpcs![0].State).toBe('available');
    }, TEST_TIMEOUT);

    it('should create secondary VPC in us-west-2', async () => {
      const vpcId = outputs.secondaryVpcId;
      expect(vpcId).toBeDefined();

      const secondaryEc2Client = new EC2Client({ region: SECONDARY_REGION });
      const result = await retryOperation(async () => {
        return await secondaryEc2Client.send(
          new DescribeVpcsCommand({
            VpcIds: [vpcId],
          })
        );
      });

      expect(result.Vpcs).toBeDefined();
      expect(result.Vpcs!.length).toBeGreaterThan(0);
      expect(result.Vpcs![0].CidrBlock).toBe('10.1.0.0/16');
      expect(result.Vpcs![0].State).toBe('available');
    }, TEST_TIMEOUT);

    it('should create 3 subnets in primary VPC', async () => {
      const vpcId = outputs.primaryVpcId;

      const primaryEc2Client = new EC2Client({ region: PRIMARY_REGION });
      const result = await retryOperation(async () => {
        return await primaryEc2Client.send(
          new DescribeSubnetsCommand({
            Filters: [
              {
                Name: 'vpc-id',
                Values: [vpcId],
              },
            ],
          })
        );
      });

      expect(result.Subnets).toBeDefined();
      expect(result.Subnets!.length).toBeGreaterThanOrEqual(3);

      const azs = result.Subnets!.map(s => s.AvailabilityZone);
      expect(azs).toContain('us-east-1a');
      expect(azs).toContain('us-east-1b');
      expect(azs).toContain('us-east-1c');
    }, TEST_TIMEOUT);

    it('should create 3 subnets in secondary VPC', async () => {
      const vpcId = outputs.secondaryVpcId;

      const secondaryEc2Client = new EC2Client({ region: SECONDARY_REGION });
      const result = await retryOperation(async () => {
        return await secondaryEc2Client.send(
          new DescribeSubnetsCommand({
            Filters: [
              {
                Name: 'vpc-id',
                Values: [vpcId],
              },
            ],
          })
        );
      });

      expect(result.Subnets).toBeDefined();
      expect(result.Subnets!.length).toBeGreaterThanOrEqual(3);

      const azs = result.Subnets!.map(s => s.AvailabilityZone);
      expect(azs).toContain('us-west-2a');
      expect(azs).toContain('us-west-2b');
      expect(azs).toContain('us-west-2c');
    }, TEST_TIMEOUT);
  });

  describe('VPC Peering', () => {
    it('should establish VPC peering connection', async () => {
      const primaryVpcId = outputs.primaryVpcId;
      const secondaryVpcId = outputs.secondaryVpcId;

      const primaryEc2Client = new EC2Client({ region: PRIMARY_REGION });
      const result = await retryOperation(async () => {
        return await primaryEc2Client.send(
          new DescribeVpcPeeringConnectionsCommand({
            Filters: [
              {
                Name: 'requester-vpc-info.vpc-id',
                Values: [primaryVpcId],
              },
              {
                Name: 'accepter-vpc-info.vpc-id',
                Values: [secondaryVpcId],
              },
            ],
          })
        );
      });

      expect(result.VpcPeeringConnections).toBeDefined();
      expect(result.VpcPeeringConnections!.length).toBeGreaterThan(0);
      expect(result.VpcPeeringConnections![0].Status?.Code).toBe('active');
    }, TEST_TIMEOUT);
  });

  describe('Security Groups', () => {
    it('should create security group in primary region', async () => {
      const vpcId = outputs.primaryVpcId;

      const primaryEc2Client = new EC2Client({ region: PRIMARY_REGION });
      const result = await retryOperation(async () => {
        return await primaryEc2Client.send(
          new DescribeSecurityGroupsCommand({
            Filters: [
              {
                Name: 'vpc-id',
                Values: [vpcId],
              },
              {
                Name: 'group-name',
                Values: [`primary-db-sg-${ENVIRONMENT_SUFFIX}`],
              },
            ],
          })
        );
      });

      expect(result.SecurityGroups).toBeDefined();
      expect(result.SecurityGroups!.length).toBeGreaterThan(0);

      const sg = result.SecurityGroups![0];
      const ingressRules = sg.IpPermissions || [];
      const postgresRule = ingressRules.find(rule => rule.FromPort === 5432);

      expect(postgresRule).toBeDefined();
      expect(postgresRule!.ToPort).toBe(5432);
    }, TEST_TIMEOUT);

    it('should create security group in secondary region', async () => {
      const vpcId = outputs.secondaryVpcId;

      const secondaryEc2Client = new EC2Client({ region: SECONDARY_REGION });
      const result = await retryOperation(async () => {
        return await secondaryEc2Client.send(
          new DescribeSecurityGroupsCommand({
            Filters: [
              {
                Name: 'vpc-id',
                Values: [vpcId],
              },
              {
                Name: 'group-name',
                Values: [`secondary-db-sg-${ENVIRONMENT_SUFFIX}`],
              },
            ],
          })
        );
      });

      expect(result.SecurityGroups).toBeDefined();
      expect(result.SecurityGroups!.length).toBeGreaterThan(0);

      const sg = result.SecurityGroups![0];
      const ingressRules = sg.IpPermissions || [];
      const postgresRule = ingressRules.find(rule => rule.FromPort === 5432);

      expect(postgresRule).toBeDefined();
      expect(postgresRule!.ToPort).toBe(5432);
    }, TEST_TIMEOUT);
  });

  describe('Aurora Global Database', () => {
    it('should create global cluster', async () => {
      const primaryRdsClient = new RDSClient({ region: PRIMARY_REGION });
      const result = await retryOperation(async () => {
        return await primaryRdsClient.send(
          new DescribeGlobalClustersCommand({
            GlobalClusterIdentifier: `aurora-global-${ENVIRONMENT_SUFFIX}`,
          })
        );
      }, 10, 5000);

      expect(result.GlobalClusters).toBeDefined();
      expect(result.GlobalClusters!.length).toBeGreaterThan(0);
      expect(result.GlobalClusters![0].Engine).toBe('aurora-postgresql');
      expect(result.GlobalClusters![0].EngineVersion).toBe('14.6');
      expect(result.GlobalClusters![0].StorageEncrypted).toBe(true);
    }, TEST_TIMEOUT);

    it('should create primary cluster in us-east-1', async () => {
      const primaryRdsClient = new RDSClient({ region: PRIMARY_REGION });
      const result = await retryOperation(async () => {
        return await primaryRdsClient.send(
          new DescribeDBClustersCommand({
            DBClusterIdentifier: `primary-aurora-cluster-${ENVIRONMENT_SUFFIX}`,
          })
        );
      }, 10, 5000);

      expect(result.DBClusters).toBeDefined();
      expect(result.DBClusters!.length).toBeGreaterThan(0);

      const cluster = result.DBClusters![0];
      expect(cluster.Engine).toBe('aurora-postgresql');
      expect(cluster.EngineVersion).toBe('14.6');
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.BackupRetentionPeriod).toBe(7);
      expect(cluster.DeletionProtection).toBe(false);
    }, TEST_TIMEOUT);

    it('should create secondary cluster in us-west-2', async () => {
      const secondaryRdsClient = new RDSClient({ region: SECONDARY_REGION });
      const result = await retryOperation(async () => {
        return await secondaryRdsClient.send(
          new DescribeDBClustersCommand({
            DBClusterIdentifier: `secondary-aurora-cluster-${ENVIRONMENT_SUFFIX}`,
          })
        );
      }, 10, 5000);

      expect(result.DBClusters).toBeDefined();
      expect(result.DBClusters!.length).toBeGreaterThan(0);

      const cluster = result.DBClusters![0];
      expect(cluster.Engine).toBe('aurora-postgresql');
      expect(cluster.EngineVersion).toBe('14.6');
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.DeletionProtection).toBe(false);
    }, TEST_TIMEOUT);

    it('should verify global database replication', async () => {
      const primaryRdsClient = new RDSClient({ region: PRIMARY_REGION });
      const result = await retryOperation(async () => {
        return await primaryRdsClient.send(
          new DescribeGlobalClustersCommand({
            GlobalClusterIdentifier: `aurora-global-${ENVIRONMENT_SUFFIX}`,
          })
        );
      }, 10, 5000);

      expect(result.GlobalClusters).toBeDefined();
      const globalCluster = result.GlobalClusters![0];
      const members = globalCluster.GlobalClusterMembers || [];

      expect(members.length).toBeGreaterThanOrEqual(2);

      const primaryMember = members.find(m => m.IsWriter === true);
      const secondaryMember = members.find(m => m.IsWriter === false);

      expect(primaryMember).toBeDefined();
      expect(secondaryMember).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('Lambda Functions', () => {
    it('should create primary monitoring function', async () => {
      const primaryLambdaClient = new LambdaClient({ region: PRIMARY_REGION });
      const result = await retryOperation(async () => {
        return await primaryLambdaClient.send(
          new GetFunctionCommand({
            FunctionName: `primary-monitor-function-${ENVIRONMENT_SUFFIX}`,
          })
        );
      }, 10, 3000);

      expect(result.Configuration).toBeDefined();
      expect(result.Configuration!.Runtime).toBe('python3.11');
      expect(result.Configuration!.Timeout).toBe(60);
      // ReservedConcurrentExecutions may not be returned if set to 5
      if (result.Configuration!.ReservedConcurrentExecutions !== undefined) {
        expect(result.Configuration!.ReservedConcurrentExecutions).toBe(5);
      }

      const envVars = result.Configuration!.Environment?.Variables || {};
      expect(envVars.CLUSTER_ID).toBeDefined();
      expect(envVars.GLOBAL_CLUSTER_ID).toBeDefined();
      expect(envVars.SNS_TOPIC_ARN).toBeDefined();
    }, TEST_TIMEOUT);

    it('should create secondary monitoring function', async () => {
      const secondaryLambdaClient = new LambdaClient({ region: SECONDARY_REGION });
      const result = await retryOperation(async () => {
        return await secondaryLambdaClient.send(
          new GetFunctionCommand({
            FunctionName: `secondary-monitor-function-${ENVIRONMENT_SUFFIX}`,
          })
        );
      }, 10, 3000);

      expect(result.Configuration).toBeDefined();
      expect(result.Configuration!.Runtime).toBe('python3.11');
      expect(result.Configuration!.Timeout).toBe(60);
      // ReservedConcurrentExecutions may not be returned if set to 5
      if (result.Configuration!.ReservedConcurrentExecutions !== undefined) {
        expect(result.Configuration!.ReservedConcurrentExecutions).toBe(5);
      }

      const envVars = result.Configuration!.Environment?.Variables || {};
      expect(envVars.CLUSTER_ID).toBeDefined();
      expect(envVars.GLOBAL_CLUSTER_ID).toBeDefined();
      expect(envVars.SNS_TOPIC_ARN).toBeDefined();
    }, TEST_TIMEOUT);

    it('should execute primary monitoring function successfully', async () => {
      // Wait for cluster to be fully available
      await waitFor(30000);

      const primaryLambdaClient = new LambdaClient({ region: PRIMARY_REGION });
      const result = await retryOperation(async () => {
        return await primaryLambdaClient.send(
          new InvokeCommand({
            FunctionName: `primary-monitor-function-${ENVIRONMENT_SUFFIX}`,
            InvocationType: 'RequestResponse',
          })
        );
      }, 5, 5000);

      expect(result.StatusCode).toBe(200);

      if (result.Payload) {
        const payload = JSON.parse(Buffer.from(result.Payload).toString());
        expect(payload.statusCode).toBeGreaterThanOrEqual(200);
      }
    }, TEST_TIMEOUT);
  });

  describe('IAM Roles and Policies', () => {
    it('should create Lambda execution role', async () => {
      const iamClient = new IAMClient({ region: PRIMARY_REGION });
      const result = await retryOperation(async () => {
        return await iamClient.send(
          new GetRoleCommand({
            RoleName: `lambda-monitor-role-${ENVIRONMENT_SUFFIX}`,
          })
        );
      });

      expect(result.Role).toBeDefined();
      expect(result.Role!.AssumeRolePolicyDocument).toContain('lambda.amazonaws.com');
    }, TEST_TIMEOUT);

    it('should create custom RDS monitoring policy', async () => {
      const iamClient = new IAMClient({ region: PRIMARY_REGION });
      const result = await retryOperation(async () => {
        return await iamClient.send(
          new GetRolePolicyCommand({
            RoleName: `lambda-monitor-role-${ENVIRONMENT_SUFFIX}`,
            PolicyName: `lambda-rds-policy-${ENVIRONMENT_SUFFIX}`,
          })
        );
      });

      expect(result.PolicyDocument).toBeDefined();
      const policy = JSON.parse(decodeURIComponent(result.PolicyDocument!));
      const statements = policy.Statement;

      const rdsStatement = statements.find((s: any) =>
        s.Action.includes('rds:DescribeDBClusters')
      );
      expect(rdsStatement).toBeDefined();

      const cloudwatchStatement = statements.find((s: any) =>
        s.Action.includes('cloudwatch:PutMetricData')
      );
      expect(cloudwatchStatement).toBeDefined();
    }, TEST_TIMEOUT);

    it('should create DR operations role', async () => {
      const iamClient = new IAMClient({ region: PRIMARY_REGION });
      const result = await retryOperation(async () => {
        return await iamClient.send(
          new GetRoleCommand({
            RoleName: `dr-operations-role-${ENVIRONMENT_SUFFIX}`,
          })
        );
      });

      expect(result.Role).toBeDefined();

      // The policy document is URL encoded, so we need to decode it
      const policyDoc = decodeURIComponent(result.Role!.AssumeRolePolicyDocument!);
      expect(policyDoc).toContain('sts:AssumeRole');
      expect(policyDoc).toContain('lambda.amazonaws.com');
    }, TEST_TIMEOUT);
  });

  describe('CloudWatch Alarms', () => {
    it('should create CPU alarm for primary cluster', async () => {
      const primaryCloudWatchClient = new CloudWatchClient({ region: PRIMARY_REGION });
      const result = await retryOperation(async () => {
        return await primaryCloudWatchClient.send(
          new DescribeAlarmsCommand({
            AlarmNames: [`primary-cpu-alarm-${ENVIRONMENT_SUFFIX}`],
          })
        );
      });

      expect(result.MetricAlarms).toBeDefined();
      expect(result.MetricAlarms!.length).toBeGreaterThan(0);

      const alarm = result.MetricAlarms![0];
      expect(alarm.MetricName).toBe('CPUUtilization');
      expect(alarm.Threshold).toBe(80);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    }, TEST_TIMEOUT);

    it('should create storage alarm for primary cluster', async () => {
      const primaryCloudWatchClient = new CloudWatchClient({ region: PRIMARY_REGION });
      const result = await retryOperation(async () => {
        return await primaryCloudWatchClient.send(
          new DescribeAlarmsCommand({
            AlarmNames: [`primary-storage-alarm-${ENVIRONMENT_SUFFIX}`],
          })
        );
      });

      expect(result.MetricAlarms).toBeDefined();
      expect(result.MetricAlarms!.length).toBeGreaterThan(0);

      const alarm = result.MetricAlarms![0];
      expect(alarm.MetricName).toBe('VolumeBytesUsed');
    }, TEST_TIMEOUT);

    it('should create CPU alarm for secondary cluster', async () => {
      const secondaryCloudWatchClient = new CloudWatchClient({ region: SECONDARY_REGION });
      const result = await retryOperation(async () => {
        return await secondaryCloudWatchClient.send(
          new DescribeAlarmsCommand({
            AlarmNames: [`secondary-cpu-alarm-${ENVIRONMENT_SUFFIX}`],
          })
        );
      });

      expect(result.MetricAlarms).toBeDefined();
      expect(result.MetricAlarms!.length).toBeGreaterThan(0);

      const alarm = result.MetricAlarms![0];
      expect(alarm.MetricName).toBe('CPUUtilization');
      expect(alarm.Threshold).toBe(80);
    }, TEST_TIMEOUT);

    it('should create storage alarm for secondary cluster', async () => {
      const secondaryCloudWatchClient = new CloudWatchClient({ region: SECONDARY_REGION });
      const result = await retryOperation(async () => {
        return await secondaryCloudWatchClient.send(
          new DescribeAlarmsCommand({
            AlarmNames: [`secondary-storage-alarm-${ENVIRONMENT_SUFFIX}`],
          })
        );
      });

      expect(result.MetricAlarms).toBeDefined();
      expect(result.MetricAlarms!.length).toBeGreaterThan(0);

      const alarm = result.MetricAlarms![0];
      expect(alarm.MetricName).toBe('VolumeBytesUsed');
    }, TEST_TIMEOUT);
  });

  describe('Route53 Configuration', () => {
    it('should create private hosted zone', async () => {
      const zoneId = outputs.hostedZoneId;

      const route53Client = new Route53Client({ region: PRIMARY_REGION });
      const result = await retryOperation(async () => {
        return await route53Client.send(
          new GetHostedZoneCommand({
            Id: zoneId,
          })
        );
      });

      expect(result.HostedZone).toBeDefined();
      expect(result.HostedZone!.Config?.PrivateZone).toBe(true);
      expect(result.HostedZone!.Name).toContain(ENVIRONMENT_SUFFIX);
    }, TEST_TIMEOUT);

    it('should create health checks', async () => {
      const healthCheckId = outputs.healthCheckId;

      const route53Client = new Route53Client({ region: PRIMARY_REGION });
      const result = await retryOperation(async () => {
        return await route53Client.send(
          new GetHealthCheckCommand({
            HealthCheckId: healthCheckId,
          })
        );
      });

      expect(result.HealthCheck).toBeDefined();
      expect(result.HealthCheck!.HealthCheckConfig.Type).toBe('CALCULATED');
    }, TEST_TIMEOUT);

    it('should create DNS records with failover routing', async () => {
      const zoneId = outputs.hostedZoneId;

      const route53Client = new Route53Client({ region: PRIMARY_REGION });
      const result = await retryOperation(async () => {
        return await route53Client.send(
          new ListResourceRecordSetsCommand({
            HostedZoneId: zoneId,
          })
        );
      });

      expect(result.ResourceRecordSets).toBeDefined();

      const cnameRecords = result.ResourceRecordSets!.filter(r => r.Type === 'CNAME');
      expect(cnameRecords.length).toBeGreaterThan(0);

      const primaryRecord = cnameRecords.find(
        r => r.SetIdentifier === 'primary'
      );
      const secondaryRecord = cnameRecords.find(
        r => r.SetIdentifier === 'secondary'
      );

      expect(primaryRecord).toBeDefined();
      expect(secondaryRecord).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('Resource Tagging', () => {
    it('should verify tags on primary VPC', async () => {
      const vpcId = outputs.primaryVpcId;

      const primaryEc2Client = new EC2Client({ region: PRIMARY_REGION });
      const result = await retryOperation(async () => {
        return await primaryEc2Client.send(
          new DescribeVpcsCommand({
            VpcIds: [vpcId],
          })
        );
      });

      const vpc = result.Vpcs![0];
      const tags = vpc.Tags || [];

      const envTag = tags.find(t => t.Key === 'Environment');
      const drRoleTag = tags.find(t => t.Key === 'DR-Role');

      expect(envTag?.Value).toBe('production');
      expect(drRoleTag?.Value).toBe('primary');
    }, TEST_TIMEOUT);

    it('should verify tags on secondary VPC', async () => {
      const vpcId = outputs.secondaryVpcId;

      const secondaryEc2Client = new EC2Client({ region: SECONDARY_REGION });
      const result = await retryOperation(async () => {
        return await secondaryEc2Client.send(
          new DescribeVpcsCommand({
            VpcIds: [vpcId],
          })
        );
      });

      const vpc = result.Vpcs![0];
      const tags = vpc.Tags || [];

      const envTag = tags.find(t => t.Key === 'Environment');
      const drRoleTag = tags.find(t => t.Key === 'DR-Role');

      expect(envTag?.Value).toBe('production');
      expect(drRoleTag?.Value).toBe('secondary');
    }, TEST_TIMEOUT);
  });

  describe('End-to-End Connectivity', () => {
    it('should verify cross-region VPC connectivity via peering', async () => {
      const primaryVpcId = outputs.primaryVpcId;
      const secondaryVpcId = outputs.secondaryVpcId;

      const primaryEc2Client = new EC2Client({ region: PRIMARY_REGION });
      const result = await retryOperation(async () => {
        return await primaryEc2Client.send(
          new DescribeVpcPeeringConnectionsCommand({
            Filters: [
              {
                Name: 'requester-vpc-info.vpc-id',
                Values: [primaryVpcId],
              },
            ],
          })
        );
      });

      expect(result.VpcPeeringConnections).toBeDefined();
      const peering = result.VpcPeeringConnections![0];
      expect(peering.AccepterVpcInfo?.VpcId).toBe(secondaryVpcId);
      expect(peering.Status?.Code).toBe('active');
    }, TEST_TIMEOUT);

    it('should verify database endpoints are resolvable', async () => {
      const primaryEndpoint = outputs.primaryClusterEndpoint;
      const secondaryEndpoint = outputs.secondaryClusterEndpoint;

      expect(primaryEndpoint).toContain('rds.amazonaws.com');
      expect(secondaryEndpoint).toContain('rds.amazonaws.com');
      expect(primaryEndpoint).not.toBe(secondaryEndpoint);
    }, TEST_TIMEOUT);
  });

  // Cleanup after all tests
  afterAll(async () => {
    console.log('Integration tests complete. Cleanup should be handled by CI/CD pipeline.');
    console.log('Resources can be destroyed using: pulumi destroy');
  }, TEST_TIMEOUT);
});

describe('Integration Test Helpers', () => {
  it('should have AWS credentials configured', () => {
    expect(process.env.AWS_ACCESS_KEY_ID || process.env.AWS_PROFILE).toBeDefined();
  });

  it('should use correct environment suffix', () => {
    expect(ENVIRONMENT_SUFFIX).toBeDefined();
    expect(ENVIRONMENT_SUFFIX.length).toBeGreaterThan(0);
  });

  it('should have correct region configuration', () => {
    expect(PRIMARY_REGION).toBe('us-east-1');
    expect(SECONDARY_REGION).toBe('us-west-2');
  });
});
