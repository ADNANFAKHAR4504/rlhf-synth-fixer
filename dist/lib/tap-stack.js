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
exports.TapStack = void 0;
/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * It orchestrates the instantiation of other resource-specific components
 * and manages environment-specific configurations.
 */
const pulumi = __importStar(require("@pulumi/pulumi"));
const vpc_stack_1 = require("./vpc-stack");
const alb_stack_1 = require("./alb-stack");
const ec2_stack_1 = require("./ec2-stack");
const s3_stack_1 = require("./s3-stack");
const cloudwatch_stack_1 = require("./cloudwatch-stack");
/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of other resource-specific components
 * and manages the environment suffix used for naming and configuration.
 */
class TapStack extends pulumi.ComponentResource {
    vpcId;
    albDns;
    bucketName;
    /**
     * Creates a new TapStack component.
     * @param name The logical name of this Pulumi component.
     * @param args Configuration arguments including environment suffix and tags.
     * @param opts Pulumi options.
     */
    constructor(name, args, opts) {
        super('tap:stack:TapStack', name, args, opts);
        const environmentSuffix = args.environmentSuffix || 'dev';
        const tags = args.tags || {};
        // Create VPC and networking resources
        const vpcStack = new vpc_stack_1.VpcStack('tap-vpc', {
            environmentSuffix: environmentSuffix,
            vpcCidr: '10.5.0.0/16',
            tags: tags,
        }, { parent: this });
        // Create S3 bucket for static assets
        const s3Stack = new s3_stack_1.S3Stack('tap-s3', {
            environmentSuffix: environmentSuffix,
            tags: tags,
        }, { parent: this });
        // Create EC2 Auto Scaling resources
        const ec2Stack = new ec2_stack_1.Ec2Stack('tap-ec2', {
            environmentSuffix: environmentSuffix,
            vpcId: vpcStack.vpcId,
            privateSubnetIds: vpcStack.privateSubnetIds,
            tags: tags,
        }, { parent: this });
        // Create Application Load Balancer
        const albStack = new alb_stack_1.AlbStack('tap-alb', {
            environmentSuffix: environmentSuffix,
            vpcId: vpcStack.vpcId,
            publicSubnetIds: vpcStack.publicSubnetIds,
            targetGroupArn: ec2Stack.targetGroupArn,
            tags: tags,
        }, { parent: this });
        // Create CloudWatch monitoring
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _cloudWatchStack = new cloudwatch_stack_1.CloudWatchStack('tap-monitoring', {
            environmentSuffix: environmentSuffix,
            autoScalingGroupName: ec2Stack.autoScalingGroupName,
            targetGroupArn: ec2Stack.targetGroupArn,
            albArn: albStack.albArn,
            tags: tags,
        }, { parent: this });
        // Expose outputs
        this.vpcId = vpcStack.vpcId;
        this.albDns = albStack.albDns;
        this.bucketName = s3Stack.bucketName;
        // Register the outputs of this component
        this.registerOutputs({
            vpcId: this.vpcId,
            albDns: this.albDns,
            bucketName: this.bucketName,
        });
    }
}
exports.TapStack = TapStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL3RhcC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7Ozs7Ozs7R0FRRztBQUNILHVEQUF5QztBQUV6QywyQ0FBdUM7QUFDdkMsMkNBQXVDO0FBQ3ZDLDJDQUF1QztBQUN2Qyx5Q0FBcUM7QUFDckMseURBQXFEO0FBa0JyRDs7Ozs7R0FLRztBQUNILE1BQWEsUUFBUyxTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFDcEMsS0FBSyxDQUF3QjtJQUM3QixNQUFNLENBQXdCO0lBQzlCLFVBQVUsQ0FBd0I7SUFFbEQ7Ozs7O09BS0c7SUFDSCxZQUFZLElBQVksRUFBRSxJQUFrQixFQUFFLElBQXNCO1FBQ2xFLEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTlDLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixJQUFJLEtBQUssQ0FBQztRQUMxRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQztRQUU3QixzQ0FBc0M7UUFDdEMsTUFBTSxRQUFRLEdBQUcsSUFBSSxvQkFBUSxDQUMzQixTQUFTLEVBQ1Q7WUFDRSxpQkFBaUIsRUFBRSxpQkFBaUI7WUFDcEMsT0FBTyxFQUFFLGFBQWE7WUFDdEIsSUFBSSxFQUFFLElBQUk7U0FDWCxFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYscUNBQXFDO1FBQ3JDLE1BQU0sT0FBTyxHQUFHLElBQUksa0JBQU8sQ0FDekIsUUFBUSxFQUNSO1lBQ0UsaUJBQWlCLEVBQUUsaUJBQWlCO1lBQ3BDLElBQUksRUFBRSxJQUFJO1NBQ1gsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLG9DQUFvQztRQUNwQyxNQUFNLFFBQVEsR0FBRyxJQUFJLG9CQUFRLENBQzNCLFNBQVMsRUFDVDtZQUNFLGlCQUFpQixFQUFFLGlCQUFpQjtZQUNwQyxLQUFLLEVBQUUsUUFBUSxDQUFDLEtBQUs7WUFDckIsZ0JBQWdCLEVBQUUsUUFBUSxDQUFDLGdCQUFnQjtZQUMzQyxJQUFJLEVBQUUsSUFBSTtTQUNYLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRixtQ0FBbUM7UUFDbkMsTUFBTSxRQUFRLEdBQUcsSUFBSSxvQkFBUSxDQUMzQixTQUFTLEVBQ1Q7WUFDRSxpQkFBaUIsRUFBRSxpQkFBaUI7WUFDcEMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxLQUFLO1lBQ3JCLGVBQWUsRUFBRSxRQUFRLENBQUMsZUFBZTtZQUN6QyxjQUFjLEVBQUUsUUFBUSxDQUFDLGNBQWM7WUFDdkMsSUFBSSxFQUFFLElBQUk7U0FDWCxFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsK0JBQStCO1FBQy9CLDZEQUE2RDtRQUM3RCxNQUFNLGdCQUFnQixHQUFHLElBQUksa0NBQWUsQ0FDMUMsZ0JBQWdCLEVBQ2hCO1lBQ0UsaUJBQWlCLEVBQUUsaUJBQWlCO1lBQ3BDLG9CQUFvQixFQUFFLFFBQVEsQ0FBQyxvQkFBb0I7WUFDbkQsY0FBYyxFQUFFLFFBQVEsQ0FBQyxjQUFjO1lBQ3ZDLE1BQU0sRUFBRSxRQUFRLENBQUMsTUFBTTtZQUN2QixJQUFJLEVBQUUsSUFBSTtTQUNYLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRixpQkFBaUI7UUFDakIsSUFBSSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDO1FBQzVCLElBQUksQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQztRQUM5QixJQUFJLENBQUMsVUFBVSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUM7UUFFckMseUNBQXlDO1FBQ3pDLElBQUksQ0FBQyxlQUFlLENBQUM7WUFDbkIsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO1lBQ2pCLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtZQUNuQixVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVU7U0FDNUIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBekZELDRCQXlGQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogdGFwLXN0YWNrLnRzXG4gKlxuICogVGhpcyBtb2R1bGUgZGVmaW5lcyB0aGUgVGFwU3RhY2sgY2xhc3MsIHRoZSBtYWluIFB1bHVtaSBDb21wb25lbnRSZXNvdXJjZSBmb3JcbiAqIHRoZSBUQVAgKFRlc3QgQXV0b21hdGlvbiBQbGF0Zm9ybSkgcHJvamVjdC5cbiAqXG4gKiBJdCBvcmNoZXN0cmF0ZXMgdGhlIGluc3RhbnRpYXRpb24gb2Ygb3RoZXIgcmVzb3VyY2Utc3BlY2lmaWMgY29tcG9uZW50c1xuICogYW5kIG1hbmFnZXMgZW52aXJvbm1lbnQtc3BlY2lmaWMgY29uZmlndXJhdGlvbnMuXG4gKi9cbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgeyBSZXNvdXJjZU9wdGlvbnMgfSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgeyBWcGNTdGFjayB9IGZyb20gJy4vdnBjLXN0YWNrJztcbmltcG9ydCB7IEFsYlN0YWNrIH0gZnJvbSAnLi9hbGItc3RhY2snO1xuaW1wb3J0IHsgRWMyU3RhY2sgfSBmcm9tICcuL2VjMi1zdGFjayc7XG5pbXBvcnQgeyBTM1N0YWNrIH0gZnJvbSAnLi9zMy1zdGFjayc7XG5pbXBvcnQgeyBDbG91ZFdhdGNoU3RhY2sgfSBmcm9tICcuL2Nsb3Vkd2F0Y2gtc3RhY2snO1xuXG4vKipcbiAqIFRhcFN0YWNrQXJncyBkZWZpbmVzIHRoZSBpbnB1dCBhcmd1bWVudHMgZm9yIHRoZSBUYXBTdGFjayBQdWx1bWkgY29tcG9uZW50LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRhcFN0YWNrQXJncyB7XG4gIC8qKlxuICAgKiBBbiBvcHRpb25hbCBzdWZmaXggZm9yIGlkZW50aWZ5aW5nIHRoZSBkZXBsb3ltZW50IGVudmlyb25tZW50IChlLmcuLCAnZGV2JywgJ3Byb2QnKS5cbiAgICogRGVmYXVsdHMgdG8gJ2RldicgaWYgbm90IHByb3ZpZGVkLlxuICAgKi9cbiAgZW52aXJvbm1lbnRTdWZmaXg/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIE9wdGlvbmFsIGRlZmF1bHQgdGFncyB0byBhcHBseSB0byByZXNvdXJjZXMuXG4gICAqL1xuICB0YWdzPzogcHVsdW1pLklucHV0PHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0+O1xufVxuXG4vKipcbiAqIFJlcHJlc2VudHMgdGhlIG1haW4gUHVsdW1pIGNvbXBvbmVudCByZXNvdXJjZSBmb3IgdGhlIFRBUCBwcm9qZWN0LlxuICpcbiAqIFRoaXMgY29tcG9uZW50IG9yY2hlc3RyYXRlcyB0aGUgaW5zdGFudGlhdGlvbiBvZiBvdGhlciByZXNvdXJjZS1zcGVjaWZpYyBjb21wb25lbnRzXG4gKiBhbmQgbWFuYWdlcyB0aGUgZW52aXJvbm1lbnQgc3VmZml4IHVzZWQgZm9yIG5hbWluZyBhbmQgY29uZmlndXJhdGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIFRhcFN0YWNrIGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IHZwY0lkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBhbGJEbnM6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGJ1Y2tldE5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBUYXBTdGFjayBjb21wb25lbnQuXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBsb2dpY2FsIG5hbWUgb2YgdGhpcyBQdWx1bWkgY29tcG9uZW50LlxuICAgKiBAcGFyYW0gYXJncyBDb25maWd1cmF0aW9uIGFyZ3VtZW50cyBpbmNsdWRpbmcgZW52aXJvbm1lbnQgc3VmZml4IGFuZCB0YWdzLlxuICAgKiBAcGFyYW0gb3B0cyBQdWx1bWkgb3B0aW9ucy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogVGFwU3RhY2tBcmdzLCBvcHRzPzogUmVzb3VyY2VPcHRpb25zKSB7XG4gICAgc3VwZXIoJ3RhcDpzdGFjazpUYXBTdGFjaycsIG5hbWUsIGFyZ3MsIG9wdHMpO1xuXG4gICAgY29uc3QgZW52aXJvbm1lbnRTdWZmaXggPSBhcmdzLmVudmlyb25tZW50U3VmZml4IHx8ICdkZXYnO1xuICAgIGNvbnN0IHRhZ3MgPSBhcmdzLnRhZ3MgfHwge307XG5cbiAgICAvLyBDcmVhdGUgVlBDIGFuZCBuZXR3b3JraW5nIHJlc291cmNlc1xuICAgIGNvbnN0IHZwY1N0YWNrID0gbmV3IFZwY1N0YWNrKFxuICAgICAgJ3RhcC12cGMnLFxuICAgICAge1xuICAgICAgICBlbnZpcm9ubWVudFN1ZmZpeDogZW52aXJvbm1lbnRTdWZmaXgsXG4gICAgICAgIHZwY0NpZHI6ICcxMC41LjAuMC8xNicsXG4gICAgICAgIHRhZ3M6IHRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgUzMgYnVja2V0IGZvciBzdGF0aWMgYXNzZXRzXG4gICAgY29uc3QgczNTdGFjayA9IG5ldyBTM1N0YWNrKFxuICAgICAgJ3RhcC1zMycsXG4gICAgICB7XG4gICAgICAgIGVudmlyb25tZW50U3VmZml4OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAgICAgdGFnczogdGFncyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBFQzIgQXV0byBTY2FsaW5nIHJlc291cmNlc1xuICAgIGNvbnN0IGVjMlN0YWNrID0gbmV3IEVjMlN0YWNrKFxuICAgICAgJ3RhcC1lYzInLFxuICAgICAge1xuICAgICAgICBlbnZpcm9ubWVudFN1ZmZpeDogZW52aXJvbm1lbnRTdWZmaXgsXG4gICAgICAgIHZwY0lkOiB2cGNTdGFjay52cGNJZCxcbiAgICAgICAgcHJpdmF0ZVN1Ym5ldElkczogdnBjU3RhY2sucHJpdmF0ZVN1Ym5ldElkcyxcbiAgICAgICAgdGFnczogdGFncyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBBcHBsaWNhdGlvbiBMb2FkIEJhbGFuY2VyXG4gICAgY29uc3QgYWxiU3RhY2sgPSBuZXcgQWxiU3RhY2soXG4gICAgICAndGFwLWFsYicsXG4gICAgICB7XG4gICAgICAgIGVudmlyb25tZW50U3VmZml4OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAgICAgdnBjSWQ6IHZwY1N0YWNrLnZwY0lkLFxuICAgICAgICBwdWJsaWNTdWJuZXRJZHM6IHZwY1N0YWNrLnB1YmxpY1N1Ym5ldElkcyxcbiAgICAgICAgdGFyZ2V0R3JvdXBBcm46IGVjMlN0YWNrLnRhcmdldEdyb3VwQXJuLFxuICAgICAgICB0YWdzOiB0YWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIENsb3VkV2F0Y2ggbW9uaXRvcmluZ1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW51c2VkLXZhcnNcbiAgICBjb25zdCBfY2xvdWRXYXRjaFN0YWNrID0gbmV3IENsb3VkV2F0Y2hTdGFjayhcbiAgICAgICd0YXAtbW9uaXRvcmluZycsXG4gICAgICB7XG4gICAgICAgIGVudmlyb25tZW50U3VmZml4OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAgICAgYXV0b1NjYWxpbmdHcm91cE5hbWU6IGVjMlN0YWNrLmF1dG9TY2FsaW5nR3JvdXBOYW1lLFxuICAgICAgICB0YXJnZXRHcm91cEFybjogZWMyU3RhY2sudGFyZ2V0R3JvdXBBcm4sXG4gICAgICAgIGFsYkFybjogYWxiU3RhY2suYWxiQXJuLFxuICAgICAgICB0YWdzOiB0YWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gRXhwb3NlIG91dHB1dHNcbiAgICB0aGlzLnZwY0lkID0gdnBjU3RhY2sudnBjSWQ7XG4gICAgdGhpcy5hbGJEbnMgPSBhbGJTdGFjay5hbGJEbnM7XG4gICAgdGhpcy5idWNrZXROYW1lID0gczNTdGFjay5idWNrZXROYW1lO1xuXG4gICAgLy8gUmVnaXN0ZXIgdGhlIG91dHB1dHMgb2YgdGhpcyBjb21wb25lbnRcbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICB2cGNJZDogdGhpcy52cGNJZCxcbiAgICAgIGFsYkRuczogdGhpcy5hbGJEbnMsXG4gICAgICBidWNrZXROYW1lOiB0aGlzLmJ1Y2tldE5hbWUsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==