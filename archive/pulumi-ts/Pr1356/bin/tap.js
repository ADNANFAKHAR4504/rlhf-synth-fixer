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
exports.parameterStorePaths = exports.applicationUrl = exports.domainUrl = exports.sshKeyName = exports.rdsSecretArn = exports.cloudTrailArn = exports.kmsKeyArn = exports.kmsKeyId = exports.lambdaFunctionArn = exports.lambdaFunctionName = exports.s3BucketArn = exports.s3BucketName = exports.albZoneId = exports.albArn = exports.albDnsName = exports.ec2PrivateIp = exports.ec2PublicIp = exports.ec2InstanceId = exports.rdsPort = exports.rdsEndpoint = exports.privateSubnetId = exports.publicSubnetId = exports.vpcId = void 0;
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
exports.rdsSecretArn = tapStack.secureWebApp.rdsSecret.arn;
exports.sshKeyName = tapStack.secureWebApp.sshKeyPair.keyName;
exports.domainUrl = tapStack.secureWebApp.route53Record?.name;
exports.applicationUrl = pulumi.interpolate `${exports.domainUrl || 'http://'}${tapStack.secureWebApp.alb.dnsName}`;
// Export Parameter Store paths for configuration
exports.parameterStorePaths = {
    databaseName: `/TapStack${environmentSuffix}/app/database/name`,
    databasePort: `/TapStack${environmentSuffix}/app/database/port`,
    environment: `/TapStack${environmentSuffix}/app/environment`,
    region: `/TapStack${environmentSuffix}/app/region`,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7R0FTRztBQUNILGlEQUFtQztBQUNuQyx1REFBeUM7QUFDekMsZ0RBQTRDO0FBRTVDLDBFQUEwRTtBQUMxRSw0RUFBNEU7QUFDNUUsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixJQUFJLEtBQUssQ0FBQztBQUVsRSxnRUFBZ0U7QUFDaEUsNkNBQTZDO0FBQzdDLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLFNBQVMsQ0FBQztBQUN2RCxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsSUFBSSxTQUFTLENBQUM7QUFFNUQsMERBQTBEO0FBQzFELGdFQUFnRTtBQUNoRSw0RUFBNEU7QUFDNUUsdURBQXVEO0FBQ3ZELE1BQU0sV0FBVyxHQUFHO0lBQ2xCLFdBQVcsRUFBRSxpQkFBaUI7SUFDOUIsVUFBVSxFQUFFLFVBQVU7SUFDdEIsTUFBTSxFQUFFLFlBQVk7Q0FDckIsQ0FBQztBQUVGLDhFQUE4RTtBQUM5RSxNQUFNLFdBQVcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxRQUFRLENBQUMsY0FBYyxFQUFFO0lBQ25ELE1BQU0sRUFBRSxXQUFXO0lBQ25CLFdBQVcsRUFBRTtRQUNYLElBQUksRUFBRSxXQUFXO0tBQ2xCO0NBQ0YsQ0FBQyxDQUFDO0FBRUgsK0RBQStEO0FBQy9ELHdEQUF3RDtBQUN4RCxNQUFNLFFBQVEsR0FBRyxJQUFJLG9CQUFRLENBQzNCLGNBQWMsRUFDZDtJQUNFLFdBQVcsRUFBRSxpQkFBaUI7SUFDOUIsSUFBSSxFQUFFLFdBQVc7Q0FDbEIsRUFDRDtJQUNFLFFBQVEsRUFBRSxXQUFXO0NBQ3RCLENBQ0YsQ0FBQztBQUVGLGdEQUFnRDtBQUNuQyxRQUFBLEtBQUssR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7QUFDckMsUUFBQSxjQUFjLEdBQUcsUUFBUSxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDO0FBQ3ZELFFBQUEsZUFBZSxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztBQUN6RCxRQUFBLFdBQVcsR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUM7QUFDekQsUUFBQSxPQUFPLEdBQUcsUUFBUSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDO0FBQ2pELFFBQUEsYUFBYSxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQztBQUNyRCxRQUFBLFdBQVcsR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUM7QUFDekQsUUFBQSxZQUFZLEdBQUcsUUFBUSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDO0FBQzNELFFBQUEsVUFBVSxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQztBQUMvQyxRQUFBLE1BQU0sR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUM7QUFDdkMsUUFBQSxTQUFTLEdBQUcsUUFBUSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDO0FBQzdDLFFBQUEsWUFBWSxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQztBQUNyRCxRQUFBLFdBQVcsR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUM7QUFDakQsUUFBQSxrQkFBa0IsR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUM7QUFDL0QsUUFBQSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUM7QUFDN0QsUUFBQSxRQUFRLEdBQUcsUUFBUSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDO0FBQzlDLFFBQUEsU0FBUyxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQztBQUM3QyxRQUFBLGFBQWEsR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUM7QUFDckQsUUFBQSxZQUFZLEdBQUcsUUFBUSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDO0FBQ25ELFFBQUEsVUFBVSxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQztBQUN0RCxRQUFBLFNBQVMsR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUM7QUFDdEQsUUFBQSxjQUFjLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQSxHQUFHLGlCQUFTLElBQUksU0FBUyxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBRWhILGlEQUFpRDtBQUNwQyxRQUFBLG1CQUFtQixHQUFHO0lBQ2pDLFlBQVksRUFBRSxZQUFZLGlCQUFpQixvQkFBb0I7SUFDL0QsWUFBWSxFQUFFLFlBQVksaUJBQWlCLG9CQUFvQjtJQUMvRCxXQUFXLEVBQUUsWUFBWSxpQkFBaUIsa0JBQWtCO0lBQzVELE1BQU0sRUFBRSxZQUFZLGlCQUFpQixhQUFhO0NBQ25ELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFB1bHVtaSBhcHBsaWNhdGlvbiBlbnRyeSBwb2ludCBmb3IgdGhlIFRBUCAoVGVzdCBBdXRvbWF0aW9uIFBsYXRmb3JtKSBpbmZyYXN0cnVjdHVyZS5cbiAqXG4gKiBUaGlzIG1vZHVsZSBkZWZpbmVzIHRoZSBjb3JlIFB1bHVtaSBzdGFjayBhbmQgaW5zdGFudGlhdGVzIHRoZSBUYXBTdGFjayB3aXRoIGFwcHJvcHJpYXRlXG4gKiBjb25maWd1cmF0aW9uIGJhc2VkIG9uIHRoZSBkZXBsb3ltZW50IGVudmlyb25tZW50LiBJdCBoYW5kbGVzIGVudmlyb25tZW50LXNwZWNpZmljIHNldHRpbmdzLFxuICogdGFnZ2luZywgYW5kIGRlcGxveW1lbnQgY29uZmlndXJhdGlvbiBmb3IgQVdTIHJlc291cmNlcy5cbiAqXG4gKiBUaGUgc3RhY2sgY3JlYXRlZCBieSB0aGlzIG1vZHVsZSB1c2VzIGVudmlyb25tZW50IHN1ZmZpeGVzIHRvIGRpc3Rpbmd1aXNoIGJldHdlZW5cbiAqIGRpZmZlcmVudCBkZXBsb3ltZW50IGVudmlyb25tZW50cyAoZGV2ZWxvcG1lbnQsIHN0YWdpbmcsIHByb2R1Y3Rpb24sIGV0Yy4pLlxuICovXG5pbXBvcnQgKiBhcyBhd3MgZnJvbSAnQHB1bHVtaS9hd3MnO1xuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCB7IFRhcFN0YWNrIH0gZnJvbSAnLi4vbGliL3RhcC1zdGFjayc7XG5cbi8vIEdldCB0aGUgZW52aXJvbm1lbnQgc3VmZml4IGZyb20gdGhlIFB1bHVtaSBjb25maWcsIGRlZmF1bHRpbmcgdG8gJ2RldicuXG4vLyBZb3UgY2FuIHNldCB0aGlzIHZhbHVlIHVzaW5nIHRoZSBjb21tYW5kOiBgcHVsdW1pIGNvbmZpZyBzZXQgZW52IDx2YWx1ZT5gXG5jb25zdCBlbnZpcm9ubWVudFN1ZmZpeCA9IHByb2Nlc3MuZW52LkVOVklST05NRU5UX1NVRkZJWCB8fCAnZGV2JztcblxuLy8gR2V0IG1ldGFkYXRhIGZyb20gZW52aXJvbm1lbnQgdmFyaWFibGVzIGZvciB0YWdnaW5nIHB1cnBvc2VzLlxuLy8gVGhlc2UgYXJlIG9mdGVuIGluamVjdGVkIGJ5IENJL0NEIHN5c3RlbXMuXG5jb25zdCByZXBvc2l0b3J5ID0gcHJvY2Vzcy5lbnYuUkVQT1NJVE9SWSB8fCAndW5rbm93bic7XG5jb25zdCBjb21taXRBdXRob3IgPSBwcm9jZXNzLmVudi5DT01NSVRfQVVUSE9SIHx8ICd1bmtub3duJztcblxuLy8gRGVmaW5lIGEgc2V0IG9mIGRlZmF1bHQgdGFncyB0byBhcHBseSB0byBhbGwgcmVzb3VyY2VzLlxuLy8gV2hpbGUgbm90IGV4cGxpY2l0bHkgdXNlZCBpbiB0aGUgVGFwU3RhY2sgaW5zdGFudGlhdGlvbiBoZXJlLFxuLy8gdGhpcyBpcyB0aGUgc3RhbmRhcmQgcGxhY2UgdG8gZGVmaW5lIHRoZW0uIFRoZXkgd291bGQgdHlwaWNhbGx5IGJlIHBhc3NlZFxuLy8gaW50byB0aGUgVGFwU3RhY2sgb3IgY29uZmlndXJlZCBvbiB0aGUgQVdTIHByb3ZpZGVyLlxuY29uc3QgZGVmYXVsdFRhZ3MgPSB7XG4gIEVudmlyb25tZW50OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgUmVwb3NpdG9yeTogcmVwb3NpdG9yeSxcbiAgQXV0aG9yOiBjb21taXRBdXRob3IsXG59O1xuXG4vLyBDb25maWd1cmUgQVdTIFByb3ZpZGVyIHdpdGggZXhwbGljaXQgcmVnaW9uICh1cy13ZXN0LTEgYXMgcGVyIHJlcXVpcmVtZW50cylcbmNvbnN0IGF3c1Byb3ZpZGVyID0gbmV3IGF3cy5Qcm92aWRlcignYXdzLXByb3ZpZGVyJywge1xuICByZWdpb246ICd1cy13ZXN0LTEnLFxuICBkZWZhdWx0VGFnczoge1xuICAgIHRhZ3M6IGRlZmF1bHRUYWdzLFxuICB9LFxufSk7XG5cbi8vIEluc3RhbnRpYXRlIHRoZSBtYWluIHN0YWNrIGNvbXBvbmVudCBmb3IgdGhlIGluZnJhc3RydWN0dXJlLlxuLy8gVGhpcyBlbmNhcHN1bGF0ZXMgYWxsIHRoZSByZXNvdXJjZXMgZm9yIHRoZSBwbGF0Zm9ybS5cbmNvbnN0IHRhcFN0YWNrID0gbmV3IFRhcFN0YWNrKFxuICAncHVsdW1pLWluZnJhJyxcbiAge1xuICAgIGVudmlyb25tZW50OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgICB0YWdzOiBkZWZhdWx0VGFncyxcbiAgfSxcbiAge1xuICAgIHByb3ZpZGVyOiBhd3NQcm92aWRlcixcbiAgfVxuKTtcblxuLy8gRXhwb3J0IGFsbCByZXF1aXJlZCBvdXRwdXRzIGZyb20gdGhlIFRhcFN0YWNrXG5leHBvcnQgY29uc3QgdnBjSWQgPSB0YXBTdGFjay5zZWN1cmVXZWJBcHAudnBjLmlkO1xuZXhwb3J0IGNvbnN0IHB1YmxpY1N1Ym5ldElkID0gdGFwU3RhY2suc2VjdXJlV2ViQXBwLnB1YmxpY1N1Ym5ldC5pZDtcbmV4cG9ydCBjb25zdCBwcml2YXRlU3VibmV0SWQgPSB0YXBTdGFjay5zZWN1cmVXZWJBcHAucHJpdmF0ZVN1Ym5ldC5pZDtcbmV4cG9ydCBjb25zdCByZHNFbmRwb2ludCA9IHRhcFN0YWNrLnNlY3VyZVdlYkFwcC5yZHNJbnN0YW5jZS5lbmRwb2ludDtcbmV4cG9ydCBjb25zdCByZHNQb3J0ID0gdGFwU3RhY2suc2VjdXJlV2ViQXBwLnJkc0luc3RhbmNlLnBvcnQ7XG5leHBvcnQgY29uc3QgZWMySW5zdGFuY2VJZCA9IHRhcFN0YWNrLnNlY3VyZVdlYkFwcC5lYzJJbnN0YW5jZS5pZDtcbmV4cG9ydCBjb25zdCBlYzJQdWJsaWNJcCA9IHRhcFN0YWNrLnNlY3VyZVdlYkFwcC5lYzJJbnN0YW5jZS5wdWJsaWNJcDtcbmV4cG9ydCBjb25zdCBlYzJQcml2YXRlSXAgPSB0YXBTdGFjay5zZWN1cmVXZWJBcHAuZWMySW5zdGFuY2UucHJpdmF0ZUlwO1xuZXhwb3J0IGNvbnN0IGFsYkRuc05hbWUgPSB0YXBTdGFjay5zZWN1cmVXZWJBcHAuYWxiLmRuc05hbWU7XG5leHBvcnQgY29uc3QgYWxiQXJuID0gdGFwU3RhY2suc2VjdXJlV2ViQXBwLmFsYi5hcm47XG5leHBvcnQgY29uc3QgYWxiWm9uZUlkID0gdGFwU3RhY2suc2VjdXJlV2ViQXBwLmFsYi56b25lSWQ7XG5leHBvcnQgY29uc3QgczNCdWNrZXROYW1lID0gdGFwU3RhY2suc2VjdXJlV2ViQXBwLnMzQnVja2V0LmJ1Y2tldDtcbmV4cG9ydCBjb25zdCBzM0J1Y2tldEFybiA9IHRhcFN0YWNrLnNlY3VyZVdlYkFwcC5zM0J1Y2tldC5hcm47XG5leHBvcnQgY29uc3QgbGFtYmRhRnVuY3Rpb25OYW1lID0gdGFwU3RhY2suc2VjdXJlV2ViQXBwLmxhbWJkYUZ1bmN0aW9uLm5hbWU7XG5leHBvcnQgY29uc3QgbGFtYmRhRnVuY3Rpb25Bcm4gPSB0YXBTdGFjay5zZWN1cmVXZWJBcHAubGFtYmRhRnVuY3Rpb24uYXJuO1xuZXhwb3J0IGNvbnN0IGttc0tleUlkID0gdGFwU3RhY2suc2VjdXJlV2ViQXBwLmttc0tleS5rZXlJZDtcbmV4cG9ydCBjb25zdCBrbXNLZXlBcm4gPSB0YXBTdGFjay5zZWN1cmVXZWJBcHAua21zS2V5LmFybjtcbmV4cG9ydCBjb25zdCBjbG91ZFRyYWlsQXJuID0gdGFwU3RhY2suc2VjdXJlV2ViQXBwLmNsb3VkVHJhaWwuYXJuO1xuZXhwb3J0IGNvbnN0IHJkc1NlY3JldEFybiA9IHRhcFN0YWNrLnNlY3VyZVdlYkFwcC5yZHNTZWNyZXQuYXJuO1xuZXhwb3J0IGNvbnN0IHNzaEtleU5hbWUgPSB0YXBTdGFjay5zZWN1cmVXZWJBcHAuc3NoS2V5UGFpci5rZXlOYW1lO1xuZXhwb3J0IGNvbnN0IGRvbWFpblVybCA9IHRhcFN0YWNrLnNlY3VyZVdlYkFwcC5yb3V0ZTUzUmVjb3JkPy5uYW1lO1xuZXhwb3J0IGNvbnN0IGFwcGxpY2F0aW9uVXJsID0gcHVsdW1pLmludGVycG9sYXRlYCR7ZG9tYWluVXJsIHx8ICdodHRwOi8vJ30ke3RhcFN0YWNrLnNlY3VyZVdlYkFwcC5hbGIuZG5zTmFtZX1gO1xuXG4vLyBFeHBvcnQgUGFyYW1ldGVyIFN0b3JlIHBhdGhzIGZvciBjb25maWd1cmF0aW9uXG5leHBvcnQgY29uc3QgcGFyYW1ldGVyU3RvcmVQYXRocyA9IHtcbiAgZGF0YWJhc2VOYW1lOiBgL1RhcFN0YWNrJHtlbnZpcm9ubWVudFN1ZmZpeH0vYXBwL2RhdGFiYXNlL25hbWVgLFxuICBkYXRhYmFzZVBvcnQ6IGAvVGFwU3RhY2ske2Vudmlyb25tZW50U3VmZml4fS9hcHAvZGF0YWJhc2UvcG9ydGAsXG4gIGVudmlyb25tZW50OiBgL1RhcFN0YWNrJHtlbnZpcm9ubWVudFN1ZmZpeH0vYXBwL2Vudmlyb25tZW50YCxcbiAgcmVnaW9uOiBgL1RhcFN0YWNrJHtlbnZpcm9ubWVudFN1ZmZpeH0vYXBwL3JlZ2lvbmAsXG59O1xuIl19