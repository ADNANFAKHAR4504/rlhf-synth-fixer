import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DataStack } from './data-stack';
import { ComputeStack } from './compute-stack';
import { ApiStack } from './api-stack';
import { OrchestrationStack } from './orchestration-stack';
import { MonitoringStack } from './monitoring-stack';

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

    // Create Data Stack (DynamoDB, SQS, SNS, Kinesis, S3)
    const dataStack = new DataStack(this, 'DataStack', {
      stackName: `TapStack${environmentSuffix}DataStack`,
      environmentSuffix,
      env: props?.env,
    });

    // Create Compute Stack (Lambda functions, CodeDeploy)
    const computeStack = new ComputeStack(this, 'ComputeStack', {
      stackName: `TapStack${environmentSuffix}ComputeStack`,
      environmentSuffix,
      tradingPatternsTable: dataStack.tradingPatternsTable,
      approvalTrackingTable: dataStack.approvalTrackingTable,
      alertQueue: dataStack.alertQueue,
      pendingApprovalsQueue: dataStack.pendingApprovalsQueue,
      tradingAlertsTopic: dataStack.tradingAlertsTopic,
      alertApprovalTopic: dataStack.alertApprovalTopic,
      marketDataStream: dataStack.marketDataStream,
      env: props?.env,
    });
    computeStack.addDependency(dataStack);

    // Create API Stack (API Gateway, WAF)
    const apiStack = new ApiStack(this, 'ApiStack', {
      stackName: `TapStack${environmentSuffix}ApiStack`,
      environmentSuffix,
      patternDetectorFunction: computeStack.patternDetectorFunction,
      approvalProcessorFunction: computeStack.approvalProcessorFunction,
      wafLogBucket: dataStack.wafLogBucket,
      env: props?.env,
    });
    apiStack.addDependency(computeStack);

    // Create Orchestration Stack (Step Functions, EventBridge)
    const orchestrationStack = new OrchestrationStack(
      this,
      'OrchestrationStack',
      {
        stackName: `TapStack${environmentSuffix}OrchestrationStack`,
        environmentSuffix,
        thresholdCheckerFunction: computeStack.thresholdCheckerFunction,
        patternDetectorFunction: computeStack.patternDetectorFunction,
        env: props?.env,
      }
    );
    orchestrationStack.addDependency(computeStack);

    // Create Monitoring Stack (CloudWatch Dashboard, Alarms)
    const monitoringStack = new MonitoringStack(this, 'MonitoringStack', {
      stackName: `TapStack${environmentSuffix}MonitoringStack`,
      environmentSuffix,
      api: apiStack.api,
      patternDetectorFunction: computeStack.patternDetectorFunction,
      alertProcessorFunction: computeStack.alertProcessorFunction,
      thresholdCheckerFunction: computeStack.thresholdCheckerFunction,
      kinesisConsumerFunction: computeStack.kinesisConsumerFunction,
      approvalProcessorFunction: computeStack.approvalProcessorFunction,
      tradingPatternsTable: dataStack.tradingPatternsTable,
      alertQueue: dataStack.alertQueue,
      patternAnalysisWorkflow: orchestrationStack.patternAnalysisWorkflow,
      marketDataStream: dataStack.marketDataStream,
      webAclArn: apiStack.webAclArn,
      env: props?.env,
    });
    monitoringStack.addDependency(apiStack);
    monitoringStack.addDependency(orchestrationStack);

    // Add tags to all stacks
    cdk.Tags.of(this).add('Project', 'StockPatternDetection');
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('CostCenter', 'Trading');

    // Expose all nested stack outputs in main stack for flat-outputs.json
    // Note: exportName intentionally omitted to avoid conflicts with nested stack exports
    // Nested stacks already export these values with the same names

    // DataStack outputs
    new cdk.CfnOutput(this, 'AlertQueueUrl', {
      value: dataStack.alertQueue.queueUrl,
      description: 'SQS AlertQueue URL',
    });

    new cdk.CfnOutput(this, 'PendingApprovalsQueueUrl', {
      value: dataStack.pendingApprovalsQueue.queueUrl,
      description: 'SQS PendingApprovals queue URL',
    });

    new cdk.CfnOutput(this, 'KinesisStreamArn', {
      value: dataStack.marketDataStream.streamArn,
      description: 'Kinesis stream ARN',
    });

    // ComputeStack outputs
    new cdk.CfnOutput(this, 'LiveAliasArn', {
      value: computeStack.liveAlias.functionArn,
      description: 'Lambda live alias ARN',
    });

    new cdk.CfnOutput(this, 'DeploymentGroupName', {
      value: computeStack.deploymentGroup.deploymentGroupName,
      description: 'CodeDeploy deployment group name',
    });

    // ApiStack outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: apiStack.apiUrl,
      description: 'API Gateway main endpoint URL',
    });

    new cdk.CfnOutput(this, 'CanaryApiUrl', {
      value: apiStack.canaryApiUrl,
      description: 'API Gateway canary endpoint URL',
    });

    new cdk.CfnOutput(this, 'ApprovalApiUrl', {
      value: apiStack.approvalApiUrl,
      description: 'Approval API endpoint URL',
    });

    new cdk.CfnOutput(this, 'WebAclArn', {
      value: apiStack.webAclArn,
      description: 'WAF WebACL ARN',
    });

    // OrchestrationStack outputs
    new cdk.CfnOutput(this, 'PatternAnalysisWorkflowArn', {
      value: orchestrationStack.patternAnalysisWorkflow.stateMachineArn,
      description: 'Step Functions PatternAnalysisWorkflow ARN',
    });

    new cdk.CfnOutput(this, 'PowerTuningWorkflowArn', {
      value: orchestrationStack.powerTuningWorkflow.stateMachineArn,
      description: 'Step Functions PowerTuningWorkflow ARN',
    });

    // MonitoringStack outputs
    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: monitoringStack.dashboardUrl,
      description: 'CloudWatch Dashboard URL',
    });
  }
}
