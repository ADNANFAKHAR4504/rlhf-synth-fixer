import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
export interface TapStackArgs {
    environmentSuffix?: string;
    tags?: pulumi.Input<{
        [key: string]: string;
    }>;
}
export declare class TapStack extends pulumi.ComponentResource {
    readonly albDnsName: pulumi.Output<string>;
    readonly staticBucketName: pulumi.Output<string>;
    readonly vpcId: pulumi.Output<string>;
    readonly instanceConnectEndpointId: pulumi.Output<string>;
    constructor(name: string, args: TapStackArgs, opts?: ResourceOptions);
}
