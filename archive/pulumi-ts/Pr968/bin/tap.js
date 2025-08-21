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
exports.secureWebServerUrl = exports.webServerUrl = exports.eventBridgeRuleArn = exports.snsTopicArn = exports.instancePrivateIp = exports.instancePublicIp = exports.instanceId = exports.securityGroupId = exports.vpcId = void 0;
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
// Export stack outputs for integration testing
exports.vpcId = tapStack.vpcId;
exports.securityGroupId = tapStack.securityGroupId;
exports.instanceId = tapStack.instanceId;
exports.instancePublicIp = tapStack.instancePublicIp;
exports.instancePrivateIp = tapStack.instancePrivateIp;
exports.snsTopicArn = tapStack.snsTopicArn;
exports.eventBridgeRuleArn = tapStack.eventBridgeRuleArn;
exports.webServerUrl = tapStack.webServerUrl;
exports.secureWebServerUrl = tapStack.secureWebServerUrl;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7R0FTRztBQUNILHVEQUF5QztBQUN6QyxnREFBNEM7QUFFNUMseURBQXlEO0FBQ3pELE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBRW5DLDBFQUEwRTtBQUMxRSw0RUFBNEU7QUFDNUUsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixJQUFJLEtBQUssQ0FBQztBQUVsRSxnRUFBZ0U7QUFDaEUsNkNBQTZDO0FBQzdDLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLElBQUksU0FBUyxDQUFDO0FBQ3pELE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLElBQUksU0FBUyxDQUFDO0FBRTdELDBEQUEwRDtBQUMxRCxnRUFBZ0U7QUFDaEUsNEVBQTRFO0FBQzVFLHVEQUF1RDtBQUN2RCxNQUFNLFdBQVcsR0FBRztJQUNsQixXQUFXLEVBQUUsaUJBQWlCO0lBQzlCLFVBQVUsRUFBRSxVQUFVO0lBQ3RCLE1BQU0sRUFBRSxZQUFZO0NBQ3JCLENBQUM7QUFFRiwrREFBK0Q7QUFDL0Qsd0RBQXdEO0FBQ3hELE1BQU0sUUFBUSxHQUFHLElBQUksb0JBQVEsQ0FBQyxjQUFjLEVBQUU7SUFDNUMsaUJBQWlCO0lBQ2pCLElBQUksRUFBRSxXQUFXO0NBQ2xCLENBQUMsQ0FBQztBQUVILCtDQUErQztBQUNsQyxRQUFBLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDO0FBQ3ZCLFFBQUEsZUFBZSxHQUFHLFFBQVEsQ0FBQyxlQUFlLENBQUM7QUFDM0MsUUFBQSxVQUFVLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQztBQUNqQyxRQUFBLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQztBQUM3QyxRQUFBLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQztBQUMvQyxRQUFBLFdBQVcsR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDO0FBQ25DLFFBQUEsa0JBQWtCLEdBQUcsUUFBUSxDQUFDLGtCQUFrQixDQUFDO0FBQ2pELFFBQUEsWUFBWSxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUM7QUFDckMsUUFBQSxrQkFBa0IsR0FBRyxRQUFRLENBQUMsa0JBQWtCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFB1bHVtaSBhcHBsaWNhdGlvbiBlbnRyeSBwb2ludCBmb3IgdGhlIFRBUCAoVGVzdCBBdXRvbWF0aW9uIFBsYXRmb3JtKSBpbmZyYXN0cnVjdHVyZS5cbiAqXG4gKiBUaGlzIG1vZHVsZSBkZWZpbmVzIHRoZSBjb3JlIFB1bHVtaSBzdGFjayBhbmQgaW5zdGFudGlhdGVzIHRoZSBUYXBTdGFjayB3aXRoIGFwcHJvcHJpYXRlXG4gKiBjb25maWd1cmF0aW9uIGJhc2VkIG9uIHRoZSBkZXBsb3ltZW50IGVudmlyb25tZW50LiBJdCBoYW5kbGVzIGVudmlyb25tZW50LXNwZWNpZmljIHNldHRpbmdzLFxuICogdGFnZ2luZywgYW5kIGRlcGxveW1lbnQgY29uZmlndXJhdGlvbiBmb3IgQVdTIHJlc291cmNlcy5cbiAqXG4gKiBUaGUgc3RhY2sgY3JlYXRlZCBieSB0aGlzIG1vZHVsZSB1c2VzIGVudmlyb25tZW50IHN1ZmZpeGVzIHRvIGRpc3Rpbmd1aXNoIGJldHdlZW5cbiAqIGRpZmZlcmVudCBkZXBsb3ltZW50IGVudmlyb25tZW50cyAoZGV2ZWxvcG1lbnQsIHN0YWdpbmcsIHByb2R1Y3Rpb24sIGV0Yy4pLlxuICovXG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0IHsgVGFwU3RhY2sgfSBmcm9tICcuLi9saWIvdGFwLXN0YWNrJztcblxuLy8gSW5pdGlhbGl6ZSBQdWx1bWkgY29uZmlndXJhdGlvbiBmb3IgdGhlIGN1cnJlbnQgc3RhY2suXG5jb25zdCBjb25maWcgPSBuZXcgcHVsdW1pLkNvbmZpZygpO1xuXG4vLyBHZXQgdGhlIGVudmlyb25tZW50IHN1ZmZpeCBmcm9tIHRoZSBQdWx1bWkgY29uZmlnLCBkZWZhdWx0aW5nIHRvICdkZXYnLlxuLy8gWW91IGNhbiBzZXQgdGhpcyB2YWx1ZSB1c2luZyB0aGUgY29tbWFuZDogYHB1bHVtaSBjb25maWcgc2V0IGVudiA8dmFsdWU+YFxuY29uc3QgZW52aXJvbm1lbnRTdWZmaXggPSBwcm9jZXNzLmVudi5FTlZJUk9OTUVOVF9TVUZGSVggfHwgJ2Rldic7XG5cbi8vIEdldCBtZXRhZGF0YSBmcm9tIGVudmlyb25tZW50IHZhcmlhYmxlcyBmb3IgdGFnZ2luZyBwdXJwb3Nlcy5cbi8vIFRoZXNlIGFyZSBvZnRlbiBpbmplY3RlZCBieSBDSS9DRCBzeXN0ZW1zLlxuY29uc3QgcmVwb3NpdG9yeSA9IGNvbmZpZy5nZXQoJ3JlcG9zaXRvcnknKSB8fCAndW5rbm93bic7XG5jb25zdCBjb21taXRBdXRob3IgPSBjb25maWcuZ2V0KCdjb21taXRBdXRob3InKSB8fCAndW5rbm93bic7XG5cbi8vIERlZmluZSBhIHNldCBvZiBkZWZhdWx0IHRhZ3MgdG8gYXBwbHkgdG8gYWxsIHJlc291cmNlcy5cbi8vIFdoaWxlIG5vdCBleHBsaWNpdGx5IHVzZWQgaW4gdGhlIFRhcFN0YWNrIGluc3RhbnRpYXRpb24gaGVyZSxcbi8vIHRoaXMgaXMgdGhlIHN0YW5kYXJkIHBsYWNlIHRvIGRlZmluZSB0aGVtLiBUaGV5IHdvdWxkIHR5cGljYWxseSBiZSBwYXNzZWRcbi8vIGludG8gdGhlIFRhcFN0YWNrIG9yIGNvbmZpZ3VyZWQgb24gdGhlIEFXUyBwcm92aWRlci5cbmNvbnN0IGRlZmF1bHRUYWdzID0ge1xuICBFbnZpcm9ubWVudDogZW52aXJvbm1lbnRTdWZmaXgsXG4gIFJlcG9zaXRvcnk6IHJlcG9zaXRvcnksXG4gIEF1dGhvcjogY29tbWl0QXV0aG9yLFxufTtcblxuLy8gSW5zdGFudGlhdGUgdGhlIG1haW4gc3RhY2sgY29tcG9uZW50IGZvciB0aGUgaW5mcmFzdHJ1Y3R1cmUuXG4vLyBUaGlzIGVuY2Fwc3VsYXRlcyBhbGwgdGhlIHJlc291cmNlcyBmb3IgdGhlIHBsYXRmb3JtLlxuY29uc3QgdGFwU3RhY2sgPSBuZXcgVGFwU3RhY2soJ3B1bHVtaS1pbmZyYScsIHtcbiAgZW52aXJvbm1lbnRTdWZmaXgsXG4gIHRhZ3M6IGRlZmF1bHRUYWdzLFxufSk7XG5cbi8vIEV4cG9ydCBzdGFjayBvdXRwdXRzIGZvciBpbnRlZ3JhdGlvbiB0ZXN0aW5nXG5leHBvcnQgY29uc3QgdnBjSWQgPSB0YXBTdGFjay52cGNJZDtcbmV4cG9ydCBjb25zdCBzZWN1cml0eUdyb3VwSWQgPSB0YXBTdGFjay5zZWN1cml0eUdyb3VwSWQ7XG5leHBvcnQgY29uc3QgaW5zdGFuY2VJZCA9IHRhcFN0YWNrLmluc3RhbmNlSWQ7XG5leHBvcnQgY29uc3QgaW5zdGFuY2VQdWJsaWNJcCA9IHRhcFN0YWNrLmluc3RhbmNlUHVibGljSXA7XG5leHBvcnQgY29uc3QgaW5zdGFuY2VQcml2YXRlSXAgPSB0YXBTdGFjay5pbnN0YW5jZVByaXZhdGVJcDtcbmV4cG9ydCBjb25zdCBzbnNUb3BpY0FybiA9IHRhcFN0YWNrLnNuc1RvcGljQXJuO1xuZXhwb3J0IGNvbnN0IGV2ZW50QnJpZGdlUnVsZUFybiA9IHRhcFN0YWNrLmV2ZW50QnJpZGdlUnVsZUFybjtcbmV4cG9ydCBjb25zdCB3ZWJTZXJ2ZXJVcmwgPSB0YXBTdGFjay53ZWJTZXJ2ZXJVcmw7XG5leHBvcnQgY29uc3Qgc2VjdXJlV2ViU2VydmVyVXJsID0gdGFwU3RhY2suc2VjdXJlV2ViU2VydmVyVXJsO1xuIl19