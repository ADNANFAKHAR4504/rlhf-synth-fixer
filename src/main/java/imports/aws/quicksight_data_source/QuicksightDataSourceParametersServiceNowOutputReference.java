package imports.aws.quicksight_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.116Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSource.QuicksightDataSourceParametersServiceNowOutputReference")
public class QuicksightDataSourceParametersServiceNowOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected QuicksightDataSourceParametersServiceNowOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightDataSourceParametersServiceNowOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public QuicksightDataSourceParametersServiceNowOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSiteBaseUrlInput() {
        return software.amazon.jsii.Kernel.get(this, "siteBaseUrlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSiteBaseUrl() {
        return software.amazon.jsii.Kernel.get(this, "siteBaseUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSiteBaseUrl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "siteBaseUrl", java.util.Objects.requireNonNull(value, "siteBaseUrl is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceParametersServiceNow getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersServiceNow.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceParametersServiceNow value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
