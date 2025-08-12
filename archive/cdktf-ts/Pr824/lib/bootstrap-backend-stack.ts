// lib/bootstrap-backend-stack.ts
import * as dynamodbTable from '@cdktf/provider-aws/lib/dynamodb-table';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import * as s3Bucket from '@cdktf/provider-aws/lib/s3-bucket';
import { TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

export class BootstrapBackendStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // AWS provider (use the backend region)
    new AwsProvider(this, 'AWS', {
      region: 'us-east-1',
    });

    // S3 bucket for Terraform remote state
    new s3Bucket.S3Bucket(this, 'StateBucket', {
      bucket: 'iac-rlhf-tf-states',
      acl: 'private',
      versioning: { enabled: true },
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      },
      // Optional: allow bucket destruction in non-prod (remove if you want strict immutability)
      forceDestroy: true,
      tags: {
        Name: 'TerraformStateBucket',
        Environment: 'bootstrap',
      },
    });

    // DynamoDB table for Terraform state locking
    new dynamodbTable.DynamodbTable(this, 'StateLockTable', {
      name: 'iac-rlhf-tf-locks',
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'LockID',
      attribute: [{ name: 'LockID', type: 'S' }],
      tags: {
        Name: 'TerraformStateLockTable',
        Environment: 'bootstrap',
      },
    });
  }
}
