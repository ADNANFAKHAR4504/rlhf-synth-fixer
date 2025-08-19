import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface IamStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  bucketArn: pulumi.Output<string>;
  eventBusArn: pulumi.Output<string>;
}

export class IamStack extends pulumi.ComponentResource {
  public readonly lambdaRole: aws.iam.Role;
  public readonly lambdaRoleArn: pulumi.Output<string>;

  constructor(name: string, args: IamStackArgs, opts?: pulumi.ResourceOptions) {
    super('tap:iam:IamStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';

    // Create IAM role for Lambda function
    this.lambdaRole = new aws.iam.Role(
      `tap-lambda-role-${environmentSuffix}`,
      {
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
        tags: args.tags,
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    new aws.iam.RolePolicyAttachment(
      `tap-lambda-basic-execution-${environmentSuffix}`,
      {
        role: this.lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Create custom policy for S3 access
    const lambdaS3Policy = new aws.iam.Policy(
      `tap-lambda-s3-policy-${environmentSuffix}`,
      {
        description: 'Policy for Lambda to access S3 bucket',
        policy: args.bucketArn.apply(bucketArn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
                Resource: `${bucketArn}/*`,
              },
              {
                Effect: 'Allow',
                Action: ['s3:ListBucket'],
                Resource: bucketArn,
              },
            ],
          })
        ),
        tags: args.tags,
      },
      { parent: this }
    );

    // Attach S3 policy to Lambda role
    new aws.iam.RolePolicyAttachment(
      `tap-lambda-s3-policy-attachment-${environmentSuffix}`,
      {
        role: this.lambdaRole.name,
        policyArn: lambdaS3Policy.arn,
      },
      { parent: this }
    );

    // Create custom policy for Parameter Store access
    const lambdaParameterStorePolicy = new aws.iam.Policy(
      `tap-lambda-ssm-policy-${environmentSuffix}`,
      {
        description: 'Policy for Lambda to access Parameter Store',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'ssm:GetParameter',
                'ssm:GetParameters',
                'ssm:GetParametersByPath',
              ],
              Resource: `arn:aws:ssm:*:*:parameter/tap/${environmentSuffix}/*`,
            },
            {
              Effect: 'Allow',
              Action: ['kms:Decrypt'],
              Resource: 'arn:aws:kms:*:*:key/alias/aws/ssm',
              Condition: {
                StringEquals: {
                  'kms:ViaService': 'ssm.*.amazonaws.com',
                },
              },
            },
          ],
        }),
        tags: args.tags,
      },
      { parent: this }
    );

    // Attach Parameter Store policy to Lambda role
    new aws.iam.RolePolicyAttachment(
      `tap-lambda-ssm-policy-attachment-${environmentSuffix}`,
      {
        role: this.lambdaRole.name,
        policyArn: lambdaParameterStorePolicy.arn,
      },
      { parent: this }
    );

    // Create custom policy for EventBridge access
    const lambdaEventBridgePolicy = new aws.iam.Policy(
      `tap-lambda-eventbridge-policy-${environmentSuffix}`,
      {
        description: 'Policy for Lambda to publish events to EventBridge',
        policy: args.eventBusArn.apply(eventBusArn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['events:PutEvents'],
                Resource: eventBusArn,
              },
            ],
          })
        ),
        tags: args.tags,
      },
      { parent: this }
    );

    // Attach EventBridge policy to Lambda role
    new aws.iam.RolePolicyAttachment(
      `tap-lambda-eventbridge-policy-attachment-${environmentSuffix}`,
      {
        role: this.lambdaRole.name,
        policyArn: lambdaEventBridgePolicy.arn,
      },
      { parent: this }
    );

    this.lambdaRoleArn = this.lambdaRole.arn;

    this.registerOutputs({
      lambdaRoleArn: this.lambdaRoleArn,
    });
  }
}
