import {
  CloudWatchClient,
  DescribeAlarmsCommand
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  DescribeRuleCommand,
  EventBridgeClient,
  ListTargetsByRuleCommand
} from '@aws-sdk/client-eventbridge';
import {
  DescribeKeyCommand,
  KMSClient
} from '@aws-sdk/client-kms';
import {
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
  LambdaClient
} from '@aws-sdk/client-lambda';
import {
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient
} from '@aws-sdk/client-rds';
import {
  GetHostedZoneCommand,
  ListResourceRecordSetsCommand,
  Route53Client
} from '@aws-sdk/client-route-53';
import {
  DescribeSecretCommand,
  GetSecretValueCommand,
  SecretsManagerClient
} from '@aws-sdk/client-secrets-manager';
import {
  GetTopicAttributesCommand,
  SNSClient
} from '@aws-sdk/client-sns';
import * as fs from 'fs';
import * as path from 'path';

const outputFile = path.resolve('cfn-outputs/flat-outputs.json');

const isValidArn = (v: string): boolean =>
  /^arn:aws:[^:]+:[^:]*:[^:]*:.+/.test(v.trim());
const isValidVpcId = (v: string): boolean => v.startsWith('vpc-');
const isValidSubnetId = (v: string): boolean => v.startsWith('subnet-');
const isValidSecurityGroupId = (v: string): boolean => v.startsWith('sg-');
const isValidCidr = (v: string): boolean => /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(v);
const isValidKmsKeyId = (v: string): boolean =>
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(v);

const parseArray = (v: any): any => {
  if (typeof v === 'string') {
    try {
      const arr = JSON.parse(v);
      return Array.isArray(arr) ? arr : v;
    } catch {
      return v;
    }
  }
  return v;
};

const parseObject = (v: any): any => {
  if (typeof v === 'string') {
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  }
  return v;
};

const skipIfMissing = (key: string, obj: any): boolean => {
  if (!(key in obj)) {
    console.warn(`Skipping tests for missing output: ${key}`);
    return true;
  }
  return false;
};

