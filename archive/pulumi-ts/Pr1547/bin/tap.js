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
exports.loggingBucketName = exports.s3BucketName = exports.rdsEndpoint = exports.albDns = exports.albArn = exports.vpcId = void 0;
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
// Get the environment suffix from environment variable or Pulumi config, defaulting to 'dev'.
// Priority: environment variable > Pulumi config > default value
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';
// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = process.env.REPOSITORY || config.get('repository') || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || config.get('commitAuthor') || 'unknown';
// Define a set of default tags to apply to all resources.
const defaultTags = {
    Environment: environmentSuffix,
    Repository: repository,
    Author: commitAuthor,
};
// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const stack = new tap_stack_1.TapStack('TapStack', {
    environmentSuffix: environmentSuffix,
    tags: defaultTags,
});
// Export stack outputs for use by other scripts and integration tests
exports.vpcId = stack.vpcId;
exports.albArn = stack.albArn;
exports.albDns = stack.albDns;
exports.rdsEndpoint = stack.rdsEndpoint;
exports.s3BucketName = stack.s3BucketName;
exports.loggingBucketName = stack.loggingBucketName;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7R0FTRztBQUNILHVEQUF5QztBQUN6QyxnREFBNEM7QUFFNUMseURBQXlEO0FBQ3pELE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBRW5DLDhGQUE4RjtBQUM5RixpRUFBaUU7QUFDakUsTUFBTSxpQkFBaUIsR0FDckIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQztBQUUvRCxnRUFBZ0U7QUFDaEUsNkNBQTZDO0FBQzdDLE1BQU0sVUFBVSxHQUNkLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLElBQUksU0FBUyxDQUFDO0FBQ2xFLE1BQU0sWUFBWSxHQUNoQixPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxJQUFJLFNBQVMsQ0FBQztBQUV2RSwwREFBMEQ7QUFDMUQsTUFBTSxXQUFXLEdBQUc7SUFDbEIsV0FBVyxFQUFFLGlCQUFpQjtJQUM5QixVQUFVLEVBQUUsVUFBVTtJQUN0QixNQUFNLEVBQUUsWUFBWTtDQUNyQixDQUFDO0FBRUYsK0RBQStEO0FBQy9ELHdEQUF3RDtBQUN4RCxNQUFNLEtBQUssR0FBRyxJQUFJLG9CQUFRLENBQUMsVUFBVSxFQUFFO0lBQ3JDLGlCQUFpQixFQUFFLGlCQUFpQjtJQUNwQyxJQUFJLEVBQUUsV0FBVztDQUNsQixDQUFDLENBQUM7QUFFSCxzRUFBc0U7QUFDekQsUUFBQSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQztBQUNwQixRQUFBLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO0FBQ3RCLFFBQUEsTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7QUFDdEIsUUFBQSxXQUFXLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQztBQUNoQyxRQUFBLFlBQVksR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDO0FBQ2xDLFFBQUEsaUJBQWlCLEdBQUcsS0FBSyxDQUFDLGlCQUFpQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBQdWx1bWkgYXBwbGljYXRpb24gZW50cnkgcG9pbnQgZm9yIHRoZSBUQVAgKFRlc3QgQXV0b21hdGlvbiBQbGF0Zm9ybSkgaW5mcmFzdHJ1Y3R1cmUuXG4gKlxuICogVGhpcyBtb2R1bGUgZGVmaW5lcyB0aGUgY29yZSBQdWx1bWkgc3RhY2sgYW5kIGluc3RhbnRpYXRlcyB0aGUgVGFwU3RhY2sgd2l0aCBhcHByb3ByaWF0ZVxuICogY29uZmlndXJhdGlvbiBiYXNlZCBvbiB0aGUgZGVwbG95bWVudCBlbnZpcm9ubWVudC4gSXQgaGFuZGxlcyBlbnZpcm9ubWVudC1zcGVjaWZpYyBzZXR0aW5ncyxcbiAqIHRhZ2dpbmcsIGFuZCBkZXBsb3ltZW50IGNvbmZpZ3VyYXRpb24gZm9yIEFXUyByZXNvdXJjZXMuXG4gKlxuICogVGhlIHN0YWNrIGNyZWF0ZWQgYnkgdGhpcyBtb2R1bGUgdXNlcyBlbnZpcm9ubWVudCBzdWZmaXhlcyB0byBkaXN0aW5ndWlzaCBiZXR3ZWVuXG4gKiBkaWZmZXJlbnQgZGVwbG95bWVudCBlbnZpcm9ubWVudHMgKGRldmVsb3BtZW50LCBzdGFnaW5nLCBwcm9kdWN0aW9uLCBldGMuKS5cbiAqL1xuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCB7IFRhcFN0YWNrIH0gZnJvbSAnLi4vbGliL3RhcC1zdGFjayc7XG5cbi8vIEluaXRpYWxpemUgUHVsdW1pIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBjdXJyZW50IHN0YWNrLlxuY29uc3QgY29uZmlnID0gbmV3IHB1bHVtaS5Db25maWcoKTtcblxuLy8gR2V0IHRoZSBlbnZpcm9ubWVudCBzdWZmaXggZnJvbSBlbnZpcm9ubWVudCB2YXJpYWJsZSBvciBQdWx1bWkgY29uZmlnLCBkZWZhdWx0aW5nIHRvICdkZXYnLlxuLy8gUHJpb3JpdHk6IGVudmlyb25tZW50IHZhcmlhYmxlID4gUHVsdW1pIGNvbmZpZyA+IGRlZmF1bHQgdmFsdWVcbmNvbnN0IGVudmlyb25tZW50U3VmZml4ID1cbiAgcHJvY2Vzcy5lbnYuRU5WSVJPTk1FTlRfU1VGRklYIHx8IGNvbmZpZy5nZXQoJ2VudicpIHx8ICdkZXYnO1xuXG4vLyBHZXQgbWV0YWRhdGEgZnJvbSBlbnZpcm9ubWVudCB2YXJpYWJsZXMgZm9yIHRhZ2dpbmcgcHVycG9zZXMuXG4vLyBUaGVzZSBhcmUgb2Z0ZW4gaW5qZWN0ZWQgYnkgQ0kvQ0Qgc3lzdGVtcy5cbmNvbnN0IHJlcG9zaXRvcnkgPVxuICBwcm9jZXNzLmVudi5SRVBPU0lUT1JZIHx8IGNvbmZpZy5nZXQoJ3JlcG9zaXRvcnknKSB8fCAndW5rbm93bic7XG5jb25zdCBjb21taXRBdXRob3IgPVxuICBwcm9jZXNzLmVudi5DT01NSVRfQVVUSE9SIHx8IGNvbmZpZy5nZXQoJ2NvbW1pdEF1dGhvcicpIHx8ICd1bmtub3duJztcblxuLy8gRGVmaW5lIGEgc2V0IG9mIGRlZmF1bHQgdGFncyB0byBhcHBseSB0byBhbGwgcmVzb3VyY2VzLlxuY29uc3QgZGVmYXVsdFRhZ3MgPSB7XG4gIEVudmlyb25tZW50OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgUmVwb3NpdG9yeTogcmVwb3NpdG9yeSxcbiAgQXV0aG9yOiBjb21taXRBdXRob3IsXG59O1xuXG4vLyBJbnN0YW50aWF0ZSB0aGUgbWFpbiBzdGFjayBjb21wb25lbnQgZm9yIHRoZSBpbmZyYXN0cnVjdHVyZS5cbi8vIFRoaXMgZW5jYXBzdWxhdGVzIGFsbCB0aGUgcmVzb3VyY2VzIGZvciB0aGUgcGxhdGZvcm0uXG5jb25zdCBzdGFjayA9IG5ldyBUYXBTdGFjaygnVGFwU3RhY2snLCB7XG4gIGVudmlyb25tZW50U3VmZml4OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgdGFnczogZGVmYXVsdFRhZ3MsXG59KTtcblxuLy8gRXhwb3J0IHN0YWNrIG91dHB1dHMgZm9yIHVzZSBieSBvdGhlciBzY3JpcHRzIGFuZCBpbnRlZ3JhdGlvbiB0ZXN0c1xuZXhwb3J0IGNvbnN0IHZwY0lkID0gc3RhY2sudnBjSWQ7XG5leHBvcnQgY29uc3QgYWxiQXJuID0gc3RhY2suYWxiQXJuO1xuZXhwb3J0IGNvbnN0IGFsYkRucyA9IHN0YWNrLmFsYkRucztcbmV4cG9ydCBjb25zdCByZHNFbmRwb2ludCA9IHN0YWNrLnJkc0VuZHBvaW50O1xuZXhwb3J0IGNvbnN0IHMzQnVja2V0TmFtZSA9IHN0YWNrLnMzQnVja2V0TmFtZTtcbmV4cG9ydCBjb25zdCBsb2dnaW5nQnVja2V0TmFtZSA9IHN0YWNrLmxvZ2dpbmdCdWNrZXROYW1lO1xuIl19