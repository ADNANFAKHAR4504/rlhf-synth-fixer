package imports.aws.api_gateway_usage_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.961Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apiGatewayUsagePlan.ApiGatewayUsagePlanThrottleSettingsOutputReference")
public class ApiGatewayUsagePlanThrottleSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ApiGatewayUsagePlanThrottleSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ApiGatewayUsagePlanThrottleSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ApiGatewayUsagePlanThrottleSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetBurstLimit() {
        software.amazon.jsii.Kernel.call(this, "resetBurstLimit", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRateLimit() {
        software.amazon.jsii.Kernel.call(this, "resetRateLimit", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBurstLimitInput() {
        return software.amazon.jsii.Kernel.get(this, "burstLimitInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRateLimitInput() {
        return software.amazon.jsii.Kernel.get(this, "rateLimitInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBurstLimit() {
        return software.amazon.jsii.Kernel.get(this, "burstLimit", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBurstLimit(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "burstLimit", java.util.Objects.requireNonNull(value, "burstLimit is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRateLimit() {
        return software.amazon.jsii.Kernel.get(this, "rateLimit", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRateLimit(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "rateLimit", java.util.Objects.requireNonNull(value, "rateLimit is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.api_gateway_usage_plan.ApiGatewayUsagePlanThrottleSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.api_gateway_usage_plan.ApiGatewayUsagePlanThrottleSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.api_gateway_usage_plan.ApiGatewayUsagePlanThrottleSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
