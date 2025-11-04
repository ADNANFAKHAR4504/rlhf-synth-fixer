import { Construct } from 'constructs';
import * as aws from '@cdktf/provider-aws';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { Fn } from 'cdktf';

export interface VpcConfig {
  cidrBlock: string;
  enableDnsHostnames?: boolean;
  enableDnsSupport?: boolean;
  tags?: { [key: string]: string };
}

export class VpcConstruct extends Construct {
  public readonly vpc: aws.vpc.Vpc;
  public readonly publicSubnets: aws.subnet.Subnet[] = [];
  public readonly privateSubnets: aws.subnet.Subnet[] = [];
  public readonly natGateways: aws.natGateway.NatGateway[] = [];
  public readonly internetGateway: aws.internetGateway.InternetGateway;

  constructor(scope: Construct, id: string, config: VpcConfig) {
    super(scope, id);

    // Create VPC
    this.vpc = new aws.vpc.Vpc(this, 'vpc', {
      cidrBlock: config.cidrBlock,
      enableDnsHostnames: config.enableDnsHostnames ?? true,
      enableDnsSupport: config.enableDnsSupport ?? true,
      tags: {
        Name: `${id}-vpc`,
        ...config.tags,
      },
    });

    // Get availability zones
    const azs = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    // Create Internet Gateway
    this.internetGateway = new aws.internetGateway.InternetGateway(
      this,
      'igw',
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `${id}-igw`,
          ...config.tags,
        },
      }
    );

    // Create public route table
    const publicRouteTable = new aws.routeTable.RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${id}-public-rt`,
        ...config.tags,
      },
    });

    new aws.route.Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    // Create subnets and NAT gateways for 3 AZs
    for (let i = 0; i < 3; i++) {
      // Public subnet
      const publicSubnet = new aws.subnet.Subnet(this, `public-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i * 2}.0/24`,
        availabilityZone: Fn.element(azs.names, i),
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${id}-public-subnet-${i + 1}`,
          'kubernetes.io/role/elb': '1',
          ...config.tags,
        },
      });
      this.publicSubnets.push(publicSubnet);

      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `public-rta-${i}`,
        {
          subnetId: publicSubnet.id,
          routeTableId: publicRouteTable.id,
        }
      );

      // Elastic IP for NAT
      const eip = new aws.eip.Eip(this, `nat-eip-${i}`, {
        domain: 'vpc',
        tags: {
          Name: `${id}-nat-eip-${i + 1}`,
          ...config.tags,
        },
      });

      // NAT Gateway
      const natGateway = new aws.natGateway.NatGateway(this, `nat-${i}`, {
        allocationId: eip.id,
        subnetId: publicSubnet.id,
        tags: {
          Name: `${id}-nat-${i + 1}`,
          ...config.tags,
        },
      });
      this.natGateways.push(natGateway);

      // Private subnet
      const privateSubnet = new aws.subnet.Subnet(this, `private-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i * 2 + 1}.0/24`,
        availabilityZone: Fn.element(azs.names, i),
        tags: {
          Name: `${id}-private-subnet-${i + 1}`,
          'kubernetes.io/role/internal-elb': '1',
          ...config.tags,
        },
      });
      this.privateSubnets.push(privateSubnet);

      // Private route table
      const privateRouteTable = new aws.routeTable.RouteTable(
        this,
        `private-rt-${i}`,
        {
          vpcId: this.vpc.id,
          tags: {
            Name: `${id}-private-rt-${i + 1}`,
            ...config.tags,
          },
        }
      );

      new aws.route.Route(this, `private-route-${i}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateway.id,
      });

      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `private-rta-${i}`,
        {
          subnetId: privateSubnet.id,
          routeTableId: privateRouteTable.id,
        }
      );
    }
  }
}

export interface SecurityGroupConfig {
  vpcId: string;
  name: string;
  description: string;
  ingressRules?: aws.securityGroupRule.SecurityGroupRuleConfig[];
  egressRules?: aws.securityGroupRule.SecurityGroupRuleConfig[];
  tags?: { [key: string]: string };
}

export class SecurityGroupConstruct extends Construct {
  public readonly securityGroup: aws.securityGroup.SecurityGroup;

  constructor(scope: Construct, id: string, config: SecurityGroupConfig) {
    super(scope, id);

    this.securityGroup = new aws.securityGroup.SecurityGroup(this, 'sg', {
      vpcId: config.vpcId,
      name: config.name,
      description: config.description,
      tags: config.tags,
    });

    // Add ingress rules
    config.ingressRules?.forEach((rule, index) => {
      new aws.securityGroupRule.SecurityGroupRule(this, `ingress-${index}`, {
        ...rule,
        type: 'ingress',
        securityGroupId: this.securityGroup.id,
      });
    });

    // Add egress rules
    config.egressRules?.forEach((rule, index) => {
      new aws.securityGroupRule.SecurityGroupRule(this, `egress-${index}`, {
        ...rule,
        type: 'egress',
        securityGroupId: this.securityGroup.id,
      });
    });
  }
}

export interface EksClusterConfig {
  name: string;
  version: string;
  subnetIds: string[];
  securityGroupIds?: string[];
  tags?: { [key: string]: string };
}

export class EksClusterConstruct extends Construct {
  public readonly cluster: aws.eksCluster.EksCluster;
  public readonly clusterRole: aws.iamRole.IamRole;
  public readonly nodeRole: aws.iamRole.IamRole;
  public readonly oidcProvider: aws.iamOpenidConnectProvider.IamOpenidConnectProvider;

  constructor(scope: Construct, id: string, config: EksClusterConfig) {
    super(scope, id);

    // IAM role for EKS cluster
    this.clusterRole = new aws.iamRole.IamRole(this, 'cluster-role', {
      name: `${config.name}-cluster-role`,
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
      tags: config.tags,
    });

    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'cluster-policy',
      {
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy',
        role: this.clusterRole.name,
      }
    );

    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'service-policy',
      {
        policyArn: 'arn:aws:iam::aws:policy/AmazonEKSServicePolicy',
        role: this.clusterRole.name,
      }
    );

    // Create EKS cluster
    this.cluster = new aws.eksCluster.EksCluster(this, 'cluster', {
      name: config.name,
      version: config.version,
      roleArn: this.clusterRole.arn,
      vpcConfig: {
        subnetIds: config.subnetIds,
        securityGroupIds: config.securityGroupIds,
        endpointPrivateAccess: true,
        endpointPublicAccess: true,
        publicAccessCidrs: ['0.0.0.0/0'],
      },
      enabledClusterLogTypes: [
        'api',
        'audit',
        'authenticator',
        'controllerManager',
        'scheduler',
      ],
      tags: config.tags,
    });

    // IAM role for node groups
    this.nodeRole = new aws.iamRole.IamRole(this, 'node-role', {
      name: `${config.name}-node-role`,
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
      tags: config.tags,
    });

    // Attach required policies to node role
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
          policyArn,
          role: this.nodeRole.name,
        }
      );
    });

    // OIDC Provider for IRSA
    const eksOidc = this.cluster.identity.get(0).oidc.get(0);

    this.oidcProvider =
      new aws.iamOpenidConnectProvider.IamOpenidConnectProvider(
        this,
        'oidc-provider',
        {
          clientIdList: ['sts.amazonaws.com'],
          thumbprintList: ['9e99a48a9960b14926bb7f3b02e22da2b0ab7280'],
          url: eksOidc.issuer,
          tags: config.tags,
        }
      );
  }
}

export interface NodeGroupConfig {
  clusterName: string;
  nodeGroupName: string;
  nodeRoleArn: string;
  subnetIds: string[];
  instanceTypes: string[];
  architecture: 'x86_64' | 'arm64';
  minSize: number;
  maxSize: number;
  desiredSize: number;
  diskSize?: number;
  diskEncrypted?: boolean;
  tags?: { [key: string]: string };
}

export class ManagedNodeGroupConstruct extends Construct {
  public readonly nodeGroup: aws.eksNodeGroup.EksNodeGroup;

  constructor(scope: Construct, id: string, config: NodeGroupConfig) {
    super(scope, id);

    // AMI type based on architecture
    const amiType =
      config.architecture === 'arm64' ? 'AL2_ARM_64' : 'AL2_x86_64';

    this.nodeGroup = new aws.eksNodeGroup.EksNodeGroup(this, 'node-group', {
      clusterName: config.clusterName,
      nodeGroupName: config.nodeGroupName,
      nodeRoleArn: config.nodeRoleArn,
      subnetIds: config.subnetIds,
      instanceTypes: config.instanceTypes,
      amiType,
      diskSize: config.diskSize ?? 20,
      scalingConfig: {
        minSize: config.minSize,
        maxSize: config.maxSize,
        desiredSize: config.desiredSize,
      },
      updateConfig: {
        maxUnavailable: 1,
      },
      labels: {
        architecture: config.architecture,
        nodegroup: config.nodeGroupName,
      },
      tags: {
        ...config.tags,
        Architecture: config.architecture,
      },
    });
  }
}

export interface AlbConfig {
  name: string;
  vpcId: string;
  subnetIds: string[];
  securityGroupId: string;
  tags?: { [key: string]: string };
}

export class AlbConstruct extends Construct {
  public readonly alb: aws.lb.Lb;
  public readonly targetGroup: aws.lbTargetGroup.LbTargetGroup;
  public readonly listener: aws.lbListener.LbListener;

  constructor(scope: Construct, id: string, config: AlbConfig) {
    super(scope, id);

    this.alb = new aws.lb.Lb(this, 'alb', {
      name: config.name,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [config.securityGroupId],
      subnets: config.subnetIds,
      enableDeletionProtection: false,
      enableHttp2: true,
      enableCrossZoneLoadBalancing: true,
      tags: config.tags,
    });

    this.targetGroup = new aws.lbTargetGroup.LbTargetGroup(
      this,
      'target-group',
      {
        name: `${config.name}-tg`,
        port: 80,
        protocol: 'HTTP',
        vpcId: config.vpcId,
        targetType: 'ip',
        healthCheck: {
          enabled: true,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
          timeout: 5,
          interval: 30,
          path: '/healthz',
          matcher: '200',
        },
        tags: config.tags,
      }
    );

    this.listener = new aws.lbListener.LbListener(this, 'listener', {
      loadBalancerArn: this.alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: this.targetGroup.arn,
        },
      ],
    });
  }
}

export class IrsaRoleConstruct extends Construct {
  public readonly role: aws.iamRole.IamRole;

  constructor(
    scope: Construct,
    id: string,
    clusterName: string,
    oidcProviderArn: string,
    namespace: string,
    serviceAccount: string,
    policyArns: string[],
    tags?: { [key: string]: string }
  ) {
    super(scope, id);

    this.role = new aws.iamRole.IamRole(this, 'role', {
      name: `${clusterName}-${namespace}-${serviceAccount}-role`,
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
                [`${oidcProviderArn.split('/')[1]}:sub`]: `system:serviceaccount:${namespace}:${serviceAccount}`,
                [`${oidcProviderArn.split('/')[1]}:aud`]: 'sts.amazonaws.com',
              },
            },
          },
        ],
      }),
      tags,
    });

    policyArns.forEach((policyArn, index) => {
      new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
        this,
        `policy-${index}`,
        {
          policyArn,
          role: this.role.name,
        }
      );
    });
  }
}
