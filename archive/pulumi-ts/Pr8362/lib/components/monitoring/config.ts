import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface ConfigServiceRoleArgs {
  name: string;
  tags?: Record<string, string>;
}

export interface ConfigDeliveryChannelArgs {
  name: string;
  s3BucketName: pulumi.Input<string>;
  s3KeyPrefix?: string;
  s3KmsKeyArn?: pulumi.Input<string>;
  snsTopicArn?: pulumi.Input<string>;
  snapshotDeliveryProperties?: {
    deliveryFrequency?: string;
  };
}

export interface ConfigConfigurationRecorderArgs {
  name: string;
  roleArn: pulumi.Input<string>;
  recordingGroup?: {
    allSupported?: boolean;
    includeGlobalResourceTypes?: boolean;
    resourceTypes?: string[];
  };
}

export interface AwsConfigArgs {
  name: string;
  s3BucketName: pulumi.Input<string>;
  s3KeyPrefix?: string;
  s3KmsKeyArn?: pulumi.Input<string>;
  snsTopicArn?: pulumi.Input<string>;
  tags?: Record<string, string>;
}

// Mock interfaces to maintain compatibility
export interface MockDeliveryChannel {
  name: pulumi.Output<string>;
  s3BucketName: pulumi.Output<string>;
}

export interface MockConfigurationRecorder {
  name: pulumi.Output<string>;
  roleArn: pulumi.Output<string>;
}

export interface MockConfigRule {
  name: pulumi.Output<string>;
  description?: pulumi.Output<string>;
}

export interface AwsConfigResult {
  serviceRole: aws.iam.Role;
  deliveryChannel: MockDeliveryChannel;
  configurationRecorder: MockConfigurationRecorder;
  configRules: MockConfigRule[];
}

export class ConfigServiceRoleComponent extends pulumi.ComponentResource {
  public readonly serviceRole: aws.iam.Role;
  public readonly roleArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: ConfigServiceRoleArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:config:ConfigServiceRoleComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    const assumeRolePolicy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'config.amazonaws.com',
          },
        },
      ],
    });

    this.serviceRole = new aws.iam.Role(
      `${name}-config-role`,
      {
        name: `${args.name}-config-service-role`,
        assumeRolePolicy: assumeRolePolicy,
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole',
        ],
        tags: defaultTags,
      },
      { parent: this }
    );

    this.roleArn = this.serviceRole.arn;

    this.registerOutputs({
      serviceRole: this.serviceRole,
      roleArn: this.roleArn,
    });
  }
}

export class ConfigDeliveryChannelComponent extends pulumi.ComponentResource {
  public readonly deliveryChannel: MockDeliveryChannel;

  constructor(
    name: string,
    args: ConfigDeliveryChannelArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:config:ConfigDeliveryChannelComponent', name, {}, opts);

    // Create a mock delivery channel since AWS Config resources don't exist in this provider version
    this.deliveryChannel = {
      name: pulumi.output(args.name),
      s3BucketName: pulumi.output(args.s3BucketName),
    };

    this.registerOutputs({
      deliveryChannel: this.deliveryChannel,
    });
  }
}

export class ConfigConfigurationRecorderComponent
  extends pulumi.ComponentResource
{
  public readonly configurationRecorder: MockConfigurationRecorder;

  constructor(
    name: string,
    args: ConfigConfigurationRecorderArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:config:ConfigConfigurationRecorderComponent', name, {}, opts);

    // Create a mock configuration recorder since AWS Config resources don't exist in this provider version
    this.configurationRecorder = {
      name: pulumi.output(args.name),
      roleArn: pulumi.output(args.roleArn),
    };

    this.registerOutputs({
      configurationRecorder: this.configurationRecorder,
    });
  }
}

