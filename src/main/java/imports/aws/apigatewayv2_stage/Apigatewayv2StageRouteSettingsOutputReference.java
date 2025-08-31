package imports.aws.apigatewayv2_stage;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.974Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apigatewayv2Stage.Apigatewayv2StageRouteSettingsOutputReference")
public class Apigatewayv2StageRouteSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Apigatewayv2StageRouteSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Apigatewayv2StageRouteSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public Apigatewayv2StageRouteSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetDataTraceEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetDataTraceEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDetailedMetricsEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetDetailedMetricsEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLoggingLevel() {
        software.amazon.jsii.Kernel.call(this, "resetLoggingLevel", software.amazon.jsii.NativeType.VOID);
    }

    public void resetThrottlingBurstLimit() {
        software.amazon.jsii.Kernel.call(this, "resetThrottlingBurstLimit", software.amazon.jsii.NativeType.VOID);
    }

    public void resetThrottlingRateLimit() {
        software.amazon.jsii.Kernel.call(this, "resetThrottlingRateLimit", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDataTraceEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "dataTraceEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDetailedMetricsEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "detailedMetricsEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLoggingLevelInput() {
        return software.amazon.jsii.Kernel.get(this, "loggingLevelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRouteKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "routeKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getThrottlingBurstLimitInput() {
        return software.amazon.jsii.Kernel.get(this, "throttlingBurstLimitInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getThrottlingRateLimitInput() {
        return software.amazon.jsii.Kernel.get(this, "throttlingRateLimitInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDataTraceEnabled() {
        return software.amazon.jsii.Kernel.get(this, "dataTraceEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDataTraceEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "dataTraceEnabled", java.util.Objects.requireNonNull(value, "dataTraceEnabled is required"));
    }

    public void setDataTraceEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "dataTraceEnabled", java.util.Objects.requireNonNull(value, "dataTraceEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDetailedMetricsEnabled() {
        return software.amazon.jsii.Kernel.get(this, "detailedMetricsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDetailedMetricsEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "detailedMetricsEnabled", java.util.Objects.requireNonNull(value, "detailedMetricsEnabled is required"));
    }

    public void setDetailedMetricsEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "detailedMetricsEnabled", java.util.Objects.requireNonNull(value, "detailedMetricsEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLoggingLevel() {
        return software.amazon.jsii.Kernel.get(this, "loggingLevel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLoggingLevel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "loggingLevel", java.util.Objects.requireNonNull(value, "loggingLevel is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRouteKey() {
        return software.amazon.jsii.Kernel.get(this, "routeKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRouteKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "routeKey", java.util.Objects.requireNonNull(value, "routeKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getThrottlingBurstLimit() {
        return software.amazon.jsii.Kernel.get(this, "throttlingBurstLimit", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setThrottlingBurstLimit(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "throttlingBurstLimit", java.util.Objects.requireNonNull(value, "throttlingBurstLimit is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getThrottlingRateLimit() {
        return software.amazon.jsii.Kernel.get(this, "throttlingRateLimit", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setThrottlingRateLimit(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "throttlingRateLimit", java.util.Objects.requireNonNull(value, "throttlingRateLimit is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.apigatewayv2_stage.Apigatewayv2StageRouteSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
