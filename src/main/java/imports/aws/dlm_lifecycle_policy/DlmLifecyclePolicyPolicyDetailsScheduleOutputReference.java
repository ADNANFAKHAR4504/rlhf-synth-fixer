package imports.aws.dlm_lifecycle_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.006Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dlmLifecyclePolicy.DlmLifecyclePolicyPolicyDetailsScheduleOutputReference")
public class DlmLifecyclePolicyPolicyDetailsScheduleOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DlmLifecyclePolicyPolicyDetailsScheduleOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DlmLifecyclePolicyPolicyDetailsScheduleOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DlmLifecyclePolicyPolicyDetailsScheduleOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putCreateRule(final @org.jetbrains.annotations.NotNull imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleCreateRule value) {
        software.amazon.jsii.Kernel.call(this, "putCreateRule", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCrossRegionCopyRule(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRule>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRule> __cast_cd4240 = (java.util.List<imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRule>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRule __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCrossRegionCopyRule", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDeprecateRule(final @org.jetbrains.annotations.NotNull imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleDeprecateRule value) {
        software.amazon.jsii.Kernel.call(this, "putDeprecateRule", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFastRestoreRule(final @org.jetbrains.annotations.NotNull imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleFastRestoreRule value) {
        software.amazon.jsii.Kernel.call(this, "putFastRestoreRule", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRetainRule(final @org.jetbrains.annotations.NotNull imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleRetainRule value) {
        software.amazon.jsii.Kernel.call(this, "putRetainRule", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putShareRule(final @org.jetbrains.annotations.NotNull imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleShareRule value) {
        software.amazon.jsii.Kernel.call(this, "putShareRule", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCopyTags() {
        software.amazon.jsii.Kernel.call(this, "resetCopyTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCrossRegionCopyRule() {
        software.amazon.jsii.Kernel.call(this, "resetCrossRegionCopyRule", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeprecateRule() {
        software.amazon.jsii.Kernel.call(this, "resetDeprecateRule", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFastRestoreRule() {
        software.amazon.jsii.Kernel.call(this, "resetFastRestoreRule", software.amazon.jsii.NativeType.VOID);
    }

    public void resetShareRule() {
        software.amazon.jsii.Kernel.call(this, "resetShareRule", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsToAdd() {
        software.amazon.jsii.Kernel.call(this, "resetTagsToAdd", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVariableTags() {
        software.amazon.jsii.Kernel.call(this, "resetVariableTags", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleCreateRuleOutputReference getCreateRule() {
        return software.amazon.jsii.Kernel.get(this, "createRule", software.amazon.jsii.NativeType.forClass(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleCreateRuleOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRuleList getCrossRegionCopyRule() {
        return software.amazon.jsii.Kernel.get(this, "crossRegionCopyRule", software.amazon.jsii.NativeType.forClass(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRuleList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleDeprecateRuleOutputReference getDeprecateRule() {
        return software.amazon.jsii.Kernel.get(this, "deprecateRule", software.amazon.jsii.NativeType.forClass(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleDeprecateRuleOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleFastRestoreRuleOutputReference getFastRestoreRule() {
        return software.amazon.jsii.Kernel.get(this, "fastRestoreRule", software.amazon.jsii.NativeType.forClass(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleFastRestoreRuleOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleRetainRuleOutputReference getRetainRule() {
        return software.amazon.jsii.Kernel.get(this, "retainRule", software.amazon.jsii.NativeType.forClass(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleRetainRuleOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleShareRuleOutputReference getShareRule() {
        return software.amazon.jsii.Kernel.get(this, "shareRule", software.amazon.jsii.NativeType.forClass(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleShareRuleOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCopyTagsInput() {
        return software.amazon.jsii.Kernel.get(this, "copyTagsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleCreateRule getCreateRuleInput() {
        return software.amazon.jsii.Kernel.get(this, "createRuleInput", software.amazon.jsii.NativeType.forClass(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleCreateRule.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCrossRegionCopyRuleInput() {
        return software.amazon.jsii.Kernel.get(this, "crossRegionCopyRuleInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleDeprecateRule getDeprecateRuleInput() {
        return software.amazon.jsii.Kernel.get(this, "deprecateRuleInput", software.amazon.jsii.NativeType.forClass(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleDeprecateRule.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleFastRestoreRule getFastRestoreRuleInput() {
        return software.amazon.jsii.Kernel.get(this, "fastRestoreRuleInput", software.amazon.jsii.NativeType.forClass(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleFastRestoreRule.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleRetainRule getRetainRuleInput() {
        return software.amazon.jsii.Kernel.get(this, "retainRuleInput", software.amazon.jsii.NativeType.forClass(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleRetainRule.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleShareRule getShareRuleInput() {
        return software.amazon.jsii.Kernel.get(this, "shareRuleInput", software.amazon.jsii.NativeType.forClass(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleShareRule.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsToAddInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsToAddInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getVariableTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "variableTagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getCopyTags() {
        return software.amazon.jsii.Kernel.get(this, "copyTags", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setCopyTags(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "copyTags", java.util.Objects.requireNonNull(value, "copyTags is required"));
    }

    public void setCopyTags(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "copyTags", java.util.Objects.requireNonNull(value, "copyTags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsToAdd() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsToAdd", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsToAdd(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsToAdd", java.util.Objects.requireNonNull(value, "tagsToAdd is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getVariableTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "variableTags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setVariableTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "variableTags", java.util.Objects.requireNonNull(value, "variableTags is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsSchedule value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
