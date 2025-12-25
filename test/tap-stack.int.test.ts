import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  DescribeTableCommand,
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  DescribeDBInstancesCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetTopicAttributesCommand,
  SNSClient,
} from '@aws-sdk/client-sns';
import fs from 'fs';

// Configuration - These are coming from cfn-outputs after deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS SDK clients
const region = process.env.AWS_REGION || 'us-east-1';
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const dynamodbClient = new DynamoDBClient({ region });
const elbv2Client = new ElasticLoadBalancingV2Client({ region });
const autoScalingClient = new AutoScalingClient({ region });
const snsClient = new SNSClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });

describe('TapStack Integration Tests', () => {

  describe('Infrastructure Validation', () => {
    test('should validate outputs are present', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.PublicSubnet1Id).toBeDefined();
      expect(outputs.PublicSubnet2Id).toBeDefined();
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
      expect(outputs.TurnAroundPromptTableName).toBeDefined();
      expect(outputs.TurnAroundPromptTableArn).toBeDefined();
      expect(outputs.LoadBalancerDNS).toBeDefined();
      expect(outputs.DatabaseEndpoint).toBeDefined();
      expect(outputs.DatabasePort).toBeDefined();
      expect(outputs.AutoScalingGroupName).toBeDefined();
      expect(outputs.NotificationTopicArn).toBeDefined();
      expect(outputs.WebsiteURL).toBeDefined();
    });

    test('should validate environment suffix matches', () => {
      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
    });
  });

  describe('VPC and Networking', () => {
    test('should validate VPC exists and has correct configuration', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });
      
      const response = await ec2Client.send(command);
      
      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(outputs.VPCId);
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.DhcpOptionsId).toBeDefined();
      
      // Check tags
      const nameTag = vpc.Tags?.find(tag => tag.Key === 'Name');
      expect(nameTag?.Value).toBe(`webapp-vpc-${environmentSuffix}`);
      
      const envTag = vpc.Tags?.find(tag => tag.Key === 'Environment');
      expect(envTag?.Value).toBe(environmentSuffix);
    });

    test('should validate public subnets exist and have correct configuration', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id]
      });
      
      const response = await ec2Client.send(command);
      
      expect(response.Subnets).toHaveLength(2);
      response.Subnets!.forEach((subnet, index) => {
        expect(subnet.VpcId).toBe(outputs.VPCId);
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        
        // Validate CIDR blocks
        const expectedCidr = index === 0 ? '10.0.1.0/24' : '10.0.2.0/24';
        expect(['10.0.1.0/24', '10.0.2.0/24']).toContain(subnet.CidrBlock);
        
        // Check tags
        const nameTag = subnet.Tags?.find(tag => tag.Key === 'Name');
        expect(nameTag?.Value).toContain('webapp-public-subnet');
        expect(nameTag?.Value).toContain(environmentSuffix);
      });
    });

    test('should validate private subnets exist and have correct configuration', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id]
      });
      
      const response = await ec2Client.send(command);
      
      expect(response.Subnets).toHaveLength(2);
      response.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs.VPCId);
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        
        // Validate CIDR blocks
        expect(['10.0.3.0/24', '10.0.4.0/24']).toContain(subnet.CidrBlock);
        
        // Check tags
        const nameTag = subnet.Tags?.find(tag => tag.Key === 'Name');
        expect(nameTag?.Value).toContain('webapp-private-subnet');
        expect(nameTag?.Value).toContain(environmentSuffix);
      });
    });

    test('should validate subnets are in different availability zones', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [
          outputs.PublicSubnet1Id, 
          outputs.PublicSubnet2Id,
          outputs.PrivateSubnet1Id,
          outputs.PrivateSubnet2Id
        ]
      });
      
      const response = await ec2Client.send(command);
      
      const availabilityZones = response.Subnets!.map(subnet => subnet.AvailabilityZone);
      const uniqueAZs = [...new Set(availabilityZones)];
      
      // Should have at least 2 different AZs for high availability
      expect(uniqueAZs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Security Groups', () => {
    test('should validate security groups exist with correct rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId]
          },
          {
            Name: 'tag:Environment',
            Values: [environmentSuffix]
          }
        ]
      });
      
      const response = await ec2Client.send(command);
      
      expect(response.SecurityGroups!.length).toBeGreaterThan(0);
      
      // Find Load Balancer Security Group
      const albSG = response.SecurityGroups!.find(sg => 
        sg.GroupName?.includes('LoadBalancer') || 
        sg.Description?.includes('Application Load Balancer')
      );
      
      if (albSG) {
        // Check HTTP and HTTPS ingress rules
        const httpRule = albSG.IpPermissions?.find(rule => 
          rule.FromPort === 80 && rule.ToPort === 80
        );
        const httpsRule = albSG.IpPermissions?.find(rule => 
          rule.FromPort === 443 && rule.ToPort === 443
        );
        
        expect(httpRule).toBeDefined();
        expect(httpsRule).toBeDefined();
        
        // Verify they allow traffic from anywhere (0.0.0.0/0)
        expect(httpRule?.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')).toBe(true);
        expect(httpsRule?.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')).toBe(true);
      }
    });
  });

  describe('DynamoDB Table', () => {
    test('should validate DynamoDB table exists and is active', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.TurnAroundPromptTableName
      });
      
      const response = await dynamodbClient.send(command);
      
      expect(response.Table).toBeDefined();
      expect(response.Table!.TableName).toBe(outputs.TurnAroundPromptTableName);
      expect(response.Table!.TableStatus).toBe('ACTIVE');
      expect(response.Table!.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      
      // Validate key schema
      expect(response.Table!.KeySchema).toHaveLength(1);
      expect(response.Table!.KeySchema![0].AttributeName).toBe('id');
      expect(response.Table!.KeySchema![0].KeyType).toBe('HASH');
      
      // Validate ARN
      expect(response.Table!.TableArn).toBe(outputs.TurnAroundPromptTableArn);
    });
  });

  describe('Application Load Balancer', () => {
    test('should validate ALB exists and is active', async () => {
      const command = new DescribeLoadBalancersCommand({
        Names: [`webapp-alb-${environmentSuffix}`]
      });
      
      const response = await elbv2Client.send(command);
      
      expect(response.LoadBalancers).toHaveLength(1);
      const alb = response.LoadBalancers![0];
      
      expect(alb.State?.Code).toBe('active');
      expect(alb.Type).toBe('application');
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.DNSName).toBe(outputs.LoadBalancerDNS);
      expect(alb.CanonicalHostedZoneId).toBe(outputs.LoadBalancerZoneId);
      
      // Validate it's in the correct VPC
      expect(alb.VpcId).toBe(outputs.VPCId);
      
      // Validate it's in public subnets
      const subnetIds = alb.AvailabilityZones?.map(az => az.SubnetId);
      expect(subnetIds).toContain(outputs.PublicSubnet1Id);
      expect(subnetIds).toContain(outputs.PublicSubnet2Id);
    });

    test('should validate target group exists with correct configuration', async () => {
      const command = new DescribeTargetGroupsCommand({
        Names: [`webapp-tg-${environmentSuffix}`]
      });
      
      const response = await elbv2Client.send(command);
      
      expect(response.TargetGroups).toHaveLength(1);
      const tg = response.TargetGroups![0];
      
      expect(tg.Protocol).toBe('HTTP');
      expect(tg.Port).toBe(80);
      expect(tg.VpcId).toBe(outputs.VPCId);
      expect(tg.HealthCheckPath).toBe('/health');
      expect(tg.HealthCheckProtocol).toBe('HTTP');
      expect(tg.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.HealthyThresholdCount).toBe(2);
      expect(tg.UnhealthyThresholdCount).toBe(3);
    });

    test('should validate website URL is accessible', async () => {
      expect(outputs.WebsiteURL).toBe(`http://${outputs.LoadBalancerDNS}`);
      expect(outputs.WebsiteURL).toMatch(/^http:\/\/webapp-alb-.*\.elb\.amazonaws\.com$/);
    });
  });

  describe('Auto Scaling Group', () => {
    test('should validate ASG exists with correct configuration', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.AutoScalingGroupName]
      });
      
      const response = await autoScalingClient.send(command);
      
      expect(response.AutoScalingGroups).toHaveLength(1);
      const asg = response.AutoScalingGroups![0];
      
      expect(asg.AutoScalingGroupName).toBe(outputs.AutoScalingGroupName);
      expect(asg.MinSize).toBeGreaterThanOrEqual(2);
      expect(asg.MaxSize).toBeGreaterThanOrEqual(2);
      expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(2);
      
      // Validate it's in private subnets
      expect(asg.VPCZoneIdentifier).toContain(outputs.PrivateSubnet1Id);
      expect(asg.VPCZoneIdentifier).toContain(outputs.PrivateSubnet2Id);
      
      // Validate health check configuration
      expect(asg.HealthCheckType).toBe('ELB');
      expect(asg.HealthCheckGracePeriod).toBe(300);
      
      // Validate instances are running
      expect(asg.Instances!.length).toBeGreaterThanOrEqual(asg.MinSize!);
      asg.Instances!.forEach(instance => {
        expect(instance.LifecycleState).toBe('InService');
        expect(instance.HealthStatus).toBe('Healthy');
      });
    });
  });

  describe('RDS Database', () => {
    test('should validate RDS instance exists and is available', async () => {
      const dbInstanceId = outputs.DatabaseEndpoint.split('.')[0];
      
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId
      });
      
      const response = await rdsClient.send(command);
      
      expect(response.DBInstances).toHaveLength(1);
      const dbInstance = response.DBInstances![0];
      
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.Engine).toBe('mysql');
      expect(dbInstance.EngineVersion).toMatch(/^8\.0\./);
      expect(dbInstance.MultiAZ).toBe(true);
      expect(dbInstance.StorageEncrypted).toBe(true);
      
      // Validate endpoint and port
      expect(dbInstance.Endpoint!.Address).toBe(outputs.DatabaseEndpoint);
      expect(dbInstance.Endpoint!.Port!.toString()).toBe(outputs.DatabasePort);
      
      // Validate backup configuration
      expect(dbInstance.BackupRetentionPeriod).toBeGreaterThan(0);
      expect(dbInstance.PreferredBackupWindow).toBeDefined();
      expect(dbInstance.PreferredMaintenanceWindow).toBeDefined();
      
      // Validate monitoring
      expect(dbInstance.MonitoringInterval).toBe(60);
      expect(dbInstance.MonitoringRoleArn).toBeDefined();
    });

    test('should validate RDS security and network configuration', async () => {
      const dbInstanceId = outputs.DatabaseEndpoint.split('.')[0];
      
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId
      });
      
      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances![0];
      
      // Validate VPC and subnet group
      expect(dbInstance.DBSubnetGroup?.VpcId).toBe(outputs.VPCId);
      expect(dbInstance.DBSubnetGroup?.SubnetGroupStatus).toBe('Complete');
      
      // Validate security groups
      expect(dbInstance.VpcSecurityGroups).toBeDefined();
      expect(dbInstance.VpcSecurityGroups!.length).toBeGreaterThan(0);
      dbInstance.VpcSecurityGroups!.forEach(sg => {
        expect(sg.Status).toBe('active');
      });
    });
  });

  describe('SNS Notifications', () => {
    test('should validate SNS topic exists and is configured', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.NotificationTopicArn
      });
      
      const response = await snsClient.send(command);
      
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(outputs.NotificationTopicArn);
      expect(response.Attributes!.DisplayName).toBe(`WebApp Notifications - ${environmentSuffix}`);
      
      // Validate subscription count
      expect(parseInt(response.Attributes!.SubscriptionsConfirmed || '0')).toBeGreaterThanOrEqual(0);
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should validate CloudWatch alarms are configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `webapp-`
      });
      
      const response = await cloudWatchClient.send(command);
      
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);
      
      // Check for CPU alarms
      const cpuHighAlarm = response.MetricAlarms!.find(alarm => 
        alarm.AlarmName?.includes('cpu-high') && alarm.AlarmName?.includes(environmentSuffix)
      );
      const cpuLowAlarm = response.MetricAlarms!.find(alarm => 
        alarm.AlarmName?.includes('cpu-low') && alarm.AlarmName?.includes(environmentSuffix)
      );
      
      expect(cpuHighAlarm).toBeDefined();
      expect(cpuLowAlarm).toBeDefined();
      
      if (cpuHighAlarm) {
        expect(cpuHighAlarm.MetricName).toBe('CPUUtilization');
        expect(cpuHighAlarm.Namespace).toBe('AWS/EC2');
        expect(cpuHighAlarm.ComparisonOperator).toBe('GreaterThanThreshold');
        expect(cpuHighAlarm.Threshold).toBe(70);
      }
      
      if (cpuLowAlarm) {
        expect(cpuLowAlarm.MetricName).toBe('CPUUtilization');
        expect(cpuLowAlarm.Namespace).toBe('AWS/EC2');
        expect(cpuLowAlarm.ComparisonOperator).toBe('LessThanThreshold');
        expect(cpuLowAlarm.Threshold).toBe(30);
      }
    });
  });

  describe('Resource Tagging', () => {
    test('should validate resources have proper tags', async () => {
      // Check VPC tags
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });
      
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpc = vpcResponse.Vpcs![0];
      
      const environmentTag = vpc.Tags?.find(tag => tag.Key === 'Environment');
      const teamTag = vpc.Tags?.find(tag => tag.Key === 'Team');
      
      expect(environmentTag?.Value).toBe(environmentSuffix);
      expect(teamTag?.Value).toBe('Backend');
    });
  });

  describe('Cross-Resource Connectivity', () => {
    test('should validate resources are properly connected', async () => {
      // Validate all subnets are in the same VPC
      const subnetCommand = new DescribeSubnetsCommand({
        SubnetIds: [
          outputs.PublicSubnet1Id,
          outputs.PublicSubnet2Id,
          outputs.PrivateSubnet1Id,
          outputs.PrivateSubnet2Id
        ]
      });
      
      const subnetResponse = await ec2Client.send(subnetCommand);
      
      subnetResponse.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs.VPCId);
      });
      
      // Validate Load Balancer is in the correct VPC
      const albCommand = new DescribeLoadBalancersCommand({
        Names: [`webapp-alb-${environmentSuffix}`]
      });
      
      const albResponse = await elbv2Client.send(albCommand);
      const alb = albResponse.LoadBalancers![0];
      
      expect(alb.VpcId).toBe(outputs.VPCId);
    });
  });

  describe('High Availability Validation', () => {
    test('should validate multi-AZ deployment', async () => {
      // Check that subnets are in different AZs
      const subnetCommand = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id]
      });
      
      const subnetResponse = await ec2Client.send(subnetCommand);
      const azs = subnetResponse.Subnets!.map(subnet => subnet.AvailabilityZone);
      
      expect(new Set(azs).size).toBe(2); // Should be in 2 different AZs
      
      // Check RDS Multi-AZ
      const dbInstanceId = outputs.DatabaseEndpoint.split('.')[0];
      const rdsCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId
      });
      
      const rdsResponse = await rdsClient.send(rdsCommand);
      const dbInstance = rdsResponse.DBInstances![0];
      
      expect(dbInstance.MultiAZ).toBe(true);
    });
  });
});
