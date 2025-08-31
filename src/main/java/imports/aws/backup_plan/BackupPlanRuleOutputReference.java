package imports.aws.backup_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.118Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.backupPlan.BackupPlanRuleOutputReference")
public class BackupPlanRuleOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BackupPlanRuleOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BackupPlanRuleOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public BackupPlanRuleOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putCopyAction(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.backup_plan.BackupPlanRuleCopyAction>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.backup_plan.BackupPlanRuleCopyAction> __cast_cd4240 = (java.util.List<imports.aws.backup_plan.BackupPlanRuleCopyAction>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.backup_plan.BackupPlanRuleCopyAction __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCopyAction", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLifecycle(final @org.jetbrains.annotations.NotNull imports.aws.backup_plan.BackupPlanRuleLifecycle value) {
        software.amazon.jsii.Kernel.call(this, "putLifecycle", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCompletionWindow() {
        software.amazon.jsii.Kernel.call(this, "resetCompletionWindow", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCopyAction() {
        software.amazon.jsii.Kernel.call(this, "resetCopyAction", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableContinuousBackup() {
        software.amazon.jsii.Kernel.call(this, "resetEnableContinuousBackup", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLifecycle() {
        software.amazon.jsii.Kernel.call(this, "resetLifecycle", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRecoveryPointTags() {
        software.amazon.jsii.Kernel.call(this, "resetRecoveryPointTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSchedule() {
        software.amazon.jsii.Kernel.call(this, "resetSchedule", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScheduleExpressionTimezone() {
        software.amazon.jsii.Kernel.call(this, "resetScheduleExpressionTimezone", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStartWindow() {
        software.amazon.jsii.Kernel.call(this, "resetStartWindow", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.backup_plan.BackupPlanRuleCopyActionList getCopyAction() {
        return software.amazon.jsii.Kernel.get(this, "copyAction", software.amazon.jsii.NativeType.forClass(imports.aws.backup_plan.BackupPlanRuleCopyActionList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.backup_plan.BackupPlanRuleLifecycleOutputReference getLifecycle() {
        return software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(imports.aws.backup_plan.BackupPlanRuleLifecycleOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getCompletionWindowInput() {
        return software.amazon.jsii.Kernel.get(this, "completionWindowInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCopyActionInput() {
        return software.amazon.jsii.Kernel.get(this, "copyActionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableContinuousBackupInput() {
        return software.amazon.jsii.Kernel.get(this, "enableContinuousBackupInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.backup_plan.BackupPlanRuleLifecycle getLifecycleInput() {
        return software.amazon.jsii.Kernel.get(this, "lifecycleInput", software.amazon.jsii.NativeType.forClass(imports.aws.backup_plan.BackupPlanRuleLifecycle.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getRecoveryPointTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "recoveryPointTagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRuleNameInput() {
        return software.amazon.jsii.Kernel.get(this, "ruleNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getScheduleExpressionTimezoneInput() {
        return software.amazon.jsii.Kernel.get(this, "scheduleExpressionTimezoneInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getScheduleInput() {
        return software.amazon.jsii.Kernel.get(this, "scheduleInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getStartWindowInput() {
        return software.amazon.jsii.Kernel.get(this, "startWindowInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTargetVaultNameInput() {
        return software.amazon.jsii.Kernel.get(this, "targetVaultNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getCompletionWindow() {
        return software.amazon.jsii.Kernel.get(this, "completionWindow", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setCompletionWindow(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "completionWindow", java.util.Objects.requireNonNull(value, "completionWindow is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableContinuousBackup() {
        return software.amazon.jsii.Kernel.get(this, "enableContinuousBackup", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableContinuousBackup(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableContinuousBackup", java.util.Objects.requireNonNull(value, "enableContinuousBackup is required"));
    }

    public void setEnableContinuousBackup(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableContinuousBackup", java.util.Objects.requireNonNull(value, "enableContinuousBackup is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getRecoveryPointTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "recoveryPointTags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setRecoveryPointTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "recoveryPointTags", java.util.Objects.requireNonNull(value, "recoveryPointTags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRuleName() {
        return software.amazon.jsii.Kernel.get(this, "ruleName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRuleName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ruleName", java.util.Objects.requireNonNull(value, "ruleName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSchedule() {
        return software.amazon.jsii.Kernel.get(this, "schedule", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSchedule(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "schedule", java.util.Objects.requireNonNull(value, "schedule is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getScheduleExpressionTimezone() {
        return software.amazon.jsii.Kernel.get(this, "scheduleExpressionTimezone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setScheduleExpressionTimezone(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "scheduleExpressionTimezone", java.util.Objects.requireNonNull(value, "scheduleExpressionTimezone is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getStartWindow() {
        return software.amazon.jsii.Kernel.get(this, "startWindow", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setStartWindow(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "startWindow", java.util.Objects.requireNonNull(value, "startWindow is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTargetVaultName() {
        return software.amazon.jsii.Kernel.get(this, "targetVaultName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTargetVaultName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "targetVaultName", java.util.Objects.requireNonNull(value, "targetVaultName is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.backup_plan.BackupPlanRule value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
