Reasoning Trace
There's a circular dependency issue in the CloudFormation template. Let me analyze the dependencies:

ThreatMonitoringLambdaRole references LogsKmsKey and SnsKmsKey in its policy
LogsKmsKey references ThreatMonitoringLambdaRole in its key policy
SnsKmsKey references ThreatMonitoringLambdaRole in its key policy
ThreatAlertTopic references SnsKmsKey
ThreatMonitoringLambda references ThreatMonitoringLambdaRole and ThreatAlertTopic
WafLogsBucket references LogsKmsKey and ThreatMonitoringLambda (in notification configuration)
WafLogsBucketPolicy references WafLogsBucket and LogsReadRole
LogsReadRole references WafLogsBucket and LogsKmsKey
LambdaInvokePermission references ThreatMonitoringLambda and WafLogsBucket
The circular dependencies are:

LogsKmsKey -> ThreatMonitoringLambdaRole -> LogsKmsKey
SnsKmsKey -> ThreatMonitoringLambdaRole -> SnsKmsKey
LogsReadRole -> WafLogsBucket -> LogsKmsKey -> LogsReadRole
To fix this, I need to:

Remove the references to ThreatMonitoringLambdaRole and LogsReadRole from the KMS key policies initially
Create separate policies or use AWS::IAM::Policy resources that can be attached after the roles are created
Or restructure the S3 bucket notification to avoid the circular dependency
I'll explore alternative strategies for decoupling these interconnected resources. The key is to break the circular references by creating resources with minimal initial dependencies and then establishing connections through separate policy attachments. This approach requires careful sequencing of resource creation and policy assignments to ensure all components can reference each other without creating unresolvable circular dependencies.

The most promising method involves creating base resources with minimal permissions, then gradually expanding their access through separate policy mechanisms. By removing direct cross-references during initial resource creation, we can establish a more flexible infrastructure deployment strategy that avoids CloudFormation's complex dependency challenges.

I'll focus on decoupling resource configurations by separating KMS key policies, IAM role permissions, and S3 notification setups into independent, modular components. This approach allows for cleaner, more manageable infrastructure-as-code implementation.

The key steps involve strategically granting permissions through IAM policies rather than embedding specific ARNs directly in resource configurations, which reduces potential circular dependency risks during stack creation.

Answer
AWSTemplateFormatVersion: '2010-09-09' Description: 'Secure web application environment with WAF, threat monitoring, and encrypted logging'

Parameters: Environment: Type: String Default: 'prod' Description: 'Environment name' Owner: Type: String Default: 'PlatformTeam' Description: 'Owner tag value' VpcCidr: Type: String Default: '10.0.0.0/16' Description: 'VPC CIDR block' PublicSubnetACidr: Type: String Default: '10.0.1.0/24' Description: 'Public subnet A CIDR' PublicSubnetBCidr: Type: String Default: '10.0.2.0/24' Description: 'Public subnet B CIDR' PublicSubnetCCidr: Type: String Default: '10.0.3.0/24' Description: 'Public subnet C CIDR' PrivateSubnetACidr: Type: String Default: '10.0.11.0/24' Description: 'Private subnet A CIDR' PrivateSubnetBCidr: Type: String Default: '10.0.12.0/24' Description: 'Private subnet B CIDR' PrivateSubnetCCidr: Type: String Default: '10.0.13.0/24' Description: 'Private subnet C CIDR' AzA: Type: String Default: 'us-east-1a' Description: 'Availability Zone A' AzB: Type: String Default: 'us-east-1b' Description: 'Availability Zone B' AzC: Type: String Default: 'us-east-1c' Description: 'Availability Zone C' AlertEmail: Type: String Default: '' Description: 'Email for threat alerts (optional)'

Conditions: HasAlertEmail: !Not [!Equals [!Ref AlertEmail, '']]

Resources: ProdVPC: Type: AWS::EC2::VPC Properties: CidrBlock: !Ref VpcCidr EnableDnsHostnames: true EnableDnsSupport: true Tags: - Key: Name Value: !Sub 'VPC-{Environment}' - Key: Owner Value: !Ref Owner - Key: Environment Value: !Ref Environment

InternetGateway: Type: AWS::EC2::InternetGateway Properties: Tags: - Key: Name Value: !Sub 'IGW-{Environment}' - Key: Owner Value: !Ref Owner - Key: Environment Value: !Ref Environment

