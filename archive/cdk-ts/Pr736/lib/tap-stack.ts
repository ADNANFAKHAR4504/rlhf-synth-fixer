import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const stackName = props?.stackName || `TapStack${environmentSuffix}`;

    // VPC with public and private subnets
    const vpc = new ec2.Vpc(this, 'cf-task-vpc', {
      vpcName: `cf-task-vpc-${environmentSuffix}`,
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'cf-task-public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'cf-task-private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Note: Advanced security features like VPC Block Public Access and Network Firewall
    // are commented out as they may not be available in all regions or accounts
    // These can be enabled based on specific requirements and availability

    // VPC Block Public Access (if needed and available in region)
    // const vpcBPA = new ec2.CfnVPCBlockPublicAccessOptions(this, 'cf-task-vpc-bpa', {
    //   vpcId: vpc.vpcId,
    //   internetGatewayBlockMode: 'off', // Allowing IGW access for public subnet
    //   restrictPublicDnsResolution: false,
    // });

    // Network Firewall with Active Threat Defense (if needed and managed rules are available)
    // Note: Network Firewall managed rules require subscriptions and may not be available
    // const networkFirewallPolicy = new networkfirewall.CfnFirewallPolicy(
    //   this,
    //   'cf-task-firewall-policy',
    //   {
    //     firewallPolicyName: `cf-task-firewall-policy-${environmentSuffix}`,
    //     firewallPolicy: {
    //       statelessDefaultActions: ['aws:forward_to_sfe'],
    //       statelessFragmentDefaultActions: ['aws:forward_to_sfe'],
    //     },
    //   }
    // );

    // const networkFirewall = new networkfirewall.CfnFirewall(
    //   this,
    //   'cf-task-firewall',
    //   {
    //     firewallName: `cf-task-network-firewall-${environmentSuffix}`,
    //     firewallPolicyArn: networkFirewallPolicy.attrFirewallPolicyArn,
    //     vpcId: vpc.vpcId,
    //     subnetMappings: vpc.publicSubnets.map(subnet => ({
    //       subnetId: subnet.subnetId,
    //     })),
    //   }
    // );

    // Security Group for EC2 instance
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'cf-task-ec2-sg', {
      securityGroupName: `cf-task-ec2-security-group-${environmentSuffix}`,
      vpc,
      description: 'Security group for EC2 instance with restricted SSH access',
      allowAllOutbound: true,
    });

    // Allow SSH from specific IP ranges (adjust as needed)
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/8'), // Private IP range
      ec2.Port.tcp(22),
      'SSH access from private network'
    );

    // EC2 instance in public subnet
    const ec2Instance = new ec2.Instance(this, 'cf-task-ec2', {
      instanceName: `cf-task-ec2-instance-${environmentSuffix}`,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroup: ec2SecurityGroup,
      // Key pair is optional - you can add one later for SSH access
      // keyPair: ec2.KeyPair.fromKeyPairName(this, 'cf-task-keypair', 'default'),
    });

    // S3 bucket for file uploads
    const s3Bucket = new s3.Bucket(this, 'cf-task-s3-bucket', {
      bucketName: `cf-task-s3-bucket-${environmentSuffix}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // SNS topic
    const snsTopic = new sns.Topic(this, 'cf-task-sns-topic', {
      topicName: `cf-task-sns-topic-${environmentSuffix}`,
      displayName: 'File Upload Notification Topic',
    });

    // IAM role for Lambda function
    const lambdaRole = new iam.Role(this, 'cf-task-lambda-role', {
      roleName: `cf-task-lambda-execution-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
    });

    // Add S3 and SNS permissions to Lambda role
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:GetObjectVersion',
          's3:PutObject',
          's3:DeleteObject',
        ],
        resources: [s3Bucket.bucketArn, `${s3Bucket.bucketArn}/*`],
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sns:Publish'],
        resources: [snsTopic.topicArn],
      })
    );

    // Lambda function
    const lambdaFunction = new lambda.Function(
      this,
      'cf-task-lambda-function',
      {
        functionName: `cf-task-file-processor-${environmentSuffix}`,
        runtime: lambda.Runtime.PYTHON_3_12,
        handler: 'index.lambda_handler',
        role: lambdaRole,
        vpc: vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        environment: {
          SNS_TOPIC_ARN: snsTopic.topicArn,
          BUCKET_NAME: s3Bucket.bucketName,
        },
        timeout: cdk.Duration.seconds(60),
        memorySize: 256,
        code: lambda.Code.fromInline(`
import json
import boto3
import os

def lambda_handler(event, context):
    """
    Lambda function to process S3 file upload events and publish to SNS
    """
    sns_client = boto3.client('sns')
    sns_topic_arn = os.environ['SNS_TOPIC_ARN']
    
    try:
        for record in event['Records']:
            # Get S3 event details
            bucket_name = record['s3']['bucket']['name']
            object_key = record['s3']['object']['key']
            event_name = record['eventName']
            
            # Create message for SNS
            message = {
                'bucket': bucket_name,
                'key': object_key,
                'event': event_name,
                'timestamp': record['eventTime']
            }
            
            # Publish to SNS
            response = sns_client.publish(
                TopicArn=sns_topic_arn,
                Subject=f'S3 File Upload Notification: {object_key}',
                Message=json.dumps(message, indent=2)
            )
            
            print(f"Successfully processed {object_key} and published to SNS: {response['MessageId']}")
        
        return {
            'statusCode': 200,
            'body': json.dumps('Successfully processed all records')
        }
        
    except Exception as e:
        print(f"Error processing S3 event: {str(e)}")
        raise e
`),
      }
    );

    // S3 event notification to trigger Lambda
    s3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(lambdaFunction)
    );

    // Apply tags to all resources
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(vpc).add('Name', `cf-task-vpc-${environmentSuffix}`);
    cdk.Tags.of(ec2Instance).add(
      'Name',
      `cf-task-ec2-instance-${environmentSuffix}`
    );
    cdk.Tags.of(s3Bucket).add('Name', `cf-task-s3-bucket-${environmentSuffix}`);
    cdk.Tags.of(lambdaFunction).add(
      'Name',
      `cf-task-lambda-function-${environmentSuffix}`
    );
    cdk.Tags.of(snsTopic).add('Name', `cf-task-sns-topic-${environmentSuffix}`);

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: ec2Instance.instanceId,
      description: 'EC2 Instance ID',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: 'S3 Bucket Name',
      exportName: `${stackName}-S3BucketName`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: lambdaFunction.functionArn,
      description: 'Lambda Function ARN',
      exportName: `${stackName}-LambdaFunctionArn`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: lambdaFunction.functionName,
      description: 'Lambda Function Name',
      exportName: `${stackName}-LambdaFunctionName`,
    });

    new cdk.CfnOutput(this, 'SNSTopicArn', {
      value: snsTopic.topicArn,
      description: 'SNS Topic ARN',
      exportName: `${stackName}-SNSTopicArn`,
    });

    new cdk.CfnOutput(this, 'EC2InstancePublicIp', {
      value: ec2Instance.instancePublicIp,
      description: 'EC2 Instance Public IP',
      exportName: `${stackName}-EC2InstancePublicIp`,
    });

    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: ec2SecurityGroup.securityGroupId,
      description: 'EC2 Security Group ID',
      exportName: `${stackName}-SecurityGroupId`,
    });
  }
}
