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
exports.VpcStack = void 0;
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
class VpcStack extends pulumi.ComponentResource {
    vpcId;
    publicSubnetIds;
    privateSubnetIds;
    constructor(name, args, opts) {
        super('tap:vpc:VpcStack', name, args, opts);
        const vpcCidr = args.vpcCidr || '10.5.0.0/16';
        const enableFlowLogs = args.enableFlowLogs !== false;
        const availabilityZones = aws.getAvailabilityZones({
            state: 'available',
        });
        // Create VPC
        const vpc = new aws.ec2.Vpc(`${name}-vpc-${args.environmentSuffix}`, {
            cidrBlock: vpcCidr,
            enableDnsHostnames: true,
            enableDnsSupport: true,
            tags: {
                Name: `${name}-vpc-${args.environmentSuffix}`,
                ...args.tags,
            },
        }, { parent: this });
        // Create Internet Gateway
        const igw = new aws.ec2.InternetGateway(`${name}-igw-${args.environmentSuffix}`, {
            vpcId: vpc.id,
            tags: {
                Name: `${name}-igw-${args.environmentSuffix}`,
                ...args.tags,
            },
        }, { parent: this });
        // Create public subnets
        const publicSubnets = [];
        const privateSubnets = [];
        availabilityZones.then(azs => {
            for (let i = 0; i < Math.min(2, azs.names.length); i++) {
                const publicSubnet = new aws.ec2.Subnet(`${name}-public-subnet-${i}-${args.environmentSuffix}`, {
                    vpcId: vpc.id,
                    cidrBlock: `10.5.${i * 2}.0/24`,
                    availabilityZone: azs.names[i],
                    mapPublicIpOnLaunch: true,
                    tags: {
                        Name: `${name}-public-subnet-${i}-${args.environmentSuffix}`,
                        Type: 'Public',
                        ...args.tags,
                    },
                }, { parent: this });
                publicSubnets.push(publicSubnet);
                const privateSubnet = new aws.ec2.Subnet(`${name}-private-subnet-${i}-${args.environmentSuffix}`, {
                    vpcId: vpc.id,
                    cidrBlock: `10.5.${i * 2 + 1}.0/24`,
                    availabilityZone: azs.names[i],
                    tags: {
                        Name: `${name}-private-subnet-${i}-${args.environmentSuffix}`,
                        Type: 'Private',
                        ...args.tags,
                    },
                }, { parent: this });
                privateSubnets.push(privateSubnet);
            }
        });
        // Create NAT Gateways for private subnets
        const natGateways = [];
        publicSubnets.forEach((subnet, i) => {
            const eip = new aws.ec2.Eip(`${name}-nat-eip-${i}-${args.environmentSuffix}`, {
                domain: 'vpc',
                tags: {
                    Name: `${name}-nat-eip-${i}-${args.environmentSuffix}`,
                    ...args.tags,
                },
            }, { parent: this });
            const natGateway = new aws.ec2.NatGateway(`${name}-nat-${i}-${args.environmentSuffix}`, {
                allocationId: eip.id,
                subnetId: subnet.id,
                tags: {
                    Name: `${name}-nat-${i}-${args.environmentSuffix}`,
                    ...args.tags,
                },
            }, { parent: this });
            natGateways.push(natGateway);
        });
        // Create route tables
        const publicRouteTable = new aws.ec2.RouteTable(`${name}-public-rt-${args.environmentSuffix}`, {
            vpcId: vpc.id,
            tags: {
                Name: `${name}-public-rt-${args.environmentSuffix}`,
                ...args.tags,
            },
        }, { parent: this });
        new aws.ec2.Route(`${name}-public-route-${args.environmentSuffix}`, {
            routeTableId: publicRouteTable.id,
            destinationCidrBlock: '0.0.0.0/0',
            gatewayId: igw.id,
        }, { parent: this });
        publicSubnets.forEach((subnet, i) => {
            new aws.ec2.RouteTableAssociation(`${name}-public-rta-${i}-${args.environmentSuffix}`, {
                subnetId: subnet.id,
                routeTableId: publicRouteTable.id,
            }, { parent: this });
        });
        privateSubnets.forEach((subnet, i) => {
            const privateRouteTable = new aws.ec2.RouteTable(`${name}-private-rt-${i}-${args.environmentSuffix}`, {
                vpcId: vpc.id,
                tags: {
                    Name: `${name}-private-rt-${i}-${args.environmentSuffix}`,
                    ...args.tags,
                },
            }, { parent: this });
            new aws.ec2.Route(`${name}-private-route-${i}-${args.environmentSuffix}`, {
                routeTableId: privateRouteTable.id,
                destinationCidrBlock: '0.0.0.0/0',
                natGatewayId: natGateways[i].id,
            }, { parent: this });
            new aws.ec2.RouteTableAssociation(`${name}-private-rta-${i}-${args.environmentSuffix}`, {
                subnetId: subnet.id,
                routeTableId: privateRouteTable.id,
            }, { parent: this });
        });
        // Enable VPC Flow Logs (conditionally)
        if (enableFlowLogs) {
            const flowLogRole = new aws.iam.Role(`${name}-flow-log-role-${args.environmentSuffix}`, {
                assumeRolePolicy: JSON.stringify({
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Action: 'sts:AssumeRole',
                            Effect: 'Allow',
                            Principal: {
                                Service: 'vpc-flow-logs.amazonaws.com',
                            },
                        },
                    ],
                }),
                tags: args.tags,
            }, { parent: this });
            new aws.iam.RolePolicyAttachment(`${name}-flow-log-policy-${args.environmentSuffix}`, {
                role: flowLogRole.name,
                policyArn: 'arn:aws:iam::aws:policy/CloudWatchLogsFullAccess',
            }, { parent: this });
            const flowLogGroup = new aws.cloudwatch.LogGroup(`${name}-flow-logs-${args.environmentSuffix}`, {
                retentionInDays: 7,
                tags: args.tags,
            }, { parent: this });
            new aws.ec2.FlowLog(`${name}-flow-log-${args.environmentSuffix}`, {
                iamRoleArn: flowLogRole.arn,
                logDestinationType: 'cloud-watch-logs',
                logDestination: flowLogGroup.arn,
                trafficType: 'ALL',
                vpcId: vpc.id,
                tags: {
                    Name: `${name}-flow-log-${args.environmentSuffix}`,
                    ...args.tags,
                },
            }, { parent: this });
        }
        this.vpcId = vpc.id;
        this.publicSubnetIds = pulumi.output(publicSubnets.map(s => s.id));
        this.privateSubnetIds = pulumi.output(privateSubnets.map(s => s.id));
        this.registerOutputs({
            vpcId: this.vpcId,
            publicSubnetIds: this.publicSubnetIds,
            privateSubnetIds: this.privateSubnetIds,
        });
    }
}
exports.VpcStack = VpcStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidnBjLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL3ZwYy1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx1REFBeUM7QUFDekMsaURBQW1DO0FBVW5DLE1BQWEsUUFBUyxTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFDcEMsS0FBSyxDQUF3QjtJQUM3QixlQUFlLENBQTBCO0lBQ3pDLGdCQUFnQixDQUEwQjtJQUUxRCxZQUFZLElBQVksRUFBRSxJQUFrQixFQUFFLElBQXNCO1FBQ2xFLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTVDLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLElBQUksYUFBYSxDQUFDO1FBQzlDLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxjQUFjLEtBQUssS0FBSyxDQUFDO1FBRXJELE1BQU0saUJBQWlCLEdBQUcsR0FBRyxDQUFDLG9CQUFvQixDQUFDO1lBQ2pELEtBQUssRUFBRSxXQUFXO1NBQ25CLENBQUMsQ0FBQztRQUVILGFBQWE7UUFDYixNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUN6QixHQUFHLElBQUksUUFBUSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsRUFDdkM7WUFDRSxTQUFTLEVBQUUsT0FBTztZQUNsQixrQkFBa0IsRUFBRSxJQUFJO1lBQ3hCLGdCQUFnQixFQUFFLElBQUk7WUFDdEIsSUFBSSxFQUFFO2dCQUNKLElBQUksRUFBRSxHQUFHLElBQUksUUFBUSxJQUFJLENBQUMsaUJBQWlCLEVBQUU7Z0JBQzdDLEdBQUcsSUFBSSxDQUFDLElBQUk7YUFDYjtTQUNGLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRiwwQkFBMEI7UUFDMUIsTUFBTSxHQUFHLEdB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QUFFLElBQUksQ0FBQyxLQUFLO1lBQ2pCLGVBQWUsRUFBRSxJQUFJLENBQUMsZUFBZTtZQUNyQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsZ0JBQWdCO1NBQ3hDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXhQRCw0QkF3UEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcbmltcG9ydCB7IFJlc291cmNlT3B0aW9ucyB9IGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcblxuZXhwb3J0IGludGVyZmFjZSBWcGNTdGFja0FyZ3Mge1xuICBlbnZpcm9ubWVudFN1ZmZpeDogc3RyaW5nO1xuICB2cGNDaWRyPzogc3RyaW5nO1xuICBlbmFibGVGbG93TG9ncz86IGJvb2xlYW47XG4gIHRhZ3M/OiBwdWx1bWkuSW5wdXQ8eyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfT47XG59XG5cbmV4cG9ydCBjbGFzcyBWcGNTdGFjayBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSB2cGNJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgcHVibGljU3VibmV0SWRzOiBwdWx1bWkuT3V0cHV0PHN0cmluZ1tdPjtcbiAgcHVibGljIHJlYWRvbmx5IHByaXZhdGVTdWJuZXRJZHM6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nW10+O1xuXG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogVnBjU3RhY2tBcmdzLCBvcHRzPzogUmVzb3VyY2VPcHRpb25zKSB7XG4gICAgc3VwZXIoJ3RhcDp2cGM6VnBjU3RhY2snLCBuYW1lLCBhcmdzLCBvcHRzKTtcblxuICAgIGNvbnN0IHZwY0NpZHIgPSBhcmdzLnZwY0NpZHIgfHwgJzEwLjUuMC4wLzE2JztcbiAgICBjb25zdCBlbmFibGVGbG93TG9ncyA9IGFyZ3MuZW5hYmxlRmxvd0xvZ3MgIT09IGZhbHNlO1xuXG4gICAgY29uc3QgYXZhaWxhYmlsaXR5Wm9uZXMgPSBhd3MuZ2V0QXZhaWxhYmlsaXR5Wm9uZXMoe1xuICAgICAgc3RhdGU6ICdhdmFpbGFibGUnLFxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIFZQQ1xuICAgIGNvbnN0IHZwYyA9IG5ldyBhd3MuZWMyLlZwYyhcbiAgICAgIGAke25hbWV9LXZwYy0ke2FyZ3MuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgY2lkckJsb2NrOiB2cGNDaWRyLFxuICAgICAgICBlbmFibGVEbnNIb3N0bmFtZXM6IHRydWUsXG4gICAgICAgIGVuYWJsZURuc1N1cHBvcnQ6IHRydWUsXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBOYW1lOiBgJHtuYW1lfS12cGMtJHthcmdzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgLi4uYXJncy50YWdzLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIEludGVybmV0IEdhdGV3YXlcbiAgICBjb25zdCBpZ3cgPSBuZXcgYXdzLmVjMi5JbnRlcm5ldEdhdGV3YXkoXG4gICAgICBgJHtuYW1lfS1pZ3ctJHthcmdzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIHZwY0lkOiB2cGMuaWQsXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBOYW1lOiBgJHtuYW1lfS1pZ3ctJHthcmdzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgLi4uYXJncy50YWdzLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIHB1YmxpYyBzdWJuZXRzXG4gICAgY29uc3QgcHVibGljU3VibmV0czogYXdzLmVjMi5TdWJuZXRbXSA9IFtdO1xuICAgIGNvbnN0IHByaXZhdGVTdWJuZXRzOiBhd3MuZWMyLlN1Ym5ldFtdID0gW107XG5cbiAgICBhdmFpbGFiaWxpdHlab25lcy50aGVuKGF6cyA9PiB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IE1hdGgubWluKDIsIGF6cy5uYW1lcy5sZW5ndGgpOyBpKyspIHtcbiAgICAgICAgY29uc3QgcHVibGljU3VibmV0ID0gbmV3IGF3cy5lYzIuU3VibmV0KFxuICAgICAgICAgIGAke25hbWV9LXB1YmxpYy1zdWJuZXQtJHtpfS0ke2FyZ3MuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICB7XG4gICAgICAgICAgICB2cGNJZDogdnBjLmlkLFxuICAgICAgICAgICAgY2lkckJsb2NrOiBgMTAuNS4ke2kgKiAyfS4wLzI0YCxcbiAgICAgICAgICAgIGF2YWlsYWJpbGl0eVpvbmU6IGF6cy5uYW1lc1tpXSxcbiAgICAgICAgICAgIG1hcFB1YmxpY0lwT25MYXVuY2g6IHRydWUsXG4gICAgICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgICAgIE5hbWU6IGAke25hbWV9LXB1YmxpYy1zdWJuZXQtJHtpfS0ke2FyZ3MuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICAgICAgVHlwZTogJ1B1YmxpYycsXG4gICAgICAgICAgICAgIC4uLmFyZ3MudGFncyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICAgICk7XG4gICAgICAgIHB1YmxpY1N1Ym5ldHMucHVzaChwdWJsaWNTdWJuZXQpO1xuXG4gICAgICAgIGNvbnN0IHByaXZhdGVTdWJuZXQgPSBuZXcgYXdzLmVjMi5TdWJuZXQoXG4gICAgICAgICAgYCR7bmFtZX0tcHJpdmF0ZS1zdWJuZXQtJHtpfS0ke2FyZ3MuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICB7XG4gICAgICAgICAgICB2cGNJZDogdnBjLmlkLFxuICAgICAgICAgICAgY2lkckJsb2NrOiBgMTAuNS4ke2kgKiAyICsgMX0uMC8yNGAsXG4gICAgICAgICAgICBhdmFpbGFiaWxpdHlab25lOiBhenMubmFtZXNbaV0sXG4gICAgICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgICAgIE5hbWU6IGAke25hbWV9LXByaXZhdGUtc3VibmV0LSR7aX0tJHthcmdzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgICAgIFR5cGU6ICdQcml2YXRlJyxcbiAgICAgICAgICAgICAgLi4uYXJncy50YWdzLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICAgICAgKTtcbiAgICAgICAgcHJpdmF0ZVN1Ym5ldHMucHVzaChwcml2YXRlU3VibmV0KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBOQVQgR2F0ZXdheXMgZm9yIHByaXZhdGUgc3VibmV0c1xuICAgIGNvbnN0IG5hdEdhdGV3YXlzOiBhd3MuZWMyLk5hdEdhdGV3YXlbXSA9IFtdO1xuICAgIHB1YmxpY1N1Ym5ldHMuZm9yRWFjaCgoc3VibmV0LCBpKSA9PiB7XG4gICAgICBjb25zdCBlaXAgPSBuZXcgYXdzLmVjMi5FaXAoXG4gICAgICAgIGAke25hbWV9LW5hdC1laXAtJHtpfS0ke2FyZ3MuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAge1xuICAgICAgICAgIGRvbWFpbjogJ3ZwYycsXG4gICAgICAgICAgdGFnczoge1xuICAgICAgICAgICAgTmFtZTogYCR7bmFtZX0tbmF0LWVpcC0ke2l9LSR7YXJncy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgICAgLi4uYXJncy50YWdzLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IG5hdEdhdGV3YXkgPSBuZXcgYXdzLmVjMi5OYXRHYXRld2F5KFxuICAgICAgICBgJHtuYW1lfS1uYXQtJHtpfS0ke2FyZ3MuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAge1xuICAgICAgICAgIGFsbG9jYXRpb25JZDogZWlwLmlkLFxuICAgICAgICAgIHN1Ym5ldElkOiBzdWJuZXQuaWQsXG4gICAgICAgICAgdGFnczoge1xuICAgICAgICAgICAgTmFtZTogYCR7bmFtZX0tbmF0LSR7aX0tJHthcmdzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgICAuLi5hcmdzLnRhZ3MsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICAgKTtcbiAgICAgIG5hdEdhdGV3YXlzLnB1c2gobmF0R2F0ZXdheSk7XG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgcm91dGUgdGFibGVzXG4gICAgY29uc3QgcHVibGljUm91dGVUYWJsZSA9IG5ldyBhd3MuZWMyLlJvdXRlVGFibGUoXG4gICAgICBgJHtuYW1lfS1wdWJsaWMtcnQtJHthcmdzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIHZwY0lkOiB2cGMuaWQsXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBOYW1lOiBgJHtuYW1lfS1wdWJsaWMtcnQtJHthcmdzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgLi4uYXJncy50YWdzLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgbmV3IGF3cy5lYzIuUm91dGUoXG4gICAgICBgJHtuYW1lfS1wdWJsaWMtcm91dGUtJHthcmdzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIHJvdXRlVGFibGVJZDogcHVibGljUm91dGVUYWJsZS5pZCxcbiAgICAgICAgZGVzdGluYXRpb25DaWRyQmxvY2s6ICcwLjAuMC4wLzAnLFxuICAgICAgICBnYXRld2F5SWQ6IGlndy5pZCxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIHB1YmxpY1N1Ym5ldHMuZm9yRWFjaCgoc3VibmV0LCBpKSA9PiB7XG4gICAgICBuZXcgYXdzLmVjMi5Sb3V0ZVRhYmxlQXNzb2NpYXRpb24oXG4gICAgICAgIGAke25hbWV9LXB1YmxpYy1ydGEtJHtpfS0ke2FyZ3MuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAge1xuICAgICAgICAgIHN1Ym5ldElkOiBzdWJuZXQuaWQsXG4gICAgICAgICAgcm91dGVUYWJsZUlkOiBwdWJsaWNSb3V0ZVRhYmxlLmlkLFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgcHJpdmF0ZVN1Ym5ldHMuZm9yRWFjaCgoc3VibmV0LCBpKSA9PiB7XG4gICAgICBjb25zdCBwcml2YXRlUm91dGVUYWJsZSA9IG5ldyBhd3MuZWMyLlJvdXRlVGFibGUoXG4gICAgICAgIGAke25hbWV9LXByaXZhdGUtcnQtJHtpfS0ke2FyZ3MuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAge1xuICAgICAgICAgIHZwY0lkOiB2cGMuaWQsXG4gICAgICAgICAgdGFnczoge1xuICAgICAgICAgICAgTmFtZTogYCR7bmFtZX0tcHJpdmF0ZS1ydC0ke2l9LSR7YXJncy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgICAgLi4uYXJncy50YWdzLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICAgICk7XG5cbiAgICAgIG5ldyBhd3MuZWMyLlJvdXRlKFxuICAgICAgICBgJHtuYW1lfS1wcml2YXRlLXJvdXRlLSR7aX0tJHthcmdzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHtcbiAgICAgICAgICByb3V0ZVRhYmxlSWQ6IHByaXZhdGVSb3V0ZVRhYmxlLmlkLFxuICAgICAgICAgIGRlc3RpbmF0aW9uQ2lkckJsb2NrOiAnMC4wLjAuMC8wJyxcbiAgICAgICAgICBuYXRHYXRld2F5SWQ6IG5hdEdhdGV3YXlzW2ldLmlkLFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICApO1xuXG4gICAgICBuZXcgYXdzLmVjMi5Sb3V0ZVRhYmxlQXNzb2NpYXRpb24oXG4gICAgICAgIGAke25hbWV9LXByaXZhdGUtcnRhLSR7aX0tJHthcmdzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHtcbiAgICAgICAgICBzdWJuZXRJZDogc3VibmV0LmlkLFxuICAgICAgICAgIHJvdXRlVGFibGVJZDogcHJpdmF0ZVJvdXRlVGFibGUuaWQsXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICAvLyBFbmFibGUgVlBDIEZsb3cgTG9ncyAoY29uZGl0aW9uYWxseSlcbiAgICBpZiAoZW5hYmxlRmxvd0xvZ3MpIHtcbiAgICAgIGNvbnN0IGZsb3dMb2dSb2xlID0gbmV3IGF3cy5pYW0uUm9sZShcbiAgICAgICAgYCR7bmFtZX0tZmxvdy1sb2ctcm9sZS0ke2FyZ3MuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAge1xuICAgICAgICAgIGFzc3VtZVJvbGVQb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgQWN0aW9uOiAnc3RzOkFzc3VtZVJvbGUnLFxuICAgICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICAgIFNlcnZpY2U6ICd2cGMtZmxvdy1sb2dzLmFtYXpvbmF3cy5jb20nLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIHRhZ3M6IGFyZ3MudGFncyxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICAgKTtcblxuICAgICAgbmV3IGF3cy5pYW0uUm9sZVBvbGljeUF0dGFjaG1lbnQoXG4gICAgICAgIGAke25hbWV9LWZsb3ctbG9nLXBvbGljeS0ke2FyZ3MuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAge1xuICAgICAgICAgIHJvbGU6IGZsb3dMb2dSb2xlLm5hbWUsXG4gICAgICAgICAgcG9saWN5QXJuOiAnYXJuOmF3czppYW06OmF3czpwb2xpY3kvQ2xvdWRXYXRjaExvZ3NGdWxsQWNjZXNzJyxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICAgKTtcblxuICAgICAgY29uc3QgZmxvd0xvZ0dyb3VwID0gbmV3IGF3cy5jbG91ZHdhdGNoLkxvZ0dyb3VwKFxuICAgICAgICBgJHtuYW1lfS1mbG93LWxvZ3MtJHthcmdzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHtcbiAgICAgICAgICByZXRlbnRpb25JbkRheXM6IDcsXG4gICAgICAgICAgdGFnczogYXJncy50YWdzLFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICApO1xuXG4gICAgICBuZXcgYXdzLmVjMi5GbG93TG9nKFxuICAgICAgICBgJHtuYW1lfS1mbG93LWxvZy0ke2FyZ3MuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAge1xuICAgICAgICAgIGlhbVJvbGVBcm46IGZsb3dMb2dSb2xlLmFybixcbiAgICAgICAgICBsb2dEZXN0aW5hdGlvblR5cGU6ICdjbG91ZC13YXRjaC1sb2dzJyxcbiAgICAgICAgICBsb2dEZXN0aW5hdGlvbjogZmxvd0xvZ0dyb3VwLmFybixcbiAgICAgICAgICB0cmFmZmljVHlwZTogJ0FMTCcsXG4gICAgICAgICAgdnBjSWQ6IHZwYy5pZCxcbiAgICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgICBOYW1lOiBgJHtuYW1lfS1mbG93LWxvZy0ke2FyZ3MuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICAgIC4uLmFyZ3MudGFncyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICApO1xuICAgIH1cblxuICAgIHRoaXMudnBjSWQgPSB2cGMuaWQ7XG4gICAgdGhpcy5wdWJsaWNTdWJuZXRJZHMgPSBwdWx1bWkub3V0cHV0KHB1YmxpY1N1Ym5ldHMubWFwKHMgPT4gcy5pZCkpO1xuICAgIHRoaXMucHJpdmF0ZVN1Ym5ldElkcyA9IHB1bHVtaS5vdXRwdXQocHJpdmF0ZVN1Ym5ldHMubWFwKHMgPT4gcy5pZCkpO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgdnBjSWQ6IHRoaXMudnBjSWQsXG4gICAgICBwdWJsaWNTdWJuZXRJZHM6IHRoaXMucHVibGljU3VibmV0SWRzLFxuICAgICAgcHJpdmF0ZVN1Ym5ldElkczogdGhpcy5wcml2YXRlU3VibmV0SWRzLFxuICAgIH0pO1xuICB9XG59XG4iXX0=