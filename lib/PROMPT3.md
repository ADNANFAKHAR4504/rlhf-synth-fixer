Above code is failled with following errors can you please fix them

```java
Execution failed for task ':compileJava'.
> Compilation failed; see the compiler output below.
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:27: error: no suitable method found for defaultTags(Map<String,String>)
                  .defaultTags(TaggingPolicy.getDefaultTags(environment))
                  ^
      method Builder.defaultTags(Output<ProviderDefaultTagsArgs>) is not applicable
        (argument mismatch; Map<String,String> cannot be converted to Output<ProviderDefaultTagsArgs>)
      method Builder.defaultTags(ProviderDefaultTagsArgs) is not applicable
        (argument mismatch; Map<String,String> cannot be converted to ProviderDefaultTagsArgs)/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/migration/custom/SecretsManagerMirgration.java:20: error: class SecretsManagerMigration is public, should be declared in a file named SecretsManagerMigration.java
  public class SecretsManagerMigration extends CustomResource {
         ^
  2 errors
```
