import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface SecretsManagerSecretArgs {
  name: string;
  description?: string;
  kmsKeyId?: pulumi.Input<string>;
  recoveryWindowInDays?: number;
  forceOverwriteReplicaSecret?: boolean;
  tags?: Record<string, string>;
  replica?: Array<{
    region: string;
    kmsKeyId?: pulumi.Input<string>;
  }>;
}

export interface SecretsManagerSecretVersionArgs {
  secretId: pulumi.Input<string>;
  secretString?: pulumi.Input<string>;
  secretBinary?: pulumi.Input<string>;
  versionStages?: string[];
}

export interface SecretsManagerSecretResult {
  secret: aws.secretsmanager.Secret;
  secretArn: pulumi.Output<string>;
  secretName: pulumi.Output<string>;
  secretVersion?: aws.secretsmanager.SecretVersion;
}

export interface DatabaseCredentialsArgs {
  name: string;
  username: pulumi.Input<string>;
  password: pulumi.Input<string>;
  host: pulumi.Input<string>;
  port: pulumi.Input<string>;
  dbname: pulumi.Input<string>;
  engine?: string;
  kmsKeyId?: pulumi.Input<string>;
  tags?: Record<string, string>;
}

export interface DatabaseCredentialsResult {
  secret: aws.secretsmanager.Secret;
  secretVersion: aws.secretsmanager.SecretVersion;
  secretArn: pulumi.Output<string>;
  secretName: pulumi.Output<string>;
}

export interface ApiKeysArgs {
  name: string;
  apiKeys: Record<string, pulumi.Input<string>>;
  kmsKeyId?: pulumi.Input<string>;
  tags?: Record<string, string>;
}

export interface ApiKeysResult {
  secrets: Record<string, SecretsManagerSecretResult>;
}

export class SecretsManagerSecretComponent extends pulumi.ComponentResource {
  public readonly secret: aws.secretsmanager.Secret;
  public readonly secretArn: pulumi.Output<string>;
  public readonly secretName: pulumi.Output<string>;
  public readonly secretVersion?: aws.secretsmanager.SecretVersion;

  constructor(
    name: string,
    args: SecretsManagerSecretArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:secretsmanager:SecretsManagerSecretComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Model-Breaking',
      ...args.tags,
    };

    this.secret = new aws.secretsmanager.Secret(
      `${name}-secret`,
      {
        name: args.name,
        description: args.description || `Secret for ${args.name}`,
        kmsKeyId: args.kmsKeyId,
        recoveryWindowInDays: args.recoveryWindowInDays || 7,
        forceOverwriteReplicaSecret: args.forceOverwriteReplicaSecret ?? false,
        replicas: args.replica,
        tags: defaultTags,
      },
      { parent: this, provider: opts?.provider } // ← FIXED: Added provider
    );

    this.secretArn = this.secret.arn;
    this.secretName = this.secret.name;

    this.registerOutputs({
      secret: this.secret,
      secretArn: this.secretArn,
      secretName: this.secretName,
    });
  }
}

export class SecretsManagerSecretVersionComponent
  extends pulumi.ComponentResource
{
  public readonly secretVersion: aws.secretsmanager.SecretVersion;

  constructor(
    name: string,
    args: SecretsManagerSecretVersionArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super(
      'aws:secretsmanager:SecretsManagerSecretVersionComponent',
      name,
      {},
      opts
    );

    this.secretVersion = new aws.secretsmanager.SecretVersion(
      `${name}-version`,
      {
        secretId: args.secretId,
        secretString: args.secretString,
        secretBinary: args.secretBinary,
        versionStages: args.versionStages || ['AWSCURRENT'],
      },
      { parent: this, provider: opts?.provider } // ← FIXED: Added provider
    );

    this.registerOutputs({
      secretVersion: this.secretVersion,
    });
  }
}

export class DatabaseCredentialsComponent extends pulumi.ComponentResource {
  public readonly secret: aws.secretsmanager.Secret;
  public readonly secretVersion: aws.secretsmanager.SecretVersion;
  public readonly secretArn: pulumi.Output<string>;
  public readonly secretName: pulumi.Output<string>;

