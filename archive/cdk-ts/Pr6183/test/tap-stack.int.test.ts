import {
  CloudFormationClient,
  DescribeStackResourcesCommand,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  DescribeNatGatewaysCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeClusterCommand,
  DescribeFargateProfileCommand,
  DescribeNodegroupCommand,
  EKSClient,
} from '@aws-sdk/client-eks';

const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';
const stackName = `TapStack${environmentSuffix}`;

const cfnClient = new CloudFormationClient({ region });
const eksClient = new EKSClient({ region });
const ec2Client = new EC2Client({ region });

describe('EKS Cluster Integration Tests', () => {
  let stackOutputs: Record<string, string> = {};
  let clusterName: string;

  beforeAll(async () => {
    try {
      const describeCommand = new DescribeStacksCommand({
        StackName: stackName,
      });
      const response = await cfnClient.send(describeCommand);

      if (response.Stacks && response.Stacks[0]) {
        const outputs = response.Stacks[0].Outputs || [];
        stackOutputs = outputs.reduce(
          (acc, output) => {
            if (output.OutputKey && output.OutputValue) {
              acc[output.OutputKey] = output.OutputValue;
            }
            return acc;
          },
          {} as Record<string, string>
        );

        clusterName = stackOutputs.ClusterName;
      }
    } catch (error) {
      console.error('Stack not found or error fetching stack:', error);
      throw new Error(
        `Integration tests require deployed stack: ${stackName}. Please deploy first.`
      );
    }
  }, 30000);

  describe('Stack Deployment', () => {
    test('stack exists and is in CREATE_COMPLETE or UPDATE_COMPLETE state', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfnClient.send(command);

      expect(response.Stacks).toBeDefined();
      expect(response.Stacks![0].StackStatus).toMatch(
        /CREATE_COMPLETE|UPDATE_COMPLETE/
      );
    });

    test('all stack outputs are present', () => {
      const expectedOutputs = [
        'ClusterName',
        'ClusterEndpoint',
        'ClusterArn',
        'OIDCIssuerURL',
        'KubectlConfigCommand',
        'VpcId',
        'ClusterSecurityGroupId',
      ];

      expectedOutputs.forEach(outputKey => {
        expect(stackOutputs[outputKey]).toBeDefined();
        expect(stackOutputs[outputKey]).not.toBe('');
      });
    });
  });

  describe('EKS Cluster', () => {
    test('cluster exists and is active', async () => {
      const command = new DescribeClusterCommand({ name: clusterName });
      const response = await eksClient.send(command);

      expect(response.cluster).toBeDefined();
      expect(response.cluster!.status).toBe('ACTIVE');
      expect(response.cluster!.version).toBe('1.28');
    });

    test('cluster has OIDC provider configured', async () => {
      const command = new DescribeClusterCommand({ name: clusterName });
      const response = await eksClient.send(command);

      expect(response.cluster!.identity?.oidc?.issuer).toBeDefined();
      expect(stackOutputs.OIDCIssuerURL).toBe(
        response.cluster!.identity?.oidc?.issuer
      );
    });

    test('cluster has all control plane logging enabled', async () => {
      const command = new DescribeClusterCommand({ name: clusterName });
      const response = await eksClient.send(command);

      const logging = response.cluster!.logging?.clusterLogging?.[0];
      expect(logging?.enabled).toBe(true);
      expect(logging?.types).toEqual(
        expect.arrayContaining([
          'api',
          'audit',
          'authenticator',
          'controllerManager',
          'scheduler',
        ])
      );
    });

    test('cluster has public and private endpoint access', async () => {
      const command = new DescribeClusterCommand({ name: clusterName });
      const response = await eksClient.send(command);

      const vpcConfig = response.cluster!.resourcesVpcConfig;
      expect(vpcConfig?.endpointPublicAccess).toBe(true);
      expect(vpcConfig?.endpointPrivateAccess).toBe(true);
    });
  });

  describe('Managed Node Groups', () => {
    test('critical node group exists with correct configuration', async () => {
      const command = new DescribeNodegroupCommand({
        clusterName,
        nodegroupName: `critical-${environmentSuffix}`,
      });
      const response = await eksClient.send(command);

      expect(response.nodegroup).toBeDefined();
      expect(response.nodegroup!.status).toMatch(/ACTIVE|CREATING|UPDATING/);
      expect(response.nodegroup!.capacityType).toBe('ON_DEMAND');
      expect(response.nodegroup!.instanceTypes).toContain('t3.medium');
      expect(response.nodegroup!.scalingConfig?.minSize).toBe(2);
      expect(response.nodegroup!.scalingConfig?.maxSize).toBe(4);
    });

    test('workers node group exists with Spot configuration', async () => {
      const command = new DescribeNodegroupCommand({
        clusterName,
        nodegroupName: `workers-${environmentSuffix}`,
      });
      const response = await eksClient.send(command);

      expect(response.nodegroup).toBeDefined();
      expect(response.nodegroup!.status).toMatch(/ACTIVE|CREATING|UPDATING/);
      expect(response.nodegroup!.capacityType).toBe('SPOT');
      expect(response.nodegroup!.instanceTypes).toContain('t3.large');
      expect(response.nodegroup!.scalingConfig?.minSize).toBe(3);
      expect(response.nodegroup!.scalingConfig?.maxSize).toBe(10);
    });

    test('node groups have cluster autoscaler tags', async () => {
      const criticalCommand = new DescribeNodegroupCommand({
        clusterName,
        nodegroupName: `critical-${environmentSuffix}`,
      });
      const criticalResponse = await eksClient.send(criticalCommand);

      const tags = criticalResponse.nodegroup!.tags || {};
      expect(tags['k8s.io/cluster-autoscaler/enabled']).toBe('true');
    });

    test('node groups have workload-type labels', async () => {
      const criticalCommand = new DescribeNodegroupCommand({
        clusterName,
        nodegroupName: `critical-${environmentSuffix}`,
      });
      const criticalResponse = await eksClient.send(criticalCommand);

      const labels = criticalResponse.nodegroup!.labels || {};
      expect(labels['workload-type']).toBe('critical');

      const workersCommand = new DescribeNodegroupCommand({
        clusterName,
        nodegroupName: `workers-${environmentSuffix}`,
      });
      const workersResponse = await eksClient.send(workersCommand);

      const workersLabels = workersResponse.nodegroup!.labels || {};
      expect(workersLabels['workload-type']).toBe('workers');
    });
  });

  describe('Fargate Profiles', () => {
    test('kube-system Fargate profile exists', async () => {
      const command = new DescribeFargateProfileCommand({
        clusterName,
        fargateProfileName: `kube-system-${environmentSuffix}`,
      });
      const response = await eksClient.send(command);

      expect(response.fargateProfile).toBeDefined();
      expect(response.fargateProfile!.status).toMatch(/ACTIVE|CREATING/);
      expect(response.fargateProfile!.selectors).toContainEqual({
        namespace: 'kube-system',
      });
    });

    test('aws-load-balancer-controller Fargate profile exists', async () => {
      const command = new DescribeFargateProfileCommand({
        clusterName,
        fargateProfileName: `aws-load-balancer-controller-${environmentSuffix}`,
      });
      const response = await eksClient.send(command);

      expect(response.fargateProfile).toBeDefined();
      expect(response.fargateProfile!.status).toMatch(/ACTIVE|CREATING/);
      expect(response.fargateProfile!.selectors).toContainEqual({
        namespace: 'aws-load-balancer-controller',
      });
    });
  });

  describe('VPC Configuration', () => {
    test('VPC exists with correct CIDR', async () => {
      const vpcId = stackOutputs.VpcId;
      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC has 6 subnets (3 public + 3 private)', async () => {
      const vpcId = stackOutputs.VpcId;
      const command = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(6);
    });

    test('VPC has 3 NAT Gateways for high availability', async () => {
      const vpcId = stackOutputs.VpcId;
      const command = new DescribeNatGatewaysCommand({
        Filter: [{ Name: 'vpc-id', Values: [vpcId] }],
      });
      const response = await ec2Client.send(command);

      const activeNatGateways = response.NatGateways?.filter(
        ng => ng.State === 'available' || ng.State === 'pending'
      );
      expect(activeNatGateways?.length).toBe(3);
    });
  });

  describe('Stack Resources', () => {
    test('critical AWS resources are created', async () => {
      const command = new DescribeStackResourcesCommand({
        StackName: stackName,
      });
      const response = await cfnClient.send(command);

      const resources = response.StackResources || [];
      const resourceTypes = resources.map(r => r.ResourceType);

      // Check for critical resource types
      expect(resourceTypes).toContain('AWS::EC2::VPC');
      expect(resourceTypes).toContain('AWS::IAM::Role');
      expect(resourceTypes).toContain('AWS::IAM::Policy');
    });

    test('no resources are in failed state', async () => {
      const command = new DescribeStackResourcesCommand({
        StackName: stackName,
      });
      const response = await cfnClient.send(command);

      const failedResources = response.StackResources?.filter(
        r => r.ResourceStatus && r.ResourceStatus.includes('FAILED')
      );

      if (failedResources && failedResources.length > 0) {
        console.error('Failed resources:', failedResources);
      }

      expect(failedResources).toHaveLength(0);
    });
  });

  describe('Output Validation', () => {
    test('cluster endpoint is a valid URL', () => {
      expect(stackOutputs.ClusterEndpoint).toMatch(/^https:\/\//);
    });

    test('OIDC issuer URL is a valid HTTPS URL', () => {
      expect(stackOutputs.OIDCIssuerURL).toMatch(/^https:\/\//);
    });

    test('kubectl config command is properly formatted', () => {
      expect(stackOutputs.KubectlConfigCommand).toContain(
        'aws eks update-kubeconfig'
      );
      expect(stackOutputs.KubectlConfigCommand).toContain('--region');
      expect(stackOutputs.KubectlConfigCommand).toContain('--name');
    });

    test('VPC ID is properly formatted', () => {
      expect(stackOutputs.VpcId).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test('cluster security group ID is properly formatted', () => {
      expect(stackOutputs.ClusterSecurityGroupId).toMatch(/^sg-[a-f0-9]+$/);
    });
  });
});
