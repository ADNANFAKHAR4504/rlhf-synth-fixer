package imports.aws.securityhub_insight;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.404Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securityhubInsight.SecurityhubInsightFiltersProcessParentPidOutputReference")
public class SecurityhubInsightFiltersProcessParentPidOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SecurityhubInsightFiltersProcessParentPidOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SecurityhubInsightFiltersProcessParentPidOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public SecurityhubInsightFiltersProcessParentPidOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetEq() {
        software.amazon.jsii.Kernel.call(this, "resetEq", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGte() {
        software.amazon.jsii.Kernel.call(this, "resetGte", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLte() {
        software.amazon.jsii.Kernel.call(this, "resetLte", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEqInput() {
        return software.amazon.jsii.Kernel.get(this, "eqInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGteInput() {
        return software.amazon.jsii.Kernel.get(this, "gteInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLteInput() {
        return software.amazon.jsii.Kernel.get(this, "lteInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEq() {
        return software.amazon.jsii.Kernel.get(this, "eq", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEq(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "eq", java.util.Objects.requireNonNull(value, "eq is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGte() {
        return software.amazon.jsii.Kernel.get(this, "gte", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGte(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "gte", java.util.Objects.requireNonNull(value, "gte is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLte() {
        return software.amazon.jsii.Kernel.get(this, "lte", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLte(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "lte", java.util.Objects.requireNonNull(value, "lte is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessParentPid value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
