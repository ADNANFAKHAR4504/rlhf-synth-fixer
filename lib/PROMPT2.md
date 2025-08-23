Above code is failed with following errors please fix them and update the code

```java
> Task :compileJava
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:8: error: cannot find symbol
import com.pulumi.aws.cloudtrail.TrailEventSelectorArgs;
                                ^
  symbol:   class TrailEventSelectorArgs
  location: package com.pulumi.aws.cloudtrail
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:19: error: cannot find symbol
import com.pulumi.aws.s3.BucketServerSideEncryptionConfigurationRuleArgs;
                        ^
  symbol:   class BucketServerSideEncryptionConfigurationRuleArgs
  location: package com.pulumi.aws.s3
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:20: error: cannot find symbol
import com.pulumi.aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs;
                        ^
  symbol:   class BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs
  location: package com.pulumi.aws.s3
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:51: error: cannot find symbol
                .keySpec("SYMMETRIC_DEFAULT")
                ^
  symbol:   method keySpec(String)
  location: class Builder
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:75: error: cannot find symbol
                    .rules(BucketServerSideEncryptionConfigurationRuleArgs.builder()
                           ^
  symbol:   variable BucketServerSideEncryptionConfigurationRuleArgs
  location: class Main
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:77: error: cannot find symbol
                            BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs.builder()
                            ^
  symbol:   variable BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs
  location: class Main
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:99: error: cannot find symbol
                    .rules(BucketServerSideEncryptionConfigurationRuleArgs.builder()
                           ^
  symbol:   variable BucketServerSideEncryptionConfigurationRuleArgs
  location: class Main
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:101: error: cannot find symbol
                            BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs.builder()
                            ^
  symbol:   variable BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs
  location: class Main
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:229: error: cannot find symbol
                    .ingress(SecurityGroupIngressArgs.builder()
                             ^
  symbol:   variable SecurityGroupIngressArgs
  location: class Main
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:236: error: cannot find symbol
                    .egress(SecurityGroupEgressArgs.builder()
                            ^
  symbol:   variable SecurityGroupEgressArgs
  location: class Main
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:243: error: cannot find symbol
                    .egress(SecurityGroupEgressArgs.builder()
                            ^
  symbol:   variable SecurityGroupEgressArgs
  location: class Main
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:282: error: incompatible types: cannot infer type-variable(s) U
                    .policy(appBucket.arn().apply(bucketArn -> String.format("""
                                                 ^
    (argument mismatch; bad return type in lambda expression
      String cannot be converted to Output<U>)
  where U,T are type-variables:
    U extends Object declared in method <U>apply(Function<T,Output<U>>)
    T extends Object declared in interface Output
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:337: error: cannot find symbol
            var ami = GetAmiInvokeArgs.builder()
                      ^
  symbol:   variable GetAmiInvokeArgs
  location: class Main
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:340: error: cannot find symbol
                .filters(GetAmiFilterArgs.builder()
                         ^
  symbol:   variable GetAmiFilterArgs
  location: class Main
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:346: error: cannot find symbol
            var amiResult = Output.of(GetAmiFunctions.getAmi(ami));
                                      ^
  symbol:   variable GetAmiFunctions
  location: class Main
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:371: error: cannot find symbol
                        .rootBlockDevice(InstanceRootBlockDeviceArgs.builder()
                                         ^
  symbol:   variable InstanceRootBlockDeviceArgs
  location: class Main
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:432: error: cannot find symbol
                        .alarmName("financial-app-cpu-alarm-" + instanceNumber + "-" + RANDOM_SUFFIX)
                        ^
  symbol:   method alarmName(String)
  location: class Builder
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:458: error: cannot find symbol
                .eventSelectors(TrailEventSelectorArgs.builder()
                                ^
  symbol:   variable TrailEventSelectorArgs
  location: class Main
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:461: error: cannot find symbol
                    .dataResources(com.pulumi.aws.cloudtrail.TrailEventSelectorDataResourceArgs.builder()
                                                            ^
  symbol:   class TrailEventSelectorDataResourceArgs
  location: package com.pulumi.aws.cloudtrail
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:463: error: incompatible types: cannot infer type-variable(s) U
                        .values(appBucket.arn().apply(arn -> arn + "/*"))
                                                     ^
    (argument mismatch; bad return type in lambda expression
      String cannot be converted to Output<U>)
  where U,T are type-variables:
    U extends Object declared in method <U>apply(Function<T,Output<U>>)
    T extends Object declared in interface Output
Note: Some messages have been simplified; recompile with -Xdiags:verbose to get full output
20 errors

> Task :compileJava FAILED
gradle/actions: Writing build results to /home/runner/work/_temp/.gradle-actions/build-results/__run-1755925668240.json


FAILURE: Build failed with an exception.
[Incubating] Problems report is available at: file:///home/runner/work/iac-test-automations/iac-test-automations/build/reports/problems/problems-report.html

* What went wrong:
Execution failed for task ':compileJava'.
> Compilation failed; see the compiler output below.
  Note: Some messages have been simplified; recompile with -Xdiags:verbose to get full output/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:8: error: cannot find symbol
  import com.pulumi.aws.cloudtrail.TrailEventSelectorArgs;
                                  ^
    symbol:   class TrailEventSelectorArgs
    location: package com.pulumi.aws.cloudtrail
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:19: error: cannot find symbol
  import com.pulumi.aws.s3.BucketServerSideEncryptionConfigurationRuleArgs;
                          ^
    symbol:   class BucketServerSideEncryptionConfigurationRuleArgs
    location: package com.pulumi.aws.s3
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:20: error: cannot find symbol
  import com.pulumi.aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs;
                          ^
    symbol:   class BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs
    location: package com.pulumi.aws.s3
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:75: error: cannot find symbol
                      .rules(BucketServerSideEncryptionConfigurationRuleArgs.builder()
                             ^
    symbol:   variable BucketServerSideEncryptionConfigurationRuleArgs
    location: class Main
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:77: error: cannot find symbol
                              BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs.builder()
                              ^
    symbol:   variable BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs
    location: class Main
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:99: error: cannot find symbol
                      .rules(BucketServerSideEncryptionConfigurationRuleArgs.builder()
                             ^
    symbol:   variable BucketServerSideEncryptionConfigurationRuleArgs
    location: class Main
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:101: error: cannot find symbol
                              BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs.builder()
                              ^
    symbol:   variable BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs
    location: class Main
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:229: error: cannot find symbol
                      .ingress(SecurityGroupIngressArgs.builder()
                               ^
    symbol:   variable SecurityGroupIngressArgs
    location: class Main
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:236: error: cannot find symbol
                      .egress(SecurityGroupEgressArgs.builder()
                              ^
    symbol:   variable SecurityGroupEgressArgs
    location: class Main
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:243: error: cannot find symbol
                      .egress(SecurityGroupEgressArgs.builder()
                              ^
    symbol:   variable SecurityGroupEgressArgs
    location: class Main
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:337: error: cannot find symbol
              var ami = GetAmiInvokeArgs.builder()
                        ^
    symbol:   variable GetAmiInvokeArgs
    location: class Main
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:340: error: cannot find symbol
                  .filters(GetAmiFilterArgs.builder()
                           ^
    symbol:   variable GetAmiFilterArgs
    location: class Main
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:346: error: cannot find symbol
              var amiResult = Output.of(GetAmiFunctions.getAmi(ami));
                                        ^
    symbol:   variable GetAmiFunctions
    location: class Main
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:371: error: cannot find symbol
                          .rootBlockDevice(InstanceRootBlockDeviceArgs.builder()
                                           ^
    symbol:   variable InstanceRootBlockDeviceArgs
    location: class Main
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:458: error: cannot find symbol
                  .eventSelectors(TrailEventSelectorArgs.builder()
                                  ^
    symbol:   variable TrailEventSelectorArgs
    location: class Main
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:461: error: cannot find symbol
                      .dataResources(com.pulumi.aws.cloudtrail.TrailEventSelectorDataResourceArgs.builder()
                                                              ^
    symbol:   class TrailEventSelectorDataResourceArgs
    location: package com.pulumi.aws.cloudtrail/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:282: error: incompatible types: cannot infer type-variable(s) U
                      .policy(appBucket.arn().apply(bucketArn -> String.format("""
                                                   ^
      (argument mismatch; bad return type in lambda expression
        String cannot be converted to Output<U>)
    where U,T are type-variables:
      U extends Object declared in method <U>apply(Function<T,Output<U>>)
      T extends Object declared in interface Output
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:463: error: incompatible types: cannot infer type-variable(s) U
                          .values(appBucket.arn().apply(arn -> arn + "/*"))
                                                       ^
      (argument mismatch; bad return type in lambda expression
        String cannot be converted to Output<U>)
    where U,T are type-variables:
      U extends Object declared in method <U>apply(Function<T,Output<U>>)
      T extends Object declared in interface Output/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:51: error: cannot find symbol
                  .keySpec("SYMMETRIC_DEFAULT")
                  ^
    symbol:   method keySpec(String)
    location: class Builder
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:432: error: cannot find symbol
                          .alarmName("financial-app-cpu-alarm-" + instanceNumber + "-" + RANDOM_SUFFIX)
                          ^
    symbol:   method alarmName(String)
    location: class Builder
  20 errors
```
