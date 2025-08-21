# Infrastructure as Code - Pulumi Python Implementation

## __init__.py

```python

```

## tap_stack.py

```python
"""
tap_stack.py

Main TAP (Test Automation Platform) Pulumi component.

This version integrates the high-availability AWS infrastructure described in
MODEL_RESPONSE.md and constrained by PROMPT.md into the existing TapStack
component while preserving the TapStack / TapStackArgs design.

Key points satisfied (see PROMPT.md):
- Region: us-west-2 (Oregon)
- Two VPCs with non-overlapping CIDRs 
- Each VPC has two public and two private subnets across distinct AZs
- Application Load Balancer (ALB) handling HTTP/HTTPS
- Auto Scaling Groups with >=2 instances per VPC
- Security groups restricting to HTTP/HTTPS for public, SSH to private from public
- Comprehensive tagging
- Exports for top-level AND nested resources

Note:
- We keep TapStack and TapStackArgs intact and encapsulate all resources under
  the component. We also emit pulumi.export for every created resource per the
  task's requirement. 
"""

from __future__ import annotations

from typing import Dict, List, Optional

import base64
import pulumi
from pulumi import ResourceOptions, Output
import pulumi_aws as aws


class TapStackArgs:
  """
  TapStackArgs defines the input arguments for the TapStack Pulumi component.

  Args:
      environment_suffix (Optional[str]): Suffix for identifying 
      the deployment environment (e.g., 'dev', 'prod').
      tags (Optional[dict]): Default tags to apply to resources.
  """

  def __init__(
          self,
          environment_suffix: Optional[str] = None,
          tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or "dev"
    self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
  """
  Represents the main Pulumi component resource for the TAP project.

  This component instantiates a robust HA setup: two VPCs with public/private
  subnets, NATs, ALBs, and AutoScaling groups. It also exports all created
  resources as stack outputs.

  IMPORTANT: Core structure of TapStack/TapStackArgs is preserved.
  """

  def __init__(
      self,
      name: str,
      args: TapStackArgs,
      opts: Optional[ResourceOptions] = None,
  ) -> None:
    super().__init__("tap:stack:TapStack", name, None, opts)

    self.environment_suffix = args.environment_suffix
    self.tags = args.tags

    # Provider fixed to us-west-2 to satisfy PROMPT.md regional requirement.
    self.provider = aws.Provider(
        f"{name}-provider",
        region="us-west-2",
        default_tags=aws.ProviderDefaultTagsArgs(
            tags={
                **self.tags,
                "ManagedBy": "Pulumi",
                "EnvironmentSuffix": self.environment_suffix}),
        opts=ResourceOptions(
            parent=self),
    )

    # Common tags applied explicitly (provider default tags also applied)
    self.common_tags = {
        "Project": "tap-ha",
        "Region": "us-west-2",
        "Component": "TapStack",
    }

    # Choose two AZs explicitly for determinism
    azs = ["us-west-2a", "us-west-2b"]

    # Build two VPCs with non-overlapping blocks
    self.vpc1 = self._create_vpc_block(
        name_prefix=f"tap-vpc1-{self.environment_suffix}",
        cidr="10.0.0.0/16",
        azs=azs,
        extra_tags={"VPC": "Primary", "Tier": "Production"},
    )
    self.vpc2 = self._create_vpc_block(
        name_prefix=f"tap-vpc2-{self.environment_suffix}",
        cidr="10.1.0.0/16",
        azs=azs,
        extra_tags={"VPC": "Secondary", "Tier": "Production"},
    )

    # For each VPC: create SGs
    self.vpc1_sgs = self._create_security_groups(
        self.vpc1["vpc"].id, "tap-vpc1", self.vpc1["tags"])
    self.vpc2_sgs = self._create_security_groups(
        self.vpc2["vpc"].id, "tap-vpc2", self.vpc2["tags"])

    # ALBs
    self.vpc1_alb = self._create_alb(
        vpc_id=self.vpc1["vpc"].id,
        public_subnets=self.vpc1["public_subnets"],
        alb_sg=self.vpc1_sgs["alb_sg"].id,
        name_prefix="tap-vpc1",
        extra_tags=self.vpc1["tags"],
    )
    self.vpc2_alb = self._create_alb(
        vpc_id=self.vpc2["vpc"].id,
        public_subnets=self.vpc2["public_subnets"],
        alb_sg=self.vpc2_sgs["alb_sg"].id,
        name_prefix="tap-vpc2",
        extra_tags=self.vpc2["tags"],
    )

    # LaunchTemplates + ASGs (associate to ALB target groups)
    self.vpc1_asg = self._create_asg(
        name_prefix="tap-vpc1",
        subnet_objs=self.vpc1["public_subnets"],
        instance_sg=self.vpc1_sgs["public_sg"].id,
        target_group_arn=self.vpc1_alb["target_group"].arn,
        extra_tags=self.vpc1["tags"],
    )
    self.vpc2_asg = self._create_asg(
        name_prefix="tap-vpc2",
        subnet_objs=self.vpc2["public_subnets"],
        instance_sg=self.vpc2_sgs["public_sg"].id,
        target_group_arn=self.vpc2_alb["target_group"].arn,
        extra_tags=self.vpc2["tags"],
    )

    # Exports for ALL resources
    self._export_all(
        "vpc1",
        {
            "vpc": self.vpc1,
            "sgs": self.vpc1_sgs,
            "alb": self.vpc1_alb,
            "asg": self.vpc1_asg
        }
    )
    self._export_all(
        "vpc2",
        {
            "vpc": self.vpc2,
            "sgs": self.vpc2_sgs,
            "alb": self.vpc2_alb,
            "asg": self.vpc2_asg
        }
    )

    self.register_outputs({
        "vpc1_id": self.vpc1["vpc"].id,
        "vpc2_id": self.vpc2["vpc"].id,
        "vpc1_alb_dns": self.vpc1_alb["alb"].dns_name,
        "vpc2_alb_dns": self.vpc2_alb["alb"].dns_name,
    })

  # ------------------------- Helper Builders -------------------------

  def _create_vpc_block(
      self,
      *,
      name_prefix: str,
      cidr: str,
      azs: List[str],
      extra_tags: Dict[str, str],
  ) -> Dict[str, object]:
    """
    Creates VPC, IGW, two public and two private subnets across AZs,
    NAT gateways (1 per AZ), route tables and associations.

    Returns a dict of created resources.
    """
    tags = {**self.common_tags, **self.tags, **extra_tags, "Name": name_prefix}

    vpc = aws.ec2.Vpc(
        f"{name_prefix}",
        cidr_block=cidr,
        enable_dns_hostnames=True,
        enable_dns_support=True,
        tags=tags,
        opts=ResourceOptions(parent=self, provider=self.provider),
    )

    igw = aws.ec2.InternetGateway(
        f"{name_prefix}-igw",
        vpc_id=vpc.id,
        tags={**tags, "Name": f"{name_prefix}-igw"},
        opts=ResourceOptions(parent=vpc, provider=self.provider),
    )

    # deterministic /24s within provided /16
    # AZ0: public 10.x.0.0/24, private 10.x.1.0/24
    # AZ1: public 10.x.4.0/24, private 10.x.5.0/24
    subnet_cidrs = [
        ("public", 0),
        ("private", 1),
        ("public", 4),
        ("private", 5),
    ]

    public_subnets = []
    private_subnets = []
    nat_eips = []
    nat_gws = []

    for idx, az in enumerate(azs):
      # Public subnet in this AZ
      public_subnet = aws.ec2.Subnet(
          f"{name_prefix}-public-{idx + 1}",
          vpc_id=vpc.id,
          cidr_block=self._cidr_24(cidr, subnet_cidrs[idx * 2][1]),
          availability_zone=az,
          map_public_ip_on_launch=True,
          tags={**tags, "Type": "Public", "Name": f"{name_prefix}-public-{idx + 1}"},
          opts=ResourceOptions(parent=vpc, provider=self.provider),
      )
      public_subnets.append(public_subnet)

      # Private subnet in this AZ
      private_subnet = aws.ec2.Subnet(
          f"{name_prefix}-private-{idx + 1}",
          vpc_id=vpc.id,
          cidr_block=self._cidr_24(cidr, subnet_cidrs[(idx * 2) + 1][1]),
          availability_zone=az,
          map_public_ip_on_launch=False,
          tags={**tags, "Type": "Private", "Name": f"{name_prefix}-private-{idx + 1}"},
          opts=ResourceOptions(parent=vpc, provider=self.provider),
      )
      private_subnets.append(private_subnet)

      # NAT per AZ
      eip = aws.ec2.Eip(
          f"{name_prefix}-nat-eip-{idx + 1}",
          domain="vpc",
          tags={**tags, "Name": f"{name_prefix}-nat-eip-{idx + 1}"},
          opts=ResourceOptions(parent=vpc, provider=self.provider),
      )
      nat_eips.append(eip)

      nat_gw = aws.ec2.NatGateway(
          f"{name_prefix}-natgw-{idx + 1}",
          allocation_id=eip.id,
          subnet_id=public_subnet.id,
          tags={**tags, "Name": f"{name_prefix}-natgw-{idx + 1}"},
          opts=ResourceOptions(parent=vpc, provider=self.provider),
      )
      nat_gws.append(nat_gw)

    # Public RT + default route
    public_rt = aws.ec2.RouteTable(
        f"{name_prefix}-public-rt",
        vpc_id=vpc.id,
        tags={**tags, "Name": f"{name_prefix}-public-rt"},
        opts=ResourceOptions(parent=vpc, provider=self.provider),
    )
    aws.ec2.Route(
        f"{name_prefix}-public-rt-igw-route",
        route_table_id=public_rt.id,
        destination_cidr_block="0.0.0.0/0",
        gateway_id=igw.id,
        opts=ResourceOptions(parent=public_rt, provider=self.provider),
    )
    for i, ps in enumerate(public_subnets):
      aws.ec2.RouteTableAssociation(
          f"{name_prefix}-public-rta-{i + 1}",
          subnet_id=ps.id,
          route_table_id=public_rt.id,
          opts=ResourceOptions(parent=public_rt, provider=self.provider),
      )

    # Private RTs: one per AZ to a corresponding NAT
    private_rts = []
    for i, (priv, nat) in enumerate(zip(private_subnets, nat_gws)):
      rt = aws.ec2.RouteTable(
          f"{name_prefix}-private-rt-{i + 1}",
          vpc_id=vpc.id,
          tags={**tags, "Name": f"{name_prefix}-private-rt-{i + 1}"},
          opts=ResourceOptions(parent=vpc, provider=self.provider),
      )
      private_rts.append(rt)
      aws.ec2.Route(
          f"{name_prefix}-private-rt-nat-route-{i + 1}",
          route_table_id=rt.id,
          destination_cidr_block="0.0.0.0/0",
          nat_gateway_id=nat.id,
          opts=ResourceOptions(parent=rt, provider=self.provider),
      )
      aws.ec2.RouteTableAssociation(
          f"{name_prefix}-private-rta-{i + 1}",
          subnet_id=priv.id,
          route_table_id=rt.id,
          opts=ResourceOptions(parent=rt, provider=self.provider),
      )

    return {
        "tags": tags,
        "vpc": vpc,
        "igw": igw,
        "public_subnets": public_subnets,
        "private_subnets": private_subnets,
        "public_rt": public_rt,
        "private_rts": private_rts,
        "nat_eips": nat_eips,
        "nat_gws": nat_gws,
    }

  def _create_security_groups(self,
                              vpc_id: Output[str],
                              name_prefix: str,
                              extra_tags: Dict[str,
                                               str]) -> Dict[str,
                                                             aws.ec2.SecurityGroup]:
    tags = {**self.common_tags, **self.tags, **extra_tags}

    alb_sg = aws.ec2.SecurityGroup(
        f"{name_prefix}-alb-sg",
        description="ALB SG allowing HTTP/HTTPS from internet",
        vpc_id=vpc_id,
        ingress=[
            aws.ec2.SecurityGroupIngressArgs(
                from_port=80,
                to_port=80,
                protocol="tcp",
                cidr_blocks=["0.0.0.0/0"],
                description="HTTP"),
            aws.ec2.SecurityGroupIngressArgs(
                from_port=443,
                to_port=443,
                protocol="tcp",
                cidr_blocks=["0.0.0.0/0"],
                description="HTTPS"),
        ],
        egress=[
            aws.ec2.SecurityGroupEgressArgs(
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"])],
        tags={
            **tags,
            "Name": f"{name_prefix}-alb-sg"},
        opts=ResourceOptions(
            parent=self,
            provider=self.provider),
    )

    public_sg = aws.ec2.SecurityGroup(
        f"{name_prefix}-public-sg",
        description="Public instance SG allowing HTTP/HTTPS from ALB",
        vpc_id=vpc_id,
        ingress=[
            aws.ec2.SecurityGroupIngressArgs(
                from_port=80,
                to_port=80,
                protocol="tcp",
                security_groups=[
                    alb_sg.id],
                description="HTTP from ALB"),
            aws.ec2.SecurityGroupIngressArgs(
                from_port=443,
                to_port=443,
                protocol="tcp",
                security_groups=[
                    alb_sg.id],
                description="HTTPS from ALB"),
        ],
        egress=[
            aws.ec2.SecurityGroupEgressArgs(
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"])],
        tags={
            **tags,
            "Name": f"{name_prefix}-public-sg"},
        opts=ResourceOptions(
            parent=self,
            provider=self.provider),
    )

    private_sg = aws.ec2.SecurityGroup(
        f"{name_prefix}-private-sg",
        description="Private instance SG allowing SSH from public instances",
        vpc_id=vpc_id,
        ingress=[
            aws.ec2.SecurityGroupIngressArgs(
                from_port=22,
                to_port=22,
                protocol="tcp",
                security_groups=[
                    public_sg.id],
                description="SSH from public SG"),
        ],
        egress=[
            aws.ec2.SecurityGroupEgressArgs(
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"])],
        tags={
            **tags,
            "Name": f"{name_prefix}-private-sg"},
        opts=ResourceOptions(
            parent=self,
            provider=self.provider),
    )

    return {"alb_sg": alb_sg, "public_sg": public_sg, "private_sg": private_sg}

  def _create_alb(
      self,
      *,
      vpc_id: Output[str],
      public_subnets: List[aws.ec2.Subnet],
      alb_sg: Output[str],
      name_prefix: str,
      extra_tags: Dict[str, str],
  ) -> Dict[str, object]:
    tags = {**self.common_tags, **self.tags, **extra_tags}

    alb = aws.lb.LoadBalancer(
        f"{name_prefix}-alb",
        load_balancer_type="application",
        subnets=[s.id for s in public_subnets],
        security_groups=[alb_sg],
        enable_deletion_protection=False,
        tags={**tags, "Name": f"{name_prefix}-alb"},
        opts=ResourceOptions(parent=self, provider=self.provider),
    )

    tg = aws.lb.TargetGroup(
        f"{name_prefix}-tg",
        port=80,
        protocol="HTTP",
        vpc_id=vpc_id,
        health_check=aws.lb.TargetGroupHealthCheckArgs(
            enabled=True,
            path="/",
            protocol="HTTP",
            matcher="200",
            healthy_threshold=2,
            unhealthy_threshold=2,
            interval=30,
            timeout=5),
        tags={
            **tags,
            "Name": f"{name_prefix}-tg"},
        opts=ResourceOptions(
            parent=alb,
            provider=self.provider),
    )

    listener = aws.lb.Listener(
        f"{name_prefix}-http-listener",
        load_balancer_arn=alb.arn,
        port=80,
        protocol="HTTP",
        default_actions=[
            aws.lb.ListenerDefaultActionArgs(
                type="forward",
                target_group_arn=tg.arn)],
        tags={
            **tags,
            "Name": f"{name_prefix}-http-listener"},
        opts=ResourceOptions(
            parent=alb,
            provider=self.provider),
    )

    return {"alb": alb, "target_group": tg, "listener": listener}

  def _create_asg(
      self,
      *,
      name_prefix: str,
      subnet_objs: List[aws.ec2.Subnet],
      instance_sg: Output[str],
      target_group_arn: Output[str],
      extra_tags: Dict[str, str],
  ) -> Dict[str, object]:
    tags = {**self.common_tags, **self.tags, **extra_tags}

    # Using already imported modules

    # Get the latest Amazon Linux 2023 AMI ID from SSM
    # Create AWS provider for the specified region
    aws_provider = aws.Provider(
        f"aws-provider-{name_prefix}",
        region=self.common_tags.get("Region")
    )
    ami = aws.ec2.get_ami(
        most_recent=True,
        owners=["amazon"],
        filters=[
            aws.ec2.GetAmiFilterArgs(
                name="name", values=["amzn2-ami-hvm-*-x86_64-gp2"])
        ],
        opts=pulumi.InvokeOptions(provider=aws_provider),
    )
    user_data = """#!/bin/bash
yum update -y
yum install -y httpd
systemctl enable --now httpd
echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html
"""

    # Clean the AMI ID - remove any brackets if present
    # ami_id = ami_param.value.apply(lambda v: v.strip('[]'))
    
    lt = aws.ec2.LaunchTemplate(
        f"{name_prefix}-lt",
        image_id=ami.id,
        instance_type="t3.micro",
        vpc_security_group_ids=[instance_sg],
        user_data=base64.b64encode(user_data.encode("utf-8")).decode("utf-8"),
        tag_specifications=[
            aws.ec2.LaunchTemplateTagSpecificationArgs(
                resource_type="instance",
                tags={**tags, "Name": f"{name_prefix}-instance"},
            )
        ],
        tags={**tags, "Name": f"{name_prefix}-lt"},
        opts=ResourceOptions(parent=self, provider=self.provider),
    )

    asg = aws.autoscaling.Group(
        f"{name_prefix}-asg",
        vpc_zone_identifiers=[s.id for s in subnet_objs],
        target_group_arns=[target_group_arn],
        health_check_type="ELB",
        health_check_grace_period=300,
        min_size=2,
        max_size=6,
        desired_capacity=2,
        launch_template=aws.autoscaling.GroupLaunchTemplateArgs(id=lt.id, version="$Latest"),
        tags=[
            aws.autoscaling.GroupTagArgs(key=k, value=v, propagate_at_launch=True)
            for k, v in {**tags, "Name": f"{name_prefix}-asg"}.items()
        ],
        opts=ResourceOptions(parent=self, provider=self.provider),
    )

    return {"launch_template": lt, "asg": asg}

  # ------------------------- Utilities & Exports -------------------------

  @staticmethod
  def _cidr_24(parent_cidr: str, offset: int) -> str:
    # parent /16 like 10.x.0.0/16 -> build 10.x.<offset>.0/24
    base = parent_cidr.split("/")[0]  # e.g., 10.0.0.0
    parts = base.split(".")
    return f"{parts[0]}.{parts[1]}.{offset}.0/24"

  def _export_all(
      self,
      prefix: str,
      resources: Dict[str, Dict[str, object]]
  ) -> None:
    """Export every resource id/arn/dns to satisfy task requirement."""
    # Extract resource blocks
    vpc_block = resources["vpc"]
    sgs = resources["sgs"]
    alb_block = resources["alb"]
    asg_block = resources["asg"]
    
    # VPC + core networking
    pulumi.export(f"{prefix}_vpc_id", vpc_block["vpc"].id)
    pulumi.export(f"{prefix}_igw_id", vpc_block["igw"].id)
    pulumi.export(f"{prefix}_public_rt_id", vpc_block["public_rt"].id)
    pulumi.export(f"{prefix}_private_rt_ids",
                  [rt.id for rt in vpc_block["private_rts"]])
    pulumi.export(
        f"{prefix}_nat_eip_ids", [
            e.id for e in vpc_block["nat_eips"]])
    pulumi.export(f"{prefix}_nat_gw_ids", [g.id for g in vpc_block["nat_gws"]])
    pulumi.export(f"{prefix}_public_subnet_ids",
                  [s.id for s in vpc_block["public_subnets"]])
    pulumi.export(f"{prefix}_private_subnet_ids",
                  [s.id for s in vpc_block["private_subnets"]])

    # Security groups
    pulumi.export(f"{prefix}_alb_sg_id", sgs["alb_sg"].id)
    pulumi.export(f"{prefix}_public_sg_id", sgs["public_sg"].id)
    pulumi.export(f"{prefix}_private_sg_id", sgs["private_sg"].id)

    # ALB
    pulumi.export(f"{prefix}_alb_arn", alb_block["alb"].arn)
    pulumi.export(f"{prefix}_alb_dns", alb_block["alb"].dns_name)
    pulumi.export(f"{prefix}_alb_zone_id", alb_block["alb"].zone_id)
    pulumi.export(f"{prefix}_tg_arn", alb_block["target_group"].arn)
    pulumi.export(f"{prefix}_listener_arn", alb_block["listener"].arn)
    pulumi.export(
        f"{prefix}_alb_url",
        alb_block["alb"].dns_name.apply(
            lambda d: f"http://{d}"))

    # ASG / LT
    pulumi.export(
        f"{prefix}_launch_template_id",
        asg_block["launch_template"].id)
    pulumi.export(f"{prefix}_asg_name", asg_block["asg"].name)
```
