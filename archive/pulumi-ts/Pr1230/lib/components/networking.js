"use strict";
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
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
class NetworkingInfrastructure extends pulumi.ComponentResource {
    vpc;
    igw;
    publicSubnet1;
    publicSubnet2;
    privateSubnet1;
    privateSubnet2;
    eip;
    natGateway;
    publicRouteTable;
    privateRouteTable;
    vpcId;
    privateSubnetIds;
    constructor(name, args, opts) {
        super('tap:components:NetworkingInfrastructure', name, args, opts);
        // Use a default CIDR block for the VPC
        const vpcCidrBlock = '10.0.0.0/16';
        const privateSubnet1Cidr = '10.0.1.0/24';
        const privateSubnet2Cidr = '10.0.2.0/24';
        const publicSubnet1Cidr = '10.0.101.0/24';
        const publicSubnet2Cidr = '10.0.102.0/24';
        // Create the VPC
        const vpcTags = pulumi
            .output(args.tags)
            .apply(t => ({ ...t, Name: `${name}-vpc` }));
        this.vpc = new aws.ec2.Vpc(`${name}-vpc`, {
            cidrBlock: vpcCidrBlock,
            enableDnsHostnames: true,
            tags: vpcTags,
        }, { parent: this });
        // Create an Internet Gateway for the VPC
        const igwTags = pulumi
            .output(args.tags)
            .apply(t => ({ ...t, Name: `${name}-igw` }));
        this.igw = new aws.ec2.InternetGateway(`${name}-igw`, {
            vpcId: this.vpc.id,
            tags: igwTags,
        }, { parent: this, dependsOn: [this.vpc] });
        // Create public subnets
        const publicSubnet1Tags = pulumi
            .output(args.tags)
            .apply(t => ({ ...t, Name: `${name}-public-subnet-1` }));
        this.publicSubnet1 = new aws.ec2.Subnet(`${name}-public-subnet-1`, {
            vpcId: this.vpc.id,
            cidrBlock: publicSubnet1Cidr,
            mapPublicIpOnLaunch: true,
            availabilityZone: pulumi.interpolate `${args.region}a`,
            tags: publicSubnet1Tags,
        }, { parent: this, dependsOn: [this.vpc] });
        const publicSubnet2Tags = pulumi
            .output(args.tags)
            .apply(t => ({ ...t, Name: `${name}-public-subnet-2` }));
        this.publicSubnet2 = new aws.ec2.Subnet(`${name}-public-subnet-2`, {
            vpcId: this.vpc.id,
            cidrBlock: publicSubnet2Cidr,
            mapPublicIpOnLaunch: true,
            availabilityZone: pulumi.interpolate `${args.region}b`,
            tags: publicSubnet2Tags,
        }, { parent: this, dependsOn: [this.vpc] });
        // Create private subnets
        const privateSubnet1Tags = pulumi
            .output(args.tags)
            .apply(t => ({ ...t, Name: `${name}-private-subnet-1` }));
        this.privateSubnet1 = new aws.ec2.Subnet(`${name}-private-subnet-1`, {
            vpcId: this.vpc.id,
            cidrBlock: privateSubnet1Cidr,
            availabilityZone: pulumi.interpolate `${args.region}a`,
            tags: privateSubnet1Tags,
        }, { parent: this, dependsOn: [this.vpc] });
        const privateSubnet2Tags = pulumi
            .output(args.tags)
            .apply(t => ({ ...t, Name: `${name}-private-subnet-2` }));
        this.privateSubnet2 = new aws.ec2.Subnet(`${name}-private-subnet-2`, {
            vpcId: this.vpc.id,
            cidrBlock: privateSubnet2Cidr,
            availabilityZone: pulumi.interpolate `${args.region}b`,
            tags: privateSubnet2Tags,
        }, { parent: this, dependsOn: [this.vpc] });
        // Create a NAT Gateway and EIP for private subnet internet access
        const eipTags = pulumi
            .output(args.tags)
            .apply(t => ({ ...t, Name: `${name}-nat-eip` }));
        this.eip = new aws.ec2.Eip(`${name}-nat-eip`, {
            domain: 'vpc',
            tags: eipTags,
        }, { parent: this, dependsOn: [this.igw] });
        const natGatewayTags = pulumi
            .output(args.tags)
            .apply(t => ({ ...t, Name: `${name}-nat-gateway` }));
        this.natGateway = new aws.ec2.NatGateway(`${name}-nat-gateway`, {
            subnetId: this.publicSubnet1.id,
            allocationId: this.eip.id,
            tags: natGatewayTags,
        }, { parent: this, dependsOn: [this.eip, this.publicSubnet1] });
        // Create a public route table
        const publicRtTags = pulumi
            .output(args.tags)
            .apply(t => ({ ...t, Name: `${name}-public-rt` }));
        this.publicRouteTable = new aws.ec2.RouteTable(`${name}-public-rt`, {
            vpcId: this.vpc.id,
            tags: publicRtTags,
        }, { parent: this, dependsOn: [this.vpc] });
        // Create a private route table
        const privateRtTags = pulumi
            .output(args.tags)
            .apply(t => ({ ...t, Name: `${name}-private-rt` }));
        this.privateRouteTable = new aws.ec2.RouteTable(`${name}-private-rt`, {
            vpcId: this.vpc.id,
            tags: privateRtTags,
        }, { parent: this, dependsOn: [this.vpc] });
        // Create a default route for the public route table
        new aws.ec2.Route(`${name}-public-route`, {
            routeTableId: this.publicRouteTable.id,
            destinationCidrBlock: '0.0.0.0/0',
            gatewayId: this.igw.id,
        }, { parent: this.publicRouteTable });
        // Create a default route for the private route table
        new aws.ec2.Route(`${name}-private-route`, {
            routeTableId: this.privateRouteTable.id,
            destinationCidrBlock: '0.0.0.0/0',
            natGatewayId: this.natGateway.id,
        }, { parent: this.privateRouteTable });
        // Associate subnets with route tables
        new aws.ec2.RouteTableAssociation(`${name}-public-rt-assoc-1`, {
            subnetId: this.publicSubnet1.id,
            routeTableId: this.publicRouteTable.id,
        }, { parent: this.publicRouteTable });
        new aws.ec2.RouteTableAssociation(`${name}-public-rt-assoc-2`, {
            subnetId: this.publicSubnet2.id,
            routeTableId: this.publicRouteTable.id,
        }, { parent: this.publicRouteTable });
        new aws.ec2.RouteTableAssociation(`${name}-private-rt-assoc-1`, {
            subnetId: this.privateSubnet1.id,
            routeTableId: this.privateRouteTable.id,
        }, { parent: this.privateRouteTable });
        new aws.ec2.RouteTableAssociation(`${name}-private-rt-assoc-2`, {
            subnetId: this.privateSubnet2.id,
            routeTableId: this.privateRouteTable.id,
        }, { parent: this.privateRouteTable });
        // Export key outputs to be used by other components
        this.vpcId = this.vpc.id;
        this.privateSubnetIds = pulumi.output([
            this.privateSubnet1.id,
            this.privateSubnet2.id,
        ]);
        this.registerOutputs({
            vpcId: this.vpcId,
            privateSubnetIds: this.privateSubnetIds,
        });
    }
}
exports.NetworkingInfrastructure = NetworkingInfrastructure;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmV0d29ya2luZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5ldHdvcmtpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsdURBQXlDO0FBQ3pDLGlEQUFtQztBQVNuQyxNQUFhLHdCQUF5QixTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFDcEQsR0FBRyxDQUFjO0lBQ2pCLEdBQUcsQ0FBMEI7SUFDN0IsYUFBYSxDQUFpQjtJQUM5QixhQUFhLENBQWlCO0lBQzlCLGNBQWMsQ0FBaUI7SUFDL0IsY0FBYyxDQUFpQjtJQUMvQixHQUFHLENBQWM7SUFDakIsVUFBVSxDQUFxQjtJQUMvQixnQkFBZ0IsQ0FBcUI7SUFDckMsaUJBQWlCLENBQXFCO0lBQ3RDLEtBQUssQ0FBd0I7SUFDN0IsZ0JBQWdCLENBQTBCO0lBRTFELFlBQ0UsSUFBWSxFQUNaLElBQWtDLEVBQ2xDLElBQXNDO1FBRXRDLEtBQUssQ0FBQyx5Q0FBeUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRW5FLHVDQUF1QztRQUN2QyxNQUFNLFlBQVksR0FBRyxhQUFhLENBQUM7UUFDbkMsTUFBTSxrQkFBa0IsR0FBRyxhQUFhLENBQUM7UUFDekMsTUFBTSxrQkFBa0IsR0FBRyxhQUFhLENBQUM7UUFDekMsTUFBTSxpQkFBaUIsR0FBRyxlQUFlLENBQUM7UUFDMUMsTUFBTSxpQkFBaUIsR0FBRyxlQUFlLENBQUM7UUFFMUMsaUJBQWlCO1FBQ2pCLE1BQU0sT0FBTyxHQUFHLE1BQU07YUFDbkIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7YUFDakIsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxHQUFHLElBQUksTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQy9DLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFB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QUM7UUFFRixJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQy9CLEdBQUcsSUFBSSxxQkFBcUIsRUFDNUI7WUFDRSxRQUFRLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxFQUFFO1lBQ2hDLFlBQVksRUFBRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsRUFBRTtTQUN4QyxFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUNuQyxDQUFDO1FBRUYsb0RBQW9EO1FBQ3BELElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFDekIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7WUFDcEMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxFQUFFO1lBQ3RCLElBQUksQ0FBQyxjQUFjLENBQUMsRUFBRTtTQUN2QixDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZUFBZSxDQUFDO1lBQ25CLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztZQUNqQixnQkFBZ0IsRUFBRSxJQUFJLENBQUMsZ0JBQWdCO1NBQ3hDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQTlPRCw0REE4T0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcblxuLy8gRGVmaW5lIHRoZSBhcmd1bWVudHMgZm9yIHRoZSBOZXR3b3JraW5nSW5mcmFzdHJ1Y3R1cmUgY29tcG9uZW50XG5pbnRlcmZhY2UgTmV0d29ya2luZ0luZnJhc3RydWN0dXJlQXJncyB7XG4gIGVudmlyb25tZW50OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgcmVnaW9uOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgdGFncz86IHB1bHVtaS5JbnB1dDx7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9Pjtcbn1cblxuZXhwb3J0IGNsYXNzIE5ldHdvcmtpbmdJbmZyYXN0cnVjdHVyZSBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSB2cGM6IGF3cy5lYzIuVnBjO1xuICBwdWJsaWMgcmVhZG9ubHkgaWd3OiBhd3MuZWMyLkludGVybmV0R2F0ZXdheTtcbiAgcHVibGljIHJlYWRvbmx5IHB1YmxpY1N1Ym5ldDE6IGF3cy5lYzIuU3VibmV0O1xuICBwdWJsaWMgcmVhZG9ubHkgcHVibGljU3VibmV0MjogYXdzLmVjMi5TdWJuZXQ7XG4gIHB1YmxpYyByZWFkb25seSBwcml2YXRlU3VibmV0MTogYXdzLmVjMi5TdWJuZXQ7XG4gIHB1YmxpYyByZWFkb25seSBwcml2YXRlU3VibmV0MjogYXdzLmVjMi5TdWJuZXQ7XG4gIHB1YmxpYyByZWFkb25seSBlaXA6IGF3cy5lYzIuRWlwO1xuICBwdWJsaWMgcmVhZG9ubHkgbmF0R2F0ZXdheTogYXdzLmVjMi5OYXRHYXRld2F5O1xuICBwdWJsaWMgcmVhZG9ubHkgcHVibGljUm91dGVUYWJsZTogYXdzLmVjMi5Sb3V0ZVRhYmxlO1xuICBwdWJsaWMgcmVhZG9ubHkgcHJpdmF0ZVJvdXRlVGFibGU6IGF3cy5lYzIuUm91dGVUYWJsZTtcbiAgcHVibGljIHJlYWRvbmx5IHZwY0lkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBwcml2YXRlU3VibmV0SWRzOiBwdWx1bWkuT3V0cHV0PHN0cmluZ1tdPjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogTmV0d29ya2luZ0luZnJhc3RydWN0dXJlQXJncyxcbiAgICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcigndGFwOmNvbXBvbmVudHM6TmV0d29ya2luZ0luZnJhc3RydWN0dXJlJywgbmFtZSwgYXJncywgb3B0cyk7XG5cbiAgICAvLyBVc2UgYSBkZWZhdWx0IENJRFIgYmxvY2sgZm9yIHRoZSBWUENcbiAgICBjb25zdCB2cGNDaWRyQmxvY2sgPSAnMTAuMC4wLjAvMTYnO1xuICAgIGNvbnN0IHByaXZhdGVTdWJuZXQxQ2lkciA9ICcxMC4wLjEuMC8yNCc7XG4gICAgY29uc3QgcHJpdmF0ZVN1Ym5ldDJDaWRyID0gJzEwLjAuMi4wLzI0JztcbiAgICBjb25zdCBwdWJsaWNTdWJuZXQxQ2lkciA9ICcxMC4wLjEwMS4wLzI0JztcbiAgICBjb25zdCBwdWJsaWNTdWJuZXQyQ2lkciA9ICcxMC4wLjEwMi4wLzI0JztcblxuICAgIC8vIENyZWF0ZSB0aGUgVlBDXG4gICAgY29uc3QgdnBjVGFncyA9IHB1bHVtaVxuICAgICAgLm91dHB1dChhcmdzLnRhZ3MpXG4gICAgICAuYXBwbHkodCA9PiAoeyAuLi50LCBOYW1lOiBgJHtuYW1lfS12cGNgIH0pKTtcbiAgICB0aGlzLnZwYyA9IG5ldyBhd3MuZWMyLlZwYyhcbiAgICAgIGAke25hbWV9LXZwY2AsXG4gICAgICB7XG4gICAgICAgIGNpZHJCbG9jazogdnBjQ2lkckJsb2NrLFxuICAgICAgICBlbmFibGVEbnNIb3N0bmFtZXM6IHRydWUsXG4gICAgICAgIHRhZ3M6IHZwY1RhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgYW4gSW50ZXJuZXQgR2F0ZXdheSBmb3IgdGhlIFZQQ1xuICAgIGNvbnN0IGlnd1RhZ3MgPSBwdWx1bWlcbiAgICAgIC5vdXRwdXQoYXJncy50YWdzKVxuICAgICAgLmFwcGx5KHQgPT4gKHsgLi4udCwgTmFtZTogYCR7bmFtZX0taWd3YCB9KSk7XG4gICAgdGhpcy5pZ3cgPSBuZXcgYXdzLmVjMi5JbnRlcm5ldEdhdGV3YXkoXG4gICAgICBgJHtuYW1lfS1pZ3dgLFxuICAgICAge1xuICAgICAgICB2cGNJZDogdGhpcy52cGMuaWQsXG4gICAgICAgIHRhZ3M6IGlnd1RhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIGRlcGVuZHNPbjogW3RoaXMudnBjXSB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBwdWJsaWMgc3VibmV0c1xuICAgIGNvbnN0IHB1YmxpY1N1Ym5ldDFUYWdzID0gcHVsdW1pXG4gICAgICAub3V0cHV0KGFyZ3MudGFncylcbiAgICAgIC5hcHBseSh0ID0+ICh7IC4uLnQsIE5hbWU6IGAke25hbWV9LXB1YmxpYy1zdWJuZXQtMWAgfSkpO1xuICAgIHRoaXMucHVibGljU3VibmV0MSA9IG5ldyBhd3MuZWMyLlN1Ym5ldChcbiAgICAgIGAke25hbWV9LXB1YmxpYy1zdWJuZXQtMWAsXG4gICAgICB7XG4gICAgICAgIHZwY0lkOiB0aGlzLnZwYy5pZCxcbiAgICAgICAgY2lkckJsb2NrOiBwdWJsaWNTdWJuZXQxQ2lkcixcbiAgICAgICAgbWFwUHVibGljSXBPbkxhdW5jaDogdHJ1ZSxcbiAgICAgICAgYXZhaWxhYmlsaXR5Wm9uZTogcHVsdW1pLmludGVycG9sYXRlYCR7YXJncy5yZWdpb259YWAsXG4gICAgICAgIHRhZ3M6IHB1YmxpY1N1Ym5ldDFUYWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBkZXBlbmRzT246IFt0aGlzLnZwY10gfVxuICAgICk7XG5cbiAgICBjb25zdCBwdWJsaWNTdWJuZXQyVGFncyA9IHB1bHVtaVxuICAgICAgLm91dHB1dChhcmdzLnRhZ3MpXG4gICAgICAuYXBwbHkodCA9PiAoeyAuLi50LCBOYW1lOiBgJHtuYW1lfS1wdWJsaWMtc3VibmV0LTJgIH0pKTtcbiAgICB0aGlzLnB1YmxpY1N1Ym5ldDIgPSBuZXcgYXdzLmVjMi5TdWJuZXQoXG4gICAgICBgJHtuYW1lfS1wdWJsaWMtc3VibmV0LTJgLFxuICAgICAge1xuICAgICAgICB2cGNJZDogdGhpcy52cGMuaWQsXG4gICAgICAgIGNpZHJCbG9jazogcHVibGljU3VibmV0MkNpZHIsXG4gICAgICAgIG1hcFB1YmxpY0lwT25MYXVuY2g6IHRydWUsXG4gICAgICAgIGF2YWlsYWJpbGl0eVpvbmU6IHB1bHVtaS5pbnRlcnBvbGF0ZWAke2FyZ3MucmVnaW9ufWJgLFxuICAgICAgICB0YWdzOiBwdWJsaWNTdWJuZXQyVGFncyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgZGVwZW5kc09uOiBbdGhpcy52cGNdIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIHByaXZhdGUgc3VibmV0c1xuICAgIGNvbnN0IHByaXZhdGVTdWJuZXQxVGFncyA9IHB1bHVtaVxuICAgICAgLm91dHB1dChhcmdzLnRhZ3MpXG4gICAgICAuYXBwbHkodCA9PiAoeyAuLi50LCBOYW1lOiBgJHtuYW1lfS1wcml2YXRlLXN1Ym5ldC0xYCB9KSk7XG4gICAgdGhpcy5wcml2YXRlU3VibmV0MSA9IG5ldyBhd3MuZWMyLlN1Ym5ldChcbiAgICAgIGAke25hbWV9LXByaXZhdGUtc3VibmV0LTFgLFxuICAgICAge1xuICAgICAgICB2cGNJZDogdGhpcy52cGMuaWQsXG4gICAgICAgIGNpZHJCbG9jazogcHJpdmF0ZVN1Ym5ldDFDaWRyLFxuICAgICAgICBhdmFpbGFiaWxpdHlab25lOiBwdWx1bWkuaW50ZXJwb2xhdGVgJHthcmdzLnJlZ2lvbn1hYCxcbiAgICAgICAgdGFnczogcHJpdmF0ZVN1Ym5ldDFUYWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBkZXBlbmRzT246IFt0aGlzLnZwY10gfVxuICAgICk7XG5cbiAgICBjb25zdCBwcml2YXRlU3VibmV0MlRhZ3MgPSBwdWx1bWlcbiAgICAgIC5vdXRwdXQoYXJncy50YWdzKVxuICAgICAgLmFwcGx5KHQgPT4gKHsgLi4udCwgTmFtZTogYCR7bmFtZX0tcHJpdmF0ZS1zdWJuZXQtMmAgfSkpO1xuICAgIHRoaXMucHJpdmF0ZVN1Ym5ldDIgPSBuZXcgYXdzLmVjMi5TdWJuZXQoXG4gICAgICBgJHtuYW1lfS1wcml2YXRlLXN1Ym5ldC0yYCxcbiAgICAgIHtcbiAgICAgICAgdnBjSWQ6IHRoaXMudnBjLmlkLFxuICAgICAgICBjaWRyQmxvY2s6IHByaXZhdGVTdWJuZXQyQ2lkcixcbiAgICAgICAgYXZhaWxhYmlsaXR5Wm9uZTogcHVsdW1pLmludGVycG9sYXRlYCR7YXJncy5yZWdpb259YmAsXG4gICAgICAgIHRhZ3M6IHByaXZhdGVTdWJuZXQyVGFncyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgZGVwZW5kc09uOiBbdGhpcy52cGNdIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIGEgTkFUIEdhdGV3YXkgYW5kIEVJUCBmb3IgcHJpdmF0ZSBzdWJuZXQgaW50ZXJuZXQgYWNjZXNzXG4gICAgY29uc3QgZWlwVGFncyA9IHB1bHVtaVxuICAgICAgLm91dHB1dChhcmdzLnRhZ3MpXG4gICAgICAuYXBwbHkodCA9PiAoeyAuLi50LCBOYW1lOiBgJHtuYW1lfS1uYXQtZWlwYCB9KSk7XG4gICAgdGhpcy5laXAgPSBuZXcgYXdzLmVjMi5FaXAoXG4gICAgICBgJHtuYW1lfS1uYXQtZWlwYCxcbiAgICAgIHtcbiAgICAgICAgZG9tYWluOiAndnBjJyxcbiAgICAgICAgdGFnczogZWlwVGFncyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgZGVwZW5kc09uOiBbdGhpcy5pZ3ddIH1cbiAgICApO1xuXG4gICAgY29uc3QgbmF0R2F0ZXdheVRhZ3MgPSBwdWx1bWlcbiAgICAgIC5vdXRwdXQoYXJncy50YWdzKVxuICAgICAgLmFwcGx5KHQgPT4gKHsgLi4udCwgTmFtZTogYCR7bmFtZX0tbmF0LWdhdGV3YXlgIH0pKTtcbiAgICB0aGlzLm5hdEdhdGV3YXkgPSBuZXcgYXdzLmVjMi5OYXRHYXRld2F5KFxuICAgICAgYCR7bmFtZX0tbmF0LWdhdGV3YXlgLFxuICAgICAge1xuICAgICAgICBzdWJuZXRJZDogdGhpcy5wdWJsaWNTdWJuZXQxLmlkLFxuICAgICAgICBhbGxvY2F0aW9uSWQ6IHRoaXMuZWlwLmlkLFxuICAgICAgICB0YWdzOiBuYXRHYXRld2F5VGFncyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgZGVwZW5kc09uOiBbdGhpcy5laXAsIHRoaXMucHVibGljU3VibmV0MV0gfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgYSBwdWJsaWMgcm91dGUgdGFibGVcbiAgICBjb25zdCBwdWJsaWNSdFRhZ3MgPSBwdWx1bWlcbiAgICAgIC5vdXRwdXQoYXJncy50YWdzKVxuICAgICAgLmFwcGx5KHQgPT4gKHsgLi4udCwgTmFtZTogYCR7bmFtZX0tcHVibGljLXJ0YCB9KSk7XG4gICAgdGhpcy5wdWJsaWNSb3V0ZVRhYmxlID0gbmV3IGF3cy5lYzIuUm91dGVUYWJsZShcbiAgICAgIGAke25hbWV9LXB1YmxpYy1ydGAsXG4gICAgICB7XG4gICAgICAgIHZwY0lkOiB0aGlzLnZwYy5pZCxcbiAgICAgICAgdGFnczogcHVibGljUnRUYWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBkZXBlbmRzT246IFt0aGlzLnZwY10gfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgYSBwcml2YXRlIHJvdXRlIHRhYmxlXG4gICAgY29uc3QgcHJpdmF0ZVJ0VGFncyA9IHB1bHVtaVxuICAgICAgLm91dHB1dChhcmdzLnRhZ3MpXG4gICAgICAuYXBwbHkodCA9PiAoeyAuLi50LCBOYW1lOiBgJHtuYW1lfS1wcml2YXRlLXJ0YCB9KSk7XG4gICAgdGhpcy5wcml2YXRlUm91dGVUYWJsZSA9IG5ldyBhd3MuZWMyLlJvdXRlVGFibGUoXG4gICAgICBgJHtuYW1lfS1wcml2YXRlLXJ0YCxcbiAgICAgIHtcbiAgICAgICAgdnBjSWQ6IHRoaXMudnBjLmlkLFxuICAgICAgICB0YWdzOiBwcml2YXRlUnRUYWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBkZXBlbmRzT246IFt0aGlzLnZwY10gfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgYSBkZWZhdWx0IHJvdXRlIGZvciB0aGUgcHVibGljIHJvdXRlIHRhYmxlXG4gICAgbmV3IGF3cy5lYzIuUm91dGUoXG4gICAgICBgJHtuYW1lfS1wdWJsaWMtcm91dGVgLFxuICAgICAge1xuICAgICAgICByb3V0ZVRhYmxlSWQ6IHRoaXMucHVibGljUm91dGVUYWJsZS5pZCxcbiAgICAgICAgZGVzdGluYXRpb25DaWRyQmxvY2s6ICcwLjAuMC4wLzAnLFxuICAgICAgICBnYXRld2F5SWQ6IHRoaXMuaWd3LmlkLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLnB1YmxpY1JvdXRlVGFibGUgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgYSBkZWZhdWx0IHJvdXRlIGZvciB0aGUgcHJpdmF0ZSByb3V0ZSB0YWJsZVxuICAgIG5ldyBhd3MuZWMyLlJvdXRlKFxuICAgICAgYCR7bmFtZX0tcHJpdmF0ZS1yb3V0ZWAsXG4gICAgICB7XG4gICAgICAgIHJvdXRlVGFibGVJZDogdGhpcy5wcml2YXRlUm91dGVUYWJsZS5pZCxcbiAgICAgICAgZGVzdGluYXRpb25DaWRyQmxvY2s6ICcwLjAuMC4wLzAnLFxuICAgICAgICBuYXRHYXRld2F5SWQ6IHRoaXMubmF0R2F0ZXdheS5pZCxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcy5wcml2YXRlUm91dGVUYWJsZSB9XG4gICAgKTtcblxuICAgIC8vIEFzc29jaWF0ZSBzdWJuZXRzIHdpdGggcm91dGUgdGFibGVzXG4gICAgbmV3IGF3cy5lYzIuUm91dGVUYWJsZUFzc29jaWF0aW9uKFxuICAgICAgYCR7bmFtZX0tcHVibGljLXJ0LWFzc29jLTFgLFxuICAgICAge1xuICAgICAgICBzdWJuZXRJZDogdGhpcy5wdWJsaWNTdWJuZXQxLmlkLFxuICAgICAgICByb3V0ZVRhYmxlSWQ6IHRoaXMucHVibGljUm91dGVUYWJsZS5pZCxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcy5wdWJsaWNSb3V0ZVRhYmxlIH1cbiAgICApO1xuXG4gICAgbmV3IGF3cy5lYzIuUm91dGVUYWJsZUFzc29jaWF0aW9uKFxuICAgICAgYCR7bmFtZX0tcHVibGljLXJ0LWFzc29jLTJgLFxuICAgICAge1xuICAgICAgICBzdWJuZXRJZDogdGhpcy5wdWJsaWNTdWJuZXQyLmlkLFxuICAgICAgICByb3V0ZVRhYmxlSWQ6IHRoaXMucHVibGljUm91dGVUYWJsZS5pZCxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcy5wdWJsaWNSb3V0ZVRhYmxlIH1cbiAgICApO1xuXG4gICAgbmV3IGF3cy5lYzIuUm91dGVUYWJsZUFzc29jaWF0aW9uKFxuICAgICAgYCR7bmFtZX0tcHJpdmF0ZS1ydC1hc3NvYy0xYCxcbiAgICAgIHtcbiAgICAgICAgc3VibmV0SWQ6IHRoaXMucHJpdmF0ZVN1Ym5ldDEuaWQsXG4gICAgICAgIHJvdXRlVGFibGVJZDogdGhpcy5wcml2YXRlUm91dGVUYWJsZS5pZCxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcy5wcml2YXRlUm91dGVUYWJsZSB9XG4gICAgKTtcblxuICAgIG5ldyBhd3MuZWMyLlJvdXRlVGFibGVBc3NvY2lhdGlvbihcbiAgICAgIGAke25hbWV9LXByaXZhdGUtcnQtYXNzb2MtMmAsXG4gICAgICB7XG4gICAgICAgIHN1Ym5ldElkOiB0aGlzLnByaXZhdGVTdWJuZXQyLmlkLFxuICAgICAgICByb3V0ZVRhYmxlSWQ6IHRoaXMucHJpdmF0ZVJvdXRlVGFibGUuaWQsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMucHJpdmF0ZVJvdXRlVGFibGUgfVxuICAgICk7XG5cbiAgICAvLyBFeHBvcnQga2V5IG91dHB1dHMgdG8gYmUgdXNlZCBieSBvdGhlciBjb21wb25lbnRzXG4gICAgdGhpcy52cGNJZCA9IHRoaXMudnBjLmlkO1xuICAgIHRoaXMucHJpdmF0ZVN1Ym5ldElkcyA9IHB1bHVtaS5vdXRwdXQoW1xuICAgICAgdGhpcy5wcml2YXRlU3VibmV0MS5pZCxcbiAgICAgIHRoaXMucHJpdmF0ZVN1Ym5ldDIuaWQsXG4gICAgXSk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICB2cGNJZDogdGhpcy52cGNJZCxcbiAgICAgIHByaXZhdGVTdWJuZXRJZHM6IHRoaXMucHJpdmF0ZVN1Ym5ldElkcyxcbiAgICB9KTtcbiAgfVxufVxuIl19