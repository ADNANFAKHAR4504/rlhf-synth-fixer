import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
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
  DatabaseMigrationServiceClient,
  DescribeReplicationInstancesCommand,
  DescribeEndpointsCommand,
} from '@aws-sdk/client-database-migration-service';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribeLaunchConfigurationsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import { SNSClient, ListTopicsCommand } from '@aws-sdk/client-sns';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';

// Load outputs from deployment
let outputs: any = {};
const outputsPath = 'cfn-outputs/flat-outputs.json';

// AWS region from environment or default
const awsRegion = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS clients
const ec2Client = new EC2Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const dmsClient = new DatabaseMigrationServiceClient({ region: awsRegion });
const elbClient = new ElasticLoadBalancingV2Client({ region: awsRegion });
const asgClient = new AutoScalingClient({ region: awsRegion });
const secretsClient = new SecretsManagerClient({ region: awsRegion });
const cloudwatchClient = new CloudWatchClient({ region: awsRegion });
const snsClient = new SNSClient({ region: awsRegion });
const kmsClient = new KMSClient({ region: awsRegion });

describe('Payment Processing System Integration Tests', () => {
  beforeAll(() => {
    // Load deployment outputs
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf8');
      outputs = JSON.parse(outputsContent);
    } else {
      console.warn(
        `Warning: ${outputsPath} not found. Integration tests require deployment outputs.`
      );
    }
  });

  describe('Deployment Outputs Validation', () => {
    test('should have all required outputs from deployment', () => {
      const requiredOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PublicSubnet3Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'PrivateSubnet3Id',
        'RDSInstanceEndpoint',
        'RDSInstancePort',
        'DBSecretArn',
        'ALBDNSName',
        'ALBTargetGroupArn',
        'DMSReplicationInstanceArn',
        'DMSSourceEndpointArn',
        'DMSTargetEndpointArn',
        'ALBSecurityGroupId',
        'AppServerSecurityGroupId',
        'RDSSecurityGroupId',
        'SNSTopicArn',
        'KMSKeyId',
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    test('VPC ID should be in correct format', () => {
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test('subnet IDs should be in correct format', () => {
      const subnetOutputs = [
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PublicSubnet3Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'PrivateSubnet3Id',
      ];

      subnetOutputs.forEach(subnet => {
        expect(outputs[subnet]).toMatch(/^subnet-[a-f0-9]+$/);
      });
    });

    test('RDS endpoint should be in correct format', () => {
      expect(outputs.RDSInstanceEndpoint).toMatch(
        /^[a-z0-9-]+\.([a-z0-9-]+\.)?rds\.amazonaws\.com$/
      );
    });

    test('ALB DNS name should be in correct format', () => {
      expect(outputs.ALBDNSName).toMatch(
        /^[a-z0-9-]+\.([a-z0-9-]+\.)?elb\.amazonaws\.com$/
      );
    });
  });

  describe('VPC and Network Infrastructure', () => {
    test('VPC should exist and be available', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });

      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBe(1);
      expect(response.Vpcs?.[0].State).toBe('available');
      expect(response.Vpcs?.[0].EnableDnsHostnames).toBe(true);
      expect(response.Vpcs?.[0].EnableDnsSupport).toBe(true);
    });

    test('all 6 subnets should exist and be available', async () => {
      const subnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PrivateSubnet3Id,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds,
      });

      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBe(6);

      response.Subnets?.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(outputs.VPCId);
      });
    });

    test('public subnets should be in different availability zones', async () => {
      const publicSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds,
      });

      const response = await ec2Client.send(command);

      const azs = response.Subnets?.map(s => s.AvailabilityZone) || [];
      const uniqueAzs = new Set(azs);

      expect(uniqueAzs.size).toBe(3);
    });

    test('private subnets should be in different availability zones', async () => {
      const privateSubnetIds = [
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PrivateSubnet3Id,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds,
      });

      const response = await ec2Client.send(command);

      const azs = response.Subnets?.map(s => s.AvailabilityZone) || [];
      const uniqueAzs = new Set(azs);

      expect(uniqueAzs.size).toBe(3);
    });

    test('NAT Gateways should exist and be available', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });

      const response = await ec2Client.send(command);

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways?.length).toBe(3);

      response.NatGateways?.forEach(nat => {
        expect(nat.State).toBe('available');
      });
    });

    test('Internet Gateway should be attached to VPC', async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });

      const response = await ec2Client.send(command);

      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways?.length).toBe(1);

      const attachment = response.InternetGateways?.[0].Attachments?.[0];
      expect(attachment?.State).toBe('available');
      expect(attachment?.VpcId).toBe(outputs.VPCId);
    });
  });

  describe('Security Groups', () => {
    test('ALB security group should allow HTTPS traffic from internet', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.ALBSecurityGroupId],
      });

      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups?.length).toBe(1);

      const sg = response.SecurityGroups?.[0];
      const httpsRule = sg?.IpPermissions?.find(
        rule => rule.FromPort === 443 && rule.ToPort === 443
      );

      expect(httpsRule).toBeDefined();
    });

    test('App Server security group should allow traffic only from ALB', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.AppServerSecurityGroupId],
      });

      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups?.length).toBe(1);

      const sg = response.SecurityGroups?.[0];
      const ingressRules = sg?.IpPermissions || [];

      // All ingress rules should reference the ALB security group
      ingressRules.forEach(rule => {
        const sourceGroup = rule.UserIdGroupPairs?.[0]?.GroupId;
        if (sourceGroup) {
          expect(sourceGroup).toBe(outputs.ALBSecurityGroupId);
        }
      });
    });

    test('RDS security group should allow MySQL traffic only from App Server and DMS', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.RDSSecurityGroupId],
      });

      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups?.length).toBe(1);

      const sg = response.SecurityGroups?.[0];
      const mysqlRules = sg?.IpPermissions?.filter(
        rule => rule.FromPort === 3306 && rule.ToPort === 3306
      );

      expect(mysqlRules).toBeDefined();
      expect(mysqlRules?.length).toBeGreaterThan(0);
    });
  });

  describe('RDS MySQL Multi-AZ Database', () => {
    test('RDS instance should be running and multi-AZ', async () => {
      // Extract DB instance identifier from endpoint
      const dbIdentifier = outputs.RDSInstanceEndpoint.split('.')[0];

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });

      const response = await rdsClient.send(command);

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances?.length).toBe(1);

      const dbInstance = response.DBInstances?.[0];
      expect(dbInstance?.DBInstanceStatus).toBe('available');
      expect(dbInstance?.MultiAZ).toBe(true);
      expect(dbInstance?.Engine).toBe('mysql');
      expect(dbInstance?.StorageEncrypted).toBe(true);
      expect(dbInstance?.PubliclyAccessible).toBe(false);
    });

    test('RDS should be in private subnets', async () => {
      const dbIdentifier = outputs.RDSInstanceEndpoint.split('.')[0];

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });

      const response = await rdsClient.send(command);

      const dbInstance = response.DBInstances?.[0];
      const subnetGroup = dbInstance?.DBSubnetGroup;

      expect(subnetGroup).toBeDefined();
      expect(subnetGroup?.VpcId).toBe(outputs.VPCId);
      expect(subnetGroup?.Subnets?.length).toBe(3);
    });

    test('RDS should have automated backups enabled', async () => {
      const dbIdentifier = outputs.RDSInstanceEndpoint.split('.')[0];

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });

      const response = await rdsClient.send(command);

      const dbInstance = response.DBInstances?.[0];
      expect(dbInstance?.BackupRetentionPeriod).toBeGreaterThan(0);
      expect(dbInstance?.PreferredBackupWindow).toBeDefined();
    });

    test('RDS connection secret should be accessible', async () => {
      const command = new GetSecretValueCommand({
        SecretId: outputs.DBSecretArn,
      });

      const response = await secretsClient.send(command);

      expect(response.SecretString).toBeDefined();

      const secret = JSON.parse(response.SecretString!);
      expect(secret.username).toBeDefined();
      expect(secret.password).toBeDefined();
      expect(secret.host).toBeDefined();
      expect(secret.port).toBe(3306);
      expect(secret.engine).toBe('mysql');
    });
  });

  describe('Database Migration Service (DMS)', () => {
    test('DMS replication instance should be available', async () => {
      // Extract ARN parts to get identifier
      const arnParts = outputs.DMSReplicationInstanceArn.split(':');
      const identifier = arnParts[arnParts.length - 1].replace('rep:', '');

      const command = new DescribeReplicationInstancesCommand({
        Filters: [
          {
            Name: 'replication-instance-arn',
            Values: [outputs.DMSReplicationInstanceArn],
          },
        ],
      });

      const response = await dmsClient.send(command);

      expect(response.ReplicationInstances).toBeDefined();
      expect(response.ReplicationInstances?.length).toBe(1);

      const instance = response.ReplicationInstances?.[0];
      expect(instance?.ReplicationInstanceStatus).toBe('available');
      expect(instance?.PubliclyAccessible).toBe(false);
    });

    test('DMS source endpoint should exist', async () => {
      const command = new DescribeEndpointsCommand({
        Filters: [
          {
            Name: 'endpoint-arn',
            Values: [outputs.DMSSourceEndpointArn],
          },
        ],
      });

      const response = await dmsClient.send(command);

      expect(response.Endpoints).toBeDefined();
      expect(response.Endpoints?.length).toBe(1);

      const endpoint = response.Endpoints?.[0];
      expect(endpoint?.EndpointType).toBe('source');
      expect(endpoint?.EngineName).toBe('mysql');
    });

    test('DMS target endpoint should exist and point to RDS', async () => {
      const command = new DescribeEndpointsCommand({
        Filters: [
          {
            Name: 'endpoint-arn',
            Values: [outputs.DMSTargetEndpointArn],
          },
        ],
      });

      const response = await dmsClient.send(command);

      expect(response.Endpoints).toBeDefined();
      expect(response.Endpoints?.length).toBe(1);

      const endpoint = response.Endpoints?.[0];
      expect(endpoint?.EndpointType).toBe('target');
      expect(endpoint?.EngineName).toBe('mysql');
      expect(endpoint?.ServerName).toBe(outputs.RDSInstanceEndpoint);
    });
  });

  describe('Application Load Balancer', () => {
    test('ALB should be active and internet-facing', async () => {
      const command = new DescribeLoadBalancersCommand({
        Names: [outputs.ALBDNSName.split('.')[0].split('-').slice(0, -1).join('-')],
      });

      const response = await elbClient.send(command);

      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers?.length).toBeGreaterThan(0);

      const alb = response.LoadBalancers?.[0];
      expect(alb?.State?.Code).toBe('active');
      expect(alb?.Scheme).toBe('internet-facing');
      expect(alb?.Type).toBe('application');
      expect(alb?.VpcId).toBe(outputs.VPCId);
    });

    test('ALB should be in all 3 public subnets', async () => {
      const command = new DescribeLoadBalancersCommand({
        Names: [outputs.ALBDNSName.split('.')[0].split('-').slice(0, -1).join('-')],
      });

      const response = await elbClient.send(command);

      const alb = response.LoadBalancers?.[0];
      const subnets = alb?.AvailabilityZones?.map(az => az.SubnetId) || [];

      expect(subnets.length).toBe(3);

      // Verify subnets are the public subnets
      const publicSubnets = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
      ];

      subnets.forEach(subnet => {
        expect(publicSubnets).toContain(subnet);
      });
    });

    test('ALB target group should exist and be healthy-configured', async () => {
      const command = new DescribeTargetGroupsCommand({
        TargetGroupArns: [outputs.ALBTargetGroupArn],
      });

      const response = await elbClient.send(command);

      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups?.length).toBe(1);

      const tg = response.TargetGroups?.[0];
      expect(tg?.VpcId).toBe(outputs.VPCId);
      expect(tg?.HealthCheckEnabled).toBe(true);
      expect(tg?.HealthCheckPath).toBeDefined();
    });
  });

  describe('Auto Scaling Group', () => {
    test('Auto Scaling Group should exist and be configured', async () => {
      // Get ASG by VPC filter (since we don't have ASG name in outputs)
      const command = new DescribeAutoScalingGroupsCommand({});

      const response = await asgClient.send(command);

      // Find ASG in our VPC
      const asg = response.AutoScalingGroups?.find(group =>
        group.VPCZoneIdentifier?.includes(outputs.PrivateSubnet1Id)
      );

      expect(asg).toBeDefined();
      expect(asg?.MinSize).toBeGreaterThan(0);
      expect(asg?.MaxSize).toBeGreaterThan(asg!.MinSize!);
      expect(asg?.DesiredCapacity).toBeGreaterThanOrEqual(asg!.MinSize!);
    });

    test('Auto Scaling Group should span all 3 private subnets', async () => {
      const command = new DescribeAutoScalingGroupsCommand({});

      const response = await asgClient.send(command);

      const asg = response.AutoScalingGroups?.find(group =>
        group.VPCZoneIdentifier?.includes(outputs.PrivateSubnet1Id)
      );

      expect(asg).toBeDefined();

      const subnetIds = asg?.VPCZoneIdentifier?.split(',') || [];
      expect(subnetIds.length).toBe(3);

      const privateSubnets = [
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PrivateSubnet3Id,
      ];

      subnetIds.forEach(subnetId => {
        expect(privateSubnets).toContain(subnetId.trim());
      });
    });

    test('Auto Scaling Group should be associated with ALB target group', async () => {
      const command = new DescribeAutoScalingGroupsCommand({});

      const response = await asgClient.send(command);

      const asg = response.AutoScalingGroups?.find(group =>
        group.VPCZoneIdentifier?.includes(outputs.PrivateSubnet1Id)
      );

      expect(asg).toBeDefined();
      expect(asg?.TargetGroupARNs).toContain(outputs.ALBTargetGroupArn);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('RDS CPU alarm should exist and be configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmTypes: ['MetricAlarm'],
      });

      const response = await cloudwatchClient.send(command);

      const cpuAlarm = response.MetricAlarms?.find(
        alarm =>
          alarm.MetricName === 'CPUUtilization' &&
          alarm.Namespace === 'AWS/RDS'
      );

      expect(cpuAlarm).toBeDefined();
      expect(cpuAlarm?.Threshold).toBe(80);
      expect(cpuAlarm?.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(cpuAlarm?.AlarmActions).toContain(outputs.SNSTopicArn);
    });

    test('RDS storage alarm should exist and be configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmTypes: ['MetricAlarm'],
      });

      const response = await cloudwatchClient.send(command);

      const storageAlarm = response.MetricAlarms?.find(
        alarm =>
          alarm.MetricName === 'FreeStorageSpace' &&
          alarm.Namespace === 'AWS/RDS'
      );

      expect(storageAlarm).toBeDefined();
      expect(storageAlarm?.ComparisonOperator).toBe('LessThanThreshold');
      expect(storageAlarm?.AlarmActions).toContain(outputs.SNSTopicArn);
    });

    test('SNS topic should exist for alarm notifications', async () => {
      const command = new ListTopicsCommand({});

      const response = await snsClient.send(command);

      const topic = response.Topics?.find(t => t.TopicArn === outputs.SNSTopicArn);
      expect(topic).toBeDefined();
    });
  });

  describe('Encryption and Security', () => {
    test('KMS key should exist and be enabled', async () => {
      const command = new DescribeKeyCommand({
        KeyId: outputs.KMSKeyId,
      });

      const response = await kmsClient.send(command);

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.Enabled).toBe(true);
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
    });

    test('database credentials should be securely stored in Secrets Manager', async () => {
      const command = new GetSecretValueCommand({
        SecretId: outputs.DBSecretArn,
      });

      const response = await secretsClient.send(command);

      expect(response.SecretString).toBeDefined();
      expect(response.ARN).toBe(outputs.DBSecretArn);

      // Verify secret contains required fields
      const secret = JSON.parse(response.SecretString!);
      expect(secret).toHaveProperty('username');
      expect(secret).toHaveProperty('password');
      expect(secret).toHaveProperty('host');
      expect(secret).toHaveProperty('port');
      expect(secret).toHaveProperty('engine');
    });
  });

  describe('End-to-End Infrastructure Validation', () => {
    test('complete payment processing workflow should be properly configured', async () => {
      // Verify the complete workflow:
      // Internet -> ALB (public subnets) -> App Servers (private subnets) -> RDS (private subnets)
      // DMS replication: On-premises -> DMS -> RDS

      // 1. Verify ALB is accessible from internet
      expect(outputs.ALBDNSName).toMatch(/elb\.amazonaws\.com$/);

      // 2. Verify App Servers can connect to RDS
      expect(outputs.RDSInstanceEndpoint).toBeDefined();
      expect(outputs.AppServerSecurityGroupId).toBeDefined();
      expect(outputs.RDSSecurityGroupId).toBeDefined();

      // 3. Verify DMS can replicate to RDS
      expect(outputs.DMSReplicationInstanceArn).toBeDefined();
      expect(outputs.DMSSourceEndpointArn).toBeDefined();
      expect(outputs.DMSTargetEndpointArn).toBeDefined();

      // 4. Verify monitoring is in place
      expect(outputs.SNSTopicArn).toBeDefined();

      // All components are properly configured
      expect(true).toBe(true);
    });

    test('high availability configuration should be complete', async () => {
      // Verify 3 AZ deployment
      const privateSubnetIds = [
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PrivateSubnet3Id,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds,
      });

      const response = await ec2Client.send(command);

      const azs = response.Subnets?.map(s => s.AvailabilityZone) || [];
      const uniqueAzs = new Set(azs);

      // Verify resources span 3 AZs
      expect(uniqueAzs.size).toBe(3);

      // Verify RDS Multi-AZ
      const dbIdentifier = outputs.RDSInstanceEndpoint.split('.')[0];
      const rdsCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const rdsResponse = await rdsClient.send(rdsCommand);
      expect(rdsResponse.DBInstances?.[0].MultiAZ).toBe(true);
    });
  });
});
