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
exports.outputs = void 0;
/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the TapStack with appropriate
 * configuration based on the deployment environment. It handles environment-specific settings,
 * tagging, and deployment configuration for AWS resources.
 *
 * The stack created by this module uses environment suffixes to distinguish between
 * different deployment environments (development, staging, production, etc.).
 */
const pulumi = __importStar(require("@pulumi/pulumi"));
const tap_stack_1 = require("../lib/tap-stack");
// Initialize Pulumi configuration for the current stack.
const config = new pulumi.Config();
// Get the environment suffix from the Pulumi config, defaulting to 'dev'.
// You can set this value using the command: `pulumi config set env <value>`
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = config.get('repository') || 'unknown';
const commitAuthor = config.get('commitAuthor') || 'unknown';
// Define a set of default tags to apply to all resources.
// While not explicitly used in the TapStack instantiation here,
// this is the standard place to define them. They would typically be passed
// into the TapStack or configured on the AWS provider.
const defaultTags = {
    Environment: environmentSuffix,
    Repository: repository,
    Author: commitAuthor,
};
// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const stack = new tap_stack_1.TapStack('pulumi-infra', {
    environmentSuffix,
    tags: defaultTags,
});
// Export important resource information
exports.outputs = {
    primaryRegion: stack.secureStack.kmsStack.primaryKmsKey.arn.apply(() => 'ap-south-1'),
    secondaryRegion: stack.secureStack.kmsStack.secondaryKmsKey.arn.apply(() => 'eu-west-1'),
    // VPC Information
    primaryVpcId: stack.secureStack.vpcStack.primaryVpc.id,
    primaryVpcCidr: stack.secureStack.vpcStack.primaryVpc.cidrBlock,
    secondaryVpcId: stack.secureStack.vpcStack.secondaryVpc.id,
    secondaryVpcCidr: stack.secureStack.vpcStack.secondaryVpc.cidrBlock,
    // KMS Keys
    primaryKmsKeyId: stack.secureStack.kmsStack.primaryKmsKey.keyId,
    primaryKmsKeyArn: stack.secureStack.kmsStack.primaryKmsKey.arn,
    secondaryKmsKeyId: stack.secureStack.kmsStack.secondaryKmsKey.keyId,
    secondaryKmsKeyArn: stack.secureStack.kmsStack.secondaryKmsKey.arn,
    // RDS Information
    primaryDbEndpoint: stack.secureStack.rdsStack.primaryRdsInstance.endpoint,
    primaryDbPort: stack.secureStack.rdsStack.primaryRdsInstance.port,
    secondaryDbEndpoint: stack.secureStack.rdsStack.secondaryRdsReadReplica.endpoint,
    secondaryDbPort: stack.secureStack.rdsStack.secondaryRdsReadReplica.port,
    // Load Balancer
    loadBalancerDnsName: stack.secureStack.loadBalancerStack.applicationLoadBalancer.dnsName,
    loadBalancerZoneId: stack.secureStack.loadBalancerStack.applicationLoadBalancer.zoneId,
    // Auto Scaling Group
    autoScalingGroupName: stack.secureStack.autoScalingStack.autoScalingGroup.name,
    autoScalingGroupArn: stack.secureStack.autoScalingStack.autoScalingGroup.arn,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7R0FTRztBQUNILHVEQUF5QztBQUN6QyxnREFBNEM7QUFFNUMseURBQXlEO0FBQ3pELE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBRW5DLDBFQUEwRTtBQUMxRSw0RUFBNEU7QUFDNUUsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixJQUFJLEtBQUssQ0FBQztBQUVsRSxnRUFBZ0U7QUFDaEUsNkNBQTZDO0FBQzdDLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLElBQUksU0FBUyxDQUFDO0FBQ3pELE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLElBQUksU0FBUyxDQUFDO0FBRTdELDBEQUEwRDtBQUMxRCxnRUFBZ0U7QUFDaEUsNEVBQTRFO0FBQzVFLHVEQUF1RDtBQUN2RCxNQUFNLFdBQVcsR0FBRztJQUNsQixXQUFXLEVBQUUsaUJBQWlCO0lBQzlCLFVBQVUsRUFBRSxVQUFVO0lBQ3RCLE1BQU0sRUFBRSxZQUFZO0NBQ3JCLENBQUM7QUFFRiwrREFBK0Q7QUFDL0Qsd0RBQXdEO0FBQ3hELE1BQU0sS0FBSyxHQUFHLElBQUksb0JBQVEsQ0FBQyxjQUFjLEVBQUU7SUFDekMsaUJBQWlCO0lBQ2pCLElBQUksRUFBRSxXQUFXO0NBQ2xCLENBQUMsQ0FBQztBQUVILHdDQUF3QztBQUMzQixRQUFBLE9BQU8sR0FBRztJQUNyQixhQUFhLEVBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQy9ELEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FDbkI7SUFDRCxlQUFlLEVBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQ25FLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FDbEI7SUFFRCxrQkFBa0I7SUFDbEIsWUFBWSxFQUFFLEtBQUssQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxFQUFFO0lBQ3RELGNBQWMsRUFBRSxLQUFLLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsU0FBUztJQUMvRCxjQUFjLEVBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLEVBQUU7SUFDMUQsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLFNBQVM7SUFFbkUsV0FBVztJQUNYLGVBQWUsRUFBRSxLQUFLLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSztJQUMvRCxnQkFBZ0IsRUFBRSxLQUFLLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsR0FBRztJQUM5RCxpQkFBaUIsRUFBRSxLQUFLLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsS0FBSztJQUNuRSxrQkFBa0IsRUFBRSxLQUFLLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsR0FBRztJQUVsRSxrQkFBa0I7SUFDbEIsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsa0JBQWtCLENBQUMsUUFBUTtJQUN6RSxhQUFhLEVBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsa0JBQWtCLENBQUMsSUFBSTtJQUNqRSxtQkFBbUIsRUFDakIsS0FBSyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsdUJBQXVCLENBQUMsUUFBUTtJQUM3RCxlQUFlLEVBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsdUJBQXVCLENBQUMsSUFBSTtJQUV4RSxnQkFBZ0I7SUFDaEIsbUJBQW1CLEVBQ2pCLEtBQUssQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsdUJBQXVCLENBQUMsT0FBTztJQUNyRSxrQkFBa0IsRUFDaEIsS0FBSyxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyx1QkFBdUIsQ0FBQyxNQUFNO0lBRXBFLHFCQUFxQjtJQUNyQixvQkFBb0IsRUFDbEIsS0FBSyxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJO0lBQzFELG1CQUFtQixFQUFFLEtBQUssQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUMsR0FBRztDQUM3RSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBQdWx1bWkgYXBwbGljYXRpb24gZW50cnkgcG9pbnQgZm9yIHRoZSBUQVAgKFRlc3QgQXV0b21hdGlvbiBQbGF0Zm9ybSkgaW5mcmFzdHJ1Y3R1cmUuXG4gKlxuICogVGhpcyBtb2R1bGUgZGVmaW5lcyB0aGUgY29yZSBQdWx1bWkgc3RhY2sgYW5kIGluc3RhbnRpYXRlcyB0aGUgVGFwU3RhY2sgd2l0aCBhcHByb3ByaWF0ZVxuICogY29uZmlndXJhdGlvbiBiYXNlZCBvbiB0aGUgZGVwbG95bWVudCBlbnZpcm9ubWVudC4gSXQgaGFuZGxlcyBlbnZpcm9ubWVudC1zcGVjaWZpYyBzZXR0aW5ncyxcbiAqIHRhZ2dpbmcsIGFuZCBkZXBsb3ltZW50IGNvbmZpZ3VyYXRpb24gZm9yIEFXUyByZXNvdXJjZXMuXG4gKlxuICogVGhlIHN0YWNrIGNyZWF0ZWQgYnkgdGhpcyBtb2R1bGUgdXNlcyBlbnZpcm9ubWVudCBzdWZmaXhlcyB0byBkaXN0aW5ndWlzaCBiZXR3ZWVuXG4gKiBkaWZmZXJlbnQgZGVwbG95bWVudCBlbnZpcm9ubWVudHMgKGRldmVsb3BtZW50LCBzdGFnaW5nLCBwcm9kdWN0aW9uLCBldGMuKS5cbiAqL1xuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCB7IFRhcFN0YWNrIH0gZnJvbSAnLi4vbGliL3RhcC1zdGFjayc7XG5cbi8vIEluaXRpYWxpemUgUHVsdW1pIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBjdXJyZW50IHN0YWNrLlxuY29uc3QgY29uZmlnID0gbmV3IHB1bHVtaS5Db25maWcoKTtcblxuLy8gR2V0IHRoZSBlbnZpcm9ubWVudCBzdWZmaXggZnJvbSB0aGUgUHVsdW1pIGNvbmZpZywgZGVmYXVsdGluZyB0byAnZGV2Jy5cbi8vIFlvdSBjYW4gc2V0IHRoaXMgdmFsdWUgdXNpbmcgdGhlIGNvbW1hbmQ6IGBwdWx1bWkgY29uZmlnIHNldCBlbnYgPHZhbHVlPmBcbmNvbnN0IGVudmlyb25tZW50U3VmZml4ID0gcHJvY2Vzcy5lbnYuRU5WSVJPTk1FTlRfU1VGRklYIHx8ICdkZXYnO1xuXG4vLyBHZXQgbWV0YWRhdGEgZnJvbSBlbnZpcm9ubWVudCB2YXJpYWJsZXMgZm9yIHRhZ2dpbmcgcHVycG9zZXMuXG4vLyBUaGVzZSBhcmUgb2Z0ZW4gaW5qZWN0ZWQgYnkgQ0kvQ0Qgc3lzdGVtcy5cbmNvbnN0IHJlcG9zaXRvcnkgPSBjb25maWcuZ2V0KCdyZXBvc2l0b3J5JykgfHwgJ3Vua25vd24nO1xuY29uc3QgY29tbWl0QXV0aG9yID0gY29uZmlnLmdldCgnY29tbWl0QXV0aG9yJykgfHwgJ3Vua25vd24nO1xuXG4vLyBEZWZpbmUgYSBzZXQgb2YgZGVmYXVsdCB0YWdzIHRvIGFwcGx5IHRvIGFsbCByZXNvdXJjZXMuXG4vLyBXaGlsZSBub3QgZXhwbGljaXRseSB1c2VkIGluIHRoZSBUYXBTdGFjayBpbnN0YW50aWF0aW9uIGhlcmUsXG4vLyB0aGlzIGlzIHRoZSBzdGFuZGFyZCBwbGFjZSB0byBkZWZpbmUgdGhlbS4gVGhleSB3b3VsZCB0eXBpY2FsbHkgYmUgcGFzc2VkXG4vLyBpbnRvIHRoZSBUYXBTdGFjayBvciBjb25maWd1cmVkIG9uIHRoZSBBV1MgcHJvdmlkZXIuXG5jb25zdCBkZWZhdWx0VGFncyA9IHtcbiAgRW52aXJvbm1lbnQ6IGVudmlyb25tZW50U3VmZml4LFxuICBSZXBvc2l0b3J5OiByZXBvc2l0b3J5LFxuICBBdXRob3I6IGNvbW1pdEF1dGhvcixcbn07XG5cbi8vIEluc3RhbnRpYXRlIHRoZSBtYWluIHN0YWNrIGNvbXBvbmVudCBmb3IgdGhlIGluZnJhc3RydWN0dXJlLlxuLy8gVGhpcyBlbmNhcHN1bGF0ZXMgYWxsIHRoZSByZXNvdXJjZXMgZm9yIHRoZSBwbGF0Zm9ybS5cbmNvbnN0IHN0YWNrID0gbmV3IFRhcFN0YWNrKCdwdWx1bWktaW5mcmEnLCB7XG4gIGVudmlyb25tZW50U3VmZml4LFxuICB0YWdzOiBkZWZhdWx0VGFncyxcbn0pO1xuXG4vLyBFeHBvcnQgaW1wb3J0YW50IHJlc291cmNlIGluZm9ybWF0aW9uXG5leHBvcnQgY29uc3Qgb3V0cHV0cyA9IHtcbiAgcHJpbWFyeVJlZ2lvbjogc3RhY2suc2VjdXJlU3RhY2sua21zU3RhY2sucHJpbWFyeUttc0tleS5hcm4uYXBwbHkoXG4gICAgKCkgPT4gJ2FwLXNvdXRoLTEnXG4gICksXG4gIHNlY29uZGFyeVJlZ2lvbjogc3RhY2suc2VjdXJlU3RhY2sua21zU3RhY2suc2Vjb25kYXJ5S21zS2V5LmFybi5hcHBseShcbiAgICAoKSA9PiAnZXUtd2VzdC0xJ1xuICApLFxuXG4gIC8vIFZQQyBJbmZvcm1hdGlvblxuICBwcmltYXJ5VnBjSWQ6IHN0YWNrLnNlY3VyZVN0YWNrLnZwY1N0YWNrLnByaW1hcnlWcGMuaWQsXG4gIHByaW1hcnlWcGNDaWRyOiBzdGFjay5zZWN1cmVTdGFjay52cGNTdGFjay5wcmltYXJ5VnBjLmNpZHJCbG9jayxcbiAgc2Vjb25kYXJ5VnBjSWQ6IHN0YWNrLnNlY3VyZVN0YWNrLnZwY1N0YWNrLnNlY29uZGFyeVZwYy5pZCxcbiAgc2Vjb25kYXJ5VnBjQ2lkcjogc3RhY2suc2VjdXJlU3RhY2sudnBjU3RhY2suc2Vjb25kYXJ5VnBjLmNpZHJCbG9jayxcblxuICAvLyBLTVMgS2V5c1xuICBwcmltYXJ5S21zS2V5SWQ6IHN0YWNrLnNlY3VyZVN0YWNrLmttc1N0YWNrLnByaW1hcnlLbXNLZXkua2V5SWQsXG4gIHByaW1hcnlLbXNLZXlBcm46IHN0YWNrLnNlY3VyZVN0YWNrLmttc1N0YWNrLnByaW1hcnlLbXNLZXkuYXJuLFxuICBzZWNvbmRhcnlLbXNLZXlJZDogc3RhY2suc2VjdXJlU3RhY2sua21zU3RhY2suc2Vjb25kYXJ5S21zS2V5LmtleUlkLFxuICBzZWNvbmRhcnlLbXNLZXlBcm46IHN0YWNrLnNlY3VyZVN0YWNrLmttc1N0YWNrLnNlY29uZGFyeUttc0tleS5hcm4sXG5cbiAgLy8gUkRTIEluZm9ybWF0aW9uXG4gIHByaW1hcnlEYkVuZHBvaW50OiBzdGFjay5zZWN1cmVTdGFjay5yZHNTdGFjay5wcmltYXJ5UmRzSW5zdGFuY2UuZW5kcG9pbnQsXG4gIHByaW1hcnlEYlBvcnQ6IHN0YWNrLnNlY3VyZVN0YWNrLnJkc1N0YWNrLnByaW1hcnlSZHNJbnN0YW5jZS5wb3J0LFxuICBzZWNvbmRhcnlEYkVuZHBvaW50OlxuICAgIHN0YWNrLnNlY3VyZVN0YWNrLnJkc1N0YWNrLnNlY29uZGFyeVJkc1JlYWRSZXBsaWNhLmVuZHBvaW50LFxuICBzZWNvbmRhcnlEYlBvcnQ6IHN0YWNrLnNlY3VyZVN0YWNrLnJkc1N0YWNrLnNlY29uZGFyeVJkc1JlYWRSZXBsaWNhLnBvcnQsXG5cbiAgLy8gTG9hZCBCYWxhbmNlclxuICBsb2FkQmFsYW5jZXJEbnNOYW1lOlxuICAgIHN0YWNrLnNlY3VyZVN0YWNrLmxvYWRCYWxhbmNlclN0YWNrLmFwcGxpY2F0aW9uTG9hZEJhbGFuY2VyLmRuc05hbWUsXG4gIGxvYWRCYWxhbmNlclpvbmVJZDpcbiAgICBzdGFjay5zZWN1cmVTdGFjay5sb2FkQmFsYW5jZXJTdGFjay5hcHBsaWNhdGlvbkxvYWRCYWxhbmNlci56b25lSWQsXG5cbiAgLy8gQXV0byBTY2FsaW5nIEdyb3VwXG4gIGF1dG9TY2FsaW5nR3JvdXBOYW1lOlxuICAgIHN0YWNrLnNlY3VyZVN0YWNrLmF1dG9TY2FsaW5nU3RhY2suYXV0b1NjYWxpbmdHcm91cC5uYW1lLFxuICBhdXRvU2NhbGluZ0dyb3VwQXJuOiBzdGFjay5zZWN1cmVTdGFjay5hdXRvU2NhbGluZ1N0YWNrLmF1dG9TY2FsaW5nR3JvdXAuYXJuLFxufTtcbiJdfQ==