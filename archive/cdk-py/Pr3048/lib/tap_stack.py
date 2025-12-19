"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    Duration,
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_ecs_patterns as ecs_patterns,
    aws_elasticloadbalancingv2 as elbv2,
    aws_servicediscovery as servicediscovery,
    RemovalPolicy,
)
from constructs import Construct

# Import your stacks here
# from .ddb_stack import DynamoDBStack, DynamoDBStackProps


class TapStackProps(cdk.StackProps):
  """
  TapStackProps defines the properties for the TapStack CDK stack.

  Args:
    environment_suffix (Optional[str]): An optional suffix to identify the 
    deployment environment (e.g., 'dev', 'prod').
    **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

  Attributes:
    environment_suffix (Optional[str]): Stores the environment suffix for the stack.
  """

  def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
  """
  Represents the main CDK stack for the Tap project.

  This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
  It determines the environment suffix from the provided properties, 
    CDK context, or defaults to 'dev'.

  Args:
    scope (Construct): The parent construct.
    construct_id (str): The unique identifier for this stack.
    props (Optional[TapStackProps]): Optional properties for configuring the 
      stack, including environment suffix.
    **kwargs: Additional keyword arguments passed to the CDK Stack.

  Attributes:
    environment_suffix (str): The environment suffix used for resource naming and configuration.
    vpc (ec2.Vpc): The VPC for the microservices.
    cluster (ecs.Cluster): The ECS cluster for running services.
    load_balancer (elbv2.ApplicationLoadBalancer): The application load balancer.
    payment_service (ecs.FargateService): The payment microservice.
    auth_service (ecs.FargateService): The auth microservice.
  """

  def __init__(
          self,
          scope: Construct,
          construct_id: str, 
          props: Optional[TapStackProps] = None, 
          **kwargs):
    super().__init__(scope, construct_id, **kwargs)

    # Get environment suffix from props, context, or use 'dev' as default
    environment_suffix = (
        props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'

    # Create VPC with 2 AZs, public/private subnets and NAT
    self.vpc = ec2.Vpc(
        self,
        f"MicroservicesVpc{environment_suffix}",
        max_azs=2,
        nat_gateways=1,
        ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),  # Fixed deprecated cidr parameter
        subnet_configuration=[
            ec2.SubnetConfiguration(
                name="Public",
                subnet_type=ec2.SubnetType.PUBLIC,
                cidr_mask=24,
            ),
            ec2.SubnetConfiguration(
                name="Private",
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                cidr_mask=24,
            ),
        ],
    )

    # ECS cluster in the VPC
    self.cluster = ecs.Cluster(
        self,
        f"MicroservicesCluster{environment_suffix}",
        vpc=self.vpc,
        enable_fargate_capacity_providers=True,  # Fixed deprecated containerInsights
    )

    # Enable Container Insights separately
    self.cluster.add_default_capacity_provider_strategy([
        ecs.CapacityProviderStrategy(
            capacity_provider="FARGATE",
            weight=1
        )
    ])

    # Cloud Map namespace for service discovery
    self.namespace = self.cluster.add_default_cloud_map_namespace(
        name=f"micro-{environment_suffix}.local"
    )

    # Application Load Balancer
    self.load_balancer = elbv2.ApplicationLoadBalancer(
        self,
        f"MicroservicesALB{environment_suffix}",
        vpc=self.vpc,
        internet_facing=True,
    )

    self.listener = self.load_balancer.add_listener("PublicListener", port=80, open=True)

    # Create Payment Service
    self._create_payment_service(environment_suffix)
    
    # Create Auth Service
    self._create_auth_service(environment_suffix)

    # Add outputs for monitoring and integration
    self._add_outputs(environment_suffix)

  def _create_payment_service(self, environment_suffix: str):
    """Create the Payment microservice with Fargate and service discovery."""
    
    # Payment Service Task Definition
    payment_task_def = ecs.FargateTaskDefinition(
        self, 
        f"PaymentTaskDef{environment_suffix}",
        cpu=256,
        memory_limit_mib=512,
    )

    payment_container = payment_task_def.add_container(
        "PaymentContainer",
        image=ecs.ContainerImage.from_registry("nginx:latest"),
        logging=ecs.LogDrivers.aws_logs(stream_prefix=f"payment-{environment_suffix}"),
    )
    payment_container.add_port_mappings(ecs.PortMapping(container_port=80))

    # Payment Service
    self.payment_service = ecs.FargateService(
        self, 
        f"PaymentService{environment_suffix}",
        cluster=self.cluster,
        task_definition=payment_task_def,
        desired_count=2,
        cloud_map_options=ecs.CloudMapOptions(
            name="payment",
            cloud_map_namespace=self.namespace,
            dns_record_type=servicediscovery.DnsRecordType.A,
            dns_ttl=Duration.seconds(30),
        ),
        vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
        assign_public_ip=False,
    )

    # Add Payment Service to Load Balancer (default target - no conditions)
    self.listener.add_targets(
        f"PaymentTarget{environment_suffix}",
        port=80,
        targets=[self.payment_service],
        health_check=elbv2.HealthCheck(
            path="/",
            healthy_http_codes="200",
            interval=Duration.seconds(30),
        ),
    )

  def _create_auth_service(self, environment_suffix: str):
    """Create the Auth microservice with Fargate and service discovery."""
    
    # Auth Service Task Definition
    auth_task_def = ecs.FargateTaskDefinition(
        self, 
        f"AuthTaskDef{environment_suffix}",
        cpu=256,
        memory_limit_mib=512,
    )

    auth_container = auth_task_def.add_container(
        "AuthContainer",
        image=ecs.ContainerImage.from_registry("httpd:latest"),
        logging=ecs.LogDrivers.aws_logs(stream_prefix=f"auth-{environment_suffix}"),
    )
    auth_container.add_port_mappings(ecs.PortMapping(container_port=80))

    # Auth Service
    self.auth_service = ecs.FargateService(
        self, 
        f"AuthService{environment_suffix}",
        cluster=self.cluster,
        task_definition=auth_task_def,
        desired_count=2,
        cloud_map_options=ecs.CloudMapOptions(
            name="auth",
            cloud_map_namespace=self.namespace,
            dns_record_type=servicediscovery.DnsRecordType.A,
            dns_ttl=Duration.seconds(30),
        ),
        vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
        assign_public_ip=False,
    )

    # Add Auth Service to Load Balancer with path-based routing and priority
    self.listener.add_targets(
        f"AuthTarget{environment_suffix}",
        port=80,
        targets=[self.auth_service],
        conditions=[elbv2.ListenerCondition.path_patterns(["/auth*"])],
        priority=100,  # Added required priority for path-based routing
        health_check=elbv2.HealthCheck(
            path="/",
            healthy_http_codes="200",
            interval=Duration.seconds(30),
        ),
    )

  def _add_outputs(self, environment_suffix: str):
    """Add CloudFormation outputs for the stack."""
    
    cdk.CfnOutput(
        self,
        f"LoadBalancerDNS",
        value=self.load_balancer.load_balancer_dns_name,
        description="DNS name of the Application Load Balancer",
    )

    cdk.CfnOutput(
        self,
        f"VpcId",
        value=self.vpc.vpc_id,
        description="ID of the VPC",
    )

    cdk.CfnOutput(
        self,
        f"ClusterName",
        value=self.cluster.cluster_name,
        description="Name of the ECS Cluster",
    )

    cdk.CfnOutput(
        self,
        f"PaymentServiceName",
        value=self.payment_service.service_name,
        description="Name of the Payment Service",
    )

    cdk.CfnOutput(
        self,
        f"AuthServiceName",
        value=self.auth_service.service_name,
        description="Name of the Auth Service",
    )

    cdk.CfnOutput(
        self,
        f"ServiceDiscoveryNamespace",
        value=self.namespace.namespace_name,
        description="Service Discovery Namespace",
    )
