package imports.aws.securityhub_insight;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.407Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securityhubInsight.SecurityhubInsightFiltersResourceAwsIamAccessKeyCreatedAtOutputReference")
public class SecurityhubInsightFiltersResourceAwsIamAccessKeyCreatedAtOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SecurityhubInsightFiltersResourceAwsIamAccessKeyCreatedAtOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SecurityhubInsightFiltersResourceAwsIamAccessKeyCreatedAtOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public SecurityhubInsightFiltersResourceAwsIamAccessKeyCreatedAtOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putDateRange(final @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsIamAccessKeyCreatedAtDateRange value) {
        software.amazon.jsii.Kernel.call(this, "putDateRange", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDateRange() {
        software.amazon.jsii.Kernel.call(this, "resetDateRange", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnd() {
        software.amazon.jsii.Kernel.call(this, "resetEnd", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStart() {
        software.amazon.jsii.Kernel.call(this, "resetStart", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsIamAccessKeyCreatedAtDateRangeOutputReference getDateRange() {
        return software.amazon.jsii.Kernel.get(this, "dateRange", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsIamAccessKeyCreatedAtDateRangeOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsIamAccessKeyCreatedAtDateRange getDateRangeInput() {
        return software.amazon.jsii.Kernel.get(this, "dateRangeInput", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsIamAccessKeyCreatedAtDateRange.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEndInput() {
        return software.amazon.jsii.Kernel.get(this, "endInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStartInput() {
        return software.amazon.jsii.Kernel.get(this, "startInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEnd() {
        return software.amazon.jsii.Kernel.get(this, "end", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEnd(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "end", java.util.Objects.requireNonNull(value, "end is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStart() {
        return software.amazon.jsii.Kernel.get(this, "start", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStart(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "start", java.util.Objects.requireNonNull(value, "start is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsIamAccessKeyCreatedAt value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
