"""Unit tests for IAM Roles construct."""
import os
import sys
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# pylint: disable=wrong-import-position
from cdktf import App, TerraformStack, Testing
from lib.iam_roles import IamRoles


class TestIamRoles:
    """Test suite for IAM Roles construct."""

    def test_iam_roles_creates_cluster_role(self):
        """IamRoles creates EKS cluster IAM role."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        iam = IamRoles(stack, "test_iam", environment_suffix="test")

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        resources = output_json.get("resource", {})
        assert "aws_iam_role" in resources

    def test_iam_roles_creates_node_role(self):
        """IamRoles creates EKS node IAM role."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        iam = IamRoles(stack, "test_iam", environment_suffix="test")

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        iam_roles = output_json.get("resource", {}).get("aws_iam_role", {})
        # Should have at least 2 roles (cluster and node)
        assert len(iam_roles) >= 2

    def test_iam_roles_cluster_role_naming(self):
        """IamRoles cluster role follows naming convention."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        environment_suffix = "mytest"
        iam = IamRoles(stack, "test_iam", environment_suffix=environment_suffix)

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        iam_roles = output_json.get("resource", {}).get("aws_iam_role", {})
        cluster_role_found = False
        for role_config in iam_roles.values():
            role_name = role_config.get("name", "")
            if "cluster-role" in role_name:
                assert f"eks-cluster-role-{environment_suffix}" == role_name
                cluster_role_found = True
                break
        assert cluster_role_found

    def test_iam_roles_node_role_naming(self):
        """IamRoles node role follows naming convention."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        environment_suffix = "mytest"
        iam = IamRoles(stack, "test_iam", environment_suffix=environment_suffix)

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        iam_roles = output_json.get("resource", {}).get("aws_iam_role", {})
        node_role_found = False
        for role_config in iam_roles.values():
            role_name = role_config.get("name", "")
            if "node-role" in role_name:
                assert f"eks-node-role-{environment_suffix}" == role_name
                node_role_found = True
                break
        assert node_role_found

    def test_iam_roles_cluster_assume_role_policy(self):
        """IamRoles cluster role has correct assume role policy."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        iam = IamRoles(stack, "test_iam", environment_suffix="test")

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        iam_roles = output_json.get("resource", {}).get("aws_iam_role", {})
        for role_config in iam_roles.values():
            role_name = role_config.get("name", "")
            if "cluster-role" in role_name:
                policy = json.loads(role_config.get("assume_role_policy", "{}"))
                statement = policy.get("Statement", [{}])[0]
                assert statement.get("Effect") == "Allow"
                assert statement.get("Principal", {}).get("Service") == "eks.amazonaws.com"
                assert statement.get("Action") == "sts:AssumeRole"

    def test_iam_roles_node_assume_role_policy(self):
        """IamRoles node role has correct assume role policy."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        iam = IamRoles(stack, "test_iam", environment_suffix="test")

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        iam_roles = output_json.get("resource", {}).get("aws_iam_role", {})
        for role_config in iam_roles.values():
            role_name = role_config.get("name", "")
            if "node-role" in role_name:
                policy = json.loads(role_config.get("assume_role_policy", "{}"))
                statement = policy.get("Statement", [{}])[0]
                assert statement.get("Effect") == "Allow"
                assert statement.get("Principal", {}).get("Service") == "ec2.amazonaws.com"
                assert statement.get("Action") == "sts:AssumeRole"

    def test_iam_roles_attaches_cluster_policies(self):
        """IamRoles attaches required policies to cluster role."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        iam = IamRoles(stack, "test_iam", environment_suffix="test")

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        attachments = output_json.get("resource", {}).get("aws_iam_role_policy_attachment", {})
        policy_arns = [att.get("policy_arn", "") for att in attachments.values()]

        assert "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy" in policy_arns
        assert "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController" in policy_arns

    def test_iam_roles_attaches_node_policies(self):
        """IamRoles attaches required policies to node role."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        iam = IamRoles(stack, "test_iam", environment_suffix="test")

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        attachments = output_json.get("resource", {}).get("aws_iam_role_policy_attachment", {})
        policy_arns = [att.get("policy_arn", "") for att in attachments.values()]

        assert "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy" in policy_arns
        assert "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy" in policy_arns
        assert "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly" in policy_arns

    def test_iam_roles_creates_autoscaler_policy(self):
        """IamRoles creates custom autoscaler policy."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        iam = IamRoles(stack, "test_iam", environment_suffix="test")

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        policies = output_json.get("resource", {}).get("aws_iam_policy", {})
        assert len(policies) > 0

        # Verify autoscaler policy exists
        autoscaler_found = False
        for policy_config in policies.values():
            policy_name = policy_config.get("name", "")
            if "autoscaler" in policy_name:
                autoscaler_found = True
                policy_doc = json.loads(policy_config.get("policy", "{}"))
                statements = policy_doc.get("Statement", [])
                assert len(statements) >= 2
        assert autoscaler_found

    def test_iam_roles_autoscaler_policy_permissions(self):
        """IamRoles autoscaler policy has required permissions."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        iam = IamRoles(stack, "test_iam", environment_suffix="test")

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        policies = output_json.get("resource", {}).get("aws_iam_policy", {})
        for policy_config in policies.values():
            policy_name = policy_config.get("name", "")
            if "autoscaler" in policy_name:
                policy_doc = json.loads(policy_config.get("policy", "{}"))
                all_actions = []
                for statement in policy_doc.get("Statement", []):
                    all_actions.extend(statement.get("Action", []))

                assert "autoscaling:DescribeAutoScalingGroups" in all_actions
                assert "autoscaling:SetDesiredCapacity" in all_actions
                assert "ec2:DescribeInstanceTypes" in all_actions

    def test_iam_roles_exposes_cluster_role_arn(self):
        """IamRoles exposes cluster_role_arn property."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        iam = IamRoles(stack, "test_iam", environment_suffix="test")

        assert hasattr(iam, "cluster_role_arn")
        assert iam.cluster_role_arn is not None

    def test_iam_roles_exposes_node_role_arn(self):
        """IamRoles exposes node_role_arn property."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        iam = IamRoles(stack, "test_iam", environment_suffix="test")

        assert hasattr(iam, "node_role_arn")
        assert iam.node_role_arn is not None

    def test_iam_roles_tags_include_environment(self):
        """IamRoles tags include environment suffix."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        environment_suffix = "staging"
        iam = IamRoles(stack, "test_iam", environment_suffix=environment_suffix)

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        iam_roles = output_json.get("resource", {}).get("aws_iam_role", {})
        for role_config in iam_roles.values():
            tags = role_config.get("tags", {})
            assert tags.get("Environment") == environment_suffix
