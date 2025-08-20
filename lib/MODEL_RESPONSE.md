I'll help you create a comprehensive CDKTF configuration for a multi-environment AWS setup. This solution will use TypeScript and follow infrastructure as code best practices.

## Configuration Files

### package.json

```json
{
  "name": "cdktf-multi-env",
  "version": "1.0.0",
  "main": "main.js",
  "types": "main.ts",
  "scripts": {
    "get": "cdktf get",
    "build": "tsc",
    "synth": "cdktf synth",
    "compile": "tsc --pretty",
    "watch": "tsc -w",
    "test": "jest",
    "deploy": "cdktf deploy",
    "destroy": "cdktf destroy",
    "upgrade": "npm i cdktf@latest cdktf-cli@latest",
    "upgrade:next": "npm i cdktf@next cdktf-cli@next"
  },
  "engines": {
    "node": ">=16.0"
  },
  "dependencies": {
    "@cdktf/aws-provider": "^19.0.0",
    "cdktf": "^0.20.0",
    "constructs": "^10.0.0"
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
    "alwaysStrict": true,
    "charset": "utf8",
    "declaration": true,
    "experimentalDecorators": true,
    "inlineSourceMap": true,
    "inlineSources": true,
    "lib": ["es2020"],
    "module": "CommonJS",
    "noEmitOnError": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "resolveJsonModule": true,
    "strict": true,
    "strictNullChecks": true,
    "strictPropertyInitialization": true,
    "stripInternal": true,
    "target": "ES2020",
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### cdktf.json

```json
{
  "language": "typescript",
  "app": "npm run --silent compile && node main.js",
  "projectId": "multi-env-infrastructure",
  "sendCrashReports": "false",
  "terraformProviders": ["aws@~> 5.0"],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true"
  }
}
```

## Environment Configuration

### src/config/environments.ts

```typescript
export interface EnvironmentConfig {
  name: string;
  region: string;
  cidrBlock: string;
  publicSubnets: string[];
  privateSubnets: string[];
  instanceType: string;
  minSize: number;
  maxSize: number;
  desiredCapacity: number;
  dbInstanceClass: string;
  dbAllocatedStorage: number;
  tags: Record<string, string>;
}

export const environments: Record<string, EnvironmentConfig> = {
  dev: {
    name: 'dev',
    region: 'us-east-1',
    cidrBlock: '10.0.0.0/16',
    publicSubnets: ['10.0.1.0/24', '10.0.2.0/24'],
    privateSubnets: ['10.0.10.0/24', '10.0.20.0/24'],
    instanceType: 't3.micro',
    minSize: 1,
    maxSize: 3,
    desiredCapacity: 2,
    dbInstanceClass: 'db.t3.micro',
    dbAllocatedStorage: 20,
    tags: {
      Environment: 'dev',
      Project: 'multi-env-app',
      ManagedBy: 'CDKTF',
    },
  },
  test: {
    name: 'test',
    region: 'us-east-1',
    cidrBlock: '10.1.0.0/16',
    publicSubnets: ['10.1.1.0/24', '10.1.2.0/24'],
    privateSubnets: ['10.1.10.0/24', '10.1.20.0/24'],
    instanceType: 't3.small',
    minSize: 2,
    maxSize: 5,
    desiredCapacity: 3,
    dbInstanceClass: 'db.t3.small',
    dbAllocatedStorage: 50,
    tags: {
      Environment: 'test',
      Project: 'multi-env-app',
      ManagedBy: 'CDKTF',
    },
  },
  prod: {
    name: 'prod',
    region: 'us-east-1',
    cidrBlock: '10.2.0.0/16',
    publicSubnets: ['10.2.1.0/24', '10.2.2.0/24'],
    privateSubnets: ['10.2.10.0/24', '10.2.20.0/24'],
    instanceType: 't3.medium',
    minSize: 3,
    maxSize: 10,
    desiredCapacity: 5,
    dbInstanceClass: 'db.t3.medium',
    dbAllocatedStorage: 100,
    tags: {
      Environment: 'prod',
      Project: 'multi-env-app',
      ManagedBy: 'CDKTF',
    },
  },
};
```

## Security

```typescript
import { Construct } from 'constructs';
import {
  SecurityGroup,
  SecurityGroupRule,
  NetworkAcl,
  NetworkAclRule,
  IamRole,
  IamRolePolicyAttachment,
  IamInstanceProfile,
  KmsKey,
  KmsAlias,
  DataAwsIamPolicyDocument,
} from '@cdktf/provider-aws';
import { EnvironmentConfig } from '../config/environments';

