"""Unit tests for Parameter Stack"""
import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.parameter_stack import ParameterStack


@mark.describe("ParameterStack")
class TestParameterStack(unittest.TestCase):
    """Test cases for the ParameterStack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "test"
        self.stack = ParameterStack(
            self.app, "TestParameterStack",
            environment_suffix=self.env_suffix
        )
        self.template = Template.from_stack(self.stack)

    @mark.it("creates API key parameter in Parameter Store")
    def test_creates_api_key_parameter(self):
        """Test that API key parameter is created"""
        self.template.has_resource_properties("AWS::SSM::Parameter", {
            "Name": f"/webapp/{self.env_suffix.lower()}/api-key-primary-1",
            "Type": "String",
            "Description": f"API Key for web application - {self.env_suffix}"
        })

    @mark.it("creates database password parameter in Parameter Store")
    def test_creates_db_password_parameter(self):
        """Test that database password parameter is created"""
        self.template.has_resource_properties("AWS::SSM::Parameter", {
            "Name": f"/webapp/{self.env_suffix.lower()}/db-password-primary-1",
            "Type": "String",
            "Description": f"Database password for web application - {self.env_suffix}"
        })

    @mark.it("creates application config parameter in Parameter Store")
    def test_creates_app_config_parameter(self):
        """Test that application config parameter is created"""
        self.template.has_resource_properties("AWS::SSM::Parameter", {
            "Name": f"/webapp/{self.env_suffix.lower()}/app-config-primary-1",
            "Type": "String",
            "Description": f"Application configuration - {self.env_suffix}",
            "Value": '{"debug": false, "log_level": "info"}'
        })

    @mark.it("creates all required parameters")
    def test_creates_all_parameters(self):
        """Test that all three parameters are created"""
        # Should have exactly 3 SSM parameters
        self.template.resource_count_is("AWS::SSM::Parameter", 3)

    @mark.it("uses environment suffix in parameter names")
    def test_uses_environment_suffix(self):
        """Test that environment suffix is used in all parameter names"""
        parameters = self.template.find_resources("AWS::SSM::Parameter")
        for param_id, param in parameters.items():
            param_name = param["Properties"]["Name"]
            self.assertIn(self.env_suffix.lower(), param_name,
                         f"Parameter {param_name} should contain environment suffix")