#!/usr/bin/env python3
"""
Container Resource Optimization Analyzer for AWS ECS and EKS
Analyzes resource utilization and provides cost optimization recommendations
"""

import json
import csv
import argparse
import logging
import warnings
import importlib
import subprocess
import sys
import os
import site
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict, List, Tuple, Any, Optional, TypedDict

import boto3
from botocore.exceptions import ClientError, BotoCoreError
from tabulate import tabulate


def _lazy_import(module: str, pip_name: Optional[str] = None):
    """Import a module, installing via pip if it's missing (unless disabled)."""
    try:
        return importlib.import_module(module)
    except ModuleNotFoundError:
        if os.environ.get("ANALYZE_DISABLE_AUTO_INSTALL") == "1":
            raise
        pkg = pip_name or module
        install_cmd = [sys.executable, "-m", "pip", "install", pkg]
        if sys.prefix == sys.base_prefix:
            install_cmd.extend(["--user", "--break-system-packages"])
        env = os.environ.copy()
        env.setdefault("PIP_BREAK_SYSTEM_PACKAGES", "1")
        subprocess.check_call(install_cmd, env=env)
        importlib.invalidate_caches()
        return importlib.import_module(module)


def _ensure_user_site_on_path():
    """Ensure user site-packages directory is on sys.path when needed."""
    if sys.prefix != sys.base_prefix:
        return
    try:
        user_site = site.getusersitepackages()
    except AttributeError:
        return
    if user_site and user_site not in sys.path:
        sys.path.append(user_site)


_ensure_user_site_on_path()

pd = _lazy_import("pandas")
np = _lazy_import("numpy")
plt = _lazy_import("matplotlib.pyplot", pip_name="matplotlib")
sns = _lazy_import("seaborn")

# Suppress matplotlib warnings
warnings.filterwarnings("ignore")

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# AWS Pricing estimates (simplified for calculations)
FARGATE_VCPU_HOUR_COST = 0.04048
FARGATE_MEMORY_GB_HOUR_COST = 0.004445
EC2_M5_LARGE_HOUR_COST = 0.096
EC2_M5_LARGE_SPOT_HOUR_COST = 0.038
HOURS_PER_MONTH = 730


class ResourceTag(TypedDict, total=False):
    Key: str
    Value: str


