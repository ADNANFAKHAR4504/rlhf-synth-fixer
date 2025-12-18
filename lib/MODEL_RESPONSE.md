# Secure AWS Infrastructure Design with CDK TypeScript

I'll design a secure AWS environment using AWS CDK with TypeScript that adheres to production-level standards, focusing on network segmentation and secure access.

## Project Structure

Let's start by defining the project structure:

```
secure-aws-infra/
├── bin/
│   └── secure-aws-infra.ts
├── lib/
│   ├── secure-aws-infra-stack.ts
│   ├── vpc-construct.ts
│   ├── bastion-construct.ts
│   ├── security-groups-construct.ts
│   └── iam-construct.ts
├── package.json
└── tsconfig.json
```

## Implementation

### 1. Main Stack (`lib/secure-aws-infra-stack.ts`)

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcConstruct } from './vpc-construct';
import { BastionConstruct } from './bastion-construct';
import { SecurityGroupsConstruct } from './security-groups-construct';
import { IamConstruct } from './iam-construct';

export class SecureAwsInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      ...props,
      env: {
        region: 'us-east-1',
      },
      tags: {
        Environment: 'Production',
      },
    });

    // Create VPC and network infrastructure
    const vpcConstruct = new VpcConstruct(this, 'VpcConstruct');

    // Create IAM roles and policies
    const iamConstruct = new IamConstruct(this, 'IamConstruct');

    // Create security groups
    const securityGroupsConstruct = new SecurityGroupsConstruct(this, 'SecurityGroupsConstruct', {
      vpc: vpcConstruct.vpc,
    });

    // Create bastion host
    new BastionConstruct(this, 'BastionConstruct', {
      vpc: vpcConstruct.vpc,
      bastionSecurityGroup: securityGroupsConstruct.bastionSecurityGroup,
      bastionRole: iamConstruct.bastionRole,
    });
  }
}
```

### 2. VPC Configuration (`lib/vpc-construct.ts`)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class VpcConstruct extends Construct {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create a VPC with 2 public and 2 private subnets across 2 AZs
    this.vpc = new ec2.Vpc(this, 'ProductionVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      natGateways: 2, // One NAT Gateway per AZ for high availability
    });

    // Apply tags to all VPC resources
    cdk.Tags.of(this.vpc).add('Environment', 'Production');
  }
}
```

### 3. Bastion Host Configuration (`lib/bastion-construct.ts`)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface BastionConstructProps {
  vpc: ec2.Vpc;
  bastionSecurityGroup: ec2.SecurityGroup;
  bastionRole: iam.Role;
}

export class BastionConstruct extends Construct {
  public readonly bastionHost: ec2.Instance;

