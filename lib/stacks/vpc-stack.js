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
/**
 * vpc-stack.ts
 *
 * This module defines the VpcStack component for creating a secure VPC
 * with both public and private subnets, NAT gateways, and proper routing.
 */
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
class VpcStack extends pulumi.ComponentResource {
    vpcId;
    privateSubnetIds;
    publicSubnetIds;
    internetGatewayId;
    constructor(name, args, opts) {
        super('tap:vpc:VpcStack', name, args, opts);
        const environmentSuffix = args.environmentSuffix || 'dev';
        const vpcCidr = args.vpcCidr || '10.0.0.0/16';
        const tags = args.tags || {};
        // Create VPC
        const vpc = new aws.ec2.Vpc(`tap-vpc-${environmentSuffix}`, {
            cidrBlock: vpcCidr,
            enableDnsHostnames: true,
            enableDnsSupport: true,
            tags: {
                Name: `tap-vpc-${environmentSuffix}`,
                ...tags,
            },
        }, { parent: this });
        // Create Internet Gateway
        const internetGateway = new aws.ec2.InternetGateway(`tap-igw-${environmentSuffix}`, {
            vpcId: vpc.id,
            tags: {
                Name: `tap-igw-${environmentSuffix}`,
                ...tags,
            },
        }, { parent: this });
        // Get availability zones
        const availabilityZones = aws.getAvailabilityZones({
            state: 'available',
        });
        // Create subnets in multiple AZs
        const privateSubnets = [];
        const publicSubnets = [];
        const natGateways = [];
        availabilityZones.then(azs => {
            const azCount = Math.min(azs.names.length, 3); // Use up to 3 AZs
            for (let i = 0; i < azCount; i++) {
                const az = azs.names[i];
                // Public subnet
                const publicSubnet = new aws.ec2.Subnet(`tap-public-subnet-${i}-${environmentSuffix}`, {
                    vpcId: vpc.id,
                    cidrBlock: `10.0.${i * 2 + 1}.0/24`,
                    availabilityZone: az,
                    mapPublicIpOnLaunch: false, // Explicitly disable auto-assign public IP
                    tags: {
                        Name: `tap-public-subnet-${i}-${environmentSuffix}`,
                        Type: 'public',
                        ...tags,
                    },
                }, { parent: this });
                publicSubnets.push(publicSubnet);
                // Private subnet
                const privateSubnet = new aws.ec2.Subnet(`tap-private-subnet-${i}-${environmentSuffix}`, {
                    vpcId: vpc.id,
                    cidrBlock: `10.0.${i * 2 + 2}.0/24`,
                    availabilityZone: az,
                    tags: {
                        Name: `tap-private-subnet-${i}-${environmentSuffix}`,
                        Type: 'private',
                        ...tags,
                    },
                }, { parent: this });
                privateSubnets.push(privateSubnet);
                // Elastic IP for NAT Gateway
                const eip = new aws.ec2.Eip(`tap-nat-eip-${i}-${environmentSuffix}`, {
                    domain: 'vpc',
                    tags: {
                        Name: `tap-nat-eip-${i}-${environmentSuffix}`,
                        ...tags,
                    },
                }, { parent: this });
                // NAT Gateway
                const natGateway = new aws.ec2.NatGateway(`tap-nat-${i}-${environmentSuffix}`, {
                    allocationId: eip.id,
                    subnetId: publicSubnet.id,
                    tags: {
                        Name: `tap-nat-${i}-${environmentSuffix}`,
                        ...tags,
                    },
                }, { parent: this });
                natGateways.push(natGateway);
                // Private route table
                const privateRouteTable = new aws.ec2.RouteTable(`tap-private-rt-${i}-${environmentSuffix}`, {
                    vpcId: vpc.id,
                    tags: {
                        Name: `tap-private-rt-${i}-${environmentSuffix}`,
                        ...tags,
                    },
                }, { parent: this });
                new aws.ec2.Route(`tap-private-route-${i}-${environmentSuffix}`, {
                    routeTableId: privateRouteTable.id,
                    destinationCidrBlock: '0.0.0.0/0',
                    natGatewayId: natGateway.id,
                }, { parent: this });
                new aws.ec2.RouteTableAssociation(`tap-private-rta-${i}-${environmentSuffix}`, {
                    subnetId: privateSubnet.id,
                    routeTableId: privateRouteTable.id,
                }, { parent: this });
            }
        });
        // Public route table
        const publicRouteTable = new aws.ec2.RouteTable(`tap-public-rt-${environmentSuffix}`, {
            vpcId: vpc.id,
            tags: {
                Name: `tap-public-rt-${environmentSuffix}`,
                ...tags,
            },
        }, { parent: this });
        new aws.ec2.Route(`tap-public-route-${environmentSuffix}`, {
            routeTableId: publicRouteTable.id,
            destinationCidrBlock: '0.0.0.0/0',
            gatewayId: internetGateway.id,
        }, { parent: this });
        // Associate public subnets with public route table
        publicSubnets.forEach((subnet, i) => {
            new aws.ec2.RouteTableAssociation(`tap-public-rta-${i}-${environmentSuffix}`, {
                subnetId: subnet.id,
                routeTableId: publicRouteTable.id,
            }, { parent: this });
        });
        this.vpcId = vpc.id;
        this.privateSubnetIds = privateSubnets.map(s => s.id);
        this.publicSubnetIds = publicSubnets.map(s => s.id);
        this.internetGatewayId = internetGateway.id;
        this.registerOutputs({
            vpcId: this.vpcId,
            privateSubnetIds: this.privateSubnetIds,
            publicSubnetIds: this.publicSubnetIds,
            internetGatewayId: this.internetGatewayId,
        });
    }
}
exports.VpcStack = VpcStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidnBjLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidnBjLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7OztHQUtHO0FBQ0gsaURBQW1DO0FBQ25DLHVEQUF5QztBQVN6QyxNQUFhLFFBQVMsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQ3BDLEtBQUssQ0FBd0I7SUFDN0IsZ0JBQWdCLENBQTBCO0lBQzFDLGVBQWUsQ0FBMEI7SUFDekMsaUJBQWlCLENBQXdCO0lBRXpELFlBQVksSUFBWSxFQUFFLElBQWtCLEVBQUUsSUFBc0I7UUFDbEUsS0FBSyxDQUFDLGtCQUFrQixFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFNUMsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsaUJBQWlCLElBQUksS0FBSyxDQUFDO1FBQzFELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLElBQUksYUFBYSxDQUFDO1FBQzlDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDO1FBRTdCLGFBQWE7UUFDYixNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUN6QixXQUFXLGlCQUFpQixFQUFFLEVBQzlCO1lBQ0UsU0FBUyxFQUFFLE9BQU87WUFDbEIsa0JBQWtCLEVBQUUsSUFBSTtZQUN4QixnQkFBZ0IsRUFBRSxJQUFJO1lBQ3RCLElBQUksRUFBRTtnQkFDSixJQUFJLEVBQUUsV0FBVyxpQkFBaUIsRUFBRTtnQkFDcEMsR0FBRyxJQUFJO2FBQ1I7U0FDRixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsMEJBQTBCO1FBQzFCLE1BQU0sZUFBZSxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQ2pELFdBQVcsaUJBQWlCLEVB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LEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDdEQsSUFBSSxDQUFDLGVBQWUsR0FBRyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3BELElBQUksQ0FBQyxpQkFBaUIsR0FBRyxlQUFlLENBQUMsRUFBRSxDQUFDO1FBRTVDLElBQUksQ0FBQyxlQUFlLENBQUM7WUFDbkIsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO1lBQ2pCLGdCQUFnQixFQUFFLElBQUksQ0FBQyxnQkFBZ0I7WUFDdkMsZUFBZSxFQUFFLElBQUksQ0FBQyxlQUFlO1lBQ3JDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxpQkFBaUI7U0FDMUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBNU1ELDRCQTRNQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogdnBjLXN0YWNrLnRzXG4gKlxuICogVGhpcyBtb2R1bGUgZGVmaW5lcyB0aGUgVnBjU3RhY2sgY29tcG9uZW50IGZvciBjcmVhdGluZyBhIHNlY3VyZSBWUENcbiAqIHdpdGggYm90aCBwdWJsaWMgYW5kIHByaXZhdGUgc3VibmV0cywgTkFUIGdhdGV3YXlzLCBhbmQgcHJvcGVyIHJvdXRpbmcuXG4gKi9cbmltcG9ydCAqIGFzIGF3cyBmcm9tICdAcHVsdW1pL2F3cyc7XG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0IHsgUmVzb3VyY2VPcHRpb25zIH0gZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuXG5leHBvcnQgaW50ZXJmYWNlIFZwY1N0YWNrQXJncyB7XG4gIGVudmlyb25tZW50U3VmZml4Pzogc3RyaW5nO1xuICB0YWdzPzogcHVsdW1pLklucHV0PHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0+O1xuICB2cGNDaWRyPzogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgVnBjU3RhY2sgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgdnBjSWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IHByaXZhdGVTdWJuZXRJZHM6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPltdO1xuICBwdWJsaWMgcmVhZG9ubHkgcHVibGljU3VibmV0SWRzOiBwdWx1bWkuT3V0cHV0PHN0cmluZz5bXTtcbiAgcHVibGljIHJlYWRvbmx5IGludGVybmV0R2F0ZXdheUlkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBWcGNTdGFja0FyZ3MsIG9wdHM/OiBSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICBzdXBlcigndGFwOnZwYzpWcGNTdGFjaycsIG5hbWUsIGFyZ3MsIG9wdHMpO1xuXG4gICAgY29uc3QgZW52aXJvbm1lbnRTdWZmaXggPSBhcmdzLmVudmlyb25tZW50U3VmZml4IHx8ICdkZXYnO1xuICAgIGNvbnN0IHZwY0NpZHIgPSBhcmdzLnZwY0NpZHIgfHwgJzEwLjAuMC4wLzE2JztcbiAgICBjb25zdCB0YWdzID0gYXJncy50YWdzIHx8IHt9O1xuXG4gICAgLy8gQ3JlYXRlIFZQQ1xuICAgIGNvbnN0IHZwYyA9IG5ldyBhd3MuZWMyLlZwYyhcbiAgICAgIGB0YXAtdnBjLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgY2lkckJsb2NrOiB2cGNDaWRyLFxuICAgICAgICBlbmFibGVEbnNIb3N0bmFtZXM6IHRydWUsXG4gICAgICAgIGVuYWJsZURuc1N1cHBvcnQ6IHRydWUsXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBOYW1lOiBgdGFwLXZwYy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBJbnRlcm5ldCBHYXRld2F5XG4gICAgY29uc3QgaW50ZXJuZXRHYXRld2F5ID0gbmV3IGF3cy5lYzIuSW50ZXJuZXRHYXRld2F5KFxuICAgICAgYHRhcC1pZ3ctJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICB2cGNJZDogdnBjLmlkLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgTmFtZTogYHRhcC1pZ3ctJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIC4uLnRhZ3MsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBHZXQgYXZhaWxhYmlsaXR5IHpvbmVzXG4gICAgY29uc3QgYXZhaWxhYmlsaXR5Wm9uZXMgPSBhd3MuZ2V0QXZhaWxhYmlsaXR5Wm9uZXMoe1xuICAgICAgc3RhdGU6ICdhdmFpbGFibGUnLFxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIHN1Ym5ldHMgaW4gbXVsdGlwbGUgQVpzXG4gICAgY29uc3QgcHJpdmF0ZVN1Ym5ldHM6IGF3cy5lYzIuU3VibmV0W10gPSBbXTtcbiAgICBjb25zdCBwdWJsaWNTdWJuZXRzOiBhd3MuZWMyLlN1Ym5ldFtdID0gW107XG4gICAgY29uc3QgbmF0R2F0ZXdheXM6IGF3cy5lYzIuTmF0R2F0ZXdheVtdID0gW107XG5cbiAgICBhdmFpbGFiaWxpdHlab25lcy50aGVuKGF6cyA9PiB7XG4gICAgICBjb25zdCBhekNvdW50ID0gTWF0aC5taW4oYXpzLm5hbWVzLmxlbmd0aCwgMyk7IC8vIFVzZSB1cCB0byAzIEFac1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGF6Q291bnQ7IGkrKykge1xuICAgICAgICBjb25zdCBheiA9IGF6cy5uYW1lc1tpXTtcblxuICAgICAgICAvLyBQdWJsaWMgc3VibmV0XG4gICAgICAgIGNvbnN0IHB1YmxpY1N1Ym5ldCA9IG5ldyBhd3MuZWMyLlN1Ym5ldChcbiAgICAgICAgICBgdGFwLXB1YmxpYy1zdWJuZXQtJHtpfS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAge1xuICAgICAgICAgICAgdnBjSWQ6IHZwYy5pZCxcbiAgICAgICAgICAgIGNpZHJCbG9jazogYDEwLjAuJHtpICogMiArIDF9LjAvMjRgLFxuICAgICAgICAgICAgYXZhaWxhYmlsaXR5Wm9uZTogYXosXG4gICAgICAgICAgICBtYXBQdWJsaWNJcE9uTGF1bmNoOiBmYWxzZSwgLy8gRXhwbGljaXRseSBkaXNhYmxlIGF1dG8tYXNzaWduIHB1YmxpYyBJUFxuICAgICAgICAgICAgdGFnczoge1xuICAgICAgICAgICAgICBOYW1lOiBgdGFwLXB1YmxpYy1zdWJuZXQtJHtpfS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgICAgIFR5cGU6ICdwdWJsaWMnLFxuICAgICAgICAgICAgICAuLi50YWdzLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICAgICAgKTtcblxuICAgICAgICBwdWJsaWNTdWJuZXRzLnB1c2gocHVibGljU3VibmV0KTtcblxuICAgICAgICAvLyBQcml2YXRlIHN1Ym5ldFxuICAgICAgICBjb25zdCBwcml2YXRlU3VibmV0ID0gbmV3IGF3cy5lYzIuU3VibmV0KFxuICAgICAgICAgIGB0YXAtcHJpdmF0ZS1zdWJuZXQtJHtpfS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAge1xuICAgICAgICAgICAgdnBjSWQ6IHZwYy5pZCxcbiAgICAgICAgICAgIGNpZHJCbG9jazogYDEwLjAuJHtpICogMiArIDJ9LjAvMjRgLFxuICAgICAgICAgICAgYXZhaWxhYmlsaXR5Wm9uZTogYXosXG4gICAgICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgICAgIE5hbWU6IGB0YXAtcHJpdmF0ZS1zdWJuZXQtJHtpfS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgICAgIFR5cGU6ICdwcml2YXRlJyxcbiAgICAgICAgICAgICAgLi4udGFncyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICAgICk7XG5cbiAgICAgICAgcHJpdmF0ZVN1Ym5ldHMucHVzaChwcml2YXRlU3VibmV0KTtcblxuICAgICAgICAvLyBFbGFzdGljIElQIGZvciBOQVQgR2F0ZXdheVxuICAgICAgICBjb25zdCBlaXAgPSBuZXcgYXdzLmVjMi5FaXAoXG4gICAgICAgICAgYHRhcC1uYXQtZWlwLSR7aX0tJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGRvbWFpbjogJ3ZwYycsXG4gICAgICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgICAgIE5hbWU6IGB0YXAtbmF0LWVpcC0ke2l9LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICAgICAgLi4udGFncyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gTkFUIEdhdGV3YXlcbiAgICAgICAgY29uc3QgbmF0R2F0ZXdheSA9IG5ldyBhd3MuZWMyLk5hdEdhdGV3YXkoXG4gICAgICAgICAgYHRhcC1uYXQtJHtpfS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAge1xuICAgICAgICAgICAgYWxsb2NhdGlvbklkOiBlaXAuaWQsXG4gICAgICAgICAgICBzdWJuZXRJZDogcHVibGljU3VibmV0LmlkLFxuICAgICAgICAgICAgdGFnczoge1xuICAgICAgICAgICAgICBOYW1lOiBgdGFwLW5hdC0ke2l9LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICAgICAgLi4udGFncyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICAgICk7XG5cbiAgICAgICAgbmF0R2F0ZXdheXMucHVzaChuYXRHYXRld2F5KTtcblxuICAgICAgICAvLyBQcml2YXRlIHJvdXRlIHRhYmxlXG4gICAgICAgIGNvbnN0IHByaXZhdGVSb3V0ZVRhYmxlID0gbmV3IGF3cy5lYzIuUm91dGVUYWJsZShcbiAgICAgICAgICBgdGFwLXByaXZhdGUtcnQtJHtpfS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAge1xuICAgICAgICAgICAgdnBjSWQ6IHZwYy5pZCxcbiAgICAgICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAgICAgTmFtZTogYHRhcC1wcml2YXRlLXJ0LSR7aX0tJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgICAgICAuLi50YWdzLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICAgICAgKTtcblxuICAgICAgICBuZXcgYXdzLmVjMi5Sb3V0ZShcbiAgICAgICAgICBgdGFwLXByaXZhdGUtcm91dGUtJHtpfS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAge1xuICAgICAgICAgICAgcm91dGVUYWJsZUlkOiBwcml2YXRlUm91dGVUYWJsZS5pZCxcbiAgICAgICAgICAgIGRlc3RpbmF0aW9uQ2lkckJsb2NrOiAnMC4wLjAuMC8wJyxcbiAgICAgICAgICAgIG5hdEdhdGV3YXlJZDogbmF0R2F0ZXdheS5pZCxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICAgICAgKTtcblxuICAgICAgICBuZXcgYXdzLmVjMi5Sb3V0ZVRhYmxlQXNzb2NpYXRpb24oXG4gICAgICAgICAgYHRhcC1wcml2YXRlLXJ0YS0ke2l9LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzdWJuZXRJZDogcHJpdmF0ZVN1Ym5ldC5pZCxcbiAgICAgICAgICAgIHJvdXRlVGFibGVJZDogcHJpdmF0ZVJvdXRlVGFibGUuaWQsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBQdWJsaWMgcm91dGUgdGFibGVcbiAgICBjb25zdCBwdWJsaWNSb3V0ZVRhYmxlID0gbmV3IGF3cy5lYzIuUm91dGVUYWJsZShcbiAgICAgIGB0YXAtcHVibGljLXJ0LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgdnBjSWQ6IHZwYy5pZCxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIE5hbWU6IGB0YXAtcHVibGljLXJ0LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICAuLi50YWdzLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgbmV3IGF3cy5lYzIuUm91dGUoXG4gICAgICBgdGFwLXB1YmxpYy1yb3V0ZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIHJvdXRlVGFibGVJZDogcHVibGljUm91dGVUYWJsZS5pZCxcbiAgICAgICAgZGVzdGluYXRpb25DaWRyQmxvY2s6ICcwLjAuMC4wLzAnLFxuICAgICAgICBnYXRld2F5SWQ6IGludGVybmV0R2F0ZXdheS5pZCxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIEFzc29jaWF0ZSBwdWJsaWMgc3VibmV0cyB3aXRoIHB1YmxpYyByb3V0ZSB0YWJsZVxuICAgIHB1YmxpY1N1Ym5ldHMuZm9yRWFjaCgoc3VibmV0LCBpKSA9PiB7XG4gICAgICBuZXcgYXdzLmVjMi5Sb3V0ZVRhYmxlQXNzb2NpYXRpb24oXG4gICAgICAgIGB0YXAtcHVibGljLXJ0YS0ke2l9LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAge1xuICAgICAgICAgIHN1Ym5ldElkOiBzdWJuZXQuaWQsXG4gICAgICAgICAgcm91dGVUYWJsZUlkOiBwdWJsaWNSb3V0ZVRhYmxlLmlkLFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgdGhpcy52cGNJZCA9IHZwYy5pZDtcbiAgICB0aGlzLnByaXZhdGVTdWJuZXRJZHMgPSBwcml2YXRlU3VibmV0cy5tYXAocyA9PiBzLmlkKTtcbiAgICB0aGlzLnB1YmxpY1N1Ym5ldElkcyA9IHB1YmxpY1N1Ym5ldHMubWFwKHMgPT4gcy5pZCk7XG4gICAgdGhpcy5pbnRlcm5ldEdhdGV3YXlJZCA9IGludGVybmV0R2F0ZXdheS5pZDtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIHZwY0lkOiB0aGlzLnZwY0lkLFxuICAgICAgcHJpdmF0ZVN1Ym5ldElkczogdGhpcy5wcml2YXRlU3VibmV0SWRzLFxuICAgICAgcHVibGljU3VibmV0SWRzOiB0aGlzLnB1YmxpY1N1Ym5ldElkcyxcbiAgICAgIGludGVybmV0R2F0ZXdheUlkOiB0aGlzLmludGVybmV0R2F0ZXdheUlkLFxuICAgIH0pO1xuICB9XG59XG4iXX0=