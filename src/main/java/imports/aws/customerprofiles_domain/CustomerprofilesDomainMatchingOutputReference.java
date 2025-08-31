package imports.aws.customerprofiles_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.403Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.customerprofilesDomain.CustomerprofilesDomainMatchingOutputReference")
public class CustomerprofilesDomainMatchingOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CustomerprofilesDomainMatchingOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CustomerprofilesDomainMatchingOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CustomerprofilesDomainMatchingOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAutoMerging(final @org.jetbrains.annotations.NotNull imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMerging value) {
        software.amazon.jsii.Kernel.call(this, "putAutoMerging", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putExportingConfig(final @org.jetbrains.annotations.NotNull imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingExportingConfig value) {
        software.amazon.jsii.Kernel.call(this, "putExportingConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putJobSchedule(final @org.jetbrains.annotations.NotNull imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingJobSchedule value) {
        software.amazon.jsii.Kernel.call(this, "putJobSchedule", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAutoMerging() {
        software.amazon.jsii.Kernel.call(this, "resetAutoMerging", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExportingConfig() {
        software.amazon.jsii.Kernel.call(this, "resetExportingConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetJobSchedule() {
        software.amazon.jsii.Kernel.call(this, "resetJobSchedule", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMergingOutputReference getAutoMerging() {
        return software.amazon.jsii.Kernel.get(this, "autoMerging", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMergingOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingExportingConfigOutputReference getExportingConfig() {
        return software.amazon.jsii.Kernel.get(this, "exportingConfig", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingExportingConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingJobScheduleOutputReference getJobSchedule() {
        return software.amazon.jsii.Kernel.get(this, "jobSchedule", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingJobScheduleOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMerging getAutoMergingInput() {
        return software.amazon.jsii.Kernel.get(this, "autoMergingInput", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMerging.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "enabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingExportingConfig getExportingConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "exportingConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingExportingConfig.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingJobSchedule getJobScheduleInput() {
        return software.amazon.jsii.Kernel.get(this, "jobScheduleInput", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingJobSchedule.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnabled() {
        return software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainMatching getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainMatching.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainMatching value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
