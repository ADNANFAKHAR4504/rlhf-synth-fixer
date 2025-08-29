## Expected Behavior
- Provision two **TapStack** instances across `us-east-1` and `us-west-2`.
- Synthesize CloudFormation templates that deploy:
  - Auto Scaling Groups with Load Balancers
  - Multi-AZ RDS databases
  - Centralized S3 logging
  - Route 53 DNS failover
  - VPC with secure subnets
  - IAM least-privileged roles
  - CloudWatch alarms

---

## Actual Outcome
The build **failed at the compile stage** due to missing class definitions.  

### Error Log
Task :compileJava
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:35: error: cannot find symbol
new TapStack(app, "TapStack-" + environmentSuffix + "-use1", TapStackProps.builder()
^
symbol: class TapStack
location: class Main
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:35: error: cannot find symbol
new TapStack(app, "TapStack-" + environmentSuffix + "-use1", TapStackProps.builder()
^
symbol: variable TapStackProps
location: class Main
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:46: error: cannot find symbol
new TapStack(app, "TapStack-" + environmentSuffix + "-usw2", TapStackProps.builder()
^
symbol: class TapStack
location: class Main
/home/runner/work/iac-test-automations/iac-test-automations/lib/src/main/java/app/Main.java:46: error: cannot find symbol
new TapStack(app, "TapStack-" + environmentSuffix + "-usw2", TapStackProps.builder()
^
symbol: variable TapStackProps
location: class Main
4 errors

Task :compileJava FAILED
BUILD FAILED in 45s

yaml
Copy
Edit

---

## Root Cause
- The `Main.java` file references **`TapStack`** and **`TapStackProps`**,  
  but these classes were **not defined or imported** in the project.  
- As a result, Gradle could not resolve these symbols, leading to compilation failure.

---

## Outcome
- The conceptual infrastructure design was correct.  
- The **implementation was incomplete**, preventing build success and deployment.  

---

## Next Steps
To fix the issue:
1. Add a `TapStack.java` class extending `software.amazon.awscdk.Stack`.
2. Add a `TapStackProps.java` helper to encapsulate environment suffix and stack properties.
3. Place both in `lib/src/main/java/app/` under the same `package app;`.
4. Re-run `./gradlew build` to confirm successful compilation.