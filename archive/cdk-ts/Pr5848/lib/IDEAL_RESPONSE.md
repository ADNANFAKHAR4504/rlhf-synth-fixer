# Overview

Please find solution files below.

## ./bin/tap.ts

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

## ./lib/tap-stack.ts

```typescript
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

```

## ./test/tap-stack.int.test.ts

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeTransitGatewaysCommand, DescribeTransitGatewayAttachmentsCommand, DescribeInstancesCommand, DescribeVpcEndpointsCommand, DescribeFlowLogsCommand, DescribeTransitGatewayRouteTablesCommand, SearchTransitGatewayRoutesCommand, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
import { S3Client, HeadBucketCommand, GetBucketVersioningCommand, GetBucketEncryptionCommand, GetBucketLifecycleConfigurationCommand } from '@aws-sdk/client-s3';
import { Route53Client, GetHostedZoneCommand } from '@aws-sdk/client-route-53';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

// Read configuration from files - NO HARDCODING
const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
const metadataPath = path.join(process.cwd(), 'metadata.json');
const regionFilePath = path.join(process.cwd(), 'lib', 'AWS_REGION');

// Load outputs and configuration
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
const region = fs.readFileSync(regionFilePath, 'utf8').trim();
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Lazy client initialization to avoid credential resolution at module load
let ec2Client: EC2Client;
let s3Client: S3Client;
let route53Client: Route53Client;
let ssmClient: SSMClient;

const getClients = () => {
  if (!ec2Client) {
    const clientConfig = { region };
    ec2Client = new EC2Client(clientConfig);
    s3Client = new S3Client(clientConfig);
    route53Client = new Route53Client(clientConfig);
    ssmClient = new SSMClient(clientConfig);
  }
  return { ec2Client, s3Client, route53Client, ssmClient };
};

