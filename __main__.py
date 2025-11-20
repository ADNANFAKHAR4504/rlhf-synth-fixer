"""Pulumi program entry point for infrastructure migration."""
import pulumi
from lib.tap_stack import TapStack

# Create the infrastructure stack
stack = TapStack("migration-stack")

# Export all stack outputs
pulumi.export("vpc_id", stack.vpc.id)
pulumi.export("ecs_cluster_arn", stack.ecs_cluster.arn)
pulumi.export("ecs_service_name", stack.ecs_service.name)
pulumi.export("alb_dns_name", stack.alb.dns_name)
pulumi.export("alb_arn", stack.alb.arn)
pulumi.export("aurora_cluster_endpoint", stack.aurora_cluster.endpoint)
pulumi.export("aurora_reader_endpoint", stack.aurora_cluster.reader_endpoint)
pulumi.export("aurora_cluster_arn", stack.aurora_cluster.arn)
pulumi.export("dms_replication_instance_arn", stack.dms_replication_instance.replication_instance_arn)
pulumi.export("dms_replication_task_arn", stack.dms_replication_task.replication_task_arn)
pulumi.export("ecr_repository_url", stack.ecr_repository.repository_url)
# Only export route53_record if it exists (skipped if using placeholder hosted zone)
if hasattr(stack, 'route53_record') and stack.route53_record:
    pulumi.export("route53_record_name", stack.route53_record.name)
# Note: cloudwatch_dashboard_name export removed - dashboard not created due to Pulumi API format issue
