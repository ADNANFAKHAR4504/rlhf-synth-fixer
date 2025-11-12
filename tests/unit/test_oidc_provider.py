"""Unit tests for OIDC Provider construct."""
import os
import sys
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# pylint: disable=wrong-import-position
from cdktf import App, TerraformStack, Testing
from lib.oidc_provider import OidcProvider


class TestOidcProvider:
    """Test suite for OIDC Provider construct."""

    def test_oidc_provider_creates_iam_oidc_provider(self):
        """OidcProvider creates IAM OIDC provider resource."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        oidc = OidcProvider(
            stack, "test_oidc",
            environment_suffix="test",
            cluster_oidc_issuer_url="https://oidc.eks.us-east-1.amazonaws.com/id/TEST123"
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        resources = output_json.get("resource", {})
        assert "aws_iam_openid_connect_provider" in resources

    def test_oidc_provider_uses_sts_client_id(self):
        """OidcProvider configures sts.amazonaws.com as client ID."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        oidc = OidcProvider(
            stack, "test_oidc",
            environment_suffix="test",
            cluster_oidc_issuer_url="https://oidc.eks.us-east-1.amazonaws.com/id/TEST123"
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        providers = output_json.get("resource", {}).get("aws_iam_openid_connect_provider", {})
        for provider_config in providers.values():
            client_id_list = provider_config.get("client_id_list", [])
            assert "sts.amazonaws.com" in client_id_list

    def test_oidc_provider_has_thumbprint(self):
        """OidcProvider includes EKS root CA thumbprint."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        oidc = OidcProvider(
            stack, "test_oidc",
            environment_suffix="test",
            cluster_oidc_issuer_url="https://oidc.eks.us-east-1.amazonaws.com/id/TEST123"
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        providers = output_json.get("resource", {}).get("aws_iam_openid_connect_provider", {})
        for provider_config in providers.values():
            thumbprint_list = provider_config.get("thumbprint_list", [])
            assert len(thumbprint_list) > 0
            assert "9e99a48a9960b14926bb7f3b02e22da2b0ab7280" in thumbprint_list

    def test_oidc_provider_url_format(self):
        """OidcProvider uses correct OIDC issuer URL."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        issuer_url = "https://oidc.eks.us-west-2.amazonaws.com/id/ABCD1234"
        oidc = OidcProvider(
            stack, "test_oidc",
            environment_suffix="test",
            cluster_oidc_issuer_url=issuer_url
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        providers = output_json.get("resource", {}).get("aws_iam_openid_connect_provider", {})
        for provider_config in providers.values():
            url = provider_config.get("url", "")
            assert url == issuer_url

    def test_oidc_provider_tags_include_environment(self):
        """OidcProvider tags include environment suffix."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        environment_suffix = "staging"
        oidc = OidcProvider(
            stack, "test_oidc",
            environment_suffix=environment_suffix,
            cluster_oidc_issuer_url="https://oidc.eks.us-east-1.amazonaws.com/id/TEST123"
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        providers = output_json.get("resource", {}).get("aws_iam_openid_connect_provider", {})
        for provider_config in providers.values():
            tags = provider_config.get("tags", {})
            assert tags.get("Environment") == environment_suffix

    def test_oidc_provider_exposes_arn(self):
        """OidcProvider exposes oidc_provider_arn property."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        oidc = OidcProvider(
            stack, "test_oidc",
            environment_suffix="test",
            cluster_oidc_issuer_url="https://oidc.eks.us-east-1.amazonaws.com/id/TEST123"
        )

        assert hasattr(oidc, "oidc_provider_arn")
        assert oidc.oidc_provider_arn is not None

    def test_oidc_provider_exposes_url(self):
        """OidcProvider exposes oidc_provider_url property."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        oidc = OidcProvider(
            stack, "test_oidc",
            environment_suffix="test",
            cluster_oidc_issuer_url="https://oidc.eks.us-east-1.amazonaws.com/id/TEST123"
        )

        assert hasattr(oidc, "oidc_provider_url")
        assert oidc.oidc_provider_url is not None

    def test_oidc_provider_name_includes_suffix(self):
        """OidcProvider name includes environment suffix."""
        app = App()
        stack = TerraformStack(app, "TestStack")
        environment_suffix = "prod"
        oidc = OidcProvider(
            stack, "test_oidc",
            environment_suffix=environment_suffix,
            cluster_oidc_issuer_url="https://oidc.eks.us-east-1.amazonaws.com/id/TEST123"
        )

        synth = Testing.synth(stack)
        output_json = json.loads(synth)

        providers = output_json.get("resource", {}).get("aws_iam_openid_connect_provider", {})
        for provider_config in providers.values():
            tags = provider_config.get("tags", {})
            name = tags.get("Name", "")
            assert environment_suffix in name
