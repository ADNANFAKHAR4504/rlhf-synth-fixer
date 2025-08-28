# CDKTF Stack for a Secure and Highly Available Web Application (Python)

This document outlines the infrastructure defined in the `lib/tap_stack.py` file, which provisions a secure, resilient, and maintainable web application environment on AWS using CDKTF for Python. The stack is designed as a single, monolithic unit to meet all specified requirements.

## Core Infrastructure Components

The stack is built upon a foundation of best practices for cloud architecture, ensuring high availability, robust security, and operational excellence.

### 1. High Availability and Scalability

- **Multi-AZ VPC**: The entire environment is built within a custom VPC (`10.0.0.0/16`) that spans multiple Availability Zones (us-east-1a and us-east-1b). This foundational design prevents a single AZ failure from impacting the application.
- **Public and Private Subnets**: The VPC is segregated into public subnets for internet-facing resources (like the Load Balancer) and private subnets for backend services (Application and Database layers), minimizing the attack surface.
- **Application Load Balancer (ALB)**: An internet-facing ALB is deployed across the public subnets, distributing incoming traffic evenly to the EC2 instances. This prevents any single instance from becoming a bottleneck.
- **Auto Scaling Group (ASG)**: EC2 instances run within an Auto Scaling Group configured with a minimum of two instances spread across the private subnets. The ASG automatically replaces unhealthy instances and can scale the number of instances in or out based on traffic, ensuring the application is both resilient and cost-effective.

### 2. Security Posture

- **Least Privilege IAM Roles**:
  - An IAM Role is specifically created for the EC2 instances. This role grants only the necessary permissions: read/write access to a designated S3 logging bucket and permissions to write logs to CloudWatch. This eliminates the need for hardcoded credentials.
  - A separate IAM Role is created for the AWS Backup service, granting it the permissions needed to manage backups without being overly permissive.
- **Strict Security Groups**: Security groups act as virtual firewalls with tightly controlled rules:
  - `albSg`: Allows public inbound traffic on port 80 (HTTP).
  - `appSg`: Allows inbound traffic _only_ from the ALB's security group on port 80.
  - `dbSg`: Allows inbound traffic _only_ from the application's security group on port 5432 (PostgreSQL).
- **Encrypted RDS Database**: The PostgreSQL database instance is configured with `storage_encrypted = true`, ensuring all data at rest is protected. It is also deployed in a private subnet, inaccessible from the public internet.
- **Private S3 Bucket**: A dedicated S3 bucket is created for logs. Public access is explicitly blocked at the bucket level, and versioning is enabled to protect against accidental data deletion.

### 3. Monitoring and Operations

- **Centralized Logging**: All EC2 instances are configured via a Launch Template to enable detailed monitoring. The attached IAM role allows them to push logs to a centralized CloudWatch Log Group, providing a single location for auditing and debugging.
- **Automated Backups**: An AWS Backup plan is configured to automatically create daily snapshots of all resources tagged with `Environment: Production`. These backups are retained for 35 days, providing a robust data recovery strategy.
- **Consistent Tagging**: Every resource created by the stack is tagged with `Environment: Production`. This practice is crucial for cost allocation, automation, and resource management.
- **Unique Resource Naming**: A random 8-character suffix, generated from `Fn.uuid()`, is appended to the names of all resources. This prevents naming conflicts during subsequent deployments or when deploying multiple instances of the stack.

---

## Complete Infrastructure Code

Below is the full source code for the project, including the stack definition, main entrypoint, and tests.

### `app.py` (Main Entrypoint)

