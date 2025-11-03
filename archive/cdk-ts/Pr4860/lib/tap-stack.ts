import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { EcsTradingInfra } from './ecs_trading_infra';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create a VPC for the infrastructure
    const vpc = new ec2.Vpc(this, `TradingVPC${environmentSuffix}`, {
      maxAzs: 3,
      natGateways: 3,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // Create the ECS Trading Infrastructure
    const tradingInfra = new EcsTradingInfra(
      this,
      `EcsTradingInfra${environmentSuffix}`,
      {
        vpc,
      }
    );

    // ========== STACK OUTPUTS FOR INTEGRATION TESTING ==========

    // VPC Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID for the trading infrastructure',
      exportName: `${this.stackName}-VpcId`,
    });

    // ECS Cluster Outputs
    new cdk.CfnOutput(this, 'EcsClusterName', {
      value: tradingInfra.ecsCluster.clusterName,
      description: 'ECS Cluster name for OrderBroker service',
      exportName: `${this.stackName}-EcsClusterName`,
    });

    new cdk.CfnOutput(this, 'EcsClusterArn', {
      value: tradingInfra.ecsCluster.clusterArn,
      description: 'ECS Cluster ARN for OrderBroker service',
      exportName: `${this.stackName}-EcsClusterArn`,
    });

    // ECS Service Outputs
    new cdk.CfnOutput(this, 'EcsServiceName', {
      value: tradingInfra.orderBrokerService.serviceName,
      description: 'ECS Service name for OrderBroker',
      exportName: `${this.stackName}-EcsServiceName`,
    });

    new cdk.CfnOutput(this, 'EcsServiceArn', {
      value: tradingInfra.orderBrokerService.serviceArn,
      description: 'ECS Service ARN for OrderBroker',
      exportName: `${this.stackName}-EcsServiceArn`,
    });

    // Load Balancer Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDnsName', {
      value: tradingInfra.loadBalancer.loadBalancerDnsName,
      description: 'ALB DNS name for accessing OrderBroker service',
      exportName: `${this.stackName}-LoadBalancerDnsName`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerArn', {
      value: tradingInfra.loadBalancer.loadBalancerArn,
      description: 'ALB ARN for OrderBroker service',
      exportName: `${this.stackName}-LoadBalancerArn`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerUrl', {
      value: `http://${tradingInfra.loadBalancer.loadBalancerDnsName}`,
      description: 'Full URL to access OrderBroker service',
    });

    // Target Group Outputs
    new cdk.CfnOutput(this, 'BlueTargetGroupArn', {
      value: tradingInfra.blueTargetGroup.targetGroupArn,
      description: 'Blue target group ARN for blue-green deployments',
      exportName: `${this.stackName}-BlueTargetGroupArn`,
    });

    new cdk.CfnOutput(this, 'BlueTargetGroupName', {
      value: tradingInfra.blueTargetGroup.targetGroupName,
      description: 'Blue target group name',
      exportName: `${this.stackName}-BlueTargetGroupName`,
    });

    new cdk.CfnOutput(this, 'GreenTargetGroupArn', {
      value: tradingInfra.greenTargetGroup.targetGroupArn,
      description: 'Green target group ARN for blue-green deployments',
      exportName: `${this.stackName}-GreenTargetGroupArn`,
    });

    new cdk.CfnOutput(this, 'GreenTargetGroupName', {
      value: tradingInfra.greenTargetGroup.targetGroupName,
      description: 'Green target group name',
      exportName: `${this.stackName}-GreenTargetGroupName`,
    });

    // Listener Outputs
    new cdk.CfnOutput(this, 'ProductionListenerArn', {
      value: tradingInfra.productionListener.listenerArn,
      description: 'Production listener ARN (port 80)',
      exportName: `${this.stackName}-ProductionListenerArn`,
    });

    new cdk.CfnOutput(this, 'TestListenerArn', {
      value: tradingInfra.testListener.listenerArn,
      description: 'Test listener ARN (port 9090) for blue-green deployments',
      exportName: `${this.stackName}-TestListenerArn`,
    });

    // CodeDeploy Outputs
    new cdk.CfnOutput(this, 'CodeDeployApplicationName', {
      value: tradingInfra.codeDeployApplication.applicationName,
      description: 'CodeDeploy application name for OrderBroker',
      exportName: `${this.stackName}-CodeDeployApplicationName`,
    });

    new cdk.CfnOutput(this, 'CodeDeployDeploymentGroupName', {
      value: tradingInfra.deploymentGroup.deploymentGroupName,
      description:
        'CodeDeploy deployment group name for blue-green deployments',
      exportName: `${this.stackName}-CodeDeployDeploymentGroupName`,
    });

    new cdk.CfnOutput(this, 'CodeDeployDeploymentGroupArn', {
      value: tradingInfra.deploymentGroup.deploymentGroupArn,
      description: 'CodeDeploy deployment group ARN',
      exportName: `${this.stackName}-CodeDeployDeploymentGroupArn`,
    });

    // CloudWatch Outputs
    new cdk.CfnOutput(this, 'LogGroupName', {
      value: tradingInfra.logGroup.logGroupName,
      description: 'CloudWatch log group name for OrderBroker service',
      exportName: `${this.stackName}-LogGroupName`,
    });

    new cdk.CfnOutput(this, 'LogGroupArn', {
      value: tradingInfra.logGroup.logGroupArn,
      description: 'CloudWatch log group ARN',
      exportName: `${this.stackName}-LogGroupArn`,
    });

    // SNS Outputs
    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: tradingInfra.alarmTopic.topicArn,
      description: 'SNS topic ARN for CloudWatch alarms',
      exportName: `${this.stackName}-AlarmTopicArn`,
    });

    new cdk.CfnOutput(this, 'AlarmTopicName', {
      value: tradingInfra.alarmTopic.topicName,
      description: 'SNS topic name for CloudWatch alarms',
      exportName: `${this.stackName}-AlarmTopicName`,
    });

    // Region Output
    new cdk.CfnOutput(this, 'DeploymentRegion', {
      value: this.region,
      description: 'AWS region where infrastructure is deployed',
    });

    // Environment Suffix Output
    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix for this deployment',
    });
  }
}
