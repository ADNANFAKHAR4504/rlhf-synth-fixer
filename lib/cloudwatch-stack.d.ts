/**
 * cloudwatch-stack.ts
 *
 * This module defines CloudWatch Log Groups for Lambda function and API Gateway logging
 * with appropriate retention policies and least privilege access patterns.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
export interface CloudWatchStackArgs {
    environmentSuffix: string;
    tags?: pulumi.Input<{
        [key: string]: string;
    }>;
}
export declare class CloudWatchStack extends pulumi.ComponentResource {
    readonly lambdaLogGroup: aws.cloudwatch.LogGroup;
    readonly apiGatewayLogGroup: aws.cloudwatch.LogGroup;
    constructor(name: string, args: CloudWatchStackArgs, opts?: ResourceOptions);
}
