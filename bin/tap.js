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
exports.ec2RoleName = exports.ec2InstanceProfileName = exports.rdsKmsKeyAlias = exports.mainKmsKeyAlias = exports.stackEnvironmentSuffix = exports.webInstancePrivateIp = exports.webInstanceId = exports.dbSubnetGroupName = exports.databaseEndpoint = exports.logsBucketName = exports.dataBucketName = exports.vpcId = void 0;
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
const environmentSuffix = config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';
// Get configuration values with defaults
const vpcCidr = config.get('vpcCidr') || '10.0.0.0/16';
const instanceType = config.get('instanceType') || 't3.micro';
const dbInstanceClass = config.get('dbInstanceClass') || 'db.t3.micro';
const enableKeyPairs = config.getBoolean('enableKeyPairs') || false;
// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = config.get('repository') || process.env.REPOSITORY || 'tap-infrastructure';
const commitAuthor = config.get('commitAuthor') || process.env.COMMIT_AUTHOR || 'unknown';
// Define a set of default tags to apply to all resources.
const defaultTags = {
    Environment: environmentSuffix,
    Repository: repository,
    Author: commitAuthor,
    Project: 'TAP',
    Owner: 'tap-team',
};
// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const tapStack = new tap_stack_1.TapStack('tap-infrastructure', {
    environmentSuffix,
    vpcCidr,
    instanceType,
    dbInstanceClass,
    enableKeyPairs,
    tags: defaultTags,
});
// Export stack outputs for integration testing and external access
exports.vpcId = tapStack.vpcId;
exports.dataBucketName = tapStack.dataBucketName;
exports.logsBucketName = tapStack.logsBucketName;
exports.databaseEndpoint = tapStack.databaseEndpoint;
exports.dbSubnetGroupName = tapStack.dbSubnetGroupName;
exports.webInstanceId = tapStack.webInstanceId;
exports.webInstancePrivateIp = tapStack.webInstancePrivateIp;
exports.stackEnvironmentSuffix = tapStack.environmentSuffix;
exports.mainKmsKeyAlias = tapStack.mainKmsKeyAlias;
exports.rdsKmsKeyAlias = tapStack.rdsKmsKeyAlias;
exports.ec2InstanceProfileName = tapStack.ec2InstanceProfileName;
exports.ec2RoleName = tapStack.ec2RoleName;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7R0FTRztBQUNILHVEQUF5QztBQUN6QyxnREFBNEM7QUFFNUMseURBQXlEO0FBQ3pELE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBRW5DLDBFQUEwRTtBQUMxRSw0RUFBNEU7QUFDNUUsTUFBTSxpQkFBaUIsR0FDckIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLElBQUksS0FBSyxDQUFDO0FBRTdFLHlDQUF5QztBQUN6QyxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLGFBQWEsQ0FBQztBQUN2RCxNQUFNLFlBQVksR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxJQUFJLFVBQVUsQ0FBQztBQUM5RCxNQUFNLGVBQWUsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLElBQUksYUFBYSxDQUFDO0FBQ3ZFLE1BQU0sY0FBYyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxLQUFLLENBQUM7QUFFcEUsZ0VBQWdFO0FBQ2hFLDZDQUE2QztBQUM3QyxNQUFNLFVBQVUsR0FDZCxNQUFNLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLG9CQUFvQixDQUFDO0FBQzdFLE1BQU0sWUFBWSxHQUNoQixNQUFNLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxJQUFJLFNBQVMsQ0FBQztBQUV2RSwwREFBMEQ7QUFDMUQsTUFBTSxXQUFXLEdBQUc7SUFDbEIsV0FBVyxFQUFFLGlCQUFpQjtJQUM5QixVQUFVLEVBQUUsVUFBVTtJQUN0QixNQUFNLEVBQUUsWUFBWTtJQUNwQixPQUFPLEVBQUUsS0FBSztJQUNkLEtBQUssRUFBRSxVQUFVO0NBQ2xCLENBQUM7QUFFRiwrREFBK0Q7QUFDL0Qsd0RBQXdEO0FBQ3hELE1BQU0sUUFBUSxHQUFHLElBQUksb0JBQVEsQ0FBQyxvQkFBb0IsRUFBRTtJQUNsRCxpQkFBaUI7SUFDakIsT0FBTztJQUNQLFlBQVk7SUFDWixlQUFlO0lBQ2YsY0FBYztJQUNkLElBQUksRUFBRSxXQUFXO0NBQ2xCLENBQUMsQ0FBQztBQUVILG1FQUFtRTtBQUN0RCxRQUFBLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDO0FBQ3ZCLFFBQUEsY0FBYyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUM7QUFDekMsUUFBQSxjQUFjLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQztBQUN6QyxRQUFBLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQztBQUM3QyxRQUFBLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQztBQUMvQyxRQUFBLGFBQWEsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDO0FBQ3ZDLFFBQUEsb0JBQW9CLEdBQUcsUUFBUSxDQUFDLG9CQUFvQixDQUFDO0FBQ3JELFFBQUEsc0JBQXNCLEdBQUcsUUFBUSxDQUFDLGlCQUFpQixDQUFDO0FBQ3BELFFBQUEsZUFBZSxHQUFHLFFBQVEsQ0FBQyxlQUFlLENBQUM7QUFDM0MsUUFBQSxjQUFjLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQztBQUN6QyxRQUFBLHNCQUFzQixHQUFHLFFBQVEsQ0FBQyxzQkFBc0IsQ0FBQztBQUN6RCxRQUFBLFdBQVcsR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBQdWx1bWkgYXBwbGljYXRpb24gZW50cnkgcG9pbnQgZm9yIHRoZSBUQVAgKFRlc3QgQXV0b21hdGlvbiBQbGF0Zm9ybSkgaW5mcmFzdHJ1Y3R1cmUuXG4gKlxuICogVGhpcyBtb2R1bGUgZGVmaW5lcyB0aGUgY29yZSBQdWx1bWkgc3RhY2sgYW5kIGluc3RhbnRpYXRlcyB0aGUgVGFwU3RhY2sgd2l0aCBhcHByb3ByaWF0ZVxuICogY29uZmlndXJhdGlvbiBiYXNlZCBvbiB0aGUgZGVwbG95bWVudCBlbnZpcm9ubWVudC4gSXQgaGFuZGxlcyBlbnZpcm9ubWVudC1zcGVjaWZpYyBzZXR0aW5ncyxcbiAqIHRhZ2dpbmcsIGFuZCBkZXBsb3ltZW50IGNvbmZpZ3VyYXRpb24gZm9yIEFXUyByZXNvdXJjZXMuXG4gKlxuICogVGhlIHN0YWNrIGNyZWF0ZWQgYnkgdGhpcyBtb2R1bGUgdXNlcyBlbnZpcm9ubWVudCBzdWZmaXhlcyB0byBkaXN0aW5ndWlzaCBiZXR3ZWVuXG4gKiBkaWZmZXJlbnQgZGVwbG95bWVudCBlbnZpcm9ubWVudHMgKGRldmVsb3BtZW50LCBzdGFnaW5nLCBwcm9kdWN0aW9uLCBldGMuKS5cbiAqL1xuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCB7IFRhcFN0YWNrIH0gZnJvbSAnLi4vbGliL3RhcC1zdGFjayc7XG5cbi8vIEluaXRpYWxpemUgUHVsdW1pIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBjdXJyZW50IHN0YWNrLlxuY29uc3QgY29uZmlnID0gbmV3IHB1bHVtaS5Db25maWcoKTtcblxuLy8gR2V0IHRoZSBlbnZpcm9ubWVudCBzdWZmaXggZnJvbSB0aGUgUHVsdW1pIGNvbmZpZywgZGVmYXVsdGluZyB0byAnZGV2Jy5cbi8vIFlvdSBjYW4gc2V0IHRoaXMgdmFsdWUgdXNpbmcgdGhlIGNvbW1hbmQ6IGBwdWx1bWkgY29uZmlnIHNldCBlbnYgPHZhbHVlPmBcbmNvbnN0IGVudmlyb25tZW50U3VmZml4ID1cbiAgY29uZmlnLmdldCgnZW52aXJvbm1lbnRTdWZmaXgnKSB8fCBwcm9jZXNzLmVudi5FTlZJUk9OTUVOVF9TVUZGSVggfHwgJ2Rldic7XG5cbi8vIEdldCBjb25maWd1cmF0aW9uIHZhbHVlcyB3aXRoIGRlZmF1bHRzXG5jb25zdCB2cGNDaWRyID0gY29uZmlnLmdldCgndnBjQ2lkcicpIHx8ICcxMC4wLjAuMC8xNic7XG5jb25zdCBpbnN0YW5jZVR5cGUgPSBjb25maWcuZ2V0KCdpbnN0YW5jZVR5cGUnKSB8fCAndDMubWljcm8nO1xuY29uc3QgZGJJbnN0YW5jZUNsYXNzID0gY29uZmlnLmdldCgnZGJJbnN0YW5jZUNsYXNzJykgfHwgJ2RiLnQzLm1pY3JvJztcbmNvbnN0IGVuYWJsZUtleVBhaXJzID0gY29uZmlnLmdldEJvb2xlYW4oJ2VuYWJsZUtleVBhaXJzJykgfHwgZmFsc2U7XG5cbi8vIEdldCBtZXRhZGF0YSBmcm9tIGVudmlyb25tZW50IHZhcmlhYmxlcyBmb3IgdGFnZ2luZyBwdXJwb3Nlcy5cbi8vIFRoZXNlIGFyZSBvZnRlbiBpbmplY3RlZCBieSBDSS9DRCBzeXN0ZW1zLlxuY29uc3QgcmVwb3NpdG9yeSA9XG4gIGNvbmZpZy5nZXQoJ3JlcG9zaXRvcnknKSB8fCBwcm9jZXNzLmVudi5SRVBPU0lUT1JZIHx8ICd0YXAtaW5mcmFzdHJ1Y3R1cmUnO1xuY29uc3QgY29tbWl0QXV0aG9yID1cbiAgY29uZmlnLmdldCgnY29tbWl0QXV0aG9yJykgfHwgcHJvY2Vzcy5lbnYuQ09NTUlUX0FVVEhPUiB8fCAndW5rbm93bic7XG5cbi8vIERlZmluZSBhIHNldCBvZiBkZWZhdWx0IHRhZ3MgdG8gYXBwbHkgdG8gYWxsIHJlc291cmNlcy5cbmNvbnN0IGRlZmF1bHRUYWdzID0ge1xuICBFbnZpcm9ubWVudDogZW52aXJvbm1lbnRTdWZmaXgsXG4gIFJlcG9zaXRvcnk6IHJlcG9zaXRvcnksXG4gIEF1dGhvcjogY29tbWl0QXV0aG9yLFxuICBQcm9qZWN0OiAnVEFQJyxcbiAgT3duZXI6ICd0YXAtdGVhbScsXG59O1xuXG4vLyBJbnN0YW50aWF0ZSB0aGUgbWFpbiBzdGFjayBjb21wb25lbnQgZm9yIHRoZSBpbmZyYXN0cnVjdHVyZS5cbi8vIFRoaXMgZW5jYXBzdWxhdGVzIGFsbCB0aGUgcmVzb3VyY2VzIGZvciB0aGUgcGxhdGZvcm0uXG5jb25zdCB0YXBTdGFjayA9IG5ldyBUYXBTdGFjaygndGFwLWluZnJhc3RydWN0dXJlJywge1xuICBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgdnBjQ2lkcixcbiAgaW5zdGFuY2VUeXBlLFxuICBkYkluc3RhbmNlQ2xhc3MsXG4gIGVuYWJsZUtleVBhaXJzLFxuICB0YWdzOiBkZWZhdWx0VGFncyxcbn0pO1xuXG4vLyBFeHBvcnQgc3RhY2sgb3V0cHV0cyBmb3IgaW50ZWdyYXRpb24gdGVzdGluZyBhbmQgZXh0ZXJuYWwgYWNjZXNzXG5leHBvcnQgY29uc3QgdnBjSWQgPSB0YXBTdGFjay52cGNJZDtcbmV4cG9ydCBjb25zdCBkYXRhQnVja2V0TmFtZSA9IHRhcFN0YWNrLmRhdGFCdWNrZXROYW1lO1xuZXhwb3J0IGNvbnN0IGxvZ3NCdWNrZXROYW1lID0gdGFwU3RhY2subG9nc0J1Y2tldE5hbWU7XG5leHBvcnQgY29uc3QgZGF0YWJhc2VFbmRwb2ludCA9IHRhcFN0YWNrLmRhdGFiYXNlRW5kcG9pbnQ7XG5leHBvcnQgY29uc3QgZGJTdWJuZXRHcm91cE5hbWUgPSB0YXBTdGFjay5kYlN1Ym5ldEdyb3VwTmFtZTtcbmV4cG9ydCBjb25zdCB3ZWJJbnN0YW5jZUlkID0gdGFwU3RhY2sud2ViSW5zdGFuY2VJZDtcbmV4cG9ydCBjb25zdCB3ZWJJbnN0YW5jZVByaXZhdGVJcCA9IHRhcFN0YWNrLndlYkluc3RhbmNlUHJpdmF0ZUlwO1xuZXhwb3J0IGNvbnN0IHN0YWNrRW52aXJvbm1lbnRTdWZmaXggPSB0YXBTdGFjay5lbnZpcm9ubWVudFN1ZmZpeDtcbmV4cG9ydCBjb25zdCBtYWluS21zS2V5QWxpYXMgPSB0YXBTdGFjay5tYWluS21zS2V5QWxpYXM7XG5leHBvcnQgY29uc3QgcmRzS21zS2V5QWxpYXMgPSB0YXBTdGFjay5yZHNLbXNLZXlBbGlhcztcbmV4cG9ydCBjb25zdCBlYzJJbnN0YW5jZVByb2ZpbGVOYW1lID0gdGFwU3RhY2suZWMySW5zdGFuY2VQcm9maWxlTmFtZTtcbmV4cG9ydCBjb25zdCBlYzJSb2xlTmFtZSA9IHRhcFN0YWNrLmVjMlJvbGVOYW1lO1xuIl19