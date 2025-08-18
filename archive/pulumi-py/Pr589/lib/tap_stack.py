import json
from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions

# Read region from AWS_REGION file if it exists
region = "us-west-2"
west2_provider = aws.Provider("west2", region=region)


class TapStackArgs:
  def __init__(
          self,
          environment_suffix: Optional[str] = None,
          tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or 'dev'
    self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
  def __init__(self, name: str, args: TapStackArgs,
               opts: Optional[ResourceOptions] = None):
    super().__init__('tap:stack:TapStack', name, None, opts)
    suffix = args.environment_suffix
    base_tags = args.tags
    # Add default tags if missing
    tags = {
        **{"Owner": base_tags.get("Owner", "team"),
           "Environment": suffix},
        **base_tags
    }

    # region + AZ
    azs = aws.get_availability_zones(
        state="available",
        opts=pulumi.InvokeOptions(provider=west2_provider)
    ).names[:2]
    # VPC
    vpc = aws.ec2.Vpc(
        f"tap-{suffix}-vpc",
        cidr_block="10.0.0.0/16",
        enable_dns_hostnames=True,
        enable_dns_support=True,
        tags={
            **tags,
            "Name": f"tap-{suffix}-vpc"},
        opts=ResourceOptions(
            parent=self,
            provider=west2_provider))
    pulumi.export("vpc_id", vpc.id)
    pulumi.export("vpc_cidr", vpc.cidr_block)

    # Internet Gateway
    igw = aws.ec2.InternetGateway(
        f"tap-{suffix}-igw",
        vpc_id=vpc.id,
        tags={
            **tags,
            "Name": f"tap-{suffix}-igw"},
        opts=ResourceOptions(
            parent=self,
            provider=west2_provider))
    pulumi.export("internet_gateway_id", igw.id)

    # Public subnets
    public_subnets = []
    for i, az in enumerate(azs):
      cidr = f"10.0.{i + 1}.0/24"
      sn = aws.ec2.Subnet(f"tap-{suffix}-public-{i + 1}",
                          vpc_id=vpc.id,
                          cidr_block=cidr,
                          availability_zone=az,
                          map_public_ip_on_launch=True,
                          tags={**tags,
                                "Name": f"tap-{suffix}-public-{i + 1}",
                                "Type": "Public"},
                          opts=ResourceOptions(parent=self,
                                               provider=west2_provider))
      public_subnets.append(sn)
    pulumi.export("public_subnet_ids", [s.id for s in public_subnets])

    # Private subnets
    private_subnets = []
    for i, az in enumerate(azs):
      cidr = f"10.0.{(i + 1) * 10}.0/24"
      sn = aws.ec2.Subnet(f"tap-{suffix}-private-{i + 1}",
                          vpc_id=vpc.id,
                          cidr_block=cidr,
                          availability_zone=az,
                          tags={**tags,
                                "Name": f"tap-{suffix}-private-{i + 1}",
                                "Type": "Private"},
                          opts=ResourceOptions(parent=self,
                                               provider=west2_provider))
      private_subnets.append(sn)
    pulumi.export("private_subnet_ids", [s.id for s in private_subnets])

    # Elastic IPs & NAT Gateways
    eips = []
    nat_gws = []
    for i, pub in enumerate(public_subnets):
      eip = aws.ec2.Eip(f"tap-{suffix}-eip-{i + 1}",
                        domain="vpc",
                        tags={**tags,
                              "Name": f"tap-{suffix}-eip-{i + 1}"},
                        opts=ResourceOptions(parent=self,
                                             provider=west2_provider))
      eips.append(eip)
      ngw = aws.ec2.NatGateway(f"tap-{suffix}-natgw-{i + 1}",
                               allocation_id=eip.id,
                               subnet_id=pub.id,
                               tags={**tags, "Name": f"tap-{suffix}-natgw-{i + 1}"},
                               opts=ResourceOptions(parent=self, provider=west2_provider))
      nat_gws.append(ngw)
    pulumi.export("nat_gateway_ids", [n.id for n in nat_gws])

    # Public route table
    prt = aws.ec2.RouteTable(
        f"tap-{suffix}-public-rt",
        vpc_id=vpc.id,
        tags={
            **tags,
            "Name": f"tap-{suffix}-public-rt"},
        opts=ResourceOptions(
            parent=self,
            provider=west2_provider))
    aws.ec2.Route(f"tap-{suffix}-public-route",
                  route_table_id=prt.id,
                  destination_cidr_block="0.0.0.0/0",
                  gateway_id=igw.id,
                  opts=ResourceOptions(parent=self, provider=west2_provider))
    for i, sn in enumerate(public_subnets):
      aws.ec2.RouteTableAssociation(
          f"tap-{suffix}-public-rta-{
              i + 1}",
          subnet_id=sn.id,
          route_table_id=prt.id,
          opts=ResourceOptions(
              parent=self,
              provider=west2_provider))
    pulumi.export("public_route_table_id", prt.id)

    # Private route tables
    private_rts = []
    for i, (sn, ngw) in enumerate(zip(private_subnets, nat_gws)):
      rt = aws.ec2.RouteTable(f"tap-{suffix}-private-rt-{i + 1}",
                              vpc_id=vpc.id,
                              tags={**tags, "Name": f"tap-{suffix}-private-rt-{i + 1}"},
                              opts=ResourceOptions(parent=self, provider=west2_provider))
      aws.ec2.Route(f"tap-{suffix}-private-route-{i + 1}",
                    route_table_id=rt.id,
                    destination_cidr_block="0.0.0.0/0",
                    nat_gateway_id=ngw.id,
                    opts=ResourceOptions(parent=self, provider=west2_provider))
      aws.ec2.RouteTableAssociation(
          f"tap-{suffix}-private-rta-{
              i + 1}",
          subnet_id=sn.id,
          route_table_id=rt.id,
          opts=ResourceOptions(
              parent=self,
              provider=west2_provider))
      private_rts.append(rt)
    pulumi.export("private_route_table_ids", [rt.id for rt in private_rts])

    # Public NACL
    pub_nacl = aws.ec2.NetworkAcl(
        f"tap-{suffix}-public-nacl",
        vpc_id=vpc.id,
        tags={
            **tags,
            "Name": f"tap-{suffix}-public-nacl"},
        opts=ResourceOptions(
            parent=self, provider=west2_provider))
    aws.ec2.NetworkAclRule(
        f"tap-{suffix}-public-nacl-in-80",
        network_acl_id=pub_nacl.id,
        rule_number=100,
        protocol="tcp",
        rule_action="allow",
        from_port=80,
        to_port=80,
        cidr_block="0.0.0.0/0",
        egress=False,
        opts=ResourceOptions(
            parent=self, provider=west2_provider))
    aws.ec2.NetworkAclRule(
        f"tap-{suffix}-public-nacl-in-443",
        network_acl_id=pub_nacl.id,
        rule_number=110,
        protocol="tcp",
        rule_action="allow",
        from_port=443,
        to_port=443,
        cidr_block="0.0.0.0/0",
        egress=False,
        opts=ResourceOptions(
            parent=self, provider=west2_provider))
    aws.ec2.NetworkAclRule(
        f"tap-{suffix}-public-nacl-out",
        network_acl_id=pub_nacl.id,
        rule_number=100,
        protocol="-1",
        rule_action="allow",
        cidr_block="0.0.0.0/0",
        egress=True,
        opts=ResourceOptions(
            parent=self,
            provider=west2_provider))
    for i, sn in enumerate(public_subnets):
      aws.ec2.NetworkAclAssociation(
          f"tap-{suffix}-public-nacl-assoc-{
              i + 1}",
          network_acl_id=pub_nacl.id,
          subnet_id=sn.id,
          opts=ResourceOptions(
              parent=self,
              provider=west2_provider))
    pulumi.export("public_nacl_id", pub_nacl.id)

    # Private NACL
    priv_nacl = aws.ec2.NetworkAcl(
        f"tap-{suffix}-private-nacl",
        vpc_id=vpc.id,
        tags={
            **tags,
            "Name": f"tap-{suffix}-private-nacl"},
        opts=ResourceOptions(
            parent=self, provider=west2_provider))
    aws.ec2.NetworkAclRule(
        f"tap-{suffix}-private-nacl-in",
        network_acl_id=priv_nacl.id,
        rule_number=100,
        protocol="-1",
        rule_action="allow",
        cidr_block=vpc.cidr_block,
        egress=False,
        opts=ResourceOptions(
            parent=self,
            provider=west2_provider))
    aws.ec2.NetworkAclRule(
        f"tap-{suffix}-private-nacl-out",
        network_acl_id=priv_nacl.id,
        rule_number=100,
        protocol="-1",
        rule_action="allow",
        cidr_block="0.0.0.0/0",
        egress=True,
        opts=ResourceOptions(
            parent=self,
            provider=west2_provider))
    for i, sn in enumerate(private_subnets):
      aws.ec2.NetworkAclAssociation(
          f"tap-{suffix}-private-nacl-assoc-{
              i + 1}",
          network_acl_id=priv_nacl.id,
          subnet_id=sn.id,
          opts=ResourceOptions(
              parent=self,
              provider=west2_provider))
    pulumi.export("private_nacl_id", priv_nacl.id)

    # Flow Logs
    role = aws.iam.Role(f"tap-{suffix}-flow-logs-role",
                        assume_role_policy=json.dumps({
                            "Version": "2012-10-17",
                            "Statement": [{
                                "Action": "sts:AssumeRole",
                                "Effect": "Allow",
                                "Principal": {"Service": "vpc-flow-logs.amazonaws.com"}
                            }]
                        }),
                        tags={**tags, "Name": f"tap-{suffix}-flow-logs-role"},
                        opts=ResourceOptions(parent=self, provider=west2_provider))

    flow_logs_policy = aws.iam.Policy(
        f"tap-{suffix}-flow-logs-policy",
        description="Allows VPC Flow Logs to publish to CloudWatch Logs",
        policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogGroups",
                    "logs:DescribeLogStreams"
                ],
                "Resource": "*"
            }]
        }),
        opts=ResourceOptions(parent=self, provider=west2_provider),
    )

    aws.iam.RolePolicyAttachment(
        f"tap-{suffix}-flow-logs-policy",
        role=role.name,
        policy_arn=flow_logs_policy.arn,
        opts=ResourceOptions(
            parent=self, provider=west2_provider))
    log_group = aws.cloudwatch.LogGroup(
        f"tap-{suffix}-flow-log-group",
        retention_in_days=30,
        tags={
            **tags,
            "Name": f"tap-{suffix}-flow-log-group"},
        opts=ResourceOptions(
            parent=self, provider=west2_provider))
    flow = aws.ec2.FlowLog(
        f"tap-{suffix}-flow-log",
        iam_role_arn=role.arn,
        log_destination=log_group.arn,
        log_destination_type="cloud-watch-logs",
        vpc_id=vpc.id,
        traffic_type="ALL",
        tags={
            **tags,
            "Name": f"tap-{suffix}-flow-log"},
        opts=ResourceOptions(
            parent=self,
            provider=west2_provider))
    pulumi.export("flow_log_id", flow.id)

    pulumi.export("region", region)
    pulumi.export("availability_zones", azs)

    self.register_outputs({
        "vpc_id": vpc.id,
        "public_subnet_ids": public_subnets,
        "private_subnet_ids": private_subnets,
        "internet_gateway_id": igw.id,
        "nat_gateway_ids": nat_gws,
        "public_nacl_id": pub_nacl.id,
        "private_nacl_id": priv_nacl.id,
        "flow_log_id": flow.id,
        "region": region,
        "availability_zones": azs
    })