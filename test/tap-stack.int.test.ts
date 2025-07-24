import {
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeDBInstancesCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import fs from 'fs';

const region = process.env.AWS_REGION || 'us-east-1';
const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf-8'));

const ec2 = new EC2Client({ region });
const rds = new RDSClient({ region });
const elbv2 = new ElasticLoadBalancingV2Client({ region });

describe('Highly Available Web App Infrastructure - Integration Tests', () => {
  test('VPC should exist', async () => {
    const res = await ec2.send(new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] }));
    expect(res.Vpcs?.length).toBe(1);
  });

  test('Subnets should exist and be in the correct VPC', async () => {
    const res = await ec2.send(new DescribeSubnetsCommand({
      SubnetIds: [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
      ],
    }));
    expect(res.Subnets?.length).toBe(4);
    res.Subnets?.forEach(s => {
      expect(s.VpcId).toBe(outputs.VPCId);
    });
  });

  test('RDS instance should be available, Multi-AZ and encrypted', async () => {
    const res = await rds.send(new DescribeDBInstancesCommand({
      DBInstanceIdentifier: outputs.RDSInstanceId,
    }));
    const db = res.DBInstances?.[0];
    expect(db?.DBInstanceStatus).toBe('available');
    expect(db?.MultiAZ).toBe(true);
    expect(db?.StorageEncrypted).toBe(true);
  });

  test('ALB should be active and correctly configured', async () => {
    const res = await elbv2.send(new DescribeLoadBalancersCommand({
      LoadBalancerArns: [outputs.LoadBalancerArn],
    }));
    const alb = res.LoadBalancers?.[0];
    expect(alb?.Scheme).toBe('internet-facing');
    expect(alb?.DNSName).toBe(outputs.LoadBalancerDNSName);
  });

  test('ALB Target Group should have healthy targets', async () => {
    const tgRes = await elbv2.send(new DescribeTargetGroupsCommand({
      TargetGroupArns: [outputs.TargetGroupArn],
    }));
    expect(tgRes.TargetGroups?.length).toBe(1);

    const healthRes = await elbv2.send(new DescribeTargetHealthCommand({
      TargetGroupArn: outputs.TargetGroupArn,
    }));
    expect(healthRes.TargetHealthDescriptions?.length).toBeGreaterThan(0);
    healthRes.TargetHealthDescriptions?.forEach(t => {
      expect(t.TargetHealth?.State).toBe('healthy');
    });
  });

  test('All required output keys should be present', () => {
    const expected = [
      'VPCId',
      'PublicSubnet1Id',
      'PublicSubnet2Id',
      'PrivateSubnet1Id',
      'PrivateSubnet2Id',
      'RDSInstanceId',
      'LoadBalancerDNSName',
      'LoadBalancerArn',
      'TargetGroupArn',
    ];
    expected.forEach(key => {
      expect(outputs[key]).toBeDefined();
    });
  });

  test('LoadBalancer DNS name should be a valid DNS format', () => {
    expect(outputs.LoadBalancerDNSName).toMatch(/^[a-z0-9-]+\.[a-z0-9.-]+\.elb\.amazonaws\.com$/);
  });
});
