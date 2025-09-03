Build failed

./gradlew build

> Task :compileJava FAILED
/Users/alexandru/projects/turing/amazon_iac/iac-test-automations2/lib/src/main/java/app/Main.java:260: error: reference to InstanceType is ambiguous
                    .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.MEDIUM))
                                  ^
  both enum software.amazon.awscdk.services.rds.InstanceType in software.amazon.awscdk.services.rds and class software.amazon.awscdk.services.ec2.InstanceType in software.amazon.awscdk.services.ec2 match
/Users/alexandru/projects/turing/amazon_iac/iac-test-automations2/lib/src/main/java/app/Main.java:282: error: reference to InstanceType is ambiguous
                    .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.MEDIUM))
                                  ^
  both enum software.amazon.awscdk.services.rds.InstanceType in software.amazon.awscdk.services.rds and class software.amazon.awscdk.services.ec2.InstanceType in software.amazon.awscdk.services.ec2 match
/Users/alexandru/projects/turing/amazon_iac/iac-test-automations2/lib/src/main/java/app/Main.java:320: error: reference to Protocol is ambiguous
                    .protocol(Protocol.HTTP)
                              ^
  both enum software.amazon.awscdk.services.elasticloadbalancingv2.Protocol in software.amazon.awscdk.services.elasticloadbalancingv2 and enum software.amazon.awscdk.services.ec2.Protocol in software.amazon.awscdk.services.ec2 match
/Users/alexandru/projects/turing/amazon_iac/iac-test-automations2/lib/src/main/java/app/Main.java:318: error: reference to HealthCheck is ambiguous
                .healthCheck(HealthCheck.builder()
                             ^
  both interface software.amazon.awscdk.services.elasticloadbalancingv2.HealthCheck in software.amazon.awscdk.services.elasticloadbalancingv2 and class software.amazon.awscdk.services.route53.HealthCheck in software.amazon.awscdk.services.route53 match
/Users/alexandru/projects/turing/amazon_iac/iac-test-automations2/lib/src/main/java/app/Main.java:372: error: cannot find symbol
                .type("HTTPS")
                ^
  symbol:   method type(String)
  location: class Builder
Note: /Users/alexandru/projects/turing/amazon_iac/iac-test-automations2/lib/src/main/java/app/Main.java uses or overrides a deprecated API.
Note: Recompile with -Xlint:deprecation for details.
5 errors

[Incubating] Problems report is available at: file:///Users/alexandru/projects/turing/amazon_iac/iac-test-automations2/build/reports/problems/problems-report.html

FAILURE: Build failed with an exception.

* What went wrong:
Execution failed for task ':compileJava'.
> Compilation failed; see the compiler output below.
  /Users/alexandru/projects/turing/amazon_iac/iac-test-automations2/lib/src/main/java/app/Main.java:260: error: reference to InstanceType is ambiguous
                      .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.MEDIUM))
                                    ^
    both enum software.amazon.awscdk.services.rds.InstanceType in software.amazon.awscdk.services.rds and class software.amazon.awscdk.services.ec2.InstanceType in software.amazon.awscdk.services.ec2 match
  5 errors

* Try:
> Check your code and dependencies to fix the compilation error(s)
> Run with --scan to get full insights.

Deprecated Gradle features were used in this build, making it incompatible with Gradle 9.0.

You can use '--warning-mode all' to show the individual deprecation warnings and determine if they come from your own scripts or plugins.

For more on this, please refer to https://docs.gradle.org/8.12/userguide/command_line_interface.html#sec:command_line_warnings in the Gradle documentation.

BUILD FAILED in 1s
1 actionable task: 1 executed
