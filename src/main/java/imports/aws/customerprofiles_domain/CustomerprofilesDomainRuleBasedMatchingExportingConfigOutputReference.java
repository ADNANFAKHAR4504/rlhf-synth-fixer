package imports.aws.customerprofiles_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.403Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.customerprofilesDomain.CustomerprofilesDomainRuleBasedMatchingExportingConfigOutputReference")
public class CustomerprofilesDomainRuleBasedMatchingExportingConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CustomerprofilesDomainRuleBasedMatchingExportingConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CustomerprofilesDomainRuleBasedMatchingExportingConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CustomerprofilesDomainRuleBasedMatchingExportingConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putS3Exporting(final @org.jetbrains.annotations.NotNull imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting value) {
        software.amazon.jsii.Kernel.call(this, "putS3Exporting", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetS3Exporting() {
        software.amazon.jsii.Kernel.call(this, "resetS3Exporting", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingExportingConfigS3ExportingOutputReference getS3Exporting() {
        return software.amazon.jsii.Kernel.get(this, "s3Exporting", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingExportingConfigS3ExportingOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting getS3ExportingInput() {
        return software.amazon.jsii.Kernel.get(this, "s3ExportingInput", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingExportingConfigS3Exporting.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingExportingConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingExportingConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingExportingConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
