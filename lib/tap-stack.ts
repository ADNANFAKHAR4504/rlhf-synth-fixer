import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ImageProcessingStack } from './image-processing-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly environmentSuffix: string;
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    this.environmentSuffix = props?.environmentSuffix || 'dev';

    // Create the Image Processing Stack as a nested stack
    new ImageProcessingStack(this, `ImageProcessing${this.environmentSuffix}`, {
      existingS3BucketName: `existing-images-bucket-${this.environmentSuffix}`,
      environmentSuffix: this.environmentSuffix,
    });
  }
}
