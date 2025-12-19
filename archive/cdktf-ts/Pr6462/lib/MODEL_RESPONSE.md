## 1. `lib/modules.ts` - Modular Constructs

```typescript
import { Construct } from 'constructs';
import * as aws from '@cdktf/provider-aws';
import { Fn, TerraformOutput } from 'cdktf';

export interface NetworkingConfig {
  vpcCidr: string;
  availabilityZones: string[];
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  tags: { [key: string]: string };
}

export interface EksNodeGroupConfig {
  clusterName: string;
  nodeRoleName: string;
  subnetIds: string[];
  instanceTypes: string[];
  scalingConfig: {
    desired: number;
    min: number;
    max: number;
  };
  capacityType?: string;
  labels?: { [key: string]: string };
  taints?: aws.eksNodeGroup.EksNodeGroupTaint[];
  tags: { [key: string]: string };
}

export class VpcConstruct extends Construct {
  public readonly vpc: aws.vpc.Vpc;
  public readonly publicSubnets: aws.subnet.Subnet[];
  public readonly privateSubnets: aws.subnet.Subnet[];
  public readonly natGateways: aws.natGateway.NatGateway[];
  public readonly internetGateway: aws.internetGateway.InternetGateway;

  constructor(scope: Construct, id: string, config: NetworkingConfig) {
    super(scope, id);

    // Create VPC
    this.vpc = new aws.vpc.Vpc(this, 'vpc', {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...config.tags,
        Name: `${id}-vpc`,
      },
    });

    // Create Internet Gateway
    this.internetGateway = new aws.internetGateway.InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${id}-igw`,
      },
    });

    // Create public subnets
    this.publicSubnets = config.publicSubnetCidrs.map((cidr, index) => {
      return new aws.subnet.Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index],
        mapPublicIpOnLaunch: true,
        tags: {
          ...config.tags,
          Name: `${id}-public-subnet-${index + 1}`,
          'kubernetes.io/role/elb': '1',
          'kubernetes.io/cluster/eks-production': 'shared',
        },
      });
    });

    // Create private subnets
    this.privateSubnets = config.privateSubnetCidrs.map((cidr, index) => {
      return new aws.subnet.Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index],
        tags: {
          ...config.tags,
          Name: `${id}-private-subnet-${index + 1}`,
          'kubernetes.io/role/internal-elb': '1',
          'kubernetes.io/cluster/eks-production': 'shared',
        },
      });
    });

    // Create Elastic IPs for NAT Gateways
    const elasticIps = this.publicSubnets.map((_, index) => {
      return new aws.eip.Eip(this, `nat-eip-${index}`, {
        domain: 'vpc',
        tags: {
          ...config.tags,
          Name: `${id}-nat-eip-${index + 1}`,
        },
      });
    });

    // Create NAT Gateways
    this.natGateways = this.publicSubnets.map((subnet, index) => {
      return new aws.natGateway.NatGateway(this, `nat-gateway-${index}`, {
        allocationId: elasticIps[index].id,
        subnetId: subnet.id,
        tags: {
          ...config.tags,
          Name: `${id}-nat-gateway-${index + 1}`,
        },
      });
    });

    // Create route tables
    this.createRouteTables(config.tags, id);
  }

  private createRouteTables(tags: { [key: string]: string }, prefix: string) {
    // Public route table
    const publicRouteTable = new aws.routeTable.RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        ...tags,
        Name: `${prefix}-public-rt`,
      },
    });

    // Public route to Internet Gateway
    new aws.route.Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `public-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        }
      );
    });

    // Private route tables (one per AZ for high availability)
    this.privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new aws.routeTable.RouteTable(
        this,
        `private-rt-${index}`,
        {
          vpcId: this.vpc.id,
          tags: {
            ...tags,
            Name: `${prefix}-private-rt-${index + 1}`,
          },
        }
      );

      // Route to NAT Gateway
      new aws.route.Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: this.natGateways[index].id,
      });

      // Associate private subnet with route table
      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `private-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        }
      );
    });
  }
}

export class EksSecurityGroups extends Construct {
  public readonly clusterSecurityGroup: aws.securityGroup.SecurityGroup;
  public readonly nodeSecurityGroup: aws.securityGroup.SecurityGroup;

