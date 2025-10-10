import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
export interface AlbStackArgs {
    environmentSuffix: string;
    vpcId: pulumi.Output<string>;
    publicSubnetIds: pulumi.Output<string[]>;
    targetGroupArn: pulumi.Output<string>;
    tags?: pulumi.Input<{
        [key: string]: string;
    }>;
}
export declare class AlbStack extends pulumi.ComponentResource {
    readonly albArn: pulumi.Output<string>;
    readonly albDns: pulumi.Output<string>;
    constructor(name: string, args: AlbStackArgs, opts?: ResourceOptions);
}
