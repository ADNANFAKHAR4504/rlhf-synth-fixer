package imports.aws.wafv2_web_acl_logging_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.681Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2WebAclLoggingConfiguration.Wafv2WebAclLoggingConfigurationLoggingFilterOutputReference")
public class Wafv2WebAclLoggingConfigurationLoggingFilterOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Wafv2WebAclLoggingConfigurationLoggingFilterOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Wafv2WebAclLoggingConfigurationLoggingFilterOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Wafv2WebAclLoggingConfigurationLoggingFilterOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putFilter(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilterFilter>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilterFilter> __cast_cd4240 = (java.util.List<imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilterFilter>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilterFilter __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putFilter", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilterFilterList getFilter() {
        return software.amazon.jsii.Kernel.get(this, "filter", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilterFilterList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDefaultBehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultBehaviorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFilterInput() {
        return software.amazon.jsii.Kernel.get(this, "filterInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDefaultBehavior() {
        return software.amazon.jsii.Kernel.get(this, "defaultBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDefaultBehavior(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "defaultBehavior", java.util.Objects.requireNonNull(value, "defaultBehavior is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilter getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilter.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl_logging_configuration.Wafv2WebAclLoggingConfigurationLoggingFilter value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
