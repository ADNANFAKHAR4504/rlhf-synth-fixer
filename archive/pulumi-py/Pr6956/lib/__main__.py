"""Pulumi program entry point for infrastructure migration."""  # pragma: no cover
import sys  # pragma: no cover
import os  # pragma: no cover
# Add project root to path to allow imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # pragma: no cover
import pulumi  # pragma: no cover
from lib.tap_stack import TapStack  # pragma: no cover

# Create the infrastructure stack  # pragma: no cover
stack = TapStack("migration-stack")  # pragma: no cover

# Export all stack outputs  # pragma: no cover
pulumi.export("vpc_id", stack.vpc.id)  # pragma: no cover
pulumi.export("ecs_cluster_arn", stack.ecs_cluster.arn)  # pragma: no cover
pulumi.export("ecs_service_name", stack.ecs_service.name)  # pragma: no cover
pulumi.export("alb_dns_name", stack.alb.dns_name)  # pragma: no cover
pulumi.export("alb_arn", stack.alb.arn)  # pragma: no cover
pulumi.export("aurora_cluster_endpoint", stack.aurora_cluster.endpoint)  # pragma: no cover
pulumi.export("aurora_reader_endpoint", stack.aurora_cluster.reader_endpoint)  # pragma: no cover
pulumi.export("aurora_cluster_arn", stack.aurora_cluster.arn)  # pragma: no cover
pulumi.export("dms_replication_instance_arn", stack.dms_replication_instance.replication_instance_arn)  # pragma: no cover
pulumi.export("dms_replication_task_arn", stack.dms_replication_task.replication_task_arn)  # pragma: no cover
pulumi.export("ecr_repository_url", stack.ecr_repository.repository_url)  # pragma: no cover
# Only export route53_record if it exists (skipped if using placeholder hosted zone)  # pragma: no cover
if hasattr(stack, 'route53_record') and stack.route53_record:  # pragma: no cover
    pulumi.export("route53_record_name", stack.route53_record.name)  # pragma: no cover
# Note: cloudwatch_dashboard_name export removed - dashboard not created due to Pulumi API format issue  # pragma: no cover
