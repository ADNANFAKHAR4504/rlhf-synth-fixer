package imports.aws.amplify_domain_association;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.935Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.amplifyDomainAssociation.AmplifyDomainAssociationCertificateSettingsOutputReference")
public class AmplifyDomainAssociationCertificateSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AmplifyDomainAssociationCertificateSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AmplifyDomainAssociationCertificateSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AmplifyDomainAssociationCertificateSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetCustomCertificateArn() {
        software.amazon.jsii.Kernel.call(this, "resetCustomCertificateArn", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCertificateVerificationDnsRecord() {
        return software.amazon.jsii.Kernel.get(this, "certificateVerificationDnsRecord", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomCertificateArnInput() {
        return software.amazon.jsii.Kernel.get(this, "customCertificateArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomCertificateArn() {
        return software.amazon.jsii.Kernel.get(this, "customCertificateArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomCertificateArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customCertificateArn", java.util.Objects.requireNonNull(value, "customCertificateArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.amplify_domain_association.AmplifyDomainAssociationCertificateSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.amplify_domain_association.AmplifyDomainAssociationCertificateSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.amplify_domain_association.AmplifyDomainAssociationCertificateSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
