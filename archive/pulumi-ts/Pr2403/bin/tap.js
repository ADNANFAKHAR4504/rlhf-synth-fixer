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
exports.sanitizedName = exports.environment = exports.cloudFrontDistributionId = exports.ec2SecurityGroupId = exports.albSecurityGroupId = exports.ec2RoleArn = exports.launchTemplateName = exports.autoScalingGroupName = exports.targetGroupArn = exports.albArn = exports.logGroupName = exports.webAclArn = exports.kmsKeyArn = exports.kmsKeyId = exports.secretArn = exports.dynamoTableName = exports.cloudFrontDomainName = exports.albZoneId = exports.albDnsName = exports.privateSubnetIds = exports.publicSubnetIds = exports.vpcId = void 0;
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
    environmentSuffix: environmentSuffix,
    tags: defaultTags,
});
// To use the stack outputs, you can export them.
// For example, if TapStack had an output `bucketName`:
// export const bucketName = stack.bucketName;
exports.vpcId = stack.vpcId;
exports.publicSubnetIds = stack.publicSubnetIds;
exports.privateSubnetIds = stack.privateSubnetIds;
exports.albDnsName = stack.albDnsName;
exports.albZoneId = stack.albZoneId;
exports.cloudFrontDomainName = stack.cloudFrontDomainName;
exports.dynamoTableName = stack.dynamoTableName;
exports.secretArn = stack.secretArn;
exports.kmsKeyId = stack.kmsKeyId;
exports.kmsKeyArn = stack.kmsKeyArn;
exports.webAclArn = stack.webAclArn;
exports.logGroupName = stack.logGroupName;
exports.albArn = stack.albArn;
exports.targetGroupArn = stack.targetGroupArn;
exports.autoScalingGroupName = stack.autoScalingGroupName;
exports.launchTemplateName = stack.launchTemplateName;
exports.ec2RoleArn = stack.ec2RoleArn;
exports.albSecurityGroupId = stack.albSecurityGroupId;
exports.ec2SecurityGroupId = stack.ec2SecurityGroupId;
exports.cloudFrontDistributionId = stack.cloudFrontDistributionId;
exports.environment = stack.environment;
exports.sanitizedName = stack.sanitizedName;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7R0FTRztBQUNILHVEQUF5QztBQUN6QyxnREFBNEM7QUFFNUMseURBQXlEO0FBQ3pELE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBRW5DLDBFQUEwRTtBQUMxRSw0RUFBNEU7QUFDNUUsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixJQUFJLEtBQUssQ0FBQztBQUVsRSxnRUFBZ0U7QUFDaEUsNkNBQTZDO0FBQzdDLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLElBQUksU0FBUyxDQUFDO0FBQ3pELE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLElBQUksU0FBUyxDQUFDO0FBRTdELDBEQUEwRDtBQUMxRCxnRUFBZ0U7QUFDaEUsNEVBQTRFO0FBQzVFLHVEQUF1RDtBQUN2RCxNQUFNLFdBQVcsR0FBRztJQUNsQixXQUFXLEVBQUUsaUJBQWlCO0lBQzlCLFVBQVUsRUFBRSxVQUFVO0lBQ3RCLE1BQU0sRUFBRSxZQUFZO0NBQ3JCLENBQUM7QUFFRiwrREFBK0Q7QUFDL0Qsd0RBQXdEO0FBQ3hELE1BQU0sS0FBSyxHQUFHLElBQUksb0JBQVEsQ0FBQyxjQUFjLEVBQUU7SUFDekMsaUJBQWlCLEVBQUUsaUJBQWlCO0lBQ3BDLElBQUksRUFBRSxXQUFXO0NBQ2xCLENBQUMsQ0FBQztBQUVILGlEQUFpRDtBQUNqRCx1REFBdUQ7QUFDdkQsOENBQThDO0FBQ2pDLFFBQUEsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7QUFDcEIsUUFBQSxlQUFlLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQztBQUN4QyxRQUFBLGdCQUFnQixHQUFHLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQztBQUMxQyxRQUFBLFVBQVUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDO0FBQzlCLFFBQUEsU0FBUyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUM7QUFDNUIsUUFBQSxvQkFBb0IsR0FBRyxLQUFLLENBQUMsb0JBQW9CLENBQUM7QUFDbEQsUUFBQSxlQUFlLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQztBQUN4QyxRQUFBLFNBQVMsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDO0FBQzVCLFFBQUEsUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUM7QUFDMUIsUUFBQSxTQUFTLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQztBQUM1QixRQUFBLFNBQVMsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDO0FBQzVCLFFBQUEsWUFBWSxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUM7QUFDbEMsUUFBQSxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztBQUN0QixRQUFBLGNBQWMsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDO0FBQ3RDLFFBQUEsb0JBQW9CLEdBQUcsS0FBSyxDQUFDLG9CQUFvQixDQUFDO0FBQ2xELFFBQUEsa0JBQWtCLEdBQUcsS0FBSyxDQUFDLGtCQUFrQixDQUFDO0FBQzlDLFFBQUEsVUFBVSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUM7QUFDOUIsUUFBQSxrQkFBa0IsR0FBRyxLQUFLLENBQUMsa0JBQWtCLENBQUM7QUFDOUMsUUFBQSxrQkFBa0IsR0FBRyxLQUFLLENBQUMsa0JBQWtCLENBQUM7QUFDOUMsUUFBQSx3QkFBd0IsR0FBRyxLQUFLLENBQUMsd0JBQXdCLENBQUM7QUFDMUQsUUFBQSxXQUFXLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQztBQUNoQyxRQUFBLGFBQWEsR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBQdWx1bWkgYXBwbGljYXRpb24gZW50cnkgcG9pbnQgZm9yIHRoZSBUQVAgKFRlc3QgQXV0b21hdGlvbiBQbGF0Zm9ybSkgaW5mcmFzdHJ1Y3R1cmUuXG4gKlxuICogVGhpcyBtb2R1bGUgZGVmaW5lcyB0aGUgY29yZSBQdWx1bWkgc3RhY2sgYW5kIGluc3RhbnRpYXRlcyB0aGUgVGFwU3RhY2sgd2l0aCBhcHByb3ByaWF0ZVxuICogY29uZmlndXJhdGlvbiBiYXNlZCBvbiB0aGUgZGVwbG95bWVudCBlbnZpcm9ubWVudC4gSXQgaGFuZGxlcyBlbnZpcm9ubWVudC1zcGVjaWZpYyBzZXR0aW5ncyxcbiAqIHRhZ2dpbmcsIGFuZCBkZXBsb3ltZW50IGNvbmZpZ3VyYXRpb24gZm9yIEFXUyByZXNvdXJjZXMuXG4gKlxuICogVGhlIHN0YWNrIGNyZWF0ZWQgYnkgdGhpcyBtb2R1bGUgdXNlcyBlbnZpcm9ubWVudCBzdWZmaXhlcyB0byBkaXN0aW5ndWlzaCBiZXR3ZWVuXG4gKiBkaWZmZXJlbnQgZGVwbG95bWVudCBlbnZpcm9ubWVudHMgKGRldmVsb3BtZW50LCBzdGFnaW5nLCBwcm9kdWN0aW9uLCBldGMuKS5cbiAqL1xuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCB7IFRhcFN0YWNrIH0gZnJvbSAnLi4vbGliL3RhcC1zdGFjayc7XG5cbi8vIEluaXRpYWxpemUgUHVsdW1pIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBjdXJyZW50IHN0YWNrLlxuY29uc3QgY29uZmlnID0gbmV3IHB1bHVtaS5Db25maWcoKTtcblxuLy8gR2V0IHRoZSBlbnZpcm9ubWVudCBzdWZmaXggZnJvbSB0aGUgUHVsdW1pIGNvbmZpZywgZGVmYXVsdGluZyB0byAnZGV2Jy5cbi8vIFlvdSBjYW4gc2V0IHRoaXMgdmFsdWUgdXNpbmcgdGhlIGNvbW1hbmQ6IGBwdWx1bWkgY29uZmlnIHNldCBlbnYgPHZhbHVlPmBcbmNvbnN0IGVudmlyb25tZW50U3VmZml4ID0gcHJvY2Vzcy5lbnYuRU5WSVJPTk1FTlRfU1VGRklYIHx8ICdkZXYnO1xuXG4vLyBHZXQgbWV0YWRhdGEgZnJvbSBlbnZpcm9ubWVudCB2YXJpYWJsZXMgZm9yIHRhZ2dpbmcgcHVycG9zZXMuXG4vLyBUaGVzZSBhcmUgb2Z0ZW4gaW5qZWN0ZWQgYnkgQ0kvQ0Qgc3lzdGVtcy5cbmNvbnN0IHJlcG9zaXRvcnkgPSBjb25maWcuZ2V0KCdyZXBvc2l0b3J5JykgfHwgJ3Vua25vd24nO1xuY29uc3QgY29tbWl0QXV0aG9yID0gY29uZmlnLmdldCgnY29tbWl0QXV0aG9yJykgfHwgJ3Vua25vd24nO1xuXG4vLyBEZWZpbmUgYSBzZXQgb2YgZGVmYXVsdCB0YWdzIHRvIGFwcGx5IHRvIGFsbCByZXNvdXJjZXMuXG4vLyBXaGlsZSBub3QgZXhwbGljaXRseSB1c2VkIGluIHRoZSBUYXBTdGFjayBpbnN0YW50aWF0aW9uIGhlcmUsXG4vLyB0aGlzIGlzIHRoZSBzdGFuZGFyZCBwbGFjZSB0byBkZWZpbmUgdGhlbS4gVGhleSB3b3VsZCB0eXBpY2FsbHkgYmUgcGFzc2VkXG4vLyBpbnRvIHRoZSBUYXBTdGFjayBvciBjb25maWd1cmVkIG9uIHRoZSBBV1MgcHJvdmlkZXIuXG5jb25zdCBkZWZhdWx0VGFncyA9IHtcbiAgRW52aXJvbm1lbnQ6IGVudmlyb25tZW50U3VmZml4LFxuICBSZXBvc2l0b3J5OiByZXBvc2l0b3J5LFxuICBBdXRob3I6IGNvbW1pdEF1dGhvcixcbn07XG5cbi8vIEluc3RhbnRpYXRlIHRoZSBtYWluIHN0YWNrIGNvbXBvbmVudCBmb3IgdGhlIGluZnJhc3RydWN0dXJlLlxuLy8gVGhpcyBlbmNhcHN1bGF0ZXMgYWxsIHRoZSByZXNvdXJjZXMgZm9yIHRoZSBwbGF0Zm9ybS5cbmNvbnN0IHN0YWNrID0gbmV3IFRhcFN0YWNrKCdwdWx1bWktaW5mcmEnLCB7XG4gIGVudmlyb25tZW50U3VmZml4OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgdGFnczogZGVmYXVsdFRhZ3MsXG59KTtcblxuLy8gVG8gdXNlIHRoZSBzdGFjayBvdXRwdXRzLCB5b3UgY2FuIGV4cG9ydCB0aGVtLlxuLy8gRm9yIGV4YW1wbGUsIGlmIFRhcFN0YWNrIGhhZCBhbiBvdXRwdXQgYGJ1Y2tldE5hbWVgOlxuLy8gZXhwb3J0IGNvbnN0IGJ1Y2tldE5hbWUgPSBzdGFjay5idWNrZXROYW1lO1xuZXhwb3J0IGNvbnN0IHZwY0lkID0gc3RhY2sudnBjSWQ7XG5leHBvcnQgY29uc3QgcHVibGljU3VibmV0SWRzID0gc3RhY2sucHVibGljU3VibmV0SWRzO1xuZXhwb3J0IGNvbnN0IHByaXZhdGVTdWJuZXRJZHMgPSBzdGFjay5wcml2YXRlU3VibmV0SWRzO1xuZXhwb3J0IGNvbnN0IGFsYkRuc05hbWUgPSBzdGFjay5hbGJEbnNOYW1lO1xuZXhwb3J0IGNvbnN0IGFsYlpvbmVJZCA9IHN0YWNrLmFsYlpvbmVJZDtcbmV4cG9ydCBjb25zdCBjbG91ZEZyb250RG9tYWluTmFtZSA9IHN0YWNrLmNsb3VkRnJvbnREb21haW5OYW1lO1xuZXhwb3J0IGNvbnN0IGR5bmFtb1RhYmxlTmFtZSA9IHN0YWNrLmR5bmFtb1RhYmxlTmFtZTtcbmV4cG9ydCBjb25zdCBzZWNyZXRBcm4gPSBzdGFjay5zZWNyZXRBcm47XG5leHBvcnQgY29uc3Qga21zS2V5SWQgPSBzdGFjay5rbXNLZXlJZDtcbmV4cG9ydCBjb25zdCBrbXNLZXlBcm4gPSBzdGFjay5rbXNLZXlBcm47XG5leHBvcnQgY29uc3Qgd2ViQWNsQXJuID0gc3RhY2sud2ViQWNsQXJuO1xuZXhwb3J0IGNvbnN0IGxvZ0dyb3VwTmFtZSA9IHN0YWNrLmxvZ0dyb3VwTmFtZTtcbmV4cG9ydCBjb25zdCBhbGJBcm4gPSBzdGFjay5hbGJBcm47XG5leHBvcnQgY29uc3QgdGFyZ2V0R3JvdXBBcm4gPSBzdGFjay50YXJnZXRHcm91cEFybjtcbmV4cG9ydCBjb25zdCBhdXRvU2NhbGluZ0dyb3VwTmFtZSA9IHN0YWNrLmF1dG9TY2FsaW5nR3JvdXBOYW1lO1xuZXhwb3J0IGNvbnN0IGxhdW5jaFRlbXBsYXRlTmFtZSA9IHN0YWNrLmxhdW5jaFRlbXBsYXRlTmFtZTtcbmV4cG9ydCBjb25zdCBlYzJSb2xlQXJuID0gc3RhY2suZWMyUm9sZUFybjtcbmV4cG9ydCBjb25zdCBhbGJTZWN1cml0eUdyb3VwSWQgPSBzdGFjay5hbGJTZWN1cml0eUdyb3VwSWQ7XG5leHBvcnQgY29uc3QgZWMyU2VjdXJpdHlHcm91cElkID0gc3RhY2suZWMyU2VjdXJpdHlHcm91cElkO1xuZXhwb3J0IGNvbnN0IGNsb3VkRnJvbnREaXN0cmlidXRpb25JZCA9IHN0YWNrLmNsb3VkRnJvbnREaXN0cmlidXRpb25JZDtcbmV4cG9ydCBjb25zdCBlbnZpcm9ubWVudCA9IHN0YWNrLmVudmlyb25tZW50O1xuZXhwb3J0IGNvbnN0IHNhbml0aXplZE5hbWUgPSBzdGFjay5zYW5pdGl6ZWROYW1lO1xuIl19