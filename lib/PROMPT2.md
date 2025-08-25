Above code failed with following errors at build stage please fix and generate proper code

```java
FAILURE: Build failed with an exception.

* What went wrong:
Execution failed for task ':compileJava'.
> Compilation failed; see the compiler output below.

  Note: Some messages have been simplified; recompile with -Xdiags:verbose to get full output/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/migration/custom/SecretsManagerMirgration.java:13: error: cannot find symbol
  import app.utils.ResourceNaming;
                  ^
    symbol:   class ResourceNaming
    location: package app.utils
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/infrastructure/InfrastructureStack.java:14: error: cannot find symbol
  import app.utils.ResourceNaming;
                  ^
    symbol:   class ResourceNaming
    location: package app.utils
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/utils/TaggingPolicy.java:3: error: cannot find symbol
  import com.pulumi.aws.DefaultTagsArgs;
                       ^
    symbol:   class DefaultTagsArgs
    location: package com.pulumi.aws
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/utils/TaggingPolicy.java:9: error: cannot find symbol
      public static DefaultTagsArgs getDefaultTags(String environment) {
                    ^
    symbol:   class DefaultTagsArgs
    location: class TaggingPolicy
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/migration/custom/SecretsManagerMirgration.java:33: error: cannot find symbol
          String secretName = ResourceNaming.generateResourceName(
                              ^
    symbol:   variable ResourceNaming
    location: class SecretsManagerMigration
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/migration/custom/SecretsManagerMirgration.java:50: error: cannot find symbol
              "password", "placeholder-" + ResourceNaming.generateRandomString(16),
                                           ^
    symbol:   variable ResourceNaming
    location: class SecretsManagerMigration
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/infrastructure/InfrastructureStack.java:32: error: cannot find symbol
          String vpcName = ResourceNaming.generateResourceName(
                           ^
    symbol:   variable ResourceNaming
    location: class InfrastructureStack
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/infrastructure/InfrastructureStack.java:49: error: cannot find symbol
          String sgName = ResourceNaming.generateResourceName(
                          ^
    symbol:   variable ResourceNaming
    location: class InfrastructureStack
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/infrastructure/InfrastructureStack.java:101: error: cannot find symbol
          String keyName = ResourceNaming.generateResourceName(
                           ^
    symbol:   variable ResourceNaming
    location: class InfrastructureStack
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/utils/TaggingPolicy.java:10: error: cannot find symbol
          return DefaultTagsArgs.builder()
                 ^
    symbol:   variable DefaultTagsArgs
    location: class TaggingPolicy/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:56: error: incompatible types: cannot infer type-variable(s) U
              ctx.export("migrationStatus", secretsMigration.apply(status ->
                                                                  ^
      (argument mismatch; bad return type in lambda expression
        no instance(s) of type variable(s) K,V exist so that Map<K,V> conforms to Output<U>)
    where U,T,K,V are type-variables:
      U extends Object declared in method <U>apply(Function<T,Output<U>>)
      T extends Object declared in interface Output
      K extends Object declared in method <K,V>of(K,V)
      V extends Object declared in method <K,V>of(K,V)/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/migration/custom/SecretsManagerMirgration.java:18: error: class SecretsManagerMigration is public, should be declared in a file named SecretsManagerMigration.java
  public class SecretsManagerMigration extends CustomResource {
         ^
  12 errors
```
