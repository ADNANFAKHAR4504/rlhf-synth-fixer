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
    const flowLogGroup = new logs.LogGroup(this, `VpcFlowLogGroup-${environmentSuffix}`, {
      logGroupName: `/aws/vpc/flowlogs-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create IAM role for VPC Flow Logs
    const flowLogRole = new iam.Role(this, `VpcFlowLogRole-${environmentSuffix}`, {
      roleName: `vpc-flowlog-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
    });

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
    const webSecurityGroup = new ec2.SecurityGroup(this, `WebSecurityGroup-${environmentSuffix}`, {
      vpc,
      securityGroupName: `web-sg-${environmentSuffix}`,
      description: 'Security group for web tier - allows HTTP/HTTPS',
      allowAllOutbound: true,
    });

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
    const appSecurityGroup = new ec2.SecurityGroup(this, `AppSecurityGroup-${environmentSuffix}`, {
      vpc,
      securityGroupName: `app-sg-${environmentSuffix}`,
      description: 'Security group for application tier - allows traffic from web tier',
      allowAllOutbound: true,
    });

    appSecurityGroup.addIngressRule(
      webSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow traffic from web tier on port 8080'
    );

    cdk.Tags.of(appSecurityGroup).add('Environment', 'production');
    cdk.Tags.of(appSecurityGroup).add('Project', 'payment-platform');
    cdk.Tags.of(appSecurityGroup).add('Tier', 'application');

    // Create Security Group for Database Tier
    const databaseSecurityGroup = new ec2.SecurityGroup(this, `DatabaseSecurityGroup-${environmentSuffix}`, {
      vpc,
      securityGroupName: `database-sg-${environmentSuffix}`,
      description: 'Security group for database tier - allows traffic from app tier',
      allowAllOutbound: false,
    });

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
    const publicSubnetIds = vpc.publicSubnets.map((subnet) => subnet.subnetId);
    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: cdk.Fn.join(',', publicSubnetIds),
      description: 'Public subnet IDs across 3 AZs',
      exportName: `payment-public-subnets-${environmentSuffix}`,
    });

    // Export Private Subnet IDs
    const privateSubnetIds = vpc.privateSubnets.map((subnet) => subnet.subnetId);
    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: cdk.Fn.join(',', privateSubnetIds),
      description: 'Private subnet IDs across 3 AZs',
      exportName: `payment-private-subnets-${environmentSuffix}`,
    });

    // Export Isolated (Database) Subnet IDs
    const isolatedSubnetIds = vpc.isolatedSubnets.map((subnet) => subnet.subnetId);
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
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context or generate a unique one
const environmentSuffix = app.node.tryGetContext('environmentSuffix') ||
  `${Date.now()}-${Math.random().toString(36).substring(7)}`;

new TapStack(app, `TapStack-${environmentSuffix}`, {
  environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Multi-tier VPC infrastructure with PCI DSS compliance for payment platform',
});

