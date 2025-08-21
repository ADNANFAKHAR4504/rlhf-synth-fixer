import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface SecurityConstructProps {
  environmentSuffix: string;
  region: string;
}

export class SecurityConstruct extends Construct {
  public readonly kmsKey: cdk.aws_kms.Key;
  public readonly lambdaExecutionRole: cdk.aws_iam.Role;
  public readonly crossRegionRole: cdk.aws_iam.Role;

  constructor(scope: Construct, id: string, props: SecurityConstructProps) {
    super(scope, id);

    const { environmentSuffix, region } = props;

    // KMS Key for encryption (unique per region as requested)
    this.kmsKey = new cdk.aws_kms.Key(this, 'EncryptionKey', {
      keyUsage: cdk.aws_kms.KeyUsage.ENCRYPT_DECRYPT,
      keySpec: cdk.aws_kms.KeySpec.SYMMETRIC_DEFAULT,
      description: `KMS key for ${environmentSuffix} environment in ${region}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For dev/test environments
    });

    // KMS Key Alias
    new cdk.aws_kms.Alias(this, 'EncryptionKeyAlias', {
      aliasName: `alias/${environmentSuffix}-encryption-key-${region}`,
      targetKey: this.kmsKey,
    });

    // Lambda Execution Role with cross-region permissions
    this.lambdaExecutionRole = new cdk.aws_iam.Role(
      this,
      'LambdaExecutionRole',
      {
        roleName: `${environmentSuffix}-lambda-execution-role-${region}`,
        assumedBy: new cdk.aws_iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaVPCAccessExecutionRole'
          ),
        ],
        inlinePolicies: {
          CrossRegionAccess: new cdk.aws_iam.PolicyDocument({
            statements: [
              new cdk.aws_iam.PolicyStatement({
                effect: cdk.aws_iam.Effect.ALLOW,
                actions: [
                  'dynamodb:GetItem',
                  'dynamodb:PutItem',
                  'dynamodb:UpdateItem',
                  'dynamodb:DeleteItem',
                  'dynamodb:Query',
                  'dynamodb:Scan',
                ],
                resources: [
                  `arn:aws:dynamodb:*:${cdk.Stack.of(this).account}:table/${environmentSuffix}-*`,
                ],
              }),
              new cdk.aws_iam.PolicyStatement({
                effect: cdk.aws_iam.Effect.ALLOW,
                actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
                resources: [`arn:aws:s3:::${environmentSuffix}-*/*`],
              }),
              new cdk.aws_iam.PolicyStatement({
                effect: cdk.aws_iam.Effect.ALLOW,
                actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
                resources: [this.kmsKey.keyArn],
              }),
              new cdk.aws_iam.PolicyStatement({
                effect: cdk.aws_iam.Effect.ALLOW,
                actions: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                ],
                resources: ['*'],
              }),
            ],
          }),
        },
      }
    );

    // Cross-region STS assume role
    this.crossRegionRole = new cdk.aws_iam.Role(this, 'CrossRegionRole', {
      roleName: `${environmentSuffix}-cross-region-role-${region}`,
      assumedBy: new cdk.aws_iam.AccountRootPrincipal(),
      inlinePolicies: {
        CrossRegionPolicy: new cdk.aws_iam.PolicyDocument({
          statements: [
            new cdk.aws_iam.PolicyStatement({
              effect: cdk.aws_iam.Effect.ALLOW,
              actions: ['sts:AssumeRole'],
              resources: [
                `arn:aws:iam::${cdk.Stack.of(this).account}:role/${environmentSuffix}-cross-region-role-*`,
              ],
            }),
          ],
        }),
      },
    });
  }
}