AttachGateway: Type: AWS::EC2::VPCGatewayAttachment Properties: VpcId: !Ref ProdVPC InternetGatewayId: !Ref InternetGateway

PublicSubnetA: Type: AWS::EC2::Subnet Properties: VpcId: !Ref ProdVPC CidrBlock: !Ref PublicSubnetACidr AvailabilityZone: !Ref AzA MapPublicIpOnLaunch: true Tags: - Key: Name Value: !Sub 'Subnet-PublicA-${Environment}' - Key: Owner Value: !Ref Owner - Key: Environment Value: !Ref Environment

PublicSubnetB: Type: AWS::EC2::Subnet Properties: VpcId: !Ref ProdVPC CidrBlock: !Ref PublicSubnetBCidr AvailabilityZone: !Ref AzB MapPublicIpOnLaunch: true Tags: - Key: Name Value: !Sub 'Subnet-PublicB-${Environment}' - Key: Owner Value: !Ref Owner - Key: Environment Value: !Ref Environment

PublicSubnetC: Type: AWS::EC2::Subnet Properties: VpcId: !Ref ProdVPC CidrBlock: !Ref PublicSubnetCCidr AvailabilityZone: !Ref AzC MapPublicIpOnLaunch: true Tags: - Key: Name Value: !Sub 'Subnet-PublicC-${Environment}' - Key: Owner Value: !Ref Owner - Key: Environment Value: !Ref Environment

PrivateSubnetA: Type: AWS::EC2::Subnet Properties: VpcId: !Ref ProdVPC CidrBlock: !Ref PrivateSubnetACidr AvailabilityZone: !Ref AzA Tags: - Key: Name Value: !Sub 'Subnet-PrivateA-${Environment}' - Key: Owner Value: !Ref Owner - Key: Environment Value: !Ref Environment

PrivateSubnetB: Type: AWS::EC2::Subnet Properties: VpcId: !Ref ProdVPC CidrBlock: !Ref PrivateSubnetBCidr AvailabilityZone: !Ref AzB Tags: - Key: Name Value: !Sub 'Subnet-PrivateB-${Environment}' - Key: Owner Value: !Ref Owner - Key: Environment Value: !Ref Environment

PrivateSubnetC: Type: AWS::EC2::Subnet Properties: VpcId: !Ref ProdVPC CidrBlock: !Ref PrivateSubnetCCidr AvailabilityZone: !Ref AzC Tags: - Key: Name Value: !Sub 'Subnet-PrivateC-${Environment}' - Key: Owner Value: !Ref Owner - Key: Environment Value: !Ref Environment

NatGatewayAEIP: Type: AWS::EC2::EIP DependsOn: AttachGateway Properties: Domain: vpc Tags: - Key: Name Value: !Sub 'EIP-NatA-${Environment}' - Key: Owner Value: !Ref Owner - Key: Environment Value: !Ref Environment

NatGatewayBEIP: Type: AWS::EC2::EIP DependsOn: AttachGateway Properties: Domain: vpc Tags: - Key: Name Value: !Sub 'EIP-NatB-${Environment}' - Key: Owner Value: !Ref Owner - Key: Environment Value: !Ref Environment

NatGatewayCEIP: Type: AWS::EC2::EIP DependsOn: AttachGateway Properties: Domain: vpc Tags: - Key: Name Value: !Sub 'EIP-NatC-${Environment}' - Key: Owner Value: !Ref Owner - Key: Environment Value: !Ref Environment

NatGatewayA: Type: AWS::EC2::NatGateway Properties: AllocationId: !GetAtt NatGatewayAEIP.AllocationId SubnetId: !Ref PublicSubnetA Tags: - Key: Name Value: !Sub 'NAT-GatewayA-${Environment}' - Key: Owner Value: !Ref Owner - Key: Environment Value: !Ref Environment

NatGatewayB: Type: AWS::EC2::NatGateway Properties: AllocationId: !GetAtt NatGatewayBEIP.AllocationId SubnetId: !Ref PublicSubnetB Tags: - Key: Name Value: !Sub 'NAT-GatewayB-${Environment}' - Key: Owner Value: !Ref Owner - Key: Environment Value: !Ref Environment

