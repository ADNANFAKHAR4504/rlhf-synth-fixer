"""
Provide lightweight stubs for the pytest-cov CLI options when the plugin is
missing in constrained CI environments.

``pytest.ini`` always includes coverage-related flags via ``addopts``. When
pytest-cov is not installed these flags would normally trigger an
``argparse.ArgumentError`` during test discovery. To keep the configuration
stable across environments, we register no-op replacements that are ignored
once the real plugin is available.
"""

from __future__ import annotations

import importlib.util

import pytest


def pytest_addoption(parser: pytest.Parser) -> None:
    """Register placeholder --cov options only when pytest-cov is unavailable."""
    if _pytest_cov_available(parser):
        return

    group = parser.getgroup("cov-placeholder", "coverage reporting (placeholder)")

    group.addoption(
        "--cov",
        action="append",
        metavar="MODULE_OR_PATH",
        dest="cov_targets",
        default=[],
        help="No-op placeholder for pytest-cov --cov option.",
    )
    group.addoption(
        "--cov-report",
        action="append",
        metavar="REPORT_TYPE",
        dest="cov_reports",
        default=[],
        help="No-op placeholder for pytest-cov --cov-report option.",
    )
    group.addoption(
        "--cov-fail-under",
        action="store",
        type=float,
        dest="cov_fail_under",
        default=None,
        help="No-op placeholder for pytest-cov --cov-fail-under option.",
    )
    group.addoption(
        "--cov-branch",
        action="store_true",
        dest="cov_branch",
        default=False,
        help="No-op placeholder for pytest-cov --cov-branch option.",
    )
    group.addoption(
        "--no-cov",
        action="store_true",
        dest="cov_disabled",
        default=False,
        help="Compatibility shim for pytest-cov's --no-cov flag.",
    )


def _pytest_cov_available(parser: pytest.Parser) -> bool:
    """Return True if pytest-cov is importable or already registered."""
    config = getattr(parser, "_config", None)
    if config and config.pluginmanager.hasplugin("pytest_cov"):
        return True

    return importlib.util.find_spec("pytest_cov") is not None

