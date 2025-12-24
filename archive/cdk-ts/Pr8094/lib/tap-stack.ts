import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as kms from 'aws-cdk-lib/aws-kms';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // KMS Key for encryption
    const encryptionKey = new kms.Key(this, 'EncryptionKey', {
      alias: `compliance-key-${environmentSuffix}`,
      description: 'KMS key for CodeBuild compliance infrastructure',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // S3 Bucket for compliance reports
    const reportsBucket = new s3.Bucket(this, 'ReportsBucket', {
      bucketName: `codebuild-compliance-reports-${environmentSuffix}`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'TransitionToIA',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
    });

    // SNS Topics
    const criticalViolationsTopic = new sns.Topic(
      this,
      'CriticalViolationsTopic',
      {
        topicName: `codebuild-critical-violations-${environmentSuffix}`,
        displayName: 'CodeBuild Critical Compliance Violations',
        masterKey: encryptionKey,
      }
    );

    const weeklyReportsTopic = new sns.Topic(this, 'WeeklyReportsTopic', {
      topicName: `codebuild-weekly-reports-${environmentSuffix}`,
      displayName: 'CodeBuild Weekly Compliance Reports',
      masterKey: encryptionKey,
    });

    // Add email subscription (example - would be parameterized in production)
    weeklyReportsTopic.addSubscription(
      new subscriptions.EmailSubscription('ops-team@example.com')
    );

    // IAM Role for CodeBuild Scanner
    const scannerRole = new iam.Role(this, 'ScannerRole', {
      roleName: `codebuild-scanner-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      description: 'Role for CodeBuild compliance scanner',
    });

    // Grant read permissions to list and describe CodeBuild projects
    scannerRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'codebuild:ListProjects',
          'codebuild:BatchGetProjects',
          'codebuild:ListBuildsForProject',
          'codebuild:BatchGetBuilds',
        ],
        resources: ['*'],
      })
    );

    // Grant S3 write permissions
    reportsBucket.grantWrite(scannerRole);

    // Grant CloudWatch Logs permissions
    scannerRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: [
          `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/codebuild/compliance-scanner-${environmentSuffix}*`,
        ],
      })
    );

    // CodeBuild Project for Compliance Scanner
    const complianceScanner = new codebuild.Project(this, 'ComplianceScanner', {
      projectName: `compliance-scanner-${environmentSuffix}`,
      description: 'Scans CodeBuild projects for compliance issues',
      role: scannerRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
        environmentVariables: {
          REPORTS_BUCKET: {
            value: reportsBucket.bucketName,
          },
          ENVIRONMENT_SUFFIX: {
            value: environmentSuffix,
          },
          SNS_TOPIC_ARN: {
            value: criticalViolationsTopic.topicArn,
          },
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '20',
              python: '3.12',
            },
            commands: [
              'echo "Installing dependencies..."',
              'pip3 install boto3',
            ],
          },
          build: {
            commands: [
              'echo "Running compliance scan..."',
              'python3 - <<EOF',
              'import boto3',
              'import json',
              'import os',
              'from datetime import datetime',
              '',
              'cb = boto3.client("codebuild")',
              's3 = boto3.client("s3")',
              'sns = boto3.client("sns")',
              '',
              'bucket = os.environ["REPORTS_BUCKET"]',
              'topic_arn = os.environ["SNS_TOPIC_ARN"]',
              '',
              'print("Fetching all CodeBuild projects...")',
              'projects = cb.list_projects()["projects"]',
              'print(f"Found {len(projects)} projects")',
              '',
              'violations = []',
              'if projects:',
              '    details = cb.batch_get_projects(names=projects)["projects"]',
              '    for project in details:',
              '        name = project["name"]',
              '        issues = []',
              '        ',
              '        # Check for required tags',
              '        tags = {tag["key"]: tag["value"] for tag in project.get("tags", [])}',
              '        required_tags = ["Environment", "Owner", "Project"]',
              '        missing_tags = [t for t in required_tags if t not in tags]',
              '        if missing_tags:',
              '            issues.append(f"Missing tags: {missing_tags}")',
              '        ',
              '        # Check environment variables',
              '        env_vars = project.get("environment", {}).get("environmentVariables", [])',
              '        if not any(ev["name"] == "AWS_DEFAULT_REGION" for ev in env_vars):',
              '            issues.append("Missing AWS_DEFAULT_REGION env var")',
              '        ',
              '        if issues:',
              '            violations.append({"project": name, "issues": issues})',
              '',
              'report = {',
              '    "timestamp": datetime.utcnow().isoformat(),',
              '    "total_projects": len(projects),',
              '    "violations": violations,',
              '    "compliance_score": ((len(projects) - len(violations)) / len(projects) * 100) if projects else 100',
              '}',
              '',
              '# Upload report to S3',
              'report_key = f"scans/{datetime.utcnow().strftime(\'%Y/%m/%d\')}/scan-report.json"',
              's3.put_object(',
              '    Bucket=bucket,',
              '    Key=report_key,',
              '    Body=json.dumps(report, indent=2),',
              '    ContentType="application/json"',
              ')',
              'print(f"Report uploaded to s3://{bucket}/{report_key}")',
              '',
              '# Send SNS alert if critical violations found',
              'if len(violations) > 0:',
              '    message = f"Found {len(violations)} projects with compliance violations.\\n"',
              '    message += f"Compliance score: {report[\\"compliance_score\\"]:.1f}%\\n\\n"',
              '    message += "Projects with issues:\\n"',
              '    for v in violations[:5]:',
              '        message += f"- {v[\\"project\\"]}: {v[\\"issues\\"][0]}\\n"',
              '    ',
              '    sns.publish(',
              '        TopicArn=topic_arn,',
              '        Subject="CodeBuild Compliance Violations Detected",',
              '        Message=message',
              '    )',
              '    print("Alert sent to SNS")',
              'EOF',
            ],
          },
        },
      }),
      logging: {
        cloudWatch: {
          logGroup: new logs.LogGroup(this, 'ScannerLogGroup', {
            logGroupName: `/aws/codebuild/compliance-scanner-${environmentSuffix}`,
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
          }),
        },
      },
    });

    // Grant SNS publish permissions to scanner
    criticalViolationsTopic.grantPublish(scannerRole);

    // Lambda Function for Weekly Reports
    const reportGeneratorRole = new iam.Role(this, 'ReportGeneratorRole', {
      roleName: `compliance-report-generator-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    reportsBucket.grantRead(reportGeneratorRole);
    weeklyReportsTopic.grantPublish(reportGeneratorRole);

    const reportGenerator = new lambda.Function(this, 'ReportGenerator', {
      functionName: `compliance-report-generator-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const s3 = new S3Client();
const sns = new SNSClient();

exports.handler = async (event) => {
  console.log('Generating weekly compliance report...');

  const bucket = process.env.REPORTS_BUCKET;
  const topicArn = process.env.SNS_TOPIC_ARN;

  try {
    // List recent scan reports (last 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const listCommand = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: 'scans/',
    });

    const { Contents = [] } = await s3.send(listCommand);

    // Filter reports from last 7 days
    const recentReports = Contents.filter(obj =>
      new Date(obj.LastModified) >= sevenDaysAgo
    );

    console.log(\`Found \${recentReports.length} reports from last 7 days\`);

    // Fetch and aggregate report data
    let totalScans = 0;
    let totalViolations = 0;
    let complianceScores = [];

    for (const report of recentReports.slice(0, 10)) {
      const getCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: report.Key,
      });

      const response = await s3.send(getCommand);
      const data = JSON.parse(await response.Body.transformToString());

      totalScans++;
      totalViolations += data.violations.length;
      complianceScores.push(data.compliance_score);
    }

    const avgCompliance = complianceScores.length > 0
      ? complianceScores.reduce((a, b) => a + b, 0) / complianceScores.length
      : 100;

    // Generate report message
    const message = \`Weekly CodeBuild Compliance Report

Period: Last 7 days
Total Scans: \${totalScans}
Total Violations Found: \${totalViolations}
Average Compliance Score: \${avgCompliance.toFixed(1)}%

Trend: \${complianceScores.length >= 2
  ? (complianceScores[complianceScores.length - 1] > complianceScores[0] ? 'Improving' : 'Declining')
  : 'Stable'}

View detailed reports in S3: s3://\${bucket}/scans/

Next steps:
1. Review projects with violations
2. Apply automated remediation where applicable
3. Update compliance templates as needed\`;

    // Publish to SNS
    await sns.send(new PublishCommand({
      TopicArn: topicArn,
      Subject: 'Weekly CodeBuild Compliance Report',
      Message: message,
    }));

    console.log('Weekly report sent successfully');

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Report generated', avgCompliance }),
    };
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};
      `),
      environment: {
        REPORTS_BUCKET: reportsBucket.bucketName,
        SNS_TOPIC_ARN: weeklyReportsTopic.topicArn,
      },
      timeout: cdk.Duration.seconds(300),
      role: reportGeneratorRole,
      tracing: lambda.Tracing.ACTIVE,
    });

    // Lambda Function for Automated Remediation
    const remediationRole = new iam.Role(this, 'RemediationRole', {
      roleName: `compliance-remediation-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    remediationRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['codebuild:UpdateProject', 'codebuild:BatchGetProjects'],
        resources: [
          `arn:aws:codebuild:${this.region}:${this.account}:project/*`,
        ],
      })
    );

    reportsBucket.grantWrite(remediationRole);

    const autoRemediation = new lambda.Function(this, 'AutoRemediation', {
      functionName: `compliance-auto-remediation-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const { CodeBuildClient, BatchGetProjectsCommand, UpdateProjectCommand } = require('@aws-sdk/client-codebuild');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const codebuild = new CodeBuildClient();
const s3 = new S3Client();

exports.handler = async (event) => {
  console.log('Starting automated remediation...');
  console.log('Event:', JSON.stringify(event, null, 2));

  const bucket = process.env.REPORTS_BUCKET;
  const remediationActions = [];

  try {
    // Extract project name from EventBridge event
    const projectName = event.detail?.projectName;
    if (!projectName) {
      console.log('No project name in event, skipping');
      return { statusCode: 200, body: 'No project to remediate' };
    }

    console.log(\`Checking project: \${projectName}\`);

    // Get project details
    const getCommand = new BatchGetProjectsCommand({
      names: [projectName],
    });

    const { projects } = await codebuild.send(getCommand);
    if (!projects || projects.length === 0) {
      console.log('Project not found');
      return { statusCode: 404, body: 'Project not found' };
    }

    const project = projects[0];
    let needsUpdate = false;
    const updates = { ...project };

    // Check and fix missing tags
    const tags = project.tags || [];
    const tagMap = new Map(tags.map(t => [t.key, t.value]));

    const requiredTags = {
      'Environment': 'dev',
      'Owner': 'ops-team',
      'Project': 'compliance-monitoring',
    };

    for (const [key, defaultValue] of Object.entries(requiredTags)) {
      if (!tagMap.has(key)) {
        tags.push({ key, value: defaultValue });
        needsUpdate = true;
        remediationActions.push(\`Added missing tag: \${key}=\${defaultValue}\`);
      }
    }

    // Check and fix missing environment variables
    const envVars = project.environment?.environmentVariables || [];
    const envVarNames = new Set(envVars.map(ev => ev.name));

    if (!envVarNames.has('AWS_DEFAULT_REGION')) {
      envVars.push({
        name: 'AWS_DEFAULT_REGION',
        value: process.env.AWS_REGION,
        type: 'PLAINTEXT',
      });
      needsUpdate = true;
      remediationActions.push('Added AWS_DEFAULT_REGION environment variable');
    }

    // Apply updates if needed
    if (needsUpdate) {
      console.log(\`Applying \${remediationActions.length} remediations...\`);

      const updateCommand = new UpdateProjectCommand({
        name: projectName,
        tags: tags,
        environment: {
          ...project.environment,
          environmentVariables: envVars,
        },
      });

      await codebuild.send(updateCommand);
      console.log('Project updated successfully');

      // Log remediation actions to S3
      const timestamp = new Date().toISOString();
      const logKey = \`remediation-logs/\${timestamp.split('T')[0]}/\${projectName}.json\`;

      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: logKey,
        Body: JSON.stringify({
          timestamp,
          project: projectName,
          actions: remediationActions,
        }, null, 2),
        ContentType: 'application/json',
      }));

      console.log(\`Remediation log saved to s3://\${bucket}/\${logKey}\`);
    } else {
      console.log('No remediation needed');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        project: projectName,
        remediationApplied: needsUpdate,
        actions: remediationActions,
      }),
    };
  } catch (error) {
    console.error('Error during remediation:', error);
    throw error;
  }
};
      `),
      environment: {
        REPORTS_BUCKET: reportsBucket.bucketName,
      },
      timeout: cdk.Duration.seconds(300),
      role: remediationRole,
      tracing: lambda.Tracing.ACTIVE,
    });

    // EventBridge Rules
    // Detect LocalStack environment (account ID 000000000000)
    const isLocalStack = this.account === '000000000000';

    // Rule 1: Trigger scanner on CodeBuild project creation/update
    // Skip CodeBuild targets in LocalStack (not supported), but keep Lambda target
    const codebuildChangeRule = new events.Rule(this, 'CodeBuildChangeRule', {
      ruleName: `codebuild-change-scanner-${environmentSuffix}`,
      description: 'Trigger compliance scan when CodeBuild projects change',
      eventPattern: {
        source: ['aws.codebuild'],
        detailType: ['CodeBuild Project State Change'],
      },
    });

    // Only add CodeBuild target if not in LocalStack
    if (!isLocalStack) {
      codebuildChangeRule.addTarget(
        new targets.CodeBuildProject(complianceScanner)
      );
    }
    // Lambda target works in LocalStack, so always add it
    codebuildChangeRule.addTarget(new targets.LambdaFunction(autoRemediation));

    // Rule 2: Daily scheduled scan
    // Skip entirely in LocalStack as it targets CodeBuild
    if (!isLocalStack) {
      const dailyScanRule = new events.Rule(this, 'DailyScanRule', {
        ruleName: `codebuild-daily-scan-${environmentSuffix}`,
        description: 'Run compliance scan daily',
        schedule: events.Schedule.cron({ hour: '9', minute: '0' }),
      });

      dailyScanRule.addTarget(new targets.CodeBuildProject(complianceScanner));
    }

    // Rule 3: Weekly report generation
    const weeklyReportRule = new events.Rule(this, 'WeeklyReportRule', {
      ruleName: `codebuild-weekly-report-${environmentSuffix}`,
      description: 'Generate weekly compliance report',
      schedule: events.Schedule.cron({
        weekDay: 'MON',
        hour: '10',
        minute: '0',
      }),
    });

    weeklyReportRule.addTarget(new targets.LambdaFunction(reportGenerator));

    // CloudWatch Alarms

    // Alarm for scanner failures
    const scannerFailureAlarm = new cloudwatch.Alarm(
      this,
      'ScannerFailureAlarm',
      {
        alarmName: `codebuild-scanner-failures-${environmentSuffix}`,
        alarmDescription: 'Alert when compliance scanner fails',
        metric: complianceScanner.metricFailedBuilds({
          period: cdk.Duration.hours(1),
          statistic: 'Sum',
        }),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      }
    );

    scannerFailureAlarm.addAlarmAction({
      bind: () => ({ alarmActionArn: criticalViolationsTopic.topicArn }),
    });

    // Alarm for Lambda errors
    const reportGeneratorErrorAlarm = new cloudwatch.Alarm(
      this,
      'ReportGeneratorErrorAlarm',
      {
        alarmName: `report-generator-errors-${environmentSuffix}`,
        alarmDescription: 'Alert when report generator fails',
        metric: reportGenerator.metricErrors({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
        }),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      }
    );

    reportGeneratorErrorAlarm.addAlarmAction({
      bind: () => ({ alarmActionArn: criticalViolationsTopic.topicArn }),
    });

    const remediationErrorAlarm = new cloudwatch.Alarm(
      this,
      'RemediationErrorAlarm',
      {
        alarmName: `auto-remediation-errors-${environmentSuffix}`,
        alarmDescription: 'Alert when auto-remediation fails',
        metric: autoRemediation.metricErrors({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
        }),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      }
    );

    remediationErrorAlarm.addAlarmAction({
      bind: () => ({ alarmActionArn: criticalViolationsTopic.topicArn }),
    });

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'ComplianceDashboard', {
      dashboardName: `codebuild-compliance-${environmentSuffix}`,
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Compliance Scanner - Build Status',
        left: [
          complianceScanner.metricSucceededBuilds({
            label: 'Successful Scans',
          }),
          complianceScanner.metricFailedBuilds({ label: 'Failed Scans' }),
        ],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Compliance Scanner - Build Duration',
        left: [complianceScanner.metricDuration({ label: 'Duration' })],
        width: 12,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Report Generator - Invocations',
        left: [reportGenerator.metricInvocations({ label: 'Invocations' })],
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: 'Report Generator - Errors',
        left: [
          reportGenerator.metricErrors({
            label: 'Errors',
            color: cloudwatch.Color.RED,
          }),
        ],
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: 'Report Generator - Duration',
        left: [reportGenerator.metricDuration({ label: 'Duration' })],
        width: 8,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Auto Remediation - Invocations',
        left: [autoRemediation.metricInvocations({ label: 'Invocations' })],
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: 'Auto Remediation - Errors',
        left: [
          autoRemediation.metricErrors({
            label: 'Errors',
            color: cloudwatch.Color.RED,
          }),
        ],
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: 'Auto Remediation - Duration',
        left: [autoRemediation.metricDuration({ label: 'Duration' })],
        width: 8,
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'ReportsBucketName', {
      value: reportsBucket.bucketName,
      description: 'S3 bucket for compliance reports',
      exportName: `compliance-reports-bucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ScannerProjectName', {
      value: complianceScanner.projectName,
      description: 'CodeBuild compliance scanner project',
      exportName: `compliance-scanner-project-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ReportGeneratorFunctionName', {
      value: reportGenerator.functionName,
      description: 'Lambda function for report generation',
      exportName: `report-generator-function-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AutoRemediationFunctionName', {
      value: autoRemediation.functionName,
      description: 'Lambda function for automated remediation',
      exportName: `auto-remediation-function-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CriticalViolationsTopicArn', {
      value: criticalViolationsTopic.topicArn,
      description: 'SNS topic for critical violations',
      exportName: `critical-violations-topic-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'WeeklyReportsTopicArn', {
      value: weeklyReportsTopic.topicArn,
      description: 'SNS topic for weekly reports',
      exportName: `weekly-reports-topic-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DashboardName', {
      value: `codebuild-compliance-${environmentSuffix}`, // Use explicit name instead of dashboard.dashboardName (may be "unknown" in LocalStack)
      description: 'CloudWatch dashboard for compliance monitoring',
      exportName: `compliance-dashboard-${environmentSuffix}`,
    });
  }
}
