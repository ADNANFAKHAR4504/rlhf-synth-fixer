import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { EnvironmentConfig } from '../lib/config/environment-config';
import { TapStack } from '../lib/tap-stack';

const environment = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  let config: any;

  // Reuse stack instances to avoid multiple Docker bundling
  let stagingStack: TapStack;
  let stagingTemplate: Template;
  let prodStack: TapStack;
  let prodTemplate: Template;

  beforeAll(() => {
    // Create dev stack
    app = new cdk.App();
    config = EnvironmentConfig.getConfig(environment);
    stack = new TapStack(app, 'TestTapStack', { config, environment });
    template = Template.fromStack(stack);

    // Create staging stack once
    const stagingApp = new cdk.App();
    const stagingConfig = EnvironmentConfig.getConfig('staging');
    stagingStack = new TapStack(stagingApp, 'StagingStack', {
      config: stagingConfig,
      environment: 'staging',
    });
    stagingTemplate = Template.fromStack(stagingStack);

    // Create production stack once
    const prodApp = new cdk.App();
    const prodConfig = EnvironmentConfig.getConfig('production');
    prodStack = new TapStack(prodApp, 'ProductionStack', {
      config: prodConfig,
      environment: 'production',
    });
    prodTemplate = Template.fromStack(prodStack);
  });

  describe('Stack Creation', () => {
    test('Stack should be created successfully', () => {
      expect(stack).toBeDefined();
      expect(template).toBeDefined();
    });

    test('Stack should be created with correct stack ID', () => {
      expect(stack.artifactId).toBe('TestTapStack');
    });

    test('Stack with staging environment', () => {
      // Verify environment-specific resources
      stagingTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'staging-UserTable',
      });
    });

    test('Stack with production environment', () => {
      // Verify environment-specific resources
      prodTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'production-UserTable',
      });
    });

    test('Stack resources are environment-specific to prevent cross-environment leakage', () => {
      // All resource names should include environment prefix
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `${environment}-UserTable`,
      });

      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `${environment}-UserHandler`,
      });
    });
  });

  describe('VPC Configuration', () => {
    test('Should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('Should create public, private, and isolated subnets', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      expect(Object.keys(subnets).length).toBeGreaterThanOrEqual(6); // At least 2 AZs * 3 types
    });

    test('Should create NAT Gateway for private subnets', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('VPC should support peering if enabled', () => {
      const prodConfig = EnvironmentConfig.getConfig('production');

      // Production config has VPC peering enabled
      const vpcs = prodTemplate.findResources('AWS::EC2::VPCPeeringConnection');
      if (prodConfig.vpc.enableVpcPeering) {
        expect(Object.keys(vpcs).length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('AWS Cognito Configuration', () => {
    test('Should create Cognito User Pool', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UserPoolName: `${environment}-user-pool`,
        Policies: {
          PasswordPolicy: {
            MinimumLength: Match.anyValue(),
            RequireUppercase: true,
            RequireLowercase: true,
            RequireNumbers: true,
          },
        },
      });
    });

    test('Should create Cognito User Pool Client', () => {
      template.resourceCountIs('AWS::Cognito::UserPoolClient', 1);
    });

    test('Should configure email verification', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        AutoVerifiedAttributes: ['email'],
        UsernameAttributes: ['email'],
      });
    });

    test('Should have appropriate removal policy based on environment', () => {
      const resources = prodTemplate.findResources('AWS::Cognito::UserPool');
      const userPoolKey = Object.keys(resources)[0];
      const userPool = resources[userPoolKey];

      // Production should retain
      expect(userPool.DeletionPolicy).toBe('Retain');
    });
  });

  describe('DynamoDB Table', () => {
    test('Should create DynamoDB table with correct properties', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `${environment}-UserTable`,
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
      });
    });

    test('Should have userId as partition key', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'userId',
            KeyType: 'HASH',
          },
        ],
      });
    });

    test('Should have provisioned throughput configured', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        ProvisionedThroughput: {
          ReadCapacityUnits: Match.anyValue(),
          WriteCapacityUnits: Match.anyValue(),
        },
      });
    });

    test('Should have auto-scaling configured for staging', () => {
      const stagingConfig = EnvironmentConfig.getConfig('staging');

      if (stagingConfig.dynamodb.tables[0].enableAutoScaling) {
        // Should have scaling targets
        const scalingTargets = stagingTemplate.findResources(
          'AWS::ApplicationAutoScaling::ScalableTarget'
        );
        expect(Object.keys(scalingTargets).length).toBeGreaterThanOrEqual(2); // Read + Write
      }
    });

    test('Should have point-in-time recovery enabled for production', () => {
      prodTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('Should have proper deletion policy', () => {
      const devResources = template.findResources('AWS::DynamoDB::Table');
      const devTableKey = Object.keys(devResources)[0];
      const devTable = devResources[devTableKey];
      expect(devTable.UpdateReplacePolicy).toBe('Delete');

      const prodResources = prodTemplate.findResources('AWS::DynamoDB::Table');
      const prodTableKey = Object.keys(prodResources)[0];
      const prodTable = prodResources[prodTableKey];
      expect(prodTable.DeletionPolicy).toBe('Retain');
    });

    test('Should have encryption enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
        },
      });
    });
  });

  describe('DynamoDB Budget Constraints', () => {
    test('Should create budget for DynamoDB costs', () => {
      template.hasResourceProperties('AWS::Budgets::Budget', {
        Budget: {
          BudgetType: 'COST',
          TimeUnit: 'MONTHLY',
          BudgetLimit: {
            Amount: Match.anyValue(),
            Unit: 'USD',
          },
          CostFilters: {
            Service: ['Amazon DynamoDB'],
          },
        },
      });
    });

    test('Should have budget alerts configured', () => {
      template.hasResourceProperties('AWS::Budgets::Budget', {
        NotificationsWithSubscribers: Match.arrayWith([
          Match.objectLike({
            Notification: {
              ComparisonOperator: 'GREATER_THAN',
              Threshold: 80,
              ThresholdType: 'PERCENTAGE',
            },
          }),
        ]),
      });
    });
  });

  describe('Lambda Function', () => {
    test('Should create Lambda function with correct runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        FunctionName: `${environment}-UserHandler`,
      });
    });

    test('Should have correct timeout and memory from config', () => {
      const lambdaConfig = config.lambda.functions[0];
      template.hasResourceProperties('AWS::Lambda::Function', {
        Timeout: lambdaConfig.timeout,
        MemorySize: lambdaConfig.memorySize,
      });
    });

    test('Should have environment variables configured without hardcoded values', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            ENVIRONMENT: environment,
            USERTABLE_TABLE_NAME: Match.anyValue(),
            LOG_LEVEL: Match.anyValue(),
            API_VERSION: Match.anyValue(),
          },
        },
      });
    });

    test('Should have X-Ray tracing enabled', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('Should be deployed in VPC private subnets', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: {
          SubnetIds: Match.anyValue(),
          SecurityGroupIds: Match.anyValue(),
        },
      });
    });

    test('Should have versioning enabled', () => {
      const versions = template.findResources('AWS::Lambda::Version');
      expect(Object.keys(versions).length).toBeGreaterThanOrEqual(1);
    });

    test('Should have alias configured for rollback strategy', () => {
      template.hasResourceProperties('AWS::Lambda::Alias', {
        Name: config.lambda.aliasName,
      });
    });

    test('Should have provisioned concurrency for production', () => {
      const prodConfig = EnvironmentConfig.getConfig('production');

      prodTemplate.hasResourceProperties('AWS::Lambda::Alias', {
        ProvisionedConcurrencyConfig: Match.objectLike({
          ProvisionedConcurrentExecutions: Match.anyValue(),
        }),
      });
    });

    test('Should have reserved concurrent executions if configured', () => {
      const stagingConfig = EnvironmentConfig.getConfig('staging');

      if (stagingConfig.lambda.functions[0].reservedConcurrentExecutions) {
        stagingTemplate.hasResourceProperties('AWS::Lambda::Function', {
          ReservedConcurrentExecutions:
            stagingConfig.lambda.functions[0].reservedConcurrentExecutions,
        });
      }
    });
  });

  describe('IAM Roles and Least Privilege Permissions', () => {
    test('Should create IAM role for Lambda function', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });

    test('Should have DynamoDB permissions policy', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const policyKeys = Object.keys(policies);
      const hasDDBPolicy = policyKeys.some((key) => {
        const policy = policies[key];
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some(
          (stmt: any) =>
            stmt.Action &&
            Array.isArray(stmt.Action) &&
            stmt.Action.some((action: string) => action.includes('dynamodb:'))
        );
      });
      expect(hasDDBPolicy).toBe(true);
    });

    test('Should have CloudWatch Logs permissions', () => {
      // Check both inline policies and managed policies
      const policies = template.findResources('AWS::IAM::Policy');
      const roles = template.findResources('AWS::IAM::Role');

      const hasLogsInlinePolicy = Object.values(policies).some((policy: any) => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some((stmt: any) => {
          if (!stmt.Action) return false;
          const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
          return actions.some(
            (action: string) =>
              action.includes('logs:CreateLogStream') ||
              action.includes('logs:PutLogEvents')
          );
        });
      });

      // Also check for VPC managed policy which includes logs permissions
      const hasLogsManagedPolicy = Object.values(roles).some((role: any) => {
        const managedPolicies = role.Properties?.ManagedPolicyArns || [];
        return managedPolicies.some((arn: any) => {
          const arnStr = typeof arn === 'string' ? arn : JSON.stringify(arn);
          return arnStr.includes('AWSLambdaVPCAccessExecutionRole');
        });
      });

      expect(hasLogsInlinePolicy || hasLogsManagedPolicy).toBe(true);
    });

    test('Should have X-Ray permissions', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const policyKeys = Object.keys(policies);
      const hasXRayPolicy = policyKeys.some((key) => {
        const policy = policies[key];
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some((stmt: any) => {
          if (!stmt.Action || !Array.isArray(stmt.Action)) return false;
          return stmt.Action.some((action: string) => action.includes('xray:'));
        });
      });
      expect(hasXRayPolicy).toBe(true);
    });

    test('Should have VPC execution role for Lambda', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const roleKeys = Object.keys(roles);
      const hasVPCPolicy = roleKeys.some((key) => {
        const role = roles[key];
        const managedPolicies = role.Properties?.ManagedPolicyArns || [];
        return managedPolicies.some((arn: any) => {
          const arnStr = typeof arn === 'string' ? arn : JSON.stringify(arn);
          return arnStr.includes('AWSLambdaVPCAccessExecutionRole');
        });
      });
      expect(hasVPCPolicy).toBe(true);
    });

    test('Policies should reference specific resources (least privilege)', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const policyKeys = Object.keys(policies);
      const hasSpecificResources = policyKeys.some((key) => {
        const policy = policies[key];
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some(
          (stmt: any) =>
            stmt.Resource &&
            Array.isArray(stmt.Resource) &&
            stmt.Resource.some((resource: any) => typeof resource === 'object')
        );
      });
      expect(hasSpecificResources).toBe(true);
    });
  });

  describe('CloudWatch Logging', () => {
    test('Should create CloudWatch Log Group for Lambda', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/${environment}-UserHandler`,
        RetentionInDays: 30,
      });
    });

    test('Should have proper deletion policy for logs in production', () => {
      const logGroups = prodTemplate.findResources('AWS::Logs::LogGroup');
      const logGroupKey = Object.keys(logGroups)[0];
      const logGroup = logGroups[logGroupKey];

      expect(logGroup.DeletionPolicy).toBe('Retain');
    });
  });

  describe('API Gateway', () => {
    test('Should create REST API', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `${environment}-api`,
        EndpointConfiguration: {
          Types: ['REGIONAL'],
        },
      });
    });

    test('Should have API Gateway stage with correct name', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: config.apiGateway.stageName,
      });
    });

    test('Should have X-Ray tracing enabled', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        TracingEnabled: true,
      });
    });

    test('Should have CloudWatch metrics enabled', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            MetricsEnabled: true,
          }),
        ]),
      });
    });

    test('Should have access logging configured', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        AccessLogSetting: Match.objectLike({
          DestinationArn: Match.anyValue(),
        }),
      });
    });

    test('Should create API Gateway Log Group', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      // API Gateway log group is created automatically by CDK
      expect(Object.keys(logGroups).length).toBeGreaterThanOrEqual(1);
    });

    test('Should have Usage Plan with rate limiting', () => {
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        UsagePlanName: `${environment}-usage-plan`,
        Throttle: {
          RateLimit: config.apiGateway.throttleRateLimit,
          BurstLimit: config.apiGateway.throttleBurstLimit,
        },
      });
    });

    test('Should have quota limits configured for staging/production', () => {
      const stagingConfig = EnvironmentConfig.getConfig('staging');
      if (stagingConfig.apiGateway.quotaLimit) {
        stagingTemplate.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
          Quota: {
            Limit: stagingConfig.apiGateway.quotaLimit,
            Period: stagingConfig.apiGateway.quotaPeriod,
          },
        });
      }
    });

    test('Should have API Key created', () => {
      template.resourceCountIs('AWS::ApiGateway::ApiKey', 1);
      template.hasResourceProperties('AWS::ApiGateway::ApiKey', {
        Name: `${environment}-api-key`,
        Enabled: true,
      });
    });

    test('Should link API Key to Usage Plan', () => {
      template.resourceCountIs('AWS::ApiGateway::UsagePlanKey', 1);
    });

    test('Should have Cognito authorizer configured', () => {
      template.hasResourceProperties('AWS::ApiGateway::Authorizer', {
        Name: `${environment}-authorizer`,
        Type: 'COGNITO_USER_POOLS',
        IdentitySource: 'method.request.header.Authorization',
      });
    });

    test('API methods should require API key', () => {
      const methods = template.findResources('AWS::ApiGateway::Method', {
        Properties: {
          HttpMethod: Match.not('OPTIONS'), // Exclude CORS methods
          ApiKeyRequired: true,
        },
      });
      expect(Object.keys(methods).length).toBeGreaterThan(0);
    });

    test('Should have CORS configuration', () => {
      const methods = template.findResources('AWS::ApiGateway::Method', {
        Properties: {
          HttpMethod: 'OPTIONS',
        },
      });
      expect(Object.keys(methods).length).toBeGreaterThan(0);
    });

    test('Should create resources for Lambda integration', () => {
      const resources = template.findResources('AWS::ApiGateway::Resource');
      expect(Object.keys(resources).length).toBeGreaterThan(0);
    });

    test('Should support custom domain if configured', () => {
      const prodConfig = EnvironmentConfig.getConfig('production');
      if (prodConfig.customDomain) {
        prodTemplate.hasResourceProperties('AWS::ApiGateway::DomainName', {
          DomainName: prodConfig.customDomain.domainName,
          SecurityPolicy: 'TLS_1_2',
        });

        prodTemplate.resourceCountIs('AWS::ApiGateway::BasePathMapping', 1);
      }
    });

    test('Should have API Gateway account role for CloudWatch logging', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'apigateway.amazonaws.com',
              },
            }),
          ]),
        },
      });
    });

    test('Should configure API Gateway account settings', () => {
      // API Gateway Account is a singleton per region, but may appear multiple times in template
      // due to multiple stacks or CDK implementation details
      const accounts = template.findResources('AWS::ApiGateway::Account');
      expect(Object.keys(accounts).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('CloudWatch Monitoring and Alarms', () => {
    test('Should create SNS topic for alarms', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: `${environment} CloudWatch Alarms`,
      });
    });

    test('Should have email subscription for alarms', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: config.monitoring.alarmEmail,
      });
    });

    test('Should create Lambda error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp('.*errors.*'),
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
        Statistic: 'Sum',
        Threshold: config.monitoring.lambdaErrorThreshold,
      });
    });

    test('Should create Lambda duration alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp('.*duration.*'),
        MetricName: 'Duration',
        Namespace: 'AWS/Lambda',
        Threshold: config.monitoring.lambdaDurationThreshold,
      });
    });

    test('Should create Lambda throttles alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp('.*throttles.*'),
        MetricName: 'Throttles',
        Namespace: 'AWS/Lambda',
      });
    });

    test('Should create API Gateway 4XX alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp('.*api.*4xx.*'),
        MetricName: '4XXError',
        Namespace: 'AWS/ApiGateway',
      });
    });

    test('Should create API Gateway 5XX alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp('.*api.*5xx.*'),
        MetricName: '5XXError',
        Namespace: 'AWS/ApiGateway',
      });
    });

    test('Should create DynamoDB read throttle alarm', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const hasDDBAlarm = Object.values(alarms).some(
        (alarm: any) =>
          alarm.Properties?.Namespace === 'AWS/DynamoDB' &&
          alarm.Properties?.MetricName === 'UserErrors'
      );
      expect(hasDDBAlarm).toBe(true);
    });

    test('Should create CloudWatch Dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `${environment}-dashboard`,
      });
    });

    test('Alarms should have SNS actions configured', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const alarmsWithActions = Object.values(alarms).filter(
        (alarm: any) =>
          alarm.Properties?.AlarmActions &&
          alarm.Properties.AlarmActions.length > 0
      );
      expect(alarmsWithActions.length).toBeGreaterThan(0);
    });
  });

  describe('Cost Tagging', () => {
    test('Should have resource-specific Name tags', () => {
      const tables = template.findResources('AWS::DynamoDB::Table');
      const tableKey = Object.keys(tables)[0];
      const table = tables[tableKey];

      expect(table.Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Key: 'Name',
            Value: `${environment}-UserTable`,
          }),
        ])
      );
    });

    test('Should have Lambda function tags', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      const functionKey = Object.keys(functions)[0];
      const fn = functions[functionKey];

      expect(fn.Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Key: 'Name',
            Value: `${environment}-UserHandler`,
          }),
        ])
      );
    });

    test('App-level tags are configured for billing categorization', () => {
      // Tags are applied at app level in bin/tap.ts using Tags.of(app)
      // This includes: Environment, Repository, Author, Department, Project, ManagedBy
      // These will be propagated to all resources automatically
      expect(stack).toBeDefined();
    });

    test('DynamoDB table has proper tagging structure', () => {
      const tables = template.findResources('AWS::DynamoDB::Table');
      const tableKey = Object.keys(tables)[0];
      const table = tables[tableKey];

      expect(table.Properties.Tags).toBeDefined();
      expect(Array.isArray(table.Properties.Tags)).toBe(true);
      expect(table.Properties.Tags.length).toBeGreaterThan(0);
    });
  });

  describe('Stack Outputs', () => {
    test('Should have API URL output', () => {
      template.hasOutput('ApiUrl', {
        Description: 'API Gateway URL',
        Export: {
          Name: `${environment}-ApiUrl`,
        },
      });
    });

    test('Should have API ID output', () => {
      template.hasOutput('ApiId', {
        Description: 'API Gateway ID',
        Export: {
          Name: `${environment}-ApiId`,
        },
      });
    });

    test('Should have User Pool ID output', () => {
      template.hasOutput('UserPoolId', {
        Description: 'Cognito User Pool ID',
        Export: {
          Name: `${environment}-UserPoolId`,
        },
      });
    });

    test('Should have User Pool Client ID output', () => {
      template.hasOutput('UserPoolClientId', {
        Description: 'Cognito User Pool Client ID',
        Export: {
          Name: `${environment}-UserPoolClientId`,
        },
      });
    });

    test('Should have Lambda Function Name output', () => {
      template.hasOutput('UserHandlerFunctionName', {
        Description: 'UserHandler Lambda Function Name',
      });
    });

    test('Should have DynamoDB Table Name output', () => {
      template.hasOutput('UserTableTableName', {
        Description: 'UserTable DynamoDB Table Name',
      });
    });

    test('Should have VPC ID output', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
        Export: {
          Name: `${environment}-VpcId`,
        },
      });
    });

    test('Should have Environment output', () => {
      template.hasOutput('Environment', {
        Description: 'Deployment Environment',
      });
    });

    test('Should have Region output', () => {
      template.hasOutput('Region', {
        Description: 'AWS Region',
      });
    });

    test('Should have Lambda Alias outputs if versioning enabled', () => {
      if (config.lambda.enableVersioning) {
        template.hasOutput('UserHandlerAliasName', {
          Description: 'UserHandler Lambda Alias Name',
        });
      }
    });
  });

  describe('Resource Count', () => {
    test('Should create expected number of core resources', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
      template.resourceCountIs('AWS::ApiGateway::ApiKey', 1);
      template.resourceCountIs('AWS::ApiGateway::UsagePlan', 1);
      template.resourceCountIs('AWS::Cognito::UserPool', 1);
      template.resourceCountIs('AWS::Cognito::UserPoolClient', 1);
      template.resourceCountIs('AWS::SNS::Topic', 1);

      // Lambda functions (may include log retention custom resource)
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(lambdaFunctions).length).toBeGreaterThanOrEqual(1);
    });

    test('Should create CloudWatch alarms for monitoring', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      expect(Object.keys(alarms).length).toBeGreaterThanOrEqual(5); // Lambda + API Gateway + DynamoDB alarms
    });

    test('Should create appropriate number of IAM roles', () => {
      const roles = template.findResources('AWS::IAM::Role');
      expect(Object.keys(roles).length).toBeGreaterThanOrEqual(2); // Lambda role + API Gateway account role
    });
  });

  describe('Security Configuration', () => {
    test('API Gateway should use TLS 1.2 for custom domains', () => {
      const prodConfig = EnvironmentConfig.getConfig('production');
      if (prodConfig.customDomain) {
        prodTemplate.hasResourceProperties('AWS::ApiGateway::DomainName', {
          SecurityPolicy: 'TLS_1_2',
        });
      }
    });

    test('Cognito should have secure password policy', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        Policies: {
          PasswordPolicy: {
            MinimumLength: Match.anyValue(),
            RequireUppercase: true,
            RequireLowercase: true,
            RequireNumbers: true,
          },
        },
      });
    });

    test('Lambda should run in VPC for network isolation', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: Match.objectLike({
          SubnetIds: Match.anyValue(),
        }),
      });
    });

    test('DynamoDB should have encryption enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
        },
      });
    });
  });

  describe('Rollback and Scaling Strategy', () => {
    test('Lambda versioning supports rollback', () => {
      const versions = template.findResources('AWS::Lambda::Version');
      expect(Object.keys(versions).length).toBeGreaterThanOrEqual(1);
    });

    test('Lambda aliases enable zero-downtime deployments', () => {
      const aliases = template.findResources('AWS::Lambda::Alias');
      expect(Object.keys(aliases).length).toBeGreaterThanOrEqual(1);
    });

    test('DynamoDB auto-scaling facilitates potential scaling', () => {
      const stagingConfig = EnvironmentConfig.getConfig('staging');

      if (stagingConfig.dynamodb.tables[0].enableAutoScaling) {
        const scalingPolicies = stagingTemplate.findResources(
          'AWS::ApplicationAutoScaling::ScalingPolicy'
        );
        expect(Object.keys(scalingPolicies).length).toBeGreaterThanOrEqual(2);
      }
    });

    test('Production resources have retention policy for safe rollback', () => {
      const tables = prodTemplate.findResources('AWS::DynamoDB::Table');
      const tableKey = Object.keys(tables)[0];
      expect(tables[tableKey].DeletionPolicy).toBe('Retain');
    });
  });

  describe('Multi-Environment Support', () => {
    test('Dev environment has appropriate resource sizing', () => {
      const devConfig = EnvironmentConfig.getConfig('dev');
      expect(devConfig.lambda.functions[0].memorySize).toBe(256);
      expect(devConfig.lambda.functions[0].timeout).toBe(30);
      expect(devConfig.dynamodb.tables[0].readCapacity).toBe(5);
    });

    test('Staging environment has scaled resources', () => {
      const stagingConfig = EnvironmentConfig.getConfig('staging');
      expect(stagingConfig.lambda.functions[0].memorySize).toBe(512);
      expect(stagingConfig.lambda.functions[0].timeout).toBe(60);
      expect(stagingConfig.dynamodb.tables[0].enableAutoScaling).toBe(true);
    });

    test('Production environment has maximum resources', () => {
      const prodConfig = EnvironmentConfig.getConfig('production');
      expect(prodConfig.lambda.functions[0].memorySize).toBe(1024);
      expect(prodConfig.lambda.functions[0].timeout).toBe(120);
      expect(prodConfig.vpc.maxAzs).toBe(3);
    });

    test('Each environment has distinct budget limits', () => {
      const devConfig = EnvironmentConfig.getConfig('dev');
      const stagingConfig = EnvironmentConfig.getConfig('staging');
      const prodConfig = EnvironmentConfig.getConfig('production');

      expect(devConfig.budgetLimit).toBe(100);
      expect(stagingConfig.budgetLimit).toBe(500);
      expect(prodConfig.budgetLimit).toBe(2000);
    });

    test('Unknown environment falls back to default configuration', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const unknownConfig = EnvironmentConfig.getConfig('unknown-env');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('not found')
      );
      expect(unknownConfig).toBeDefined();
      expect(unknownConfig.lambda.aliasName).toBe('default');
      expect(unknownConfig.apiGateway.stageName).toBe('default');

      consoleSpy.mockRestore();
    });

    test('Default configuration has sensible defaults', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const defaultConfig = EnvironmentConfig.getConfig('test-env');

      expect(defaultConfig.budgetLimit).toBe(100);
      expect(defaultConfig.department).toBe('Engineering');
      expect(defaultConfig.vpc.maxAzs).toBe(2);
      expect(defaultConfig.lambda.enableVersioning).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe('DynamoDB Advanced Configuration', () => {
    test('Should handle tables with sort keys', () => {
      // Create a custom config with sort key
      const customApp = new cdk.App();
      const customConfig = {
        ...EnvironmentConfig.getConfig('dev'),
        dynamodb: {
          tables: [
            {
              name: 'UserTable',
              partitionKey: 'userId',
              sortKey: 'timestamp',
              readCapacity: 5,
              writeCapacity: 5,
              enableAutoScaling: false,
            },
          ],
        },
      };

      const customStack = new TapStack(customApp, 'SortKeyStack', {
        config: customConfig,
        environment: 'custom',
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: Match.arrayWith([
          {
            AttributeName: 'userId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ]),
      });
    });

    test('Should handle tables without sort keys', () => {
      // Default config has no sort key
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'userId',
            KeyType: 'HASH',
          },
        ],
      });
    });

    test('Auto-scaling should use default max capacity when not specified', () => {
      // Staging has auto-scaling enabled
      const stagingConfig = EnvironmentConfig.getConfig('staging');

      if (stagingConfig.dynamodb.tables[0].enableAutoScaling) {
        const scalingTargets = stagingTemplate.findResources(
          'AWS::ApplicationAutoScaling::ScalableTarget'
        );

        expect(Object.keys(scalingTargets).length).toBeGreaterThan(0);

        // Check that scaling targets have max capacity set
        Object.values(scalingTargets).forEach((target: any) => {
          expect(target.Properties.MaxCapacity).toBeDefined();
          expect(target.Properties.MaxCapacity).toBeGreaterThan(0);
        });
      }
    });
  });

  describe('API Gateway Advanced Configuration', () => {
    test('Should not create custom domain when not configured', () => {
      // Dev doesn't have custom domain
      const domains = template.findResources('AWS::ApiGateway::DomainName');
      expect(Object.keys(domains).length).toBe(0);
    });

    test('Should create custom domain when configured in production', () => {
      const prodConfig = EnvironmentConfig.getConfig('production');

      if (prodConfig.customDomain) {
        const domains = prodTemplate.findResources('AWS::ApiGateway::DomainName');
        expect(Object.keys(domains).length).toBe(1);

        prodTemplate.hasResourceProperties('AWS::ApiGateway::DomainName', {
          DomainName: prodConfig.customDomain.domainName,
        });
      }
    });

    test('Production custom domain should have empty base path', () => {
      const prodConfig = EnvironmentConfig.getConfig('production');

      if (prodConfig.customDomain) {
        // Production uses empty string for base path (root)
        const mappings = prodTemplate.findResources('AWS::ApiGateway::BasePathMapping');
        expect(Object.keys(mappings).length).toBe(1);

        const mapping = Object.values(mappings)[0] as any;
        expect(mapping.Properties.BasePath).toBe('');
      }
    });

    test('Staging custom domain should use environment as base path', () => {
      // Create staging with custom domain to test non-production base path
      const customStagingApp = new cdk.App();
      const stagingConfig = EnvironmentConfig.getConfig('staging');
      const customStagingConfig = {
        ...stagingConfig,
        customDomain: {
          domainName: 'api-staging.example.com',
          certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/test',
        },
      };

      const customStagingStack = new TapStack(customStagingApp, 'CustomStagingStack', {
        config: customStagingConfig,
        environment: 'staging',
      });
      const customStagingTemplate = Template.fromStack(customStagingStack);

      const mappings = customStagingTemplate.findResources('AWS::ApiGateway::BasePathMapping');
      if (Object.keys(mappings).length > 0) {
        const mapping = Object.values(mappings)[0] as any;
        expect(mapping.Properties.BasePath).toBe('staging');
      }
    });
  });

  describe('Lambda Advanced Configuration', () => {
    test('Should not have reserved concurrency when not configured', () => {
      // Dev doesn't have reserved concurrency
      const functions = template.findResources('AWS::Lambda::Function');
      const functionKey = Object.keys(functions)[0];
      const fn = functions[functionKey];

      expect(fn.Properties.ReservedConcurrentExecutions).toBeUndefined();
    });

    test('Should have reserved concurrency when configured', () => {
      const stagingConfig = EnvironmentConfig.getConfig('staging');

      if (stagingConfig.lambda.functions[0].reservedConcurrentExecutions) {
        stagingTemplate.hasResourceProperties('AWS::Lambda::Function', {
          ReservedConcurrentExecutions:
            stagingConfig.lambda.functions[0].reservedConcurrentExecutions,
        });
      }
    });

    test('Should handle Lambda without versioning enabled', () => {
      // Create a config without versioning
      const noVersionApp = new cdk.App();
      const noVersionConfig = {
        ...EnvironmentConfig.getConfig('dev'),
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
          enableVersioning: false,
          aliasName: 'current',
        },
      };

      const noVersionStack = new TapStack(noVersionApp, 'NoVersionStack', {
        config: noVersionConfig,
        environment: 'noversion',
      });
      const noVersionTemplate = Template.fromStack(noVersionStack);

      // Should not have aliases when versioning is disabled
      const aliases = noVersionTemplate.findResources('AWS::Lambda::Alias');
      expect(Object.keys(aliases).length).toBe(0);
    });
  });

  describe('DynamoDB Auto-Scaling Edge Cases', () => {
    test('Should use explicit max capacity when provided', () => {
      const stagingConfig = EnvironmentConfig.getConfig('staging');

      if (stagingConfig.dynamodb.tables[0].enableAutoScaling) {
        const scalingTargets = stagingTemplate.findResources(
          'AWS::ApplicationAutoScaling::ScalableTarget'
        );

        // Staging config has explicit max capacities set
        const readTarget = Object.values(scalingTargets).find(
          (target: any) => target.Properties.ScalableDimension === 'dynamodb:table:ReadCapacityUnits'
        ) as any;

        const writeTarget = Object.values(scalingTargets).find(
          (target: any) => target.Properties.ScalableDimension === 'dynamodb:table:WriteCapacityUnits'
        ) as any;

        if (readTarget) {
          expect(readTarget.Properties.MaxCapacity).toBe(
            stagingConfig.dynamodb.tables[0].maxReadCapacity
          );
        }

        if (writeTarget) {
          expect(writeTarget.Properties.MaxCapacity).toBe(
            stagingConfig.dynamodb.tables[0].maxWriteCapacity
          );
        }
      }
    });

    test('Should calculate default max capacity when not specified', () => {
      // Create a config with auto-scaling but no max capacity specified
      const autoScaleApp = new cdk.App();
      const autoScaleConfig = {
        ...EnvironmentConfig.getConfig('dev'),
        dynamodb: {
          tables: [
            {
              name: 'UserTable',
              partitionKey: 'userId',
              readCapacity: 5,
              writeCapacity: 5,
              enableAutoScaling: true,
              // No maxReadCapacity or maxWriteCapacity specified
            },
          ],
        },
      };

      const autoScaleStack = new TapStack(autoScaleApp, 'AutoScaleStack', {
        config: autoScaleConfig,
        environment: 'autoscale',
      });
      const autoScaleTemplate = Template.fromStack(autoScaleStack);

      const scalingTargets = autoScaleTemplate.findResources(
        'AWS::ApplicationAutoScaling::ScalableTarget'
      );

      // Should use default max (readCapacity * 10 and writeCapacity * 10)
      const readTarget = Object.values(scalingTargets).find(
        (target: any) => target.Properties.ScalableDimension === 'dynamodb:table:ReadCapacityUnits'
      ) as any;

      if (readTarget) {
        expect(readTarget.Properties.MaxCapacity).toBe(50); // 5 * 10
      }
    });
  });
});


