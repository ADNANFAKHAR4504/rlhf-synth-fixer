package imports.aws.cloudtrail;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.262Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudtrail.CloudtrailAdvancedEventSelectorFieldSelectorOutputReference")
public class CloudtrailAdvancedEventSelectorFieldSelectorOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudtrailAdvancedEventSelectorFieldSelectorOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudtrailAdvancedEventSelectorFieldSelectorOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public CloudtrailAdvancedEventSelectorFieldSelectorOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetEndsWith() {
        software.amazon.jsii.Kernel.call(this, "resetEndsWith", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEqualTo() {
        software.amazon.jsii.Kernel.call(this, "resetEqualTo", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNotEndsWith() {
        software.amazon.jsii.Kernel.call(this, "resetNotEndsWith", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNotEquals() {
        software.amazon.jsii.Kernel.call(this, "resetNotEquals", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNotStartsWith() {
        software.amazon.jsii.Kernel.call(this, "resetNotStartsWith", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStartsWith() {
        software.amazon.jsii.Kernel.call(this, "resetStartsWith", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEndsWithInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "endsWithInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEqualToInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "equalToInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFieldInput() {
        return software.amazon.jsii.Kernel.get(this, "fieldInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getNotEndsWithInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "notEndsWithInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getNotEqualsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "notEqualsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getNotStartsWithInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "notStartsWithInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getStartsWithInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "startsWithInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getEndsWith() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "endsWith", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setEndsWith(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "endsWith", java.util.Objects.requireNonNull(value, "endsWith is required"));
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

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getNotEndsWith() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "notEndsWith", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setNotEndsWith(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "notEndsWith", java.util.Objects.requireNonNull(value, "notEndsWith is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getNotEquals() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "notEquals", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setNotEquals(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "notEquals", java.util.Objects.requireNonNull(value, "notEquals is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getNotStartsWith() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "notStartsWith", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setNotStartsWith(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "notStartsWith", java.util.Objects.requireNonNull(value, "notStartsWith is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getStartsWith() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "startsWith", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setStartsWith(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "startsWith", java.util.Objects.requireNonNull(value, "startsWith is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudtrail.CloudtrailAdvancedEventSelectorFieldSelector value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
