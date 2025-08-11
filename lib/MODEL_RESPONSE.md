# CDKTF TypeScript Multi-Region AWS Infrastructure

I'll create a complete CDKTF TypeScript codebase that provisions a robust, scalable, and secure multi-region AWS infrastructure. This solution will include all the specified requirements with proper organization and best practices.

## Project Structure

```
cdktf-aws-infrastructure/
├── package.json
├── tsconfig.json
├── cdktf.json
├── main.ts
├── src/
│   ├── constructs/
│   │   ├── vpc.ts
│   │   ├── security-groups.ts
│   │   ├── ec2.ts
│   │   ├── alb.ts
│   │   ├── rds.ts
│   │   ├── cloudwatch.ts
│   │   └── iam.ts
│   ├── stacks/
│   │   ├── base-stack.ts
│   │   ├── networking-stack.ts
│   │   ├── compute-stack.ts
│   │   └── database-stack.ts
│   ├── config/
│   │   ├── environments.ts
│   │   └── constants.ts
│   └── utils/
│       ├── naming.ts
│       └── tagging.ts
├── terraform/
│   └── backend.tf
└── README.md
```

## Core Configuration Files

### package.json
```json
{
  "name": "cdktf-aws-infrastructure",
  "version": "1.0.0",
  "description": "Multi-region AWS infrastructure using CDKTF TypeScript",
  "main": "main.ts",
  "scripts": {
    "get": "cdktf get",
    "build": "tsc",
    "synth": "cdktf synth",
    "deploy": "cdktf deploy",
    "destroy": "cdktf destroy",
    "diff": "cdktf diff",
    "watch": "tsc -w",
    "test": "jest",
    "upgrade": "npm i cdktf@latest cdktf-cli@latest",
    "upgrade:next": "npm i cdktf@next cdktf-cli@next"
  },
  "engines": {
    "node": ">=16.0"
  },
  "dependencies": {
    "@cdktf/provider-aws": "^19.0.0",
    "cdktf": "^0.20.0",
    "constructs": "^10.3.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.8",
    "@types/node": "^20.9.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "typescript": "^5.2.2"
  }
}
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": ["./node_modules/@types"],
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist"
  },
  "include": [
    "src/**/*",
    "main.ts"
  ],
  "exclude": [
    "node_modules",
    "dist",
    ".gen"
  ]
}
```

### cdktf.json
```json
{
  "language": "typescript",
  "app": "npm run --silent compile && node main.js",
  "projectId": "aws-multi-region-infrastructure",
  "sendCrashReports": "false",
  "terraformProviders": [
    "aws@~> 5.0"
  ],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true"
  }
}
```

## Utility Classes

### src/utils/naming.ts
```typescript
export class NamingConvention {
  static getResourceName(environment: string, service: string, region: string, suffix?: string): string {
    const baseName = `${environment}-${service}-${region}`;
    return suffix ? `${baseName}-${suffix}` : baseName;
  }

  static getStackName(environment: string, stackType: string, region: string): string {
    return `${environment}-${stackType}-${region}`;
  }

  static getWorkspaceName(environment: string, region: string): string {
    return `${environment}-${region}`;
  }
}
```

### src/utils/tagging.ts
```typescript
export interface ResourceTags {
  Environment: string;
  Project: string;
  Owner: string;
  CostCenter: string;
  Region: string;
  ManagedBy: string;
}

export class TaggingStrategy {
  static getCommonTags(environment: string, region: string): ResourceTags {
    return {
      Environment: environment,
      Project: "multi-region-infrastructure",
      Owner: "infrastructure-team",
      CostCenter: "engineering",
      Region: region,
      ManagedBy: "cdktf"
    };
  }

  static mergeTags(commonTags: ResourceTags, additionalTags: Record<string, string> = {}): Record<string, string> {
    return { ...commonTags, ...additionalTags };
  }
}
```

## Configuration

