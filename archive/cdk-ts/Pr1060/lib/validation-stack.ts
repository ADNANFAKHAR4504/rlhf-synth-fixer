import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { EnvironmentConfig } from './environment-config';

export interface ValidationStackProps extends cdk.StackProps {
  environmentConfig: EnvironmentConfig;
  environmentSuffix: string;
}

export class ValidationStack extends cdk.Stack {
  public readonly validationFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: ValidationStackProps) {
    super(scope, id, props);

    const { environmentConfig, environmentSuffix } = props;

    // Validation Lambda Function
    this.validationFunction = new lambda.Function(this, 'ValidationFunction', {
      functionName: `tap-${environmentSuffix}-validation-function`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const cloudformation = new AWS.CloudFormation();
        const apigateway = new AWS.APIGateway();
        const s3 = new AWS.S3();

        exports.handler = async (event) => {
          console.log('Validation event:', JSON.stringify(event, null, 2));
          
          const environment = '${environmentConfig.environmentName}';
          const environmentSuffix = '${environmentSuffix}';
          const results = {
            environment,
            environmentSuffix,
            timestamp: new Date().toISOString(),
            validations: [],
          };

          try {
            // Validate CloudFormation stacks
            const stacks = await cloudformation.listStacks({
              StackStatusFilter: ['CREATE_COMPLETE', 'UPDATE_COMPLETE']
            }).promise();
            
            const envStacks = stacks.StackSummaries.filter(stack => 
              stack.StackName.includes(environmentSuffix)
            );
            
            results.validations.push({
              type: 'CloudFormation',
              status: envStacks.length > 0 ? 'PASS' : 'FAIL',
              details: \`Found \${envStacks.length} stacks for environment \${environment}\`
            });

            // Validate S3 buckets
            try {
              const dataBucket = \`tap-\${environmentSuffix}-data-\${process.env.AWS_ACCOUNT_ID || 'unknown'}-\${process.env.DEPLOYMENT_REGION || 'us-east-1'}\`;
              await s3.headBucket({ Bucket: dataBucket }).promise();
              results.validations.push({
                type: 'S3-DataBucket',
                status: 'PASS',
                details: \`Data bucket \${dataBucket} exists and is accessible\`
              });
            } catch (error) {
              results.validations.push({
                type: 'S3-DataBucket',
                status: 'FAIL',
                details: error.message
              });
            }

            console.log('Validation results:', JSON.stringify(results, null, 2));
            return {
              statusCode: 200,
              body: JSON.stringify(results)
            };

          } catch (error) {
            console.error('Validation error:', error);
            return {
              statusCode: 500,
              body: JSON.stringify({
                error: error.message,
                environment
              })
            };
          }
        };
      `),
      memorySize: 256,
      timeout: cdk.Duration.seconds(60),
      environment: {
        ENVIRONMENT: environmentConfig.environmentName,
        ENVIRONMENT_SUFFIX: environmentSuffix,
        AWS_ACCOUNT_ID: cdk.Aws.ACCOUNT_ID,
        DEPLOYMENT_REGION: cdk.Aws.REGION,
      },
    });

    // Grant permissions to validation function
    this.validationFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudformation:ListStacks',
          'cloudformation:DescribeStacks',
          's3:ListBucket',
          's3:HeadBucket',
          'apigateway:GET',
          'lambda:GetFunction',
        ],
        resources: ['*'],
      })
    );

    // EventBridge rule for scheduled validation
    const validationRule = new events.Rule(this, 'ValidationRule', {
      schedule: events.Schedule.rate(cdk.Duration.hours(6)),
      description: `Validation rule for ${environmentConfig.environmentName} environment`,
    });

    validationRule.addTarget(
      new targets.LambdaFunction(this.validationFunction)
    );

    // Add tags
    cdk.Tags.of(this).add('Environment', environmentConfig.environmentName);
    cdk.Tags.of(this).add('EnvironmentSuffix', environmentSuffix);
    cdk.Tags.of(this).add('Component', 'Validation');

    // Outputs
    new cdk.CfnOutput(this, 'ValidationFunctionName', {
      value: this.validationFunction.functionName,
      description: 'Validation Lambda function name',
    });
  }
}