NatGatewayC: Type: AWS::EC2::NatGateway Properties: AllocationId: !GetAtt NatGatewayCEIP.AllocationId SubnetId: !Ref PublicSubnetC Tags: - Key: Name Value: !Sub 'NAT-GatewayC-${Environment}' - Key: Owner Value: !Ref Owner - Key: Environment Value: !Ref Environment

PublicRouteTable: Type: AWS::EC2::RouteTable Properties: VpcId: !Ref ProdVPC Tags: - Key: Name Value: !Sub 'RouteTable-Public-${Environment}' - Key: Owner Value: !Ref Owner - Key: Environment Value: !Ref Environment

PublicRoute: Type: AWS::EC2::Route DependsOn: AttachGateway Properties: RouteTableId: !Ref PublicRouteTable DestinationCidrBlock: '0.0.0.0/0' GatewayId: !Ref InternetGateway

PublicSubnetARouteTableAssociation: Type: AWS::EC2::SubnetRouteTableAssociation Properties: SubnetId: !Ref PublicSubnetA RouteTableId: !Ref PublicRouteTable

PublicSubnetBRouteTableAssociation: Type: AWS::EC2::SubnetRouteTableAssociation Properties: SubnetId: !Ref PublicSubnetB RouteTableId: !Ref PublicRouteTable

PublicSubnetCRouteTableAssociation: Type: AWS::EC2::SubnetRouteTableAssociation Properties: SubnetId: !Ref PublicSubnetC RouteTableId: !Ref PublicRouteTable

PrivateRouteTableA: Type: AWS::EC2::RouteTable Properties: VpcId: !Ref ProdVPC Tags: - Key: Name Value: !Sub 'RouteTable-PrivateA-${Environment}' - Key: Owner Value: !Ref Owner - Key: Environment Value: !Ref Environment

PrivateRouteTableB: Type: AWS::EC2::RouteTable Properties: VpcId: !Ref ProdVPC Tags: - Key: Name Value: !Sub 'RouteTable-PrivateB-${Environment}' - Key: Owner Value: !Ref Owner - Key: Environment Value: !Ref Environment

PrivateRouteTableC: Type: AWS::EC2::RouteTable Properties: VpcId: !Ref ProdVPC Tags: - Key: Name Value: !Sub 'RouteTable-PrivateC-${Environment}' - Key: Owner Value: !Ref Owner - Key: Environment Value: !Ref Environment

PrivateRouteA: Type: AWS::EC2::Route Properties: RouteTableId: !Ref PrivateRouteTableA DestinationCidrBlock: '0.0.0.0/0' NatGatewayId: !Ref NatGatewayA

PrivateRouteB: Type: AWS::EC2::Route Properties: RouteTableId: !Ref PrivateRouteTableB DestinationCidrBlock: '0.0.0.0/0' NatGatewayId: !Ref NatGatewayB

PrivateRouteC: Type: AWS::EC2::Route Properties: RouteTableId: !Ref PrivateRouteTableC DestinationCidrBlock: '0.0.0.0/0' NatGatewayId: !Ref NatGatewayC

PrivateSubnetARouteTableAssociation: Type: AWS::EC2::SubnetRouteTableAssociation Properties: SubnetId: !Ref PrivateSubnetA RouteTableId: !Ref PrivateRouteTableA

PrivateSubnetBRouteTableAssociation: Type: AWS::EC2::SubnetRouteTableAssociation Properties: SubnetId: !Ref PrivateSubnetB RouteTableId: !Ref PrivateRouteTableB

PrivateSubnetCRouteTableAssociation: Type: AWS::EC2::SubnetRouteTableAssociation Properties: SubnetId: !Ref PrivateSubnetC RouteTableId: !Ref PrivateRouteTableC

ALBSG: Type: AWS::EC2::SecurityGroup Properties: GroupDescription: 'Security group for Application Load Balancer' VpcId: !Ref ProdVPC SecurityGroupIngress: - IpProtocol: tcp FromPort: 80 ToPort: 80 CidrIp: '0.0.0.0/0' SecurityGroupEgress: - IpProtocol: '-1' CidrIp: '0.0.0.0/0' Tags: - Key: Name Value: !Sub 'SG-ALB-${Environment}' - Key: Owner Value: !Ref Owner - Key: Environment Value: !Ref Environment

