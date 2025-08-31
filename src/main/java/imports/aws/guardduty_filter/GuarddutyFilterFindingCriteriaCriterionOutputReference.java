package imports.aws.guardduty_filter;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.317Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.guarddutyFilter.GuarddutyFilterFindingCriteriaCriterionOutputReference")
public class GuarddutyFilterFindingCriteriaCriterionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GuarddutyFilterFindingCriteriaCriterionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GuarddutyFilterFindingCriteriaCriterionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public GuarddutyFilterFindingCriteriaCriterionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetEqualTo() {
        software.amazon.jsii.Kernel.call(this, "resetEqualTo", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGreaterThan() {
        software.amazon.jsii.Kernel.call(this, "resetGreaterThan", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGreaterThanOrEqual() {
        software.amazon.jsii.Kernel.call(this, "resetGreaterThanOrEqual", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLessThan() {
        software.amazon.jsii.Kernel.call(this, "resetLessThan", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLessThanOrEqual() {
        software.amazon.jsii.Kernel.call(this, "resetLessThanOrEqual", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNotEquals() {
        software.amazon.jsii.Kernel.call(this, "resetNotEquals", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEqualToInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "equalToInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFieldInput() {
        return software.amazon.jsii.Kernel.get(this, "fieldInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGreaterThanInput() {
        return software.amazon.jsii.Kernel.get(this, "greaterThanInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGreaterThanOrEqualInput() {
        return software.amazon.jsii.Kernel.get(this, "greaterThanOrEqualInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLessThanInput() {
        return software.amazon.jsii.Kernel.get(this, "lessThanInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLessThanOrEqualInput() {
        return software.amazon.jsii.Kernel.get(this, "lessThanOrEqualInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getNotEqualsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "notEqualsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getEqualTo() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "equalTo", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setEqualTo(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "equalTo", java.util.Objects.requireNonNull(value, "equalTo is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getField() {
        return software.amazon.jsii.Kernel.get(this, "field", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setField(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "field", java.util.Objects.requireNonNull(value, "field is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGreaterThan() {
        return software.amazon.jsii.Kernel.get(this, "greaterThan", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGreaterThan(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "greaterThan", java.util.Objects.requireNonNull(value, "greaterThan is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGreaterThanOrEqual() {
        return software.amazon.jsii.Kernel.get(this, "greaterThanOrEqual", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGreaterThanOrEqual(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "greaterThanOrEqual", java.util.Objects.requireNonNull(value, "greaterThanOrEqual is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLessThan() {
        return software.amazon.jsii.Kernel.get(this, "lessThan", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLessThan(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "lessThan", java.util.Objects.requireNonNull(value, "lessThan is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLessThanOrEqual() {
        return software.amazon.jsii.Kernel.get(this, "lessThanOrEqual", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLessThanOrEqual(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "lessThanOrEqual", java.util.Objects.requireNonNull(value, "lessThanOrEqual is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getNotEquals() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "notEquals", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setNotEquals(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "notEquals", java.util.Objects.requireNonNull(value, "notEquals is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.guardduty_filter.GuarddutyFilterFindingCriteriaCriterion value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
