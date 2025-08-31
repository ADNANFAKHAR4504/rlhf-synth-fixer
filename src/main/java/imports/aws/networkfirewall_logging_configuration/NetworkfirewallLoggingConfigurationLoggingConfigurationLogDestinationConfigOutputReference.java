package imports.aws.networkfirewall_logging_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.952Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallLoggingConfiguration.NetworkfirewallLoggingConfigurationLoggingConfigurationLogDestinationConfigOutputReference")
public class NetworkfirewallLoggingConfigurationLoggingConfigurationLogDestinationConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected NetworkfirewallLoggingConfigurationLoggingConfigurationLogDestinationConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected NetworkfirewallLoggingConfigurationLoggingConfigurationLogDestinationConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public NetworkfirewallLoggingConfigurationLoggingConfigurationLogDestinationConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getLogDestinationInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "logDestinationInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLogDestinationTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "logDestinationTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLogTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "logTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getLogDestination() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "logDestination", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setLogDestination(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "logDestination", java.util.Objects.requireNonNull(value, "logDestination is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLogDestinationType() {
        return software.amazon.jsii.Kernel.get(this, "logDestinationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLogDestinationType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "logDestinationType", java.util.Objects.requireNonNull(value, "logDestinationType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLogType() {
        return software.amazon.jsii.Kernel.get(this, "logType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLogType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "logType", java.util.Objects.requireNonNull(value, "logType is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.networkfirewall_logging_configuration.NetworkfirewallLoggingConfigurationLoggingConfigurationLogDestinationConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
