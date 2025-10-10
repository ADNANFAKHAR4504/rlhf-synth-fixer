import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
export interface S3StackArgs {
    environmentSuffix: string;
    tags?: pulumi.Input<{
        [key: string]: string;
    }>;
}
export declare class S3Stack extends pulumi.ComponentResource {
    readonly bucketName: pulumi.Output<string>;
    readonly bucketArn: pulumi.Output<string>;
    constructor(name: string, args: S3StackArgs, opts?: ResourceOptions);
}
