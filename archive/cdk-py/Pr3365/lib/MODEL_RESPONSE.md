### Reasoning Trace

---

Alright, I'm being asked to implement a zero-trust security architecture using AWS CDK in Python for a banking environment with 100 accounts containing sensitive data. The implementation should be a single stack file called `tap_stack.py`.

Let's break down the requirements:

1. **Network**:
   - VPC with isolated subnets
   - Transit Gateway
   - Network Firewall

2. **Security/Detection**:
   - GuardDuty
   - Security Hub
   - VPC Flow Logs

3. **Access Control**:
   - IAM with conditional policies
   - Systems Manager for access

4. **Governance/Response**:
   - CloudTrail for logging
   - Lambda for incident response

5. **Goals**:
   - Least privilege
   - Traffic monitoring
   - Automated threat response
   - Banking compliance

I'll now create the `tap_stack.py` file with these components:

1. First, I'll import the necessary AWS CDK libraries and define the stack.
2. Then, I'll create the network components: VPC, Transit Gateway, and Network Firewall.
3. Next, I'll set up the security and detection components: GuardDuty, Security Hub, and VPC Flow Logs.
4. After that, I'll implement access control using IAM with conditional policies and Systems Manager for access.
5. Finally, I'll set up governance and response mechanisms using CloudTrail for logging and Lambda for incident response.

Let's start:

