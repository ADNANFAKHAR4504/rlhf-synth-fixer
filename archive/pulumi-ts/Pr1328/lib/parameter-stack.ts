import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { RdsStack } from './rds-stack';

export interface ParameterStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  rdsStack: RdsStack;
  dbUsername: string;
  dbPassword: string;
}

export class ParameterStack extends pulumi.ComponentResource {
  public readonly dbEndpointParam: aws.ssm.Parameter;
  public readonly dbUsernameParam: aws.ssm.Parameter;
  public readonly dbPasswordParam: aws.ssm.Parameter;
  public readonly dbNameParam: aws.ssm.Parameter;

  constructor(
    name: string,
    args: ParameterStackArgs,
    opts?: pulumi.ResourceOptions
  ) {
    super('tap:parameter:ParameterStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';

    // Store RDS endpoint in Parameter Store
    this.dbEndpointParam = new aws.ssm.Parameter(
      `tap-db-endpoint-param-${environmentSuffix}`,
      {
        name: `/tap/${environmentSuffix}/database/endpoint`,
        type: 'String',
        value: args.rdsStack.dbEndpoint,
        description: 'RDS database endpoint',
        // 2024 feature: Enhanced secret rotation capabilities
        tier: 'Standard',
        allowedPattern: '^[a-zA-Z0-9\\.:-]+$',
        tags: {
          Name: `tap-db-endpoint-param-${environmentSuffix}`,
          Component: 'Database',
          ...(args.tags as any),
        },
      },
      { parent: this }
    );

    // Store database username in Parameter Store
    this.dbUsernameParam = new aws.ssm.Parameter(
      `tap-db-username-param-${environmentSuffix}`,
      {
        name: `/tap/${environmentSuffix}/database/username`,
        type: 'String',
        value: args.dbUsername,
        description: 'RDS database username',
        tier: 'Standard',
        tags: {
          Name: `tap-db-username-param-${environmentSuffix}`,
          Component: 'Database',
          ...(args.tags as any),
        },
      },
      { parent: this }
    );

    // Store database password as SecureString in Parameter Store
    this.dbPasswordParam = new aws.ssm.Parameter(
      `tap-db-password-param-${environmentSuffix}`,
      {
        name: `/tap/${environmentSuffix}/database/password`,
        type: 'SecureString',
        value: args.dbPassword,
        description: 'RDS database password (encrypted)',
        tier: 'Standard',
        // 2024 feature: Enhanced encryption and rotation
        keyId: 'alias/aws/ssm',
        tags: {
          Name: `tap-db-password-param-${environmentSuffix}`,
          Component: 'Database',
          Sensitive: 'true',
          ...(args.tags as any),
        },
      },
      { parent: this }
    );

    // Store database name in Parameter Store
    this.dbNameParam = new aws.ssm.Parameter(
      `tap-db-name-param-${environmentSuffix}`,
      {
        name: `/tap/${environmentSuffix}/database/name`,
        type: 'String',
        value: 'tapapp',
        description: 'RDS database name',
        tier: 'Standard',
        tags: {
          Name: `tap-db-name-param-${environmentSuffix}`,
          Component: 'Database',
          ...(args.tags as any),
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      dbEndpointParamName: this.dbEndpointParam.name,
      dbUsernameParamName: this.dbUsernameParam.name,
      dbPasswordParamName: this.dbPasswordParam.name,
      dbNameParamName: this.dbNameParam.name,
    });
  }
}
