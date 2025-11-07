IDEAL_RESPONSE.md

# Ideal Response - Cross-Region AWS Infrastructure Migration

## bin/tap.ts

```typescript

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */

/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the TapStack with appropriate
 * configuration based on the deployment environment. It handles environment-specific settings,
 * tagging, and deployment configuration for AWS resources.
 *
 * The stack created by this module uses environment suffixes to distinguish between
 * different deployment environments (development, staging, production, etc.).
 */
import * as pulumi from '@pulumi/pulumi';
import { OutputData, TapStack } from '../lib/tap-stack';

// Initialize Pulumi configuration for the current stack.
const config = new pulumi.Config();

// Get the environment suffix from the CI, Pulumi config, defaulting to 'dev'.
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = config.get('repository') || 'unknown';
const commitAuthor = config.get('commitAuthor') || 'unknown';

// Define a set of default tags to apply to all resources.
// While not explicitly used in the TapStack instantiation here,
// this is the standard place to define them. They would typically be passed
// into the TapStack or configured on the AWS provider.
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
};

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const stack = new TapStack('pulumi-infra', {
  tags: defaultTags,
});

// Export all stack outputs for easy access
export const outputs: pulumi.Output<OutputData> = stack.outputs;

// Export individual output sections for convenience
export const transitGatewayAttachments = stack.outputs.apply(
  (o) => o.transitGatewayAttachments
);

export const vpcEndpoints = stack.outputs.apply((o) => o.vpcEndpoints);

export const vpcIds = stack.outputs.apply((o) => o.vpcIds);

export const transitGatewayIds = stack.outputs.apply((o) => o.transitGatewayIds);

export const flowLogBuckets = stack.outputs.apply((o) => o.flowLogBuckets);

export const route53HostedZones = stack.outputs.apply((o) => o.route53HostedZones);

// Export region-specific outputs for easy access
export const usEast1 = {
  vpcId: stack.outputs.apply((o) => o.vpcIds['us-east-1']),
  transitGatewayId: stack.outputs.apply((o) => o.transitGatewayIds['us-east-1']),
  transitGatewayAttachmentId: stack.outputs.apply(
    (o) => o.transitGatewayAttachments['us-east-1']
  ),
  vpcEndpoints: stack.outputs.apply((o) => o.vpcEndpoints['us-east-1']),
  flowLogBucket: stack.outputs.apply((o) => o.flowLogBuckets['us-east-1']),
  hostedZoneId: stack.outputs.apply((o) => o.route53HostedZones['us-east-1']),
};

export const euWest1 = {
  vpcId: stack.outputs.apply((o) => o.vpcIds['eu-west-1']),
  transitGatewayId: stack.outputs.apply((o) => o.transitGatewayIds['eu-west-1']),
  transitGatewayAttachmentId: stack.outputs.apply(
    (o) => o.transitGatewayAttachments['eu-west-1']
  ),
  vpcEndpoints: stack.outputs.apply((o) => o.vpcEndpoints['eu-west-1']),
  flowLogBucket: stack.outputs.apply((o) => o.flowLogBuckets['eu-west-1']),
  hostedZoneId: stack.outputs.apply((o) => o.route53HostedZones['eu-west-1']),
};

export const apSoutheast1 = {
  vpcId: stack.outputs.apply((o) => o.vpcIds['ap-southeast-1']),
  transitGatewayId: stack.outputs.apply(
    (o) => o.transitGatewayIds['ap-southeast-1']
  ),
  transitGatewayAttachmentId: stack.outputs.apply(
    (o) => o.transitGatewayAttachments['ap-southeast-1']
  ),
  vpcEndpoints: stack.outputs.apply((o) => o.vpcEndpoints['ap-southeast-1']),
  flowLogBucket: stack.outputs.apply((o) => o.flowLogBuckets['ap-southeast-1']),
  hostedZoneId: stack.outputs.apply(
    (o) => o.route53HostedZones['ap-southeast-1']
  ),
};

// Export helper methods for dynamic region access
export const getVpcId = (region: string) => stack.getVpcId(region);
export const getTransitGatewayId = (region: string) =>
  stack.getTransitGatewayId(region);
export const getHostedZoneId = (region: string) => stack.getHostedZoneId(region);

```

## lib/tap-stack.ts

