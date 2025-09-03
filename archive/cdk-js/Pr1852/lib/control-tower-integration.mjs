import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as logs from 'aws-cdk-lib/aws-logs';

export class ControlTowerIntegration extends cdk.Construct {
  constructor(scope, id, props) {
    super(scope, id);

    // Role for Control Tower operations
    const controlTowerRole = new iam.Role(this, 'ControlTowerOperationsRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ],
      inlinePolicies: {
        ControlTowerOperations: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'controltower:GetEnabledBaseline',
                'controltower:ListEnabledBaselines',
                'controltower:EnableBaseline',
                'controltower:DisableBaseline',
                'controltower:UpdateEnabledBaseline'
              ],
              resources: ['*']
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'organizations:ListAccounts',
                'organizations:DescribeAccount',
                'organizations:ListAccountsForParent',
                'organizations:MoveAccount'
              ],
              resources: ['*']
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'servicecatalog:ListPortfolios',
                'servicecatalog:ListProductsForPortfolio',
                'servicecatalog:ProvisionProduct',
                'servicecatalog:TerminateProvisionedProduct',
                'servicecatalog:UpdateProvisionedProduct'
              ],
              resources: ['*']
            })
          ]
        })
      }
    });

    // Lambda function for Control Tower baseline management
    const baselineManagerFunction = new lambda.Function(this, 'BaselineManagerFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: controlTowerRole,
      timeout: cdk.Duration.minutes(5),
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        
        exports.handler = async (event) => {
          console.log('Processing Control Tower event:', JSON.stringify(event, null, 2));
          
          try {
            // Simplified implementation - Control Tower baseline management
            // In production, you would integrate with Control Tower APIs
            // when they become available in the SDK
            const organizations = new AWS.Organizations({ region: process.env.AWS_REGION });
            
            // List accounts in the organization
            const accounts = await organizations.listAccounts({}).promise();
            console.log('Found ' + accounts.Accounts.length + ' accounts in organization');
            
            // Simulated drift detection logic
            const driftStatus = [];
            
            // Check for Control Tower events
            if (event.source === 'aws.controltower') {
              console.log('Control Tower event detected:', event.detailType);
              
              // Process based on event type
              if (event.detailType === 'AWS Control Tower Baseline Enabled') {
                console.log('Baseline enabled for account');
              } else if (event.detailType === 'AWS Control Tower Baseline Disabled') {
                console.log('Baseline disabled for account');
              }
            }
            
            // Return success response
            return {
              statusCode: 200,
              body: JSON.stringify({
                message: 'Control Tower event processed successfully',
                accountCount: accounts.Accounts.length,
                eventType: event.detailType || 'scheduled'
              })
            };
          } catch (error) {
            console.error('Error processing Control Tower event:', error);
            return {
              statusCode: 500,
              body: JSON.stringify({
                message: 'Error processing Control Tower event',
                error: error.message
              })
            };
          }
        };
      `),
      environment: {
        ORGANIZATION_ID: props.organizationId || '',
        NOTIFICATION_TOPIC: props.notificationTopic || ''
      }
    });

    // CloudWatch Event Rule for Control Tower events
    const controlTowerEventRule = new events.Rule(this, 'ControlTowerEventRule', {
      description: 'Capture Control Tower lifecycle events',
      eventPattern: {
        source: ['aws.controltower'],
        detailType: [
          'AWS Control Tower Setup Completed',
          'AWS Control Tower Baseline Enabled',
          'AWS Control Tower Baseline Disabled'
        ]
      }
    });

    controlTowerEventRule.addTarget(new targets.LambdaFunction(baselineManagerFunction));

    // Schedule for periodic baseline drift checks
    const driftCheckRule = new events.Rule(this, 'DriftCheckRule', {
      description: 'Periodic Control Tower baseline drift check',
      schedule: events.Schedule.rate(cdk.Duration.hours(4))
    });

    driftCheckRule.addTarget(new targets.LambdaFunction(baselineManagerFunction));

    // Log Group for Control Tower integration logs
    new logs.LogGroup(this, 'ControlTowerIntegrationLogs', {
      logGroupName: `/aws/lambda/${baselineManagerFunction.functionName}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });
  }
}