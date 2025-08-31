package imports.aws.backup_restore_testing_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.120Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.backupRestoreTestingPlan.BackupRestoreTestingPlanRecoveryPointSelectionOutputReference")
public class BackupRestoreTestingPlanRecoveryPointSelectionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BackupRestoreTestingPlanRecoveryPointSelectionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BackupRestoreTestingPlanRecoveryPointSelectionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public BackupRestoreTestingPlanRecoveryPointSelectionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetExcludeVaults() {
        software.amazon.jsii.Kernel.call(this, "resetExcludeVaults", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSelectionWindowDays() {
        software.amazon.jsii.Kernel.call(this, "resetSelectionWindowDays", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAlgorithmInput() {
        return software.amazon.jsii.Kernel.get(this, "algorithmInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExcludeVaultsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "excludeVaultsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIncludeVaultsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "includeVaultsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getRecoveryPointTypesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "recoveryPointTypesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSelectionWindowDaysInput() {
        return software.amazon.jsii.Kernel.get(this, "selectionWindowDaysInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAlgorithm() {
        return software.amazon.jsii.Kernel.get(this, "algorithm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAlgorithm(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "algorithm", java.util.Objects.requireNonNull(value, "algorithm is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getExcludeVaults() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "excludeVaults", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setExcludeVaults(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "excludeVaults", java.util.Objects.requireNonNull(value, "excludeVaults is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getIncludeVaults() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "includeVaults", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setIncludeVaults(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "includeVaults", java.util.Objects.requireNonNull(value, "includeVaults is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getRecoveryPointTypes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "recoveryPointTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setRecoveryPointTypes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "recoveryPointTypes", java.util.Objects.requireNonNull(value, "recoveryPointTypes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSelectionWindowDays() {
        return software.amazon.jsii.Kernel.get(this, "selectionWindowDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSelectionWindowDays(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "selectionWindowDays", java.util.Objects.requireNonNull(value, "selectionWindowDays is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.backup_restore_testing_plan.BackupRestoreTestingPlanRecoveryPointSelection value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
