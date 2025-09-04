Seeing a diff error in synth again

Run ./scripts/synth.sh
Project: platform=cdk, language=py
✅ CDK project detected, running CDK synth...
> tap@0.1.0 cdk:synth
> npx cdk synth --context environmentSuffix=${ENVIRONMENT_SUFFIX:-dev}
Traceback (most recent call last):
  File "/home/runner/work/iac-test-automations/iac-test-automations/tap.py", line 43, in <module>
    TapStack(app, STACK_NAME, props=props)
  File "/home/runner/work/iac-test-automations/iac-test-automations/.venv/lib/python3.12/site-packages/jsii/_runtime.py", line 118, in __call__
    inst = super(JSIIMeta, cast(JSIIMeta, cls)).__call__(*args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/runner/work/iac-test-automations/iac-test-automations/lib/tap_stack.py", line 61, in __init__
    self.region = "us-west-2"
    ^^^^^^^^^^^
AttributeError: property 'region' of 'TapStack' object has no setter
NOTICES         (What's this? https://github.com/aws/aws-cdk/wiki/CLI-Notices)
34892	CDK CLI will collect telemetry data on command usage starting at version 2.1100.0 (unless opted out)
	Overview: We do not collect customer content and we anonymize the
	          telemetry we do collect. See the attached issue for more
	          information on what data is collected, why, and how to
	          opt-out. Telemetry will NOT be collected for any CDK CLI
	          version prior to version 2.1100.0 - regardless of
	          opt-in/out. You can also preview the telemetry we will start
	          collecting by logging it to a local file, by adding
	          `--unstable=telemetry --telemetry-file=my/local/file` to any
	          `cdk` command.
	Affected versions: cli: ^2.0.0
	More information at: https://github.com/aws/aws-cdk/issues/34892
If you don’t want to see a notice anymore, use "cdk acknowledge <id>". For example, "cdk acknowledge 34892".
pipenv run python3 tap.py: Subprocess exited with error 1
Error: Process completed with exit code 1.