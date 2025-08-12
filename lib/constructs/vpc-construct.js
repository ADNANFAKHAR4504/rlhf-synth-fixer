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
exports.VpcConstruct = void 0;
const constructs_1 = require("constructs");
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const cdk = __importStar(require("aws-cdk-lib"));
/**
 * VPC Construct that creates a highly available network infrastructure
 * with public and private subnets across multiple Availability Zones
 */
class VpcConstruct extends constructs_1.Construct {
    vpc;
    publicSubnets;
    privateSubnets;
    constructor(scope, id, config) {
        super(scope, id);
        // Create VPC with public and private subnets across multiple AZs
        this.vpc = new ec2.Vpc(this, 'MultiRegionVpc', {
            ipAddresses: ec2.IpAddresses.cidr(config.vpcCidr),
            maxAzs: 3, // Use 3 AZs for high availability
            enableDnsHostnames: true,
            enableDnsSupport: true,
            // Define subnet configuration for network segregation
            subnetConfiguration: [
                {
                    cidrMask: 24,
                    name: 'PublicSubnet',
                    subnetType: ec2.SubnetType.PUBLIC,
                    mapPublicIpOnLaunch: true
                },
                {
                    cidrMask: 24,
                    name: 'PrivateSubnet',
                    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
                },
                {
                    cidrMask: 28,
                    name: 'DatabaseSubnet',
                    subnetType: ec2.SubnetType.PRIVATE_ISOLATED
                }
            ],
            // Configure NAT Gateway for private subnet internet access
            natGateways: 2, // Deploy NAT gateways in 2 AZs for redundancy
            natGatewayProvider: ec2.NatProvider.gateway()
        });
        // Store subnet references for use by other constructs
        this.publicSubnets = this.vpc.publicSubnets;
        this.privateSubnets = this.vpc.privateSubnets;
        // Create VPC Flow Logs for network monitoring and security
        if (config.security.enableVpcFlowLogs) {
            new ec2.FlowLog(this, 'VpcFlowLog', {
                resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
                destination: ec2.FlowLogDestination.toCloudWatchLogs(),
                trafficType: ec2.FlowLogTrafficType.ALL
            });
        }
        // Apply tags to VPC and all subnets
        cdk.Tags.of(this.vpc).add('Name', `MultiRegionApp-VPC-${config.region}`);
        Object.entries(config.tags).forEach(([key, value]) => {
            cdk.Tags.of(this.vpc).add(key, value);
        });
        // Tag subnets for better identification
        this.publicSubnets.forEach((subnet, index) => {
            cdk.Tags.of(subnet).add('Name', `PublicSubnet-${index + 1}-${config.region}`);
            cdk.Tags.of(subnet).add('SubnetType', 'Public');
        });
        this.privateSubnets.forEach((subnet, index) => {
            cdk.Tags.of(subnet).add('Name', `PrivateSubnet-${index + 1}-${config.region}`);
            cdk.Tags.of(subnet).add('SubnetType', 'Private');
        });
        // Create Network ACLs for additional subnet-level security (least privilege principle)
        this.createNetworkAcls(config);
    }
    /**
     * Create Network ACLs for public and private subnets with least privilege access
     */
    createNetworkAcls(config) {
        // Public subnet NACL - allows HTTP/HTTPS from internet and ephemeral ports for responses
        const publicNacl = new ec2.NetworkAcl(this, 'PublicNacl', {
            vpc: this.vpc,
            subnetSelection: { subnetType: ec2.SubnetType.PUBLIC }
        });
        // Inbound rules for public subnets
        publicNacl.addEntry('AllowHTTPInbound', {
            cidr: ec2.AclCidr.anyIpv4(),
            ruleNumber: 100,
            traffic: ec2.AclTraffic.tcpPort(80),
            direction: ec2.TrafficDirection.INGRESS,
            ruleAction: ec2.Action.ALLOW
        });
        publicNacl.addEntry('AllowHTTPSInbound', {
            cidr: ec2.AclCidr.anyIpv4(),
            ruleNumber: 110,
            traffic: ec2.AclTraffic.tcpPort(443),
            direction: ec2.TrafficDirection.INGRESS,
            ruleAction: ec2.Action.ALLOW
        });
        publicNacl.addEntry('AllowEphemeralInbound', {
            cidr: ec2.AclCidr.anyIpv4(),
            ruleNumber: 120,
            traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
            direction: ec2.TrafficDirection.INGRESS,
            ruleAction: ec2.Action.ALLOW
        });
        // Outbound rules for public subnets
        publicNacl.addEntry('AllowAllOutbound', {
            cidr: ec2.AclCidr.anyIpv4(),
            ruleNumber: 100,
            traffic: ec2.AclTraffic.allTraffic(),
            direction: ec2.TrafficDirection.EGRESS,
            ruleAction: ec2.Action.ALLOW
        });
        // Private subnet NACL - more restrictive, only allows necessary traffic
        const privateNacl = new ec2.NetworkAcl(this, 'PrivateNacl', {
            vpc: this.vpc,
            subnetSelection: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }
        });
        // Inbound rules for private subnets - only from VPC and ephemeral ports
        privateNacl.addEntry('AllowVPCInbound', {
            cidr: ec2.AclCidr.ipv4(config.vpcCidr),
            ruleNumber: 100,
            traffic: ec2.AclTraffic.allTraffic(),
            direction: ec2.TrafficDirection.INGRESS,
            ruleAction: ec2.Action.ALLOW
        });
        privateNacl.addEntry('AllowEphemeralInbound', {
            cidr: ec2.AclCidr.anyIpv4(),
            ruleNumber: 110,
            traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
            direction: ec2.TrafficDirection.INGRESS,
            ruleAction: ec2.Action.ALLOW
        });
        // Outbound rules for private subnets
        privateNacl.addEntry('AllowVPCOutbound', {
            cidr: ec2.AclCidr.ipv4(config.vpcCidr),
            ruleNumber: 100,
            traffic: ec2.AclTraffic.allTraffic(),
            direction: ec2.TrafficDirection.EGRESS,
            ruleAction: ec2.Action.ALLOW
        });
        privateNacl.addEntry('AllowHTTPSOutbound', {
            cidr: ec2.AclCidr.anyIpv4(),
            ruleNumber: 110,
            traffic: ec2.AclTraffic.tcpPort(443),
            direction: ec2.TrafficDirection.EGRESS,
            ruleAction: ec2.Action.ALLOW
        });
        privateNacl.addEntry('AllowHTTPOutbound', {
            cidr: ec2.AclCidr.anyIpv4(),
            ruleNumber: 120,
            traffic: ec2.AclTraffic.tcpPort(80),
            direction: ec2.TrafficDirection.EGRESS,
            ruleAction: ec2.Action.ALLOW
        });
        // Apply tags to NACLs
        cdk.Tags.of(publicNacl).add('Name', `MultiRegionApp-Public-NACL-${config.region}`);
        cdk.Tags.of(privateNacl).add('Name', `MultiRegionApp-Private-NACL-${config.region}`);
        Object.entries(config.tags).forEach(([key, value]) => {
            cdk.Tags.of(publicNacl).add(key, value);
            cdk.Tags.of(privateNacl).add(key, value);
        });
    }
}
exports.VpcConstruct = VpcConstruct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidnBjLWNvbnN0cnVjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInZwYy1jb25zdHJ1Y3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMkNBQXVDO0FBQ3ZDLHlEQUEyQztBQUMzQyxpREFBbUM7QUFHbkM7OztHQUdHO0FBQ0gsTUFBYSxZQUFhLFNBQVEsc0JBQVM7SUFDekIsR0FBRyxDQUFVO0lBQ2IsYUFBYSxDQUFnQjtJQUM3QixjQUFjLENBQWdCO0lBRTlDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsTUFBbUI7UUFDM0QsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVqQixpRUFBaUU7UUFDakUsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUFFO1lBQzdDLFdBQVcsRUFBRSxHQUFHLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDO1lBQ2pELE1BQU0sRUFBRSxDQUFDLEVBQUUsa0NBQWtDO1lBQzdDLGtCQUFrQixFQUFFLElBQUk7WUFDeEIsZ0JBQWdCLEVBQUUsSUFBSTtZQUV0QixzREFBc0Q7WUFDdEQsbUJBQW1CLEVBQUU7Z0JBQ25CO29CQUNFLFFBQVEsRUFBRSxFQUFFO29CQUNaLElBQUksRUFBRSxjQUFjO29CQUNwQixVQUFVLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxNQUFNO29CQUNqQyxtQkFBbUIsRUFBRSxJQUFJO2lCQUMxQjtnQkFDRDtvQkFDRSxRQUFRLEVBQUUsRUFBRTtvQkFDWixJQUFJLEVBQUUsZUFBZTtvQkFDckIsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsbUJBQW1CO2lCQUMvQztnQkFDRDtvQkFDRSxRQUFRLEVBQUUsRUFBRTtvQkFDWixJQUFJLEVBQUUsZ0JBQWdCO29CQUN0QixVQUFVLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0I7aUJBQzVDO2FBQ0Y7WUFFRCwyREFBMkQ7WUFDM0QsV0FBVyxFQUFFLENBQUMsRUFBRSw4Q0FBOEM7WUFDOUQsa0JBQWtCLEVBQUUsR0FBRyxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUU7U0FDOUMsQ0FBQyxDQUFDO1FBRUgsc0RBQXNEO1FBQ3RELElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUM7UUFDNUMsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQztRQUU5QywyREFBMkQ7UUFDM0QsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDdEMsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7Z0JBQ2xDLFlBQVksRUFBRSxHQUFHLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7Z0JBQ3ZELFdBQVcsRUFBRSxHQUFHLENBQUMsa0JBQWtCLENBQUMsZ0JBQWdCLEVBQUU7Z0JBQ3RELFdBQVcsRUFBRSxHQUFHLENBQUMsa0JBQWtCLENBQUMsR0FBRzthQUN4QyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRUQsb0NBQW9DO1FBQ3BDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLHNCQUFzQixNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUN6RSxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsRUFBRSxFQUFFO1lBQ25ELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3hDLENBQUMsQ0FBQyxDQUFDO1FBRUgsd0NBQXdDO1FBQ3hDLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFO1lBQzNDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsZ0JBQWdCLEtBQUssR0FBRyxDQUFDLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFDOUUsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNsRCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFO1lBQzVDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsaUJBQWlCLEtBQUssR0FBRyxDQUFDLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFDL0UsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsQ0FBQztRQUNuRCxDQUFDLENBQUMsQ0FBQztRQUVILHVGQUF1RjtRQUN2RixJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDakMsQ0FBQztJQUVEOztPQUVHO0lBQ0ssaUJBQWlCLENBQUMsTUFBbUI7UUFDM0MseUZBQXlGO1FBQ3pGLE1BQU0sVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQ3hELEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRztZQUNiLGVBQWUsRUFBRSxFQUFFLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRTtTQUN2RCxDQUFDLENBQUM7UUFFSCxtQ0FBbUM7UUFDbkMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRTtZQUN0QyxJQUFJLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUU7WUFDM0IsVUFBVSxFQUFFLEdBQUc7WUFDZixPQUFPLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ25DLFNBQVMsRUFBRSxHQUFHLENBQUMsZ0JBQWdCLENBQUMsT0FBTztZQUN2QyxVQUFVLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLO1NBQzdCLENBQUMsQ0FBQztRQUVILFVBQVUsQ0FBQyxRQUFRLENBQUMsbUJBQW1CLEVBQUU7WUFDdkMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFO1lBQzNCLFVBQVUsRUFBRSxHQUFHO1lBQ2YsT0FBTyxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQztZQUNwQyxTQUFTLEVBQUUsR0FBRyxDQUFDLGdCQUFnQixDQUFDLE9BQU87WUFDdkMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSztTQUM3QixDQUFDLENBQUM7UUFFSCxVQUFVLENBQUMsUUFBUSxDQUFDLHVCQUF1QixFQUFFO1lBQzNDLElBQUksRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRTtZQUMzQixVQUFVLEVBQUUsR0FBRztZQUNmLE9BQU8sRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDO1lBQ2pELFNBQVMsRUFBRSxHQUFHLENBQUMsZ0JBQWdCLENBQUMsT0FBTztZQUN2QyxVQUFVLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLO1NBQzdCLENBQUMsQ0FBQztRQUVILG9DQUFvQztRQUNwQyxVQUFVLENBQUMsUUFBUSxDQUFDLGtCQUFrQixFQUFFO1lBQ3RDLElBQUksRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRTtZQUMzQixVQUFVLEVBQUUsR0FBRztZQUNmLE9BQU8sRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLFVBQVUsRUFBRTtZQUNwQyxTQUFTLEVBQUUsR0FBRyxDQUFDLGdCQUFnQixDQUFDLE1BQU07WUFDdEMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSztTQUM3QixDQUFDLENBQUM7UUFFSCx3RUFBd0U7UUFDeEUsTUFBTSxXQUFXLEdBQUcsSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUU7WUFDMUQsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHO1lBQ2IsZUFBZSxFQUFFLEVBQUUsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsbUJBQW1CLEVBQUU7U0FDcEUsQ0FBQyxDQUFDO1FBRUgsd0VBQXdFO1FBQ3hFLFdBQVcsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLEVBQUU7WUFDdEMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUM7WUFDdEMsVUFBVSxFQUFFLEdBQUc7WUFDZixPQUFPLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUU7WUFDcEMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPO1lBQ3ZDLFVBQVUsRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUs7U0FDN0IsQ0FBQyxDQUFDO1FBRUgsV0FBVyxDQUFDLFFBQVEsQ0FBQyx1QkFBdUIsRUFBRTtZQUM1QyxJQUFJLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUU7WUFDM0IsVUFBVSxFQUFFLEdBQUc7WUFDZixPQUFPLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQztZQUNqRCxTQUFTLEVBQUUsR0FBRyxDQUFDLGdCQUFnQixDQUFDLE9BQU87WUFDdkMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSztTQUM3QixDQUFDLENBQUM7UUFFSCxxQ0FBcUM7UUFDckMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRTtZQUN2QyxJQUFJLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQztZQUN0QyxVQUFVLEVBQUUsR0FBRztZQUNmLE9BQU8sRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLFVBQVUsRUFBRTtZQUNwQyxTQUFTLEVBQUUsR0FBRyxDQUFDLGdCQUFnQixDQUFDLE1BQU07WUFDdEMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSztTQUM3QixDQUFDLENBQUM7UUFFSCxXQUFXLENBQUMsUUFBUSxDQUFDLG9CQUFvQixFQUFFO1lBQ3pDLElBQUksRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRTtZQUMzQixVQUFVLEVBQUUsR0FBRztZQUNmLE9BQU8sRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUM7WUFDcEMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNO1lBQ3RDLFVBQVUsRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUs7U0FDN0IsQ0FBQyxDQUFDO1FBRUgsV0FBVyxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsRUFBRTtZQUN4QyxJQUFJLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUU7WUFDM0IsVUFBVSxFQUFFLEdBQUc7WUFDZixPQUFPLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ25DLFNBQVMsRUFBRSxHQUFHLENBQUMsZ0JBQWdCLENBQUMsTUFBTTtZQUN0QyxVQUFVLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLO1NBQzdCLENBQUMsQ0FBQztRQUVILHNCQUFzQjtRQUN0QixHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLDhCQUE4QixNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUNuRixHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLCtCQUErQixNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUVyRixNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsRUFBRSxFQUFFO1lBQ25ELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDeEMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMzQyxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQS9LRCxvQ0ErS0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCAqIGFzIGVjMiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWMyJztcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBTdGFja0NvbmZpZyB9IGZyb20gJy4uL2ludGVyZmFjZXMvc3RhY2stY29uZmlnJztcblxuLyoqXG4gKiBWUEMgQ29uc3RydWN0IHRoYXQgY3JlYXRlcyBhIGhpZ2hseSBhdmFpbGFibGUgbmV0d29yayBpbmZyYXN0cnVjdHVyZVxuICogd2l0aCBwdWJsaWMgYW5kIHByaXZhdGUgc3VibmV0cyBhY3Jvc3MgbXVsdGlwbGUgQXZhaWxhYmlsaXR5IFpvbmVzXG4gKi9cbmV4cG9ydCBjbGFzcyBWcGNDb25zdHJ1Y3QgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICBwdWJsaWMgcmVhZG9ubHkgdnBjOiBlYzIuVnBjO1xuICBwdWJsaWMgcmVhZG9ubHkgcHVibGljU3VibmV0czogZWMyLklTdWJuZXRbXTtcbiAgcHVibGljIHJlYWRvbmx5IHByaXZhdGVTdWJuZXRzOiBlYzIuSVN1Ym5ldFtdO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIGNvbmZpZzogU3RhY2tDb25maWcpIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgLy8gQ3JlYXRlIFZQQyB3aXRoIHB1YmxpYyBhbmQgcHJpdmF0ZSBzdWJuZXRzIGFjcm9zcyBtdWx0aXBsZSBBWnNcbiAgICB0aGlzLnZwYyA9IG5ldyBlYzIuVnBjKHRoaXMsICdNdWx0aVJlZ2lvblZwYycsIHtcbiAgICAgIGlwQWRkcmVzc2VzOiBlYzIuSXBBZGRyZXNzZXMuY2lkcihjb25maWcudnBjQ2lkciksXG4gICAgICBtYXhBenM6IDMsIC8vIFVzZSAzIEFacyBmb3IgaGlnaCBhdmFpbGFiaWxpdHlcbiAgICAgIGVuYWJsZURuc0hvc3RuYW1lczogdHJ1ZSxcbiAgICAgIGVuYWJsZURuc1N1cHBvcnQ6IHRydWUsXG4gICAgICBcbiAgICAgIC8vIERlZmluZSBzdWJuZXQgY29uZmlndXJhdGlvbiBmb3IgbmV0d29yayBzZWdyZWdhdGlvblxuICAgICAgc3VibmV0Q29uZmlndXJhdGlvbjogW1xuICAgICAgICB7XG4gICAgICAgICAgY2lkck1hc2s6IDI0LFxuICAgICAgICAgIG5hbWU6ICdQdWJsaWNTdWJuZXQnLFxuICAgICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBVQkxJQyxcbiAgICAgICAgICBtYXBQdWJsaWNJcE9uTGF1bmNoOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBjaWRyTWFzazogMjQsXG4gICAgICAgICAgbmFtZTogJ1ByaXZhdGVTdWJuZXQnLFxuICAgICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBSSVZBVEVfV0lUSF9FR1JFU1NcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGNpZHJNYXNrOiAyOCxcbiAgICAgICAgICBuYW1lOiAnRGF0YWJhc2VTdWJuZXQnLFxuICAgICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBSSVZBVEVfSVNPTEFURURcbiAgICAgICAgfVxuICAgICAgXSxcblxuICAgICAgLy8gQ29uZmlndXJlIE5BVCBHYXRld2F5IGZvciBwcml2YXRlIHN1Ym5ldCBpbnRlcm5ldCBhY2Nlc3NcbiAgICAgIG5hdEdhdGV3YXlzOiAyLCAvLyBEZXBsb3kgTkFUIGdhdGV3YXlzIGluIDIgQVpzIGZvciByZWR1bmRhbmN5XG4gICAgICBuYXRHYXRld2F5UHJvdmlkZXI6IGVjMi5OYXRQcm92aWRlci5nYXRld2F5KClcbiAgICB9KTtcblxuICAgIC8vIFN0b3JlIHN1Ym5ldCByZWZlcmVuY2VzIGZvciB1c2UgYnkgb3RoZXIgY29uc3RydWN0c1xuICAgIHRoaXMucHVibGljU3VibmV0cyA9IHRoaXMudnBjLnB1YmxpY1N1Ym5ldHM7XG4gICAgdGhpcy5wcml2YXRlU3VibmV0cyA9IHRoaXMudnBjLnByaXZhdGVTdWJuZXRzO1xuXG4gICAgLy8gQ3JlYXRlIFZQQyBGbG93IExvZ3MgZm9yIG5ldHdvcmsgbW9uaXRvcmluZyBhbmQgc2VjdXJpdHlcbiAgICBpZiAoY29uZmlnLnNlY3VyaXR5LmVuYWJsZVZwY0Zsb3dMb2dzKSB7XG4gICAgICBuZXcgZWMyLkZsb3dMb2codGhpcywgJ1ZwY0Zsb3dMb2cnLCB7XG4gICAgICAgIHJlc291cmNlVHlwZTogZWMyLkZsb3dMb2dSZXNvdXJjZVR5cGUuZnJvbVZwYyh0aGlzLnZwYyksXG4gICAgICAgIGRlc3RpbmF0aW9uOiBlYzIuRmxvd0xvZ0Rlc3RpbmF0aW9uLnRvQ2xvdWRXYXRjaExvZ3MoKSxcbiAgICAgICAgdHJhZmZpY1R5cGU6IGVjMi5GbG93TG9nVHJhZmZpY1R5cGUuQUxMXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBBcHBseSB0YWdzIHRvIFZQQyBhbmQgYWxsIHN1Ym5ldHNcbiAgICBjZGsuVGFncy5vZih0aGlzLnZwYykuYWRkKCdOYW1lJywgYE11bHRpUmVnaW9uQXBwLVZQQy0ke2NvbmZpZy5yZWdpb259YCk7XG4gICAgT2JqZWN0LmVudHJpZXMoY29uZmlnLnRhZ3MpLmZvckVhY2goKFtrZXksIHZhbHVlXSkgPT4ge1xuICAgICAgY2RrLlRhZ3Mub2YodGhpcy52cGMpLmFkZChrZXksIHZhbHVlKTtcbiAgICB9KTtcblxuICAgIC8vIFRhZyBzdWJuZXRzIGZvciBiZXR0ZXIgaWRlbnRpZmljYXRpb25cbiAgICB0aGlzLnB1YmxpY1N1Ym5ldHMuZm9yRWFjaCgoc3VibmV0LCBpbmRleCkgPT4ge1xuICAgICAgY2RrLlRhZ3Mub2Yoc3VibmV0KS5hZGQoJ05hbWUnLCBgUHVibGljU3VibmV0LSR7aW5kZXggKyAxfS0ke2NvbmZpZy5yZWdpb259YCk7XG4gICAgICBjZGsuVGFncy5vZihzdWJuZXQpLmFkZCgnU3VibmV0VHlwZScsICdQdWJsaWMnKTtcbiAgICB9KTtcblxuICAgIHRoaXMucHJpdmF0ZVN1Ym5ldHMuZm9yRWFjaCgoc3VibmV0LCBpbmRleCkgPT4ge1xuICAgICAgY2RrLlRhZ3Mub2Yoc3VibmV0KS5hZGQoJ05hbWUnLCBgUHJpdmF0ZVN1Ym5ldC0ke2luZGV4ICsgMX0tJHtjb25maWcucmVnaW9ufWApO1xuICAgICAgY2RrLlRhZ3Mub2Yoc3VibmV0KS5hZGQoJ1N1Ym5ldFR5cGUnLCAnUHJpdmF0ZScpO1xuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIE5ldHdvcmsgQUNMcyBmb3IgYWRkaXRpb25hbCBzdWJuZXQtbGV2ZWwgc2VjdXJpdHkgKGxlYXN0IHByaXZpbGVnZSBwcmluY2lwbGUpXG4gICAgdGhpcy5jcmVhdGVOZXR3b3JrQWNscyhjb25maWcpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBOZXR3b3JrIEFDTHMgZm9yIHB1YmxpYyBhbmQgcHJpdmF0ZSBzdWJuZXRzIHdpdGggbGVhc3QgcHJpdmlsZWdlIGFjY2Vzc1xuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVOZXR3b3JrQWNscyhjb25maWc6IFN0YWNrQ29uZmlnKTogdm9pZCB7XG4gICAgLy8gUHVibGljIHN1Ym5ldCBOQUNMIC0gYWxsb3dzIEhUVFAvSFRUUFMgZnJvbSBpbnRlcm5ldCBhbmQgZXBoZW1lcmFsIHBvcnRzIGZvciByZXNwb25zZXNcbiAgICBjb25zdCBwdWJsaWNOYWNsID0gbmV3IGVjMi5OZXR3b3JrQWNsKHRoaXMsICdQdWJsaWNOYWNsJywge1xuICAgICAgdnBjOiB0aGlzLnZwYyxcbiAgICAgIHN1Ym5ldFNlbGVjdGlvbjogeyBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QVUJMSUMgfVxuICAgIH0pO1xuXG4gICAgLy8gSW5ib3VuZCBydWxlcyBmb3IgcHVibGljIHN1Ym5ldHNcbiAgICBwdWJsaWNOYWNsLmFkZEVudHJ5KCdBbGxvd0hUVFBJbmJvdW5kJywge1xuICAgICAgY2lkcjogZWMyLkFjbENpZHIuYW55SXB2NCgpLFxuICAgICAgcnVsZU51bWJlcjogMTAwLFxuICAgICAgdHJhZmZpYzogZWMyLkFjbFRyYWZmaWMudGNwUG9ydCg4MCksXG4gICAgICBkaXJlY3Rpb246IGVjMi5UcmFmZmljRGlyZWN0aW9uLklOR1JFU1MsXG4gICAgICBydWxlQWN0aW9uOiBlYzIuQWN0aW9uLkFMTE9XXG4gICAgfSk7XG5cbiAgICBwdWJsaWNOYWNsLmFkZEVudHJ5KCdBbGxvd0hUVFBTSW5ib3VuZCcsIHtcbiAgICAgIGNpZHI6IGVjMi5BY2xDaWRyLmFueUlwdjQoKSxcbiAgICAgIHJ1bGVOdW1iZXI6IDExMCxcbiAgICAgIHRyYWZmaWM6IGVjMi5BY2xUcmFmZmljLnRjcFBvcnQoNDQzKSxcbiAgICAgIGRpcmVjdGlvbjogZWMyLlRyYWZmaWNEaXJlY3Rpb24uSU5HUkVTUyxcbiAgICAgIHJ1bGVBY3Rpb246IGVjMi5BY3Rpb24uQUxMT1dcbiAgICB9KTtcblxuICAgIHB1YmxpY05hY2wuYWRkRW50cnkoJ0FsbG93RXBoZW1lcmFsSW5ib3VuZCcsIHtcbiAgICAgIGNpZHI6IGVjMi5BY2xDaWRyLmFueUlwdjQoKSxcbiAgICAgIHJ1bGVOdW1iZXI6IDEyMCxcbiAgICAgIHRyYWZmaWM6IGVjMi5BY2xUcmFmZmljLnRjcFBvcnRSYW5nZSgxMDI0LCA2NTUzNSksXG4gICAgICBkaXJlY3Rpb246IGVjMi5UcmFmZmljRGlyZWN0aW9uLklOR1JFU1MsXG4gICAgICBydWxlQWN0aW9uOiBlYzIuQWN0aW9uLkFMTE9XXG4gICAgfSk7XG5cbiAgICAvLyBPdXRib3VuZCBydWxlcyBmb3IgcHVibGljIHN1Ym5ldHNcbiAgICBwdWJsaWNOYWNsLmFkZEVudHJ5KCdBbGxvd0FsbE91dGJvdW5kJywge1xuICAgICAgY2lkcjogZWMyLkFjbENpZHIuYW55SXB2NCgpLFxuICAgICAgcnVsZU51bWJlcjogMTAwLFxuICAgICAgdHJhZmZpYzogZWMyLkFjbFRyYWZmaWMuYWxsVHJhZmZpYygpLFxuICAgICAgZGlyZWN0aW9uOiBlYzIuVHJhZmZpY0RpcmVjdGlvbi5FR1JFU1MsXG4gICAgICBydWxlQWN0aW9uOiBlYzIuQWN0aW9uLkFMTE9XXG4gICAgfSk7XG5cbiAgICAvLyBQcml2YXRlIHN1Ym5ldCBOQUNMIC0gbW9yZSByZXN0cmljdGl2ZSwgb25seSBhbGxvd3MgbmVjZXNzYXJ5IHRyYWZmaWNcbiAgICBjb25zdCBwcml2YXRlTmFjbCA9IG5ldyBlYzIuTmV0d29ya0FjbCh0aGlzLCAnUHJpdmF0ZU5hY2wnLCB7XG4gICAgICB2cGM6IHRoaXMudnBjLFxuICAgICAgc3VibmV0U2VsZWN0aW9uOiB7IHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBSSVZBVEVfV0lUSF9FR1JFU1MgfVxuICAgIH0pO1xuXG4gICAgLy8gSW5ib3VuZCBydWxlcyBmb3IgcHJpdmF0ZSBzdWJuZXRzIC0gb25seSBmcm9tIFZQQyBhbmQgZXBoZW1lcmFsIHBvcnRzXG4gICAgcHJpdmF0ZU5hY2wuYWRkRW50cnkoJ0FsbG93VlBDSW5ib3VuZCcsIHtcbiAgICAgIGNpZHI6IGVjMi5BY2xDaWRyLmlwdjQoY29uZmlnLnZwY0NpZHIpLFxuICAgICAgcnVsZU51bWJlcjogMTAwLFxuICAgICAgdHJhZmZpYzogZWMyLkFjbFRyYWZmaWMuYWxsVHJhZmZpYygpLFxuICAgICAgZGlyZWN0aW9uOiBlYzIuVHJhZmZpY0RpcmVjdGlvbi5JTkdSRVNTLFxuICAgICAgcnVsZUFjdGlvbjogZWMyLkFjdGlvbi5BTExPV1xuICAgIH0pO1xuXG4gICAgcHJpdmF0ZU5hY2wuYWRkRW50cnkoJ0FsbG93RXBoZW1lcmFsSW5ib3VuZCcsIHtcbiAgICAgIGNpZHI6IGVjMi5BY2xDaWRyLmFueUlwdjQoKSxcbiAgICAgIHJ1bGVOdW1iZXI6IDExMCxcbiAgICAgIHRyYWZmaWM6IGVjMi5BY2xUcmFmZmljLnRjcFBvcnRSYW5nZSgxMDI0LCA2NTUzNSksXG4gICAgICBkaXJlY3Rpb246IGVjMi5UcmFmZmljRGlyZWN0aW9uLklOR1JFU1MsXG4gICAgICBydWxlQWN0aW9uOiBlYzIuQWN0aW9uLkFMTE9XXG4gICAgfSk7XG5cbiAgICAvLyBPdXRib3VuZCBydWxlcyBmb3IgcHJpdmF0ZSBzdWJuZXRzXG4gICAgcHJpdmF0ZU5hY2wuYWRkRW50cnkoJ0FsbG93VlBDT3V0Ym91bmQnLCB7XG4gICAgICBjaWRyOiBlYzIuQWNsQ2lkci5pcHY0KGNvbmZpZy52cGNDaWRyKSxcbiAgICAgIHJ1bGVOdW1iZXI6IDEwMCxcbiAgICAgIHRyYWZmaWM6IGVjMi5BY2xUcmFmZmljLmFsbFRyYWZmaWMoKSxcbiAgICAgIGRpcmVjdGlvbjogZWMyLlRyYWZmaWNEaXJlY3Rpb24uRUdSRVNTLFxuICAgICAgcnVsZUFjdGlvbjogZWMyLkFjdGlvbi5BTExPV1xuICAgIH0pO1xuXG4gICAgcHJpdmF0ZU5hY2wuYWRkRW50cnkoJ0FsbG93SFRUUFNPdXRib3VuZCcsIHtcbiAgICAgIGNpZHI6IGVjMi5BY2xDaWRyLmFueUlwdjQoKSxcbiAgICAgIHJ1bGVOdW1iZXI6IDExMCxcbiAgICAgIHRyYWZmaWM6IGVjMi5BY2xUcmFmZmljLnRjcFBvcnQoNDQzKSxcbiAgICAgIGRpcmVjdGlvbjogZWMyLlRyYWZmaWNEaXJlY3Rpb24uRUdSRVNTLFxuICAgICAgcnVsZUFjdGlvbjogZWMyLkFjdGlvbi5BTExPV1xuICAgIH0pO1xuXG4gICAgcHJpdmF0ZU5hY2wuYWRkRW50cnkoJ0FsbG93SFRUUE91dGJvdW5kJywge1xuICAgICAgY2lkcjogZWMyLkFjbENpZHIuYW55SXB2NCgpLFxuICAgICAgcnVsZU51bWJlcjogMTIwLFxuICAgICAgdHJhZmZpYzogZWMyLkFjbFRyYWZmaWMudGNwUG9ydCg4MCksXG4gICAgICBkaXJlY3Rpb246IGVjMi5UcmFmZmljRGlyZWN0aW9uLkVHUkVTUyxcbiAgICAgIHJ1bGVBY3Rpb246IGVjMi5BY3Rpb24uQUxMT1dcbiAgICB9KTtcblxuICAgIC8vIEFwcGx5IHRhZ3MgdG8gTkFDTHNcbiAgICBjZGsuVGFncy5vZihwdWJsaWNOYWNsKS5hZGQoJ05hbWUnLCBgTXVsdGlSZWdpb25BcHAtUHVibGljLU5BQ0wtJHtjb25maWcucmVnaW9ufWApO1xuICAgIGNkay5UYWdzLm9mKHByaXZhdGVOYWNsKS5hZGQoJ05hbWUnLCBgTXVsdGlSZWdpb25BcHAtUHJpdmF0ZS1OQUNMLSR7Y29uZmlnLnJlZ2lvbn1gKTtcbiAgICBcbiAgICBPYmplY3QuZW50cmllcyhjb25maWcudGFncykuZm9yRWFjaCgoW2tleSwgdmFsdWVdKSA9PiB7XG4gICAgICBjZGsuVGFncy5vZihwdWJsaWNOYWNsKS5hZGQoa2V5LCB2YWx1ZSk7XG4gICAgICBjZGsuVGFncy5vZihwcml2YXRlTmFjbCkuYWRkKGtleSwgdmFsdWUpO1xuICAgIH0pO1xuICB9XG59Il19