### src/config/constants.ts
```typescript
export const REGIONS = {
  PRIMARY: 'us-east-1',
  SECONDARY: 'eu-west-1'
} as const;

export const AVAILABILITY_ZONES = {
  [REGIONS.PRIMARY]: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
  [REGIONS.SECONDARY]: ['eu-west-1a', 'eu-west-1b', 'eu-west-1c']
} as const;

export const VPC_CIDR = {
  [REGIONS.PRIMARY]: '10.0.0.0/16',
  [REGIONS.SECONDARY]: '10.1.0.0/16'
} as const;

export const SUBNET_CIDRS = {
  [REGIONS.PRIMARY]: {
    public: ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'],
    private: ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'],
    database: ['10.0.21.0/24', '10.0.22.0/24', '10.0.23.0/24']
  },
  [REGIONS.SECONDARY]: {
    public: ['10.1.1.0/24', '10.1.2.0/24', '10.1.3.0/24'],
    private: ['10.1.11.0/24', '10.1.12.0/24', '10.1.13.0/24'],
    database: ['10.1.21.0/24', '10.1.22.0/24', '10.1.23.0/24']
  }
} as const;

export const INSTANCE_TYPES = {
  WEB: 't3.medium',
  DATABASE: 'db.t3.micro'
} as const;

export const AUTO_SCALING = {
  MIN_SIZE: 2,
  MAX_SIZE: 10,
  DESIRED_CAPACITY: 3,
  CPU_TARGET: 70
} as const;
```

### src/config/environments.ts
```typescript
export interface EnvironmentConfig {
  name: string;
  regions: string[];
  instanceType: string;
  minInstances: number;
  maxInstances: number;
  desiredInstances: number;
  dbInstanceClass: string;
  backupRetentionPeriod: number;
  multiAz: boolean;
}

export const ENVIRONMENTS: Record<string, EnvironmentConfig> = {
  development: {
    name: 'dev',
    regions: ['us-east-1'],
    instanceType: 't3.micro',
    minInstances: 1,
    maxInstances: 3,
    desiredInstances: 1,
    dbInstanceClass: 'db.t3.micro',
    backupRetentionPeriod: 1,
    multiAz: false
  },
  testing: {
    name: 'test',
    regions: ['us-east-1'],
    instanceType: 't3.small',
    minInstances: 2,
    maxInstances: 5,
    desiredInstances: 2,
    dbInstanceClass: 'db.t3.small',
    backupRetentionPeriod: 3,
    multiAz: true
  },
  production: {
    name: 'prod',
    regions: ['us-east-1', 'eu-west-1'],
    instanceType: 't3.medium',
    minInstances: 3,
    maxInstances: 10,
    desiredInstances: 3,
    dbInstanceClass: 'db.t3.medium',
    backupRetentionPeriod: 7,
    multiAz: true
  }
};
```

## Constructs

