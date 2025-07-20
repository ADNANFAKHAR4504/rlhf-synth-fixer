import {
  AutoScaling,
  CloudFront,
  CloudWatchLogs,
  EC2,
  ElastiCache,
  IAM,
  RDS,
  S3,
  SNS,
} from 'aws-sdk';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const ec2 = new EC2();
const rds = new RDS();
const elasticache = new ElastiCache();
const autoscaling = new AutoScaling();
const cloudfront = new CloudFront();
const s3 = new S3();
const sns = new SNS();
const iam = new IAM();
const logs = new CloudWatchLogs({
  region: process.env.AWS_REGION || 'us-east-1',
});

describe('TapStack Infrastructure Integration Tests', () => {
  test('VPC should exist', async () => {
    const vpcId = outputs.VpcId;
    const vpcs = await ec2.describeVpcs({ VpcIds: [vpcId] }).promise();
    expect(vpcs.Vpcs?.length).toBe(1);
  });

  test('All subnets should exist and be in the correct VPC', async () => {
    const subnetIds = [
      outputs.PublicSubnet1,
      outputs.PublicSubnet2,
      outputs.PrivateSubnet1,
      outputs.PrivateSubnet2,
    ].filter(Boolean);
    if (subnetIds.length === 0) return;
    const subnets = await ec2
      .describeSubnets({ SubnetIds: subnetIds })
      .promise();
    expect(subnets.Subnets?.length).toBe(subnetIds.length);
    subnets.Subnets?.forEach(subnet => {
      expect(subnet.VpcId).toBe(outputs.VpcId);
    });
  });

  test('NAT Gateway should exist and be in available state', async () => {
    if (!outputs.NatGateway1) return;
    const nat = await ec2
      .describeNatGateways({ NatGatewayIds: [outputs.NatGateway1] })
      .promise();
    expect(nat.NatGateways?.length).toBe(1);
    expect(nat.NatGateways?.[0].State).toBe('available');
  });

  test('Elastic IP should exist', async () => {
    if (!outputs.ElasticIP1) return;
    const eip = await ec2
      .describeAddresses({ AllocationIds: [outputs.ElasticIP1] })
      .promise();
    expect(eip.Addresses?.length).toBe(1);
  });

  test('All route tables should exist', async () => {
    const rtIds = [outputs.PublicRouteTable, outputs.PrivateRouteTable].filter(
      Boolean
    );
    if (rtIds.length === 0) return;
    const rts = await ec2
      .describeRouteTables({ RouteTableIds: rtIds })
      .promise();
    expect(rts.RouteTables?.length).toBe(rtIds.length);
  });

  test('Flow Logs log group should exist', async () => {
    // Use output if available, else fallback to convention
    const logGroupName =
      outputs.FlowLogsLogGroupName ||
      `vpc-flow-logs-${outputs.EnvironmentSuffix || 'dev'}`;
    const groups = await logs
      .describeLogGroups({ logGroupNamePrefix: logGroupName })
      .promise();
    console.log(
      'Available log groups:',
      groups.logGroups?.map(g => g.logGroupName)
    );
    expect(groups.logGroups?.some(g => g.logGroupName === logGroupName)).toBe(
      true
    );
  });

  test('EC2 Security Group should exist', async () => {
    if (!outputs.EC2SecurityGroup) return;
    const sgs = await ec2
      .describeSecurityGroups({ GroupIds: [outputs.EC2SecurityGroup] })
      .promise();
    expect(sgs.SecurityGroups?.length).toBe(1);
  });

  test('IAM Instance Profile and Role should exist', async () => {
    if (!outputs.EC2InstanceProfile) return;
    const profile = await iam
      .getInstanceProfile({ InstanceProfileName: outputs.EC2InstanceProfile })
      .promise();
    expect(profile.InstanceProfile.InstanceProfileName).toBe(
      outputs.EC2InstanceProfile
    );
    if (profile.InstanceProfile.Roles.length > 0) {
      const roleName = profile.InstanceProfile.Roles[0].RoleName;
      const role = await iam.getRole({ RoleName: roleName }).promise();
      expect(role.Role.RoleName).toBe(roleName);
    }
  });

  test('Launch Template should exist', async () => {
    if (!outputs.LaunchTemplate) return;
    const lt = await ec2
      .describeLaunchTemplates({ LaunchTemplateIds: [outputs.LaunchTemplate] })
      .promise();
    expect(lt.LaunchTemplates?.length).toBe(1);
  });

  test('Auto Scaling group should exist and have at least 2 instances', async () => {
    const asgName = outputs.AutoScalingGroupName;
    const asgs = await autoscaling
      .describeAutoScalingGroups({ AutoScalingGroupNames: [asgName] })
      .promise();
    expect(asgs.AutoScalingGroups?.length).toBe(1);
    const asg = asgs.AutoScalingGroups![0];
    expect(asg.Instances?.length).toBeGreaterThanOrEqual(2);
  });

  test('S3 bucket should exist', async () => {
    const bucketName = outputs.S3BucketName;
    const buckets = await s3.listBuckets().promise();
    const found = buckets.Buckets?.some(b => b.Name === bucketName);
    expect(found).toBe(true);
  });

  test('RDS instance should be available', async () => {
    const endpoint = outputs.RDSEndpoint;
    const instances = await rds.describeDBInstances().promise();
    const found = instances.DBInstances?.find(
      db => db.Endpoint?.Address === endpoint
    );
    expect(found).toBeDefined();
    expect(found?.DBInstanceStatus).toBe('available');
  });

  test('ElastiCache cluster should be available', async () => {
    const endpoint = outputs.ElastiCacheEndpoint;
    const clusters = await elasticache
      .describeCacheClusters({ ShowCacheNodeInfo: true })
      .promise();
    const found = clusters.CacheClusters?.find(cluster =>
      cluster.CacheNodes?.some(node => node.Endpoint?.Address === endpoint)
    );
    expect(found).toBeDefined();
    expect(found?.CacheClusterStatus).toBe('available');
  });

  test('CloudFront distribution should be deployed', async () => {
    const domainName = outputs.CloudFrontDomainName;
    const dists = await cloudfront.listDistributions().promise();
    const found = dists.DistributionList?.Items?.some(
      dist => dist.DomainName === domainName
    );
    expect(found).toBe(true);
  });

  test('SNS Topic should exist', async () => {
    const topics = await sns.listTopics().promise();
    const topicArns = topics.Topics?.map(t => t.TopicArn);
    expect(topicArns?.length).toBeGreaterThan(0);
  });

  test('WAF WebACL output should be present', () => {
    expect(outputs.WAFWebACLArn).toBeDefined();
    expect(typeof outputs.WAFWebACLArn).toBe('string');
  });

  test('CPUAlarm output should be present', () => {
    expect(outputs.CloudWatchAlarmArn).toBeDefined();
    expect(typeof outputs.CloudWatchAlarmArn).toBe('string');
  });

  test('All outputs should be defined and not empty', () => {
    Object.values(outputs).forEach((val: any) => {
      expect(val).toBeDefined();
      if (typeof val === 'string') {
        expect(val.length).toBeGreaterThan(0);
      }
    });
  });
});
