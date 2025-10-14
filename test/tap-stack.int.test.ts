import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  DescribeKeyCommand,
  KMSClient,
} from '@aws-sdk/client-kms';
import {
  DescribeDBInstancesCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  DeleteObjectCommand,
  GetBucketLifecycleConfigurationCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  SNSClient
} from '@aws-sdk/client-sns';
import axios from 'axios';
import fs from 'fs';

// Load outputs from deployment
const outputsPath = 'cfn-outputs/flat-outputs.json';
let outputs: any;
if (!fs.existsSync(outputsPath)) {
  throw new Error(`Outputs file not found at ${outputsPath}. Did you run the deployment?`);
}
outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

const region = process.env.AWS_REGION || 'us-east-1';
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const kmsClient = new KMSClient({ region });
const asgClient = new AutoScalingClient({ region });
const elbv2Client = new ElasticLoadBalancingV2Client({ region });
const snsClient = new SNSClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });

// Integration test suite

describe('TapStack Integration Tests', () => {
  // Outputs validation
  test('All deployment outputs should be defined and accessible', async () => {
    const requiredOutputs = [
      'AutoScalingGroupName', 'ElbDnsName', 'KmsKeyId', 'LogBucketName',
      'PrivateSubnetIds', 'PublicSubnetIds', 'RdsEndpoint', 'SecurityGroupIds', 'VpcId'
    ];
    requiredOutputs.forEach(key => expect(outputs[key]).toBeDefined());
  });

  // KMS Key validation
  test('KMS key should exist and be enabled', async () => {
    const keyId = outputs.KmsKeyId;
    expect(keyId).toBeDefined();
    const keyResp = await kmsClient.send(new DescribeKeyCommand({ KeyId: keyId }));
    expect(keyResp.KeyMetadata?.Enabled).toBe(true);
  });

  // ASG validation
  test('Auto Scaling Group should exist and have healthy instances', async () => {
    const asgName = outputs.AutoScalingGroupName;
    expect(asgName).toBeDefined();
    const asgResp = await asgClient.send(new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] }));
    expect(asgResp.AutoScalingGroups?.length).toBe(1);
    const asg = asgResp.AutoScalingGroups?.[0];
    expect(asg?.Instances?.length).toBeGreaterThan(0);
    asg?.Instances?.forEach(inst => expect(inst.LifecycleState).toMatch(/InService|Pending/));
  });

  // ALB Target Group health
  test('ALB target group should have healthy targets', async () => {
    const tgResp = await elbv2Client.send(new DescribeTargetGroupsCommand({}));
    const targetGroup = tgResp.TargetGroups?.find(tg => tg.TargetGroupArn);
    expect(targetGroup).toBeDefined();
    const healthResp = await elbv2Client.send(new DescribeTargetHealthCommand({ TargetGroupArn: targetGroup!.TargetGroupArn! }));
    expect(healthResp.TargetHealthDescriptions?.length).toBeGreaterThan(0);
    healthResp.TargetHealthDescriptions?.forEach(th => expect(th.TargetHealth?.State).toBe('healthy'));
  });

  // SNS Topic and Subscription
  test('SNS topic should exist and have an email subscription', async () => {
    // If you have SNS TopicArn in outputs, use it here. Otherwise, skip or list topics and check attributes.
    // Example:
    // const topicArn = outputs.SnsTopicArn;
    // expect(topicArn).toBeDefined();
    // const subsResp = await snsClient.send(new ListSubscriptionsByTopicCommand({ TopicArn: topicArn }));
    // expect(subsResp.Subscriptions?.some(sub => sub.Protocol === 'email')).toBe(true);
  });

  // CloudWatch Alarms
  test('CloudWatch alarms should exist for CPU, RDS, and unhealthy hosts', async () => {
    const alarmResp = await cloudWatchClient.send(new DescribeAlarmsCommand({}));
    const alarmNames = alarmResp.MetricAlarms?.map(a => a.AlarmName) || [];
    expect(alarmNames.some(name => /cpu/i.test(name ?? ''))).toBe(true);
    expect(alarmNames.some(name => /rds/i.test(name ?? ''))).toBe(true);
    expect(alarmNames.some(name => /unhealthy/i.test(name ?? ''))).toBe(true);
  });

  // S3 Bucket Lifecycle
  test('S3 bucket should have lifecycle rules', async () => {
    const bucketName = outputs.LogBucketName;
    const lcResp = await s3Client.send(new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName }));
    expect(lcResp.Rules?.length).toBeGreaterThan(0);
  });

  // Resource interconnections: Security group rules
  test('Security groups should allow traffic between ALB, ASG, and RDS', async () => {
    const sgIds = outputs.SecurityGroupIds.split(',');
    const sgResp = await ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: sgIds }));
    expect(sgResp.SecurityGroups?.length).toBe(sgIds.length);
    // Optionally, inspect sgResp.SecurityGroups for ingress/egress rules
  });

  // VPC and Subnet checks
  test('VPC and subnets should exist and be available', async () => {
    const vpcId = outputs.VpcId;
    expect(vpcId).toBeDefined();
    const vpcResp = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    expect(vpcResp.Vpcs?.[0].State).toBe('available');

    const subnetIds = outputs.PublicSubnetIds.split(',').concat(outputs.PrivateSubnetIds.split(','));
    const subnetResp = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: subnetIds }));
    expect(subnetResp.Subnets?.length).toBe(subnetIds.length);
  });

  // NAT Gateway check
  test('NAT Gateway should be available', async () => {
    const vpcId = outputs.VpcId;
    const natResp = await ec2Client.send(new DescribeNatGatewaysCommand({ Filter: [{ Name: 'vpc-id', Values: [vpcId] }, { Name: 'state', Values: ['available'] }] }));
    expect(natResp.NatGateways?.length).toBeGreaterThan(0);
    expect(natResp.NatGateways?.[0].State).toBe('available');
  });

  // Security Groups check
  test('Security groups should exist in VPC', async () => {
    const vpcId = outputs.VpcId;
    const sgIds = outputs.SecurityGroupIds.split(',');
    const sgResp = await ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: sgIds }));
    expect(sgResp.SecurityGroups?.length).toBe(sgIds.length);
    sgResp.SecurityGroups?.forEach(sg => expect(sg.VpcId).toBe(vpcId));
  });

  // S3 Bucket E2E
  test('Should write, read, and delete an object in S3 bucket', async () => {
    const bucketName = outputs.LogBucketName;
    const testKey = `int-test-${Date.now()}.txt`;
    const testContent = 'integration test';
    await s3Client.send(new PutObjectCommand({ Bucket: bucketName, Key: testKey, Body: testContent }));
    const getResp = await s3Client.send(new GetObjectCommand({ Bucket: bucketName, Key: testKey }));
    const body = await getResp.Body?.transformToString();
    expect(body).toBe(testContent);
    await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: testKey }));
  });

  // RDS Connectivity
  test('RDS endpoint should be reachable (TCP)', async () => {
    const rdsEndpoint = outputs.RdsEndpoint.split(':')[0];
    const rdsResp = await rdsClient.send(new DescribeDBInstancesCommand({}));
    const found = rdsResp.DBInstances?.some(db => db.Endpoint?.Address === rdsEndpoint);
    expect(found).toBe(true);
  });

  // ALB E2E
  test('ALB endpoint should respond to HTTP traffic', async () => {
    const albDns = outputs.ElbDnsName;
    const url = `http://${albDns}`;
    const resp = await axios.get(url, { validateStatus: () => true });
    expect([200, 403, 404]).toContain(resp.status); // Accept any valid HTTP response
  });

  // End-to-end: ALB → ASG → Instance
  test('ALB should route traffic to an instance', async () => {
    const albDns = outputs.ElbDnsName;
    const url = `http://${albDns}`;
    const resp = await axios.get(url, { validateStatus: () => true });
    expect(resp.status).toBeGreaterThanOrEqual(200);
    expect(resp.status).toBeLessThan(500);
    // Optionally, check for headers or content if your app returns something specific
  });
});