AppSG: Type: AWS::EC2::SecurityGroup Properties: GroupDescription: 'Security group for application instances' VpcId: !Ref ProdVPC SecurityGroupIngress: - IpProtocol: tcp FromPort: 80 ToPort: 80 SourceSecurityGroupId: !Ref ALBSG SecurityGroupEgress: - IpProtocol: '-1' CidrIp: '0.0.0.0/0' Tags: - Key: Name Value: !Sub 'SG-App-${Environment}' - Key: Owner Value: !Ref Owner - Key: Environment Value: !Ref Environment

LambdaSG: Type: AWS::EC2::SecurityGroup Properties: GroupDescription: 'Security group for Lambda function' VpcId: !Ref ProdVPC SecurityGroupEgress: - IpProtocol: '-1' CidrIp: '0.0.0.0/0' Tags: - Key: Name Value: !Sub 'SG-Lambda-${Environment}' - Key: Owner Value: !Ref Owner - Key: Environment Value: !Ref Environment

ApplicationLoadBalancer: Type: AWS::ElasticLoadBalancingV2::LoadBalancer Properties: Name: !Sub 'ALB-Main-{Environment}' - Key: Owner Value: !Ref Owner - Key: Environment Value: !Ref Environment

TargetGroup: Type: AWS::ElasticLoadBalancingV2::TargetGroup Properties: Name: !Sub 'TG-Main-{Environment}' - Key: Owner Value: !Ref Owner - Key: Environment Value: !Ref Environment

ALBListener: Type: AWS::ElasticLoadBalancingV2::Listener Properties: DefaultActions: - Type: forward TargetGroupArn: !Ref TargetGroup LoadBalancerArn: !Ref ApplicationLoadBalancer Port: 80 Protocol: HTTP

WebACL: Type: AWS::WAFv2::WebACL Properties: Name: !Sub 'WebACL-Main-{Environment}' Tags: - Key: Name Value: !Sub 'WebACL-Main-${Environment}' - Key: Owner Value: !Ref Owner - Key: Environment Value: !Ref Environment

WebACLAssociation: Type: AWS::WAFv2::WebACLAssociation Properties: ResourceArn: !Ref ApplicationLoadBalancer WebACLArn: !GetAtt WebACL.Arn

LogsKmsKey: Type: AWS::KMS::Key Properties: Description: !Sub 'KMS Key for WAF logs encryption - {AWS::AccountId}:root' Action: 'kms:' Resource: '' - Sid: Allow S3 Service Effect: Allow Principal: Service: s3.amazonaws.com Action: - kms:Decrypt - kms:GenerateDataKey Resource: '*' Tags: - Key: Name Value: !Sub 'KMS-WafLogs-${Environment}' - Key: Owner Value: !Ref Owner - Key: Environment Value: !Ref Environment

LogsKmsKeyAlias: Type: AWS::KMS::Alias Properties: AliasName: !Sub 'alias/waflogs-{AWS::AccountId}' TargetKeyId: !Ref LogsKmsKey

SnsKmsKey: Type: AWS::KMS::Key Properties: Description: !Sub 'KMS Key for SNS topic encryption - {AWS::AccountId}:root' Action: 'kms:' Resource: '' - Sid: Allow SNS Service Effect: Allow Principal: Service: sns.amazonaws.com Action: - kms:Decrypt - kms:GenerateDataKey Resource: '*' Tags: - Key: Name Value: !Sub 'KMS-SNS-${Environment}' - Key: Owner Value: !Ref Owner - Key: Environment Value: !Ref Environment

SnsKmsKeyAlias: Type: AWS::KMS::Alias Properties: AliasName: !Sub 'alias/sns-{AWS::AccountId}' TargetKeyId: !Ref SnsKmsKey

WafLogsBucket: Type: AWS::S3::Bucket Properties: BucketName: !Sub 'waflogs-{Environment}-{Environment}' - Key: Owner Value: !Ref Owner - Key: Environment Value: !Ref Environment

LogsReadRole: Type: AWS::IAM::Role Properties: RoleName: !Sub 'Role-LogsRead-{AWS::AccountId}' AssumeRolePolicyDocument: Version: '2012-10-17' Statement: - Effect: Allow Principal: AWS: !Sub 'arn:aws:iam::{WafLogsBucket}' - !Sub '{Environment}' - Key: Owner Value: !Ref Owner - Key: Environment Value: !Ref Environment

