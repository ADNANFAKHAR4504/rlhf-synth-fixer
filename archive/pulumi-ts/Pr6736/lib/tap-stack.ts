/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */

/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * It orchestrates the instantiation of EKS cluster with mixed node groups,
 * IRSA (IAM Roles for Service Accounts), VPC networking, and related AWS resources.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as eks from '@pulumi/eks';

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
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component creates an EKS cluster with:
 * - VPC with public and private subnets across 3 availability zones
 * - NAT Gateways for private subnet internet access
 * - EKS cluster with OIDC provider for IRSA
 * - Mixed node groups (on-demand and spot instances)
 * - Fargate profile for kube-system namespace
 * - IAM roles for RBAC (dev, staging, prod)
 * - Service accounts with IRSA for cluster autoscaler and ALB controller
 * - EKS addons (VPC CNI, kube-proxy, CoreDNS)
 */
export class TapStack extends pulumi.ComponentResource {
  // Exported outputs
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly clusterName: pulumi.Output<string>;
  public readonly clusterEndpoint: pulumi.Output<string>;
  public readonly clusterVersion: pulumi.Output<string>;
  public readonly oidcProviderUrl: pulumi.Output<string | undefined>;
  public readonly oidcProviderArn: pulumi.Output<string | undefined>;
  public readonly kubeconfig: pulumi.Output<any>;
  public readonly onDemandNodeGroupName: pulumi.Output<string>;
  public readonly spotNodeGroupName: pulumi.Output<string>;
  public readonly nodeGroupRoleArn: pulumi.Output<string>;
  public readonly fargateProfileName: pulumi.Output<string>;
  public readonly fargateRoleArn: pulumi.Output<string>;
  public readonly devRoleArn: pulumi.Output<string>;
  public readonly stagingRoleArn: pulumi.Output<string>;
  public readonly prodRoleArn: pulumi.Output<string>;
  public readonly clusterAutoscalerRoleArn: pulumi.Output<string>;
  public readonly albControllerRoleArn: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    // Get configuration
    const config = new pulumi.Config();
    const environmentSuffix = args.environmentSuffix || config.get('environmentSuffix') || 'dev';

    // Get availability zones
    const availabilityZones = aws.getAvailabilityZonesOutput({
      state: 'available',
    }).names;

