"use strict";
/**
 * Networking Infrastructure Component
 * Handles VPC, subnets, security groups, and network-related resources
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkingInfrastructure = void 0;
const aws = __importStar(require("@pulumi/aws"));
const pulumi_1 = require("@pulumi/pulumi");
class NetworkingInfrastructure extends pulumi_1.ComponentResource {
    region;
    isPrimary;
    environment;
    tags;
    regionSuffix;
    provider;
    vpcCidr;
    vpc;
    publicSubnets = [];
    privateSubnets = [];
    natGateways = [];
    privateRts = [];
    igw;
    publicRt;
    albSecurityGroup;
    ebSecurityGroup;
    constructor(name, args, opts) {
        super('nova:infrastructure:Networking', name, {}, opts);
        this.region = args.region;
        this.isPrimary = args.isPrimary;
        this.environment = args.environment;
        this.tags = args.tags;
        this.regionSuffix = args.region.replace(/-/g, '').replace(/gov/g, '');
        this.provider = opts?.provider;
        this.vpcCidr = args.isPrimary ? '10.0.0.0/16' : '10.1.0.0/16';
        this.vpc = this.createVpc();
        this.igw = this.createInternetGateway();
        this.albSecurityGroup = this.createAlbSecurityGroup();
        this.ebSecurityGroup = this.createEbSecurityGroup();
        // Create subnets and route tables synchronously to avoid readonly issues
        this.createSubnets();
        this.createNatGateways();
        this.publicRt = this.createRouteTablesAndAssociations();
        this.registerOutputs({
            vpcId: this.vpc.id,
            vpcCidr: this.vpc.cidrBlock,
            publicSubnetIds: this.publicSubnets.map(subnet => subnet.id),
            privateSubnetIds: this.privateSubnets.map(subnet => subnet.id),
            albSecurityGroupId: this.albSecurityGroup.id,
            ebSecurityGroupId: this.ebSecurityGroup.id,
        });
    }
    /**
     * Create VPC with DNS support
     */
    createVpc() {
        return new aws.ec2.Vpc(`vpc-${this.regionSuffix}`, {
            cidrBlock: this.vpcCidr,
            enableDnsHostnames: true,
            enableDnsSupport: true,
            tags: { ...this.tags, Name: `nova-vpc-${this.regionSuffix}` },
        }, { parent: this });
    }
    /**
     * Get availability zones for the region with fallback
     */
    getAvailabilityZones() {
        // Region-specific AZ mapping for reliable deployments
        const regionAzMap = {
            'us-east-1': ['us-east-1a', 'us-east-1b'],
            'us-east-2': ['us-east-2a', 'us-east-2b'],
            'us-west-1': ['us-west-1a', 'us-west-1c'], // us-west-1 doesn't have 'b'
            'us-west-2': ['us-west-2a', 'us-west-2b'],
            'us-gov-east-1': ['us-gov-east-1a', 'us-gov-east-1b'],
            'us-gov-west-1': ['us-gov-west-1a', 'us-gov-west-1b'],
            'eu-west-1': ['eu-west-1a', 'eu-west-1b'],
            'eu-central-1': ['eu-central-1a', 'eu-central-1b'],
            'ap-southeast-1': ['ap-southeast-1a', 'ap-southeast-1b'],
            'ap-northeast-1': ['ap-northeast-1a', 'ap-northeast-1c'],
        };
        const availableAzs = regionAzMap[this.region];
        if (availableAzs) {
            console.log(`📍 Using known AZs for ${this.region}:`, availableAzs);
            return availableAzs;
        }
        // Fallback for unknown regions
        console.log(`⚠️  Unknown region ${this.region}, using fallback AZs`);
        return [`${this.region}a`, `${this.region}c`];
    }
    /**
     * Create public and private subnets across multiple AZs
     */
    createSubnets() {
        const availableAzs = this.getAvailabilityZones();
        const numAzsToUse = Math.min(2, availableAzs.length);
        const base = this.isPrimary ? 0 : 1;
        const publicBase = 100;
        const privateBase = 120;
        console.log(`🏗️  Creating subnets in ${numAzsToUse} AZs for ${this.region}`);
        for (let i = 0; i < numAzsToUse; i++) {
            const azName = availableAzs[i];
            const publicCidr = `10.${base}.${publicBase + i}.0/24`;
            const privateCidr = `10.${base}.${privateBase + i}.0/24`;
            console.log(`   📍 Creating subnets in AZ: ${azName}`);
            const publicSubnet = new aws.ec2.Subnet(`public-subnet-${i}-${this.regionSuffix}`, {
                vpcId: this.vpc.id,
                cidrBlock: publicCidr,
                availabilityZone: azName,
                mapPublicIpOnLaunch: true,
                tags: { ...this.tags, Name: `nova-public-${i}-${this.regionSuffix}` },
            }, {
                parent: this,
                provider: this.provider,
                deleteBeforeReplace: true,
            });
            this.publicSubnets.push(publicSubnet);
            const privateSubnet = new aws.ec2.Subnet(`private-subnet-${i}-${this.regionSuffix}`, {
                vpcId: this.vpc.id,
                cidrBlock: privateCidr,
                availabilityZone: azName,
                tags: {
                    ...this.tags,
                    Name: `nova-private-${i}-${this.regionSuffix}`,
                },
            }, {
                parent: this,
                provider: this.provider,
                deleteBeforeReplace: true,
            });
            this.privateSubnets.push(privateSubnet);
        }
        console.log(`✅ Created ${this.publicSubnets.length} public and ${this.privateSubnets.length} private subnets`);
    }
    /**
     * Create Internet Gateway for public internet access
     */
    createInternetGateway() {
        return new aws.ec2.InternetGateway(`igw-${this.regionSuffix}`, {
            vpcId: this.vpc.id,
            tags: { ...this.tags, Name: `nova-igw-${this.regionSuffix}` },
        }, { parent: this, provider: this.provider });
    }
    /**
     * Create NAT Gateways for private subnet internet access
     */
    createNatGateways() {
        console.log(`🔌 Creating ${this.publicSubnets.length} NAT Gateways...`);
        // Create one NAT Gateway per public subnet
        for (let i = 0; i < this.publicSubnets.length; i++) {
            const publicSubnet = this.publicSubnets[i];
            const eip = new aws.ec2.Eip(`nat-eip-${i}-${this.regionSuffix}`, {
                domain: 'vpc',
                tags: {
                    ...this.tags,
                    Name: `nova-nat-eip-${i}-${this.regionSuffix}`,
                },
            }, {
                parent: this,
                provider: this.provider,
                deleteBeforeReplace: true,
            });
            const natGw = new aws.ec2.NatGateway(`nat-gw-${i}-${this.regionSuffix}`, {
                allocationId: eip.id,
                subnetId: publicSubnet.id,
                tags: { ...this.tags, Name: `nova-nat-gw-${i}-${this.regionSuffix}` },
            }, {
                parent: this,
                provider: this.provider,
                deleteBeforeReplace: true,
            });
            this.natGateways.push(natGw);
        }
        console.log(`✅ Created ${this.natGateways.length} NAT Gateways`);
    }
    /**
     * Create and configure route tables
     */
    createRouteTablesAndAssociations() {
        console.log('🛣️  Creating route tables and associations...');
        const publicRt = new aws.ec2.RouteTable(`public-rt-${this.regionSuffix}`, {
            vpcId: this.vpc.id,
            routes: [
                {
                    cidrBlock: '0.0.0.0/0',
                    gatewayId: this.igw.id,
                },
            ],
            tags: { ...this.tags, Name: `nova-public-rt-${this.regionSuffix}` },
        }, { parent: this, provider: this.provider });
        // Associate public subnets with public route table
        for (let i = 0; i < this.publicSubnets.length; i++) {
            const subnet = this.publicSubnets[i];
            new aws.ec2.RouteTableAssociation(`public-rt-assoc-${i}-${this.regionSuffix}`, {
                subnetId: subnet.id,
                routeTableId: publicRt.id,
            }, { parent: this, provider: this.provider });
        }
        // Create private route tables and associations
        for (let i = 0; i < this.privateSubnets.length && i < this.natGateways.length; i++) {
            const subnet = this.privateSubnets[i];
            const natGw = this.natGateways[i];
            const privateRt = new aws.ec2.RouteTable(`private-rt-${i}-${this.regionSuffix}`, {
                vpcId: this.vpc.id,
                routes: [
                    {
                        cidrBlock: '0.0.0.0/0',
                        natGatewayId: natGw.id,
                    },
                ],
                tags: {
                    ...this.tags,
                    Name: `nova-private-rt-${i}-${this.regionSuffix}`,
                },
            }, { parent: this });
            this.privateRts.push(privateRt);
            new aws.ec2.RouteTableAssociation(`private-rt-assoc-${i}-${this.regionSuffix}`, {
                subnetId: subnet.id,
                routeTableId: privateRt.id,
            }, { parent: this });
        }
        console.log(`✅ Created public route table and ${this.privateRts.length} private route tables`);
        return publicRt;
    }
    /**
     * Create security group for Application Load Balancer
     */
    createAlbSecurityGroup() {
        return new aws.ec2.SecurityGroup(`alb-sg-${this.regionSuffix}`, {
            description: 'Security group for Application Load Balancer',
            vpcId: this.vpc.id,
            ingress: [
                {
                    protocol: 'tcp',
                    fromPort: 80,
                    toPort: 80,
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'HTTP from anywhere',
                },
                {
                    protocol: 'tcp',
                    fromPort: 443,
                    toPort: 443,
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'HTTPS from anywhere',
                },
            ],
            egress: [
                {
                    protocol: '-1',
                    fromPort: 0,
                    toPort: 0,
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'All outbound traffic',
                },
            ],
            tags: { ...this.tags, Name: `nova-alb-sg-${this.regionSuffix}` },
        }, { parent: this });
    }
    /**
     * Create security group for Elastic Beanstalk instances
     */
    createEbSecurityGroup() {
        return new aws.ec2.SecurityGroup(`eb-sg-${this.regionSuffix}`, {
            description: 'Security group for Elastic Beanstalk instances',
            vpcId: this.vpc.id,
            ingress: [
                {
                    protocol: 'tcp',
                    fromPort: 80,
                    toPort: 80,
                    securityGroups: [this.albSecurityGroup.id],
                    description: 'HTTP from ALB',
                },
                {
                    protocol: 'tcp',
                    fromPort: 22,
                    toPort: 22,
                    cidrBlocks: [this.vpcCidr],
                    description: 'SSH from VPC',
                },
            ],
            egress: [
                {
                    protocol: '-1',
                    fromPort: 0,
                    toPort: 0,
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'All outbound traffic',
                },
            ],
            tags: { ...this.tags, Name: `nova-eb-sg-${this.regionSuffix}` },
        }, { parent: this });
    }
    // Property getters for easy access
    get vpcId() {
        return this.vpc.id;
    }
    get publicSubnetIds() {
        return this.publicSubnets.map(subnet => subnet.id);
    }
    get privateSubnetIds() {
        return this.privateSubnets.map(subnet => subnet.id);
    }
    get albSecurityGroupId() {
        return this.albSecurityGroup.id;
    }
    get ebSecurityGroupId() {
        return this.ebSecurityGroup.id;
    }
}
exports.NetworkingInfrastructure = NetworkingInfrastructure;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmV0d29ya2luZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5ldHdvcmtpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBR0gsaURBQW1DO0FBQ25DLDJDQUE2RTtBQVM3RSxNQUFhLHdCQUF5QixTQUFRLDBCQUFpQjtJQUM1QyxNQUFNLENBQVM7SUFDZixTQUFTLENBQVU7SUFDbkIsV0FBVyxDQUFTO0lBQ3BCLElBQUksQ0FBeUI7SUFDN0IsWUFBWSxDQUFTO0lBQ3JCLFFBQVEsQ0FBZ0I7SUFDeEIsT0FBTyxDQUFTO0lBRWpCLEdBQUcsQ0FBYztJQUNqQixhQUFhLEdBQXFCLEVBQUUsQ0FBQztJQUNyQyxjQUFjLEdBQXFCLEVBQUUsQ0FBQztJQUN0QyxXQUFXLEdBQXlCLEVBQUUsQ0FBQztJQUN2QyxVQUFVLEdBQXlCLEVBQUUsQ0FBQztJQUN0QyxHQUFHLENBQTBCO0lBQzdCLFFBQVEsQ0FBcUI7SUFDN0IsZ0JBQWdCLENBQXdCO0lBQ3hDLGVBQWUsQ0FBd0I7SUFFdkQsWUFDRSxJQUFZLEVBQ1osSUFBa0MsRUFDbEMsSUFBK0I7UUFFL0IsS0FBSyxDQUFDLGdDQUFnQyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFeEQsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQzFCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztRQUNoQyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDcEMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ3RCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUs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LyoqXG4gKiBOZXR3b3JraW5nIEluZnJhc3RydWN0dXJlIENvbXBvbmVudFxuICogSGFuZGxlcyBWUEMsIHN1Ym5ldHMsIHNlY3VyaXR5IGdyb3VwcywgYW5kIG5ldHdvcmstcmVsYXRlZCByZXNvdXJjZXNcbiAqL1xuXG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcbmltcG9ydCB7IENvbXBvbmVudFJlc291cmNlLCBDb21wb25lbnRSZXNvdXJjZU9wdGlvbnMgfSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5cbmludGVyZmFjZSBOZXR3b3JraW5nSW5mcmFzdHJ1Y3R1cmVBcmdzIHtcbiAgcmVnaW9uOiBzdHJpbmc7XG4gIGlzUHJpbWFyeTogYm9vbGVhbjtcbiAgZW52aXJvbm1lbnQ6IHN0cmluZztcbiAgdGFnczogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbn1cblxuZXhwb3J0IGNsYXNzIE5ldHdvcmtpbmdJbmZyYXN0cnVjdHVyZSBleHRlbmRzIENvbXBvbmVudFJlc291cmNlIHtcbiAgcHJpdmF0ZSByZWFkb25seSByZWdpb246IHN0cmluZztcbiAgcHJpdmF0ZSByZWFkb25seSBpc1ByaW1hcnk6IGJvb2xlYW47XG4gIHByaXZhdGUgcmVhZG9ubHkgZW52aXJvbm1lbnQ6IHN0cmluZztcbiAgcHJpdmF0ZSByZWFkb25seSB0YWdzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICBwcml2YXRlIHJlYWRvbmx5IHJlZ2lvblN1ZmZpeDogc3RyaW5nO1xuICBwcml2YXRlIHJlYWRvbmx5IHByb3ZpZGVyPzogYXdzLlByb3ZpZGVyO1xuICBwcml2YXRlIHJlYWRvbmx5IHZwY0NpZHI6IHN0cmluZztcblxuICBwdWJsaWMgcmVhZG9ubHkgdnBjOiBhd3MuZWMyLlZwYztcbiAgcHVibGljIHJlYWRvbmx5IHB1YmxpY1N1Ym5ldHM6IGF3cy5lYzIuU3VibmV0W10gPSBbXTtcbiAgcHVibGljIHJlYWRvbmx5IHByaXZhdGVTdWJuZXRzOiBhd3MuZWMyLlN1Ym5ldFtdID0gW107XG4gIHB1YmxpYyByZWFkb25seSBuYXRHYXRld2F5czogYXdzLmVjMi5OYXRHYXRld2F5W10gPSBbXTtcbiAgcHVibGljIHJlYWRvbmx5IHByaXZhdGVSdHM6IGF3cy5lYzIuUm91dGVUYWJsZVtdID0gW107XG4gIHB1YmxpYyByZWFkb25seSBpZ3c6IGF3cy5lYzIuSW50ZXJuZXRHYXRld2F5O1xuICBwdWJsaWMgcmVhZG9ubHkgcHVibGljUnQ6IGF3cy5lYzIuUm91dGVUYWJsZTtcbiAgcHVibGljIHJlYWRvbmx5IGFsYlNlY3VyaXR5R3JvdXA6IGF3cy5lYzIuU2VjdXJpdHlHcm91cDtcbiAgcHVibGljIHJlYWRvbmx5IGViU2VjdXJpdHlHcm91cDogYXdzLmVjMi5TZWN1cml0eUdyb3VwO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhcmdzOiBOZXR3b3JraW5nSW5mcmFzdHJ1Y3R1cmVBcmdzLFxuICAgIG9wdHM/OiBDb21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ25vdmE6aW5mcmFzdHJ1Y3R1cmU6TmV0d29ya2luZycsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgIHRoaXMucmVnaW9uID0gYXJncy5yZWdpb247XG4gICAgdGhpcy5pc1ByaW1hcnkgPSBhcmdzLmlzUHJpbWFyeTtcbiAgICB0aGlzLmVudmlyb25tZW50ID0gYXJncy5lbnZpcm9ubWVudDtcbiAgICB0aGlzLnRhZ3MgPSBhcmdzLnRhZ3M7XG4gICAgdGhpcy5yZWdpb25TdWZmaXggPSBhcmdzLnJlZ2lvbi5yZXBsYWNlKC8tL2csICcnKS5yZXBsYWNlKC9nb3YvZywgJycpO1xuXG4gICAgdGhpcy5wcm92aWRlciA9IG9wdHM/LnByb3ZpZGVyIGFzIGF3cy5Qcm92aWRlciB8IHVuZGVmaW5lZDtcbiAgICB0aGlzLnZwY0NpZHIgPSBhcmdzLmlzUHJpbWFyeSA/ICcxMC4wLjAuMC8xNicgOiAnMTAuMS4wLjAvMTYnO1xuXG4gICAgdGhpcy52cGMgPSB0aGlzLmNyZWF0ZVZwYygpO1xuICAgIHRoaXMuaWd3ID0gdGhpcy5jcmVhdGVJbnRlcm5ldEdhdGV3YXkoKTtcbiAgICB0aGlzLmFsYlNlY3VyaXR5R3JvdXAgPSB0aGlzLmNyZWF0ZUFsYlNlY3VyaXR5R3JvdXAoKTtcbiAgICB0aGlzLmViU2VjdXJpdHlHcm91cCA9IHRoaXMuY3JlYXRlRWJTZWN1cml0eUdyb3VwKCk7XG5cbiAgICAvLyBDcmVhdGUgc3VibmV0cyBhbmQgcm91dGUgdGFibGVzIHN5bmNocm9ub3VzbHkgdG8gYXZvaWQgcmVhZG9ubHkgaXNzdWVzXG4gICAgdGhpcy5jcmVhdGVTdWJuZXRzKCk7XG4gICAgdGhpcy5jcmVhdGVOYXRHYXRld2F5cygpO1xuICAgIHRoaXMucHVibGljUnQgPSB0aGlzLmNyZWF0ZVJvdXRlVGFibGVzQW5kQXNzb2NpYXRpb25zKCk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICB2cGNJZDogdGhpcy52cGMuaWQsXG4gICAgICB2cGNDaWRyOiB0aGlzLnZwYy5jaWRyQmxvY2ssXG4gICAgICBwdWJsaWNTdWJuZXRJZHM6IHRoaXMucHVibGljU3VibmV0cy5tYXAoc3VibmV0ID0+IHN1Ym5ldC5pZCksXG4gICAgICBwcml2YXRlU3VibmV0SWRzOiB0aGlzLnByaXZhdGVTdWJuZXRzLm1hcChzdWJuZXQgPT4gc3VibmV0LmlkKSxcbiAgICAgIGFsYlNlY3VyaXR5R3JvdXBJZDogdGhpcy5hbGJTZWN1cml0eUdyb3VwLmlkLFxuICAgICAgZWJTZWN1cml0eUdyb3VwSWQ6IHRoaXMuZWJTZWN1cml0eUdyb3VwLmlkLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBWUEMgd2l0aCBETlMgc3VwcG9ydFxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVWcGMoKTogYXdzLmVjMi5WcGMge1xuICAgIHJldHVybiBuZXcgYXdzLmVjMi5WcGMoXG4gICAgICBgdnBjLSR7dGhpcy5yZWdpb25TdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgY2lkckJsb2NrOiB0aGlzLnZwY0NpZHIsXG4gICAgICAgIGVuYWJsZURuc0hvc3RuYW1lczogdHJ1ZSxcbiAgICAgICAgZW5hYmxlRG5zU3VwcG9ydDogdHJ1ZSxcbiAgICAgICAgdGFnczogeyAuLi50aGlzLnRhZ3MsIE5hbWU6IGBub3ZhLXZwYy0ke3RoaXMucmVnaW9uU3VmZml4fWAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYXZhaWxhYmlsaXR5IHpvbmVzIGZvciB0aGUgcmVnaW9uIHdpdGggZmFsbGJhY2tcbiAgICovXG4gIHByaXZhdGUgZ2V0QXZhaWxhYmlsaXR5Wm9uZXMoKTogc3RyaW5nW10ge1xuICAgIC8vIFJlZ2lvbi1zcGVjaWZpYyBBWiBtYXBwaW5nIGZvciByZWxpYWJsZSBkZXBsb3ltZW50c1xuICAgIGNvbnN0IHJlZ2lvbkF6TWFwOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmdbXT4gPSB7XG4gICAgICAndXMtZWFzdC0xJzogWyd1cy1lYXN0LTFhJywgJ3VzLWVhc3QtMWInXSxcbiAgICAgICd1cy1lYXN0LTInOiBbJ3VzLWVhc3QtMmEnLCAndXMtZWFzdC0yYiddLFxuICAgICAgJ3VzLXdlc3QtMSc6IFsndXMtd2VzdC0xYScsICd1cy13ZXN0LTFjJ10sIC8vIHVzLXdlc3QtMSBkb2Vzbid0IGhhdmUgJ2InXG4gICAgICAndXMtd2VzdC0yJzogWyd1cy13ZXN0LTJhJywgJ3VzLXdlc3QtMmInXSxcbiAgICAgICd1cy1nb3YtZWFzdC0xJzogWyd1cy1nb3YtZWFzdC0xYScsICd1cy1nb3YtZWFzdC0xYiddLFxuICAgICAgJ3VzLWdvdi13ZXN0LTEnOiBbJ3VzLWdvdi13ZXN0LTFhJywgJ3VzLWdvdi13ZXN0LTFiJ10sXG4gICAgICAnZXUtd2VzdC0xJzogWydldS13ZXN0LTFhJywgJ2V1LXdlc3QtMWInXSxcbiAgICAgICdldS1jZW50cmFsLTEnOiBbJ2V1LWNlbnRyYWwtMWEnLCAnZXUtY2VudHJhbC0xYiddLFxuICAgICAgJ2FwLXNvdXRoZWFzdC0xJzogWydhcC1zb3V0aGVhc3QtMWEnLCAnYXAtc291dGhlYXN0LTFiJ10sXG4gICAgICAnYXAtbm9ydGhlYXN0LTEnOiBbJ2FwLW5vcnRoZWFzdC0xYScsICdhcC1ub3J0aGVhc3QtMWMnXSxcbiAgICB9O1xuXG4gICAgY29uc3QgYXZhaWxhYmxlQXpzID0gcmVnaW9uQXpNYXBbdGhpcy5yZWdpb25dO1xuICAgIGlmIChhdmFpbGFibGVBenMpIHtcbiAgICAgIGNvbnNvbGUubG9nKGDwn5ONIFVzaW5nIGtub3duIEFacyBmb3IgJHt0aGlzLnJlZ2lvbn06YCwgYXZhaWxhYmxlQXpzKTtcbiAgICAgIHJldHVybiBhdmFpbGFibGVBenM7XG4gICAgfVxuXG4gICAgLy8gRmFsbGJhY2sgZm9yIHVua25vd24gcmVnaW9uc1xuICAgIGNvbnNvbGUubG9nKGDimqDvuI8gIFVua25vd24gcmVnaW9uICR7dGhpcy5yZWdpb259LCB1c2luZyBmYWxsYmFjayBBWnNgKTtcbiAgICByZXR1cm4gW2Ake3RoaXMucmVnaW9ufWFgLCBgJHt0aGlzLnJlZ2lvbn1jYF07XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIHB1YmxpYyBhbmQgcHJpdmF0ZSBzdWJuZXRzIGFjcm9zcyBtdWx0aXBsZSBBWnNcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlU3VibmV0cygpOiB2b2lkIHtcbiAgICBjb25zdCBhdmFpbGFibGVBenMgPSB0aGlzLmdldEF2YWlsYWJpbGl0eVpvbmVzKCk7XG4gICAgY29uc3QgbnVtQXpzVG9Vc2UgPSBNYXRoLm1pbigyLCBhdmFpbGFibGVBenMubGVuZ3RoKTtcbiAgICBjb25zdCBiYXNlID0gdGhpcy5pc1ByaW1hcnkgPyAwIDogMTtcbiAgICBjb25zdCBwdWJsaWNCYXNlID0gMTAwO1xuICAgIGNvbnN0IHByaXZhdGVCYXNlID0gMTIwO1xuXG4gICAgY29uc29sZS5sb2coXG4gICAgICBg8J+Pl++4jyAgQ3JlYXRpbmcgc3VibmV0cyBpbiAke251bUF6c1RvVXNlfSBBWnMgZm9yICR7dGhpcy5yZWdpb259YFxuICAgICk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bUF6c1RvVXNlOyBpKyspIHtcbiAgICAgIGNvbnN0IGF6TmFtZSA9IGF2YWlsYWJsZUF6c1tpXTtcbiAgICAgIGNvbnN0IHB1YmxpY0NpZHIgPSBgMTAuJHtiYXNlfS4ke3B1YmxpY0Jhc2UgKyBpfS4wLzI0YDtcbiAgICAgIGNvbnN0IHByaXZhdGVDaWRyID0gYDEwLiR7YmFzZX0uJHtwcml2YXRlQmFzZSArIGl9LjAvMjRgO1xuXG4gICAgICBjb25zb2xlLmxvZyhgICAg8J+TjSBDcmVhdGluZyBzdWJuZXRzIGluIEFaOiAke2F6TmFtZX1gKTtcblxuICAgICAgY29uc3QgcHVibGljU3VibmV0ID0gbmV3IGF3cy5lYzIuU3VibmV0KFxuICAgICAgICBgcHVibGljLXN1Ym5ldC0ke2l9LSR7dGhpcy5yZWdpb25TdWZmaXh9YCxcbiAgICAgICAge1xuICAgICAgICAgIHZwY0lkOiB0aGlzLnZwYy5pZCxcbiAgICAgICAgICBjaWRyQmxvY2s6IHB1YmxpY0NpZHIsXG4gICAgICAgICAgYXZhaWxhYmlsaXR5Wm9uZTogYXpOYW1lLFxuICAgICAgICAgIG1hcFB1YmxpY0lwT25MYXVuY2g6IHRydWUsXG4gICAgICAgICAgdGFnczogeyAuLi50aGlzLnRhZ3MsIE5hbWU6IGBub3ZhLXB1YmxpYy0ke2l9LSR7dGhpcy5yZWdpb25TdWZmaXh9YCB9LFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgcGFyZW50OiB0aGlzLFxuICAgICAgICAgIHByb3ZpZGVyOiB0aGlzLnByb3ZpZGVyLFxuICAgICAgICAgIGRlbGV0ZUJlZm9yZVJlcGxhY2U6IHRydWUsXG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICB0aGlzLnB1YmxpY1N1Ym5ldHMucHVzaChwdWJsaWNTdWJuZXQpO1xuXG4gICAgICBjb25zdCBwcml2YXRlU3VibmV0ID0gbmV3IGF3cy5lYzIuU3VibmV0KFxuICAgICAgICBgcHJpdmF0ZS1zdWJuZXQtJHtpfS0ke3RoaXMucmVnaW9uU3VmZml4fWAsXG4gICAgICAgIHtcbiAgICAgICAgICB2cGNJZDogdGhpcy52cGMuaWQsXG4gICAgICAgICAgY2lkckJsb2NrOiBwcml2YXRlQ2lkcixcbiAgICAgICAgICBhdmFpbGFiaWxpdHlab25lOiBhek5hbWUsXG4gICAgICAgICAgdGFnczoge1xuICAgICAgICAgICAgLi4udGhpcy50YWdzLFxuICAgICAgICAgICAgTmFtZTogYG5vdmEtcHJpdmF0ZS0ke2l9LSR7dGhpcy5yZWdpb25TdWZmaXh9YCxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgcGFyZW50OiB0aGlzLFxuICAgICAgICAgIHByb3ZpZGVyOiB0aGlzLnByb3ZpZGVyLFxuICAgICAgICAgIGRlbGV0ZUJlZm9yZVJlcGxhY2U6IHRydWUsXG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICB0aGlzLnByaXZhdGVTdWJuZXRzLnB1c2gocHJpdmF0ZVN1Ym5ldCk7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coXG4gICAgICBg4pyFIENyZWF0ZWQgJHt0aGlzLnB1YmxpY1N1Ym5ldHMubGVuZ3RofSBwdWJsaWMgYW5kICR7dGhpcy5wcml2YXRlU3VibmV0cy5sZW5ndGh9IHByaXZhdGUgc3VibmV0c2BcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBJbnRlcm5ldCBHYXRld2F5IGZvciBwdWJsaWMgaW50ZXJuZXQgYWNjZXNzXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZUludGVybmV0R2F0ZXdheSgpOiBhd3MuZWMyLkludGVybmV0R2F0ZXdheSB7XG4gICAgcmV0dXJuIG5ldyBhd3MuZWMyLkludGVybmV0R2F0ZXdheShcbiAgICAgIGBpZ3ctJHt0aGlzLnJlZ2lvblN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICB2cGNJZDogdGhpcy52cGMuaWQsXG4gICAgICAgIHRhZ3M6IHsgLi4udGhpcy50YWdzLCBOYW1lOiBgbm92YS1pZ3ctJHt0aGlzLnJlZ2lvblN1ZmZpeH1gIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyOiB0aGlzLnByb3ZpZGVyIH1cbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBOQVQgR2F0ZXdheXMgZm9yIHByaXZhdGUgc3VibmV0IGludGVybmV0IGFjY2Vzc1xuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVOYXRHYXRld2F5cygpOiB2b2lkIHtcbiAgICBjb25zb2xlLmxvZyhg8J+UjCBDcmVhdGluZyAke3RoaXMucHVibGljU3VibmV0cy5sZW5ndGh9IE5BVCBHYXRld2F5cy4uLmApO1xuXG4gICAgLy8gQ3JlYXRlIG9uZSBOQVQgR2F0ZXdheSBwZXIgcHVibGljIHN1Ym5ldFxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wdWJsaWNTdWJuZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBwdWJsaWNTdWJuZXQgPSB0aGlzLnB1YmxpY1N1Ym5ldHNbaV07XG5cbiAgICAgIGNvbnN0IGVpcCA9IG5ldyBhd3MuZWMyLkVpcChcbiAgICAgICAgYG5hdC1laXAtJHtpfS0ke3RoaXMucmVnaW9uU3VmZml4fWAsXG4gICAgICAgIHtcbiAgICAgICAgICBkb21haW46ICd2cGMnLFxuICAgICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAgIC4uLnRoaXMudGFncyxcbiAgICAgICAgICAgIE5hbWU6IGBub3ZhLW5hdC1laXAtJHtpfS0ke3RoaXMucmVnaW9uU3VmZml4fWAsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHBhcmVudDogdGhpcyxcbiAgICAgICAgICBwcm92aWRlcjogdGhpcy5wcm92aWRlcixcbiAgICAgICAgICBkZWxldGVCZWZvcmVSZXBsYWNlOiB0cnVlLFxuICAgICAgICB9XG4gICAgICApO1xuXG4gICAgICBjb25zdCBuYXRHdyA9IG5ldyBhd3MuZWMyLk5hdEdhdGV3YXkoXG4gICAgICAgIGBuYXQtZ3ctJHtpfS0ke3RoaXMucmVnaW9uU3VmZml4fWAsXG4gICAgICAgIHtcbiAgICAgICAgICBhbGxvY2F0aW9uSWQ6IGVpcC5pZCxcbiAgICAgICAgICBzdWJuZXRJZDogcHVibGljU3VibmV0LmlkLFxuICAgICAgICAgIHRhZ3M6IHsgLi4udGhpcy50YWdzLCBOYW1lOiBgbm92YS1uYXQtZ3ctJHtpfS0ke3RoaXMucmVnaW9uU3VmZml4fWAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHBhcmVudDogdGhpcyxcbiAgICAgICAgICBwcm92aWRlcjogdGhpcy5wcm92aWRlcixcbiAgICAgICAgICBkZWxldGVCZWZvcmVSZXBsYWNlOiB0cnVlLFxuICAgICAgICB9XG4gICAgICApO1xuICAgICAgdGhpcy5uYXRHYXRld2F5cy5wdXNoKG5hdEd3KTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZyhg4pyFIENyZWF0ZWQgJHt0aGlzLm5hdEdhdGV3YXlzLmxlbmd0aH0gTkFUIEdhdGV3YXlzYCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGFuZCBjb25maWd1cmUgcm91dGUgdGFibGVzXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZVJvdXRlVGFibGVzQW5kQXNzb2NpYXRpb25zKCk6IGF3cy5lYzIuUm91dGVUYWJsZSB7XG4gICAgY29uc29sZS5sb2coJ/Cfm6PvuI8gIENyZWF0aW5nIHJvdXRlIHRhYmxlcyBhbmQgYXNzb2NpYXRpb25zLi4uJyk7XG5cbiAgICBjb25zdCBwdWJsaWNSdCA9IG5ldyBhd3MuZWMyLlJvdXRlVGFibGUoXG4gICAgICBgcHVibGljLXJ0LSR7dGhpcy5yZWdpb25TdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgdnBjSWQ6IHRoaXMudnBjLmlkLFxuICAgICAgICByb3V0ZXM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBjaWRyQmxvY2s6ICcwLjAuMC4wLzAnLFxuICAgICAgICAgICAgZ2F0ZXdheUlkOiB0aGlzLmlndy5pZCxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICB0YWdzOiB7IC4uLnRoaXMudGFncywgTmFtZTogYG5vdmEtcHVibGljLXJ0LSR7dGhpcy5yZWdpb25TdWZmaXh9YCB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlcjogdGhpcy5wcm92aWRlciB9XG4gICAgKTtcblxuICAgIC8vIEFzc29jaWF0ZSBwdWJsaWMgc3VibmV0cyB3aXRoIHB1YmxpYyByb3V0ZSB0YWJsZVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wdWJsaWNTdWJuZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBzdWJuZXQgPSB0aGlzLnB1YmxpY1N1Ym5ldHNbaV07XG4gICAgICBuZXcgYXdzLmVjMi5Sb3V0ZVRhYmxlQXNzb2NpYXRpb24oXG4gICAgICAgIGBwdWJsaWMtcnQtYXNzb2MtJHtpfS0ke3RoaXMucmVnaW9uU3VmZml4fWAsXG4gICAgICAgIHtcbiAgICAgICAgICBzdWJuZXRJZDogc3VibmV0LmlkLFxuICAgICAgICAgIHJvdXRlVGFibGVJZDogcHVibGljUnQuaWQsXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlcjogdGhpcy5wcm92aWRlciB9XG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSBwcml2YXRlIHJvdXRlIHRhYmxlcyBhbmQgYXNzb2NpYXRpb25zXG4gICAgZm9yIChcbiAgICAgIGxldCBpID0gMDtcbiAgICAgIGkgPCB0aGlzLnByaXZhdGVTdWJuZXRzLmxlbmd0aCAmJiBpIDwgdGhpcy5uYXRHYXRld2F5cy5sZW5ndGg7XG4gICAgICBpKytcbiAgICApIHtcbiAgICAgIGNvbnN0IHN1Ym5ldCA9IHRoaXMucHJpdmF0ZVN1Ym5ldHNbaV07XG4gICAgICBjb25zdCBuYXRHdyA9IHRoaXMubmF0R2F0ZXdheXNbaV07XG5cbiAgICAgIGNvbnN0IHByaXZhdGVSdCA9IG5ldyBhd3MuZWMyLlJvdXRlVGFibGUoXG4gICAgICAgIGBwcml2YXRlLXJ0LSR7aX0tJHt0aGlzLnJlZ2lvblN1ZmZpeH1gLFxuICAgICAgICB7XG4gICAgICAgICAgdnBjSWQ6IHRoaXMudnBjLmlkLFxuICAgICAgICAgIHJvdXRlczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBjaWRyQmxvY2s6ICcwLjAuMC4wLzAnLFxuICAgICAgICAgICAgICBuYXRHYXRld2F5SWQ6IG5hdEd3LmlkLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAgIC4uLnRoaXMudGFncyxcbiAgICAgICAgICAgIE5hbWU6IGBub3ZhLXByaXZhdGUtcnQtJHtpfS0ke3RoaXMucmVnaW9uU3VmZml4fWAsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICAgKTtcbiAgICAgIHRoaXMucHJpdmF0ZVJ0cy5wdXNoKHByaXZhdGVSdCk7XG5cbiAgICAgIG5ldyBhd3MuZWMyLlJvdXRlVGFibGVBc3NvY2lhdGlvbihcbiAgICAgICAgYHByaXZhdGUtcnQtYXNzb2MtJHtpfS0ke3RoaXMucmVnaW9uU3VmZml4fWAsXG4gICAgICAgIHtcbiAgICAgICAgICBzdWJuZXRJZDogc3VibmV0LmlkLFxuICAgICAgICAgIHJvdXRlVGFibGVJZDogcHJpdmF0ZVJ0LmlkLFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKFxuICAgICAgYOKchSBDcmVhdGVkIHB1YmxpYyByb3V0ZSB0YWJsZSBhbmQgJHt0aGlzLnByaXZhdGVSdHMubGVuZ3RofSBwcml2YXRlIHJvdXRlIHRhYmxlc2BcbiAgICApO1xuICAgIHJldHVybiBwdWJsaWNSdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgc2VjdXJpdHkgZ3JvdXAgZm9yIEFwcGxpY2F0aW9uIExvYWQgQmFsYW5jZXJcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlQWxiU2VjdXJpdHlHcm91cCgpOiBhd3MuZWMyLlNlY3VyaXR5R3JvdXAge1xuICAgIHJldHVybiBuZXcgYXdzLmVjMi5TZWN1cml0eUdyb3VwKFxuICAgICAgYGFsYi1zZy0ke3RoaXMucmVnaW9uU3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIGRlc2NyaXB0aW9uOiAnU2VjdXJpdHkgZ3JvdXAgZm9yIEFwcGxpY2F0aW9uIExvYWQgQmFsYW5jZXInLFxuICAgICAgICB2cGNJZDogdGhpcy52cGMuaWQsXG4gICAgICAgIGluZ3Jlc3M6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBwcm90b2NvbDogJ3RjcCcsXG4gICAgICAgICAgICBmcm9tUG9ydDogODAsXG4gICAgICAgICAgICB0b1BvcnQ6IDgwLFxuICAgICAgICAgICAgY2lkckJsb2NrczogWycwLjAuMC4wLzAnXSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSFRUUCBmcm9tIGFueXdoZXJlJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHByb3RvY29sOiAndGNwJyxcbiAgICAgICAgICAgIGZyb21Qb3J0OiA0NDMsXG4gICAgICAgICAgICB0b1BvcnQ6IDQ0MyxcbiAgICAgICAgICAgIGNpZHJCbG9ja3M6IFsnMC4wLjAuMC8wJ10sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0hUVFBTIGZyb20gYW55d2hlcmUnLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIGVncmVzczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHByb3RvY29sOiAnLTEnLFxuICAgICAgICAgICAgZnJvbVBvcnQ6IDAsXG4gICAgICAgICAgICB0b1BvcnQ6IDAsXG4gICAgICAgICAgICBjaWRyQmxvY2tzOiBbJzAuMC4wLjAvMCddLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBbGwgb3V0Ym91bmQgdHJhZmZpYycsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgdGFnczogeyAuLi50aGlzLnRhZ3MsIE5hbWU6IGBub3ZhLWFsYi1zZy0ke3RoaXMucmVnaW9uU3VmZml4fWAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgc2VjdXJpdHkgZ3JvdXAgZm9yIEVsYXN0aWMgQmVhbnN0YWxrIGluc3RhbmNlc1xuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVFYlNlY3VyaXR5R3JvdXAoKTogYXdzLmVjMi5TZWN1cml0eUdyb3VwIHtcbiAgICByZXR1cm4gbmV3IGF3cy5lYzIuU2VjdXJpdHlHcm91cChcbiAgICAgIGBlYi1zZy0ke3RoaXMucmVnaW9uU3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIGRlc2NyaXB0aW9uOiAnU2VjdXJpdHkgZ3JvdXAgZm9yIEVsYXN0aWMgQmVhbnN0YWxrIGluc3RhbmNlcycsXG4gICAgICAgIHZwY0lkOiB0aGlzLnZwYy5pZCxcbiAgICAgICAgaW5ncmVzczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHByb3RvY29sOiAndGNwJyxcbiAgICAgICAgICAgIGZyb21Qb3J0OiA4MCxcbiAgICAgICAgICAgIHRvUG9ydDogODAsXG4gICAgICAgICAgICBzZWN1cml0eUdyb3VwczogW3RoaXMuYWxiU2VjdXJpdHlHcm91cC5pZF0sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0hUVFAgZnJvbSBBTEInLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgcHJvdG9jb2w6ICd0Y3AnLFxuICAgICAgICAgICAgZnJvbVBvcnQ6IDIyLFxuICAgICAgICAgICAgdG9Qb3J0OiAyMixcbiAgICAgICAgICAgIGNpZHJCbG9ja3M6IFt0aGlzLnZwY0NpZHJdLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTU0ggZnJvbSBWUEMnLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIGVncmVzczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHByb3RvY29sOiAnLTEnLFxuICAgICAgICAgICAgZnJvbVBvcnQ6IDAsXG4gICAgICAgICAgICB0b1BvcnQ6IDAsXG4gICAgICAgICAgICBjaWRyQmxvY2tzOiBbJzAuMC4wLjAvMCddLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBbGwgb3V0Ym91bmQgdHJhZmZpYycsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgdGFnczogeyAuLi50aGlzLnRhZ3MsIE5hbWU6IGBub3ZhLWViLXNnLSR7dGhpcy5yZWdpb25TdWZmaXh9YCB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuICB9XG5cbiAgLy8gUHJvcGVydHkgZ2V0dGVycyBmb3IgZWFzeSBhY2Nlc3NcbiAgcHVibGljIGdldCB2cGNJZCgpOiBwdWx1bWkuT3V0cHV0PHN0cmluZz4ge1xuICAgIHJldHVybiB0aGlzLnZwYy5pZDtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgcHVibGljU3VibmV0SWRzKCk6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPltdIHtcbiAgICByZXR1cm4gdGhpcy5wdWJsaWNTdWJuZXRzLm1hcChzdWJuZXQgPT4gc3VibmV0LmlkKTtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgcHJpdmF0ZVN1Ym5ldElkcygpOiBwdWx1bWkuT3V0cHV0PHN0cmluZz5bXSB7XG4gICAgcmV0dXJuIHRoaXMucHJpdmF0ZVN1Ym5ldHMubWFwKHN1Ym5ldCA9PiBzdWJuZXQuaWQpO1xuICB9XG5cbiAgcHVibGljIGdldCBhbGJTZWN1cml0eUdyb3VwSWQoKTogcHVsdW1pLk91dHB1dDxzdHJpbmc+IHtcbiAgICByZXR1cm4gdGhpcy5hbGJTZWN1cml0eUdyb3VwLmlkO1xuICB9XG5cbiAgcHVibGljIGdldCBlYlNlY3VyaXR5R3JvdXBJZCgpOiBwdWx1bWkuT3V0cHV0PHN0cmluZz4ge1xuICAgIHJldHVybiB0aGlzLmViU2VjdXJpdHlHcm91cC5pZDtcbiAgfVxufVxuIl19