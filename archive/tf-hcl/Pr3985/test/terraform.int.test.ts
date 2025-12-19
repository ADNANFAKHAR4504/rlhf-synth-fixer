// tests/integration/terraform.int.test.ts
// Integration tests for deployed AWS infrastructure
// These tests validate actual AWS resources are created and configured correctly

import fs from 'fs';
import path from 'path';
import { EC2 } from '@aws-sdk/client-ec2';
import { RDS } from '@aws-sdk/client-rds';
import { AutoScaling } from '@aws-sdk/client-auto-scaling';
import { CloudWatch } from '@aws-sdk/client-cloudwatch';
import { SNS } from '@aws-sdk/client-sns';
import { CloudWatchLogs } from '@aws-sdk/client-cloudwatch-logs';

// AWS SDK clients
const ec2 = new EC2({ region: 'us-east-1' });
const rds = new RDS({ region: 'us-east-1' });
const autoscaling = new AutoScaling({ region: 'us-east-1' });
const cloudwatch = new CloudWatch({ region: 'us-east-1' });
const sns = new SNS({ region: 'us-east-1' });
const logs = new CloudWatchLogs({ region: 'us-east-1' });

interface TerraformOutputs {
  vpc_id?: string;
  public_subnet_ids?: string[];
  private_subnet_ids?: string[];
  autoscaling_group_name?: string;
  rds_endpoint?: string;
  sns_topic_arn?: string;
  cloudwatch_alarm_name?: string;
}

