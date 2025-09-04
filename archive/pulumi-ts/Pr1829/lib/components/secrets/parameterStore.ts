import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface ParameterStoreParameterArgs {
  name: string;
  type: 'String' | 'StringList' | 'SecureString';
  value: pulumi.Input<string>;
  description?: string;
  keyId?: pulumi.Input<string>;
  overwrite?: boolean;
  allowedPattern?: string;
  tier?: 'Standard' | 'Advanced' | 'Intelligent-Tiering';
  policies?: string;
  dataType?: string;
  tags?: Record<string, string>;
}

export interface ParameterStoreParameterResult {
  parameter: aws.ssm.Parameter;
  parameterArn: pulumi.Output<string>;
  parameterName: pulumi.Output<string>;
  parameterValue: pulumi.Output<string>;
}

export interface DatabaseParametersArgs {
  name: string;
  databaseHost: pulumi.Input<string>;
  databasePort: pulumi.Input<string>;
  databaseName: pulumi.Input<string>;
  databaseUsername: pulumi.Input<string>;
  kmsKeyId?: pulumi.Input<string>;
  tags?: Record<string, string>;
}

export interface DatabaseParametersResult {
  hostParameter: ParameterStoreParameterResult;
  portParameter: ParameterStoreParameterResult;
  nameParameter: ParameterStoreParameterResult;
  usernameParameter: ParameterStoreParameterResult;
}

export interface ApplicationParametersArgs {
  name: string;
  parameters: Record<
    string,
    {
      value: pulumi.Input<string>;
      type?: 'String' | 'StringList' | 'SecureString';
      description?: string;
    }
  >;
  kmsKeyId?: pulumi.Input<string>;
  tags?: Record<string, string>;
}

export interface ApplicationParametersResult {
  parameters: Record<string, ParameterStoreParameterResult>;
}

export class ParameterStoreParameterComponent extends pulumi.ComponentResource {
  public readonly parameter: aws.ssm.Parameter;
  public readonly parameterArn: pulumi.Output<string>;
  public readonly parameterName: pulumi.Output<string>;
  public readonly parameterValue: pulumi.Output<string>;

  constructor(
    name: string,
    args: ParameterStoreParameterArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:ssm:ParameterStoreParameterComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    // Create parameter object without unsupported properties
    const parameterConfig: aws.ssm.ParameterArgs = {
      name: args.name,
      type: args.type,
      value: args.value,
      description: args.description || `Parameter for ${args.name}`,
      keyId: args.keyId,
      overwrite: args.overwrite ?? true,
      allowedPattern: args.allowedPattern,
      tier: args.tier || 'Standard',
      dataType: args.dataType || 'text',
      tags: defaultTags,
    };

    this.parameter = new aws.ssm.Parameter(
      `${name}-parameter`,
      parameterConfig,
      { parent: this, provider: opts?.provider }
    );

    this.parameterArn = this.parameter.arn;
    this.parameterName = this.parameter.name;
    this.parameterValue = this.parameter.value;

    this.registerOutputs({
      parameter: this.parameter,
      parameterArn: this.parameterArn,
      parameterName: this.parameterName,
      parameterValue: this.parameterValue,
    });
  }
}

export class DatabaseParametersComponent extends pulumi.ComponentResource {
  public readonly hostParameter: ParameterStoreParameterResult;
  public readonly portParameter: ParameterStoreParameterResult;
  public readonly nameParameter: ParameterStoreParameterResult;
  public readonly usernameParameter: ParameterStoreParameterResult;

