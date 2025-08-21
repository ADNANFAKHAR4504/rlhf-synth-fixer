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
new tap_stack_1.TapStack('pulumi-infra', {
    tags: defaultTags,
});
// To use the stack outputs, you can export them.
// For example, if TapStack had an output `bucketName`:
// export const bucketName = stack.bucketName;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7Ozs7OztHQVNHO0FBQ0gsdURBQXlDO0FBQ3pDLGdEQUE0QztBQUU1Qyx5REFBeUQ7QUFDekQsTUFBTSxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7QUFFbkMsMEVBQTBFO0FBQzFFLDRFQUE0RTtBQUM1RSxNQUFNLGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDO0FBRXJELGdFQUFnRTtBQUNoRSw2Q0FBNkM7QUFDN0MsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsSUFBSSxTQUFTLENBQUM7QUFDekQsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsSUFBSSxTQUFTLENBQUM7QUFFN0QsMERBQTBEO0FBQzFELGdFQUFnRTtBQUNoRSw0RUFBNEU7QUFDNUUsdURBQXVEO0FBQ3ZELE1BQU0sV0FBVyxHQUFHO0lBQ2xCLFdBQVcsRUFBRSxpQkFBaUI7SUFDOUIsVUFBVSxFQUFFLFVBQVU7SUFDdEIsTUFBTSxFQUFFLFlBQVk7Q0FDckIsQ0FBQztBQUVGLCtEQUErRDtBQUMvRCx3REFBd0Q7QUFDeEQsSUFBSSxvQkFBUSxDQUFDLGNBQWMsRUFBRTtJQUMzQixJQUFJLEVBQUUsV0FBVztDQUNsQixDQUFDLENBQUM7QUFFSCxpREFBaUQ7QUFDakQsdURBQXVEO0FBQ3ZELDhDQUE4QyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogUHVsdW1pIGFwcGxpY2F0aW9uIGVudHJ5IHBvaW50IGZvciB0aGUgVEFQIChUZXN0IEF1dG9tYXRpb24gUGxhdGZvcm0pIGluZnJhc3RydWN0dXJlLlxuICpcbiAqIFRoaXMgbW9kdWxlIGRlZmluZXMgdGhlIGNvcmUgUHVsdW1pIHN0YWNrIGFuZCBpbnN0YW50aWF0ZXMgdGhlIFRhcFN0YWNrIHdpdGggYXBwcm9wcmlhdGVcbiAqIGNvbmZpZ3VyYXRpb24gYmFzZWQgb24gdGhlIGRlcGxveW1lbnQgZW52aXJvbm1lbnQuIEl0IGhhbmRsZXMgZW52aXJvbm1lbnQtc3BlY2lmaWMgc2V0dGluZ3MsXG4gKiB0YWdnaW5nLCBhbmQgZGVwbG95bWVudCBjb25maWd1cmF0aW9uIGZvciBBV1MgcmVzb3VyY2VzLlxuICpcbiAqIFRoZSBzdGFjayBjcmVhdGVkIGJ5IHRoaXMgbW9kdWxlIHVzZXMgZW52aXJvbm1lbnQgc3VmZml4ZXMgdG8gZGlzdGluZ3Vpc2ggYmV0d2VlblxuICogZGlmZmVyZW50IGRlcGxveW1lbnQgZW52aXJvbm1lbnRzIChkZXZlbG9wbWVudCwgc3RhZ2luZywgcHJvZHVjdGlvbiwgZXRjLikuXG4gKi9cbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgeyBUYXBTdGFjayB9IGZyb20gJy4uL2xpYi90YXAtc3RhY2snO1xuXG4vLyBJbml0aWFsaXplIFB1bHVtaSBjb25maWd1cmF0aW9uIGZvciB0aGUgY3VycmVudCBzdGFjay5cbmNvbnN0IGNvbmZpZyA9IG5ldyBwdWx1bWkuQ29uZmlnKCk7XG5cbi8vIEdldCB0aGUgZW52aXJvbm1lbnQgc3VmZml4IGZyb20gdGhlIFB1bHVtaSBjb25maWcsIGRlZmF1bHRpbmcgdG8gJ2RldicuXG4vLyBZb3UgY2FuIHNldCB0aGlzIHZhbHVlIHVzaW5nIHRoZSBjb21tYW5kOiBgcHVsdW1pIGNvbmZpZyBzZXQgZW52IDx2YWx1ZT5gXG5jb25zdCBlbnZpcm9ubWVudFN1ZmZpeCA9IGNvbmZpZy5nZXQoJ2VudicpIHx8ICdkZXYnO1xuXG4vLyBHZXQgbWV0YWRhdGEgZnJvbSBlbnZpcm9ubWVudCB2YXJpYWJsZXMgZm9yIHRhZ2dpbmcgcHVycG9zZXMuXG4vLyBUaGVzZSBhcmUgb2Z0ZW4gaW5qZWN0ZWQgYnkgQ0kvQ0Qgc3lzdGVtcy5cbmNvbnN0IHJlcG9zaXRvcnkgPSBjb25maWcuZ2V0KCdyZXBvc2l0b3J5JykgfHwgJ3Vua25vd24nO1xuY29uc3QgY29tbWl0QXV0aG9yID0gY29uZmlnLmdldCgnY29tbWl0QXV0aG9yJykgfHwgJ3Vua25vd24nO1xuXG4vLyBEZWZpbmUgYSBzZXQgb2YgZGVmYXVsdCB0YWdzIHRvIGFwcGx5IHRvIGFsbCByZXNvdXJjZXMuXG4vLyBXaGlsZSBub3QgZXhwbGljaXRseSB1c2VkIGluIHRoZSBUYXBTdGFjayBpbnN0YW50aWF0aW9uIGhlcmUsXG4vLyB0aGlzIGlzIHRoZSBzdGFuZGFyZCBwbGFjZSB0byBkZWZpbmUgdGhlbS4gVGhleSB3b3VsZCB0eXBpY2FsbHkgYmUgcGFzc2VkXG4vLyBpbnRvIHRoZSBUYXBTdGFjayBvciBjb25maWd1cmVkIG9uIHRoZSBBV1MgcHJvdmlkZXIuXG5jb25zdCBkZWZhdWx0VGFncyA9IHtcbiAgRW52aXJvbm1lbnQ6IGVudmlyb25tZW50U3VmZml4LFxuICBSZXBvc2l0b3J5OiByZXBvc2l0b3J5LFxuICBBdXRob3I6IGNvbW1pdEF1dGhvcixcbn07XG5cbi8vIEluc3RhbnRpYXRlIHRoZSBtYWluIHN0YWNrIGNvbXBvbmVudCBmb3IgdGhlIGluZnJhc3RydWN0dXJlLlxuLy8gVGhpcyBlbmNhcHN1bGF0ZXMgYWxsIHRoZSByZXNvdXJjZXMgZm9yIHRoZSBwbGF0Zm9ybS5cbm5ldyBUYXBTdGFjaygncHVsdW1pLWluZnJhJywge1xuICB0YWdzOiBkZWZhdWx0VGFncyxcbn0pO1xuXG4vLyBUbyB1c2UgdGhlIHN0YWNrIG91dHB1dHMsIHlvdSBjYW4gZXhwb3J0IHRoZW0uXG4vLyBGb3IgZXhhbXBsZSwgaWYgVGFwU3RhY2sgaGFkIGFuIG91dHB1dCBgYnVja2V0TmFtZWA6XG4vLyBleHBvcnQgY29uc3QgYnVja2V0TmFtZSA9IHN0YWNrLmJ1Y2tldE5hbWU7XG4iXX0=