To achieve the desired AWS infrastructure using CDK for Terraform (CDKTF) in TypeScript, we'll create a modular structure with separate modules for the VPC, Subnets, and EC2 instance. We'll then import these modules into a main stack.

Here's how you can structure the code:

### Directory Structure
```
lib/
├── modules/
│   ├── vpc/
│   │   └── index.ts
│   ├── subnets/
│   │   └── index.ts
│   └── ec2/
│       └── index.ts
└── tap-stack.ts
```

### lib/modules/vpc/index.ts
```typescript
import { TerraformStack, TerraformOutput } from "cdktf";
import { Vpc, InternetGateway, RouteTable, Route, RouteTableAssociation } from "@cdktf/provider-aws/lib/vpc";

export class VpcModule extends TerraformStack {
  public readonly vpc: Vpc;
  public readonly igw: InternetGateway;
  public readonly routeTable: RouteTable;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create VPC
    this.vpc = new Vpc(this, "DevVpc", {
      cidrBlock: "10.0.0.0/16",
      tags: {
        Environment: "Dev",
      },
    });

    // Create Internet Gateway
    this.igw = new InternetGateway(this, "DevIgw", {
      vpcId: this.vpc.id,
      tags: {
        Environment: "Dev",
      },
    });

    // Create Route Table
    this.routeTable = new RouteTable(this, "DevRouteTable", {
      vpcId: this.vpc.id,
      tags: {
        Environment: "Dev",
      },
    });

    // Create Route for Internet Gateway
    new Route(this, "DevRoute", {
      routeTableId: this.routeTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: this.igw.id,
    });
  }
}
```

### lib/modules/subnets/index.ts
```typescript
import { TerraformStack } from "cdktf";
import { Subnet, SubnetRouteTableAssociation } from "@cdktf/provider-aws/lib/vpc";
import { VpcModule } from "../vpc";

export class SubnetsModule extends TerraformStack {
  public readonly publicSubnets: Subnet[];

  constructor(scope: Construct, id: string, vpcModule: VpcModule) {
    super(scope, id);

    // Create Public Subnets
    this.publicSubnets = [
      new Subnet(this, "DevPublicSubnet1", {
        vpcId: vpcModule.vpc.id,
        cidrBlock: "10.0.1.0/24",
        availabilityZone: "us-east-1a",
        mapPublicIpOnLaunch: true,
        tags: {
          Environment: "Dev",
        },
      }),
      new Subnet(this, "DevPublicSubnet2", {
        vpcId: vpcModule.vpc.id,
        cidrBlock: "10.0.2.0/24",
        availabilityZone: "us-east-1b",
        mapPublicIpOnLaunch: true,
        tags: {
          Environment: "Dev",
        },
      }),
    ];

    // Associate Subnets with Route Table
    this.publicSubnets.forEach((subnet, index) => {
      new SubnetRouteTableAssociation(this, `DevSubnetAssociation${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: vpcModule.routeTable.id,
      });
    });
  }
}
```

### lib/modules/ec2/index.ts
```typescript
import { TerraformStack } from "cdktf";
import { Instance, InstanceNetworkInterface } from "@cdktf/provider-aws/lib/instance";
import { SubnetsModule } from "../subnets";

export class Ec2Module extends TerraformStack {
  constructor(scope: Construct, id: string, subnetsModule: SubnetsModule) {
    super(scope, id);

    // Create EC2 Instance
    new Instance(this, "DevInstance", {
      ami: "ami-0c55b159cbfafe1f0", // Amazon Linux 2 AMI (HVM), SSD Volume Type
      instanceType: "t2.micro",
      tags: {
        Environment: "Dev",
      },
      networkInterface: [{
        subnetId: subnetsModule.publicSubnets[0].id,
        deviceIndex: 0,
      } as InstanceNetworkInterface],
    });
  }
}
```

### lib/tap-stack.ts
```typescript
import { TerraformStack } from "cdktf";
import { VpcModule } from "./modules/vpc";
import { SubnetsModule } from "./modules/subnets";
import { Ec2Module } from "./modules/ec2";
import { Provider } from "@cdktf/provider-aws/lib/provider";

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Define AWS provider
    new Provider(this, "AwsProvider", {
      region: "us-east-1",
    });

    // Initialize VPC Module
    const vpcModule = new VpcModule(this, "VpcModule");

    // Initialize Subnets Module
    const subnetsModule = new SubnetsModule(this, "SubnetsModule", vpcModule);

    // Initialize EC2 Module
    new Ec2Module(this, "Ec2Module", subnetsModule);
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