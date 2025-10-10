import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
/**
 * Extract target group name from ARN
 * @param arn - Target group ARN
 * @returns Target group name or empty string
 */
export declare function extractTargetGroupName(arn: string): string;
/**
 * Extract load balancer name from ARN
 * @param arn - Load balancer ARN
 * @returns Load balancer name or empty string
 */
export declare function extractLoadBalancerName(arn: string): string;
export interface CloudWatchStackArgs {
    environmentSuffix: string;
    autoScalingGroupName: pulumi.Output<string>;
    targetGroupArn: pulumi.Output<string>;
    albArn: pulumi.Output<string>;
    tags?: pulumi.Input<{
        [key: string]: string;
    }>;
}
export declare class CloudWatchStack extends pulumi.ComponentResource {
    constructor(name: string, args: CloudWatchStackArgs, opts?: ResourceOptions);
}
