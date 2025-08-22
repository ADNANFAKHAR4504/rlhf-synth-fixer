AWS Pulumi TypeScript Security Infrastructure
I'll provide a complete implementation of the secure AWS infrastructure using Pulumi and TypeScript with all required components.


Project Structure Implementation
1. Main Configuration Files

```json
package.json
{
  "name": "aws-nova-model-breaking",
  "version": "1.0.0",
  "description": "Secure AWS infrastructure using Pulumi TypeScript",
  "main": "index.ts",
  "scripts": {
    "build": "tsc",
    "dev": "pulumi stack select dev && pulumi up",
    "prod": "pulumi stack select prod && pulumi up",
    "preview": "pulumi preview",
    "destroy": "pulumi destroy",
    "lint": "eslint . --ext .ts",
    "test": "jest"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.90.0",
    "@pulumi/aws": "^6.5.0",
    "@pulumi/awsx": "^2.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.8.0",
    "typescript": "^5.2.0",
    "eslint": "^8.50.0",
    "@typescript-eslint/eslint-plugin": "^6.7.0",
    "@typescript-eslint/parser": "^6.7.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.5"
  },
  "keywords": [
    "pulumi",
    "aws",
    "infrastructure",
    "security",
    "typescript"
  ],
  "author": "hackwithjoshua",
  "license": "MIT"
}
tsconfig.json

  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "typeRoots": ["node_modules/@types"]
  },
  "include": [
    "**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]

```

```yaml

}
Pulumi.yaml
name: aws-nova-model-breaking
runtime: nodejs
description: Secure AWS infrastructure using Pulumi TypeScript
template:
  config:
    aws:region:
      description: The AWS region to deploy into
      default: us-east-1
    aws:profile:
      description: The AWS profile to use
      default: default
    environment:
      description: The deployment environment
      default: dev
    projectName:
      description: The name of the project
      default: nova-model-breaking
Pulumi.dev.yaml
config:
  aws:region: us-east-1
  aws:profile: default
  aws-nova-model-breaking:environment: dev
  aws-nova-model-breaking:projectName: nova-model-breaking-dev
  aws-nova-model-breaking:vpcCidr: "10.0.0.0/16"
  aws-nova-model-breaking:publicSubnetCidrs:
    - "10.0.1.0/24"
    - "10.0.2.0/24"
  aws-nova-model-breaking:privateSubnetCidrs:
    - "10.0.10.0/24"
    - "10.0.20.0/24"
  aws-nova-model-breaking:instanceType: t3.micro
  aws-nova-model-breaking:rdsInstanceClass: db.t3.micro
  aws-nova-model-breaking:logRetentionDays: 90
  aws-nova-model-breaking:backupRetentionDays: 7
Pulumi.prod.yaml
config:
  aws:region: us-east-1
  aws:profile: default
  aws-nova-model-breaking:environment: prod
  aws-nova-model-breaking:projectName: nova-model-breaking-prod
  aws-nova-model-breaking:vpcCidr: "10.1.0.0/16"
  aws-nova-model-breaking:publicSubnetCidrs:
    - "10.1.1.0/24"
    - "10.1.2.0/24"
  aws-nova-model-breaking:privateSubnetCidrs:
    - "10.1.10.0/24"
    - "10.1.20.0/24"
  aws-nova-model-breaking:instanceType: t3.small
  aws-nova-model-breaking:rdsInstanceClass: db.t3.small
  aws-nova-model-breaking:logRetentionDays: 365
  aws-nova-model-breaking:backupRetentionDays: 30

```

