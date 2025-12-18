import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface RdsSubnetGroupArgs {
  name: string;
  subnetIds: pulumi.Input<string>[];
  tags?: Record<string, string>;
  description?: string;
}

export interface RdsParameterGroupArgs {
  name: string;
  family: string;
  parameters?: Array<{
    name: string;
    value: string;
    applyMethod?: 'immediate' | 'pending-reboot';
  }>;
  tags?: Record<string, string>;
  description?: string;
}

export interface RdsInstanceArgs {
  name: string;
  identifier?: string;
  engine: string;
  engineVersion?: string;
  instanceClass: string;
  allocatedStorage?: number;
  maxAllocatedStorage?: number;
  storageType?: string;
  storageEncrypted?: boolean;
  kmsKeyId?: pulumi.Input<string>;
  dbName?: string;
  username: string;
  vpcSecurityGroupIds?: pulumi.Input<string>[];
  dbSubnetGroupName?: pulumi.Input<string>;
  parameterGroupName?: pulumi.Input<string>;
  multiAz?: boolean;
  publiclyAccessible?: boolean;
  backupRetentionPeriod?: number;
  backupWindow?: string;
  maintenanceWindow?: string;
  autoMinorVersionUpgrade?: boolean;
  deletionProtection?: boolean;
  skipFinalSnapshot?: boolean;
  finalSnapshotIdentifier?: string;
  performanceInsightsEnabled?: boolean; // <-- ADDED
  performanceInsightsKmsKeyId?: pulumi.Input<string>;
  enabledCloudwatchLogsExports?: string[];
  monitoringInterval?: number;
  monitoringRoleArn?: pulumi.Input<string>;
  tags?: Record<string, string>;
}

export interface RdsInstanceResult {
  instance: aws.rds.Instance;
  instanceId: pulumi.Output<string>;
  instanceArn: pulumi.Output<string>;
  endpoint: pulumi.Output<string>;
  port: pulumi.Output<number>;
  address: pulumi.Output<string>;
  masterUserSecrets?: pulumi.Output<
    aws.types.output.rds.InstanceMasterUserSecret[]
  >;
  subnetGroup?: aws.rds.SubnetGroup;
  parameterGroup?: aws.rds.ParameterGroup;
}

export interface SecureRdsInstanceArgs {
  name: string;
  identifier?: string;
  engine?: string;
  engineVersion?: string;
  instanceClass: string;
  allocatedStorage?: number;
  dbName?: string;
  username: string;
  subnetIds: pulumi.Input<string>[];
  securityGroupIds: pulumi.Input<string>[];
  kmsKeyId?: pulumi.Input<string>;
  backupRetentionPeriod?: number;
  performanceInsightsEnabled?: boolean; // <-- ADDED
  tags?: Record<string, string>;
}

export class RdsSubnetGroupComponent extends pulumi.ComponentResource {
  public readonly subnetGroup: aws.rds.SubnetGroup;
  public readonly subnetGroupName: pulumi.Output<string>;

