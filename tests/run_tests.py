#!/usr/bin/env python3
"""
Test runner for the infrastructure unit tests.
Runs all tests and generates coverage report.
"""

import os
import subprocess
import sys

import pytest

# Add the project root to the Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

def run_tests():
    """Run all unit tests with coverage."""
    print("🧪 Running Infrastructure Unit Tests")
    print("=" * 50)
    
    # Test directory
    test_dir = os.path.join(project_root, "tests", "unit")
    
    # Coverage configuration
    coverage_args = [
        "python", "-m", "pytest",
        test_dir,
        "-v",  # Verbose output
        "--tb=short",  # Short traceback format
        "--cov=lib.infrastructure",  # Coverage for infrastructure module
        "--cov-report=term-missing",  # Show missing lines
        "--cov-report=html:htmlcov",  # Generate HTML report
        "--cov-fail-under=80",  # Fail if coverage is below 80%
        "--junitxml=test-results.xml"  # Generate JUnit XML for CI
    ]
    
    try:
        # Run tests with coverage
        result = subprocess.run(coverage_args, cwd=project_root, check=True)
        print("\n✅ All tests passed!")
        print("📊 Coverage report generated in htmlcov/")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Tests failed with exit code {e.returncode}")
        return False
    except FileNotFoundError:
        print("❌ pytest or coverage not found. Please install with:")
        print("pip install pytest pytest-cov")
        return False

def run_specific_tests():
    """Run specific test modules."""
    test_modules = [
        "tests.unit.test_config",
        "tests.unit.test_storage", 
        "tests.unit.test_iam",
        "tests.unit.test_lambda_function",
        "tests.unit.test_lambda_code",
        "tests.unit.test_main"
    ]
    
    print("🧪 Running Specific Test Modules")
    print("=" * 50)
    
    for module in test_modules:
        print(f"\n📋 Running {module}...")
        try:
            result = subprocess.run([
                "python", "-m", "pytest", 
                f"{module}.py",
                "-v", "--tb=short"
            ], cwd=project_root, check=True)
            print(f"✅ {module} passed")
        except subprocess.CalledProcessError:
            print(f"❌ {module} failed")
            return False
    
    return True

if __name__ == "__main__":
    print("🚀 Infrastructure Test Suite")
    print("=" * 50)
    
    # Check if pytest is available
    try:
        import coverage
        import pytest
    except ImportError:
        print("❌ Required packages not found. Installing...")
        subprocess.run([sys.executable, "-m", "pip", "install", "pytest", "pytest-cov", "coverage"])
    
    # Run tests
    if len(sys.argv) > 1 and sys.argv[1] == "--specific":
        success = run_specific_tests()
    else:
        success = run_tests()
    
    if success:
        print("\n🎉 All tests completed successfully!")
        print("📈 Coverage target: 80%+")
        sys.exit(0)
    else:
        print("\n💥 Some tests failed!")
        sys.exit(1)
