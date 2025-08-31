package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.113Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindowOutputReference")
public class QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindowOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindowOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindowOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindowOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getColumnNameInput() {
        return software.amazon.jsii.Kernel.get(this, "columnNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "sizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSizeUnitInput() {
        return software.amazon.jsii.Kernel.get(this, "sizeUnitInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getColumnName() {
        return software.amazon.jsii.Kernel.get(this, "columnName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setColumnName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "columnName", java.util.Objects.requireNonNull(value, "columnName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSize() {
        return software.amazon.jsii.Kernel.get(this, "size", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "size", java.util.Objects.requireNonNull(value, "size is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSizeUnit() {
        return software.amazon.jsii.Kernel.get(this, "sizeUnit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSizeUnit(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sizeUnit", java.util.Objects.requireNonNull(value, "sizeUnit is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
