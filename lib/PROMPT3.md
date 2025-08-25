# Prompt3.md

Design and implement a fault-tolerant multi-region AWS infrastructure using **AWS CDK (Java)** for the project **“IaC – AWS Nova Model Breaking.”**  
The application should provision two stacks across `us-east-1` and `us-west-2` for high availability and disaster recovery.

However, the model fails at the **lint/test stage** (around 2 minutes) with the following error:

Running linting for platform: cdk, language: java
✅ Java project detected, running Checkstyle...
Downloading https://services.gradle.org/distributions/gradle-8.12-bin.zip
.............10%.............20%.............30%.............40%.............50%.............60%.............70%.............80%.............90%.............100%

Welcome to Gradle 8.12!

Here are the highlights of this release:

Enhanced error and warning reporting with the Problems API

File-system watching support on Alpine Linux

Build and test Swift 6 libraries and apps

For more details see https://docs.gradle.org/8.12/release-notes.html

To honour the JVM settings for this build a single-use Daemon process will be forked. For more on this, please refer to https://docs.gradle.org/8.12/userguide/gradle_daemon.html#sec:disabling_the_daemon in the Gradle documentation.
Daemon will be stopped at the end of the build

Task :compileJava
Task :processResources NO-SOURCE
Task :classes

Task :compileTestJava
/home/runner/work/iac-test-automations/iac-test-automations/tests/unit/java/app/MainTest.java:23: error: cannot find symbol
TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
^
symbol: class TapStack
location: class MainTest
/home/runner/work/iac-test-automations/iac-test-automations/tests/unit/java/app/MainTest.java:23: error: cannot find symbol
TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
^
symbol: class TapStack
location: class MainTest
/home/runner/work/iac-test-automations/iac-test-automations/tests/unit/java/app/MainTest.java:23: error: cannot find symbol
TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
^
symbol: variable TapStackProps
location: class MainTest
...
12 errors

Task :compileTestJava FAILED
gradle/actions: Writing build results to /home/runner/work/_temp/.gradle-actions/build-results/__run-1756118632631.json

FAILURE: Build failed with an exception.

What went wrong:
Execution failed for task ':compileTestJava'.

Compilation failed; see the compiler output above.

BUILD FAILED in 1m 8s
Error: Process completed with exit code 1.