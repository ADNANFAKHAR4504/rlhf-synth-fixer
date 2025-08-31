package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.113Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshOutputReference")
public class QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putLookbackWindow(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow value) {
        software.amazon.jsii.Kernel.call(this, "putLookbackWindow", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindowOutputReference getLookbackWindow() {
        return software.amazon.jsii.Kernel.get(this, "lookbackWindow", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindowOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow getLookbackWindowInput() {
        return software.amazon.jsii.Kernel.get(this, "lookbackWindowInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
