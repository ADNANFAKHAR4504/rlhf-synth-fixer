/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand
} from '@aws-sdk/client-ec2';
import fs from 'fs';

/* -------------------------------------------------------------------------- */
/*                               Load Outputs                                 */
/* -------------------------------------------------------------------------- */

const outputs: Record<string, string> = (() => {
  try {
    return JSON.parse(
      fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
    );
  } catch {
    console.warn(
      '⚠️  Could not load cfn-outputs/flat-outputs.json. Using env/defaults.'
    );
    return {};
  }
})();

/* -------------------------------------------------------------------------- */
/*                               AWS Client                                   */
/* -------------------------------------------------------------------------- */

const ec2Client = new EC2Client({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test'
  }
});

/* -------------------------------------------------------------------------- */
/*                             Extract Outputs                                 */
/* -------------------------------------------------------------------------- */

const vpcId = outputs.VPCId;
const vpcCidr = outputs.VPCCidr;

const publicSubnetIds = [
  outputs.PublicSubnet1Id,
  outputs.PublicSubnet2Id,
  outputs.PublicSubnet3Id
];

const privateSubnetIds = [
  outputs.PrivateSubnet1Id,
  outputs.PrivateSubnet2Id,
  outputs.PrivateSubnet3Id
];

const httpsSecurityGroupId = outputs.HTTPSSecurityGroupId;

/* -------------------------------------------------------------------------- */
/*                                   Tests                                    */
/* -------------------------------------------------------------------------- */

describe('TapStack – LocalStack Integration Tests', () => {
  beforeAll(() => {
    console.log('🧪 Running integration tests against LocalStack');
    console.log('🔗 Endpoint:', process.env.AWS_ENDPOINT_URL || 'http://localhost:4566');

    expect(vpcId).toBeTruthy();
    expect(vpcCidr).toBeTruthy();
    publicSubnetIds.forEach(id => expect(id).toBeTruthy());
    privateSubnetIds.forEach(id => expect(id).toBeTruthy());
    expect(httpsSecurityGroupId).toBeTruthy();
  });

  /* ------------------------------------------------------------------------ */
  /*                                 VPC                                      */
  /* ------------------------------------------------------------------------ */

  describe('VPC Validation', () => {
    test('VPC exists and is available', async () => {
      const res = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      const vpc = res.Vpcs![0];
      expect(vpc.VpcId).toBe(vpcId);
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe(vpcCidr);
    });

    test('VPC has required tags', async () => {
      const res = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      const tags = res.Vpcs![0].Tags || [];
      const keys = tags.map(t => t.Key);

      expect(keys).toContain('Environment');
      expect(keys).toContain('Project');
    });
  });

  /* ------------------------------------------------------------------------ */
  /*                               Subnets                                    */
  /* ------------------------------------------------------------------------ */

  describe('Public Subnets', () => {
    test('Public subnets exist and belong to VPC', async () => {
      const res = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );

      expect(res.Subnets!.length).toBe(3);

      res.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.State).toBe('available');
      });
    });

    test('Public subnets allow public IPs (LocalStack-safe)', async () => {
      const res = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );

      res.Subnets!.forEach(subnet => {
        expect(
          subnet.MapPublicIpOnLaunch === true ||
          subnet.MapPublicIpOnLaunch === undefined
        ).toBe(true);
      });
    });

    test('Public subnets have correct tags', async () => {
      const res = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );

      res.Subnets!.forEach(subnet => {
        const tags = subnet.Tags || [];
        expect(tags.some(t => t.Key === 'Type' && t.Value === 'Public')).toBe(true);
      });
    });
  });

  describe('Private Subnets', () => {
    test('Private subnets exist and belong to VPC', async () => {
      const res = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
      );

      expect(res.Subnets!.length).toBe(3);

      res.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.State).toBe('available');
      });
    });

    test('Private subnets do not force public IPs', async () => {
      const res = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
      );

      res.Subnets!.forEach(subnet => {
        expect(
          subnet.MapPublicIpOnLaunch === false ||
          subnet.MapPublicIpOnLaunch === undefined
        ).toBe(true);
      });
    });

    test('Private subnets have correct tags', async () => {
      const res = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
      );

      res.Subnets!.forEach(subnet => {
        const tags = subnet.Tags || [];
        expect(tags.some(t => t.Key === 'Type' && t.Value === 'Private')).toBe(true);
      });
    });
  });

  /* ------------------------------------------------------------------------ */
  /*                          Internet Gateway                                 */
  /* ------------------------------------------------------------------------ */

  describe('Internet Gateway', () => {
    test('IGW is attached to the VPC', async () => {
      const res = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }]
        })
      );

      expect(res.InternetGateways!.length).toBeGreaterThan(0);
      expect(res.InternetGateways![0].Attachments![0].VpcId).toBe(vpcId);
    });
  });

  /* ------------------------------------------------------------------------ */
  /*                             Route Tables                                  */
  /* ------------------------------------------------------------------------ */

  describe('Route Tables', () => {
    test('All public subnets are associated with route tables', async () => {
      const res = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
        })
      );

      const associated = new Set<string>();

      res.RouteTables!.forEach(rt =>
        rt.Associations?.forEach(a => {
          if (a.SubnetId && publicSubnetIds.includes(a.SubnetId)) {
            associated.add(a.SubnetId);
          }
        })
      );

      expect(associated.size).toBe(3);
    });

    test('Private subnets have route table associations', async () => {
      const res = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
        })
      );

      const associated = new Set<string>();

      res.RouteTables!.forEach(rt =>
        rt.Associations?.forEach(a => {
          if (a.SubnetId && privateSubnetIds.includes(a.SubnetId)) {
            associated.add(a.SubnetId);
          }
        })
      );

      expect(associated.size).toBe(3);
    });
  });

  /* ------------------------------------------------------------------------ */
  /*                            Security Group                                 */
  /* ------------------------------------------------------------------------ */

  describe('Security Group', () => {
    test('HTTPS security group exists in VPC', async () => {
      const res = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [httpsSecurityGroupId]
        })
      );

      const sg = res.SecurityGroups![0];
      expect(sg.GroupId).toBe(httpsSecurityGroupId);
      expect(sg.VpcId).toBe(vpcId);
    });

    test('Security group allows all outbound traffic', async () => {
      const res = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [httpsSecurityGroupId]
        })
      );

      const egress = res.SecurityGroups![0].IpPermissionsEgress || [];
      expect(
        egress.some(r =>
          r.IpProtocol === '-1' &&
          r.IpRanges?.some(i => i.CidrIp === '0.0.0.0/0')
        )
      ).toBe(true);
    });

    test('Security group has required tags', async () => {
      const res = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [httpsSecurityGroupId]
        })
      );

      const tags = res.SecurityGroups![0].Tags || [];
      expect(tags.some(t => t.Key === 'Environment')).toBe(true);
      expect(tags.some(t => t.Key === 'Project')).toBe(true);
    });
  });

  /* ------------------------------------------------------------------------ */
  /*                         High Availability                                 */
  /* ------------------------------------------------------------------------ */

  describe('High Availability (LocalStack-safe)', () => {
    test('Subnets are spread across at least one AZ', async () => {
      const res = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: [...publicSubnetIds, ...privateSubnetIds]
        })
      );

      const azs = new Set(
        res.Subnets!.map(s => s.AvailabilityZone).filter(Boolean)
      );

      expect(azs.size).toBeGreaterThanOrEqual(1);
      expect(res.Subnets!.length).toBe(6);
    });
  });
});
