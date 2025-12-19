/**
 * tap-stack.ts
 *
 * Main TapStack component that orchestrates EKS cluster deployment
 * with advanced container orchestration features
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { EksAddonsStack } from './eks-addons-stack';
import { ClusterAutoscalerStack } from './eks-cluster-autoscaler-stack';
import { EksClusterStack } from './eks-cluster-stack';
import { CoreDnsOptimizationStack } from './eks-coredns-optimization-stack';
import { IrsaDemoStack } from './eks-irsa-demo-stack';
import { LoadBalancerControllerStack } from './eks-load-balancer-controller-stack';
import { NetworkPoliciesStack } from './eks-network-policies-stack';
import { RbacNamespacesStack } from './eks-rbac-namespaces-stack';
import { SpotInterruptionStack } from './eks-spot-interruption-stack';
import { VpcStack } from './vpc-stack';

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
   * AWS region for deployment
   * Defaults to 'us-east-2' if not provided.
   */
  region?: string;

  /**
   * EKS cluster version
   * Defaults to '1.28' if not provided.
   */
  clusterVersion?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Main TapStack component for EKS cluster with advanced features
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly clusterName: pulumi.Output<string>;
  public readonly clusterEndpoint: pulumi.Output<string>;
  public readonly oidcProviderArn: pulumi.Output<string>;
  public readonly kubeconfig: pulumi.Output<any>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const region = args.region || 'us-east-2';
    const clusterVersion = args.clusterVersion || '1.28';
    const tags = args.tags || {
      ManagedBy: 'Pulumi',
      Project: 'TAP',
    };

    // 1. Create VPC with public and private subnets
    const vpcStack = new VpcStack(
      'vpc-stack',
      {
        environmentSuffix,
        region,
        tags,
      },
      { parent: this }
    );

    // 2. Create EKS cluster with OIDC provider
    const eksClusterStack = new EksClusterStack(
      'eks-cluster-stack',
      {
        environmentSuffix,
        region,
        vpcId: vpcStack.vpcId,
        privateSubnetIds: vpcStack.privateSubnetIds,
        publicSubnetIds: vpcStack.publicSubnetIds,
        version: clusterVersion,
        tags,
      },
      { parent: this, dependsOn: [vpcStack] }
    );

    // Note: Using default node group from EKS cluster for compute capacity

    // 4. Install EKS add-ons (EBS CSI driver with encryption)
    void new EksAddonsStack(
      'eks-addons-stack',
      {
        environmentSuffix,
        cluster: eksClusterStack.cluster,
        oidcProviderArn: eksClusterStack.oidcProviderArn,
        oidcProviderUrl: eksClusterStack.oidcProviderUrl,
        tags,
      },
      { parent: this, dependsOn: [eksClusterStack] }
    );

    // 5. Install AWS Load Balancer Controller with IRSA
    void new LoadBalancerControllerStack(
      'lb-controller-stack',
      {
        environmentSuffix,
        cluster: eksClusterStack.cluster,
        oidcProviderArn: eksClusterStack.oidcProviderArn,
        oidcProviderUrl: eksClusterStack.oidcProviderUrl,
        vpcId: vpcStack.vpcId,
        region,
        tags,
      },
      { parent: this, dependsOn: [eksClusterStack] }
    );

    // 6. Install Cluster Autoscaler with pod disruption budgets
    void new ClusterAutoscalerStack(
      'cluster-autoscaler-stack',
      {
        environmentSuffix,
        cluster: eksClusterStack.cluster,
        oidcProviderArn: eksClusterStack.oidcProviderArn,
        oidcProviderUrl: eksClusterStack.oidcProviderUrl,
        region,
        tags,
      },
      { parent: this, dependsOn: [eksClusterStack] }
    );

    // 7. Create RBAC and namespaces with pod security standards
    const rbacNamespacesStack = new RbacNamespacesStack(
      'rbac-namespaces-stack',
      {
        environmentSuffix,
        cluster: eksClusterStack.cluster,
      },
      { parent: this, dependsOn: [eksClusterStack] }
    );

    // 8. Create network policies for namespace isolation
    void new NetworkPoliciesStack(
      'network-policies-stack',
      {
        environmentSuffix,
        cluster: eksClusterStack.cluster,
        devNamespace: rbacNamespacesStack.devNamespace,
        prodNamespace: rbacNamespacesStack.prodNamespace,
      },
      { parent: this, dependsOn: [rbacNamespacesStack] }
    );

    // 9. Optimize CoreDNS with node-local cache
    void new CoreDnsOptimizationStack(
      'coredns-optimization-stack',
      {
        environmentSuffix,
        cluster: eksClusterStack.cluster,
      },
      { parent: this, dependsOn: [eksClusterStack] }
    );

    // 10. Create IRSA demonstration
    void new IrsaDemoStack(
      'irsa-demo-stack',
      {
        environmentSuffix,
        cluster: eksClusterStack.cluster,
        oidcProviderArn: eksClusterStack.oidcProviderArn,
        oidcProviderUrl: eksClusterStack.oidcProviderUrl,
        region,
        tags,
      },
      { parent: this, dependsOn: [rbacNamespacesStack] }
    );

    // 11. Install spot instance interruption handler
    void new SpotInterruptionStack(
      'spot-interruption-stack',
      {
        environmentSuffix,
        cluster: eksClusterStack.cluster,
      },
      { parent: this, dependsOn: [eksClusterStack, rbacNamespacesStack] }
    );

    // Expose outputs
    this.vpcId = vpcStack.vpcId;
    this.clusterName = eksClusterStack.clusterName;
    this.clusterEndpoint = eksClusterStack.clusterEndpoint;
    this.oidcProviderArn = eksClusterStack.oidcProviderArn;
    this.kubeconfig = eksClusterStack.kubeconfig;

    this.registerOutputs({
      vpcId: this.vpcId,
      clusterName: this.clusterName,
      clusterEndpoint: this.clusterEndpoint,
      oidcProviderArn: this.oidcProviderArn,
      kubeconfig: this.kubeconfig,
    });
  }
}
