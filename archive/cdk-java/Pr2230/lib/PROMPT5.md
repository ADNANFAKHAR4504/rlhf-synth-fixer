Build is failing ! fix it!

🔨 Running Build...
Project: platform=cdk, language=java
Building Java project with Gradle...
Current working directory: /Users/alexandru/projects/turing/iac-test-automations2
Gradle wrapper: -rwxr-xr-x@ 1 alexandru  staff  8728 Aug 25 14:28 gradlew
To honour the JVM settings for this build a single-use Daemon process will be forked. For more on this, please refer to https://docs.gradle.org/8.12/userguide/gradle_daemon.html#sec:disabling_the_daemon in the Gradle documentation.
Daemon will be stopped at the end of the build

> Task :compileJava FAILED
/Users/alexandru/projects/turing/iac-test-automations2/lib/src/main/java/app/Main.java:373: error: reference to InstanceType is ambiguous
            .instanceType(InstanceType.BURSTABLE3_MICRO)
                          ^
  both enum software.amazon.awscdk.services.rds.InstanceType in software.amazon.awscdk.services.rds and class software.amazon.awscdk.services.ec2.InstanceType in software.amazon.awscdk.services.ec2 match
Note: /Users/alexandru/projects/turing/iac-test-automations2/lib/src/main/java/app/Main.java uses or overrides a deprecated API.
Note: Recompile with -Xlint:deprecation for details.
1 error

[Incubating] Problems report is available at: file:///Users/alexandru/projects/turing/iac-test-automations2/build/reports/problems/problems-report.html

FAILURE: Build failed with an exception.

* What went wrong:
Execution failed for task ':compileJava'.
> Compilation failed; see the compiler output below.
  /Users/alexandru/projects/turing/iac-test-automations2/lib/src/main/java/app/Main.java:373: error: reference to InstanceType is ambiguous
              .instanceType(InstanceType.BURSTABLE3_MICRO)
                            ^
    both enum software.amazon.awscdk.services.rds.InstanceType in software.amazon.awscdk.services.rds and class software.amazon.awscdk.services.ec2.InstanceType in software.amazon.awscdk.services.ec2 match
  1 error
