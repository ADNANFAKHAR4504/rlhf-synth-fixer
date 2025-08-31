package imports.aws.rbin_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.134Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rbinRule.RbinRuleRetentionPeriodOutputReference")
public class RbinRuleRetentionPeriodOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected RbinRuleRetentionPeriodOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected RbinRuleRetentionPeriodOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public RbinRuleRetentionPeriodOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRetentionPeriodUnitInput() {
        return software.amazon.jsii.Kernel.get(this, "retentionPeriodUnitInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRetentionPeriodValueInput() {
        return software.amazon.jsii.Kernel.get(this, "retentionPeriodValueInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRetentionPeriodUnit() {
        return software.amazon.jsii.Kernel.get(this, "retentionPeriodUnit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRetentionPeriodUnit(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "retentionPeriodUnit", java.util.Objects.requireNonNull(value, "retentionPeriodUnit is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRetentionPeriodValue() {
        return software.amazon.jsii.Kernel.get(this, "retentionPeriodValue", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRetentionPeriodValue(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "retentionPeriodValue", java.util.Objects.requireNonNull(value, "retentionPeriodValue is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.rbin_rule.RbinRuleRetentionPeriod getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.rbin_rule.RbinRuleRetentionPeriod.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.rbin_rule.RbinRuleRetentionPeriod value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
