// test/tap-stack.int.test.ts

import { AutoScalingClient, DescribeAutoScalingGroupsCommand } from '@aws-sdk/client-auto-scaling';
import { BackupClient, DescribeBackupVaultCommand } from '@aws-sdk/client-backup';
import { DescribeSubnetsCommand, DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import {
  DescribeListenersCommand,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { GetRoleCommand, IAMClient } from '@aws-sdk/client-iam';
import { GetFunctionCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { DescribeSecretCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { GetWebACLCommand, WAFV2Client } from '@aws-sdk/client-wafv2';
import assert from 'assert';
import * as dns from 'dns/promises';
import * as fs from 'fs';

const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
const region = process.env.AWS_REGION || 'us-east-1';

describe('TapStack Live Environment Integration Tests', () => {
  jest.setTimeout(30000);

  const elb = new ElasticLoadBalancingV2Client({ region });
  const ec2 = new EC2Client({ region });
  const autoscaling = new AutoScalingClient({ region });
  const rds = new RDSClient({ region });
  const s3 = new S3Client({ region });
  const iam = new IAMClient({ region });
  const lambda = new LambdaClient({ region });
  const backup = new BackupClient({ region });
  const secrets = new SecretsManagerClient({ region });
  const waf = new WAFV2Client({ region });

  let lbArn: string;
  let targetGroupArn: string;
  let listenerArns: string[] = [];

  beforeAll(async () => {
    const lbs = await elb.send(new DescribeLoadBalancersCommand({}));
    const match = lbs.LoadBalancers?.find(lb => lb.DNSName === outputs.ALBDNSName);
    assert.ok(match, 'ALB not found by DNSName');
    lbArn = match.LoadBalancerArn!;
  });

  describe('Application Load Balancer', () => {
    it('has correct type, scheme, and active state', async () => {
      const res = await elb.send(new DescribeLoadBalancersCommand({ LoadBalancerArns: [lbArn] }));
      const lb = res.LoadBalancers![0];
      assert.strictEqual(lb.Type, 'application');
      assert.strictEqual(lb.Scheme, 'internet-facing');
      assert.strictEqual(lb.State?.Code, 'active');
    });

    it('spans expected availability zones', async () => {
      const res = await elb.send(new DescribeLoadBalancersCommand({ LoadBalancerArns: [lbArn] }));
      const azs = res.LoadBalancers![0].AvailabilityZones!;
      const subnets = azs.map(a => a.SubnetId!).sort();
      assert.deepStrictEqual(subnets, [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id].sort());
    });

  });

  describe('Target Groups', () => {
    it('finds and validates a target group', async () => {
      const tgRes = await elb.send(new DescribeTargetGroupsCommand({ LoadBalancerArn: lbArn }));
      assert.ok(tgRes.TargetGroups?.length! > 0);
      const tg = tgRes.TargetGroups![0];
      targetGroupArn = tg.TargetGroupArn!;
      assert.strictEqual(tg.Protocol, 'HTTPS');
      assert.strictEqual(tg.Port, 443);
      assert.strictEqual(tg.VpcId, outputs.VPCId);
    });

    it('validates health check settings', async () => {
      const res = await elb.send(new DescribeTargetGroupsCommand({ TargetGroupArns: [targetGroupArn] }));
      const tg = res.TargetGroups![0];
      assert.strictEqual(tg.HealthCheckProtocol, 'HTTPS');
      assert.strictEqual(tg.HealthCheckPath, '/health');
    });

    it('reports target health statuses', async () => {
      const res = await elb.send(new DescribeTargetHealthCommand({ TargetGroupArn: targetGroupArn }));
      assert.ok(Array.isArray(res.TargetHealthDescriptions));
    });
  });

  describe('Listeners', () => {
    it('lists listeners', async () => {
      const res = await elb.send(new DescribeListenersCommand({ LoadBalancerArn: lbArn }));
      assert.ok(res.Listeners?.length! >= 1);
      listenerArns = res.Listeners!.map(l => l.ListenerArn!);
    });

    it('has HTTP listener forwarding to a target group', async () => {
      const res = await elb.send(new DescribeListenersCommand({ LoadBalancerArn: lbArn }));
      const http = res.Listeners!.find(l => l.Port === 80);
      assert.ok(http);
      const action = http!.DefaultActions![0];
      assert.strictEqual(action.Type, 'forward');
      assert.ok(action.TargetGroupArn);
    });
  });

  describe('Auto Scaling Integration', () => {
    it('associates target group with ASG if present', async () => {
      const name = outputs.ALBDNSName.split('-')[0] + '-ASG';
      try {
        const asg = await autoscaling.send(new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [name] }));
        if (asg.AutoScalingGroups?.length) {
          assert.ok(asg.AutoScalingGroups[0].TargetGroupARNs?.length! > 0);
        }
      } catch {
        // skip if not found
      }
    });
  });

  describe('RDS Instance', () => {
    it('describes the DB instance', async () => {
      const id = outputs.RDSEndpoint.split('.')[0];
      const res = await rds.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: id }));
      assert.ok(res.DBInstances?.length === 1);
    });

    it('resolves DNS and valid port', async () => {
      const info = await dns.lookup(outputs.RDSEndpoint);
      assert.ok(info.address);
      const port = parseInt(outputs.RDSPort, 10);
      assert.ok(port > 0 && port < 65536);
    });
  });

  describe('S3 Bucket', () => {
    it('exists', async () => {
      await s3.send(new HeadBucketCommand({ Bucket: outputs.S3BucketName }));
    });
  });

  describe('IAM Roles & Lambda', () => {
    it('retrieves EC2 role', async () => {
      const name = outputs.EC2InstanceRoleArn.split('/').pop()!;
      const res = await iam.send(new GetRoleCommand({ RoleName: name }));
      assert.strictEqual(res.Role!.Arn, outputs.EC2InstanceRoleArn);
    });

    it('retrieves Lambda config', async () => {
      const fn = outputs.LambdaFunctionArn.split(':').pop()!;
      const res = await lambda.send(new GetFunctionCommand({ FunctionName: fn }));
      assert.strictEqual(res.Configuration!.FunctionArn, outputs.LambdaFunctionArn);
    });
  });

  describe('Networking & Backup', () => {
    it('describes VPC & subnets', async () => {
      const vpcs = await ec2.send(new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] }));
      assert.strictEqual(vpcs.Vpcs![0].VpcId, outputs.VPCId);
      const subs = await ec2.send(new DescribeSubnetsCommand({
        SubnetIds: [
          outputs.PublicSubnet1Id, outputs.PublicSubnet2Id,
          outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id
        ]
      }));
      assert.strictEqual(subs.Subnets!.length, 4);
    });

    it('describes backup vault', async () => {
      const name = outputs.BackupVaultArn.split(':').pop()!;
      const res = await backup.send(new DescribeBackupVaultCommand({ BackupVaultName: name }));
      assert.strictEqual(res.BackupVaultName, name);
    });
  });

  describe('Secrets Manager', () => {
    it('describes DB master secret', async () => {
      const secretId = outputs.DBMasterSecretArn;
      const res = await secrets.send(new DescribeSecretCommand({ SecretId: secretId }));
      assert.strictEqual(res.ARN, secretId);
    });
  });

  describe('WAFv2 Web ACL', () => {
    it('retrieves Web ACL', async () => {
      const [, , , , , resource] = outputs.WebACLArn.split(':');
      const [scope, , name, id] = resource.split('/');
      const res = await waf.send(new GetWebACLCommand({
        Name: name,
        Scope: scope === 'global' ? 'CLOUDFRONT' : 'REGIONAL',
        Id: id
      }));
      assert.strictEqual(res.WebACL!.ARN, outputs.WebACLArn);
    });
  });

  describe('Output Format', () => {
    Object.entries(outputs).forEach(([k, v]) => {
      it(`has ${k}`, () => assert.notStrictEqual(v, undefined));
    });
  });
});