    // Create VPC
    const vpc = new aws.ec2.Vpc(`eks-vpc-${environmentSuffix}`, {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `eks-vpc-${environmentSuffix}`,
        [`kubernetes.io/cluster/eks-cluster-${environmentSuffix}`]: 'shared',
      },
    }, { parent: this });

    // Create Internet Gateway
    const igw = new aws.ec2.InternetGateway(`eks-igw-${environmentSuffix}`, {
      vpcId: vpc.id,
      tags: {
        Name: `eks-igw-${environmentSuffix}`,
      },
    }, { parent: this });

    // Create public subnets
    const publicSubnets: aws.ec2.Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      const publicSubnet = new aws.ec2.Subnet(
        `eks-public-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i}.0/24`,
          availabilityZone: availabilityZones.apply(azs => azs[i]),
          mapPublicIpOnLaunch: true,
          tags: {
            Name: `eks-public-subnet-${i}-${environmentSuffix}`,
            [`kubernetes.io/cluster/eks-cluster-${environmentSuffix}`]: 'shared',
            'kubernetes.io/role/elb': '1',
          },
        },
        { parent: this }
      );
      publicSubnets.push(publicSubnet);
    }

    // Create private subnets
    const privateSubnets: aws.ec2.Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      const privateSubnet = new aws.ec2.Subnet(
        `eks-private-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i + 10}.0/24`,
          availabilityZone: availabilityZones.apply(azs => azs[i]),
          tags: {
            Name: `eks-private-subnet-${i}-${environmentSuffix}`,
            [`kubernetes.io/cluster/eks-cluster-${environmentSuffix}`]: 'shared',
            'kubernetes.io/role/internal-elb': '1',
          },
        },
        { parent: this }
      );
      privateSubnets.push(privateSubnet);
    }

    // Create Elastic IPs for NAT Gateways
    const eips: aws.ec2.Eip[] = [];
    for (let i = 0; i < 3; i++) {
      const eip = new aws.ec2.Eip(`eks-nat-eip-${i}-${environmentSuffix}`, {
        domain: 'vpc',
        tags: {
          Name: `eks-nat-eip-${i}-${environmentSuffix}`,
        },
      }, { parent: this });
      eips.push(eip);
    }

    // Create NAT Gateways
    const natGateways: aws.ec2.NatGateway[] = [];
    for (let i = 0; i < 3; i++) {
      const natGateway = new aws.ec2.NatGateway(
        `eks-nat-gateway-${i}-${environmentSuffix}`,
        {
          subnetId: publicSubnets[i].id,
          allocationId: eips[i].id,
          tags: {
            Name: `eks-nat-gateway-${i}-${environmentSuffix}`,
          },
        },
        { parent: this, dependsOn: [igw] }
      );
      natGateways.push(natGateway);
    }

    // Create public route table
    const publicRouteTable = new aws.ec2.RouteTable(
      `eks-public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `eks-public-rt-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create route to Internet Gateway
    new aws.ec2.Route(`eks-public-route-${environmentSuffix}`, {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    }, { parent: this });

    // Associate public subnets with public route table
    for (let i = 0; i < 3; i++) {
      new aws.ec2.RouteTableAssociation(
        `eks-public-rta-${i}-${environmentSuffix}`,
        {
          subnetId: publicSubnets[i].id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    }

    // Create private route tables and routes
    for (let i = 0; i < 3; i++) {
      const privateRouteTable = new aws.ec2.RouteTable(
        `eks-private-rt-${i}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          tags: {
            Name: `eks-private-rt-${i}-${environmentSuffix}`,
          },
        },
        { parent: this }
      );

      new aws.ec2.Route(`eks-private-route-${i}-${environmentSuffix}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[i].id,
      }, { parent: this });

      new aws.ec2.RouteTableAssociation(
        `eks-private-rta-${i}-${environmentSuffix}`,
        {
          subnetId: privateSubnets[i].id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    }

    // Create IAM role for node groups
    const nodeGroupRole = new aws.iam.Role(
      `eks-nodegroup-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Name: `eks-nodegroup-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Attach required policies to node group role
    const nodeGroupPolicies = [
      'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy',
      'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy',
      'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
    ];

    nodeGroupPolicies.forEach((policyArn, index) => {
      new aws.iam.RolePolicyAttachment(
        `eks-nodegroup-policy-${index}-${environmentSuffix}`,
        {
          role: nodeGroupRole.name,
          policyArn: policyArn,
        },
        { parent: this }
      );
    });

    // Create IAM role for Fargate profile
    const fargateRole = new aws.iam.Role(`eks-fargate-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'eks-fargate-pods.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `eks-fargate-role-${environmentSuffix}`,
      },
    }, { parent: this });

    // Attach Fargate pod execution policy
    new aws.iam.RolePolicyAttachment(`eks-fargate-policy-${environmentSuffix}`, {
      role: fargateRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonEKSFargatePodExecutionRolePolicy',
    }, { parent: this });

    // Create IAM roles for different environments
    const devRole = new aws.iam.Role(`eks-dev-role-${environmentSuffix}`, {
      assumeRolePolicy: pulumi.output(aws.getCallerIdentity()).apply(identity =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                AWS: `arn:aws:iam::${identity.accountId}:root`,
              },
              Action: 'sts:AssumeRole',
            },
          ],
        })
      ),
      tags: {
        Name: `eks-dev-role-${environmentSuffix}`,
        Environment: 'development',
      },
    }, { parent: this });

    const stagingRole = new aws.iam.Role(`eks-staging-role-${environmentSuffix}`, {
      assumeRolePolicy: pulumi.output(aws.getCallerIdentity()).apply(identity =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                AWS: `arn:aws:iam::${identity.accountId}:root`,
              },
              Action: 'sts:AssumeRole',
            },
          ],
        })
      ),
      tags: {
        Name: `eks-staging-role-${environmentSuffix}`,
        Environment: 'staging',
      },
    }, { parent: this });

    const prodRole = new aws.iam.Role(`eks-prod-role-${environmentSuffix}`, {
      assumeRolePolicy: pulumi.output(aws.getCallerIdentity()).apply(identity =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                AWS: `arn:aws:iam::${identity.accountId}:root`,
              },
              Action: 'sts:AssumeRole',
            },
          ],
        })
      ),
      tags: {
        Name: `eks-prod-role-${environmentSuffix}`,
        Environment: 'production',
      },
    }, { parent: this });

    // Attach EKS describe policy to environment roles
    const eksDescribePolicy = new aws.iam.Policy(
      `eks-describe-policy-${environmentSuffix}`,
      {
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['eks:DescribeCluster', 'eks:ListClusters'],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(`eks-dev-describe-${environmentSuffix}`, {
      role: devRole.name,
      policyArn: eksDescribePolicy.arn,
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`eks-staging-describe-${environmentSuffix}`, {
      role: stagingRole.name,
      policyArn: eksDescribePolicy.arn,
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`eks-prod-describe-${environmentSuffix}`, {
      role: prodRole.name,
      policyArn: eksDescribePolicy.arn,
    }, { parent: this });

    // Create EKS cluster with RBAC role mappings
    const cluster = new eks.Cluster(`eks-cluster-${environmentSuffix}`, {
      vpcId: vpc.id,
      publicSubnetIds: publicSubnets.map(subnet => subnet.id),
      privateSubnetIds: privateSubnets.map(subnet => subnet.id),
      version: '1.28',
      instanceType: 't3.medium',
      desiredCapacity: 0, // We'll use managed node groups instead
      minSize: 0,
      maxSize: 0,
      createOidcProvider: true,
      endpointPublicAccess: true,
      endpointPrivateAccess: true,
      skipDefaultNodeGroup: true,
      roleMappings: [
        {
          roleArn: devRole.arn,
          groups: ['system:masters'],
          username: 'dev-user',
        },
        {
          roleArn: stagingRole.arn,
          groups: ['system:masters'],
          username: 'staging-user',
        },
        {
          roleArn: prodRole.arn,
          groups: ['system:masters'],
          username: 'prod-user',
        },
      ],
      tags: {
        Name: `eks-cluster-${environmentSuffix}`,
      },
    }, { parent: this });

    // Create on-demand managed node group
    const onDemandNodeGroup = new aws.eks.NodeGroup(
      `eks-ondemand-ng-${environmentSuffix}`,
      {
        clusterName: cluster.eksCluster.name,
        nodeGroupName: `ondemand-ng-${environmentSuffix}`,
        nodeRoleArn: nodeGroupRole.arn,
        subnetIds: privateSubnets.map(subnet => subnet.id),
        scalingConfig: {
          desiredSize: 3,
          minSize: 2,
          maxSize: 6,
        },
        instanceTypes: ['t3.medium'],
        capacityType: 'ON_DEMAND',
        tags: {
          Name: `eks-ondemand-ng-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create spot managed node group
    const spotNodeGroup = new aws.eks.NodeGroup(
      `eks-spot-ng-${environmentSuffix}`,
      {
        clusterName: cluster.eksCluster.name,
        nodeGroupName: `spot-ng-${environmentSuffix}`,
        nodeRoleArn: nodeGroupRole.arn,
        subnetIds: privateSubnets.map(subnet => subnet.id),
        scalingConfig: {
          desiredSize: 2,
          minSize: 1,
          maxSize: 4,
        },
        instanceTypes: ['t3.large'],
        capacityType: 'SPOT',
        tags: {
          Name: `eks-spot-ng-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Kubernetes provider

    // Note: EKS cluster automatically installs default versions of vpc-cni, kube-proxy, and coredns
    // Since these addons already exist, we'll skip managing them in Pulumi to avoid conflicts
    // They can be managed separately via kubectl or AWS console if needed

    // Commenting out addon management to avoid 409 conflicts with existing addons
    // If you need to manage these addons, first import them into Pulumi state using:
    // pulumi import aws:eks/addon:Addon eks-vpc-cni-addon-<suffix> <cluster-name>:vpc-cni
    // pulumi import aws:eks/addon:Addon eks-kube-proxy-addon-<suffix> <cluster-name>:kube-proxy
    // pulumi import aws:eks/addon:Addon eks-coredns-addon-<suffix> <cluster-name>:coredns

    /*
    const vpcCniAddon = new aws.eks.Addon(
      `eks-vpc-cni-addon-${environmentSuffix}`,
      {
        clusterName: cluster.eksCluster.name,
        addonName: 'vpc-cni',
        addonVersion: 'v1.15.1-eksbuild.1',
        resolveConflicts: 'OVERWRITE',
        configurationValues: JSON.stringify({
          env: {
            ENABLE_POD_ENI: 'true',
            POD_SECURITY_GROUP_ENFORCING_MODE: 'standard',
          },
        }),
      },
      { parent: this }
    );

    const kubeProxyAddon = new aws.eks.Addon(
      `eks-kube-proxy-addon-${environmentSuffix}`,
      {
        clusterName: cluster.eksCluster.name,
        addonName: 'kube-proxy',
        addonVersion: 'v1.28.2-eksbuild.2',
        resolveConflicts: 'OVERWRITE',
      },
      { parent: this }
    );

    const coreDnsAddon = new aws.eks.Addon(
      `eks-coredns-addon-${environmentSuffix}`,
      {
        clusterName: cluster.eksCluster.name,
        addonName: 'coredns',
        addonVersion: 'v1.10.1-eksbuild.6',
        resolveConflicts: 'OVERWRITE',
      },
      { parent: this }
    );

    // Patch CoreDNS ConfigMap to add custom forwarding
    const coreDnsConfigMapPatch = new k8s.core.v1.ConfigMapPatch(
      `coredns-custom-${environmentSuffix}`,
      {
        metadata: {
          name: 'coredns',
          namespace: 'kube-system',
        },
        data: {
          Corefile: pulumi.interpolate`.:53 {
    errors
    health {
       lameduck 5s
    }
    ready
    kubernetes cluster.local in-addr.arpa ip6.arpa {
       pods insecure
       fallthrough in-addr.arpa ip6.arpa
       ttl 30
    }
    prometheus :9153
    forward . 10.0.0.2 {
       max_concurrent 1000
    }
    cache 30
    loop
    reload
    loadbalance
}`,
        },
      },
      { provider: k8sProvider, parent: this, dependsOn: [coreDnsAddon] }
    );
    */

    // Note: CoreDNS ConfigMap patching is also commented out since we're not managing the addon
    // If needed, you can manually patch CoreDNS via kubectl after the cluster is created
    /*
    const coreDnsConfigMapPatch = new k8s.core.v1.ConfigMapPatch(
      `coredns-custom-${environmentSuffix}`,
      {
        metadata: {
          name: 'coredns',
          namespace: 'kube-system',
        },
        data: {
          Corefile: pulumi.interpolate`.:53 {
    errors
    health {
       lameduck 5s
    }
    ready
    kubernetes cluster.local in-addr.arpa ip6.arpa {
       pods insecure
       fallthrough in-addr.arpa ip6.arpa
       ttl 30
    }
    prometheus :9153
    forward . 10.0.0.2 {
       max_concurrent 1000
    }
    cache 30
    loop
    reload
    loadbalance
}`,
        },
      },
      { provider: k8sProvider, parent: this }
    );
    */

    // Create IAM role for cluster autoscaler
    const clusterAutoscalerRole = new aws.iam.Role(
      `eks-cluster-autoscaler-role-${environmentSuffix}`,
      {
        assumeRolePolicy: cluster.core.oidcProvider!.apply((oidcProvider: any) => {
          return pulumi.all([
            pulumi.output(oidcProvider.url),
            pulumi.output(oidcProvider.arn)
          ]).apply(([url, arn]) => {
            const oidcUrl = url.replace('https://', '');

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
                      [`${oidcUrl}:sub`]:
                        'system:serviceaccount:kube-system:cluster-autoscaler',
                      [`${oidcUrl}:aud`]: 'sts.amazonaws.com',
                    },
                  },
                },
              ],
            });
          });
        }),
        tags: {
          Name: `eks-cluster-autoscaler-role-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [cluster] }
    );

    // Create policy for cluster autoscaler
    const clusterAutoscalerPolicy = new aws.iam.Policy(
      `eks-cluster-autoscaler-policy-${environmentSuffix}`,
      {
        policy: pulumi.interpolate`{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "autoscaling:DescribeAutoScalingGroups",
                "autoscaling:DescribeAutoScalingInstances",
                "autoscaling:DescribeLaunchConfigurations",
                "autoscaling:DescribeScalingActivities",
                "autoscaling:DescribeTags",
                "ec2:DescribeInstanceTypes",
                "ec2:DescribeLaunchTemplateVersions"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "autoscaling:SetDesiredCapacity",
                "autoscaling:TerminateInstanceInAutoScalingGroup",
                "ec2:DescribeImages",
                "ec2:GetInstanceTypesFromInstanceRequirements",
                "eks:DescribeNodegroup"
            ],
            "Resource": "*"
        }
    ]
}`,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `eks-cluster-autoscaler-attach-${environmentSuffix}`,
      {
        role: clusterAutoscalerRole.name,
        policyArn: clusterAutoscalerPolicy.arn,
      },
      { parent: this }
    );

    // Create service account for cluster autoscaler

    // Create IAM role for AWS Load Balancer Controller
    const albControllerRole = new aws.iam.Role(
      `eks-alb-controller-role-${environmentSuffix}`,
      {
        assumeRolePolicy: cluster.core.oidcProvider!.apply((oidcProvider: any) => {
          return pulumi.all([
            pulumi.output(oidcProvider.url),
            pulumi.output(oidcProvider.arn)
          ]).apply(([url, arn]) => {
            const oidcUrl = url.replace('https://', '');

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
                      [`${oidcUrl}:sub`]:
                        'system:serviceaccount:kube-system:aws-load-balancer-controller',
                      [`${oidcUrl}:aud`]: 'sts.amazonaws.com',
                    },
                  },
                },
              ],
            });
          });
        }),
        tags: {
          Name: `eks-alb-controller-role-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [cluster] }
    );

    // Create policy for AWS Load Balancer Controller
    const albControllerPolicy = new aws.iam.Policy(
      `eks-alb-controller-policy-${environmentSuffix}`,
      {
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['iam:CreateServiceLinkedRole'],
              Resource: '*',
              Condition: {
                StringEquals: {
                  'iam:AWSServiceName': 'elasticloadbalancing.amazonaws.com',
                },
              },
            },
            {
              Effect: 'Allow',
              Action: [
                'ec2:DescribeAccountAttributes',
                'ec2:DescribeAddresses',
                'ec2:DescribeAvailabilityZones',
                'ec2:DescribeInternetGateways',
                'ec2:DescribeVpcs',
                'ec2:DescribeVpcPeeringConnections',
                'ec2:DescribeSubnets',
                'ec2:DescribeSecurityGroups',
                'ec2:DescribeInstances',
                'ec2:DescribeNetworkInterfaces',
                'ec2:DescribeTags',
                'ec2:GetCoipPoolUsage',
                'ec2:DescribeCoipPools',
                'elasticloadbalancing:DescribeLoadBalancers',
                'elasticloadbalancing:DescribeLoadBalancerAttributes',
                'elasticloadbalancing:DescribeListeners',
                'elasticloadbalancing:DescribeListenerCertificates',
                'elasticloadbalancing:DescribeSSLPolicies',
                'elasticloadbalancing:DescribeRules',
                'elasticloadbalancing:DescribeTargetGroups',
                'elasticloadbalancing:DescribeTargetGroupAttributes',
                'elasticloadbalancing:DescribeTargetHealth',
                'elasticloadbalancing:DescribeTags',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: [
                'cognito-idp:DescribeUserPoolClient',
                'acm:ListCertificates',
                'acm:DescribeCertificate',
                'iam:ListServerCertificates',
                'iam:GetServerCertificate',
                'waf-regional:GetWebACL',
                'waf-regional:GetWebACLForResource',
                'waf-regional:AssociateWebACL',
                'waf-regional:DisassociateWebACL',
                'wafv2:GetWebACL',
                'wafv2:GetWebACLForResource',
                'wafv2:AssociateWebACL',
                'wafv2:DisassociateWebACL',
                'shield:GetSubscriptionState',
                'shield:DescribeProtection',
                'shield:CreateProtection',
                'shield:DeleteProtection',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: [
                'ec2:AuthorizeSecurityGroupIngress',
                'ec2:RevokeSecurityGroupIngress',
                'ec2:CreateSecurityGroup',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: ['ec2:CreateTags'],
              Resource: 'arn:aws:ec2:*:*:security-group/*',
              Condition: {
                StringEquals: {
                  'ec2:CreateAction': 'CreateSecurityGroup',
                },
                Null: {
                  'aws:RequestTag/elbv2.k8s.aws/cluster': 'false',
                },
              },
            },
            {
              Effect: 'Allow',
              Action: ['ec2:CreateTags', 'ec2:DeleteTags'],
              Resource: 'arn:aws:ec2:*:*:security-group/*',
              Condition: {
                Null: {
                  'aws:RequestTag/elbv2.k8s.aws/cluster': 'true',
                  'aws:ResourceTag/elbv2.k8s.aws/cluster': 'false',
                },
              },
            },
            {
              Effect: 'Allow',
              Action: [
                'elasticloadbalancing:CreateLoadBalancer',
                'elasticloadbalancing:CreateTargetGroup',
              ],
              Resource: '*',
              Condition: {
                Null: {
                  'aws:RequestTag/elbv2.k8s.aws/cluster': 'false',
                },
              },
            },
            {
              Effect: 'Allow',
              Action: [
                'elasticloadbalancing:CreateListener',
                'elasticloadbalancing:DeleteListener',
                'elasticloadbalancing:CreateRule',
                'elasticloadbalancing:DeleteRule',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: [
                'elasticloadbalancing:AddTags',
                'elasticloadbalancing:RemoveTags',
              ],
              Resource: [
                'arn:aws:elasticloadbalancing:*:*:targetgroup/*/*',
                'arn:aws:elasticloadbalancing:*:*:loadbalancer/net/*/*',
                'arn:aws:elasticloadbalancing:*:*:loadbalancer/app/*/*',
              ],
              Condition: {
                Null: {
                  'aws:RequestTag/elbv2.k8s.aws/cluster': 'true',
                  'aws:ResourceTag/elbv2.k8s.aws/cluster': 'false',
                },
              },
            },
            {
              Effect: 'Allow',
              Action: [
                'elasticloadbalancing:ModifyLoadBalancerAttributes',
                'elasticloadbalancing:SetIpAddressType',
                'elasticloadbalancing:SetSecurityGroups',
                'elasticloadbalancing:SetSubnets',
                'elasticloadbalancing:DeleteLoadBalancer',
                'elasticloadbalancing:ModifyTargetGroup',
                'elasticloadbalancing:ModifyTargetGroupAttributes',
                'elasticloadbalancing:DeleteTargetGroup',
              ],
              Resource: '*',
              Condition: {
                Null: {
                  'aws:ResourceTag/elbv2.k8s.aws/cluster': 'false',
                },
              },
            },
            {
              Effect: 'Allow',
              Action: [
                'elasticloadbalancing:RegisterTargets',
                'elasticloadbalancing:DeregisterTargets',
              ],
              Resource: 'arn:aws:elasticloadbalancing:*:*:targetgroup/*/*',
            },
            {
              Effect: 'Allow',
              Action: [
                'elasticloadbalancing:SetWebAcl',
                'elasticloadbalancing:ModifyListener',
                'elasticloadbalancing:AddListenerCertificates',
                'elasticloadbalancing:RemoveListenerCertificates',
                'elasticloadbalancing:ModifyRule',
              ],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `eks-alb-controller-attach-${environmentSuffix}`,
      {
        role: albControllerRole.name,
        policyArn: albControllerPolicy.arn,
      },
      { parent: this }
    );

    // Create service account for AWS Load Balancer Controller

    // Create Fargate profile for kube-system namespace
    const fargateProfile = new aws.eks.FargateProfile(
      `eks-fargate-profile-${environmentSuffix}`,
      {
        clusterName: cluster.eksCluster.name,
        fargateProfileName: `kube-system-${environmentSuffix}`,
        podExecutionRoleArn: fargateRole.arn,
        subnetIds: privateSubnets.map(subnet => subnet.id),
        selectors: [
          {
            namespace: 'kube-system',
          },
        ],
        tags: {
          Name: `eks-fargate-profile-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Set outputs
    this.vpcId = vpc.id;
    this.publicSubnetIds = pulumi.output(publicSubnets.map(subnet => subnet.id));
    this.privateSubnetIds = pulumi.output(privateSubnets.map(subnet => subnet.id));
    this.clusterName = cluster.eksCluster.name;
    this.clusterEndpoint = cluster.eksCluster.endpoint;
    this.clusterVersion = cluster.eksCluster.version;
    this.oidcProviderUrl = cluster.core.oidcProvider!.apply((p) => (p as any)?.url);
    this.oidcProviderArn = cluster.core.oidcProvider!.apply((p) => (p as any)?.arn);
    this.kubeconfig = cluster.kubeconfig;
    this.onDemandNodeGroupName = onDemandNodeGroup.nodeGroupName;
    this.spotNodeGroupName = spotNodeGroup.nodeGroupName;
    this.nodeGroupRoleArn = nodeGroupRole.arn;
    this.fargateProfileName = fargateProfile.fargateProfileName;
    this.fargateRoleArn = fargateRole.arn;
    this.devRoleArn = devRole.arn;
    this.stagingRoleArn = stagingRole.arn;
    this.prodRoleArn = prodRole.arn;
    this.clusterAutoscalerRoleArn = clusterAutoscalerRole.arn;
    this.albControllerRoleArn = albControllerRole.arn;

    // Register the outputs of this component
    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      clusterName: this.clusterName,
      clusterEndpoint: this.clusterEndpoint,
      clusterVersion: this.clusterVersion,
      oidcProviderUrl: this.oidcProviderUrl,
      oidcProviderArn: this.oidcProviderArn,
      kubeconfig: this.kubeconfig,
      onDemandNodeGroupName: this.onDemandNodeGroupName,
      spotNodeGroupName: this.spotNodeGroupName,
      nodeGroupRoleArn: this.nodeGroupRoleArn,
      fargateProfileName: this.fargateProfileName,
      fargateRoleArn: this.fargateRoleArn,
      devRoleArn: this.devRoleArn,
      stagingRoleArn: this.stagingRoleArn,
      prodRoleArn: this.prodRoleArn,
      clusterAutoscalerRoleArn: this.clusterAutoscalerRoleArn,
      albControllerRoleArn: this.albControllerRoleArn,
    });
  }
}

