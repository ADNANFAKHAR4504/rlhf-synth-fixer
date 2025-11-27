import * as fs from 'fs';
import * as path from 'path';
import {
  EKSClient,
  DescribeClusterCommand,
  DescribeNodegroupCommand,
  DescribeAddonCommand,
  ListAddonsCommand,
} from '@aws-sdk/client-eks';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeVpcAttributeCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
} from '@aws-sdk/client-ec2';
import {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';

// Read the deployment outputs
const outputsPath = path.join(
  __dirname,
  '..',
  'cfn-outputs',
  'flat-outputs.json'
);
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

// Extract region from cluster endpoint or use default
const region = 'us-east-1';

// Initialize AWS SDK clients
const eksClient = new EKSClient({ region });
const ec2Client = new EC2Client({ region });
const iamClient = new IAMClient({ region });

describe('TapStack Integration Tests - Live AWS Resources', () => {
  describe('Deployment Outputs', () => {
    it('should have all required outputs', () => {
      expect(outputs).toBeDefined();
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.clusterName).toBeDefined();
      expect(outputs.clusterEndpoint).toBeDefined();
      expect(outputs.clusterOidcProviderUrl).toBeDefined();
      expect(outputs.clusterOidcProviderArn).toBeDefined();
      expect(outputs.generalNodeGroupName).toBeDefined();
      expect(outputs.computeNodeGroupName).toBeDefined();
      expect(outputs.clusterAutoscalerRoleArn).toBeDefined();
      expect(outputs.kubeconfigJson).toBeDefined();
    });

    it('should have valid output values', () => {
      expect(outputs.vpcId).toMatch(/^vpc-[a-f0-9]+$/);
      expect(outputs.clusterName).toContain('eks-cluster');
      expect(outputs.clusterEndpoint).toMatch(/^https:\/\//);
      expect(outputs.clusterOidcProviderUrl).toMatch(/^https:\/\//);
      expect(outputs.clusterOidcProviderArn).toMatch(/^arn:aws:iam::/);
      expect(outputs.clusterAutoscalerRoleArn).toMatch(/^arn:aws:iam::/);
    });

    it('should have valid kubeconfig JSON', () => {
      const kubeconfig = JSON.parse(outputs.kubeconfigJson);
      expect(kubeconfig.apiVersion).toBe('v1');
      expect(kubeconfig.kind).toBe('Config');
      expect(kubeconfig.clusters).toBeDefined();
      expect(kubeconfig.clusters.length).toBeGreaterThan(0);
      expect(kubeconfig.users).toBeDefined();
      expect(kubeconfig.users.length).toBeGreaterThan(0);
      expect(kubeconfig.contexts).toBeDefined();
      expect(kubeconfig['current-context']).toBeDefined();
    });
  });

  describe('VPC Configuration', () => {
    let vpcDetails: any;
    let dnsSupportAttribute: any;
    let dnsHostnamesAttribute: any;

    beforeAll(async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });
      const response = await ec2Client.send(command);
      vpcDetails = response.Vpcs?.[0];

      // Get DNS support attribute
      const dnsSupportCommand = new DescribeVpcAttributeCommand({
        VpcId: outputs.vpcId,
        Attribute: 'enableDnsSupport',
      });
      const dnsSupportResponse = await ec2Client.send(dnsSupportCommand);
      dnsSupportAttribute = dnsSupportResponse.EnableDnsSupport;

      // Get DNS hostnames attribute
      const dnsHostnamesCommand = new DescribeVpcAttributeCommand({
        VpcId: outputs.vpcId,
        Attribute: 'enableDnsHostnames',
      });
      const dnsHostnamesResponse = await ec2Client.send(dnsHostnamesCommand);
      dnsHostnamesAttribute = dnsHostnamesResponse.EnableDnsHostnames;
    });

    it('should have VPC with correct CIDR block', () => {
      expect(vpcDetails).toBeDefined();
      expect(vpcDetails.CidrBlock).toBe('10.0.0.0/16');
    });

    it('should have DNS support enabled', () => {
      expect(dnsSupportAttribute?.Value).toBe(true);
    });

    it('should have DNS hostnames enabled', () => {
      expect(dnsHostnamesAttribute?.Value).toBe(true);
    });

    it('should have correct tags', () => {
      const tags = vpcDetails.Tags || [];
      const nameTag = tags.find((t: any) => t.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toContain('eks-vpc');

      const envTag = tags.find((t: any) => t.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe('production');
    });
  });

  describe('Subnet Configuration', () => {
    let subnets: any[];

    beforeAll(async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);
      subnets = response.Subnets || [];
    });

    it('should have exactly 6 subnets (3 public + 3 private)', () => {
      expect(subnets.length).toBe(6);
    });

    it('should have 3 public subnets with correct CIDR blocks', () => {
      const publicSubnets = subnets.filter((s) =>
        s.Tags?.some(
          (t: any) => t.Key === 'kubernetes.io/role/elb' && t.Value === '1'
        )
      );
      expect(publicSubnets.length).toBe(3);

      const expectedCidrs = ['10.0.0.0/24', '10.0.1.0/24', '10.0.2.0/24'];
      const actualCidrs = publicSubnets.map((s) => s.CidrBlock).sort();
      expect(actualCidrs).toEqual(expectedCidrs);
    });

    it('should have 3 private subnets with correct CIDR blocks', () => {
      const privateSubnets = subnets.filter((s) =>
        s.Tags?.some(
          (t: any) =>
            t.Key === 'kubernetes.io/role/internal-elb' && t.Value === '1'
        )
      );
      expect(privateSubnets.length).toBe(3);

      const expectedCidrs = ['10.0.10.0/24', '10.0.11.0/24', '10.0.12.0/24'];
      const actualCidrs = privateSubnets.map((s) => s.CidrBlock).sort();
      expect(actualCidrs).toEqual(expectedCidrs);
    });

    it('should have subnets spread across 3 availability zones', () => {
      const azs = [...new Set(subnets.map((s) => s.AvailabilityZone))];
      expect(azs.length).toBe(3);
    });

    it('should have public subnets with auto-assign public IP enabled', () => {
      const publicSubnets = subnets.filter((s) =>
        s.Tags?.some(
          (t: any) => t.Key === 'kubernetes.io/role/elb' && t.Value === '1'
        )
      );
      publicSubnets.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    it('should have private subnets with auto-assign public IP disabled', () => {
      const privateSubnets = subnets.filter((s) =>
        s.Tags?.some(
          (t: any) =>
            t.Key === 'kubernetes.io/role/internal-elb' && t.Value === '1'
        )
      );
      privateSubnets.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });
  });

  describe('NAT Gateway Configuration', () => {
    let natGateways: any[];

    beforeAll(async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
          {
            Name: 'state',
            Values: ['available'],
          },
        ],
      });
      const response = await ec2Client.send(command);
      natGateways = response.NatGateways || [];
    });

    it('should have 3 NAT gateways (one per AZ)', () => {
      expect(natGateways.length).toBe(3);
    });

    it('should have NAT gateways in available state', () => {
      natGateways.forEach((nat) => {
        expect(nat.State).toBe('available');
      });
    });

    it('should have Elastic IPs assigned to NAT gateways', () => {
      natGateways.forEach((nat) => {
        expect(nat.NatGatewayAddresses).toBeDefined();
        expect(nat.NatGatewayAddresses.length).toBeGreaterThan(0);
        expect(nat.NatGatewayAddresses[0].PublicIp).toBeDefined();
      });
    });
  });

  describe('Internet Gateway Configuration', () => {
    let internetGateways: any[];

    beforeAll(async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [outputs.vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);
      internetGateways = response.InternetGateways || [];
    });

    it('should have exactly 1 internet gateway', () => {
      expect(internetGateways.length).toBe(1);
    });

    it('should be attached to the VPC', () => {
      const igw = internetGateways[0];
      expect(igw.Attachments).toBeDefined();
      expect(igw.Attachments.length).toBe(1);
      expect(igw.Attachments[0].VpcId).toBe(outputs.vpcId);
      expect(igw.Attachments[0].State).toBe('available');
    });
  });

  describe('Security Groups', () => {
    let securityGroups: any[];

    beforeAll(async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);
      securityGroups = response.SecurityGroups || [];
    });

    it('should have security groups for cluster and nodes', () => {
      expect(securityGroups.length).toBeGreaterThanOrEqual(3); // At least cluster, node, and default SG
    });

    it('should have cluster security group', () => {
      const clusterSG = securityGroups.find((sg) =>
        sg.Tags?.some(
          (t: any) =>
            t.Key === 'Name' && t.Value.includes('eks-cluster-sg')
        )
      );
      expect(clusterSG).toBeDefined();
      // EKS managed security group has AWS-generated description
      expect(clusterSG?.Description).toMatch(
        /EKS created security group|cluster/i
      );
    });

    it('should have node security group', () => {
      const nodeSG = securityGroups.find((sg) =>
        sg.Tags?.some(
          (t: any) => t.Key === 'Name' && t.Value.includes('eks-node-sg')
        )
      );
      expect(nodeSG).toBeDefined();
      expect(nodeSG?.Description).toContain('worker nodes');
    });
  });

  describe('EKS Cluster', () => {
    let clusterDetails: any;

    beforeAll(async () => {
      const command = new DescribeClusterCommand({
        name: outputs.clusterName,
      });
      const response = await eksClient.send(command);
      clusterDetails = response.cluster;
    });

    it('should have cluster in ACTIVE state', () => {
      expect(clusterDetails).toBeDefined();
      expect(clusterDetails.status).toBe('ACTIVE');
    });

    it('should have Kubernetes version 1.28', () => {
      expect(clusterDetails.version).toBe('1.28');
    });

    it('should have private endpoint access enabled', () => {
      expect(clusterDetails.resourcesVpcConfig.endpointPrivateAccess).toBe(
        true
      );
    });

    it('should have public endpoint access disabled', () => {
      expect(clusterDetails.resourcesVpcConfig.endpointPublicAccess).toBe(
        false
      );
    });

    it('should have all control plane logs enabled', () => {
      const logTypes = clusterDetails.logging?.clusterLogging?.[0]?.types || [];
      const expectedLogs = [
        'api',
        'audit',
        'authenticator',
        'controllerManager',
        'scheduler',
      ];

      expectedLogs.forEach((logType) => {
        expect(logTypes).toContain(logType);
      });
    });

    it('should be configured with correct subnets', () => {
      const subnetIds = clusterDetails.resourcesVpcConfig.subnetIds || [];
      expect(subnetIds.length).toBe(6); // 3 public + 3 private
    });

    it('should have OIDC provider configured', () => {
      expect(clusterDetails.identity?.oidc?.issuer).toBeDefined();
      expect(clusterDetails.identity.oidc.issuer).toBe(
        outputs.clusterOidcProviderUrl
      );
    });

    it('should have correct tags', () => {
      const tags = clusterDetails.tags || {};
      expect(tags.Environment).toBe('production');
      expect(tags.Team).toBe('platform');
      expect(tags.CostCenter).toBe('engineering');
    });
  });

  describe('IAM Roles', () => {
    describe('Cluster Autoscaler Role', () => {
      let roleDetails: any;
      let policies: any[];

      beforeAll(async () => {
        const roleName = outputs.clusterAutoscalerRoleArn.split('/').pop();
        const roleCommand = new GetRoleCommand({ RoleName: roleName });
        const roleResponse = await iamClient.send(roleCommand);
        roleDetails = roleResponse.Role;

        const policiesCommand = new ListAttachedRolePoliciesCommand({
          RoleName: roleName,
        });
        const policiesResponse = await iamClient.send(policiesCommand);
        policies = policiesResponse.AttachedPolicies || [];
      });

      it('should exist and be active', () => {
        expect(roleDetails).toBeDefined();
        expect(roleDetails.Arn).toBe(outputs.clusterAutoscalerRoleArn);
      });

      it('should have assume role policy with IRSA trust relationship', () => {
        const assumeRolePolicy = JSON.parse(
          decodeURIComponent(roleDetails.AssumeRolePolicyDocument)
        );
        expect(assumeRolePolicy.Statement).toBeDefined();

        const statement = assumeRolePolicy.Statement[0];
        expect(statement.Effect).toBe('Allow');
        expect(statement.Action).toBe('sts:AssumeRoleWithWebIdentity');
        expect(statement.Principal.Federated).toContain('oidc-provider');
      });

      it('should have cluster autoscaler policy attached', () => {
        expect(policies.length).toBeGreaterThan(0);
        const autoscalerPolicy = policies.find((p) =>
          p.PolicyName.includes('cluster-autoscaler-policy')
        );
        expect(autoscalerPolicy).toBeDefined();
      });
    });
  });

  describe('EKS Add-ons', () => {
    let addons: string[];

    beforeAll(async () => {
      const command = new ListAddonsCommand({
        clusterName: outputs.clusterName,
      });
      const response = await eksClient.send(command);
      addons = response.addons || [];
    });

    it('should have all required add-ons installed', () => {
      expect(addons).toContain('vpc-cni');
      expect(addons).toContain('coredns');
      expect(addons).toContain('kube-proxy');
      expect(addons).toContain('aws-ebs-csi-driver');
    });

    describe('VPC CNI Add-on', () => {
      let addonDetails: any;

      beforeAll(async () => {
        const command = new DescribeAddonCommand({
          clusterName: outputs.clusterName,
          addonName: 'vpc-cni',
        });
        const response = await eksClient.send(command);
        addonDetails = response.addon;
      });

      it('should be in ACTIVE state', () => {
        expect(addonDetails).toBeDefined();
        expect(addonDetails.status).toBe('ACTIVE');
      });

      it('should have correct version', () => {
        expect(addonDetails.addonVersion).toBeDefined();
        expect(addonDetails.addonVersion).toContain('v1.');
      });
    });

    describe('CoreDNS Add-on', () => {
      let addonDetails: any;

      beforeAll(async () => {
        const command = new DescribeAddonCommand({
          clusterName: outputs.clusterName,
          addonName: 'coredns',
        });
        const response = await eksClient.send(command);
        addonDetails = response.addon;
      });

      it('should be in ACTIVE state', () => {
        expect(addonDetails).toBeDefined();
        expect(addonDetails.status).toBe('ACTIVE');
      });

      it('should have correct version', () => {
        expect(addonDetails.addonVersion).toBeDefined();
        expect(addonDetails.addonVersion).toContain('v1.');
      });
    });

    describe('kube-proxy Add-on', () => {
      let addonDetails: any;

      beforeAll(async () => {
        const command = new DescribeAddonCommand({
          clusterName: outputs.clusterName,
          addonName: 'kube-proxy',
        });
        const response = await eksClient.send(command);
        addonDetails = response.addon;
      });

      it('should be in ACTIVE state', () => {
        expect(addonDetails).toBeDefined();
        expect(addonDetails.status).toBe('ACTIVE');
      });

      it('should have correct version', () => {
        expect(addonDetails.addonVersion).toBeDefined();
        expect(addonDetails.addonVersion).toContain('v1.');
      });
    });

    describe('EBS CSI Driver Add-on', () => {
      let addonDetails: any;

      beforeAll(async () => {
        const command = new DescribeAddonCommand({
          clusterName: outputs.clusterName,
          addonName: 'aws-ebs-csi-driver',
        });
        const response = await eksClient.send(command);
        addonDetails = response.addon;
      });

      it('should be in ACTIVE state', () => {
        expect(addonDetails).toBeDefined();
        expect(addonDetails.status).toBe('ACTIVE');
      });

      it('should have correct version', () => {
        expect(addonDetails.addonVersion).toBeDefined();
        expect(addonDetails.addonVersion).toContain('v1.');
      });

      it('should have service account role ARN configured', () => {
        expect(addonDetails.serviceAccountRoleArn).toBeDefined();
        expect(addonDetails.serviceAccountRoleArn).toMatch(/^arn:aws:iam::/);
      });
    });
  });

  describe('Node Groups', () => {
    describe('General Purpose Node Group', () => {
      let nodeGroupDetails: any;

      beforeAll(async () => {
        const command = new DescribeNodegroupCommand({
          clusterName: outputs.clusterName,
          nodegroupName: outputs.generalNodeGroupName,
        });
        const response = await eksClient.send(command);
        nodeGroupDetails = response.nodegroup;
      });

      it('should be in ACTIVE state', () => {
        expect(nodeGroupDetails).toBeDefined();
        expect(nodeGroupDetails.status).toBe('ACTIVE');
      });

      it('should use t4g.medium instance type', () => {
        expect(nodeGroupDetails.instanceTypes).toContain('t4g.medium');
      });

      it('should use ARM64 AMI type', () => {
        expect(nodeGroupDetails.amiType).toBe('AL2_ARM_64');
      });

      it('should use ON_DEMAND capacity type', () => {
        expect(nodeGroupDetails.capacityType).toBe('ON_DEMAND');
      });

      it('should have correct scaling configuration', () => {
        const scaling = nodeGroupDetails.scalingConfig;
        expect(scaling).toBeDefined();
        expect(scaling.desiredSize).toBe(2);
        expect(scaling.minSize).toBe(2);
        expect(scaling.maxSize).toBe(10);
      });

      it('should have appropriate labels', () => {
        const labels = nodeGroupDetails.labels || {};
        expect(labels['node-type']).toBe('general');
        expect(labels['workload']).toBe('stateless');
      });

      it('should have cluster autoscaler tags', () => {
        const tags = nodeGroupDetails.tags || {};
        expect(tags['k8s.io/cluster-autoscaler/enabled']).toBe('true');
      });
    });

    describe('Compute-Intensive Node Group', () => {
      let nodeGroupDetails: any;

      beforeAll(async () => {
        const command = new DescribeNodegroupCommand({
          clusterName: outputs.clusterName,
          nodegroupName: outputs.computeNodeGroupName,
        });
        const response = await eksClient.send(command);
        nodeGroupDetails = response.nodegroup;
      });

      it('should be in ACTIVE state', () => {
        expect(nodeGroupDetails).toBeDefined();
        expect(nodeGroupDetails.status).toBe('ACTIVE');
      });

      it('should use c7g.large instance type', () => {
        expect(nodeGroupDetails.instanceTypes).toContain('c7g.large');
      });

      it('should use ARM64 AMI type', () => {
        expect(nodeGroupDetails.amiType).toBe('AL2_ARM_64');
      });

      it('should use ON_DEMAND capacity type', () => {
        expect(nodeGroupDetails.capacityType).toBe('ON_DEMAND');
      });

      it('should have correct scaling configuration', () => {
        const scaling = nodeGroupDetails.scalingConfig;
        expect(scaling).toBeDefined();
        expect(scaling.desiredSize).toBe(2);
        expect(scaling.minSize).toBe(2);
        expect(scaling.maxSize).toBe(10);
      });

      it('should have appropriate labels', () => {
        const labels = nodeGroupDetails.labels || {};
        expect(labels['node-type']).toBe('compute');
        expect(labels['workload']).toBe('compute-intensive');
      });

      it('should have cluster autoscaler tags', () => {
        const tags = nodeGroupDetails.tags || {};
        expect(tags['k8s.io/cluster-autoscaler/enabled']).toBe('true');
      });
    });
  });

  describe('Resource Tagging Compliance', () => {
    it('should have required tags on all major resources', async () => {
      // Check cluster tags
      const clusterCommand = new DescribeClusterCommand({
        name: outputs.clusterName,
      });
      const clusterResponse = await eksClient.send(clusterCommand);
      const clusterTags = clusterResponse.cluster?.tags || {};

      expect(clusterTags.Environment).toBe('production');
      expect(clusterTags.Team).toBe('platform');
      expect(clusterTags.CostCenter).toBe('engineering');

      // Check VPC tags
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcTags = vpcResponse.Vpcs?.[0]?.Tags || [];

      const envTag = vpcTags.find((t: any) => t.Key === 'Environment');
      expect(envTag?.Value).toBe('production');

      const teamTag = vpcTags.find((t: any) => t.Key === 'Team');
      expect(teamTag?.Value).toBe('platform');

      const costCenterTag = vpcTags.find((t: any) => t.Key === 'CostCenter');
      expect(costCenterTag?.Value).toBe('engineering');
    });
  });
});
