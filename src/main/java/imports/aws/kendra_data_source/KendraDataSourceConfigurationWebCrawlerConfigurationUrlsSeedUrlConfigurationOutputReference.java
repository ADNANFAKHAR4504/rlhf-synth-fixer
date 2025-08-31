package imports.aws.kendra_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.430Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraDataSource.KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSeedUrlConfigurationOutputReference")
public class KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSeedUrlConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSeedUrlConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSeedUrlConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSeedUrlConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetWebCrawlerMode() {
        software.amazon.jsii.Kernel.call(this, "resetWebCrawlerMode", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSeedUrlsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "seedUrlsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getWebCrawlerModeInput() {
        return software.amazon.jsii.Kernel.get(this, "webCrawlerModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSeedUrls() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "seedUrls", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSeedUrls(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "seedUrls", java.util.Objects.requireNonNull(value, "seedUrls is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWebCrawlerMode() {
        return software.amazon.jsii.Kernel.get(this, "webCrawlerMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setWebCrawlerMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "webCrawlerMode", java.util.Objects.requireNonNull(value, "webCrawlerMode is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSeedUrlConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSeedUrlConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSeedUrlConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