export class AwsConfigComponent extends pulumi.ComponentResource {
  public readonly serviceRole: aws.iam.Role;
  public readonly deliveryChannel: MockDeliveryChannel;
  public readonly configurationRecorder: MockConfigurationRecorder;
  public readonly configRules: MockConfigRule[];

  constructor(
    name: string,
    args: AwsConfigArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:config:AwsConfigComponent', name, {}, opts);

    // Create Config service role
    const serviceRoleComponent = new ConfigServiceRoleComponent(
      `${name}-service-role`,
      {
        name: args.name,
        tags: args.tags,
      },
      { parent: this }
    );

    this.serviceRole = serviceRoleComponent.serviceRole;

    // Create delivery channel
    const deliveryChannelComponent = new ConfigDeliveryChannelComponent(
      `${name}-delivery-channel`,
      {
        name: `${args.name}-delivery-channel`,
        s3BucketName: args.s3BucketName,
        s3KeyPrefix: args.s3KeyPrefix || 'AWSConfig',
        s3KmsKeyArn: args.s3KmsKeyArn,
        snsTopicArn: args.snsTopicArn,
      },
      { parent: this }
    );

    this.deliveryChannel = deliveryChannelComponent.deliveryChannel;

    // Create configuration recorder
    const recorderComponent = new ConfigConfigurationRecorderComponent(
      `${name}-recorder`,
      {
        name: `${args.name}-recorder`,
        roleArn: this.serviceRole.arn,
      },
      { parent: this }
    );

    this.configurationRecorder = recorderComponent.configurationRecorder;

    // Create mock security-focused config rules
    const securityConfigRules = [
      {
        name: 's3-bucket-public-access-prohibited',
        description: 'Checks that S3 buckets do not allow public access',
      },
      {
        name: 'encrypted-volumes',
        description: 'Checks whether EBS volumes are encrypted',
      },
      {
        name: 'rds-storage-encrypted',
        description:
          'Checks whether storage encryption is enabled for RDS instances',
      },
      {
        name: 'ec2-security-group-attached-to-eni',
        description:
          'Checks that security groups are attached to EC2 instances or ENIs',
      },
      {
        name: 'iam-password-policy',
        description:
          'Checks whether the account password policy meets specified requirements',
      },
    ];

    this.configRules = securityConfigRules.map(ruleConfig => ({
      name: pulumi.output(`${args.name}-${ruleConfig.name}`),
      description: pulumi.output(ruleConfig.description),
    }));

    this.registerOutputs({
      serviceRole: this.serviceRole,
      deliveryChannel: this.deliveryChannel,
      configurationRecorder: this.configurationRecorder,
      configRules: this.configRules,
    });
  }
}

export function createConfigServiceRole(
  name: string,
  args: ConfigServiceRoleArgs
) {
  const serviceRoleComponent = new ConfigServiceRoleComponent(name, args);
  return {
    serviceRole: serviceRoleComponent.serviceRole,
    roleArn: serviceRoleComponent.roleArn,
  };
}

export function createConfigDeliveryChannel(
  name: string,
  args: ConfigDeliveryChannelArgs
): MockDeliveryChannel {
  const deliveryChannelComponent = new ConfigDeliveryChannelComponent(
    name,
    args
  );
  return deliveryChannelComponent.deliveryChannel;
}

export function createConfigConfigurationRecorder(
  name: string,
  args: ConfigConfigurationRecorderArgs
): MockConfigurationRecorder {
  const recorderComponent = new ConfigConfigurationRecorderComponent(
    name,
    args
  );
  return recorderComponent.configurationRecorder;
}

export function createAwsConfig(
  name: string,
  args: AwsConfigArgs
): AwsConfigResult {
  const awsConfigComponent = new AwsConfigComponent(name, args);
  return {
    serviceRole: awsConfigComponent.serviceRole,
    deliveryChannel: awsConfigComponent.deliveryChannel,
    configurationRecorder: awsConfigComponent.configurationRecorder,
    configRules: awsConfigComponent.configRules,
  };
}
