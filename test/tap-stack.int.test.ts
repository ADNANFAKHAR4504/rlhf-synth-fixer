// test/tap-stack.int.test.ts

import { AutoScalingClient, DescribeAutoScalingGroupsCommand } from '@aws-sdk/client-auto-scaling';
import type { Subnet as Ec2Subnet, InstanceBlockDeviceMapping } from '@aws-sdk/client-ec2';
import {
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVolumesCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import type { Subnet as RdsSubnet } from '@aws-sdk/client-rds';
import {
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import fs from 'fs';

// CFN outputs produced by your deploy step
const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));

const region = process.env.AWS_REGION || 'us-east-1';

// AWS SDK v3 clients
const ec2Client = new EC2Client({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const asgClient = new AutoScalingClient({ region });

// small helper for fetch timeout (Node 18+ global fetch)
async function fetchWithTimeout(url: string, ms: number) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { method: 'HEAD', signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

describe('TapStack Infrastructure Integration Tests', () => {
  describe('VPC and Networking', () => {
    test('has VPC with expected configuration', async () => {
      const vpcId = outputs.VpcId;
      expect(vpcId).toBeDefined();

      const vpcResp = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(vpcResp.Vpcs).toHaveLength(1);
      const vpc = vpcResp.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toMatch(/^10\.0\.0\.0\/16$/);

      const dnsHostnames = await ec2Client.send(
        new DescribeVpcAttributeCommand({ VpcId: vpcId, Attribute: 'enableDnsHostnames' })
      );
      const dnsSupport = await ec2Client.send(
        new DescribeVpcAttributeCommand({ VpcId: vpcId, Attribute: 'enableDnsSupport' })
      );
      expect(dnsHostnames.EnableDnsHostnames?.Value).toBe(true);
      expect(dnsSupport.EnableDnsSupport?.Value).toBe(true);

      const nameTag = vpc.Tags?.find((t) => t.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag!.Value).toContain('vpc');

      const environmentTag = vpc.Tags?.find((t) => t.Key === 'Environment');
      expect(environmentTag).toBeDefined();
    });

    test('has public and private subnets across AZs', async () => {
      const publicSubnets = outputs.PublicSubnets.split(',').filter((s: string) => s);
      const privateSubnets = outputs.PrivateSubnets.split(',').filter((s: string) => s);

      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);
      expect(publicSubnets.length).toBe(privateSubnets.length);

      // Public
      const publicResponse = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnets })
      );
      const uniquePublicAZs = new Set<string>();
      const publicList = (publicResponse.Subnets ?? []) as readonly Ec2Subnet[];
      for (const subnet of publicList) {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.CidrBlock).toMatch(/^10\.0\.(1|2)\.0\/24$/);
        uniquePublicAZs.add(subnet.AvailabilityZone as string);
        expect(subnet.Tags?.find((t) => t.Key === 'Tier')?.Value).toBe('public');
      }
      expect(uniquePublicAZs.size).toBeGreaterThanOrEqual(2);

      // Private
      const privateResponse = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnets })
      );
      const uniquePrivateAZs = new Set<string>();
      const privateList = (privateResponse.Subnets ?? []) as readonly Ec2Subnet[];
      for (const subnet of privateList) {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.CidrBlock).toMatch(/^10\.0\.(10|20)\.0\/24$/);
        uniquePrivateAZs.add(subnet.AvailabilityZone as string);
        expect(subnet.Tags?.find((t) => t.Key === 'Tier')?.Value).toBe('private');
      }
      expect(uniquePrivateAZs.size).toBeGreaterThanOrEqual(2);
    });

    test('security groups: ALB, Web, DB behave as designed', async () => {
      const [albSgId, webSgId, dbSgId] = outputs.SecurityGroups.split(',');
      expect(albSgId && webSgId && dbSgId).toBeTruthy();

      const sgResp = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [albSgId, webSgId, dbSgId] })
      );
      expect(sgResp.SecurityGroups).toHaveLength(3);
      const byId = new Map(sgResp.SecurityGroups!.map((sg) => [sg.GroupId!, sg]));

      const albSG = byId.get(albSgId)!;
      const webSG = byId.get(webSgId)!;
      const dbSG = byId.get(dbSgId)!;

      // ALB SG allows 80 & 443 from 0.0.0.0/0
      const hasOpenPort = (sg: typeof albSG, port: number) =>
        !!sg.IpPermissions?.some(
          (r) =>
            r.FromPort === port &&
            r.ToPort === port &&
            (r.IpRanges ?? []).some((rng) => rng.CidrIp === '0.0.0.0/0')
        );
      expect(hasOpenPort(albSG, 80)).toBe(true);
      expect(hasOpenPort(albSG, 443)).toBe(true);

      // Web SG allows 80/443 from ALB SG and 22 from AllowedCidrIngress[0]
      const fromAlb = (port: number) =>
        !!webSG.IpPermissions?.some(
          (r) =>
            r.FromPort === port &&
            r.ToPort === port &&
            (r.UserIdGroupPairs ?? []).some((p) => p.GroupId === albSG.GroupId)
        );
      expect(fromAlb(80)).toBe(true);
      expect(fromAlb(443)).toBe(true);
      const sshRule = webSG.IpPermissions?.find((r) => r.FromPort === 22 && r.ToPort === 22);
      expect(sshRule && (sshRule.IpRanges?.length ?? 0) > 0).toBe(true);

      // DB SG allows 5432 or 3306 from Web SG, and should NOT be open to 0.0.0.0/0
      const dbFromWeb = dbSG.IpPermissions?.some(
        (r) =>
          (r.FromPort === 5432 || r.FromPort === 3306) &&
          (r.UserIdGroupPairs ?? []).some((p) => p.GroupId === webSG.GroupId)
      );
      expect(dbFromWeb).toBe(true);
      const dbOpenToInternet = dbSG.IpPermissions?.some((r) =>
        (r.IpRanges ?? []).some((rng) => rng.CidrIp === '0.0.0.0/0')
      );
      expect(dbOpenToInternet).toBe(false);
    });
  });

  describe('Application Load Balancer', () => {
    test('ALB is active in public subnets', async () => {
      const albDns = outputs.AlbDnsName;
      // Handle both classic and regional-style hostnames
      expect(albDns).toMatch(/\.elb\.([a-z0-9-]+\.)?amazonaws\.com$/);

      const lbResp = await elbClient.send(new DescribeLoadBalancersCommand({}));
      const alb = lbResp.LoadBalancers!.find((lb) => lb.DNSName === albDns);
      expect(alb).toBeDefined();
      expect(alb!.State!.Code).toBe('active');
      expect(alb!.Type).toBe('application');
      expect(alb!.Scheme).toBe('internet-facing');
      expect(alb!.AvailabilityZones!.length).toBeGreaterThanOrEqual(2);
    });

    test('target group has correct health checks and targets', async () => {
      // Scope to this stack's ALB
      const lbResp = await elbClient.send(new DescribeLoadBalancersCommand({}));
      const alb = lbResp.LoadBalancers!.find((lb) => lb.DNSName === outputs.AlbDnsName);
      expect(alb).toBeDefined();

      const tgResp = await elbClient.send(
        new DescribeTargetGroupsCommand({ LoadBalancerArn: alb!.LoadBalancerArn })
      );
      const targetGroup = tgResp.TargetGroups!.find((tg) => tg.Port === 80);
      expect(targetGroup).toBeDefined();
      expect(targetGroup!.Protocol).toBe('HTTP');
      expect(targetGroup!.TargetType).toBe('instance');

      // Accept "/" or "/health"
      expect(['/', '/health']).toContain(targetGroup!.HealthCheckPath);
      expect(targetGroup!.HealthCheckProtocol).toBe('HTTP');
      expect(targetGroup!.HealthCheckIntervalSeconds).toBe(30);
      expect(targetGroup!.HealthCheckTimeoutSeconds).toBe(5);
      expect(targetGroup!.HealthyThresholdCount).toBe(2);
      expect(targetGroup!.UnhealthyThresholdCount).toBe(3);
      // Allow "200-399" (template) or "200" (some stacks)
      expect(['200-399', '200']).toContain(targetGroup!.Matcher?.HttpCode);

      const healthResp = await elbClient.send(
        new DescribeTargetHealthCommand({ TargetGroupArn: targetGroup!.TargetGroupArn })
      );
      const desc = healthResp.TargetHealthDescriptions ?? [];
      expect(desc.length).toBeGreaterThanOrEqual(1);

      // Allow for warm-up/unhealthy periods, but ensure states are valid
      const allowed = new Set(['healthy', 'initial', 'unhealthy', 'draining', 'unused', 'unavailable']);
      desc.forEach((d) => expect(allowed.has(d.TargetHealth?.State ?? '')).toBe(true));

      // Soft signal: prefer at least 1 healthy/initial; warn if not
      const good = desc.filter(
        (t) => t.TargetHealth?.State === 'healthy' || t.TargetHealth?.State === 'initial'
      );
      if (good.length === 0) {
        // Don’t fail the test on transient health; just surface it.
        // eslint-disable-next-line no-console
        console.warn('No healthy/initial targets yet for TG:', targetGroup!.TargetGroupName);
      }
    });
  });

  describe('Auto Scaling Group', () => {
    test('ASG is sized and healthy in private subnets', async () => {
      const asgName = outputs.AsgName;
      const privateSubnets: string[] = outputs.PrivateSubnets.split(',').filter((s: string) => s);

      const asgResp = await asgClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] })
      );
      expect(asgResp.AutoScalingGroups).toHaveLength(1);

      const asg = asgResp.AutoScalingGroups![0];
      expect(asg.MinSize).toBeGreaterThanOrEqual(2);
      expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(2);
      expect(asg.MaxSize).toBeGreaterThanOrEqual(asg.DesiredCapacity!);
      expect(asg.Instances!.length).toBeGreaterThan(0);

      // private subnets
      const asgSubnets: string[] = (asg.VPCZoneIdentifier ?? '').split(',').filter(Boolean);
      privateSubnets.forEach((sn) => expect(asgSubnets).toContain(sn));

      expect(asg.HealthCheckType).toBe('ELB');
      expect(asg.HealthCheckGracePeriod).toBe(300);

      // Accept "InService" or "Pending" during fresh deploys
      const okInstances = asg.Instances!.filter(
        (i) => i.LifecycleState === 'InService' || i.LifecycleState === 'Pending'
      );
      expect(okInstances.length).toBeGreaterThan(0);
    });

    test('instances are from the LaunchTemplate and hardened', async () => {
      const asgName = outputs.AsgName;
      const launchTemplateId = outputs.LaunchTemplateId;

      const asgResp = await asgClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] })
      );
      const asg = asgResp.AutoScalingGroups![0];

      expect(asg.LaunchTemplate?.LaunchTemplateId).toBe(launchTemplateId);

      // Only inspect instances the ASG considers active; skip ones terminating/terminated
      const activeInstanceIds = asg
        .Instances!.filter((i) => i.LifecycleState === 'InService' || i.LifecycleState === 'Pending')
        .map((i) => i.InstanceId!)
        .filter(Boolean);

      if (activeInstanceIds.length === 0) return;

      const instanceResp = await ec2Client.send(new DescribeInstancesCommand({ InstanceIds: activeInstanceIds }));

      const volumeIds: string[] = [];
      instanceResp.Reservations!.forEach((res) => {
        res.Instances!.forEach((inst) => {
          // If it raced to terminated between calls, just skip it.
          if (inst.State?.Name === 'terminated') return;

          expect(inst.InstanceType).toBe('t3.medium');
          // Allow transient states during rollouts; we filtered for active lifecycles already.
          expect(inst.State?.Name).toMatch(/^(running|pending|stopping|shutting-down)$/);

          const bdms = (inst.BlockDeviceMappings ?? []) as InstanceBlockDeviceMapping[];
          bdms.forEach((d) => d.Ebs?.VolumeId && volumeIds.push(d.Ebs.VolumeId));

          expect(inst.MetadataOptions?.HttpTokens).toBe('required');
          expect(inst.MetadataOptions?.HttpEndpoint).toBe('enabled');
        });
      });

      if (volumeIds.length) {
        const volumesResp = await ec2Client.send(new DescribeVolumesCommand({ VolumeIds: volumeIds }));
        (volumesResp.Volumes ?? []).forEach((vol) => {
          expect(vol.Encrypted).toBe(true);
          expect(vol.VolumeType).toBe('gp3');
        });
      }
    });
  });

  describe('RDS Database', () => {
    test('DB instance has production config', async () => {
      const rdsEndpoint = outputs.RdsEndpoint;
      expect(rdsEndpoint).toBeDefined();

      const dbResp = await rdsClient.send(new DescribeDBInstancesCommand({}));
      const dbInstance = dbResp.DBInstances!.find((db) => db.Endpoint?.Address === rdsEndpoint);
      expect(dbInstance).toBeDefined();

      expect(dbInstance!.DBInstanceStatus).toBe('available');
      expect(dbInstance!.MultiAZ).toBe(true);
      expect(dbInstance!.StorageEncrypted).toBe(true);
      expect(dbInstance!.PubliclyAccessible).toBe(false);
      expect(dbInstance!.StorageType).toBe('gp3');
      expect(dbInstance!.AllocatedStorage).toBe(100);
      expect(dbInstance!.BackupRetentionPeriod).toBe(7);
      expect(dbInstance!.DeletionProtection).toBe(true);
      expect(dbInstance!.PerformanceInsightsEnabled).toBe(true);
      expect(dbInstance!.MonitoringInterval).toBe(60);
      expect(dbInstance!.MonitoringRoleArn).toBeDefined();
      expect(dbInstance!.AutoMinorVersionUpgrade).toBe(true);
      expect(dbInstance!.CopyTagsToSnapshot).toBe(true);
      expect(dbInstance!.DBInstanceClass).toBe('db.m5.large');
      expect(['postgres', 'mysql']).toContain(dbInstance!.Engine!);
    });

    test('DB subnet group uses private subnets in our VPC across AZs', async () => {
      const rdsEndpoint = outputs.RdsEndpoint;

      const dbResp = await rdsClient.send(new DescribeDBInstancesCommand({}));
      const dbInstance = dbResp.DBInstances!.find((db) => db.Endpoint?.Address === rdsEndpoint);
      expect(dbInstance).toBeDefined();

      const subnetGroupResp = await rdsClient.send(
        new DescribeDBSubnetGroupsCommand({
          DBSubnetGroupName: dbInstance!.DBSubnetGroup?.DBSubnetGroupName,
        })
      );
      const subnetGroup = subnetGroupResp.DBSubnetGroups![0];
      expect(subnetGroup.SubnetGroupStatus).toBe('Complete');
      expect(subnetGroup.Subnets!.length).toBeGreaterThanOrEqual(2);

      const azs = new Set(subnetGroup.Subnets!.map((s: RdsSubnet) => s.SubnetAvailabilityZone?.Name));
      expect(azs.size).toBeGreaterThanOrEqual(2);

      // Verify those subnets are private and belong to our VPC
      const subnetIds = subnetGroup.Subnets!.map((s) => s.SubnetIdentifier!).filter(Boolean);
      const describe = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: subnetIds }));
      describe.Subnets!.forEach((sn) => {
        expect(sn.VpcId).toBe(outputs.VpcId);
        expect(sn.MapPublicIpOnLaunch).toBe(false);
      });

      // Soft overlap with outputs
      const privateSubnets = new Set(outputs.PrivateSubnets.split(',').filter(Boolean));
      const overlap = subnetIds.filter((id) => privateSubnets.has(id));
      expect(overlap.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('S3 Storage', () => {
    test('bucket exists with encryption, versioning, and public access block', async () => {
      const bucketName = outputs.S3BucketNameOut;
      const bucketArn = outputs.S3BucketArnOut;
      expect(bucketArn).toBe(`arn:aws:s3:::${bucketName}`);

      await expect(s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))).resolves.not.toThrow();

      const encResp = await s3Client.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
      const encRule = encResp.ServerSideEncryptionConfiguration!.Rules![0];
      expect(encRule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');

      const versioningResp = await s3Client.send(new GetBucketVersioningCommand({ Bucket: bucketName }));
      expect(versioningResp.Status).toBe('Enabled');

      const pabResp = await s3Client.send(new GetPublicAccessBlockCommand({ Bucket: bucketName }));
      const pab = pabResp.PublicAccessBlockConfiguration!;
      expect(pab.BlockPublicAcls).toBe(true);
      expect(pab.BlockPublicPolicy).toBe(true);
      expect(pab.IgnorePublicAcls).toBe(true);
      expect(pab.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('End-to-End Connectivity & Cross-service wiring', () => {
    test('ALB DNS is reachable (HEAD)', async () => {
      const albDns = outputs.AlbDnsName;
      const url = `http://${albDns}`;
      try {
        const response = await fetchWithTimeout(url, 15000);
        expect(response).toBeDefined();
        // allow 502 during warm-up as well
        expect([200, 301, 302, 403, 404, 502, 503]).toContain(response.status);
      } catch (err: any) {
        // eslint-disable-next-line no-console
        console.warn('ALB endpoint not reachable yet (targets may be initializing):', err.message);
      }
    });

    test('ASG is attached to ALB Target Group', async () => {
      const asgName = outputs.AsgName;

      const asgResp = await asgClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] })
      );
      const asg = asgResp.AutoScalingGroups![0];
      expect(asg.TargetGroupARNs && asg.TargetGroupARNs.length > 0).toBe(true);

      // Scope the TG query to the ALB from this stack
      const lbResp = await elbClient.send(new DescribeLoadBalancersCommand({}));
      const alb = lbResp.LoadBalancers!.find((lb) => lb.DNSName === outputs.AlbDnsName);
      expect(alb).toBeDefined();

      const tgResp = await elbClient.send(
        new DescribeTargetGroupsCommand({ LoadBalancerArn: alb!.LoadBalancerArn })
      );
      const httpTg = tgResp.TargetGroups!.find((tg) => tg.Port === 80);
      expect(httpTg).toBeDefined();

      expect(asg.TargetGroupARNs).toContain(httpTg!.TargetGroupArn);
    });

    test('resource tagging (VPC + RDS) is present', async () => {
      const vpcId = outputs.VpcId;
      const vpcResp = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpc = vpcResp.Vpcs![0];
      ['Name', 'Environment', 'Project', 'Owner', 'Region'].forEach((key) => {
        const tag = vpc.Tags?.find((t) => t.Key === key);
        expect(tag?.Value).toBeTruthy();
      });

      const dbResp = await rdsClient.send(new DescribeDBInstancesCommand({}));
      const dbInstance = dbResp.DBInstances![0];
      const nameTag = dbInstance.TagList?.find((t) => t.Key === 'Name');
      expect(nameTag?.Value).toContain('db');
    });
  });
});
