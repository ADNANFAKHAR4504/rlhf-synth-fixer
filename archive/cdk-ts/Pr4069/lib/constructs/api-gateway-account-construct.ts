import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

/**
 * This construct sets up the CloudWatch Logs role for API Gateway at the account level.
 * This is a one-time setup per region, but it's safe to deploy multiple times.
 */
export class ApiGatewayAccountConstruct extends Construct {
  public readonly cloudWatchRole: iam.Role;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create a role for API Gateway to write logs to CloudWatch
    this.cloudWatchRole = new iam.Role(this, 'ApiGatewayCloudWatchRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      description: 'Role for API Gateway to write logs to CloudWatch',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonAPIGatewayPushToCloudWatchLogs'
        ),
      ],
    });

    // Set the CloudWatch role for API Gateway account settings
    // This is a regional setting that applies to all API Gateway APIs in the region
    new apigateway.CfnAccount(this, 'ApiGatewayAccount', {
      cloudWatchRoleArn: this.cloudWatchRole.roleArn,
    });
  }
}
