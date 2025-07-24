import os
import sys
import types
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))
from aws_cdk import App, Environment
from lib.cdk.vpc_stack import VpcStack
from lib.cdk.ecs_stack import EcsStack
from lib.cdk.rds_stack import RdsStack
from lib.cdk.monitoring_stack import MonitoringStack
from lib.cdk.cicd_stack import CicdStack
from lib.cdk.vpc_peering_stack import VpcPeeringStack
from lib.cdk.route53_stack import Route53Stack

stack_suffix = os.environ.get("STACK_NAME_SUFFIX", "dev")
app = App(context={
  "stack": stack_suffix,
  "aws:cdk:enable-cross-region-references": True
  })
stack_suffix = app.node.try_get_context("stack") or "dev"

# Configuration
env_us_east_1 = Environment(region="us-east-1")
env_us_east_2 = Environment(region="us-east-2")
app_name = "app"
stack_suffix = app.node.try_get_context("stack") or "dev"

# Create stacks for each region
regions = [env_us_east_1, env_us_east_2]
vpcs = {}
ecs_stacks = {}
rds_stacks = {}
for env in regions:
    region = env.region
    vpc_stack = VpcStack(app, f"{app_name}-vpc-{region}-{stack_suffix}", env=env)
    vpcs[region] = vpc_stack

    ecs_stack = EcsStack(
        app,
        f"{app_name}-ecs-{region}-{stack_suffix}",
        env=env,
        task_image_options=None
    )
    ecs_stacks[region] = ecs_stack

    rds_stack = RdsStack(
        app,
        f"{app_name}-rds-{region}-{stack_suffix}",
        vpc=vpc_stack.vpc,
        env=env
    )
    rds_stacks[region] = rds_stack

    MonitoringStack(
        app,
        f"{app_name}-monitoring-{region}-{stack_suffix}",
        ecs_service=ecs_stack.ecs_service,
        rds_instance=rds_stack.rds_instance,
        env=env
    )

# VPC Peering
peering_stack = VpcPeeringStack(
    app,
    f"{app_name}-peering-{stack_suffix}",
    vpc1=vpcs["us-east-1"].vpc,
    vpc2=vpcs["us-east-2"].vpc,
    env=env_us_east_1,
    cross_region_references=True 
)

ecs_stack_primary = ecs_stacks["us-east-1"]

cicd_stack = CicdStack(
    app,
    f"{app_name}-cicd-{stack_suffix}",
    fargate_service=ecs_stack_primary.ecs_service,
    listener=ecs_stack_primary.listener,
    blue_target_group=ecs_stack_primary.blue_target_group,
    green_target_group=ecs_stack_primary.green_target_group,
    env=env_us_east_1
)

# Route 53 Failover
route53_stack = Route53Stack(
    app,
    f"{app_name}-route53-{stack_suffix}",
    alb1=ecs_stacks["us-east-1"].load_balancer,
    alb2=ecs_stacks["us-east-2"].load_balancer,
    env=env_us_east_1,
    cross_region_references=True
)
app.synth()