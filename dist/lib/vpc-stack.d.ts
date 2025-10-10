import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
export interface VpcStackArgs {
    environmentSuffix: string;
    vpcCidr?: string;
    enableFlowLogs?: boolean;
    tags?: pulumi.Input<{
        [key: string]: string;
    }>;
}
export declare class VpcStack extends pulumi.ComponentResource {
    readonly vpcId: pulumi.Output<string>;
    readonly publicSubnetIds: pulumi.Output<string[]>;
    readonly privateSubnetIds: pulumi.Output<string[]>;
    constructor(name: string, args: VpcStackArgs, opts?: ResourceOptions);
}
