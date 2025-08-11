# CDKTF Multi-Region AWS Infrastructure

I'll create a complete, robust CDKTF TypeScript infrastructure that meets all your requirements. This will be a production-ready, multi-region AWS setup with high availability, security, and scalability.

## Project Structure

```
cdktf-aws-infrastructure/
├── src/
│   ├── main.ts
│   ├── stacks/
│   │   ├── networking-stack.ts
│   │   ├── compute-stack.ts
│   │   ├── database-stack.ts
│   │   └── monitoring-stack.ts
│   ├── constructs/
│   │   ├── vpc.ts
│   │   ├── alb.ts
│   │   ├── auto-scaling.ts
│   │   ├── rds.ts
│   │   └── cloudwatch.ts
│   ├── config/
│   │   └── environment.ts
│   └── utils/
│       ├── naming.ts
│       └── tagging.ts
├── cdktf.json
├── package.json
├── tsconfig.json
└── README.md
```

## Core Configuration Files

### package.json
```json
{
  "name": "cdktf-aws-infrastructure",
  "version": "1.0.0",
  "description": "Multi-region AWS infrastructure using CDKTF TypeScript",
  "main": "src/main.ts",
  "scripts": {
    "get": "cdktf get",
    "build": "tsc",
    "synth": "cdktf synth",
    "deploy": "cdktf deploy",
    "destroy": "cdktf destroy",
    "diff": "cdktf diff",
    "test": "jest",
    "lint": "eslint src/**/*.ts"
  },
  "dependencies": {
    "@cdktf/provider-aws": "^19.0.0",
    "cdktf": "^0.20.0",
    "constructs": "^10.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "eslint": "^8.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0"
  }
}
```

### cdktf.json
```json
{
  "language": "typescript",
  "app": "npm run --silent compile && node src/main.js",
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
    "outDir": "./dist",
    "rootDir": "./src",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

## Utility Functions

### src/utils/naming.ts
```typescript
export interface NamingConfig {
  environment: string;
  service: string;
  region: string;
}

export class NamingConvention {
  static generateResourceName(config: NamingConfig, resourceType?: string): string {
    const baseName = `${config.environment}-${config.service}-${config.region}`;
    return resourceType ? `${baseName}-${resourceType}` : baseName;
  }

  static generateSubnetName(config: NamingConfig, type: 'public' | 'private', az: string): string {
    return `${config.environment}-${config.service}-${config.region}-${type}-${az}`;
  }

  static generateSecurityGroupName(config: NamingConfig, purpose: string): string {
    return `${config.environment}-${config.service}-${config.region}-${purpose}-sg`;
  }
}
```

### src/utils/tagging.ts
```typescript
export interface TagConfig {
  environment: string;
  project: string;
  owner: string;
  costCenter: string;
  region: string;
}

export class TaggingStrategy {
  static getCommonTags(config: TagConfig): Record<string, string> {
    return {
      Environment: config.environment,
      Project: config.project,
      Owner: config.owner,
      CostCenter: config.costCenter,
      Region: config.region,
      ManagedBy: 'CDKTF',
      CreatedDate: new Date().toISOString().split('T')[0]
    };
  }

  static getResourceTags(config: TagConfig, resourceType: string, additionalTags?: Record<string, string>): Record<string, string> {
    const commonTags = this.getCommonTags(config);
    return {
      ...commonTags,
      ResourceType: resourceType,
      ...additionalTags
    };
  }
}
```

## Configuration

### src/config/environment.ts
```typescript
export interface EnvironmentConfig {
  name: string;
  regions: string[];
  vpc: {
    cidr: string;
    enableDnsHostnames: boolean;
    enableDnsSupport: boolean;
  };
  subnets: {
    public: string[];
    private: string[];
  };
  ec2: {
    instanceType: string;
    minSize: number;
    maxSize: number;
    desiredCapacity: number;
    keyName?: string;
  };
  rds: {
    instanceClass: string;
    allocatedStorage: number;
    engine: string;
    engineVersion: string;
    multiAz: boolean;
    backupRetentionPeriod: number;
  };
  tags: {
    project: string;
    owner: string;
    costCenter: string;
  };
}

