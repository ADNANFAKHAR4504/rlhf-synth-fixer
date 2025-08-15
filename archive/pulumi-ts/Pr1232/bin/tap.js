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
exports.kmsKeyArns = exports.cloudtrailBucketName = exports.webAclArn = exports.cloudtrailArn = exports.rdsEndpoints = exports.ec2InstanceIds = exports.vpcIds = void 0;
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
// Get the environment suffix from the environment variable, defaulting to 'dev'.
// This is typically set by CI/CD systems or deployment scripts.
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
    environmentSuffix: environmentSuffix,
    tags: defaultTags,
});
// Export stack outputs for integration testing and CI/CD pipeline
// These outputs will be available via `pulumi stack output` command
exports.vpcIds = tapStack.vpcIds;
exports.ec2InstanceIds = tapStack.ec2InstanceIds;
exports.rdsEndpoints = tapStack.rdsEndpoints;
exports.cloudtrailArn = tapStack.cloudtrailArn;
exports.webAclArn = tapStack.webAclArn;
exports.cloudtrailBucketName = tapStack.cloudtrailBucketName;
exports.kmsKeyArns = tapStack.kmsKeyArns;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7R0FTRztBQUNILHVEQUF5QztBQUN6QyxnREFBNEM7QUFFNUMseURBQXlEO0FBQ3pELE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBRW5DLGlGQUFpRjtBQUNqRixnRUFBZ0U7QUFDaEUsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixJQUFJLEtBQUssQ0FBQztBQUVsRSxnRUFBZ0U7QUFDaEUsNkNBQTZDO0FBQzdDLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLElBQUksU0FBUyxDQUFDO0FBQ3pELE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLElBQUksU0FBUyxDQUFDO0FBRTdELDBEQUEwRDtBQUMxRCxnRUFBZ0U7QUFDaEUsNEVBQTRFO0FBQzVFLHVEQUF1RDtBQUN2RCxNQUFNLFdBQVcsR0FBRztJQUNsQixXQUFXLEVBQUUsaUJBQWlCO0lBQzlCLFVBQVUsRUFBRSxVQUFVO0lBQ3RCLE1BQU0sRUFBRSxZQUFZO0NBQ3JCLENBQUM7QUFFRiwrREFBK0Q7QUFDL0Qsd0RBQXdEO0FBQ3hELE1BQU0sUUFBUSxHQUFHLElBQUksb0JBQVEsQ0FBQyxjQUFjLEVBQUU7SUFDNUMsaUJBQWlCLEVBQUUsaUJBQWlCO0lBQ3BDLElBQUksRUFBRSxXQUFXO0NBQ2xCLENBQUMsQ0FBQztBQUVILGtFQUFrRTtBQUNsRSxvRUFBb0U7QUFDdkQsUUFBQSxNQUFNLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQztBQUN6QixRQUFBLGNBQWMsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDO0FBQ3pDLFFBQUEsWUFBWSxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUM7QUFDckMsUUFBQSxhQUFhLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQztBQUN2QyxRQUFBLFNBQVMsR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDO0FBQy9CLFFBQUEsb0JBQW9CLEdBQUcsUUFBUSxDQUFDLG9CQUFvQixDQUFDO0FBQ3JELFFBQUEsVUFBVSxHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFB1bHVtaSBhcHBsaWNhdGlvbiBlbnRyeSBwb2ludCBmb3IgdGhlIFRBUCAoVGVzdCBBdXRvbWF0aW9uIFBsYXRmb3JtKSBpbmZyYXN0cnVjdHVyZS5cbiAqXG4gKiBUaGlzIG1vZHVsZSBkZWZpbmVzIHRoZSBjb3JlIFB1bHVtaSBzdGFjayBhbmQgaW5zdGFudGlhdGVzIHRoZSBUYXBTdGFjayB3aXRoIGFwcHJvcHJpYXRlXG4gKiBjb25maWd1cmF0aW9uIGJhc2VkIG9uIHRoZSBkZXBsb3ltZW50IGVudmlyb25tZW50LiBJdCBoYW5kbGVzIGVudmlyb25tZW50LXNwZWNpZmljIHNldHRpbmdzLFxuICogdGFnZ2luZywgYW5kIGRlcGxveW1lbnQgY29uZmlndXJhdGlvbiBmb3IgQVdTIHJlc291cmNlcy5cbiAqXG4gKiBUaGUgc3RhY2sgY3JlYXRlZCBieSB0aGlzIG1vZHVsZSB1c2VzIGVudmlyb25tZW50IHN1ZmZpeGVzIHRvIGRpc3Rpbmd1aXNoIGJldHdlZW5cbiAqIGRpZmZlcmVudCBkZXBsb3ltZW50IGVudmlyb25tZW50cyAoZGV2ZWxvcG1lbnQsIHN0YWdpbmcsIHByb2R1Y3Rpb24sIGV0Yy4pLlxuICovXG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0IHsgVGFwU3RhY2sgfSBmcm9tICcuLi9saWIvdGFwLXN0YWNrJztcblxuLy8gSW5pdGlhbGl6ZSBQdWx1bWkgY29uZmlndXJhdGlvbiBmb3IgdGhlIGN1cnJlbnQgc3RhY2suXG5jb25zdCBjb25maWcgPSBuZXcgcHVsdW1pLkNvbmZpZygpO1xuXG4vLyBHZXQgdGhlIGVudmlyb25tZW50IHN1ZmZpeCBmcm9tIHRoZSBlbnZpcm9ubWVudCB2YXJpYWJsZSwgZGVmYXVsdGluZyB0byAnZGV2Jy5cbi8vIFRoaXMgaXMgdHlwaWNhbGx5IHNldCBieSBDSS9DRCBzeXN0ZW1zIG9yIGRlcGxveW1lbnQgc2NyaXB0cy5cbmNvbnN0IGVudmlyb25tZW50U3VmZml4ID0gcHJvY2Vzcy5lbnYuRU5WSVJPTk1FTlRfU1VGRklYIHx8ICdkZXYnO1xuXG4vLyBHZXQgbWV0YWRhdGEgZnJvbSBlbnZpcm9ubWVudCB2YXJpYWJsZXMgZm9yIHRhZ2dpbmcgcHVycG9zZXMuXG4vLyBUaGVzZSBhcmUgb2Z0ZW4gaW5qZWN0ZWQgYnkgQ0kvQ0Qgc3lzdGVtcy5cbmNvbnN0IHJlcG9zaXRvcnkgPSBjb25maWcuZ2V0KCdyZXBvc2l0b3J5JykgfHwgJ3Vua25vd24nO1xuY29uc3QgY29tbWl0QXV0aG9yID0gY29uZmlnLmdldCgnY29tbWl0QXV0aG9yJykgfHwgJ3Vua25vd24nO1xuXG4vLyBEZWZpbmUgYSBzZXQgb2YgZGVmYXVsdCB0YWdzIHRvIGFwcGx5IHRvIGFsbCByZXNvdXJjZXMuXG4vLyBXaGlsZSBub3QgZXhwbGljaXRseSB1c2VkIGluIHRoZSBUYXBTdGFjayBpbnN0YW50aWF0aW9uIGhlcmUsXG4vLyB0aGlzIGlzIHRoZSBzdGFuZGFyZCBwbGFjZSB0byBkZWZpbmUgdGhlbS4gVGhleSB3b3VsZCB0eXBpY2FsbHkgYmUgcGFzc2VkXG4vLyBpbnRvIHRoZSBUYXBTdGFjayBvciBjb25maWd1cmVkIG9uIHRoZSBBV1MgcHJvdmlkZXIuXG5jb25zdCBkZWZhdWx0VGFncyA9IHtcbiAgRW52aXJvbm1lbnQ6IGVudmlyb25tZW50U3VmZml4LFxuICBSZXBvc2l0b3J5OiByZXBvc2l0b3J5LFxuICBBdXRob3I6IGNvbW1pdEF1dGhvcixcbn07XG5cbi8vIEluc3RhbnRpYXRlIHRoZSBtYWluIHN0YWNrIGNvbXBvbmVudCBmb3IgdGhlIGluZnJhc3RydWN0dXJlLlxuLy8gVGhpcyBlbmNhcHN1bGF0ZXMgYWxsIHRoZSByZXNvdXJjZXMgZm9yIHRoZSBwbGF0Zm9ybS5cbmNvbnN0IHRhcFN0YWNrID0gbmV3IFRhcFN0YWNrKCdwdWx1bWktaW5mcmEnLCB7XG4gIGVudmlyb25tZW50U3VmZml4OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgdGFnczogZGVmYXVsdFRhZ3MsXG59KTtcblxuLy8gRXhwb3J0IHN0YWNrIG91dHB1dHMgZm9yIGludGVncmF0aW9uIHRlc3RpbmcgYW5kIENJL0NEIHBpcGVsaW5lXG4vLyBUaGVzZSBvdXRwdXRzIHdpbGwgYmUgYXZhaWxhYmxlIHZpYSBgcHVsdW1pIHN0YWNrIG91dHB1dGAgY29tbWFuZFxuZXhwb3J0IGNvbnN0IHZwY0lkcyA9IHRhcFN0YWNrLnZwY0lkcztcbmV4cG9ydCBjb25zdCBlYzJJbnN0YW5jZUlkcyA9IHRhcFN0YWNrLmVjMkluc3RhbmNlSWRzO1xuZXhwb3J0IGNvbnN0IHJkc0VuZHBvaW50cyA9IHRhcFN0YWNrLnJkc0VuZHBvaW50cztcbmV4cG9ydCBjb25zdCBjbG91ZHRyYWlsQXJuID0gdGFwU3RhY2suY2xvdWR0cmFpbEFybjtcbmV4cG9ydCBjb25zdCB3ZWJBY2xBcm4gPSB0YXBTdGFjay53ZWJBY2xBcm47XG5leHBvcnQgY29uc3QgY2xvdWR0cmFpbEJ1Y2tldE5hbWUgPSB0YXBTdGFjay5jbG91ZHRyYWlsQnVja2V0TmFtZTtcbmV4cG9ydCBjb25zdCBrbXNLZXlBcm5zID0gdGFwU3RhY2sua21zS2V5QXJucztcbiJdfQ==