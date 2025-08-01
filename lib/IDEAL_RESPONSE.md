To achieve the desired AWS infrastructure using CDK for Terraform (CDKTF) in TypeScript, we'll create a modular structure with separate modules for the VPC, Subnets, and EC2 instance. We'll then import these modules into a main stack.

Here's how you can structure the code:

### Directory Structure
```
lib/
├── modules.ts
└── tap-stack.ts
```

### lib/modules.ts
```typescript
import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Instance } from '@cdktf/provider-aws/lib/instance';

//
// ==============================
// VPC MODULE
// ==============================
export interface VpcModuleProps {
  cidrBlock: string;
  environment: string;
}

export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly igw: InternetGateway;
  public readonly routeTable: RouteTable;

  constructor(scope: Construct, id: string, props: VpcModuleProps) {
    super(scope, id);

    this.vpc = new Vpc(this, 'DevVpc', {
      cidrBlock: props.cidrBlock,
      tags: {
        Environment: props.environment,
      },
    });

    this.igw = new InternetGateway(this, 'DevIgw', {
      vpcId: this.vpc.id,
      tags: {
        Environment: props.environment,
      },
    });

    this.routeTable = new RouteTable(this, 'DevRouteTable', {
      vpcId: this.vpc.id,
      tags: {
        Environment: props.environment,
      },
    });

    new Route(this, 'DevRoute', {
      routeTableId: this.routeTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.igw.id,
    });
  }

  get vpcId() {
    return this.vpc.id;
  }
}

//
// ==============================
// SUBNETS MODULE
// ==============================
export interface SubnetsModuleProps {
  vpcModule: VpcModule;
  environment: string;
}

export class SubnetsModule extends Construct {
  public readonly publicSubnets: Subnet[];

  constructor(scope: Construct, id: string, props: SubnetsModuleProps) {
    super(scope, id);

    const { vpcModule, environment } = props;

    this.publicSubnets = [
      new Subnet(this, 'DevPublicSubnet1', {
        vpcId: vpcModule.vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: 'us-east-1a',
        mapPublicIpOnLaunch: true,
        tags: {
          Environment: environment,
        },
      }),
      new Subnet(this, 'DevPublicSubnet2', {
        vpcId: vpcModule.vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: 'us-east-1b',
        mapPublicIpOnLaunch: true,
        tags: {
          Environment: environment,
        },
      }),
    ];

    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `SubnetAssoc${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: vpcModule.routeTable.id,
      });
    });
  }
}

//
// ==============================
// EC2 MODULE
// ==============================
export interface Ec2ModuleProps {
  subnetsModule: SubnetsModule;
  environment: string;
}

export class Ec2Module extends Construct {
  constructor(scope: Construct, id: string, props: Ec2ModuleProps) {
    super(scope, id);

    const { subnetsModule, environment } = props;

    new Instance(this, 'DevInstance', {
      ami: 'ami-083e865b97bdf1c1b',
      instanceType: 't2.micro',
      subnetId: subnetsModule.publicSubnets[0].id,
      associatePublicIpAddress: true,
      tags: {
        Environment: environment,
      },
    });
  }
}

```

### lib/tap-stack.ts
```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { VpcModule } from './modules/vpc';
import { SubnetsModule } from './modules/subnets';
import { Ec2Module } from './modules/ec2';

// ? Import your stacks here
// import { MyStack } from './my-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

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

    // Initialize VPC Module
    const vpcModule = new VpcModule(this, 'VpcModule', {
      cidrBlock: '10.0.0.0/16',
      environment: environmentSuffix,
    });

    // Initialize Subnets Module
    const subnetsModule = new SubnetsModule(this, 'SubnetsModule', {
      vpcModule,
      environment: environmentSuffix,
    });

    // Initialize EC2 Module
    new Ec2Module(this, 'Ec2Module', {
      subnetsModule,
      environment: environmentSuffix,
    });
  }
}

```

### Deploying the Stack
To deploy the stack, run the following commands:

```bash
cdktf init
cdktf get
cdktf deploy
```

This setup ensures that all resources are properly tagged, modularized, and follow best practices for infrastructure as code using CDKTF. The main stack imports and orchestrates the modules, while each module encapsulates a specific part of the infrastructure.