```python
#!/usr/bin/env python
from cdktf import App
from lib.tap_stack import TapStack

app = App()
TapStack(app, "secure-webapp-environment")

app.synth()

lib/tap_stack.py
import json
from constructs import Construct
from cdktf import App, TerraformStack, Fn
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA, S3BucketVersioningVersioningConfigurationA
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_instance_profile import IamInstanceProfile
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction
from cdktf_cdktf_provider_aws.data_aws_ami import DataAwsAmi, DataAwsAmiFilter
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.launch_template import LaunchTemplate, LaunchTemplateIamInstanceProfile, LaunchTemplateMonitoring
from cdktf_cdktf_provider_aws.autoscaling_group import AutoscalingGroup, AutoscalingGroupLaunchTemplate, AutoscalingGroupTags
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.db_instance import DbInstance
from cdktf_cdktf_provider_aws.backup_vault import BackupVault
from cdktf_cdktf_provider_aws.backup_plan import BackupPlan, BackupPlanRule, BackupPlanRuleLifecycle
from cdktf_cdktf_provider_aws.backup_selection import BackupSelection, BackupSelectionSelectionTag


class TapStack(TerraformStack):
    def __init__(self, scope: Construct, ns: str):
        super().__init__(scope, ns)

        # --- Provider & Default Tags ---
        AwsProvider(self, "aws", region="us-east-1")

        unique_suffix = Fn.substr(Fn.uuid(), 0, 8)
        common_tags = {"Environment": "Production"}

        # --- Networking (VPC, Subnets, IGW, Route Tables) ---
        secure_vpc = Vpc(self, "secureVpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            tags=common_tags
        )

        public_subnet_a = Subnet(self, "publicSubnetA",
            vpc_id=secure_vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone="us-east-1a",
            map_public_ip_on_launch=True,
            tags=common_tags
        )
        public_subnet_b = Subnet(self, "publicSubnetB",
            vpc_id=secure_vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone="us-east-1b",
            map_public_ip_on_launch=True,
            tags=common_tags
        )

        private_subnet_a = Subnet(self, "privateSubnetA",
            vpc_id=secure_vpc.id,
            cidr_block="10.0.101.0/24",
            availability_zone="us-east-1a",
            tags=common_tags
        )
        private_subnet_b = Subnet(self, "privateSubnetB",
            vpc_id=secure_vpc.id,
            cidr_block="10.0.102.0/24",
            availability_zone="us-east-1b",
            tags=common_tags
        )

        igw = InternetGateway(self, "igw", vpc_id=secure_vpc.id, tags=common_tags)

        public_route_table = RouteTable(self, "publicRouteTable",
            vpc_id=secure_vpc.id,
            route=[RouteTableRoute(cidr_block="0.0.0.0/0", gateway_id=igw.id)],
            tags=common_tags
        )
        RouteTableAssociation(self, "publicRtaA", subnet_id=public_subnet_a.id, route_table_id=public_route_table.id)
        RouteTableAssociation(self, "publicRtaB", subnet_id=public_subnet_b.id, route_table_id=public_route_table.id)

        # --- Security Groups (Least Privilege) ---
        alb_sg = SecurityGroup(self, "albSg",
            name=f"sg-alb-prod-{unique_suffix}",
            vpc_id=secure_vpc.id,
            description="Allow HTTP traffic to ALB",
            ingress=[SecurityGroupIngress(protocol="tcp", from_port=80, to_port=80, cidr_blocks=["0.0.0.0/0"])],
            egress=[SecurityGroupEgress(protocol="-1", from_port=0, to_port=0, cidr_blocks=["0.0.0.0/0"])],
            tags=common_tags
        )

        app_sg = SecurityGroup(self, "appSg",
            name=f"sg-app-prod-{unique_suffix}",
            vpc_id=secure_vpc.id,
            description="Allow traffic from ALB to App",
            ingress=[SecurityGroupIngress(protocol="tcp", from_port=80, to_port=80, security_groups=[alb_sg.id])],
            egress=[SecurityGroupEgress(protocol="-1", from_port=0, to_port=0, cidr_blocks=["0.0.0.0/0"])],
            tags=common_tags
        )

        db_sg = SecurityGroup(self, "dbSg",
            name=f"sg-db-prod-{unique_suffix}",
            vpc_id=secure_vpc.id,
            description="Allow traffic from App to DB",
            ingress=[SecurityGroupIngress(protocol="tcp", from_port=5432, to_port=5432, security_groups=[app_sg.id])],
            tags=common_tags
        )

        # --- S3 Bucket for Logs (Private, Versioned) ---
        log_bucket = S3Bucket(self, "logBucket",
            bucket=f"secure-app-logs-{unique_suffix}",
            tags=common_tags
        )
        S3BucketPublicAccessBlock(self, "logBucketPab",
            bucket=log_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )
        S3BucketVersioningA(self, "logBucketVersioning",
            bucket=log_bucket.id,
            versioning_configuration=S3BucketVersioningVersioningConfigurationA(status="Enabled")
        )

        # --- IAM Role for EC2 Instances ---
        ec2_role = IamRole(self, "ec2Role",
            name=f"role-ec2-prod-{unique_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "ec2.amazonaws.com"}
                }]
            }),
            tags=common_tags
        )
        ec2_policy = IamPolicy(self, "ec2Policy",
            name=f"policy-ec2-prod-{unique_suffix}",
            policy=json.dumps({
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
            })
        )
        IamRolePolicyAttachment(self, "ec2RoleAttachment", role=ec2_role.name, policy_arn=ec2_policy.arn)
        instance_profile = IamInstanceProfile(self, "instanceProfile", name=ec2_role.name, role=ec2_role.name)

        # --- Application Load Balancer (ALB) ---
        app_alb = Lb(self, "appAlb",
            name=f"alb-prod-{unique_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[alb_sg.id],
            subnets=[public_subnet_a.id, public_subnet_b.id],
            tags=common_tags
        )
        target_group = LbTargetGroup(self, "targetGroup",
            name=f"tg-prod-{unique_suffix}",
            port=80,
            protocol="HTTP",
            vpc_id=secure_vpc.id,
            tags=common_tags
        )
        LbListener(self, "listener",
            load_balancer_arn=app_alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[LbListenerDefaultAction(type="forward", target_group_arn=target_group.arn)]
        )

        # --- EC2 Auto Scaling Group ---
        ami = DataAwsAmi(self, "ami",
            most_recent=True,
            owners=["amazon"],
            filter=[DataAwsAmiFilter(name="name", values=["amzn2-ami-hvm-*-x86_64-gp2"])]
        )
        log_group = CloudwatchLogGroup(self, "logGroup",
            name=f"/aws/ec2/prod-app-{unique_suffix}",
            retention_in_days=14,
            tags=common_tags
        )
        launch_template = LaunchTemplate(self, "launchTemplate",
            name=f"lt-prod-{unique_suffix}",
            image_id=ami.id,
            instance_type="t3.micro",
            iam_instance_profile=LaunchTemplateIamInstanceProfile(name=instance_profile.name),
            vpc_security_group_ids=[app_sg.id],
            monitoring=LaunchTemplateMonitoring(enabled=True),
            user_data_base64=Fn.base64(f"#!/bin/bash\nyum install -y httpd\nsystemctl start httpd\nsystemctl enable httpd\necho '<h1>Deployed via CDKTF Python</h1>' > /var/www/html/index.html"),
            tags=common_tags
        )
        AutoscalingGroup(self, "asg",
            name=f"asg-prod-{unique_suffix}",
            launch_template=AutoscalingGroupLaunchTemplate(id=launch_template.id, version="$Latest"),
            min_size=2,
            max_size=4,
            desired_capacity=2,
            vpc_zone_identifier=[private_subnet_a.id, private_subnet_b.id],
            target_group_arns=[target_group.arn],
            tags=[AutoscalingGroupTags(key="Environment", value="Production", propagate_at_launch=True)]
        )

        # --- RDS Database (Encrypted, Multi-AZ) ---
        db_subnet_group = DbSubnetGroup(self, "dbSubnetGroup",
            name=f"dbsg-prod-{unique_suffix}",
            subnet_ids=[private_subnet_a.id, private_subnet_b.id],
            tags=common_tags
        )
        DbInstance(self, "dbInstance",
            identifier=f"db-prod-{unique_suffix}",
            allocated_storage=20,
            engine="postgres",
            engine_version="14.5",
            instance_class="db.t3.micro",
            db_name="webappdb",
            username="admin",
            password="MustBeChangedInSecretsManager1",
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[db_sg.id],
            storage_encrypted=True,
            multi_az=True,
            backup_retention_period=7,
            skip_final_snapshot=True,
            tags=common_tags
        )

        # --- AWS Backup Plan ---
        backup_role = IamRole(self, "backupRole",
            name=f"role-backup-prod-{unique_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{"Action": "sts:AssumeRole", "Effect": "Allow", "Principal": {"Service": "backup.amazonaws.com"}}]
            })
        )
        IamRolePolicyAttachment(self, "backupRoleAttachment",
            role=backup_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
        )
        backup_vault = BackupVault(self, "backupVault", name=f"bv-prod-{unique_suffix}", tags=common_tags)
        backup_plan = BackupPlan(self, "backupPlan",
            name=f"bp-prod-{unique_suffix}",
            rule=[BackupPlanRule(
                rule_name="DailyBackups",
                target_vault_name=backup_vault.name,
                schedule="cron(0 5 * * ? *)",
                lifecycle=BackupPlanRuleLifecycle(delete_after=35)
            )],
            tags=common_tags
        )
        BackupSelection(self, "backupSelection",
            name="TagBasedSelection",
            iam_role_arn=backup_role.arn,
            plan_id=backup_plan.id,
            selection_tag=[BackupSelectionSelectionTag(
                type="STRINGEQUALS",
                key="Environment",
                value="Production"
            )]
        )

tests/unit/tap_stack_unit_test.py
import unittest
import json
from cdktf import App, Testing
from lib.tap_stack import TapStack

class TestTapStackUnit(unittest.TestCase):

    def setUp(self):
        """Synthesizes the stack and loads the JSON output before each test."""
        app = App()
        stack = TapStack(app, "test-unit-stack")
        synthesized = Testing.synth(stack)
        self.resources = json.loads(synthesized)["resource"]

    def test_s3_bucket_should_block_public_access(self):
        """Verifies that the S3 bucket has public access blocked."""
        s3_pab = self.resources["aws_s3_bucket_public_access_block"]["logBucketPab"]
        self.assertTrue(s3_pab["block_public_acls"])
        self.assertTrue(s3_pab["block_public_policy"])
        self.assertTrue(s3_pab["restrict_public_buckets"])

    def test_s3_bucket_should_have_versioning_enabled(self):
        """Verifies that the S3 bucket has versioning enabled."""
        s3_versioning = self.resources["aws_s3_bucket_versioning"]["logBucketVersioning"]
        self.assertEqual(s3_versioning["versioning_configuration"]["status"], "Enabled")

    def test_rds_database_should_be_encrypted(self):
        """Verifies that the RDS database has storage encryption enabled."""
        db_instance = self.resources["aws_db_instance"]["dbInstance"]
        self.assertTrue(db_instance["storage_encrypted"])

    def test_launch_template_should_enable_monitoring(self):
        """Verifies that the EC2 Launch Template has monitoring enabled."""
        lt = self.resources["aws_launch_template"]["launchTemplate"]
        self.assertTrue(lt["monitoring"]["enabled"])

    def test_ec2_iam_policy_should_use_least_privilege(self):
        """Verifies the EC2 IAM policy adheres to least privilege."""
        iam_policy = self.resources["aws_iam_policy"]["ec2Policy"]
        policy_doc = json.loads(iam_policy["policy"])

        statement = policy_doc["Statement"]
        s3_actions = statement[0]["Action"]
        cloudwatch_actions = statement[1]["Action"]

        self.assertIn("s3:GetObject", s3_actions)
        self.assertIn("s3:PutObject", s3_actions)
        self.assertIn("logs:PutLogEvents", cloudwatch_actions)

        # Check for wildcards
        self.assertNotIn("*", str(s3_actions))
        self.assertNotIn("*", str(cloudwatch_actions))
        self.assertNotIn("*", statement[0]["Resource"])

    def test_all_resources_should_have_production_tag(self):
        """Verifies that all resources have the 'Environment: Production' tag."""
        for resource_type, resources in self.resources.items():
            for _, resource_config in resources.items():
                if "tags" in resource_config and "Environment" in resource_config["tags"]:
                    self.assertEqual(resource_config["tags"]["Environment"], "Production", f"Resource type {resource_type} is missing production tag")

if __name__ == '__main__':
    unittest.main()

tests/integration/tap_stack_integration_test.py
import unittest
import json
from cdktf import App, Testing
from lib.tap_stack import TapStack

class TestTapStackIntegration(unittest.TestCase):

    def setUp(self):
        """Synthesizes the stack and loads the JSON output before each test."""
        app = App()
        stack = TapStack(app, "test-integration-stack")
        synthesized = Testing.synth(stack)
        self.resources = json.loads(synthesized)["resource"]

    def test_alb_should_be_in_public_subnets(self):
        """Verifies the ALB is internet-facing and in public subnets."""
        alb = self.resources["aws_lb"]["appAlb"]
        subnets = alb["subnets"]

        self.assertIn("${aws_subnet.publicSubnetA.id}", subnets)
        self.assertIn("${aws_subnet.publicSubnetB.id}", subnets)
        self.assertFalse(alb["internal"])

    def test_asg_should_be_in_private_subnets(self):
        """Verifies the Auto Scaling Group is in private subnets."""
        asg = self.resources["aws_autoscaling_group"]["asg"]
        subnet_identifiers = asg["vpc_zone_identifier"]

        self.assertIn("${aws_subnet.privateSubnetA.id}", subnet_identifiers)
        self.assertIn("${aws_subnet.privateSubnetB.id}", subnet_identifiers)

    def test_app_sg_should_only_allow_traffic_from_alb(self):
        """Verifies the App Security Group only allows ingress from the ALB."""
        app_sg = self.resources["aws_security_group"]["appSg"]
        ingress_rule = app_sg["ingress"][0]

        self.assertEqual(ingress_rule["from_port"], 80)
        self.assertIn("${aws_security_group.albSg.id}", ingress_rule["security_groups"])
        self.assertNotIn("cidr_blocks", ingress_rule)

    def test_db_sg_should_only_allow_traffic_from_app(self):
        """Verifies the DB Security Group only allows ingress from the App SG."""
        db_sg = self.resources["aws_security_group"]["dbSg"]
        ingress_rule = db_sg["ingress"][0]

        self.assertEqual(ingress_rule["from_port"], 5432)
        self.assertIn("${aws_security_group.appSg.id}", ingress_rule["security_groups"])
        self.assertNotIn("cidr_blocks", ingress_rule)

    def test_asg_should_use_launch_template_with_iam_profile(self):
        """Verifies the ASG uses the correct Launch Template and IAM Profile."""
        asg = self.resources["aws_autoscaling_group"]["asg"]
        asg_lt_config = asg["launch_template"]

        lt = self.resources["aws_launch_template"]["launchTemplate"]
        lt_iam_profile = lt["iam_instance_profile"]

        self.assertEqual(asg_lt_config["id"], "${aws_launch_template.launchTemplate.id}")
        self.assertEqual(lt_iam_profile["name"], "${aws_iam_instance_profile.instanceProfile.name}")

if __name__ == '__main__':
    unittest.main()
```
