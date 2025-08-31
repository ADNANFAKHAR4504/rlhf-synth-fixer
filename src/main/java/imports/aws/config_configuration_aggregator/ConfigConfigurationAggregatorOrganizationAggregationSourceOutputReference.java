package imports.aws.config_configuration_aggregator;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.370Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.configConfigurationAggregator.ConfigConfigurationAggregatorOrganizationAggregationSourceOutputReference")
public class ConfigConfigurationAggregatorOrganizationAggregationSourceOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ConfigConfigurationAggregatorOrganizationAggregationSourceOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ConfigConfigurationAggregatorOrganizationAggregationSourceOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ConfigConfigurationAggregatorOrganizationAggregationSourceOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAllRegions() {
        software.amazon.jsii.Kernel.call(this, "resetAllRegions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRegions() {
        software.amazon.jsii.Kernel.call(this, "resetRegions", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAllRegionsInput() {
        return software.amazon.jsii.Kernel.get(this, "allRegionsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getRegionsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "regionsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "roleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "roleArn", java.util.Objects.requireNonNull(value, "roleArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.config_configuration_aggregator.ConfigConfigurationAggregatorOrganizationAggregationSource getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.config_configuration_aggregator.ConfigConfigurationAggregatorOrganizationAggregationSource.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.config_configuration_aggregator.ConfigConfigurationAggregatorOrganizationAggregationSource value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
