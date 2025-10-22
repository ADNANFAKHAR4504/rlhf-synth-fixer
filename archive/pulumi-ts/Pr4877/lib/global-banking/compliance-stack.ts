/**
 * compliance-stack.ts
 *
 * Compliance and audit infrastructure
 * Features: CloudTrail, AWS Config, GuardDuty, Security Hub
 * Supports PCI-DSS compliance requirements
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface ComplianceStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  regions: {
    primary: string;
    replicas: string[];
  };
  auditLogBucket: pulumi.Input<string>;
  kmsKeyArn: pulumi.Input<string>;
  snsTopicArn: pulumi.Input<string>;
  enablePciCompliance: boolean;
  enableGuardDuty: boolean;
  enableSecurityHub: boolean;
  enableConfig: boolean;
}

export class ComplianceStack extends pulumi.ComponentResource {
  public readonly cloudTrailArn: pulumi.Output<string>;
  public readonly configRecorderName: pulumi.Output<string>;
  public readonly guardDutyDetectorId: pulumi.Output<string>;
  public readonly securityHubArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: ComplianceStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:compliance:ComplianceStack', name, args, opts);

    const {
      environmentSuffix,
      tags,
      regions,
      auditLogBucket,
      kmsKeyArn,
      snsTopicArn,
      enablePciCompliance,
      enableSecurityHub,
    } = args;

    //  CloudTrail
    const cloudTrailRole = new aws.iam.Role(
      `${name}-cloudtrail-role`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'cloudtrail.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: tags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `${name}-cloudtrail-policy`,
      {
        role: cloudTrailRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
              Resource: 'arn:aws:logs:*:*:log-group:*',
            },
          ],
        }),
      },
      { parent: this }
    );

    const cloudTrailLogGroup = new aws.cloudwatch.LogGroup(
      `${name}-cloudtrail-logs`,
      {
        name: `/aws/cloudtrail/banking-${environmentSuffix}`,
        retentionInDays: 2557, // 7 years for compliance
        tags: tags,
      },
      { parent: this }
    );

    const cloudTrail = new aws.cloudtrail.Trail(
      `${name}-trail`,
      {
        name: `banking-organization-trail-${environmentSuffix}`,
        s3BucketName: auditLogBucket,
        s3KeyPrefix: 'cloudtrail',
        includeGlobalServiceEvents: true,
        isMultiRegionTrail: true,
        isOrganizationTrail: false,
        enableLogFileValidation: true,
        enableLogging: true,
        kmsKeyId: kmsKeyArn,
        cloudWatchLogsGroupArn: pulumi.interpolate`${cloudTrailLogGroup.arn}:*`,
        cloudWatchLogsRoleArn: cloudTrailRole.arn,
        eventSelectors: [
          {
            readWriteType: 'All',
            includeManagementEvents: true,
            dataResources: [
              {
                type: 'AWS::S3::Object',
                values: [pulumi.interpolate`arn:aws:s3:::${auditLogBucket}/`],
              },
            ],
          },
        ],
        insightSelectors: [
          {
            insightType: 'ApiCallRateInsight',
          },
          {
            insightType: 'ApiErrorRateInsight',
          },
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          'compliance:audit': 'true',
          'compliance:pci-dss': 'true',
        })),
      },
      { parent: this, dependsOn: [cloudTrailLogGroup] }
    );

    let configRecorder: aws.cfg.Recorder | undefined;
    let configRecorderName: pulumi.Output<string> =
      pulumi.output('config-existing');

    let guardDutyDetector: aws.guardduty.Detector | undefined;
    let guardDutyDetectorId: pulumi.Output<string> =
      pulumi.output('guardduty-existing');

    //  Security Hub (if enabled)
    let securityHub: aws.securityhub.Account | undefined;
    let securityHubArn: pulumi.Output<string>;

    if (enableSecurityHub) {
      securityHub = new aws.securityhub.Account(
        `${name}-security-hub`,
        {
          enableDefaultStandards: true,
          controlFindingGenerator: 'SECURITY_CONTROL',
          autoEnableControls: true,
        },
        {
          parent: this,
          dependsOn: guardDutyDetector ? [guardDutyDetector] : [],
        }
      );

      // Enable PCI-DSS Standard (if PCI compliance enabled)
      if (enablePciCompliance) {
        new aws.securityhub.StandardsSubscription(
          `${name}-pci-dss-standard`,
          {
            standardsArn: pulumi.interpolate`arn:aws:securityhub:${regions.primary}::standards/pci-dss/v/3.2.1`,
          },
          { parent: this, dependsOn: [securityHub] }
        );
      }

      // Enable CIS AWS Foundations Benchmark
      new aws.securityhub.StandardsSubscription(
        `${name}-cis-standard`,
        {
          standardsArn: pulumi.interpolate`arn:aws:securityhub:${regions.primary}::standards/cis-aws-foundations-benchmark/v/1.4.0`,
        },
        { parent: this, dependsOn: [securityHub] }
      );

      // Enable AWS Foundational Security Best Practices
      new aws.securityhub.StandardsSubscription(
        `${name}-aws-foundational-standard`,
        {
          standardsArn: pulumi.interpolate`arn:aws:securityhub:${regions.primary}::standards/aws-foundational-security-best-practices/v/1.0.0`,
        },
        { parent: this, dependsOn: [securityHub] }
      );

      // Security Hub Product Integrations
      if (guardDutyDetector) {
        new aws.securityhub.ProductSubscription(
          `${name}-guardduty-integration`,
          {
            productArn: pulumi.interpolate`arn:aws:securityhub:${regions.primary}::product/aws/guardduty`,
          },
          { parent: this, dependsOn: [securityHub] }
        );
      }

      if (configRecorder) {
        new aws.securityhub.ProductSubscription(
          `${name}-config-integration`,
          {
            productArn: pulumi.interpolate`arn:aws:securityhub:${regions.primary}::product/aws/config`,
          },
          { parent: this, dependsOn: [securityHub] }
        );
      }

      // Security Hub Insight for Critical Findings
      new aws.securityhub.Insight(
        `${name}-critical-findings-insight`,
        {
          name: `critical-banking-findings-${environmentSuffix}`,
          filters: {
            severityLabels: [
              {
                comparison: 'EQUALS',
                value: 'CRITICAL',
              },
            ],
            recordStates: [
              {
                comparison: 'EQUALS',
                value: 'ACTIVE',
              },
            ],
          },
          groupByAttribute: 'ResourceType',
        },
        { parent: this, dependsOn: [securityHub] }
      );

      securityHubArn = pulumi.interpolate`arn:aws:securityhub:${regions.primary}:${pulumi.getStack()}:hub/default`;
    } else {
      securityHubArn = pulumi.output('securityhub-disabled');
    }

    //  CloudWatch Alarms for Compliance

    // CloudTrail Log File Validation Failure
    new aws.cloudwatch.MetricAlarm(
      `${name}-cloudtrail-validation-alarm`,
      {
        name: `cloudtrail-validation-failure-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'ValidationFailure',
        namespace: 'CloudTrail',
        period: 300,
        statistic: 'Sum',
        threshold: 0,
        alarmDescription: 'Alert on CloudTrail log file validation failures',
        alarmActions: [snsTopicArn],
        treatMissingData: 'notBreaching',
        tags: tags,
      },
      { parent: this }
    );

    //  Outputs
    this.cloudTrailArn = cloudTrail.arn;
    this.configRecorderName = configRecorderName;
    this.guardDutyDetectorId = guardDutyDetectorId;
    this.securityHubArn = securityHubArn;

    this.registerOutputs({
      cloudTrailArn: this.cloudTrailArn,
      configRecorderName: this.configRecorderName,
      guardDutyDetectorId: this.guardDutyDetectorId,
      securityHubArn: this.securityHubArn,
    });
  }
}
