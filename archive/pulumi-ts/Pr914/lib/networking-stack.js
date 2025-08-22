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
exports.NetworkingStack = void 0;
/**
 * networking-stack.ts
 *
 * This module defines the VPC and networking infrastructure with private subnets
 * for Lambda functions and VPC endpoints for secure AWS service access.
 */
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
class NetworkingStack extends pulumi.ComponentResource {
    vpc;
    privateSubnets;
    publicSubnets;
    s3VpcEndpoint;
    vpcSecurityGroup;
    routeTable;
    constructor(name, args, opts) {
        super('tap:networking:NetworkingStack', name, args, opts);
        const { environmentSuffix, tags } = args;
        // Force region to us-east-1 as per requirements
        // This ensures all resources are deployed in us-east-1 regardless of Pulumi config
        const region = 'us-east-1';
        // Derive availability zones from the required region
        const availabilityZones = [`${region}a`, `${region}b`];
        this.vpc = new aws.ec2.Vpc(`vpc-${environmentSuffix}`, {
            cidrBlock: '10.0.0.0/16',
            enableDnsHostnames: true,
            enableDnsSupport: true,
            tags: {
                Name: `vpc-${environmentSuffix}`,
                Purpose: 'Secure document processing infrastructure',
                ...tags,
            },
        }, { parent: this });
        this.publicSubnets = availabilityZones.map((az, index) => new aws.ec2.Subnet(`public-subnet-${index + 1}-${environmentSuffix}`, {
            vpcId: this.vpc.id,
            availabilityZone: az,
            cidrBlock: `10.0.${index + 1}.0/24`,
            mapPublicIpOnLaunch: true,
            tags: {
                Name: `public-subnet-${index + 1}-${environmentSuffix}`,
                Type: 'public',
                ...tags,
            },
        }, { parent: this }));
        this.privateSubnets = availabilityZones.map((az, index) => new aws.ec2.Subnet(`private-subnet-${index + 1}-${environmentSuffix}`, {
            vpcId: this.vpc.id,
            availabilityZone: az,
            cidrBlock: `10.0.${index + 10}.0/24`,
            tags: {
                Name: `private-subnet-${index + 1}-${environmentSuffix}`,
                Type: 'private',
                ...tags,
            },
        }, { parent: this }));
        const internetGateway = new aws.ec2.InternetGateway(`igw-${environmentSuffix}`, {
            vpcId: this.vpc.id,
            tags: {
                Name: `igw-${environmentSuffix}`,
                ...tags,
            },
        }, { parent: this });
        const publicRouteTable = new aws.ec2.RouteTable(`public-rt-${environmentSuffix}`, {
            vpcId: this.vpc.id,
            routes: [
                {
                    cidrBlock: '0.0.0.0/0',
                    gatewayId: internetGateway.id,
                },
            ],
            tags: {
                Name: `public-rt-${environmentSuffix}`,
                ...tags,
            },
        }, { parent: this });
        this.publicSubnets.forEach((subnet, index) => {
            new aws.ec2.RouteTableAssociation(`public-rta-${index + 1}-${environmentSuffix}`, {
                subnetId: subnet.id,
                routeTableId: publicRouteTable.id,
            }, { parent: this });
        });
        this.routeTable = new aws.ec2.RouteTable(`private-rt-${environmentSuffix}`, {
            vpcId: this.vpc.id,
            tags: {
                Name: `private-rt-${environmentSuffix}`,
                ...tags,
            },
        }, { parent: this });
        this.privateSubnets.forEach((subnet, index) => {
            new aws.ec2.RouteTableAssociation(`private-rta-${index + 1}-${environmentSuffix}`, {
                subnetId: subnet.id,
                routeTableId: this.routeTable.id,
            }, { parent: this });
        });
        this.vpcSecurityGroup = new aws.ec2.SecurityGroup(`vpc-sg-${environmentSuffix}`, {
            vpcId: this.vpc.id,
            description: 'Security group for VPC endpoints and Lambda functions',
            ingress: [
                {
                    fromPort: 443,
                    toPort: 443,
                    protocol: 'tcp',
                    cidrBlocks: [this.vpc.cidrBlock],
                },
            ],
            egress: [
                {
                    fromPort: 0,
                    toPort: 0,
                    protocol: '-1',
                    cidrBlocks: ['0.0.0.0/0'],
                },
            ],
            tags: {
                Name: `vpc-sg-${environmentSuffix}`,
                ...tags,
            },
        }, { parent: this });
        this.s3VpcEndpoint = new aws.ec2.VpcEndpoint(`s3-endpoint-${environmentSuffix}`, {
            vpcId: this.vpc.id,
            serviceName: `com.amazonaws.${region}.s3`,
            vpcEndpointType: 'Gateway',
            routeTableIds: [this.routeTable.id],
            policy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: '*',
                        Action: [
                            's3:GetObject',
                            's3:PutObject',
                            's3:DeleteObject',
                            's3:ListBucket',
                        ],
                        Resource: ['*'],
                    },
                ],
            }),
            tags: {
                Name: `s3-endpoint-${environmentSuffix}`,
                ...tags,
            },
        }, { parent: this });
        this.registerOutputs({
            vpcId: this.vpc.id,
            vpcArn: this.vpc.arn,
            vpcCidrBlock: this.vpc.cidrBlock,
            privateSubnetIds: this.privateSubnets.map(subnet => subnet.id),
            publicSubnetIds: this.publicSubnets.map(subnet => subnet.id),
            s3VpcEndpointId: this.s3VpcEndpoint.id,
            vpcSecurityGroupId: this.vpcSecurityGroup.id,
            routeTableId: this.routeTable.id,
        });
    }
}
exports.NetworkingStack = NetworkingStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmV0d29ya2luZy1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5ldHdvcmtpbmctc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7O0dBS0c7QUFDSCxpREFBbUM7QUFDbkMsdURBQXlDO0FBUXpDLE1BQWEsZUFBZ0IsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQzNDLEdBQUcsQ0FBYztJQUNqQixjQUFjLENBQW1CO0lBQ2pDLGFBQWEsQ0FBbUI7SUFDaEMsYUFBYSxDQUFzQjtJQUNuQyxnQkFBZ0IsQ0FBd0I7SUFDeEMsVUFBVSxDQUFxQjtJQUUvQyxZQUFZLElBQVksRUFBRSxJQUF5QixFQUFFLElBQXNCO1FBQ3pFLEtBQUssQ0FBQyxnQ0FBZ0MsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTFELE1BQU0sRUFBRSxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUM7UUFFekMsZ0RBQWdEO1FBQ2hELG1GQUFtRjtRQUNuRixNQUFNLE1BQU0sR0FBRyxXQUFXLENBQUM7UUFFM0IscURBQXFEO1FBQ3JELE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxHQUFHLE1BQU0sR0FBRyxFQUFFLEdBQUcsTUFBTSxHQUFHLENBQUMsQ0FBQztRQUV2RCxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQ3hCLE9BQU8saUJBQWlCLEVBQUUsRUFDMUI7WUFDRSxTQUFTLEVBQUUsYUFBYTtZQUN4QixrQkFBa0IsRUFBRSxJQUFJO1lBQ3hCLGdCQUFnQixFQUFFLElBQUk7WUFDdEIsSUFBSSxFQUFFO2dCQUNKLElBQUksRUFBRSxPQUFPLGlCQUFpQixFQUFFO2dCQUNoQyxPQUFPLEVBQUUsMkNBQTJDO2dCQUNwRCxHQUFHLElBQUk7YUFDUjtTQUNGLEVBQ0QsRUFBRSxNQUFNLEVBQUUs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Q0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO1lBQzlELGVBQWUsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7WUFDNUQsZUFBZSxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRTtZQUN0QyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsRUFBRTtZQUM1QyxZQUFZLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFO1NBQ2pDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQS9NRCwwQ0ErTUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIG5ldHdvcmtpbmctc3RhY2sudHNcbiAqXG4gKiBUaGlzIG1vZHVsZSBkZWZpbmVzIHRoZSBWUEMgYW5kIG5ldHdvcmtpbmcgaW5mcmFzdHJ1Y3R1cmUgd2l0aCBwcml2YXRlIHN1Ym5ldHNcbiAqIGZvciBMYW1iZGEgZnVuY3Rpb25zIGFuZCBWUEMgZW5kcG9pbnRzIGZvciBzZWN1cmUgQVdTIHNlcnZpY2UgYWNjZXNzLlxuICovXG5pbXBvcnQgKiBhcyBhd3MgZnJvbSAnQHB1bHVtaS9hd3MnO1xuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCB7IFJlc291cmNlT3B0aW9ucyB9IGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcblxuZXhwb3J0IGludGVyZmFjZSBOZXR3b3JraW5nU3RhY2tBcmdzIHtcbiAgZW52aXJvbm1lbnRTdWZmaXg6IHN0cmluZztcbiAgdGFncz86IHB1bHVtaS5JbnB1dDx7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9Pjtcbn1cblxuZXhwb3J0IGNsYXNzIE5ldHdvcmtpbmdTdGFjayBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSB2cGM6IGF3cy5lYzIuVnBjO1xuICBwdWJsaWMgcmVhZG9ubHkgcHJpdmF0ZVN1Ym5ldHM6IGF3cy5lYzIuU3VibmV0W107XG4gIHB1YmxpYyByZWFkb25seSBwdWJsaWNTdWJuZXRzOiBhd3MuZWMyLlN1Ym5ldFtdO1xuICBwdWJsaWMgcmVhZG9ubHkgczNWcGNFbmRwb2ludDogYXdzLmVjMi5WcGNFbmRwb2ludDtcbiAgcHVibGljIHJlYWRvbmx5IHZwY1NlY3VyaXR5R3JvdXA6IGF3cy5lYzIuU2VjdXJpdHlHcm91cDtcbiAgcHVibGljIHJlYWRvbmx5IHJvdXRlVGFibGU6IGF3cy5lYzIuUm91dGVUYWJsZTtcblxuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGFyZ3M6IE5ldHdvcmtpbmdTdGFja0FyZ3MsIG9wdHM/OiBSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICBzdXBlcigndGFwOm5ldHdvcmtpbmc6TmV0d29ya2luZ1N0YWNrJywgbmFtZSwgYXJncywgb3B0cyk7XG5cbiAgICBjb25zdCB7IGVudmlyb25tZW50U3VmZml4LCB0YWdzIH0gPSBhcmdzO1xuXG4gICAgLy8gRm9yY2UgcmVnaW9uIHRvIHVzLWVhc3QtMSBhcyBwZXIgcmVxdWlyZW1lbnRzXG4gICAgLy8gVGhpcyBlbnN1cmVzIGFsbCByZXNvdXJjZXMgYXJlIGRlcGxveWVkIGluIHVzLWVhc3QtMSByZWdhcmRsZXNzIG9mIFB1bHVtaSBjb25maWdcbiAgICBjb25zdCByZWdpb24gPSAndXMtZWFzdC0xJztcblxuICAgIC8vIERlcml2ZSBhdmFpbGFiaWxpdHkgem9uZXMgZnJvbSB0aGUgcmVxdWlyZWQgcmVnaW9uXG4gICAgY29uc3QgYXZhaWxhYmlsaXR5Wm9uZXMgPSBbYCR7cmVnaW9ufWFgLCBgJHtyZWdpb259YmBdO1xuXG4gICAgdGhpcy52cGMgPSBuZXcgYXdzLmVjMi5WcGMoXG4gICAgICBgdnBjLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgY2lkckJsb2NrOiAnMTAuMC4wLjAvMTYnLFxuICAgICAgICBlbmFibGVEbnNIb3N0bmFtZXM6IHRydWUsXG4gICAgICAgIGVuYWJsZURuc1N1cHBvcnQ6IHRydWUsXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBOYW1lOiBgdnBjLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICBQdXJwb3NlOiAnU2VjdXJlIGRvY3VtZW50IHByb2Nlc3NpbmcgaW5mcmFzdHJ1Y3R1cmUnLFxuICAgICAgICAgIC4uLnRhZ3MsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICB0aGlzLnB1YmxpY1N1Ym5ldHMgPSBhdmFpbGFiaWxpdHlab25lcy5tYXAoXG4gICAgICAoYXosIGluZGV4KSA9PlxuICAgICAgICBuZXcgYXdzLmVjMi5TdWJuZXQoXG4gICAgICAgICAgYHB1YmxpYy1zdWJuZXQtJHtpbmRleCArIDF9LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICB7XG4gICAgICAgICAgICB2cGNJZDogdGhpcy52cGMuaWQsXG4gICAgICAgICAgICBhdmFpbGFiaWxpdHlab25lOiBheixcbiAgICAgICAgICAgIGNpZHJCbG9jazogYDEwLjAuJHtpbmRleCArIDF9LjAvMjRgLFxuICAgICAgICAgICAgbWFwUHVibGljSXBPbkxhdW5jaDogdHJ1ZSxcbiAgICAgICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAgICAgTmFtZTogYHB1YmxpYy1zdWJuZXQtJHtpbmRleCArIDF9LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICAgICAgVHlwZTogJ3B1YmxpYycsXG4gICAgICAgICAgICAgIC4uLnRhZ3MsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICAgICApXG4gICAgKTtcblxuICAgIHRoaXMucHJpdmF0ZVN1Ym5ldHMgPSBhdmFpbGFiaWxpdHlab25lcy5tYXAoXG4gICAgICAoYXosIGluZGV4KSA9PlxuICAgICAgICBuZXcgYXdzLmVjMi5TdWJuZXQoXG4gICAgICAgICAgYHByaXZhdGUtc3VibmV0LSR7aW5kZXggKyAxfS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAge1xuICAgICAgICAgICAgdnBjSWQ6IHRoaXMudnBjLmlkLFxuICAgICAgICAgICAgYXZhaWxhYmlsaXR5Wm9uZTogYXosXG4gICAgICAgICAgICBjaWRyQmxvY2s6IGAxMC4wLiR7aW5kZXggKyAxMH0uMC8yNGAsXG4gICAgICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgICAgIE5hbWU6IGBwcml2YXRlLXN1Ym5ldC0ke2luZGV4ICsgMX0tJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgICAgICBUeXBlOiAncHJpdmF0ZScsXG4gICAgICAgICAgICAgIC4uLnRhZ3MsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICAgICApXG4gICAgKTtcblxuICAgIGNvbnN0IGludGVybmV0R2F0ZXdheSA9IG5ldyBhd3MuZWMyLkludGVybmV0R2F0ZXdheShcbiAgICAgIGBpZ3ctJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICB2cGNJZDogdGhpcy52cGMuaWQsXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBOYW1lOiBgaWd3LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICAuLi50YWdzLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgY29uc3QgcHVibGljUm91dGVUYWJsZSA9IG5ldyBhd3MuZWMyLlJvdXRlVGFibGUoXG4gICAgICBgcHVibGljLXJ0LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgdnBjSWQ6IHRoaXMudnBjLmlkLFxuICAgICAgICByb3V0ZXM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBjaWRyQmxvY2s6ICcwLjAuMC4wLzAnLFxuICAgICAgICAgICAgZ2F0ZXdheUlkOiBpbnRlcm5ldEdhdGV3YXkuaWQsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIE5hbWU6IGBwdWJsaWMtcnQtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIC4uLnRhZ3MsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICB0aGlzLnB1YmxpY1N1Ym5ldHMuZm9yRWFjaCgoc3VibmV0LCBpbmRleCkgPT4ge1xuICAgICAgbmV3IGF3cy5lYzIuUm91dGVUYWJsZUFzc29jaWF0aW9uKFxuICAgICAgICBgcHVibGljLXJ0YS0ke2luZGV4ICsgMX0tJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB7XG4gICAgICAgICAgc3VibmV0SWQ6IHN1Ym5ldC5pZCxcbiAgICAgICAgICByb3V0ZVRhYmxlSWQ6IHB1YmxpY1JvdXRlVGFibGUuaWQsXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnJvdXRlVGFibGUgPSBuZXcgYXdzLmVjMi5Sb3V0ZVRhYmxlKFxuICAgICAgYHByaXZhdGUtcnQtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICB2cGNJZDogdGhpcy52cGMuaWQsXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBOYW1lOiBgcHJpdmF0ZS1ydC0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIHRoaXMucHJpdmF0ZVN1Ym5ldHMuZm9yRWFjaCgoc3VibmV0LCBpbmRleCkgPT4ge1xuICAgICAgbmV3IGF3cy5lYzIuUm91dGVUYWJsZUFzc29jaWF0aW9uKFxuICAgICAgICBgcHJpdmF0ZS1ydGEtJHtpbmRleCArIDF9LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAge1xuICAgICAgICAgIHN1Ym5ldElkOiBzdWJuZXQuaWQsXG4gICAgICAgICAgcm91dGVUYWJsZUlkOiB0aGlzLnJvdXRlVGFibGUuaWQsXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnZwY1NlY3VyaXR5R3JvdXAgPSBuZXcgYXdzLmVjMi5TZWN1cml0eUdyb3VwKFxuICAgICAgYHZwYy1zZy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIHZwY0lkOiB0aGlzLnZwYy5pZCxcbiAgICAgICAgZGVzY3JpcHRpb246ICdTZWN1cml0eSBncm91cCBmb3IgVlBDIGVuZHBvaW50cyBhbmQgTGFtYmRhIGZ1bmN0aW9ucycsXG4gICAgICAgIGluZ3Jlc3M6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBmcm9tUG9ydDogNDQzLFxuICAgICAgICAgICAgdG9Qb3J0OiA0NDMsXG4gICAgICAgICAgICBwcm90b2NvbDogJ3RjcCcsXG4gICAgICAgICAgICBjaWRyQmxvY2tzOiBbdGhpcy52cGMuY2lkckJsb2NrXSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBlZ3Jlc3M6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBmcm9tUG9ydDogMCxcbiAgICAgICAgICAgIHRvUG9ydDogMCxcbiAgICAgICAgICAgIHByb3RvY29sOiAnLTEnLFxuICAgICAgICAgICAgY2lkckJsb2NrczogWycwLjAuMC4wLzAnXSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgTmFtZTogYHZwYy1zZy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIHRoaXMuczNWcGNFbmRwb2ludCA9IG5ldyBhd3MuZWMyLlZwY0VuZHBvaW50KFxuICAgICAgYHMzLWVuZHBvaW50LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgdnBjSWQ6IHRoaXMudnBjLmlkLFxuICAgICAgICBzZXJ2aWNlTmFtZTogYGNvbS5hbWF6b25hd3MuJHtyZWdpb259LnMzYCxcbiAgICAgICAgdnBjRW5kcG9pbnRUeXBlOiAnR2F0ZXdheScsXG4gICAgICAgIHJvdXRlVGFibGVJZHM6IFt0aGlzLnJvdXRlVGFibGUuaWRdLFxuICAgICAgICBwb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgUHJpbmNpcGFsOiAnKicsXG4gICAgICAgICAgICAgIEFjdGlvbjogW1xuICAgICAgICAgICAgICAgICdzMzpHZXRPYmplY3QnLFxuICAgICAgICAgICAgICAgICdzMzpQdXRPYmplY3QnLFxuICAgICAgICAgICAgICAgICdzMzpEZWxldGVPYmplY3QnLFxuICAgICAgICAgICAgICAgICdzMzpMaXN0QnVja2V0JyxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6IFsnKiddLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9KSxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIE5hbWU6IGBzMy1lbmRwb2ludC0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIHZwY0lkOiB0aGlzLnZwYy5pZCxcbiAgICAgIHZwY0FybjogdGhpcy52cGMuYXJuLFxuICAgICAgdnBjQ2lkckJsb2NrOiB0aGlzLnZwYy5jaWRyQmxvY2ssXG4gICAgICBwcml2YXRlU3VibmV0SWRzOiB0aGlzLnByaXZhdGVTdWJuZXRzLm1hcChzdWJuZXQgPT4gc3VibmV0LmlkKSxcbiAgICAgIHB1YmxpY1N1Ym5ldElkczogdGhpcy5wdWJsaWNTdWJuZXRzLm1hcChzdWJuZXQgPT4gc3VibmV0LmlkKSxcbiAgICAgIHMzVnBjRW5kcG9pbnRJZDogdGhpcy5zM1ZwY0VuZHBvaW50LmlkLFxuICAgICAgdnBjU2VjdXJpdHlHcm91cElkOiB0aGlzLnZwY1NlY3VyaXR5R3JvdXAuaWQsXG4gICAgICByb3V0ZVRhYmxlSWQ6IHRoaXMucm91dGVUYWJsZS5pZCxcbiAgICB9KTtcbiAgfVxufVxuIl19