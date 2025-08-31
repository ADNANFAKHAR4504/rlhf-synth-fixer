package imports.aws.macie2_findings_filter;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.855Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.macie2FindingsFilter.Macie2FindingsFilterFindingCriteriaCriterionOutputReference")
public class Macie2FindingsFilterFindingCriteriaCriterionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Macie2FindingsFilterFindingCriteriaCriterionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Macie2FindingsFilterFindingCriteriaCriterionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public Macie2FindingsFilterFindingCriteriaCriterionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetEq() {
        software.amazon.jsii.Kernel.call(this, "resetEq", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEqExactMatch() {
        software.amazon.jsii.Kernel.call(this, "resetEqExactMatch", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGt() {
        software.amazon.jsii.Kernel.call(this, "resetGt", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGte() {
        software.amazon.jsii.Kernel.call(this, "resetGte", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLt() {
        software.amazon.jsii.Kernel.call(this, "resetLt", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLte() {
        software.amazon.jsii.Kernel.call(this, "resetLte", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNeq() {
        software.amazon.jsii.Kernel.call(this, "resetNeq", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEqExactMatchInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "eqExactMatchInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEqInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "eqInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFieldInput() {
        return software.amazon.jsii.Kernel.get(this, "fieldInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGteInput() {
        return software.amazon.jsii.Kernel.get(this, "gteInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGtInput() {
        return software.amazon.jsii.Kernel.get(this, "gtInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLteInput() {
        return software.amazon.jsii.Kernel.get(this, "lteInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLtInput() {
        return software.amazon.jsii.Kernel.get(this, "ltInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getNeqInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "neqInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getEq() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "eq", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setEq(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "eq", java.util.Objects.requireNonNull(value, "eq is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getEqExactMatch() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "eqExactMatch", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setEqExactMatch(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "eqExactMatch", java.util.Objects.requireNonNull(value, "eqExactMatch is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getField() {
        return software.amazon.jsii.Kernel.get(this, "field", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setField(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "field", java.util.Objects.requireNonNull(value, "field is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGt() {
        return software.amazon.jsii.Kernel.get(this, "gt", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGt(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "gt", java.util.Objects.requireNonNull(value, "gt is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGte() {
        return software.amazon.jsii.Kernel.get(this, "gte", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGte(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "gte", java.util.Objects.requireNonNull(value, "gte is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLt() {
        return software.amazon.jsii.Kernel.get(this, "lt", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLt(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "lt", java.util.Objects.requireNonNull(value, "lt is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLte() {
        return software.amazon.jsii.Kernel.get(this, "lte", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLte(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "lte", java.util.Objects.requireNonNull(value, "lte is required"));
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

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.macie2_findings_filter.Macie2FindingsFilterFindingCriteriaCriterion value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
