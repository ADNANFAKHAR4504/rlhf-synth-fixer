import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { SfnStateMachine } from '@cdktf/provider-aws/lib/sfn-state-machine';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';

export interface WorkflowConstructProps {
  environmentSuffix: string;
  primaryProvider: AwsProvider;
  secondaryProvider: AwsProvider;
  primaryLambdaArn: string;
  secondaryLambdaArn: string;
}

export class WorkflowConstruct extends Construct {
  public readonly primaryStateMachineArn: string;
  public readonly secondaryStateMachineArn: string;
  public readonly primaryStateMachineName: string;
  public readonly secondaryStateMachineName: string;

  constructor(scope: Construct, id: string, props: WorkflowConstructProps) {
    super(scope, id);

    const {
      environmentSuffix,
      primaryProvider,
      secondaryProvider,
      primaryLambdaArn,
      secondaryLambdaArn,
    } = props;

    // Primary State Machine IAM Role
    const primaryStepFunctionsRole = new IamRole(
      this,
      'PrimaryStepFunctionsRole',
      {
        provider: primaryProvider,
        name: `step-functions-role-primary-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'states.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Name: `step-functions-role-primary-${environmentSuffix}`,
        },
      }
    );

    new IamRolePolicy(this, 'PrimaryStepFunctionsPolicy', {
      provider: primaryProvider,
      name: `step-functions-policy-primary-${environmentSuffix}`,
      role: primaryStepFunctionsRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['lambda:InvokeFunction'],
            Resource: primaryLambdaArn,
          },
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: 'arn:aws:logs:*:*:*',
          },
        ],
      }),
    });

    // Primary State Machine Definition
    const primaryStateMachineDefinition = JSON.stringify({
      Comment: 'Order processing workflow - Primary Region',
      StartAt: 'ValidateOrder',
      States: {
        ValidateOrder: {
          Type: 'Task',
          Resource: primaryLambdaArn,
          Parameters: {
            action: 'validate',
            'order.$': '$.order',
          },
          Retry: [
            {
              ErrorEquals: ['States.ALL'],
              IntervalSeconds: 2,
              MaxAttempts: 3,
              BackoffRate: 2,
            },
          ],
          Catch: [
            {
              ErrorEquals: ['States.ALL'],
              Next: 'ValidationFailed',
            },
          ],
          Next: 'ProcessPayment',
        },
        ProcessPayment: {
          Type: 'Task',
          Resource: primaryLambdaArn,
          Parameters: {
            action: 'process_payment',
            'order.$': '$.order',
          },
          Retry: [
            {
              ErrorEquals: ['States.ALL'],
              IntervalSeconds: 2,
              MaxAttempts: 3,
              BackoffRate: 2,
            },
          ],
          Catch: [
            {
              ErrorEquals: ['States.ALL'],
              Next: 'PaymentFailed',
            },
          ],
          Next: 'FulfillOrder',
        },
        FulfillOrder: {
          Type: 'Task',
          Resource: primaryLambdaArn,
          Parameters: {
            action: 'fulfill',
            'order.$': '$.order',
          },
          Retry: [
            {
              ErrorEquals: ['States.ALL'],
              IntervalSeconds: 2,
              MaxAttempts: 3,
              BackoffRate: 2,
            },
          ],
          Catch: [
            {
              ErrorEquals: ['States.ALL'],
              Next: 'FulfillmentFailed',
            },
          ],
          Next: 'Success',
        },
        ValidationFailed: {
          Type: 'Fail',
          Error: 'ValidationError',
          Cause: 'Order validation failed',
        },
        PaymentFailed: {
          Type: 'Fail',
          Error: 'PaymentError',
          Cause: 'Payment processing failed',
        },
        FulfillmentFailed: {
          Type: 'Fail',
          Error: 'FulfillmentError',
          Cause: 'Order fulfillment failed',
        },
        Success: {
          Type: 'Succeed',
        },
      },
    });

    // Primary State Machine
    const primaryStateMachine = new SfnStateMachine(
      this,
      'PrimaryStateMachine',
      {
        provider: primaryProvider,
        name: `order-workflow-primary-${environmentSuffix}`,
        roleArn: primaryStepFunctionsRole.arn,
        definition: primaryStateMachineDefinition,
        tags: {
          Name: `order-workflow-primary-${environmentSuffix}`,
        },
      }
    );

    // Secondary State Machine IAM Role
    const secondaryStepFunctionsRole = new IamRole(
      this,
      'SecondaryStepFunctionsRole',
      {
        provider: secondaryProvider,
        name: `step-functions-role-secondary-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'states.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Name: `step-functions-role-secondary-${environmentSuffix}`,
        },
      }
    );

