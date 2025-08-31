package imports.aws.lb_listener_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.532Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lbListenerRule.LbListenerRuleConditionOutputReference")
public class LbListenerRuleConditionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LbListenerRuleConditionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LbListenerRuleConditionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public LbListenerRuleConditionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putHostHeader(final @org.jetbrains.annotations.NotNull imports.aws.lb_listener_rule.LbListenerRuleConditionHostHeader value) {
        software.amazon.jsii.Kernel.call(this, "putHostHeader", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putHttpHeader(final @org.jetbrains.annotations.NotNull imports.aws.lb_listener_rule.LbListenerRuleConditionHttpHeader value) {
        software.amazon.jsii.Kernel.call(this, "putHttpHeader", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putHttpRequestMethod(final @org.jetbrains.annotations.NotNull imports.aws.lb_listener_rule.LbListenerRuleConditionHttpRequestMethod value) {
        software.amazon.jsii.Kernel.call(this, "putHttpRequestMethod", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPathPattern(final @org.jetbrains.annotations.NotNull imports.aws.lb_listener_rule.LbListenerRuleConditionPathPattern value) {
        software.amazon.jsii.Kernel.call(this, "putPathPattern", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putQueryString(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lb_listener_rule.LbListenerRuleConditionQueryString>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lb_listener_rule.LbListenerRuleConditionQueryString> __cast_cd4240 = (java.util.List<imports.aws.lb_listener_rule.LbListenerRuleConditionQueryString>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lb_listener_rule.LbListenerRuleConditionQueryString __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putQueryString", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSourceIp(final @org.jetbrains.annotations.NotNull imports.aws.lb_listener_rule.LbListenerRuleConditionSourceIp value) {
        software.amazon.jsii.Kernel.call(this, "putSourceIp", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetHostHeader() {
        software.amazon.jsii.Kernel.call(this, "resetHostHeader", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHttpHeader() {
        software.amazon.jsii.Kernel.call(this, "resetHttpHeader", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHttpRequestMethod() {
        software.amazon.jsii.Kernel.call(this, "resetHttpRequestMethod", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPathPattern() {
        software.amazon.jsii.Kernel.call(this, "resetPathPattern", software.amazon.jsii.NativeType.VOID);
    }

    public void resetQueryString() {
        software.amazon.jsii.Kernel.call(this, "resetQueryString", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceIp() {
        software.amazon.jsii.Kernel.call(this, "resetSourceIp", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lb_listener_rule.LbListenerRuleConditionHostHeaderOutputReference getHostHeader() {
        return software.amazon.jsii.Kernel.get(this, "hostHeader", software.amazon.jsii.NativeType.forClass(imports.aws.lb_listener_rule.LbListenerRuleConditionHostHeaderOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lb_listener_rule.LbListenerRuleConditionHttpHeaderOutputReference getHttpHeader() {
        return software.amazon.jsii.Kernel.get(this, "httpHeader", software.amazon.jsii.NativeType.forClass(imports.aws.lb_listener_rule.LbListenerRuleConditionHttpHeaderOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lb_listener_rule.LbListenerRuleConditionHttpRequestMethodOutputReference getHttpRequestMethod() {
        return software.amazon.jsii.Kernel.get(this, "httpRequestMethod", software.amazon.jsii.NativeType.forClass(imports.aws.lb_listener_rule.LbListenerRuleConditionHttpRequestMethodOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lb_listener_rule.LbListenerRuleConditionPathPatternOutputReference getPathPattern() {
        return software.amazon.jsii.Kernel.get(this, "pathPattern", software.amazon.jsii.NativeType.forClass(imports.aws.lb_listener_rule.LbListenerRuleConditionPathPatternOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lb_listener_rule.LbListenerRuleConditionQueryStringList getQueryString() {
        return software.amazon.jsii.Kernel.get(this, "queryString", software.amazon.jsii.NativeType.forClass(imports.aws.lb_listener_rule.LbListenerRuleConditionQueryStringList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lb_listener_rule.LbListenerRuleConditionSourceIpOutputReference getSourceIp() {
        return software.amazon.jsii.Kernel.get(this, "sourceIp", software.amazon.jsii.NativeType.forClass(imports.aws.lb_listener_rule.LbListenerRuleConditionSourceIpOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lb_listener_rule.LbListenerRuleConditionHostHeader getHostHeaderInput() {
        return software.amazon.jsii.Kernel.get(this, "hostHeaderInput", software.amazon.jsii.NativeType.forClass(imports.aws.lb_listener_rule.LbListenerRuleConditionHostHeader.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lb_listener_rule.LbListenerRuleConditionHttpHeader getHttpHeaderInput() {
        return software.amazon.jsii.Kernel.get(this, "httpHeaderInput", software.amazon.jsii.NativeType.forClass(imports.aws.lb_listener_rule.LbListenerRuleConditionHttpHeader.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lb_listener_rule.LbListenerRuleConditionHttpRequestMethod getHttpRequestMethodInput() {
        return software.amazon.jsii.Kernel.get(this, "httpRequestMethodInput", software.amazon.jsii.NativeType.forClass(imports.aws.lb_listener_rule.LbListenerRuleConditionHttpRequestMethod.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lb_listener_rule.LbListenerRuleConditionPathPattern getPathPatternInput() {
        return software.amazon.jsii.Kernel.get(this, "pathPatternInput", software.amazon.jsii.NativeType.forClass(imports.aws.lb_listener_rule.LbListenerRuleConditionPathPattern.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getQueryStringInput() {
        return software.amazon.jsii.Kernel.get(this, "queryStringInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lb_listener_rule.LbListenerRuleConditionSourceIp getSourceIpInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceIpInput", software.amazon.jsii.NativeType.forClass(imports.aws.lb_listener_rule.LbListenerRuleConditionSourceIp.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lb_listener_rule.LbListenerRuleCondition value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
