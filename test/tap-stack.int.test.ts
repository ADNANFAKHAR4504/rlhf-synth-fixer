import { CloudFormationClient, DescribeStacksCommand, DescribeStackResourcesCommand } from '@aws-sdk/client-cloudformation';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetGroupsCommand } from '@aws-sdk/client-elastic-load-balancing-v2';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { Route53Client, ListHostedZonesCommand } from '@aws-sdk/client-route-53';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';
import { AutoScalingClient, DescribeAutoScalingGroupsCommand } from '@aws-sdk/client-auto-scaling';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { BackupClient, ListBackupPlansCommand } from '@aws-sdk/client-backup';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';

const STACK_NAME = `TapStack${process.env.ENVIRONMENT_SUFFIX || 'dev'}`;
const REGION = process.env.AWS_REGION || 'us-east-1';

const cfnClient = new CloudFormationClient({ region: REGION });
const ec2Client = new EC2Client({ region: REGION });
const elbClient = new ElasticLoadBalancingV2Client({ region: REGION });
const rdsClient = new RDSClient({ region: REGION });
const route53Client = new Route53Client({ region: REGION });
const iamClient = new IAMClient({ region: REGION });
const asgClient = new AutoScalingClient({ region: REGION });
const logsClient = new CloudWatchLogsClient({ region: REGION });
const backupClient = new BackupClient({ region: REGION });
const dynamoClient = new DynamoDBClient({ region: REGION });

