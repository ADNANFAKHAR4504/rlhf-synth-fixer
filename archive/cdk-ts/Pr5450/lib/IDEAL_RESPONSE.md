# Multi-Tier VPC Infrastructure - Implementation

This implementation creates a production-ready multi-tier VPC infrastructure with PCI DSS compliance features using AWS CDK with TypeScript.

## Architecture Overview

The solution deploys:
- VPC with 10.0.0.0/16 CIDR block across 3 availability zones
- Three subnet tiers: public, private, and database
- High availability NAT Gateways (one per AZ)
- Internet Gateway for public subnet access
- VPC Flow Logs with CloudWatch Logs destination
- Security groups for web, app, and database tiers
- Proper route tables with explicit associations

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // Create VPC with CIDR 10.0.0.0/16
    const vpc = new ec2.Vpc(this, `PaymentVpc-${environmentSuffix}`, {
      vpcName: `payment-vpc-${environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      natGateways: 3, // High availability mode - one per AZ
      subnetConfiguration: [
        {
          name: `public-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: `private-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: `database-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // Tag all VPC resources
    cdk.Tags.of(vpc).add('Environment', 'production');
    cdk.Tags.of(vpc).add('Project', 'payment-platform');

    // Create CloudWatch Log Group for VPC Flow Logs
    const flowLogGroup = new logs.LogGroup(
      this,
      `VpcFlowLogGroup-${environmentSuffix}`,
      {
        logGroupName: `/aws/vpc/flow-logs-group-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Create IAM role for VPC Flow Logs
    const flowLogRole = new iam.Role(
      this,
      `VpcFlowLogRole-${environmentSuffix}`,
      {
        roleName: `vpc-flowlog-role-${environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      }
    );

    flowLogRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogGroups',
          'logs:DescribeLogStreams',
        ],
        resources: [flowLogGroup.logGroupArn],
      })
    );

    // Enable VPC Flow Logs
    new ec2.CfnFlowLog(this, `VpcFlowLog-${environmentSuffix}`, {
      resourceType: 'VPC',
      resourceId: vpc.vpcId,
      trafficType: 'ALL',
      logDestinationType: 'cloud-watch-logs',
      logGroupName: flowLogGroup.logGroupName,
      deliverLogsPermissionArn: flowLogRole.roleArn,
      tags: [
        { key: 'Environment', value: 'production' },
        { key: 'Project', value: 'payment-platform' },
      ],
    });

    // Create Security Group for Web Tier
    const webSecurityGroup = new ec2.SecurityGroup(
      this,
      `WebSecurityGroup-${environmentSuffix}`,
      {
        vpc,
        securityGroupName: `web-sg-${environmentSuffix}`,
        description: 'Security group for web tier - allows HTTP/HTTPS',
        allowAllOutbound: true,
      }
    );

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    cdk.Tags.of(webSecurityGroup).add('Environment', 'production');
    cdk.Tags.of(webSecurityGroup).add('Project', 'payment-platform');
    cdk.Tags.of(webSecurityGroup).add('Tier', 'web');

    // Create Security Group for App Tier
    const appSecurityGroup = new ec2.SecurityGroup(
      this,
      `AppSecurityGroup-${environmentSuffix}`,
      {
        vpc,
        securityGroupName: `app-sg-${environmentSuffix}`,
        description:
          'Security group for application tier - allows traffic from web tier',
        allowAllOutbound: true,
      }
    );

    appSecurityGroup.addIngressRule(
      webSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow traffic from web tier on port 8080'
    );

    cdk.Tags.of(appSecurityGroup).add('Environment', 'production');
    cdk.Tags.of(appSecurityGroup).add('Project', 'payment-platform');
    cdk.Tags.of(appSecurityGroup).add('Tier', 'application');

    // Create Security Group for Database Tier
    const databaseSecurityGroup = new ec2.SecurityGroup(
      this,
      `DatabaseSecurityGroup-${environmentSuffix}`,
      {
        vpc,
        securityGroupName: `database-sg-${environmentSuffix}`,
        description:
          'Security group for database tier - allows traffic from app tier',
        allowAllOutbound: false,
      }
    );

    databaseSecurityGroup.addIngressRule(
      appSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL traffic from app tier'
    );

    databaseSecurityGroup.addIngressRule(
      appSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL traffic from app tier'
    );

    cdk.Tags.of(databaseSecurityGroup).add('Environment', 'production');
    cdk.Tags.of(databaseSecurityGroup).add('Project', 'payment-platform');
    cdk.Tags.of(databaseSecurityGroup).add('Tier', 'database');

    // Export VPC ID
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID for payment platform',
      exportName: `payment-vpc-id-${environmentSuffix}`,
    });

    // Export VPC CIDR
    new cdk.CfnOutput(this, 'VpcCidr', {
      value: vpc.vpcCidrBlock,
      description: 'VPC CIDR block',
      exportName: `payment-vpc-cidr-${environmentSuffix}`,
    });

    // Export Public Subnet IDs
    const publicSubnetIds = vpc.publicSubnets.map(subnet => subnet.subnetId);
    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: cdk.Fn.join(',', publicSubnetIds),
      description: 'Public subnet IDs across 3 AZs',
      exportName: `payment-public-subnets-${environmentSuffix}`,
    });

    // Export Private Subnet IDs
    const privateSubnetIds = vpc.privateSubnets.map(subnet => subnet.subnetId);
    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: cdk.Fn.join(',', privateSubnetIds),
      description: 'Private subnet IDs across 3 AZs',
      exportName: `payment-private-subnets-${environmentSuffix}`,
    });

    // Export Isolated (Database) Subnet IDs
    const isolatedSubnetIds = vpc.isolatedSubnets.map(
      subnet => subnet.subnetId
    );
    new cdk.CfnOutput(this, 'DatabaseSubnetIds', {
      value: cdk.Fn.join(',', isolatedSubnetIds),
      description: 'Database subnet IDs across 3 AZs',
      exportName: `payment-database-subnets-${environmentSuffix}`,
    });

    // Export Security Group IDs
    new cdk.CfnOutput(this, 'WebSecurityGroupId', {
      value: webSecurityGroup.securityGroupId,
      description: 'Security group ID for web tier',
      exportName: `payment-web-sg-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AppSecurityGroupId', {
      value: appSecurityGroup.securityGroupId,
      description: 'Security group ID for application tier',
      exportName: `payment-app-sg-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabaseSecurityGroupId', {
      value: databaseSecurityGroup.securityGroupId,
      description: 'Security group ID for database tier',
      exportName: `payment-database-sg-${environmentSuffix}`,
    });

    // Export Availability Zones
    new cdk.CfnOutput(this, 'AvailabilityZones', {
      value: cdk.Fn.join(',', vpc.availabilityZones),
      description: 'Availability zones used by VPC',
      exportName: `payment-azs-${environmentSuffix}`,
    });

    // Export Internet Gateway ID
    new cdk.CfnOutput(this, 'InternetGatewayId', {
      value: vpc.internetGatewayId!,
      description: 'Internet Gateway ID',
      exportName: `payment-igw-${environmentSuffix}`,
    });

    // Export Flow Log Group Name
    new cdk.CfnOutput(this, 'FlowLogGroupName', {
      value: flowLogGroup.logGroupName,
      description: 'CloudWatch Log Group for VPC Flow Logs',
      exportName: `payment-flowlog-group-${environmentSuffix}`,
    });
  }
}
```

## File: bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
```

## Architecture

The infrastructure includes:

- **VPC**: 10.0.0.0/16 CIDR block spanning 3 availability zones
- **Subnet Tiers**:
  - Public subnets (3 AZs) - for load balancers and NAT Gateways
  - Private subnets (3 AZs) - for application servers
  - Database subnets (3 AZs) - isolated tier for databases
- **High Availability**: NAT Gateway in each availability zone
- **Internet Gateway**: Attached to VPC for public subnet access
- **VPC Flow Logs**: All traffic logged to CloudWatch Logs
- **Security Groups**:
  - Web tier: Allows HTTP (80) and HTTPS (443) from internet
  - App tier: Allows traffic from web tier on port 8080
  - Database tier: Allows PostgreSQL (5432) and MySQL (3306) from app tier only
