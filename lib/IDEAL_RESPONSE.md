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

```typescript
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
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      natGateways: 1,
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

    const flowLogGroup = new logs.LogGroup(this, 'FlowLogsGroup', {
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new ec2.FlowLog(this, 'FlowLogs', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(flowLogGroup),
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

    const vpcGatewayAttachment = new ec2.CfnVPCGatewayAttachment(this, 'VPNGatewayAttachment', {
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
    tgwAttachment.addDependency(transitGateway);
    tgwAttachment.addDependency(vpcGatewayAttachment);

    const directConnectGateway = new cdk.CfnResource(this, 'DirectConnectGateway', {
      type: 'AWS::DirectConnect::Gateway',
      properties: {
        amazonSideAsn: 64512,
        name: 'HybridDXGW',
      },
    });

    const dxgwAssociation = new cdk.CfnResource(this, 'DXGWTransitGatewayAssociation', {
      type: 'AWS::EC2::TransitGatewayAttachment',
      properties: {
        TransitGatewayId: transitGateway.ref,
        ResourceType: 'direct-connect-gateway',
        ResourceId: directConnectGateway.ref,
        Tags: [
          {
            Key: 'Name',
            Value: 'DXGW-TGW-Attachment',
          },
        ],
      },
    });
    dxgwAssociation.addDependency(directConnectGateway);
    dxgwAssociation.addDependency(transitGateway);
    dxgwAssociation.addDependency(tgwAttachment);

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
    vpnConnection.addDependency(transitGateway);
    vpnConnection.addDependency(customerGateway);

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

    const federatedUserRole = new iam.Role(this, 'FederatedUserRole', {
      roleName: 'FederatedUserRole',
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
      const tgwRoute = new ec2.CfnRoute(this, `TGWRoute${index}`, {
        routeTableId: subnet.routeTable.routeTableId,
        destinationCidrBlock: '192.168.0.0/16',
        transitGatewayId: transitGateway.ref,
      });
      tgwRoute.addDependency(tgwAttachment);
      tgwRoute.addDependency(vpcGatewayAttachment);
    });

    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'TransitGatewayId', {
      value: transitGateway.ref,
      description: 'Transit Gateway ID',
    });

    new cdk.CfnOutput(this, 'DirectConnectGatewayId', {
      value: directConnectGateway.ref,
      description: 'Direct Connect Gateway ID',
    });

    new cdk.CfnOutput(this, 'VPNConnectionId', {
      value: vpnConnection.ref,
      description: 'VPN Connection ID',
    });

    new cdk.CfnOutput(this, 'InboundResolverEndpointId', {
      value: inboundResolverEndpoint.ref,
      description: 'Inbound Route 53 Resolver Endpoint ID',
    });

    new cdk.CfnOutput(this, 'OutboundResolverEndpointId', {
      value: outboundResolverEndpoint.ref,
      description: 'Outbound Route 53 Resolver Endpoint ID',
    });

    new cdk.CfnOutput(this, 'SAMLProviderArn', {
      value: samlProvider.ref,
      description: 'SAML Provider ARN',
    });

    new cdk.CfnOutput(this, 'FederatedUserRoleArn', {
      value: federatedUserRole.roleArn,
      description: 'Federated User Role ARN',
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