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
    environmentSuffix: environmentSuffix,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7R0FTRztBQUNILHVEQUF5QztBQUN6QyxnREFBNEM7QUFFNUMseURBQXlEO0FBQ3pELE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBRW5DLDBFQUEwRTtBQUMxRSw0RUFBNEU7QUFDNUUsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixJQUFJLEtBQUssQ0FBQztBQUVsRSxnRUFBZ0U7QUFDaEUsNkNBQTZDO0FBQzdDLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLElBQUksU0FBUyxDQUFDO0FBQ3pELE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLElBQUksU0FBUyxDQUFDO0FBRTdELDBEQUEwRDtBQUMxRCxnRUFBZ0U7QUFDaEUsNEVBQTRFO0FBQzVFLHVEQUF1RDtBQUN2RCxNQUFNLFdBQVcsR0FBRztJQUNsQixXQUFXLEVBQUUsaUJBQWlCO0lBQzlCLFVBQVUsRUFBRSxVQUFVO0lBQ3RCLE1BQU0sRUFBRSxZQUFZO0NBQ3JCLENBQUM7QUFFRiwrREFBK0Q7QUFDL0Qsd0RBQXdEO0FBQ3hELE1BQU0sS0FBSyxHQUFHLElBQUksb0JBQVEsQ0FBQyxjQUFjLEVBQUU7SUFDekMsSUFBSSxFQUFFLFdBQVc7SUFDakIsaUJBQWlCLEVBQUUsaUJBQWlCO0NBQ3JDLENBQUMsQ0FBQztBQUVILHVFQUF1RTtBQUN2RSx1RUFBdUU7QUFFdkUsaUNBQWlDO0FBQ3BCLFFBQUEsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7QUFDcEIsUUFBQSxlQUFlLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQztBQUN4QyxRQUFBLGdCQUFnQixHQUFHLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQztBQUV2RCx5QkFBeUI7QUFDWixRQUFBLGtCQUFrQixHQUFHLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQztBQUM5QyxRQUFBLGlCQUFpQixHQUFHLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQztBQUV6RCx5QkFBeUI7QUFDWixRQUFBLFVBQVUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDO0FBQzlCLFFBQUEsbUJBQW1CLEdBQUcsS0FBSyxDQUFDLG1CQUFtQixDQUFDO0FBRTdELHVCQUF1QjtBQUNWLFFBQUEsZUFBZSxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUM7QUFDeEMsUUFBQSxZQUFZLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQztBQUUvQyxxQkFBcUI7QUFDUixRQUFBLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDO0FBQzFCLFFBQUEsU0FBUyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUM7QUFFekMsaUNBQWlDO0FBQ3BCLFFBQUEsYUFBYSxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUM7QUFDcEMsUUFBQSxXQUFXLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQztBQUU3QyxrQ0FBa0M7QUFDckIsUUFBQSxtQkFBbUIsR0FBRyxLQUFLLENBQUMsbUJBQW1CLENBQUM7QUFDaEQsUUFBQSx5QkFBeUIsR0FBRyxLQUFLLENBQUMseUJBQXlCLENBQUM7QUFFekUsa0NBQWtDO0FBQ3JCLFFBQUEsWUFBWSxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUM7QUFFL0MsaUNBQWlDO0FBQ3BCLFFBQUEsV0FBVyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogUHVsdW1pIGFwcGxpY2F0aW9uIGVudHJ5IHBvaW50IGZvciB0aGUgVEFQIChUZXN0IEF1dG9tYXRpb24gUGxhdGZvcm0pIGluZnJhc3RydWN0dXJlLlxuICpcbiAqIFRoaXMgbW9kdWxlIGRlZmluZXMgdGhlIGNvcmUgUHVsdW1pIHN0YWNrIGFuZCBpbnN0YW50aWF0ZXMgdGhlIFRhcFN0YWNrIHdpdGggYXBwcm9wcmlhdGVcbiAqIGNvbmZpZ3VyYXRpb24gYmFzZWQgb24gdGhlIGRlcGxveW1lbnQgZW52aXJvbm1lbnQuIEl0IGhhbmRsZXMgZW52aXJvbm1lbnQtc3BlY2lmaWMgc2V0dGluZ3MsXG4gKiB0YWdnaW5nLCBhbmQgZGVwbG95bWVudCBjb25maWd1cmF0aW9uIGZvciBBV1MgcmVzb3VyY2VzLlxuICpcbiAqIFRoZSBzdGFjayBjcmVhdGVkIGJ5IHRoaXMgbW9kdWxlIHVzZXMgZW52aXJvbm1lbnQgc3VmZml4ZXMgdG8gZGlzdGluZ3Vpc2ggYmV0d2VlblxuICogZGlmZmVyZW50IGRlcGxveW1lbnQgZW52aXJvbm1lbnRzIChkZXZlbG9wbWVudCwgc3RhZ2luZywgcHJvZHVjdGlvbiwgZXRjLikuXG4gKi9cbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgeyBUYXBTdGFjayB9IGZyb20gJy4uL2xpYi90YXAtc3RhY2snO1xuXG4vLyBJbml0aWFsaXplIFB1bHVtaSBjb25maWd1cmF0aW9uIGZvciB0aGUgY3VycmVudCBzdGFjay5cbmNvbnN0IGNvbmZpZyA9IG5ldyBwdWx1bWkuQ29uZmlnKCk7XG5cbi8vIEdldCB0aGUgZW52aXJvbm1lbnQgc3VmZml4IGZyb20gdGhlIFB1bHVtaSBjb25maWcsIGRlZmF1bHRpbmcgdG8gJ2RldicuXG4vLyBZb3UgY2FuIHNldCB0aGlzIHZhbHVlIHVzaW5nIHRoZSBjb21tYW5kOiBgcHVsdW1pIGNvbmZpZyBzZXQgZW52IDx2YWx1ZT5gXG5jb25zdCBlbnZpcm9ubWVudFN1ZmZpeCA9IHByb2Nlc3MuZW52LkVOVklST05NRU5UX1NVRkZJWCB8fCAnZGV2JztcblxuLy8gR2V0IG1ldGFkYXRhIGZyb20gZW52aXJvbm1lbnQgdmFyaWFibGVzIGZvciB0YWdnaW5nIHB1cnBvc2VzLlxuLy8gVGhlc2UgYXJlIG9mdGVuIGluamVjdGVkIGJ5IENJL0NEIHN5c3RlbXMuXG5jb25zdCByZXBvc2l0b3J5ID0gY29uZmlnLmdldCgncmVwb3NpdG9yeScpIHx8ICd1bmtub3duJztcbmNvbnN0IGNvbW1pdEF1dGhvciA9IGNvbmZpZy5nZXQoJ2NvbW1pdEF1dGhvcicpIHx8ICd1bmtub3duJztcblxuLy8gRGVmaW5lIGEgc2V0IG9mIGRlZmF1bHQgdGFncyB0byBhcHBseSB0byBhbGwgcmVzb3VyY2VzLlxuLy8gV2hpbGUgbm90IGV4cGxpY2l0bHkgdXNlZCBpbiB0aGUgVGFwU3RhY2sgaW5zdGFudGlhdGlvbiBoZXJlLFxuLy8gdGhpcyBpcyB0aGUgc3RhbmRhcmQgcGxhY2UgdG8gZGVmaW5lIHRoZW0uIFRoZXkgd291bGQgdHlwaWNhbGx5IGJlIHBhc3NlZFxuLy8gaW50byB0aGUgVGFwU3RhY2sgb3IgY29uZmlndXJlZCBvbiB0aGUgQVdTIHByb3ZpZGVyLlxuY29uc3QgZGVmYXVsdFRhZ3MgPSB7XG4gIEVudmlyb25tZW50OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgUmVwb3NpdG9yeTogcmVwb3NpdG9yeSxcbiAgQXV0aG9yOiBjb21taXRBdXRob3IsXG59O1xuXG4vLyBJbnN0YW50aWF0ZSB0aGUgbWFpbiBzdGFjayBjb21wb25lbnQgZm9yIHRoZSBpbmZyYXN0cnVjdHVyZS5cbi8vIFRoaXMgZW5jYXBzdWxhdGVzIGFsbCB0aGUgcmVzb3VyY2VzIGZvciB0aGUgcGxhdGZvcm0uXG5jb25zdCBzdGFjayA9IG5ldyBUYXBTdGFjaygncHVsdW1pLWluZnJhJywge1xuICB0YWdzOiBkZWZhdWx0VGFncyxcbiAgZW52aXJvbm1lbnRTdWZmaXg6IGVudmlyb25tZW50U3VmZml4LFxufSk7XG5cbi8vIEV4cG9ydCBhbGwgc3RhY2sgb3V0cHV0cyBmb3IgdXNlIGJ5IG90aGVyIHN0YWNrcyBvciBleHRlcm5hbCBzeXN0ZW1zXG4vLyBUaGVzZSBvdXRwdXRzIGNhbiBiZSBhY2Nlc3NlZCB2aWEgYHB1bHVtaSBzdGFjayBvdXRwdXQgPG91dHB1dE5hbWU+YFxuXG4vLyBOZXR3b3JrIEluZnJhc3RydWN0dXJlIE91dHB1dHNcbmV4cG9ydCBjb25zdCB2cGNJZCA9IHN0YWNrLnZwY0lkO1xuZXhwb3J0IGNvbnN0IHB1YmxpY1N1Ym5ldElkcyA9IHN0YWNrLnB1YmxpY1N1Ym5ldElkcztcbmV4cG9ydCBjb25zdCBwcml2YXRlU3VibmV0SWRzID0gc3RhY2sucHJpdmF0ZVN1Ym5ldElkcztcblxuLy8gU2VjdXJpdHkgR3JvdXAgT3V0cHV0c1xuZXhwb3J0IGNvbnN0IHdlYlNlY3VyaXR5R3JvdXBJZCA9IHN0YWNrLndlYlNlY3VyaXR5R3JvdXBJZDtcbmV4cG9ydCBjb25zdCBkYlNlY3VyaXR5R3JvdXBJZCA9IHN0YWNrLmRiU2VjdXJpdHlHcm91cElkO1xuXG4vLyBJQU0gYW5kIEFjY2VzcyBPdXRwdXRzXG5leHBvcnQgY29uc3QgaWFtUm9sZUFybiA9IHN0YWNrLmlhbVJvbGVBcm47XG5leHBvcnQgY29uc3QgaW5zdGFuY2VQcm9maWxlTmFtZSA9IHN0YWNrLmluc3RhbmNlUHJvZmlsZU5hbWU7XG5cbi8vIERhdGEgU3RvcmFnZSBPdXRwdXRzXG5leHBvcnQgY29uc3QgZHluYW1vVGFibGVOYW1lID0gc3RhY2suZHluYW1vVGFibGVOYW1lO1xuZXhwb3J0IGNvbnN0IHMzQnVja2V0TmFtZSA9IHN0YWNrLnMzQnVja2V0TmFtZTtcblxuLy8gRW5jcnlwdGlvbiBPdXRwdXRzXG5leHBvcnQgY29uc3Qga21zS2V5SWQgPSBzdGFjay5rbXNLZXlJZDtcbmV4cG9ydCBjb25zdCBrbXNLZXlBcm4gPSBzdGFjay5rbXNLZXlBcm47XG5cbi8vIE1vbml0b3JpbmcgYW5kIExvZ2dpbmcgT3V0cHV0c1xuZXhwb3J0IGNvbnN0IGNsb3VkdHJhaWxBcm4gPSBzdGFjay5jbG91ZHRyYWlsQXJuO1xuZXhwb3J0IGNvbnN0IHNuc1RvcGljQXJuID0gc3RhY2suc25zVG9waWNBcm47XG5cbi8vIFNlY3VyaXR5IGFuZCBDb21wbGlhbmNlIE91dHB1dHNcbmV4cG9ydCBjb25zdCBndWFyZER1dHlEZXRlY3RvcklkID0gc3RhY2suZ3VhcmREdXR5RGV0ZWN0b3JJZDtcbmV4cG9ydCBjb25zdCBjb25maWdEZWxpdmVyeUNoYW5uZWxOYW1lID0gc3RhY2suY29uZmlnRGVsaXZlcnlDaGFubmVsTmFtZTtcblxuLy8gSW5mcmFzdHJ1Y3R1cmUgTWV0YWRhdGEgT3V0cHV0c1xuZXhwb3J0IGNvbnN0IGF2YWlsYWJsZUFacyA9IHN0YWNrLmF2YWlsYWJsZUFacztcblxuLy8gRW52aXJvbm1lbnQgSW5mb3JtYXRpb24gT3V0cHV0XG5leHBvcnQgY29uc3QgZW52aXJvbm1lbnQgPSBwdWx1bWkub3V0cHV0KGVudmlyb25tZW50U3VmZml4KTtcbiJdfQ==