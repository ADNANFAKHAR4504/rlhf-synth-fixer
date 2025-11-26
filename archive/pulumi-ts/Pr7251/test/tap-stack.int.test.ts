/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */

/**
 * Integration tests for TapStack infrastructure
 *
 * These tests read deployment outputs from cfn-outputs/flat-outputs.json
 * and perform live AWS resource checks to validate the infrastructure.
 *
 * Prerequisites:
 * - AWS credentials configured (via environment or ~/.aws/credentials)
 * - Infrastructure deployed via Pulumi
 * - cfn-outputs/flat-outputs.json file exists with stack outputs
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeVpcPeeringConnectionsCommand,
  DescribeRouteTablesCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeGlobalClustersCommand,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketReplicationCommand,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  Route53Client,
  GetHostedZoneCommand,
  ListResourceRecordSetsCommand,
  GetHealthCheckCommand,
} from '@aws-sdk/client-route-53';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetDashboardCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  EventBridgeClient,
  DescribeEventBusCommand,
  ListRulesCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';

// AWS Clients
const ec2Primary = new EC2Client({ region: 'us-east-1' });
const ec2DR = new EC2Client({ region: 'us-west-2' });
const rdsPrimary = new RDSClient({ region: 'us-east-1' });
const rdsDR = new RDSClient({ region: 'us-west-2' });
const s3Primary = new S3Client({ region: 'us-east-1' });
const s3DR = new S3Client({ region: 'us-west-2' });
const lambdaPrimary = new LambdaClient({ region: 'us-east-1' });
const lambdaDR = new LambdaClient({ region: 'us-west-2' });
const route53 = new Route53Client({ region: 'us-east-1' });
const cloudwatch = new CloudWatchClient({ region: 'us-east-1' });
const eventBridgePrimary = new EventBridgeClient({ region: 'us-east-1' });
const eventBridgeDR = new EventBridgeClient({ region: 'us-west-2' });
const sns = new SNSClient({ region: 'us-east-1' });

// Load deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: Record<string, any>;

describe('TAP Stack Integration Tests - Live AWS Resources', () => {
  beforeAll(() => {
    // Load outputs from deployment
    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Outputs file not found at ${outputsPath}. Please deploy the stack first.`
      );
    }

    const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(outputsContent);

    // Validate required outputs exist
    const requiredOutputs = [
      'primaryVpcId',
      'drVpcId',
      'vpcPeeringConnectionId',
      'globalClusterId',
      'primaryDbClusterId',
      'drDbClusterId',
      'primaryBucketName',
      'drBucketName',
      'primaryLambdaName',
      'drLambdaName',
      'route53ZoneId',
    ];

    requiredOutputs.forEach(key => {
      if (!outputs[key]) {
        throw new Error(`Required output '${key}' not found in outputs file`);
      }
    });
  });

  describe('VPC and Networking - Primary Region (us-east-1)', () => {
    test('should have primary VPC created', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.primaryVpcId],
      });

      const response = await ec2Primary.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBe(1);
      expect(response.Vpcs?.[0].VpcId).toBe(outputs.primaryVpcId);
      expect(response.Vpcs?.[0].State).toBe('available');
    }, 30000);

    test('should have primary VPC with correct CIDR block', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.primaryVpcId],
      });

      const response = await ec2Primary.send(command);
      expect(response.Vpcs?.[0].CidrBlock).toBe('10.0.0.0/16');
    }, 30000);
  });

  describe('VPC and Networking - DR Region (us-west-2)', () => {
    test('should have DR VPC created', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.drVpcId],
      });

      const response = await ec2DR.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBe(1);
      expect(response.Vpcs?.[0].VpcId).toBe(outputs.drVpcId);
      expect(response.Vpcs?.[0].State).toBe('available');
    }, 30000);

    test('should have DR VPC with correct CIDR block', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.drVpcId],
      });

      const response = await ec2DR.send(command);
      expect(response.Vpcs?.[0].CidrBlock).toBe('10.1.0.0/16');
    }, 30000);
  });

  describe('VPC Peering', () => {
    test('should have VPC peering connection active', async () => {
      const command = new DescribeVpcPeeringConnectionsCommand({
        VpcPeeringConnectionIds: [outputs.vpcPeeringConnectionId],
      });

      const response = await ec2Primary.send(command);
      expect(response.VpcPeeringConnections).toBeDefined();
      expect(response.VpcPeeringConnections?.length).toBe(1);

      const peering = response.VpcPeeringConnections?.[0];
      expect(peering?.Status?.Code).toBe('active');
      expect(peering?.RequesterVpcInfo?.VpcId).toBe(outputs.primaryVpcId);
      expect(peering?.AccepterVpcInfo?.VpcId).toBe(outputs.drVpcId);
    }, 30000);

    test('should have peering routes in primary VPC', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.primaryVpcId],
          },
        ],
      });

      const response = await ec2Primary.send(command);
      const routeTables = response.RouteTables || [];

      // Check that at least one route table has a peering connection route
      const hasPeeringRoute = routeTables.some(rt =>
        rt.Routes?.some(
          route =>
            route.VpcPeeringConnectionId === outputs.vpcPeeringConnectionId &&
            route.DestinationCidrBlock === '10.1.0.0/16'
        )
      );

      expect(hasPeeringRoute).toBe(true);
    }, 30000);

    test('should have peering routes in DR VPC', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.drVpcId],
          },
        ],
      });

      const response = await ec2DR.send(command);
      const routeTables = response.RouteTables || [];

      // Check that at least one route table has a peering connection route
      const hasPeeringRoute = routeTables.some(rt =>
        rt.Routes?.some(
          route =>
            route.VpcPeeringConnectionId === outputs.vpcPeeringConnectionId &&
            route.DestinationCidrBlock === '10.0.0.0/16'
        )
      );

      expect(hasPeeringRoute).toBe(true);
    }, 30000);
  });

  describe('RDS Global Database Cluster', () => {
    test('should have global RDS cluster created', async () => {
      const command = new DescribeGlobalClustersCommand({
        GlobalClusterIdentifier: outputs.globalClusterId,
      });

      const response = await rdsPrimary.send(command);
      expect(response.GlobalClusters).toBeDefined();
      expect(response.GlobalClusters?.length).toBe(1);

      const cluster = response.GlobalClusters?.[0];
      expect(cluster?.GlobalClusterIdentifier).toBe(outputs.globalClusterId);
      expect(cluster?.Engine).toBe('aurora-postgresql');
      expect(cluster?.Status).toMatch(/available|modifying/);
    }, 60000);

    test('should have primary RDS cluster', async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.primaryDbClusterId,
      });

      const response = await rdsPrimary.send(command);
      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters?.length).toBe(1);

      const cluster = response.DBClusters?.[0];
      expect(cluster?.DBClusterIdentifier).toBe(outputs.primaryDbClusterId);
      expect(cluster?.Engine).toBe('aurora-postgresql');
      expect(cluster?.Status).toMatch(/available|modifying/);
      expect(cluster?.Endpoint).toBe(outputs.primaryDbEndpoint);
    }, 60000);

    test('should have DR RDS cluster', async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.drDbClusterId,
      });

      const response = await rdsDR.send(command);
      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters?.length).toBe(1);

      const cluster = response.DBClusters?.[0];
      expect(cluster?.DBClusterIdentifier).toBe(outputs.drDbClusterId);
      expect(cluster?.Engine).toBe('aurora-postgresql');
      expect(cluster?.Status).toMatch(/available|modifying/);
      expect(cluster?.Endpoint).toBe(outputs.drDbEndpoint);
    }, 60000);

    test('should have primary RDS instances', async () => {
      const command = new DescribeDBInstancesCommand({
        Filters: [
          {
            Name: 'db-cluster-id',
            Values: [outputs.primaryDbClusterId],
          },
        ],
      });

      const response = await rdsPrimary.send(command);
      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBeGreaterThan(0);

      response.DBInstances?.forEach(instance => {
        expect(instance.DBClusterIdentifier).toBe(outputs.primaryDbClusterId);
        expect(instance.DBInstanceStatus).toMatch(/available|modifying|backing-up/);
      });
    }, 60000);

    test('should have DR RDS instances', async () => {
      const command = new DescribeDBInstancesCommand({
        Filters: [
          {
            Name: 'db-cluster-id',
            Values: [outputs.drDbClusterId],
          },
        ],
      });

      const response = await rdsDR.send(command);
      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBeGreaterThan(0);

      response.DBInstances?.forEach(instance => {
        expect(instance.DBClusterIdentifier).toBe(outputs.drDbClusterId);
        expect(instance.DBInstanceStatus).toMatch(/available|modifying|backing-up/);
      });
    }, 60000);
  });

  describe('S3 Storage and Replication', () => {
    test('should have primary S3 bucket accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.primaryBucketName,
      });

      await expect(s3Primary.send(command)).resolves.not.toThrow();
    }, 30000);

    test('should have DR S3 bucket accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.drBucketName,
      });

      await expect(s3DR.send(command)).resolves.not.toThrow();
    }, 30000);

    test('should have versioning enabled on primary bucket', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.primaryBucketName,
      });

      const response = await s3Primary.send(command);
      expect(response.Status).toBe('Enabled');
    }, 30000);

    test('should have versioning enabled on DR bucket', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.drBucketName,
      });

      const response = await s3DR.send(command);
      expect(response.Status).toBe('Enabled');
    }, 30000);

    test('should have replication configured on primary bucket', async () => {
      const command = new GetBucketReplicationCommand({
        Bucket: outputs.primaryBucketName,
      });

      const response = await s3Primary.send(command);
      expect(response.ReplicationConfiguration).toBeDefined();
      expect(response.ReplicationConfiguration?.Rules).toBeDefined();
      expect(response.ReplicationConfiguration!.Rules!.length).toBeGreaterThan(0);

      const rule = response.ReplicationConfiguration?.Rules?.[0];
      expect(rule?.Status).toBe('Enabled');
      expect(rule?.Destination?.Bucket).toContain(outputs.drBucketName);
    }, 30000);
  });

  describe('Lambda Functions - Primary Region', () => {
    test('should have primary Lambda function deployed', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.primaryLambdaName,
      });

      const response = await lambdaPrimary.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(outputs.primaryLambdaName);
      expect(response.Configuration?.State).toMatch(/Active|Pending/);
    }, 30000);

    test('should have primary Lambda function with correct runtime', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.primaryLambdaName,
      });

      const response = await lambdaPrimary.send(command);
      expect(response.Runtime).toMatch(/nodejs|python/);
      expect(response.Handler).toBeDefined();
    }, 30000);

    test('should have primary Lambda function ARN matching output', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.primaryLambdaName,
      });

      const response = await lambdaPrimary.send(command);
      expect(response.Configuration?.FunctionArn).toBe(outputs.primaryLambdaArn);
    }, 30000);
  });

  describe('Lambda Functions - DR Region', () => {
    test('should have DR Lambda function deployed', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.drLambdaName,
      });

      const response = await lambdaDR.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(outputs.drLambdaName);
      expect(response.Configuration?.State).toMatch(/Active|Pending/);
    }, 30000);

    test('should have DR Lambda function with correct runtime', async () => {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: outputs.drLambdaName,
      });

      const response = await lambdaDR.send(command);
      expect(response.Runtime).toMatch(/nodejs|python/);
      expect(response.Handler).toBeDefined();
    }, 30000);

    test('should have DR Lambda function ARN matching output', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.drLambdaName,
      });

      const response = await lambdaDR.send(command);
      expect(response.Configuration?.FunctionArn).toBe(outputs.drLambdaArn);
    }, 30000);
  });

  describe('Route53 DNS and Health Checks', () => {
    test('should have Route53 hosted zone', async () => {
      const command = new GetHostedZoneCommand({
        Id: outputs.route53ZoneId,
      });

      const response = await route53.send(command);
      expect(response.HostedZone).toBeDefined();
      expect(response.HostedZone?.Id).toContain(outputs.route53ZoneId);
    }, 30000);

    test('should have DNS records in hosted zone', async () => {
      const command = new ListResourceRecordSetsCommand({
        HostedZoneId: outputs.route53ZoneId,
      });

      const response = await route53.send(command);
      expect(response.ResourceRecordSets).toBeDefined();
      expect(response.ResourceRecordSets!.length).toBeGreaterThan(0);

      // Check for failover records
      const failoverRecords = response.ResourceRecordSets?.filter(
        record => record.SetIdentifier
      );
      expect(failoverRecords!.length).toBeGreaterThan(0);
    }, 30000);

    test('should have primary health check active', async () => {
      const command = new GetHealthCheckCommand({
        HealthCheckId: outputs.primaryHealthCheckId,
      });

      const response = await route53.send(command);
      expect(response.HealthCheck).toBeDefined();
      expect(response.HealthCheck?.HealthCheckConfig?.Type).toBe('HTTP');
      expect(response.HealthCheck?.HealthCheckConfig?.ResourcePath).toBe('/health');
      expect(response.HealthCheck?.HealthCheckConfig?.Port).toBe(80);
    }, 30000);

    test('should have DR health check active', async () => {
      const command = new GetHealthCheckCommand({
        HealthCheckId: outputs.drHealthCheckId,
      });

      const response = await route53.send(command);
      expect(response.HealthCheck).toBeDefined();
      expect(response.HealthCheck?.HealthCheckConfig?.Type).toBe('HTTP');
      expect(response.HealthCheck?.HealthCheckConfig?.ResourcePath).toBe('/health');
      expect(response.HealthCheck?.HealthCheckConfig?.Port).toBe(80);
    }, 30000);
  });

  describe('EventBridge Cross-Region Setup', () => {
    test('should have primary event bus', async () => {
      const command = new DescribeEventBusCommand({
        Name: outputs.primaryEventBusName,
      });

      const response = await eventBridgePrimary.send(command);
      expect(response.Name).toBe(outputs.primaryEventBusName);
      expect(response.Arn).toBe(outputs.primaryEventBusArn);
    }, 30000);

    test('should have DR event bus', async () => {
      const command = new DescribeEventBusCommand({
        Name: outputs.drEventBusName,
      });

      const response = await eventBridgeDR.send(command);
      expect(response.Name).toBe(outputs.drEventBusName);
      expect(response.Arn).toBe(outputs.drEventBusArn);
    }, 30000);

    test('should have event rules configured on primary bus', async () => {
      const command = new ListRulesCommand({
        EventBusName: outputs.primaryEventBusName,
      });

      const response = await eventBridgePrimary.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);
    }, 30000);

    test('should have cross-region event targets', async () => {
      const listCommand = new ListRulesCommand({
        EventBusName: outputs.primaryEventBusName,
      });
      const rulesResponse = await eventBridgePrimary.send(listCommand);

      if (rulesResponse.Rules && rulesResponse.Rules.length > 0) {
        const rule = rulesResponse.Rules[0];

        const targetsCommand = new ListTargetsByRuleCommand({
          Rule: rule.Name!,
          EventBusName: outputs.primaryEventBusName,
        });

        const targetsResponse = await eventBridgePrimary.send(targetsCommand);
        expect(targetsResponse.Targets).toBeDefined();
      }
    }, 30000);
  });

  describe('CloudWatch Monitoring', () => {
    test('should have SNS alarm topic created', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.alarmTopicArn,
      });

      const response = await sns.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(outputs.alarmTopicArn);
    }, 30000);

    test('should have CloudWatch alarms configured', async () => {
      const command = new DescribeAlarmsCommand({
        MaxRecords: 100,
      });

      const response = await cloudwatch.send(command);
      expect(response.MetricAlarms).toBeDefined();

      // Filter alarms related to our stack
      const stackAlarms = response.MetricAlarms?.filter(
        alarm =>
          alarm.AlarmName?.includes('primary-') ||
          alarm.AlarmName?.includes('dr-') ||
          alarm.AlarmActions?.includes(outputs.alarmTopicArn)
      );

      expect(stackAlarms!.length).toBeGreaterThan(0);
    }, 30000);

    test('should have health check alarms', async () => {
      const command = new DescribeAlarmsCommand({
        MaxRecords: 100,
      });

      const response = await cloudwatch.send(command);

      const healthAlarms = response.MetricAlarms?.filter(
        alarm =>
          alarm.Namespace === 'AWS/Route53' &&
          alarm.MetricName === 'HealthCheckStatus'
      );

      expect(healthAlarms!.length).toBeGreaterThan(0);
    }, 30000);

    test('should have RDS CPU alarms', async () => {
      const command = new DescribeAlarmsCommand({
        MaxRecords: 100,
      });

      const response = await cloudwatch.send(command);

      const rdsAlarms = response.MetricAlarms?.filter(
        alarm =>
          alarm.Namespace === 'AWS/RDS' && alarm.MetricName === 'CPUUtilization'
      );

      expect(rdsAlarms!.length).toBeGreaterThan(0);
    }, 30000);

    test('should have Lambda error alarms', async () => {
      const command = new DescribeAlarmsCommand({
        MaxRecords: 100,
      });

      const response = await cloudwatch.send(command);

      const lambdaAlarms = response.MetricAlarms?.filter(
        alarm => alarm.Namespace === 'AWS/Lambda' && alarm.MetricName === 'Errors'
      );

      expect(lambdaAlarms!.length).toBeGreaterThan(0);
    }, 30000);

    test('should have CloudWatch dashboard', async () => {
      const command = new GetDashboardCommand({
        DashboardName: outputs.dashboardName,
      });

      const response = await cloudwatch.send(command);
      expect(response.DashboardName).toBe(outputs.dashboardName);
      expect(response.DashboardBody).toBeDefined();

      // Parse and validate dashboard has widgets
      const dashboard = JSON.parse(response.DashboardBody!);
      expect(dashboard.widgets).toBeDefined();
      expect(dashboard.widgets.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Multi-Region Validation', () => {
    test('should have different VPC IDs for primary and DR', () => {
      expect(outputs.primaryVpcId).not.toBe(outputs.drVpcId);
    });

    test('should have different database endpoints for primary and DR', () => {
      expect(outputs.primaryDbEndpoint).not.toBe(outputs.drDbEndpoint);
    });

    test('should have different ALB DNS names for primary and DR', () => {
      expect(outputs.primaryAlbDnsName).not.toBe(outputs.drAlbDnsName);
    });

    test('should have different Lambda function names for primary and DR', () => {
      expect(outputs.primaryLambdaName).not.toBe(outputs.drLambdaName);
    });

    test('should have different S3 bucket names for primary and DR', () => {
      expect(outputs.primaryBucketName).not.toBe(outputs.drBucketName);
    });

    test('should have different event bus names for primary and DR', () => {
      expect(outputs.primaryEventBusName).not.toBe(outputs.drEventBusName);
    });
  });

  describe('Infrastructure Connectivity', () => {
    test('should have primary ALB DNS resolvable', async () => {
      const dns = require('dns').promises;
      await expect(dns.resolve4(outputs.primaryAlbDnsName)).resolves.toBeDefined();
    }, 30000);

    test('should have DR ALB DNS resolvable', async () => {
      const dns = require('dns').promises;
      await expect(dns.resolve4(outputs.drAlbDnsName)).resolves.toBeDefined();
    }, 30000);

    test('should have primary database endpoint resolvable', async () => {
      const dns = require('dns').promises;
      await expect(dns.resolve4(outputs.primaryDbEndpoint)).resolves.toBeDefined();
    }, 30000);

    test('should have DR database endpoint resolvable', async () => {
      const dns = require('dns').promises;
      await expect(dns.resolve4(outputs.drDbEndpoint)).resolves.toBeDefined();
    }, 30000);
  });
});
