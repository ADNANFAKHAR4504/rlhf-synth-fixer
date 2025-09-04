"""Test runner for all TAP Stack integration tests."""
import os
import sys

import pytest

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(
    os.path.dirname(os.path.abspath(__file__)))))


def run_all_integration_tests():
  """Run all integration tests for the TAP Stack."""
  # Integration test files to run
  test_files = [
      "test_tap_stack.py",  # Original integration test
      "test_terraform_synthesis.py",
      "test_network_flow.py",
      "test_security_validation.py",
      "test_deployment_scenarios.py",
      "test_end_to_end_scenarios.py"
  ]

  # Get the directory containing this file
  test_dir = os.path.dirname(os.path.abspath(__file__))

  # Build full paths to test files
  test_paths = [os.path.join(test_dir, test_file) for test_file in test_files]

  # Run pytest with verbose output
  exit_code = pytest.main([
      "-v",
      "--tb=short",
      "--strict-markers",
      "--disable-warnings",
      *test_paths
  ])

  return exit_code


def run_specific_integration_suite(suite_name):
  """Run a specific integration test suite."""
  test_dir = os.path.dirname(os.path.abspath(__file__))

  suite_mapping = {
      "original": "test_tap_stack.py",
      "synthesis": "test_terraform_synthesis.py",
      "network": "test_network_flow.py",
      "security": "test_security_validation.py",
      "deployment": "test_deployment_scenarios.py",
      "e2e": "test_end_to_end_scenarios.py"
  }

  if suite_name not in suite_mapping:
    print(f"Unknown integration test suite: {suite_name}")
    print(f"Available suites: {', '.join(suite_mapping.keys())}")
    return 1

  test_file = os.path.join(test_dir, suite_mapping[suite_name])

  exit_code = pytest.main([
      "-v",
      "--tb=short",
      "--strict-markers",
      "--disable-warnings",
      test_file
  ])

  return exit_code


def run_integration_tests_with_coverage():
  """Run all integration tests with coverage reporting."""
  test_dir = os.path.dirname(os.path.abspath(__file__))
  project_root = os.path.dirname(os.path.dirname(test_dir))

  exit_code = pytest.main([
      "-v",
      "--tb=short",
      "--strict-markers",
      "--disable-warnings",
      f"--cov={os.path.join(project_root, 'lib')}",
      "--cov-report=term-missing",
      "--cov-report=html",
      test_dir
  ])

  return exit_code


def run_smoke_tests():
  """Run smoke tests for quick validation."""
  test_dir = os.path.dirname(os.path.abspath(__file__))

  # Run only basic synthesis tests for quick feedback
  smoke_tests = [
      os.path.join(test_dir, "test_tap_stack.py"),
      os.path.join(
          test_dir, "test_terraform_synthesis.py::TestTerraformSynthesis::test_complete_terraform_configuration_synthesis")
  ]

  exit_code = pytest.main([
      "-v",
      "--tb=short",
      "--strict-markers",
      "--disable-warnings",
      *smoke_tests
  ])

  return exit_code


if __name__ == "__main__":
  import argparse

  parser = argparse.ArgumentParser(
      description="Run TAP Stack integration tests")
  parser.add_argument(
      "--suite",
      help="Run specific integration test suite",
      choices=["original", "synthesis", "network",
               "security", "deployment", "e2e"]
  )
  parser.add_argument(
      "--coverage",
      action="store_true",
      help="Run tests with coverage reporting"
  )
  parser.add_argument(
      "--smoke",
      action="store_true",
      help="Run smoke tests for quick validation"
  )

  args = parser.parse_args()

  if args.smoke:
    exit_code = run_smoke_tests()
  elif args.coverage:
    exit_code = run_integration_tests_with_coverage()
  elif args.suite:
    exit_code = run_specific_integration_suite(args.suite)
  else:
    exit_code = run_all_integration_tests()

  sys.exit(exit_code)
