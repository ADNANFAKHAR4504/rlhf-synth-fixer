# Ideal Response: Hub and Spoke Network Architecture

## CDK Entry Point (bin/tap.ts)

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Set default region if not provided
if (!process.env.CDK_DEFAULT_REGION) {
  process.env.CDK_DEFAULT_REGION = 'us-east-1';
}

// Get environment suffix from context or default to 'dev'
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

new TapStack(app, `TapStack${environmentSuffix}`, {
  env: {
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: `Hub and Spoke Network Architecture - ${environmentSuffix}`,
  environmentSuffix,
});
```

## Main Stack Implementation (lib/tap-stack.ts)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53resolver from 'aws-cdk-lib/aws-route53resolver';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps & { environmentSuffix: string }) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // Common tags for all resources
    const commonTags = {
      Environment: environmentSuffix,
      CostCenter: 'Network',
      Owner: 'Infrastructure',
    };

    // Apply tags to all resources in this stack
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('CostCenter', 'Network');
    cdk.Tags.of(this).add('Owner', 'Infrastructure');

    // 🔹 Hub VPC
    const hubVpc = new ec2.Vpc(this, `HubVpc${environmentSuffix}`, {
      cidr: '10.0.0.0/16',
      maxAzs: 3,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
      removalPolicy: environmentSuffix === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // 🔹 Spoke VPCs
    const devVpc = new ec2.Vpc(this, `DevVpc${environmentSuffix}`, {
      cidr: '10.1.0.0/16',
      maxAzs: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      removalPolicy: environmentSuffix === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    const stagingVpc = new ec2.Vpc(this, `StagingVpc${environmentSuffix}`, {
      cidr: '10.2.0.0/16',
      maxAzs: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      removalPolicy: environmentSuffix === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    const prodVpc = new ec2.Vpc(this, `ProdVpc${environmentSuffix}`, {
      cidr: '10.3.0.0/16',
      maxAzs: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      removalPolicy: environmentSuffix === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // 🔹 Transit Gateway
    const transitGateway = new ec2.CfnTransitGateway(this, `TransitGateway${environmentSuffix}`, {
      description: 'Hub and Spoke Transit Gateway',
      defaultRouteTableAssociation: 'disable',
      defaultRouteTablePropagation: 'disable',
      tags: [
        { key: 'Name', value: `Main-TGW-${environmentSuffix}` },
        { key: 'Environment', value: environmentSuffix },
        ...Object.entries(commonTags).map(([key, value]) => ({ key, value })),
      ],
    });

    // 🔹 Transit Gateway Attachments
    const hubAttachment = new ec2.CfnTransitGatewayAttachment(this, `HubAttachment${environmentSuffix}`, {
      vpcId: hubVpc.vpcId,
      subnetIds: hubVpc.privateSubnets.map(subnet => subnet.subnetId),
      transitGatewayId: transitGateway.ref,
      tags: [
        { key: 'Name', value: `Hub-Attachment-${environmentSuffix}` },
        { key: 'Environment', value: 'Hub' },
        ...Object.entries(commonTags).map(([key, value]) => ({ key, value })),
      ],
    });

    const devAttachment = new ec2.CfnTransitGatewayAttachment(this, `DevAttachment${environmentSuffix}`, {
      vpcId: devVpc.vpcId,
      subnetIds: devVpc.privateSubnets.map(subnet => subnet.subnetId),
      transitGatewayId: transitGateway.ref,
      tags: [
        { key: 'Name', value: `Dev-Attachment-${environmentSuffix}` },
        { key: 'Environment', value: 'Dev' },
        ...Object.entries(commonTags).map(([key, value]) => ({ key, value })),
      ],
    });

    const stagingAttachment = new ec2.CfnTransitGatewayAttachment(this, `StagingAttachment${environmentSuffix}`, {
      vpcId: stagingVpc.vpcId,
      subnetIds: stagingVpc.privateSubnets.map(subnet => subnet.subnetId),
      transitGatewayId: transitGateway.ref,
      tags: [
        { key: 'Name', value: `Staging-Attachment-${environmentSuffix}` },
        { key: 'Environment', value: 'Staging' },
        ...Object.entries(commonTags).map(([key, value]) => ({ key, value })),
      ],
    });

    const prodAttachment = new ec2.CfnTransitGatewayAttachment(this, `ProdAttachment${environmentSuffix}`, {
      vpcId: prodVpc.vpcId,
      subnetIds: prodVpc.privateSubnets.map(subnet => subnet.subnetId),
      transitGatewayId: transitGateway.ref,
      tags: [
        { key: 'Name', value: `Prod-Attachment-${environmentSuffix}` },
        { key: 'Environment', value: 'Prod' },
        ...Object.entries(commonTags).map(([key, value]) => ({ key, value })),
      ],
    });

    // 🔹 Transit Gateway Route Tables
    const hubRouteTable = new ec2.CfnTransitGatewayRouteTable(this, `HubRouteTable${environmentSuffix}`, {
      transitGatewayId: transitGateway.ref,
      tags: [
        { key: 'Name', value: `Hub-RouteTable-${environmentSuffix}` },
        { key: 'Environment', value: 'Hub' },
        ...Object.entries(commonTags).map(([key, value]) => ({ key, value })),
      ],
    });

    const devRouteTable = new ec2.CfnTransitGatewayRouteTable(this, `DevRouteTable${environmentSuffix}`, {
      transitGatewayId: transitGateway.ref,
      tags: [
        { key: 'Name', value: `Dev-RouteTable-${environmentSuffix}` },
        { key: 'Environment', value: 'Dev' },
        ...Object.entries(commonTags).map(([key, value]) => ({ key, value })),
      ],
    });

    const stagingRouteTable = new ec2.CfnTransitGatewayRouteTable(this, `StagingRouteTable${environmentSuffix}`, {
      transitGatewayId: transitGateway.ref,
      tags: [
        { key: 'Name', value: `Staging-RouteTable-${environmentSuffix}` },
        { key: 'Environment', value: 'Staging' },
        ...Object.entries(commonTags).map(([key, value]) => ({ key, value })),
      ],
    });

    const prodRouteTable = new ec2.CfnTransitGatewayRouteTable(this, `ProdRouteTable${environmentSuffix}`, {
      transitGatewayId: transitGateway.ref,
      tags: [
        { key: 'Name', value: `Prod-RouteTable-${environmentSuffix}` },
        { key: 'Environment', value: 'Prod' },
        ...Object.entries(commonTags).map(([key, value]) => ({ key, value })),
      ],
    });

    // 🔹 Transit Gateway Route Table Associations
    new ec2.CfnTransitGatewayRouteTableAssociation(this, `HubAssociation${environmentSuffix}`, {
      transitGatewayAttachmentId: hubAttachment.ref,
      transitGatewayRouteTableId: hubRouteTable.ref,
    });

    new ec2.CfnTransitGatewayRouteTableAssociation(this, `DevAssociation${environmentSuffix}`, {
      transitGatewayAttachmentId: devAttachment.ref,
      transitGatewayRouteTableId: devRouteTable.ref,
    });

    new ec2.CfnTransitGatewayRouteTableAssociation(this, `StagingAssociation${environmentSuffix}`, {
      transitGatewayAttachmentId: stagingAttachment.ref,
      transitGatewayRouteTableId: stagingRouteTable.ref,
    });

    new ec2.CfnTransitGatewayRouteTableAssociation(this, `ProdAssociation${environmentSuffix}`, {
      transitGatewayAttachmentId: prodAttachment.ref,
      transitGatewayRouteTableId: prodRouteTable.ref,
    });

    // 🔹 Transit Gateway Routes
    // Hub routes to all spokes
    new ec2.CfnTransitGatewayRoute(this, `HubToDevRoute${environmentSuffix}`, {
      transitGatewayRouteTableId: hubRouteTable.ref,
      destinationCidrBlock: '10.1.0.0/16',
      transitGatewayAttachmentId: devAttachment.ref,
    });

    new ec2.CfnTransitGatewayRoute(this, `HubToStagingRoute${environmentSuffix}`, {
      transitGatewayRouteTableId: hubRouteTable.ref,
      destinationCidrBlock: '10.2.0.0/16',
      transitGatewayAttachmentId: stagingAttachment.ref,
    });

    new ec2.CfnTransitGatewayRoute(this, `HubToProdRoute${environmentSuffix}`, {
      transitGatewayRouteTableId: hubRouteTable.ref,
      destinationCidrBlock: '10.3.0.0/16',
      transitGatewayAttachmentId: prodAttachment.ref,
    });

    // Dev routes to Hub and Staging (not Prod)
    new ec2.CfnTransitGatewayRoute(this, `DevToHubRoute${environmentSuffix}`, {
      transitGatewayRouteTableId: devRouteTable.ref,
      destinationCidrBlock: '10.0.0.0/16',
      transitGatewayAttachmentId: hubAttachment.ref,
    });

    new ec2.CfnTransitGatewayRoute(this, `DevToStagingRoute${environmentSuffix}`, {
      transitGatewayRouteTableId: devRouteTable.ref,
      destinationCidrBlock: '10.2.0.0/16',
      transitGatewayAttachmentId: stagingAttachment.ref,
    });

    // Staging routes to all
    new ec2.CfnTransitGatewayRoute(this, `StagingToHubRoute${environmentSuffix}`, {
      transitGatewayRouteTableId: stagingRouteTable.ref,
      destinationCidrBlock: '10.0.0.0/16',
      transitGatewayAttachmentId: hubAttachment.ref,
    });

    new ec2.CfnTransitGatewayRoute(this, `StagingToDevRoute${environmentSuffix}`, {
      transitGatewayRouteTableId: stagingRouteTable.ref,
      destinationCidrBlock: '10.1.0.0/16',
      transitGatewayAttachmentId: devAttachment.ref,
    });

    new ec2.CfnTransitGatewayRoute(this, `StagingToProdRoute${environmentSuffix}`, {
      transitGatewayRouteTableId: stagingRouteTable.ref,
      destinationCidrBlock: '10.3.0.0/16',
      transitGatewayAttachmentId: prodAttachment.ref,
    });

    // Prod routes to Hub and Staging (not Dev)
    new ec2.CfnTransitGatewayRoute(this, `ProdToHubRoute${environmentSuffix}`, {
      transitGatewayRouteTableId: prodRouteTable.ref,
      destinationCidrBlock: '10.0.0.0/16',
      transitGatewayAttachmentId: hubAttachment.ref,
    });

    new ec2.CfnTransitGatewayRoute(this, `ProdToStagingRoute${environmentSuffix}`, {
      transitGatewayRouteTableId: prodRouteTable.ref,
      destinationCidrBlock: '10.2.0.0/16',
      transitGatewayAttachmentId: stagingAttachment.ref,
    });

    // 🔹 NAT Instances
    const natInstanceRole = new iam.Role(this, `NatInstanceRole${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
      inlinePolicies: {
        NatInstancePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['ec2:ModifyInstanceAttribute'],
              resources: ['*'],
            }),
          ],
        }),
      },
      removalPolicy: environmentSuffix === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    const natSecurityGroup = new ec2.SecurityGroup(this, `NatSecurityGroup${environmentSuffix}`, {
      vpc: hubVpc,
      description: 'Security group for NAT instances',
      allowAllOutbound: true,
    });

    natSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/8'),
      ec2.Port.allTraffic(),
      'Allow all traffic from internal networks'
    );

    // Create NAT instances in each AZ
    const natInstances: ec2.Instance[] = [];
    for (let i = 0; i < 3; i++) {
      const natInstance = new ec2.Instance(this, `NatInstance${environmentSuffix}${i + 1}`, {
        vpc: hubVpc,
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
        securityGroup: natSecurityGroup,
        role: natInstanceRole,
        sourceDestCheck: false,
        userData: ec2.UserData.custom(`
#!/bin/bash
echo 'net.ipv4.ip_forward = 1' >> /etc/sysctl.conf
sysctl -p
/sbin/iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
/sbin/iptables -F FORWARD
`),
      });

      // Enable auto-recovery
      const cfnInstance = natInstance.node.defaultChild as ec2.CfnInstance;
      cfnInstance.addPropertyOverride('DisableApiTermination', true);

      natInstances.push(natInstance);
    }

    // 🔹 Route 53 Resolver
    const resolverSecurityGroup = new ec2.SecurityGroup(this, `ResolverSecurityGroup${environmentSuffix}`, {
      vpc: hubVpc,
      description: 'Security group for Route 53 Resolver endpoints',
      allowAllOutbound: true,
    });

    resolverSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/8'),
      ec2.Port.tcp(53),
      'Allow DNS queries from internal networks'
    );

    resolverSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/8'),
      ec2.Port.udp(53),
      'Allow DNS queries from internal networks'
    );

    // Inbound endpoint
    new route53resolver.CfnResolverEndpoint(this, `InboundResolverEndpoint${environmentSuffix}`, {
      name: `Inbound-Resolver-${environmentSuffix}`,
      direction: 'INBOUND',
      ipAddresses: hubVpc.privateSubnets.slice(0, 2).map(subnet => ({
        subnetId: subnet.subnetId,
      })),
      securityGroupIds: [resolverSecurityGroup.securityGroupId],
    });

    // Outbound endpoint
    new route53resolver.CfnResolverEndpoint(this, `OutboundResolverEndpoint${environmentSuffix}`, {
      name: `Outbound-Resolver-${environmentSuffix}`,
      direction: 'OUTBOUND',
      ipAddresses: hubVpc.privateSubnets.slice(0, 2).map(subnet => ({
        subnetId: subnet.subnetId,
      })),
      securityGroupIds: [resolverSecurityGroup.securityGroupId],
    });

    // 🔹 VPC Flow Logs
    const flowLogsBucket = new s3.Bucket(this, `VpcFlowLogsBucket${environmentSuffix}`, {
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          expiration: cdk.Duration.days(7),
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const flowLogFormat = '${srcaddr} ${dstaddr} ${srcport} ${dstport} ${protocol} ${packets} ${bytes} ${start} ${end} ${action}';

    [hubVpc, devVpc, stagingVpc, prodVpc].forEach((vpc, index) => {
      const vpcNames = ['Hub', 'Dev', 'Staging', 'Prod'];
      new ec2.CfnFlowLog(this, `${vpcNames[index]}VpcFlowLog${environmentSuffix}`, {
        resourceType: 'VPC',
        resourceId: vpc.vpcId,
        trafficType: 'ALL',
        logDestinationType: 's3',
        logDestination: flowLogsBucket.bucketArn,
        logFormat: flowLogFormat,
        tags: [
          { key: 'Name', value: `${vpcNames[index]}-VPC-FlowLog-${environmentSuffix}` },
          { key: 'Environment', value: vpcNames[index] },
          ...Object.entries(commonTags).map(([key, value]) => ({ key, value })),
        ],
      });
    });

    // 🔹 Session Manager Endpoints
    [hubVpc, devVpc, stagingVpc, prodVpc].forEach((vpc, index) => {
      const vpcNames = ['Hub', 'Dev', 'Staging', 'Prod'];
      new ec2.VpcEndpoint(this, `SSMEndpoint${vpcNames[index]}${environmentSuffix}`, {
        vpc,
        service: ec2.VpcEndpointAwsService.SSM,
        privateDnsEnabled: true,
      });

      new ec2.VpcEndpoint(this, `SSMMessagesEndpoint${vpcNames[index]}${environmentSuffix}`, {
        vpc,
        service: ec2.VpcEndpointAwsService.SSM_MESSAGES,
        privateDnsEnabled: true,
      });

      new ec2.VpcEndpoint(this, `EC2MessagesEndpoint${vpcNames[index]}${environmentSuffix}`, {
        vpc,
        service: ec2.VpcEndpointAwsService.EC2_MESSAGES,
        privateDnsEnabled: true,
      });
    });

    // 🔹 Network ACLs
    const devNacl = new ec2.NetworkAcl(this, `DevNacl${environmentSuffix}`, {
      vpc: devVpc,
    });

    const prodNacl = new ec2.NetworkAcl(this, `ProdNacl${environmentSuffix}`, {
      vpc: prodVpc,
    });

    // Deny Dev to Prod traffic
    devNacl.addEntry(`DenyDevToProd${environmentSuffix}`, {
      ruleNumber: 100,
      cidr: ec2.AclCidr.ipv4('10.3.0.0/16'),
      ruleAction: ec2.AclTrafficDirection.INGRESS,
      traffic: ec2.AclTraffic.allTraffic(),
      ruleAction: ec2.AclRuleAction.DENY,
    });

    prodNacl.addEntry(`DenyProdToDev${environmentSuffix}`, {
      ruleNumber: 100,
      cidr: ec2.AclCidr.ipv4('10.1.0.0/16'),
      ruleAction: ec2.AclTrafficDirection.INGRESS,
      traffic: ec2.AclTraffic.allTraffic(),
      ruleAction: ec2.AclRuleAction.DENY,
    });

    // 🔹 CloudFormation Outputs
    new cdk.CfnOutput(this, `HubVpcId${environmentSuffix}`, {
      value: hubVpc.vpcId,
      description: 'Hub VPC ID',
    });

    new cdk.CfnOutput(this, `TransitGatewayId${environmentSuffix}`, {
      value: transitGateway.ref,
      description: 'Transit Gateway ID',
    });

    new cdk.CfnOutput(this, `FlowLogsBucketName${environmentSuffix}`, {
      value: flowLogsBucket.bucketName,
      description: 'S3 bucket for VPC Flow Logs',
    });

    natInstances.forEach((instance, index) => {
      new cdk.CfnOutput(this, `NatInstance${environmentSuffix}${index + 1}Id`, {
        value: instance.instanceId,
        description: `NAT Instance ${index + 1} ID`,
      });
    });
  }
}
```