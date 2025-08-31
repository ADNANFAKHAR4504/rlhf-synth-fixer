package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.113Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetRefreshPropertiesRefreshConfigurationOutputReference")
public class QuicksightDataSetRefreshPropertiesRefreshConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected QuicksightDataSetRefreshPropertiesRefreshConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightDataSetRefreshPropertiesRefreshConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public QuicksightDataSetRefreshPropertiesRefreshConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putIncrementalRefresh(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh value) {
        software.amazon.jsii.Kernel.call(this, "putIncrementalRefresh", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshOutputReference getIncrementalRefresh() {
        return software.amazon.jsii.Kernel.get(this, "incrementalRefresh", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh getIncrementalRefreshInput() {
        return software.amazon.jsii.Kernel.get(this, "incrementalRefreshInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