### src/constructs/vpc.ts
```typescript
import { Construct } from "constructs";
import { Vpc, Subnet, InternetGateway, RouteTable, Route, RouteTableAssociation, NatGateway, Eip } from "@cdktf/provider-aws/lib/vpc";
import { NamingConvention } from "../utils/naming";
import { TaggingStrategy, ResourceTags } from "../utils/tagging";

export interface VpcConstructProps {
  environment: string;
  region: string;
  vpcCidr: string;
  availabilityZones: string[];
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  databaseSubnetCidrs: string[];
}

export class VpcConstruct extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly databaseSubnets: Subnet[];
  public readonly internetGateway: InternetGateway;
  public readonly natGateways: NatGateway[];

  constructor(scope: Construct, id: string, props: VpcConstructProps) {
    super(scope, id);

    const commonTags = TaggingStrategy.getCommonTags(props.environment, props.region);

    // VPC
    this.vpc = new Vpc(this, "vpc", {
      cidrBlock: props.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: TaggingStrategy.mergeTags(commonTags, {
        Name: NamingConvention.getResourceName(props.environment, "vpc", props.region),
        Type: "vpc"
      })
    });

    // Internet Gateway
    this.internetGateway = new InternetGateway(this, "igw", {
      vpcId: this.vpc.id,
      tags: TaggingStrategy.mergeTags(commonTags, {
        Name: NamingConvention.getResourceName(props.environment, "igw", props.region),
        Type: "internet-gateway"
      })
    });

    // Public Subnets
    this.publicSubnets = props.publicSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: props.availabilityZones[index],
        mapPublicIpOnLaunch: true,
        tags: TaggingStrategy.mergeTags(commonTags, {
          Name: NamingConvention.getResourceName(props.environment, "public-subnet", props.region, `${index + 1}`),
          Type: "public-subnet",
          Tier: "public"
        })
      });
    });

    // Private Subnets
    this.privateSubnets = props.privateSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: props.availabilityZones[index],
        tags: TaggingStrategy.mergeTags(commonTags, {
          Name: NamingConvention.getResourceName(props.environment, "private-subnet", props.region, `${index + 1}`),
          Type: "private-subnet",
          Tier: "private"
        })
      });
    });

    // Database Subnets
    this.databaseSubnets = props.databaseSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `database-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: props.availabilityZones[index],
        tags: TaggingStrategy.mergeTags(commonTags, {
          Name: NamingConvention.getResourceName(props.environment, "database-subnet", props.region, `${index + 1}`),
          Type: "database-subnet",
          Tier: "database"
        })
      });
    });

    // Elastic IPs for NAT Gateways
    const eips = this.publicSubnets.map((_, index) => {
      return new Eip(this, `nat-eip-${index}`, {
        domain: "vpc",
        tags: TaggingStrategy.mergeTags(commonTags, {
          Name: NamingConvention.getResourceName(props.environment, "nat-eip", props.region, `${index + 1}`),
          Type: "elastic-ip"
        })
      });
    });

    // NAT Gateways
    this.natGateways = this.publicSubnets.map((subnet, index) => {
      return new NatGateway(this, `nat-gateway-${index}`, {
        allocationId: eips[index].id,
        subnetId: subnet.id,
        tags: TaggingStrategy.mergeTags(commonTags, {
          Name: NamingConvention.getResourceName(props.environment, "nat-gateway", props.region, `${index + 1}`),
          Type: "nat-gateway"
        })
      });
    });

    // Public Route Table
    const publicRouteTable = new RouteTable(this, "public-rt", {
      vpcId: this.vpc.id,
      tags: TaggingStrategy.mergeTags(commonTags, {
        Name: NamingConvention.getResourceName(props.environment, "public-rt", props.region),
        Type: "route-table",
        Tier: "public"
      })
    });

    new Route(this, "public-route", {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: this.internetGateway.id
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id
      });
    });

    // Private Route Tables (one per AZ for high availability)
    this.privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new RouteTable(this, `private-rt-${index}`, {
        vpcId: this.vpc.id,
        tags: TaggingStrategy.mergeTags(commonTags, {
          Name: NamingConvention.getResourceName(props.environment, "private-rt", props.region, `${index + 1}`),
          Type: "route-table",
          Tier: "private"
        })
      });

      new Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: "0.0.0.0/0",
        natGatewayId: this.natGateways[index].id
      });

      new RouteTableAssociation(this, `private-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id
      });
    });

    // Database Route Table
    const databaseRouteTable = new RouteTable(this, "database-rt", {
      vpcId: this.vpc.id,
      tags: TaggingStrategy.mergeTags(commonTags, {
        Name: NamingConvention.getResourceName(props.environment, "database-rt", props.region),
        Type: "route-table",
        Tier: "database"
      })
    });

    // Associate database subnets with database route table
    this.databaseSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `database-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: databaseRouteTable.id
      });
    });
  }
}
```

### src/constructs/security-groups.ts
```typescript
import { Construct } from "constructs";
import { SecurityGroup, SecurityGroupRule } from "@cdktf/provider-aws/lib/vpc";
import { NamingConvention } from "../utils/naming";
import { TaggingStrategy } from "../utils/tagging";

export interface SecurityGroupsConstructProps {
  environment: string;
  region: string;
  vpcId: string;
}

