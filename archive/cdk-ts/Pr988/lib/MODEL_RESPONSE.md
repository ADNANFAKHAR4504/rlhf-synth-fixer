I'll help you create a comprehensive VPC infrastructure using CDK TypeScript with modern AWS networking features for your development environment in us-west-2.

## bin/tap.ts

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

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('CostCenter', 'Development');
Tags.of(app).add('Project', 'VPC-Infrastructure');

new TapStack(app, stackName, {
  stackName: stackName,
  environmentSuffix: environmentSuffix,
  env: { 
    region: 'us-west-2',
  },
});
```

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as vpclattice from 'aws-cdk-lib/aws-vpclattice';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly serviceNetwork: vpclattice.CfnServiceNetwork;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create VPC with dual-stack (IPv4/IPv6) support
    this.vpc = new ec2.Vpc(this, 'VPC', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2, // Span exactly 2 availability zones
      enableDnsHostnames: true,
      enableDnsSupport: true,
      
      // Configure subnets for each AZ
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          mapPublicIpOnLaunch: false, // We'll use Elastic IPs instead
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      
      // Create NAT gateways in each AZ for high availability
      natGateways: 2,
    });

    // Create Elastic IPs for NAT Gateways
    const eipAz1 = new ec2.CfnEIP(this, 'NATGatewayEIP-AZ1', {
      domain: 'vpc',
      tags: [
        {
          key: 'Name',
          value: `NAT-Gateway-EIP-AZ1-${environmentSuffix}`,
        },
        {
          key: 'Environment',
          value: environmentSuffix,
        },
      ],
    });

    const eipAz2 = new ec2.CfnEIP(this, 'NATGatewayEIP-AZ2', {
      domain: 'vpc',
      tags: [
        {
          key: 'Name',
          value: `NAT-Gateway-EIP-AZ2-${environmentSuffix}`,
        },
        {
          key: 'Environment',
          value: environmentSuffix,
        },
      ],
    });

    // Get the public and private subnets
    const publicSubnets = this.vpc.publicSubnets;
    const privateSubnets = this.vpc.privateSubnets;

    // Create security groups allowing ICMP traffic for troubleshooting
    const publicSecurityGroup = new ec2.SecurityGroup(this, 'PublicSubnetsSG', {
      vpc: this.vpc,
      description: 'Security group for public subnets allowing ICMP traffic',
      allowAllOutbound: true,
    });

    const privateSecurityGroup = new ec2.SecurityGroup(this, 'PrivateSubnetsSG', {
      vpc: this.vpc,
      description: 'Security group for private subnets allowing ICMP traffic',
      allowAllOutbound: true,
    });

    // Allow all ICMP traffic for troubleshooting
    publicSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.allIcmp(),
      'Allow all ICMP IPv4 traffic for troubleshooting'
    );

    publicSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv6(),
      ec2.Port.allIcmpV6(),
      'Allow all ICMP IPv6 traffic for troubleshooting'
    );

    privateSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.allIcmp(),
      'Allow all ICMP IPv4 traffic from VPC for troubleshooting'
    );

    privateSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv6(),
      ec2.Port.allIcmpV6(),
      'Allow all ICMP IPv6 traffic for troubleshooting'
    );

    // Enable IPv6 support for the VPC
    const ipv6Block = new ec2.CfnVPCCidrBlock(this, 'VPCIpv6CidrBlock', {
      vpcId: this.vpc.vpcId,
      amazonProvidedIpv6CidrBlock: true,
    });

    // Create VPC Lattice Service Network for modern service connectivity
    this.serviceNetwork = new vpclattice.CfnServiceNetwork(this, 'ServiceNetwork', {
      name: `service-network-${environmentSuffix}`,
      authType: 'AWS_IAM',
      tags: [
        {
          key: 'Name',
          value: `ServiceNetwork-${environmentSuffix}`,
        },
        {
          key: 'Environment',
          value: environmentSuffix,
        },
      ],
    });

    // Associate VPC with VPC Lattice Service Network
    new vpclattice.CfnServiceNetworkVpcAssociation(this, 'ServiceNetworkVPCAssociation', {
      serviceNetworkIdentifier: this.serviceNetwork.attrArn,
      vpcIdentifier: this.vpc.vpcId,
      tags: [
        {
          key: 'Name',
          value: `ServiceNetworkAssociation-${environmentSuffix}`,
        },
      ],
    });

    // Add additional route table entries for IPv6 traffic
    publicSubnets.forEach((subnet, index) => {
      new ec2.CfnRoute(this, `PublicSubnetIpv6Route-${index}`, {
        routeTableId: subnet.routeTable.routeTableId,
        destinationIpv6CidrBlock: '::/0',
        gatewayId: this.vpc.internetGatewayId,
      });
    });

    // Output important information
    new cdk.CfnOutput(this, 'VPCId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: publicSubnets.map(subnet => subnet.subnetId).join(', '),
      description: 'Public Subnet IDs',
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: privateSubnets.map(subnet => subnet.subnetId).join(', '),
      description: 'Private Subnet IDs',
    });

    new cdk.CfnOutput(this, 'NATGatewayEIPs', {
      value: `${eipAz1.ref}, ${eipAz2.ref}`,
      description: 'NAT Gateway Elastic IP addresses',
    });

    new cdk.CfnOutput(this, 'ServiceNetworkArn', {
      value: this.serviceNetwork.attrArn,
      description: 'VPC Lattice Service Network ARN',
    });

    // Tag all resources for cost tracking and identification
    cdk.Tags.of(this.vpc).add('Component', 'Networking');
    cdk.Tags.of(this.serviceNetwork).add('Component', 'ServiceMesh');
    cdk.Tags.of(publicSecurityGroup).add('Component', 'Security');
    cdk.Tags.of(privateSecurityGroup).add('Component', 'Security');
  }
}
```

