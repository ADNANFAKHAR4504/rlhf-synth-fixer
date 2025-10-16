import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as route53resolver from 'aws-cdk-lib/aws-route53resolver';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

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
        },
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

    const customerGatewayIp =
      this.node.tryGetContext('customerGatewayIp') || '203.0.113.1';
    const customerGatewayBgpAsn =
      this.node.tryGetContext('customerGatewayBgpAsn') || 65000;

    const customerGateway = new ec2.CfnCustomerGateway(
      this,
      'CustomerGateway',
      {
        bgpAsn: customerGatewayBgpAsn,
        ipAddress: customerGatewayIp,
        type: 'ipsec.1',
        tags: [
          {
            key: 'Name',
            value: `MainOfficeRouter-${environmentSuffix}`,
          },
        ],
      }
    );

    const virtualPrivateGateway = new ec2.CfnVPNGateway(this, 'VPNGateway', {
      type: 'ipsec.1',
      tags: [
        {
          key: 'Name',
          value: `HybridVPNGateway-${environmentSuffix}`,
        },
      ],
    });

    const vpcGatewayAttachment = new ec2.CfnVPCGatewayAttachment(
      this,
      'VPNGatewayAttachment',
      {
        vpcId: vpc.vpcId,
        vpnGatewayId: virtualPrivateGateway.ref,
      }
    );

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
          value: `HybridTransitGateway-${environmentSuffix}`,
        },
      ],
    });

    const tgwAttachment = new ec2.CfnTransitGatewayAttachment(
      this,
      'TGWVpcAttachment',
      {
        transitGatewayId: transitGateway.ref,
        vpcId: vpc.vpcId,
        subnetIds: vpc.privateSubnets.map(subnet => subnet.subnetId),
        tags: [
          {
            key: 'Name',
            value: `HybridVPCAttachment-${environmentSuffix}`,
          },
        ],
      }
    );
    tgwAttachment.addDependency(transitGateway);
    tgwAttachment.addDependency(vpcGatewayAttachment);

    const vpnConnection = new ec2.CfnVPNConnection(this, 'S2SVpnConnection', {
      customerGatewayId: customerGateway.ref,
      type: 'ipsec.1',
      staticRoutesOnly: false,
      transitGatewayId: transitGateway.ref,
      tags: [
        {
          key: 'Name',
          value: `HybridVPNConnection-${environmentSuffix}`,
        },
      ],
    });
    vpnConnection.addDependency(transitGateway);
    vpnConnection.addDependency(customerGateway);

    const vpnTunnelStateMetric = new cloudwatch.Metric({
      namespace: 'AWS/VPN',
      metricName: 'TunnelState',
      dimensionsMap: {
        VpnId: vpnConnection.ref,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    new cloudwatch.Alarm(this, 'VPNTunnelStateAlarm', {
      metric: vpnTunnelStateMetric,
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

    resolverSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/8'),
      ec2.Port.tcp(53),
      'Allow DNS TCP from on-premises'
    );
    resolverSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/8'),
      ec2.Port.udp(53),
      'Allow DNS UDP from on-premises'
    );

    const inboundResolverEndpoint = new route53resolver.CfnResolverEndpoint(
      this,
      'InboundResolver',
      {
        direction: 'INBOUND',
        ipAddresses: vpc.privateSubnets
          .slice(0, 2)
          .map(subnet => ({ subnetId: subnet.subnetId })),
        securityGroupIds: [resolverSecurityGroup.securityGroupId],
        name: `hybrid-inbound-resolver-${environmentSuffix}`,
      }
    );

    const outboundResolverEndpoint = new route53resolver.CfnResolverEndpoint(
      this,
      'OutboundResolver',
      {
        direction: 'OUTBOUND',
        ipAddresses: vpc.privateSubnets
          .slice(0, 2)
          .map(subnet => ({ subnetId: subnet.subnetId })),
        securityGroupIds: [resolverSecurityGroup.securityGroupId],
        name: `hybrid-outbound-resolver-${environmentSuffix}`,
      }
    );

    const onPremDomain =
      this.node.tryGetContext('onPremDomain') || 'corp.example.internal';
    const onPremDnsServer1 =
      this.node.tryGetContext('onPremDnsServer1') || '192.168.1.10';
    const onPremDnsServer2 =
      this.node.tryGetContext('onPremDnsServer2') || '192.168.1.11';

    new route53resolver.CfnResolverRule(this, 'OnPremDNSForwarding', {
      domainName: onPremDomain,
      ruleType: 'FORWARD',
      resolverEndpointId: outboundResolverEndpoint.ref,
      targetIps: [
        {
          ip: onPremDnsServer1,
          port: '53',
        },
        {
          ip: onPremDnsServer2,
          port: '53',
        },
      ],
      name: `onprem-dns-forwarding-${environmentSuffix}`,
    });

    const hybridAccessRole = new iam.Role(this, 'HybridAccessRole', {
      roleName: `HybridAccessRole-${environmentSuffix}`,
      assumedBy: new iam.AccountRootPrincipal(),
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

    const onPremCidr =
      this.node.tryGetContext('onPremCidr') || '192.168.0.0/16';

    vpc.privateSubnets.forEach((subnet, index) => {
      const tgwRoute = new ec2.CfnRoute(this, `TGWRoute${index}`, {
        routeTableId: subnet.routeTable.routeTableId,
        destinationCidrBlock: onPremCidr,
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

    new cdk.CfnOutput(this, 'HybridAccessRoleArn', {
      value: hybridAccessRole.roleArn,
      description: 'Hybrid Access Role ARN',
    });
  }
}