```ts
2. VPC Components
components/vpc/vpc.ts
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface VpcArgs {
    cidrBlock: string;
    environment: string;
    projectName: string;
    enableDnsHostnames?: boolean;
    enableDnsSupport?: boolean;
}

export interface VpcResult {
    vpc: aws.ec2.Vpc;
    vpcId: pulumi.Output<string>;
}

export class VpcComponent extends pulumi.ComponentResource {
    public readonly vpc: aws.ec2.Vpc;
    public readonly vpcId: pulumi.Output<string>;

    constructor(name: string, args: VpcArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:vpc:VpcComponent", name, {}, opts);

        const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

        this.vpc = new aws.ec2.Vpc(`${args.projectName}-vpc`, {
            cidrBlock: args.cidrBlock,
            enableDnsHostnames: args.enableDnsHostnames ?? true,
            enableDnsSupport: args.enableDnsSupport ?? true,
            tags: {
                Name: `${args.projectName}-vpc`,
                Environment: args.environment,
                Project: args.projectName,
                ManagedBy: "Pulumi"
            }
        }, defaultResourceOptions);

        this.vpcId = this.vpc.id;

        this.registerOutputs({
            vpc: this.vpc,
            vpcId: this.vpcId
        });
    }
}

export function createVpc(name: string, args: VpcArgs, opts?: pulumi.ComponentResourceOptions): VpcResult {
    const component = new VpcComponent(name, args, opts);
    return {
        vpc: component.vpc,
        vpcId: component.vpcId
    };
}
components/vpc/subnet.ts
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface SubnetArgs {
    vpcId: pulumi.Input<string>;
    cidrBlocks: string[];
    availabilityZones: string[];
    isPublic: boolean;
    environment: string;
    projectName: string;
    mapPublicIpOnLaunch?: boolean;
}

export interface SubnetResult {
    subnets: aws.ec2.Subnet[];
    subnetIds: pulumi.Output<string>[];
}

export class SubnetComponent extends pulumi.ComponentResource {
    public readonly subnets: aws.ec2.Subnet[];
    public readonly subnetIds: pulumi.Output<string>[];

    constructor(name: string, args: SubnetArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:vpc:SubnetComponent", name, {}, opts);

        const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

        this.subnets = [];
        this.subnetIds = [];

        const subnetType = args.isPublic ? "public" : "private";

        args.cidrBlocks.forEach((cidr, index) => {
            const az = args.availabilityZones[index % args.availabilityZones.length];
            
            const subnet = new aws.ec2.Subnet(`${args.projectName}-${subnetType}-subnet-${index + 1}`, {
                vpcId: args.vpcId,
                cidrBlock: cidr,
                availabilityZone: az,
                mapPublicIpOnLaunch: args.isPublic ? (args.mapPublicIpOnLaunch ?? true) : false,
                tags: {
                    Name: `${args.projectName}-${subnetType}-subnet-${index + 1}`,
                    Type: subnetType,
                    Environment: args.environment,
                    Project: args.projectName,
                    AvailabilityZone: az,
                    ManagedBy: "Pulumi"
                }
            }, defaultResourceOptions);

            this.subnets.push(subnet);
            this.subnetIds.push(subnet.id);
        });

        this.registerOutputs({
            subnets: this.subnets,
            subnetIds: this.subnetIds
        });
    }
}

export function createSubnets(name: string, args: SubnetArgs, opts?: pulumi.ComponentResourceOptions): SubnetResult {
    const component = new SubnetComponent(name, args, opts);
    return {
        subnets: component.subnets,
        subnetIds: component.subnetIds
    };
}
components/vpc/internetGateway.ts
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface InternetGatewayArgs {
    vpcId: pulumi.Input<string>;
    environment: string;
    projectName: string;
}

export interface InternetGatewayResult {
    internetGateway: aws.ec2.InternetGateway;
    internetGatewayId: pulumi.Output<string>;
}

export class InternetGatewayComponent extends pulumi.ComponentResource {
    public readonly internetGateway: aws.ec2.InternetGateway;
    public readonly internetGatewayId: pulumi.Output<string>;

    constructor(name: string, args: InternetGatewayArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:vpc:InternetGatewayComponent", name, {}, opts);

        const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

        this.internetGateway = new aws.ec2.InternetGateway(`${args.projectName}-igw`, {
            vpcId: args.vpcId,
            tags: {
                Name: `${args.projectName}-igw`,
                Environment: args.environment,
                Project: args.projectName,
                ManagedBy: "Pulumi"
            }
        }, defaultResourceOptions);

        this.internetGatewayId = this.internetGateway.id;

        this.registerOutputs({
            internetGateway: this.internetGateway,
            internetGatewayId: this.internetGatewayId
        });
    }
}

export function createInternetGateway(name: string, args: InternetGatewayArgs, opts?: pulumi.ComponentResourceOptions): InternetGatewayResult {
    const component = new InternetGatewayComponent(name, args, opts);
    return {
        internetGateway: component.internetGateway,
        internetGatewayId: component.internetGatewayId
    };
}
components/vpc/natGateway.ts
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface NatGatewayArgs {
    publicSubnetIds: pulumi.Input<string>[];
    environment: string;
    projectName: string;
    connectivityType?: string;
}

export interface NatGatewayResult {
    natGateways: aws.ec2.NatGateway[];
    elasticIps: aws.ec2.Eip[];
    natGatewayIds: pulumi.Output<string>[];
}

export class NatGatewayComponent extends pulumi.ComponentResource {
    public readonly natGateways: aws.ec2.NatGateway[];
    public readonly elasticIps: aws.ec2.Eip[];
    public readonly natGatewayIds: pulumi.Output<string>[];

    constructor(name: string, args: NatGatewayArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:vpc:NatGatewayComponent", name, {}, opts);

        const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

        this.natGateways = [];
        this.elasticIps = [];
        this.natGatewayIds = [];

        args.publicSubnetIds.forEach((subnetId, index) => {
            // Create Elastic IP for NAT Gateway
            const eip = new aws.ec2.Eip(`${args.projectName}-nat-eip-${index + 1}`, {
                domain: "vpc",
                tags: {
                    Name: `${args.projectName}-nat-eip-${index + 1}`,
                    Environment: args.environment,
                    Project: args.projectName,
                    ManagedBy: "Pulumi"
                }
            }, defaultResourceOptions);

            this.elasticIps.push(eip);

            // Create NAT Gateway
            const natGateway = new aws.ec2.NatGateway(`${args.projectName}-nat-gateway-${index + 1}`, {
                allocationId: eip.id,
                subnetId: subnetId,
                connectivityType: args.connectivityType ?? "public",
                tags: {
                    Name: `${args.projectName}-nat-gateway-${index + 1}`,
                    Environment: args.environment,
                    Project: args.projectName,
                    ManagedBy: "Pulumi"
                }
            }, defaultResourceOptions);

            this.natGateways.push(natGateway);
            this.natGatewayIds.push(natGateway.id);
        });

        this.registerOutputs({
            natGateways: this.natGateways,
            elasticIps: this.elasticIps,
            natGatewayIds: this.natGatewayIds
        });
    }
}

export function createNatGateways(name: string, args: NatGatewayArgs, opts?: pulumi.ComponentResourceOptions): NatGatewayResult {
    const component = new NatGatewayComponent(name, args, opts);
    return {
        natGateways: component.natGateways,
        elasticIps: component.elasticIps,
        natGatewayIds: component.natGatewayIds
    };
}
components/vpc/routeTable.ts
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface RouteTableArgs {
    vpcId: pulumi.Input<string>;
    subnetIds: pulumi.Input<string>[];
    gatewayId?: pulumi.Input<string>;
    natGatewayIds?: pulumi.Input<string>[];
    isPublic: boolean;
    environment: string;
    projectName: string;
}

export interface RouteTableResult {
    routeTable: aws.ec2.RouteTable;
    routes: aws.ec2.Route[];
    routeTableAssociations: aws.ec2.RouteTableAssociation[];
}

export class RouteTableComponent extends pulumi.ComponentResource {
    public readonly routeTable: aws.ec2.RouteTable;
    public readonly routes: aws.ec2.Route[];
    public readonly routeTableAssociations: aws.ec2.RouteTableAssociation[];

    constructor(name: string, args: RouteTableArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:vpc:RouteTableComponent", name, {}, opts);

        const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

        const routeTableType = args.isPublic ? "public" : "private";

        this.routeTable = new aws.ec2.RouteTable(`${args.projectName}-${routeTableType}-rt`, {
            vpcId: args.vpcId,
            tags: {
                Name: `${args.projectName}-${routeTableType}-rt`,
                Type: routeTableType,
                Environment: args.environment,
                Project: args.projectName,
                ManagedBy: "Pulumi"
            }
        }, defaultResourceOptions);

        this.routes = [];
        this.routeTableAssociations = [];

        // Create routes based on whether it's public or private
        if (args.isPublic && args.gatewayId) {
            // Public route table - route to Internet Gateway
            const publicRoute = new aws.ec2.Route(`${args.projectName}-public-route`, {
                routeTableId: this.routeTable.id,
                destinationCidrBlock: "0.0.0.0/0",
                gatewayId: args.gatewayId
            }, defaultResourceOptions);

            this.routes.push(publicRoute);
        } else if (!args.isPublic && args.natGatewayIds) {
            // Private route table - route to NAT Gateway
            args.natGatewayIds.forEach((natGatewayId, index) => {
                const privateRoute = new aws.ec2.Route(`${args.projectName}-private-route-${index + 1}`, {
                    routeTableId: this.routeTable.id,
                    destinationCidrBlock: "0.0.0.0/0",
                    natGatewayId: natGatewayId
                }, defaultResourceOptions);

                this.routes.push(privateRoute);
            });
        }

        // Associate subnets with route table
        args.subnetIds.forEach((subnetId, index) => {
            const association = new aws.ec2.RouteTableAssociation(`${args.projectName}-${routeTableType}-rta-${index + 1}`, {
                subnetId: subnetId,
                routeTableId: this.routeTable.id
            }, defaultResourceOptions);

            this.routeTableAssociations.push(association);
        });

        this.registerOutputs({
            routeTable: this.routeTable,
            routes: this.routes,
            routeTableAssociations: this.routeTableAssociations
        });
    }
}

export function createRouteTable(name: string, args: RouteTableArgs, opts?: pulumi.ComponentResourceOptions): RouteTableResult {
    const component = new RouteTableComponent(name, args, opts);
    return {
        routeTable: component.routeTable,
        routes: component.routes,
        routeTableAssociations: component.routeTableAssociations
    };
}
3. Security Components
components/security/securityGroup.ts
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface SecurityGroupRule {
    type: "ingress" | "egress";
    fromPort: number;
    toPort: number;
    protocol: string;
    cidrBlocks?: string[];
    sourceSecurityGroupId?: pulumi.Input<string>;
    description?: string;
}

export interface SecurityGroupArgs {
    vpcId: pulumi.Input<string>;
    name: string;
    description: string;
    rules: SecurityGroupRule[];
    environment: string;
    projectName: string;
}

export interface SecurityGroupResult {
    securityGroup: aws.ec2.SecurityGroup;
    securityGroupId: pulumi.Output<string>;
    rules: aws.ec2.SecurityGroupRule[];
}

export class SecurityGroupComponent extends pulumi.ComponentResource {
    public readonly securityGroup: aws.ec2.SecurityGroup;
    public readonly securityGroupId: pulumi.Output<string>;
    public readonly rules: aws.ec2.SecurityGroupRule[];

    constructor(name: string, args: SecurityGroupArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:security:SecurityGroupComponent", name, {}, opts);

        const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

        this.securityGroup = new aws.ec2.SecurityGroup(`${args.projectName}-${args.name}-sg`, {
            name: `${args.projectName}-${args.name}-sg`,
            description: args.description,
            vpcId: args.vpcId,
            tags: {
                Name: `${args.projectName}-${args.name}-sg`,
                Environment: args.environment,
                Project: args.projectName,
                ManagedBy: "Pulumi"
            }
        }, defaultResourceOptions);

        this.securityGroupId = this.securityGroup.id;
        this.rules = [];

        // Create security group rules
        args.rules.forEach((rule, index) => {
            const sgRule = new aws.ec2.SecurityGroupRule(`${args.projectName}-${args.name}-rule-${index + 1}`, {
                type: rule.type,
                fromPort: rule.fromPort,
                toPort: rule.toPort,
                protocol: rule.protocol,
                cidrBlocks: rule.cidrBlocks,
                sourceSecurityGroupId: rule.sourceSecurityGroupId,
                securityGroupId: this.securityGroup.id,
                description: rule.description || `${rule.type} rule for ${rule.protocol}:${rule.fromPort}-${rule.toPort}`
            }, defaultResourceOptions);

            this.rules.push(sgRule);
        });

        this.registerOutputs({
            securityGroup: this.securityGroup,
            securityGroupId: this.securityGroupId,
            rules: this.rules
        });
    }
}

export function createSecurityGroup(name: string, args: SecurityGroupArgs, opts?: pulumi.ComponentResourceOptions): SecurityGroupResult {
    const component = new SecurityGroupComponent(name, args, opts);
    return {
        securityGroup: component.securityGroup,
        securityGroupId: component.securityGroupId,
        rules: component.rules
    };
}

// Predefined security group configurations
export function createWebSecurityGroup(vpcId: pulumi.Input<string>, environment: string, projectName: string, opts?: pulumi.ComponentResourceOptions): SecurityGroupResult {
    return createSecurityGroup("web", {
        vpcId,
        name: "web",
        description: "Security group for web servers",
        rules: [
            {
                type: "ingress",
                fromPort: 80,
                toPort: 80,
                protocol: "tcp",
                cidrBlocks: ["0.0.0.0/0"],
                description: "HTTP access"
            },
            {
                type: "ingress",
                fromPort: 443,
                toPort: 443,
                protocol: "tcp",
                cidrBlocks: ["0.0.0.0/0"],
                description: "HTTPS access"
            },
            {
                type: "egress",
                fromPort: 0,
                toPort: 65535,
                protocol: "tcp",
                cidrBlocks: ["0.0.0.0/0"],
                description: "All outbound traffic"
            }
        ],
        environment,
        projectName
    }, opts);
}

export function createDatabaseSecurityGroup(vpcId: pulumi.Input<string>, webSecurityGroupId: pulumi.Input<string>, environment: string, projectName: string, opts?: pulumi.ComponentResourceOptions): SecurityGroupResult {
    return createSecurityGroup("database", {
        vpcId,
        name: "database",
        description: "Security group for database servers",
        rules: [
            {
                type: "ingress",
                fromPort: 3306,
                toPort: 3306,
                protocol: "tcp",
                sourceSecurityGroupId: webSecurityGroupId,
                description: "MySQL access from web servers"
            },
            {
                type: "ingress",
                fromPort: 5432,
                toPort: 5432,
                protocol: "tcp",
                sourceSecurityGroupId: webSecurityGroupId,
                description: "PostgreSQL access from web servers"
            }
        ],
        environment,
        projectName
    }, opts);
}

export function createLoadBalancerSecurityGroup(vpcId: pulumi.Input<string>, environment: string, projectName: string, opts?: pulumi.ComponentResourceOptions): SecurityGroupResult {
    return createSecurityGroup("alb", {
        vpcId,
        name: "alb",
        description: "Security group for Application Load Balancer",
        rules: [
            {
                type: "ingress",
                fromPort: 80,
                toPort: 80,
                protocol: "tcp",
                cidrBlocks: ["0.0.0.0/0"],
                description: "HTTP access"
            },
            {
                type: "ingress",
                fromPort: 443,
                toPort: 443,
                protocol: "tcp",
                cidrBlocks: ["0.0.0.0/0"],
                description: "HTTPS access"
            },
            {
                type: "egress",
                fromPort: 0,
                toPort: 65535,
                protocol: "tcp",
                cidrBlocks: ["0.0.0.0/0"],
                description: "All outbound traffic"
            }
        ],
        environment,
        projectName
    }, opts);
}
components/security/iam.ts
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface IAMRoleArgs {
    roleName: string;
    assumeRolePolicy: string;
    description?: string;
    environment: string;
    projectName: string;
    maxSessionDuration?: number;
}

export interface IAMPolicyArgs {
    policyName: string;
    policyDocument: string;
    description?: string;
    environment: string;
    projectName: string;
}

export interface IAMRoleResult {
    role: aws.iam.Role;
    roleArn: pulumi.Output<string>;
    roleName: pulumi.Output<string>;
}

export interface IAMPolicyResult {
    policy: aws.iam.Policy;
    policyArn: pulumi.Output<string>;
}

export class IAMRoleComponent extends pulumi.ComponentResource {
    public readonly role: aws.iam.Role;
    public readonly roleArn: pulumi.Output<string>;
    public readonly roleName: pulumi.Output<string>;

    constructor(name: string, args: IAMRoleArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:security:IAMRoleComponent", name, {}, opts);

        const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

        this.role = new aws.iam.Role(`${args.projectName}-${args.roleName}`, {
            name: `${args.projectName}-${args.roleName}`,
            assumeRolePolicy: args.assumeRolePolicy,
            description: args.description || `IAM role for ${args.roleName}`,
            maxSessionDuration: args.maxSessionDuration || 3600,
            tags: {
                Name: `${args.projectName}-${args.roleName}`,
                Environment: args.environment,
                Project: args.projectName,
                ManagedBy: "Pulumi"
            }
        }, defaultResourceOptions);

        this.roleArn = this.role.arn;
        this.roleName = this.role.name;

        this.registerOutputs({
            role: this.role,
            roleArn: this.roleArn,
            roleName: this.roleName
        });
    }
}

export class IAMPolicyComponent extends pulumi.ComponentResource {
    public readonly policy: aws.iam.Policy;
    public readonly policyArn: pulumi.Output<string>;

    constructor(name: string, args: IAMPolicyArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:security:IAMPolicyComponent", name, {}, opts);

        const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

        this.policy = new aws.iam.Policy(`${args.projectName}-${args.policyName}`, {
            name: `${args.projectName}-${args.policyName}`,
            policy: args.policyDocument,
            description: args.description || `IAM policy for ${args.policyName}`,
            tags: {
                Name: `${args.projectName}-${args.policyName}`,
                Environment: args.environment,
                Project: args.projectName,
                ManagedBy: "Pulumi"
            }
        }, defaultResourceOptions);

        this.policyArn = this.policy.arn;

        this.registerOutputs({
            policy: this.policy,
            policyArn: this.policyArn
        });
    }
}

export function createIAMRole(name: string, args: IAMRoleArgs, opts?: pulumi.ComponentResourceOptions): IAMRoleResult {
    const component = new IAMRoleComponent(name, args, opts);
    return {
        role: component.role,
        roleArn: component.roleArn,
        roleName: component.roleName
    };
}

export function createIAMPolicy(name: string, args: IAMPolicyArgs, opts?: pulumi.ComponentResourceOptions): IAMPolicyResult {
    const component = new IAMPolicyComponent(name, args, opts);
    return {
        policy: component.policy,
        policyArn: component.policyArn
    };
}

export function attachPolicyToRole(roleName: pulumi.Input<string>, policyArn: pulumi.Input<string>, attachmentName: string, opts?: pulumi.ResourceOptions): aws.iam.RolePolicyAttachment {
    return new aws.iam.RolePolicyAttachment(attachmentName, {
        role: roleName,
        policyArn: policyArn
    }, opts);
}

// Predefined IAM roles and policies
export function createEC2Role(environment: string, projectName: string, opts?: pulumi.ComponentResourceOptions): IAMRoleResult {
    const assumeRolePolicy = JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Action: "sts:AssumeRole",
                Effect: "Allow",
                Principal: {
                    Service: "ec2.amazonaws.com"
                }
            }
        ]
    });

    return createIAMRole("ec2-role", {
        roleName: "ec2-role",
        assumeRolePolicy,
        description: "IAM role for EC2 instances",
        environment,
        projectName
    }, opts);
}

export function createRDSRole(environment: string, projectName: string, opts?: pulumi.ComponentResourceOptions): IAMRoleResult {
    const assumeRolePolicy = JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Action: "sts:AssumeRole",
                Effect: "Allow",
                Principal: {
                    Service: "rds.amazonaws.com"
                }
            }
        ]
    });

    return createIAMRole("rds-role", {
        roleName: "rds-role",
        assumeRolePolicy,
        description: "IAM role for RDS instances",
        environment,
        projectName
```
    