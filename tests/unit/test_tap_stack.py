import unittest
from typing import Any
import pulumi
from pulumi.runtime import set_mocks, Mocks, MockResourceArgs, MockCallArgs

from lib.tap_stack import TapStack, TapStackArgs


class MockVpc:
  def __init__(self, id_val="mock-vpc-id", cidr_block="10.0.0.0/16"):
    self.id = pulumi.Output.from_input(id_val)
    self.cidr_block = pulumi.Output.from_input(cidr_block)


class MockInternetGateway:
  def __init__(self, id_val="mock-igw-id"):
    self.id = pulumi.Output.from_input(id_val)


class MockSubnet:
  def __init__(self, id_val="mock-subnet-id"):
    self.id = pulumi.Output.from_input(id_val)


class MockRouteTable:
  def __init__(self, id_val="mock-rt-id"):
    self.id = pulumi.Output.from_input(id_val)


class MockSecurityGroup:
  def __init__(self, id_val="mock-sg-id"):
    self.id = pulumi.Output.from_input(id_val)


class MockLoadBalancer:
  def __init__(self, dns_name="mock-lb-dns", zone_id="mock-lb-zone-id", arn="mock-lb-arn"):
    self.dns_name = pulumi.Output.from_input(dns_name)
    self.zone_id = pulumi.Output.from_input(zone_id)
    self.arn = pulumi.Output.from_input(arn)


class MockTargetGroup:
  def __init__(self, arn="mock-tg-arn"):
    self.arn = pulumi.Output.from_input(arn)


class MockRdsInstance:
  def __init__(self, id_val="mock-rds-id", endpoint="mock-rds-endpoint", port=5432):
    self.id = pulumi.Output.from_input(id_val)
    self.endpoint = pulumi.Output.from_input(endpoint)
    self.port = pulumi.Output.from_input(port)


class MockNetworkInfrastructure(pulumi.ComponentResource):
  def __init__(self, name: str, _region: str, _environment: str, _tags: dict, opts: Any = None):
    super().__init__('aws:components:NetworkInfrastructure', name, None, opts)
    self.vpc = MockVpc(id_val=f"{name}-vpc-id")
    self.internet_gateway = MockInternetGateway(id_val=f"{name}-igw-id")
    self.public_subnet_ids = pulumi.Output.from_input(
      [f"{name}-public-subnet-1-id", f"{name}-public-subnet-2-id"]
    )
    self.private_subnet_ids = pulumi.Output.from_input(
      [f"{name}-private-subnet-1-id", f"{name}-private-subnet-2-id"]
    )
    self.vpc_security_group = MockSecurityGroup(id_val=f"{name}-vpc-sg-id")
    self.availability_zones = pulumi.Output.from_input(["us-west-2a", "us-west-2b"])
    self.register_outputs({
      "vpc_id": self.vpc.id,
      "public_subnet_ids": self.public_subnet_ids,
      "private_subnet_ids": self.private_subnet_ids,
      "vpc_security_group_id": self.vpc_security_group.id,
      "availability_zones": self.availability_zones,
    })


class MockDatabaseInfrastructure(pulumi.ComponentResource):
  def __init__(
    self,
    name: str,
    _vpc_id: Any,
    _private_subnet_ids: Any,
    _vpc_security_group_id: Any,
    _tags: dict,
    opts: Any = None
  ):
    super().__init__('aws:components:DatabaseInfrastructure', name, None, opts)
    self.rds_instance = MockRdsInstance(id_val=f"{name}-postgres-id", endpoint=f"{name}-postgres-endpoint")
    self.rds_security_group = MockSecurityGroup(id_val=f"{name}-rds-sg-id")
    self.db_subnet_group = MockSubnet(id_val=f"{name}-db-subnet-group-name")
    self.db_password = MockSecurityGroup(id_val=f"{name}-db-password-secret-id")
    self.register_outputs({
      "rds_instance_id": self.rds_instance.id,
      "rds_endpoint": self.rds_instance.endpoint,
      "rds_security_group_id": self.rds_security_group.id,
      "db_subnet_group_name": self.db_subnet_group.id,
      "db_password_secret_id": self.db_password.id,
    })


class MockLoadBalancerInfrastructure(pulumi.ComponentResource):
  def __init__(self, name: str, _vpc_id: Any, _public_subnet_ids: Any, _tags: dict, opts: Any = None):
    super().__init__('aws:components:LoadBalancerInfrastructure', name, None, opts)
    self.load_balancer = MockLoadBalancer(
      dns_name=f"{name}-alb-dns.mock.elb.amazonaws.com",
      zone_id=f"{name}-alb-zone-id",
      arn=f"{name}-alb-arn"
    )
    self.target_group = MockTargetGroup(arn=f"{name}-tg-arn")
    self.lb_security_group = MockSecurityGroup(id_val=f"{name}-lb-sg-id")
    self.register_outputs({
      "load_balancer_arn": self.load_balancer.arn,
      "load_balancer_dns": self.load_balancer.dns_name,
      "load_balancer_zone_id": self.load_balancer.zone_id,
      "target_group_arn": self.target_group.arn,
      "lb_security_group_id": self.lb_security_group.id,
    })