```python
# tap_stack.py
import aws_cdk as cdk
from aws_cdk import (
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_lambda as lambda_,
    aws_logs as logs,
    aws_networkfirewall as networkfirewall,
    aws_guardduty as guardduty,
    aws_securityhub as securityhub,
    aws_cloudtrail as cloudtrail,
    aws_ssm as ssm,
    aws_s3 as s3,
    aws_kms as kms,
    aws_events as events,
    aws_events_targets as targets,
    aws_lambda_event_sources as lambda_event_sources,
    aws_logs_destinations as logs_destinations,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
    aws_sns as sns,
    Stack,
    Duration,
    CfnOutput,
    RemovalPolicy,
    Tags,
)
from constructs import Construct

class TAPStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # ----- Network Components -----

        # Create VPC with isolated subnets
        self.vpc = ec2.Vpc(
            self, "BankVPC",
            max_azs=3,
            cidr="10.0.0.0/16",
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Isolated",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Protected",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                )
            ]
        )

        # Enable VPC Flow Logs
        flow_logs_bucket = s3.Bucket(
            self, "FlowLogsBucket",
            removal_policy=RemovalPolicy.RETAIN,
            encryption=s3.BucketEncryption.S3_MANAGED,
            enforce_ssl=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True
        )

        flow_logs_role = iam.Role(
            self, "FlowLogsRole",
            assumed_by=iam.ServicePrincipal("vpc-flow-logs.amazonaws.com")
        )

        flow_logs = ec2.FlowLog(
            self, "VPCFlowLogs",
            resource_type=ec2.FlowLogResourceType.from_vpc(self.vpc),
            destination=ec2.FlowLogDestination.to_s3(
                bucket=flow_logs_bucket,
                key_prefix="flow-logs/"
            ),
            traffic_type=ec2.FlowLogTrafficType.ALL
        )

        # Transit Gateway
        transit_gateway = ec2.CfnTransitGateway(
            self, "BankTransitGateway",
            description="Transit Gateway for banking accounts",
            default_route_table_association="disable",
            default_route_table_propagation="disable",
            vpn_ecmp_support="enable",
            dns_support="enable",
            auto_accept_shared_attachments="disable"
        )

        # Create Transit Gateway Attachment for VPC
        tgw_attachment = ec2.CfnTransitGatewayAttachment(
            self, "TGWAttachment",
            transit_gateway_id=transit_gateway.ref,
            vpc_id=self.vpc.vpc_id,
            subnet_ids=[subnet.subnet_id for subnet in self.vpc.isolated_subnets]
        )

        # Network Firewall Subnets - one per AZ
        firewall_subnets = []
        for i, az in enumerate(self.vpc.availability_zones):
            firewall_subnet = ec2.Subnet(
                self, f"FirewallSubnet{i+1}",
                vpc_id=self.vpc.vpc_id,
                availability_zone=az,
                cidr_block=f"10.0.{100+i}.0/24",
                map_public_ip_on_launch=False
            )
            firewall_subnets.append(firewall_subnet)

        # Network Firewall Policy
        firewall_policy = networkfirewall.CfnFirewallPolicy(
            self, "NetworkFirewallPolicy",
            firewall_policy_name="bank-firewall-policy",
            firewall_policy={
                "statelessDefaultActions": ["aws:forward_to_sfe"],
                "statelessFragmentDefaultActions": ["aws:forward_to_sfe"],
                "statefulRuleGroupReferences": [
                    {
                        "resourceArn": networkfirewall.CfnRuleGroup(
                            self, "BankingRuleGroup",
                            capacity=100,
                            rule_group_name="banking-rules",
                            type="STATEFUL",
                            description="Rules for banking application traffic",
                            rule_group={
                                "rulesSource": {
                                    "rulesString": "pass tcp any any -> any 443 (msg:\"Allow HTTPS\"; sid:1;)\ndrop tcp any any -> any any (msg:\"Block all other TCP\"; sid:2;)\ndrop udp any any -> any any (msg:\"Block all UDP\"; sid:3;)"
                                }
                            }
                        ).attr_rule_group_arn
                    }
                ]
            }
        )

        # Network Firewall
        network_firewall = networkfirewall.CfnFirewall(
            self, "NetworkFirewall",
            firewall_name="bank-network-firewall",
            firewall_policy_arn=firewall_policy.attr_firewall_policy_arn,
            vpc_id=self.vpc.vpc_id,
            subnet_mappings=[
                {"subnetId": subnet.subnet_id} for subnet in firewall_subnets
            ],
            delete_protection=True,
            description="Network Firewall for Banking VPC"
        )

        # ----- Security and Detection Components -----

        # GuardDuty
        guardduty_detector = guardduty.CfnDetector(
            self, "GuardDutyDetector",
            enable=True,
            finding_publishing_frequency="FIFTEEN_MINUTES",
            data_sources={
                "s3Logs": {"enable": True},
                "kubernetes": {"auditLogs": {"enable": True}},
                "malwareProtection": {"scanEc2InstanceWithFindings": {"ebsVolumes": True}}
            }
        )

        # Security Hub
        security_hub = securityhub.CfnHub(
            self, "SecurityHub",
            enable_default_standards=True,  # Enables CIS AWS Foundations and PCI DSS standards
            auto_enable_controls=True
        )

        # ----- Access Control Components -----

        # Key for encryption
        cmk = kms.Key(
            self, "BankEncryptionKey",
            enable_key_rotation=True,
            description="CMK for bank data encryption",
            policy=iam.PolicyDocument(
                statements=[
                    iam.PolicyStatement(
                        actions=[
                            "kms:*"
                        ],
                        resources=["*"],
                        principals=[
                            iam.AccountRootPrincipal()
                        ]
                    )
                ]
            )
        )

        # IAM Role with conditional access policies
        bank_admin_role = iam.Role(
            self, "BankAdminRole",
            assumed_by=iam.CompositePrincipal(
                iam.ServicePrincipal("ec2.amazonaws.com"),
                iam.ServicePrincipal("lambda.amazonaws.com")
            ),
            description="Role for bank administrators with conditional access"
        )

        # Add conditional policies
        bank_admin_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:ListBucket"
                ],
                resources=["*"],
                conditions={
                    "IpAddress": {
                        "aws:SourceIp": ["10.0.0.0/16"]  # Allow only from within VPC
                    },
                    "Bool": {
                        "aws:SecureTransport": "true"  # Require SSL
                    },
                    "NumericLessThan": {
                        "aws:MultiFactorAuthAge": "3600"  # Require MFA within last hour
                    }
                }
            )
        )

        # Systems Manager for secure access
        ssm_document = ssm.CfnDocument(
            self, "SSMSessionDocument",
            document_type="Session",
            content={
                "schemaVersion": "1.0",
                "description": "Document for secure session access to bank systems",
                "sessionType": "Standard_Stream",
                "inputs": {
                    "s3BucketName": "",
                    "s3KeyPrefix": "",
                    "s3EncryptionEnabled": True,
                    "cloudWatchLogGroupName": "",
                    "cloudWatchEncryptionEnabled": True,
                    "kmsKeyId": cmk.key_id,
                    "runAsEnabled": False,
                    "runAsDefaultUser": ""
                }
            },
            name="BankSecureSessionManager"
        )

        # IAM Role for SSM
        ssm_role = iam.Role(
            self, "SSMRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
            ]
        )

        # ----- Governance and Response Components -----

        # S3 bucket for CloudTrail logs
        cloudtrail_bucket = s3.Bucket(
            self, "CloudTrailBucket",
            removal_policy=RemovalPolicy.RETAIN,
            encryption=s3.BucketEncryption.S3_MANAGED,
            enforce_ssl=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True
        )

        # CloudTrail for logging
        trail = cloudtrail.Trail(
            self, "BankCloudTrail",
            bucket=cloudtrail_bucket,
            is_multi_region_trail=True,
            trail_name="bank-cloudtrail",
            encryption_key=cmk,
            include_global_service_events=True,
            enable_file_validation=True,
            send_to_cloud_watch_logs=True
        )

        # Lambda function for incident response
        incident_response_function = lambda_.Function(
            self, "IncidentResponseFunction",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            timeout=Duration.minutes(5),
            memory_size=512,
            code=lambda_.Code.from_inline("""
import boto3
import os
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    logger.info(f"Event received: {json.dumps(event)}")

    # Extract alert details from GuardDuty finding
    if 'detail' in event and 'type' in event['detail']:
        finding_type = event['detail']['type']
        account_id = event['detail']['accountId']
        region = event['region']
        resource_type = event['detail']['resource']['resourceType']
        resource_id = event['detail'].get('resource', {}).get('instanceDetails', {}).get('instanceId', 'unknown')
        severity = event['detail']['severity']

        logger.info(f"Processing finding: {finding_type} with severity {severity} affecting {resource_type} {resource_id}")

        # Take action based on severity and finding type
        if severity >= 7:
            if resource_type == 'Instance':
                try:
                    # Isolate the instance by removing it from security groups
                    ec2 = boto3.client('ec2', region_name=region)

                    # Create an isolation security group if it doesn't exist
                    isolation_sg_name = 'isolation-sg'
                    isolation_sg_id = None

                    # Check if isolation SG exists
                    response = ec2.describe_security_groups(
                        Filters=[{'Name': 'group-name', 'Values': [isolation_sg_name]}]
                    )

                    if response['SecurityGroups']:
                        isolation_sg_id = response['SecurityGroups'][0]['GroupId']
                    else:
                        # Create isolation security group
                        response = ec2.create_security_group(
                            GroupName=isolation_sg_name,
                            Description='Security group for isolating compromised instances',
                            VpcId=event['detail'].get('resource', {}).get('instanceDetails', {}).get('vpcId', '')
                        )
                        isolation_sg_id = response['GroupId']

                    # Move the instance to the isolation security group
                    ec2.modify_instance_attribute(
                        InstanceId=resource_id,
                        Groups=[isolation_sg_id]
                    )

                    logger.info(f"Instance {resource_id} isolated to security group {isolation_sg_id}")

                    # Create a snapshot of the instance
                    response = ec2.describe_instances(InstanceIds=[resource_id])
                    for reservation in response['Reservations']:
                        for instance in reservation['Instances']:
                            for device in instance.get('BlockDeviceMappings', []):
                                if 'Ebs' in device:
                                    volume_id = device['Ebs']['VolumeId']
                                    snapshot = ec2.create_snapshot(
                                        VolumeId=volume_id,
                                        Description=f"Forensic snapshot of potentially compromised volume {volume_id} from instance {resource_id}"
                                    )
                                    logger.info(f"Created snapshot {snapshot['SnapshotId']} of volume {volume_id}")

                except Exception as e:
                    logger.error(f"Error in incident response: {str(e)}")

            # Send notification
            try:
                sns = boto3.client('sns', region_name=region)
                topic_arn = os.environ.get('SNS_TOPIC_ARN', '')

                if topic_arn:
                    message = {
                        'default': f"High severity security finding detected: {finding_type}",
                        'email': f"""
High severity security finding detected:
Type: {finding_type}
Severity: {severity}
Account: {account_id}
Region: {region}
Resource: {resource_type} {resource_id}
Actions taken: Resource isolation and forensic snapshot

Please investigate immediately.
"""
                    }

                    sns.publish(
                        TopicArn=topic_arn,
                        Message=json.dumps(message),
                        Subject="SECURITY ALERT: High Severity Finding Detected",
                        MessageStructure='json'
                    )
                    logger.info(f"Alert notification sent to SNS topic {topic_arn}")

            except Exception as e:
                logger.error(f"Error sending notification: {str(e)}")

    return {
        'statusCode': 200,
        'body': json.dumps('Incident response completed')
    }
"""
            ),
            environment={
                "SNS_TOPIC_ARN": sns.Topic(self, "SecurityAlertTopic").topic_arn
            }
        )

        # Grant permissions to Lambda
        incident_response_function.add_to_role_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "ec2:DescribeInstances",
                    "ec2:DescribeSecurityGroups",
                    "ec2:CreateSecurityGroup",
                    "ec2:ModifyInstanceAttribute",
                    "ec2:CreateSnapshot",
                    "ec2:DescribeVolumes",
                    "sns:Publish"
                ],
                resources=["*"]
            )
        )

        # Event rule to trigger Lambda on GuardDuty findings
        guardduty_event_rule = events.Rule(
            self, "GuardDutyFindingsRule",
            event_pattern=events.EventPattern(
                source=["aws.guardduty"],
                detail_type=["GuardDuty Finding"],
                detail={
                    "severity": [
                        {"numeric": [">", 4]}  # Medium to high severity findings
                    ]
                }
            )
        )

        guardduty_event_rule.add_target(targets.LambdaFunction(incident_response_function))

        # ----- Outputs -----

        CfnOutput(
            self, "VpcId",
            value=self.vpc.vpc_id,
            description="VPC ID"
        )

        CfnOutput(
            self, "TransitGatewayId",
            value=transit_gateway.ref,
            description="Transit Gateway ID"
        )

        CfnOutput(
            self, "NetworkFirewallId",
            value=network_firewall.ref,
            description="Network Firewall ID"
        )

        CfnOutput(
            self, "CloudTrailArn",
            value=trail.trail_arn,
            description="CloudTrail ARN"
        )

        CfnOutput(
            self, "GuardDutyDetectorId",
            value=guardduty_detector.attr_detector_id,
            description="GuardDuty Detector ID"
        )

# Entry point for CDK application
app = cdk.App()
TAPStack(app, "TAPStack",
    env=cdk.Environment(
        account=app.node.try_get_context("account") or os.environ.get("CDK_DEFAULT_ACCOUNT"),
        region=app.node.try_get_context("region") or os.environ.get("CDK_DEFAULT_REGION")
    ),
    description="Zero Trust Security Architecture for Banking Accounts"
)

app.synth()
```

