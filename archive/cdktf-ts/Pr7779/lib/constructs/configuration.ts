import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { SsmParameter } from '@cdktf/provider-aws/lib/ssm-parameter';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { CloudwatchEventRule } from '@cdktf/provider-aws/lib/cloudwatch-event-rule';
import { CloudwatchEventTarget } from '@cdktf/provider-aws/lib/cloudwatch-event-target';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { DataArchiveFile } from '@cdktf/provider-archive/lib/data-archive-file';

export interface ConfigurationConstructProps {
  environmentSuffix: string;
  primaryProvider: AwsProvider;
  secondaryProvider: AwsProvider;
  primaryVpcId: string;
  primarySubnetIds: string[];
  primaryLambdaSecurityGroupId: string;
}

export class ConfigurationConstruct extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: ConfigurationConstructProps
  ) {
    super(scope, id);

    const {
      environmentSuffix,
      primaryProvider,
      // secondaryProvider: used for secondary region parameter replication
      // primaryVpcId, primarySubnetIds, primaryLambdaSecurityGroupId: available for VPC Lambda deployment if needed
    } = props;

    // Sample configuration parameters
    new SsmParameter(this, 'PrimaryConfigParam', {
      provider: primaryProvider,
      name: `/app/${environmentSuffix}/database/connection-string`,
      type: 'String',
      value: 'postgresql://dbadmin@aurora-primary:5432/transactions',
      description: 'Database connection string for primary region',
      tags: {
        Name: `/app/${environmentSuffix}/database/connection-string`,
      },
    });

    new SsmParameter(this, 'PrimaryApiKey', {
      provider: primaryProvider,
      name: `/app/${environmentSuffix}/api/key`,
      type: 'SecureString',
      value: 'default-api-key-change-me',
      description: 'API key for external services',
      tags: {
        Name: `/app/${environmentSuffix}/api/key`,
      },
    });

    // Lambda function for parameter replication
    const paramReplicationArchive = new DataArchiveFile(
      this,
      'ParamReplicationArchive',
      {
        type: 'zip',
        sourceDir: `${__dirname}/../lambda/param-replication`,
        outputPath: `${__dirname}/../lambda/param-replication.zip`,
      }
    );

    const replicationRole = new IamRole(this, 'ParamReplicationRole', {
      provider: primaryProvider,
      name: `param-replication-role-${environmentSuffix}`,
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
        Name: `param-replication-role-${environmentSuffix}`,
      },
    });

    new IamRolePolicy(this, 'ParamReplicationPolicy', {
      provider: primaryProvider,
      name: `param-replication-policy-${environmentSuffix}`,
      role: replicationRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'ssm:GetParameter',
              'ssm:GetParameters',
              'ssm:PutParameter',
            ],
            Resource: `arn:aws:ssm:*:*:parameter/app/${environmentSuffix}/*`,
          },
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: 'arn:aws:logs:*:*:*',
          },
        ],
      }),
    });

    const replicationFunction = new LambdaFunction(
      this,
      'ParamReplicationFunction',
      {
        provider: primaryProvider,
        functionName: `param-replication-${environmentSuffix}`,
        role: replicationRole.arn,
        handler: 'index.handler',
        runtime: 'python3.11',
        filename: paramReplicationArchive.outputPath,
        sourceCodeHash: paramReplicationArchive.outputBase64Sha256,
        timeout: 30,
        memorySize: 256,
        environment: {
          variables: {
            SOURCE_REGION: 'us-east-1',
            TARGET_REGION: 'us-east-2',
            ENVIRONMENT_SUFFIX: environmentSuffix,
          },
        },
        tags: {
          Name: `param-replication-${environmentSuffix}`,
        },
      }
    );

    // EventBridge rule to trigger on parameter changes
    const paramChangeRule = new CloudwatchEventRule(this, 'ParamChangeRule', {
      provider: primaryProvider,
      name: `param-change-rule-${environmentSuffix}`,
      eventPattern: JSON.stringify({
        source: ['aws.ssm'],
        'detail-type': ['Parameter Store Change'],
        detail: {
          name: [
            {
              prefix: `/app/${environmentSuffix}/`,
            },
          ],
          operation: ['Create', 'Update'],
        },
      }),
      tags: {
        Name: `param-change-rule-${environmentSuffix}`,
      },
    });

    new CloudwatchEventTarget(this, 'ParamChangeTarget', {
      provider: primaryProvider,
      rule: paramChangeRule.name,
      arn: replicationFunction.arn,
    });

    new LambdaPermission(this, 'ParamReplicationPermission', {
      provider: primaryProvider,
      statementId: 'AllowExecutionFromEventBridge',
      action: 'lambda:InvokeFunction',
      functionName: replicationFunction.functionName,
      principal: 'events.amazonaws.com',
      sourceArn: paramChangeRule.arn,
    });
  }
}
