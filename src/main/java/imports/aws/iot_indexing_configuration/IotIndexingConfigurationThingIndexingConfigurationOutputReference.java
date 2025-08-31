package imports.aws.iot_indexing_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.403Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iotIndexingConfiguration.IotIndexingConfigurationThingIndexingConfigurationOutputReference")
public class IotIndexingConfigurationThingIndexingConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected IotIndexingConfigurationThingIndexingConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected IotIndexingConfigurationThingIndexingConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public IotIndexingConfigurationThingIndexingConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCustomField(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfigurationCustomField>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfigurationCustomField> __cast_cd4240 = (java.util.List<imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfigurationCustomField>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfigurationCustomField __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCustomField", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFilter(final @org.jetbrains.annotations.NotNull imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfigurationFilter value) {
        software.amazon.jsii.Kernel.call(this, "putFilter", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putManagedField(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfigurationManagedField>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfigurationManagedField> __cast_cd4240 = (java.util.List<imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfigurationManagedField>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfigurationManagedField __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putManagedField", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCustomField() {
        software.amazon.jsii.Kernel.call(this, "resetCustomField", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeviceDefenderIndexingMode() {
        software.amazon.jsii.Kernel.call(this, "resetDeviceDefenderIndexingMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFilter() {
        software.amazon.jsii.Kernel.call(this, "resetFilter", software.amazon.jsii.NativeType.VOID);
    }

    public void resetManagedField() {
        software.amazon.jsii.Kernel.call(this, "resetManagedField", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNamedShadowIndexingMode() {
        software.amazon.jsii.Kernel.call(this, "resetNamedShadowIndexingMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetThingConnectivityIndexingMode() {
        software.amazon.jsii.Kernel.call(this, "resetThingConnectivityIndexingMode", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfigurationCustomFieldList getCustomField() {
        return software.amazon.jsii.Kernel.get(this, "customField", software.amazon.jsii.NativeType.forClass(imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfigurationCustomFieldList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfigurationFilterOutputReference getFilter() {
        return software.amazon.jsii.Kernel.get(this, "filter", software.amazon.jsii.NativeType.forClass(imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfigurationFilterOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfigurationManagedFieldList getManagedField() {
        return software.amazon.jsii.Kernel.get(this, "managedField", software.amazon.jsii.NativeType.forClass(imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfigurationManagedFieldList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCustomFieldInput() {
        return software.amazon.jsii.Kernel.get(this, "customFieldInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeviceDefenderIndexingModeInput() {
        return software.amazon.jsii.Kernel.get(this, "deviceDefenderIndexingModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfigurationFilter getFilterInput() {
        return software.amazon.jsii.Kernel.get(this, "filterInput", software.amazon.jsii.NativeType.forClass(imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfigurationFilter.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getManagedFieldInput() {
        return software.amazon.jsii.Kernel.get(this, "managedFieldInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNamedShadowIndexingModeInput() {
        return software.amazon.jsii.Kernel.get(this, "namedShadowIndexingModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getThingConnectivityIndexingModeInput() {
        return software.amazon.jsii.Kernel.get(this, "thingConnectivityIndexingModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getThingIndexingModeInput() {
        return software.amazon.jsii.Kernel.get(this, "thingIndexingModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeviceDefenderIndexingMode() {
        return software.amazon.jsii.Kernel.get(this, "deviceDefenderIndexingMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeviceDefenderIndexingMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deviceDefenderIndexingMode", java.util.Objects.requireNonNull(value, "deviceDefenderIndexingMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNamedShadowIndexingMode() {
        return software.amazon.jsii.Kernel.get(this, "namedShadowIndexingMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNamedShadowIndexingMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "namedShadowIndexingMode", java.util.Objects.requireNonNull(value, "namedShadowIndexingMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getThingConnectivityIndexingMode() {
        return software.amazon.jsii.Kernel.get(this, "thingConnectivityIndexingMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setThingConnectivityIndexingMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "thingConnectivityIndexingMode", java.util.Objects.requireNonNull(value, "thingConnectivityIndexingMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getThingIndexingMode() {
        return software.amazon.jsii.Kernel.get(this, "thingIndexingMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setThingIndexingMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "thingIndexingMode", java.util.Objects.requireNonNull(value, "thingIndexingMode is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
