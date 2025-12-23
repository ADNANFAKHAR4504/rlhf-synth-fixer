/**
 * Secrets Stack - Fetch Docker registry credentials from AWS Secrets Manager
 *
 * This stack fetches existing secrets from AWS Secrets Manager.
 * It does NOT create secrets - they must exist before stack deployment.
 *
 * Expected Secret Format:
 * {
 *   "username": "docker-registry-username",
 *   "password": "docker-registry-password"
 * }
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface SecretsStackArgs {
  environmentSuffix: string;
  region: string;
  secretName?: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class SecretsStack extends pulumi.ComponentResource {
  public readonly dockerRegistrySecretArn: pulumi.Output<string>;
  public readonly dockerRegistrySecretName: pulumi.Output<string>;

  constructor(
    name: string,
    args: SecretsStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:cicd:SecretsStack', name, args, opts);

    // Default secret name if not provided
    const secretName =
      args.secretName ||
      `docker-registry-credentials-${args.environmentSuffix}`;

    // Fetch existing secret
    // Note: This secret must be created manually before deploying the stack
    const dockerRegistrySecret = aws.secretsmanager.getSecretOutput(
      {
        name: secretName,
      },
      { parent: this }
    );

    this.dockerRegistrySecretArn = dockerRegistrySecret.arn;
    this.dockerRegistrySecretName = dockerRegistrySecret.name;

    this.registerOutputs({
      dockerRegistrySecretArn: this.dockerRegistrySecretArn,
      dockerRegistrySecretName: this.dockerRegistrySecretName,
    });
  }
}
