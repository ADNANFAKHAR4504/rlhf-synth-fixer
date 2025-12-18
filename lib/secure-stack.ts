/**
 * secure-stack.ts
 *
 * This module defines the SecureStack class that contains all the multi-region
 * infrastructure components including KMS, VPC, RDS, Load Balancer, and Auto Scaling.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { primaryRegion, secondaryRegion } from './config';
import { KmsStack } from './kms';
import { VpcStack } from './vpc';
import { SecurityGroupsStack } from './security-groups';
import { RdsStack } from './rds';
import { LoadBalancerStack } from './load-balancer';
import { AutoScalingStack } from './auto-scaling';
import { MonitoringStack } from './monitoring';
import { LoggingStack } from './logging';
import { WafShieldStack } from './waf-shield';

/**
 * SecureStackArgs defines the input arguments for the SecureStack component.
 */
export interface SecureStackArgs {
  /**
   * The deployment environment (e.g., 'dev', 'prod').
   */
  environment: string;

  /**
   * Tags to apply to resources.
   */
  tags: Record<string, string>;
}

/**
 * Represents the secure multi-region infrastructure stack.
 *
 * This component orchestrates all the infrastructure components including
 * KMS encryption, VPC networking, RDS databases, load balancing, and auto scaling.
 */
export class SecureStack extends pulumi.ComponentResource {
  public readonly kmsStack: KmsStack;
  public readonly vpcStack: VpcStack;
  public readonly securityGroupsStack: SecurityGroupsStack;
  public readonly rdsStack: RdsStack;
  public readonly loadBalancerStack: LoadBalancerStack;
  public readonly autoScalingStack: AutoScalingStack;
  public readonly monitoringStack: MonitoringStack;
  public readonly loggingStack: LoggingStack;
  public readonly wafShieldStack: WafShieldStack;

  /**
   * Creates a new SecureStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: SecureStackArgs, opts?: ResourceOptions) {
    super('tap:secure:SecureStack', name, args, opts);

    // Input validation
    if (
      !args ||
      !args.environment ||
      typeof args.environment !== 'string' ||
      args.environment.trim() === ''
    ) {
      throw new Error('Environment must be a non-empty string');
    }
    if (!args.tags || typeof args.tags !== 'object') {
      throw new Error('Tags must be a valid object');
    }

    const { environment, tags } = args;

    // Create KMS stack for encryption
    this.kmsStack = new KmsStack(
      `${environment}-kms`,
      { environment, tags },
      { parent: this }
    );

    // Create VPC stack for networking
    this.vpcStack = new VpcStack(
      `${environment}-vpc`,
      { environment, tags },
      { parent: this }
    );

    // Create security groups stack
    this.securityGroupsStack = new SecurityGroupsStack(
      `${environment}-security-groups`,
      {
        environment,
        tags,
        vpcStack: this.vpcStack,
      },
      { parent: this }
    );

    // Create RDS stack for database
    this.rdsStack = new RdsStack(
      `${environment}-rds`,
      {
        environment,
        tags,
        vpcStack: this.vpcStack,
        securityGroupsStack: this.securityGroupsStack,
        kmsStack: this.kmsStack,
      },
      { parent: this }
    );

    // Create load balancer stack
    this.loadBalancerStack = new LoadBalancerStack(
      `${environment}-load-balancer`,
      {
        environment,
        tags,
        vpcStack: this.vpcStack,
        securityGroupsStack: this.securityGroupsStack,
      },
      { parent: this }
    );

    // Create auto scaling stack
    this.autoScalingStack = new AutoScalingStack(
      `${environment}-auto-scaling`,
      {
        environment,
        tags,
        vpcStack: this.vpcStack,
        securityGroupsStack: this.securityGroupsStack,
        loadBalancerStack: this.loadBalancerStack,
      },
      { parent: this }
    );

    // Create logging stack
    this.loggingStack = new LoggingStack(
      `${environment}-logging`,
      {
        environment,
        tags,
        vpcStack: this.vpcStack,
        loadBalancerStack: this.loadBalancerStack,
      },
      { parent: this }
    );

    // Create WAF and Shield stack
    this.wafShieldStack = new WafShieldStack(
      `${environment}-waf-shield`,
      {
        environment,
        tags,
        loadBalancerStack: this.loadBalancerStack,
      },
      { parent: this }
    );

    // Create monitoring stack
    this.monitoringStack = new MonitoringStack(
      `${environment}-monitoring`,
      {
        environment,
        tags,
        rdsStack: this.rdsStack,
        autoScalingStack: this.autoScalingStack,
        loadBalancerStack: this.loadBalancerStack,
      },
      { parent: this }
    );

    // Register the outputs of this component
    this.registerOutputs({
      primaryRegion: primaryRegion,
      secondaryRegion: secondaryRegion,

      // VPC Information
      primaryVpcId: this.vpcStack.primaryVpc.id,
      primaryVpcCidr: this.vpcStack.primaryVpc.cidrBlock,
      secondaryVpcId: this.vpcStack.secondaryVpc.id,
      secondaryVpcCidr: this.vpcStack.secondaryVpc.cidrBlock,

      // KMS Keys
      primaryKmsKeyId: this.kmsStack.primaryKmsKey.keyId,
      primaryKmsKeyArn: this.kmsStack.primaryKmsKey.arn,
      secondaryKmsKeyId: this.kmsStack.secondaryKmsKey.keyId,
      secondaryKmsKeyArn: this.kmsStack.secondaryKmsKey.arn,

      // RDS Information
      primaryDbEndpoint: this.rdsStack.primaryRdsInstance.endpoint,
      primaryDbPort: this.rdsStack.primaryRdsInstance.port,
      /* istanbul ignore next -- @preserve secondaryRdsReadReplica only exists in non-LocalStack environments */
      ...(this.rdsStack.secondaryRdsReadReplica
        ? {
            secondaryDbEndpoint: this.rdsStack.secondaryRdsReadReplica.endpoint,
            secondaryDbPort: this.rdsStack.secondaryRdsReadReplica.port,
          }
        : {}),

      // Load Balancer
      loadBalancerDnsName:
        this.loadBalancerStack.applicationLoadBalancer.dnsName,
      loadBalancerZoneId: this.loadBalancerStack.applicationLoadBalancer.zoneId,

      // Auto Scaling Group
      autoScalingGroupName: this.autoScalingStack.autoScalingGroup.name,
      autoScalingGroupArn: this.autoScalingStack.autoScalingGroup.arn,

      // Monitoring
      snsTopicArn: this.monitoringStack.snsTopicArn,
      snsTopicName: this.monitoringStack.snsTopicName,

      // Logging
      cloudTrailArn: this.loggingStack.cloudTrailArn,
      cloudTrailName: this.loggingStack.cloudTrailName,
      logBucketName: this.loggingStack.logBucketName,
      flowLogsRoleName: this.loggingStack.flowLogsRoleName,
      flowLogsPolicyName: this.loggingStack.flowLogsPolicyName,
      vpcLogGroupName: this.loggingStack.vpcLogGroupName,

      // WAF & Shield
      webAclArn: this.wafShieldStack.webAclArn,
      webAclName: this.wafShieldStack.webAclName,
      webAclId: this.wafShieldStack.webAclId,
    });
  }
}
