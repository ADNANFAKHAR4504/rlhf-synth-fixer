"""
Provide lightweight stubs for the pytest-cov CLI options.

The analysis environment that executes ``scripts/analysis.sh`` does not install
pytest-cov, but ``pytest.ini`` still references the coverage-related flags via
``addopts``. Pytest processes ``addopts`` before it knows which plugins are
available, so without pytest-cov these options raise ``unrecognized arguments``.

To keep the configuration intact while making the test runner resilient, we
register the commonly used coverage options (``--cov``, ``--cov-report``,
``--cov-branch``, ``--cov-fail-under``, and ``--no-cov``) as no-ops. When the
real plugin is available this stub is bypassed because pytest prefers the
options provided by the actual plugin.
"""

from __future__ import annotations

import importlib.util

import pytest


def _pytest_cov_available() -> bool:
    """Return True when pytest-cov is importable."""
    return importlib.util.find_spec("pytest_cov") is not None


if not _pytest_cov_available():

    def pytest_addoption(parser: pytest.Parser) -> None:
        """Register placeholder coverage options when pytest-cov is unavailable."""
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
