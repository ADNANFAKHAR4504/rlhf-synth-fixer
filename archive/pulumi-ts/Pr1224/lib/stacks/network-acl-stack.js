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
exports.NetworkAclStack = void 0;
/**
 * network-acl-stack.ts
 *
 * This module defines the NetworkAclStack component for creating
 * Network ACLs for additional network security layer.
 */
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
class NetworkAclStack extends pulumi.ComponentResource {
    publicNetworkAclId;
    privateNetworkAclId;
    constructor(name, args, opts) {
        super('tap:network:NetworkAclStack', name, args, opts);
        const environmentSuffix = args.environmentSuffix || 'dev';
        const tags = args.tags || {};
        // Public Network ACL
        const publicNetworkAcl = new aws.ec2.NetworkAcl(`tap-public-nacl-${environmentSuffix}`, {
            vpcId: args.vpcId,
            tags: {
                Name: `tap-public-nacl-${environmentSuffix}`,
                Tier: 'public',
                ...tags,
            },
        }, { parent: this });
        // Public Network ACL Rules - Inbound
        new aws.ec2.NetworkAclRule(`tap-public-nacl-inbound-http-${environmentSuffix}`, {
            networkAclId: publicNetworkAcl.id,
            ruleNumber: 100,
            protocol: 'tcp',
            ruleAction: 'allow',
            fromPort: 80,
            toPort: 80,
            cidrBlock: '0.0.0.0/0',
        }, { parent: this });
        new aws.ec2.NetworkAclRule(`tap-public-nacl-inbound-https-${environmentSuffix}`, {
            networkAclId: publicNetworkAcl.id,
            ruleNumber: 110,
            protocol: 'tcp',
            ruleAction: 'allow',
            fromPort: 443,
            toPort: 443,
            cidrBlock: '0.0.0.0/0',
        }, { parent: this });
        new aws.ec2.NetworkAclRule(`tap-public-nacl-inbound-ephemeral-${environmentSuffix}`, {
            networkAclId: publicNetworkAcl.id,
            ruleNumber: 120,
            protocol: 'tcp',
            ruleAction: 'allow',
            fromPort: 1024,
            toPort: 65535,
            cidrBlock: '0.0.0.0/0',
        }, { parent: this });
        // Public Network ACL Rules - Outbound
        new aws.ec2.NetworkAclRule(`tap-public-nacl-outbound-http-${environmentSuffix}`, {
            networkAclId: publicNetworkAcl.id,
            ruleNumber: 100,
            protocol: 'tcp',
            ruleAction: 'allow',
            fromPort: 80,
            toPort: 80,
            cidrBlock: '0.0.0.0/0',
            egress: true,
        }, { parent: this });
        new aws.ec2.NetworkAclRule(`tap-public-nacl-outbound-https-${environmentSuffix}`, {
            networkAclId: publicNetworkAcl.id,
            ruleNumber: 110,
            protocol: 'tcp',
            ruleAction: 'allow',
            fromPort: 443,
            toPort: 443,
            cidrBlock: '0.0.0.0/0',
            egress: true,
        }, { parent: this });
        new aws.ec2.NetworkAclRule(`tap-public-nacl-outbound-ephemeral-${environmentSuffix}`, {
            networkAclId: publicNetworkAcl.id,
            ruleNumber: 120,
            protocol: 'tcp',
            ruleAction: 'allow',
            fromPort: 1024,
            toPort: 65535,
            cidrBlock: '0.0.0.0/0',
            egress: true,
        }, { parent: this });
        // Private Network ACL
        const privateNetworkAcl = new aws.ec2.NetworkAcl(`tap-private-nacl-${environmentSuffix}`, {
            vpcId: args.vpcId,
            tags: {
                Name: `tap-private-nacl-${environmentSuffix}`,
                Tier: 'private',
                ...tags,
            },
        }, { parent: this });
        // Private Network ACL Rules - Inbound (from VPC only)
        new aws.ec2.NetworkAclRule(`tap-private-nacl-inbound-vpc-${environmentSuffix}`, {
            networkAclId: privateNetworkAcl.id,
            ruleNumber: 100,
            protocol: 'tcp',
            ruleAction: 'allow',
            fromPort: 0,
            toPort: 65535,
            cidrBlock: '10.0.0.0/16', // VPC CIDR
        }, { parent: this });
        new aws.ec2.NetworkAclRule(`tap-private-nacl-inbound-ephemeral-${environmentSuffix}`, {
            networkAclId: privateNetworkAcl.id,
            ruleNumber: 110,
            protocol: 'tcp',
            ruleAction: 'allow',
            fromPort: 1024,
            toPort: 65535,
            cidrBlock: '0.0.0.0/0',
        }, { parent: this });
        // Private Network ACL Rules - Outbound
        new aws.ec2.NetworkAclRule(`tap-private-nacl-outbound-https-${environmentSuffix}`, {
            networkAclId: privateNetworkAcl.id,
            ruleNumber: 100,
            protocol: 'tcp',
            ruleAction: 'allow',
            fromPort: 443,
            toPort: 443,
            cidrBlock: '0.0.0.0/0',
            egress: true,
        }, { parent: this });
        new aws.ec2.NetworkAclRule(`tap-private-nacl-outbound-vpc-${environmentSuffix}`, {
            networkAclId: privateNetworkAcl.id,
            ruleNumber: 110,
            protocol: 'tcp',
            ruleAction: 'allow',
            fromPort: 0,
            toPort: 65535,
            cidrBlock: '10.0.0.0/16', // VPC CIDR
            egress: true,
        }, { parent: this });
        new aws.ec2.NetworkAclRule(`tap-private-nacl-outbound-ephemeral-${environmentSuffix}`, {
            networkAclId: privateNetworkAcl.id,
            ruleNumber: 120,
            protocol: 'tcp',
            ruleAction: 'allow',
            fromPort: 1024,
            toPort: 65535,
            cidrBlock: '0.0.0.0/0',
            egress: true,
        }, { parent: this });
        // Associate Network ACLs with subnets
        pulumi.output(args.publicSubnetIds).apply(subnetIds => {
            subnetIds.forEach((subnetId, index) => {
                new aws.ec2.NetworkAclAssociation(`tap-public-nacl-assoc-${index}-${environmentSuffix}`, {
                    networkAclId: publicNetworkAcl.id,
                    subnetId: subnetId,
                }, { parent: this });
            });
        });
        pulumi.output(args.privateSubnetIds).apply(subnetIds => {
            subnetIds.forEach((subnetId, index) => {
                new aws.ec2.NetworkAclAssociation(`tap-private-nacl-assoc-${index}-${environmentSuffix}`, {
                    networkAclId: privateNetworkAcl.id,
                    subnetId: subnetId,
                }, { parent: this });
            });
        });
        this.publicNetworkAclId = publicNetworkAcl.id;
        this.privateNetworkAclId = privateNetworkAcl.id;
        this.registerOutputs({
            publicNetworkAclId: this.publicNetworkAclId,
            privateNetworkAclId: this.privateNetworkAclId,
        });
    }
}
exports.NetworkAclStack = NetworkAclStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmV0d29yay1hY2wtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJuZXR3b3JrLWFjbC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7Ozs7R0FLRztBQUNILGlEQUFtQztBQUNuQyx1REFBeUM7QUFXekMsTUFBYSxlQUFnQixTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFDM0Msa0JBQWtCLENBQXdCO0lBQzFDLG1CQUFtQixDQUF3QjtJQUUzRCxZQUFZLElBQVksRUFBRSxJQUF5QixFQUFFLElBQXNCO1FBQ3pFLEtBQUssQ0FBQyw2QkFBNkIsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRXZELE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixJQUFJLEtBQUssQ0FBQztRQUMxRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQztRQUU3QixxQkFBcUI7UUFDckIsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUM3QyxtQkFBbUIsaUJBQWlCLEVBQUUsRUFDdEM7WUFDRSxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7WUFDakIsSUFBSSxFQUFFO2dCQUNKLElBQUksRUFBRSxtQkFBbUIsaUJBQWlCLEVBQUU7Z0JBQzVDLElBQUksRUFBRSxRQUFRO2dCQUNkLEdBQUcsSUFBSTthQUNSO1NBQ0YsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLHFDQUFxQztRQUNyQyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUN4QixnQ0FBZ0MsaUJBQWlCLEVBQUUsRUFDbkQ7WUFDRSxZQUFZLEVBQUUsZ0JBQWdCLENBQUMsRUFBRTtZQUNqQyxVQUFVLEVBQUUsR0FBRztZQUNmLFFBQVEsRUFBRSxLQUFLO1lBQ2YsVUFBVSxFQUFFLE9BQU87WUFDbkIsUUFBUSxFQUFFLEVBQUU7WUFDWixNQUFNLEVBQUUsRUFBRTtZQUNWLFNBQVMsRUFBRSxXQUFXO1NBQ3ZCLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRixJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUN4QixpQ0FBaUMsaUJBQWlCLEVBQUUsRUFDcEQ7WUFDRSxZQUFZLEVBQUUsZ0JBQWdCLENBQUMsRUFBRTtZQUNqQyxVQUFVLEVBQUUsR0FBRztZQUNmLFFBQVEsRUFBRSxLQUFLO1lBQ2YsVUFBVSxFQUFFLE9BQU87WUFDbkIsUUFBUSxFQUFFLEdBQUc7WUFDYixNQUFNLEVBQUUsR0FBRztZQUNYLFNBQVMsRUFBRSxXQUFXO1NBQ3ZCLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRixJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUN4QixxQ0FBcUMsaUJBQWlCLEVBQUUsRUFDeEQ7WUFDRSxZQUFZLEVBQUUsZ0JBQWdCLENBQUMsRUFBRTtZQUNqQyxVQUFVLEVBQUUsR0FBRztZQUNmLFFBQVEsRUFBRSxLQUFLO1lBQ2YsVUFBVSxFQUFFLE9BQU87WUFDbkIsUUFBUSxFQUFFLElBQUk7WUFDZCxNQUFNLEVBQUUsS0FBSztZQUNiLFNBQVMsRUFBRSxXQUFXO1NBQ3ZCLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRixzQ0FBc0M7UUFDdEMsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FDeEIsaUNBQWlDLGlCQUFpQixFQUFFLEVBQ3BEO1lBQ0UsWUFBWSxFQUFFLGdCQUFnQixDQUFDLEVBQUU7WUFDakMsVUFBVSxFQUFFLEdBQUc7WUFDZixRQUFRLEVBQUUsS0FBSztZQUNmLFVBQVUsRUFBRSxPQUFPO1lBQ25CLFFBQVEsRUFBRSxFQUFFO1lBQ1osTUFBTSxFQUFFLEVBQUU7WUFDVixTQUFTLEVBQUUsV0FBVztZQUN0QixNQUFNLEVBQUUsSUFBSTtTQUNiLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRixJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUN4QixrQ0FBa0MsaUJBQWlCLEVBQUUsRUFDckQ7WUFDRSxZQUFZLEVBQUUsZ0JBQWdCLENBQUMsRUFBRTtZQUNqQyxVQUFVLEVBQUUsR0FBRztZQUNmLFFBQVEsRUFBRSxLQUFLO1lBQ2YsVUFBVSxFQUFFLE9BQU87WUFDbkIsUUFBUSxFQUFFLEdBQUc7WUFDYixNQUFNLEVBQUUsR0FBRztZQUNYLFNBQVMsRUFBRSxXQUFXO1lBQ3RCLE1BQU0sRUFBRSxJQUFJO1NBQ2IsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQ3hCLHNDQUFzQyxpQkFBaUIsRUFBRSxFQUN6RDtZQUNFLFlBQVksRUFBRSxnQkFBZ0IsQ0FBQyxFQUFFO1lBQ2pDLFVBQVUsRUFBRSxHQUFHO1lBQ2YsUUFBUSxFQUFFLEtBQUs7WUFDZixVQUFVLEVBQUUsT0FBTztZQUNuQixRQUFRLEVBQUUsSUFBSTtZQUNkLE1BQU0sRUFBRSxLQUFLO1lBQ2IsU0FBUyxFQUFFLFdBQVc7WUFDdEIsTUFBTSxFQUFFLElBQUk7U0FDYixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsc0JBQXNCO1FBQ3RCLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FDOUMsb0JBQW9CLGlCQUFpQixFQUFFLEVBQ3ZDO1lBQ0UsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO1lBQ2pCLElBQUksRUFBRTtnQkFDSixJQUFJLEVBQUUsb0JBQW9CLGlCQUFpQixFQUFFO2dCQUM3QyxJQUFJLEVBQUUsU0FBUztnQkFDZixHQUFHLElBQUk7YUFDUjtTQUNGLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRixzREFBc0Q7UUFDdEQsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FDeEIsZ0NBQWdDLGlCQUFpQixFQUFFLEVBQ25EO1lBQ0UsWUFBWSxFQUFFLGlCQUFpQixDQUFDLEVBQUU7WUFDbEMsVUFBVSxFQUFFLEdBQUc7WUFDZixRQUFRLEVBQUUsS0FBSztZQUNmLFVBQVUsRUFBRSxPQUFPO1lBQ25CLFFBQVEsRUFBRSxDQUFDO1lBQ1gsTUFBTSxFQUFFLEtBQUs7WUFDYixTQUFTLEVBQUUsYUFBYSxFQUFFLFdBQVc7U0FDdEMsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQ3hCLHNDQUFzQyxpQkFBaUIsRUFBRSxFQUN6RDtZQUNFLFlBQVksRUFBRSxpQkFBaUIsQ0FBQyxFQUFFO1lBQ2xDLFVBQVUsRUFBRSxHQUFHO1lBQ2YsUUFBUSxFQUFFLEtBQUs7WUFDZixVQUFVLEVBQUUsT0FBTztZQUNuQixRQUFRLEVBQUUsSUFBSTtZQUNkLE1BQU0sRUFBRSxLQUFLO1lBQ2IsU0FBUyxFQUFFLFdBQVc7U0FDdkIsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLHVDQUF1QztRQUN2QyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUN4QixtQ0FBbUMsaUJBQWlCLEVBQUUsRUFDdEQ7WUFDRSxZQUFZLEVBQUUsaUJBQWlCLENBQUMsRUFBRTtZQUNsQyxVQUFVLEVBQUUsR0FBRztZQUNmLFFBQVEsRUFBRSxLQUFLO1lBQ2YsVUFBVSxFQUFFLE9BQU87WUFDbkIsUUFBUSxFQUFFLEdBQUc7WUFDYixNQUFNLEVBQUUsR0FBRztZQUNYLFNBQVMsRUFBRSxXQUFXO1lBQ3RCLE1BQU0sRUFBRSxJQUFJO1NBQ2IsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQ3hCLGlDQUFpQyxpQkFBaUIsRUFBRSxFQUNwRDtZQUNFLFlBQVksRUFBRSxpQkFBaUIsQ0FBQyxFQUFFO1lBQ2xDLFVBQVUsRUFBRSxHQUFHO1lBQ2YsUUFBUSxFQUFFLEtBQUs7WUFDZixVQUFVLEVBQUUsT0FBTztZQUNuQixRQUFRLEVBQUUsQ0FBQztZQUNYLE1BQU0sRUFBRSxLQUFLO1lBQ2IsU0FBUyxFQUFFLGFBQWEsRUFBRSxXQUFXO1lBQ3JDLE1BQU0sRUFBRSxJQUFJO1NBQ2IsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQ3hCLHVDQUF1QyxpQkFBaUIsRUFBRSxFQUMxRDtZQUNFLFlBQVksRUFBRSxpQkFBaUIsQ0FBQyxFQUFFO1lBQ2xDLFVBQVUsRUFBRSxHQUFHO1lBQ2YsUUFBUSxFQUFFLEtBQUs7WUFDZixVQUFVLEVBQUUsT0FBTztZQUNuQixRQUFRLEVBQUUsSUFBSTtZQUNkLE1BQU0sRUFBRSxLQUFLO1lBQ2IsU0FBUyxFQUFFLFdBQVc7WUFDdEIsTUFBTSxFQUFFLElBQUk7U0FDYixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsc0NBQXNDO1FBQ3RDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsRUFBRTtZQUNwRCxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxFQUFFO2dCQUNwQyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQy9CLHlCQUF5QixLQUFLLElBQUksaUJBQWlCLEVBQUUsRUFDckQ7b0JBQ0UsWUFBWSxFQUFFLGdCQUFnQixDQUFDLEVBQUU7b0JBQ2pDLFFBQVEsRUFBRSxRQUFRO2lCQUNuQixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFO1lBQ3JELFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLEVBQUU7Z0JBQ3BDLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FDL0IsMEJBQTBCLEtBQUssSUFBSSxpQkFBaUIsRUFBRSxFQUN0RDtvQkFDRSxZQUFZLEVBQUUsaUJBQWlCLENBQUMsRUFBRTtvQkFDbEMsUUFBUSxFQUFFLFFBQVE7aUJBQ25CLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGtCQUFrQixHQUFHLGdCQUFnQixDQUFDLEVBQUUsQ0FBQztRQUM5QyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsaUJBQWlCLENBQUMsRUFBRSxDQUFDO1FBRWhELElBQUksQ0FBQyxlQUFlLENBQUM7WUFDbkIsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLGtCQUFrQjtZQUMzQyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsbUJBQW1CO1NBQzlDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQTdPRCwwQ0E2T0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIG5ldHdvcmstYWNsLXN0YWNrLnRzXG4gKlxuICogVGhpcyBtb2R1bGUgZGVmaW5lcyB0aGUgTmV0d29ya0FjbFN0YWNrIGNvbXBvbmVudCBmb3IgY3JlYXRpbmdcbiAqIE5ldHdvcmsgQUNMcyBmb3IgYWRkaXRpb25hbCBuZXR3b3JrIHNlY3VyaXR5IGxheWVyLlxuICovXG5pbXBvcnQgKiBhcyBhd3MgZnJvbSAnQHB1bHVtaS9hd3MnO1xuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCB7IFJlc291cmNlT3B0aW9ucyB9IGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcblxuZXhwb3J0IGludGVyZmFjZSBOZXR3b3JrQWNsU3RhY2tBcmdzIHtcbiAgZW52aXJvbm1lbnRTdWZmaXg/OiBzdHJpbmc7XG4gIHRhZ3M/OiBwdWx1bWkuSW5wdXQ8eyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfT47XG4gIHZwY0lkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgcHJpdmF0ZVN1Ym5ldElkczogcHVsdW1pLklucHV0PHN0cmluZz5bXTtcbiAgcHVibGljU3VibmV0SWRzOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPltdO1xufVxuXG5leHBvcnQgY2xhc3MgTmV0d29ya0FjbFN0YWNrIGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IHB1YmxpY05ldHdvcmtBY2xJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgcHJpdmF0ZU5ldHdvcmtBY2xJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogTmV0d29ya0FjbFN0YWNrQXJncywgb3B0cz86IFJlc291cmNlT3B0aW9ucykge1xuICAgIHN1cGVyKCd0YXA6bmV0d29yazpOZXR3b3JrQWNsU3RhY2snLCBuYW1lLCBhcmdzLCBvcHRzKTtcblxuICAgIGNvbnN0IGVudmlyb25tZW50U3VmZml4ID0gYXJncy5lbnZpcm9ubWVudFN1ZmZpeCB8fCAnZGV2JztcbiAgICBjb25zdCB0YWdzID0gYXJncy50YWdzIHx8IHt9O1xuXG4gICAgLy8gUHVibGljIE5ldHdvcmsgQUNMXG4gICAgY29uc3QgcHVibGljTmV0d29ya0FjbCA9IG5ldyBhd3MuZWMyLk5ldHdvcmtBY2woXG4gICAgICBgdGFwLXB1YmxpYy1uYWNsLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgdnBjSWQ6IGFyZ3MudnBjSWQsXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBOYW1lOiBgdGFwLXB1YmxpYy1uYWNsLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICBUaWVyOiAncHVibGljJyxcbiAgICAgICAgICAuLi50YWdzLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gUHVibGljIE5ldHdvcmsgQUNMIFJ1bGVzIC0gSW5ib3VuZFxuICAgIG5ldyBhd3MuZWMyLk5ldHdvcmtBY2xSdWxlKFxuICAgICAgYHRhcC1wdWJsaWMtbmFjbC1pbmJvdW5kLWh0dHAtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuZXR3b3JrQWNsSWQ6IHB1YmxpY05ldHdvcmtBY2wuaWQsXG4gICAgICAgIHJ1bGVOdW1iZXI6IDEwMCxcbiAgICAgICAgcHJvdG9jb2w6ICd0Y3AnLFxuICAgICAgICBydWxlQWN0aW9uOiAnYWxsb3cnLFxuICAgICAgICBmcm9tUG9ydDogODAsXG4gICAgICAgIHRvUG9ydDogODAsXG4gICAgICAgIGNpZHJCbG9jazogJzAuMC4wLjAvMCcsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICBuZXcgYXdzLmVjMi5OZXR3b3JrQWNsUnVsZShcbiAgICAgIGB0YXAtcHVibGljLW5hY2wtaW5ib3VuZC1odHRwcy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIG5ldHdvcmtBY2xJZDogcHVibGljTmV0d29ya0FjbC5pZCxcbiAgICAgICAgcnVsZU51bWJlcjogMTEwLFxuICAgICAgICBwcm90b2NvbDogJ3RjcCcsXG4gICAgICAgIHJ1bGVBY3Rpb246ICdhbGxvdycsXG4gICAgICAgIGZyb21Qb3J0OiA0NDMsXG4gICAgICAgIHRvUG9ydDogNDQzLFxuICAgICAgICBjaWRyQmxvY2s6ICcwLjAuMC4wLzAnLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgbmV3IGF3cy5lYzIuTmV0d29ya0FjbFJ1bGUoXG4gICAgICBgdGFwLXB1YmxpYy1uYWNsLWluYm91bmQtZXBoZW1lcmFsLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmV0d29ya0FjbElkOiBwdWJsaWNOZXR3b3JrQWNsLmlkLFxuICAgICAgICBydWxlTnVtYmVyOiAxMjAsXG4gICAgICAgIHByb3RvY29sOiAndGNwJyxcbiAgICAgICAgcnVsZUFjdGlvbjogJ2FsbG93JyxcbiAgICAgICAgZnJvbVBvcnQ6IDEwMjQsXG4gICAgICAgIHRvUG9ydDogNjU1MzUsXG4gICAgICAgIGNpZHJCbG9jazogJzAuMC4wLjAvMCcsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBQdWJsaWMgTmV0d29yayBBQ0wgUnVsZXMgLSBPdXRib3VuZFxuICAgIG5ldyBhd3MuZWMyLk5ldHdvcmtBY2xSdWxlKFxuICAgICAgYHRhcC1wdWJsaWMtbmFjbC1vdXRib3VuZC1odHRwLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmV0d29ya0FjbElkOiBwdWJsaWNOZXR3b3JrQWNsLmlkLFxuICAgICAgICBydWxlTnVtYmVyOiAxMDAsXG4gICAgICAgIHByb3RvY29sOiAndGNwJyxcbiAgICAgICAgcnVsZUFjdGlvbjogJ2FsbG93JyxcbiAgICAgICAgZnJvbVBvcnQ6IDgwLFxuICAgICAgICB0b1BvcnQ6IDgwLFxuICAgICAgICBjaWRyQmxvY2s6ICcwLjAuMC4wLzAnLFxuICAgICAgICBlZ3Jlc3M6IHRydWUsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICBuZXcgYXdzLmVjMi5OZXR3b3JrQWNsUnVsZShcbiAgICAgIGB0YXAtcHVibGljLW5hY2wtb3V0Ym91bmQtaHR0cHMtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuZXR3b3JrQWNsSWQ6IHB1YmxpY05ldHdvcmtBY2wuaWQsXG4gICAgICAgIHJ1bGVOdW1iZXI6IDExMCxcbiAgICAgICAgcHJvdG9jb2w6ICd0Y3AnLFxuICAgICAgICBydWxlQWN0aW9uOiAnYWxsb3cnLFxuICAgICAgICBmcm9tUG9ydDogNDQzLFxuICAgICAgICB0b1BvcnQ6IDQ0MyxcbiAgICAgICAgY2lkckJsb2NrOiAnMC4wLjAuMC8wJyxcbiAgICAgICAgZWdyZXNzOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgbmV3IGF3cy5lYzIuTmV0d29ya0FjbFJ1bGUoXG4gICAgICBgdGFwLXB1YmxpYy1uYWNsLW91dGJvdW5kLWVwaGVtZXJhbC0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIG5ldHdvcmtBY2xJZDogcHVibGljTmV0d29ya0FjbC5pZCxcbiAgICAgICAgcnVsZU51bWJlcjogMTIwLFxuICAgICAgICBwcm90b2NvbDogJ3RjcCcsXG4gICAgICAgIHJ1bGVBY3Rpb246ICdhbGxvdycsXG4gICAgICAgIGZyb21Qb3J0OiAxMDI0LFxuICAgICAgICB0b1BvcnQ6IDY1NTM1LFxuICAgICAgICBjaWRyQmxvY2s6ICcwLjAuMC4wLzAnLFxuICAgICAgICBlZ3Jlc3M6IHRydWUsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBQcml2YXRlIE5ldHdvcmsgQUNMXG4gICAgY29uc3QgcHJpdmF0ZU5ldHdvcmtBY2wgPSBuZXcgYXdzLmVjMi5OZXR3b3JrQWNsKFxuICAgICAgYHRhcC1wcml2YXRlLW5hY2wtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICB2cGNJZDogYXJncy52cGNJZCxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIE5hbWU6IGB0YXAtcHJpdmF0ZS1uYWNsLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICBUaWVyOiAncHJpdmF0ZScsXG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIFByaXZhdGUgTmV0d29yayBBQ0wgUnVsZXMgLSBJbmJvdW5kIChmcm9tIFZQQyBvbmx5KVxuICAgIG5ldyBhd3MuZWMyLk5ldHdvcmtBY2xSdWxlKFxuICAgICAgYHRhcC1wcml2YXRlLW5hY2wtaW5ib3VuZC12cGMtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuZXR3b3JrQWNsSWQ6IHByaXZhdGVOZXR3b3JrQWNsLmlkLFxuICAgICAgICBydWxlTnVtYmVyOiAxMDAsXG4gICAgICAgIHByb3RvY29sOiAndGNwJyxcbiAgICAgICAgcnVsZUFjdGlvbjogJ2FsbG93JyxcbiAgICAgICAgZnJvbVBvcnQ6IDAsXG4gICAgICAgIHRvUG9ydDogNjU1MzUsXG4gICAgICAgIGNpZHJCbG9jazogJzEwLjAuMC4wLzE2JywgLy8gVlBDIENJRFJcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIG5ldyBhd3MuZWMyLk5ldHdvcmtBY2xSdWxlKFxuICAgICAgYHRhcC1wcml2YXRlLW5hY2wtaW5ib3VuZC1lcGhlbWVyYWwtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuZXR3b3JrQWNsSWQ6IHByaXZhdGVOZXR3b3JrQWNsLmlkLFxuICAgICAgICBydWxlTnVtYmVyOiAxMTAsXG4gICAgICAgIHByb3RvY29sOiAndGNwJyxcbiAgICAgICAgcnVsZUFjdGlvbjogJ2FsbG93JyxcbiAgICAgICAgZnJvbVBvcnQ6IDEwMjQsXG4gICAgICAgIHRvUG9ydDogNjU1MzUsXG4gICAgICAgIGNpZHJCbG9jazogJzAuMC4wLjAvMCcsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBQcml2YXRlIE5ldHdvcmsgQUNMIFJ1bGVzIC0gT3V0Ym91bmRcbiAgICBuZXcgYXdzLmVjMi5OZXR3b3JrQWNsUnVsZShcbiAgICAgIGB0YXAtcHJpdmF0ZS1uYWNsLW91dGJvdW5kLWh0dHBzLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmV0d29ya0FjbElkOiBwcml2YXRlTmV0d29ya0FjbC5pZCxcbiAgICAgICAgcnVsZU51bWJlcjogMTAwLFxuICAgICAgICBwcm90b2NvbDogJ3RjcCcsXG4gICAgICAgIHJ1bGVBY3Rpb246ICdhbGxvdycsXG4gICAgICAgIGZyb21Qb3J0OiA0NDMsXG4gICAgICAgIHRvUG9ydDogNDQzLFxuICAgICAgICBjaWRyQmxvY2s6ICcwLjAuMC4wLzAnLFxuICAgICAgICBlZ3Jlc3M6IHRydWUsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICBuZXcgYXdzLmVjMi5OZXR3b3JrQWNsUnVsZShcbiAgICAgIGB0YXAtcHJpdmF0ZS1uYWNsLW91dGJvdW5kLXZwYy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIG5ldHdvcmtBY2xJZDogcHJpdmF0ZU5ldHdvcmtBY2wuaWQsXG4gICAgICAgIHJ1bGVOdW1iZXI6IDExMCxcbiAgICAgICAgcHJvdG9jb2w6ICd0Y3AnLFxuICAgICAgICBydWxlQWN0aW9uOiAnYWxsb3cnLFxuICAgICAgICBmcm9tUG9ydDogMCxcbiAgICAgICAgdG9Qb3J0OiA2NTUzNSxcbiAgICAgICAgY2lkckJsb2NrOiAnMTAuMC4wLjAvMTYnLCAvLyBWUEMgQ0lEUlxuICAgICAgICBlZ3Jlc3M6IHRydWUsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICBuZXcgYXdzLmVjMi5OZXR3b3JrQWNsUnVsZShcbiAgICAgIGB0YXAtcHJpdmF0ZS1uYWNsLW91dGJvdW5kLWVwaGVtZXJhbC0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIG5ldHdvcmtBY2xJZDogcHJpdmF0ZU5ldHdvcmtBY2wuaWQsXG4gICAgICAgIHJ1bGVOdW1iZXI6IDEyMCxcbiAgICAgICAgcHJvdG9jb2w6ICd0Y3AnLFxuICAgICAgICBydWxlQWN0aW9uOiAnYWxsb3cnLFxuICAgICAgICBmcm9tUG9ydDogMTAyNCxcbiAgICAgICAgdG9Qb3J0OiA2NTUzNSxcbiAgICAgICAgY2lkckJsb2NrOiAnMC4wLjAuMC8wJyxcbiAgICAgICAgZWdyZXNzOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQXNzb2NpYXRlIE5ldHdvcmsgQUNMcyB3aXRoIHN1Ym5ldHNcbiAgICBwdWx1bWkub3V0cHV0KGFyZ3MucHVibGljU3VibmV0SWRzKS5hcHBseShzdWJuZXRJZHMgPT4ge1xuICAgICAgc3VibmV0SWRzLmZvckVhY2goKHN1Ym5ldElkLCBpbmRleCkgPT4ge1xuICAgICAgICBuZXcgYXdzLmVjMi5OZXR3b3JrQWNsQXNzb2NpYXRpb24oXG4gICAgICAgICAgYHRhcC1wdWJsaWMtbmFjbC1hc3NvYy0ke2luZGV4fS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmV0d29ya0FjbElkOiBwdWJsaWNOZXR3b3JrQWNsLmlkLFxuICAgICAgICAgICAgc3VibmV0SWQ6IHN1Ym5ldElkLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICAgICApO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBwdWx1bWkub3V0cHV0KGFyZ3MucHJpdmF0ZVN1Ym5ldElkcykuYXBwbHkoc3VibmV0SWRzID0+IHtcbiAgICAgIHN1Ym5ldElkcy5mb3JFYWNoKChzdWJuZXRJZCwgaW5kZXgpID0+IHtcbiAgICAgICAgbmV3IGF3cy5lYzIuTmV0d29ya0FjbEFzc29jaWF0aW9uKFxuICAgICAgICAgIGB0YXAtcHJpdmF0ZS1uYWNsLWFzc29jLSR7aW5kZXh9LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBuZXR3b3JrQWNsSWQ6IHByaXZhdGVOZXR3b3JrQWNsLmlkLFxuICAgICAgICAgICAgc3VibmV0SWQ6IHN1Ym5ldElkLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICAgICApO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnB1YmxpY05ldHdvcmtBY2xJZCA9IHB1YmxpY05ldHdvcmtBY2wuaWQ7XG4gICAgdGhpcy5wcml2YXRlTmV0d29ya0FjbElkID0gcHJpdmF0ZU5ldHdvcmtBY2wuaWQ7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICBwdWJsaWNOZXR3b3JrQWNsSWQ6IHRoaXMucHVibGljTmV0d29ya0FjbElkLFxuICAgICAgcHJpdmF0ZU5ldHdvcmtBY2xJZDogdGhpcy5wcml2YXRlTmV0d29ya0FjbElkLFxuICAgIH0pO1xuICB9XG59XG4iXX0=