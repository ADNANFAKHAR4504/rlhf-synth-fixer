package imports.aws.kendra_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.430Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraDataSource.KendraDataSourceConfigurationWebCrawlerConfigurationUrlsOutputReference")
public class KendraDataSourceConfigurationWebCrawlerConfigurationUrlsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KendraDataSourceConfigurationWebCrawlerConfigurationUrlsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KendraDataSourceConfigurationWebCrawlerConfigurationUrlsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KendraDataSourceConfigurationWebCrawlerConfigurationUrlsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putSeedUrlConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSeedUrlConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putSeedUrlConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSiteMapsConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSiteMapsConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putSiteMapsConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetSeedUrlConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetSeedUrlConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSiteMapsConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetSiteMapsConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSeedUrlConfigurationOutputReference getSeedUrlConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "seedUrlConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSeedUrlConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSiteMapsConfigurationOutputReference getSiteMapsConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "siteMapsConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSiteMapsConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSeedUrlConfiguration getSeedUrlConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "seedUrlConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSeedUrlConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSiteMapsConfiguration getSiteMapsConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "siteMapsConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrlsSiteMapsConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrls getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrls.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrls value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