  constructor(
    name: string,
    args: RdsSubnetGroupArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:rds:RdsSubnetGroupComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    this.subnetGroup = new aws.rds.SubnetGroup(
      `${name}-subnet-group`,
      {
        name: args.name,
        subnetIds: args.subnetIds,
        description: args.description || `DB subnet group for ${args.name}`,
        tags: defaultTags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.subnetGroupName = this.subnetGroup.name;

    this.registerOutputs({
      subnetGroup: this.subnetGroup,
      subnetGroupName: this.subnetGroupName,
    });
  }
}

export class RdsParameterGroupComponent extends pulumi.ComponentResource {
  public readonly parameterGroup: aws.rds.ParameterGroup;
  public readonly parameterGroupName: pulumi.Output<string>;

  constructor(
    name: string,
    args: RdsParameterGroupArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:rds:RdsParameterGroupComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    this.parameterGroup = new aws.rds.ParameterGroup(
      `${name}-parameter-group`,
      {
        name: args.name,
        family: args.family,
        description: args.description || `DB parameter group for ${args.name}`,
        parameters: args.parameters,
        tags: defaultTags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.parameterGroupName = this.parameterGroup.name;

    this.registerOutputs({
      parameterGroup: this.parameterGroup,
      parameterGroupName: this.parameterGroupName,
    });
  }
}

export class RdsInstanceComponent extends pulumi.ComponentResource {
  public readonly instance: aws.rds.Instance;
  public readonly instanceId: pulumi.Output<string>;
  public readonly instanceArn: pulumi.Output<string>;
  public readonly endpoint: pulumi.Output<string>;
  public readonly port: pulumi.Output<number>;
  public readonly address: pulumi.Output<string>;
  public readonly masterUserSecrets: pulumi.Output<
    aws.types.output.rds.InstanceMasterUserSecret[]
  >;
  public readonly subnetGroup?: aws.rds.SubnetGroup;
  public readonly parameterGroup?: aws.rds.ParameterGroup;

  constructor(
    name: string,
    args: RdsInstanceArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:rds:RdsInstanceComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    this.instance = new aws.rds.Instance(
      `${name}-instance`,
      {
        identifier: args.identifier || args.name,
        engine: args.engine,
        engineVersion: args.engineVersion,
        instanceClass: args.instanceClass,
        allocatedStorage: args.allocatedStorage || 20,
        maxAllocatedStorage: args.maxAllocatedStorage || 100,
        storageType: args.storageType || 'gp2',
        storageEncrypted: args.storageEncrypted ?? true,
        kmsKeyId: args.kmsKeyId,
        dbName: args.dbName,
        username: args.username,
        manageMasterUserPassword: true,
        masterUserSecretKmsKeyId: args.kmsKeyId,
        vpcSecurityGroupIds: args.vpcSecurityGroupIds,
        dbSubnetGroupName: args.dbSubnetGroupName,
        parameterGroupName: args.parameterGroupName,
        multiAz: args.multiAz ?? true,
        publiclyAccessible: args.publiclyAccessible ?? false,
        backupRetentionPeriod: args.backupRetentionPeriod || 7,
        backupWindow: args.backupWindow || '03:00-04:00',
        maintenanceWindow: args.maintenanceWindow || 'sun:04:00-sun:05:00',
        autoMinorVersionUpgrade: args.autoMinorVersionUpgrade ?? true,
        deletionProtection: args.deletionProtection ?? true,
        skipFinalSnapshot: args.skipFinalSnapshot ?? false,
        finalSnapshotIdentifier:
          args.finalSnapshotIdentifier ||
          `${args.name}-final-snapshot-${Date.now()}`,
        performanceInsightsEnabled: args.performanceInsightsEnabled, // <-- ADDED
        performanceInsightsKmsKeyId:
          args.performanceInsightsKmsKeyId || args.kmsKeyId,
        enabledCloudwatchLogsExports: args.enabledCloudwatchLogsExports,
        monitoringInterval: args.monitoringInterval || 0,
        monitoringRoleArn: args.monitoringRoleArn,
        tags: defaultTags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.instanceId = this.instance.id;
    this.instanceArn = this.instance.arn;
    this.endpoint = this.instance.endpoint;
    this.port = this.instance.port;
    this.address = this.instance.address;
    this.masterUserSecrets = this.instance.masterUserSecrets;

    this.registerOutputs({
      instance: this.instance,
      instanceId: this.instanceId,
      instanceArn: this.instanceArn,
      endpoint: this.endpoint,
      port: this.port,
      address: this.address,
      masterUserSecrets: this.masterUserSecrets,
    });
  }
}

export class SecureRdsInstanceComponent extends pulumi.ComponentResource {
  public readonly instance: aws.rds.Instance;
  public readonly instanceId: pulumi.Output<string>;
  public readonly instanceArn: pulumi.Output<string>;
  public readonly endpoint: pulumi.Output<string>;
  public readonly port: pulumi.Output<number>;
  public readonly address: pulumi.Output<string>;
  public readonly masterUserSecrets: pulumi.Output<
    aws.types.output.rds.InstanceMasterUserSecret[]
  >;
  public readonly subnetGroup: aws.rds.SubnetGroup;
  public readonly parameterGroup: aws.rds.ParameterGroup;

  constructor(
    name: string,
    args: SecureRdsInstanceArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:rds:SecureRdsInstanceComponent', name, {}, opts);

    const engine = args.engine || 'mysql';
    const engineVersion =
      args.engineVersion || (engine === 'mysql' ? '8.0' : '13.7');

    // Create subnet group
    const subnetGroupComponent = new RdsSubnetGroupComponent(
      `${name}-subnet-group`,
      {
        name: `${args.name}-subnet-group`,
        subnetIds: args.subnetIds,
        description: `Secure DB subnet group for ${args.name}`,
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.subnetGroup = subnetGroupComponent.subnetGroup;

    // Create parameter group with security-focused parameters
    const secureParameters =
      engine === 'mysql'
        ? [
            { name: 'log_bin_trust_function_creators', value: '1' },
            { name: 'slow_query_log', value: '1' },
            { name: 'long_query_time', value: '2' },
            { name: 'general_log', value: '1' },
          ]
        : [
            { name: 'log_statement', value: 'all' },
            { name: 'log_min_duration_statement', value: '1000' },
            { name: 'shared_preload_libraries', value: 'pg_stat_statements' },
          ];

    const parameterFamily = engine === 'mysql' ? 'mysql8.0' : 'postgres13';

    const parameterGroupComponent = new RdsParameterGroupComponent(
      `${name}-parameter-group`,
      {
        name: `${args.name}-parameter-group`,
        family: parameterFamily,
        description: `Secure DB parameter group for ${args.name}`,
        parameters: secureParameters,
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.parameterGroup = parameterGroupComponent.parameterGroup;

    // Create RDS instance with security best practices
    const rdsComponent = new RdsInstanceComponent(
      name,
      {
        name: args.name,
        identifier: args.identifier,
        engine: engine,
        engineVersion: engineVersion,
        instanceClass: args.instanceClass,
        allocatedStorage: args.allocatedStorage || 20,
        maxAllocatedStorage: 100,
        storageType: 'gp2',
        storageEncrypted: true,
        kmsKeyId: args.kmsKeyId,
        dbName: args.dbName,
        username: args.username,
        vpcSecurityGroupIds: args.securityGroupIds,
        dbSubnetGroupName: this.subnetGroup.name,
        parameterGroupName: this.parameterGroup.name,
        multiAz: true,
        publiclyAccessible: false,
        backupRetentionPeriod: args.backupRetentionPeriod || 7,
        backupWindow: '03:00-04:00',
        maintenanceWindow: 'sun:04:00-sun:05:00',
        autoMinorVersionUpgrade: true,
        deletionProtection: true,
        skipFinalSnapshot: false,
        performanceInsightsEnabled: args.performanceInsightsEnabled, // <-- ADDED
        performanceInsightsKmsKeyId: args.kmsKeyId,
        enabledCloudwatchLogsExports:
          engine === 'mysql'
            ? ['error', 'general', 'slowquery']
            : ['postgresql'],
        monitoringInterval: 0,
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.instance = rdsComponent.instance;
    this.instanceId = rdsComponent.instanceId;
    this.instanceArn = rdsComponent.instanceArn;
    this.endpoint = rdsComponent.endpoint;
    this.port = rdsComponent.port;
    this.address = rdsComponent.address;
    this.masterUserSecrets = rdsComponent.masterUserSecrets;

    this.registerOutputs({
      instance: this.instance,
      instanceId: this.instanceId,
      instanceArn: this.instanceArn,
      endpoint: this.endpoint,
      port: this.port,
      address: this.address,
      masterUserSecrets: this.masterUserSecrets,
      subnetGroup: this.subnetGroup,
      parameterGroup: this.parameterGroup,
    });
  }
}

export function createRdsSubnetGroup(
  name: string,
  args: RdsSubnetGroupArgs,
  opts?: pulumi.ComponentResourceOptions
) {
  const subnetGroupComponent = new RdsSubnetGroupComponent(name, args, opts);
  return {
    subnetGroup: subnetGroupComponent.subnetGroup,
    subnetGroupName: subnetGroupComponent.subnetGroupName,
  };
}

export function createRdsParameterGroup(
  name: string,
  args: RdsParameterGroupArgs,
  opts?: pulumi.ComponentResourceOptions
) {
  const parameterGroupComponent = new RdsParameterGroupComponent(
    name,
    args,
    opts
  );
  return {
    parameterGroup: parameterGroupComponent.parameterGroup,
    parameterGroupName: parameterGroupComponent.parameterGroupName,
  };
}

export function createRdsInstance(
  name: string,
  args: RdsInstanceArgs,
  opts?: pulumi.ComponentResourceOptions
): RdsInstanceResult {
  const rdsComponent = new RdsInstanceComponent(name, args, opts);
  return {
    instance: rdsComponent.instance,
    instanceId: rdsComponent.instanceId,
    instanceArn: rdsComponent.instanceArn,
    endpoint: rdsComponent.endpoint,
    port: rdsComponent.port,
    address: rdsComponent.address,
    masterUserSecrets: rdsComponent.masterUserSecrets,
    subnetGroup: rdsComponent.subnetGroup,
    parameterGroup: rdsComponent.parameterGroup,
  };
}

export function createSecureRdsInstance(
  name: string,
  args: SecureRdsInstanceArgs,
  opts?: pulumi.ComponentResourceOptions
): RdsInstanceResult {
  const secureRdsComponent = new SecureRdsInstanceComponent(name, args, opts);
  return {
    instance: secureRdsComponent.instance,
    instanceId: secureRdsComponent.instanceId,
    instanceArn: secureRdsComponent.instanceArn,
    endpoint: secureRdsComponent.endpoint,
    port: secureRdsComponent.port,
    address: secureRdsComponent.address,
    masterUserSecrets: secureRdsComponent.masterUserSecrets,
    subnetGroup: secureRdsComponent.subnetGroup,
    parameterGroup: secureRdsComponent.parameterGroup,
  };
}
