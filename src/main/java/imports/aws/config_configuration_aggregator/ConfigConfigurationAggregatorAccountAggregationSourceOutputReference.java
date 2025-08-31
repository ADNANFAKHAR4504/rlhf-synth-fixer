package imports.aws.config_configuration_aggregator;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.370Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.configConfigurationAggregator.ConfigConfigurationAggregatorAccountAggregationSourceOutputReference")
public class ConfigConfigurationAggregatorAccountAggregationSourceOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ConfigConfigurationAggregatorAccountAggregationSourceOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ConfigConfigurationAggregatorAccountAggregationSourceOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ConfigConfigurationAggregatorAccountAggregationSourceOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAllRegions() {
        software.amazon.jsii.Kernel.call(this, "resetAllRegions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRegions() {
        software.amazon.jsii.Kernel.call(this, "resetRegions", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAccountIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "accountIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAllRegionsInput() {
        return software.amazon.jsii.Kernel.get(this, "allRegionsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getRegionsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "regionsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAccountIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "accountIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAccountIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "accountIds", java.util.Objects.requireNonNull(value, "accountIds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAllRegions() {
        return software.amazon.jsii.Kernel.get(this, "allRegions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAllRegions(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "allRegions", java.util.Objects.requireNonNull(value, "allRegions is required"));
    }

    public void setAllRegions(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "allRegions", java.util.Objects.requireNonNull(value, "allRegions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getRegions() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "regions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setRegions(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "regions", java.util.Objects.requireNonNull(value, "regions is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.config_configuration_aggregator.ConfigConfigurationAggregatorAccountAggregationSource getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.config_configuration_aggregator.ConfigConfigurationAggregatorAccountAggregationSource.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.config_configuration_aggregator.ConfigConfigurationAggregatorAccountAggregationSource value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
