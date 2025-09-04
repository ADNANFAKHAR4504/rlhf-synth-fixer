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
import { createInfrastructure } from './infrastructure';

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
  // Infrastructure outputs
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];
  public readonly internetGatewayId: pulumi.Output<string>;
  public readonly securityGroupId: pulumi.Output<string>;
  public readonly ec2InstanceId: pulumi.Output<string>;
  public readonly ec2InstancePublicIp: pulumi.Output<string>;
  public readonly ec2InstancePublicDns: pulumi.Output<string>;
  public readonly cloudTrailArn: pulumi.Output<string>;
  public readonly guardDutyDetectorId: pulumi.Output<string>;
  public readonly natGatewayId: pulumi.Output<string>;
  public readonly vpcFlowLogId: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';

    // Configuration for the infrastructure
    const config = new pulumi.Config();
    // Default to more restrictive CIDR - users should configure their specific IPs
    const allowedSshCidrs = config.getObject<string[]>('allowedSshCidrs') || [
      '203.26.56.90/32', // Single IP instead of entire /24 subnet
    ];
    const instanceType = config.get('instanceType') || 't3.micro';
    const region = config.get('aws:region') || 'ap-south-1';
    const existingRecorderName = config.get('existingRecorderName');
    const existingDeliveryChannelName = config.get(
      'existingDeliveryChannelName'
    );

    // Create the complete infrastructure
    const infrastructure = createInfrastructure(
      environmentSuffix,
      allowedSshCidrs,
      instanceType,
      region,
      existingRecorderName,
      existingDeliveryChannelName
    );

    // Assign outputs
    this.vpcId = infrastructure.vpcId;
    this.publicSubnetIds = infrastructure.publicSubnetIds;
    this.privateSubnetIds = infrastructure.privateSubnetIds;
    this.internetGatewayId = infrastructure.internetGatewayId;
    this.securityGroupId = infrastructure.securityGroupId;
    this.ec2InstanceId = infrastructure.ec2InstanceId;
    this.ec2InstancePublicIp = infrastructure.ec2InstancePublicIp;
    this.ec2InstancePublicDns = infrastructure.ec2InstancePublicDns;
    this.cloudTrailArn = infrastructure.cloudTrailArn;
    this.guardDutyDetectorId = infrastructure.guardDutyDetectorId;
    this.natGatewayId = infrastructure.natGatewayId;
    this.vpcFlowLogId = infrastructure.vpcFlowLogId;

    // Register the outputs of this component.
    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      internetGatewayId: this.internetGatewayId,
      securityGroupId: this.securityGroupId,
      ec2InstanceId: this.ec2InstanceId,
      ec2InstancePublicIp: this.ec2InstancePublicIp,
      ec2InstancePublicDns: this.ec2InstancePublicDns,
      cloudTrailArn: this.cloudTrailArn,
      guardDutyDetectorId: this.guardDutyDetectorId,
      natGatewayId: this.natGatewayId,
      vpcFlowLogId: this.vpcFlowLogId,
    });
  }
}
