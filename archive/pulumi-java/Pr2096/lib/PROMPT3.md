# PROMPT3.md

Now the model failed with the below response in lint phase

> Task :jacocoTestReport
[ant:jacocoReport] Rule violated for bundle iac-test-automations: instructions covered ratio is 0.15, but expected minimum is 0.50
[ant:jacocoReport] Rule violated for class app.Main: lines covered ratio is 0.17, but expected minimum is 0.50

FAILURE: Build failed with an exception.


* What went wrong:
Execution failed for task ':jacocoTestCoverageVerification'.
> Rule violated for bundle iac-test-automations: instructions covered ratio is 0.15, but expected minimum is 0.50
  Rule violated for class app.Main: lines covered ratio is 0.17, but expected minimum is 0.50

* Try:
> Run with --stacktrace option to get the stack trace.
> Run with --info or --debug option to get more log output.
> Run with --scan to get full insights.
> Get more help at https://help.gradle.org.

BUILD FAILED in 1m 8s
> Task :jacocoTestCoverageVerification FAILED
gradle/actions: Writing build results to /home/runner/work/_temp/.gradle-actions/build-results/__run-1755932100223.json

[Incubating] Problems report is available at: file:///home/runner/work/iac-test-automations/iac-test-automations/build/reports/problems/problems-report.html

Deprecated Gradle features were used in this build, making it incompatible with Gradle 9.0.

You can use '--warning-mode all' to show the individual deprecation warnings and determine if they come from your own scripts or plugins.

For more on this, please refer to https://docs.gradle.org/8.12/userguide/command_line_interface.html#sec:command_line_warnings in the Gradle documentation.
10 actionable tasks: 10 executed
Error: Process completed with exit code 1.

Also, in the deploy phase

@ updating..................................................................................................................
    aws:iam:Role cross-account-role
  error:   sdk-v2/provider2.go:572: sdk.helper_schema: creating IAM Role (cross-account-role-322edb6): operation error IAM: CreateRole, https response error StatusCode: 400, RequestID: 065d9425-ef82-4338-9be7-a70de3a23d1a, MalformedPolicyDocument: Invalid principal in policy: "AWS":"arn:aws:iam::*:root": provider=aws@7.4.0
 +  aws:iam:Role cross-account-role creating (121s) error: 1 error occurred:
 +  aws:iam:Role cross-account-role **creating failed** error: 1 error occurred:
@ updating....
 +  pulumi:pulumi:Stack TapStack-TapStackpr2096 creating (127s) error: update failed
 +  pulumi:pulumi:Stack TapStack-TapStackpr2096 **creating failed** 1 error
    aws:iam:Role cross-account-role
 **failed** 1 error
Diagnostics:
  aws:iam:Role (cross-account-role
):
    error:   sdk-v2/provider2.go:572: sdk.helper_schema: creating IAM Role (cross-account-role-322edb6): operation error IAM: CreateRole, https response error StatusCode: 400, RequestID: 065d9425-ef82-4338-9be7-a70de3a23d1a, MalformedPolicyDocument: Invalid principal in policy: "AWS":"arn:aws:iam::*:root": provider=aws@7.4.0

  pulumi:pulumi:Stack (TapStack-TapStackpr2096):
    error: update failed

  aws:iam:Role (cross-account-role):
    error: 1 error occurred:
    	* creating IAM Role (cross-account-role-322edb6): operation error IAM: CreateRole, https response error StatusCode: 400, RequestID: 065d9425-ef82-4338-9be7-a70de3a23d1a, MalformedPolicyDocument: Invalid principal in policy: "AWS":"arn:aws:iam::*:root"

Resources:
    + 7 created

Duration: 2m10s
