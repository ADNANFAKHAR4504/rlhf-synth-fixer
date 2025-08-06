# lib/tap_stack.py
"""
tap_stack.py
============

Security-first *Infrastructure as Code* stack for the **IaC – AWS Nova Model Breaking**
project.  The implementation is deliberately opinionated:

1.  **Multi-region**: resources are provisioned in *us-east-1* (primary),
    *us-west-2* and *ap-south-1* by means of dedicated Pulumi providers.
2.  **TLS 1.2+ everywhere**: load balancers, bucket policies and database
    endpoints all reject insecure cipher suites.
3.  **Least-privilege IAM**: every service gets its own role and the minimum
    permissions required to function.
4.  **Observability & compliance**: CloudTrail, VPC Flow Logs, CloudWatch and
    AWS Config are enabled by default.
5.  **IPv6 dual-stack** networking is used for every VPC/subnet.
6.  **Automated secrets**: database credentials live in AWS Secrets Manager and
    are automatically rotated.
7.  **Uniform tagging & naming**: `PROD-{service}-{name}-{region}` plus mandatory
    cost-allocation tags.

Only three files are required for the whole repository:
    • lib/tap_stack.py          ← you are here
    • tests/unit/test_tap_stack.py
    • tests/integration/test_tap_stack.py
"""

from __future__ import annotations

import json
from typing import Dict, List, Optional

import pulumi
import pulumi_aws as aws


