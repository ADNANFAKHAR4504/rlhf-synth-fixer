"""Integration tests validating region configuration consistency."""

from pathlib import Path
import re


def _project_root() -> Path:
    """Return repo root regardless of where tests are executed."""
    return Path(__file__).resolve().parents[2]


def test_region_file_has_valid_region_code():
    """Ensure lib/AWS_REGION exists and contains a valid AWS region string."""
    region_file = _project_root() / "lib" / "AWS_REGION"
    region = region_file.read_text(encoding="utf-8").strip()
    assert region, "AWS_REGION file is empty"
    assert re.fullmatch(
        r"[a-z]{2}-[a-z]+-[0-9]",
        region,
    ), f"Region '{region}' is not a valid AWS region identifier"


def test_prompt_mentions_active_region():
    """PROMPT should explicitly mention the same region as AWS_REGION."""
    root = _project_root()
    region = (root / "lib" / "AWS_REGION").read_text(encoding="utf-8").strip()
    prompt_text = (root / "lib" / "PROMPT.md").read_text(encoding="utf-8")
    assert (
        f"**{region}**" in prompt_text
    ), "PROMPT.md must mention the active AWS region"
