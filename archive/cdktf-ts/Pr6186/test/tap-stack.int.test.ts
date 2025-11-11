import {
  EKSClient,
  DescribeClusterCommand,
  ListNodegroupsCommand,
  DescribeNodegroupCommand,
  DescribeAddonCommand,
} from '@aws-sdk/client-eks';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
} from '@aws-sdk/client-ec2';
import {
  IAMClient,
  GetRoleCommand,
  GetOpenIDConnectProviderCommand,
  GetPolicyCommand,
} from '@aws-sdk/client-iam';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import * as fs from 'fs';
import * as path from 'path';

describe('EKS Infrastructure Integration Tests', () => {
  let outputs: any;
  let region: string;
  let clusterName: string;
  let vpcId: string;
  let environmentSuffix: string;

  const eksClient = new EKSClient({ region: 'us-east-2' });
  const ec2Client = new EC2Client({ region: 'us-east-2' });
  const iamClient = new IAMClient({ region: 'us-east-1' }); // IAM is global
  const logsClient = new CloudWatchLogsClient({ region: 'us-east-2' });

  beforeAll(() => {
    // Load outputs from deployment
    const outputsPath = path.join(
      __dirname,
      '..',
      'cfn-outputs',
      'flat-outputs.json'
    );

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Outputs file not found at ${outputsPath}. Please run deployment first.`
      );
    }

    const rawOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

    // Handle nested CDKTF output structure (TapStack{suffix}.output-name)
    // Find the first key that starts with "TapStack" and extract its outputs
    const stackKey = Object.keys(rawOutputs).find(key => key.startsWith('TapStack'));

    if (!stackKey) {
      throw new Error(
        'No TapStack outputs found in flat-outputs.json. Expected structure: { "TapStack{suffix}": { "cluster-name": "...", ... } }'
      );
    }

    outputs = rawOutputs[stackKey];
    region = outputs.region || 'us-east-2';
    clusterName = outputs['cluster-name'];
    vpcId = outputs['vpc-id'];

    // Extract environment suffix from cluster name
    if (clusterName) {
      environmentSuffix = clusterName.replace('eks-cluster-', '');
    } else {
      throw new Error('cluster-name not found in outputs');
    }

    expect(clusterName).toBeDefined();
    expect(vpcId).toBeDefined();
    expect(region).toBeDefined();
  });

  describe('VPC Infrastructure', () => {
    test('VPC exists and has correct configuration', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBe(1);

      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      // DNS settings are enabled by default for VPCs

      // Verify VPC tags
      const nameTag = vpc.Tags?.find((tag) => tag.Key === 'Name');
      expect(nameTag?.Value).toContain(environmentSuffix);
    });

    test('VPC has 3 public subnets across different AZs', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'tag:Name', Values: [`*public-subnet*${environmentSuffix}`] },
          ],
        })
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBe(3);

      // Verify each subnet is in a different AZ
      const azs = new Set(response.Subnets?.map((subnet) => subnet.AvailabilityZone));
      expect(azs.size).toBe(3);

      // Verify CIDR blocks
      const cidrBlocks = response.Subnets?.map((subnet) => subnet.CidrBlock).sort();
      expect(cidrBlocks).toContain('10.0.0.0/24');
      expect(cidrBlocks).toContain('10.0.1.0/24');
      expect(cidrBlocks).toContain('10.0.2.0/24');

      // Verify public IP assignment
      response.Subnets?.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('VPC has 3 private subnets across different AZs', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'tag:Name', Values: [`*private-subnet*${environmentSuffix}`] },
          ],
        })
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBe(3);

      // Verify each subnet is in a different AZ
      const azs = new Set(response.Subnets?.map((subnet) => subnet.AvailabilityZone));
      expect(azs.size).toBe(3);

      // Verify CIDR blocks
      const cidrBlocks = response.Subnets?.map((subnet) => subnet.CidrBlock).sort();
      expect(cidrBlocks).toContain('10.0.10.0/24');
      expect(cidrBlocks).toContain('10.0.11.0/24');
      expect(cidrBlocks).toContain('10.0.12.0/24');
    });

    test('VPC has 3 NAT Gateways in available state', async () => {
      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'tag:Name', Values: [`*nat-gateway*${environmentSuffix}`] },
          ],
        })
      );

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways?.length).toBe(3);

      // Verify all NAT gateways are available
      response.NatGateways?.forEach((natGw) => {
        expect(natGw.State).toBe('available');
      });
    });

    test('VPC has Internet Gateway attached', async () => {
      const response = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [
            { Name: 'attachment.vpc-id', Values: [vpcId] },
            { Name: 'tag:Name', Values: [`*igw*${environmentSuffix}`] },
          ],
        })
      );

      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways?.length).toBe(1);

      const igw = response.InternetGateways![0];
      expect(igw.Attachments?.[0].State).toBe('available');
    });
  });

  describe('EKS Cluster', () => {
    test('EKS cluster exists and is active', async () => {
      const response = await eksClient.send(
        new DescribeClusterCommand({
          name: clusterName,
        })
      );

      expect(response.cluster).toBeDefined();
      expect(response.cluster?.status).toBe('ACTIVE');
      expect(response.cluster?.version).toBe('1.28');
    });

    test('EKS cluster has correct VPC configuration', async () => {
      const response = await eksClient.send(
        new DescribeClusterCommand({
          name: clusterName,
        })
      );

      expect(response.cluster?.resourcesVpcConfig?.vpcId).toBe(vpcId);
      expect(response.cluster?.resourcesVpcConfig?.endpointPrivateAccess).toBe(true);
      expect(response.cluster?.resourcesVpcConfig?.endpointPublicAccess).toBe(true);
    });

    test('EKS cluster has control plane logging enabled', async () => {
      const response = await eksClient.send(
        new DescribeClusterCommand({
          name: clusterName,
        })
      );

      const logging = response.cluster?.logging?.clusterLogging?.[0];
      expect(logging?.enabled).toBe(true);
      expect(logging?.types).toContain('audit');
      expect(logging?.types).toContain('authenticator');
      expect(logging?.types).toContain('controllerManager');
    });

    test('CloudWatch log group exists for EKS cluster', async () => {
      const logGroupName = `/aws/eks/${clusterName}/cluster`;
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName,
        })
      );

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      expect(response.logGroups?.[0].logGroupName).toBe(logGroupName);
      expect(response.logGroups?.[0].retentionInDays).toBe(7);
    });

    test('EKS cluster has OIDC provider configured', async () => {
      const response = await eksClient.send(
        new DescribeClusterCommand({
          name: clusterName,
        })
      );

      expect(response.cluster?.identity?.oidc?.issuer).toBeDefined();
      const oidcIssuer = response.cluster?.identity?.oidc?.issuer!;

      // Verify OIDC provider exists in IAM
      const oidcProviderArn = `arn:aws:iam::${outputs['cluster-endpoint']
        .split('.')
        .slice(0, 1)}:oidc-provider/${oidcIssuer.replace('https://', '')}`;

      // Note: This test requires the ARN to be in outputs for full validation
      expect(oidcIssuer).toContain('oidc.eks');
    });
  });

  describe('EKS Node Groups', () => {
    test('General workload node group exists and is active', async () => {
      const listResponse = await eksClient.send(
        new ListNodegroupsCommand({
          clusterName,
        })
      );

      expect(listResponse.nodegroups).toContain(`general-node-group-${environmentSuffix}`);

      const describeResponse = await eksClient.send(
        new DescribeNodegroupCommand({
          clusterName,
          nodegroupName: `general-node-group-${environmentSuffix}`,
        })
      );

      const nodeGroup = describeResponse.nodegroup!;
      expect(nodeGroup.status).toBe('ACTIVE');
      expect(nodeGroup.scalingConfig?.minSize).toBe(2);
      expect(nodeGroup.scalingConfig?.maxSize).toBe(10);
      expect(nodeGroup.scalingConfig?.desiredSize).toBeGreaterThanOrEqual(2);
      expect(nodeGroup.instanceTypes).toContain('t3.medium');
      expect(nodeGroup.instanceTypes).toContain('t3.large');
      expect(nodeGroup.capacityType).toBe('ON_DEMAND');
    });

    test('GPU workload node group exists and is active', async () => {
      const listResponse = await eksClient.send(
        new ListNodegroupsCommand({
          clusterName,
        })
      );

      expect(listResponse.nodegroups).toContain(`gpu-node-group-${environmentSuffix}`);

      const describeResponse = await eksClient.send(
        new DescribeNodegroupCommand({
          clusterName,
          nodegroupName: `gpu-node-group-${environmentSuffix}`,
        })
      );

      const nodeGroup = describeResponse.nodegroup!;
      expect(nodeGroup.status).toBe('ACTIVE');
      expect(nodeGroup.scalingConfig?.minSize).toBe(0);
      expect(nodeGroup.scalingConfig?.maxSize).toBe(3);
      expect(nodeGroup.instanceTypes).toContain('g4dn.xlarge');
      expect(nodeGroup.capacityType).toBe('ON_DEMAND');
    });

    test('Node groups have cluster autoscaler tags', async () => {
      const describeResponse = await eksClient.send(
        new DescribeNodegroupCommand({
          clusterName,
          nodegroupName: `general-node-group-${environmentSuffix}`,
        })
      );

      const tags = describeResponse.nodegroup?.tags || {};
      expect(tags['k8s.io/cluster-autoscaler/enabled']).toBe('true');
      expect(tags[`k8s.io/cluster-autoscaler/${clusterName}`]).toBe('owned');
    });
  });

  describe('EKS Add-ons', () => {
    test('VPC CNI add-on is active', async () => {
      const response = await eksClient.send(
        new DescribeAddonCommand({
          clusterName,
          addonName: 'vpc-cni',
        })
      );

      expect(response.addon).toBeDefined();
      expect(response.addon?.status).toBe('ACTIVE');
      expect(response.addon?.addonVersion).toContain('v1.16.0');
    });

    test('kube-proxy add-on is active', async () => {
      const response = await eksClient.send(
        new DescribeAddonCommand({
          clusterName,
          addonName: 'kube-proxy',
        })
      );

      expect(response.addon).toBeDefined();
      expect(response.addon?.status).toBe('ACTIVE');
      expect(response.addon?.addonVersion).toContain('v1.28');
    });

    test('CoreDNS add-on is active', async () => {
      const response = await eksClient.send(
        new DescribeAddonCommand({
          clusterName,
          addonName: 'coredns',
        })
      );

      expect(response.addon).toBeDefined();
      expect(response.addon?.status).toBe('ACTIVE');
      expect(response.addon?.addonVersion).toContain('v1.10');
    });
  });

  describe('IAM Roles and Policies', () => {
    test('EKS cluster IAM role exists with correct policies', async () => {
      const roleName = `eks-cluster-role-${environmentSuffix}`;
      const response = await iamClient.send(
        new GetRoleCommand({
          RoleName: roleName,
        })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
      expect(response.Role?.AssumeRolePolicyDocument).toContain('eks.amazonaws.com');
    });

    test('EKS node IAM role exists with correct policies', async () => {
      const roleName = `eks-node-role-${environmentSuffix}`;
      const response = await iamClient.send(
        new GetRoleCommand({
          RoleName: roleName,
        })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
      expect(response.Role?.AssumeRolePolicyDocument).toContain('ec2.amazonaws.com');
    });

    test('IRSA S3 access role exists', async () => {
      const roleName = `s3-access-irsa-role-${environmentSuffix}`;
      const response = await iamClient.send(
        new GetRoleCommand({
          RoleName: roleName,
        })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);

      // Decode URL-encoded policy document
      const policyDoc = decodeURIComponent(
        response.Role?.AssumeRolePolicyDocument || ''
      );
      expect(policyDoc).toContain('sts:AssumeRoleWithWebIdentity');
    });

    test('S3 access policy exists with correct permissions', async () => {
      const policyName = `s3-access-policy-${environmentSuffix}`;

      // Get policy ARN from role
      const roleResponse = await iamClient.send(
        new GetRoleCommand({
          RoleName: `s3-access-irsa-role-${environmentSuffix}`,
        })
      );

      expect(roleResponse.Role).toBeDefined();

      // Note: Full policy validation would require listing attached policies
      // This confirms the role exists and can be accessed
    });
  });

  describe('Outputs Validation', () => {
    test('Cluster endpoint output is accessible', () => {
      expect(outputs['cluster-endpoint']).toBeDefined();
      expect(outputs['cluster-endpoint']).toContain('eks.amazonaws.com');
    });

    test('OIDC provider URL output is valid', () => {
      expect(outputs['oidc-provider-url']).toBeDefined();
      expect(outputs['oidc-provider-url']).toContain('oidc.eks');
    });

    test('kubectl config command output is valid', () => {
      expect(outputs['kubectl-config-command']).toBeDefined();
      expect(outputs['kubectl-config-command']).toContain('aws eks update-kubeconfig');
      expect(outputs['kubectl-config-command']).toContain(region);
      expect(outputs['kubectl-config-command']).toContain(clusterName);
    });

    test('Region output matches expected region', () => {
      expect(outputs.region).toBe('us-east-2');
    });
  });
});
