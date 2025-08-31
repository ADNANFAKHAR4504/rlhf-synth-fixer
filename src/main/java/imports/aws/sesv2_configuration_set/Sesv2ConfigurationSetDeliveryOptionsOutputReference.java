package imports.aws.sesv2_configuration_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.456Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesv2ConfigurationSet.Sesv2ConfigurationSetDeliveryOptionsOutputReference")
public class Sesv2ConfigurationSetDeliveryOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Sesv2ConfigurationSetDeliveryOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Sesv2ConfigurationSetDeliveryOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Sesv2ConfigurationSetDeliveryOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetMaxDeliverySeconds() {
        software.amazon.jsii.Kernel.call(this, "resetMaxDeliverySeconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSendingPoolName() {
        software.amazon.jsii.Kernel.call(this, "resetSendingPoolName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTlsPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetTlsPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxDeliverySecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "maxDeliverySecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSendingPoolNameInput() {
        return software.amazon.jsii.Kernel.get(this, "sendingPoolNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTlsPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "tlsPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxDeliverySeconds() {
        return software.amazon.jsii.Kernel.get(this, "maxDeliverySeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxDeliverySeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxDeliverySeconds", java.util.Objects.requireNonNull(value, "maxDeliverySeconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSendingPoolName() {
        return software.amazon.jsii.Kernel.get(this, "sendingPoolName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSendingPoolName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sendingPoolName", java.util.Objects.requireNonNull(value, "sendingPoolName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTlsPolicy() {
        return software.amazon.jsii.Kernel.get(this, "tlsPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTlsPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tlsPolicy", java.util.Objects.requireNonNull(value, "tlsPolicy is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetDeliveryOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetDeliveryOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetDeliveryOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
