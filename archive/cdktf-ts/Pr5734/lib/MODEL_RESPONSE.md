## **lib/modules.ts**

```typescript
import { Construct } from 'constructs';
import * as aws from '@cdktf/provider-aws';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { Fn, TerraformOutput } from 'cdktf';

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
        ...config.tags
      }
    });

    // Get availability zones
    const azs = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available'
    });

    // Create Internet Gateway
    this.internetGateway = new aws.internetGateway.InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${id}-igw`,
        ...config.tags
      }
    });

    // Create public route table
    const publicRouteTable = new aws.routeTable.RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${id}-public-rt`,
        ...config.tags
      }
    });

    new aws.route.Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id
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
          ...config.tags
        }
      });
      this.publicSubnets.push(publicSubnet);

      new aws.routeTableAssociation.RouteTableAssociation(this, `public-rta-${i}`, {
        subnetId: publicSubnet.id,
        routeTableId: publicRouteTable.id
      });

      // Elastic IP for NAT
      const eip = new aws.eip.Eip(this, `nat-eip-${i}`, {
        domain: 'vpc',
        tags: {
          Name: `${id}-nat-eip-${i + 1}`,
          ...config.tags
        }
      });

      // NAT Gateway
      const natGateway = new aws.natGateway.NatGateway(this, `nat-${i}`, {
        allocationId: eip.id,
        subnetId: publicSubnet.id,
        tags: {
          Name: `${id}-nat-${i + 1}`,
          ...config.tags
        }
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
          ...config.tags
        }
      });
      this.privateSubnets.push(privateSubnet);

      // Private route table
      const privateRouteTable = new aws.routeTable.RouteTable(this, `private-rt-${i}`, {
        vpcId: this.vpc.id,
        tags: {
          Name: `${id}-private-rt-${i + 1}`,
          ...config.tags
        }
      });

      new aws.route.Route(this, `private-route-${i}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateway.id
      });

      new aws.routeTableAssociation.RouteTableAssociation(this, `private-rta-${i}`, {
        subnetId: privateSubnet.id,
        routeTableId: privateRouteTable.id
      });
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
      tags: config.tags
    });

    // Add ingress rules
    config.ingressRules?.forEach((rule, index) => {
      new aws.securityGroupRule.SecurityGroupRule(this, `ingress-${index}`, {
        ...rule,
        type: 'ingress',
        securityGroupId: this.securityGroup.id
      });
    });

    // Add egress rules
    config.egressRules?.forEach((rule, index) => {
      new aws.securityGroupRule.SecurityGroupRule(this, `egress-${index}`, {
        ...rule,
        type: 'egress',
        securityGroupId: this.securityGroup.id
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
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'eks.amazonaws.com'
          }
        }]
      }),
      tags: config.tags
    });

    // Attach required policies to cluster role
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(this, 'cluster-policy', {
      policyArn: 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy',
      role: this.clusterRole.name
    });

    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(this, 'service-policy', {
      policyArn: 'arn:aws:iam::aws:policy/AmazonEKSServicePolicy',
      role: this.clusterRole.name
    });

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
        publicAccessCidrs: ['0.0.0.0/0']
      },
      enabledClusterLogTypes: [
        'api',
        'audit',
        'authenticator',
        'controllerManager',
        'scheduler'
      ],
      tags: config.tags
    });

    // IAM role for node groups
    this.nodeRole = new aws.iamRole.IamRole(this, 'node-role', {
      name: `${config.name}-node-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'ec2.amazonaws.com'
          }
        }]
      }),
      tags: config.tags
    });

    // Attach required policies to node role
    const nodePolicies = [
      'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy',
      'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy',
      'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
      'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
    ];

    nodePolicies.forEach((policyArn, index) => {
      new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(this, `node-policy-${index}`, {
        policyArn,
        role: this.nodeRole.name
      });
    });

    // OIDC Provider for IRSA
    const eksOidc = this.cluster.identity.get(0).oidc.get(0);
    
    this.oidcProvider = new aws.iamOpenidConnectProvider.IamOpenidConnectProvider(this, 'oidc-provider', {
      clientIdList: ['sts.amazonaws.com'],
      thumbprintList: ['9e99a48a9960b14926bb7f3b02e22da2b0ab7280'],
      url: eksOidc.issuer,
      tags: config.tags
    });
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
  tags?: { [key: string]: string };
}

export class ManagedNodeGroupConstruct extends Construct {
  public readonly nodeGroup: aws.eksNodeGroup.EksNodeGroup;

  constructor(scope: Construct, id: string, config: NodeGroupConfig) {
    super(scope, id);

    // AMI type based on architecture
    const amiType = config.architecture === 'arm64' ? 'AL2_ARM_64' : 'AL2_x86_64';

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
        desiredSize: config.desiredSize
      },
      updateConfig: {
        maxUnavailable: 1
      },
      labels: {
        architecture: config.architecture,
        nodegroup: config.nodeGroupName
      },
      tags: {
        ...config.tags,
        Architecture: config.architecture
      }
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
      tags: config.tags
    });

    this.targetGroup = new aws.lbTargetGroup.LbTargetGroup(this, 'target-group', {
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
        matcher: '200'
      },
      tags: config.tags
    });

    this.listener = new aws.lbListener.LbListener(this, 'listener', {
      loadBalancerArn: this.alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [{
        type: 'forward',
        targetGroupArn: this.targetGroup.arn
      }]
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
        Statement: [{
          Effect: 'Allow',
          Principal: {
            Federated: oidcProviderArn
          },
          Action: 'sts:AssumeRoleWithWebIdentity',
          Condition: {
            StringEquals: {
              [`${oidcProviderArn.split('/')[1]}:sub`]: `system:serviceaccount:${namespace}:${serviceAccount}`,
              [`${oidcProviderArn.split('/')[1]}:aud`]: 'sts.amazonaws.com'
            }
          }
        }]
      }),
      tags
    });

    policyArns.forEach((policyArn, index) => {
      new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(this, `policy-${index}`, {
        policyArn,
        role: this.role.name
      });
    });
  }
}
```

## **lib/tap-stack.ts**

```typescript
import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput, Fn } from 'cdktf';
import * as aws from '@cdktf/provider-aws';
import {
  VpcConstruct,
  SecurityGroupConstruct,
  EksClusterConstruct,
  ManagedNodeGroupConstruct,
  AlbConstruct,
  IrsaRoleConstruct
} from './modules';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // AWS Provider Configuration
    new aws.provider.AwsProvider(this, 'aws', {
      region: 'us-east-1',
      defaultTags: [{
        tags: {
          Environment: 'production',
          ManagedBy: 'terraform',
          Project: 'eks-ha-cluster'
        }
      }]
    });

    // Common tags
    const commonTags = {
      Environment: 'production',
      Terraform: 'true',
      Project: 'eks-ha-cluster'
    };

    // VPC Configuration
    const vpc = new VpcConstruct(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      tags: commonTags
    });

    // Security Groups
    // EKS Control Plane Security Group
    const eksControlPlaneSg = new SecurityGroupConstruct(this, 'eks-control-plane-sg', {
      vpcId: vpc.vpc.id,
      name: 'eks-control-plane-sg',
      description: 'Security group for EKS control plane',
      ingressRules: [
        {
          protocol: 'tcp',
          fromPort: 443,
          toPort: 443,
          cidrBlocks: ['10.0.0.0/16'],
          description: 'Allow HTTPS from VPC'
        }
      ],
      egressRules: [
        {
          protocol: '-1',
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound traffic'
        }
      ],
      tags: commonTags
    });

    // ALB Security Group
    const albSg = new SecurityGroupConstruct(this, 'alb-sg', {
      vpcId: vpc.vpc.id,
      name: 'alb-sg',
      description: 'Security group for Application Load Balancer',
      ingressRules: [
        {
          protocol: 'tcp',
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTP from anywhere'
        },
        {
          protocol: 'tcp',
          fromPort: 443,
          toPort: 443,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTPS from anywhere'
        }
      ],
      egressRules: [
        {
          protocol: '-1',
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound traffic'
        }
      ],
      tags: commonTags
    });

    // Node Security Group
    const nodeSg = new SecurityGroupConstruct(this, 'node-sg', {
      vpcId: vpc.vpc.id,
      name: 'eks-node-sg',
      description: 'Security group for EKS nodes',
      ingressRules: [
        {
          protocol: '-1',
          fromPort: 0,
          toPort: 0,
          selfAttribute: true,
          description: 'Allow all traffic from nodes'
        },
        {
          protocol: 'tcp',
          fromPort: 443,
          toPort: 443,
          sourceSecurityGroupId: eksControlPlaneSg.securityGroup.id,
          description: 'Allow API server to communicate with kubelet'
        },
        {
          protocol: 'tcp',
          fromPort: 10250,
          toPort: 10250,
          sourceSecurityGroupId: eksControlPlaneSg.securityGroup.id,
          description: 'Allow API server to communicate with kubelet'
        },
        {
          protocol: 'tcp',
          fromPort: 53,
          toPort: 53,
          cidrBlocks: ['10.0.0.0/16'],
          description: 'Allow DNS'
        },
        {
          protocol: 'udp',
          fromPort: 53,
          toPort: 53,
          cidrBlocks: ['10.0.0.0/16'],
          description: 'Allow DNS'
        },
        {
          protocol: 'tcp',
          fromPort: 1025,
          toPort: 65535,
          sourceSecurityGroupId: albSg.securityGroup.id,
          description: 'Allow ALB to reach nodes'
        }
      ],
      egressRules: [
        {
          protocol: '-1',
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound traffic'
        }
      ],
      tags: commonTags
    });

    // EKS Cluster
    const eksCluster = new EksClusterConstruct(this, 'eks', {
      name: 'production-eks-cluster',
      version: '1.28',
      subnetIds: [...vpc.privateSubnets.map(s => s.id), ...vpc.publicSubnets.map(s => s.id)],
      securityGroupIds: [eksControlPlaneSg.securityGroup.id],
      tags: {
        ...commonTags,
        'kubernetes.io/cluster/production-eks-cluster': 'owned'
      }
    });

    // Additional security group rules for cluster-node communication
    new aws.securityGroupRule.SecurityGroupRule(this, 'cluster-ingress-node-https', {
      type: 'ingress',
      protocol: 'tcp',
      fromPort: 443,
      toPort: 443,
      sourceSecurityGroupId: nodeSg.securityGroup.id,
      securityGroupId: eksControlPlaneSg.securityGroup.id,
      description: 'Allow nodes to communicate with cluster API'
    });

    // x86_64 Node Group (t3.medium)
    const x86NodeGroup = new ManagedNodeGroupConstruct(this, 'x86-node-group', {
      clusterName: eksCluster.cluster.name,
      nodeGroupName: 'x86-node-group',
      nodeRoleArn: eksCluster.nodeRole.arn,
      subnetIds: vpc.privateSubnets.map(s => s.id),
      instanceTypes: ['t3.medium'],
      architecture: 'x86_64',
      minSize: 2,
      maxSize: 10,
      desiredSize: 3,
      diskSize: 20,
      tags: {
        ...commonTags,
        NodeGroup: 'x86'
      }
    });

    // ARM64 Node Group (t4g.medium)
    const armNodeGroup = new ManagedNodeGroupConstruct(this, 'arm-node-group', {
      clusterName: eksCluster.cluster.name,
      nodeGroupName: 'arm-node-group',
      nodeRoleArn: eksCluster.nodeRole.arn,
      subnetIds: vpc.privateSubnets.map(s => s.id),
      instanceTypes: ['t4g.medium'],
      architecture: 'arm64',
      minSize: 2,
      maxSize: 10,
      desiredSize: 3,
      diskSize: 20,
      tags: {
        ...commonTags,
        NodeGroup: 'arm64'
      }
    });

    // Application Load Balancer
    const alb = new AlbConstruct(this, 'alb', {
      name: 'eks-ingress-alb',
      vpcId: vpc.vpc.id,
      subnetIds: vpc.publicSubnets.map(s => s.id),
      securityGroupId: albSg.securityGroup.id,
      tags: commonTags
    });

    // AWS Load Balancer Controller IRSA Role
    const albControllerRole = new IrsaRoleConstruct(
      this,
      'alb-controller-irsa',
      eksCluster.cluster.name,
      eksCluster.oidcProvider.arn,
      'kube-system',
      'aws-load-balancer-controller',
      ['arn:aws:iam::aws:policy/ElasticLoadBalancingFullAccess'],
      commonTags
    );

    // EBS CSI Driver IRSA Role
    const ebsCsiRole = new IrsaRoleConstruct(
      this,
      'ebs-csi-irsa',
      eksCluster.cluster.name,
      eksCluster.oidcProvider.arn,
      'kube-system',
      'ebs-csi-controller-sa',
      ['arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy'],
      commonTags
    );

    // VPC CNI IRSA Role with custom policy
    const vpcCniPolicy = new aws.iamPolicy.IamPolicy(this, 'vpc-cni-policy', {
      name: 'eks-vpc-cni-policy',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'ec2:AssignPrivateIpAddresses',
              'ec2:AttachNetworkInterface',
              'ec2:CreateNetworkInterface',
              'ec2:DeleteNetworkInterface',
              'ec2:DescribeInstances',
              'ec2:DescribeTags',
              'ec2:DescribeNetworkInterfaces',
              'ec2:DescribeInstanceTypes',
              'ec2:DetachNetworkInterface',
              'ec2:ModifyNetworkInterfaceAttribute',
              'ec2:UnassignPrivateIpAddresses'
            ],
            Resource: '*'
          },
          {
            Effect: 'Allow',
            Action: ['ec2:CreateTags'],
            Resource: 'arn:aws:ec2:*:*:network-interface/*'
          }
        ]
      })
    });

    const vpcCniRole = new IrsaRoleConstruct(
      this,
      'vpc-cni-irsa',
      eksCluster.cluster.name,
      eksCluster.oidcProvider.arn,
      'kube-system',
      'aws-node',
      [vpcCniPolicy.arn],
      commonTags
    );

    // ConfigMap for aws-auth
    const awsAuthConfigMap = new aws.dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(this, 'aws-auth', {
      statement: [{
        actions: ['sts:AssumeRole'],
        effect: 'Allow',
        principals: [{
          type: 'AWS',
          identifiers: [eksCluster.nodeRole.arn]
        }]
      }]
    });

    // Outputs
    new TerraformOutput(this, 'cluster-endpoint', {
      value: eksCluster.cluster.endpoint,
      description: 'EKS cluster endpoint'
    });

    new TerraformOutput(this, 'cluster-name', {
      value: eksCluster.cluster.name,
      description: 'EKS cluster name'
    });

    new TerraformOutput(this, 'cluster-certificate-authority', {
      value: eksCluster.cluster.certificateAuthority.get(0).data,
      description: 'EKS cluster certificate authority data',
      sensitive: true
    });

    new TerraformOutput(this, 'vpc-id', {
      value: vpc.vpc.id,
      description: 'VPC ID'
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpc.privateSubnets.map(s => s.id),
      description: 'Private subnet IDs'
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpc.publicSubnets.map(s => s.id),
      description: 'Public subnet IDs'
    });

    new TerraformOutput(this, 'alb-dns', {
      value: alb.alb.dnsName,
      description: 'Application Load Balancer DNS name'
    });

    new TerraformOutput(this, 'alb-controller-role-arn', {
      value: albControllerRole.role.arn,
      description: 'IAM role ARN for AWS Load Balancer Controller'
    });

    new TerraformOutput(this, 'ebs-csi-role-arn', {
      value: ebsCsiRole.role.arn,
      description: 'IAM role ARN for EBS CSI Driver'
    });

    new TerraformOutput(this, 'vpc-cni-role-arn', {
      value: vpcCniRole.role.arn,
      description: 'IAM role ARN for VPC CNI'
    });

    // Kubeconfig output
    new TerraformOutput(this, 'kubeconfig', {
      value: Fn.jsonencode({
        apiVersion: 'v1',
        kind: 'Config',
        clusters: [{
          name: eksCluster.cluster.name,
          cluster: {
            server: eksCluster.cluster.endpoint,
            'certificate-authority-data': eksCluster.cluster.certificateAuthority.get(0).data
          }
        }],
        contexts: [{
          name: eksCluster.cluster.name,
          context: {
            cluster: eksCluster.cluster.name,
            user: eksCluster.cluster.name
          }
        }],
        'current-context': eksCluster.cluster.name,
        users: [{
          name: eksCluster.cluster.name,
          user: {
            exec: {
              apiVersion: 'client.authentication.k8s.io/v1beta1',
              command: 'aws',
              args: [
                'eks',
                'get-token',
                '--cluster-name',
                eksCluster.cluster.name,
                '--region',
                'us-east-1'
              ]
            }
          }
        }]
      }),
      description: 'Kubeconfig for kubectl access',
      sensitive: true
    });

    // Update kubeconfig command
    new TerraformOutput(this, 'update-kubeconfig-command', {
      value: `aws eks update-kubeconfig --region us-east-1 --name ${eksCluster.cluster.name}`,
      description: 'Command to update local kubeconfig'
    });
  }
}
```
