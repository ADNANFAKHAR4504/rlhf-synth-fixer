## modules.ts

```typescript
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

    // EKS Node IAM Role
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

    if (policyDocument) {
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

```

## tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { TlsProvider } from '@cdktf/provider-tls/lib/provider';
import { EksCluster } from '@cdktf/provider-aws/lib/eks-cluster';
import { EksNodeGroup } from '@cdktf/provider-aws/lib/eks-node-group';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

// Import modules
import {
  NetworkModule,
  IamModule,
  NodeGroupConfig,
  VpcConfig,
  EksConfig,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  // Accept an array here because `bin/tap.ts` constructs defaultTags as an array
  defaultTags?: AwsProviderDefaultTags[];
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    // The AwsProvider accepts an array of AwsProviderDefaultTags blocks.
    // `bin/tap.ts` constructs an array, so forward the array (or undefined)
    // directly to the provider.
    const defaultTags = props?.defaultTags ? props.defaultTags : undefined;

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure TLS Provider (needed for OIDC)
    new TlsProvider(this, 'tls', {});

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Get current AWS account ID
    const current = new DataAwsCallerIdentity(this, 'current', {});

    // Common tags
    const commonTags = {
      Environment: environmentSuffix,
      ManagedBy: 'terraform-cdktf',
      Stack: id,
    };

    // Create VPC and networking
    const vpcConfig: VpcConfig = {
      vpcCidr: '10.0.0.0/16',
      azCount: 3,
      tags: commonTags,
    };

    const networkModule = new NetworkModule(this, 'network', vpcConfig);

    // Create IAM roles for EKS
    const eksConfig: EksConfig = {
      clusterName: `${environmentSuffix}-eks-cluster`,
      kubernetesVersion: '1.28',
      tags: commonTags,
    };

    const iamModule = new IamModule(this, 'iam', eksConfig);

    // Create EKS cluster
    const eksCluster = new EksCluster(this, 'eks-cluster', {
      name: eksConfig.clusterName,
      version: eksConfig.kubernetesVersion,
      roleArn: iamModule.eksClusterRole.arn,
      vpcConfig: {
        subnetIds: [...networkModule.privateSubnets.map(subnet => subnet.id)],
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
      tags: commonTags,
    });

    // Setup OIDC provider after cluster is created
    iamModule.setupOidcProvider(eksCluster);

    // Create node group
    const nodeGroupConfig: NodeGroupConfig = {
      name: `${environmentSuffix}-general`,
      instanceTypes: ['t3.medium'],
      minSize: 2,
      maxSize: 10,
      desiredSize: 3,
      diskSize: 20,
      labels: {
        role: 'general',
      },
    };

    const nodeGroup = new EksNodeGroup(this, 'node-group-general', {
      clusterName: eksCluster.name,
      nodeGroupName: nodeGroupConfig.name,
      nodeRoleArn: iamModule.eksNodeRole.arn,
      subnetIds: networkModule.privateSubnets.map(subnet => subnet.id),
      scalingConfig: {
        minSize: nodeGroupConfig.minSize,
        maxSize: nodeGroupConfig.maxSize,
        desiredSize: nodeGroupConfig.desiredSize,
      },
      instanceTypes: nodeGroupConfig.instanceTypes,
      diskSize: nodeGroupConfig.diskSize,
      labels: nodeGroupConfig.labels,
      tags: commonTags,
      dependsOn: [eksCluster],
    });

    // Terraform Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: networkModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: networkModule.publicSubnets.map(subnet => subnet.id),
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: networkModule.privateSubnets.map(subnet => subnet.id),
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 'eks-cluster-name', {
      value: eksCluster.name,
      description: 'EKS cluster name',
    });

    new TerraformOutput(this, 'eks-cluster-endpoint', {
      value: eksCluster.endpoint,
      description: 'EKS cluster endpoint',
    });

    new TerraformOutput(this, 'eks-cluster-certificate-authority-data', {
      value: eksCluster.certificateAuthority.get(0).data,
      description: 'EKS cluster certificate authority data',
    });

    new TerraformOutput(this, 'eks-oidc-provider-arn', {
      value: iamModule.oidcProvider.arn,
      description: 'EKS OIDC provider ARN',
    });

    new TerraformOutput(this, 'eks-oidc-provider-url', {
      value: eksCluster.identity.get(0).oidc.get(0).issuer,
      description: 'EKS OIDC provider URL',
    });

    new TerraformOutput(this, 'node-group-id', {
      value: nodeGroup.id,
      description: 'EKS node group ID',
    });

    new TerraformOutput(this, 'aws-account-id', {
      value: current.accountId,
      description: 'Current AWS Account ID',
    });
  }
}

```