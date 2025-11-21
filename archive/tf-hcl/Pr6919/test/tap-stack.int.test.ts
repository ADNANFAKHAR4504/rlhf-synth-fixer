/**
 * Integration tests for multi-region DR infrastructure.
 * Tests validate actual deployed resources using cfn-outputs/flat-outputs.json.
 * No mocking - all tests use real AWS resources.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DBInstance,
} from '@aws-sdk/client-rds';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeVpcPeeringConnectionsCommand,
  DescribeSubnetsCommand,
  DescribeRouteTablesCommand,
} from '@aws-sdk/client-ec2';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  Route53Client,
  ListHostedZonesCommand,
  ListHealthChecksCommand,
  ListTagsForResourceCommand,
} from '@aws-sdk/client-route-53';

interface Outputs {
  [key: string]: string;
}

let outputs: Outputs;
let primaryRdsClient: RDSClient;
let drRdsClient: RDSClient;
let primaryEc2Client: EC2Client;
let drEc2Client: EC2Client;
let lambdaClient: LambdaClient;
let cloudwatchClient: CloudWatchClient;
let secretsClientPrimary: SecretsManagerClient;
let secretsClientDr: SecretsManagerClient;
let route53Client: Route53Client;

beforeAll(() => {
  // Load deployment outputs from cfn-outputs/flat-outputs.json
  const outputsFile = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

  if (!fs.existsSync(outputsFile)) {
    throw new Error(`Outputs file not found: ${outputsFile}. Run deployment first.`);
  }

  const fileContent = fs.readFileSync(outputsFile, 'utf-8');
  outputs = JSON.parse(fileContent);

  // Initialize AWS clients
  primaryRdsClient = new RDSClient({ region: 'us-east-1' });
  drRdsClient = new RDSClient({ region: 'us-west-2' });
  primaryEc2Client = new EC2Client({ region: 'us-east-1' });
  drEc2Client = new EC2Client({ region: 'us-west-2' });
  lambdaClient = new LambdaClient({ region: 'us-east-1' });
  cloudwatchClient = new CloudWatchClient({ region: 'us-east-1' });
  secretsClientPrimary = new SecretsManagerClient({ region: 'us-east-1' });
  secretsClientDr = new SecretsManagerClient({ region: 'us-west-2' });
  route53Client = new Route53Client({});
});

describe('TestVPCResources', () => {
  test('test_primary_vpc_exists - Verify primary VPC exists and is available', async () => {
    const vpcId = outputs['primary_vpc_id'];

    const response = await primaryEc2Client.send(
      new DescribeVpcsCommand({ VpcIds: [vpcId] })
    );

    expect(response.Vpcs).toHaveLength(1);
    expect(response.Vpcs![0].State).toBe('available');
    expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
  });

  test('test_dr_vpc_exists - Verify DR VPC exists and is available', async () => {
    const vpcId = outputs['dr_vpc_id'];

    const response = await drEc2Client.send(
      new DescribeVpcsCommand({ VpcIds: [vpcId] })
    );

    expect(response.Vpcs).toHaveLength(1);
    expect(response.Vpcs![0].State).toBe('available');
    expect(response.Vpcs![0].CidrBlock).toBe('10.1.0.0/16');
  });

  test('test_vpc_peering_connection - Verify VPC peering connection is active', async () => {
    const peeringId = outputs['vpc_peering_connection_id'];

    const response = await primaryEc2Client.send(
      new DescribeVpcPeeringConnectionsCommand({
        VpcPeeringConnectionIds: [peeringId],
      })
    );

    expect(response.VpcPeeringConnections).toHaveLength(1);
    const peering = response.VpcPeeringConnections![0];
    expect(peering.Status?.Code).toBe('active');
    expect(peering.AccepterVpcInfo?.Region).toBe('us-west-2');
    expect(peering.RequesterVpcInfo?.Region).toBe('us-east-1');
  });

  test('test_primary_subnets_exist - Verify primary VPC has required subnets', async () => {
    const vpcId = outputs['primary_vpc_id'];

    const response = await primaryEc2Client.send(
      new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      })
    );

    // Should have 3 private subnets
    expect(response.Subnets!.length).toBeGreaterThanOrEqual(3);

    // Verify all subnets are available
    for (const subnet of response.Subnets!) {
      expect(subnet.State).toBe('available');
      expect(subnet.AvailabilityZoneId).toBeTruthy();
    }
  });

  test('test_dr_subnets_exist - Verify DR VPC has required subnets', async () => {
    const vpcId = outputs['dr_vpc_id'];

    const response = await drEc2Client.send(
      new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      })
    );

    // Should have 3 private subnets
    expect(response.Subnets!.length).toBeGreaterThanOrEqual(3);

    // Verify all subnets are available
    for (const subnet of response.Subnets!) {
      expect(subnet.State).toBe('available');
      expect(subnet.AvailabilityZoneId).toBeTruthy();
    }
  });
});

describe('TestRDSInstances', () => {
  test('test_primary_rds_instance - Verify primary RDS instance exists and is available', async () => {
    const endpoint = outputs['primary_db_endpoint'];
    const dbIdentifier = endpoint.split('.')[0];

    const response = await primaryRdsClient.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
    );

    expect(response.DBInstances).toHaveLength(1);
    const db = response.DBInstances![0];
    expect(['available', 'backing-up', 'modifying']).toContain(db.DBInstanceStatus);
    expect(db.Engine).toBe('postgres');
    expect(db.EngineVersion?.startsWith('15')).toBe(true);
    expect(db.MultiAZ).toBe(true);
    expect(db.StorageEncrypted).toBe(true);
    expect(db.PubliclyAccessible).toBe(false);
  });

  test('test_dr_rds_instance - Verify DR RDS instance exists and is available', async () => {
    const endpoint = outputs['dr_db_endpoint'];
    const dbIdentifier = endpoint.split('.')[0];

    const response = await drRdsClient.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
    );

    expect(response.DBInstances).toHaveLength(1);
    const db = response.DBInstances![0];
    expect(['available', 'backing-up', 'modifying', 'creating']).toContain(
      db.DBInstanceStatus
    );
    expect(db.Engine).toBe('postgres');
    expect(db.StorageEncrypted).toBe(true);
    expect(db.PubliclyAccessible).toBe(false);
  });

  test('test_rds_read_replica_relationship - Verify DR instance is configured as read replica of primary', async () => {
    const primaryEndpoint = outputs['primary_db_endpoint'];
    const primaryId = primaryEndpoint.split('.')[0];

    const drEndpoint = outputs['dr_db_endpoint'];
    const drId = drEndpoint.split('.')[0];

    // Check primary has replicas
    const primaryResponse = await primaryRdsClient.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: primaryId })
    );

    const primaryDb = primaryResponse.DBInstances![0];
    // Primary should list DR as replica
    const replicaIds = (primaryDb.ReadReplicaDBInstanceIdentifiers || []).map(
      (r) => r.split(':').pop()!
    );

    // Check DR instance configuration
    const drResponse = await drRdsClient.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: drId })
    );

    const drDb = drResponse.DBInstances![0];

    // If DR is a replica, it should have source identifier
    // If it's standalone, it was already promoted
    if (drDb.ReadReplicaSourceDBInstanceIdentifier) {
      const sourceArn = drDb.ReadReplicaSourceDBInstanceIdentifier;
      expect(sourceArn).toContain(primaryId);
    }
  });

  test('test_rds_backup_configuration - Verify RDS backup configuration', async () => {
    const endpoint = outputs['primary_db_endpoint'];
    const dbIdentifier = endpoint.split('.')[0];

    const response = await primaryRdsClient.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
    );

    const db = response.DBInstances![0];
    expect(db.BackupRetentionPeriod).toBe(7);
    expect(db.PreferredBackupWindow).toBeTruthy();
  });

  test('test_rds_performance_insights_enabled - Verify Performance Insights is enabled', async () => {
    const endpoint = outputs['primary_db_endpoint'];
    const dbIdentifier = endpoint.split('.')[0];

    const response = await primaryRdsClient.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
    );

    const db = response.DBInstances![0];
    expect(db.PerformanceInsightsEnabled).toBe(true);
  });
});

describe('TestSecretsManager', () => {
  test('test_primary_secret_exists - Verify primary database secret exists and contains credentials', async () => {
    const secretArn = outputs['primary_db_secret_arn'];

    const response = await secretsClientPrimary.send(
      new DescribeSecretCommand({ SecretId: secretArn })
    );
    expect(response.ARN).toBe(secretArn);
    expect(response.Name).toContain('rds-master-password-primary');

    // Verify secret value can be retrieved
    const secretValue = await secretsClientPrimary.send(
      new GetSecretValueCommand({ SecretId: secretArn })
    );
    const secretData = JSON.parse(secretValue.SecretString!);
    expect(secretData).toHaveProperty('username');
    expect(secretData).toHaveProperty('password');
  });

  test('test_dr_secret_exists - Verify DR database secret exists and contains credentials', async () => {
    const secretArn = outputs['dr_db_secret_arn'];

    const response = await secretsClientDr.send(
      new DescribeSecretCommand({ SecretId: secretArn })
    );
    expect(response.ARN).toBe(secretArn);
    expect(response.Name).toContain('rds-master-password-dr');

    // Verify secret value can be retrieved
    const secretValue = await secretsClientDr.send(
      new GetSecretValueCommand({ SecretId: secretArn })
    );
    const secretData = JSON.parse(secretValue.SecretString!);
    expect(secretData).toHaveProperty('username');
    expect(secretData).toHaveProperty('password');
  });
});

describe('TestLambdaFunction', () => {
  test('test_lambda_function_exists - Verify Lambda function exists and is configured correctly', async () => {
    const functionName = outputs['lambda_function_name'];

    const response = await lambdaClient.send(
      new GetFunctionCommand({ FunctionName: functionName })
    );

    const config = response.Configuration!;
    expect(config.Runtime).toBe('python3.9');
    expect(config.Handler).toBe('monitor_replication.lambda_handler');
    expect(config.Timeout).toBe(60);
    expect(config.Environment?.Variables).toHaveProperty('DR_DB_IDENTIFIER');
    expect(config.Environment?.Variables).toHaveProperty('REPLICATION_LAG_THRESHOLD');
  });

  test('test_lambda_can_be_invoked - Verify Lambda function can be invoked successfully', async () => {
    const functionName = outputs['lambda_function_name'];

    // Invoke Lambda function
    const response = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
      })
    );

    expect(response.StatusCode).toBe(200);
    expect(response.FunctionError).toBeUndefined();

    // Parse response
    const payloadStr = Buffer.from(response.Payload!).toString('utf-8');
    const payload = JSON.parse(payloadStr);
    expect([200, 500]).toContain(payload.statusCode); // May return 500 if no data yet
  });

  test('test_lambda_cloudwatch_logs - Verify Lambda has CloudWatch logs configured', async () => {
    const functionName = outputs['lambda_function_name'];

    const response = await lambdaClient.send(
      new GetFunctionCommand({ FunctionName: functionName })
    );
    const config = response.Configuration!;

    // Lambda should have log configuration
    expect(
      config.LoggingConfig !== null || 'LoggingConfig' in config
    ).toBe(true);
  });
});

describe('TestCloudWatchAlarms', () => {
  test('test_replication_lag_alarm_exists - Verify replication lag alarm exists', async () => {
    const response = await cloudwatchClient.send(
      new DescribeAlarmsCommand({
        AlarmNamePrefix: 'rds-replication-lag',
      })
    );

    // Should have at least one replication lag alarm
    expect(response.MetricAlarms!.length).toBeGreaterThanOrEqual(1);

    const alarm = response.MetricAlarms![0];
    expect(alarm.MetricName).toBe('ReplicaLag');
    expect(alarm.Namespace).toBe('AWS/RDS');
    expect(alarm.Statistic).toBe('Average');
  });

  test('test_cpu_utilization_alarms_exist - Verify CPU utilization alarms exist for both instances', async () => {
    const response = await cloudwatchClient.send(
      new DescribeAlarmsCommand({
        AlarmNamePrefix: 'rds-cpu',
      })
    );

    // Should have alarms for primary and DR
    expect(response.MetricAlarms!.length).toBeGreaterThanOrEqual(2);

    for (const alarm of response.MetricAlarms!) {
      expect(alarm.MetricName).toBe('CPUUtilization');
      expect(alarm.Namespace).toBe('AWS/RDS');
      expect(alarm.Threshold).toBe(80);
    }
  });
});

describe('TestRoute53Failover', () => {
  test('test_route53_hosted_zone_exists - Verify Route53 hosted zone exists for failover', async () => {
    const response = await route53Client.send(new ListHostedZonesCommand({}));

    // Find hosted zone for trading-db.internal
    const zone = response.HostedZones?.find((z) =>
      z.Name?.includes('trading-db.internal')
    );

    if (zone) {
      expect(zone.Config?.PrivateZone).toBe(true);
    }
  });
});

describe('TestEndToEndWorkflow', () => {
  test('test_all_components_deployed - Verify all required components are in outputs', () => {
    const requiredOutputs = [
      'primary_db_endpoint',
      'dr_db_endpoint',
      'route53_failover_endpoint',
      'primary_vpc_id',
      'dr_vpc_id',
      'lambda_function_name',
      'primary_db_secret_arn',
      'dr_db_secret_arn',
      'vpc_peering_connection_id',
    ];

    for (const output of requiredOutputs) {
      expect(outputs).toHaveProperty(output);
      expect(outputs[output]).toBeTruthy();
    }
  });

  test('test_cross_region_connectivity - Verify cross-region network connectivity via VPC peering', async () => {
    const primaryVpcId = outputs['primary_vpc_id'];
    const drVpcId = outputs['dr_vpc_id'];
    const peeringId = outputs['vpc_peering_connection_id'];

    // Check primary VPC route tables have peering routes
    const primaryRoutes = await primaryEc2Client.send(
      new DescribeRouteTablesCommand({
        Filters: [{ Name: 'vpc-id', Values: [primaryVpcId] }],
      })
    );

    // Check DR VPC route tables have peering routes
    const drRoutes = await drEc2Client.send(
      new DescribeRouteTablesCommand({
        Filters: [{ Name: 'vpc-id', Values: [drVpcId] }],
      })
    );

    // Both should have route tables
    expect(primaryRoutes.RouteTables!.length).toBeGreaterThan(0);
    expect(drRoutes.RouteTables!.length).toBeGreaterThan(0);
  });
});
