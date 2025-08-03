#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// Import your stacks here
import { DynamoDBStack } from './stacks/dynamodb-stack';
import { LambdaStack } from './stacks/lambda-stack';
import { MonitoringStack } from './stacks/monitoring-stack';
import { S3Stack } from './stacks/s3-stack';
import { SQSStack } from './stacks/sqs-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Environment configuration
    const environment = environmentSuffix;
    const region = this.region;

    // Determine if this is the primary region
    const isPrimary = region === 'us-east-1';

    // Create all resource stacks for this region
    new S3Stack(this, 'S3Stack', {
      environment,
      isPrimary,
      region,
    });

    new DynamoDBStack(this, 'DynamoDBStack', {
      environment,
      isPrimary,
      region,
    });

    new SQSStack(this, 'SQSStack', {
      environment,
      isPrimary,
      region,
    });

    new LambdaStack(this, 'LambdaStack', {
      environment,
      isPrimary,
      region,
    });

    new MonitoringStack(this, 'MonitoringStack', {
      environment,
      isPrimary,
      region,
    });
  }
}