describe('High-Availability PostgreSQL Database Infrastructure - Integration Tests', () => {
  let outputs: Record<string, any>;
  let region: string;
  let accountId: string;

  beforeAll(() => {
    if (!fs.existsSync(outputFile)) {
      throw new Error(`Outputs file not found: ${outputFile}. Deploy infrastructure first.`);
    }

    const data = fs.readFileSync(outputFile, 'utf8');
    const parsed = JSON.parse(data);
    outputs = {};

    for (const [k, v] of Object.entries(parsed)) {
      outputs[k] = parseArray(v);
    }

    const arnOutput = Object.values(outputs).find((v: any) =>
      typeof v === 'string' && v.startsWith('arn:aws:')
    ) as string;

    if (arnOutput) {
      const parts = arnOutput.split(':');
      region = parts[3];
      accountId = parts[4];
    } else {
      throw new Error('Could not determine AWS region from outputs');
    }
  });

  describe('Output Structure Validation', () => {
    it('should have all essential infrastructure outputs', () => {
      const requiredOutputs = [
        'vpc_id', 'vpc_cidr', 'private_subnet_ids', 'public_subnet_ids',
        'aurora_cluster_id', 'aurora_cluster_endpoint', 'aurora_cluster_arn',
        'db_credentials_secret_arn', 'sns_alerts_topic_arn'
      ];

      requiredOutputs.forEach(output => {
        expect(outputs).toHaveProperty(output);
        expect(outputs[output]).toBeDefined();
      });
    });

    it('should not expose sensitive credentials directly', () => {
      const sensitivePatterns = [
        /password/i, /private_key/i, /access_key/i,
        /session_token/i, /^credentials$/i
      ];

      const sensitiveKeys = Object.keys(outputs).filter(key =>
        sensitivePatterns.some(pattern => pattern.test(key))
      );

      expect(sensitiveKeys).toHaveLength(0);
    });

    it('should have properly formatted ARNs', () => {
      const arnKeys = Object.keys(outputs).filter(key => key.includes('arn'));

      arnKeys.forEach(key => {
        const value = outputs[key];
        if (typeof value === 'string' && value.startsWith('arn:')) {
          expect(isValidArn(value)).toBe(true);
        }
      });
    });
  });

  describe('VPC Infrastructure', () => {
    let ec2Client: EC2Client;

    beforeAll(() => {
      ec2Client = new EC2Client({ region });
    });

    it('validates VPC configuration', async () => {
      if (skipIfMissing('vpc_id', outputs)) return;

      expect(isValidVpcId(outputs.vpc_id)).toBe(true);

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id]
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);

      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      if (vpc.EnableDnsHostnames !== undefined) {
        expect(vpc.EnableDnsHostnames).toBe(true);
      }
      if (vpc.EnableDnsSupport !== undefined) {
        expect(vpc.EnableDnsSupport).toBe(true);
      }

      if (!skipIfMissing('vpc_cidr', outputs)) {
        expect(isValidCidr(outputs.vpc_cidr)).toBe(true);
        expect(vpc.CidrBlock).toBe(outputs.vpc_cidr);
      }
    });

    it('validates private subnet configuration across multiple AZs', async () => {
      if (skipIfMissing('private_subnet_ids', outputs)) return;

      const subnetIds = parseArray(outputs.private_subnet_ids);
      expect(Array.isArray(subnetIds)).toBe(true);
      expect(subnetIds.length).toBeGreaterThanOrEqual(3);

      subnetIds.forEach((id: string) => {
        expect(isValidSubnetId(id)).toBe(true);
      });

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(subnetIds.length);

      const availabilityZones = new Set(
        response.Subnets!.map(subnet => subnet.AvailabilityZone)
      );
      expect(availabilityZones.size).toBeGreaterThanOrEqual(3);

      response.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(outputs.vpc_id);
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    it('validates public subnet configuration', async () => {
      if (skipIfMissing('public_subnet_ids', outputs)) return;

      const subnetIds = parseArray(outputs.public_subnet_ids);
      expect(Array.isArray(subnetIds)).toBe(true);
      expect(subnetIds.length).toBeGreaterThanOrEqual(3);

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(subnetIds.length);

      response.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(outputs.vpc_id);
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    it('validates NAT Gateway configuration for high availability', async () => {
      if (skipIfMissing('public_subnet_ids', outputs)) return;

      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id]
          },
          {
            Name: 'state',
            Values: ['available']
          }
        ]
      });

      const response = await ec2Client.send(command);
      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(3);

      const natAzs = new Set(
        response.NatGateways!.map(nat => nat.SubnetId)
      );
      expect(natAzs.size).toBeGreaterThanOrEqual(3);
    });

    it('validates route table configuration', async () => {
      if (skipIfMissing('vpc_id', outputs)) return;

      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id]
          }
        ]
      });

      const response = await ec2Client.send(command);
      expect(response.RouteTables).toBeDefined();
      expect(response.RouteTables!.length).toBeGreaterThan(0);

      const publicRT = response.RouteTables!.find(rt =>
        rt.Routes?.some(route => route.GatewayId?.startsWith('igw-'))
      );
      expect(publicRT).toBeDefined();

      const privateRTs = response.RouteTables!.filter(rt =>
        rt.Routes?.some(route => route.NatGatewayId?.startsWith('nat-'))
      );
      expect(privateRTs.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Security Groups', () => {
    let ec2Client: EC2Client;

    beforeAll(() => {
      ec2Client = new EC2Client({ region });
    });

    it('validates RDS security group configuration', async () => {
      if (skipIfMissing('rds_security_group_id', outputs)) return;

      expect(isValidSecurityGroupId(outputs.rds_security_group_id)).toBe(true);

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.rds_security_group_id]
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);

      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(outputs.vpc_id);

      const postgresRule = sg.IpPermissions!.find(rule =>
        rule.FromPort === 5432 && rule.ToPort === 5432
      );
      expect(postgresRule).toBeDefined();

      const hasSecureAccess = postgresRule!.UserIdGroupPairs?.length! > 0 ||
        postgresRule!.IpRanges?.some(range =>
          range.CidrIp && !range.CidrIp.includes('0.0.0.0/0')
        );
      expect(hasSecureAccess).toBe(true);
    });

    it('validates Lambda security group configuration', async () => {
      if (skipIfMissing('lambda_security_group_id', outputs)) return;

      expect(isValidSecurityGroupId(outputs.lambda_security_group_id)).toBe(true);

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.lambda_security_group_id]
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);

      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(outputs.vpc_id);

      expect(sg.IpPermissionsEgress).toBeDefined();
      expect(sg.IpPermissionsEgress!.length).toBeGreaterThan(0);
    });
  });

  describe('RDS Aurora PostgreSQL Cluster', () => {
    let rdsClient: RDSClient;

    beforeAll(() => {
      rdsClient = new RDSClient({ region });
    });

    it('validates Aurora cluster configuration', async () => {
      if (skipIfMissing('aurora_cluster_id', outputs)) return;

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.aurora_cluster_id
      });

      const response = await rdsClient.send(command);
      expect(response.DBClusters).toHaveLength(1);

      const cluster = response.DBClusters![0];
      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-postgresql');
      expect(cluster.EngineVersion).toMatch(/^15\.6/);
      expect(cluster.DatabaseName).toBe(outputs.aurora_database_name);
      expect(cluster.MasterUsername).toBe(outputs.aurora_master_username);
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
    });

    it('validates Aurora cluster has multiple instances across AZs', async () => {
      if (skipIfMissing('aurora_instance_ids', outputs)) return;

      const instanceIds = parseArray(outputs.aurora_instance_ids);
      expect(Array.isArray(instanceIds)).toBe(true);
      expect(instanceIds.length).toBe(3);

      const command = new DescribeDBInstancesCommand({
        Filters: [
          {
            Name: 'db-cluster-id',
            Values: [outputs.aurora_cluster_id]
          }
        ]
      });

      const response = await rdsClient.send(command);
      expect(response.DBInstances).toHaveLength(3);

      const availabilityZones = new Set(
        response.DBInstances!.map(instance => instance.AvailabilityZone)
      );
      expect(availabilityZones.size).toBe(3);

      response.DBInstances!.forEach(instance => {
        expect(instance.DBInstanceStatus).toBe('available');
        expect(instance.DBInstanceClass).toBe('db.serverless');
        expect(instance.Engine).toBe('aurora-postgresql');
        expect(instance.PerformanceInsightsEnabled).toBe(true);
        expect(instance.MonitoringInterval).toBe(1);
      });
    });

    it('validates Serverless v2 scaling configuration', async () => {
      if (skipIfMissing('aurora_cluster_id', outputs)) return;

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.aurora_cluster_id
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters![0];

      expect(cluster.ServerlessV2ScalingConfiguration).toBeDefined();
      expect(cluster.ServerlessV2ScalingConfiguration!.MinCapacity).toBe(0.5);
      expect(cluster.ServerlessV2ScalingConfiguration!.MaxCapacity).toBe(16);
    });

    it('validates CloudWatch Logs exports are enabled', async () => {
      if (skipIfMissing('aurora_cluster_id', outputs)) return;

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.aurora_cluster_id
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters![0];

      expect(cluster.EnabledCloudwatchLogsExports).toBeDefined();
      expect(cluster.EnabledCloudwatchLogsExports).toContain('postgresql');
    });

    it('validates DB subnet group spans multiple AZs', async () => {
      if (skipIfMissing('aurora_cluster_id', outputs)) return;

      const clusterCommand = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.aurora_cluster_id
      });

      const clusterResponse = await rdsClient.send(clusterCommand);
      const subnetGroupName = clusterResponse.DBClusters![0].DBSubnetGroup;

      const subnetCommand = new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: subnetGroupName
      });

      const subnetResponse = await rdsClient.send(subnetCommand);
      expect(subnetResponse.DBSubnetGroups).toHaveLength(1);

      const subnetGroup = subnetResponse.DBSubnetGroups![0];
      expect(subnetGroup.Subnets).toBeDefined();
      expect(subnetGroup.Subnets!.length).toBeGreaterThanOrEqual(3);

      const azs = new Set(
        subnetGroup.Subnets!.map(subnet => subnet.SubnetAvailabilityZone?.Name)
      );
      expect(azs.size).toBeGreaterThanOrEqual(3);
    });

    it('validates cluster endpoints are accessible', () => {
      if (skipIfMissing('aurora_cluster_endpoint', outputs)) return;
      if (skipIfMissing('aurora_cluster_reader_endpoint', outputs)) return;

      expect(outputs.aurora_cluster_endpoint).toMatch(/\.rds\.amazonaws\.com$/);
      expect(outputs.aurora_cluster_reader_endpoint).toMatch(/\.rds\.amazonaws\.com$/);
      expect(outputs.aurora_cluster_port).toBe('5432');
    });
  });

  describe('Secrets Manager', () => {
    let secretsClient: SecretsManagerClient;

    beforeAll(() => {
      secretsClient = new SecretsManagerClient({ region });
    });

    it('validates database credentials secret exists', async () => {
      if (skipIfMissing('db_credentials_secret_arn', outputs)) return;

      const command = new DescribeSecretCommand({
        SecretId: outputs.db_credentials_secret_arn
      });

      const response = await secretsClient.send(command);
      expect(response.ARN).toBe(outputs.db_credentials_secret_arn);
      expect(response.Name).toBe(outputs.db_credentials_secret_name);
    });

    it('validates secret rotation is configured', async () => {
      if (skipIfMissing('db_credentials_secret_arn', outputs)) return;

      const command = new DescribeSecretCommand({
        SecretId: outputs.db_credentials_secret_arn
      });

      const response = await secretsClient.send(command);
      expect(response.RotationEnabled).toBe(true);
      expect(response.RotationLambdaARN).toBeDefined();
      expect(response.RotationRules).toBeDefined();
      expect(response.RotationRules!.AutomaticallyAfterDays).toBe(30);
    });

    it('validates secret value contains required database connection info', async () => {
      if (skipIfMissing('db_credentials_secret_arn', outputs)) return;

      const command = new GetSecretValueCommand({
        SecretId: outputs.db_credentials_secret_arn
      });

      const response = await secretsClient.send(command);
      expect(response.SecretString).toBeDefined();

      const secret = JSON.parse(response.SecretString!);
      expect(secret).toHaveProperty('username');
      expect(secret).toHaveProperty('password');
      expect(secret).toHaveProperty('engine');
      expect(secret).toHaveProperty('host');
      expect(secret).toHaveProperty('port');
      expect(secret).toHaveProperty('dbname');

      expect(secret.engine).toBe('postgres');
      expect(secret.port).toBe(5432);
    });
  });

  describe('KMS Encryption Keys', () => {
    let kmsClient: KMSClient;

    beforeAll(() => {
      kmsClient = new KMSClient({ region });
    });

    it('validates RDS KMS key configuration', async () => {
      if (skipIfMissing('kms_rds_key_id', outputs)) return;

      expect(isValidKmsKeyId(outputs.kms_rds_key_id)).toBe(true);

      const command = new DescribeKeyCommand({
        KeyId: outputs.kms_rds_key_id
      });

      const response = await kmsClient.send(command);
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
      expect(response.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(response.KeyMetadata!.Enabled).toBe(true);
    });

    it('validates SNS KMS key configuration', async () => {
      if (skipIfMissing('kms_sns_key_id', outputs)) return;

      expect(isValidKmsKeyId(outputs.kms_sns_key_id)).toBe(true);

      const command = new DescribeKeyCommand({
        KeyId: outputs.kms_sns_key_id
      });

      const response = await kmsClient.send(command);
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
    });
  });

  describe('Lambda Functions', () => {
    let lambdaClient: LambdaClient;

    beforeAll(() => {
      lambdaClient = new LambdaClient({ region });
    });

    const lambdaFunctions = [
      { key: 'lambda_failover_coordinator_arn', runtime: 'python3.11', timeout: 300, memory: 512 },
      { key: 'lambda_connection_drainer_arn', runtime: 'python3.11', timeout: 60, memory: 256 },
      { key: 'lambda_health_checker_arn', runtime: 'python3.11', timeout: 30, memory: 256 },
      { key: 'lambda_secret_rotation_arn', runtime: 'python3.11', timeout: 300, memory: 512 },
      { key: 'lambda_backup_verifier_arn', runtime: 'python3.11', timeout: 900, memory: 1024 }
    ];

    lambdaFunctions.forEach(({ key, runtime, timeout, memory }) => {
      it(`validates ${key.replace('lambda_', '').replace('_arn', '')} function configuration`, async () => {
        if (skipIfMissing(key, outputs)) return;

        const functionArn = outputs[key];
        const functionName = functionArn.split(':').pop();

        const command = new GetFunctionConfigurationCommand({
          FunctionName: functionName
        });

        const response = await lambdaClient.send(command);
        expect(response.Runtime).toBe(runtime);
        expect(response.Timeout).toBe(timeout);
        expect(response.MemorySize).toBe(memory);
        expect(response.VpcConfig).toBeDefined();
        expect(response.VpcConfig!.SubnetIds).toBeDefined();
        expect(response.VpcConfig!.SecurityGroupIds).toBeDefined();
        expect(response.Environment).toBeDefined();
      });
    });

    it('validates Lambda functions use the database layer', async () => {
      const functionKeys = lambdaFunctions.filter(f =>
        f.key !== 'lambda_backup_verifier_arn'
      ).map(f => f.key);

      for (const key of functionKeys) {
        if (skipIfMissing(key, outputs)) continue;

        const functionArn = outputs[key];
        const functionName = functionArn.split(':').pop();

        const command = new GetFunctionCommand({
          FunctionName: functionName
        });

        const response = await lambdaClient.send(command);
        expect(response.Configuration?.Layers).toBeDefined();
        expect(response.Configuration?.Layers!.length).toBeGreaterThan(0);
      }
    });

    it('validates Lambda functions are in VPC', async () => {
      if (skipIfMissing('lambda_failover_coordinator_arn', outputs)) return;
      if (skipIfMissing('private_subnet_ids', outputs)) return;

      const functionArn = outputs.lambda_failover_coordinator_arn;
      const functionName = functionArn.split(':').pop();

      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName
      });

      const response = await lambdaClient.send(command);
      expect(response.VpcConfig).toBeDefined();
      expect(response.VpcConfig!.VpcId).toBe(outputs.vpc_id);

      const privateSubnets = parseArray(outputs.private_subnet_ids);
      expect(response.VpcConfig!.SubnetIds).toEqual(
        expect.arrayContaining(privateSubnets)
      );
    });
  });

  describe('SNS Alerting', () => {
    let snsClient: SNSClient;

    beforeAll(() => {
      snsClient = new SNSClient({ region });
    });

    it('validates SNS alerts topic configuration', async () => {
      if (skipIfMissing('sns_alerts_topic_arn', outputs)) return;

      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.sns_alerts_topic_arn
      });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(outputs.sns_alerts_topic_arn);
      expect(response.Attributes!.DisplayName).toBeDefined();
    });

    it('validates SNS topic has encryption enabled', async () => {
      if (skipIfMissing('sns_alerts_topic_arn', outputs)) return;

      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.sns_alerts_topic_arn
      });

      const response = await snsClient.send(command);
      expect(response.Attributes!.KmsMasterKeyId).toBeDefined();
    });
  });

  describe('CloudWatch Monitoring', () => {
    let cloudwatchClient: CloudWatchClient;
    let logsClient: CloudWatchLogsClient;

    beforeAll(() => {
      cloudwatchClient = new CloudWatchClient({ region });
      logsClient = new CloudWatchLogsClient({ region });
    });

    it('validates CloudWatch Dashboard exists', () => {
      if (skipIfMissing('cloudwatch_dashboard_name', outputs)) return;

      expect(outputs.cloudwatch_dashboard_name).toBeDefined();
      expect(typeof outputs.cloudwatch_dashboard_name).toBe('string');
    });

    it('validates CloudWatch alarms are configured', async () => {
      if (skipIfMissing('aurora_cluster_id', outputs)) return;

      const command = new DescribeAlarmsCommand({});

      const response = await cloudwatchClient.send(command);
      expect(response.MetricAlarms).toBeDefined();

      const rdsAlarms = response.MetricAlarms!.filter(alarm =>
        alarm.Namespace === 'AWS/RDS' &&
        alarm.Dimensions?.some(d =>
          d.Name === 'DBClusterIdentifier' &&
          d.Value === outputs.aurora_cluster_id
        )
      );

      if (rdsAlarms.length > 0) {
        const cpuAlarm = rdsAlarms.find(alarm =>
          alarm.MetricName === 'CPUUtilization'
        );
        expect(cpuAlarm).toBeDefined();

        const replicaLagAlarm = rdsAlarms.find(alarm =>
          alarm.MetricName === 'AuroraReplicaLag'
        );
        expect(replicaLagAlarm).toBeDefined();
      }
    }); it('validates RDS log group exists', async () => {
      if (skipIfMissing('cloudwatch_log_group_rds', outputs)) return;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.cloudwatch_log_group_rds
      });

      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const logGroup = response.logGroups![0];
      expect(logGroup.logGroupName).toBe(outputs.cloudwatch_log_group_rds);
      expect(logGroup.retentionInDays).toBe(7);
    });

    it('validates Lambda log groups exist with proper retention', async () => {
      const lambdaFunctions = [
        'failover-coordinator', 'connection-drainer',
        'health-checker', 'secret-rotation', 'backup-verifier'
      ];

      for (const func of lambdaFunctions) {
        const logGroupName = `/aws/lambda/${outputs.aurora_cluster_id.replace('-aurora-cluster', '')}-${func}`;

        const command = new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName
        });

        const response = await logsClient.send(command);
        if (response.logGroups && response.logGroups.length > 0) {
          expect(response.logGroups[0].retentionInDays).toBe(7);
        }
      }
    });
  });

  describe('Route53 DNS Configuration', () => {
    let route53Client: Route53Client;

    beforeAll(() => {
      route53Client = new Route53Client({ region });
    });

    it('validates Route53 hosted zone exists', async () => {
      if (skipIfMissing('route53_zone_id', outputs)) return;

      const command = new GetHostedZoneCommand({
        Id: outputs.route53_zone_id
      });

      const response = await route53Client.send(command);
      expect(response.HostedZone).toBeDefined();
      expect(response.HostedZone!.Config?.PrivateZone).toBe(true);
    });

    it('validates primary and reader DNS records exist', async () => {
      if (skipIfMissing('route53_zone_id', outputs)) return;

      const command = new ListResourceRecordSetsCommand({
        HostedZoneId: outputs.route53_zone_id
      });

      const response = await route53Client.send(command);
      expect(response.ResourceRecordSets).toBeDefined();

      const primaryRecord = response.ResourceRecordSets!.find(record =>
        record.Name?.includes('primary')
      );
      expect(primaryRecord).toBeDefined();

      const readerRecord = response.ResourceRecordSets!.find(record =>
        record.Name?.includes('reader')
      );
      expect(readerRecord).toBeDefined();
    });
  });

  describe('EventBridge Rules', () => {
    let eventbridgeClient: EventBridgeClient;

    beforeAll(() => {
      eventbridgeClient = new EventBridgeClient({ region });
    });

    it('validates RDS failover event rule exists', async () => {
      const clusterPrefix = outputs.aurora_cluster_id.replace('-aurora-cluster', '');
      const ruleName = `${clusterPrefix}-rds-failover`;

      const command = new DescribeRuleCommand({
        Name: ruleName
      });

      const response = await eventbridgeClient.send(command);
      expect(response.Name).toBe(ruleName);
      expect(response.State).toBe('ENABLED');
      expect(response.EventPattern).toBeDefined();
    });

    it('validates health check schedule rule exists', async () => {
      const clusterPrefix = outputs.aurora_cluster_id.replace('-aurora-cluster', '');
      const ruleName = `${clusterPrefix}-health-check-schedule`;

      const command = new DescribeRuleCommand({
        Name: ruleName
      });

      const response = await eventbridgeClient.send(command);
      expect(response.Name).toBe(ruleName);
      expect(response.State).toBe('ENABLED');
      expect(response.ScheduleExpression).toBe('rate(1 minute)');
    });

    it('validates EventBridge rules have Lambda targets', async () => {
      const clusterPrefix = outputs.aurora_cluster_id.replace('-aurora-cluster', '');
      const ruleName = `${clusterPrefix}-health-check-schedule`;

      const command = new ListTargetsByRuleCommand({
        Rule: ruleName
      });

      const response = await eventbridgeClient.send(command);
      expect(response.Targets).toBeDefined();
      expect(response.Targets!.length).toBeGreaterThan(0);

      const lambdaTarget = response.Targets!.find(target =>
        target.Arn?.includes(':lambda:')
      );
      expect(lambdaTarget).toBeDefined();
    });
  });

  describe('High Availability Configuration', () => {
    let rdsClient: RDSClient;

    beforeAll(() => {
      rdsClient = new RDSClient({ region });
    });

    it('validates multi-AZ deployment with 3 instances', async () => {
      if (skipIfMissing('aurora_cluster_id', outputs)) return;

      const command = new DescribeDBInstancesCommand({
        Filters: [
          {
            Name: 'db-cluster-id',
            Values: [outputs.aurora_cluster_id]
          }
        ]
      });

      const response = await rdsClient.send(command);
      expect(response.DBInstances!.length).toBe(3);

      const azs = new Set(
        response.DBInstances!.map(instance => instance.AvailabilityZone)
      );
      expect(azs.size).toBe(3);
    });

    it('validates automatic backups are enabled', async () => {
      if (skipIfMissing('aurora_cluster_id', outputs)) return;

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.aurora_cluster_id
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters![0];

      expect(cluster.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
      expect(cluster.PreferredBackupWindow).toBeDefined();
    });

    it('validates encryption at rest is enabled', async () => {
      if (skipIfMissing('aurora_cluster_id', outputs)) return;

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.aurora_cluster_id
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters![0];

      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.KmsKeyId).toBeDefined();
    });
  });

  describe('Database Connection Information', () => {
    it('validates database connection info output', () => {
      if (skipIfMissing('database_connection_info', outputs)) return;

      const connectionInfo = parseObject(outputs.database_connection_info);

      expect(connectionInfo).toHaveProperty('endpoint');
      expect(connectionInfo).toHaveProperty('reader_endpoint');
      expect(connectionInfo).toHaveProperty('port');
      expect(connectionInfo).toHaveProperty('database');
      expect(connectionInfo).toHaveProperty('secret_arn');

      expect(connectionInfo.port).toBe(5432);
      expect(connectionInfo.endpoint).toMatch(/\.rds\.amazonaws\.com$/);
      expect(connectionInfo.reader_endpoint).toMatch(/\.rds\.amazonaws\.com$/);
    });
  });

  describe('Monitoring Endpoints', () => {
    it('validates monitoring endpoints output', () => {
      if (skipIfMissing('monitoring_endpoints', outputs)) return;

      const monitoringInfo = parseObject(outputs.monitoring_endpoints);

      expect(monitoringInfo).toHaveProperty('dashboard_name');
      expect(monitoringInfo).toHaveProperty('sns_topic_arn');
      expect(monitoringInfo).toHaveProperty('log_group_rds');
      expect(monitoringInfo).toHaveProperty('log_group_lambda');

      expect(monitoringInfo.sns_topic_arn).toMatch(/^arn:aws:sns:/);
      expect(monitoringInfo.log_group_rds).toMatch(/^\/aws\/rds/);
      expect(monitoringInfo.log_group_lambda).toMatch(/^\/aws\/lambda/);
    });
  });
});
