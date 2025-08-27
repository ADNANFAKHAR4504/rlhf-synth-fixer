## This code still has multiple build errors, about 28 of them. These are the recent errors from my Mac local.

/Users/mac/Desktop/Turing_projects/Turing_Pulumi_Java_1/iac-test-automations/lib/src/main/java/app/MonitoringInfrastructure.java:307: error: incompatible types: cannot infer type-variable(s) U
          return this.dashboard.dashboardName().apply(name ->
                                                     ^
      (argument mismatch; bad return type in lambda expression
        String cannot be converted to Output<U>)
    where U,T are type-variables:
      U extends Object declared in method <U>apply(Function<T,Output<U>>)
      T extends Object declared in interface Output
  /Users/mac/Desktop/Turing_projects/Turing_Pulumi_Java_1/iac-test-automations/lib/src/main/java/app/TapStack.java:115: error: incompatible types: TapStack cannot be converted to Resource
                      .parent(this)
                              ^
  /Users/mac/Desktop/Turing_projects/Turing_Pulumi_Java_1/iac-test-automations/lib/src/main/java/app/ElasticBeanstalkInfrastructure.java:123: error: incompatible types: ComponentResourceOptions cannot be converted to CustomResourceOptions
              ComponentResourceOptions.builder().parent(this).build()
                                                                   ^
  /Users/mac/Desktop/Turing_projects/Turing_Pulumi_Java_1/iac-test-automations/lib/src/main/java/app/ElasticBeanstalkInfrastructure.java:134: error: incompatible types: cannot infer type-variable(s) U
              .apply(subnets -> String.join(",", subnets));
                    ^
      (argument mismatch; bad return type in lambda expression
        String cannot be converted to Output<U>)
    where U,T are type-variables:
      U extends Object declared in method <U>apply(Function<T,Output<U>>)
      T extends Object declared in interface Output
  /Users/mac/Desktop/Turing_projects/Turing_Pulumi_Java_1/iac-test-automations/lib/src/main/java/app/ElasticBeanstalkInfrastructure.java:136: error: incompatible types: cannot infer type-variable(s) U
              .apply(subnets -> String.join(",", subnets));
                    ^
      (argument mismatch; bad return type in lambda expression
        String cannot be converted to Output<U>)
    where U,T are type-variables:
      U extends Object declared in method <U>apply(Function<T,Output<U>>)
      T extends Object declared in interface Output
  /Users/mac/Desktop/Turing_projects/Turing_Pulumi_Java_1/iac-test-automations/lib/src/main/java/app/ElasticBeanstalkInfrastructure.java:232: error: incompatible types: ComponentResourceOptions cannot be converted to CustomResourceOptions
              ComponentResourceOptions.builder().parent(this).build()
                                                                   ^
  /Users/mac/Desktop/Turing_projects/Turing_Pulumi_Java_1/iac-test-automations/lib/src/main/java/app/ElasticBeanstalkInfrastructure.java:248: error: incompatible types: ComponentResourceOptions cannot be converted to CustomResourceOptions
              ComponentResourceOptions.builder().parent(this).build()
                                                                   ^/Users/mac/Desktop/Turing_projects/Turing_Pulumi_Java_1/iac-test-automations/lib/src/main/java/app/NetworkingInfrastructure.java:94: error: cannot find symbol
          this.registerOutputs(java.util.Map.of(
              ^
    symbol: method registerOutputs(Map<String,Output<? extends Object>>)
  /Users/mac/Desktop/Turing_projects/Turing_Pulumi_Java_1/iac-test-automations/lib/src/main/java/app/IdentityInfrastructure.java:62: error: cannot find symbol
          this.registerOutputs(Map.of(
              ^
    symbol: method registerOutputs(Map<String,Output<String>>)
  /Users/mac/Desktop/Turing_projects/Turing_Pulumi_Java_1/iac-test-automations/lib/src/main/java/app/MonitoringInfrastructure.java:72: error: cannot find symbol
          this.registerOutputs(Map.of(
              ^
    symbol: method registerOutputs(Map<String,Output<String>>)
  /Users/mac/Desktop/Turing_projects/Turing_Pulumi_Java_1/iac-test-automations/lib/src/main/java/app/TapStack.java:177: error: cannot find symbol
          this.registerOutputs(Map.of(
              ^
    symbol: method registerOutputs(Map<String,Output<? extends Object>>)
  78 errors

* Try:
> Check your code and dependencies to fix the compilation error(s)
> Run with --scan to get full insights.

Deprecated Gradle features were used in this build, making it incompatible with Gradle 9.0.

You can use '--warning-mode all' to show the individual deprecation warnings and determine if they come from your own scripts or plugins.

For more on this, please refer to https://docs.gradle.org/8.12/userguide/command_line_interface.html#sec:command_line_warnings in the Gradle documentation.

BUILD FAILED in 1s
1 actionable task: 1 executed
mac@Joshua-Okorie iac-test-automations % 