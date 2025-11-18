#!/usr/bin/env python3
"""
Tests for Container Resource Optimization Analyzer
Uses moto to mock AWS services and create realistic test scenarios
"""

import csv
import json
import os
from datetime import datetime, timedelta, timezone
from unittest.mock import ANY, MagicMock, patch

import boto3
import pytest
from moto import mock_aws
from botocore.exceptions import ClientError

import lib.analyse as analyse_module
from lib.analyse import (
    ContainerResourceAnalyzer,
    _ensure_user_site_on_path,
    _lazy_import,
)


class FakeEKSClient:
    """Minimal fake EKS client – moto does not fully implement EKS APIs."""

    def __init__(self):
        self.clusters = {}
        self.node_groups = {}

    def add_cluster(self, name, tags=None):
        self.clusters[name] = {
            "name": name,
            "status": "ACTIVE",
            "createdAt": datetime.now(timezone.utc) - timedelta(days=30),
            "tags": tags or {},
        }

    def add_node_group(
        self,
        cluster_name,
        nodegroup_name,
        *,
        capacity_type="ON_DEMAND",
        desired_size=3,
        instance_types=None,
        tags=None,
    ):
        self.node_groups.setdefault(cluster_name, {})
        self.node_groups[cluster_name][nodegroup_name] = {
            "nodegroupName": nodegroup_name,
            "status": "ACTIVE",
            "createdAt": datetime.now(timezone.utc) - timedelta(days=30),
            "scalingConfig": {"desiredSize": desired_size},
            "instanceTypes": instance_types or ["m5.large"],
            "capacityType": capacity_type,
            "launchTemplate": {},
            "tags": tags or {},
        }

    def list_clusters(self):
        return {"clusters": list(self.clusters.keys())}

    def describe_cluster(self, name):
        return {"cluster": self.clusters[name]}

    def list_nodegroups(self, clusterName):
        return {"nodegroups": list(self.node_groups.get(clusterName, {}).keys())}

    def describe_nodegroup(self, clusterName, nodegroupName):
        return {"nodegroup": self.node_groups[clusterName][nodegroupName]}


@pytest.fixture
def aws_setup(monkeypatch):
    """Set up mocked AWS environment and patch boto3 clients used in tests."""
    with mock_aws():
        original_client = boto3.client
        ecs_client = original_client("ecs", region_name="us-east-1")
        ec2_client = original_client("ec2", region_name="us-east-1")
        cloudwatch_client = original_client("cloudwatch", region_name="us-east-1")
        autoscaling_client = original_client("autoscaling", region_name="us-east-1")
        app_autoscaling_client = original_client(
            "application-autoscaling", region_name="us-east-1"
        )
        eks_client = FakeEKSClient()

        _create_ecs_test_data(ecs_client)
        _create_eks_test_data(eks_client, ec2_client)
        _create_cloudwatch_test_data(cloudwatch_client)

        clients = {
            "ecs": ecs_client,
            "ec2": ec2_client,
            "cloudwatch": cloudwatch_client,
            "autoscaling": autoscaling_client,
            "application-autoscaling": app_autoscaling_client,
            "eks": eks_client,
        }

        def client_factory(service_name, *args, **kwargs):
            if service_name in clients:
                return clients[service_name]
            return original_client(service_name, *args, **kwargs)

        monkeypatch.setattr("lib.analyse.boto3.client", client_factory)

        yield clients


def _create_ecs_test_data(ecs_client):
    """Create test ECS clusters, services, and tasks"""

    # Create clusters with different configurations
    clusters = [
        {"clusterName": "production-cluster"},
        {
            "clusterName": "staging-cluster",
            "tags": [{"key": "ExcludeFromAnalysis", "value": "true"}],
        },
        {"clusterName": "test-cluster"},
    ]

    for cluster in clusters:
        ecs_client.create_cluster(**cluster)

    # Register task definitions with various configurations
    task_definitions = [
        # Over-provisioned task
        {
            "family": "over-provisioned-app",
            "cpu": "4096",
            "memory": "8192",
            "requiresCompatibilities": ["FARGATE"],
            "containerDefinitions": [
                {
                    "name": "app",
                    "image": "nginx:1.19",
                    "cpu": 4096,
                    "memory": 8192,
                    "logConfiguration": {
                        "logDriver": "awslogs",
                        "options": {
                            "awslogs-group": "/ecs/over-provisioned-app",
                            "awslogs-region": "us-east-1",
                        },
                    },
                }
            ],
        },
        # Inefficient Fargate task
        {
            "family": "small-fargate-app",
            "cpu": "256",
            "memory": "512",
            "requiresCompatibilities": ["FARGATE"],
            "containerDefinitions": [
                {"name": "app", "image": "nginx:1.20", "cpu": 256, "memory": 512}
            ],
        },
        # Task with old image
        {
            "family": "old-image-app",
            "cpu": "1024",
            "memory": "2048",
            "requiresCompatibilities": ["EC2"],
            "containerDefinitions": [
                {"name": "app", "image": "myapp:v1.0.0", "cpu": 1024, "memory": 2048}
            ],
        },
        # Task without logging
        {
            "family": "no-logging-app",
            "cpu": "512",
            "memory": "1024",
            "requiresCompatibilities": ["EC2"],
            "containerDefinitions": [
                {"name": "app", "image": "nginx:latest", "cpu": 512, "memory": 1024}
            ],
        },
    ]

    for i, task_def in enumerate(task_definitions):
        # Register multiple revisions for some tasks
        revisions = 60 if "old-image" in task_def["family"] else 1
        for revision in range(1, revisions + 1):
            ecs_client.register_task_definition(**task_def)

    # Create services with various configurations
    services = [
        # Over-provisioned service
        {
            "cluster": "production-cluster",
            "serviceName": "api-service",
            "taskDefinition": "over-provisioned-app",
            "desiredCount": 3,
            "launchType": "FARGATE",
            "healthCheckGracePeriodSeconds": 60,
            "loadBalancers": [
                {
                    "targetGroupArn": "arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/test/123"
                }
            ],
        },
        # Service with inefficient task placement
        {
            "cluster": "production-cluster",
            "serviceName": "small-service",
            "taskDefinition": "small-fargate-app",
            "desiredCount": 2,
            "launchType": "FARGATE",
        },
        # Singleton service without HA
        {
            "cluster": "production-cluster",
            "serviceName": "singleton-service",
            "taskDefinition": "old-image-app",
            "desiredCount": 1,
            "launchType": "EC2",
        },
        # Service without health checks
        {
            "cluster": "production-cluster",
            "serviceName": "no-health-service",
            "taskDefinition": "no-logging-app",
            "desiredCount": 2,
            "launchType": "EC2",
            "loadBalancers": [
                {
                    "targetGroupArn": "arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/test/456"
                }
            ],
        },
        # Dev service (should be excluded)
        {
            "cluster": "production-cluster",
            "serviceName": "dev-test-service",
            "taskDefinition": "over-provisioned-app",
            "desiredCount": 1,
            "launchType": "FARGATE",
        },
        # Service without service discovery
        {
            "cluster": "production-cluster",
            "serviceName": "backend-api",
            "taskDefinition": "over-provisioned-app",
            "desiredCount": 2,
            "launchType": "FARGATE",
        },
    ]

    for service in services:
        ecs_client.create_service(**service)

    # Create additional services to reach 30+ total
    for i in range(25):
        ecs_client.create_service(
            cluster="test-cluster",
            serviceName=f"test-service-{i}",
            taskDefinition="over-provisioned-app",
            desiredCount=2,
            launchType="FARGATE",
        )


