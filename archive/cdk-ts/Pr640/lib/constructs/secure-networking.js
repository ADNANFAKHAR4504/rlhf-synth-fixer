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
exports.SecureNetworking = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const networkfirewall = __importStar(require("aws-cdk-lib/aws-networkfirewall"));
const constructs_1 = require("constructs");
class SecureNetworking extends constructs_1.Construct {
    vpc;
    webServerSecurityGroup;
    constructor(scope, id, props = {}) {
        super(scope, id);
        // Create VPC with public and private subnets
        this.vpc = new ec2.Vpc(this, 'ProductionVPC', {
            maxAzs: props.maxAzs || 2,
            cidr: props.cidr || '10.0.0.0/16',
            subnetConfiguration: [
                {
                    cidrMask: 24,
                    name: 'public',
                    subnetType: ec2.SubnetType.PUBLIC,
                },
                {
                    cidrMask: 24,
                    name: 'private-with-egress',
                    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                },
            ],
            enableDnsHostnames: true,
            enableDnsSupport: true,
        });
        // Security group for web server
        this.webServerSecurityGroup = new ec2.SecurityGroup(this, 'WebServerSecurityGroup', {
            vpc: this.vpc,
            description: 'Security group for web server',
            allowAllOutbound: true,
        });
        // Allow SSH access from specific IP (replace with your IP)
        this.webServerSecurityGroup.addIngressRule(ec2.Peer.ipv4('203.0.113.0/24'), // Replace with your IP address
        ec2.Port.tcp(22), 'SSH access from authorized IP');
        // Allow HTTP traffic
        this.webServerSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'HTTP access');
        // Allow HTTPS traffic
        this.webServerSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'HTTPS access');
        // Network Firewall for enhanced security
        const firewallPolicy = new networkfirewall.CfnFirewallPolicy(this, 'FirewallPolicy', {
            firewallPolicyName: 'production-firewall-policy',
            firewallPolicy: {
                statelessDefaultActions: ['aws:pass'],
                statelessFragmentDefaultActions: ['aws:pass'],
                statefulRuleGroupReferences: [],
            },
        });
        new networkfirewall.CfnFirewall(this, 'NetworkFirewall', {
            firewallName: 'production-network-firewall',
            firewallPolicyArn: firewallPolicy.attrFirewallPolicyArn,
            vpcId: this.vpc.vpcId,
            subnetMappings: this.vpc.publicSubnets.map(subnet => ({
                subnetId: subnet.subnetId,
            })),
        });
        // Apply tags
        cdk.Tags.of(this.vpc).add('Environment', 'Production');
        cdk.Tags.of(this.webServerSecurityGroup).add('Environment', 'Production');
    }
}
exports.SecureNetworking = SecureNetworking;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjdXJlLW5ldHdvcmtpbmcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzZWN1cmUtbmV0d29ya2luZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMseURBQTJDO0FBQzNDLGlGQUFtRTtBQUNuRSwyQ0FBdUM7QUFPdkMsTUFBYSxnQkFBaUIsU0FBUSxzQkFBUztJQUM3QixHQUFHLENBQVU7SUFDYixzQkFBc0IsQ0FBb0I7SUFFMUQsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxRQUErQixFQUFFO1FBQ3pFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsNkNBQTZDO1FBQzdDLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7WUFDNUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQztZQUN6QixJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksSUFBSSxhQUFhO1lBQ2pDLG1CQUFtQixFQUFFO2dCQUNuQjtvQkFDRSxRQUFRLEVBQUUsRUFBRTtvQkFDWixJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxNQUFNO2lCQUNsQztnQkFDRDtvQkFDRSxRQUFRLEVBQUUsRUFBRTtvQkFDWixJQUFJLEVBQUUscUJBQXFCO29CQUMzQixVQUFVLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxtQkFBbUI7aUJBQy9DO2FBQ0Y7WUFDRCxrQkFBa0IsRUFBRSxJQUFJO1lBQ3hCLGdCQUFnQixFQUFFLElBQUk7U0FDdkIsQ0FBQyxDQUFDO1FBRUgsZ0NBQWdDO1FBQ2hDLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLEdBQUcsQ0FBQyxhQUFhLENBQ2pELElBQUksRUFDSix3QkFBd0IsRUFDeEI7WUFDRSxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUc7WUFDYixXQUFXLEVBQUUsK0JBQStCO1lBQzVDLGdCQUFnQixFQUFFLElBQUk7U0FDdkIsQ0FDRixDQUFDO1FBRUYsMkRBQTJEO1FBQzNELElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxjQUFjLENBQ3hDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsK0JBQStCO1FBQ2hFLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUNoQiwrQkFBK0IsQ0FDaEMsQ0FBQztRQUVGLHFCQUFxQjtRQUNyQixJQUFJLENBQUMsc0JBQXNCLENBQUMsY0FBYyxDQUN4QyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUNsQixHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFDaEIsYUFBYSxDQUNkLENBQUM7UUFFRixzQkFBc0I7UUFDdEIsSUFBSSxDQUFDLHNCQUFzQixDQUFDLGNBQWMsQ0FDeEMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFDbEIsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQ2pCLGNBQWMsQ0FDZixDQUFDO1FBRUYseUNBQXlDO1FBQ3pDLE1BQU0sY0FBYyxHQUFHLElBQUksZUFBZSxDQUFDLGlCQUFpQixDQUMxRCxJQUFJLEVBQ0osZ0JBQWdCLEVBQ2hCO1lBQ0Usa0JBQWtCLEVBQUUsNEJBQTRCO1lBQ2hELGNBQWMsRUFBRTtnQkFDZCx1QkFBdUIsRUFBRSxDQUFDLFVBQVUsQ0FBQztnQkFDckMsK0JBQStCLEVBQUUsQ0FBQyxVQUFVLENBQUM7Z0JBQzdDLDJCQUEyQixFQUFFLEVBQUU7YUFDaEM7U0FDRixDQUNGLENBQUM7UUFFRixJQUFJLGVBQWUsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1lBQ3ZELFlBQVksRUFBRSw2QkFBNkI7WUFDM0MsaUJBQWlCLEVBQUUsY0FBYyxDQUFDLHFCQUFxQjtZQUN2RCxLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLO1lBQ3JCLGNBQWMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNwRCxRQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVE7YUFDMUIsQ0FBQyxDQUFDO1NBQ0osQ0FBQyxDQUFDO1FBRUgsYUFBYTtRQUNiLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ3ZELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDNUUsQ0FBQztDQUNGO0FBdEZELDRDQXNGQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBlYzIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjMic7XG5pbXBvcnQgKiBhcyBuZXR3b3JrZmlyZXdhbGwgZnJvbSAnYXdzLWNkay1saWIvYXdzLW5ldHdvcmtmaXJld2FsbCc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuZXhwb3J0IGludGVyZmFjZSBTZWN1cmVOZXR3b3JraW5nUHJvcHMge1xuICByZWFkb25seSBjaWRyPzogc3RyaW5nO1xuICByZWFkb25seSBtYXhBenM/OiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBTZWN1cmVOZXR3b3JraW5nIGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgcHVibGljIHJlYWRvbmx5IHZwYzogZWMyLlZwYztcbiAgcHVibGljIHJlYWRvbmx5IHdlYlNlcnZlclNlY3VyaXR5R3JvdXA6IGVjMi5TZWN1cml0eUdyb3VwO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBTZWN1cmVOZXR3b3JraW5nUHJvcHMgPSB7fSkge1xuICAgIHN1cGVyKHNjb3BlLCBpZCk7XG5cbiAgICAvLyBDcmVhdGUgVlBDIHdpdGggcHVibGljIGFuZCBwcml2YXRlIHN1Ym5ldHNcbiAgICB0aGlzLnZwYyA9IG5ldyBlYzIuVnBjKHRoaXMsICdQcm9kdWN0aW9uVlBDJywge1xuICAgICAgbWF4QXpzOiBwcm9wcy5tYXhBenMgfHwgMixcbiAgICAgIGNpZHI6IHByb3BzLmNpZHIgfHwgJzEwLjAuMC4wLzE2JyxcbiAgICAgIHN1Ym5ldENvbmZpZ3VyYXRpb246IFtcbiAgICAgICAge1xuICAgICAgICAgIGNpZHJNYXNrOiAyNCxcbiAgICAgICAgICBuYW1lOiAncHVibGljJyxcbiAgICAgICAgICBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QVUJMSUMsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBjaWRyTWFzazogMjQsXG4gICAgICAgICAgbmFtZTogJ3ByaXZhdGUtd2l0aC1lZ3Jlc3MnLFxuICAgICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBSSVZBVEVfV0lUSF9FR1JFU1MsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgZW5hYmxlRG5zSG9zdG5hbWVzOiB0cnVlLFxuICAgICAgZW5hYmxlRG5zU3VwcG9ydDogdHJ1ZSxcbiAgICB9KTtcblxuICAgIC8vIFNlY3VyaXR5IGdyb3VwIGZvciB3ZWIgc2VydmVyXG4gICAgdGhpcy53ZWJTZXJ2ZXJTZWN1cml0eUdyb3VwID0gbmV3IGVjMi5TZWN1cml0eUdyb3VwKFxuICAgICAgdGhpcyxcbiAgICAgICdXZWJTZXJ2ZXJTZWN1cml0eUdyb3VwJyxcbiAgICAgIHtcbiAgICAgICAgdnBjOiB0aGlzLnZwYyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdTZWN1cml0eSBncm91cCBmb3Igd2ViIHNlcnZlcicsXG4gICAgICAgIGFsbG93QWxsT3V0Ym91bmQ6IHRydWUsXG4gICAgICB9XG4gICAgKTtcblxuICAgIC8vIEFsbG93IFNTSCBhY2Nlc3MgZnJvbSBzcGVjaWZpYyBJUCAocmVwbGFjZSB3aXRoIHlvdXIgSVApXG4gICAgdGhpcy53ZWJTZXJ2ZXJTZWN1cml0eUdyb3VwLmFkZEluZ3Jlc3NSdWxlKFxuICAgICAgZWMyLlBlZXIuaXB2NCgnMjAzLjAuMTEzLjAvMjQnKSwgLy8gUmVwbGFjZSB3aXRoIHlvdXIgSVAgYWRkcmVzc1xuICAgICAgZWMyLlBvcnQudGNwKDIyKSxcbiAgICAgICdTU0ggYWNjZXNzIGZyb20gYXV0aG9yaXplZCBJUCdcbiAgICApO1xuXG4gICAgLy8gQWxsb3cgSFRUUCB0cmFmZmljXG4gICAgdGhpcy53ZWJTZXJ2ZXJTZWN1cml0eUdyb3VwLmFkZEluZ3Jlc3NSdWxlKFxuICAgICAgZWMyLlBlZXIuYW55SXB2NCgpLFxuICAgICAgZWMyLlBvcnQudGNwKDgwKSxcbiAgICAgICdIVFRQIGFjY2VzcydcbiAgICApO1xuXG4gICAgLy8gQWxsb3cgSFRUUFMgdHJhZmZpY1xuICAgIHRoaXMud2ViU2VydmVyU2VjdXJpdHlHcm91cC5hZGRJbmdyZXNzUnVsZShcbiAgICAgIGVjMi5QZWVyLmFueUlwdjQoKSxcbiAgICAgIGVjMi5Qb3J0LnRjcCg0NDMpLFxuICAgICAgJ0hUVFBTIGFjY2VzcydcbiAgICApO1xuXG4gICAgLy8gTmV0d29yayBGaXJld2FsbCBmb3IgZW5oYW5jZWQgc2VjdXJpdHlcbiAgICBjb25zdCBmaXJld2FsbFBvbGljeSA9IG5ldyBuZXR3b3JrZmlyZXdhbGwuQ2ZuRmlyZXdhbGxQb2xpY3koXG4gICAgICB0aGlzLFxuICAgICAgJ0ZpcmV3YWxsUG9saWN5JyxcbiAgICAgIHtcbiAgICAgICAgZmlyZXdhbGxQb2xpY3lOYW1lOiAncHJvZHVjdGlvbi1maXJld2FsbC1wb2xpY3knLFxuICAgICAgICBmaXJld2FsbFBvbGljeToge1xuICAgICAgICAgIHN0YXRlbGVzc0RlZmF1bHRBY3Rpb25zOiBbJ2F3czpwYXNzJ10sXG4gICAgICAgICAgc3RhdGVsZXNzRnJhZ21lbnREZWZhdWx0QWN0aW9uczogWydhd3M6cGFzcyddLFxuICAgICAgICAgIHN0YXRlZnVsUnVsZUdyb3VwUmVmZXJlbmNlczogW10sXG4gICAgICAgIH0sXG4gICAgICB9XG4gICAgKTtcblxuICAgIG5ldyBuZXR3b3JrZmlyZXdhbGwuQ2ZuRmlyZXdhbGwodGhpcywgJ05ldHdvcmtGaXJld2FsbCcsIHtcbiAgICAgIGZpcmV3YWxsTmFtZTogJ3Byb2R1Y3Rpb24tbmV0d29yay1maXJld2FsbCcsXG4gICAgICBmaXJld2FsbFBvbGljeUFybjogZmlyZXdhbGxQb2xpY3kuYXR0ckZpcmV3YWxsUG9saWN5QXJuLFxuICAgICAgdnBjSWQ6IHRoaXMudnBjLnZwY0lkLFxuICAgICAgc3VibmV0TWFwcGluZ3M6IHRoaXMudnBjLnB1YmxpY1N1Ym5ldHMubWFwKHN1Ym5ldCA9PiAoe1xuICAgICAgICBzdWJuZXRJZDogc3VibmV0LnN1Ym5ldElkLFxuICAgICAgfSkpLFxuICAgIH0pO1xuXG4gICAgLy8gQXBwbHkgdGFnc1xuICAgIGNkay5UYWdzLm9mKHRoaXMudnBjKS5hZGQoJ0Vudmlyb25tZW50JywgJ1Byb2R1Y3Rpb24nKTtcbiAgICBjZGsuVGFncy5vZih0aGlzLndlYlNlcnZlclNlY3VyaXR5R3JvdXApLmFkZCgnRW52aXJvbm1lbnQnLCAnUHJvZHVjdGlvbicpO1xuICB9XG59XG4iXX0=