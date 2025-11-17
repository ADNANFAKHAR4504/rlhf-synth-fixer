import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  MultiComponentApplicationConstruct,
  MultiComponentProps,
} from './multi-component-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  secondaryRegion?: string;
  baseEnvironmentSuffix?: string;
  isPrimary?: boolean;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Instantiate the multi-component application construct and keep a reference
    // so we can re-expose important runtime values as top-level outputs.
    const child = new MultiComponentApplicationConstruct(
      this,
      'MultiComponentApplication',
      {
        ...(props as MultiComponentProps),
        // forward secondaryRegion through props so construct can optionally
        // configure cross-region replication when requested by context.
        secondaryRegion: props?.secondaryRegion,
        // forward isPrimary so construct can decide whether to create
        // global resources like HostedZone and Route53 failover records.
        isPrimary: props?.isPrimary,
      }
    );

    // Re-expose selected runtime tokens from the child construct as top-level outputs.
    // The child is a Construct created inside this stack, so the outputs are
    // resolved within the same CloudFormation template. We intentionally emit
    // simple top-level outputs so callers and deployment tooling can find
    // runtime identifiers in the synthesized template or the produced
    // `cfn-outputs/flat-outputs.json` artifact.
    const forward = {
      VpcId: child.vpcId,
      ApiGatewayUrl: child.apiUrl,
      LambdaFunctionArn: child.lambdaFunctionArn,
      RdsEndpoint: child.rdsEndpoint,
      S3BucketName: child.s3BucketName,
      SqsQueueUrl: child.sqsQueueUrl,
      CloudFrontDomainName: child.cloudFrontDomainName,
      HostedZoneId: child.hostedZoneId,
      DatabaseSecretArn: child.databaseSecretArn,
      LambdaRoleArn: child.lambdaRoleArn,
      DatabaseSecurityGroupId: child.databaseSecurityGroupId,
      LambdaSecurityGroupId: child.lambdaSecurityGroupId,
      LambdaLogGroupName: child.lambdaLogGroupName,
    } as Record<string, string | undefined>;

    // Prefix outputs with the stack name so multi-region / multi-stack
    // deployments cannot accidentally collide when downstream tooling
    // (CI scripts) flattens outputs into a single JSON file.
    const stackNameToken = cdk.Stack.of(this).stackName;
    for (const [key, value] of Object.entries(forward)) {
      const outputKey = `${stackNameToken}-${key}`;
      new cdk.CfnOutput(this, outputKey, {
        value: value ?? cdk.Aws.NO_VALUE,
      });
    }

    // Preserve previous behavior: if the construct recorded that WAF was
    // skipped due to region guards, emit the same top-level CFN output
    // that callers and tests expect.
    if (child.wafWasSkipped) {
      const wafOutputKey = `${stackNameToken}-WafCreationSkipped`;
      new cdk.CfnOutput(this, wafOutputKey, {
        value: `WAF not created in region ${cdk.Stack.of(this).region}. Set context allowGlobalWaf=true to override.`,
        description: 'Indicates WAF creation was skipped due to region guard',
      });
    }

    // IMPORTANT: Do NOT create CloudFormation-level outputs that reference
    // child stack tokens here. Referencing child stack tokens from this stack
    // causes CDK to generate CloudFormation exports/imports which create a
    // hard dependency: the child stack cannot change or remove those exports
    // while this stack imports them. That leads to deployment failures like
    // "Cannot update export ... as it is in use by TapStack..." when the
    // child stack is updated. If you need these runtime values at test/runtime
    // use the `cfn-outputs/flat-outputs.json` produced by the deployment or
    // publish shared values to SSM/SecretsManager instead.

    // Intentionally do not re-expose child runtime tokens here to avoid
    // cross-stack CloudFormation exports/imports.
  }
}
