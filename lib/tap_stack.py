import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions
from typing import Optional, Dict, List
import json


class TapStackArgs:
  def __init__(
          self,
          environment_suffix: Optional[str] = None,
          tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or 'dev'
    self.tags = tags or {}


class SecureVPC:
  def __init__(self, name_prefix: str, vpc_cidr: str, tags: Dict[str, str]):
    self.name_prefix = name_prefix
    self.vpc_cidr = vpc_cidr
    self.tags = tags
    self.region = aws.get_region().name
    self.availability_zones = aws.get_availability_zones(
        state="available").names[:2]

    self.vpc = self._create_vpc()
    self.igw = self._create_internet_gateway()
    self.public_subnets = self._create_public_subnets()
    self.private_subnets = self._create_private_subnets()
    self.eips = self._create_elastic_ips()
    self.nat_gateways = self._create_nat_gateways()
    self.public_rt = self._create_public_route_table()
    self.private_rts = self._create_private_route_tables()
    self.public_nacl = self._create_public_nacl()
    self.private_nacl = self._create_private_nacl()
    self.flow_logs_role = self._create_flow_logs_role()
    self.flow_logs = self._create_flow_logs()

  def _create_vpc(self):
    return aws.ec2.Vpc(f"{self.name_prefix}-vpc",
                       cidr_block=self.vpc_cidr,
                       enable_dns_support=True,
                       enable_dns_hostnames=True,
                       tags={**self.tags, "Name": f"{self.name_prefix}-vpc"})

  def _create_internet_gateway(self):
    return aws.ec2.InternetGateway(
        f"{
            self.name_prefix}-igw",
        vpc_id=self.vpc.id,
        tags={
            **self.tags,
            "Name": f"{
                self.name_prefix}-igw"})

  def _create_public_subnets(self):
    subnets = []
    for i, az in enumerate(self.availability_zones):
      subnets.append(aws.ec2.Subnet(f"{self.name_prefix}-public-{i + 1}",
                                    vpc_id=self.vpc.id,
                                    cidr_block=f"10.0.{i + 1}.0/24",
                                    availability_zone=az,
                                    map_public_ip_on_launch=True,
                                    tags={**self.tags, "Name": f"{self.name_prefix}-public-{i + 1}"}))
    return subnets

  def _create_private_subnets(self):
    subnets = []
    for i, az in enumerate(self.availability_zones):
      subnets.append(aws.ec2.Subnet(f"{self.name_prefix}-private-{i + 1}",
                                    vpc_id=self.vpc.id,
                                    cidr_block=f"10.0.{(i + 1) * 10}.0/24",
                                    availability_zone=az,
                                    tags={**self.tags, "Name": f"{self.name_prefix}-private-{i + 1}"}))
    return subnets

  def _create_elastic_ips(self):
    return [
        aws.ec2.Eip(
            f"{
                self.name_prefix}-nat-eip-{
                i +
                1}",
            domain="vpc",
            tags={
                **self.tags,
                "Name": f"{
                    self.name_prefix}-nat-eip-{
                    i +
                    1}"}) for i in range(
            len(
                self.availability_zones))]

  def _create_nat_gateways(self):
    return [
        aws.ec2.NatGateway(
            f"{
                self.name_prefix}-nat-{
                i +
                1}",
            allocation_id=self.eips[i].id,
            subnet_id=self.public_subnets[i].id,
            tags={
                **self.tags,
                "Name": f"{
                    self.name_prefix}-nat-{
                    i +
                    1}"}) for i in range(
            len(
                self.availability_zones))]

  def _create_public_route_table(self):
    rt = aws.ec2.RouteTable(
        f"{
            self.name_prefix}-public-rt",
        vpc_id=self.vpc.id,
        tags={
            **self.tags,
            "Name": f"{
                self.name_prefix}-public-rt"})
    aws.ec2.Route(f"{self.name_prefix}-public-route",
                  route_table_id=rt.id,
                  destination_cidr_block="0.0.0.0/0",
                  gateway_id=self.igw.id)
    for i, subnet in enumerate(self.public_subnets):
      aws.ec2.RouteTableAssociation(f"{self.name_prefix}-public-rta-{i + 1}",
                                    route_table_id=rt.id,
                                    subnet_id=subnet.id)
    return rt

  def _create_private_route_tables(self):
    rts = []
    for i, subnet in enumerate(self.private_subnets):
      rt = aws.ec2.RouteTable(f"{self.name_prefix}-private-rt-{i + 1}",
                              vpc_id=self.vpc.id,
                              tags={**self.tags, "Name": f"{self.name_prefix}-private-rt-{i + 1}"})
      aws.ec2.Route(f"{self.name_prefix}-private-route-{i + 1}",
                    route_table_id=rt.id,
                    destination_cidr_block="0.0.0.0/0",
                    nat_gateway_id=self.nat_gateways[i].id)
      aws.ec2.RouteTableAssociation(f"{self.name_prefix}-private-rta-{i + 1}",
                                    route_table_id=rt.id,
                                    subnet_id=subnet.id)
      rts.append(rt)
    return rts

  def _create_public_nacl(self):
    nacl = aws.ec2.NetworkAcl(
        f"{
            self.name_prefix}-public-nacl",
        vpc_id=self.vpc.id,
        tags={
            **self.tags,
            "Name": f"{
                self.name_prefix}-public-nacl"})
    aws.ec2.NetworkAclRule(f"{self.name_prefix}-public-http",
                           network_acl_id=nacl.id,
                           rule_number=100, protocol="tcp",
                           rule_action="allow", from_port=80, to_port=80,
                           cidr_block="0.0.0.0/0")
    aws.ec2.NetworkAclRule(f"{self.name_prefix}-public-https",
                           network_acl_id=nacl.id,
                           rule_number=110, protocol="tcp",
                           rule_action="allow", from_port=443, to_port=443,
                           cidr_block="0.0.0.0/0")
    for i, subnet in enumerate(self.public_subnets):
      aws.ec2.NetworkAclAssociation(
          f"{
              self.name_prefix}-public-nacl-assoc-{
              i + 1}",
          network_acl_id=nacl.id,
          subnet_id=subnet.id)
    return nacl

  def _create_private_nacl(self):
    nacl = aws.ec2.NetworkAcl(
        f"{
            self.name_prefix}-private-nacl",
        vpc_id=self.vpc.id,
        tags={
            **self.tags,
            "Name": f"{
                self.name_prefix}-private-nacl"})
    for i, subnet in enumerate(self.private_subnets):
      aws.ec2.NetworkAclAssociation(
          f"{
              self.name_prefix}-private-nacl-assoc-{
              i + 1}",
          network_acl_id=nacl.id,
          subnet_id=subnet.id)
    return nacl

  def _create_flow_logs_role(self):
    assume_policy = json.dumps({"Version": "2012-10-17",
                                "Statement": [{"Action": "sts:AssumeRole",
                                               "Effect": "Allow",
                                               "Principal": {"Service": "vpc-flow-logs.amazonaws.com"}}]})
    role = aws.iam.Role(
        f"{
            self.name_prefix}-flowlogs-role",
        assume_role_policy=assume_policy,
        tags={
            **self.tags,
            "Name": f"{
                self.name_prefix}-flowlogs-role"})
    aws.iam.RolePolicyAttachment(
        f"{
            self.name_prefix}-flowlogs-policy",
        role=role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/VPCFlowLogsDeliveryRolePolicy")
    return role

  def _create_flow_logs(self):
    log_group = aws.cloudwatch.LogGroup(
        f"{
            self.name_prefix}-flowlogs-lg",
        retention_in_days=30,
        tags={
            **self.tags,
            "Name": f"{
                self.name_prefix}-flowlogs-lg"})
    return aws.ec2.FlowLog(
        f"{
            self.name_prefix}-flowlogs",
        iam_role_arn=self.flow_logs_role.arn,
        log_destination=log_group.arn,
        log_destination_type="cloud-watch-logs",
        vpc_id=self.vpc.id,
        traffic_type="ALL",
        tags={
            **self.tags,
            "Name": f"{
                self.name_prefix}-flowlogs"})


class TapStack(pulumi.ComponentResource):
  def __init__(self, name: str, args: TapStackArgs,
               opts: Optional[ResourceOptions] = None):
    super().__init__('tap:stack:TapStack', name, None, opts)
    vpc_module = SecureVPC(name_prefix=f"tap-{args.environment_suffix}",
                           vpc_cidr="10.0.0.0/16",
                           tags=args.tags)
    pulumi.export("vpc_id", vpc_module.vpc.id)
    pulumi.export("public_subnets", [s.id for s in vpc_module.public_subnets])
    pulumi.export(
        "private_subnets", [
            s.id for s in vpc_module.private_subnets])
    pulumi.export("nat_gateways", [n.id for n in vpc_module.nat_gateways])
    pulumi.export("internet_gateway", vpc_module.igw.id)
    pulumi.export("public_nacl", vpc_module.public_nacl.id)
    pulumi.export("private_nacl", vpc_module.private_nacl.id)
    pulumi.export("flow_logs", vpc_module.flow_logs.id)
    self.register_outputs({})
