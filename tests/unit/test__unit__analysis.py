#!/usr/bin/env python3
"""
Tests for Container Resource Optimization Analyzer
Uses moto to mock AWS services and create realistic test scenarios
"""

import csv
import json
import os
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

import boto3
import pytest
from moto import mock_aws

from lib.analyse import ContainerResourceAnalyzer


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
                    ]
                }

                analyzer._analyze_ecs_services("production-cluster", {})

                # Only non-dev service should be counted
                assert analyzer.summary["total_ecs_services"] == 1

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


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
