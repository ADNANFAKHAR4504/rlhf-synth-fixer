/**
 * networking-stack.ts
 *
 * This module defines the VPC and networking infrastructure with private subnets
 * for Lambda functions and VPC endpoints for secure AWS service access.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
export interface NetworkingStackArgs {
    environmentSuffix: string;
    tags?: pulumi.Input<{
        [key: string]: string;
    }>;
}
export declare class NetworkingStack extends pulumi.ComponentResource {
    readonly vpc: aws.ec2.Vpc;
    readonly privateSubnets: aws.ec2.Subnet[];
    readonly publicSubnets: aws.ec2.Subnet[];
    readonly s3VpcEndpoint: aws.ec2.VpcEndpoint;
    readonly vpcSecurityGroup: aws.ec2.SecurityGroup;
    readonly routeTable: aws.ec2.RouteTable;
    constructor(name: string, args: NetworkingStackArgs, opts?: ResourceOptions);
}
