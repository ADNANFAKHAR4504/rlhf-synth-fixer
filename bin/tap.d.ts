/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the TapStack with appropriate
 * configuration based on the deployment environment. It handles environment-specific settings,
 * tagging, and deployment configuration for AWS resources.
 *
 * The stack created by this module uses environment suffixes to distinguish between
 * different deployment environments (development, staging, production, etc.).
 */
import * as pulumi from '@pulumi/pulumi';
export declare const vpcId: pulumi.Output<string>;
export declare const apiUrl: pulumi.Output<string>;
export declare const bucketName: pulumi.Output<string>;
export declare const lambdaFunctionName: pulumi.Output<string>;
export declare const privateSubnetIds: pulumi.Output<string[]>;
export declare const publicSubnetIds: pulumi.Output<string[]>;
export declare const vpcSecurityGroupId: pulumi.Output<string>;
export declare const s3VpcEndpointId: pulumi.Output<string>;
export declare const vpcCidrBlock: pulumi.Output<string>;
export declare const lambdaFunctionUrl: pulumi.Output<string>;
export declare const lambdaFunctionArn: pulumi.Output<string>;
export declare const lambdaRoleArn: pulumi.Output<string>;
export declare const lambdaRoleName: pulumi.Output<string>;
export declare const s3BucketArn: pulumi.Output<string>;
export declare const s3AccessLogsBucketName: pulumi.Output<string>;
export declare const s3AccessLogsBucketArn: pulumi.Output<string>;
export declare const lambdaLogGroupName: pulumi.Output<string>;
export declare const lambdaLogGroupArn: pulumi.Output<string>;
export declare const apiGatewayLogGroupName: pulumi.Output<string>;
export declare const apiGatewayLogGroupArn: pulumi.Output<string>;
export declare const apiGatewayId: pulumi.Output<string>;
export declare const apiGatewayStageId: pulumi.Output<string>;
export declare const apiGatewayStageName: pulumi.Output<string>;
export declare const apiGatewayIntegrationId: pulumi.Output<string>;
export declare const apiGatewayMethodId: pulumi.Output<string>;
export declare const apiGatewayResourceId: pulumi.Output<string>;
export declare const region: string;
export declare const stackTags: pulumi.Output<{
    [key: string]: string;
}>;
