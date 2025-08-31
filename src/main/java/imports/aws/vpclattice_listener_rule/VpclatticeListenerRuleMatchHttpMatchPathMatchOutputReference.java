package imports.aws.vpclattice_listener_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.621Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpclatticeListenerRule.VpclatticeListenerRuleMatchHttpMatchPathMatchOutputReference")
public class VpclatticeListenerRuleMatchHttpMatchPathMatchOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected VpclatticeListenerRuleMatchHttpMatchPathMatchOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected VpclatticeListenerRuleMatchHttpMatchPathMatchOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public VpclatticeListenerRuleMatchHttpMatchPathMatchOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putMatch(final @org.jetbrains.annotations.NotNull imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchPathMatchMatch value) {
        software.amazon.jsii.Kernel.call(this, "putMatch", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCaseSensitive() {
        software.amazon.jsii.Kernel.call(this, "resetCaseSensitive", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchPathMatchMatchOutputReference getMatch() {
        return software.amazon.jsii.Kernel.get(this, "match", software.amazon.jsii.NativeType.forClass(imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchPathMatchMatchOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCaseSensitiveInput() {
        return software.amazon.jsii.Kernel.get(this, "caseSensitiveInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchPathMatchMatch getMatchInput() {
        return software.amazon.jsii.Kernel.get(this, "matchInput", software.amazon.jsii.NativeType.forClass(imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchPathMatchMatch.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getCaseSensitive() {
        return software.amazon.jsii.Kernel.get(this, "caseSensitive", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setCaseSensitive(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "caseSensitive", java.util.Objects.requireNonNull(value, "caseSensitive is required"));
    }

    public void setCaseSensitive(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "caseSensitive", java.util.Objects.requireNonNull(value, "caseSensitive is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchPathMatch getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchPathMatch.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchPathMatch value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
