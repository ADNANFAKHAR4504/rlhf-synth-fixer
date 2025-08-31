package imports.aws.securitylake_custom_log_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.419Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securitylakeCustomLogSource.SecuritylakeCustomLogSourceConfigurationOutputReference")
public class SecuritylakeCustomLogSourceConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SecuritylakeCustomLogSourceConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SecuritylakeCustomLogSourceConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public SecuritylakeCustomLogSourceConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putCrawlerConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSourceConfigurationCrawlerConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSourceConfigurationCrawlerConfiguration> __cast_cd4240 = (java.util.List<imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSourceConfigurationCrawlerConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSourceConfigurationCrawlerConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCrawlerConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putProviderIdentity(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSourceConfigurationProviderIdentity>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSourceConfigurationProviderIdentity> __cast_cd4240 = (java.util.List<imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSourceConfigurationProviderIdentity>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSourceConfigurationProviderIdentity __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putProviderIdentity", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCrawlerConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetCrawlerConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProviderIdentity() {
        software.amazon.jsii.Kernel.call(this, "resetProviderIdentity", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSourceConfigurationCrawlerConfigurationList getCrawlerConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "crawlerConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSourceConfigurationCrawlerConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSourceConfigurationProviderIdentityList getProviderIdentity() {
        return software.amazon.jsii.Kernel.get(this, "providerIdentity", software.amazon.jsii.NativeType.forClass(imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSourceConfigurationProviderIdentityList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCrawlerConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "crawlerConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getProviderIdentityInput() {
        return software.amazon.jsii.Kernel.get(this, "providerIdentityInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSourceConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
