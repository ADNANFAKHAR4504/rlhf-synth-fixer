import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as path from 'path';

// Configuration
const config = new pulumi.Config();
const environmentSuffix = config.require('environmentSuffix');
const environment = config.get('environment') || 'development';
const region = config.get('region') || 'us-east-1';

// Common tags for all resources
const commonTags = {
  CostCenter: config.get('costCenter') || 'engineering',
  Environment: environment,
  Owner: config.get('owner') || 'platform-team',
};

// Environment-specific timeout configuration
const timeout = environment === 'production' ? 30 : 60;

// Lambda function configuration
const lambdaFunctions = [
  {
    name: 'payment-validator',
    memory: 512,
    reservedConcurrentExecutions: undefined, // Removed to avoid account concurrency limits
    provisionedConcurrency: 0, // Removed: Cannot use with $LATEST version
  },
  {
    name: 'fraud-detector',
    memory: 256,
    reservedConcurrentExecutions: undefined, // Removed to avoid account concurrency limits
    provisionedConcurrency: 0,
  },
  {
    name: 'notification-sender',
    memory: 128,
    reservedConcurrentExecutions: undefined, // Removed to avoid account concurrency limits
    provisionedConcurrency: 0,
  },
];

// IAM role for Lambda functions
function createLambdaRole(functionName: string): aws.iam.Role {
  const role = new aws.iam.Role(`${functionName}-role-${environmentSuffix}`, {
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Principal: {
            Service: 'lambda.amazonaws.com',
          },
          Effect: 'Allow',
        },
      ],
    }),
    tags: {
      ...commonTags,
      Function: functionName,
    },
  });

  // Attach basic Lambda execution policy
  new aws.iam.RolePolicyAttachment(
    `${functionName}-basic-execution-${environmentSuffix}`,
    {
      role: role.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    }
  );

  // Attach X-Ray write access
  new aws.iam.RolePolicyAttachment(
    `${functionName}-xray-${environmentSuffix}`,
    {
      role: role.name,
      policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
    }
  );

  // Create inline policy for DynamoDB access (least-privilege)
  new aws.iam.RolePolicy(
    `${functionName}-dynamodb-policy-${environmentSuffix}`,
    {
      role: role.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:Query',
              'dynamodb:Scan',
            ],
            Resource: [
              `arn:aws:dynamodb:${region}:*:table/transactions-${environmentSuffix}`,
              `arn:aws:dynamodb:${region}:*:table/transactions-${environmentSuffix}/index/*`,
            ],
          },
        ],
      }),
    }
  );

  return role;
}

// CloudWatch Log Group with retention
function createLogGroup(functionName: string): aws.cloudwatch.LogGroup {
  return new aws.cloudwatch.LogGroup(
    `${functionName}-logs-${environmentSuffix}`,
    {
      name: `/aws/lambda/${functionName}-${environmentSuffix}`,
      retentionInDays: 7,
      tags: {
        ...commonTags,
        Function: functionName,
      },
    }
  );
}

// Lambda function
function createLambdaFunction(
  functionName: string,
  memory: number,
  reservedConcurrentExecutions: number | undefined,
  role: aws.iam.Role,
  logGroup: aws.cloudwatch.LogGroup
): aws.lambda.Function {
  return new aws.lambda.Function(
    `${functionName}-${environmentSuffix}`,
    {
      name: `${functionName}-${environmentSuffix}`,
      runtime: aws.lambda.Runtime.NodeJS18dX,
      architectures: ['arm64'], // Graviton2
      handler: 'index.handler',
      role: role.arn,
      memorySize: memory,
      timeout: timeout,
      reservedConcurrentExecutions: reservedConcurrentExecutions,
      code: new pulumi.asset.AssetArchive({
        '.': new pulumi.asset.FileArchive(
          path.join(__dirname, 'lambda', functionName)
        ),
      }),
      environment: {
        variables: {
          ENVIRONMENT: environment,
          REGION: region,
          LOG_LEVEL: 'INFO',
        },
      },
      tracingConfig: {
        mode: 'Active', // X-Ray tracing
      },
      tags: {
        ...commonTags,
        Function: functionName,
      },
    },
    { dependsOn: [logGroup] }
  );
}

// Lambda function URL
function createFunctionUrl(
  functionName: string,
  lambdaFunction: aws.lambda.Function
): aws.lambda.FunctionUrl {
  return new aws.lambda.FunctionUrl(
    `${functionName}-url-${environmentSuffix}`,
    {
      functionName: lambdaFunction.name,
      authorizationType: 'NONE', // Public endpoint, adjust as needed
      cors: {
        allowOrigins: ['*'],
        allowMethods: ['POST', 'GET'],
        allowHeaders: ['content-type', 'x-api-key'],
        maxAge: 300,
      },
    }
  );
}

// Provisioned concurrency configuration
function createProvisionedConcurrency(
  functionName: string,
  lambdaFunction: aws.lambda.Function,
  concurrency: number
): aws.lambda.ProvisionedConcurrencyConfig | undefined {
  if (concurrency > 0) {
    return new aws.lambda.ProvisionedConcurrencyConfig(
      `${functionName}-provisioned-${environmentSuffix}`,
      {
        functionName: lambdaFunction.name,
        qualifier: '$LATEST', // Use $LATEST version for provisioned concurrency
        provisionedConcurrentExecutions: concurrency,
      }
    );
  }
  return undefined;
}

// Create infrastructure for each Lambda function
const infrastructure = lambdaFunctions.map(config => {
  const role = createLambdaRole(config.name);
  const logGroup = createLogGroup(config.name);
  const lambdaFunction = createLambdaFunction(
    config.name,
    config.memory,
    config.reservedConcurrentExecutions,
    role,
    logGroup
  );
  const functionUrl = createFunctionUrl(config.name, lambdaFunction);
  const provisionedConcurrency = createProvisionedConcurrency(
    config.name,
    lambdaFunction,
    config.provisionedConcurrency
  );

  return {
    name: config.name,
    role,
    logGroup,
    lambdaFunction,
    functionUrl,
    provisionedConcurrency,
  };
});

// Exports
export const paymentValidatorArn = infrastructure[0].lambdaFunction.arn;
export const paymentValidatorUrl = infrastructure[0].functionUrl.functionUrl;
export const paymentValidatorRoleArn = infrastructure[0].role.arn;
export const paymentValidatorLogGroup = infrastructure[0].logGroup.name;

export const fraudDetectorArn = infrastructure[1].lambdaFunction.arn;
export const fraudDetectorUrl = infrastructure[1].functionUrl.functionUrl;
export const fraudDetectorRoleArn = infrastructure[1].role.arn;
export const fraudDetectorLogGroup = infrastructure[1].logGroup.name;

export const notificationSenderArn = infrastructure[2].lambdaFunction.arn;
export const notificationSenderUrl = infrastructure[2].functionUrl.functionUrl;
export const notificationSenderRoleArn = infrastructure[2].role.arn;
export const notificationSenderLogGroup = infrastructure[2].logGroup.name;
