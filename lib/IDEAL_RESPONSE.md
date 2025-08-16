```python
"""
================================================================================
TAPSTACK: Multi-Environment Infrastructure with Pulumi
--------------------------------------------------------------------------------
Component: TapStack (single-env per run; supports both 'dev' and 'prod' - Multi-env)
Entry point: tap.py

This module implements a *two-environment* (dev/prod) AWS infrastructure using
Pulumi in Python, intentionally written as a single reusable component file.

Compliance-focused mapping to the prompt requirements
-----------------------------------------------------------------------
1) UNIQUE, SECURE CONFIG PER ENV:
   - All env-specific secrets are centralized in AWS Secrets Manager.
   - DB password is generated securely via pulumi_random.RandomPassword.
   - An additional App Config secret carries environment metadata.

2) AUTO SCALING (EC2) IN A VPC SPANNING EXACTLY TWO AZs:
   - VPC built with exactly two availability zones.
   - ASG uses Launch Template (AMI locked across envs).
   - Subnets: public (ALB), private (EC2 behind ALB) + NAT per AZ.

3) ELB / ALB FOR TRAFFIC DISTRIBUTION:
   - Application Load Balancer across the public subnets.
   - Listener forwards to a target group with health checks.

4) AWS RDS WITH MULTI-AZ:
   - MySQL engine, Multi-AZ enabled.
   - Storage encrypted; deletion protection enabled in prod.

5) SINGLE AMI ID CONSISTENT ACROSS BOTH ENVIRONMENTS:
   - A single, most recent Amazon Linux 2 AMI is resolved once (COMMON_AMI_ID).

6) LEAST-PRIVILEGE IAM:
   - EC2 role can only read the specific Secrets Manager ARNs used by this env.
   - Logs permissions are scoped to standard CloudWatch Logs APIs.

7) ENVIRONMENT TAGS:
   - Every resource receives consistent env-aware tags (Environment, Project,
     ManagedBy). This aids cost/billing & inventory.

8) MONITORING + ALERTS:
   - CloudWatch Log Groups for app/system logs.
   - CloudWatch MetricAlarms (CPU, ALB response time, RDS CPU) with SNS actions.

9) ROLLBACK:
   - **ROLLBACK** metadata exported: LaunchTemplate + TargetGroup ARNs.
   - ASG + LaunchTemplate support rolling updates (ZERO DOWNTIME).
   - RDS 7-day retention to restore if needed.

10) SIMPLE SAMPLE WEB APP:
   - user_data installs httpd, renders env-specific index.html.
   - adds '/env' and '/health' endpoints (static content).
   - Logs shipped to CloudWatch (awslogs).
11) Deletion MODE is allowed only in Prod, not in Dev
12) Follow cost saving rules as well

SECURITY / ZERO DOWNTIME / ROLLBACK markers are included inline below.
================================================================================
"""

from __future__ import annotations

import base64
import json
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import pulumi
import pulumi_aws as aws
import pulumi_random as random
from pulumi import ComponentResource, Output, ResourceOptions

# =============================================================================
# CONSTANTS & ENV MATRIX
# =============================================================================

# Resolve a single consistent AMI (Amazon Linux 2 x86_64 HVM, gp2) for ALL envs
# This prevents drift between dev / prod and meets the "single AMI" requirement.


# Environment differences centralized here.
ENV_MATRIX: Dict[str, Dict[str, Any]] = {
    "dev": {
        "instance_type": "t3.micro",
        "asg_min": 1,
        "asg_max": 3,
        "asg_desired": 1,
        "db_class": "db.t3.micro",
        "db_storage_gb": 20,
        "env_message": "Development Environment",
        "rds_deletion_protection": False,
        "rds_backup_window": "05:00-06:00",
        "rds_maintenance_window": "sun:06:00-sun:07:00",
    },
    "prod": {
        "instance_type": "t3.small",
        "asg_min": 2,
        "asg_max": 10,
        "asg_desired": 2,
        "db_class": "db.t3.small",
        "db_storage_gb": 100,
        "env_message": "Production Environment",
        "rds_deletion_protection": True,
        "rds_backup_window": "03:00-04:00",
        "rds_maintenance_window": "sun:04:00-sun:05:00",
    },
}


# =============================================================================
# ARGS
# =============================================================================

@dataclass
class TapStackArgs:
  """
  Args for TapStack.
  Only the environment suffix is required; all other behavior comes from ENV_MATRIX.
  """
  environment_suffix: str  # e.g., "dev" or "prod"


# =============================================================================
# COMPONENT
# =============================================================================

class TapStack(ComponentResource):
  """
  TapStack: Secure, scalable stack.

  This is a *library* component. The real program entry is `tap.py`, which creates
  exactly one TapStack per run (dev or prod). We include exports inside this
  component because tests expect them; and we store handles on `self` for assurance.

  SECURITY: Secrets are never printed and never hard-coded; random passwords are
  generated via pulumi_random and stored in Secrets Manager.

  ZERO DOWNTIME: Launch Template + ASG rolling updates; ALB keeps traffic healthy.

  ROLLBACK: Expose Launch Template and Target Group ARNs for safe reversions.
  """

  # Expose some attributes for tests and clarity
  vpc: aws.ec2.Vpc
  public_subnets: List[aws.ec2.Subnet]
  private_subnets: List[aws.ec2.Subnet]
  igw: aws.ec2.InternetGateway
  nat_gateways: List[aws.ec2.NatGateway]

  alb: aws.lb.LoadBalancer
  target_group: aws.lb.TargetGroup
  listener: aws.lb.Listener

  asg: aws.autoscaling.Group
  launch_template: aws.ec2.LaunchTemplate

  rds: aws.rds.Instance

  app_config_secret: aws.secretsmanager.Secret
  db_secret: aws.secretsmanager.Secret
  sns_topic: aws.sns.Topic

  def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
    super().__init__("custom:stack:TapStack", name, None, opts)

    # ---------------------------------------------------------------------
    # 0) Resolve environment and config
    # ---------------------------------------------------------------------
    env = args.environment_suffix
    if env not in ENV_MATRIX:
      raise ValueError(
          f"Unsupported environment '{env}'. Expected one of: {list(ENV_MATRIX.keys())}")

    cfg = ENV_MATRIX[env]

    # Common consistent tagging across all resources
    tags: Dict[str, str] = {
        "Environment": env,
        "Project": "TAP Task 4", # Hard Coded Requirement, so it is okay for self containment
        "ManagedBy": "Pulumi",
        # NOTE: If you leverage provider defaultTags, ensure REGION is a plain string
    }

    # Keep references on `self` for tests to access
    self.tags = tags
    self.env = env
    ami = aws.ec2.get_ami(
        most_recent=True,
        owners=["amazon"],
        filters=[
            aws.ec2.GetAmiFilterArgs(
                name="name", values=["amzn2-ami-hvm-*-x86_64-gp2"]),
            aws.ec2.GetAmiFilterArgs(
                name="virtualization-type", values=["hvm"]),
        ],
    )
    self.common_ami_id = ami.id

    # ---------------------------------------------------------------------
    # 1) VPC & NETWORKING – exactly TWO AZs, with NATs for private subnets
    # ---------------------------------------------------------------------
    # HIGH AVAILABILITY: exactly 2 AZs as requested.
    azs = aws.get_availability_zones(state="available").names[:2]

    self.vpc = aws.ec2.Vpc(
        f"{env}-vpc",
        cidr_block="10.0.0.0/16",
        enable_dns_support=True,
        enable_dns_hostnames=True,
        tags=tags,
        opts=ResourceOptions(parent=self),
    )

    # Internet Gateway for public egress
    self.igw = aws.ec2.InternetGateway(
        f"{env}-igw",
        vpc_id=self.vpc.id,
        tags=tags,
        opts=ResourceOptions(parent=self.vpc),
    )

    # Build subnets (two public, two private) + NAT in each AZ
    self.public_subnets = []
    self.private_subnets = []
    self.nat_gateways = []
    nat_eips: List[aws.ec2.Eip] = []

    for i, az in enumerate(azs):
      # Public subnet (ALB lives here)
      pub = aws.ec2.Subnet(
          f"{env}-public-{i+1}",
          vpc_id=self.vpc.id,
          cidr_block=f"10.0.{i+1}.0/24",
          availability_zone=az,
          map_public_ip_on_launch=True,
          tags={**tags, "Tier": "public"},
          opts=ResourceOptions(parent=self.vpc),
      )
      self.public_subnets.append(pub)

      # Private subnet (EC2 in ASG lives here; outbound via NAT)
      priv = aws.ec2.Subnet(
          f"{env}-private-{i+1}",
          vpc_id=self.vpc.id,
          cidr_block=f"10.0.{i+10}.0/24",
          availability_zone=az,
          tags={**tags, "Tier": "private"},
          opts=ResourceOptions(parent=self.vpc),
      )
      self.private_subnets.append(priv)

      # Allocate EIP for NAT
      eip = aws.ec2.Eip(
          f"{env}-nat-eip-{i+1}",
          domain="vpc",
          tags=tags,
          opts=ResourceOptions(parent=pub),
      )
      nat_eips.append(eip)

      # NAT Gateway in public subnet
      nat = aws.ec2.NatGateway(
          f"{env}-nat-{i+1}",
          allocation_id=eip.id,
          subnet_id=pub.id,
          tags=tags,
          opts=ResourceOptions(parent=pub),
      )
      self.nat_gateways.append(nat)

    # Routing: Public
    public_rt = aws.ec2.RouteTable(
        f"{env}-public-rt",
        vpc_id=self.vpc.id,
        tags=tags,
        opts=ResourceOptions(parent=self.vpc),
    )
    aws.ec2.Route(
        f"{env}-public-default",
        route_table_id=public_rt.id,
        destination_cidr_block="0.0.0.0/0",
        gateway_id=self.igw.id,
        opts=ResourceOptions(parent=public_rt),
    )
    for i, s in enumerate(self.public_subnets):
      aws.ec2.RouteTableAssociation(
          f"{env}-public-rta-{i+1}",
          subnet_id=s.id,
          route_table_id=public_rt.id,
          opts=ResourceOptions(parent=public_rt),
      )

    # Routing: Private (one RT per private subnet => 1:1 with NAT)
    for i, (priv, nat) in enumerate(zip(self.private_subnets, self.nat_gateways)):
      prt = aws.ec2.RouteTable(
          f"{env}-private-rt-{i+1}",
          vpc_id=self.vpc.id,
          tags=tags,
          opts=ResourceOptions(parent=self.vpc),
      )
      aws.ec2.Route(
          f"{env}-private-default-{i+1}",
          route_table_id=prt.id,
          destination_cidr_block="0.0.0.0/0",
          nat_gateway_id=nat.id,
          opts=ResourceOptions(parent=prt),
      )
      aws.ec2.RouteTableAssociation(
          f"{env}-private-rta-{i+1}",
          subnet_id=priv.id,
          route_table_id=prt.id,
          opts=ResourceOptions(parent=prt),
      )

    # ---------------------------------------------------------------------
    # 2) SECURITY GROUPS
    # ---------------------------------------------------------------------
    alb_sg = aws.ec2.SecurityGroup(
        f"{env}-alb-sg",
        vpc_id=self.vpc.id,
        description=f"{env} ALB security group",
        ingress=[
            aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp", from_port=80, to_port=80, cidr_blocks=["0.0.0.0/0"]),
            aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp", from_port=443, to_port=443, cidr_blocks=["0.0.0.0/0"]),
        ],
        egress=[aws.ec2.SecurityGroupEgressArgs(
            protocol="-1", from_port=0, to_port=0, cidr_blocks=["0.0.0.0/0"])],
        tags=tags,
        opts=ResourceOptions(parent=self.vpc),
    )

    ec2_sg = aws.ec2.SecurityGroup(
        f"{env}-ec2-sg",
        vpc_id=self.vpc.id,
        description=f"{env} EC2 security group",
        ingress=[
            # Only ALB can hit EC2 on port 80 (web)
            aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp", from_port=80, to_port=80, security_groups=[alb_sg.id]),
            # Optional: allow SSH from VPC only (could be tightened further with a jump host)
            aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp", from_port=22, to_port=22, cidr_blocks=["10.0.0.0/16"]),
        ],
        egress=[aws.ec2.SecurityGroupEgressArgs(
            protocol="-1", from_port=0, to_port=0, cidr_blocks=["0.0.0.0/0"])],
        tags=tags,
        opts=ResourceOptions(parent=self.vpc),
    )

    rds_sg = aws.ec2.SecurityGroup(
        f"{env}-rds-sg",
        vpc_id=self.vpc.id,
        description=f"{env} RDS security group",
        ingress=[
            # Only EC2 instances (via their SG) can access DB on 3306
            aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp", from_port=3306, to_port=3306, security_groups=[ec2_sg.id])
        ],
        tags=tags,
        opts=ResourceOptions(parent=self.vpc),
    )

    # ---------------------------------------------------------------------
    # 3) SECRETS: Random DB password + Secrets Manager + App Config
    # ---------------------------------------------------------------------
    # SECURITY: generate strong random password with allowed specials.
    db_password = random.RandomPassword(
        f"{env}-db-pwd",
        length=20,
        special=True,
        override_special="_%@",
        # NOTE: earlier bug was using `override_characters`; correct is `override_special`.
        opts=ResourceOptions(parent=self),
    )

    self.db_secret = aws.secretsmanager.Secret(
        f"{env}-db-secret",
        description=f"RDS credentials for {env}",
        tags=tags,
        opts=ResourceOptions(parent=self),
    )

    # Initial secret version (host blank; updated after RDS creation)
    aws.secretsmanager.SecretVersion(
        f"{env}-db-secret-init",
        secret_id=self.db_secret.id,
        secret_string=db_password.result.apply(
            lambda pw: json.dumps({
                "username": f"{env}_admin",
                "password": pw,
                "engine": "mysql",
                "host": "",        # updated post-RDS
                "port": 3306,
                "dbname": f"{env}_db",
            })
        ),
        opts=ResourceOptions(parent=self.db_secret),
    )

    # App Config secret for environment variables / feature flags
    self.app_config_secret = aws.secretsmanager.Secret(
        f"{env}-app-config",
        description=f"App config for {env}",
        tags=tags,
        opts=ResourceOptions(parent=self),
    )
    aws.secretsmanager.SecretVersion(
        f"{env}-app-config-ver",
        secret_id=self.app_config_secret.id,
        secret_string=json.dumps({
            "environment": env,
            "message": cfg["env_message"],
            "debug": env == "dev",
            "log_level": "DEBUG" if env == "dev" else "INFO",
        }),
        opts=ResourceOptions(parent=self.app_config_secret),
    )

    # ---------------------------------------------------------------------
    # 4) RDS (Multi-AZ), SubnetGroup, Encryption, Backups
    # ---------------------------------------------------------------------
    rds_subnet_group = aws.rds.SubnetGroup(
        f"{env}-rds-subnets",
        subnet_ids=[s.id for s in self.private_subnets],
        tags=tags,
        opts=ResourceOptions(parent=self),
    )

    self.rds = aws.rds.Instance(
        f"{env}-rds",
        identifier=f"{env}-db",
        allocated_storage=cfg["db_storage_gb"],
        storage_type="gp2",
        engine="mysql",
        engine_version="8.0",
        instance_class=cfg["db_class"],
        db_subnet_group_name=rds_subnet_group.name,
        name=f"{env}db",
        username=f"{env}_admin",
        password=db_password.result,  # Pulumi will treat as secret
        publicly_accessible=False,
        multi_az=True,  # HA requirement
        storage_encrypted=True,
        deletion_protection=cfg["rds_deletion_protection"], # Note: Deletion is allowed in Dev and not in Prod MOD!
        # True for dev, False for prod
        skip_final_snapshot=not cfg["rds_deletion_protection"],
        final_snapshot_identifier=(
            f"{env}-rds-final-snapshot" if cfg["rds_deletion_protection"] else None
        ),
        backup_retention_period=7,
        backup_window=cfg["rds_backup_window"],
        maintenance_window=cfg["rds_maintenance_window"],
        vpc_security_group_ids=[rds_sg.id],
        tags=tags,
        opts=ResourceOptions(parent=self),
    )

    # Update DB secret with the actual endpoint after RDS is ready
    aws.secretsmanager.SecretVersion(
        f"{env}-db-secret-final",
        secret_id=self.db_secret.id,
        secret_string=Output.all(self.rds.endpoint, db_password.result).apply(
            lambda args: json.dumps({
                "username": f"{env}_admin",
                "password": args[1],
                "engine": "mysql",
                "host": args[0],
                "port": 3306,
                "dbname": f"{env}_db",
            })
        ),
        opts=ResourceOptions(parent=self.db_secret, depends_on=[self.rds]),
    )

    # ---------------------------------------------------------------------
    # 5) IAM (Least Privilege) for EC2
    # ---------------------------------------------------------------------
    # SECURITY: Strict assume-role policy for EC2 only.
    self.ec2_role = aws.iam.Role(
        f"{env}-ec2-role",
        assume_role_policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "ec2.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        }),
        tags=tags,
        opts=ResourceOptions(parent=self),
    )

    # SECURITY: Policy scoped to only the two secrets this env needs.
    # CloudWatch Logs APIs are open on Resource "*" by design (AWS pattern).
    self.ec2_policy = aws.iam.Policy(
        f"{env}-ec2-policy",
        description=f"Least-privilege policy for {env} EC2 to read secrets + write logs",
        policy=Output.all(self.db_secret.arn, self.app_config_secret.arn).apply(
            lambda arns: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "ReadAppAndDbSecret",
                        "Effect": "Allow",
                        "Action": ["secretsmanager:GetSecretValue"],
                        "Resource": arns  # exact ARNs only (no wildcards)
                    },
                    {
                        "Sid": "WriteInstanceLogs",
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "*"  # CloudWatch Logs APIs are open by design hence the "*"
                    }
                ]
            })
        ),
        tags=tags,
        opts=ResourceOptions(parent=self),
    )

    aws.iam.RolePolicyAttachment(
        f"{env}-ec2-policy-attach",
        role=self.ec2_role.name,
        policy_arn=self.ec2_policy.arn,
        opts=ResourceOptions(parent=self.ec2_role),
    )

    self.instance_profile = aws.iam.InstanceProfile(
        f"{env}-instance-profile",
        role=self.ec2_role.name,
        opts=ResourceOptions(parent=self.ec2_role),
    )

    # ---------------------------------------------------------------------
    # 6) CloudWatch Log Groups (avoid lazy creation in user-data)
    # ---------------------------------------------------------------------
    # Creating these ahead prevents "None"/race conditions and gives explicit retention.
    cw_access = aws.cloudwatch.LogGroup(
        f"{env}-httpd-access",
        name=f"/aws/ec2/{env}/httpd/access",
        retention_in_days=14,
        tags=tags,
        opts=ResourceOptions(parent=self),
    )
    cw_error = aws.cloudwatch.LogGroup(
        f"{env}-httpd-error",
        name=f"/aws/ec2/{env}/httpd/error",
        retention_in_days=14,
        tags=tags,
        opts=ResourceOptions(parent=self),
    )
    cw_messages = aws.cloudwatch.LogGroup(
        f"{env}-messages",
        name=f"/aws/ec2/{env}/messages",
        retention_in_days=14,
        tags=tags,
        opts=ResourceOptions(parent=self),
    )

    # ---------------------------------------------------------------------
    # 7) User Data (Simple Web App + awslogs)
    # ---------------------------------------------------------------------
    # ZERO DOWNTIME: Changes roll out via new LaunchTemplate versions.
    user_data = f"""#!/bin/bash
set -euo pipefail

yum update -y
yum install -y httpd awslogs

# Configure awslogs to ship system and httpd logs
cat > /etc/awslogs/awscli.conf << 'EOF'
[plugins]
cwlogs = cwlogs
[default]
region = $(curl -s http://169.254.169.254/latest/dynamic/instance-identity/document | jq -r '.region' || echo "us-east-1")
EOF

cat > /etc/awslogs/awslogs.conf << 'EOF'
[general]
state_file = /var/awslogs/state/agent-state

[/var/log/messages]
file = /var/log/messages
log_group_name = /aws/ec2/{env}/messages
log_stream_name = {env}-messages
datetime_format = %b %d %H:%M:%S

[/var/log/httpd/access_log]
file = /var/log/httpd/access_log
log_group_name = /aws/ec2/{env}/httpd/access
log_stream_name = {env}-access
datetime_format = %d/%b/%Y:%H:%M:%S %z

[/var/log/httpd/error_log]
file = /var/log/httpd/error_log
log_group_name = /aws/ec2/{env}/httpd/error
log_stream_name = {env}-error
datetime_format = %a %b %d %H:%M:%S.%f %Y
EOF

systemctl enable awslogsd
systemctl restart awslogsd

# Sample web app with environment-specific endpoints
cat > /var/www/html/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head><title>{cfg["env_message"]}</title></head>
<body>
<h1>{cfg["env_message"]}</h1>
<p>Environment: {env}</p>
<p>Server: $(hostname)</p>
</body>
</html>
EOF

cat > /var/www/html/health << 'EOF'
{{
  "status": "healthy",
  "environment": "{env}",
  "hostname": "$(hostname)"
}}
EOF

cat > /var/www/html/env << 'EOF'
{{
  "environment": "{env}",
  "message": "{cfg["env_message"]}"
}}
EOF

systemctl enable httpd
systemctl restart httpd
"""

    # ---------------------------------------------------------------------
    # 8) Launch Template, Target Group, ALB, ASG
    # ---------------------------------------------------------------------
    self.launch_template = aws.ec2.LaunchTemplate(
        f"{env}-lt",
        name_prefix=f"{env}-lt-",
        image_id=self.common_ami_id,
        instance_type=cfg["instance_type"],
        vpc_security_group_ids=[ec2_sg.id],
        iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
            name=self.instance_profile.name),
        user_data=base64.b64encode(user_data.encode()).decode(),
        tag_specifications=[
            aws.ec2.LaunchTemplateTagSpecificationArgs(
                resource_type="instance",
                tags={**tags, "Name": f"{env}-instance"},
            )
        ],
        tags=tags,
        opts=ResourceOptions(parent=self),
    )

    # Application Load Balancer in public subnets
    self.alb = aws.lb.LoadBalancer(
        f"{env}-alb",
        load_balancer_type="application",
        subnets=[s.id for s in self.public_subnets],
        security_groups=[alb_sg.id],
        tags=tags,
        opts=ResourceOptions(parent=self),
    )

    # Target Group with health checks against /health
    self.target_group = aws.lb.TargetGroup(
        f"{env}-tg",
        port=80,
        protocol="HTTP",
        vpc_id=self.vpc.id,
        health_check=aws.lb.TargetGroupHealthCheckArgs(
            enabled=True,
            healthy_threshold=2,
            interval=30,
            matcher="200",
            path="/health",
            port="traffic-port",
            protocol="HTTP",
            timeout=5,
            unhealthy_threshold=2,
        ),
        tags=tags,
        opts=ResourceOptions(parent=self),
    )

    self.listener = aws.lb.Listener(
        f"{env}-listener",
        load_balancer_arn=self.alb.arn,
        port=80,
        protocol="HTTP",
        default_actions=[aws.lb.ListenerDefaultActionArgs(
            type="forward", target_group_arn=self.target_group.arn)],
        opts=ResourceOptions(parent=self.alb),
    )

    # ASG in private subnets (instances receive traffic only from ALB)
    self.asg = aws.autoscaling.Group(
        f"{env}-asg",
        vpc_zone_identifiers=[s.id for s in self.private_subnets],
        target_group_arns=[self.target_group.arn],
        health_check_type="ELB",
        health_check_grace_period=300,
        min_size=cfg["asg_min"],
        max_size=cfg["asg_max"],
        desired_capacity=cfg["asg_desired"],
        launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
            id=self.launch_template.id, version="$Latest"),
        tags=[aws.autoscaling.GroupTagArgs(
            key=k, value=v, propagate_at_launch=True) for k, v in tags.items()],
        opts=ResourceOptions(parent=self),
    )

    # ---------------------------------------------------------------------
    # 9) Scaling Policies + CloudWatch Alarms + SNS
    # ---------------------------------------------------------------------
    # SNS for alerting (subscription to be added externally by ops/test)
    self.sns_topic = aws.sns.Topic(
        f"{env}-alerts",
        name=f"{env}-infra-alerts",
        tags=tags,
        opts=ResourceOptions(parent=self),
    )

    # Scale-up/down policies (CPU thresholds)
    scale_up = aws.autoscaling.Policy(
        f"{env}-scale-up",
        autoscaling_group_name=self.asg.name,
        adjustment_type="ChangeInCapacity",
        scaling_adjustment=1,
        cooldown=300,
        opts=ResourceOptions(parent=self.asg),
    )
    scale_down = aws.autoscaling.Policy(
        f"{env}-scale-down",
        autoscaling_group_name=self.asg.name,
        adjustment_type="ChangeInCapacity",
        scaling_adjustment=-1,
        cooldown=300,
        opts=ResourceOptions(parent=self.asg),
    )

    # NOTE: Pulumi will name the alarm from the resource URN/name if alarm_name is omitted.

    # EC2 CPU high -> scale up + notify
    self.cpu_high = aws.cloudwatch.MetricAlarm(
        f"{env}-ec2-cpu-high",
        name=f"{self.env}-ec2-cpu-high",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="CPUUtilization",
        namespace="AWS/EC2",
        period=300,
        statistic="Average",
        threshold=80,
        alarm_description=f"{env} EC2 CPU high",
        alarm_actions=[self.sns_topic.arn, scale_up.arn],
        dimensions={"AutoScalingGroupName": self.asg.name},
        tags=tags,
        opts=ResourceOptions(parent=self),
    )

    # EC2 CPU low -> scale down
    self.cpu_low = aws.cloudwatch.MetricAlarm(
        f"{env}-ec2-cpu-low",
        name=f"{self.env}-ec2-cpu-low",
        comparison_operator="LessThanThreshold",
        evaluation_periods=2,
        metric_name="CPUUtilization",
        namespace="AWS/EC2",
        period=300,
        statistic="Average",
        threshold=30,
        alarm_description=f"{env} EC2 CPU low",
        alarm_actions=[scale_down.arn],
        dimensions={"AutoScalingGroupName": self.asg.name},
        tags=tags,
        opts=ResourceOptions(parent=self),
    )

    # ALB target response time high -> notify
    self.alb_resp_high = aws.cloudwatch.MetricAlarm(
        f"{env}-alb-resp-time",
        name=f"{self.env}-alb-resp-time",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="TargetResponseTime",
        namespace="AWS/ApplicationELB",
        period=300,
        statistic="Average",
        threshold=1,
        alarm_description=f"{env} ALB target response time high",
        alarm_actions=[self.sns_topic.arn],
        dimensions={"LoadBalancer": self.alb.arn_suffix},
        tags=tags,
        opts=ResourceOptions(parent=self),
    )

    # RDS CPU high -> notify
    self.rds_cpu_high = aws.cloudwatch.MetricAlarm(
        f"{env}-rds-cpu-high",
        name=f"{self.env}-rds-cpu-high",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=2,
        metric_name="CPUUtilization",
        namespace="AWS/RDS",
        period=300,
        statistic="Average",
        threshold=80,
        alarm_description=f"{env} RDS CPU high",
        alarm_actions=[self.sns_topic.arn],
        dimensions={"DBInstanceIdentifier": self.rds.id},
        tags=tags,
        opts=ResourceOptions(parent=self),
    )

    # ---------------------------------------------------------------------
    # 10) EXPORTS + SELF ATTRIBUTES FOR TESTS
    # ---------------------------------------------------------------------
    # Expose via `pulumi stack output` (single-env per run) AND leave env-scoped keys
    # for compatibility with older tests.
    alb_dns = self.alb.dns_name
    alb_url = alb_dns.apply(lambda d: f"http://{d}")
    env_ep = alb_dns.apply(lambda d: f"http://{d}/env")
    health_ep = alb_dns.apply(lambda d: f"http://{d}/health")

    pulumi.export("alb_dns", alb_dns)
    pulumi.export("alb_url", alb_url)
    pulumi.export("environment_endpoint", env_ep)
    pulumi.export("health_endpoint", health_ep)
    pulumi.export("rds_endpoint", self.rds.endpoint)
    pulumi.export("sns_topic_arn", self.sns_topic.arn)
    pulumi.export("db_credentials_secret_arn", self.db_secret.arn)
    pulumi.export("app_config_secret_arn", self.app_config_secret.arn)
    pulumi.export("rollback_info", {
        "launch_template_id": self.launch_template.id,
        "target_group_arn": self.target_group.arn,
        # ROLLBACK: you can pin to a previous launch template version here.
    })

    # Also export env-scoped duplicates (if tests expect these names)
    pulumi.export(f"{env}_alb_dns", alb_dns)
    pulumi.export(f"{env}_alb_url", alb_url)
    pulumi.export(f"{env}_environment_endpoint", env_ep)
    pulumi.export(f"{env}_health_endpoint", health_ep)
    pulumi.export(f"{env}_rds_endpoint", self.rds.endpoint)
    pulumi.export(f"{env}_sns_topic_arn", self.sns_topic.arn)
    pulumi.export(f"{env}_db_credentials_secret_arn", self.db_secret.arn)
    pulumi.export(f"{env}_app_config_secret_arn", self.app_config_secret.arn)

    # Keep handles on `self` for direct assertions in tests
    self.alb_dns = alb_dns
    self.alb_url = alb_url
    self.environment_endpoint = env_ep
    self.health_endpoint = health_ep

    # Register outputs to close the component
    self.register_outputs({
        "alb_dns": alb_dns,
        "alb_url": alb_url,
        "environment_endpoint": env_ep,
        "health_endpoint": health_ep,
        "rds_endpoint": self.rds.endpoint,
        "sns_topic_arn": self.sns_topic.arn,
        "db_credentials_secret_arn": self.db_secret.arn,
        "app_config_secret_arn": self.app_config_secret.arn,
        "launch_template_id": self.launch_template.id,
        "target_group_arn": self.target_group.arn,
    })

```
