import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecurityStack } from './security-stack';
import { StorageStack } from './storage-stack';
import { ComputeStack } from './compute-stack';
import { DatabaseStack } from './database-stack';
import { MonitoringStack } from './monitoring-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Security components (IAM roles, etc.)
    const securityStack = new SecurityStack(this, 'Security', {
      environmentSuffix,
    });

    // Storage components (S3)
    const storageStack = new StorageStack(this, 'Storage', {
      environmentSuffix,
    });

    // Compute components (EC2)
    const computeStack = new ComputeStack(this, 'Compute', {
      environmentSuffix,
      ec2Role: securityStack.ec2Role,
    });

    // Database components (DynamoDB with DAX)
    const databaseStack = new DatabaseStack(this, 'Database', {
      environmentSuffix,
    });

    // Monitoring with CloudWatch observability
    new MonitoringStack(this, 'Monitoring', {
      environmentSuffix,
      ec2Instance: computeStack.ec2Instance,
      s3Bucket: storageStack.s3Bucket,
      dynamoTable: databaseStack.dynamoTable,
    });

    // Apply tags to the entire stack
    cdk.Tags.of(this).add('Project', 'IaCChallenge');

    // Stack outputs
    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: computeStack.ec2Instance.instanceId,
      description: 'EC2 Instance ID',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: storageStack.s3Bucket.bucketName,
      description: 'S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: databaseStack.dynamoTable.tableName,
      description: 'DynamoDB Table Name',
    });
  }
}
