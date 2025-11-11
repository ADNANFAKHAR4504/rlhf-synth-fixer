import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Note: This is a wrapper stack that orchestrates the migration stacks
    // The actual infrastructure stacks are created in bin/tap.ts
    // This design allows for flexible multi-environment deployments
  }
}