export class SecurityGroupsConstruct extends Construct {
  public readonly albSecurityGroup: SecurityGroup;
  public readonly webSecurityGroup: SecurityGroup;
  public readonly databaseSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: SecurityGroupsConstructProps) {
    super(scope, id);

    const commonTags = TaggingStrategy.getCommonTags(props.environment, props.region);

    // ALB Security Group
    this.albSecurityGroup = new SecurityGroup(this, "alb-sg", {
      name: NamingConvention.getResourceName(props.environment, "alb-sg", props.region),
      description: "Security group for Application Load Balancer",
      vpcId: props.vpcId,
      tags: TaggingStrategy.mergeTags(commonTags, {
        Name: NamingConvention.getResourceName(props.environment, "alb-sg", props.region),
        Type: "security-group",
        Purpose: "load-balancer"
      })
    });

    // ALB Ingress Rules
    new SecurityGroupRule(this, "alb-http-ingress", {
      type: "ingress",
      fromPort: 80,
      toPort: 80,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.albSecurityGroup.id,
      description: "Allow HTTP traffic from internet"
    });

    new SecurityGroupRule(this, "alb-https-ingress", {
      type: "ingress",
      fromPort: 443,
      toPort: 443,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.albSecurityGroup.id,
      description: "Allow HTTPS traffic from internet"
    });

    // ALB Egress Rule
    new SecurityGroupRule(this, "alb-egress", {
      type: "egress",
      fromPort: 0,
      toPort: 65535,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.albSecurityGroup.id,
      description: "Allow all outbound traffic"
    });

    // Web Security Group
    this.webSecurityGroup = new SecurityGroup(this, "web-sg", {
      name: NamingConvention.getResourceName(props.environment, "web-sg", props.region),
      description: "Security group for web servers",
      vpcId: props.vpcId,
      tags: TaggingStrategy.mergeTags(commonTags, {
        Name: NamingConvention.getResourceName(props.environment, "web-sg", props.region),
        Type: "security-group",
        Purpose: "web-servers"
      })
    });

    // Web Ingress Rules
    new SecurityGroupRule(this, "web-http-ingress", {
      type: "ingress",
      fromPort: 80,
      toPort: 80,
      protocol: "tcp",
      sourceSecurityGroupId: this.albSecurityGroup.id,
      securityGroupId: this.webSecurityGroup.id,
      description: "Allow HTTP traffic from ALB"
    });

    new SecurityGroupRule(this, "web-ssh-ingress", {
      type: "ingress",
      fromPort: 22,
      toPort: 22,
      protocol: "tcp",
      cidrBlocks: ["10.0.0.0/8"],
      securityGroupId: this.webSecurityGroup.id,
      description: "Allow SSH from VPC"
    });

    // Web Egress Rule
    new SecurityGroupRule(this, "web-egress", {
      type: "egress",
      fromPort: 0,
      toPort: 65535,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.webSecurityGroup.id,
      description: "Allow all outbound traffic"
    });

    // Database Security Group
    this.databaseSecurityGroup = new SecurityGroup(this, "database-sg", {
      name: NamingConvention.getResourceName(props.environment, "database-sg", props.region),
      description: "Security group for database servers",
      vpcId: props.vpcId,
      tags: TaggingStrategy.mergeTags(commonTags, {
        Name: NamingConvention.getResourceName(props.environment, "database-sg", props.region),
        Type: "security-group",
        Purpose: "database"
      })
    });

    // Database Ingress Rule
    new SecurityGroupRule(this, "database-postgres-ingress", {
      type: "ingress",
      fromPort: 5432,
      toPort: 5432,
      protocol: "tcp",
      sourceSecurityGroupId: this.webSecurityGroup.id,
      securityGroupId: this.databaseSecurityGroup.id,
      description: "Allow PostgreSQL traffic from web servers"
    });

    // Database Egress Rule
    new SecurityGroupRule(this, "database-egress", {
      type: "egress",
      fromPort: 0,
      toPort: 65535,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.databaseSecurityGroup.id,
      description: "Allow all outbound traffic"
    });
  }
}
```

### src/constructs/iam.ts
```typescript
import { Construct } from "constructs";
import { IamRole, IamRolePolicyAttachment, IamInstanceProfile, IamPolicy, DataAwsIamPolicyDocument } from "@cdktf/provider-aws/lib/iam";
import { NamingConvention } from "../utils/naming";
import { TaggingStrategy } from "../utils/tagging";

export interface IamConstructProps {
  environment: string;
  region: string;
}

export class IamConstruct extends Construct {
  public readonly ec2Role: IamRole;
  public readonly ec2InstanceProfile: IamInstanceProfile;

