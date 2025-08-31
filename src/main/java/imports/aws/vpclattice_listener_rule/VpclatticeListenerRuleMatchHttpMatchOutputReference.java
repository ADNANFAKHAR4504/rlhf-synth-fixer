package imports.aws.vpclattice_listener_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.621Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpclatticeListenerRule.VpclatticeListenerRuleMatchHttpMatchOutputReference")
public class VpclatticeListenerRuleMatchHttpMatchOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected VpclatticeListenerRuleMatchHttpMatchOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected VpclatticeListenerRuleMatchHttpMatchOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public VpclatticeListenerRuleMatchHttpMatchOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putHeaderMatches(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchHeaderMatches>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchHeaderMatches> __cast_cd4240 = (java.util.List<imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchHeaderMatches>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchHeaderMatches __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putHeaderMatches", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPathMatch(final @org.jetbrains.annotations.NotNull imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchPathMatch value) {
        software.amazon.jsii.Kernel.call(this, "putPathMatch", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetHeaderMatches() {
        software.amazon.jsii.Kernel.call(this, "resetHeaderMatches", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMethod() {
        software.amazon.jsii.Kernel.call(this, "resetMethod", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPathMatch() {
        software.amazon.jsii.Kernel.call(this, "resetPathMatch", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchHeaderMatchesList getHeaderMatches() {
        return software.amazon.jsii.Kernel.get(this, "headerMatches", software.amazon.jsii.NativeType.forClass(imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchHeaderMatchesList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchPathMatchOutputReference getPathMatch() {
        return software.amazon.jsii.Kernel.get(this, "pathMatch", software.amazon.jsii.NativeType.forClass(imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchPathMatchOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getHeaderMatchesInput() {
        return software.amazon.jsii.Kernel.get(this, "headerMatchesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMethodInput() {
        return software.amazon.jsii.Kernel.get(this, "methodInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchPathMatch getPathMatchInput() {
        return software.amazon.jsii.Kernel.get(this, "pathMatchInput", software.amazon.jsii.NativeType.forClass(imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchPathMatch.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMethod() {
        return software.amazon.jsii.Kernel.get(this, "method", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMethod(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "method", java.util.Objects.requireNonNull(value, "method is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatch getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatch.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatch value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
