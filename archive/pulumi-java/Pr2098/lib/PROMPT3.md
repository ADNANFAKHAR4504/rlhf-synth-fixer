Again code failed in build stage:
```

* What went wrong:
Execution failed for task ':compileJava'.
> Compilation failed; see the compiler output below.
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:223: error: no suitable method found for vpcSecurityGroupIds(List<Output<String>>)
                  .vpcSecurityGroupIds(List.of(webSecurityGroup.id()))
                  ^
      method Builder.vpcSecurityGroupIds(Output<List<String>>) is not applicable
        (argument mismatch; no instance(s) of type variable(s) E exist so that List<E> conforms to Output<List<String>>)
      method Builder.vpcSecurityGroupIds(List<String>) is not applicable
        (argument mismatch; inference variable E has incompatible bounds
            equality constraints: String
            lower bounds: Output<String>)
      method Builder.vpcSecurityGroupIds(String...) is not applicable
        (varargs mismatch; no instance(s) of type variable(s) E exist so that List<E> conforms to String)
    where E is a type-variable:
      E extends Object declared in method <E>of(E)
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:237: error: no suitable method found for vpcSecurityGroupIds(List<Output<String>>)
                  .vpcSecurityGroupIds(List.of(webSecurityGroup.id()))
                  ^
      method Builder.vpcSecurityGroupIds(Output<List<String>>) is not applicable
        (argument mismatch; no instance(s) of type variable(s) E exist so that List<E> conforms to Output<List<String>>)
      method Builder.vpcSecurityGroupIds(List<String>) is not applicable
        (argument mismatch; inference variable E has incompatible bounds
            equality constraints: String
            lower bounds: Output<String>)
      method Builder.vpcSecurityGroupIds(String...) is not applicable
        (varargs mismatch; no instance(s) of type variable(s) E exist so that List<E> conforms to String)
    where E is a type-variable:
      E extends Object declared in method <E>of(E)/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:9: error: cannot find symbol
  import com.pulumi.aws.ec2.inputs.GetAvailabilityZonesArgs;
                                  ^
    symbol:   class GetAvailabilityZonesArgs
    location: package com.pulumi.aws.ec2.inputs
  /home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:47: error: cannot find symbol
              var azs = com.pulumi.aws.ec2.Ec2Functions.getAvailabilityZones(GetAvailabilityZonesArgs.builder()
                                                                             ^
    symbol:   variable GetAvailabilityZonesArgs
    location: class Main
  4 errors
```