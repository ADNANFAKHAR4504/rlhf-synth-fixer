import { Construct } from 'constructs';
import * as aws from '@cdktf/provider-aws';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamOpenidConnectProvider } from '@cdktf/provider-aws/lib/iam-openid-connect-provider';
import { DataTlsCertificate } from '@cdktf/provider-tls/lib/data-tls-certificate';

export interface VpcConfig {
  vpcCidr: string;
  azCount: number;
  tags: { [key: string]: string };
}

export interface EksConfig {
  clusterName: string;
  kubernetesVersion: string;
  tags: { [key: string]: string };
}

export interface NodeGroupConfig {
  name: string;
  instanceTypes: string[];
  minSize: number;
  maxSize: number;
  desiredSize: number;
  diskSize: number;
  labels?: { [key: string]: string };
  taints?: Array<{
    key: string;
    value: string;
    effect: string;
  }>;
}

export class NetworkModule extends Construct {
  public vpc: aws.vpc.Vpc;
  public privateSubnets: aws.subnet.Subnet[];
  public publicSubnets: aws.subnet.Subnet[];
  public natGateways: aws.natGateway.NatGateway[];

  constructor(scope: Construct, id: string, config: VpcConfig) {
    super(scope, id);

    const azs = ['us-east-1a', 'us-east-1b', 'us-east-1c'];

    // Create VPC
    this.vpc = new aws.vpc.Vpc(this, 'vpc', {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...config.tags,
        Name: `${config.tags.Environment}-eks-vpc`,
      },
    });

