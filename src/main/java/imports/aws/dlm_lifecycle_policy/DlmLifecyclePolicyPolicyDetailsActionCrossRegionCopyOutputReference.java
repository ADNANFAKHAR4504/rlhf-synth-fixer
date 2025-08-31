package imports.aws.dlm_lifecycle_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.005Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dlmLifecyclePolicy.DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyOutputReference")
public class DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putEncryptionConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyEncryptionConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putEncryptionConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRetainRule(final @org.jetbrains.annotations.NotNull imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyRetainRule value) {
        software.amazon.jsii.Kernel.call(this, "putRetainRule", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetRetainRule() {
        software.amazon.jsii.Kernel.call(this, "resetRetainRule", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyEncryptionConfigurationOutputReference getEncryptionConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "encryptionConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyEncryptionConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyRetainRuleOutputReference getRetainRule() {
        return software.amazon.jsii.Kernel.get(this, "retainRule", software.amazon.jsii.NativeType.forClass(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyRetainRuleOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyEncryptionConfiguration getEncryptionConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "encryptionConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyEncryptionConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyRetainRule getRetainRuleInput() {
        return software.amazon.jsii.Kernel.get(this, "retainRuleInput", software.amazon.jsii.NativeType.forClass(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyRetainRule.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTargetInput() {
        return software.amazon.jsii.Kernel.get(this, "targetInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTarget() {
        return software.amazon.jsii.Kernel.get(this, "target", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTarget(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "target", java.util.Objects.requireNonNull(value, "target is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopy value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