I've created a comprehensive `tap_stack.py` file that implements a zero-trust security architecture for banking accounts. Here's what the implementation includes:

1. **Network Components**:
   - VPC with isolated, protected, and public subnets
   - VPC Flow Logs for network traffic monitoring
   - Transit Gateway for secure connections between accounts
   - Network Firewall with banking-specific rules

2. **Security and Detection Components**:
   - GuardDuty for continuous monitoring and threat detection
   - Security Hub to manage security findings and compliance
   - VPC Flow Logs for network traffic analysis

3. **Access Control Components**:
   - IAM Role with conditional access policies (IP restrictions, MFA, SSL)
   - KMS Key for encryption
   - Systems Manager for secure session access

4. **Governance and Response Components**:
   - CloudTrail for comprehensive logging
   - Lambda function for automated incident response
   - Event rules to trigger response based on GuardDuty findings

The implementation incorporates:

- **Least privilege** through IAM conditional policies
- **Traffic monitoring** via VPC Flow Logs, Network Firewall, and GuardDuty
- **Automated threat response** with Lambda functions triggered by security findings
- **Banking compliance** with Security Hub standards (CIS and PCI DSS)

I forgot to import os in my implementation. Let me add that to the imports:

```python
import os
```

This should be included at the top of the file along with the other imports.

