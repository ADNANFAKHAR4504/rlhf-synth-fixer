import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Tags } from 'aws-cdk-lib';
import { UserProfileConstruct } from './constructs/user-profile-construct';

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

    // Create the user profile infrastructure
    const userProfileConstruct = new UserProfileConstruct(this, 'UserProfile', {
      environmentSuffix,
    });

    // Apply tags to all resources in this stack
    Tags.of(this).add('Environment', 'Production');
    Tags.of(this).add('Project', 'E-Commerce-Backend');
    Tags.of(this).add('ManagedBy', 'CDK');
    Tags.of(this).add('iac-rlhf-amazon', 'true');

    // Output the API endpoint
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: userProfileConstruct.apiUrl,
      description: 'API Gateway endpoint URL',
      exportName: `${this.stackName}-ApiEndpoint`,
    });

    // Output the API key ID for reference
    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: userProfileConstruct.apiKeyId,
      description:
        'API Key ID - retrieve the actual key value from AWS Console',
      exportName: `${this.stackName}-ApiKeyId`,
    });

    // Output the API key value for integration tests
    new cdk.CfnOutput(this, 'ApiKeyValue', {
      value: userProfileConstruct.apiKeyValue,
      description: 'API Key Value for integration tests',
      exportName: `${this.stackName}-ApiKeyValue`,
    });

    // Output DynamoDB table name
    new cdk.CfnOutput(this, 'UserTableName', {
      value: userProfileConstruct.tableName,
      description: 'DynamoDB User Table Name',
      exportName: `${this.stackName}-UserTableName`,
    });
  }
}
