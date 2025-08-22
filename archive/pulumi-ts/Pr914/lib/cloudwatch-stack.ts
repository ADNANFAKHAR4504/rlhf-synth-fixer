/**
 * cloudwatch-stack.ts
 *
 * This module defines CloudWatch Log Groups for Lambda function and API Gateway logging
 * with appropriate retention policies and least privilege access patterns.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface CloudWatchStackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class CloudWatchStack extends pulumi.ComponentResource {
  public readonly lambdaLogGroup: aws.cloudwatch.LogGroup;
  public readonly apiGatewayLogGroup: aws.cloudwatch.LogGroup;

  constructor(name: string, args: CloudWatchStackArgs, opts?: ResourceOptions) {
    super('tap:cloudwatch:CloudWatchStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    this.lambdaLogGroup = new aws.cloudwatch.LogGroup(
      `lambda-log-group-${environmentSuffix}`,
      {
        name: `/aws/lambda/doc-processor-${environmentSuffix}`,
        retentionInDays: 90,
        tags: {
          Name: `lambda-log-group-${environmentSuffix}`,
          Purpose: 'Lambda function logging',
          Component: 'CloudWatch',
          ...tags,
        },
      },
      { parent: this }
    );

    this.apiGatewayLogGroup = new aws.cloudwatch.LogGroup(
      `api-gateway-log-group-${environmentSuffix}`,
      {
        name: `/aws/apigateway/secure-doc-api-${environmentSuffix}`,
        retentionInDays: 90,
        tags: {
          Name: `api-gateway-log-group-${environmentSuffix}`,
          Purpose: 'API Gateway access logging',
          Component: 'CloudWatch',
          ...tags,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      lambdaLogGroupName: this.lambdaLogGroup.name,
      lambdaLogGroupArn: this.lambdaLogGroup.arn,
      apiGatewayLogGroupName: this.apiGatewayLogGroup.name,
      apiGatewayLogGroupArn: this.apiGatewayLogGroup.arn,
    });
  }
}
