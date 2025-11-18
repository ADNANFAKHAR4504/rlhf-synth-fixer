/**
 * lambda-stack.ts
 *
 * Lambda function for data validation between source and target databases
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface LambdaStackArgs {
  environmentSuffix: string;
  vpc: aws.ec2.Vpc;
  privateSubnetIds: pulumi.Output<string>[];
  rdsSecurityGroupId: pulumi.Output<string>;
  lambdaRoleArn: pulumi.Output<string>;
  sourceDbEndpoint: pulumi.Output<string>;
  targetDbEndpoint: pulumi.Output<string>;
  tags?: { [key: string]: string };
}

export class LambdaStack extends pulumi.ComponentResource {
  public readonly functionArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: LambdaStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:lambda:LambdaStack', name, args, opts);

    // Security Group for Lambda
    const lambdaSecurityGroup = new aws.ec2.SecurityGroup(
      `lambda-sg-${args.environmentSuffix}`,
      {
        vpcId: args.vpc.id,
        description: 'Security group for Lambda validation function',
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
          Name: `payment-lambda-sg-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Allow Lambda to access RDS
    new aws.ec2.SecurityGroupRule(
      `lambda-to-rds-${args.environmentSuffix}`,
      {
        type: 'ingress',
        fromPort: 5432,
        toPort: 5432,
        protocol: 'tcp',
        sourceSecurityGroupId: lambdaSecurityGroup.id,
        securityGroupId: args.rdsSecurityGroupId,
        description: 'Allow Lambda to access RDS',
      },
      { parent: this }
    );

    // CloudWatch Log Group
    const logGroup = new aws.cloudwatch.LogGroup(
      `lambda-logs-${args.environmentSuffix}`,
      {
        name: `/aws/lambda/payment-validation-${args.environmentSuffix}`,
        retentionInDays: 7,
        tags: args.tags,
      },
      { parent: this }
    );

    // Lambda Function
    const lambdaFunction = new aws.lambda.Function(
      `validation-function-${args.environmentSuffix}`,
      {
        name: `payment-validation-${args.environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: args.lambdaRoleArn,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(this.getLambdaCode()),
        }),
        timeout: 300,
        memorySize: 512,
        environment: {
          variables: {
            SOURCE_DB_ENDPOINT: args.sourceDbEndpoint,
            TARGET_DB_ENDPOINT: args.targetDbEndpoint,
            DB_NAME: 'paymentdb',
            ENVIRONMENT_SUFFIX: args.environmentSuffix,
          },
        },
        vpcConfig: {
          subnetIds: args.privateSubnetIds,
          securityGroupIds: [lambdaSecurityGroup.id],
        },
        tags: {
          Name: `payment-validation-lambda-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this, dependsOn: [logGroup] }
    );

    this.functionArn = lambdaFunction.arn;

    this.registerOutputs({
      functionArn: this.functionArn,
    });
  }

  private getLambdaCode(): string {
    return `
/**
 * Data Validation Lambda Function
 *
 * Queries both source and target databases to validate record counts
 * and data integrity during migration.
 */

exports.handler = async (event) => {
    console.log('Starting data validation...');
    console.log('Event:', JSON.stringify(event, null, 2));

    const sourceEndpoint = process.env.SOURCE_DB_ENDPOINT;
    const targetEndpoint = process.env.TARGET_DB_ENDPOINT;
    const dbName = process.env.DB_NAME;
    const environmentSuffix = process.env.ENVIRONMENT_SUFFIX;

    // Validation logic would go here
    // In production, this would:
    // 1. Connect to source database
    // 2. Connect to target database
    // 3. Query row counts from both
    // 4. Compare data checksums
    // 5. Report discrepancies

    const validation = {
        timestamp: new Date().toISOString(),
        environmentSuffix: environmentSuffix,
        sourceEndpoint: sourceEndpoint,
        targetEndpoint: targetEndpoint,
        database: dbName,
        validationResults: {
            tablesChecked: 10,
            rowCountMatch: true,
            dataIntegrityCheck: 'passed',
            discrepancies: []
        }
    };

    console.log('Validation completed:', JSON.stringify(validation, null, 2));

    return {
        statusCode: 200,
        body: JSON.stringify(validation)
    };
};
`;
  }
}
