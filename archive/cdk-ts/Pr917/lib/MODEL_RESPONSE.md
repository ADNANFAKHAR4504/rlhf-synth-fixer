# AWS VPC Infrastructure with CDK TypeScript

I'll create a comprehensive VPC infrastructure setup using AWS CDK TypeScript that meets all your requirements. The solution will be modular and production-ready.

## Implementation Overview

The infrastructure includes:
- VPC with 10.0.0.0/16 CIDR block
- Multi-AZ setup with public and private subnets
- NAT Gateway for private subnet internet access
- Internet Gateway for public subnet access
- Security groups for HTTP/HTTPS traffic
- CloudWatch monitoring configuration
- VPC Flow Logs for network monitoring
- VPC Lattice service network for modern service connectivity
- Production tagging strategy

## Code Structure

### File: `lib/vpc-stack.ts`

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as vpclattice from 'aws-cdk-lib/aws-vpclattice';
import { Construct } from 'constructs';

interface VpcStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class VpcStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly securityGroup: ec2.SecurityGroup;
  public readonly latticeServiceNetwork: vpclattice.CfnServiceNetwork;

  constructor(scope: Construct, id: string, props?: VpcStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create VPC with specified CIDR
    this.vpc = new ec2.Vpc(this, 'VPC', {
      vpcName: `vpc-${environmentSuffix}`,
      cidr: '10.0.0.0/16',
      maxAzs: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
      natGateways: 1, // Single NAT Gateway for cost optimization
    });

    // Create Security Group for HTTP/HTTPS traffic
    this.securityGroup = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `web-sg-${environmentSuffix}`,
      description: 'Security Group for web traffic',
      allowAllOutbound: true,
    });

    // Add HTTP and HTTPS inbound rules
    this.securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    this.securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Create IAM role for VPC Flow Logs
    const flowLogRole = new iam.Role(this, 'FlowLogRole', {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/VPCFlowLogsDeliveryRolePolicy'),
      ],
    });

    // Create CloudWatch Log Group for VPC Flow Logs
    const logGroup = new logs.LogGroup(this, 'VpcFlowLogGroup', {
      logGroupName: `/aws/vpc/flowlogs/${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create VPC Flow Logs
    new ec2.FlowLog(this, 'VpcFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(logGroup, flowLogRole),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // Create VPC Lattice Service Network
    this.latticeServiceNetwork = new vpclattice.CfnServiceNetwork(this, 'LatticeServiceNetwork', {
      name: `service-network-${environmentSuffix}`,
      authType: 'NONE',
    });

    // Associate VPC with Lattice Service Network
    new vpclattice.CfnServiceNetworkVpcAssociation(this, 'LatticeVpcAssociation', {
      serviceNetworkIdentifier: this.latticeServiceNetwork.attrId,
      vpcIdentifier: this.vpc.vpcId,
    });

    // CloudWatch Dashboard for monitoring
    const dashboard = new cdk.aws_cloudwatch.Dashboard(this, 'VpcDashboard', {
      dashboardName: `vpc-monitoring-${environmentSuffix}`,
    });

    // Add VPC metrics to dashboard
    dashboard.addWidgets(
      new cdk.aws_cloudwatch.GraphWidget({
        title: 'VPC Flow Logs',
        width: 12,
        height: 6,
        left: [
          new cdk.aws_cloudwatch.Metric({
            namespace: 'AWS/Logs',
            metricName: 'IncomingLogEvents',
            dimensionsMap: {
              LogGroupName: logGroup.logGroupName,
            },
            statistic: 'Sum',
          }),
        ],
      })
    );

    // Add tags to all resources
    cdk.Tags.of(this).add('Environment', 'production');
    cdk.Tags.of(this).add('Project', 'VPC-Infrastructure');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `VpcId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: this.securityGroup.securityGroupId,
      description: 'Web Security Group ID',
      exportName: `WebSecurityGroupId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LatticeServiceNetworkId', {
      value: this.latticeServiceNetwork.attrId,
      description: 'VPC Lattice Service Network ID',
      exportName: `LatticeServiceNetworkId-${environmentSuffix}`,
    });
  }
}
```

### File: `lib/tap-stack.ts` (Updated)

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcStack } from './vpc-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create VPC Stack
    const vpcStack = new VpcStack(scope, `VpcStack${environmentSuffix}`, {
      environmentSuffix: environmentSuffix,
      env: props?.env,
    });

    // Add dependencies if needed
    this.addDependency(vpcStack);
  }
}
```

## Key Features Implemented

1. **VPC Configuration**: Created with 10.0.0.0/16 CIDR block across 2 AZs
2. **Subnet Design**: 2 public and 2 private subnets with proper routing
3. **NAT Gateway**: Single NAT Gateway for cost optimization while providing private subnet internet access
4. **Internet Gateway**: Automatically created by CDK for public subnets
5. **Security Groups**: Web security group allowing HTTP (80) and HTTPS (443) inbound traffic
6. **VPC Flow Logs**: Comprehensive traffic monitoring with CloudWatch Logs
7. **CloudWatch Monitoring**: Dashboard for VPC metrics and monitoring
8. **VPC Lattice**: Modern service networking for cross-VPC communication
9. **Production Tags**: All resources tagged with Environment: production
10. **Clean Deletion**: Configured with proper removal policies

## Deployment Notes

- The infrastructure is designed for production use with proper security and monitoring
- NAT Gateway is configured for cost optimization (single gateway)
- Flow logs retention is set to 1 week for cost control
- All resources support clean deletion without leaving orphaned resources
- VPC Lattice provides modern service-to-service connectivity
- CloudWatch dashboard provides visibility into network traffic and performance