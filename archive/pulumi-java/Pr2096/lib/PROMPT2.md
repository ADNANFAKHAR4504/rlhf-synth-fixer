# PROMPT2.md

The model failed with the below error in the build phase

Gradle wrapper: -rwxr-xr-x 1 runner docker 8728 Aug 23 06:32 gradlew
Downloading https://services.gradle.org/distributions/gradle-8.12-bin.zip
.............10%.............20%.............30%.............40%.............50%.............60%.............70%.............80%.............90%.............100%

Welcome to Gradle 8.12!

Here are the highlights of this release:
 - Enhanced error and warning reporting with the Problems API
 - File-system watching support on Alpine Linux
 - Build and test Swift 6 libraries and apps

For more details see https://docs.gradle.org/8.12/release-notes.html

To honour the JVM settings for this build a single-use Daemon process will be forked. For more on this, please refer to https://docs.gradle.org/8.12/userguide/gradle_daemon.html#sec:disabling_the_daemon in the Gradle documentation.
Daemon will be stopped at the end of the build 

> Task :compileJava
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:12: error: package com.pulumi.aws.logs does not exist
import com.pulumi.aws.logs.*;
^
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:121: error: cannot find symbol
                        .enabled(true)
                        ^
  symbol:   method enabled(boolean)
  location: class Builder
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:124: error: cannot find symbol
                        .rules(List.of(BucketServerSideEncryptionConfigurationRuleArgs.builder()
                                       ^
  symbol:   variable BucketServerSideEncryptionConfigurationRuleArgs
  location: class Main
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:125: error: cannot find symbol
                                .applyServerSideEncryptionByDefault(BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs.builder()
                                                                    ^
  symbol:   variable BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs
  location: class Main
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:131: error: cannot find symbol
                .publicAccessBlockConfiguration(BucketPublicAccessBlockConfigurationArgs.builder()
                                                ^
  symbol:   variable BucketPublicAccessBlockConfigurationArgs
  location: class Main
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:276: error: cannot find symbol
                .alarmName("IAM Policy Changes")
                ^
  symbol:   method alarmName(String)
  location: class Builder
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:293: error: cannot find symbol
                .alarmName("Root Account Usage")
                ^
  symbol:   method alarmName(String)
  location: class Builder
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:347: error: package FunctionCodeArgs does not exist
                .code(new FunctionCodeArgs.Builder()
                                          ^
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:350: error: cannot find symbol
                .environment(FunctionEnvironmentArgs.builder()
                             ^
  symbol:   variable FunctionEnvironmentArgs
  location: class Main
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:417: error: cannot find symbol
        new Trail("security-trail", TrailArgs.builder()
            ^
  symbol:   class Trail
  location: class Main
                                      ^
    symbol:   variable TrailArgs
    location: class Main
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:425: error: cannot find symbol
                  .eventSelectors(List.of(TrailEventSelectorArgs.builder()
                                          ^
    symbol:   variable TrailEventSelectorArgs
    location: class Main/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:121: error: cannot find symbol
                          .enabled(true)
                          ^
    symbol:   method enabled(boolean)
    location: class Builder
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:276: error: cannot find symbol
                  .alarmName("IAM Policy Changes")
                  ^
    symbol:   method alarmName(String)
    location: class Builder
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:293: error: cannot find symbol
                  .alarmName("Root Account Usage")
                  ^
    symbol:   method alarmName(String)
    location: class Builder
  12 errors

* Try:
> Check your code and dependencies to fix the compilation error(s)
> Run with --scan to get full insights.
> Task :compileJava FAILED
gradle/actions: Writing build results to /home/runner/work/_temp/.gradle-actions/build-results/__run-1755930936716.json

[Incubating] Problems report is available at: file:///home/runner/work/iac-test-automations/iac-test-automations/build/reports/problems/problems-report.html


Deprecated Gradle features were used in this build, making it incompatible with Gradle 9.0.

You can use '--warning-mode all' to show the individual deprecation warnings and determine if they come from your own scripts or plugins.

For more on this, please refer to https://docs.gradle.org/8.12/userguide/command_line_interface.html#sec:command_line_warnings in the Gradle documentation.
1 actionable task: 1 executed
BUILD FAILED in 32s
Error: Process completed with exit code 1.
