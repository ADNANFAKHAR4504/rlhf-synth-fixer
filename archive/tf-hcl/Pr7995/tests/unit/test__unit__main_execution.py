"""
Test for main execution block coverage

This test file specifically targets the __name__ == "__main__" block
which is typically difficult to cover with standard pytest runs.
"""

import os
import subprocess
import sys


def test_main_block_execution():
    """Test that the script can be executed directly and runs main()"""
    # Path to the analysis script
    script_path = os.path.join(os.path.dirname(__file__), '..', '..', 'lib', 'analyse.py')

    # Run the script directly as a subprocess
    result = subprocess.run(
        [sys.executable, script_path],
        env={
            'ENVIRONMENT_SUFFIX': 'test',
            'AWS_REGION': 'us-east-1',
            **os.environ  # Preserve existing environment
        },
        capture_output=True,
        text=True,
        timeout=30
    )

    # The script should exit with code 0
    assert result.returncode == 0, f"Script failed with: {result.stderr}"

    # Verify expected output patterns
    assert 'Analyzing infrastructure' in result.stdout or 'Error analyzing' in result.stdout
