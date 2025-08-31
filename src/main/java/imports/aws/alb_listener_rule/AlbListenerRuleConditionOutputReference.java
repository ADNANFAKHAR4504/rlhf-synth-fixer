package imports.aws.alb_listener_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.918Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.albListenerRule.AlbListenerRuleConditionOutputReference")
public class AlbListenerRuleConditionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AlbListenerRuleConditionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AlbListenerRuleConditionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public AlbListenerRuleConditionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putHostHeader(final @org.jetbrains.annotations.NotNull imports.aws.alb_listener_rule.AlbListenerRuleConditionHostHeader value) {
        software.amazon.jsii.Kernel.call(this, "putHostHeader", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putHttpHeader(final @org.jetbrains.annotations.NotNull imports.aws.alb_listener_rule.AlbListenerRuleConditionHttpHeader value) {
        software.amazon.jsii.Kernel.call(this, "putHttpHeader", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putHttpRequestMethod(final @org.jetbrains.annotations.NotNull imports.aws.alb_listener_rule.AlbListenerRuleConditionHttpRequestMethod value) {
        software.amazon.jsii.Kernel.call(this, "putHttpRequestMethod", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPathPattern(final @org.jetbrains.annotations.NotNull imports.aws.alb_listener_rule.AlbListenerRuleConditionPathPattern value) {
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.alb_listener_rule.AlbListenerRuleConditionQueryString>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.alb_listener_rule.AlbListenerRuleConditionQueryString> __cast_cd4240 = (java.util.List<imports.aws.alb_listener_rule.AlbListenerRuleConditionQueryString>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.alb_listener_rule.AlbListenerRuleConditionQueryString __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putQueryString", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSourceIp(final @org.jetbrains.annotations.NotNull imports.aws.alb_listener_rule.AlbListenerRuleConditionSourceIp value) {
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

    public @org.jetbrains.annotations.NotNull imports.aws.alb_listener_rule.AlbListenerRuleConditionHostHeaderOutputReference getHostHeader() {
        return software.amazon.jsii.Kernel.get(this, "hostHeader", software.amazon.jsii.NativeType.forClass(imports.aws.alb_listener_rule.AlbListenerRuleConditionHostHeaderOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.alb_listener_rule.AlbListenerRuleConditionHttpHeaderOutputReference getHttpHeader() {
        return software.amazon.jsii.Kernel.get(this, "httpHeader", software.amazon.jsii.NativeType.forClass(imports.aws.alb_listener_rule.AlbListenerRuleConditionHttpHeaderOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.alb_listener_rule.AlbListenerRuleConditionHttpRequestMethodOutputReference getHttpRequestMethod() {
        return software.amazon.jsii.Kernel.get(this, "httpRequestMethod", software.amazon.jsii.NativeType.forClass(imports.aws.alb_listener_rule.AlbListenerRuleConditionHttpRequestMethodOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.alb_listener_rule.AlbListenerRuleConditionPathPatternOutputReference getPathPattern() {
        return software.amazon.jsii.Kernel.get(this, "pathPattern", software.amazon.jsii.NativeType.forClass(imports.aws.alb_listener_rule.AlbListenerRuleConditionPathPatternOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.alb_listener_rule.AlbListenerRuleConditionQueryStringList getQueryString() {
        return software.amazon.jsii.Kernel.get(this, "queryString", software.amazon.jsii.NativeType.forClass(imports.aws.alb_listener_rule.AlbListenerRuleConditionQueryStringList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.alb_listener_rule.AlbListenerRuleConditionSourceIpOutputReference getSourceIp() {
        return software.amazon.jsii.Kernel.get(this, "sourceIp", software.amazon.jsii.NativeType.forClass(imports.aws.alb_listener_rule.AlbListenerRuleConditionSourceIpOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.alb_listener_rule.AlbListenerRuleConditionHostHeader getHostHeaderInput() {
        return software.amazon.jsii.Kernel.get(this, "hostHeaderInput", software.amazon.jsii.NativeType.forClass(imports.aws.alb_listener_rule.AlbListenerRuleConditionHostHeader.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.alb_listener_rule.AlbListenerRuleConditionHttpHeader getHttpHeaderInput() {
        return software.amazon.jsii.Kernel.get(this, "httpHeaderInput", software.amazon.jsii.NativeType.forClass(imports.aws.alb_listener_rule.AlbListenerRuleConditionHttpHeader.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.alb_listener_rule.AlbListenerRuleConditionHttpRequestMethod getHttpRequestMethodInput() {
        return software.amazon.jsii.Kernel.get(this, "httpRequestMethodInput", software.amazon.jsii.NativeType.forClass(imports.aws.alb_listener_rule.AlbListenerRuleConditionHttpRequestMethod.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.alb_listener_rule.AlbListenerRuleConditionPathPattern getPathPatternInput() {
        return software.amazon.jsii.Kernel.get(this, "pathPatternInput", software.amazon.jsii.NativeType.forClass(imports.aws.alb_listener_rule.AlbListenerRuleConditionPathPattern.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getQueryStringInput() {
        return software.amazon.jsii.Kernel.get(this, "queryStringInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.alb_listener_rule.AlbListenerRuleConditionSourceIp getSourceIpInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceIpInput", software.amazon.jsii.NativeType.forClass(imports.aws.alb_listener_rule.AlbListenerRuleConditionSourceIp.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.alb_listener_rule.AlbListenerRuleCondition value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
