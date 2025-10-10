```typescript
// bin/tap.ts
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { EnvironmentConfig } from '../lib/config/environment-config';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Get environment configuration
const config = EnvironmentConfig.getConfig(environmentSuffix);

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('Department', config.department);
Tags.of(app).add('Project', 'TAP');
Tags.of(app).add('ManagedBy', 'CDK');

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  config: config,
  environment: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
```

```typescript
// lib/tap-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { IEnvironmentConfig } from './config/environment-config';
import { ApiGatewayAccountConstruct } from './constructs/api-gateway-account-construct';
import { ApiGatewayConstruct } from './constructs/api-gateway-construct';
import { CognitoConstruct } from './constructs/cognito-construct';
import { DynamoDBConstruct } from './constructs/dynamodb-construct';
import { LambdaConstruct } from './constructs/lambda-construct';
import { MonitoringConstruct } from './constructs/monitoring-construct';
import { VpcConstruct } from './constructs/vpc-construct';

export interface TapStackProps extends cdk.StackProps {
  config: IEnvironmentConfig;
  environment: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // Set up API Gateway CloudWatch Logs role (regional setting)
    new ApiGatewayAccountConstruct(this, 'ApiGatewayAccount');

    const vpc = new VpcConstruct(this, 'VPC', {
      environment: props.environment,
      config: props.config.vpc,
    });

    const cognito = new CognitoConstruct(this, 'Cognito', {
      environment: props.environment,
      config: props.config.cognito,
    });

    const dynamodb = new DynamoDBConstruct(this, 'DynamoDB', {
      environment: props.environment,
      config: props.config.dynamodb,
      budgetLimit: props.config.budgetLimit,
    });

    const lambda = new LambdaConstruct(this, 'Lambda', {
      environment: props.environment,
      vpc: vpc.vpc,
      tables: dynamodb.tables,
      config: props.config.lambda,
      environmentVariables: props.config.environmentVariables,
    });

    const apiGateway = new ApiGatewayConstruct(this, 'APIGateway', {
      environment: props.environment,
      lambdaFunctions: lambda.functions,
      userPool: cognito.userPool,
      config: props.config.apiGateway,
      domainConfig: props.config.customDomain,
    });

    new MonitoringConstruct(this, 'Monitoring', {
      environment: props.environment,
      lambdaFunctions: lambda.functions,
      apiGateway: apiGateway.api,
      tables: dynamodb.tables,
      config: props.config.monitoring,
    });

    // API Gateway Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: apiGateway.api.url,
      description: 'API Gateway URL',
      exportName: `${props.environment}-ApiUrl`,
    });

    new cdk.CfnOutput(this, 'ApiId', {
      value: apiGateway.api.restApiId,
      description: 'API Gateway ID',
      exportName: `${props.environment}-ApiId`,
    });

    new cdk.CfnOutput(this, 'ApiStageName', {
      value: props.config.apiGateway.stageName,
      description: 'API Gateway Stage Name',
      exportName: `${props.environment}-ApiStageName`,
    });

    if (apiGateway.customDomainName) {
      new cdk.CfnOutput(this, 'CustomApiUrl', {
        value: `https://${apiGateway.customDomainName}`,
        description: 'Custom API Domain URL',
        exportName: `${props.environment}-CustomApiUrl`,
      });
    }

    // Cognito Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: cognito.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: `${props.environment}-UserPoolId`,
    });

    new cdk.CfnOutput(this, 'UserPoolArn', {
      value: cognito.userPool.userPoolArn,
      description: 'Cognito User Pool ARN',
      exportName: `${props.environment}-UserPoolArn`,
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: cognito.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: `${props.environment}-UserPoolClientId`,
    });

    // VPC Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpc.vpcId,
      description: 'VPC ID',
      exportName: `${props.environment}-VpcId`,
    });

    new cdk.CfnOutput(this, 'VpcCidr', {
      value: vpc.vpc.vpcCidrBlock,
      description: 'VPC CIDR Block',
      exportName: `${props.environment}-VpcCidr`,
    });

    // DynamoDB Table Outputs
    Object.keys(dynamodb.tables).forEach(name => {
      const table = dynamodb.tables[name];
      new cdk.CfnOutput(this, `${name}TableName`, {
        value: table.tableName,
        description: `${name} DynamoDB Table Name`,
        exportName: `${props.environment}-${name}TableName`,
      });

      new cdk.CfnOutput(this, `${name}TableArn`, {
        value: table.tableArn,
        description: `${name} DynamoDB Table ARN`,
        exportName: `${props.environment}-${name}TableArn`,
      });
    });

    // Lambda Function Outputs
    Object.keys(lambda.functions).forEach(name => {
      const fn = lambda.functions[name];
      new cdk.CfnOutput(this, `${name}FunctionName`, {
        value: fn.functionName,
        description: `${name} Lambda Function Name`,
        exportName: `${props.environment}-${name}FunctionName`,
      });

      new cdk.CfnOutput(this, `${name}FunctionArn`, {
        value: fn.functionArn,
        description: `${name} Lambda Function ARN`,
        exportName: `${props.environment}-${name}FunctionArn`,
      });
    });

    // Lambda Alias Outputs (if versioning is enabled)
    if (props.config.lambda.enableVersioning) {
      Object.keys(lambda.aliases).forEach(name => {
        const alias = lambda.aliases[name];
        new cdk.CfnOutput(this, `${name}AliasName`, {
          value: alias.aliasName,
          description: `${name} Lambda Alias Name`,
          exportName: `${props.environment}-${name}AliasName`,
        });

        new cdk.CfnOutput(this, `${name}AliasArn`, {
          value: alias.functionArn,
          description: `${name} Lambda Alias ARN`,
          exportName: `${props.environment}-${name}AliasArn`,
        });
      });
    }

    // Environment Output
    new cdk.CfnOutput(this, 'Environment', {
      value: props.environment,
      description: 'Deployment Environment',
      exportName: `${props.environment}-Environment`,
    });

    // Region Output
    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS Region',
      exportName: `${props.environment}-Region`,
    });
  }
}
```

```typescript
// lib/config/environment-config.ts
export interface IVpcConfig {
  enableVpcPeering: boolean;
  peeringVpcId?: string;
  peeringRegion?: string;
  maxAzs: number;
}

