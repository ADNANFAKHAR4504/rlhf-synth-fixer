package imports.aws.quicksight_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.115Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSource.QuicksightDataSourceParametersAwsIotAnalyticsOutputReference")
public class QuicksightDataSourceParametersAwsIotAnalyticsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected QuicksightDataSourceParametersAwsIotAnalyticsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightDataSourceParametersAwsIotAnalyticsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public QuicksightDataSourceParametersAwsIotAnalyticsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDataSetNameInput() {
        return software.amazon.jsii.Kernel.get(this, "dataSetNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDataSetName() {
        return software.amazon.jsii.Kernel.get(this, "dataSetName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDataSetName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dataSetName", java.util.Objects.requireNonNull(value, "dataSetName is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceParametersAwsIotAnalytics getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersAwsIotAnalytics.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceParametersAwsIotAnalytics value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
