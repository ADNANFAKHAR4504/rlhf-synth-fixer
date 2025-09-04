import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipelineActions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';

export class CicdPipelineStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const {
      environmentSuffix,
      sourceBucket,
      artifactsBucket,
      buildProject,
      testProject,
      deploymentApplication,
      deploymentGroup,
      validationFunction,
      pipelineRole,
      alarmTopic,
    } = props;

    // Source artifact
    const sourceArtifact = new codepipeline.Artifact('SourceArtifact');
    
    // Build artifact
    const buildArtifact = new codepipeline.Artifact('BuildArtifact');

    // Create CodePipeline V2 with parameterized features
    this.pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `cicd-pipeline-${environmentSuffix}`,
      pipelineType: codepipeline.PipelineType.V2,
      role: pipelineRole,
      artifactBucket: artifactsBucket,
      restartExecutionOnUpdate: true,
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipelineActions.S3SourceAction({
              actionName: 'Source',
              bucket: sourceBucket,
              bucketKey: 'source.zip',
              output: sourceArtifact,
              trigger: codepipelineActions.S3Trigger.POLL,
            }),
          ],
        },
        {
          stageName: 'Test',
          actions: [
            new codepipelineActions.CodeBuildAction({
              actionName: 'RunTests',
              project: testProject,
              input: sourceArtifact,
              runOrder: 1,
            }),
          ],
        },
        {
          stageName: 'Build',
          actions: [
            new codepipelineActions.CodeBuildAction({
              actionName: 'Build',
              project: buildProject,
              input: sourceArtifact,
              outputs: [buildArtifact],
              runOrder: 1,
            }),
          ],
        },
        {
          stageName: 'Deploy',
          actions: [
            new codepipelineActions.CodeDeployServerDeployAction({
              actionName: 'Deploy',
              input: buildArtifact,
              deploymentGroup: deploymentGroup,
              runOrder: 1,
            }),
          ],
        },
        {
          stageName: 'Validate',
          actions: [
            new codepipelineActions.LambdaInvokeAction({
              actionName: 'ValidateDeployment',
              lambda: validationFunction,
              userParameters: {
                environmentSuffix: environmentSuffix,
                deploymentId: codepipeline.GlobalVariables.CODEDEPLOY_DEPLOYMENT_ID,
              },
              runOrder: 1,
            }),
          ],
        },
      ],
    });

    // CloudWatch alarm for pipeline failures
    const pipelineFailureAlarm = new cloudwatch.Alarm(this, 'PipelineFailureAlarm', {
      alarmName: `cicd-pipeline-failure-${environmentSuffix}`,
      alarmDescription: 'Alarm when CI/CD pipeline fails',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CodePipeline',
        metricName: 'PipelineExecutionFailure',
        dimensionsMap: {
          PipelineName: this.pipeline.pipelineName,
        },
        statistic: 'Sum',
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Add alarm action
    pipelineFailureAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alarmTopic)
    );

    // CloudWatch alarm for pipeline success rate
    const pipelineSuccessRateAlarm = new cloudwatch.Alarm(this, 'PipelineSuccessRateAlarm', {
      alarmName: `cicd-pipeline-success-rate-${environmentSuffix}`,
      alarmDescription: 'Alarm when CI/CD pipeline success rate drops below 80%',
      metric: new cloudwatch.MathExpression({
        expression: 'success / (success + failure) * 100',
        usingMetrics: {
          success: new cloudwatch.Metric({
            namespace: 'AWS/CodePipeline',
            metricName: 'PipelineExecutionSuccess',
            dimensionsMap: {
              PipelineName: this.pipeline.pipelineName,
            },
            statistic: 'Sum',
          }),
          failure: new cloudwatch.Metric({
            namespace: 'AWS/CodePipeline',
            metricName: 'PipelineExecutionFailure',
            dimensionsMap: {
              PipelineName: this.pipeline.pipelineName,
            },
            statistic: 'Sum',
          }),
        },
      }),
      threshold: 80,
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
    });

    pipelineSuccessRateAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alarmTopic)
    );

    // Tags
    cdk.Tags.of(this.pipeline).add('Purpose', 'CICD');
  }
}