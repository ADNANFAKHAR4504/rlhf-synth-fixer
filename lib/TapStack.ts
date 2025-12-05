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
    // Note: This is minimal infrastructure to demonstrate the validation framework

    // Example S3 bucket with encryption (compliant)
    const compliantBucket = new s3.Bucket(this, 'CompliantBucket', {
      bucketName: `compliant-bucket-${environmentSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Example S3 bucket without encryption (non-compliant for testing)
    const nonCompliantBucket = new s3.Bucket(this, 'NonCompliantBucket', {
      bucketName: `non-compliant-bucket-${environmentSuffix}`,
      encryption: s3.BucketEncryption.UNENCRYPTED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Example Lambda function for validation testing
    // Created without variable assignment - resources are registered with CDK via constructor
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

    // Example Lambda with issues (for testing)
    // Created without variable assignment - resources are registered with CDK via constructor
    new lambda.Function(this, 'ProblematicFunction', {
      functionName: `problematic-function-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          return { statusCode: 200, body: 'OK' };
        };
      `),
      timeout: cdk.Duration.seconds(900), // Excessive timeout
      memorySize: 128, // Low memory
      // Missing environment variables
    });

    // Example IAM role with overly permissive policy (for testing)
    const problematicRole = new iam.Role(this, 'ProblematicRole', {
      roleName: `problematic-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    problematicRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['*'], // Wildcard action
        resources: ['*'], // Wildcard resource
      })
    );

    // Apply validation aspects to the stack
    cdk.Aspects.of(this).add(new S3EncryptionAspect());
    cdk.Aspects.of(this).add(new IAMPolicyAspect());
    cdk.Aspects.of(this).add(new LambdaConfigAspect());
    cdk.Aspects.of(this).add(new RDSConfigAspect());

    // Generate validation report after synthesis
    // Created without variable assignment - reporter works via construct creation
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
