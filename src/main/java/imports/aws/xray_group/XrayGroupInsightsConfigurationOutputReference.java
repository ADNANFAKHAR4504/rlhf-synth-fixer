package imports.aws.xray_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.696Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.xrayGroup.XrayGroupInsightsConfigurationOutputReference")
public class XrayGroupInsightsConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected XrayGroupInsightsConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected XrayGroupInsightsConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public XrayGroupInsightsConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetNotificationsEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetNotificationsEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInsightsEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "insightsEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNotificationsEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "notificationsEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getInsightsEnabled() {
        return software.amazon.jsii.Kernel.get(this, "insightsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInsightsEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "insightsEnabled", java.util.Objects.requireNonNull(value, "insightsEnabled is required"));
    }

    public void setInsightsEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "insightsEnabled", java.util.Objects.requireNonNull(value, "insightsEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getNotificationsEnabled() {
        return software.amazon.jsii.Kernel.get(this, "notificationsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setNotificationsEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "notificationsEnabled", java.util.Objects.requireNonNull(value, "notificationsEnabled is required"));
    }

    public void setNotificationsEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "notificationsEnabled", java.util.Objects.requireNonNull(value, "notificationsEnabled is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.xray_group.XrayGroupInsightsConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.xray_group.XrayGroupInsightsConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.xray_group.XrayGroupInsightsConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
