import base64
import json

from cdktf import App, Fn, S3Backend, TerraformStack
from cdktf_cdktf_provider_aws.autoscaling_group import (
    AutoscalingGroup, AutoscalingGroupLaunchTemplate)
from cdktf_cdktf_provider_aws.backup_plan import (BackupPlan, BackupPlanRule,
                                                  BackupPlanRuleLifecycle)
from cdktf_cdktf_provider_aws.backup_selection import (
    BackupSelection, BackupSelectionSelectionTag)
from cdktf_cdktf_provider_aws.backup_vault import BackupVault
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.data_aws_ami import DataAwsAmi, DataAwsAmiFilter
from cdktf_cdktf_provider_aws.db_instance import DbInstance
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.iam_instance_profile import IamInstanceProfile
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import \
    IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.launch_template import (
    LaunchTemplate, LaunchTemplateIamInstanceProfile, LaunchTemplateMonitoring)
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_listener import (LbListener,
                                                  LbListenerDefaultAction)
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import \
    RouteTableAssociation
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import \
    S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.security_group import (SecurityGroup,
                                                     SecurityGroupEgress,
                                                     SecurityGroupIngress)
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.vpc import Vpc
from constructs import Construct


class TapStack(TerraformStack):
    def __init__(self, scope: Construct, ns: str, **kwargs):
        super().__init__(scope, ns)

        environment_suffix = kwargs.get("environment_suffix", "dev")
        state_bucket = kwargs.get("state_bucket", "default-state-bucket")
        state_bucket_region = kwargs.get("state_bucket_region", "us-east-1")
        aws_region = kwargs.get("aws_region", "us-east-1")
        default_tags = kwargs.get("default_tags", [{"tags": {}}])

        AwsProvider(self, "aws", region=aws_region, default_tags=default_tags)

        S3Backend(
            self,
            bucket=state_bucket,
            key=f"tap-stack-{environment_suffix}.tfstate",
            region=state_bucket_region
        )

        unique_suffix = Fn.substr(Fn.uuid(), 0, 8)

        secure_vpc = Vpc(
            self, "secureVpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True
        )

        az_a = "us-east-1a"
        az_b = "us-east-1b"

        public_subnet_a = Subnet(
            self, "publicSubnetA", vpc_id=secure_vpc.id, cidr_block="10.0.1.0/24",
            availability_zone=az_a, map_public_ip_on_launch=True
        )
        public_subnet_b = Subnet(
            self, "publicSubnetB", vpc_id=secure_vpc.id, cidr_block="10.0.2.0/24",
            availability_zone=az_b, map_public_ip_on_launch=True
        )
        private_subnet_a = Subnet(
            self, "privateSubnetA", vpc_id=secure_vpc.id, cidr_block="10.0.101.0/24",
            availability_zone=az_a
        )
        private_subnet_b = Subnet(
            self, "privateSubnetB", vpc_id=secure_vpc.id, cidr_block="10.0.102.0/24",
            availability_zone=az_b
        )

        igw = InternetGateway(self, "igw", vpc_id=secure_vpc.id)

        public_route_table = RouteTable(
            self, "publicRouteTable", vpc_id=secure_vpc.id,
            route=[RouteTableRoute(cidr_block="0.0.0.0/0", gateway_id=igw.id)]
        )
        RouteTableAssociation(
            self, "publicRtaA", subnet_id=public_subnet_a.id,
            route_table_id=public_route_table.id
        )
        RouteTableAssociation(
            self, "publicRtaB", subnet_id=public_subnet_b.id,
            route_table_id=public_route_table.id
        )

        # FIX: Removed "sg-" prefix from the security group names
        alb_sg = SecurityGroup(
            self, "albSg", name=f"alb-prod-{unique_suffix}", vpc_id=secure_vpc.id,
            description="Allow HTTP traffic to ALB",
            ingress=[SecurityGroupIngress(
                protocol="tcp", from_port=80, to_port=80, cidr_blocks=["0.0.0.0/0"]
            )],
            egress=[SecurityGroupEgress(
                protocol="-1", from_port=0, to_port=0, cidr_blocks=["0.0.0.0/0"]
            )]
        )
        app_sg = SecurityGroup(
            self, "appSg", name=f"app-prod-{unique_suffix}", vpc_id=secure_vpc.id,
            description="Allow traffic from ALB to App",
            ingress=[SecurityGroupIngress(
                protocol="tcp", from_port=80, to_port=80, security_groups=[alb_sg.id]
            )],
            egress=[SecurityGroupEgress(
                protocol="-1", from_port=0, to_port=0, cidr_blocks=["0.0.0.0/0"]
            )]
        )
        db_sg = SecurityGroup(
            self, "dbSg", name=f"db-prod-{unique_suffix}", vpc_id=secure_vpc.id,
            description="Allow traffic from App to DB",
            ingress=[SecurityGroupIngress(
                protocol="tcp", from_port=5432, to_port=5432, security_groups=[app_sg.id]
            )]
        )

        log_bucket = S3Bucket(
            self, "logBucket",
            bucket=f"secure-app-logs-{unique_suffix}",
            versioning={"enabled": True}
        )
        S3BucketPublicAccessBlock(
            self, "logBucketPab", bucket=log_bucket.id, block_public_acls=True,
            block_public_policy=True, ignore_public_acls=True, restrict_public_buckets=True
        )

        ec2_assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {"Service": "ec2.amazonaws.com"}
            }]
        }
        ec2_role = IamRole(
            self, "ec2Role", name=f"role-ec2-prod-{unique_suffix}",
            assume_role_policy=json.dumps(ec2_assume_role_policy)
        )
        ec2_policy_doc = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": ["s3:GetObject", "s3:PutObject"],
                    "Resource": f"{log_bucket.arn}/*"
                },
                {
                    "Effect": "Allow",
                    "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
                    "Resource": "arn:aws:logs:*:*:*"
                }
            ]
        }
        ec2_policy = IamPolicy(
            self, "ec2Policy", name=f"policy-ec2-prod-{unique_suffix}",
            policy=json.dumps(ec2_policy_doc)
        )
        IamRolePolicyAttachment(
            self, "ec2RoleAttachment", role=ec2_role.name, policy_arn=ec2_policy.arn
        )
        instance_profile = IamInstanceProfile(
            self, "instanceProfile", name=ec2_role.name, role=ec2_role.name
        )

        app_alb = Lb(
            self, "appAlb", name=f"alb-prod-{unique_suffix}", internal=False,
            load_balancer_type="application", security_groups=[alb_sg.id],
            subnets=[public_subnet_a.id, public_subnet_b.id]
        )
        target_group = LbTargetGroup(
            self, "targetGroup", name=f"tg-prod-{unique_suffix}", port=80,
            protocol="HTTP", vpc_id=secure_vpc.id
        )
        LbListener(
            self, "listener", load_balancer_arn=app_alb.arn, port=80, protocol="HTTP",
            default_action=[LbListenerDefaultAction(
                type="forward", target_group_arn=target_group.arn
            )]
        )

        ami = DataAwsAmi(
            self, "ami", most_recent=True, owners=["amazon"],
            filter=[DataAwsAmiFilter(name="name", values=["amzn2-ami-hvm-*-x86_64-gp2"])]
        )
        log_group = CloudwatchLogGroup(
            self, "logGroup", name=f"/aws/ec2/prod-app-{unique_suffix}", retention_in_days=14
        )

        user_data_script = (
            "#!/bin/bash\n"
            "yum install -y httpd\n"
            "systemctl start httpd\n"
            "systemctl enable httpd\n"
            "echo '<h1>Deployed via CDKTF Python</h1>' > /var/www/html/index.html"
        )
        user_data_encoded = base64.b64encode(user_data_script.encode("utf-8")).decode("utf-8")

        launch_template = LaunchTemplate(
            self, "launchTemplate", name=f"lt-prod-{unique_suffix}",
            image_id=ami.id,
            instance_type="t3.micro",
            iam_instance_profile=LaunchTemplateIamInstanceProfile(name=instance_profile.name),
            vpc_security_group_ids=[app_sg.id],
            monitoring=LaunchTemplateMonitoring(enabled=True),
            user_data=user_data_encoded
        )

        AutoscalingGroup(
            self, "asg",
            name=f"asg-prod-{unique_suffix}",
            launch_template=AutoscalingGroupLaunchTemplate(id=launch_template.id, version="$Latest"),
            min_size=2,
            max_size=4,
            desired_capacity=2,
            vpc_zone_identifier=[private_subnet_a.id, private_subnet_b.id],
            target_group_arns=[target_group.arn],
            tag=[{
                "key": "Environment",
                "value": environment_suffix,
                "propagateAtLaunch": True
            }]
        )

        db_subnet_group = DbSubnetGroup(
            self, "dbSubnetGroup", name=f"dbsg-prod-{unique_suffix}",
            subnet_ids=[private_subnet_a.id, private_subnet_b.id]
        )
        DbInstance(
            self, "dbInstance", identifier=f"db-prod-{unique_suffix}",
            allocated_storage=20,
            engine="postgres",
            engine_version="15",
            instance_class="db.t3.micro",
            db_name="webappdb",
            username="adminUser",
            password="MustBeChangedInSecretsManager1",
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[db_sg.id],
            storage_encrypted=True,
            multi_az=True,
            backup_retention_period=7,
            skip_final_snapshot=True
        )

        backup_assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {"Service": "backup.amazonaws.com"}
            }]
        }
        backup_role = IamRole(
            self, "backupRole", name=f"role-backup-prod-{unique_suffix}",
            assume_role_policy=json.dumps(backup_assume_role_policy)
        )
        IamRolePolicyAttachment(
            self, "backupRoleAttachment", role=backup_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
        )
        backup_vault = BackupVault(self, "backupVault", name=f"bv-prod-{unique_suffix}")
        backup_plan = BackupPlan(
            self, "backupPlan", name=f"bp-prod-{unique_suffix}",
            rule=[BackupPlanRule(
                rule_name="DailyBackups",
                target_vault_name=backup_vault.name,
                schedule="cron(0 5 * * ? *)",
                lifecycle=BackupPlanRuleLifecycle(delete_after=35)
            )]
        )
        BackupSelection(
            self, "backupSelection", name="TagBasedSelection",
            iam_role_arn=backup_role.arn,
            plan_id=backup_plan.id,
            selection_tag=[BackupSelectionSelectionTag(
                type="STRINGEQUALS", key="Environment", value=environment_suffix
            )]
        )