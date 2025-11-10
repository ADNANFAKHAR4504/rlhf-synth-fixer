"""
Integration-level checks for the TapStack configuration helpers.
These tests ensure we produce safe resource names and tag structures
derived from the logic implemented under lib/tap_stack.py.
"""

import unittest

from lib.tap_stack import (
    TapStackArgs,
    build_resource_name,
    merge_tags,
    sanitize_suffix,
)


class TestTapStackConfigHelpers(unittest.TestCase):
    """Validate helper functions that feed the Pulumi TapStack."""

    def test_sanitize_suffix_handles_whitespace_and_symbols(self):
        raw_suffix = "  PR_6148!! "
        self.assertEqual(sanitize_suffix(raw_suffix), "pr-6148")

    def test_sanitize_suffix_defaults_to_dev(self):
        self.assertEqual(sanitize_suffix(""), "dev")
        self.assertEqual(sanitize_suffix(None), "dev")

    def test_build_resource_name_combines_base_and_suffix(self):
        resource_name = build_resource_name("tap-bucket", "Staging-Env")
        self.assertEqual(resource_name, "tap-bucket-staging-env")

    def test_merge_tags_prioritizes_custom_over_defaults(self):
        merged = merge_tags(
            {"ManagedBy": "pulumi", "EnvironmentSuffix": "dev"},
            {"EnvironmentSuffix": "prod", "Service": "payments"},
        )
        self.assertEqual(
            merged,
            {
                "ManagedBy": "pulumi",
                "EnvironmentSuffix": "prod",
                "Service": "payments",
            },
        )

    def test_tap_stack_args_normalizes_suffix_and_stores_tags(self):
        args = TapStackArgs(environment_suffix=" PROD___$$ ", tags={"Owner": "infra"})
        self.assertEqual(args.environment_suffix, "prod")
        self.assertEqual(args.tags, {"Owner": "infra"})


if __name__ == "__main__":
    unittest.main()