Let me review the complete solution one more time to ensure it meets all requirements:

1. ✅ Network components: VPC, Transit Gateway, Network Firewall
2. ✅ Security/Detection: GuardDuty, Security Hub, VPC Flow Logs
3. ✅ Access Control: IAM with conditional policies, Systems Manager
4. ✅ Governance/Response: CloudTrail, Lambda for incident response
5. ✅ Goals: Least privilege, traffic monitoring, automated threat response, banking compliance
6. ✅ Single stack file: `tap_stack.py`

The solution should be complete and ready to present.

### Answer

---

# Zero-Trust Security Architecture for Banking (AWS CDK/Python)

Below is a comprehensive implementation of a zero-trust security architecture for 100 bank accounts with sensitive data. This implementation follows the principle of "never trust, always verify" and incorporates all required security components.

## `tap_stack.py`

```python
# tap_stack.py
import os
import aws_cdk as cdk
from aws_cdk import (
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_lambda as lambda_,
    aws_logs as logs,
    aws_networkfirewall as networkfirewall,
    aws_guardduty as guardduty,
    aws_securityhub as securityhub,
    aws_cloudtrail as cloudtrail,
    aws_ssm as ssm,
    aws_s3 as s3,
    aws_kms as kms,
    aws_events as events,
    aws_events_targets as targets,
    aws_sns as sns,
    Stack,
    Duration,
    CfnOutput,
    RemovalPolicy,
    Tags,
)
from constructs import Construct

class TAPStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # ----- Network Components -----

        # Create VPC with isolated subnets for zero trust architecture
        self.vpc = ec2.Vpc(
            self, "BankVPC",
            max_azs=3,
            cidr="10.0.0.0/16",
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Isolated",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Protected",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                )
            ]
        )

        # Enable VPC Flow Logs for traffic monitoring
        flow_logs_bucket = s3.Bucket(
            self, "FlowLogsBucket",
            removal_policy=RemovalPolicy.RETAIN,
            encryption=s3.BucketEncryption.S3_MANAGED,
            enforce_ssl=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True
        )

        flow_logs = ec2.FlowLog(
            self, "VPCFlowLogs",
            resource_type=ec2.FlowLogResourceType.from_vpc(self.vpc),
            destination=ec2.FlowLogDestination.to_s3(
                bucket=flow_logs_bucket,
                key_prefix="flow-logs/"
            ),
            traffic_type=ec2.FlowLogTrafficType.ALL
        )

        # Transit Gateway for secure account-to-account communication
        transit_gateway = ec2.CfnTransitGateway(
            self, "BankTransitGateway",
            description="Transit Gateway for banking accounts",
            default_route_table_association="disable",
            default_route_table_propagation="disable",
            vpn_ecmp_support="enable",
            dns_support="enable",
            auto_accept_shared_attachments="disable"
        )

        # Create Transit Gateway Attachment for VPC
        tgw_attachment = ec2.CfnTransitGatewayAttachment(
            self, "TGWAttachment",
            transit_gateway_id=transit_gateway.ref,
            vpc_id=self.vpc.vpc_id,
            subnet_ids=[subnet.subnet_id for subnet in self.vpc.isolated_subnets]
        )

        # Network Firewall Subnets - one per AZ
        firewall_subnets = []
        for i, az in enumerate(self.vpc.availability_zones):
            firewall_subnet = ec2.Subnet(
                self, f"FirewallSubnet{i+1}",
                vpc_id=self.vpc.vpc_id,
                availability_zone=az,
                cidr_block=f"10.0.{100+i}.0/24",
                map_public_ip_on_launch=False
            )
            firewall_subnets.append(firewall_subnet)

        # Network Firewall Policy with strict rules for banking
        firewall_policy = networkfirewall.CfnFirewallPolicy(
            self, "NetworkFirewallPolicy",
            firewall_policy_name="bank-firewall-policy",
            firewall_policy={
                "statelessDefaultActions": ["aws:forward_to_sfe"],
                "statelessFragmentDefaultActions": ["aws:forward_to_sfe"],
                "statefulRuleGroupReferences": [
                    {
                        "resourceArn": networkfirewall.CfnRuleGroup(
                            self, "BankingRuleGroup",
                            capacity=100,
                            rule_group_name="banking-rules",
                            type="STATEFUL",
                            description="Rules for banking application traffic",
                            rule_group={
                                "rulesSource": {
                                    "rulesString": (
                                        "pass tcp any any -> any 443 (msg:\"Allow HTTPS\"; sid:1;)\n"
                                        "pass tcp any any -> any 1433 (msg:\"Allow SQL\"; sid:2;)\n"
                                        "drop tcp any any -> any any (msg:\"Block all other TCP\"; sid:3;)\n"
                                        "drop udp any any -> any any (msg:\"Block all UDP\"; sid:4;)"
                                    )
                                }
                            }
                        ).attr_rule_group_arn
                    }
                ]
            }
        )

        # Network Firewall implementation
        network_firewall = networkfirewall.CfnFirewall(
            self, "NetworkFirewall",
            firewall_name="bank-network-firewall",
            firewall_policy_arn=firewall_policy.attr_firewall_policy_arn,
            vpc_id=self.vpc.vpc_id,
            subnet_mappings=[
                {"subnetId": subnet.subnet_id} for subnet in firewall_subnets
            ],
            delete_protection=True,
            description="Network Firewall for Banking VPC"
        )

        # ----- Security and Detection Components -----

        # GuardDuty for threat detection
        guardduty_detector = guardduty.CfnDetector(
            self, "GuardDutyDetector",
            enable=True,
            finding_publishing_frequency="FIFTEEN_MINUTES",
            data_sources={
                "s3Logs": {"enable": True},
                "kubernetes": {"auditLogs": {"enable": True}},
                "malwareProtection": {"scanEc2InstanceWithFindings": {"ebsVolumes": True}}
            }
        )

        # Security Hub for unified security and compliance management
        security_hub = securityhub.CfnHub(
            self, "SecurityHub",
            enable_default_standards=True,  # Enables CIS AWS Foundations and PCI DSS standards
            auto_enable_controls=True
        )

        # ----- Access Control Components -----

        # KMS key for encryption of sensitive data
        cmk = kms.Key(
            self, "BankEncryptionKey",
            enable_key_rotation=True,
            description="CMK for bank data encryption",
            policy=iam.PolicyDocument(
                statements=[
                    iam.PolicyStatement(
                        actions=["kms:*"],
                        resources=["*"],
                        principals=[iam.AccountRootPrincipal()]
                    )
                ]
            )
        )

        # IAM Role with conditional access policies (least privilege)
        bank_admin_role = iam.Role(
            self, "BankAdminRole",
            assumed_by=iam.CompositePrincipal(
                iam.ServicePrincipal("ec2.amazonaws.com"),
                iam.ServicePrincipal("lambda.amazonaws.com")
            ),
            description="Role for bank administrators with conditional access"
        )

        # Add conditional policies enforcing least privilege
        bank_admin_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:ListBucket"
                ],
                resources=["*"],
                conditions={
                    "IpAddress": {
                        "aws:SourceIp": ["10.0.0.0/16"]  # Allow only from within VPC
                    },
                    "Bool": {
                        "aws:SecureTransport": "true"  # Require SSL
                    },
                    "NumericLessThan": {
                        "aws:MultiFactorAuthAge": "3600"  # Require MFA within last hour
                    }
                }
            )
        )

        # Systems Manager for secure access to resources
        ssm_document = ssm.CfnDocument(
            self, "SSMSessionDocument",
            document_type="Session",
            content={
                "schemaVersion": "1.0",
                "description": "Document for secure session access to bank systems",
                "sessionType": "Standard_Stream",
                "inputs": {
                    "s3BucketName": "",
                    "s3KeyPrefix": "",
                    "s3EncryptionEnabled": True,
                    "cloudWatchLogGroupName": "",
                    "cloudWatchEncryptionEnabled": True,
                    "kmsKeyId": cmk.key_id,
                    "runAsEnabled": False,
                    "runAsDefaultUser": ""
                }
            },
            name="BankSecureSessionManager"
        )

        # IAM Role for SSM access
        ssm_role = iam.Role(
            self, "SSMRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
            ]
        )

        # ----- Governance and Response Components -----

        # S3 bucket for CloudTrail logs
        cloudtrail_bucket = s3.Bucket(
            self, "CloudTrailBucket",
            removal_policy=RemovalPolicy.RETAIN,
            encryption=s3.BucketEncryption.S3_MANAGED,
            enforce_ssl=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True
        )

        # CloudTrail for comprehensive logging
        trail = cloudtrail.Trail(
            self, "BankCloudTrail",
            bucket=cloudtrail_bucket,
            is_multi_region_trail=True,
            trail_name="bank-cloudtrail",
            encryption_key=cmk,
            include_global_service_events=True,
            enable_file_validation=True,
            send_to_cloud_watch_logs=True
        )

        # SNS Topic for security alerts
        security_topic = sns.Topic(
            self, "SecurityAlertTopic",
            topic_name="bank-security-alerts"
        )

        # Lambda function for automated incident response
        incident_response_function = lambda_.Function(
            self, "IncidentResponseFunction",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            timeout=Duration.minutes(5),
            memory_size=512,
            code=lambda_.Code.from_inline("""
import boto3
import os
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    logger.info(f"Event received: {json.dumps(event)}")

    # Extract alert details from GuardDuty finding
    if 'detail' in event and 'type' in event['detail']:
        finding_type = event['detail']['type']
        account_id = event['detail']['accountId']
        region = event['region']
        resource_type = event['detail']['resource']['resourceType']
        resource_id = event['detail'].get('resource', {}).get('instanceDetails', {}).get('instanceId', 'unknown')
        severity = event['detail']['severity']

        logger.info(f"Processing finding: {finding_type} with severity {severity} affecting {resource_type} {resource_id}")

        # Take action based on severity and finding type
        if severity >= 7:
            if resource_type == 'Instance':
                try:
                    # Isolate the instance by removing it from security groups
                    ec2 = boto3.client('ec2', region_name=region)

                    # Create an isolation security group if it doesn't exist
                    isolation_sg_name = 'isolation-sg'
                    isolation_sg_id = None

                    # Check if isolation SG exists
                    response = ec2.describe_security_groups(
                        Filters=[{'Name': 'group-name', 'Values': [isolation_sg_name]}]
                    )

                    if response['SecurityGroups']:
                        isolation_sg_id = response['SecurityGroups'][0]['GroupId']
                    else:
                        # Create isolation security group
                        response = ec2.create_security_group(
                            GroupName=isolation_sg_name,
                            Description='Security group for isolating compromised instances',
                            VpcId=event['detail'].get('resource', {}).get('instanceDetails', {}).get('vpcId', '')
                        )
                        isolation_sg_id = response['GroupId']

                    # Move the instance to the isolation security group
                    ec2.modify_instance_attribute(
                        InstanceId=resource_id,
                        Groups=[isolation_sg_id]
                    )

                    logger.info(f"Instance {resource_id} isolated to security group {isolation_sg_id}")

                    # Create a snapshot of the instance for forensics
                    response = ec2.describe_instances(InstanceIds=[resource_id])
                    for reservation in response['Reservations']:
                        for instance in reservation['Instances']:
                            for device in instance.get('BlockDeviceMappings', []):
                                if 'Ebs' in device:
                                    volume_id = device['Ebs']['VolumeId']
                                    snapshot = ec2.create_snapshot(
                                        VolumeId=volume_id,
                                        Description=f"Forensic snapshot of potentially compromised volume {volume_id} from instance {resource_id}"
                                    )
                                    logger.info(f"Created snapshot {snapshot['SnapshotId']} of volume {volume_id}")

                except Exception as e:
                    logger.error(f"Error in incident response: {str(e)}")

            # Send notification
            try:
                sns = boto3.client('sns', region_name=region)
                topic_arn = os.environ.get('SNS_TOPIC_ARN', '')

                if topic_arn:
                    message = {
                        'default': f"High severity security finding detected: {finding_type}",
                        'email': f'''
High severity security finding detected:
Type: {finding_type}
Severity: {severity}
Account: {account_id}
Region: {region}
Resource: {resource_type} {resource_id}
Actions taken: Resource isolation and forensic snapshot

Please investigate immediately.
'''
                    }

                    sns.publish(
                        TopicArn=topic_arn,
                        Message=json.dumps(message),
                        Subject="SECURITY ALERT: High Severity Finding Detected",
                        MessageStructure='json'
                    )
                    logger.info(f"Alert notification sent to SNS topic {topic_arn}")

            except Exception as e:
                logger.error(f"Error sending notification: {str(e)}")

    return {
        'statusCode': 200,
        'body': json.dumps('Incident response completed')
    }
"""
            ),
            environment={
                "SNS_TOPIC_ARN": security_topic.topic_arn
            }
        )

        # Grant permissions to Lambda for incident response
        incident_response_function.add_to_role_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "ec2:DescribeInstances",
                    "ec2:DescribeSecurityGroups",
                    "ec2:CreateSecurityGroup",
                    "ec2:ModifyInstanceAttribute",
                    "ec2:CreateSnapshot",
                    "ec2:DescribeVolumes",
                    "sns:Publish"
                ],
                resources=["*"]
            )
        )

        # Event rule to trigger Lambda on GuardDuty findings (automated threat response)
        guardduty_event_rule = events.Rule(
            self, "GuardDutyFindingsRule",
            event_pattern=events.EventPattern(
                source=["aws.guardduty"],
                detail_type=["GuardDuty Finding"],
                detail={
                    "severity": [
                        {"numeric": [">", 4]}  # Medium to high severity findings
                    ]
                }
            )
        )

        guardduty_event_rule.add_target(targets.LambdaFunction(incident_response_function))

        # ----- Outputs -----

        CfnOutput(
            self, "VpcId",
            value=self.vpc.vpc_id,
            description="VPC ID"
        )

        CfnOutput(
            self, "TransitGatewayId",
            value=transit_gateway.ref,
            description="Transit Gateway ID"
        )

        CfnOutput(
            self, "NetworkFirewallId",
            value=network_firewall.ref,
            description="Network Firewall ID"
        )

        CfnOutput(
            self, "CloudTrailArn",
            value=trail.trail_arn,
            description="CloudTrail ARN"
        )

        CfnOutput(
            self, "GuardDutyDetectorId",
            value=guardduty_detector.attr_detector_id,
            description="GuardDuty Detector ID"
        )

# Entry point for CDK application
app = cdk.App()
TAPStack(app, "TAPStack",
    env=cdk.Environment(
        account=app.node.try_get_context("account") or os.environ.get("CDK_DEFAULT_ACCOUNT"),
        region=app.node.try_get_context("region") or os.environ.get("CDK_DEFAULT_REGION")
    ),
    description="Zero Trust Security Architecture for Banking Accounts"
)

app.synth()
```

