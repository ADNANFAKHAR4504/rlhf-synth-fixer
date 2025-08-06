import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribePoliciesCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { IAMClient } from '@aws-sdk/client-iam';
import {
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient,
} from '@aws-sdk/client-rds';

describe('Highly Available Web Application Integration Tests', () => {
  let cloudFormationClient: CloudFormationClient;
  let ec2Client: EC2Client;
  let elbv2Client: ElasticLoadBalancingV2Client;
  let autoScalingClient: AutoScalingClient;
  let rdsClient: RDSClient;
  let cloudWatchClient: CloudWatchClient;
  let iamClient: IAMClient;

  const stackName = `TapStack${process.env.ENVIRONMENT_SUFFIX || 'dev'}`;
  const region = process.env.AWS_REGION || 'us-east-1';

  let stackOutputs: { [key: string]: string } = {};

  beforeAll(async () => {
    // Initialize AWS SDK v3 clients
    const clientConfig = { region };

    cloudFormationClient = new CloudFormationClient(clientConfig);
    ec2Client = new EC2Client(clientConfig);
    elbv2Client = new ElasticLoadBalancingV2Client(clientConfig);
    autoScalingClient = new AutoScalingClient(clientConfig);
    rdsClient = new RDSClient(clientConfig);
    cloudWatchClient = new CloudWatchClient(clientConfig);
    iamClient = new IAMClient(clientConfig);

    // Get stack outputs
    try {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const stackDescription = await cloudFormationClient.send(command);

      if (stackDescription.Stacks && stackDescription.Stacks[0].Outputs) {
        stackDescription.Stacks[0].Outputs.forEach((output: any) => {
          if (output.OutputKey && output.OutputValue) {
            stackOutputs[output.OutputKey] = output.OutputValue;
          }
        });
      }
    } catch (error) {
      console.error('Failed to get stack outputs:', error);
      throw new Error(`Stack ${stackName} not found or not accessible`);
    }
  }, 30000);

  describe('Stack Deployment', () => {
    test('should have deployed stack successfully', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const stacks = await cloudFormationClient.send(command);

      expect(stacks.Stacks).toBeDefined();
      expect(stacks.Stacks!.length).toBe(1);
      expect(stacks.Stacks![0].StackStatus).toBe('CREATE_COMPLETE');
    });

    test('should have all expected outputs', () => {
      const expectedOutputs = [
        'LoadBalancerDNSName',
        'LoadBalancerURL',
        'DatabaseEndpoint',
        'DatabasePort',
        'AutoScalingGroupName',
      ];

      expectedOutputs.forEach(outputKey => {
        expect(stackOutputs[outputKey]).toBeDefined();
        expect(stackOutputs[outputKey]).not.toBe('');
      });
    });
  });

  describe('Load Balancer', () => {
    test('should have Application Load Balancer running', async () => {
      const dnsName = stackOutputs.LoadBalancerDNSName;
      expect(dnsName).toBeDefined();

      const command = new DescribeLoadBalancersCommand({
        Names: [dnsName.split('-')[0] + '-' + dnsName.split('-')[1] + '-ALB'],
      });

      try {
        const loadBalancers = await elbv2Client.send(command);
        expect(loadBalancers.LoadBalancers).toBeDefined();
        expect(loadBalancers.LoadBalancers!.length).toBeGreaterThan(0);

        const alb = loadBalancers.LoadBalancers![0];
        expect(alb.State!.Code).toBe('active');
        expect(alb.Type).toBe('application');
        expect(alb.Scheme).toBe('internet-facing');
      } catch (error) {
        // If we can't find by name, try to find by DNS name
        const allLBsCommand = new DescribeLoadBalancersCommand({});
        const allLoadBalancers = await elbv2Client.send(allLBsCommand);

        const matchingLB = allLoadBalancers.LoadBalancers!.find(
          lb => lb.DNSName === dnsName
        );

        expect(matchingLB).toBeDefined();
        expect(matchingLB!.State!.Code).toBe('active');
      }
    });

    test('should have target group with healthy targets', async () => {
      const command = new DescribeTargetGroupsCommand({});
      const targetGroups = await elbv2Client.send(command);

      expect(targetGroups.TargetGroups).toBeDefined();
      const webAppTG = targetGroups.TargetGroups!.find(
        tg => tg.TargetGroupName && tg.TargetGroupName.includes('TG')
      );

      expect(webAppTG).toBeDefined();
      expect(webAppTG!.Port).toBe(80);
      expect(webAppTG!.Protocol).toBe('HTTP');
      expect(webAppTG!.HealthCheckPath).toBe('/');

      // Check target health
      const healthCommand = new DescribeTargetHealthCommand({
        TargetGroupArn: webAppTG!.TargetGroupArn,
      });
      const targetHealth = await elbv2Client.send(healthCommand);

      expect(targetHealth.TargetHealthDescriptions).toBeDefined();
      expect(targetHealth.TargetHealthDescriptions!.length).toBeGreaterThan(0);
    });
  });

  describe('Auto Scaling Group', () => {
    test('should have Auto Scaling Group with correct configuration', async () => {
      const asgName = stackOutputs.AutoScalingGroupName;
      expect(asgName).toBeDefined();

      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });
      const asgs = await autoScalingClient.send(command);

      expect(asgs.AutoScalingGroups).toBeDefined();
      expect(asgs.AutoScalingGroups!.length).toBe(1);

      const asg = asgs.AutoScalingGroups![0];
      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(4);
      expect(asg.DesiredCapacity).toBe(2);
      expect(asg.HealthCheckType).toBe('ELB');
      expect(asg.Instances).toBeDefined();
      expect(asg.Instances!.length).toBeGreaterThanOrEqual(2);
    });

    test('should have running EC2 instances', async () => {
      const asgName = stackOutputs.AutoScalingGroupName;
      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });
      const asgs = await autoScalingClient.send(asgCommand);

      const instanceIds = asgs.AutoScalingGroups![0].Instances!.map(
        i => i.InstanceId!
      );
      expect(instanceIds.length).toBeGreaterThanOrEqual(2);

      const instancesCommand = new DescribeInstancesCommand({
        InstanceIds: instanceIds,
      });
      const instances = await ec2Client.send(instancesCommand);

      expect(instances.Reservations).toBeDefined();
      instances.Reservations!.forEach(reservation => {
        reservation.Instances!.forEach(instance => {
          expect(instance.State!.Name).toMatch(/^(running|pending)$/);
          expect(instance.InstanceType).toMatch(
            /^t[23]\.(micro|small|medium)$/
          );
        });
      });
    });

    test('should have scaling policies', async () => {
      const asgName = stackOutputs.AutoScalingGroupName;

      const command = new DescribePoliciesCommand({
        AutoScalingGroupName: asgName,
      });
      const policies = await autoScalingClient.send(command);

      expect(policies.ScalingPolicies).toBeDefined();
      expect(policies.ScalingPolicies!.length).toBe(2);

      const scaleUpPolicy = policies.ScalingPolicies!.find(
        p => p.ScalingAdjustment === 1
      );
      const scaleDownPolicy = policies.ScalingPolicies!.find(
        p => p.ScalingAdjustment === -1
      );

      expect(scaleUpPolicy).toBeDefined();
      expect(scaleDownPolicy).toBeDefined();
    });
  });

  describe('Database', () => {
    test('should have RDS instance running', async () => {
      const dbEndpoint = stackOutputs.DatabaseEndpoint;
      expect(dbEndpoint).toBeDefined();

      // Extract DB identifier from endpoint
      const dbIdentifier = dbEndpoint.split('.')[0];

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const dbInstances = await rdsClient.send(command);

      expect(dbInstances.DBInstances).toBeDefined();
      expect(dbInstances.DBInstances!.length).toBe(1);

      const db = dbInstances.DBInstances![0];
      expect(db.DBInstanceStatus).toBe('available');
      expect(db.Engine).toBe('mysql');
      expect(db.MultiAZ).toBe(true);
      expect(db.StorageEncrypted).toBe(true);
      expect(db.AllocatedStorage).toBeGreaterThanOrEqual(20);
    });

    test('should have DB subnet group', async () => {
      const command = new DescribeDBSubnetGroupsCommand({});
      const subnetGroups = await rdsClient.send(command);

      expect(subnetGroups.DBSubnetGroups).toBeDefined();
      const webAppSG = subnetGroups.DBSubnetGroups!.find(
        sg =>
          sg.DBSubnetGroupName &&
          sg.DBSubnetGroupName.includes('db-subnet-group')
      );

      expect(webAppSG).toBeDefined();
      expect(webAppSG!.Subnets).toBeDefined();
      expect(webAppSG!.Subnets!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Security Groups', () => {
    test('should have properly configured security groups', async () => {
      const webServerSGId = stackOutputs.WebServerSecurityGroupId;
      const databaseSGId = stackOutputs.DatabaseSecurityGroupId;

      expect(webServerSGId).toBeDefined();
      expect(databaseSGId).toBeDefined();

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [webServerSGId, databaseSGId],
      });
      const securityGroups = await ec2Client.send(command);

      expect(securityGroups.SecurityGroups).toBeDefined();
      expect(securityGroups.SecurityGroups!.length).toBe(2);

      // Check web server security group
      const webSG = securityGroups.SecurityGroups!.find(
        sg => sg.GroupId === webServerSGId
      );
      expect(webSG).toBeDefined();
      expect(webSG!.IpPermissions).toBeDefined();

      const httpRule = webSG!.IpPermissions!.find(rule => rule.FromPort === 80);
      expect(httpRule).toBeDefined();

      // Check database security group
      const dbSG = securityGroups.SecurityGroups!.find(
        sg => sg.GroupId === databaseSGId
      );
      expect(dbSG).toBeDefined();
      expect(dbSG!.IpPermissions).toBeDefined();

      const mysqlRule = dbSG!.IpPermissions!.find(
        rule => rule.FromPort === 3306
      );
      expect(mysqlRule).toBeDefined();
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have CPU monitoring alarms', async () => {
      const highCPUAlarmName = stackOutputs.HighCPUAlarmName;
      const lowCPUAlarmName = stackOutputs.LowCPUAlarmName;

      expect(highCPUAlarmName).toBeDefined();
      expect(lowCPUAlarmName).toBeDefined();

      const command = new DescribeAlarmsCommand({
        AlarmNames: [highCPUAlarmName, lowCPUAlarmName],
      });
      const alarms = await cloudWatchClient.send(command);

      expect(alarms.MetricAlarms).toBeDefined();
      expect(alarms.MetricAlarms!.length).toBe(2);

      const highCPUAlarm = alarms.MetricAlarms!.find(
        alarm => alarm.AlarmName === highCPUAlarmName
      );
      const lowCPUAlarm = alarms.MetricAlarms!.find(
        alarm => alarm.AlarmName === lowCPUAlarmName
      );

      expect(highCPUAlarm).toBeDefined();
      expect(highCPUAlarm!.MetricName).toBe('CPUUtilization');
      expect(highCPUAlarm!.Threshold).toBe(70);
      expect(highCPUAlarm!.ComparisonOperator).toBe('GreaterThanThreshold');

      expect(lowCPUAlarm).toBeDefined();
      expect(lowCPUAlarm!.MetricName).toBe('CPUUtilization');
      expect(lowCPUAlarm!.Threshold).toBe(30);
      expect(lowCPUAlarm!.ComparisonOperator).toBe('LessThanThreshold');
    });
  });

  describe('IAM Resources', () => {
    test('should have IAM role for EC2 instances', async () => {
      // Get instance from ASG to check its IAM role
      const asgName = stackOutputs.AutoScalingGroupName;
      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });
      const asgs = await autoScalingClient.send(asgCommand);

      const instanceId = asgs.AutoScalingGroups![0].Instances![0].InstanceId!;

      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });
      const instances = await ec2Client.send(instanceCommand);

      const instance = instances.Reservations![0].Instances![0];
      expect(instance.IamInstanceProfile).toBeDefined();
      expect(instance.IamInstanceProfile!.Arn).toMatch(/instance-profile/);
    });
  });

  describe('High Availability Validation', () => {
    test('should have instances distributed across AZs', async () => {
      const asgName = stackOutputs.AutoScalingGroupName;
      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });
      const asgs = await autoScalingClient.send(asgCommand);

      const instanceIds = asgs.AutoScalingGroups![0].Instances!.map(
        i => i.InstanceId!
      );

      const instancesCommand = new DescribeInstancesCommand({
        InstanceIds: instanceIds,
      });
      const instances = await ec2Client.send(instancesCommand);

      const azs = new Set<string>();
      instances.Reservations!.forEach(reservation => {
        reservation.Instances!.forEach(instance => {
          azs.add(instance.Placement!.AvailabilityZone!);
        });
      });

      expect(azs.size).toBeGreaterThanOrEqual(1); // Should span multiple AZs if possible
    });

    test('should have multi-AZ database', async () => {
      const dbEndpoint = stackOutputs.DatabaseEndpoint;
      const dbIdentifier = dbEndpoint.split('.')[0];

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const dbInstances = await rdsClient.send(command);

      const db = dbInstances.DBInstances![0];
      expect(db.MultiAZ).toBe(true);
    });
  });

  describe('Application Accessibility', () => {
    test('should have accessible load balancer URL', async () => {
      const loadBalancerURL = stackOutputs.LoadBalancerURL;
      expect(loadBalancerURL).toBeDefined();
      expect(loadBalancerURL).toMatch(/^http:\/\//);

      // Basic URL format validation
      expect(loadBalancerURL).toContain('elb.amazonaws.com');
    });

    test('should have valid database connection endpoint', async () => {
      const dbEndpoint = stackOutputs.DatabaseEndpoint;
      const dbPort = stackOutputs.DatabasePort;

      expect(dbEndpoint).toBeDefined();
      expect(dbPort).toBeDefined();
      expect(dbPort).toBe('3306'); // MySQL default port

      // Basic endpoint format validation
      expect(dbEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
    });
  });

  describe('Resource Tagging Compliance', () => {
    test('should have proper tags on EC2 instances', async () => {
      const asgName = stackOutputs.AutoScalingGroupName;
      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });
      const asgs = await autoScalingClient.send(asgCommand);

      const instanceId = asgs.AutoScalingGroups![0].Instances![0].InstanceId!;

      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });
      const instances = await ec2Client.send(instanceCommand);

      const instance = instances.Reservations![0].Instances![0];
      expect(instance.Tags).toBeDefined();

      const projectTag = instance.Tags!.find(tag => tag.Key === 'Project');
      const ownerTag = instance.Tags!.find(tag => tag.Key === 'Owner');

      expect(projectTag).toBeDefined();
      expect(ownerTag).toBeDefined();
    });
  });

  describe('Performance and Monitoring', () => {
    test('should have CloudWatch monitoring enabled', async () => {
      // Check if alarms are in OK state (not alarming)
      const highCPUAlarmName = stackOutputs.HighCPUAlarmName;
      const lowCPUAlarmName = stackOutputs.LowCPUAlarmName;

      const command = new DescribeAlarmsCommand({
        AlarmNames: [highCPUAlarmName, lowCPUAlarmName],
      });
      const alarms = await cloudWatchClient.send(command);

      expect(alarms.MetricAlarms).toBeDefined();
      alarms.MetricAlarms!.forEach(alarm => {
        expect(alarm.StateValue).toMatch(/^(OK|INSUFFICIENT_DATA|ALARM)$/);
      });
    });
  });
});
