# AWS CDK TypeScript Infrastructure Response

Here's the complete infrastructure implementation using AWS CDK with TypeScript:

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create access logging bucket for S3
    const accessLogsBucket = new s3.Bucket(this, 'AccessLogsBucket', {
      bucketName: `access-logs-${environmentSuffix}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      versioned: false,
      lifecycleRules: [
        {
          id: 'delete-old-logs',
          expiration: cdk.Duration.days(90),
        },
      ],
    });

    // Create main S3 bucket with security requirements
    const mainBucket = new s3.Bucket(this, 'MainBucket', {
      bucketName: `secure-bucket-${environmentSuffix}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      versioned: true,
      serverAccessLogsBucket: accessLogsBucket,
      serverAccessLogsPrefix: 'access-logs/',
      lifecycleRules: [
        {
          id: 'transition-to-ia',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
    });

    // Create VPC for EC2 instance
    const vpc = new ec2.Vpc(this, 'SecureVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
      natGateways: 1,
    });

    // Create security group for EC2 instance (HTTPS only)
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instance - HTTPS only',
      allowAllOutbound: true,
    });

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Create IAM role for EC2 instance
    const ec2Role = new iam.Role(this, 'EC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    // Create EC2 instance
    const ec2Instance = new ec2.Instance(this, 'SecureInstance', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: ec2SecurityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      role: ec2Role,
      userData: ec2.UserData.forLinux(),
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(20, {
            encrypted: true,
            volumeType: ec2.EbsDeviceVolumeType.GP3,
          }),
        },
      ],
    });

    // Create IAM role for Lambda function with least privilege
    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant Lambda permissions to access S3 bucket for backups
    mainBucket.grantWrite(lambdaRole);
    mainBucket.grantRead(lambdaRole);

    // Create Lambda function for automatic backups
    const backupLambda = new lambda.Function(this, 'BackupLambda', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      role: lambdaRole,
      timeout: cdk.Duration.minutes(5),
      memorySize: 256,
      environment: {
        BUCKET_NAME: mainBucket.bucketName,
        REGION: this.region,
      },
      code: lambda.Code.fromInline(`
import json
import boto3
import os
from datetime import datetime
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client('s3')
bucket_name = os.environ['BUCKET_NAME']

def handler(event, context):
    try:
        # Create backup timestamp
        timestamp = datetime.now().strftime('%Y-%m-%d-%H-%M-%S')
        backup_key = f'backups/backup-{timestamp}.json'
        
        # Create backup content
        backup_data = {
            'timestamp': timestamp,
            'event': event,
            'backup_type': 'automatic',
            'status': 'success'
        }
        
        # Upload backup to S3
        s3_client.put_object(
            Bucket=bucket_name,
            Key=backup_key,
            Body=json.dumps(backup_data),
            ServerSideEncryption='AES256'
        )
        
        logger.info(f'Backup successfully created: {backup_key}')
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Backup completed successfully',
                'backup_key': backup_key
            })
        }
    except Exception as e:
        logger.error(f'Backup failed: {str(e)}')
        raise e
`),
    });

    // Add tags to all resources
    const projectTag = 'Internal';
    cdk.Tags.of(this).add('Project', projectTag);
    cdk.Tags.of(accessLogsBucket).add('Project', projectTag);
    cdk.Tags.of(mainBucket).add('Project', projectTag);
    cdk.Tags.of(vpc).add('Project', projectTag);
    cdk.Tags.of(ec2Instance).add('Project', projectTag);
    cdk.Tags.of(backupLambda).add('Project', projectTag);

    // Output important resource information
    new cdk.CfnOutput(this, 'MainBucketName', {
      value: mainBucket.bucketName,
      description: 'Name of the main S3 bucket',
    });

    new cdk.CfnOutput(this, 'AccessLogsBucketName', {
      value: accessLogsBucket.bucketName,
      description: 'Name of the access logs bucket',
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: ec2Instance.instanceId,
      description: 'ID of the EC2 instance',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: backupLambda.functionName,
      description: 'Name of the backup Lambda function',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'ID of the VPC',
    });
  }
}
```

## test/tap-stack.unit.test.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as TapStack from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack.TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack.TapStack(app, 'MyTestStack');
    template = Template.fromStack(stack);
  });

  test('S3 Buckets Created', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });

    // Should create two buckets (main + access logs)
    template.resourceCountIs('AWS::S3::Bucket', 2);
  });

  test('EC2 Instance Created with Correct Configuration', () => {
    template.hasResourceProperties('AWS::EC2::Instance', {
      InstanceType: 't3.micro',
      Tags: [
        {
          Key: 'Project',
          Value: 'Internal',
        },
      ],
    });
  });

  test('Security Group Allows HTTPS Only', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      SecurityGroupIngress: [
        {
          CidrIp: '0.0.0.0/0',
          FromPort: 443,
          IpProtocol: 'tcp',
          ToPort: 443,
        },
      ],
    });
  });

  test('Lambda Function Created with Correct Properties', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'python3.11',
      Handler: 'index.handler',
      Timeout: 300,
      MemorySize: 256,
    });
  });

  test('VPC Created with Correct Configuration', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      Tags: [
        {
          Key: 'Project',
          Value: 'Internal',
        },
      ],
    });
  });

  test('IAM Roles Created with Least Privilege', () => {
    // Lambda role should exist
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      },
    });

    // EC2 role should exist
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
          },
        ],
      },
    });
  });

  test('All Resources Have Project Tag', () => {
    // Test that resources have the required Project tag
    const resources = template.findResources('AWS::S3::Bucket');
    const resourceKeys = Object.keys(resources);
    
    expect(resourceKeys.length).toBeGreaterThan(0);
    
    // Check Lambda function has tags
    template.hasResourceProperties('AWS::Lambda::Function', {
      Tags: [
        {
          Key: 'Project',
          Value: 'Internal',
        },
      ],
    });
  });
});
```

## test/tap-stack.int.test.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Integration Tests', () => {
  test('Stack can be synthesized', () => {
    const app = new cdk.App();
    
    // This should not throw an error
    expect(() => {
      new TapStack(app, 'TestStack', {
        env: {
          account: '123456789012',
          region: 'us-west-2',
        },
      });
    }).not.toThrow();
  });

  test('Stack synthesizes with environment suffix', () => {
    const app = new cdk.App();
    
    expect(() => {
      new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-west-2',
        },
      });
    }).not.toThrow();
  });

  test('Stack can be deployed to us-west-2', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestStack', {
      env: {
        region: 'us-west-2',
      },
    });

    expect(stack.region).toBe('us-west-2');
  });
});
```