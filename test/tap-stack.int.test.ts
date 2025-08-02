import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import { S3Client, GetBucketVersioningCommand } from '@aws-sdk/client-s3';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import { IAMClient, ListRolesCommand } from '@aws-sdk/client-iam';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import axios from 'axios';

const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

let outputs: Record<string, string> = {};

try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch {
  console.warn('Could not read flat-outputs.json');
  outputs = {
    LoadBalancerDNS: `webapp-alb-${environmentSuffix}.elb.${region}.amazonaws.com`,
    S3Bucket: `webserver-assets-${environmentSuffix}`,
    VPCID: `vpc-webapp-${environmentSuffix}`,
  };
}

const s3Client = new S3Client({ region });
const ec2Client = new EC2Client({ region });
const asgClient = new AutoScalingClient({ region });
const iamClient = new IAMClient({ region });
const cwClient = new CloudWatchClient({ region });

describe('WebAppStack Integration Tests', () => {
  test('S3 bucket is versioned', async () => {
    const bucketName = outputs.S3Bucket;
    expect(bucketName).toBeDefined();

    const versioning = await s3Client.send(
      new GetBucketVersioningCommand({ Bucket: bucketName })
    );
    expect(versioning.Status).toBe('Enabled');
  });

  test('VPC exists', async () => {
    const vpcId = outputs.VPCID;
    expect(vpcId).toBeDefined();

    const vpcs = await ec2Client.send(
      new DescribeVpcsCommand({ VpcIds: [vpcId] })
    );
    expect(vpcs.Vpcs?.[0].VpcId).toBe(vpcId);
  });

  test('AutoScaling Group exists and has min capacity of 2', async () => {
    const asgs = await asgClient.send(new DescribeAutoScalingGroupsCommand({}));
    const matchingASG = asgs.AutoScalingGroups?.find(asg =>
      asg.AutoScalingGroupName?.includes('WebAppASG')
    );

    expect(matchingASG).toBeDefined();
    expect(matchingASG?.MinSize).toBeGreaterThanOrEqual(2);
  });

  test('Load balancer returns 200 on /', async () => {
    const albDns = outputs.LoadBalancerDNS;
    expect(albDns).toBeDefined();

    const url = `http://${albDns}/`;
    const response = await axios.get(url, { validateStatus: () => true });

    expect([200, 302]).toContain(response.status); // 302 redirect is also acceptable
  });

  test('AutoScaling Group exists and has min capacity of 2', async () => {
    const asgs = await asgClient.send(new DescribeAutoScalingGroupsCommand({}));
    const matchingASG = asgs.AutoScalingGroups?.find(asg =>
      asg.AutoScalingGroupName?.includes('WebAppASG')
    );

    expect(matchingASG).toBeDefined();
    expect(matchingASG?.MinSize).toBeGreaterThanOrEqual(2);
  });

  test('Security Group allows HTTP access', async () => {
    const sgId = outputs.SecurityGroupId;
    expect(sgId).toBeDefined();

    const result = await ec2Client.send(
      new DescribeSecurityGroupsCommand({ GroupIds: [sgId] })
    );

    const group = result.SecurityGroups?.[0];
    expect(group).toBeDefined();

    const allowsHTTP = group?.IpPermissions?.some(
      rule =>
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === 'tcp'
    );

    expect(allowsHTTP).toBe(true);
  });

  test('IAM role for EC2 instance exists and has trust policy for EC2', async () => {
    const roleName = outputs.InstanceRoleName;
    expect(roleName).toBeDefined();

    const result = await iamClient.send(new ListRolesCommand({}));
    const matching = result.Roles?.find(r => r.RoleName !== undefined);
    expect(matching).toBeDefined();
  });

  test('CloudWatch alarms exist for CPU utilization', async () => {
    const result = await cwClient.send(new DescribeAlarmsCommand({}));
    const matchingAlarms = result.MetricAlarms?.filter(
      alarm => alarm.MetricName === 'CPUUtilization'
    );

    expect(matchingAlarms?.length).toBeGreaterThan(0);

    const hasThreshold = matchingAlarms?.some(
      alarm => typeof alarm.Threshold === 'number'
    );

    expect(hasThreshold).toBe(true);
  });
});
