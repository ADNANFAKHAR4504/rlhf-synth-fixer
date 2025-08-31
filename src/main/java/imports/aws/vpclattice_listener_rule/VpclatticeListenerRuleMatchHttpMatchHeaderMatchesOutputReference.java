package imports.aws.vpclattice_listener_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.621Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpclatticeListenerRule.VpclatticeListenerRuleMatchHttpMatchHeaderMatchesOutputReference")
public class VpclatticeListenerRuleMatchHttpMatchHeaderMatchesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected VpclatticeListenerRuleMatchHttpMatchHeaderMatchesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected VpclatticeListenerRuleMatchHttpMatchHeaderMatchesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public VpclatticeListenerRuleMatchHttpMatchHeaderMatchesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putMatch(final @org.jetbrains.annotations.NotNull imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatch value) {
        software.amazon.jsii.Kernel.call(this, "putMatch", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCaseSensitive() {
        software.amazon.jsii.Kernel.call(this, "resetCaseSensitive", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatchOutputReference getMatch() {
        return software.amazon.jsii.Kernel.get(this, "match", software.amazon.jsii.NativeType.forClass(imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatchOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCaseSensitiveInput() {
        return software.amazon.jsii.Kernel.get(this, "caseSensitiveInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatch getMatchInput() {
        return software.amazon.jsii.Kernel.get(this, "matchInput", software.amazon.jsii.NativeType.forClass(imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchHeaderMatchesMatch.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchHeaderMatches value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
