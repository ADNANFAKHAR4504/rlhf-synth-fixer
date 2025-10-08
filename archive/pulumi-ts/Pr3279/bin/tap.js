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
exports.instanceConnectEndpointId = exports.vpcId = exports.staticBucketName = exports.albDnsName = void 0;
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
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX ||
    config.get('environmentSuffix') ||
    'synth46170923';
// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = process.env.REPOSITORY || config.get('repository') || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || config.get('commitAuthor') || 'unknown';
// Define a set of default tags to apply to all resources.
const defaultTags = {
    Environment: environmentSuffix,
    Repository: repository,
    Author: commitAuthor,
    ManagedBy: 'Pulumi',
};
// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const stack = new tap_stack_1.TapStack('TapStack', {
    environmentSuffix: environmentSuffix,
    tags: defaultTags,
});
// Export the stack outputs
exports.albDnsName = stack.albDnsName;
exports.staticBucketName = stack.staticBucketName;
exports.vpcId = stack.vpcId;
exports.instanceConnectEndpointId = stack.instanceConnectEndpointId;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vYmluL3RhcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7Ozs7Ozs7O0dBU0c7QUFDSCx1REFBeUM7QUFDekMsZ0RBQTRDO0FBRTVDLHlEQUF5RDtBQUN6RCxNQUFNLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUVuQyx3RUFBd0U7QUFDeEUsTUFBTSxpQkFBaUIsR0FDckIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0I7SUFDOUIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQztJQUMvQixlQUFlLENBQUM7QUFFbEIsZ0VBQWdFO0FBQ2hFLDZDQUE2QztBQUM3QyxNQUFNLFVBQVUsR0FDZCxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxJQUFJLFNBQVMsQ0FBQztBQUNsRSxNQUFNLFlBQVksR0FDaEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLElBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsSUFBSSxTQUFTLENBQUM7QUFFdkUsMERBQTBEO0FBQzFELE1BQU0sV0FBVyxHQUFHO0lBQ2xCLFdBQVcsRUFBRSxpQkFBaUI7SUFDOUIsVUFBVSxFQUFFLFVBQVU7SUFDdEIsTUFBTSxFQUFFLFlBQVk7SUFDcEIsU0FBUyxFQUFFLFFBQVE7Q0FDcEIsQ0FBQztBQUVGLCtEQUErRDtBQUMvRCx3REFBd0Q7QUFDeEQsTUFBTSxLQUFLLEdBQUcsSUFBSSxvQkFBUSxDQUFDLFVBQVUsRUFBRTtJQUNyQyxpQkFBaUIsRUFBRSxpQkFBaUI7SUFDcEMsSUFBSSxFQUFFLFdBQVc7Q0FDbEIsQ0FBQyxDQUFDO0FBRUgsMkJBQTJCO0FBQ2QsUUFBQSxVQUFVLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQztBQUM5QixRQUFBLGdCQUFnQixHQUFHLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQztBQUMxQyxRQUFBLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDO0FBQ3BCLFFBQUEseUJBQXlCLEdBQUcsS0FBSyxDQUFDLHlCQUF5QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBQdWx1bWkgYXBwbGljYXRpb24gZW50cnkgcG9pbnQgZm9yIHRoZSBUQVAgKFRlc3QgQXV0b21hdGlvbiBQbGF0Zm9ybSkgaW5mcmFzdHJ1Y3R1cmUuXG4gKlxuICogVGhpcyBtb2R1bGUgZGVmaW5lcyB0aGUgY29yZSBQdWx1bWkgc3RhY2sgYW5kIGluc3RhbnRpYXRlcyB0aGUgVGFwU3RhY2sgd2l0aCBhcHByb3ByaWF0ZVxuICogY29uZmlndXJhdGlvbiBiYXNlZCBvbiB0aGUgZGVwbG95bWVudCBlbnZpcm9ubWVudC4gSXQgaGFuZGxlcyBlbnZpcm9ubWVudC1zcGVjaWZpYyBzZXR0aW5ncyxcbiAqIHRhZ2dpbmcsIGFuZCBkZXBsb3ltZW50IGNvbmZpZ3VyYXRpb24gZm9yIEFXUyByZXNvdXJjZXMuXG4gKlxuICogVGhlIHN0YWNrIGNyZWF0ZWQgYnkgdGhpcyBtb2R1bGUgdXNlcyBlbnZpcm9ubWVudCBzdWZmaXhlcyB0byBkaXN0aW5ndWlzaCBiZXR3ZWVuXG4gKiBkaWZmZXJlbnQgZGVwbG95bWVudCBlbnZpcm9ubWVudHMgKGRldmVsb3BtZW50LCBzdGFnaW5nLCBwcm9kdWN0aW9uLCBldGMuKS5cbiAqL1xuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCB7IFRhcFN0YWNrIH0gZnJvbSAnLi4vbGliL3RhcC1zdGFjayc7XG5cbi8vIEluaXRpYWxpemUgUHVsdW1pIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBjdXJyZW50IHN0YWNrLlxuY29uc3QgY29uZmlnID0gbmV3IHB1bHVtaS5Db25maWcoKTtcblxuLy8gR2V0IHRoZSBlbnZpcm9ubWVudCBzdWZmaXggZnJvbSBlbnZpcm9ubWVudCB2YXJpYWJsZSBvciBQdWx1bWkgY29uZmlnXG5jb25zdCBlbnZpcm9ubWVudFN1ZmZpeCA9XG4gIHByb2Nlc3MuZW52LkVOVklST05NRU5UX1NVRkZJWCB8fFxuICBjb25maWcuZ2V0KCdlbnZpcm9ubWVudFN1ZmZpeCcpIHx8XG4gICdzeW50aDQ2MTcwOTIzJztcblxuLy8gR2V0IG1ldGFkYXRhIGZyb20gZW52aXJvbm1lbnQgdmFyaWFibGVzIGZvciB0YWdnaW5nIHB1cnBvc2VzLlxuLy8gVGhlc2UgYXJlIG9mdGVuIGluamVjdGVkIGJ5IENJL0NEIHN5c3RlbXMuXG5jb25zdCByZXBvc2l0b3J5ID1cbiAgcHJvY2Vzcy5lbnYuUkVQT1NJVE9SWSB8fCBjb25maWcuZ2V0KCdyZXBvc2l0b3J5JykgfHwgJ3Vua25vd24nO1xuY29uc3QgY29tbWl0QXV0aG9yID1cbiAgcHJvY2Vzcy5lbnYuQ09NTUlUX0FVVEhPUiB8fCBjb25maWcuZ2V0KCdjb21taXRBdXRob3InKSB8fCAndW5rbm93bic7XG5cbi8vIERlZmluZSBhIHNldCBvZiBkZWZhdWx0IHRhZ3MgdG8gYXBwbHkgdG8gYWxsIHJlc291cmNlcy5cbmNvbnN0IGRlZmF1bHRUYWdzID0ge1xuICBFbnZpcm9ubWVudDogZW52aXJvbm1lbnRTdWZmaXgsXG4gIFJlcG9zaXRvcnk6IHJlcG9zaXRvcnksXG4gIEF1dGhvcjogY29tbWl0QXV0aG9yLFxuICBNYW5hZ2VkQnk6ICdQdWx1bWknLFxufTtcblxuLy8gSW5zdGFudGlhdGUgdGhlIG1haW4gc3RhY2sgY29tcG9uZW50IGZvciB0aGUgaW5mcmFzdHJ1Y3R1cmUuXG4vLyBUaGlzIGVuY2Fwc3VsYXRlcyBhbGwgdGhlIHJlc291cmNlcyBmb3IgdGhlIHBsYXRmb3JtLlxuY29uc3Qgc3RhY2sgPSBuZXcgVGFwU3RhY2soJ1RhcFN0YWNrJywge1xuICBlbnZpcm9ubWVudFN1ZmZpeDogZW52aXJvbm1lbnRTdWZmaXgsXG4gIHRhZ3M6IGRlZmF1bHRUYWdzLFxufSk7XG5cbi8vIEV4cG9ydCB0aGUgc3RhY2sgb3V0cHV0c1xuZXhwb3J0IGNvbnN0IGFsYkRuc05hbWUgPSBzdGFjay5hbGJEbnNOYW1lO1xuZXhwb3J0IGNvbnN0IHN0YXRpY0J1Y2tldE5hbWUgPSBzdGFjay5zdGF0aWNCdWNrZXROYW1lO1xuZXhwb3J0IGNvbnN0IHZwY0lkID0gc3RhY2sudnBjSWQ7XG5leHBvcnQgY29uc3QgaW5zdGFuY2VDb25uZWN0RW5kcG9pbnRJZCA9IHN0YWNrLmluc3RhbmNlQ29ubmVjdEVuZHBvaW50SWQ7XG4iXX0=