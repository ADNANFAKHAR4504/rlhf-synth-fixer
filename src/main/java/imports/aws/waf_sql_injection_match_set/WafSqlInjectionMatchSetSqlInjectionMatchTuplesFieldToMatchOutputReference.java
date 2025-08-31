package imports.aws.waf_sql_injection_match_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.647Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafSqlInjectionMatchSet.WafSqlInjectionMatchSetSqlInjectionMatchTuplesFieldToMatchOutputReference")
public class WafSqlInjectionMatchSetSqlInjectionMatchTuplesFieldToMatchOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected WafSqlInjectionMatchSetSqlInjectionMatchTuplesFieldToMatchOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected WafSqlInjectionMatchSetSqlInjectionMatchTuplesFieldToMatchOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public WafSqlInjectionMatchSetSqlInjectionMatchTuplesFieldToMatchOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetData() {
        software.amazon.jsii.Kernel.call(this, "resetData", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDataInput() {
        return software.amazon.jsii.Kernel.get(this, "dataInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getData() {
        return software.amazon.jsii.Kernel.get(this, "data", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setData(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "data", java.util.Objects.requireNonNull(value, "data is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.waf_sql_injection_match_set.WafSqlInjectionMatchSetSqlInjectionMatchTuplesFieldToMatch getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.waf_sql_injection_match_set.WafSqlInjectionMatchSetSqlInjectionMatchTuplesFieldToMatch.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.waf_sql_injection_match_set.WafSqlInjectionMatchSetSqlInjectionMatchTuplesFieldToMatch value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
