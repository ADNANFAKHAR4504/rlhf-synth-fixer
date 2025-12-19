/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource for production EKS cluster deployment
 * with advanced security and networking configurations.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { VpcStack } from './vpc-stack';
import { EksClusterStack } from './eks-cluster-stack';
import { NodeGroupsStack } from './node-groups-stack';
import { CalicoStack } from './calico-stack';
import { ClusterAutoscalerStack } from './cluster-autoscaler-stack';
import { LoadBalancerControllerStack } from './load-balancer-controller-stack';
import { NetworkPoliciesStack } from './network-policies-stack';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;

  /**
   * AWS region for deployment
   */
  region?: string;

  /**
   * Kubernetes version for EKS cluster
   */
  kubernetesVersion?: string;
}

/**
 * Main TapStack component for production EKS cluster
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly clusterName: pulumi.Output<string>;
  public readonly clusterEndpoint: pulumi.Output<string>;
  public readonly clusterSecurityGroup: pulumi.Output<string>;
  public readonly oidcProviderArn: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const region = args.region || 'us-east-1';
    const kubernetesVersion = args.kubernetesVersion || '1.28';
    const tags = {
      Environment: 'Production',
      ManagedBy: 'Pulumi',
      CostCenter: 'Engineering',
      ...args.tags,
    };

    // 1. Create VPC with public and private subnets
    const vpcStack = new VpcStack(
      'eks-vpc',
      {
        environmentSuffix,
        region,
        tags,
      },
      { parent: this }
    );

    // 2. Create EKS cluster with OIDC provider
    const eksCluster = new EksClusterStack(
      'eks-cluster',
      {
        environmentSuffix,
        kubernetesVersion,
        vpcId: vpcStack.vpcId,
        privateSubnetIds: vpcStack.privateSubnetIds,
        publicSubnetIds: vpcStack.publicSubnetIds,
        tags,
      },
      { parent: this }
    );

    // 3. Create managed node groups with custom launch templates
    const nodeGroups = new NodeGroupsStack(
      'eks-node-groups',
      {
        environmentSuffix,
        clusterName: eksCluster.clusterName,
        nodeRole: eksCluster.nodeRole,
        privateSubnetIds: vpcStack.privateSubnetIds,
        clusterSecurityGroup: eksCluster.clusterSecurityGroup,
        tags,
      },
      { parent: this }
    );

    // 4. Install Calico CNI plugin
    const calicoStack = new CalicoStack(
      'calico-cni',
      {
        environmentSuffix,
        kubeconfig: eksCluster.kubeconfig,
        clusterOidcProvider: eksCluster.oidcProvider,
      },
      { parent: this }
    );

    // 5. Deploy cluster autoscaler
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _autoscalerStack = new ClusterAutoscalerStack(
      'cluster-autoscaler',
      {
        environmentSuffix,
        clusterName: eksCluster.clusterName,
        kubeconfig: eksCluster.kubeconfig,
        oidcProviderArn: eksCluster.oidcProviderArn,
        oidcProviderUrl: eksCluster.oidcProviderUrl,
        region,
        kubernetesVersion,
        nodeGroupTags: nodeGroups.nodeGroupTags,
      },
      { parent: this, dependsOn: [calicoStack] }
    );

    // 6. Deploy AWS Load Balancer Controller
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _lbControllerStack = new LoadBalancerControllerStack(
      'lb-controller',
      {
        environmentSuffix,
        clusterName: eksCluster.clusterName,
        kubeconfig: eksCluster.kubeconfig,
        oidcProviderArn: eksCluster.oidcProviderArn,
        oidcProviderUrl: eksCluster.oidcProviderUrl,
        vpcId: vpcStack.vpcId,
        region,
      },
      { parent: this, dependsOn: [calicoStack] }
    );

    // 7. Create network policies for pod isolation
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _networkPolicies = new NetworkPoliciesStack(
      'network-policies',
      {
        environmentSuffix,
        kubeconfig: eksCluster.kubeconfig,
      },
      { parent: this, dependsOn: [calicoStack] }
    );

    // Export outputs
    this.vpcId = vpcStack.vpcId;
    this.clusterName = eksCluster.clusterName;
    this.clusterEndpoint = eksCluster.clusterEndpoint;
    this.clusterSecurityGroup = eksCluster.clusterSecurityGroup;
    this.oidcProviderArn = eksCluster.oidcProviderArn;

    this.registerOutputs({
      vpcId: this.vpcId,
      clusterName: this.clusterName,
      clusterEndpoint: this.clusterEndpoint,
      clusterSecurityGroup: this.clusterSecurityGroup,
      oidcProviderArn: this.oidcProviderArn,
      generalNodeGroupName: nodeGroups.generalNodeGroupName,
      computeNodeGroupName: nodeGroups.computeNodeGroupName,
    });
  }
}
