import { EC2Client, DescribeVpcsCommand, DescribeSecurityGroupsCommand, DescribeTagsCommand, DescribeNatGatewaysCommand } from '@aws-sdk/client-ec2';
import { S3Client, GetBucketLoggingCommand, GetBucketPolicyCommand } from '@aws-sdk/client-s3';
import { RDSClient, DescribeDBInstancesCommand, DescribeDBSubnetGroupsCommand } from '@aws-sdk/client-rds';
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand } from '@aws-sdk/client-elastic-load-balancing-v2';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import { AutoScalingClient, DescribeAutoScalingGroupsCommand } from '@aws-sdk/client-auto-scaling';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'prod';
const region = process.env.AWS_REGION || 'us-east-1';

// Load outputs from CloudFormation deployment
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

describe('TapStack Live Infrastructure Integration', () => {
  test('VPC exists in AWS', async () => {
    const ec2 = new EC2Client({ region });
    const vpcId = outputs.VPCId;
    const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
    const vpcs = await ec2.send(command);
    expect(vpcs.Vpcs && vpcs.Vpcs.length).toBe(1);
    expect(vpcs.Vpcs && vpcs.Vpcs[0].VpcId).toBe(vpcId);
  });

  test('S3 bucket exists and has access logging enabled', async () => {
    const s3 = new S3Client({ region });
    const bucketName = outputs.S3BucketName;
    const command = new GetBucketLoggingCommand({ Bucket: bucketName });
    const bucketLogging = await s3.send(command);
    expect(bucketLogging.LoggingEnabled).toBeDefined();
    expect(bucketLogging.LoggingEnabled && bucketLogging.LoggingEnabled.TargetBucket).toMatch(/prod-s3-access-logs/);
  });

  test('RDS instance exists and is available', async () => {
    const rds = new RDSClient({ region });
    const dbInstanceId = outputs.RDSInstanceId;
    const command = new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbInstanceId });
    const dbs = await rds.send(command);
    expect(dbs.DBInstances && dbs.DBInstances.length).toBe(1);
    expect(dbs.DBInstances && dbs.DBInstances[0].DBInstanceStatus).toBe('available');
    expect(dbs.DBInstances && dbs.DBInstances[0].DBInstanceClass).toBe('db.t3.micro');
  });

  test('RDS security group has correct inbound rules', async () => {
    const ec2 = new EC2Client({ region });
    const sgId = outputs.RDSSecurityGroupId || null;
    if (!sgId) return;
    const command = new DescribeSecurityGroupsCommand({ GroupIds: [sgId] });
    const sgs = await ec2.send(command);
    expect(sgs.SecurityGroups && sgs.SecurityGroups.length).toBe(1);
    const sg = sgs.SecurityGroups?.[0];
    expect(sg?.IpPermissions?.some((p: any) => p.FromPort === 3306 && p.ToPort === 3306)).toBe(true);
  });

  test('ALB exists and is active', async () => {
    const elbv2 = new ElasticLoadBalancingV2Client({ region });
    const albArn = outputs.ALBArn;
    const command = new DescribeLoadBalancersCommand({ LoadBalancerArns: [albArn] });
    const albs = await elbv2.send(command);
    expect(albs.LoadBalancers && albs.LoadBalancers.length).toBe(1);
    expect(albs.LoadBalancers && albs.LoadBalancers[0].State && albs.LoadBalancers[0].State.Code).toBe('active');
  });

  test('CloudWatch alarm for 5xx errors exists with SNS notifications', async () => {
    const cloudwatch = new CloudWatchClient({ region });
    const alarmName = outputs.CloudWatchAlarmName;
    const command = new DescribeAlarmsCommand({ AlarmNames: [alarmName] });
    const alarms = await cloudwatch.send(command);
    expect(alarms.MetricAlarms && alarms.MetricAlarms.length).toBe(1);
    expect(alarms.MetricAlarms && alarms.MetricAlarms[0].MetricName).toBe('HTTPCode_ELB_5XX_Count');
    expect(alarms.MetricAlarms && alarms.MetricAlarms[0].AlarmActions && alarms.MetricAlarms[0].AlarmActions.length).toBeGreaterThan(0);
  });

  test('SNS topic for alarms exists', async () => {
    const sns = new SNSClient({ region });
    const topicArn = outputs.AlarmSNSTopicArn || null;
    if (!topicArn) return;
    const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
    const topic = await sns.send(command);
    expect(topic.Attributes).toBeDefined();
    expect(topic.Attributes?.TopicArn).toBe(topicArn);
  });

  test('AutoScaling group exists and is healthy', async () => {
    const autoscaling = new AutoScalingClient({ region });
    // Find ASG by tag
    const command = new DescribeAutoScalingGroupsCommand({});
    const asgs = await autoscaling.send(command);
    const prodAsg = asgs.AutoScalingGroups?.find(asg =>
      asg.Tags && asg.Tags.some(tag => tag.Key === 'Name' && tag.Value === 'prod-asg')
    );
    expect(prodAsg && prodAsg.Instances && prodAsg.Instances.length).toBeGreaterThanOrEqual(2);
    expect(prodAsg && prodAsg.HealthCheckType).toBeDefined();
  });

  test('EC2 security group has correct inbound/outbound rules', async () => {
    const ec2 = new EC2Client({ region });
    const sgId = outputs.EC2SecurityGroupId || null;
    if (!sgId) return;
    const command = new DescribeSecurityGroupsCommand({ GroupIds: [sgId] });
    const sgs = await ec2.send(command);
    expect(sgs.SecurityGroups && sgs.SecurityGroups.length).toBe(1);
    const sg = sgs.SecurityGroups?.[0];
    expect(sg?.IpPermissions?.some((p: any) => p.FromPort === 80 && p.ToPort === 80)).toBe(true);
    expect(sg?.IpPermissionsEgress?.some((e: any) => e.IpProtocol === '-1')).toBe(true);
  });

  test('ALB security group has correct inbound/outbound rules', async () => {
    const ec2 = new EC2Client({ region });
    const sgId = outputs.ALBSecurityGroupId || null;
    if (!sgId) return;
    const command = new DescribeSecurityGroupsCommand({ GroupIds: [sgId] });
    const sgs = await ec2.send(command);
    expect(sgs.SecurityGroups && sgs.SecurityGroups.length).toBe(1);
    const sg = sgs.SecurityGroups?.[0];
    expect(sg?.IpPermissions?.some((p: any) => p.FromPort === 443 && p.ToPort === 443)).toBe(true);
    expect(sg?.IpPermissionsEgress?.some((e: any) => e.IpProtocol === '-1')).toBe(true);
  });

  test('RDS subnet group contains both private subnets', async () => {
    const rds = new RDSClient({ region });
    const groupName = outputs.RDSSubnetGroupName || null;
    if (!groupName) return;
    const command = new DescribeDBSubnetGroupsCommand({ DBSubnetGroupName: groupName });
    const groups = await rds.send(command);
    expect(groups.DBSubnetGroups && groups.DBSubnetGroups.length).toBe(1);
    const subnetIds = groups.DBSubnetGroups?.[0]?.Subnets?.map((s: any) => s.SubnetIdentifier) || [];
    expect(subnetIds).toContain(outputs.PrivateSubnet1Id);
    expect(subnetIds).toContain(outputs.PrivateSubnet2Id);
  });

  test('All major resources have Name and Environment tags', async () => {
    const ec2 = new EC2Client({ region });
    const resources = [
      outputs.VPCId,
      outputs.PublicSubnet1Id,
      outputs.PublicSubnet2Id,
      outputs.PrivateSubnet1Id,
      outputs.PrivateSubnet2Id
    ];
    for (const id of resources) {
      const command = new DescribeTagsCommand({ Filters: [ { Name: 'resource-id', Values: [id] } ] });
      const tags = await ec2.send(command);
      const keys = tags.Tags?.map((t: any) => t.Key) || [];
      expect(keys).toContain('Name');
      expect(keys).toContain('Environment');
    }
  });

  test('S3 access logs bucket policy allows logging', async () => {
    const s3 = new S3Client({ region });
    const bucketName = outputs.S3AccessLogsBucketName || null;
    if (!bucketName) return;
    const command = new GetBucketPolicyCommand({ Bucket: bucketName });
    const policy = await s3.send(command);
    expect(policy.Policy).toMatch(/logging.s3.amazonaws.com/);
  });

  test('NAT Gateway exists and is available', async () => {
    const ec2 = new EC2Client({ region });
    const natGatewayId = outputs.NATGatewayId || null;
    if (!natGatewayId) return;
    const command = new DescribeNatGatewaysCommand({ NatGatewayIds: [natGatewayId] });
    const natGateways = await ec2.send(command);
    expect(natGateways.NatGateways && natGateways.NatGateways.length).toBe(1);
    expect(natGateways.NatGateways && natGateways.NatGateways[0].State).toBe('available');
  });
});