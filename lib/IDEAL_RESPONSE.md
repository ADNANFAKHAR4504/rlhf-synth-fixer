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

## lib/tap-stack.ts

```typescript
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
```

## cdk.json

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
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableEmrServicePolicyV2": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForCodeCommitSource": true,
    "@aws-cdk/aws-cloudwatch-actions:changeLambdaPermissionLogicalIdForLambdaAction": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-eks:nodegroupNameAttribute": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm": true,
    "@aws-cdk/custom-resources:logApiResponseDataPropertyTrueDefault": false,
    "@aws-cdk/aws-s3:keepNotificationInImportedBucket": false,
    "@aws-cdk/aws-ecs:enableImdsBlockingDeprecatedFeature": false,
    "@aws-cdk/aws-ecs:disableEcsImdsBlocking": true,
    "@aws-cdk/aws-ecs:reduceEc2FargateCloudWatchPermissions": true,
    "@aws-cdk/aws-dynamodb:resourcePolicyPerReplica": true,
    "@aws-cdk/aws-ec2:ec2SumTImeoutEnabled": true,
    "@aws-cdk/aws-appsync:appSyncGraphQLAPIScopeLambdaPermission": true,
    "@aws-cdk/aws-rds:setCorrectValueForDatabaseInstanceReadReplicaInstanceResourceId": true,
    "@aws-cdk/core:cfnIncludeRejectComplexResourceUpdateCreatePolicyIntrinsics": true,
    "@aws-cdk/aws-lambda-nodejs:sdkV3ExcludeSmithyPackages": true,
    "@aws-cdk/aws-stepfunctions-tasks:fixRunEcsTaskPolicy": true,
    "@aws-cdk/aws-ec2:bastionHostUseAmazonLinux2023ByDefault": true,
    "@aws-cdk/aws-route53-targets:userPoolDomainNameMethodWithoutCustomResource": true,
    "@aws-cdk/aws-elasticloadbalancingV2:albDualstackWithoutPublicIpv4SecurityGroupRulesDefault": true,
    "@aws-cdk/aws-iam:oidcRejectUnauthorizedConnections": true,
    "@aws-cdk/core:enableAdditionalMetadataCollection": true,
    "@aws-cdk/aws-lambda:createNewPoliciesWithAddToRolePolicy": false,
    "@aws-cdk/aws-s3:setUniqueReplicationRoleName": true,
    "@aws-cdk/aws-events:requireEventBusPolicySid": true,
    "@aws-cdk/core:aspectPrioritiesMutating": true,
    "@aws-cdk/aws-dynamodb:retainTableReplica": true,
    "@aws-cdk/aws-stepfunctions:useDistributedMapResultWriterV2": true,
    "@aws-cdk/s3-notifications:addS3TrustKeyPolicyForSnsSubscriptions": true,
    "@aws-cdk/aws-ec2:requirePrivateSubnetsForEgressOnlyInternetGateway": true,
    "@aws-cdk/aws-s3:publicAccessBlockedByDefault": true,
    "@aws-cdk/aws-lambda:useCdkManagedLogGroup": true
  }
}
```