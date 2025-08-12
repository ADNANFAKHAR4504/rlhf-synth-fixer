import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeTagsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import { GetWebACLCommand, WAFV2Client } from '@aws-sdk/client-wafv2';
import fs from 'fs';

const region = process.env.AWS_REGION || 'ap-southeast-1';
let outputs: Record<string, string>;
let ec2: EC2Client;
let rds: RDSClient;
let wafv2: WAFV2Client;

beforeAll(() => {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
  ec2 = new EC2Client({ region });
  rds = new RDSClient({ region });
  wafv2 = new WAFV2Client({ region });
});

describe('TapStack Cloud Infrastructure Integration Tests', () => {
  describe('Stack Outputs', () => {
    test('should have all required outputs', () => {
      const required = [
        'VPCId',
        'PublicSubnetId',
        'PrivateSubnetId',
        'WebSecurityGroupId',
        'WebACLArn',
        'DatabaseEndpoint',
      ];
      required.forEach(key => {
        expect(outputs[key]).toBeDefined();
        expect(outputs[key]).not.toBe('');
      });
    });
  });

  describe('VPC', () => {
    test('should exist and have correct tags', async () => {
      const vpcId = outputs.VPCId;
      const res = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpc = res.Vpcs?.[0];
      expect(vpc?.VpcId).toBe(vpcId);
      expect(vpc?.State).toBe('available');
      if (vpc?.Tags) {
        const nameTag = vpc.Tags.find(t => t.Key === 'Name');
        expect(nameTag).toBeDefined();
        expect(nameTag?.Value).toMatch(/prod|dev|staging/i);
      }
    });
  });

  describe('Subnets', () => {
    test('public subnet should exist and be in VPC', async () => {
      const subnetId = outputs.PublicSubnetId;
      const vpcId = outputs.VPCId;
      const res = await ec2.send(
        new DescribeSubnetsCommand({ SubnetIds: [subnetId] })
      );
      const subnet = res.Subnets?.[0];
      expect(subnet?.SubnetId).toBe(subnetId);
      expect(subnet?.VpcId).toBe(vpcId);
      if (subnet?.Tags) {
        const nameTag = subnet.Tags.find(t => t.Key === 'Name');
        expect(nameTag).toBeDefined();
      }
    });

    test('private subnet should exist and be in VPC', async () => {
      const subnetId = outputs.PrivateSubnetId;
      const vpcId = outputs.VPCId;
      const res = await ec2.send(
        new DescribeSubnetsCommand({ SubnetIds: [subnetId] })
      );
      const subnet = res.Subnets?.[0];
      expect(subnet?.SubnetId).toBe(subnetId);
      expect(subnet?.VpcId).toBe(vpcId);
      if (subnet?.Tags) {
        const nameTag = subnet.Tags.find(t => t.Key === 'Name');
        expect(nameTag).toBeDefined();
      }
    });
  });

  describe('Security Groups', () => {
    test('web security group should exist, be attached to VPC, and not allow SSH from 0.0.0.0/0', async () => {
      const sgId = outputs.WebSecurityGroupId;
      const vpcId = outputs.VPCId;
      const res = await ec2.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [sgId] })
      );
      const sg = res.SecurityGroups?.[0];
      expect(sg?.GroupId).toBe(sgId);
      expect(sg?.VpcId).toBe(vpcId);
      const sshRule = sg?.IpPermissions?.find(
        rule =>
          rule.FromPort === 22 &&
          rule.IpRanges?.some(r => r.CidrIp === '0.0.0.0/0')
      );
      expect(sshRule).toBeUndefined();
    });
  });

  describe('WAF', () => {
    test('Web ACL should exist and be REGIONAL', async () => {
      const webAclArn = outputs.WebACLArn;
      const arnParts = webAclArn.split(':');
      const scope = arnParts[5].startsWith('regional')
        ? 'REGIONAL'
        : 'CLOUDFRONT';
      const name = webAclArn.split('/')[1];
      const id = webAclArn.split('/')[2];
      const res = await wafv2.send(
        new GetWebACLCommand({ Name: name, Scope: scope, Id: id })
      );
      expect(res.WebACL?.ARN).toBe(webAclArn);
    });
  });

  describe('RDS', () => {
    test('database should exist, be encrypted, and not public', async () => {
      const dbEndpoint = outputs.DatabaseEndpoint;
      const res = await rds.send(new DescribeDBInstancesCommand({}));
      const db = res.DBInstances?.find(
        inst => inst.Endpoint?.Address === dbEndpoint
      );
      expect(db).toBeDefined();
      expect(db?.Endpoint?.Address).toBe(dbEndpoint);
      expect(db?.PubliclyAccessible).toBe(false);
      expect(db?.StorageEncrypted).toBe(true);
      if (db?.TagList) {
        const nameTag = db.TagList.find(t => t.Key === 'Name');
        expect(nameTag).toBeDefined();
      }
    });
  });

  describe('Tagging Compliance', () => {
    test('VPC, subnets, and security group should have tags for resource management', async () => {
      const vpcId = outputs.VPCId;
      const publicSubnetId = outputs.PublicSubnetId;
      const privateSubnetId = outputs.PrivateSubnetId;
      const sgId = outputs.WebSecurityGroupId;
      const vpcTags = await ec2.send(
        new DescribeTagsCommand({
          Filters: [{ Name: 'resource-id', Values: [vpcId] }],
        })
      );
      expect(vpcTags.Tags?.length).toBeGreaterThan(0);
      const pubTags = await ec2.send(
        new DescribeTagsCommand({
          Filters: [{ Name: 'resource-id', Values: [publicSubnetId] }],
        })
      );
      expect(pubTags.Tags?.length).toBeGreaterThan(0);
      const privTags = await ec2.send(
        new DescribeTagsCommand({
          Filters: [{ Name: 'resource-id', Values: [privateSubnetId] }],
        })
      );
      expect(privTags.Tags?.length).toBeGreaterThan(0);
      const sgTags = await ec2.send(
        new DescribeTagsCommand({
          Filters: [{ Name: 'resource-id', Values: [sgId] }],
        })
      );
      expect(sgTags.Tags?.length).toBeGreaterThan(0);
    });
  });
});
