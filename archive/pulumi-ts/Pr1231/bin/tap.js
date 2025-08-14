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
exports.albSecurityGroupId = exports.appSecurityGroupId = exports.dbSecurityGroupId = exports.wafWebAclArn = exports.launchTemplateId = exports.autoScalingGroupName = exports.targetGroupArn = exports.albArn = exports.snsTopicArn = exports.rdsEndpoint = exports.albDnsName = exports.vpcId = void 0;
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
const aws = __importStar(require("@pulumi/aws"));
const tap_stack_1 = require("../lib/tap-stack");
// Get the environment suffix from the Pulumi config, defaulting to 'dev'.
// You can set this value using the command: `pulumi config set env <value>`
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
// Define a set of default tags to apply to all resources.
// While not explicitly used in the TapStack instantiation here,
// this is the standard place to define them. They would typically be passed
// into the TapStack or configured on the AWS provider.
const defaultTags = {
    Environment: environmentSuffix,
    Repository: repository,
    Author: commitAuthor,
};
// Configure AWS Provider for us-west-2 region
const awsProvider = new aws.Provider('aws', {
    region: 'us-west-2',
    defaultTags: {
        tags: defaultTags,
    },
});
// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const stack = new tap_stack_1.TapStack('pulumi-infra', {
    environmentSuffix: environmentSuffix,
    tags: defaultTags,
}, { provider: awsProvider });
// Export stack outputs for reference
exports.vpcId = stack.securityStack.vpcId;
exports.albDnsName = stack.securityStack.albDnsName;
exports.rdsEndpoint = stack.securityStack.rdsEndpoint;
exports.snsTopicArn = stack.securityStack.snsTopicArn;
exports.albArn = stack.securityStack.albArn;
exports.targetGroupArn = stack.securityStack.targetGroupArn;
exports.autoScalingGroupName = stack.securityStack.autoScalingGroupName;
exports.launchTemplateId = stack.securityStack.launchTemplateId;
exports.wafWebAclArn = stack.securityStack.wafWebAclArn;
exports.dbSecurityGroupId = stack.securityStack.dbSecurityGroupId;
exports.appSecurityGroupId = stack.securityStack.appSecurityGroupId;
exports.albSecurityGroupId = stack.securityStack.albSecurityGroupId;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7R0FTRztBQUNILGlEQUFtQztBQUNuQyxnREFBNEM7QUFFNUMsMEVBQTBFO0FBQzFFLDRFQUE0RTtBQUM1RSxNQUFNLGlCQUFpQixHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLElBQUksS0FBSyxDQUFDO0FBRWxFLGdFQUFnRTtBQUNoRSw2Q0FBNkM7QUFDN0MsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLElBQUksU0FBUyxDQUFDO0FBQ3ZELE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxJQUFJLFNBQVMsQ0FBQztBQUU1RCwwREFBMEQ7QUFDMUQsZ0VBQWdFO0FBQ2hFLDRFQUE0RTtBQUM1RSx1REFBdUQ7QUFDdkQsTUFBTSxXQUFXLEdBQUc7SUFDbEIsV0FBVyxFQUFFLGlCQUFpQjtJQUM5QixVQUFVLEVBQUUsVUFBVTtJQUN0QixNQUFNLEVBQUUsWUFBWTtDQUNyQixDQUFDO0FBRUYsOENBQThDO0FBQzlDLE1BQU0sV0FBVyxHQUFHLElBQUksR0FBRyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUU7SUFDMUMsTUFBTSxFQUFFLFdBQVc7SUFDbkIsV0FBVyxFQUFFO1FBQ1gsSUFBSSxFQUFFLFdBQVc7S0FDbEI7Q0FDRixDQUFDLENBQUM7QUFFSCwrREFBK0Q7QUFDL0Qsd0RBQXdEO0FBQ3hELE1BQU0sS0FBSyxHQUFHLElBQUksb0JBQVEsQ0FDeEIsY0FBYyxFQUNkO0lBQ0UsaUJBQWlCLEVBQUUsaUJBQWlCO0lBQ3BDLElBQUksRUFBRSxXQUFXO0NBQ2xCLEVBQ0QsRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLENBQzFCLENBQUM7QUFFRixxQ0FBcUM7QUFDeEIsUUFBQSxLQUFLLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7QUFDbEMsUUFBQSxVQUFVLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUM7QUFDNUMsUUFBQSxXQUFXLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUM7QUFDOUMsUUFBQSxXQUFXLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUM7QUFDOUMsUUFBQSxNQUFNLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUM7QUFDcEMsUUFBQSxjQUFjLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxjQUFjLENBQUM7QUFDcEQsUUFBQSxvQkFBb0IsR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDLG9CQUFvQixDQUFDO0FBQ2hFLFFBQUEsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQztBQUN4RCxRQUFBLFlBQVksR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQztBQUNoRCxRQUFBLGlCQUFpQixHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUMsaUJBQWlCLENBQUM7QUFDMUQsUUFBQSxrQkFBa0IsR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDLGtCQUFrQixDQUFDO0FBQzVELFFBQUEsa0JBQWtCLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxrQkFBa0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogUHVsdW1pIGFwcGxpY2F0aW9uIGVudHJ5IHBvaW50IGZvciB0aGUgVEFQIChUZXN0IEF1dG9tYXRpb24gUGxhdGZvcm0pIGluZnJhc3RydWN0dXJlLlxuICpcbiAqIFRoaXMgbW9kdWxlIGRlZmluZXMgdGhlIGNvcmUgUHVsdW1pIHN0YWNrIGFuZCBpbnN0YW50aWF0ZXMgdGhlIFRhcFN0YWNrIHdpdGggYXBwcm9wcmlhdGVcbiAqIGNvbmZpZ3VyYXRpb24gYmFzZWQgb24gdGhlIGRlcGxveW1lbnQgZW52aXJvbm1lbnQuIEl0IGhhbmRsZXMgZW52aXJvbm1lbnQtc3BlY2lmaWMgc2V0dGluZ3MsXG4gKiB0YWdnaW5nLCBhbmQgZGVwbG95bWVudCBjb25maWd1cmF0aW9uIGZvciBBV1MgcmVzb3VyY2VzLlxuICpcbiAqIFRoZSBzdGFjayBjcmVhdGVkIGJ5IHRoaXMgbW9kdWxlIHVzZXMgZW52aXJvbm1lbnQgc3VmZml4ZXMgdG8gZGlzdGluZ3Vpc2ggYmV0d2VlblxuICogZGlmZmVyZW50IGRlcGxveW1lbnQgZW52aXJvbm1lbnRzIChkZXZlbG9wbWVudCwgc3RhZ2luZywgcHJvZHVjdGlvbiwgZXRjLikuXG4gKi9cbmltcG9ydCAqIGFzIGF3cyBmcm9tICdAcHVsdW1pL2F3cyc7XG5pbXBvcnQgeyBUYXBTdGFjayB9IGZyb20gJy4uL2xpYi90YXAtc3RhY2snO1xuXG4vLyBHZXQgdGhlIGVudmlyb25tZW50IHN1ZmZpeCBmcm9tIHRoZSBQdWx1bWkgY29uZmlnLCBkZWZhdWx0aW5nIHRvICdkZXYnLlxuLy8gWW91IGNhbiBzZXQgdGhpcyB2YWx1ZSB1c2luZyB0aGUgY29tbWFuZDogYHB1bHVtaSBjb25maWcgc2V0IGVudiA8dmFsdWU+YFxuY29uc3QgZW52aXJvbm1lbnRTdWZmaXggPSBwcm9jZXNzLmVudi5FTlZJUk9OTUVOVF9TVUZGSVggfHwgJ2Rldic7XG5cbi8vIEdldCBtZXRhZGF0YSBmcm9tIGVudmlyb25tZW50IHZhcmlhYmxlcyBmb3IgdGFnZ2luZyBwdXJwb3Nlcy5cbi8vIFRoZXNlIGFyZSBvZnRlbiBpbmplY3RlZCBieSBDSS9DRCBzeXN0ZW1zLlxuY29uc3QgcmVwb3NpdG9yeSA9IHByb2Nlc3MuZW52LlJFUE9TSVRPUlkgfHwgJ3Vua25vd24nO1xuY29uc3QgY29tbWl0QXV0aG9yID0gcHJvY2Vzcy5lbnYuQ09NTUlUX0FVVEhPUiB8fCAndW5rbm93bic7XG5cbi8vIERlZmluZSBhIHNldCBvZiBkZWZhdWx0IHRhZ3MgdG8gYXBwbHkgdG8gYWxsIHJlc291cmNlcy5cbi8vIFdoaWxlIG5vdCBleHBsaWNpdGx5IHVzZWQgaW4gdGhlIFRhcFN0YWNrIGluc3RhbnRpYXRpb24gaGVyZSxcbi8vIHRoaXMgaXMgdGhlIHN0YW5kYXJkIHBsYWNlIHRvIGRlZmluZSB0aGVtLiBUaGV5IHdvdWxkIHR5cGljYWxseSBiZSBwYXNzZWRcbi8vIGludG8gdGhlIFRhcFN0YWNrIG9yIGNvbmZpZ3VyZWQgb24gdGhlIEFXUyBwcm92aWRlci5cbmNvbnN0IGRlZmF1bHRUYWdzID0ge1xuICBFbnZpcm9ubWVudDogZW52aXJvbm1lbnRTdWZmaXgsXG4gIFJlcG9zaXRvcnk6IHJlcG9zaXRvcnksXG4gIEF1dGhvcjogY29tbWl0QXV0aG9yLFxufTtcblxuLy8gQ29uZmlndXJlIEFXUyBQcm92aWRlciBmb3IgdXMtd2VzdC0yIHJlZ2lvblxuY29uc3QgYXdzUHJvdmlkZXIgPSBuZXcgYXdzLlByb3ZpZGVyKCdhd3MnLCB7XG4gIHJlZ2lvbjogJ3VzLXdlc3QtMicsXG4gIGRlZmF1bHRUYWdzOiB7XG4gICAgdGFnczogZGVmYXVsdFRhZ3MsXG4gIH0sXG59KTtcblxuLy8gSW5zdGFudGlhdGUgdGhlIG1haW4gc3RhY2sgY29tcG9uZW50IGZvciB0aGUgaW5mcmFzdHJ1Y3R1cmUuXG4vLyBUaGlzIGVuY2Fwc3VsYXRlcyBhbGwgdGhlIHJlc291cmNlcyBmb3IgdGhlIHBsYXRmb3JtLlxuY29uc3Qgc3RhY2sgPSBuZXcgVGFwU3RhY2soXG4gICdwdWx1bWktaW5mcmEnLFxuICB7XG4gICAgZW52aXJvbm1lbnRTdWZmaXg6IGVudmlyb25tZW50U3VmZml4LFxuICAgIHRhZ3M6IGRlZmF1bHRUYWdzLFxuICB9LFxuICB7IHByb3ZpZGVyOiBhd3NQcm92aWRlciB9XG4pO1xuXG4vLyBFeHBvcnQgc3RhY2sgb3V0cHV0cyBmb3IgcmVmZXJlbmNlXG5leHBvcnQgY29uc3QgdnBjSWQgPSBzdGFjay5zZWN1cml0eVN0YWNrLnZwY0lkO1xuZXhwb3J0IGNvbnN0IGFsYkRuc05hbWUgPSBzdGFjay5zZWN1cml0eVN0YWNrLmFsYkRuc05hbWU7XG5leHBvcnQgY29uc3QgcmRzRW5kcG9pbnQgPSBzdGFjay5zZWN1cml0eVN0YWNrLnJkc0VuZHBvaW50O1xuZXhwb3J0IGNvbnN0IHNuc1RvcGljQXJuID0gc3RhY2suc2VjdXJpdHlTdGFjay5zbnNUb3BpY0FybjtcbmV4cG9ydCBjb25zdCBhbGJBcm4gPSBzdGFjay5zZWN1cml0eVN0YWNrLmFsYkFybjtcbmV4cG9ydCBjb25zdCB0YXJnZXRHcm91cEFybiA9IHN0YWNrLnNlY3VyaXR5U3RhY2sudGFyZ2V0R3JvdXBBcm47XG5leHBvcnQgY29uc3QgYXV0b1NjYWxpbmdHcm91cE5hbWUgPSBzdGFjay5zZWN1cml0eVN0YWNrLmF1dG9TY2FsaW5nR3JvdXBOYW1lO1xuZXhwb3J0IGNvbnN0IGxhdW5jaFRlbXBsYXRlSWQgPSBzdGFjay5zZWN1cml0eVN0YWNrLmxhdW5jaFRlbXBsYXRlSWQ7XG5leHBvcnQgY29uc3Qgd2FmV2ViQWNsQXJuID0gc3RhY2suc2VjdXJpdHlTdGFjay53YWZXZWJBY2xBcm47XG5leHBvcnQgY29uc3QgZGJTZWN1cml0eUdyb3VwSWQgPSBzdGFjay5zZWN1cml0eVN0YWNrLmRiU2VjdXJpdHlHcm91cElkO1xuZXhwb3J0IGNvbnN0IGFwcFNlY3VyaXR5R3JvdXBJZCA9IHN0YWNrLnNlY3VyaXR5U3RhY2suYXBwU2VjdXJpdHlHcm91cElkO1xuZXhwb3J0IGNvbnN0IGFsYlNlY3VyaXR5R3JvdXBJZCA9IHN0YWNrLnNlY3VyaXR5U3RhY2suYWxiU2VjdXJpdHlHcm91cElkO1xuIl19