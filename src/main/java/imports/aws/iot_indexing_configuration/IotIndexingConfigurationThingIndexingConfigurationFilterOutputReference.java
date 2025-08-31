package imports.aws.iot_indexing_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.403Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iotIndexingConfiguration.IotIndexingConfigurationThingIndexingConfigurationFilterOutputReference")
public class IotIndexingConfigurationThingIndexingConfigurationFilterOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected IotIndexingConfigurationThingIndexingConfigurationFilterOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected IotIndexingConfigurationThingIndexingConfigurationFilterOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public IotIndexingConfigurationThingIndexingConfigurationFilterOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetNamedShadowNames() {
        software.amazon.jsii.Kernel.call(this, "resetNamedShadowNames", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getNamedShadowNamesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "namedShadowNamesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getNamedShadowNames() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "namedShadowNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setNamedShadowNames(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "namedShadowNames", java.util.Objects.requireNonNull(value, "namedShadowNames is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfigurationFilter getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfigurationFilter.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfigurationFilter value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
