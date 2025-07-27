import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import { DescribeTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DescribeInstancesCommand,
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
import { GetTopicAttributesCommand, SNSClient } from '@aws-sdk/client-sns';
import fs from 'fs';

// Configuration - These are coming from cfn-outputs after CloudFormation deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS clients
const ec2Client = new EC2Client({ region: 'us-east-1' });
const elbClient = new ElasticLoadBalancingV2Client({ region: 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const asgClient = new AutoScalingClient({ region: 'us-east-1' });
const snsClient = new SNSClient({ region: 'us-east-1' });

describe('Multi-Environment Infrastructure Integration Tests', () => {
  describe('VPC and Networking', () => {
    test('VPC should be created and properly configured', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);

      const vpc = response.Vpcs?.[0];
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc?.State).toBe('available');
      expect(vpc?.DhcpOptionsId).toBeDefined();
    });

    test('Public and private subnets should be created in multiple AZs', async () => {
      const publicSubnetIds = outputs.PublicSubnets.split(',');
      const privateSubnetIds = outputs.PrivateSubnets.split(',');

      const command = new DescribeSubnetsCommand({
        SubnetIds: [...publicSubnetIds, ...privateSubnetIds],
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(4);

      // Check public subnets
      const publicSubnets =
        response.Subnets?.filter(subnet =>
          publicSubnetIds.includes(subnet.SubnetId || '')
        ) || [];
      expect(publicSubnets).toHaveLength(2);
      expect(publicSubnets.every(subnet => subnet.MapPublicIpOnLaunch)).toBe(
        true
      );

      // Check private subnets
      const privateSubnets =
        response.Subnets?.filter(subnet =>
          privateSubnetIds.includes(subnet.SubnetId || '')
        ) || [];
      expect(privateSubnets).toHaveLength(2);
      expect(privateSubnets.every(subnet => !subnet.MapPublicIpOnLaunch)).toBe(
        true
      );

      // Verify subnets are in different AZs
      const azs = new Set(
        response.Subnets?.map(subnet => subnet.AvailabilityZone) || []
      );
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    test('Security groups should be properly configured', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      const securityGroups = response.SecurityGroups;

      // Should have ALB and WebServer security groups plus default
      expect(securityGroups?.length).toBeGreaterThanOrEqual(3);

      // Check ALB security group
      const albSG = securityGroups?.find(sg => sg.GroupName?.includes('ALB'));
      expect(albSG).toBeDefined();
      expect(albSG?.IpPermissions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
          }),
          expect.objectContaining({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
          }),
        ])
      );

      // Check WebServer security group
      const webSG = securityGroups?.find(sg =>
        sg.GroupName?.includes('WebServer')
      );
      expect(webSG).toBeDefined();
      expect(webSG?.IpPermissions?.some(rule => rule.FromPort === 80)).toBe(
        true
      );
      expect(webSG?.IpPermissions?.some(rule => rule.FromPort === 22)).toBe(
        true
      );
    });
  });

  describe('Load Balancer and Auto Scaling', () => {
    test('Application Load Balancer should be running and healthy', async () => {
      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [outputs.ApplicationLoadBalancerArn],
      });

      const response = await elbClient.send(command);
      expect(response.LoadBalancers).toHaveLength(1);

      const alb = response.LoadBalancers?.[0];
      expect(alb?.State?.Code).toBe('active');
      expect(alb?.Scheme).toBe('internet-facing');
      expect(alb?.Type).toBe('application');
      expect(alb?.AvailabilityZones).toHaveLength(2);
      expect(alb?.DNSName).toBe(outputs.ApplicationLoadBalancerDNS);
    });

    test('Target Group should be configured correctly', async () => {
      const command = new DescribeTargetGroupsCommand({
        LoadBalancerArn: outputs.ApplicationLoadBalancerArn,
      });

      const response = await elbClient.send(command);
      expect(response.TargetGroups).toHaveLength(1);

      const targetGroup = response.TargetGroups?.[0];
      expect(targetGroup?.Protocol).toBe('HTTP');
      expect(targetGroup?.Port).toBe(80);
      expect(targetGroup?.HealthCheckPath).toBe('/');
      expect(targetGroup?.HealthCheckIntervalSeconds).toBe(30);
    });

    test('Auto Scaling Group should be configured properly', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.AutoScalingGroupName],
      });

      const response = await asgClient.send(command);
      expect(response.AutoScalingGroups).toHaveLength(1);

      const asg = response.AutoScalingGroups?.[0];
      expect(asg?.MinSize).toBeGreaterThanOrEqual(1);
      expect(asg?.MaxSize).toBeGreaterThanOrEqual(asg?.MinSize || 0);
      expect(asg?.DesiredCapacity).toBeGreaterThanOrEqual(asg?.MinSize || 0);
      expect(asg?.VPCZoneIdentifier).toContain(
        outputs.PrivateSubnets.split(',')[0]
      );
      expect(asg?.HealthCheckType).toBe('ELB');
    });

    test('EC2 instances should be running in private subnets', async () => {
      // Get instances from ASG
      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.AutoScalingGroupName],
      });

      const asgResponse = await asgClient.send(asgCommand);
      const instanceIds =
        asgResponse.AutoScalingGroups?.[0]?.Instances?.map(
          instance => instance.InstanceId
        ).filter((id): id is string => id !== undefined) || [];

      if (instanceIds.length > 0) {
        const instancesCommand = new DescribeInstancesCommand({
          InstanceIds: instanceIds,
        });

        const instancesResponse = await ec2Client.send(instancesCommand);
        const instances =
          instancesResponse.Reservations?.flatMap(
            reservation => reservation.Instances || []
          ) || [];

        // All instances should be in private subnets
        const privateSubnetIds = outputs.PrivateSubnets.split(',');
        instances.forEach(instance => {
          if (instance) {
            expect(privateSubnetIds).toContain(instance.SubnetId);
            expect(instance.State?.Name).toMatch(/running|pending/);
          }
        });
      }
    });
  });

  describe('DynamoDB Table', () => {
    test('DynamoDB table should be created and accessible', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.TurnAroundPromptTableName,
      });

      const response = await dynamoClient.send(command);
      const table = response.Table;

      expect(table?.TableName).toBe(outputs.TurnAroundPromptTableName);
      expect(table?.TableStatus).toBe('ACTIVE');
      expect(table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');

      // Check key schema
      expect(table?.KeySchema).toHaveLength(1);
      expect(table?.KeySchema?.[0].AttributeName).toBe('id');
      expect(table?.KeySchema?.[0].KeyType).toBe('HASH');

      // Check attribute definitions
      expect(table?.AttributeDefinitions).toHaveLength(1);
      expect(table?.AttributeDefinitions?.[0].AttributeName).toBe('id');
      expect(table?.AttributeDefinitions?.[0].AttributeType).toBe('S');
    });
  });

  describe('Monitoring and Notifications', () => {
    test('SNS topic should be created for alerts', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.SNSTopicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(outputs.SNSTopicArn);
    });
  });

  describe('End-to-End Workflow Validation', () => {
    test('Load balancer should be accessible via HTTP', async () => {
      const response = await fetch(
        `http://${outputs.ApplicationLoadBalancerDNS}/`
      );
      expect(response.status).toBe(200);

      const body = await response.text();
      expect(body).toContain('Environment:');
      expect(body).toContain('Instance ID:');
    });

    test('Infrastructure should support multi-environment deployment', async () => {
      // Verify environment-specific configurations are applied
      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.AutoScalingGroupName],
      });

      const asgResponse = await asgClient.send(asgCommand);
      const asg = asgResponse.AutoScalingGroups?.[0];

      // Environment-specific scaling should be applied
      if (environmentSuffix === 'prod') {
        expect(asg?.MinSize).toBeGreaterThanOrEqual(2);
        expect(asg?.MaxSize).toBeGreaterThanOrEqual(5);
      } else if (environmentSuffix === 'dev') {
        expect(asg?.MinSize).toBe(1);
        expect(asg?.MaxSize).toBeLessThanOrEqual(3);
      }
    });

    test('Resources should be properly tagged', async () => {
      // Check VPC tags
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });

      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpc = vpcResponse.Vpcs?.[0];

      const environmentTag = vpc?.Tags?.find(tag => tag.Key === 'Environment');
      expect(environmentTag).toBeDefined();

      const ownerTag = vpc?.Tags?.find(tag => tag.Key === 'Owner');
      expect(ownerTag).toBeDefined();

      const costCenterTag = vpc?.Tags?.find(tag => tag.Key === 'CostCenter');
      expect(costCenterTag).toBeDefined();
    });
  });

  describe('Security Validation', () => {
    test('Production environment should have restricted SSH access', async () => {
      if (environmentSuffix === 'prod') {
        const command = new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VPCId],
            },
            {
              Name: 'group-name',
              Values: [`*WebServer*`],
            },
          ],
        });

        const response = await ec2Client.send(command);
        const webServerSG = response.SecurityGroups?.[0];

        const sshRule = webServerSG?.IpPermissions?.find(
          rule => rule.FromPort === 22
        );
        expect(sshRule).toBeDefined();

        // SSH should only be allowed from VPC CIDR in production
        const allowedCidrs =
          sshRule?.IpRanges?.map(range => range.CidrIp) || [];
        expect(allowedCidrs).toContain('10.0.0.0/16');
        expect(allowedCidrs).not.toContain('0.0.0.0/0');
      }
    });

    test('All resources should be in expected VPC', async () => {
      // Verify all networking resources are in the correct VPC
      const subnets = outputs.PublicSubnets.split(',').concat(
        outputs.PrivateSubnets.split(',')
      );

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnets,
      });

      const response = await ec2Client.send(command);
      response.Subnets?.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs.VPCId);
      });
    });
  });
});
