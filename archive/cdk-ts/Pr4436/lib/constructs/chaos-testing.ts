import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { FailoverOrchestrator } from './failover-orchestrator';
import { RegionalApi } from './regional-api';

export interface ChaosTestingSystemProps {
  regions: string[];
  regionalApis: Map<string, RegionalApi>;
  failoverOrchestrator: FailoverOrchestrator;
  environmentSuffix?: string;
}

export class ChaosTestingSystem extends Construct {
  constructor(scope: Construct, id: string, props: ChaosTestingSystemProps) {
    super(scope, id);

    const envSuffix = props.environmentSuffix || 'dev';
    const stackRegion = cdk.Stack.of(this).region;

    // Create log group for chaos runner with deletion policy
    const chaosLogGroup = new logs.LogGroup(this, 'ChaosRunnerLogGroup', {
      logGroupName: `/aws/lambda/financial-app-chaos-runner-${stackRegion}-${envSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create chaos testing Lambda
    const chaosRunner = new lambda.Function(this, 'ChaosRunner', {
      functionName: `financial-app-chaos-runner-${stackRegion}-${envSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/chaos-runner'),
      architecture: lambda.Architecture.ARM_64, // Graviton2 for better performance and cost
      memorySize: 1024,
      timeout: cdk.Duration.minutes(15),
      environment: {
        REGIONS: JSON.stringify(props.regions),
        FAILOVER_STATE_MACHINE_ARN:
          props.failoverOrchestrator.stateMachine.stateMachineArn,
      },
      role: this.createChaosRole(),
      logGroup: chaosLogGroup,
    });

    // Schedule chaos tests (disabled by default)
    const chaosSchedule = new events.Rule(this, 'ChaosSchedule', {
      schedule: events.Schedule.expression('rate(7 days)'),
      enabled: false, // Enable manually when ready to test
    });

    chaosSchedule.addTarget(
      new targets.LambdaFunction(chaosRunner, {
        event: events.RuleTargetInput.fromObject({
          testScenarios: [
            'region_failure',
            'database_slowdown',
            'api_throttling',
            'network_partition',
            'certificate_expiry',
          ],
          duration: 300, // 5 minutes
          targetRegions: props.regions,
        }),
      })
    );

    // Create SSM parameter for enabling/disabling chaos tests (region-specific)
    new ssm.StringParameter(this, 'ChaosTestingEnabled', {
      parameterName: `/financial-app/chaos-testing/enabled-${stackRegion}-${envSuffix}`,
      stringValue: 'false',
      description: 'Enable or disable chaos testing',
    });

    // Create test result storage
    this.createTestResultStorage();
  }

  private createChaosRole(): iam.Role {
    return new iam.Role(this, 'ChaosRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        ChaosPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                'ec2:RebootInstances',
                'rds:RebootDBInstance',
                'rds:FailoverDBCluster',
                'elasticloadbalancing:SetRulePriorities',
                'route53:ChangeResourceRecordSets',
                'states:StartExecution',
              ],
              resources: ['*'],
              conditions: {
                StringEquals: {
                  'aws:RequestedRegion': cdk.Stack.of(this).region,
                },
              },
            }),
          ],
        }),
      },
    });
  }

  private createTestResultStorage() {
    const envSuffix =
      cdk.Stack.of(this).node.tryGetContext('environmentSuffix') || 'dev';
    const stackRegion = cdk.Stack.of(this).region;
    // Create S3 bucket for test results (region-specific)
    // Keep name short to stay under 63 character limit
    new s3.Bucket(this, 'ChaosTestResults', {
      bucketName: `chaos-results-${stackRegion}-${envSuffix}-${cdk.Stack.of(this).account}`,
      versioned: true,
      lifecycleRules: [
        {
          id: 'delete-old-results',
          expiration: cdk.Duration.days(90),
        },
      ],
      encryption: s3.BucketEncryption.S3_MANAGED,
    });
  }
}
