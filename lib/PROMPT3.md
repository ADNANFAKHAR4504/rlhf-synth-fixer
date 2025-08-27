Below is the errors that the pipeline and the below stages gives me:
Synth:
Error: lib/tap_stack.go:26:2: declared and not used: commonTags
Error: lib/tap_stack.go:95:2: declared and not used: instanceProfile

NOTICES (What's this? https://github.com/aws/aws-cdk/wiki/CLI-Notices)

34892 CDK CLI will collect telemetry data on command usage starting at version 2.1100.0 (unless opted out)

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
Error: go run bin/tap.go: Subprocess exited with error 1

Lint:

# github.com/TuringGpt/iac-test-automations/lib

Error: lib/tap_stack.go:26:2: declared and not used: commonTags
Error: lib/tap_stack.go:95:2: declared and not used: instanceProfile
Error: Process completed with exit code 123.