    // VPC Flow Logs for network monitoring
    const vpcFlowLogRole = new IamRole(this, 'vpc-flow-logs-role', {
      name: `${config.tags.Environment}-vpc-flow-logs-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'vpc-flow-logs.amazonaws.com',
            },
          },
        ],
      }),
      inlinePolicy: [
        {
          name: 'vpc-flow-logs-policy',
          policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                  'logs:DescribeLogGroups',
                  'logs:DescribeLogStreams',
                ],
                Resource: '*',
              },
            ],
          }),
        },
      ],
      tags: config.tags,
    });

    // Create inline policy for VPC Flow Logs instead of attaching non-existent managed policy
    const flowLogsPolicyDocument = new DataAwsIamPolicyDocument(
      this,
      'vpc-flow-logs-policy-doc',
      {
        statement: [
          {
            effect: 'Allow',
            actions: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogGroups',
              'logs:DescribeLogStreams',
            ],
            resources: ['*'],
          },
        ],
      }
    );

    new IamPolicy(this, 'vpc-flow-logs-inline-policy', {
      name: `${config.tags.Environment}-vpc-flow-logs-policy`,
      policy: flowLogsPolicyDocument.json,
    });

    new IamRolePolicyAttachment(this, 'vpc-flow-logs-policy-attachment', {
      role: vpcFlowLogRole.name,
      policyArn: new IamPolicy(this, 'vpc-flow-logs-custom-policy', {
        name: `${config.tags.Environment}-vpc-flow-logs-custom-policy`,
        policy: flowLogsPolicyDocument.json,
      }).arn,
    });

    const vpcFlowLogGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(
      this,
      'vpc-flow-logs',
      {
        name: `/aws/vpc/flowlogs/${config.tags.Environment}`,
        retentionInDays: 14,
        tags: config.tags,
      }
    );

    new aws.flowLog.FlowLog(this, 'vpc-flow-log', {
      vpcId: this.vpc.id,
      trafficType: 'ALL',
      logDestination: vpcFlowLogGroup.arn,
      logDestinationType: 'cloud-watch-logs',
      iamRoleArn: vpcFlowLogRole.arn,
      tags: config.tags,
    });

    // Internet Gateway
    const igw = new aws.internetGateway.InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.tags.Environment}-eks-igw`,
      },
    });

    // Create public and private subnets
    this.publicSubnets = [];
    this.privateSubnets = [];
    this.natGateways = [];

    for (let i = 0; i < config.azCount; i++) {
      // Public subnet
      const publicSubnet = new aws.subnet.Subnet(this, `public-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i}.0/24`,
        availabilityZone: azs[i],
        mapPublicIpOnLaunch: true,
        tags: {
          ...config.tags,
          Name: `${config.tags.Environment}-public-${azs[i]}`,
          'kubernetes.io/role/elb': '1',
          [`kubernetes.io/cluster/${config.tags.Environment}-eks-cluster`]:
            'shared',
        },
      });
      this.publicSubnets.push(publicSubnet);

      // Private subnet
      const privateSubnet = new aws.subnet.Subnet(this, `private-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: azs[i],
        tags: {
          ...config.tags,
          Name: `${config.tags.Environment}-private-${azs[i]}`,
          'kubernetes.io/role/internal-elb': '1',
          [`kubernetes.io/cluster/${config.tags.Environment}-eks-cluster`]:
            'shared',
        },
      });
      this.privateSubnets.push(privateSubnet);

      // EIP for NAT Gateway
      const eip = new aws.eip.Eip(this, `nat-eip-${i}`, {
        domain: 'vpc',
        tags: {
          ...config.tags,
          Name: `${config.tags.Environment}-nat-eip-${i}`,
        },
      });

      // NAT Gateway
      const natGateway = new aws.natGateway.NatGateway(
        this,
        `nat-gateway-${i}`,
        {
          allocationId: eip.id,
          subnetId: publicSubnet.id,
          tags: {
            ...config.tags,
            Name: `${config.tags.Environment}-nat-${i}`,
          },
        }
      );
      this.natGateways.push(natGateway);
    }

    // Route tables
    const publicRouteTable = new aws.routeTable.RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.tags.Environment}-public-rt`,
      },
    });

    new aws.route.Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, i) => {
      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `public-rta-${i}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        }
      );
    });

    // Private route tables (one per AZ for HA)
    this.privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new aws.routeTable.RouteTable(
        this,
        `private-rt-${i}`,
        {
          vpcId: this.vpc.id,
          tags: {
            ...config.tags,
            Name: `${config.tags.Environment}-private-rt-${i}`,
          },
        }
      );

      new aws.route.Route(this, `private-route-${i}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: this.natGateways[i].id,
      });

      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `private-rta-${i}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        }
      );
    });
  }
}

export class IamModule extends Construct {
  public eksClusterRole: IamRole;
  public eksNodeRole: IamRole;
  public oidcProvider: IamOpenidConnectProvider;

  constructor(scope: Construct, id: string, config: EksConfig) {
    super(scope, id);

    // EKS Cluster IAM Role
    const eksAssumeRolePolicy = new DataAwsIamPolicyDocument(
      this,
      'eks-assume-role',
      {
        statement: [
          {
            actions: ['sts:AssumeRole'],
            principals: [
              {
                type: 'Service',
                identifiers: ['eks.amazonaws.com'],
              },
            ],
          },
        ],
      }
    );

    this.eksClusterRole = new IamRole(this, 'eks-cluster-role', {
      name: `${config.clusterName}-cluster-role`,
      assumeRolePolicy: eksAssumeRolePolicy.json,
      tags: config.tags,
    });

    new IamRolePolicyAttachment(this, 'eks-cluster-policy', {
      role: this.eksClusterRole.name!,
      policyArn: 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy',
    });

    new IamRolePolicyAttachment(this, 'eks-vpc-resource-controller', {
      role: this.eksClusterRole.name!,
      policyArn: 'arn:aws:iam::aws:policy/AmazonEKSVPCResourceController',
    });

    const nodeAssumeRolePolicy = new DataAwsIamPolicyDocument(
      this,
      'node-assume-role',
      {
        statement: [
          {
            actions: ['sts:AssumeRole'],
            principals: [
              {
                type: 'Service',
                identifiers: ['ec2.amazonaws.com'],
              },
            ],
          },
        ],
      }
    );

    this.eksNodeRole = new IamRole(this, 'eks-node-role', {
      name: `${config.clusterName}-node-role`,
      assumeRolePolicy: nodeAssumeRolePolicy.json,
      tags: config.tags,
    });

    const nodePolicies = [
      'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy',
      'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy',
      'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
      'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    ];

    nodePolicies.forEach((policyArn, i) => {
      new IamRolePolicyAttachment(this, `node-policy-${i}`, {
        role: this.eksNodeRole.name!,
        policyArn,
      });
    });
  }

  public setupOidcProvider(cluster: aws.eksCluster.EksCluster): void {
    const tlsCert = new DataTlsCertificate(this, 'tls-cert', {
      url: cluster.identity.get(0).oidc.get(0).issuer,
    });

    this.oidcProvider = new IamOpenidConnectProvider(this, 'oidc-provider', {
      clientIdList: ['sts.amazonaws.com'],
      thumbprintList: [tlsCert.certificates.get(0).sha1Fingerprint],
      url: cluster.identity.get(0).oidc.get(0).issuer,
      tags: cluster.tags,
    });
  }
}

export class IrsaRoleModule extends Construct {
  public role: IamRole;

  constructor(
    scope: Construct,
    id: string,
    name: string,
    namespace: string,
    serviceAccount: string,
    oidcProviderArn: string,
    oidcProviderUrl: string,
    policyDocument: string,
    tags: { [key: string]: string }
  ) {
    super(scope, id);

    const assumeRolePolicy = new DataAwsIamPolicyDocument(
      this,
      'assume-role-policy',
      {
        statement: [
          {
            actions: ['sts:AssumeRoleWithWebIdentity'],
            principals: [
              {
                type: 'Federated',
                identifiers: [oidcProviderArn],
              },
            ],
            condition: [
              {
                test: 'StringEquals',
                variable: `${oidcProviderUrl.replace('https://', '')}:sub`,
                values: [
                  `system:serviceaccount:${namespace}:${serviceAccount}`,
                ],
              },
              {
                test: 'StringEquals',
                variable: `${oidcProviderUrl.replace('https://', '')}:aud`,
                values: ['sts.amazonaws.com'],
              },
            ],
          },
        ],
      }
    );

    this.role = new IamRole(this, 'role', {
      name,
      assumeRolePolicy: assumeRolePolicy.json,
      tags,
    });

    if (policyDocument && policyDocument.length > 0) {
      const policy = new IamPolicy(this, 'policy', {
        name: `${name}-policy`,
        policy: policyDocument,
        tags,
      });

      new IamRolePolicyAttachment(this, 'policy-attachment', {
        role: this.role.name!,
        policyArn: policy.arn,
      });
    }
  }
}

export class WorkloadRoleModule extends Construct {
  public role: IamRole;

  constructor(
    scope: Construct,
    id: string,
    name: string,
    namespace: string,
    oidcProviderArn: string,
    oidcProviderUrl: string,
    policies: { [key: string]: string },
    tags: { [key: string]: string }
  ) {
    super(scope, id);

    const assumeRolePolicy = new DataAwsIamPolicyDocument(
      this,
      'assume-role-policy',
      {
        statement: [
          {
            actions: ['sts:AssumeRoleWithWebIdentity'],
            principals: [
              {
                type: 'Federated',
                identifiers: [oidcProviderArn],
              },
            ],
            condition: [
              {
                test: 'StringLike',
                variable: `${oidcProviderUrl.replace('https://', '')}:sub`,
                values: [`system:serviceaccount:${namespace}:*`],
              },
              {
                test: 'StringEquals',
                variable: `${oidcProviderUrl.replace('https://', '')}:aud`,
                values: ['sts.amazonaws.com'],
              },
            ],
          },
        ],
      }
    );

    this.role = new IamRole(this, 'role', {
      name,
      assumeRolePolicy: assumeRolePolicy.json,
      tags,
    });

    Object.entries(policies).forEach(([policyName, policyDocument]) => {
      const policy = new IamPolicy(this, `policy-${policyName}`, {
        name: `${name}-${policyName}`,
        policy: policyDocument,
        tags,
      });

      new IamRolePolicyAttachment(this, `attachment-${policyName}`, {
        role: this.role.name!,
        policyArn: policy.arn,
      });
    });
  }
}

// Helper function to generate network policy YAML manifests
export function generateNetworkPolicyManifests(namespaces: string[]): string {
  const policies = namespaces.map(
    namespace => `---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-cross-namespace
  namespace: ${namespace}
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ${namespace}
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: ${namespace}
  # Allow egress to kube-system for DNS
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: UDP
      port: 53
  # Allow egress to internet for external APIs
  - to: []
    ports:
    - protocol: TCP
      port: 443
    - protocol: TCP
      port: 80`
  );

  return policies.join('\n\n');
}
