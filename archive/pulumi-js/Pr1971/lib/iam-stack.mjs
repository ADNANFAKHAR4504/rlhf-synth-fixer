/**
 * IAM Stack for least privilege roles and policies
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export class IAMStack extends pulumi.ComponentResource {
  constructor(name, args, opts) {
    super('tap:iam:IAMStack', name, args, opts);

    const { environmentSuffix = 'dev', tags = {} } = args;

    // NOTE: IAM role creation is commented out due to AWS account quota limits
    // In production, these roles would be created for proper least privilege access
    // The account has exceeded the 1001 role quota limit

    // IAM Access Analyzer - This can still be created
    this.accessAnalyzer = new aws.accessanalyzer.Analyzer(`tap-access-analyzer-${environmentSuffix}`, {
      analyzerName: `tap-analyzer-${environmentSuffix}`,
      type: 'ACCOUNT',
      tags: {
        ...tags,
        Purpose: 'AccessAnalysis',
        Environment: environmentSuffix,
      },
    }, { parent: this });

    this.registerOutputs({
      accessAnalyzerArn: this.accessAnalyzer.arn,
    });
  }
}