import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface RekognitionStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  imageBucket: s3.Bucket;
}

export class RekognitionStack extends cdk.NestedStack {
  public readonly rekognitionServiceRole: iam.Role;

  constructor(scope: Construct, id: string, props: RekognitionStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // Create a minimal service role for Amazon Rekognition (not used for free tier APIs)
    // Only created for potential future use - standard DetectLabels API doesn't require it
    this.rekognitionServiceRole = new iam.Role(this, 'RekognitionServiceRole', {
      roleName: `serverlessapp-rekognition-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('rekognition.amazonaws.com'),
      description:
        'Service role for Amazon Rekognition operations (not used for free tier APIs)',
      // No managed policies attached to avoid any potential billing
    });

    // Note: We deliberately don't grant S3 bucket access to avoid any advanced features
    // that might incur additional charges

    // Output configuration values for Lambda functions
    new cdk.CfnOutput(this, 'RekognitionServiceRoleArn', {
      value: this.rekognitionServiceRole.roleArn,
      description: 'ARN of the Rekognition service role',
      exportName: `serverlessapp-rekognition-role-arn-${environmentSuffix}`,
    });

    // Configuration for Rekognition detection settings (FREE TIER ONLY)
    new cdk.CfnOutput(this, 'RekognitionConfiguration', {
      value: JSON.stringify({
        minConfidence: environmentSuffix === 'prod' ? 75 : 60,
        maxLabels: 10, // Reasonable limit to control API costs
        detectModerationLabels: false, // Disabled to save on API calls
        detectLabels: true, // Only use free tier DetectLabels API
        supportedImageFormats: ['JPEG', 'PNG'],
        maxImageSize: '5MB', // Reduced to save on processing costs
        freeTierOnly: true, // Flag to indicate free tier usage
        apiCallsPerMonth: 5000, // Free tier limit
      }),
      description: 'Rekognition configuration settings (FREE TIER ONLY)',
      exportName: `serverlessapp-rekognition-config-${environmentSuffix}`,
    });

    // Add resource tags
    cdk.Tags.of(this).add('Component', 'AI-ML');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('Service', 'Rekognition');

    // Add SSM parameters for Rekognition configuration (FREE TIER OPTIMIZED)
    new ssm.StringParameter(this, 'RekognitionMinConfidence', {
      parameterName: `/serverlessapp/${environmentSuffix}/rekognition/min-confidence`,
      stringValue: environmentSuffix === 'prod' ? '75' : '60',
      description:
        'Minimum confidence threshold for Rekognition detection (FREE TIER)',
    });

    new ssm.StringParameter(this, 'RekognitionMaxLabels', {
      parameterName: `/serverlessapp/${environmentSuffix}/rekognition/max-labels`,
      stringValue: '5', // Reduced to minimize API costs
      description:
        'Maximum number of labels to return from Rekognition (FREE TIER)',
    });

    new ssm.StringParameter(this, 'RekognitionFreeTierLimit', {
      parameterName: `/serverlessapp/${environmentSuffix}/rekognition/free-tier-limit`,
      stringValue: '5000', // AWS Free Tier: 5,000 images per month
      description: 'Monthly free tier limit for Rekognition API calls',
    });

    // IMPORTANT: FREE TIER USAGE ONLY
    // This implementation uses ONLY AWS Free Tier Rekognition services:
    // - DetectLabels API: 5,000 images per month FREE
    // - No Custom Models (would incur additional charges)
    // - No Collections (would incur storage charges)
    // - No Custom Labels Projects (would require training costs)
    // - No DetectModerationLabels (disabled to save API calls)
    // - No Video analysis (would incur per-minute charges)
    // - No Celebrity recognition (would incur additional charges)
    // - No Text detection (would incur additional charges)
    //
    // The standard DetectLabels API works out-of-the-box without
    // any additional resource provisioning or charges beyond free tier
  }
}
