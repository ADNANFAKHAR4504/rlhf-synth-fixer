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

// Import nested stacks
import { Ec2Stack } from './stacks/ec2-stack';
import { EventBridgeStack } from './stacks/eventbridge-stack';
import { SecurityGroupStack } from './stacks/security-group-stack';
import { SnsStack } from './stacks/sns-stack';
import { VpcStack } from './stacks/vpc-stack';

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

  /**
   * CIDR block allowed to access the web server (HTTP/HTTPS)
   * Defaults to '203.0.113.0/24' as per requirements
   */
  allowedCidr?: string;

  /**
   * EC2 instance type for the web server
   * Defaults to 't3.micro'
   */
  instanceType?: string;
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of other resource-specific components
 * and manages the environment suffix used for naming and configuration.
 *
 * Note:
 * - DO NOT create resources directly here unless they are truly global.
 * - Use other components (e.g., VpcStack, Ec2Stack) for AWS resource definitions.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly securityGroupId: pulumi.Output<string>;
  public readonly instanceId: pulumi.Output<string>;
  public readonly instancePublicIp: pulumi.Output<string>;
  public readonly instancePrivateIp: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly eventBridgeRuleArn: pulumi.Output<string>;
  public readonly webServerUrl: pulumi.Output<string>;
  public readonly secureWebServerUrl: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args?: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args?.environmentSuffix || 'dev';
    const allowedCidr = args?.allowedCidr || '203.0.113.0/24';
    const instanceType = args?.instanceType || 't3.micro';
    const tags = args?.tags || {};

    // --- Instantiate Nested Components ---

    // 1. Create VPC infrastructure
    const vpcStack = new VpcStack(
      'tap-vpc',
      {
        environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // 2. Create SNS for security alerts
    const snsStack = new SnsStack(
      'tap-sns',
      {
        environmentSuffix,
        tags,
        alertEmail: 'paul.s@turing.com',
      },
      { parent: this }
    );

    // 3. Create Security Group with restrictive rules
    const securityGroupStack = new SecurityGroupStack(
      'tap-security-group',
      {
        environmentSuffix,
        tags,
        vpcId: vpcStack.vpcId,
        allowedCidr,
      },
      { parent: this }
    );

    // 4. Create EventBridge monitoring for security group changes
    const eventBridgeStack = new EventBridgeStack(
      'tap-eventbridge',
      {
        environmentSuffix,
        tags,
        securityGroupId: securityGroupStack.securityGroupId,
        snsTopicArn: snsStack.topicArn,
      },
      { parent: this }
    );

    // 5. Create EC2 instance with encrypted storage
    const ec2Stack = new Ec2Stack(
      'tap-ec2',
      {
        environmentSuffix,
        tags,
        vpcId: vpcStack.vpcId,
        subnetId: vpcStack.publicSubnetId,
        securityGroupId: securityGroupStack.securityGroupId,
        instanceType,
      },
      { parent: this }
    );

    // --- Expose Outputs from Nested Components ---
    this.vpcId = vpcStack.vpcId;
    this.securityGroupId = securityGroupStack.securityGroupId;
    this.instanceId = ec2Stack.instanceId;
    this.instancePublicIp = ec2Stack.publicIp;
    this.instancePrivateIp = ec2Stack.privateIp;
    this.snsTopicArn = snsStack.topicArn;
    this.eventBridgeRuleArn = eventBridgeStack.ruleArn;
    this.webServerUrl = pulumi.interpolate`http://${ec2Stack.publicIp}`;
    this.secureWebServerUrl = pulumi.interpolate`https://${ec2Stack.publicIp}`;

    // Register the outputs of this component
    this.registerOutputs({
      vpcId: this.vpcId,
      securityGroupId: this.securityGroupId,
      instanceId: this.instanceId,
      instancePublicIp: this.instancePublicIp,
      instancePrivateIp: this.instancePrivateIp,
      snsTopicArn: this.snsTopicArn,
      eventBridgeRuleArn: this.eventBridgeRuleArn,
      webServerUrl: this.webServerUrl,
      secureWebServerUrl: this.secureWebServerUrl,
    });
  }
}
