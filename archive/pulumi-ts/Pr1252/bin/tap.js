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
exports.systemLogGroupName = exports.instanceProfileName = exports.ec2RoleArn = exports.privateSubnet2Id = exports.privateSubnet1Id = exports.publicSubnet2Id = exports.publicSubnet1Id = exports.rdsSecurityGroupId = exports.ec2SecurityGroupId = exports.albSecurityGroupId = exports.targetGroupArn = exports.autoScalingGroupName = exports.cacheEndpoint = exports.vpcId = exports.databaseEndpoint = exports.bucketName = exports.loadBalancerDns = void 0;
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
// Get the environment suffix from environment variable first, then Pulumi config, defaulting to 'dev'.
// This allows CI/CD to override using ENVIRONMENT_SUFFIX env var
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';
// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = process.env.REPOSITORY || config.get('repository') || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || config.get('commitAuthor') || 'unknown';
// Define a set of default tags to apply to all resources.
const defaultTags = {
    Environment: environmentSuffix,
    Repository: repository,
    Author: commitAuthor,
    ManagedBy: 'Pulumi',
    Project: 'WebApp',
};
// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const stack = new tap_stack_1.TapStack('TapStack', {
    environmentSuffix: environmentSuffix,
    tags: defaultTags,
});
// Export stack outputs for easy access
exports.loadBalancerDns = stack.loadBalancerDns;
exports.bucketName = stack.bucketName;
exports.databaseEndpoint = stack.databaseEndpoint;
exports.vpcId = stack.vpcId;
exports.cacheEndpoint = stack.cacheEndpoint;
exports.autoScalingGroupName = stack.autoScalingGroupName;
exports.targetGroupArn = stack.targetGroupArn;
exports.albSecurityGroupId = stack.albSecurityGroupId;
exports.ec2SecurityGroupId = stack.ec2SecurityGroupId;
exports.rdsSecurityGroupId = stack.rdsSecurityGroupId;
exports.publicSubnet1Id = stack.publicSubnet1Id;
exports.publicSubnet2Id = stack.publicSubnet2Id;
exports.privateSubnet1Id = stack.privateSubnet1Id;
exports.privateSubnet2Id = stack.privateSubnet2Id;
exports.ec2RoleArn = stack.ec2RoleArn;
exports.instanceProfileName = stack.instanceProfileName;
exports.systemLogGroupName = stack.systemLogGroupName;
// To use the stack outputs, you can export them.
// For example, if TapStack had an output `bucketName`:
// export const bucketName = stack.bucketName;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7R0FTRztBQUNILHVEQUF5QztBQUN6QyxnREFBNEM7QUFFNUMseURBQXlEO0FBQ3pELE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBRW5DLHVHQUF1RztBQUN2RyxpRUFBaUU7QUFDakUsTUFBTSxpQkFBaUIsR0FDckIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQztBQUUvRCxnRUFBZ0U7QUFDaEUsNkNBQTZDO0FBQzdDLE1BQU0sVUFBVSxHQUNkLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLElBQUksU0FBUyxDQUFDO0FBQ2xFLE1BQU0sWUFBWSxHQUNoQixPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxJQUFJLFNBQVMsQ0FBQztBQUV2RSwwREFBMEQ7QUFDMUQsTUFBTSxXQUFXLEdBQUc7SUFDbEIsV0FBVyxFQUFFLGlCQUFpQjtJQUM5QixVQUFVLEVBQUUsVUFBVTtJQUN0QixNQUFNLEVBQUUsWUFBWTtJQUNwQixTQUFTLEVBQUUsUUFBUTtJQUNuQixPQUFPLEVBQUUsUUFBUTtDQUNsQixDQUFDO0FBRUYsK0RBQStEO0FBQy9ELHdEQUF3RDtBQUN4RCxNQUFNLEtBQUssR0FBRyxJQUFJLG9CQUFRLENBQUMsVUFBVSxFQUFFO0lBQ3JDLGlCQUFpQixFQUFFLGlCQUFpQjtJQUNwQyxJQUFJLEVBQUUsV0FBVztDQUNsQixDQUFDLENBQUM7QUFFSCx1Q0FBdUM7QUFDMUIsUUFBQSxlQUFlLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQztBQUN4QyxRQUFBLFVBQVUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDO0FBQzlCLFFBQUEsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDLGdCQUFnQixDQUFDO0FBQzFDLFFBQUEsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7QUFDcEIsUUFBQSxhQUFhLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQztBQUNwQyxRQUFBLG9CQUFvQixHQUFHLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQztBQUNsRCxRQUFBLGNBQWMsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDO0FBQ3RDLFFBQUEsa0JBQWtCLEdBQUcsS0FBSyxDQUFDLGtCQUFrQixDQUFDO0FBQzlDLFFBQUEsa0JBQWtCLEdBQUcsS0FBSyxDQUFDLGtCQUFrQixDQUFDO0FBQzlDLFFBQUEsa0JBQWtCLEdBQUcsS0FBSyxDQUFDLGtCQUFrQixDQUFDO0FBQzlDLFFBQUEsZUFBZSxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUM7QUFDeEMsUUFBQSxlQUFlLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQztBQUN4QyxRQUFBLGdCQUFnQixHQUFHLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQztBQUMxQyxRQUFBLGdCQUFnQixHQUFHLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQztBQUMxQyxRQUFBLFVBQVUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDO0FBQzlCLFFBQUEsbUJBQW1CLEdBQUcsS0FBSyxDQUFDLG1CQUFtQixDQUFDO0FBQ2hELFFBQUEsa0JBQWtCLEdBQUcsS0FBSyxDQUFDLGtCQUFrQixDQUFDO0FBRTNELGlEQUFpRDtBQUNqRCx1REFBdUQ7QUFDdkQsOENBQThDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBQdWx1bWkgYXBwbGljYXRpb24gZW50cnkgcG9pbnQgZm9yIHRoZSBUQVAgKFRlc3QgQXV0b21hdGlvbiBQbGF0Zm9ybSkgaW5mcmFzdHJ1Y3R1cmUuXG4gKlxuICogVGhpcyBtb2R1bGUgZGVmaW5lcyB0aGUgY29yZSBQdWx1bWkgc3RhY2sgYW5kIGluc3RhbnRpYXRlcyB0aGUgVGFwU3RhY2sgd2l0aCBhcHByb3ByaWF0ZVxuICogY29uZmlndXJhdGlvbiBiYXNlZCBvbiB0aGUgZGVwbG95bWVudCBlbnZpcm9ubWVudC4gSXQgaGFuZGxlcyBlbnZpcm9ubWVudC1zcGVjaWZpYyBzZXR0aW5ncyxcbiAqIHRhZ2dpbmcsIGFuZCBkZXBsb3ltZW50IGNvbmZpZ3VyYXRpb24gZm9yIEFXUyByZXNvdXJjZXMuXG4gKlxuICogVGhlIHN0YWNrIGNyZWF0ZWQgYnkgdGhpcyBtb2R1bGUgdXNlcyBlbnZpcm9ubWVudCBzdWZmaXhlcyB0byBkaXN0aW5ndWlzaCBiZXR3ZWVuXG4gKiBkaWZmZXJlbnQgZGVwbG95bWVudCBlbnZpcm9ubWVudHMgKGRldmVsb3BtZW50LCBzdGFnaW5nLCBwcm9kdWN0aW9uLCBldGMuKS5cbiAqL1xuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCB7IFRhcFN0YWNrIH0gZnJvbSAnLi4vbGliL3RhcC1zdGFjayc7XG5cbi8vIEluaXRpYWxpemUgUHVsdW1pIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBjdXJyZW50IHN0YWNrLlxuY29uc3QgY29uZmlnID0gbmV3IHB1bHVtaS5Db25maWcoKTtcblxuLy8gR2V0IHRoZSBlbnZpcm9ubWVudCBzdWZmaXggZnJvbSBlbnZpcm9ubWVudCB2YXJpYWJsZSBmaXJzdCwgdGhlbiBQdWx1bWkgY29uZmlnLCBkZWZhdWx0aW5nIHRvICdkZXYnLlxuLy8gVGhpcyBhbGxvd3MgQ0kvQ0QgdG8gb3ZlcnJpZGUgdXNpbmcgRU5WSVJPTk1FTlRfU1VGRklYIGVudiB2YXJcbmNvbnN0IGVudmlyb25tZW50U3VmZml4ID1cbiAgcHJvY2Vzcy5lbnYuRU5WSVJPTk1FTlRfU1VGRklYIHx8IGNvbmZpZy5nZXQoJ2VudicpIHx8ICdkZXYnO1xuXG4vLyBHZXQgbWV0YWRhdGEgZnJvbSBlbnZpcm9ubWVudCB2YXJpYWJsZXMgZm9yIHRhZ2dpbmcgcHVycG9zZXMuXG4vLyBUaGVzZSBhcmUgb2Z0ZW4gaW5qZWN0ZWQgYnkgQ0kvQ0Qgc3lzdGVtcy5cbmNvbnN0IHJlcG9zaXRvcnkgPVxuICBwcm9jZXNzLmVudi5SRVBPU0lUT1JZIHx8IGNvbmZpZy5nZXQoJ3JlcG9zaXRvcnknKSB8fCAndW5rbm93bic7XG5jb25zdCBjb21taXRBdXRob3IgPVxuICBwcm9jZXNzLmVudi5DT01NSVRfQVVUSE9SIHx8IGNvbmZpZy5nZXQoJ2NvbW1pdEF1dGhvcicpIHx8ICd1bmtub3duJztcblxuLy8gRGVmaW5lIGEgc2V0IG9mIGRlZmF1bHQgdGFncyB0byBhcHBseSB0byBhbGwgcmVzb3VyY2VzLlxuY29uc3QgZGVmYXVsdFRhZ3MgPSB7XG4gIEVudmlyb25tZW50OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgUmVwb3NpdG9yeTogcmVwb3NpdG9yeSxcbiAgQXV0aG9yOiBjb21taXRBdXRob3IsXG4gIE1hbmFnZWRCeTogJ1B1bHVtaScsXG4gIFByb2plY3Q6ICdXZWJBcHAnLFxufTtcblxuLy8gSW5zdGFudGlhdGUgdGhlIG1haW4gc3RhY2sgY29tcG9uZW50IGZvciB0aGUgaW5mcmFzdHJ1Y3R1cmUuXG4vLyBUaGlzIGVuY2Fwc3VsYXRlcyBhbGwgdGhlIHJlc291cmNlcyBmb3IgdGhlIHBsYXRmb3JtLlxuY29uc3Qgc3RhY2sgPSBuZXcgVGFwU3RhY2soJ1RhcFN0YWNrJywge1xuICBlbnZpcm9ubWVudFN1ZmZpeDogZW52aXJvbm1lbnRTdWZmaXgsXG4gIHRhZ3M6IGRlZmF1bHRUYWdzLFxufSk7XG5cbi8vIEV4cG9ydCBzdGFjayBvdXRwdXRzIGZvciBlYXN5IGFjY2Vzc1xuZXhwb3J0IGNvbnN0IGxvYWRCYWxhbmNlckRucyA9IHN0YWNrLmxvYWRCYWxhbmNlckRucztcbmV4cG9ydCBjb25zdCBidWNrZXROYW1lID0gc3RhY2suYnVja2V0TmFtZTtcbmV4cG9ydCBjb25zdCBkYXRhYmFzZUVuZHBvaW50ID0gc3RhY2suZGF0YWJhc2VFbmRwb2ludDtcbmV4cG9ydCBjb25zdCB2cGNJZCA9IHN0YWNrLnZwY0lkO1xuZXhwb3J0IGNvbnN0IGNhY2hlRW5kcG9pbnQgPSBzdGFjay5jYWNoZUVuZHBvaW50O1xuZXhwb3J0IGNvbnN0IGF1dG9TY2FsaW5nR3JvdXBOYW1lID0gc3RhY2suYXV0b1NjYWxpbmdHcm91cE5hbWU7XG5leHBvcnQgY29uc3QgdGFyZ2V0R3JvdXBBcm4gPSBzdGFjay50YXJnZXRHcm91cEFybjtcbmV4cG9ydCBjb25zdCBhbGJTZWN1cml0eUdyb3VwSWQgPSBzdGFjay5hbGJTZWN1cml0eUdyb3VwSWQ7XG5leHBvcnQgY29uc3QgZWMyU2VjdXJpdHlHcm91cElkID0gc3RhY2suZWMyU2VjdXJpdHlHcm91cElkO1xuZXhwb3J0IGNvbnN0IHJkc1NlY3VyaXR5R3JvdXBJZCA9IHN0YWNrLnJkc1NlY3VyaXR5R3JvdXBJZDtcbmV4cG9ydCBjb25zdCBwdWJsaWNTdWJuZXQxSWQgPSBzdGFjay5wdWJsaWNTdWJuZXQxSWQ7XG5leHBvcnQgY29uc3QgcHVibGljU3VibmV0MklkID0gc3RhY2sucHVibGljU3VibmV0MklkO1xuZXhwb3J0IGNvbnN0IHByaXZhdGVTdWJuZXQxSWQgPSBzdGFjay5wcml2YXRlU3VibmV0MUlkO1xuZXhwb3J0IGNvbnN0IHByaXZhdGVTdWJuZXQySWQgPSBzdGFjay5wcml2YXRlU3VibmV0MklkO1xuZXhwb3J0IGNvbnN0IGVjMlJvbGVBcm4gPSBzdGFjay5lYzJSb2xlQXJuO1xuZXhwb3J0IGNvbnN0IGluc3RhbmNlUHJvZmlsZU5hbWUgPSBzdGFjay5pbnN0YW5jZVByb2ZpbGVOYW1lO1xuZXhwb3J0IGNvbnN0IHN5c3RlbUxvZ0dyb3VwTmFtZSA9IHN0YWNrLnN5c3RlbUxvZ0dyb3VwTmFtZTtcblxuLy8gVG8gdXNlIHRoZSBzdGFjayBvdXRwdXRzLCB5b3UgY2FuIGV4cG9ydCB0aGVtLlxuLy8gRm9yIGV4YW1wbGUsIGlmIFRhcFN0YWNrIGhhZCBhbiBvdXRwdXQgYGJ1Y2tldE5hbWVgOlxuLy8gZXhwb3J0IGNvbnN0IGJ1Y2tldE5hbWUgPSBzdGFjay5idWNrZXROYW1lO1xuIl19