/**
 * lambda.ts
 *
 * Lambda function component with container image support
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface LambdaComponentArgs {
  environmentSuffix: string;
  environment: string;
  dockerImageUri: string;
  memory: number;
  cpu: number;
  subnetIds: pulumi.Input<string[]>;
  vpcId: pulumi.Input<string>;
  databaseEndpoint: pulumi.Input<string>;
  databaseSecretArn: pulumi.Input<string>;
  environmentVariables: Record<string, pulumi.Input<string>>;
  tags?: pulumi.Input<{ [key: string]: string }>;
  /**
   * If true, use zip deployment with a placeholder handler instead of container image.
   * Useful for CI/CD testing when the Docker image doesn't exist.
   */
  useZipDeployment?: boolean;
}

export class LambdaComponent extends pulumi.ComponentResource {
  public readonly functionArn: pulumi.Output<string>;
  public readonly functionName: pulumi.Output<string>;

  constructor(
    name: string,
    args: LambdaComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:components:Lambda', name, args, opts);

    const {
      environmentSuffix,
      environment,
      dockerImageUri,
      memory,
      cpu,
      subnetIds,
      vpcId,
      databaseSecretArn,
      environmentVariables,
      tags,
      useZipDeployment,
    } = args;

    // Create security group for Lambda
    const securityGroup = new aws.ec2.SecurityGroup(
      `lambda-sg-${environmentSuffix}`,
      {
        vpcId: vpcId,
        description: `Security group for Lambda function ${environment}`,
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `lambda-sg-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Create IAM role for Lambda
    const role = new aws.iam.Role(
      `lambda-role-${environmentSuffix}`,
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
        inlinePolicies: [
          {
            name: 'lambda-execution-policy',
            policy: pulumi.all([databaseSecretArn]).apply(([secretArn]) =>
              JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: [
                      'ec2:CreateNetworkInterface',
                      'ec2:DescribeNetworkInterfaces',
                      'ec2:DeleteNetworkInterface',
                      'ec2:AssignPrivateIpAddresses',
                      'ec2:UnassignPrivateIpAddresses',
                    ],
                    Resource: '*',
                  },
                  {
                    Effect: 'Allow',
                    Action: [
                      'logs:CreateLogGroup',
                      'logs:CreateLogStream',
                      'logs:PutLogEvents',
                    ],
                    Resource: 'arn:aws:logs:*:*:*',
                  },
                  {
                    Effect: 'Allow',
                    Action: [
                      'secretsmanager:GetSecretValue',
                      'secretsmanager:DescribeSecret',
                    ],
                    Resource: secretArn,
                  },
                ],
              })
            ),
          },
        ],
        tags: tags,
      },
      { parent: this }
    );

    // Create CloudWatch log group
    const logGroup = new aws.cloudwatch.LogGroup(
      `lambda-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/payment-processor-${environmentSuffix}`,
        retentionInDays: 30,
        tags: tags,
      },
      { parent: this }
    );

    // Create Lambda function
    // For CI/CD testing, use zip deployment with a placeholder handler
    // For production, use container image deployment
    const lambdaConfig = useZipDeployment
      ? {
          runtime: 'nodejs20.x' as const,
          handler: 'index.handler',
          // Inline code for CI/CD testing - minimal placeholder
          code: new pulumi.asset.AssetArchive({
            'index.js': new pulumi.asset.StringAsset(
              'exports.handler = async () => ({ statusCode: 200, body: "OK" });'
            ),
          }),
        }
      : {
          packageType: 'Image' as const,
          imageUri: dockerImageUri,
        };

    // Don't set reserved concurrency in CI/CD to avoid account limit issues
    const reservedConcurrency = useZipDeployment
      ? undefined
      : cpu === 2
        ? 100
        : cpu === 1
          ? 50
          : 10;

    const lambdaFunction = new aws.lambda.Function(
      `payment-processor-${environmentSuffix}`,
      {
        ...lambdaConfig,
        role: role.arn,
        timeout: 300,
        memorySize: memory,
        reservedConcurrentExecutions: reservedConcurrency,
        vpcConfig: {
          subnetIds: subnetIds,
          securityGroupIds: [securityGroup.id],
        },
        environment: {
          variables: environmentVariables,
        },
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-processor-${environmentSuffix}`,
        })),
      },
      {
        parent: this,
        dependsOn: [logGroup],
      }
    );

    this.functionArn = lambdaFunction.arn;
    this.functionName = lambdaFunction.name;

    this.registerOutputs({
      functionArn: this.functionArn,
      functionName: this.functionName,
    });
  }
}
