Above code is failed with following errors please fix these

```java
> Task :compileJava
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:271: error: cannot find symbol
                .cloudWatchLogsRole(cloudTrailRole)
                ^
  symbol:   method cloudWatchLogsRole(Role)
  location: class Builder
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:415: error: reference to InstanceType is ambiguous
                .instanceType(InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MICRO))
> Task :compileJava FAILED
                              ^
  both enum software.amazon.awscdk.services.rds.InstanceType in software.amazon.awscdk.services.rds and class software.amazon.awscdk.services.ec2.InstanceType in software.amazon.awscdk.services.ec2 match
Note: /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java uses or overrides a deprecated API.
Note: Recompile with -Xlint:deprecation for details.
3 errors
gradle/actions: Writing build results to /home/runner/work/_temp/.gradle-actions/build-results/__run-1756232244508.json
[Incubating] Problems report is available at: file:///home/runner/work/iac-test-automations/iac-test-automations/build/reports/problems/problems-report.html
FAILURE: Build failed with an exception.
* What went wrong:
Deprecated Gradle features were used in this build, making it incompatible with Gradle 9.0.
Execution failed for task ':compileJava'.
> Compilation failed; see the compiler output below.
  Note: Recompile with -Xlint:deprecation for details./home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:201: error: cannot find symbol
                  .enforceSSL(true)
                  ^
    symbol:   method enforceSSL(boolean)
    location: class Builder
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:271: error: cannot find symbol
                  .cloudWatchLogsRole(cloudTrailRole)
                  ^
    symbol:   method cloudWatchLogsRole(Role)
    location: class BuilderNote: /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java uses or overrides a deprecated API./home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:415: error: reference to InstanceType is ambiguous
                  .instanceType(InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MICRO))
                                ^
    both enum software.amazon.awscdk.services.rds.InstanceType in software.amazon.awscdk.services.rds and class software.amazon.awscdk.services.ec2.InstanceType in software.amazon.awscdk.services.ec2 match
  3 errors
```

and regenerate apt code
