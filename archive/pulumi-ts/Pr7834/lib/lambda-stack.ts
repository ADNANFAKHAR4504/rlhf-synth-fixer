/**
 * lambda-stack.ts
 *
 * Creates Lambda function for application deployment.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface LambdaStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class LambdaStack extends pulumi.ComponentResource {
  public readonly functionArn: pulumi.Output<string>;
  public readonly functionName: pulumi.Output<string>;

  constructor(name: string, args: LambdaStackArgs, opts?: ResourceOptions) {
    super('tap:lambda:LambdaStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // IAM role for Lambda execution
    const lambdaRole = new aws.iam.Role(
      `lambda-role-${environmentSuffix}`,
      {
        name: `lambda-execution-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags,
      },
      { parent: this }
    );

    // Attach AWS managed policy for Lambda basic execution
    const lambdaPolicyAttachment = new aws.iam.RolePolicyAttachment(
      `lambda-policy-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Lambda function
    const lambdaFunction = new aws.lambda.Function(
      `app-function-${environmentSuffix}`,
      {
        name: `app-function-${environmentSuffix}`,
        role: lambdaRole.arn,
        handler: 'index.handler',
        runtime: 'nodejs18.x',
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello from Lambda - CI/CD Pipeline deployed application',
      environment: '${environmentSuffix}',
      timestamp: new Date().toISOString(),
    }),
  };
};
        `),
        }),
        environment: {
          variables: {
            ENVIRONMENT_SUFFIX: environmentSuffix,
          },
        },
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `app-function-${environmentSuffix}`,
        })),
      },
      { parent: this, dependsOn: [lambdaPolicyAttachment] }
    );

    this.functionArn = lambdaFunction.arn;
    this.functionName = lambdaFunction.name;

    this.registerOutputs({
      functionArn: this.functionArn,
      functionName: this.functionName,
    });
  }
}
