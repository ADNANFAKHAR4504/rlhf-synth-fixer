import { Apigatewayv2Api } from '@cdktf/provider-aws/lib/apigatewayv2-api';
import { Apigatewayv2Integration } from '@cdktf/provider-aws/lib/apigatewayv2-integration';
import { Apigatewayv2Route } from '@cdktf/provider-aws/lib/apigatewayv2-route';
import { Apigatewayv2Stage } from '@cdktf/provider-aws/lib/apigatewayv2-stage';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { ElasticacheCluster } from '@cdktf/provider-aws/lib/elasticache-cluster';
import { ElasticacheSubnetGroup } from '@cdktf/provider-aws/lib/elasticache-subnet-group';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { RdsCluster } from '@cdktf/provider-aws/lib/rds-cluster';
import { RdsClusterInstance } from '@cdktf/provider-aws/lib/rds-cluster-instance';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { AssetType, TerraformAsset } from 'cdktf';
import { Construct } from 'constructs';
import * as path from 'path';

export interface HealthcareStackProps {
  environmentSuffix: string;
  awsRegion: string;
}

export class HealthcareStack extends Construct {
  constructor(scope: Construct, id: string, props: HealthcareStackProps) {
    super(scope, id);

    const { environmentSuffix, awsRegion } = props;

    // Get current AWS account ID
    const current = new DataAwsCallerIdentity(this, 'current', {});

    // KMS Key Policy Document for CloudWatch Logs access
    const kmsKeyPolicyDoc = new DataAwsIamPolicyDocument(this, 'KmsKeyPolicy', {
      statement: [
        {
          sid: 'EnableIAMUserPermissions',
          effect: 'Allow',
          principals: [
            {
              type: 'AWS',
              identifiers: [`arn:aws:iam::${current.accountId}:root`],
            },
          ],
          actions: ['kms:*'],
          resources: ['*'],
        },
        {
          sid: 'AllowCloudWatchLogsEncryption',
          effect: 'Allow',
          principals: [
            {
              type: 'Service',
              identifiers: [`logs.${awsRegion}.amazonaws.com`],
            },
          ],
          actions: [
            'kms:Encrypt',
            'kms:Decrypt',
            'kms:ReEncrypt*',
            'kms:GenerateDataKey*',
            'kms:DescribeKey',
            'kms:CreateGrant',
          ],
          resources: ['*'],
          condition: [
            {
              test: 'ArnEquals',
              variable: 'kms:EncryptionContext:aws:logs:arn',
              values: [
                `arn:aws:logs:${awsRegion}:${current.accountId}:log-group:/aws/apigateway/healthcare-${environmentSuffix}`,
              ],
            },
          ],
        },
      ],
    });

    // KMS Key for encryption at rest (HIPAA requirement)
    const kmsKey = new KmsKey(this, 'HealthcareKmsKey', {
      description: `KMS key for HIPAA compliance - ${environmentSuffix}`,
      enableKeyRotation: true,
      deletionWindowInDays: 7,
      policy: kmsKeyPolicyDoc.json,
      tags: {
        Name: `healthcare-kms-${environmentSuffix}`,
        Environment: environmentSuffix,
        Compliance: 'HIPAA',
      },
    });

    new KmsAlias(this, 'HealthcareKmsAlias', {
      name: `alias/healthcare-${environmentSuffix}`,
      targetKeyId: kmsKey.keyId,
    });

    // VPC for network isolation
    const vpc = new Vpc(this, 'HealthcareVpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `healthcare-vpc-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Internet Gateway for public subnets
    const igw = new InternetGateway(this, 'InternetGateway', {
      vpcId: vpc.id,
      tags: {
        Name: `healthcare-igw-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Public Subnets for API Gateway endpoints (2 AZs for HA)
    const publicSubnet1 = new Subnet(this, 'PublicSubnet1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: `${awsRegion}a`,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `healthcare-public-subnet-1-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    const publicSubnet2 = new Subnet(this, 'PublicSubnet2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: `${awsRegion}b`,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `healthcare-public-subnet-2-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Private Subnets for RDS and ElastiCache (2 AZs for HA)
    const privateSubnet1 = new Subnet(this, 'PrivateSubnet1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.10.0/24',
      availabilityZone: `${awsRegion}a`,
      tags: {
        Name: `healthcare-private-subnet-1-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    const privateSubnet2 = new Subnet(this, 'PrivateSubnet2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.11.0/24',
      availabilityZone: `${awsRegion}b`,
      tags: {
        Name: `healthcare-private-subnet-2-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Route Table for Public Subnets
    const publicRouteTable = new RouteTable(this, 'PublicRouteTable', {
      vpcId: vpc.id,
      tags: {
        Name: `healthcare-public-rt-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new Route(this, 'PublicRoute', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    new RouteTableAssociation(this, 'PublicSubnet1Association', {
      subnetId: publicSubnet1.id,
      routeTableId: publicRouteTable.id,
    });

    new RouteTableAssociation(this, 'PublicSubnet2Association', {
      subnetId: publicSubnet2.id,
      routeTableId: publicRouteTable.id,
    });

    // Security Group for Lambda functions
    const lambdaSg = new SecurityGroup(this, 'LambdaSecurityGroup', {
      name: `healthcare-lambda-sg-${environmentSuffix}`,
      description: 'Security group for Lambda functions',
      vpcId: vpc.id,
      tags: {
        Name: `healthcare-lambda-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new SecurityGroupRule(this, 'LambdaEgress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: lambdaSg.id,
    });

    // Security Group for RDS
    const rdsSg = new SecurityGroup(this, 'RdsSecurityGroup', {
      name: `healthcare-rds-sg-${environmentSuffix}`,
      description: 'Security group for RDS Aurora cluster',
      vpcId: vpc.id,
      tags: {
        Name: `healthcare-rds-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new SecurityGroupRule(this, 'RdsIngressFromLambda', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      sourceSecurityGroupId: lambdaSg.id,
      securityGroupId: rdsSg.id,
      description: 'Allow PostgreSQL access from Lambda',
    });

    // Security Group for ElastiCache
    const elasticacheSg = new SecurityGroup(this, 'ElasticacheSecurityGroup', {
      name: `healthcare-elasticache-sg-${environmentSuffix}`,
      description: 'Security group for ElastiCache Redis cluster',
      vpcId: vpc.id,
      tags: {
        Name: `healthcare-elasticache-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new SecurityGroupRule(this, 'ElasticacheIngressFromLambda', {
      type: 'ingress',
      fromPort: 6379,
      toPort: 6379,
      protocol: 'tcp',
      sourceSecurityGroupId: lambdaSg.id,
      securityGroupId: elasticacheSg.id,
      description: 'Allow Redis access from Lambda',
    });

    // DB Subnet Group for RDS
    const dbSubnetGroup = new DbSubnetGroup(this, 'RdsSubnetGroup', {
      name: `healthcare-db-subnet-group-${environmentSuffix}`,
      description: 'Subnet group for RDS Aurora cluster',
      subnetIds: [privateSubnet1.id, privateSubnet2.id],
      tags: {
        Name: `healthcare-db-subnet-group-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Secrets Manager for database credentials
    const dbSecret = new SecretsmanagerSecret(this, 'DatabaseSecret', {
      name: `healthcare-db-credentials-${environmentSuffix}`,
      description: 'Database credentials for HIPAA-compliant RDS cluster',
      kmsKeyId: kmsKey.keyId,
      tags: {
        Name: `healthcare-db-credentials-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new SecretsmanagerSecretVersion(this, 'DatabaseSecretVersion', {
      secretId: dbSecret.id,
      secretString: JSON.stringify({
        username: 'healthcareadmin',
        password: 'ChangeThisPassword123!',
        engine: 'postgres',
        port: 5432,
      }),
    });

    // RDS Aurora Serverless v2 Cluster (HIPAA compliant, encrypted, Multi-AZ)
    const rdsCluster = new RdsCluster(this, 'AuroraCluster', {
      clusterIdentifier: `healthcare-db-${environmentSuffix}`,
      engine: 'aurora-postgresql',
      engineMode: 'provisioned',
      engineVersion: '15.4',
      databaseName: 'healthcaredb',
      masterUsername: 'healthcareadmin',
      masterPassword: 'ChangeThisPassword123!',
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSg.id],
      storageEncrypted: true,
      kmsKeyId: kmsKey.arn,
      backupRetentionPeriod: 7,
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      enabledCloudwatchLogsExports: ['postgresql'],
      deletionProtection: false,
      skipFinalSnapshot: true,
      serverlessv2ScalingConfiguration: {
        minCapacity: 0.5,
        maxCapacity: 1,
      },
      tags: {
        Name: `healthcare-aurora-${environmentSuffix}`,
        Environment: environmentSuffix,
        Compliance: 'HIPAA',
      },
    });

    // RDS Cluster Instances (2 for Multi-AZ high availability)
    new RdsClusterInstance(this, 'AuroraInstance1', {
      identifier: `healthcare-db-instance-1-${environmentSuffix}`,
      clusterIdentifier: rdsCluster.id,
      instanceClass: 'db.serverless',
      engine: 'aurora-postgresql',
      engineVersion: '15.4',
      publiclyAccessible: false,
      tags: {
        Name: `healthcare-aurora-instance-1-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new RdsClusterInstance(this, 'AuroraInstance2', {
      identifier: `healthcare-db-instance-2-${environmentSuffix}`,
      clusterIdentifier: rdsCluster.id,
      instanceClass: 'db.serverless',
      engine: 'aurora-postgresql',
      engineVersion: '15.4',
      publiclyAccessible: false,
      tags: {
        Name: `healthcare-aurora-instance-2-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // ElastiCache Subnet Group
    const cacheSubnetGroup = new ElasticacheSubnetGroup(
      this,
      'ElasticacheSubnetGroup',
      {
        name: `healthcare-cache-subnet-group-${environmentSuffix}`,
        description: 'Subnet group for ElastiCache Redis cluster',
        subnetIds: [privateSubnet1.id, privateSubnet2.id],
        tags: {
          Name: `healthcare-cache-subnet-group-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      }
    );

    // ElastiCache Redis Cluster (encrypted for HIPAA compliance)
    const elasticacheCluster = new ElasticacheCluster(this, 'RedisCluster', {
      clusterId: `healthcare-cache-${environmentSuffix}`,
      engine: 'redis',
      engineVersion: '7.0',
      nodeType: 'cache.t4g.micro',
      numCacheNodes: 1,
      port: 6379,
      subnetGroupName: cacheSubnetGroup.name,
      securityGroupIds: [elasticacheSg.id],
      snapshotRetentionLimit: 5,
      snapshotWindow: '03:00-05:00',
      maintenanceWindow: 'sun:05:00-sun:07:00',
      tags: {
        Name: `healthcare-redis-${environmentSuffix}`,
        Environment: environmentSuffix,
        Compliance: 'HIPAA',
      },
    });

    // CloudWatch Log Group for API Gateway (audit logging for HIPAA)
    const apiLogGroup = new CloudwatchLogGroup(this, 'ApiGatewayLogGroup', {
      name: `/aws/apigateway/healthcare-${environmentSuffix}`,
      retentionInDays: 90,
      kmsKeyId: kmsKey.arn,
      tags: {
        Name: `healthcare-api-logs-${environmentSuffix}`,
        Environment: environmentSuffix,
        Compliance: 'HIPAA',
      },
    });

    // IAM Role for Lambda execution
    const lambdaRolePolicyDoc = new DataAwsIamPolicyDocument(
      this,
      'LambdaAssumeRolePolicy',
      {
        statement: [
          {
            actions: ['sts:AssumeRole'],
            principals: [
              {
                type: 'Service',
                identifiers: ['lambda.amazonaws.com'],
              },
            ],
          },
        ],
      }
    );

    const lambdaRole = new IamRole(this, 'LambdaExecutionRole', {
      name: `healthcare-lambda-role-${environmentSuffix}`,
      assumeRolePolicy: lambdaRolePolicyDoc.json,
      tags: {
        Name: `healthcare-lambda-role-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Attach AWS managed policies
    new IamRolePolicyAttachment(this, 'LambdaBasicExecution', {
      role: lambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    });

    new IamRolePolicyAttachment(this, 'LambdaVpcExecution', {
      role: lambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
    });

    // Custom IAM policy for Lambda to access Secrets Manager and KMS
    const lambdaPolicyDoc = new DataAwsIamPolicyDocument(
      this,
      'LambdaCustomPolicyDoc',
      {
        statement: [
          {
            effect: 'Allow',
            actions: ['secretsmanager:GetSecretValue'],
            resources: [dbSecret.arn],
          },
          {
            effect: 'Allow',
            actions: ['kms:Decrypt', 'kms:DescribeKey'],
            resources: [kmsKey.arn],
          },
        ],
      }
    );

    const lambdaCustomPolicy = new IamPolicy(this, 'LambdaCustomPolicy', {
      name: `healthcare-lambda-policy-${environmentSuffix}`,
      description: 'Custom policy for Lambda to access Secrets Manager and KMS',
      policy: lambdaPolicyDoc.json,
      tags: {
        Name: `healthcare-lambda-policy-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new IamRolePolicyAttachment(this, 'LambdaCustomPolicyAttachment', {
      role: lambdaRole.name,
      policyArn: lambdaCustomPolicy.arn,
    });

    // Lambda function for patient record processing
    const lambdaAsset = new TerraformAsset(this, 'LambdaAsset', {
      path: path.resolve(__dirname, '../lambda-code'),
      type: AssetType.ARCHIVE,
    });

    const processorLambda = new LambdaFunction(this, 'PatientRecordProcessor', {
      functionName: `healthcare-processor-${environmentSuffix}`,
      description: 'Processes patient records with HIPAA compliance',
      runtime: 'nodejs20.x',
      handler: 'index.handler',
      role: lambdaRole.arn,
      timeout: 30,
      memorySize: 512,
      filename: lambdaAsset.path,
      sourceCodeHash: lambdaAsset.assetHash,
      vpcConfig: {
        subnetIds: [privateSubnet1.id, privateSubnet2.id],
        securityGroupIds: [lambdaSg.id],
      },
      environment: {
        variables: {
          DB_SECRET_ARN: dbSecret.arn,
          REDIS_CLUSTER_ID: elasticacheCluster.clusterId,
          REDIS_PORT: '6379',
          ENVIRONMENT: environmentSuffix,
        },
      },
      tags: {
        Name: `healthcare-processor-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // API Gateway HTTP API
    const api = new Apigatewayv2Api(this, 'HealthcareApi', {
      name: `healthcare-api-${environmentSuffix}`,
      description: 'HIPAA-compliant healthcare data processing API',
      protocolType: 'HTTP',
      corsConfiguration: {
        allowOrigins: ['*'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
        maxAge: 300,
      },
      tags: {
        Name: `healthcare-api-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // API Gateway Stage with logging and throttling (rate limiting for HIPAA)
    new Apigatewayv2Stage(this, 'ApiStage', {
      apiId: api.id,
      name: 'prod',
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
        }),
      },
      defaultRouteSettings: {
        throttlingBurstLimit: 100,
        throttlingRateLimit: 50,
        detailedMetricsEnabled: true,
        loggingLevel: 'INFO',
      },
      tags: {
        Name: `healthcare-api-stage-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Lambda Integration
    const lambdaIntegration = new Apigatewayv2Integration(
      this,
      'LambdaIntegration',
      {
        apiId: api.id,
        integrationType: 'AWS_PROXY',
        integrationUri: processorLambda.arn,
        integrationMethod: 'POST',
        payloadFormatVersion: '2.0',
        timeoutMilliseconds: 30000,
      }
    );

    // API Routes
    new Apigatewayv2Route(this, 'PostPatientsRoute', {
      apiId: api.id,
      routeKey: 'POST /patients',
      target: `integrations/${lambdaIntegration.id}`,
    });

    new Apigatewayv2Route(this, 'GetPatientsRoute', {
      apiId: api.id,
      routeKey: 'GET /patients/{id}',
      target: `integrations/${lambdaIntegration.id}`,
    });

    // Lambda Permission for API Gateway
    new LambdaPermission(this, 'ApiGatewayLambdaPermission', {
      functionName: processorLambda.functionName,
      action: 'lambda:InvokeFunction',
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${api.executionArn}/*/*`,
    });
  }
}
