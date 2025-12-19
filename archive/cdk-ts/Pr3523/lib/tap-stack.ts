import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ConfigManagementStack } from './config-management-stack';
import { AppConfigStack } from './appconfig-stack';
import { ParameterSecretsStack } from './parameter-secrets-stack';
import { StepFunctionsOrchestrationStack } from './stepfunctions-orchestration-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create the base configuration management stack
    const configManagementStack = new ConfigManagementStack(
      this,
      'ConfigManagementStack',
      {
        environmentSuffix,
      }
    );

    // Create AppConfig stack with validator function
    new AppConfigStack(this, 'AppConfigStack', {
      environmentSuffix,
      validatorFunction: configManagementStack.configValidatorFunction,
    });

    // Create Parameter Store and Secrets Manager stack
    new ParameterSecretsStack(this, 'ParameterSecretsStack', {
      environmentSuffix,
      mobileAppRole: configManagementStack.mobileAppRole,
    });

    // Create Step Functions orchestration stack
    const stepFunctionsStack = new StepFunctionsOrchestrationStack(
      this,
      'StepFunctionsOrchestrationStack',
      {
        environmentSuffix,
        configValidatorFunction: configManagementStack.configValidatorFunction,
        backupBucket: configManagementStack.backupBucket.bucketName,
        configTable: configManagementStack.configTable.tableName,
      }
    );

    // Dependencies are automatically handled through resource references
    // No need for explicit addDependency calls with nested stacks

    // Stack outputs - only output the region since nested stack outputs are in their own stacks
    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS Region for deployment',
    });

    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix for this deployment',
    });

    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: stepFunctionsStack.configDeploymentStateMachine.stateMachineArn,
      description:
        'Step Functions state machine for config deployment orchestration',
    });
  }
}
