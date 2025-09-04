import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MultiRegionWebAppStack } from './multi-region-web-app-stack';

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

    // Primary region stack (us-east-1)
    const primaryStack = new MultiRegionWebAppStack(this, 'WebAppPrimary', {
      stackName: `${this.stackName}-Primary`,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'us-east-1',
      },
      region: 'us-east-1',
      isPrimaryRegion: true,
      enableGlobalServices: true, // Enable CloudFront and WAF in primary region
      environmentSuffix: environmentSuffix,
      description:
        'Primary region web application infrastructure with global services (us-east-1)',
    });

    // Secondary region stack (eu-west-1)
    const secondaryStack = new MultiRegionWebAppStack(this, 'WebAppSecondary', {
      stackName: `${this.stackName}-Secondary`,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'eu-west-1',
      },
      region: 'eu-west-1',
      isPrimaryRegion: false,
      crossRegionBucketArn: primaryStack.bucket.bucketArn,
      environmentSuffix: environmentSuffix,
      description:
        'Secondary region web application infrastructure (eu-west-1)',
    });

    // Add dependency to ensure primary region is deployed first
    secondaryStack.addDependency(primaryStack);

    // Output important information
    new cdk.CfnOutput(primaryStack, 'PrimaryLoadBalancerDNS', {
      value: primaryStack.loadBalancer.loadBalancerDnsName,
      description: 'DNS name of the primary region load balancer',
      exportName: `${environmentSuffix}-PrimaryLB-DNS`,
    });

    new cdk.CfnOutput(secondaryStack, 'SecondaryLoadBalancerDNS', {
      value: secondaryStack.loadBalancer.loadBalancerDnsName,
      description: 'DNS name of the secondary region load balancer',
      exportName: `${environmentSuffix}-SecondaryLB-DNS`,
    });

    new cdk.CfnOutput(primaryStack, 'PrimaryBucketName', {
      value: primaryStack.bucket.bucketName,
      description: 'Name of the primary region S3 bucket',
      exportName: `${environmentSuffix}-PrimaryBucket-Name`,
    });

    new cdk.CfnOutput(secondaryStack, 'SecondaryBucketName', {
      value: secondaryStack.bucket.bucketName,
      description: 'Name of the secondary region S3 bucket',
      exportName: `${environmentSuffix}-SecondaryBucket-Name`,
    });

    // Output CloudFront distribution URL if global services are enabled
    if (primaryStack.cloudFrontDistribution) {
      new cdk.CfnOutput(primaryStack, 'CloudFrontDistributionUrl', {
        value: primaryStack.cloudFrontDistribution.distributionDomainName,
        description: 'CloudFront distribution domain name for global access',
        exportName: `${environmentSuffix}-CloudFront-URL`,
      });
    }

    // Output WAF ACL ARN if WAF is enabled
    if (primaryStack.webAcl) {
      new cdk.CfnOutput(primaryStack, 'WebAclArn', {
        value: primaryStack.webAcl.attrArn,
        description: 'WAF Web ACL ARN for security monitoring',
        exportName: `${environmentSuffix}-WAF-ARN`,
      });
    }
  }
}
