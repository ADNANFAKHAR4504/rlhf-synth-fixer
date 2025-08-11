/**
 * s3-stack.ts
 *
 * This module defines the secure S3 bucket for document storage with AWS managed encryption,
 * versioning, access logging, and restrictive bucket policies implementing least privilege access.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
export interface S3StackArgs {
    environmentSuffix: string;
    lambdaRoleArn?: pulumi.Input<string>;
    tags?: pulumi.Input<{
        [key: string]: string;
    }>;
}
export declare class S3Stack extends pulumi.ComponentResource {
    readonly bucket: aws.s3.Bucket;
    readonly accessLogsBucket: aws.s3.Bucket;
    readonly bucketPolicy: aws.s3.BucketPolicy;
    readonly tempLambdaRole?: aws.iam.Role;
    readonly updatedBucketPolicy?: aws.s3.BucketPolicy;
    constructor(name: string, args: S3StackArgs, opts?: ResourceOptions);
    updateBucketPolicy(realLambdaRoleArn: pulumi.Input<string>): aws.s3.BucketPolicy;
}
