/**
 * eventbridge-stack.ts
 *
 * This module defines the EventBridge stack for monitoring security group changes.
 * Creates EventBridge rules and targets to detect security group modifications.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface EventBridgeStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  securityGroupId: pulumi.Input<string>;
  snsTopicArn: pulumi.Input<string>;
}

export interface EventBridgeStackOutputs {
  ruleArn: pulumi.Output<string>;
  targetId: pulumi.Output<string>;
}

export class EventBridgeStack extends pulumi.ComponentResource {
  public readonly ruleArn: pulumi.Output<string>;
  public readonly targetId: pulumi.Output<string>;

  constructor(
    name: string,
    args: EventBridgeStackArgs,
    opts?: ResourceOptions
  ) {
    super('tap:eventbridge:EventBridgeStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create EventBridge rule to monitor security group changes
    const securityGroupMonitorRule = new aws.cloudwatch.EventRule(
      `tap-sg-monitor-rule-${environmentSuffix}`,
      {
        name: `tap-sg-monitor-rule-${environmentSuffix}`,
        description: `Monitor security group changes for TAP - ${environmentSuffix}`,

        // Event pattern to detect security group modifications
        eventPattern: pulumi.interpolate`{
        "source": ["aws.ec2"],
        "detail-type": ["AWS API Call via CloudTrail"],
        "detail": {
          "eventName": [
            "AuthorizeSecurityGroupIngress",
            "AuthorizeSecurityGroupEgress", 
            "RevokeSecurityGroupIngress",
            "RevokeSecurityGroupEgress"
          ],
          "requestParameters": {
            "groupId": ["${args.securityGroupId}"]
          }
        }
      }`,

        tags: {
          Name: `tap-sg-monitor-rule-${environmentSuffix}`,
          Purpose: 'SecurityGroupMonitoring',
          ...tags,
        },
      },
      { parent: this }
    );

    // Create IAM role for EventBridge to publish to SNS
    const eventBridgeRole = new aws.iam.Role(
      `tap-eventbridge-role-${environmentSuffix}`,
      {
        name: `tap-eventbridge-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'events.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Name: `tap-eventbridge-role-${environmentSuffix}`,
          Purpose: 'EventBridgeExecution',
          ...tags,
        },
      },
      { parent: this }
    );

    // Create IAM policy for SNS publishing
    const snsPublishPolicy = new aws.iam.RolePolicy(
      `tap-eventbridge-sns-policy-${environmentSuffix}`,
      {
        name: `tap-eventbridge-sns-policy-${environmentSuffix}`,
        role: eventBridgeRole.id,
        policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "sns:Publish"
            ],
            "Resource": "${args.snsTopicArn}"
          }
        ]
      }`,
      },
      { parent: this }
    );

    // Create EventBridge target to send alerts to SNS
    const snsTarget = new aws.cloudwatch.EventTarget(
      `tap-sg-monitor-target-${environmentSuffix}`,
      {
        rule: securityGroupMonitorRule.name,
        targetId: `tap-sg-monitor-target-${environmentSuffix}`,
        arn: args.snsTopicArn,
        roleArn: eventBridgeRole.arn,

        // Custom message for the alert
        inputTransformer: {
          inputPaths: {
            eventName: '$.detail.eventName',
            sourceIpAddress: '$.detail.sourceIPAddress',
            userIdentity: '$.detail.userIdentity.type',
            userName: '$.detail.userIdentity.userName',
            eventTime: '$.detail.eventTime',
            securityGroupId: '$.detail.requestParameters.groupId',
          },
          inputTemplate: pulumi.interpolate`{
          "alert": "SECURITY ALERT: Security Group Modified",
          "environment": "${environmentSuffix}",
          "event": "<eventName>",
          "securityGroupId": "<securityGroupId>",
          "sourceIP": "<sourceIpAddress>",
          "userType": "<userIdentity>",
          "userName": "<userName>",
          "timestamp": "<eventTime>",
          "message": "The monitored security group has been modified. Please review the changes immediately.",
          "actionRequired": "Verify if this change was authorized and complies with security policies."
        }`,
        },
      },
      { parent: this, dependsOn: [snsPublishPolicy] }
    );

    this.ruleArn = securityGroupMonitorRule.arn;
    this.targetId = snsTarget.targetId;

    this.registerOutputs({
      ruleArn: this.ruleArn,
      targetId: this.targetId,
    });
  }
}
