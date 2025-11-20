import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface ParameterStoreHierarchyArgs {
  environmentSuffix: string;
  environment: string;
  vpcId: pulumi.Input<string>;
  securityGroupIds: pulumi.Input<string>[];
}

export class ParameterStoreHierarchy extends pulumi.ComponentResource {
  public readonly sharedParameters: aws.ssm.Parameter[];
  public readonly environmentParameters: aws.ssm.Parameter[];

  constructor(
    name: string,
    args: ParameterStoreHierarchyArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:infrastructure:ParameterStoreHierarchy', name, {}, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    // Shared parameters across all environments
    this.sharedParameters = [];

    const sharedParams = [
      { name: 'app-name', value: 'trading-platform' },
      { name: 'app-version', value: '1.0.0' },
      { name: 'log-level', value: 'info' },
    ];

    sharedParams.forEach(param => {
      const ssmParam = new aws.ssm.Parameter(
        `shared-${param.name}-${args.environmentSuffix}`,
        {
          name: `/shared/${param.name}-${args.environmentSuffix}`,
          type: 'String',
          value: param.value,
          description: `Shared parameter: ${param.name}`,
          tags: {
            Name: `shared-${param.name}-${args.environmentSuffix}`,
            Environment: args.environment,
            EnvironmentSuffix: args.environmentSuffix,
            Type: 'shared',
          },
        },
        defaultResourceOptions
      );
      this.sharedParameters.push(ssmParam);
    });

    // Environment-specific parameters
    this.environmentParameters = [];

    const envParams = [
      {
        name: 'database-max-connections',
        value: args.environment === 'prod' ? '100' : '50',
      },
      {
        name: 'cache-ttl',
        value: args.environment === 'prod' ? '3600' : '300',
      },
      {
        name: 'api-timeout',
        value: args.environment === 'prod' ? '30000' : '10000',
      },
    ];

    envParams.forEach(param => {
      const ssmParam = new aws.ssm.Parameter(
        `env-${param.name}-${args.environmentSuffix}`,
        {
          name: `/${args.environment}/${param.name}-${args.environmentSuffix}`,
          type: 'String',
          value: param.value,
          description: `Environment-specific parameter: ${param.name}`,
          tags: {
            Name: `env-${param.name}-${args.environmentSuffix}`,
            Environment: args.environment,
            EnvironmentSuffix: args.environmentSuffix,
            Type: 'environment-specific',
          },
        },
        defaultResourceOptions
      );
      this.environmentParameters.push(ssmParam);
    });

    // Network configuration parameters
    new aws.ssm.Parameter(
      `vpc-id-${args.environmentSuffix}`,
      {
        name: `/${args.environment}/network/vpc-id-${args.environmentSuffix}`,
        type: 'String',
        value: pulumi.output(args.vpcId),
        description: 'VPC ID for the environment',
        tags: {
          Name: `vpc-id-${args.environmentSuffix}`,
          Environment: args.environment,
          EnvironmentSuffix: args.environmentSuffix,
        },
      },
      defaultResourceOptions
    );

    this.registerOutputs({});
  }
}
