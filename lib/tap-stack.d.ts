import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
export interface TapStackArgs {
    environmentSuffix?: string;
    tags?: pulumi.Input<{
        [key: string]: string;
    }>;
}
export declare class TapStack extends pulumi.ComponentResource {
    readonly vpcId: pulumi.Output<string>;
    readonly apiUrl: pulumi.Output<string>;
    readonly bucketName: pulumi.Output<string>;
    readonly lambdaFunctionName: pulumi.Output<string>;
    readonly privateSubnetIds: pulumi.Output<string[]>;
    readonly publicSubnetIds: pulumi.Output<string[]>;
    readonly vpcSecurityGroupId: pulumi.Output<string>;
    readonly s3VpcEndpointId: pulumi.Output<string>;
    readonly vpcCidrBlock: pulumi.Output<string>;
    readonly lambdaFunctionUrl: pulumi.Output<string>;
    readonly lambdaFunctionArn: pulumi.Output<string>;
    readonly lambdaRoleArn: pulumi.Output<string>;
    readonly lambdaRoleName: pulumi.Output<string>;
    readonly s3BucketArn: pulumi.Output<string>;
    readonly s3AccessLogsBucketName: pulumi.Output<string>;
    readonly s3AccessLogsBucketArn: pulumi.Output<string>;
    readonly lambdaLogGroupName: pulumi.Output<string>;
    readonly lambdaLogGroupArn: pulumi.Output<string>;
    readonly apiGatewayLogGroupName: pulumi.Output<string>;
    readonly apiGatewayLogGroupArn: pulumi.Output<string>;
    readonly apiGatewayId: pulumi.Output<string>;
    readonly apiGatewayStageId: pulumi.Output<string>;
    readonly apiGatewayStageName: pulumi.Output<string>;
    readonly apiGatewayIntegrationId: pulumi.Output<string>;
    readonly apiGatewayMethodId: pulumi.Output<string>;
    readonly apiGatewayResourceId: pulumi.Output<string>;
    readonly region: string;
    readonly environmentSuffix: string;
    readonly tags: pulumi.Output<{
        [key: string]: string;
    }>;
    constructor(name: string, args: TapStackArgs, opts?: ResourceOptions);
}
