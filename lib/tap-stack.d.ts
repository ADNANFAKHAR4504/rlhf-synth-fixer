import * as pulumi from '@pulumi/pulumi';
export interface TapStackArgs {
    tags?: {
        [key: string]: string;
    };
    environmentSuffix: string;
}
export declare class TapStack extends pulumi.ComponentResource {
    readonly bucketName: pulumi.Output<string>;
    readonly distributionDomainName: pulumi.Output<string>;
    readonly hostedZoneId: pulumi.Output<string>;
    readonly subscriberTableName: pulumi.Output<string>;
    readonly mediaConvertRoleArn: pulumi.Output<string>;
    constructor(name: string, args: TapStackArgs, opts?: pulumi.ComponentResourceOptions);
}
