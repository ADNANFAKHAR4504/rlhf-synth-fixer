Failed resources:
TapStackpr2541-us-east-1 | 1:53:15 PM | CREATE_FAILED        | AWS::Logs::LogGroup         | AppLogGroup (AppLogGroup7D8CD952) Resource handler returned message: "The specified KMS key does not exist or is not allowed to be used with Arn 'arn:aws:logs:us-east-1:***:log-group:/aws/tapstack/pr2541/us-east-1' (Service: CloudWatchLogs, Status Code: 400, Request ID: ec2c3764-096f-4360-b21f-450e44fdd18f) (SDK Attempt Count: 1)" (RequestToken: b2f48f54-f7b8-c48b-c9b9-ba484f46e27b, HandlerErrorCode: InvalidRequest)

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
❌  TapStackpr2541-us-east-1 failed: ToolkitError: The stack named TapStackpr2541-us-east-1 failed creation, it may need to be manually deleted from the AWS console: ROLLBACK_COMPLETE: Resource handler returned message: "The specified KMS key does not exist or is not allowed to be used with Arn 'arn:aws:logs:us-east-1:***:log-group:/aws/tapstack/pr2541/us-east-1' (Service: CloudWatchLogs, Status Code: 400, Request ID: ec2c3764-096f-4360-b21f-450e44fdd18f) (SDK Attempt Count: 1)" (RequestToken: b2f48f54-f7b8-c48b-c9b9-ba484f46e27b, HandlerErrorCode: InvalidRequest)
Error: Process completed with exit code 1.