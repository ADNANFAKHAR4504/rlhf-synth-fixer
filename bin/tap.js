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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7R0FTRztBQUNILHVEQUF5QztBQUN6QyxnREFBNEM7QUFFNUMseURBQXlEO0FBQ3pELE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBRW5DLDBFQUEwRTtBQUMxRSw0RUFBNEU7QUFDNUUsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixJQUFJLEtBQUssQ0FBQztBQUVsRSxnRUFBZ0U7QUFDaEUsNkNBQTZDO0FBQzdDLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLElBQUksU0FBUyxDQUFDO0FBQ3pELE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLElBQUksU0FBUyxDQUFDO0FBRTdELDBEQUEwRDtBQUMxRCxnRUFBZ0U7QUFDaEUsNEVBQTRFO0FBQzVFLHVEQUF1RDtBQUN2RCxNQUFNLFdBQVcsR0FBRztJQUNsQixXQUFXLEVBQUUsaUJBQWlCO0lBQzlCLFVBQVUsRUFBRSxVQUFVO0lBQ3RCLE1BQU0sRUFBRSxZQUFZO0NBQ3JCLENBQUM7QUFFRiwrREFBK0Q7QUFDL0Qsd0RBQXdEO0FBQ3hELE1BQU0sS0FBSyxHQUFHLElBQUksb0JBQVEsQ0FBQyxjQUFjLEVBQUU7SUFDekMsaUJBQWlCLEVBQUUsaUJBQWlCO0lBQ3BDLElBQUksRUFBRSxXQUFXO0NBQ2xCLENBQUMsQ0FBQztBQUVILGlEQUFpRDtBQUNqRCx1REFBdUQ7QUFDdkQsOENBQThDO0FBQ2pDLFFBQUEsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7QUFDcEIsUUFBQSxlQUFlLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQztBQUN4QyxRQUFBLGdCQUFnQixHQUFHLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQztBQUMxQyxRQUFBLFVBQVUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDO0FBQzlCLFFBQUEsU0FBUyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUM7QUFDNUIsUUFBQSxvQkFBb0IsR0FBRyxLQUFLLENBQUMsb0JBQW9CLENBQUM7QUFDbEQsUUFBQSxlQUFlLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQztBQUN4QyxRQUFBLFNBQVMsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDO0FBQzVCLFFBQUEsUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUM7QUFDMUIsUUFBQSxTQUFTLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQztBQUM1QixRQUFBLFNBQVMsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDO0FBQzVCLFFBQUEsWUFBWSxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUM7QUFDbEMsUUFBQSxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztBQUN0QixRQUFBLGNBQWMsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDO0FBQ3RDLFFBQUEsb0JBQW9CLEdBQUcsS0FBSyxDQUFDLG9CQUFvQixDQUFDO0FBQ2xELFFBQUEsa0JBQWtCLEdBQUcsS0FBSyxDQUFDLGtCQUFrQixDQUFDO0FBQzlDLFFBQUEsVUFBVSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUM7QUFDOUIsUUFBQSxrQkFBa0IsR0FBRyxLQUFLLENBQUMsa0JBQWtCLENBQUM7QUFDOUMsUUFBQSxrQkFBa0IsR0FBRyxLQUFLLENBQUMsa0JBQWtCLENBQUM7QUFDOUMsUUFBQSx3QkFBd0IsR0FDbkMsS0FBSyxDQUFDLHdCQUF3QixDQUFDO0FBQ3BCLFFBQUEsV0FBVyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUM7QUFDaEMsUUFBQSxhQUFhLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogUHVsdW1pIGFwcGxpY2F0aW9uIGVudHJ5IHBvaW50IGZvciB0aGUgVEFQIChUZXN0IEF1dG9tYXRpb24gUGxhdGZvcm0pIGluZnJhc3RydWN0dXJlLlxuICpcbiAqIFRoaXMgbW9kdWxlIGRlZmluZXMgdGhlIGNvcmUgUHVsdW1pIHN0YWNrIGFuZCBpbnN0YW50aWF0ZXMgdGhlIFRhcFN0YWNrIHdpdGggYXBwcm9wcmlhdGVcbiAqIGNvbmZpZ3VyYXRpb24gYmFzZWQgb24gdGhlIGRlcGxveW1lbnQgZW52aXJvbm1lbnQuIEl0IGhhbmRsZXMgZW52aXJvbm1lbnQtc3BlY2lmaWMgc2V0dGluZ3MsXG4gKiB0YWdnaW5nLCBhbmQgZGVwbG95bWVudCBjb25maWd1cmF0aW9uIGZvciBBV1MgcmVzb3VyY2VzLlxuICpcbiAqIFRoZSBzdGFjayBjcmVhdGVkIGJ5IHRoaXMgbW9kdWxlIHVzZXMgZW52aXJvbm1lbnQgc3VmZml4ZXMgdG8gZGlzdGluZ3Vpc2ggYmV0d2VlblxuICogZGlmZmVyZW50IGRlcGxveW1lbnQgZW52aXJvbm1lbnRzIChkZXZlbG9wbWVudCwgc3RhZ2luZywgcHJvZHVjdGlvbiwgZXRjLikuXG4gKi9cbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgeyBUYXBTdGFjayB9IGZyb20gJy4uL2xpYi90YXAtc3RhY2snO1xuXG4vLyBJbml0aWFsaXplIFB1bHVtaSBjb25maWd1cmF0aW9uIGZvciB0aGUgY3VycmVudCBzdGFjay5cbmNvbnN0IGNvbmZpZyA9IG5ldyBwdWx1bWkuQ29uZmlnKCk7XG5cbi8vIEdldCB0aGUgZW52aXJvbm1lbnQgc3VmZml4IGZyb20gdGhlIFB1bHVtaSBjb25maWcsIGRlZmF1bHRpbmcgdG8gJ2RldicuXG4vLyBZb3UgY2FuIHNldCB0aGlzIHZhbHVlIHVzaW5nIHRoZSBjb21tYW5kOiBgcHVsdW1pIGNvbmZpZyBzZXQgZW52IDx2YWx1ZT5gXG5jb25zdCBlbnZpcm9ubWVudFN1ZmZpeCA9IHByb2Nlc3MuZW52LkVOVklST05NRU5UX1NVRkZJWCB8fCAnZGV2JztcblxuLy8gR2V0IG1ldGFkYXRhIGZyb20gZW52aXJvbm1lbnQgdmFyaWFibGVzIGZvciB0YWdnaW5nIHB1cnBvc2VzLlxuLy8gVGhlc2UgYXJlIG9mdGVuIGluamVjdGVkIGJ5IENJL0NEIHN5c3RlbXMuXG5jb25zdCByZXBvc2l0b3J5ID0gY29uZmlnLmdldCgncmVwb3NpdG9yeScpIHx8ICd1bmtub3duJztcbmNvbnN0IGNvbW1pdEF1dGhvciA9IGNvbmZpZy5nZXQoJ2NvbW1pdEF1dGhvcicpIHx8ICd1bmtub3duJztcblxuLy8gRGVmaW5lIGEgc2V0IG9mIGRlZmF1bHQgdGFncyB0byBhcHBseSB0byBhbGwgcmVzb3VyY2VzLlxuLy8gV2hpbGUgbm90IGV4cGxpY2l0bHkgdXNlZCBpbiB0aGUgVGFwU3RhY2sgaW5zdGFudGlhdGlvbiBoZXJlLFxuLy8gdGhpcyBpcyB0aGUgc3RhbmRhcmQgcGxhY2UgdG8gZGVmaW5lIHRoZW0uIFRoZXkgd291bGQgdHlwaWNhbGx5IGJlIHBhc3NlZFxuLy8gaW50byB0aGUgVGFwU3RhY2sgb3IgY29uZmlndXJlZCBvbiB0aGUgQVdTIHByb3ZpZGVyLlxuY29uc3QgZGVmYXVsdFRhZ3MgPSB7XG4gIEVudmlyb25tZW50OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgUmVwb3NpdG9yeTogcmVwb3NpdG9yeSxcbiAgQXV0aG9yOiBjb21taXRBdXRob3IsXG59O1xuXG4vLyBJbnN0YW50aWF0ZSB0aGUgbWFpbiBzdGFjayBjb21wb25lbnQgZm9yIHRoZSBpbmZyYXN0cnVjdHVyZS5cbi8vIFRoaXMgZW5jYXBzdWxhdGVzIGFsbCB0aGUgcmVzb3VyY2VzIGZvciB0aGUgcGxhdGZvcm0uXG5jb25zdCBzdGFjayA9IG5ldyBUYXBTdGFjaygncHVsdW1pLWluZnJhJywge1xuICBlbnZpcm9ubWVudFN1ZmZpeDogZW52aXJvbm1lbnRTdWZmaXgsXG4gIHRhZ3M6IGRlZmF1bHRUYWdzLFxufSk7XG5cbi8vIFRvIHVzZSB0aGUgc3RhY2sgb3V0cHV0cywgeW91IGNhbiBleHBvcnQgdGhlbS5cbi8vIEZvciBleGFtcGxlLCBpZiBUYXBTdGFjayBoYWQgYW4gb3V0cHV0IGBidWNrZXROYW1lYDpcbi8vIGV4cG9ydCBjb25zdCBidWNrZXROYW1lID0gc3RhY2suYnVja2V0TmFtZTtcbmV4cG9ydCBjb25zdCB2cGNJZCA9IHN0YWNrLnZwY0lkO1xuZXhwb3J0IGNvbnN0IHB1YmxpY1N1Ym5ldElkcyA9IHN0YWNrLnB1YmxpY1N1Ym5ldElkcztcbmV4cG9ydCBjb25zdCBwcml2YXRlU3VibmV0SWRzID0gc3RhY2sucHJpdmF0ZVN1Ym5ldElkcztcbmV4cG9ydCBjb25zdCBhbGJEbnNOYW1lID0gc3RhY2suYWxiRG5zTmFtZTtcbmV4cG9ydCBjb25zdCBhbGJab25lSWQgPSBzdGFjay5hbGJab25lSWQ7XG5leHBvcnQgY29uc3QgY2xvdWRGcm9udERvbWFpbk5hbWUgPSBzdGFjay5jbG91ZEZyb250RG9tYWluTmFtZTtcbmV4cG9ydCBjb25zdCBkeW5hbW9UYWJsZU5hbWUgPSBzdGFjay5keW5hbW9UYWJsZU5hbWU7XG5leHBvcnQgY29uc3Qgc2VjcmV0QXJuID0gc3RhY2suc2VjcmV0QXJuO1xuZXhwb3J0IGNvbnN0IGttc0tleUlkID0gc3RhY2sua21zS2V5SWQ7XG5leHBvcnQgY29uc3Qga21zS2V5QXJuID0gc3RhY2sua21zS2V5QXJuO1xuZXhwb3J0IGNvbnN0IHdlYkFjbEFybiA9IHN0YWNrLndlYkFjbEFybjtcbmV4cG9ydCBjb25zdCBsb2dHcm91cE5hbWUgPSBzdGFjay5sb2dHcm91cE5hbWU7XG5leHBvcnQgY29uc3QgYWxiQXJuID0gc3RhY2suYWxiQXJuO1xuZXhwb3J0IGNvbnN0IHRhcmdldEdyb3VwQXJuID0gc3RhY2sudGFyZ2V0R3JvdXBBcm47XG5leHBvcnQgY29uc3QgYXV0b1NjYWxpbmdHcm91cE5hbWUgPSBzdGFjay5hdXRvU2NhbGluZ0dyb3VwTmFtZTtcbmV4cG9ydCBjb25zdCBsYXVuY2hUZW1wbGF0ZU5hbWUgPSBzdGFjay5sYXVuY2hUZW1wbGF0ZU5hbWU7XG5leHBvcnQgY29uc3QgZWMyUm9sZUFybiA9IHN0YWNrLmVjMlJvbGVBcm47XG5leHBvcnQgY29uc3QgYWxiU2VjdXJpdHlHcm91cElkID0gc3RhY2suYWxiU2VjdXJpdHlHcm91cElkO1xuZXhwb3J0IGNvbnN0IGVjMlNlY3VyaXR5R3JvdXBJZCA9IHN0YWNrLmVjMlNlY3VyaXR5R3JvdXBJZDtcbmV4cG9ydCBjb25zdCBjbG91ZEZyb250RGlzdHJpYnV0aW9uSWQgPVxuICBzdGFjay5jbG91ZEZyb250RGlzdHJpYnV0aW9uSWQ7XG5leHBvcnQgY29uc3QgZW52aXJvbm1lbnQgPSBzdGFjay5lbnZpcm9ubWVudDtcbmV4cG9ydCBjb25zdCBzYW5pdGl6ZWROYW1lID0gc3RhY2suc2FuaXRpemVkTmFtZTsiXX0=