package imports.aws.sesv2_configuration_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.456Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesv2ConfigurationSet.Sesv2ConfigurationSetSendingOptionsOutputReference")
public class Sesv2ConfigurationSetSendingOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Sesv2ConfigurationSetSendingOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Sesv2ConfigurationSetSendingOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Sesv2ConfigurationSetSendingOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetSendingEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetSendingEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSendingEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "sendingEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSendingEnabled() {
        return software.amazon.jsii.Kernel.get(this, "sendingEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSendingEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "sendingEnabled", java.util.Objects.requireNonNull(value, "sendingEnabled is required"));
    }

    public void setSendingEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "sendingEnabled", java.util.Objects.requireNonNull(value, "sendingEnabled is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetSendingOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetSendingOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetSendingOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