class ContainerResourceAnalyzer:
    """Main analyzer class for ECS and EKS resource optimization"""

    def __init__(self, region: str = "us-east-1"):
        """Initialize AWS clients and configuration"""
        self.region = region
        self.ecs_client = boto3.client("ecs", region_name=region)
        self.eks_client = boto3.client("eks", region_name=region)
        self.ec2_client = boto3.client("ec2", region_name=region)
        self.cloudwatch_client = boto3.client("cloudwatch", region_name=region)
        self.autoscaling_client = boto3.client("autoscaling", region_name=region)
        self.application_autoscaling_client = boto3.client(
            "application-autoscaling", region_name=region
        )

        # Initialize findings storage
        self.ecs_findings = []
        self.eks_findings = []
        self.summary = {
            "total_ecs_services": 0,
            "total_eks_nodes": 0,
            "total_monthly_savings": 0.0,
            "services_requiring_attention": 0,
        }
        self.rightsizing_plans = []
        self.utilization_data = defaultdict(list)

        # Track analysis metadata
        self.analysis_metadata = {
            "clusters_analyzed": [],
            "clusters_excluded": [],
            "services_excluded": {"dev": 0, "too_new": 0},
            "analysis_start_time": None,
            "analysis_end_time": None,
            "finding_type_counts": defaultdict(int),
        }

    def analyze(self):
        """Main analysis method orchestrating all checks"""
        self.analysis_metadata["analysis_start_time"] = datetime.utcnow()
        logger.info("Starting container resource analysis...")

        # Analyze ECS clusters and services
        self._analyze_ecs_clusters()

        # Analyze EKS clusters and nodes
        self._analyze_eks_clusters()

        # Finalize metadata
        self.analysis_metadata["analysis_end_time"] = datetime.utcnow()

        # Generate outputs
        self._generate_outputs()

        logger.info("Analysis complete!")

    def _should_exclude_cluster(self, tags: List[ResourceTag]) -> bool:
        """Check if cluster should be excluded based on tags"""
        for tag in tags:
            if (
                tag.get("Key", "").lower() == "excludefromanalysis"
                and tag.get("Value", "").lower() == "true"
            ):
                return True
        return False

    def _add_finding(self, finding: Dict[str, Any], finding_list: str = "ecs"):
        """Add a finding and track its type in metadata"""
        finding_type = finding.get("finding_type", "unknown")
        if finding_list == "ecs":
            self.ecs_findings.append(finding)
        else:
            self.eks_findings.append(finding)
        self.analysis_metadata["finding_type_counts"][finding_type] += 1

    def _analyze_ecs_clusters(self):
        """Analyze all ECS clusters and services"""
        try:
            clusters = self.ecs_client.list_clusters().get("clusterArns", [])

            for cluster_arn in clusters:
                cluster_name = cluster_arn.split("/")[-1]

                # Get cluster details and tags
                cluster_details = self.ecs_client.describe_clusters(
                    clusters=[cluster_arn], include=["TAGS", "STATISTICS"]
                )["clusters"][0]

                # Check exclusion rules
                tags = cluster_details.get("tags", [])
                if self._should_exclude_cluster(tags):
                    logger.info(f"Skipping excluded cluster: {cluster_name}")
                    self.analysis_metadata["clusters_excluded"].append(
                        {"name": cluster_name, "type": "ECS", "reason": "ExcludeFromAnalysis tag"}
                    )
                    continue

                # Track analyzed cluster
                self.analysis_metadata["clusters_analyzed"].append(
                    {"name": cluster_name, "type": "ECS"}
                )

                # Analyze services in cluster
                self._analyze_ecs_services(cluster_name, cluster_details)

                # Check cluster overprovisioning (Rule 11)
                self._check_cluster_overprovisioning(cluster_name, cluster_details)

        except (ClientError, BotoCoreError) as e:
            logger.error(f"Error analyzing ECS clusters: {e}")

    def _analyze_ecs_services(
        self, cluster_name: str, cluster_details: Dict[str, Any]
    ):
        """Analyze services within an ECS cluster"""
        try:
            paginator = self.ecs_client.get_paginator("list_services")

            for page in paginator.paginate(cluster=cluster_name):
                service_arns = page.get("serviceArns", [])

                if not service_arns:
                    continue

                services = self.ecs_client.describe_services(
                    cluster=cluster_name, services=service_arns
                )["services"]

                for service in services:
                    service_name = service["serviceName"]

                    # Skip dev services (exclusion rule)
                    if service_name.startswith("dev-"):
                        self.analysis_metadata["services_excluded"]["dev"] += 1
                        continue

                    # Check service age
                    created_at = service.get("createdAt")
                    if (
                        created_at
                        and (datetime.now(created_at.tzinfo) - created_at).days < 14
                    ):
                        self.analysis_metadata["services_excluded"]["too_new"] += 1
                        continue

                    self.summary["total_ecs_services"] += 1

                    # Perform all ECS checks
                    self._check_ecs_over_provisioning(cluster_name, service)
                    self._check_missing_auto_scaling(cluster_name, service)
                    self._check_inefficient_task_placement(cluster_name, service)
                    self._check_singleton_ha_risks(cluster_name, service)
                    self._check_old_container_images(cluster_name, service)
                    self._check_health_checks(cluster_name, service)
                    self._check_excessive_task_revisions(cluster_name, service)
                    self._check_missing_logging(cluster_name, service)
                    self._check_service_discovery(cluster_name, service)

        except (ClientError, BotoCoreError) as e:
            logger.error(f"Error analyzing ECS services: {e}")

    def _check_ecs_over_provisioning(
        self, cluster_name: str, service: Dict[str, Any]
    ):
        """Check for over-provisioned ECS tasks (Rule 1)"""
        service_name = service["serviceName"]
        task_definition = service["taskDefinition"]

        try:
            # Get task definition details
            task_def_details = self.ecs_client.describe_task_definition(
                taskDefinition=task_definition
            )["taskDefinition"]

            # Get running tasks
            tasks = self.ecs_client.list_tasks(
                cluster=cluster_name, serviceName=service_name, desiredStatus="RUNNING"
            ).get("taskArns", [])

            if not tasks:
                return

            # Calculate total CPU and memory from task definition
            total_cpu = int(task_def_details.get("cpu", "0"))
            total_memory = int(task_def_details.get("memory", "0"))

            # Get CloudWatch metrics for actual usage
            end_time = datetime.utcnow()
            start_time = end_time - timedelta(days=14)

            # Get CPU utilization
            cpu_metrics = self._get_container_insights_metrics(
                cluster_name, service_name, "CPUUtilization", start_time, end_time
            )

            # Get memory utilization
            memory_metrics = self._get_container_insights_metrics(
                cluster_name, service_name, "MemoryUtilization", start_time, end_time
            )

            if cpu_metrics and memory_metrics:
                avg_cpu_percent = np.mean(cpu_metrics)
                avg_memory_percent = np.mean(memory_metrics)

                # Convert percentages to actual values
                actual_cpu = (avg_cpu_percent / 100) * total_cpu
                actual_memory = (avg_memory_percent / 100) * total_memory

                # Check if over-provisioned (>2x)
                if total_cpu > 2 * actual_cpu and total_memory > 2 * actual_memory:
                    recommended_cpu = int(actual_cpu * 1.5)  # 50% buffer
                    recommended_memory = int(actual_memory * 1.5)

                    # Calculate cost savings
                    current_cost = self._calculate_ecs_cost(
                        total_cpu, total_memory, task_def_details
                    )
                    optimized_cost = self._calculate_ecs_cost(
                        recommended_cpu, recommended_memory, task_def_details
                    )
                    monthly_savings = (current_cost - optimized_cost) * HOURS_PER_MONTH

                    finding = {
                        "cluster_name": cluster_name,
                        "service_name": service_name,
                        "task_definition": task_definition,
                        "current_cpu": total_cpu,
                        "current_memory": total_memory,
                        "recommended_cpu": recommended_cpu,
                        "recommended_memory": recommended_memory,
                        "monthly_savings": monthly_savings,
                        "finding_type": "over_provisioning",
                    }

                    self._add_finding(finding, "ecs")
                    self.summary["services_requiring_attention"] += 1
                    self.summary["total_monthly_savings"] += monthly_savings

                # Store utilization data for visualization
                self.utilization_data["ecs_cpu"].append(avg_cpu_percent)
                self.utilization_data["ecs_memory"].append(avg_memory_percent)

        except (ClientError, BotoCoreError) as e:
            logger.warning(f"Error checking over-provisioning for {service_name}: {e}")

    def _check_missing_auto_scaling(
        self, cluster_name: str, service: Dict[str, Any]
    ):
        """Check for missing auto-scaling configuration (Rule 3)"""
        service_name = service["serviceName"]
        resource_id = f"service/{cluster_name}/{service_name}"

        try:
            # Check if auto-scaling is configured
            scalable_targets = (
                self.application_autoscaling_client.describe_scalable_targets(
                    ServiceNamespace="ecs", ResourceIds=[resource_id]
                ).get("ScalableTargets", [])
            )

            if not scalable_targets:
                # Check if traffic is variable by looking at task count history
                metrics = self._get_cloudwatch_metrics(
                    "AWS/ECS",
                    "ServiceName",
                    service_name,
                    "RunningTaskCount",
                    datetime.utcnow() - timedelta(days=7),
                    datetime.utcnow(),
                )

                if metrics:
                    cv = (
                        np.std(metrics) / np.mean(metrics)
                        if np.mean(metrics) > 0
                        else 0
                    )

                    # High coefficient of variation indicates variable traffic
                    if cv > 0.3:
                        self._add_finding(
                            {
                                "cluster_name": cluster_name,
                                "service_name": service_name,
                                "finding_type": "missing_auto_scaling",
                                "traffic_variability": f"{cv:.2%}",
                                "recommendation": "Enable auto-scaling for variable workload",
                            },
                            "ecs",
                        )
                        self.summary["services_requiring_attention"] += 1

        except (ClientError, BotoCoreError) as e:
            logger.warning(f"Error checking auto-scaling for {service_name}: {e}")

    def _check_inefficient_task_placement(
        self, cluster_name: str, service: Dict[str, Any]
    ):
        """Check for inefficient Fargate task placement (Rule 4)"""
        if service.get("launchType") != "FARGATE":
            return

        service_name = service["serviceName"]
        task_definition = service["taskDefinition"]

        try:
            task_def_details = self.ecs_client.describe_task_definition(
                taskDefinition=task_definition
            )["taskDefinition"]

            cpu = int(task_def_details.get("cpu", "0"))
            memory = int(task_def_details.get("memory", "0"))

            # Check if using minimal resources (0.5 vCPU = 512, 1GB = 1024)
            if cpu < 512 and memory < 1024:
                # Calculate potential savings by switching to EC2
                fargate_cost = self._calculate_ecs_cost(cpu, memory, task_def_details)
                ec2_cost = (
                    EC2_M5_LARGE_HOUR_COST / 8
                )  # Assuming 8 small tasks per instance
                monthly_savings = (fargate_cost - ec2_cost) * HOURS_PER_MONTH

                self._add_finding(
                    {
                        "cluster_name": cluster_name,
                        "service_name": service_name,
                        "finding_type": "inefficient_task_placement",
                        "current_launch_type": "FARGATE",
                        "recommended_launch_type": "EC2",
                        "current_cpu": cpu,
                        "current_memory": memory,
                        "monthly_savings": monthly_savings,
                    },
                    "ecs",
                )
                self.summary["services_requiring_attention"] += 1
                self.summary["total_monthly_savings"] += monthly_savings

        except (ClientError, BotoCoreError) as e:
            logger.warning(f"Error checking task placement for {service_name}: {e}")

    def _check_singleton_ha_risks(
        self, cluster_name: str, service: Dict[str, Any]
    ):
        """Check for singleton services without HA (Rule 6)"""
        service_name = service["serviceName"]
        desired_count = service.get("desiredCount", 0)

        if desired_count == 1:
            # Check if service spans multiple AZs
            placement_constraints = service.get("placementConstraints", [])
            placement_strategy = service.get("placementStrategy", [])

            has_multi_az = any(
                strategy.get("type") == "spread"
                and strategy.get("field") == "attribute:ecs.availability-zone"
                for strategy in placement_strategy
            )

            if not has_multi_az:
                self._add_finding(
                    {
                        "cluster_name": cluster_name,
                        "service_name": service_name,
                        "finding_type": "singleton_ha_risk",
                        "desired_count": desired_count,
                        "recommendation": "Increase desired count to 2+ and enable multi-AZ placement",
                    },
                    "ecs",
                )
                self.summary["services_requiring_attention"] += 1

    def _check_old_container_images(
        self, cluster_name: str, service: Dict[str, Any]
    ):
        """Check for old container images (Rule 7)"""
        service_name = service["serviceName"]
        task_definition = service["taskDefinition"]

        try:
            task_def_details = self.ecs_client.describe_task_definition(
                taskDefinition=task_definition
            )["taskDefinition"]

            registered_at = task_def_details.get("registeredAt")
            if (
                registered_at
                and (datetime.now(registered_at.tzinfo) - registered_at).days > 90
            ):
                container_images = [
                    container["image"]
                    for container in task_def_details.get("containerDefinitions", [])
                ]

                self._add_finding(
                    {
                        "cluster_name": cluster_name,
                        "service_name": service_name,
                        "finding_type": "old_container_images",
                        "task_definition": task_definition,
                        "age_days": (
                            datetime.now(registered_at.tzinfo) - registered_at
                        ).days,
                        "images": container_images,
                        "recommendation": "Update container images to latest versions",
                    },
                    "ecs",
                )
                self.summary["services_requiring_attention"] += 1

        except (ClientError, BotoCoreError) as e:
            logger.warning(f"Error checking container images for {service_name}: {e}")

    def _check_health_checks(
        self, cluster_name: str, service: Dict[str, Any]
    ):
        """Check for missing health checks (Rule 8)"""
        service_name = service["serviceName"]
        load_balancers = service.get("loadBalancers", [])

        if load_balancers and not service.get("healthCheckGracePeriodSeconds"):
            self._add_finding(
                {
                    "cluster_name": cluster_name,
                    "service_name": service_name,
                    "finding_type": "missing_health_checks",
                    "has_load_balancer": True,
                    "recommendation": "Configure health check grace period for load balancer integration",
                },
                "ecs",
            )
            self.summary["services_requiring_attention"] += 1

    def _check_excessive_task_revisions(
        self, cluster_name: str, service: Dict[str, Any]
    ):
        """Check for excessive task definition revisions (Rule 9)"""
        service_name = service["serviceName"]
        task_definition = service["taskDefinition"]

        # Extract revision number from task definition ARN
        revision = int(task_definition.split(":")[-1])

        if revision > 50:
            self._add_finding(
                {
                    "cluster_name": cluster_name,
                    "service_name": service_name,
                    "finding_type": "excessive_task_revisions",
                    "revision_count": revision,
                    "recommendation": "Review deployment process to reduce configuration churn",
                },
                "ecs",
            )
            self.summary["services_requiring_attention"] += 1

    def _check_missing_logging(
        self, cluster_name: str, service: Dict[str, Any]
    ):
        """Check for missing logging configuration (Rule 12)"""
        service_name = service["serviceName"]
        task_definition = service["taskDefinition"]

        try:
            task_def_details = self.ecs_client.describe_task_definition(
                taskDefinition=task_definition
            )["taskDefinition"]

            containers_without_logging = []
            for container in task_def_details.get("containerDefinitions", []):
                log_config = container.get("logConfiguration", {})
                if not log_config or log_config.get("logDriver") not in [
                    "awslogs",
                    "fluentd",
                    "fluentbit",
                ]:
                    containers_without_logging.append(container["name"])

            if containers_without_logging:
                self._add_finding(
                    {
                        "cluster_name": cluster_name,
                        "service_name": service_name,
                        "finding_type": "missing_logging",
                        "containers": containers_without_logging,
                        "recommendation": "Configure CloudWatch Logs or Fluent Bit for all containers",
                    },
                    "ecs",
                )
                self.summary["services_requiring_attention"] += 1

        except (ClientError, BotoCoreError) as e:
            logger.warning(f"Error checking logging for {service_name}: {e}")

    def _check_service_discovery(
        self, cluster_name: str, service: Dict[str, Any]
    ):
        """Check for missing service discovery (Rule 13)"""
        service_name = service["serviceName"]
        service_registries = service.get("serviceRegistries", [])

        # Simple heuristic: if service name contains 'api', 'service', or 'backend'
        # it likely communicates with other services
        if any(
            keyword in service_name.lower() for keyword in ["api", "service", "backend"]
        ):
            if not service_registries:
                self._add_finding(
                    {
                        "cluster_name": cluster_name,
                        "service_name": service_name,
                        "finding_type": "missing_service_discovery",
                        "recommendation": "Enable ECS Service Discovery for inter-service communication",
                    },
                    "ecs",
                )
                self.summary["services_requiring_attention"] += 1

    def _check_cluster_overprovisioning(
        self, cluster_name: str, cluster_details: Dict[str, Any]
    ):
        """Check for cluster overprovisioning (Rule 11)"""
        statistics = cluster_details.get("statistics", [])

        # Extract CPU and memory statistics
        cpu_stats = next(
            (stat for stat in statistics if stat["name"] == "CPUUtilization"), None
        )
        memory_stats = next(
            (stat for stat in statistics if stat["name"] == "MemoryUtilization"), None
        )

        if cpu_stats and memory_stats:
            cpu_utilization = float(cpu_stats.get("value", "0"))
            memory_utilization = float(memory_stats.get("value", "0"))

            # Check if cluster has >40% unused capacity
            if cpu_utilization < 60 and memory_utilization < 60:
                unused_cpu = 100 - cpu_utilization
                unused_memory = 100 - memory_utilization

                self._add_finding(
                    {
                        "cluster_name": cluster_name,
                        "finding_type": "cluster_overprovisioning",
                        "cpu_utilization": cpu_utilization,
                        "memory_utilization": memory_utilization,
                        "unused_cpu_percent": unused_cpu,
                        "unused_memory_percent": unused_memory,
                        "recommendation": "Reduce cluster capacity or consolidate workloads",
                    },
                    "ecs",
                )
                self.summary["services_requiring_attention"] += 1

    def _analyze_eks_clusters(self):
        """Analyze all EKS clusters and nodes"""
        try:
            clusters = self.eks_client.list_clusters().get("clusters", [])

            for cluster_name in clusters:
                # Get cluster details
                cluster = self.eks_client.describe_cluster(name=cluster_name)["cluster"]

                # Get cluster tags
                tags = cluster.get("tags", {})
                if self._should_exclude_cluster(
                    [{"Key": k, "Value": v} for k, v in tags.items()]
                ):
                    logger.info(f"Skipping excluded EKS cluster: {cluster_name}")
                    self.analysis_metadata["clusters_excluded"].append(
                        {"name": cluster_name, "type": "EKS", "reason": "ExcludeFromAnalysis tag"}
                    )
                    continue

                # Track analyzed cluster
                self.analysis_metadata["clusters_analyzed"].append(
                    {"name": cluster_name, "type": "EKS"}
                )

                # Analyze node groups
                self._analyze_eks_node_groups(cluster_name)

                # Analyze individual nodes
                self._analyze_eks_nodes(cluster_name)

        except (ClientError, BotoCoreError) as e:
            logger.error(f"Error analyzing EKS clusters: {e}")

    def _analyze_eks_node_groups(self, cluster_name: str):
        """Analyze EKS node groups for optimization opportunities"""
        try:
            node_groups = self.eks_client.list_nodegroups(clusterName=cluster_name).get(
                "nodegroups", []
            )

            for node_group_name in node_groups:
                node_group = self.eks_client.describe_nodegroup(
                    clusterName=cluster_name, nodegroupName=node_group_name
                )["nodegroup"]

                # Skip if node group is too new
                created_at = node_group.get("createdAt")
                if (
                    created_at
                    and (datetime.now(created_at.tzinfo) - created_at).days < 14
                ):
                    continue

                # Check for spot instance opportunity (Rule 10)
                capacity_type = node_group.get("capacityType", "ON_DEMAND")
                if capacity_type == "ON_DEMAND":
                    instance_types = node_group.get("instanceTypes", [])
                    desired_size = node_group.get("scalingConfig", {}).get(
                        "desiredSize", 0
                    )

                    # Calculate potential spot savings
                    spot_savings = 0
                    for instance_type in instance_types:
                        # Simplified calculation using m5.large as baseline
                        if "large" in instance_type:
                            savings_per_instance = (
                                EC2_M5_LARGE_HOUR_COST - EC2_M5_LARGE_SPOT_HOUR_COST
                            ) * HOURS_PER_MONTH
                            spot_savings += savings_per_instance * desired_size

                    if spot_savings > 0:
                        self._add_finding(
                            {
                                "cluster_name": cluster_name,
                                "node_group": node_group_name,
                                "finding_type": "spot_instance_opportunity",
                                "instance_types": instance_types,
                                "current_capacity_type": "ON_DEMAND",
                                "recommended_capacity_type": "SPOT",
                                "spot_savings_potential": spot_savings,
                                "recommendation": "Enable spot instances for cost savings",
                            },
                            "eks",
                        )
                        self.summary["total_monthly_savings"] += spot_savings
                        self.summary["services_requiring_attention"] += 1

        except (ClientError, BotoCoreError) as e:
            logger.warning(f"Error analyzing node groups for {cluster_name}: {e}")

    def _analyze_eks_nodes(self, cluster_name: str):
        """Analyze individual EKS nodes for utilization"""
        try:
            # Find EC2 instances belonging to the EKS cluster
            filters = [
                {
                    "Name": f"tag:kubernetes.io/cluster/{cluster_name}",
                    "Values": ["owned"],
                },
                {"Name": "instance-state-name", "Values": ["running"]},
            ]

            instances = self.ec2_client.describe_instances(Filters=filters)

            for reservation in instances["Reservations"]:
                for instance in reservation["Instances"]:
                    # Check instance age
                    launch_time = instance.get("LaunchTime")
                    if (
                        launch_time
                        and (datetime.now(launch_time.tzinfo) - launch_time).days < 14
                    ):
                        continue

                    self.summary["total_eks_nodes"] += 1

                    instance_id = instance["InstanceId"]
                    instance_type = instance["InstanceType"]

                    # Check underutilization (Rule 2)
                    self._check_eks_node_utilization(
                        cluster_name, instance_id, instance_type
                    )

                    # Get pod information (mock for resource limits check)
                    self._check_eks_pod_resource_limits(cluster_name, instance_id)

        except (ClientError, BotoCoreError) as e:
            logger.warning(f"Error analyzing EKS nodes for {cluster_name}: {e}")

    def _check_eks_node_utilization(
        self, cluster_name: str, instance_id: str, instance_type: str
    ):
        """Check EKS node utilization (Rule 2)"""
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(days=14)

        # Get CPU utilization
        cpu_metrics = self._get_cloudwatch_metrics(
            "AWS/EC2", "InstanceId", instance_id, "CPUUtilization", start_time, end_time
        )

        # Get memory metrics (requires CloudWatch agent)
        memory_metrics = self._get_cloudwatch_metrics(
            "CWAgent",
            "InstanceId",
            instance_id,
            "mem_used_percent",
            start_time,
            end_time,
        )

        if cpu_metrics and memory_metrics:
            avg_cpu = np.mean(cpu_metrics)
            avg_memory = np.mean(memory_metrics)

            # Store utilization data for visualization
            self.utilization_data["eks_cpu"].append(avg_cpu)
            self.utilization_data["eks_memory"].append(avg_memory)

            # Check if underutilized
            if avg_cpu < 30 and avg_memory < 40:
                self._add_finding(
                    {
                        "cluster_name": cluster_name,
                        "node_id": instance_id,
                        "instance_type": instance_type,
                        "finding_type": "underutilized_node",
                        "current_utilization": {"cpu": avg_cpu, "memory": avg_memory},
                        "recommended_changes": "Consolidate workloads or use smaller instance type",
                        "recommendation": f"Node utilization is low (CPU: {avg_cpu:.1f}%, Memory: {avg_memory:.1f}%)",
                    },
                    "eks",
                )
                self.summary["services_requiring_attention"] += 1

    def _check_eks_pod_resource_limits(self, cluster_name: str, instance_id: str):
        """Check for pods without resource limits (Rule 5)"""
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=6)

        violations = self._get_cloudwatch_metrics(
            namespace="EKS/PodInsights",
            dimension_name="NodeName",
            dimension_value=instance_id,
            metric_name="PodsWithoutLimits",
            start_time=start_time,
            end_time=end_time,
        )

        pods_without_limits = int(max(violations)) if violations else 0

        if pods_without_limits:
            self._add_finding(
                {
                    "cluster_name": cluster_name,
                    "node_id": instance_id,
                    "finding_type": "missing_resource_limits",
                    "pods_without_limits": pods_without_limits,
                    "recommendation": "Set CPU and memory limits for all pods",
                },
                "eks",
            )
            self.summary["services_requiring_attention"] += 1
        elif not violations:
            logger.debug(
                "No pod limit data available for %s; ensure Container Insights metrics exist",
                instance_id,
            )

    def _get_container_insights_metrics(
        self,
        cluster_name: str,
        service_name: str,
        metric_name: str,
        start_time: datetime,
        end_time: datetime,
    ) -> List[float]:
        """Get Container Insights metrics from CloudWatch"""
        try:
            response = self.cloudwatch_client.get_metric_statistics(
                Namespace="ECS/ContainerInsights",
                MetricName=metric_name,
                Dimensions=[
                    {"Name": "ClusterName", "Value": cluster_name},
                    {"Name": "ServiceName", "Value": service_name},
                ],
                StartTime=start_time,
                EndTime=end_time,
                Period=3600,  # 1 hour
                Statistics=["Average"],
            )

            return [dp["Average"] for dp in response["Datapoints"]]

        except (ClientError, BotoCoreError) as e:
            logger.warning(f"Error getting Container Insights metrics: {e}")
            return []

    def _get_cloudwatch_metrics(
        self,
        namespace: str,
        dimension_name: str,
        dimension_value: str,
        metric_name: str,
        start_time: datetime,
        end_time: datetime,
    ) -> List[float]:
        """Get metrics from CloudWatch"""
        try:
            response = self.cloudwatch_client.get_metric_statistics(
                Namespace=namespace,
                MetricName=metric_name,
                Dimensions=[{"Name": dimension_name, "Value": dimension_value}],
                StartTime=start_time,
                EndTime=end_time,
                Period=3600,  # 1 hour
                Statistics=["Average"],
            )

            return [dp["Average"] for dp in response["Datapoints"]]

        except (ClientError, BotoCoreError) as e:
            logger.warning(f"Error getting CloudWatch metrics: {e}")
            return []

    def _calculate_ecs_cost(
        self, cpu: int, memory: int, task_def_details: Dict[str, Any]
    ) -> float:
        """Calculate ECS task cost per hour"""
        launch_type = task_def_details.get("requiresCompatibilities", ["FARGATE"])[0]

        if launch_type == "FARGATE":
            # Fargate pricing
            vcpu_hours = cpu / 1024  # Convert CPU units to vCPUs
            memory_gb = memory / 1024  # Convert MB to GB
            return (vcpu_hours * FARGATE_VCPU_HOUR_COST) + (
                memory_gb * FARGATE_MEMORY_GB_HOUR_COST
            )
        else:
            # Simplified EC2 pricing
            return EC2_M5_LARGE_HOUR_COST / 8  # Assume 8 tasks per instance

    def _generate_outputs(self):
        """Generate all required output files"""
        # Console output
        self._print_recommendations()

        # JSON output
        self._save_json_output()

        # CSV output
        self._save_csv_output()

        # Visualization
        self._create_utilization_chart()

    def _print_recommendations(self):
        """Print comprehensive optimization recommendations to console"""
        print("\n" + "=" * 80)
        print("CONTAINER RESOURCE OPTIMIZATION ANALYSIS RESULTS")
        print("=" * 80 + "\n")

        # Analysis metadata
        start_time = self.analysis_metadata.get("analysis_start_time")
        end_time = self.analysis_metadata.get("analysis_end_time")
        if start_time and end_time:
            duration = (end_time - start_time).total_seconds()
            print(f"Analysis Duration: {duration:.1f} seconds")
            print(f"Analysis Period: Last 14 days")
            print(f"Region: {self.region}\n")

        # Cluster Summary
        print("-" * 80)
        print("CLUSTER ANALYSIS SUMMARY")
        print("-" * 80)

        analyzed_clusters = self.analysis_metadata.get("clusters_analyzed", [])
        excluded_clusters = self.analysis_metadata.get("clusters_excluded", [])

        ecs_clusters = [c for c in analyzed_clusters if c["type"] == "ECS"]
        eks_clusters = [c for c in analyzed_clusters if c["type"] == "EKS"]

        print(f"\nClusters Analyzed:")
        print(f"  ECS Clusters: {len(ecs_clusters)}")
        for cluster in ecs_clusters:
            print(f"    - {cluster['name']}")
        print(f"  EKS Clusters: {len(eks_clusters)}")
        for cluster in eks_clusters:
            print(f"    - {cluster['name']}")

        if excluded_clusters:
            print(f"\nClusters Excluded: {len(excluded_clusters)}")
            for cluster in excluded_clusters:
                print(f"    - {cluster['name']} ({cluster['type']}): {cluster['reason']}")

        services_excluded = self.analysis_metadata.get("services_excluded", {})
        if services_excluded.get("dev") or services_excluded.get("too_new"):
            print(f"\nServices Excluded:")
            if services_excluded.get("dev"):
                print(f"    - Dev services (dev- prefix): {services_excluded['dev']}")
            if services_excluded.get("too_new"):
                print(f"    - New services (< 14 days old): {services_excluded['too_new']}")

        # Summary Statistics
        print("\n" + "-" * 80)
        print("SUMMARY STATISTICS")
        print("-" * 80 + "\n")

        summary_table = [
            ["Metric", "Value"],
            ["Total ECS Services Analyzed", self.summary['total_ecs_services']],
            ["Total EKS Nodes Analyzed", self.summary['total_eks_nodes']],
            ["Total Issues Found", self.summary['services_requiring_attention']],
            ["Total Potential Monthly Savings", f"${self.summary['total_monthly_savings']:,.2f}"],
        ]
        print(tabulate(summary_table, headers="firstrow", tablefmt="grid"))

        # Finding Type Breakdown
        finding_counts = self.analysis_metadata.get("finding_type_counts", {})
        if finding_counts:
            print("\nFindings by Type:")
            finding_table = [["Finding Type", "Count"]]
            for finding_type, count in sorted(finding_counts.items(), key=lambda x: x[1], reverse=True):
                finding_table.append([finding_type.replace('_', ' ').title(), count])
            print(tabulate(finding_table, headers="firstrow", tablefmt="grid"))

        # Detailed ECS Findings
        print("\n" + "-" * 80)
        print("DETAILED ECS FINDINGS")
        print("-" * 80)

        if not self.ecs_findings:
            print("\nNo ECS issues found. All services are well-configured!")
        else:
            # Group findings by type
            ecs_by_type = defaultdict(list)
            for finding in self.ecs_findings:
                ecs_by_type[finding["finding_type"]].append(finding)

            for finding_type, findings in sorted(ecs_by_type.items()):
                print(f"\n{finding_type.replace('_', ' ').title()} ({len(findings)} found):")
                for finding in findings[:10]:  # Show up to 10 per type
                    service_name = finding.get("service_name", finding.get("cluster_name", "N/A"))
                    cluster_name = finding.get("cluster_name", "N/A")
                    print(f"  - {service_name} ({cluster_name})")
                    if "recommendation" in finding:
                        print(f"    Recommendation: {finding['recommendation']}")
                    if "monthly_savings" in finding:
                        print(f"    Savings: ${finding['monthly_savings']:,.2f}/month")
                    if "current_cpu" in finding and "recommended_cpu" in finding:
                        print(f"    Current: {finding['current_cpu']} CPU, {finding['current_memory']} MB")
                        print(f"    Recommended: {finding['recommended_cpu']} CPU, {finding['recommended_memory']} MB")
                if len(findings) > 10:
                    print(f"  ... and {len(findings) - 10} more")

        # Detailed EKS Findings
        print("\n" + "-" * 80)
        print("DETAILED EKS FINDINGS")
        print("-" * 80)

        if not self.eks_findings:
            print("\nNo EKS issues found. All nodes are well-configured!")
        else:
            # Group findings by type
            eks_by_type = defaultdict(list)
            for finding in self.eks_findings:
                eks_by_type[finding["finding_type"]].append(finding)

            for finding_type, findings in sorted(eks_by_type.items()):
                print(f"\n{finding_type.replace('_', ' ').title()} ({len(findings)} found):")
                for finding in findings[:10]:  # Show up to 10 per type
                    node_name = finding.get("node_group", finding.get("node_id", "N/A"))
                    cluster_name = finding.get("cluster_name", "N/A")
                    print(f"  - {node_name} ({cluster_name})")
                    if "recommendation" in finding:
                        print(f"    Recommendation: {finding['recommendation']}")
                    if "spot_savings_potential" in finding:
                        print(f"    Savings: ${finding['spot_savings_potential']:,.2f}/month")
                    if "current_utilization" in finding:
                        util = finding["current_utilization"]
                        print(f"    CPU: {util['cpu']:.1f}%, Memory: {util['memory']:.1f}%")
                if len(findings) > 10:
                    print(f"  ... and {len(findings) - 10} more")

        # Top Savings Opportunities
        print("\n" + "-" * 80)
        print("TOP 10 COST SAVINGS OPPORTUNITIES")
        print("-" * 80 + "\n")

        all_savings = []
        for finding in self.ecs_findings:
            if "monthly_savings" in finding:
                all_savings.append(("ECS", finding))
        for finding in self.eks_findings:
            if "spot_savings_potential" in finding:
                all_savings.append(("EKS", finding))

        all_savings.sort(key=lambda x: x[1].get("monthly_savings", x[1].get("spot_savings_potential", 0)), reverse=True)

        if not all_savings:
            print("No cost optimization opportunities with quantified savings found.")
        else:
            savings_table = [["#", "Type", "Resource", "Cluster", "Issue", "Monthly Savings"]]
            for i, (service_type, finding) in enumerate(all_savings[:10], 1):
                savings = finding.get("monthly_savings", finding.get("spot_savings_potential", 0))
                name = finding.get("service_name", finding.get("node_group", finding.get("node_id", "N/A")))
                cluster = finding.get("cluster_name", "N/A")
                issue = finding["finding_type"].replace("_", " ").title()
                savings_table.append([i, service_type, name, cluster, issue, f"${savings:,.2f}"])
            print(tabulate(savings_table, headers="firstrow", tablefmt="grid"))

        print("=" * 80 + "\n")

    def _save_json_output(self):
        """Save findings to JSON file"""
        output = {
            "metadata": {
                "analysis_start_time": self.analysis_metadata.get("analysis_start_time"),
                "analysis_end_time": self.analysis_metadata.get("analysis_end_time"),
                "region": self.region,
                "clusters_analyzed": self.analysis_metadata.get("clusters_analyzed", []),
                "clusters_excluded": self.analysis_metadata.get("clusters_excluded", []),
                "services_excluded": self.analysis_metadata.get("services_excluded", {}),
                "finding_type_counts": dict(self.analysis_metadata.get("finding_type_counts", {})),
            },
            "summary": self.summary,
            "ecs_findings": self.ecs_findings,
            "eks_findings": self.eks_findings,
        }

        with open("container_optimization.json", "w") as f:
            json.dump(output, f, indent=2, default=str)

        logger.info("Saved findings to container_optimization.json")

    def _save_csv_output(self):
        """Save rightsizing plan to CSV"""
        plans = []
        columns = [
            "Type",
            "Cluster",
            "Service",
            "NodeGroup",
            "Action",
            "Current_Config",
            "Recommended_Config",
            "Monthly_Savings",
            "Implementation_Steps",
        ]

        # Generate rightsizing plans from ECS findings
        for finding in self.ecs_findings:
            finding_type = finding.get("finding_type")
            base_plan = {
                "Type": "ECS",
                "Cluster": finding.get("cluster_name", ""),
                "Service": finding.get("service_name", ""),
                "NodeGroup": "",
            }

            if finding_type == "over_provisioning":
                plan = {
                    **base_plan,
                    "Action": "Resize Task Definition",
                    "Current_Config": f"{finding['current_cpu']} CPU, {finding['current_memory']} MB",
                    "Recommended_Config": f"{finding['recommended_cpu']} CPU, {finding['recommended_memory']} MB",
                    "Monthly_Savings": f"${finding['monthly_savings']:.2f}",
                    "Implementation_Steps": "Update task definition, deploy new revision",
                }
                plans.append(plan)
            elif finding_type == "missing_auto_scaling":
                plan = {
                    **base_plan,
                    "Action": "Enable Auto Scaling",
                    "Current_Config": "No auto-scaling",
                    "Recommended_Config": "Target tracking scaling policy",
                    "Monthly_Savings": "Variable",
                    "Implementation_Steps": "Configure Application Auto Scaling with target tracking",
                }
                plans.append(plan)
            elif finding_type == "inefficient_task_placement":
                plan = {
                    **base_plan,
                    "Action": "Migrate to EC2",
                    "Current_Config": f"FARGATE: {finding.get('current_cpu', 'N/A')} CPU, {finding.get('current_memory', 'N/A')} MB",
                    "Recommended_Config": "EC2 launch type",
                    "Monthly_Savings": f"${finding.get('monthly_savings', 0):.2f}",
                    "Implementation_Steps": "Create EC2 capacity provider, update service launch type",
                }
                plans.append(plan)
            elif finding_type == "singleton_ha_risk":
                plan = {
                    **base_plan,
                    "Action": "Increase Desired Count",
                    "Current_Config": f"Desired count: {finding.get('desired_count', 1)}",
                    "Recommended_Config": "Desired count: 2+ with multi-AZ placement",
                    "Monthly_Savings": "N/A",
                    "Implementation_Steps": finding.get("recommendation", "Increase desired count to 2+"),
                }
                plans.append(plan)
            elif finding_type == "old_container_images":
                plan = {
                    **base_plan,
                    "Action": "Update Container Images",
                    "Current_Config": f"Image age: {finding.get('age_days', 0)} days",
                    "Recommended_Config": "Update to latest version",
                    "Monthly_Savings": "N/A",
                    "Implementation_Steps": finding.get("recommendation", "Update container images"),
                }
                plans.append(plan)
            elif finding_type == "missing_health_checks":
                plan = {
                    **base_plan,
                    "Action": "Configure Health Checks",
                    "Current_Config": "No health check grace period",
                    "Recommended_Config": "Set appropriate grace period (e.g., 60s)",
                    "Monthly_Savings": "N/A",
                    "Implementation_Steps": finding.get("recommendation", "Configure health check grace period"),
                }
                plans.append(plan)
            elif finding_type == "excessive_task_revisions":
                plan = {
                    **base_plan,
                    "Action": "Review Deployment Process",
                    "Current_Config": f"Revision count: {finding.get('revision_count', 0)}",
                    "Recommended_Config": "Reduce configuration churn",
                    "Monthly_Savings": "N/A",
                    "Implementation_Steps": finding.get("recommendation", "Review deployment process"),
                }
                plans.append(plan)
            elif finding_type == "missing_logging":
                plan = {
                    **base_plan,
                    "Action": "Configure Logging",
                    "Current_Config": f"Missing logging in: {', '.join(finding.get('containers', []))}",
                    "Recommended_Config": "CloudWatch Logs or Fluent Bit",
                    "Monthly_Savings": "N/A",
                    "Implementation_Steps": finding.get("recommendation", "Configure logging"),
                }
                plans.append(plan)
            elif finding_type == "missing_service_discovery":
                plan = {
                    **base_plan,
                    "Action": "Enable Service Discovery",
                    "Current_Config": "No service registry",
                    "Recommended_Config": "ECS Service Discovery",
                    "Monthly_Savings": "N/A",
                    "Implementation_Steps": finding.get("recommendation", "Enable ECS Service Discovery"),
                }
                plans.append(plan)
            elif finding_type == "cluster_overprovisioning":
                plan = {
                    **base_plan,
                    "Service": "",  # Cluster-level issue
                    "Action": "Reduce Cluster Capacity",
                    "Current_Config": f"CPU: {finding.get('cpu_utilization', 0):.1f}%, Memory: {finding.get('memory_utilization', 0):.1f}%",
                    "Recommended_Config": "Consolidate workloads or reduce capacity",
                    "Monthly_Savings": "Variable",
                    "Implementation_Steps": finding.get("recommendation", "Reduce cluster capacity"),
                }
                plans.append(plan)

        # Generate rightsizing plans from EKS findings
        for finding in self.eks_findings:
            finding_type = finding.get("finding_type")
            base_plan = {
                "Type": "EKS",
                "Cluster": finding.get("cluster_name", ""),
                "Service": "",
                "NodeGroup": finding.get("node_group", finding.get("node_id", "")),
            }

            if finding_type == "spot_instance_opportunity":
                plan = {
                    **base_plan,
                    "Action": "Enable Spot Instances",
                    "Current_Config": "ON_DEMAND",
                    "Recommended_Config": "SPOT with ON_DEMAND fallback",
                    "Monthly_Savings": f"${finding['spot_savings_potential']:.2f}",
                    "Implementation_Steps": "Update node group to use spot instances",
                }
                plans.append(plan)
            elif finding_type == "underutilized_node":
                util = finding.get("current_utilization", {})
                plan = {
                    **base_plan,
                    "Action": "Consolidate Workloads",
                    "Current_Config": f"CPU: {util.get('cpu', 0):.1f}%, Memory: {util.get('memory', 0):.1f}%",
                    "Recommended_Config": finding.get("recommended_changes", "Consolidate or downsize"),
                    "Monthly_Savings": "Variable",
                    "Implementation_Steps": finding.get("recommendation", "Consolidate workloads"),
                }
                plans.append(plan)
            elif finding_type == "missing_resource_limits":
                plan = {
                    **base_plan,
                    "Action": "Set Pod Resource Limits",
                    "Current_Config": f"{finding.get('pods_without_limits', 0)} pods without limits",
                    "Recommended_Config": "CPU and memory limits for all pods",
                    "Monthly_Savings": "N/A",
                    "Implementation_Steps": finding.get("recommendation", "Set resource limits"),
                }
                plans.append(plan)

        df = pd.DataFrame(plans) if plans else pd.DataFrame(columns=columns)
        for column in columns:
            if column not in df.columns:
                df[column] = ""
        df = df[columns]
        df.to_csv("rightsizing_plan.csv", index=False)
        logger.info("Saved rightsizing plan to rightsizing_plan.csv")

    def _create_utilization_chart(self):
        """Create utilization distribution chart"""
        has_data = any(self.utilization_data.values())
        plt.style.use("seaborn-v0_8-darkgrid")
        fig, axes = plt.subplots(2, 2, figsize=(12, 10))
        if not has_data:
            logger.warning("No utilization data to visualize")
            for ax in axes.flatten():
                ax.axis("off")
            fig.suptitle("Resource Utilization (No data available)")
            plt.tight_layout()
            plt.savefig("resource_utilization_trends.png", dpi=300, bbox_inches="tight")
            plt.close(fig)
            return
        fig.suptitle("Container Resource Utilization Distribution", fontsize=16)

        # ECS CPU utilization
        if self.utilization_data["ecs_cpu"]:
            ax = axes[0, 0]
            ax.hist(
                self.utilization_data["ecs_cpu"],
                bins=20,
                color="skyblue",
                edgecolor="black",
            )
            ax.set_title("ECS CPU Utilization")
            ax.set_xlabel("CPU Utilization (%)")
            ax.set_ylabel("Number of Services")
            ax.axvline(x=50, color="red", linestyle="--", label="50% threshold")
            ax.legend()

        # ECS Memory utilization
        if self.utilization_data["ecs_memory"]:
            ax = axes[0, 1]
            ax.hist(
                self.utilization_data["ecs_memory"],
                bins=20,
                color="lightgreen",
                edgecolor="black",
            )
            ax.set_title("ECS Memory Utilization")
            ax.set_xlabel("Memory Utilization (%)")
            ax.set_ylabel("Number of Services")
            ax.axvline(x=50, color="red", linestyle="--", label="50% threshold")
            ax.legend()

        # EKS CPU utilization
        if self.utilization_data["eks_cpu"]:
            ax = axes[1, 0]
            ax.hist(
                self.utilization_data["eks_cpu"],
                bins=20,
                color="lightcoral",
                edgecolor="black",
            )
            ax.set_title("EKS Node CPU Utilization")
            ax.set_xlabel("CPU Utilization (%)")
            ax.set_ylabel("Number of Nodes")
            ax.axvline(x=30, color="red", linestyle="--", label="30% threshold")
            ax.legend()

        # EKS Memory utilization
        if self.utilization_data["eks_memory"]:
            ax = axes[1, 1]
            ax.hist(
                self.utilization_data["eks_memory"],
                bins=20,
                color="plum",
                edgecolor="black",
            )
            ax.set_title("EKS Node Memory Utilization")
            ax.set_xlabel("Memory Utilization (%)")
            ax.set_ylabel("Number of Nodes")
            ax.axvline(x=40, color="red", linestyle="--", label="40% threshold")
            ax.legend()

        # Remove empty subplots
        for ax in axes.flat:
            if not ax.has_data():
                fig.delaxes(ax)

        plt.tight_layout()
        plt.savefig("resource_utilization_trends.png", dpi=300, bbox_inches="tight")
        logger.info("Saved utilization chart to resource_utilization_trends.png")
        plt.close()


def main():  # pragma: no cover
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Analyze container resources for optimization opportunities"
    )
    parser.add_argument(
        "--region", default="us-east-1", help="AWS region (default: us-east-1)"
    )
    parser.add_argument("--debug", action="store_true", help="Enable debug logging")

    args = parser.parse_args()

    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)

    try:
        analyzer = ContainerResourceAnalyzer(region=args.region)
        analyzer.analyze()
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise


if __name__ == "__main__":  # pragma: no cover
    main()
