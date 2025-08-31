package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.106Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetDataSetUsageConfigurationOutputReference")
public class QuicksightDataSetDataSetUsageConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected QuicksightDataSetDataSetUsageConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightDataSetDataSetUsageConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public QuicksightDataSetDataSetUsageConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDisableUseAsDirectQuerySource() {
        software.amazon.jsii.Kernel.call(this, "resetDisableUseAsDirectQuerySource", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDisableUseAsImportedSource() {
        software.amazon.jsii.Kernel.call(this, "resetDisableUseAsImportedSource", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDisableUseAsDirectQuerySourceInput() {
        return software.amazon.jsii.Kernel.get(this, "disableUseAsDirectQuerySourceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDisableUseAsImportedSourceInput() {
        return software.amazon.jsii.Kernel.get(this, "disableUseAsImportedSourceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDisableUseAsDirectQuerySource() {
        return software.amazon.jsii.Kernel.get(this, "disableUseAsDirectQuerySource", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDisableUseAsDirectQuerySource(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "disableUseAsDirectQuerySource", java.util.Objects.requireNonNull(value, "disableUseAsDirectQuerySource is required"));
    }

    public void setDisableUseAsDirectQuerySource(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "disableUseAsDirectQuerySource", java.util.Objects.requireNonNull(value, "disableUseAsDirectQuerySource is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDisableUseAsImportedSource() {
        return software.amazon.jsii.Kernel.get(this, "disableUseAsImportedSource", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDisableUseAsImportedSource(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "disableUseAsImportedSource", java.util.Objects.requireNonNull(value, "disableUseAsImportedSource is required"));
    }

    public void setDisableUseAsImportedSource(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "disableUseAsImportedSource", java.util.Objects.requireNonNull(value, "disableUseAsImportedSource is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetDataSetUsageConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetDataSetUsageConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetDataSetUsageConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
