import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { CloudwatchEventBus } from '@cdktf/provider-aws/lib/cloudwatch-event-bus';
import { CloudwatchEventRule } from '@cdktf/provider-aws/lib/cloudwatch-event-rule';
import { CloudwatchEventTarget } from '@cdktf/provider-aws/lib/cloudwatch-event-target';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';

export interface EventingConstructProps {
  environmentSuffix: string;
  primaryProvider: AwsProvider;
  secondaryProvider: AwsProvider;
  primaryStateMachineArn: string;
  secondaryStateMachineArn: string;
}

export class EventingConstruct extends Construct {
  constructor(scope: Construct, id: string, props: EventingConstructProps) {
    super(scope, id);

    const {
      environmentSuffix,
      primaryProvider,
      secondaryProvider,
      primaryStateMachineArn,
      secondaryStateMachineArn,
    } = props;

    // Primary Event Bus
    const primaryEventBus = new CloudwatchEventBus(this, 'PrimaryEventBus', {
      provider: primaryProvider,
      name: `order-events-primary-${environmentSuffix}`,
      tags: {
        Name: `order-events-primary-${environmentSuffix}`,
      },
    });

    // Secondary Event Bus
    const secondaryEventBus = new CloudwatchEventBus(
      this,
      'SecondaryEventBus',
      {
        provider: secondaryProvider,
        name: `order-events-secondary-${environmentSuffix}`,
        tags: {
          Name: `order-events-secondary-${environmentSuffix}`,
        },
      }
    );

    // Primary EventBridge Role
    const primaryEventBridgeRole = new IamRole(this, 'PrimaryEventBridgeRole', {
      provider: primaryProvider,
      name: `eventbridge-role-primary-${environmentSuffix}`,
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
        Name: `eventbridge-role-primary-${environmentSuffix}`,
      },
    });

    new IamRolePolicy(this, 'PrimaryEventBridgePolicy', {
      provider: primaryProvider,
      name: `eventbridge-policy-primary-${environmentSuffix}`,
      role: primaryEventBridgeRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['states:StartExecution'],
            Resource: primaryStateMachineArn,
          },
        ],
      }),
    });

    // Primary Event Rule
    const primaryEventRule = new CloudwatchEventRule(this, 'PrimaryEventRule', {
      provider: primaryProvider,
      name: `order-processing-rule-primary-${environmentSuffix}`,
      eventBusName: primaryEventBus.name,
      eventPattern: JSON.stringify({
        source: ['custom.orders'],
        'detail-type': ['OrderPlaced'],
      }),
      tags: {
        Name: `order-processing-rule-primary-${environmentSuffix}`,
      },
    });

    // Primary Event Target
    new CloudwatchEventTarget(this, 'PrimaryEventTarget', {
      provider: primaryProvider,
      rule: primaryEventRule.name,
      eventBusName: primaryEventBus.name,
      arn: primaryStateMachineArn,
      roleArn: primaryEventBridgeRole.arn,
    });

    // Secondary EventBridge Role
    const secondaryEventBridgeRole = new IamRole(
      this,
      'SecondaryEventBridgeRole',
      {
        provider: secondaryProvider,
        name: `eventbridge-role-secondary-${environmentSuffix}`,
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
          Name: `eventbridge-role-secondary-${environmentSuffix}`,
        },
      }
    );

    new IamRolePolicy(this, 'SecondaryEventBridgePolicy', {
      provider: secondaryProvider,
      name: `eventbridge-policy-secondary-${environmentSuffix}`,
      role: secondaryEventBridgeRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['states:StartExecution'],
            Resource: secondaryStateMachineArn,
          },
        ],
      }),
    });

    // Secondary Event Rule
    const secondaryEventRule = new CloudwatchEventRule(
      this,
      'SecondaryEventRule',
      {
        provider: secondaryProvider,
        name: `order-processing-rule-secondary-${environmentSuffix}`,
        eventBusName: secondaryEventBus.name,
        eventPattern: JSON.stringify({
          source: ['custom.orders'],
          'detail-type': ['OrderPlaced'],
        }),
        tags: {
          Name: `order-processing-rule-secondary-${environmentSuffix}`,
        },
      }
    );

    // Secondary Event Target
    new CloudwatchEventTarget(this, 'SecondaryEventTarget', {
      provider: secondaryProvider,
      rule: secondaryEventRule.name,
      eventBusName: secondaryEventBus.name,
      arn: secondaryStateMachineArn,
      roleArn: secondaryEventBridgeRole.arn,
    });
  }
}
