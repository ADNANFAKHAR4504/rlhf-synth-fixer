Hey I'm seeing this error in synth stage:

Run ./scripts/synth.sh
Project: platform=cdktf, language=py
✅ CDKTF project detected, running CDKTF get and synth...
❌ No .gen directory found; generating...
Generated python constructs in the output directory: .gen
✅ Found other language CDKTF generated provider directory in .gen
> tap@0.1.0 cdktf:synth
> cdktf synth
Error: 025-09-04T14:47:01.085] [ERROR] default - Traceback (most recent call last):
  File "/home/runner/work/iac-test-automations/iac-test-automations/tap.py", line 7, in <module>
Error: 025-09-04T14:47:01.087] [ERROR] default -     from lib.tap_stack import TapStack
  File "/home/runner/work/iac-test-automations/iac-test-automations/lib/tap_stack.py", line 6, in <module>
    from cdktf_cdktf_provider_aws import (
ImportError: cannot import name 'AwsProvider' from 'cdktf_cdktf_provider_aws' (/home/runner/work/iac-test-automations/iac-test-automations/.venv/lib/python3.12/site-packages/cdktf_cdktf_provider_aws/__init__.py)
ERROR: cdktf encountered an error while synthesizing
Synth command: pipenv run python tap.py
⠋  Synthesizing
Error:         non-zero exit code 1
Command output on stderr:
    Traceback (most recent call last):
      File "/home/runner/work/iac-test-automations/iac-test-automations/tap.py", line 7, in <module>
        from lib.tap_stack import TapStack
      File "/home/runner/work/iac-test-automations/iac-test-automations/lib/tap_stack.py", line 6, in <module>
        from cdktf_cdktf_provider_aws import (
    ImportError: cannot import name 'AwsProvider' from 'cdktf_cdktf_provider_aws' (/home/runner/work/iac-test-automations/iac-test-automations/.venv/lib/python3.12/site-packages/cdktf_cdktf_provider_aws/__init__.py)
Error: Process completed with exit code 1.