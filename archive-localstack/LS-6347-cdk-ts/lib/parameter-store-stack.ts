import * as cdk from 'aws-cdk-lib';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface ParameterStoreStackProps {
  environmentSuffix: string;
  region: string;
  isPrimary: boolean;
}

export class ParameterStoreStack extends Construct {
  constructor(scope: Construct, id: string, props: ParameterStoreStackProps) {
    super(scope, id);

    const { environmentSuffix, region, isPrimary } = props;

    // Create sample parameters
    const appConfigParam = new ssm.StringParameter(this, 'AppConfigParam', {
      parameterName: `/TapStack${environmentSuffix}/app/config`,
      stringValue: JSON.stringify({
        region,
        environment: 'production',
        features: {
          enableLogging: true,
          enableMetrics: true,
          enableTracing: true,
        },
      }),
      description: 'Application configuration parameters',
      tier: ssm.ParameterTier.STANDARD,
    });

    const dbConfigParam = new ssm.StringParameter(this, 'DBConfigParam', {
      parameterName: `/TapStack${environmentSuffix}/db/config`,
      stringValue: JSON.stringify({
        maxConnections: 100,
        timeout: 30,
        retryAttempts: 3,
      }),
      description: 'Database configuration parameters',
      tier: ssm.ParameterTier.STANDARD,
    });

    // Secure parameter for sensitive data
    new ssm.StringParameter(this, 'APIKeyParam', {
      parameterName: `/TapStack${environmentSuffix}/api/key`,
      stringValue: 'placeholder-api-key',
      description: 'API Key (encrypted)',
      tier: ssm.ParameterTier.STANDARD,
    });

    // Cross-region replication (only in primary)
    if (isPrimary) {
      const replicationFunction = new lambda.Function(
        this,
        'ParameterReplicationFunction',
        {
          functionName: `TapStack${environmentSuffix}ParamReplication`,
          runtime: lambda.Runtime.NODEJS_20_X,
          handler: 'index.handler',
          code: lambda.Code.fromInline(`
const { SSMClient, GetParameterCommand, PutParameterCommand } = require('@aws-sdk/client-ssm');

exports.handler = async (event) => {
    console.log('Parameter change event:', JSON.stringify(event));

    const sourceRegion = process.env.SOURCE_REGION;
    const targetRegion = process.env.TARGET_REGION;
    const parameterName = event.detail.name;

    const sourceClient = new SSMClient({ region: sourceRegion });
    const targetClient = new SSMClient({ region: targetRegion });

    try {
        // Get parameter from source region
        const getCommand = new GetParameterCommand({
            Name: parameterName,
            WithDecryption: true
        });
        const sourceParam = await sourceClient.send(getCommand);

        // Put parameter in target region
        const putCommand = new PutParameterCommand({
            Name: parameterName,
            Value: sourceParam.Parameter.Value,
            Type: sourceParam.Parameter.Type,
            Overwrite: true,
            Description: sourceParam.Parameter.Description || 'Replicated from ' + sourceRegion
        });
        await targetClient.send(putCommand);

        console.log('Parameter replicated successfully');
        return { statusCode: 200, body: 'Success' };
    } catch (error) {
        console.error('Replication error:', error);
        throw error;
    }
};
        `),
          environment: {
            SOURCE_REGION: region,
            TARGET_REGION: 'us-east-2',
          },
          timeout: cdk.Duration.seconds(60),
          logRetention: logs.RetentionDays.ONE_WEEK,
        }
      );

      // Grant permissions
      replicationFunction.addToRolePolicy(
        new iam.PolicyStatement({
          actions: [
            'ssm:GetParameter',
            'ssm:GetParameters',
            'ssm:PutParameter',
          ],
          resources: ['*'],
        })
      );

      replicationFunction.addToRolePolicy(
        new iam.PolicyStatement({
          actions: ['kms:Decrypt', 'kms:Encrypt'],
          resources: ['*'],
        })
      );

      // EventBridge rule for parameter changes
      const parameterChangeRule = new events.Rule(this, 'ParameterChangeRule', {
        ruleName: `TapStack${environmentSuffix}ParameterChange`,
        description: 'Trigger replication when parameters change',
        eventPattern: {
          source: ['aws.ssm'],
          detailType: ['Parameter Store Change'],
          detail: {
            name: [{ prefix: `/TapStack${environmentSuffix}/` }],
          },
        },
      });

      parameterChangeRule.addTarget(
        new targets.LambdaFunction(replicationFunction)
      );

      new cdk.CfnOutput(this, 'ReplicationFunctionArn', {
        value: replicationFunction.functionArn,
        description: 'Parameter Replication Function ARN',
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'AppConfigParameterName', {
      value: appConfigParam.parameterName,
      description: 'Application Config Parameter Name',
    });

    new cdk.CfnOutput(this, 'DBConfigParameterName', {
      value: dbConfigParam.parameterName,
      description: 'Database Config Parameter Name',
    });
  }
}