export interface ICognitoConfig {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireDigits: boolean;
    requireSymbols: boolean;
  };
}

export interface IDynamoDBConfig {
  tables: Array<{
    name: string;
    partitionKey: string;
    sortKey?: string;
    readCapacity: number;
    writeCapacity: number;
    enableAutoScaling: boolean;
    maxReadCapacity?: number;
    maxWriteCapacity?: number;
  }>;
}

export interface ILambdaConfig {
  functions: Array<{
    name: string;
    handler: string;
    runtime: string;
    memorySize: number;
    timeout: number;
    reservedConcurrentExecutions?: number;
  }>;
  enableVersioning: boolean;
  aliasName: string;
}

export interface IApiGatewayConfig {
  stageName: string;
  throttleRateLimit: number;
  throttleBurstLimit: number;
  quotaLimit?: number;
  quotaPeriod?: 'DAY' | 'WEEK' | 'MONTH';
}

export interface ICustomDomainConfig {
  domainName: string;
  certificateArn: string;
}

export interface IMonitoringConfig {
  alarmEmail: string;
  lambdaErrorThreshold: number;
  lambdaDurationThreshold: number;
}

export interface IEnvironmentConfig {
  department: string;
  budgetLimit: number;
  vpc: IVpcConfig;
  cognito: ICognitoConfig;
  dynamodb: IDynamoDBConfig;
  lambda: ILambdaConfig;
  apiGateway: IApiGatewayConfig;
  customDomain?: ICustomDomainConfig;
  monitoring: IMonitoringConfig;
  environmentVariables: { [key: string]: string };
}

export class EnvironmentConfig {
  private static defaultConfig: IEnvironmentConfig = {
    department: 'Engineering',
    budgetLimit: 100,
    vpc: {
      enableVpcPeering: false,
      maxAzs: 2,
    },
    cognito: {
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
    },
    dynamodb: {
      tables: [
        {
          name: 'UserTable',
          partitionKey: 'userId',
          readCapacity: 5,
          writeCapacity: 5,
          enableAutoScaling: false,
        },
      ],
    },
    lambda: {
      functions: [
        {
          name: 'UserHandler',
          handler: 'index.handler',
          runtime: 'nodejs18.x',
          memorySize: 256,
          timeout: 30,
        },
      ],
      enableVersioning: true,
      aliasName: 'default',
    },
    apiGateway: {
      stageName: 'default',
      throttleRateLimit: 100,
      throttleBurstLimit: 200,
    },
    monitoring: {
      alarmEmail: 'alerts@example.com',
      lambdaErrorThreshold: 5,
      lambdaDurationThreshold: 3000,
    },
    environmentVariables: {
      LOG_LEVEL: 'INFO',
      API_VERSION: 'v1',
    },
  };

