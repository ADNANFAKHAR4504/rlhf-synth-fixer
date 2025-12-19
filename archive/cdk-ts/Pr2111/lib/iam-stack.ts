import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface IAMStackProps extends cdk.StackProps {
  readonly s3Buckets: s3.IBucket[];
  readonly region: string;
  readonly environmentSuffix?: string;
}

export class IAMStack extends cdk.Stack {
  public readonly lambdaExecutionRole: iam.Role;
  public readonly lambdaS3AccessRole: iam.Role;

  constructor(scope: Construct, id: string, props: IAMStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';

    // Create Lambda execution role with basic execution permissions
    this.lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: `lambda-execution-role-${props.region}-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Basic execution role for Lambda functions',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Create Lambda role with S3 access permissions (principle of least privilege)
    this.lambdaS3AccessRole = new iam.Role(this, 'LambdaS3AccessRole', {
      roleName: `lambda-s3-access-role-${props.region}-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description:
        'Lambda role with S3 access permissions following least privilege principle',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Create custom policy for S3 access with least privilege
    const s3AccessPolicy = new iam.Policy(this, 'LambdaS3AccessPolicy', {
      policyName: `lambda-s3-access-policy-${props.region}-${environmentSuffix}`,
      statements: [
        // Read permissions for S3 buckets
        new iam.PolicyStatement({
          sid: 'AllowS3ReadAccess',
          effect: iam.Effect.ALLOW,
          actions: [
            's3:GetObject',
            's3:GetObjectVersion',
            's3:GetObjectAttributes',
            's3:GetObjectTagging',
          ],
          resources: props.s3Buckets.map(bucket => `${bucket.bucketArn}/*`),
        }),
        // List permissions for S3 buckets
        new iam.PolicyStatement({
          sid: 'AllowS3ListAccess',
          effect: iam.Effect.ALLOW,
          actions: [
            's3:ListBucket',
            's3:ListBucketVersions',
            's3:GetBucketLocation',
            's3:GetBucketVersioning',
          ],
          resources: props.s3Buckets.map(bucket => bucket.bucketArn),
        }),
        // Write permissions for S3 buckets (limited scope)
        new iam.PolicyStatement({
          sid: 'AllowS3WriteAccess',
          effect: iam.Effect.ALLOW,
          actions: ['s3:PutObject', 's3:PutObjectTagging', 's3:DeleteObject'],
          resources: props.s3Buckets.map(
            bucket => `${bucket.bucketArn}/lambda-processed/*`
          ),
        }),
      ],
    });

    // Attach the custom policy to the S3 access role
    this.lambdaS3AccessRole.attachInlinePolicy(s3AccessPolicy);

    // Apply Environment:Production tags to all IAM resources
    [this.lambdaExecutionRole, this.lambdaS3AccessRole].forEach(resource => {
      cdk.Tags.of(resource).add('Environment', 'Production');
      cdk.Tags.of(resource).add('Project', 'trainr302');
      cdk.Tags.of(resource).add('Region', props.region);
    });

    // Note: IAM Policies don't support tags in CloudFormation

    // Create a role for cross-region operations
    const crossRegionRole = new iam.Role(this, 'CrossRegionOperationsRole', {
      roleName: `cross-region-operations-role-${props.region}-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for Lambda functions that need cross-region access',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Add cross-region permissions
    crossRegionRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'AllowCrossRegionS3Access',
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:ListBucket', 's3:GetBucketLocation'],
        resources: [
          'arn:aws:s3:::multi-region-bucket-*',
          'arn:aws:s3:::multi-region-bucket-*/*',
        ],
      })
    );

    // Apply Environment:Production tag
    cdk.Tags.of(crossRegionRole).add('Environment', 'Production');
    cdk.Tags.of(crossRegionRole).add('Project', 'trainr302');

    // Output role ARNs for reference
    new cdk.CfnOutput(this, 'LambdaExecutionRoleArn', {
      value: this.lambdaExecutionRole.roleArn,
      description: `Lambda execution role ARN for region ${props.region}`,
      exportName: `LambdaExecutionRoleArn-${props.region}`,
    });

    new cdk.CfnOutput(this, 'LambdaS3AccessRoleArn', {
      value: this.lambdaS3AccessRole.roleArn,
      description: `Lambda S3 access role ARN for region ${props.region}`,
      exportName: `LambdaS3AccessRoleArn-${props.region}`,
    });

    new cdk.CfnOutput(this, 'CrossRegionRoleArn', {
      value: crossRegionRole.roleArn,
      description: `Cross-region operations role ARN for region ${props.region}`,
      exportName: `CrossRegionRoleArn-${props.region}`,
    });
  }
}
