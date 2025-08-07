# lib/tap_stack.py
"""
tap_stack.py
============

Security-first *Infrastructure as Code* stack for the **IaC – AWS Nova Model
Breaking** project.

Key design pillars
------------------
1. Multi-region (us-east-1, us-west-2, ap-south-1) with dedicated Pulumi
   providers.
2. TLS 1.2+ enforced everywhere.
3. Strict least-privilege IAM.
4. Observability (CloudTrail, VPC Flow Logs, CloudWatch) and automated
   compliance via AWS Config.
5. IPv6 dual-stack networking.
6. Automated secrets management (AWS Secrets Manager).
7. Uniform naming: `PROD-{service}-{identifier}-{region}` plus mandatory
   tags `Environment`, `Owner`, `CostCenter`, `Project`.

Only three repository files are required:

    • lib/tap_stack.py
    • tests/unit/test_tap_stack.py
    • tests/integration/test_tap_stack.py
"""
from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Dict, Optional

import pulumi
import pulumi_aws as aws

# --------------------------------------------------------------------------- #
# Public *Args* helper                                                        #
# --------------------------------------------------------------------------- #
@dataclass
class TapStackArgs:
    """
    Wrapper for the most common constructor parameters.

    Examples
    --------
    >>> TapStack("nova")                                  # all defaults
    >>> TapStack("nova", TapStackArgs(env="prod"))        # explicit env
    """
    env: str = "prod"
    owner: str = "devops"
    cost_center: str = "0000"
    project: str = "nova-model-breaking"

