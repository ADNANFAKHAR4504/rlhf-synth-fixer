/**
 * Elastic Beanstalk Infrastructure Component
 * Handles EB application, environment, and configuration
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import {
  ComponentResource,
  ComponentResourceOptions,
  Output,
} from '@pulumi/pulumi';

interface ElasticBeanstalkInfrastructureArgs {
  region: string;
  isPrimary: boolean;
  environment: string;
  environmentSuffix: string;
  vpcId: Output<string>;
  publicSubnetIds: Output<string>[];
  privateSubnetIds: Output<string>[];
  albSecurityGroupId: Output<string>;
  ebSecurityGroupId: Output<string>;
  ebServiceRoleArn: Output<string>;
  ebInstanceProfileName: Output<string>;
  tags: Record<string, string>;
}

export class ElasticBeanstalkInfrastructure extends ComponentResource {
  private readonly region: string;
  private readonly isPrimary: boolean;
  private readonly environment: string;
  private readonly environmentSuffix: string;
  private readonly tags: Record<string, string>;
  private readonly regionSuffix: string;
  private readonly isLocalStack: boolean;

  public readonly application: aws.elasticbeanstalk.Application;
  public readonly configTemplate: aws.elasticbeanstalk.ConfigurationTemplate;
  public readonly ebEnvironment: aws.elasticbeanstalk.Environment;

  constructor(
    name: string,
    args: ElasticBeanstalkInfrastructureArgs,
    opts?: ComponentResourceOptions
  ) {
    super('nova:infrastructure:ElasticBeanstalk', name, {}, opts);

    this.region = args.region;
    this.isPrimary = args.isPrimary;
    this.environment = args.environment;
    this.environmentSuffix = args.environmentSuffix;
    this.tags = args.tags;
    this.regionSuffix = args.region.replace(/-/g, '').replace(/gov/g, '');
    // Detect LocalStack environment to skip unsupported features like ListTagsForResource
    this.isLocalStack =
      !!process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
      !!process.env.AWS_ENDPOINT_URL?.includes('localstack');

    this.application = this.createApplication();
    this.configTemplate = this.createConfigurationTemplate(args);
    this.ebEnvironment = this.createEnvironment();

    this.registerOutputs({
      applicationName: this.application.name,
      environmentName: this.ebEnvironment.name,
      environmentUrl: this.ebEnvironment.endpointUrl,
      environmentCname: this.ebEnvironment.cname,
    });
  }

  /**
   * Create Elastic Beanstalk Application
   * Note: Tags are skipped for LocalStack as it doesn't support ListTagsForResource API
   */
  private createApplication(): aws.elasticbeanstalk.Application {
    return new aws.elasticbeanstalk.Application(
      `nova-app-${this.regionSuffix}`,
      {
        name: `nova-app-${this.regionSuffix}`,
        description: `Nova application for ${this.region}`,
        // Skip tags for LocalStack - ListTagsForResource not supported
        ...(this.isLocalStack ? {} : { tags: this.tags }),
      },
      { parent: this }
    );
  }

  /**
   * Get the current valid solution stack for Docker (verified 2025-08-19)
   */
  private getSolutionStackName(): string {
    // Using the latest available solution stack as of 2025-08-19
    // Retrieved via: aws elasticbeanstalk list-available-solution-stacks
    return '64bit Amazon Linux 2023 v4.6.3 running Docker';
  }

  /**
   * Create Configuration Template - MINIMAL FIX APPLIED
   */
  private createConfigurationTemplate(
    args: ElasticBeanstalkInfrastructureArgs
  ): aws.elasticbeanstalk.ConfigurationTemplate {
    // Convert subnet arrays to comma-separated strings
    const publicSubnetsString = pulumi
      .all(args.publicSubnetIds)
      .apply(subnets => {
        if (!subnets || subnets.length === 0) {
          console.warn(
            `Warning: No public subnets available for ${this.region}`
          );
          return '';
        }
        return subnets.join(',');
      });
    const privateSubnetsString = pulumi
      .all(args.privateSubnetIds)
      .apply(subnets => {
        if (!subnets || subnets.length === 0) {
          console.warn(
            `Warning: No private subnets available for ${this.region}`
          );
          return '';
        }
        return subnets.join(',');
      });

    const solutionStackName = this.getSolutionStackName();
    console.log(`Using Elastic Beanstalk solution stack: ${solutionStackName}`);

    return new aws.elasticbeanstalk.ConfigurationTemplate(
      `nova-config-${this.regionSuffix}`,
      {
        name: `nova-config-${this.regionSuffix}`,
        application: this.application.name,
        solutionStackName: solutionStackName,
        settings: [
          // VPC Configuration
          {
            namespace: 'aws:ec2:vpc',
            name: 'VPCId',
            value: args.vpcId,
          },
          {
            namespace: 'aws:ec2:vpc',
            name: 'Subnets',
            value: privateSubnetsString,
          },
          {
            namespace: 'aws:ec2:vpc',
            name: 'ELBSubnets',
            value: publicSubnetsString,
          },
          // Instance Configuration
          {
            namespace: 'aws:autoscaling:launchconfiguration',
            name: 'InstanceType',
            value: 't3.medium',
          },
          {
            namespace: 'aws:autoscaling:launchconfiguration',
            name: 'IamInstanceProfile',
            value: args.ebInstanceProfileName,
          },
          {
            namespace: 'aws:autoscaling:launchconfiguration',
            name: 'SecurityGroups',
            value: args.ebSecurityGroupId,
          },
          // Auto Scaling Configuration
          {
            namespace: 'aws:autoscaling:asg',
            name: 'MinSize',
            value: '2',
          },
          {
            namespace: 'aws:autoscaling:asg',
            name: 'MaxSize',
            value: '10',
          },
          // Load Balancer Configuration
          {
            namespace: 'aws:elasticbeanstalk:environment',
            name: 'EnvironmentType',
            value: 'LoadBalanced',
          },
          {
            namespace: 'aws:elasticbeanstalk:environment',
            name: 'LoadBalancerType',
            value: 'application',
          },
          {
            namespace: 'aws:elbv2:loadbalancer',
            name: 'SecurityGroups',
            value: args.albSecurityGroupId,
          },
          // Service Role
          {
            namespace: 'aws:elasticbeanstalk:environment',
            name: 'ServiceRole',
            value: args.ebServiceRoleArn,
          },
          // Health Check Configuration
          {
            namespace: 'aws:elasticbeanstalk:healthreporting:system',
            name: 'SystemType',
            value: 'enhanced',
          },
          // Rolling Updates
          {
            namespace: 'aws:autoscaling:updatepolicy:rollingupdate',
            name: 'RollingUpdateEnabled',
            value: 'true',
          },
          {
            namespace: 'aws:autoscaling:updatepolicy:rollingupdate',
            name: 'MaxBatchSize',
            value: '1',
          },
          {
            namespace: 'aws:autoscaling:updatepolicy:rollingupdate',
            name: 'MinInstancesInService',
            value: '1',
          },
        ],
        // Remove tags from here - not supported in v6.22.0
      },
      { parent: this }
    );
  }

  /**
   * Create Elastic Beanstalk Environment
   * Note: Tags are skipped for LocalStack as it doesn't support ListTagsForResource API
   */
  private createEnvironment(): aws.elasticbeanstalk.Environment {
    // Use deterministic naming based on environment suffix (no random components)
    const envName = `nova-env-${this.regionSuffix}-${this.environmentSuffix}`;

    console.log(`Creating Elastic Beanstalk environment: ${envName}`);

    return new aws.elasticbeanstalk.Environment(
      `nova-env-${this.regionSuffix}`,
      {
        name: envName,
        application: this.application.name,
        templateName: this.configTemplate.name,
        tier: 'WebServer',
        // Skip tags for LocalStack - ListTagsForResource not supported
        ...(this.isLocalStack ? {} : { tags: this.tags }),
      },
      { parent: this }
    );
  }

  // Property getters for easy access
  public get applicationName(): Output<string> {
    return this.application.name;
  }

  public get environmentName(): Output<string> {
    return this.ebEnvironment.name;
  }

  public get environmentUrl(): Output<string> {
    return this.ebEnvironment.endpointUrl;
  }

  public get environmentCname(): Output<string> {
    return this.ebEnvironment.cname;
  }
}
