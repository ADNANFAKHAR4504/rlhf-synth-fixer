Build Failed With Following Error
```
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:50: error: incompatible types: ComponentResourceOptions cannot be converted to CustomResourceOptions
> Task :compileJava
                .build(), providerOptions);
                          ^
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:53: error: cannot find symbol
            var azs = GetAvailabilityZones.invoke(GetAvailabilityZonesArgs.builder()
                      ^
  symbol:   variable GetAvailabilityZones
  location: class Main
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:53: error: cannot find symbol
            var azs = GetAvailabilityZones.invoke(GetAvailabilityZonesArgs.builder()
                                                  ^
  symbol:   variable GetAvailabilityZonesArgs
  location: class Main
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:209: error: cannot find symbol
            var amiId = GetAmi.invoke(GetAmiArgs.builder()
                        ^
  symbol:   variable GetAmi
  location: class Main
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:209: error: cannot find symbol
            var amiId = GetAmi.invoke(GetAmiArgs.builder()
                                      ^
  symbol:   variable GetAmiArgs
  location: class Main
Note: Some messages have been simplified; recompile with -Xdiags:verbose to get full output
5 errors
> Task :compileJava FAILED
gradle/actions: Writing build results to /home/runner/work/_temp/.gradle-actions/build-results/__run-1755936530270.json
[Incubating] Problems report is available at: file:///home/runner/work/iac-test-automations/iac-test-automations/build/reports/problems/problems-report.html
FAILURE: Build failed with an exception.
Deprecated Gradle features were used in this build, making it incompatible with Gradle 9.0.
* What went wrong:
Execution failed for task ':compileJava'.
> Compilation failed; see the compiler output below.
  Note: Some messages have been simplified; recompile with -Xdiags:verbose to get full output/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:53: error: cannot find symbol
              var azs = GetAvailabilityZones.invoke(GetAvailabilityZonesArgs.builder()
                        ^
    symbol:   variable GetAvailabilityZones
    location: class Main
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:53: error: cannot find symbol
              var azs = GetAvailabilityZones.invoke(GetAvailabilityZonesArgs.builder()
                                                    ^
    symbol:   variable GetAvailabilityZonesArgs
    location: class Main
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:209: error: cannot find symbol
              var amiId = GetAmi.invoke(GetAmiArgs.builder()
                          ^
    symbol:   variable GetAmi
    location: class Main
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:209: error: cannot find symbol
              var amiId = GetAmi.invoke(GetAmiArgs.builder()
                                        ^
    symbol:   variable GetAmiArgs
    location: class Main/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:50: error: incompatible types: ComponentResourceOptions cannot be converted to CustomResourceOptions
                  .build(), providerOptions);
                            ^
  5 errors
* Try:
> Check your code and dependencies to fix the compilation error(s)
> Run with --scan to get full insights.
BUILD FAILED in 33s
You can use '--warning-mode all' to show the individual deprecation warnings and determine if they come from your own scripts or plugins.
For more on this, please refer to https://docs.gradle.org/8.12/userguide/command_line_interface.html#sec:command_line_warnings in the Gradle documentation.
1 actionable task: 1 executed
Error: Process completed with exit code 1.
```