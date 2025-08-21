# CDKTF TypeScript Infrastructure Solution

## lib/modules.ts

```typescript
import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Instance } from '@cdktf/provider-aws/lib/instance';

/**
 * @interface VpcModuleProps
 * Defines the properties for the VpcModule.
 */
export interface VpcModuleProps {}

/**
 * @class VpcModule
 * Provisions a standard VPC with public and private subnets, Internet Gateway, and routing.
 */
export class VpcModule extends Construct {
  public readonly vpcId: string;
  public readonly publicSubnetIds: string[];
  public readonly privateSubnetId: string;

  constructor(scope: Construct, id: string, _props?: VpcModuleProps) {
    super(scope, id);

    // --- VPC ---
    const vpc = new Vpc(this, 'MainVpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: 'tap-vpc',
      },
    });
    this.vpcId = vpc.id;

    // --- Internet Gateway ---
    const igw = new InternetGateway(this, 'VpcIgw', {
      vpcId: vpc.id,
      tags: {
        Name: 'tap-igw',
      },
    });

    // --- Public Subnets ---
    const publicSubnetA = new Subnet(this, 'PublicSubnetA', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: 'us-east-1a',
      mapPublicIpOnLaunch: true,
      tags: {
        Name: 'tap-public-subnet-a',
      },
    });

    const publicSubnetB = new Subnet(this, 'PublicSubnetB', {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: 'us-east-1b',
      mapPublicIpOnLaunch: true,
      tags: {
        Name: 'tap-public-subnet-b',
      },
    });

    // --- Private Subnet ---
    const privateSubnetA = new Subnet(this, 'PrivateSubnetA', {
      vpcId: vpc.id,
      cidrBlock: '10.0.3.0/24',
      availabilityZone: 'us-east-1a',
      tags: {
        Name: 'tap-private-subnet-a',
      },
    });

    // Expose subnet IDs
    this.publicSubnetIds = [publicSubnetA.id, publicSubnetB.id];
    this.privateSubnetId = privateSubnetA.id;

    // --- Routing for Public Subnets ---
    const publicRouteTable = new RouteTable(this, 'PublicRouteTable', {
      vpcId: vpc.id,
      route: [
        {
          cidrBlock: '0.0.0.0/0',
          gatewayId: igw.id,
        },
      ],
      tags: {
        Name: 'tap-public-rt',
      },
    });

    new RouteTableAssociation(this, 'PublicRtaA', {
      subnetId: publicSubnetA.id,
      routeTableId: publicRouteTable.id,
    });

    new RouteTableAssociation(this, 'PublicRtaB', {
      subnetId: publicSubnetB.id,
      routeTableId: publicRouteTable.id,
    });
  }
}

/**
 * @interface Ec2ModuleProps
 * Defines the required properties for the Ec2Module.
 */
export interface Ec2ModuleProps {
  vpcId: string;
  publicSubnetIds: string[];
  sshKeyName: string;
}

/**
 * @class Ec2Module
 * Provisions EC2 instances with a Security Group.
 */
export class Ec2Module extends Construct {
  public readonly securityGroupId: string; // Exposed for stack outputs

  constructor(scope: Construct, id: string, props: Ec2ModuleProps) {
    super(scope, id);

    // --- Security Group ---
    const webSg = new SecurityGroup(this, 'WebServerSg', {
      name: 'tap-web-server-sg',
      vpcId: props.vpcId,
      description: 'Allow inbound SSH traffic',
      ingress: [
        {
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: {
        Name: 'tap-web-sg',
      },
    });

    // Store SG ID for stack output
    this.securityGroupId = webSg.id;

    // --- EC2 Instances ---
    const amiId = 'ami-08a6efd148b1f7504'; // Amazon Linux 2 AMI in us-east-1

    props.publicSubnetIds.forEach((subnetId, index) => {
      new Instance(this, `WebServerInstance-${index}`, {
        ami: amiId,
        instanceType: 't3.medium',
        subnetId: subnetId,
        vpcSecurityGroupIds: [webSg.id],
        keyName: props.sshKeyName,
        tags: {
          Name: `tap-web-server-${index + 1}`,
        },
      });
    });
  }
}
```

## lib/tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// Import your modules here
import { VpcModule, Ec2Module } from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
  sshKeyName?: string; // Required for EC2
}

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
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // --- VPC Module ---
    const vpcModule = new VpcModule(this, 'VpcModule');

    // --- EC2 Module ---
    const ec2Module = new Ec2Module(this, 'Ec2Module', {
      vpcId: vpcModule.vpcId,
      publicSubnetIds: vpcModule.publicSubnetIds,
      sshKeyName: props?.sshKeyName || 'your-dev-key', // Replace with actual key name
    });

    // --- Stack Outputs (as required by prompt) ---
    new TerraformOutput(this, 'vpcId', {
      value: vpcModule.vpcId,
      description: 'The ID of the main VPC.',
    });

    new TerraformOutput(this, 'publicSubnetIds', {
      value: vpcModule.publicSubnetIds.join(', '),
      description: 'The IDs of the public subnets.',
    });

    new TerraformOutput(this, 'privateSubnetId', {
      value: vpcModule.privateSubnetId,
      description: 'The ID of the private subnet.',
    });

    new TerraformOutput(this, 'ec2SecurityGroupId', {
      value: ec2Module.securityGroupId,
      description: 'The ID of the EC2 Security Group.',
    });
  }
}
```