  constructor(
    scope: Construct,
    id: string,
    vpcId: string,
    tags: { [key: string]: string }
  ) {
    super(scope, id);

    // Cluster security group
    this.clusterSecurityGroup = new aws.securityGroup.SecurityGroup(
      this,
      'cluster-sg',
      {
        name: `${id}-cluster-sg`,
        description: 'Security group for EKS cluster control plane',
        vpcId: vpcId,
        tags: {
          ...tags,
          Name: `${id}-cluster-sg`,
        },
      }
    );

    // Node security group
    this.nodeSecurityGroup = new aws.securityGroup.SecurityGroup(
      this,
      'node-sg',
      {
        name: `${id}-node-sg`,
        description: 'Security group for EKS worker nodes',
        vpcId: vpcId,
        tags: {
          ...tags,
          Name: `${id}-node-sg`,
        },
      }
    );

    // Security group rules
    this.createSecurityGroupRules();
  }

  private createSecurityGroupRules() {
    // Allow nodes to communicate with cluster API
    new aws.securityGroupRule.SecurityGroupRule(
      this,
      'node-to-cluster-api',
      {
        type: 'ingress',
        fromPort: 443,
        toPort: 443,
        protocol: 'tcp',
        securityGroupId: this.clusterSecurityGroup.id,
        sourceSecurityGroupId: this.nodeSecurityGroup.id,
        description: 'Allow nodes to communicate with the cluster API',
      }
    );

    // Allow cluster API to communicate with nodes
    new aws.securityGroupRule.SecurityGroupRule(
      this,
      'cluster-to-node-api',
      {
        type: 'ingress',
        fromPort: 443,
        toPort: 443,
        protocol: 'tcp',
        securityGroupId: this.nodeSecurityGroup.id,
        sourceSecurityGroupId: this.clusterSecurityGroup.id,
        description: 'Allow cluster API to communicate with nodes',
      }
    );

    // Allow nodes to communicate with each other
    new aws.securityGroupRule.SecurityGroupRule(
      this,
      'node-to-node-all',
      {
        type: 'ingress',
        fromPort: 0,
        toPort: 65535,
        protocol: '-1',
        securityGroupId: this.nodeSecurityGroup.id,
        sourceSecurityGroupId: this.nodeSecurityGroup.id,
        description: 'Allow nodes to communicate with each other',
      }
    );

    // Allow cluster to communicate with nodes on ephemeral ports
    new aws.securityGroupRule.SecurityGroupRule(
      this,
      'cluster-to-node-ephemeral',
      {
        type: 'ingress',
        fromPort: 1025,
        toPort: 65535,
        protocol: 'tcp',
        securityGroupId: this.nodeSecurityGroup.id,
        sourceSecurityGroupId: this.clusterSecurityGroup.id,
        description: 'Allow cluster to communicate with nodes on ephemeral ports',
      }
    );

    // Egress rules
    new aws.securityGroupRule.SecurityGroupRule(
      this,
      'cluster-egress-all',
      {
        type: 'egress',
        fromPort: 0,
        toPort: 0,
        protocol: '-1',
        securityGroupId: this.clusterSecurityGroup.id,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow all outbound traffic from cluster',
      }
    );

    new aws.securityGroupRule.SecurityGroupRule(
      this,
      'node-egress-all',
      {
        type: 'egress',
        fromPort: 0,
        toPort: 0,
        protocol: '-1',
        securityGroupId: this.nodeSecurityGroup.id,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow all outbound traffic from nodes',
      }
    );
  }
}

export class IamRoles extends Construct {
  public readonly eksClusterRole: aws.iamRole.IamRole;
  public readonly eksNodeRole: aws.iamRole.IamRole;
  public readonly clusterAutoscalerRole: aws.iamRole.IamRole;
  public readonly awsLoadBalancerControllerRole: aws.iamRole.IamRole;

