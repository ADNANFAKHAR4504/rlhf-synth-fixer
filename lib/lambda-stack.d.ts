/**
 * lambda-stack.ts
 *
 * This module defines the Lambda function with least privilege IAM role for secure document processing.
 * Function runs in private subnets and has minimal required permissions.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
export interface LambdaStackArgs {
    environmentSuffix: string;
    bucketArn: pulumi.Input<string>;
    bucketName: pulumi.Input<string>;
    privateSubnetIds: pulumi.Input<string>[];
    vpcSecurityGroupId: pulumi.Input<string>;
    logGroupArn: pulumi.Input<string>;
    tags?: pulumi.Input<{
        [key: string]: string;
    }>;
}
export declare class LambdaStack extends pulumi.ComponentResource {
    readonly function: aws.lambda.Function;
    readonly role: aws.iam.Role;
    readonly functionUrl: aws.lambda.FunctionUrl;
    constructor(name: string, args: LambdaStackArgs, opts?: ResourceOptions);
}
