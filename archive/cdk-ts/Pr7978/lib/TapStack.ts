import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { S3EncryptionAspect } from './aspects/s3-encryption-aspect';
import { IAMPolicyAspect } from './aspects/iam-policy-aspect';
import { LambdaConfigAspect } from './aspects/lambda-config-aspect';
import { RDSConfigAspect } from './aspects/rds-config-aspect';
import { ValidationReporter } from './reporters/validation-reporter';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // Create example infrastructure for validation testing
    // Includes both compliant and non-compliant resources to demonstrate validation

    // Example S3 bucket with encryption (compliant)
    const compliantBucket = new s3.Bucket(this, 'CompliantBucket', {
      bucketName: `compliant-bucket-${environmentSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Example S3 bucket WITHOUT encryption (non-compliant - for validation testing)
    const nonCompliantBucket = new s3.Bucket(this, 'NonCompliantBucket', {
      bucketName: `non-compliant-bucket-${environmentSuffix}`,
      encryption: s3.BucketEncryption.UNENCRYPTED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Example Lambda function with proper configuration (compliant)
    new lambda.Function(this, 'ExampleFunction', {
      functionName: `example-function-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          return { statusCode: 200, body: 'OK' };
        };
      `),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        ENV: 'test',
        REGION: this.region,
      },
    });

    // Example Lambda with configuration issues (non-compliant - for validation testing)
    new lambda.Function(this, 'ProblematicFunction', {
      functionName: `problematic-function-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          return { statusCode: 200, body: 'OK' };
        };
      `),
      timeout: cdk.Duration.seconds(900), // Excessive timeout - triggers warning
      memorySize: 128, // Low memory - triggers info finding
      // Missing environment variables - triggers warning
    });

    // Example IAM role with overly permissive policy (non-compliant - for validation testing)
    const problematicRole = new iam.Role(this, 'ProblematicRole', {
      roleName: `problematic-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    // Add wildcard permissions (non-compliant - triggers critical IAM finding)
    problematicRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['*'], // Wildcard action - security risk
        resources: ['*'], // Wildcard resource - security risk
      })
    );

    // Apply validation aspects to the stack
    cdk.Aspects.of(this).add(new S3EncryptionAspect());
    cdk.Aspects.of(this).add(new IAMPolicyAspect());
    cdk.Aspects.of(this).add(new LambdaConfigAspect());
    cdk.Aspects.of(this).add(new RDSConfigAspect());

    // Generate validation report after synthesis
    new ValidationReporter(this, 'ValidationReporter', {
      environmentSuffix,
      outputPath: './validation-report.json',
    });

    // Outputs for testing
    new cdk.CfnOutput(this, 'CompliantBucketName', {
      value: compliantBucket.bucketName,
      description: 'Name of the compliant S3 bucket',
    });

    new cdk.CfnOutput(this, 'NonCompliantBucketName', {
      value: nonCompliantBucket.bucketName,
      description: 'Name of the non-compliant S3 bucket',
    });
  }
}
