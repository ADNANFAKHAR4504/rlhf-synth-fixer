Above code is failing with following errors please fix the code and generate again

```java
> Task :compileJava
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:412: error: cannot find symbol
                .instanceType(software.amazon.awscdk.services.rds.InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MICRO))
                                                                              ^
  symbol:   method of(InstanceClass,InstanceSize)
  location: class InstanceType
Note: /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java uses or overrides a deprecated API.
Note: Recompile with -Xlint:deprecation for details.
1 error
> Task :compileJava FAILED
gradle/actions: Writing build results to /home/runner/work/_temp/.gradle-actions/build-results/__run-1756232793680.json
FAILURE: Build failed with an exception.
* What went wrong:
Execution failed for task ':compileJava'.
> Compilation failed; see the compiler output below.
  Note: Recompile with -Xlint:deprecation for details./home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:412: error: cannot find symbol
                  .instanceType(software.amazon.awscdk.services.rds.InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MICRO))
                                                                                ^
    symbol:   method of(InstanceClass,InstanceSize)
[Incubating] Problems report is available at: file:///home/runner/work/iac-test-automations/iac-test-automations/build/reports/problems/problems-report.html
    location: class InstanceTypeNote: /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java uses or overrides a deprecated API.
  1 error
```
