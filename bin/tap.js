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
exports.applicationUrl = exports.domainUrl = exports.cloudTrailArn = exports.kmsKeyArn = exports.kmsKeyId = exports.lambdaFunctionArn = exports.lambdaFunctionName = exports.s3BucketArn = exports.s3BucketName = exports.albZoneId = exports.albArn = exports.albDnsName = exports.ec2PrivateIp = exports.ec2PublicIp = exports.ec2InstanceId = exports.rdsPort = exports.rdsEndpoint = exports.privateSubnetId = exports.publicSubnetId = exports.vpcId = void 0;
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
// Configure AWS Provider with explicit region (us-west-1 as per requirements)
const awsProvider = new aws.Provider('aws-provider', {
    region: 'us-west-1',
    defaultTags: {
        tags: defaultTags,
    },
});
// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const tapStack = new tap_stack_1.TapStack('pulumi-infra', {
    environment: environmentSuffix,
    tags: defaultTags,
}, {
    provider: awsProvider,
});
// Export all required outputs from the TapStack
exports.vpcId = tapStack.secureWebApp.vpc.id;
exports.publicSubnetId = tapStack.secureWebApp.publicSubnet.id;
exports.privateSubnetId = tapStack.secureWebApp.privateSubnet.id;
exports.rdsEndpoint = tapStack.secureWebApp.rdsInstance.endpoint;
exports.rdsPort = tapStack.secureWebApp.rdsInstance.port;
exports.ec2InstanceId = tapStack.secureWebApp.ec2Instance.id;
exports.ec2PublicIp = tapStack.secureWebApp.ec2Instance.publicIp;
exports.ec2PrivateIp = tapStack.secureWebApp.ec2Instance.privateIp;
exports.albDnsName = tapStack.secureWebApp.alb.dnsName;
exports.albArn = tapStack.secureWebApp.alb.arn;
exports.albZoneId = tapStack.secureWebApp.alb.zoneId;
exports.s3BucketName = tapStack.secureWebApp.s3Bucket.bucket;
exports.s3BucketArn = tapStack.secureWebApp.s3Bucket.arn;
exports.lambdaFunctionName = tapStack.secureWebApp.lambdaFunction.name;
exports.lambdaFunctionArn = tapStack.secureWebApp.lambdaFunction.arn;
exports.kmsKeyId = tapStack.secureWebApp.kmsKey.keyId;
exports.kmsKeyArn = tapStack.secureWebApp.kmsKey.arn;
exports.cloudTrailArn = tapStack.secureWebApp.cloudTrail.arn;
exports.domainUrl = tapStack.secureWebApp.route53Record?.name;
exports.applicationUrl = pulumi.interpolate `${exports.domainUrl || 'http://'}${tapStack.secureWebApp.alb.dnsName}`;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7R0FTRztBQUNILGlEQUFtQztBQUNuQyx1REFBeUM7QUFDekMsZ0RBQTRDO0FBRTVDLDBFQUEwRTtBQUMxRSw0RUFBNEU7QUFDNUUsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixJQUFJLEtBQUssQ0FBQztBQUVsRSxnRUFBZ0U7QUFDaEUsNkNBQTZDO0FBQzdDLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLFNBQVMsQ0FBQztBQUN2RCxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsSUFBSSxTQUFTLENBQUM7QUFFNUQsMERBQTBEO0FBQzFELGdFQUFnRTtBQUNoRSw0RUFBNEU7QUFDNUUsdURBQXVEO0FBQ3ZELE1BQU0sV0FBVyxHQUFHO0lBQ2xCLFdBQVcsRUFBRSxpQkFBaUI7SUFDOUIsVUFBVSxFQUFFLFVBQVU7SUFDdEIsTUFBTSxFQUFFLFlBQVk7Q0FDckIsQ0FBQztBQUVGLDhFQUE4RTtBQUM5RSxNQUFNLFdBQVcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxRQUFRLENBQUMsY0FBYyxFQUFFO0lBQ25ELE1BQU0sRUFBRSxXQUFXO0lBQ25CLFdBQVcsRUFBRTtRQUNYLElBQUksRUFBRSxXQUFXO0tBQ2xCO0NBQ0YsQ0FBQyxDQUFDO0FBRUgsK0RBQStEO0FBQy9ELHdEQUF3RDtBQUN4RCxNQUFNLFFBQVEsR0FBRyxJQUFJLG9CQUFRLENBQzNCLGNBQWMsRUFDZDtJQUNFLFdBQVcsRUFBRSxpQkFBaUI7SUFDOUIsSUFBSSxFQUFFLFdBQVc7Q0FDbEIsRUFDRDtJQUNFLFFBQVEsRUFBRSxXQUFXO0NBQ3RCLENBQ0YsQ0FBQztBQUVGLGdEQUFnRDtBQUNuQyxRQUFBLEtBQUssR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7QUFDckMsUUFBQSxjQUFjLEdBQUcsUUFBUSxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDO0FBQ3ZELFFBQUEsZUFBZSxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztBQUN6RCxRQUFBLFdBQVcsR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUM7QUFDekQsUUFBQSxPQUFPLEdBQUcsUUFBUSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDO0FBQ2pELFFBQUEsYUFBYSxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQztBQUNyRCxRQUFBLFdBQVcsR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUM7QUFDekQsUUFBQSxZQUFZLEdBQUcsUUFBUSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDO0FBQzNELFFBQUEsVUFBVSxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQztBQUMvQyxRQUFBLE1BQU0sR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUM7QUFDdkMsUUFBQSxTQUFTLEdBQUcsUUFBUSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDO0FBQzdDLFFBQUEsWUFBWSxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQztBQUNyRCxRQUFBLFdBQVcsR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUM7QUFDakQsUUFBQSxrQkFBa0IsR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUM7QUFDL0QsUUFBQSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUM7QUFDN0QsUUFBQSxRQUFRLEdBQUcsUUFBUSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDO0FBQzlDLFFBQUEsU0FBUyxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQztBQUM3QyxRQUFBLGFBQWEsR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUM7QUFDckQsUUFBQSxTQUFTLEdBQUcsUUFBUSxDQUFDLFlBQVksQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDO0FBQ3RELFFBQUEsY0FBYyxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUEsR0FBRyxpQkFBUyxJQUFJLFNBQVMsR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogUHVsdW1pIGFwcGxpY2F0aW9uIGVudHJ5IHBvaW50IGZvciB0aGUgVEFQIChUZXN0IEF1dG9tYXRpb24gUGxhdGZvcm0pIGluZnJhc3RydWN0dXJlLlxuICpcbiAqIFRoaXMgbW9kdWxlIGRlZmluZXMgdGhlIGNvcmUgUHVsdW1pIHN0YWNrIGFuZCBpbnN0YW50aWF0ZXMgdGhlIFRhcFN0YWNrIHdpdGggYXBwcm9wcmlhdGVcbiAqIGNvbmZpZ3VyYXRpb24gYmFzZWQgb24gdGhlIGRlcGxveW1lbnQgZW52aXJvbm1lbnQuIEl0IGhhbmRsZXMgZW52aXJvbm1lbnQtc3BlY2lmaWMgc2V0dGluZ3MsXG4gKiB0YWdnaW5nLCBhbmQgZGVwbG95bWVudCBjb25maWd1cmF0aW9uIGZvciBBV1MgcmVzb3VyY2VzLlxuICpcbiAqIFRoZSBzdGFjayBjcmVhdGVkIGJ5IHRoaXMgbW9kdWxlIHVzZXMgZW52aXJvbm1lbnQgc3VmZml4ZXMgdG8gZGlzdGluZ3Vpc2ggYmV0d2VlblxuICogZGlmZmVyZW50IGRlcGxveW1lbnQgZW52aXJvbm1lbnRzIChkZXZlbG9wbWVudCwgc3RhZ2luZywgcHJvZHVjdGlvbiwgZXRjLikuXG4gKi9cbmltcG9ydCAqIGFzIGF3cyBmcm9tICdAcHVsdW1pL2F3cyc7XG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0IHsgVGFwU3RhY2sgfSBmcm9tICcuLi9saWIvdGFwLXN0YWNrJztcblxuLy8gR2V0IHRoZSBlbnZpcm9ubWVudCBzdWZmaXggZnJvbSB0aGUgUHVsdW1pIGNvbmZpZywgZGVmYXVsdGluZyB0byAnZGV2Jy5cbi8vIFlvdSBjYW4gc2V0IHRoaXMgdmFsdWUgdXNpbmcgdGhlIGNvbW1hbmQ6IGBwdWx1bWkgY29uZmlnIHNldCBlbnYgPHZhbHVlPmBcbmNvbnN0IGVudmlyb25tZW50U3VmZml4ID0gcHJvY2Vzcy5lbnYuRU5WSVJPTk1FTlRfU1VGRklYIHx8ICdkZXYnO1xuXG4vLyBHZXQgbWV0YWRhdGEgZnJvbSBlbnZpcm9ubWVudCB2YXJpYWJsZXMgZm9yIHRhZ2dpbmcgcHVycG9zZXMuXG4vLyBUaGVzZSBhcmUgb2Z0ZW4gaW5qZWN0ZWQgYnkgQ0kvQ0Qgc3lzdGVtcy5cbmNvbnN0IHJlcG9zaXRvcnkgPSBwcm9jZXNzLmVudi5SRVBPU0lUT1JZIHx8ICd1bmtub3duJztcbmNvbnN0IGNvbW1pdEF1dGhvciA9IHByb2Nlc3MuZW52LkNPTU1JVF9BVVRIT1IgfHwgJ3Vua25vd24nO1xuXG4vLyBEZWZpbmUgYSBzZXQgb2YgZGVmYXVsdCB0YWdzIHRvIGFwcGx5IHRvIGFsbCByZXNvdXJjZXMuXG4vLyBXaGlsZSBub3QgZXhwbGljaXRseSB1c2VkIGluIHRoZSBUYXBTdGFjayBpbnN0YW50aWF0aW9uIGhlcmUsXG4vLyB0aGlzIGlzIHRoZSBzdGFuZGFyZCBwbGFjZSB0byBkZWZpbmUgdGhlbS4gVGhleSB3b3VsZCB0eXBpY2FsbHkgYmUgcGFzc2VkXG4vLyBpbnRvIHRoZSBUYXBTdGFjayBvciBjb25maWd1cmVkIG9uIHRoZSBBV1MgcHJvdmlkZXIuXG5jb25zdCBkZWZhdWx0VGFncyA9IHtcbiAgRW52aXJvbm1lbnQ6IGVudmlyb25tZW50U3VmZml4LFxuICBSZXBvc2l0b3J5OiByZXBvc2l0b3J5LFxuICBBdXRob3I6IGNvbW1pdEF1dGhvcixcbn07XG5cbi8vIENvbmZpZ3VyZSBBV1MgUHJvdmlkZXIgd2l0aCBleHBsaWNpdCByZWdpb24gKHVzLXdlc3QtMSBhcyBwZXIgcmVxdWlyZW1lbnRzKVxuY29uc3QgYXdzUHJvdmlkZXIgPSBuZXcgYXdzLlByb3ZpZGVyKCdhd3MtcHJvdmlkZXInLCB7XG4gIHJlZ2lvbjogJ3VzLXdlc3QtMScsXG4gIGRlZmF1bHRUYWdzOiB7XG4gICAgdGFnczogZGVmYXVsdFRhZ3MsXG4gIH0sXG59KTtcblxuLy8gSW5zdGFudGlhdGUgdGhlIG1haW4gc3RhY2sgY29tcG9uZW50IGZvciB0aGUgaW5mcmFzdHJ1Y3R1cmUuXG4vLyBUaGlzIGVuY2Fwc3VsYXRlcyBhbGwgdGhlIHJlc291cmNlcyBmb3IgdGhlIHBsYXRmb3JtLlxuY29uc3QgdGFwU3RhY2sgPSBuZXcgVGFwU3RhY2soXG4gICdwdWx1bWktaW5mcmEnLFxuICB7XG4gICAgZW52aXJvbm1lbnQ6IGVudmlyb25tZW50U3VmZml4LFxuICAgIHRhZ3M6IGRlZmF1bHRUYWdzLFxuICB9LFxuICB7XG4gICAgcHJvdmlkZXI6IGF3c1Byb3ZpZGVyLFxuICB9XG4pO1xuXG4vLyBFeHBvcnQgYWxsIHJlcXVpcmVkIG91dHB1dHMgZnJvbSB0aGUgVGFwU3RhY2tcbmV4cG9ydCBjb25zdCB2cGNJZCA9IHRhcFN0YWNrLnNlY3VyZVdlYkFwcC52cGMuaWQ7XG5leHBvcnQgY29uc3QgcHVibGljU3VibmV0SWQgPSB0YXBTdGFjay5zZWN1cmVXZWJBcHAucHVibGljU3VibmV0LmlkO1xuZXhwb3J0IGNvbnN0IHByaXZhdGVTdWJuZXRJZCA9IHRhcFN0YWNrLnNlY3VyZVdlYkFwcC5wcml2YXRlU3VibmV0LmlkO1xuZXhwb3J0IGNvbnN0IHJkc0VuZHBvaW50ID0gdGFwU3RhY2suc2VjdXJlV2ViQXBwLnJkc0luc3RhbmNlLmVuZHBvaW50O1xuZXhwb3J0IGNvbnN0IHJkc1BvcnQgPSB0YXBTdGFjay5zZWN1cmVXZWJBcHAucmRzSW5zdGFuY2UucG9ydDtcbmV4cG9ydCBjb25zdCBlYzJJbnN0YW5jZUlkID0gdGFwU3RhY2suc2VjdXJlV2ViQXBwLmVjMkluc3RhbmNlLmlkO1xuZXhwb3J0IGNvbnN0IGVjMlB1YmxpY0lwID0gdGFwU3RhY2suc2VjdXJlV2ViQXBwLmVjMkluc3RhbmNlLnB1YmxpY0lwO1xuZXhwb3J0IGNvbnN0IGVjMlByaXZhdGVJcCA9IHRhcFN0YWNrLnNlY3VyZVdlYkFwcC5lYzJJbnN0YW5jZS5wcml2YXRlSXA7XG5leHBvcnQgY29uc3QgYWxiRG5zTmFtZSA9IHRhcFN0YWNrLnNlY3VyZVdlYkFwcC5hbGIuZG5zTmFtZTtcbmV4cG9ydCBjb25zdCBhbGJBcm4gPSB0YXBTdGFjay5zZWN1cmVXZWJBcHAuYWxiLmFybjtcbmV4cG9ydCBjb25zdCBhbGJab25lSWQgPSB0YXBTdGFjay5zZWN1cmVXZWJBcHAuYWxiLnpvbmVJZDtcbmV4cG9ydCBjb25zdCBzM0J1Y2tldE5hbWUgPSB0YXBTdGFjay5zZWN1cmVXZWJBcHAuczNCdWNrZXQuYnVja2V0O1xuZXhwb3J0IGNvbnN0IHMzQnVja2V0QXJuID0gdGFwU3RhY2suc2VjdXJlV2ViQXBwLnMzQnVja2V0LmFybjtcbmV4cG9ydCBjb25zdCBsYW1iZGFGdW5jdGlvbk5hbWUgPSB0YXBTdGFjay5zZWN1cmVXZWJBcHAubGFtYmRhRnVuY3Rpb24ubmFtZTtcbmV4cG9ydCBjb25zdCBsYW1iZGFGdW5jdGlvbkFybiA9IHRhcFN0YWNrLnNlY3VyZVdlYkFwcC5sYW1iZGFGdW5jdGlvbi5hcm47XG5leHBvcnQgY29uc3Qga21zS2V5SWQgPSB0YXBTdGFjay5zZWN1cmVXZWJBcHAua21zS2V5LmtleUlkO1xuZXhwb3J0IGNvbnN0IGttc0tleUFybiA9IHRhcFN0YWNrLnNlY3VyZVdlYkFwcC5rbXNLZXkuYXJuO1xuZXhwb3J0IGNvbnN0IGNsb3VkVHJhaWxBcm4gPSB0YXBTdGFjay5zZWN1cmVXZWJBcHAuY2xvdWRUcmFpbC5hcm47XG5leHBvcnQgY29uc3QgZG9tYWluVXJsID0gdGFwU3RhY2suc2VjdXJlV2ViQXBwLnJvdXRlNTNSZWNvcmQ/Lm5hbWU7XG5leHBvcnQgY29uc3QgYXBwbGljYXRpb25VcmwgPSBwdWx1bWkuaW50ZXJwb2xhdGVgJHtkb21haW5VcmwgfHwgJ2h0dHA6Ly8nfSR7dGFwU3RhY2suc2VjdXJlV2ViQXBwLmFsYi5kbnNOYW1lfWA7XG4iXX0=