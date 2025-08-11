/**
 * api-gateway-stack.ts
 *
 * This module defines the REST API Gateway with secure integration to Lambda function.
 * Implements private integration, logging, and security best practices.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
export interface ApiGatewayStackArgs {
    environmentSuffix: string;
    lambdaFunctionArn: pulumi.Input<string>;
    lambdaFunctionName: pulumi.Input<string>;
    tags?: pulumi.Input<{
        [key: string]: string;
    }>;
}
export declare class ApiGatewayStack extends pulumi.ComponentResource {
    readonly api: aws.apigateway.RestApi;
    readonly stage: aws.apigateway.Stage;
    readonly integration: aws.apigateway.Integration;
    readonly method: aws.apigateway.Method;
    readonly resource: aws.apigateway.Resource;
    readonly apiUrl: pulumi.Output<string>;
    constructor(name: string, args: ApiGatewayStackArgs, opts?: ResourceOptions);
}
