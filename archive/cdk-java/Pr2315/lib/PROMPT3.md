I am facing the below error while running the synth:

```
Object creation stack:
  at stack traces disabled.
Object creation stack:
  at stack traces disabled..
@jsii/kernel.RuntimeError: ValidationError: Resolution error: Resolution error: Resolution error: Resolution error: Cannot use resource 'SecondaryStack-staging/Ec2InstanceRole' in a cross-environment fashion, the resource's physical name must be explicit set or use `PhysicalName.GENERATE_IF_NEEDED`.
Object creation stack:
  at stack traces disabled.
Object creation stack:
  at stack traces disabled..
    at Kernel._Kernel_ensureSync (/tmp/jsii-java-runtime10126834369447736598/lib/program.js:927:23)
    at Kernel.invoke (/tmp/jsii-java-runtime10126834369447736598/lib/program.js:294:102)
    at KernelHost.processRequest (/tmp/jsii-java-runtime10126834369447736598/lib/program.js:15464:36)
    at KernelHost.run (/tmp/jsii-java-runtime10126834369447736598/lib/program.js:15424:22)
    at Immediate._onImmediate (/tmp/jsii-java-runtime10126834369447736598/lib/program.js:15425:45)
    at process.processImmediate (node:internal/timers:485:21)
	at software.amazon.jsii.JsiiRuntime.processErrorResponse(JsiiRuntime.java:147)
	at software.amazon.jsii.JsiiRuntime.requestResponse(JsiiRuntime.java:116)
	at software.amazon.jsii.JsiiClient.callMethod(JsiiClient.java:184)
	at software.amazon.jsii.Kernel.call(Kernel.java:52)
	at software.amazon.awscdk.Stage.synth(Stage.java:106)
	at app.Main.main(Main.java:90)
Warning:  aws-cdk-lib.aws_ec2.MachineImage#latestAmazonLinux is deprecated.
  use MachineImage.latestAmazonLinux2 instead
  This API will be removed in the next major release.

> Task :run FAILED

FAILURE: Build failed with an exception.
gradle/actions: Writing build results to /home/runner/work/_temp/.gradle-actions/build-results/__run-1756273496145.json


* What went wrong:
[Incubating] Problems report is available at: file:///home/runner/work/iac-test-automations/iac-test-automations/build/reports/problems/problems-report.html
Execution failed for task ':run'.
> Process 'command '/usr/lib/jvm/temurin-17-jdk-amd64/bin/java'' finished with non-zero exit value 1

* Try:

Deprecated Gradle features were used in this build, making it incompatible with Gradle 10.
> Run with --stacktrace option to get the stack trace.
> Run with --info or --debug option to get more log output.
> Run with --scan to generate a Build Scan (Powered by Develocity).
> Get more help at https://help.gradle.org.

BUILD FAILED in 1m 8s
```

Fix this issue