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
        this.createSubnets();
        this.igw = this.createInternetGateway();
        this.createNatGateways();
        this.publicRt = this.createRouteTablesAndAssociations();
        this.albSecurityGroup = this.createAlbSecurityGroup();
        this.ebSecurityGroup = this.createEbSecurityGroup();
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
     * Create public and private subnets across multiple AZs (synchronous for testing)
     */
    createSubnets() {
        // Create subnets synchronously for 2 AZs
        const numAzsToUse = 2;
        const base = this.isPrimary ? 0 : 1;
        const publicBase = 100;
        const privateBase = 120;
        for (let i = 0; i < numAzsToUse; i++) {
            const azName = `${this.region}${String.fromCharCode(97 + i)}`; // us-east-1a, us-east-1b
            const publicCidr = `10.${base}.${publicBase + i}.0/24`;
            const privateCidr = `10.${base}.${privateBase + i}.0/24`;
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
    }
    /**
     * Create and configure route tables
     */
    createRouteTablesAndAssociations() {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmV0d29ya2luZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5ldHdvcmtpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBR0gsaURBQW1DO0FBQ25DLDJDQUE2RTtBQVM3RSxNQUFhLHdCQUF5QixTQUFRLDBCQUFpQjtJQUM1QyxNQUFNLENBQVM7SUFDZixTQUFTLENBQVU7SUFDbkIsV0FBVyxDQUFTO0lBQ3BCLElBQUksQ0FBeUI7SUFDN0IsWUFBWSxDQUFTO0lBQ3JCLFFBQVEsQ0FBZ0I7SUFDeEIsT0FBTyxDQUFTO0lBRWpCLEdBQUcsQ0FBYztJQUNqQixhQUFhLEdBQXFCLEVBQUUsQ0FBQztJQUNyQyxjQUFjLEdBQXFCLEVBQUUsQ0FBQztJQUN0QyxXQUFXLEdBQXlCLEVBQUUsQ0FBQztJQUN2QyxVQUFVLEdBQXlCLEVBQUUsQ0FBQztJQUN0QyxHQUFHLENBQTBCO0lBQzdCLFFBQVEsQ0FBcUI7SUFDN0IsZ0JBQWdCLENBQXdCO0lBQ3hDLGVBQWUsQ0FBd0I7SUFFdkQsWUFDRSxJQUFZLEVBQ1osSUFBa0MsRUFDbEMsSUFBK0I7UUFFL0IsS0FBSyxDQUFDLGdDQUFnQyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFeEQsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQzFCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztRQUNoQyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDcEMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ3RCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUs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ckIsQ0FBQztJQUVELElBQVcsZUFBZTtRQUN4QixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3JELENBQUM7SUFFRCxJQUFXLGdCQUFnQjtRQUN6QixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3RELENBQUM7SUFFRCxJQUFXLGtCQUFrQjtRQUMzQixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUM7SUFDbEMsQ0FBQztJQUVELElBQVcsaUJBQWlCO1FBQzFCLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUM7SUFDakMsQ0FBQztDQUNGO0FBOVZELDREQThWQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogTmV0d29ya2luZyBJbmZyYXN0cnVjdHVyZSBDb21wb25lbnRcbiAqIEhhbmRsZXMgVlBDLCBzdWJuZXRzLCBzZWN1cml0eSBncm91cHMsIGFuZCBuZXR3b3JrLXJlbGF0ZWQgcmVzb3VyY2VzXG4gKi9cblxuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCAqIGFzIGF3cyBmcm9tICdAcHVsdW1pL2F3cyc7XG5pbXBvcnQgeyBDb21wb25lbnRSZXNvdXJjZSwgQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zIH0gZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuXG5pbnRlcmZhY2UgTmV0d29ya2luZ0luZnJhc3RydWN0dXJlQXJncyB7XG4gIHJlZ2lvbjogc3RyaW5nO1xuICBpc1ByaW1hcnk6IGJvb2xlYW47XG4gIGVudmlyb25tZW50OiBzdHJpbmc7XG4gIHRhZ3M6IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG59XG5cbmV4cG9ydCBjbGFzcyBOZXR3b3JraW5nSW5mcmFzdHJ1Y3R1cmUgZXh0ZW5kcyBDb21wb25lbnRSZXNvdXJjZSB7XG4gIHByaXZhdGUgcmVhZG9ubHkgcmVnaW9uOiBzdHJpbmc7XG4gIHByaXZhdGUgcmVhZG9ubHkgaXNQcmltYXJ5OiBib29sZWFuO1xuICBwcml2YXRlIHJlYWRvbmx5IGVudmlyb25tZW50OiBzdHJpbmc7XG4gIHByaXZhdGUgcmVhZG9ubHkgdGFnczogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgcHJpdmF0ZSByZWFkb25seSByZWdpb25TdWZmaXg6IHN0cmluZztcbiAgcHJpdmF0ZSByZWFkb25seSBwcm92aWRlcj86IGF3cy5Qcm92aWRlcjtcbiAgcHJpdmF0ZSByZWFkb25seSB2cGNDaWRyOiBzdHJpbmc7XG5cbiAgcHVibGljIHJlYWRvbmx5IHZwYzogYXdzLmVjMi5WcGM7XG4gIHB1YmxpYyByZWFkb25seSBwdWJsaWNTdWJuZXRzOiBhd3MuZWMyLlN1Ym5ldFtdID0gW107XG4gIHB1YmxpYyByZWFkb25seSBwcml2YXRlU3VibmV0czogYXdzLmVjMi5TdWJuZXRbXSA9IFtdO1xuICBwdWJsaWMgcmVhZG9ubHkgbmF0R2F0ZXdheXM6IGF3cy5lYzIuTmF0R2F0ZXdheVtdID0gW107XG4gIHB1YmxpYyByZWFkb25seSBwcml2YXRlUnRzOiBhd3MuZWMyLlJvdXRlVGFibGVbXSA9IFtdO1xuICBwdWJsaWMgcmVhZG9ubHkgaWd3OiBhd3MuZWMyLkludGVybmV0R2F0ZXdheTtcbiAgcHVibGljIHJlYWRvbmx5IHB1YmxpY1J0OiBhd3MuZWMyLlJvdXRlVGFibGU7XG4gIHB1YmxpYyByZWFkb25seSBhbGJTZWN1cml0eUdyb3VwOiBhd3MuZWMyLlNlY3VyaXR5R3JvdXA7XG4gIHB1YmxpYyByZWFkb25seSBlYlNlY3VyaXR5R3JvdXA6IGF3cy5lYzIuU2VjdXJpdHlHcm91cDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogTmV0d29ya2luZ0luZnJhc3RydWN0dXJlQXJncyxcbiAgICBvcHRzPzogQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4gICkge1xuICAgIHN1cGVyKCdub3ZhOmluZnJhc3RydWN0dXJlOk5ldHdvcmtpbmcnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICB0aGlzLnJlZ2lvbiA9IGFyZ3MucmVnaW9uO1xuICAgIHRoaXMuaXNQcmltYXJ5ID0gYXJncy5pc1ByaW1hcnk7XG4gICAgdGhpcy5lbnZpcm9ubWVudCA9IGFyZ3MuZW52aXJvbm1lbnQ7XG4gICAgdGhpcy50YWdzID0gYXJncy50YWdzO1xuICAgIHRoaXMucmVnaW9uU3VmZml4ID0gYXJncy5yZWdpb24ucmVwbGFjZSgvLS9nLCAnJykucmVwbGFjZSgvZ292L2csICcnKTtcblxuICAgIHRoaXMucHJvdmlkZXIgPSBvcHRzPy5wcm92aWRlciBhcyBhd3MuUHJvdmlkZXIgfCB1bmRlZmluZWQ7XG4gICAgdGhpcy52cGNDaWRyID0gYXJncy5pc1ByaW1hcnkgPyAnMTAuMC4wLjAvMTYnIDogJzEwLjEuMC4wLzE2JztcblxuICAgIHRoaXMudnBjID0gdGhpcy5jcmVhdGVWcGMoKTtcbiAgICB0aGlzLmNyZWF0ZVN1Ym5ldHMoKTtcbiAgICB0aGlzLmlndyA9IHRoaXMuY3JlYXRlSW50ZXJuZXRHYXRld2F5KCk7XG4gICAgdGhpcy5jcmVhdGVOYXRHYXRld2F5cygpO1xuICAgIHRoaXMucHVibGljUnQgPSB0aGlzLmNyZWF0ZVJvdXRlVGFibGVzQW5kQXNzb2NpYXRpb25zKCk7XG4gICAgdGhpcy5hbGJTZWN1cml0eUdyb3VwID0gdGhpcy5jcmVhdGVBbGJTZWN1cml0eUdyb3VwKCk7XG4gICAgdGhpcy5lYlNlY3VyaXR5R3JvdXAgPSB0aGlzLmNyZWF0ZUViU2VjdXJpdHlHcm91cCgpO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgdnBjSWQ6IHRoaXMudnBjLmlkLFxuICAgICAgdnBjQ2lkcjogdGhpcy52cGMuY2lkckJsb2NrLFxuICAgICAgcHVibGljU3VibmV0SWRzOiB0aGlzLnB1YmxpY1N1Ym5ldHMubWFwKHN1Ym5ldCA9PiBzdWJuZXQuaWQpLFxuICAgICAgcHJpdmF0ZVN1Ym5ldElkczogdGhpcy5wcml2YXRlU3VibmV0cy5tYXAoc3VibmV0ID0+IHN1Ym5ldC5pZCksXG4gICAgICBhbGJTZWN1cml0eUdyb3VwSWQ6IHRoaXMuYWxiU2VjdXJpdHlHcm91cC5pZCxcbiAgICAgIGViU2VjdXJpdHlHcm91cElkOiB0aGlzLmViU2VjdXJpdHlHcm91cC5pZCxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgVlBDIHdpdGggRE5TIHN1cHBvcnRcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlVnBjKCk6IGF3cy5lYzIuVnBjIHtcbiAgICByZXR1cm4gbmV3IGF3cy5lYzIuVnBjKFxuICAgICAgYHZwYy0ke3RoaXMucmVnaW9uU3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIGNpZHJCbG9jazogdGhpcy52cGNDaWRyLFxuICAgICAgICBlbmFibGVEbnNIb3N0bmFtZXM6IHRydWUsXG4gICAgICAgIGVuYWJsZURuc1N1cHBvcnQ6IHRydWUsXG4gICAgICAgIHRhZ3M6IHsgLi4udGhpcy50YWdzLCBOYW1lOiBgbm92YS12cGMtJHt0aGlzLnJlZ2lvblN1ZmZpeH1gIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIHB1YmxpYyBhbmQgcHJpdmF0ZSBzdWJuZXRzIGFjcm9zcyBtdWx0aXBsZSBBWnMgKHN5bmNocm9ub3VzIGZvciB0ZXN0aW5nKVxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVTdWJuZXRzKCk6IHZvaWQge1xuICAgIC8vIENyZWF0ZSBzdWJuZXRzIHN5bmNocm9ub3VzbHkgZm9yIDIgQVpzXG4gICAgY29uc3QgbnVtQXpzVG9Vc2UgPSAyO1xuICAgIGNvbnN0IGJhc2UgPSB0aGlzLmlzUHJpbWFyeSA/IDAgOiAxO1xuICAgIGNvbnN0IHB1YmxpY0Jhc2UgPSAxMDA7XG4gICAgY29uc3QgcHJpdmF0ZUJhc2UgPSAxMjA7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bUF6c1RvVXNlOyBpKyspIHtcbiAgICAgIGNvbnN0IGF6TmFtZSA9IGAke3RoaXMucmVnaW9ufSR7U3RyaW5nLmZyb21DaGFyQ29kZSg5NyArIGkpfWA7IC8vIHVzLWVhc3QtMWEsIHVzLWVhc3QtMWJcbiAgICAgIGNvbnN0IHB1YmxpY0NpZHIgPSBgMTAuJHtiYXNlfS4ke3B1YmxpY0Jhc2UgKyBpfS4wLzI0YDtcbiAgICAgIGNvbnN0IHByaXZhdGVDaWRyID0gYDEwLiR7YmFzZX0uJHtwcml2YXRlQmFzZSArIGl9LjAvMjRgO1xuXG4gICAgICBjb25zdCBwdWJsaWNTdWJuZXQgPSBuZXcgYXdzLmVjMi5TdWJuZXQoXG4gICAgICAgIGBwdWJsaWMtc3VibmV0LSR7aX0tJHt0aGlzLnJlZ2lvblN1ZmZpeH1gLFxuICAgICAgICB7XG4gICAgICAgICAgdnBjSWQ6IHRoaXMudnBjLmlkLFxuICAgICAgICAgIGNpZHJCbG9jazogcHVibGljQ2lkcixcbiAgICAgICAgICBhdmFpbGFiaWxpdHlab25lOiBhek5hbWUsXG4gICAgICAgICAgbWFwUHVibGljSXBPbkxhdW5jaDogdHJ1ZSxcbiAgICAgICAgICB0YWdzOiB7IC4uLnRoaXMudGFncywgTmFtZTogYG5vdmEtcHVibGljLSR7aX0tJHt0aGlzLnJlZ2lvblN1ZmZpeH1gIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBwYXJlbnQ6IHRoaXMsXG4gICAgICAgICAgcHJvdmlkZXI6IHRoaXMucHJvdmlkZXIsXG4gICAgICAgICAgZGVsZXRlQmVmb3JlUmVwbGFjZTogdHJ1ZSxcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHRoaXMucHVibGljU3VibmV0cy5wdXNoKHB1YmxpY1N1Ym5ldCk7XG5cbiAgICAgIGNvbnN0IHByaXZhdGVTdWJuZXQgPSBuZXcgYXdzLmVjMi5TdWJuZXQoXG4gICAgICAgIGBwcml2YXRlLXN1Ym5ldC0ke2l9LSR7dGhpcy5yZWdpb25TdWZmaXh9YCxcbiAgICAgICAge1xuICAgICAgICAgIHZwY0lkOiB0aGlzLnZwYy5pZCxcbiAgICAgICAgICBjaWRyQmxvY2s6IHByaXZhdGVDaWRyLFxuICAgICAgICAgIGF2YWlsYWJpbGl0eVpvbmU6IGF6TmFtZSxcbiAgICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgICAuLi50aGlzLnRhZ3MsXG4gICAgICAgICAgICBOYW1lOiBgbm92YS1wcml2YXRlLSR7aX0tJHt0aGlzLnJlZ2lvblN1ZmZpeH1gLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBwYXJlbnQ6IHRoaXMsXG4gICAgICAgICAgcHJvdmlkZXI6IHRoaXMucHJvdmlkZXIsXG4gICAgICAgICAgZGVsZXRlQmVmb3JlUmVwbGFjZTogdHJ1ZSxcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHRoaXMucHJpdmF0ZVN1Ym5ldHMucHVzaChwcml2YXRlU3VibmV0KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIEludGVybmV0IEdhdGV3YXkgZm9yIHB1YmxpYyBpbnRlcm5ldCBhY2Nlc3NcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlSW50ZXJuZXRHYXRld2F5KCk6IGF3cy5lYzIuSW50ZXJuZXRHYXRld2F5IHtcbiAgICByZXR1cm4gbmV3IGF3cy5lYzIuSW50ZXJuZXRHYXRld2F5KFxuICAgICAgYGlndy0ke3RoaXMucmVnaW9uU3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIHZwY0lkOiB0aGlzLnZwYy5pZCxcbiAgICAgICAgdGFnczogeyAuLi50aGlzLnRhZ3MsIE5hbWU6IGBub3ZhLWlndy0ke3RoaXMucmVnaW9uU3VmZml4fWAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXI6IHRoaXMucHJvdmlkZXIgfVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIE5BVCBHYXRld2F5cyBmb3IgcHJpdmF0ZSBzdWJuZXQgaW50ZXJuZXQgYWNjZXNzXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZU5hdEdhdGV3YXlzKCk6IHZvaWQge1xuICAgIC8vIENyZWF0ZSBvbmUgTkFUIEdhdGV3YXkgcGVyIHB1YmxpYyBzdWJuZXRcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHVibGljU3VibmV0cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcHVibGljU3VibmV0ID0gdGhpcy5wdWJsaWNTdWJuZXRzW2ldO1xuXG4gICAgICBjb25zdCBlaXAgPSBuZXcgYXdzLmVjMi5FaXAoXG4gICAgICAgIGBuYXQtZWlwLSR7aX0tJHt0aGlzLnJlZ2lvblN1ZmZpeH1gLFxuICAgICAgICB7XG4gICAgICAgICAgZG9tYWluOiAndnBjJyxcbiAgICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgICAuLi50aGlzLnRhZ3MsXG4gICAgICAgICAgICBOYW1lOiBgbm92YS1uYXQtZWlwLSR7aX0tJHt0aGlzLnJlZ2lvblN1ZmZpeH1gLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBwYXJlbnQ6IHRoaXMsXG4gICAgICAgICAgcHJvdmlkZXI6IHRoaXMucHJvdmlkZXIsXG4gICAgICAgICAgZGVsZXRlQmVmb3JlUmVwbGFjZTogdHJ1ZSxcbiAgICAgICAgfVxuICAgICAgKTtcblxuICAgICAgY29uc3QgbmF0R3cgPSBuZXcgYXdzLmVjMi5OYXRHYXRld2F5KFxuICAgICAgICBgbmF0LWd3LSR7aX0tJHt0aGlzLnJlZ2lvblN1ZmZpeH1gLFxuICAgICAgICB7XG4gICAgICAgICAgYWxsb2NhdGlvbklkOiBlaXAuaWQsXG4gICAgICAgICAgc3VibmV0SWQ6IHB1YmxpY1N1Ym5ldC5pZCxcbiAgICAgICAgICB0YWdzOiB7IC4uLnRoaXMudGFncywgTmFtZTogYG5vdmEtbmF0LWd3LSR7aX0tJHt0aGlzLnJlZ2lvblN1ZmZpeH1gIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBwYXJlbnQ6IHRoaXMsXG4gICAgICAgICAgcHJvdmlkZXI6IHRoaXMucHJvdmlkZXIsXG4gICAgICAgICAgZGVsZXRlQmVmb3JlUmVwbGFjZTogdHJ1ZSxcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHRoaXMubmF0R2F0ZXdheXMucHVzaChuYXRHdyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhbmQgY29uZmlndXJlIHJvdXRlIHRhYmxlc1xuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVSb3V0ZVRhYmxlc0FuZEFzc29jaWF0aW9ucygpOiBhd3MuZWMyLlJvdXRlVGFibGUge1xuICAgIGNvbnN0IHB1YmxpY1J0ID0gbmV3IGF3cy5lYzIuUm91dGVUYWJsZShcbiAgICAgIGBwdWJsaWMtcnQtJHt0aGlzLnJlZ2lvblN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICB2cGNJZDogdGhpcy52cGMuaWQsXG4gICAgICAgIHJvdXRlczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGNpZHJCbG9jazogJzAuMC4wLjAvMCcsXG4gICAgICAgICAgICBnYXRld2F5SWQ6IHRoaXMuaWd3LmlkLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIHRhZ3M6IHsgLi4udGhpcy50YWdzLCBOYW1lOiBgbm92YS1wdWJsaWMtcnQtJHt0aGlzLnJlZ2lvblN1ZmZpeH1gIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyOiB0aGlzLnByb3ZpZGVyIH1cbiAgICApO1xuXG4gICAgLy8gQXNzb2NpYXRlIHB1YmxpYyBzdWJuZXRzIHdpdGggcHVibGljIHJvdXRlIHRhYmxlXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnB1YmxpY1N1Ym5ldHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHN1Ym5ldCA9IHRoaXMucHVibGljU3VibmV0c1tpXTtcbiAgICAgIG5ldyBhd3MuZWMyLlJvdXRlVGFibGVBc3NvY2lhdGlvbihcbiAgICAgICAgYHB1YmxpYy1ydC1hc3NvYy0ke2l9LSR7dGhpcy5yZWdpb25TdWZmaXh9YCxcbiAgICAgICAge1xuICAgICAgICAgIHN1Ym5ldElkOiBzdWJuZXQuaWQsXG4gICAgICAgICAgcm91dGVUYWJsZUlkOiBwdWJsaWNSdC5pZCxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyOiB0aGlzLnByb3ZpZGVyIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIHByaXZhdGUgcm91dGUgdGFibGVzIGFuZCBhc3NvY2lhdGlvbnNcbiAgICBmb3IgKFxuICAgICAgbGV0IGkgPSAwO1xuICAgICAgaSA8IHRoaXMucHJpdmF0ZVN1Ym5ldHMubGVuZ3RoICYmIGkgPCB0aGlzLm5hdEdhdGV3YXlzLmxlbmd0aDtcbiAgICAgIGkrK1xuICAgICkge1xuICAgICAgY29uc3Qgc3VibmV0ID0gdGhpcy5wcml2YXRlU3VibmV0c1tpXTtcbiAgICAgIGNvbnN0IG5hdEd3ID0gdGhpcy5uYXRHYXRld2F5c1tpXTtcblxuICAgICAgY29uc3QgcHJpdmF0ZVJ0ID0gbmV3IGF3cy5lYzIuUm91dGVUYWJsZShcbiAgICAgICAgYHByaXZhdGUtcnQtJHtpfS0ke3RoaXMucmVnaW9uU3VmZml4fWAsXG4gICAgICAgIHtcbiAgICAgICAgICB2cGNJZDogdGhpcy52cGMuaWQsXG4gICAgICAgICAgcm91dGVzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGNpZHJCbG9jazogJzAuMC4wLjAvMCcsXG4gICAgICAgICAgICAgIG5hdEdhdGV3YXlJZDogbmF0R3cuaWQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgICAgdGFnczoge1xuICAgICAgICAgICAgLi4udGhpcy50YWdzLFxuICAgICAgICAgICAgTmFtZTogYG5vdmEtcHJpdmF0ZS1ydC0ke2l9LSR7dGhpcy5yZWdpb25TdWZmaXh9YCxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICApO1xuICAgICAgdGhpcy5wcml2YXRlUnRzLnB1c2gocHJpdmF0ZVJ0KTtcblxuICAgICAgbmV3IGF3cy5lYzIuUm91dGVUYWJsZUFzc29jaWF0aW9uKFxuICAgICAgICBgcHJpdmF0ZS1ydC1hc3NvYy0ke2l9LSR7dGhpcy5yZWdpb25TdWZmaXh9YCxcbiAgICAgICAge1xuICAgICAgICAgIHN1Ym5ldElkOiBzdWJuZXQuaWQsXG4gICAgICAgICAgcm91dGVUYWJsZUlkOiBwcml2YXRlUnQuaWQsXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHB1YmxpY1J0O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBzZWN1cml0eSBncm91cCBmb3IgQXBwbGljYXRpb24gTG9hZCBCYWxhbmNlclxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVBbGJTZWN1cml0eUdyb3VwKCk6IGF3cy5lYzIuU2VjdXJpdHlHcm91cCB7XG4gICAgcmV0dXJuIG5ldyBhd3MuZWMyLlNlY3VyaXR5R3JvdXAoXG4gICAgICBgYWxiLXNnLSR7dGhpcy5yZWdpb25TdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgZGVzY3JpcHRpb246ICdTZWN1cml0eSBncm91cCBmb3IgQXBwbGljYXRpb24gTG9hZCBCYWxhbmNlcicsXG4gICAgICAgIHZwY0lkOiB0aGlzLnZwYy5pZCxcbiAgICAgICAgaW5ncmVzczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHByb3RvY29sOiAndGNwJyxcbiAgICAgICAgICAgIGZyb21Qb3J0OiA4MCxcbiAgICAgICAgICAgIHRvUG9ydDogODAsXG4gICAgICAgICAgICBjaWRyQmxvY2tzOiBbJzAuMC4wLjAvMCddLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdIVFRQIGZyb20gYW55d2hlcmUnLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgcHJvdG9jb2w6ICd0Y3AnLFxuICAgICAgICAgICAgZnJvbVBvcnQ6IDQ0MyxcbiAgICAgICAgICAgIHRvUG9ydDogNDQzLFxuICAgICAgICAgICAgY2lkckJsb2NrczogWycwLjAuMC4wLzAnXSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSFRUUFMgZnJvbSBhbnl3aGVyZScsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgZWdyZXNzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgcHJvdG9jb2w6ICctMScsXG4gICAgICAgICAgICBmcm9tUG9ydDogMCxcbiAgICAgICAgICAgIHRvUG9ydDogMCxcbiAgICAgICAgICAgIGNpZHJCbG9ja3M6IFsnMC4wLjAuMC8wJ10sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0FsbCBvdXRib3VuZCB0cmFmZmljJyxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICB0YWdzOiB7IC4uLnRoaXMudGFncywgTmFtZTogYG5vdmEtYWxiLXNnLSR7dGhpcy5yZWdpb25TdWZmaXh9YCB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBzZWN1cml0eSBncm91cCBmb3IgRWxhc3RpYyBCZWFuc3RhbGsgaW5zdGFuY2VzXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZUViU2VjdXJpdHlHcm91cCgpOiBhd3MuZWMyLlNlY3VyaXR5R3JvdXAge1xuICAgIHJldHVybiBuZXcgYXdzLmVjMi5TZWN1cml0eUdyb3VwKFxuICAgICAgYGViLXNnLSR7dGhpcy5yZWdpb25TdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgZGVzY3JpcHRpb246ICdTZWN1cml0eSBncm91cCBmb3IgRWxhc3RpYyBCZWFuc3RhbGsgaW5zdGFuY2VzJyxcbiAgICAgICAgdnBjSWQ6IHRoaXMudnBjLmlkLFxuICAgICAgICBpbmdyZXNzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgcHJvdG9jb2w6ICd0Y3AnLFxuICAgICAgICAgICAgZnJvbVBvcnQ6IDgwLFxuICAgICAgICAgICAgdG9Qb3J0OiA4MCxcbiAgICAgICAgICAgIHNlY3VyaXR5R3JvdXBzOiBbdGhpcy5hbGJTZWN1cml0eUdyb3VwLmlkXSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSFRUUCBmcm9tIEFMQicsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBwcm90b2NvbDogJ3RjcCcsXG4gICAgICAgICAgICBmcm9tUG9ydDogMjIsXG4gICAgICAgICAgICB0b1BvcnQ6IDIyLFxuICAgICAgICAgICAgY2lkckJsb2NrczogW3RoaXMudnBjQ2lkcl0sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NTSCBmcm9tIFZQQycsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgZWdyZXNzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgcHJvdG9jb2w6ICctMScsXG4gICAgICAgICAgICBmcm9tUG9ydDogMCxcbiAgICAgICAgICAgIHRvUG9ydDogMCxcbiAgICAgICAgICAgIGNpZHJCbG9ja3M6IFsnMC4wLjAuMC8wJ10sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0FsbCBvdXRib3VuZCB0cmFmZmljJyxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICB0YWdzOiB7IC4uLnRoaXMudGFncywgTmFtZTogYG5vdmEtZWItc2ctJHt0aGlzLnJlZ2lvblN1ZmZpeH1gIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG4gIH1cblxuICAvLyBQcm9wZXJ0eSBnZXR0ZXJzIGZvciBlYXN5IGFjY2Vzc1xuICBwdWJsaWMgZ2V0IHZwY0lkKCk6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMudnBjLmlkO1xuICB9XG5cbiAgcHVibGljIGdldCBwdWJsaWNTdWJuZXRJZHMoKTogcHVsdW1pLk91dHB1dDxzdHJpbmc+W10ge1xuICAgIHJldHVybiB0aGlzLnB1YmxpY1N1Ym5ldHMubWFwKHN1Ym5ldCA9PiBzdWJuZXQuaWQpO1xuICB9XG5cbiAgcHVibGljIGdldCBwcml2YXRlU3VibmV0SWRzKCk6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPltdIHtcbiAgICByZXR1cm4gdGhpcy5wcml2YXRlU3VibmV0cy5tYXAoc3VibmV0ID0+IHN1Ym5ldC5pZCk7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGFsYlNlY3VyaXR5R3JvdXBJZCgpOiBwdWx1bWkuT3V0cHV0PHN0cmluZz4ge1xuICAgIHJldHVybiB0aGlzLmFsYlNlY3VyaXR5R3JvdXAuaWQ7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGViU2VjdXJpdHlHcm91cElkKCk6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMuZWJTZWN1cml0eUdyb3VwLmlkO1xuICB9XG59XG4iXX0=