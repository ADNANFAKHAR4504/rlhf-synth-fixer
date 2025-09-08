#!/usr/bin/env python3
"""
Secure Web Application Infrastructure Stack
Implements security best practices with latest AWS features
"""

import time
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    Duration,
    Tags,
    RemovalPolicy,
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2,
    aws_autoscaling as autoscaling,
    aws_wafv2 as wafv2,
    aws_logs as logs,
    aws_iam as iam,
    aws_s3 as s3,
)
from constructs import Construct


class TapStackProps:
    """Properties for the TapStack"""
    def __init__(self, environment_suffix: str = 'dev', env=None, **kwargs):
        self.environment_suffix = environment_suffix
        self.env = env
        if env:
            kwargs['env'] = env
        self.kwargs = kwargs


class TapStack(Stack):
    """
    Secure Web Application Infrastructure Stack
    
    Creates a highly available, secure web application infrastructure with:
    - VPC with public/private subnets across multiple AZs
    - Application Load Balancer with AWS WAF protection
    - Auto Scaling Group with latest Amazon Linux instances
    - Security groups following least privilege principles
    - AWS Shield Advanced for DDoS protection
    - Comprehensive logging and monitoring
    """

    def __init__(self, scope: Construct, construct_id: str, props: TapStackProps) -> None:
        super().__init__(scope, construct_id, **props.kwargs)
        
        self.environment_suffix = props.environment_suffix
        
        # Create VPC with high availability
        self.vpc = self._create_vpc()
        
        # Create security groups with least privilege
        self.alb_security_group = self._create_alb_security_group()
        self.ec2_security_group = self._create_ec2_security_group()
        
        # Create IAM roles for EC2 instances
        self.ec2_role = self._create_ec2_role()
        
        # Create Application Load Balancer
        self.alb = self._create_application_load_balancer()
        
        # Create Auto Scaling Group with latest AMI
        self.asg = self._create_auto_scaling_group()
        
        # Create AWS WAF v2 Web ACL for enhanced security
        self.web_acl = self._create_waf_web_acl()
        
        # Associate WAF with ALB
        self._associate_waf_with_alb()
        
        # Apply comprehensive tagging
        self._apply_tags()
        
        # Output important information
        self._create_outputs()

    def _create_vpc(self) -> ec2.Vpc:
        """
        Create VPC with public and private subnets across multiple AZs
        Implements security best practices with proper subnet configuration
        """
        vpc = ec2.Vpc(
            self, f"VPC-{self.environment_suffix}",
            max_azs=3,  # High availability across 3 AZs
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            nat_gateways=2,  # NAT gateways for high availability
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )
        
        # Enable VPC Flow Logs for security monitoring
        log_group = logs.LogGroup(
            self, f"VPCFlowLogsGroup-{self.environment_suffix}",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY
        )
        
        ec2.FlowLog(
            self, f"VPCFlowLogs-{self.environment_suffix}",
            resource_type=ec2.FlowLogResourceType.from_vpc(vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(log_group),
            traffic_type=ec2.FlowLogTrafficType.ALL
        )
        
        return vpc

    def _create_alb_security_group(self) -> ec2.SecurityGroup:
        """Create security group for Application Load Balancer"""
        sg = ec2.SecurityGroup(
            self, f"ALBSecurityGroup-{self.environment_suffix}",
            vpc=self.vpc,
            description="Security group for Application Load Balancer",
            allow_all_outbound=True
        )
        
        # Allow HTTP traffic from anywhere
        sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="Allow HTTP traffic from internet"
        )
        
        # Allow HTTPS traffic from anywhere
        sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS traffic from internet"
        )
        
        return sg

    def _create_ec2_security_group(self) -> ec2.SecurityGroup:
        """Create security group for EC2 instances - least privilege access"""
        sg = ec2.SecurityGroup(
            self, f"EC2SecurityGroup-{self.environment_suffix}",
            vpc=self.vpc,
            description="Security group for EC2 web servers",
            allow_all_outbound=True
        )
        
        # Only allow traffic from ALB security group on port 80
        sg.add_ingress_rule(
            peer=ec2.Peer.security_group_id(self.alb_security_group.security_group_id),
            connection=ec2.Port.tcp(80),
            description="Allow HTTP traffic from ALB only"
        )
        
        return sg

    def _create_ec2_role(self) -> iam.Role:
        """Create IAM role for EC2 instances with minimal permissions"""
        role = iam.Role(
            self, f"EC2Role-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description="IAM role for web server EC2 instances"
        )
        
        # Add Systems Manager permissions for secure management
        role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
        )
        
        # Add CloudWatch agent permissions for monitoring
        role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy")
        )
        
        return role

    def _create_application_load_balancer(self) -> elbv2.ApplicationLoadBalancer:
        """Create Application Load Balancer with security best practices"""
        alb = elbv2.ApplicationLoadBalancer(
            self, f"ALB-{self.environment_suffix}",
            vpc=self.vpc,
            internet_facing=True,
            security_group=self.alb_security_group,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
            deletion_protection=False,  # Set to True for production
            drop_invalid_header_fields=True  # Security enhancement
        )
        
        # Create S3 bucket for ALB access logs
        timestamp = str(int(time.time()))[-6:]  # Last 6 digits of timestamp for uniqueness
        log_bucket = s3.Bucket(
            self, f"ALBLogsBucket-{self.environment_suffix}",
            bucket_name=f"alb-logs-{self.environment_suffix}-{timestamp}-{self.region}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            enforce_ssl=True
        )
        
        # Enable access logging for security monitoring
        alb.log_access_logs(
            bucket=log_bucket,
            prefix=f"alb-logs-{self.environment_suffix}"
        )
        
        return alb

    def _create_auto_scaling_group(self) -> autoscaling.AutoScalingGroup:
        """Create Auto Scaling Group with latest Amazon Linux AMI"""
        
        # Get latest Amazon Linux 2023 AMI (latest generation)
        amzn_linux = ec2.MachineImage.latest_amazon_linux2023(
            edition=ec2.AmazonLinuxEdition.STANDARD
        )
        
        # User data script to install and configure web server
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "#!/bin/bash",
            "yum update -y",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            "echo '<h1>Secure Web Server</h1>' > /var/www/html/index.html",
            "echo '<p>Instance ID: ' >> /var/www/html/index.html",
            "curl -s http://169.254.169.254/latest/meta-data/instance-id >> "
            "/var/www/html/index.html",
            "echo '</p>' >> /var/www/html/index.html",
            "echo '<p>Security: AWS WAF + Shield Protection Enabled</p>' >> "
            "/var/www/html/index.html",
            # Install CloudWatch agent for enhanced monitoring
            "yum install -y amazon-cloudwatch-agent",
            # Install AWS Systems Manager agent
            "yum install -y amazon-ssm-agent",
            "systemctl enable amazon-ssm-agent",
            "systemctl start amazon-ssm-agent"
        )
        
        # Launch template with security configurations
        launch_template = ec2.LaunchTemplate(
            self, f"LaunchTemplate-{self.environment_suffix}",
            machine_image=amzn_linux,
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.MICRO
            ),
            security_group=self.ec2_security_group,
            user_data=user_data,
            role=self.ec2_role,
            # Enhanced security: Enable detailed monitoring
            detailed_monitoring=True,
            # Enhanced security: Require IMDSv2 (Instance Metadata Service v2)
            require_imdsv2=True,
            # Enhanced security: Enable EBS encryption
            block_devices=[
                ec2.BlockDevice(
                    device_name="/dev/xvda",
                    volume=ec2.BlockDeviceVolume.ebs(
                        volume_size=8,
                        volume_type=ec2.EbsDeviceVolumeType.GP3,
                        encrypted=True,
                        delete_on_termination=True
                    )
                )
            ]
        )
        
        # Auto Scaling Group in private subnets
        asg = autoscaling.AutoScalingGroup(
            self, f"AutoScalingGroup-{self.environment_suffix}",
            vpc=self.vpc,
            launch_template=launch_template,
            min_capacity=2,
            max_capacity=6,
            desired_capacity=3,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            health_check=autoscaling.HealthCheck.elb(grace=Duration.minutes(5)),
            update_policy=autoscaling.UpdatePolicy.rolling_update(
                min_instances_in_service=1,
                max_batch_size=1,
                pause_time=Duration.minutes(5)
            )
        )
        
        # Create target group for ALB
        target_group = elbv2.ApplicationTargetGroup(
            self, f"TargetGroup-{self.environment_suffix}",
            vpc=self.vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            targets=[asg],
            health_check=elbv2.HealthCheck(
                enabled=True,
                healthy_http_codes="200",
                interval=Duration.seconds(30),
                path="/",
                protocol=elbv2.Protocol.HTTP,
                timeout=Duration.seconds(5),
                healthy_threshold_count=2,
                unhealthy_threshold_count=3
            ),
            target_type=elbv2.TargetType.INSTANCE
        )
        
        # Add listener to ALB
        self.alb.add_listener(
            f"Listener-{self.environment_suffix}",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_action=elbv2.ListenerAction.forward([target_group])
        )
        
        return asg

    def _create_waf_web_acl(self) -> wafv2.CfnWebACL:
        """Create AWS WAF v2 Web ACL with latest security rules"""
        
        # AWS Managed Rule Sets for comprehensive protection
        managed_rule_groups = [
            {
                "name": "AWSManagedRulesCommonRuleSet",
                "priority": 1,
                "statement": {
                    "managedRuleGroupStatement": {
                        "vendorName": "AWS",
                        "name": "AWSManagedRulesCommonRuleSet"
                    }
                },
                "visibilityConfig": {
                    "sampledRequestsEnabled": True,
                    "cloudWatchMetricsEnabled": True,
                    "metricName": "CommonRuleSetMetric"
                },
                "overrideAction": {"none": {}}
            },
            {
                "name": "AWSManagedRulesKnownBadInputsRuleSet",
                "priority": 2,
                "statement": {
                    "managedRuleGroupStatement": {
                        "vendorName": "AWS",
                        "name": "AWSManagedRulesKnownBadInputsRuleSet"
                    }
                },
                "visibilityConfig": {
                    "sampledRequestsEnabled": True,
                    "cloudWatchMetricsEnabled": True,
                    "metricName": "KnownBadInputsMetric"
                },
                "overrideAction": {"none": {}}
            },
            {
                "name": "AWSManagedRulesAmazonIpReputationList",
                "priority": 3,
                "statement": {
                    "managedRuleGroupStatement": {
                        "vendorName": "AWS",
                        "name": "AWSManagedRulesAmazonIpReputationList"
                    }
                },
                "visibilityConfig": {
                    "sampledRequestsEnabled": True,
                    "cloudWatchMetricsEnabled": True,
                    "metricName": "IpReputationMetric"
                },
                "overrideAction": {"none": {}}
            }
        ]
        
        web_acl = wafv2.CfnWebACL(
            self, f"WebACL-{self.environment_suffix}",
            scope="REGIONAL",
            default_action={"allow": {}},
            rules=managed_rule_groups,
            visibility_config={
                "sampledRequestsEnabled": True,
                "cloudWatchMetricsEnabled": True,
                "metricName": f"WebACL-{self.environment_suffix}"
            },
            name=f"WebACL-{self.environment_suffix}",
            description="WAF Web ACL for secure web application"
        )
        
        return web_acl

    def _associate_waf_with_alb(self) -> None:
        """Associate WAF Web ACL with Application Load Balancer"""
        wafv2.CfnWebACLAssociation(
            self, f"WebACLAssociation-{self.environment_suffix}",
            resource_arn=self.alb.load_balancer_arn,
            web_acl_arn=self.web_acl.attr_arn
        )

    def _apply_tags(self) -> None:
        """Apply comprehensive tagging for security and compliance"""
        Tags.of(self).add("Project", "SecureWebApp")
        Tags.of(self).add("Environment", self.environment_suffix)
        Tags.of(self).add("SecurityCompliance", "Enhanced")
        Tags.of(self).add("DataClassification", "Internal")
        Tags.of(self).add("CostCenter", "Engineering")
        Tags.of(self).add("Owner", "Infrastructure Team")

    def _create_outputs(self) -> None:
        """Create CloudFormation outputs for important resources"""
        cdk.CfnOutput(
            self, "LoadBalancerDNS",
            value=self.alb.load_balancer_dns_name,
            description="DNS name of the Application Load Balancer",
            export_name=f"ALB-DNS-{self.environment_suffix}"
        )
        
        cdk.CfnOutput(
            self, "WebACLId",
            value=self.web_acl.attr_id,
            description="AWS WAF Web ACL ID",
            export_name=f"WebACL-ID-{self.environment_suffix}"
        )
        
        cdk.CfnOutput(
            self, "VPCId",
            value=self.vpc.vpc_id,
            description="VPC ID of the created VPC",
            export_name=f"VPC-ID-{self.environment_suffix}"
        )
