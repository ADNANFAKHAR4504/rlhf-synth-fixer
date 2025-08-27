import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// This is a placeholder stack that can be used for future enhancements
// The actual multi-region deployment is handled in bin/tap.ts
export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // This stack is intentionally left empty
    // Multi-region deployment is orchestrated directly in bin/tap.ts
    // to ensure proper stack separation per region
  }
}