class MockComputeInfrastructure(pulumi.ComponentResource):
  def __init__(
    self,
    name: str,
    _vpc_id: Any,
    _private_subnet_ids: Any,
    _load_balancer_security_group_id: Any,
    _target_group_arn: Any,
    _tags: dict,
    opts: Any = None
  ):
    super().__init__('aws:components:ComputeInfrastructure', name, None, opts)
    self.instance_ids = pulumi.Output.from_input(
      [f"{name}-instance-1-id", f"{name}-instance-2-id"]
    )
    self.ec2_security_group = MockSecurityGroup(id_val=f"{name}-ec2-sg-id")
    self.launch_template = MockSecurityGroup(id_val=f"{name}-lt-id")
    self.auto_scaling_group = MockSecurityGroup(id_val=f"{name}-asg-name")
    self.register_outputs({
      "instance_ids": self.instance_ids,
      "ec2_security_group_id": self.ec2_security_group.id,
      "launch_template_id": self.launch_template.id,
      "auto_scaling_group_name": self.auto_scaling_group.id,
    })


class MyMocks(Mocks):
  def new_resource(self, args: MockResourceArgs):
    if args.typ == "aws:secretsmanager/secret:Secret":
      return [
        args.name + "-id",
        {
          "arn": f"arn:aws:secretsmanager:mock-region:123456789012:secret:{args.name}",
          "name": args.name,
          "id": args.name + "-id",
          "description": args.inputs.get("description"),
          "tags": args.inputs.get("tags", {}),
        }
      ]
    elif args.typ == "random:index/randomPassword:RandomPassword":
      return [
        args.name + "-id",
        {
          "id": args.name + "-id",
          "length": args.inputs.get("length"),
          "special": args.inputs.get("special"),
          "override_special": args.inputs.get("override_special"),
          "result": "mock-generated-random-password",
        }
      ]
    elif args.typ == "aws:secretsmanager/secretVersion:SecretVersion":
      return [
        args.name + "-id",
        {
          "id": args.name + "-id",
          "arn": f"arn:aws:secretsmanager:mock-region:123456789012:secretversion:{args.name}",
          "secret_id": args.inputs.get("secret_id"),
          "secret_string": args.inputs.get("secret_string"),
        }
      ]
    elif args.typ == "aws:lb/loadBalancer:LoadBalancer":
      return [
        args.name + "-id",
        {
          "id": args.name + "-id",
          "name": args.name,
          "arn": f"arn:aws:elasticloadbalancing:mock-region:123456789012:loadbalancer/app/{args.name}/mock-id",
          "dns_name": f"{args.name}-dns.mock.elb.amazonaws.com",
          "zone_id": f"{args.name}-zone-id",
          "security_groups": args.inputs.get("security_groups", []),
          "subnets": args.inputs.get("subnets", []),
          "load_balancer_type": args.inputs.get("load_balancer_type"),
          "enable_deletion_protection": args.inputs.get("enable_deletion_protection", False),
          "tags": args.inputs.get("tags", {}),
        }
      ]

    outputs = dict(args.inputs)
    outputs["id"] = args.name + "-id"
    outputs["name"] = args.name

    if args.typ == "aws:ec2/vpc:Vpc":
      outputs["cidr_block"] = "10.0.0.0/16"
    elif args.typ == "aws:rds/instance:Instance":
      outputs["endpoint"] = args.name + "-endpoint"
      outputs["port"] = 5432

    for key in ["opts", "urn", "generate_secret_string", "scheme"]:
      outputs.pop(key, None)

    return [outputs["id"], outputs]

  def call(self, args: MockCallArgs):
    if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
      return {"names": ["us-west-2a", "us-west-2b", "us-west-2c"]}
    if args.token == "aws:ec2/getAmi:getAmi":
      return {"id": "mock-ami-id"}
    return {}


import sys
sys.modules['lib.components.networking'] = sys.modules[__name__]
sys.modules['lib.components.compute'] = sys.modules[__name__]
sys.modules['lib.components.database'] = sys.modules[__name__]
sys.modules['lib.components.load_balancer'] = sys.modules[__name__]


class TapStackTest(unittest.TestCase):
  @pulumi.runtime.test
  def test_tap_stack_creation(self):
    set_mocks(MyMocks())
    args = TapStackArgs(
      environment_suffix="test",
      region="us-west-2",
      tags={"Project": "TestProject"}
    )
    tap_stack = TapStack("test-tap-stack", args)

    return pulumi.Output.all(
      tap_stack.network.vpc.id,
      tap_stack.load_balancer.load_balancer.dns_name,
      tap_stack.load_balancer.load_balancer.zone_id,
      tap_stack.database.rds_instance.endpoint,
      tap_stack.compute.instance_ids,
      tap_stack.network.availability_zones,
    ).apply(lambda outputs: self.verify_outputs(outputs))

  def verify_outputs(self, outputs):
    vpc_id, lb_dns, lb_zone_id, rds_endpoint, ec2_instance_ids, availability_zones = outputs
    self.assertEqual(vpc_id, "test-tap-stack-network-vpc-id")
    self.assertEqual(lb_dns, "test-tap-stack-lb-alb-dns.mock.elb.amazonaws.com")
    self.assertEqual(lb_zone_id, "test-tap-stack-lb-alb-zone-id")
    self.assertEqual(rds_endpoint, "test-tap-stack-database-postgres-endpoint")
    self.assertEqual(ec2_instance_ids, [
      "test-tap-stack-compute-instance-1-id",
      "test-tap-stack-compute-instance-2-id"
    ])
    self.assertEqual(availability_zones, ["us-west-2a", "us-west-2b"])


if __name__ == '__main__':
  unittest.main()
