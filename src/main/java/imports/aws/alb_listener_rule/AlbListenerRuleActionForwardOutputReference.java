package imports.aws.alb_listener_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.911Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.albListenerRule.AlbListenerRuleActionForwardOutputReference")
public class AlbListenerRuleActionForwardOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AlbListenerRuleActionForwardOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AlbListenerRuleActionForwardOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AlbListenerRuleActionForwardOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putStickiness(final @org.jetbrains.annotations.NotNull imports.aws.alb_listener_rule.AlbListenerRuleActionForwardStickiness value) {
        software.amazon.jsii.Kernel.call(this, "putStickiness", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTargetGroup(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.alb_listener_rule.AlbListenerRuleActionForwardTargetGroup>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.alb_listener_rule.AlbListenerRuleActionForwardTargetGroup> __cast_cd4240 = (java.util.List<imports.aws.alb_listener_rule.AlbListenerRuleActionForwardTargetGroup>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.alb_listener_rule.AlbListenerRuleActionForwardTargetGroup __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putTargetGroup", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetStickiness() {
        software.amazon.jsii.Kernel.call(this, "resetStickiness", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.alb_listener_rule.AlbListenerRuleActionForwardStickinessOutputReference getStickiness() {
        return software.amazon.jsii.Kernel.get(this, "stickiness", software.amazon.jsii.NativeType.forClass(imports.aws.alb_listener_rule.AlbListenerRuleActionForwardStickinessOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.alb_listener_rule.AlbListenerRuleActionForwardTargetGroupList getTargetGroup() {
        return software.amazon.jsii.Kernel.get(this, "targetGroup", software.amazon.jsii.NativeType.forClass(imports.aws.alb_listener_rule.AlbListenerRuleActionForwardTargetGroupList.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.alb_listener_rule.AlbListenerRuleActionForwardStickiness getStickinessInput() {
        return software.amazon.jsii.Kernel.get(this, "stickinessInput", software.amazon.jsii.NativeType.forClass(imports.aws.alb_listener_rule.AlbListenerRuleActionForwardStickiness.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTargetGroupInput() {
        return software.amazon.jsii.Kernel.get(this, "targetGroupInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.alb_listener_rule.AlbListenerRuleActionForward getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.alb_listener_rule.AlbListenerRuleActionForward.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.alb_listener_rule.AlbListenerRuleActionForward value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
