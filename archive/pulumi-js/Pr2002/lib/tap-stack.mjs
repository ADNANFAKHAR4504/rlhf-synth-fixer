import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { VpcStack } from './vpc-stack.mjs';
import { S3Stack } from './s3-stack.mjs';
import { RdsStack } from './rds-stack.mjs';
import { LambdaStack } from './lambda-stack.mjs';
import { IamStack } from './iam-stack.mjs';

export class TapStack extends pulumi.ComponentResource {
    constructor(name, args, opts) {
        super('tap:stack:TapStack', name, args, opts);

        const environmentSuffix = args?.environmentSuffix || 'dev';
        const tags = args?.tags || {};

        // VPC Stack - Create VPC and networking first
        const vpcStack = new VpcStack("tap-vpc", {
            environmentSuffix: environmentSuffix,
            tags: tags,
        }, { parent: this });

        // IAM Stack - Create roles and policies
        const iamStack = new IamStack("tap-iam", {
            environmentSuffix: environmentSuffix,
            tags: tags,
        }, { parent: this });

        // S3 Stack - Create bucket for Lambda code storage
        const s3Stack = new S3Stack("tap-s3", {
            environmentSuffix: environmentSuffix,
            tags: tags,
        }, { parent: this });

        // RDS Stack - Create database with modern Aurora Serverless v2
        const rdsStack = new RdsStack("tap-rds", {
            environmentSuffix: environmentSuffix,
            tags: tags,
            vpcId: vpcStack.vpcId,
            privateSubnetIds: vpcStack.privateSubnetIds,
        }, { parent: this });

        // Lambda Stack - Create function with S3 code storage
        const lambdaStack = new LambdaStack("tap-lambda", {
            environmentSuffix: environmentSuffix,
            tags: tags,
            bucketName: s3Stack.bucketName,
            lambdaRole: iamStack.lambdaRole,
            rdsEndpoint: rdsStack.rdsEndpoint,
            vpcId: vpcStack.vpcId,
            privateSubnetIds: vpcStack.privateSubnetIds,
        }, { parent: this });

        // Export the bucket name as required
        this.bucketName = s3Stack.bucketName;
        this.rdsEndpoint = rdsStack.rdsEndpoint;
        this.lambdaFunctionName = lambdaStack.functionName;
        this.vpcId = vpcStack.vpcId;

        this.registerOutputs({
            bucketName: this.bucketName,
            rdsEndpoint: this.rdsEndpoint,
            lambdaFunctionName: this.lambdaFunctionName,
            vpcId: this.vpcId,
        });
    }
}

