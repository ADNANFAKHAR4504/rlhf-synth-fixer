```python

from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_ecs_patterns as ecs_patterns,
    aws_elasticloadbalancingv2 as elbv2,
    aws_servicediscovery as servicediscovery,
    RemovalPolicy,
)
from constructs import Construct


class MicroservicesStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # VPC with 2 AZs, public/private subnets and NAT
        vpc = ec2.Vpc(
            self,
            "MicroservicesVpc",
            max_azs=2,
            nat_gateways=1,
            cidr="10.0.0.0/16",
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
        cluster = ecs.Cluster(
            self,
            "MicroservicesCluster",
            vpc=vpc,
            container_insights=True,
        )

        # Cloud Map namespace for service discovery
        namespace = cluster.add_default_cloud_map_namespace(
            name="micro.local"
        )

        # Application Load Balancer
        lb = elbv2.ApplicationLoadBalancer(
            self,
            "MicroservicesALB",
            vpc=vpc,
            internet_facing=True,
        )

        listener = lb.add_listener("PublicListener", port=80, open=True)

        #
        # Payment Service
        #
        payment_task_def = ecs.FargateTaskDefinition(
            self, "PaymentTaskDef",
            cpu=256,
            memory_limit_mib=512,
        )

        payment_container = payment_task_def.add_container(
            "PaymentContainer",
            image=ecs.ContainerImage.from_registry("nginx:latest"),
            logging=ecs.LogDrivers.aws_logs(stream_prefix="payment"),
        )
        payment_container.add_port_mappings(ecs.PortMapping(container_port=80))

        payment_service = ecs.FargateService(
            self, "PaymentService",
            cluster=cluster,
            task_definition=payment_task_def,
            desired_count=2,
            cloud_map_options=ecs.CloudMapOptions(
                name="payment",
                cloud_map_namespace=namespace,
                dns_record_type=servicediscovery.DnsRecordType.A,
                dns_ttl=cdk.Duration.seconds(30),
            ),
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            assign_public_ip=False,
        )

        listener.add_targets(
            "PaymentTarget",
            port=80,
            targets=[payment_service],
            health_check=elbv2.HealthCheck(
                path="/",
                healthy_http_codes="200",
                interval=cdk.Duration.seconds(30),
            ),
        )

        #
        # Auth Service
        #
        auth_task_def = ecs.FargateTaskDefinition(
            self, "AuthTaskDef",
            cpu=256,
            memory_limit_mib=512,
        )

        auth_container = auth_task_def.add_container(
            "AuthContainer",
            image=ecs.ContainerImage.from_registry("httpd:latest"),
            logging=ecs.LogDrivers.aws_logs(stream_prefix="auth"),
        )
        auth_container.add_port_mappings(ecs.PortMapping(container_port=80))

        auth_service = ecs.FargateService(
            self, "AuthService",
            cluster=cluster,
            task_definition=auth_task_def,
            desired_count=2,
            cloud_map_options=ecs.CloudMapOptions(
                name="auth",
                cloud_map_namespace=namespace,
                dns_record_type=servicediscovery.DnsRecordType.A,
                dns_ttl=cdk.Duration.seconds(30),
            ),
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            assign_public_ip=False,
        )

        # Optional: Add another listener rule or path routing for auth service
        listener.add_targets(
            "AuthTarget",
            port=80,
            targets=[auth_service],
            conditions=[elbv2.ListenerCondition.path_patterns(["/auth*"])],
            health_check=elbv2.HealthCheck(
                path="/",
                healthy_http_codes="200",
                interval=cdk.Duration.seconds(30),
            ),
        )


```