    new IamRolePolicy(this, 'SecondaryStepFunctionsPolicy', {
      provider: secondaryProvider,
      name: `step-functions-policy-secondary-${environmentSuffix}`,
      role: secondaryStepFunctionsRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['lambda:InvokeFunction'],
            Resource: secondaryLambdaArn,
          },
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: 'arn:aws:logs:*:*:*',
          },
        ],
      }),
    });

    // Secondary State Machine Definition
    const secondaryStateMachineDefinition = JSON.stringify({
      Comment: 'Order processing workflow - Secondary Region',
      StartAt: 'ValidateOrder',
      States: {
        ValidateOrder: {
          Type: 'Task',
          Resource: secondaryLambdaArn,
          Parameters: {
            action: 'validate',
            'order.$': '$.order',
          },
          Retry: [
            {
              ErrorEquals: ['States.ALL'],
              IntervalSeconds: 2,
              MaxAttempts: 3,
              BackoffRate: 2,
            },
          ],
          Catch: [
            {
              ErrorEquals: ['States.ALL'],
              Next: 'ValidationFailed',
            },
          ],
          Next: 'ProcessPayment',
        },
        ProcessPayment: {
          Type: 'Task',
          Resource: secondaryLambdaArn,
          Parameters: {
            action: 'process_payment',
            'order.$': '$.order',
          },
          Retry: [
            {
              ErrorEquals: ['States.ALL'],
              IntervalSeconds: 2,
              MaxAttempts: 3,
              BackoffRate: 2,
            },
          ],
          Catch: [
            {
              ErrorEquals: ['States.ALL'],
              Next: 'PaymentFailed',
            },
          ],
          Next: 'FulfillOrder',
        },
        FulfillOrder: {
          Type: 'Task',
          Resource: secondaryLambdaArn,
          Parameters: {
            action: 'fulfill',
            'order.$': '$.order',
          },
          Retry: [
            {
              ErrorEquals: ['States.ALL'],
              IntervalSeconds: 2,
              MaxAttempts: 3,
              BackoffRate: 2,
            },
          ],
          Catch: [
            {
              ErrorEquals: ['States.ALL'],
              Next: 'FulfillmentFailed',
            },
          ],
          Next: 'Success',
        },
        ValidationFailed: {
          Type: 'Fail',
          Error: 'ValidationError',
          Cause: 'Order validation failed',
        },
        PaymentFailed: {
          Type: 'Fail',
          Error: 'PaymentError',
          Cause: 'Payment processing failed',
        },
        FulfillmentFailed: {
          Type: 'Fail',
          Error: 'FulfillmentError',
          Cause: 'Order fulfillment failed',
        },
        Success: {
          Type: 'Succeed',
        },
      },
    });

    // Secondary State Machine
    const secondaryStateMachine = new SfnStateMachine(
      this,
      'SecondaryStateMachine',
      {
        provider: secondaryProvider,
        name: `order-workflow-secondary-${environmentSuffix}`,
        roleArn: secondaryStepFunctionsRole.arn,
        definition: secondaryStateMachineDefinition,
        tags: {
          Name: `order-workflow-secondary-${environmentSuffix}`,
        },
      }
    );

    // Export values
    this.primaryStateMachineArn = primaryStateMachine.arn;
    this.secondaryStateMachineArn = secondaryStateMachine.arn;
    this.primaryStateMachineName = primaryStateMachine.name;
    this.secondaryStateMachineName = secondaryStateMachine.name;
  }
}
