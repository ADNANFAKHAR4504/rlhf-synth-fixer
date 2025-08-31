package imports.aws.backup_report_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.119Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.backupReportPlan.BackupReportPlanReportSettingOutputReference")
public class BackupReportPlanReportSettingOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BackupReportPlanReportSettingOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BackupReportPlanReportSettingOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public BackupReportPlanReportSettingOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAccounts() {
        software.amazon.jsii.Kernel.call(this, "resetAccounts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFrameworkArns() {
        software.amazon.jsii.Kernel.call(this, "resetFrameworkArns", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNumberOfFrameworks() {
        software.amazon.jsii.Kernel.call(this, "resetNumberOfFrameworks", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOrganizationUnits() {
        software.amazon.jsii.Kernel.call(this, "resetOrganizationUnits", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRegions() {
        software.amazon.jsii.Kernel.call(this, "resetRegions", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAccountsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "accountsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getFrameworkArnsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "frameworkArnsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getNumberOfFrameworksInput() {
        return software.amazon.jsii.Kernel.get(this, "numberOfFrameworksInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getOrganizationUnitsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "organizationUnitsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getRegionsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "regionsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getReportTemplateInput() {
        return software.amazon.jsii.Kernel.get(this, "reportTemplateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAccounts() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "accounts", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAccounts(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "accounts", java.util.Objects.requireNonNull(value, "accounts is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getFrameworkArns() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "frameworkArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setFrameworkArns(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "frameworkArns", java.util.Objects.requireNonNull(value, "frameworkArns is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getNumberOfFrameworks() {
        return software.amazon.jsii.Kernel.get(this, "numberOfFrameworks", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setNumberOfFrameworks(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "numberOfFrameworks", java.util.Objects.requireNonNull(value, "numberOfFrameworks is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getOrganizationUnits() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "organizationUnits", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setOrganizationUnits(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "organizationUnits", java.util.Objects.requireNonNull(value, "organizationUnits is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getRegions() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "regions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setRegions(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "regions", java.util.Objects.requireNonNull(value, "regions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReportTemplate() {
        return software.amazon.jsii.Kernel.get(this, "reportTemplate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setReportTemplate(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "reportTemplate", java.util.Objects.requireNonNull(value, "reportTemplate is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.backup_report_plan.BackupReportPlanReportSetting getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.backup_report_plan.BackupReportPlanReportSetting.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.backup_report_plan.BackupReportPlanReportSetting value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
