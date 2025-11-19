import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { EnvironmentConfig, ResourceTags } from './types';

export interface LambdaComponentArgs {
  config: EnvironmentConfig;
  tags: ResourceTags;
  environmentSuffix: string;
  vpcId: pulumi.Input<string>;
  privateSubnetIds: pulumi.Input<string[]>;
  dbEndpoint: pulumi.Input<string>;
}

/**
 * Lambda Component for payment processing
 */
export class LambdaComponent extends pulumi.ComponentResource {
  public readonly lambdaFunction: aws.lambda.Function;
  public readonly securityGroup: aws.ec2.SecurityGroup;
  public readonly role: aws.iam.Role;

  constructor(
    name: string,
    args: LambdaComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:compute:LambdaComponent', name, {}, opts);

    const {
      config,
      tags,
      environmentSuffix,
      vpcId,
      privateSubnetIds,
      dbEndpoint,
    } = args;

    // Create security group for Lambda
    this.securityGroup = new aws.ec2.SecurityGroup(
      `lambda-sg-${environmentSuffix}`,
      {
        vpcId: vpcId,
        description: `Security group for Lambda in ${config.environment}`,
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: {
          ...tags,
          Name: `lambda-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create IAM role for Lambda
    this.role = new aws.iam.Role(
      `lambda-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          ...tags,
          Name: `lambda-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    new aws.iam.RolePolicyAttachment(
      `lambda-basic-${environmentSuffix}`,
      {
        role: this.role.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Attach VPC execution policy
    new aws.iam.RolePolicyAttachment(
      `lambda-vpc-${environmentSuffix}`,
      {
        role: this.role.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      },
      { parent: this }
    );

    // Create Lambda function for payment processing
    this.lambdaFunction = new aws.lambda.Function(
      `payment-processor-${environmentSuffix}`,
      {
        name: `payment-processor-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: this.role.arn,
        timeout: 30,
        memorySize: 256,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
  console.log('Processing payment in environment: ${config.environment}');
  console.log('Event:', JSON.stringify(event, null, 2));

  // Payment processing logic would go here
  const payment = {
    transactionId: Date.now().toString(),
    amount: event.amount || 0,
    currency: event.currency || 'USD',
    status: 'processed',
    environment: '${config.environment}',
    timestamp: new Date().toISOString(),
  };

  return {
    statusCode: 200,
    body: JSON.stringify(payment),
  };
};
          `),
        }),
        environment: {
          variables: {
            ENVIRONMENT: config.environment,
            DB_ENDPOINT: dbEndpoint,
            REGION: aws.config.region || 'us-east-1',
          },
        },
        vpcConfig: {
          subnetIds: privateSubnetIds,
          securityGroupIds: [this.securityGroup.id],
        },
        tags: {
          ...tags,
          Name: `payment-processor-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      functionArn: this.lambdaFunction.arn,
      functionName: this.lambdaFunction.name,
    });
  }
}
