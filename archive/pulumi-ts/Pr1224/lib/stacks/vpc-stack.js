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
        const vpc = new aws.ec2.Vpc(`tap-vpc-${environmentSuffix}`, {
            cidrBlock: vpcCidr,
            enableDnsHostnames: true,
            enableDnsSupport: true,
            tags: { Name: `tap-vpc-${environmentSuffix}`, ...tags },
        }, { parent: this });
        const igw = new aws.ec2.InternetGateway(`tap-igw-${environmentSuffix}`, {
            vpcId: vpc.id,
            tags: { Name: `tap-igw-${environmentSuffix}`, ...tags },
        }, { parent: this });
        const publicRt = new aws.ec2.RouteTable(`tap-public-rt-${environmentSuffix}`, {
            vpcId: vpc.id,
            tags: { Name: `tap-public-rt-${environmentSuffix}`, ...tags },
        }, { parent: this });
        new aws.ec2.Route(`tap-public-route-${environmentSuffix}`, {
            routeTableId: publicRt.id,
            destinationCidrBlock: '0.0.0.0/0',
            gatewayId: igw.id,
        }, { parent: this });
        const azs = aws.getAvailabilityZonesOutput({ state: 'available' });
        const { publicIds, privateIds } = azs.names.apply(names => {
            const use = names.slice(0, Math.min(names.length, 3));
            const publicSubnetIds = [];
            const privateSubnetIds = [];
            use.forEach((az, i) => {
                const pub = new aws.ec2.Subnet(`tap-public-subnet-${i}-${environmentSuffix}`, {
                    vpcId: vpc.id,
                    cidrBlock: `10.0.${i * 2 + 1}.0/24`,
                    availabilityZone: az,
                    mapPublicIpOnLaunch: false,
                    tags: {
                        Name: `tap-public-subnet-${i}-${environmentSuffix}`,
                        Type: 'public',
                        ...tags,
                    },
                }, { parent: this });
                publicSubnetIds.push(pub.id);
                new aws.ec2.RouteTableAssociation(`tap-public-rta-${i}-${environmentSuffix}`, {
                    subnetId: pub.id,
                    routeTableId: publicRt.id,
                }, { parent: this });
                const priv = new aws.ec2.Subnet(`tap-private-subnet-${i}-${environmentSuffix}`, {
                    vpcId: vpc.id,
                    cidrBlock: `10.0.${i * 2 + 2}.0/24`,
                    availabilityZone: az,
                    tags: {
                        Name: `tap-private-subnet-${i}-${environmentSuffix}`,
                        Type: 'private',
                        ...tags,
                    },
                }, { parent: this });
                privateSubnetIds.push(priv.id);
                const eip = new aws.ec2.Eip(`tap-nat-eip-${i}-${environmentSuffix}`, {
                    domain: 'vpc',
                    tags: { Name: `tap-nat-eip-${i}-${environmentSuffix}`, ...tags },
                }, { parent: this });
                const nat = new aws.ec2.NatGateway(`tap-nat-${i}-${environmentSuffix}`, {
                    allocationId: eip.id,
                    subnetId: pub.id,
                    tags: { Name: `tap-nat-${i}-${environmentSuffix}`, ...tags },
                }, { parent: this });
                const privateRt = new aws.ec2.RouteTable(`tap-private-rt-${i}-${environmentSuffix}`, {
                    vpcId: vpc.id,
                    tags: { Name: `tap-private-rt-${i}-${environmentSuffix}`, ...tags },
                }, { parent: this });
                new aws.ec2.Route(`tap-private-route-${i}-${environmentSuffix}`, {
                    routeTableId: privateRt.id,
                    destinationCidrBlock: '0.0.0.0/0',
                    natGatewayId: nat.id,
                }, { parent: this });
                new aws.ec2.RouteTableAssociation(`tap-private-rta-${i}-${environmentSuffix}`, {
                    subnetId: priv.id,
                    routeTableId: privateRt.id,
                }, { parent: this });
            });
            return {
                publicIds: pulumi.all(publicSubnetIds),
                privateIds: pulumi.all(privateSubnetIds),
            };
        });
        this.vpcId = vpc.id;
        this.internetGatewayId = igw.id;
        this.publicSubnetIds = publicIds;
        this.privateSubnetIds = privateIds;
        this.registerOutputs({
            vpcId: this.vpcId,
            internetGatewayId: this.internetGatewayId,
            publicSubnetIds: this.publicSubnetIds,
            privateSubnetIds: this.privateSubnetIds,
        });
    }
}
exports.VpcStack = VpcStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidnBjLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidnBjLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1REFBeUM7QUFTekMsTUFBYSxRQUFTLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUNwQyxLQUFLLENBQXdCO0lBQzdCLGdCQUFnQixDQUEwQjtJQUMxQyxlQUFlLENBQTBCO0lBQ3pDLGlCQUFpQixDQUF3QjtJQUV6RCxZQUFZLElBQVksRUFBRSxJQUFrQixFQUFFLElBQXNCO1FBQ2xFLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTVDLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixJQUFJLEtBQUssQ0FBQztRQUMxRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxJQUFJLGFBQWEsQ0FBQztRQUM5QyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQztRQUU3QixNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUN6QixXQUFXLGlCQUFpQixFQUFFLEVBQzlCO1lBQ0UsU0FBUyxFQUFFLE9BQU87WUFDbEIsa0JBQWtCLEVBQUUsSUFBSTtZQUN4QixnQkFBZ0IsRUFBRSxJQUFJO1lBQ3RCLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxXQUFXLGlCQUFpQixFQUFFLEVBQUUsR0FBRyxJQUFJLEVBQUU7U0FDeEQsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQ3JDLFdBQVcsaUJBQWlCLEVBQUUsRUFDOUI7WUFDRSxLQUFLLEVBQUUsR0FBRyxDQUFDLEVBQUU7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QkFBZ0I7U0FDeEMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBMUtELDRCQTBLQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF3cyBmcm9tICdAcHVsdW1pL2F3cyc7XG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0IHsgUmVzb3VyY2VPcHRpb25zIH0gZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuXG5leHBvcnQgaW50ZXJmYWNlIFZwY1N0YWNrQXJncyB7XG4gIGVudmlyb25tZW50U3VmZml4Pzogc3RyaW5nO1xuICB0YWdzPzogcHVsdW1pLklucHV0PHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0+O1xuICB2cGNDaWRyPzogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgVnBjU3RhY2sgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgdnBjSWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IHByaXZhdGVTdWJuZXRJZHM6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nW10+O1xuICBwdWJsaWMgcmVhZG9ubHkgcHVibGljU3VibmV0SWRzOiBwdWx1bWkuT3V0cHV0PHN0cmluZ1tdPjtcbiAgcHVibGljIHJlYWRvbmx5IGludGVybmV0R2F0ZXdheUlkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBWcGNTdGFja0FyZ3MsIG9wdHM/OiBSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICBzdXBlcigndGFwOnZwYzpWcGNTdGFjaycsIG5hbWUsIGFyZ3MsIG9wdHMpO1xuXG4gICAgY29uc3QgZW52aXJvbm1lbnRTdWZmaXggPSBhcmdzLmVudmlyb25tZW50U3VmZml4IHx8ICdkZXYnO1xuICAgIGNvbnN0IHZwY0NpZHIgPSBhcmdzLnZwY0NpZHIgfHwgJzEwLjAuMC4wLzE2JztcbiAgICBjb25zdCB0YWdzID0gYXJncy50YWdzIHx8IHt9O1xuXG4gICAgY29uc3QgdnBjID0gbmV3IGF3cy5lYzIuVnBjKFxuICAgICAgYHRhcC12cGMtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBjaWRyQmxvY2s6IHZwY0NpZHIsXG4gICAgICAgIGVuYWJsZURuc0hvc3RuYW1lczogdHJ1ZSxcbiAgICAgICAgZW5hYmxlRG5zU3VwcG9ydDogdHJ1ZSxcbiAgICAgICAgdGFnczogeyBOYW1lOiBgdGFwLXZwYy0ke2Vudmlyb25tZW50U3VmZml4fWAsIC4uLnRhZ3MgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIGNvbnN0IGlndyA9IG5ldyBhd3MuZWMyLkludGVybmV0R2F0ZXdheShcbiAgICAgIGB0YXAtaWd3LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgdnBjSWQ6IHZwYy5pZCxcbiAgICAgICAgdGFnczogeyBOYW1lOiBgdGFwLWlndy0ke2Vudmlyb25tZW50U3VmZml4fWAsIC4uLnRhZ3MgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIGNvbnN0IHB1YmxpY1J0ID0gbmV3IGF3cy5lYzIuUm91dGVUYWJsZShcbiAgICAgIGB0YXAtcHVibGljLXJ0LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgdnBjSWQ6IHZwYy5pZCxcbiAgICAgICAgdGFnczogeyBOYW1lOiBgdGFwLXB1YmxpYy1ydC0ke2Vudmlyb25tZW50U3VmZml4fWAsIC4uLnRhZ3MgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIG5ldyBhd3MuZWMyLlJvdXRlKFxuICAgICAgYHRhcC1wdWJsaWMtcm91dGUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICByb3V0ZVRhYmxlSWQ6IHB1YmxpY1J0LmlkLFxuICAgICAgICBkZXN0aW5hdGlvbkNpZHJCbG9jazogJzAuMC4wLjAvMCcsXG4gICAgICAgIGdhdGV3YXlJZDogaWd3LmlkLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgY29uc3QgYXpzID0gYXdzLmdldEF2YWlsYWJpbGl0eVpvbmVzT3V0cHV0KHsgc3RhdGU6ICdhdmFpbGFibGUnIH0pO1xuXG4gICAgY29uc3QgeyBwdWJsaWNJZHMsIHByaXZhdGVJZHMgfSA9IGF6cy5uYW1lcy5hcHBseShuYW1lcyA9PiB7XG4gICAgICBjb25zdCB1c2UgPSBuYW1lcy5zbGljZSgwLCBNYXRoLm1pbihuYW1lcy5sZW5ndGgsIDMpKTtcbiAgICAgIGNvbnN0IHB1YmxpY1N1Ym5ldElkczogcHVsdW1pLk91dHB1dDxzdHJpbmc+W10gPSBbXTtcbiAgICAgIGNvbnN0IHByaXZhdGVTdWJuZXRJZHM6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPltdID0gW107XG5cbiAgICAgIHVzZS5mb3JFYWNoKChheiwgaSkgPT4ge1xuICAgICAgICBjb25zdCBwdWIgPSBuZXcgYXdzLmVjMi5TdWJuZXQoXG4gICAgICAgICAgYHRhcC1wdWJsaWMtc3VibmV0LSR7aX0tJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHZwY0lkOiB2cGMuaWQsXG4gICAgICAgICAgICBjaWRyQmxvY2s6IGAxMC4wLiR7aSAqIDIgKyAxfS4wLzI0YCxcbiAgICAgICAgICAgIGF2YWlsYWJpbGl0eVpvbmU6IGF6LFxuICAgICAgICAgICAgbWFwUHVibGljSXBPbkxhdW5jaDogZmFsc2UsXG4gICAgICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgICAgIE5hbWU6IGB0YXAtcHVibGljLXN1Ym5ldC0ke2l9LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICAgICAgVHlwZTogJ3B1YmxpYycsXG4gICAgICAgICAgICAgIC4uLnRhZ3MsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICAgICApO1xuXG4gICAgICAgIHB1YmxpY1N1Ym5ldElkcy5wdXNoKHB1Yi5pZCk7XG5cbiAgICAgICAgbmV3IGF3cy5lYzIuUm91dGVUYWJsZUFzc29jaWF0aW9uKFxuICAgICAgICAgIGB0YXAtcHVibGljLXJ0YS0ke2l9LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzdWJuZXRJZDogcHViLmlkLFxuICAgICAgICAgICAgcm91dGVUYWJsZUlkOiBwdWJsaWNSdC5pZCxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCBwcml2ID0gbmV3IGF3cy5lYzIuU3VibmV0KFxuICAgICAgICAgIGB0YXAtcHJpdmF0ZS1zdWJuZXQtJHtpfS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAge1xuICAgICAgICAgICAgdnBjSWQ6IHZwYy5pZCxcbiAgICAgICAgICAgIGNpZHJCbG9jazogYDEwLjAuJHtpICogMiArIDJ9LjAvMjRgLFxuICAgICAgICAgICAgYXZhaWxhYmlsaXR5Wm9uZTogYXosXG4gICAgICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgICAgIE5hbWU6IGB0YXAtcHJpdmF0ZS1zdWJuZXQtJHtpfS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgICAgIFR5cGU6ICdwcml2YXRlJyxcbiAgICAgICAgICAgICAgLi4udGFncyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICAgICk7XG5cbiAgICAgICAgcHJpdmF0ZVN1Ym5ldElkcy5wdXNoKHByaXYuaWQpO1xuXG4gICAgICAgIGNvbnN0IGVpcCA9IG5ldyBhd3MuZWMyLkVpcChcbiAgICAgICAgICBgdGFwLW5hdC1laXAtJHtpfS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAge1xuICAgICAgICAgICAgZG9tYWluOiAndnBjJyxcbiAgICAgICAgICAgIHRhZ3M6IHsgTmFtZTogYHRhcC1uYXQtZWlwLSR7aX0tJHtlbnZpcm9ubWVudFN1ZmZpeH1gLCAuLi50YWdzIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc3QgbmF0ID0gbmV3IGF3cy5lYzIuTmF0R2F0ZXdheShcbiAgICAgICAgICBgdGFwLW5hdC0ke2l9LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBhbGxvY2F0aW9uSWQ6IGVpcC5pZCxcbiAgICAgICAgICAgIHN1Ym5ldElkOiBwdWIuaWQsXG4gICAgICAgICAgICB0YWdzOiB7IE5hbWU6IGB0YXAtbmF0LSR7aX0tJHtlbnZpcm9ubWVudFN1ZmZpeH1gLCAuLi50YWdzIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc3QgcHJpdmF0ZVJ0ID0gbmV3IGF3cy5lYzIuUm91dGVUYWJsZShcbiAgICAgICAgICBgdGFwLXByaXZhdGUtcnQtJHtpfS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAge1xuICAgICAgICAgICAgdnBjSWQ6IHZwYy5pZCxcbiAgICAgICAgICAgIHRhZ3M6IHsgTmFtZTogYHRhcC1wcml2YXRlLXJ0LSR7aX0tJHtlbnZpcm9ubWVudFN1ZmZpeH1gLCAuLi50YWdzIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICAgICk7XG5cbiAgICAgICAgbmV3IGF3cy5lYzIuUm91dGUoXG4gICAgICAgICAgYHRhcC1wcml2YXRlLXJvdXRlLSR7aX0tJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHJvdXRlVGFibGVJZDogcHJpdmF0ZVJ0LmlkLFxuICAgICAgICAgICAgZGVzdGluYXRpb25DaWRyQmxvY2s6ICcwLjAuMC4wLzAnLFxuICAgICAgICAgICAgbmF0R2F0ZXdheUlkOiBuYXQuaWQsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICAgICk7XG5cbiAgICAgICAgbmV3IGF3cy5lYzIuUm91dGVUYWJsZUFzc29jaWF0aW9uKFxuICAgICAgICAgIGB0YXAtcHJpdmF0ZS1ydGEtJHtpfS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3VibmV0SWQ6IHByaXYuaWQsXG4gICAgICAgICAgICByb3V0ZVRhYmxlSWQ6IHByaXZhdGVSdC5pZCxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICAgICAgKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBwdWJsaWNJZHM6IHB1bHVtaS5hbGwocHVibGljU3VibmV0SWRzKSxcbiAgICAgICAgcHJpdmF0ZUlkczogcHVsdW1pLmFsbChwcml2YXRlU3VibmV0SWRzKSxcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICB0aGlzLnZwY0lkID0gdnBjLmlkO1xuICAgIHRoaXMuaW50ZXJuZXRHYXRld2F5SWQgPSBpZ3cuaWQ7XG4gICAgdGhpcy5wdWJsaWNTdWJuZXRJZHMgPSBwdWJsaWNJZHM7XG4gICAgdGhpcy5wcml2YXRlU3VibmV0SWRzID0gcHJpdmF0ZUlkcztcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIHZwY0lkOiB0aGlzLnZwY0lkLFxuICAgICAgaW50ZXJuZXRHYXRld2F5SWQ6IHRoaXMuaW50ZXJuZXRHYXRld2F5SWQsXG4gICAgICBwdWJsaWNTdWJuZXRJZHM6IHRoaXMucHVibGljU3VibmV0SWRzLFxuICAgICAgcHJpdmF0ZVN1Ym5ldElkczogdGhpcy5wcml2YXRlU3VibmV0SWRzLFxuICAgIH0pO1xuICB9XG59XG4iXX0=