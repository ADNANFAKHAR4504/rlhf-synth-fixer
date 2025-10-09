import * as cdk from 'aws-cdk-lib';
import { IConstruct } from 'constructs';
import { CfnResource, Tags } from 'aws-cdk-lib';

export interface TaggingAspectProps {
  [key: string]: string;
}

export class TaggingAspect implements cdk.IAspect {
  private readonly tags: TaggingAspectProps;

  constructor(tags: TaggingAspectProps) {
    this.tags = tags;
  }

  public visit(node: IConstruct): void {
    // Apply tags to all resources
    if (node instanceof CfnResource) {
      // Apply all the standard tags
      for (const [key, value] of Object.entries(this.tags)) {
        Tags.of(node).add(key, value);
      }

      // Add specific additional tags by resource type
      if (node instanceof cdk.aws_s3.CfnBucket) {
        Tags.of(node).add('ResourceType', 'S3Bucket');
      } else if (node instanceof cdk.aws_dynamodb.CfnTable) {
        Tags.of(node).add('ResourceType', 'DynamoDBTable');
      } else if (
        node instanceof cdk.aws_rds.CfnDBInstance ||
        node instanceof cdk.aws_rds.CfnDBCluster
      ) {
        Tags.of(node).add('ResourceType', 'Database');
      } else if (
        node instanceof cdk.aws_ecs.CfnService ||
        node instanceof cdk.aws_ecs.CfnTaskDefinition
      ) {
        Tags.of(node).add('ResourceType', 'ECSResource');
      }
    }
  }
}