describe('Production VPC Infrastructure Integration Tests', () => {
  let outputs: TerraformOutputs = {};
  let isDeployed = false;

  beforeAll(async () => {
    try {
      const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
      if (fs.existsSync(outputsPath)) {
        const fileContent = fs.readFileSync(outputsPath, 'utf8');
        outputs = JSON.parse(fileContent);
        // Check if outputs has actual values
        isDeployed = outputs.vpc_id !== undefined && outputs.vpc_id !== null && outputs.vpc_id !== '';
        console.log('Loaded outputs:', outputs);
        if (!isDeployed) {
          console.warn('⚠️  Infrastructure not deployed yet. Skipping integration tests.');
        }
      } else {
        console.warn('⚠️  Infrastructure not deployed yet. Skipping integration tests.');
      }
    } catch (error) {
      console.error('Error loading outputs:', error);
    }
  }, 30000);

  describe('VPC and Networking', () => {
    test('should create VPC with correct configuration', async () => {
      if (!isDeployed) {
        console.log('Skipping: Infrastructure not deployed');
        return;
      }
      if (!outputs.vpc_id) {
        throw new Error('VPC ID not found in outputs');
      }

      const response = await ec2.describeVpcs({ VpcIds: [outputs.vpc_id] });
      const vpcs = response.Vpcs || [];

      expect(vpcs).toHaveLength(1);
      const vpc = vpcs[0];
      
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
      
      // VPC attributes need to be fetched separately in AWS SDK v3
      const attrsResponse = await ec2.describeVpcAttribute({
        VpcId: outputs.vpc_id,
        Attribute: 'enableDnsHostnames'
      });
      expect(attrsResponse.EnableDnsHostnames?.Value).toBe(true);
      
      const supportResponse = await ec2.describeVpcAttribute({
        VpcId: outputs.vpc_id,
        Attribute: 'enableDnsSupport'
      });
      expect(supportResponse.EnableDnsSupport?.Value).toBe(true);
      
      // Check tags
      const nameTag = vpc.Tags?.find(tag => tag.Key === 'Name');
      const envTag = vpc.Tags?.find(tag => tag.Key === 'Environment');
      const projTag = vpc.Tags?.find(tag => tag.Key === 'Project');
      
      expect(nameTag?.Value).toBe('ProdVPC');
      expect(envTag?.Value).toBe('Production');
      expect(projTag?.Value).toBe('BusinessCriticalVPC');
    }, 30000);

    test('should create public and private subnets', async () => {
      if (!isDeployed) {
        console.log('Skipping: Infrastructure not deployed');
        return;
      }
      if (!outputs.public_subnet_ids || !outputs.private_subnet_ids) {
        throw new Error('Subnet IDs not found in outputs');
      }

      // Test public subnets
      const publicResponse = await ec2.describeSubnets({
        SubnetIds: outputs.public_subnet_ids
      });
      const publicSubnets = publicResponse.Subnets || [];

      expect(publicSubnets).toHaveLength(2);
      publicSubnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.State).toBe('available');
      });

      // Test private subnets
      const privateResponse = await ec2.describeSubnets({
        SubnetIds: outputs.private_subnet_ids
      });
      const privateSubnets = privateResponse.Subnets || [];

      expect(privateSubnets).toHaveLength(2);
      privateSubnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.State).toBe('available');
      });

      // Verify subnets are in different AZs
      const publicAZs = publicSubnets.map(s => s.AvailabilityZone);
      const privateAZs = privateSubnets.map(s => s.AvailabilityZone);
      
      expect(new Set(publicAZs).size).toBe(2);
      expect(new Set(privateAZs).size).toBe(2);
    }, 30000);

    test('should create Internet Gateway and NAT Gateways', async () => {
      if (!isDeployed) {
        console.log('Skipping: Infrastructure not deployed');
        return;
      }
      if (!outputs.vpc_id) {
        throw new Error('VPC ID not found in outputs');
      }

      // Check Internet Gateway
      const igwResponse = await ec2.describeInternetGateways({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [outputs.vpc_id]
          }
        ]
      });
      const internetGateways = igwResponse.InternetGateways || [];

      expect(internetGateways).toHaveLength(1);
      const igw = internetGateways[0];
      expect(igw.Attachments?.[0]?.State).toBe('available');

      // Check NAT Gateways
      const natResponse = await ec2.describeNatGateways({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id]
          }
        ]
      });
      const natGateways = natResponse.NatGateways || [];

      expect(natGateways.length).toBe(2);
      natGateways.forEach(natGw => {
        expect(natGw.State).toBe('available');
      });
    }, 30000);

    test('should configure VPC Flow Logs', async () => {
      if (!isDeployed) {
        console.log('Skipping: Infrastructure not deployed');
        return;
      }
      if (!outputs.vpc_id) {
        throw new Error('VPC ID not found in outputs');
      }

      const flowLogsResponse = await ec2.describeFlowLogs({
        Filter: [
          {
            Name: 'resource-id',
            Values: [outputs.vpc_id]
          }
        ]
      });
      const flowLogs = flowLogsResponse.FlowLogs || [];

      expect(flowLogs.length).toBeGreaterThanOrEqual(1);
      const flowLog = flowLogs.find(fl => fl.ResourceId === outputs.vpc_id);
      expect(flowLog?.TrafficType).toBe('ALL');
      expect(flowLog?.FlowLogStatus).toBe('ACTIVE');

      // Check CloudWatch Log Group
      const logGroupResponse = await logs.describeLogGroups({
        logGroupNamePrefix: 'ProdVPCFlowLogs'
      });
      const logGroups = logGroupResponse.logGroups || [];

      expect(logGroups.length).toBeGreaterThanOrEqual(1);
    }, 30000);
  });

  describe('Auto Scaling Group', () => {
    test('should create Auto Scaling Group with correct configuration', async () => {
      if (!isDeployed) {
        console.log('Skipping: Infrastructure not deployed');
        return;
      }
      if (!outputs.autoscaling_group_name) {
        throw new Error('Auto Scaling Group name not found in outputs');
      }

      const response = await autoscaling.describeAutoScalingGroups({
        AutoScalingGroupNames: [outputs.autoscaling_group_name]
      });
      const autoScalingGroups = response.AutoScalingGroups || [];

      expect(autoScalingGroups).toHaveLength(1);
      const asg = autoScalingGroups[0];
      
      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(6);
      expect(asg.DesiredCapacity).toBe(2);
      expect(asg.VPCZoneIdentifier?.split(',')).toHaveLength(2); // 2 private subnets
    }, 30000);

    test('should have instances running in private subnets', async () => {
      if (!isDeployed) {
        console.log('Skipping: Infrastructure not deployed');
        return;
      }
      if (!outputs.autoscaling_group_name) {
        throw new Error('Auto Scaling Group name not found in outputs');
      }

      const asgResponse = await autoscaling.describeAutoScalingGroups({
        AutoScalingGroupNames: [outputs.autoscaling_group_name]
      });
      const autoScalingGroups = asgResponse.AutoScalingGroups || [];
      const asg = autoScalingGroups[0];
      const instanceIds = asg.Instances?.map(i => i.InstanceId!) || [];
      
      if (instanceIds.length > 0) {
        const instanceResponse = await ec2.describeInstances({
          InstanceIds: instanceIds
        });
        const reservations = instanceResponse.Reservations || [];
        const instances = reservations.flatMap(r => r.Instances || []);
        
        instances.forEach(instance => {
          expect(instance.State?.Name).toMatch(/running|pending/);
          expect(outputs.private_subnet_ids).toContain(instance.SubnetId);
        });
      }
    }, 30000);

    test('should validate Launch Template configuration', async () => {
      if (!isDeployed) {
        console.log('Skipping: Infrastructure not deployed');
        return;
      }
      if (!outputs.autoscaling_group_name) {
        throw new Error('Auto Scaling Group name not found in outputs');
      }

      const asgResponse = await autoscaling.describeAutoScalingGroups({
        AutoScalingGroupNames: [outputs.autoscaling_group_name]
      });
      const autoScalingGroups = asgResponse.AutoScalingGroups || [];
      const asg = autoScalingGroups[0];
      const launchTemplateId = asg.LaunchTemplate?.LaunchTemplateId;

      if (!launchTemplateId) {
        throw new Error('Launch Template ID not found');
      }

      const ltResponse = await ec2.describeLaunchTemplates({
        LaunchTemplateIds: [launchTemplateId]
      });
      const launchTemplates = ltResponse.LaunchTemplates || [];

      expect(launchTemplates).toHaveLength(1);

      const ltVersionResponse = await ec2.describeLaunchTemplateVersions({
        LaunchTemplateId: launchTemplateId,
        Versions: ['$Latest']
      });
      const ltVersions = ltVersionResponse.LaunchTemplateVersions || [];

      const ltVersion = ltVersions[0];
      expect(ltVersion.LaunchTemplateData?.ImageId).toBe('ami-0abcdef1234567890');
    }, 30000);
  });

  describe('RDS Database', () => {
    test('should create RDS instance with correct configuration', async () => {
      if (!isDeployed) {
        console.log('Skipping: Infrastructure not deployed');
        return;
      }
      if (!outputs.rds_endpoint) {
        throw new Error('RDS endpoint not found in outputs');
      }

      // Extract DB instance identifier from endpoint
      const dbIdentifier = outputs.rds_endpoint.split('.')[0];

      const response = await rds.describeDBInstances({
        DBInstanceIdentifier: dbIdentifier
      });
      const dbInstances = response.DBInstances || [];

      expect(dbInstances).toHaveLength(1);
      const dbInstance = dbInstances[0];
      
      expect(dbInstance.Engine).toBe('mysql');
      expect(dbInstance.EngineVersion).toMatch(/^8\.0/);
      expect(dbInstance.DBInstanceClass).toBe('db.t3.micro');
      expect(dbInstance.PubliclyAccessible).toBe(false);
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.DBInstanceStatus).toMatch(/available|creating/);
    }, 30000);

    test('should place RDS in private subnets', async () => {
      if (!isDeployed) {
        console.log('Skipping: Infrastructure not deployed');
        return;
      }
      if (!outputs.rds_endpoint || !outputs.private_subnet_ids) {
        throw new Error('RDS endpoint or private subnet IDs not found in outputs');
      }

      const dbIdentifier = outputs.rds_endpoint.split('.')[0];

      const response = await rds.describeDBInstances({
        DBInstanceIdentifier: dbIdentifier
      });
      const dbInstances = response.DBInstances || [];
      const dbInstance = dbInstances[0];
      const dbSubnetGroup = dbInstance.DBSubnetGroup;
      
      expect(dbSubnetGroup?.Subnets).toHaveLength(2);
      dbSubnetGroup?.Subnets?.forEach(subnet => {
        expect(outputs.private_subnet_ids).toContain(subnet.SubnetIdentifier);
      });
    }, 30000);
  });

  describe('Monitoring and Alerts', () => {
    test('should create SNS topic for alerts', async () => {
      if (!isDeployed) {
        console.log('Skipping: Infrastructure not deployed');
        return;
      }
      if (!outputs.sns_topic_arn) {
        throw new Error('SNS topic ARN not found in outputs');
      }

      const response = await sns.listTopics();
      const topics = response.Topics || [];
      const topic = topics.find(t => t.TopicArn === outputs.sns_topic_arn);
      
      expect(topic).toBeDefined();

      // Check topic attributes
      const attrsResponse = await sns.getTopicAttributes({
        TopicArn: outputs.sns_topic_arn
      });
      const attributes = attrsResponse.Attributes || {};

      expect(attributes.DisplayName).toBe('ProdAlertTopic');
    }, 30000);

    test('should create CloudWatch alarm for CPU utilization', async () => {
      if (!isDeployed) {
        console.log('Skipping: Infrastructure not deployed');
        return;
      }
      if (!outputs.cloudwatch_alarm_name) {
        throw new Error('CloudWatch alarm name not found in outputs');
      }

      const response = await cloudwatch.describeAlarms({
        AlarmNames: [outputs.cloudwatch_alarm_name]
      });
      const metricAlarms = response.MetricAlarms || [];

      expect(metricAlarms).toHaveLength(1);
      const alarm = metricAlarms[0];
      
      expect(alarm.MetricName).toBe('CPUUtilization');
      expect(alarm.Namespace).toBe('AWS/EC2');
      expect(alarm.Threshold).toBe(80);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.AlarmActions).toContain(outputs.sns_topic_arn);
    }, 30000);

    test('should verify email subscription to SNS topic', async () => {
      if (!isDeployed) {
        console.log('Skipping: Infrastructure not deployed');
        return;
      }
      if (!outputs.sns_topic_arn) {
        throw new Error('SNS topic ARN not found in outputs');
      }

      const response = await sns.listSubscriptionsByTopic({
        TopicArn: outputs.sns_topic_arn
      });
      const subscriptions = response.Subscriptions || [];

      const emailSubscription = subscriptions.find(s => s.Protocol === 'email');
      expect(emailSubscription).toBeDefined();
      expect(emailSubscription?.Endpoint).toBe('alerts@company.com');
    }, 30000);
  });

  describe('Security Configuration', () => {
    test('should validate EC2 security group rules', async () => {
      if (!isDeployed) {
        console.log('Skipping: Infrastructure not deployed');
        return;
      }
      if (!outputs.vpc_id) {
        throw new Error('VPC ID not found in outputs');
      }

      const response = await ec2.describeSecurityGroups({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id]
          },
          {
            Name: 'group-name',
            Values: ['ProdEC2SecurityGroup']
          }
        ]
      });
      const securityGroups = response.SecurityGroups || [];

      expect(securityGroups).toHaveLength(1);
      const sg = securityGroups[0];
      const ipPermissions = sg.IpPermissions || [];
      
      // Check ingress rules
      const httpRule = ipPermissions.find(rule => rule.FromPort === 80);
      const httpsRule = ipPermissions.find(rule => rule.FromPort === 443);
      const sshRule = ipPermissions.find(rule => rule.FromPort === 22);
      
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(sshRule).toBeDefined();
      
      // SSH should be restricted
      const sshCidr = sshRule?.IpRanges?.[0]?.CidrIp;
      expect(sshCidr).toMatch(/^203\.0\.113\.0\/(32|24)$/);
    }, 30000);

    test('should validate RDS security group configuration', async () => {
      if (!isDeployed) {
        console.log('Skipping: Infrastructure not deployed');
        return;
      }
      if (!outputs.vpc_id) {
        throw new Error('VPC ID not found in outputs');
      }

      const response = await ec2.describeSecurityGroups({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id]
          },
          {
            Name: 'group-name',
            Values: ['ProdRDSSecurityGroup']
          }
        ]
      });
      const securityGroups = response.SecurityGroups || [];

      expect(securityGroups).toHaveLength(1);
      const rdsSg = securityGroups[0];
      const ipPermissions = rdsSg.IpPermissions || [];
      
      // Check MySQL port (3306) is open to EC2 security group only
      const mysqlRule = ipPermissions.find(rule => rule.FromPort === 3306);
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule?.UserIdGroupPairs).toHaveLength(1);
    }, 30000);
  });

  describe('Resource Tagging', () => {
    test('should verify consistent tagging across resources', async () => {
      if (!isDeployed) {
        console.log('Skipping: Infrastructure not deployed');
        return;
      }
      if (!outputs.vpc_id) {
        throw new Error('VPC ID not found in outputs');
      }

      // Check VPC tags
      const vpcResponse = await ec2.describeVpcs({
        VpcIds: [outputs.vpc_id]
      });
      const vpcs = vpcResponse.Vpcs || [];
      const vpc = vpcs[0];
      const envTag = vpc.Tags?.find(tag => tag.Key === 'Environment');
      const projTag = vpc.Tags?.find(tag => tag.Key === 'Project');
      
      expect(envTag?.Value).toBe('Production');
      expect(projTag?.Value).toBe('BusinessCriticalVPC');

      // Check subnet tags
      if (outputs.public_subnet_ids && outputs.public_subnet_ids.length > 0) {
        const subnetResponse = await ec2.describeSubnets({
          SubnetIds: [outputs.public_subnet_ids[0]]
        });
        const subnets = subnetResponse.Subnets || [];
        const subnet = subnets[0];
        const subnetEnvTag = subnet.Tags?.find(tag => tag.Key === 'Environment');
        const subnetProjTag = subnet.Tags?.find(tag => tag.Key === 'Project');
        
        expect(subnetEnvTag?.Value).toBe('Production');
        expect(subnetProjTag?.Value).toBe('BusinessCriticalVPC');
      }
    }, 30000);
  });
});
