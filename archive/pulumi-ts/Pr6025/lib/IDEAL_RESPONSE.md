# Multi-Environment VPC Infrastructure - IDEAL Implementation

This is the production-ready implementation of a multi-environment VPC infrastructure for a payment processing platform using Pulumi with TypeScript.

## File: lib/vpc-component.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface VpcComponentArgs {
  environmentName: string;
  vpcCidr: string;
  availabilityZones: string[];
  environmentSuffix: string;
  tags?: { [key: string]: string };
}

export class VpcComponent extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly internetGateway: aws.ec2.InternetGateway;
  public readonly natGateways: aws.ec2.NatGateway[];
  public readonly webSecurityGroup: aws.ec2.SecurityGroup;
  public readonly appSecurityGroup: aws.ec2.SecurityGroup;
  public readonly flowLogGroup: aws.cloudwatch.LogGroup;

  constructor(name: string, args: VpcComponentArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:network:VpcComponent", name, {}, opts);

    const defaultTags = {
      Environment: args.environmentName,
      ManagedBy: "Pulumi",
      CostCenter: "Platform",
      ...args.tags,
    };

    // Create VPC
    this.vpc = new aws.ec2.Vpc(`vpc-${args.environmentName}-${args.environmentSuffix}`, {
      cidrBlock: args.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${args.environmentName}-vpc-${args.environmentSuffix}`,
        ...defaultTags,
      },
    }, { parent: this });

    // Create Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(`igw-${args.environmentName}-${args.environmentSuffix}`, {
      vpcId: this.vpc.id,
      tags: {
        Name: `${args.environmentName}-igw-${args.environmentSuffix}`,
        ...defaultTags,
      },
    }, { parent: this });

    // Create Public Subnets
    this.publicSubnets = [];
    args.availabilityZones.forEach((az, index) => {
      const subnet = new aws.ec2.Subnet(`public-subnet-${args.environmentName}-${az}-${args.environmentSuffix}`, {
        vpcId: this.vpc.id,
        cidrBlock: `${args.vpcCidr.split('/')[0].split('.').slice(0, 2).join('.')}.${index * 2}.0/24`,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${args.environmentName}-public-${az}-${args.environmentSuffix}`,
          Type: "Public",
          ...defaultTags,
        },
      }, { parent: this });
      this.publicSubnets.push(subnet);
    });

    // Create Private Subnets
    this.privateSubnets = [];
    args.availabilityZones.forEach((az, index) => {
      const subnet = new aws.ec2.Subnet(`private-subnet-${args.environmentName}-${az}-${args.environmentSuffix}`, {
        vpcId: this.vpc.id,
        cidrBlock: `${args.vpcCidr.split('/')[0].split('.').slice(0, 2).join('.')}.${index * 2 + 1}.0/24`,
        availabilityZone: az,
        tags: {
          Name: `${args.environmentName}-private-${az}-${args.environmentSuffix}`,
          Type: "Private",
          ...defaultTags,
        },
      }, { parent: this });
      this.privateSubnets.push(subnet);
    });

    // Create Elastic IPs for NAT Gateways
    const eips: aws.ec2.Eip[] = [];
    args.availabilityZones.forEach((az, index) => {
      const eip = new aws.ec2.Eip(`nat-eip-${args.environmentName}-${az}-${args.environmentSuffix}`, {
        domain: "vpc",
        tags: {
          Name: `${args.environmentName}-nat-eip-${az}-${args.environmentSuffix}`,
          ...defaultTags,
        },
      }, { parent: this });
      eips.push(eip);
    });

    // Create NAT Gateways
    this.natGateways = [];
    args.availabilityZones.forEach((az, index) => {
      const nat = new aws.ec2.NatGateway(`nat-${args.environmentName}-${az}-${args.environmentSuffix}`, {
        subnetId: this.publicSubnets[index].id,
        allocationId: eips[index].id,
        tags: {
          Name: `${args.environmentName}-nat-${az}-${args.environmentSuffix}`,
          ...defaultTags,
        },
      }, { parent: this });
      this.natGateways.push(nat);
    });

    // Create Public Route Table
    const publicRouteTable = new aws.ec2.RouteTable(`public-rt-${args.environmentName}-${args.environmentSuffix}`, {
      vpcId: this.vpc.id,
      tags: {
        Name: `${args.environmentName}-public-rt-${args.environmentSuffix}`,
        ...defaultTags,
      },
    }, { parent: this });

    // Create route to Internet Gateway
    new aws.ec2.Route(`public-route-${args.environmentName}-${args.environmentSuffix}`, {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: this.internetGateway.id,
    }, { parent: this });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(`public-rta-${args.environmentName}-${index}-${args.environmentSuffix}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      }, { parent: this });
    });

    // Create Private Route Tables (one per AZ)
    args.availabilityZones.forEach((az, index) => {
      const privateRouteTable = new aws.ec2.RouteTable(`private-rt-${args.environmentName}-${az}-${args.environmentSuffix}`, {
        vpcId: this.vpc.id,
        tags: {
          Name: `${args.environmentName}-private-rt-${az}-${args.environmentSuffix}`,
          ...defaultTags,
        },
      }, { parent: this });

      new aws.ec2.Route(`private-route-${args.environmentName}-${az}-${args.environmentSuffix}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: "0.0.0.0/0",
        natGatewayId: this.natGateways[index].id,
      }, { parent: this });

      new aws.ec2.RouteTableAssociation(`private-rta-${args.environmentName}-${az}-${args.environmentSuffix}`, {
        subnetId: this.privateSubnets[index].id,
        routeTableId: privateRouteTable.id,
      }, { parent: this });
    });

    // Create Web Tier Security Group
    this.webSecurityGroup = new aws.ec2.SecurityGroup(`web-sg-${args.environmentName}-${args.environmentSuffix}`, {
      vpcId: this.vpc.id,
      description: "Security group for web tier allowing HTTPS traffic",
      ingress: [
        {
          protocol: "tcp",
          fromPort: 443,
          toPort: 443,
          cidrBlocks: ["0.0.0.0/0"],
          description: "Allow HTTPS from anywhere",
        },
      ],
      egress: [
        {
          protocol: "-1",
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ["0.0.0.0/0"],
          description: "Allow all outbound traffic",
        },
      ],
      tags: {
        Name: `${args.environmentName}-web-sg-${args.environmentSuffix}`,
        ...defaultTags,
      },
    }, { parent: this });

    // Create App Tier Security Group
    this.appSecurityGroup = new aws.ec2.SecurityGroup(`app-sg-${args.environmentName}-${args.environmentSuffix}`, {
      vpcId: this.vpc.id,
      description: "Security group for app tier allowing traffic from web tier",
      tags: {
        Name: `${args.environmentName}-app-sg-${args.environmentSuffix}`,
        ...defaultTags,
      },
    }, { parent: this });

    // Add ingress rule to app security group referencing web security group
    new aws.ec2.SecurityGroupRule(`app-sg-rule-${args.environmentName}-${args.environmentSuffix}`, {
      type: "ingress",
      fromPort: 0,
      toPort: 65535,
      protocol: "tcp",
      sourceSecurityGroupId: this.webSecurityGroup.id,
      securityGroupId: this.appSecurityGroup.id,
      description: "Allow all TCP traffic from web tier",
    }, { parent: this });

    // Add egress rule to app security group
    new aws.ec2.SecurityGroupRule(`app-sg-egress-${args.environmentName}-${args.environmentSuffix}`, {
      type: "egress",
      fromPort: 0,
      toPort: 0,
      protocol: "-1",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.appSecurityGroup.id,
      description: "Allow all outbound traffic",
    }, { parent: this });

    // Create IAM Role for VPC Flow Logs
    const flowLogsRole = new aws.iam.Role(`flow-logs-role-${args.environmentName}-${args.environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Action: "sts:AssumeRole",
          Principal: {
            Service: "vpc-flow-logs.amazonaws.com",
          },
          Effect: "Allow",
        }],
      }),
      tags: {
        Name: `${args.environmentName}-flow-logs-role-${args.environmentSuffix}`,
        ...defaultTags,
      },
    }, { parent: this });

    // Create inline policy for Flow Logs role instead of using managed policy
    new aws.iam.RolePolicy(`flow-logs-policy-${args.environmentName}-${args.environmentSuffix}`, {
      role: flowLogsRole.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Action: [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents",
            "logs:DescribeLogGroups",
            "logs:DescribeLogStreams",
          ],
          Resource: "*",
        }],
      }),
    }, { parent: this });

    // Create CloudWatch Log Group
    this.flowLogGroup = new aws.cloudwatch.LogGroup(`flow-logs-${args.environmentName}-${args.environmentSuffix}`, {
      name: `/aws/vpc/flow-logs-${args.environmentName}-${args.environmentSuffix}`,
      retentionInDays: 7,
      tags: {
        Name: `${args.environmentName}-flow-logs-${args.environmentSuffix}`,
        ...defaultTags,
      },
    }, { parent: this });

    // Create VPC Flow Logs
    new aws.ec2.FlowLog(`vpc-flow-log-${args.environmentName}-${args.environmentSuffix}`, {
      vpcId: this.vpc.id,
      trafficType: "ALL",
      logDestinationType: "cloud-watch-logs",
      logDestination: this.flowLogGroup.arn,
      iamRoleArn: flowLogsRole.arn,
      tags: {
        Name: `${args.environmentName}-flow-log-${args.environmentSuffix}`,
        ...defaultTags,
      },
    }, { parent: this });

    this.registerOutputs({
      vpcId: this.vpc.id,
      publicSubnetIds: this.publicSubnets.map(s => s.id),
      privateSubnetIds: this.privateSubnets.map(s => s.id),
      webSecurityGroupId: this.webSecurityGroup.id,
      appSecurityGroupId: this.appSecurityGroup.id,
      flowLogGroupName: this.flowLogGroup.name,
    });
  }
}
```

## File: index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import { VpcComponent } from "./lib/vpc-component";

const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");
const region = config.get("region") || "us-east-1";

// Define environments
const environments = [
  {
    name: "dev",
    cidr: "10.0.0.0/16",
  },
  {
    name: "staging",
    cidr: "10.1.0.0/16",
  },
  {
    name: "production",
    cidr: "10.2.0.0/16",
  },
];

// Availability zones
const availabilityZones = [
  `${region}a`,
  `${region}b`,
  `${region}c`,
];

// Create VPCs for each environment
const vpcs: { [key: string]: VpcComponent } = {};

environments.forEach((env) => {
  vpcs[env.name] = new VpcComponent(`${env.name}-vpc`, {
    environmentName: env.name,
    vpcCidr: env.cidr,
    availabilityZones: availabilityZones,
    environmentSuffix: environmentSuffix,
  });
});

// Export outputs for dev environment
export const devVpcId = vpcs["dev"].vpc.id;
export const devPublicSubnetIds = vpcs["dev"].publicSubnets.map(s => s.id);
export const devPrivateSubnetIds = vpcs["dev"].privateSubnets.map(s => s.id);
export const devWebSgId = vpcs["dev"].webSecurityGroup.id;
export const devAppSgId = vpcs["dev"].appSecurityGroup.id;
export const devFlowLogGroupName = vpcs["dev"].flowLogGroup.name;

// Export outputs for staging environment
export const stagingVpcId = vpcs["staging"].vpc.id;
export const stagingPublicSubnetIds = vpcs["staging"].publicSubnets.map(s => s.id);
export const stagingPrivateSubnetIds = vpcs["staging"].privateSubnets.map(s => s.id);
export const stagingWebSgId = vpcs["staging"].webSecurityGroup.id;
export const stagingAppSgId = vpcs["staging"].appSecurityGroup.id;
export const stagingFlowLogGroupName = vpcs["staging"].flowLogGroup.name;

// Export outputs for production environment
export const productionVpcId = vpcs["production"].vpc.id;
export const productionPublicSubnetIds = vpcs["production"].publicSubnets.map(s => s.id);
export const productionPrivateSubnetIds = vpcs["production"].privateSubnets.map(s => s.id);
export const productionWebSgId = vpcs["production"].webSecurityGroup.id;
export const productionAppSgId = vpcs["production"].appSecurityGroup.id;
export const productionFlowLogGroupName = vpcs["production"].flowLogGroup.name;
```

## File: Pulumi.yaml

```yaml
name: tap
runtime: nodejs
description: Multi-environment VPC infrastructure for payment processing platform
config:
  environmentSuffix:
    type: string
    description: Unique suffix for resource naming to avoid conflicts
  region:
    type: string
    default: us-east-1
    description: AWS region for deployment
```

## Key Improvements in IDEAL_RESPONSE

1. **Resource Naming**: All resource names now include both `environmentName` and `environmentSuffix` for better uniqueness and traceability
2. **Complete Stack Outputs**: Added all missing outputs for staging and production environments (security groups, flow log groups)
3. **IAM Policy Optimization**: Replaced CloudWatchLogsFullAccess managed policy with inline policy for least-privilege access
4. **Flow Log Group Exposure**: Exposed `flowLogGroup` as public property for testing and validation
5. **Consistent Naming**: Fixed inconsistent resource naming patterns throughout
6. **Main Entry Point**: Stack definition in index.ts properly structured as Pulumi program
7. **Complete Exports**: All environments now have complete outputs including security groups and flow log groups