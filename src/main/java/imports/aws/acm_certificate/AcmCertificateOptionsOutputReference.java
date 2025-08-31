package imports.aws.acm_certificate;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.892Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.acmCertificate.AcmCertificateOptionsOutputReference")
public class AcmCertificateOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AcmCertificateOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AcmCertificateOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AcmCertificateOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetCertificateTransparencyLoggingPreference() {
        software.amazon.jsii.Kernel.call(this, "resetCertificateTransparencyLoggingPreference", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCertificateTransparencyLoggingPreferenceInput() {
        return software.amazon.jsii.Kernel.get(this, "certificateTransparencyLoggingPreferenceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCertificateTransparencyLoggingPreference() {
        return software.amazon.jsii.Kernel.get(this, "certificateTransparencyLoggingPreference", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCertificateTransparencyLoggingPreference(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "certificateTransparencyLoggingPreference", java.util.Objects.requireNonNull(value, "certificateTransparencyLoggingPreference is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.acm_certificate.AcmCertificateOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.acm_certificate.AcmCertificateOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.acm_certificate.AcmCertificateOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
