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
exports.applicationUrl = exports.domainUrl = exports.sshKeyName = exports.rdsSecretArn = exports.cloudTrailArn = exports.kmsKeyArn = exports.kmsKeyId = exports.lambdaFunctionArn = exports.lambdaFunctionName = exports.s3BucketArn = exports.s3BucketName = exports.albZoneId = exports.albArn = exports.albDnsName = exports.ec2PrivateIp = exports.ec2PublicIp = exports.ec2InstanceId = exports.rdsPort = exports.rdsEndpoint = exports.privateSubnetId = exports.publicSubnetId = exports.vpcId = void 0;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7R0FTRztBQUNILGlEQUFtQztBQUNuQyx1REFBeUM7QUFDekMsZ0RBQTRDO0FBRTVDLDBFQUEwRTtBQUMxRSw0RUFBNEU7QUFDNUUsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixJQUFJLEtBQUssQ0FBQztBQUVsRSxnRUFBZ0U7QUFDaEUsNkNBQTZDO0FBQzdDLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLFNBQVMsQ0FBQztBQUN2RCxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsSUFBSSxTQUFTLENBQUM7QUFFNUQsMERBQTBEO0FBQzFELGdFQUFnRTtBQUNoRSw0RUFBNEU7QUFDNUUsdURBQXVEO0FBQ3ZELE1BQU0sV0FBVyxHQUFHO0lBQ2xCLFdBQVcsRUFBRSxpQkFBaUI7SUFDOUIsVUFBVSxFQUFFLFVBQVU7SUFDdEIsTUFBTSxFQUFFLFlBQVk7Q0FDckIsQ0FBQztBQUVGLDhFQUE4RTtBQUM5RSxNQUFNLFdBQVcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxRQUFRLENBQUMsY0FBYyxFQUFFO0lBQ25ELE1BQU0sRUFBRSxXQUFXO0lBQ25CLFdBQVcsRUFBRTtRQUNYLElBQUksRUFBRSxXQUFXO0tBQ2xCO0NBQ0YsQ0FBQyxDQUFDO0FBRUgsK0RBQStEO0FBQy9ELHdEQUF3RDtBQUN4RCxNQUFNLFFBQVEsR0FBRyxJQUFJLG9CQUFRLENBQzNCLGNBQWMsRUFDZDtJQUNFLFdBQVcsRUFBRSxpQkFBaUI7SUFDOUIsSUFBSSxFQUFFLFdBQVc7Q0FDbEIsRUFDRDtJQUNFLFFBQVEsRUFBRSxXQUFXO0NBQ3RCLENBQ0YsQ0FBQztBQUVGLGdEQUFnRDtBQUNuQyxRQUFBLEtBQUssR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7QUFDckMsUUFBQSxjQUFjLEdBQUcsUUFBUSxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDO0FBQ3ZELFFBQUEsZUFBZSxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztBQUN6RCxRQUFBLFdBQVcsR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUM7QUFDekQsUUFBQSxPQUFPLEdBQUcsUUFBUSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDO0FBQ2pELFFBQUEsYUFBYSxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQztBQUNyRCxRQUFBLFdBQVcsR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUM7QUFDekQsUUFBQSxZQUFZLEdBQUcsUUFBUSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDO0FBQzNELFFBQUEsVUFBVSxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQztBQUMvQyxRQUFBLE1BQU0sR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUM7QUFDdkMsUUFBQSxTQUFTLEdBQUcsUUFBUSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDO0FBQzdDLFFBQUEsWUFBWSxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQztBQUNyRCxRQUFBLFdBQVcsR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUM7QUFDakQsUUFBQSxrQkFBa0IsR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUM7QUFDL0QsUUFBQSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUM7QUFDN0QsUUFBQSxRQUFRLEdBQUcsUUFBUSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDO0FBQzlDLFFBQUEsU0FBUyxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQztBQUM3QyxRQUFBLGFBQWEsR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUM7QUFDckQsUUFBQSxZQUFZLEdBQUcsUUFBUSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDO0FBQ25ELFFBQUEsVUFBVSxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQztBQUN0RCxRQUFBLFNBQVMsR0FBRyxRQUFRLENBQUMsWUFBWSxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUM7QUFDdEQsUUFBQSxjQUFjLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQSxHQUFHLGlCQUFTLElBQUksU0FBUyxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBQdWx1bWkgYXBwbGljYXRpb24gZW50cnkgcG9pbnQgZm9yIHRoZSBUQVAgKFRlc3QgQXV0b21hdGlvbiBQbGF0Zm9ybSkgaW5mcmFzdHJ1Y3R1cmUuXG4gKlxuICogVGhpcyBtb2R1bGUgZGVmaW5lcyB0aGUgY29yZSBQdWx1bWkgc3RhY2sgYW5kIGluc3RhbnRpYXRlcyB0aGUgVGFwU3RhY2sgd2l0aCBhcHByb3ByaWF0ZVxuICogY29uZmlndXJhdGlvbiBiYXNlZCBvbiB0aGUgZGVwbG95bWVudCBlbnZpcm9ubWVudC4gSXQgaGFuZGxlcyBlbnZpcm9ubWVudC1zcGVjaWZpYyBzZXR0aW5ncyxcbiAqIHRhZ2dpbmcsIGFuZCBkZXBsb3ltZW50IGNvbmZpZ3VyYXRpb24gZm9yIEFXUyByZXNvdXJjZXMuXG4gKlxuICogVGhlIHN0YWNrIGNyZWF0ZWQgYnkgdGhpcyBtb2R1bGUgdXNlcyBlbnZpcm9ubWVudCBzdWZmaXhlcyB0byBkaXN0aW5ndWlzaCBiZXR3ZWVuXG4gKiBkaWZmZXJlbnQgZGVwbG95bWVudCBlbnZpcm9ubWVudHMgKGRldmVsb3BtZW50LCBzdGFnaW5nLCBwcm9kdWN0aW9uLCBldGMuKS5cbiAqL1xuaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgeyBUYXBTdGFjayB9IGZyb20gJy4uL2xpYi90YXAtc3RhY2snO1xuXG4vLyBHZXQgdGhlIGVudmlyb25tZW50IHN1ZmZpeCBmcm9tIHRoZSBQdWx1bWkgY29uZmlnLCBkZWZhdWx0aW5nIHRvICdkZXYnLlxuLy8gWW91IGNhbiBzZXQgdGhpcyB2YWx1ZSB1c2luZyB0aGUgY29tbWFuZDogYHB1bHVtaSBjb25maWcgc2V0IGVudiA8dmFsdWU+YFxuY29uc3QgZW52aXJvbm1lbnRTdWZmaXggPSBwcm9jZXNzLmVudi5FTlZJUk9OTUVOVF9TVUZGSVggfHwgJ2Rldic7XG5cbi8vIEdldCBtZXRhZGF0YSBmcm9tIGVudmlyb25tZW50IHZhcmlhYmxlcyBmb3IgdGFnZ2luZyBwdXJwb3Nlcy5cbi8vIFRoZXNlIGFyZSBvZnRlbiBpbmplY3RlZCBieSBDSS9DRCBzeXN0ZW1zLlxuY29uc3QgcmVwb3NpdG9yeSA9IHByb2Nlc3MuZW52LlJFUE9TSVRPUlkgfHwgJ3Vua25vd24nO1xuY29uc3QgY29tbWl0QXV0aG9yID0gcHJvY2Vzcy5lbnYuQ09NTUlUX0FVVEhPUiB8fCAndW5rbm93bic7XG5cbi8vIERlZmluZSBhIHNldCBvZiBkZWZhdWx0IHRhZ3MgdG8gYXBwbHkgdG8gYWxsIHJlc291cmNlcy5cbi8vIFdoaWxlIG5vdCBleHBsaWNpdGx5IHVzZWQgaW4gdGhlIFRhcFN0YWNrIGluc3RhbnRpYXRpb24gaGVyZSxcbi8vIHRoaXMgaXMgdGhlIHN0YW5kYXJkIHBsYWNlIHRvIGRlZmluZSB0aGVtLiBUaGV5IHdvdWxkIHR5cGljYWxseSBiZSBwYXNzZWRcbi8vIGludG8gdGhlIFRhcFN0YWNrIG9yIGNvbmZpZ3VyZWQgb24gdGhlIEFXUyBwcm92aWRlci5cbmNvbnN0IGRlZmF1bHRUYWdzID0ge1xuICBFbnZpcm9ubWVudDogZW52aXJvbm1lbnRTdWZmaXgsXG4gIFJlcG9zaXRvcnk6IHJlcG9zaXRvcnksXG4gIEF1dGhvcjogY29tbWl0QXV0aG9yLFxufTtcblxuLy8gQ29uZmlndXJlIEFXUyBQcm92aWRlciB3aXRoIGV4cGxpY2l0IHJlZ2lvbiAodXMtd2VzdC0xIGFzIHBlciByZXF1aXJlbWVudHMpXG5jb25zdCBhd3NQcm92aWRlciA9IG5ldyBhd3MuUHJvdmlkZXIoJ2F3cy1wcm92aWRlcicsIHtcbiAgcmVnaW9uOiAndXMtd2VzdC0xJyxcbiAgZGVmYXVsdFRhZ3M6IHtcbiAgICB0YWdzOiBkZWZhdWx0VGFncyxcbiAgfSxcbn0pO1xuXG4vLyBJbnN0YW50aWF0ZSB0aGUgbWFpbiBzdGFjayBjb21wb25lbnQgZm9yIHRoZSBpbmZyYXN0cnVjdHVyZS5cbi8vIFRoaXMgZW5jYXBzdWxhdGVzIGFsbCB0aGUgcmVzb3VyY2VzIGZvciB0aGUgcGxhdGZvcm0uXG5jb25zdCB0YXBTdGFjayA9IG5ldyBUYXBTdGFjayhcbiAgJ3B1bHVtaS1pbmZyYScsXG4gIHtcbiAgICBlbnZpcm9ubWVudDogZW52aXJvbm1lbnRTdWZmaXgsXG4gICAgdGFnczogZGVmYXVsdFRhZ3MsXG4gIH0sXG4gIHtcbiAgICBwcm92aWRlcjogYXdzUHJvdmlkZXIsXG4gIH1cbik7XG5cbi8vIEV4cG9ydCBhbGwgcmVxdWlyZWQgb3V0cHV0cyBmcm9tIHRoZSBUYXBTdGFja1xuZXhwb3J0IGNvbnN0IHZwY0lkID0gdGFwU3RhY2suc2VjdXJlV2ViQXBwLnZwYy5pZDtcbmV4cG9ydCBjb25zdCBwdWJsaWNTdWJuZXRJZCA9IHRhcFN0YWNrLnNlY3VyZVdlYkFwcC5wdWJsaWNTdWJuZXQuaWQ7XG5leHBvcnQgY29uc3QgcHJpdmF0ZVN1Ym5ldElkID0gdGFwU3RhY2suc2VjdXJlV2ViQXBwLnByaXZhdGVTdWJuZXQuaWQ7XG5leHBvcnQgY29uc3QgcmRzRW5kcG9pbnQgPSB0YXBTdGFjay5zZWN1cmVXZWJBcHAucmRzSW5zdGFuY2UuZW5kcG9pbnQ7XG5leHBvcnQgY29uc3QgcmRzUG9ydCA9IHRhcFN0YWNrLnNlY3VyZVdlYkFwcC5yZHNJbnN0YW5jZS5wb3J0O1xuZXhwb3J0IGNvbnN0IGVjMkluc3RhbmNlSWQgPSB0YXBTdGFjay5zZWN1cmVXZWJBcHAuZWMySW5zdGFuY2UuaWQ7XG5leHBvcnQgY29uc3QgZWMyUHVibGljSXAgPSB0YXBTdGFjay5zZWN1cmVXZWJBcHAuZWMySW5zdGFuY2UucHVibGljSXA7XG5leHBvcnQgY29uc3QgZWMyUHJpdmF0ZUlwID0gdGFwU3RhY2suc2VjdXJlV2ViQXBwLmVjMkluc3RhbmNlLnByaXZhdGVJcDtcbmV4cG9ydCBjb25zdCBhbGJEbnNOYW1lID0gdGFwU3RhY2suc2VjdXJlV2ViQXBwLmFsYi5kbnNOYW1lO1xuZXhwb3J0IGNvbnN0IGFsYkFybiA9IHRhcFN0YWNrLnNlY3VyZVdlYkFwcC5hbGIuYXJuO1xuZXhwb3J0IGNvbnN0IGFsYlpvbmVJZCA9IHRhcFN0YWNrLnNlY3VyZVdlYkFwcC5hbGIuem9uZUlkO1xuZXhwb3J0IGNvbnN0IHMzQnVja2V0TmFtZSA9IHRhcFN0YWNrLnNlY3VyZVdlYkFwcC5zM0J1Y2tldC5idWNrZXQ7XG5leHBvcnQgY29uc3QgczNCdWNrZXRBcm4gPSB0YXBTdGFjay5zZWN1cmVXZWJBcHAuczNCdWNrZXQuYXJuO1xuZXhwb3J0IGNvbnN0IGxhbWJkYUZ1bmN0aW9uTmFtZSA9IHRhcFN0YWNrLnNlY3VyZVdlYkFwcC5sYW1iZGFGdW5jdGlvbi5uYW1lO1xuZXhwb3J0IGNvbnN0IGxhbWJkYUZ1bmN0aW9uQXJuID0gdGFwU3RhY2suc2VjdXJlV2ViQXBwLmxhbWJkYUZ1bmN0aW9uLmFybjtcbmV4cG9ydCBjb25zdCBrbXNLZXlJZCA9IHRhcFN0YWNrLnNlY3VyZVdlYkFwcC5rbXNLZXkua2V5SWQ7XG5leHBvcnQgY29uc3Qga21zS2V5QXJuID0gdGFwU3RhY2suc2VjdXJlV2ViQXBwLmttc0tleS5hcm47XG5leHBvcnQgY29uc3QgY2xvdWRUcmFpbEFybiA9IHRhcFN0YWNrLnNlY3VyZVdlYkFwcC5jbG91ZFRyYWlsLmFybjtcbmV4cG9ydCBjb25zdCByZHNTZWNyZXRBcm4gPSB0YXBTdGFjay5zZWN1cmVXZWJBcHAucmRzU2VjcmV0LmFybjtcbmV4cG9ydCBjb25zdCBzc2hLZXlOYW1lID0gdGFwU3RhY2suc2VjdXJlV2ViQXBwLnNzaEtleVBhaXIua2V5TmFtZTtcbmV4cG9ydCBjb25zdCBkb21haW5VcmwgPSB0YXBTdGFjay5zZWN1cmVXZWJBcHAucm91dGU1M1JlY29yZD8ubmFtZTtcbmV4cG9ydCBjb25zdCBhcHBsaWNhdGlvblVybCA9IHB1bHVtaS5pbnRlcnBvbGF0ZWAke2RvbWFpblVybCB8fCAnaHR0cDovLyd9JHt0YXBTdGFjay5zZWN1cmVXZWJBcHAuYWxiLmRuc05hbWV9YDtcbiJdfQ==