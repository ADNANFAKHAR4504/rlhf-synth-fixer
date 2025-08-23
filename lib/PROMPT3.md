Above code is failing with following errors at build stage fix the code and generate a proper one

```java
//home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:284: error: cannot find symbol
> Task :compileJava
                        String bucketArn = values.t1;
                                                 ^
  symbol:   variable t1
  location: variable values of type List<String>
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:285: error: cannot find symbol
                        String kmsArn = values.t2;
                                              ^
  symbol:   variable t2
  location: variable values of type List<String>
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:283: error: incompatible types: cannot infer type-variable(s) U
                    .policy(Output.all(appBucket.arn(), kmsKey.arn()).apply(values -> {
                                                                           ^
    (argument mismatch; bad return type in lambda expression
      String cannot be converted to Output<U>)
  where U,T are type-variables:
    U extends Object declared in method <U>apply(Function<T,Output<U>>)
    T extends Object declared in interface Output
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:342: error: cannot find symbol
            var amiLookup = Ec2Functions.getAmi(GetAmiArgs.builder()
                                                ^
  symbol:   variable GetAmiArgs
  location: class Main
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:345: error: cannot find symbol
                .filters(GetAmiFilterArgs.builder()
                         ^
  symbol:   variable GetAmiFilterArgs
  location: class Main
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:445: error: no suitable method found for alarmActions(Output<String>)
                        .alarmActions(snsTopic.arn())
                        ^
    method Builder.alarmActions(Output<List<String>>) is not applicable
      (argument mismatch; Output<String> cannot be converted to Output<List<String>>)
    method Builder.alarmActions(List<String>) is not applicable
      (argument mismatch; Output<String> cannot be converted to List<String>)
    method Builder.alarmActions(String...) is not applicable
      (varargs mismatch; Output<String> cannot be converted to String)
Note: Some messages have been simplified; recompile with -Xdiags:verbose to get full output
6 errors


> Task :compileJava FAILED
gradle/actions: Writing build results to /home/runner/work/_temp/.gradle-actions/build-results/__run-1755940743824.json

FAILURE: Build failed with an exception.
[Incubating] Problems report is available at: file:///home/runner/work/iac-test-automations/iac-test-automations/build/reports/problems/problems-report.html

* What went wrong:
Execution failed for task ':compileJava'.
> Compilation failed; see the compiler output below.
  Note: Some messages have been simplified; recompile with -Xdiags:verbose to get full output/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:445: error: no suitable method found for alarmActions(Output<String>)
                          .alarmActions(snsTopic.arn())
                          ^
      method Builder.alarmActions(Output<List<String>>) is not applicable
        (argument mismatch; Output<String> cannot be converted to Output<List<String>>)
      method Builder.alarmActions(List<String>) is not applicable
        (argument mismatch; Output<String> cannot be converted to List<String>)
      method Builder.alarmActions(String...) is not applicable
        (varargs mismatch; Output<String> cannot be converted to String)/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:284: error: cannot find symbol
                          String bucketArn = values.t1;
                                                   ^
    symbol:   variable t1
    location: variable values of type List<String>
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:285: error: cannot find symbol
                          String kmsArn = values.t2;
                                                ^
    symbol:   variable t2
    location: variable values of type List<String>
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:342: error: cannot find symbol
              var amiLookup = Ec2Functions.getAmi(GetAmiArgs.builder()

                                                  ^
Deprecated Gradle features were used in this build, making it incompatible with Gradle 9.0.
    symbol:   variable GetAmiArgs

You can use '--warning-mode all' to show the individual deprecation warnings and determine if they come from your own scripts or plugins.

For more on this, please refer to https://docs.gradle.org/8.12/userguide/command_line_interface.html#sec:command_line_warnings in the Gradle documentation.
1 actionable task: 1 executed
    location: class Main
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:345: error: cannot find symbol
                  .filters(GetAmiFilterArgs.builder()
                           ^
    symbol:   variable GetAmiFilterArgs
    location: class Main/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:283: error: incompatible types: cannot infer type-variable(s) U
                      .policy(Output.all(appBucket.arn(), kmsKey.arn()).apply(values -> {
                                                                             ^
      (argument mismatch; bad return type in lambda expression
        String cannot be converted to Output<U>)
    where U,T are type-variables:
      U extends Object declared in method <U>apply(Function<T,Output<U>>)
      T extends Object declared in interface Output
  6 errors
```
