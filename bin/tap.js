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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7R0FTRztBQUNILHVEQUF5QztBQUN6QyxnREFBNEM7QUFFNUMseURBQXlEO0FBQ3pELE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBRW5DLDBFQUEwRTtBQUMxRSw0RUFBNEU7QUFDNUUsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixJQUFJLEtBQUssQ0FBQztBQUVsRSxnRUFBZ0U7QUFDaEUsNkNBQTZDO0FBQzdDLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLElBQUksU0FBUyxDQUFDO0FBQ3pELE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLElBQUksU0FBUyxDQUFDO0FBRTdELDBEQUEwRDtBQUMxRCxnRUFBZ0U7QUFDaEUsNEVBQTRFO0FBQzVFLHVEQUF1RDtBQUN2RCxNQUFNLFdBQVcsR0FBRztJQUNsQixXQUFXLEVBQUUsaUJBQWlCO0lBQzlCLFVBQVUsRUFBRSxVQUFVO0lBQ3RCLE1BQU0sRUFBRSxZQUFZO0NBQ3JCLENBQUM7QUFFRiwrREFBK0Q7QUFDL0Qsd0RBQXdEO0FBQ3hELE1BQU0sS0FBSyxHQUFHLElBQUksb0JBQVEsQ0FBQyxjQUFjLEVBQUU7SUFDekMsSUFBSSxFQUFFLFdBQVc7Q0FDbEIsQ0FBQyxDQUFDO0FBRUgsdUVBQXVFO0FBQ3ZFLHVFQUF1RTtBQUV2RSxpQ0FBaUM7QUFDcEIsUUFBQSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQztBQUNwQixRQUFBLGVBQWUsR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDO0FBQ3hDLFFBQUEsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDLGdCQUFnQixDQUFDO0FBRXZELHlCQUF5QjtBQUNaLFFBQUEsa0JBQWtCLEdBQUcsS0FBSyxDQUFDLGtCQUFrQixDQUFDO0FBQzlDLFFBQUEsaUJBQWlCLEdBQUcsS0FBSyxDQUFDLGlCQUFpQixDQUFDO0FBRXpELHlCQUF5QjtBQUNaLFFBQUEsVUFBVSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUM7QUFDOUIsUUFBQSxtQkFBbUIsR0FBRyxLQUFLLENBQUMsbUJBQW1CLENBQUM7QUFFN0QsdUJBQXVCO0FBQ1YsUUFBQSxlQUFlLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQztBQUN4QyxRQUFBLFlBQVksR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDO0FBRS9DLHFCQUFxQjtBQUNSLFFBQUEsUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUM7QUFDMUIsUUFBQSxTQUFTLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQztBQUV6QyxpQ0FBaUM7QUFDcEIsUUFBQSxhQUFhLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQztBQUNwQyxRQUFBLFdBQVcsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDO0FBRTdDLGtDQUFrQztBQUNyQixRQUFBLG1CQUFtQixHQUFHLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQztBQUNoRCxRQUFBLHlCQUF5QixHQUFHLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQztBQUV6RSxrQ0FBa0M7QUFDckIsUUFBQSxZQUFZLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQztBQUUvQyxpQ0FBaUM7QUFDcEIsUUFBQSxXQUFXLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBQdWx1bWkgYXBwbGljYXRpb24gZW50cnkgcG9pbnQgZm9yIHRoZSBUQVAgKFRlc3QgQXV0b21hdGlvbiBQbGF0Zm9ybSkgaW5mcmFzdHJ1Y3R1cmUuXG4gKlxuICogVGhpcyBtb2R1bGUgZGVmaW5lcyB0aGUgY29yZSBQdWx1bWkgc3RhY2sgYW5kIGluc3RhbnRpYXRlcyB0aGUgVGFwU3RhY2sgd2l0aCBhcHByb3ByaWF0ZVxuICogY29uZmlndXJhdGlvbiBiYXNlZCBvbiB0aGUgZGVwbG95bWVudCBlbnZpcm9ubWVudC4gSXQgaGFuZGxlcyBlbnZpcm9ubWVudC1zcGVjaWZpYyBzZXR0aW5ncyxcbiAqIHRhZ2dpbmcsIGFuZCBkZXBsb3ltZW50IGNvbmZpZ3VyYXRpb24gZm9yIEFXUyByZXNvdXJjZXMuXG4gKlxuICogVGhlIHN0YWNrIGNyZWF0ZWQgYnkgdGhpcyBtb2R1bGUgdXNlcyBlbnZpcm9ubWVudCBzdWZmaXhlcyB0byBkaXN0aW5ndWlzaCBiZXR3ZWVuXG4gKiBkaWZmZXJlbnQgZGVwbG95bWVudCBlbnZpcm9ubWVudHMgKGRldmVsb3BtZW50LCBzdGFnaW5nLCBwcm9kdWN0aW9uLCBldGMuKS5cbiAqL1xuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCB7IFRhcFN0YWNrIH0gZnJvbSAnLi4vbGliL3RhcC1zdGFjayc7XG5cbi8vIEluaXRpYWxpemUgUHVsdW1pIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBjdXJyZW50IHN0YWNrLlxuY29uc3QgY29uZmlnID0gbmV3IHB1bHVtaS5Db25maWcoKTtcblxuLy8gR2V0IHRoZSBlbnZpcm9ubWVudCBzdWZmaXggZnJvbSB0aGUgUHVsdW1pIGNvbmZpZywgZGVmYXVsdGluZyB0byAnZGV2Jy5cbi8vIFlvdSBjYW4gc2V0IHRoaXMgdmFsdWUgdXNpbmcgdGhlIGNvbW1hbmQ6IGBwdWx1bWkgY29uZmlnIHNldCBlbnYgPHZhbHVlPmBcbmNvbnN0IGVudmlyb25tZW50U3VmZml4ID0gcHJvY2Vzcy5lbnYuRU5WSVJPTk1FTlRfU1VGRklYIHx8ICdkZXYnO1xuXG4vLyBHZXQgbWV0YWRhdGEgZnJvbSBlbnZpcm9ubWVudCB2YXJpYWJsZXMgZm9yIHRhZ2dpbmcgcHVycG9zZXMuXG4vLyBUaGVzZSBhcmUgb2Z0ZW4gaW5qZWN0ZWQgYnkgQ0kvQ0Qgc3lzdGVtcy5cbmNvbnN0IHJlcG9zaXRvcnkgPSBjb25maWcuZ2V0KCdyZXBvc2l0b3J5JykgfHwgJ3Vua25vd24nO1xuY29uc3QgY29tbWl0QXV0aG9yID0gY29uZmlnLmdldCgnY29tbWl0QXV0aG9yJykgfHwgJ3Vua25vd24nO1xuXG4vLyBEZWZpbmUgYSBzZXQgb2YgZGVmYXVsdCB0YWdzIHRvIGFwcGx5IHRvIGFsbCByZXNvdXJjZXMuXG4vLyBXaGlsZSBub3QgZXhwbGljaXRseSB1c2VkIGluIHRoZSBUYXBTdGFjayBpbnN0YW50aWF0aW9uIGhlcmUsXG4vLyB0aGlzIGlzIHRoZSBzdGFuZGFyZCBwbGFjZSB0byBkZWZpbmUgdGhlbS4gVGhleSB3b3VsZCB0eXBpY2FsbHkgYmUgcGFzc2VkXG4vLyBpbnRvIHRoZSBUYXBTdGFjayBvciBjb25maWd1cmVkIG9uIHRoZSBBV1MgcHJvdmlkZXIuXG5jb25zdCBkZWZhdWx0VGFncyA9IHtcbiAgRW52aXJvbm1lbnQ6IGVudmlyb25tZW50U3VmZml4LFxuICBSZXBvc2l0b3J5OiByZXBvc2l0b3J5LFxuICBBdXRob3I6IGNvbW1pdEF1dGhvcixcbn07XG5cbi8vIEluc3RhbnRpYXRlIHRoZSBtYWluIHN0YWNrIGNvbXBvbmVudCBmb3IgdGhlIGluZnJhc3RydWN0dXJlLlxuLy8gVGhpcyBlbmNhcHN1bGF0ZXMgYWxsIHRoZSByZXNvdXJjZXMgZm9yIHRoZSBwbGF0Zm9ybS5cbmNvbnN0IHN0YWNrID0gbmV3IFRhcFN0YWNrKCdwdWx1bWktaW5mcmEnLCB7XG4gIHRhZ3M6IGRlZmF1bHRUYWdzLFxufSk7XG5cbi8vIEV4cG9ydCBhbGwgc3RhY2sgb3V0cHV0cyBmb3IgdXNlIGJ5IG90aGVyIHN0YWNrcyBvciBleHRlcm5hbCBzeXN0ZW1zXG4vLyBUaGVzZSBvdXRwdXRzIGNhbiBiZSBhY2Nlc3NlZCB2aWEgYHB1bHVtaSBzdGFjayBvdXRwdXQgPG91dHB1dE5hbWU+YFxuXG4vLyBOZXR3b3JrIEluZnJhc3RydWN0dXJlIE91dHB1dHNcbmV4cG9ydCBjb25zdCB2cGNJZCA9IHN0YWNrLnZwY0lkO1xuZXhwb3J0IGNvbnN0IHB1YmxpY1N1Ym5ldElkcyA9IHN0YWNrLnB1YmxpY1N1Ym5ldElkcztcbmV4cG9ydCBjb25zdCBwcml2YXRlU3VibmV0SWRzID0gc3RhY2sucHJpdmF0ZVN1Ym5ldElkcztcblxuLy8gU2VjdXJpdHkgR3JvdXAgT3V0cHV0c1xuZXhwb3J0IGNvbnN0IHdlYlNlY3VyaXR5R3JvdXBJZCA9IHN0YWNrLndlYlNlY3VyaXR5R3JvdXBJZDtcbmV4cG9ydCBjb25zdCBkYlNlY3VyaXR5R3JvdXBJZCA9IHN0YWNrLmRiU2VjdXJpdHlHcm91cElkO1xuXG4vLyBJQU0gYW5kIEFjY2VzcyBPdXRwdXRzXG5leHBvcnQgY29uc3QgaWFtUm9sZUFybiA9IHN0YWNrLmlhbVJvbGVBcm47XG5leHBvcnQgY29uc3QgaW5zdGFuY2VQcm9maWxlTmFtZSA9IHN0YWNrLmluc3RhbmNlUHJvZmlsZU5hbWU7XG5cbi8vIERhdGEgU3RvcmFnZSBPdXRwdXRzXG5leHBvcnQgY29uc3QgZHluYW1vVGFibGVOYW1lID0gc3RhY2suZHluYW1vVGFibGVOYW1lO1xuZXhwb3J0IGNvbnN0IHMzQnVja2V0TmFtZSA9IHN0YWNrLnMzQnVja2V0TmFtZTtcblxuLy8gRW5jcnlwdGlvbiBPdXRwdXRzXG5leHBvcnQgY29uc3Qga21zS2V5SWQgPSBzdGFjay5rbXNLZXlJZDtcbmV4cG9ydCBjb25zdCBrbXNLZXlBcm4gPSBzdGFjay5rbXNLZXlBcm47XG5cbi8vIE1vbml0b3JpbmcgYW5kIExvZ2dpbmcgT3V0cHV0c1xuZXhwb3J0IGNvbnN0IGNsb3VkdHJhaWxBcm4gPSBzdGFjay5jbG91ZHRyYWlsQXJuO1xuZXhwb3J0IGNvbnN0IHNuc1RvcGljQXJuID0gc3RhY2suc25zVG9waWNBcm47XG5cbi8vIFNlY3VyaXR5IGFuZCBDb21wbGlhbmNlIE91dHB1dHNcbmV4cG9ydCBjb25zdCBndWFyZER1dHlEZXRlY3RvcklkID0gc3RhY2suZ3VhcmREdXR5RGV0ZWN0b3JJZDtcbmV4cG9ydCBjb25zdCBjb25maWdEZWxpdmVyeUNoYW5uZWxOYW1lID0gc3RhY2suY29uZmlnRGVsaXZlcnlDaGFubmVsTmFtZTtcblxuLy8gSW5mcmFzdHJ1Y3R1cmUgTWV0YWRhdGEgT3V0cHV0c1xuZXhwb3J0IGNvbnN0IGF2YWlsYWJsZUFacyA9IHN0YWNrLmF2YWlsYWJsZUFacztcblxuLy8gRW52aXJvbm1lbnQgSW5mb3JtYXRpb24gT3V0cHV0XG5leHBvcnQgY29uc3QgZW52aXJvbm1lbnQgPSBwdWx1bWkub3V0cHV0KGVudmlyb25tZW50U3VmZml4KTtcbiJdfQ==