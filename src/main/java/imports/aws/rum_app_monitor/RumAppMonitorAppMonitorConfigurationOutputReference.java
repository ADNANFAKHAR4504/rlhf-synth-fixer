package imports.aws.rum_app_monitor;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.238Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rumAppMonitor.RumAppMonitorAppMonitorConfigurationOutputReference")
public class RumAppMonitorAppMonitorConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected RumAppMonitorAppMonitorConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected RumAppMonitorAppMonitorConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public RumAppMonitorAppMonitorConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAllowCookies() {
        software.amazon.jsii.Kernel.call(this, "resetAllowCookies", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableXray() {
        software.amazon.jsii.Kernel.call(this, "resetEnableXray", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExcludedPages() {
        software.amazon.jsii.Kernel.call(this, "resetExcludedPages", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFavoritePages() {
        software.amazon.jsii.Kernel.call(this, "resetFavoritePages", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGuestRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetGuestRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIdentityPoolId() {
        software.amazon.jsii.Kernel.call(this, "resetIdentityPoolId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludedPages() {
        software.amazon.jsii.Kernel.call(this, "resetIncludedPages", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSessionSampleRate() {
        software.amazon.jsii.Kernel.call(this, "resetSessionSampleRate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTelemetries() {
        software.amazon.jsii.Kernel.call(this, "resetTelemetries", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAllowCookiesInput() {
        return software.amazon.jsii.Kernel.get(this, "allowCookiesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableXrayInput() {
        return software.amazon.jsii.Kernel.get(this, "enableXrayInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExcludedPagesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "excludedPagesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getFavoritePagesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "favoritePagesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGuestRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "guestRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdentityPoolIdInput() {
        return software.amazon.jsii.Kernel.get(this, "identityPoolIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIncludedPagesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "includedPagesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSessionSampleRateInput() {
        return software.amazon.jsii.Kernel.get(this, "sessionSampleRateInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTelemetriesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "telemetriesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAllowCookies() {
        return software.amazon.jsii.Kernel.get(this, "allowCookies", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAllowCookies(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "allowCookies", java.util.Objects.requireNonNull(value, "allowCookies is required"));
    }

    public void setAllowCookies(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "allowCookies", java.util.Objects.requireNonNull(value, "allowCookies is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableXray() {
        return software.amazon.jsii.Kernel.get(this, "enableXray", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableXray(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableXray", java.util.Objects.requireNonNull(value, "enableXray is required"));
    }

    public void setEnableXray(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableXray", java.util.Objects.requireNonNull(value, "enableXray is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getExcludedPages() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "excludedPages", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setExcludedPages(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "excludedPages", java.util.Objects.requireNonNull(value, "excludedPages is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getFavoritePages() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "favoritePages", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setFavoritePages(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "favoritePages", java.util.Objects.requireNonNull(value, "favoritePages is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGuestRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "guestRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGuestRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "guestRoleArn", java.util.Objects.requireNonNull(value, "guestRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIdentityPoolId() {
        return software.amazon.jsii.Kernel.get(this, "identityPoolId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIdentityPoolId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "identityPoolId", java.util.Objects.requireNonNull(value, "identityPoolId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getIncludedPages() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "includedPages", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setIncludedPages(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "includedPages", java.util.Objects.requireNonNull(value, "includedPages is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSessionSampleRate() {
        return software.amazon.jsii.Kernel.get(this, "sessionSampleRate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSessionSampleRate(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "sessionSampleRate", java.util.Objects.requireNonNull(value, "sessionSampleRate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTelemetries() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "telemetries", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTelemetries(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "telemetries", java.util.Objects.requireNonNull(value, "telemetries is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.rum_app_monitor.RumAppMonitorAppMonitorConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.rum_app_monitor.RumAppMonitorAppMonitorConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.rum_app_monitor.RumAppMonitorAppMonitorConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
