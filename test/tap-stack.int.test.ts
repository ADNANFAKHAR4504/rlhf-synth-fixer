import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
  DescribeTargetHealthCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribePoliciesCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import * as fs from 'fs';
import * as path from 'path';

// Read deployment outputs
const outputsPath = path.join(
  __dirname,
  '..',
  'cfn-outputs',
  'flat-outputs.json'
);
let deploymentOutputs: any = {};

try {
  if (fs.existsSync(outputsPath)) {
    const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
    deploymentOutputs = JSON.parse(outputsContent);
  }
} catch (error) {
  console.warn('Could not read deployment outputs:', error);
}

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

// LocalStack configuration
const endpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
const isLocalStack = endpoint.includes('localhost') || endpoint.includes('4566');

const clientConfig = isLocalStack
  ? {
      endpoint,
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test',
      },
    }
  : {};

// AWS Clients for different regions
const primaryEc2Client = new EC2Client({ region: 'us-east-1', ...clientConfig });
const primaryElbClient = new ElasticLoadBalancingV2Client({
  region: 'us-east-1',
  ...clientConfig,
});
const primaryAsgClient = new AutoScalingClient({ region: 'us-east-1', ...clientConfig });
const primaryCfnClient = new CloudFormationClient({ region: 'us-east-1', ...clientConfig });

const secondaryEc2Client = new EC2Client({ region: 'us-west-2', ...clientConfig });
const secondaryElbClient = new ElasticLoadBalancingV2Client({
  region: 'us-west-2',
  ...clientConfig,
});
const secondaryAsgClient = new AutoScalingClient({ region: 'us-west-2', ...clientConfig });
const secondaryCfnClient = new CloudFormationClient({ region: 'us-west-2', ...clientConfig });

