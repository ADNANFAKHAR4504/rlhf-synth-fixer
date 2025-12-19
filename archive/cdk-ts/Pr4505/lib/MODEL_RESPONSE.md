### Reasoning Trace
---

I need to create AWS CDK TypeScript code for a secure, high-performance hybrid cloud setup that connects an on-premises data center with AWS. Let me break down the requirements and plan the implementation:

### Requirements
1. Connect on-premises data center with AWS at 10 Gbps
2. Maintain redundancy
3. Ensure encryption in transit
4. Provide real-time monitoring
5. Integrate with existing identity systems
6. Use AWS CDK with TypeScript

### Components to Include
1. VPC with appropriate subnets (private and public) and route tables
2. Virtual Private Gateway (VGW) for VPN termination
3. Direct Connect Gateway (DXGW) for high-bandwidth private connectivity
4. Site-to-Site VPN with redundant tunnels
5. Transit Gateway for efficient routing
6. VPC Flow Logs to CloudWatch
7. Route 53 Resolver for hybrid DNS resolution
8. IAM roles and policies integrated with corporate SSO

### Output Files
1. bin/tap.ts - Entry point for the CDK app
2. lib/tap-stack.ts - Main stack definition
3. cdk.json - CDK configuration

Let's start by creating each file:

#### 1. bin/tap.ts
This is the entry point for the CDK app. It should import the stack and create a new instance of it.

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();
new TapStack(app, 'TapStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION 
  },
});
```

#### 2. lib/tap-stack.ts
This is the main stack definition. It will contain all the resources for our hybrid cloud setup.

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53resolver from 'aws-cdk-lib/aws-route53resolver';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC
    const vpc = new ec2.Vpc(this, 'HybridVPC', {
      cidr: '10.0.0.0/16',
      maxAzs: 3,
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
        {
          cidrMask: 24,
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        }
      ],
      gatewayEndpoints: {
        S3: {
          service: ec2.GatewayVpcEndpointAwsService.S3,
        },
      },
    });

    // Enable VPC Flow Logs
    new ec2.FlowLog(this, 'FlowLogs', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        new logs.LogGroup(this, 'FlowLogsGroup', {
          retention: logs.RetentionDays.ONE_MONTH,
        })
      ),
    });

    // Create Customer Gateway (represents the on-premises router)
    const customerGateway = new ec2.CfnCustomerGateway(this, 'CustomerGateway', {
      bgpAsn: 65000, // Use customer's BGP ASN
      ipAddress: '203.0.113.1', // Replace with actual public IP of on-premises router
      type: 'ipsec.1',
      tags: [
        {
          key: 'Name',
          value: 'MainOfficeRouter',
        },
      ],
    });

    // Create Virtual Private Gateway
    const virtualPrivateGateway = new ec2.CfnVPNGateway(this, 'VPNGateway', {
      type: 'ipsec.1',
      tags: [
        {
          key: 'Name',
          value: 'HybridVPNGateway',
        },
      ],
    });

    // Attach VPN Gateway to VPC
    new ec2.CfnVPCGatewayAttachment(this, 'VPNGatewayAttachment', {
      vpcId: vpc.vpcId,
      vpnGatewayId: virtualPrivateGateway.ref,
    });

    // Create Transit Gateway
    const transitGateway = new ec2.CfnTransitGateway(this, 'TransitGateway', {
      amazonSideAsn: 64512,
      autoAcceptSharedAttachments: 'disable',
      defaultRouteTableAssociation: 'enable',
      defaultRouteTablePropagation: 'enable',
      dnsSupport: 'enable',
      vpnEcmpSupport: 'enable',
      tags: [
        {
          key: 'Name',
          value: 'HybridTransitGateway',
        },
      ],
    });

    // Attach VPC to Transit Gateway
    const tgwAttachment = new ec2.CfnTransitGatewayAttachment(this, 'TGWVpcAttachment', {
      transitGatewayId: transitGateway.ref,
      vpcId: vpc.vpcId,
      subnetIds: vpc.privateSubnets.map(subnet => subnet.subnetId),
      tags: [
        {
          key: 'Name',
          value: 'HybridVPCAttachment',
        },
      ],
    });

    // Create Direct Connect Gateway
    const directConnectGateway = new cdk.CfnResource(this, 'DirectConnectGateway', {
      type: 'AWS::DirectConnect::DirectConnectGateway',
      properties: {
        amazonSideAsn: 64512,
        directConnectGatewayName: 'HybridDXGW',
      },
    });

    // Associate Direct Connect Gateway with Transit Gateway
    new cdk.CfnResource(this, 'DXGWTransitGatewayAssociation', {
      type: 'AWS::DirectConnect::GatewayAssociation',
      properties: {
        directConnectGatewayId: directConnectGateway.ref,
        gatewayId: transitGateway.ref,
        allowedPrefixes: ['10.0.0.0/8'], // Customer on-premises CIDR blocks
      },
    });

    // Create Site-to-Site VPN Connection with redundant tunnels
    const vpnConnection = new ec2.CfnVPNConnection(this, 'S2SVpnConnection', {
      customerGatewayId: customerGateway.ref,
      type: 'ipsec.1',
      staticRoutesOnly: false,
      transitGatewayId: transitGateway.ref,
      tags: [
        {
          key: 'Name',
          value: 'HybridVPNConnection',
        },
      ],
    });

    // Create CloudWatch Alarms for VPN monitoring
    const vpnTunnel1StateMetric = new cloudwatch.Metric({
      namespace: 'AWS/VPN',
      metricName: 'TunnelState',
      dimensionsMap: {
        VpnId: vpnConnection.ref,
        TunnelIpAddress: '1st_tunnel_ip', // This is a placeholder; in real implementation, use a reference
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    new cloudwatch.Alarm(this, 'VPNTunnel1StateAlarm', {
      metric: vpnTunnel1StateMetric,
      threshold: 0,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      alarmDescription: 'VPN Tunnel 1 is down',
    });

    // Setup Route53 Resolver for hybrid DNS
    const inboundResolverEndpoint = new route53resolver.CfnResolverEndpoint(this, 'InboundResolver', {
      direction: 'INBOUND',
      ipAddresses: vpc.privateSubnets.slice(0, 2).map(subnet => ({ subnetId: subnet.subnetId })),
      securityGroupIds: [
        new ec2.SecurityGroup(this, 'ResolverSG', {
          vpc,
          description: 'Security group for Route 53 Resolver',
          allowAllOutbound: true,
        }).securityGroupId,
      ],
      name: 'hybrid-inbound-resolver',
    });

    const outboundResolverEndpoint = new route53resolver.CfnResolverEndpoint(this, 'OutboundResolver', {
      direction: 'OUTBOUND',
      ipAddresses: vpc.privateSubnets.slice(0, 2).map(subnet => ({ subnetId: subnet.subnetId })),
      securityGroupIds: [
        new ec2.SecurityGroup(this, 'OutboundResolverSG', {
          vpc,
          description: 'Security group for outbound Route 53 Resolver',
          allowAllOutbound: true,
        }).securityGroupId,
      ],
      name: 'hybrid-outbound-resolver',
    });

    // Forward DNS queries for on-premises domain to on-premises DNS servers
    new route53resolver.CfnResolverRule(this, 'OnPremDNSForwarding', {
      domainName: 'corp.example.internal', // Replace with actual domain
      ruleType: 'FORWARD',
      resolverEndpointId: outboundResolverEndpoint.ref,
      targetIps: [
        {
          ip: '192.168.1.10', // Replace with actual on-premises DNS server IP
          port: '53',
        },
        {
          ip: '192.168.1.11', // Secondary DNS server for redundancy
          port: '53',
        },
      ],
      name: 'onprem-dns-forwarding',
    });

    // Set up IAM for Identity Federation
    const samlProvider = new iam.CfnSAMLProvider(this, 'CorporateSAMLProvider', {
      name: 'CorporateIdentityProvider',
      samlMetadataDocument: '<?xml version="1.0" encoding="UTF-8"?><!-- This is a placeholder. Replace with actual SAML metadata from your IdP -->', // Replace with actual SAML metadata
    });

    // Create IAM Role for federated users
    const federatedUserRole = new iam.Role(this, 'FederatedUserRole', {
      assumedBy: new iam.FederatedPrincipal(
        samlProvider.ref,
        {
          StringEquals: {
            'SAML:aud': 'https://signin.aws.amazon.com/saml',
          },
        },
        'sts:AssumeRoleWithSAML'
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('ReadOnlyAccess'),
      ],
      inlinePolicies: {
        CustomPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ec2:DescribeVpcs',
                'ec2:DescribeSubnets',
                'ec2:DescribeSecurityGroups',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // Outputs
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'The ID of the VPC',
    });

    new cdk.CfnOutput(this, 'TransitGatewayId', {
      value: transitGateway.ref,
      description: 'The ID of the Transit Gateway',
    });

    new cdk.CfnOutput(this, 'DirectConnectGatewayId', {
      value: directConnectGateway.ref,
      description: 'The ID of the Direct Connect Gateway',
    });

    new cdk.CfnOutput(this, 'VPNConnectionId', {
      value: vpnConnection.ref,
      description: 'The ID of the VPN Connection',
    });

    new cdk.CfnOutput(this, 'InboundResolverEndpointId', {
      value: inboundResolverEndpoint.ref,
      description: 'The ID of the inbound Route 53 Resolver endpoint',
    });

    new cdk.CfnOutput(this, 'OutboundResolverEndpointId', {
      value: outboundResolverEndpoint.ref,
      description: 'The ID of the outbound Route 53 Resolver endpoint',
    });

    new cdk.CfnOutput(this, 'SAMLProviderArn', {
      value: samlProvider.ref,
      description: 'The ARN of the SAML Identity Provider',
    });

    new cdk.CfnOutput(this, 'FederatedUserRoleArn', {
      value: federatedUserRole.roleArn,
      description: 'The ARN of the IAM Role for federated users',
    });
  }
}
```

