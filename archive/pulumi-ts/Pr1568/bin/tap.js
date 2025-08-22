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
exports.functionName = exports.tableName = exports.apiUrl = void 0;
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
// Priority: ENVIRONMENT_SUFFIX env var > Pulumi config > default
const envSuffixFromEnv = process.env.ENVIRONMENT_SUFFIX;
const envSuffixFromConfig = config.get('environmentSuffix');
const environmentSuffix = envSuffixFromEnv || envSuffixFromConfig || 'synthtrainr121';
// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = config.get('repository') || process.env.REPOSITORY || 'unknown';
const commitAuthor = config.get('commitAuthor') || process.env.COMMIT_AUTHOR || 'unknown';
// Define a set of default tags to apply to all resources.
const defaultTags = {
    Environment: environmentSuffix,
    Repository: repository,
    Author: commitAuthor,
    ManagedBy: 'Pulumi',
};
// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const stack = new tap_stack_1.TapStack('tap-stack', {
    environmentSuffix: environmentSuffix,
    tags: defaultTags,
});
// Export stack outputs for integration with other systems
exports.apiUrl = stack.apiUrl;
exports.tableName = stack.tableName;
exports.functionName = stack.functionName;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7R0FTRztBQUNILHVEQUF5QztBQUN6QyxnREFBNEM7QUFFNUMseURBQXlEO0FBQ3pELE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBRW5DLHdFQUF3RTtBQUN4RSxpRUFBaUU7QUFDakUsTUFBTSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDO0FBQ3hELE1BQU0sbUJBQW1CLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0FBQzVELE1BQU0saUJBQWlCLEdBQ3JCLGdCQUFnQixJQUFJLG1CQUFtQixJQUFJLGdCQUFnQixDQUFDO0FBRTlELGdFQUFnRTtBQUNoRSw2Q0FBNkM7QUFDN0MsTUFBTSxVQUFVLEdBQ2QsTUFBTSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsSUFBSSxTQUFTLENBQUM7QUFDbEUsTUFBTSxZQUFZLEdBQ2hCLE1BQU0sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLElBQUksU0FBUyxDQUFDO0FBRXZFLDBEQUEwRDtBQUMxRCxNQUFNLFdBQVcsR0FBRztJQUNsQixXQUFXLEVBQUUsaUJBQWlCO0lBQzlCLFVBQVUsRUFBRSxVQUFVO0lBQ3RCLE1BQU0sRUFBRSxZQUFZO0lBQ3BCLFNBQVMsRUFBRSxRQUFRO0NBQ3BCLENBQUM7QUFFRiwrREFBK0Q7QUFDL0Qsd0RBQXdEO0FBQ3hELE1BQU0sS0FBSyxHQUFHLElBQUksb0JBQVEsQ0FBQyxXQUFXLEVBQUU7SUFDdEMsaUJBQWlCLEVBQUUsaUJBQWlCO0lBQ3BDLElBQUksRUFBRSxXQUFXO0NBQ2xCLENBQUMsQ0FBQztBQUVILDBEQUEwRDtBQUM3QyxRQUFBLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO0FBQ3RCLFFBQUEsU0FBUyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUM7QUFDNUIsUUFBQSxZQUFZLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogUHVsdW1pIGFwcGxpY2F0aW9uIGVudHJ5IHBvaW50IGZvciB0aGUgVEFQIChUZXN0IEF1dG9tYXRpb24gUGxhdGZvcm0pIGluZnJhc3RydWN0dXJlLlxuICpcbiAqIFRoaXMgbW9kdWxlIGRlZmluZXMgdGhlIGNvcmUgUHVsdW1pIHN0YWNrIGFuZCBpbnN0YW50aWF0ZXMgdGhlIFRhcFN0YWNrIHdpdGggYXBwcm9wcmlhdGVcbiAqIGNvbmZpZ3VyYXRpb24gYmFzZWQgb24gdGhlIGRlcGxveW1lbnQgZW52aXJvbm1lbnQuIEl0IGhhbmRsZXMgZW52aXJvbm1lbnQtc3BlY2lmaWMgc2V0dGluZ3MsXG4gKiB0YWdnaW5nLCBhbmQgZGVwbG95bWVudCBjb25maWd1cmF0aW9uIGZvciBBV1MgcmVzb3VyY2VzLlxuICpcbiAqIFRoZSBzdGFjayBjcmVhdGVkIGJ5IHRoaXMgbW9kdWxlIHVzZXMgZW52aXJvbm1lbnQgc3VmZml4ZXMgdG8gZGlzdGluZ3Vpc2ggYmV0d2VlblxuICogZGlmZmVyZW50IGRlcGxveW1lbnQgZW52aXJvbm1lbnRzIChkZXZlbG9wbWVudCwgc3RhZ2luZywgcHJvZHVjdGlvbiwgZXRjLikuXG4gKi9cbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgeyBUYXBTdGFjayB9IGZyb20gJy4uL2xpYi90YXAtc3RhY2snO1xuXG4vLyBJbml0aWFsaXplIFB1bHVtaSBjb25maWd1cmF0aW9uIGZvciB0aGUgY3VycmVudCBzdGFjay5cbmNvbnN0IGNvbmZpZyA9IG5ldyBwdWx1bWkuQ29uZmlnKCk7XG5cbi8vIEdldCB0aGUgZW52aXJvbm1lbnQgc3VmZml4IGZyb20gZW52aXJvbm1lbnQgdmFyaWFibGUgb3IgUHVsdW1pIGNvbmZpZ1xuLy8gUHJpb3JpdHk6IEVOVklST05NRU5UX1NVRkZJWCBlbnYgdmFyID4gUHVsdW1pIGNvbmZpZyA+IGRlZmF1bHRcbmNvbnN0IGVudlN1ZmZpeEZyb21FbnYgPSBwcm9jZXNzLmVudi5FTlZJUk9OTUVOVF9TVUZGSVg7XG5jb25zdCBlbnZTdWZmaXhGcm9tQ29uZmlnID0gY29uZmlnLmdldCgnZW52aXJvbm1lbnRTdWZmaXgnKTtcbmNvbnN0IGVudmlyb25tZW50U3VmZml4ID1cbiAgZW52U3VmZml4RnJvbUVudiB8fCBlbnZTdWZmaXhGcm9tQ29uZmlnIHx8ICdzeW50aHRyYWlucjEyMSc7XG5cbi8vIEdldCBtZXRhZGF0YSBmcm9tIGVudmlyb25tZW50IHZhcmlhYmxlcyBmb3IgdGFnZ2luZyBwdXJwb3Nlcy5cbi8vIFRoZXNlIGFyZSBvZnRlbiBpbmplY3RlZCBieSBDSS9DRCBzeXN0ZW1zLlxuY29uc3QgcmVwb3NpdG9yeSA9XG4gIGNvbmZpZy5nZXQoJ3JlcG9zaXRvcnknKSB8fCBwcm9jZXNzLmVudi5SRVBPU0lUT1JZIHx8ICd1bmtub3duJztcbmNvbnN0IGNvbW1pdEF1dGhvciA9XG4gIGNvbmZpZy5nZXQoJ2NvbW1pdEF1dGhvcicpIHx8IHByb2Nlc3MuZW52LkNPTU1JVF9BVVRIT1IgfHwgJ3Vua25vd24nO1xuXG4vLyBEZWZpbmUgYSBzZXQgb2YgZGVmYXVsdCB0YWdzIHRvIGFwcGx5IHRvIGFsbCByZXNvdXJjZXMuXG5jb25zdCBkZWZhdWx0VGFncyA9IHtcbiAgRW52aXJvbm1lbnQ6IGVudmlyb25tZW50U3VmZml4LFxuICBSZXBvc2l0b3J5OiByZXBvc2l0b3J5LFxuICBBdXRob3I6IGNvbW1pdEF1dGhvcixcbiAgTWFuYWdlZEJ5OiAnUHVsdW1pJyxcbn07XG5cbi8vIEluc3RhbnRpYXRlIHRoZSBtYWluIHN0YWNrIGNvbXBvbmVudCBmb3IgdGhlIGluZnJhc3RydWN0dXJlLlxuLy8gVGhpcyBlbmNhcHN1bGF0ZXMgYWxsIHRoZSByZXNvdXJjZXMgZm9yIHRoZSBwbGF0Zm9ybS5cbmNvbnN0IHN0YWNrID0gbmV3IFRhcFN0YWNrKCd0YXAtc3RhY2snLCB7XG4gIGVudmlyb25tZW50U3VmZml4OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgdGFnczogZGVmYXVsdFRhZ3MsXG59KTtcblxuLy8gRXhwb3J0IHN0YWNrIG91dHB1dHMgZm9yIGludGVncmF0aW9uIHdpdGggb3RoZXIgc3lzdGVtc1xuZXhwb3J0IGNvbnN0IGFwaVVybCA9IHN0YWNrLmFwaVVybDtcbmV4cG9ydCBjb25zdCB0YWJsZU5hbWUgPSBzdGFjay50YWJsZU5hbWU7XG5leHBvcnQgY29uc3QgZnVuY3Rpb25OYW1lID0gc3RhY2suZnVuY3Rpb25OYW1lO1xuIl19