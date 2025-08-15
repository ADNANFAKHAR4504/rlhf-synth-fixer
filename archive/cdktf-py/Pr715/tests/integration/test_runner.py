"""Integration test runner for TapStack."""
import os
import subprocess
import sys

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


def run_integration_tests():
  """Run integration tests with proper reporting."""
  print("=" * 60)
  print("INTEGRATION TESTS FOR TAPSTACK")
  print("=" * 60)
  
  # Test files to run in order
  test_files = [
    "test_tap_stack.py",
    "test_terraform_synthesis.py", 
    "test_security_validation.py",
    "test_network_flow.py",
    "test_deployment_scenarios.py",
    "test_end_to_end_scenarios.py"
  ]
  
  total_tests = 0
  total_passed = 0
  total_failed = 0
  
  for test_file in test_files:
    print(f"\nRunning {test_file}...")
    print("-" * 40)
    
    try:
      # Run pytest for the specific file
      result = subprocess.run([
        sys.executable, "-m", "pytest", 
        f"tests/integration/{test_file}",
        "-v", "--tb=short"
      ], capture_output=True, text=True, cwd=os.getcwd())
      
      # Parse results
      output_lines = result.stdout.split('\n')
      
      for line in output_lines:
        if "passed" in line and "failed" in line:
          # Parse the summary line
          if "passed" in line:
            try:
              parts = line.split()
              for i, part in enumerate(parts):
                if part == "passed,":
                  passed = int(parts[i-1])
                  total_passed += passed
                  total_tests += passed
                if part == "failed":
                  failed = int(parts[i-1])
                  total_failed += failed
                  total_tests += failed
            except (ValueError, IndexError):
              pass
        elif line.strip().endswith("passed"):
          # All tests passed
          try:
            passed = int(line.strip().split()[0])
            total_passed += passed
            total_tests += passed
          except (ValueError, IndexError):
            pass
      
      if result.returncode == 0:
        print(f"✅ {test_file} - All tests passed")
      else:
        print(f"❌ {test_file} - Some tests failed")
        print("Error output:")
        print(result.stdout)
        if result.stderr:
          print("Stderr:")
          print(result.stderr)
    
    except Exception as e:
      print(f"🔥 {test_file} - Error running tests: {e}")
      total_failed += 1
      total_tests += 1
  
  # Final summary
  print("\n" + "=" * 60)
  print("INTEGRATION TEST SUMMARY")
  print("=" * 60)
  print(f"Total Tests: {total_tests}")
  print(f"Passed: {total_passed}")
  print(f"Failed: {total_failed}")
  
  if total_failed == 0:
    print("🎉 All integration tests passed!")
    return 0
  else:
    success_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
    print(f"📊 Success Rate: {success_rate:.1f}%")
    return 1


if __name__ == "__main__":
  exit_code = run_integration_tests()
  sys.exit(exit_code)
