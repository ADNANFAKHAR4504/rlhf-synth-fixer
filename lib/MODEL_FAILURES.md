# Model Failures

This document describes the failures encountered during the LocalStack migration and testing phases, along with the fixes applied.

## Missing AssertJ Dependency

**Issue**: The test file `tests/unit/java/app/MainTest.java` used AssertJ's fluent assertions (`assertThat()`) but the `pom.xml` was missing the AssertJ dependency. This caused compilation failures in the Integration Tests CI job.

**Error Message**:
```
[ERROR] package org.assertj.core.api does not exist
[ERROR] cannot find symbol: method assertThat(...)
```

**Fix**: Added the AssertJ dependency to `pom.xml` with test scope:
```xml
<dependency>
    <groupId>org.assertj</groupId>
    <artifactId>assertj-core</artifactId>
    <version>3.24.2</version>
    <scope>test</scope>
</dependency>
```

## Test Assertions Not Environment-Aware

**Issue**: The integration tests made hardcoded assertions expecting AWS configuration values (e.g., 2-10 instances, 3 CloudWatch alarms, 2 NAT Gateways) but the stack implementation creates different resources based on whether LocalStack is detected via the `AWS_ENDPOINT_URL` environment variable. When tests ran in the LocalStack environment, they failed because the actual values didn't match expectations.

**Failed Tests**:
1. `testAutoScalingGroupConfiguration` - Expected MinSize=2, MaxSize=10, DesiredCapacity=3 but got MinSize=1, MaxSize=2, DesiredCapacity=1
2. `testCloudWatchAlarmsConfiguration` - Expected 3 alarms but got 0 (LocalStack Community doesn't support complex CloudWatch alarms)
3. `testNatGatewayConfiguration` - Expected 2+ NAT Gateways but got 0 (LocalStack Community has limited NAT Gateway support)

**Fix**: Updated the test methods to detect the LocalStack environment using the same logic as the stack implementation and assert the correct expected values for each environment:

```java
String endpointUrl = System.getenv("AWS_ENDPOINT_URL");
boolean isLocalStack = endpointUrl != null &&
    (endpointUrl.contains("localhost") || endpointUrl.contains("4566"));

if (isLocalStack) {
    // Assert LocalStack values
    template.hasResourceProperties("AWS::AutoScaling::AutoScalingGroup", Map.of(
        "MinSize", "1",
        "MaxSize", "2",
        "DesiredCapacity", "1"
    ));
} else {
    // Assert AWS values
    template.hasResourceProperties("AWS::AutoScaling::AutoScalingGroup", Map.of(
        "MinSize", "2",
        "MaxSize", "10",
        "DesiredCapacity", "3"
    ));
}
```

This pattern was applied to all three failing tests, ensuring they pass in both LocalStack and AWS environments.

## Summary

Both issues were related to test infrastructure rather than the application code itself:

1. **Dependency Management**: The pom.xml was incomplete and didn't include the testing library actually used by the test code
2. **Environment Awareness**: The tests didn't account for the stack's intentional environment-specific behavior

These fixes ensure the integration tests accurately validate the infrastructure in both LocalStack (for development/testing) and AWS (for production) environments.
