import unittest
from pytest import mark

import aws_cdk as cdk
from aws_cdk.assertions import Template

from lib.tap_stack import TapStack


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):

    def setUp(self):
        self.app = cdk.App()

    @mark.it("creates resources and exports outputs based on environment suffix")
    def test_outputs_include_expected_exports(self):
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", environment_suffix=env_suffix)
        template = Template.from_stack(stack)

        outputs = template.to_json().get("Outputs", {})
        export_names = [output.get("Export", {}).get("Name") for output in outputs.values()]
        export_names = [name for name in export_names if name]  # filter None

        # For example, expected export names derived dynamically or defined clearly
        expected_exports = [
            f"LogBucketName-{env_suffix}",
            f"ALBDNS-{env_suffix}",
            f"ASGName-{env_suffix}",
            f"VPCId-{env_suffix}",
            f"SecurityGroupId-{env_suffix}",
            f"EC2RoleName-{env_suffix}",
        ]

        for expected_export in expected_exports:
            self.assertIn(
                expected_export,
                export_names,
                f"Expected export '{expected_export}' not found in outputs"
            )

    @mark.it("defaults environment suffix to 'dev' and exports outputs")
    def test_outputs_with_default_env_suffix(self):
        stack = TapStack(self.app, "TapStackDefault")
        template = Template.from_stack(stack)

        outputs = template.to_json().get("Outputs", {})
        export_names = [output.get("Export", {}).get("Name") for output in outputs.values()]
        export_names = [name for name in export_names if name]

        expected_exports = [
            "LogBucketName-dev",
            "ALBDNS-dev",
            "ASGName-dev",
            "VPCId-dev",
            "SecurityGroupId-dev",
            "EC2RoleName-dev",
        ]

        for expected_export in expected_exports:
            self.assertIn(
                expected_export,
                export_names,
                f"Expected export '{expected_export}' not found in outputs"
            )


if __name__ == "__main__":
    unittest.main()