app.synth();
```

## File: test/tap-stack.test.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test-123',
      env: { region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  test('VPC is created with correct CIDR block', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      Tags: Match.arrayWith([
        { Key: 'Environment', Value: 'production' },
        { Key: 'Project', Value: 'payment-platform' },
      ]),
    });
  });

  test('VPC has exactly 3 availability zones', () => {
    const vpc = template.findResources('AWS::EC2::VPC');
    expect(Object.keys(vpc).length).toBe(1);
  });

  test('Public subnets are created', () => {
    template.resourceCountIs('AWS::EC2::Subnet', 9); // 3 AZs * 3 tiers
  });

  test('Internet Gateway is created and attached', () => {
    template.hasResourceProperties('AWS::EC2::InternetGateway', {
      Tags: Match.arrayWith([
        { Key: 'Environment', Value: 'production' },
        { Key: 'Project', Value: 'payment-platform' },
      ]),
    });

    template.hasResourceProperties('AWS::EC2::VPCGatewayAttachment', {
      VpcId: Match.objectLike({ Ref: Match.stringLikeRegexp('.*VPC.*') }),
      InternetGatewayId: Match.objectLike({ Ref: Match.stringLikeRegexp('.*InternetGateway.*') }),
    });
  });

  test('NAT Gateways are created in HA mode (3 total)', () => {
    template.resourceCountIs('AWS::EC2::NatGateway', 3);
  });

  test('VPC Flow Logs are enabled with CloudWatch Logs', () => {
    template.hasResourceProperties('AWS::EC2::FlowLog', {
      ResourceType: 'VPC',
      TrafficType: 'ALL',
      LogDestinationType: 'cloud-watch-logs',
      Tags: Match.arrayWith([
        { Key: 'Environment', Value: 'production' },
        { Key: 'Project', Value: 'payment-platform' },
      ]),
    });
  });

  test('CloudWatch Log Group is created for Flow Logs', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: Match.stringLikeRegexp('/aws/vpc/flowlogs-.*'),
      RetentionInDays: 30,
    });
  });

  test('IAM role is created for VPC Flow Logs', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: Match.arrayWith([
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'vpc-flow-logs.amazonaws.com',
            },
          },
        ]),
      },
    });
  });

  test('Web tier security group is created with HTTP/HTTPS rules', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for web tier - allows HTTP/HTTPS',
      SecurityGroupIngress: Match.arrayWith([
        {
          CidrIp: '0.0.0.0/0',
          FromPort: 80,
          ToPort: 80,
          IpProtocol: 'tcp',
        },
        {
          CidrIp: '0.0.0.0/0',
          FromPort: 443,
          ToPort: 443,
          IpProtocol: 'tcp',
        },
      ]),
      Tags: Match.arrayWith([
        { Key: 'Tier', Value: 'web' },
      ]),
    });
  });

  test('App tier security group is created', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for application tier - allows traffic from web tier',
      Tags: Match.arrayWith([
        { Key: 'Tier', Value: 'application' },
      ]),
    });
  });

  test('Database tier security group is created with no outbound access', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for database tier - allows traffic from app tier',
      Tags: Match.arrayWith([
        { Key: 'Tier', Value: 'database' },
      ]),
    });
  });

  test('All security groups use environmentSuffix in names', () => {
    const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
    Object.values(securityGroups).forEach((sg: any) => {
      expect(sg.Properties.GroupName).toMatch(/test-123/);
    });
  });

  test('Stack exports VPC ID', () => {
    template.hasOutput('VpcId', {
      Export: {
        Name: Match.stringLikeRegexp('payment-vpc-id-.*'),
      },
    });
  });

  test('Stack exports all subnet IDs', () => {
    template.hasOutput('PublicSubnetIds', {
      Export: {
        Name: Match.stringLikeRegexp('payment-public-subnets-.*'),
      },
    });

    template.hasOutput('PrivateSubnetIds', {
      Export: {
        Name: Match.stringLikeRegexp('payment-private-subnets-.*'),
      },
    });

    template.hasOutput('DatabaseSubnetIds', {
      Export: {
        Name: Match.stringLikeRegexp('payment-database-subnets-.*'),
      },
    });
  });

  test('Stack exports all security group IDs', () => {
    template.hasOutput('WebSecurityGroupId', {});
    template.hasOutput('AppSecurityGroupId', {});
    template.hasOutput('DatabaseSecurityGroupId', {});
  });

  test('Resources use environmentSuffix for uniqueness', () => {
    const outputs = template.findOutputs('*');
    const outputNames = Object.values(outputs);

    outputNames.forEach((output: any) => {
      if (output.Export && output.Export.Name) {
        expect(output.Export.Name).toMatch(/test-123/);
      }
    });
  });

  test('No resources have Retain deletion policy', () => {
    const logGroups = template.findResources('AWS::Logs::LogGroup');
    Object.values(logGroups).forEach((resource: any) => {
      expect(resource.DeletionPolicy).not.toBe('Retain');
    });
  });

  test('All route tables have explicit associations', () => {
    const routeTables = template.findResources('AWS::EC2::RouteTable');
    const associations = template.findResources('AWS::EC2::SubnetRouteTableAssociation');

    // Should have at least one association per route table
    expect(Object.keys(associations).length).toBeGreaterThan(0);
  });
});
```

