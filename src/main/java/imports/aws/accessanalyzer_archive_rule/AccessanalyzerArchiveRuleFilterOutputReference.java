package imports.aws.accessanalyzer_archive_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.886Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.accessanalyzerArchiveRule.AccessanalyzerArchiveRuleFilterOutputReference")
public class AccessanalyzerArchiveRuleFilterOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AccessanalyzerArchiveRuleFilterOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AccessanalyzerArchiveRuleFilterOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public AccessanalyzerArchiveRuleFilterOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetContains() {
        software.amazon.jsii.Kernel.call(this, "resetContains", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEq() {
        software.amazon.jsii.Kernel.call(this, "resetEq", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExists() {
        software.amazon.jsii.Kernel.call(this, "resetExists", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNeq() {
        software.amazon.jsii.Kernel.call(this, "resetNeq", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getContainsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "containsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCriteriaInput() {
        return software.amazon.jsii.Kernel.get(this, "criteriaInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEqInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "eqInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExistsInput() {
        return software.amazon.jsii.Kernel.get(this, "existsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getNeqInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "neqInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getContains() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "contains", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setContains(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "contains", java.util.Objects.requireNonNull(value, "contains is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCriteria() {
        return software.amazon.jsii.Kernel.get(this, "criteria", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCriteria(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "criteria", java.util.Objects.requireNonNull(value, "criteria is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getEq() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "eq", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setEq(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "eq", java.util.Objects.requireNonNull(value, "eq is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExists() {
        return software.amazon.jsii.Kernel.get(this, "exists", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExists(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "exists", java.util.Objects.requireNonNull(value, "exists is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getNeq() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "neq", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setNeq(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "neq", java.util.Objects.requireNonNull(value, "neq is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.accessanalyzer_archive_rule.AccessanalyzerArchiveRuleFilter value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
