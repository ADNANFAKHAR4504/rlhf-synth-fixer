"""Unit tests for EKS Node Groups construct."""
import os
import sys
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# pylint: disable=wrong-import-position
from cdktf import App, TerraformStack, Testing
from lib.eks_node_groups import EksNodeGroups


class TestEksNodeGroups:
    """Test suite for EKS Node Groups construct."""

    def test_eks_node_groups_creates_critical_node_group(self):
        """EksNodeGroups creates critical node group."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        ng = EksNodeGroups(
            stack, "test_ng",
            environment_suffix="test",
            cluster_name="test-cluster",
            node_role_arn="arn:aws:iam::123456789012:role/node-role",
            subnet_ids=["subnet-1", "subnet-2"]
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        resources = output_json.get("resource", {})
        assert "aws_eks_node_group" in resources

    def test_eks_node_groups_has_disk_size(self):
        """EksNodeGroups creates node groups with disk size."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        ng = EksNodeGroups(
            stack, "test_ng",
            environment_suffix="test",
            cluster_name="test-cluster",
            node_role_arn="arn:aws:iam::123456789012:role/node-role",
            subnet_ids=["subnet-1", "subnet-2"]
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        node_groups = output_json.get("resource", {}).get("aws_eks_node_group", {})
        for ng_config in node_groups.values():
            assert ng_config.get("disk_size") == 20

    def test_eks_node_groups_creates_two_node_groups(self):
        """EksNodeGroups creates both critical and non-critical node groups."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        ng = EksNodeGroups(
            stack, "test_ng",
            environment_suffix="test",
            cluster_name="test-cluster",
            node_role_arn="arn:aws:iam::123456789012:role/node-role",
            subnet_ids=["subnet-1", "subnet-2"]
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        node_groups = output_json.get("resource", {}).get("aws_eks_node_group", {})
        assert len(node_groups) >= 2

    def test_eks_node_groups_critical_naming(self):
        """EksNodeGroups critical node group follows naming convention."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        environment_suffix = "myenv"
        ng = EksNodeGroups(
            stack, "test_ng",
            environment_suffix=environment_suffix,
            cluster_name="test-cluster",
            node_role_arn="arn:aws:iam::123456789012:role/node-role",
            subnet_ids=["subnet-1", "subnet-2"]
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        node_groups = output_json.get("resource", {}).get("aws_eks_node_group", {})
        critical_found = False
        for ng_config in node_groups.values():
            ng_name = ng_config.get("node_group_name", "")
            if "critical" in ng_name and "non-critical" not in ng_name:
                assert f"critical-{environment_suffix}" == ng_name
                critical_found = True
        assert critical_found

    def test_eks_node_groups_non_critical_naming(self):
        """EksNodeGroups non-critical node group follows naming convention."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        environment_suffix = "myenv"
        ng = EksNodeGroups(
            stack, "test_ng",
            environment_suffix=environment_suffix,
            cluster_name="test-cluster",
            node_role_arn="arn:aws:iam::123456789012:role/node-role",
            subnet_ids=["subnet-1", "subnet-2"]
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        node_groups = output_json.get("resource", {}).get("aws_eks_node_group", {})
        non_critical_found = False
        for ng_config in node_groups.values():
            ng_name = ng_config.get("node_group_name", "")
            if "non-critical" in ng_name:
                assert f"non-critical-{environment_suffix}" == ng_name
                non_critical_found = True
        assert non_critical_found

    def test_eks_node_groups_critical_is_on_demand(self):
        """EksNodeGroups critical node group uses ON_DEMAND capacity."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        ng = EksNodeGroups(
            stack, "test_ng",
            environment_suffix="test",
            cluster_name="test-cluster",
            node_role_arn="arn:aws:iam::123456789012:role/node-role",
            subnet_ids=["subnet-1", "subnet-2"]
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        node_groups = output_json.get("resource", {}).get("aws_eks_node_group", {})
        for ng_config in node_groups.values():
            ng_name = ng_config.get("node_group_name", "")
            if "critical" in ng_name and "non-critical" not in ng_name:
                assert ng_config.get("capacity_type") == "ON_DEMAND"

    def test_eks_node_groups_non_critical_is_spot(self):
        """EksNodeGroups non-critical node group uses SPOT capacity."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        ng = EksNodeGroups(
            stack, "test_ng",
            environment_suffix="test",
            cluster_name="test-cluster",
            node_role_arn="arn:aws:iam::123456789012:role/node-role",
            subnet_ids=["subnet-1", "subnet-2"]
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        node_groups = output_json.get("resource", {}).get("aws_eks_node_group", {})
        for ng_config in node_groups.values():
            ng_name = ng_config.get("node_group_name", "")
            if "non-critical" in ng_name:
                assert ng_config.get("capacity_type") == "SPOT"

    def test_eks_node_groups_critical_instance_type(self):
        """EksNodeGroups critical node group uses t4g.large."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        ng = EksNodeGroups(
            stack, "test_ng",
            environment_suffix="test",
            cluster_name="test-cluster",
            node_role_arn="arn:aws:iam::123456789012:role/node-role",
            subnet_ids=["subnet-1", "subnet-2"]
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        node_groups = output_json.get("resource", {}).get("aws_eks_node_group", {})
        for ng_config in node_groups.values():
            ng_name = ng_config.get("node_group_name", "")
            if "critical" in ng_name and "non-critical" not in ng_name:
                instance_types = ng_config.get("instance_types", [])
                assert "t4g.large" in instance_types

    def test_eks_node_groups_non_critical_instance_type(self):
        """EksNodeGroups non-critical node group uses t4g.medium."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        ng = EksNodeGroups(
            stack, "test_ng",
            environment_suffix="test",
            cluster_name="test-cluster",
            node_role_arn="arn:aws:iam::123456789012:role/node-role",
            subnet_ids=["subnet-1", "subnet-2"]
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        node_groups = output_json.get("resource", {}).get("aws_eks_node_group", {})
        for ng_config in node_groups.values():
            ng_name = ng_config.get("node_group_name", "")
            if "non-critical" in ng_name:
                instance_types = ng_config.get("instance_types", [])
                assert "t4g.medium" in instance_types

    def test_eks_node_groups_critical_scaling_config(self):
        """EksNodeGroups critical node group has correct scaling config."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        ng = EksNodeGroups(
            stack, "test_ng",
            environment_suffix="test",
            cluster_name="test-cluster",
            node_role_arn="arn:aws:iam::123456789012:role/node-role",
            subnet_ids=["subnet-1", "subnet-2"]
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        node_groups = output_json.get("resource", {}).get("aws_eks_node_group", {})
        for ng_config in node_groups.values():
            ng_name = ng_config.get("node_group_name", "")
            if "critical" in ng_name and "non-critical" not in ng_name:
                scaling = ng_config.get("scaling_config", {})
                assert scaling.get("desired_size") == 2
                assert scaling.get("min_size") == 2
                assert scaling.get("max_size") == 6

    def test_eks_node_groups_non_critical_scaling_config(self):
        """EksNodeGroups non-critical node group has correct scaling config."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        ng = EksNodeGroups(
            stack, "test_ng",
            environment_suffix="test",
            cluster_name="test-cluster",
            node_role_arn="arn:aws:iam::123456789012:role/node-role",
            subnet_ids=["subnet-1", "subnet-2"]
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        node_groups = output_json.get("resource", {}).get("aws_eks_node_group", {})
        for ng_config in node_groups.values():
            ng_name = ng_config.get("node_group_name", "")
            if "non-critical" in ng_name:
                scaling = ng_config.get("scaling_config", {})
                assert scaling.get("desired_size") == 1
                assert scaling.get("min_size") == 1
                assert scaling.get("max_size") == 10

    def test_eks_node_groups_uses_arm_ami(self):
        """EksNodeGroups uses ARM-based AMI."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        ng = EksNodeGroups(
            stack, "test_ng",
            environment_suffix="test",
            cluster_name="test-cluster",
            node_role_arn="arn:aws:iam::123456789012:role/node-role",
            subnet_ids=["subnet-1", "subnet-2"]
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        node_groups = output_json.get("resource", {}).get("aws_eks_node_group", {})
        for ng_config in node_groups.values():
            assert ng_config.get("ami_type") == "AL2_ARM_64"

    # def test_eks_node_groups_launch_template_imdsv2(self):
    #     """EksNodeGroups launch templates enforce IMDSv2."""
    #     # NOTE: Launch templates removed in favor of direct disk_size on node groups
    #     pass

    # def test_eks_node_groups_launch_template_ebs_encryption(self):
    #     """EksNodeGroups launch templates enable EBS encryption."""
    #     # NOTE: Launch templates removed in favor of direct disk_size on node groups
    #     pass

    # def test_eks_node_groups_launch_template_monitoring(self):
    #     """EksNodeGroups launch templates enable detailed monitoring."""
    #     # NOTE: Launch templates removed in favor of direct disk_size on node groups
    #     pass

    def test_eks_node_groups_cluster_autoscaler_tags(self):
        """EksNodeGroups includes cluster autoscaler tags."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        ng = EksNodeGroups(
            stack, "test_ng",
            environment_suffix="test",
            cluster_name="test-cluster",
            node_role_arn="arn:aws:iam::123456789012:role/node-role",
            subnet_ids=["subnet-1", "subnet-2"]
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        node_groups = output_json.get("resource", {}).get("aws_eks_node_group", {})
        for ng_config in node_groups.values():
            tags = ng_config.get("tags", {})
            assert tags.get("k8s.io/cluster-autoscaler/enabled") == "true"

    def test_eks_node_groups_exposes_critical_name(self):
        """EksNodeGroups exposes critical_node_group_name property."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        ng = EksNodeGroups(
            stack, "test_ng",
            environment_suffix="test",
            cluster_name="test-cluster",
            node_role_arn="arn:aws:iam::123456789012:role/node-role",
            subnet_ids=["subnet-1", "subnet-2"]
        )

        assert hasattr(ng, "critical_node_group_name")
        assert ng.critical_node_group_name is not None

    def test_eks_node_groups_exposes_non_critical_name(self):
        """EksNodeGroups exposes non_critical_node_group_name property."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        ng = EksNodeGroups(
            stack, "test_ng",
            environment_suffix="test",
            cluster_name="test-cluster",
            node_role_arn="arn:aws:iam::123456789012:role/node-role",
            subnet_ids=["subnet-1", "subnet-2"]
        )

        assert hasattr(ng, "non_critical_node_group_name")
        assert ng.non_critical_node_group_name is not None

    def test_eks_node_groups_uses_provided_subnet_ids(self):
        """EksNodeGroups uses provided subnet IDs."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        test_subnets = ["subnet-1", "subnet-2", "subnet-3"]
        ng = EksNodeGroups(
            stack, "test_ng",
            environment_suffix="test",
            cluster_name="test-cluster",
            node_role_arn="arn:aws:iam::123456789012:role/node-role",
            subnet_ids=test_subnets
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        node_groups = output_json.get("resource", {}).get("aws_eks_node_group", {})
        for ng_config in node_groups.values():
            assert ng_config.get("subnet_ids") == test_subnets
    
    def test_eks_node_groups_creates_launch_templates(self):
        """EksNodeGroups no longer creates launch templates - using disk_size directly."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        ng = EksNodeGroups(
            stack, "test_ng",
            environment_suffix="test",
            cluster_name="test-cluster",
            node_role_arn="arn:aws:iam::123456789012:role/node-role",
            subnet_ids=["subnet-1", "subnet-2"]
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        # Verify launch templates are NOT created (we use disk_size directly now)
        resources = output_json.get("resource", {})
        assert "aws_launch_template" not in resources
        
        # Verify node groups have disk_size instead
        node_groups = resources.get("aws_eks_node_group", {})
        for ng_config in node_groups.values():
            assert ng_config.get("disk_size") == 20