  constructor(
    name: string,
    args: DatabaseParametersArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:ssm:DatabaseParametersComponent', name, {}, opts);

    // Database host parameter
    const hostParameterComponent = new ParameterStoreParameterComponent(
      `${name}-host`,
      {
        name: `/app/${args.name}/database/host`,
        type: 'SecureString',
        value: args.databaseHost,
        description: `Database host for ${args.name}`,
        keyId: args.kmsKeyId,
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider } // ← FIXED: Added provider
    );

    this.hostParameter = {
      parameter: hostParameterComponent.parameter,
      parameterArn: hostParameterComponent.parameterArn,
      parameterName: hostParameterComponent.parameterName,
      parameterValue: hostParameterComponent.parameterValue,
    };

    // Database port parameter
    const portParameterComponent = new ParameterStoreParameterComponent(
      `${name}-port`,
      {
        name: `/app/${args.name}/database/port`,
        type: 'String',
        value: args.databasePort,
        description: `Database port for ${args.name}`,
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider } // ← FIXED: Added provider
    );

    this.portParameter = {
      parameter: portParameterComponent.parameter,
      parameterArn: portParameterComponent.parameterArn,
      parameterName: portParameterComponent.parameterName,
      parameterValue: portParameterComponent.parameterValue,
    };

    // Database name parameter
    const nameParameterComponent = new ParameterStoreParameterComponent(
      `${name}-name`,
      {
        name: `/app/${args.name}/database/name`,
        type: 'String',
        value: args.databaseName,
        description: `Database name for ${args.name}`,
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider } // ← FIXED: Added provider
    );

    this.nameParameter = {
      parameter: nameParameterComponent.parameter,
      parameterArn: nameParameterComponent.parameterArn,
      parameterName: nameParameterComponent.parameterName,
      parameterValue: nameParameterComponent.parameterValue,
    };

    // Database username parameter
    const usernameParameterComponent = new ParameterStoreParameterComponent(
      `${name}-username`,
      {
        name: `/app/${args.name}/database/username`,
        type: 'SecureString',
        value: args.databaseUsername,
        description: `Database username for ${args.name}`,
        keyId: args.kmsKeyId,
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider } // ← FIXED: Added provider
    );

    this.usernameParameter = {
      parameter: usernameParameterComponent.parameter,
      parameterArn: usernameParameterComponent.parameterArn,
      parameterName: usernameParameterComponent.parameterName,
      parameterValue: usernameParameterComponent.parameterValue,
    };

    this.registerOutputs({
      hostParameter: this.hostParameter,
      portParameter: this.portParameter,
      nameParameter: this.nameParameter,
      usernameParameter: this.usernameParameter,
    });
  }
}

export class ApplicationParametersComponent extends pulumi.ComponentResource {
  public readonly parameters: Record<string, ParameterStoreParameterResult>;

  constructor(
    name: string,
    args: ApplicationParametersArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:ssm:ApplicationParametersComponent', name, {}, opts);

    this.parameters = {};

    Object.entries(args.parameters).forEach(([key, paramConfig]) => {
      const parameterComponent = new ParameterStoreParameterComponent(
        `${name}-${key}`,
        {
          name: `/app/${args.name}/${key}`,
          type: paramConfig.type || 'String',
          value: paramConfig.value,
          description:
            paramConfig.description || `${key} parameter for ${args.name}`,
          keyId:
            paramConfig.type === 'SecureString' ? args.kmsKeyId : undefined,
          tags: args.tags,
        },
        { parent: this, provider: opts?.provider }
      );

      this.parameters[key] = {
        parameter: parameterComponent.parameter,
        parameterArn: parameterComponent.parameterArn,
        parameterName: parameterComponent.parameterName,
        parameterValue: parameterComponent.parameterValue,
      };
    });

    this.registerOutputs({
      parameters: this.parameters,
    });
  }
}

export function createParameterStoreParameter(
  name: string,
  args: ParameterStoreParameterArgs,
  opts?: pulumi.ComponentResourceOptions
): ParameterStoreParameterResult {
  const parameterComponent = new ParameterStoreParameterComponent(
    name,
    args,
    opts
  );
  return {
    parameter: parameterComponent.parameter,
    parameterArn: parameterComponent.parameterArn,
    parameterName: parameterComponent.parameterName,
    parameterValue: parameterComponent.parameterValue,
  };
}

export function createDatabaseParameters(
  name: string,
  args: DatabaseParametersArgs,
  opts?: pulumi.ComponentResourceOptions
): DatabaseParametersResult {
  const databaseParametersComponent = new DatabaseParametersComponent(
    name,
    args,
    opts
  );
  return {
    hostParameter: databaseParametersComponent.hostParameter,
    portParameter: databaseParametersComponent.portParameter,
    nameParameter: databaseParametersComponent.nameParameter,
    usernameParameter: databaseParametersComponent.usernameParameter,
  };
}

export function createApplicationParameters(
  name: string,
  args: ApplicationParametersArgs,
  opts?: pulumi.ComponentResourceOptions
): ApplicationParametersResult {
  const applicationParametersComponent = new ApplicationParametersComponent(
    name,
    args,
    opts
  );
  return {
    parameters: applicationParametersComponent.parameters,
  };
}
