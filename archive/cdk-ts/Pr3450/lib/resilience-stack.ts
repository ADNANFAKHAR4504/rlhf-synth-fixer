import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as fis from 'aws-cdk-lib/aws-fis';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

interface ResilienceStackProps extends cdk.StackProps {
  primaryVpc: ec2.Vpc;
  primaryAlb: elbv2.ApplicationLoadBalancer;
  primaryAsg: autoscaling.AutoScalingGroup;
  primaryDatabase: rds.DatabaseInstance | rds.DatabaseInstanceReadReplica;
  standbyVpc: ec2.Vpc;
  standbyAlb: elbv2.ApplicationLoadBalancer;
  standbyAsg: autoscaling.AutoScalingGroup;
  standbyDatabase: rds.DatabaseInstance | rds.DatabaseInstanceReadReplica;
}

export class ResilienceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ResilienceStackProps) {
    super(scope, id, props);

    // Create IAM role for FIS
    const fisRole = new iam.Role(this, 'FisRole', {
      assumedBy: new iam.ServicePrincipal('fis.amazonaws.com'),
      description: 'Role for AWS FIS to perform fault injection experiments',
    });

    // Attach necessary permissions to the role
    fisRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'ec2:StopInstances',
          'ec2:StartInstances',
          'ec2:DescribeInstances',
          'ec2:DescribeTags',
        ],
        resources: ['*'],
      })
    );

    // Create a CloudWatch alarm as a stop condition for FIS experiments
    const stopConditionAlarm = new cloudwatch.Alarm(
      this,
      'FisStopConditionAlarm',
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/FIS',
          metricName: 'ExperimentCount',
          statistic: 'Sum',
          period: cdk.Duration.minutes(1),
        }),
        threshold: 100,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        alarmDescription: 'Stop condition for FIS experiments',
      }
    );

    // Create an experiment template that simulates a failure by stopping primary EC2 instances
    // This will make the ALB unhealthy and trigger Route 53 failover
    new fis.CfnExperimentTemplate(this, 'AlbFailureExperiment', {
      description:
        'Experiment to test Route 53 failover by stopping primary region EC2 instances',
      roleArn: fisRole.roleArn,
      stopConditions: [
        {
          source: 'aws:cloudwatch:alarm',
          value: stopConditionAlarm.alarmArn,
        },
      ],
      targets: {
        Instances: {
          resourceType: 'aws:ec2:instance',
          resourceTags: {
            'aws:autoscaling:groupName': props.primaryAsg.autoScalingGroupName,
          },
          selectionMode: 'ALL',
        },
      },
      actions: {
        StopInstances: {
          actionId: 'aws:ec2:stop-instances',
          parameters: {
            startInstancesAfterDuration: 'PT10M', // Auto-restart after 10 minutes
          },
          targets: {
            Instances: 'Instances',
          },
        },
      },
    });

    // Create AWS Resilience Hub application using Custom Resource
    // Note: Resilience Hub is not yet fully supported in CDK, so we use a custom resource
    const resilienceHubApp = new cr.AwsCustomResource(
      this,
      'ResilienceHubApplication',
      {
        onCreate: {
          service: 'ResilienceHub',
          action: 'createApp',
          parameters: {
            name: 'MultiRegionWebApp',
            description:
              'Multi-region web application with active-passive failover',
            appAssessmentSchedule: 'Scheduled',
            assessmentSchedule: 'Daily',
            resiliencyPolicyArn:
              'arn:aws:resiliencehub:::resiliency-policy/AWSManagedPolicy',
            resourceMappings: [
              {
                mappingType: 'CfnStack',
                physicalResourceId: this.stackId,
              },
            ],
          },
          physicalResourceId: cr.PhysicalResourceId.fromResponse('app.appArn'),
        },
        onUpdate: {
          service: 'ResilienceHub',
          action: 'updateApp',
          parameters: {
            appArn: new cr.PhysicalResourceIdReference(),
            name: 'MultiRegionWebApp',
            description:
              'Multi-region web application with active-passive failover',
            appAssessmentSchedule: 'Scheduled',
            assessmentSchedule: 'Daily',
            resiliencyPolicyArn:
              'arn:aws:resiliencehub:::resiliency-policy/AWSManagedPolicy',
          },
          physicalResourceId: cr.PhysicalResourceId.fromResponse('app.appArn'),
        },
        onDelete: {
          service: 'ResilienceHub',
          action: 'deleteApp',
          parameters: {
            appArn: new cr.PhysicalResourceIdReference(),
          },
        },
        policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
          resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
        }),
      }
    );

    // Output Resilience Hub application ARN
    new cdk.CfnOutput(this, 'ResilienceHubAppArn', {
      value: resilienceHubApp.getResponseField('app.appArn'),
      description: 'The ARN of the Resilience Hub application',
    });
  }
}
