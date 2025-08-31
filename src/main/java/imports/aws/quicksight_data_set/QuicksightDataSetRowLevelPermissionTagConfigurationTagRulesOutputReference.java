package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.113Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetRowLevelPermissionTagConfigurationTagRulesOutputReference")
public class QuicksightDataSetRowLevelPermissionTagConfigurationTagRulesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected QuicksightDataSetRowLevelPermissionTagConfigurationTagRulesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightDataSetRowLevelPermissionTagConfigurationTagRulesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public QuicksightDataSetRowLevelPermissionTagConfigurationTagRulesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetMatchAllValue() {
        software.amazon.jsii.Kernel.call(this, "resetMatchAllValue", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagMultiValueDelimiter() {
        software.amazon.jsii.Kernel.call(this, "resetTagMultiValueDelimiter", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getColumnNameInput() {
        return software.amazon.jsii.Kernel.get(this, "columnNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMatchAllValueInput() {
        return software.amazon.jsii.Kernel.get(this, "matchAllValueInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTagKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "tagKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTagMultiValueDelimiterInput() {
        return software.amazon.jsii.Kernel.get(this, "tagMultiValueDelimiterInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getColumnName() {
        return software.amazon.jsii.Kernel.get(this, "columnName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setColumnName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "columnName", java.util.Objects.requireNonNull(value, "columnName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMatchAllValue() {
        return software.amazon.jsii.Kernel.get(this, "matchAllValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMatchAllValue(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "matchAllValue", java.util.Objects.requireNonNull(value, "matchAllValue is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTagKey() {
        return software.amazon.jsii.Kernel.get(this, "tagKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTagKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tagKey", java.util.Objects.requireNonNull(value, "tagKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTagMultiValueDelimiter() {
        return software.amazon.jsii.Kernel.get(this, "tagMultiValueDelimiter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTagMultiValueDelimiter(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tagMultiValueDelimiter", java.util.Objects.requireNonNull(value, "tagMultiValueDelimiter is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetRowLevelPermissionTagConfigurationTagRules value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