WafLogsBucketPolicy: Type: AWS::S3::BucketPolicy Properties: Bucket: !Ref WafLogsBucket PolicyDocument: Statement: - Sid: DenyInsecureConnections Effect: Deny Principal: '' Action: 's3:' Resource: - !Sub '{WafLogsBucket}' Condition: Bool: aws:SecureTransport: 'false' - Sid: AllowWAFLogDelivery Effect: Allow Principal: Service: wafv2.amazonaws.com Action: 's3:PutObject' Resource: !Sub '{WafLogsBucket}/*' - !Sub '${WafLogsBucket}'

WAFLoggingConfiguration: Type: AWS::WAFv2::LoggingConfiguration DependsOn: WafLogsBucketPolicy Properties: ResourceArn: !GetAtt WebACL.Arn LogDestinationConfigs: - !Sub '${WafLogsBucket}'

ThreatAlertTopic: Type: AWS::SNS::Topic Properties: TopicName: !Sub 'SNS-ThreatAlerts-{AWS::AccountId}' KmsMasterKeyId: !Ref SnsKmsKey Tags: - Key: Name Value: !Sub 'SNS-ThreatAlerts-${Environment}' - Key: Owner Value: !Ref Owner - Key: Environment Value: !Ref Environment

ThreatAlertEmailSubscription: Type: AWS::SNS::Subscription Condition: HasAlertEmail Properties: Protocol: email TopicArn: !Ref ThreatAlertTopic Endpoint: !Ref AlertEmail

ThreatMonitoringLambdaRole: Type: AWS::IAM::Role Properties: RoleName: !Sub 'Role-ThreatLambda-{AWS::AccountId}' AssumeRolePolicyDocument: Version: '2012-10-17' Statement: - Effect: Allow Principal: Service: lambda.amazonaws.com Action: sts:AssumeRole ManagedPolicyArns: - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole Policies: - PolicyName: ThreatMonitoringPolicy PolicyDocument: Version: '2012-10-17' Statement: - Effect: Allow Action: - s3:GetObject Resource: !Sub '{AWS::Region}:{Environment}' - Key: Owner Value: !Ref Owner - Key: Environment Value: !Ref Environment

ThreatMonitoringLambda: Type: AWS::Lambda::Function Properties: FunctionName: !Sub 'Lambda-ThreatMonitor-{AWS::AccountId}' Runtime: python3.12 Handler: index.lambda_handler Role: !GetAtt ThreatMonitoringLambdaRole.Arn VpcConfig: SecurityGroupIds: - !Ref LambdaSG SubnetIds: - !Ref PrivateSubnetA - !Ref PrivateSubnetB - !Ref PrivateSubnetC Environment: Variables: SNS_TOPIC_ARN: !Ref ThreatAlertTopic Code: ZipFile: | import json import boto3 import os from collections import defaultdict

      s3 = boto3.client('s3')
      sns = boto3.client('sns')

      def lambda_handler(event, context):
          threat_count = 0
          blocked_ips = defaultdict(int)
          rule_matches = defaultdict(int)
          
          for record in event['Records']:
              bucket = record['s3']['bucket']['name']
              key = record['s3']['object']['key']
              
              try:
                  response = s3.get_object(Bucket=bucket, Key=key)
                  content = response['Body'].read().decode('utf-8')
                  
                  for line in content.strip().split('\n'):
                      if not line:
                          continue
                      
                      log_entry = json.loads(line)
                      action = log_entry.get('action', '')
                      
                      if action == 'BLOCK':
                          threat_count += 1
                          client_ip = log_entry.get('httpRequest', {}).get('clientIP', 'unknown')
                          blocked_ips[client_ip] += 1
                          
                          for rule_group in log_entry.get('ruleGroupList', []):
                              terminating_rule = rule_group.get('terminatingRule')
                              if terminating_rule and 'ruleId' in terminating_rule:
                                  rule_matches[terminating_rule['ruleId']] += 1
                          
                          labels = log_entry.get('labels', [])
                          for label in labels:
                              label_name = label.get('name', '')
                              if any(threat in label_name.lower() for threat in ['bot', 'sqli', 'xss', 'malicious']):
                                  rule_matches[label_name] += 1
              
              except Exception as e:
                  print(f"Error processing {key}: {str(e)}")
                  continue
          
          if threat_count > 0:
              top_ips = sorted(blocked_ips.items(), key=lambda x: x[1], reverse=True)[:5]
              top_rules = sorted(rule_matches.items(), key=lambda x: x[1], reverse=True)[:5]
              
              message = f"WAF Threat Alert\n\n"
              message += f"Total blocked requests: {threat_count}\n\n"
              message += f"Top offending IPs:\n"
              for ip, count in top_ips:
                  message += f"  {ip}: {count} requests\n"
              message += f"\nTop triggered rules:\n"
              for rule, count in top_rules:
                  message += f"  {rule}: {count} matches\n"
              
              sns.publish(
                  TopicArn=os.environ['SNS_TOPIC_ARN'],
                  Subject='WAF Security Alert',
                  Message=message
              )
          
          return {'statusCode': 200, 'body': json.dumps(f'Processed {threat_count} threats')}
  Tags:
    - Key: Name
      Value: !Sub 'Lambda-ThreatMonitor-${Environment}'
    - Key: Owner
      Value: !Ref Owner
    - Key: Environment
      Value: !Ref Environment
