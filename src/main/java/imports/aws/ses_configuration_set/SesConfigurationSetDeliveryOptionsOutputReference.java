package imports.aws.ses_configuration_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.446Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesConfigurationSet.SesConfigurationSetDeliveryOptionsOutputReference")
public class SesConfigurationSetDeliveryOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SesConfigurationSetDeliveryOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SesConfigurationSetDeliveryOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SesConfigurationSetDeliveryOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetTlsPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetTlsPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTlsPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "tlsPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTlsPolicy() {
        return software.amazon.jsii.Kernel.get(this, "tlsPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTlsPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tlsPolicy", java.util.Objects.requireNonNull(value, "tlsPolicy is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ses_configuration_set.SesConfigurationSetDeliveryOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ses_configuration_set.SesConfigurationSetDeliveryOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ses_configuration_set.SesConfigurationSetDeliveryOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
