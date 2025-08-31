package imports.aws.sesv2_configuration_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.456Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesv2ConfigurationSet.Sesv2ConfigurationSetTrackingOptionsOutputReference")
public class Sesv2ConfigurationSetTrackingOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Sesv2ConfigurationSetTrackingOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Sesv2ConfigurationSetTrackingOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Sesv2ConfigurationSetTrackingOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetHttpsPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetHttpsPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomRedirectDomainInput() {
        return software.amazon.jsii.Kernel.get(this, "customRedirectDomainInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHttpsPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "httpsPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomRedirectDomain() {
        return software.amazon.jsii.Kernel.get(this, "customRedirectDomain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomRedirectDomain(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customRedirectDomain", java.util.Objects.requireNonNull(value, "customRedirectDomain is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHttpsPolicy() {
        return software.amazon.jsii.Kernel.get(this, "httpsPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHttpsPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "httpsPolicy", java.util.Objects.requireNonNull(value, "httpsPolicy is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetTrackingOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetTrackingOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetTrackingOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
