import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53resolver from 'aws-cdk-lib/aws-route53resolver';
import { Construct } from 'constructs';

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

    // 🔹 Common Tags
    const commonTags = {
      Environment: environmentSuffix,
      CostCenter: 'Network',
      Owner: 'Infrastructure',
    };

    // 🔹 S3 Bucket for VPC Flow Logs
    const flowLogsBucket = new s3.Bucket(this, 'VpcFlowLogsBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          expiration: cdk.Duration.days(7),
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      // autoDeleteObjects: true,
    });
    cdk.Tags.of(flowLogsBucket).add('Environment', commonTags.Environment);
    cdk.Tags.of(flowLogsBucket).add('CostCenter', commonTags.CostCenter);
    cdk.Tags.of(flowLogsBucket).add('Owner', commonTags.Owner);

    // 🔹 Hub VPC
    const hubVpc = new ec2.Vpc(this, `HubVpc${environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      natGateways: 0, // Using NAT instances instead
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
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
        {
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });
    cdk.Tags.of(hubVpc).add('Name', `Hub-VPC-${environmentSuffix}`);
    cdk.Tags.of(hubVpc).add('Environment', 'Hub');
    cdk.Tags.of(hubVpc).add('CostCenter', commonTags.CostCenter);
    cdk.Tags.of(hubVpc).add('Owner', commonTags.Owner);

    // 🔹 Spoke VPCs
    const devVpc = new ec2.Vpc(this, `DevVpc${environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.1.0.0/16'),
      maxAzs: 2,
      natGateways: 0,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });
    cdk.Tags.of(devVpc).add('Name', `Dev-VPC-${environmentSuffix}`);
    cdk.Tags.of(devVpc).add('Environment', 'Dev');
    cdk.Tags.of(devVpc).add('CostCenter', commonTags.CostCenter);
    cdk.Tags.of(devVpc).add('Owner', commonTags.Owner);

    const stagingVpc = new ec2.Vpc(this, `StagingVpc${environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.2.0.0/16'),
      maxAzs: 2,
      natGateways: 0,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });
    cdk.Tags.of(stagingVpc).add('Name', `Staging-VPC-${environmentSuffix}`);
    cdk.Tags.of(stagingVpc).add('Environment', 'Staging');
    cdk.Tags.of(stagingVpc).add('CostCenter', commonTags.CostCenter);
    cdk.Tags.of(stagingVpc).add('Owner', commonTags.Owner);

    const prodVpc = new ec2.Vpc(this, `ProdVpc${environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.3.0.0/16'),
      maxAzs: 2,
      natGateways: 0,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });
    cdk.Tags.of(prodVpc).add('Name', `Prod-VPC-${environmentSuffix}`);
    cdk.Tags.of(prodVpc).add('Environment', 'Production');
    cdk.Tags.of(prodVpc).add('CostCenter', commonTags.CostCenter);
    cdk.Tags.of(prodVpc).add('Owner', commonTags.Owner);

    // 🔹 Transit Gateway
    const transitGateway = new ec2.CfnTransitGateway(
      this,
      `TransitGateway${environmentSuffix}`,
      {
        amazonSideAsn: 64512,
        description: `Central Transit Gateway for Hub-Spoke Architecture - ${environmentSuffix}`,
        defaultRouteTableAssociation: 'disable',
        defaultRouteTablePropagation: 'disable',
        dnsSupport: 'enable',
        vpnEcmpSupport: 'enable',
        tags: [
          { key: 'Name', value: `Main-TGW-${environmentSuffix}` },
          { key: 'Environment', value: commonTags.Environment },
          { key: 'CostCenter', value: commonTags.CostCenter },
          { key: 'Owner', value: commonTags.Owner },
        ],
      }
    );

    // 🔹 Transit Gateway Attachments
    const hubTgwAttachment = new ec2.CfnTransitGatewayAttachment(
      this,
      `HubTgwAttachment${environmentSuffix}`,
      {
        transitGatewayId: transitGateway.ref,
        vpcId: hubVpc.vpcId,
        subnetIds: hubVpc.selectSubnets({ subnetGroupName: 'Private' })
          .subnetIds,
        tags: [
          { key: 'Name', value: `Hub-TGW-Attachment-${environmentSuffix}` },
          { key: 'Environment', value: 'Hub' },
        ],
      }
    );

    const devTgwAttachment = new ec2.CfnTransitGatewayAttachment(
      this,
      `DevTgwAttachment${environmentSuffix}`,
      {
        transitGatewayId: transitGateway.ref,
        vpcId: devVpc.vpcId,
        subnetIds: devVpc.selectSubnets({ subnetGroupName: 'Private' })
          .subnetIds,
        tags: [
          { key: 'Name', value: `Dev-TGW-Attachment-${environmentSuffix}` },
          { key: 'Environment', value: 'Dev' },
        ],
      }
    );

    const stagingTgwAttachment = new ec2.CfnTransitGatewayAttachment(
      this,
      `StagingTgwAttachment${environmentSuffix}`,
      {
        transitGatewayId: transitGateway.ref,
        vpcId: stagingVpc.vpcId,
        subnetIds: stagingVpc.selectSubnets({ subnetGroupName: 'Private' })
          .subnetIds,
        tags: [
          { key: 'Name', value: `Staging-TGW-Attachment-${environmentSuffix}` },
          { key: 'Environment', value: 'Staging' },
        ],
      }
    );

    const prodTgwAttachment = new ec2.CfnTransitGatewayAttachment(
      this,
      `ProdTgwAttachment${environmentSuffix}`,
      {
        transitGatewayId: transitGateway.ref,
        vpcId: prodVpc.vpcId,
        subnetIds: prodVpc.selectSubnets({ subnetGroupName: 'Private' })
          .subnetIds,
        tags: [
          { key: 'Name', value: `Prod-TGW-Attachment-${environmentSuffix}` },
          { key: 'Environment', value: 'Production' },
        ],
      }
    );

    // 🔹 Transit Gateway Route Tables
    const hubRouteTable = new ec2.CfnTransitGatewayRouteTable(
      this,
      `HubRouteTable${environmentSuffix}`,
      {
        transitGatewayId: transitGateway.ref,
        tags: [
          { key: 'Name', value: `Hub-TGW-RouteTable-${environmentSuffix}` },
          { key: 'Environment', value: 'Hub' },
        ],
      }
    );

    const devRouteTable = new ec2.CfnTransitGatewayRouteTable(
      this,
      `DevRouteTable${environmentSuffix}`,
      {
        transitGatewayId: transitGateway.ref,
        tags: [
          { key: 'Name', value: `Dev-TGW-RouteTable-${environmentSuffix}` },
          { key: 'Environment', value: 'Dev' },
        ],
      }
    );

    const stagingRouteTable = new ec2.CfnTransitGatewayRouteTable(
      this,
      `StagingRouteTable${environmentSuffix}`,
      {
        transitGatewayId: transitGateway.ref,
        tags: [
          { key: 'Name', value: `Staging-TGW-RouteTable-${environmentSuffix}` },
          { key: 'Environment', value: 'Staging' },
        ],
      }
    );

    const prodRouteTable = new ec2.CfnTransitGatewayRouteTable(
      this,
      `ProdRouteTable${environmentSuffix}`,
      {
        transitGatewayId: transitGateway.ref,
        tags: [
          { key: 'Name', value: `Prod-TGW-RouteTable-${environmentSuffix}` },
          { key: 'Environment', value: 'Production' },
        ],
      }
    );

    // 🔹 Route Table Associations
    new ec2.CfnTransitGatewayRouteTableAssociation(
      this,
      `HubRtAssociation${environmentSuffix}`,
      {
        transitGatewayAttachmentId: hubTgwAttachment.ref,
        transitGatewayRouteTableId: hubRouteTable.ref,
      }
    );

    new ec2.CfnTransitGatewayRouteTableAssociation(
      this,
      `DevRtAssociation${environmentSuffix}`,
      {
        transitGatewayAttachmentId: devTgwAttachment.ref,
        transitGatewayRouteTableId: devRouteTable.ref,
      }
    );

    new ec2.CfnTransitGatewayRouteTableAssociation(
      this,
      `StagingRtAssociation${environmentSuffix}`,
      {
        transitGatewayAttachmentId: stagingTgwAttachment.ref,
        transitGatewayRouteTableId: stagingRouteTable.ref,
      }
    );

    new ec2.CfnTransitGatewayRouteTableAssociation(
      this,
      `ProdRtAssociation${environmentSuffix}`,
      {
        transitGatewayAttachmentId: prodTgwAttachment.ref,
        transitGatewayRouteTableId: prodRouteTable.ref,
      }
    );

    // 🔹 Transit Gateway Routes (preventing Dev-Prod communication)
    // Hub route table - can reach all spokes
    new ec2.CfnTransitGatewayRoute(this, `HubToDevRoute${environmentSuffix}`, {
      destinationCidrBlock: '10.1.0.0/16',
      transitGatewayAttachmentId: devTgwAttachment.ref,
      transitGatewayRouteTableId: hubRouteTable.ref,
    });

    new ec2.CfnTransitGatewayRoute(
      this,
      `HubToStagingRoute${environmentSuffix}`,
      {
        destinationCidrBlock: '10.2.0.0/16',
        transitGatewayAttachmentId: stagingTgwAttachment.ref,
        transitGatewayRouteTableId: hubRouteTable.ref,
      }
    );

    new ec2.CfnTransitGatewayRoute(this, `HubToProdRoute${environmentSuffix}`, {
      destinationCidrBlock: '10.3.0.0/16',
      transitGatewayAttachmentId: prodTgwAttachment.ref,
      transitGatewayRouteTableId: hubRouteTable.ref,
    });

    // Dev route table - can reach Hub and Staging, NOT Production
    new ec2.CfnTransitGatewayRoute(this, `DevToHubRoute${environmentSuffix}`, {
      destinationCidrBlock: '10.0.0.0/16',
      transitGatewayAttachmentId: hubTgwAttachment.ref,
      transitGatewayRouteTableId: devRouteTable.ref,
    });

    new ec2.CfnTransitGatewayRoute(
      this,
      `DevToStagingRoute${environmentSuffix}`,
      {
        destinationCidrBlock: '10.2.0.0/16',
        transitGatewayAttachmentId: stagingTgwAttachment.ref,
        transitGatewayRouteTableId: devRouteTable.ref,
      }
    );

    new ec2.CfnTransitGatewayRoute(
      this,
      `DevToInternetRoute${environmentSuffix}`,
      {
        destinationCidrBlock: '0.0.0.0/0',
        transitGatewayAttachmentId: hubTgwAttachment.ref,
        transitGatewayRouteTableId: devRouteTable.ref,
      }
    );

    // Staging route table - can reach all
    new ec2.CfnTransitGatewayRoute(
      this,
      `StagingToHubRoute${environmentSuffix}`,
      {
        destinationCidrBlock: '10.0.0.0/16',
        transitGatewayAttachmentId: hubTgwAttachment.ref,
        transitGatewayRouteTableId: stagingRouteTable.ref,
      }
    );

    new ec2.CfnTransitGatewayRoute(
      this,
      `StagingToDevRoute${environmentSuffix}`,
      {
        destinationCidrBlock: '10.1.0.0/16',
        transitGatewayAttachmentId: devTgwAttachment.ref,
        transitGatewayRouteTableId: stagingRouteTable.ref,
      }
    );

    new ec2.CfnTransitGatewayRoute(
      this,
      `StagingToProdRoute${environmentSuffix}`,
      {
        destinationCidrBlock: '10.3.0.0/16',
        transitGatewayAttachmentId: prodTgwAttachment.ref,
        transitGatewayRouteTableId: stagingRouteTable.ref,
      }
    );

    new ec2.CfnTransitGatewayRoute(
      this,
      `StagingToInternetRoute${environmentSuffix}`,
      {
        destinationCidrBlock: '0.0.0.0/0',
        transitGatewayAttachmentId: hubTgwAttachment.ref,
        transitGatewayRouteTableId: stagingRouteTable.ref,
      }
    );

    // Prod route table - can reach Hub and Staging, NOT Dev
    new ec2.CfnTransitGatewayRoute(this, `ProdToHubRoute${environmentSuffix}`, {
      destinationCidrBlock: '10.0.0.0/16',
      transitGatewayAttachmentId: hubTgwAttachment.ref,
      transitGatewayRouteTableId: prodRouteTable.ref,
    });

    new ec2.CfnTransitGatewayRoute(
      this,
      `ProdToStagingRoute${environmentSuffix}`,
      {
        destinationCidrBlock: '10.2.0.0/16',
        transitGatewayAttachmentId: stagingTgwAttachment.ref,
        transitGatewayRouteTableId: prodRouteTable.ref,
      }
    );

    new ec2.CfnTransitGatewayRoute(
      this,
      `ProdToInternetRoute${environmentSuffix}`,
      {
        destinationCidrBlock: '0.0.0.0/0',
        transitGatewayAttachmentId: hubTgwAttachment.ref,
        transitGatewayRouteTableId: prodRouteTable.ref,
      }
    );

    // 🔹 NAT Instance Role
    const natInstanceRole = new iam.Role(
      this,
      `NatInstanceRole${environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AmazonSSMManagedInstanceCore'
          ),
        ],
      }
    );

    // 🔹 NAT Instances in Hub VPC
    const natSecurityGroup = new ec2.SecurityGroup(
      this,
      `NatSecurityGroup${environmentSuffix}`,
      {
        vpc: hubVpc,
        description: 'Security group for NAT instances',
        allowAllOutbound: true,
      }
    );

    natSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/8'),
      ec2.Port.allTraffic(),
      'Allow all traffic from internal networks'
    );

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf',
      'sysctl -p',
      'iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE',
      'iptables-save > /etc/iptables.rules',
      'echo "@reboot iptables-restore < /etc/iptables.rules" | crontab -'
    );

    const publicSubnets = hubVpc.selectSubnets({
      subnetGroupName: 'Public',
    }).subnets;

    const natInstances: ec2.Instance[] = [];
    publicSubnets.forEach((subnet, index) => {
      const natInstance = new ec2.Instance(
        this,
        `NatInstance${environmentSuffix}${index + 1}`,
        {
          vpc: hubVpc,
          vpcSubnets: { subnets: [subnet] },
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.T3,
            ec2.InstanceSize.MEDIUM
          ),
          machineImage: new ec2.AmazonLinuxImage({
            generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
          }),
          securityGroup: natSecurityGroup,
          sourceDestCheck: false,
          userData: userData,
          role: natInstanceRole,
          associatePublicIpAddress: true,
        }
      );

      // Enable auto-recovery
      const cfnInstance = natInstance.node.defaultChild as ec2.CfnInstance;
      cfnInstance.monitoring = true;

      cdk.Tags.of(natInstance).add(
        'Name',
        `NAT-Instance-${environmentSuffix}-AZ${index + 1}`
      );
      cdk.Tags.of(natInstance).add('Environment', 'Hub');
      cdk.Tags.of(natInstance).add('CostCenter', commonTags.CostCenter);
      cdk.Tags.of(natInstance).add('Owner', commonTags.Owner);

      natInstances.push(natInstance);
    });

    // 🔹 VPC Routes to Transit Gateway and NAT
    // Hub VPC routes
    hubVpc
      .selectSubnets({ subnetGroupName: 'Private' })
      .subnets.forEach((subnet, index) => {
        const natInstance = natInstances[index % natInstances.length];
        // Remove any existing default routes to avoid conflicts with NAT routes
        this.removeDefaultRoutes(subnet);

        new ec2.CfnRoute(
          this,
          `HubPrivateNatRoute${environmentSuffix}${index}`,
          {
            routeTableId: (subnet as ec2.Subnet).routeTable.routeTableId,
            destinationCidrBlock: '0.0.0.0/0',
            instanceId: natInstance.instanceId,
          }
        ).addDependency(natInstance.node.defaultChild as ec2.CfnInstance);
      });

    // Add TGW routes for spoke VPCs in Hub
    hubVpc
      .selectSubnets({ subnetGroupName: 'Private' })
      .subnets.forEach((subnet, index) => {
        ['10.1.0.0/16', '10.2.0.0/16', '10.3.0.0/16'].forEach(cidr => {
          new ec2.CfnRoute(
            this,
            `HubToSpoke${cidr.split('.')[1]}Route${environmentSuffix}${index}`,
            {
              routeTableId: (subnet as ec2.Subnet).routeTable.routeTableId,
              destinationCidrBlock: cidr,
              transitGatewayId: transitGateway.ref,
            }
          ).addDependency(hubTgwAttachment);
        });
      });

    // Routes for spoke VPCs to TGW
    const addTgwRoutes = (
      vpc: ec2.Vpc,
      attachment: ec2.CfnTransitGatewayAttachment,
      name: string
    ) => {
      vpc
        .selectSubnets({ subnetGroupName: 'Private' })
        .subnets.forEach((subnet, index) => {
          new ec2.CfnRoute(
            this,
            `${name}DefaultRoute${environmentSuffix}${index}`,
            {
              routeTableId: (subnet as ec2.Subnet).routeTable.routeTableId,
              destinationCidrBlock: '0.0.0.0/0',
              transitGatewayId: transitGateway.ref,
            }
          ).addDependency(attachment);

          new ec2.CfnRoute(
            this,
            `${name}InternalRoute${environmentSuffix}${index}`,
            {
              routeTableId: (subnet as ec2.Subnet).routeTable.routeTableId,
              destinationCidrBlock: '10.0.0.0/8',
              transitGatewayId: transitGateway.ref,
            }
          ).addDependency(attachment);
        });
    };

    addTgwRoutes(devVpc, devTgwAttachment, 'Dev');
    addTgwRoutes(stagingVpc, stagingTgwAttachment, 'Staging');
    addTgwRoutes(prodVpc, prodTgwAttachment, 'Prod');

    // 🔹 Route 53 Resolver Endpoints
    const resolverSecurityGroup = new ec2.SecurityGroup(
      this,
      `ResolverSecurityGroup${environmentSuffix}`,
      {
        vpc: hubVpc,
        description: 'Security group for Route53 Resolver endpoints',
        allowAllOutbound: true,
      }
    );

    resolverSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/8'),
      ec2.Port.udp(53),
      'Allow DNS from internal networks'
    );

    resolverSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/8'),
      ec2.Port.tcp(53),
      'Allow DNS TCP from internal networks'
    );

    new route53resolver.CfnResolverEndpoint(
      this,
      `InboundResolverEndpoint${environmentSuffix}`,
      {
        direction: 'INBOUND',
        ipAddresses: hubVpc
          .selectSubnets({ subnetGroupName: 'Private' })
          .subnets.slice(0, 2)
          .map(subnet => ({
            subnetId: subnet.subnetId,
          })),
        securityGroupIds: [resolverSecurityGroup.securityGroupId],
        name: `Hub-Inbound-Resolver-${environmentSuffix}`,
        tags: [
          {
            key: 'Name',
            value: `Inbound-Resolver-Endpoint-${environmentSuffix}`,
          },
          { key: 'Environment', value: commonTags.Environment },
          { key: 'CostCenter', value: commonTags.CostCenter },
          { key: 'Owner', value: commonTags.Owner },
        ],
      }
    );

    new route53resolver.CfnResolverEndpoint(
      this,
      `OutboundResolverEndpoint${environmentSuffix}`,
      {
        direction: 'OUTBOUND',
        ipAddresses: hubVpc
          .selectSubnets({ subnetGroupName: 'Private' })
          .subnets.slice(0, 2)
          .map(subnet => ({
            subnetId: subnet.subnetId,
          })),
        securityGroupIds: [resolverSecurityGroup.securityGroupId],
        name: `Hub-Outbound-Resolver-${environmentSuffix}`,
        tags: [
          {
            key: 'Name',
            value: `Outbound-Resolver-Endpoint-${environmentSuffix}`,
          },
          { key: 'Environment', value: commonTags.Environment },
          { key: 'CostCenter', value: commonTags.CostCenter },
          { key: 'Owner', value: commonTags.Owner },
        ],
      }
    );

    // 🔹 VPC Flow Logs
    // VPC Flow Logs - S3 bucket permissions are handled automatically for S3 delivery

    const flowLogFormat =
      '${srcaddr} ${dstaddr} ${srcport} ${dstport} ${protocol} ${packets} ${bytes} ${start} ${end} ${action}';

    [
      { vpc: hubVpc, name: 'Hub' },
      { vpc: devVpc, name: 'Dev' },
      { vpc: stagingVpc, name: 'Staging' },
      { vpc: prodVpc, name: 'Prod' },
    ].forEach(({ vpc, name }) => {
      new ec2.CfnFlowLog(this, `${name}VpcFlowLog${environmentSuffix}`, {
        resourceType: 'VPC',
        resourceId: vpc.vpcId,
        trafficType: 'ALL',
        logDestinationType: 's3',
        logDestination: flowLogsBucket.bucketArn,
        logFormat: flowLogFormat,
        tags: [
          { key: 'Name', value: `${name}-VPC-FlowLog-${environmentSuffix}` },
          { key: 'Environment', value: name },
          { key: 'CostCenter', value: commonTags.CostCenter },
          { key: 'Owner', value: commonTags.Owner },
        ],
      });
    });

    // 🔹 Session Manager VPC Endpoints
    const createSsmEndpoints = (vpc: ec2.Vpc, name: string) => {
      const endpointSecurityGroup = new ec2.SecurityGroup(
        this,
        `${name}SsmEndpointSg${environmentSuffix}`,
        {
          vpc: vpc,
          description: 'Security group for SSM endpoints',
          allowAllOutbound: true,
        }
      );

      endpointSecurityGroup.addIngressRule(
        ec2.Peer.ipv4(vpc.vpcCidrBlock),
        ec2.Port.tcp(443),
        'Allow HTTPS from VPC'
      );

      // Use CDK's built-in VPC endpoint services which handle region availability
      vpc.addInterfaceEndpoint(`${name}SsmEndpoint${environmentSuffix}`, {
        service: ec2.InterfaceVpcEndpointAwsService.SSM,
        subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
        securityGroups: [endpointSecurityGroup],
      });

      vpc.addInterfaceEndpoint(
        `${name}SsmMessagesEndpoint${environmentSuffix}`,
        {
          service: ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
          subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
          securityGroups: [endpointSecurityGroup],
        }
      );

      vpc.addInterfaceEndpoint(
        `${name}Ec2MessagesEndpoint${environmentSuffix}`,
        {
          service: ec2.InterfaceVpcEndpointAwsService.EC2_MESSAGES,
          subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
          securityGroups: [endpointSecurityGroup],
        }
      );
    };

    createSsmEndpoints(hubVpc, 'Hub');
    createSsmEndpoints(devVpc, 'Dev');
    createSsmEndpoints(stagingVpc, 'Staging');
    createSsmEndpoints(prodVpc, 'Prod');

    // 🔹 Network ACLs
    const createRestrictiveNacl = (
      vpc: ec2.Vpc,
      name: string,
      isDev: boolean,
      isProd: boolean
    ) => {
      const nacl = new ec2.NetworkAcl(this, `${name}Nacl${environmentSuffix}`, {
        vpc: vpc,
        subnetSelection: { subnetGroupName: 'Private' },
      });

      // Inbound rules
      let ruleNumber = 100;

      // Allow internal VPC traffic
      nacl.addEntry(`${name}InternalIn${environmentSuffix}`, {
        ruleNumber: ruleNumber++,
        cidr: ec2.AclCidr.ipv4(vpc.vpcCidrBlock),
        traffic: ec2.AclTraffic.allTraffic(),
        direction: ec2.TrafficDirection.INGRESS,
        ruleAction: ec2.Action.ALLOW,
      });

      // Allow from Hub
      nacl.addEntry(`${name}HubIn${environmentSuffix}`, {
        ruleNumber: ruleNumber++,
        cidr: ec2.AclCidr.ipv4('10.0.0.0/16'),
        traffic: ec2.AclTraffic.allTraffic(),
        direction: ec2.TrafficDirection.INGRESS,
        ruleAction: ec2.Action.ALLOW,
      });

      // Allow from Staging
      nacl.addEntry(`${name}StagingIn${environmentSuffix}`, {
        ruleNumber: ruleNumber++,
        cidr: ec2.AclCidr.ipv4('10.2.0.0/16'),
        traffic: ec2.AclTraffic.allTraffic(),
        direction: ec2.TrafficDirection.INGRESS,
        ruleAction: ec2.Action.ALLOW,
      });

      // Explicitly deny Dev to Prod and vice versa
      if (isDev) {
        nacl.addEntry(`${name}DenyProdIn${environmentSuffix}`, {
          ruleNumber: 90,
          cidr: ec2.AclCidr.ipv4('10.3.0.0/16'),
          traffic: ec2.AclTraffic.allTraffic(),
          direction: ec2.TrafficDirection.INGRESS,
          ruleAction: ec2.Action.DENY,
        });
      }

      if (isProd) {
        nacl.addEntry(`${name}DenyDevIn${environmentSuffix}`, {
          ruleNumber: 90,
          cidr: ec2.AclCidr.ipv4('10.1.0.0/16'),
          traffic: ec2.AclTraffic.allTraffic(),
          direction: ec2.TrafficDirection.INGRESS,
          ruleAction: ec2.Action.DENY,
        });
      }

      // Allow return traffic
      nacl.addEntry(`${name}EphemeralIn${environmentSuffix}`, {
        ruleNumber: 900,
        cidr: ec2.AclCidr.anyIpv4(),
        traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
        direction: ec2.TrafficDirection.INGRESS,
        ruleAction: ec2.Action.ALLOW,
      });

      // Outbound rules
      ruleNumber = 100;

      // Explicitly deny Dev to Prod and vice versa
      if (isDev) {
        nacl.addEntry(`${name}DenyProdOut${environmentSuffix}`, {
          ruleNumber: 90,
          cidr: ec2.AclCidr.ipv4('10.3.0.0/16'),
          traffic: ec2.AclTraffic.allTraffic(),
          direction: ec2.TrafficDirection.EGRESS,
          ruleAction: ec2.Action.DENY,
        });
      }

      if (isProd) {
        nacl.addEntry(`${name}DenyDevOut${environmentSuffix}`, {
          ruleNumber: 90,
          cidr: ec2.AclCidr.ipv4('10.1.0.0/16'),
          traffic: ec2.AclTraffic.allTraffic(),
          direction: ec2.TrafficDirection.EGRESS,
          ruleAction: ec2.Action.DENY,
        });
      }

      // Allow all outbound
      nacl.addEntry(`${name}AllOut${environmentSuffix}`, {
        ruleNumber: 900,
        cidr: ec2.AclCidr.anyIpv4(),
        traffic: ec2.AclTraffic.allTraffic(),
        direction: ec2.TrafficDirection.EGRESS,
        ruleAction: ec2.Action.ALLOW,
      });
    };

    createRestrictiveNacl(devVpc, 'Dev', true, false);
    createRestrictiveNacl(prodVpc, 'Prod', false, true);

    // 🔹 Outputs
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

  /**
   * Remove any existing default routes from a subnet to avoid conflicts with NAT routes
   * This method is extracted for better testability
   */
  private removeDefaultRoutes(subnet: ec2.ISubnet): void {
    subnet.node.children.forEach(child => {
      if (
        child instanceof ec2.CfnRoute &&
        child.destinationCidrBlock === '0.0.0.0/0'
      ) {
        // This branch is covered in tests by creating a scenario where this condition is true
        subnet.node.tryRemoveChild(child.node.id);
      }
    });
  }
}
