/**
 * Production-Ready EKS Cluster for Microservices
 *
 * This stack deploys a complete EKS cluster with:
 * - VPC with public and private subnets
 * - EKS cluster v1.28+ with OIDC provider
 * - Two managed node groups (general and compute-intensive)
 * - IAM roles with IRSA for cluster autoscaler
 * - All control plane logs enabled
 * - Essential EKS add-ons
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export interface KubeconfigType {
  apiVersion: string;
  clusters: Array<{
    cluster: {
      server: string;
      'certificate-authority-data': string;
    };
    name: string;
  }>;
  contexts: Array<{
    context: {
      cluster: string;
      user: string;
    };
    name: string;
  }>;
  'current-context': string;
  kind: string;
  users: Array<{
    name: string;
    user: {
      exec: {
        apiVersion: string;
        command: string;
        args: string[];
      };
    };
  }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly clusterName: pulumi.Output<string>;
  public readonly clusterEndpoint: pulumi.Output<string>;
  public readonly clusterOidcProviderUrl: pulumi.Output<string>;
  public readonly clusterOidcProviderArn: pulumi.Output<string>;
  public readonly kubeconfig: pulumi.Output<KubeconfigType>;
  public readonly generalNodeGroupName: pulumi.Output<string>;
  public readonly computeNodeGroupName: pulumi.Output<string>;
  public readonly clusterAutoscalerRoleArn: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const defaultTags = pulumi.output(args.tags || {}).apply(t => ({
      ...t,
      Environment: 'production',
      Team: 'platform',
      CostCenter: 'engineering',
    }));

    // ==================== VPC Configuration ====================

    // Create VPC for EKS cluster
    const vpc = new aws.ec2.Vpc(
      `eks-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: defaultTags.apply(t => ({
          ...t,
          Name: `eks-vpc-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Get availability zones
    const availabilityZones = aws.getAvailabilityZonesOutput({
      state: 'available',
    });

    // Create Internet Gateway
    const internetGateway = new aws.ec2.InternetGateway(
      `eks-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: defaultTags.apply(t => ({
          ...t,
          Name: `eks-igw-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Create public subnets (for NAT Gateways and Load Balancers)
    const publicSubnets: aws.ec2.Subnet[] = [];
    const publicSubnetIds: pulumi.Output<string>[] = [];

    for (let i = 0; i < 3; i++) {
      const publicSubnet = new aws.ec2.Subnet(
        `eks-public-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i}.0/24`,
          availabilityZone: availabilityZones.names[i],
          mapPublicIpOnLaunch: true,
          tags: defaultTags.apply(t => ({
            ...t,
            Name: `eks-public-subnet-${i}-${environmentSuffix}`,
            'kubernetes.io/role/elb': '1',
          })),
        },
        { parent: this }
      );

      publicSubnets.push(publicSubnet);
      publicSubnetIds.push(publicSubnet.id);
    }

    // Create public route table
    const publicRouteTable = new aws.ec2.RouteTable(
      `eks-public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: defaultTags.apply(t => ({
          ...t,
          Name: `eks-public-rt-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Create route to Internet Gateway
    new aws.ec2.Route(
      `eks-public-route-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: internetGateway.id,
      },
      { parent: this }
    );

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `eks-public-rta-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Allocate Elastic IPs for NAT Gateways
    const eips: aws.ec2.Eip[] = [];
    for (let i = 0; i < 3; i++) {
      const eip = new aws.ec2.Eip(
        `eks-nat-eip-${i}-${environmentSuffix}`,
        {
          domain: 'vpc',
          tags: defaultTags.apply(t => ({
            ...t,
            Name: `eks-nat-eip-${i}-${environmentSuffix}`,
          })),
        },
        { parent: this, dependsOn: [internetGateway] }
      );

      eips.push(eip);
    }

    // Create NAT Gateways in public subnets
    const natGateways: aws.ec2.NatGateway[] = [];
    for (let i = 0; i < 3; i++) {
      const natGateway = new aws.ec2.NatGateway(
        `eks-nat-${i}-${environmentSuffix}`,
        {
          subnetId: publicSubnets[i].id,
          allocationId: eips[i].id,
          tags: defaultTags.apply(t => ({
            ...t,
            Name: `eks-nat-${i}-${environmentSuffix}`,
          })),
        },
        { parent: this, dependsOn: [internetGateway] }
      );

      natGateways.push(natGateway);
    }

    // Create private subnets (for EKS worker nodes)
    const privateSubnets: aws.ec2.Subnet[] = [];
    const privateSubnetIds: pulumi.Output<string>[] = [];

    for (let i = 0; i < 3; i++) {
      const privateSubnet = new aws.ec2.Subnet(
        `eks-private-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i + 10}.0/24`,
          availabilityZone: availabilityZones.names[i],
          mapPublicIpOnLaunch: false,
          tags: defaultTags.apply(t => ({
            ...t,
            Name: `eks-private-subnet-${i}-${environmentSuffix}`,
            'kubernetes.io/role/internal-elb': '1',
          })),
        },
        { parent: this }
      );

      privateSubnets.push(privateSubnet);
      privateSubnetIds.push(privateSubnet.id);
    }

    // Create private route tables (one per AZ for HA)
    privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new aws.ec2.RouteTable(
        `eks-private-rt-${i}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          tags: defaultTags.apply(t => ({
            ...t,
            Name: `eks-private-rt-${i}-${environmentSuffix}`,
          })),
        },
        { parent: this }
      );

      // Route to NAT Gateway
      new aws.ec2.Route(
        `eks-private-route-${i}-${environmentSuffix}`,
        {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: natGateways[i].id,
        },
        { parent: this }
      );

      // Associate private subnet with route table
      new aws.ec2.RouteTableAssociation(
        `eks-private-rta-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    });

    // ==================== IAM Roles ====================

    // EKS Cluster Role
    const clusterRole = new aws.iam.Role(
      `eks-cluster-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'eks.amazonaws.com',
              },
            },
          ],
        }),
        tags: defaultTags,
      },
      { parent: this }
    );

    // Attach required policies to cluster role
    new aws.iam.RolePolicyAttachment(
      `eks-cluster-policy-${environmentSuffix}`,
      {
        role: clusterRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `eks-vpc-resource-policy-${environmentSuffix}`,
      {
        role: clusterRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKSVPCResourceController',
      },
      { parent: this }
    );

    // Node Group IAM Role
    const nodeRole = new aws.iam.Role(
      `eks-node-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            },
          ],
        }),
        tags: defaultTags,
      },
      { parent: this }
    );

    // Attach required policies to node role
    new aws.iam.RolePolicyAttachment(
      `eks-worker-node-policy-${environmentSuffix}`,
      {
        role: nodeRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `eks-cni-policy-${environmentSuffix}`,
      {
        role: nodeRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `eks-container-registry-policy-${environmentSuffix}`,
      {
        role: nodeRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
      },
      { parent: this }
    );

    // ==================== Security Groups ====================

    // Cluster security group
    const clusterSecurityGroup = new aws.ec2.SecurityGroup(
      `eks-cluster-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for EKS cluster control plane',
        tags: defaultTags.apply(t => ({
          ...t,
          Name: `eks-cluster-sg-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Allow cluster to communicate with nodes
    new aws.ec2.SecurityGroupRule(
      `eks-cluster-ingress-node-https-${environmentSuffix}`,
      {
        type: 'ingress',
        fromPort: 443,
        toPort: 443,
        protocol: 'tcp',
        securityGroupId: clusterSecurityGroup.id,
        sourceSecurityGroupId: clusterSecurityGroup.id,
        description: 'Allow pods to communicate with cluster API server',
      },
      { parent: this }
    );

    // Node security group
    const nodeSecurityGroup = new aws.ec2.SecurityGroup(
      `eks-node-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for EKS worker nodes',
        tags: defaultTags.apply(t => ({
          ...t,
          Name: `eks-node-sg-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Allow nodes to communicate with each other
    new aws.ec2.SecurityGroupRule(
      `eks-node-ingress-self-${environmentSuffix}`,
      {
        type: 'ingress',
        fromPort: 0,
        toPort: 65535,
        protocol: '-1',
        securityGroupId: nodeSecurityGroup.id,
        sourceSecurityGroupId: nodeSecurityGroup.id,
        description: 'Allow nodes to communicate with each other',
      },
      { parent: this }
    );

    // Allow nodes to communicate with cluster API
    new aws.ec2.SecurityGroupRule(
      `eks-node-ingress-cluster-${environmentSuffix}`,
      {
        type: 'ingress',
        fromPort: 443,
        toPort: 443,
        protocol: 'tcp',
        securityGroupId: nodeSecurityGroup.id,
        sourceSecurityGroupId: clusterSecurityGroup.id,
        description:
          'Allow worker nodes to communicate with cluster API server',
      },
      { parent: this }
    );

    // Allow pods running on nodes to receive communication from cluster control plane
    new aws.ec2.SecurityGroupRule(
      `eks-node-ingress-cluster-kubelet-${environmentSuffix}`,
      {
        type: 'ingress',
        fromPort: 1025,
        toPort: 65535,
        protocol: 'tcp',
        securityGroupId: nodeSecurityGroup.id,
        sourceSecurityGroupId: clusterSecurityGroup.id,
        description:
          'Allow cluster control plane to communicate with worker kubelet and pods',
      },
      { parent: this }
    );

    // Allow all outbound traffic from nodes
    new aws.ec2.SecurityGroupRule(
      `eks-node-egress-all-${environmentSuffix}`,
      {
        type: 'egress',
        fromPort: 0,
        toPort: 0,
        protocol: '-1',
        securityGroupId: nodeSecurityGroup.id,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow all outbound traffic',
      },
      { parent: this }
    );

    // ==================== CloudWatch Log Group ====================

    const clusterLogGroup = new aws.cloudwatch.LogGroup(
      `/aws/eks/cluster-${environmentSuffix}/logs`,
      {
        retentionInDays: 30,
        tags: defaultTags,
      },
      { parent: this }
    );

    // ==================== EKS Cluster ====================

    const cluster = new aws.eks.Cluster(
      `eks-cluster-${environmentSuffix}`,
      {
        name: `eks-cluster-${environmentSuffix}`,
        version: '1.28',
        roleArn: clusterRole.arn,
        vpcConfig: {
          subnetIds: pulumi.all([...privateSubnetIds, ...publicSubnetIds]),
          endpointPrivateAccess: true,
          endpointPublicAccess: false,
          securityGroupIds: [clusterSecurityGroup.id],
        },
        enabledClusterLogTypes: [
          'api',
          'audit',
          'authenticator',
          'controllerManager',
          'scheduler',
        ],
        tags: defaultTags,
      },
      { parent: this, dependsOn: [clusterLogGroup, clusterRole] }
    );

    // ==================== OIDC Provider ====================

    const oidcProvider = new aws.iam.OpenIdConnectProvider(
      `eks-oidc-provider-${environmentSuffix}`,
      {
        clientIdLists: ['sts.amazonaws.com'],
        thumbprintLists: ['9e99a48a9960b14926bb7f3b02e22da2b0ab7280'],
        url: cluster.identities[0].oidcs[0].issuer,
        tags: defaultTags,
      },
      { parent: this, dependsOn: [cluster] }
    );

    // ==================== Cluster Autoscaler IAM Role (IRSA) ====================

    const clusterAutoscalerRole = new aws.iam.Role(
      `eks-cluster-autoscaler-role-${environmentSuffix}`,
      {
        assumeRolePolicy: pulumi
          .all([cluster.identities[0].oidcs[0].issuer, oidcProvider.arn])
          .apply(([issuer, arn]) => {
            const issuerHostname = issuer.replace('https://', '');
            return JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: {
                    Federated: arn,
                  },
                  Action: 'sts:AssumeRoleWithWebIdentity',
                  Condition: {
                    StringEquals: {
                      [`${issuerHostname}:sub`]:
                        'system:serviceaccount:kube-system:cluster-autoscaler',
                      [`${issuerHostname}:aud`]: 'sts.amazonaws.com',
                    },
                  },
                },
              ],
            });
          }),
        tags: defaultTags,
      },
      { parent: this, dependsOn: [oidcProvider] }
    );

    // Cluster Autoscaler Policy
    const clusterAutoscalerPolicy = new aws.iam.Policy(
      `eks-cluster-autoscaler-policy-${environmentSuffix}`,
      {
        policy: cluster.name.apply(clusterName =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'autoscaling:DescribeAutoScalingGroups',
                  'autoscaling:DescribeAutoScalingInstances',
                  'autoscaling:DescribeLaunchConfigurations',
                  'autoscaling:DescribeScalingActivities',
                  'autoscaling:DescribeTags',
                  'ec2:DescribeInstanceTypes',
                  'ec2:DescribeLaunchTemplateVersions',
                ],
                Resource: '*',
              },
              {
                Effect: 'Allow',
                Action: [
                  'autoscaling:SetDesiredCapacity',
                  'autoscaling:TerminateInstanceInAutoScalingGroup',
                  'ec2:DescribeImages',
                  'ec2:GetInstanceTypesFromInstanceRequirements',
                  'eks:DescribeNodegroup',
                ],
                Resource: '*',
                Condition: {
                  StringEquals: {
                    'aws:ResourceTag/k8s.io/cluster-autoscaler/enabled': 'true',
                    [`aws:ResourceTag/kubernetes.io/cluster/${clusterName}`]:
                      'owned',
                  },
                },
              },
            ],
          })
        ),
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `eks-cluster-autoscaler-policy-attach-${environmentSuffix}`,
      {
        role: clusterAutoscalerRole.name,
        policyArn: clusterAutoscalerPolicy.arn,
      },
      { parent: this }
    );

    // ==================== EBS CSI Driver IAM Role (IRSA) ====================

    const ebsCsiDriverRole = new aws.iam.Role(
      `eks-ebs-csi-driver-role-${environmentSuffix}`,
      {
        assumeRolePolicy: pulumi
          .all([cluster.identities[0].oidcs[0].issuer, oidcProvider.arn])
          .apply(([issuer, arn]) => {
            const issuerHostname = issuer.replace('https://', '');
            return JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: {
                    Federated: arn,
                  },
                  Action: 'sts:AssumeRoleWithWebIdentity',
                  Condition: {
                    StringEquals: {
                      [`${issuerHostname}:sub`]:
                        'system:serviceaccount:kube-system:ebs-csi-controller-sa',
                      [`${issuerHostname}:aud`]: 'sts.amazonaws.com',
                    },
                  },
                },
              ],
            });
          }),
        tags: defaultTags,
      },
      { parent: this, dependsOn: [oidcProvider] }
    );

    new aws.iam.RolePolicyAttachment(
      `eks-ebs-csi-policy-${environmentSuffix}`,
      {
        role: ebsCsiDriverRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy',
      },
      { parent: this }
    );

    // ==================== EKS Add-ons ====================

    // VPC CNI Add-on
    const vpcCniAddon = new aws.eks.Addon(
      `eks-addon-vpc-cni-${environmentSuffix}`,
      {
        clusterName: cluster.name,
        addonName: 'vpc-cni',
        addonVersion: 'v1.15.1-eksbuild.1',
        resolveConflictsOnCreate: 'OVERWRITE',
        resolveConflictsOnUpdate: 'PRESERVE',
        tags: defaultTags,
      },
      { parent: this, dependsOn: [cluster] }
    );

    // CoreDNS Add-on
    const coreDnsAddon = new aws.eks.Addon(
      `eks-addon-coredns-${environmentSuffix}`,
      {
        clusterName: cluster.name,
        addonName: 'coredns',
        addonVersion: 'v1.10.1-eksbuild.6',
        resolveConflictsOnCreate: 'OVERWRITE',
        resolveConflictsOnUpdate: 'PRESERVE',
        tags: defaultTags,
      },
      { parent: this, dependsOn: [cluster, vpcCniAddon] }
    );

    // kube-proxy Add-on
    const kubeProxyAddon = new aws.eks.Addon(
      `eks-addon-kube-proxy-${environmentSuffix}`,
      {
        clusterName: cluster.name,
        addonName: 'kube-proxy',
        addonVersion: 'v1.28.2-eksbuild.2',
        resolveConflictsOnCreate: 'OVERWRITE',
        resolveConflictsOnUpdate: 'PRESERVE',
        tags: defaultTags,
      },
      { parent: this, dependsOn: [cluster] }
    );

    // EBS CSI Driver Add-on
    const ebsCsiAddon = new aws.eks.Addon(
      `eks-addon-ebs-csi-${environmentSuffix}`,
      {
        clusterName: cluster.name,
        addonName: 'aws-ebs-csi-driver',
        addonVersion: 'v1.25.0-eksbuild.1',
        serviceAccountRoleArn: ebsCsiDriverRole.arn,
        resolveConflictsOnCreate: 'OVERWRITE',
        resolveConflictsOnUpdate: 'PRESERVE',
        tags: defaultTags,
      },
      { parent: this, dependsOn: [cluster, ebsCsiDriverRole] }
    );

    // ==================== Node Groups ====================

    // General Purpose Node Group (t4g.medium - Graviton3)
    const generalNodeGroup = new aws.eks.NodeGroup(
      `eks-nodegroup-general-${environmentSuffix}`,
      {
        clusterName: cluster.name,
        nodeGroupName: `nodegroup-general-${environmentSuffix}`,
        nodeRoleArn: nodeRole.arn,
        subnetIds: privateSubnetIds,
        instanceTypes: ['t4g.medium'],
        amiType: 'AL2_ARM_64',
        capacityType: 'ON_DEMAND',
        scalingConfig: {
          desiredSize: 2,
          minSize: 2,
          maxSize: 10,
        },
        updateConfig: {
          maxUnavailable: 1,
        },
        labels: {
          'node-type': 'general',
          workload: 'stateless',
        },
        tags: pulumi
          .all([defaultTags, cluster.name])
          .apply(([tags, clusterName]) => ({
            ...tags,
            Name: `nodegroup-general-${environmentSuffix}`,
            'k8s.io/cluster-autoscaler/enabled': 'true',
            [`k8s.io/cluster-autoscaler/${clusterName}`]: 'owned',
            [`kubernetes.io/cluster/${clusterName}`]: 'owned',
          })),
      },
      {
        parent: this,
        dependsOn: [
          cluster,
          nodeRole,
          vpcCniAddon,
          coreDnsAddon,
          kubeProxyAddon,
          ebsCsiAddon,
        ],
        ignoreChanges: ['scalingConfig.desiredSize'],
      }
    );

    // Compute Intensive Node Group (c7g.large - Graviton3)
    const computeNodeGroup = new aws.eks.NodeGroup(
      `eks-nodegroup-compute-${environmentSuffix}`,
      {
        clusterName: cluster.name,
        nodeGroupName: `nodegroup-compute-${environmentSuffix}`,
        nodeRoleArn: nodeRole.arn,
        subnetIds: privateSubnetIds,
        instanceTypes: ['c7g.large'],
        amiType: 'AL2_ARM_64',
        capacityType: 'ON_DEMAND',
        scalingConfig: {
          desiredSize: 2,
          minSize: 2,
          maxSize: 10,
        },
        updateConfig: {
          maxUnavailable: 1,
        },
        labels: {
          'node-type': 'compute',
          workload: 'compute-intensive',
        },
        tags: pulumi
          .all([defaultTags, cluster.name])
          .apply(([tags, clusterName]) => ({
            ...tags,
            Name: `nodegroup-compute-${environmentSuffix}`,
            'k8s.io/cluster-autoscaler/enabled': 'true',
            [`k8s.io/cluster-autoscaler/${clusterName}`]: 'owned',
            [`kubernetes.io/cluster/${clusterName}`]: 'owned',
          })),
      },
      {
        parent: this,
        dependsOn: [
          cluster,
          nodeRole,
          vpcCniAddon,
          coreDnsAddon,
          kubeProxyAddon,
          ebsCsiAddon,
        ],
        ignoreChanges: ['scalingConfig.desiredSize'],
      }
    );

    // ==================== Kubeconfig ====================

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
              name: name,
            },
          ],
          contexts: [
            {
              context: {
                cluster: name,
                user: name,
              },
              name: name,
            },
          ],
          'current-context': name,
          kind: 'Config',
          users: [
            {
              name: name,
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

    // ==================== Exports ====================

    this.vpcId = vpc.id;
    this.clusterName = cluster.name;
    this.clusterEndpoint = cluster.endpoint;
    this.clusterOidcProviderUrl = cluster.identities[0].oidcs[0].issuer;
    this.clusterOidcProviderArn = oidcProvider.arn;
    this.kubeconfig = kubeconfig;
    this.generalNodeGroupName = generalNodeGroup.nodeGroupName;
    this.computeNodeGroupName = computeNodeGroup.nodeGroupName;
    this.clusterAutoscalerRoleArn = clusterAutoscalerRole.arn;

    this.registerOutputs({
      vpcId: this.vpcId,
      clusterName: this.clusterName,
      clusterEndpoint: this.clusterEndpoint,
      clusterOidcProviderUrl: this.clusterOidcProviderUrl,
      clusterOidcProviderArn: this.clusterOidcProviderArn,
      kubeconfig: this.kubeconfig,
      generalNodeGroupName: this.generalNodeGroupName,
      computeNodeGroupName: this.computeNodeGroupName,
      clusterAutoscalerRoleArn: this.clusterAutoscalerRoleArn,
    });
  }
}
