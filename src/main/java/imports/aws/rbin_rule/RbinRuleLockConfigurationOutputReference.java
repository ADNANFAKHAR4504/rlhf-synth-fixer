package imports.aws.rbin_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.134Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rbinRule.RbinRuleLockConfigurationOutputReference")
public class RbinRuleLockConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected RbinRuleLockConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected RbinRuleLockConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public RbinRuleLockConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putUnlockDelay(final @org.jetbrains.annotations.NotNull imports.aws.rbin_rule.RbinRuleLockConfigurationUnlockDelay value) {
        software.amazon.jsii.Kernel.call(this, "putUnlockDelay", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.rbin_rule.RbinRuleLockConfigurationUnlockDelayOutputReference getUnlockDelay() {
        return software.amazon.jsii.Kernel.get(this, "unlockDelay", software.amazon.jsii.NativeType.forClass(imports.aws.rbin_rule.RbinRuleLockConfigurationUnlockDelayOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.rbin_rule.RbinRuleLockConfigurationUnlockDelay getUnlockDelayInput() {
        return software.amazon.jsii.Kernel.get(this, "unlockDelayInput", software.amazon.jsii.NativeType.forClass(imports.aws.rbin_rule.RbinRuleLockConfigurationUnlockDelay.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.rbin_rule.RbinRuleLockConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.rbin_rule.RbinRuleLockConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.rbin_rule.RbinRuleLockConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
