import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as fs from "fs";
import * as path from "path";

export interface TapStackArgs {
  environmentSuffix: string;
  region?: string;
}

export interface VpcConfig {
  name: string;
  cidr: string;
  environment: string;
  hasPublicSubnets: boolean;
  azCount: number;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly hubVpc: aws.ec2.Vpc;
  public readonly productionVpc: aws.ec2.Vpc;
  public readonly developmentVpc: aws.ec2.Vpc;
  public readonly transitGateway: aws.ec2transitgateway.TransitGateway;
  public readonly flowLogsBucket: aws.s3.Bucket;
  public readonly hubZone: aws.route53.Zone;
  public readonly prodZone: aws.route53.Zone;
  public readonly devZone: aws.route53.Zone;
  public readonly outputs: pulumi.Output<any>;

  private readonly region: string;
  private readonly environmentSuffix: string;
  private readonly commonTags: Record<string, string>;
  private readonly availabilityZones: pulumi.Output<string[]>;

  constructor(
    name: string,
    args: TapStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("custom:network:TapStack", name, {}, opts);

    this.environmentSuffix = args.environmentSuffix;
    this.region = args.region || aws.config.region || "us-east-1";
    
    // Get repository and author from environment
    const repository = process.env.REPOSITORY || "tap-infrastructure";
    const commitAuthor = process.env.COMMIT_AUTHOR || "pulumi";

    // Define common tags
    this.commonTags = {
      ManagedBy: "pulumi",
      CostCenter: "network-operations",
      Repository: repository,
      Author: commitAuthor,
    };

    // Get availability zones - FIXED: Properly typed as Output
    const azData = aws.getAvailabilityZones({
      state: "available",
    });
    
    this.availabilityZones = pulumi.output(azData).apply(data => 
      data.names.slice(0, 3)
    );

    // 1. Create S3 bucket for VPC Flow Logs
    this.flowLogsBucket = this.createFlowLogsBucket();

    // 2. Create Hub VPC
    const hubConfig: VpcConfig = {
      name: "hub",
      cidr: "10.0.0.0/16",
      environment: "hub",
      hasPublicSubnets: true,
      azCount: 3,
    };
    this.hubVpc = this.createVpc(hubConfig);

    // 3. Create Production Spoke VPC
    const prodConfig: VpcConfig = {
      name: "production",
      cidr: "10.1.0.0/16",
      environment: "production",
      hasPublicSubnets: false,
      azCount: 3,
    };
    this.productionVpc = this.createVpc(prodConfig);

    // 4. Create Development Spoke VPC
    const devConfig: VpcConfig = {
      name: "development",
      cidr: "10.2.0.0/16",
      environment: "development",
      hasPublicSubnets: false,
      azCount: 3,
    };
    this.developmentVpc = this.createVpc(devConfig);

    // 5. Create Transit Gateway
    this.transitGateway = this.createTransitGateway();

    // 6. Create Transit Gateway Attachments and Route Tables
    const tgwAttachments = this.createTransitGatewayAttachments();

    // 7. Configure Transit Gateway Routing
    this.configureTransitGatewayRouting(tgwAttachments);

    // 8. Create NAT Gateways in Hub VPC
    const natGateways = this.createNatGateways();

    // 9. Configure VPC Routing
    this.configureVpcRouting(natGateways, tgwAttachments);

    // 10. Create Route53 Private Hosted Zones
    this.hubZone = this.createPrivateHostedZone("hub", this.hubVpc);
    this.prodZone = this.createPrivateHostedZone("production", this.productionVpc);
    this.devZone = this.createPrivateHostedZone("development", this.developmentVpc);

    // 11. Associate Route53 zones with connected VPCs
    this.associateHostedZones(tgwAttachments);

    // 12. Create VPC Endpoints for Systems Manager
    this.createVpcEndpoints(this.hubVpc, "hub");
    this.createVpcEndpoints(this.productionVpc, "production");
    this.createVpcEndpoints(this.developmentVpc, "development");

    // 13. Enable VPC Flow Logs
    this.enableVpcFlowLogs(this.hubVpc, "hub");
    this.enableVpcFlowLogs(this.productionVpc, "production");
    this.enableVpcFlowLogs(this.developmentVpc, "development");

    // 14. Create CloudWatch Alarms
    this.createCloudWatchAlarms(tgwAttachments);

    // 15. Export outputs
    this.outputs = this.exportOutputs(tgwAttachments, natGateways);

    this.registerOutputs({
      hubVpcId: this.hubVpc.id,
      productionVpcId: this.productionVpc.id,
      developmentVpcId: this.developmentVpc.id,
      transitGatewayId: this.transitGateway.id,
      flowLogsBucketName: this.flowLogsBucket.bucket,
    });
  }

