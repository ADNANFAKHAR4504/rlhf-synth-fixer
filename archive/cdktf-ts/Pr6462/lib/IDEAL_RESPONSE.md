## modules.ts

```typescript
// lib/modules.ts
import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';

// VPC Module
export interface VpcConfig {
  cidrBlock: string;
  tags: { [key: string]: string };
}

export class VpcConstruct extends Construct {
  public readonly vpc: Vpc;

  constructor(scope: Construct, id: string, config: VpcConfig) {
    super(scope, id);

    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: config.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...config.tags,
        Name: `${id}-vpc`,
      },
    });
  }
}

// Network Module (Subnets, IGW, NAT Gateways, Route Tables)
export interface NetworkConfig {
  vpcId: string;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  availabilityZones: string[];
  tags: { [key: string]: string };
}

export class NetworkConstruct extends Construct {
  public readonly publicSubnets: Subnet[] = [];
  public readonly privateSubnets: Subnet[] = [];
  public readonly natGateways: NatGateway[] = [];

  constructor(scope: Construct, id: string, config: NetworkConfig) {
    super(scope, id);

    // Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: config.vpcId,
      tags: {
        ...config.tags,
        Name: `${id}-igw`,
      },
    });

    // Public Route Table
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: config.vpcId,
      tags: {
        ...config.tags,
        Name: `${id}-public-rt`,
      },
    });

    // Public Route to Internet
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Create Public Subnets
    for (let i = 0; i < config.publicSubnetCidrs.length; i++) {
      const subnet = new Subnet(this, `public-subnet-${i + 1}`, {
        vpcId: config.vpcId,
        cidrBlock: config.publicSubnetCidrs[i],
        availabilityZone: config.availabilityZones[i],
        mapPublicIpOnLaunch: true,
        tags: {
          ...config.tags,
          Name: `${id}-public-subnet-${i + 1}`,
          'kubernetes.io/role/elb': '1',
        },
      });

      new RouteTableAssociation(this, `public-rt-assoc-${i + 1}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });

      this.publicSubnets.push(subnet);
    }

    // Create Private Subnets with NAT Gateways
    for (let i = 0; i < config.privateSubnetCidrs.length; i++) {
      // EIP for NAT Gateway
      const eip = new Eip(this, `nat-eip-${i + 1}`, {
        domain: 'vpc',
        tags: {
          ...config.tags,
          Name: `${id}-nat-eip-${i + 1}`,
        },
      });

      // NAT Gateway in public subnet
      const natGw = new NatGateway(this, `nat-gw-${i + 1}`, {
        allocationId: eip.id,
        subnetId: this.publicSubnets[i].id,
        tags: {
          ...config.tags,
          Name: `${id}-nat-gw-${i + 1}`,
        },
      });

      this.natGateways.push(natGw);

      // Private Route Table
      const privateRouteTable = new RouteTable(this, `private-rt-${i + 1}`, {
        vpcId: config.vpcId,
        tags: {
          ...config.tags,
          Name: `${id}-private-rt-${i + 1}`,
        },
      });

      // Private Route to NAT Gateway
      new Route(this, `private-route-${i + 1}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGw.id,
      });

      // Create Private Subnet
      const subnet = new Subnet(this, `private-subnet-${i + 1}`, {
        vpcId: config.vpcId,
        cidrBlock: config.privateSubnetCidrs[i],
        availabilityZone: config.availabilityZones[i],
        tags: {
          ...config.tags,
          Name: `${id}-private-subnet-${i + 1}`,
          'kubernetes.io/role/internal-elb': '1',
        },
      });

      new RouteTableAssociation(this, `private-rt-assoc-${i + 1}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });

      this.privateSubnets.push(subnet);
    }
  }
}

// Security Group Module
export interface SecurityGroupConfig {
  name: string;
  vpcId: string;
  ingressRules: {
    fromPort: number;
    toPort: number;
    protocol: string;
    cidrBlocks: string[];
    description: string;
  }[];
  egressRules: {
    fromPort: number;
    toPort: number;
    protocol: string;
    cidrBlocks: string[];
    description: string;
  }[];
  tags: { [key: string]: string };
}

