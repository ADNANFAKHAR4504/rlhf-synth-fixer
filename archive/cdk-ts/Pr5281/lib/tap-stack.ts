import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import path from 'path';
import { MonitoringStack } from './monitoring/cloudwatch-alarms';
import { SlackNotifier } from './monitoring/notifications';
import { CodePipelineStack } from './pipeline/code-pipeline-stack';
import { SecurityConfig } from './security/secrets-config';
// ? Import your stacks here
// import { MyStack } from './my-stack';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  company?: string;
  division?: string;
  targetAccountId?: string;
  slackWebhookUrl?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.

    const config = this.buildConfig(props);
    const removalPolicy = this.isProduction(config.environmentSuffix)
      ? cdk.RemovalPolicy.RETAIN
      : cdk.RemovalPolicy.DESTROY;

    // Create security configuration
    const securityConfig = new SecurityConfig(this, 'SecurityConfig', {
      config,
      removalPolicy,
    });
    const slackWebhookUrl = props?.slackWebhookUrl;

    let slackNotifier: SlackNotifier | undefined = undefined;

    if (slackWebhookUrl) {
      slackNotifier = new SlackNotifier(this, 'SlackNotifier', {
        config,
        slackWebhookUrl,
        removalPolicy,
      });
    }

    // Create pipeline
    const pipeline = new CodePipelineStack(this, 'Pipeline', {
      config,
      removalPolicy,
      securityConfig,
      appSourcePath: path.join(__dirname, 'app'),
      notificationLambda: slackNotifier?.notificationLambda,
    });

    // Create monitoring
    new MonitoringStack(this, 'Monitoring', {
      config,
      pipeline: pipeline.pipeline,
      removalPolicy,
      notificationLambda: slackNotifier?.notificationLambda,
    });

    this.applyTags(config);
  }
  private buildConfig(props?: TapStackProps) {
    return {
      environmentSuffix:
        props?.environmentSuffix ||
        this.node.tryGetContext('environmentSuffix') ||
        'dev',
      company: props?.company || 'acme',
      division: props?.division || 'tech',
      targetAccountId: props?.targetAccountId || this.account,
    };
  }
  private isProduction(environment: string): boolean {
    return environment.toLowerCase().includes('prod');
  }

  private applyTags(config: any) {
    cdk.Tags.of(this).add('Company', config.company);
    cdk.Tags.of(this).add('Division', config.division);
    cdk.Tags.of(this).add('Environment', config.environmentSuffix);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('CostCenter', `${config.company}-${config.division}`);
  }
}