  private static configs: { [key: string]: IEnvironmentConfig } = {
    dev: {
      department: 'Engineering',
      budgetLimit: 100,
      vpc: {
        enableVpcPeering: false,
        maxAzs: 2,
      },
      cognito: {
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireDigits: true,
          requireSymbols: false,
        },
      },
      dynamodb: {
        tables: [
          {
            name: 'UserTable',
            partitionKey: 'userId',
            readCapacity: 5,
            writeCapacity: 5,
            enableAutoScaling: false,
          },
        ],
      },
      lambda: {
        functions: [
          {
            name: 'UserHandler',
            handler: 'index.handler',
            runtime: 'nodejs18.x',
            memorySize: 256,
            timeout: 30,
          },
        ],
        enableVersioning: true,
        aliasName: 'dev',
      },
      apiGateway: {
        stageName: 'dev',
        throttleRateLimit: 100,
        throttleBurstLimit: 200,
      },
      monitoring: {
        alarmEmail: 'dev-alerts@example.com',
        lambdaErrorThreshold: 5,
        lambdaDurationThreshold: 3000,
      },
      environmentVariables: {
        LOG_LEVEL: 'DEBUG',
        API_VERSION: 'v1',
      },
    },
    staging: {
      department: 'Engineering',
      budgetLimit: 500,
      vpc: {
        enableVpcPeering: true,
        peeringVpcId: 'vpc-12345678',
        peeringRegion: 'us-east-1',
        maxAzs: 2,
      },
      cognito: {
        passwordPolicy: {
          minLength: 10,
          requireUppercase: true,
          requireLowercase: true,
          requireDigits: true,
          requireSymbols: true,
        },
      },
      dynamodb: {
        tables: [
          {
            name: 'UserTable',
            partitionKey: 'userId',
            readCapacity: 10,
            writeCapacity: 10,
            enableAutoScaling: true,
            maxReadCapacity: 50,
            maxWriteCapacity: 50,
          },
        ],
      },
      lambda: {
        functions: [
          {
            name: 'UserHandler',
            handler: 'index.handler',
            runtime: 'nodejs18.x',
            memorySize: 512,
            timeout: 60,
            reservedConcurrentExecutions: 10,
          },
        ],
        enableVersioning: true,
        aliasName: 'staging',
      },
      apiGateway: {
        stageName: 'staging',
        throttleRateLimit: 500,
        throttleBurstLimit: 1000,
        quotaLimit: 10000,
        quotaPeriod: 'DAY',
      },
      monitoring: {
        alarmEmail: 'staging-alerts@example.com',
        lambdaErrorThreshold: 10,
        lambdaDurationThreshold: 5000,
      },
      environmentVariables: {
        LOG_LEVEL: 'INFO',
        API_VERSION: 'v1',
      },
    },
    production: {
      department: 'Engineering',
      budgetLimit: 2000,
      vpc: {
        enableVpcPeering: true,
        peeringVpcId: 'vpc-87654321',
        peeringRegion: 'us-east-1',
        maxAzs: 3,
      },
      cognito: {
        passwordPolicy: {
          minLength: 12,
          requireUppercase: true,
          requireLowercase: true,
          requireDigits: true,
          requireSymbols: true,
        },
      },
      dynamodb: {
        tables: [
          {
            name: 'UserTable',
            partitionKey: 'userId',
            readCapacity: 25,
            writeCapacity: 25,
            enableAutoScaling: true,
            maxReadCapacity: 100,
            maxWriteCapacity: 100,
          },
        ],
      },
      lambda: {
        functions: [
          {
            name: 'UserHandler',
            handler: 'index.handler',
            runtime: 'nodejs18.x',
            memorySize: 1024,
            timeout: 120,
            reservedConcurrentExecutions: 50,
          },
        ],
        enableVersioning: true,
        aliasName: 'production',
      },
      apiGateway: {
        stageName: 'production',
        throttleRateLimit: 1000,
        throttleBurstLimit: 2000,
        quotaLimit: 100000,
        quotaPeriod: 'DAY',
      },
      customDomain: {
        domainName: 'api.example.com',
        certificateArn:
          'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012',
      },
      monitoring: {
        alarmEmail: 'production-alerts@example.com',
        lambdaErrorThreshold: 25,
        lambdaDurationThreshold: 10000,
      },
      environmentVariables: {
        LOG_LEVEL: 'WARN',
        API_VERSION: 'v1',
      },
    },
  };

  static getConfig(environment: string): IEnvironmentConfig {
    const config = this.configs[environment];
    if (!config) {
      console.warn(
        `Configuration for environment '${environment}' not found. Using default configuration.`
      );
      return this.defaultConfig;
    }
    return config;
  }
}
```

```typescript
// lib/constructs/vpc-construct.ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { IVpcConfig } from '../config/environment-config';

