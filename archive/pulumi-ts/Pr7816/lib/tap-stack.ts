import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface TapStackArgs {
  environmentSuffix: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly configRecorderName: pulumi.Output<string>;
  public readonly bucketArn: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: TapStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:infrastructure:TapStack', name, {}, opts);

    const { environmentSuffix } = args;

    // S3 bucket for Config data
    const configBucket = new aws.s3.Bucket(
      `config-bucket-${environmentSuffix}`,
      {
        bucket: `config-bucket-${environmentSuffix}`,
        versioning: {
          enabled: true,
        },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        lifecycleRules: [
          {
            enabled: true,
            transitions: [
              {
                days: 90,
                storageClass: 'GLACIER',
              },
            ],
          },
        ],
      },
      { parent: this }
    );

    // Bucket policy for Config
    const configBucketPolicy = new aws.s3.BucketPolicy(
      `config-bucket-policy-${environmentSuffix}`,
      {
        bucket: configBucket.id,
        policy: pulumi
          .all([
            configBucket.arn,
            aws.getCallerIdentity({}).then(id => id.accountId),
          ])
          .apply(([bucketArn, _accountId]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'AWSConfigBucketPermissionsCheck',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'config.amazonaws.com',
                  },
                  Action: 's3:GetBucketAcl',
                  Resource: bucketArn,
                },
                {
                  Sid: 'AWSConfigBucketExistenceCheck',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'config.amazonaws.com',
                  },
                  Action: 's3:ListBucket',
                  Resource: bucketArn,
                },
                {
                  Sid: 'AWSConfigBucketPut',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'config.amazonaws.com',
                  },
                  Action: 's3:PutObject',
                  Resource: `${bucketArn}/*`,
                  Condition: {
                    StringEquals: {
                      's3:x-amz-acl': 'bucket-owner-full-control',
                    },
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // IAM role for AWS Config
    const configRole = new aws.iam.Role(
      `config-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'config.amazonaws.com',
              },
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole',
        ],
      },
      { parent: this }
    );

    // Attach inline policy for S3 access
    const configRolePolicy = new aws.iam.RolePolicy(
      `config-role-policy-${environmentSuffix}`,
      {
        role: configRole.id,
        policy: configBucket.arn.apply(bucketArn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  's3:GetBucketVersioning',
                  's3:PutObject',
                  's3:GetObject',
                ],
                Resource: [bucketArn, `${bucketArn}/*`],
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Configuration recorder
    const configRecorder = new aws.cfg.Recorder(
      `config-recorder-${environmentSuffix}`,
      {
        name: `config-recorder-${environmentSuffix}`,
        roleArn: configRole.arn,
        recordingGroup: {
          allSupported: true,
          includeGlobalResourceTypes: true,
        },
      },
      { parent: this, dependsOn: [configRolePolicy] }
    );

    // Delivery channel
    const deliveryChannel = new aws.cfg.DeliveryChannel(
      `config-delivery-${environmentSuffix}`,
      {
        name: `config-delivery-${environmentSuffix}`,
        s3BucketName: configBucket.bucket,
      },
      { parent: this, dependsOn: [configBucketPolicy, configRecorder] }
    );

    // Start the recorder
    const recorderStatus = new aws.cfg.RecorderStatus(
      `config-recorder-status-${environmentSuffix}`,
      {
        name: configRecorder.name,
        isEnabled: true,
      },
      { parent: this, dependsOn: [deliveryChannel] }
    );

    // SNS topic for compliance notifications
    const complianceTopic = new aws.sns.Topic(
      `compliance-topic-${environmentSuffix}`,
      {
        name: `compliance-notifications-${environmentSuffix}`,
        displayName: 'Compliance Violation Notifications',
      },
      { parent: this }
    );

    // Config rule for S3 encryption
    const s3EncryptionRule = new aws.cfg.Rule(
      `s3-encryption-rule-${environmentSuffix}`,
      {
        name: `s3-bucket-encryption-${environmentSuffix}`,
        description: 'Checks that S3 buckets have encryption enabled',
        source: {
          owner: 'AWS',
          sourceIdentifier: 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED',
        },
      },
      { parent: this, dependsOn: [recorderStatus] }
    );

    // Config rule for EC2 required tags
    const ec2TagsRule = new aws.cfg.Rule(
      `ec2-tags-rule-${environmentSuffix}`,
      {
        name: `ec2-required-tags-${environmentSuffix}`,
        description: 'Checks that EC2 instances have required tags',
        inputParameters: JSON.stringify({
          tag1Key: 'Environment',
          tag2Key: 'Owner',
          tag3Key: 'CostCenter',
        }),
        source: {
          owner: 'AWS',
          sourceIdentifier: 'REQUIRED_TAGS',
        },
        scope: {
          complianceResourceTypes: ['AWS::EC2::Instance'],
        },
      },
      { parent: this, dependsOn: [recorderStatus] }
    );

    // Lambda execution role
    const lambdaRole = new aws.iam.Role(
      `compliance-lambda-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        ],
      },
      { parent: this }
    );

    // Lambda policy for Config and SNS access
    const lambdaPolicy = new aws.iam.RolePolicy(
      `compliance-lambda-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi
          .all([configBucket.arn, complianceTopic.arn])
          .apply(([bucketArn, topicArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'config:DescribeComplianceByConfigRule',
                    'config:GetComplianceDetailsByConfigRule',
                    'config:DescribeConfigRules',
                  ],
                  Resource: '*',
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:PutObject', 's3:GetObject'],
                  Resource: `${bucketArn}/*`,
                },
                {
                  Effect: 'Allow',
                  Action: 'sns:Publish',
                  Resource: topicArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Lambda function for compliance reporting
    const complianceReporter = new aws.lambda.Function(
      `compliance-reporter-${environmentSuffix}`,
      {
        name: `compliance-reporter-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.Python3d11,
        role: lambdaRole.arn,
        handler: 'index.lambda_handler',
        timeout: 300,
        environment: {
          variables: {
            SNS_TOPIC_ARN: complianceTopic.arn,
            S3_BUCKET: configBucket.bucket,
            ENVIRONMENT_SUFFIX: environmentSuffix,
          },
        },
        code: new pulumi.asset.AssetArchive({
          'index.py': new pulumi.asset.StringAsset(`
import json
import boto3
import os
from datetime import datetime
from typing import Dict, List, Any

config_client = boto3.client('config')
s3_client = boto3.client('s3')
sns_client = boto3.client('sns')

def lambda_handler(event, context):
    """Aggregate compliance findings and generate reports."""
    try:
        sns_topic_arn = os.environ['SNS_TOPIC_ARN']
        s3_bucket = os.environ['S3_BUCKET']
        environment_suffix = os.environ['ENVIRONMENT_SUFFIX']

        # Get compliance summary
        compliance_data = get_compliance_summary()

        # Generate report
        report = generate_compliance_report(compliance_data)

        # Save report to S3
        report_key = f"compliance-reports/{environment_suffix}/{datetime.now().isoformat()}.json"
        s3_client.put_object(
            Bucket=s3_bucket,
            Key=report_key,
            Body=json.dumps(report, indent=2),
            ContentType='application/json'
        )

        # Send notification if there are violations
        if report['summary']['non_compliant_count'] > 0:
            send_compliance_notification(sns_topic_arn, report)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Compliance report generated successfully',
                'report_location': f"s3://{s3_bucket}/{report_key}",
                'summary': report['summary']
            })
        }
    except Exception as e:
        print(f"Error generating compliance report: {str(e)}")
        raise

def get_compliance_summary() -> Dict[str, Any]:
    """Retrieve compliance status from AWS Config."""
    try:
        # Get all Config rules
        rules_response = config_client.describe_config_rules()
        rules = rules_response.get('ConfigRules', [])

        compliance_summary = {
            'rules': [],
            'total_rules': len(rules),
            'compliant_count': 0,
            'non_compliant_count': 0,
            'timestamp': datetime.now().isoformat()
        }

        # Get compliance details for each rule
        for rule in rules:
            rule_name = rule['ConfigRuleName']

            try:
                compliance_response = config_client.describe_compliance_by_config_rule(
                    ConfigRuleNames=[rule_name]
                )

                compliance_results = compliance_response.get('ComplianceByConfigRules', [])
                if compliance_results:
                    compliance_info = compliance_results[0]['Compliance']
                    compliance_type = compliance_info.get('ComplianceType', 'UNKNOWN')

                    rule_data = {
                        'rule_name': rule_name,
                        'description': rule.get('Description', ''),
                        'compliance_status': compliance_type
                    }

                    # Get detailed violations
                    if compliance_type == 'NON_COMPLIANT':
                        details = config_client.get_compliance_details_by_config_rule(
                            ConfigRuleName=rule_name,
                            ComplianceTypes=['NON_COMPLIANT'],
                            Limit=10
                        )
                        rule_data['violations'] = [
                            {
                                'resource_type': result['EvaluationResultIdentifier']['EvaluationResultQualifier']['ResourceType'],
                                'resource_id': result['EvaluationResultIdentifier']['EvaluationResultQualifier']['ResourceId']
                            }
                            for result in details.get('EvaluationResults', [])
                        ]
                        compliance_summary['non_compliant_count'] += 1
                    elif compliance_type == 'COMPLIANT':
                        compliance_summary['compliant_count'] += 1

                    compliance_summary['rules'].append(rule_data)
            except Exception as e:
                print(f"Error getting compliance for rule {rule_name}: {str(e)}")
                continue

        return compliance_summary
    except Exception as e:
        print(f"Error retrieving compliance summary: {str(e)}")
        raise

def generate_compliance_report(compliance_data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate formatted compliance report."""
    total_rules = compliance_data['total_rules']
    compliant = compliance_data['compliant_count']
    non_compliant = compliance_data['non_compliant_count']

    compliance_percentage = (compliant / total_rules * 100) if total_rules > 0 else 0

    return {
        'timestamp': compliance_data['timestamp'],
        'summary': {
            'total_rules': total_rules,
            'compliant_count': compliant,
            'non_compliant_count': non_compliant,
            'compliance_percentage': round(compliance_percentage, 2)
        },
        'rules_detail': compliance_data['rules'],
        'recommendations': generate_recommendations(compliance_data)
    }

def generate_recommendations(compliance_data: Dict[str, Any]) -> List[str]:
    """Generate actionable recommendations based on compliance data."""
    recommendations = []

    for rule in compliance_data['rules']:
        if rule['compliance_status'] == 'NON_COMPLIANT':
            if 'encryption' in rule['rule_name'].lower():
                recommendations.append(
                    f"Enable encryption on non-compliant S3 buckets ({len(rule.get('violations', []))} violations)"
                )
            elif 'tag' in rule['rule_name'].lower():
                recommendations.append(
                    f"Add required tags to EC2 instances ({len(rule.get('violations', []))} violations)"
                )

    return recommendations

def send_compliance_notification(topic_arn: str, report: Dict[str, Any]):
    """Send SNS notification for compliance violations."""
    summary = report['summary']

    message = f"""
AWS Config Compliance Alert

Compliance Summary:
- Total Rules: {summary['total_rules']}
- Compliant: {summary['compliant_count']}
- Non-Compliant: {summary['non_compliant_count']}
- Compliance Score: {summary['compliance_percentage']}%

Timestamp: {report['timestamp']}

Recommendations:
"""

    for rec in report['recommendations']:
        message += f"- {rec}\\n"

    message += "\\nPlease review the full compliance report for details."

    sns_client.publish(
        TopicArn=topic_arn,
        Subject="AWS Config Compliance Violation Alert",
        Message=message
    )
`),
        }),
      },
      { parent: this, dependsOn: [lambdaPolicy] }
    );

    // EventBridge rule to trigger Lambda periodically
    const complianceSchedule = new aws.cloudwatch.EventRule(
      `compliance-schedule-${environmentSuffix}`,
      {
        name: `compliance-check-schedule-${environmentSuffix}`,
        description: 'Trigger compliance report generation daily',
        scheduleExpression: 'rate(1 day)',
      },
      { parent: this }
    );

    new aws.cloudwatch.EventTarget(
      `compliance-schedule-target-${environmentSuffix}`,
      {
        rule: complianceSchedule.name,
        arn: complianceReporter.arn,
      },
      { parent: this }
    );

    // Lambda permission for EventBridge
    new aws.lambda.Permission(
      `compliance-lambda-event-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: complianceReporter.name,
        principal: 'events.amazonaws.com',
        sourceArn: complianceSchedule.arn,
      },
      { parent: this }
    );

    // CloudWatch dashboard
    const dashboard = new aws.cloudwatch.Dashboard(
      `compliance-dashboard-${environmentSuffix}`,
      {
        dashboardName: `compliance-metrics-${environmentSuffix}`,
        dashboardBody: pulumi
          .all([s3EncryptionRule.name, ec2TagsRule.name])
          .apply(() =>
            JSON.stringify({
              widgets: [
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      ['AWS/Config', 'ComplianceScore', { stat: 'Average' }],
                    ],
                    period: 300,
                    stat: 'Average',
                    region: 'us-east-1',
                    title: 'Overall Compliance Score',
                    yAxis: {
                      left: {
                        min: 0,
                        max: 100,
                      },
                    },
                  },
                },
                {
                  type: 'log',
                  properties: {
                    query: `SOURCE '/aws/lambda/compliance-reporter-${environmentSuffix}' | fields @timestamp, @message | sort @timestamp desc | limit 20`,
                    region: 'us-east-1',
                    title: 'Recent Compliance Checks',
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Exports
    this.configRecorderName = configRecorder.name;
    this.bucketArn = configBucket.arn;
    this.snsTopicArn = complianceTopic.arn;

    this.registerOutputs({
      configRecorderName: this.configRecorderName,
      bucketArn: this.bucketArn,
      snsTopicArn: this.snsTopicArn,
      lambdaFunctionName: complianceReporter.name,
      dashboardName: dashboard.dashboardName,
    });
  }
}
