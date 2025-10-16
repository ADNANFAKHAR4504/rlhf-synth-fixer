import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as stepfunctionsTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import { GlobalDatabase } from './global-database';
import { HealthCheckSystem } from './health-check';
import { RegionalApi } from './regional-api';

export interface FailoverOrchestratorProps {
  regions: string[];
  regionalApis: Map<string, RegionalApi>;
  globalDatabase: GlobalDatabase;
  healthCheckSystem: HealthCheckSystem;
  alertTopic: sns.ITopic;
  environmentSuffix?: string;
}

export class FailoverOrchestrator extends Construct {
  public readonly stateMachine: stepfunctions.StateMachine;

  constructor(scope: Construct, id: string, props: FailoverOrchestratorProps) {
    super(scope, id);

    // Create Lambda functions for failover tasks
    const validateHealthFunction = this.createValidateHealthFunction();
    const promoteReplicaFunction = this.createPromoteReplicaFunction();
    const updateRoutingFunction = this.createUpdateRoutingFunction();
    const validateFailoverFunction = this.createValidateFailoverFunction();

    // Define Step Functions workflow
    const validateHealth = new stepfunctionsTasks.LambdaInvoke(
      this,
      'ValidateHealth',
      {
        lambdaFunction: validateHealthFunction,
        outputPath: '$.Payload',
      }
    );

    const checkNeedFailover = new stepfunctions.Choice(
      this,
      'CheckNeedFailover'
    )
      .when(
        stepfunctions.Condition.stringEquals('$.failoverRequired', 'true'),
        new stepfunctions.Parallel(this, 'ExecuteFailover')
          .branch(
            new stepfunctionsTasks.LambdaInvoke(this, 'PromoteReplica', {
              lambdaFunction: promoteReplicaFunction,
              outputPath: '$.Payload',
            })
          )
          .branch(
            new stepfunctionsTasks.LambdaInvoke(this, 'UpdateRouting', {
              lambdaFunction: updateRoutingFunction,
              outputPath: '$.Payload',
            })
          )
          .next(
            new stepfunctionsTasks.LambdaInvoke(this, 'ValidateFailover', {
              lambdaFunction: validateFailoverFunction,
              outputPath: '$.Payload',
            })
          )
      )
      .otherwise(new stepfunctions.Succeed(this, 'NoFailoverNeeded'));

    const definition = validateHealth.next(checkNeedFailover);

    const envSuffix = props.environmentSuffix || 'dev';
    const stackRegion = cdk.Stack.of(this).region;
    this.stateMachine = new stepfunctions.StateMachine(
      this,
      'FailoverStateMachine',
      {
        definitionBody: stepfunctions.DefinitionBody.fromChainable(definition),
        stateMachineName: `financial-app-failover-${stackRegion}-${envSuffix}`,
        timeout: cdk.Duration.minutes(15),
      }
    );

    // Grant permissions
    props.alertTopic.grantPublish(this.stateMachine);
  }

  private createValidateHealthFunction(): lambda.Function {
    const fn = new lambda.Function(this, 'ValidateHealthFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      architecture: lambda.Architecture.ARM_64, // Graviton2 for better performance and cost
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const cloudWatch = new AWS.CloudWatch();
        
        exports.handler = async (event) => {
          // Comprehensive health validation logic
          const healthChecks = await Promise.all([
            checkApiHealth(event.region),
            checkDatabaseHealth(event.region),
            checkReplicationLag(event.region)
          ]);
          
          const failoverRequired = healthChecks.some(check => !check.healthy);
          
          return {
            failoverRequired: failoverRequired.toString(),
            healthStatus: healthChecks,
            targetRegion: selectBestFailoverRegion(event.regions, healthChecks)
          };
        };
        
        async function checkApiHealth(region) {
          // Implementation
        }
        
        async function checkDatabaseHealth(region) {
          // Implementation
        }
        
        async function checkReplicationLag(region) {
          // Implementation
        }
        
        function selectBestFailoverRegion(regions, healthChecks) {
          // Implementation to select optimal failover region
        }
      `),
      timeout: cdk.Duration.minutes(2),
    });

    return fn;
  }

  private createPromoteReplicaFunction(): lambda.Function {
    const fn = new lambda.Function(this, 'PromoteReplicaFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/promote-replica'),
      architecture: lambda.Architecture.ARM_64, // Graviton2 for better performance and cost
      timeout: cdk.Duration.minutes(5),
      role: new iam.Role(this, 'PromoteReplicaRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          ),
        ],
        inlinePolicies: {
          RDSPolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                actions: [
                  'rds:PromoteReadReplicaDBCluster',
                  'rds:ModifyDBCluster',
                  'rds:DescribeDBClusters',
                ],
                resources: ['*'],
              }),
            ],
          }),
        },
      }),
    });

    return fn;
  }

  private createUpdateRoutingFunction(): lambda.Function {
    const fn = new lambda.Function(this, 'UpdateRoutingFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      architecture: lambda.Architecture.ARM_64, // Graviton2 for better performance and cost
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const route53 = new AWS.Route53();
        
        exports.handler = async (event) => {
          // Update Route53 weights to redirect traffic
          const changeSet = {
            Changes: [
              {
                Action: 'UPSERT',
                ResourceRecordSet: {
                  Name: event.recordName,
                  Type: 'A',
                  SetIdentifier: event.failoverRegion,
                  Weight: 100,
                  // Additional configuration
                }
              }
            ]
          };
          
          await route53.changeResourceRecordSets({
            HostedZoneId: event.hostedZoneId,
            ChangeBatch: changeSet
          }).promise();
          
          return { status: 'routing_updated' };
        };
      `),
      timeout: cdk.Duration.minutes(2),
    });

    return fn;
  }

  private createValidateFailoverFunction(): lambda.Function {
    const fn = new lambda.Function(this, 'ValidateFailoverFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      architecture: lambda.Architecture.ARM_64, // Graviton2 for better performance and cost
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          // Validate failover success
          const validations = await Promise.all([
            validateNewPrimary(event.targetRegion),
            validateTrafficRouting(event.targetRegion),
            validateDataConsistency(event.targetRegion)
          ]);
          
          return {
            failoverSuccessful: validations.every(v => v.passed),
            validationResults: validations
          };
        };
        
        async function validateNewPrimary(region) {
          // Implementation
        }
        
        async function validateTrafficRouting(region) {
          // Implementation
        }
        
        async function validateDataConsistency(region) {
          // Implementation
        }
      `),
      timeout: cdk.Duration.minutes(3),
    });

    return fn;
  }
}
