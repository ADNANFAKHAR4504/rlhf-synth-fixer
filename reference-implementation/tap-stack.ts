import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as path from 'path';

// Configuration
const config = new pulumi.Config();
const environmentSuffix = config.require('environmentSuffix');
const awsRegion = config.get('awsRegion') || 'us-east-1';

// Approved AMIs list (configurable)
const approvedAmis = config.getObject<string[]>('approvedAmis') || [
  'ami-0c55b159cbfafe1f0', // Example Amazon Linux 2
  'ami-0574da719dca65348', // Example Ubuntu 20.04
];

// Main stack
export class ComplianceScannerStack {
  public reportBucket: aws.s3.Bucket;
  public scannerLambda: aws.lambda.Function;
  public scheduledRule: aws.cloudwatch.EventRule;

  constructor() {
    // Create S3 bucket for compliance reports
    this.reportBucket = new aws.s3.Bucket(
      `compliance-reports-${environmentSuffix}`,
      {
        bucket: `compliance-reports-${environmentSuffix}`,
        versioning: {
          enabled: true,
        },
        tags: {
          Name: `compliance-reports-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      }
    );

    // Block public access
    new aws.s3.BucketPublicAccessBlock(
      `compliance-reports-public-access-${environmentSuffix}`,
      {
        bucket: this.reportBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      }
    );

    // Create Lambda execution role
    const lambdaRole = new aws.iam.Role(
      `compliance-scanner-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Name: `compliance-scanner-role-${environmentSuffix}`,
        },
      }
    );

    // Attach basic Lambda execution policy
    new aws.iam.RolePolicyAttachment(
      `compliance-scanner-lambda-basic-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      }
    );

    // Create custom policy for compliance scanning
    const compliancePolicy = new aws.iam.Policy(
      `compliance-scanner-policy-${environmentSuffix}`,
      {
        policy: this.reportBucket.arn.apply(arn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'ec2:DescribeInstances',
                  'ec2:DescribeVolumes',
                  'ec2:DescribeSecurityGroups',
                  'ec2:DescribeVpcs',
                  'ec2:DescribeFlowLogs',
                  'ssm:DescribeInstanceInformation',
                  'cloudwatch:PutMetricData',
                ],
                Resource: '*',
              },
              {
                Effect: 'Allow',
                Action: ['s3:PutObject', 's3:PutObjectAcl'],
                Resource: `${arn}/*`,
              },
            ],
          })
        ),
        tags: {
          Name: `compliance-scanner-policy-${environmentSuffix}`,
        },
      }
    );

    // Attach custom policy
    new aws.iam.RolePolicyAttachment(
      `compliance-scanner-custom-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn: compliancePolicy.arn,
      }
    );

    // Lambda function for scheduled scanning
    this.scannerLambda = new aws.lambda.Function(
      `compliance-scanner-${environmentSuffix}`,
      {
        runtime: aws.lambda.Runtime.NodeJS20dX,
        handler: 'index.handler',
        role: lambdaRole.arn,
        timeout: 300,
        memorySize: 512,
        environment: {
          variables: {
            ENVIRONMENT_SUFFIX: environmentSuffix,
            AWS_REGION_NAME: awsRegion,
            REPORT_BUCKET: this.reportBucket.id,
            APPROVED_AMIS: JSON.stringify(approvedAmis),
          },
        },
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive(path.join(__dirname, 'lambda')),
        }),
        tags: {
          Name: `compliance-scanner-${environmentSuffix}`,
        },
      }
    );

    // EventBridge rule for daily scanning
    this.scheduledRule = new aws.cloudwatch.EventRule(
      `compliance-scan-schedule-${environmentSuffix}`,
      {
        scheduleExpression: 'rate(1 day)',
        description: 'Trigger compliance scanner daily',
        tags: {
          Name: `compliance-scan-schedule-${environmentSuffix}`,
        },
      }
    );

    // Allow EventBridge to invoke Lambda
    new aws.lambda.Permission(
      `compliance-scanner-eventbridge-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: this.scannerLambda.name,
        principal: 'events.amazonaws.com',
        sourceArn: this.scheduledRule.arn,
      }
    );

    // EventBridge target
    new aws.cloudwatch.EventTarget(
      `compliance-scanner-target-${environmentSuffix}`,
      {
        rule: this.scheduledRule.name,
        arn: this.scannerLambda.arn,
      }
    );
  }
}

// Instantiate the stack
const stack = new ComplianceScannerStack();

// Export stack outputs
export const reportBucketName = stack.reportBucket.id;
export const scannerLambdaArn = stack.scannerLambda.arn;
export const scheduledRuleName = stack.scheduledRule.name;

// Export ComplianceScanner for testing purposes
export { ComplianceScanner } from './lambda/compliance-scanner';
