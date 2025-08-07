"""Test runner for all TAP Stack unit tests."""
import os
import sys

import pytest

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(
    os.path.dirname(os.path.abspath(__file__)))))


def run_all_tests():
  """Run all unit tests for the TAP Stack."""
  # Test files to run
  test_files = [
      "test_tap_stack_comprehensive.py",
      "test_vpc_networking.py",
      "test_security_groups.py",
      "test_iam_resources.py",
      "test_load_balancer.py",
      "test_autoscaling_launch_template.py",
      "test_state_management.py",
      "test_edge_cases_errors.py",
      "test_configuration_scenarios.py"
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


def run_specific_test_suite(suite_name):
  """Run a specific test suite."""
  test_dir = os.path.dirname(os.path.abspath(__file__))

  suite_mapping = {
      "comprehensive": "test_tap_stack_comprehensive.py",
      "vpc": "test_vpc_networking.py",
      "security": "test_security_groups.py",
      "iam": "test_iam_resources.py",
      "loadbalancer": "test_load_balancer.py",
      "autoscaling": "test_autoscaling_launch_template.py",
      "state": "test_state_management.py",
      "errors": "test_edge_cases_errors.py",
      "config": "test_configuration_scenarios.py"
  }

  if suite_name not in suite_mapping:
    print(f"Unknown test suite: {suite_name}")
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


def run_tests_with_coverage():
  """Run all tests with coverage reporting."""
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


if __name__ == "__main__":
  import argparse

  parser = argparse.ArgumentParser(description="Run TAP Stack unit tests")
  parser.add_argument(
      "--suite",
      help="Run specific test suite",
      choices=["comprehensive", "vpc", "security", "iam", "loadbalancer",
               "autoscaling", "state", "errors", "config"]
  )
  parser.add_argument(
      "--coverage",
      action="store_true",
      help="Run tests with coverage reporting"
  )

  args = parser.parse_args()

  if args.coverage:
    exit_code = run_tests_with_coverage()
  elif args.suite:
    exit_code = run_specific_test_suite(args.suite)
  else:
    exit_code = run_all_tests()

  sys.exit(exit_code)
