/**
 * EKS Cluster Stack - Creates EKS cluster with OIDC provider and control plane logging
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface EksClusterStackArgs {
  environmentSuffix: string;
  kubernetesVersion: string;
  vpcId: pulumi.Output<string>;
  privateSubnetIds: pulumi.Output<string[]>;
  publicSubnetIds: pulumi.Output<string[]>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class EksClusterStack extends pulumi.ComponentResource {
  public readonly clusterName: pulumi.Output<string>;
  public readonly clusterEndpoint: pulumi.Output<string>;
  public readonly clusterSecurityGroup: pulumi.Output<string>;
  public readonly oidcProvider: pulumi.Output<string>;
  public readonly oidcProviderArn: pulumi.Output<string>;
  public readonly oidcProviderUrl: pulumi.Output<string>;
  public readonly kubeconfig: pulumi.Output<any>;
  public readonly nodeRole: pulumi.Output<aws.iam.Role>;

  constructor(
    name: string,
    args: EksClusterStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:eks:EksClusterStack', name, args, opts);

    const {
      environmentSuffix,
      kubernetesVersion,
      vpcId,
      privateSubnetIds,
      publicSubnetIds,
      tags,
    } = args;

    // Create IAM role for EKS cluster
    const clusterRole = new aws.iam.Role(
      `eks-cluster-role-${environmentSuffix}`,
      {
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'eks.amazonaws.com',
        }),
        tags: tags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `eks-cluster-policy-${environmentSuffix}`,
      {
        role: clusterRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `eks-vpc-policy-${environmentSuffix}`,
      {
        role: clusterRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKSVPCResourceController',
      },
      { parent: this }
    );

    // Create security group for cluster
    const clusterSecurityGroup = new aws.ec2.SecurityGroup(
      `eks-cluster-sg-${environmentSuffix}`,
      {
        vpcId: vpcId,
        description: 'EKS cluster security group',
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `eks-cluster-sg-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Create EKS cluster with control plane logging
    const clusterNameValue = `eks-cluster-${environmentSuffix}`;
    const cluster = new aws.eks.Cluster(
      `eks-cluster-${environmentSuffix}`,
      {
        name: clusterNameValue,
        version: kubernetesVersion,
        roleArn: clusterRole.arn,
        vpcConfig: {
          subnetIds: pulumi
            .all([privateSubnetIds, publicSubnetIds])
            .apply(([priv, pub]) => [...priv, ...pub]),
          endpointPrivateAccess: true,
          endpointPublicAccess: true,
          securityGroupIds: [clusterSecurityGroup.id],
        },
        enabledClusterLogTypes: ['api', 'audit', 'authenticator'],
        tags: tags,
      },
      { parent: this }
    );

    // Create OIDC provider for IRSA
    const oidcProvider = new aws.iam.OpenIdConnectProvider(
      `eks-oidc-provider-${environmentSuffix}`,
      {
        url: cluster.identities[0].oidcs[0].issuer,
        clientIdLists: ['sts.amazonaws.com'],
        thumbprintLists: ['9e99a48a9960b14926bb7f3b02e22da2b0ab7280'],
      },
      { parent: this }
    );

    // Create IAM role for node groups
    const nodeRole = new aws.iam.Role(
      `eks-node-role-${environmentSuffix}`,
      {
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'ec2.amazonaws.com',
        }),
        tags: tags,
      },
      { parent: this }
    );

    const nodePolicies = [
      'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy',
      'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy',
      'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
      'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    ];

    nodePolicies.forEach((policyArn, i) => {
      new aws.iam.RolePolicyAttachment(
        `eks-node-policy-${i}-${environmentSuffix}`,
        {
          role: nodeRole.name,
          policyArn: policyArn,
        },
        { parent: this }
      );
    });

    // Configure pod security policy
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _podSecurityConfig = new aws.eks.Addon(
      `eks-pod-identity-${environmentSuffix}`,
      {
        clusterName: cluster.name,
        addonName: 'eks-pod-identity-agent',
        resolveConflictsOnCreate: 'OVERWRITE',
        resolveConflictsOnUpdate: 'OVERWRITE',
      },
      { parent: this }
    );

    // Create kubeconfig
    const kubeconfig = pulumi
      .all([cluster.name, cluster.endpoint, cluster.certificateAuthority])
      .apply(([name, endpoint, ca]) => {
        return {
          apiVersion: 'v1',
          clusters: [
            {
              cluster: {
                server: endpoint,
                'certificate-authority-data': ca.data,
              },
              name: 'kubernetes',
            },
          ],
          contexts: [
            {
              context: {
                cluster: 'kubernetes',
                user: 'aws',
              },
              name: 'aws',
            },
          ],
          'current-context': 'aws',
          kind: 'Config',
          users: [
            {
              name: 'aws',
              user: {
                exec: {
                  apiVersion: 'client.authentication.k8s.io/v1beta1',
                  command: 'aws',
                  args: ['eks', 'get-token', '--cluster-name', name],
                },
              },
            },
          ],
        };
      });

    this.clusterName = cluster.name;
    this.clusterEndpoint = cluster.endpoint;
    this.clusterSecurityGroup = clusterSecurityGroup.id;
    this.oidcProvider = cluster.identities[0].oidcs[0].issuer;
    this.oidcProviderArn = oidcProvider.arn;
    this.oidcProviderUrl = cluster.identities[0].oidcs[0].issuer;
    this.kubeconfig = kubeconfig;
    this.nodeRole = pulumi.output(nodeRole);

    this.registerOutputs({
      clusterName: this.clusterName,
      clusterEndpoint: this.clusterEndpoint,
      oidcProviderArn: this.oidcProviderArn,
    });
  }
}