export const environments: Record<string, EnvironmentConfig> = {
  development: {
    name: 'dev',
    regions: ['us-east-1', 'eu-west-1'],
    vpc: {
      cidr: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true
    },
    subnets: {
      public: ['10.0.1.0/24', '10.0.2.0/24'],
      private: ['10.0.10.0/24', '10.0.20.0/24']
    },
    ec2: {
      instanceType: 't3.micro',
      minSize: 1,
      maxSize: 3,
      desiredCapacity: 2
    },
    rds: {
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      engine: 'postgres',
      engineVersion: '15.4',
      multiAz: false,
      backupRetentionPeriod: 7
    },
    tags: {
      project: 'multi-region-app',
      owner: 'devops-team',
      costCenter: 'engineering'
    }
  },
  testing: {
    name: 'test',
    regions: ['us-east-1', 'eu-west-1'],
    vpc: {
      cidr: '10.1.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true
    },
    subnets: {
      public: ['10.1.1.0/24', '10.1.2.0/24'],
      private: ['10.1.10.0/24', '10.1.20.0/24']
    },
    ec2: {
      instanceType: 't3.small',
      minSize: 2,
      maxSize: 6,
      desiredCapacity: 3
    },
    rds: {
      instanceClass: 'db.t3.small',
      allocatedStorage: 50,
      engine: 'postgres',
      engineVersion: '15.4',
      multiAz: true,
      backupRetentionPeriod: 14
    },
    tags: {
      project: 'multi-region-app',
      owner: 'qa-team',
      costCenter: 'quality-assurance'
    }
  },
  production: {
    name: 'prod',
    regions: ['us-east-1', 'eu-west-1'],
    vpc: {
      cidr: '10.2.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true
    },
    subnets: {
      public: ['10.2.1.0/24', '10.2.2.0/24'],
      private: ['10.2.10.0/24', '10.2.20.0/24']
    },
    ec2: {
      instanceType: 't3.medium',
      minSize: 3,
      maxSize: 10,
      desiredCapacity: 5
    },
    rds: {
      instanceClass: 'db.t3.medium',
      allocatedStorage: 100,
      engine: 'postgres',
      engineVersion: '15.4',
      multiAz: true,
      backupRetentionPeriod: 30
    },
    tags: {
      project: 'multi-region-app',
      owner: 'platform-team',
      costCenter: 'production'
    }
  }
};
```

## Constructs

### src/constructs/vpc.ts
```typescript
import { Construct } from 'constructs';
import {
  Vpc,
  Subnet,
  InternetGateway,
  RouteTable,
  Route,
  RouteTableAssociation,
  NatGateway,
  Eip,
  SecurityGroup,
  SecurityGroupRule,
  DataAwsAvailabilityZones
} from '@cdktf/provider-aws/lib';
import { NamingConvention, NamingConfig } from '../utils/naming';
import { TaggingStrategy, TagConfig } from '../utils/tagging';

export interface VpcConstructProps {
  namingConfig: NamingConfig;
  tagConfig: TagConfig;
  vpcCidr: string;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  enableDnsHostnames: boolean;
  enableDnsSupport: boolean;
}