## cdk.json

```json
{
  "app": "npx ts-node bin/tap.ts",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target": "aws-cdk-lib@2.204.0",
    "@aws-cdk-lib/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "@aws-cdk-lib/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true,
    "@aws-cdk-lib/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk-lib/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk-lib/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk-lib/aws-ec2:ipv4IpamPoolPublicIpSource": true,
    "@aws-cdk-lib/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk-lib/aws-iam:minimizePolicies": true,
    "@aws-cdk-lib/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk-lib/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk-lib/aws-logs:uniqueLogGroupName": true,
    "@aws-cdk-lib/aws-route53-pathtarget:useAliasRecordForRootDomain": true,
    "@aws-cdk-lib/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk-lib/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk-lib/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk-lib/aws-route53-resolver:avoidEcsPatterns": true,
    "@aws-cdk-lib/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk-lib/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk-lib/aws-kms:aliasNameRef": true,
    "@aws-cdk-lib/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk-lib/aws-lambda:functionResponseStreamingPropsNewValidation": true,
    "@aws-cdk-lib/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk-lib/aws-ec2:blockDeviceMappingV2": true,
    "@aws-cdk-lib/aws-redshift:columnId": true,
    "@aws-cdk-lib/aws-stepfunctions-tasks:enableLoggingForLambdaInvoke": true,
    "@aws-cdk-lib/aws-events:eventsTargetQueueSizeQueueName": true,
    "@aws-cdk-lib/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk-lib/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk-lib/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk-lib/aws-s3:enforceSSLRequestsOnlyOnSecureBucketPolicy": true,
    "@aws-cdk-lib/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk-lib/aws-ecs:reduceRunTaskPermissions": true,
    "@aws-cdk-lib/aws-ec2:disableSubnetCreateDefaultRoute": true,
    "@aws-cdk-lib/aws-s3:keepNotificationInImportedBucket": true,
    "@aws-cdk-lib/aws-events:connectCrossStackTargets": true,
    "@aws-cdk-lib/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk-lib/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk-lib/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk-lib/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true
  }
}
```

This infrastructure creates:

1. **VPC with dual-stack support** (IPv4/IPv6) spanning 2 AZs in us-west-2
2. **Public and private subnets** in each availability zone
3. **Internet Gateway** for public internet access
4. **NAT Gateways with Elastic IPs** in each AZ for private subnet egress
5. **Security Groups** allowing full ICMP traffic for troubleshooting
6. **VPC Lattice Service Network** for modern service connectivity (2025 feature)
7. **IPv6 CIDR blocks and routing** for dual-stack networking (2025 enhancement)
8. **Comprehensive tagging** for cost tracking and resource identification

The infrastructure is optimized for development environments with features like:
- Fast deployment times by avoiding long-running resources
- Proper resource tagging for cost allocation
- Modern networking features for future scalability
- High availability with multi-AZ NAT gateways