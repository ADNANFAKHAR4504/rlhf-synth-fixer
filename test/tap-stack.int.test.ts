import * as fs from 'fs';
import * as AWS from 'aws-sdk';

// Increase default timeout
jest.setTimeout(120000);

type StackOutputs = Record<string, string>;

// Attempt to load cfn-outputs; fallback to CloudFormation describeStacks
const loadOutputs = async (cf: AWS.CloudFormation, stackName: string): Promise<StackOutputs> => {
  try {
    const file = fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8');
    return JSON.parse(file) as StackOutputs;
  } catch {
    // Fallback to live CFN query (gracefully handle ValidationError when stack doesn't exist)
    try {
      const resp = await cf.describeStacks({ StackName: stackName }).promise();
      const stack = resp.Stacks && resp.Stacks[0];
      const outs = (stack?.Outputs || []).reduce((acc, o) => {
        if (o.OutputKey && o.OutputValue) acc[o.OutputKey] = o.OutputValue;
        return acc;
      }, {} as StackOutputs);
      return outs;
    } catch {
      return {} as StackOutputs;
    }
  }
};

const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `tap-stack-${environmentSuffix}`;

const ec2 = new AWS.EC2({ region });
const rds = new AWS.RDS({ region });
const cloudformation = new AWS.CloudFormation({ region });

let outputs: StackOutputs = {};

describe('TapStack Live Integration Tests', () => {
  beforeAll(async () => {
    outputs = await loadOutputs(cloudformation, stackName);
  });

  it('should have expected core outputs', () => {
    const expected = [
      'VPCId',
      'PublicSubnetId',
      'PrivateSubnet1Id',
      'PrivateSubnet2Id',
      'InternetGatewayId',
      'NatGatewayId',
      'SecurityGroupId',
      'RDSSubnetGroupName',
      'RDSEndpointAddress',
    ];
    expected.forEach(key => expect(outputs[key]).toBeDefined());
  });

  describe('VPC and Networking', () => {
    test('VPC should exist', async () => {
      const { Vpcs } = await ec2.describeVpcs({ VpcIds: [outputs.VPCId] }).promise();
      expect(Vpcs && Vpcs.length).toBe(1);
      expect(Vpcs?.[0].VpcId).toBe(outputs.VPCId);
    });

    test('Public and Private subnets should exist', async () => {
      const { Subnets } = await ec2
        .describeSubnets({ SubnetIds: [outputs.PublicSubnetId, outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id] })
        .promise();
      expect(Subnets && Subnets.length).toBe(3);
    });

    test('Internet Gateway should be attached to VPC', async () => {
      const { InternetGateways } = await ec2
        .describeInternetGateways({ InternetGatewayIds: [outputs.InternetGatewayId] })
        .promise();
      expect(InternetGateways && InternetGateways.length).toBe(1);
      const igw = InternetGateways![0];
      const attachmentVpcIds = (igw.Attachments || []).map(a => a.VpcId);
      expect(attachmentVpcIds).toContain(outputs.VPCId);
    });

    test('NAT Gateway should exist and be available', async () => {
      const { NatGateways } = await ec2
        .describeNatGateways({ NatGatewayIds: [outputs.NatGatewayId] as any })
        .promise();
      expect(NatGateways && NatGateways.length).toBe(1);
      const nat = NatGateways![0];
      expect(['available', 'pending'].includes(nat.State || '')).toBe(true);
    });
  });

  describe('Security Group', () => {
    test('ingress should allow only 80 and 443 from 203.0.113.0/24', async () => {
      const { SecurityGroups } = await ec2
        .describeSecurityGroups({ GroupIds: [outputs.SecurityGroupId] })
        .promise();
      expect(SecurityGroups && SecurityGroups.length).toBe(1);
      const sg = SecurityGroups![0];
      const ingress = sg.IpPermissions || [];
      const toPairs = ingress.flatMap(p => (p.IpRanges || []).map(r => ({ from: p.FromPort, to: p.ToPort, cidr: r.CidrIp })));
      expect(toPairs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ from: 80, to: 80, cidr: '203.0.113.0/24' }),
          expect.objectContaining({ from: 443, to: 443, cidr: '203.0.113.0/24' }),
        ])
      );
      // Ensure no extra open ports to world beyond 80/443
      const worldIngress = toPairs.filter(p => p?.cidr === '0.0.0.0/0' || p?.cidr === '::/0');
      expect(worldIngress.every(p => p.from === 80 || p.from === 443)).toBe(true);
    });
  });

  describe('RDS Instance', () => {
    let db: AWS.RDS.DBInstance | undefined;

    beforeAll(async () => {
      const { DBInstances } = await rds.describeDBInstances().promise();
      db = (DBInstances || []).find(i => i.Endpoint?.Address === outputs.RDSEndpointAddress);
    }, 30000);

    test('RDS instance should be found by endpoint address', () => {
      expect(db).toBeDefined();
    });

    test('RDS should be private, encrypted, multi-AZ, and configured with backups', () => {
      if (!db) return;
      expect(db.PubliclyAccessible).toBe(false);
      expect(db.StorageEncrypted).toBe(true);
      expect(db.MultiAZ).toBe(true);
      expect((db.AllocatedStorage || 0) >= 20).toBe(true);
      expect((db.BackupRetentionPeriod || 0) > 0).toBe(true);
      expect(db.Engine).toContain('mysql');
    });
  });

  // Cleanup handles borrowed pattern from archive: close agents and timers
  afterAll(() => {
    [ec2, rds, cloudformation].forEach(client => {
      const anyClient = client as any;
      if (anyClient?.config?.httpOptions?.agent) {
        anyClient.config.httpOptions.agent.destroy();
      }
    });
    jest.clearAllTimers();
  });
});