#### 3. cdk.json
This is the configuration file for CDK.

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
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
    "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true
  }
}
```

Now let me review the code to ensure it meets all the requirements:

1. **Secure, high-performance hybrid cloud setup**: We've included VPC with proper isolation, security groups, encryption in transit via VPN, and Direct Connect for 10 Gbps throughput.
2. **Redundancy**: We have multiple availability zones, redundant VPN tunnels, and multiple DNS servers.
3. **Encryption in transit**: The Site-to-Site VPN provides encryption for data in transit.
4. **Real-time monitoring**: We've set up VPC Flow Logs to CloudWatch and CloudWatch Alarms for monitoring VPN tunnels.
5. **Integration with identity systems**: We've implemented IAM roles with SAML federation for corporate identity integration.
6. **AWS CDK with TypeScript**: The entire infrastructure is defined using AWS CDK and TypeScript.

The code includes all the specific components required:
- VPC with public and private subnets
- Virtual Private Gateway for VPN termination
- Direct Connect Gateway for high-bandwidth connectivity
- Site-to-Site VPN with redundant tunnels
- Transit Gateway for routing
- VPC Flow Logs to CloudWatch
- Route 53 Resolver for hybrid DNS resolution
- IAM roles and policies with SSO integration

Let me make a few adjustments to the code to enhance it:

I think the code is well-structured and meets all the requirements. Let me now present the final code for the three files without any explanations, comments, or anything else, as requested:

Let's review one more time. Our code establishes a secure hybrid cloud setup with AWS using CDK in TypeScript. We've covered:

1. Network infrastructure with VPC, subnets, and proper routing
2. Hybrid connectivity with VPN, Direct Connect, and Transit Gateway
3. DNS resolution across environments
4. Identity and access management
5. Monitoring and logging

Let me make a few more improvements:

1. For the VPN tunnel monitoring, we should use outputs from the VPN connection for the tunnel IP addresses
2. Add proper propagation of routes for the Transit Gateway
3. Ensure security groups have proper ingress/egress rules

Actually, let me make a couple of final optimizations:

For Direct Connect, we need to note that a real implementation would require an actual Direct Connect connection which involves physical hardware and might need to be set up separately, but our CDK can still define the AWS resources.

Similarly, for the SAML integration, we would need the actual SAML metadata from the corporate identity provider, but we've included a placeholder.

Everything looks good now. Let me present the final code for the three files without any explanations, comments, or anything else, as requested.
### Answer 
---

```typescript
// bin/tap.ts
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();
new TapStack(app, 'TapStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION 
  },
});
```

```typescript
// lib/tap-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as route53resolver from 'aws-cdk-lib/aws-route53resolver';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'HybridVPC', {
      cidr: '10.0.0.0/16',
      maxAzs: 3,
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
        {
          cidrMask: 24,
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        }
      ],
      gatewayEndpoints: {
        S3: {
          service: ec2.GatewayVpcEndpointAwsService.S3,
        },
      },
    });

    new ec2.FlowLog(this, 'FlowLogs', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        new logs.LogGroup(this, 'FlowLogsGroup', {
          retention: logs.RetentionDays.ONE_MONTH,
        })
      ),
    });

    const customerGateway = new ec2.CfnCustomerGateway(this, 'CustomerGateway', {
      bgpAsn: 65000,
      ipAddress: '203.0.113.1',
      type: 'ipsec.1',
      tags: [
        {
          key: 'Name',
          value: 'MainOfficeRouter',
        },
      ],
    });

    const virtualPrivateGateway = new ec2.CfnVPNGateway(this, 'VPNGateway', {
      type: 'ipsec.1',
      tags: [
        {
          key: 'Name',
          value: 'HybridVPNGateway',
        },
      ],
    });

    new ec2.CfnVPCGatewayAttachment(this, 'VPNGatewayAttachment', {
      vpcId: vpc.vpcId,
      vpnGatewayId: virtualPrivateGateway.ref,
    });

    const transitGateway = new ec2.CfnTransitGateway(this, 'TransitGateway', {
      amazonSideAsn: 64512,
      autoAcceptSharedAttachments: 'disable',
      defaultRouteTableAssociation: 'enable',
      defaultRouteTablePropagation: 'enable',
      dnsSupport: 'enable',
      vpnEcmpSupport: 'enable',
      tags: [
        {
          key: 'Name',
          value: 'HybridTransitGateway',
        },
      ],
    });

    const tgwAttachment = new ec2.CfnTransitGatewayAttachment(this, 'TGWVpcAttachment', {
      transitGatewayId: transitGateway.ref,
      vpcId: vpc.vpcId,
      subnetIds: vpc.privateSubnets.map(subnet => subnet.subnetId),
      tags: [
        {
          key: 'Name',
          value: 'HybridVPCAttachment',
        },
      ],
    });

    const directConnectGateway = new cdk.CfnResource(this, 'DirectConnectGateway', {
      type: 'AWS::DirectConnect::DirectConnectGateway',
      properties: {
        amazonSideAsn: 64512,
        directConnectGatewayName: 'HybridDXGW',
      },
    });

    new cdk.CfnResource(this, 'DXGWTransitGatewayAssociation', {
      type: 'AWS::DirectConnect::GatewayAssociation',
      properties: {
        directConnectGatewayId: directConnectGateway.ref,
        gatewayId: transitGateway.ref,
        allowedPrefixes: ['10.0.0.0/8'],
      },
    });

    const vpnConnection = new ec2.CfnVPNConnection(this, 'S2SVpnConnection', {
      customerGatewayId: customerGateway.ref,
      type: 'ipsec.1',
      staticRoutesOnly: false,
      transitGatewayId: transitGateway.ref,
      tags: [
        {
          key: 'Name',
          value: 'HybridVPNConnection',
        },
      ],
    });

    new cloudwatch.Alarm(this, 'VPNTunnelStateAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/VPN',
        metricName: 'TunnelState',
        dimensionsMap: {
          VpnId: vpnConnection.ref,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 0,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      alarmDescription: 'VPN Tunnel is down',
    });

    const resolverSecurityGroup = new ec2.SecurityGroup(this, 'ResolverSG', {
      vpc,
      description: 'Security group for Route 53 Resolver',
      allowAllOutbound: true,
    });

    resolverSecurityGroup.addIngressRule(ec2.Peer.ipv4('10.0.0.0/8'), ec2.Port.tcp(53), 'Allow DNS TCP from on-premises');
    resolverSecurityGroup.addIngressRule(ec2.Peer.ipv4('10.0.0.0/8'), ec2.Port.udp(53), 'Allow DNS UDP from on-premises');

    const inboundResolverEndpoint = new route53resolver.CfnResolverEndpoint(this, 'InboundResolver', {
      direction: 'INBOUND',
      ipAddresses: vpc.privateSubnets.slice(0, 2).map(subnet => ({ subnetId: subnet.subnetId })),
      securityGroupIds: [resolverSecurityGroup.securityGroupId],
      name: 'hybrid-inbound-resolver',
    });

    const outboundResolverEndpoint = new route53resolver.CfnResolverEndpoint(this, 'OutboundResolver', {
      direction: 'OUTBOUND',
      ipAddresses: vpc.privateSubnets.slice(0, 2).map(subnet => ({ subnetId: subnet.subnetId })),
      securityGroupIds: [resolverSecurityGroup.securityGroupId],
      name: 'hybrid-outbound-resolver',
    });

    new route53resolver.CfnResolverRule(this, 'OnPremDNSForwarding', {
      domainName: 'corp.example.internal',
      ruleType: 'FORWARD',
      resolverEndpointId: outboundResolverEndpoint.ref,
      targetIps: [
        {
          ip: '192.168.1.10',
          port: '53',
        },
        {
          ip: '192.168.1.11',
          port: '53',
        },
      ],
      name: 'onprem-dns-forwarding',
    });

    const samlProvider = new iam.CfnSAMLProvider(this, 'CorporateSAMLProvider', {
      name: 'CorporateIdentityProvider',
      samlMetadataDocument: '<?xml version="1.0" encoding="UTF-8"?><!-- Placeholder for SAML metadata -->',
    });

    new iam.Role(this, 'FederatedUserRole', {
      assumedBy: new iam.FederatedPrincipal(
        samlProvider.ref,
        {
          StringEquals: {
            'SAML:aud': 'https://signin.aws.amazon.com/saml',
          },
        },
        'sts:AssumeRoleWithSAML'
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('ReadOnlyAccess'),
      ],
      inlinePolicies: {
        CustomPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ec2:DescribeVpcs',
                'ec2:DescribeSubnets',
                'ec2:DescribeSecurityGroups',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    vpc.privateSubnets.forEach((subnet, index) => {
      const routeTableId = subnet.routeTable.routeTableId;
      new ec2.CfnRoute(this, `TGWRoute${index}`, {
        routeTableId: routeTableId,
        destinationCidrBlock: '192.168.0.0/16',
        transitGatewayId: transitGateway.ref,
      });
    });

    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
    });

    new cdk.CfnOutput(this, 'TransitGatewayId', {
      value: transitGateway.ref,
    });

    new cdk.CfnOutput(this, 'DirectConnectGatewayId', {
      value: directConnectGateway.ref,
    });

    new cdk.CfnOutput(this, 'VPNConnectionId', {
      value: vpnConnection.ref,
    });

    new cdk.CfnOutput(this, 'InboundResolverEndpointId', {
      value: inboundResolverEndpoint.ref,
    });

    new cdk.CfnOutput(this, 'OutboundResolverEndpointId', {
      value: outboundResolverEndpoint.ref,
    });
  }
}
```

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
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
    "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true
  }
}
```