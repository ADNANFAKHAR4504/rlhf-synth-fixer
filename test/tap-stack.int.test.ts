import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeRouteTablesCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
} from '@aws-sdk/client-ec2';
import {
  Route53Client,
  ListResourceRecordSetsCommand,
} from "@aws-sdk/client-route-53";
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetBucketPolicyStatusCommand,
} from '@aws-sdk/client-s3';
import {
  KMSClient,
  DescribeKeyCommand,
} from '@aws-sdk/client-kms';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import fs from 'fs';

const region = process.env.AWS_REGION || 'ap-south-1';
const route53 = new Route53Client({ region: "ap-south-1" })
const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));

const ec2 = new EC2Client({ region });
const rds = new RDSClient({ region });
const elbv2 = new ElasticLoadBalancingV2Client({ region });
const asg = new AutoScalingClient({ region });
const cloudwatch = new CloudWatchClient({ region });
const s3 = new S3Client({ region });
const kms = new KMSClient({ region });
const secrets = new SecretsManagerClient({ region });

describe('Production CloudFormation Integration Tests', () => {
  test('VPC should exist', async () => {
    const res = await ec2.send(new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] }));
    expect(res.Vpcs?.[0].CidrBlock).toBe('10.0.0.0/16');
  });

  test("Alias record app.devexample.com exists in hosted zone", async () => {
    const recordSetRes = await route53.send(
      new ListResourceRecordSetsCommand({
        HostedZoneId: outputs.HostedZoneId,
      })
    );

    const record = recordSetRes.ResourceRecordSets?.find(
      (r) =>
        r.Name === "app.devexample.com." &&
        r.Type === "A" &&
        r.AliasTarget?.DNSName?.includes(outputs.ALBDNSName)
    );

    expect(record).toBeDefined();
    expect(record?.AliasTarget?.DNSName).toContain(outputs.ALBDNSName);
  });

  test('Public and private subnets should exist', async () => {
    const subnetIds = outputs.PublicSubnets.split(',').concat(outputs.PrivateSubnets.split(','));
    const res = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: subnetIds }));
    expect(res.Subnets?.length).toBe(4);
  });

  test('ALB should exist and be internet-facing', async () => {
    const res = await elbv2.send(new DescribeLoadBalancersCommand({ Names: ['Production-ALB'] }));
    expect(res.LoadBalancers?.[0].Scheme).toBe('internet-facing');
  });

  test('ALB listener should exist on port 80', async () => {
    const alb = await elbv2.send(new DescribeLoadBalancersCommand({ Names: ['Production-ALB'] }));
    const listener = await elbv2.send(new DescribeListenersCommand({ LoadBalancerArn: alb.LoadBalancers?.[0].LoadBalancerArn }));
    expect(listener.Listeners?.[0].Port).toBe(80);
  });

  test('Target group should be attached to ALB', async () => {
    const tg = await elbv2.send(new DescribeTargetGroupsCommand({ Names: ['Production-TG'] }));
    expect(tg.TargetGroups?.[0].TargetType).toBe('instance');
  });

  test('Auto Scaling Group should be configured', async () => {
    const res = await asg.send(new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: ['Production-ASG'] }));
    expect(res.AutoScalingGroups?.[0].MinSize).toBe(2);
  });

  test('RDS instance should be available', async () => {
    const res = await rds.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: 'production-postgres-db' }));
    expect(res.DBInstances?.[0].DBInstanceStatus).toBe('available');
  });

  test('S3 bucket should be encrypted and private', async () => {
    const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: outputs.S3BucketName }));
    expect(enc.ServerSideEncryptionConfiguration).toBeDefined();

    const policy = await s3.send(new GetBucketPolicyStatusCommand({ Bucket: outputs.S3BucketName }));
    expect(policy.PolicyStatus?.IsPublic).toBe(false);
  });

  test('KMS key for RDS should exist', async () => {
    const res = await kms.send(new DescribeKeyCommand({ KeyId: 'alias/production-rds-key' }));
    expect(res.KeyMetadata?.KeyState).toBe('Enabled');
  });

  test('Secrets Manager secret for DB should exist', async () => {
    const res = await secrets.send(new DescribeSecretCommand({ SecretId: 'DBSecret' }));
    expect(res.Name).toBe('DBSecret');
  });

  test('Public Route Table should have a route to Internet Gateway', async () => {
  const res = await ec2.send(new DescribeRouteTablesCommand({ Filters: [
    { Name: 'vpc-id', Values: [outputs.VPCId] }
  ]}));

  const routeTable = res.RouteTables?.find(rt =>
    rt.Routes?.some(route => route.GatewayId?.startsWith('igw-'))
  );

  expect(routeTable).toBeDefined();
  });

  test('CloudWatch alarms should be present', async () => {
    const res = await cloudwatch.send(new DescribeAlarmsCommand({ AlarmNames: ['Production-CPU-High', 'Production-RDS-CPU-High'] }));
    expect(res.MetricAlarms?.length).toBeGreaterThanOrEqual(2);
  });

});