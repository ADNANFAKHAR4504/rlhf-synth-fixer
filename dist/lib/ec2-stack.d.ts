import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
export interface Ec2StackArgs {
    environmentSuffix: string;
    vpcId: pulumi.Output<string>;
    privateSubnetIds: pulumi.Output<string[]>;
    tags?: pulumi.Input<{
        [key: string]: string;
    }>;
}
export declare class Ec2Stack extends pulumi.ComponentResource {
    readonly autoScalingGroupName: pulumi.Output<string>;
    readonly targetGroupArn: pulumi.Output<string>;
    constructor(name: string, args: Ec2StackArgs, opts?: ResourceOptions);
}
