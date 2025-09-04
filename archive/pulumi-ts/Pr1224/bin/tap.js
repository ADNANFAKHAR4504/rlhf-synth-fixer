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
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
const tap_stack_1 = require("../lib/tap-stack");
// Initialize Pulumi configuration for the current stack.
const config = new pulumi.Config();
// Configure AWS provider for the specified region
const region = config.get('region') || process.env.AWS_REGION || 'us-east-1';
const provider = new aws.Provider('aws-provider', {
    region: region,
});
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
}, { provider });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7R0FTRztBQUNILGlEQUFtQztBQUNuQyx1REFBeUM7QUFDekMsZ0RBQTRDO0FBRTVDLHlEQUF5RDtBQUN6RCxNQUFNLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUVuQyxrREFBa0Q7QUFDbEQsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsSUFBSSxXQUFXLENBQUM7QUFDN0UsTUFBTSxRQUFRLEdBQUcsSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDLGNBQWMsRUFBRTtJQUNoRCxNQUFNLEVBQUUsTUFBTTtDQUNmLENBQUMsQ0FBQztBQUVILDBFQUEwRTtBQUMxRSw0RUFBNEU7QUFDNUUsTUFBTSxpQkFBaUIsR0FDckIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLElBQUksS0FBSyxDQUFDO0FBRTdFLHlDQUF5QztBQUN6QyxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLGFBQWEsQ0FBQztBQUN2RCxNQUFNLFlBQVksR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxJQUFJLFVBQVUsQ0FBQztBQUM5RCxNQUFNLGVBQWUsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLElBQUksYUFBYSxDQUFDO0FBQ3ZFLE1BQU0sY0FBYyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxLQUFLLENBQUM7QUFFcEUsZ0VBQWdFO0FBQ2hFLDZDQUE2QztBQUM3QyxNQUFNLFVBQVUsR0FDZCxNQUFNLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLG9CQUFvQixDQUFDO0FBQzdFLE1BQU0sWUFBWSxHQUNoQixNQUFNLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxJQUFJLFNBQVMsQ0FBQztBQUV2RSwwREFBMEQ7QUFDMUQsTUFBTSxXQUFXLEdBQUc7SUFDbEIsV0FBVyxFQUFFLGlCQUFpQjtJQUM5QixVQUFVLEVBQUUsVUFBVTtJQUN0QixNQUFNLEVBQUUsWUFBWTtJQUNwQixPQUFPLEVBQUUsS0FBSztJQUNkLEtBQUssRUFBRSxVQUFVO0NBQ2xCLENBQUM7QUFFRiwrREFBK0Q7QUFDL0Qsd0RBQXdEO0FBQ3hELE1BQU0sUUFBUSxHQUFHLElBQUksb0JBQVEsQ0FDM0Isb0JBQW9CLEVBQ3BCO0lBQ0UsaUJBQWlCO0lBQ2pCLE9BQU87SUFDUCxZQUFZO0lBQ1osZUFBZTtJQUNmLGNBQWM7SUFDZCxJQUFJLEVBQUUsV0FBVztDQUNsQixFQUNELEVBQUUsUUFBUSxFQUFFLENBQ2IsQ0FBQztBQUVGLG1FQUFtRTtBQUN0RCxRQUFBLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDO0FBQ3ZCLFFBQUEsY0FBYyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUM7QUFDekMsUUFBQSxjQUFjLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQztBQUN6QyxRQUFBLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQztBQUM3QyxRQUFBLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQztBQUMvQyxRQUFBLGFBQWEsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDO0FBQ3ZDLFFBQUEsb0JBQW9CLEdBQUcsUUFBUSxDQUFDLG9CQUFvQixDQUFDO0FBQ3JELFFBQUEsc0JBQXNCLEdBQUcsUUFBUSxDQUFDLGlCQUFpQixDQUFDO0FBQ3BELFFBQUEsZUFBZSxHQUFHLFFBQVEsQ0FBQyxlQUFlLENBQUM7QUFDM0MsUUFBQSxjQUFjLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQztBQUN6QyxRQUFBLHNCQUFzQixHQUFHLFFBQVEsQ0FBQyxzQkFBc0IsQ0FBQztBQUN6RCxRQUFBLFdBQVcsR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBQdWx1bWkgYXBwbGljYXRpb24gZW50cnkgcG9pbnQgZm9yIHRoZSBUQVAgKFRlc3QgQXV0b21hdGlvbiBQbGF0Zm9ybSkgaW5mcmFzdHJ1Y3R1cmUuXG4gKlxuICogVGhpcyBtb2R1bGUgZGVmaW5lcyB0aGUgY29yZSBQdWx1bWkgc3RhY2sgYW5kIGluc3RhbnRpYXRlcyB0aGUgVGFwU3RhY2sgd2l0aCBhcHByb3ByaWF0ZVxuICogY29uZmlndXJhdGlvbiBiYXNlZCBvbiB0aGUgZGVwbG95bWVudCBlbnZpcm9ubWVudC4gSXQgaGFuZGxlcyBlbnZpcm9ubWVudC1zcGVjaWZpYyBzZXR0aW5ncyxcbiAqIHRhZ2dpbmcsIGFuZCBkZXBsb3ltZW50IGNvbmZpZ3VyYXRpb24gZm9yIEFXUyByZXNvdXJjZXMuXG4gKlxuICogVGhlIHN0YWNrIGNyZWF0ZWQgYnkgdGhpcyBtb2R1bGUgdXNlcyBlbnZpcm9ubWVudCBzdWZmaXhlcyB0byBkaXN0aW5ndWlzaCBiZXR3ZWVuXG4gKiBkaWZmZXJlbnQgZGVwbG95bWVudCBlbnZpcm9ubWVudHMgKGRldmVsb3BtZW50LCBzdGFnaW5nLCBwcm9kdWN0aW9uLCBldGMuKS5cbiAqL1xuaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgeyBUYXBTdGFjayB9IGZyb20gJy4uL2xpYi90YXAtc3RhY2snO1xuXG4vLyBJbml0aWFsaXplIFB1bHVtaSBjb25maWd1cmF0aW9uIGZvciB0aGUgY3VycmVudCBzdGFjay5cbmNvbnN0IGNvbmZpZyA9IG5ldyBwdWx1bWkuQ29uZmlnKCk7XG5cbi8vIENvbmZpZ3VyZSBBV1MgcHJvdmlkZXIgZm9yIHRoZSBzcGVjaWZpZWQgcmVnaW9uXG5jb25zdCByZWdpb24gPSBjb25maWcuZ2V0KCdyZWdpb24nKSB8fCBwcm9jZXNzLmVudi5BV1NfUkVHSU9OIHx8ICd1cy1lYXN0LTEnO1xuY29uc3QgcHJvdmlkZXIgPSBuZXcgYXdzLlByb3ZpZGVyKCdhd3MtcHJvdmlkZXInLCB7XG4gIHJlZ2lvbjogcmVnaW9uLFxufSk7XG5cbi8vIEdldCB0aGUgZW52aXJvbm1lbnQgc3VmZml4IGZyb20gdGhlIFB1bHVtaSBjb25maWcsIGRlZmF1bHRpbmcgdG8gJ2RldicuXG4vLyBZb3UgY2FuIHNldCB0aGlzIHZhbHVlIHVzaW5nIHRoZSBjb21tYW5kOiBgcHVsdW1pIGNvbmZpZyBzZXQgZW52IDx2YWx1ZT5gXG5jb25zdCBlbnZpcm9ubWVudFN1ZmZpeCA9XG4gIGNvbmZpZy5nZXQoJ2Vudmlyb25tZW50U3VmZml4JykgfHwgcHJvY2Vzcy5lbnYuRU5WSVJPTk1FTlRfU1VGRklYIHx8ICdkZXYnO1xuXG4vLyBHZXQgY29uZmlndXJhdGlvbiB2YWx1ZXMgd2l0aCBkZWZhdWx0c1xuY29uc3QgdnBjQ2lkciA9IGNvbmZpZy5nZXQoJ3ZwY0NpZHInKSB8fCAnMTAuMC4wLjAvMTYnO1xuY29uc3QgaW5zdGFuY2VUeXBlID0gY29uZmlnLmdldCgnaW5zdGFuY2VUeXBlJykgfHwgJ3QzLm1pY3JvJztcbmNvbnN0IGRiSW5zdGFuY2VDbGFzcyA9IGNvbmZpZy5nZXQoJ2RiSW5zdGFuY2VDbGFzcycpIHx8ICdkYi50My5taWNybyc7XG5jb25zdCBlbmFibGVLZXlQYWlycyA9IGNvbmZpZy5nZXRCb29sZWFuKCdlbmFibGVLZXlQYWlycycpIHx8IGZhbHNlO1xuXG4vLyBHZXQgbWV0YWRhdGEgZnJvbSBlbnZpcm9ubWVudCB2YXJpYWJsZXMgZm9yIHRhZ2dpbmcgcHVycG9zZXMuXG4vLyBUaGVzZSBhcmUgb2Z0ZW4gaW5qZWN0ZWQgYnkgQ0kvQ0Qgc3lzdGVtcy5cbmNvbnN0IHJlcG9zaXRvcnkgPVxuICBjb25maWcuZ2V0KCdyZXBvc2l0b3J5JykgfHwgcHJvY2Vzcy5lbnYuUkVQT1NJVE9SWSB8fCAndGFwLWluZnJhc3RydWN0dXJlJztcbmNvbnN0IGNvbW1pdEF1dGhvciA9XG4gIGNvbmZpZy5nZXQoJ2NvbW1pdEF1dGhvcicpIHx8IHByb2Nlc3MuZW52LkNPTU1JVF9BVVRIT1IgfHwgJ3Vua25vd24nO1xuXG4vLyBEZWZpbmUgYSBzZXQgb2YgZGVmYXVsdCB0YWdzIHRvIGFwcGx5IHRvIGFsbCByZXNvdXJjZXMuXG5jb25zdCBkZWZhdWx0VGFncyA9IHtcbiAgRW52aXJvbm1lbnQ6IGVudmlyb25tZW50U3VmZml4LFxuICBSZXBvc2l0b3J5OiByZXBvc2l0b3J5LFxuICBBdXRob3I6IGNvbW1pdEF1dGhvcixcbiAgUHJvamVjdDogJ1RBUCcsXG4gIE93bmVyOiAndGFwLXRlYW0nLFxufTtcblxuLy8gSW5zdGFudGlhdGUgdGhlIG1haW4gc3RhY2sgY29tcG9uZW50IGZvciB0aGUgaW5mcmFzdHJ1Y3R1cmUuXG4vLyBUaGlzIGVuY2Fwc3VsYXRlcyBhbGwgdGhlIHJlc291cmNlcyBmb3IgdGhlIHBsYXRmb3JtLlxuY29uc3QgdGFwU3RhY2sgPSBuZXcgVGFwU3RhY2soXG4gICd0YXAtaW5mcmFzdHJ1Y3R1cmUnLFxuICB7XG4gICAgZW52aXJvbm1lbnRTdWZmaXgsXG4gICAgdnBjQ2lkcixcbiAgICBpbnN0YW5jZVR5cGUsXG4gICAgZGJJbnN0YW5jZUNsYXNzLFxuICAgIGVuYWJsZUtleVBhaXJzLFxuICAgIHRhZ3M6IGRlZmF1bHRUYWdzLFxuICB9LFxuICB7IHByb3ZpZGVyIH1cbik7XG5cbi8vIEV4cG9ydCBzdGFjayBvdXRwdXRzIGZvciBpbnRlZ3JhdGlvbiB0ZXN0aW5nIGFuZCBleHRlcm5hbCBhY2Nlc3NcbmV4cG9ydCBjb25zdCB2cGNJZCA9IHRhcFN0YWNrLnZwY0lkO1xuZXhwb3J0IGNvbnN0IGRhdGFCdWNrZXROYW1lID0gdGFwU3RhY2suZGF0YUJ1Y2tldE5hbWU7XG5leHBvcnQgY29uc3QgbG9nc0J1Y2tldE5hbWUgPSB0YXBTdGFjay5sb2dzQnVja2V0TmFtZTtcbmV4cG9ydCBjb25zdCBkYXRhYmFzZUVuZHBvaW50ID0gdGFwU3RhY2suZGF0YWJhc2VFbmRwb2ludDtcbmV4cG9ydCBjb25zdCBkYlN1Ym5ldEdyb3VwTmFtZSA9IHRhcFN0YWNrLmRiU3VibmV0R3JvdXBOYW1lO1xuZXhwb3J0IGNvbnN0IHdlYkluc3RhbmNlSWQgPSB0YXBTdGFjay53ZWJJbnN0YW5jZUlkO1xuZXhwb3J0IGNvbnN0IHdlYkluc3RhbmNlUHJpdmF0ZUlwID0gdGFwU3RhY2sud2ViSW5zdGFuY2VQcml2YXRlSXA7XG5leHBvcnQgY29uc3Qgc3RhY2tFbnZpcm9ubWVudFN1ZmZpeCA9IHRhcFN0YWNrLmVudmlyb25tZW50U3VmZml4O1xuZXhwb3J0IGNvbnN0IG1haW5LbXNLZXlBbGlhcyA9IHRhcFN0YWNrLm1haW5LbXNLZXlBbGlhcztcbmV4cG9ydCBjb25zdCByZHNLbXNLZXlBbGlhcyA9IHRhcFN0YWNrLnJkc0ttc0tleUFsaWFzO1xuZXhwb3J0IGNvbnN0IGVjMkluc3RhbmNlUHJvZmlsZU5hbWUgPSB0YXBTdGFjay5lYzJJbnN0YW5jZVByb2ZpbGVOYW1lO1xuZXhwb3J0IGNvbnN0IGVjMlJvbGVOYW1lID0gdGFwU3RhY2suZWMyUm9sZU5hbWU7XG4iXX0=