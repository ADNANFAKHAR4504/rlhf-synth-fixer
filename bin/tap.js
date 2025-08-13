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
exports.region = exports.kmsProtectionPolicyArn = exports.cloudTrailProtectionPolicyArn = exports.s3SecurityPolicyArn = exports.mfaEnforcementPolicyArn = exports.securityPolicyArn = exports.cloudTrailLogGroupArn = exports.cloudTrailArn = exports.auditRoleArn = exports.dataAccessRoleArn = exports.cloudTrailKmsKeyArn = exports.cloudTrailKmsKeyId = exports.s3KmsKeyArn = exports.s3KmsKeyId = exports.auditBucketArn = exports.auditBucketName = exports.primaryBucketArn = exports.primaryBucketName = void 0;
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
const tapStack = new tap_stack_1.TapStack('pulumi-infra', {
    environmentSuffix,
    tags: defaultTags,
});
// Export stack outputs for integration testing and external access
// S3 Buckets
exports.primaryBucketName = tapStack.primaryBucketName;
exports.primaryBucketArn = tapStack.primaryBucketArn;
exports.auditBucketName = tapStack.auditBucketName;
exports.auditBucketArn = tapStack.auditBucketArn;
// KMS Keys
exports.s3KmsKeyId = tapStack.s3KmsKeyId;
exports.s3KmsKeyArn = tapStack.s3KmsKeyArn;
exports.cloudTrailKmsKeyId = tapStack.cloudTrailKmsKeyId;
exports.cloudTrailKmsKeyArn = tapStack.cloudTrailKmsKeyArn;
// IAM Roles
exports.dataAccessRoleArn = tapStack.dataAccessRoleArn;
exports.auditRoleArn = tapStack.auditRoleArn;
// CloudTrail
exports.cloudTrailArn = tapStack.cloudTrailArn;
exports.cloudTrailLogGroupArn = tapStack.cloudTrailLogGroupArn;
// Security Policies
exports.securityPolicyArn = tapStack.securityPolicyArn;
exports.mfaEnforcementPolicyArn = tapStack.mfaEnforcementPolicyArn;
exports.s3SecurityPolicyArn = tapStack.s3SecurityPolicyArn;
exports.cloudTrailProtectionPolicyArn = tapStack.cloudTrailProtectionPolicyArn;
exports.kmsProtectionPolicyArn = tapStack.kmsProtectionPolicyArn;
// Region confirmation
exports.region = tapStack.region;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7R0FTRztBQUNILHVEQUF5QztBQUN6QyxnREFBNEM7QUFFNUMseURBQXlEO0FBQ3pELE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBRW5DLDBFQUEwRTtBQUMxRSw0RUFBNEU7QUFDNUUsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQztBQUVyRCxnRUFBZ0U7QUFDaEUsNkNBQTZDO0FBQzdDLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLElBQUksU0FBUyxDQUFDO0FBQ3pELE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLElBQUksU0FBUyxDQUFDO0FBRTdELDBEQUEwRDtBQUMxRCxnRUFBZ0U7QUFDaEUsNEVBQTRFO0FBQzVFLHVEQUF1RDtBQUN2RCxNQUFNLFdBQVcsR0FBRztJQUNsQixXQUFXLEVBQUUsaUJBQWlCO0lBQzlCLFVBQVUsRUFBRSxVQUFVO0lBQ3RCLE1BQU0sRUFBRSxZQUFZO0NBQ3JCLENBQUM7QUFFRiwrREFBK0Q7QUFDL0Qsd0RBQXdEO0FBQ3hELE1BQU0sUUFBUSxHQUFHLElBQUksb0JBQVEsQ0FBQyxjQUFjLEVBQUU7SUFDNUMsaUJBQWlCO0lBQ2pCLElBQUksRUFBRSxXQUFXO0NBQ2xCLENBQUMsQ0FBQztBQUVILG1FQUFtRTtBQUNuRSxhQUFhO0FBQ0EsUUFBQSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsaUJBQWlCLENBQUM7QUFDL0MsUUFBQSxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsZ0JBQWdCLENBQUM7QUFDN0MsUUFBQSxlQUFlLEdBQUcsUUFBUSxDQUFDLGVBQWUsQ0FBQztBQUMzQyxRQUFBLGNBQWMsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDO0FBRXRELFdBQVc7QUFDRSxRQUFBLFVBQVUsR0FBRyxRQUFRLENBQUMsVUFBVSxDQUFDO0FBQ2pDLFFBQUEsV0FBVyxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUM7QUFDbkMsUUFBQSxrQkFBa0IsR0FBRyxRQUFRLENBQUMsa0JBQWtCLENBQUM7QUFDakQsUUFBQSxtQkFBbUIsR0FBRyxRQUFRLENBQUMsbUJBQW1CLENBQUM7QUFFaEUsWUFBWTtBQUNDLFFBQUEsaUJBQWlCLEdBQUcsUUFBUSxDQUFDLGlCQUFpQixDQUFDO0FBQy9DLFFBQUEsWUFBWSxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUM7QUFFbEQsYUFBYTtBQUNBLFFBQUEsYUFBYSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUM7QUFDdkMsUUFBQSxxQkFBcUIsR0FBRyxRQUFRLENBQUMscUJBQXFCLENBQUM7QUFFcEUsb0JBQW9CO0FBQ1AsUUFBQSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsaUJBQWlCLENBQUM7QUFDL0MsUUFBQSx1QkFBdUIsR0FBRyxRQUFRLENBQUMsdUJBQXVCLENBQUM7QUFDM0QsUUFBQSxtQkFBbUIsR0FBRyxRQUFRLENBQUMsbUJBQW1CLENBQUM7QUFDbkQsUUFBQSw2QkFBNkIsR0FDeEMsUUFBUSxDQUFDLDZCQUE2QixDQUFDO0FBQzVCLFFBQUEsc0JBQXNCLEdBQUcsUUFBUSxDQUFDLHNCQUFzQixDQUFDO0FBRXRFLHNCQUFzQjtBQUNULFFBQUEsTUFBTSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFB1bHVtaSBhcHBsaWNhdGlvbiBlbnRyeSBwb2ludCBmb3IgdGhlIFRBUCAoVGVzdCBBdXRvbWF0aW9uIFBsYXRmb3JtKSBpbmZyYXN0cnVjdHVyZS5cbiAqXG4gKiBUaGlzIG1vZHVsZSBkZWZpbmVzIHRoZSBjb3JlIFB1bHVtaSBzdGFjayBhbmQgaW5zdGFudGlhdGVzIHRoZSBUYXBTdGFjayB3aXRoIGFwcHJvcHJpYXRlXG4gKiBjb25maWd1cmF0aW9uIGJhc2VkIG9uIHRoZSBkZXBsb3ltZW50IGVudmlyb25tZW50LiBJdCBoYW5kbGVzIGVudmlyb25tZW50LXNwZWNpZmljIHNldHRpbmdzLFxuICogdGFnZ2luZywgYW5kIGRlcGxveW1lbnQgY29uZmlndXJhdGlvbiBmb3IgQVdTIHJlc291cmNlcy5cbiAqXG4gKiBUaGUgc3RhY2sgY3JlYXRlZCBieSB0aGlzIG1vZHVsZSB1c2VzIGVudmlyb25tZW50IHN1ZmZpeGVzIHRvIGRpc3Rpbmd1aXNoIGJldHdlZW5cbiAqIGRpZmZlcmVudCBkZXBsb3ltZW50IGVudmlyb25tZW50cyAoZGV2ZWxvcG1lbnQsIHN0YWdpbmcsIHByb2R1Y3Rpb24sIGV0Yy4pLlxuICovXG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0IHsgVGFwU3RhY2sgfSBmcm9tICcuLi9saWIvdGFwLXN0YWNrJztcblxuLy8gSW5pdGlhbGl6ZSBQdWx1bWkgY29uZmlndXJhdGlvbiBmb3IgdGhlIGN1cnJlbnQgc3RhY2suXG5jb25zdCBjb25maWcgPSBuZXcgcHVsdW1pLkNvbmZpZygpO1xuXG4vLyBHZXQgdGhlIGVudmlyb25tZW50IHN1ZmZpeCBmcm9tIHRoZSBQdWx1bWkgY29uZmlnLCBkZWZhdWx0aW5nIHRvICdkZXYnLlxuLy8gWW91IGNhbiBzZXQgdGhpcyB2YWx1ZSB1c2luZyB0aGUgY29tbWFuZDogYHB1bHVtaSBjb25maWcgc2V0IGVudiA8dmFsdWU+YFxuY29uc3QgZW52aXJvbm1lbnRTdWZmaXggPSBjb25maWcuZ2V0KCdlbnYnKSB8fCAnZGV2JztcblxuLy8gR2V0IG1ldGFkYXRhIGZyb20gZW52aXJvbm1lbnQgdmFyaWFibGVzIGZvciB0YWdnaW5nIHB1cnBvc2VzLlxuLy8gVGhlc2UgYXJlIG9mdGVuIGluamVjdGVkIGJ5IENJL0NEIHN5c3RlbXMuXG5jb25zdCByZXBvc2l0b3J5ID0gY29uZmlnLmdldCgncmVwb3NpdG9yeScpIHx8ICd1bmtub3duJztcbmNvbnN0IGNvbW1pdEF1dGhvciA9IGNvbmZpZy5nZXQoJ2NvbW1pdEF1dGhvcicpIHx8ICd1bmtub3duJztcblxuLy8gRGVmaW5lIGEgc2V0IG9mIGRlZmF1bHQgdGFncyB0byBhcHBseSB0byBhbGwgcmVzb3VyY2VzLlxuLy8gV2hpbGUgbm90IGV4cGxpY2l0bHkgdXNlZCBpbiB0aGUgVGFwU3RhY2sgaW5zdGFudGlhdGlvbiBoZXJlLFxuLy8gdGhpcyBpcyB0aGUgc3RhbmRhcmQgcGxhY2UgdG8gZGVmaW5lIHRoZW0uIFRoZXkgd291bGQgdHlwaWNhbGx5IGJlIHBhc3NlZFxuLy8gaW50byB0aGUgVGFwU3RhY2sgb3IgY29uZmlndXJlZCBvbiB0aGUgQVdTIHByb3ZpZGVyLlxuY29uc3QgZGVmYXVsdFRhZ3MgPSB7XG4gIEVudmlyb25tZW50OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgUmVwb3NpdG9yeTogcmVwb3NpdG9yeSxcbiAgQXV0aG9yOiBjb21taXRBdXRob3IsXG59O1xuXG4vLyBJbnN0YW50aWF0ZSB0aGUgbWFpbiBzdGFjayBjb21wb25lbnQgZm9yIHRoZSBpbmZyYXN0cnVjdHVyZS5cbi8vIFRoaXMgZW5jYXBzdWxhdGVzIGFsbCB0aGUgcmVzb3VyY2VzIGZvciB0aGUgcGxhdGZvcm0uXG5jb25zdCB0YXBTdGFjayA9IG5ldyBUYXBTdGFjaygncHVsdW1pLWluZnJhJywge1xuICBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgdGFnczogZGVmYXVsdFRhZ3MsXG59KTtcblxuLy8gRXhwb3J0IHN0YWNrIG91dHB1dHMgZm9yIGludGVncmF0aW9uIHRlc3RpbmcgYW5kIGV4dGVybmFsIGFjY2Vzc1xuLy8gUzMgQnVja2V0c1xuZXhwb3J0IGNvbnN0IHByaW1hcnlCdWNrZXROYW1lID0gdGFwU3RhY2sucHJpbWFyeUJ1Y2tldE5hbWU7XG5leHBvcnQgY29uc3QgcHJpbWFyeUJ1Y2tldEFybiA9IHRhcFN0YWNrLnByaW1hcnlCdWNrZXRBcm47XG5leHBvcnQgY29uc3QgYXVkaXRCdWNrZXROYW1lID0gdGFwU3RhY2suYXVkaXRCdWNrZXROYW1lO1xuZXhwb3J0IGNvbnN0IGF1ZGl0QnVja2V0QXJuID0gdGFwU3RhY2suYXVkaXRCdWNrZXRBcm47XG5cbi8vIEtNUyBLZXlzXG5leHBvcnQgY29uc3QgczNLbXNLZXlJZCA9IHRhcFN0YWNrLnMzS21zS2V5SWQ7XG5leHBvcnQgY29uc3QgczNLbXNLZXlBcm4gPSB0YXBTdGFjay5zM0ttc0tleUFybjtcbmV4cG9ydCBjb25zdCBjbG91ZFRyYWlsS21zS2V5SWQgPSB0YXBTdGFjay5jbG91ZFRyYWlsS21zS2V5SWQ7XG5leHBvcnQgY29uc3QgY2xvdWRUcmFpbEttc0tleUFybiA9IHRhcFN0YWNrLmNsb3VkVHJhaWxLbXNLZXlBcm47XG5cbi8vIElBTSBSb2xlc1xuZXhwb3J0IGNvbnN0IGRhdGFBY2Nlc3NSb2xlQXJuID0gdGFwU3RhY2suZGF0YUFjY2Vzc1JvbGVBcm47XG5leHBvcnQgY29uc3QgYXVkaXRSb2xlQXJuID0gdGFwU3RhY2suYXVkaXRSb2xlQXJuO1xuXG4vLyBDbG91ZFRyYWlsXG5leHBvcnQgY29uc3QgY2xvdWRUcmFpbEFybiA9IHRhcFN0YWNrLmNsb3VkVHJhaWxBcm47XG5leHBvcnQgY29uc3QgY2xvdWRUcmFpbExvZ0dyb3VwQXJuID0gdGFwU3RhY2suY2xvdWRUcmFpbExvZ0dyb3VwQXJuO1xuXG4vLyBTZWN1cml0eSBQb2xpY2llc1xuZXhwb3J0IGNvbnN0IHNlY3VyaXR5UG9saWN5QXJuID0gdGFwU3RhY2suc2VjdXJpdHlQb2xpY3lBcm47XG5leHBvcnQgY29uc3QgbWZhRW5mb3JjZW1lbnRQb2xpY3lBcm4gPSB0YXBTdGFjay5tZmFFbmZvcmNlbWVudFBvbGljeUFybjtcbmV4cG9ydCBjb25zdCBzM1NlY3VyaXR5UG9saWN5QXJuID0gdGFwU3RhY2suczNTZWN1cml0eVBvbGljeUFybjtcbmV4cG9ydCBjb25zdCBjbG91ZFRyYWlsUHJvdGVjdGlvblBvbGljeUFybiA9XG4gIHRhcFN0YWNrLmNsb3VkVHJhaWxQcm90ZWN0aW9uUG9saWN5QXJuO1xuZXhwb3J0IGNvbnN0IGttc1Byb3RlY3Rpb25Qb2xpY3lBcm4gPSB0YXBTdGFjay5rbXNQcm90ZWN0aW9uUG9saWN5QXJuO1xuXG4vLyBSZWdpb24gY29uZmlybWF0aW9uXG5leHBvcnQgY29uc3QgcmVnaW9uID0gdGFwU3RhY2sucmVnaW9uO1xuIl19