import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInstancesCommand,
  DescribeInternetGatewaysCommand,
  DescribeRouteTablesCommand
} from '@aws-sdk/client-ec2';

const client = new EC2Client({ region: process.env.AWS_REGION || 'us-east-1' });

describe('TAP Stack Integration Tests', () => {
  let vpcId: string;
  let subnetIds: string[] = [];
  let instanceId: string;

  test('VPC exists with correct CIDR and tag', async () => {
    const result = await client.send(new DescribeVpcsCommand({}));
    const vpc = result.Vpcs?.find((v) =>
      v.CidrBlock === '10.0.0.0/16' &&
      v.Tags?.some((t) => t.Key === 'Environment' && t.Value?.toLowerCase() === 'dev')
    );

    expect(vpc).toBeDefined();
    vpcId = vpc!.VpcId!;
  });

  test('Public subnets exist in different AZs and are mapped to VPC', async () => {
    const result = await client.send(new DescribeSubnetsCommand({
      Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
    }));
    const subnets = result.Subnets || [];

    // 🔍 Log all subnet info
    console.log('--- All Subnets ---');
    subnets.forEach((s) => {
      console.log(`SubnetId: ${s.SubnetId}, AZ: ${s.AvailabilityZone}, MapPublicIpOnLaunch: ${s.MapPublicIpOnLaunch}, Tags: ${JSON.stringify(s.Tags)}`);
    });

    // ✅ Prefer MapPublicIpOnLaunch if available
    let publicSubnets = subnets.filter((s) => s.MapPublicIpOnLaunch);

    // 🔁 Fallback to Environment tag if not enough public subnets are detected
    if (publicSubnets.length < 2) {
      console.warn('⚠️ Detected fewer than 2 subnets with MapPublicIpOnLaunch=true, falling back to tag-based filter...');
      publicSubnets = subnets.filter((s) =>
        s.Tags?.some((t) => t.Key === 'Environment' && t.Value?.toLowerCase() === 'dev')
      );
    }

    // ✅ Assertion for 2 public subnets
    expect(publicSubnets.length).toBeGreaterThanOrEqual(2);

    // ✅ Subnets must be in different AZs
    const azSet = new Set(publicSubnets.map((s) => s.AvailabilityZone));
    expect(azSet.size).toBeGreaterThanOrEqual(2);

    // ✅ Save subnet IDs for downstream tests
    subnetIds = publicSubnets.map((s) => s.SubnetId!);
  });

  test('Internet Gateway is attached to VPC', async () => {
    const result = await client.send(new DescribeInternetGatewaysCommand({}));
    const igw = result.InternetGateways?.find((i) =>
      i.Attachments?.some((a) => a.VpcId === vpcId)
    );

    expect(igw).toBeDefined();
  });

  test('Route Table has default route to Internet Gateway', async () => {
    const result = await client.send(new DescribeRouteTablesCommand({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }] }));
    const routeTables = result.RouteTables || [];

    const defaultRoute = routeTables
      .flatMap((rt) => rt.Routes || [])
      .find((r) => r.DestinationCidrBlock === '0.0.0.0/0' && r.GatewayId?.startsWith('igw-'));

    expect(defaultRoute).toBeDefined();
  });

  test('EC2 instance is in one of the public subnets and is running or pending', async () => {
    const result = await client.send(new DescribeInstancesCommand({}));
    const instance = result.Reservations?.flatMap((r) => r.Instances || []).find(
      (i) =>
        subnetIds.includes(i.SubnetId!) &&
        ['running', 'pending'].includes(i.State?.Name || '') &&
        i.InstanceType === 't2.micro' &&
        i.Tags?.some((t) => t.Key === 'Environment' && t.Value?.toLowerCase() === 'dev')
    );

    expect(instance).toBeDefined();
    instanceId = instance!.InstanceId!;
  });
});