describe('CloudFormation Stack Integration Tests', () => {
  let stackResources: any[] = [];

  beforeAll(async () => {
    // Get stack resources
    const resourcesResponse = await cfnClient.send(new DescribeStackResourcesCommand({
      StackName: STACK_NAME
    }));
    stackResources = resourcesResponse.StackResources || [];
  });

  test('Stack should exist and be in CREATE_COMPLETE status', async () => {
    const response = await cfnClient.send(new DescribeStacksCommand({
      StackName: STACK_NAME
    }));
    
    expect(response.Stacks).toBeDefined();
    expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(response.Stacks![0].StackStatus);
  });

  test('TurnAroundPromptTable should be created and active', async () => {
    const tableResource = stackResources.find(r => r.LogicalResourceId === 'TurnAroundPromptTable');
    expect(tableResource).toBeDefined();
    
    const response = await dynamoClient.send(new DescribeTableCommand({
      TableName: tableResource!.PhysicalResourceId!
    }));
    
    expect(response.Table!.TableStatus).toBe('ACTIVE');
    expect(response.Table!.BillingModeSummary!.BillingMode).toBe('PAY_PER_REQUEST');
  });

  test('VPC should be created with correct CIDR block', async () => {
    const vpcResource = stackResources.find(r => r.LogicalResourceId === 'VPCEast');
    expect(vpcResource).toBeDefined();
    
    const response = await ec2Client.send(new DescribeVpcsCommand({
      VpcIds: [vpcResource!.PhysicalResourceId!]
    }));
    
    expect(response.Vpcs![0].CidrBlock).toBe('10.1.0.0/16');
    expect(response.Vpcs![0].State).toBe('available');
  });

  test('Public subnets should be created in different AZs', async () => {
    const subnet1 = stackResources.find(r => r.LogicalResourceId === 'PublicSubnetEast1');
    const subnet2 = stackResources.find(r => r.LogicalResourceId === 'PublicSubnetEast2');
    
    expect(subnet1).toBeDefined();
    expect(subnet2).toBeDefined();
    
    const response = await ec2Client.send(new DescribeSubnetsCommand({
      SubnetIds: [subnet1!.PhysicalResourceId!, subnet2!.PhysicalResourceId!]
    }));
    
    expect(response.Subnets![0].AvailabilityZone).not.toBe(response.Subnets![1].AvailabilityZone);
    expect(response.Subnets![0].MapPublicIpOnLaunch).toBe(true);
    expect(response.Subnets![1].MapPublicIpOnLaunch).toBe(true);
  });

  test('Private subnets should be created in different AZs', async () => {
    const subnet1 = stackResources.find(r => r.LogicalResourceId === 'PrivateSubnetEast1');
    const subnet2 = stackResources.find(r => r.LogicalResourceId === 'PrivateSubnetEast2');
    
    expect(subnet1).toBeDefined();
    expect(subnet2).toBeDefined();
    
    const response = await ec2Client.send(new DescribeSubnetsCommand({
      SubnetIds: [subnet1!.PhysicalResourceId!, subnet2!.PhysicalResourceId!]
    }));
    
    expect(response.Subnets![0].AvailabilityZone).not.toBe(response.Subnets![1].AvailabilityZone);
    expect(response.Subnets![0].MapPublicIpOnLaunch).toBe(false);
    expect(response.Subnets![1].MapPublicIpOnLaunch).toBe(false);
  });

  test('Security groups should have correct ingress rules', async () => {
    const albSg = stackResources.find(r => r.LogicalResourceId === 'ALBSecurityGroup');
    const webSg = stackResources.find(r => r.LogicalResourceId === 'WebServerSecurityGroup');
    const dbSg = stackResources.find(r => r.LogicalResourceId === 'DatabaseSecurityGroup');
    
    expect(albSg).toBeDefined();
    expect(webSg).toBeDefined();
    expect(dbSg).toBeDefined();
    
    const response = await ec2Client.send(new DescribeSecurityGroupsCommand({
      GroupIds: [albSg!.PhysicalResourceId!, webSg!.PhysicalResourceId!, dbSg!.PhysicalResourceId!]
    }));
    
    const albSecurityGroup = response.SecurityGroups!.find(sg => sg.GroupId === albSg!.PhysicalResourceId);
    expect(albSecurityGroup!.IpPermissions).toHaveLength(2); // HTTP and HTTPS
    
    const webSecurityGroup = response.SecurityGroups!.find(sg => sg.GroupId === webSg!.PhysicalResourceId);
    expect(webSecurityGroup!.IpPermissions).toHaveLength(2); // HTTP from ALB and SSH
    
    const dbSecurityGroup = response.SecurityGroups!.find(sg => sg.GroupId === dbSg!.PhysicalResourceId);
    expect(dbSecurityGroup!.IpPermissions).toHaveLength(1); // PostgreSQL from web servers
  });

  test('Application Load Balancer should be created and available', async () => {
    const albResource = stackResources.find(r => r.LogicalResourceId === 'ApplicationLoadBalancer');
    expect(albResource).toBeDefined();
    
    const response = await elbClient.send(new DescribeLoadBalancersCommand({
      LoadBalancerArns: [albResource!.PhysicalResourceId!]
    }));
    
    expect(response.LoadBalancers![0].State!.Code).toBe('active');
    expect(response.LoadBalancers![0].Scheme).toBe('internet-facing');
    expect(response.LoadBalancers![0].Type).toBe('application');
  });

  test('Target Group should be created with correct health check settings', async () => {
    const tgResource = stackResources.find(r => r.LogicalResourceId === 'TargetGroup');
    expect(tgResource).toBeDefined();
    
    const response = await elbClient.send(new DescribeTargetGroupsCommand({
      TargetGroupArns: [tgResource!.PhysicalResourceId!]
    }));
    
    const targetGroup = response.TargetGroups![0];
    expect(targetGroup.Port).toBe(80);
    expect(targetGroup.Protocol).toBe('HTTP');
    expect(targetGroup.HealthCheckPath).toBe('/');
    expect(targetGroup.HealthCheckIntervalSeconds).toBe(30);
  });

  test('Auto Scaling Group should be created with correct configuration', async () => {
    const asgResource = stackResources.find(r => r.LogicalResourceId === 'AutoScalingGroup');
    expect(asgResource).toBeDefined();
    
    const response = await asgClient.send(new DescribeAutoScalingGroupsCommand({
      AutoScalingGroupNames: [asgResource!.PhysicalResourceId!]
    }));
    
    const asg = response.AutoScalingGroups![0];
    expect(asg.MinSize).toBe(2);
    expect(asg.MaxSize).toBe(6);
    expect(asg.DesiredCapacity).toBe(2);
    expect(asg.HealthCheckType).toBe('ELB');
  });

  test('RDS PostgreSQL instance should be created with Multi-AZ', async () => {
    const dbResource = stackResources.find(r => r.LogicalResourceId === 'DatabaseInstance');
    expect(dbResource).toBeDefined();
    
    const response = await rdsClient.send(new DescribeDBInstancesCommand({
      DBInstanceIdentifier: dbResource!.PhysicalResourceId!
    }));
    
    const dbInstance = response.DBInstances![0];
    expect(dbInstance.Engine).toBe('postgres');
    expect(dbInstance.MultiAZ).toBe(false);
    expect(dbInstance.StorageEncrypted).toBe(true);
    expect(dbInstance.BackupRetentionPeriod).toBe(7);
  });

  test('RDS Read Replica should be created', async () => {
    const replicaResource = stackResources.find(r => r.LogicalResourceId === 'DatabaseReadReplica');
    expect(replicaResource).toBeDefined();
    
    const response = await rdsClient.send(new DescribeDBInstancesCommand({
      DBInstanceIdentifier: replicaResource!.PhysicalResourceId!
    }));
    
    const replica = response.DBInstances![0];
    expect(replica.Engine).toBe('postgres');
    expect(replica.ReadReplicaSourceDBInstanceIdentifier).toBeDefined();
  });

  test('IAM roles should be created with correct policies', async () => {
    const ec2RoleResource = stackResources.find(r => r.LogicalResourceId === 'EC2Role');
    const emergencyRoleResource = stackResources.find(r => r.LogicalResourceId === 'EmergencyAccessRole');
    
    expect(ec2RoleResource).toBeDefined();
    expect(emergencyRoleResource).toBeDefined();
    
    const ec2RoleResponse = await iamClient.send(new GetRoleCommand({
      RoleName: ec2RoleResource!.PhysicalResourceId!
    }));
    
    const emergencyRoleResponse = await iamClient.send(new GetRoleCommand({
      RoleName: emergencyRoleResource!.PhysicalResourceId!
    }));
    
    expect(ec2RoleResponse.Role).toBeDefined();
    expect(emergencyRoleResponse.Role).toBeDefined();
  });

  test('CloudWatch Log Groups should be created with 30-day retention', async () => {
    const response = await logsClient.send(new DescribeLogGroupsCommand({
      logGroupNamePrefix: `/aws/ec2/webserver-${process.env.ENVIRONMENT_SUFFIX || 'dev'}`
    }));
    
    expect(response.logGroups).toBeDefined();
    expect(response.logGroups!.length).toBeGreaterThan(0);
    
    response.logGroups!.forEach(logGroup => {
      expect(logGroup.retentionInDays).toBe(30);
    });
  });

  test('Route 53 Private Hosted Zone should be created', async () => {
    const hostedZoneResource = stackResources.find(r => r.LogicalResourceId === 'HostedZone');
    expect(hostedZoneResource).toBeDefined();
    
    const response = await route53Client.send(new ListHostedZonesCommand({}));
    
    const hostedZone = response.HostedZones!.find(hz => hz.Id!.includes(hostedZoneResource!.PhysicalResourceId!));
    expect(hostedZone).toBeDefined();
    expect(hostedZone!.Config!.PrivateZone).toBe(true);
  });

  test('AWS Backup Plan should be created', async () => {
    const response = await backupClient.send(new ListBackupPlansCommand({}));
    
    const backupPlan = response.BackupPlansList!.find(bp => 
      bp.BackupPlanName!.includes(process.env.ENVIRONMENT_SUFFIX || 'dev')
    );
    
    expect(backupPlan).toBeDefined();
  });
});