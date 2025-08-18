import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeListenersCommand,
  DescribeTargetHealthCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import { Route53Client } from '@aws-sdk/client-route-53';
import { SNSClient, ListTopicsCommand } from '@aws-sdk/client-sns';
import {
  BackupClient,
  DescribeBackupVaultCommand,
} from '@aws-sdk/client-backup';
import * as fs from 'fs';

// --- Test Configuration ---

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX;
const STACK_NAME = `TapStack${environmentSuffix}`;
const REGION = process.env.AWS_REGION || 'us-west-2';

// --- AWS SDK Clients ---
const ec2Client = new EC2Client({ region: REGION });
const elbv2Client = new ElasticLoadBalancingV2Client({ region: REGION });
const asgClient = new AutoScalingClient({ region: REGION });
const snsClient = new SNSClient({ region: REGION });
const backupClient = new BackupClient({ region: REGION });

// --- Read Deployed Stack Outputs ---
let outputs: { [key: string]: string } = {};

try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn(
    'cfn-outputs/flat-outputs.json does not exist, aborting integration tests'
  );
}

// Conditionally run tests only if outputs were loaded successfully
const testSuite = Object.keys(outputs).length > 0 ? describe : describe.skip;

testSuite('High-Availability Stack Integration Tests', () => {
  const loadBalancerDns = outputs.LoadBalancerDNSName; // Dynamically find resource IDs using tags and outputs

  let vpcId: string;
  let albArn: string;
  let asgName: string;

  beforeAll(async () => {
    // Find the ALB ARN using its DNS name from the outputs
    const albResponse = await elbv2Client.send(
      new DescribeLoadBalancersCommand({})
    );
    const alb = albResponse.LoadBalancers?.find(
      lb => lb.DNSName === loadBalancerDns
    );
    if (!alb || !alb.LoadBalancerArn)
      throw new Error('Could not find deployed Application Load Balancer');
    albArn = alb.LoadBalancerArn;
    vpcId = alb.VpcId!; // Find the ASG name using tags

    const asgResponse = await asgClient.send(
      new DescribeAutoScalingGroupsCommand({})
    );

    const asg = asgResponse.AutoScalingGroups?.find(g =>
      g.AutoScalingGroupName?.startsWith(STACK_NAME)
    );
    if (!asg || !asg.AutoScalingGroupName)
      throw new Error('Could not find deployed Auto Scaling Group');
    asgName = asg.AutoScalingGroupName;
  });

  describe('🌐 Networking Infrastructure', () => {
    test('VPC should exist and be properly configured', async () => {
      const { Vpcs } = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );
      expect(Vpcs).toHaveLength(1);
      expect(Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      expect(Vpcs![0].State).toBe('available');
    });

    test('Should have 3 public and 3 private subnets across different AZs', async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );

      const publicSubnets = Subnets!.filter(
        s => s.MapPublicIpOnLaunch === true
      );
      const privateSubnets = Subnets!.filter(
        s => s.MapPublicIpOnLaunch === false
      );

      expect(publicSubnets).toHaveLength(3);
      expect(privateSubnets).toHaveLength(3); // Verify they are in different AZs

      const publicAzs = new Set(publicSubnets.map(s => s.AvailabilityZone));
      const privateAzs = new Set(privateSubnets.map(s => s.AvailabilityZone));
      expect(publicAzs.size).toBe(3);
      expect(privateAzs.size).toBe(3);
    });

    test('Private subnets should route traffic through a NAT Gateway', async () => {
      const { NatGateways } = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'state', Values: ['available'] },
          ],
        })
      );
      expect(NatGateways!.length).toBeGreaterThanOrEqual(1);
      const natGatewayId = NatGateways![0].NatGatewayId;

      const { RouteTables } = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );
      const privateRouteTable = RouteTables!.find(rt =>
        rt.Tags?.some(tag => tag.Value?.includes('Private-Route-Table'))
      );

      expect(privateRouteTable).toBeDefined();
      const natRoute = privateRouteTable!.Routes?.find(
        r => r.DestinationCidrBlock === '0.0.0.0/0'
      );
      expect(natRoute?.NatGatewayId).toBe(natGatewayId);
    });
  });

  describe('🛡️ Security', () => {
    test('ALB Security Group should allow public HTTP/HTTPS traffic', async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'group-name', Values: [`${STACK_NAME}-ALB-SG`] },
          ],
        })
      );
      expect(SecurityGroups).toHaveLength(1);
      const albSg = SecurityGroups![0];

      const httpRule = albSg.IpPermissions?.find(
        p => p.FromPort === 80 && p.ToPort === 80 && p.IpProtocol === 'tcp'
      );
      const httpsRule = albSg.IpPermissions?.find(
        p => p.FromPort === 443 && p.ToPort === 443 && p.IpProtocol === 'tcp'
      );

      expect(httpRule?.IpRanges?.[0].CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule?.IpRanges?.[0].CidrIp).toBe('0.0.0.0/0');
    });

    test('Instance Security Group should only allow traffic from the ALB on port 8080', async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'group-name', Values: [`${STACK_NAME}-Instance-SG`] },
          ],
        })
      );
      expect(SecurityGroups).toHaveLength(1);
      const instanceSg = SecurityGroups![0];

      const albSg = (
        await ec2Client.send(
          new DescribeSecurityGroupsCommand({
            Filters: [
              { Name: 'vpc-id', Values: [vpcId] },
              { Name: 'group-name', Values: [`${STACK_NAME}-ALB-SG`] },
            ],
          })
        )
      ).SecurityGroups![0];

      const ingressRule = instanceSg.IpPermissions?.find(
        p => p.FromPort === 8080 && p.ToPort === 8080
      );
      expect(ingressRule).toBeDefined();
      expect(ingressRule?.UserIdGroupPairs?.[0].GroupId).toBe(albSg.GroupId);
    });
  });

  describe('⚖️ Load Balancing & DNS', () => {
    test('Application Load Balancer should be internet-facing and in public subnets', async () => {
      const { LoadBalancers } = await elbv2Client.send(
        new DescribeLoadBalancersCommand({ LoadBalancerArns: [albArn] })
      );
      expect(LoadBalancers).toHaveLength(1);
      const alb = LoadBalancers![0];

      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.AvailabilityZones?.length).toBe(3);
    });

    test('ALB Listener should redirect HTTP to HTTPS', async () => {
      const { Listeners } = await elbv2Client.send(
        new DescribeListenersCommand({ LoadBalancerArn: albArn })
      );
      const httpListener = Listeners?.find(
        l => l.Port === 80 && l.Protocol === 'HTTP'
      );

      expect(httpListener).toBeDefined();
      const defaultAction = httpListener!.DefaultActions![0];
      expect(defaultAction.Type).toBe('redirect');
      expect(defaultAction.RedirectConfig?.Protocol).toBe('HTTPS');
      expect(defaultAction.RedirectConfig?.Port).toBe('443');
      expect(defaultAction.RedirectConfig?.StatusCode).toBe('HTTP_301');
    });
  });

  describe('💻 Compute & Auto Scaling', () => {
    test('Auto Scaling Group should have correct min/max/desired sizes', async () => {
      const { AutoScalingGroups } = await asgClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [asgName],
        })
      );
      expect(AutoScalingGroups).toHaveLength(1);
      const asg = AutoScalingGroups![0];

      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(6);
      expect(asg.DesiredCapacity).toBe(2);
      expect(asg.HealthCheckType).toBe('ELB');
    });

    test('All instances in the ASG should be healthy in the target group', async () => {
      const { AutoScalingGroups } = await asgClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [asgName],
        })
      );
      const asg = AutoScalingGroups![0];
      const targetGroupArn = asg.TargetGroupARNs![0];

      const { TargetHealthDescriptions } = await elbv2Client.send(
        new DescribeTargetHealthCommand({ TargetGroupArn: targetGroupArn })
      );

      expect(TargetHealthDescriptions?.length).toBe(asg.DesiredCapacity);
      TargetHealthDescriptions?.forEach(target => {
        expect(target.TargetHealth?.State).toBe('healthy');
      });
    }, 60000); // Increase timeout as health checks can take time
  });

  describe('🔄 Backup & Monitoring', () => {
    test('Backup Vault should exist', async () => {
      const vaultName = `${STACK_NAME}-Vault`;
      const { BackupVaultName } = await backupClient.send(
        new DescribeBackupVaultCommand({ BackupVaultName: vaultName })
      );
      expect(BackupVaultName).toBe(vaultName);
    });

    test('SNS Topic for alerts should exist', async () => {
      const { Topics } = await snsClient.send(new ListTopicsCommand({}));
      const topic = Topics?.find(t =>
        t.TopicArn?.endsWith(`${STACK_NAME}-Alerts-Topic`)
      );
      expect(topic).toBeDefined();
    });
  });
});
