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
exports.databaseEndpoint = exports.staticAssetsUrl = exports.staticAssetsBucketName = exports.loadBalancerDns = exports.vpcId = void 0;
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
// Get the environment suffix from environment variable or Pulumi config
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';
// Check if we should skip database creation (for quota issues)
const skipDatabase = process.env.SKIP_DATABASE === 'true' ||
    config.getBoolean('skipDatabase') ||
    false;
// Check if we should skip auto scaling group (for instance quota issues)
const skipAutoScaling = process.env.SKIP_AUTO_SCALING === 'true' ||
    config.getBoolean('skipAutoScaling') ||
    false;
// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = config.get('repository') || 'unknown';
const commitAuthor = config.get('commitAuthor') || 'unknown';
// Define a set of default tags to apply to all resources.
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
    skipDatabase: skipDatabase,
    skipAutoScaling: skipAutoScaling,
});
// Export stack outputs
exports.vpcId = stack.vpcId;
exports.loadBalancerDns = stack.loadBalancerDns;
exports.staticAssetsBucketName = stack.staticAssetsBucketName;
exports.staticAssetsUrl = stack.staticAssetsUrl;
exports.databaseEndpoint = stack.databaseEndpoint;
// To use the stack outputs, you can export them.
// For example, if TapStack had an output `bucketName`:
// export const bucketName = stack.bucketName;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7R0FTRztBQUNILHVEQUF5QztBQUN6QyxnREFBNEM7QUFFNUMseURBQXlEO0FBQ3pELE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBRW5DLHdFQUF3RTtBQUN4RSxNQUFNLGlCQUFpQixHQUNyQixPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixJQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDO0FBRS9ELCtEQUErRDtBQUMvRCxNQUFNLFlBQVksR0FDaEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEtBQUssTUFBTTtJQUNwQyxNQUFNLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQztJQUNqQyxLQUFLLENBQUM7QUFFUix5RUFBeUU7QUFDekUsTUFBTSxlQUFlLEdBQ25CLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLEtBQUssTUFBTTtJQUN4QyxNQUFNLENBQUMsVUFBVSxDQUFDLGlCQUFpQixDQUFDO0lBQ3BDLEtBQUssQ0FBQztBQUVSLGdFQUFnRTtBQUNoRSw2Q0FBNkM7QUFDN0MsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsSUFBSSxTQUFTLENBQUM7QUFDekQsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsSUFBSSxTQUFTLENBQUM7QUFFN0QsMERBQTBEO0FBQzFELE1BQU0sV0FBVyxHQUFHO0lBQ2xCLFdBQVcsRUFBRSxpQkFBaUI7SUFDOUIsVUFBVSxFQUFFLFVBQVU7SUFDdEIsTUFBTSxFQUFFLFlBQVk7Q0FDckIsQ0FBQztBQUVGLCtEQUErRDtBQUMvRCx3REFBd0Q7QUFDeEQsTUFBTSxLQUFLLEdBQUcsSUFBSSxvQkFBUSxDQUFDLGNBQWMsRUFBRTtJQUN6QyxpQkFBaUIsRUFBRSxpQkFBaUI7SUFDcEMsSUFBSSxFQUFFLFdBQVc7SUFDakIsWUFBWSxFQUFFLFlBQVk7SUFDMUIsZUFBZSxFQUFFLGVBQWU7Q0FDakMsQ0FBQyxDQUFDO0FBRUgsdUJBQXVCO0FBQ1YsUUFBQSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQztBQUNwQixRQUFBLGVBQWUsR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDO0FBQ3hDLFFBQUEsc0JBQXNCLEdBQUcsS0FBSyxDQUFDLHNCQUFzQixDQUFDO0FBQ3RELFFBQUEsZUFBZSxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUM7QUFDeEMsUUFBQSxnQkFBZ0IsR0FBRyxLQUFLLENBQUMsZ0JBQWdCLENBQUM7QUFFdkQsaURBQWlEO0FBQ2pELHVEQUF1RDtBQUN2RCw4Q0FBOEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFB1bHVtaSBhcHBsaWNhdGlvbiBlbnRyeSBwb2ludCBmb3IgdGhlIFRBUCAoVGVzdCBBdXRvbWF0aW9uIFBsYXRmb3JtKSBpbmZyYXN0cnVjdHVyZS5cbiAqXG4gKiBUaGlzIG1vZHVsZSBkZWZpbmVzIHRoZSBjb3JlIFB1bHVtaSBzdGFjayBhbmQgaW5zdGFudGlhdGVzIHRoZSBUYXBTdGFjayB3aXRoIGFwcHJvcHJpYXRlXG4gKiBjb25maWd1cmF0aW9uIGJhc2VkIG9uIHRoZSBkZXBsb3ltZW50IGVudmlyb25tZW50LiBJdCBoYW5kbGVzIGVudmlyb25tZW50LXNwZWNpZmljIHNldHRpbmdzLFxuICogdGFnZ2luZywgYW5kIGRlcGxveW1lbnQgY29uZmlndXJhdGlvbiBmb3IgQVdTIHJlc291cmNlcy5cbiAqXG4gKiBUaGUgc3RhY2sgY3JlYXRlZCBieSB0aGlzIG1vZHVsZSB1c2VzIGVudmlyb25tZW50IHN1ZmZpeGVzIHRvIGRpc3Rpbmd1aXNoIGJldHdlZW5cbiAqIGRpZmZlcmVudCBkZXBsb3ltZW50IGVudmlyb25tZW50cyAoZGV2ZWxvcG1lbnQsIHN0YWdpbmcsIHByb2R1Y3Rpb24sIGV0Yy4pLlxuICovXG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0IHsgVGFwU3RhY2sgfSBmcm9tICcuLi9saWIvdGFwLXN0YWNrJztcblxuLy8gSW5pdGlhbGl6ZSBQdWx1bWkgY29uZmlndXJhdGlvbiBmb3IgdGhlIGN1cnJlbnQgc3RhY2suXG5jb25zdCBjb25maWcgPSBuZXcgcHVsdW1pLkNvbmZpZygpO1xuXG4vLyBHZXQgdGhlIGVudmlyb25tZW50IHN1ZmZpeCBmcm9tIGVudmlyb25tZW50IHZhcmlhYmxlIG9yIFB1bHVtaSBjb25maWdcbmNvbnN0IGVudmlyb25tZW50U3VmZml4ID1cbiAgcHJvY2Vzcy5lbnYuRU5WSVJPTk1FTlRfU1VGRklYIHx8IGNvbmZpZy5nZXQoJ2VudicpIHx8ICdkZXYnO1xuXG4vLyBDaGVjayBpZiB3ZSBzaG91bGQgc2tpcCBkYXRhYmFzZSBjcmVhdGlvbiAoZm9yIHF1b3RhIGlzc3VlcylcbmNvbnN0IHNraXBEYXRhYmFzZSA9XG4gIHByb2Nlc3MuZW52LlNLSVBfREFUQUJBU0UgPT09ICd0cnVlJyB8fFxuICBjb25maWcuZ2V0Qm9vbGVhbignc2tpcERhdGFiYXNlJykgfHxcbiAgZmFsc2U7XG5cbi8vIENoZWNrIGlmIHdlIHNob3VsZCBza2lwIGF1dG8gc2NhbGluZyBncm91cCAoZm9yIGluc3RhbmNlIHF1b3RhIGlzc3VlcylcbmNvbnN0IHNraXBBdXRvU2NhbGluZyA9XG4gIHByb2Nlc3MuZW52LlNLSVBfQVVUT19TQ0FMSU5HID09PSAndHJ1ZScgfHxcbiAgY29uZmlnLmdldEJvb2xlYW4oJ3NraXBBdXRvU2NhbGluZycpIHx8XG4gIGZhbHNlO1xuXG4vLyBHZXQgbWV0YWRhdGEgZnJvbSBlbnZpcm9ubWVudCB2YXJpYWJsZXMgZm9yIHRhZ2dpbmcgcHVycG9zZXMuXG4vLyBUaGVzZSBhcmUgb2Z0ZW4gaW5qZWN0ZWQgYnkgQ0kvQ0Qgc3lzdGVtcy5cbmNvbnN0IHJlcG9zaXRvcnkgPSBjb25maWcuZ2V0KCdyZXBvc2l0b3J5JykgfHwgJ3Vua25vd24nO1xuY29uc3QgY29tbWl0QXV0aG9yID0gY29uZmlnLmdldCgnY29tbWl0QXV0aG9yJykgfHwgJ3Vua25vd24nO1xuXG4vLyBEZWZpbmUgYSBzZXQgb2YgZGVmYXVsdCB0YWdzIHRvIGFwcGx5IHRvIGFsbCByZXNvdXJjZXMuXG5jb25zdCBkZWZhdWx0VGFncyA9IHtcbiAgRW52aXJvbm1lbnQ6IGVudmlyb25tZW50U3VmZml4LFxuICBSZXBvc2l0b3J5OiByZXBvc2l0b3J5LFxuICBBdXRob3I6IGNvbW1pdEF1dGhvcixcbn07XG5cbi8vIEluc3RhbnRpYXRlIHRoZSBtYWluIHN0YWNrIGNvbXBvbmVudCBmb3IgdGhlIGluZnJhc3RydWN0dXJlLlxuLy8gVGhpcyBlbmNhcHN1bGF0ZXMgYWxsIHRoZSByZXNvdXJjZXMgZm9yIHRoZSBwbGF0Zm9ybS5cbmNvbnN0IHN0YWNrID0gbmV3IFRhcFN0YWNrKCdwdWx1bWktaW5mcmEnLCB7XG4gIGVudmlyb25tZW50U3VmZml4OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgdGFnczogZGVmYXVsdFRhZ3MsXG4gIHNraXBEYXRhYmFzZTogc2tpcERhdGFiYXNlLFxuICBza2lwQXV0b1NjYWxpbmc6IHNraXBBdXRvU2NhbGluZyxcbn0pO1xuXG4vLyBFeHBvcnQgc3RhY2sgb3V0cHV0c1xuZXhwb3J0IGNvbnN0IHZwY0lkID0gc3RhY2sudnBjSWQ7XG5leHBvcnQgY29uc3QgbG9hZEJhbGFuY2VyRG5zID0gc3RhY2subG9hZEJhbGFuY2VyRG5zO1xuZXhwb3J0IGNvbnN0IHN0YXRpY0Fzc2V0c0J1Y2tldE5hbWUgPSBzdGFjay5zdGF0aWNBc3NldHNCdWNrZXROYW1lO1xuZXhwb3J0IGNvbnN0IHN0YXRpY0Fzc2V0c1VybCA9IHN0YWNrLnN0YXRpY0Fzc2V0c1VybDtcbmV4cG9ydCBjb25zdCBkYXRhYmFzZUVuZHBvaW50ID0gc3RhY2suZGF0YWJhc2VFbmRwb2ludDtcblxuLy8gVG8gdXNlIHRoZSBzdGFjayBvdXRwdXRzLCB5b3UgY2FuIGV4cG9ydCB0aGVtLlxuLy8gRm9yIGV4YW1wbGUsIGlmIFRhcFN0YWNrIGhhZCBhbiBvdXRwdXQgYGJ1Y2tldE5hbWVgOlxuLy8gZXhwb3J0IGNvbnN0IGJ1Y2tldE5hbWUgPSBzdGFjay5idWNrZXROYW1lO1xuIl19