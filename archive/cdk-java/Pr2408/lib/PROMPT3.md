

For more details see https://docs.gradle.org/8.12/release-notes.html

To honour the JVM settings for this build a single-use Daemon process will be forked. For more on this, please refer to https://docs.gradle.org/8.12/userguide/gradle_daemon.html#sec:disabling_the_daemon in the Gradle documentation.
Daemon will be stopped at the end of the build 

/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:380: error: ')' expected
                .build());
                         ^
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:408: error: ')' expected
                .build());
                         ^
2 errors
> Task :compileJava

> Task :compileJava FAILED
gradle/actions: Writing build results to /home/runner/work/_temp/.gradle-actions/build-results/__run-1756390512027.json


[Incubating] Problems report is available at: file:///home/runner/work/iac-test-automations/iac-test-automations/build/reports/problems/problems-report.html
FAILURE: Build failed with an exception.

* What went wrong:

Execution failed for task ':compileJava'.
> Compilation failed; see the compiler output below.
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:380: error: ')' expected
                  .build());
                           ^
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:408: error: ')' expected
                  .build());
                           ^
  2 errors

* Try:
Deprecated Gradle features were used in this build, making it incompatible with Gradle 9.0.
> Check your code and dependencies to fix the compilation error(s)
> Run with --scan to get full insights.

BUILD FAILED in 42s

You can use '--warning-mode all' to show the individual deprecation warnings and determine if they come from your own scripts or plugins.

For more on this, please refer to https://docs.gradle.org/8.12/userguide/command_line_interface.html#sec:command_line_warnings in the Gradle documentation.
1 actionable task: 1 executed