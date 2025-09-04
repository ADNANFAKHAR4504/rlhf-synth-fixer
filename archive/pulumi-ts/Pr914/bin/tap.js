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
exports.stackTags = exports.region = exports.apiGatewayResourceId = exports.apiGatewayMethodId = exports.apiGatewayIntegrationId = exports.apiGatewayStageName = exports.apiGatewayStageId = exports.apiGatewayId = exports.apiGatewayLogGroupArn = exports.apiGatewayLogGroupName = exports.lambdaLogGroupArn = exports.lambdaLogGroupName = exports.s3AccessLogsBucketArn = exports.s3AccessLogsBucketName = exports.s3BucketArn = exports.lambdaRoleName = exports.lambdaRoleArn = exports.lambdaFunctionArn = exports.lambdaFunctionUrl = exports.vpcCidrBlock = exports.s3VpcEndpointId = exports.vpcSecurityGroupId = exports.publicSubnetIds = exports.privateSubnetIds = exports.lambdaFunctionName = exports.bucketName = exports.apiUrl = exports.vpcId = void 0;
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
const stack = new tap_stack_1.TapStack('pulumi-infra', {
    environmentSuffix,
    tags: defaultTags,
});
// Export key stack outputs for reference and testing
exports.vpcId = stack.vpcId;
exports.apiUrl = stack.apiUrl;
exports.bucketName = stack.bucketName;
exports.lambdaFunctionName = stack.lambdaFunctionName;
// Export all networking outputs
exports.privateSubnetIds = stack.privateSubnetIds;
exports.publicSubnetIds = stack.publicSubnetIds;
exports.vpcSecurityGroupId = stack.vpcSecurityGroupId;
exports.s3VpcEndpointId = stack.s3VpcEndpointId;
exports.vpcCidrBlock = stack.vpcCidrBlock;
// Export all Lambda outputs
exports.lambdaFunctionUrl = stack.lambdaFunctionUrl;
exports.lambdaFunctionArn = stack.lambdaFunctionArn;
exports.lambdaRoleArn = stack.lambdaRoleArn;
exports.lambdaRoleName = stack.lambdaRoleName;
// Export all S3 outputs
exports.s3BucketArn = stack.s3BucketArn;
exports.s3AccessLogsBucketName = stack.s3AccessLogsBucketName;
exports.s3AccessLogsBucketArn = stack.s3AccessLogsBucketArn;
// Export all CloudWatch outputs
exports.lambdaLogGroupName = stack.lambdaLogGroupName;
exports.lambdaLogGroupArn = stack.lambdaLogGroupArn;
exports.apiGatewayLogGroupName = stack.apiGatewayLogGroupName;
exports.apiGatewayLogGroupArn = stack.apiGatewayLogGroupArn;
// Export all API Gateway outputs
exports.apiGatewayId = stack.apiGatewayId;
exports.apiGatewayStageId = stack.apiGatewayStageId;
exports.apiGatewayStageName = stack.apiGatewayStageName;
exports.apiGatewayIntegrationId = stack.apiGatewayIntegrationId;
exports.apiGatewayMethodId = stack.apiGatewayMethodId;
exports.apiGatewayResourceId = stack.apiGatewayResourceId;
// Export environment and configuration
exports.region = stack.region;
exports.stackTags = stack.tags;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7R0FTRztBQUNILHVEQUF5QztBQUN6QyxnREFBNEM7QUFFNUMseURBQXlEO0FBQ3pELE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBRW5DLDBFQUEwRTtBQUMxRSw0RUFBNEU7QUFDNUUsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQztBQUVyRCxnRUFBZ0U7QUFDaEUsNkNBQTZDO0FBQzdDLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLElBQUksU0FBUyxDQUFDO0FBQ3pELE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLElBQUksU0FBUyxDQUFDO0FBRTdELDBEQUEwRDtBQUMxRCxnRUFBZ0U7QUFDaEUsNEVBQTRFO0FBQzVFLHVEQUF1RDtBQUN2RCxNQUFNLFdBQVcsR0FBRztJQUNsQixXQUFXLEVBQUUsaUJBQWlCO0lBQzlCLFVBQVUsRUFBRSxVQUFVO0lBQ3RCLE1BQU0sRUFBRSxZQUFZO0NBQ3JCLENBQUM7QUFFRiwrREFBK0Q7QUFDL0Qsd0RBQXdEO0FBQ3hELE1BQU0sS0FBSyxHQUFHLElBQUksb0JBQVEsQ0FBQyxjQUFjLEVBQUU7SUFDekMsaUJBQWlCO0lBQ2pCLElBQUksRUFBRSxXQUFXO0NBQ2xCLENBQUMsQ0FBQztBQUVILHFEQUFxRDtBQUN4QyxRQUFBLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDO0FBQ3BCLFFBQUEsTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7QUFDdEIsUUFBQSxVQUFVLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQztBQUM5QixRQUFBLGtCQUFrQixHQUFHLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQztBQUUzRCxnQ0FBZ0M7QUFDbkIsUUFBQSxnQkFBZ0IsR0FBRyxLQUFLLENBQUMsZ0JBQWdCLENBQUM7QUFDMUMsUUFBQSxlQUFlLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQztBQUN4QyxRQUFBLGtCQUFrQixHQUFHLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQztBQUM5QyxRQUFBLGVBQWUsR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDO0FBQ3hDLFFBQUEsWUFBWSxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUM7QUFFL0MsNEJBQTRCO0FBQ2YsUUFBQSxpQkFBaUIsR0FBRyxLQUFLLENBQUMsaUJBQWlCLENBQUM7QUFDNUMsUUFBQSxpQkFBaUIsR0FBRyxLQUFLLENBQUMsaUJBQWlCLENBQUM7QUFDNUMsUUFBQSxhQUFhLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQztBQUNwQyxRQUFBLGNBQWMsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDO0FBRW5ELHdCQUF3QjtBQUNYLFFBQUEsV0FBVyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUM7QUFDaEMsUUFBQSxzQkFBc0IsR0FBRyxLQUFLLENBQUMsc0JBQXNCLENBQUM7QUFDdEQsUUFBQSxxQkFBcUIsR0FBRyxLQUFLLENBQUMscUJBQXFCLENBQUM7QUFFakUsZ0NBQWdDO0FBQ25CLFFBQUEsa0JBQWtCLEdBQUcsS0FBSyxDQUFDLGtCQUFrQixDQUFDO0FBQzlDLFFBQUEsaUJBQWlCLEdBQUcsS0FBSyxDQUFDLGlCQUFpQixDQUFDO0FBQzVDLFFBQUEsc0JBQXNCLEdBQUcsS0FBSyxDQUFDLHNCQUFzQixDQUFDO0FBQ3RELFFBQUEscUJBQXFCLEdBQUcsS0FBSyxDQUFDLHFCQUFxQixDQUFDO0FBRWpFLGlDQUFpQztBQUNwQixRQUFBLFlBQVksR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDO0FBQ2xDLFFBQUEsaUJBQWlCLEdBQUcsS0FBSyxDQUFDLGlCQUFpQixDQUFDO0FBQzVDLFFBQUEsbUJBQW1CLEdBQUcsS0FBSyxDQUFDLG1CQUFtQixDQUFDO0FBQ2hELFFBQUEsdUJBQXVCLEdBQUcsS0FBSyxDQUFDLHVCQUF1QixDQUFDO0FBQ3hELFFBQUEsa0JBQWtCLEdBQUcsS0FBSyxDQUFDLGtCQUFrQixDQUFDO0FBQzlDLFFBQUEsb0JBQW9CLEdBQUcsS0FBSyxDQUFDLG9CQUFvQixDQUFDO0FBRS9ELHVDQUF1QztBQUMxQixRQUFBLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO0FBQ3RCLFFBQUEsU0FBUyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFB1bHVtaSBhcHBsaWNhdGlvbiBlbnRyeSBwb2ludCBmb3IgdGhlIFRBUCAoVGVzdCBBdXRvbWF0aW9uIFBsYXRmb3JtKSBpbmZyYXN0cnVjdHVyZS5cbiAqXG4gKiBUaGlzIG1vZHVsZSBkZWZpbmVzIHRoZSBjb3JlIFB1bHVtaSBzdGFjayBhbmQgaW5zdGFudGlhdGVzIHRoZSBUYXBTdGFjayB3aXRoIGFwcHJvcHJpYXRlXG4gKiBjb25maWd1cmF0aW9uIGJhc2VkIG9uIHRoZSBkZXBsb3ltZW50IGVudmlyb25tZW50LiBJdCBoYW5kbGVzIGVudmlyb25tZW50LXNwZWNpZmljIHNldHRpbmdzLFxuICogdGFnZ2luZywgYW5kIGRlcGxveW1lbnQgY29uZmlndXJhdGlvbiBmb3IgQVdTIHJlc291cmNlcy5cbiAqXG4gKiBUaGUgc3RhY2sgY3JlYXRlZCBieSB0aGlzIG1vZHVsZSB1c2VzIGVudmlyb25tZW50IHN1ZmZpeGVzIHRvIGRpc3Rpbmd1aXNoIGJldHdlZW5cbiAqIGRpZmZlcmVudCBkZXBsb3ltZW50IGVudmlyb25tZW50cyAoZGV2ZWxvcG1lbnQsIHN0YWdpbmcsIHByb2R1Y3Rpb24sIGV0Yy4pLlxuICovXG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0IHsgVGFwU3RhY2sgfSBmcm9tICcuLi9saWIvdGFwLXN0YWNrJztcblxuLy8gSW5pdGlhbGl6ZSBQdWx1bWkgY29uZmlndXJhdGlvbiBmb3IgdGhlIGN1cnJlbnQgc3RhY2suXG5jb25zdCBjb25maWcgPSBuZXcgcHVsdW1pLkNvbmZpZygpO1xuXG4vLyBHZXQgdGhlIGVudmlyb25tZW50IHN1ZmZpeCBmcm9tIHRoZSBQdWx1bWkgY29uZmlnLCBkZWZhdWx0aW5nIHRvICdkZXYnLlxuLy8gWW91IGNhbiBzZXQgdGhpcyB2YWx1ZSB1c2luZyB0aGUgY29tbWFuZDogYHB1bHVtaSBjb25maWcgc2V0IGVudiA8dmFsdWU+YFxuY29uc3QgZW52aXJvbm1lbnRTdWZmaXggPSBjb25maWcuZ2V0KCdlbnYnKSB8fCAnZGV2JztcblxuLy8gR2V0IG1ldGFkYXRhIGZyb20gZW52aXJvbm1lbnQgdmFyaWFibGVzIGZvciB0YWdnaW5nIHB1cnBvc2VzLlxuLy8gVGhlc2UgYXJlIG9mdGVuIGluamVjdGVkIGJ5IENJL0NEIHN5c3RlbXMuXG5jb25zdCByZXBvc2l0b3J5ID0gY29uZmlnLmdldCgncmVwb3NpdG9yeScpIHx8ICd1bmtub3duJztcbmNvbnN0IGNvbW1pdEF1dGhvciA9IGNvbmZpZy5nZXQoJ2NvbW1pdEF1dGhvcicpIHx8ICd1bmtub3duJztcblxuLy8gRGVmaW5lIGEgc2V0IG9mIGRlZmF1bHQgdGFncyB0byBhcHBseSB0byBhbGwgcmVzb3VyY2VzLlxuLy8gV2hpbGUgbm90IGV4cGxpY2l0bHkgdXNlZCBpbiB0aGUgVGFwU3RhY2sgaW5zdGFudGlhdGlvbiBoZXJlLFxuLy8gdGhpcyBpcyB0aGUgc3RhbmRhcmQgcGxhY2UgdG8gZGVmaW5lIHRoZW0uIFRoZXkgd291bGQgdHlwaWNhbGx5IGJlIHBhc3NlZFxuLy8gaW50byB0aGUgVGFwU3RhY2sgb3IgY29uZmlndXJlZCBvbiB0aGUgQVdTIHByb3ZpZGVyLlxuY29uc3QgZGVmYXVsdFRhZ3MgPSB7XG4gIEVudmlyb25tZW50OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgUmVwb3NpdG9yeTogcmVwb3NpdG9yeSxcbiAgQXV0aG9yOiBjb21taXRBdXRob3IsXG59O1xuXG4vLyBJbnN0YW50aWF0ZSB0aGUgbWFpbiBzdGFjayBjb21wb25lbnQgZm9yIHRoZSBpbmZyYXN0cnVjdHVyZS5cbi8vIFRoaXMgZW5jYXBzdWxhdGVzIGFsbCB0aGUgcmVzb3VyY2VzIGZvciB0aGUgcGxhdGZvcm0uXG5jb25zdCBzdGFjayA9IG5ldyBUYXBTdGFjaygncHVsdW1pLWluZnJhJywge1xuICBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgdGFnczogZGVmYXVsdFRhZ3MsXG59KTtcblxuLy8gRXhwb3J0IGtleSBzdGFjayBvdXRwdXRzIGZvciByZWZlcmVuY2UgYW5kIHRlc3RpbmdcbmV4cG9ydCBjb25zdCB2cGNJZCA9IHN0YWNrLnZwY0lkO1xuZXhwb3J0IGNvbnN0IGFwaVVybCA9IHN0YWNrLmFwaVVybDtcbmV4cG9ydCBjb25zdCBidWNrZXROYW1lID0gc3RhY2suYnVja2V0TmFtZTtcbmV4cG9ydCBjb25zdCBsYW1iZGFGdW5jdGlvbk5hbWUgPSBzdGFjay5sYW1iZGFGdW5jdGlvbk5hbWU7XG5cbi8vIEV4cG9ydCBhbGwgbmV0d29ya2luZyBvdXRwdXRzXG5leHBvcnQgY29uc3QgcHJpdmF0ZVN1Ym5ldElkcyA9IHN0YWNrLnByaXZhdGVTdWJuZXRJZHM7XG5leHBvcnQgY29uc3QgcHVibGljU3VibmV0SWRzID0gc3RhY2sucHVibGljU3VibmV0SWRzO1xuZXhwb3J0IGNvbnN0IHZwY1NlY3VyaXR5R3JvdXBJZCA9IHN0YWNrLnZwY1NlY3VyaXR5R3JvdXBJZDtcbmV4cG9ydCBjb25zdCBzM1ZwY0VuZHBvaW50SWQgPSBzdGFjay5zM1ZwY0VuZHBvaW50SWQ7XG5leHBvcnQgY29uc3QgdnBjQ2lkckJsb2NrID0gc3RhY2sudnBjQ2lkckJsb2NrO1xuXG4vLyBFeHBvcnQgYWxsIExhbWJkYSBvdXRwdXRzXG5leHBvcnQgY29uc3QgbGFtYmRhRnVuY3Rpb25VcmwgPSBzdGFjay5sYW1iZGFGdW5jdGlvblVybDtcbmV4cG9ydCBjb25zdCBsYW1iZGFGdW5jdGlvbkFybiA9IHN0YWNrLmxhbWJkYUZ1bmN0aW9uQXJuO1xuZXhwb3J0IGNvbnN0IGxhbWJkYVJvbGVBcm4gPSBzdGFjay5sYW1iZGFSb2xlQXJuO1xuZXhwb3J0IGNvbnN0IGxhbWJkYVJvbGVOYW1lID0gc3RhY2subGFtYmRhUm9sZU5hbWU7XG5cbi8vIEV4cG9ydCBhbGwgUzMgb3V0cHV0c1xuZXhwb3J0IGNvbnN0IHMzQnVja2V0QXJuID0gc3RhY2suczNCdWNrZXRBcm47XG5leHBvcnQgY29uc3QgczNBY2Nlc3NMb2dzQnVja2V0TmFtZSA9IHN0YWNrLnMzQWNjZXNzTG9nc0J1Y2tldE5hbWU7XG5leHBvcnQgY29uc3QgczNBY2Nlc3NMb2dzQnVja2V0QXJuID0gc3RhY2suczNBY2Nlc3NMb2dzQnVja2V0QXJuO1xuXG4vLyBFeHBvcnQgYWxsIENsb3VkV2F0Y2ggb3V0cHV0c1xuZXhwb3J0IGNvbnN0IGxhbWJkYUxvZ0dyb3VwTmFtZSA9IHN0YWNrLmxhbWJkYUxvZ0dyb3VwTmFtZTtcbmV4cG9ydCBjb25zdCBsYW1iZGFMb2dHcm91cEFybiA9IHN0YWNrLmxhbWJkYUxvZ0dyb3VwQXJuO1xuZXhwb3J0IGNvbnN0IGFwaUdhdGV3YXlMb2dHcm91cE5hbWUgPSBzdGFjay5hcGlHYXRld2F5TG9nR3JvdXBOYW1lO1xuZXhwb3J0IGNvbnN0IGFwaUdhdGV3YXlMb2dHcm91cEFybiA9IHN0YWNrLmFwaUdhdGV3YXlMb2dHcm91cEFybjtcblxuLy8gRXhwb3J0IGFsbCBBUEkgR2F0ZXdheSBvdXRwdXRzXG5leHBvcnQgY29uc3QgYXBpR2F0ZXdheUlkID0gc3RhY2suYXBpR2F0ZXdheUlkO1xuZXhwb3J0IGNvbnN0IGFwaUdhdGV3YXlTdGFnZUlkID0gc3RhY2suYXBpR2F0ZXdheVN0YWdlSWQ7XG5leHBvcnQgY29uc3QgYXBpR2F0ZXdheVN0YWdlTmFtZSA9IHN0YWNrLmFwaUdhdGV3YXlTdGFnZU5hbWU7XG5leHBvcnQgY29uc3QgYXBpR2F0ZXdheUludGVncmF0aW9uSWQgPSBzdGFjay5hcGlHYXRld2F5SW50ZWdyYXRpb25JZDtcbmV4cG9ydCBjb25zdCBhcGlHYXRld2F5TWV0aG9kSWQgPSBzdGFjay5hcGlHYXRld2F5TWV0aG9kSWQ7XG5leHBvcnQgY29uc3QgYXBpR2F0ZXdheVJlc291cmNlSWQgPSBzdGFjay5hcGlHYXRld2F5UmVzb3VyY2VJZDtcblxuLy8gRXhwb3J0IGVudmlyb25tZW50IGFuZCBjb25maWd1cmF0aW9uXG5leHBvcnQgY29uc3QgcmVnaW9uID0gc3RhY2sucmVnaW9uO1xuZXhwb3J0IGNvbnN0IHN0YWNrVGFncyA9IHN0YWNrLnRhZ3M7XG4iXX0=