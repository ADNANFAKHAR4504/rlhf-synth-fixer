import EC2 from 'aws-sdk/clients/ec2';
import S3 from 'aws-sdk/clients/s3';
import RDS from 'aws-sdk/clients/rds';
import ELBv2 from 'aws-sdk/clients/elbv2';
import CloudWatch from 'aws-sdk/clients/cloudwatch';
import AutoScaling from 'aws-sdk/clients/autoscaling';
import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'prod';
const region = 'us-east-1';

// Load outputs from CloudFormation deployment
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

describe('TapStack Live Infrastructure Integration', () => {
  test('VPC exists in AWS', async () => {
    const ec2 = new EC2();
    const vpcId = outputs.VPCId;
    const vpcs = await ec2.describeVpcs({ VpcIds: [vpcId] }).promise();
    expect(vpcs.Vpcs && vpcs.Vpcs.length).toBe(1);
    expect(vpcs.Vpcs && vpcs.Vpcs[0].VpcId).toBe(vpcId);
  });

  test('S3 bucket exists and has access logging enabled', async () => {
    const s3 = new S3();
    const bucketName = outputs.S3BucketName;
    const bucketLogging = await s3.getBucketLogging({ Bucket: bucketName }).promise();
    expect(bucketLogging.LoggingEnabled).toBeDefined();
    expect(bucketLogging.LoggingEnabled && bucketLogging.LoggingEnabled.TargetBucket).toMatch(/prod-s3-access-logs/);
  });

  test('RDS instance exists and is available', async () => {
    const rds = new RDS();
    const dbInstanceId = outputs.RDSInstanceId;
    const dbs = await rds.describeDBInstances({ DBInstanceIdentifier: dbInstanceId }).promise();
    expect(dbs.DBInstances && dbs.DBInstances.length).toBe(1);
    expect(dbs.DBInstances && dbs.DBInstances[0].DBInstanceStatus).toBe('available');
    expect(dbs.DBInstances && dbs.DBInstances[0].DBInstanceClass).toBe('db.t3.micro');
  });

  test('ALB exists and is active', async () => {
    const elbv2 = new ELBv2();
    const albArn = outputs.ALBArn;
    const albs = await elbv2.describeLoadBalancers({ LoadBalancerArns: [albArn] }).promise();
    expect(albs.LoadBalancers && albs.LoadBalancers.length).toBe(1);
    expect(albs.LoadBalancers && albs.LoadBalancers[0].State && albs.LoadBalancers[0].State.Code).toBe('active');
  });

  test('CloudWatch alarm for 5xx errors exists', async () => {
    const cloudwatch = new CloudWatch();
    const alarmName = outputs.CloudWatchAlarmName;
    const alarms = await cloudwatch.describeAlarms({ AlarmNames: [alarmName] }).promise();
    expect(alarms.MetricAlarms && alarms.MetricAlarms.length).toBe(1);
    expect(alarms.MetricAlarms && alarms.MetricAlarms[0].MetricName).toBe('HTTPCode_ELB_5XX_Count');
  });

  test('AutoScaling group exists and is healthy', async () => {
    const autoscaling = new AutoScaling();
    // Find ASG by tag
    const asgs = await autoscaling.describeAutoScalingGroups({}).promise();
    const prodAsg = asgs.AutoScalingGroups.find(asg =>
      asg.Tags && asg.Tags.some(tag => tag.Key === 'Name' && tag.Value === 'prod-asg')
    );
    expect(prodAsg && prodAsg.Instances && prodAsg.Instances.length).toBeGreaterThanOrEqual(2);
    expect(prodAsg && prodAsg.HealthCheckType).toBeDefined();
  });

  test('EC2 security group has correct inbound/outbound rules', async () => {
    const ec2 = new EC2({ region });
    const sgId = outputs.EC2SecurityGroupId || null;
    if (!sgId) return;
    const sgs = await ec2.describeSecurityGroups({ GroupIds: [sgId] }).promise();
    expect(sgs.SecurityGroups && sgs.SecurityGroups.length).toBe(1);
    const sg = sgs.SecurityGroups?.[0];
    expect(sg?.IpPermissions?.some((p: any) => p.FromPort === 80 && p.ToPort === 80)).toBe(true);
    expect(sg?.IpPermissionsEgress?.some((e: any) => e.IpProtocol === '-1')).toBe(true);
  });

  test('ALB security group has correct inbound/outbound rules', async () => {
    const ec2 = new EC2({ region });
    const sgId = outputs.ALBSecurityGroupId || null;
    if (!sgId) return;
    const sgs = await ec2.describeSecurityGroups({ GroupIds: [sgId] }).promise();
    expect(sgs.SecurityGroups && sgs.SecurityGroups.length).toBe(1);
    const sg = sgs.SecurityGroups?.[0];
    expect(sg?.IpPermissions?.some((p: any) => p.FromPort === 443 && p.ToPort === 443)).toBe(true);
    expect(sg?.IpPermissionsEgress?.some((e: any) => e.IpProtocol === '-1')).toBe(true);
  });

  test('RDS subnet group contains both private subnets', async () => {
    const rds = new RDS({ region });
    const groupName = outputs.RDSSubnetGroupName || null;
    if (!groupName) return;
    const groups = await rds.describeDBSubnetGroups({ DBSubnetGroupName: groupName }).promise();
    expect(groups.DBSubnetGroups && groups.DBSubnetGroups.length).toBe(1);
    const subnetIds = groups.DBSubnetGroups?.[0]?.Subnets?.map((s: any) => s.SubnetIdentifier) || [];
    expect(subnetIds).toContain(outputs.PrivateSubnet1Id);
    expect(subnetIds).toContain(outputs.PrivateSubnet2Id);
  });

  test('All major resources have Name and Environment tags', async () => {
    const ec2 = new EC2({ region });
    const resources = [
      outputs.VPCId,
      outputs.PublicSubnet1Id,
      outputs.PublicSubnet2Id,
      outputs.PrivateSubnet1Id,
      outputs.PrivateSubnet2Id
    ];
    for (const id of resources) {
      const tags = await ec2.describeTags({ Filters: [ { Name: 'resource-id', Values: [id] } ] }).promise();
      const keys = tags.Tags?.map((t: any) => t.Key) || [];
      expect(keys).toContain('Name');
      expect(keys).toContain('Environment');
    }
  });

  test('S3 access logs bucket policy allows logging', async () => {
    const s3 = new S3({ region });
    const bucketName = outputs.S3AccessLogsBucketName || null;
    if (!bucketName) return;
    const policy = await s3.getBucketPolicy({ Bucket: bucketName }).promise();
    expect(policy.Policy).toMatch(/logging.s3.amazonaws.com/);
  });
});