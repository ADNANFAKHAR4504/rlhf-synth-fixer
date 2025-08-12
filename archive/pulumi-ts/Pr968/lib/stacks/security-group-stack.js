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
exports.SecurityGroupStack = void 0;
/**
 * security-group-stack.ts
 *
 * This module defines the Security Group stack for EC2 network security.
 * Creates a restrictive security group allowing only HTTP/HTTPS from specific IP range.
 */
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
class SecurityGroupStack extends pulumi.ComponentResource {
    securityGroupId;
    securityGroupArn;
    constructor(name, args, opts) {
        super('tap:security:SecurityGroupStack', name, args, opts);
        const environmentSuffix = args.environmentSuffix || 'dev';
        const tags = args.tags || {};
        // Create security group with restrictive rules
        const webServerSecurityGroup = new aws.ec2.SecurityGroup(`tap-web-server-sg-${environmentSuffix}`, {
            name: `tap-web-server-sg-${environmentSuffix}`,
            description: `Security group for TAP web server - ${environmentSuffix} environment`,
            vpcId: args.vpcId,
            // Ingress rules - only allow HTTP and HTTPS from specific IP range
            ingress: [
                {
                    description: 'HTTP access from restricted IP range',
                    fromPort: 80,
                    toPort: 80,
                    protocol: 'tcp',
                    cidrBlocks: [args.allowedCidr],
                },
                {
                    description: 'HTTPS access from restricted IP range',
                    fromPort: 443,
                    toPort: 443,
                    protocol: 'tcp',
                    cidrBlocks: [args.allowedCidr],
                },
            ],
            // Egress rules - allow all outbound traffic (common practice for updates, etc.)
            egress: [
                {
                    description: 'All outbound traffic',
                    fromPort: 0,
                    toPort: 0,
                    protocol: '-1',
                    cidrBlocks: ['0.0.0.0/0'],
                },
            ],
            tags: {
                Name: `tap-web-server-sg-${environmentSuffix}`,
                Purpose: 'WebServerSecurity',
                AllowedCIDR: args.allowedCidr,
                ...tags,
            },
        }, { parent: this });
        this.securityGroupId = webServerSecurityGroup.id;
        this.securityGroupArn = webServerSecurityGroup.arn;
        this.registerOutputs({
            securityGroupId: this.securityGroupId,
            securityGroupArn: this.securityGroupArn,
        });
    }
}
exports.SecurityGroupStack = SecurityGroupStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjdXJpdHktZ3JvdXAtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzZWN1cml0eS1ncm91cC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7Ozs7R0FLRztBQUNILGlEQUFtQztBQUNuQyx1REFBeUM7QUFlekMsTUFBYSxrQkFBbUIsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQzlDLGVBQWUsQ0FBd0I7SUFDdkMsZ0JBQWdCLENBQXdCO0lBRXhELFlBQ0UsSUFBWSxFQUNaLElBQTRCLEVBQzVCLElBQXNCO1FBRXRCLEtBQUssQ0FBQyxpQ0FBaUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTNELE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixJQUFJLEtBQUssQ0FBQztRQUMxRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQztRQUU3QiwrQ0FBK0M7UUFDL0MsTUFBTSxzQkFBc0IsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUN0RCxxQkFBcUIsaUJBQWlCLEVBQUUsRUFDeEM7WUFDRSxJQUFJLEVBQUUscUJBQXFCLGlCQUFpQixFQUFFO1lBQzlDLFdBQVcsRUFBRSx1Q0FBdUMsaUJBQWlCLGNBQWM7WUFDbkYsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO1lBRWpCLG1FQUFtRTtZQUNuRSxPQUFPLEVBQUU7Z0JBQ1A7b0JBQ0UsV0FBVyxFQUFFLHNDQUFzQztvQkFDbkQsUUFBUSxFQUFFLEVBQUU7b0JBQ1osTUFBTSxFQUFFLEVBQUU7b0JBQ1YsUUFBUSxFQUFFLEtBQUs7b0JBQ2YsVUFBVSxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQztpQkFDL0I7Z0JBQ0Q7b0JBQ0UsV0FBVyxFQUFFLHVDQUF1QztvQkFDcEQsUUFBUSxFQUFFLEdBQUc7b0JBQ2IsTUFBTSxFQUFFLEdBQUc7b0JBQ1gsUUFBUSxFQUFFLEtBQUs7b0JBQ2YsVUFBVSxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQztpQkFDL0I7YUFDRjtZQUVELGdGQUFnRjtZQUNoRixNQUFNLEVBQUU7Z0JBQ047b0JBQ0UsV0FBVyxFQUFFLHNCQUFzQjtvQkFDbkMsUUFBUSxFQUFFLENBQUM7b0JBQ1gsTUFBTSxFQUFFLENBQUM7b0JBQ1QsUUFBUSxFQUFFLElBQUk7b0JBQ2QsVUFBVSxFQUFFLENBQUMsV0FBVyxDQUFDO2lCQUMxQjthQUNGO1lBRUQsSUFBSSxFQUFFO2dCQUNKLElBQUksRUFBRSxxQkFBcUIsaUJBQWlCLEVBQUU7Z0JBQzlDLE9BQU8sRUFBRSxtQkFBbUI7Z0JBQzVCLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVztnQkFDN0IsR0FBRyxJQUFJO2FBQ1I7U0FDRixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsSUFBSSxDQUFDLGVBQWUsR0FBRyxzQkFBc0IsQ0FBQyxFQUFFLENBQUM7UUFDakQsSUFBSSxDQUFDLGdCQUFnQixHQUFHLHNCQUFzQixDQUFDLEdBQUcsQ0FBQztRQUVuRCxJQUFJLENBQUMsZUFBZSxDQUFDO1lBQ25CLGVBQWUsRUFBRSxJQUFJLENBQUMsZUFBZTtZQUNyQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsZ0JBQWdCO1NBQ3hDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXJFRCxnREFxRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIHNlY3VyaXR5LWdyb3VwLXN0YWNrLnRzXG4gKlxuICogVGhpcyBtb2R1bGUgZGVmaW5lcyB0aGUgU2VjdXJpdHkgR3JvdXAgc3RhY2sgZm9yIEVDMiBuZXR3b3JrIHNlY3VyaXR5LlxuICogQ3JlYXRlcyBhIHJlc3RyaWN0aXZlIHNlY3VyaXR5IGdyb3VwIGFsbG93aW5nIG9ubHkgSFRUUC9IVFRQUyBmcm9tIHNwZWNpZmljIElQIHJhbmdlLlxuICovXG5pbXBvcnQgKiBhcyBhd3MgZnJvbSAnQHB1bHVtaS9hd3MnO1xuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCB7IFJlc291cmNlT3B0aW9ucyB9IGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcblxuZXhwb3J0IGludGVyZmFjZSBTZWN1cml0eUdyb3VwU3RhY2tBcmdzIHtcbiAgZW52aXJvbm1lbnRTdWZmaXg/OiBzdHJpbmc7XG4gIHRhZ3M/OiBwdWx1bWkuSW5wdXQ8eyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfT47XG4gIHZwY0lkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgYWxsb3dlZENpZHI6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTZWN1cml0eUdyb3VwU3RhY2tPdXRwdXRzIHtcbiAgc2VjdXJpdHlHcm91cElkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHNlY3VyaXR5R3JvdXBBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbn1cblxuZXhwb3J0IGNsYXNzIFNlY3VyaXR5R3JvdXBTdGFjayBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSBzZWN1cml0eUdyb3VwSWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IHNlY3VyaXR5R3JvdXBBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogU2VjdXJpdHlHcm91cFN0YWNrQXJncyxcbiAgICBvcHRzPzogUmVzb3VyY2VPcHRpb25zXG4gICkge1xuICAgIHN1cGVyKCd0YXA6c2VjdXJpdHk6U2VjdXJpdHlHcm91cFN0YWNrJywgbmFtZSwgYXJncywgb3B0cyk7XG5cbiAgICBjb25zdCBlbnZpcm9ubWVudFN1ZmZpeCA9IGFyZ3MuZW52aXJvbm1lbnRTdWZmaXggfHwgJ2Rldic7XG4gICAgY29uc3QgdGFncyA9IGFyZ3MudGFncyB8fCB7fTtcblxuICAgIC8vIENyZWF0ZSBzZWN1cml0eSBncm91cCB3aXRoIHJlc3RyaWN0aXZlIHJ1bGVzXG4gICAgY29uc3Qgd2ViU2VydmVyU2VjdXJpdHlHcm91cCA9IG5ldyBhd3MuZWMyLlNlY3VyaXR5R3JvdXAoXG4gICAgICBgdGFwLXdlYi1zZXJ2ZXItc2ctJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgdGFwLXdlYi1zZXJ2ZXItc2ctJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBkZXNjcmlwdGlvbjogYFNlY3VyaXR5IGdyb3VwIGZvciBUQVAgd2ViIHNlcnZlciAtICR7ZW52aXJvbm1lbnRTdWZmaXh9IGVudmlyb25tZW50YCxcbiAgICAgICAgdnBjSWQ6IGFyZ3MudnBjSWQsXG5cbiAgICAgICAgLy8gSW5ncmVzcyBydWxlcyAtIG9ubHkgYWxsb3cgSFRUUCBhbmQgSFRUUFMgZnJvbSBzcGVjaWZpYyBJUCByYW5nZVxuICAgICAgICBpbmdyZXNzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdIVFRQIGFjY2VzcyBmcm9tIHJlc3RyaWN0ZWQgSVAgcmFuZ2UnLFxuICAgICAgICAgICAgZnJvbVBvcnQ6IDgwLFxuICAgICAgICAgICAgdG9Qb3J0OiA4MCxcbiAgICAgICAgICAgIHByb3RvY29sOiAndGNwJyxcbiAgICAgICAgICAgIGNpZHJCbG9ja3M6IFthcmdzLmFsbG93ZWRDaWRyXSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSFRUUFMgYWNjZXNzIGZyb20gcmVzdHJpY3RlZCBJUCByYW5nZScsXG4gICAgICAgICAgICBmcm9tUG9ydDogNDQzLFxuICAgICAgICAgICAgdG9Qb3J0OiA0NDMsXG4gICAgICAgICAgICBwcm90b2NvbDogJ3RjcCcsXG4gICAgICAgICAgICBjaWRyQmxvY2tzOiBbYXJncy5hbGxvd2VkQ2lkcl0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcblxuICAgICAgICAvLyBFZ3Jlc3MgcnVsZXMgLSBhbGxvdyBhbGwgb3V0Ym91bmQgdHJhZmZpYyAoY29tbW9uIHByYWN0aWNlIGZvciB1cGRhdGVzLCBldGMuKVxuICAgICAgICBlZ3Jlc3M6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0FsbCBvdXRib3VuZCB0cmFmZmljJyxcbiAgICAgICAgICAgIGZyb21Qb3J0OiAwLFxuICAgICAgICAgICAgdG9Qb3J0OiAwLFxuICAgICAgICAgICAgcHJvdG9jb2w6ICctMScsXG4gICAgICAgICAgICBjaWRyQmxvY2tzOiBbJzAuMC4wLjAvMCddLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG5cbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIE5hbWU6IGB0YXAtd2ViLXNlcnZlci1zZy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgUHVycG9zZTogJ1dlYlNlcnZlclNlY3VyaXR5JyxcbiAgICAgICAgICBBbGxvd2VkQ0lEUjogYXJncy5hbGxvd2VkQ2lkcixcbiAgICAgICAgICAuLi50YWdzLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgdGhpcy5zZWN1cml0eUdyb3VwSWQgPSB3ZWJTZXJ2ZXJTZWN1cml0eUdyb3VwLmlkO1xuICAgIHRoaXMuc2VjdXJpdHlHcm91cEFybiA9IHdlYlNlcnZlclNlY3VyaXR5R3JvdXAuYXJuO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgc2VjdXJpdHlHcm91cElkOiB0aGlzLnNlY3VyaXR5R3JvdXBJZCxcbiAgICAgIHNlY3VyaXR5R3JvdXBBcm46IHRoaXMuc2VjdXJpdHlHcm91cEFybixcbiAgICB9KTtcbiAgfVxufVxuIl19