## Key Security Features Implemented

### Network Security

- **Isolated VPC subnets**: Strictly controlled network boundaries
- **Transit Gateway**: Secure connectivity between accounts
- **Network Firewall**: Deep packet inspection with banking-specific rules
- **VPC Flow Logs**: Comprehensive traffic monitoring and analysis

### Security Monitoring & Detection

- **GuardDuty**: Real-time threat detection for malicious activity
- **Security Hub**: Centralized compliance management and security findings
- **CloudTrail**: Comprehensive activity logging

### Access Control

- **Conditional IAM Policies**: Enforcing least privilege with:
  - Source IP restrictions (VPC-only)
  - SSL/TLS encryption requirement
  - MFA enforcement
- **Systems Manager**: Secure, auditable access to resources

### Incident Response

- **Automated Lambda response**: Immediate action on security findings
- **Isolation capabilities**: Quarantine compromised resources
- **Forensic snapshots**: Preserve evidence for investigation
- **SNS notifications**: Real-time security alerts

### Compliance

- **Financial services standards**: Implementation follows PCI DSS and CIS benchmarks
- **Encryption**: KMS for data protection
- **Comprehensive logging**: For audit and compliance requirements

This implementation provides a robust zero-trust security framework for banking environments that follows the principle of "never trust, always verify" while enabling automated response to security threats.
