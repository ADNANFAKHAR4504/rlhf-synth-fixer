```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Automated Security Analysis System for AWS Infrastructure Compliance'

Parameters:
  TargetStackNames:
    Type: CommaDelimitedList
    Description: 'Comma-separated list of CloudFormation stack names to analyze'
    Default: ''
  
  EmailNotification:
    Type: String
    Description: 'Email address for critical security violation notifications (leave empty to disable email alerts)'
    Default: ''
    AllowedPattern: '^$|[^@]+@[^@]+\.[^@]+'
    ConstraintDescription: 'Must be a valid email address or empty'
  
  AnalysisSchedule:
    Type: String
    Description: 'Schedule expression for automated analysis (cron or rate)'
    Default: 'rate(24 hours)'
  
  CriticalPortsList:
    Type: CommaDelimitedList
    Description: 'Comma-separated list of sensitive ports to check for unrestricted access'
    Default: '22,3389,3306,5432,27017,6379,9200,8080,443,80'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Analysis Configuration'
        Parameters:
          - TargetStackNames
          - AnalysisSchedule
          - CriticalPortsList
      - Label:
          default: 'Notification Settings'
        Parameters:
          - EmailNotification

Conditions:
  HasEmailNotification: !Not [!Equals [!Ref EmailNotification, '']]

Resources:
  # S3 Bucket for Compliance Reports
  ComplianceReportsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'security-compliance-reports-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldReports
            Status: Enabled
            ExpirationInDays: 90
      Tags:
        - Key: Purpose
          Value: SecurityCompliance
        - Key: ManagedBy
          Value: SecurityAnalysisSystem

  # SNS Topic for Critical Violations
  CriticalViolationsTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: SecurityComplianceAlerts
      DisplayName: Critical Security Violations
      Subscription: !If
        - HasEmailNotification
        - - Endpoint: !Ref EmailNotification
            Protocol: email
        - !Ref 'AWS::NoValue'
      Tags:
        - Key: Purpose
          Value: SecurityAlerts

  # IAM Role for Lambda Function
  SecurityAnalysisLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: SecurityAnalysisPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - cloudformation:DescribeStacks
                  - cloudformation:ListStackResources
                  - cloudformation:GetTemplate
                Resource: '*'
              - Effect: Allow
                Action:
                  - iam:GetRole
                  - iam:GetRolePolicy
                  - iam:ListRolePolicies
                  - iam:ListAttachedRolePolicies
                  - iam:GetPolicy
                  - iam:GetPolicyVersion
                  - iam:SimulatePrincipalPolicy
                Resource: '*'
              - Effect: Allow
                Action:
                  - s3:GetBucketPolicy
                  - s3:GetBucketPolicyStatus
                  - s3:GetBucketPublicAccessBlock
                  - s3:GetEncryptionConfiguration
                  - s3:GetBucketVersioning
                  - s3:GetBucketLogging
                  - s3:ListBucket
                Resource: '*'
              - Effect: Allow
                Action:
                  - rds:DescribeDBInstances
                  - rds:DescribeDBClusters
                  - rds:DescribeDBSnapshots
                  - rds:DescribeDBParameterGroups
                  - rds:DescribeDBParameters
                Resource: '*'
              - Effect: Allow
                Action:
                  - ec2:DescribeSecurityGroups
                  - ec2:DescribeSecurityGroupRules
                  - ec2:DescribeInstances
                  - ec2:DescribeNetworkInterfaces
                Resource: '*'
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:PutObjectAcl
                Resource: !Sub '${ComplianceReportsBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - sns:Publish
                Resource: !Ref CriticalViolationsTopic
              - Effect: Allow
                Action:
                  - cloudwatch:PutMetricData
                Resource: '*'
      Tags:
        - Key: Purpose
          Value: SecurityAnalysis

  # Lambda Function for Security Analysis
  SecurityAnalysisFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: SecurityComplianceAnalyzer
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt SecurityAnalysisLambdaRole.Arn
      Timeout: 900
      MemorySize: 1024
      Environment:
        Variables:
          REPORTS_BUCKET: !Ref ComplianceReportsBucket
          SNS_TOPIC_ARN: !Ref CriticalViolationsTopic
          CRITICAL_PORTS: !Join [',', !Ref CriticalPortsList]
          REGION: !Ref AWS::Region
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime, timedelta
          import re
          from typing import Dict, List, Any
          
          # Initialize AWS clients
          cf_client = boto3.client('cloudformation')
          iam_client = boto3.client('iam')
          s3_client = boto3.client('s3')
          rds_client = boto3.client('rds')
          ec2_client = boto3.client('ec2')
          sns_client = boto3.client('sns')
          cloudwatch = boto3.client('cloudwatch')
          
          REPORTS_BUCKET = os.environ['REPORTS_BUCKET']
          SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
          CRITICAL_PORTS = [int(p) for p in os.environ['CRITICAL_PORTS'].split(',')]
          
          class SecurityAnalyzer:
              def __init__(self):
                  self.findings = {
                      'critical': [],
                      'high': [],
                      'medium': [],
                      'low': [],
                      'info': []
                  }
                  self.statistics = {
                      'total_resources_analyzed': 0,
                      'total_violations': 0,
                      'critical_count': 0,
                      'high_count': 0,
                      'medium_count': 0,
                      'low_count': 0
                  }
              
              def add_finding(self, severity: str, resource_type: str, resource_id: str, 
                             issue: str, recommendation: str):
                  finding = {
                      'timestamp': datetime.utcnow().isoformat(),
                      'severity': severity,
                      'resource_type': resource_type,
                      'resource_id': resource_id,
                      'issue': issue,
                      'recommendation': recommendation
                  }
                  self.findings[severity.lower()].append(finding)
                  self.statistics['total_violations'] += 1
                  self.statistics[f'{severity.lower()}_count'] += 1
              
              def analyze_iam_roles(self, stack_name: str = None):
                  """Analyze IAM roles for overly permissive policies"""
                  try:
                      if stack_name:
                          resources = cf_client.list_stack_resources(StackName=stack_name)
                          iam_roles = [r for r in resources['StackResourceSummaries'] 
                                     if r['ResourceType'] == 'AWS::IAM::Role']
                      else:
                          paginator = iam_client.get_paginator('list_roles')
                          iam_roles = []
                          for page in paginator.paginate():
                              iam_roles.extend(page['Roles'])
                      
                      for role in iam_roles:
                          self.statistics['total_resources_analyzed'] += 1
                          
                          if stack_name:
                              role_name = role['PhysicalResourceId']
                              role_details = iam_client.get_role(RoleName=role_name)['Role']
                          else:
                              role_details = role
                              role_name = role['RoleName']
                          
                          # Check inline policies
                          inline_policies = iam_client.list_role_policies(RoleName=role_name)
                          for policy_name in inline_policies['PolicyNames']:
                              policy_doc = iam_client.get_role_policy(
                                  RoleName=role_name,
                                  PolicyName=policy_name
                              )['PolicyDocument']
                              self._check_policy_permissions(policy_doc, role_name, 'inline')
                          
                          # Check attached policies
                          attached_policies = iam_client.list_attached_role_policies(RoleName=role_name)
                          for policy in attached_policies['AttachedPolicies']:
                              if 'AdministratorAccess' in policy['PolicyArn']:
                                  self.add_finding(
                                      'CRITICAL',
                                      'IAM Role',
                                      role_name,
                                      'Role has AdministratorAccess policy attached',
                                      'Follow principle of least privilege and restrict permissions'
                                  )
                  except Exception as e:
                      print(f"Error analyzing IAM roles: {str(e)}")
              
              def _check_policy_permissions(self, policy_doc: Dict, role_name: str, policy_type: str):
                  """Check for overly permissive policy statements"""
                  if isinstance(policy_doc, str):
                      policy_doc = json.loads(policy_doc)
                  
                  for statement in policy_doc.get('Statement', []):
                      if statement.get('Effect') == 'Allow':
                          actions = statement.get('Action', [])
                          if isinstance(actions, str):
                              actions = [actions]
                          
                          resources = statement.get('Resource', [])
                          if isinstance(resources, str):
                              resources = [resources]
                          
                          # Check for wildcard permissions
                          if '*' in actions:
                              severity = 'CRITICAL' if '*' in resources else 'HIGH'
                              self.add_finding(
                                  severity,
                                  'IAM Role',
                                  role_name,
                                  f'{policy_type} policy allows all actions (*)',
                                  'Specify exact actions needed instead of using wildcards'
                              )
                          
                          # Check for dangerous actions
                          dangerous_actions = [
                              'iam:CreateAccessKey', 'iam:CreateUser', 'iam:AttachUserPolicy',
                              'iam:PutUserPolicy', 'iam:CreateRole', 'iam:AttachRolePolicy'
                          ]
                          for action in actions:
                              if any(dangerous in action for dangerous in dangerous_actions):
                                  self.add_finding(
                                      'HIGH',
                                      'IAM Role',
                                      role_name,
                                      f'{policy_type} policy allows dangerous action: {action}',
                                      'Review if this permission is necessary and consider removing'
                                  )
              
              def analyze_s3_buckets(self, stack_name: str = None):
                  """Analyze S3 buckets for security misconfigurations"""
                  try:
                      if stack_name:
                          resources = cf_client.list_stack_resources(StackName=stack_name)
                          buckets = [r for r in resources['StackResourceSummaries'] 
                                   if r['ResourceType'] == 'AWS::S3::Bucket']
                      else:
                          response = s3_client.list_buckets()
                          buckets = response['Buckets']
                      
                      for bucket in buckets:
                          self.statistics['total_resources_analyzed'] += 1
                          
                          if stack_name:
                              bucket_name = bucket['PhysicalResourceId']
                          else:
                              bucket_name = bucket['Name']
                          
                          # Check public access block
                          try:
                              pab = s3_client.get_public_access_block(Bucket=bucket_name)
                              config = pab['PublicAccessBlockConfiguration']
                              
                              if not all([
                                  config.get('BlockPublicAcls', False),
                                  config.get('BlockPublicPolicy', False),
                                  config.get('IgnorePublicAcls', False),
                                  config.get('RestrictPublicBuckets', False)
                              ]):
                                  self.add_finding(
                                      'HIGH',
                                      'S3 Bucket',
                                      bucket_name,
                                      'Bucket does not have all public access blocks enabled',
                                      'Enable all public access block settings'
                                  )
                          except s3_client.exceptions.NoSuchPublicAccessBlockConfiguration:
                              self.add_finding(
                                  'CRITICAL',
                                  'S3 Bucket',
                                  bucket_name,
                                  'Bucket has no public access block configuration',
                                  'Configure public access block to prevent public access'
                              )
                          
                          # Check encryption
                          try:
                              encryption = s3_client.get_bucket_encryption(Bucket=bucket_name)
                          except s3_client.exceptions.ServerSideEncryptionConfigurationNotFoundError:
                              self.add_finding(
                                  'HIGH',
                                  'S3 Bucket',
                                  bucket_name,
                                  'Bucket does not have encryption enabled',
                                  'Enable server-side encryption for the bucket'
                              )
                          
                          # Check versioning
                          versioning = s3_client.get_bucket_versioning(Bucket=bucket_name)
                          if versioning.get('Status') != 'Enabled':
                              self.add_finding(
                                  'MEDIUM',
                                  'S3 Bucket',
                                  bucket_name,
                                  'Bucket versioning is not enabled',
                                  'Enable versioning for data recovery and compliance'
                              )
                          
                          # Check logging
                          try:
                              logging = s3_client.get_bucket_logging(Bucket=bucket_name)
                              if 'LoggingEnabled' not in logging:
                                  self.add_finding(
                                      'LOW',
                                      'S3 Bucket',
                                      bucket_name,
                                      'Bucket access logging is not enabled',
                                      'Enable access logging for audit trail'
                                  )
                          except Exception:
                              pass
                              
                  except Exception as e:
                      print(f"Error analyzing S3 buckets: {str(e)}")
              
              def analyze_rds_instances(self, stack_name: str = None):
                  """Analyze RDS instances for backup and security configurations"""
                  try:
                      if stack_name:
                          resources = cf_client.list_stack_resources(StackName=stack_name)
                          db_instances = [r for r in resources['StackResourceSummaries'] 
                                        if r['ResourceType'] == 'AWS::RDS::DBInstance']
                      else:
                          response = rds_client.describe_db_instances()
                          db_instances = response['DBInstances']
                      
                      for db in db_instances:
                          self.statistics['total_resources_analyzed'] += 1
                          
                          if stack_name:
                              db_id = db['PhysicalResourceId']
                              db_details = rds_client.describe_db_instances(
                                  DBInstanceIdentifier=db_id
                              )['DBInstances'][0]
                          else:
                              db_details = db
                              db_id = db['DBInstanceIdentifier']
                          
                          # Check backup retention
                          backup_retention = db_details.get('BackupRetentionPeriod', 0)
                          if backup_retention < 7:
                              severity = 'CRITICAL' if backup_retention == 0 else 'HIGH'
                              self.add_finding(
                                  severity,
                                  'RDS Instance',
                                  db_id,
                                  f'Backup retention period is {backup_retention} days (minimum 7 required)',
                                  'Set backup retention period to at least 7 days'
                              )
                          
                          # Check encryption
                          if not db_details.get('StorageEncrypted', False):
                              self.add_finding(
                                  'HIGH',
                                  'RDS Instance',
                                  db_id,
                                  'Database storage is not encrypted',
                                  'Enable encryption at rest for the database'
                              )
                          
                          # Check public accessibility
                          if db_details.get('PubliclyAccessible', False):
                              self.add_finding(
                                  'CRITICAL',
                                  'RDS Instance',
                                  db_id,
                                  'Database is publicly accessible',
                                  'Disable public accessibility for the database'
                              )
                          
                          # Check Multi-AZ
                          if not db_details.get('MultiAZ', False):
                              self.add_finding(
                                  'MEDIUM',
                                  'RDS Instance',
                                  db_id,
                                  'Database is not configured for Multi-AZ',
                                  'Enable Multi-AZ for high availability'
                              )
                          
                          # Check deletion protection
                          if not db_details.get('DeletionProtection', False):
                              self.add_finding(
                                  'LOW',
                                  'RDS Instance',
                                  db_id,
                                  'Deletion protection is not enabled',
                                  'Enable deletion protection to prevent accidental deletion'
                              )
                              
                  except Exception as e:
                      print(f"Error analyzing RDS instances: {str(e)}")
              
              def analyze_security_groups(self, stack_name: str = None):
                  """Analyze security groups for overly permissive rules"""
                  try:
                      if stack_name:
                          resources = cf_client.list_stack_resources(StackName=stack_name)
                          security_groups = [r for r in resources['StackResourceSummaries'] 
                                           if r['ResourceType'] == 'AWS::EC2::SecurityGroup']
                      else:
                          response = ec2_client.describe_security_groups()
                          security_groups = response['SecurityGroups']
                      
                      for sg in security_groups:
                          self.statistics['total_resources_analyzed'] += 1
                          
                          if stack_name:
                              sg_id = sg['PhysicalResourceId']
                              sg_details = ec2_client.describe_security_groups(
                                  GroupIds=[sg_id]
                              )['SecurityGroups'][0]
                          else:
                              sg_details = sg
                              sg_id = sg['GroupId']
                          
                          # Check ingress rules
                          for rule in sg_details.get('IpPermissions', []):
                              from_port = rule.get('FromPort')
                              to_port = rule.get('ToPort')
                              
                              # Check for unrestricted access (0.0.0.0/0)
                              for ip_range in rule.get('IpRanges', []):
                                  if ip_range.get('CidrIp') == '0.0.0.0/0':
                                      # Check if it's a critical port
                                      if from_port and to_port:
                                          for critical_port in CRITICAL_PORTS:
                                              if from_port <= critical_port <= to_port:
                                                  severity = 'CRITICAL'
                                                  port_names = {
                                                      22: 'SSH',
                                                      3389: 'RDP',
                                                      3306: 'MySQL',
                                                      5432: 'PostgreSQL',
                                                      27017: 'MongoDB',
                                                      6379: 'Redis',
                                                      9200: 'Elasticsearch',
                                                      8080: 'HTTP Alt',
                                                      443: 'HTTPS',
                                                      80: 'HTTP'
                                                  }
                                                  port_name = port_names.get(critical_port, str(critical_port))
                                                  self.add_finding(
                                                      severity,
                                                      'Security Group',
                                                      f"{sg_id} ({sg_details.get('GroupName', 'N/A')})",
                                                      f'Unrestricted access from 0.0.0.0/0 on port {critical_port} ({port_name})',
                                                      f'Restrict access to specific IP ranges for port {critical_port}'
                                                  )
                                      elif from_port == -1:  # All traffic
                                          self.add_finding(
                                              'CRITICAL',
                                              'Security Group',
                                              f"{sg_id} ({sg_details.get('GroupName', 'N/A')})",
                                              'Allows all traffic from 0.0.0.0/0',
                                              'Restrict to specific ports and IP ranges'
                                          )
                          
                          # Check for missing egress rules (default allows all)
                          egress_rules = sg_details.get('IpPermissionsEgress', [])
                          if len(egress_rules) == 1 and egress_rules[0].get('IpProtocol') == '-1':
                              if any(ip.get('CidrIp') == '0.0.0.0/0' for ip in egress_rules[0].get('IpRanges', [])):
                                  self.add_finding(
                                      'LOW',
                                      'Security Group',
                                      f"{sg_id} ({sg_details.get('GroupName', 'N/A')})",
                                      'Allows unrestricted egress traffic',
                                      'Consider restricting egress traffic to required destinations'
                                  )
                                  
                  except Exception as e:
                      print(f"Error analyzing security groups: {str(e)}")
              
              def generate_report(self) -> str:
                  """Generate comprehensive compliance report"""
                  report = {
                      'report_id': datetime.utcnow().strftime('%Y%m%d_%H%M%S'),
                      'generated_at': datetime.utcnow().isoformat(),
                      'account_id': boto3.client('sts').get_caller_identity()['Account'],
                      'region': os.environ['REGION'],
                      'statistics': self.statistics,
                      'findings': self.findings,
                      'summary': {
                          'compliance_score': self._calculate_compliance_score(),
                          'risk_level': self._determine_risk_level()
                      }
                  }
                  
                  # Save report to S3
                  report_key = f"compliance-reports/{report['report_id']}/report.json"
                  s3_client.put_object(
                      Bucket=REPORTS_BUCKET,
                      Key=report_key,
                      Body=json.dumps(report, indent=2),
                      ContentType='application/json'
                  )
                  
                  # Generate HTML report
                  html_report = self._generate_html_report(report)
                  html_key = f"compliance-reports/{report['report_id']}/report.html"
                  s3_client.put_object(
                      Bucket=REPORTS_BUCKET,
                      Key=html_key,
                      Body=html_report,
                      ContentType='text/html'
                  )
                  
                  return f"s3://{REPORTS_BUCKET}/{report_key}"
              
              def _calculate_compliance_score(self) -> float:
                  """Calculate overall compliance score"""
                  if self.statistics['total_resources_analyzed'] == 0:
                      return 100.0
                  
                  weights = {
                      'critical': 10,
                      'high': 5,
                      'medium': 2,
                      'low': 1
                  }
                  
                  total_weight = sum(
                      self.statistics[f'{severity}_count'] * weight
                      for severity, weight in weights.items()
                  )
                  
                  max_weight = self.statistics['total_resources_analyzed'] * 10
                  score = max(0, 100 - (total_weight / max_weight * 100))
                  
                  return round(score, 2)
              
              def _determine_risk_level(self) -> str:
                  """Determine overall risk level"""
                  if self.statistics['critical_count'] > 0:
                      return 'CRITICAL'
                  elif self.statistics['high_count'] > 2:
                      return 'HIGH'
                  elif self.statistics['medium_count'] > 5:
                      return 'MEDIUM'
                  elif self.statistics['low_count'] > 10:
                      return 'LOW'
                  else:
                      return 'MINIMAL'
              
              def _generate_html_report(self, report: Dict) -> str:
                  """Generate HTML version of the report"""
                  html = f"""
                  <!DOCTYPE html>
                  <html>
                  <head>
                      <title>Security Compliance Report - {report['report_id']}</title>
                      <style>
                          body {{ font-family: Arial, sans-serif; margin: 20px; }}
                          h1 {{ color: #333; }}
                          .summary {{ background: #f5f5f5; padding: 15px; border-radius: 5px; }}
                          .critical {{ color: #d9534f; }}
                          .high {{ color: #f0ad4e; }}
                          .medium {{ color: #5bc0de; }}
                          .low {{ color: #5cb85c; }}
                          table {{ border-collapse: collapse; width: 100%; margin-top: 20px; }}
                          th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                          th {{ background-color: #f2f2f2; }}
                      </style>
                  </head>
                  <body>
                      <h1>Security Compliance Report</h1>
                      <div class="summary">
                          <p><strong>Report ID:</strong> {report['report_id']}</p>
                          <p><strong>Generated:</strong> {report['generated_at']}</p>
                          <p><strong>Account:</strong> {report['account_id']}</p>
                          <p><strong>Region:</strong> {report['region']}</p>
                          <p><strong>Compliance Score:</strong> {report['summary']['compliance_score']}%</p>
                          <p><strong>Risk Level:</strong> <span class="{report['summary']['risk_level'].lower()}">{report['summary']['risk_level']}</span></p>
                      </div>
                      
                      <h2>Statistics</h2>
                      <ul>
                          <li>Total Resources Analyzed: {report['statistics']['total_resources_analyzed']}</li>
                          <li>Total Violations: {report['statistics']['total_violations']}</li>
                          <li class="critical">Critical: {report['statistics']['critical_count']}</li>
                          <li class="high">High: {report['statistics']['high_count']}</li>
                          <li class="medium">Medium: {report['statistics']['medium_count']}</li>
                          <li class="low">Low: {report['statistics']['low_count']}</li>
                      </ul>
                      
                      <h2>Findings</h2>
                  """
                  
                  for severity in ['critical', 'high', 'medium', 'low']:
                      if report['findings'][severity]:
                          html += f'<h3 class="{severity}">{severity.upper()} Severity</h3>'
                          html += '<table>'
                          html += '<tr><th>Resource Type</th><th>Resource ID</th><th>Issue</th><th>Recommendation</th></tr>'
                          for finding in report['findings'][severity]:
                              html += f"""
                              <tr>
                                  <td>{finding['resource_type']}</td>
                                  <td>{finding['resource_id']}</td>
                                  <td>{finding['issue']}</td>
                                  <td>{finding['recommendation']}</td>
                              </tr>
                              """
                          html += '</table>'
                  
                  html += '</body></html>'
                  return html
              
              def send_notifications(self):
                  """Send notifications for critical findings"""
                  if self.statistics['critical_count'] > 0:
                      message = f"""
                      CRITICAL Security Violations Detected!
                      
                      Summary:
                      - Critical Violations: {self.statistics['critical_count']}
                      - High Violations: {self.statistics['high_count']}
                      - Total Resources Analyzed: {self.statistics['total_resources_analyzed']}
                      
                      Critical Findings:
                      """
                      
                      for finding in self.findings['critical'][:5]:  # Limit to first 5
                          message += f"\n- {finding['resource_type']} ({finding['resource_id']}): {finding['issue']}"
                      
                      if len(self.findings['critical']) > 5:
                          message += f"\n\n... and {len(self.findings['critical']) - 5} more critical findings"
                      
                      message += f"\n\nView full report in S3: {REPORTS_BUCKET}"
                      
                      sns_client.publish(
                          TopicArn=SNS_TOPIC_ARN,
                          Subject='[CRITICAL] AWS Security Compliance Alert',
                          Message=message
                      )
              
              def publish_metrics(self):
                  """Publish metrics to CloudWatch"""
                  namespace = 'SecurityCompliance'
                  
                  metrics = [
                      {
                          'MetricName': 'ComplianceScore',
                          'Value': self._calculate_compliance_score(),
                          'Unit': 'Percent'
                      },
                      {
                          'MetricName': 'TotalViolations',
                          'Value': self.statistics['total_violations'],
                          'Unit': 'Count'
                      },
                      {
                          'MetricName': 'CriticalViolations',
                          'Value': self.statistics['critical_count'],
                          'Unit': 'Count'
                      },
                      {
                          'MetricName': 'HighViolations',
                          'Value': self.statistics['high_count'],
                          'Unit': 'Count'
                      }
                  ]
                  
                  for metric in metrics:
                      cloudwatch.put_metric_data(
                          Namespace=namespace,
                          MetricData=[{
                              'MetricName': metric['MetricName'],
                              'Value': metric['Value'],
                              'Unit': metric['Unit'],
                              'Timestamp': datetime.utcnow()
                          }]
                      )
          
          def lambda_handler(event, context):
              """Main Lambda handler function"""
              print(f"Starting security analysis with event: {json.dumps(event)}")
              
              analyzer = SecurityAnalyzer()
              
              # Determine target stacks
              target_stacks = []
              if 'TargetStacks' in event:
                  target_stacks = event['TargetStacks']
              elif 'RequestType' in event:  # CloudFormation Custom Resource
                  if event['RequestType'] == 'Delete':
                      return {
                          'statusCode': 200,
                          'body': json.dumps({'message': 'Delete request - no action needed'})
                      }
                  target_stacks = event.get('ResourceProperties', {}).get('TargetStacks', [])
              
              # Run analysis
              if target_stacks:
                  for stack in target_stacks:
                      print(f"Analyzing stack: {stack}")
                      analyzer.analyze_iam_roles(stack)
                      analyzer.analyze_s3_buckets(stack)
                      analyzer.analyze_rds_instances(stack)
                      analyzer.analyze_security_groups(stack)
              else:
                  print("Analyzing entire account")
                  analyzer.analyze_iam_roles()
                  analyzer.analyze_s3_buckets()
                  analyzer.analyze_rds_instances()
                  analyzer.analyze_security_groups()
              
              # Generate report
              report_location = analyzer.generate_report()
              
              # Send notifications
              analyzer.send_notifications()
              
              # Publish metrics
              analyzer.publish_metrics()
              
              # Prepare response
              response = {
                  'statusCode': 200,
                  'body': json.dumps({
                      'report_location': report_location,
                      'statistics': analyzer.statistics,
                      'compliance_score': analyzer._calculate_compliance_score(),
                      'risk_level': analyzer._determine_risk_level()
                  })
              }
              
              # Handle CloudFormation Custom Resource response
              if 'RequestType' in event:
                  import urllib3
                  http = urllib3.PoolManager()
                  
                  cf_response = {
                      'Status': 'SUCCESS',
                      'PhysicalResourceId': context.aws_request_id,
                      'StackId': event['StackId'],
                      'RequestId': event['RequestId'],
                      'LogicalResourceId': event['LogicalResourceId'],
                      'Data': {
                          'ReportLocation': report_location,
                          'ComplianceScore': str(analyzer._calculate_compliance_score()),
                          'RiskLevel': analyzer._determine_risk_level()
                      }
                  }
                  
                  http.request('PUT', event['ResponseURL'], 
                             body=json.dumps(cf_response).encode('utf-8'))
              
              return response
      Tags:
        - Key: Purpose
          Value: SecurityAnalysis

  # Custom Resource to trigger initial analysis
  InitialAnalysisTrigger:
    Type: AWS::CloudFormation::CustomResource
    Properties:
      ServiceToken: !GetAtt SecurityAnalysisFunction.Arn
      TargetStacks: !Ref TargetStackNames

  # EventBridge Rule for scheduled analysis
  ScheduledAnalysisRule:
    Type: AWS::Events::Rule
    Properties:
      Name: ScheduledSecurityAnalysis
      Description: Triggers periodic security compliance analysis
      ScheduleExpression: !Ref AnalysisSchedule
      State: ENABLED
      Targets:
        - Arn: !GetAtt SecurityAnalysisFunction.Arn
          Id: SecurityAnalysisTarget
          Input: !Sub
            - |
              {
                "TargetStacks": "${StacksList}"
              }
            - StacksList: !Join
                - ','
                - !Ref TargetStackNames

  # Permission for EventBridge to invoke Lambda
  ScheduledAnalysisPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref SecurityAnalysisFunction
      Action: lambda:InvokeFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt ScheduledAnalysisRule.Arn

  # CloudWatch Alarms
  CriticalViolationsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: SecurityComplianceCriticalViolations
      AlarmDescription: Alert when critical security violations are detected
      MetricName: CriticalViolations
      Namespace: SecurityCompliance
      Statistic: Maximum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 0
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref CriticalViolationsTopic
      TreatMissingData: notBreaching

  LowComplianceScoreAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: SecurityComplianceLowScore
      AlarmDescription: Alert when compliance score drops below 70%
      MetricName: ComplianceScore
      Namespace: SecurityCompliance
      Statistic: Minimum
      Period: 900
      EvaluationPeriods: 1
      Threshold: 70
      ComparisonOperator: LessThanThreshold
      AlarmActions:
        - !Ref CriticalViolationsTopic
      TreatMissingData: notBreaching

  # CloudWatch Dashboard
  ComplianceDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: SecurityComplianceDashboard
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["SecurityCompliance", "ComplianceScore", {"stat": "Average"}]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "Compliance Score",
                "yAxis": {"left": {"min": 0, "max": 100}}
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["SecurityCompliance", "CriticalViolations", {"stat": "Sum", "color": "#d9534f"}],
                  [".", "HighViolations", {"stat": "Sum", "color": "#f0ad4e"}],
                  [".", "TotalViolations", {"stat": "Sum", "color": "#333333"}]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "${AWS::Region}",
                "title": "Violations by Severity"
              }
            }
          ]
        }

Outputs:
  ComplianceReportsBucket:
    Description: S3 bucket containing compliance reports
    Value: !Ref ComplianceReportsBucket
    Export:
      Name: !Sub '${AWS::StackName}-ReportsBucket'

  ComplianceReportLocation:
    Description: Location of the initial compliance report
    Value: !GetAtt InitialAnalysisTrigger.ReportLocation

  InitialComplianceScore:
    Description: Initial compliance score percentage
    Value: !GetAtt InitialAnalysisTrigger.ComplianceScore

  InitialRiskLevel:
    Description: Initial risk level assessment
    Value: !GetAtt InitialAnalysisTrigger.RiskLevel

  SecurityAnalysisFunctionArn:
    Description: ARN of the security analysis Lambda function
    Value: !GetAtt SecurityAnalysisFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-FunctionArn'

  SNSTopicArn:
    Description: SNS topic for critical security alerts
    Value: !Ref CriticalViolationsTopic
    Export:
      Name: !Sub '${AWS::StackName}-AlertTopic'

  DashboardURL:
    Description: CloudWatch Dashboard URL
    Value: !Sub 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=SecurityComplianceDashboard'

  SecurityAnalysisLambdaRoleArn:
    Description: ARN of the Lambda execution role
    Value: !GetAtt SecurityAnalysisLambdaRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaRoleArn'

  ScheduledAnalysisRuleArn:
    Description: ARN of the EventBridge rule
    Value: !GetAtt ScheduledAnalysisRule.Arn
    Export:
      Name: !Sub '${AWS::StackName}-ScheduledRuleArn'

  CriticalViolationsAlarmArn:
    Description: ARN of the critical violations CloudWatch alarm
    Value: !GetAtt CriticalViolationsAlarm.Arn
    Export:
      Name: !Sub '${AWS::StackName}-CriticalAlarmArn'

  LowComplianceScoreAlarmArn:
    Description: ARN of the low compliance score CloudWatch alarm
    Value: !GetAtt LowComplianceScoreAlarm.Arn
    Export:
      Name: !Sub '${AWS::StackName}-ComplianceAlarmArn'

  ComplianceDashboardName:
    Description: Name of the CloudWatch Dashboard
    Value: SecurityComplianceDashboard
    Export:
      Name: !Sub '${AWS::StackName}-DashboardName'

  ComplianceReportsBucketArn:
    Description: ARN of the S3 bucket for compliance reports
    Value: !GetAtt ComplianceReportsBucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-ReportsBucketArn'

  StackRegion:
    Description: AWS Region where the stack is deployed
    Value: !Ref AWS::Region
    Export:
      Name: !Sub '${AWS::StackName}-Region'

  StackAccountId:
    Description: AWS Account ID where the stack is deployed
    Value: !Ref AWS::AccountId
    Export:
      Name: !Sub '${AWS::StackName}-AccountId'
```