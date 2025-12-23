/**
 * CodeDeploy Stack - ECS blue-green deployments with automatic rollback
 *
 * This stack creates:
 * - CodeDeploy Application for ECS
 * - Deployment Group with blue-green deployment configuration
 * - Automatic rollback on failures
 * - Traffic shifting configuration
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface CodeDeployStackArgs {
  environmentSuffix: string;
  region: string;
  serviceRole: pulumi.Output<string>;
  ecsClusterName: pulumi.Input<string>;
  ecsServiceName: pulumi.Input<string>;
  ecsBlueTargetGroupName: pulumi.Input<string>;
  ecsGreenTargetGroupName: pulumi.Input<string>;
  albListenerArn: pulumi.Input<string>;
  snsTopicArn: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class CodeDeployStack extends pulumi.ComponentResource {
  public readonly applicationName: pulumi.Output<string>;
  public readonly applicationArn: pulumi.Output<string>;
  public readonly deploymentGroupName: pulumi.Output<string>;

  constructor(
    name: string,
    args: CodeDeployStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:cicd:CodeDeployStack', name, args, opts);

    // CodeDeploy Application
    const application = new aws.codedeploy.Application(
      `payment-service-app-${args.environmentSuffix}`,
      {
        name: `payment-service-app-${args.environmentSuffix}`,
        computePlatform: 'ECS',
        tags: args.tags,
      },
      { parent: this }
    );

    // Deployment Group
    const deploymentGroup = new aws.codedeploy.DeploymentGroup(
      `payment-service-dg-${args.environmentSuffix}`,
      {
        appName: application.name,
        deploymentGroupName: `payment-service-dg-${args.environmentSuffix}`,
        serviceRoleArn: args.serviceRole,
        deploymentConfigName: 'CodeDeployDefault.ECSAllAtOnce',

        // ECS Service Configuration
        ecsService: {
          clusterName: args.ecsClusterName,
          serviceName: args.ecsServiceName,
        },

        // Deployment Style (required for ECS)
        deploymentStyle: {
          deploymentOption: 'WITH_TRAFFIC_CONTROL',
          deploymentType: 'BLUE_GREEN',
        },

        // Blue/Green Deployment Configuration
        blueGreenDeploymentConfig: {
          deploymentReadyOption: {
            actionOnTimeout: 'CONTINUE_DEPLOYMENT',
            waitTimeInMinutes: 0,
          },
          terminateBlueInstancesOnDeploymentSuccess: {
            action: 'TERMINATE',
            terminationWaitTimeInMinutes: 5,
          },
        },

        // Load Balancer Configuration
        loadBalancerInfo: {
          targetGroupPairInfo: {
            prodTrafficRoute: {
              listenerArns: [args.albListenerArn],
            },
            targetGroups: [
              {
                name: args.ecsBlueTargetGroupName,
              },
              {
                name: args.ecsGreenTargetGroupName,
              },
            ],
          },
        },

        // Auto Rollback Configuration
        autoRollbackConfiguration: {
          enabled: true,
          events: ['DEPLOYMENT_FAILURE', 'DEPLOYMENT_STOP_ON_ALARM'],
        },

        // Alarm Configuration (optional)
        // alarmConfiguration: {
        //   enabled: true,
        //   alarms: [cloudwatchAlarm.name],
        //   ignorePollAlarmFailure: false,
        // },

        // Trigger Configuration for SNS
        triggerConfigurations: [
          {
            triggerEvents: [
              'DeploymentStart',
              'DeploymentSuccess',
              'DeploymentFailure',
              'DeploymentStop',
              'DeploymentRollback',
            ],
            triggerName: `deployment-trigger-${args.environmentSuffix}`,
            triggerTargetArn: args.snsTopicArn,
          },
        ],

        tags: args.tags,
      },
      { parent: this }
    );

    this.applicationName = application.name;
    this.applicationArn = application.arn;
    this.deploymentGroupName = deploymentGroup.deploymentGroupName;

    this.registerOutputs({
      applicationName: this.applicationName,
      applicationArn: this.applicationArn,
      deploymentGroupName: this.deploymentGroupName,
    });
  }
}