def _create_eks_test_data(eks_client, ec2_client):
    """Create fake EKS metadata and EC2 nodes."""

    eks_client.add_cluster("production-eks")
    eks_client.add_cluster("staging-eks", tags={"ExcludeFromAnalysis": "true"})
    eks_client.add_cluster("test-eks")

    eks_client.add_node_group(
        "production-eks",
        "on-demand-group",
        instance_types=["m5.large"],
        capacity_type="ON_DEMAND",
        desired_size=5,
    )
    eks_client.add_node_group(
        "production-eks",
        "spot-group",
        instance_types=["m5.large", "m5.xlarge"],
        capacity_type="SPOT",
        desired_size=3,
    )

    vpc_id = ec2_client.create_vpc(CidrBlock="10.0.0.0/16")["Vpc"]["VpcId"]
    subnet_id = ec2_client.create_subnet(VpcId=vpc_id, CidrBlock="10.0.1.0/24")[
        "Subnet"
    ]["SubnetId"]

    for i in range(5):
        ec2_client.run_instances(
            ImageId="ami-12345678",
            MinCount=1,
            MaxCount=1,
            InstanceType="m5.large",
            SubnetId=subnet_id,
            TagSpecifications=[
                {
                    "ResourceType": "instance",
                    "Tags": [
                        {
                            "Key": "kubernetes.io/cluster/production-eks",
                            "Value": "owned",
                        },
                        {"Key": "Name", "Value": f"eks-node-{i}"},
                    ],
                }
            ],
        )


def _create_cloudwatch_test_data(cloudwatch_client):
    """Create test CloudWatch metrics"""

    # Create ECS Container Insights metrics
    ecs_metrics = [
        # Over-provisioned service metrics
        {
            "MetricName": "CPUUtilization",
            "Dimensions": [
                {"Name": "ClusterName", "Value": "production-cluster"},
                {"Name": "ServiceName", "Value": "api-service"},
            ],
            "Value": 20.0,  # Low CPU usage
        },
        {
            "MetricName": "MemoryUtilization",
            "Dimensions": [
                {"Name": "ClusterName", "Value": "production-cluster"},
                {"Name": "ServiceName", "Value": "api-service"},
            ],
            "Value": 25.0,  # Low memory usage
        },
    ]

    # Create EC2 metrics for EKS nodes
    ec2_instances = boto3.client("ec2", region_name="us-east-1").describe_instances()
    for reservation in ec2_instances["Reservations"]:
        for instance in reservation["Instances"]:
            instance_id = instance["InstanceId"]

            # Underutilized nodes
            if "eks-node-" in instance.get("Tags", [{}])[0].get("Value", ""):
                cpu_value = 25.0
                memory_value = 35.0
            else:
                cpu_value = 60.0
                memory_value = 70.0

            cloudwatch_client.put_metric_data(
                Namespace="AWS/EC2",
                MetricData=[
                    {
                        "MetricName": "CPUUtilization",
                        "Dimensions": [{"Name": "InstanceId", "Value": instance_id}],
                        "Value": cpu_value,
                        "Timestamp": datetime.utcnow(),
                    }
                ],
            )

            cloudwatch_client.put_metric_data(
                Namespace="CWAgent",
                MetricData=[
                    {
                        "MetricName": "mem_used_percent",
                        "Dimensions": [{"Name": "InstanceId", "Value": instance_id}],
                        "Value": memory_value,
                        "Timestamp": datetime.utcnow(),
                    }
                ],
            )


