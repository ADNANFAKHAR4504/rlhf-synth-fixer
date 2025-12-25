import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RegionalResourcesStack } from './stacks/regional-resources-stack';
import { S3CRRStack } from './stacks/s3-crr-stack';

const REGIONS = {
  PRIMARY: 'us-east-1',
  SECONDARY: 'us-west-2',
} as const;

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, {
      ...props,
      crossRegionReferences: true, // Enable cross-region references
    });

    const environmentSuffix = props.environmentSuffix || 'dev';
    // Create a single domain name for the entire multi-region setup
    const domainName = `${environmentSuffix}.tap-us-east-1.turing229221.com`;

    // Detect LocalStack environment
    const isLocalStack =
      process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
      process.env.AWS_ENDPOINT_URL?.includes('localstack');

    // Use environment variable or CDK context for hosted zone ID
    // Skip DNS setup for LocalStack as Route53 hosted zones are not needed for testing
    const zoneId = isLocalStack
      ? undefined
      : this.node.tryGetContext('hostedZoneId') ||
        process.env.HOSTED_ZONE_ID ||
        'Z0457876OLTG958Q3IXN'; // Fallback for backward compatibility

    const currentRegion = this.region;
    const isPrimary = currentRegion === REGIONS.PRIMARY;

    // Create S3CRR stack first in PRIMARY region to get replication role
    let replicationRoleArn: string | undefined;
    let s3CRRStack: S3CRRStack | undefined;
    if (isPrimary) {
      s3CRRStack = new S3CRRStack(this, 'S3CRR', {
        env: {
          account: this.account,
          region: REGIONS.PRIMARY, // us-west-2
        },
        sourceBucketName: `globalmountpoint-content-${REGIONS.PRIMARY}-${environmentSuffix}`,
        destinationBucketName: `globalmountpoint-content-${REGIONS.SECONDARY}-${environmentSuffix}`,
      });
      replicationRoleArn = s3CRRStack.replicationRole.roleArn;
    }

    // Create regional resources for the current region
    // DNS logic is now handled within RegionalResourcesStack:
    // - Primary region creates hosted zone + primary DNS record
    // - Secondary region creates secondary DNS record using imported hosted zone
    const regionalStack = new RegionalResourcesStack(this, 'Regional', {
      environmentSuffix,
      region: currentRegion,
      isPrimary,
      domainName,
      zoneId,
      secondaryRegion: REGIONS.SECONDARY,
      replicationRoleArn,
      env: {
        account: this.account,
        region: currentRegion,
      },
    });

    // Ensure dependency if S3CRR stack exists
    if (isPrimary) {
      const s3CRRChild = this.node.tryFindChild('S3CRR');
      if (s3CRRChild) {
        regionalStack.node.addDependency(s3CRRChild);
      }
    }

    // Root stack outputs - expose nested stack resources
    new cdk.CfnOutput(this, 'VPCId', {
      value: regionalStack.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'ContentBucketName', {
      value: regionalStack.contentBucket.bucketName,
      description: 'S3 Content bucket name',
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: regionalStack.loadBalancer.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
    });

    new cdk.CfnOutput(this, 'LoadBalancerArn', {
      value: regionalStack.loadBalancer.loadBalancerArn,
      description: 'Application Load Balancer ARN',
    });

    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix used for resource naming',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: currentRegion,
      description: 'AWS Region',
    });

    new cdk.CfnOutput(this, 'RegionType', {
      value: isPrimary ? 'primary' : 'secondary',
      description: 'Region type (primary or secondary)',
    });

    // Primary region specific outputs
    if (isPrimary && s3CRRStack) {
      new cdk.CfnOutput(this, 'ReplicationRoleArn', {
        value: s3CRRStack.replicationRole.roleArn,
        description: 'IAM Role ARN for S3 Cross-Region Replication',
      });

      new cdk.CfnOutput(this, 'SourceBucketName', {
        value: `globalmountpoint-content-${REGIONS.PRIMARY}-${environmentSuffix}`,
        description: 'Source bucket name for replication (primary region)',
      });

      new cdk.CfnOutput(this, 'DestinationBucketName', {
        value: `globalmountpoint-content-${REGIONS.SECONDARY}-${environmentSuffix}`,
        description:
          'Destination bucket name for replication (secondary region)',
      });

      new cdk.CfnOutput(this, 'PrimaryRegion', {
        value: REGIONS.PRIMARY,
        description: 'Primary region for multi-region setup',
      });

      new cdk.CfnOutput(this, 'SecondaryRegion', {
        value: REGIONS.SECONDARY,
        description: 'Secondary region for multi-region setup',
      });
    }

    // Add tags
    cdk.Tags.of(this).add('Stack', 'TapStack');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Region', currentRegion);
    cdk.Tags.of(this).add('RegionType', isPrimary ? 'primary' : 'secondary');
  }
}
