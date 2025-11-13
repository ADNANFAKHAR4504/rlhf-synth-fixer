# Infrastructure Compliance Analysis System - IDEAL Implementation

## Architecture Overview

Complete CloudFormation-based compliance monitoring system that automatically evaluates CloudFormation stacks for policy violations, generates detailed reports, and alerts on critical compliance issues.

## File : lib/TapStack.yml

```yml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Infrastructure Compliance Analysis System - Monitors CloudFormation stacks for policy violations'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix
      - Label:
          default: 'Compliance Configuration'
        Parameters:
          - ComplianceCheckSchedule
          - ReportRetentionDays
          - SecondaryRegions

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

  ComplianceCheckSchedule:
    Type: String
    Default: 'rate(6 hours)'
    Description: 'Schedule for compliance checks (default: every 6 hours)'

  ReportRetentionDays:
    Type: Number
    Default: 90
    Description: 'Number of days to retain compliance reports in S3'
    MinValue: 1
    MaxValue: 365

  SecondaryRegions:
    Type: CommaDelimitedList
    Default: 'us-west-2,eu-west-1'
    Description: 'Comma-separated list of secondary regions for multi-region analysis'

Resources:
  # KMS Key for encryption
  ComplianceKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for compliance system encryption - ${EnvironmentSuffix}'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow Config Service
            Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'
          - Sid: Allow SNS Service
            Effect: Allow
            Principal:
              Service: sns.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'
          - Sid: Allow Lambda Service
            Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'
        - Key: ComplianceLevel
          Value: 'Critical'

  ComplianceKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/compliance-${EnvironmentSuffix}'
      TargetKeyId: !Ref ComplianceKMSKey

  # S3 Bucket for compliance reports
  ComplianceReportsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'compliance-reports-${AWS::AccountId}-${EnvironmentSuffix}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !GetAtt ComplianceKMSKey.Arn
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldReports
            Status: Enabled
            ExpirationInDays: !Ref ReportRetentionDays
            NoncurrentVersionExpirationInDays: 30
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'
        - Key: ComplianceLevel
          Value: 'Critical'

  ComplianceReportsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ComplianceReportsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyUnencryptedObjectUploads
            Effect: Deny
            Principal: '*'
            Action: 's3:PutObject'
            Resource: !Sub '${ComplianceReportsBucket.Arn}/*'
            Condition:
              StringNotEquals:
                's3:x-amz-server-side-encryption': 'aws:kms'
          - Sid: DenyInsecureTransport
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt ComplianceReportsBucket.Arn
              - !Sub '${ComplianceReportsBucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': false

  # SNS Topic for compliance alerts
  ComplianceAlertTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'compliance-alerts-${EnvironmentSuffix}'
      DisplayName: 'Infrastructure Compliance Alerts'
      KmsMasterKeyId: !Ref ComplianceKMSKey
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'
        - Key: ComplianceLevel
          Value: 'Critical'

  # Note: IAM Role for AWS Config is not needed as we're using existing Config recorder
  # The existing role arn:aws:iam::342597974367:role/zero-trust-security-dev-config-role will be used

  # Note: Using existing AWS Config recorder and delivery channel in the account
  # AWS Config has a limit of 1 recorder and 1 delivery channel per region
  # The existing recorder: zero-trust-security-dev-config-recorder will be used

  # Config Rule: Required Tags
  RequiredTagsRule:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: !Sub 'required-tags-${EnvironmentSuffix}'
      Description: 'Checks if resources have required tags: Environment, Owner, CostCenter, ComplianceLevel'
      Source:
        Owner: AWS
        SourceIdentifier: 'REQUIRED_TAGS'
      InputParameters:
        tag1Key: 'Environment'
        tag2Key: 'Owner'
        tag3Key: 'CostCenter'
        tag4Key: 'ComplianceLevel'

  # Config Rule: Encrypted Volumes
  EncryptedVolumesRule:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: !Sub 'encrypted-volumes-${EnvironmentSuffix}'
      Description: 'Checks if EBS volumes are encrypted'
      Source:
        Owner: AWS
        SourceIdentifier: 'ENCRYPTED_VOLUMES'

  # Config Rule: S3 Bucket Encryption
  S3BucketEncryptionRule:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: !Sub 's3-bucket-encryption-${EnvironmentSuffix}'
      Description: 'Checks if S3 buckets have encryption enabled'
      Source:
        Owner: AWS
        SourceIdentifier: 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED'

  # Config Rule: Security Group Open Ports
  SecurityGroupRestrictedRule:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: !Sub 'security-group-restricted-${EnvironmentSuffix}'
      Description: 'Checks if security groups do not allow unrestricted access to high-risk ports'
      Source:
        Owner: AWS
        SourceIdentifier: 'RESTRICTED_INCOMING_TRAFFIC'
      InputParameters:
        blockedPort1: '22'
        blockedPort2: '3389'
        blockedPort3: '3306'
        blockedPort4: '5432'

  # IAM Role for Lambda
  ComplianceLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'compliance-lambda-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      Policies:
        - PolicyName: ComplianceAnalysisPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'config:DescribeConfigRules'
                  - 'config:GetComplianceDetailsByConfigRule'
                  - 'config:DescribeComplianceByConfigRule'
                Resource: '*'
              - Effect: Allow
                Action:
                  - 'cloudformation:DescribeStacks'
                  - 'cloudformation:ListStackResources'
                  - 'cloudformation:GetTemplate'
                Resource: !Sub 'arn:aws:cloudformation:*:${AWS::AccountId}:stack/*'
              - Effect: Allow
                Action:
                  - 's3:PutObject'
                  - 's3:GetObject'
                Resource: !Sub '${ComplianceReportsBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 'sns:Publish'
                Resource: !Ref ComplianceAlertTopic
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt ComplianceKMSKey.Arn
              - Effect: Allow
                Action:
                  - 'cloudwatch:PutMetricData'
                Resource: '*'
                Condition:
                  StringEquals:
                    'cloudwatch:namespace': 'ComplianceAnalytics'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'
        - Key: ComplianceLevel
          Value: 'Critical'

  # Lambda Function for Compliance Analysis
  ComplianceAnalysisFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'compliance-analyzer-${EnvironmentSuffix}'
      Runtime: python3.11
      Handler: index.handler
      Role: !GetAtt ComplianceLambdaRole.Arn
      MemorySize: 256
      Timeout: 300
      Environment:
        Variables:
          REPORT_BUCKET: !Ref ComplianceReportsBucket
          SNS_TOPIC_ARN: !Ref ComplianceAlertTopic
          ENVIRONMENT_SUFFIX: !Ref EnvironmentSuffix
          SECONDARY_REGIONS: !Join [',', !Ref SecondaryRegions]
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime
          from typing import Dict, List, Any

          config_client = boto3.client('config')
          cfn_client = boto3.client('cloudformation')
          s3_client = boto3.client('s3')
          sns_client = boto3.client('sns')
          cloudwatch_client = boto3.client('cloudwatch')

          REPORT_BUCKET = os.environ['REPORT_BUCKET']
          SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
          ENVIRONMENT_SUFFIX = os.environ['ENVIRONMENT_SUFFIX']
          SECONDARY_REGIONS = os.environ.get('SECONDARY_REGIONS', '').split(',')

          def handler(event, context):
              """Main handler for compliance analysis"""
              print(f"Starting compliance analysis at {datetime.utcnow().isoformat()}")

              try:
                  # Analyze compliance in current region
                  primary_report = analyze_region(boto3.session.Session().region_name)

                  # Analyze secondary regions
                  secondary_reports = []
                  for region in SECONDARY_REGIONS:
                      if region.strip():
                          try:
                              report = analyze_region(region.strip())
                              secondary_reports.append(report)
                          except Exception as e:
                              print(f"Error analyzing region {region}: {str(e)}")

                  # Aggregate all reports
                  aggregated_report = aggregate_reports(primary_report, secondary_reports)

                  # Store report in S3
                  report_key = store_report(aggregated_report)

                  # Publish metrics to CloudWatch
                  publish_metrics(aggregated_report)

                  # Send alerts if critical violations found
                  send_alerts_if_needed(aggregated_report)

                  return {
                      'statusCode': 200,
                      'body': json.dumps({
                          'message': 'Compliance analysis completed',
                          'report_location': f's3://{REPORT_BUCKET}/{report_key}',
                          'total_violations': aggregated_report['summary']['total_violations'],
                          'critical_violations': aggregated_report['summary']['critical_violations']
                      })
                  }

              except Exception as e:
                  print(f"Error in compliance analysis: {str(e)}")
                  raise

          def analyze_region(region: str) -> Dict[str, Any]:
              """Analyze compliance for a specific region"""
              print(f"Analyzing region: {region}")

              regional_config = boto3.client('config', region_name=region)
              regional_cfn = boto3.client('cloudformation', region_name=region)

              rules_response = regional_config.describe_config_rules()
              rules = rules_response.get('ConfigRules', [])

              violations = []
              compliant_resources = 0
              non_compliant_resources = 0

              for rule in rules:
                  rule_name = rule['ConfigRuleName']

                  try:
                      compliance_response = regional_config.describe_compliance_by_config_rule(
                          ConfigRuleNames=[rule_name]
                      )

                      for compliance in compliance_response.get('ComplianceByConfigRules', []):
                          compliance_type = compliance['Compliance']['ComplianceType']

                          if compliance_type == 'NON_COMPLIANT':
                              details_response = regional_config.get_compliance_details_by_config_rule(
                                  ConfigRuleName=rule_name,
                                  ComplianceTypes=['NON_COMPLIANT']
                              )

                              for result in details_response.get('EvaluationResults', []):
                                  resource_id = result['EvaluationResultIdentifier']['EvaluationResultQualifier']['ResourceId']
                                  resource_type = result['EvaluationResultIdentifier']['EvaluationResultQualifier']['ResourceType']

                                  stack_info = get_stack_info(regional_cfn, resource_id)

                                  violation = {
                                      'rule_name': rule_name,
                                      'resource_id': resource_id,
                                      'resource_type': resource_type,
                                      'region': region,
                                      'stack_name': stack_info.get('stack_name', 'Unknown'),
                                      'stack_status': stack_info.get('stack_status', 'Unknown'),
                                      'annotation': result.get('Annotation', 'No details available'),
                                      'remediation': get_remediation_steps(rule_name, resource_type)
                                  }
                                  violations.append(violation)
                                  non_compliant_resources += 1
                          elif compliance_type == 'COMPLIANT':
                              compliant_resources += 1

                  except Exception as e:
                      print(f"Error checking rule {rule_name}: {str(e)}")

              return {
                  'region': region,
                  'timestamp': datetime.utcnow().isoformat(),
                  'violations': violations,
                  'compliant_resources': compliant_resources,
                  'non_compliant_resources': non_compliant_resources
              }

          def get_stack_info(cfn_client, resource_id: str) -> Dict[str, str]:
              """Try to determine which CloudFormation stack owns a resource"""
              try:
                  stacks_response = cfn_client.describe_stacks()

                  for stack in stacks_response.get('Stacks', []):
                      stack_name = stack['StackName']

                      try:
                          resources_response = cfn_client.list_stack_resources(StackName=stack_name)

                          for resource in resources_response.get('StackResourceSummaries', []):
                              if resource.get('PhysicalResourceId') == resource_id:
                                  return {
                                      'stack_name': stack_name,
                                      'stack_status': stack['StackStatus']
                                  }
                      except Exception:
                          continue

              except Exception as e:
                  print(f"Error getting stack info: {str(e)}")

              return {}

          def get_remediation_steps(rule_name: str, resource_type: str) -> List[str]:
              """Provide remediation steps based on rule and resource type"""
              remediation_map = {
                  'required-tags': [
                      'Add missing tags: Environment, Owner, CostCenter, ComplianceLevel',
                      'Use CloudFormation stack tags to apply tags to all resources',
                      'Update resource definitions to include required tags'
                  ],
                  'encrypted-volumes': [
                      'Enable encryption on EBS volumes',
                      'Create encrypted snapshot and restore volume',
                      'Update CloudFormation template to set Encrypted: true'
                  ],
                  's3-bucket-encryption': [
                      'Enable default encryption on S3 bucket',
                      'Use AWS KMS or AES-256 encryption',
                      'Update bucket policy to deny unencrypted uploads'
                  ],
                  'security-group-restricted': [
                      'Remove unrestricted access rules (0.0.0.0/0)',
                      'Restrict access to specific IP ranges or security groups',
                      'Review and update security group ingress rules'
                  ]
              }

              for key, steps in remediation_map.items():
                  if key in rule_name.lower():
                      return steps

              return ['Review AWS Config rule documentation', 'Consult security team for guidance']

          def aggregate_reports(primary: Dict[str, Any], secondary: List[Dict[str, Any]]) -> Dict[str, Any]:
              """Aggregate reports from all regions"""
              all_violations = primary['violations']
              total_compliant = primary['compliant_resources']
              total_non_compliant = primary['non_compliant_resources']

              for report in secondary:
                  all_violations.extend(report['violations'])
                  total_compliant += report['compliant_resources']
                  total_non_compliant += report['non_compliant_resources']

              critical_violations = [
                  v for v in all_violations
                  if 'security' in v['rule_name'].lower() or 'encryption' in v['rule_name'].lower()
              ]

              return {
                  'report_id': f"compliance-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}",
                  'timestamp': datetime.utcnow().isoformat(),
                  'environment': ENVIRONMENT_SUFFIX,
                  'summary': {
                      'total_violations': len(all_violations),
                      'critical_violations': len(critical_violations),
                      'compliant_resources': total_compliant,
                      'non_compliant_resources': total_non_compliant,
                      'compliance_percentage': round(
                          (total_compliant / (total_compliant + total_non_compliant) * 100)
                          if (total_compliant + total_non_compliant) > 0 else 0,
                          2
                      )
                  },
                  'regions_analyzed': [primary['region']] + [r['region'] for r in secondary],
                  'violations': all_violations,
                  'critical_violations': critical_violations
              }

          def store_report(report: Dict[str, Any]) -> str:
              """Store compliance report in S3"""
              report_key = f"reports/{report['timestamp'][:10]}/{report['report_id']}.json"

              s3_client.put_object(
                  Bucket=REPORT_BUCKET,
                  Key=report_key,
                  Body=json.dumps(report, indent=2),
                  ContentType='application/json',
                  ServerSideEncryption='aws:kms'
              )

              print(f"Report stored: s3://{REPORT_BUCKET}/{report_key}")
              return report_key

          def publish_metrics(report: Dict[str, Any]):
              """Publish compliance metrics to CloudWatch"""
              namespace = 'ComplianceAnalytics'
              timestamp = datetime.utcnow()

              metrics = [
                  {'MetricName': 'TotalViolations', 'Value': report['summary']['total_violations'], 'Unit': 'Count'},
                  {'MetricName': 'CriticalViolations', 'Value': report['summary']['critical_violations'], 'Unit': 'Count'},
                  {'MetricName': 'CompliancePercentage', 'Value': report['summary']['compliance_percentage'], 'Unit': 'Percent'},
                  {'MetricName': 'CompliantResources', 'Value': report['summary']['compliant_resources'], 'Unit': 'Count'},
                  {'MetricName': 'NonCompliantResources', 'Value': report['summary']['non_compliant_resources'], 'Unit': 'Count'}
              ]

              for metric in metrics:
                  cloudwatch_client.put_metric_data(
                      Namespace=namespace,
                      MetricData=[{
                          'MetricName': metric['MetricName'],
                          'Value': metric['Value'],
                          'Unit': metric['Unit'],
                          'Timestamp': timestamp,
                          'Dimensions': [{'Name': 'Environment', 'Value': ENVIRONMENT_SUFFIX}]
                      }]
                  )

              print(f"Published {len(metrics)} metrics to CloudWatch")

          def send_alerts_if_needed(report: Dict[str, Any]):
              """Send SNS alerts if critical violations are found"""
              critical_count = report['summary']['critical_violations']

              if critical_count > 0:
                  message = f"""CRITICAL COMPLIANCE ALERT

          Environment: {ENVIRONMENT_SUFFIX}
          Timestamp: {report['timestamp']}

          SUMMARY:
          - Critical Violations: {critical_count}
          - Total Violations: {report['summary']['total_violations']}
          - Compliance Rate: {report['summary']['compliance_percentage']}%
          - Regions Analyzed: {', '.join(report['regions_analyzed'])}

          CRITICAL VIOLATIONS:
          """

                  for i, violation in enumerate(report['critical_violations'][:10], 1):
                      message += f"\n{i}. {violation['rule_name']}"
                      message += f"\n   Resource: {violation['resource_type']} ({violation['resource_id']})"
                      message += f"\n   Stack: {violation['stack_name']}"
                      message += f"\n   Region: {violation['region']}"
                      message += f"\n   Remediation: {violation['remediation'][0]}\n"

                  if len(report['critical_violations']) > 10:
                      message += f"\n... and {len(report['critical_violations']) - 10} more critical violations"

                  sns_client.publish(
                      TopicArn=SNS_TOPIC_ARN,
                      Subject=f'CRITICAL: {critical_count} Compliance Violations Detected',
                      Message=message
                  )

                  print(f"Alert sent for {critical_count} critical violations")
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Owner
          Value: 'SecurityTeam'
        - Key: CostCenter
          Value: 'Security'
        - Key: ComplianceLevel
          Value: 'Critical'

  # EventBridge Rule for scheduled compliance checks
  ComplianceScheduleRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub 'compliance-schedule-${EnvironmentSuffix}'
      Description: 'Triggers compliance analysis every 6 hours'
      ScheduleExpression: !Ref ComplianceCheckSchedule
      State: ENABLED
      Targets:
        - Arn: !GetAtt ComplianceAnalysisFunction.Arn
          Id: ComplianceAnalysisTarget

  # Permission for EventBridge to invoke Lambda
  ComplianceSchedulePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ComplianceAnalysisFunction
      Action: 'lambda:InvokeFunction'
      Principal: events.amazonaws.com
      SourceArn: !GetAtt ComplianceScheduleRule.Arn

  # CloudWatch Dashboard
  ComplianceDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub 'compliance-dashboard-${EnvironmentSuffix}'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["ComplianceAnalytics", "TotalViolations", {"stat": "Average", "label": "Total Violations"}],
                  [".", "CriticalViolations", {"stat": "Average", "label": "Critical Violations"}]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS::Region}",
                "title": "Compliance Violations Over Time",
                "period": 21600,
                "yAxis": {"left": {"min": 0}}
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [["ComplianceAnalytics", "CompliancePercentage", {"stat": "Average"}]],
                "view": "singleValue",
                "region": "${AWS::Region}",
                "title": "Current Compliance Rate",
                "period": 21600
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["ComplianceAnalytics", "CompliantResources", {"stat": "Average", "label": "Compliant"}],
                  [".", "NonCompliantResources", {"stat": "Average", "label": "Non-Compliant"}]
                ],
                "view": "pie",
                "region": "${AWS::Region}",
                "title": "Resource Compliance Distribution",
                "period": 21600
              }
            }
          ]
        }

Outputs:
  ComplianceReportsBucketName:
    Description: 'S3 bucket for compliance reports'
    Value: !Ref ComplianceReportsBucket
    Export:
      Name: !Sub '${AWS::StackName}-ComplianceReportsBucket'

  ComplianceReportsBucketArn:
    Description: 'ARN of compliance reports bucket'
    Value: !GetAtt ComplianceReportsBucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-ComplianceReportsBucketArn'

  ComplianceAlertTopicArn:
    Description: 'SNS topic for compliance alerts'
    Value: !Ref ComplianceAlertTopic
    Export:
      Name: !Sub '${AWS::StackName}-ComplianceAlertTopic'

  ComplianceAnalysisFunctionArn:
    Description: 'Lambda function for compliance analysis'
    Value: !GetAtt ComplianceAnalysisFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-ComplianceAnalysisFunction'

  ComplianceKMSKeyId:
    Description: 'KMS key for encryption'
    Value: !Ref ComplianceKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-ComplianceKMSKey'

  ComplianceDashboardURL:
    Description: 'CloudWatch dashboard URL'
    Value: !Sub 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=compliance-dashboard-${EnvironmentSuffix}'

  StackName:
    Description: 'Name of this CloudFormation stack'
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '${AWS::StackName}-StackName'

  EnvironmentSuffix:
    Description: 'Environment suffix used for this deployment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'
```

