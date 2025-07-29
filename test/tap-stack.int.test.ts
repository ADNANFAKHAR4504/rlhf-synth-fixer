import {
  DescribeInternetGatewaysCommand,
  DescribeNetworkAclsCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';

// Set region to match the stack
const REGION = 'us-west-2';
const VPC_CIDR = '10.0.0.0/16';
const PUBLIC_SUBNET_CIDRS = ['10.0.0.0/24', '10.0.1.0/24'];

const ec2 = new EC2Client({ region: REGION });

describe('SecureVpcStack Integration (AWS SDK)', () => {
  let vpcId: string;
  let subnetIds: string[] = [];

  it('should provision a VPC with the correct CIDR block', async () => {
    const vpcs = await ec2.send(
      new DescribeVpcsCommand({
        Filters: [
          { Name: 'tag:CommitAuthor', Values: [process.env.COMMIT_AUTHOR!] },
        ],
      })
    );

    console.log('Found VPCs:', vpcs);

    expect(vpcs.Vpcs).toBeDefined();
    expect(vpcs.Vpcs!.length).toBeGreaterThan(0);
    vpcId = vpcs.Vpcs![0].VpcId!;
    expect(vpcs.Vpcs![0].CidrBlock).toBe(VPC_CIDR);
  });

  it('should create two public subnets in different AZs with correct CIDRs', async () => {
    const subnets = await ec2.send(
      new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      })
    );
    expect(subnets.Subnets).toBeDefined();
    console.log('Found Subnets:', subnets.Subnets);

    // Check for both expected CIDRs
    const foundCidrs = subnets.Subnets!.map(s => s.CidrBlock);
    expect(foundCidrs.length).toBe(PUBLIC_SUBNET_CIDRS.length);
    foundCidrs.forEach(cid => {
      expect(PUBLIC_SUBNET_CIDRS).toContain(cid);
    });

    // Check for 2 AZs
    const azs = subnets.Subnets!.map(s => s.AvailabilityZone);
    expect(azs.length).toBe(2);
    subnetIds = subnets.Subnets!.map(s => s.SubnetId!);
  });

  it('should attach an Internet Gateway to the VPC', async () => {
    const igws = await ec2.send(
      new DescribeInternetGatewaysCommand({
        Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }],
      })
    );
    expect(igws.InternetGateways).toBeDefined();
    expect(igws.InternetGateways!.length).toBeGreaterThan(0);
  });

  it('should have public route tables routing 0.0.0.0/0 to the IGW', async () => {
    const routeTables = await ec2.send(
      new DescribeRouteTablesCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      })
    );
    const hasDefaultRoute = routeTables.RouteTables!.some(rt =>
      rt.Routes?.some(
        route =>
          route.DestinationCidrBlock === '0.0.0.0/0' &&
          route.GatewayId &&
          route.GatewayId.startsWith('igw-')
      )
    );
    expect(hasDefaultRoute).toBe(true);
  });

  it('should have a NACL allowing only inbound HTTP/HTTPS and denying all else', async () => {
    const nacls = await ec2.send(
      new DescribeNetworkAclsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      })
    );
    expect(nacls.NetworkAcls).toBeDefined();
    // Check for allow rules for 80 and 443, and deny all others
    const ingressRules = nacls
      .NetworkAcls!.flatMap(nacl => nacl.Entries!)
      .filter(e => !e.Egress);
    const allow80 = ingressRules.find(
      e =>
        e.RuleAction === 'allow' &&
        e.Protocol === '6' &&
        e.PortRange?.From === 80 &&
        e.PortRange.To === 80
    );
    const allow443 = ingressRules.find(
      e =>
        e.RuleAction === 'allow' &&
        e.Protocol === '6' &&
        e.PortRange?.From === 443 &&
        e.PortRange.To === 443
    );
    const denyAll = ingressRules.find(
      e => e.RuleAction === 'deny' && e.Protocol === '-1'
    );
    expect(allow80).toBeDefined();
    expect(allow443).toBeDefined();
    expect(denyAll).toBeDefined();
  });

  it('should have a security group allowing only inbound HTTP/HTTPS from 0.0.0.0/0', async () => {
    const sgs = await ec2.send(
      new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      })
    );
    expect(sgs.SecurityGroups).toBeDefined();
    console.log('Found Security Groups:', sgs.SecurityGroups);

    // Find SG with correct rules
    const sg = sgs.SecurityGroups!.find(
      sg =>
        sg.IpPermissions?.some(
          p =>
            p.FromPort === 80 &&
            p.ToPort === 80 &&
            p.IpProtocol === 'tcp' &&
            p.IpRanges?.some(r => r.CidrIp === '0.0.0.0/0')
        ) &&
        sg.IpPermissions?.some(
          p =>
            p.FromPort === 443 &&
            p.ToPort === 443 &&
            p.IpProtocol === 'tcp' &&
            p.IpRanges?.some(r => r.CidrIp === '0.0.0.0/0')
        )
    );
    console.log('Security Group:', sg);
    expect(sg).toBeDefined();
    // Should not allow other inbound ports
    const otherIngress = sg!.IpPermissions!.filter(
      p => ![80, 443].includes(p.FromPort ?? -1)
    );
    expect(otherIngress.length).toBe(0);
  });
});
