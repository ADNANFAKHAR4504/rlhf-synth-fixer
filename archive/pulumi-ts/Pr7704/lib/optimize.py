#!/usr/bin/env python3
"""
ECS Fargate Infrastructure Optimizer

This script optimizes deployed ECS Fargate resources to reduce costs while
maintaining performance. It modifies live AWS resources after deployment.

Usage:
    python optimize.py [--dry-run] [--region REGION]

Environment Variables:
    ENVIRONMENT_SUFFIX: Required - Suffix for resource identification
    AWS_REGION: Optional - AWS region (default: us-east-1)
"""

import os
import sys
import json
import argparse
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime

try:
    import boto3
    from botocore.exceptions import ClientError, WaiterError
except ImportError:
    print("Error: boto3 is required. Install with: pip install boto3")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ECSFargateOptimizer:
    """Optimizer for ECS Fargate infrastructure resources."""

    def __init__(self, environment_suffix: str, region_name: str = "us-east-1", dry_run: bool = False):
        """
        Initialize the optimizer.

        Args:
            environment_suffix: Suffix used in resource names
            region_name: AWS region name
            dry_run: If True, only show what would be changed without making changes
        """
        self.environment_suffix = environment_suffix
        self.region_name = region_name
        self.dry_run = dry_run

        # Initialize AWS clients
        self.ecs_client = boto3.client('ecs', region_name=region_name)
        self.ecr_client = boto3.client('ecr', region_name=region_name)
        self.cloudwatch_client = boto3.client('cloudwatch', region_name=region_name)
        self.autoscaling_client = boto3.client('application-autoscaling', region_name=region_name)

        # Cost calculation constants (rough estimates)
        self.FARGATE_CPU_HOUR_COST = 0.04048  # per vCPU per hour
        self.FARGATE_MEMORY_GB_HOUR_COST = 0.004445  # per GB per hour
        self.ECR_STORAGE_GB_MONTH_COST = 0.10  # per GB per month

        self.changes_made = []
        self.cost_savings = {
            'cpu_savings': 0.0,
            'memory_savings': 0.0,
            'task_count_savings': 0.0,
            'ecr_storage_savings': 0.0,
            'total_monthly_savings': 0.0
        }

    def find_ecs_resources(self) -> Dict[str, Any]:
        """
        Find ECS resources using the environment suffix.

        Returns:
            Dictionary containing cluster, service, and task definition ARNs
        """
        logger.info(f"Finding ECS resources with suffix: {self.environment_suffix}")

        resources = {
            'cluster_arn': None,
            'service_arn': None,
            'task_definition_arn': None,
            'cluster_name': None,
            'service_name': None,
        }

        try:
            # Find ECS cluster
            clusters_response = self.ecs_client.list_clusters()
            for cluster_arn in clusters_response.get('clusterArns', []):
                cluster_name = cluster_arn.split('/')[-1]
                if self.environment_suffix in cluster_name:
                    resources['cluster_arn'] = cluster_arn
                    resources['cluster_name'] = cluster_name
                    logger.info(f"Found ECS cluster: {cluster_name}")
                    break

            if not resources['cluster_arn']:
                raise ValueError(f"No ECS cluster found with suffix: {self.environment_suffix}")

            # Find ECS service
            services_response = self.ecs_client.list_services(cluster=resources['cluster_arn'])
            for service_arn in services_response.get('serviceArns', []):
                service_name = service_arn.split('/')[-1]
                if self.environment_suffix in service_name:
                    resources['service_arn'] = service_arn
                    resources['service_name'] = service_name
                    logger.info(f"Found ECS service: {service_name}")
                    break

            if not resources['service_arn']:
                raise ValueError(f"No ECS service found with suffix: {self.environment_suffix}")

            # Get current task definition
            service_details = self.ecs_client.describe_services(
                cluster=resources['cluster_arn'],
                services=[resources['service_arn']]
            )
            if service_details['services']:
                resources['task_definition_arn'] = service_details['services'][0]['taskDefinition']
                logger.info(f"Current task definition: {resources['task_definition_arn']}")

            return resources

        except ClientError as e:
            logger.error(f"Error finding ECS resources: {e}")
            raise

    def optimize_task_definition(self, current_task_def_arn: str) -> Optional[str]:
        """
        Create optimized task definition with reduced CPU/memory.

        Args:
            current_task_def_arn: ARN of current task definition

        Returns:
            ARN of new optimized task definition, or None if no optimization needed
        """
        logger.info("Optimizing task definition...")

        try:
            # Describe current task definition
            response = self.ecs_client.describe_task_definition(
                taskDefinition=current_task_def_arn
            )
            current_task_def = response['taskDefinition']

            current_cpu = int(current_task_def['cpu'])
            current_memory = int(current_task_def['memory'])

            logger.info(f"Current CPU: {current_cpu}, Memory: {current_memory}")

            # Calculate optimized values (conservative optimization for stability)
            # For tasks already at baseline (512/1024), no further optimization needed
            # This ensures tasks can start and stabilize properly
            if current_cpu <= 512:
                optimized_cpu = current_cpu  # Already at minimum safe value
                optimized_memory = current_memory
            else:
                # Only optimize if significantly over-provisioned
                optimized_cpu = max(current_cpu // 2, 512)
                optimized_memory = max(current_memory // 2, 1024)

            logger.info(f"Optimized CPU: {optimized_cpu}, Memory: {optimized_memory}")

            if optimized_cpu == current_cpu and optimized_memory == current_memory:
                logger.info("Task definition already optimized")
                return None

            # Calculate cost savings
            cpu_hours_saved = ((current_cpu - optimized_cpu) / 1024) * 730  # monthly hours
            memory_gb_hours_saved = ((current_memory - optimized_memory) / 1024) * 730

            self.cost_savings['cpu_savings'] = cpu_hours_saved * self.FARGATE_CPU_HOUR_COST
            self.cost_savings['memory_savings'] = memory_gb_hours_saved * self.FARGATE_MEMORY_GB_HOUR_COST

            if self.dry_run:
                logger.info(f"[DRY RUN] Would create new task definition with CPU={optimized_cpu}, Memory={optimized_memory}")
                return current_task_def_arn

            # Create new task definition
            new_task_def = {
                'family': current_task_def['family'],
                'taskRoleArn': current_task_def.get('taskRoleArn'),
                'executionRoleArn': current_task_def.get('executionRoleArn'),
                'networkMode': current_task_def['networkMode'],
                'containerDefinitions': current_task_def['containerDefinitions'],
                'requiresCompatibilities': current_task_def['requiresCompatibilities'],
                'cpu': str(optimized_cpu),
                'memory': str(optimized_memory),
            }

            # Add optional fields if present
            if 'volumes' in current_task_def:
                new_task_def['volumes'] = current_task_def['volumes']
            if 'placementConstraints' in current_task_def:
                new_task_def['placementConstraints'] = current_task_def['placementConstraints']

            response = self.ecs_client.register_task_definition(**new_task_def)
            new_task_def_arn = response['taskDefinition']['taskDefinitionArn']

            logger.info(f"Created new task definition: {new_task_def_arn}")
            self.changes_made.append(f"Task definition optimized: CPU {current_cpu}→{optimized_cpu}, Memory {current_memory}→{optimized_memory}")

            return new_task_def_arn

        except ClientError as e:
            logger.error(f"Error optimizing task definition: {e}")
            raise

    def optimize_service_scaling(self, cluster_arn: str, service_arn: str, service_name: str, new_task_def_arn: Optional[str]) -> bool:
        """
        Optimize ECS service by reducing task count and updating task definition.

        Args:
            cluster_arn: ECS cluster ARN
            service_arn: ECS service ARN
            service_name: ECS service name
            new_task_def_arn: New task definition ARN (if optimized)

        Returns:
            True if optimization was successful
        """
        logger.info("Optimizing service scaling...")

        try:
            # Get current service configuration
            service_details = self.ecs_client.describe_services(
                cluster=cluster_arn,
                services=[service_arn]
            )
            service = service_details['services'][0]
            current_desired_count = service['desiredCount']
            current_running_count = service.get('runningCount', 0)

            # Check if service is healthy before optimization
            if current_running_count < current_desired_count:
                logger.warning(f"Service not fully stable: {current_running_count}/{current_desired_count} tasks running")
                logger.warning("Waiting 60s for service to stabilize before optimization...")
                import time
                time.sleep(60)

                # Re-check service status
                service_details = self.ecs_client.describe_services(
                    cluster=cluster_arn,
                    services=[service_arn]
                )
                service = service_details['services'][0]
                current_running_count = service.get('runningCount', 0)
                current_desired_count = service['desiredCount']

                if current_running_count < current_desired_count:
                    logger.error(f"Service still not stable: {current_running_count}/{current_desired_count}")
                    logger.error("Skipping optimization to avoid further destabilization")
                    return False

            # Optimize desired count (3 -> 2)
            optimized_desired_count = 2

            # Check if already optimized
            if current_desired_count <= optimized_desired_count and not new_task_def_arn:
                logger.info(f"Service already optimized: desired count is {current_desired_count}")
                return True

            if current_desired_count > optimized_desired_count:
                # Calculate savings from reduced task count
                tasks_reduced = current_desired_count - optimized_desired_count
                # Rough estimate: 1 vCPU, 2GB memory per task, 730 hours/month
                self.cost_savings['task_count_savings'] = tasks_reduced * (
                    (1.0 * self.FARGATE_CPU_HOUR_COST * 730) +
                    (2.0 * self.FARGATE_MEMORY_GB_HOUR_COST * 730)
                )

            update_params = {
                'cluster': cluster_arn,
                'service': service_arn,
                'desiredCount': optimized_desired_count,
            }

            if new_task_def_arn:
                update_params['taskDefinition'] = new_task_def_arn

            if self.dry_run:
                logger.info(f"[DRY RUN] Would update service with desired count: {optimized_desired_count}")
                if new_task_def_arn:
                    logger.info(f"[DRY RUN] Would update task definition to: {new_task_def_arn}")
            else:
                self.ecs_client.update_service(**update_params)
                logger.info(f"Service updated: desired count {current_desired_count}→{optimized_desired_count}")
                self.changes_made.append(f"Service scaling optimized: {current_desired_count}→{optimized_desired_count} tasks")

                # Wait for service to stabilize with extended timeout
                logger.info("Waiting for service to stabilize...")
                try:
                    waiter = self.ecs_client.get_waiter('services_stable')
                    # Increased timeout: 10s delay, 180 attempts = 30 minutes
                    waiter.wait(
                        cluster=cluster_arn,
                        services=[service_arn],
                        WaiterConfig={'Delay': 10, 'MaxAttempts': 180}
                    )
                    logger.info("Service stabilized successfully")
                except WaiterError as e:
                    # Check service status even if waiter times out
                    logger.warning(f"Service stabilization waiter timed out: {e}")
                    service_check = self.ecs_client.describe_services(
                        cluster=cluster_arn,
                        services=[service_arn]
                    )
                    service_status = service_check['services'][0]
                    running_count = service_status.get('runningCount', 0)
                    desired_count = service_status.get('desiredCount', 0)
                    service_events = service_status.get('events', [])

                    logger.info(f"Current service state: {running_count}/{desired_count} tasks running")

                    # Log recent service events for debugging
                    if service_events:
                        logger.info("Recent service events:")
                        for event in service_events[:5]:
                            logger.info(f"  - {event.get('message', 'No message')}")

                    # If we have the desired number of running tasks, consider it a success
                    if running_count >= desired_count and desired_count == optimized_desired_count:
                        logger.info("Service has reached desired task count despite waiter timeout")
                    elif running_count > 0 and desired_count == optimized_desired_count:
                        # Partial success: some tasks are running but not all
                        logger.warning(f"Service partially stabilized: {running_count}/{desired_count} tasks running")
                        logger.warning("Optimization may still be in progress. Check service status later.")
                        # Don't fail the entire optimization for partial success
                    else:
                        # Service is unhealthy: no tasks running or wrong desired count
                        logger.error(f"Service failed to stabilize: {running_count}/{desired_count} tasks")
                        # Re-raise the exception
                        raise

            # Optimize auto-scaling min capacity
            self.optimize_autoscaling_target(cluster_arn, service_name)

            return True

        except (ClientError, WaiterError) as e:
            logger.error(f"Error optimizing service: {e}")
            raise

    def optimize_autoscaling_target(self, cluster_name: str, service_name: str) -> bool:
        """
        Optimize auto-scaling target min capacity.

        Args:
            cluster_name: ECS cluster name
            service_name: ECS service name

        Returns:
            True if optimization was successful
        """
        logger.info("Optimizing auto-scaling target...")

        try:
            resource_id = f"service/{cluster_name}/{service_name}"

            # Get current scaling target
            try:
                response = self.autoscaling_client.describe_scalable_targets(
                    ServiceNamespace='ecs',
                    ResourceIds=[resource_id]
                )

                if not response.get('ScalableTargets'):
                    logger.warning("No auto-scaling target found")
                    return False

                current_target = response['ScalableTargets'][0]
                current_min = current_target['MinCapacity']
                current_max = current_target['MaxCapacity']

                # Optimize min capacity (2 -> 1)
                optimized_min = 1

                if self.dry_run:
                    logger.info(f"[DRY RUN] Would update auto-scaling min capacity: {current_min}→{optimized_min}")
                else:
                    self.autoscaling_client.register_scalable_target(
                        ServiceNamespace='ecs',
                        ResourceId=resource_id,
                        ScalableDimension='ecs:service:DesiredCount',
                        MinCapacity=optimized_min,
                        MaxCapacity=current_max
                    )
                    logger.info(f"Auto-scaling updated: min capacity {current_min}→{optimized_min}")
                    self.changes_made.append(f"Auto-scaling min capacity: {current_min}→{optimized_min}")

                return True

            except ClientError as e:
                if e.response['Error']['Code'] == 'ObjectNotFoundException':
                    logger.warning("Auto-scaling target not found - may not be configured")
                    return False
                raise

        except ClientError as e:
            logger.error(f"Error optimizing auto-scaling: {e}")
            return False

    def optimize_ecr_lifecycle(self) -> bool:
        """
        Optimize ECR lifecycle policy to keep fewer images.

        Returns:
            True if optimization was successful
        """
        logger.info("Optimizing ECR lifecycle policies...")

        try:
            # Find ECR repository
            response = self.ecr_client.describe_repositories()
            repository_name = None

            for repo in response.get('repositories', []):
                if self.environment_suffix in repo['repositoryName']:
                    repository_name = repo['repositoryName']
                    break

            if not repository_name:
                logger.warning(f"No ECR repository found with suffix: {self.environment_suffix}")
                return False

            logger.info(f"Found ECR repository: {repository_name}")

            # Optimized lifecycle policy (keep 5 images instead of 10)
            optimized_policy = {
                "rules": [{
                    "rulePriority": 1,
                    "description": "Keep last 5 images",
                    "selection": {
                        "tagStatus": "any",
                        "countType": "imageCountMoreThan",
                        "countNumber": 5
                    },
                    "action": {
                        "type": "expire"
                    }
                }]
            }

            # Estimate storage savings (rough estimate: 5 images * 100MB per image)
            self.cost_savings['ecr_storage_savings'] = (5 * 0.1) * self.ECR_STORAGE_GB_MONTH_COST

            if self.dry_run:
                logger.info(f"[DRY RUN] Would update ECR lifecycle policy to keep 5 images")
            else:
                self.ecr_client.put_lifecycle_policy(
                    repositoryName=repository_name,
                    lifecyclePolicyText=json.dumps(optimized_policy)
                )
                logger.info("ECR lifecycle policy updated: keep 5 images (from 10)")
                self.changes_made.append("ECR lifecycle policy: keep 5 images (from 10)")

            return True

        except ClientError as e:
            logger.error(f"Error optimizing ECR lifecycle: {e}")
            return False

    def calculate_total_savings(self) -> float:
        """
        Calculate total monthly cost savings.

        Returns:
            Total monthly savings in dollars
        """
        total = (
            self.cost_savings['cpu_savings'] +
            self.cost_savings['memory_savings'] +
            self.cost_savings['task_count_savings'] +
            self.cost_savings['ecr_storage_savings']
        )
        self.cost_savings['total_monthly_savings'] = total
        return total

    def generate_report(self) -> Dict[str, Any]:
        """
        Generate optimization report.

        Returns:
            Dictionary containing optimization results and cost savings
        """
        total_savings = self.calculate_total_savings()

        report = {
            'timestamp': datetime.utcnow().isoformat(),
            'environment_suffix': self.environment_suffix,
            'region': self.region_name,
            'dry_run': self.dry_run,
            'changes_made': self.changes_made,
            'cost_savings': {
                'cpu_optimization': f"${self.cost_savings['cpu_savings']:.2f}/month",
                'memory_optimization': f"${self.cost_savings['memory_savings']:.2f}/month",
                'task_count_reduction': f"${self.cost_savings['task_count_savings']:.2f}/month",
                'ecr_storage_reduction': f"${self.cost_savings['ecr_storage_savings']:.2f}/month",
                'total_monthly_savings': f"${total_savings:.2f}/month",
                'total_annual_savings': f"${total_savings * 12:.2f}/year"
            }
        }

        return report

    def optimize(self) -> bool:
        """
        Execute all optimization steps.

        Returns:
            True if all optimizations completed successfully
        """
        try:
            logger.info("=" * 60)
            logger.info("Starting ECS Fargate Infrastructure Optimization")
            logger.info("=" * 60)
            logger.info(f"Environment Suffix: {self.environment_suffix}")
            logger.info(f"Region: {self.region_name}")
            logger.info(f"Dry Run: {self.dry_run}")
            logger.info("=" * 60)

            # Step 1: Find resources
            resources = self.find_ecs_resources()

            # Step 2: Optimize task definition
            new_task_def_arn = self.optimize_task_definition(resources['task_definition_arn'])

            # Step 3: Optimize service scaling
            self.optimize_service_scaling(
                resources['cluster_arn'],
                resources['service_arn'],
                resources['service_name'],
                new_task_def_arn
            )

            # Step 4: Optimize ECR lifecycle
            self.optimize_ecr_lifecycle()

            # Step 5: Generate and display report
            report = self.generate_report()

            logger.info("=" * 60)
            logger.info("Optimization Complete")
            logger.info("=" * 60)
            logger.info(f"\nChanges Made:")
            for change in report['changes_made']:
                logger.info(f"  - {change}")

            logger.info(f"\nCost Savings Estimate:")
            logger.info(f"  CPU Optimization:        {report['cost_savings']['cpu_optimization']}")
            logger.info(f"  Memory Optimization:     {report['cost_savings']['memory_optimization']}")
            logger.info(f"  Task Count Reduction:    {report['cost_savings']['task_count_reduction']}")
            logger.info(f"  ECR Storage Reduction:   {report['cost_savings']['ecr_storage_reduction']}")
            logger.info(f"  ------------------------")
            logger.info(f"  Total Monthly Savings:   {report['cost_savings']['total_monthly_savings']}")
            logger.info(f"  Total Annual Savings:    {report['cost_savings']['total_annual_savings']}")
            logger.info("=" * 60)

            # Save report to file
            report_file = f"optimization-report-{self.environment_suffix}.json"
            with open(report_file, 'w') as f:
                json.dump(report, f, indent=2)
            logger.info(f"\nFull report saved to: {report_file}")

            return True

        except Exception as e:
            logger.error(f"Optimization failed: {e}")
            return False


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Optimize ECS Fargate infrastructure to reduce costs"
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be changed without making actual changes'
    )
    parser.add_argument(
        '--region',
        default=os.environ.get('AWS_REGION', 'us-east-1'),
        help='AWS region (default: us-east-1 or AWS_REGION env var)'
    )

    args = parser.parse_args()

    # Get environment suffix from environment variable
    environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX')
    if not environment_suffix:
        logger.error("Error: ENVIRONMENT_SUFFIX environment variable is required")
        logger.error("Usage: ENVIRONMENT_SUFFIX=your-suffix python optimize.py [--dry-run]")
        sys.exit(1)

    # Create optimizer and run
    optimizer = ECSFargateOptimizer(
        environment_suffix=environment_suffix,
        region_name=args.region,
        dry_run=args.dry_run
    )

    success = optimizer.optimize()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
