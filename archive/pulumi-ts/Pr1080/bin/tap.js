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
exports.resourcePrefix = exports.environment = exports.projectName = exports.rdsKmsKeyAlias = exports.rdsKmsKeyId = exports.rdsInstanceId = exports.ec2PolicyName = exports.ec2InstanceProfileName = exports.ec2RoleName = exports.autoScalingGroupName = exports.albName = exports.privateSubnetIds = exports.publicSubnetIds = exports.vpcId = exports.launchTemplateName = exports.rdsIdentifier = exports.s3BucketName = exports.rdsEndpoint = exports.albDnsName = void 0;
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
// Export the stack outputs so they can be accessed by other systems
exports.albDnsName = stack.albDnsName;
exports.rdsEndpoint = stack.rdsEndpoint;
exports.s3BucketName = stack.s3BucketName;
exports.rdsIdentifier = stack.rdsIdentifier;
exports.launchTemplateName = stack.launchTemplateName;
exports.vpcId = stack.webAppStack.vpc.id;
exports.publicSubnetIds = stack.webAppStack.publicSubnets.map(subnet => subnet.id);
exports.privateSubnetIds = stack.webAppStack.privateSubnets.map(subnet => subnet.id);
// Additional exports for integration testing
exports.albName = stack.albName;
exports.autoScalingGroupName = stack.autoScalingGroupName;
exports.ec2RoleName = stack.ec2RoleName;
exports.ec2InstanceProfileName = stack.ec2InstanceProfileName;
exports.ec2PolicyName = stack.ec2PolicyName;
exports.rdsInstanceId = stack.rdsInstanceId;
exports.rdsKmsKeyId = stack.rdsKmsKeyId;
exports.rdsKmsKeyAlias = stack.rdsKmsKeyAlias;
exports.projectName = stack.projectName;
exports.environment = stack.environment;
exports.resourcePrefix = stack.resourcePrefix;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7R0FTRztBQUNILHVEQUF5QztBQUN6QyxnREFBNEM7QUFFNUMseURBQXlEO0FBQ3pELE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBRW5DLDBFQUEwRTtBQUMxRSw0RUFBNEU7QUFDNUUsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixJQUFJLEtBQUssQ0FBQztBQUVsRSxnRUFBZ0U7QUFDaEUsNkNBQTZDO0FBQzdDLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLElBQUksU0FBUyxDQUFDO0FBQ3pELE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLElBQUksU0FBUyxDQUFDO0FBRTdELDBEQUEwRDtBQUMxRCxnRUFBZ0U7QUFDaEUsNEVBQTRFO0FBQzVFLHVEQUF1RDtBQUN2RCxNQUFNLFdBQVcsR0FBRztJQUNsQixXQUFXLEVBQUUsaUJBQWlCO0lBQzlCLFVBQVUsRUFBRSxVQUFVO0lBQ3RCLE1BQU0sRUFBRSxZQUFZO0NBQ3JCLENBQUM7QUFFRiwrREFBK0Q7QUFDL0Qsd0RBQXdEO0FBQ3hELE1BQU0sS0FBSyxHQUFHLElBQUksb0JBQVEsQ0FBQyxjQUFjLEVBQUU7SUFDekMsaUJBQWlCLEVBQUUsaUJBQWlCO0lBQ3BDLElBQUksRUFBRSxXQUFXO0NBQ2xCLENBQUMsQ0FBQztBQUVILG9FQUFvRTtBQUN2RCxRQUFBLFVBQVUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDO0FBQzlCLFFBQUEsV0FBVyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUM7QUFDaEMsUUFBQSxZQUFZLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQztBQUNsQyxRQUFBLGFBQWEsR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDO0FBQ3BDLFFBQUEsa0JBQWtCLEdBQUcsS0FBSyxDQUFDLGtCQUFrQixDQUFDO0FBQzlDLFFBQUEsS0FBSyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztBQUNqQyxRQUFBLGVBQWUsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQ2hFLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FDcEIsQ0FBQztBQUNXLFFBQUEsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUNsRSxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQ3BCLENBQUM7QUFFRiw2Q0FBNkM7QUFDaEMsUUFBQSxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztBQUN4QixRQUFBLG9CQUFvQixHQUFHLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQztBQUNsRCxRQUFBLFdBQVcsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDO0FBQ2hDLFFBQUEsc0JBQXNCLEdBQUcsS0FBSyxDQUFDLHNCQUFzQixDQUFDO0FBQ3RELFFBQUEsYUFBYSxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUM7QUFDcEMsUUFBQSxhQUFhLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQztBQUNwQyxRQUFBLFdBQVcsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDO0FBQ2hDLFFBQUEsY0FBYyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUM7QUFDdEMsUUFBQSxXQUFXLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQztBQUNoQyxRQUFBLFdBQVcsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDO0FBQ2hDLFFBQUEsY0FBYyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFB1bHVtaSBhcHBsaWNhdGlvbiBlbnRyeSBwb2ludCBmb3IgdGhlIFRBUCAoVGVzdCBBdXRvbWF0aW9uIFBsYXRmb3JtKSBpbmZyYXN0cnVjdHVyZS5cbiAqXG4gKiBUaGlzIG1vZHVsZSBkZWZpbmVzIHRoZSBjb3JlIFB1bHVtaSBzdGFjayBhbmQgaW5zdGFudGlhdGVzIHRoZSBUYXBTdGFjayB3aXRoIGFwcHJvcHJpYXRlXG4gKiBjb25maWd1cmF0aW9uIGJhc2VkIG9uIHRoZSBkZXBsb3ltZW50IGVudmlyb25tZW50LiBJdCBoYW5kbGVzIGVudmlyb25tZW50LXNwZWNpZmljIHNldHRpbmdzLFxuICogdGFnZ2luZywgYW5kIGRlcGxveW1lbnQgY29uZmlndXJhdGlvbiBmb3IgQVdTIHJlc291cmNlcy5cbiAqXG4gKiBUaGUgc3RhY2sgY3JlYXRlZCBieSB0aGlzIG1vZHVsZSB1c2VzIGVudmlyb25tZW50IHN1ZmZpeGVzIHRvIGRpc3Rpbmd1aXNoIGJldHdlZW5cbiAqIGRpZmZlcmVudCBkZXBsb3ltZW50IGVudmlyb25tZW50cyAoZGV2ZWxvcG1lbnQsIHN0YWdpbmcsIHByb2R1Y3Rpb24sIGV0Yy4pLlxuICovXG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0IHsgVGFwU3RhY2sgfSBmcm9tICcuLi9saWIvdGFwLXN0YWNrJztcblxuLy8gSW5pdGlhbGl6ZSBQdWx1bWkgY29uZmlndXJhdGlvbiBmb3IgdGhlIGN1cnJlbnQgc3RhY2suXG5jb25zdCBjb25maWcgPSBuZXcgcHVsdW1pLkNvbmZpZygpO1xuXG4vLyBHZXQgdGhlIGVudmlyb25tZW50IHN1ZmZpeCBmcm9tIHRoZSBQdWx1bWkgY29uZmlnLCBkZWZhdWx0aW5nIHRvICdkZXYnLlxuLy8gWW91IGNhbiBzZXQgdGhpcyB2YWx1ZSB1c2luZyB0aGUgY29tbWFuZDogYHB1bHVtaSBjb25maWcgc2V0IGVudiA8dmFsdWU+YFxuY29uc3QgZW52aXJvbm1lbnRTdWZmaXggPSBwcm9jZXNzLmVudi5FTlZJUk9OTUVOVF9TVUZGSVggfHwgJ2Rldic7XG5cbi8vIEdldCBtZXRhZGF0YSBmcm9tIGVudmlyb25tZW50IHZhcmlhYmxlcyBmb3IgdGFnZ2luZyBwdXJwb3Nlcy5cbi8vIFRoZXNlIGFyZSBvZnRlbiBpbmplY3RlZCBieSBDSS9DRCBzeXN0ZW1zLlxuY29uc3QgcmVwb3NpdG9yeSA9IGNvbmZpZy5nZXQoJ3JlcG9zaXRvcnknKSB8fCAndW5rbm93bic7XG5jb25zdCBjb21taXRBdXRob3IgPSBjb25maWcuZ2V0KCdjb21taXRBdXRob3InKSB8fCAndW5rbm93bic7XG5cbi8vIERlZmluZSBhIHNldCBvZiBkZWZhdWx0IHRhZ3MgdG8gYXBwbHkgdG8gYWxsIHJlc291cmNlcy5cbi8vIFdoaWxlIG5vdCBleHBsaWNpdGx5IHVzZWQgaW4gdGhlIFRhcFN0YWNrIGluc3RhbnRpYXRpb24gaGVyZSxcbi8vIHRoaXMgaXMgdGhlIHN0YW5kYXJkIHBsYWNlIHRvIGRlZmluZSB0aGVtLiBUaGV5IHdvdWxkIHR5cGljYWxseSBiZSBwYXNzZWRcbi8vIGludG8gdGhlIFRhcFN0YWNrIG9yIGNvbmZpZ3VyZWQgb24gdGhlIEFXUyBwcm92aWRlci5cbmNvbnN0IGRlZmF1bHRUYWdzID0ge1xuICBFbnZpcm9ubWVudDogZW52aXJvbm1lbnRTdWZmaXgsXG4gIFJlcG9zaXRvcnk6IHJlcG9zaXRvcnksXG4gIEF1dGhvcjogY29tbWl0QXV0aG9yLFxufTtcblxuLy8gSW5zdGFudGlhdGUgdGhlIG1haW4gc3RhY2sgY29tcG9uZW50IGZvciB0aGUgaW5mcmFzdHJ1Y3R1cmUuXG4vLyBUaGlzIGVuY2Fwc3VsYXRlcyBhbGwgdGhlIHJlc291cmNlcyBmb3IgdGhlIHBsYXRmb3JtLlxuY29uc3Qgc3RhY2sgPSBuZXcgVGFwU3RhY2soJ3B1bHVtaS1pbmZyYScsIHtcbiAgZW52aXJvbm1lbnRTdWZmaXg6IGVudmlyb25tZW50U3VmZml4LFxuICB0YWdzOiBkZWZhdWx0VGFncyxcbn0pO1xuXG4vLyBFeHBvcnQgdGhlIHN0YWNrIG91dHB1dHMgc28gdGhleSBjYW4gYmUgYWNjZXNzZWQgYnkgb3RoZXIgc3lzdGVtc1xuZXhwb3J0IGNvbnN0IGFsYkRuc05hbWUgPSBzdGFjay5hbGJEbnNOYW1lO1xuZXhwb3J0IGNvbnN0IHJkc0VuZHBvaW50ID0gc3RhY2sucmRzRW5kcG9pbnQ7XG5leHBvcnQgY29uc3QgczNCdWNrZXROYW1lID0gc3RhY2suczNCdWNrZXROYW1lO1xuZXhwb3J0IGNvbnN0IHJkc0lkZW50aWZpZXIgPSBzdGFjay5yZHNJZGVudGlmaWVyO1xuZXhwb3J0IGNvbnN0IGxhdW5jaFRlbXBsYXRlTmFtZSA9IHN0YWNrLmxhdW5jaFRlbXBsYXRlTmFtZTtcbmV4cG9ydCBjb25zdCB2cGNJZCA9IHN0YWNrLndlYkFwcFN0YWNrLnZwYy5pZDtcbmV4cG9ydCBjb25zdCBwdWJsaWNTdWJuZXRJZHMgPSBzdGFjay53ZWJBcHBTdGFjay5wdWJsaWNTdWJuZXRzLm1hcChcbiAgc3VibmV0ID0+IHN1Ym5ldC5pZFxuKTtcbmV4cG9ydCBjb25zdCBwcml2YXRlU3VibmV0SWRzID0gc3RhY2sud2ViQXBwU3RhY2sucHJpdmF0ZVN1Ym5ldHMubWFwKFxuICBzdWJuZXQgPT4gc3VibmV0LmlkXG4pO1xuXG4vLyBBZGRpdGlvbmFsIGV4cG9ydHMgZm9yIGludGVncmF0aW9uIHRlc3RpbmdcbmV4cG9ydCBjb25zdCBhbGJOYW1lID0gc3RhY2suYWxiTmFtZTtcbmV4cG9ydCBjb25zdCBhdXRvU2NhbGluZ0dyb3VwTmFtZSA9IHN0YWNrLmF1dG9TY2FsaW5nR3JvdXBOYW1lO1xuZXhwb3J0IGNvbnN0IGVjMlJvbGVOYW1lID0gc3RhY2suZWMyUm9sZU5hbWU7XG5leHBvcnQgY29uc3QgZWMySW5zdGFuY2VQcm9maWxlTmFtZSA9IHN0YWNrLmVjMkluc3RhbmNlUHJvZmlsZU5hbWU7XG5leHBvcnQgY29uc3QgZWMyUG9saWN5TmFtZSA9IHN0YWNrLmVjMlBvbGljeU5hbWU7XG5leHBvcnQgY29uc3QgcmRzSW5zdGFuY2VJZCA9IHN0YWNrLnJkc0luc3RhbmNlSWQ7XG5leHBvcnQgY29uc3QgcmRzS21zS2V5SWQgPSBzdGFjay5yZHNLbXNLZXlJZDtcbmV4cG9ydCBjb25zdCByZHNLbXNLZXlBbGlhcyA9IHN0YWNrLnJkc0ttc0tleUFsaWFzO1xuZXhwb3J0IGNvbnN0IHByb2plY3ROYW1lID0gc3RhY2sucHJvamVjdE5hbWU7XG5leHBvcnQgY29uc3QgZW52aXJvbm1lbnQgPSBzdGFjay5lbnZpcm9ubWVudDtcbmV4cG9ydCBjb25zdCByZXNvdXJjZVByZWZpeCA9IHN0YWNrLnJlc291cmNlUHJlZml4O1xuIl19