class TestContainerResourceAnalyzer:
    """Test cases for Container Resource Analyzer"""

    def test_lazy_import_installs_missing_dependency(self, monkeypatch):
        """Ensure _lazy_import installs packages when absent"""
        call_tracker = {"import": 0, "pip": 0}

        def fake_import(module):
            call_tracker["import"] += 1
            if call_tracker["import"] == 1:
                raise ModuleNotFoundError
            return "loaded-module"

        def fake_pip_install(cmd, env=None):
            call_tracker["pip"] += 1
            assert "missing-package" in cmd
            assert env and env.get("PIP_BREAK_SYSTEM_PACKAGES") == "1"

        monkeypatch.setattr("lib.analyse.importlib.import_module", fake_import)
        monkeypatch.setattr("lib.analyse.subprocess.check_call", fake_pip_install)

        result = _lazy_import("missing-package", pip_name="missing-package")
        assert result == "loaded-module"
        assert call_tracker["pip"] == 1

    def test_lazy_import_respects_disable_flag(self, monkeypatch):
        """Ensure auto-install can be disabled via environment variable."""
        monkeypatch.setenv("ANALYZE_DISABLE_AUTO_INSTALL", "1")

        def fake_import(module):
            raise ModuleNotFoundError

        def no_pip(*_, **__):
            raise AssertionError("pip called while auto-install disabled")

        monkeypatch.setattr("lib.analyse.importlib.import_module", fake_import)
        monkeypatch.setattr("lib.analyse.subprocess.check_call", no_pip)

        with pytest.raises(ModuleNotFoundError):
            _lazy_import("missing-package", pip_name="missing-package")

    def test_user_site_path_is_appended_when_running_outside_venv(
        self, monkeypatch
    ):
        """Ensure helper adds user site directory to sys.path."""
        fake_site = "/tmp/fake-site"
        monkeypatch.setattr("lib.analyse.sys.prefix", "/opt/python")
        monkeypatch.setattr("lib.analyse.sys.base_prefix", "/opt/python")
        monkeypatch.setattr("lib.analyse.sys.path", [])
        monkeypatch.setattr("lib.analyse.site.getusersitepackages", lambda: fake_site)

        _ensure_user_site_on_path()

        assert fake_site in analyse_module.sys.path

    def test_initialization(self):
        """Test analyzer initialization"""
        analyzer = ContainerResourceAnalyzer()
        assert analyzer.region == "us-east-1"
        assert analyzer.ecs_findings == []
        assert analyzer.eks_findings == []
        assert analyzer.summary["total_ecs_services"] == 0
        assert analyzer.summary["total_eks_nodes"] == 0

    def test_cluster_exclusion(self):
        """Test that clusters with ExcludeFromAnalysis tag are skipped"""
        analyzer = ContainerResourceAnalyzer()

        # Test case-insensitive exclusion
        tags = [{"Key": "ExcludeFromAnalysis", "Value": "True"}]
        assert analyzer._should_exclude_cluster(tags) is True

        tags = [{"Key": "excludefromanalysis", "Value": "TRUE"}]
        assert analyzer._should_exclude_cluster(tags) is True

        tags = [{"Key": "OtherTag", "Value": "value"}]
        assert analyzer._should_exclude_cluster(tags) is False

    def test_analyze_ecs_clusters_honors_exclusions(self):
        """Ensure excluded ECS clusters are skipped"""
        analyzer = ContainerResourceAnalyzer()
        analyzer.ecs_client = MagicMock()
        analyzer.ecs_client.list_clusters.return_value = {
            "clusterArns": [
                "arn:aws:ecs:us-east-1:123:cluster/production-cluster",
                "arn:aws:ecs:us-east-1:123:cluster/excluded-cluster",
            ]
        }
        analyzer.ecs_client.describe_clusters.side_effect = [
            {"clusters": [{"clusterName": "production-cluster", "tags": []}]},
            {
                "clusters": [
                    {
                        "clusterName": "excluded-cluster",
                        "tags": [{"Key": "ExcludeFromAnalysis", "Value": "true"}],
                    }
                ]
            },
        ]

        with patch.object(
            analyzer, "_analyze_ecs_services"
        ) as mock_services, patch.object(
            analyzer, "_check_cluster_overprovisioning"
        ) as mock_over:
            analyzer._analyze_ecs_clusters()

        mock_services.assert_called_once()
        mock_over.assert_called_once()
        called_cluster, details = mock_services.call_args[0]
        assert called_cluster == "production-cluster"
        assert details["clusterName"] == "production-cluster"

    @patch("lib.analyse.ContainerResourceAnalyzer._get_container_insights_metrics")
    def test_ecs_over_provisioning_detection(self, mock_metrics, aws_setup):
        """Test detection of over-provisioned ECS tasks"""
        analyzer = ContainerResourceAnalyzer()

        # Mock low utilization metrics
        mock_metrics.side_effect = [[20.0] * 14, [25.0] * 14]  # CPU 20%, Memory 25%

        # Create a service to test
        service = {
            "serviceName": "api-service",
            "taskDefinition": "over-provisioned-app:1",
            "createdAt": datetime.now() - timedelta(days=30),
            "desiredCount": 3,
            "launchType": "FARGATE",
        }

        with patch.object(
            analyzer.ecs_client, "describe_task_definition"
        ) as mock_task_def, patch.object(
            analyzer.ecs_client, "list_tasks"
        ) as mock_list_tasks:
            mock_task_def.return_value = {
                "taskDefinition": {"cpu": "4096", "memory": "8192"}
            }
            mock_list_tasks.return_value = {"taskArns": ["arn:task/1"]}

            analyzer._check_ecs_over_provisioning("production-cluster", service)

        # Verify findings
        assert len(analyzer.ecs_findings) == 1
        finding = analyzer.ecs_findings[0]
        assert finding["finding_type"] == "over_provisioning"
        assert finding["current_cpu"] == 4096
        assert finding["current_memory"] == 8192
        assert finding["recommended_cpu"] < 4096
        assert finding["monthly_savings"] > 0

    def test_eks_spot_instance_opportunity(self, aws_setup):
        """Test detection of spot instance opportunities"""
        analyzer = ContainerResourceAnalyzer()

        with patch.object(
            analyzer.eks_client, "list_nodegroups"
        ) as mock_list, patch.object(
            analyzer.eks_client, "describe_nodegroup"
        ) as mock_describe:
            mock_list.return_value = {"nodegroups": ["on-demand-group"]}
            mock_describe.return_value = {
                "nodegroup": {
                    "nodegroupName": "on-demand-group",
                    "capacityType": "ON_DEMAND",
                    "instanceTypes": ["m5.large"],
                    "scalingConfig": {"desiredSize": 5},
                    "createdAt": datetime.now() - timedelta(days=30),
                }
            }

            analyzer._analyze_eks_node_groups("production-eks")

            # Verify spot instance opportunity was found
            spot_findings = [
                f
                for f in analyzer.eks_findings
                if f["finding_type"] == "spot_instance_opportunity"
            ]
            assert len(spot_findings) == 1
            assert spot_findings[0]["spot_savings_potential"] > 0

    def test_analyze_eks_clusters_routes_active_clusters(self):
        """Ensure only non-excluded EKS clusters are analyzed"""
        analyzer = ContainerResourceAnalyzer()
        analyzer.eks_client = MagicMock()
        analyzer.eks_client.list_clusters.return_value = {
            "clusters": ["production-eks", "excluded-eks"]
        }
        analyzer.eks_client.describe_cluster.side_effect = [
            {"cluster": {"name": "production-eks", "tags": {"Env": "prod"}}},
            {
                "cluster": {
                    "name": "excluded-eks",
                    "tags": {"ExcludeFromAnalysis": "true"},
                }
            },
        ]

        with patch.object(
            analyzer, "_analyze_eks_node_groups"
        ) as mock_group, patch.object(
            analyzer, "_analyze_eks_nodes"
        ) as mock_nodes:
            analyzer._analyze_eks_clusters()

        mock_group.assert_called_once_with("production-eks")
        mock_nodes.assert_called_once_with("production-eks")

    def test_analyze_eks_nodes_counts_instances(self):
        """Ensure node-level analysis increments counters and runs checks"""
        analyzer = ContainerResourceAnalyzer()
        analyzer.ec2_client = MagicMock()
        analyzer.ec2_client.describe_instances.return_value = {
            "Reservations": [
                {
                    "Instances": [
                        {
                            "InstanceId": "i-1234567890",
                            "InstanceType": "m5.large",
                            "LaunchTime": datetime.now(timezone.utc)
                            - timedelta(days=30),
                        }
                    ]
                }
            ]
        }

        with patch.object(
            analyzer, "_check_eks_node_utilization"
        ) as mock_util, patch.object(
            analyzer, "_check_eks_pod_resource_limits"
        ) as mock_pods:
            analyzer._analyze_eks_nodes("production-eks")

        assert analyzer.summary["total_eks_nodes"] == 1
        mock_util.assert_called_once_with("production-eks", "i-1234567890", "m5.large")
        mock_pods.assert_called_once_with("production-eks", "i-1234567890")

    @patch("lib.analyse.ContainerResourceAnalyzer._get_cloudwatch_metrics")
    def test_eks_underutilized_nodes(self, mock_metrics, aws_setup):
        """Test detection of underutilized EKS nodes"""
        analyzer = ContainerResourceAnalyzer()

        # Mock low utilization metrics
        mock_metrics.side_effect = [[25.0] * 14, [35.0] * 14]  # CPU 25%, Memory 35%

        analyzer._check_eks_node_utilization(
            "production-eks", "i-1234567890", "m5.large"
        )

        # Verify underutilized node was found
        underutilized = [
            f
            for f in analyzer.eks_findings
            if f["finding_type"] == "underutilized_node"
        ]
        assert len(underutilized) == 1
        assert underutilized[0]["current_utilization"]["cpu"] == 25.0
        assert underutilized[0]["current_utilization"]["memory"] == 35.0

    @patch("lib.analyse.ContainerResourceAnalyzer._get_cloudwatch_metrics")
    def test_eks_pod_resource_limits_detection(self, mock_metrics):
        """Test detection of pods missing resource limits"""
        analyzer = ContainerResourceAnalyzer()
        mock_metrics.return_value = [0, 1, 3]

        analyzer._check_eks_pod_resource_limits("production-eks", "i-1234567890")

        findings = [
            f
            for f in analyzer.eks_findings
            if f["finding_type"] == "missing_resource_limits"
        ]
        assert len(findings) == 1
        assert findings[0]["pods_without_limits"] == 3

    @patch("lib.analyse.logger")
    @patch("lib.analyse.ContainerResourceAnalyzer._get_cloudwatch_metrics")
    def test_eks_pod_resource_limits_logs_when_no_data(
        self, mock_metrics, mock_logger
    ):
        """Ensure missing metrics emit a debug log instead of raising"""
        analyzer = ContainerResourceAnalyzer()
        mock_metrics.return_value = []

        analyzer._check_eks_pod_resource_limits("production-eks", "i-0000")

        mock_logger.debug.assert_called_once()

    def test_missing_auto_scaling_detection(self, aws_setup):
        """Test detection of missing auto-scaling configuration"""
        analyzer = ContainerResourceAnalyzer()

        service = {
            "serviceName": "api-service",
            "createdAt": datetime.now() - timedelta(days=30),
        }

        with patch.object(
            analyzer.application_autoscaling_client, "describe_scalable_targets"
        ) as mock_targets:
            mock_targets.return_value = {"ScalableTargets": []}

            with patch.object(analyzer, "_get_cloudwatch_metrics") as mock_metrics:
                # Mock variable traffic pattern
                mock_metrics.return_value = [10, 20, 5, 30, 15, 40, 8]

                analyzer._check_missing_auto_scaling("production-cluster", service)

                # Verify missing auto-scaling was detected
                auto_scaling_findings = [
                    f
                    for f in analyzer.ecs_findings
                    if f["finding_type"] == "missing_auto_scaling"
                ]
                assert len(auto_scaling_findings) == 1

    def test_inefficient_task_placement(self, aws_setup):
        """Test detection of inefficient Fargate task placement"""
        analyzer = ContainerResourceAnalyzer()

        service = {
            "serviceName": "small-service",
            "taskDefinition": "small-fargate-app:1",
            "launchType": "FARGATE",
            "createdAt": datetime.now() - timedelta(days=30),
        }

        with patch.object(
            analyzer.ecs_client, "describe_task_definition"
        ) as mock_task_def:
            mock_task_def.return_value = {
                "taskDefinition": {
                    "cpu": "256",
                    "memory": "512",
                    "requiresCompatibilities": ["FARGATE"],
                }
            }

            analyzer._check_inefficient_task_placement("production-cluster", service)

            # Verify inefficient placement was detected
            placement_findings = [
                f
                for f in analyzer.ecs_findings
                if f["finding_type"] == "inefficient_task_placement"
            ]
            assert len(placement_findings) == 1
            assert placement_findings[0]["recommended_launch_type"] == "EC2"

    def test_singleton_ha_risk_detection(self, aws_setup):
        """Test detection of singleton services without HA"""
        analyzer = ContainerResourceAnalyzer()

        service = {
            "serviceName": "singleton-service",
            "desiredCount": 1,
            "placementStrategy": [],
            "createdAt": datetime.now() - timedelta(days=30),
        }

        analyzer._check_singleton_ha_risks("production-cluster", service)

        # Verify singleton risk was detected
        ha_findings = [
            f for f in analyzer.ecs_findings if f["finding_type"] == "singleton_ha_risk"
        ]
        assert len(ha_findings) == 1
        assert ha_findings[0]["desired_count"] == 1

    def test_old_container_images_detection(self, aws_setup):
        """Test detection of old container images"""
        analyzer = ContainerResourceAnalyzer()

        service = {
            "serviceName": "old-service",
            "taskDefinition": "old-image-app:60",
            "createdAt": datetime.now() - timedelta(days=30),
        }

        with patch.object(
            analyzer.ecs_client, "describe_task_definition"
        ) as mock_task_def:
            mock_task_def.return_value = {
                "taskDefinition": {
                    "registeredAt": datetime.now() - timedelta(days=120),
                    "containerDefinitions": [{"image": "myapp:v1.0.0", "name": "app"}],
                }
            }

            analyzer._check_old_container_images("production-cluster", service)

            # Verify old images were detected
            old_image_findings = [
                f
                for f in analyzer.ecs_findings
                if f["finding_type"] == "old_container_images"
            ]
            assert len(old_image_findings) == 1
            assert old_image_findings[0]["age_days"] >= 90

    def test_missing_health_checks(self, aws_setup):
        """Test detection of missing health checks"""
        analyzer = ContainerResourceAnalyzer()

        service = {
            "serviceName": "no-health-service",
            "loadBalancers": [
                {
                    "targetGroupArn": "arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/test/456"
                }
            ],
            "createdAt": datetime.now() - timedelta(days=30),
        }

        analyzer._check_health_checks("production-cluster", service)

        # Verify missing health checks were detected
        health_findings = [
            f
            for f in analyzer.ecs_findings
            if f["finding_type"] == "missing_health_checks"
        ]
        assert len(health_findings) == 1
        assert health_findings[0]["has_load_balancer"] is True

    def test_excessive_task_revisions(self, aws_setup):
        """Test detection of excessive task definition revisions"""
        analyzer = ContainerResourceAnalyzer()

        service = {
            "serviceName": "churning-service",
            "taskDefinition": "churning-app:75",
            "createdAt": datetime.now() - timedelta(days=30),
        }

        analyzer._check_excessive_task_revisions("production-cluster", service)

        # Verify excessive revisions were detected
        revision_findings = [
            f
            for f in analyzer.ecs_findings
            if f["finding_type"] == "excessive_task_revisions"
        ]
        assert len(revision_findings) == 1
        assert revision_findings[0]["revision_count"] == 75

    def test_missing_logging_detection(self, aws_setup):
        """Test detection of missing logging configuration"""
        analyzer = ContainerResourceAnalyzer()

        service = {
            "serviceName": "no-logging-service",
            "taskDefinition": "no-logging-app:1",
            "createdAt": datetime.now() - timedelta(days=30),
        }

        with patch.object(
            analyzer.ecs_client, "describe_task_definition"
        ) as mock_task_def:
            mock_task_def.return_value = {
                "taskDefinition": {
                    "containerDefinitions": [{"name": "app", "image": "nginx:latest"}]
                }
            }

            analyzer._check_missing_logging("production-cluster", service)

            # Verify missing logging was detected
            logging_findings = [
                f
                for f in analyzer.ecs_findings
                if f["finding_type"] == "missing_logging"
            ]
            assert len(logging_findings) == 1
            assert "app" in logging_findings[0]["containers"]

    def test_missing_service_discovery(self, aws_setup):
        """Test detection of missing service discovery"""
        analyzer = ContainerResourceAnalyzer()

        service = {
            "serviceName": "backend-api",
            "serviceRegistries": [],
            "createdAt": datetime.now() - timedelta(days=30),
        }

        analyzer._check_service_discovery("production-cluster", service)

        # Verify missing service discovery was detected
        discovery_findings = [
            f
            for f in analyzer.ecs_findings
            if f["finding_type"] == "missing_service_discovery"
        ]
        assert len(discovery_findings) == 1

    def test_cluster_overprovisioning(self, aws_setup):
        """Test detection of cluster overprovisioning"""
        analyzer = ContainerResourceAnalyzer()

        cluster_details = {
            "clusterName": "production-cluster",
            "statistics": [
                {"name": "CPUUtilization", "value": "45"},
                {"name": "MemoryUtilization", "value": "50"},
            ],
        }

        analyzer._check_cluster_overprovisioning("production-cluster", cluster_details)

        # Verify cluster overprovisioning was detected
        cluster_findings = [
            f
            for f in analyzer.ecs_findings
            if f["finding_type"] == "cluster_overprovisioning"
        ]
        assert len(cluster_findings) == 1
        assert cluster_findings[0]["unused_cpu_percent"] == 55

    def test_dev_service_exclusion(self, aws_setup):
        """Test that services starting with 'dev-' are excluded"""
        analyzer = ContainerResourceAnalyzer()

        # Mock service list including dev services
        with patch.object(analyzer.ecs_client, "get_paginator") as mock_paginator:
            mock_paginator.return_value.paginate.return_value = [
                {
                    "serviceArns": [
                        "arn:aws:ecs:us-east-1:123456789012:service/production-cluster/api-service",
                        "arn:aws:ecs:us-east-1:123456789012:service/production-cluster/dev-test-service",
                    ]
                }
            ]

            with patch.object(
                analyzer.ecs_client, "describe_services"
            ) as mock_describe:
                mock_describe.return_value = {
                    "services": [
                        {
                            "serviceName": "api-service",
                            "createdAt": datetime.now() - timedelta(days=30),
                            "taskDefinition": "over-provisioned-app:1",
                        },
                        {
                            "serviceName": "dev-test-service",
                            "createdAt": datetime.now() - timedelta(days=30),
                            "taskDefinition": "over-provisioned-app:1",
                        },
                        {
                            "serviceName": "recent-service",
                            "createdAt": datetime.now() - timedelta(days=5),
                            "taskDefinition": "over-provisioned-app:1",
                        },
                    ]
                }

                analyzer._analyze_ecs_services("production-cluster", {})

                # Only non-dev, older service should be counted
                assert analyzer.summary["total_ecs_services"] == 1

    def test_timezone_aware_service_age_filter(self, aws_setup):
        """Services older than 14 days with tz-aware timestamps should be analyzed"""
        analyzer = ContainerResourceAnalyzer()

        tz_old = timezone(timedelta(hours=5))
        tz_new = timezone(timedelta(hours=-7))
        old_service_time = datetime.now(tz_old) - timedelta(days=20)
        new_service_time = datetime.now(tz_new) - timedelta(days=5)

        with patch.object(analyzer.ecs_client, "get_paginator") as mock_pag:
            mock_pag.return_value.paginate.return_value = [
                {"serviceArns": ["arn:prod/old", "arn:prod/new"]}
            ]

            with patch.object(
                analyzer.ecs_client, "describe_services"
            ) as mock_describe:
                mock_describe.return_value = {
                    "services": [
                        {
                            "serviceName": "old-service",
                            "createdAt": old_service_time,
                            "taskDefinition": "td:1",
                        },
                        {
                            "serviceName": "new-service",
                            "createdAt": new_service_time,
                            "taskDefinition": "td:2",
                        },
                    ]
                }

                with patch.multiple(
                    analyzer,
                    _check_ecs_over_provisioning=lambda *a, **k: None,
                    _check_missing_auto_scaling=lambda *a, **k: None,
                    _check_inefficient_task_placement=lambda *a, **k: None,
                    _check_singleton_ha_risks=lambda *a, **k: None,
                    _check_old_container_images=lambda *a, **k: None,
                    _check_health_checks=lambda *a, **k: None,
                    _check_excessive_task_revisions=lambda *a, **k: None,
                    _check_missing_logging=lambda *a, **k: None,
                    _check_service_discovery=lambda *a, **k: None,
                ):
                    analyzer._analyze_ecs_services("production-cluster", {})

        assert analyzer.summary["total_ecs_services"] == 1

    def test_get_cloudwatch_metrics_helper(self):
        """Ensure CloudWatch metrics helper returns datapoints"""
        analyzer = ContainerResourceAnalyzer()
        analyzer.cloudwatch_client = MagicMock()
        analyzer.cloudwatch_client.get_metric_statistics.return_value = {
            "Datapoints": [{"Average": 10.0}, {"Average": 20.0}]
        }

        end = datetime.utcnow()
        start = end - timedelta(hours=1)
        values = analyzer._get_cloudwatch_metrics(
            "AWS/EC2", "InstanceId", "i-123", "CPUUtilization", start, end
        )

        assert values == [10.0, 20.0]
        analyzer.cloudwatch_client.get_metric_statistics.assert_called_once()

    def test_get_container_insights_metrics_helper(self):
        """Ensure Container Insights metrics helper returns averages"""
        analyzer = ContainerResourceAnalyzer()
        analyzer.cloudwatch_client = MagicMock()
        analyzer.cloudwatch_client.get_metric_statistics.return_value = {
            "Datapoints": [{"Average": 30.0}]
        }

        end = datetime.utcnow()
        start = end - timedelta(hours=1)
        values = analyzer._get_container_insights_metrics(
            "production-cluster", "api-service", "CPUUtilization", start, end
        )

        assert values == [30.0]
        analyzer.cloudwatch_client.get_metric_statistics.assert_called_once()

    def test_cloudwatch_metrics_error_returns_empty(self):
        """Ensure CloudWatch helper swallows boto errors"""
        analyzer = ContainerResourceAnalyzer()

        error = ClientError(
            error_response={"Error": {"Code": "Throttling", "Message": "slow"}},
            operation_name="GetMetricStatistics",
        )

        with patch.object(
            analyzer.cloudwatch_client,
            "get_metric_statistics",
            side_effect=error,
        ):
            values = analyzer._get_cloudwatch_metrics(
                "AWS/EC2",
                "InstanceId",
                "i-0000",
                "CPUUtilization",
                datetime.utcnow() - timedelta(hours=1),
                datetime.utcnow(),
            )

        assert values == []

    def test_container_insights_metrics_error_returns_empty(self):
        """Ensure Container Insights helper swallows boto errors"""
        analyzer = ContainerResourceAnalyzer()

        error = ClientError(
            error_response={"Error": {"Code": "AccessDenied", "Message": "nope"}},
            operation_name="GetMetricStatistics",
        )

        with patch.object(
            analyzer.cloudwatch_client,
            "get_metric_statistics",
            side_effect=error,
        ):
            values = analyzer._get_container_insights_metrics(
                "production",
                "svc",
                "CPUUtilization",
                datetime.utcnow() - timedelta(hours=1),
                datetime.utcnow(),
            )

        assert values == []

    def test_output_generation(self, aws_setup, tmp_path, monkeypatch):
        """Test that all output files are generated correctly"""
        monkeypatch.chdir(tmp_path)

        analyzer = ContainerResourceAnalyzer()

        # Add some test findings
        analyzer.ecs_findings = [
            {
                "cluster_name": "test",
                "service_name": "test-service",
                "finding_type": "over_provisioning",
                "current_cpu": 4096,
                "current_memory": 8192,
                "recommended_cpu": 2048,
                "recommended_memory": 4096,
                "monthly_savings": 100.0,
            }
        ]

        analyzer.eks_findings = [
            {
                "cluster_name": "test-eks",
                "node_group": "test-group",
                "finding_type": "spot_instance_opportunity",
                "spot_savings_potential": 200.0,
            }
        ]

        analyzer.summary = {
            "total_ecs_services": 10,
            "total_eks_nodes": 5,
            "total_monthly_savings": 300.0,
            "services_requiring_attention": 2,
        }

        analyzer.utilization_data = {
            "ecs_cpu": [20, 30, 40],
            "ecs_memory": [25, 35, 45],
            "eks_cpu": [25, 35],
            "eks_memory": [30, 40],
        }

        # Generate outputs
        analyzer._generate_outputs()

        # Verify JSON output
        assert os.path.exists("container_optimization.json")
        with open("container_optimization.json", "r") as f:
            json_data = json.load(f)
            assert "ecs_findings" in json_data
            assert "eks_findings" in json_data
            assert "summary" in json_data
            assert json_data["summary"]["total_monthly_savings"] == 300.0

        # Verify CSV output
        assert os.path.exists("rightsizing_plan.csv")
        with open("rightsizing_plan.csv", "r") as f:
            csv_reader = csv.DictReader(f)
            rows = list(csv_reader)
            assert len(rows) > 0
            assert "Type" in rows[0]
            assert "Monthly_Savings" in rows[0]

        # Verify chart output
        assert os.path.exists("resource_utilization_trends.png")

    def test_empty_rightsizing_plan_still_writes_csv(self, tmp_path, monkeypatch):
        """Ensure CSV output is created even when no plans exist"""
        monkeypatch.chdir(tmp_path)

        analyzer = ContainerResourceAnalyzer()
        analyzer.ecs_findings = []
        analyzer.eks_findings = []

        analyzer._save_csv_output()

        csv_path = tmp_path / "rightsizing_plan.csv"
        assert csv_path.exists()
        with open(csv_path, "r", encoding="utf-8") as handle:
            header = handle.readline().strip()
            assert "Type" in header
            assert "Monthly_Savings" in header

    def test_cost_calculations(self):
        """Test cost calculation accuracy"""
        analyzer = ContainerResourceAnalyzer()

        # Test Fargate cost calculation
        task_def = {"requiresCompatibilities": ["FARGATE"]}
        cost = analyzer._calculate_ecs_cost(1024, 2048, task_def)  # 1 vCPU, 2GB RAM

        expected_vcpu_cost = 1 * 0.04048
        expected_memory_cost = 2 * 0.004445
        expected_total = expected_vcpu_cost + expected_memory_cost

        assert abs(cost - expected_total) < 0.001

        # Test EC2 cost calculation
        task_def = {"requiresCompatibilities": ["EC2"]}
        cost = analyzer._calculate_ecs_cost(1024, 2048, task_def)
        assert (
            cost == 0.096 / 8
        )  # EC2 instance cost divided by assumed tasks per instance

    def test_complete_analysis_flow(self, aws_setup, tmp_path, monkeypatch):
        """Test complete analysis workflow"""
        monkeypatch.chdir(tmp_path)

        analyzer = ContainerResourceAnalyzer()

        # Mock CloudWatch metrics
        with patch.object(analyzer, "_get_container_insights_metrics") as mock_insights:
            with patch.object(analyzer, "_get_cloudwatch_metrics") as mock_metrics:
                # Mock various metric responses
                mock_insights.return_value = [25.0] * 14  # Low utilization
                mock_metrics.return_value = [30.0] * 14

                # Run complete analysis
                analyzer.analyze()

                # Verify summary counts
                assert analyzer.summary["total_ecs_services"] > 0
                assert analyzer.summary["total_eks_nodes"] >= 0

                # Verify findings were generated
                assert len(analyzer.ecs_findings) > 0

                # Verify all output files exist
                assert os.path.exists("container_optimization.json")
                assert os.path.exists("rightsizing_plan.csv")
                assert os.path.exists("resource_utilization_trends.png")

    def test_csv_includes_all_ecs_finding_types(self, tmp_path, monkeypatch):
        """Test that CSV includes all ECS finding types"""
        monkeypatch.chdir(tmp_path)
        
        analyzer = ContainerResourceAnalyzer()
        # Add one of each ECS finding type
        analyzer.ecs_findings = [
            {"finding_type": "over_provisioning", "cluster_name": "test-cluster", "service_name": "test-service", "current_cpu": 4096, "current_memory": 8192, "recommended_cpu": 2048, "recommended_memory": 4096, "monthly_savings": 100.0},
            {"finding_type": "missing_auto_scaling", "cluster_name": "test-cluster", "service_name": "test-service2"},
            {"finding_type": "inefficient_task_placement", "cluster_name": "test-cluster", "service_name": "test-service3", "current_cpu": 256, "current_memory": 512, "monthly_savings": 50.0},
            {"finding_type": "singleton_ha_risk", "cluster_name": "test-cluster", "service_name": "test-service4", "desired_count": 1, "recommendation": "Increase desired count to 2+"},
            {"finding_type": "old_container_images", "cluster_name": "test-cluster", "service_name": "test-service5", "age_days": 120, "recommendation": "Update container images"},
            {"finding_type": "missing_health_checks", "cluster_name": "test-cluster", "service_name": "test-service6", "recommendation": "Configure health checks"},
            {"finding_type": "excessive_task_revisions", "cluster_name": "test-cluster", "service_name": "test-service7", "revision_count": 75, "recommendation": "Review deployment process"},
            {"finding_type": "missing_logging", "cluster_name": "test-cluster", "service_name": "test-service8", "containers": ["app", "sidecar"], "recommendation": "Configure logging"},
            {"finding_type": "missing_service_discovery", "cluster_name": "test-cluster", "service_name": "test-service9", "recommendation": "Enable service discovery"},
            {"finding_type": "cluster_overprovisioning", "cluster_name": "test-cluster", "cpu_utilization": 45.0, "memory_utilization": 50.0, "recommendation": "Reduce cluster capacity"},
        ]
        
        analyzer._save_csv_output()
        
        # Verify all finding types are in CSV
        with open(tmp_path / "rightsizing_plan.csv", "r") as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            assert len(rows) == 10
            
            actions = {row["Action"] for row in rows}
            assert "Resize Task Definition" in actions
            assert "Enable Auto Scaling" in actions
            assert "Migrate to EC2" in actions
            assert "Increase Desired Count" in actions
            assert "Update Container Images" in actions
            assert "Configure Health Checks" in actions
            assert "Review Deployment Process" in actions
            assert "Configure Logging" in actions
            assert "Enable Service Discovery" in actions
            assert "Reduce Cluster Capacity" in actions

    def test_csv_includes_all_eks_finding_types(self, tmp_path, monkeypatch):
        """Test that CSV includes all EKS finding types"""
        monkeypatch.chdir(tmp_path)
        
        analyzer = ContainerResourceAnalyzer()
        analyzer.eks_findings = [
            {"finding_type": "spot_instance_opportunity", "cluster_name": "test-eks", "node_group": "test-group", "spot_savings_potential": 200.0},
            {"finding_type": "underutilized_node", "cluster_name": "test-eks", "node_id": "i-1234567890", "current_utilization": {"cpu": 25.0, "memory": 35.0}, "recommended_changes": "Consolidate workloads", "recommendation": "Node underutilized"},
            {"finding_type": "missing_resource_limits", "cluster_name": "test-eks", "node_id": "i-0987654321", "pods_without_limits": 5, "recommendation": "Set resource limits"},
        ]
        
        analyzer._save_csv_output()
        
        # Verify all EKS finding types are in CSV
        with open(tmp_path / "rightsizing_plan.csv", "r") as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            assert len(rows) == 3
            
            actions = {row["Action"] for row in rows}
            assert "Enable Spot Instances" in actions
            assert "Consolidate Workloads" in actions
            assert "Set Pod Resource Limits" in actions

    def test_metadata_tracking(self):
        """Test that analysis metadata is properly tracked"""
        analyzer = ContainerResourceAnalyzer()
        
        # Verify initial state
        assert analyzer.analysis_metadata["clusters_analyzed"] == []
        assert analyzer.analysis_metadata["clusters_excluded"] == []
        assert analyzer.analysis_metadata["services_excluded"]["dev"] == 0
        assert analyzer.analysis_metadata["services_excluded"]["too_new"] == 0
        
        # Add a finding and verify tracking
        finding = {"finding_type": "over_provisioning", "cluster_name": "test", "service_name": "test-service"}
        analyzer._add_finding(finding, "ecs")
        
        assert len(analyzer.ecs_findings) == 1
        assert analyzer.analysis_metadata["finding_type_counts"]["over_provisioning"] == 1

    def test_json_output_includes_metadata(self, tmp_path, monkeypatch):
        """Test that JSON output includes metadata"""
        monkeypatch.chdir(tmp_path)
        
        analyzer = ContainerResourceAnalyzer()
        analyzer.analysis_metadata["clusters_analyzed"] = [{"name": "test-cluster", "type": "ECS"}]
        analyzer.analysis_metadata["clusters_excluded"] = [{"name": "excluded-cluster", "type": "ECS", "reason": "ExcludeFromAnalysis tag"}]
        analyzer.analysis_metadata["services_excluded"] = {"dev": 2, "too_new": 3}
        analyzer.analysis_metadata["finding_type_counts"] = {"over_provisioning": 1}
        
        analyzer._save_json_output()
        
        with open(tmp_path / "container_optimization.json", "r") as f:
            output = json.load(f)
            
            assert "metadata" in output
            assert output["metadata"]["clusters_analyzed"] == [{"name": "test-cluster", "type": "ECS"}]
            assert len(output["metadata"]["clusters_excluded"]) == 1
            assert output["metadata"]["services_excluded"]["dev"] == 2
            assert output["metadata"]["finding_type_counts"]["over_provisioning"] == 1

    def test_error_handling_in_ecs_analysis(self):
        """Test error handling in ECS cluster analysis"""
        analyzer = ContainerResourceAnalyzer()
        
        # Mock ecs_client to raise an error
        analyzer.ecs_client = MagicMock()
        analyzer.ecs_client.list_clusters.side_effect = ClientError(
            {"Error": {"Code": "AccessDenied"}}, "ListClusters"
        )
        
        # Should handle error gracefully without raising
        analyzer._analyze_ecs_clusters()
        
        # No findings should be created due to error
        assert len(analyzer.ecs_findings) == 0

    def test_error_handling_in_eks_analysis(self):
        """Test error handling in EKS cluster analysis"""
        analyzer = ContainerResourceAnalyzer()
        
        # Mock eks_client to raise an error
        analyzer.eks_client = MagicMock()
        analyzer.eks_client.list_clusters.side_effect = ClientError(
            {"Error": {"Code": "AccessDenied"}}, "ListClusters"
        )
        
        # Should handle error gracefully without raising
        analyzer._analyze_eks_clusters()
        
        # No findings should be created due to error
        assert len(analyzer.eks_findings) == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
