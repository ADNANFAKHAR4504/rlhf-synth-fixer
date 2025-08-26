Hi, The model response fails to pass te CI/CD pipeline with the below stages with the errors below:

Synth:
Error: bin/tap.go:6:2: import "github.com/TuringGpt/iac-test-automations/lib" is a program, not an importable package

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
Error: Process completed with exit code 1.

Lint:
Error: main.go:5:2: import "github.com/TuringGpt/iac-test-automations/lib" is a program, not an importable package
Error: archive/cdk-go/Pr2204/bin/tap.go:4:2: import "github.com/TuringGpt/iac-test-automations/lib" is a program, not an importable package
Error: archive/cdk-go/Pr2270/bin/tap.go:6:2: import "github.com/TuringGpt/iac-test-automations/lib" is a program, not an importable package
Error: bin/tap.go:6:2: import "github.com/TuringGpt/iac-test-automations/lib" is a program, not an importable package
package github.com/TuringGpt/iac-test-automations/node_modules/aws-cdk/lib/init-templates/app/go: invalid input file name "%name%.template.go"
package github.com/TuringGpt/iac-test-automations/node_modules/aws-cdk/lib/init-templates/sample-app/go: invalid input file name "%name%.template.go"
Error: templates/cdk-go/bin/tap.go:6:2: import "github.com/TuringGpt/iac-test-automations/lib" is a program, not an importable package
go: downloading github.com/stretchr/testify v1.11.0
go: downloading github.com/pmezard/go-difflib v1.0.0
go: downloading github.com/davecgh/go-spew v1.1.1
Error: tests/unit/tap_stack_unit_test.go:6:2: import "github.com/TuringGpt/iac-test-automations/lib" is a program, not an importable package

# github.com/TuringGpt/iac-test-automations/lib

# [github.com/TuringGpt/iac-test-automations/lib]

Error: vet: lib/tap_stack.go:101:3: unknown field Generation in struct literal of type awsec2.AmazonLinux2ImageSsmParameterProps
Error: Process completed with exit code 123.