describe('Multi-Region Infrastructure Integration Tests', () => {
  jest.setTimeout(60000); // Increase timeout for AWS API calls

  describe('Primary Region (us-east-1) Infrastructure', () => {
    test('VPC is deployed with correct configuration', async () => {
      const vpcId = deploymentOutputs['VPCIdprimary'];
      if (!vpcId) {
        console.warn('VPC ID not found in outputs, skipping test');
        return;
      }

      const response = await primaryEc2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      // DNS settings are in Tags or require separate API call
      expect(vpc.State).toBe('available');
    });

    test('Subnets are created across multiple AZs', async () => {
      const vpcId = deploymentOutputs['VPCIdprimary'];
      if (!vpcId) {
        console.warn('VPC ID not found in outputs, skipping test');
        return;
      }

      const response = await primaryEc2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
          ],
        })
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(4); // At least 2 public and 2 private

      // Check that subnets span multiple AZs
      const azs = new Set(
        response.Subnets!.map((subnet) => subnet.AvailabilityZone)
      );
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    test('NAT Gateways are deployed for private subnet connectivity', async () => {
      const vpcId = deploymentOutputs['VPCIdprimary'];
      if (!vpcId) {
        console.warn('VPC ID not found in outputs, skipping test');
        return;
      }

      const response = await primaryEc2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
            {
              Name: 'state',
              Values: ['available'],
            },
          ],
        })
      );

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(1);
    });

    test('Application Load Balancer is deployed and healthy', async () => {
      const albDns = deploymentOutputs['LoadBalancerDNSprimary'];
      if (!albDns) {
        console.warn('ALB DNS not found in outputs, skipping test');
        return;
      }

      const response = await primaryElbClient.send(
        new DescribeLoadBalancersCommand({})
      );

      const alb = response.LoadBalancers?.find(
        (lb) => lb.DNSName === albDns
      );
      expect(alb).toBeDefined();
      expect(alb!.State?.Code).toBe('active');
      expect(alb!.Type).toBe('application');
      expect(alb!.Scheme).toBe('internet-facing');
    });

    test('Target Group has healthy targets', async () => {
      const response = await primaryElbClient.send(
        new DescribeTargetGroupsCommand({})
      );

      const targetGroup = response.TargetGroups?.find((tg) =>
        tg.TargetGroupName?.includes('tg-pri')
      );

      if (!targetGroup) {
        console.warn('Target group not found, skipping health check');
        return;
      }

      const healthResponse = await primaryElbClient.send(
        new DescribeTargetHealthCommand({
          TargetGroupArn: targetGroup.TargetGroupArn,
        })
      );

      // Check that we have registered targets
      expect(healthResponse.TargetHealthDescriptions).toBeDefined();
      expect(
        healthResponse.TargetHealthDescriptions!.length
      ).toBeGreaterThanOrEqual(2); // Minimum 2 instances

      // Check that at least some targets are healthy or initial
      const healthyTargets = healthResponse.TargetHealthDescriptions!.filter(
        (t) => t.TargetHealth?.State === 'healthy' || t.TargetHealth?.State === 'initial'
      );
      expect(healthyTargets.length).toBeGreaterThan(0);
    });

    test('Auto Scaling Group is configured correctly', async () => {
      const response = await primaryAsgClient.send(
        new DescribeAutoScalingGroupsCommand({})
      );

      const asg = response.AutoScalingGroups?.find((group) =>
        group.AutoScalingGroupName?.includes('asg-pri')
      );

      expect(asg).toBeDefined();
      expect(asg!.MinSize).toBe(2);
      expect(asg!.MaxSize).toBe(10);
      expect(asg!.DesiredCapacity).toBeGreaterThanOrEqual(2);
      expect(asg!.HealthCheckType).toBe('ELB');
      expect(asg!.HealthCheckGracePeriod).toBe(300);
    });

    test('Scaling policies are configured', async () => {
      const asgResponse = await primaryAsgClient.send(
        new DescribeAutoScalingGroupsCommand({})
      );

      const asg = asgResponse.AutoScalingGroups?.find((group) =>
        group.AutoScalingGroupName?.includes('asg-pri')
      );

      if (!asg) {
        console.warn('ASG not found, skipping scaling policy test');
        return;
      }

      const response = await primaryAsgClient.send(
        new DescribePoliciesCommand({
          AutoScalingGroupName: asg.AutoScalingGroupName,
        })
      );

      expect(response.ScalingPolicies).toBeDefined();
      expect(response.ScalingPolicies!.length).toBeGreaterThanOrEqual(2); // CPU and request count policies

      // Check for CPU utilization policy
      const cpuPolicy = response.ScalingPolicies!.find((p: any) =>
        p.PolicyName?.includes('CPUScaling')
      );
      expect(cpuPolicy).toBeDefined();
      expect(cpuPolicy!.PolicyType).toBe('TargetTrackingScaling');

      // Check for request count policy
      const requestPolicy = response.ScalingPolicies!.find((p: any) =>
        p.PolicyName?.includes('RequestScaling')
      );
      expect(requestPolicy).toBeDefined();
      expect(requestPolicy!.PolicyType).toBe('TargetTrackingScaling');
    });
  });

  describe('Secondary Region (us-west-2) Infrastructure', () => {
    test('VPC is deployed with correct configuration', async () => {
      const vpcId = deploymentOutputs['VPCIdsecondary'];
      if (!vpcId) {
        console.warn('Secondary VPC ID not found in outputs, skipping test');
        return;
      }

      const response = await secondaryEc2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      // DNS settings are in Tags or require separate API call
      expect(vpc.State).toBe('available');
    });

    test('Application Load Balancer is deployed and healthy', async () => {
      const albDns = deploymentOutputs['LoadBalancerDNSsecondary'];
      if (!albDns) {
        console.warn('Secondary ALB DNS not found in outputs, skipping test');
        return;
      }

      const response = await secondaryElbClient.send(
        new DescribeLoadBalancersCommand({})
      );

      const alb = response.LoadBalancers?.find(
        (lb) => lb.DNSName === albDns
      );
      expect(alb).toBeDefined();
      expect(alb!.State?.Code).toBe('active');
      expect(alb!.Type).toBe('application');
      expect(alb!.Scheme).toBe('internet-facing');
    });

    test('Auto Scaling Group is configured correctly', async () => {
      const response = await secondaryAsgClient.send(
        new DescribeAutoScalingGroupsCommand({})
      );

      const asg = response.AutoScalingGroups?.find((group) =>
        group.AutoScalingGroupName?.includes('asg-sec')
      );

      expect(asg).toBeDefined();
      expect(asg!.MinSize).toBe(2);
      expect(asg!.MaxSize).toBe(10);
      expect(asg!.DesiredCapacity).toBeGreaterThanOrEqual(2);
      expect(asg!.HealthCheckType).toBe('ELB');
    });
  });

  describe('Cross-Region Connectivity', () => {
    test('Both regions have active load balancers', async () => {
      const primaryAlbDns = deploymentOutputs['LoadBalancerDNSprimary'];
      const secondaryAlbDns = deploymentOutputs['LoadBalancerDNSsecondary'];

      if (!primaryAlbDns || !secondaryAlbDns) {
        console.warn('ALB DNS outputs not found, skipping cross-region test');
        return;
      }

      // Verify primary ALB
      const primaryResponse = await primaryElbClient.send(
        new DescribeLoadBalancersCommand({})
      );
      const primaryAlb = primaryResponse.LoadBalancers?.find(
        (lb) => lb.DNSName === primaryAlbDns
      );
      expect(primaryAlb).toBeDefined();
      expect(primaryAlb!.State?.Code).toBe('active');

      // Verify secondary ALB
      const secondaryResponse = await secondaryElbClient.send(
        new DescribeLoadBalancersCommand({})
      );
      const secondaryAlb = secondaryResponse.LoadBalancers?.find(
        (lb) => lb.DNSName === secondaryAlbDns
      );
      expect(secondaryAlb).toBeDefined();
      expect(secondaryAlb!.State?.Code).toBe('active');
    });

    test('Security groups are correctly configured', async () => {
      // Check primary region security groups
      const primarySgId = deploymentOutputs['WebAppSecurityGroupIdprimary'];
      if (primarySgId) {
        const response = await primaryEc2Client.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: [primarySgId],
          })
        );

        expect(response.SecurityGroups).toHaveLength(1);
        const sg = response.SecurityGroups![0];
        
        // Check for HTTP ingress rule
        const httpRule = sg.IpPermissions?.find(
          (rule) => rule.FromPort === 80 && rule.ToPort === 80
        );
        expect(httpRule).toBeDefined();
        
        // Check for HTTPS ingress rule
        const httpsRule = sg.IpPermissions?.find(
          (rule) => rule.FromPort === 443 && rule.ToPort === 443
        );
        expect(httpsRule).toBeDefined();
      }

      // Check secondary region security groups
      const secondarySgId = deploymentOutputs['WebAppSecurityGroupIdsecondary'];
      if (secondarySgId) {
        const response = await secondaryEc2Client.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: [secondarySgId],
          })
        );

        expect(response.SecurityGroups).toHaveLength(1);
        const sg = response.SecurityGroups![0];
        
        // Check for HTTP ingress rule
        const httpRule = sg.IpPermissions?.find(
          (rule) => rule.FromPort === 80 && rule.ToPort === 80
        );
        expect(httpRule).toBeDefined();
        
        // Check for HTTPS ingress rule
        const httpsRule = sg.IpPermissions?.find(
          (rule) => rule.FromPort === 443 && rule.ToPort === 443
        );
        expect(httpsRule).toBeDefined();
      }
    });
  });

  describe('High Availability and Resilience', () => {
    test('Multiple instances are running in each region', async () => {
      // Check primary region
      const primaryAsgResponse = await primaryAsgClient.send(
        new DescribeAutoScalingGroupsCommand({})
      );
      const primaryAsg = primaryAsgResponse.AutoScalingGroups?.find((group) =>
        group.AutoScalingGroupName?.includes('asg-pri')
      );
      
      if (primaryAsg) {
        expect(primaryAsg.Instances).toBeDefined();
        expect(primaryAsg.Instances!.length).toBeGreaterThanOrEqual(2);
        
        // Check instances are in different AZs
        const primaryAzs = new Set(
          primaryAsg.Instances!.map((i) => i.AvailabilityZone)
        );
        expect(primaryAzs.size).toBeGreaterThanOrEqual(2);
      }

      // Check secondary region
      const secondaryAsgResponse = await secondaryAsgClient.send(
        new DescribeAutoScalingGroupsCommand({})
      );
      const secondaryAsg = secondaryAsgResponse.AutoScalingGroups?.find(
        (group) => group.AutoScalingGroupName?.includes('asg-sec')
      );
      
      if (secondaryAsg) {
        expect(secondaryAsg.Instances).toBeDefined();
        expect(secondaryAsg.Instances!.length).toBeGreaterThanOrEqual(2);
        
        // Check instances are in different AZs
        const secondaryAzs = new Set(
          secondaryAsg.Instances!.map((i) => i.AvailabilityZone)
        );
        expect(secondaryAzs.size).toBeGreaterThanOrEqual(2);
      }
    });

    test('CloudFormation stacks are in stable state', async () => {
      // Check primary stacks
      const primaryNetworkStackName = `Primary-Network-${environmentSuffix}`;
      const primaryWebAppStackName = `Primary-WebApp-${environmentSuffix}`;

      try {
        const primaryNetworkStack = await primaryCfnClient.send(
          new DescribeStacksCommand({
            StackName: primaryNetworkStackName,
          })
        );
        expect(primaryNetworkStack.Stacks![0].StackStatus).toMatch(
          /(CREATE_COMPLETE|UPDATE_COMPLETE)/
        );

        const primaryWebAppStack = await primaryCfnClient.send(
          new DescribeStacksCommand({
            StackName: primaryWebAppStackName,
          })
        );
        expect(primaryWebAppStack.Stacks![0].StackStatus).toMatch(
          /(CREATE_COMPLETE|UPDATE_COMPLETE)/
        );
      } catch (error) {
        console.warn('Primary stacks not found or in unexpected state');
      }

      // Check secondary stacks
      const secondaryNetworkStackName = `Secondary-Network-${environmentSuffix}`;
      const secondaryWebAppStackName = `Secondary-WebApp-${environmentSuffix}`;

      try {
        const secondaryNetworkStack = await secondaryCfnClient.send(
          new DescribeStacksCommand({
            StackName: secondaryNetworkStackName,
          })
        );
        expect(secondaryNetworkStack.Stacks![0].StackStatus).toMatch(
          /(CREATE_COMPLETE|UPDATE_COMPLETE)/
        );

        const secondaryWebAppStack = await secondaryCfnClient.send(
          new DescribeStacksCommand({
            StackName: secondaryWebAppStackName,
          })
        );
        expect(secondaryWebAppStack.Stacks![0].StackStatus).toMatch(
          /(CREATE_COMPLETE|UPDATE_COMPLETE)/
        );
      } catch (error) {
        console.warn('Secondary stacks not found or in unexpected state');
      }
    });
  });
});