export interface SecurityProps {
  config: EnvironmentConfig;
  vpcId: string;
  publicSubnetIds: string[];
  privateSubnetIds: string[];
}

export class Security extends Construct {
  public readonly albSecurityGroup: SecurityGroup;
  public readonly ec2SecurityGroup: SecurityGroup;
  public readonly rdsSecurityGroup: SecurityGroup;
  public readonly ec2Role: IamRole;
  public readonly ec2InstanceProfile: IamInstanceProfile;
  public readonly kmsKey: KmsKey;

  constructor(scope: Construct, id: string, props: SecurityProps) {
    super(scope, id);

    // KMS Key for encryption
    this.kmsKey = new KmsKey(this, 'kms-key', {
      description: `KMS key for ${props.config.name} environment`,
      deletionWindowInDays: 7,
      tags: {
        ...props.config.tags,
        Name: `${props.config.name}-kms-key`,
      },
    });

    new KmsAlias(this, 'kms-alias', {
      name: `alias/${props.config.name}-app-key`,
      targetKeyId: this.kmsKey.keyId,
    });

    // ALB Security Group
    this.albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      name: `${props.config.name}-alb-sg`,
      description: 'Security group for Application Load Balancer',
      vpcId: props.vpcId,
      tags: {
        ...props.config.tags,
        Name: `${props.config.name}-alb-sg`,
      },
    });

    // ALB Security Group Rules
    new SecurityGroupRule(this, 'alb-ingress-http', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.albSecurityGroup.id,
      description: 'Allow HTTP traffic from internet',
    });

    new SecurityGroupRule(this, 'alb-ingress-https', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.albSecurityGroup.id,
      description: 'Allow HTTPS traffic from internet',
    });

    new SecurityGroupRule(this, 'alb-egress-all', {
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: 'tcp',
      cidrBlocks: [props.config.cidrBlock],
      securityGroupId: this.albSecurityGroup.id,
      description: 'Allow outbound traffic to VPC',
    });

    // EC2 Security Group
    this.ec2SecurityGroup = new SecurityGroup(this, 'ec2-sg', {
      name: `${props.config.name}-ec2-sg`,
      description: 'Security group for EC2 instances',
      vpcId: props.vpcId,
      tags: {
        ...props.config.tags,
        Name: `${props.config.name}-ec2-sg`,
      },
    });

    // EC2 Security Group Rules
    new SecurityGroupRule(this, 'ec2-ingress-alb', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      sourceSecurityGroupId: this.albSecurityGroup.id,
      securityGroupId: this.ec2SecurityGroup.id,
      description: 'Allow HTTP traffic from ALB',
    });

    new SecurityGroupRule(this, 'ec2-egress-https', {
      type: 'egress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.ec2SecurityGroup.id,
      description: 'Allow HTTPS outbound for updates',
    });

    new SecurityGroupRule(this, 'ec2-egress-http', {
      type: 'egress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.ec2SecurityGroup.id,
      description: 'Allow HTTP outbound for updates',
    });

    // RDS Security Group
    this.rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: `${props.config.name}-rds-sg`,
      description: 'Security group for RDS instance',
      vpcId: props.vpcId,
      tags: {
        ...props.config.tags,
        Name: `${props.config.name}-rds-sg`,
      },
    });

    new SecurityGroupRule(this, 'rds-ingress-ec2', {
      type: 'ingress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      sourceSecurityGroupId: this.ec2SecurityGroup.id,
      securityGroupId: this.rdsSecurityGroup.id,
      description: 'Allow MySQL traffic from EC2 instances',
    });

    // Network ACLs for additional security
    this.createNetworkAcls(props);

    // IAM Role for EC2 instances
    this.createIamResources(props);
  }

  private createNetworkAcls(props: SecurityProps) {
    // Public subnet NACL
    const publicNacl = new NetworkAcl(this, 'public-nacl', {
      vpcId: props.vpcId,
      subnetIds: props.publicSubnetIds,
      tags: {
        ...props.config.tags,
        Name: `${props.config.name}-public-nacl`,
      },
    });

    // Public NACL Rules - Allow HTTP/HTTPS inbound and ephemeral ports outbound
    new NetworkAclRule(this, 'public-nacl-http-in', {
      networkAclId: publicNacl.id,
      ruleNumber: 100,
      protocol: 'tcp',
      ruleAction: 'allow',
      fromPort: 80,
      toPort: 80,
      cidrBlock: '0.0.0.0/0',
    });

    new NetworkAclRule(this, 'public-nacl-https-in', {
      networkAclId: publicNacl.id,
      ruleNumber: 110,
      protocol: 'tcp',
      ruleAction: 'allow',
      fromPort: 443,
      toPort: 443,
      cidrBlock: '0.0.0.0/0',
    });

    new NetworkAclRule(this, 'public-nacl-ephemeral-in', {
      networkAclId: publicNacl.id,
      ruleNumber: 120,
      protocol: 'tcp',
      ruleAction: 'allow',
      fromPort: 1024,
      toPort: 65535,
      cidrBlock: '0.0.0.0/0',
    });

    new NetworkAclRule(this, 'public-nacl-all-out', {
      networkAclId: publicNacl.id,
      ruleNumber: 100,
      protocol: 'tcp',
      ruleAction: 'allow',
      fromPort: 0,
      toPort: 65535,
      cidrBlock: '0.0.0.0/0',
      egress: true,
    });

    // Private subnet NACL
    const privateNacl = new NetworkAcl(this, 'private-nacl', {
      vpcId: props.vpcId,
      subnetIds: props.privateSubnetIds,
      tags: {
        ...props.config.tags,
        Name: `${props.config.name}-private-nacl`,
      },
    });

    // Private NACL Rules - More restrictive
    new NetworkAclRule(this, 'private-nacl-vpc-in', {
      networkAclId: privateNacl.id,
      ruleNumber: 100,
      protocol: 'tcp',
      ruleAction: 'allow',
      fromPort: 0,
      toPort: 65535,
      cidrBlock: props.config.cidrBlock,
    });

    new NetworkAclRule(this, 'private-nacl-ephemeral-in', {
      networkAclId: privateNacl.id,
      ruleNumber: 110,
      protocol: 'tcp',
      ruleAction: 'allow',
      fromPort: 1024,
      toPort: 65535,
      cidrBlock: '0.0.0.0/0',
    });

    new NetworkAclRule(this, 'private-nacl-all-out', {
      networkAclId: privateNacl.id,
      ruleNumber: 100,
      protocol: 'tcp',
      ruleAction: 'allow',
      fromPort: 0,
      toPort: 65535,
      cidrBlock: '0.0.0.0/0',
      egress: true,
    });
  }

  private createIamResources(props: SecurityProps) {
    // IAM policy document for EC2 assume role
    const assumeRolePolicy = new DataAwsIamPolicyDocument(
      this,
      'ec2-assume-role-policy',
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

    // EC2 IAM Role with minimal permissions
    this.ec2Role = new IamRole(this, 'ec2-role', {
      name: `${props.config.name}-ec2-role`,
      assumeRolePolicy: assumeRolePolicy.json,
      tags: {
        ...props.config.tags,
        Name: `${props.config.name}-ec2-role`,
      },
    });

    // Attach minimal required policies
    new IamRolePolicyAttachment(this, 'ec2-ssm-policy', {
      role: this.ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    });

    // Instance profile for EC2
    this.ec2InstanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: `${props.config.name}-ec2-instance-profile`,
        role: this.ec2Role.name,
        tags: {
          ...props.config.tags,
          Name: `${props.config.name}-ec2-instance-profile`,
        },
      }
    );
  }
}
```

## Networking

```typescript
import { Construct } from 'constructs';
import {
  Vpc,
  Subnet,
  InternetGateway,
  NatGateway,
  Eip,
  RouteTable,
  Route,
  RouteTableAssociation,
  DataAwsAvailabilityZones,
} from '@cdktf/provider-aws';
import { EnvironmentConfig } from '../config/environments';

