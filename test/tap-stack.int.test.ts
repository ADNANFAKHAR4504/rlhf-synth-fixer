import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import { DescribeInstancesCommand, DescribeSecurityGroupsCommand, DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

// Get environment suffix from environment variable
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'devsecure';

// AWS clients
const ec2Client = new EC2Client({ region: process.env.AWS_REGION || 'us-east-1' });
const rdsClient = new RDSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION || 'us-east-1' });
const cloudWatchClient = new CloudWatchClient({ region: process.env.AWS_REGION || 'us-east-1' });

describe('TapStack Integration Tests', () => {
  describe('VPC and Networking', () => {
    test('VPC exists with correct CIDR and tags', async () => {
      const command = new DescribeVpcsCommand({
        Filters: [
          { Name: 'tag:Name', Values: [`${environmentSuffix}-vpc`] },
          { Name: 'state', Values: ['available'] }
        ]
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');

      const tags = response.Vpcs![0].Tags || [];
      expect(tags.find(tag => tag.Key === 'env')?.Value).toBe(environmentSuffix);
      expect(tags.find(tag => tag.Key === 'managedBy')?.Value).toBe('cdk');
    }, 30000);
  });

  describe('Security Groups', () => {
    test('EC2 security group has correct ingress rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'group-name', Values: [`EC2SecurityGroup-${environmentSuffix}`] }
        ]
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);

      const sg = response.SecurityGroups![0];
      const ingressRules = sg.IpPermissions || [];

      // Check SSH rule
      const sshRule = ingressRules.find(rule => rule.FromPort === 22);
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.[0]?.CidrIp).toBe('203.0.113.0/24');

      // Check HTTP rule
      const httpRule = ingressRules.find(rule => rule.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpRanges?.[0]?.CidrIp).toBe('0.0.0.0/0');
    }, 30000);

    test('RDS security group allows PostgreSQL from EC2 only', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'group-name', Values: [`RDSSecurityGroup-${environmentSuffix}`] }
        ]
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);

      const sg = response.SecurityGroups![0];
      const ingressRules = sg.IpPermissions || [];

      const pgRule = ingressRules.find(rule => rule.FromPort === 5432);
      expect(pgRule).toBeDefined();
      expect(pgRule?.UserIdGroupPairs).toHaveLength(1);
    }, 30000);
  });

  describe('EC2 Instance', () => {
    test('EC2 instance is running with correct configuration', async () => {
      const command = new DescribeInstancesCommand({
        Filters: [
          { Name: 'tag:Name', Values: [`${environmentSuffix}-web-server`] },
          { Name: 'instance-state-name', Values: ['running'] }
        ]
      });

      const response = await ec2Client.send(command);
      expect(response.Reservations).toHaveLength(1);
      expect(response.Reservations![0].Instances).toHaveLength(1);

      const instance = response.Reservations![0].Instances![0];
      expect(instance.InstanceType).toBe('t3.micro');
      expect(instance.State?.Name).toBe('running');
      expect(instance.IamInstanceProfile).toBeDefined();
    }, 30000);
  });

  describe('RDS Database', () => {
    test('PostgreSQL database is available with correct configuration', async () => {
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: `postgresql-database-${environmentSuffix}`
      });

      const response = await rdsClient.send(command);
      expect(response.DBInstances).toHaveLength(1);

      const db = response.DBInstances![0];
      expect(db.DBInstanceStatus).toBe('available');
      expect(db.Engine).toBe('postgres');
      expect(db.EngineVersion).toMatch(/^15/);
      expect(db.DBInstanceClass).toBe('db.t3.micro');
      expect(db.MultiAZ).toBe(true);
      expect(db.StorageEncrypted).toBe(true);
    }, 60000);
  });

  describe('Secrets Manager', () => {
    test('RDS credentials secret exists and is accessible', async () => {
      const command = new GetSecretValueCommand({
        SecretId: `rds-postgres-${environmentSuffix}`
      });

      const response = await secretsClient.send(command);
      expect(response.SecretString).toBeDefined();

      const credentials = JSON.parse(response.SecretString!);
      expect(credentials.username).toBe('postgres');
      expect(credentials.password).toBeDefined();
      expect(credentials.password.length).toBeGreaterThan(20);
    }, 30000);
  });

  describe('CloudWatch Alarms', () => {
    test('EC2 CPU alarm is configured and active', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [`${environmentSuffix}-ec2-high-cpu`]
      });

      const response = await cloudWatchClient.send(command);
      expect(response.MetricAlarms).toHaveLength(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('CPUUtilization');
      expect(alarm.Namespace).toBe('AWS/EC2');
      expect(alarm.Threshold).toBe(80);
      expect(alarm.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
    }, 30000);

    test('RDS alarms are configured correctly', async () => {
      const alarmNames = [
        `${environmentSuffix}-rds-high-cpu`,
        `${environmentSuffix}-rds-high-connections`,
        `${environmentSuffix}-rds-low-storage`
      ];

      const command = new DescribeAlarmsCommand({ AlarmNames: alarmNames });
      const response = await cloudWatchClient.send(command);

      expect(response.MetricAlarms).toHaveLength(3);

      const cpuAlarm = response.MetricAlarms!.find(a => a.AlarmName?.includes('cpu'));
      expect(cpuAlarm?.Namespace).toBe('AWS/RDS');
      expect(cpuAlarm?.Threshold).toBe(75);
    }, 30000);
  });
});

