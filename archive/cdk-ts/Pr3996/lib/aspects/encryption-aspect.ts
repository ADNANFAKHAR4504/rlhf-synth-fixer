import { IConstruct } from 'constructs';
import * as cdk from 'aws-cdk-lib';

export class EncryptionAspect implements cdk.IAspect {
  public visit(node: IConstruct): void {
    // Check S3 buckets for encryption
    if (node instanceof cdk.aws_s3.CfnBucket) {
      if (!node.bucketEncryption) {
        node.bucketEncryption = {
          serverSideEncryptionConfiguration: [
            {
              serverSideEncryptionByDefault: {
                sseAlgorithm: 'AES256',
              },
            },
          ],
        };
      }
    }

    // Check DynamoDB tables for encryption
    if (node instanceof cdk.aws_dynamodb.CfnTable) {
      if (!node.sseSpecification) {
        node.sseSpecification = {
          sseEnabled: true,
        };
      }
    }

    // Check RDS instances for encryption
    if (node instanceof cdk.aws_rds.CfnDBInstance) {
      if (!node.storageEncrypted) {
        node.storageEncrypted = true;
      }
    }

    // Check RDS clusters for encryption
    if (node instanceof cdk.aws_rds.CfnDBCluster) {
      if (!node.storageEncrypted) {
        node.storageEncrypted = true;
      }
    }

    // Check EFS File Systems for encryption
    if (node instanceof cdk.aws_efs.CfnFileSystem) {
      if (!node.encrypted) {
        node.encrypted = true;
      }
    }
  }
}
