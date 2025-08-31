package imports.aws.bedrockagent_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.165Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentDataSource.BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfigurationCrawlerLimitsOutputReference")
public class BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfigurationCrawlerLimitsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfigurationCrawlerLimitsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfigurationCrawlerLimitsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfigurationCrawlerLimitsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetMaxPages() {
        software.amazon.jsii.Kernel.call(this, "resetMaxPages", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRateLimit() {
        software.amazon.jsii.Kernel.call(this, "resetRateLimit", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxPagesInput() {
        return software.amazon.jsii.Kernel.get(this, "maxPagesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRateLimitInput() {
        return software.amazon.jsii.Kernel.get(this, "rateLimitInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxPages() {
        return software.amazon.jsii.Kernel.get(this, "maxPages", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxPages(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxPages", java.util.Objects.requireNonNull(value, "maxPages is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRateLimit() {
        return software.amazon.jsii.Kernel.get(this, "rateLimit", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRateLimit(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "rateLimit", java.util.Objects.requireNonNull(value, "rateLimit is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfigurationCrawlerLimits value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