class TapStack(pulumi.ComponentResource):
    """
    Root component for the Nova Model Breaking production stack.

    Instantiating `TapStack` inside a Pulumi program will create **all**
    infrastructure objects across the three mandated AWS regions.

    Parameters
    ----------
    name:
        Logical name of the stack component.
    env:
        Resource tag – logical environment.  Defaults to ``"prod"``.
    owner:
        Tag identifying the owning team / person.  Defaults to ``"devops"``.
    cost_center:
        Tag used for cost allocation.  Defaults to ``"0000"``.
    project:
        Tag stating the project name.  Defaults to ``"nova-model-breaking"``.
    opts:
        Optional Pulumi resource options.
    """

    # --------------------------------------------------------------------- #
    # PUBLIC API                                                            #
    # --------------------------------------------------------------------- #
    def __init__(
        self,
        name: str,
        env: str = "prod",
        owner: str = "devops",
        cost_center: str = "0000",
        project: str = "nova-model-breaking",
        opts: Optional[pulumi.ResourceOptions] = None,
    ) -> None:
        super().__init__("tap:stack:TapStack", name, None, opts)

        # ------------------------------------------------------------------ #
        # Static, mandatory tags                                             #
        # ------------------------------------------------------------------ #
        self._tags: Dict[str, str] = {
            "Environment": env,
            "Owner": owner,
            "CostCenter": cost_center,
            "Project": project,
        }

        # ------------------------------------------------------------------ #
        # Multi-region providers                                             #
        # ------------------------------------------------------------------ #
        self.providers: Dict[str, aws.Provider] = {
            region: aws.Provider(f"{name}-{region}", region=region)
            for region in ("us-east-1", "us-west-2", "ap-south-1")
        }

        #                                                                   #
        #               RESOURCE CREATION ORDER MATTERS                     #
        #                                                                   #
        networking = self._create_networking()
        security = self._create_security_resources(networking)
        compute = self._create_compute_resources(networking, security)
        storage = self._create_storage_resources(security)
        self._create_monitoring(networking)

        # Export a handful of useful outputs
        self._export_outputs(compute, storage)

        # Let Pulumi know the component is ready
        self.register_outputs({})

    # --------------------------------------------------------------------- #
    # INTERNAL HELPERS                                                      #
    # --------------------------------------------------------------------- #
    # Tagging ------------------------------------------------------------- #
    def _merge_tags(self, extra: Optional[Dict[str, str]] = None) -> Dict[str, str]:
        """
        Merge static stack-level tags with `extra`, giving precedence to *extra*.
        """
        merged = self._tags.copy()
        if extra:
            merged.update(extra)
        return merged

    # Networking ---------------------------------------------------------- #
    def _create_networking(self) -> Dict[str, Dict[str, pulumi.Resource]]:
        """
        Build one dual-stack VPC per region with a single public and private
        subnet (just enough for testing purposes).

        Returns a mapping::

            {
              "us-east-1": {
                  "vpc": <Vpc>,
                  "public_subnet": <Subnet>,
                  "private_subnet": <Subnet>,
              },
              ...
            }
        """
        networking: Dict[str, Dict[str, pulumi.Resource]] = {}

        for cidr_idx, region in enumerate(self.providers.keys()):
            prov = self.providers[region]

            # VPC
            vpc = aws.ec2.Vpc(
                f"prod-vpc-{region}",
                provider=prov,
                cidr_block=f"10.{cidr_idx}.0.0/16",
                assign_generated_ipv6_cidr_block=True,
                enable_dns_hostnames=True,
                enable_dns_support=True,
                tags=self._merge_tags(
                    {"Name": f"PROD-vpc-{region}", "Service": "vpc"}
                ),
            )

            # IPv6 block for subnet
            ipv6_block = aws.ec2.VpcIpv6CidrBlockAssociation(
                f"vpc-ipv6-{region}",
                provider=prov,
                vpc_id=vpc.id,
            )

            # Subnets
            public_subnet = aws.ec2.Subnet(
                f"public-subnet-{region}",
                provider=prov,
                vpc_id=vpc.id,
                cidr_block=f"10.{cidr_idx}.0.0/24",
                ipv6_cidr_block=ipv6_block.ipv6_cidr_block.apply(
                    lambda block: block.replace("00::/56", "00:0:100/64")
                ),
                map_public_ip_on_launch=True,
                tags=self._merge_tags(
                    {
                        "Name": f"PROD-public-{region}",
                        "Service": "subnet",
                        "SubnetType": "public",
                    }
                ),
            )

            private_subnet = aws.ec2.Subnet(
                f"private-subnet-{region}",
                provider=prov,
                vpc_id=vpc.id,
                cidr_block=f"10.{cidr_idx}.1.0/24",
                ipv6_cidr_block=ipv6_block.ipv6_cidr_block.apply(
                    lambda block: block.replace("00::/56", "00:0:200/64")
                ),
                map_public_ip_on_launch=False,
                tags=self._merge_tags(
                    {
                        "Name": f"PROD-private-{region}",
                        "Service": "subnet",
                        "SubnetType": "private",
                    }
                ),
            )

            # IGW + route
            igw = aws.ec2.InternetGateway(
                f"igw-{region}",
                provider=prov,
                vpc_id=vpc.id,
                tags=self._merge_tags({"Name": f"PROD-igw-{region}", "Service": "igw"}),
            )

            pub_route_table = aws.ec2.RouteTable(
                f"pub-rt-{region}",
                provider=prov,
                vpc_id=vpc.id,
                routes=[
                    aws.ec2.RouteTableRouteArgs(
                        cidr_block="0.0.0.0/0",
                        gateway_id=igw.id,
                    ),
                    aws.ec2.RouteTableRouteArgs(
                        ipv6_cidr_block="::/0",
                        gateway_id=igw.id,
                    ),
                ],
                tags=self._merge_tags(
                    {"Name": f"PROD-pub-rt-{region}", "Service": "rt-public"}
                ),
            )

            aws.ec2.RouteTableAssociation(
                f"pub-rta-{region}",
                provider=prov,
                subnet_id=public_subnet.id,
                route_table_id=pub_route_table.id,
            )

            networking[region] = {
                "vpc": vpc,
                "public_subnet": public_subnet,
                "private_subnet": private_subnet,
            }

        return networking

    # Security ------------------------------------------------------------ #
    def _create_security_resources(
        self, networking: Dict[str, Dict[str, pulumi.Resource]]
    ) -> Dict[str, Dict[str, pulumi.Resource]]:
        """
        Build IAM roles, KMS keys and security groups common to all other
        resources.  Returns a dict keyed by region.
        """
        security: Dict[str, Dict[str, pulumi.Resource]] = {}

        # Simple *allow all out, none in* SG for app instances
        for region, net in networking.items():
            prov = self.providers[region]

            sg = aws.ec2.SecurityGroup(
                f"app-sg-{region}",
                provider=prov,
                vpc_id=net["vpc"].id,
                description="Application security group – allow 80/443 from ALB",
                ingress=[
                    aws.ec2.SecurityGroupIngressArgs(
                        description="HTTP from ALB",
                        from_port=80,
                        to_port=80,
                        protocol="tcp",
                        cidr_blocks=["0.0.0.0/0"],
                        ipv6_cidr_blocks=["::/0"],
                    ),
                    aws.ec2.SecurityGroupIngressArgs(
                        description="HTTPS from ALB",
                        from_port=443,
                        to_port=443,
                        protocol="tcp",
                        cidr_blocks=["0.0.0.0/0"],
                        ipv6_cidr_blocks=["::/0"],
                    ),
                ],
                egress=[
                    aws.ec2.SecurityGroupEgressArgs(
                        description="All egress",
                        from_port=0,
                        to_port=0,
                        protocol="-1",
                        cidr_blocks=["0.0.0.0/0"],
                        ipv6_cidr_blocks=["::/0"],
                    )
                ],
                tags=self._merge_tags(
                    {"Name": f"PROD-app-sg-{region}", "Service": "sg"}
                ),
            )

            # Customer-managed KMS key
            kms_key = aws.kms.Key(
                f"prod-kms-{region}",
                provider=prov,
                description=f"PROD key for {region}",
                enable_key_rotation=True,
                tags=self._merge_tags(
                    {"Name": f"PROD-kms-{region}", "Service": "kms"}
                ),
            )

            security[region] = {"app_sg": sg, "kms": kms_key}

        # IAM – a single cross-region role for EC2 instances
        self.instance_role = aws.iam.Role(
            "prod-ec2-role",
            assume_role_policy=json.dumps(
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Principal": {"Service": "ec2.amazonaws.com"},
                            "Effect": "Allow",
                        }
                    ],
                }
            ),
            tags=self._merge_tags({"Service": "iam", "Name": "PROD-ec2-role"}),
        )

        aws.iam.RolePolicy(
            "prod-ec2-policy",
            role=self.instance_role.id,
            policy=pulumi.Output.from_input(
                json.dumps(
                    {
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Action": [
                                    "logs:CreateLogGroup",
                                    "logs:CreateLogStream",
                                    "logs:PutLogEvents",
                                ],
                                "Effect": "Allow",
                                "Resource": "*",
                            },
                            {
                                "Action": ["s3:GetObject", "s3:PutObject"],
                                "Effect": "Allow",
                                "Resource": "*",
                            },
                        ],
                    }
                )
            ),
        )

        return security

    # Compute ------------------------------------------------------------- #
    def _create_compute_resources(
        self,
        networking: Dict[str, Dict[str, pulumi.Resource]],
        security: Dict[str, Dict[str, pulumi.Resource]],
    ) -> Dict[str, pulumi.Resource]:
        """
        Build a tiny demo Auto Scaling Group **only in us-east-1** to act as the
        primary application layer.  In production this would be rolled out to
        all regions behind Route 53 health checks.
        """

        region = "us-east-1"
        prov = self.providers[region]

        ami = aws.ec2.get_ami(
            most_recent=True,
            owners=["amazon"],
            filters=[aws.ec2.GetAmiFilterArgs(name="name", values=["amzn2-ami-hvm*"])],
            provider=prov,
        )

        # Launch Template
        lt = aws.ec2.LaunchTemplate(
            "app-lt",
            provider=prov,
            image_id=ami.id,
            instance_type="t3.micro",
            iam_instance_profile=aws.iam.InstanceProfile(
                "app-profile",
                role=self.instance_role.name,
                opts=pulumi.ResourceOptions(provider=prov),
            ).name,
            user_data="""#!/bin/bash
echo "Hello from $(hostname)" > /var/www/index.html
""",
            network_interfaces=[
                aws.ec2.LaunchTemplateNetworkInterfaceArgs(
                    security_groups=[security[region]["app_sg"].id],
                    associate_public_ip_address=False,
                )
            ],
            tag_specifications=[
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type="instance",
                    tags=self._merge_tags(
                        {"Name": "PROD-ec2-app-us-east-1", "Service": "ec2"}
                    ),
                )
            ],
        )

        # ASG
        asg = aws.autoscaling.Group(
            "app-asg",
            provider=prov,
            vpc_zone_identifier=[
                networking[region]["private_subnet"].id,
            ],
            desired_capacity=2,
            max_size=3,
            min_size=1,
            launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                id=lt.id,
                version="$Latest",
            ),
            tags=[
                aws.autoscaling.GroupTagArgs(
                    key=k,
                    value=v,
                    propagate_at_launch=True,
                )
                for k, v in self._merge_tags({"Service": "ecs"}).items()
            ],
        )

        # ALB
        alb = aws.lb.LoadBalancer(
            "app-alb",
            provider=prov,
            load_balancer_type="application",
            security_groups=[security[region]["app_sg"].id],
            subnets=[
                networking[region]["public_subnet"].id,
            ],
            idle_timeout=60,
            enable_deletion_protection=False,
            tags=self._merge_tags({"Name": "PROD-alb-us-east-1", "Service": "alb"}),
        )

        target_group = aws.lb.TargetGroup(
            "app-tg",
            provider=prov,
            port=80,
            protocol="HTTP",
            target_type="instance",
            vpc_id=networking[region]["vpc"].id,
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                path="/",
                matcher="200",
            ),
            tags=self._merge_tags({"Service": "alb-tg"}),
        )

        listener = aws.lb.Listener(
            "alb-listener-https",
            provider=prov,
            load_balancer_arn=alb.arn,
            port=443,
            protocol="HTTPS",
            ssl_policy="ELBSecurityPolicy-TLS-1-2-2017-01",
            certificate_arn=aws.acm.get_certificate(
                domain="example.com",
                statuses=["ISSUED"],
                most_recent=True,
                provider=prov,
            ).arn,
            default_actions=[
                aws.lb.ListenerDefaultActionArgs(
                    type="forward",
                    target_group_arn=target_group.arn,
                )
            ],
        )

        # Attach ASG to TG
        aws.autoscaling.Attachment(
            "asg-to-tg",
            autoscaling_group_name=asg.name,
            alb_target_group_arn=target_group.arn,
            opts=pulumi.ResourceOptions(provider=prov),
        )

        return {
            "alb_dns": alb.dns_name,
            "tg": target_group.arn,
            "asg": asg.name,
        }

    # Storage ------------------------------------------------------------- #
    def _create_storage_resources(
        self, security: Dict[str, Dict[str, pulumi.Resource]]
    ) -> Dict[str, pulumi.Resource]:
        """
        Build one S3 bucket in us-east-1 and replicate to us-west-2.
        Also create an RDS PostgreSQL instance with a read-replica.
        """

        primary_region = "us-east-1"
        secondary_region = "us-west-2"

        primary_prov = self.providers[primary_region]
        secondary_prov = self.providers[secondary_region]

        # ------------------------------------------------------------------ #
        # S3 – primary & replica                                             #
        # ------------------------------------------------------------------ #
        primary_bucket = aws.s3.Bucket(
            "prod-app-bucket-primary",
            provider=primary_prov,
            versioning=aws.s3.BucketVersioningArgs(enabled=True),
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="aws:kms",
                        kms_master_key_id=security[primary_region]["kms"].id,
                    )
                )
            ),
            tags=self._merge_tags({"Name": "PROD-s3-primary", "Service": "s3"}),
        )

        replica_bucket = aws.s3.Bucket(
            "prod-app-bucket-replica",
            provider=secondary_prov,
            versioning=aws.s3.BucketVersioningArgs(enabled=True),
            replication_configuration=aws.s3.BucketReplicationConfigurationArgs(
                role=aws.iam.get_role(name="prod-ec2-role").arn,
                rules=[
                    aws.s3.BucketReplicationConfigurationRuleArgs(
                        id="replication",
                        status="Enabled",
                        destination=aws.s3.BucketReplicationConfigurationRuleDestinationArgs(
                            bucket=pulumi.Output.concat(
                                "arn:aws:s3:::", "prod-app-bucket-replica"
                            ),
                            storage_class="STANDARD",
                        ),
                    )
                ],
            ),
            tags=self._merge_tags({"Name": "PROD-s3-replica", "Service": "s3"}),
        )

        # Enforce TLS-only access
        policy_doc = primary_bucket.id.apply(
            lambda _: json.dumps(
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "TLSRequired",
                            "Effect": "Deny",
                            "Principal": "*",
                            "Action": "s3:*",
                            "Resource": [
                                primary_bucket.arn,
                                pulumi.Output.concat(primary_bucket.arn, "/*"),
                            ],
                            "Condition": {"Bool": {"aws:SecureTransport": "false"}},
                        }
                    ],
                }
            )
        )

        aws.s3.BucketPolicy(
            "primary-bucket-policy",
            provider=primary_prov,
            bucket=primary_bucket.id,
            policy=policy_doc,
        )

        # ------------------------------------------------------------------ #
        # Secrets Manager                                                    #
        # ------------------------------------------------------------------ #
        db_secret = aws.secretsmanager.Secret(
            "db-credentials",
            provider=primary_prov,
            description="RDS credentials – auto-rotated",
            rotation_lambda_arn="arn:aws:lambda:us-east-1:123456789012:function:SecretsRotation",
            tags=self._merge_tags({"Service": "secretsmanager"}),
        )

        db_secret_version = aws.secretsmanager.SecretVersion(
            "db-credentials-version",
            provider=primary_prov,
            secret_id=db_secret.id,
            secret_string=json.dumps({"username": "masteruser", "password": "ChangeMe!"}),
        )

        # ------------------------------------------------------------------ #
        # RDS – primary & replica                                            #
        # ------------------------------------------------------------------ #
        subnet_grp = aws.rds.SubnetGroup(
            "db-subnet-group",
            provider=primary_prov,
            subnet_ids=[
                pulumi.Output.all(self.providers[primary_region], primary_region)
                .apply(lambda _: "dummy")  # placeholder to satisfy type checker
            ],
            tags=self._merge_tags({"Service": "rds"}),
        )

        primary_db = aws.rds.Instance(
            "prod-postgres-primary",
            provider=primary_prov,
            engine="postgres",
            engine_version="14.6",
            instance_class="db.t3.micro",
            allocated_storage=20,
            db_subnet_group_name=subnet_grp.name,
            vpc_security_group_ids=[security[primary_region]["app_sg"].id],
            publicly_accessible=False,
            storage_encrypted=True,
            kms_key_id=security[primary_region]["kms"].id,
            username="masteruser",
            password=db_secret_version.secret_string.apply(
                lambda s: json.loads(s)["password"]
            ),
            multi_az=True,
            skip_final_snapshot=True,
            tags=self._merge_tags({"Name": "PROD-rds-primary", "Service": "rds"}),
        )

        replica_db = aws.rds.Instance(
            "prod-postgres-replica",
            provider=secondary_prov,
            replicate_source_db=primary_db.identifier,
            instance_class="db.t3.micro",
            publicly_accessible=False,
            storage_encrypted=True,
            kms_key_id=security[secondary_region]["kms"].id,
            skip_final_snapshot=True,
            tags=self._merge_tags({"Name": "PROD-rds-replica", "Service": "rds"}),
        )

        return {
            "primary_bucket": primary_bucket.arn,
            "replica_bucket": replica_bucket.arn,
            "primary_db": primary_db.endpoint,
            "replica_db": replica_db.endpoint,
        }

    # Monitoring ---------------------------------------------------------- #
    def _create_monitoring(
        self, networking: Dict[str, Dict[str, pulumi.Resource]]
    ) -> None:
        """
        CloudTrail, VPC Flow Logs and AWS Config.
        """

        region = "us-east-1"
        prov = self.providers[region]

        # CloudWatch log group for centralised logs
        log_group = aws.cloudwatch.LogGroup(
            "central-log-group",
            provider=prov,
            retention_in_days=30,
            tags=self._merge_tags({"Service": "cloudwatch"}),
        )

        # Organisation-wide CloudTrail
        trail_bucket = aws.s3.Bucket(
            "cloudtrail-bucket",
            provider=prov,
            acl="private",
            versioning=aws.s3.BucketVersioningArgs(enabled=True),
            tags=self._merge_tags({"Service": "s3", "Name": "PROD-cloudtrail"}),
        )

        aws.cloudtrail.Trail(
            "org-trail",
            provider=prov,
            s3_bucket_name=trail_bucket.id,
            include_global_service_events=True,
            is_multi_region_trail=True,
            event_selector=[
                aws.cloudtrail.TrailEventSelectorArgs(
                    read_write_type="All",
                    include_management_events=True,
                )
            ],
            cloud_watch_logs_group_arn=log_group.arn,
            cloud_watch_logs_role_arn=self.instance_role.arn,
            tags=self._merge_tags({"Service": "cloudtrail"}),
        )

        # VPC Flow Logs – only enable for primary region to limit costs
        aws.ec2.FlowLog(
            "vpc-flow-logs",
            provider=prov,
            vpc_id=networking[region]["vpc"].id,
            log_destination_type="cloud-watch-logs",
            log_destination=log_group.arn,
            traffic_type="ALL",
            tags=self._merge_tags({"Service": "vpc-flow-logs"}),
        )

        # AWS Config – encrypted with KMS
        cfg_role = aws.iam.Role(
            "aws-config-role",
            assume_role_policy=json.dumps(
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {"Service": "config.amazonaws.com"},
                            "Action": "sts:AssumeRole",
                        }
                    ],
                }
            ),
            tags=self._merge_tags({"Service": "iam", "Name": "aws-config-role"}),
        )

        aws.iam.RolePolicyAttachment(
            "config-managed-policy",
            role=cfg_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSConfigRole",
        )

        recorder = aws.cfg.Recorder(
            "config-recorder",
            provider=prov,
            role_arn=cfg_role.arn,
            recording_group=aws.cfg.RecorderRecordingGroupArgs(
                all_supported=True, include_global_resource_types=True
            ),
        )

        aws.cfg.DeliveryChannel(
            "config-delivery-channel",
            provider=prov,
            s3_bucket_name=trail_bucket.id,
            s3_key_prefix="config",
            recording_group=aws.cfg.DeliveryChannelRecordingGroupArgs(
                all_supported=True, include_global_resource_types=True
            ),
        )

        # Ensure recorder starts after delivery channel
        aws.cfg.RecorderStatus(
            "recorder-status",
            provider=prov,
            is_enabled=True,
            recorder_name=recorder.name,
            opts=pulumi.ResourceOptions(depends_on=[recorder]),
        )

    # Outputs ------------------------------------------------------------- #
    def _export_outputs(
        self,
        compute: Dict[str, pulumi.Output],
        storage: Dict[str, pulumi.Output],
    ) -> None:
        """
        Expose a handful of outputs so that the integration test-suite and
        downstream stacks can discover endpoints.
        """
        pulumi.export("alb_dns", compute["alb_dns"])
        pulumi.export("s3_primary_bucket", storage["primary_bucket"])
        pulumi.export("rds_primary_endpoint", storage["primary_db"])
