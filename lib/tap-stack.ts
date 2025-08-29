/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * It orchestrates the instantiation of other resource-specific components
 * and manages environment-specific configurations.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { ProductionInfrastructure } from './production-infrastructure';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of other resource-specific components
 * and manages the environment suffix used for naming and configuration.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly s3BucketName: pulumi.Output<string>;
  public readonly rdsEndpoint: pulumi.Output<string>;
  public readonly natGatewayIp: pulumi.Output<string>;
  public readonly albArn: pulumi.Output<string>;
  public readonly targetGroupArn: pulumi.Output<string>;
  public readonly autoScalingGroupName: pulumi.Output<string>;
  public readonly kmsKeyId: pulumi.Output<string>;
  public readonly ec2SecurityGroupId: pulumi.Output<string>;
  public readonly rdsSecurityGroupId: pulumi.Output<string>;
  public readonly albSecurityGroupId: pulumi.Output<string>;
  public readonly rdsInstanceId: pulumi.Output<string>;
  public readonly launchTemplateId: pulumi.Output<string>;
  public readonly vpcFlowLogGroupName: pulumi.Output<string>;
  public readonly cpuAlarmHighName: pulumi.Output<string>;
  public readonly cpuAlarmLowName: pulumi.Output<string>;
  public readonly rdsConnectionsAlarmName: pulumi.Output<string>;
  public readonly rdsCpuAlarmName: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    // Create the production infrastructure
    const environment = args.environmentSuffix || 'dev';
    const infrastructure = ProductionInfrastructure.create(environment);
    const outputs = infrastructure.getOutputs();

    // Expose outputs from the infrastructure
    this.vpcId = outputs.vpcId;
    this.publicSubnetIds = pulumi
      .all(outputs.publicSubnetIds)
      .apply(ids => ids);
    this.privateSubnetIds = pulumi
      .all(outputs.privateSubnetIds)
      .apply(ids => ids);
    this.albDnsName = outputs.albDnsName;
    this.s3BucketName = outputs.s3BucketName;
    this.rdsEndpoint = outputs.rdsEndpoint;
    this.natGatewayIp = outputs.natGatewayIp;
    // Additional outputs
    this.albArn = outputs.albArn;
    this.targetGroupArn = outputs.targetGroupArn;
    this.autoScalingGroupName = outputs.autoScalingGroupName;
    this.kmsKeyId = outputs.kmsKeyId;
    this.ec2SecurityGroupId = outputs.ec2SecurityGroupId;
    this.rdsSecurityGroupId = outputs.rdsSecurityGroupId;
    this.albSecurityGroupId = outputs.albSecurityGroupId;
    this.rdsInstanceId = outputs.rdsInstanceId;
    this.launchTemplateId = outputs.launchTemplateId;
    this.vpcFlowLogGroupName = outputs.vpcFlowLogGroupName;
    this.cpuAlarmHighName = outputs.cpuAlarmHighName;
    this.cpuAlarmLowName = outputs.cpuAlarmLowName;
    this.rdsConnectionsAlarmName = outputs.rdsConnectionsAlarmName;
    this.rdsCpuAlarmName = outputs.rdsCpuAlarmName;

    // Register the outputs of this component
    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      albDnsName: this.albDnsName,
      s3BucketName: this.s3BucketName,
      rdsEndpoint: this.rdsEndpoint,
      natGatewayIp: this.natGatewayIp,
      albArn: this.albArn,
      targetGroupArn: this.targetGroupArn,
      autoScalingGroupName: this.autoScalingGroupName,
      kmsKeyId: this.kmsKeyId,
      ec2SecurityGroupId: this.ec2SecurityGroupId,
      rdsSecurityGroupId: this.rdsSecurityGroupId,
      albSecurityGroupId: this.albSecurityGroupId,
      rdsInstanceId: this.rdsInstanceId,
      launchTemplateId: this.launchTemplateId,
      vpcFlowLogGroupName: this.vpcFlowLogGroupName,
      cpuAlarmHighName: this.cpuAlarmHighName,
      cpuAlarmLowName: this.cpuAlarmLowName,
      rdsConnectionsAlarmName: this.rdsConnectionsAlarmName,
      rdsCpuAlarmName: this.rdsCpuAlarmName,
    });
  }
}