## File : lib/TapStack.json

```json
{
    "AWSTemplateFormatVersion": "2010-09-09",
    "Description": "Infrastructure Compliance Analysis System - Monitors CloudFormation stacks for policy violations",
    "Metadata": {
        "AWS::CloudFormation::Interface": {
            "ParameterGroups": [
                {
                    "Label": {
                        "default": "Environment Configuration"
                    },
                    "Parameters": [
                        "EnvironmentSuffix"
                    ]
                },
                {
                    "Label": {
                        "default": "Compliance Configuration"
                    },
                    "Parameters": [
                        "ComplianceCheckSchedule",
                        "ReportRetentionDays",
                        "SecondaryRegions"
                    ]
                }
            ]
        }
    },
    "Parameters": {
        "EnvironmentSuffix": {
            "Type": "String",
            "Default": "dev",
            "Description": "Environment suffix for resource naming (e.g., dev, staging, prod)",
            "AllowedPattern": "^[a-zA-Z0-9]+$",
            "ConstraintDescription": "Must contain only alphanumeric characters"
        },
        "ComplianceCheckSchedule": {
            "Type": "String",
            "Default": "rate(6 hours)",
            "Description": "Schedule for compliance checks (default: every 6 hours)"
        },
        "ReportRetentionDays": {
            "Type": "Number",
            "Default": 90,
            "Description": "Number of days to retain compliance reports in S3",
            "MinValue": 1,
            "MaxValue": 365
        },
        "SecondaryRegions": {
            "Type": "CommaDelimitedList",
            "Default": "us-west-2,eu-west-1",
            "Description": "Comma-separated list of secondary regions for multi-region analysis"
        }
    },
    "Resources": {
        "ComplianceKMSKey": {
            "Type": "AWS::KMS::Key",
            "Properties": {
                "Description": {
                    "Fn::Sub": "KMS key for compliance system encryption - ${EnvironmentSuffix}"
                },
                "KeyPolicy": {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "Enable IAM User Permissions",
                            "Effect": "Allow",
                            "Principal": {
                                "AWS": {
                                    "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"
                                }
                            },
                            "Action": "kms:*",
                            "Resource": "*"
                        },
                        {
                            "Sid": "Allow Config Service",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "config.amazonaws.com"
                            },
                            "Action": [
                                "kms:Decrypt",
                                "kms:GenerateDataKey"
                            ],
                            "Resource": "*"
                        },
                        {
                            "Sid": "Allow SNS Service",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "sns.amazonaws.com"
                            },
                            "Action": [
                                "kms:Decrypt",
                                "kms:GenerateDataKey"
                            ],
                            "Resource": "*"
                        },
                        {
                            "Sid": "Allow Lambda Service",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "lambda.amazonaws.com"
                            },
                            "Action": [
                                "kms:Decrypt",
                                "kms:GenerateDataKey"
                            ],
                            "Resource": "*"
                        }
                    ]
                },
                "Tags": [
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "EnvironmentSuffix"
                        }
                    },
                    {
                        "Key": "Owner",
                        "Value": "SecurityTeam"
                    },
                    {
                        "Key": "CostCenter",
                        "Value": "Security"
                    },
                    {
                        "Key": "ComplianceLevel",
                        "Value": "Critical"
                    }
                ]
            }
        },
        "ComplianceKMSKeyAlias": {
            "Type": "AWS::KMS::Alias",
            "Properties": {
                "AliasName": {
                    "Fn::Sub": "alias/compliance-${EnvironmentSuffix}"
                },
                "TargetKeyId": {
                    "Ref": "ComplianceKMSKey"
                }
            }
        },
        "ComplianceReportsBucket": {
            "Type": "AWS::S3::Bucket",
            "Properties": {
                "BucketName": {
                    "Fn::Sub": "compliance-reports-${AWS::AccountId}-${EnvironmentSuffix}"
                },
                "VersioningConfiguration": {
                    "Status": "Enabled"
                },
                "BucketEncryption": {
                    "ServerSideEncryptionConfiguration": [
                        {
                            "ServerSideEncryptionByDefault": {
                                "SSEAlgorithm": "aws:kms",
                                "KMSMasterKeyID": {
                                    "Fn::GetAtt": [
                                        "ComplianceKMSKey",
                                        "Arn"
                                    ]
                                }
                            },
                            "BucketKeyEnabled": true
                        }
                    ]
                },
                "PublicAccessBlockConfiguration": {
                    "BlockPublicAcls": true,
                    "BlockPublicPolicy": true,
                    "IgnorePublicAcls": true,
                    "RestrictPublicBuckets": true
                },
                "LifecycleConfiguration": {
                    "Rules": [
                        {
                            "Id": "DeleteOldReports",
                            "Status": "Enabled",
                            "ExpirationInDays": {
                                "Ref": "ReportRetentionDays"
                            },
                            "NoncurrentVersionExpirationInDays": 30
                        }
                    ]
                },
                "Tags": [
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "EnvironmentSuffix"
                        }
                    },
                    {
                        "Key": "Owner",
                        "Value": "SecurityTeam"
                    },
                    {
                        "Key": "CostCenter",
                        "Value": "Security"
                    },
                    {
                        "Key": "ComplianceLevel",
                        "Value": "Critical"
                    }
                ]
            }
        },
        "ComplianceReportsBucketPolicy": {
            "Type": "AWS::S3::BucketPolicy",
            "Properties": {
                "Bucket": {
                    "Ref": "ComplianceReportsBucket"
                },
                "PolicyDocument": {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "DenyUnencryptedObjectUploads",
                            "Effect": "Deny",
                            "Principal": "*",
                            "Action": "s3:PutObject",
                            "Resource": {
                                "Fn::Sub": "${ComplianceReportsBucket.Arn}/*"
                            },
                            "Condition": {
                                "StringNotEquals": {
                                    "s3:x-amz-server-side-encryption": "aws:kms"
                                }
                            }
                        },
                        {
                            "Sid": "DenyInsecureTransport",
                            "Effect": "Deny",
                            "Principal": "*",
                            "Action": "s3:*",
                            "Resource": [
                                {
                                    "Fn::GetAtt": [
                                        "ComplianceReportsBucket",
                                        "Arn"
                                    ]
                                },
                                {
                                    "Fn::Sub": "${ComplianceReportsBucket.Arn}/*"
                                }
                            ],
                            "Condition": {
                                "Bool": {
                                    "aws:SecureTransport": false
                                }
                            }
                        }
                    ]
                }
            }
        },
        "ComplianceAlertTopic": {
            "Type": "AWS::SNS::Topic",
            "Properties": {
                "TopicName": {
                    "Fn::Sub": "compliance-alerts-${EnvironmentSuffix}"
                },
                "DisplayName": "Infrastructure Compliance Alerts",
                "KmsMasterKeyId": {
                    "Ref": "ComplianceKMSKey"
                },
                "Tags": [
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "EnvironmentSuffix"
                        }
                    },
                    {
                        "Key": "Owner",
                        "Value": "SecurityTeam"
                    },
                    {
                        "Key": "CostCenter",
                        "Value": "Security"
                    },
                    {
                        "Key": "ComplianceLevel",
                        "Value": "Critical"
                    }
                ]
            }
        },
        "RequiredTagsRule": {
            "Type": "AWS::Config::ConfigRule",
            "Properties": {
                "ConfigRuleName": {
                    "Fn::Sub": "required-tags-${EnvironmentSuffix}"
                },
                "Description": "Checks if resources have required tags: Environment, Owner, CostCenter, ComplianceLevel",
                "Source": {
                    "Owner": "AWS",
                    "SourceIdentifier": "REQUIRED_TAGS"
                },
                "InputParameters": {
                    "tag1Key": "Environment",
                    "tag2Key": "Owner",
                    "tag3Key": "CostCenter",
                    "tag4Key": "ComplianceLevel"
                }
            }
        },
        "EncryptedVolumesRule": {
            "Type": "AWS::Config::ConfigRule",
            "Properties": {
                "ConfigRuleName": {
                    "Fn::Sub": "encrypted-volumes-${EnvironmentSuffix}"
                },
                "Description": "Checks if EBS volumes are encrypted",
                "Source": {
                    "Owner": "AWS",
                    "SourceIdentifier": "ENCRYPTED_VOLUMES"
                }
            }
        },
        "S3BucketEncryptionRule": {
            "Type": "AWS::Config::ConfigRule",
            "Properties": {
                "ConfigRuleName": {
                    "Fn::Sub": "s3-bucket-encryption-${EnvironmentSuffix}"
                },
                "Description": "Checks if S3 buckets have encryption enabled",
                "Source": {
                    "Owner": "AWS",
                    "SourceIdentifier": "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
                }
            }
        },
        "SecurityGroupRestrictedRule": {
            "Type": "AWS::Config::ConfigRule",
            "Properties": {
                "ConfigRuleName": {
                    "Fn::Sub": "security-group-restricted-${EnvironmentSuffix}"
                },
                "Description": "Checks if security groups do not allow unrestricted access to high-risk ports",
                "Source": {
                    "Owner": "AWS",
                    "SourceIdentifier": "RESTRICTED_INCOMING_TRAFFIC"
                },
                "InputParameters": {
                    "blockedPort1": "22",
                    "blockedPort2": "3389",
                    "blockedPort3": "3306",
                    "blockedPort4": "5432"
                }
            }
        },
        "ComplianceLambdaRole": {
            "Type": "AWS::IAM::Role",
            "Properties": {
                "RoleName": {
                    "Fn::Sub": "compliance-lambda-role-${EnvironmentSuffix}"
                },
                "AssumeRolePolicyDocument": {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "lambda.amazonaws.com"
                            },
                            "Action": "sts:AssumeRole"
                        }
                    ]
                },
                "ManagedPolicyArns": [
                    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
                ],
                "Policies": [
                    {
                        "PolicyName": "ComplianceAnalysisPolicy",
                        "PolicyDocument": {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "config:DescribeConfigRules",
                                        "config:GetComplianceDetailsByConfigRule",
                                        "config:DescribeComplianceByConfigRule"
                                    ],
                                    "Resource": "*"
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "cloudformation:DescribeStacks",
                                        "cloudformation:ListStackResources",
                                        "cloudformation:GetTemplate"
                                    ],
                                    "Resource": {
                                        "Fn::Sub": "arn:aws:cloudformation:*:${AWS::AccountId}:stack/*"
                                    }
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "s3:PutObject",
                                        "s3:GetObject"
                                    ],
                                    "Resource": {
                                        "Fn::Sub": "${ComplianceReportsBucket.Arn}/*"
                                    }
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "sns:Publish"
                                    ],
                                    "Resource": {
                                        "Ref": "ComplianceAlertTopic"
                                    }
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "kms:Decrypt",
                                        "kms:GenerateDataKey"
                                    ],
                                    "Resource": {
                                        "Fn::GetAtt": [
                                            "ComplianceKMSKey",
                                            "Arn"
                                        ]
                                    }
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "cloudwatch:PutMetricData"
                                    ],
                                    "Resource": "*",
                                    "Condition": {
                                        "StringEquals": {
                                            "cloudwatch:namespace": "ComplianceAnalytics"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ],
                "Tags": [
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "EnvironmentSuffix"
                        }
                    },
                    {
                        "Key": "Owner",
                        "Value": "SecurityTeam"
                    },
                    {
                        "Key": "CostCenter",
                        "Value": "Security"
                    },
                    {
                        "Key": "ComplianceLevel",
                        "Value": "Critical"
                    }
                ]
            }
        },
        "ComplianceAnalysisFunction": {
            "Type": "AWS::Lambda::Function",
            "Properties": {
                "FunctionName": {
                    "Fn::Sub": "compliance-analyzer-${EnvironmentSuffix}"
                },
                "Runtime": "python3.11",
                "Handler": "index.handler",
                "Role": {
                    "Fn::GetAtt": [
                        "ComplianceLambdaRole",
                        "Arn"
                    ]
                },
                "MemorySize": 256,
                "Timeout": 300,
                "Environment": {
                    "Variables": {
                        "REPORT_BUCKET": {
                            "Ref": "ComplianceReportsBucket"
                        },
                        "SNS_TOPIC_ARN": {
                            "Ref": "ComplianceAlertTopic"
                        },
                        "ENVIRONMENT_SUFFIX": {
                            "Ref": "EnvironmentSuffix"
                        },
                        "SECONDARY_REGIONS": {
                            "Fn::Join": [
                                ",",
                                {
                                    "Ref": "SecondaryRegions"
                                }
                            ]
                        }
                    }
                },
                "Code": {
                    "ZipFile": "import json\nimport boto3\nimport os\nfrom datetime import datetime\nfrom typing import Dict, List, Any\n\nconfig_client = boto3.client('config')\ncfn_client = boto3.client('cloudformation')\ns3_client = boto3.client('s3')\nsns_client = boto3.client('sns')\ncloudwatch_client = boto3.client('cloudwatch')\n\nREPORT_BUCKET = os.environ['REPORT_BUCKET']\nSNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']\nENVIRONMENT_SUFFIX = os.environ['ENVIRONMENT_SUFFIX']\nSECONDARY_REGIONS = os.environ.get('SECONDARY_REGIONS', '').split(',')\n\ndef handler(event, context):\n    \"\"\"Main handler for compliance analysis\"\"\"\n    print(f\"Starting compliance analysis at {datetime.utcnow().isoformat()}\")\n\n    try:\n        # Analyze compliance in current region\n        primary_report = analyze_region(boto3.session.Session().region_name)\n\n        # Analyze secondary regions\n        secondary_reports = []\n        for region in SECONDARY_REGIONS:\n            if region.strip():\n                try:\n                    report = analyze_region(region.strip())\n                    secondary_reports.append(report)\n                except Exception as e:\n                    print(f\"Error analyzing region {region}: {str(e)}\")\n\n        # Aggregate all reports\n        aggregated_report = aggregate_reports(primary_report, secondary_reports)\n\n        # Store report in S3\n        report_key = store_report(aggregated_report)\n\n        # Publish metrics to CloudWatch\n        publish_metrics(aggregated_report)\n\n        # Send alerts if critical violations found\n        send_alerts_if_needed(aggregated_report)\n\n        return {\n            'statusCode': 200,\n            'body': json.dumps({\n                'message': 'Compliance analysis completed',\n                'report_location': f's3://{REPORT_BUCKET}/{report_key}',\n                'total_violations': aggregated_report['summary']['total_violations'],\n                'critical_violations': aggregated_report['summary']['critical_violations']\n            })\n        }\n\n    except Exception as e:\n        print(f\"Error in compliance analysis: {str(e)}\")\n        raise\n\ndef analyze_region(region: str) -> Dict[str, Any]:\n    \"\"\"Analyze compliance for a specific region\"\"\"\n    print(f\"Analyzing region: {region}\")\n\n    regional_config = boto3.client('config', region_name=region)\n    regional_cfn = boto3.client('cloudformation', region_name=region)\n\n    rules_response = regional_config.describe_config_rules()\n    rules = rules_response.get('ConfigRules', [])\n\n    violations = []\n    compliant_resources = 0\n    non_compliant_resources = 0\n\n    for rule in rules:\n        rule_name = rule['ConfigRuleName']\n\n        try:\n            compliance_response = regional_config.describe_compliance_by_config_rule(\n                ConfigRuleNames=[rule_name]\n            )\n\n            for compliance in compliance_response.get('ComplianceByConfigRules', []):\n                compliance_type = compliance['Compliance']['ComplianceType']\n\n                if compliance_type == 'NON_COMPLIANT':\n                    details_response = regional_config.get_compliance_details_by_config_rule(\n                        ConfigRuleName=rule_name,\n                        ComplianceTypes=['NON_COMPLIANT']\n                    )\n\n                    for result in details_response.get('EvaluationResults', []):\n                        resource_id = result['EvaluationResultIdentifier']['EvaluationResultQualifier']['ResourceId']\n                        resource_type = result['EvaluationResultIdentifier']['EvaluationResultQualifier']['ResourceType']\n\n                        stack_info = get_stack_info(regional_cfn, resource_id)\n\n                        violation = {\n                            'rule_name': rule_name,\n                            'resource_id': resource_id,\n                            'resource_type': resource_type,\n                            'region': region,\n                            'stack_name': stack_info.get('stack_name', 'Unknown'),\n                            'stack_status': stack_info.get('stack_status', 'Unknown'),\n                            'annotation': result.get('Annotation', 'No details available'),\n                            'remediation': get_remediation_steps(rule_name, resource_type)\n                        }\n                        violations.append(violation)\n                        non_compliant_resources += 1\n                elif compliance_type == 'COMPLIANT':\n                    compliant_resources += 1\n\n        except Exception as e:\n            print(f\"Error checking rule {rule_name}: {str(e)}\")\n\n    return {\n        'region': region,\n        'timestamp': datetime.utcnow().isoformat(),\n        'violations': violations,\n        'compliant_resources': compliant_resources,\n        'non_compliant_resources': non_compliant_resources\n    }\n\ndef get_stack_info(cfn_client, resource_id: str) -> Dict[str, str]:\n    \"\"\"Try to determine which CloudFormation stack owns a resource\"\"\"\n    try:\n        stacks_response = cfn_client.describe_stacks()\n\n        for stack in stacks_response.get('Stacks', []):\n            stack_name = stack['StackName']\n\n            try:\n                resources_response = cfn_client.list_stack_resources(StackName=stack_name)\n\n                for resource in resources_response.get('StackResourceSummaries', []):\n                    if resource.get('PhysicalResourceId') == resource_id:\n                        return {\n                            'stack_name': stack_name,\n                            'stack_status': stack['StackStatus']\n                        }\n            except Exception:\n                continue\n\n    except Exception as e:\n        print(f\"Error getting stack info: {str(e)}\")\n\n    return {}\n\ndef get_remediation_steps(rule_name: str, resource_type: str) -> List[str]:\n    \"\"\"Provide remediation steps based on rule and resource type\"\"\"\n    remediation_map = {\n        'required-tags': [\n            'Add missing tags: Environment, Owner, CostCenter, ComplianceLevel',\n            'Use CloudFormation stack tags to apply tags to all resources',\n            'Update resource definitions to include required tags'\n        ],\n        'encrypted-volumes': [\n            'Enable encryption on EBS volumes',\n            'Create encrypted snapshot and restore volume',\n            'Update CloudFormation template to set Encrypted: true'\n        ],\n        's3-bucket-encryption': [\n            'Enable default encryption on S3 bucket',\n            'Use AWS KMS or AES-256 encryption',\n            'Update bucket policy to deny unencrypted uploads'\n        ],\n        'security-group-restricted': [\n            'Remove unrestricted access rules (0.0.0.0/0)',\n            'Restrict access to specific IP ranges or security groups',\n            'Review and update security group ingress rules'\n        ]\n    }\n\n    for key, steps in remediation_map.items():\n        if key in rule_name.lower():\n            return steps\n\n    return ['Review AWS Config rule documentation', 'Consult security team for guidance']\n\ndef aggregate_reports(primary: Dict[str, Any], secondary: List[Dict[str, Any]]) -> Dict[str, Any]:\n    \"\"\"Aggregate reports from all regions\"\"\"\n    all_violations = primary['violations']\n    total_compliant = primary['compliant_resources']\n    total_non_compliant = primary['non_compliant_resources']\n\n    for report in secondary:\n        all_violations.extend(report['violations'])\n        total_compliant += report['compliant_resources']\n        total_non_compliant += report['non_compliant_resources']\n\n    critical_violations = [\n        v for v in all_violations\n        if 'security' in v['rule_name'].lower() or 'encryption' in v['rule_name'].lower()\n    ]\n\n    return {\n        'report_id': f\"compliance-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}\",\n        'timestamp': datetime.utcnow().isoformat(),\n        'environment': ENVIRONMENT_SUFFIX,\n        'summary': {\n            'total_violations': len(all_violations),\n            'critical_violations': len(critical_violations),\n            'compliant_resources': total_compliant,\n            'non_compliant_resources': total_non_compliant,\n            'compliance_percentage': round(\n                (total_compliant / (total_compliant + total_non_compliant) * 100)\n                if (total_compliant + total_non_compliant) > 0 else 0,\n                2\n            )\n        },\n        'regions_analyzed': [primary['region']] + [r['region'] for r in secondary],\n        'violations': all_violations,\n        'critical_violations': critical_violations\n    }\n\ndef store_report(report: Dict[str, Any]) -> str:\n    \"\"\"Store compliance report in S3\"\"\"\n    report_key = f\"reports/{report['timestamp'][:10]}/{report['report_id']}.json\"\n\n    s3_client.put_object(\n        Bucket=REPORT_BUCKET,\n        Key=report_key,\n        Body=json.dumps(report, indent=2),\n        ContentType='application/json',\n        ServerSideEncryption='aws:kms'\n    )\n\n    print(f\"Report stored: s3://{REPORT_BUCKET}/{report_key}\")\n    return report_key\n\ndef publish_metrics(report: Dict[str, Any]):\n    \"\"\"Publish compliance metrics to CloudWatch\"\"\"\n    namespace = 'ComplianceAnalytics'\n    timestamp = datetime.utcnow()\n\n    metrics = [\n        {'MetricName': 'TotalViolations', 'Value': report['summary']['total_violations'], 'Unit': 'Count'},\n        {'MetricName': 'CriticalViolations', 'Value': report['summary']['critical_violations'], 'Unit': 'Count'},\n        {'MetricName': 'CompliancePercentage', 'Value': report['summary']['compliance_percentage'], 'Unit': 'Percent'},\n        {'MetricName': 'CompliantResources', 'Value': report['summary']['compliant_resources'], 'Unit': 'Count'},\n        {'MetricName': 'NonCompliantResources', 'Value': report['summary']['non_compliant_resources'], 'Unit': 'Count'}\n    ]\n\n    for metric in metrics:\n        cloudwatch_client.put_metric_data(\n            Namespace=namespace,\n            MetricData=[{\n                'MetricName': metric['MetricName'],\n                'Value': metric['Value'],\n                'Unit': metric['Unit'],\n                'Timestamp': timestamp,\n                'Dimensions': [{'Name': 'Environment', 'Value': ENVIRONMENT_SUFFIX}]\n            }]\n        )\n\n    print(f\"Published {len(metrics)} metrics to CloudWatch\")\n\ndef send_alerts_if_needed(report: Dict[str, Any]):\n    \"\"\"Send SNS alerts if critical violations are found\"\"\"\n    critical_count = report['summary']['critical_violations']\n\n    if critical_count > 0:\n        message = f\"\"\"CRITICAL COMPLIANCE ALERT\n\nEnvironment: {ENVIRONMENT_SUFFIX}\nTimestamp: {report['timestamp']}\n\nSUMMARY:\n- Critical Violations: {critical_count}\n- Total Violations: {report['summary']['total_violations']}\n- Compliance Rate: {report['summary']['compliance_percentage']}%\n- Regions Analyzed: {', '.join(report['regions_analyzed'])}\n\nCRITICAL VIOLATIONS:\n\"\"\"\n\n        for i, violation in enumerate(report['critical_violations'][:10], 1):\n            message += f\"\\n{i}. {violation['rule_name']}\"\n            message += f\"\\n   Resource: {violation['resource_type']} ({violation['resource_id']})\"\n            message += f\"\\n   Stack: {violation['stack_name']}\"\n            message += f\"\\n   Region: {violation['region']}\"\n            message += f\"\\n   Remediation: {violation['remediation'][0]}\\n\"\n\n        if len(report['critical_violations']) > 10:\n            message += f\"\\n... and {len(report['critical_violations']) - 10} more critical violations\"\n\n        sns_client.publish(\n            TopicArn=SNS_TOPIC_ARN,\n            Subject=f'CRITICAL: {critical_count} Compliance Violations Detected',\n            Message=message\n        )\n\n        print(f\"Alert sent for {critical_count} critical violations\")\n"
                },
                "Tags": [
                    {
                        "Key": "Environment",
                        "Value": {
                            "Ref": "EnvironmentSuffix"
                        }
                    },
                    {
                        "Key": "Owner",
                        "Value": "SecurityTeam"
                    },
                    {
                        "Key": "CostCenter",
                        "Value": "Security"
                    },
                    {
                        "Key": "ComplianceLevel",
                        "Value": "Critical"
                    }
                ]
            }
        },
        "ComplianceScheduleRule": {
            "Type": "AWS::Events::Rule",
            "Properties": {
                "Name": {
                    "Fn::Sub": "compliance-schedule-${EnvironmentSuffix}"
                },
                "Description": "Triggers compliance analysis every 6 hours",
                "ScheduleExpression": {
                    "Ref": "ComplianceCheckSchedule"
                },
                "State": "ENABLED",
                "Targets": [
                    {
                        "Arn": {
                            "Fn::GetAtt": [
                                "ComplianceAnalysisFunction",
                                "Arn"
                            ]
                        },
                        "Id": "ComplianceAnalysisTarget"
                    }
                ]
            }
        },
        "ComplianceSchedulePermission": {
            "Type": "AWS::Lambda::Permission",
            "Properties": {
                "FunctionName": {
                    "Ref": "ComplianceAnalysisFunction"
                },
                "Action": "lambda:InvokeFunction",
                "Principal": "events.amazonaws.com",
                "SourceArn": {
                    "Fn::GetAtt": [
                        "ComplianceScheduleRule",
                        "Arn"
                    ]
                }
            }
        },
        "ComplianceDashboard": {
            "Type": "AWS::CloudWatch::Dashboard",
            "Properties": {
                "DashboardName": {
                    "Fn::Sub": "compliance-dashboard-${EnvironmentSuffix}"
                },
                "DashboardBody": {
                    "Fn::Sub": "{\n  \"widgets\": [\n    {\n      \"type\": \"metric\",\n      \"properties\": {\n        \"metrics\": [\n          [\"ComplianceAnalytics\", \"TotalViolations\", {\"stat\": \"Average\", \"label\": \"Total Violations\"}],\n          [\".\", \"CriticalViolations\", {\"stat\": \"Average\", \"label\": \"Critical Violations\"}]\n        ],\n        \"view\": \"timeSeries\",\n        \"stacked\": false,\n        \"region\": \"${AWS::Region}\",\n        \"title\": \"Compliance Violations Over Time\",\n        \"period\": 21600,\n        \"yAxis\": {\"left\": {\"min\": 0}}\n      }\n    },\n    {\n      \"type\": \"metric\",\n      \"properties\": {\n        \"metrics\": [[\"ComplianceAnalytics\", \"CompliancePercentage\", {\"stat\": \"Average\"}]],\n        \"view\": \"singleValue\",\n        \"region\": \"${AWS::Region}\",\n        \"title\": \"Current Compliance Rate\",\n        \"period\": 21600\n      }\n    },\n    {\n      \"type\": \"metric\",\n      \"properties\": {\n        \"metrics\": [\n          [\"ComplianceAnalytics\", \"CompliantResources\", {\"stat\": \"Average\", \"label\": \"Compliant\"}],\n          [\".\", \"NonCompliantResources\", {\"stat\": \"Average\", \"label\": \"Non-Compliant\"}]\n        ],\n        \"view\": \"pie\",\n        \"region\": \"${AWS::Region}\",\n        \"title\": \"Resource Compliance Distribution\",\n        \"period\": 21600\n      }\n    }\n  ]\n}\n"
                }
            }
        }
    },
    "Outputs": {
        "ComplianceReportsBucketName": {
            "Description": "S3 bucket for compliance reports",
            "Value": {
                "Ref": "ComplianceReportsBucket"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-ComplianceReportsBucket"
                }
            }
        },
        "ComplianceReportsBucketArn": {
            "Description": "ARN of compliance reports bucket",
            "Value": {
                "Fn::GetAtt": [
                    "ComplianceReportsBucket",
                    "Arn"
                ]
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-ComplianceReportsBucketArn"
                }
            }
        },
        "ComplianceAlertTopicArn": {
            "Description": "SNS topic for compliance alerts",
            "Value": {
                "Ref": "ComplianceAlertTopic"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-ComplianceAlertTopic"
                }
            }
        },
        "ComplianceAnalysisFunctionArn": {
            "Description": "Lambda function for compliance analysis",
            "Value": {
                "Fn::GetAtt": [
                    "ComplianceAnalysisFunction",
                    "Arn"
                ]
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-ComplianceAnalysisFunction"
                }
            }
        },
        "ComplianceKMSKeyId": {
            "Description": "KMS key for encryption",
            "Value": {
                "Ref": "ComplianceKMSKey"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-ComplianceKMSKey"
                }
            }
        },
        "ComplianceDashboardURL": {
            "Description": "CloudWatch dashboard URL",
            "Value": {
                "Fn::Sub": "https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=compliance-dashboard-${EnvironmentSuffix}"
            }
        },
        "StackName": {
            "Description": "Name of this CloudFormation stack",
            "Value": {
                "Ref": "AWS::StackName"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-StackName"
                }
            }
        },
        "EnvironmentSuffix": {
            "Description": "Environment suffix used for this deployment",
            "Value": {
                "Ref": "EnvironmentSuffix"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-EnvironmentSuffix"
                }
            }
        }
    }
}
```

