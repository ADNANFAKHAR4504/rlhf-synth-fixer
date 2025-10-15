import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  DescribeInternetGatewaysCommand,
  DescribeLaunchTemplatesCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

const awsRegion =
  process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'eu-central-1';

const ec2Client = new EC2Client({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const autoScalingClient = new AutoScalingClient({ region: awsRegion });
let stackOutputs: Record<string, any>;

describe('TapStack Integration Tests', () => {
  let vpcId: string;
  let publicSubnetIds: string[];
  let appBucketName: string;
  let webServerSgId: string;
  let bastionSgId: string;
  let webAsgName: string;

  beforeAll(() => {
    const suffix = process.env.ENVIRONMENT_SUFFIX;
    if (!suffix) {
      throw new Error('ENVIRONMENT_SUFFIX environment variable is not set.');
    }

    const outputFilePath = path.join(
      __dirname,
      '..',
      'cfn-outputs',
      'flat-outputs.json'
    );

    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }

    const outputs = JSON.parse(fs.readFileSync(outputFilePath, 'utf-8'));
    const stackKey = Object.keys(outputs).find(k => k.includes(suffix));
    if (!stackKey) {
      throw new Error(`No output found for environment: ${suffix}`);
    }

    stackOutputs = outputs[stackKey];

    vpcId = stackOutputs['vpc_id'];
    publicSubnetIds = stackOutputs['public_subnet_ids'];
    appBucketName = stackOutputs['app_bucket_name'];
    webServerSgId = stackOutputs['web_server_sg_id'];
    bastionSgId = stackOutputs['bastion_sg_id'];
    webAsgName = stackOutputs['web_asg_name'];

    if (
      !vpcId ||
      !publicSubnetIds?.length ||
      !appBucketName ||
      !webServerSgId ||
      !bastionSgId ||
      !webAsgName
    ) {
      throw new Error('Missing one or more required stack outputs.');
    }
  });

  test('VPC exists and is available', async () => {
    const { Vpcs } = await ec2Client.send(
      new DescribeVpcsCommand({ VpcIds: [vpcId] })
    );
    expect(Vpcs?.[0]?.VpcId).toBe(vpcId);
    expect(Vpcs?.[0]?.State).toBe('available');
    expect(Vpcs?.[0]?.CidrBlock).toBe('10.0.0.0/16');
  }, 20000);

  test('Public subnets exist in VPC and are properly configured', async () => {
    const { Subnets } = await ec2Client.send(
      new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
    );
    expect(Subnets?.length).toBe(publicSubnetIds.length);

    Subnets?.forEach((subnet, index) => {
      expect(subnet.VpcId).toBe(vpcId);
      expect(subnet.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.State).toBe('available');
    });
  }, 20000);

  test('Internet Gateway exists and is attached to VPC', async () => {
    const { InternetGateways } = await ec2Client.send(
      new DescribeInternetGatewaysCommand({
        Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }],
      })
    );

    expect(InternetGateways?.length).toBeGreaterThanOrEqual(1);
    expect(InternetGateways?.[0]?.Attachments?.[0]?.VpcId).toBe(vpcId);
    expect(InternetGateways?.[0]?.Attachments?.[0]?.State).toBe('available');
  }, 20000);

  test('Public route table exists with internet gateway route', async () => {
    const { RouteTables } = await ec2Client.send(
      new DescribeRouteTablesCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      })
    );

    expect(RouteTables?.length).toBeGreaterThanOrEqual(2); // Main + public route table

    // Find the public route table (should have a route to 0.0.0.0/0)
    const publicRouteTable = RouteTables?.find(rt =>
      rt.Routes?.some(route => route.DestinationCidrBlock === '0.0.0.0/0')
    );

    expect(publicRouteTable).toBeDefined();
    expect(
      publicRouteTable?.Routes?.some(
        route =>
          route.DestinationCidrBlock === '0.0.0.0/0' &&
          route.GatewayId?.startsWith('igw-')
      )
    ).toBe(true);
  }, 20000);

  test('Web server security group exists with correct rules', async () => {
    const { SecurityGroups } = await ec2Client.send(
      new DescribeSecurityGroupsCommand({ GroupIds: [webServerSgId] })
    );

    const webSg = SecurityGroups?.[0];
    expect(webSg?.GroupId).toBe(webServerSgId);
    expect(webSg?.VpcId).toBe(vpcId);
    expect(webSg?.Description).toBe('Allows HTTP and SSH access');

    // Check ingress rules
    const ingressRules = webSg?.IpPermissions;
    expect(ingressRules?.length).toBeGreaterThanOrEqual(2);

    // Check for HTTP rule (port 80)
    const httpRule = ingressRules?.find(
      rule =>
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === 'tcp'
    );
    expect(httpRule).toBeDefined();

    // Check for SSH rule (port 22)
    const sshRule = ingressRules?.find(
      rule =>
        rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === 'tcp'
    );
    expect(sshRule).toBeDefined();
  }, 15000);

  test('Bastion security group exists with correct SSH rule', async () => {
    const { SecurityGroups } = await ec2Client.send(
      new DescribeSecurityGroupsCommand({ GroupIds: [bastionSgId] })
    );

    const bastionSg = SecurityGroups?.[0];
    expect(bastionSg?.GroupId).toBe(bastionSgId);
    expect(bastionSg?.VpcId).toBe(vpcId);
    expect(bastionSg?.Description).toBe('Allows SSH access from a trusted IP');

    // Check ingress rules
    const ingressRules = bastionSg?.IpPermissions;
    expect(ingressRules?.length).toBeGreaterThanOrEqual(1);

    // Check for SSH rule (port 22)
    const sshRule = ingressRules?.find(
      rule =>
        rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === 'tcp'
    );
    expect(sshRule).toBeDefined();
    expect(
      sshRule?.IpRanges?.some(range => range.CidrIp === '192.0.2.0/24')
    ).toBe(true);
  }, 15000);

  test('Auto Scaling Group exists with correct configuration', async () => {
    const { AutoScalingGroups } = await autoScalingClient.send(
      new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [webAsgName],
      })
    );

    const asg = AutoScalingGroups?.[0];
    expect(asg?.AutoScalingGroupName).toBe(webAsgName);
    expect(asg?.MinSize).toBe(1);
    expect(asg?.MaxSize).toBe(3);
    expect(asg?.DesiredCapacity).toBe(1);

    // Check that ASG is using the correct subnets
    expect(asg?.VPCZoneIdentifier?.split(',')).toEqual(
      expect.arrayContaining(publicSubnetIds)
    );

    // Check launch template is configured
    expect(asg?.LaunchTemplate?.LaunchTemplateId).toBeDefined();
    expect(asg?.LaunchTemplate?.Version).toBe('$Latest');
  }, 20000);

  test('Launch Template exists with correct configuration', async () => {
    // First get the ASG to find the launch template ID
    const { AutoScalingGroups } = await autoScalingClient.send(
      new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [webAsgName],
      })
    );

    const launchTemplateId =
      AutoScalingGroups?.[0]?.LaunchTemplate?.LaunchTemplateId;
    expect(launchTemplateId).toBeDefined();

    const { LaunchTemplates } = await ec2Client.send(
      new DescribeLaunchTemplatesCommand({
        LaunchTemplateIds: [launchTemplateId!],
      })
    );

    const launchTemplate = LaunchTemplates?.[0];
    expect(launchTemplate?.LaunchTemplateId).toBe(launchTemplateId);
    expect(launchTemplate?.LaunchTemplateName).toContain('tap');
    expect(launchTemplate?.LaunchTemplateName).toContain('lt');
  }, 20000);

  test('S3 bucket exists and is accessible', async () => {
    await expect(
      s3Client.send(new HeadBucketCommand({ Bucket: appBucketName }))
    ).resolves.not.toThrow();

    // Verify bucket name follows expected pattern
    expect(appBucketName).toMatch(/^tap-.+-app-assets$/);
  }, 15000);

  test('All resources have proper tags', async () => {
    // Test VPC tags
    const { Vpcs } = await ec2Client.send(
      new DescribeVpcsCommand({ VpcIds: [vpcId] })
    );
    const vpcTags = Vpcs?.[0]?.Tags;
    expect(vpcTags?.find(tag => tag.Key === 'Project')?.Value).toBe('tap');
    expect(vpcTags?.find(tag => tag.Key === 'Environment')).toBeDefined();

    // Test Security Group tags
    const { SecurityGroups } = await ec2Client.send(
      new DescribeSecurityGroupsCommand({ GroupIds: [webServerSgId] })
    );
    const sgTags = SecurityGroups?.[0]?.Tags;
    expect(sgTags?.find(tag => tag.Key === 'Project')?.Value).toBe('tap');
    expect(sgTags?.find(tag => tag.Key === 'Environment')).toBeDefined();
  }, 15000);

  test('Subnets are distributed across multiple availability zones', async () => {
    const { Subnets } = await ec2Client.send(
      new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
    );

    const uniqueAZs = new Set(Subnets?.map(subnet => subnet.AvailabilityZone));
    expect(uniqueAZs.size).toBeGreaterThanOrEqual(2);
  }, 20000);
});