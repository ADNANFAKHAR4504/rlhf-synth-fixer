package imports.aws.route53_recoverycontrolconfig_safety_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.218Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.route53RecoverycontrolconfigSafetyRule.Route53RecoverycontrolconfigSafetyRuleRuleConfigOutputReference")
public class Route53RecoverycontrolconfigSafetyRuleRuleConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Route53RecoverycontrolconfigSafetyRuleRuleConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Route53RecoverycontrolconfigSafetyRuleRuleConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Route53RecoverycontrolconfigSafetyRuleRuleConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInvertedInput() {
        return software.amazon.jsii.Kernel.get(this, "invertedInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getThresholdInput() {
        return software.amazon.jsii.Kernel.get(this, "thresholdInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getInverted() {
        return software.amazon.jsii.Kernel.get(this, "inverted", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInverted(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "inverted", java.util.Objects.requireNonNull(value, "inverted is required"));
    }

    public void setInverted(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "inverted", java.util.Objects.requireNonNull(value, "inverted is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getThreshold() {
        return software.amazon.jsii.Kernel.get(this, "threshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setThreshold(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "threshold", java.util.Objects.requireNonNull(value, "threshold is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.route53_recoverycontrolconfig_safety_rule.Route53RecoverycontrolconfigSafetyRuleRuleConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.route53_recoverycontrolconfig_safety_rule.Route53RecoverycontrolconfigSafetyRuleRuleConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.route53_recoverycontrolconfig_safety_rule.Route53RecoverycontrolconfigSafetyRuleRuleConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
