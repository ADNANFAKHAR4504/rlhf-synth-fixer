import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import {
  LambdaModule,
  ApiGatewayModule,
  CanaryDeploymentModule,
  createCommonTags,
  LambdaModuleConfig,
  ApiGatewayModuleConfig,
  CanaryDeploymentConfig,
  RouteConfig,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // LocalStack detection
    const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                         process.env.AWS_ENDPOINT_URL?.includes('4566') ||
                         false;

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
      endpoints: [{
        s3: 'http://localhost:4566',
        lambda: 'http://localhost:4566',
        apigateway: 'http://localhost:4566',
        apigatewayv2: 'http://localhost:4566',
        iam: 'http://localhost:4566',
        sts: 'http://localhost:4566',
        codedeploy: 'http://localhost:4566',
        cloudwatch: 'http://localhost:4566',
      }],
    });

    // Configure S3 Backend with native state locking - DISABLED FOR LOCALSTACK
    // Use local backend for LocalStack testing
    // new S3Backend(this, {
    //   bucket: stateBucket,
    //   key: `${environmentSuffix}/${id}.tfstate`,
    //   region: stateBucketRegion,
    //   encrypt: true,
    // });
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    // this.addOverride('terraform.backend.s3.use_lockfile', true);
    const commonTags = createCommonTags(environmentSuffix);

    // ? Add your stack instantiations here
    // Lambda Function 1 Configuration
    const lambda1Config: LambdaModuleConfig = {
      functionName: 'serverless-function-1',
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      filename: 'lambda-code/lambda1.zip',
      description: 'First serverless microservice function',
      timeout: 30,
      memorySize: 256,
      environmentVariables: {
        NODE_ENV: 'production',
        SERVICE_NAME: 'function-1',
      },
      tags: commonTags,
    };

    // Lambda Function 2 Configuration
    const lambda2Config: LambdaModuleConfig = {
      functionName: 'serverless-function-2',
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      filename: 'lambda-code/lambda2.zip',
      description: 'Second serverless microservice function',
      timeout: 30,
      memorySize: 256,
      environmentVariables: {
        NODE_ENV: 'production',
        SERVICE_NAME: 'function-2',
      },
      tags: commonTags,
    };
    // Create Lambda Functions with versioning and aliases
    const lambda1Module = new LambdaModule(this, 'lambda-1', lambda1Config);
    const lambda2Module = new LambdaModule(this, 'lambda-2', lambda2Config);

    // API Gateway Configuration
    const apiGatewayConfig: ApiGatewayModuleConfig = {
      apiName: 'serverless-microservices-api',
      description: 'HTTP API for serverless microservices',
      stageName: 'v1',
      tags: commonTags,
    };

    // Create API Gateway
    const apiGatewayModule = new ApiGatewayModule(
      this,
      'api-gateway',
      apiGatewayConfig
    );

    // Configure routes
    const route1Config: RouteConfig = {
      routeKey: 'GET /v1/function1',
      lambdaFunction: lambda1Module.lambdaFunction,
      lambdaAlias: lambda1Module.lambdaAlias,
    };

    const route2Config: RouteConfig = {
      routeKey: 'GET /v1/function2',
      lambdaFunction: lambda2Module.lambdaFunction,
      lambdaAlias: lambda2Module.lambdaAlias,
    };

    // Add routes to API Gateway
    apiGatewayModule.addRoute(route1Config);
    apiGatewayModule.addRoute(route2Config);

    // Finalize API Gateway (create deployment and stage)
    apiGatewayModule.finalize(apiGatewayConfig.stageName, commonTags);

    // Canary Deployment Configuration for Lambda 1
    const canary1Config: CanaryDeploymentConfig = {
      applicationName: 'serverless-function-1-app',
      deploymentGroupName: 'serverless-function-1-deployment-group',
      lambdaFunction: lambda1Module.lambdaFunction,
      lambdaAlias: lambda1Module.lambdaAlias,
      tags: commonTags,
      enabled: !isLocalStack, // Disable for LocalStack Community
    };

    // Canary Deployment Configuration for Lambda 2
    const canary2Config: CanaryDeploymentConfig = {
      applicationName: 'serverless-function-2-app',
      deploymentGroupName: 'serverless-function-2-deployment-group',
      lambdaFunction: lambda2Module.lambdaFunction,
      lambdaAlias: lambda2Module.lambdaAlias,
      tags: commonTags,
      enabled: !isLocalStack, // Disable for LocalStack Community
    };

    // Create Canary Deployments
    const canary1Module = new CanaryDeploymentModule(
      this,
      'canary-1',
      canary1Config
    );
    const canary2Module = new CanaryDeploymentModule(
      this,
      'canary-2',
      canary2Config
    );

    // Outputs
    new TerraformOutput(this, 'api-gateway-url', {
      description: 'API Gateway endpoint URL',
      value: `${apiGatewayModule.api.executionArn}/${apiGatewayModule.stage.stageName}`,
    });

    new TerraformOutput(this, 'lambda-function-1-name', {
      description: 'Lambda Function 1 name',
      value: lambda1Module.lambdaFunction.functionName,
    });

    new TerraformOutput(this, 'lambda-function-1-arn', {
      description: 'Lambda Function 1 ARN',
      value: lambda1Module.lambdaFunction.arn,
    });

    new TerraformOutput(this, 'lambda-function-1-alias-arn', {
      description: 'Lambda Function 1 Alias ARN',
      value: lambda1Module.lambdaAlias.arn,
    });

    new TerraformOutput(this, 'lambda-function-2-name', {
      description: 'Lambda Function 2 name',
      value: lambda2Module.lambdaFunction.functionName,
    });

    new TerraformOutput(this, 'lambda-function-2-arn', {
      description: 'Lambda Function 2 ARN',
      value: lambda2Module.lambdaFunction.arn,
    });

    new TerraformOutput(this, 'lambda-function-2-alias-arn', {
      description: 'Lambda Function 2 Alias ARN',
      value: lambda2Module.lambdaAlias.arn,
    });

    // CodeDeploy outputs - only if enabled (AWS deployment, not LocalStack)
    if (!isLocalStack) {
      new TerraformOutput(this, 'codedeploy-application-1', {
        description: 'CodeDeploy Application 1 name',
        value: canary1Module.application?.name || 'disabled-for-localstack',
      });

      new TerraformOutput(this, 'codedeploy-application-2', {
        description: 'CodeDeploy Application 2 name',
        value: canary2Module.application?.name || 'disabled-for-localstack',
      });

      new TerraformOutput(this, 'canary-deployment-status', {
        description: 'Canary deployment configuration',
        value:
          'CodeDeployDefault.Lambda10PercentEvery5Minutes - 10% traffic for 5 minutes before 100%',
      });
    } else {
      new TerraformOutput(this, 'codedeploy-status', {
        description: 'CodeDeploy deployment status',
        value: 'CodeDeploy disabled for LocalStack Community Edition',
      });
    }
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
