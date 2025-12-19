import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface TapStackArgs {
  environmentSuffix: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly ec2InstanceId: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly s3BucketName: pulumi.Output<string>;

  constructor(
    name: string,
    args: TapStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:infrastructure:TapStack', name, {}, opts);

    const { environmentSuffix } = args;

    // Get the latest Amazon Linux 2 AMI
    const ami = aws.ec2.getAmi({
      mostRecent: true,
      owners: ['amazon'],
      filters: [
        { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
        { name: 'state', values: ['available'] },
      ],
    });

    // VPC for EC2 instance
    const vpc = new aws.ec2.Vpc(
      `inspector-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `inspector-vpc-${environmentSuffix}`,
          Environment: environmentSuffix,
          CostCenter: 'security',
        },
      },
      { parent: this }
    );

    // Internet Gateway for VPC
    const igw = new aws.ec2.InternetGateway(
      `inspector-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `inspector-igw-${environmentSuffix}`,
          Environment: environmentSuffix,
          CostCenter: 'security',
        },
      },
      { parent: this }
    );

    // Public subnet for EC2
    const subnet = new aws.ec2.Subnet(
      `inspector-subnet-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: 'us-east-1a',
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `inspector-subnet-${environmentSuffix}`,
          Environment: environmentSuffix,
          CostCenter: 'security',
        },
      },
      { parent: this }
    );

    // Route table for internet access
    const routeTable = new aws.ec2.RouteTable(
      `inspector-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `inspector-rt-${environmentSuffix}`,
          Environment: environmentSuffix,
          CostCenter: 'security',
        },
      },
      { parent: this }
    );

    // Route to internet gateway
    new aws.ec2.Route(
      `inspector-route-${environmentSuffix}`,
      {
        routeTableId: routeTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      },
      { parent: this }
    );

    // Associate route table with subnet
    new aws.ec2.RouteTableAssociation(
      `inspector-rta-${environmentSuffix}`,
      {
        subnetId: subnet.id,
        routeTableId: routeTable.id,
      },
      { parent: this }
    );

    // Security group for EC2
    const securityGroup = new aws.ec2.SecurityGroup(
      `inspector-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for Inspector target EC2 instance',
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          Name: `inspector-sg-${environmentSuffix}`,
          Environment: environmentSuffix,
          CostCenter: 'security',
        },
      },
      { parent: this }
    );

    // IAM role for EC2 instance (for SSM)
    const ec2Role = new aws.iam.Role(
      `inspector-ec2-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'ec2.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Name: `inspector-ec2-role-${environmentSuffix}`,
          Environment: environmentSuffix,
          CostCenter: 'security',
        },
      },
      { parent: this }
    );

    // Attach SSM policy for management
    new aws.iam.RolePolicyAttachment(
      `inspector-ssm-policy-${environmentSuffix}`,
      {
        role: ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      },
      { parent: this }
    );

    // Instance profile
    const instanceProfile = new aws.iam.InstanceProfile(
      `inspector-profile-${environmentSuffix}`,
      {
        role: ec2Role.name,
        tags: {
          Name: `inspector-profile-${environmentSuffix}`,
          Environment: environmentSuffix,
          CostCenter: 'security',
        },
      },
      { parent: this }
    );

    // EC2 instance for Inspector scanning
    const ec2Instance = new aws.ec2.Instance(
      `inspector-target-${environmentSuffix}`,
      {
        ami: ami.then(a => a.id),
        instanceType: 't3.micro',
        subnetId: subnet.id,
        vpcSecurityGroupIds: [securityGroup.id],
        iamInstanceProfile: instanceProfile.name,
        tags: {
          Name: `inspector-target-${environmentSuffix}`,
          Environment: environmentSuffix,
          CostCenter: 'security',
          InspectorScanning: 'enabled',
        },
      },
      { parent: this }
    );

    // SNS topic for security findings
    const snsTopic = new aws.sns.Topic(
      `security-alerts-${environmentSuffix}`,
      {
        displayName: `Security Alerts ${environmentSuffix}`,
        tags: {
          Name: `security-alerts-${environmentSuffix}`,
          Environment: environmentSuffix,
          CostCenter: 'security',
        },
      },
      { parent: this }
    );

    // S3 bucket for audit trail
    const s3Bucket = new aws.s3.BucketV2(
      `inspector-audit-${environmentSuffix}`,
      {
        bucket: `inspector-audit-${environmentSuffix}`,
        forceDestroy: true,
        tags: {
          Name: `inspector-audit-${environmentSuffix}`,
          Environment: environmentSuffix,
          CostCenter: 'security',
        },
      },
      { parent: this }
    );

    // S3 bucket versioning
    new aws.s3.BucketVersioningV2(
      `inspector-audit-versioning-${environmentSuffix}`,
      {
        bucket: s3Bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // S3 bucket encryption
    new aws.s3.BucketServerSideEncryptionConfigurationV2(
      `inspector-audit-encryption-${environmentSuffix}`,
      {
        bucket: s3Bucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      },
      { parent: this }
    );

    // IAM role for Lambda function
    const lambdaRole = new aws.iam.Role(
      `inspector-lambda-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Name: `inspector-lambda-role-${environmentSuffix}`,
          Environment: environmentSuffix,
          CostCenter: 'security',
        },
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    new aws.iam.RolePolicyAttachment(
      `inspector-lambda-basic-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Lambda policy for S3 and SNS
    const lambdaPolicy = new aws.iam.RolePolicy(
      `inspector-lambda-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi.interpolate`{
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "s3:PutObject"
              ],
              "Resource": "${s3Bucket.arn}/*"
            },
            {
              "Effect": "Allow",
              "Action": [
                "sns:Publish"
              ],
              "Resource": "${snsTopic.arn}"
            },
            {
              "Effect": "Allow",
              "Action": [
                "inspector2:GetFindingsReportStatus",
                "inspector2:ListFindings"
              ],
              "Resource": "*"
            }
          ]
        }`,
      },
      { parent: this }
    );

    // Lambda function to process Inspector findings
    const lambdaFunction = new aws.lambda.Function(
      `inspector-processor-${environmentSuffix}`,
      {
        runtime: aws.lambda.Runtime.NodeJS18dX,
        handler: 'index.handler',
        role: lambdaRole.arn,
        timeout: 60,
        environment: {
          variables: {
            SNS_TOPIC_ARN: snsTopic.arn,
            S3_BUCKET: s3Bucket.bucket,
          },
        },
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const s3Client = new S3Client({});
const snsClient = new SNSClient({});

exports.handler = async (event) => {
  try {
    console.log('Received Inspector finding:', JSON.stringify(event, null, 2));

    const finding = event.detail;
    const timestamp = new Date().toISOString();
    const date = timestamp.split('T')[0];

    // Store finding in S3 for audit trail
    const s3Key = \`findings/\${date}/\${finding.findingArn.split('/').pop()}.json\`;
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: s3Key,
      Body: JSON.stringify(finding, null, 2),
      ContentType: 'application/json',
    }));

    // Format alert message
    const severity = finding.severity || 'UNKNOWN';
    const title = finding.title || 'Unknown Finding';
    const resourceId = finding.resources?.[0]?.id || 'Unknown Resource';

    const message = \`
AWS Inspector Finding Alert

Severity: \${severity}
Title: \${title}
Resource: \${resourceId}
Time: \${timestamp}

Finding Details:
\${JSON.stringify(finding, null, 2)}

Audit Trail: s3://\${process.env.S3_BUCKET}/\${s3Key}
    \`;

    // Send SNS notification
    await snsClient.send(new PublishCommand({
      TopicArn: process.env.SNS_TOPIC_ARN,
      Subject: \`Inspector Finding: \${severity} - \${title}\`,
      Message: message,
    }));

    console.log('Successfully processed finding');
    return { statusCode: 200, body: 'Finding processed' };
  } catch (error) {
    console.error('Error processing finding:', error);
    throw error;
  }
};
          `),
          'package.json': new pulumi.asset.StringAsset(
            JSON.stringify({
              name: 'inspector-processor',
              version: '1.0.0',
              dependencies: {
                '@aws-sdk/client-s3': '^3.400.0',
                '@aws-sdk/client-sns': '^3.400.0',
              },
            })
          ),
        }),
        tags: {
          Name: `inspector-processor-${environmentSuffix}`,
          Environment: environmentSuffix,
          CostCenter: 'security',
        },
      },
      { parent: this, dependsOn: [lambdaPolicy] }
    );

    // EventBridge rule to capture Inspector findings
    const findingsRule = new aws.cloudwatch.EventRule(
      `inspector-findings-rule-${environmentSuffix}`,
      {
        name: `inspector-findings-${environmentSuffix}`,
        description: 'Capture AWS Inspector v2 findings',
        eventPattern: JSON.stringify({
          source: ['aws.inspector2'],
          'detail-type': ['Inspector2 Finding'],
        }),
        tags: {
          Name: `inspector-findings-rule-${environmentSuffix}`,
          Environment: environmentSuffix,
          CostCenter: 'security',
        },
      },
      { parent: this }
    );

    // EventBridge target to trigger Lambda
    new aws.cloudwatch.EventTarget(
      `inspector-findings-target-${environmentSuffix}`,
      {
        rule: findingsRule.name,
        arn: lambdaFunction.arn,
      },
      { parent: this }
    );

    // Lambda permission for EventBridge
    new aws.lambda.Permission(
      `inspector-lambda-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: lambdaFunction.name,
        principal: 'events.amazonaws.com',
        sourceArn: findingsRule.arn,
      },
      { parent: this }
    );

    // Note: Inspector v2 automatically scans EC2 instances once enabled at the account level
    // No need for assessment templates or targets like Inspector Classic
    // OrganizationConfiguration requires organization-level permissions, so it's omitted here
    // Inspector v2 must be enabled manually in the AWS Console or via AWS Organizations

    // Outputs
    this.vpcId = vpc.id;
    this.ec2InstanceId = ec2Instance.id;
    this.snsTopicArn = snsTopic.arn;
    this.s3BucketName = s3Bucket.bucket;

    this.registerOutputs({
      vpcId: this.vpcId,
      ec2InstanceId: this.ec2InstanceId,
      snsTopicArn: this.snsTopicArn,
      s3BucketName: this.s3BucketName,
    });
  }
}
