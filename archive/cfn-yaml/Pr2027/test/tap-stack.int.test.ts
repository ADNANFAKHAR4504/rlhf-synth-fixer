import fs from 'fs';
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand
} from '@aws-sdk/client-ec2';
import {
  DynamoDBClient,
  DescribeTableCommand
} from '@aws-sdk/client-dynamodb';
import {
  CloudWatchClient,
  DescribeAlarmsCommand
} from '@aws-sdk/client-cloudwatch';
import {
  SNSClient,
  GetTopicAttributesCommand
} from '@aws-sdk/client-sns';
import {
  IAMClient,
  GetRoleCommand,
  GetRolePolicyCommand
} from '@aws-sdk/client-iam';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synthtrainr940';

// AWS Clients
const ec2Client = new EC2Client({ region: 'us-east-1' });
const dynamoDBClient = new DynamoDBClient({ region: 'us-east-1' });
const cloudWatchClient = new CloudWatchClient({ region: 'us-east-1' });
const snsClient = new SNSClient({ region: 'us-east-1' });
const iamClient = new IAMClient({ region: 'us-east-1' });

describe('Cloud Environment Infrastructure Integration Tests', () => {
  describe('VPC and Network Configuration', () => {
    test('VPC should exist with correct CIDR block', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });
      const response = await ec2Client.send(command);
      
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      expect(response.Vpcs![0].State).toBe('available');
    });

    test('Public subnets should exist with correct configuration', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id]
      });
      const response = await ec2Client.send(command);
      
      expect(response.Subnets).toHaveLength(2);
      
      const subnet1 = response.Subnets!.find(s => s.SubnetId === outputs.PublicSubnet1Id);
      const subnet2 = response.Subnets!.find(s => s.SubnetId === outputs.PublicSubnet2Id);
      
      expect(subnet1!.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet2!.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet1!.MapPublicIpOnLaunch).toBe(true);
      expect(subnet2!.MapPublicIpOnLaunch).toBe(true);
    });

    test('Private subnets should exist with correct configuration', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id]
      });
      const response = await ec2Client.send(command);
      
      expect(response.Subnets).toHaveLength(2);
      
      const subnet1 = response.Subnets!.find(s => s.SubnetId === outputs.PrivateSubnet1Id);
      const subnet2 = response.Subnets!.find(s => s.SubnetId === outputs.PrivateSubnet2Id);
      
      expect(subnet1!.CidrBlock).toBe('10.0.3.0/24');
      expect(subnet2!.CidrBlock).toBe('10.0.4.0/24');
      expect(subnet1!.MapPublicIpOnLaunch).toBe(false);
      expect(subnet2!.MapPublicIpOnLaunch).toBe(false);
    });

    test('Internet Gateway should be attached to VPC', async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [outputs.VPCId]
          }
        ]
      });
      const response = await ec2Client.send(command);
      
      expect(response.InternetGateways).toHaveLength(1);
      expect(response.InternetGateways![0].Attachments).toHaveLength(1);
      expect(response.InternetGateways![0].Attachments![0].State).toBe('available');
    });

    test('NAT Gateway should exist and be available', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId]
          },
          {
            Name: 'state',
            Values: ['available']
          }
        ]
      });
      const response = await ec2Client.send(command);
      
      // Filter the NAT gateways to find ones in our VPC
      const natGatewaysInVpc = response.NatGateways?.filter(ng => ng.VpcId === outputs.VPCId) || [];
      
      expect(natGatewaysInVpc).toHaveLength(1);
      expect(natGatewaysInVpc[0].State).toBe('available');
      expect(natGatewaysInVpc[0].SubnetId).toBe(outputs.PublicSubnet1Id);
    });

    test('Route tables should have correct routes configured', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId]
          }
        ]
      });
      const response = await ec2Client.send(command);
      
      // Should have at least 3 route tables (1 main, 1 public, 1 private)
      expect(response.RouteTables!.length).toBeGreaterThanOrEqual(3);
      
      // Check for route to Internet Gateway
      const publicRouteTable = response.RouteTables!.find(rt => 
        rt.Routes?.some(r => r.GatewayId && r.GatewayId.startsWith('igw-'))
      );
      expect(publicRouteTable).toBeDefined();
      
      // Check for route to NAT Gateway
      const privateRouteTable = response.RouteTables!.find(rt => 
        rt.Routes?.some(r => r.NatGatewayId)
      );
      expect(privateRouteTable).toBeDefined();
    });
  });

  describe('EC2 Instances', () => {
    test('EC2 instances should be running in private subnets', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.EC2Instance1Id, outputs.EC2Instance2Id]
      });
      const response = await ec2Client.send(command);
      
      expect(response.Reservations).toHaveLength(2);
      
      const instance1 = response.Reservations!.find(r => 
        r.Instances![0].InstanceId === outputs.EC2Instance1Id
      )?.Instances![0];
      const instance2 = response.Reservations!.find(r => 
        r.Instances![0].InstanceId === outputs.EC2Instance2Id
      )?.Instances![0];
      
      expect(instance1!.State!.Name).toBe('running');
      expect(instance2!.State!.Name).toBe('running');
      expect(instance1!.SubnetId).toBe(outputs.PrivateSubnet1Id);
      expect(instance2!.SubnetId).toBe(outputs.PrivateSubnet2Id);
      expect(instance1!.InstanceType).toBe('t3.micro');
      expect(instance2!.InstanceType).toBe('t3.micro');
    });

    test('EC2 instances should have correct IAM role attached', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.EC2Instance1Id]
      });
      const response = await ec2Client.send(command);
      
      const instance = response.Reservations![0].Instances![0];
      expect(instance.IamInstanceProfile).toBeDefined();
      expect(instance.IamInstanceProfile!.Arn).toContain('CloudEnvironment-EC2-InstanceProfile');
    });
  });

  describe('Security Configuration', () => {
    test('Security group should have correct SSH access rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.EC2SecurityGroupId]
      });
      const response = await ec2Client.send(command);
      
      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];
      
      // Check ingress rules
      const sshRule = sg.IpPermissions?.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22
      );
      expect(sshRule).toBeDefined();
      expect(sshRule!.IpProtocol).toBe('tcp');
      expect(sshRule!.IpRanges).toHaveLength(1);
      expect(sshRule!.IpRanges![0].CidrIp).toBe('10.0.0.0/16');
    });

    test('IAM role should exist with S3 read permissions', async () => {
      const roleName = 'CloudEnvironment-EC2-Role-' + environmentSuffix;
      
      const roleCommand = new GetRoleCommand({
        RoleName: roleName
      });
      const roleResponse = await iamClient.send(roleCommand);
      
      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role!.RoleName).toBe(roleName);
      
      // Check S3 policy
      const policyCommand = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: 'S3ReadOnlyAccess'
      });
      const policyResponse = await iamClient.send(policyCommand);
      
      expect(policyResponse.PolicyDocument).toBeDefined();
      const policyDoc = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument!));
      
      const s3Statement = policyDoc.Statement[0];
      expect(s3Statement.Effect).toBe('Allow');
      expect(s3Statement.Action).toContain('s3:GetObject');
      expect(s3Statement.Action).toContain('s3:ListBucket');
    });
  });

  describe('Monitoring and Alerting', () => {
    test('CloudWatch alarms should be configured for CPU usage', async () => {
      const alarmNames = [
        `CloudEnvironment-EC2-1-HighCPU-${environmentSuffix}`,
        `CloudEnvironment-EC2-2-HighCPU-${environmentSuffix}`
      ];
      
      const command = new DescribeAlarmsCommand({
        AlarmNames: alarmNames
      });
      const response = await cloudWatchClient.send(command);
      
      expect(response.MetricAlarms).toHaveLength(2);
      
      response.MetricAlarms!.forEach(alarm => {
        expect(alarm.MetricName).toBe('CPUUtilization');
        expect(alarm.Threshold).toBe(80);
        expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
        expect(alarm.Namespace).toBe('AWS/EC2');
        expect(alarm.Statistic).toBe('Average');
        expect(alarm.Period).toBe(300);
        expect(alarm.EvaluationPeriods).toBe(2);
      });
    });

    test('SNS topic should exist for alerts', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.SNSTopicArn
      });
      const response = await snsClient.send(command);
      
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(outputs.SNSTopicArn);
      expect(response.Attributes!.DisplayName).toBe('CloudWatch Alerts for Cloud Environment');
    });
  });

  describe('DynamoDB Table', () => {
    test('DynamoDB table should exist with correct configuration', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.TurnAroundPromptTableName
      });
      const response = await dynamoDBClient.send(command);
      
      expect(response.Table).toBeDefined();
      expect(response.Table!.TableStatus).toBe('ACTIVE');
      expect(response.Table!.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      expect(response.Table!.DeletionProtectionEnabled).toBe(false);
      
      // Check key schema
      const keySchema = response.Table!.KeySchema;
      expect(keySchema).toHaveLength(1);
      expect(keySchema![0].AttributeName).toBe('id');
      expect(keySchema![0].KeyType).toBe('HASH');
    });
  });

  describe('Resource Tagging Validation', () => {
    test('VPC and subnets should have proper tags', async () => {
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      
      const tags = vpcResponse.Vpcs![0].Tags || [];
      expect(tags.find(t => t.Key === 'Name')).toBeDefined();
      expect(tags.find(t => t.Key === 'Environment')).toBeDefined();
      expect(tags.find(t => t.Key === 'Project')).toBeDefined();
      expect(tags.find(t => t.Key === 'CostCenter')).toBeDefined();
    });

    test('EC2 instances should have proper tags', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.EC2Instance1Id]
      });
      const response = await ec2Client.send(command);
      
      const tags = response.Reservations![0].Instances![0].Tags || [];
      expect(tags.find(t => t.Key === 'Name')).toBeDefined();
      expect(tags.find(t => t.Key === 'Environment')).toBeDefined();
      expect(tags.find(t => t.Key === 'Project')).toBeDefined();
      expect(tags.find(t => t.Key === 'CostCenter')).toBeDefined();
      expect(tags.find(t => t.Key === 'MonitoringEnabled')).toBeDefined();
    });
  });

  describe('Network Connectivity Tests', () => {
    test('Private subnets should have route to NAT Gateway', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'association.subnet-id',
            Values: [outputs.PrivateSubnet1Id]
          }
        ]
      });
      const response = await ec2Client.send(command);
      
      expect(response.RouteTables).toHaveLength(1);
      const routes = response.RouteTables![0].Routes || [];
      const natRoute = routes.find(r => r.NatGatewayId);
      
      expect(natRoute).toBeDefined();
      expect(natRoute!.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('Public subnets should have route to Internet Gateway', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'association.subnet-id',
            Values: [outputs.PublicSubnet1Id]
          }
        ]
      });
      const response = await ec2Client.send(command);
      
      expect(response.RouteTables).toHaveLength(1);
      const routes = response.RouteTables![0].Routes || [];
      const igwRoute = routes.find(r => r.GatewayId && r.GatewayId.startsWith('igw-'));
      
      expect(igwRoute).toBeDefined();
      expect(igwRoute!.DestinationCidrBlock).toBe('0.0.0.0/0');
    });
  });
});