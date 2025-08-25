import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class LambdaValidationStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { environmentSuffix, lambdaRole } = props;

    // Lambda function for deployment validation with Powertools
    this.validationFunction = new lambda.Function(this, 'ValidationFunction', {
      functionName: `cicd-validation-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'deployment-validator.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      role: lambdaRole,
      timeout: cdk.Duration.minutes(5),
      environment: {
        ENVIRONMENT_SUFFIX: environmentSuffix,
        LOG_LEVEL: 'INFO',
        POWERTOOLS_SERVICE_NAME: 'deployment-validator',
        POWERTOOLS_METRICS_NAMESPACE: 'CICDPipeline',
      },
      tracing: lambda.Tracing.ACTIVE,
      layers: [
        lambda.LayerVersion.fromLayerVersionArn(
          this,
          'PowertoolsLayer',
          `arn:aws:lambda:${cdk.Aws.REGION}:094274105915:layer:AWSLambdaPowertoolsTypeScript:29`
        ),
      ],
    });

    // Tags
    cdk.Tags.of(this.validationFunction).add('Purpose', 'DeploymentValidation');
  }
}