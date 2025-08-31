package imports.aws.networkfirewall_logging_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.952Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallLoggingConfiguration.NetworkfirewallLoggingConfigurationLoggingConfigurationOutputReference")
public class NetworkfirewallLoggingConfigurationLoggingConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected NetworkfirewallLoggingConfigurationLoggingConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected NetworkfirewallLoggingConfigurationLoggingConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public NetworkfirewallLoggingConfigurationLoggingConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putLogDestinationConfig(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.networkfirewall_logging_configuration.NetworkfirewallLoggingConfigurationLoggingConfigurationLogDestinationConfig>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.networkfirewall_logging_configuration.NetworkfirewallLoggingConfigurationLoggingConfigurationLogDestinationConfig> __cast_cd4240 = (java.util.List<imports.aws.networkfirewall_logging_configuration.NetworkfirewallLoggingConfigurationLoggingConfigurationLogDestinationConfig>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.networkfirewall_logging_configuration.NetworkfirewallLoggingConfigurationLoggingConfigurationLogDestinationConfig __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putLogDestinationConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.networkfirewall_logging_configuration.NetworkfirewallLoggingConfigurationLoggingConfigurationLogDestinationConfigList getLogDestinationConfig() {
        return software.amazon.jsii.Kernel.get(this, "logDestinationConfig", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_logging_configuration.NetworkfirewallLoggingConfigurationLoggingConfigurationLogDestinationConfigList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLogDestinationConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "logDestinationConfigInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.networkfirewall_logging_configuration.NetworkfirewallLoggingConfigurationLoggingConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_logging_configuration.NetworkfirewallLoggingConfigurationLoggingConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.networkfirewall_logging_configuration.NetworkfirewallLoggingConfigurationLoggingConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
