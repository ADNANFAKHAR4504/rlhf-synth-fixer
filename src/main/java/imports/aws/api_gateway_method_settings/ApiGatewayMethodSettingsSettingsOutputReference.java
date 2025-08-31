package imports.aws.api_gateway_method_settings;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.950Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apiGatewayMethodSettings.ApiGatewayMethodSettingsSettingsOutputReference")
public class ApiGatewayMethodSettingsSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ApiGatewayMethodSettingsSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ApiGatewayMethodSettingsSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ApiGatewayMethodSettingsSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetCacheDataEncrypted() {
        software.amazon.jsii.Kernel.call(this, "resetCacheDataEncrypted", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCacheTtlInSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetCacheTtlInSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCachingEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetCachingEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDataTraceEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetDataTraceEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLoggingLevel() {
        software.amazon.jsii.Kernel.call(this, "resetLoggingLevel", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMetricsEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetMetricsEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRequireAuthorizationForCacheControl() {
        software.amazon.jsii.Kernel.call(this, "resetRequireAuthorizationForCacheControl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetThrottlingBurstLimit() {
        software.amazon.jsii.Kernel.call(this, "resetThrottlingBurstLimit", software.amazon.jsii.NativeType.VOID);
    }

    public void resetThrottlingRateLimit() {
        software.amazon.jsii.Kernel.call(this, "resetThrottlingRateLimit", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUnauthorizedCacheControlHeaderStrategy() {
        software.amazon.jsii.Kernel.call(this, "resetUnauthorizedCacheControlHeaderStrategy", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCacheDataEncryptedInput() {
        return software.amazon.jsii.Kernel.get(this, "cacheDataEncryptedInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getCacheTtlInSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "cacheTtlInSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCachingEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "cachingEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDataTraceEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "dataTraceEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLoggingLevelInput() {
        return software.amazon.jsii.Kernel.get(this, "loggingLevelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMetricsEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "metricsEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRequireAuthorizationForCacheControlInput() {
        return software.amazon.jsii.Kernel.get(this, "requireAuthorizationForCacheControlInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getThrottlingBurstLimitInput() {
        return software.amazon.jsii.Kernel.get(this, "throttlingBurstLimitInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getThrottlingRateLimitInput() {
        return software.amazon.jsii.Kernel.get(this, "throttlingRateLimitInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUnauthorizedCacheControlHeaderStrategyInput() {
        return software.amazon.jsii.Kernel.get(this, "unauthorizedCacheControlHeaderStrategyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getCacheDataEncrypted() {
        return software.amazon.jsii.Kernel.get(this, "cacheDataEncrypted", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setCacheDataEncrypted(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "cacheDataEncrypted", java.util.Objects.requireNonNull(value, "cacheDataEncrypted is required"));
    }

    public void setCacheDataEncrypted(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "cacheDataEncrypted", java.util.Objects.requireNonNull(value, "cacheDataEncrypted is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getCacheTtlInSeconds() {
        return software.amazon.jsii.Kernel.get(this, "cacheTtlInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setCacheTtlInSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "cacheTtlInSeconds", java.util.Objects.requireNonNull(value, "cacheTtlInSeconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getCachingEnabled() {
        return software.amazon.jsii.Kernel.get(this, "cachingEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setCachingEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "cachingEnabled", java.util.Objects.requireNonNull(value, "cachingEnabled is required"));
    }

    public void setCachingEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "cachingEnabled", java.util.Objects.requireNonNull(value, "cachingEnabled is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getLoggingLevel() {
        return software.amazon.jsii.Kernel.get(this, "loggingLevel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLoggingLevel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "loggingLevel", java.util.Objects.requireNonNull(value, "loggingLevel is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getMetricsEnabled() {
        return software.amazon.jsii.Kernel.get(this, "metricsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setMetricsEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "metricsEnabled", java.util.Objects.requireNonNull(value, "metricsEnabled is required"));
    }

    public void setMetricsEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "metricsEnabled", java.util.Objects.requireNonNull(value, "metricsEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getRequireAuthorizationForCacheControl() {
        return software.amazon.jsii.Kernel.get(this, "requireAuthorizationForCacheControl", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setRequireAuthorizationForCacheControl(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "requireAuthorizationForCacheControl", java.util.Objects.requireNonNull(value, "requireAuthorizationForCacheControl is required"));
    }

    public void setRequireAuthorizationForCacheControl(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "requireAuthorizationForCacheControl", java.util.Objects.requireNonNull(value, "requireAuthorizationForCacheControl is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getUnauthorizedCacheControlHeaderStrategy() {
        return software.amazon.jsii.Kernel.get(this, "unauthorizedCacheControlHeaderStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUnauthorizedCacheControlHeaderStrategy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "unauthorizedCacheControlHeaderStrategy", java.util.Objects.requireNonNull(value, "unauthorizedCacheControlHeaderStrategy is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.api_gateway_method_settings.ApiGatewayMethodSettingsSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.api_gateway_method_settings.ApiGatewayMethodSettingsSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.api_gateway_method_settings.ApiGatewayMethodSettingsSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