  constructor(scope: Construct, id: string, props: IamConstructProps) {
    super(scope, id);

    const commonTags = TaggingStrategy.getCommonTags(props.environment, props.region);

    // EC2 Assume Role Policy
    const ec2AssumeRolePolicy = new DataAwsIamPolicyDocument(this, "ec2-assume-role-policy", {
      statement: [
        {
          actions: ["sts:AssumeRole"],
          principals: [
            {
              type: "Service",
              identifiers: ["ec2.amazonaws.com"]
            }
          ]
        }
      ]
    });

    // EC2 Role
    this.ec2Role = new IamRole(this, "ec2-role", {
      name: NamingConvention.getResourceName(props.environment, "ec2-role", props.region),
      assumeRolePolicy: ec2AssumeRolePolicy.json,
      tags: TaggingStrategy.mergeTags(commonTags, {
        Name: NamingConvention.getResourceName(props.environment, "ec2-role", props.region),
        Type: "iam-role",
        Purpose: "ec2-instances"
      })
    });

    // CloudWatch Agent Policy
    const cloudWatchAgentPolicy = new DataAwsIamPolicyDocument(this, "cloudwatch-agent-policy", {
      statement: [
        {
          actions: [
            "cloudwatch:PutMetricData",
            "ec2:DescribeVolumes",
            "ec2:DescribeTags",
            "logs:PutLogEvents",
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:DescribeLogStreams",
            "logs:DescribeLogGroups"
          ],
          resources: ["*"]
        }
      ]
    });

    const cloudWatchPolicy = new IamPolicy(this, "cloudwatch-policy", {
      name: NamingConvention.getResourceName(props.environment, "cloudwatch-policy", props.region),
      description: "Policy for CloudWatch monitoring",
      policy: cloudWatchAgentPolicy.json,
      tags: TaggingStrategy.mergeTags(commonTags, {
        Name: NamingConvention.getResourceName(props.environment, "cloudwatch-policy", props.region),
        Type: "iam-policy",
        Purpose: "cloudwatch-monitoring"
      })
    });

    // Attach CloudWatch policy to EC2 role
    new IamRolePolicyAttachment(this, "ec2-cloudwatch-attachment", {
      role: this.ec2Role.name,
      policyArn: cloudWatchPolicy.arn
    });

    // Attach AWS managed policies
    new IamRolePolicyAttachment(this, "ec2-ssm-attachment", {
      role: this.ec2Role.name,
      policyArn: "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
    });

    // EC2 Instance Profile
    this.ec2InstanceProfile = new IamInstanceProfile(this, "ec2-instance-profile", {
      name: NamingConvention.getResourceName(props.environment, "ec2-profile", props.region),
      role: this.ec2Role.name,
      tags: TaggingStrategy.mergeTags(commonTags, {
        Name: NamingConvention.getResourceName(props.environment, "ec2-profile", props.region),
        Type: "instance-profile",
        Purpose: "ec2-instances"
      })
    });
  }
}
```

### src/constructs/alb.ts
```typescript
import { Construct } from "constructs";
import { Lb, LbTargetGroup, LbListener, LbTargetGroupAttachment } from "@cdktf/provider-aws/lib/elb";
import { NamingConvention } from "../utils/naming";
import { TaggingStrategy } from "../utils/tagging";

export interface AlbConstructProps {
  environment: string;
  region: string;
  vpcId: string;
  subnetIds: string[];
  securityGroupIds: string[];
  targetInstanceIds?: string[];
}

export class AlbConstruct extends Construct {
  public readonly loadBalancer: Lb;
  public readonly targetGroup: LbTargetGroup;
  public readonly listener: LbListener;

  constructor(scope: Construct, id: string, props: AlbConstructProps) {
    super(scope, id);

    const commonTags = TaggingStrategy.getCommonTags(props.environment, props.region);

    // Application Load Balancer
    this.loadBalancer = new Lb(this, "alb", {
      name: NamingConvention.getResourceName(props.environment, "alb", props.region),
      loadBalancerType: "application",
      subnets: props.subnetIds,
      securityGroups: props.securityGroupIds,
      enableDeletionProtection: props.environment === 'prod',
      tags: TaggingStrategy.mergeTags(commonTags, {
        Name: NamingConvention.getResourceName(props.environment, "alb", props.region),
        Type: "load-balancer",
        Purpose: "web-traffic-distribution"
      })
    });

    // Target Group
    this.targetGroup = new LbTargetGroup(this, "target-group", {
      name: NamingConvention.getResourceName(props.environment, "tg", props.region),
      port: 80,
      protocol: "HTTP",
      vpcId: props.vpcId,
      targetType: "instance",
      healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        timeout: 5,
        interval: 30,
        path: "/health",
        matcher: "200",
        port: "traffic-port",
        protocol: "HTTP"
      },
      tags: TaggingStrategy.mergeTags(commonTags, {
        Name: NamingConvention.getResourceName(props.environment, "tg", props.region),
        Type: "target-group",
        Purpose: "web-servers"
      })
    });

    // Listener
    this.listener = new LbListener(this, "listener", {
      loadBalancerArn: this.loadBalancer.arn,
      port: "80",
      protocol: "HTTP",
      defaultAction: [
        {
          type: "forward",
          targetGroupArn: this.targetGroup.arn
        }
      ],
      tags: TaggingStrategy.mergeTags(commonTags, {
        Name: NamingConvention.getResourceName(props.environment, "listener", props.region),
        Type: "lb-listener",
        Purpose: "http-routing"
      })
    });

    // Attach target instances if provided
    if (props.targetInstanceIds) {
      props.targetInstanceIds.forEach((instanceId, index) => {
        new LbTargetGroupAttachment(this, `target-attachment-${index}`, {
          targetGroupArn: this.targetGroup.arn,
          targetId: instanceId,
          port: 80
        });
      });
    }
  }
}
```

### src/constructs/ec2.ts
```typescript
import { Construct } from "constructs";
import { Instance, LaunchTemplate, AutoscalingGroup, AutoscalingPolicy, DataAwsA