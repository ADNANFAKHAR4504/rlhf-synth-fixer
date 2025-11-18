/**
 * EKS Cluster Stack
 * Creates EKS cluster with OIDC provider and private endpoint access
 */
import * as eks from '@pulumi/eks';
import * as pulumi from '@pulumi/pulumi';

export interface EksClusterStackArgs {
  environmentSuffix: string;
  region: string;
  vpcId: pulumi.Input<string>;
  privateSubnetIds: pulumi.Input<string[]>;
  publicSubnetIds: pulumi.Input<string[]>;
  version?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class EksClusterStack extends pulumi.ComponentResource {
  public readonly cluster: eks.Cluster;
  public readonly kubeconfig: pulumi.Output<any>;
  public readonly clusterName: pulumi.Output<string>;
  public readonly oidcProviderArn: pulumi.Output<string>;
  public readonly oidcProviderUrl: pulumi.Output<string>;
  public readonly clusterEndpoint: pulumi.Output<string>;

  constructor(
    name: string,
    args: EksClusterStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:eks:EksClusterStack', name, args, opts);

    const clusterName = `eks-cluster-${args.environmentSuffix}`;

    // Create EKS cluster with private endpoint access
    this.cluster = new eks.Cluster(
      clusterName,
      {
        name: clusterName,
        version: args.version || '1.28',
        vpcId: args.vpcId,
        privateSubnetIds: args.privateSubnetIds,
        publicSubnetIds: args.publicSubnetIds,
        instanceType: 't3.medium',
        desiredCapacity: 2,
        minSize: 1,
        maxSize: 4,
        // Enable private endpoint access
        endpointPrivateAccess: true,
        endpointPublicAccess: true,
        // Create OIDC provider for IRSA
        createOidcProvider: true,
        // Use default node group for compute capacity
        skipDefaultNodeGroup: false,
        tags: {
          Name: clusterName,
          Environment: args.environmentSuffix,
          ...args.tags,
        },
      },
      { parent: this }
    );

    this.kubeconfig = this.cluster.kubeconfig;
    this.clusterName = this.cluster.eksCluster.name;
    this.clusterEndpoint = this.cluster.eksCluster.endpoint;

    // Get OIDC provider details
    this.oidcProviderArn = this.cluster.core.oidcProvider!.apply(
      provider => provider!.arn
    );
    this.oidcProviderUrl = this.cluster.core.oidcProvider!.apply(
      provider => provider!.url
    );

    this.registerOutputs({
      clusterName: this.clusterName,
      kubeconfig: this.kubeconfig,
      oidcProviderArn: this.oidcProviderArn,
      oidcProviderUrl: this.oidcProviderUrl,
      clusterEndpoint: this.clusterEndpoint,
    });
  }
}