export interface VpcConstructProps {
  environment: string;
  config: IVpcConfig;
}

export class VpcConstruct extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly vpcPeering?: ec2.CfnVPCPeeringConnection;

  constructor(scope: Construct, id: string, props: VpcConstructProps) {
    super(scope, id);

    this.vpc = new ec2.Vpc(this, 'VPC', {
      maxAzs: props.config.maxAzs,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    if (props.config.enableVpcPeering && props.config.peeringVpcId) {
      this.vpcPeering = new ec2.CfnVPCPeeringConnection(this, 'VPCPeering', {
        vpcId: this.vpc.vpcId,
        peerVpcId: props.config.peeringVpcId,
        peerRegion: props.config.peeringRegion,
      });

      cdk.Tags.of(this.vpcPeering).add(
        'Name',
        `${props.environment}-vpc-peering`
      );
    }

    cdk.Tags.of(this.vpc).add('Name', `${props.environment}-vpc`);
  }
}
```

```typescript
// lib/constructs/cognito-construct.ts
import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import { ICognitoConfig } from '../config/environment-config';

export interface CognitoConstructProps {
  environment: string;
  config: ICognitoConfig;
}

export class CognitoConstruct extends Construct {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: CognitoConstructProps) {
    super(scope, id);

    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `${props.environment}-user-pool`,
      selfSignUpEnabled: true,
      userVerification: {
        emailSubject: 'Verify your email',
        emailBody: 'Please verify your email by clicking {##Verify Email##}',
        emailStyle: cognito.VerificationEmailStyle.LINK,
      },
      signInAliases: {
        email: true,
        username: false,
      },
      passwordPolicy: {
        minLength: props.config.passwordPolicy.minLength,
        requireUppercase: props.config.passwordPolicy.requireUppercase,
        requireLowercase: props.config.passwordPolicy.requireLowercase,
        requireDigits: props.config.passwordPolicy.requireDigits,
        requireSymbols: props.config.passwordPolicy.requireSymbols,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy:
        props.environment === 'production'
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
    });

    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: this.userPool,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      generateSecret: false,
      preventUserExistenceErrors: true,
    });

    cdk.Tags.of(this.userPool).add('Name', `${props.environment}-cognito`);
  }
}
```

```typescript
// lib/constructs/dynamodb-construct.ts
import * as cdk from 'aws-cdk-lib';
import * as budgets from 'aws-cdk-lib/aws-budgets';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { IDynamoDBConfig } from '../config/environment-config';

export interface DynamoDBConstructProps {
  environment: string;
  config: IDynamoDBConfig;
  budgetLimit: number;
}

export class DynamoDBConstruct extends Construct {
  public readonly tables: { [key: string]: dynamodb.Table } = {};

