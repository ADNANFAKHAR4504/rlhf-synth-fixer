import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DatabaseStack } from './database-stack';
import { GlobalStack } from './global-stack';
import { KmsStack } from './kms-stack';
import { RegionalStack } from './regional-stack';
import { SecurityStack } from './security-stack';

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

    const primaryRegion = 'us-east-1';
    const secondaryRegion = 'us-east-2';

    // Create KMS key in secondary region for DynamoDB replica encryption
    const secondaryKmsStack = new KmsStack(
      scope,
      `SecondaryKmsStack-${environmentSuffix}`,
      {
        region: secondaryRegion,
        environmentSuffix,
        env: {
          account: this.account,
          region: secondaryRegion,
        },
      }
    );

    // Create the database stack in the primary region with customer-managed KMS keys
    // Uses predictable KMS alias pattern to avoid cross-region references
    const databaseStack = new DatabaseStack(
      scope,
      `DatabaseStack-${environmentSuffix}`,
      {
        environmentSuffix,
        replicaRegion: secondaryRegion,
        env: {
          account: this.account,
          region: primaryRegion,
        },
      }
    );
    databaseStack.addDependency(secondaryKmsStack);

    // Create the regional stacks
    const primaryRegionalStack = new RegionalStack(
      scope,
      `PrimaryRegionalStack-${environmentSuffix}`,
      {
        tableName: databaseStack.tableName,
        tableArn: databaseStack.table.tableArn,
        kmsKeyArn: databaseStack.kmsKey.keyArn,
        region: primaryRegion,
        environmentSuffix,
        env: {
          account: this.account,
          region: primaryRegion,
        },
      }
    );
    primaryRegionalStack.addDependency(databaseStack);

    // For secondary stack, reference the secondary KMS key directly
    const secondaryRegionalStack = new RegionalStack(
      scope,
      `SecondaryRegionalStack-${environmentSuffix}`,
      {
        tableName: databaseStack.tableName,
        tableArn: databaseStack.table.tableArn.replace(
          primaryRegion,
          secondaryRegion
        ),
        kmsKeyArn: secondaryKmsStack.kmsKey.keyArn,
        region: secondaryRegion,
        environmentSuffix,
        env: {
          account: this.account,
          region: secondaryRegion,
        },
      }
    );
    secondaryRegionalStack.addDependency(databaseStack);
    secondaryRegionalStack.addDependency(secondaryKmsStack);

    // Create the security stack first (WAF must be in us-east-1 for CloudFront)
    const securityStack = new SecurityStack(
      scope,
      `SecurityStack-${environmentSuffix}`,
      {
        environmentSuffix,
        env: {
          account: this.account,
          region: primaryRegion,
        },
      }
    );

    // Create the global stack with WAF WebACL and automatic failover
    // Note: GlobalStack needs crossRegionReferences because it references API endpoints from both regions
    // OAIs are created in Regional stacks which also manage bucket policies to avoid conflicts
    const globalStack = new GlobalStack(
      scope,
      `GlobalStack-${environmentSuffix}`,
      {
        primaryRegion,
        secondaryRegion,
        primaryApiEndpoint: primaryRegionalStack.apiEndpoint,
        secondaryApiEndpoint: secondaryRegionalStack.apiEndpoint,
        primaryHealthCheckPath: primaryRegionalStack.healthCheckPath,
        primaryBucketName: primaryRegionalStack.websiteBucket.bucketName,
        secondaryBucketName: secondaryRegionalStack.websiteBucket.bucketName,
        primaryOaiId: primaryRegionalStack.oai.originAccessIdentityId,
        secondaryOaiId: secondaryRegionalStack.oai.originAccessIdentityId,
        webAclArn: securityStack.webAcl.attrArn,
        environmentSuffix,
        env: {
          account: this.account,
          region: primaryRegion,
        },
        crossRegionReferences: true,
      }
    );
    globalStack.addDependency(primaryRegionalStack);
    globalStack.addDependency(secondaryRegionalStack);
    globalStack.addDependency(securityStack);

    // ============================================================================
    // ROOT STACK OUTPUTS - Only from us-east-1 resources (no cross-region refs)
    // For us-east-2 outputs, query SecondaryRegionalStack-{env} directly
    // ============================================================================

    // === GLOBAL APPLICATION ENDPOINTS (for E2E testing) ===
    new cdk.CfnOutput(this, 'ApplicationUrl', {
      value: `https://${globalStack.cloudfrontDistribution.distributionDomainName}`,
      description: '🌐 Global Application URL (E2E Test Entry Point)',
    });

    new cdk.CfnOutput(this, 'CloudFrontTransferEndpoint', {
      value: `https://${globalStack.cloudfrontDistribution.distributionDomainName}/api/transfer`,
      description: '🔒 CloudFront /transfer endpoint (with Lambda Authorizer)',
    });

    new cdk.CfnOutput(this, 'CloudFrontHealthEndpoint', {
      value: `https://${globalStack.cloudfrontDistribution.distributionDomainName}/api/health`,
      description: '❤️ CloudFront /health endpoint (for region detection)',
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: globalStack.distributionId,
      description: '☁️ CloudFront Distribution ID',
    });

    // === ROUTE 53 FAILOVER ===
    new cdk.CfnOutput(this, 'Route53HostedZoneName', {
      value: `payment-gateway-${environmentSuffix}.com`,
      description: '🌐 Route 53 Hosted Zone Name',
    });

    new cdk.CfnOutput(this, 'Route53ApiFailoverDns', {
      value: `api.payment-gateway-${environmentSuffix}.com`,
      description: '🔄 Route 53 DNS for API Gateway failover',
    });

    new cdk.CfnOutput(this, 'Route53FailoverUrl', {
      value: `https://api.payment-gateway-${environmentSuffix}.com/prod`,
      description: '🔄 Route 53 failover API base URL (for testing)',
    });

    // === PRIMARY REGION (us-east-1) - Direct references OK ===
    new cdk.CfnOutput(this, 'PrimaryRegion', {
      value: primaryRegion,
      description: '🗺️ Primary region',
    });

    new cdk.CfnOutput(this, 'PrimaryApiEndpoint', {
      value: primaryRegionalStack.apiEndpoint,
      description: '🔌 Primary API Gateway endpoint',
    });

    new cdk.CfnOutput(this, 'PrimaryTransferEndpoint', {
      value: `${primaryRegionalStack.apiEndpoint}transfer`,
      description: '💰 Primary /transfer endpoint (direct test)',
    });

    new cdk.CfnOutput(this, 'PrimaryHealthEndpoint', {
      value: `${primaryRegionalStack.apiEndpoint}health`,
      description: '❤️ Primary /health endpoint (direct test)',
    });

    new cdk.CfnOutput(this, 'PrimaryWebsiteBucket', {
      value: primaryRegionalStack.websiteBucket.bucketName,
      description: '🗂️ Primary S3 website bucket',
    });

    // === SECONDARY REGION (us-east-2) - Static strings only (no cross-region refs) ===
    new cdk.CfnOutput(this, 'SecondaryRegion', {
      value: secondaryRegion,
      description: '🗺️ Secondary region',
    });

    new cdk.CfnOutput(this, 'SecondaryStackName', {
      value: `SecondaryRegionalStack-${environmentSuffix}`,
      description: '📦 Query this stack for us-east-2 outputs',
    });

    // === DATABASE (DynamoDB Global Table) ===
    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: databaseStack.tableName,
      description: '🗄️ DynamoDB Global Table name',
    });

    new cdk.CfnOutput(this, 'DynamoDBTableArn', {
      value: databaseStack.table.tableArn,
      description: '🗄️ DynamoDB Global Table ARN',
    });

    new cdk.CfnOutput(this, 'DynamoDBPrimaryRegion', {
      value: primaryRegion,
      description: '🗄️ DynamoDB primary region',
    });

    new cdk.CfnOutput(this, 'DynamoDBReplicaRegion', {
      value: secondaryRegion,
      description: '🗄️ DynamoDB replica region',
    });

    // === SECURITY ===
    new cdk.CfnOutput(this, 'WAFWebAclArn', {
      value: securityStack.webAcl.attrArn,
      description: '🛡️ WAF Web ACL ARN',
    });

    new cdk.CfnOutput(this, 'WAFWebAclId', {
      value: securityStack.webAcl.attrId,
      description: '🛡️ WAF Web ACL ID',
    });

    new cdk.CfnOutput(this, 'PrimaryKMSKeyArn', {
      value: databaseStack.kmsKey.keyArn,
      description: '🔐 Primary KMS Key ARN (us-east-1)',
    });

    // === STACK NAMES FOR QUERYING ===
    new cdk.CfnOutput(this, 'AllStackNames', {
      value: JSON.stringify({
        tapStack: `TapStack${environmentSuffix}`,
        secondaryKmsStack: `SecondaryKmsStack-${environmentSuffix}`,
        databaseStack: `DatabaseStack-${environmentSuffix}`,
        primaryRegionalStack: `PrimaryRegionalStack-${environmentSuffix}`,
        secondaryRegionalStack: `SecondaryRegionalStack-${environmentSuffix}`,
        securityStack: `SecurityStack-${environmentSuffix}`,
        globalStack: `GlobalStack-${environmentSuffix}`,
      }),
      description: '📦 All stack names for querying outputs',
    });

    // === TESTING INFORMATION ===
    new cdk.CfnOutput(this, 'TestingInstructions', {
      value:
        'Use ApplicationUrl for E2E tests. Valid auth token starts with "Allow"',
      description: '📝 Testing instructions',
    });

    new cdk.CfnOutput(this, 'FailoverTestingNotes', {
      value: 'Health checks every 30s. Failover after 3 failures (~90s)',
      description: '⏱️ Failover timing',
    });

    new cdk.CfnOutput(this, 'TestAuthTokenValid', {
      value: 'Allow-test-token-123',
      description: '✅ Valid authorization token for testing',
    });

    new cdk.CfnOutput(this, 'TestAuthTokenInvalid', {
      value: 'Invalid-token',
      description: '❌ Invalid authorization token for testing',
    });

    // === REGIONS ===
    new cdk.CfnOutput(this, 'Regions', {
      value: `Primary: ${primaryRegion}, Secondary: ${secondaryRegion}`,
      description: '🗺️ Deployment regions',
    });
  }
}