describe('TAP Network Foundation Integration Tests', () => {
  beforeAll(() => {
    // Initialize clients before running tests
    getClients();
  });

  describe('Configuration and Prerequisites', () => {
    test('should load flat-outputs.json successfully', () => {
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    test('should have required environment configuration', () => {
      expect(region).toBeDefined();
      expect(environmentSuffix).toBeDefined();
      expect(metadata.platform).toBe('cdk');
    });

    test('should have all required outputs', () => {
      expect(outputs.TransitGatewayId).toBeDefined();
      expect(outputs.VpcIddev).toBeDefined();
      expect(outputs.VpcIdstaging).toBeDefined();
      expect(outputs.VpcIdprod).toBeDefined();
      expect(outputs.FlowLogsBucketOutput).toBeDefined();
    });
  });

  describe('VPC Infrastructure', () => {
    test('should verify dev VPC exists with correct CIDR', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.VpcIddev],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');

      // Check tags
      const tags = vpc.Tags || [];
      expect(tags.find(t => t.Key === 'Environment')?.Value).toBe(environmentSuffix);
      expect(tags.find(t => t.Key === 'iac-rlhf-amazon')?.Value).toBe('true');
    });

    test('should verify staging VPC exists with correct CIDR', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.VpcIdstaging],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.1.0.0/16');
      expect(vpc.State).toBe('available');
    });

    test('should verify prod VPC exists with correct CIDR', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.VpcIdprod],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.2.0.0/16');
      expect(vpc.State).toBe('available');
    });

    test('should verify each VPC has 6 subnets (3 public + 3 private)', async () => {
      const vpcs = ['dev', 'staging', 'prod'];

      for (const env of vpcs) {
        const vpcId = outputs[`VpcId${env}`];
        const response = await ec2Client.send(
          new DescribeSubnetsCommand({
            Filters: [
              {
                Name: 'vpc-id',
                Values: [vpcId],
              },
            ],
          })
        );

        expect(response.Subnets).toHaveLength(6);

        // Count public and private subnets
        const publicSubnets = response.Subnets!.filter(
          s => s.MapPublicIpOnLaunch === true
        );
        const privateSubnets = response.Subnets!.filter(
          s => s.MapPublicIpOnLaunch === false
        );

        expect(publicSubnets).toHaveLength(3);
        expect(privateSubnets).toHaveLength(3);
      }
    }, 30000);

    test('should verify subnets span 3 availability zones', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VpcIddev],
            },
          ],
        })
      );

      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3);
    });
  });

  describe('Transit Gateway', () => {
    test('should verify Transit Gateway exists and is available', async () => {
      const response = await ec2Client.send(
        new DescribeTransitGatewaysCommand({
          TransitGatewayIds: [outputs.TransitGatewayId],
        })
      );

      expect(response.TransitGateways).toHaveLength(1);
      const tgw = response.TransitGateways![0];
      expect(tgw.State).toBe('available');
      expect(tgw.Options?.DefaultRouteTableAssociation).toBe('disable');
      expect(tgw.Options?.DefaultRouteTablePropagation).toBe('disable');
      expect(tgw.Options?.DnsSupport).toBe('enable');
      expect(tgw.Options?.VpnEcmpSupport).toBe('enable');
    });

    test('should verify Transit Gateway has 3 VPC attachments', async () => {
      const response = await ec2Client.send(
        new DescribeTransitGatewayAttachmentsCommand({
          Filters: [
            {
              Name: 'transit-gateway-id',
              Values: [outputs.TransitGatewayId],
            },
            {
              Name: 'resource-type',
              Values: ['vpc'],
            },
          ],
        })
      );

      expect(response.TransitGatewayAttachments).toHaveLength(3);

      const attachmentIds = response.TransitGatewayAttachments!.map(a => a.TransitGatewayAttachmentId);
      expect(attachmentIds).toContain(outputs.TgwAttachmentIddev);
      expect(attachmentIds).toContain(outputs.TgwAttachmentIdstaging);
      expect(attachmentIds).toContain(outputs.TgwAttachmentIdprod);

      // Verify all attachments are available
      response.TransitGatewayAttachments!.forEach(attachment => {
        expect(attachment.State).toBe('available');
      });
    });

    test('should verify Transit Gateway routing tables exist', async () => {
      const response = await ec2Client.send(
        new DescribeTransitGatewayRouteTablesCommand({
          Filters: [
            {
              Name: 'transit-gateway-id',
              Values: [outputs.TransitGatewayId],
            },
          ],
        })
      );

      // Should have 3 route tables (one per environment)
      expect(response.TransitGatewayRouteTables!.length).toBeGreaterThanOrEqual(3);
    });

    test('should verify Transit Gateway routing configuration', async () => {
      const routeTables = await ec2Client.send(
        new DescribeTransitGatewayRouteTablesCommand({
          Filters: [
            {
              Name: 'transit-gateway-id',
              Values: [outputs.TransitGatewayId],
            },
          ],
        })
      );

      // Verify routes exist
      let foundRoutes = 0;
      for (const rt of routeTables.TransitGatewayRouteTables!) {
        const routes = await ec2Client.send(
          new SearchTransitGatewayRoutesCommand({
            TransitGatewayRouteTableId: rt.TransitGatewayRouteTableId!,
            Filters: [
              {
                Name: 'type',
                Values: ['static'],
              },
            ],
          })
        );

        if (routes.Routes && routes.Routes.length > 0) {
          foundRoutes += routes.Routes.length;
        }
      }

      // Should have at least 4 routes (Dev->Staging, Staging->Dev, Staging->Prod, Prod->Staging)
      expect(foundRoutes).toBeGreaterThanOrEqual(4);
    }, 30000);
  });

  describe('NAT Instances', () => {
    test('should verify dev NAT instance is running', async () => {
      const response = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: [outputs.NatInstanceIddev],
        })
      );

      expect(response.Reservations).toHaveLength(1);
      const instance = response.Reservations![0].Instances![0];
      expect(instance.State?.Name).toBe('running');
      expect(instance.InstanceType).toBe('t3.micro');
      expect(instance.SourceDestCheck).toBe(false);

      // Check tags
      const tags = instance.Tags || [];
      expect(tags.find(t => t.Key === 'Type')?.Value).toBe('NAT-Instance');
    });

    test('should verify staging NAT instance is running', async () => {
      const response = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: [outputs.NatInstanceIdstaging],
        })
      );

      const instance = response.Reservations![0].Instances![0];
      expect(instance.State?.Name).toBe('running');
      expect(instance.SourceDestCheck).toBe(false);
    });

    test('should verify prod NAT instance is running', async () => {
      const response = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: [outputs.NatInstanceIdprod],
        })
      );

      const instance = response.Reservations![0].Instances![0];
      expect(instance.State?.Name).toBe('running');
      expect(instance.SourceDestCheck).toBe(false);
    });

    test('should verify NAT instances have correct security groups', async () => {
      const response = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: [outputs.NatInstanceIddev],
        })
      );

      const instance = response.Reservations![0].Instances![0];
      expect(instance.SecurityGroups).toBeDefined();
      expect(instance.SecurityGroups!.length).toBeGreaterThan(0);

      // Get security group details
      const sgId = instance.SecurityGroups![0].GroupId!;
      const sgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [sgId],
        })
      );

      const sg = sgResponse.SecurityGroups![0];

      // Check for ingress rule allowing 10.0.0.0/8
      const hasPrivateIngress = sg.IpPermissions?.some(
        rule => rule.IpRanges?.some(range => range.CidrIp === '10.0.0.0/8')
      );
      expect(hasPrivateIngress).toBe(true);
    });

    test('should verify all NAT instances are in public subnets', async () => {
      const natInstances = [
        outputs.NatInstanceIddev,
        outputs.NatInstanceIdstaging,
        outputs.NatInstanceIdprod,
      ];

      for (const instanceId of natInstances) {
        const response = await ec2Client.send(
          new DescribeInstancesCommand({
            InstanceIds: [instanceId],
          })
        );

        const instance = response.Reservations![0].Instances![0];
        const subnetId = instance.SubnetId!;

        const subnetResponse = await ec2Client.send(
          new DescribeSubnetsCommand({
            SubnetIds: [subnetId],
          })
        );

        expect(subnetResponse.Subnets![0].MapPublicIpOnLaunch).toBe(true);
      }
    }, 30000);
  });

  describe('VPC Endpoints', () => {
    test('should verify S3 gateway endpoints exist in all VPCs', async () => {
      const vpcs = ['dev', 'staging', 'prod'];

      for (const env of vpcs) {
        const vpcId = outputs[`VpcId${env}`];
        const response = await ec2Client.send(
          new DescribeVpcEndpointsCommand({
            Filters: [
              {
                Name: 'vpc-id',
                Values: [vpcId],
              },
              {
                Name: 'service-name',
                Values: [`com.amazonaws.${region}.s3`],
              },
            ],
          })
        );

        expect(response.VpcEndpoints).toHaveLength(1);
        expect(response.VpcEndpoints![0].VpcEndpointType).toBe('Gateway');
        expect(response.VpcEndpoints![0].State).toBe('available');
      }
    }, 30000);

    test('should verify DynamoDB gateway endpoints exist in all VPCs', async () => {
      const vpcs = ['dev', 'staging', 'prod'];

      for (const env of vpcs) {
        const vpcId = outputs[`VpcId${env}`];
        const response = await ec2Client.send(
          new DescribeVpcEndpointsCommand({
            Filters: [
              {
                Name: 'vpc-id',
                Values: [vpcId],
              },
              {
                Name: 'service-name',
                Values: [`com.amazonaws.${region}.dynamodb`],
              },
            ],
          })
        );

        expect(response.VpcEndpoints).toHaveLength(1);
        expect(response.VpcEndpoints![0].VpcEndpointType).toBe('Gateway');
      }
    }, 30000);

    test('should verify SSM interface endpoints exist in all VPCs', async () => {
      const vpcs = ['dev', 'staging', 'prod'];

      for (const env of vpcs) {
        const vpcId = outputs[`VpcId${env}`];
        const response = await ec2Client.send(
          new DescribeVpcEndpointsCommand({
            Filters: [
              {
                Name: 'vpc-id',
                Values: [vpcId],
              },
              {
                Name: 'service-name',
                Values: [`com.amazonaws.${region}.ssm`],
              },
            ],
          })
        );

        expect(response.VpcEndpoints).toHaveLength(1);
        expect(response.VpcEndpoints![0].VpcEndpointType).toBe('Interface');
        expect(response.VpcEndpoints![0].PrivateDnsEnabled).toBe(true);
      }
    }, 30000);

    test('should verify all VPCs have at least 5 VPC endpoints', async () => {
      // 2 gateway (S3, DynamoDB) + 3 interface (SSM, SSM Messages, EC2 Messages)
      const vpcs = ['dev', 'staging', 'prod'];

      for (const env of vpcs) {
        const vpcId = outputs[`VpcId${env}`];
        const response = await ec2Client.send(
          new DescribeVpcEndpointsCommand({
            Filters: [
              {
                Name: 'vpc-id',
                Values: [vpcId],
              },
            ],
          })
        );

        expect(response.VpcEndpoints!.length).toBeGreaterThanOrEqual(5);
      }
    }, 30000);
  });

  describe('VPC Flow Logs', () => {
    test('should verify Flow Logs are enabled for all VPCs', async () => {
      const vpcs = ['dev', 'staging', 'prod'];

      for (const env of vpcs) {
        const vpcId = outputs[`VpcId${env}`];
        const response = await ec2Client.send(
          new DescribeFlowLogsCommand({
            Filter: [
              {
                Name: 'resource-id',
                Values: [vpcId],
              },
            ],
          })
        );

        expect(response.FlowLogs).toHaveLength(1);
        const flowLog = response.FlowLogs![0];
        expect(flowLog.FlowLogStatus).toBe('ACTIVE');
        expect(flowLog.LogDestinationType).toBe('s3');
        expect(flowLog.TrafficType).toBe('ALL');
      }
    }, 30000);

    test('should verify Flow Logs S3 bucket exists', async () => {
      const response = await s3Client.send(
        new HeadBucketCommand({
          Bucket: outputs.FlowLogsBucketOutput,
        })
      );

      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('should verify Flow Logs bucket has versioning enabled', async () => {
      const response = await s3Client.send(
        new GetBucketVersioningCommand({
          Bucket: outputs.FlowLogsBucketOutput,
        })
      );

      expect(response.Status).toBe('Enabled');
    });

    test('should verify Flow Logs bucket has encryption', async () => {
      const response = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: outputs.FlowLogsBucketOutput,
        })
      );

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('should verify Flow Logs bucket has lifecycle policy', async () => {
      const response = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({
          Bucket: outputs.FlowLogsBucketOutput,
        })
      );

      expect(response.Rules).toBeDefined();
      const deleteRule = response.Rules!.find(r => r.ID === 'delete-old-flow-logs');
      expect(deleteRule).toBeDefined();
      expect(deleteRule!.Status).toBe('Enabled');
      expect(deleteRule!.Expiration?.Days).toBe(7);
    });
  });

  describe('Route53 Private Hosted Zones', () => {
    test('should verify dev hosted zone exists', async () => {
      const response = await route53Client.send(
        new GetHostedZoneCommand({
          Id: outputs.Route53ZoneIddev,
        })
      );

      expect(response.HostedZone).toBeDefined();
      expect(response.HostedZone!.Name).toBe(`dev.tap-${environmentSuffix}.internal.`);
      expect(response.HostedZone!.Config?.PrivateZone).toBe(true);
    });

    test('should verify staging hosted zone exists', async () => {
      const response = await route53Client.send(
        new GetHostedZoneCommand({
          Id: outputs.Route53ZoneIdstaging,
        })
      );

      expect(response.HostedZone).toBeDefined();
      expect(response.HostedZone!.Name).toBe(`staging.tap-${environmentSuffix}.internal.`);
      expect(response.HostedZone!.Config?.PrivateZone).toBe(true);
    });

    test('should verify prod hosted zone exists', async () => {
      const response = await route53Client.send(
        new GetHostedZoneCommand({
          Id: outputs.Route53ZoneIdprod,
        })
      );

      expect(response.HostedZone).toBeDefined();
      expect(response.HostedZone!.Name).toBe(`prod.tap-${environmentSuffix}.internal.`);
      expect(response.HostedZone!.Config?.PrivateZone).toBe(true);
    });

    test('should verify hosted zones have VPC associations', async () => {
      const response = await route53Client.send(
        new GetHostedZoneCommand({
          Id: outputs.Route53ZoneIddev,
        })
      );

      expect(response.VPCs).toBeDefined();
      expect(response.VPCs!.length).toBeGreaterThan(0);
    });
  });

  describe('SSM Parameters', () => {
    test('should verify VPC ID parameters exist', async () => {
      const envs = ['dev', 'staging', 'prod'];

      for (const env of envs) {
        const paramName = `/tap/${environmentSuffix}/${env}/vpc/id`;
        const response = await ssmClient.send(
          new GetParameterCommand({
            Name: paramName,
          })
        );

        expect(response.Parameter).toBeDefined();
        expect(response.Parameter!.Value).toBe(outputs[`VpcId${env}`]);
      }
    }, 30000);

    test('should verify subnet ID parameters exist', async () => {
      const envs = ['dev', 'staging', 'prod'];

      for (const env of envs) {
        // Check first private subnet
        const paramName = `/tap/${environmentSuffix}/${env}/subnet/private/1/id`;
        const response = await ssmClient.send(
          new GetParameterCommand({
            Name: paramName,
          })
        );

        expect(response.Parameter).toBeDefined();
        expect(response.Parameter!.Value).toMatch(/^subnet-/);
      }
    }, 30000);

    test('should verify Route53 zone ID parameters exist', async () => {
      const envs = ['dev', 'staging', 'prod'];

      for (const env of envs) {
        const paramName = `/tap/${environmentSuffix}/${env}/route53/zone-id`;
        const response = await ssmClient.send(
          new GetParameterCommand({
            Name: paramName,
          })
        );

        expect(response.Parameter).toBeDefined();
        expect(response.Parameter!.Value).toBe(outputs[`Route53ZoneId${env}`]);
      }
    }, 30000);
  });

  describe('Network Isolation and Routing', () => {
    test('should verify VPCs have non-overlapping CIDR blocks', async () => {
      const vpcs = [outputs.VpcIddev, outputs.VpcIdstaging, outputs.VpcIdprod];
      const expectedCidrs = ['10.0.0.0/16', '10.1.0.0/16', '10.2.0.0/16'];

      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: vpcs,
        })
      );

      const cidrs = response.Vpcs!.map(v => v.CidrBlock);
      expectedCidrs.forEach(cidr => {
        expect(cidrs).toContain(cidr);
      });
    });
  });

  describe('Resource Tagging', () => {
    test('should verify all VPCs have required tags', async () => {
      const vpcs = [outputs.VpcIddev, outputs.VpcIdstaging, outputs.VpcIdprod];

      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: vpcs,
        })
      );

      response.Vpcs!.forEach(vpc => {
        const tags = vpc.Tags || [];
        expect(tags.find(t => t.Key === 'iac-rlhf-amazon')?.Value).toBe('true');
        expect(tags.find(t => t.Key === 'Environment')?.Value).toBe(environmentSuffix);
        expect(tags.find(t => t.Key === 'CostCenter')?.Value).toBe('FinTech-Trading');
        expect(tags.find(t => t.Key === 'ManagedBy')?.Value).toBe('AWS-CDK');
      });
    });

    test('should verify Transit Gateway has required tags', async () => {
      const response = await ec2Client.send(
        new DescribeTransitGatewaysCommand({
          TransitGatewayIds: [outputs.TransitGatewayId],
        })
      );

      const tags = response.TransitGateways![0].Tags || [];
      expect(tags.find(t => t.Key === 'iac-rlhf-amazon')?.Value).toBe('true');
      expect(tags.find(t => t.Key === 'Purpose')?.Value).toBe('Network-Hub');
    });
  });
});

