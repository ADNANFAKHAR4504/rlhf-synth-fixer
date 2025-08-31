package imports.aws.lb_listener_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.532Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lbListenerRule.LbListenerRuleConditionHttpHeaderOutputReference")
public class LbListenerRuleConditionHttpHeaderOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LbListenerRuleConditionHttpHeaderOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LbListenerRuleConditionHttpHeaderOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public LbListenerRuleConditionHttpHeaderOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHttpHeaderNameInput() {
        return software.amazon.jsii.Kernel.get(this, "httpHeaderNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getValuesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "valuesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHttpHeaderName() {
        return software.amazon.jsii.Kernel.get(this, "httpHeaderName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHttpHeaderName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "httpHeaderName", java.util.Objects.requireNonNull(value, "httpHeaderName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getValues() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "values", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setValues(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "values", java.util.Objects.requireNonNull(value, "values is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lb_listener_rule.LbListenerRuleConditionHttpHeader getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.lb_listener_rule.LbListenerRuleConditionHttpHeader.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lb_listener_rule.LbListenerRuleConditionHttpHeader value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