```typescript

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */

/**
 * Multi-Region AWS Network Foundation Stack
 * 
 * This stack creates a comprehensive multi-region AWS infrastructure with:
 * - VPCs across 3 regions (us-east-1, eu-west-1, ap-southeast-1)
 * - Transit Gateway in each region with inter-region peering
 * - Public/Private subnets across 3 availability zones
 * - NAT Gateways for outbound internet access
 * - Route53 private hosted zones with DNSSEC
 * - Systems Manager VPC endpoints
 * - VPC Flow Logs to S3
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as random from '@pulumi/random';
import * as fs from 'fs';
import * as path from 'path';

export interface TapStackConfig {
  tags?: {
    Environment?: string;
    CostCenter?: string;
    Owner?: string;
    Repository?: string;
    Author?: string;
    [key: string]: string | undefined;
  };
}

interface RegionConfig {
  region: string;
  cidr: string;
  asn: number;
  azCount: number;
}

interface VpcResources {
  vpc: aws.ec2.Vpc;
  publicSubnets: aws.ec2.Subnet[];
  privateSubnets: aws.ec2.Subnet[];
  internetGateway: aws.ec2.InternetGateway;
  natGateways: aws.ec2.NatGateway[];
  eips: aws.ec2.Eip[];
  publicRouteTable: aws.ec2.RouteTable;
  privateRouteTables: aws.ec2.RouteTable[];
  transitGateway: aws.ec2transitgateway.TransitGateway;
  tgwAttachment: aws.ec2transitgateway.VpcAttachment;
  flowLogBucket: aws.s3.Bucket;
  flowLog: aws.ec2.FlowLog;
  flowLogRole: aws.iam.Role;
  ssmEndpoint: aws.ec2.VpcEndpoint;
  ssmMessagesEndpoint: aws.ec2.VpcEndpoint;
  ec2MessagesEndpoint: aws.ec2.VpcEndpoint;
  endpointSecurityGroup: aws.ec2.SecurityGroup;
}

export interface OutputData {
  transitGatewayAttachments: {
    [region: string]: string;
  };
  vpcEndpoints: {
    [region: string]: {
      ssm: string;
      ssmMessages: string;
      ec2Messages: string;
    };
  };
  vpcIds: {
    [region: string]: string;
  };
  transitGatewayIds: {
    [region: string]: string;
  };
  flowLogBuckets: {
    [region: string]: string;
  };
  route53HostedZones: {
    [region: string]: string;
  };
}

export class TapStack extends pulumi.ComponentResource {
  public readonly outputs: pulumi.Output<OutputData>;
  private readonly regions: RegionConfig[];
  private readonly resourceSuffix: random.RandomString;
  private readonly tags: { [key: string]: string };
  private readonly vpcResources: Map<string, VpcResources> = new Map();
  private readonly hostedZones: Map<string, aws.route53.Zone> = new Map();
  private readonly tgwPeerings: aws.ec2transitgateway.PeeringAttachment[] = [];

  constructor(
    name: string,
    config: TapStackConfig = {},
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:networking:TapStack', name, {}, opts);

    // Fix: Handle null or undefined config properly
    const safeConfig = config || {};

    // Generate 10-character random suffix
    this.resourceSuffix = new random.RandomString(
      `${name}-suffix`,
      {
        length: 10,
        special: false,
        upper: false,
      },
      { parent: this }
    );

    // Define region configurations
    this.regions = [
      {
        region: 'us-east-1',
        cidr: '10.10.0.0/16',
        asn: 64512,
        azCount: 3,
      },
      {
        region: 'eu-west-1',
        cidr: '10.20.0.0/16',
        asn: 64513,
        azCount: 3,
      },
      {
        region: 'ap-southeast-1',
        cidr: '10.30.0.0/16',
        asn: 64514,
        azCount: 3,
      },
    ];

    // Setup tags with defaults - Fix null config
    this.tags = {
      Environment: safeConfig.tags?.Environment || 'dev',
      CostCenter: safeConfig.tags?.CostCenter || 'engineering',
      Owner: safeConfig.tags?.Owner || 'platform-team',
      ManagedBy: 'pulumi',
      ...safeConfig.tags,
    };

    // Create VPC resources in each region
    this.regions.forEach((regionConfig) => {
      const resources = this.createRegionalResources(regionConfig);
      this.vpcResources.set(regionConfig.region, resources);
    });

    // Create Transit Gateway peering connections
    this.createTransitGatewayPeering();

    // Create Route53 hosted zones
    this.createRoute53HostedZones();

    // Compile and export outputs
    this.outputs = this.compileOutputs();

    // Write outputs to JSON file
    this.writeOutputsToFile();

    this.registerOutputs({
      outputs: this.outputs,
    });
  }

  private createRegionalResources(regionConfig: RegionConfig): VpcResources {
    const { region, cidr, asn, azCount } = regionConfig;
    const awsProvider = new aws.Provider(
      `provider-${region}`,
      {
        region: region,
      },
      { parent: this }
    );

    // Create VPC
    const vpcName = pulumi.interpolate`vpc-${region}-${this.resourceSuffix.result}`;
    const vpc = new aws.ec2.Vpc(
      `vpc-${region}`,
      {
        region: region,
        cidrBlock: cidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...this.tags,
          Name: vpcName,
          Region: region,
        },
      },
      { parent: this, provider: awsProvider }
    );

    // Get availability zones
    const azs = aws.getAvailabilityZonesOutput(
      {
        state: 'available',
        region: region,
      },
      { parent: this, provider: awsProvider }
    );

    // Create Internet Gateway
    const igwName = pulumi.interpolate`igw-${region}-${this.resourceSuffix.result}`;
    const internetGateway = new aws.ec2.InternetGateway(
      `igw-${region}`,
      {
        region: region,
        vpcId: vpc.id,
        tags: {
          ...this.tags,
          Name: igwName,
          Region: region,
        },
      },
      { parent: this, provider: awsProvider }
    );

    // Create public subnets
    const publicSubnets: aws.ec2.Subnet[] = [];
    const privateSubnets: aws.ec2.Subnet[] = [];

    for (let i = 0; i < azCount; i++) {
      const az = azs.apply((zones) => zones.names[i]);

      // Public subnet
      const publicSubnetCidr = this.calculateSubnetCidr(cidr, i, true);
      const publicSubnetName = pulumi.interpolate`public-subnet-${region}-${i}-${this.resourceSuffix.result}`;
      const publicSubnet = new aws.ec2.Subnet(
        `public-subnet-${region}-${i}`,
        {
          region: region,
          vpcId: vpc.id,
          cidrBlock: publicSubnetCidr,
          availabilityZone: az,
          mapPublicIpOnLaunch: true,
          tags: {
            ...this.tags,
            Name: publicSubnetName,
            Type: 'public',
            Region: region,
            AZ: az,
          },
        },
        { parent: this, provider: awsProvider }
      );
      publicSubnets.push(publicSubnet);

      // Private subnet
      const privateSubnetCidr = this.calculateSubnetCidr(cidr, i, false);
      const privateSubnetName = pulumi.interpolate`private-subnet-${region}-${i}-${this.resourceSuffix.result}`;
      const privateSubnet = new aws.ec2.Subnet(
        `private-subnet-${region}-${i}`,
        {
          region: region,
          vpcId: vpc.id,
          cidrBlock: privateSubnetCidr,
          availabilityZone: az,
          mapPublicIpOnLaunch: false,
          tags: {
            ...this.tags,
            Name: privateSubnetName,
            Type: 'private',
            Region: region,
            AZ: az,
          },
        },
        { parent: this, provider: awsProvider }
      );
      privateSubnets.push(privateSubnet);
    }

    // Create Elastic IPs and NAT Gateways
    const eips: aws.ec2.Eip[] = [];
    const natGateways: aws.ec2.NatGateway[] = [];

    for (let i = 0; i < azCount; i++) {
      const eipName = pulumi.interpolate`eip-${region}-${i}-${this.resourceSuffix.result}`;
      const eip = new aws.ec2.Eip(
        `eip-${region}-${i}`,
        {
          region: region,
          domain: 'vpc',
          tags: {
            ...this.tags,
            Name: eipName,
            Region: region,
          },
        },
        { parent: this, provider: awsProvider, dependsOn: [internetGateway] }
      );
      eips.push(eip);

      const natName = pulumi.interpolate`nat-${region}-${i}-${this.resourceSuffix.result}`;
      const natGateway = new aws.ec2.NatGateway(
        `nat-${region}-${i}`,
        {
          region: region,
          allocationId: eip.id,
          subnetId: publicSubnets[i].id,
          tags: {
            ...this.tags,
            Name: natName,
            Region: region,
          },
        },
        { parent: this, provider: awsProvider }
      );
      natGateways.push(natGateway);
    }

    // Create public route table
    const publicRtName = pulumi.interpolate`public-rt-${region}-${this.resourceSuffix.result}`;
    const publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${region}`,
      {
        region: region,
        vpcId: vpc.id,
        tags: {
          ...this.tags,
          Name: publicRtName,
          Type: 'public',
          Region: region,
        },
      },
      { parent: this, provider: awsProvider }
    );

    // Add internet gateway route to public route table
    new aws.ec2.Route(
      `public-route-${region}`,
      {
        region: region,
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: internetGateway.id,
      },
      { parent: this, provider: awsProvider }
    );

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `public-rta-${region}-${i}`,
        {
          region: region,
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this, provider: awsProvider }
      );
    });

    // Create private route tables (one per AZ)
    const privateRouteTables: aws.ec2.RouteTable[] = [];
    privateSubnets.forEach((subnet, i) => {
      const privateRtName = pulumi.interpolate`private-rt-${region}-${i}-${this.resourceSuffix.result}`;
      const privateRouteTable = new aws.ec2.RouteTable(
        `private-rt-${region}-${i}`,
        {
          region: region,
          vpcId: vpc.id,
          tags: {
            ...this.tags,
            Name: privateRtName,
            Type: 'private',
            Region: region,
          },
        },
        { parent: this, provider: awsProvider }
      );
      privateRouteTables.push(privateRouteTable);

      // Add NAT gateway route
      new aws.ec2.Route(
        `private-route-${region}-${i}`,
        {
          region: region,
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: natGateways[i].id,
        },
        { parent: this, provider: awsProvider }
      );

      // Associate private subnet
      new aws.ec2.RouteTableAssociation(
        `private-rta-${region}-${i}`,
        {
          region: region,
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this, provider: awsProvider }
      );
    });

    // Create Transit Gateway
    const tgwName = pulumi.interpolate`tgw-${region}-${this.resourceSuffix.result}`;
    const transitGateway = new aws.ec2transitgateway.TransitGateway(
      `tgw-${region}`,
      {
        region: region,
        description: `Transit Gateway for ${region}`,
        amazonSideAsn: asn,
        defaultRouteTableAssociation: 'enable',
        defaultRouteTablePropagation: 'enable',
        dnsSupport: 'enable',
        vpnEcmpSupport: 'enable',
        tags: {
          ...this.tags,
          Name: tgwName,
          Region: region,
          ASN: asn.toString(),
        },
      },
      { parent: this, provider: awsProvider }
    );

    // Create Transit Gateway VPC Attachment
    const tgwAttachmentName = pulumi.interpolate`tgw-attachment-${region}-${this.resourceSuffix.result}`;
    const tgwAttachment = new aws.ec2transitgateway.VpcAttachment(
      `tgw-attachment-${region}`,
      {
        region: region,
        transitGatewayId: transitGateway.id,
        vpcId: vpc.id,
        subnetIds: privateSubnets.map((s) => s.id),
        dnsSupport: 'enable',
        ipv6Support: 'disable',
        tags: {
          ...this.tags,
          Name: tgwAttachmentName,
          Region: region,
        },
      },
      { parent: this, provider: awsProvider }
    );

    // Create S3 bucket for VPC Flow Logs
    const flowLogBucketName = pulumi.interpolate`vpc-flow-logs-${region}-${this.resourceSuffix.result}`;
    const flowLogBucket = new aws.s3.Bucket(
      `flow-log-bucket-${region}`,
      {
        region: region,
        bucket: flowLogBucketName,
        forceDestroy: true,
        tags: {
          ...this.tags,
          Name: flowLogBucketName,
          Region: region,
          Purpose: 'vpc-flow-logs',
        },
      },
      { parent: this, provider: awsProvider }
    );

    // Enable bucket versioning - FIXED: Use BucketVersioning instead of BucketVersioningV2
    new aws.s3.BucketVersioning(
      `flow-log-bucket-versioning-${region}`,
      {
        bucket: flowLogBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this, provider: awsProvider }
    );

    // Create IAM role for VPC Flow Logs
    const flowLogRoleName = pulumi.interpolate`vpc-flow-log-role-${region}-${this.resourceSuffix.result}`;
    const flowLogRole = new aws.iam.Role(
      `flow-log-role-${region}`,
      {
        name: flowLogRoleName,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'vpc-flow-logs.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          ...this.tags,
          Name: flowLogRoleName,
          Region: region,
        },
      },
      { parent: this, provider: awsProvider }
    );

    // Attach policy to flow log role
    new aws.iam.RolePolicy(
      `flow-log-policy-${region}`,
      {
        role: flowLogRole.id,
        policy: pulumi.interpolate`{
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams"
              ],
              "Resource": "*"
            }
          ]
        }`,
      },
      { parent: this, provider: awsProvider }
    );

    // Create CloudWatch Log Group for Flow Logs
    const flowLogGroupName = pulumi.interpolate`/vpc/flow-logs/${region}-${this.resourceSuffix.result}`;
    const flowLogGroup = new aws.cloudwatch.LogGroup(
      `flow-log-group-${region}`,
      {
        name: flowLogGroupName,
        retentionInDays: 7,
        tags: {
          ...this.tags,
          Name: flowLogGroupName,
          Region: region,
        },
      },
      { parent: this, provider: awsProvider }
    );

    // Create VPC Flow Log with custom format
    const flowLog = new aws.ec2.FlowLog(
      `flow-log-${region}`,
      {
        region: region,
        vpcId: vpc.id,
        trafficType: 'ALL',
        logDestinationType: 'cloud-watch-logs',
        logDestination: flowLogGroup.arn,
        iamRoleArn: flowLogRole.arn,
        logFormat:
          '${version} ${account-id} ${interface-id} ${srcaddr} ${dstaddr} ${srcport} ${dstport} ${protocol} ${packets} ${bytes} ${start} ${end} ${action} ${log-status} ${vpc-id} ${subnet-id} ${instance-id} ${tcp-flags} ${type} ${pkt-srcaddr} ${pkt-dstaddr} ${region} ${az-id} ${sublocation-type} ${sublocation-id} ${pkt-src-aws-service} ${pkt-dst-aws-service} ${flow-direction} ${traffic-path}',
        tags: {
          ...this.tags,
          Name: pulumi.interpolate`flow-log-${region}-${this.resourceSuffix.result}`,
          Region: region,
        },
      },
      { parent: this, provider: awsProvider }
    );

    // Create Security Group for VPC Endpoints
    const endpointSgName = pulumi.interpolate`endpoint-sg-${region}-${this.resourceSuffix.result}`;
    const endpointSecurityGroup = new aws.ec2.SecurityGroup(
      `endpoint-sg-${region}`,
      {
        region: region,
        name: endpointSgName,
        description: 'Security group for VPC endpoints',
        vpcId: vpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: [cidr],
            description: 'Allow HTTPS from VPC',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: {
          ...this.tags,
          Name: endpointSgName,
          Region: region,
        },
      },
      { parent: this, provider: awsProvider }
    );

    // Create Systems Manager VPC Endpoints
    const ssmEndpointName = pulumi.interpolate`ssm-endpoint-${region}-${this.resourceSuffix.result}`;
    const ssmEndpoint = new aws.ec2.VpcEndpoint(
      `ssm-endpoint-${region}`,
      {
        region: region,
        vpcId: vpc.id,
        serviceName: `com.amazonaws.${region}.ssm`,
        vpcEndpointType: 'Interface',
        subnetIds: privateSubnets.map((s) => s.id),
        securityGroupIds: [endpointSecurityGroup.id],
        privateDnsEnabled: true,
        tags: {
          ...this.tags,
          Name: ssmEndpointName,
          Region: region,
          Service: 'ssm',
        },
      },
      { parent: this, provider: awsProvider }
    );

    const ssmMessagesEndpointName = pulumi.interpolate`ssmmessages-endpoint-${region}-${this.resourceSuffix.result}`;
    const ssmMessagesEndpoint = new aws.ec2.VpcEndpoint(
      `ssmmessages-endpoint-${region}`,
      {
        region: region,
        vpcId: vpc.id,
        serviceName: `com.amazonaws.${region}.ssmmessages`,
        vpcEndpointType: 'Interface',
        subnetIds: privateSubnets.map((s) => s.id),
        securityGroupIds: [endpointSecurityGroup.id],
        privateDnsEnabled: true,
        tags: {
          ...this.tags,
          Name: ssmMessagesEndpointName,
          Region: region,
          Service: 'ssmmessages',
        },
      },
      { parent: this, provider: awsProvider }
    );

    const ec2MessagesEndpointName = pulumi.interpolate`ec2messages-endpoint-${region}-${this.resourceSuffix.result}`;
    const ec2MessagesEndpoint = new aws.ec2.VpcEndpoint(
      `ec2messages-endpoint-${region}`,
      {
        region: region,
        vpcId: vpc.id,
        serviceName: `com.amazonaws.${region}.ec2messages`,
        vpcEndpointType: 'Interface',
        subnetIds: privateSubnets.map((s) => s.id),
        securityGroupIds: [endpointSecurityGroup.id],
        privateDnsEnabled: true,
        tags: {
          ...this.tags,
          Name: ec2MessagesEndpointName,
          Region: region,
          Service: 'ec2messages',
        },
      },
      { parent: this, provider: awsProvider }
    );

    return {
      vpc,
      publicSubnets,
      privateSubnets,
      internetGateway,
      natGateways,
      eips,
      publicRouteTable,
      privateRouteTables,
      transitGateway,
      tgwAttachment,
      flowLogBucket,
      flowLog,
      flowLogRole,
      ssmEndpoint,
      ssmMessagesEndpoint,
      ec2MessagesEndpoint,
      endpointSecurityGroup,
    };
  }

  private calculateSubnetCidr(vpcCidr: string, index: number, isPublic: boolean): string {
    const [baseIp, mask] = vpcCidr.split('/');
    const octets = baseIp.split('.').map(Number);
    
    // For public subnets: 10.X.0.0/20, 10.X.16.0/20, 10.X.32.0/20
    // For private subnets: 10.X.128.0/20, 10.X.144.0/20, 10.X.160.0/20
    const offset = isPublic ? index * 16 : 128 + index * 16;
    octets[2] = offset;
    octets[3] = 0;
    
    return `${octets.join('.')}/20`;
  }

  private createTransitGatewayPeering(): void {
    const regionPairs = [
      ['us-east-1', 'eu-west-1'],
      ['us-east-1', 'ap-southeast-1'],
      ['eu-west-1', 'ap-southeast-1'],
    ];

    regionPairs.forEach(([region1, region2]) => {
      const resources1 = this.vpcResources.get(region1)!;
      const resources2 = this.vpcResources.get(region2)!;

      const awsProvider1 = new aws.Provider(
        `peering-provider-${region1}-${region2}`,
        {
          region: region1,
        },
        { parent: this }
      );

      const awsProvider2 = new aws.Provider(
        `peering-accepter-provider-${region1}-${region2}`,
        {
          region: region2,
        },
        { parent: this }
      );

      const peeringName = pulumi.interpolate`tgw-peering-${region1}-${region2}-${this.resourceSuffix.result}`;
      const peering = new aws.ec2transitgateway.PeeringAttachment(
        `tgw-peering-${region1}-${region2}`,
        {
          region: region1,
          transitGatewayId: resources1.transitGateway.id,
          peerTransitGatewayId: resources2.transitGateway.id,
          peerRegion: region2,
          tags: {
            ...this.tags,
            Name: peeringName,
            Region1: region1,
            Region2: region2,
          },
        },
        { parent: this, provider: awsProvider1 }
      );

      // Accept peering attachment
      new aws.ec2transitgateway.PeeringAttachmentAccepter(
        `tgw-peering-accepter-${region1}-${region2}`,
        {
          region: region2,
          transitGatewayAttachmentId: peering.id,
          tags: {
            ...this.tags,
            Name: pulumi.interpolate`tgw-peering-accepter-${region1}-${region2}-${this.resourceSuffix.result}`,
            Region1: region1,
            Region2: region2,
          },
        },
        { parent: this, provider: awsProvider2 }
      );

      this.tgwPeerings.push(peering);
    });
  }

  private createRoute53HostedZones(): void {
    this.regions.forEach((regionConfig) => {
      const { region } = regionConfig;
      const resources = this.vpcResources.get(region)!;

      const awsProvider = new aws.Provider(
        `route53-provider-${region}`,
        {
          region: region,
        },
        { parent: this }
      );

      // Create private hosted zone
      const zoneName = pulumi.interpolate`${region}.internal.${this.resourceSuffix.result}.local`;
      const hostedZone = new aws.route53.Zone(
        `hosted-zone-${region}`,
        {
          name: zoneName,
          vpcs: [
            {
              vpcId: resources.vpc.id,
              vpcRegion: region,
            },
          ],
          comment: `Private hosted zone for ${region}`,
          tags: {
            ...this.tags,
            Name: zoneName,
            Region: region,
          },
        },
        { parent: this, provider: awsProvider }
      );

      // Enable DNSSEC for the VPC (Route53 Resolver DNSSEC)
      new aws.route53.ResolverDnsSecConfig(
        `dnssec-config-${region}`,
        {
          resourceId: resources.vpc.id,
        },
        { parent: this, provider: awsProvider }
      );

      this.hostedZones.set(region, hostedZone);
    });
  }

  private compileOutputs(): pulumi.Output<OutputData> {
    const transitGatewayAttachments: { [region: string]: pulumi.Output<string> } = {};
    const vpcEndpoints: {
      [region: string]: {
        ssm: pulumi.Output<string>;
        ssmMessages: pulumi.Output<string>;
        ec2Messages: pulumi.Output<string>;
      };
    } = {};
    const vpcIds: { [region: string]: pulumi.Output<string> } = {};
    const transitGatewayIds: { [region: string]: pulumi.Output<string> } = {};
    const flowLogBuckets: { [region: string]: pulumi.Output<string> } = {};
    const route53HostedZones: { [region: string]: pulumi.Output<string> } = {};

    this.regions.forEach((regionConfig) => {
      const { region } = regionConfig;
      const resources = this.vpcResources.get(region)!;
      const hostedZone = this.hostedZones.get(region)!;

      transitGatewayAttachments[region] = resources.tgwAttachment.id;
      vpcEndpoints[region] = {
        ssm: resources.ssmEndpoint.id,
        ssmMessages: resources.ssmMessagesEndpoint.id,
        ec2Messages: resources.ec2MessagesEndpoint.id,
      };
      vpcIds[region] = resources.vpc.id;
      transitGatewayIds[region] = resources.transitGateway.id;
      flowLogBuckets[region] = resources.flowLogBucket.bucket;
      route53HostedZones[region] = hostedZone.id;
    });

    return pulumi
      .all([
        pulumi.output(transitGatewayAttachments),
        pulumi.output(vpcEndpoints),
        pulumi.output(vpcIds),
        pulumi.output(transitGatewayIds),
        pulumi.output(flowLogBuckets),
        pulumi.output(route53HostedZones),
      ])
      .apply(
        ([
          tgwAttachments,
          endpoints,
          vpcs,
          tgws,
          buckets,
          zones,
        ]) => ({
          transitGatewayAttachments: Object.fromEntries(
            Object.entries(tgwAttachments).map(([k, v]) => [k, v as string])
          ),
          vpcEndpoints: Object.fromEntries(
            Object.entries(endpoints).map(([k, v]) => [
              k,
              {
                ssm: (v as any).ssm as string,
                ssmMessages: (v as any).ssmMessages as string,
                ec2Messages: (v as any).ec2Messages as string,
              },
            ])
          ),
          vpcIds: Object.fromEntries(
            Object.entries(vpcs).map(([k, v]) => [k, v as string])
          ),
          transitGatewayIds: Object.fromEntries(
            Object.entries(tgws).map(([k, v]) => [k, v as string])
          ),
          flowLogBuckets: Object.fromEntries(
            Object.entries(buckets).map(([k, v]) => [k, v as string])
          ),
          route53HostedZones: Object.fromEntries(
            Object.entries(zones).map(([k, v]) => [k, v as string])
          ),
        })
      );
  }

  private writeOutputsToFile(): void {
    this.outputs.apply((data) => {
      const outputDir = path.join(process.cwd(), 'cfn-outputs');
      const outputFile = path.join(outputDir, 'flat-outputs.json');

      // Create directory if it doesn't exist
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Write outputs to file
      fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
      console.log(`Outputs written to ${outputFile}`);
    });
  }

  public getVpcId(region: string): pulumi.Output<string> | undefined {
    const resources = this.vpcResources.get(region);
    return resources?.vpc.id;
  }

  public getTransitGatewayId(region: string): pulumi.Output<string> | undefined {
    const resources = this.vpcResources.get(region);
    return resources?.transitGateway.id;
  }

  public getHostedZoneId(region: string): pulumi.Output<string> | undefined {
    return this.hostedZones.get(region)?.id;
  }
}

```