package imports.aws.dlm_lifecycle_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.011Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dlmLifecyclePolicy.DlmLifecyclePolicyPolicyDetailsScheduleShareRuleOutputReference")
public class DlmLifecyclePolicyPolicyDetailsScheduleShareRuleOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DlmLifecyclePolicyPolicyDetailsScheduleShareRuleOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DlmLifecyclePolicyPolicyDetailsScheduleShareRuleOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DlmLifecyclePolicyPolicyDetailsScheduleShareRuleOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetUnshareInterval() {
        software.amazon.jsii.Kernel.call(this, "resetUnshareInterval", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUnshareIntervalUnit() {
        software.amazon.jsii.Kernel.call(this, "resetUnshareIntervalUnit", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTargetAccountsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "targetAccountsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getUnshareIntervalInput() {
        return software.amazon.jsii.Kernel.get(this, "unshareIntervalInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUnshareIntervalUnitInput() {
        return software.amazon.jsii.Kernel.get(this, "unshareIntervalUnitInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTargetAccounts() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "targetAccounts", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTargetAccounts(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "targetAccounts", java.util.Objects.requireNonNull(value, "targetAccounts is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getUnshareInterval() {
        return software.amazon.jsii.Kernel.get(this, "unshareInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setUnshareInterval(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "unshareInterval", java.util.Objects.requireNonNull(value, "unshareInterval is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUnshareIntervalUnit() {
        return software.amazon.jsii.Kernel.get(this, "unshareIntervalUnit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUnshareIntervalUnit(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "unshareIntervalUnit", java.util.Objects.requireNonNull(value, "unshareIntervalUnit is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleShareRule getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleShareRule.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleShareRule value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
