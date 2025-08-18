#!/usr/bin/env node
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
exports.rdsEndpoint = exports.s3BucketName = exports.albDnsName = void 0;
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
const environmentSuffix = config.get('env') || process.env.ENVIRONMENT_SUFFIX || 'dev';
// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = config.get('repository') || process.env.REPOSITORY || 'unknown';
const commitAuthor = config.get('commitAuthor') || process.env.COMMIT_AUTHOR || 'unknown';
// Define a set of default tags to apply to all resources.
const defaultTags = {
    Environment: environmentSuffix,
    Repository: repository,
    Author: commitAuthor,
    Project: 'TuringDevOps',
    ManagedBy: 'Pulumi',
};
// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const stack = new tap_stack_1.TapStack('tap-stack', {
    environmentSuffix,
    tags: defaultTags,
});
// Export the stack outputs for use by other stacks or external systems
exports.albDnsName = stack.albDnsName;
exports.s3BucketName = stack.s3BucketName;
exports.rdsEndpoint = stack.rdsEndpoint;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQTs7Ozs7Ozs7O0dBU0c7QUFDSCx1REFBeUM7QUFDekMsZ0RBQTRDO0FBRTVDLHlEQUF5RDtBQUN6RCxNQUFNLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUVuQywwRUFBMEU7QUFDMUUsNEVBQTRFO0FBQzVFLE1BQU0saUJBQWlCLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixJQUFJLEtBQUssQ0FBQztBQUV2RixnRUFBZ0U7QUFDaEUsNkNBQTZDO0FBQzdDLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLElBQUksU0FBUyxDQUFDO0FBQ25GLE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLElBQUksU0FBUyxDQUFDO0FBRTFGLDBEQUEwRDtBQUMxRCxNQUFNLFdBQVcsR0FBRztJQUNsQixXQUFXLEVBQUUsaUJBQWlCO0lBQzlCLFVBQVUsRUFBRSxVQUFVO0lBQ3RCLE1BQU0sRUFBRSxZQUFZO0lBQ3BCLE9BQU8sRUFBRSxjQUFjO0lBQ3ZCLFNBQVMsRUFBRSxRQUFRO0NBQ3BCLENBQUM7QUFFRiwrREFBK0Q7QUFDL0Qsd0RBQXdEO0FBQ3hELE1BQU0sS0FBSyxHQUFHLElBQUksb0JBQVEsQ0FBQyxXQUFXLEVBQUU7SUFDdEMsaUJBQWlCO0lBQ2pCLElBQUksRUFBRSxXQUFXO0NBQ2xCLENBQUMsQ0FBQztBQUVILHVFQUF1RTtBQUMxRCxRQUFBLFVBQVUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDO0FBQzlCLFFBQUEsWUFBWSxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUM7QUFDbEMsUUFBQSxXQUFXLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcbi8qKlxuICogUHVsdW1pIGFwcGxpY2F0aW9uIGVudHJ5IHBvaW50IGZvciB0aGUgVEFQIChUZXN0IEF1dG9tYXRpb24gUGxhdGZvcm0pIGluZnJhc3RydWN0dXJlLlxuICpcbiAqIFRoaXMgbW9kdWxlIGRlZmluZXMgdGhlIGNvcmUgUHVsdW1pIHN0YWNrIGFuZCBpbnN0YW50aWF0ZXMgdGhlIFRhcFN0YWNrIHdpdGggYXBwcm9wcmlhdGVcbiAqIGNvbmZpZ3VyYXRpb24gYmFzZWQgb24gdGhlIGRlcGxveW1lbnQgZW52aXJvbm1lbnQuIEl0IGhhbmRsZXMgZW52aXJvbm1lbnQtc3BlY2lmaWMgc2V0dGluZ3MsXG4gKiB0YWdnaW5nLCBhbmQgZGVwbG95bWVudCBjb25maWd1cmF0aW9uIGZvciBBV1MgcmVzb3VyY2VzLlxuICpcbiAqIFRoZSBzdGFjayBjcmVhdGVkIGJ5IHRoaXMgbW9kdWxlIHVzZXMgZW52aXJvbm1lbnQgc3VmZml4ZXMgdG8gZGlzdGluZ3Vpc2ggYmV0d2VlblxuICogZGlmZmVyZW50IGRlcGxveW1lbnQgZW52aXJvbm1lbnRzIChkZXZlbG9wbWVudCwgc3RhZ2luZywgcHJvZHVjdGlvbiwgZXRjLikuXG4gKi9cbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgeyBUYXBTdGFjayB9IGZyb20gJy4uL2xpYi90YXAtc3RhY2snO1xuXG4vLyBJbml0aWFsaXplIFB1bHVtaSBjb25maWd1cmF0aW9uIGZvciB0aGUgY3VycmVudCBzdGFjay5cbmNvbnN0IGNvbmZpZyA9IG5ldyBwdWx1bWkuQ29uZmlnKCk7XG5cbi8vIEdldCB0aGUgZW52aXJvbm1lbnQgc3VmZml4IGZyb20gdGhlIFB1bHVtaSBjb25maWcsIGRlZmF1bHRpbmcgdG8gJ2RldicuXG4vLyBZb3UgY2FuIHNldCB0aGlzIHZhbHVlIHVzaW5nIHRoZSBjb21tYW5kOiBgcHVsdW1pIGNvbmZpZyBzZXQgZW52IDx2YWx1ZT5gXG5jb25zdCBlbnZpcm9ubWVudFN1ZmZpeCA9IGNvbmZpZy5nZXQoJ2VudicpIHx8IHByb2Nlc3MuZW52LkVOVklST05NRU5UX1NVRkZJWCB8fCAnZGV2JztcblxuLy8gR2V0IG1ldGFkYXRhIGZyb20gZW52aXJvbm1lbnQgdmFyaWFibGVzIGZvciB0YWdnaW5nIHB1cnBvc2VzLlxuLy8gVGhlc2UgYXJlIG9mdGVuIGluamVjdGVkIGJ5IENJL0NEIHN5c3RlbXMuXG5jb25zdCByZXBvc2l0b3J5ID0gY29uZmlnLmdldCgncmVwb3NpdG9yeScpIHx8IHByb2Nlc3MuZW52LlJFUE9TSVRPUlkgfHwgJ3Vua25vd24nO1xuY29uc3QgY29tbWl0QXV0aG9yID0gY29uZmlnLmdldCgnY29tbWl0QXV0aG9yJykgfHwgcHJvY2Vzcy5lbnYuQ09NTUlUX0FVVEhPUiB8fCAndW5rbm93bic7XG5cbi8vIERlZmluZSBhIHNldCBvZiBkZWZhdWx0IHRhZ3MgdG8gYXBwbHkgdG8gYWxsIHJlc291cmNlcy5cbmNvbnN0IGRlZmF1bHRUYWdzID0ge1xuICBFbnZpcm9ubWVudDogZW52aXJvbm1lbnRTdWZmaXgsXG4gIFJlcG9zaXRvcnk6IHJlcG9zaXRvcnksXG4gIEF1dGhvcjogY29tbWl0QXV0aG9yLFxuICBQcm9qZWN0OiAnVHVyaW5nRGV2T3BzJyxcbiAgTWFuYWdlZEJ5OiAnUHVsdW1pJyxcbn07XG5cbi8vIEluc3RhbnRpYXRlIHRoZSBtYWluIHN0YWNrIGNvbXBvbmVudCBmb3IgdGhlIGluZnJhc3RydWN0dXJlLlxuLy8gVGhpcyBlbmNhcHN1bGF0ZXMgYWxsIHRoZSByZXNvdXJjZXMgZm9yIHRoZSBwbGF0Zm9ybS5cbmNvbnN0IHN0YWNrID0gbmV3IFRhcFN0YWNrKCd0YXAtc3RhY2snLCB7XG4gIGVudmlyb25tZW50U3VmZml4LFxuICB0YWdzOiBkZWZhdWx0VGFncyxcbn0pO1xuXG4vLyBFeHBvcnQgdGhlIHN0YWNrIG91dHB1dHMgZm9yIHVzZSBieSBvdGhlciBzdGFja3Mgb3IgZXh0ZXJuYWwgc3lzdGVtc1xuZXhwb3J0IGNvbnN0IGFsYkRuc05hbWUgPSBzdGFjay5hbGJEbnNOYW1lO1xuZXhwb3J0IGNvbnN0IHMzQnVja2V0TmFtZSA9IHN0YWNrLnMzQnVja2V0TmFtZTtcbmV4cG9ydCBjb25zdCByZHNFbmRwb2ludCA9IHN0YWNrLnJkc0VuZHBvaW50OyJdfQ==