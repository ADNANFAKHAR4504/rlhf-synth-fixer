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
exports.environment = exports.region = exports.webhookUrl = exports.slackSecretArn = exports.artifactsBucketName = exports.sampleLambdaArn = exports.lambdaFunctionName = exports.codeBuildProjectName = exports.pipelineName = void 0;
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
const pulumi = __importStar(require("@pulumi/pulumi"));
const tap_stack_1 = require("../lib/tap-stack");
// Configure AWS provider with proper region and settings
const config = new pulumi.Config();
const awsRegion = config.get('aws:region') || process.env.AWS_REGION || 'us-east-1';
// Configure AWS provider
const awsProvider = new aws.Provider('aws-provider', {
    region: awsRegion,
    defaultTags: {
        tags: {
            ManagedBy: 'Pulumi',
            Project: 'TAP-CICD',
            Stack: pulumi.getStack(),
        },
    },
});
// Get the environment suffix from the Pulumi stack or config, defaulting to 'dev'.
const environmentSuffix = pulumi.getStack() || process.env.ENVIRONMENT_SUFFIX || 'dev';
// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
// Define a set of default tags to apply to all resources.
const defaultTags = {
    Environment: environmentSuffix,
    Repository: repository,
    Author: commitAuthor,
    CreatedBy: 'Pulumi',
    Stack: pulumi.getStack(),
    Region: awsRegion,
};
// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const stack = new tap_stack_1.TapStack('pulumi-infra', {
    environmentSuffix: environmentSuffix,
    tags: defaultTags,
}, {
    provider: awsProvider,
});
// Export stack outputs for external consumption
exports.pipelineName = stack.pipelineName;
exports.codeBuildProjectName = stack.codeBuildProjectName;
exports.lambdaFunctionName = stack.lambdaFunctionName;
exports.sampleLambdaArn = stack.sampleLambdaArn;
exports.artifactsBucketName = stack.artifactsBucketName;
exports.slackSecretArn = stack.slackSecretArn;
exports.webhookUrl = stack.webhookUrl;
exports.region = awsRegion;
exports.environment = environmentSuffix;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7R0FTRztBQUNILGlEQUFtQztBQUNuQyx1REFBeUM7QUFDekMsZ0RBQTRDO0FBRTVDLHlEQUF5RDtBQUN6RCxNQUFNLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUNuQyxNQUFNLFNBQVMsR0FDYixNQUFNLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLFdBQVcsQ0FBQztBQUVwRSx5QkFBeUI7QUFDekIsTUFBTSxXQUFXLEdBQUcsSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDLGNBQWMsRUFBRTtJQUNuRCxNQUFNLEVBQUUsU0FBUztJQUNqQixXQUFXLEVBQUU7UUFDWCxJQUFJLEVBQUU7WUFDSixTQUFTLEVBQUUsUUFBUTtZQUNuQixPQUFPLEVBQUUsVUFBVTtZQUNuQixLQUFLLEVBQUUsTUFBTSxDQUFDLFFBQVEsRUFBRTtTQUN6QjtLQUNGO0NBQ0YsQ0FBQyxDQUFDO0FBRUgsbUZBQW1GO0FBQ25GLE1BQU0saUJBQWlCLEdBQ3JCLE1BQU0sQ0FBQyxRQUFRLEVBQUUsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixJQUFJLEtBQUssQ0FBQztBQUUvRCxnRUFBZ0U7QUFDaEUsNkNBQTZDO0FBQzdDLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLFNBQVMsQ0FBQztBQUN2RCxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsSUFBSSxTQUFTLENBQUM7QUFFNUQsMERBQTBEO0FBQzFELE1BQU0sV0FBVyxHQUFHO0lBQ2xCLFdBQVcsRUFBRSxpQkFBaUI7SUFDOUIsVUFBVSxFQUFFLFVBQVU7SUFDdEIsTUFBTSxFQUFFLFlBQVk7SUFDcEIsU0FBUyxFQUFFLFFBQVE7SUFDbkIsS0FBSyxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUU7SUFDeEIsTUFBTSxFQUFFLFNBQVM7Q0FDbEIsQ0FBQztBQUVGLCtEQUErRDtBQUMvRCx3REFBd0Q7QUFDeEQsTUFBTSxLQUFLLEdBQUcsSUFBSSxvQkFBUSxDQUN4QixjQUFjLEVBQ2Q7SUFDRSxpQkFBaUIsRUFBRSxpQkFBaUI7SUFDcEMsSUFBSSxFQUFFLFdBQVc7Q0FDbEIsRUFDRDtJQUNFLFFBQVEsRUFBRSxXQUFXO0NBQ3RCLENBQ0YsQ0FBQztBQUVGLGdEQUFnRDtBQUNuQyxRQUFBLFlBQVksR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDO0FBQ2xDLFFBQUEsb0JBQW9CLEdBQUcsS0FBSyxDQUFDLG9CQUFvQixDQUFDO0FBQ2xELFFBQUEsa0JBQWtCLEdBQUcsS0FBSyxDQUFDLGtCQUFrQixDQUFDO0FBQzlDLFFBQUEsZUFBZSxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUM7QUFDeEMsUUFBQSxtQkFBbUIsR0FBRyxLQUFLLENBQUMsbUJBQW1CLENBQUM7QUFDaEQsUUFBQSxjQUFjLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQztBQUN0QyxRQUFBLFVBQVUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDO0FBQzlCLFFBQUEsTUFBTSxHQUFHLFNBQVMsQ0FBQztBQUNuQixRQUFBLFdBQVcsR0FBRyxpQkFBaUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogUHVsdW1pIGFwcGxpY2F0aW9uIGVudHJ5IHBvaW50IGZvciB0aGUgVEFQIChUZXN0IEF1dG9tYXRpb24gUGxhdGZvcm0pIGluZnJhc3RydWN0dXJlLlxuICpcbiAqIFRoaXMgbW9kdWxlIGRlZmluZXMgdGhlIGNvcmUgUHVsdW1pIHN0YWNrIGFuZCBpbnN0YW50aWF0ZXMgdGhlIFRhcFN0YWNrIHdpdGggYXBwcm9wcmlhdGVcbiAqIGNvbmZpZ3VyYXRpb24gYmFzZWQgb24gdGhlIGRlcGxveW1lbnQgZW52aXJvbm1lbnQuIEl0IGhhbmRsZXMgZW52aXJvbm1lbnQtc3BlY2lmaWMgc2V0dGluZ3MsXG4gKiB0YWdnaW5nLCBhbmQgZGVwbG95bWVudCBjb25maWd1cmF0aW9uIGZvciBBV1MgcmVzb3VyY2VzLlxuICpcbiAqIFRoZSBzdGFjayBjcmVhdGVkIGJ5IHRoaXMgbW9kdWxlIHVzZXMgZW52aXJvbm1lbnQgc3VmZml4ZXMgdG8gZGlzdGluZ3Vpc2ggYmV0d2VlblxuICogZGlmZmVyZW50IGRlcGxveW1lbnQgZW52aXJvbm1lbnRzIChkZXZlbG9wbWVudCwgc3RhZ2luZywgcHJvZHVjdGlvbiwgZXRjLikuXG4gKi9cbmltcG9ydCAqIGFzIGF3cyBmcm9tICdAcHVsdW1pL2F3cyc7XG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0IHsgVGFwU3RhY2sgfSBmcm9tICcuLi9saWIvdGFwLXN0YWNrJztcblxuLy8gQ29uZmlndXJlIEFXUyBwcm92aWRlciB3aXRoIHByb3BlciByZWdpb24gYW5kIHNldHRpbmdzXG5jb25zdCBjb25maWcgPSBuZXcgcHVsdW1pLkNvbmZpZygpO1xuY29uc3QgYXdzUmVnaW9uID1cbiAgY29uZmlnLmdldCgnYXdzOnJlZ2lvbicpIHx8IHByb2Nlc3MuZW52LkFXU19SRUdJT04gfHwgJ3VzLWVhc3QtMSc7XG5cbi8vIENvbmZpZ3VyZSBBV1MgcHJvdmlkZXJcbmNvbnN0IGF3c1Byb3ZpZGVyID0gbmV3IGF3cy5Qcm92aWRlcignYXdzLXByb3ZpZGVyJywge1xuICByZWdpb246IGF3c1JlZ2lvbixcbiAgZGVmYXVsdFRhZ3M6IHtcbiAgICB0YWdzOiB7XG4gICAgICBNYW5hZ2VkQnk6ICdQdWx1bWknLFxuICAgICAgUHJvamVjdDogJ1RBUC1DSUNEJyxcbiAgICAgIFN0YWNrOiBwdWx1bWkuZ2V0U3RhY2soKSxcbiAgICB9LFxuICB9LFxufSk7XG5cbi8vIEdldCB0aGUgZW52aXJvbm1lbnQgc3VmZml4IGZyb20gdGhlIFB1bHVtaSBzdGFjayBvciBjb25maWcsIGRlZmF1bHRpbmcgdG8gJ2RldicuXG5jb25zdCBlbnZpcm9ubWVudFN1ZmZpeCA9XG4gIHB1bHVtaS5nZXRTdGFjaygpIHx8IHByb2Nlc3MuZW52LkVOVklST05NRU5UX1NVRkZJWCB8fCAnZGV2JztcblxuLy8gR2V0IG1ldGFkYXRhIGZyb20gZW52aXJvbm1lbnQgdmFyaWFibGVzIGZvciB0YWdnaW5nIHB1cnBvc2VzLlxuLy8gVGhlc2UgYXJlIG9mdGVuIGluamVjdGVkIGJ5IENJL0NEIHN5c3RlbXMuXG5jb25zdCByZXBvc2l0b3J5ID0gcHJvY2Vzcy5lbnYuUkVQT1NJVE9SWSB8fCAndW5rbm93bic7XG5jb25zdCBjb21taXRBdXRob3IgPSBwcm9jZXNzLmVudi5DT01NSVRfQVVUSE9SIHx8ICd1bmtub3duJztcblxuLy8gRGVmaW5lIGEgc2V0IG9mIGRlZmF1bHQgdGFncyB0byBhcHBseSB0byBhbGwgcmVzb3VyY2VzLlxuY29uc3QgZGVmYXVsdFRhZ3MgPSB7XG4gIEVudmlyb25tZW50OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgUmVwb3NpdG9yeTogcmVwb3NpdG9yeSxcbiAgQXV0aG9yOiBjb21taXRBdXRob3IsXG4gIENyZWF0ZWRCeTogJ1B1bHVtaScsXG4gIFN0YWNrOiBwdWx1bWkuZ2V0U3RhY2soKSxcbiAgUmVnaW9uOiBhd3NSZWdpb24sXG59O1xuXG4vLyBJbnN0YW50aWF0ZSB0aGUgbWFpbiBzdGFjayBjb21wb25lbnQgZm9yIHRoZSBpbmZyYXN0cnVjdHVyZS5cbi8vIFRoaXMgZW5jYXBzdWxhdGVzIGFsbCB0aGUgcmVzb3VyY2VzIGZvciB0aGUgcGxhdGZvcm0uXG5jb25zdCBzdGFjayA9IG5ldyBUYXBTdGFjayhcbiAgJ3B1bHVtaS1pbmZyYScsXG4gIHtcbiAgICBlbnZpcm9ubWVudFN1ZmZpeDogZW52aXJvbm1lbnRTdWZmaXgsXG4gICAgdGFnczogZGVmYXVsdFRhZ3MsXG4gIH0sXG4gIHtcbiAgICBwcm92aWRlcjogYXdzUHJvdmlkZXIsXG4gIH1cbik7XG5cbi8vIEV4cG9ydCBzdGFjayBvdXRwdXRzIGZvciBleHRlcm5hbCBjb25zdW1wdGlvblxuZXhwb3J0IGNvbnN0IHBpcGVsaW5lTmFtZSA9IHN0YWNrLnBpcGVsaW5lTmFtZTtcbmV4cG9ydCBjb25zdCBjb2RlQnVpbGRQcm9qZWN0TmFtZSA9IHN0YWNrLmNvZGVCdWlsZFByb2plY3ROYW1lO1xuZXhwb3J0IGNvbnN0IGxhbWJkYUZ1bmN0aW9uTmFtZSA9IHN0YWNrLmxhbWJkYUZ1bmN0aW9uTmFtZTtcbmV4cG9ydCBjb25zdCBzYW1wbGVMYW1iZGFBcm4gPSBzdGFjay5zYW1wbGVMYW1iZGFBcm47XG5leHBvcnQgY29uc3QgYXJ0aWZhY3RzQnVja2V0TmFtZSA9IHN0YWNrLmFydGlmYWN0c0J1Y2tldE5hbWU7XG5leHBvcnQgY29uc3Qgc2xhY2tTZWNyZXRBcm4gPSBzdGFjay5zbGFja1NlY3JldEFybjtcbmV4cG9ydCBjb25zdCB3ZWJob29rVXJsID0gc3RhY2sud2ViaG9va1VybDtcbmV4cG9ydCBjb25zdCByZWdpb24gPSBhd3NSZWdpb247XG5leHBvcnQgY29uc3QgZW52aXJvbm1lbnQgPSBlbnZpcm9ubWVudFN1ZmZpeDtcbiJdfQ==