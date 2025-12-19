"""Unit tests for EKS Addons construct."""
import os
import sys
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# pylint: disable=wrong-import-position
from cdktf import App, TerraformStack, Testing
from lib.eks_addons import EksAddons


class TestEksAddons:
    """Test suite for EKS Addons construct."""

    def test_eks_addons_creates_vpc_cni(self):
        """EksAddons creates VPC CNI addon."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        addons = EksAddons(stack, "test_addons", cluster_name="test-cluster")

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        resources = output_json.get("resource", {})
        assert "aws_eks_addon" in resources

    def test_eks_addons_creates_coredns(self):
        """EksAddons creates CoreDNS addon."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        addons = EksAddons(stack, "test_addons", cluster_name="test-cluster")

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        eks_addons = output_json.get("resource", {}).get("aws_eks_addon", {})
        coredns_found = False
        for addon_config in eks_addons.values():
            if addon_config.get("addon_name") == "coredns":
                coredns_found = True
        assert coredns_found

    def test_eks_addons_creates_kube_proxy(self):
        """EksAddons creates kube-proxy addon."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        addons = EksAddons(stack, "test_addons", cluster_name="test-cluster")

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        eks_addons = output_json.get("resource", {}).get("aws_eks_addon", {})
        kube_proxy_found = False
        for addon_config in eks_addons.values():
            if addon_config.get("addon_name") == "kube-proxy":
                kube_proxy_found = True
        assert kube_proxy_found

    def test_eks_addons_creates_all_three_addons(self):
        """EksAddons creates all three required addons."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        addons = EksAddons(stack, "test_addons", cluster_name="test-cluster")

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        eks_addons = output_json.get("resource", {}).get("aws_eks_addon", {})
        assert len(eks_addons) >= 3

        addon_names = [addon.get("addon_name") for addon in eks_addons.values()]
        assert "vpc-cni" in addon_names
        assert "coredns" in addon_names
        assert "kube-proxy" in addon_names

    def test_eks_addons_vpc_cni_version(self):
        """EksAddons VPC CNI has correct version."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        addons = EksAddons(stack, "test_addons", cluster_name="test-cluster")

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        eks_addons = output_json.get("resource", {}).get("aws_eks_addon", {})
        for addon_config in eks_addons.values():
            if addon_config.get("addon_name") == "vpc-cni":
                version = addon_config.get("addon_version", "")
                assert "v1.20" in version

    def test_eks_addons_coredns_version(self):
        """EksAddons CoreDNS has correct version."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        addons = EksAddons(stack, "test_addons", cluster_name="test-cluster")

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        eks_addons = output_json.get("resource", {}).get("aws_eks_addon", {})
        for addon_config in eks_addons.values():
            if addon_config.get("addon_name") == "coredns":
                version = addon_config.get("addon_version", "")
                assert "v1.11" in version

    def test_eks_addons_kube_proxy_version(self):
        """EksAddons kube-proxy has correct version."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        addons = EksAddons(stack, "test_addons", cluster_name="test-cluster")

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        eks_addons = output_json.get("resource", {}).get("aws_eks_addon", {})
        for addon_config in eks_addons.values():
            if addon_config.get("addon_name") == "kube-proxy":
                version = addon_config.get("addon_version", "")
                assert "v1.29" in version

    def test_eks_addons_resolve_conflicts_on_create(self):
        """EksAddons sets resolve_conflicts_on_create to OVERWRITE."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        addons = EksAddons(stack, "test_addons", cluster_name="test-cluster")

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        eks_addons = output_json.get("resource", {}).get("aws_eks_addon", {})
        for addon_config in eks_addons.values():
            assert addon_config.get("resolve_conflicts_on_create") == "OVERWRITE"

    def test_eks_addons_resolve_conflicts_on_update(self):
        """EksAddons sets resolve_conflicts_on_update to PRESERVE."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        addons = EksAddons(stack, "test_addons", cluster_name="test-cluster")

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        eks_addons = output_json.get("resource", {}).get("aws_eks_addon", {})
        for addon_config in eks_addons.values():
            assert addon_config.get("resolve_conflicts_on_update") == "PRESERVE"

    def test_eks_addons_tags_include_managed_by(self):
        """EksAddons tags include ManagedBy."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        addons = EksAddons(stack, "test_addons", cluster_name="test-cluster")

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        eks_addons = output_json.get("resource", {}).get("aws_eks_addon", {})
        for addon_config in eks_addons.values():
            tags = addon_config.get("tags", {})
            assert tags.get("ManagedBy") == "CDKTF"

    def test_eks_addons_uses_cluster_name(self):
        """EksAddons uses provided cluster name."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        cluster_name = "my-test-cluster"
        addons = EksAddons(stack, "test_addons", cluster_name=cluster_name)

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        eks_addons = output_json.get("resource", {}).get("aws_eks_addon", {})
        for addon_config in eks_addons.values():
            assert addon_config.get("cluster_name") == cluster_name

    def test_eks_addons_has_vpc_cni_property(self):
        """EksAddons exposes vpc_cni property."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        addons = EksAddons(stack, "test_addons", cluster_name="test-cluster")

        assert hasattr(addons, "vpc_cni")
        assert addons.vpc_cni is not None

    def test_eks_addons_has_coredns_property(self):
        """EksAddons exposes coredns property."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        addons = EksAddons(stack, "test_addons", cluster_name="test-cluster")

        assert hasattr(addons, "coredns")
        assert addons.coredns is not None

    def test_eks_addons_has_kube_proxy_property(self):
        """EksAddons exposes kube_proxy property."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        addons = EksAddons(stack, "test_addons", cluster_name="test-cluster")

        assert hasattr(addons, "kube_proxy")
        assert addons.kube_proxy is not None