  constructor(scope: Construct, id: string, props: BastionConstructProps) {
    super(scope, id);

    // Create the bastion host in the first public subnet
    this.bastionHost = new ec2.Instance(this, 'BastionHost', {
      vpc: props.vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: props.bastionSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      role: props.bastionRole,
    });

    // Apply tags to bastion host
    cdk.Tags.of(this.bastionHost).add('Environment', 'Production');
    cdk.Tags.of(this.bastionHost).add('Name', 'Production-Bastion');
  }
}
```

### 4. Security Groups Configuration (`lib/security-groups-construct.ts`)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface SecurityGroupsConstructProps {
  vpc: ec2.Vpc;
}

export class SecurityGroupsConstruct extends Construct {
  public readonly bastionSecurityGroup: ec2.SecurityGroup;
  public readonly webTierSecurityGroup: ec2.SecurityGroup;
  public readonly appTierSecurityGroup: ec2.SecurityGroup;
  public readonly dbTierSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: SecurityGroupsConstructProps) {
    super(scope, id);

    // Bastion host security group
    this.bastionSecurityGroup = new ec2.SecurityGroup(this, 'BastionSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for bastion host',
      allowAllOutbound: true,
    });

    // Add ingress rule for SSH from specific IPs (replace with your actual allowed IPs)
    this.bastionSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('192.168.1.0/24'), // Example: Replace with your actual allowed IP range
      ec2.Port.tcp(22),
      'Allow SSH access from specific IP range'
    );

    // Web tier security group
    this.webTierSecurityGroup = new ec2.SecurityGroup(this, 'WebTierSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for web tier',
      allowAllOutbound: false,
    });

    // Allow HTTPS inbound
    this.webTierSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Allow SSH from bastion only
    this.webTierSecurityGroup.addIngressRule(
      ec2.Peer.securityGroupId(this.bastionSecurityGroup.securityGroupId),
      ec2.Port.tcp(22),
      'Allow SSH from bastion host'
    );

    // App tier security group
    this.appTierSecurityGroup = new ec2.SecurityGroup(this, 'AppTierSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for application tier',
      allowAllOutbound: false,
    });

    // Allow traffic from web tier only
    this.appTierSecurityGroup.addIngressRule(
      ec2.Peer.securityGroupId(this.webTierSecurityGroup.securityGroupId),
      ec2.Port.tcp(8080), // Example application port
      'Allow traffic from web tier'
    );

    // Allow SSH from bastion only
    this.appTierSecurityGroup.addIngressRule(
      ec2.Peer.securityGroupId(this.bastionSecurityGroup.securityGroupId),
      ec2.Port.tcp(22),
      'Allow SSH from bastion host'
    );

    // Database tier security group
    this.dbTierSecurityGroup = new ec2.SecurityGroup(this, 'DbTierSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for database tier',
      allowAllOutbound: false,
    });

    // Allow traffic from app tier only
    this.dbTierSecurityGroup.addIngressRule(
      ec2.Peer.securityGroupId(this.appTierSecurityGroup.securityGroupId),
      ec2.Port.tcp(5432), // PostgreSQL port as an example
      'Allow traffic from application tier'
    );

    // Add outbound rules
    this.webTierSecurityGroup.addEgressRule(
      ec2.Peer.securityGroupId(this.appTierSecurityGroup.securityGroupId),
      ec2.Port.tcp(8080),
      'Allow outbound to app tier'
    );

    this.appTierSecurityGroup.addEgressRule(
      ec2.Peer.securityGroupId(this.dbTierSecurityGroup.securityGroupId),
      ec2.Port.tcp(5432),
      'Allow outbound to database tier'
    );

    // Allow HTTPS outbound for updates
    this.webTierSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound for updates'
    );

    this.appTierSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound for updates'
    );

    // Apply tags to all security groups
    for (const sg of [this.bastionSecurityGroup, this.webTierSecurityGroup, this.appTierSecurityGroup, this.dbTierSecurityGroup]) {
      cdk.Tags.of(sg).add('Environment', 'Production');
    }
  }
}
```

### 5. IAM Roles and Policies (`lib/iam-construct.ts`)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class IamConstruct extends Construct {
  public readonly bastionRole: iam.Role;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create IAM role for bastion host with least privilege
    this.bastionRole = new iam.Role(this, 'BastionHostRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Role for bastion host with minimal permissions',
    });

    // Add SSM permissions for session management (alternative to direct SSH)
    this.bastionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
    );

    // Custom policy for minimal CloudWatch logging
    const loggingPolicy = new iam.Policy(this, 'BastionLoggingPolicy', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
            'logs:DescribeLogStreams',
          ],
          resources: ['arn:aws:logs:us-east-1:*:log-group:/aws/ec2/bastion/*'],
        }),
      ],
    });

    loggingPolicy.attachToRole(this.bastionRole);

    // Apply tags
    cdk.Tags.of(this.bastionRole).add('Environment', 'Production');
    cdk.Tags.of(loggingPolicy).add('Environment', 'Production');
  }
}
```

### 6. Entry Point (`bin/secure-aws-infra.ts`)

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SecureAwsInfraStack } from '../lib/secure-aws-infra-stack';

const app = new cdk.App();
new SecureAwsInfraStack(app, 'SecureAwsInfraStack', {
  description: 'Production-grade secure AWS infrastructure with network segmentation',
});
```

## Security Features Implemented

1. **Network Segmentation**:
   - VPC with separate public and private subnets across 2 AZs
   - NAT Gateways for secure outbound internet access from private subnets

2. **Secure Access**:
   - Bastion host in public subnet with restricted SSH access
   - Security groups with least privilege access between tiers
   - No direct internet access to private resources

3. **IAM Least Privilege**:
   - Minimal IAM roles and policies for the bastion host
   - SSM Session Manager support for secure shell access without opening SSH ports

4. **High Availability**:
   - Resources distributed across multiple Availability Zones
   - Redundant NAT Gateways for fault tolerance

5. **Security Groups**:
   - Strict ingress/egress rules between application tiers
   - SSH access limited to specific IP ranges, not 0.0.0.0/0
   - Explicit allow rules for required communication paths only

6. **Resource Tagging**:
   - All resources tagged with Environment:Production

## Deployment Instructions

1. Install dependencies:
```bash
npm install aws-cdk-lib constructs source-map-support
```

2. Bootstrap your AWS environment (if not already done):
```bash
cdk bootstrap aws://YOUR_ACCOUNT_NUMBER/us-east-1
```

3. Deploy the stack:
```bash
cdk deploy
```

This implementation provides a secure, production-ready AWS environment with proper network segmentation, secure access controls, and adherence to the principle of least privilege.