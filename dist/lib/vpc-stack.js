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
        // Use hardcoded AZs for now - in real deployment, getAvailabilityZones would work
        const azNames = ['us-east-2a', 'us-east-2b'];
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
        // Create public and private subnets
        const publicSubnets = [];
        const privateSubnets = [];
        for (let i = 0; i < azNames.length; i++) {
            const publicSubnet = new aws.ec2.Subnet(`${name}-public-subnet-${i}-${args.environmentSuffix}`, {
                vpcId: vpc.id,
                cidrBlock: `10.5.${i * 2}.0/24`,
                availabilityZone: azNames[i],
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
                availabilityZone: azNames[i],
                tags: {
                    Name: `${name}-private-subnet-${i}-${args.environmentSuffix}`,
                    Type: 'Private',
                    ...args.tags,
                },
            }, { parent: this });
            privateSubnets.push(privateSubnet);
        }
        // Create NAT Gateways for private subnets
        const natGateways = [];
        for (let i = 0; i < publicSubnets.length; i++) {
            const subnet = publicSubnets[i];
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
        }
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
        for (let i = 0; i < publicSubnets.length; i++) {
            const subnet = publicSubnets[i];
            new aws.ec2.RouteTableAssociation(`${name}-public-rta-${i}-${args.environmentSuffix}`, {
                subnetId: subnet.id,
                routeTableId: publicRouteTable.id,
            }, { parent: this });
        }
        for (let i = 0; i < privateSubnets.length; i++) {
            const subnet = privateSubnets[i];
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
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidnBjLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL3ZwYy1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx1REFBeUM7QUFDekMsaURBQW1DO0FBVW5DLE1BQWEsUUFBUyxTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFDcEMsS0FBSyxDQUF3QjtJQUM3QixlQUFlLENBQTBCO0lBQ3pDLGdCQUFnQixDQUEwQjtJQUUxRCxZQUFZLElBQVksRUFBRSxJQUFrQixFQUFFLElBQXNCO1FBQ2xFLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTVDLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLElBQUksYUFBYSxDQUFDO1FBQzlDLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxjQUFjLEtBQUssS0FBSyxDQUFDO1FBRXJELGtGQUFrRjtRQUNsRixNQUFNLE9BQU8sR0FBRyxDQUFDLFlBQVksRUFBRSxZQUFZLENBQUMsQ0FBQztRQUU3QyxhQUFhO1FBQ2IsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FDekIsR0FBRyxJQUFJLFFBQVEsSUFBSSxDQUFDLGlCQUFpQixFQUFFLEVBQ3ZDO1lBQ0UsU0FBUyxFQUFFLE9BQU87WUFDbEIsa0JBQWtCLEVBQUUsSUFBSTtZQUN4QixnQkFBZ0IsRUFBRSxJQUFJO1lBQ3RCLElBQUksRUFBRTtnQkFDSixJQUFJLEVBQUUsR0FBRyxJQUFJLFFBQVEsSUFBSSxDQUFDLGlCQUFpQixFQUFFO2dCQUM3QyxHQUFHLElBQUksQ0FBQyxJQUFJO2FBQ2I7U0FDRixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsMEJBQTBCO1FBQzFCLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFD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QUFDLENBQUM7UUFFckUsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUNuQixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7WUFDakIsZUFBZSxFQUFFLElBQUksQ0FBQyxlQUFlO1lBQ3JDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxnQkFBZ0I7U0FDeEMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBeFBELDRCQXdQQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgKiBhcyBhd3MgZnJvbSAnQHB1bHVtaS9hd3MnO1xuaW1wb3J0IHsgUmVzb3VyY2VPcHRpb25zIH0gZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuXG5leHBvcnQgaW50ZXJmYWNlIFZwY1N0YWNrQXJncyB7XG4gIGVudmlyb25tZW50U3VmZml4OiBzdHJpbmc7XG4gIHZwY0NpZHI/OiBzdHJpbmc7XG4gIGVuYWJsZUZsb3dMb2dzPzogYm9vbGVhbjtcbiAgdGFncz86IHB1bHVtaS5JbnB1dDx7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9Pjtcbn1cblxuZXhwb3J0IGNsYXNzIFZwY1N0YWNrIGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IHZwY0lkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBwdWJsaWNTdWJuZXRJZHM6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nW10+O1xuICBwdWJsaWMgcmVhZG9ubHkgcHJpdmF0ZVN1Ym5ldElkczogcHVsdW1pLk91dHB1dDxzdHJpbmdbXT47XG5cbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBWcGNTdGFja0FyZ3MsIG9wdHM/OiBSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICBzdXBlcigndGFwOnZwYzpWcGNTdGFjaycsIG5hbWUsIGFyZ3MsIG9wdHMpO1xuXG4gICAgY29uc3QgdnBjQ2lkciA9IGFyZ3MudnBjQ2lkciB8fCAnMTAuNS4wLjAvMTYnO1xuICAgIGNvbnN0IGVuYWJsZUZsb3dMb2dzID0gYXJncy5lbmFibGVGbG93TG9ncyAhPT0gZmFsc2U7XG5cbiAgICAvLyBVc2UgaGFyZGNvZGVkIEFacyBmb3Igbm93IC0gaW4gcmVhbCBkZXBsb3ltZW50LCBnZXRBdmFpbGFiaWxpdHlab25lcyB3b3VsZCB3b3JrXG4gICAgY29uc3QgYXpOYW1lcyA9IFsndXMtZWFzdC0yYScsICd1cy1lYXN0LTJiJ107XG5cbiAgICAvLyBDcmVhdGUgVlBDXG4gICAgY29uc3QgdnBjID0gbmV3IGF3cy5lYzIuVnBjKFxuICAgICAgYCR7bmFtZX0tdnBjLSR7YXJncy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBjaWRyQmxvY2s6IHZwY0NpZHIsXG4gICAgICAgIGVuYWJsZURuc0hvc3RuYW1lczogdHJ1ZSxcbiAgICAgICAgZW5hYmxlRG5zU3VwcG9ydDogdHJ1ZSxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIE5hbWU6IGAke25hbWV9LXZwYy0ke2FyZ3MuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICAuLi5hcmdzLnRhZ3MsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgSW50ZXJuZXQgR2F0ZXdheVxuICAgIGNvbnN0IGlndyA9IG5ldyBhd3MuZWMyLkludGVybmV0R2F0ZXdheShcbiAgICAgIGAke25hbWV9LWlndy0ke2FyZ3MuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgdnBjSWQ6IHZwYy5pZCxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIE5hbWU6IGAke25hbWV9LWlndy0ke2FyZ3MuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICAuLi5hcmdzLnRhZ3MsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgcHVibGljIGFuZCBwcml2YXRlIHN1Ym5ldHNcbiAgICBjb25zdCBwdWJsaWNTdWJuZXRzOiBhd3MuZWMyLlN1Ym5ldFtdID0gW107XG4gICAgY29uc3QgcHJpdmF0ZVN1Ym5ldHM6IGF3cy5lYzIuU3VibmV0W10gPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXpOYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcHVibGljU3VibmV0ID0gbmV3IGF3cy5lYzIuU3VibmV0KFxuICAgICAgICBgJHtuYW1lfS1wdWJsaWMtc3VibmV0LSR7aX0tJHthcmdzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHtcbiAgICAgICAgICB2cGNJZDogdnBjLmlkLFxuICAgICAgICAgIGNpZHJCbG9jazogYDEwLjUuJHtpICogMn0uMC8yNGAsXG4gICAgICAgICAgYXZhaWxhYmlsaXR5Wm9uZTogYXpOYW1lc1tpXSxcbiAgICAgICAgICBtYXBQdWJsaWNJcE9uTGF1bmNoOiB0cnVlLFxuICAgICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAgIE5hbWU6IGAke25hbWV9LXB1YmxpYy1zdWJuZXQtJHtpfS0ke2FyZ3MuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICAgIFR5cGU6ICdQdWJsaWMnLFxuICAgICAgICAgICAgLi4uYXJncy50YWdzLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICAgICk7XG4gICAgICBwdWJsaWNTdWJuZXRzLnB1c2gocHVibGljU3VibmV0KTtcblxuICAgICAgY29uc3QgcHJpdmF0ZVN1Ym5ldCA9IG5ldyBhd3MuZWMyLlN1Ym5ldChcbiAgICAgICAgYCR7bmFtZX0tcHJpdmF0ZS1zdWJuZXQtJHtpfS0ke2FyZ3MuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAge1xuICAgICAgICAgIHZwY0lkOiB2cGMuaWQsXG4gICAgICAgICAgY2lkckJsb2NrOiBgMTAuNS4ke2kgKiAyICsgMX0uMC8yNGAsXG4gICAgICAgICAgYXZhaWxhYmlsaXR5Wm9uZTogYXpOYW1lc1tpXSxcbiAgICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgICBOYW1lOiBgJHtuYW1lfS1wcml2YXRlLXN1Ym5ldC0ke2l9LSR7YXJncy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgICAgVHlwZTogJ1ByaXZhdGUnLFxuICAgICAgICAgICAgLi4uYXJncy50YWdzLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICAgICk7XG4gICAgICBwcml2YXRlU3VibmV0cy5wdXNoKHByaXZhdGVTdWJuZXQpO1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSBOQVQgR2F0ZXdheXMgZm9yIHByaXZhdGUgc3VibmV0c1xuICAgIGNvbnN0IG5hdEdhdGV3YXlzOiBhd3MuZWMyLk5hdEdhdGV3YXlbXSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHVibGljU3VibmV0cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgc3VibmV0ID0gcHVibGljU3VibmV0c1tpXTtcbiAgICAgIGNvbnN0IGVpcCA9IG5ldyBhd3MuZWMyLkVpcChcbiAgICAgICAgYCR7bmFtZX0tbmF0LWVpcC0ke2l9LSR7YXJncy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB7XG4gICAgICAgICAgZG9tYWluOiAndnBjJyxcbiAgICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgICBOYW1lOiBgJHtuYW1lfS1uYXQtZWlwLSR7aX0tJHthcmdzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgICAuLi5hcmdzLnRhZ3MsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICAgKTtcblxuICAgICAgY29uc3QgbmF0R2F0ZXdheSA9IG5ldyBhd3MuZWMyLk5hdEdhdGV3YXkoXG4gICAgICAgIGAke25hbWV9LW5hdC0ke2l9LSR7YXJncy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB7XG4gICAgICAgICAgYWxsb2NhdGlvbklkOiBlaXAuaWQsXG4gICAgICAgICAgc3VibmV0SWQ6IHN1Ym5ldC5pZCxcbiAgICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgICBOYW1lOiBgJHtuYW1lfS1uYXQtJHtpfS0ke2FyZ3MuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICAgIC4uLmFyZ3MudGFncyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICApO1xuICAgICAgbmF0R2F0ZXdheXMucHVzaChuYXRHYXRld2F5KTtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgcm91dGUgdGFibGVzXG4gICAgY29uc3QgcHVibGljUm91dGVUYWJsZSA9IG5ldyBhd3MuZWMyLlJvdXRlVGFibGUoXG4gICAgICBgJHtuYW1lfS1wdWJsaWMtcnQtJHthcmdzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIHZwY0lkOiB2cGMuaWQsXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBOYW1lOiBgJHtuYW1lfS1wdWJsaWMtcnQtJHthcmdzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgLi4uYXJncy50YWdzLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgbmV3IGF3cy5lYzIuUm91dGUoXG4gICAgICBgJHtuYW1lfS1wdWJsaWMtcm91dGUtJHthcmdzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIHJvdXRlVGFibGVJZDogcHVibGljUm91dGVUYWJsZS5pZCxcbiAgICAgICAgZGVzdGluYXRpb25DaWRyQmxvY2s6ICcwLjAuMC4wLzAnLFxuICAgICAgICBnYXRld2F5SWQ6IGlndy5pZCxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHVibGljU3VibmV0cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgc3VibmV0ID0gcHVibGljU3VibmV0c1tpXTtcbiAgICAgIG5ldyBhd3MuZWMyLlJvdXRlVGFibGVBc3NvY2lhdGlvbihcbiAgICAgICAgYCR7bmFtZX0tcHVibGljLXJ0YS0ke2l9LSR7YXJncy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB7XG4gICAgICAgICAgc3VibmV0SWQ6IHN1Ym5ldC5pZCxcbiAgICAgICAgICByb3V0ZVRhYmxlSWQ6IHB1YmxpY1JvdXRlVGFibGUuaWQsXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcml2YXRlU3VibmV0cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgc3VibmV0ID0gcHJpdmF0ZVN1Ym5ldHNbaV07XG4gICAgICBjb25zdCBwcml2YXRlUm91dGVUYWJsZSA9IG5ldyBhd3MuZWMyLlJvdXRlVGFibGUoXG4gICAgICAgIGAke25hbWV9LXByaXZhdGUtcnQtJHtpfS0ke2FyZ3MuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAge1xuICAgICAgICAgIHZwY0lkOiB2cGMuaWQsXG4gICAgICAgICAgdGFnczoge1xuICAgICAgICAgICAgTmFtZTogYCR7bmFtZX0tcHJpdmF0ZS1ydC0ke2l9LSR7YXJncy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgICAgLi4uYXJncy50YWdzLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICAgICk7XG5cbiAgICAgIG5ldyBhd3MuZWMyLlJvdXRlKFxuICAgICAgICBgJHtuYW1lfS1wcml2YXRlLXJvdXRlLSR7aX0tJHthcmdzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHtcbiAgICAgICAgICByb3V0ZVRhYmxlSWQ6IHByaXZhdGVSb3V0ZVRhYmxlLmlkLFxuICAgICAgICAgIGRlc3RpbmF0aW9uQ2lkckJsb2NrOiAnMC4wLjAuMC8wJyxcbiAgICAgICAgICBuYXRHYXRld2F5SWQ6IG5hdEdhdGV3YXlzW2ldLmlkLFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICApO1xuXG4gICAgICBuZXcgYXdzLmVjMi5Sb3V0ZVRhYmxlQXNzb2NpYXRpb24oXG4gICAgICAgIGAke25hbWV9LXByaXZhdGUtcnRhLSR7aX0tJHthcmdzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHtcbiAgICAgICAgICBzdWJuZXRJZDogc3VibmV0LmlkLFxuICAgICAgICAgIHJvdXRlVGFibGVJZDogcHJpdmF0ZVJvdXRlVGFibGUuaWQsXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gRW5hYmxlIFZQQyBGbG93IExvZ3MgKGNvbmRpdGlvbmFsbHkpXG4gICAgaWYgKGVuYWJsZUZsb3dMb2dzKSB7XG4gICAgICBjb25zdCBmbG93TG9nUm9sZSA9IG5ldyBhd3MuaWFtLlJvbGUoXG4gICAgICAgIGAke25hbWV9LWZsb3ctbG9nLXJvbGUtJHthcmdzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHtcbiAgICAgICAgICBhc3N1bWVSb2xlUG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIEFjdGlvbjogJ3N0czpBc3N1bWVSb2xlJyxcbiAgICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgICBTZXJ2aWNlOiAndnBjLWZsb3ctbG9ncy5hbWF6b25hd3MuY29tJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgICB0YWdzOiBhcmdzLnRhZ3MsXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICAgICk7XG5cbiAgICAgIG5ldyBhd3MuaWFtLlJvbGVQb2xpY3lBdHRhY2htZW50KFxuICAgICAgICBgJHtuYW1lfS1mbG93LWxvZy1wb2xpY3ktJHthcmdzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHtcbiAgICAgICAgICByb2xlOiBmbG93TG9nUm9sZS5uYW1lLFxuICAgICAgICAgIHBvbGljeUFybjogJ2Fybjphd3M6aWFtOjphd3M6cG9saWN5L0Nsb3VkV2F0Y2hMb2dzRnVsbEFjY2VzcycsXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IGZsb3dMb2dHcm91cCA9IG5ldyBhd3MuY2xvdWR3YXRjaC5Mb2dHcm91cChcbiAgICAgICAgYCR7bmFtZX0tZmxvdy1sb2dzLSR7YXJncy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB7XG4gICAgICAgICAgcmV0ZW50aW9uSW5EYXlzOiA3LFxuICAgICAgICAgIHRhZ3M6IGFyZ3MudGFncyxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICAgKTtcblxuICAgICAgbmV3IGF3cy5lYzIuRmxvd0xvZyhcbiAgICAgICAgYCR7bmFtZX0tZmxvdy1sb2ctJHthcmdzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHtcbiAgICAgICAgICBpYW1Sb2xlQXJuOiBmbG93TG9nUm9sZS5hcm4sXG4gICAgICAgICAgbG9nRGVzdGluYXRpb25UeXBlOiAnY2xvdWQtd2F0Y2gtbG9ncycsXG4gICAgICAgICAgbG9nRGVzdGluYXRpb246IGZsb3dMb2dHcm91cC5hcm4sXG4gICAgICAgICAgdHJhZmZpY1R5cGU6ICdBTEwnLFxuICAgICAgICAgIHZwY0lkOiB2cGMuaWQsXG4gICAgICAgICAgdGFnczoge1xuICAgICAgICAgICAgTmFtZTogYCR7bmFtZX0tZmxvdy1sb2ctJHthcmdzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgICAuLi5hcmdzLnRhZ3MsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICAgKTtcbiAgICB9XG5cbiAgICB0aGlzLnZwY0lkID0gdnBjLmlkO1xuICAgIHRoaXMucHVibGljU3VibmV0SWRzID0gcHVsdW1pLm91dHB1dChwdWJsaWNTdWJuZXRzLm1hcChzID0+IHMuaWQpKTtcbiAgICB0aGlzLnByaXZhdGVTdWJuZXRJZHMgPSBwdWx1bWkub3V0cHV0KHByaXZhdGVTdWJuZXRzLm1hcChzID0+IHMuaWQpKTtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIHZwY0lkOiB0aGlzLnZwY0lkLFxuICAgICAgcHVibGljU3VibmV0SWRzOiB0aGlzLnB1YmxpY1N1Ym5ldElkcyxcbiAgICAgIHByaXZhdGVTdWJuZXRJZHM6IHRoaXMucHJpdmF0ZVN1Ym5ldElkcyxcbiAgICB9KTtcbiAgfVxufVxuIl19