  constructor(scope: Construct, id: string, props: DynamoDBConstructProps) {
    super(scope, id);

    props.config.tables.forEach(tableConfig => {
      const table = new dynamodb.Table(this, tableConfig.name, {
        tableName: `${props.environment}-${tableConfig.name}`,
        partitionKey: {
          name: tableConfig.partitionKey,
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: tableConfig.sortKey
          ? {
            name: tableConfig.sortKey,
            type: dynamodb.AttributeType.STRING,
          }
          : undefined,
        billingMode: dynamodb.BillingMode.PROVISIONED,
        readCapacity: tableConfig.readCapacity,
        writeCapacity: tableConfig.writeCapacity,
        pointInTimeRecoverySpecification: {
          pointInTimeRecoveryEnabled: props.environment === 'production',
        },
        encryption: dynamodb.TableEncryption.AWS_MANAGED,
        removalPolicy:
          props.environment === 'production'
            ? cdk.RemovalPolicy.RETAIN
            : cdk.RemovalPolicy.DESTROY,
        stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      });

      if (tableConfig.enableAutoScaling) {
        const readScaling = table.autoScaleReadCapacity({
          minCapacity: tableConfig.readCapacity,
          maxCapacity:
            tableConfig.maxReadCapacity || tableConfig.readCapacity * 10,
        });

        readScaling.scaleOnUtilization({
          targetUtilizationPercent: 70,
          scaleInCooldown: cdk.Duration.seconds(60),
          scaleOutCooldown: cdk.Duration.seconds(60),
        });

        const writeScaling = table.autoScaleWriteCapacity({
          minCapacity: tableConfig.writeCapacity,
          maxCapacity:
            tableConfig.maxWriteCapacity || tableConfig.writeCapacity * 10,
        });

        writeScaling.scaleOnUtilization({
          targetUtilizationPercent: 70,
          scaleInCooldown: cdk.Duration.seconds(60),
          scaleOutCooldown: cdk.Duration.seconds(60),
        });
      }

      this.tables[tableConfig.name] = table;
      cdk.Tags.of(table).add(
        'Name',
        `${props.environment}-${tableConfig.name}`
      );
    });

    new budgets.CfnBudget(this, 'DynamoDBBudget', {
      budget: {
        budgetName: `${props.environment}-dynamodb-budget`,
        budgetType: 'COST',
        timeUnit: 'MONTHLY',
        budgetLimit: {
          amount: props.budgetLimit,
          unit: 'USD',
        },
        costFilters: {
          Service: ['Amazon DynamoDB'],
          TagKeyValue: ['user:Department$Engineering'],
        },
      },
      notificationsWithSubscribers: [
        {
          notification: {
            notificationType: 'ACTUAL',
            comparisonOperator: 'GREATER_THAN',
            threshold: 80,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: [
            {
              subscriptionType: 'EMAIL',
              address: 'budget-alerts@example.com',
            },
          ],
        },
      ],
    });
  }
}
```

```typescript
// lib/constructs/lambda-construct.ts
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';
import { ILambdaConfig } from '../config/environment-config';

export interface LambdaConstructProps {
  environment: string;
  vpc: ec2.Vpc;
  tables: { [key: string]: dynamodb.Table };
  config: ILambdaConfig;
  environmentVariables: { [key: string]: string };
}

export class LambdaConstruct extends Construct {
  public readonly functions: { [key: string]: lambda.Function } = {};
  public readonly aliases: { [key: string]: lambda.Alias } = {};

  constructor(scope: Construct, id: string, props: LambdaConstructProps) {
    super(scope, id);

    props.config.functions.forEach(functionConfig => {
      const logGroup = new logs.LogGroup(
        this,
        `${functionConfig.name}LogGroup`,
        {
          logGroupName: `/aws/lambda/${props.environment}-${functionConfig.name}`,
          retention: logs.RetentionDays.ONE_MONTH,
          removalPolicy:
            props.environment === 'production'
              ? cdk.RemovalPolicy.RETAIN
              : cdk.RemovalPolicy.DESTROY,
        }
      );

      const functionRole = new iam.Role(this, `${functionConfig.name}Role`, {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        description: `Role for ${functionConfig.name} Lambda function`,
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaVPCAccessExecutionRole'
          ),
        ],
        inlinePolicies: {
          LambdaExecutionPolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                resources: [logGroup.logGroupArn],
              }),
              new iam.PolicyStatement({
                actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
                resources: ['*'],
              }),
            ],
          }),
        },
      });

      const fn = new NodejsFunction(this, functionConfig.name, {
        functionName: `${props.environment}-${functionConfig.name}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: path.join(__dirname, '../lambda/user-handler.ts'),
        handler: 'handler',
        memorySize: functionConfig.memorySize,
        timeout: cdk.Duration.seconds(functionConfig.timeout),
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        environment: {
          ENVIRONMENT: props.environment,
          ...props.environmentVariables,
          ...Object.entries(props.tables).reduce(
            (acc, [name, table]) => ({
              ...acc,
              [`${name.toUpperCase()}_TABLE_NAME`]: table.tableName,
            }),
            {}
          ),
        },
        reservedConcurrentExecutions:
          functionConfig.reservedConcurrentExecutions,
        tracing: lambda.Tracing.ACTIVE,
        role: functionRole,
        logGroup: logGroup,
        bundling: {
          minify: true,
          sourceMap: true,
          externalModules: ['aws-sdk'],
        },
      });

      Object.values(props.tables).forEach(table => {
        table.grantReadWriteData(fn);
      });

      if (props.config.enableVersioning) {
        const version = fn.currentVersion;

        const alias = new lambda.Alias(this, `${functionConfig.name}Alias`, {
          aliasName: props.config.aliasName,
          version: version,
          provisionedConcurrentExecutions:
            props.environment === 'production' ? 1 : undefined,
        });

        this.aliases[functionConfig.name] = alias;
        this.functions[functionConfig.name] = fn;
      } else {
        this.functions[functionConfig.name] = fn;
      }

      cdk.Tags.of(fn).add(
        'Name',
        `${props.environment}-${functionConfig.name}`
      );
    });
  }
}
```

```typescript
// lib/constructs/api-gateway-account-construct.ts
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

/**
 * This construct sets up the CloudWatch Logs role for API Gateway at the account level.
 * This is a one-time setup per region, but it's safe to deploy multiple times.
 */
export class ApiGatewayAccountConstruct extends Construct {
  public readonly cloudWatchRole: iam.Role;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create a role for API Gateway to write logs to CloudWatch
    this.cloudWatchRole = new iam.Role(this, 'ApiGatewayCloudWatchRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      description: 'Role for API Gateway to write logs to CloudWatch',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonAPIGatewayPushToCloudWatchLogs'
        ),
      ],
    });

    // Set the CloudWatch role for API Gateway account settings
    // This is a regional setting that applies to all API Gateway APIs in the region
    new apigateway.CfnAccount(this, 'ApiGatewayAccount', {
      cloudWatchRoleArn: this.cloudWatchRole.roleArn,
    });
  }
}
```

```typescript
// lib/constructs/api-gateway-construct.ts
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import {
  IApiGatewayConfig,
  ICustomDomainConfig,
} from '../config/environment-config';

export interface ApiGatewayConstructProps {
  environment: string;
  lambdaFunctions: { [key: string]: lambda.Function };
  userPool: cognito.UserPool;
  config: IApiGatewayConfig;
  domainConfig?: ICustomDomainConfig;
}

export class ApiGatewayConstruct extends Construct {
  public readonly api: apigateway.RestApi;
  public readonly customDomainName?: string;

  constructor(scope: Construct, id: string, props: ApiGatewayConstructProps) {
    super(scope, id);

    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      'Authorizer',
      {
        cognitoUserPools: [props.userPool],
        authorizerName: `${props.environment}-authorizer`,
        identitySource: 'method.request.header.Authorization',
      }
    );

    const logGroup = new cdk.aws_logs.LogGroup(this, 'ApiGatewayLogGroup', {
      retention: cdk.aws_logs.RetentionDays.ONE_MONTH,
    });

    this.api = new apigateway.RestApi(this, 'Api', {
      restApiName: `${props.environment}-api`,
      deployOptions: {
        stageName: props.config.stageName,
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: props.environment !== 'production',
        metricsEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
        accessLogFormat: apigateway.AccessLogFormat.clf(),
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
      },
      endpointTypes: [apigateway.EndpointType.REGIONAL],
    });

    const usagePlan = new apigateway.UsagePlan(this, 'UsagePlan', {
      name: `${props.environment}-usage-plan`,
      apiStages: [
        {
          api: this.api,
          stage: this.api.deploymentStage,
        },
      ],
      throttle: {
        rateLimit: props.config.throttleRateLimit,
        burstLimit: props.config.throttleBurstLimit,
      },
      quota: props.config.quotaLimit
        ? {
            limit: props.config.quotaLimit,
            period: apigateway.Period[props.config.quotaPeriod!],
          }
        : undefined,
    });

    const apiKey = new apigateway.ApiKey(this, 'ApiKey', {
      apiKeyName: `${props.environment}-api-key`,
    });

    usagePlan.addApiKey(apiKey);

    Object.entries(props.lambdaFunctions).forEach(([name, fn]) => {
      const resource = this.api.root.addResource(name.toLowerCase());
      const integration = new apigateway.LambdaIntegration(fn, {
        proxy: true,
      });

      resource.addMethod('GET', integration, {
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizer,
        apiKeyRequired: true,
      });

      resource.addMethod('POST', integration, {
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizer,
        apiKeyRequired: true,
      });
    });

    if (props.domainConfig) {
      const domainName = new apigateway.DomainName(this, 'CustomDomain', {
        domainName: props.domainConfig.domainName,
        certificate: certificatemanager.Certificate.fromCertificateArn(
          this,
          'Certificate',
          props.domainConfig.certificateArn
        ),
        endpointType: apigateway.EndpointType.REGIONAL,
        securityPolicy: apigateway.SecurityPolicy.TLS_1_2,
      });

      domainName.addBasePathMapping(this.api, {
        basePath: props.environment === 'production' ? '' : props.environment,
      });

      this.customDomainName = props.domainConfig.domainName;

      new cdk.CfnOutput(this, 'ApiKeyId', {
        value: apiKey.keyId,
        description: 'API Key ID',
      });
    }

    cdk.Tags.of(this.api).add('Name', `${props.environment}-api`);
  }
}
```

```typescript
// lib/constructs/monitoring-construct.ts
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
import { IMonitoringConfig } from '../config/environment-config';

export interface MonitoringConstructProps {
  environment: string;
  lambdaFunctions: { [key: string]: lambda.Function };
  apiGateway: apigateway.RestApi;
  tables: { [key: string]: dynamodb.Table };
  config: IMonitoringConfig;
}

export class MonitoringConstruct extends Construct {
  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);

    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `${props.environment}-alarms`,
      displayName: `${props.environment} CloudWatch Alarms`,
    });

    alarmTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(props.config.alarmEmail)
    );

    Object.entries(props.lambdaFunctions).forEach(([name, fn]) => {
      new cloudwatch.Alarm(this, `${name}ErrorAlarm`, {
        alarmName: `${props.environment}-${name}-errors`,
        metric: fn.metricErrors(),
        threshold: props.config.lambdaErrorThreshold,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

      new cloudwatch.Alarm(this, `${name}DurationAlarm`, {
        alarmName: `${props.environment}-${name}-duration`,
        metric: fn.metricDuration(),
        threshold: props.config.lambdaDurationThreshold,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

      new cloudwatch.Alarm(this, `${name}ThrottlesAlarm`, {
        alarmName: `${props.environment}-${name}-throttles`,
        metric: fn.metricThrottles(),
        threshold: 5,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));
    });

    new cloudwatch.Alarm(this, 'Api4XXAlarm', {
      alarmName: `${props.environment}-api-4xx`,
      metric: props.apiGateway.metricClientError(),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    new cloudwatch.Alarm(this, 'Api5XXAlarm', {
      alarmName: `${props.environment}-api-5xx`,
      metric: props.apiGateway.metricServerError(),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    Object.entries(props.tables).forEach(([name, table]) => {
      new cloudwatch.Alarm(this, `${name}ReadThrottleAlarm`, {
        alarmName: `${props.environment}-${name}-read-throttles`,
        metric: table.metricUserErrors({
          statistic: 'Sum',
        }),
        threshold: 10,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));
    });

    const dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `${props.environment}-dashboard`,
      defaultInterval: cdk.Duration.hours(6),
    });

    Object.entries(props.lambdaFunctions).forEach(([name, fn]) => {
      dashboard.addWidgets(
        new cloudwatch.GraphWidget({
          title: `${name} Metrics`,
          left: [fn.metricInvocations()],
          right: [fn.metricErrors()],
          width: 12,
        }),
        new cloudwatch.GraphWidget({
          title: `${name} Duration`,
          left: [fn.metricDuration()],
          width: 12,
        })
      );
    });
  }
}
```

```typescript
// lib/lambda/user-handler.ts
/**
 * Lambda Handler for TAP Stack - User Management
 * Interacts with DynamoDB to perform CRUD operations
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';

// Initialize DynamoDB client
const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

// Get table name from environment variable
const TABLE_NAME = process.env.USERTABLE_TABLE_NAME!;
const ENVIRONMENT = process.env.ENVIRONMENT || 'dev';
const LOG_LEVEL = process.env.LOG_LEVEL || 'INFO';

interface DirectInvocationEvent {
  action: string;
  userId?: string;
  id?: string;
  data?: Record<string, unknown>;
  message?: string;
}

/**
 * Main Lambda handler
 * Supports API Gateway proxy integration and direct invocations
 */
export const handler = async (
  event: APIGatewayProxyEvent | DirectInvocationEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  // Log the incoming event
  if (LOG_LEVEL === 'DEBUG') {
    console.log('Event:', JSON.stringify(event, null, 2));
  }

  try {
    // Handle direct Lambda invocations (for testing)
    if ('action' in event) {
      return await handleDirectInvocation(event as DirectInvocationEvent);
    }

    // Handle API Gateway proxy requests
    if ('httpMethod' in event) {
      return await handleApiGatewayRequest(event as APIGatewayProxyEvent);
    }

    // Default test response
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Lambda function is working',
        environment: ENVIRONMENT,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('Error processing request:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

/**
 * Handle direct Lambda invocations (for testing)
 */
async function handleDirectInvocation(
  event: DirectInvocationEvent
): Promise<APIGatewayProxyResult> {
  console.log(`Direct invocation - Action: ${event.action}`);

  switch (event.action) {
    case 'putItem':
      return await createUser(event.userId || event.id || '', event.data || {});

    case 'getItem':
      return await getUser(event.userId || event.id || '');

    case 'deleteItem':
      return await deleteUser(event.userId || event.id || '');

    case 'test':
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Test successful',
          tableName: TABLE_NAME,
          environment: ENVIRONMENT,
          timestamp: new Date().toISOString(),
        }),
      };

    case 'log':
      console.log('Log test:', event.message || 'Test log message');
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Log written successfully',
        }),
      };

    default:
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Unknown action',
          action: event.action,
        }),
      };
  }
}

/**
 * Handle API Gateway proxy requests
 */
async function handleApiGatewayRequest(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const method = event.httpMethod;
  const path = event.path;
  const pathParameters = event.pathParameters || {};
  const body = event.body ? JSON.parse(event.body) : {};

  console.log(`API Gateway request: ${method} ${path}`);

  // Route the request
  if (path === '/items' && method === 'GET') {
    return await listUsers(event.queryStringParameters);
  }

  if (path === '/items' && method === 'POST') {
    return await createUser(body.userId, body);
  }

  if (path.startsWith('/items/') && method === 'GET') {
    const userId = pathParameters.id || path.split('/').pop() || '';
    return await getUser(userId);
  }

  if (path.startsWith('/items/') && method === 'PUT') {
    const userId = pathParameters.id || path.split('/').pop() || '';
    return await updateUser(userId, body);
  }

  if (path.startsWith('/items/') && method === 'DELETE') {
    const userId = pathParameters.id || path.split('/').pop() || '';
    return await deleteUser(userId);
  }

  if (path === '/health' && method === 'GET') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        status: 'healthy',
        environment: ENVIRONMENT,
        timestamp: new Date().toISOString(),
      }),
    };
  }

  // Route not found
  return {
    statusCode: 404,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      error: 'Not found',
      path,
      method,
    }),
  };
}

/**
 * Create a new user
 */
async function createUser(
  userId: string,
  data: Record<string, unknown>
): Promise<APIGatewayProxyResult> {
  if (!userId) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'userId is required',
      }),
    };
  }

  const item = {
    userId,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    environment: ENVIRONMENT,
  };

  console.log(`Creating user: ${userId}`);

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );

  return {
    statusCode: 201,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      message: 'User created successfully',
      userId,
      item,
    }),
  };
}

/**
 * Get a user by ID
 */
async function getUser(userId: string): Promise<APIGatewayProxyResult> {
  if (!userId) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'userId is required',
      }),
    };
  }

  console.log(`Getting user: ${userId}`);

  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { userId },
    })
  );

  if (!result.Item) {
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'User not found',
        userId,
      }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      user: result.Item,
    }),
  };
}

/**
 * Update a user
 */
async function updateUser(
  userId: string,
  data: Record<string, unknown>
): Promise<APIGatewayProxyResult> {
  if (!userId) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'userId is required',
      }),
    };
  }

  console.log(`Updating user: ${userId}`);

  // Build update expression
  const updateExpressionParts: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, unknown> = {};

  Object.keys(data).forEach((key, index) => {
    if (key !== 'userId') {
      updateExpressionParts.push(`#attr${index} = :val${index}`);
      expressionAttributeNames[`#attr${index}`] = key;
      expressionAttributeValues[`:val${index}`] = data[key];
    }
  });

  // Add updatedAt timestamp
  updateExpressionParts.push('#updatedAt = :updatedAt');
  expressionAttributeNames['#updatedAt'] = 'updatedAt';
  expressionAttributeValues[':updatedAt'] = new Date().toISOString();

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { userId },
      UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    })
  );

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      message: 'User updated successfully',
      userId,
    }),
  };
}

/**
 * Delete a user
 */
async function deleteUser(userId: string): Promise<APIGatewayProxyResult> {
  if (!userId) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'userId is required',
      }),
    };
  }

  console.log(`Deleting user: ${userId}`);

  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { userId },
    })
  );

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      message: 'User deleted successfully',
      userId,
    }),
  };
}

/**
 * List all users (with pagination support)
 */
async function listUsers(
  queryParams: { [name: string]: string | undefined } | null = null
): Promise<APIGatewayProxyResult> {
  const limit = parseInt(queryParams?.limit || '50', 10);

  console.log(`Listing users (limit: ${limit})`);

  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      Limit: limit,
    })
  );

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      users: result.Items || [],
      count: result.Count || 0,
      scannedCount: result.ScannedCount || 0,
    }),
  };
}
```
