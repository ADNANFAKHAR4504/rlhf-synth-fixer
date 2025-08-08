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
exports.rolePolicyName = exports.rolePolicyId = exports.bucketPublicAccessBlockId = exports.bucketEncryptionId = exports.bucketVersioningId = exports.eventTargetId = exports.eventRuleName = exports.eventRuleArn = exports.logGroupName = exports.logGroupArn = exports.metricAlarmName = exports.metricAlarmArn = exports.rolePath = exports.roleId = exports.roleName = exports.roleArn = exports.kmsKeyAlias = exports.kmsKeyId = exports.kmsKeyArn = exports.bucketRegionalDomainName = exports.bucketDomainName = exports.bucketId = exports.bucketName = exports.bucketArn = void 0;
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
// Get the environment suffix from the Pulumi config, defaulting to 'development'.
// You can set this value using the command: `pulumi config set env <value>`
const environmentSuffix = config.get('env') || 'development';
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
// Export stack outputs for integration testing and external access
exports.bucketArn = stack.bucketArn;
exports.bucketName = stack.bucketName;
exports.bucketId = stack.bucketId;
exports.bucketDomainName = stack.bucketDomainName;
exports.bucketRegionalDomainName = stack.bucketRegionalDomainName;
exports.kmsKeyArn = stack.kmsKeyArn;
exports.kmsKeyId = stack.kmsKeyId;
exports.kmsKeyAlias = stack.kmsKeyAlias;
exports.roleArn = stack.roleArn;
exports.roleName = stack.roleName;
exports.roleId = stack.roleId;
exports.rolePath = stack.rolePath;
exports.metricAlarmArn = stack.metricAlarmArn;
exports.metricAlarmName = stack.metricAlarmName;
exports.logGroupArn = stack.logGroupArn;
exports.logGroupName = stack.logGroupName;
exports.eventRuleArn = stack.eventRuleArn;
exports.eventRuleName = stack.eventRuleName;
exports.eventTargetId = stack.eventTargetId;
exports.bucketVersioningId = stack.bucketVersioningId;
exports.bucketEncryptionId = stack.bucketEncryptionId;
exports.bucketPublicAccessBlockId = stack.bucketPublicAccessBlockId;
exports.rolePolicyId = stack.rolePolicyId;
exports.rolePolicyName = stack.rolePolicyName;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7R0FTRztBQUNILHVEQUF5QztBQUN6QyxnREFBNEM7QUFFNUMseURBQXlEO0FBQ3pELE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBRW5DLGtGQUFrRjtBQUNsRiw0RUFBNEU7QUFDNUUsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLGFBQWEsQ0FBQztBQUU3RCxnRUFBZ0U7QUFDaEUsNkNBQTZDO0FBQzdDLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLElBQUksU0FBUyxDQUFDO0FBQ3pELE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLElBQUksU0FBUyxDQUFDO0FBRTdELDBEQUEwRDtBQUMxRCxnRUFBZ0U7QUFDaEUsNEVBQTRFO0FBQzVFLHVEQUF1RDtBQUN2RCxNQUFNLFdBQVcsR0FBRztJQUNsQixXQUFXLEVBQUUsaUJBQWlCO0lBQzlCLFVBQVUsRUFBRSxVQUFVO0lBQ3RCLE1BQU0sRUFBRSxZQUFZO0NBQ3JCLENBQUM7QUFFRiwrREFBK0Q7QUFDL0Qsd0RBQXdEO0FBQ3hELE1BQU0sS0FBSyxHQUFHLElBQUksb0JBQVEsQ0FBQyxjQUFjLEVBQUU7SUFDekMsaUJBQWlCLEVBQUUsaUJBQWlCO0lBQ3BDLElBQUksRUFBRSxXQUFXO0NBQ2xCLENBQUMsQ0FBQztBQUVILG1FQUFtRTtBQUN0RCxRQUFBLFNBQVMsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDO0FBQzVCLFFBQUEsVUFBVSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUM7QUFDOUIsUUFBQSxRQUFRLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQztBQUMxQixRQUFBLGdCQUFnQixHQUFHLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQztBQUMxQyxRQUFBLHdCQUF3QixHQUFHLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQztBQUMxRCxRQUFBLFNBQVMsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDO0FBQzVCLFFBQUEsUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUM7QUFDMUIsUUFBQSxXQUFXLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQztBQUNoQyxRQUFBLE9BQU8sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDO0FBQ3hCLFFBQUEsUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUM7QUFDMUIsUUFBQSxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztBQUN0QixRQUFBLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDO0FBQzFCLFFBQUEsY0FBYyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUM7QUFDdEMsUUFBQSxlQUFlLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQztBQUN4QyxRQUFBLFdBQVcsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDO0FBQ2hDLFFBQUEsWUFBWSxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUM7QUFDbEMsUUFBQSxZQUFZLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQztBQUNsQyxRQUFBLGFBQWEsR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDO0FBQ3BDLFFBQUEsYUFBYSxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUM7QUFDcEMsUUFBQSxrQkFBa0IsR0FBRyxLQUFLLENBQUMsa0JBQWtCLENBQUM7QUFDOUMsUUFBQSxrQkFBa0IsR0FBRyxLQUFLLENBQUMsa0JBQWtCLENBQUM7QUFDOUMsUUFBQSx5QkFBeUIsR0FBRyxLQUFLLENBQUMseUJBQXlCLENBQUM7QUFDNUQsUUFBQSxZQUFZLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQztBQUNsQyxRQUFBLGNBQWMsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBQdWx1bWkgYXBwbGljYXRpb24gZW50cnkgcG9pbnQgZm9yIHRoZSBUQVAgKFRlc3QgQXV0b21hdGlvbiBQbGF0Zm9ybSkgaW5mcmFzdHJ1Y3R1cmUuXG4gKlxuICogVGhpcyBtb2R1bGUgZGVmaW5lcyB0aGUgY29yZSBQdWx1bWkgc3RhY2sgYW5kIGluc3RhbnRpYXRlcyB0aGUgVGFwU3RhY2sgd2l0aCBhcHByb3ByaWF0ZVxuICogY29uZmlndXJhdGlvbiBiYXNlZCBvbiB0aGUgZGVwbG95bWVudCBlbnZpcm9ubWVudC4gSXQgaGFuZGxlcyBlbnZpcm9ubWVudC1zcGVjaWZpYyBzZXR0aW5ncyxcbiAqIHRhZ2dpbmcsIGFuZCBkZXBsb3ltZW50IGNvbmZpZ3VyYXRpb24gZm9yIEFXUyByZXNvdXJjZXMuXG4gKlxuICogVGhlIHN0YWNrIGNyZWF0ZWQgYnkgdGhpcyBtb2R1bGUgdXNlcyBlbnZpcm9ubWVudCBzdWZmaXhlcyB0byBkaXN0aW5ndWlzaCBiZXR3ZWVuXG4gKiBkaWZmZXJlbnQgZGVwbG95bWVudCBlbnZpcm9ubWVudHMgKGRldmVsb3BtZW50LCBzdGFnaW5nLCBwcm9kdWN0aW9uLCBldGMuKS5cbiAqL1xuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCB7IFRhcFN0YWNrIH0gZnJvbSAnLi4vbGliL3RhcC1zdGFjayc7XG5cbi8vIEluaXRpYWxpemUgUHVsdW1pIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBjdXJyZW50IHN0YWNrLlxuY29uc3QgY29uZmlnID0gbmV3IHB1bHVtaS5Db25maWcoKTtcblxuLy8gR2V0IHRoZSBlbnZpcm9ubWVudCBzdWZmaXggZnJvbSB0aGUgUHVsdW1pIGNvbmZpZywgZGVmYXVsdGluZyB0byAnZGV2ZWxvcG1lbnQnLlxuLy8gWW91IGNhbiBzZXQgdGhpcyB2YWx1ZSB1c2luZyB0aGUgY29tbWFuZDogYHB1bHVtaSBjb25maWcgc2V0IGVudiA8dmFsdWU+YFxuY29uc3QgZW52aXJvbm1lbnRTdWZmaXggPSBjb25maWcuZ2V0KCdlbnYnKSB8fCAnZGV2ZWxvcG1lbnQnO1xuXG4vLyBHZXQgbWV0YWRhdGEgZnJvbSBlbnZpcm9ubWVudCB2YXJpYWJsZXMgZm9yIHRhZ2dpbmcgcHVycG9zZXMuXG4vLyBUaGVzZSBhcmUgb2Z0ZW4gaW5qZWN0ZWQgYnkgQ0kvQ0Qgc3lzdGVtcy5cbmNvbnN0IHJlcG9zaXRvcnkgPSBjb25maWcuZ2V0KCdyZXBvc2l0b3J5JykgfHwgJ3Vua25vd24nO1xuY29uc3QgY29tbWl0QXV0aG9yID0gY29uZmlnLmdldCgnY29tbWl0QXV0aG9yJykgfHwgJ3Vua25vd24nO1xuXG4vLyBEZWZpbmUgYSBzZXQgb2YgZGVmYXVsdCB0YWdzIHRvIGFwcGx5IHRvIGFsbCByZXNvdXJjZXMuXG4vLyBXaGlsZSBub3QgZXhwbGljaXRseSB1c2VkIGluIHRoZSBUYXBTdGFjayBpbnN0YW50aWF0aW9uIGhlcmUsXG4vLyB0aGlzIGlzIHRoZSBzdGFuZGFyZCBwbGFjZSB0byBkZWZpbmUgdGhlbS4gVGhleSB3b3VsZCB0eXBpY2FsbHkgYmUgcGFzc2VkXG4vLyBpbnRvIHRoZSBUYXBTdGFjayBvciBjb25maWd1cmVkIG9uIHRoZSBBV1MgcHJvdmlkZXIuXG5jb25zdCBkZWZhdWx0VGFncyA9IHtcbiAgRW52aXJvbm1lbnQ6IGVudmlyb25tZW50U3VmZml4LFxuICBSZXBvc2l0b3J5OiByZXBvc2l0b3J5LFxuICBBdXRob3I6IGNvbW1pdEF1dGhvcixcbn07XG5cbi8vIEluc3RhbnRpYXRlIHRoZSBtYWluIHN0YWNrIGNvbXBvbmVudCBmb3IgdGhlIGluZnJhc3RydWN0dXJlLlxuLy8gVGhpcyBlbmNhcHN1bGF0ZXMgYWxsIHRoZSByZXNvdXJjZXMgZm9yIHRoZSBwbGF0Zm9ybS5cbmNvbnN0IHN0YWNrID0gbmV3IFRhcFN0YWNrKCdwdWx1bWktaW5mcmEnLCB7XG4gIGVudmlyb25tZW50U3VmZml4OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgdGFnczogZGVmYXVsdFRhZ3MsXG59KTtcblxuLy8gRXhwb3J0IHN0YWNrIG91dHB1dHMgZm9yIGludGVncmF0aW9uIHRlc3RpbmcgYW5kIGV4dGVybmFsIGFjY2Vzc1xuZXhwb3J0IGNvbnN0IGJ1Y2tldEFybiA9IHN0YWNrLmJ1Y2tldEFybjtcbmV4cG9ydCBjb25zdCBidWNrZXROYW1lID0gc3RhY2suYnVja2V0TmFtZTtcbmV4cG9ydCBjb25zdCBidWNrZXRJZCA9IHN0YWNrLmJ1Y2tldElkO1xuZXhwb3J0IGNvbnN0IGJ1Y2tldERvbWFpbk5hbWUgPSBzdGFjay5idWNrZXREb21haW5OYW1lO1xuZXhwb3J0IGNvbnN0IGJ1Y2tldFJlZ2lvbmFsRG9tYWluTmFtZSA9IHN0YWNrLmJ1Y2tldFJlZ2lvbmFsRG9tYWluTmFtZTtcbmV4cG9ydCBjb25zdCBrbXNLZXlBcm4gPSBzdGFjay5rbXNLZXlBcm47XG5leHBvcnQgY29uc3Qga21zS2V5SWQgPSBzdGFjay5rbXNLZXlJZDtcbmV4cG9ydCBjb25zdCBrbXNLZXlBbGlhcyA9IHN0YWNrLmttc0tleUFsaWFzO1xuZXhwb3J0IGNvbnN0IHJvbGVBcm4gPSBzdGFjay5yb2xlQXJuO1xuZXhwb3J0IGNvbnN0IHJvbGVOYW1lID0gc3RhY2sucm9sZU5hbWU7XG5leHBvcnQgY29uc3Qgcm9sZUlkID0gc3RhY2sucm9sZUlkO1xuZXhwb3J0IGNvbnN0IHJvbGVQYXRoID0gc3RhY2sucm9sZVBhdGg7XG5leHBvcnQgY29uc3QgbWV0cmljQWxhcm1Bcm4gPSBzdGFjay5tZXRyaWNBbGFybUFybjtcbmV4cG9ydCBjb25zdCBtZXRyaWNBbGFybU5hbWUgPSBzdGFjay5tZXRyaWNBbGFybU5hbWU7XG5leHBvcnQgY29uc3QgbG9nR3JvdXBBcm4gPSBzdGFjay5sb2dHcm91cEFybjtcbmV4cG9ydCBjb25zdCBsb2dHcm91cE5hbWUgPSBzdGFjay5sb2dHcm91cE5hbWU7XG5leHBvcnQgY29uc3QgZXZlbnRSdWxlQXJuID0gc3RhY2suZXZlbnRSdWxlQXJuO1xuZXhwb3J0IGNvbnN0IGV2ZW50UnVsZU5hbWUgPSBzdGFjay5ldmVudFJ1bGVOYW1lO1xuZXhwb3J0IGNvbnN0IGV2ZW50VGFyZ2V0SWQgPSBzdGFjay5ldmVudFRhcmdldElkO1xuZXhwb3J0IGNvbnN0IGJ1Y2tldFZlcnNpb25pbmdJZCA9IHN0YWNrLmJ1Y2tldFZlcnNpb25pbmdJZDtcbmV4cG9ydCBjb25zdCBidWNrZXRFbmNyeXB0aW9uSWQgPSBzdGFjay5idWNrZXRFbmNyeXB0aW9uSWQ7XG5leHBvcnQgY29uc3QgYnVja2V0UHVibGljQWNjZXNzQmxvY2tJZCA9IHN0YWNrLmJ1Y2tldFB1YmxpY0FjY2Vzc0Jsb2NrSWQ7XG5leHBvcnQgY29uc3Qgcm9sZVBvbGljeUlkID0gc3RhY2sucm9sZVBvbGljeUlkO1xuZXhwb3J0IGNvbnN0IHJvbGVQb2xpY3lOYW1lID0gc3RhY2sucm9sZVBvbGljeU5hbWU7XG4iXX0=