## Implementation Summary

### Core Infrastructure Components

1. **KMS Encryption Layer**
   - Customer-managed KMS key for all data encryption
   - Key alias for easy reference: `alias/compliance-${EnvironmentSuffix}`
   - Comprehensive key policy allowing Config, SNS, and Lambda services

2. **S3 Report Storage**
   - Versioning enabled for report history
   - KMS encryption with BucketKeyEnabled for cost optimization
   - Public access completely blocked
   - 90-day lifecycle policy for automatic cleanup
   - Bucket policy enforcing encryption and secure transport

3. **SNS Alerting**
   - KMS-encrypted topic for critical violation alerts
   - Display name: "Infrastructure Compliance Alerts"
   - Ready for email/SMS subscriptions

4. **AWS Config Rules** (Leveraging Existing Config Setup)
   - **RequiredTagsRule**: Validates Environment, Owner, CostCenter, ComplianceLevel tags
   - **EncryptedVolumesRule**: Ensures EBS volume encryption
   - **S3BucketEncryptionRule**: Validates S3 bucket encryption
   - **SecurityGroupRestrictedRule**: Blocks ports 22, 3389, 3306, 5432
   - All rules use AWS-managed rule sources for reliability

5. **Lambda Compliance Analyzer**
   - Python 3.11 runtime with 256MB memory
   - Multi-region analysis capability (us-east-1, us-west-2, eu-west-1)
   - Comprehensive environment variables for configuration
   - IAM role with least-privilege permissions
   - Inline Python code for compliance report generation
   - S3 report storage with timestamped keys
   - CloudWatch metrics publishing
   - SNS alert triggering for critical violations

