### Reasoning Trace
---

This is a complex multi-region AWS infrastructure request using Pulumi TypeScript. Let me break down what needs to be implemented:

1. **Multi-Region VPC Setup**: Three regions (us-east-1, eu-west-1, ap-southeast-1) with specific CIDR blocks
2. **Subnet Architecture**: Each VPC needs 3 AZs with both public and private subnets
3. **Transit Gateway**: Hub-and-spoke topology with Transit Gateway in each region and peering connections
4. **DNS**: Route53 private hosted zones with DNSSEC
5. **VPC Endpoints**: Systems Manager endpoints (ssm, ssmmessages, ec2messages)
6. **Monitoring**: VPC Flow Logs to S3 buckets
7. **Resource Naming**: 10-character random suffix for all resources
8. **Tagging**: Consistent tags on all resources

Let me structure the solution:

### lib/tap-stack.ts
- Main stack implementation
- Regional configuration data structure
- VPC and subnet creation logic
- Transit Gateway setup and peering
- Route53 and DNSSEC configuration
- VPC endpoints for Systems Manager
- Flow logs and S3 buckets
- Proper exports

### tests/tap-stack.unit.test.ts
- Unit tests for CIDR calculations
- Subnet allocation logic tests
- ASN uniqueness validation
- Resource naming tests
- Tag application tests

### tests/tap-stack.int.test.ts
- Integration tests for actual resource creation
- Cross-region connectivity tests
- Endpoint accessibility tests

Let me write the code now:
### Answer 
---

I'll help you build a production-grade, multi-region AWS infrastructure using Pulumi TypeScript. This implementation creates a hub-and-spoke network topology across three AWS regions with secure, low-latency cross-region connectivity.

## lib/tap-stack.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as random from "@pulumi/random";

// Configuration interfaces
interface RegionConfig {
    region: string;
    vpcCidr: string;
    bgpAsn: number;
    publicSubnets: string[];
    privateSubnets: string[];
}

interface VpcResources {
    vpc: aws.ec2.Vpc;
    internetGateway: aws.ec2.InternetGateway;
    publicSubnets: aws.ec2.Subnet[];
    privateSubnets: aws.ec2.Subnet[];
    natGateways: aws.ec2.NatGateway[];
    publicRouteTable: aws.ec2.RouteTable;
    privateRouteTables: aws.ec2.RouteTable[];
}

interface TransitGatewayResources {
    transitGateway: aws.ec2transitgateway.TransitGateway;
    vpcAttachment: aws.ec2transitgateway.VpcAttachment;
    routeTable: aws.ec2transitgateway.RouteTable;
}

export class TapStack extends pulumi.ComponentResource {
    public transitGatewayIds: { [region: string]: pulumi.Output<string> } = {};
    public transitGatewayAttachmentIds: { [region: string]: pulumi.Output<string> } = {};
    public vpcEndpointUrls: { [region: string]: { [service: string]: pulumi.Output<string> } } = {};
    public route53ZoneIds: { [region: string]: pulumi.Output<string> } = {};
    public flowLogBuckets: { [region: string]: pulumi.Output<string> } = {};