export class VpcConstruct extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly internetGateway: InternetGateway;
  public readonly natGateways: NatGateway[];
  public readonly albSecurityGroup: SecurityGroup;
  public readonly ec2SecurityGroup: SecurityGroup;
  public readonly rdsSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: VpcConstructProps) {
    super(scope, id);

    // Get availability zones
    const azs = new DataAwsAvailabilityZones(this, 'availability-zones', {
      state: 'available'
    });

    // Create VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: props.vpcCidr,
      enableDnsHostnames: props.enableDnsHostnames,
      enableDnsSupport: props.enableDnsSupport,
      tags: TaggingStrategy.getResourceTags(props.tagConfig, 'VPC', {
        Name: NamingConvention.generateResourceName(props.namingConfig, 'vpc')
      })
    });

    // Create Internet Gateway
    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: TaggingStrategy.getResourceTags(props.tagConfig, 'InternetGateway', {
        Name: NamingConvention.generateResourceName(props.namingConfig, 'igw')
      })
    });

    // Create public subnets
    this.publicSubnets = props.publicSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: `\${${azs.fqn}.names[${index}]}`,
        mapPublicIpOnLaunch: true,
        tags: TaggingStrategy.getResourceTags(props.tagConfig, 'Subnet', {
          Name: NamingConvention.generateSubnetName(props.namingConfig, 'public', `az${index + 1}`),
          Type: 'Public'
        })
      });
    });

    // Create private subnets
    this.privateSubnets = props.privateSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: `\${${azs.fqn}.names[${index}]}`,
        tags: TaggingStrategy.getResourceTags(props.tagConfig, 'Subnet', {
          Name: NamingConvention.generateSubnetName(props.namingConfig, 'private', `az${index + 1}`),
          Type: 'Private'
        })
      });
    });

    // Create Elastic IPs for NAT Gateways
    const eips = this.publicSubnets.map((_, index) => {
      return new Eip(this, `nat-eip-${index}`, {
        domain: 'vpc',
        tags: TaggingStrategy.getResourceTags(props.tagConfig, 'EIP', {
          Name: NamingConvention.generateResourceName(props.namingConfig, `nat-eip-${index}`)
        })
      });
    });

    // Create NAT Gateways
    this.natGateways = this.publicSubnets.map((subnet, index) => {
      return new NatGateway(this, `nat-gateway-${index}`, {
        allocationId: eips[index].id,
        subnetId: subnet.id,
        tags: TaggingStrategy.getResourceTags(props.tagConfig, 'NatGateway', {
          Name: NamingConvention.generateResourceName(props.namingConfig, `nat-${index}`)
        })
      });
    });

    // Create route tables
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: TaggingStrategy.getResourceTags(props.tagConfig, 'RouteTable', {
        Name: NamingConvention.generateResourceName(props.namingConfig, 'public-rt')
      })
    });

    // Public route to Internet Gateway
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rt-association-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id
      });
    });

    // Create private route tables and routes
    this.privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new RouteTable(this, `private-rt-${index}`, {
        vpcId: this.vpc.id,
        tags: TaggingStrategy.getResourceTags(props.tagConfig, 'RouteTable', {
          Name: NamingConvention.generateResourceName(props.namingConfig, `private-rt-${index}`)
        })
      });

      new Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: this.natGateways[index].id
      });

      new RouteTableAssociation(this, `private-rt-association-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id
      });
    });

    // Create Security Groups
    this.albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      name: NamingConvention.generateSecurityGroupName(props.namingConfig, 'alb'),
      description: 'Security group for Application Load Balancer',
      vpcId: this.vpc.id,
      tags: TaggingStrategy.getResourceTags(props.tagConfig, 'SecurityGroup', {
        Name: NamingConvention.generateSecurityGroupName(props.namingConfig, 'alb')
      })
    });

    // ALB Security Group Rules
    new SecurityGroupRule(this, 'alb-ingress-http', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.albSecurityGroup.id
    });

    new SecurityGroupRule(this, 'alb-ingress-https', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.albSecurityGroup.id
    });

    new SecurityGroupRule(this, 'alb-egress-all', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.albSecurityGroup.id
    });

    // EC2 Security Group
    this.ec2SecurityGroup = new SecurityGroup(this, 'ec2-sg', {
      name: NamingConvention.generateSecurityGroupName(props.namingConfig, 'ec2'),
      description: 'Security group for EC2 instances',
      vpcId: this.vpc.id,
      tags: TaggingStrategy.getResourceTags(props.tagConfig, 'SecurityGroup', {
        Name: NamingConvention.generateSecurityGroupName(props.namingConfig, 'ec2')
      })
    });

    // EC2 Security Group Rules
    new SecurityGroupRule(this, 'ec2-ingress-alb', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      sourceSecurityGroupId: this.albSecurityGroup.id,
      securityGroupId: this.ec2SecurityGroup.id
    });

    new SecurityGroupRule(this, 'ec2-ingress-ssh', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: [props.vpcCidr],
      securityGroupId: this.ec2SecurityGroup.id
    });

    new SecurityGroupRule(this, 'ec2-egress-all', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.ec2SecurityGroup.id
    });

    // RDS Security Group
    this.rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: NamingConvention.generateSecurityGroupName(props.namingConfig, 'rds'),
      description: 'Security group for RDS database',
      vpcId: this.vpc.id,
      tags: TaggingStrategy.getResourceTags(props.tagConfig, 'SecurityGroup', {
        Name: NamingConvention.generateSecurityGroupName(props.namingConfig, 'rds')
      })
    });

    // RDS Security Group Rules
    new SecurityGroupRule(this, 'rds-ingress-ec2', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      sourceSecurityGroupId: this.ec2SecurityGroup.id,
      securityGroupId: this.rdsSecurityGroup.id
    });
  }
}
```

### src/constructs/alb.ts
```typescript
import { Construct } from 'constructs';
import {
  Lb,
  LbTargetGroup,
  LbListener,
  LbTargetGroupAttachment
} from '@cdktf/provider-aws/lib';
import { NamingConvention, NamingConfig } from '../utils/naming';
import { TaggingStrategy, TagConfig } from '../utils/tagging';

export interface AlbConstructProps {
  namingConfig: NamingConfig;
  tagConfig: TagConfig;
  vpcId: string;
  subnetIds: string[];
  securityGroupIds: string[];
}

export class AlbConstruct extends Construct {
  public readonly alb: Lb;
  public readonly targetGroup: LbTargetGroup;
  public readonly listener: LbListener;

  constructor(scope: Construct, id: string, props: AlbConstructProps) {
    super(scope, id);

    // Create Application Load Balancer
    this.alb = new Lb(this, 'alb', {
      name: NamingConvention.generateResourceName(props.namingConfig, 'alb'),
      loadBalancerType: 'application',
      subnets: props.subnetIds,
      securityGroups: props.securityGroupIds,
      enableDeletionProtection: false,
      tags: TaggingStrategy.getResourceTags(props.tagConfig, 'LoadBalancer', {
        Name: NamingConvention.generateResourceName(props.namingConfig, 'alb')
      })
    });

    // Create Target Group
    this.targetGroup = new LbTargetGroup(this, 'target-group', {
      name: NamingConvention.generateResourceName(props.namingConfig, 'tg'),
      port: 80,
      protocol: 'HTTP',
      vpcId: props.vpcId,
      targetType: 'instance',
      healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        timeout: 5,
        interval: 30,
        path: '/health',
        matcher: '200',
        port: 'traffic-port',
        protocol: 'HTTP'
      },
      tags: TaggingStrategy.getResourceTags(props.tagConfig, 'TargetGroup', {
        Name: NamingConvention.generateResourceName(props.namingConfig, 'tg')
      })
    });

    // Create Listener
    this.listener = new LbListener(this, 'listener', {
      loadBalancerArn: this.alb.arn,
      port: '80',
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: this.targetGroup.arn
        }
      ]
    });
  }
}
```

### src/constructs/auto-scaling.ts
```typescript
import { Construct } from 'constructs';
import {
  LaunchTemplate,
  AutoscalingGroup,
  AutoscalingPolicy,
  DataAwsAmi,
  IamRole,
  IamRolePolicyAttachment,
  IamInstanceProfile,
  LbTargetGroupAttachment
} from '@cdktf/provider-aws/lib';
import { NamingConvention, NamingConfig } from '../utils/naming';
import { TaggingStrategy, TagConfig } from '../utils/tagging';

export interface AutoScalingConstructProps {
  namingConfig: NamingConfig;
  tagConfig: TagConfig;
  instanceType: string;
  minSize: number;
  maxSize: number;
  desiredCapacity: number;
  subnetIds: string[];
  securityGroupIds: string[];
  targetGroupArn: string;
  keyName?: string;
}

export class AutoScalingConstruct extends Construct {
  public readonly launchTemplate: LaunchTemplate;
  public readonly autoScalingGroup: AutoscalingGroup;
  public readonly scaleUpPolicy: AutoscalingPolicy;
  public readonly scaleDownPolicy: AutoscalingPolicy;
  public readonly instanceRole: IamRole;

  constructor(scope: Construct, id: string, props: AutoScalingConstructProps) {
    super(scope, id);

    // Get latest Amazon Linux 2 AMI
    const ami = new DataAwsAmi(this, 'amazon-linux', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2']
        }
      ]
    });

    // Create IAM role for EC2 instances
    this.instanceRole = new IamRole(this, 'instance-role', {
      name: NamingConvention.generateResourceName(props.namingConfig, 'ec2-role'),
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com'
            }
          }
        ]
      }),
      tags: TaggingStrategy.getResourceTags(props.tagConfig, 'IAMRole')
    });

    // Attach necessary policies
    new IamRolePolicyAttachment(this, 'ssm-policy', {
      role: this.instanceRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
    });

    new IamRolePolicyAttachment(this, 'cloudwatch-policy', {
      role: this.instanceRole.name,
      policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
    });

    // Create instance profile
    const instanceProfile = new IamInstanceProfile(this, 'instance-profile', {
      name: NamingConvention.generateResourceName(props.namingConfig, 'ec2-profile'),
      role: this.instanceRole.name
    });

    // User data script
    const userData = Buffer.from(`#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from ${props.namingConfig.environment}-${props.namingConfig.region}</h1>" > /var/www/html/index.html
echo "OK" > /var/www/html/health

# Install CloudWatch agent
yum install -y amazon-cloudwatch-agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c default
`).toString('base64');

    // Create Launch Template
    this.launchTemplate = new LaunchTemplate(this, 'launch-template', {
      name: NamingConvention.generateResourceName(props.namingConfig, 'lt'),
      imageId: ami.id,
      instanceType: props.instanceType,
      keyName: props.keyName,
      vpcSecurityGroupIds: props.securityGroupIds,
      userData: userData,
      iamInstanceProfile: {
        name: instanceProfile.name
      },
      monitoring: {
        enabled: true
      },
      tagSpecifications: [
        {
          resourceType: 'instance',
          tags: TaggingStrategy.getResourceTags(props.tagConfig, 'EC2Instance', {
            Name: NamingConvention.generateResourceName(props.namingConfig, 'instance')
          })
        }
      ]
    });

    // Create Auto Scaling Group
    this.autoScalingGroup = new AutoscalingGroup(this, 'asg', {
      name: NamingConvention.generateResourceName(props.namingConfig, 'asg'),
      minSize: props.minSize,
      maxSize: props.maxSize,
      desiredCapacity: props.desiredCapacity,
      vpcZoneIdentifier: props.subnetIds,
      targetGroupArns: [props.targetGroupArn],
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 300,
      launchTemplate: {
        id: this.launchTemplate.id,
        version: '$Latest'
      },
      tag: [
        {
          key: 'Name',
          value: NamingConvention.generateResourceName(props.namingConfig, 'asg'),
          propagateAtLaunch: true
        },
        ...Object.entries(TaggingStrategy.getResourceTags(props.tagConfig, 'AutoScalingGroup')).map(([key, value]) => ({
          key,
          value,
          propagateAtLaunch: true
        }))
      ]
    });

    // Create scaling policies
    this.scaleUpPolicy = new AutoscalingPolicy(this, 'scale-up-policy', {
      name: NamingConvention.generateResourceName(props.namingConfig, 'scale-up'),
      scalingAdjustment: 1,
      adjustmentType: 'ChangeInCapacity',
      cooldown: 300,
      autoscalingGroupName: this.autoScalingGroup.name
    });

    this.scaleDownPolicy = new AutoscalingPolicy(this, 'scale-down-policy', {
      name: NamingConvention.generateResourceName(props.namingConfig, 'scale-down'),
      scalingAdjustment: -1,
      adjustmentType: 'ChangeInCapacity',
      cooldown: 300,
      autoscalingGroupName: this.autoScalingGroup.name
    });
  }
}
```

### src/constructs/rds.ts
```typescript
import { Construct } from 'constructs';
import {
  DbSubnetGroup,
  DbInstance,
  DbParameterGroup
} from '@cdktf/provider-aws/lib';
import { NamingConvention, NamingConfig } from '../utils/naming';
import { TaggingStrategy, TagConfig } from '../utils/tagging';

export interface RdsConstructProps {
  namingConfig: NamingConfig