  private createFlowLogsBucket(): aws.s3.Bucket {
    const bucket = new aws.s3.Bucket(
      `vpc-flow-logs-${this.environmentSuffix}`,
      {
        bucket: `vpc-flow-logs-${this.environmentSuffix}-${this.region}`,
        acl: "private",
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: "AES256",
            },
          },
        },
        lifecycleRules: [
          {
            id: "transition-to-glacier",
            enabled: true,
            transitions: [
              {
                days: 30,
                storageClass: "GLACIER",
              },
            ],
          },
        ],
        tags: {
          ...this.commonTags,
          Environment: this.environmentSuffix,
          Name: `vpc-flow-logs-${this.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Block all public access
    new aws.s3.BucketPublicAccessBlock(
      `vpc-flow-logs-public-access-block-${this.environmentSuffix}`,
      {
        bucket: bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    return bucket;
  }

  private createVpc(config: VpcConfig): aws.ec2.Vpc {
    const vpc = new aws.ec2.Vpc(
      `${config.name}-vpc-${this.environmentSuffix}`,
      {
        cidrBlock: config.cidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...this.commonTags,
          Environment: config.environment,
          Name: `${config.name}-vpc-${this.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create subnets
    this.createSubnets(vpc, config);

    // Create Internet Gateway for Hub VPC only
    if (config.hasPublicSubnets) {
      const igw = new aws.ec2.InternetGateway(
        `${config.name}-igw-${this.environmentSuffix}`,
        {
          vpcId: vpc.id,
          tags: {
            ...this.commonTags,
            Environment: config.environment,
            Name: `${config.name}-igw-${this.environmentSuffix}`,
          },
        },
        { parent: this }
      );
    }

    return vpc;
  }

  // FIXED: Properly typed parameters
  private createSubnets(vpc: aws.ec2.Vpc, config: VpcConfig): void {
    this.availabilityZones.apply((azs: string[]) => {
      azs.forEach((az: string, index: number) => {
        const publicCidr = this.calculateSubnetCidr(config.cidr, index * 2);
        const privateCidr = this.calculateSubnetCidr(config.cidr, index * 2 + 1);

        if (config.hasPublicSubnets) {
          // Public subnet
          new aws.ec2.Subnet(
            `${config.name}-public-subnet-${index}-${this.environmentSuffix}`,
            {
              vpcId: vpc.id,
              cidrBlock: publicCidr,
              availabilityZone: az,
              mapPublicIpOnLaunch: true,
              tags: {
                ...this.commonTags,
                Environment: config.environment,
                Name: `${config.name}-public-subnet-${index}-${this.environmentSuffix}`,
                Type: "public",
              },
            },
            { parent: this }
          );
        }

        // Private subnet
        new aws.ec2.Subnet(
          `${config.name}-private-subnet-${index}-${this.environmentSuffix}`,
          {
            vpcId: vpc.id,
            cidrBlock: config.hasPublicSubnets ? privateCidr : publicCidr,
            availabilityZone: az,
            mapPublicIpOnLaunch: false,
            tags: {
              ...this.commonTags,
              Environment: config.environment,
              Name: `${config.name}-private-subnet-${index}-${this.environmentSuffix}`,
              Type: "private",
            },
          },
          { parent: this }
        );
      });
    });
  }

  private calculateSubnetCidr(vpcCidr: string, subnetIndex: number): string {
    const [baseIp, prefixStr] = vpcCidr.split("/");
    const prefix = parseInt(prefixStr);
    const [octet1, octet2, octet3] = baseIp.split(".").map(Number);
    
    // Calculate /20 subnets (4096 IPs each) from /16 VPC
    const subnetSize = 20;
    const subnetIncrement = Math.pow(2, subnetSize - prefix);
    const newOctet3 = octet3 + (subnetIndex * subnetIncrement);
    
    return `${octet1}.${octet2}.${newOctet3}.0/${subnetSize}`;
  }

  private createTransitGateway(): aws.ec2transitgateway.TransitGateway {
    return new aws.ec2transitgateway.TransitGateway(
      `tgw-${this.environmentSuffix}`,
      {
        description: `Transit Gateway for ${this.environmentSuffix} environment`,
        defaultRouteTableAssociation: "disable",
        defaultRouteTablePropagation: "disable",
        dnsSupport: "enable",
        vpnEcmpSupport: "enable",
        tags: {
          ...this.commonTags,
          Environment: this.environmentSuffix,
          Name: `tgw-${this.environmentSuffix}`,
        },
      },
      { parent: this }
    );
  }

  private createTransitGatewayAttachments() {
    const hubAttachment = this.createTgwVpcAttachment(
      this.hubVpc,
      "hub"
    );

    const prodAttachment = this.createTgwVpcAttachment(
      this.productionVpc,
      "production"
    );

    const devAttachment = this.createTgwVpcAttachment(
      this.developmentVpc,
      "development"
    );

    return { hubAttachment, prodAttachment, devAttachment };
  }

  private createTgwVpcAttachment(
    vpc: aws.ec2.Vpc,
    name: string
  ): aws.ec2transitgateway.VpcAttachment {
    // Get private subnets for this VPC
    const subnets = aws.ec2.getSubnetsOutput({
      filters: [
        { name: "vpc-id", values: [vpc.id] },
        { name: "tag:Type", values: ["private"] },
      ],
    });

    return new aws.ec2transitgateway.VpcAttachment(
      `tgw-attachment-${name}-${this.environmentSuffix}`,
      {
        transitGatewayId: this.transitGateway.id,
        vpcId: vpc.id,
        subnetIds: subnets.ids,
        dnsSupport: "enable",
        transitGatewayDefaultRouteTableAssociation: false,
        transitGatewayDefaultRouteTablePropagation: false,
        tags: {
          ...this.commonTags,
          Environment: name,
          Name: `tgw-attachment-${name}-${this.environmentSuffix}`,
        },
      },
      { parent: this }
    );
  }

  private configureTransitGatewayRouting(attachments: any): void {
    // Create route tables for each environment
    const hubRouteTable = new aws.ec2transitgateway.RouteTable(
      `tgw-rt-hub-${this.environmentSuffix}`,
      {
        transitGatewayId: this.transitGateway.id,
        tags: {
          ...this.commonTags,
          Environment: "hub",
          Name: `tgw-rt-hub-${this.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const prodRouteTable = new aws.ec2transitgateway.RouteTable(
      `tgw-rt-production-${this.environmentSuffix}`,
      {
        transitGatewayId: this.transitGateway.id,
        tags: {
          ...this.commonTags,
          Environment: "production",
          Name: `tgw-rt-production-${this.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const devRouteTable = new aws.ec2transitgateway.RouteTable(
      `tgw-rt-development-${this.environmentSuffix}`,
      {
        transitGatewayId: this.transitGateway.id,
        tags: {
          ...this.commonTags,
          Environment: "development",
          Name: `tgw-rt-development-${this.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Associate attachments with route tables
    new aws.ec2transitgateway.RouteTableAssociation(
      `tgw-rt-assoc-hub-${this.environmentSuffix}`,
      {
        transitGatewayAttachmentId: attachments.hubAttachment.id,
        transitGatewayRouteTableId: hubRouteTable.id,
      },
      { parent: this }
    );

    new aws.ec2transitgateway.RouteTableAssociation(
      `tgw-rt-assoc-prod-${this.environmentSuffix}`,
      {
        transitGatewayAttachmentId: attachments.prodAttachment.id,
        transitGatewayRouteTableId: prodRouteTable.id,
      },
      { parent: this }
    );

    new aws.ec2transitgateway.RouteTableAssociation(
      `tgw-rt-assoc-dev-${this.environmentSuffix}`,
      {
        transitGatewayAttachmentId: attachments.devAttachment.id,
        transitGatewayRouteTableId: devRouteTable.id,
      },
      { parent: this }
    );

    // Configure routes - Hub can reach all spokes
    new aws.ec2transitgateway.Route(
      `tgw-route-hub-to-prod-${this.environmentSuffix}`,
      {
        destinationCidrBlock: "10.1.0.0/16",
        transitGatewayAttachmentId: attachments.prodAttachment.id,
        transitGatewayRouteTableId: hubRouteTable.id,
      },
      { parent: this }
    );

    new aws.ec2transitgateway.Route(
      `tgw-route-hub-to-dev-${this.environmentSuffix}`,
      {
        destinationCidrBlock: "10.2.0.0/16",
        transitGatewayAttachmentId: attachments.devAttachment.id,
        transitGatewayRouteTableId: hubRouteTable.id,
      },
      { parent: this }
    );

    // Production can only reach Hub
    new aws.ec2transitgateway.Route(
      `tgw-route-prod-to-hub-${this.environmentSuffix}`,
      {
        destinationCidrBlock: "10.0.0.0/16",
        transitGatewayAttachmentId: attachments.hubAttachment.id,
        transitGatewayRouteTableId: prodRouteTable.id,
      },
      { parent: this }
    );

    // Development can reach Hub and Production
    new aws.ec2transitgateway.Route(
      `tgw-route-dev-to-hub-${this.environmentSuffix}`,
      {
        destinationCidrBlock: "10.0.0.0/16",
        transitGatewayAttachmentId: attachments.hubAttachment.id,
        transitGatewayRouteTableId: devRouteTable.id,
      },
      { parent: this }
    );

    new aws.ec2transitgateway.Route(
      `tgw-route-dev-to-prod-${this.environmentSuffix}`,
      {
        destinationCidrBlock: "10.1.0.0/16",
        transitGatewayAttachmentId: attachments.prodAttachment.id,
        transitGatewayRouteTableId: devRouteTable.id,
      },
      { parent: this }
    );
  }

  private createNatGateways() {
    const natGateways: aws.ec2.NatGateway[] = [];
    
    // Get public subnets from Hub VPC
    const publicSubnets = aws.ec2.getSubnetsOutput({
      filters: [
        { name: "vpc-id", values: [this.hubVpc.id] },
        { name: "tag:Type", values: ["public"] },
      ],
    });

    publicSubnets.ids.apply((subnetIds: string[]) => {
      subnetIds.forEach((subnetId: string, index: number) => {
        // Allocate Elastic IP - FIXED: Use domain instead of vpc
        const eip = new aws.ec2.Eip(
          `nat-eip-${index}-${this.environmentSuffix}`,
          {
            domain: "vpc",
            tags: {
              ...this.commonTags,
              Environment: "hub",
              Name: `nat-eip-${index}-${this.environmentSuffix}`,
            },
          },
          { parent: this }
        );

        // Create NAT Gateway
        const natGw = new aws.ec2.NatGateway(
          `nat-gateway-${index}-${this.environmentSuffix}`,
          {
            subnetId: subnetId,
            allocationId: eip.id,
            tags: {
              ...this.commonTags,
              Environment: "hub",
              Name: `nat-gateway-${index}-${this.environmentSuffix}`,
            },
          },
          { parent: this }
        );

        natGateways.push(natGw);
      });
    });

    return natGateways;
  }

  private configureVpcRouting(natGateways: aws.ec2.NatGateway[], attachments: any): void {
    // Configure Hub VPC routing
    this.configureHubVpcRouting(natGateways, attachments);
    
    // Configure Spoke VPC routing
    this.configureSpokeVpcRouting(this.productionVpc, "production", attachments.prodAttachment);
    this.configureSpokeVpcRouting(this.developmentVpc, "development", attachments.devAttachment);
  }

  private configureHubVpcRouting(natGateways: aws.ec2.NatGateway[], attachments: any): void {
    // Get public and private subnets
    const publicSubnets = aws.ec2.getSubnetsOutput({
      filters: [
        { name: "vpc-id", values: [this.hubVpc.id] },
        { name: "tag:Type", values: ["public"] },
      ],
    });

    const privateSubnets = aws.ec2.getSubnetsOutput({
      filters: [
        { name: "vpc-id", values: [this.hubVpc.id] },
        { name: "tag:Type", values: ["private"] },
      ],
    });

    // Get Internet Gateway
    const igw = aws.ec2.getInternetGatewayOutput({
      filters: [{ name: "attachment.vpc-id", values: [this.hubVpc.id] }],
    });

    // Create route table for public subnets
    publicSubnets.ids.apply((subnetIds: string[]) => {
      const publicRouteTable = new aws.ec2.RouteTable(
        `hub-public-rt-${this.environmentSuffix}`,
        {
          vpcId: this.hubVpc.id,
          tags: {
            ...this.commonTags,
            Environment: "hub",
            Name: `hub-public-rt-${this.environmentSuffix}`,
          },
        },
        { parent: this }
      );

      // Add route to Internet Gateway
      new aws.ec2.Route(
        `hub-public-igw-route-${this.environmentSuffix}`,
        {
          routeTableId: publicRouteTable.id,
          destinationCidrBlock: "0.0.0.0/0",
          gatewayId: igw.internetGatewayId,
        },
        { parent: this }
      );

      // Associate with public subnets
      subnetIds.forEach((subnetId: string, index: number) => {
        new aws.ec2.RouteTableAssociation(
          `hub-public-rta-${index}-${this.environmentSuffix}`,
          {
            subnetId: subnetId,
            routeTableId: publicRouteTable.id,
          },
          { parent: this }
        );
      });
    });

    // Create route tables for private subnets (one per NAT Gateway)
    privateSubnets.ids.apply((subnetIds: string[]) => {
      subnetIds.forEach((subnetId: string, index: number) => {
        const privateRouteTable = new aws.ec2.RouteTable(
          `hub-private-rt-${index}-${this.environmentSuffix}`,
          {
            vpcId: this.hubVpc.id,
            tags: {
              ...this.commonTags,
              Environment: "hub",
              Name: `hub-private-rt-${index}-${this.environmentSuffix}`,
            },
          },
          { parent: this }
        );

        // Add route to NAT Gateway (if available)
        if (natGateways[index]) {
          new aws.ec2.Route(
            `hub-private-nat-route-${index}-${this.environmentSuffix}`,
            {
              routeTableId: privateRouteTable.id,
              destinationCidrBlock: "0.0.0.0/0",
              natGatewayId: natGateways[index].id,
            },
            { parent: this }
          );
        }

        // Routes to spoke VPCs via TGW
        new aws.ec2.Route(
          `hub-private-tgw-prod-route-${index}-${this.environmentSuffix}`,
          {
            routeTableId: privateRouteTable.id,
            destinationCidrBlock: "10.1.0.0/16",
            transitGatewayId: this.transitGateway.id,
          },
          { parent: this }
        );

        new aws.ec2.Route(
          `hub-private-tgw-dev-route-${index}-${this.environmentSuffix}`,
          {
            routeTableId: privateRouteTable.id,
            destinationCidrBlock: "10.2.0.0/16",
            transitGatewayId: this.transitGateway.id,
          },
          { parent: this }
        );

        // Associate with private subnet
        new aws.ec2.RouteTableAssociation(
          `hub-private-rta-${index}-${this.environmentSuffix}`,
          {
            subnetId: subnetId,
            routeTableId: privateRouteTable.id,
          },
          { parent: this }
        );
      });
    });
  }

  private configureSpokeVpcRouting(
    vpc: aws.ec2.Vpc,
    name: string,
    attachment: aws.ec2transitgateway.VpcAttachment
  ): void {
    const privateSubnets = aws.ec2.getSubnetsOutput({
      filters: [
        { name: "vpc-id", values: [vpc.id] },
        { name: "tag:Type", values: ["private"] },
      ],
    });

    privateSubnets.ids.apply((subnetIds: string[]) => {
      const routeTable = new aws.ec2.RouteTable(
        `${name}-private-rt-${this.environmentSuffix}`,
        {
          vpcId: vpc.id,
          tags: {
            ...this.commonTags,
            Environment: name,
            Name: `${name}-private-rt-${this.environmentSuffix}`,
          },
        },
        { parent: this }
      );

      // Default route to Transit Gateway (for internet via Hub NAT)
      new aws.ec2.Route(
        `${name}-default-route-${this.environmentSuffix}`,
        {
          routeTableId: routeTable.id,
          destinationCidrBlock: "0.0.0.0/0",
          transitGatewayId: this.transitGateway.id,
        },
        { parent: this }
      );

      // Associate with all private subnets
      subnetIds.forEach((subnetId: string, index: number) => {
        new aws.ec2.RouteTableAssociation(
          `${name}-private-rta-${index}-${this.environmentSuffix}`,
          {
            subnetId: subnetId,
            routeTableId: routeTable.id,
          },
          { parent: this }
        );
      });
    });
  }

  private createPrivateHostedZone(name: string, vpc: aws.ec2.Vpc): aws.route53.Zone {
    return new aws.route53.Zone(
      `${name}-zone-${this.environmentSuffix}`,
      {
        name: `${name}.internal`,
        vpcs: [
          {
            vpcId: vpc.id,
          },
        ],
        tags: {
          ...this.commonTags,
          Environment: name,
          Name: `${name}-zone-${this.environmentSuffix}`,
        },
      },
      { parent: this }
    );
  }

  private associateHostedZones(attachments: any): void {
    // Associate hub zone with dev and prod VPCs (they can resolve hub DNS)
    new aws.route53.ZoneAssociation(
      `hub-zone-assoc-prod-${this.environmentSuffix}`,
      {
        zoneId: this.hubZone.zoneId,
        vpcId: this.productionVpc.id,
      },
      { parent: this }
    );

    new aws.route53.ZoneAssociation(
      `hub-zone-assoc-dev-${this.environmentSuffix}`,
      {
        zoneId: this.hubZone.zoneId,
        vpcId: this.developmentVpc.id,
      },
      { parent: this }
    );

    // Associate prod zone with dev VPC (dev can resolve production DNS)
    new aws.route53.ZoneAssociation(
      `prod-zone-assoc-dev-${this.environmentSuffix}`,
      {
        zoneId: this.prodZone.zoneId,
        vpcId: this.developmentVpc.id,
      },
      { parent: this }
    );
  }

  private createVpcEndpoints(vpc: aws.ec2.Vpc, name: string): void {
    // Get private subnets
    const privateSubnets = aws.ec2.getSubnetsOutput({
      filters: [
        { name: "vpc-id", values: [vpc.id] },
        { name: "tag:Type", values: ["private"] },
      ],
    });

    // Create security group for endpoints
    const endpointSg = new aws.ec2.SecurityGroup(
      `${name}-endpoint-sg-${this.environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: `Security group for VPC endpoints in ${name} VPC`,
        ingress: [
          {
            protocol: "tcp",
            fromPort: 443,
            toPort: 443,
            cidrBlocks: [vpc.cidrBlock],
          },
        ],
        egress: [
          {
            protocol: "-1",
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"],
          },
        ],
        tags: {
          ...this.commonTags,
          Environment: name,
          Name: `${name}-endpoint-sg-${this.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Systems Manager endpoints
    const endpoints = ["ssm", "ssmmessages", "ec2messages"];
    
    endpoints.forEach((endpoint: string) => {
      new aws.ec2.VpcEndpoint(
        `${name}-${endpoint}-endpoint-${this.environmentSuffix}`,
        {
          vpcId: vpc.id,
          serviceName: `com.amazonaws.${this.region}.${endpoint}`,
          vpcEndpointType: "Interface",
          subnetIds: privateSubnets.ids,
          securityGroupIds: [endpointSg.id],
          privateDnsEnabled: true,
          tags: {
            ...this.commonTags,
            Environment: name,
            Name: `${name}-${endpoint}-endpoint-${this.environmentSuffix}`,
          },
        },
        { parent: this }
      );
    });
  }

  private enableVpcFlowLogs(vpc: aws.ec2.Vpc, name: string): void {
    // Create IAM role for Flow Logs
    const flowLogsRole = new aws.iam.Role(
      `${name}-flow-logs-role-${this.environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: {
                Service: "vpc-flow-logs.amazonaws.com",
              },
              Action: "sts:AssumeRole",
            },
          ],
        }),
        tags: {
          ...this.commonTags,
          Environment: name,
          Name: `${name}-flow-logs-role-${this.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Attach policy for S3 access
    new aws.iam.RolePolicy(
      `${name}-flow-logs-policy-${this.environmentSuffix}`,
      {
        role: flowLogsRole.id,
        policy: pulumi.all([this.flowLogsBucket.arn]).apply(([bucketArn]) =>
          JSON.stringify({
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Action: [
                  "s3:PutObject",
                  "s3:GetObject",
                  "s3:ListBucket",
                ],
                Resource: [
                  bucketArn,
                  `${bucketArn}/*`,
                ],
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Create Flow Log
    new aws.ec2.FlowLog(
      `${name}-flow-log-${this.environmentSuffix}`,
      {
        vpcId: vpc.id,
        logDestinationType: "s3",
        logDestination: this.flowLogsBucket.arn,
        trafficType: "ALL",
        tags: {
          ...this.commonTags,
          Environment: name,
          Name: `${name}-flow-log-${this.environmentSuffix}`,
        },
      },
      { parent: this }
    );
  }

  private createCloudWatchAlarms(attachments: any): void {
    const tgwAttachments = [
      { attachment: attachments.hubAttachment, name: "hub" },
      { attachment: attachments.prodAttachment, name: "production" },
      { attachment: attachments.devAttachment, name: "development" },
    ];

    tgwAttachments.forEach(({ attachment, name }) => {
      // FIXED: Use 'name' instead of 'alarmName'
      new aws.cloudwatch.MetricAlarm(
        `tgw-packet-drop-alarm-${name}-${this.environmentSuffix}`,
        {
          name: `tgw-packet-drop-${name}-${this.environmentSuffix}`,
          comparisonOperator: "GreaterThanThreshold",
          evaluationPeriods: 2,
          metricName: "PacketDropCountBlackhole",
          namespace: "AWS/TransitGateway",
          period: 300,
          statistic: "Sum",
          threshold: 100,
          alarmDescription: `Transit Gateway packet drops for ${name} attachment`,
          dimensions: {
            TransitGateway: this.transitGateway.id,
            TransitGatewayAttachment: attachment.id,
          },
          tags: {
            ...this.commonTags,
            Environment: name,
            Name: `tgw-packet-drop-alarm-${name}-${this.environmentSuffix}`,
          },
        },
        { parent: this }
      );
    });

    // Subnet IP exhaustion alarms for each VPC
    this.createSubnetIpExhaustionAlarms(this.hubVpc, "hub");
    this.createSubnetIpExhaustionAlarms(this.productionVpc, "production");
    this.createSubnetIpExhaustionAlarms(this.developmentVpc, "development");
  }

  private createSubnetIpExhaustionAlarms(vpc: aws.ec2.Vpc, name: string): void {
    const subnets = aws.ec2.getSubnetsOutput({
      filters: [{ name: "vpc-id", values: [vpc.id] }],
    });

    subnets.ids.apply((subnetIds: string[]) => {
      subnetIds.forEach((subnetId: string, index: number) => {
        // FIXED: Use 'name' instead of 'alarmName'
        new aws.cloudwatch.MetricAlarm(
          `subnet-ip-alarm-${name}-${index}-${this.environmentSuffix}`,
          {
            name: `subnet-ip-exhaustion-${name}-${index}-${this.environmentSuffix}`,
            comparisonOperator: "LessThanThreshold",
            evaluationPeriods: 1,
            metricName: "AvailableIpAddressCount",
            namespace: "AWS/EC2",
            period: 300,
            statistic: "Average",
            threshold: 819, // 20% of /20 subnet (4096 * 0.2 = 819)
            alarmDescription: `Subnet IP utilization > 80% for ${name} subnet ${index}`,
            dimensions: {
              SubnetId: subnetId,
            },
            tags: {
              ...this.commonTags,
              Environment: name,
              Name: `subnet-ip-alarm-${name}-${index}-${this.environmentSuffix}`,
            },
          },
          { parent: this }
        );
      });
    });
  }

  // FIXED: Return type changed to pulumi.Output<any>
  private exportOutputs(attachments: any, natGateways: aws.ec2.NatGateway[]): pulumi.Output<any> {
    const outputData = pulumi.all([
      this.hubVpc.id,
      this.hubVpc.cidrBlock,
      this.productionVpc.id,
      this.productionVpc.cidrBlock,
      this.developmentVpc.id,
      this.developmentVpc.cidrBlock,
      this.transitGateway.id,
      this.transitGateway.arn,
      this.flowLogsBucket.bucket,
      this.flowLogsBucket.arn,
      this.hubZone.zoneId,
      this.hubZone.name,
      this.prodZone.zoneId,
      this.prodZone.name,
      this.devZone.zoneId,
      this.devZone.name,
      attachments.hubAttachment.id,
      attachments.prodAttachment.id,
      attachments.devAttachment.id,
    ]).apply(([
      hubVpcId,
      hubVpcCidr,
      prodVpcId,
      prodVpcCidr,
      devVpcId,
      devVpcCidr,
      tgwId,
      tgwArn,
      bucketName,
      bucketArn,
      hubZoneId,
      hubZoneName,
      prodZoneId,
      prodZoneName,
      devZoneId,
      devZoneName,
      hubAttachmentId,
      prodAttachmentId,
      devAttachmentId,
    ]) => {
      const outputs = {
        hubVpcId,
        hubVpcCidr,
        productionVpcId: prodVpcId,
        productionVpcCidr: prodVpcCidr,
        developmentVpcId: devVpcId,
        developmentVpcCidr: devVpcCidr,
        transitGatewayId: tgwId,
        transitGatewayArn: tgwArn,
        flowLogsBucketName: bucketName,
        flowLogsBucketArn: bucketArn,
        hubZoneId,
        hubZoneName,
        productionZoneId: prodZoneId,
        productionZoneName: prodZoneName,
        developmentZoneId: devZoneId,
        developmentZoneName: devZoneName,
        hubAttachmentId,
        productionAttachmentId: prodAttachmentId,
        developmentAttachmentId: devAttachmentId,
        region: this.region,
        environmentSuffix: this.environmentSuffix,
      };

      // Write outputs to file
      const outputDir = path.join(process.cwd(), "cfn-outputs");
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fs.writeFileSync(
        path.join(outputDir, "flat-outputs.json"),
        JSON.stringify(outputs, null, 2)
      );

      return outputs;
    });

    return outputData;
  }
}
