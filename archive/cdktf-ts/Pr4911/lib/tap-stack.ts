import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Route } from '@cdktf/provider-aws/lib/route';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { KmsKeyPolicy } from '@cdktf/provider-aws/lib/kms-key-policy';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { EcsCluster } from '@cdktf/provider-aws/lib/ecs-cluster';
import { EcsTaskDefinition } from '@cdktf/provider-aws/lib/ecs-task-definition';
import { EcsService } from '@cdktf/provider-aws/lib/ecs-service';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { Apigatewayv2Api } from '@cdktf/provider-aws/lib/apigatewayv2-api';
import { Apigatewayv2Stage } from '@cdktf/provider-aws/lib/apigatewayv2-stage';
import { Apigatewayv2Authorizer } from '@cdktf/provider-aws/lib/apigatewayv2-authorizer';
import { Apigatewayv2Integration } from '@cdktf/provider-aws/lib/apigatewayv2-integration';
import { Apigatewayv2Route } from '@cdktf/provider-aws/lib/apigatewayv2-route';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    // Get current AWS account ID
    const caller = new DataAwsCallerIdentity(this, 'current', {});

    // VPC Configuration
    const vpc = new Vpc(this, 'healthcare-vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `healthcare-vpc-${environmentSuffix}`,
        HIPAA: 'true',
      },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, 'healthcare-igw', {
      vpcId: vpc.id,
      tags: {
        Name: `healthcare-igw-${environmentSuffix}`,
      },
    });

    // Public Subnets (for ECS tasks with public IPs)
    const publicSubnet1 = new Subnet(this, 'public-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: `${awsRegion}a`,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `public-subnet-1-${environmentSuffix}`,
      },
    });

    const publicSubnet2 = new Subnet(this, 'public-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: `${awsRegion}b`,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `public-subnet-2-${environmentSuffix}`,
      },
    });

    // Private Subnets (for RDS)
    const privateSubnet1 = new Subnet(this, 'private-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.11.0/24',
      availabilityZone: `${awsRegion}a`,
      tags: {
        Name: `private-subnet-1-${environmentSuffix}`,
      },
    });

    const privateSubnet2 = new Subnet(this, 'private-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.12.0/24',
      availabilityZone: `${awsRegion}b`,
      tags: {
        Name: `private-subnet-2-${environmentSuffix}`,
      },
    });

    // Route Table for Public Subnets
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: vpc.id,
      tags: {
        Name: `public-route-table-${environmentSuffix}`,
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    new RouteTableAssociation(this, 'public-subnet-1-association', {
      subnetId: publicSubnet1.id,
      routeTableId: publicRouteTable.id,
    });

    new RouteTableAssociation(this, 'public-subnet-2-association', {
      subnetId: publicSubnet2.id,
      routeTableId: publicRouteTable.id,
    });

    // KMS Keys for Encryption
    const rdsKmsKey = new KmsKey(this, 'rds-kms-key', {
      description: 'KMS key for RDS encryption',
      enableKeyRotation: true,
      deletionWindowInDays: 10,
      tags: {
        Name: `rds-kms-key-${environmentSuffix}`,
        HIPAA: 'true',
      },
    });

    new KmsAlias(this, 'rds-kms-alias', {
      name: `alias/rds-${environmentSuffix}`,
      targetKeyId: rdsKmsKey.keyId,
    });

    const secretsKmsKey = new KmsKey(this, 'secrets-kms-key', {
      description: 'KMS key for Secrets Manager encryption',
      enableKeyRotation: true,
      deletionWindowInDays: 10,
      tags: {
        Name: `secrets-kms-key-${environmentSuffix}`,
        HIPAA: 'true',
      },
    });

    new KmsAlias(this, 'secrets-kms-alias', {
      name: `alias/secrets-${environmentSuffix}`,
      targetKeyId: secretsKmsKey.keyId,
    });

    const logsKmsKey = new KmsKey(this, 'logs-kms-key', {
      description: 'KMS key for CloudWatch Logs encryption',
      enableKeyRotation: true,
      deletionWindowInDays: 10,
      tags: {
        Name: `logs-kms-key-${environmentSuffix}`,
        HIPAA: 'true',
      },
    });

    new KmsAlias(this, 'logs-kms-alias', {
      name: `alias/logs-${environmentSuffix}`,
      targetKeyId: logsKmsKey.keyId,
    });

    // KMS Key Policy for CloudWatch Logs
    new KmsKeyPolicy(this, 'logs-kms-key-policy', {
      keyId: logsKmsKey.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${caller.accountId}:root`,
            },
            Action: 'kms:*',
            Resource: '*',
          },
          {
            Sid: 'Allow CloudWatch Logs',
            Effect: 'Allow',
            Principal: {
              Service: `logs.${awsRegion}.amazonaws.com`,
            },
            Action: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:CreateGrant',
              'kms:DescribeKey',
            ],
            Resource: '*',
            Condition: {
              ArnLike: {
                'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${awsRegion}:${caller.accountId}:*`,
              },
            },
          },
        ],
      }),
    });

    // CloudWatch Log Groups
    const apiLogGroup = new CloudwatchLogGroup(this, 'api-log-group', {
      name: `/aws/apigateway/healthcare-${environmentSuffix}`,
      retentionInDays: 90,
      kmsKeyId: logsKmsKey.arn,
      tags: {
        Name: `api-log-group-${environmentSuffix}`,
        HIPAA: 'true',
      },
    });

    const ecsLogGroup = new CloudwatchLogGroup(this, 'ecs-log-group', {
      name: `/aws/ecs/healthcare-${environmentSuffix}`,
      retentionInDays: 90,
      kmsKeyId: logsKmsKey.arn,
      tags: {
        Name: `ecs-log-group-${environmentSuffix}`,
        HIPAA: 'true',
      },
    });

    // Secrets Manager for Database Credentials
    const dbCredentialsSecret = new SecretsmanagerSecret(
      this,
      'db-credentials',
      {
        name: `healthcare-db-credentials-${environmentSuffix}`,
        description: 'Database credentials for healthcare application',
        kmsKeyId: secretsKmsKey.id,
        recoveryWindowInDays: 7,
        tags: {
          Name: `db-credentials-${environmentSuffix}`,
          HIPAA: 'true',
        },
      }
    );

    new SecretsmanagerSecretVersion(this, 'db-credentials-version', {
      secretId: dbCredentialsSecret.id,
      secretString: JSON.stringify({
        username: 'healthcareapp',
        password: 'ChangeMe123!',
        engine: 'postgres',
        port: 5432,
      }),
    });

    // Security Groups
    const rdsSecurityGroup = new SecurityGroup(this, 'rds-security-group', {
      name: `rds-sg-${environmentSuffix}`,
      description: 'Security group for RDS instance',
      vpcId: vpc.id,
      tags: {
        Name: `rds-sg-${environmentSuffix}`,
      },
    });

    const ecsSecurityGroup = new SecurityGroup(this, 'ecs-security-group', {
      name: `ecs-sg-${environmentSuffix}`,
      description: 'Security group for ECS tasks',
      vpcId: vpc.id,
      tags: {
        Name: `ecs-sg-${environmentSuffix}`,
      },
    });

    // Allow ECS to access RDS
    new SecurityGroupRule(this, 'rds-ingress-from-ecs', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      sourceSecurityGroupId: ecsSecurityGroup.id,
      securityGroupId: rdsSecurityGroup.id,
      description: 'Allow PostgreSQL access from ECS',
    });

    // Allow ECS egress to RDS
    new SecurityGroupRule(this, 'ecs-egress-to-rds', {
      type: 'egress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      sourceSecurityGroupId: rdsSecurityGroup.id,
      securityGroupId: ecsSecurityGroup.id,
      description: 'Allow ECS to connect to RDS',
    });

    // Allow ECS egress to internet (HTTPS)
    new SecurityGroupRule(this, 'ecs-egress-https', {
      type: 'egress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: ecsSecurityGroup.id,
      description: 'Allow HTTPS egress',
    });

    // DB Subnet Group
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `healthcare-db-subnet-group-${environmentSuffix}`,
      subnetIds: [privateSubnet1.id, privateSubnet2.id],
      description: 'Subnet group for healthcare RDS instance',
      tags: {
        Name: `db-subnet-group-${environmentSuffix}`,
      },
    });

    // RDS Instance with encryption
    const rdsInstance = new DbInstance(this, 'healthcare-rds', {
      identifier: `healthcare-db-${environmentSuffix}`,
      engine: 'postgres',
      engineVersion: '16.3',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      storageType: 'gp3',
      storageEncrypted: true,
      kmsKeyId: rdsKmsKey.arn,
      dbName: 'healthcaredb',
      username: 'healthcareapp',
      password: 'ChangeMe123!',
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      publiclyAccessible: false,
      skipFinalSnapshot: true,
      backupRetentionPeriod: 7,
      multiAz: false,
      enabledCloudwatchLogsExports: ['postgresql', 'upgrade'],
      deletionProtection: false,
      tags: {
        Name: `healthcare-rds-${environmentSuffix}`,
        HIPAA: 'true',
      },
    });

    // IAM Role for ECS Task Execution
    const ecsExecutionRole = new IamRole(this, 'ecs-execution-role', {
      name: `ecs-execution-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'ecs-tasks.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `ecs-execution-role-${environmentSuffix}`,
      },
    });

    new IamRolePolicyAttachment(this, 'ecs-execution-policy-attachment', {
      role: ecsExecutionRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    });

    // IAM Policy for Secrets Manager access
    const secretsAccessPolicy = new IamPolicy(this, 'secrets-access-policy', {
      name: `secrets-access-policy-${environmentSuffix}`,
      description: 'Policy for accessing Secrets Manager',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['secretsmanager:GetSecretValue'],
            Resource: dbCredentialsSecret.arn,
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt'],
            Resource: secretsKmsKey.arn,
          },
        ],
      }),
      tags: {
        Name: `secrets-access-policy-${environmentSuffix}`,
      },
    });

    new IamRolePolicyAttachment(this, 'secrets-policy-attachment', {
      role: ecsExecutionRole.name,
      policyArn: secretsAccessPolicy.arn,
    });

    // IAM Role for ECS Task
    const ecsTaskRole = new IamRole(this, 'ecs-task-role', {
      name: `ecs-task-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'ecs-tasks.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `ecs-task-role-${environmentSuffix}`,
      },
    });

    // IAM Policy for CloudWatch Logs
    const cloudwatchLogsPolicy = new IamPolicy(this, 'cloudwatch-logs-policy', {
      name: `cloudwatch-logs-policy-${environmentSuffix}`,
      description: 'Policy for writing to CloudWatch Logs',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:CreateLogGroup',
            ],
            Resource: `${ecsLogGroup.arn}:*`,
          },
        ],
      }),
      tags: {
        Name: `cloudwatch-logs-policy-${environmentSuffix}`,
      },
    });

    new IamRolePolicyAttachment(this, 'ecs-task-logs-attachment', {
      role: ecsTaskRole.name,
      policyArn: cloudwatchLogsPolicy.arn,
    });

    // ECS Cluster
    const ecsCluster = new EcsCluster(this, 'healthcare-ecs-cluster', {
      name: `healthcare-cluster-${environmentSuffix}`,
      setting: [
        {
          name: 'containerInsights',
          value: 'enabled',
        },
      ],
      tags: {
        Name: `healthcare-cluster-${environmentSuffix}`,
        HIPAA: 'true',
      },
    });

    // ECS Task Definition
    const taskDefinition = new EcsTaskDefinition(
      this,
      'healthcare-task-definition',
      {
        family: `healthcare-task-${environmentSuffix}`,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: '256',
        memory: '512',
        executionRoleArn: ecsExecutionRole.arn,
        taskRoleArn: ecsTaskRole.arn,
        containerDefinitions: JSON.stringify([
          {
            name: 'healthcare-processor',
            image: 'public.ecr.aws/docker/library/nginx:alpine',
            essential: true,
            portMappings: [
              {
                containerPort: 80,
                protocol: 'tcp',
              },
            ],
            logConfiguration: {
              logDriver: 'awslogs',
              options: {
                'awslogs-group': ecsLogGroup.name,
                'awslogs-region': awsRegion,
                'awslogs-stream-prefix': 'healthcare',
              },
            },
            environment: [
              {
                name: 'DB_HOST',
                value: rdsInstance.address,
              },
              {
                name: 'DB_PORT',
                value: '5432',
              },
            ],
            secrets: [
              {
                name: 'DB_CREDENTIALS',
                valueFrom: dbCredentialsSecret.arn,
              },
            ],
          },
        ]),
        tags: {
          Name: `healthcare-task-${environmentSuffix}`,
          HIPAA: 'true',
        },
      }
    );

    // ECS Service
    new EcsService(this, 'healthcare-ecs-service', {
      name: `healthcare-service-${environmentSuffix}`,
      cluster: ecsCluster.id,
      taskDefinition: taskDefinition.arn,
      desiredCount: 1,
      launchType: 'FARGATE',
      networkConfiguration: {
        subnets: [publicSubnet1.id, publicSubnet2.id],
        securityGroups: [ecsSecurityGroup.id],
        assignPublicIp: true,
      },
      tags: {
        Name: `healthcare-service-${environmentSuffix}`,
        HIPAA: 'true',
      },
    });

    // Lambda Function for OAuth2 Authorizer
    const authorizerRole = new IamRole(this, 'authorizer-role', {
      name: `api-authorizer-role-${environmentSuffix}`,
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
      tags: {
        Name: `api-authorizer-role-${environmentSuffix}`,
      },
    });

    new IamRolePolicyAttachment(this, 'authorizer-basic-execution', {
      role: authorizerRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    });

    const authorizerFunction = new LambdaFunction(this, 'authorizer-lambda', {
      functionName: `healthcare-authorizer-${environmentSuffix}`,
      runtime: 'nodejs20.x',
      handler: 'index.handler',
      role: authorizerRole.arn,
      filename: '${path.module}/../../../lambda.zip',
      sourceCodeHash:
        '${filebase64sha256("${path.module}/../../../lambda.zip")}',
      environment: {
        variables: {
          ENVIRONMENT: environmentSuffix,
        },
      },
      tags: {
        Name: `authorizer-lambda-${environmentSuffix}`,
        HIPAA: 'true',
      },
    });

    // API Gateway HTTP API
    const api = new Apigatewayv2Api(this, 'healthcare-api', {
      name: `healthcare-api-${environmentSuffix}`,
      protocolType: 'HTTP',
      corsConfiguration: {
        allowOrigins: ['*'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Authorization', 'Content-Type'],
        maxAge: 300,
      },
      tags: {
        Name: `healthcare-api-${environmentSuffix}`,
        HIPAA: 'true',
      },
    });

    // API Gateway Authorizer
    const authorizer = new Apigatewayv2Authorizer(
      this,
      'healthcare-authorizer',
      {
        apiId: api.id,
        authorizerType: 'REQUEST',
        authorizerUri: authorizerFunction.invokeArn,
        identitySources: ['$request.header.Authorization'],
        name: `oauth2-authorizer-${environmentSuffix}`,
        authorizerPayloadFormatVersion: '2.0',
        enableSimpleResponses: true,
      }
    );

    // Lambda Permission for API Gateway
    new LambdaPermission(this, 'api-gateway-lambda-permission', {
      statementId: 'AllowAPIGatewayInvoke',
      action: 'lambda:InvokeFunction',
      functionName: authorizerFunction.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${api.executionArn}/*/*`,
    });

    // API Gateway Integration (placeholder for ECS backend)
    const integration = new Apigatewayv2Integration(
      this,
      'healthcare-integration',
      {
        apiId: api.id,
        integrationType: 'HTTP_PROXY',
        integrationUri: 'https://example.com',
        integrationMethod: 'ANY',
        payloadFormatVersion: '1.0',
      }
    );

    // API Gateway Route
    new Apigatewayv2Route(this, 'healthcare-route', {
      apiId: api.id,
      routeKey: 'ANY /patients/{proxy+}',
      target: `integrations/${integration.id}`,
      authorizationType: 'CUSTOM',
      authorizerId: authorizer.id,
    });

    // API Gateway Stage with logging
    const apiStage = new Apigatewayv2Stage(this, 'healthcare-api-stage', {
      apiId: api.id,
      name: environmentSuffix,
      autoDeploy: true,
      accessLogSettings: {
        destinationArn: apiLogGroup.arn,
        format: JSON.stringify({
          requestId: '$context.requestId',
          ip: '$context.identity.sourceIp',
          requestTime: '$context.requestTime',
          httpMethod: '$context.httpMethod',
          routeKey: '$context.routeKey',
          status: '$context.status',
          protocol: '$context.protocol',
          responseLength: '$context.responseLength',
          authorizerError: '$context.authorizer.error',
        }),
      },
      tags: {
        Name: `healthcare-api-stage-${environmentSuffix}`,
        HIPAA: 'true',
      },
    });

    // Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsInstance.endpoint,
      description: 'RDS endpoint',
      sensitive: true,
    });

    new TerraformOutput(this, 'ecs-cluster-name', {
      value: ecsCluster.name,
      description: 'ECS Cluster name',
    });

    new TerraformOutput(this, 'api-endpoint', {
      value: apiStage.invokeUrl,
      description: 'API Gateway endpoint URL',
    });

    new TerraformOutput(this, 'db-credentials-secret-arn', {
      value: dbCredentialsSecret.arn,
      description: 'ARN of the database credentials secret',
      sensitive: true,
    });
  }
}
