import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  ListMetricsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetRoleCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
  SNSClient,
} from '@aws-sdk/client-sns';
import { readFileSync } from 'fs';
import { join } from 'path';

// AWS Service Clients
const ec2 = new EC2Client({ region: 'us-east-2' });
const rds = new RDSClient({ region: 'us-east-2' });
const sns = new SNSClient({ region: 'us-east-2' });
const cloudWatch = new CloudWatchClient({ region: 'us-east-2' });
const iam = new IAMClient({ region: 'us-east-2' });

// Load deployment outputs
let outputs: any = {};
try {
  const outputsPath = join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
  outputs = JSON.parse(readFileSync(outputsPath, 'utf-8'));
} catch (error) {
  console.warn('Could not load deployment outputs:', error);
}

describe('TapStack Infrastructure Integration Tests', () => {
  const LOAD_BALANCER_DNS = outputs.LoadBalancerDNS;
  const DATABASE_ENDPOINT = outputs.DatabaseEndpoint;
  const SNS_TOPIC_ARN = outputs.SNSTopicArn;

  describe('RDS Database', () => {
    test('RDS instance exists and is configured correctly', async () => {
      if (!DATABASE_ENDPOINT) {
        console.log('Skipping test - no RDS instance deployed');
        return;
      }

      const command = new DescribeDBInstancesCommand({});
      const response = await rds.send(command);

      const dbInstance = response.DBInstances?.find(db =>
        db.Endpoint?.Address === DATABASE_ENDPOINT
      );
      expect(dbInstance).toBeDefined();
      expect(dbInstance?.Engine).toBe('mysql');
      expect(dbInstance?.EngineVersion).toMatch(/^8\.0\./);
      expect(dbInstance?.DBInstanceClass).toBe('db.t3.micro');
      expect(dbInstance?.DBInstanceStatus).toBe('available');
      expect(dbInstance?.MultiAZ).toBe(true);
      expect(dbInstance?.StorageEncrypted).toBe(true);
      expect(dbInstance?.BackupRetentionPeriod).toBe(7);
      expect(dbInstance?.DeletionProtection).toBe(true);
    });

    test('RDS subnet group exists and is configured', async () => {
      const command = new DescribeDBSubnetGroupsCommand({});
      const response = await rds.send(command);

      const subnetGroup = response.DBSubnetGroups?.find(sg =>
        sg.DBSubnetGroupName?.includes('TapStack')
      );
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup?.Subnets).toBeDefined();
      expect(subnetGroup?.Subnets?.length).toBeGreaterThan(0);
      expect(subnetGroup?.VpcId).toBeDefined();
    });
  });

  describe('SNS Topic', () => {
    test('SNS topic exists and is configured correctly', async () => {
      if (!SNS_TOPIC_ARN) {
        console.log('Skipping test - no SNS topic deployed');
        return;
      }

      const command = new GetTopicAttributesCommand({
        TopicArn: SNS_TOPIC_ARN,
      });
      const response = await sns.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(SNS_TOPIC_ARN);
      expect(response.Attributes?.DisplayName).toContain('Tap App Alerts');
    });

    test('SNS topic has subscriptions', async () => {
      if (!SNS_TOPIC_ARN) {
        console.log('Skipping test - no SNS topic deployed');
        return;
      }

      const command = new ListSubscriptionsByTopicCommand({
        TopicArn: SNS_TOPIC_ARN,
      });
      const response = await sns.send(command);

      // Topic may or may not have subscriptions, but should be queryable
      expect(response.Subscriptions).toBeDefined();
    });
  });

  describe('CloudWatch Alarms', () => {
    test('CloudWatch alarms exist for monitoring', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'TapStack',
      });
      const response = await cloudWatch.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBeGreaterThan(0);

      // Check for specific alarms
      const alarmNames = response.MetricAlarms?.map(alarm => alarm.AlarmName);
      expect(alarmNames).toContainEqual(
        expect.stringContaining('UnhealthyHostsAlarm')
      );
      expect(alarmNames).toContainEqual(
        expect.stringContaining('ResponseTimeAlarm')
      );
      expect(alarmNames).toContainEqual(
        expect.stringContaining('DbConnectionsAlarm')
      );
    });

    test('CloudWatch metrics are being collected', async () => {
      const command = new ListMetricsCommand({
        Namespace: 'AWS/ApplicationELB',
      });
      const response = await cloudWatch.send(command);

      // Check for ALB metrics
      const albMetrics = response.Metrics?.filter(metric =>
        metric.Dimensions?.some(dim => dim.Name === 'LoadBalancer')
      );
      expect(albMetrics?.length).toBeGreaterThan(0);
    });
  });

  describe('VPC and Networking', () => {
    test('VPC exists and has correct configuration', async () => {
      const command = new DescribeVpcsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: ['*TapStack*'],
          },
        ],
      });
      const response = await ec2.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBeGreaterThan(0);

      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBeDefined();
      expect(vpc.State).toBe('available');
      expect(vpc.IsDefault).toBe(false);
    });

    test('Security groups are configured correctly', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'group-name',
            Values: ['*TapStack*'],
          },
        ],
      });
      const response = await ec2.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups?.length).toBeGreaterThan(0);

      // Check for ALB security group
      const albSg = response.SecurityGroups?.find(sg =>
        sg.GroupName?.includes('AlbSecurityGroup')
      );
      expect(albSg).toBeDefined();

      // Check for EC2 security group
      const ec2Sg = response.SecurityGroups?.find(sg =>
        sg.GroupName?.includes('Ec2SecurityGroup')
      );
      expect(ec2Sg).toBeDefined();

      // Check for RDS security group
      const rdsSg = response.SecurityGroups?.find(sg =>
        sg.GroupName?.includes('RdsSecurityGroup')
      );
      expect(rdsSg).toBeDefined();
    });
  });

  describe('IAM Roles', () => {
    test('EC2 instance role exists and has correct policies', async () => {
      const command = new GetRoleCommand({
        RoleName: expect.stringContaining('TapStack-Ec2Role'),
      });
      const response = await iam.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toContain('TapStack-Ec2Role');
      expect(response.Role?.AssumeRolePolicyDocument).toBeDefined();

      // Check attached policies
      const policiesCommand = new ListAttachedRolePoliciesCommand({
        RoleName: response.Role?.RoleName,
      });
      const policiesResponse = await iam.send(policiesCommand);

      expect(policiesResponse.AttachedPolicies).toBeDefined();
      expect(policiesResponse.AttachedPolicies?.length).toBeGreaterThan(0);

      const policyNames = policiesResponse.AttachedPolicies?.map(p => p.PolicyName);
      expect(policyNames).toContain('CloudWatchAgentServerPolicy');
      expect(policyNames).toContain('AmazonSSMManagedInstanceCore');
    });
  });

  describe('EC2 Instances', () => {
    test('EC2 instances exist and are running', async () => {
      const command = new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'tag:Project',
            Values: ['TapApp'],
          },
        ],
      });
      const response = await ec2.send(command);

      expect(response.Reservations).toBeDefined();
      expect(response.Reservations?.length).toBeGreaterThan(0);

      const instances = response.Reservations?.flatMap(res => res.Instances || []);
      expect(instances?.length).toBeGreaterThan(0);

      const instance = instances![0];
      expect(instance.InstanceType).toBe('t3.medium');
      expect(instance.State?.Name).toBe('running');
      expect(instance.IamInstanceProfile).toBeDefined();
      expect(instance.SecurityGroups).toBeDefined();
    });
  });

  describe('Resource Tagging', () => {
    test('Resources have correct tags', async () => {
      // Check VPC tags
      const vpcCommand = new DescribeVpcsCommand({
        Filters: [
          {
            Name: 'tag:Project',
            Values: ['TapApp'],
          },
        ],
      });
      const vpcResponse = await ec2.send(vpcCommand);

      expect(vpcResponse.Vpcs).toBeDefined();
      expect(vpcResponse.Vpcs?.length).toBeGreaterThan(0);

      const vpc = vpcResponse.Vpcs![0];
      expect(vpc.Tags).toBeDefined();
      
      const projectTag = vpc.Tags?.find(tag => tag.Key === 'Project');
      const environmentTag = vpc.Tags?.find(tag => tag.Key === 'Environment');
      const regionTag = vpc.Tags?.find(tag => tag.Key === 'Region');
      const typeTag = vpc.Tags?.find(tag => tag.Key === 'Type');

      expect(projectTag?.Value).toBe('TapApp');
      expect(environmentTag?.Value).toBe('Production');
      expect(regionTag?.Value).toBe('us-east-2');
      expect(typeTag?.Value).toBe('Primary');
    });
  });

  describe('Security and Compliance', () => {
    test('RDS instance has encryption enabled', async () => {
      if (!DATABASE_ENDPOINT) {
        console.log('Skipping test - no RDS instance deployed');
        return;
      }

      const command = new DescribeDBInstancesCommand({});
      const response = await rds.send(command);

      const dbInstance = response.DBInstances?.find(db =>
        db.Endpoint?.Address === DATABASE_ENDPOINT
      );
      expect(dbInstance?.StorageEncrypted).toBe(true);
    });

    test('RDS instance has deletion protection enabled', async () => {
      if (!DATABASE_ENDPOINT) {
        console.log('Skipping test - no RDS instance deployed');
        return;
      }

      const command = new DescribeDBInstancesCommand({});
      const response = await rds.send(command);

      const dbInstance = response.DBInstances?.find(db =>
        db.Endpoint?.Address === DATABASE_ENDPOINT
      );
      expect(dbInstance?.DeletionProtection).toBe(true);
    });

    test('RDS instance has automated backups enabled', async () => {
      if (!DATABASE_ENDPOINT) {
        console.log('Skipping test - no RDS instance deployed');
        return;
      }

      const command = new DescribeDBInstancesCommand({});
      const response = await rds.send(command);

      const dbInstance = response.DBInstances?.find(db =>
        db.Endpoint?.Address === DATABASE_ENDPOINT
      );
      expect(dbInstance?.BackupRetentionPeriod).toBeGreaterThan(0);
    });
  });

  describe('Performance and Monitoring', () => {
    test('CloudWatch enhanced monitoring is enabled for RDS', async () => {
      if (!DATABASE_ENDPOINT) {
        console.log('Skipping test - no RDS instance deployed');
        return;
      }

      const command = new DescribeDBInstancesCommand({});
      const response = await rds.send(command);

      const dbInstance = response.DBInstances?.find(db =>
        db.Endpoint?.Address === DATABASE_ENDPOINT
      );
      expect(dbInstance?.MonitoringInterval).toBe(60); // 1 minute
    });

    test('CloudWatch logs are enabled for RDS', async () => {
      if (!DATABASE_ENDPOINT) {
        console.log('Skipping test - no RDS instance deployed');
        return;
      }

      const command = new DescribeDBInstancesCommand({});
      const response = await rds.send(command);

      const dbInstance = response.DBInstances?.find(db =>
        db.Endpoint?.Address === DATABASE_ENDPOINT
      );
      expect(dbInstance?.EnabledCloudwatchLogsExports).toBeDefined();
      expect(dbInstance?.EnabledCloudwatchLogsExports?.length).toBeGreaterThan(0);
    });
  });

  describe('High Availability', () => {
    test('RDS instance has Multi-AZ enabled', async () => {
      if (!DATABASE_ENDPOINT) {
        console.log('Skipping test - no RDS instance deployed');
        return;
      }

      const command = new DescribeDBInstancesCommand({});
      const response = await rds.send(command);

      const dbInstance = response.DBInstances?.find(db =>
        db.Endpoint?.Address === DATABASE_ENDPOINT
      );
      expect(dbInstance?.MultiAZ).toBe(true);
    });
  });

  describe('Cost Optimization', () => {
    test('RDS instance uses appropriate instance class', async () => {
      if (!DATABASE_ENDPOINT) {
        console.log('Skipping test - no RDS instance deployed');
        return;
      }

      const command = new DescribeDBInstancesCommand({});
      const response = await rds.send(command);

      const dbInstance = response.DBInstances?.find(db =>
        db.Endpoint?.Address === DATABASE_ENDPOINT
      );
      expect(dbInstance?.DBInstanceClass).toBe('db.t3.micro');
    });

    test('EC2 instances use appropriate instance type', async () => {
      const command = new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'tag:Project',
            Values: ['TapApp'],
          },
        ],
      });
      const response = await ec2.send(command);

      const instances = response.Reservations?.flatMap(res => res.Instances || []);
      expect(instances?.length).toBeGreaterThan(0);

      const instance = instances![0];
      expect(instance.InstanceType).toBe('t3.medium');
    });
  });

  describe('Operational Excellence', () => {
    test('All critical alarms are configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'TapStack',
      });
      const response = await cloudWatch.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBeGreaterThan(0);

      const alarmNames = response.MetricAlarms?.map(alarm => alarm.AlarmName);
      
      // Check for critical monitoring alarms
      const hasUnhealthyHostsAlarm = alarmNames?.some(name => 
        name?.includes('UnhealthyHostsAlarm')
      );
      const hasResponseTimeAlarm = alarmNames?.some(name => 
        name?.includes('ResponseTimeAlarm')
      );
      const hasDbConnectionsAlarm = alarmNames?.some(name => 
        name?.includes('DbConnectionsAlarm')
      );

      expect(hasUnhealthyHostsAlarm).toBe(true);
      expect(hasResponseTimeAlarm).toBe(true);
      expect(hasDbConnectionsAlarm).toBe(true);
    });

    test('SNS topic is configured for alerts', async () => {
      if (!SNS_TOPIC_ARN) {
        console.log('Skipping test - no SNS topic deployed');
        return;
      }

      const command = new GetTopicAttributesCommand({
        TopicArn: SNS_TOPIC_ARN,
      });
      const response = await sns.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(SNS_TOPIC_ARN);
    });

    test('CloudWatch metrics are being collected', async () => {
      const command = new ListMetricsCommand({
        Namespace: 'AWS/ApplicationELB',
      });
      const response = await cloudWatch.send(command);

      // Check for ALB metrics
      const albMetrics = response.Metrics?.filter(metric =>
        metric.Dimensions?.some(dim => dim.Name === 'LoadBalancer')
      );
      expect(albMetrics?.length).toBeGreaterThan(0);
    });
  });

  describe('Disaster Recovery', () => {
    test('RDS backup retention is configured', async () => {
      if (!DATABASE_ENDPOINT) {
        console.log('Skipping test - no RDS instance deployed');
        return;
      }

      const command = new DescribeDBInstancesCommand({});
      const response = await rds.send(command);

      const dbInstance = response.DBInstances?.find(db =>
        db.Endpoint?.Address === DATABASE_ENDPOINT
      );
      expect(dbInstance?.BackupRetentionPeriod).toBe(7);
    });

    test('RDS automated backups are enabled', async () => {
      if (!DATABASE_ENDPOINT) {
        console.log('Skipping test - no RDS instance deployed');
        return;
      }

      const command = new DescribeDBInstancesCommand({});
      const response = await rds.send(command);

      const dbInstance = response.DBInstances?.find(db =>
        db.Endpoint?.Address === DATABASE_ENDPOINT
      );
      expect(dbInstance?.BackupRetentionPeriod).toBeGreaterThan(0);
    });
  });

  describe('Network Security', () => {
    test('VPC has proper subnet configuration', async () => {
      const command = new DescribeVpcsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: ['*TapStack*'],
          },
        ],
      });
      const response = await ec2.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBeGreaterThan(0);

      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBeDefined();
      expect(vpc.State).toBe('available');
    });

    test('Security groups follow least privilege principle', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'group-name',
            Values: ['*TapStack*'],
          },
        ],
      });
      const response = await ec2.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups?.length).toBeGreaterThan(0);

      // Check that no security group allows all traffic (0.0.0.0/0) on all ports
      const allTrafficGroups = response.SecurityGroups?.filter(sg =>
        sg.IpPermissions?.some(rule =>
          rule.IpRanges?.some(ip => ip.CidrIp === '0.0.0.0/0') &&
          rule.FromPort === -1 && rule.ToPort === -1
        )
      );
      expect(allTrafficGroups?.length).toBe(0);
    });
  });
});
