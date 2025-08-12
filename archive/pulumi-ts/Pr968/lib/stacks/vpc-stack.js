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
 * with public subnet for the EC2 infrastructure.
 */
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
class VpcStack extends pulumi.ComponentResource {
    vpcId;
    publicSubnetId;
    internetGatewayId;
    constructor(name, args, opts) {
        super('tap:vpc:VpcStack', name, args, opts);
        const environmentSuffix = args.environmentSuffix || 'dev';
        const tags = args.tags || {};
        // Create VPC
        const vpc = new aws.ec2.Vpc(`tap-vpc-${environmentSuffix}`, {
            cidrBlock: '10.0.0.0/16',
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
        // Create public subnet
        const publicSubnet = new aws.ec2.Subnet(`tap-public-subnet-${environmentSuffix}`, {
            vpcId: vpc.id,
            cidrBlock: '10.0.1.0/24',
            availabilityZone: availabilityZones.then(azs => azs.names[0]),
            mapPublicIpOnLaunch: true,
            tags: {
                Name: `tap-public-subnet-${environmentSuffix}`,
                Type: 'public',
                ...tags,
            },
        }, { parent: this });
        // Create route table for public subnet
        const publicRouteTable = new aws.ec2.RouteTable(`tap-public-rt-${environmentSuffix}`, {
            vpcId: vpc.id,
            tags: {
                Name: `tap-public-rt-${environmentSuffix}`,
                ...tags,
            },
        }, { parent: this });
        // Create route to internet gateway
        new aws.ec2.Route(`tap-public-route-${environmentSuffix}`, {
            routeTableId: publicRouteTable.id,
            destinationCidrBlock: '0.0.0.0/0',
            gatewayId: internetGateway.id,
        }, { parent: this });
        // Associate route table with public subnet
        new aws.ec2.RouteTableAssociation(`tap-public-rta-${environmentSuffix}`, {
            subnetId: publicSubnet.id,
            routeTableId: publicRouteTable.id,
        }, { parent: this });
        this.vpcId = vpc.id;
        this.publicSubnetId = publicSubnet.id;
        this.internetGatewayId = internetGateway.id;
        this.registerOutputs({
            vpcId: this.vpcId,
            publicSubnetId: this.publicSubnetId,
            internetGatewayId: this.internetGatewayId,
        });
    }
}
exports.VpcStack = VpcStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidnBjLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidnBjLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7OztHQUtHO0FBQ0gsaURBQW1DO0FBQ25DLHVEQUF5QztBQWN6QyxNQUFhLFFBQVMsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQ3BDLEtBQUssQ0FBd0I7SUFDN0IsY0FBYyxDQUF3QjtJQUN0QyxpQkFBaUIsQ0FBd0I7SUFFekQsWUFBWSxJQUFZLEVBQUUsSUFBa0IsRUFBRSxJQUFzQjtRQUNsRSxLQUFLLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUU1QyxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxpQkFBaUIsSUFBSSxLQUFLLENBQUM7UUFDMUQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUM7UUFFN0IsYUFBYTtRQUNiLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQ3pCLFdBQVcsaUJBQWlCLEVBQUUsRUFDOUI7WUFDRSxTQUFTLEVBQUUsYUFBYTtZQUN4QixrQkFBa0IsRUFBRSxJQUFJO1lBQ3hCLGdCQUFnQixFQUFFLElBQUk7WUFDdEIsSUFBSSxFQUFFO2dCQUNKLElBQUksRUFBRSxXQUFXLGlCQUFpQixFQUFFO2dCQUNwQyxHQUFHLElBQUk7YUFDUjtTQUNGLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRiwwQkFBMEI7UUFDMUIsTUFBTSxlQUFlLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FDakQsV0FBVyxpQkFBaUIsRUFBRSxFQUM5QjtZQUNFLEtBQUssRUFBRSxHQUFHLENBQUMsRUFBRTtZQUNiLElBQUksRUFBRTtnQkFDSixJQUFJLEVBQUUsV0FBVyxpQkFBaUIsRUFBRTtnQkFDcEMsR0FBRyxJQUFJO2FBQ1I7U0FDRixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYseUJBQXlCO1FBQ3pCLE1BQU0saUJBQWlCLEdBQUcsR0FBRyxDQUFDLG9CQUFvQixDQUFDO1lBQ2pELEtBQUssRUFBRSxXQUFXO1NBQ25CLENBQUMsQ0FBQztRQUVILHVCQUF1QjtRQUN2QixNQUFNLFlBQVksR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUNyQyxxQkFBcUIsaUJBQWlCLEVBQUUsRUFDeEM7WUFDRSxLQUFLLEVBQUUsR0FBRyxDQUFDLEVBQUU7WUFDYixTQUFTLEVBQUUsYUFBYTtZQUN4QixnQkFBZ0IsRUFBRSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzdELG1CQUFtQixFQUFFLElBQUk7WUFDekIsSUFBSSxFQUFFO2dCQUNKLElBQUksRUFBRSxxQkFBcUIsaUJBQWlCLEVBQUU7Z0JBQzlDLElBQUksRUFBRSxRQUFRO2dCQUNkLEdBQUcsSUFBSTthQUNSO1NBQ0YsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLHVDQUF1QztRQUN2QyxNQUFNLGdCQUFnQixHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQzdDLGlCQUFpQixpQkFBaUIsRUFBRSxFQUNwQztZQUNFLEtBQUssRUFBRSxHQUFHLENBQUMsRUFBRTtZQUNiLElBQUksRUFBRTtnQkFDSixJQUFJLEVBQUUsaUJBQWlCLGlCQUFpQixFQUFFO2dCQUMxQyxHQUFHLElBQUk7YUFDUjtTQUNGLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRixtQ0FBbUM7UUFDbkMsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FDZixvQkFBb0IsaUJBQWlCLEVBQUUsRUFDdkM7WUFDRSxZQUFZLEVBQUUsZ0JBQWdCLENBQUMsRUFBRTtZQUNqQyxvQkFBb0IsRUFBRSxXQUFXO1lBQ2pDLFNBQVMsRUFBRSxlQUFlLENBQUMsRUFBRTtTQUM5QixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsMkNBQTJDO1FBQzNDLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FDL0Isa0JBQWtCLGlCQUFpQixFQUFFLEVBQ3JDO1lBQ0UsUUFBUSxFQUFFLFlBQVksQ0FBQyxFQUFFO1lBQ3pCLFlBQVksRUFBRSxnQkFBZ0IsQ0FBQyxFQUFFO1NBQ2xDLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRixJQUFJLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFDcEIsSUFBSSxDQUFDLGNBQWMsR0FBRyxZQUFZLENBQUMsRUFBRSxDQUFDO1FBQ3RDLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxlQUFlLENBQUMsRUFBRSxDQUFDO1FBRTVDLElBQUksQ0FBQyxlQUFlLENBQUM7WUFDbkIsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO1lBQ2pCLGNBQWMsRUFBRSxJQUFJLENBQUMsY0FBYztZQUNuQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsaUJBQWlCO1NBQzFDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXpHRCw0QkF5R0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIHZwYy1zdGFjay50c1xuICpcbiAqIFRoaXMgbW9kdWxlIGRlZmluZXMgdGhlIFZwY1N0YWNrIGNvbXBvbmVudCBmb3IgY3JlYXRpbmcgYSBzZWN1cmUgVlBDXG4gKiB3aXRoIHB1YmxpYyBzdWJuZXQgZm9yIHRoZSBFQzIgaW5mcmFzdHJ1Y3R1cmUuXG4gKi9cbmltcG9ydCAqIGFzIGF3cyBmcm9tICdAcHVsdW1pL2F3cyc7XG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0IHsgUmVzb3VyY2VPcHRpb25zIH0gZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuXG5leHBvcnQgaW50ZXJmYWNlIFZwY1N0YWNrQXJncyB7XG4gIGVudmlyb25tZW50U3VmZml4Pzogc3RyaW5nO1xuICB0YWdzPzogcHVsdW1pLklucHV0PHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFZwY1N0YWNrT3V0cHV0cyB7XG4gIHZwY0lkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpY1N1Ym5ldElkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIGludGVybmV0R2F0ZXdheUlkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG59XG5cbmV4cG9ydCBjbGFzcyBWcGNTdGFjayBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSB2cGNJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgcHVibGljU3VibmV0SWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGludGVybmV0R2F0ZXdheUlkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBWcGNTdGFja0FyZ3MsIG9wdHM/OiBSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICBzdXBlcigndGFwOnZwYzpWcGNTdGFjaycsIG5hbWUsIGFyZ3MsIG9wdHMpO1xuXG4gICAgY29uc3QgZW52aXJvbm1lbnRTdWZmaXggPSBhcmdzLmVudmlyb25tZW50U3VmZml4IHx8ICdkZXYnO1xuICAgIGNvbnN0IHRhZ3MgPSBhcmdzLnRhZ3MgfHwge307XG5cbiAgICAvLyBDcmVhdGUgVlBDXG4gICAgY29uc3QgdnBjID0gbmV3IGF3cy5lYzIuVnBjKFxuICAgICAgYHRhcC12cGMtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBjaWRyQmxvY2s6ICcxMC4wLjAuMC8xNicsXG4gICAgICAgIGVuYWJsZURuc0hvc3RuYW1lczogdHJ1ZSxcbiAgICAgICAgZW5hYmxlRG5zU3VwcG9ydDogdHJ1ZSxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIE5hbWU6IGB0YXAtdnBjLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICAuLi50YWdzLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIEludGVybmV0IEdhdGV3YXlcbiAgICBjb25zdCBpbnRlcm5ldEdhdGV3YXkgPSBuZXcgYXdzLmVjMi5JbnRlcm5ldEdhdGV3YXkoXG4gICAgICBgdGFwLWlndy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIHZwY0lkOiB2cGMuaWQsXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBOYW1lOiBgdGFwLWlndy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIEdldCBhdmFpbGFiaWxpdHkgem9uZXNcbiAgICBjb25zdCBhdmFpbGFiaWxpdHlab25lcyA9IGF3cy5nZXRBdmFpbGFiaWxpdHlab25lcyh7XG4gICAgICBzdGF0ZTogJ2F2YWlsYWJsZScsXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgcHVibGljIHN1Ym5ldFxuICAgIGNvbnN0IHB1YmxpY1N1Ym5ldCA9IG5ldyBhd3MuZWMyLlN1Ym5ldChcbiAgICAgIGB0YXAtcHVibGljLXN1Ym5ldC0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIHZwY0lkOiB2cGMuaWQsXG4gICAgICAgIGNpZHJCbG9jazogJzEwLjAuMS4wLzI0JyxcbiAgICAgICAgYXZhaWxhYmlsaXR5Wm9uZTogYXZhaWxhYmlsaXR5Wm9uZXMudGhlbihhenMgPT4gYXpzLm5hbWVzWzBdKSxcbiAgICAgICAgbWFwUHVibGljSXBPbkxhdW5jaDogdHJ1ZSxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIE5hbWU6IGB0YXAtcHVibGljLXN1Ym5ldC0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgVHlwZTogJ3B1YmxpYycsXG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSByb3V0ZSB0YWJsZSBmb3IgcHVibGljIHN1Ym5ldFxuICAgIGNvbnN0IHB1YmxpY1JvdXRlVGFibGUgPSBuZXcgYXdzLmVjMi5Sb3V0ZVRhYmxlKFxuICAgICAgYHRhcC1wdWJsaWMtcnQtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICB2cGNJZDogdnBjLmlkLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgTmFtZTogYHRhcC1wdWJsaWMtcnQtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIC4uLnRhZ3MsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgcm91dGUgdG8gaW50ZXJuZXQgZ2F0ZXdheVxuICAgIG5ldyBhd3MuZWMyLlJvdXRlKFxuICAgICAgYHRhcC1wdWJsaWMtcm91dGUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICByb3V0ZVRhYmxlSWQ6IHB1YmxpY1JvdXRlVGFibGUuaWQsXG4gICAgICAgIGRlc3RpbmF0aW9uQ2lkckJsb2NrOiAnMC4wLjAuMC8wJyxcbiAgICAgICAgZ2F0ZXdheUlkOiBpbnRlcm5ldEdhdGV3YXkuaWQsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBBc3NvY2lhdGUgcm91dGUgdGFibGUgd2l0aCBwdWJsaWMgc3VibmV0XG4gICAgbmV3IGF3cy5lYzIuUm91dGVUYWJsZUFzc29jaWF0aW9uKFxuICAgICAgYHRhcC1wdWJsaWMtcnRhLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgc3VibmV0SWQ6IHB1YmxpY1N1Ym5ldC5pZCxcbiAgICAgICAgcm91dGVUYWJsZUlkOiBwdWJsaWNSb3V0ZVRhYmxlLmlkLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgdGhpcy52cGNJZCA9IHZwYy5pZDtcbiAgICB0aGlzLnB1YmxpY1N1Ym5ldElkID0gcHVibGljU3VibmV0LmlkO1xuICAgIHRoaXMuaW50ZXJuZXRHYXRld2F5SWQgPSBpbnRlcm5ldEdhdGV3YXkuaWQ7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICB2cGNJZDogdGhpcy52cGNJZCxcbiAgICAgIHB1YmxpY1N1Ym5ldElkOiB0aGlzLnB1YmxpY1N1Ym5ldElkLFxuICAgICAgaW50ZXJuZXRHYXRld2F5SWQ6IHRoaXMuaW50ZXJuZXRHYXRld2F5SWQsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==