    constructor(name: string, opts?: pulumi.ComponentResourceOptions) {
        super("custom:infrastructure:TapStack", name, {}, opts);

        // Generate random suffix for resource naming
        const randomSuffix = new random.RandomString("resource-suffix", {
            length: 10,
            special: false,
            upper: false,
        }, { parent: this });

        // Define regional configurations
        const regionConfigs: RegionConfig[] = [
            {
                region: "us-east-1",
                vpcCidr: "10.10.0.0/16",
                bgpAsn: 64512,
                publicSubnets: ["10.10.0.0/24", "10.10.1.0/24", "10.10.2.0/24"],
                privateSubnets: ["10.10.16.0/20", "10.10.32.0/20", "10.10.48.0/20"],
            },
            {
                region: "eu-west-1",
                vpcCidr: "10.20.0.0/16",
                bgpAsn: 64513,
                publicSubnets: ["10.20.0.0/24", "10.20.1.0/24", "10.20.2.0/24"],
                privateSubnets: ["10.20.16.0/20", "10.20.32.0/20", "10.20.48.0/20"],
            },
            {
                region: "ap-southeast-1",
                vpcCidr: "10.30.0.0/16",
                bgpAsn: 64514,
                publicSubnets: ["10.30.0.0/24", "10.30.1.0/24", "10.30.2.0/24"],
                privateSubnets: ["10.30.16.0/20", "10.30.32.0/20", "10.30.48.0/20"],
            },
        ];

        // Standard tags for all resources
        const standardTags = {
            Environment: "production",
            CostCenter: "trading-platform",
            Owner: "infrastructure-team",
        };

        // Store resources by region
        const vpcResources: { [region: string]: VpcResources } = {};
        const transitGatewayResources: { [region: string]: TransitGatewayResources } = {};

        // Create infrastructure in each region
        for (const config of regionConfigs) {
            const provider = new aws.Provider(`provider-${config.region}`, {
                region: config.region as aws.Region,
            }, { parent: this });

            // Get availability zones for the region
            const azs = aws.getAvailabilityZones({
                state: "available",
            }, { provider });

            // Create VPC
            const vpc = new aws.ec2.Vpc(`${config.region}-vpc-${randomSuffix.result}`, {
                cidrBlock: config.vpcCidr,
                enableDnsHostnames: true,
                enableDnsSupport: true,
                tags: {
                    ...standardTags,
                    Name: `${config.region}-vpc-${randomSuffix.result}`,
                },
            }, { provider, parent: this });

            // Create Internet Gateway
            const igw = new aws.ec2.InternetGateway(`${config.region}-igw-${randomSuffix.result}`, {
                vpcId: vpc.id,
                tags: {
                    ...standardTags,
                    Name: `${config.region}-igw-${randomSuffix.result}`,
                },
            }, { provider, parent: this });

            // Create public subnets
            const publicSubnets: aws.ec2.Subnet[] = [];
            const natGateways: aws.ec2.NatGateway[] = [];
            
            for (let i = 0; i < 3; i++) {
                const publicSubnet = new aws.ec2.Subnet(`${config.region}-public-subnet-${i}-${randomSuffix.result}`, {
                    vpcId: vpc.id,
                    cidrBlock: config.publicSubnets[i],
                    availabilityZone: azs.then(azs => azs.names[i]),
                    mapPublicIpOnLaunch: true,
                    tags: {
                        ...standardTags,
                        Name: `${config.region}-public-subnet-${i}-${randomSuffix.result}`,
                        Type: "public",
                    },
                }, { provider, parent: this });
                publicSubnets.push(publicSubnet);

                // Create EIP for NAT Gateway
                const eip = new aws.ec2.Eip(`${config.region}-nat-eip-${i}-${randomSuffix.result}`, {
                    domain: "vpc",
                    tags: {
                        ...standardTags,
                        Name: `${config.region}-nat-eip-${i}-${randomSuffix.result}`,
                    },
                }, { provider, parent: this });

                // Create NAT Gateway
                const natGateway = new aws.ec2.NatGateway(`${config.region}-nat-${i}-${randomSuffix.result}`, {
                    subnetId: publicSubnet.id,
                    allocationId: eip.id,
                    tags: {
                        ...standardTags,
                        Name: `${config.region}-nat-${i}-${randomSuffix.result}`,
                    },
                }, { provider, parent: this, dependsOn: [publicSubnet] });
                natGateways.push(natGateway);
            }

            // Create public route table
            const publicRouteTable = new aws.ec2.RouteTable(`${config.region}-public-rt-${randomSuffix.result}`, {
                vpcId: vpc.id,
                tags: {
                    ...standardTags,
                    Name: `${config.region}-public-rt-${randomSuffix.result}`,
                },
            }, { provider, parent: this });

            // Add internet route to public route table
            new aws.ec2.Route(`${config.region}-public-route-${randomSuffix.result}`, {
                routeTableId: publicRouteTable.id,
                destinationCidrBlock: "0.0.0.0/0",
                gatewayId: igw.id,
            }, { provider, parent: this });

            // Associate public subnets with public route table
            publicSubnets.forEach((subnet, index) => {
                new aws.ec2.RouteTableAssociation(`${config.region}-public-rta-${index}-${randomSuffix.result}`, {
                    subnetId: subnet.id,
                    routeTableId: publicRouteTable.id,
                }, { provider, parent: this });
            });

            // Create private subnets and route tables
            const privateSubnets: aws.ec2.Subnet[] = [];
            const privateRouteTables: aws.ec2.RouteTable[] = [];

            for (let i = 0; i < 3; i++) {
                const privateSubnet = new aws.ec2.Subnet(`${config.region}-private-subnet-${i}-${randomSuffix.result}`, {
                    vpcId: vpc.id,
                    cidrBlock: config.privateSubnets[i],
                    availabilityZone: azs.then(azs => azs.names[i]),
                    tags: {
                        ...standardTags,
                        Name: `${config.region}-private-subnet-${i}-${randomSuffix.result}`,
                        Type: "private",
                    },
                }, { provider, parent: this });
                privateSubnets.push(privateSubnet);

                // Create private route table for each AZ
                const privateRouteTable = new aws.ec2.RouteTable(`${config.region}-private-rt-${i}-${randomSuffix.result}`, {
                    vpcId: vpc.id,
                    tags: {
                        ...standardTags,
                        Name: `${config.region}-private-rt-${i}-${randomSuffix.result}`,
                    },
                }, { provider, parent: this });
                privateRouteTables.push(privateRouteTable);

                // Add NAT Gateway route to private route table
                new aws.ec2.Route(`${config.region}-private-route-${i}-${randomSuffix.result}`, {
                    routeTableId: privateRouteTable.id,
                    destinationCidrBlock: "0.0.0.0/0",
                    natGatewayId: natGateways[i].id,
                }, { provider, parent: this });

                // Associate private subnet with route table
                new aws.ec2.RouteTableAssociation(`${config.region}-private-rta-${i}-${randomSuffix.result}`, {
                    subnetId: privateSubnet.id,
                    routeTableId: privateRouteTable.id,
                }, { provider, parent: this });
            }

            // Store VPC resources
            vpcResources[config.region] = {
                vpc,
                internetGateway: igw,
                publicSubnets,
                privateSubnets,
                natGateways,
                publicRouteTable,
                privateRouteTables,
            };

            // Create Transit Gateway
            const transitGateway = new aws.ec2transitgateway.TransitGateway(`${config.region}-tgw-${randomSuffix.result}`, {
                amazonSideAsn: config.bgpAsn,
                description: `Transit Gateway for ${config.region}`,
                defaultRouteTableAssociation: "enable",
                defaultRouteTablePropagation: "enable",
                dnsSupport: "enable",
                vpnEcmpSupport: "enable",
                tags: {
                    ...standardTags,
                    Name: `${config.region}-tgw-${randomSuffix.result}`,
                },
            }, { provider, parent: this });

            // Create Transit Gateway VPC Attachment
            const tgwAttachment = new aws.ec2transitgateway.VpcAttachment(`${config.region}-tgw-attachment-${randomSuffix.result}`, {
                transitGatewayId: transitGateway.id,
                vpcId: vpc.id,
                subnetIds: privateSubnets.map(subnet => subnet.id),
                dnsSupport: "enable",
                ipv6Support: "disable",
                tags: {
                    ...standardTags,
                    Name: `${config.region}-tgw-attachment-${randomSuffix.result}`,
                },
            }, { provider, parent: this });

            // Create Transit Gateway Route Table
            const tgwRouteTable = new aws.ec2transitgateway.RouteTable(`${config.region}-tgw-rt-${randomSuffix.result}`, {
                transitGatewayId: transitGateway.id,
                tags: {
                    ...standardTags,
                    Name: `${config.region}-tgw-rt-${randomSuffix.result}`,
                },
            }, { provider, parent: this });

            // Store Transit Gateway resources
            transitGatewayResources[config.region] = {
                transitGateway,
                vpcAttachment: tgwAttachment,
                routeTable: tgwRouteTable,
            };

            // Export Transit Gateway IDs and Attachment IDs
            this.transitGatewayIds[config.region] = transitGateway.id;
            this.transitGatewayAttachmentIds[config.region] = tgwAttachment.id;

            // Create S3 bucket for VPC Flow Logs
            const flowLogBucket = new aws.s3.Bucket(`${config.region}-flowlogs-${randomSuffix.result}`, {
                bucketPrefix: `flowlogs-${config.region}`,
                serverSideEncryptionConfiguration: {
                    rule: {
                        applyServerSideEncryptionByDefault: {
                            sseAlgorithm: "AES256",
                        },
                    },
                },
                lifecycleRules: [{
                    enabled: true,
                    id: "expire-old-logs",
                    expiration: {
                        days: 90,
                    },
                }],
                tags: {
                    ...standardTags,
                    Name: `${config.region}-flowlogs-${randomSuffix.result}`,
                },
            }, { provider, parent: this });

            // Create VPC Flow Logs
            new aws.ec2.FlowLog(`${config.region}-flowlog-${randomSuffix.result}`, {
                vpcId: vpc.id,
                trafficType: "ALL",
                logDestinationType: "s3",
                logDestination: flowLogBucket.arn,
                logFormat: "${srcaddr} ${dstaddr} ${srcport} ${dstport} ${protocol} ${packets} ${bytes} ${action}",
                tags: {
                    ...standardTags,
                    Name: `${config.region}-flowlog-${randomSuffix.result}`,
                },
            }, { provider, parent: this });

            this.flowLogBuckets[config.region] = flowLogBucket.bucket;

            // Create Route53 Private Hosted Zone
            const hostedZone = new aws.route53.Zone(`${config.region}-zone-${randomSuffix.result}`, {
                name: `${config.region}.internal.trading`,
                vpcs: [{
                    vpcId: vpc.id,
                    vpcRegion: config.region as aws.Region,
                }],
                comment: `Private hosted zone for ${config.region}`,
                tags: {
                    ...standardTags,
                    Name: `${config.region}-zone-${randomSuffix.result}`,
                },
            }, { provider, parent: this });

            // Enable DNSSEC for the hosted zone
            new aws.route53.KeySigningKey(`${config.region}-ksk-${randomSuffix.result}`, {
                hostedZoneId: hostedZone.id,
                keyManagementServiceArn: pulumi.interpolate`arn:aws:kms:${config.region}:${aws.getCallerIdentity().then(identity => identity.accountId)}:alias/aws/route53`,
                name: `${config.region}-ksk`,
            }, { provider, parent: this });

            new aws.route53.HostedZoneDnssec(`${config.region}-dnssec-${randomSuffix.result}`, {
                hostedZoneId: hostedZone.id,
            }, { provider, parent: this });

            this.route53ZoneIds[config.region] = hostedZone.id;

            // Create VPC Endpoints for Systems Manager
            const endpointServices = ["ssm", "ssmmessages", "ec2messages"];
            const vpcEndpoints: { [service: string]: pulumi.Output<string> } = {};

            for (const service of endpointServices) {
                const endpoint = new aws.ec2.VpcEndpoint(`${config.region}-${service}-endpoint-${randomSuffix.result}`, {
                    vpcId: vpc.id,
                    serviceName: `com.amazonaws.${config.region}.${service}`,
                    vpcEndpointType: "Interface",
                    subnetIds: privateSubnets.map(subnet => subnet.id),
                    securityGroupIds: [this.createEndpointSecurityGroup(
                        `${config.region}-${service}-sg-${randomSuffix.result}`,
                        vpc.id,
                        config.vpcCidr,
                        standardTags,
                        provider
                    ).id],
                    privateDnsEnabled: true,
                    tags: {
                        ...standardTags,
                        Name: `${config.region}-${service}-endpoint-${randomSuffix.result}`,
                    },
                }, { provider, parent: this });

                vpcEndpoints[service] = endpoint.dnsEntries[0].apply(entry => entry?.dnsName || "");
            