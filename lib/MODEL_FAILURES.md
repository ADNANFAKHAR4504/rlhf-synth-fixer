# MODEL FAILURES

#### 1. Target Group Name Truncation Bug

**Error Message:**
```
Error: "name" cannot end with a hyphen

  with aws_alb_target_group.load-balancer_payment-service-tg_2B75711F (load-balancer/payment-service-tg),
  on cdk.tf.json line 161, in resource.aws_alb_target_group.load-balancer_payment-service-tg_2B75711F (load-balancer/payment-service-tg):
  161:         "name": "fintech-payment-payment-service-",
```

**Model Response:**
Failed to handle AWS target group naming constraints. Truncated long names at 32 characters without validating that the result doesn't end with a hyphen, violating AWS naming requirements.

**Actual Implementation (LoadBalancerConstruct.java:105-110):**
```java
String name = String.format("%s-%s-tg", appConfig.appName(), service.serviceName());

if (name.length() > 32) {
    name = name.substring(0, 32);
    while (name.endsWith("-")) {
        name = name.substring(0, name.length() - 1);
    }
}
```
Properly handles truncation by iteratively removing trailing hyphens after cutting to 32 characters, ensuring compliance with AWS naming rules.

---

#### 2. Missing Explicit Resource Dependencies for Auto Scaling

**Error Message:**
```
Error: creating Application AutoScaling Target (service/fintech-payment-cluster-prod/auth-service): operation error Application Auto Scaling: RegisterScalableTarget, https response error StatusCode: 400, RequestID: 9d4e364d-45e0-40fb-8e49-3900a786792c, ValidationException: ECS service doesn't exist: service/fintech-payment-cluster-prod/auth-service

  with aws_appautoscaling_target.auth-service_scaling-target_0A86D2D3 (auth-service/scaling-target),
  on cdk.tf.json line 266, in resource.aws_appautoscaling_target.auth-service_scaling-target_0A86D2D3 (auth-service/scaling-target):
  266:       },
```

**Model Response:**
Created Application Auto Scaling targets without explicit dependency on the ECS service resource, causing race conditions where auto scaling configuration attempted to reference non-existent services.

**Actual Implementation (ServiceConstruct.java:216-223):**
```java
AppautoscalingTarget target = AppautoscalingTarget.Builder.create(this, "scaling-target")
        .maxCapacity(serviceConfig.maxCount())
        .minCapacity(serviceConfig.minCount())
        .resourceId(resourceId)
        .scalableDimension("ecs:service:DesiredCount")
        .serviceNamespace("ecs")
        .dependsOn(List.of(service))  // Critical fix: explicit dependency
        .build();
```
Adds explicit `dependsOn(List.of(service))` to ensure the ECS service is fully created before the auto scaling target attempts to register.

---

#### 3. CloudWatch Dashboard Metrics Array Format Error

**Error Message:**
```
Error: putting CloudWatch Dashboard (fintech-payment-prod): operation error CloudWatch: PutDashboard, https response error StatusCode: 400, RequestID: 12d23ef2-7a0b-43e9-9ba4-6050dcf0634f, InvalidParameterInput: The dashboard body is invalid, there are 6 validation errors:
[
  {
    "dataPath": "/widgets/1/properties/metrics/0",
    "message": "Should NOT have more than 2 items"
  },
  ...
]
```

**Model Response:**
Used incorrect metrics array format with Map objects for dimensions:
```java
// INCORRECT format that caused the error:
List.of(List.of("AWS/ECS", "CPUUtilization", Map.of("ClusterName", clusterName)))
```

This creates a nested structure like `["AWS/ECS", "CPUUtilization", {"ClusterName": "..."}]` which CloudWatch Dashboard API rejects as having "more than 2 items" because the Map is treated as an additional item.

**Actual Implementation (MonitoringConstruct.java:127-132):**
```java
// CORRECT flat array format:
widgets.add(createMetricWidget("Cluster CPU Utilization", List.of(List.of("AWS/ECS", "CPUUtilization",
        "ClusterName", clusterName)), 0, 1)
);
widgets.add(createMetricWidget("Cluster Memory Utilization", List.of(List.of("AWS/ECS", "MemoryUtilization",
        "ClusterName", clusterName)), 12, 1)
);
```

And in service-specific metrics (lines 141-154):
```java
widgets.add(createMetricWidget(service.serviceName() + " CPU",
        List.of(List.of("AWS/ECS", "CPUUtilization",
                "ClusterName", clusterName,
                "ServiceName", service.serviceName()
        )),
        0, yPosition
));
```

Uses flat array format: `["Namespace", "MetricName", "DimensionName1", "DimensionValue1", "DimensionName2", "DimensionValue2"]` as required by CloudWatch Dashboard metrics API specification.

---

#### 4. Target Group Not Attached to Load Balancer

