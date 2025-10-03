import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as fis from 'aws-cdk-lib/aws-fis';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as cr from 'aws-cdk-lib/custom-resources';

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
          'elasticloadbalancing:DeregisterTargets',
          'elasticloadbalancing:DescribeTargetHealth',
          'elasticloadbalancing:DescribeTargetGroups',
          'elasticloadbalancing:DescribeLoadBalancers',
        ],
        resources: ['*'],
      })
    );

    // Create an experiment template that simulates a failure of the primary ALB
    new fis.CfnExperimentTemplate(this, 'AlbFailureExperiment', {
      description:
        'Experiment to test Route 53 failover by simulating a primary ALB failure',
      roleArn: fisRole.roleArn,
      stopConditions: [
        {
          source: 'aws:cloudwatch:alarm',
          value:
            'arn:aws:cloudwatch:${AWS::Region}:${AWS::AccountId}:alarm:FisExperimentStopper',
        },
      ],
      targets: {
        ALB: {
          resourceType: 'aws:elasticloadbalancing:loadbalancer',
          resourceArns: [props.primaryAlb.loadBalancerArn],
          selectionMode: 'ALL',
        },
      },
      actions: {
        DisableAlb: {
          actionId: 'aws:elasticloadbalancing:deregister-target-group',
          parameters: {
            duration: 'PT5M',
          },
          targets: {
            LoadBalancer: 'ALB',
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
