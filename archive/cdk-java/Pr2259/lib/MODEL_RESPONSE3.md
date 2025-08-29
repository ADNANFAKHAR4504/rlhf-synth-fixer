## Expected Behavior
- Provision two regional stacks for high availability and disaster recovery.
- Generate CloudFormation templates through CDK synthesis.
- Pass linting and unit test compilation successfully.

---

## Actual Outcome
The build succeeded for **main application code** (`Main.java`), but **failed during lint/test compilation** because the **unit test file** (`MainTest.java`) still referenced classes that were not defined.

### Error Log (excerpt)
Task :compileTestJava
/home/runner/work/iac-test-automations/iac-test-automations/tests/unit/java/app/MainTest.java:23: error: cannot find symbol
TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
^
symbol: class TapStack
location: class MainTest
...
12 errors

Task :compileTestJava FAILED
BUILD FAILED in 1m 8s
Error: Process completed with exit code 1.

yaml
Copy
Edit

---

## Root Cause
- The `tests/unit/java/app/MainTest.java` file references **`TapStack`** and **`TapStackProps`**, which were **removed/replaced** in the updated implementation (where we introduced `RegionalStack` instead).  
- As a result, unit tests could not resolve these symbols, leading to **12 compilation errors** during `:compileTestJava`.

---

## Outcome
- The main application builds and compiles, but **unit tests fail**.  
- This means deployment cannot proceed until the test code is updated to align with the current stack implementation.

---

## Next Steps
1. Update unit tests (`MainTest.java`) to reference the new `RegionalStack` instead of `TapStack`.
2. Remove or refactor any dependency on `TapStackProps`.
3. Re-run `./gradlew build` to confirm both **compile** and **test** phases succeed.