  constructor(
    name: string,
    args: DatabaseCredentialsArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:secretsmanager:DatabaseCredentialsComponent', name, {}, opts);

    // Create the secret
    const secretComponent = new SecretsManagerSecretComponent(
      name,
      {
        name: `/app/${args.name}/database/credentials`,
        description: `Database credentials for ${args.name}`,
        kmsKeyId: args.kmsKeyId,
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider } // ← FIXED: Added provider
    );

    this.secret = secretComponent.secret;
    this.secretArn = secretComponent.secretArn;
    this.secretName = secretComponent.secretName;

    // Create secret version with database credentials JSON
    const secretString = pulumi
      .all([args.username, args.password, args.host, args.port, args.dbname])
      .apply(([username, password, host, port, dbname]) =>
        JSON.stringify({
          username: username,
          password: password,
          host: host,
          port: parseInt(port.toString()),
          dbname: dbname,
          engine: args.engine || 'mysql',
        })
      );

    const secretVersionComponent = new SecretsManagerSecretVersionComponent(
      `${name}-version`,
      {
        secretId: this.secret.id,
        secretString: secretString,
      },
      { parent: this, provider: opts?.provider } // ← FIXED: Added provider
    );

    this.secretVersion = secretVersionComponent.secretVersion;

    this.registerOutputs({
      secret: this.secret,
      secretVersion: this.secretVersion,
      secretArn: this.secretArn,
      secretName: this.secretName,
    });
  }
}

export class ApiKeysComponent extends pulumi.ComponentResource {
  public readonly secrets: Record<string, SecretsManagerSecretResult>;

  constructor(
    name: string,
    args: ApiKeysArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:secretsmanager:ApiKeysComponent', name, {}, opts);

    this.secrets = {};

    Object.entries(args.apiKeys).forEach(([keyName, keyValue]) => {
      const secretComponent = new SecretsManagerSecretComponent(
        `${name}-${keyName}`,
        {
          name: `/app/${args.name}/api-keys/${keyName}`,
          description: `API key ${keyName} for ${args.name}`,
          kmsKeyId: args.kmsKeyId,
          tags: args.tags,
        },
        { parent: this, provider: opts?.provider } // ← FIXED: Added provider
      );

      const secretVersionComponent = new SecretsManagerSecretVersionComponent(
        `${name}-${keyName}-version`,
        {
          secretId: secretComponent.secret.id,
          secretString: keyValue,
        },
        { parent: this, provider: opts?.provider } // ← FIXED: Added provider
      );

      this.secrets[keyName] = {
        secret: secretComponent.secret,
        secretArn: secretComponent.secretArn,
        secretName: secretComponent.secretName,
        secretVersion: secretVersionComponent.secretVersion,
      };
    });

    this.registerOutputs({
      secrets: this.secrets,
    });
  }
}

export function createSecretsManagerSecret(
  name: string,
  args: SecretsManagerSecretArgs,
  opts?: pulumi.ComponentResourceOptions // ← FIXED: Added third parameter
): SecretsManagerSecretResult {
  const secretComponent = new SecretsManagerSecretComponent(name, args, opts); // ← FIXED: Pass opts through
  return {
    secret: secretComponent.secret,
    secretArn: secretComponent.secretArn,
    secretName: secretComponent.secretName,
    secretVersion: secretComponent.secretVersion,
  };
}

export function createSecretsManagerSecretVersion(
  name: string,
  args: SecretsManagerSecretVersionArgs,
  opts?: pulumi.ComponentResourceOptions // ← FIXED: Added third parameter
): aws.secretsmanager.SecretVersion {
  const secretVersionComponent = new SecretsManagerSecretVersionComponent(
    name,
    args,
    opts // ← FIXED: Pass opts through
  );
  return secretVersionComponent.secretVersion;
}

export function createDatabaseCredentials(
  name: string,
  args: DatabaseCredentialsArgs,
  opts?: pulumi.ComponentResourceOptions // ← FIXED: Added third parameter
): DatabaseCredentialsResult {
  const databaseCredentialsComponent = new DatabaseCredentialsComponent(
    name,
    args,
    opts // ← FIXED: Pass opts through
  );
  return {
    secret: databaseCredentialsComponent.secret,
    secretVersion: databaseCredentialsComponent.secretVersion,
    secretArn: databaseCredentialsComponent.secretArn,
    secretName: databaseCredentialsComponent.secretName,
  };
}

export function createApiKeys(
  name: string,
  args: ApiKeysArgs,
  opts?: pulumi.ComponentResourceOptions
): ApiKeysResult {
  const apiKeysComponent = new ApiKeysComponent(name, args, opts);
  return {
    secrets: apiKeysComponent.secrets,
  };
}
