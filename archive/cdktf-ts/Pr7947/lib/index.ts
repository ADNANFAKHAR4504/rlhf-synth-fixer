import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { config } from './config/infrastructure-config';
import { SharedConstructs } from './shared-constructs';
import { PrimaryRegionStack } from './primary-region-stack';
import { SecondaryRegionStack } from './secondary-region-stack';
import { FailoverOrchestration } from './step-functions/failover-orchestration';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { CloudwatchEventRule } from '@cdktf/provider-aws/lib/cloudwatch-event-rule';
import { CloudwatchEventTarget } from '@cdktf/provider-aws/lib/cloudwatch-event-target';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { TerraformAsset, AssetType } from 'cdktf';
import * as path from 'path';

// Generate unique suffix to avoid resource naming conflicts
const uniqueSuffix = 'q8t3';

export class TradingPlatformStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const environmentSuffix = config.environmentSuffix;

    // AWS Providers for both regions
    const primaryProvider = new AwsProvider(this, 'aws-primary', {
      region: config.primaryRegion.region,
      alias: 'primary',
      defaultTags: [
        {
          tags: {
            Project: 'TradingPlatform',
            Environment: environmentSuffix,
            ManagedBy: 'CDKTF',
          },
        },
      ],
    });

    const secondaryProvider = new AwsProvider(this, 'aws-secondary', {
      region: config.secondaryRegion.region,
      alias: 'secondary',
      defaultTags: [
        {
          tags: {
            Project: 'TradingPlatform',
            Environment: environmentSuffix,
            ManagedBy: 'CDKTF',
          },
        },
      ],
    });

    // Shared Cross-Region Resources
    const sharedConstructs = new SharedConstructs(this, 'shared', {
      primaryProvider,
      secondaryProvider,
      environmentSuffix,
    });

    // Primary Region Stack
    const primaryStack = new PrimaryRegionStack(this, 'primary', {
      provider: primaryProvider,
      environmentSuffix,
      sharedConstructs,
      secondaryProvider,
    });

    // Secondary Region Stack
    const secondaryStack = new SecondaryRegionStack(this, 'secondary', {
      provider: secondaryProvider,
      environmentSuffix,
      sharedConstructs,
      primaryAuroraCluster: primaryStack.auroraCluster,
    });

    // Failover Validator Lambda (runs in primary region, validates both)
    const validatorRole = new IamRole(this, 'validator-role', {
      provider: primaryProvider,
      name: `failover-validator-role-${environmentSuffix}-${uniqueSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'lambda.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
    });

    new IamRolePolicy(this, 'validator-policy', {
      provider: primaryProvider,
      role: validatorRole.id,
      name: 'ValidatorPolicy',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: ['rds:DescribeDBClusters', 'rds:DescribeGlobalClusters'],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: ['route53:GetHealthCheckStatus'],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: ['cloudwatch:PutMetricData'],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: ['ssm:GetParameter'],
            Resource: `arn:aws:ssm:*:*:parameter/trading/${environmentSuffix}/*`,
          },
        ],
      }),
    });

    const validatorAsset = new TerraformAsset(this, 'validator-asset', {
      path: path.join(__dirname, 'lambda'),
      type: AssetType.ARCHIVE,
    });

    const failoverValidator = new LambdaFunction(this, 'failover-validator', {
      provider: primaryProvider,
      functionName: `failover-validator-${environmentSuffix}-${uniqueSuffix}`,
      role: validatorRole.arn,
      handler: 'failover-validator.handler',
      runtime: 'nodejs18.x',
      filename: validatorAsset.path,
      sourceCodeHash: validatorAsset.assetHash,
      timeout: 60,
      memorySize: 256,
      environment: {
        variables: {
          ENVIRONMENT_SUFFIX: environmentSuffix,
          PRIMARY_REGION: config.primaryRegion.region,
          SECONDARY_REGION: config.secondaryRegion.region,
        },
      },
      tags: {
        Name: `failover-validator-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Scheduled validation every hour
    const validationSchedule = new CloudwatchEventRule(
      this,
      'validation-schedule',
      {
        provider: primaryProvider,
        name: `failover-validation-schedule-${environmentSuffix}-${uniqueSuffix}`,
        description: 'Validate failover readiness every hour',
        scheduleExpression: config.failoverValidationSchedule,
      }
    );

    new CloudwatchEventTarget(this, 'validation-target', {
      provider: primaryProvider,
      rule: validationSchedule.name,
      targetId: `validation-target-${uniqueSuffix}`,
      arn: failoverValidator.arn,
    });

    new LambdaPermission(this, 'validation-permission', {
      provider: primaryProvider,
      statementId: 'AllowEventBridgeInvoke',
      action: 'lambda:InvokeFunction',
      functionName: failoverValidator.functionName,
      principal: 'events.amazonaws.com',
      sourceArn: validationSchedule.arn,
    });

    // Failover Orchestration
    const failoverOrchestration = new FailoverOrchestration(this, 'failover', {
      provider: primaryProvider,
      environmentSuffix,
      primaryClusterIdentifier: primaryStack.auroraCluster.clusterIdentifier,
      secondaryClusterIdentifier:
        secondaryStack.auroraCluster.clusterIdentifier,
      hostedZoneId: sharedConstructs.hostedZone.zoneId,
      primaryHealthCheckId: sharedConstructs.primaryHealthCheck.id,
      secondaryHealthCheckId: sharedConstructs.secondaryHealthCheck.id,
      failoverValidatorArn: failoverValidator.arn,
    });

    // Outputs
    new TerraformOutput(this, 'hosted-zone-id', {
      value: sharedConstructs.hostedZone.zoneId,
      description: 'Route 53 Hosted Zone ID',
    });

    new TerraformOutput(this, 'primary-api-endpoint', {
      value: `${primaryStack.api.id}.execute-api.${config.primaryRegion.region}.amazonaws.com/prod`,
      description: 'Primary Region API Endpoint',
    });

    new TerraformOutput(this, 'secondary-api-endpoint', {
      value: `${secondaryStack.api.id}.execute-api.${config.secondaryRegion.region}.amazonaws.com/prod`,
      description: 'Secondary Region API Endpoint',
    });

    new TerraformOutput(this, 'primary-db-endpoint', {
      value: primaryStack.auroraCluster.endpoint,
      description: 'Primary Aurora Cluster Endpoint',
    });

    new TerraformOutput(this, 'secondary-db-endpoint', {
      value: secondaryStack.auroraCluster.readerEndpoint,
      description: 'Secondary Aurora Cluster Endpoint',
    });

    new TerraformOutput(this, 'session-table-name', {
      value: sharedConstructs.sessionTable.name,
      description: 'DynamoDB Global Table Name',
    });

    new TerraformOutput(this, 'config-bucket', {
      value: sharedConstructs.configBucket.bucket,
      description: 'S3 Config Bucket',
    });

    new TerraformOutput(this, 'audit-log-bucket', {
      value: sharedConstructs.auditLogBucket.bucket,
      description: 'S3 Audit Log Bucket',
    });

    new TerraformOutput(this, 'failover-state-machine-arn', {
      value: failoverOrchestration.stateMachine.arn,
      description: 'Step Functions Failover State Machine ARN',
    });

    new TerraformOutput(this, 'failover-validator-arn', {
      value: failoverValidator.arn,
      description: 'Failover Validator Lambda ARN',
    });
  }
}
