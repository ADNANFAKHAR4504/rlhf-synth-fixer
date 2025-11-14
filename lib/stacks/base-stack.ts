import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/environment-config';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export interface BaseStackProps extends cdk.StackProps {
  environmentConfig: EnvironmentConfig;
  environmentSuffix?: string;
}

export class BaseStack extends cdk.Stack {
  protected readonly environmentConfig: EnvironmentConfig;
  protected readonly environmentSuffix: string;

  constructor(scope: Construct, id: string, props: BaseStackProps) {
    super(scope, id, {
      ...props,
      env: props.environmentConfig.env,
      tags: props.environmentConfig.tags,
    });

    this.environmentConfig = props.environmentConfig;
    this.environmentSuffix =
      props.environmentSuffix || props.environmentConfig.name;

    // Apply environment tags to all resources in this stack
    Object.entries(props.environmentConfig.tags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });
  }

  protected exportToParameterStore(parameterName: string, value: string): void {
    new ssm.StringParameter(
      this,
      `Param${parameterName.replace(/[^a-zA-Z0-9]/g, '')}`,
      {
        parameterName: `/trading-platform/${this.environmentSuffix}/${parameterName}`,
        stringValue: value,
        description: `Exported value from ${this.stackName}`,
        tier: ssm.ParameterTier.STANDARD,
      }
    );
  }

  protected getResourceName(resourceType: string): string {
    return `${resourceType}-${this.environmentSuffix}`;
  }
}