export class SecurityGroupConstruct extends Construct {
  public readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, config: SecurityGroupConfig) {
    super(scope, id);

    this.securityGroup = new SecurityGroup(this, 'security-group', {
      name: config.name,
      vpcId: config.vpcId,
      description: `Security group for ${config.name}`,
      tags: {
        ...config.tags,
        Name: config.name,
      },
    });

    // Ingress Rules
    config.ingressRules.forEach((rule, index) => {
      new SecurityGroupRule(this, `ingress-rule-${index}`, {
        securityGroupId: this.securityGroup.id,
        type: 'ingress',
        fromPort: rule.fromPort,
        toPort: rule.toPort,
        protocol: rule.protocol,
        cidrBlocks: rule.cidrBlocks,
        description: rule.description,
      });
    });

    // Egress Rules
    config.egressRules.forEach((rule, index) => {
      new SecurityGroupRule(this, `egress-rule-${index}`, {
        securityGroupId: this.securityGroup.id,
        type: 'egress',
        fromPort: rule.fromPort,
        toPort: rule.toPort,
        protocol: rule.protocol,
        cidrBlocks: rule.cidrBlocks,
        description: rule.description,
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
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { Fn } from 'cdktf';
// Import modules from modules.ts
import {
  VpcConstruct,
  NetworkConstruct,
  SecurityGroupConstruct,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
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
    const defaultTags = props?.defaultTags || [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

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

    // Data sources
    const current = new DataAwsCallerIdentity(this, 'current', {});
    const azs = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    // Common tags
    const commonTags = {
      Environment: environmentSuffix,
      ManagedBy: 'Terraform',
      Stack: id,
    };

    // Create VPC
    const vpcModule = new VpcConstruct(this, 'main-vpc', {
      cidrBlock: '10.0.0.0/16',
      tags: commonTags,
    });

    // Create Network (Subnets, IGW, NAT Gateways, Route Tables)
    const networkModule = new NetworkConstruct(this, 'main-network', {
      vpcId: vpcModule.vpc.id,
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
      privateSubnetCidrs: ['10.0.10.0/24', '10.0.11.0/24'],
      availabilityZones: [Fn.element(azs.names, 0), Fn.element(azs.names, 1)],
      tags: commonTags,
    });

    // Create Application Security Group
    const appSecurityGroup = new SecurityGroupConstruct(this, 'app-sg', {
      name: `${id}-app-security-group`,
      vpcId: vpcModule.vpc.id,
      ingressRules: [
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTPS from anywhere',
        },
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTP from anywhere',
        },
      ],
      egressRules: [
        {
          fromPort: 0,
          toPort: 65535,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound traffic',
        },
      ],
      tags: commonTags,
    });

    // Create Database Security Group
    const dbSecurityGroup = new SecurityGroupConstruct(this, 'db-sg', {
      name: `${id}-db-security-group`,
      vpcId: vpcModule.vpc.id,
      ingressRules: [
        {
          fromPort: 3306,
          toPort: 3306,
          protocol: 'tcp',
          cidrBlocks: ['10.0.0.0/16'],
          description: 'Allow MySQL from VPC',
        },
      ],
      egressRules: [
        {
          fromPort: 0,
          toPort: 65535,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound traffic',
        },
      ],
      tags: commonTags,
    });

    // Terraform Outputs (Exactly 10 outputs as requested)
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'vpc-cidr-block', {
      value: vpcModule.vpc.cidrBlock,
      description: 'VPC CIDR block',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: networkModule.publicSubnets.map(subnet => subnet.id),
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: networkModule.privateSubnets.map(subnet => subnet.id),
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 'nat-gateway-ids', {
      value: networkModule.natGateways.map(nat => nat.id),
      description: 'NAT Gateway IDs',
    });

    new TerraformOutput(this, 'app-security-group-id', {
      value: appSecurityGroup.securityGroup.id,
      description: 'Application Security Group ID',
    });

    new TerraformOutput(this, 'db-security-group-id', {
      value: dbSecurityGroup.securityGroup.id,
      description: 'Database Security Group ID',
    });

    new TerraformOutput(this, 'availability-zones', {
      value: azs.names,
      description: 'Available AZs in the region',
    });

    new TerraformOutput(this, 'aws-account-id', {
      value: current.accountId,
      description: 'Current AWS Account ID',
    });

    new TerraformOutput(this, 'aws-region', {
      value: awsRegion,
      description: 'AWS Region',
    });
  }
}

```