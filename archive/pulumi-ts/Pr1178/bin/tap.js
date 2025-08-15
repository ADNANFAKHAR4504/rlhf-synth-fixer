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
exports.region = exports.kmsProtectionPolicyArn = exports.cloudTrailProtectionPolicyArn = exports.s3SecurityPolicyArn = exports.ec2LifecyclePolicyArn = exports.mfaEnforcementPolicyArn = exports.securityPolicyArn = exports.cloudTrailLogGroupArn = exports.cloudTrailArn = exports.auditRoleArn = exports.dataAccessRoleArn = exports.cloudTrailKmsKeyArn = exports.cloudTrailKmsKeyId = exports.s3KmsKeyArn = exports.s3KmsKeyId = exports.auditBucketArn = exports.auditBucketName = exports.primaryBucketArn = exports.primaryBucketName = void 0;
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
// CloudTrail exports
exports.cloudTrailArn = tapStack.cloudTrailArn;
exports.cloudTrailLogGroupArn = tapStack.cloudTrailLogGroupArn;
// Security Policies
exports.securityPolicyArn = tapStack.securityPolicyArn;
exports.mfaEnforcementPolicyArn = tapStack.mfaEnforcementPolicyArn;
exports.ec2LifecyclePolicyArn = tapStack.ec2LifecyclePolicyArn;
exports.s3SecurityPolicyArn = tapStack.s3SecurityPolicyArn;
exports.cloudTrailProtectionPolicyArn = tapStack.cloudTrailProtectionPolicyArn;
exports.kmsProtectionPolicyArn = tapStack.kmsProtectionPolicyArn;
// Region confirmation
exports.region = tapStack.region;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7R0FTRztBQUNILHVEQUF5QztBQUN6QyxnREFBNEM7QUFFNUMseURBQXlEO0FBQ3pELE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBRW5DLDBFQUEwRTtBQUMxRSw0RUFBNEU7QUFDNUUsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixJQUFJLEtBQUssQ0FBQztBQUVsRSxnRUFBZ0U7QUFDaEUsNkNBQTZDO0FBQzdDLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLElBQUksU0FBUyxDQUFDO0FBQ3pELE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLElBQUksU0FBUyxDQUFDO0FBRTdELDBEQUEwRDtBQUMxRCxnRUFBZ0U7QUFDaEUsNEVBQTRFO0FBQzVFLHVEQUF1RDtBQUN2RCxNQUFNLFdBQVcsR0FBRztJQUNsQixXQUFXLEVBQUUsaUJBQWlCO0lBQzlCLFVBQVUsRUFBRSxVQUFVO0lBQ3RCLE1BQU0sRUFBRSxZQUFZO0NBQ3JCLENBQUM7QUFFRiwrREFBK0Q7QUFDL0Qsd0RBQXdEO0FBQ3hELE1BQU0sUUFBUSxHQUFHLElBQUksb0JBQVEsQ0FBQyxjQUFjLEVBQUU7SUFDNUMsaUJBQWlCO0lBQ2pCLElBQUksRUFBRSxXQUFXO0NBQ2xCLENBQUMsQ0FBQztBQUVILG1FQUFtRTtBQUNuRSxhQUFhO0FBQ0EsUUFBQSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsaUJBQWlCLENBQUM7QUFDL0MsUUFBQSxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsZ0JBQWdCLENBQUM7QUFDN0MsUUFBQSxlQUFlLEdBQUcsUUFBUSxDQUFDLGVBQWUsQ0FBQztBQUMzQyxRQUFBLGNBQWMsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDO0FBRXRELFdBQVc7QUFDRSxRQUFBLFVBQVUsR0FBRyxRQUFRLENBQUMsVUFBVSxDQUFDO0FBQ2pDLFFBQUEsV0FBVyxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUM7QUFDbkMsUUFBQSxrQkFBa0IsR0FBRyxRQUFRLENBQUMsa0JBQWtCLENBQUM7QUFDakQsUUFBQSxtQkFBbUIsR0FBRyxRQUFRLENBQUMsbUJBQW1CLENBQUM7QUFFaEUsWUFBWTtBQUNDLFFBQUEsaUJBQWlCLEdBQUcsUUFBUSxDQUFDLGlCQUFpQixDQUFDO0FBQy9DLFFBQUEsWUFBWSxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUM7QUFFbEQscUJBQXFCO0FBQ1IsUUFBQSxhQUFhLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQztBQUN2QyxRQUFBLHFCQUFxQixHQUFHLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQztBQUVwRSxvQkFBb0I7QUFDUCxRQUFBLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQztBQUMvQyxRQUFBLHVCQUF1QixHQUFHLFFBQVEsQ0FBQyx1QkFBdUIsQ0FBQztBQUMzRCxRQUFBLHFCQUFxQixHQUFHLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQztBQUN2RCxRQUFBLG1CQUFtQixHQUFHLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQztBQUNuRCxRQUFBLDZCQUE2QixHQUN4QyxRQUFRLENBQUMsNkJBQTZCLENBQUM7QUFDNUIsUUFBQSxzQkFBc0IsR0FBRyxRQUFRLENBQUMsc0JBQXNCLENBQUM7QUFFdEUsc0JBQXNCO0FBQ1QsUUFBQSxNQUFNLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogUHVsdW1pIGFwcGxpY2F0aW9uIGVudHJ5IHBvaW50IGZvciB0aGUgVEFQIChUZXN0IEF1dG9tYXRpb24gUGxhdGZvcm0pIGluZnJhc3RydWN0dXJlLlxuICpcbiAqIFRoaXMgbW9kdWxlIGRlZmluZXMgdGhlIGNvcmUgUHVsdW1pIHN0YWNrIGFuZCBpbnN0YW50aWF0ZXMgdGhlIFRhcFN0YWNrIHdpdGggYXBwcm9wcmlhdGVcbiAqIGNvbmZpZ3VyYXRpb24gYmFzZWQgb24gdGhlIGRlcGxveW1lbnQgZW52aXJvbm1lbnQuIEl0IGhhbmRsZXMgZW52aXJvbm1lbnQtc3BlY2lmaWMgc2V0dGluZ3MsXG4gKiB0YWdnaW5nLCBhbmQgZGVwbG95bWVudCBjb25maWd1cmF0aW9uIGZvciBBV1MgcmVzb3VyY2VzLlxuICpcbiAqIFRoZSBzdGFjayBjcmVhdGVkIGJ5IHRoaXMgbW9kdWxlIHVzZXMgZW52aXJvbm1lbnQgc3VmZml4ZXMgdG8gZGlzdGluZ3Vpc2ggYmV0d2VlblxuICogZGlmZmVyZW50IGRlcGxveW1lbnQgZW52aXJvbm1lbnRzIChkZXZlbG9wbWVudCwgc3RhZ2luZywgcHJvZHVjdGlvbiwgZXRjLikuXG4gKi9cbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgeyBUYXBTdGFjayB9IGZyb20gJy4uL2xpYi90YXAtc3RhY2snO1xuXG4vLyBJbml0aWFsaXplIFB1bHVtaSBjb25maWd1cmF0aW9uIGZvciB0aGUgY3VycmVudCBzdGFjay5cbmNvbnN0IGNvbmZpZyA9IG5ldyBwdWx1bWkuQ29uZmlnKCk7XG5cbi8vIEdldCB0aGUgZW52aXJvbm1lbnQgc3VmZml4IGZyb20gdGhlIFB1bHVtaSBjb25maWcsIGRlZmF1bHRpbmcgdG8gJ2RldicuXG4vLyBZb3UgY2FuIHNldCB0aGlzIHZhbHVlIHVzaW5nIHRoZSBjb21tYW5kOiBgcHVsdW1pIGNvbmZpZyBzZXQgZW52IDx2YWx1ZT5gXG5jb25zdCBlbnZpcm9ubWVudFN1ZmZpeCA9IHByb2Nlc3MuZW52LkVOVklST05NRU5UX1NVRkZJWCB8fCAnZGV2JztcblxuLy8gR2V0IG1ldGFkYXRhIGZyb20gZW52aXJvbm1lbnQgdmFyaWFibGVzIGZvciB0YWdnaW5nIHB1cnBvc2VzLlxuLy8gVGhlc2UgYXJlIG9mdGVuIGluamVjdGVkIGJ5IENJL0NEIHN5c3RlbXMuXG5jb25zdCByZXBvc2l0b3J5ID0gY29uZmlnLmdldCgncmVwb3NpdG9yeScpIHx8ICd1bmtub3duJztcbmNvbnN0IGNvbW1pdEF1dGhvciA9IGNvbmZpZy5nZXQoJ2NvbW1pdEF1dGhvcicpIHx8ICd1bmtub3duJztcblxuLy8gRGVmaW5lIGEgc2V0IG9mIGRlZmF1bHQgdGFncyB0byBhcHBseSB0byBhbGwgcmVzb3VyY2VzLlxuLy8gV2hpbGUgbm90IGV4cGxpY2l0bHkgdXNlZCBpbiB0aGUgVGFwU3RhY2sgaW5zdGFudGlhdGlvbiBoZXJlLFxuLy8gdGhpcyBpcyB0aGUgc3RhbmRhcmQgcGxhY2UgdG8gZGVmaW5lIHRoZW0uIFRoZXkgd291bGQgdHlwaWNhbGx5IGJlIHBhc3NlZFxuLy8gaW50byB0aGUgVGFwU3RhY2sgb3IgY29uZmlndXJlZCBvbiB0aGUgQVdTIHByb3ZpZGVyLlxuY29uc3QgZGVmYXVsdFRhZ3MgPSB7XG4gIEVudmlyb25tZW50OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgUmVwb3NpdG9yeTogcmVwb3NpdG9yeSxcbiAgQXV0aG9yOiBjb21taXRBdXRob3IsXG59O1xuXG4vLyBJbnN0YW50aWF0ZSB0aGUgbWFpbiBzdGFjayBjb21wb25lbnQgZm9yIHRoZSBpbmZyYXN0cnVjdHVyZS5cbi8vIFRoaXMgZW5jYXBzdWxhdGVzIGFsbCB0aGUgcmVzb3VyY2VzIGZvciB0aGUgcGxhdGZvcm0uXG5jb25zdCB0YXBTdGFjayA9IG5ldyBUYXBTdGFjaygncHVsdW1pLWluZnJhJywge1xuICBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgdGFnczogZGVmYXVsdFRhZ3MsXG59KTtcblxuLy8gRXhwb3J0IHN0YWNrIG91dHB1dHMgZm9yIGludGVncmF0aW9uIHRlc3RpbmcgYW5kIGV4dGVybmFsIGFjY2Vzc1xuLy8gUzMgQnVja2V0c1xuZXhwb3J0IGNvbnN0IHByaW1hcnlCdWNrZXROYW1lID0gdGFwU3RhY2sucHJpbWFyeUJ1Y2tldE5hbWU7XG5leHBvcnQgY29uc3QgcHJpbWFyeUJ1Y2tldEFybiA9IHRhcFN0YWNrLnByaW1hcnlCdWNrZXRBcm47XG5leHBvcnQgY29uc3QgYXVkaXRCdWNrZXROYW1lID0gdGFwU3RhY2suYXVkaXRCdWNrZXROYW1lO1xuZXhwb3J0IGNvbnN0IGF1ZGl0QnVja2V0QXJuID0gdGFwU3RhY2suYXVkaXRCdWNrZXRBcm47XG5cbi8vIEtNUyBLZXlzXG5leHBvcnQgY29uc3QgczNLbXNLZXlJZCA9IHRhcFN0YWNrLnMzS21zS2V5SWQ7XG5leHBvcnQgY29uc3QgczNLbXNLZXlBcm4gPSB0YXBTdGFjay5zM0ttc0tleUFybjtcbmV4cG9ydCBjb25zdCBjbG91ZFRyYWlsS21zS2V5SWQgPSB0YXBTdGFjay5jbG91ZFRyYWlsS21zS2V5SWQ7XG5leHBvcnQgY29uc3QgY2xvdWRUcmFpbEttc0tleUFybiA9IHRhcFN0YWNrLmNsb3VkVHJhaWxLbXNLZXlBcm47XG5cbi8vIElBTSBSb2xlc1xuZXhwb3J0IGNvbnN0IGRhdGFBY2Nlc3NSb2xlQXJuID0gdGFwU3RhY2suZGF0YUFjY2Vzc1JvbGVBcm47XG5leHBvcnQgY29uc3QgYXVkaXRSb2xlQXJuID0gdGFwU3RhY2suYXVkaXRSb2xlQXJuO1xuXG4vLyBDbG91ZFRyYWlsIGV4cG9ydHNcbmV4cG9ydCBjb25zdCBjbG91ZFRyYWlsQXJuID0gdGFwU3RhY2suY2xvdWRUcmFpbEFybjtcbmV4cG9ydCBjb25zdCBjbG91ZFRyYWlsTG9nR3JvdXBBcm4gPSB0YXBTdGFjay5jbG91ZFRyYWlsTG9nR3JvdXBBcm47XG5cbi8vIFNlY3VyaXR5IFBvbGljaWVzXG5leHBvcnQgY29uc3Qgc2VjdXJpdHlQb2xpY3lBcm4gPSB0YXBTdGFjay5zZWN1cml0eVBvbGljeUFybjtcbmV4cG9ydCBjb25zdCBtZmFFbmZvcmNlbWVudFBvbGljeUFybiA9IHRhcFN0YWNrLm1mYUVuZm9yY2VtZW50UG9saWN5QXJuO1xuZXhwb3J0IGNvbnN0IGVjMkxpZmVjeWNsZVBvbGljeUFybiA9IHRhcFN0YWNrLmVjMkxpZmVjeWNsZVBvbGljeUFybjtcbmV4cG9ydCBjb25zdCBzM1NlY3VyaXR5UG9saWN5QXJuID0gdGFwU3RhY2suczNTZWN1cml0eVBvbGljeUFybjtcbmV4cG9ydCBjb25zdCBjbG91ZFRyYWlsUHJvdGVjdGlvblBvbGljeUFybiA9XG4gIHRhcFN0YWNrLmNsb3VkVHJhaWxQcm90ZWN0aW9uUG9saWN5QXJuO1xuZXhwb3J0IGNvbnN0IGttc1Byb3RlY3Rpb25Qb2xpY3lBcm4gPSB0YXBTdGFjay5rbXNQcm90ZWN0aW9uUG9saWN5QXJuO1xuXG4vLyBSZWdpb24gY29uZmlybWF0aW9uXG5leHBvcnQgY29uc3QgcmVnaW9uID0gdGFwU3RhY2sucmVnaW9uO1xuIl19