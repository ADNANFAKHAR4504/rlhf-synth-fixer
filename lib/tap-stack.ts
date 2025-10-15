import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DatabaseStack } from './database-stack';
import { RegionalStack } from './regional-stack';
import { GlobalStack } from './global-stack';
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

    // Create the database stack in the primary region
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

    // For secondary stack, construct the KMS key ARN manually to avoid cross-region reference
    const secondaryKmsKeyArn = `arn:aws:kms:${secondaryRegion}:${this.account}:key/*`;

    const secondaryRegionalStack = new RegionalStack(
      scope,
      `SecondaryRegionalStack-${environmentSuffix}`,
      {
        tableName: databaseStack.tableName,
        tableArn: databaseStack.table.tableArn.replace(primaryRegion, secondaryRegion),
        kmsKeyArn: secondaryKmsKeyArn,
        region: secondaryRegion,
        environmentSuffix,
        env: {
          account: this.account,
          region: secondaryRegion,
        },
      }
    );
    secondaryRegionalStack.addDependency(databaseStack);

    // Create the global stack
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
        environmentSuffix,
        env: {
          account: this.account,
          region: primaryRegion,
        },
      }
    );
    globalStack.addDependency(primaryRegionalStack);
    globalStack.addDependency(secondaryRegionalStack);

    // Create the security stack (WAF must be in us-east-1 for CloudFront)
    const securityStack = new SecurityStack(
      scope,
      `SecurityStack-${environmentSuffix}`,
      {
        cloudfrontDistributionArn: `arn:aws:cloudfront::${this.account}:distribution/${globalStack.distributionId}`,
        environmentSuffix,
        env: {
          account: this.account,
          region: primaryRegion,
        },
      }
    );
    securityStack.addDependency(globalStack);
  }
}
