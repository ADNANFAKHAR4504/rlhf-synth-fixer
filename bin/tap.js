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
exports.environment = exports.availableAZs = exports.configDeliveryChannelName = exports.guardDutyDetectorId = exports.snsTopicArn = exports.cloudtrailArn = exports.kmsKeyArn = exports.kmsKeyId = exports.s3BucketName = exports.dynamoTableName = exports.instanceProfileName = exports.iamRoleArn = exports.dbSecurityGroupId = exports.webSecurityGroupId = exports.privateSubnetIds = exports.publicSubnetIds = exports.vpcId = void 0;
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
const environmentSuffix = config.get('env') || 'dev';
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
    tags: defaultTags,
});
// Export all stack outputs for use by other stacks or external systems
// These outputs can be accessed via `pulumi stack output <outputName>`
// Network Infrastructure Outputs
exports.vpcId = stack.vpcId;
exports.publicSubnetIds = stack.publicSubnetIds;
exports.privateSubnetIds = stack.privateSubnetIds;
// Security Group Outputs
exports.webSecurityGroupId = stack.webSecurityGroupId;
exports.dbSecurityGroupId = stack.dbSecurityGroupId;
// IAM and Access Outputs
exports.iamRoleArn = stack.iamRoleArn;
exports.instanceProfileName = stack.instanceProfileName;
// Data Storage Outputs
exports.dynamoTableName = stack.dynamoTableName;
exports.s3BucketName = stack.s3BucketName;
// Encryption Outputs
exports.kmsKeyId = stack.kmsKeyId;
exports.kmsKeyArn = stack.kmsKeyArn;
// Monitoring and Logging Outputs
exports.cloudtrailArn = stack.cloudtrailArn;
exports.snsTopicArn = stack.snsTopicArn;
// Security and Compliance Outputs
exports.guardDutyDetectorId = stack.guardDutyDetectorId;
exports.configDeliveryChannelName = stack.configDeliveryChannelName;
// Infrastructure Metadata Outputs
exports.availableAZs = stack.availableAZs;
// Environment Information Output
exports.environment = pulumi.output(environmentSuffix);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7R0FTRztBQUNILHVEQUF5QztBQUN6QyxnREFBNEM7QUFFNUMseURBQXlEO0FBQ3pELE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBRW5DLDBFQUEwRTtBQUMxRSw0RUFBNEU7QUFDNUUsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQztBQUVyRCxnRUFBZ0U7QUFDaEUsNkNBQTZDO0FBQzdDLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLElBQUksU0FBUyxDQUFDO0FBQ3pELE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLElBQUksU0FBUyxDQUFDO0FBRTdELDBEQUEwRDtBQUMxRCxnRUFBZ0U7QUFDaEUsNEVBQTRFO0FBQzVFLHVEQUF1RDtBQUN2RCxNQUFNLFdBQVcsR0FBRztJQUNsQixXQUFXLEVBQUUsaUJBQWlCO0lBQzlCLFVBQVUsRUFBRSxVQUFVO0lBQ3RCLE1BQU0sRUFBRSxZQUFZO0NBQ3JCLENBQUM7QUFFRiwrREFBK0Q7QUFDL0Qsd0RBQXdEO0FBQ3hELE1BQU0sS0FBSyxHQUFHLElBQUksb0JBQVEsQ0FBQyxjQUFjLEVBQUU7SUFDekMsSUFBSSxFQUFFLFdBQVc7Q0FDbEIsQ0FBQyxDQUFDO0FBRUgsdUVBQXVFO0FBQ3ZFLHVFQUF1RTtBQUV2RSxpQ0FBaUM7QUFDcEIsUUFBQSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQztBQUNwQixRQUFBLGVBQWUsR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDO0FBQ3hDLFFBQUEsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDLGdCQUFnQixDQUFDO0FBRXZELHlCQUF5QjtBQUNaLFFBQUEsa0JBQWtCLEdBQUcsS0FBSyxDQUFDLGtCQUFrQixDQUFDO0FBQzlDLFFBQUEsaUJBQWlCLEdBQUcsS0FBSyxDQUFDLGlCQUFpQixDQUFDO0FBRXpELHlCQUF5QjtBQUNaLFFBQUEsVUFBVSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUM7QUFDOUIsUUFBQSxtQkFBbUIsR0FBRyxLQUFLLENBQUMsbUJBQW1CLENBQUM7QUFFN0QsdUJBQXVCO0FBQ1YsUUFBQSxlQUFlLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQztBQUN4QyxRQUFBLFlBQVksR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDO0FBRS9DLHFCQUFxQjtBQUNSLFFBQUEsUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUM7QUFDMUIsUUFBQSxTQUFTLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQztBQUV6QyxpQ0FBaUM7QUFDcEIsUUFBQSxhQUFhLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQztBQUNwQyxRQUFBLFdBQVcsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDO0FBRTdDLGtDQUFrQztBQUNyQixRQUFBLG1CQUFtQixHQUFHLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQztBQUNoRCxRQUFBLHlCQUF5QixHQUFHLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQztBQUV6RSxrQ0FBa0M7QUFDckIsUUFBQSxZQUFZLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQztBQUUvQyxpQ0FBaUM7QUFDcEIsUUFBQSxXQUFXLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBQdWx1bWkgYXBwbGljYXRpb24gZW50cnkgcG9pbnQgZm9yIHRoZSBUQVAgKFRlc3QgQXV0b21hdGlvbiBQbGF0Zm9ybSkgaW5mcmFzdHJ1Y3R1cmUuXG4gKlxuICogVGhpcyBtb2R1bGUgZGVmaW5lcyB0aGUgY29yZSBQdWx1bWkgc3RhY2sgYW5kIGluc3RhbnRpYXRlcyB0aGUgVGFwU3RhY2sgd2l0aCBhcHByb3ByaWF0ZVxuICogY29uZmlndXJhdGlvbiBiYXNlZCBvbiB0aGUgZGVwbG95bWVudCBlbnZpcm9ubWVudC4gSXQgaGFuZGxlcyBlbnZpcm9ubWVudC1zcGVjaWZpYyBzZXR0aW5ncyxcbiAqIHRhZ2dpbmcsIGFuZCBkZXBsb3ltZW50IGNvbmZpZ3VyYXRpb24gZm9yIEFXUyByZXNvdXJjZXMuXG4gKlxuICogVGhlIHN0YWNrIGNyZWF0ZWQgYnkgdGhpcyBtb2R1bGUgdXNlcyBlbnZpcm9ubWVudCBzdWZmaXhlcyB0byBkaXN0aW5ndWlzaCBiZXR3ZWVuXG4gKiBkaWZmZXJlbnQgZGVwbG95bWVudCBlbnZpcm9ubWVudHMgKGRldmVsb3BtZW50LCBzdGFnaW5nLCBwcm9kdWN0aW9uLCBldGMuKS5cbiAqL1xuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCB7IFRhcFN0YWNrIH0gZnJvbSAnLi4vbGliL3RhcC1zdGFjayc7XG5cbi8vIEluaXRpYWxpemUgUHVsdW1pIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBjdXJyZW50IHN0YWNrLlxuY29uc3QgY29uZmlnID0gbmV3IHB1bHVtaS5Db25maWcoKTtcblxuLy8gR2V0IHRoZSBlbnZpcm9ubWVudCBzdWZmaXggZnJvbSB0aGUgUHVsdW1pIGNvbmZpZywgZGVmYXVsdGluZyB0byAnZGV2Jy5cbi8vIFlvdSBjYW4gc2V0IHRoaXMgdmFsdWUgdXNpbmcgdGhlIGNvbW1hbmQ6IGBwdWx1bWkgY29uZmlnIHNldCBlbnYgPHZhbHVlPmBcbmNvbnN0IGVudmlyb25tZW50U3VmZml4ID0gY29uZmlnLmdldCgnZW52JykgfHwgJ2Rldic7XG5cbi8vIEdldCBtZXRhZGF0YSBmcm9tIGVudmlyb25tZW50IHZhcmlhYmxlcyBmb3IgdGFnZ2luZyBwdXJwb3Nlcy5cbi8vIFRoZXNlIGFyZSBvZnRlbiBpbmplY3RlZCBieSBDSS9DRCBzeXN0ZW1zLlxuY29uc3QgcmVwb3NpdG9yeSA9IGNvbmZpZy5nZXQoJ3JlcG9zaXRvcnknKSB8fCAndW5rbm93bic7XG5jb25zdCBjb21taXRBdXRob3IgPSBjb25maWcuZ2V0KCdjb21taXRBdXRob3InKSB8fCAndW5rbm93bic7XG5cbi8vIERlZmluZSBhIHNldCBvZiBkZWZhdWx0IHRhZ3MgdG8gYXBwbHkgdG8gYWxsIHJlc291cmNlcy5cbi8vIFdoaWxlIG5vdCBleHBsaWNpdGx5IHVzZWQgaW4gdGhlIFRhcFN0YWNrIGluc3RhbnRpYXRpb24gaGVyZSxcbi8vIHRoaXMgaXMgdGhlIHN0YW5kYXJkIHBsYWNlIHRvIGRlZmluZSB0aGVtLiBUaGV5IHdvdWxkIHR5cGljYWxseSBiZSBwYXNzZWRcbi8vIGludG8gdGhlIFRhcFN0YWNrIG9yIGNvbmZpZ3VyZWQgb24gdGhlIEFXUyBwcm92aWRlci5cbmNvbnN0IGRlZmF1bHRUYWdzID0ge1xuICBFbnZpcm9ubWVudDogZW52aXJvbm1lbnRTdWZmaXgsXG4gIFJlcG9zaXRvcnk6IHJlcG9zaXRvcnksXG4gIEF1dGhvcjogY29tbWl0QXV0aG9yLFxufTtcblxuLy8gSW5zdGFudGlhdGUgdGhlIG1haW4gc3RhY2sgY29tcG9uZW50IGZvciB0aGUgaW5mcmFzdHJ1Y3R1cmUuXG4vLyBUaGlzIGVuY2Fwc3VsYXRlcyBhbGwgdGhlIHJlc291cmNlcyBmb3IgdGhlIHBsYXRmb3JtLlxuY29uc3Qgc3RhY2sgPSBuZXcgVGFwU3RhY2soJ3B1bHVtaS1pbmZyYScsIHtcbiAgdGFnczogZGVmYXVsdFRhZ3MsXG59KTtcblxuLy8gRXhwb3J0IGFsbCBzdGFjayBvdXRwdXRzIGZvciB1c2UgYnkgb3RoZXIgc3RhY2tzIG9yIGV4dGVybmFsIHN5c3RlbXNcbi8vIFRoZXNlIG91dHB1dHMgY2FuIGJlIGFjY2Vzc2VkIHZpYSBgcHVsdW1pIHN0YWNrIG91dHB1dCA8b3V0cHV0TmFtZT5gXG5cbi8vIE5ldHdvcmsgSW5mcmFzdHJ1Y3R1cmUgT3V0cHV0c1xuZXhwb3J0IGNvbnN0IHZwY0lkID0gc3RhY2sudnBjSWQ7XG5leHBvcnQgY29uc3QgcHVibGljU3VibmV0SWRzID0gc3RhY2sucHVibGljU3VibmV0SWRzO1xuZXhwb3J0IGNvbnN0IHByaXZhdGVTdWJuZXRJZHMgPSBzdGFjay5wcml2YXRlU3VibmV0SWRzO1xuXG4vLyBTZWN1cml0eSBHcm91cCBPdXRwdXRzXG5leHBvcnQgY29uc3Qgd2ViU2VjdXJpdHlHcm91cElkID0gc3RhY2sud2ViU2VjdXJpdHlHcm91cElkO1xuZXhwb3J0IGNvbnN0IGRiU2VjdXJpdHlHcm91cElkID0gc3RhY2suZGJTZWN1cml0eUdyb3VwSWQ7XG5cbi8vIElBTSBhbmQgQWNjZXNzIE91dHB1dHNcbmV4cG9ydCBjb25zdCBpYW1Sb2xlQXJuID0gc3RhY2suaWFtUm9sZUFybjtcbmV4cG9ydCBjb25zdCBpbnN0YW5jZVByb2ZpbGVOYW1lID0gc3RhY2suaW5zdGFuY2VQcm9maWxlTmFtZTtcblxuLy8gRGF0YSBTdG9yYWdlIE91dHB1dHNcbmV4cG9ydCBjb25zdCBkeW5hbW9UYWJsZU5hbWUgPSBzdGFjay5keW5hbW9UYWJsZU5hbWU7XG5leHBvcnQgY29uc3QgczNCdWNrZXROYW1lID0gc3RhY2suczNCdWNrZXROYW1lO1xuXG4vLyBFbmNyeXB0aW9uIE91dHB1dHNcbmV4cG9ydCBjb25zdCBrbXNLZXlJZCA9IHN0YWNrLmttc0tleUlkO1xuZXhwb3J0IGNvbnN0IGttc0tleUFybiA9IHN0YWNrLmttc0tleUFybjtcblxuLy8gTW9uaXRvcmluZyBhbmQgTG9nZ2luZyBPdXRwdXRzXG5leHBvcnQgY29uc3QgY2xvdWR0cmFpbEFybiA9IHN0YWNrLmNsb3VkdHJhaWxBcm47XG5leHBvcnQgY29uc3Qgc25zVG9waWNBcm4gPSBzdGFjay5zbnNUb3BpY0FybjtcblxuLy8gU2VjdXJpdHkgYW5kIENvbXBsaWFuY2UgT3V0cHV0c1xuZXhwb3J0IGNvbnN0IGd1YXJkRHV0eURldGVjdG9ySWQgPSBzdGFjay5ndWFyZER1dHlEZXRlY3RvcklkO1xuZXhwb3J0IGNvbnN0IGNvbmZpZ0RlbGl2ZXJ5Q2hhbm5lbE5hbWUgPSBzdGFjay5jb25maWdEZWxpdmVyeUNoYW5uZWxOYW1lO1xuXG4vLyBJbmZyYXN0cnVjdHVyZSBNZXRhZGF0YSBPdXRwdXRzXG5leHBvcnQgY29uc3QgYXZhaWxhYmxlQVpzID0gc3RhY2suYXZhaWxhYmxlQVpzO1xuXG4vLyBFbnZpcm9ubWVudCBJbmZvcm1hdGlvbiBPdXRwdXRcbmV4cG9ydCBjb25zdCBlbnZpcm9ubWVudCA9IHB1bHVtaS5vdXRwdXQoZW52aXJvbm1lbnRTdWZmaXgpO1xuIl19