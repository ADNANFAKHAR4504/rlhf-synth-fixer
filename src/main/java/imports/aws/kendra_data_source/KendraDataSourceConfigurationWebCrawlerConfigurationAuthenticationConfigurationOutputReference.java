package imports.aws.kendra_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.430Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraDataSource.KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfigurationOutputReference")
public class KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putBasicAuthentication(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfigurationBasicAuthentication>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfigurationBasicAuthentication> __cast_cd4240 = (java.util.List<imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfigurationBasicAuthentication>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfigurationBasicAuthentication __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putBasicAuthentication", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetBasicAuthentication() {
        software.amazon.jsii.Kernel.call(this, "resetBasicAuthentication", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfigurationBasicAuthenticationList getBasicAuthentication() {
        return software.amazon.jsii.Kernel.get(this, "basicAuthentication", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfigurationBasicAuthenticationList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getBasicAuthenticationInput() {
        return software.amazon.jsii.Kernel.get(this, "basicAuthenticationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
