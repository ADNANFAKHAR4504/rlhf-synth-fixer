```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Automated CloudFormation Stack Analysis Framework for Security, Compliance, and Quality Assurance'

Parameters:
  TargetStackName:
    Type: String
    Description: Name of the CloudFormation stack to analyze (leave empty for on-demand analysis)
    Default: ''
    AllowedPattern: '^$|^[a-zA-Z][a-zA-Z0-9-]*$'
    ConstraintDescription: Must be a valid CloudFormation stack name or empty
  
  AllowedAMIsList:
    Type: CommaDelimitedList
    Description: Comma-separated list of allowed AMI IDs
    Default: 'ami-0c02fb55731490381,ami-0947d2ba12ee1ff75'
  
  EnableS3Storage:
    Type: String
    Description: Enable storing analysis results in S3
    Default: 'true'
    AllowedValues:
      - 'true'
      - 'false'
  
  NotificationEmail:
    Type: String
    Description: Email address for analysis notifications (leave empty to disable)
    Default: ''
    AllowedPattern: '^$|^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    ConstraintDescription: Must be a valid email address or empty
  
  AnalysisTriggerMode:
    Type: String
    Description: How to trigger the analysis
    Default: 'OnDemand'
    AllowedValues:
      - 'OnDemand'
      - 'Scheduled'
      - 'OnStackChange'

Conditions:
  EnableS3StorageCondition: !Equals [!Ref EnableS3Storage, 'true']
  HasNotificationEmail: !Not [!Equals [!Ref NotificationEmail, '']]
  IsScheduledMode: !Equals [!Ref AnalysisTriggerMode, 'Scheduled']
  HasTargetStackName: !Not [!Equals [!Ref TargetStackName, '']]

Resources:
  # S3 Bucket for storing analysis reports
  AnalysisReportBucket:
    Type: AWS::S3::Bucket
    Condition: EnableS3StorageCondition
    Properties:
      BucketName: !Sub 'cfn-analysis-reports-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldReports
            Status: Enabled
            ExpirationInDays: 90
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: Production
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: IT-Security
        - Key: DataClassification
          Value: Internal

  # IAM Role for Lambda Analysis Function
  AnalysisLambdaRole:
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
        - PolicyName: StackAnalysisPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - cloudformation:DescribeStacks
                  - cloudformation:GetTemplate
                  - cloudformation:ListStackResources
                  - cloudformation:DescribeStackResources
                  - cloudformation:GetStackPolicy
                Resource: '*'
              - Effect: Allow
                Action:
                  - ec2:DescribeSecurityGroups
                  - ec2:DescribeInstances
                  - ec2:DescribeImages
                  - s3:GetBucketEncryption
                  - s3:GetBucketVersioning
                  - s3:GetLifecycleConfiguration
                  - s3:ListBucket
                  - iam:GetRole
                  - iam:GetRolePolicy
                  - iam:ListRolePolicies
                  - iam:ListAttachedRolePolicies
                  - iam:GetPolicy
                  - iam:GetPolicyVersion
                  - rds:DescribeDBInstances
                  - lambda:GetFunction
                  - lambda:GetFunctionConfiguration
                  - lambda:ListFunctions
                  - tag:GetResources
                Resource: '*'
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:PutObjectAcl
                Resource:
                  - !If
                    - EnableS3StorageCondition
                    - !Sub '${AnalysisReportBucket.Arn}/*'
                    - !Sub 'arn:aws:s3:::cfn-analysis-reports-${AWS::AccountId}-${AWS::Region}/*'
                Condition:
                  Bool:
                    'aws:SecureTransport': 'true'

  # Main Analysis Lambda Function
  StackAnalysisLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'cfn-stack-analyzer-${AWS::StackName}'
      Runtime: python3.11
      Handler: index.handler
      Role: !GetAtt AnalysisLambdaRole.Arn
      Timeout: 900
      MemorySize: 512
      Environment:
        Variables:
          ALLOWED_AMIS: !Join [',', !Ref AllowedAMIsList]
          S3_BUCKET: !If
            - EnableS3StorageCondition
            - !Ref AnalysisReportBucket
            - ''
          MANDATORY_TAGS: 'Environment,Owner,CostCenter,DataClassification'
      Code:
        ZipFile: |
          import json
          import boto3
          import re
          import os
          from datetime import datetime
          from typing import Dict, List, Any, Tuple
          import urllib3
          
          http = urllib3.PoolManager()
          
          class StackAnalyzer:
              def __init__(self, stack_name: str):
                  self.stack_name = stack_name
                  self.cf_client = boto3.client('cloudformation')
                  self.ec2_client = boto3.client('ec2')
                  self.s3_client = boto3.client('s3')
                  self.iam_client = boto3.client('iam')
                  self.rds_client = boto3.client('rds')
                  self.lambda_client = boto3.client('lambda')
                  
                  self.allowed_amis = os.environ.get('ALLOWED_AMIS', '').split(',')
                  self.mandatory_tags = os.environ.get('MANDATORY_TAGS', '').split(',')
                  self.s3_bucket = os.environ.get('S3_BUCKET', '')
                  
                  self.findings = []
                  self.score = 100
                  self.total_checks = 0
                  self.passed_checks = 0
              
              def analyze(self) -> Dict[str, Any]:
                  """Main analysis entry point"""
                  try:
                      # Get stack resources
                      stack_info = self.cf_client.describe_stacks(StackName=self.stack_name)['Stacks'][0]
                      stack_resources = self.cf_client.list_stack_resources(StackName=self.stack_name)
                      template = self.cf_client.get_template(StackName=self.stack_name)['TemplateBody']
                      
                      # Run all analysis checks
                      self.check_security_groups(stack_resources)
                      self.check_s3_buckets(stack_resources)
                      self.check_ec2_instances(stack_resources)
                      self.check_iam_policies(stack_resources)
                      self.check_rds_instances(stack_resources)
                      self.check_lambda_functions(stack_resources)
                      self.check_resource_tags(stack_resources)
                      self.check_hardcoded_values(template)
                      
                      # Calculate final score
                      if self.total_checks > 0:
                          self.score = int((self.passed_checks / self.total_checks) * 100)
                      
                      # Generate report
                      report = self.generate_report()
                      
                      # Store in S3 if enabled
                      if self.s3_bucket:
                          self.store_report_s3(report)
                      
                      return report
                      
                  except Exception as e:
                      return {
                          'Status': 'ERROR',
                          'Message': str(e),
                          'Score': 0
                      }
              
              def check_security_groups(self, stack_resources: Dict) -> None:
                  """Check for overly permissive security group rules"""
                  for resource in stack_resources.get('StackResourceSummaries', []):
                      if resource['ResourceType'] == 'AWS::EC2::SecurityGroup':
                          try:
                              sg_id = resource['PhysicalResourceId']
                              sg_info = self.ec2_client.describe_security_groups(GroupIds=[sg_id])
                              
                              for sg in sg_info['SecurityGroups']:
                                  for rule in sg.get('IpPermissions', []):
                                      for ip_range in rule.get('IpRanges', []):
                                          if ip_range.get('CidrIp') == '0.0.0.0/0':
                                              self.add_finding(
                                                  'CRITICAL',
                                                  f"Security Group {sg_id} allows unrestricted inbound access (0.0.0.0/0)",
                                                  'Remove 0.0.0.0/0 from ingress rules and use specific IP ranges',
                                                  'SecurityGroup'
                                              )
                                          else:
                                              self.passed_checks += 1
                              self.total_checks += 1
                          except Exception as e:
                              self.add_finding('ERROR', f"Failed to check security group: {str(e)}", '', 'SecurityGroup')
              
              def check_s3_buckets(self, stack_resources: Dict) -> None:
                  """Check S3 bucket security configurations"""
                  for resource in stack_resources.get('StackResourceSummaries', []):
                      if resource['ResourceType'] == 'AWS::S3::Bucket':
                          try:
                              bucket_name = resource['PhysicalResourceId']
                              
                              # Check encryption
                              try:
                                  encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
                                  self.passed_checks += 1
                              except self.s3_client.exceptions.ServerSideEncryptionConfigurationNotFoundError:
                                  self.add_finding(
                                      'HIGH',
                                      f"S3 bucket {bucket_name} does not have encryption enabled",
                                      'Enable default encryption for the bucket',
                                      'S3Bucket'
                                  )
                              self.total_checks += 1
                              
                              # Check versioning
                              versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
                              if versioning.get('Status') != 'Enabled':
                                  self.add_finding(
                                      'MEDIUM',
                                      f"S3 bucket {bucket_name} does not have versioning enabled",
                                      'Enable versioning for data protection and recovery',
                                      'S3Bucket'
                                  )
                              else:
                                  self.passed_checks += 1
                              self.total_checks += 1
                              
                              # Check lifecycle policies
                              try:
                                  lifecycle = self.s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)
                                  if lifecycle.get('Rules'):
                                      self.passed_checks += 1
                                  else:
                                      raise Exception("No rules")
                              except:
                                  self.add_finding(
                                      'LOW',
                                      f"S3 bucket {bucket_name} does not have lifecycle policies",
                                      'Configure lifecycle policies for cost optimization',
                                      'S3Bucket'
                                  )
                              self.total_checks += 1
                              
                          except Exception as e:
                              self.add_finding('ERROR', f"Failed to check S3 bucket: {str(e)}", '', 'S3Bucket')
              
              def check_ec2_instances(self, stack_resources: Dict) -> None:
                  """Check EC2 instances for deprecated AMIs"""
                  for resource in stack_resources.get('StackResourceSummaries', []):
                      if resource['ResourceType'] == 'AWS::EC2::Instance':
                          try:
                              instance_id = resource['PhysicalResourceId']
                              instance_info = self.ec2_client.describe_instances(InstanceIds=[instance_id])
                              
                              for reservation in instance_info['Reservations']:
                                  for instance in reservation['Instances']:
                                      ami_id = instance['ImageId']
                                      if ami_id not in self.allowed_amis:
                                          self.add_finding(
                                              'HIGH',
                                              f"EC2 instance {instance_id} uses non-approved AMI: {ami_id}",
                                              f"Use one of the approved AMIs: {', '.join(self.allowed_amis)}",
                                              'EC2Instance'
                                          )
                                      else:
                                          self.passed_checks += 1
                              self.total_checks += 1
                              
                          except Exception as e:
                              self.add_finding('ERROR', f"Failed to check EC2 instance: {str(e)}", '', 'EC2Instance')
              
              def check_iam_policies(self, stack_resources: Dict) -> None:
                  """Check IAM policies for overly permissive access"""
                  for resource in stack_resources.get('StackResourceSummaries', []):
                      if resource['ResourceType'] in ['AWS::IAM::Role', 'AWS::IAM::Policy']:
                          try:
                              if resource['ResourceType'] == 'AWS::IAM::Role':
                                  role_name = resource['PhysicalResourceId']
                                  
                                  # Check inline policies
                                  inline_policies = self.iam_client.list_role_policies(RoleName=role_name)
                                  for policy_name in inline_policies.get('PolicyNames', []):
                                      policy_doc = self.iam_client.get_role_policy(
                                          RoleName=role_name,
                                          PolicyName=policy_name
                                      )['PolicyDocument']
                                      self.analyze_policy_document(policy_doc, f"Role {role_name}")
                                  
                                  # Check attached policies
                                  attached_policies = self.iam_client.list_attached_role_policies(RoleName=role_name)
                                  for policy in attached_policies.get('AttachedPolicies', []):
                                      policy_arn = policy['PolicyArn']
                                      if not policy_arn.startswith('arn:aws:iam::aws:policy/'):
                                          policy_version = self.iam_client.get_policy(PolicyArn=policy_arn)
                                          default_version = policy_version['Policy']['DefaultVersionId']
                                          policy_doc = self.iam_client.get_policy_version(
                                              PolicyArn=policy_arn,
                                              VersionId=default_version
                                          )['PolicyVersion']['Document']
                                          self.analyze_policy_document(policy_doc, f"Policy {policy_arn}")
                              
                          except Exception as e:
                              self.add_finding('ERROR', f"Failed to check IAM policy: {str(e)}", '', 'IAMPolicy')
              
              def analyze_policy_document(self, policy_doc: Dict, resource_name: str) -> None:
                  """Analyze IAM policy document for issues"""
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
                          
                          # Check for wildcard actions
                          if '*' in actions or any('*' in action for action in actions):
                              self.add_finding(
                                  'CRITICAL',
                                  f"{resource_name} has wildcard (*) actions",
                                  'Use specific actions instead of wildcards',
                                  'IAMPolicy'
                              )
                          else:
                              self.passed_checks += 1
                          
                          # Check for wildcard resources
                          if '*' in resources:
                              self.add_finding(
                                  'HIGH',
                                  f"{resource_name} has wildcard (*) resources",
                                  'Restrict resources to specific ARNs when possible',
                                  'IAMPolicy'
                              )
                          else:
                              self.passed_checks += 1
                  
                  self.total_checks += 2
              
              def check_rds_instances(self, stack_resources: Dict) -> None:
                  """Check RDS instances for backup and Multi-AZ configuration"""
                  for resource in stack_resources.get('StackResourceSummaries', []):
                      if resource['ResourceType'] == 'AWS::RDS::DBInstance':
                          try:
                              db_instance_id = resource['PhysicalResourceId']
                              db_info = self.rds_client.describe_db_instances(DBInstanceIdentifier=db_instance_id)
                              
                              for db in db_info['DBInstances']:
                                  # Check automated backups
                                  if db['BackupRetentionPeriod'] == 0:
                                      self.add_finding(
                                          'HIGH',
                                          f"RDS instance {db_instance_id} does not have automated backups enabled",
                                          'Set BackupRetentionPeriod to at least 7 days',
                                          'RDSInstance'
                                      )
                                  else:
                                      self.passed_checks += 1
                                  self.total_checks += 1
                                  
                                  # Check Multi-AZ
                                  if not db.get('MultiAZ', False):
                                      self.add_finding(
                                          'MEDIUM',
                                          f"RDS instance {db_instance_id} does not have Multi-AZ enabled",
                                          'Enable Multi-AZ for high availability',
                                          'RDSInstance'
                                      )
                                  else:
                                      self.passed_checks += 1
                                  self.total_checks += 1
                                  
                          except Exception as e:
                              self.add_finding('ERROR', f"Failed to check RDS instance: {str(e)}", '', 'RDSInstance')
              
              def check_lambda_functions(self, stack_resources: Dict) -> None:
                  """Check Lambda functions for potential secrets in environment variables"""
                  secret_patterns = [
                      r'password',
                      r'secret',
                      r'api_key',
                      r'apikey',
                      r'access_key',
                      r'private_key',
                      r'token'
                  ]
                  
                  for resource in stack_resources.get('StackResourceSummaries', []):
                      if resource['ResourceType'] == 'AWS::Lambda::Function':
                          try:
                              function_name = resource['PhysicalResourceId']
                              function_config = self.lambda_client.get_function_configuration(FunctionName=function_name)
                              
                              env_vars = function_config.get('Environment', {}).get('Variables', {})
                              found_secrets = False
                              
                              for key, value in env_vars.items():
                                  for pattern in secret_patterns:
                                      if re.search(pattern, key.lower()):
                                          self.add_finding(
                                              'CRITICAL',
                                              f"Lambda function {function_name} may have secrets in environment variable: {key}",
                                              'Use AWS Secrets Manager or Parameter Store for sensitive data',
                                              'LambdaFunction'
                                          )
                                          found_secrets = True
                                          break
                              
                              if not found_secrets:
                                  self.passed_checks += 1
                              self.total_checks += 1
                              
                          except Exception as e:
                              self.add_finding('ERROR', f"Failed to check Lambda function: {str(e)}", '', 'LambdaFunction')
              
              def check_resource_tags(self, stack_resources: Dict) -> None:
                  """Check if resources have mandatory tags"""
                  for resource in stack_resources.get('StackResourceSummaries', []):
                      try:
                          resource_arn = self.get_resource_arn(resource)
                          if resource_arn:
                              # Get tags for the resource
                              tags_response = boto3.client('resourcegroupstaggingapi').get_resources(
                                  ResourceARNList=[resource_arn]
                              )
                              
                              if tags_response['ResourceTagMappingList']:
                                  tags = tags_response['ResourceTagMappingList'][0].get('Tags', [])
                                  tag_keys = [tag['Key'] for tag in tags]
                                  
                                  missing_tags = []
                                  for mandatory_tag in self.mandatory_tags:
                                      if mandatory_tag not in tag_keys:
                                          missing_tags.append(mandatory_tag)
                                  
                                  if missing_tags:
                                      self.add_finding(
                                          'MEDIUM',
                                          f"Resource {resource['LogicalResourceId']} is missing mandatory tags: {', '.join(missing_tags)}",
                                          'Add all mandatory tags to the resource',
                                          'ResourceTags'
                                      )
                                  else:
                                      self.passed_checks += 1
                                  self.total_checks += 1
                              
                      except Exception as e:
                          # Some resources might not support tagging
                          pass
              
              def get_resource_arn(self, resource: Dict) -> str:
                  """Generate ARN for a resource"""
                  resource_type = resource['ResourceType']
                  physical_id = resource['PhysicalResourceId']
                  
                  # Map resource types to ARN patterns
                  arn_patterns = {
                      'AWS::EC2::Instance': f"arn:aws:ec2:{boto3.Session().region_name}:{boto3.client('sts').get_caller_identity()['Account']}:instance/{physical_id}",
                      'AWS::S3::Bucket': f"arn:aws:s3:::{physical_id}",
                      'AWS::Lambda::Function': f"arn:aws:lambda:{boto3.Session().region_name}:{boto3.client('sts').get_caller_identity()['Account']}:function:{physical_id}",
                      'AWS::RDS::DBInstance': f"arn:aws:rds:{boto3.Session().region_name}:{boto3.client('sts').get_caller_identity()['Account']}:db:{physical_id}"
                  }
                  
                  return arn_patterns.get(resource_type, '')
              
              def check_hardcoded_values(self, template: Any) -> None:
                  """Check for hardcoded values that should be parameters"""
                  if isinstance(template, str):
                      template = json.loads(template)
                  
                  hardcoded_patterns = {
                      'CIDR': r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/\d{1,2}',
                      'InstanceType': r't[23]\.(micro|small|medium|large)|m[345]\.(large|xlarge|2xlarge)',
                      'AMI': r'ami-[a-f0-9]{8,17}'
                  }
                  
                  resources = template.get('Resources', {})
                  parameters = template.get('Parameters', {})
                  
                  for resource_name, resource_config in resources.items():
                      resource_str = json.dumps(resource_config)
                      
                      for value_type, pattern in hardcoded_patterns.items():
                          matches = re.findall(pattern, resource_str)
                          if matches:
                              # Check if these values are referenced from parameters
                              is_parameterized = False
                              for param_name in parameters:
                                  if f"!Ref {param_name}" in resource_str or f"Ref: {param_name}" in resource_str:
                                      is_parameterized = True
                                      break
                              
                              if not is_parameterized:
                                  self.add_finding(
                                      'LOW',
                                      f"Resource {resource_name} has hardcoded {value_type}: {matches[0]}",
                                      f"Use a parameter for {value_type} values",
                                      'HardcodedValues'
                                  )
                              else:
                                  self.passed_checks += 1
                              self.total_checks += 1
              
              def add_finding(self, severity: str, description: str, remediation: str, category: str) -> None:
                  """Add a finding to the report"""
                  self.findings.append({
                      'Severity': severity,
                      'Description': description,
                      'Remediation': remediation,
                      'Category': category,
                      'Timestamp': datetime.utcnow().isoformat()
                  })
                  
                  # Deduct points based on severity
                  severity_points = {
                      'CRITICAL': 20,
                      'HIGH': 10,
                      'MEDIUM': 5,
                      'LOW': 2,
                      'ERROR': 0
                  }
                  self.score = max(0, self.score - severity_points.get(severity, 0))
              
              def generate_report(self) -> Dict[str, Any]:
                  """Generate the final analysis report"""
                  report = {
                      'StackName': self.stack_name,
                      'AnalysisTimestamp': datetime.utcnow().isoformat(),
                      'QualityScore': self.score,
                      'TotalChecks': self.total_checks,
                      'PassedChecks': self.passed_checks,
                      'FailedChecks': self.total_checks - self.passed_checks,
                      'Findings': self.findings,
                      'Summary': {
                          'Critical': len([f for f in self.findings if f['Severity'] == 'CRITICAL']),
                          'High': len([f for f in self.findings if f['Severity'] == 'HIGH']),
                          'Medium': len([f for f in self.findings if f['Severity'] == 'MEDIUM']),
                          'Low': len([f for f in self.findings if f['Severity'] == 'LOW']),
                          'Errors': len([f for f in self.findings if f['Severity'] == 'ERROR'])
                      },
                      'ComplianceStatus': 'PASS' if self.score >= 80 else 'FAIL',
                      'RemediationPriority': self.get_remediation_priority()
                  }
                  
                  return report
              
              def get_remediation_priority(self) -> List[str]:
                  """Get prioritized list of remediation actions"""
                  priority = []
                  
                  # Group findings by severity
                  for severity in ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']:
                      severity_findings = [f for f in self.findings if f['Severity'] == severity]
                      if severity_findings:
                          priority.append(f"{severity} Priority ({len(severity_findings)} issues):")
                          for finding in severity_findings[:3]:  # Top 3 for each severity
                              priority.append(f"  - {finding['Description'][:100]}...")
                  
                  return priority
              
              def store_report_s3(self, report: Dict[str, Any]) -> None:
                  """Store the report in S3"""
                  if self.s3_bucket:
                      try:
                          key = f"analysis-reports/{self.stack_name}/{datetime.utcnow().strftime('%Y-%m-%d-%H-%M-%S')}.json"
                          self.s3_client.put_object(
                              Bucket=self.s3_bucket,
                              Key=key,
                              Body=json.dumps(report, indent=2),
                              ContentType='application/json',
                              ServerSideEncryption='AES256'
                          )
                      except Exception as e:
                          print(f"Failed to store report in S3: {str(e)}")
          
          def handler(event, context):
              """Lambda handler for CloudFormation custom resource"""
              response_data = {}
              physical_resource_id = event.get('PhysicalResourceId', 'stack-analyzer')
              
              try:
                  if event['RequestType'] in ['Create', 'Update']:
                      stack_name = event['ResourceProperties'].get('TargetStackName', '')
                      
                      if not stack_name:
                          raise ValueError("TargetStackName is required")
                      
                      analyzer = StackAnalyzer(stack_name)
                      report = analyzer.analyze()
                      
                      # Prepare response data
                      response_data = {
                          'QualityScore': str(report['QualityScore']),
                          'ComplianceStatus': report['ComplianceStatus'],
                          'TotalFindings': str(len(report['Findings'])),
                          'CriticalFindings': str(report['Summary']['Critical']),
                          'HighFindings': str(report['Summary']['High']),
                          'MediumFindings': str(report['Summary']['Medium']),
                          'LowFindings': str(report['Summary']['Low']),
                          'Report': json.dumps(report)
                      }
                      
                      send_response(event, context, 'SUCCESS', response_data, physical_resource_id)
                  
                  elif event['RequestType'] == 'Delete':
                      send_response(event, context, 'SUCCESS', {}, physical_resource_id)
                  
              except Exception as e:
                  print(f"Error: {str(e)}")
                  send_response(event, context, 'FAILED', {'Error': str(e)}, physical_resource_id)
          
          def send_response(event, context, response_status, response_data, physical_resource_id):
              """Send response to CloudFormation"""
              response_url = event['ResponseURL']
              
              response_body = {
                  'Status': response_status,
                  'Reason': f"See CloudWatch Log Stream: {context.log_stream_name}",
                  'PhysicalResourceId': physical_resource_id,
                  'StackId': event['StackId'],
                  'RequestId': event['RequestId'],
                  'LogicalResourceId': event['LogicalResourceId'],
                  'Data': response_data
              }
              
              json_response_body = json.dumps(response_body)
              
              headers = {
                  'content-type': '',
                  'content-length': str(len(json_response_body))
              }
              
              try:
                  response = http.request(
                      'PUT',
                      response_url,
                      body=json_response_body.encode('utf-8'),
                      headers=headers
                  )
                  print(f"Response status: {response.status}")
              except Exception as e:
                  print(f"Failed to send response: {str(e)}")

  # Custom Resource to trigger analysis (only when TargetStackName is provided)
  StackAnalysis:
    Type: Custom::StackAnalysis
    Condition: HasTargetStackName
    Properties:
      ServiceToken: !GetAtt StackAnalysisLambda.Arn
      TargetStackName: !Ref TargetStackName
      AllowedAMIs: !Join [',', !Ref AllowedAMIsList]
      Timestamp: !Ref AWS::StackName

  # EventBridge Rule for scheduled analysis (optional)
  ScheduledAnalysisRule:
    Type: AWS::Events::Rule
    Condition: IsScheduledMode
    Properties:
      Description: Scheduled CloudFormation stack analysis
      ScheduleExpression: rate(1 day)
      State: ENABLED
      Targets:
        - Arn: !GetAtt StackAnalysisLambda.Arn
          Id: ScheduledAnalysis
          Input: !Sub |
            {
              "RequestType": "Update",
              "ResourceProperties": {
                "TargetStackName": "${TargetStackName}"
              }
            }

  # Permission for EventBridge to invoke Lambda
  ScheduledAnalysisPermission:
    Type: AWS::Lambda::Permission
    Condition: IsScheduledMode
    Properties:
      FunctionName: !Ref StackAnalysisLambda
      Action: lambda:InvokeFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt ScheduledAnalysisRule.Arn

  # SNS Topic for notifications (optional)
  AnalysisNotificationTopic:
    Type: AWS::SNS::Topic
    Condition: HasNotificationEmail
    Properties:
      DisplayName: CloudFormation Stack Analysis Notifications

  # SNS Subscription (separate resource to handle conditional email)
  AnalysisNotificationSubscription:
    Type: AWS::SNS::Subscription
    Condition: HasNotificationEmail
    Properties:
      TopicArn: !Ref AnalysisNotificationTopic
      Protocol: email
      Endpoint: !Ref NotificationEmail

  # CloudWatch Dashboard
  AnalysisDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub 'cfn-analysis-${AWS::StackName}'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/Lambda", "Invocations", {"stat": "Sum", "label": "Analysis Runs"}],
                  [".", "Errors", {"stat": "Sum", "label": "Analysis Errors"}],
                  [".", "Duration", {"stat": "Average", "label": "Analysis Duration"}]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "Analysis Metrics",
                "yAxis": {
                  "left": {
                    "min": 0
                  }
                }
              }
            }
          ]
        }

Outputs:
  # Analysis Results Outputs
  QualityScore:
    Description: Infrastructure quality score (0-100)
    Condition: HasTargetStackName
    Value: !GetAtt StackAnalysis.QualityScore
    Export:
      Name: !Sub '${AWS::StackName}-QualityScore'

  ComplianceStatus:
    Description: Overall compliance status
    Condition: HasTargetStackName
    Value: !GetAtt StackAnalysis.ComplianceStatus
    Export:
      Name: !Sub '${AWS::StackName}-ComplianceStatus'

  TotalFindings:
    Description: Total number of findings
    Condition: HasTargetStackName
    Value: !GetAtt StackAnalysis.TotalFindings
    Export:
      Name: !Sub '${AWS::StackName}-TotalFindings'

  CriticalFindings:
    Description: Number of critical findings
    Condition: HasTargetStackName
    Value: !GetAtt StackAnalysis.CriticalFindings
    Export:
      Name: !Sub '${AWS::StackName}-CriticalFindings'

  HighFindings:
    Description: Number of high severity findings
    Condition: HasTargetStackName
    Value: !GetAtt StackAnalysis.HighFindings
    Export:
      Name: !Sub '${AWS::StackName}-HighFindings'

  MediumFindings:
    Description: Number of medium severity findings
    Condition: HasTargetStackName
    Value: !GetAtt StackAnalysis.MediumFindings
    Export:
      Name: !Sub '${AWS::StackName}-MediumFindings'

  LowFindings:
    Description: Number of low severity findings
    Condition: HasTargetStackName
    Value: !GetAtt StackAnalysis.LowFindings
    Export:
      Name: !Sub '${AWS::StackName}-LowFindings'

  RemediationGuidance:
    Description: Analysis report with remediation guidance
    Condition: HasTargetStackName
    Value: !GetAtt StackAnalysis.Report
    Export:
      Name: !Sub '${AWS::StackName}-RemediationGuidance'

  # S3 Bucket Outputs
  AnalysisReportBucketName:
    Description: S3 bucket containing analysis reports
    Condition: EnableS3StorageCondition
    Value: !Ref AnalysisReportBucket
    Export:
      Name: !Sub '${AWS::StackName}-AnalysisReportBucketName'

  AnalysisReportBucketArn:
    Description: ARN of the analysis report bucket
    Condition: EnableS3StorageCondition
    Value: !GetAtt AnalysisReportBucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-AnalysisReportBucketArn'

  AnalysisReportBucketDomainName:
    Description: Domain name of the analysis report bucket
    Condition: EnableS3StorageCondition
    Value: !GetAtt AnalysisReportBucket.DomainName
    Export:
      Name: !Sub '${AWS::StackName}-AnalysisReportBucketDomainName'

  AnalysisReportBucketRegionalDomainName:
    Description: Regional domain name of the analysis report bucket
    Condition: EnableS3StorageCondition
    Value: !GetAtt AnalysisReportBucket.RegionalDomainName
    Export:
      Name: !Sub '${AWS::StackName}-AnalysisReportBucketRegionalDomainName'

  # Lambda Function Outputs
  AnalysisFunctionArn:
    Description: ARN of the analysis Lambda function
    Value: !GetAtt StackAnalysisLambda.Arn
    Export:
      Name: !Sub '${AWS::StackName}-AnalysisFunctionArn'

  AnalysisFunctionName:
    Description: Name of the analysis Lambda function
    Value: !Ref StackAnalysisLambda
    Export:
      Name: !Sub '${AWS::StackName}-AnalysisFunctionName'

  # IAM Role Outputs
  AnalysisLambdaRoleArn:
    Description: ARN of the Lambda execution role
    Value: !GetAtt AnalysisLambdaRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-AnalysisLambdaRoleArn'

  AnalysisLambdaRoleName:
    Description: Name of the Lambda execution role
    Value: !Ref AnalysisLambdaRole
    Export:
      Name: !Sub '${AWS::StackName}-AnalysisLambdaRoleName'

  # SNS Topic Outputs
  AnalysisNotificationTopicArn:
    Description: ARN of the SNS notification topic
    Condition: HasNotificationEmail
    Value: !Ref AnalysisNotificationTopic
    Export:
      Name: !Sub '${AWS::StackName}-AnalysisNotificationTopicArn'

  AnalysisNotificationTopicName:
    Description: Name of the SNS notification topic
    Condition: HasNotificationEmail
    Value: !GetAtt AnalysisNotificationTopic.TopicName
    Export:
      Name: !Sub '${AWS::StackName}-AnalysisNotificationTopicName'

  # EventBridge Rule Outputs
  ScheduledAnalysisRuleArn:
    Description: ARN of the EventBridge scheduled analysis rule
    Condition: IsScheduledMode
    Value: !GetAtt ScheduledAnalysisRule.Arn
    Export:
      Name: !Sub '${AWS::StackName}-ScheduledAnalysisRuleArn'

  ScheduledAnalysisRuleName:
    Description: Name of the EventBridge scheduled analysis rule
    Condition: IsScheduledMode
    Value: !Ref ScheduledAnalysisRule
    Export:
      Name: !Sub '${AWS::StackName}-ScheduledAnalysisRuleName'

  # CloudWatch Dashboard Outputs
  DashboardName:
    Description: Name of the CloudWatch Dashboard
    Value: !Ref AnalysisDashboard
    Export:
      Name: !Sub '${AWS::StackName}-DashboardName'

  DashboardURL:
    Description: CloudWatch Dashboard URL
    Value: !Sub 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=cfn-analysis-${AWS::StackName}'
    Export:
      Name: !Sub '${AWS::StackName}-DashboardURL'

  # Stack Information Outputs
  StackName:
    Description: Name of this CloudFormation stack
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '${AWS::StackName}-StackName'

  StackId:
    Description: ID of this CloudFormation stack
    Value: !Ref AWS::StackId
    Export:
      Name: !Sub '${AWS::StackName}-StackId'

  StackRegion:
    Description: AWS region where the stack is deployed
    Value: !Ref AWS::Region
    Export:
      Name: !Sub '${AWS::StackName}-StackRegion'

  AccountId:
    Description: AWS account ID where the stack is deployed
    Value: !Ref AWS::AccountId
    Export:
      Name: !Sub '${AWS::StackName}-AccountId'

  # Parameter Values Outputs
  TargetStackNameParam:
    Description: Target stack name parameter value (only exported when stack name is provided)
    Condition: HasTargetStackName
    Value: !Ref TargetStackName

  EnableS3StorageParam:
    Description: Enable S3 storage parameter value
    Value: !Ref EnableS3Storage
    Export:
      Name: !Sub '${AWS::StackName}-EnableS3StorageParam'

  NotificationEmailParam:
    Description: Notification email parameter value (only exported when email is provided)
    Condition: HasNotificationEmail
    Value: !Ref NotificationEmail

  AnalysisTriggerModeParam:
    Description: Analysis trigger mode parameter value
    Value: !Ref AnalysisTriggerMode
    Export:
      Name: !Sub '${AWS::StackName}-AnalysisTriggerModeParam'

  AllowedAMIsListParam:
    Description: Allowed AMIs list parameter value
    Value: !Join [',', !Ref AllowedAMIsList]
    Export:
      Name: !Sub '${AWS::StackName}-AllowedAMIsListParam'
```