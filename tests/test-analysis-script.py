#!/usr/bin/env python3
"""
Tests for Infrastructure Analysis Script
Validates that the analysis script exists, is executable, and follows the expected structure
"""

import os
import sys
import pytest
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))


class TestAnalysisScriptStructure:
    """Tests for analysis script file structure and imports"""

    def test_analysis_script_exists(self):
        """Test that lib/analyse.py exists"""
        analysis_script = project_root / "lib" / "analyse.py"
        assert analysis_script.exists(), "lib/analyse.py file not found"
        assert analysis_script.is_file(), "lib/analyse.py is not a file"

    def test_analysis_script_is_executable(self):
        """Test that lib/analyse.py has executable permissions"""
        analysis_script = project_root / "lib" / "analyse.py"
        assert os.access(analysis_script, os.X_OK), "lib/analyse.py is not executable"

    def test_analysis_script_has_shebang(self):
        """Test that lib/analyse.py has correct shebang"""
        analysis_script = project_root / "lib" / "analyse.py"
        with open(analysis_script, 'r') as f:
            first_line = f.readline().strip()

        assert first_line.startswith('#!'), "Script missing shebang"
        assert 'python' in first_line.lower(), "Shebang doesn't reference python"

    def test_analysis_script_imports_boto3(self):
        """Test that lib/analyse.py imports boto3"""
        analysis_script = project_root / "lib" / "analyse.py"
        with open(analysis_script, 'r') as f:
            content = f.read()

        assert 'import boto3' in content, "Script doesn't import boto3"

    def test_analysis_script_has_analyzer_class(self):
        """Test that lib/analyse.py has InfrastructureAnalyzer class"""
        analysis_script = project_root / "lib" / "analyse.py"
        with open(analysis_script, 'r') as f:
            content = f.read()

        assert 'class InfrastructureAnalyzer' in content, "Script missing InfrastructureAnalyzer class"

    def test_analysis_script_has_analyze_method(self):
        """Test that lib/analyse.py has analyze_infrastructure method"""
        analysis_script = project_root / "lib" / "analyse.py"
        with open(analysis_script, 'r') as f:
            content = f.read()

        assert 'def analyze_infrastructure' in content, "Script missing analyze_infrastructure method"

    def test_analysis_script_uses_environment_suffix(self):
        """Test that lib/analyse.py uses environment_suffix parameter"""
        analysis_script = project_root / "lib" / "analyse.py"
        with open(analysis_script, 'r') as f:
            content = f.read()

        assert 'environment_suffix' in content, "Script doesn't use environment_suffix"

    def test_analysis_script_has_main_block(self):
        """Test that lib/analyse.py has main execution block"""
        analysis_script = project_root / "lib" / "analyse.py"
        with open(analysis_script, 'r') as f:
            content = f.read()

        assert '__main__' in content, "Script missing main execution block"


class TestAnalysisScriptFunctionality:
    """Tests for analysis script functionality"""

    def test_can_import_analysis_module(self):
        """Test that we can import the analysis module"""
        try:
            # Import the module
            import importlib.util
            spec = importlib.util.spec_from_file_location(
                "analyse",
                project_root / "lib" / "analyse.py"
            )
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)

            assert hasattr(module, 'InfrastructureAnalyzer'), "Module missing InfrastructureAnalyzer"
        except Exception as e:
            pytest.fail(f"Failed to import analysis module: {e}")

    def test_analyzer_class_instantiation(self):
        """Test that InfrastructureAnalyzer can be instantiated"""
        try:
            import importlib.util
            spec = importlib.util.spec_from_file_location(
                "analyse",
                project_root / "lib" / "analyse.py"
            )
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)

            # Create analyzer instance
            analyzer = module.InfrastructureAnalyzer(
                environment_suffix='test',
                region_name='us-east-1'
            )

            assert analyzer is not None, "Failed to instantiate InfrastructureAnalyzer"
            assert hasattr(analyzer, 'environment_suffix'), "Analyzer missing environment_suffix"
            assert analyzer.environment_suffix == 'test', "Environment suffix not set correctly"

        except Exception as e:
            pytest.fail(f"Failed to instantiate analyzer: {e}")


class TestAnalysisOutputs:
    """Tests for analysis script outputs"""

    def test_script_docstring(self):
        """Test that lib/analyse.py has a module docstring"""
        analysis_script = project_root / "lib" / "analyse.py"
        with open(analysis_script, 'r') as f:
            lines = f.readlines()

        # Find docstring (after shebang)
        has_docstring = False
        for i, line in enumerate(lines[1:], 1):
            if '"""' in line or "'''" in line:
                has_docstring = True
                break

        assert has_docstring, "Script missing module docstring"

    def test_analysis_returns_dict(self):
        """Test that analyze_infrastructure returns a dictionary"""
        analysis_script = project_root / "lib" / "analyse.py"
        with open(analysis_script, 'r') as f:
            content = f.read()

        # Check for Dict return type annotation
        assert 'Dict[str, Any]' in content or '-> dict' in content.lower(), \
            "analyze_infrastructure should return a Dict"

    def test_analysis_has_error_handling(self):
        """Test that lib/analyse.py has error handling"""
        analysis_script = project_root / "lib" / "analyse.py"
        with open(analysis_script, 'r') as f:
            content = f.read()

        # Check for try/except blocks
        assert 'try:' in content and 'except' in content, \
            "Script should have error handling (try/except)"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
