Build failed! Fix it

Running Build...
Project: platform=cdk, language=java
Building Java project with Gradle...

> Task :compileJava FAILED
/Users/alexandru/projects/turing/iac-test-automations5/lib/src/main/java/app/Main.java:236: error: cannot find symbol
                .retention(RetentionDays.FOURTEEN)
                                        ^
  symbol:   variable FOURTEEN
  location: class RetentionDays
/Users/alexandru/projects/turing/iac-test-automations5/lib/src/main/java/app/Main.java:241: error: cannot find symbol
                .retention(RetentionDays.FOURTEEN)
                                        ^
  symbol:   variable FOURTEEN
  location: class RetentionDays
/Users/alexandru/projects/turing/iac-test-automations5/lib/src/main/java/app/Main.java:297: error: incompatible types: ICertificate cannot be converted to Certificate
            Certificate certificate = Certificate.fromCertificateArn(this, "ApiCertificate", certificateArn);
                                                                    ^
/Users/alexandru/projects/turing/iac-test-automations5/lib/src/main/java/app/Main.java:308: error: incompatible types: IHostedZone cannot be converted to HostedZone
            HostedZone hostedZone = HostedZone.fromHostedZoneId(this, "HostedZone", hostedZoneId);
                                                               ^
/Users/alexandru/projects/turing/iac-test-automations5/lib/src/main/java/app/Main.java:326: error: incompatible types: Statistic cannot be converted to String
                        .statistic(Statistic.AVERAGE)
                                            ^
/Users/alexandru/projects/turing/iac-test-automations5/lib/src/main/java/app/Main.java:342: error: incompatible types: Statistic cannot be converted to String
                        .statistic(Statistic.AVERAGE)
                                            ^
Note: /Users/alexandru/projects/turing/iac-test-automations5/lib/src/main/java/app/Main.java uses or overrides a deprecated API.
Note: Recompile with -Xlint:deprecation for details.
Note: Some messages have been simplified; recompile with -Xdiags:verbose to get full output
6 errors

[Incubating] Problems report is available at: file:///Users/alexandru/projects/turing/iac-test-automations5/build/reports/problems/problems-report.html

FAILURE: Build failed with an exception.

* What went wrong:
Execution failed for task ':compileJava'.
> Compilation failed; see the compiler output below.
  /Users/alexandru/projects/turing/iac-test-automations5/lib/src/main/java/app/Main.java:236: error: cannot find symbol
                  .retention(RetentionDays.FOURTEEN)
                                          ^
    symbol:   variable FOURTEEN
    location: class RetentionDays
  6 errors
