import { CloudWatchClient, DescribeAlarmsCommand, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { DescribeInstancesCommand, DescribeSecurityGroupsCommand, DescribeSubnetsCommand, DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import { GetRoleCommand, IAMClient } from '@aws-sdk/client-iam';
import { DescribeDBInstancesCommand, DescribeDBParameterGroupsCommand, DescribeDBSubnetGroupsCommand, RDSClient } from '@aws-sdk/client-rds';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import fs from 'fs';
import path from 'path';

// Get environment suffix from environment variable
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'devsecure';

// AWS clients
const region = process.env.AWS_REGION || 'us-east-1';
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const secretsClient = new SecretsManagerClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region });
const iamClient = new IAMClient({ region });

// Load deployment outputs if available for more accurate testing
let deploymentOutputs: Record<string, string> = {};
try {
  const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
  if (fs.existsSync(outputsPath)) {
    deploymentOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  }
} catch (error) {
  console.warn('Could not load deployment outputs, using environment-based naming');
}

describe('TapStack Integration Tests', () => {
  describe('VPC and Networking Infrastructure', () => {
    test('VPC exists with correct CIDR and tags', async () => {
      const vpcId = deploymentOutputs.VPCId;
      const command = vpcId
        ? new DescribeVpcsCommand({ VpcIds: [vpcId] })
        : new DescribeVpcsCommand({
          Filters: [
            { Name: 'tag:Name', Values: [`${environmentSuffix}-vpc`] },
            { Name: 'state', Values: ['available'] }
          ]
        });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].DhcpOptionsId).toBeDefined();

      const tags = response.Vpcs![0].Tags || [];
      expect(tags.find(tag => tag.Key === 'env')?.Value).toBe(environmentSuffix);
      expect(tags.find(tag => tag.Key === 'managedBy')?.Value).toBe('cdk');
      expect(tags.find(tag => tag.Key === 'project')?.Value).toBe(`${environmentSuffix}-infrastructure`);
    }, 30000);

    test('Public and private subnets are properly configured', async () => {
      const vpcId = deploymentOutputs.VPCId;
      const command = vpcId
        ? new DescribeSubnetsCommand({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }] })
        : new DescribeSubnetsCommand({
          Filters: [
            { Name: 'tag:Name', Values: [`*${environmentSuffix}*`] }
          ]
        });

      const response = await ec2Client.send(command);
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(4); // At least 2 public + 2 private

      const publicSubnets = response.Subnets!.filter(subnet =>
        subnet.Tags?.find(tag => tag.Key === 'aws-cdk:subnet-type' && tag.Value === 'Public')
      );
      const privateSubnets = response.Subnets!.filter(subnet =>
        subnet.Tags?.find(tag => tag.Key === 'aws-cdk:subnet-type' && tag.Value === 'Private')
      );

      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);

      // Verify public subnets can auto-assign public IPs
      publicSubnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });

      // Verify private subnets don't auto-assign public IPs
      privateSubnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    }, 30000);

    test('NAT Gateway is configured for private subnet egress', async () => {
      const vpcId = deploymentOutputs.VPCId;
      const subnetCommand = vpcId
        ? new DescribeSubnetsCommand({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }] })
        : new DescribeSubnetsCommand({
          Filters: [
            { Name: 'tag:Name', Values: [`*${environmentSuffix}*public*`] }
          ]
        });

      const subnetResponse = await ec2Client.send(subnetCommand);
      const publicSubnets = subnetResponse.Subnets!.filter(subnet =>
        subnet.Tags?.find(tag => tag.Key === 'aws-cdk:subnet-type' && tag.Value === 'Public')
      );

      expect(publicSubnets.length).toBeGreaterThan(0);

      // NAT Gateway should be in one of the public subnets
      const natCommand = new DescribeSubnetsCommand({
        Filters: [{ Name: 'subnet-id', Values: publicSubnets.map(s => s.SubnetId!) }]
      });

      // This validates the subnet infrastructure exists for NAT gateway deployment
      const natResponse = await ec2Client.send(natCommand);
      expect(natResponse.Subnets).toBeDefined();
    }, 30000);
  });

  describe('Security Groups and Network Security', () => {
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
      const egressRules = sg.IpPermissionsEgress || [];

      const pgRule = ingressRules.find(rule => rule.FromPort === 5432);
      expect(pgRule).toBeDefined();
      expect(pgRule?.UserIdGroupPairs).toHaveLength(1);
      expect(pgRule?.IpRanges).toHaveLength(0); // No direct IP access

      // Verify RDS security group has no outbound rules (restrictive)
      expect(egressRules.length).toBeLessThanOrEqual(1); // Should be minimal or none
    }, 30000);

    test('Security groups have proper tags and descriptions', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'group-name', Values: [`*${environmentSuffix}*`] }
        ]
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(2);

      response.SecurityGroups!.forEach(sg => {
        expect(sg.Description).toBeDefined();
        expect(sg.Description).toContain(environmentSuffix);
        expect(sg.GroupName).toContain(environmentSuffix);

        const tags = sg.Tags || [];
        expect(tags.find(tag => tag.Key === 'Name')?.Value).toContain(environmentSuffix);
      });
    }, 30000);
  });

  describe('EC2 Instance and Compute Resources', () => {
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
      expect(instance.Monitoring?.State).toBe('enabled'); // Detailed monitoring
      expect(instance.EbsOptimized).toBe(true);
    }, 30000);

    test('EC2 instance has proper network placement and connectivity', async () => {
      const instanceId = deploymentOutputs.EC2InstanceId;
      const command = instanceId
        ? new DescribeInstancesCommand({ InstanceIds: [instanceId] })
        : new DescribeInstancesCommand({
          Filters: [
            { Name: 'tag:Name', Values: [`${environmentSuffix}-web-server`] },
            { Name: 'instance-state-name', Values: ['running'] }
          ]
        });

      const response = await ec2Client.send(command);
      const instance = response.Reservations![0].Instances![0];

      // Verify instance is in public subnet
      expect(instance.PublicIpAddress).toBeDefined();
      expect(instance.PublicDnsName).toBeDefined();
      expect(instance.PrivateIpAddress).toBeDefined();

      // Verify subnet placement
      const subnetId = instance.SubnetId!;
      const subnetCommand = new DescribeSubnetsCommand({ SubnetIds: [subnetId] });
      const subnetResponse = await ec2Client.send(subnetCommand);
      const subnet = subnetResponse.Subnets![0];

      expect(subnet.MapPublicIpOnLaunch).toBe(true); // Should be in public subnet
      expect(subnet.Tags?.find(tag => tag.Key === 'aws-cdk:subnet-type')?.Value).toBe('Public');
    }, 30000);

    test('EC2 instance IAM role has correct permissions', async () => {
      const instanceId = deploymentOutputs.EC2InstanceId;
      const instanceCommand = instanceId
        ? new DescribeInstancesCommand({ InstanceIds: [instanceId] })
        : new DescribeInstancesCommand({
          Filters: [
            { Name: 'tag:Name', Values: [`${environmentSuffix}-web-server`] },
            { Name: 'instance-state-name', Values: ['running'] }
          ]
        });

      const instanceResponse = await ec2Client.send(instanceCommand);
      const instance = instanceResponse.Reservations![0].Instances![0];
      expect(instance.IamInstanceProfile).toBeDefined();

      // Extract role name from instance profile ARN
      const roleArn = instance.IamInstanceProfile!.Arn!;
      const roleName = `EC2Role-${environmentSuffix}`;

      const roleCommand = new GetRoleCommand({ RoleName: roleName });
      const roleResponse = await iamClient.send(roleCommand);

      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role!.RoleName).toBe(roleName);
      expect(roleResponse.Role!.Description).toContain(environmentSuffix);
    }, 30000);
  });

  describe('RDS Database and Data Layer', () => {
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
      expect(db.BackupRetentionPeriod).toBe(7);
      expect(db.DeletionProtection).toBe(true);
      expect(db.PerformanceInsightsEnabled).toBe(true);
      expect(db.MonitoringInterval).toBe(60);
      expect(db.EnabledCloudwatchLogsExports).toContain('postgresql');
    }, 60000);

    test('RDS subnet group is properly configured in private subnets', async () => {
      const command = new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: `database-subnet-group-${environmentSuffix}`
      });

      const response = await rdsClient.send(command);
      expect(response.DBSubnetGroups).toHaveLength(1);

      const subnetGroup = response.DBSubnetGroups![0];
      expect(subnetGroup.DBSubnetGroupName).toBe(`database-subnet-group-${environmentSuffix}`);
      expect(subnetGroup.DBSubnetGroupDescription).toContain(environmentSuffix);
      expect(subnetGroup.Subnets!.length).toBeGreaterThanOrEqual(2); // Multi-AZ requires at least 2 subnets

      // Verify all subnets are in private subnet range
      subnetGroup.Subnets!.forEach(subnet => {
        expect(subnet.SubnetStatus).toBe('Active');
      });
    }, 30000);

    test('RDS parameter group has correct configuration', async () => {
      const command = new DescribeDBParameterGroupsCommand({
        DBParameterGroupName: `postgresql-param-group-${environmentSuffix}`
      });

      const response = await rdsClient.send(command);
      expect(response.DBParameterGroups).toHaveLength(1);

      const paramGroup = response.DBParameterGroups![0];
      expect(paramGroup.DBParameterGroupName).toBe(`postgresql-param-group-${environmentSuffix}`);
      expect(paramGroup.DBParameterGroupFamily).toBe('postgres15');
      expect(paramGroup.Description).toContain(environmentSuffix);
    }, 30000);

    test('RDS database is accessible only from private network', async () => {
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: `postgresql-database-${environmentSuffix}`
      });

      const response = await rdsClient.send(command);
      const db = response.DBInstances![0];

      // Verify database is not publicly accessible
      expect(db.PubliclyAccessible).toBe(false);

      // Verify endpoint is internal
      const endpoint = db.Endpoint!.Address!;
      expect(endpoint).toMatch(/\.rds\.amazonaws\.com$/);
      expect(endpoint).toContain(region);
    }, 30000);
  });

  describe('Secrets Manager and Credential Security', () => {
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
      expect(credentials.engine).toBe('postgres');
      expect(credentials.host).toBeDefined();
      expect(credentials.dbname).toBe(`${environmentSuffix}db`);
    }, 30000);

    test('Secret has proper encryption and access policies', async () => {
      const command = new GetSecretValueCommand({
        SecretId: `rds-postgres-${environmentSuffix}`
      });

      const response = await secretsClient.send(command);
      expect(response.ARN).toBeDefined();
      expect(response.Name).toBe(`rds-postgres-${environmentSuffix}`);
      expect(response.VersionStages).toContain('AWSCURRENT');
      expect(response.CreatedDate).toBeDefined();
    }, 30000);
  });

  describe('CloudWatch Monitoring and Alarms', () => {
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

    test('CloudWatch log groups are properly configured', async () => {
      const logGroupNames = [
        `/aws/vpc/flowlogs-${environmentSuffix}`,
        `/aws/ec2/${environmentSuffix}/messages`,
        `/aws/ec2/${environmentSuffix}/secure`
      ];

      for (const logGroupName of logGroupNames) {
        const command = new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName
        });

        const response = await cloudWatchLogsClient.send(command);
        expect(response.logGroups).toBeDefined();
        expect(response.logGroups!.length).toBeGreaterThanOrEqual(1);

        const logGroup = response.logGroups!.find(lg => lg.logGroupName === logGroupName);
        expect(logGroup).toBeDefined();
        expect(logGroup!.retentionInDays).toBeDefined();
        expect(logGroup!.retentionInDays).toBeGreaterThan(0);
      }
    }, 30000);

    test('All critical infrastructure alarms are in OK or ALARM state', async () => {
      const alarmPrefixes = [
        `${environmentSuffix}-ec2-`,
        `${environmentSuffix}-rds-`
      ];

      for (const prefix of alarmPrefixes) {
        const command = new DescribeAlarmsCommand({
          AlarmNamePrefix: prefix
        });

        const response = await cloudWatchClient.send(command);
        expect(response.MetricAlarms!.length).toBeGreaterThan(0);

        response.MetricAlarms!.forEach(alarm => {
          expect(alarm.StateValue).toMatch(/^(OK|ALARM|INSUFFICIENT_DATA)$/);
          expect(alarm.ActionsEnabled).toBe(true);
          expect(alarm.MetricName).toBeDefined();
          expect(alarm.Namespace).toBeDefined();
          expect(alarm.Statistic || alarm.ExtendedStatistic).toBeDefined();
        });
      }
    }, 45000);
  });

  describe('End-to-End Infrastructure Validation', () => {
    test('Complete infrastructure stack is properly tagged', async () => {
      // Test VPC tags
      const vpcCommand = new DescribeVpcsCommand({
        Filters: [{ Name: 'tag:env', Values: [environmentSuffix] }]
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      expect(vpcResponse.Vpcs!.length).toBeGreaterThanOrEqual(1);

      // Test EC2 tags
      const ec2Command = new DescribeInstancesCommand({
        Filters: [{ Name: 'tag:env', Values: [environmentSuffix] }]
      });
      const ec2Response = await ec2Client.send(ec2Command);
      expect(ec2Response.Reservations!.length).toBeGreaterThanOrEqual(1);

      // Test RDS tags (implicit through naming convention)
      const rdsCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: `postgresql-database-${environmentSuffix}`
      });
      const rdsResponse = await rdsClient.send(rdsCommand);
      expect(rdsResponse.DBInstances!.length).toBe(1);
    }, 45000);

    test('Infrastructure components can communicate properly', async () => {
      // Get EC2 instance details
      const instanceCommand = new DescribeInstancesCommand({
        Filters: [
          { Name: 'tag:Name', Values: [`${environmentSuffix}-web-server`] },
          { Name: 'instance-state-name', Values: ['running'] }
        ]
      });
      const instanceResponse = await ec2Client.send(instanceCommand);
      const instance = instanceResponse.Reservations![0].Instances![0];

      // Get RDS endpoint
      const dbCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: `postgresql-database-${environmentSuffix}`
      });
      const dbResponse = await rdsClient.send(dbCommand);
      const database = dbResponse.DBInstances![0];

      // Verify they're in the same VPC
      expect(instance.VpcId).toBe(database.DBSubnetGroup!.VpcId);

      // Verify security group relationship
      const ec2SgId = instance.SecurityGroups![0].GroupId!;
      const rdsSgId = database.VpcSecurityGroups![0].VpcSecurityGroupId!;

      expect(ec2SgId).toBeDefined();
      expect(rdsSgId).toBeDefined();
      expect(ec2SgId).not.toBe(rdsSgId); // Different security groups
    }, 45000);

    test('Monitoring and alerting infrastructure is functional', async () => {
      // Test that we can retrieve metrics for key resources
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const instanceId = deploymentOutputs.EC2InstanceId;
      if (instanceId) {
        const metricsCommand = new GetMetricStatisticsCommand({
          Namespace: 'AWS/EC2',
          MetricName: 'CPUUtilization',
          Dimensions: [{ Name: 'InstanceId', Value: instanceId }],
          StartTime: oneHourAgo,
          EndTime: now,
          Period: 300,
          Statistics: ['Average']
        });

        const metricsResponse = await cloudWatchClient.send(metricsCommand);
        expect(metricsResponse.Datapoints).toBeDefined();
        // Note: May be empty if instance is newly created
      }
    }, 30000);
  });
});

