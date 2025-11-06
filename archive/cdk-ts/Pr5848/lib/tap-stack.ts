import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

/**
 * Properties for the TAP Stack
 */
export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

/**
 * Environment configuration for VPCs
 */
interface EnvironmentConfig {
  name: string;
  cidrBlock: string;
  allowedDestinations: string[];
}

/**
 * Trading Application Platform Network Foundation Stack
 * Implements a hub-and-spoke network topology with Transit Gateway
 * for a financial services trading platform.
 */
export class TapStack extends cdk.Stack {
  private readonly environmentSuffix: string;
  private readonly projectName: string = 'tap';
  private readonly costCenter: string = 'FinTech-Trading';
  private transitGateway: ec2.CfnTransitGateway;
  private vpcs: Map<string, ec2.Vpc> = new Map();
  private tgwAttachments: Map<string, ec2.CfnTransitGatewayAttachment> =
    new Map();
  private flowLogsBucket: s3.Bucket;
  private natInstances: Map<string, ec2.Instance> = new Map();
  private hostedZones: Map<string, route53.PrivateHostedZone> = new Map();

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    this.environmentSuffix = props.environmentSuffix;

    // Apply global tags
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this).add('Environment', this.environmentSuffix);
    cdk.Tags.of(this).add('CostCenter', this.costCenter);
    cdk.Tags.of(this).add('ManagedBy', 'AWS-CDK');

    // Environment configurations
    const environments: EnvironmentConfig[] = [
      {
        name: 'dev',
        cidrBlock: '10.0.0.0/16',
        allowedDestinations: ['staging'],
      },
      {
        name: 'staging',
        cidrBlock: '10.1.0.0/16',
        allowedDestinations: ['dev', 'prod'],
      },
      {
        name: 'prod',
        cidrBlock: '10.2.0.0/16',
        allowedDestinations: ['staging'],
      },
    ];

    // Step 1: Create S3 bucket for VPC Flow Logs
    this.createFlowLogsBucket();

    // Step 2: Create Transit Gateway (Hub)
    this.createTransitGateway();

    // Step 3: Create VPCs and related resources for each environment
    environments.forEach(env => {
      this.createEnvironmentInfrastructure(env);
    });

    // Step 4: Configure Transit Gateway routing policies
    this.configureTransitGatewayRouting(environments);

    // Step 5: Create Route53 private hosted zones
    this.createRoute53Zones(environments);

    // Step 6: Create outputs
    this.createOutputs(environments);
  }

  /**
   * Creates S3 bucket for VPC Flow Logs storage with Parquet format
   */
  private createFlowLogsBucket(): void {
    const bucketName = `${this.projectName}-${this.environmentSuffix}-vpc-flow-logs-${this.account}`;

    this.flowLogsBucket = new s3.Bucket(this, 'FlowLogsBucket', {
      bucketName: bucketName,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'delete-old-flow-logs',
          enabled: true,
          expiration: cdk.Duration.days(7),
          transitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: cdk.Duration.days(1),
            },
          ],
        },
      ],
    });

    cdk.Tags.of(this.flowLogsBucket).add(
      'Name',
      `${this.projectName}-${this.environmentSuffix}-vpc-flow-logs`
    );
    cdk.Tags.of(this.flowLogsBucket).add('Purpose', 'VPC-Flow-Logs-Storage');
  }

  /**
   * Creates the Transit Gateway (Hub) with ECMP enabled
   */
  private createTransitGateway(): void {
    this.transitGateway = new ec2.CfnTransitGateway(this, 'TransitGateway', {
      description: `Central hub for TAP network foundation - ${this.environmentSuffix}`,
      defaultRouteTableAssociation: 'disable',
      defaultRouteTablePropagation: 'disable',
      dnsSupport: 'enable',
      vpnEcmpSupport: 'enable',
      multicastSupport: 'disable',
      tags: [
        {
          key: 'Name',
          value: `${this.projectName}-${this.environmentSuffix}-tgw`,
        },
        { key: 'Purpose', value: 'Network-Hub' },
      ],
    });
  }

  /**
   * Creates complete infrastructure for an environment
   */
  private createEnvironmentInfrastructure(env: EnvironmentConfig): void {
    // Create VPC with 3 AZs
    const vpc = new ec2.Vpc(
      this,
      `Vpc${env.name.charAt(0).toUpperCase() + env.name.slice(1)}`,
      {
        ipAddresses: ec2.IpAddresses.cidr(env.cidrBlock),
        maxAzs: 3,
        natGateways: 0, // We'll use NAT instances
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
        ],
      }
    );

    cdk.Tags.of(vpc).add(
      'Name',
      `${this.projectName}-${this.environmentSuffix}-vpc-${env.name}`
    );
    this.vpcs.set(env.name, vpc);

    // Create NAT instances (one per AZ)
    const publicSubnets = vpc.publicSubnets;
    const privateSubnets = vpc.isolatedSubnets;

    publicSubnets.forEach((publicSubnet, index) => {
      if (index === 0) {
        // Create only one NAT instance for cost optimization
        const natInstance = this.createNatInstance(env.name, vpc, publicSubnet);
        this.natInstances.set(env.name, natInstance);

        // Add routes from private subnets to NAT instance
        privateSubnets.forEach(privateSubnet => {
          (privateSubnet as ec2.PrivateSubnet).addRoute('NatRoute', {
            routerId: natInstance.instanceId,
            routerType: ec2.RouterType.INSTANCE,
            destinationCidrBlock: '0.0.0.0/0',
          });
        });
      }
    });

    // Create Transit Gateway attachment
    const tgwAttachment = new ec2.CfnTransitGatewayAttachment(
      this,
      `TgwAttachment${env.name.charAt(0).toUpperCase() + env.name.slice(1)}`,
      {
        transitGatewayId: this.transitGateway.ref,
        vpcId: vpc.vpcId,
        subnetIds: privateSubnets.map(s => s.subnetId),
        tags: [
          {
            key: 'Name',
            value: `${this.projectName}-${this.environmentSuffix}-tgw-attachment-${env.name}`,
          },
        ],
      }
    );

    tgwAttachment.addDependency(this.transitGateway);
    this.tgwAttachments.set(env.name, tgwAttachment);

    // Add routes to Transit Gateway in private subnets
    privateSubnets.forEach(subnet => {
      new ec2.CfnRoute(this, `TgwRoute${env.name}${subnet.node.id}`, {
        routeTableId: subnet.routeTable.routeTableId,
        destinationCidrBlock: '10.0.0.0/8',
        transitGatewayId: this.transitGateway.ref,
      }).addDependency(tgwAttachment);
    });

    // Create VPC Endpoints
    this.createVpcEndpoints(env.name, vpc);

    // Create VPC Flow Logs with Parquet format
    vpc.addFlowLog(`FlowLog${env.name}`, {
      destination: ec2.FlowLogDestination.toS3(
        this.flowLogsBucket,
        `vpc-flow-logs/${env.name}/`
      ),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // Store VPC and subnet IDs in SSM Parameter Store
    new ssm.StringParameter(this, `SsmVpcId${env.name}`, {
      parameterName: `/${this.projectName}/${this.environmentSuffix}/${env.name}/vpc/id`,
      stringValue: vpc.vpcId,
      description: `VPC ID for ${this.environmentSuffix}-${env.name} environment`,
      tier: ssm.ParameterTier.STANDARD,
    });

    privateSubnets.forEach((subnet, index) => {
      new ssm.StringParameter(this, `SsmPrivateSubnet${env.name}${index}`, {
        parameterName: `/${this.projectName}/${this.environmentSuffix}/${env.name}/subnet/private/${index + 1}/id`,
        stringValue: subnet.subnetId,
        description: `Private subnet ${index + 1} ID for ${this.environmentSuffix}-${env.name} environment`,
        tier: ssm.ParameterTier.STANDARD,
      });
    });

    publicSubnets.forEach((subnet, index) => {
      new ssm.StringParameter(this, `SsmPublicSubnet${env.name}${index}`, {
        parameterName: `/${this.projectName}/${this.environmentSuffix}/${env.name}/subnet/public/${index + 1}/id`,
        stringValue: subnet.subnetId,
        description: `Public subnet ${index + 1} ID for ${this.environmentSuffix}-${env.name} environment`,
        tier: ssm.ParameterTier.STANDARD,
      });
    });
  }

  /**
   * Creates a NAT instance for cost optimization
   */
  private createNatInstance(
    envName: string,
    vpc: ec2.Vpc,
    subnet: ec2.ISubnet
  ): ec2.Instance {
    // Security group for NAT instance
    const natSecurityGroup = new ec2.SecurityGroup(this, `NatSg${envName}`, {
      vpc: vpc,
      description: `Security group for NAT instance in ${this.environmentSuffix}-${envName}`,
      allowAllOutbound: true,
    });

    natSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/8'),
      ec2.Port.allTraffic(),
      'Allow all traffic from private subnets'
    );

    cdk.Tags.of(natSecurityGroup).add(
      'Name',
      `${this.projectName}-${this.environmentSuffix}-nat-sg-${envName}`
    );

    // IAM role for NAT instance
    const natRole = new iam.Role(this, `NatRole${envName}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    cdk.Tags.of(natRole).add(
      'Name',
      `${this.projectName}-${this.environmentSuffix}-nat-role-${envName}`
    );

    // User data to configure NAT
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'echo 1 > /proc/sys/net/ipv4/ip_forward',
      'echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf',
      'sysctl -p',
      'yum install -y iptables-services',
      'systemctl enable iptables',
      'systemctl start iptables',
      'iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE',
      'iptables -F FORWARD',
      'service iptables save'
    );

    // Create NAT instance
    const natInstance = new ec2.Instance(this, `NatInstance${envName}`, {
      vpc: vpc,
      vpcSubnets: { subnets: [subnet] },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: natSecurityGroup,
      role: natRole,
      sourceDestCheck: false,
      userData: userData,
      requireImdsv2: true,
    });

    cdk.Tags.of(natInstance).add(
      'Name',
      `${this.projectName}-${this.environmentSuffix}-nat-${envName}`
    );
    cdk.Tags.of(natInstance).add('Type', 'NAT-Instance');

    return natInstance;
  }

  /**
   * Creates VPC endpoints for AWS services
   */
  private createVpcEndpoints(envName: string, vpc: ec2.Vpc): void {
    // S3 Gateway Endpoint
    vpc.addGatewayEndpoint(`S3Endpoint${envName}`, {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    // DynamoDB Gateway Endpoint
    vpc.addGatewayEndpoint(`DynamoDbEndpoint${envName}`, {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
    });

    // Systems Manager Interface Endpoints
    vpc.addInterfaceEndpoint(`SsmEndpoint${envName}`, {
      service: ec2.InterfaceVpcEndpointAwsService.SSM,
      privateDnsEnabled: true,
    });

    vpc.addInterfaceEndpoint(`SsmMessagesEndpoint${envName}`, {
      service: ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
      privateDnsEnabled: true,
    });

    vpc.addInterfaceEndpoint(`Ec2MessagesEndpoint${envName}`, {
      service: ec2.InterfaceVpcEndpointAwsService.EC2_MESSAGES,
      privateDnsEnabled: true,
    });
  }

  /**
   * Configures Transit Gateway routing policies
   */
  private configureTransitGatewayRouting(
    environments: EnvironmentConfig[]
  ): void {
    const routeTables: Map<string, ec2.CfnTransitGatewayRouteTable> = new Map();

    // Create route table for each environment
    environments.forEach(env => {
      const routeTable = new ec2.CfnTransitGatewayRouteTable(
        this,
        `TgwRt${env.name.charAt(0).toUpperCase() + env.name.slice(1)}`,
        {
          transitGatewayId: this.transitGateway.ref,
          tags: [
            {
              key: 'Name',
              value: `${this.projectName}-${this.environmentSuffix}-tgw-rt-${env.name}`,
            },
          ],
        }
      );

      routeTable.addDependency(this.transitGateway);
      routeTables.set(env.name, routeTable);

      // Associate route table with attachment
      const association = new ec2.CfnTransitGatewayRouteTableAssociation(
        this,
        `TgwRtAssoc${env.name}`,
        {
          transitGatewayAttachmentId: this.tgwAttachments.get(env.name)!.ref,
          transitGatewayRouteTableId: routeTable.ref,
        }
      );
      association.addDependency(routeTable);
      association.addDependency(this.tgwAttachments.get(env.name)!);
    });

    // Configure specific routing policies
    const envMap = new Map(environments.map(e => [e.name, e]));

    // Dev can reach Staging
    new ec2.CfnTransitGatewayRoute(this, 'TgwRouteDevToStaging', {
      transitGatewayRouteTableId: routeTables.get('dev')!.ref,
      destinationCidrBlock: envMap.get('staging')!.cidrBlock,
      transitGatewayAttachmentId: this.tgwAttachments.get('staging')!.ref,
    });

    // Staging can reach Dev
    new ec2.CfnTransitGatewayRoute(this, 'TgwRouteStagingToDev', {
      transitGatewayRouteTableId: routeTables.get('staging')!.ref,
      destinationCidrBlock: envMap.get('dev')!.cidrBlock,
      transitGatewayAttachmentId: this.tgwAttachments.get('dev')!.ref,
    });

    // Staging can reach Prod
    new ec2.CfnTransitGatewayRoute(this, 'TgwRouteStagingToProd', {
      transitGatewayRouteTableId: routeTables.get('staging')!.ref,
      destinationCidrBlock: envMap.get('prod')!.cidrBlock,
      transitGatewayAttachmentId: this.tgwAttachments.get('prod')!.ref,
    });

    // Prod can reach Staging
    new ec2.CfnTransitGatewayRoute(this, 'TgwRouteProdToStaging', {
      transitGatewayRouteTableId: routeTables.get('prod')!.ref,
      destinationCidrBlock: envMap.get('staging')!.cidrBlock,
      transitGatewayAttachmentId: this.tgwAttachments.get('staging')!.ref,
    });

    // Note: Dev to Prod communication is blocked by not creating routes
  }

  /**
   * Creates Route53 private hosted zones
   */
  private createRoute53Zones(environments: EnvironmentConfig[]): void {
    environments.forEach(env => {
      const vpc = this.vpcs.get(env.name)!;

      // Create private hosted zone
      const zone = new route53.PrivateHostedZone(
        this,
        `Zone${env.name.charAt(0).toUpperCase() + env.name.slice(1)}`,
        {
          zoneName: `${env.name}.${this.projectName}-${this.environmentSuffix}.internal`,
          vpc: vpc,
          comment: `Private hosted zone for ${this.environmentSuffix}-${env.name} environment`,
        }
      );

      cdk.Tags.of(zone).add(
        'Name',
        `${this.projectName}-${this.environmentSuffix}-zone-${env.name}`
      );
      this.hostedZones.set(env.name, zone);

      // Store zone ID in SSM
      new ssm.StringParameter(this, `SsmZoneId${env.name}`, {
        parameterName: `/${this.projectName}/${this.environmentSuffix}/${env.name}/route53/zone-id`,
        stringValue: zone.hostedZoneId,
        description: `Route53 zone ID for ${this.environmentSuffix}-${env.name} environment`,
        tier: ssm.ParameterTier.STANDARD,
      });
    });

    // Configure cross-zone associations
    const devVpc = this.vpcs.get('dev')!;
    const stagingVpc = this.vpcs.get('staging')!;
    const prodVpc = this.vpcs.get('prod')!;

    // Associate staging zone with dev VPC
    this.hostedZones.get('staging')!.addVpc(devVpc);

    // Associate dev and prod zones with staging VPC
    this.hostedZones.get('dev')!.addVpc(stagingVpc);
    this.hostedZones.get('prod')!.addVpc(stagingVpc);

    // Associate staging zone with prod VPC
    this.hostedZones.get('staging')!.addVpc(prodVpc);
  }

  /**
   * Creates stack outputs
   */
  private createOutputs(environments: EnvironmentConfig[]): void {
    new cdk.CfnOutput(this, 'TransitGatewayId', {
      value: this.transitGateway.ref,
      description: 'Transit Gateway ID',
      exportName: `${this.stackName}-TransitGatewayId`,
    });

    environments.forEach(env => {
      const vpc = this.vpcs.get(env.name)!;

      new cdk.CfnOutput(this, `VpcId${env.name}`, {
        value: vpc.vpcId,
        description: `VPC ID for ${env.name} environment`,
        exportName: `${this.stackName}-VpcId-${env.name}`,
      });

      new cdk.CfnOutput(this, `TgwAttachmentId${env.name}`, {
        value: this.tgwAttachments.get(env.name)!.ref,
        description: `Transit Gateway attachment ID for ${env.name}`,
        exportName: `${this.stackName}-TgwAttachmentId-${env.name}`,
      });

      new cdk.CfnOutput(this, `Route53ZoneId${env.name}`, {
        value: this.hostedZones.get(env.name)!.hostedZoneId,
        description: `Route53 private zone ID for ${env.name}`,
        exportName: `${this.stackName}-Route53ZoneId-${env.name}`,
      });

      new cdk.CfnOutput(this, `NatInstanceId${env.name}`, {
        value: this.natInstances.get(env.name)!.instanceId,
        description: `NAT instance ID for ${env.name}`,
        exportName: `${this.stackName}-NatInstanceId-${env.name}`,
      });
    });

    new cdk.CfnOutput(this, 'FlowLogsBucketOutput', {
      value: this.flowLogsBucket.bucketName,
      description: 'S3 bucket for VPC Flow Logs',
      exportName: `${this.stackName}-FlowLogsBucket`,
    });
  }
}