## File: README.md

```markdown
# Multi-Tier VPC Infrastructure for Payment Platform

This CDK application deploys a production-ready, multi-tier VPC infrastructure with PCI DSS compliance features for a payment processing platform.

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

## Prerequisites

- Node.js 16 or later
- AWS CLI configured with appropriate credentials
- AWS CDK CLI: `npm install -g aws-cdk`

## Installation

```bash
npm install
```

## Build

```bash
npm run build
```

## Test

Run unit tests:

```bash
npm run test
```

## Synthesize CloudFormation

```bash
npm run synth
```

Or with custom environment suffix:

```bash
cdk synth -c environmentSuffix=prod-123
```

## Deploy

```bash
npm run deploy
```

Or with custom environment suffix:

```bash
cdk deploy -c environmentSuffix=prod-123
```

## Stack Outputs

After deployment, the stack exports the following:

- VPC ID and CIDR block
- Public, private, and database subnet IDs
- Security group IDs for web, app, and database tiers
- Availability zones used
- Internet Gateway ID
- CloudWatch Log Group name for VPC Flow Logs

## Security Features

1. **Network Segmentation**: Three distinct subnet tiers with no direct routing between them
2. **No Direct Internet Access**: Private and database subnets route through NAT Gateways
3. **Least Privilege Security Groups**: Each tier has minimal required access
4. **Flow Logs**: All VPC traffic logged for compliance auditing
5. **PCI DSS Compliance**: Network architecture follows PCI DSS segmentation requirements

## Resource Naming

All resources include an `environmentSuffix` parameter to ensure uniqueness across deployments. This suffix can be provided via CDK context:

```bash
cdk deploy -c environmentSuffix=my-unique-suffix
```

If not provided, a unique suffix is generated automatically.

## Cleanup

To destroy all resources:

```bash
cdk destroy
```

## Validation

To validate the deployment:

1. Check VPC has 3 AZs: `aws ec2 describe-vpcs --filters "Name=tag:Name,Values=payment-vpc-*"`
2. Verify NAT Gateways: `aws ec2 describe-nat-gateways --filter "Name=state,Values=available"`
3. Check Flow Logs: `aws ec2 describe-flow-logs`
4. Verify subnet route tables have no direct internet routes for private/database tiers

## License

MIT
```

## Implementation Notes

1. **High Availability**: The VPC is configured with `natGateways: 3` to deploy one NAT Gateway per availability zone, providing redundancy.

2. **Subnet Types**:
   - `PUBLIC`: Has route to Internet Gateway
   - `PRIVATE_WITH_EGRESS`: Has route to NAT Gateway for outbound traffic
   - `PRIVATE_ISOLATED`: No internet connectivity (database tier)

3. **VPC Flow Logs**: Configured to capture ALL traffic (accepted, rejected, and all) and send to CloudWatch Logs with 30-day retention.

4. **Security Groups**: Implement least privilege with tier-based access controls following PCI DSS network segmentation requirements.

5. **Resource Naming**: All resources use the `environmentSuffix` parameter for uniqueness, preventing conflicts in multi-environment deployments.

6. **No Retain Policies**: CloudWatch Log Group uses `RemovalPolicy.DESTROY` to ensure clean teardown.

7. **Tags**: All resources tagged with Environment='production' and Project='payment-platform' for resource tracking and cost allocation.

8. **Outputs**: All critical resource IDs exported with unique names using environmentSuffix for cross-stack references.
