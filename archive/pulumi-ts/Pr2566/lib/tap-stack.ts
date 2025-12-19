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
   * AWS region for deployment.
   * Defaults to 'ap-south-1' if not provided.
   */
  region?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Infrastructure outputs interface to reduce repetitive property declarations.
 */
interface InfrastructureOutputs {
  vpcId: pulumi.Output<string>;
  publicSubnetIds: pulumi.Output<string[]>;
  privateSubnetIds: pulumi.Output<string[]>;
  albDnsName: pulumi.Output<string>;
  s3BucketName: pulumi.Output<string>;
  rdsEndpoint: pulumi.Output<string>;
  natGatewayIp: pulumi.Output<string>;
  albArn: pulumi.Output<string>;
  targetGroupArn: pulumi.Output<string>;
  autoScalingGroupName: pulumi.Output<string>;
  kmsKeyId: pulumi.Output<string>;
  ec2SecurityGroupId: pulumi.Output<string>;
  rdsSecurityGroupId: pulumi.Output<string>;
  albSecurityGroupId: pulumi.Output<string>;
  rdsInstanceId: pulumi.Output<string>;
  launchTemplateId: pulumi.Output<string>;
  vpcFlowLogGroupName: pulumi.Output<string>;
  cpuAlarmHighName: pulumi.Output<string>;
  cpuAlarmLowName: pulumi.Output<string>;
  rdsConnectionsAlarmName: pulumi.Output<string>;
  rdsCpuAlarmName: pulumi.Output<string>;
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of other resource-specific components
 * and manages the environment suffix used for naming and configuration.
 */
export class TapStack
  extends pulumi.ComponentResource
  implements InfrastructureOutputs
{
  public readonly vpcId!: pulumi.Output<string>;
  public readonly publicSubnetIds!: pulumi.Output<string[]>;
  public readonly privateSubnetIds!: pulumi.Output<string[]>;
  public readonly albDnsName!: pulumi.Output<string>;
  public readonly s3BucketName!: pulumi.Output<string>;
  public readonly rdsEndpoint!: pulumi.Output<string>;
  public readonly natGatewayIp!: pulumi.Output<string>;
  public readonly albArn!: pulumi.Output<string>;
  public readonly targetGroupArn!: pulumi.Output<string>;
  public readonly autoScalingGroupName!: pulumi.Output<string>;
  public readonly kmsKeyId!: pulumi.Output<string>;
  public readonly ec2SecurityGroupId!: pulumi.Output<string>;
  public readonly rdsSecurityGroupId!: pulumi.Output<string>;
  public readonly albSecurityGroupId!: pulumi.Output<string>;
  public readonly rdsInstanceId!: pulumi.Output<string>;
  public readonly launchTemplateId!: pulumi.Output<string>;
  public readonly vpcFlowLogGroupName!: pulumi.Output<string>;
  public readonly cpuAlarmHighName!: pulumi.Output<string>;
  public readonly cpuAlarmLowName!: pulumi.Output<string>;
  public readonly rdsConnectionsAlarmName!: pulumi.Output<string>;
  public readonly rdsCpuAlarmName!: pulumi.Output<string>;

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
    const region = 'ap-south-1';
    const infrastructure = ProductionInfrastructure.create(environment, region);
    const outputs = infrastructure.getOutputs();

    // Expose outputs from the infrastructure
    Object.assign(this, {
      vpcId: outputs.vpcId,
      publicSubnetIds: outputs.publicSubnetIds,
      privateSubnetIds: outputs.privateSubnetIds,
      albDnsName: outputs.albDnsName,
      s3BucketName: outputs.s3BucketName,
      rdsEndpoint: outputs.rdsEndpoint,
      natGatewayIp: outputs.natGatewayIp,
      albArn: outputs.albArn,
      targetGroupArn: outputs.targetGroupArn,
      autoScalingGroupName: outputs.autoScalingGroupName,
      kmsKeyId: outputs.kmsKeyId,
      ec2SecurityGroupId: outputs.ec2SecurityGroupId,
      rdsSecurityGroupId: outputs.rdsSecurityGroupId,
      albSecurityGroupId: outputs.albSecurityGroupId,
      rdsInstanceId: outputs.rdsInstanceId,
      launchTemplateId: outputs.launchTemplateId,
      vpcFlowLogGroupName: outputs.vpcFlowLogGroupName,
      cpuAlarmHighName: outputs.cpuAlarmHighName,
      cpuAlarmLowName: outputs.cpuAlarmLowName,
      rdsConnectionsAlarmName: outputs.rdsConnectionsAlarmName,
      rdsCpuAlarmName: outputs.rdsCpuAlarmName,
    });

    // Register the outputs of this component
    this.registerOutputs(outputs);
  }
}
