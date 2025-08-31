package imports.aws.ses_configuration_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.446Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesConfigurationSet.SesConfigurationSetTrackingOptionsOutputReference")
public class SesConfigurationSetTrackingOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SesConfigurationSetTrackingOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SesConfigurationSetTrackingOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SesConfigurationSetTrackingOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetCustomRedirectDomain() {
        software.amazon.jsii.Kernel.call(this, "resetCustomRedirectDomain", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomRedirectDomainInput() {
        return software.amazon.jsii.Kernel.get(this, "customRedirectDomainInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomRedirectDomain() {
        return software.amazon.jsii.Kernel.get(this, "customRedirectDomain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomRedirectDomain(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customRedirectDomain", java.util.Objects.requireNonNull(value, "customRedirectDomain is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ses_configuration_set.SesConfigurationSetTrackingOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ses_configuration_set.SesConfigurationSetTrackingOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ses_configuration_set.SesConfigurationSetTrackingOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