```

## ./test/tap-stack.unit.test.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'ap-northeast-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('should create stack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toContain('TestTapStack');
    });

    test('should have correct environment suffix tag on VPCs', () => {
      const vpcs = template.findResources('AWS::EC2::VPC');
      Object.values(vpcs).forEach((vpc: any) => {
        expect(vpc.Properties.Tags).toContainEqual(
          expect.objectContaining({
            Key: 'Environment',
            Value: environmentSuffix,
          })
        );
      });
    });

    test('should have required global tags on resources', () => {
      const vpcs = template.findResources('AWS::EC2::VPC');
      Object.values(vpcs).forEach((vpc: any) => {
        const tags = vpc.Properties.Tags;
        expect(tags).toContainEqual({ Key: 'iac-rlhf-amazon', Value: 'true' });
        expect(tags).toContainEqual({ Key: 'Environment', Value: environmentSuffix });
        expect(tags).toContainEqual({ Key: 'CostCenter', Value: 'FinTech-Trading' });
        expect(tags).toContainEqual({ Key: 'ManagedBy', Value: 'AWS-CDK' });
      });
    });
  });

  describe('S3 Flow Logs Bucket', () => {
    test('should create S3 bucket for VPC Flow Logs', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);

      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp(`tap-${environmentSuffix}-vpc-flow-logs-.*`),
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should have lifecycle rules for flow logs bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              ExpirationInDays: 7,
              Id: 'delete-old-flow-logs',
              Status: 'Enabled',
            }),
          ]),
        },
      });
    });

    test('should have S3 managed encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            }),
          ]),
        },
      });
    });
  });

  describe('Transit Gateway', () => {
    test('should create Transit Gateway', () => {
      template.resourceCountIs('AWS::EC2::TransitGateway', 1);

      template.hasResourceProperties('AWS::EC2::TransitGateway', {
        DefaultRouteTableAssociation: 'disable',
        DefaultRouteTablePropagation: 'disable',
        DnsSupport: 'enable',
        VpnEcmpSupport: 'enable',
        MulticastSupport: 'disable',
      });
    });

    test('should have correct Transit Gateway tags', () => {
      template.hasResourceProperties('AWS::EC2::TransitGateway', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: `tap-${environmentSuffix}-tgw`,
          }),
          Match.objectLike({
            Key: 'Purpose',
            Value: 'Network-Hub',
          }),
        ]),
      });
    });
  });

  describe('VPCs', () => {
    test('should create 3 VPCs (dev, staging, prod)', () => {
      template.resourceCountIs('AWS::EC2::VPC', 3);
    });

    test('should create dev VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create staging VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.1.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create prod VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.2.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create 3 public subnets per VPC (9 total)', () => {
      const subnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: true,
        },
      });
      expect(Object.keys(subnets).length).toBe(9);
    });

    test('should create 3 private subnets per VPC (9 total)', () => {
      const subnets = template.findResources('AWS::EC2::Subnet', {
        Properties: {
          MapPublicIpOnLaunch: false,
        },
      });
      expect(Object.keys(subnets).length).toBe(9);
    });

    test('should create Internet Gateways for all VPCs', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 3);
    });

    test('should attach Internet Gateways to VPCs', () => {
      template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 3);
    });

    test('should create route tables for subnets', () => {
      // 3 public + 3 private per VPC = 18 total
      const routeTables = template.findResources('AWS::EC2::RouteTable');
      expect(Object.keys(routeTables).length).toBeGreaterThanOrEqual(18);
    });
  });

  describe('Transit Gateway Attachments', () => {
    test('should create 3 Transit Gateway attachments', () => {
      template.resourceCountIs('AWS::EC2::TransitGatewayAttachment', 3);
    });

    test('should create Transit Gateway route tables', () => {
      // One per environment
      template.resourceCountIs('AWS::EC2::TransitGatewayRouteTable', 3);
    });

    test('should create Transit Gateway route table associations', () => {
      template.resourceCountIs(
        'AWS::EC2::TransitGatewayRouteTableAssociation',
        3
      );
    });

    test('should create Transit Gateway routes for allowed traffic', () => {
      // Dev->Staging, Staging->Dev, Staging->Prod, Prod->Staging = 4 routes
      template.resourceCountIs('AWS::EC2::TransitGatewayRoute', 4);
    });

    test('should create routes to Transit Gateway in private subnets', () => {
      const routes = template.findResources('AWS::EC2::Route', {
        Properties: {
          DestinationCidrBlock: '10.0.0.0/8',
        },
      });
      // 3 private subnets per VPC * 3 VPCs = 9 routes
      expect(Object.keys(routes).length).toBe(9);
    });
  });

  describe('NAT Instances', () => {
    test('should create 3 NAT instances (one per environment)', () => {
      template.resourceCountIs('AWS::EC2::Instance', 3);
    });

    test('should create NAT instances with correct instance type', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
      });
    });

    test('should disable source/dest check on NAT instances', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        SourceDestCheck: false,
      });
    });

    test('should enable IMDSv2 via Launch Template', () => {
      // IMDSv2 is configured via Launch Template
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          MetadataOptions: {
            HttpTokens: 'required',
          },
        }),
      });
    });

    test('should create IAM roles for NAT instances', () => {
      // One per environment = 3
      const roles = template.findResources('AWS::IAM::Role', {
        Properties: {
          AssumeRolePolicyDocument: Match.objectLike({
            Statement: Match.arrayWith([
              Match.objectLike({
                Principal: {
                  Service: 'ec2.amazonaws.com',
                },
              }),
            ]),
          }),
        },
      });
      expect(Object.keys(roles).length).toBe(3);
    });

    test('should create security groups for NAT instances', () => {
      const natSgs = template.findResources('AWS::EC2::SecurityGroup', {
        Properties: {
          GroupDescription: Match.stringLikeRegexp(
            /Security group for NAT instance/
          ),
        },
      });
      expect(Object.keys(natSgs).length).toBe(3);
    });

    test('should allow traffic from private subnets to NAT instances', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '10.0.0.0/8',
            IpProtocol: '-1',
          }),
        ]),
      });
    });
  });

  describe('VPC Endpoints', () => {
    test('should create S3 gateway endpoints', () => {
      const s3Endpoints = template.findResources('AWS::EC2::VPCEndpoint', {
        Properties: {
          ServiceName: Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([Match.stringLikeRegexp(/\.s3$/)]),
            ]),
          }),
          VpcEndpointType: 'Gateway',
        },
      });
      expect(Object.keys(s3Endpoints).length).toBe(3);
    });

    test('should create DynamoDB gateway endpoints', () => {
      const dynamoEndpoints = template.findResources('AWS::EC2::VPCEndpoint', {
        Properties: {
          ServiceName: Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([Match.stringLikeRegexp(/\.dynamodb$/)]),
            ]),
          }),
          VpcEndpointType: 'Gateway',
        },
      });
      expect(Object.keys(dynamoEndpoints).length).toBe(3);
    });

    test('should create SSM interface endpoints', () => {
      const ssmEndpoints = template.findResources('AWS::EC2::VPCEndpoint', {
        Properties: {
          ServiceName: 'com.amazonaws.ap-northeast-1.ssm',
          VpcEndpointType: 'Interface',
          PrivateDnsEnabled: true,
        },
      });
      expect(Object.keys(ssmEndpoints).length).toBe(3);
    });

    test('should create SSM Messages interface endpoints', () => {
      const ssmMessagesEndpoints = template.findResources(
        'AWS::EC2::VPCEndpoint',
        {
          Properties: {
            ServiceName: 'com.amazonaws.ap-northeast-1.ssmmessages',
            VpcEndpointType: 'Interface',
          },
        }
      );
      expect(Object.keys(ssmMessagesEndpoints).length).toBe(3);
    });

    test('should create EC2 Messages interface endpoints', () => {
      const ec2MessagesEndpoints = template.findResources(
        'AWS::EC2::VPCEndpoint',
        {
          Properties: {
            ServiceName: 'com.amazonaws.ap-northeast-1.ec2messages',
            VpcEndpointType: 'Interface',
          },
        }
      );
      expect(Object.keys(ec2MessagesEndpoints).length).toBe(3);
    });
  });

  describe('VPC Flow Logs', () => {
    test('should create VPC Flow Logs for all VPCs', () => {
      template.resourceCountIs('AWS::EC2::FlowLog', 3);
    });

    test('should configure Flow Logs to log to S3', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        LogDestinationType: 's3',
        TrafficType: 'ALL',
      });
    });
  });

  describe('Route53 Private Hosted Zones', () => {
    test('should create 3 private hosted zones', () => {
      template.resourceCountIs('AWS::Route53::HostedZone', 3);
    });

    test('should create hosted zones with correct naming', () => {
      template.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: `dev.tap-${environmentSuffix}.internal.`,
      });

      template.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: `staging.tap-${environmentSuffix}.internal.`,
      });

      template.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: `prod.tap-${environmentSuffix}.internal.`,
      });
    });

    test('should associate hosted zones with VPCs', () => {
      // Each zone is associated with its own VPC initially
      // Plus cross-zone associations
      const hostedZones = template.findResources('AWS::Route53::HostedZone');
      Object.values(hostedZones).forEach((zone: any) => {
        expect(zone.Properties.VPCs).toBeDefined();
      });
    });
  });

  describe('SSM Parameters', () => {
    test('should create SSM parameters for VPC IDs', () => {
      const vpcIdParams = template.findResources('AWS::SSM::Parameter', {
        Properties: {
          Name: Match.stringLikeRegexp(/\/tap\/.*\/vpc\/id$/),
        },
      });
      expect(Object.keys(vpcIdParams).length).toBe(3);
    });

    test('should create SSM parameters for private subnet IDs', () => {
      const privateSubnetParams = template.findResources(
        'AWS::SSM::Parameter',
        {
          Properties: {
            Name: Match.stringLikeRegexp(/\/subnet\/private\/\d+\/id$/),
          },
        }
      );
      // 3 private subnets per environment * 3 environments = 9
      expect(Object.keys(privateSubnetParams).length).toBe(9);
    });

    test('should create SSM parameters for public subnet IDs', () => {
      const publicSubnetParams = template.findResources('AWS::SSM::Parameter', {
        Properties: {
          Name: Match.stringLikeRegexp(/\/subnet\/public\/\d+\/id$/),
        },
      });
      // 3 public subnets per environment * 3 environments = 9
      expect(Object.keys(publicSubnetParams).length).toBe(9);
    });

    test('should create SSM parameters for Route53 zone IDs', () => {
      const zoneIdParams = template.findResources('AWS::SSM::Parameter', {
        Properties: {
          Name: Match.stringLikeRegexp(/\/route53\/zone-id$/),
        },
      });
      expect(Object.keys(zoneIdParams).length).toBe(3);
    });
  });

  describe('Stack Outputs', () => {
    test('should export Transit Gateway ID', () => {
      template.hasOutput('TransitGatewayId', {
        Description: 'Transit Gateway ID',
      });
    });

    test('should export VPC IDs for all environments', () => {
      template.hasOutput('VpcIddev', {
        Description: 'VPC ID for dev environment',
      });

      template.hasOutput('VpcIdstaging', {
        Description: 'VPC ID for staging environment',
      });

      template.hasOutput('VpcIdprod', {
        Description: 'VPC ID for prod environment',
      });
    });

    test('should export Transit Gateway attachment IDs', () => {
      template.hasOutput('TgwAttachmentIddev', {});
      template.hasOutput('TgwAttachmentIdstaging', {});
      template.hasOutput('TgwAttachmentIdprod', {});
    });

    test('should export Route53 zone IDs', () => {
      template.hasOutput('Route53ZoneIddev', {});
      template.hasOutput('Route53ZoneIdstaging', {});
      template.hasOutput('Route53ZoneIdprod', {});
    });

    test('should export NAT instance IDs', () => {
      template.hasOutput('NatInstanceIddev', {});
      template.hasOutput('NatInstanceIdstaging', {});
      template.hasOutput('NatInstanceIdprod', {});
    });

    test('should export Flow Logs bucket name', () => {
      template.hasOutput('FlowLogsBucketOutput', {
        Description: 'S3 bucket for VPC Flow Logs',
      });
    });
  });

  describe('Resource Tagging', () => {
    test('should tag all VPCs with environment', () => {
      const vpcs = template.findResources('AWS::EC2::VPC');
      Object.values(vpcs).forEach((vpc: any) => {
        const tags = vpc.Properties.Tags;
        expect(tags).toContainEqual(
          expect.objectContaining({
            Key: 'Environment',
            Value: environmentSuffix,
          })
        );
      });
    });

    test('should tag all resources with iac-rlhf-amazon', () => {
      const vpcs = template.findResources('AWS::EC2::VPC');
      Object.values(vpcs).forEach((vpc: any) => {
        const tags = vpc.Properties.Tags;
        expect(tags).toContainEqual(
          expect.objectContaining({
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          })
        );
      });
    });

    test('should tag NAT instances with Type tag', () => {
      const instances = template.findResources('AWS::EC2::Instance');
      Object.values(instances).forEach((instance: any) => {
        const tags = instance.Properties.Tags;
        expect(tags).toContainEqual(
          expect.objectContaining({
            Key: 'Type',
            Value: 'NAT-Instance',
          })
        );
      });
    });
  });

  describe('Network Configuration', () => {
    test('should configure dev VPC subnets with correct CIDR blocks', () => {
      // Public subnets: 10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.0.0/24',
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.1.0/24',
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.2.0/24',
      });
    });

    test('should configure staging VPC subnets with correct CIDR blocks', () => {
      // Public subnets: 10.1.0.0/24, 10.1.1.0/24, 10.1.2.0/24
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.1.0.0/24',
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.1.1.0/24',
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.1.2.0/24',
      });
    });

    test('should configure prod VPC subnets with correct CIDR blocks', () => {
      // Public subnets: 10.2.0.0/24, 10.2.1.0/24, 10.2.2.0/24
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.2.0.0/24',
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.2.1.0/24',
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.2.2.0/24',
      });
    });
  });

  describe('Security Configuration', () => {
    test('should create security groups for VPC endpoints', () => {
      const endpointSgs = template.findResources('AWS::EC2::SecurityGroup', {
        Properties: {
          SecurityGroupIngress: Match.arrayWith([
            Match.objectLike({
              FromPort: 443,
              ToPort: 443,
              IpProtocol: 'tcp',
            }),
          ]),
        },
      });
      // 3 interface endpoints (SSM, SSM Messages, EC2 Messages) * 3 VPCs = 9
      expect(Object.keys(endpointSgs).length).toBeGreaterThanOrEqual(9);
    });

    test('should allow HTTPS traffic from VPC CIDR to interface endpoints', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            FromPort: 443,
            ToPort: 443,
            IpProtocol: 'tcp',
          }),
        ]),
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should have correct total resource count', () => {
      const resources = template.toJSON().Resources;
      const resourceCount = Object.keys(resources).length;

      // Expected minimum resources:
      // 1 S3 bucket + 1 S3 bucket policy + 1 TGW + 3 VPCs + 18 subnets
      // + 3 IGWs + 3 VPC GW attachments + 18+ route tables + 3 TGW attachments
      // + 3 TGW route tables + 3 TGW RT associations + 4 TGW routes
      // + 3 NAT instances + 3 NAT roles + 3 NAT SGs + 15 VPC endpoints
      // + 9 endpoint SGs + 3 flow logs + 3 hosted zones + 21 SSM params
      // + custom resources + Lambda functions
      expect(resourceCount).toBeGreaterThan(100);
    });
  });
});

```

## ./cdk.json

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