LambdaInvokePermission: Type: AWS::Lambda::Permission Properties: FunctionName: !Ref ThreatMonitoringLambda Action: lambda:InvokeFunction Principal: s3.amazonaws.com SourceArn: !Sub '${WafLogsBucket}'

S3BucketNotification: Type: AWS::S3::Bucket DependsOn: LambdaInvokePermission Properties: BucketName: !Sub '${WafLogsBucket}-notifications' NotificationConfiguration: LambdaConfigurations: - Event: s3:ObjectCreated:* Function: !GetAtt ThreatMonitoringLambda.Arn

Outputs: VPCId: Description: 'VPC ID' Value: !Ref ProdVPC Export: Name: !Sub '${AWS::StackName}-VPCId'

PublicSubnetIds: Description: 'Public Subnet IDs' Value: !Join [',', [!Ref PublicSubnetA, !Ref PublicSubnetB, !Ref PublicSubnetC]] Export: Name: !Sub '${AWS::StackName}-PublicSubnetIds'

PrivateSubnetIds: Description: 'Private Subnet IDs' Value: !Join [',', [!Ref PrivateSubnetA, !Ref PrivateSubnetB, !Ref PrivateSubnetC]] Export: Name: !Sub '${AWS::StackName}-PrivateSubnetIds'

LoadBalancerArn: Description: 'Application Load Balancer ARN' Value: !Ref ApplicationLoadBalancer Export: Name: !Sub '${AWS::StackName}-LoadBalancerArn'

LoadBalancerDNSName: Description: 'Application Load Balancer DNS Name' Value: !GetAtt ApplicationLoadBalancer.DNSName Export: Name: !Sub '${AWS::StackName}-LoadBalancerDNSName'

TargetGroupArn: Description: 'Target Group ARN' Value: !Ref TargetGroup Export: Name: !Sub '${AWS::StackName}-TargetGroupArn'

WebACLArn: Description: 'WAF WebACL ARN' Value: !GetAtt WebACL.Arn Export: Name: !Sub '${AWS::StackName}-WebACLArn'

WafLogsBucketName: Description: 'WAF Logs Bucket Name' Value: !Ref WafLogsBucket Export: Name: !Sub '${AWS::StackName}-WafLogsBucketName'

WafLogsBucketArn: Description: 'WAF Logs Bucket ARN' Value: !Sub '{AWS::StackName}-WafLogsBucketArn'

LogsKmsKeyArn: Description: 'Logs KMS Key ARN' Value: !GetAtt LogsKmsKey.Arn Export: Name: !Sub '${AWS::StackName}-LogsKmsKeyArn'

SnsTopicArn: Description: 'SNS Topic ARN' Value: !Ref ThreatAlertTopic Export: Name: !Sub '${AWS::StackName}-SnsTopicArn'

ThreatLambdaArn: Description: 'Threat Monitoring Lambda ARN' Value: !GetAtt ThreatMonitoringLambda.Arn Export: Name: !Sub '${AWS::StackName}-ThreatLambdaArn'

LogsReadRoleArn: Description: 'Logs Read Role ARN' Value: !GetAtt LogsReadRole.Arn Export: Name: !Sub '${AWS::StackName}-LogsReadRoleArn'

AppSecurityGroupId: Description: 'Application Security Group ID' Value: !Ref AppSG Export: Name: !Sub '${AWS::StackName}-AppSecurityGroupId'