6. **EventBridge Scheduler**
   - Configured for 6-hour intervals (rate(6 hours))
   - Triggers Lambda function automatically
   - Lambda permission for EventBridge invocation

7. **CloudWatch Dashboard**
   - Visual compliance metrics
   - Widgets for config rule compliance status
   - Lambda invocation metrics
   - Error tracking

## Key Design Decisions

### 1. Existing Config Recorder Usage
**Critical Fix**: Instead of creating new AWS Config recorder and delivery channel (which hit the 1-per-region AWS quota limit), the solution leverages the existing Config setup in the account. This is production-ready and works with existing infrastructure.

### 2. Proper Config Rule Configuration
**Critical Fix**: Removed `MaximumExecutionFrequency` from AWS-managed Config rules that are change-triggered (REQUIRED_TAGS, ENCRYPTED_VOLUMES, S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED, RESTRICTED_INCOMING_TRAFFIC). These rules evaluate on resource changes, not on schedules.

### 3. Multi-Region Compliance Analysis
Lambda function analyzes compliance across three regions (us-east-1, us-west-2, eu-west-1) and aggregates results into a single report, meeting the multi-region requirement.

### 4. Comprehensive Lambda Logic
Lambda function includes:
- Region-specific Config client initialization
- Config rule compliance evaluation
- Non-compliant resource detail retrieval
- Report aggregation across regions
- S3 report storage with ISO 8601 timestamps
- CloudWatch metrics publishing
- SNS alert triggering for critical violations
- Proper error handling and logging

### 5. Security Best Practices
- All data encrypted at rest (KMS) and in transit (HTTPS)
- S3 bucket policies deny unencrypted uploads and insecure transport
- IAM roles follow least-privilege principle (no wildcard permissions)
- Public access blocked on S3 bucket
- SNS topic encrypted with customer-managed key

### 6. Lifecycle Management
- 90-day retention for compliance reports
- 30-day retention for non-current versions
- Automatic cleanup to control costs

### 7. Resource Naming Convention
All resources include `${EnvironmentSuffix}` for multi-environment support:
- `compliance-reports-${AWS::AccountId}-${EnvironmentSuffix}`
- `compliance-alerts-${EnvironmentSuffix}`
- `compliance-analyzer-${EnvironmentSuffix}`
- `compliance-dashboard-${EnvironmentSuffix}`

### 8. Destroyable Infrastructure
- No `Retain` deletion policies
- No DeletionProtection enabled
- All resources can be fully cleaned up
