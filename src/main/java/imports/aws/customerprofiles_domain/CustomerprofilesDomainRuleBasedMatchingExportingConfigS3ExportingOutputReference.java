package imports.aws.customerprofiles_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.403Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.customerprofilesDomain.CustomerprofilesDomainRuleBasedMatchingExportingConfigS3ExportingOutputReference")
public class CustomerprofilesDomainRuleBasedMatchingExportingConfigS3ExportingOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CustomerprofilesDomainRuleBasedMatchingExportingConfigS3ExportingOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CustomerprofilesDomainRuleBasedMatchingExportingConfigS3ExportingOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CustomerprofilesDomainRuleBasedMatchingExportingConfigS3ExportingOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetS3KeyName() {
        software.amazon.jsii.Kernel.call(this, "resetS3KeyName", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3BucketNameInput() {
        return software.amazon.jsii.Kernel.get(this, "s3BucketNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3KeyNameInput() {
        return software.amazon.jsii.Kernel.get(this, "s3KeyNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3BucketName() {
        return software.amazon.jsii.Kernel.get(this, "s3BucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3BucketName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3BucketName", java.util.Objects.requireNonNull(value, "s3BucketName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3KeyName() {
        return software.amazon.jsii.Kernel.get(this, "s3KeyName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3KeyName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3KeyName", java.util.Objects.requireNonNull(value, "s3KeyName is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
