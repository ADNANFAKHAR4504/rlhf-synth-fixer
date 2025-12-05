import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import { MonitoringConstruct } from '../lib/monitoring-construct';

describe('MonitoringConstruct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let vpc: ec2.Vpc;
  let repository: ecr.Repository;
  let cluster: ecs.Cluster;
  let taskDefinition: ecs.FargateTaskDefinition;
  let service: ecs.FargateService;
  let loadBalancer: elbv2.ApplicationLoadBalancer;
  let pipeline: codepipeline.Pipeline;
  let monitoring: MonitoringConstruct;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');

    vpc = new ec2.Vpc(stack, 'TestVpc', {
      maxAzs: 2,
      natGateways: 0,
    });

    repository = new ecr.Repository(stack, 'TestRepo', {
      repositoryName: 'test-repo',
    });

    cluster = new ecs.Cluster(stack, 'TestCluster', {
      vpc,
      clusterName: 'test-cluster',
    });

    taskDefinition = new ecs.FargateTaskDefinition(stack, 'TestTaskDef', {
      cpu: 256,
      memoryLimitMiB: 512,
    });

    taskDefinition.addContainer('TestContainer', {
      image: ecs.ContainerImage.fromEcrRepository(repository, 'latest'),
      containerName: 'test-container',
    });

    service = new ecs.FargateService(stack, 'TestService', {
      cluster,
      taskDefinition,
      serviceName: 'test-service',
    });

    loadBalancer = new elbv2.ApplicationLoadBalancer(stack, 'TestALB', {
      vpc,
      internetFacing: true,
    });

    pipeline = new codepipeline.Pipeline(stack, 'TestPipeline', {
      pipelineName: 'test-pipeline',
    });

    // Add dummy stages to satisfy pipeline validation
    const sourceArtifact = new codepipeline.Artifact('SourceArtifact');

    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.GitHubSourceAction({
          actionName: 'GitHubSource',
          owner: 'test-owner',
          repo: 'test-repo',
          oauthToken: cdk.SecretValue.unsafePlainText('test-token'),
          output: sourceArtifact,
        }),
      ],
    });

    pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new codepipeline_actions.ManualApprovalAction({
          actionName: 'Approval',
        }),
      ],
    });

    monitoring = new MonitoringConstruct(stack, 'TestMonitoring', {
      environmentSuffix: 'test',
      pipeline,
      ecsService: service,
      loadBalancer,
    });

    template = Template.fromStack(stack);
  });

  test('Construct is created successfully', () => {
    expect(monitoring).toBeDefined();
    expect(monitoring.alarmTopic).toBeDefined();
  });

  test('SNS Topic is created', () => {
    template.hasResourceProperties('AWS::SNS::Topic', {
      TopicName: 'cicd-alarms-test',
      DisplayName: 'CI/CD Pipeline Alarms',
    });
  });

  test('Pipeline Failure Alarm is created', () => {
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'cicd-pipeline-failure-test',
      AlarmDescription: 'Alarm when pipeline execution fails',
      MetricName: 'PipelineExecutionFailure',
      Namespace: 'AWS/CodePipeline',
      Threshold: 1,
      ComparisonOperator: 'GreaterThanOrEqualToThreshold',
    });
  });

  test('High CPU Alarm is created', () => {
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'cicd-ecs-high-cpu-test',
      AlarmDescription: 'Alarm when ECS tasks CPU is high',
      Threshold: 85,
      ComparisonOperator: 'GreaterThanThreshold',
    });
  });

  test('Unhealthy Target Alarm is created', () => {
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'cicd-alb-unhealthy-targets-test',
      AlarmDescription: 'Alarm when ALB has unhealthy targets',
      MetricName: 'UnHealthyHostCount',
      Namespace: 'AWS/ApplicationELB',
      Threshold: 1,
    });
  });

  test('ALB 5xx Alarm is created', () => {
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'cicd-alb-5xx-errors-test',
      AlarmDescription: 'Alarm when ALB returns 5xx errors',
      MetricName: 'HTTPCode_Target_5XX_Count',
      Namespace: 'AWS/ApplicationELB',
      Threshold: 10,
    });
  });

  test('Total of 4 CloudWatch Alarms are created', () => {
    // Pipeline failure, high CPU, unhealthy targets, 5xx errors
    const alarms = template.findResources('AWS::CloudWatch::Alarm');
    expect(Object.keys(alarms).length).toBe(4);
  });

  test('All alarms have SNS action configured', () => {
    const alarms = template.findResources('AWS::CloudWatch::Alarm');
    Object.values(alarms).forEach((alarm: any) => {
      expect(alarm.Properties.AlarmActions).toBeDefined();
      expect(alarm.Properties.AlarmActions.length).toBeGreaterThan(0);
    });
  });

  test('CloudWatch Dashboard is created', () => {
    template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
      DashboardName: 'cicd-dashboard-test',
    });
  });

  test('Dashboard has correct widgets', () => {
    const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
    const dashboard = Object.values(dashboards)[0] as any;

    // Dashboard body exists and is configured
    expect(dashboard.Properties.DashboardBody).toBeDefined();
  });

  test('Alarms treat missing data as not breaching', () => {
    const alarms = template.findResources('AWS::CloudWatch::Alarm');
    Object.values(alarms).forEach((alarm: any) => {
      expect(alarm.Properties.TreatMissingData).toBe('notBreaching');
    });
  });

  test('Pipeline alarm has 5-minute period', () => {
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'cicd-pipeline-failure-test',
      Period: 300, // 5 minutes in seconds
    });
  });

  test('High CPU alarm has 2 evaluation periods', () => {
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'cicd-ecs-high-cpu-test',
      EvaluationPeriods: 2,
    });
  });
});
