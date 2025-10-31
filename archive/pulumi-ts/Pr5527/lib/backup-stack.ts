import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface BackupStackArgs {
  environmentSuffix: string;
  rdsInstanceId: pulumi.Output<string>;
  rdsEndpoint: pulumi.Output<string>;
  vpcId: pulumi.Output<string>;
  privateSubnetIds: pulumi.Output<string[]>;
  lambdaSecurityGroupId: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class BackupStack extends pulumi.ComponentResource {
  public readonly bucketName: pulumi.Output<string>;
  public readonly lambdaFunctionName: pulumi.Output<string>;

  constructor(
    name: string,
    args: BackupStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:backup:BackupStack', name, {}, opts);

    // Create S3 bucket for snapshots
    const bucket = new aws.s3.Bucket(
      `backup-bucket-${args.environmentSuffix}`,
      {
        versioning: {
          enabled: true,
        },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        lifecycleRules: [
          {
            enabled: true,
            expiration: {
              days: 30,
            },
          },
        ],
        tags: pulumi.all([args.tags]).apply(([tags]) => ({
          ...tags,
          Name: `backup-bucket-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // IAM role for Lambda
    const lambdaRole = new aws.iam.Role(
      `backup-lambda-role-${args.environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Effect: 'Allow',
            },
          ],
        }),
        tags: args.tags,
      },
      { parent: this }
    );

    // Attach policies to Lambda role
    new aws.iam.RolePolicyAttachment(
      `lambda-vpc-execution-${args.environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `lambda-rds-access-${args.environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonRDSFullAccess',
      },
      { parent: this }
    );

    // Lambda function for backup testing
    const lambdaFunction = new aws.lambda.Function(
      `backup-test-${args.environmentSuffix}`,
      {
        runtime: 'python3.11',
        handler: 'index.handler',
        role: lambdaRole.arn,
        timeout: 900,
        vpcConfig: {
          subnetIds: args.privateSubnetIds,
          securityGroupIds: [args.lambdaSecurityGroupId],
        },
        environment: {
          variables: {
            RDS_INSTANCE_ID: args.rdsInstanceId,
            RDS_ENDPOINT: args.rdsEndpoint,
          },
        },
        code: new pulumi.asset.AssetArchive({
          'index.py': new pulumi.asset.StringAsset(`
import boto3
import os

rds_client = boto3.client('rds')

def handler(event, context):
    instance_id = os.environ['RDS_INSTANCE_ID']

    # Create snapshot
    snapshot_id = f"{instance_id}-test-{context.request_id}"
    rds_client.create_db_snapshot(
        DBSnapshotIdentifier=snapshot_id,
        DBInstanceIdentifier=instance_id
    )

    return {
        'statusCode': 200,
        'body': f'Snapshot {snapshot_id} created'
    }
`),
        }),
        tags: args.tags,
      },
      { parent: this }
    );

    // EventBridge rule for weekly execution
    const rule = new aws.cloudwatch.EventRule(
      `backup-test-schedule-${args.environmentSuffix}`,
      {
        scheduleExpression: 'rate(7 days)',
        tags: args.tags,
      },
      { parent: this }
    );

    new aws.cloudwatch.EventTarget(
      `backup-test-target-${args.environmentSuffix}`,
      {
        rule: rule.name,
        arn: lambdaFunction.arn,
      },
      { parent: this }
    );

    new aws.lambda.Permission(
      `backup-test-permission-${args.environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: lambdaFunction.name,
        principal: 'events.amazonaws.com',
        sourceArn: rule.arn,
      },
      { parent: this }
    );

    this.bucketName = bucket.id;
    this.lambdaFunctionName = lambdaFunction.name;

    this.registerOutputs({
      bucketName: this.bucketName,
      lambdaFunctionName: this.lambdaFunctionName,
    });
  }
}
