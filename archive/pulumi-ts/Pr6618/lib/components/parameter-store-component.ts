import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface ParameterStoreComponentArgs {
  environmentSuffix: string;
  parameters: { [key: string]: pulumi.Input<string> };
}

export class ParameterStoreComponent extends pulumi.ComponentResource {
  public readonly parameters: aws.ssm.Parameter[];

  constructor(
    name: string,
    args: ParameterStoreComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:config:ParameterStoreComponent', name, {}, opts);

    this.parameters = [];

    // Create SSM Parameters
    for (const [key, value] of Object.entries(args.parameters)) {
      const param = new aws.ssm.Parameter(
        `param-${key}-${args.environmentSuffix}`,
        {
          name: `/trading-platform/${args.environmentSuffix}/${key}-pw`,
          type: 'String',
          value: value,
          description: `${key} parameter for ${args.environmentSuffix} environment`,
          tags: {
            Name: `param-${key}-${args.environmentSuffix}`,
            Environment: args.environmentSuffix,
          },
        },
        { parent: this }
      );
      this.parameters.push(param);
    }

    this.registerOutputs({
      parameterCount: this.parameters.length,
    });
  }
}