export interface NetworkingProps {
  config: EnvironmentConfig;
}

export class Networking extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly internetGateway: InternetGateway;
  public readonly natGateways: NatGateway[];

  constructor(scope: Construct, id: string, props: NetworkingProps) {
    super(scope, id);

    // Get availability zones
    const azs = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    // VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: props.config.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...props.config.tags,
        Name: `${props.config.name}-vpc`,
      },
    });

    // Internet Gateway
    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        ...props.config.tags,
        Name: `${props.config.name}-igw`,
      },
    });

    // Public Subnets
    this.publicSubnets = props.config.publicSubnets.map(
      (cidr, index) =>
        new Subnet(this, `public-subnet-${index}`, {
          vpcId: this.vpc.id,
          cidrBlock: cidr,
          availabilityZone: `\${${azs.fqn}.names[${index}]}`,
          mapPublicIpOnLaunch: true,
          tags: {
            ...props.config.tags,
            Name: `${props.config.name}-public-subnet-${index + 1}`,
            Type: 'Public',
          },
        })
    );

    // Private Subnets
    this.privateSubnets = props.config.privateSubnets.map(
      (cidr, index) =>
        new Subnet(this, `private-subnet-${index}`, {
          vpcId: this.vpc.id,
          cidrBlock: cidr,
          availabilityZone: `\${${azs.fqn}.names[${index}]}`,
          tags: {
            ...props.config.tags,
            Name: `${props.config.name}-private-subnet-${index + 1}`,
            Type: 'Private',
          },
        })
    );

    // Elastic IPs for NAT Gateways
    const eips = this.publicSubnets.map(
      (_, index) =>
        new Eip(this, `nat-eip-${index}`, {
          domain: 'vpc',
          dependsOn: [this.internetGateway],
          tags: {
            ...props.config.tags,
            Name: `${props.config.name}-nat-eip-${index + 1}`,
          },
        })
    );

    // NAT Gateways
    this.natGateways = this.publicSubnets.map(
      (subnet, index) =>
        new NatGateway(this, `nat-gateway-${index}`, {
          allocationId: eips[index].id,
          subnetId: subnet.id,
          tags: {
            ...props.config.tags,
            Name: `${props.config.name}-nat-gateway-${index + 1}`,
          },
        })
    );

    // Route Tables
    this.createRouteTables(props);
  }

  private createRouteTables(props: NetworkingProps) {
    // Public Route Table
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        ...props.config.tags,
        Name: `${props.config.name}-public-rt`,
      },
    });

    // Public Route to Internet Gateway
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rt-association-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Private Route Tables (one per AZ for high availability)
    this.privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new RouteTable(this, `private-rt-${index}`, {
        vpcId: this.vpc.id,
        tags: {
          ...props.config.tags,
          Name: `${props.config.name}-private-rt-${index + 1}`,
        },
      });

      // Private Route to NAT Gateway
      new Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: this.natGateways[index].id,
      });

      // Associate private subnet with private route table
      new RouteTableAssociation(this, `private-rt-association-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });
  }
}
```

## Compute

```typescript
import { Construct } from 'constructs';
import {
  LaunchTemplate,
  AutoscalingGroup,
  Lb,
  LbTargetGroup,
  LbListener,
  AutoscalingAttachment,
  DataAwsAmi,
  DataAwsAvailabilityZones,
} from '@cdktf/provider-aws';
import { EnvironmentConfig } from '../config/environments';

export interface ComputeProps {
  config: EnvironmentConfig;
  vpcId: string;
  publicSubnetIds: string[];
  privateSubnetIds: string[];
  securityGroupId: string;
  albSecurityGroupId: string;
  instanceProfileName: string;
}

export class Compute extends Construct {
  public readonly loadBalancer: Lb;
  public readonly targetGroup: LbTargetGroup;
  public readonly autoScalingGroup: AutoscalingGroup;

  constructor(scope: Construct, id: string, props: ComputeProps) {
    super(scope, id);

    // Get latest Amazon Linux 2 AMI
    const ami = new DataAwsAmi(this, 'amazon-linux', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
    });

    // User data script for EC2 instances
    const userData = `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from ${props.config.name} environment!</h1>" > /var/www/html/index.html
echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
echo "<p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html
`;

    // Launch Template
    const launchTemplate = new LaunchTemplate(this, 'launch-template', {
      name: `${props.config.name}-launch-template`,
      imageId: ami.id,
      instanceType: props.config.instanceType,
      keyName: undefined, // Use SSM Session Manager instead of SSH keys
      vpcSecurityGroupIds: [props.securityGroupId],
      iamInstanceProfile: {
        name: props.instanceProfileName,
      },
      userData: Buffer.from(userData).toString('base64'),
      blockDeviceMappings: [
        {
          deviceName: '/dev/xvda',
          ebs: {
            volumeSize: 20,
            volumeType: 'gp3',
            encrypted: true,
            deleteOnTermination: true,
          },
        },
      ],
      monitoring: {
        enabled: true,
      },
      tagSpecifications: [
        {
          resourceType: 'instance',
          tags: {
            ...props.config.tags,
            Name: `${props.config.name}-instance`,
          },
        },
      ],
      tags: {
        ...props.config.tags,
        Name: `${props.config.name}-launch-template`,
      },
    });

    // Application Load Balancer
    this.loadBalancer = new Lb(this, 'alb', {
      name: `${props.config.name}-alb`,
      loadBalancerType: 'application',
      subnets: props.publicSubnetIds,
      securityGroups: [props.albSecurityGroupId],
      enableDeletionProtection: props.config.name === 'prod',
      tags: {
        ...props.config.tags,
        Name: `${props.config.name}-alb`,
      },
    });

    // Target Group
    this.targetGroup = new LbTargetGroup(this, 'target-group', {
      name: `${props.config.name}-tg`,
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
        path: '/',
        matcher: '200',
        port: 'traffic-port',
        protocol: 'HTTP',
      },
      tags: {
        ...props.config.tags,
        Name: `${props.config.name}-tg`,
      },
    });

    // Load Balancer Listener
    new LbListener(this, 'alb-listener', {
      loadBalancerArn: this.loadBalancer.arn,
      port: '80',
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: this.targetGroup.arn,
        },
      ],
      tags: {
        ...props.config.tags,
        Name: `${props.config.name}-listener`,
      },
    });

    // Auto Scaling Group
    this.autoScalingGroup = new AutoscalingGroup(this, 'asg', {
      name: `${props.config.name}-asg`,
      vpcZoneIdentifier: props.privateSubnetIds,
      minSize: props.config.minSize,
      maxSize: props.config.maxSize,
      desiredCapacity: props.config.desiredCapacity,
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 300,
      launchTemplate: {
        id: launchTemplate.id,
        version: '$Latest',
      },
      tag: Object.entries({
        ...props.config.tags,
        Name: `${props.config.name}-asg`,
      }).map(([key, value]) => ({
        key,
        value,
        propagateAtLaunch: true,
      })),
    });

    // Attach Auto Scaling Group to Target Group
    new AutoscalingAttachment(this, 'asg-attachment', {
      autoscalingGroupName: this.autoScalingGroup.id,
      lbTargetGroupArn: this.targetGroup.arn,
    });
  }
}
```

## Database

```typescript
import { Construct } from 'constructs';
import {
  DbInstance,
  DbSubnetGroup,
  DbParameterGroup
} from '@cdktf/provider-aws';
import { EnvironmentConfig } from '../config/environments';

export interface DatabaseProps {
  config: EnvironmentConfig;
  privateSubnetIds: string[];
  securityGroupId: string;
  kmsKeyId: string;
}

export class Database extends Construct {
  public readonly dbInstance: DbInstance;
  public readonly dbSubnetGroup: DbSubnetGroup;

  constructor(scope: Construct, id: string, props: DatabaseProps) {
    super(scope, id);

    // DB Subnet Group
    this.dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `${props.config.name}-db-subnet-group`,
      subnetIds: props.privateSubnetIds,
      description: `Database subnet group for ${props.config.name} environment`,
      tags: {
        ...props.config.tags,
        Name: `${props.config.name}-db-subnet-group`
      }
    });

    // DB Parameter Group
    const dbParameterGroup = new DbParameterGroup(this, 'db-parameter-group', {
      family: 'mysql8.0',
      name: `${props.config.name}-db-params`,
      description: `Database parameter group for ${props.config.
```
