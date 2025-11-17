import * as cdk from 'aws-cdk-lib';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface OrchestrationStackProps extends cdk.StackProps {
  environmentSuffix: string;
  thresholdCheckerFunction: lambda.Function;
  patternDetectorFunction: lambda.Function;
}

export class OrchestrationStack extends cdk.Stack {
  public readonly patternAnalysisWorkflow: sfn.StateMachine;
  public readonly powerTuningWorkflow: sfn.StateMachine;

  constructor(scope: Construct, id: string, props: OrchestrationStackProps) {
    super(scope, id, props);

    const {
      environmentSuffix,
      thresholdCheckerFunction,
      patternDetectorFunction,
    } = props;

    // Create Log Group for State Machine
    const stateMachineLogGroup = new logs.LogGroup(
      this,
      'StateMachineLogGroup',
      {
        logGroupName: `/aws/stepfunctions/pattern-analysis-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Define the Pattern Analysis Workflow
    // State 1: Data Validation
    const dataValidation = new tasks.LambdaInvoke(this, 'DataValidation', {
      lambdaFunction: patternDetectorFunction,
      payload: sfn.TaskInput.fromObject({
        action: 'validate',
        'data.$': '$.data',
      }),
      outputPath: '$.Payload',
      retryOnServiceExceptions: true,
    });

    // State 2: Pattern Detection with Parallel processing
    const headAndShouldersDetection = new tasks.LambdaInvoke(
      this,
      'HeadAndShouldersDetection',
      {
        lambdaFunction: patternDetectorFunction,
        payload: sfn.TaskInput.fromObject({
          action: 'detect',
          patternType: 'head-and-shoulders',
          'data.$': '$.validatedData',
        }),
        outputPath: '$.Payload',
      }
    );

    const doubleTopDetection = new tasks.LambdaInvoke(
      this,
      'DoubleTopDetection',
      {
        lambdaFunction: patternDetectorFunction,
        payload: sfn.TaskInput.fromObject({
          action: 'detect',
          patternType: 'double-top',
          'data.$': '$.validatedData',
        }),
        outputPath: '$.Payload',
      }
    );

    const ascendingTriangleDetection = new tasks.LambdaInvoke(
      this,
      'AscendingTriangleDetection',
      {
        lambdaFunction: patternDetectorFunction,
        payload: sfn.TaskInput.fromObject({
          action: 'detect',
          patternType: 'ascending-triangle',
          'data.$': '$.validatedData',
        }),
        outputPath: '$.Payload',
      }
    );

    const parallelPatternDetection = new sfn.Parallel(
      this,
      'ParallelPatternDetection',
      {
        resultPath: '$.detectionResults',
      }
    )
      .branch(headAndShouldersDetection)
      .branch(doubleTopDetection)
      .branch(ascendingTriangleDetection);

    // State 3: Confidence Scoring
    const confidenceScoring = new tasks.LambdaInvoke(
      this,
      'ConfidenceScoring',
      {
        lambdaFunction: patternDetectorFunction,
        payload: sfn.TaskInput.fromObject({
          action: 'score',
          'patterns.$': '$.detectionResults',
        }),
        outputPath: '$.Payload',
        retryOnServiceExceptions: true,
      }
    );

    // State 4: Alert Decision
    const alertDecision = new tasks.LambdaInvoke(this, 'AlertDecision', {
      lambdaFunction: patternDetectorFunction,
      payload: sfn.TaskInput.fromObject({
        action: 'decide',
        'scoredPatterns.$': '$.scoredPatterns',
      }),
      outputPath: '$.Payload',
    });

    // Success state
    const successState = new sfn.Succeed(this, 'AnalysisComplete');

    // Failure state - send to manual review
    const manualReviewState = new sfn.Pass(this, 'SendToManualReview', {
      result: sfn.Result.fromObject({ status: 'manual_review_required' }),
    });

    // Define retry logic with exponential backoff
    const retryPolicy: sfn.RetryProps[] = [
      {
        errors: ['States.TaskFailed', 'States.Timeout'],
        interval: cdk.Duration.seconds(2),
        maxAttempts: 3,
        backoffRate: 2.0,
      },
    ];

    // Add retry logic to states
    dataValidation.addRetry(...retryPolicy);
    confidenceScoring.addRetry(...retryPolicy);

    // Add catch states with fallback
    dataValidation.addCatch(manualReviewState, {
      errors: ['States.ALL'],
      resultPath: '$.error',
    });

    parallelPatternDetection.addCatch(manualReviewState, {
      errors: ['States.ALL'],
      resultPath: '$.error',
    });

    // Define state machine workflow
    const definition = dataValidation
      .next(parallelPatternDetection)
      .next(confidenceScoring)
      .next(alertDecision)
      .next(successState);

    // Create Express Workflow
    this.patternAnalysisWorkflow = new sfn.StateMachine(
      this,
      'PatternAnalysisWorkflow',
      {
        stateMachineName: `PatternAnalysisWorkflow-${environmentSuffix}`,
        definition,
        stateMachineType: sfn.StateMachineType.EXPRESS,
        logs: {
          destination: stateMachineLogGroup,
          level: sfn.LogLevel.ALL,
        },
        tracingEnabled: true,
      }
    );

    // Create Power Tuning State Machine
    const powerTuningLogGroup = new logs.LogGroup(this, 'PowerTuningLogGroup', {
      logGroupName: `/aws/stepfunctions/power-tuning-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Power tuning states
    const tuningIteration = new tasks.LambdaInvoke(this, 'TuningIteration', {
      lambdaFunction: patternDetectorFunction,
      payload: sfn.TaskInput.fromObject({
        action: 'tune',
        'memoryConfig.$': '$.memoryConfig',
      }),
      outputPath: '$.Payload',
    });

    const analysisState = new sfn.Pass(this, 'AnalyzeResults', {
      result: sfn.Result.fromObject({
        memoryConfigs: [512, 1024, 1536, 2048, 3008],
      }),
    });

    const powerTuningDefinition = analysisState.next(tuningIteration);

    this.powerTuningWorkflow = new sfn.StateMachine(
      this,
      'PowerTuningWorkflow',
      {
        stateMachineName: `PowerTuningWorkflow-${environmentSuffix}`,
        definition: powerTuningDefinition,
        stateMachineType: sfn.StateMachineType.EXPRESS,
        logs: {
          destination: powerTuningLogGroup,
          level: sfn.LogLevel.ALL,
        },
      }
    );

    // Create EventBridge rule with custom event pattern (3+ conditions)
    const scheduleRule = new events.Rule(this, 'ThresholdCheckSchedule', {
      ruleName: `threshold-check-${environmentSuffix}`,
      description: 'Trigger threshold checking every 5 minutes',
      schedule: events.Schedule.rate(cdk.Duration.minutes(5)),
      eventPattern: {
        source: ['aws.cloudwatch'],
        detailType: ['CloudWatch Alarm State Change'],
        detail: {
          state: {
            value: ['ALARM'],
          },
          alarmName: [{ prefix: 'pattern-detection' }],
          previousState: {
            value: ['OK'],
          },
        },
      },
    });

    // Add Lambda target to EventBridge rule
    scheduleRule.addTarget(
      new targets.LambdaFunction(thresholdCheckerFunction, {
        retryAttempts: 2,
        maxEventAge: cdk.Duration.hours(2),
      })
    );

    // Create separate schedule-only rule for guaranteed 5-minute execution
    const simpleScheduleRule = new events.Rule(
      this,
      'SimpleThresholdCheckSchedule',
      {
        ruleName: `simple-threshold-check-${environmentSuffix}`,
        description: 'Simple 5-minute schedule for threshold checking',
        schedule: events.Schedule.rate(cdk.Duration.minutes(5)),
      }
    );

    simpleScheduleRule.addTarget(
      new targets.LambdaFunction(thresholdCheckerFunction)
    );

    // Outputs
    new cdk.CfnOutput(this, 'PatternAnalysisWorkflowArn', {
      value: this.patternAnalysisWorkflow.stateMachineArn,
      description: 'Step Functions PatternAnalysisWorkflow ARN',
      exportName: `PatternAnalysisWorkflowArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PowerTuningWorkflowArn', {
      value: this.powerTuningWorkflow.stateMachineArn,
      description: 'Step Functions PowerTuningWorkflow ARN',
      exportName: `PowerTuningWorkflowArn-${environmentSuffix}`,
    });

    // Add tags
    cdk.Tags.of(this).add('Project', 'StockPatternDetection');
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('CostCenter', 'Trading');
  }
}
