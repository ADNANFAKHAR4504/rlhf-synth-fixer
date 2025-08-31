package imports.aws.ssm_patch_baseline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.505Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmPatchBaseline.SsmPatchBaselineApprovalRuleOutputReference")
public class SsmPatchBaselineApprovalRuleOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SsmPatchBaselineApprovalRuleOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SsmPatchBaselineApprovalRuleOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public SsmPatchBaselineApprovalRuleOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putPatchFilter(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ssm_patch_baseline.SsmPatchBaselineApprovalRulePatchFilter>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ssm_patch_baseline.SsmPatchBaselineApprovalRulePatchFilter> __cast_cd4240 = (java.util.List<imports.aws.ssm_patch_baseline.SsmPatchBaselineApprovalRulePatchFilter>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ssm_patch_baseline.SsmPatchBaselineApprovalRulePatchFilter __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putPatchFilter", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetApproveAfterDays() {
        software.amazon.jsii.Kernel.call(this, "resetApproveAfterDays", software.amazon.jsii.NativeType.VOID);
    }

    public void resetApproveUntilDate() {
        software.amazon.jsii.Kernel.call(this, "resetApproveUntilDate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetComplianceLevel() {
        software.amazon.jsii.Kernel.call(this, "resetComplianceLevel", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableNonSecurity() {
        software.amazon.jsii.Kernel.call(this, "resetEnableNonSecurity", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ssm_patch_baseline.SsmPatchBaselineApprovalRulePatchFilterList getPatchFilter() {
        return software.amazon.jsii.Kernel.get(this, "patchFilter", software.amazon.jsii.NativeType.forClass(imports.aws.ssm_patch_baseline.SsmPatchBaselineApprovalRulePatchFilterList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getApproveAfterDaysInput() {
        return software.amazon.jsii.Kernel.get(this, "approveAfterDaysInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getApproveUntilDateInput() {
        return software.amazon.jsii.Kernel.get(this, "approveUntilDateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getComplianceLevelInput() {
        return software.amazon.jsii.Kernel.get(this, "complianceLevelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableNonSecurityInput() {
        return software.amazon.jsii.Kernel.get(this, "enableNonSecurityInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPatchFilterInput() {
        return software.amazon.jsii.Kernel.get(this, "patchFilterInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getApproveAfterDays() {
        return software.amazon.jsii.Kernel.get(this, "approveAfterDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setApproveAfterDays(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "approveAfterDays", java.util.Objects.requireNonNull(value, "approveAfterDays is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getApproveUntilDate() {
        return software.amazon.jsii.Kernel.get(this, "approveUntilDate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setApproveUntilDate(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "approveUntilDate", java.util.Objects.requireNonNull(value, "approveUntilDate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getComplianceLevel() {
        return software.amazon.jsii.Kernel.get(this, "complianceLevel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setComplianceLevel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "complianceLevel", java.util.Objects.requireNonNull(value, "complianceLevel is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableNonSecurity() {
        return software.amazon.jsii.Kernel.get(this, "enableNonSecurity", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableNonSecurity(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableNonSecurity", java.util.Objects.requireNonNull(value, "enableNonSecurity is required"));
    }

    public void setEnableNonSecurity(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableNonSecurity", java.util.Objects.requireNonNull(value, "enableNonSecurity is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ssm_patch_baseline.SsmPatchBaselineApprovalRule value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
