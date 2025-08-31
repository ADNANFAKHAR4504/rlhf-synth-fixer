package imports.aws.inspector2_filter;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.377Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.inspector2Filter.Inspector2FilterFilterCriteriaFirstObservedAtOutputReference")
public class Inspector2FilterFilterCriteriaFirstObservedAtOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Inspector2FilterFilterCriteriaFirstObservedAtOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Inspector2FilterFilterCriteriaFirstObservedAtOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public Inspector2FilterFilterCriteriaFirstObservedAtOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetEndInclusive() {
        software.amazon.jsii.Kernel.call(this, "resetEndInclusive", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStartInclusive() {
        software.amazon.jsii.Kernel.call(this, "resetStartInclusive", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEndInclusiveInput() {
        return software.amazon.jsii.Kernel.get(this, "endInclusiveInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStartInclusiveInput() {
        return software.amazon.jsii.Kernel.get(this, "startInclusiveInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEndInclusive() {
        return software.amazon.jsii.Kernel.get(this, "endInclusive", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEndInclusive(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "endInclusive", java.util.Objects.requireNonNull(value, "endInclusive is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStartInclusive() {
        return software.amazon.jsii.Kernel.get(this, "startInclusive", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStartInclusive(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "startInclusive", java.util.Objects.requireNonNull(value, "startInclusive is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaFirstObservedAt value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