  constructor(
    scope: Construct,
    id: string,
    clusterName: string,
    oidcProviderArn: string,
    oidcProviderUrl: string,
    tags: { [key: string]: string }
  ) {
    super(scope, id);

    // EKS Cluster Role
    this.eksClusterRole = new aws.iamRole.IamRole(this, 'eks-cluster-role', {
      name: `${clusterName}-cluster-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'eks.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: tags,
    });

    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'eks-cluster-policy',
      {
        role: this.eksClusterRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy',
      }
    );

    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'eks-service-policy',
      {
        role: this.eksClusterRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKSServicePolicy',
      }
    );

    // EKS Node Role
    this.eksNodeRole = new aws.iamRole.IamRole(this, 'eks-node-role', {
      name: `${clusterName}-node-role`,
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
      tags: tags,
    });

    const nodePolicies = [
      'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy',
      'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy',
      'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
      'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    ];

    nodePolicies.forEach((policyArn, index) => {
      new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
        this,
        `node-policy-${index}`,
        {
          role: this.eksNodeRole.name,
          policyArn: policyArn,
        }
      );
    });

    // Cluster Autoscaler IRSA Role
    const oidcProvider = oidcProviderUrl.replace('https://', '');
    
    this.clusterAutoscalerRole = new aws.iamRole.IamRole(
      this,
      'cluster-autoscaler-role',
      {
        name: `${clusterName}-cluster-autoscaler`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Federated: oidcProviderArn,
              },
              Action: 'sts:AssumeRoleWithWebIdentity',
              Condition: {
                StringEquals: {
                  [`${oidcProvider}:sub`]: 'system:serviceaccount:kube-system:cluster-autoscaler',
                  [`${oidcProvider}:aud`]: 'sts.amazonaws.com',
                },
              },
            },
          ],
        }),
        tags: tags,
      }
    );

    // Cluster Autoscaler Policy
    const autoscalerPolicy = new aws.iamPolicy.IamPolicy(
      this,
      'cluster-autoscaler-policy',
      {
        name: `${clusterName}-cluster-autoscaler`,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'autoscaling:DescribeAutoScalingGroups',
                'autoscaling:DescribeAutoScalingInstances',
                'autoscaling:DescribeLaunchConfigurations',
                'autoscaling:DescribeTags',
                'autoscaling:SetDesiredCapacity',
                'autoscaling:TerminateInstanceInAutoScalingGroup',
                'ec2:DescribeLaunchTemplateVersions',
                'ec2:DescribeInstanceTypes',
              ],
              Resource: '*',
            },
          ],
        }),
        tags: tags,
      }
    );

    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'autoscaler-policy-attachment',
      {
        role: this.clusterAutoscalerRole.name,
        policyArn: autoscalerPolicy.arn,
      }
    );

    // AWS Load Balancer Controller IRSA Role
    this.awsLoadBalancerControllerRole = new aws.iamRole.IamRole(
      this,
      'aws-load-balancer-controller-role',
      {
        name: `${clusterName}-aws-load-balancer-controller`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Federated: oidcProviderArn,
              },
              Action: 'sts:AssumeRoleWithWebIdentity',
              Condition: {
                StringEquals: {
                  [`${oidcProvider}:sub`]: 'system:serviceaccount:kube-system:aws-load-balancer-controller',
                  [`${oidcProvider}:aud`]: 'sts.amazonaws.com',
                },
              },
            },
          ],
        }),
        tags: tags,
      }
    );

    // AWS Load Balancer Controller Policy
    const lbControllerPolicy = new aws.iamPolicy.IamPolicy(
      this,
      'lb-controller-policy',
      {
        name: `${clusterName}-AWSLoadBalancerControllerIAMPolicy`,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'iam:CreateServiceLinkedRole',
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
                'ec2:CreateTags',
                'ec2:DeleteTags',
                'ec2:DeleteSecurityGroup',
                'elasticloadbalancing:CreateLoadBalancer',
                'elasticloadbalancing:CreateTargetGroup',
                'elasticloadbalancing:CreateListener',
                'elasticloadbalancing:DeleteListener',
                'elasticloadbalancing:CreateRule',
                'elasticloadbalancing:DeleteRule',
                'elasticloadbalancing:AddTags',
                'elasticloadbalancing:RemoveTags',
                'elasticloadbalancing:ModifyLoadBalancerAttributes',
                'elasticloadbalancing:SetIpAddressType',
                'elasticloadbalancing:SetSecurityGroups',
                'elasticloadbalancing:SetSubnets',
                'elasticloadbalancing:DeleteLoadBalancer',
                'elasticloadbalancing:ModifyTargetGroup',
                'elasticloadbalancing:ModifyTargetGroupAttributes',
                'elasticloadbalancing:RegisterTargets',
                'elasticloadbalancing:DeregisterTargets',
                'elasticloadbalancing:DeleteTargetGroup',
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
        tags: tags,
      }
    );

    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'lb-controller-policy-attachment',
      {
        role: this.awsLoadBalancerControllerRole.name,
        policyArn: lbControllerPolicy.arn,
      }
    );
  }
}

export class EcrRepository extends Construct {
  public readonly repository: aws.ecrRepository.EcrRepository;
  public readonly repositoryUrl: string;

  constructor(
    scope: Construct,
    id: string,
    name: string,
    tags: { [key: string]: string }
  ) {
    super(scope, id);

    this.repository = new aws.ecrRepository.EcrRepository(this, 'repository', {
      name: name,
      imageTagMutability: 'MUTABLE',
      imageScanningConfiguration: {
        scanOnPush: true,
      },
      encryptionConfiguration: {
        encryptionType: 'AES256',
      },
      tags: tags,
    });

    // Lifecycle policy to keep only last 30 images
    new aws.ecrLifecyclePolicy.EcrLifecyclePolicy(this, 'lifecycle-policy', {
      repository: this.repository.name,
      policy: JSON.stringify({
        rules: [
          {
            rulePriority: 1,
            description: 'Keep last 30 images',
            selection: {
              tagStatus: 'any',
              countType: 'imageCountMoreThan',
              countNumber: 30,
            },
            action: {
              type: 'expire',
            },
          },
        ],
      }),
    });

    this.repositoryUrl = this.repository.repositoryUrl;
  }
}

export class EksNodeGroup extends Construct {
  public readonly nodeGroup: aws.eksNodeGroup.EksNodeGroup;

  constructor(
    scope: Construct,
    id: string,
    config: EksNodeGroupConfig
  ) {
    super(scope, id);

    this.nodeGroup = new aws.eksNodeGroup.EksNodeGroup(this, 'node-group', {
      clusterName: config.clusterName,
      nodeGroupName: id,
      nodeRoleArn: config.nodeRoleName,
      subnetIds: config.subnetIds,
      instanceTypes: config.instanceTypes,
      capacityType: config.capacityType || 'ON_DEMAND',
      scalingConfig: {
        desiredSize: config.scalingConfig.desired,
        minSize: config.scalingConfig.min,
        maxSize: config.scalingConfig.max,
      },
      labels: config.labels,
      taints: config.taints,
      tags: config.tags,
      updateConfig: {
        maxUnavailable: 1,
      },
    });
  }
}
```

## 2. `lib/tap-stack.ts` - Main Stack Logic

```typescript
import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput, Fn } from 'cdktf';
import * as aws from '@cdktf/provider-aws';
import {
  VpcConstruct,
  EksSecurityGroups,
  IamRoles,
  EcrRepository,
  EksNodeGroup,
} from './modules';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // AWS Provider
    new aws.provider.AwsProvider(this, 'aws', {
      region: 'us-east-1',
      defaultTags: {
        tags: {
          Environment: 'Production',
          ManagedBy: 'CDK',
        },
      },
    });

    // Data source for availability zones
    const azs = new aws.dataAwsAvailabilityZones.DataAwsAvailabilityZones(
      this,
      'azs',
      {
        state: 'available',
      }
    );

    // Common tags
    const commonTags = {
      Environment: 'Production',
      ManagedBy: 'CDK',
      Project: 'EKS-Production',
    };

    // VPC Configuration
    const vpcConstruct = new VpcConstruct(this, 'vpc', {
      vpcCidr: '10.0.0.0/16',
      availabilityZones: [
        Fn.element(azs.names, 0),
        Fn.element(azs.names, 1),
        Fn.element(azs.names, 2),
      ],
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'],
      privateSubnetCidrs: ['10.0.10.0/24', '10.0.11.0/24', '10.0.12.0/24'],
      tags: commonTags,
    });

    // Security Groups
    const securityGroups = new EksSecurityGroups(
      this,
      'eks-security',
      vpcConstruct.vpc.id,
      commonTags
    );

    // ECR Repository
    const ecrRepo = new EcrRepository(
      this,
      'ecr',
      'production-app',
      commonTags
    );

    // EKS Cluster
    const eksCluster = new aws.eksCluster.EksCluster(this, 'eks-cluster', {
      name: 'eks-production',
      version: '1.28',
      roleArn: '', // Will be set after IAM role creation
      vpcConfig: {
        subnetIds: vpcConstruct.privateSubnets.map(s => s.id),
        securityGroupIds: [securityGroups.clusterSecurityGroup.id],
        endpointPrivateAccess: true,
        endpointPublicAccess: true,
        publicAccessCidrs: ['0.0.0.0/0'],
      },
      enabledClusterLogTypes: ['api', 'controllerManager', 'scheduler'],
      encryptionConfig: {
        resources: ['secrets'],
        provider: {
          keyArn: new aws.kmsKey.KmsKey(this, 'eks-kms-key', {
            description: 'KMS key for EKS cluster encryption',
            enableKeyRotation: true,
            tags: commonTags,
          }).arn,
        },
      },
      tags: commonTags,
    });

    // Create temporary IAM roles first (to get the role ARN)
    const tempClusterRole = new aws.iamRole.IamRole(this, 'temp-cluster-role', {
      name: 'eks-production-cluster-role-temp',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'eks.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: commonTags,
    });

    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'temp-cluster-policy',
      {
        role: tempClusterRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy',
      }
    );

    // Update EKS cluster with role ARN
    eksCluster.roleArn = tempClusterRole.arn;

    // OIDC Provider for IRSA
    const eksOidcIssuerUrl = eksCluster.identity.get(0).oidc.get(0).issuer;
    
    const oidcProvider = new aws.iamOpenidConnectProvider.IamOpenidConnectProvider(
      this,
      'eks-oidc-provider',
      {
        url: eksOidcIssuerUrl,
        clientIdList: ['sts.amazonaws.com'],
        thumbprintList: ['9e99a48a9960b14926bb7f3b02e22da2b0ab7280'],
        tags: commonTags,
      }
    );

    // Create IAM Roles with OIDC
    const iamRoles = new IamRoles(
      this,
      'iam',
      'eks-production',
      oidcProvider.arn,
      eksOidcIssuerUrl,
      commonTags
    );

    // Create temporary node role
    const tempNodeRole = new aws.iamRole.IamRole(this, 'temp-node-role', {
      name: 'eks-production-node-role-temp',
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
      tags: commonTags,
    });

    const nodePolicies = [
      'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy',
      'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy',
      'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
      'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    ];

    nodePolicies.forEach((policyArn, index) => {
      new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
        this,
        `temp-node-policy-${index}`,
        {
          role: tempNodeRole.name,
          policyArn: policyArn,
        }
      );
    });

    // EKS Managed Node Groups
    
    // System Node Group (for system workloads)
    const systemNodeGroup = new EksNodeGroup(this, 'system-node-group', {
      clusterName: eksCluster.name,
      nodeRoleName: tempNodeRole.arn,
      subnetIds: vpcConstruct.privateSubnets.map(s => s.id),
      instanceTypes: ['t3.medium'],
      scalingConfig: {
        desired: 2,
        min: 2,
        max: 2,
      },
      capacityType: 'ON_DEMAND',
      labels: {
        'node-type': 'system',
        'workload': 'system',
      },
      taints: [
        {
          key: 'system',
          value: 'true',
          effect: 'NO_SCHEDULE',
        },
      ],
      tags: {
        ...commonTags,
        NodeGroup: 'system',
      },
    });

    // Application Node Group (for application workloads)
    const appNodeGroup = new EksNodeGroup(this, 'app-node-group', {
      clusterName: eksCluster.name,
      nodeRoleName: tempNodeRole.arn,
      subnetIds: vpcConstruct.privateSubnets.map(s => s.id),
      instanceTypes: ['m5.large'],
      scalingConfig: {
        desired: 3,
        min: 3,
        max: 10,
      },
      capacityType: 'ON_DEMAND',
      labels: {
        'node-type': 'application',
        'workload': 'application',
      },
      tags: {
        ...commonTags,
        NodeGroup: 'application',
        'k8s.io/cluster-autoscaler/eks-production': 'owned',
        'k8s.io/cluster-autoscaler/enabled': 'true',
      },
    });

    // Application Node Group - Spot Instances
    const appNodeGroupSpot = new EksNodeGroup(this, 'app-node-group-spot', {
      clusterName: eksCluster.name,
      nodeRoleName: tempNodeRole.arn,
      subnetIds: vpcConstruct.privateSubnets.map(s => s.id),
      instanceTypes: ['m5.large', 'm5a.large', 'm5n.large'],
      scalingConfig: {
        desired: 0,
        min: 0,
        max: 5,
      },
      capacityType: 'SPOT',
      labels: {
        'node-type': 'application-spot',
        'workload': 'application',
        'capacity-type': 'spot',
      },
      taints: [
        {
          key: 'spot',
          value: 'true',
          effect: 'NO_SCHEDULE',
        },
      ],
      tags: {
        ...commonTags,
        NodeGroup: 'application-spot',
        'k8s.io/cluster-autoscaler/eks-production': 'owned',
        'k8s.io/cluster-autoscaler/enabled': 'true',
      },
    });

    // EKS Add-ons
    const coreDnsAddon = new aws.eksAddon.EksAddon(this, 'coredns-addon', {
      clusterName: eksCluster.name,
      addonName: 'coredns',
      addonVersion: 'v1.10.1-eksbuild.5',
      resolveConflictsOnCreate: 'OVERWRITE',
      tags: commonTags,
    });

    const kubeProxyAddon = new aws.eksAddon.EksAddon(this, 'kube-proxy-addon', {
      clusterName: eksCluster.name,
      addonName: 'kube-proxy',
      addonVersion: 'v1.28.2-eksbuild.2',
      resolveConflictsOnCreate: 'OVERWRITE',
      tags: commonTags,
    });

    const vpcCniAddon = new aws.eksAddon.EksAddon(this, 'vpc-cni-addon', {
      clusterName: eksCluster.name,
      addonName: 'vpc-cni',
      addonVersion: 'v1.15.1-eksbuild.1',
      resolveConflictsOnCreate: 'OVERWRITE',
      tags: commonTags,
    });

    const ebsCsiAddon = new aws.eksAddon.EksAddon(this, 'ebs-csi-addon', {
      clusterName: eksCluster.name,
      addonName: 'aws-ebs-csi-driver',
      addonVersion: 'v1.24.0-eksbuild.1',
      resolveConflictsOnCreate: 'OVERWRITE',
      tags: commonTags,
    });

    // Pod Security Standards - Create ConfigMap for baseline enforcement
    const podSecurityConfigMap = new aws.dataAwsEksClusterAuth.DataAwsEksClusterAuth(
      this,
      'cluster-auth',
      {
        name: eksCluster.name,
      }
    );

    // Outputs
    new TerraformOutput(this, 'cluster-name', {
      value: eksCluster.name,
      description: 'EKS Cluster Name',
    });

    new TerraformOutput(this, 'cluster-endpoint', {
      value: eksCluster.endpoint,
      description: 'EKS Cluster Endpoint',
    });

    new TerraformOutput(this, 'cluster-security-group', {
      value: securityGroups.clusterSecurityGroup.id,
      description: 'EKS Cluster Security Group ID',
    });

    new TerraformOutput(this, 'oidc-provider-arn', {
      value: oidcProvider.arn,
      description: 'OIDC Provider ARN',
    });

    new TerraformOutput(this, 'oidc-provider-url', {
      value: eksOidcIssuerUrl,
      description: 'OIDC Provider URL',
    });

    new TerraformOutput(this, 'kubectl-config-command', {
      value: `aws eks update-kubeconfig --region us-east-1 --name ${eksCluster.name}`,
      description: 'Command to configure kubectl',
    });

    new TerraformOutput(this, 'ecr-repository-uri', {
      value: ecrRepo.repositoryUrl,
      description: 'ECR Repository URI',
    });

    new TerraformOutput(this, 'vpc-id', {
      value: vpcConstruct.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpcConstruct.privateSubnets.map(s => s.id).join(','),
      description: 'Private Subnet IDs',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpcConstruct.publicSubnets.map(s => s.id).join(','),
      description: 'Public Subnet IDs',
    });

    new TerraformOutput(this, 'cluster-autoscaler-role-arn', {
      value: iamRoles.clusterAutoscalerRole.arn,
      description: 'Cluster Autoscaler IAM Role ARN',
    });

    new TerraformOutput(this, 'aws-load-balancer-controller-role-arn', {
      value: iamRoles.awsLoadBalancerControllerRole.arn,
      description: 'AWS Load Balancer Controller IAM Role ARN',
    });

    // Additional outputs for post-deployment configuration
    new TerraformOutput(this, 'cluster-autoscaler-sa-annotation', {
      value: `eks.amazonaws.com/role-arn=${iamRoles.clusterAutoscalerRole.arn}`,
      description: 'Service Account annotation for Cluster Autoscaler',
    });

    new TerraformOutput(this, 'aws-lb-controller-sa-annotation', {
      value: `eks.amazonaws.com/role-arn=${iamRoles.awsLoadBalancerControllerRole.arn}`,
      description: 'Service Account annotation for AWS Load Balancer Controller',
    });

    new TerraformOutput(this, 'ecr-login-command', {
      value: `aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${ecrRepo.repositoryUrl}`,
      description: 'ECR Login Command',
    });
  }
}
```