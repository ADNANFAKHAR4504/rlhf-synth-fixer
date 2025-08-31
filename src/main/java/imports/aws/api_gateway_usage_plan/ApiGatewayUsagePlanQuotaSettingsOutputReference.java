package imports.aws.api_gateway_usage_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.961Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apiGatewayUsagePlan.ApiGatewayUsagePlanQuotaSettingsOutputReference")
public class ApiGatewayUsagePlanQuotaSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ApiGatewayUsagePlanQuotaSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ApiGatewayUsagePlanQuotaSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ApiGatewayUsagePlanQuotaSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetOffset() {
        software.amazon.jsii.Kernel.call(this, "resetOffset", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getLimitInput() {
        return software.amazon.jsii.Kernel.get(this, "limitInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getOffsetInput() {
        return software.amazon.jsii.Kernel.get(this, "offsetInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPeriodInput() {
        return software.amazon.jsii.Kernel.get(this, "periodInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getLimit() {
        return software.amazon.jsii.Kernel.get(this, "limit", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setLimit(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "limit", java.util.Objects.requireNonNull(value, "limit is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getOffset() {
        return software.amazon.jsii.Kernel.get(this, "offset", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setOffset(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "offset", java.util.Objects.requireNonNull(value, "offset is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPeriod() {
        return software.amazon.jsii.Kernel.get(this, "period", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPeriod(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "period", java.util.Objects.requireNonNull(value, "period is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.api_gateway_usage_plan.ApiGatewayUsagePlanQuotaSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.api_gateway_usage_plan.ApiGatewayUsagePlanQuotaSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.api_gateway_usage_plan.ApiGatewayUsagePlanQuotaSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
