package imports.aws.kendra_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.430Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraDataSource.KendraDataSourceConfigurationWebCrawlerConfigurationOutputReference")
public class KendraDataSourceConfigurationWebCrawlerConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KendraDataSourceConfigurationWebCrawlerConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KendraDataSourceConfigurationWebCrawlerConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KendraDataSourceConfigurationWebCrawlerConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAuthenticationConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putAuthenticationConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putProxyConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationProxyConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putProxyConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putUrls(final @org.jetbrains.annotations.NotNull imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrls value) {
        software.amazon.jsii.Kernel.call(this, "putUrls", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAuthenticationConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetAuthenticationConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCrawlDepth() {
        software.amazon.jsii.Kernel.call(this, "resetCrawlDepth", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxContentSizePerPageInMegaBytes() {
        software.amazon.jsii.Kernel.call(this, "resetMaxContentSizePerPageInMegaBytes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxLinksPerPage() {
        software.amazon.jsii.Kernel.call(this, "resetMaxLinksPerPage", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxUrlsPerMinuteCrawlRate() {
        software.amazon.jsii.Kernel.call(this, "resetMaxUrlsPerMinuteCrawlRate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProxyConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetProxyConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUrlExclusionPatterns() {
        software.amazon.jsii.Kernel.call(this, "resetUrlExclusionPatterns", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUrlInclusionPatterns() {
        software.amazon.jsii.Kernel.call(this, "resetUrlInclusionPatterns", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfigurationOutputReference getAuthenticationConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "authenticationConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationProxyConfigurationOutputReference getProxyConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "proxyConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationProxyConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrlsOutputReference getUrls() {
        return software.amazon.jsii.Kernel.get(this, "urls", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrlsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfiguration getAuthenticationConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "authenticationConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getCrawlDepthInput() {
        return software.amazon.jsii.Kernel.get(this, "crawlDepthInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxContentSizePerPageInMegaBytesInput() {
        return software.amazon.jsii.Kernel.get(this, "maxContentSizePerPageInMegaBytesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxLinksPerPageInput() {
        return software.amazon.jsii.Kernel.get(this, "maxLinksPerPageInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxUrlsPerMinuteCrawlRateInput() {
        return software.amazon.jsii.Kernel.get(this, "maxUrlsPerMinuteCrawlRateInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationProxyConfiguration getProxyConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "proxyConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationProxyConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getUrlExclusionPatternsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "urlExclusionPatternsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getUrlInclusionPatternsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "urlInclusionPatternsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrls getUrlsInput() {
        return software.amazon.jsii.Kernel.get(this, "urlsInput", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationUrls.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getCrawlDepth() {
        return software.amazon.jsii.Kernel.get(this, "crawlDepth", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setCrawlDepth(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "crawlDepth", java.util.Objects.requireNonNull(value, "crawlDepth is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxContentSizePerPageInMegaBytes() {
        return software.amazon.jsii.Kernel.get(this, "maxContentSizePerPageInMegaBytes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxContentSizePerPageInMegaBytes(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxContentSizePerPageInMegaBytes", java.util.Objects.requireNonNull(value, "maxContentSizePerPageInMegaBytes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxLinksPerPage() {
        return software.amazon.jsii.Kernel.get(this, "maxLinksPerPage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxLinksPerPage(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxLinksPerPage", java.util.Objects.requireNonNull(value, "maxLinksPerPage is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxUrlsPerMinuteCrawlRate() {
        return software.amazon.jsii.Kernel.get(this, "maxUrlsPerMinuteCrawlRate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxUrlsPerMinuteCrawlRate(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxUrlsPerMinuteCrawlRate", java.util.Objects.requireNonNull(value, "maxUrlsPerMinuteCrawlRate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getUrlExclusionPatterns() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "urlExclusionPatterns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setUrlExclusionPatterns(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "urlExclusionPatterns", java.util.Objects.requireNonNull(value, "urlExclusionPatterns is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getUrlInclusionPatterns() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "urlInclusionPatterns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setUrlInclusionPatterns(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "urlInclusionPatterns", java.util.Objects.requireNonNull(value, "urlInclusionPatterns is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
