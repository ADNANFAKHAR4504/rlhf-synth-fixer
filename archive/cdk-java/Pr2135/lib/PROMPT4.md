./gradlew build

> Task :compileJava FAILED
/Users/alexandru/projects/turing/amazon_iac/iac-test-automations2/lib/src/main/java/app/Main.java:261: error: cannot find symbol
                    .instanceType(software.amazon.awscdk.services.rds.InstanceType.T3_MEDIUM)
                                                                                  ^
  symbol:   variable T3_MEDIUM
  location: class InstanceType
/Users/alexandru/projects/turing/amazon_iac/iac-test-automations2/lib/src/main/java/app/Main.java:283: error: cannot find symbol
                    .instanceType(software.amazon.awscdk.services.rds.InstanceType.T3_MEDIUM)
                                                                                  ^
Build failed. Fix it!

symbol:   variable T3_MEDIUM
  location: class InstanceType
/Users/alexandru/projects/turing/amazon_iac/iac-test-automations2/lib/src/main/java/app/Main.java:373: error: cannot find symbol
                .type("HTTPS")
                ^
  symbol:   method type(String)
  location: class Builder
Note: /Users/alexandru/projects/turing/amazon_iac/iac-test-automations2/lib/src/main/java/app/Main.java uses or overrides a deprecated API.
Note: Recompile with -Xlint:deprecation for details.
3 errors

[Incubating] Problems report is available at: file:///Users/alexandru/projects/turing/amazon_iac/iac-test-automations2/build/reports/problems/problems-report.html

FAILURE: Build failed with an exception.

* What went wrong:
Execution failed for task ':compileJava'.
> Compilation failed; see the compiler output below.
  /Users/alexandru/projects/turing/amazon_iac/iac-test-automations2/lib/src/main/java/app/Main.java:261: error: cannot find symbol
                      .instanceType(software.amazon.awscdk.services.rds.InstanceType.T3_MEDIUM)
                                                                                    ^
    symbol:   variable T3_MEDIUM
    location: class InstanceType
  3 errors

* Try:
> Check your code and dependencies to fix the compilation error(s)
> Run with --scan to get full insights.

Deprecated Gradle features were used in this build, making it incompatible with Gradle 9.0.

You can use '--warning-mode all' to show the individual deprecation warnings and determine if they come from your own scripts or plugins.

For more on this, please refer to https://docs.gradle.org/8.12/userguide/command_line_interface.html#sec:command_line_warnings in the Gradle documentation.

BUILD FAILED in 1s
1 actionable task: 1 executed
