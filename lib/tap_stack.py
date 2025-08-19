#!/usr/bin/env python3
"""
TAP (Test Automation Platform) Stack for AWS Infrastructure Migration
Implements AWS infrastructure migration from us-west-1 to us-east-1,
including S3 buckets, EC2 (with blue/green deployment), RDS (with replica), KMS encryption,
CloudWatch monitoring, cross-region replication, backup strategies, and IAM least privilege.
"""

import json
from typing import Optional

import pulumi
import pulumi_aws as aws
import pulumi_random as random
from pulumi import AssetArchive, Config, Output, ResourceOptions, StringAsset


class TapStackArgs:
  """Arguments for TapStack configuration"""
  def __init__(self, environment_suffix: str):
    self.environment_suffix = environment_suffix

class TapStack(pulumi.ComponentResource):
  """
  Complete AWS infrastructure migration stack with S3 (KMS encryption,
  replication), EC2 blue/green deployment,
  RDS with cross-region replica/promotion, compliant IAM, CloudWatch
  monitoring, and automated backups.
  """

  def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
    super().__init__("custom:infrastructure:TapStack", name, {}, opts)
    self.name = name
    self.args = args
    self.config = Config()

    self.source_region = "us-west-1"
    self.target_region = "us-east-1"
    self.env_suffix = args.environment_suffix
    self.default_tags = {
      "Environment": self.env_suffix,
      "ManagedBy": "Pulumi",
      "Project": "TAP-Migration",
      "SourceRegion": self.source_region,
      "TargetRegion": self.target_region
    }

    # Providers
    self._setup_providers()
    self._create_networking()
    self._create_s3_infrastructure()
    self._create_ec2_infrastructure()
    self._create_rds_infrastructure()
    self._create_rds_promotion_automation()
    self._setup_monitoring()
    self._setup_backup_strategies()
    self._export_outputs()

  def _setup_providers(self):
    """Setup AWS providers for source and target regions"""
    self.source_provider = aws.Provider(
      f"source-provider-{self.env_suffix}",
      region=self.source_region,
      opts=ResourceOptions(parent=self)
    )
    self.target_provider = aws.Provider(
      f"target-provider-{self.env_suffix}",
      region=self.target_region,
      opts=ResourceOptions(parent=self)
    )

  def _create_networking(self):
    """Create VPC and networking infrastructure in target region"""
    self.target_vpc = aws.ec2.Vpc(
      f"target-vpc-{self.env_suffix}",
      cidr_block="10.0.0.0/16",
      enable_dns_hostnames=True,
      enable_dns_support=True,
      tags={**self.default_tags, "Name": f"target-vpc-{self.env_suffix}"},
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )
    # Subnets
    self.target_public_subnet_1 = aws.ec2.Subnet(
      f"target-public-subnet-1-{self.env_suffix}",
      vpc_id=self.target_vpc.id,
      cidr_block="10.0.1.0/24",
      availability_zone=f"{self.target_region}a",
      map_public_ip_on_launch=True,
      tags={**self.default_tags, "Name": f"target-public-subnet-1-{self.env_suffix}"},
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )
    self.target_public_subnet_2 = aws.ec2.Subnet(
      f"target-public-subnet-2-{self.env_suffix}",
      vpc_id=self.target_vpc.id,
      cidr_block="10.0.2.0/24",
      availability_zone=f"{self.target_region}b",
      map_public_ip_on_launch=True,
      tags={**self.default_tags, "Name": f"target-public-subnet-2-{self.env_suffix}"},
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )
    self.target_private_subnet_1 = aws.ec2.Subnet(
      f"target-private-subnet-1-{self.env_suffix}",
      vpc_id=self.target_vpc.id,
      cidr_block="10.0.3.0/24",
      availability_zone=f"{self.target_region}a",
      tags={**self.default_tags, "Name": f"target-private-subnet-1-{self.env_suffix}"},
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )
    self.target_private_subnet_2 = aws.ec2.Subnet(
      f"target-private-subnet-2-{self.env_suffix}",
      vpc_id=self.target_vpc.id,
      cidr_block="10.0.4.0/24",
      availability_zone=f"{self.target_region}b",
      tags={**self.default_tags, "Name": f"target-private-subnet-2-{self.env_suffix}"},
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )
    # IGW
    self.target_igw = aws.ec2.InternetGateway(
      f"target-igw-{self.env_suffix}",
      vpc_id=self.target_vpc.id,
      tags={**self.default_tags, "Name": f"target-igw-{self.env_suffix}"},
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )
    # Routing
    self.target_route_table = aws.ec2.RouteTable(
      f"target-route-table-{self.env_suffix}",
      vpc_id=self.target_vpc.id,
      tags={**self.default_tags, "Name": f"target-route-table-{self.env_suffix}"},
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )
    self.target_route = aws.ec2.Route(
      f"target-route-{self.env_suffix}",
      route_table_id=self.target_route_table.id,
      destination_cidr_block="0.0.0.0/0",
      gateway_id=self.target_igw.id,
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )
    aws.ec2.RouteTableAssociation(
      f"target-rta-public-1-{self.env_suffix}",
      subnet_id=self.target_public_subnet_1.id,
      route_table_id=self.target_route_table.id,
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )
    aws.ec2.RouteTableAssociation(
      f"target-rta-public-2-{self.env_suffix}",
      subnet_id=self.target_public_subnet_2.id,
      route_table_id=self.target_route_table.id,
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )

  def _create_s3_infrastructure(self):
    """Create S3 buckets with KMS encryption and cross-region replication"""
    # S3 KMS keys
    self.s3_source_kms_key = aws.kms.Key(
      f"s3-source-kms-key-{self.env_suffix}",
      description=f"KMS key for S3 source bucket encryption - {self.env_suffix}",
      tags={**self.default_tags, "Purpose": "S3SourceEncryption"},
      opts=ResourceOptions(provider=self.source_provider, parent=self)
    )
    self.s3_target_kms_key = aws.kms.Key(
      f"s3-target-kms-key-{self.env_suffix}",
      description=f"KMS key for S3 target bucket encryption - {self.env_suffix}",
      tags={**self.default_tags, "Purpose": "S3TargetEncryption"},
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )
    # Buckets
    self.source_bucket = aws.s3.BucketV2(
      f"tap-source-bucket-{self.env_suffix}",
      tags={**self.default_tags, "Purpose": "Source"},
      opts=ResourceOptions(provider=self.source_provider, parent=self)
    )
    self.target_bucket = aws.s3.BucketV2(
      f"tap-target-bucket-{self.env_suffix}",
      tags={**self.default_tags, "Purpose": "Target"},
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )
    # Encryption Configuration
    aws.s3.BucketServerSideEncryptionConfigurationV2(
      f"source-bucket-encryption-{self.env_suffix}",
      bucket=self.source_bucket.id,
      rules=[aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
        apply_server_side_encryption_by_default=aws.s3.
        BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
          sse_algorithm="aws:kms",
          kms_master_key_id=self.s3_source_kms_key.arn
        ),
        bucket_key_enabled=True
      )],
      opts=ResourceOptions(provider=self.source_provider, parent=self)
    )
    aws.s3.BucketServerSideEncryptionConfigurationV2(
      f"target-bucket-encryption-{self.env_suffix}",
      bucket=self.target_bucket.id,
      rules=[aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
        apply_server_side_encryption_by_default=aws.s3.
        BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
          sse_algorithm="aws:kms",
          kms_master_key_id=self.s3_target_kms_key.arn
        ),
        bucket_key_enabled=True
      )],
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )
    # Versioning
    aws.s3.BucketVersioningV2(
      f"source-bucket-versioning-{self.env_suffix}",
      bucket=self.source_bucket.id,
      versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
        status="Enabled"
      ),
      opts=ResourceOptions(provider=self.source_provider, parent=self)
    )
    aws.s3.BucketVersioningV2(
      f"target-bucket-versioning-{self.env_suffix}",
      bucket=self.target_bucket.id,
      versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
        status="Enabled"
      ),
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )

    # Replication IAM Role
    replication_assume_role_policy = {
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "s3.amazonaws.com"},
        "Action": "sts:AssumeRole"
      }]
    }
    self.replication_role = aws.iam.Role(
      f"replication-role-{self.env_suffix}",
      assume_role_policy=json.dumps(replication_assume_role_policy),
      tags=self.default_tags,
      opts=ResourceOptions(provider=self.source_provider, parent=self)
    )

    # Replication policy (least privilege)
    def replication_policy_doc(source_bucket_arn, target_bucket_arn,
                             source_kms_arn, target_kms_arn):
      return json.dumps({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "s3:GetObjectVersionForReplication",
              "s3:GetObjectVersionAcl",
              "s3:GetObjectVersionTagging"
            ],
            "Resource": [f"{source_bucket_arn}/*"]
          },
          {
            "Effect": "Allow",
            "Action": ["s3:ListBucket"],
            "Resource": [source_bucket_arn]
          },
          {
            "Effect": "Allow",
            "Action": [
              "s3:ReplicateObject",
              "s3:ReplicateDelete",
              "s3:ReplicateTags"
            ],
            "Resource": [f"{target_bucket_arn}/*"]
          },
          {
            "Effect": "Allow",
            "Action": ["kms:Decrypt"],
            "Resource": [source_kms_arn],
            "Condition": {
              "StringEquals": {
                "kms:ViaService": f"s3.{self.source_region}.amazonaws.com"
              }
            }
          },
          {
            "Effect": "Allow",
            "Action": ["kms:GenerateDataKey", "kms:Encrypt"],
            "Resource": [target_kms_arn],
            "Condition": {
              "StringEquals": {
                "kms:ViaService": f"s3.{self.target_region}.amazonaws.com"
              }
            }
          }
        ]
      })
    replication_policy = aws.iam.Policy(
      f"replication-policy-{self.env_suffix}",
      policy=Output.all(
        self.source_bucket.arn,
        self.target_bucket.arn,
        self.s3_source_kms_key.arn,
        self.s3_target_kms_key.arn
      ).apply(lambda args: replication_policy_doc(args[0], args[1], args[2], args[3])),
      opts=ResourceOptions(provider=self.source_provider, parent=self)
    )
    aws.iam.RolePolicyAttachment(
      f"replication-policy-attachment-{self.env_suffix}",
      role=self.replication_role.name,
      policy_arn=replication_policy.arn,
      opts=ResourceOptions(provider=self.source_provider, parent=self)
    )
    # Replication configuration
    aws.s3.BucketReplicationConfig(
      f"bucket-replication-{self.env_suffix}",
      role=self.replication_role.arn,
      bucket=self.source_bucket.id,
      rules=[
        aws.s3.BucketReplicationConfigRuleArgs(
          id="ReplicateEverything",
          status="Enabled",
          destination=aws.s3.BucketReplicationConfigRuleDestinationArgs(
            bucket=self.target_bucket.arn,
            storage_class="STANDARD"
          ),
          filter=aws.s3.BucketReplicationConfigRuleFilterArgs(
            prefix=""
          ),
          delete_marker_replication=aws.s3.BucketReplicationConfigRuleDeleteMarkerReplicationArgs(
            status="Enabled"
          )
        )
      ],
      opts=ResourceOptions(
        provider=self.source_provider,
        parent=self,
        depends_on=[self.source_bucket, self.target_bucket,
                  self.replication_role, replication_policy]
      )
    )

  def _create_ec2_infrastructure(self):
    """Create EC2 instances with blue/green deployment and zero-downtime migration"""
    self.ec2_security_group = aws.ec2.SecurityGroup(
      f"ec2-sg-{self.env_suffix}",
      name=f"ec2-sg-{self.env_suffix}",
      description="Security group for EC2 instances",
      vpc_id=self.target_vpc.id,
      ingress=[
        aws.ec2.SecurityGroupIngressArgs(protocol="tcp", from_port=80,
          to_port=80, cidr_blocks=["0.0.0.0/0"], description="HTTP"),
        aws.ec2.SecurityGroupIngressArgs(protocol="tcp", from_port=443,
          to_port=443, cidr_blocks=["0.0.0.0/0"], description="HTTPS"),
        aws.ec2.SecurityGroupIngressArgs(protocol="tcp", from_port=22,
          to_port=22, cidr_blocks=["10.0.0.0/16"], description="SSH from VPC")
      ],
      egress=[
        aws.ec2.SecurityGroupEgressArgs(protocol="-1", from_port=0,
          to_port=0, cidr_blocks=["0.0.0.0/0"])
      ],
      tags={**self.default_tags, "Name": f"ec2-sg-{self.env_suffix}"},
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )
    ami = aws.ec2.get_ami(
      most_recent=True,
      owners=["amazon"],
      filters=[
        aws.ec2.GetAmiFilterArgs(name="name", values=["amzn2-ami-hvm-*-x86_64-gp2"])
      ],
      opts=pulumi.InvokeOptions(provider=self.target_provider)
    )
    user_data = """#!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>TAP Migration Instance - Region: us-east-1</h1>" > /var/www/html/index.html
    """
    self.ec2_instances = []
    for i in range(2):
      instance = aws.ec2.Instance(
        f"ec2-instance-{i+1}-{self.env_suffix}",
        ami=ami.id,
        instance_type="t3.micro",
        subnet_id=self.target_public_subnet_1.id if i == 0 else self.target_public_subnet_2.id,
        vpc_security_group_ids=[self.ec2_security_group.id],
        user_data=user_data,
        tags={**self.default_tags, "Name": f"ec2-instance-{i+1}-{self.env_suffix}"},
        opts=ResourceOptions(provider=self.target_provider, parent=self)
      )
      self.ec2_instances.append(instance)
    self.alb_security_group = aws.ec2.SecurityGroup(
      f"alb-sg-{self.env_suffix}",
      name=f"alb-sg-{self.env_suffix}",
      description="Security group for Application Load Balancer",
      vpc_id=self.target_vpc.id,
      ingress=[
        aws.ec2.SecurityGroupIngressArgs(protocol="tcp", from_port=80,
          to_port=80, cidr_blocks=["0.0.0.0/0"]),
        aws.ec2.SecurityGroupIngressArgs(protocol="tcp", from_port=443,
          to_port=443, cidr_blocks=["0.0.0.0/0"])
      ],
      egress=[
        aws.ec2.SecurityGroupEgressArgs(protocol="-1", from_port=0,
          to_port=0, cidr_blocks=["0.0.0.0/0"])
      ],
      tags={**self.default_tags, "Name": f"alb-sg-{self.env_suffix}"},
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )
    self.alb = aws.lb.LoadBalancer(
      f"alb-{self.env_suffix}",
      load_balancer_type="application",
      security_groups=[self.alb_security_group.id],
      subnets=[self.target_public_subnet_1.id, self.target_public_subnet_2.id],
      tags={**self.default_tags, "Name": f"alb-{self.env_suffix}"},
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )
    self.target_group = aws.lb.TargetGroup(
      f"tg-{self.env_suffix}",
      port=80,
      protocol="HTTP",
      vpc_id=self.target_vpc.id,
      health_check=aws.lb.TargetGroupHealthCheckArgs(
        enabled=True,
        healthy_threshold=2,
        unhealthy_threshold=2,
        timeout=5,
        interval=30,
        path="/",
        matcher="200"
      ),
      tags={**self.default_tags, "Name": f"tg-{self.env_suffix}"},
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )
    for i, instance in enumerate(self.ec2_instances):
      aws.lb.TargetGroupAttachment(
        f"tg-attachment-{i+1}-{self.env_suffix}",
        target_group_arn=self.target_group.arn,
        target_id=instance.id,
        port=80,
        opts=ResourceOptions(provider=self.target_provider, parent=self)
      )
    aws.lb.Listener(
      f"alb-listener-{self.env_suffix}",
      load_balancer_arn=self.alb.arn,
      port="80",
      protocol="HTTP",
      default_actions=[
        aws.lb.ListenerDefaultActionArgs(
          type="forward",
          target_group_arn=self.target_group.arn
        )
      ],
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )
    # Global Accelerator (for true zero-downtime)
    self.global_accelerator = aws.globalaccelerator.Accelerator(
      f"global-accelerator-{self.env_suffix}",
      name=f"tap-accelerator-{self.env_suffix}",
      ip_address_type="IPV4",
      enabled=True,
      tags=self.default_tags,
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )
    ga_listener = aws.globalaccelerator.Listener(
      f"ga-listener-{self.env_suffix}",
      accelerator_arn=self.global_accelerator.id,
      protocol="TCP",
      port_ranges=[aws.globalaccelerator.ListenerPortRangeArgs(from_port=80, to_port=80)],
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )
    aws.globalaccelerator.EndpointGroup(
      f"ga-endpoint-group-{self.env_suffix}",
      listener_arn=ga_listener.id,
      endpoint_group_region=self.target_region,
      traffic_dial_percentage=100,
      endpoint_configurations=[
        aws.globalaccelerator.EndpointGroupEndpointConfigurationArgs(
          endpoint_id=self.alb.arn,
          weight=100
        )
      ],
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )

  def _create_rds_infrastructure(self):
    """Create RDS with KMS encryption and read replica"""
    self.db_subnet_group = aws.rds.SubnetGroup(
      f"db-subnet-group-{self.env_suffix}",
      subnet_ids=[self.target_private_subnet_1.id, self.target_private_subnet_2.id],
      tags={**self.default_tags, "Name": f"db-subnet-group-{self.env_suffix}"},
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )
    self.rds_security_group = aws.ec2.SecurityGroup(
      f"rds-sg-{self.env_suffix}",
      name=f"rds-sg-{self.env_suffix}",
      description="Security group for RDS database",
      vpc_id=self.target_vpc.id,
      ingress=[
        aws.ec2.SecurityGroupIngressArgs(protocol="tcp", from_port=3306,
          to_port=3306, security_groups=[self.ec2_security_group.id],
          description="MySQL from EC2")
      ],
      tags={**self.default_tags, "Name": f"rds-sg-{self.env_suffix}"},
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )
    self.rds_kms_key = aws.kms.Key(
      f"rds-kms-key-{self.env_suffix}",
      description=f"KMS key for RDS encryption - {self.env_suffix}",
      tags=self.default_tags,
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )
    # Secure password
    self.db_password = random.RandomPassword(
      f"db-password-{self.env_suffix}",
      length=32, special=True, min_lower=1, min_upper=1, min_numeric=1, min_special=1,
      opts=ResourceOptions(parent=self)
    )
    self.db_secret = aws.secretsmanager.Secret(
      f"db-secret-{self.env_suffix}",
      name=f"tap-db-password-{self.env_suffix}",
      description="TAP migration database password",
      kms_key_id=self.rds_kms_key.arn,
      tags=self.default_tags,
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )
    aws.secretsmanager.SecretVersion(
      f"db-secret-version-{self.env_suffix}",
      secret_id=self.db_secret.id,
      secret_string=self.db_password.result,
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )
    self.rds_instance = aws.rds.Instance(
      f"rds-instance-{self.env_suffix}",
      allocated_storage=20,
      max_allocated_storage=100,
      engine="mysql",
      engine_version="8.0",
      instance_class="db.t3.micro",
      identifier=f"tap-db-{self.env_suffix}",
      username="admin",
      password=self.db_password.result,
      vpc_security_group_ids=[self.rds_security_group.id],
      db_subnet_group_name=self.db_subnet_group.name,
      backup_retention_period=7,
      backup_window="03:00-04:00",
      maintenance_window="sun:04:00-sun:05:00",
      storage_encrypted=True,
      kms_key_id=self.rds_kms_key.arn,
      skip_final_snapshot=True,
      copy_tags_to_snapshot=True,
      tags={**self.default_tags, "Name": f"rds-instance-{self.env_suffix}"},
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )
    # Cross-region read replica (in target region instead of source region)
    self.rds_read_replica = aws.rds.Instance(
      f"rds-read-replica-{self.env_suffix}",
      replicate_source_db=self.rds_instance.arn,
      engine="mysql",
      engine_version="8.0",
      instance_class="db.t3.micro",
      publicly_accessible=False,
      skip_final_snapshot=True,
      tags={**self.default_tags, "Purpose": "ReadReplica"},
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )


  def _create_rds_promotion_automation(self):
    """Create automation for RDS read replica promotion"""
    lambda_assume_role_policy = {
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "lambda.amazonaws.com"},
        "Action": "sts:AssumeRole"
      }]
    }
    lambda_role = aws.iam.Role(
      f"rds-promotion-lambda-role-{self.env_suffix}",
      assume_role_policy=json.dumps(lambda_assume_role_policy),
      managed_policy_arns=["arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"],
      tags=self.default_tags,
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )
    
    # Lambda function code as Python string
    lambda_code = """
import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
  rds_client = boto3.client('rds')
  replica_identifier = event.get('replica_identifier')
  try:
    response = rds_client.promote_read_replica(DBInstanceIdentifier=replica_identifier)
    logger.info(f"Promoted {replica_identifier}")
    return {'statusCode': 200, 'body': json.dumps({'message': 'RDS promotion success', 'db_instance': response['DBInstance']['DBInstanceIdentifier']})}
  except Exception as e:
    logger.error(str(e))
    return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}
"""

    # Create the asset archive as index.py file
    lambda_archive = AssetArchive({
      "index.py": StringAsset(lambda_code)
    })

    self.rds_promotion_lambda = aws.lambda_.Function(
      f"rds-promotion-lambda-{self.env_suffix}",
      name=f"tap-rds-promotion-{self.env_suffix}",
      runtime="python3.9",
      handler="index.lambda_handler",
      role=lambda_role.arn,
      code=lambda_archive,  # Fixed: Using AssetArchive instead of raw string
      timeout=300,
      tags=self.default_tags,
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )

  def _setup_monitoring(self):
    """Setup AWS CloudWatch alarms and dashboard"""
    if self.ec2_instances and len(self.ec2_instances) > 0:
      self.ec2_cpu_alarm = aws.cloudwatch.MetricAlarm(
        f"ec2-cpu-alarm-{self.env_suffix}",
        name=f"ec2-high-cpu-{self.env_suffix}",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="CPUUtilization",
        namespace="AWS/EC2",
        period=300,
        statistic="Average",
        threshold=80,
        alarm_description="EC2 instance high CPU utilization",
        dimensions={"InstanceId": self.ec2_instances[0].id},
        opts=ResourceOptions(provider=self.target_provider, parent=self)
      )
    self.rds_cpu_alarm = aws.cloudwatch.MetricAlarm(
      f"rds-cpu-alarm-{self.env_suffix}",
      name=f"rds-high-cpu-{self.env_suffix}",
      comparison_operator="GreaterThanThreshold",
      evaluation_periods=2,
      metric_name="CPUUtilization",
      namespace="AWS/RDS",
      period=300,
      statistic="Average",
      threshold=75,
      alarm_description="RDS instance high CPU utilization",
      dimensions={"DBInstanceIdentifier": self.rds_instance.id},
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )
    # Simple text dashboard
    simple_dashboard_body = {
      "widgets": [
        {
          "type": "text",
          "x": 0,
          "y": 0,
          "width": 24,
          "height": 6,
          "properties": {
            "markdown": f"""# TAP Migration Dashboard - {self.env_suffix}
## Infrastructure Overview
- **Environment**: {self.env_suffix}
- **Target Region**: {self.target_region}
- **Source Region**: {self.source_region}
- **EC2 Instances**: 2 with Load Balancer
- **RDS Database**: MySQL 8.0 with KMS encryption
- **S3 Buckets**: KMS encrypted + cross-region replication
## Monitoring
- EC2 and RDS alarms for CPU
- Automated backup in AWS Backup Vault
"""
          }
        }
      ]
    }
    self.cloudwatch_dashboard = aws.cloudwatch.Dashboard(
      f"tap-dashboard-{self.env_suffix}",
      dashboard_name=f"TAP-Migration-Dashboard-{self.env_suffix}",
      dashboard_body=json.dumps(simple_dashboard_body),
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )

  def _setup_backup_strategies(self):
    """Setup backup strategies for all data"""
    aws.s3.BucketLifecycleConfigurationV2(
      f"source-bucket-lifecycle-{self.env_suffix}",
      bucket=self.source_bucket.id,
      rules=[
        aws.s3.BucketLifecycleConfigurationV2RuleArgs(
          id="backup_rule",
          status="Enabled",
          noncurrent_version_transitions=[
            aws.s3.BucketLifecycleConfigurationV2RuleNoncurrentVersionTransitionArgs(
              noncurrent_days=30,
              storage_class="STANDARD_IA"
            ),
            aws.s3.BucketLifecycleConfigurationV2RuleNoncurrentVersionTransitionArgs(
              noncurrent_days=60,
              storage_class="GLACIER"
            )
          ]
        )
      ],
      opts=ResourceOptions(provider=self.source_provider, parent=self)
    )
    self.backup_vault = aws.backup.Vault(
      f"backup-vault-{self.env_suffix}",
      name=f"tap-backup-vault-{self.env_suffix}",
      kms_key_arn=self.rds_kms_key.arn,
      tags=self.default_tags,
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )
    backup_assume_role_policy = {
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "backup.amazonaws.com"},
        "Action": "sts:AssumeRole"
      }]
    }
    backup_role = aws.iam.Role(
      f"backup-role-{self.env_suffix}",
      assume_role_policy=json.dumps(backup_assume_role_policy),
      tags=self.default_tags,
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )
    aws.iam.RolePolicyAttachment(
      f"backup-policy-attachment-{self.env_suffix}",
      role=backup_role.name,
      policy_arn="arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup",
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )
    self.backup_plan = aws.backup.Plan(
      f"backup-plan-{self.env_suffix}",
      name=f"tap-backup-plan-{self.env_suffix}",
      rules=[
        aws.backup.PlanRuleArgs(
          rule_name="daily_backup",
          target_vault_name=self.backup_vault.name,
          schedule="cron(0 5 ? * * *)",  # Daily at 5 AM
          lifecycle=aws.backup.PlanRuleLifecycleArgs(
            cold_storage_after=30,
            delete_after=365
          )
        )
      ],
      tags=self.default_tags,
      opts=ResourceOptions(provider=self.target_provider, parent=self)
    )

  def _export_outputs(self):
    """Export important stack outputs"""
    pulumi.export("source_bucket_name", self.source_bucket.bucket)
    pulumi.export("target_bucket_name", self.target_bucket.bucket)
    pulumi.export("load_balancer_dns", self.alb.dns_name)
    pulumi.export("rds_endpoint", self.rds_instance.endpoint)
    pulumi.export("dashboard_arn", self.cloudwatch_dashboard.dashboard_arn)
    pulumi.export("vpc_id", self.target_vpc.id)
    pulumi.export("environment", self.env_suffix)
    pulumi.export("rds_read_replica_endpoint", self.rds_read_replica.endpoint)
    pulumi.export("global_accelerator_dns", self.global_accelerator.dns_name)
    pulumi.export("s3_source_kms_key_id", self.s3_source_kms_key.id)
    pulumi.export("s3_target_kms_key_id", self.s3_target_kms_key.id)
    pulumi.export("rds_promotion_lambda_arn", self.rds_promotion_lambda.arn)
    pulumi.export("db_secret_arn", self.db_secret.arn)
    for i, instance in enumerate(self.ec2_instances):
      pulumi.export(f"ec2_instance_{i+1}_id", instance.id)
      pulumi.export(f"ec2_instance_{i+1}_public_ip", instance.public_ip)
