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
exports.outputs = void 0;
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
    environmentSuffix,
    tags: defaultTags,
});
// Export important resource information
exports.outputs = {
    primaryRegion: stack.secureStack.kmsStack.primaryKmsKey.arn.apply(() => 'ap-south-1'),
    secondaryRegion: stack.secureStack.kmsStack.secondaryKmsKey.arn.apply(() => 'eu-west-1'),
    // VPC Information
    primaryVpcId: stack.secureStack.vpcStack.primaryVpc.id,
    primaryVpcCidr: stack.secureStack.vpcStack.primaryVpc.cidrBlock,
    secondaryVpcId: stack.secureStack.vpcStack.secondaryVpc.id,
    secondaryVpcCidr: stack.secureStack.vpcStack.secondaryVpc.cidrBlock,
    // KMS Keys
    primaryKmsKeyId: stack.secureStack.kmsStack.primaryKmsKey.keyId,
    primaryKmsKeyArn: stack.secureStack.kmsStack.primaryKmsKey.arn,
    secondaryKmsKeyId: stack.secureStack.kmsStack.secondaryKmsKey.keyId,
    secondaryKmsKeyArn: stack.secureStack.kmsStack.secondaryKmsKey.arn,
    // RDS Information
    primaryDbEndpoint: stack.secureStack.rdsStack.primaryRdsInstance.endpoint,
    primaryDbPort: stack.secureStack.rdsStack.primaryRdsInstance.port,
    secondaryDbEndpoint: stack.secureStack.rdsStack.secondaryRdsReadReplica.endpoint,
    secondaryDbPort: stack.secureStack.rdsStack.secondaryRdsReadReplica.port,
    // Load Balancer
    loadBalancerDnsName: stack.secureStack.loadBalancerStack.applicationLoadBalancer.dnsName,
    loadBalancerZoneId: stack.secureStack.loadBalancerStack.applicationLoadBalancer.zoneId,
    // Auto Scaling Group
    autoScalingGroupName: stack.secureStack.autoScalingStack.autoScalingGroup.name,
    autoScalingGroupArn: stack.secureStack.autoScalingStack.autoScalingGroup.arn,
    // Monitoring
    snsTopicArn: stack.secureStack.monitoringStack.snsTopicArn,
    snsTopicName: stack.secureStack.monitoringStack.snsTopicName,
    // Logging
    cloudTrailArn: stack.secureStack.loggingStack.cloudTrailArn,
    cloudTrailName: stack.secureStack.loggingStack.cloudTrailName,
    logBucketName: stack.secureStack.loggingStack.logBucketName,
    flowLogsRoleName: stack.secureStack.loggingStack.flowLogsRoleName,
    flowLogsPolicyName: stack.secureStack.loggingStack.flowLogsPolicyName,
    vpcLogGroupName: stack.secureStack.loggingStack.vpcLogGroupName,
    // WAF & Shield
    webAclArn: stack.secureStack.wafShieldStack.webAclArn,
    webAclName: stack.secureStack.wafShieldStack.webAclName,
    webAclId: stack.secureStack.wafShieldStack.webAclId,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7R0FTRztBQUNILHVEQUF5QztBQUN6QyxnREFBNEM7QUFFNUMseURBQXlEO0FBQ3pELE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBRW5DLDBFQUEwRTtBQUMxRSw0RUFBNEU7QUFDNUUsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixJQUFJLEtBQUssQ0FBQztBQUVsRSxnRUFBZ0U7QUFDaEUsNkNBQTZDO0FBQzdDLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLElBQUksU0FBUyxDQUFDO0FBQ3pELE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLElBQUksU0FBUyxDQUFDO0FBRTdELDBEQUEwRDtBQUMxRCxnRUFBZ0U7QUFDaEUsNEVBQTRFO0FBQzVFLHVEQUF1RDtBQUN2RCxNQUFNLFdBQVcsR0FBRztJQUNsQixXQUFXLEVBQUUsaUJBQWlCO0lBQzlCLFVBQVUsRUFBRSxVQUFVO0lBQ3RCLE1BQU0sRUFBRSxZQUFZO0NBQ3JCLENBQUM7QUFFRiwrREFBK0Q7QUFDL0Qsd0RBQXdEO0FBQ3hELE1BQU0sS0FBSyxHQUFHLElBQUksb0JBQVEsQ0FBQyxjQUFjLEVBQUU7SUFDekMsaUJBQWlCO0lBQ2pCLElBQUksRUFBRSxXQUFXO0NBQ2xCLENBQUMsQ0FBQztBQUVILHdDQUF3QztBQUMzQixRQUFBLE9BQU8sR0FBRztJQUNyQixhQUFhLEVBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQy9ELEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FDbkI7SUFDRCxlQUFlLEVB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dCI6WyIvKipcbiAqIFB1bHVtaSBhcHBsaWNhdGlvbiBlbnRyeSBwb2ludCBmb3IgdGhlIFRBUCAoVGVzdCBBdXRvbWF0aW9uIFBsYXRmb3JtKSBpbmZyYXN0cnVjdHVyZS5cbiAqXG4gKiBUaGlzIG1vZHVsZSBkZWZpbmVzIHRoZSBjb3JlIFB1bHVtaSBzdGFjayBhbmQgaW5zdGFudGlhdGVzIHRoZSBUYXBTdGFjayB3aXRoIGFwcHJvcHJpYXRlXG4gKiBjb25maWd1cmF0aW9uIGJhc2VkIG9uIHRoZSBkZXBsb3ltZW50IGVudmlyb25tZW50LiBJdCBoYW5kbGVzIGVudmlyb25tZW50LXNwZWNpZmljIHNldHRpbmdzLFxuICogdGFnZ2luZywgYW5kIGRlcGxveW1lbnQgY29uZmlndXJhdGlvbiBmb3IgQVdTIHJlc291cmNlcy5cbiAqXG4gKiBUaGUgc3RhY2sgY3JlYXRlZCBieSB0aGlzIG1vZHVsZSB1c2VzIGVudmlyb25tZW50IHN1ZmZpeGVzIHRvIGRpc3Rpbmd1aXNoIGJldHdlZW5cbiAqIGRpZmZlcmVudCBkZXBsb3ltZW50IGVudmlyb25tZW50cyAoZGV2ZWxvcG1lbnQsIHN0YWdpbmcsIHByb2R1Y3Rpb24sIGV0Yy4pLlxuICovXG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0IHsgVGFwU3RhY2sgfSBmcm9tICcuLi9saWIvdGFwLXN0YWNrJztcblxuLy8gSW5pdGlhbGl6ZSBQdWx1bWkgY29uZmlndXJhdGlvbiBmb3IgdGhlIGN1cnJlbnQgc3RhY2suXG5jb25zdCBjb25maWcgPSBuZXcgcHVsdW1pLkNvbmZpZygpO1xuXG4vLyBHZXQgdGhlIGVudmlyb25tZW50IHN1ZmZpeCBmcm9tIHRoZSBQdWx1bWkgY29uZmlnLCBkZWZhdWx0aW5nIHRvICdkZXYnLlxuLy8gWW91IGNhbiBzZXQgdGhpcyB2YWx1ZSB1c2luZyB0aGUgY29tbWFuZDogYHB1bHVtaSBjb25maWcgc2V0IGVudiA8dmFsdWU+YFxuY29uc3QgZW52aXJvbm1lbnRTdWZmaXggPSBwcm9jZXNzLmVudi5FTlZJUk9OTUVOVF9TVUZGSVggfHwgJ2Rldic7XG5cbi8vIEdldCBtZXRhZGF0YSBmcm9tIGVudmlyb25tZW50IHZhcmlhYmxlcyBmb3IgdGFnZ2luZyBwdXJwb3Nlcy5cbi8vIFRoZXNlIGFyZSBvZnRlbiBpbmplY3RlZCBieSBDSS9DRCBzeXN0ZW1zLlxuY29uc3QgcmVwb3NpdG9yeSA9IGNvbmZpZy5nZXQoJ3JlcG9zaXRvcnknKSB8fCAndW5rbm93bic7XG5jb25zdCBjb21taXRBdXRob3IgPSBjb25maWcuZ2V0KCdjb21taXRBdXRob3InKSB8fCAndW5rbm93bic7XG5cbi8vIERlZmluZSBhIHNldCBvZiBkZWZhdWx0IHRhZ3MgdG8gYXBwbHkgdG8gYWxsIHJlc291cmNlcy5cbi8vIFdoaWxlIG5vdCBleHBsaWNpdGx5IHVzZWQgaW4gdGhlIFRhcFN0YWNrIGluc3RhbnRpYXRpb24gaGVyZSxcbi8vIHRoaXMgaXMgdGhlIHN0YW5kYXJkIHBsYWNlIHRvIGRlZmluZSB0aGVtLiBUaGV5IHdvdWxkIHR5cGljYWxseSBiZSBwYXNzZWRcbi8vIGludG8gdGhlIFRhcFN0YWNrIG9yIGNvbmZpZ3VyZWQgb24gdGhlIEFXUyBwcm92aWRlci5cbmNvbnN0IGRlZmF1bHRUYWdzID0ge1xuICBFbnZpcm9ubWVudDogZW52aXJvbm1lbnRTdWZmaXgsXG4gIFJlcG9zaXRvcnk6IHJlcG9zaXRvcnksXG4gIEF1dGhvcjogY29tbWl0QXV0aG9yLFxufTtcblxuLy8gSW5zdGFudGlhdGUgdGhlIG1haW4gc3RhY2sgY29tcG9uZW50IGZvciB0aGUgaW5mcmFzdHJ1Y3R1cmUuXG4vLyBUaGlzIGVuY2Fwc3VsYXRlcyBhbGwgdGhlIHJlc291cmNlcyBmb3IgdGhlIHBsYXRmb3JtLlxuY29uc3Qgc3RhY2sgPSBuZXcgVGFwU3RhY2soJ3B1bHVtaS1pbmZyYScsIHtcbiAgZW52aXJvbm1lbnRTdWZmaXgsXG4gIHRhZ3M6IGRlZmF1bHRUYWdzLFxufSk7XG5cbi8vIEV4cG9ydCBpbXBvcnRhbnQgcmVzb3VyY2UgaW5mb3JtYXRpb25cbmV4cG9ydCBjb25zdCBvdXRwdXRzID0ge1xuICBwcmltYXJ5UmVnaW9uOiBzdGFjay5zZWN1cmVTdGFjay5rbXNTdGFjay5wcmltYXJ5S21zS2V5LmFybi5hcHBseShcbiAgICAoKSA9PiAnYXAtc291dGgtMSdcbiAgKSxcbiAgc2Vjb25kYXJ5UmVnaW9uOiBzdGFjay5zZWN1cmVTdGFjay5rbXNTdGFjay5zZWNvbmRhcnlLbXNLZXkuYXJuLmFwcGx5KFxuICAgICgpID0+ICdldS13ZXN0LTEnXG4gICksXG5cbiAgLy8gVlBDIEluZm9ybWF0aW9uXG4gIHByaW1hcnlWcGNJZDogc3RhY2suc2VjdXJlU3RhY2sudnBjU3RhY2sucHJpbWFyeVZwYy5pZCxcbiAgcHJpbWFyeVZwY0NpZHI6IHN0YWNrLnNlY3VyZVN0YWNrLnZwY1N0YWNrLnByaW1hcnlWcGMuY2lkckJsb2NrLFxuICBzZWNvbmRhcnlWcGNJZDogc3RhY2suc2VjdXJlU3RhY2sudnBjU3RhY2suc2Vjb25kYXJ5VnBjLmlkLFxuICBzZWNvbmRhcnlWcGNDaWRyOiBzdGFjay5zZWN1cmVTdGFjay52cGNTdGFjay5zZWNvbmRhcnlWcGMuY2lkckJsb2NrLFxuXG4gIC8vIEtNUyBLZXlzXG4gIHByaW1hcnlLbXNLZXlJZDogc3RhY2suc2VjdXJlU3RhY2sua21zU3RhY2sucHJpbWFyeUttc0tleS5rZXlJZCxcbiAgcHJpbWFyeUttc0tleUFybjogc3RhY2suc2VjdXJlU3RhY2sua21zU3RhY2sucHJpbWFyeUttc0tleS5hcm4sXG4gIHNlY29uZGFyeUttc0tleUlkOiBzdGFjay5zZWN1cmVTdGFjay5rbXNTdGFjay5zZWNvbmRhcnlLbXNLZXkua2V5SWQsXG4gIHNlY29uZGFyeUttc0tleUFybjogc3RhY2suc2VjdXJlU3RhY2sua21zU3RhY2suc2Vjb25kYXJ5S21zS2V5LmFybixcblxuICAvLyBSRFMgSW5mb3JtYXRpb25cbiAgcHJpbWFyeURiRW5kcG9pbnQ6IHN0YWNrLnNlY3VyZVN0YWNrLnJkc1N0YWNrLnByaW1hcnlSZHNJbnN0YW5jZS5lbmRwb2ludCxcbiAgcHJpbWFyeURiUG9ydDogc3RhY2suc2VjdXJlU3RhY2sucmRzU3RhY2sucHJpbWFyeVJkc0luc3RhbmNlLnBvcnQsXG4gIHNlY29uZGFyeURiRW5kcG9pbnQ6XG4gICAgc3RhY2suc2VjdXJlU3RhY2sucmRzU3RhY2suc2Vjb25kYXJ5UmRzUmVhZFJlcGxpY2EuZW5kcG9pbnQsXG4gIHNlY29uZGFyeURiUG9ydDogc3RhY2suc2VjdXJlU3RhY2sucmRzU3RhY2suc2Vjb25kYXJ5UmRzUmVhZFJlcGxpY2EucG9ydCxcblxuICAvLyBMb2FkIEJhbGFuY2VyXG4gIGxvYWRCYWxhbmNlckRuc05hbWU6XG4gICAgc3RhY2suc2VjdXJlU3RhY2subG9hZEJhbGFuY2VyU3RhY2suYXBwbGljYXRpb25Mb2FkQmFsYW5jZXIuZG5zTmFtZSxcbiAgbG9hZEJhbGFuY2VyWm9uZUlkOlxuICAgIHN0YWNrLnNlY3VyZVN0YWNrLmxvYWRCYWxhbmNlclN0YWNrLmFwcGxpY2F0aW9uTG9hZEJhbGFuY2VyLnpvbmVJZCxcblxuICAvLyBBdXRvIFNjYWxpbmcgR3JvdXBcbiAgYXV0b1NjYWxpbmdHcm91cE5hbWU6XG4gICAgc3RhY2suc2VjdXJlU3RhY2suYXV0b1NjYWxpbmdTdGFjay5hdXRvU2NhbGluZ0dyb3VwLm5hbWUsXG4gIGF1dG9TY2FsaW5nR3JvdXBBcm46IHN0YWNrLnNlY3VyZVN0YWNrLmF1dG9TY2FsaW5nU3RhY2suYXV0b1NjYWxpbmdHcm91cC5hcm4sXG5cbiAgLy8gTW9uaXRvcmluZ1xuICBzbnNUb3BpY0Fybjogc3RhY2suc2VjdXJlU3RhY2subW9uaXRvcmluZ1N0YWNrLnNuc1RvcGljQXJuLFxuICBzbnNUb3BpY05hbWU6IHN0YWNrLnNlY3VyZVN0YWNrLm1vbml0b3JpbmdTdGFjay5zbnNUb3BpY05hbWUsXG5cbiAgLy8gTG9nZ2luZ1xuICBjbG91ZFRyYWlsQXJuOiBzdGFjay5zZWN1cmVTdGFjay5sb2dnaW5nU3RhY2suY2xvdWRUcmFpbEFybixcbiAgY2xvdWRUcmFpbE5hbWU6IHN0YWNrLnNlY3VyZVN0YWNrLmxvZ2dpbmdTdGFjay5jbG91ZFRyYWlsTmFtZSxcbiAgbG9nQnVja2V0TmFtZTogc3RhY2suc2VjdXJlU3RhY2subG9nZ2luZ1N0YWNrLmxvZ0J1Y2tldE5hbWUsXG4gIGZsb3dMb2dzUm9sZU5hbWU6IHN0YWNrLnNlY3VyZVN0YWNrLmxvZ2dpbmdTdGFjay5mbG93TG9nc1JvbGVOYW1lLFxuICBmbG93TG9nc1BvbGljeU5hbWU6IHN0YWNrLnNlY3VyZVN0YWNrLmxvZ2dpbmdTdGFjay5mbG93TG9nc1BvbGljeU5hbWUsXG4gIHZwY0xvZ0dyb3VwTmFtZTogc3RhY2suc2VjdXJlU3RhY2subG9nZ2luZ1N0YWNrLnZwY0xvZ0dyb3VwTmFtZSxcblxuICAvLyBXQUYgJiBTaGllbGRcbiAgd2ViQWNsQXJuOiBzdGFjay5zZWN1cmVTdGFjay53YWZTaGllbGRTdGFjay53ZWJBY2xBcm4sXG4gIHdlYkFjbE5hbWU6IHN0YWNrLnNlY3VyZVN0YWNrLndhZlNoaWVsZFN0YWNrLndlYkFjbE5hbWUsXG4gIHdlYkFjbElkOiBzdGFjay5zZWN1cmVTdGFjay53YWZTaGllbGRTdGFjay53ZWJBY2xJZCxcbn07XG4iXX0=