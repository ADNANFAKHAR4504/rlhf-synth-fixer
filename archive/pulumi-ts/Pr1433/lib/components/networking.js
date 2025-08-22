"use strict";
// lib/components/networking.ts
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
exports.NetworkInfrastructure = void 0;
/**
 * Network Infrastructure Component
 * Creates VPC, subnets, security groups, NAT gateways, and VPC endpoints
 */
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
class NetworkInfrastructure extends pulumi.ComponentResource {
    vpc;
    igw;
    publicSubnets;
    publicSubnetIds;
    privateSubnets;
    privateSubnetIds;
    natEips;
    natGateways;
    publicRouteTable;
    privateRouteTables;
    lambdaSecurityGroup;
    vpcEndpointSecurityGroup;
    dynamodbEndpoint;
    s3Endpoint;
    kinesisEndpoint;
    constructor(name, args, opts) {
        super('custom:network:Infrastructure', name, {}, opts);
        // VPC
        this.vpc = new aws.ec2.Vpc(`${name}-vpc`, {
            cidrBlock: '10.0.0.0/16',
            enableDnsHostnames: true,
            enableDnsSupport: true,
            tags: { ...args.tags, Name: `${name}-vpc` },
        }, { parent: this });
        // Internet Gateway
        this.igw = new aws.ec2.InternetGateway(`${name}-igw`, {
            vpcId: this.vpc.id,
            tags: { ...args.tags, Name: `${name}-igw` },
        }, { parent: this });
        // Get availability zones
        const azs = aws.getAvailabilityZones({ state: 'available' });
        console.log(`DEBUG: get_availability_zones returned: ${azs.then(zones => zones.names)}`);
        // Public Subnets
        this.publicSubnets = [];
        this.publicSubnetIds = [];
        for (let i = 0; i < 2; i++) {
            const azName = azs.then(zones => zones.names[i]);
            const subnet = new aws.ec2.Subnet(`${name}-public-subnet-${i + 1}`, {
                vpcId: this.vpc.id,
                cidrBlock: `10.0.${i + 1}.0/24`,
                availabilityZone: azName,
                mapPublicIpOnLaunch: true,
                tags: {
                    ...args.tags,
                    Name: `${name}-public-subnet-${i + 1}`,
                    Type: 'Public',
                },
            }, { parent: this });
            this.publicSubnets.push(subnet);
            this.publicSubnetIds.push(subnet.id);
        }
        // Private Subnets
        this.privateSubnets = [];
        this.privateSubnetIds = [];
        for (let i = 0; i < 2; i++) {
            const azName = azs.then(zones => zones.names[i]);
            const subnet = new aws.ec2.Subnet(`${name}-private-subnet-${i + 1}`, {
                vpcId: this.vpc.id,
                cidrBlock: `10.0.${i + 10}.0/24`,
                availabilityZone: azName,
                tags: {
                    ...args.tags,
                    Name: `${name}-private-subnet-${i + 1}`,
                    Type: 'Private',
                },
            }, { parent: this });
            this.privateSubnets.push(subnet);
            this.privateSubnetIds.push(subnet.id);
        }
        // NAT Gateway EIPs
        this.natEips = [];
        for (let i = 0; i < this.publicSubnets.length; i++) {
            const eip = new aws.ec2.Eip(`${name}-nat-eip-${i + 1}`, {
                domain: 'vpc',
                tags: { ...args.tags, Name: `${name}-nat-eip-${i + 1}` },
            }, {
                parent: this,
                dependsOn: [this.igw],
            });
            this.natEips.push(eip);
        }
        // NAT Gateways
        this.natGateways = [];
        for (let i = 0; i < this.publicSubnets.length; i++) {
            const nat = new aws.ec2.NatGateway(`${name}-nat-${i + 1}`, {
                allocationId: this.natEips[i].id,
                subnetId: this.publicSubnets[i].id,
                tags: { ...args.tags, Name: `${name}-nat-${i + 1}` },
            }, { parent: this });
            this.natGateways.push(nat);
        }
        // Public Route Table
        this.publicRouteTable = new aws.ec2.RouteTable(`${name}-public-rt`, {
            vpcId: this.vpc.id,
            tags: { ...args.tags, Name: `${name}-public-rt` },
        }, { parent: this });
        // Public Route
        new aws.ec2.Route(`${name}-public-route`, {
            routeTableId: this.publicRouteTable.id,
            destinationCidrBlock: '0.0.0.0/0',
            gatewayId: this.igw.id,
        }, { parent: this });
        // Public Route Table Associations
        for (let i = 0; i < this.publicSubnets.length; i++) {
            new aws.ec2.RouteTableAssociation(`${name}-public-rta-${i + 1}`, {
                subnetId: this.publicSubnets[i].id,
                routeTableId: this.publicRouteTable.id,
            }, { parent: this });
        }
        // Private Route Tables
        this.privateRouteTables = [];
        for (let i = 0; i < this.privateSubnets.length; i++) {
            const rt = new aws.ec2.RouteTable(`${name}-private-rt-${i + 1}`, {
                vpcId: this.vpc.id,
                tags: { ...args.tags, Name: `${name}-private-rt-${i + 1}` },
            }, { parent: this });
            // Private Route
            new aws.ec2.Route(`${name}-private-route-${i + 1}`, {
                routeTableId: rt.id,
                destinationCidrBlock: '0.0.0.0/0',
                natGatewayId: this.natGateways[i].id,
            }, { parent: this });
            // Private Route Table Association
            new aws.ec2.RouteTableAssociation(`${name}-private-rta-${i + 1}`, {
                subnetId: this.privateSubnets[i].id,
                routeTableId: rt.id,
            }, { parent: this });
            this.privateRouteTables.push(rt);
        }
        // Lambda Security Group
        this.lambdaSecurityGroup = new aws.ec2.SecurityGroup(`${name}-lambda-sg`, {
            name: `${name}-lambda-sg`,
            description: 'Security group for Lambda functions',
            vpcId: this.vpc.id,
            egress: [
                {
                    fromPort: 443,
                    toPort: 443,
                    protocol: 'tcp',
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'HTTPS outbound',
                },
                {
                    fromPort: 80,
                    toPort: 80,
                    protocol: 'tcp',
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'HTTP outbound',
                },
            ],
            tags: { ...args.tags, Name: `${name}-lambda-sg` },
        }, { parent: this });
        // VPC Endpoint Security Group
        this.vpcEndpointSecurityGroup = new aws.ec2.SecurityGroup(`${name}-vpc-endpoint-sg`, {
            name: `${name}-vpc-endpoint-sg`,
            description: 'Security group for VPC endpoints',
            vpcId: this.vpc.id,
            ingress: [
                {
                    fromPort: 443,
                    toPort: 443,
                    protocol: 'tcp',
                    securityGroups: [this.lambdaSecurityGroup.id],
                    description: 'HTTPS from Lambda',
                },
            ],
            tags: { ...args.tags, Name: `${name}-vpc-endpoint-sg` },
        }, { parent: this });
        // Create VPC Endpoints and assign to readonly properties
        const vpcEndpoints = this.createVpcEndpoints(name, args.tags);
        // Use Object.defineProperty to assign to readonly properties
        Object.defineProperty(this, 'dynamodbEndpoint', {
            value: vpcEndpoints.dynamodbEndpoint,
            writable: false,
            enumerable: true,
            configurable: false,
        });
        Object.defineProperty(this, 's3Endpoint', {
            value: vpcEndpoints.s3Endpoint,
            writable: false,
            enumerable: true,
            configurable: false,
        });
        Object.defineProperty(this, 'kinesisEndpoint', {
            value: vpcEndpoints.kinesisEndpoint,
            writable: false,
            enumerable: true,
            configurable: false,
        });
        this.registerOutputs({
            vpcId: this.vpc.id,
            publicSubnetIds: this.publicSubnetIds,
            privateSubnetIds: this.privateSubnetIds,
            lambdaSecurityGroupId: this.lambdaSecurityGroup.id,
            vpcEndpointSecurityGroupId: this.vpcEndpointSecurityGroup.id,
        });
    }
    /**
     * Create VPC endpoints for AWS services
     */
    createVpcEndpoints(name, tags) {
        const region = aws.getRegion();
        // DynamoDB VPC Endpoint (Gateway)
        const dynamodbEndpoint = new aws.ec2.VpcEndpoint(`${name}-dynamodb-endpoint`, {
            vpcId: this.vpc.id,
            serviceName: region.then(r => `com.amazonaws.${r.name}.dynamodb`),
            vpcEndpointType: 'Gateway',
            routeTableIds: this.privateRouteTables.map(rt => rt.id),
            tags: { ...tags, Name: `${name}-dynamodb-endpoint` },
        }, { parent: this });
        // S3 VPC Endpoint (Gateway)
        const s3Endpoint = new aws.ec2.VpcEndpoint(`${name}-s3-endpoint`, {
            vpcId: this.vpc.id,
            serviceName: region.then(r => `com.amazonaws.${r.name}.s3`),
            vpcEndpointType: 'Gateway',
            routeTableIds: this.privateRouteTables.map(rt => rt.id),
            tags: { ...tags, Name: `${name}-s3-endpoint` },
        }, { parent: this });
        // Kinesis VPC Endpoint (Interface)
        const kinesisEndpoint = new aws.ec2.VpcEndpoint(`${name}-kinesis-endpoint`, {
            vpcId: this.vpc.id,
            serviceName: region.then(r => `com.amazonaws.${r.name}.kinesis-streams`),
            vpcEndpointType: 'Interface',
            subnetIds: this.privateSubnetIds,
            securityGroupIds: [this.vpcEndpointSecurityGroup.id],
            privateDnsEnabled: true,
            tags: { ...tags, Name: `${name}-kinesis-endpoint` },
        }, { parent: this });
        return {
            dynamodbEndpoint,
            s3Endpoint,
            kinesisEndpoint,
        };
    }
}
exports.NetworkInfrastructure = NetworkInfrastructure;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmV0d29ya2luZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5ldHdvcmtpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLCtCQUErQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRS9COzs7R0FHRztBQUVILHVEQUF5QztBQUN6QyxpREFBbUM7QUFPbkMsTUFBYSxxQkFBc0IsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQ2pELEdBQUcsQ0FBYztJQUNqQixHQUFHLENBQTBCO0lBQzdCLGFBQWEsQ0FBbUI7SUFDaEMsZUFBZSxDQUEwQjtJQUN6QyxjQUFjLENBQW1CO0lBQ2pDLGdCQUFnQixDQUEwQjtJQUMxQyxPQUFPLENBQWdCO0lBQ3ZCLFdBQVcsQ0FBdUI7SUFDbEMsZ0JBQWdCLENBQXFCO0lBQ3JDLGtCQUFrQixDQUF1QjtJQUN6QyxtQkFBbUIsQ0FBd0I7SUFDM0Msd0JBQXdCLENBQXdCO0lBQ2hELGdCQUFnQixDQUFzQjtJQUN0QyxVQUFVLENBQXNCO0lBQ2hDLGVBQWUsQ0FBc0I7SUFFckQsWUFDRSxJQUFZLEVBQ1osSUFBK0IsRUFDL0IsSUFBc0M7UUFFdEMsS0FBSyxDQUFDLCtCQUErQixFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFdkQsTUFBTTtRQUNOLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FDeEIsR0FBRyxJQUFJLE1BQU0sRUFDYjtZQUNFLFNBQVMsRUFBRSxhQUFhO1lBQ3hCLGtCQUFrQixFQUFFLElBQUk7WUFDeEIsZ0JBQWdCLEVBQUUsSUFBSTtZQUN0QixJQUFJLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEdBQUcsSUFBSSxNQUFNLEVBQUU7U0FDNUMsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLG1CQUFtQjtRQUNuQixJQUFJ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QUFJO1lBQ3ZCLElBQUksRUFBRSxFQUFFLEdBQUcsSUFBSSxFQUFFLElBQUksRUFBRSxHQUFHLElBQUksbUJBQW1CLEVBQUU7U0FDcEQsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLE9BQU87WUFDTCxnQkFBZ0I7WUFDaEIsVUFBVTtZQUNWLGVBQWU7U0FDaEIsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQS9WRCxzREErVkMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBsaWIvY29tcG9uZW50cy9uZXR3b3JraW5nLnRzXG5cbi8qKlxuICogTmV0d29yayBJbmZyYXN0cnVjdHVyZSBDb21wb25lbnRcbiAqIENyZWF0ZXMgVlBDLCBzdWJuZXRzLCBzZWN1cml0eSBncm91cHMsIE5BVCBnYXRld2F5cywgYW5kIFZQQyBlbmRwb2ludHNcbiAqL1xuXG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcblxuZXhwb3J0IGludGVyZmFjZSBOZXR3b3JrSW5mcmFzdHJ1Y3R1cmVBcmdzIHtcbiAgZW52aXJvbm1lbnQ6IHN0cmluZztcbiAgdGFnczogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfTtcbn1cblxuZXhwb3J0IGNsYXNzIE5ldHdvcmtJbmZyYXN0cnVjdHVyZSBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSB2cGM6IGF3cy5lYzIuVnBjO1xuICBwdWJsaWMgcmVhZG9ubHkgaWd3OiBhd3MuZWMyLkludGVybmV0R2F0ZXdheTtcbiAgcHVibGljIHJlYWRvbmx5IHB1YmxpY1N1Ym5ldHM6IGF3cy5lYzIuU3VibmV0W107XG4gIHB1YmxpYyByZWFkb25seSBwdWJsaWNTdWJuZXRJZHM6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPltdO1xuICBwdWJsaWMgcmVhZG9ubHkgcHJpdmF0ZVN1Ym5ldHM6IGF3cy5lYzIuU3VibmV0W107XG4gIHB1YmxpYyByZWFkb25seSBwcml2YXRlU3VibmV0SWRzOiBwdWx1bWkuT3V0cHV0PHN0cmluZz5bXTtcbiAgcHVibGljIHJlYWRvbmx5IG5hdEVpcHM6IGF3cy5lYzIuRWlwW107XG4gIHB1YmxpYyByZWFkb25seSBuYXRHYXRld2F5czogYXdzLmVjMi5OYXRHYXRld2F5W107XG4gIHB1YmxpYyByZWFkb25seSBwdWJsaWNSb3V0ZVRhYmxlOiBhd3MuZWMyLlJvdXRlVGFibGU7XG4gIHB1YmxpYyByZWFkb25seSBwcml2YXRlUm91dGVUYWJsZXM6IGF3cy5lYzIuUm91dGVUYWJsZVtdO1xuICBwdWJsaWMgcmVhZG9ubHkgbGFtYmRhU2VjdXJpdHlHcm91cDogYXdzLmVjMi5TZWN1cml0eUdyb3VwO1xuICBwdWJsaWMgcmVhZG9ubHkgdnBjRW5kcG9pbnRTZWN1cml0eUdyb3VwOiBhd3MuZWMyLlNlY3VyaXR5R3JvdXA7XG4gIHB1YmxpYyByZWFkb25seSBkeW5hbW9kYkVuZHBvaW50OiBhd3MuZWMyLlZwY0VuZHBvaW50O1xuICBwdWJsaWMgcmVhZG9ubHkgczNFbmRwb2ludDogYXdzLmVjMi5WcGNFbmRwb2ludDtcbiAgcHVibGljIHJlYWRvbmx5IGtpbmVzaXNFbmRwb2ludDogYXdzLmVjMi5WcGNFbmRwb2ludDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogTmV0d29ya0luZnJhc3RydWN0dXJlQXJncyxcbiAgICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcignY3VzdG9tOm5ldHdvcms6SW5mcmFzdHJ1Y3R1cmUnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICAvLyBWUENcbiAgICB0aGlzLnZwYyA9IG5ldyBhd3MuZWMyLlZwYyhcbiAgICAgIGAke25hbWV9LXZwY2AsXG4gICAgICB7XG4gICAgICAgIGNpZHJCbG9jazogJzEwLjAuMC4wLzE2JyxcbiAgICAgICAgZW5hYmxlRG5zSG9zdG5hbWVzOiB0cnVlLFxuICAgICAgICBlbmFibGVEbnNTdXBwb3J0OiB0cnVlLFxuICAgICAgICB0YWdzOiB7IC4uLmFyZ3MudGFncywgTmFtZTogYCR7bmFtZX0tdnBjYCB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gSW50ZXJuZXQgR2F0ZXdheVxuICAgIHRoaXMuaWd3ID0gbmV3IGF3cy5lYzIuSW50ZXJuZXRHYXRld2F5KFxuICAgICAgYCR7bmFtZX0taWd3YCxcbiAgICAgIHtcbiAgICAgICAgdnBjSWQ6IHRoaXMudnBjLmlkLFxuICAgICAgICB0YWdzOiB7IC4uLmFyZ3MudGFncywgTmFtZTogYCR7bmFtZX0taWd3YCB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gR2V0IGF2YWlsYWJpbGl0eSB6b25lc1xuICAgIGNvbnN0IGF6cyA9IGF3cy5nZXRBdmFpbGFiaWxpdHlab25lcyh7IHN0YXRlOiAnYXZhaWxhYmxlJyB9KTtcbiAgICBjb25zb2xlLmxvZyhcbiAgICAgIGBERUJVRzogZ2V0X2F2YWlsYWJpbGl0eV96b25lcyByZXR1cm5lZDogJHthenMudGhlbih6b25lcyA9PiB6b25lcy5uYW1lcyl9YFxuICAgICk7XG5cbiAgICAvLyBQdWJsaWMgU3VibmV0c1xuICAgIHRoaXMucHVibGljU3VibmV0cyA9IFtdO1xuICAgIHRoaXMucHVibGljU3VibmV0SWRzID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDI7IGkrKykge1xuICAgICAgY29uc3QgYXpOYW1lID0gYXpzLnRoZW4oem9uZXMgPT4gem9uZXMubmFtZXNbaV0pO1xuXG4gICAgICBjb25zdCBzdWJuZXQgPSBuZXcgYXdzLmVjMi5TdWJuZXQoXG4gICAgICAgIGAke25hbWV9LXB1YmxpYy1zdWJuZXQtJHtpICsgMX1gLFxuICAgICAgICB7XG4gICAgICAgICAgdnBjSWQ6IHRoaXMudnBjLmlkLFxuICAgICAgICAgIGNpZHJCbG9jazogYDEwLjAuJHtpICsgMX0uMC8yNGAsXG4gICAgICAgICAgYXZhaWxhYmlsaXR5Wm9uZTogYXpOYW1lLFxuICAgICAgICAgIG1hcFB1YmxpY0lwT25MYXVuY2g6IHRydWUsXG4gICAgICAgICAgdGFnczoge1xuICAgICAgICAgICAgLi4uYXJncy50YWdzLFxuICAgICAgICAgICAgTmFtZTogYCR7bmFtZX0tcHVibGljLXN1Ym5ldC0ke2kgKyAxfWAsXG4gICAgICAgICAgICBUeXBlOiAnUHVibGljJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICApO1xuXG4gICAgICB0aGlzLnB1YmxpY1N1Ym5ldHMucHVzaChzdWJuZXQpO1xuICAgICAgdGhpcy5wdWJsaWNTdWJuZXRJZHMucHVzaChzdWJuZXQuaWQpO1xuICAgIH1cblxuICAgIC8vIFByaXZhdGUgU3VibmV0c1xuICAgIHRoaXMucHJpdmF0ZVN1Ym5ldHMgPSBbXTtcbiAgICB0aGlzLnByaXZhdGVTdWJuZXRJZHMgPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMjsgaSsrKSB7XG4gICAgICBjb25zdCBhek5hbWUgPSBhenMudGhlbih6b25lcyA9PiB6b25lcy5uYW1lc1tpXSk7XG5cbiAgICAgIGNvbnN0IHN1Ym5ldCA9IG5ldyBhd3MuZWMyLlN1Ym5ldChcbiAgICAgICAgYCR7bmFtZX0tcHJpdmF0ZS1zdWJuZXQtJHtpICsgMX1gLFxuICAgICAgICB7XG4gICAgICAgICAgdnBjSWQ6IHRoaXMudnBjLmlkLFxuICAgICAgICAgIGNpZHJCbG9jazogYDEwLjAuJHtpICsgMTB9LjAvMjRgLFxuICAgICAgICAgIGF2YWlsYWJpbGl0eVpvbmU6IGF6TmFtZSxcbiAgICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgICAuLi5hcmdzLnRhZ3MsXG4gICAgICAgICAgICBOYW1lOiBgJHtuYW1lfS1wcml2YXRlLXN1Ym5ldC0ke2kgKyAxfWAsXG4gICAgICAgICAgICBUeXBlOiAnUHJpdmF0ZScsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICAgKTtcblxuICAgICAgdGhpcy5wcml2YXRlU3VibmV0cy5wdXNoKHN1Ym5ldCk7XG4gICAgICB0aGlzLnByaXZhdGVTdWJuZXRJZHMucHVzaChzdWJuZXQuaWQpO1xuICAgIH1cblxuICAgIC8vIE5BVCBHYXRld2F5IEVJUHNcbiAgICB0aGlzLm5hdEVpcHMgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHVibGljU3VibmV0cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZWlwID0gbmV3IGF3cy5lYzIuRWlwKFxuICAgICAgICBgJHtuYW1lfS1uYXQtZWlwLSR7aSArIDF9YCxcbiAgICAgICAge1xuICAgICAgICAgIGRvbWFpbjogJ3ZwYycsXG4gICAgICAgICAgdGFnczogeyAuLi5hcmdzLnRhZ3MsIE5hbWU6IGAke25hbWV9LW5hdC1laXAtJHtpICsgMX1gIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBwYXJlbnQ6IHRoaXMsXG4gICAgICAgICAgZGVwZW5kc09uOiBbdGhpcy5pZ3ddLFxuICAgICAgICB9XG4gICAgICApO1xuICAgICAgdGhpcy5uYXRFaXBzLnB1c2goZWlwKTtcbiAgICB9XG5cbiAgICAvLyBOQVQgR2F0ZXdheXNcbiAgICB0aGlzLm5hdEdhdGV3YXlzID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnB1YmxpY1N1Ym5ldHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG5hdCA9IG5ldyBhd3MuZWMyLk5hdEdhdGV3YXkoXG4gICAgICAgIGAke25hbWV9LW5hdC0ke2kgKyAxfWAsXG4gICAgICAgIHtcbiAgICAgICAgICBhbGxvY2F0aW9uSWQ6IHRoaXMubmF0RWlwc1tpXS5pZCxcbiAgICAgICAgICBzdWJuZXRJZDogdGhpcy5wdWJsaWNTdWJuZXRzW2ldLmlkLFxuICAgICAgICAgIHRhZ3M6IHsgLi4uYXJncy50YWdzLCBOYW1lOiBgJHtuYW1lfS1uYXQtJHtpICsgMX1gIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICAgICk7XG4gICAgICB0aGlzLm5hdEdhdGV3YXlzLnB1c2gobmF0KTtcbiAgICB9XG5cbiAgICAvLyBQdWJsaWMgUm91dGUgVGFibGVcbiAgICB0aGlzLnB1YmxpY1JvdXRlVGFibGUgPSBuZXcgYXdzLmVjMi5Sb3V0ZVRhYmxlKFxuICAgICAgYCR7bmFtZX0tcHVibGljLXJ0YCxcbiAgICAgIHtcbiAgICAgICAgdnBjSWQ6IHRoaXMudnBjLmlkLFxuICAgICAgICB0YWdzOiB7IC4uLmFyZ3MudGFncywgTmFtZTogYCR7bmFtZX0tcHVibGljLXJ0YCB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gUHVibGljIFJvdXRlXG4gICAgbmV3IGF3cy5lYzIuUm91dGUoXG4gICAgICBgJHtuYW1lfS1wdWJsaWMtcm91dGVgLFxuICAgICAge1xuICAgICAgICByb3V0ZVRhYmxlSWQ6IHRoaXMucHVibGljUm91dGVUYWJsZS5pZCxcbiAgICAgICAgZGVzdGluYXRpb25DaWRyQmxvY2s6ICcwLjAuMC4wLzAnLFxuICAgICAgICBnYXRld2F5SWQ6IHRoaXMuaWd3LmlkLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gUHVibGljIFJvdXRlIFRhYmxlIEFzc29jaWF0aW9uc1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wdWJsaWNTdWJuZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBuZXcgYXdzLmVjMi5Sb3V0ZVRhYmxlQXNzb2NpYXRpb24oXG4gICAgICAgIGAke25hbWV9LXB1YmxpYy1ydGEtJHtpICsgMX1gLFxuICAgICAgICB7XG4gICAgICAgICAgc3VibmV0SWQ6IHRoaXMucHVibGljU3VibmV0c1tpXS5pZCxcbiAgICAgICAgICByb3V0ZVRhYmxlSWQ6IHRoaXMucHVibGljUm91dGVUYWJsZS5pZCxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBQcml2YXRlIFJvdXRlIFRhYmxlc1xuICAgIHRoaXMucHJpdmF0ZVJvdXRlVGFibGVzID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnByaXZhdGVTdWJuZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBydCA9IG5ldyBhd3MuZWMyLlJvdXRlVGFibGUoXG4gICAgICAgIGAke25hbWV9LXByaXZhdGUtcnQtJHtpICsgMX1gLFxuICAgICAgICB7XG4gICAgICAgICAgdnBjSWQ6IHRoaXMudnBjLmlkLFxuICAgICAgICAgIHRhZ3M6IHsgLi4uYXJncy50YWdzLCBOYW1lOiBgJHtuYW1lfS1wcml2YXRlLXJ0LSR7aSArIDF9YCB9LFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICApO1xuXG4gICAgICAvLyBQcml2YXRlIFJvdXRlXG4gICAgICBuZXcgYXdzLmVjMi5Sb3V0ZShcbiAgICAgICAgYCR7bmFtZX0tcHJpdmF0ZS1yb3V0ZS0ke2kgKyAxfWAsXG4gICAgICAgIHtcbiAgICAgICAgICByb3V0ZVRhYmxlSWQ6IHJ0LmlkLFxuICAgICAgICAgIGRlc3RpbmF0aW9uQ2lkckJsb2NrOiAnMC4wLjAuMC8wJyxcbiAgICAgICAgICBuYXRHYXRld2F5SWQ6IHRoaXMubmF0R2F0ZXdheXNbaV0uaWQsXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICAgICk7XG5cbiAgICAgIC8vIFByaXZhdGUgUm91dGUgVGFibGUgQXNzb2NpYXRpb25cbiAgICAgIG5ldyBhd3MuZWMyLlJvdXRlVGFibGVBc3NvY2lhdGlvbihcbiAgICAgICAgYCR7bmFtZX0tcHJpdmF0ZS1ydGEtJHtpICsgMX1gLFxuICAgICAgICB7XG4gICAgICAgICAgc3VibmV0SWQ6IHRoaXMucHJpdmF0ZVN1Ym5ldHNbaV0uaWQsXG4gICAgICAgICAgcm91dGVUYWJsZUlkOiBydC5pZCxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICAgKTtcblxuICAgICAgdGhpcy5wcml2YXRlUm91dGVUYWJsZXMucHVzaChydCk7XG4gICAgfVxuXG4gICAgLy8gTGFtYmRhIFNlY3VyaXR5IEdyb3VwXG4gICAgdGhpcy5sYW1iZGFTZWN1cml0eUdyb3VwID0gbmV3IGF3cy5lYzIuU2VjdXJpdHlHcm91cChcbiAgICAgIGAke25hbWV9LWxhbWJkYS1zZ2AsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGAke25hbWV9LWxhbWJkYS1zZ2AsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnU2VjdXJpdHkgZ3JvdXAgZm9yIExhbWJkYSBmdW5jdGlvbnMnLFxuICAgICAgICB2cGNJZDogdGhpcy52cGMuaWQsXG4gICAgICAgIGVncmVzczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGZyb21Qb3J0OiA0NDMsXG4gICAgICAgICAgICB0b1BvcnQ6IDQ0MyxcbiAgICAgICAgICAgIHByb3RvY29sOiAndGNwJyxcbiAgICAgICAgICAgIGNpZHJCbG9ja3M6IFsnMC4wLjAuMC8wJ10sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0hUVFBTIG91dGJvdW5kJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGZyb21Qb3J0OiA4MCxcbiAgICAgICAgICAgIHRvUG9ydDogODAsXG4gICAgICAgICAgICBwcm90b2NvbDogJ3RjcCcsXG4gICAgICAgICAgICBjaWRyQmxvY2tzOiBbJzAuMC4wLjAvMCddLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdIVFRQIG91dGJvdW5kJyxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICB0YWdzOiB7IC4uLmFyZ3MudGFncywgTmFtZTogYCR7bmFtZX0tbGFtYmRhLXNnYCB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gVlBDIEVuZHBvaW50IFNlY3VyaXR5IEdyb3VwXG4gICAgdGhpcy52cGNFbmRwb2ludFNlY3VyaXR5R3JvdXAgPSBuZXcgYXdzLmVjMi5TZWN1cml0eUdyb3VwKFxuICAgICAgYCR7bmFtZX0tdnBjLWVuZHBvaW50LXNnYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYCR7bmFtZX0tdnBjLWVuZHBvaW50LXNnYCxcbiAgICAgICAgZGVzY3JpcHRpb246ICdTZWN1cml0eSBncm91cCBmb3IgVlBDIGVuZHBvaW50cycsXG4gICAgICAgIHZwY0lkOiB0aGlzLnZwYy5pZCxcbiAgICAgICAgaW5ncmVzczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGZyb21Qb3J0OiA0NDMsXG4gICAgICAgICAgICB0b1BvcnQ6IDQ0MyxcbiAgICAgICAgICAgIHByb3RvY29sOiAndGNwJyxcbiAgICAgICAgICAgIHNlY3VyaXR5R3JvdXBzOiBbdGhpcy5sYW1iZGFTZWN1cml0eUdyb3VwLmlkXSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSFRUUFMgZnJvbSBMYW1iZGEnLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIHRhZ3M6IHsgLi4uYXJncy50YWdzLCBOYW1lOiBgJHtuYW1lfS12cGMtZW5kcG9pbnQtc2dgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgVlBDIEVuZHBvaW50cyBhbmQgYXNzaWduIHRvIHJlYWRvbmx5IHByb3BlcnRpZXNcbiAgICBjb25zdCB2cGNFbmRwb2ludHMgPSB0aGlzLmNyZWF0ZVZwY0VuZHBvaW50cyhuYW1lLCBhcmdzLnRhZ3MpO1xuXG4gICAgLy8gVXNlIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSB0byBhc3NpZ24gdG8gcmVhZG9ubHkgcHJvcGVydGllc1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAnZHluYW1vZGJFbmRwb2ludCcsIHtcbiAgICAgIHZhbHVlOiB2cGNFbmRwb2ludHMuZHluYW1vZGJFbmRwb2ludCxcbiAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIH0pO1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICdzM0VuZHBvaW50Jywge1xuICAgICAgdmFsdWU6IHZwY0VuZHBvaW50cy5zM0VuZHBvaW50LFxuICAgICAgd3JpdGFibGU6IGZhbHNlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgfSk7XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ2tpbmVzaXNFbmRwb2ludCcsIHtcbiAgICAgIHZhbHVlOiB2cGNFbmRwb2ludHMua2luZXNpc0VuZHBvaW50LFxuICAgICAgd3JpdGFibGU6IGZhbHNlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgfSk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICB2cGNJZDogdGhpcy52cGMuaWQsXG4gICAgICBwdWJsaWNTdWJuZXRJZHM6IHRoaXMucHVibGljU3VibmV0SWRzLFxuICAgICAgcHJpdmF0ZVN1Ym5ldElkczogdGhpcy5wcml2YXRlU3VibmV0SWRzLFxuICAgICAgbGFtYmRhU2VjdXJpdHlHcm91cElkOiB0aGlzLmxhbWJkYVNlY3VyaXR5R3JvdXAuaWQsXG4gICAgICB2cGNFbmRwb2ludFNlY3VyaXR5R3JvdXBJZDogdGhpcy52cGNFbmRwb2ludFNlY3VyaXR5R3JvdXAuaWQsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIFZQQyBlbmRwb2ludHMgZm9yIEFXUyBzZXJ2aWNlc1xuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVWcGNFbmRwb2ludHMoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHRhZ3M6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH1cbiAgKToge1xuICAgIGR5bmFtb2RiRW5kcG9pbnQ6IGF3cy5lYzIuVnBjRW5kcG9pbnQ7XG4gICAgczNFbmRwb2ludDogYXdzLmVjMi5WcGNFbmRwb2ludDtcbiAgICBraW5lc2lzRW5kcG9pbnQ6IGF3cy5lYzIuVnBjRW5kcG9pbnQ7XG4gIH0ge1xuICAgIGNvbnN0IHJlZ2lvbiA9IGF3cy5nZXRSZWdpb24oKTtcblxuICAgIC8vIER5bmFtb0RCIFZQQyBFbmRwb2ludCAoR2F0ZXdheSlcbiAgICBjb25zdCBkeW5hbW9kYkVuZHBvaW50ID0gbmV3IGF3cy5lYzIuVnBjRW5kcG9pbnQoXG4gICAgICBgJHtuYW1lfS1keW5hbW9kYi1lbmRwb2ludGAsXG4gICAgICB7XG4gICAgICAgIHZwY0lkOiB0aGlzLnZwYy5pZCxcbiAgICAgICAgc2VydmljZU5hbWU6IHJlZ2lvbi50aGVuKHIgPT4gYGNvbS5hbWF6b25hd3MuJHtyLm5hbWV9LmR5bmFtb2RiYCksXG4gICAgICAgIHZwY0VuZHBvaW50VHlwZTogJ0dhdGV3YXknLFxuICAgICAgICByb3V0ZVRhYmxlSWRzOiB0aGlzLnByaXZhdGVSb3V0ZVRhYmxlcy5tYXAocnQgPT4gcnQuaWQpLFxuICAgICAgICB0YWdzOiB7IC4uLnRhZ3MsIE5hbWU6IGAke25hbWV9LWR5bmFtb2RiLWVuZHBvaW50YCB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gUzMgVlBDIEVuZHBvaW50IChHYXRld2F5KVxuICAgIGNvbnN0IHMzRW5kcG9pbnQgPSBuZXcgYXdzLmVjMi5WcGNFbmRwb2ludChcbiAgICAgIGAke25hbWV9LXMzLWVuZHBvaW50YCxcbiAgICAgIHtcbiAgICAgICAgdnBjSWQ6IHRoaXMudnBjLmlkLFxuICAgICAgICBzZXJ2aWNlTmFtZTogcmVnaW9uLnRoZW4ociA9PiBgY29tLmFtYXpvbmF3cy4ke3IubmFtZX0uczNgKSxcbiAgICAgICAgdnBjRW5kcG9pbnRUeXBlOiAnR2F0ZXdheScsXG4gICAgICAgIHJvdXRlVGFibGVJZHM6IHRoaXMucHJpdmF0ZVJvdXRlVGFibGVzLm1hcChydCA9PiBydC5pZCksXG4gICAgICAgIHRhZ3M6IHsgLi4udGFncywgTmFtZTogYCR7bmFtZX0tczMtZW5kcG9pbnRgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBLaW5lc2lzIFZQQyBFbmRwb2ludCAoSW50ZXJmYWNlKVxuICAgIGNvbnN0IGtpbmVzaXNFbmRwb2ludCA9IG5ldyBhd3MuZWMyLlZwY0VuZHBvaW50KFxuICAgICAgYCR7bmFtZX0ta2luZXNpcy1lbmRwb2ludGAsXG4gICAgICB7XG4gICAgICAgIHZwY0lkOiB0aGlzLnZwYy5pZCxcbiAgICAgICAgc2VydmljZU5hbWU6IHJlZ2lvbi50aGVuKFxuICAgICAgICAgIHIgPT4gYGNvbS5hbWF6b25hd3MuJHtyLm5hbWV9LmtpbmVzaXMtc3RyZWFtc2BcbiAgICAgICAgKSxcbiAgICAgICAgdnBjRW5kcG9pbnRUeXBlOiAnSW50ZXJmYWNlJyxcbiAgICAgICAgc3VibmV0SWRzOiB0aGlzLnByaXZhdGVTdWJuZXRJZHMsXG4gICAgICAgIHNlY3VyaXR5R3JvdXBJZHM6IFt0aGlzLnZwY0VuZHBvaW50U2VjdXJpdHlHcm91cC5pZF0sXG4gICAgICAgIHByaXZhdGVEbnNFbmFibGVkOiB0cnVlLFxuICAgICAgICB0YWdzOiB7IC4uLnRhZ3MsIE5hbWU6IGAke25hbWV9LWtpbmVzaXMtZW5kcG9pbnRgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgZHluYW1vZGJFbmRwb2ludCxcbiAgICAgIHMzRW5kcG9pbnQsXG4gICAgICBraW5lc2lzRW5kcG9pbnQsXG4gICAgfTtcbiAgfVxufVxuIl19