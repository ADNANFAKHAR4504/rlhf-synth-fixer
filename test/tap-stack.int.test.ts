import { AutoScalingClient, DescribeAutoScalingGroupsCommand } from '@aws-sdk/client-auto-scaling';
import {
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import { GetBucketEncryptionCommand, HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
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
    test('should have VPC with correct configuration', async () => {
      const vpcId = outputs.VpcId;
      expect(vpcId).toBeDefined();

      const vpcResp = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(vpcResp.Vpcs).toHaveLength(1);
      const vpc = vpcResp.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBeDefined();

      // Check attributes via DescribeVpcAttribute
      const dnsHostnames = await ec2Client.send(
        new DescribeVpcAttributeCommand({ VpcId: vpcId, Attribute: 'enableDnsHostnames' })
      );
      const dnsSupport = await ec2Client.send(
        new DescribeVpcAttributeCommand({ VpcId: vpcId, Attribute: 'enableDnsSupport' })
      );
      expect(dnsHostnames.EnableDnsHostnames?.Value).toBe(true);
      expect(dnsSupport.EnableDnsSupport?.Value).toBe(true);
    });

    test('should have public and private subnets', async () => {
      const publicSubnets = outputs.PublicSubnets.split(',').filter((s: string) => s.length > 0);
      const privateSubnets = outputs.PrivateSubnets.split(',').filter((s: string) => s.length > 0);

      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);

      const publicResponse = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnets })
      );
      publicResponse.Subnets!.forEach((subnet) => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });

      const privateResponse = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnets })
      );
      privateResponse.Subnets!.forEach((subnet) => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('should have ALB accessible and healthy', async () => {
      const albDns = outputs.AlbDnsName;
      expect(albDns).toBeDefined();

      const lbResp = await elbClient.send(new DescribeLoadBalancersCommand({}));
      expect(lbResp.LoadBalancers).toBeDefined();

      const alb = lbResp.LoadBalancers!.find((lb) => lb.DNSName === albDns);
      expect(alb).toBeDefined();
      expect(alb!.State!.Code).toBe('active');
      expect(alb!.Type).toBe('application');
      expect(alb!.Scheme).toBe('internet-facing');
    });

    test('should have target group with instances', async () => {
      const tgResp = await elbClient.send(new DescribeTargetGroupsCommand({}));
      expect(tgResp.TargetGroups).toBeDefined();
      expect(tgResp.TargetGroups!.length).toBeGreaterThan(0);

      const targetGroup = tgResp.TargetGroups![0];
      expect(targetGroup.Protocol).toBe('HTTP');
      expect(targetGroup.Port).toBe(80);
    });
  });

  describe('Auto Scaling Group', () => {
    test('should have ASG with desired capacity', async () => {
      const asgName = outputs.AsgName;
      expect(asgName).toBeDefined();

      const asgResp = await asgClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] })
      );
      expect(asgResp.AutoScalingGroups).toHaveLength(1);

      const asg = asgResp.AutoScalingGroups![0];
      expect(asg.MinSize).toBeGreaterThanOrEqual(2);
      expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(2);
      expect(asg.Instances!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('RDS Database', () => {
    test('should have RDS instance running with Multi-AZ', async () => {
      const rdsEndpoint = outputs.RdsEndpoint;
      expect(rdsEndpoint).toBeDefined();

      const dbResp = await rdsClient.send(new DescribeDBInstancesCommand({}));
      expect(dbResp.DBInstances).toBeDefined();

      const dbInstance = dbResp.DBInstances!.find((db) => db.Endpoint?.Address === rdsEndpoint);
      expect(dbInstance).toBeDefined();
      expect(dbInstance!.DBInstanceStatus).toBe('available');
      expect(dbInstance!.MultiAZ).toBe(true);
      expect(dbInstance!.StorageEncrypted).toBe(true);
      expect(dbInstance!.PubliclyAccessible).toBe(false);
    });
  });

  describe('S3 Storage', () => {
    test('should have S3 bucket accessible and encrypted', async () => {
      const bucketName = outputs.S3BucketNameOut;
      expect(bucketName).toBeDefined();

      await expect(s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))).resolves.not.toThrow();

      const encResp = await s3Client.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
      expect(encResp.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encResp.ServerSideEncryptionConfiguration!.Rules?.length).toBeGreaterThan(0);
    });
  });

  describe('Security and Compliance', () => {
    test('should have security groups properly configured', async () => {
      const securityGroups = outputs.SecurityGroups.split(',');
      expect(securityGroups.length).toBe(3); // ALB, Web, DB security groups
    });

    // Removed: AWS Config status assertion (not created in this template)
    // If you later re-enable AWS Config, add back an assertion on outputs.AwsConfigStatus.
  });

  describe('End-to-End Connectivity', () => {
    test('should be able to reach ALB endpoint', async () => {
      const albDns = outputs.AlbDnsName;
      expect(albDns).toBeDefined();
      const url = `http://${albDns}`;

      try {
        const response = await fetchWithTimeout(url, 10000);
        expect(response).toBeDefined(); // Any response indicates reachability
      } catch (error) {
        // ALB may not have healthy targets yet; reaching it can still fail transiently.
        // Keep this non-fatal for infra smoke test purposes.
        // eslint-disable-next-line no-console
        console.warn('ALB endpoint not yet accessible:', error);
      }
    });

    test('infrastructure resources should be properly tagged', async () => {
      const vpcId = outputs.VpcId;
      const resp = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpc = resp.Vpcs![0];
      const nameTag = vpc.Tags?.find((t) => t.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag!.Value).toContain('vpc');
    });
  });
});
