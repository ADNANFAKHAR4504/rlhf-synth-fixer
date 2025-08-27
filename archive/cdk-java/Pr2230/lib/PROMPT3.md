Build is failing. Fix it!

🔨 Running Build...
Project: platform=cdk, language=java
Building Java project with Gradle...
Current working directory: /Users/alexandru/projects/turing/iac-test-automations2
Gradle wrapper: -rwxr-xr-x@ 1 alexandru  staff  8728 Aug 25 14:28 gradlew
To honour the JVM settings for this build a single-use Daemon process will be forked. For more on this, please refer to https://docs.gradle.org/8.12/userguide/gradle_daemon.html#sec:disabling_the_daemon in the Gradle documentation.
Daemon will be stopped at the end of the build

> Task :compileJava FAILED
/Users/alexandru/projects/turing/iac-test-automations2/lib/src/main/java/app/Main.java:333: error: cannot find symbol
            .publicWriteAccess(false)
            ^
  symbol:   method publicWriteAccess(boolean)
  location: class Builder
/Users/alexandru/projects/turing/iac-test-automations2/lib/src/main/java/app/Main.java:375: error: cannot find symbol
            .instanceType(software.amazon.awscdk.services.rds.InstanceType.of(InstanceClass.T3, InstanceSize.MICRO))
                                                                          ^
  symbol:   method of(InstanceClass,InstanceSize)
  location: class InstanceType
/Users/alexandru/projects/turing/iac-test-automations2/lib/src/main/java/app/Main.java:377: error: cannot find symbol
                software.amazon.awscdk.services.rds.CredentialsFromGeneratedSecretOptions.builder()
                                                   ^
  symbol:   class CredentialsFromGeneratedSecretOptions
  location: package software.amazon.awscdk.services.rds
Note: /Users/alexandru/projects/turing/iac-test-automations2/lib/src/main/java/app/Main.java uses or overrides a deprecated API.
Note: Recompile with -Xlint:deprecation for details.
3 errors

[Incubating] Problems report is available at: file:///Users/alexandru/projects/turing/iac-test-automations2/build/reports/problems/problems-report.html

FAILURE: Build failed with an exception.

* What went wrong:
Execution failed for task ':compileJava'.
> Compilation failed; see the compiler output below.
  /Users/alexandru/projects/turing/iac-test-automations2/lib/src/main/java/app/Main.java:333: error: cannot find symbol
              .publicWriteAccess(false)
              ^
    symbol:   method publicWriteAccess(boolean)
    location: class Builder
  3 errors
