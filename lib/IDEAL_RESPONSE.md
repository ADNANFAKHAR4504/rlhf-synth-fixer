lib/tap-stack.ts
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// Import your modules
import { NetworkModule, SecurityModule, ComputeModule } from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
  sshKeyName?: string; // Required for EC2
}

const AWS_REGION_OVERRIDE = 'us-west-2';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // S3 Backend
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // --- Network Module ---
    const network = new NetworkModule(this, 'NetworkModule', {
      cidrBlock: '10.0.0.0/16',
      publicSubnetCidr: '10.0.1.0/24',
      privateSubnetCidr: '10.0.2.0/24',
      availabilityZone: `${awsRegion}a`,
    });

    // --- Security Module ---
    const security = new SecurityModule(this, 'SecurityModule', {
      vpcId: network.vpcId,
    });

    // --- Compute Module ---
    const compute = new ComputeModule(this, 'ComputeModule', {
      vpcId: network.vpcId,
      publicSubnetIds: network.publicSubnetIds,
      securityGroupId: security.securityGroupId,
      sshKeyName: props?.sshKeyName || 'your-dev-key', // Replace with your actual key
    });

    // --- Outputs ---
    new TerraformOutput(this, 'vpcId', {
      value: network.vpcId,
      description: 'The ID of the main VPC.',
    });

    new TerraformOutput(this, 'publicSubnetIds', {
      value: network.publicSubnetIds.join(', '),
      description: 'The IDs of the public subnets.',
    });

    new TerraformOutput(this, 'privateSubnetId', {
      value: network.privateSubnetId,
      description: 'The ID of the private subnet.',
    });

    new TerraformOutput(this, 'securityGroupId', {
      value: security.securityGroupId,
      description: 'The ID of the EC2 Security Group.',
    });

    new TerraformOutput(this, 'instanceId', {
      value: compute.instanceId,
      description: 'The ID of the created EC2 instance.',
    });
  }
}


lib/modules.ts
import { Construct } from 'constructs';

import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Instance } from '@cdktf/provider-aws/lib/instance';

// =============================================================
// Network Module
// =============================================================
export interface NetworkModuleProps {
  readonly cidrBlock: string;
  readonly publicSubnetCidr: string;
  readonly privateSubnetCidr: string;
  readonly availabilityZone: string;
  readonly tags?: { [key: string]: string };
}

export class NetworkModule extends Construct {
  public readonly vpcId: string;
  public readonly publicSubnetIds: string[];
  public readonly privateSubnetId: string;

  constructor(scope: Construct, id: string, props: NetworkModuleProps) {
    super(scope, id);

    // Create VPC
    const vpc = new Vpc(this, 'Vpc', {
      cidrBlock: props.cidrBlock,
      tags: props.tags,
    });
    this.vpcId = vpc.id;

    // Public Subnet
    const publicSubnet = new Subnet(this, 'PublicSubnet', {
      vpcId: vpc.id,
      cidrBlock: props.publicSubnetCidr,
      availabilityZone: props.availabilityZone,
      mapPublicIpOnLaunch: true,
      tags: props.tags,
    });
    this.publicSubnetIds = [publicSubnet.id];

    // Private Subnet
    const privateSubnet = new Subnet(this, 'PrivateSubnet', {
      vpcId: vpc.id,
      cidrBlock: props.privateSubnetCidr,
      availabilityZone: props.availabilityZone,
      tags: props.tags,
    });
    this.privateSubnetId = privateSubnet.id;

    // Internet Gateway
    const igw = new InternetGateway(this, 'InternetGateway', {
      vpcId: vpc.id,
      tags: props.tags,
    });

    // Public Route Table
    const publicRouteTable = new RouteTable(this, 'PublicRouteTable', {
      vpcId: vpc.id,
      tags: props.tags,
    });

    // Route to IGW
    new Route(this, 'PublicRoute', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Associate Public Subnet with Public Route Table
    new RouteTableAssociation(this, 'PublicRTA', {
      subnetId: publicSubnet.id,
      routeTableId: publicRouteTable.id,
    });

    // Elastic IP for NAT Gateway
    const eip = new Eip(this, 'NatEip', {
      domain: 'vpc',
      tags: props.tags,
    });

    // NAT Gateway
    const natGateway = new NatGateway(this, 'NatGateway', {
      allocationId: eip.id,
      subnetId: publicSubnet.id,
      tags: props.tags,
      dependsOn: [igw],
    });

    // Private Route Table
    const privateRouteTable = new RouteTable(this, 'PrivateRouteTable', {
      vpcId: vpc.id,
      tags: props.tags,
    });

    // Route to NAT Gateway
    new Route(this, 'PrivateRoute', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGateway.id,
    });

    // Associate Private Subnet with Private Route Table
    new RouteTableAssociation(this, 'PrivateRTA', {
      subnetId: privateSubnet.id,
      routeTableId: privateRouteTable.id,
    });
  }
}

// =============================================================
// Security Module
// =============================================================
export interface SecurityModuleProps {
  readonly vpcId: string;
  readonly tags?: { [key: string]: string };
}

export class SecurityModule extends Construct {
  public readonly securityGroupId: string;

  constructor(scope: Construct, id: string, props: SecurityModuleProps) {
    super(scope, id);

    const securityGroup = new SecurityGroup(this, 'SecurityGroup', {
      vpcId: props.vpcId,
      description: 'Allow SSH and HTTP inbound traffic',
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 22,
          toPort: 22,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow SSH from anywhere',
        },
        {
          protocol: 'tcp',
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTP from anywhere',
        },
      ],
      egress: [
        {
          protocol: '-1',
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound traffic',
        },
      ],
      tags: props.tags,
    });
    this.securityGroupId = securityGroup.id;
  }
}

// =============================================================
// Compute Module
// =============================================================
export interface ComputeModuleProps {
  readonly vpcId: string;
  readonly publicSubnetIds: string[];
  readonly securityGroupId: string;
  readonly sshKeyName: string;
  readonly tags?: { [key: string]: string };
}

export class ComputeModule extends Construct {
  public readonly instanceId: string;

  constructor(scope: Construct, id: string, props: ComputeModuleProps) {
    super(scope, id);

    const instance = new Instance(this, 'EC2Instance', {
      ami: 'ami-0c55b159cbfafe1f0', // Example AMI for us-west-2, replace if needed
      instanceType: 't2.micro',
      subnetId: props.publicSubnetIds[0],
      vpcSecurityGroupIds: [props.securityGroupId],
      keyName: props.sshKeyName,
      tags: props.tags,
    });
    this.instanceId = instance.id;
  }
}
