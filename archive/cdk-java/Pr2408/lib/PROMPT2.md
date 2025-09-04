```
Getting the below Error in Build Stage 

Run ./scripts/build.sh
🔨 Running Build...
Project: platform=cdk, language=java
Building Java project with Gradle...
Current working directory: /home/runner/work/iac-test-automations/iac-test-automations
Gradle wrapper: -rwxr-xr-x 1 runner docker 8728 Aug 28 13:32 gradlew
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
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:397: error: ')' expected
        .build());
                 ^
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:419: error: ')' expected
        .build());
                 ^
2 errors

> Task :compileJava FAILED
gradle/actions: Writing build results to /home/runner/work/_temp/.gradle-actions/build-results/__run-1756388098005.json

[Incubating] Problems report is available at: file:///home/runner/work/iac-test-automations/iac-test-automations/build/reports/problems/problems-report.html

FAILURE: Build failed with an exception.

* What went wrong:
Execution failed for task ':compileJava'.
> Compilation failed; see the compiler output below.
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:397: error: ')' expected
          .build());
                   ^
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:419: error: ')' expected
          .build());
                   ^
  2 errors

* Try:
> Check your code and dependencies to fix the compilation error(s)
> Run with --scan to get full insights.

Deprecated Gradle features were used in this build, making it incompatible with Gradle 9.0.

You can use '--warning-mode all' to show the individual deprecation warnings and determine if they come from your own scripts or plugins.


For more on this, please refer to https://docs.gradle.org/8.12/userguide/command_line_interface.html#sec:command_line_warnings in the Gradle documentation.
1 actionable task: 1 executed
```