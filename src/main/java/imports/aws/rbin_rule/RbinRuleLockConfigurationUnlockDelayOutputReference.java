package imports.aws.rbin_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.134Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rbinRule.RbinRuleLockConfigurationUnlockDelayOutputReference")
public class RbinRuleLockConfigurationUnlockDelayOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected RbinRuleLockConfigurationUnlockDelayOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected RbinRuleLockConfigurationUnlockDelayOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public RbinRuleLockConfigurationUnlockDelayOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUnlockDelayUnitInput() {
        return software.amazon.jsii.Kernel.get(this, "unlockDelayUnitInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getUnlockDelayValueInput() {
        return software.amazon.jsii.Kernel.get(this, "unlockDelayValueInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUnlockDelayUnit() {
        return software.amazon.jsii.Kernel.get(this, "unlockDelayUnit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUnlockDelayUnit(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "unlockDelayUnit", java.util.Objects.requireNonNull(value, "unlockDelayUnit is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getUnlockDelayValue() {
        return software.amazon.jsii.Kernel.get(this, "unlockDelayValue", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setUnlockDelayValue(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "unlockDelayValue", java.util.Objects.requireNonNull(value, "unlockDelayValue is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.rbin_rule.RbinRuleLockConfigurationUnlockDelay getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.rbin_rule.RbinRuleLockConfigurationUnlockDelay.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.rbin_rule.RbinRuleLockConfigurationUnlockDelay value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
