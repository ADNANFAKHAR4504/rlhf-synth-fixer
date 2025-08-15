/**
 * lambda-stack.ts
 *
 * This module defines the Lambda function with least privilege IAM role for secure document processing.
 * Function runs in private subnets and has minimal required permissions.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import * as fs from 'fs';
import * as path from 'path';

export interface LambdaStackArgs {
  environmentSuffix: string;
  bucketArn: pulumi.Input<string>;
  bucketName: pulumi.Input<string>;
  privateSubnetIds: pulumi.Input<string>[];
  vpcSecurityGroupId: pulumi.Input<string>;
  logGroupArn: pulumi.Input<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class LambdaStack extends pulumi.ComponentResource {
  public readonly function: aws.lambda.Function;
  public readonly role: aws.iam.Role;
  public readonly functionUrl: aws.lambda.FunctionUrl;

  constructor(name: string, args: LambdaStackArgs, opts?: ResourceOptions) {
    super('tap:lambda:LambdaStack', name, args, opts);

    const {
      environmentSuffix,
      bucketArn,
      bucketName,
      privateSubnetIds,
      vpcSecurityGroupId,
      logGroupArn,
      tags,
    } = args;

    this.role = new aws.iam.Role(
      `lambda-execution-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        }),
        tags: {
          Name: `lambda-execution-role-${environmentSuffix}`,
          Purpose: 'Lambda execution with least privilege',
          ...tags,
        },
      },
      { parent: this }
    );

    const lambdaPolicy = new aws.iam.RolePolicy(
      `lambda-policy-${environmentSuffix}`,
      {
        role: this.role.id,
        policy: pulumi
          .all([bucketArn, logGroupArn])
          .apply(([bucketArn, logGroupArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'S3BucketAccess',
                  Effect: 'Allow',
                  Action: ['s3:PutObject', 's3:PutObjectAcl'],
                  Resource: `${bucketArn}/*`,
                },

                {
                  Sid: 'CloudWatchLogsAccess',
                  Effect: 'Allow',
                  Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                  Resource: `${logGroupArn}:*`,
                },
                {
                  Sid: 'VPCAccess',
                  Effect: 'Allow',
                  Action: [
                    'ec2:CreateNetworkInterface',
                    'ec2:DescribeNetworkInterfaces',
                    'ec2:DeleteNetworkInterface',
                    'ec2:AttachNetworkInterface',
                    'ec2:DetachNetworkInterface',
                  ],
                  Resource: '*',
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    const lambdaCode = fs.readFileSync(
      path.join(__dirname, 'lambdas', 'document-processor.js'),
      'utf8'
    );

    this.function = new aws.lambda.Function(
      `doc-processor-${environmentSuffix}`,
      {
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(lambdaCode),
          'package.json': new pulumi.asset.StringAsset(
            JSON.stringify(
              {
                name: 'document-processor',
                version: '1.0.0',
                description: 'Secure document processing Lambda function',
                main: 'index.js',
                dependencies: {
                  '@aws-sdk/client-s3': '^3.0.0',
                },
              },
              null,
              2
            )
          ),
        }),
        handler: 'index.handler',
        role: this.role.arn,
        runtime: aws.lambda.Runtime.NodeJS20dX,
        architectures: ['x86_64'],
        timeout: 30,
        memorySize: 256,
        environment: {
          variables: {
            BUCKET_NAME: bucketName,
            NODE_OPTIONS: '--enable-source-maps',
          },
        },
        vpcConfig: {
          subnetIds: privateSubnetIds,
          securityGroupIds: [vpcSecurityGroupId],
        },
        tags: {
          Name: `doc-processor-${environmentSuffix}`,
          Purpose: 'Secure document processing',
          Runtime: 'nodejs20.x',
          ...tags,
        },
      },
      {
        parent: this,
        dependsOn: [lambdaPolicy],
      }
    );

    this.functionUrl = new aws.lambda.FunctionUrl(
      `lambda-url-${environmentSuffix}`,
      {
        functionName: this.function.name,
        authorizationType: 'NONE',
        cors: {
          allowCredentials: true,
          allowMethods: ['POST'],
          allowOrigins: ['*'],
          allowHeaders: ['content-type', 'x-request-id'],
          exposeHeaders: ['x-request-id'],
          maxAge: 86400,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      functionName: this.function.name,
      functionArn: this.function.arn,
      functionId: this.function.id,
      roleArn: this.role.arn,
      roleName: this.role.name,
      roleId: this.role.id,
      functionUrl: this.functionUrl.functionUrl,
      functionUrlId: this.functionUrl.id,
    });
  }
}
