Build is failing! Fix it!

Task :compileJava FAILED
/Users/alexandru/projects/turing/iac-test-automations2/lib/src/main/java/app/Main.java:54: error: class NovaModelSecureInfrastructureStack is public, should be declared in a file named NovaModelSecureInfrastructureStack.java
public class NovaModelSecureInfrastructureStack extends Stack {
       ^
/Users/alexandru/projects/turing/iac-test-automations2/lib/src/main/java/app/Main.java:124: error: cannot find symbol
            .keyPolicy(PolicyDocument.Builder.create()
            ^
  symbol:   method keyPolicy(PolicyDocument)
  location: class Builder
/Users/alexandru/projects/turing/iac-test-automations2/lib/src/main/java/app/Main.java:253: error: cannot find symbol
            .map(builder -> builder.build())
                                   ^
  symbol:   method build()
  location: variable builder of type SubnetMappingProperty
/Users/alexandru/projects/turing/iac-test-automations2/lib/src/main/java/app/Main.java:254: error: cannot find symbol
            .map(mapping -> mapping.getSubnetId())
                                   ^
  symbol:   method getSubnetId()
  location: variable mapping of type Object
/Users/alexandru/projects/turing/iac-test-automations2/lib/src/main/java/app/Main.java:255: error: incompatible types: List<Object> cannot be converted to List<String>
            .toList();
                   ^
/Users/alexandru/projects/turing/iac-test-automations2/lib/src/main/java/app/Main.java:273: error: package CfnEBSDefaultKMSKey does not exist
        CfnEBSDefaultKMSKey.Builder.create(this, resourceName("EBSDefaultKMSKey"))
                           ^
/Users/alexandru/projects/turing/iac-test-automations2/lib/src/main/java/app/Main.java:335: error: cannot find symbol
            .enforceSSL(true)
            ^
  symbol:   method enforceSSL(boolean)
  location: class Builder
/Users/alexandru/projects/turing/iac-test-automations2/lib/src/main/java/app/Main.java:361: error: reference to InstanceType is ambiguous
            .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.MICRO))
                          ^
  both enum software.amazon.awscdk.services.rds.InstanceType in software.amazon.awscdk.services.rds and class software.amazon.awscdk.services.ec2.InstanceType in software.amazon.awscdk.services.ec2 match
/Users/alexandru/projects/turing/iac-test-automations2/lib/src/main/java/app/Main.java:362: error: cannot find symbol
            .credentials(Credentials.fromGeneratedSecret("dbadmin", CredentialsFromGeneratedSecretOptions.builder()
                                                                    ^
  symbol:   variable CredentialsFromGeneratedSecretOptions
  location: class NovaModelSecureInfrastructureStack
/Users/alexandru/projects/turing/iac-test-automations2/lib/src/main/java/app/Main.java:383: error: reference to Runtime is ambiguous
            .runtime(Runtime.PYTHON_3_11)
                     ^
  both class software.amazon.awscdk.services.lambda.Runtime in software.amazon.awscdk.services.lambda and class java.lang.Runtime in java.lang match
/Users/alexandru/projects/turing/iac-test-automations2/lib/src/main/java/app/Main.java:430: error: reference to InstanceType is ambiguous
            .instanceType(InstanceType.of(InstanceClass.M6I, InstanceSize.LARGE))
                          ^
  both enum software.amazon.awscdk.services.rds.InstanceType in software.amazon.awscdk.services.rds and class software.amazon.awscdk.services.ec2.InstanceType in software.amazon.awscdk.services.ec2 match
Note: /Users/alexandru/projects/turing/iac-test-automations2/lib/src/main/java/app/Main.java uses or overrides a deprecated API.
Note: Recompile with -Xlint:deprecation for details.
11 errors

[Incubating] Problems report is available at: file:///Users/alexandru/projects/turing/iac-test-automations2/build/reports/problems/problems-report.html

FAILURE: Build failed with an exception.

* What went wrong:
Execution failed for task ':compileJava'.
> Compilation failed; see the compiler output below.
  /Users/alexandru/projects/turing/iac-test-automations2/lib/src/main/java/app/Main.java:54: error: class NovaModelSecureInfrastructureStack is public, should be declared in a file named NovaModelSecureInfrastructureStack.java
  public class NovaModelSecureInfrastructureStack extends Stack {
         ^
  11 errors

BUILD FAILED in 7s
1 actionable task: 1 executed