**Error Message:**
```
Error: creating ECS Service (payment-service): operation error ECS: CreateService, https response error StatusCode: 400, RequestID: f87007f5-4051-4f59-aa77-8b6a43e2770b, InvalidParameterException: The target group with targetGroupArn arn:aws:elasticloadbalancing:us-east-1:***:targetgroup/fintech-payment-payment-service/c2a43bc70a9f3d1c does not have an associated load balancer.

  with aws_ecs_service.payment-service_0EF3626E (payment-service/service),
  on cdk.tf.json line 665, in resource.aws_ecs_service.payment-service_0EF3626E (payment-service/service):
  665:       }
```

**Model Response:**
Created target groups and HTTPS listener but failed to create ALB listener rules to attach target groups to the listener. Without listener rules, target groups are orphaned and cannot receive traffic from the load balancer.

**Actual Implementation (LoadBalancerConstruct.java:151-189):**
```java
if (!targetGroups.isEmpty()) {
    // Create HTTPS Listener with fixed response as default
    AlbListener httpsListener = AlbListener.Builder.create(this, "alb-https-listener")
            .loadBalancerArn(alb.getArn())
            .port(443)
            .protocol("HTTPS")
            .sslPolicy("ELBSecurityPolicy-TLS-1-2-2017-01")
            .certificateArn(sslCert.getArn())
            .defaultAction(List.of(AlbListenerDefaultAction.builder()
                    .type("fixed-response")
                    .fixedResponse(AlbListenerDefaultActionFixedResponse.builder()
                            .contentType("text/plain")
                            .messageBody("Service not found")
                            .statusCode("404")
                            .build())
                    .build()))
            .build();

    // Create listener rules for each service - CRITICAL FIX
    int priority = 1;
    for (ServiceConfig service : services) {
        AlbTargetGroup tg = targetGroups.get(service.serviceName());
        if (tg != null) {
            AlbListenerRule.Builder.create(this, service.serviceName() + "-rule")
                    .listenerArn(httpsListener.getArn())
                    .priority(priority++)
                    .action(List.of(AlbListenerRuleAction.builder()
                            .type("forward")
                            .targetGroupArn(tg.getArn())
                            .build()))
                    .condition(List.of(AlbListenerRuleCondition.builder()
                            .pathPattern(AlbListenerRuleConditionPathPattern.builder()
                                    .values(List.of("/" + service.serviceName() + "/*", "/" + service.serviceName()))
                                    .build())
                            .build()))
                    .build();
        }
    }
}
```

Creates `AlbListenerRule` resources for each service with:
- Path-based routing conditions (`/payment-service/*`, `/payment-service`)
- Forward actions to respective target groups
- Priority ordering for rule evaluation

This properly attaches target groups to the HTTPS listener, enabling traffic flow: ALB ’ Listener ’ Listener Rule ’ Target Group ’ ECS Tasks.

---

#### 5. Service Discovery Deletion Without Force Destroy

**Error Message (reported in subsequent deployment):**
```
Error: deleting Service Discovery Service (srv-xxx): Service contains registered instances; delete the instances before deleting the service
```

**Model Response:**
Initially used incorrect API `forceDelete(true)` which doesn't exist in the CDKTF provider, causing compilation errors.

**Attempted Fix (ServiceDiscoveryConstruct.java - first attempt):**
```java
// INCORRECT - forceDelete doesn't exist
ServiceDiscoveryService.Builder.create(this, config.serviceName() + "-discovery")
    .forceDelete(true)  // L Compilation error: Cannot resolve method 'forceDelete' in 'Builder'
```

**Actual Implementation:**
The fix required using constructor-based approach with `ServiceDiscoveryServiceConfig` instead of builder pattern:

```java
// Correct approach using constructor with Config:
ServiceDiscoveryService service = new ServiceDiscoveryService(this,
        config.serviceName() + "-discovery",
        ServiceDiscoveryServiceConfig.builder()
                .name(config.serviceName())
                .dnsConfig(ServiceDiscoveryServiceDnsConfig.builder()
                        .namespaceId(namespace.getId())
                        .dnsRecords(List.of(ServiceDiscoveryServiceDnsConfigDnsRecords.builder()
                                .ttl(10)
                                .type("A")
                                .build()))
                        .routingPolicy("MULTIVALUE")
                        .build())
                .healthCheckCustomConfig(ServiceDiscoveryServiceHealthCheckCustomConfig.builder()
                        .failureThreshold(3)
                        .build())
                .forceDestroy(true)  //  Available in Config builder
                .tags(appConfig.tags())
                .build()
);
```

The key insight is that `forceDestroy` is only available through `ServiceDiscoveryServiceConfig.builder()`, not through `ServiceDiscoveryService.Builder.create()`.

---

## Summary of Critical Fixes

1. **String Validation**: Post-truncation validation to remove trailing hyphens for AWS naming compliance
2. **Resource Dependencies**: Explicit `dependsOn` declarations for proper Terraform execution ordering
3. **API Format Compliance**: Flat array format for CloudWatch Dashboard metrics instead of nested Maps
4. **Resource Attachment**: Creating ALB listener rules to properly attach target groups to listeners
5. **API Knowledge**: Understanding difference between CDKTF Builder pattern and Config-based constructors for accessing all resource options
