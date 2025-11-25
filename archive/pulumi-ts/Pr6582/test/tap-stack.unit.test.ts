/**
 * Comprehensive Unit Tests for All Lib Stack Files
 * 100% Code Coverage with Mock Testing (No Live AWS/Kubernetes Calls)
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as k8s from '@pulumi/kubernetes';

import { TapStack, TapStackArgs } from '../lib/tap-stack';
import { VpcStack, VpcStackArgs } from '../lib/vpc-stack';
import { EksClusterStack, EksClusterStackArgs } from '../lib/eks-cluster-stack';
import { NodeGroupsStack, NodeGroupsStackArgs } from '../lib/node-groups-stack';
import { CalicoStack, CalicoStackArgs } from '../lib/calico-stack';
import { ClusterAutoscalerStack } from '../lib/cluster-autoscaler-stack';
import { LoadBalancerControllerStack } from '../lib/load-balancer-controller-stack';
import { NetworkPoliciesStack } from '../lib/network-policies-stack';

jest.mock('@pulumi/pulumi');
jest.mock('@pulumi/aws');
jest.mock('@pulumi/kubernetes');

function createMockOutput<T>(value: T): pulumi.Output<T> {
  return {
    apply: jest.fn((callback: any) => {
      const result = callback(value);
      return createMockOutput(result);
    }),
    isKnown: true,
    isSecret: false,
  } as any;
}

function mockOutputAll(values: any[]): pulumi.Output<any[]> {
  // Resolve nested outputs to their values
  const resolvedValues = values.map(v => {
    if (v && typeof v === 'object' && v.apply) {
      // If it's a mock output, extract the value from the first apply call
      let extractedValue: any;
      v.apply((val: any) => { extractedValue = val; return val; });
      return extractedValue;
    }
    return v;
  });

  return {
    apply: jest.fn((callback: any) => {
      const result = callback(resolvedValues);
      return createMockOutput(result);
    }),
    isKnown: true,
    isSecret: false,
  } as any;
}

describe("VpcStack", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (pulumi.output as any) = jest.fn((value: any) => createMockOutput(value));
    (pulumi.all as any) = jest.fn((...args: any[]) => mockOutputAll(args.flat()));
    (pulumi.ComponentResource as any) = jest.fn(function (this: any) {
      this.registerOutputs = jest.fn();
    });
    (aws.getAvailabilityZonesOutput as any) = jest.fn(() => ({
      names: createMockOutput(['us-east-1a', 'us-east-1b', 'us-east-1c']),
    }));
    (aws.ec2.Vpc as any) = jest.fn(() => ({ id: createMockOutput('vpc-1') }));
    (aws.ec2.InternetGateway as any) = jest.fn(() => ({ id: createMockOutput('igw-1') }));
    (aws.ec2.Subnet as any) = jest.fn(() => ({ id: createMockOutput('subnet-1') }));
    (aws.ec2.RouteTable as any) = jest.fn(() => ({ id: createMockOutput('rt-1') }));
    (aws.ec2.Route as any) = jest.fn();
    (aws.ec2.RouteTableAssociation as any) = jest.fn();
    (aws.ec2.Eip as any) = jest.fn(() => ({ id: createMockOutput('eip-1') }));
    (aws.ec2.NatGateway as any) = jest.fn(() => ({ id: createMockOutput('nat-1') }));
  });

  it("creates successfully", () => {
    const stack = new VpcStack('test', { environmentSuffix: 'dev', region: 'us-east-1', tags: {} });
    expect(stack).toBeDefined();
  });

  it("creates VPC with CIDR 10.0.0.0/16", () => {
    new VpcStack('test', { environmentSuffix: 'dev', region: 'us-east-1', tags: {} });
    expect(aws.ec2.Vpc).toHaveBeenCalledWith('eks-vpc-dev', expect.objectContaining({ cidrBlock: '10.0.0.0/16' }), expect.any(Object));
  });

  it("creates 3 public subnets", () => {
    new VpcStack('test', { environmentSuffix: 'dev', region: 'us-east-1', tags: {} });
    const calls = (aws.ec2.Subnet as unknown as jest.Mock).mock.calls.filter(c => c[0].includes('public'));
    expect(calls.length).toBe(3);
  });

  it("creates 3 private subnets", () => {
    new VpcStack('test', { environmentSuffix: 'dev', region: 'us-east-1', tags: {} });
    const calls = (aws.ec2.Subnet as unknown as jest.Mock).mock.calls.filter(c => c[0].includes('private'));
    expect(calls.length).toBe(3);
  });

  it("creates 3 NAT gateways", () => {
    new VpcStack('test', { environmentSuffix: 'dev', region: 'us-east-1', tags: {} });
    expect(aws.ec2.NatGateway).toHaveBeenCalledTimes(3);
  });

  it("exposes vpcId output", () => {
    const stack = new VpcStack('test', { environmentSuffix: 'dev', region: 'us-east-1', tags: {} });
    expect(stack.vpcId).toBeDefined();
  });

  it("registers outputs", () => {
    const stack = new VpcStack('test', { environmentSuffix: 'dev', region: 'us-east-1', tags: {} });
    expect((stack as any).registerOutputs).toHaveBeenCalled();
  });
});

describe("EksClusterStack", () => {
  const mockVpcId = createMockOutput('vpc-1');
  const mockPrivateSubnetIds = createMockOutput(['subnet-1']);
  const mockPublicSubnetIds = createMockOutput(['subnet-2']);

  beforeEach(() => {
    jest.clearAllMocks();
    (pulumi.output as any) = jest.fn((value: any) => createMockOutput(value));
    (pulumi.all as any) = jest.fn((...args: any[]) => mockOutputAll(args.flat()));
    (pulumi.ComponentResource as any) = jest.fn(function (this: any) {
      this.registerOutputs = jest.fn();
    });
    (aws.iam.assumeRolePolicyForPrincipal as any) = jest.fn(() => 'policy');
    (aws.iam.Role as any) = jest.fn(() => ({ arn: createMockOutput('arn'), name: createMockOutput('role') }));
    (aws.iam.RolePolicyAttachment as any) = jest.fn();
    (aws.iam.OpenIdConnectProvider as any) = jest.fn(() => ({ arn: createMockOutput('oidc-arn') }));
    (aws.ec2.SecurityGroup as any) = jest.fn(() => ({ id: createMockOutput('sg-1') }));
    (aws.eks.Cluster as any) = jest.fn(() => ({
      name: createMockOutput('cluster'),
      endpoint: createMockOutput('https://eks'),
      certificateAuthority: createMockOutput({ data: 'cert' }),
      identities: [{ oidcs: [{ issuer: createMockOutput('https://oidc') }] }],
    }));
    (aws.eks.Addon as any) = jest.fn();
  });

  it("creates successfully", () => {
    const stack = new EksClusterStack('test', {
      environmentSuffix: 'dev',
      kubernetesVersion: '1.28',
      vpcId: mockVpcId,
      privateSubnetIds: mockPrivateSubnetIds,
      publicSubnetIds: mockPublicSubnetIds,
      tags: {},
    });
    expect(stack).toBeDefined();
  });

  it("creates cluster role", () => {
    new EksClusterStack('test', {
      environmentSuffix: 'dev',
      kubernetesVersion: '1.28',
      vpcId: mockVpcId,
      privateSubnetIds: mockPrivateSubnetIds,
      publicSubnetIds: mockPublicSubnetIds,
      tags: {},
    });
    expect(aws.iam.Role).toHaveBeenCalledWith('eks-cluster-role-dev', expect.any(Object), expect.any(Object));
  });

  it("attaches EKS cluster policy", () => {
    new EksClusterStack('test', {
      environmentSuffix: 'dev',
      kubernetesVersion: '1.28',
      vpcId: mockVpcId,
      privateSubnetIds: mockPrivateSubnetIds,
      publicSubnetIds: mockPublicSubnetIds,
      tags: {},
    });
    expect(aws.iam.RolePolicyAttachment).toHaveBeenCalledWith(
      'eks-cluster-policy-dev',
      expect.objectContaining({ policyArn: 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy' }),
      expect.any(Object)
    );
  });

  it("creates EKS cluster with correct version", () => {
    new EksClusterStack('test', {
      environmentSuffix: 'dev',
      kubernetesVersion: '1.29',
      vpcId: mockVpcId,
      privateSubnetIds: mockPrivateSubnetIds,
      publicSubnetIds: mockPublicSubnetIds,
      tags: {},
    });
    expect(aws.eks.Cluster).toHaveBeenCalledWith(
      'eks-cluster-dev',
      expect.objectContaining({ version: '1.29' }),
      expect.any(Object)
    );
  });

  it("enables cluster logging", () => {
    new EksClusterStack('test', {
      environmentSuffix: 'dev',
      kubernetesVersion: '1.28',
      vpcId: mockVpcId,
      privateSubnetIds: mockPrivateSubnetIds,
      publicSubnetIds: mockPublicSubnetIds,
      tags: {},
    });
    expect(aws.eks.Cluster).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ enabledClusterLogTypes: ['api', 'audit', 'authenticator'] }),
      expect.any(Object)
    );
  });

  it("creates OIDC provider", () => {
    new EksClusterStack('test', {
      environmentSuffix: 'dev',
      kubernetesVersion: '1.28',
      vpcId: mockVpcId,
      privateSubnetIds: mockPrivateSubnetIds,
      publicSubnetIds: mockPublicSubnetIds,
      tags: {},
    });
    expect(aws.iam.OpenIdConnectProvider).toHaveBeenCalled();
  });

  it("creates node role", () => {
    new EksClusterStack('test', {
      environmentSuffix: 'dev',
      kubernetesVersion: '1.28',
      vpcId: mockVpcId,
      privateSubnetIds: mockPrivateSubnetIds,
      publicSubnetIds: mockPublicSubnetIds,
      tags: {},
    });
    expect(aws.iam.Role).toHaveBeenCalledWith('eks-node-role-dev', expect.any(Object), expect.any(Object));
  });

  it("attaches 4 node policies", () => {
    new EksClusterStack('test', {
      environmentSuffix: 'dev',
      kubernetesVersion: '1.28',
      vpcId: mockVpcId,
      privateSubnetIds: mockPrivateSubnetIds,
      publicSubnetIds: mockPublicSubnetIds,
      tags: {},
    });
    const attachments = (aws.iam.RolePolicyAttachment as unknown as jest.Mock).mock.calls.filter(c =>
      c[0].includes('eks-node-policy')
    );
    expect(attachments.length).toBe(4);
  });

  it("creates pod identity addon", () => {
    new EksClusterStack('test', {
      environmentSuffix: 'dev',
      kubernetesVersion: '1.28',
      vpcId: mockVpcId,
      privateSubnetIds: mockPrivateSubnetIds,
      publicSubnetIds: mockPublicSubnetIds,
      tags: {},
    });
    expect(aws.eks.Addon).toHaveBeenCalledWith(
      'eks-pod-identity-dev',
      expect.objectContaining({ addonName: 'eks-pod-identity-agent' }),
      expect.any(Object)
    );
  });

  it("exposes all outputs", () => {
    const stack = new EksClusterStack('test', {
      environmentSuffix: 'dev',
      kubernetesVersion: '1.28',
      vpcId: mockVpcId,
      privateSubnetIds: mockPrivateSubnetIds,
      publicSubnetIds: mockPublicSubnetIds,
      tags: {},
    });
    expect(stack.clusterName).toBeDefined();
    expect(stack.clusterEndpoint).toBeDefined();
    expect(stack.oidcProviderArn).toBeDefined();
    expect(stack.kubeconfig).toBeDefined();
    expect(stack.nodeRole).toBeDefined();
  });
});

describe("NodeGroupsStack", () => {
  const mockClusterName = createMockOutput('cluster');
  const mockNodeRole = createMockOutput({
    arn: createMockOutput('arn'),
    name: createMockOutput('node-role'),
    id: createMockOutput('node-role-id'),
  } as any) as any;
  const mockSubnets = createMockOutput(['subnet-1']);
  const mockSg = createMockOutput('sg-1');

  beforeEach(() => {
    jest.clearAllMocks();
    (pulumi.output as any) = jest.fn((value: any) => createMockOutput(value));
    (pulumi.all as any) = jest.fn((...args: any[]) => mockOutputAll(args.flat()));
    (pulumi.ComponentResource as any) = jest.fn(function (this: any) {
      this.registerOutputs = jest.fn();
    });
    (aws.ec2.getSubnet as any) = jest.fn().mockResolvedValue({ vpcId: 'vpc-1' });
    (aws.ec2.SecurityGroup as any) = jest.fn(() => ({ id: createMockOutput('sg-1') }));
    (aws.ec2.SecurityGroupRule as any) = jest.fn();
    (aws.ec2.LaunchTemplate as any) = jest.fn(() => ({
      id: createMockOutput('lt-1'),
      latestVersion: createMockOutput('1')
    }));
    (aws.eks.NodeGroup as any) = jest.fn((name) => ({ nodeGroupName: createMockOutput(name) }));
  });

  it("creates successfully", () => {
    const stack = new NodeGroupsStack('test', {
      environmentSuffix: 'dev',
      clusterName: mockClusterName,
      nodeRole: mockNodeRole,
      privateSubnetIds: mockSubnets,
      clusterSecurityGroup: mockSg,
      tags: {},
    });
    expect(stack).toBeDefined();
  });

  it("creates node security group", () => {
    new NodeGroupsStack('test', {
      environmentSuffix: 'dev',
      clusterName: mockClusterName,
      nodeRole: mockNodeRole,
      privateSubnetIds: mockSubnets,
      clusterSecurityGroup: mockSg,
      tags: {},
    });
    expect(aws.ec2.SecurityGroup).toHaveBeenCalledWith('eks-node-sg-dev', expect.any(Object), expect.any(Object));
  });

  it("creates 3 security group rules", () => {
    new NodeGroupsStack('test', {
      environmentSuffix: 'dev',
      clusterName: mockClusterName,
      nodeRole: mockNodeRole,
      privateSubnetIds: mockSubnets,
      clusterSecurityGroup: mockSg,
      tags: {},
    });
    expect(aws.ec2.SecurityGroupRule).toHaveBeenCalledTimes(3);
  });

  it("creates general launch template with encrypted gp3 volumes", () => {
    new NodeGroupsStack('test', {
      environmentSuffix: 'dev',
      clusterName: mockClusterName,
      nodeRole: mockNodeRole,
      privateSubnetIds: mockSubnets,
      clusterSecurityGroup: mockSg,
      tags: {},
    });
    expect(aws.ec2.LaunchTemplate).toHaveBeenCalledWith(
      'eks-general-lt-dev',
      expect.objectContaining({
        blockDeviceMappings: expect.arrayContaining([
          expect.objectContaining({
            deviceName: '/dev/xvda',
            ebs: expect.objectContaining({
              volumeSize: 100,
              volumeType: 'gp3',
              encrypted: 'true',
              deleteOnTermination: 'true',
            }),
          }),
        ]),
      }),
      expect.any(Object)
    );
  });

  it("creates compute launch template with encrypted gp3 volumes", () => {
    new NodeGroupsStack('test', {
      environmentSuffix: 'dev',
      clusterName: mockClusterName,
      nodeRole: mockNodeRole,
      privateSubnetIds: mockSubnets,
      clusterSecurityGroup: mockSg,
      tags: {},
    });
    expect(aws.ec2.LaunchTemplate).toHaveBeenCalledWith(
      'eks-compute-lt-dev',
      expect.objectContaining({
        blockDeviceMappings: expect.arrayContaining([
          expect.objectContaining({
            deviceName: '/dev/xvda',
            ebs: expect.objectContaining({
              volumeSize: 100,
              volumeType: 'gp3',
              encrypted: 'true',
            }),
          }),
        ]),
      }),
      expect.any(Object)
    );
  });

  it("enforces IMDSv2 in general launch template", () => {
    new NodeGroupsStack('test', {
      environmentSuffix: 'dev',
      clusterName: mockClusterName,
      nodeRole: mockNodeRole,
      privateSubnetIds: mockSubnets,
      clusterSecurityGroup: mockSg,
      tags: {},
    });
    expect(aws.ec2.LaunchTemplate).toHaveBeenCalledWith(
      'eks-general-lt-dev',
      expect.objectContaining({
        metadataOptions: expect.objectContaining({
          httpTokens: 'required',
          httpPutResponseHopLimit: 1,
          httpEndpoint: 'enabled',
        }),
      }),
      expect.any(Object)
    );
  });

  it("enforces IMDSv2 in compute launch template", () => {
    new NodeGroupsStack('test', {
      environmentSuffix: 'dev',
      clusterName: mockClusterName,
      nodeRole: mockNodeRole,
      privateSubnetIds: mockSubnets,
      clusterSecurityGroup: mockSg,
      tags: {},
    });
    expect(aws.ec2.LaunchTemplate).toHaveBeenCalledWith(
      'eks-compute-lt-dev',
      expect.objectContaining({
        metadataOptions: expect.objectContaining({
          httpTokens: 'required',
          httpPutResponseHopLimit: 1,
        }),
      }),
      expect.any(Object)
    );
  });

  it("creates 2 launch templates", () => {
    new NodeGroupsStack('test', {
      environmentSuffix: 'dev',
      clusterName: mockClusterName,
      nodeRole: mockNodeRole,
      privateSubnetIds: mockSubnets,
      clusterSecurityGroup: mockSg,
      tags: {},
    });
    expect(aws.ec2.LaunchTemplate).toHaveBeenCalledTimes(2);
  });

  it("creates general node group with t3.large and Bottlerocket AMI", () => {
    new NodeGroupsStack('test', {
      environmentSuffix: 'dev',
      clusterName: mockClusterName,
      nodeRole: mockNodeRole,
      privateSubnetIds: mockSubnets,
      clusterSecurityGroup: mockSg,
      tags: {},
    });
    expect(aws.eks.NodeGroup).toHaveBeenCalledWith(
      'eks-general-ng-dev',
      expect.objectContaining({
        instanceTypes: ['t3.large'],
        amiType: 'BOTTLEROCKET_x86_64',
      }),
      expect.any(Object)
    );
  });

  it("creates compute node group with c5.2xlarge and Bottlerocket AMI", () => {
    new NodeGroupsStack('test', {
      environmentSuffix: 'dev',
      clusterName: mockClusterName,
      nodeRole: mockNodeRole,
      privateSubnetIds: mockSubnets,
      clusterSecurityGroup: mockSg,
      tags: {},
    });
    expect(aws.eks.NodeGroup).toHaveBeenCalledWith(
      'eks-compute-ng-dev',
      expect.objectContaining({
        instanceTypes: ['c5.2xlarge'],
        amiType: 'BOTTLEROCKET_x86_64',
      }),
      expect.any(Object)
    );
  });

  it("general node group uses launch template", () => {
    new NodeGroupsStack('test', {
      environmentSuffix: 'dev',
      clusterName: mockClusterName,
      nodeRole: mockNodeRole,
      privateSubnetIds: mockSubnets,
      clusterSecurityGroup: mockSg,
      tags: {},
    });
    expect(aws.eks.NodeGroup).toHaveBeenCalledWith(
      'eks-general-ng-dev',
      expect.objectContaining({
        launchTemplate: expect.objectContaining({
          id: expect.any(Object),
          version: expect.any(Object),
        }),
      }),
      expect.any(Object)
    );
  });

  it("compute node group uses launch template", () => {
    new NodeGroupsStack('test', {
      environmentSuffix: 'dev',
      clusterName: mockClusterName,
      nodeRole: mockNodeRole,
      privateSubnetIds: mockSubnets,
      clusterSecurityGroup: mockSg,
      tags: {},
    });
    expect(aws.eks.NodeGroup).toHaveBeenCalledWith(
      'eks-compute-ng-dev',
      expect.objectContaining({
        launchTemplate: expect.objectContaining({
          id: expect.any(Object),
          version: expect.any(Object),
        }),
      }),
      expect.any(Object)
    );
  });

  it("exposes node group names", () => {
    const stack = new NodeGroupsStack('test', {
      environmentSuffix: 'dev',
      clusterName: mockClusterName,
      nodeRole: mockNodeRole,
      privateSubnetIds: mockSubnets,
      clusterSecurityGroup: mockSg,
      tags: {},
    });
    expect(stack.generalNodeGroupName).toBeDefined();
    expect(stack.computeNodeGroupName).toBeDefined();
  });
});

describe("CalicoStack", () => {
  const mockKubeconfig = createMockOutput({ apiVersion: 'v1' });
  const mockOidcProvider = createMockOutput('oidc');

  beforeEach(() => {
    jest.clearAllMocks();
    (pulumi.output as any) = jest.fn((value: any) => createMockOutput(value));
    (pulumi.ComponentResource as any) = jest.fn(function (this: any) {
      this.registerOutputs = jest.fn();
    });
    (k8s.Provider as any) = jest.fn();
    (k8s.helm.v3.Release as any) = jest.fn(() => ({ name: createMockOutput('calico') }));
  });

  it("creates successfully", () => {
    const stack = new CalicoStack('test', {
      environmentSuffix: 'dev',
      kubeconfig: mockKubeconfig,
      clusterOidcProvider: mockOidcProvider,
    });
    expect(stack).toBeDefined();
  });

  it("creates Kubernetes provider", () => {
    new CalicoStack('test', {
      environmentSuffix: 'dev',
      kubeconfig: mockKubeconfig,
      clusterOidcProvider: mockOidcProvider,
    });
    expect(k8s.Provider).toHaveBeenCalledWith('k8s-provider-calico-dev', expect.any(Object), expect.any(Object));
  });

  it("installs Calico Helm chart", () => {
    new CalicoStack('test', {
      environmentSuffix: 'dev',
      kubeconfig: mockKubeconfig,
      clusterOidcProvider: mockOidcProvider,
    });
    expect(k8s.helm.v3.Release).toHaveBeenCalledWith(
      'calico-dev',
      expect.objectContaining({ chart: 'tigera-operator', version: '3.26.4' }),
      expect.any(Object)
    );
  });

  it("configures EKS provider", () => {
    new CalicoStack('test', {
      environmentSuffix: 'dev',
      kubeconfig: mockKubeconfig,
      clusterOidcProvider: mockOidcProvider,
    });
    expect(k8s.helm.v3.Release).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        values: expect.objectContaining({
          installation: expect.objectContaining({ kubernetesProvider: 'EKS' }),
        }),
      }),
      expect.any(Object)
    );
  });

  it("exposes helm release", () => {
    const stack = new CalicoStack('test', {
      environmentSuffix: 'dev',
      kubeconfig: mockKubeconfig,
      clusterOidcProvider: mockOidcProvider,
    });
    expect(stack.helmRelease).toBeDefined();
  });
});

describe("ClusterAutoscalerStack", () => {
  const mockClusterName = createMockOutput('cluster');
  const mockKubeconfig = createMockOutput({ apiVersion: 'v1' });
  const mockOidcProviderArn = createMockOutput('arn:aws:iam::123456789012:oidc-provider/oidc');
  const mockOidcProviderUrl = createMockOutput('https://oidc.eks.amazonaws.com/id/EXAMPLE');
  const mockNodeGroupTags = createMockOutput({ 'k8s.io/cluster-autoscaler/enabled': 'true' } as { [key: string]: string });

  beforeEach(() => {
    jest.clearAllMocks();
    (pulumi.output as any) = jest.fn((value: any) => createMockOutput(value));
    (pulumi.all as any) = jest.fn((...args: any[]) => mockOutputAll(args.flat()));
    (pulumi.interpolate as any) = jest.fn((strings: any, ...values: any[]) => createMockOutput('interpolated-value'));
    (pulumi.ComponentResource as any) = jest.fn(function (this: any) {
      this.registerOutputs = jest.fn();
    });
    (aws.iam.Policy as any) = jest.fn(() => ({ arn: createMockOutput('policy-arn') }));
    (aws.iam.Role as any) = jest.fn(() => ({ arn: createMockOutput('role-arn'), name: createMockOutput('role-name') }));
    (aws.iam.RolePolicyAttachment as any) = jest.fn();
    (k8s.Provider as any) = jest.fn();
    (k8s.core.v1.ServiceAccount as any) = jest.fn(() => ({ metadata: { name: createMockOutput('sa') } }));
    (k8s.rbac.v1.ClusterRole as any) = jest.fn(() => ({ metadata: { name: createMockOutput('cr') } }));
    (k8s.rbac.v1.ClusterRoleBinding as any) = jest.fn();
    (k8s.apps.v1.Deployment as any) = jest.fn();
    (k8s.core.v1.ConfigMap as any) = jest.fn();
  });

  it("creates successfully", () => {
    const stack = new ClusterAutoscalerStack('test', {
      environmentSuffix: 'dev',
      clusterName: mockClusterName,
      kubeconfig: mockKubeconfig,
      oidcProviderArn: mockOidcProviderArn,
      oidcProviderUrl: mockOidcProviderUrl,
      region: 'us-east-1',
      kubernetesVersion: '1.28',
      nodeGroupTags: mockNodeGroupTags,
    });
    expect(stack).toBeDefined();
  });

  it("creates IAM policy", () => {
    new ClusterAutoscalerStack('test', {
      environmentSuffix: 'dev',
      clusterName: mockClusterName,
      kubeconfig: mockKubeconfig,
      oidcProviderArn: mockOidcProviderArn,
      oidcProviderUrl: mockOidcProviderUrl,
      region: 'us-east-1',
      kubernetesVersion: '1.28',
      nodeGroupTags: mockNodeGroupTags,
    });
    expect(aws.iam.Policy).toHaveBeenCalled();
  });

  it("creates IAM role", () => {
    new ClusterAutoscalerStack('test', {
      environmentSuffix: 'dev',
      clusterName: mockClusterName,
      kubeconfig: mockKubeconfig,
      oidcProviderArn: mockOidcProviderArn,
      oidcProviderUrl: mockOidcProviderUrl,
      region: 'us-east-1',
      kubernetesVersion: '1.28',
      nodeGroupTags: mockNodeGroupTags,
    });
    expect(aws.iam.Role).toHaveBeenCalled();
  });

  it("attaches policy to role", () => {
    new ClusterAutoscalerStack('test', {
      environmentSuffix: 'dev',
      clusterName: mockClusterName,
      kubeconfig: mockKubeconfig,
      oidcProviderArn: mockOidcProviderArn,
      oidcProviderUrl: mockOidcProviderUrl,
      region: 'us-east-1',
      kubernetesVersion: '1.28',
      nodeGroupTags: mockNodeGroupTags,
    });
    expect(aws.iam.RolePolicyAttachment).toHaveBeenCalled();
  });

  it("creates service account", () => {
    new ClusterAutoscalerStack('test', {
      environmentSuffix: 'dev',
      clusterName: mockClusterName,
      kubeconfig: mockKubeconfig,
      oidcProviderArn: mockOidcProviderArn,
      oidcProviderUrl: mockOidcProviderUrl,
      region: 'us-east-1',
      kubernetesVersion: '1.28',
      nodeGroupTags: mockNodeGroupTags,
    });
    expect(k8s.core.v1.ServiceAccount).toHaveBeenCalled();
  });

  it("creates cluster role", () => {
    new ClusterAutoscalerStack('test', {
      environmentSuffix: 'dev',
      clusterName: mockClusterName,
      kubeconfig: mockKubeconfig,
      oidcProviderArn: mockOidcProviderArn,
      oidcProviderUrl: mockOidcProviderUrl,
      region: 'us-east-1',
      kubernetesVersion: '1.28',
      nodeGroupTags: mockNodeGroupTags,
    });
    expect(k8s.rbac.v1.ClusterRole).toHaveBeenCalled();
  });

  it("creates deployment", () => {
    new ClusterAutoscalerStack('test', {
      environmentSuffix: 'dev',
      clusterName: mockClusterName,
      kubeconfig: mockKubeconfig,
      oidcProviderArn: mockOidcProviderArn,
      oidcProviderUrl: mockOidcProviderUrl,
      region: 'us-east-1',
      kubernetesVersion: '1.28',
      nodeGroupTags: mockNodeGroupTags,
    });
    expect(k8s.apps.v1.Deployment).toHaveBeenCalled();
  });

  it("creates config map", () => {
    new ClusterAutoscalerStack('test', {
      environmentSuffix: 'dev',
      clusterName: mockClusterName,
      kubeconfig: mockKubeconfig,
      oidcProviderArn: mockOidcProviderArn,
      oidcProviderUrl: mockOidcProviderUrl,
      region: 'us-east-1',
      kubernetesVersion: '1.28',
      nodeGroupTags: mockNodeGroupTags,
    });
    expect(k8s.core.v1.ConfigMap).toHaveBeenCalled();
  });

  it("exposes service account name", () => {
    const stack = new ClusterAutoscalerStack('test', {
      environmentSuffix: 'dev',
      clusterName: mockClusterName,
      kubeconfig: mockKubeconfig,
      oidcProviderArn: mockOidcProviderArn,
      oidcProviderUrl: mockOidcProviderUrl,
      region: 'us-east-1',
      kubernetesVersion: '1.28',
      nodeGroupTags: mockNodeGroupTags,
    });
    expect(stack.serviceAccountName).toBeDefined();
  });
});

describe("LoadBalancerControllerStack", () => {
  const mockClusterName = createMockOutput('cluster');
  const mockKubeconfig = createMockOutput({ apiVersion: 'v1' });
  const mockOidcProviderArn = createMockOutput('arn:aws:iam::123456789012:oidc-provider/oidc');
  const mockOidcProviderUrl = createMockOutput('https://oidc.eks.amazonaws.com/id/EXAMPLE');
  const mockVpcId = createMockOutput('vpc-12345');

  beforeEach(() => {
    jest.clearAllMocks();
    (pulumi.output as any) = jest.fn((value: any) => createMockOutput(value));
    (pulumi.all as any) = jest.fn((...args: any[]) => mockOutputAll(args.flat()));
    (pulumi.ComponentResource as any) = jest.fn(function (this: any) {
      this.registerOutputs = jest.fn();
    });
    (aws.iam.Policy as any) = jest.fn(() => ({ arn: createMockOutput('policy-arn') }));
    (aws.iam.Role as any) = jest.fn(() => ({ arn: createMockOutput('role-arn'), name: createMockOutput('role-name') }));
    (aws.iam.RolePolicyAttachment as any) = jest.fn();
    (k8s.Provider as any) = jest.fn();
    (k8s.helm.v3.Release as any) = jest.fn(() => ({ name: createMockOutput('lb-controller') }));
  });

  it("creates successfully", () => {
    const stack = new LoadBalancerControllerStack('test', {
      environmentSuffix: 'dev',
      clusterName: mockClusterName,
      kubeconfig: mockKubeconfig,
      oidcProviderArn: mockOidcProviderArn,
      oidcProviderUrl: mockOidcProviderUrl,
      vpcId: mockVpcId,
      region: 'us-east-1',
    });
    expect(stack).toBeDefined();
  });

  it("creates IAM policy", () => {
    new LoadBalancerControllerStack('test', {
      environmentSuffix: 'dev',
      clusterName: mockClusterName,
      kubeconfig: mockKubeconfig,
      oidcProviderArn: mockOidcProviderArn,
      oidcProviderUrl: mockOidcProviderUrl,
      vpcId: mockVpcId,
      region: 'us-east-1',
    });
    expect(aws.iam.Policy).toHaveBeenCalled();
  });

  it("creates IAM role", () => {
    new LoadBalancerControllerStack('test', {
      environmentSuffix: 'dev',
      clusterName: mockClusterName,
      kubeconfig: mockKubeconfig,
      oidcProviderArn: mockOidcProviderArn,
      oidcProviderUrl: mockOidcProviderUrl,
      vpcId: mockVpcId,
      region: 'us-east-1',
    });
    expect(aws.iam.Role).toHaveBeenCalled();
  });

  it("attaches policy to role", () => {
    new LoadBalancerControllerStack('test', {
      environmentSuffix: 'dev',
      clusterName: mockClusterName,
      kubeconfig: mockKubeconfig,
      oidcProviderArn: mockOidcProviderArn,
      oidcProviderUrl: mockOidcProviderUrl,
      vpcId: mockVpcId,
      region: 'us-east-1',
    });
    expect(aws.iam.RolePolicyAttachment).toHaveBeenCalled();
  });

  it("installs Helm chart", () => {
    new LoadBalancerControllerStack('test', {
      environmentSuffix: 'dev',
      clusterName: mockClusterName,
      kubeconfig: mockKubeconfig,
      oidcProviderArn: mockOidcProviderArn,
      oidcProviderUrl: mockOidcProviderUrl,
      vpcId: mockVpcId,
      region: 'us-east-1',
    });
    expect(k8s.helm.v3.Release).toHaveBeenCalled();
  });

  it("exposes service account name", () => {
    const stack = new LoadBalancerControllerStack('test', {
      environmentSuffix: 'dev',
      clusterName: mockClusterName,
      kubeconfig: mockKubeconfig,
      oidcProviderArn: mockOidcProviderArn,
      oidcProviderUrl: mockOidcProviderUrl,
      vpcId: mockVpcId,
      region: 'us-east-1',
    });
    expect(stack.serviceAccountName).toBeDefined();
  });
});

describe("NetworkPoliciesStack", () => {
  const mockKubeconfig = createMockOutput({ apiVersion: 'v1' });

  beforeEach(() => {
    jest.clearAllMocks();
    (pulumi.output as any) = jest.fn((value: any) => createMockOutput(value));
    (pulumi.ComponentResource as any) = jest.fn(function (this: any) {
      this.registerOutputs = jest.fn();
    });
    (k8s.Provider as any) = jest.fn();
    (k8s.core.v1.Namespace as any) = jest.fn(() => ({ metadata: { name: createMockOutput('applications') } }));
    (k8s.networking.v1.NetworkPolicy as any) = jest.fn();
  });

  it("creates successfully", () => {
    const stack = new NetworkPoliciesStack('test', {
      environmentSuffix: 'dev',
      kubeconfig: mockKubeconfig,
    });
    expect(stack).toBeDefined();
  });

  it("creates namespace", () => {
    new NetworkPoliciesStack('test', {
      environmentSuffix: 'dev',
      kubeconfig: mockKubeconfig,
    });
    expect(k8s.core.v1.Namespace).toHaveBeenCalled();
  });

  it("creates network policies", () => {
    new NetworkPoliciesStack('test', {
      environmentSuffix: 'dev',
      kubeconfig: mockKubeconfig,
    });
    expect(k8s.networking.v1.NetworkPolicy).toHaveBeenCalledTimes(3);
  });
});

describe("TapStack Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (pulumi.output as any) = jest.fn((value: any) => createMockOutput(value));
    (pulumi.all as any) = jest.fn((...args: any[]) => mockOutputAll(args.flat()));
    (pulumi.ComponentResource as any) = jest.fn(function (this: any) {
      this.registerOutputs = jest.fn();
    });
    (VpcStack as any) = jest.fn(() => ({
      vpcId: createMockOutput('vpc-1'),
      privateSubnetIds: createMockOutput(['subnet-1']),
      publicSubnetIds: createMockOutput(['subnet-2']),
    }));
    (EksClusterStack as any) = jest.fn(() => ({
      clusterName: createMockOutput('cluster'),
      clusterEndpoint: createMockOutput('https://eks'),
      clusterSecurityGroup: createMockOutput('sg-1'),
      oidcProviderArn: createMockOutput('oidc-arn'),
      oidcProvider: createMockOutput('oidc'),
      oidcProviderUrl: createMockOutput('https://oidc'),
      kubeconfig: createMockOutput({ apiVersion: 'v1' }),
      nodeRole: createMockOutput({ arn: createMockOutput('arn') }),
    }));
    (NodeGroupsStack as any) = jest.fn(() => ({
      generalNodeGroupName: createMockOutput('general'),
      computeNodeGroupName: createMockOutput('compute'),
      nodeGroupTags: createMockOutput({ tag: 'value' }),
    }));
    (CalicoStack as any) = jest.fn();
    (ClusterAutoscalerStack as any) = jest.fn();
    (LoadBalancerControllerStack as any) = jest.fn();
    (NetworkPoliciesStack as any) = jest.fn();
  });

  it("creates successfully with defaults", () => {
    const stack = new TapStack('test', {});
    expect(stack).toBeDefined();
  });

  it("uses default environmentSuffix", () => {
    new TapStack('test', {});
    expect(VpcStack).toHaveBeenCalledWith('eks-vpc', expect.objectContaining({ environmentSuffix: 'dev' }), expect.any(Object));
  });

  it("uses custom values", () => {
    new TapStack('test', { environmentSuffix: 'prod', region: 'eu-west-1', kubernetesVersion: '1.29' });
    expect(VpcStack).toHaveBeenCalledWith(
      'eks-vpc',
      expect.objectContaining({ environmentSuffix: 'prod', region: 'eu-west-1' }),
      expect.any(Object)
    );
    expect(EksClusterStack).toHaveBeenCalledWith(
      'eks-cluster',
      expect.objectContaining({ kubernetesVersion: '1.29' }),
      expect.any(Object)
    );
  });

  it("merges tags correctly", () => {
    new TapStack('test', { tags: { Custom: 'Value' } });
    expect(VpcStack).toHaveBeenCalledWith(
      'eks-vpc',
      expect.objectContaining({
        tags: expect.objectContaining({ Environment: 'Production', Custom: 'Value' }),
      }),
      expect.any(Object)
    );
  });

  it("creates all 7 child stacks", () => {
    new TapStack('test', {});
    expect(VpcStack).toHaveBeenCalledTimes(1);
    expect(EksClusterStack).toHaveBeenCalledTimes(1);
    expect(NodeGroupsStack).toHaveBeenCalledTimes(1);
    expect(CalicoStack).toHaveBeenCalledTimes(1);
    expect(ClusterAutoscalerStack).toHaveBeenCalledTimes(1);
    expect(LoadBalancerControllerStack).toHaveBeenCalledTimes(1);
    expect(NetworkPoliciesStack).toHaveBeenCalledTimes(1);
  });

  it("exposes all outputs", () => {
    const stack = new TapStack('test', {});
    expect(stack.vpcId).toBeDefined();
    expect(stack.clusterName).toBeDefined();
    expect(stack.clusterEndpoint).toBeDefined();
    expect(stack.clusterSecurityGroup).toBeDefined();
    expect(stack.oidcProviderArn).toBeDefined();
  });

  it("registers outputs", () => {
    const stack = new TapStack('test', {});
    expect((stack as any).registerOutputs).toHaveBeenCalledWith(
      expect.objectContaining({
        vpcId: expect.any(Object),
        clusterName: expect.any(Object),
        clusterEndpoint: expect.any(Object),
        generalNodeGroupName: expect.any(Object),
        computeNodeGroupName: expect.any(Object),
      })
    );
  });
});