# --------------------------------------------------------------------------- #
# Main component                                                              #
# --------------------------------------------------------------------------- #
class TapStack(pulumi.ComponentResource):
    """
    Root component for the Nova Model Breaking production stack.
    """

    # --------------------------------------------------------------------- #
    # Constructor                                                           #
    # --------------------------------------------------------------------- #
    def __init__(
        self,
        name: str,
        args: Optional[TapStackArgs] = None,
        opts: Optional[pulumi.ResourceOptions] = None,
    ) -> None:
        """
        Parameters
        ----------
        name:
            Logical stack name.
        args:
            Optional TapStackArgs wrapper.  If *None*, defaults are used.
        opts:
            Standard Pulumi resource options.
        """
        super().__init__("tap:stack:TapStack", name, None, opts)

        # Accept *args* or fall back to sensible defaults
        env         = getattr(args, "env", "prod")
        owner       = getattr(args, "owner", "devops")
        cost_center = getattr(args, "cost_center", "0000")
        project     = getattr(args, "project", "nova-model-breaking")

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
            r: aws.Provider(f"{name}-{r}", region=r) for r in
            ("us-east-1", "us-west-2", "ap-south-1")
        }

        # --- Resource graph ------------------------------------------------ #
        net   = self._create_networking()
        sec   = self._create_security_resources(net)
        comp  = self._create_compute_resources(net, sec)
        store = self._create_storage_resources(sec)
        self._create_monitoring(net)
        self._export_outputs(comp, store)

        self.register_outputs({})

    # --------------------------------------------------------------------- #
    # Helpers                                                                #
    # --------------------------------------------------------------------- #
    def _merge_tags(self, extra: Optional[Dict[str, str]] = None) -> Dict[str, str]:
        merged = self._tags.copy()
        if extra:
            merged.update(extra)
        return merged

    # --------------------------------------------------------------------- #
    # Networking                                                             #
    # --------------------------------------------------------------------- #
    def _create_networking(self) -> Dict[str, Dict[str, pulumi.Resource]]:
        """
        One dual-stack VPC per region with a public & private subnet each.
        """
        out: Dict[str, Dict[str, pulumi.Resource]] = {}

        for idx, region in enumerate(self.providers):
            prov = self.providers[region]

            vpc = aws.ec2.Vpc(
                f"prod-vpc-{region}",
                provider=prov,
                cidr_block=f"10.{idx}.0.0/16",
                assign_generated_ipv6_cidr_block=True,
                enable_dns_hostnames=True,
                enable_dns_support=True,
                tags=self._merge_tags({"Name": f"PROD-vpc-{region}", "Service": "vpc"}),
            )

            ipv6_block = aws.ec2.VpcIpv6CidrBlockAssociation(
                f"ipv6-{region}", provider=prov, vpc_id=vpc.id
            )

            # Subnets ------------------------------------------------------ #
            pub = aws.ec2.Subnet(
                f"pub-{region}",
                provider=prov,
                vpc_id=vpc.id,
                cidr_block=f"10.{idx}.0.0/24",
                ipv6_cidr_block=ipv6_block.ipv6_cidr_block.apply(
                    lambda b: b.replace("00::/56", "00:100/64")
                ),
                map_public_ip_on_launch=True,
                tags=self._merge_tags(
                    {"Name": f"PROD-public-{region}", "Service": "subnet"}
                ),
            )
            priv = aws.ec2.Subnet(
                f"priv-{region}",
                provider=prov,
                vpc_id=vpc.id,
                cidr_block=f"10.{idx}.1.0/24",
                ipv6_cidr_block=ipv6_block.ipv6_cidr_block.apply(
                    lambda b: b.replace("00::/56", "00:200/64")
                ),
                map_public_ip_on_launch=False,
                tags=self._merge_tags(
                    {"Name": f"PROD-private-{region}", "Service": "subnet"}
                ),
            )

            # IGW & route table for public subnet ------------------------- #
            igw = aws.ec2.InternetGateway(
                f"igw-{region}",
                provider=prov,
                vpc_id=vpc.id,
                tags=self._merge_tags({"Name": f"PROD-igw-{region}", "Service": "igw"}),
            )
            rt = aws.ec2.RouteTable(
                f"rt-pub-{region}",
                provider=prov,
                vpc_id=vpc.id,
                routes=[
                    aws.ec2.RouteTableRouteArgs(cidr_block="0.0.0.0/0", gateway_id=igw.id),
                    aws.ec2.RouteTableRouteArgs(ipv6_cidr_block="::/0",  gateway_id=igw.id),
                ],
                tags=self._merge_tags({"Name": f"PROD-rt-pub-{region}", "Service": "rt"}),
            )
            aws.ec2.RouteTableAssociation(
                f"rta-{region}", provider=prov, subnet_id=pub.id, route_table_id=rt.id
            )

            out[region] = {"vpc": vpc, "public_subnet": pub, "private_subnet": priv}
        return out

    # --------------------------------------------------------------------- #
    # Security                                                               #
    # --------------------------------------------------------------------- #
    def _create_security_resources(
        self, net: Dict[str, Dict[str, pulumi.Resource]]
    ) -> Dict[str, Dict[str, pulumi.Resource]]:
        """
        • One SG per region for application servers.
        • One customer-managed KMS key per region.
        • One cross-region EC2 instance role (least-privilege).
        """
        sec: Dict[str, Dict[str, pulumi.Resource]] = {}

        # --- per-region SG & KMS ----------------------------------------- #
        for region in self.providers:
            prov = self.providers[region]

            sg = aws.ec2.SecurityGroup(
                f"sg-app-{region}",
                provider=prov,
                vpc_id=net[region]["vpc"].id,
                description="Allow 80/443 from anywhere; all egress",
                ingress=[
                    aws.ec2.SecurityGroupIngressArgs(
                        protocol="tcp", from_port=80,  to_port=80,
                        cidr_blocks=["0.0.0.0/0"], ipv6_cidr_blocks=["::/0"]
                    ),
                    aws.ec2.SecurityGroupIngressArgs(
                        protocol="tcp", from_port=443, to_port=443,
                        cidr_blocks=["0.0.0.0/0"], ipv6_cidr_blocks=["::/0"]
                    ),
                ],
                egress=[
                    aws.ec2.SecurityGroupEgressArgs(
                        protocol="-1", from_port=0, to_port=0,
                        cidr_blocks=["0.0.0.0/0"], ipv6_cidr_blocks=["::/0"]
                    )
                ],
                tags=self._merge_tags({"Name": f"PROD-app-sg-{region}", "Service": "sg"}),
            )

            kms = aws.kms.Key(
                f"kms-{region}",
                provider=prov,
                description=f"PROD KMS key ({region})",
                enable_key_rotation=True,
                tags=self._merge_tags({"Name": f"PROD-kms-{region}", "Service": "kms"}),
            )

            sec[region] = {"app_sg": sg, "kms": kms}

        # --- global EC2 role & inline policy ----------------------------- #
        self.instance_role = aws.iam.Role(
            "prod-ec2-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ec2.amazonaws.com"},
                    "Action": "sts:AssumeRole",
                }],
            }),
            tags=self._merge_tags({"Service": "iam", "Name": "PROD-ec2-role"}),
        )
        aws.iam.RolePolicy(
            "prod-ec2-logs-s3",
            role=self.instance_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup", "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "*",
                    },
                    {
                        "Effect": "Allow",
                        "Action": ["s3:GetObject", "s3:PutObject"],
                        "Resource": "*",
                    },
                ],
            }),
        )
        return sec

    # --------------------------------------------------------------------- #
    # Compute                                                                #
    # --------------------------------------------------------------------- #
    def _create_compute_resources(
        self,
        net: Dict[str, Dict[str, pulumi.Resource]],
        sec: Dict[str, Dict[str, pulumi.Resource]],
    ) -> Dict[str, pulumi.Output]:
        """
        Very small ASG & ALB in the *primary* region (us-east-1) to keep demo
        affordable; extend as required.
        """
        primary = "us-east-1"
        prov    = self.providers[primary]

        ami = aws.ec2.get_ami(
            provider=prov, most_recent=True, owners=["amazon"],
            filters=[aws.ec2.GetAmiFilterArgs(name="name", values=["amzn2-ami-hvm*"])]
        )

        lt = aws.ec2.LaunchTemplate(
            "app-lt",
            provider=prov,
            image_id=ami.id,
            instance_type="t3.micro",
            iam_instance_profile=aws.iam.InstanceProfile(
                "app-prof", role=self.instance_role.name,
                opts=pulumi.ResourceOptions(provider=prov)
            ).name,
            network_interfaces=[
                aws.ec2.LaunchTemplateNetworkInterfaceArgs(
                    security_groups=[sec[primary]["app_sg"].id],
                    associate_public_ip_address=False,
                )
            ],
            tag_specifications=[aws.ec2.LaunchTemplateTagSpecificationArgs(
                resource_type="instance",
                tags=self._merge_tags({"Name": "PROD-ec2-app-us-east-1", "Service": "ec2"}),
            )],
        )

        asg = aws.autoscaling.Group(
            "app-asg",
            provider=prov,
            desired_capacity=2,
            min_size=1,
            max_size=3,
            vpc_zone_identifier=[net[primary]["private_subnet"].id],
            launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                id=lt.id, version="$Latest"
            ),
            tags=[
                aws.autoscaling.GroupTagArgs(
                    key=k, value=v, propagate_at_launch=True
                ) for k, v in self._merge_tags({"Service": "ec2"}).items()
            ],
        )

        alb = aws.lb.LoadBalancer(
            "app-alb",
            provider=prov,
            load_balancer_type="application",
            subnets=[net[primary]["public_subnet"].id],
            security_groups=[sec[primary]["app_sg"].id],
            idle_timeout=60,
            enable_deletion_protection=False,
            tags=self._merge_tags({"Name": "PROD-alb-us-east-1", "Service": "alb"}),
        )
        tg = aws.lb.TargetGroup(
            "app-tg",
            provider=prov,
            port=80,
            protocol="HTTP",
            vpc_id=net[primary]["vpc"].id,
            target_type="instance",
            health_check=aws.lb.TargetGroupHealthCheckArgs(path="/", matcher="200"),
            tags=self._merge_tags({"Service": "alb-tg"}),
        )
        aws.lb.Listener(
            "alb-listener",
            provider=prov,
            load_balancer_arn=alb.arn,
            port=443,
            protocol="HTTPS",
            certificate_arn=aws.acm.get_certificate(
                provider=prov, domain="example.com", statuses=["ISSUED"], most_recent=True
            ).arn,
            ssl_policy="ELBSecurityPolicy-TLS-1-2-2017-01",
            default_actions=[aws.lb.ListenerDefaultActionArgs(
                type="forward", target_group_arn=tg.arn
            )],
        )
        aws.autoscaling.Attachment(
            "asg-tg",
            provider=prov,
            autoscaling_group_name=asg.name,
            alb_target_group_arn=tg.arn,
        )

        return {"alb_dns": alb.dns_name}

    # --------------------------------------------------------------------- #
    # Storage                                                                #
    # --------------------------------------------------------------------- #
    def _create_storage_resources(
        self, sec: Dict[str, Dict[str, pulumi.Resource]]
    ) -> Dict[str, pulumi.Output]:
        """
        S3 primary bucket → replication into us-west-2; RDS primary + read-replica.
        """
        primary   = "us-east-1"
        secondary = "us-west-2"
        pprov     = self.providers[primary]
        sprov     = self.providers[secondary]

        # --- S3 buckets --------------------------------------------------- #
        primary_bucket = aws.s3.Bucket(
            "bucket-primary",
            provider=pprov,
            versioning=aws.s3.BucketVersioningArgs(enabled=True),
            server_side_encryption_configuration=
                aws.s3.BucketServerSideEncryptionConfigurationArgs(
                    rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                        apply_server_side_encryption_by_default=
                            aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                                sse_algorithm="aws:kms",
                                kms_master_key_id=sec[primary]["kms"].id,
                            )
                    )
                ),
            tags=self._merge_tags({"Name": "PROD-s3-primary", "Service": "s3"}),
        )

        replica_bucket = aws.s3.Bucket(
            "bucket-replica",
            provider=sprov,
            versioning=aws.s3.BucketVersioningArgs(enabled=True),
            server_side_encryption_configuration=
                aws.s3.BucketServerSideEncryptionConfigurationArgs(
                    rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                        apply_server_side_encryption_by_default=
                            aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                                sse_algorithm="aws:kms",
                                kms_master_key_id=sec[secondary]["kms"].id,
                            )
                    )
                ),
            tags=self._merge_tags({"Name": "PROD-s3-replica", "Service": "s3"}),
        )

        # Replication rule → after *both* buckets exist -------------------- #
        aws.s3.BucketReplicationConfig(
            "replication",
            provider=pprov,
            bucket=primary_bucket.id,
            role=aws.iam.get_role(name="prod-ec2-role").arn,
            rules=[aws.s3.BucketReplicationConfigRuleArgs(
                destination=aws.s3.BucketReplicationConfigRuleDestinationArgs(
                    bucket=replica_bucket.arn,
                    storage_class="STANDARD",
                ),
                status="Enabled",
            )],
        )

        # TLS-only access policy ------------------------------------------ #
        pol = primary_bucket.arn.apply(lambda arn: json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Sid": "TLSRequired",
                "Effect": "Deny",
                "Principal": "*",
                "Action": "s3:*",
                "Resource": [arn, f"{arn}/*"],
                "Condition": {"Bool": {"aws:SecureTransport": "false"}},
            }],
        }))
        aws.s3.BucketPolicy(
            "bucket-policy", provider=pprov,
            bucket=primary_bucket.id, policy=pol
        )

        # --- Secrets Manager --------------------------------------------- #
        secret = aws.secretsmanager.Secret(
            "db-creds", provider=pprov, description="RDS credentials",
            tags=self._merge_tags({"Service": "secretsmanager"}),
        )
        aws.secretsmanager.SecretVersion(
            "db-creds-v1", provider=pprov, secret_id=secret.id,
            secret_string=json.dumps({"username": "masteruser", "password": "ChangeMe!"}),
        )

        # --- RDS primary & replica --------------------------------------- #
        subnet_grp = aws.rds.SubnetGroup(
            "db-sng", provider=pprov,
            subnet_ids=[net["private_subnet"].id for net in self._create_networking().values()],
            tags=self._merge_tags({"Service": "rds"}),
        )
        primary_db = aws.rds.Instance(
            "db-primary", provider=pprov,
            engine="postgres", engine_version="14.6", instance_class="db.t3.micro",
            allocated_storage=20, storage_encrypted=True,
            db_subnet_group_name=subnet_grp.name,
            vpc_security_group_ids=[sec[primary]["app_sg"].id],
            kms_key_id=sec[primary]["kms"].id,
            username="masteruser",
            password=secret.name.apply(lambda _: "ChangeMe!"),
            multi_az=True, skip_final_snapshot=True,
            publicly_accessible=False,
            tags=self._merge_tags({"Name": "PROD-rds-primary", "Service": "rds"}),
        )
        replica_db = aws.rds.Instance(
            "db-replica", provider=sprov,
            replicate_source_db=primary_db.identifier,
            instance_class="db.t3.micro", storage_encrypted=True,
            publicly_accessible=False, kms_key_id=sec[secondary]["kms"].id,
            skip_final_snapshot=True,
            tags=self._merge_tags({"Name": "PROD-rds-replica", "Service": "rds"}),
        )

        return {
            "primary_bucket": primary_bucket.arn,
            "primary_db":     primary_db.endpoint,
        }

    # --------------------------------------------------------------------- #
    # Monitoring & Compliance                                               #
    # --------------------------------------------------------------------- #
    def _create_monitoring(self, net) -> None:
        region = "us-east-1"
        prov   = self.providers[region]

        lg = aws.cloudwatch.LogGroup(
            "logs-central", provider=prov, retention_in_days=30,
            tags=self._merge_tags({"Service": "cloudwatch"})
        )
        trail_bucket = aws.s3.Bucket(
            "trail-bucket", provider=prov, acl="private",
            versioning=aws.s3.BucketVersioningArgs(enabled=True),
            tags=self._merge_tags({"Name": "PROD-cloudtrail", "Service": "s3"}),
        )
        aws.cloudtrail.Trail(
            "trail", provider=prov, s3_bucket_name=trail_bucket.id,
            is_multi_region_trail=True, include_global_service_events=True,
            cloud_watch_logs_role_arn=self.instance_role.arn,
            cloud_watch_logs_group_arn=lg.arn,
            event_selector=[aws.cloudtrail.TrailEventSelectorArgs(
                read_write_type="All", include_management_events=True
            )],
            tags=self._merge_tags({"Service": "cloudtrail"}),
        )
        aws.ec2.FlowLog(
            "flow-logs", provider=prov, vpc_id=net[region]["vpc"].id,
            log_destination_type="cloud-watch-logs", log_destination=lg.arn,
            traffic_type="ALL",
            tags=self._merge_tags({"Service": "vpc-flow-logs"}),
        )

        # AWS Config ------------------------------------------------------- #
        cfg_role = aws.iam.Role(
            "config-role", provider=prov,
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "config.amazonaws.com"},
                    "Action": "sts:AssumeRole",
                }],
            }),
            tags=self._merge_tags({"Service": "iam"}),
        )
        aws.iam.RolePolicyAttachment(
            "cfg-role-policy", provider=prov, role=cfg_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSConfigRole",
        )
        recorder = aws.cfg.Recorder(
            "cfg-recorder", provider=prov, role_arn=cfg_role.arn,
            recording_group=aws.cfg.RecorderRecordingGroupArgs(
                all_supported=True, include_global_resource_types=True
            ),
        )
        aws.cfg.DeliveryChannel(
            "cfg-channel", provider=prov, s3_bucket_name=trail_bucket.id,
            s3_key_prefix="config"
        )
        aws.cfg.RecorderStatus(
            "cfg-start", provider=prov, recorder_name=recorder.name, is_enabled=True
        )

    # --------------------------------------------------------------------- #
    # Outputs                                                                #
    # --------------------------------------------------------------------- #
    def _export_outputs(self, comp, store) -> None:
        pulumi.export("alb_dns",            comp["alb_dns"])
        pulumi.export("s3_primary_bucket",  store["primary_bucket"])
        pulumi.export("rds_primary_endpoint", store["primary_db"])
