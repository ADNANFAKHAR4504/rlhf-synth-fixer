import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StaticWebsiteStack } from './static-website-stack';
import { WafStack } from './waf-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  skipCertificate?: boolean;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      process.env.ENVIRONMENT_SUFFIX ||
      'dev';

    const domainName = 'mydemosite.dev';
    const subDomain = 'portfolio';

    // Skip certificate creation for testing/demo (avoids DNS validation issues)
    const skipCertificate =
      props?.skipCertificate ??
      this.node.tryGetContext('skipCertificate') ??
      (process.env.SKIP_CERTIFICATE
        ? process.env.SKIP_CERTIFICATE === 'true'
        : true);

    // Check if we're in us-east-1 (for WAF and Certificate requirements)
    const isUsEast1 = this.region === 'us-east-1';

    // Create WAF stack if we're in us-east-1, otherwise skip
    let webAclArn: string | undefined;
    if (isUsEast1) {
      const wafStack = new WafStack(this, 'WafStack', {
        environmentSuffix,
      });
      webAclArn = wafStack.webAclArn;
    }

    // Create the static website stack with all components
    const websiteStack = new StaticWebsiteStack(this, 'StaticWebsiteStack', {
      environmentSuffix,
      domainName,
      subDomain,
      webAclArn,
      skipCertificate,
      env: props?.env,
    });

    // Stack-level outputs for integration tests
    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix used for this deployment',
      exportName: `environment-suffix-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS Region for deployment',
      exportName: `region-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'StackName', {
      value: this.stackName,
      description: 'Main stack name',
      exportName: `stack-name-${environmentSuffix}`,
    });

    // Aggregate important outputs at the top level for easier access
    new cdk.CfnOutput(this, 'WebsiteBucketName', {
      value: websiteStack.websiteBucket.bucketName,
      description: 'S3 Website Bucket Name',
    });

    new cdk.CfnOutput(this, 'LogsBucketName', {
      value: websiteStack.logsBucket.bucketName,
      description: 'S3 Logs Bucket Name',
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: websiteStack.distribution.distributionId,
      description: 'CloudFront Distribution ID',
    });

    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: websiteStack.distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
    });

    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: websiteStack.hostedZone.hostedZoneId,
      description: 'Route 53 Hosted Zone ID',
    });

    new cdk.CfnOutput(this, 'HostedZoneName', {
      value: websiteStack.hostedZone.zoneName,
      description: 'Route 53 Hosted Zone Name',
    });

    new cdk.CfnOutput(this, 'WebsiteUrl', {
      value: `https://${subDomain}-${environmentSuffix}.${domainName}`,
      description: 'Full Website URL',
    });

    if (webAclArn) {
      new cdk.CfnOutput(this, 'WafWebAclArn', {
        value: webAclArn,
        description: 'WAF Web ACL ARN',
      });
    }
  }
}
