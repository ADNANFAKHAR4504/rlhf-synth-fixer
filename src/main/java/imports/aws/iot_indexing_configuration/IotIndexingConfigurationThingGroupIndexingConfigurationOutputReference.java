package imports.aws.iot_indexing_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.402Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iotIndexingConfiguration.IotIndexingConfigurationThingGroupIndexingConfigurationOutputReference")
public class IotIndexingConfigurationThingGroupIndexingConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected IotIndexingConfigurationThingGroupIndexingConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected IotIndexingConfigurationThingGroupIndexingConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public IotIndexingConfigurationThingGroupIndexingConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingGroupIndexingConfigurationCustomField>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingGroupIndexingConfigurationCustomField> __cast_cd4240 = (java.util.List<imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingGroupIndexingConfigurationCustomField>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingGroupIndexingConfigurationCustomField __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCustomField", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingGroupIndexingConfigurationManagedField>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingGroupIndexingConfigurationManagedField> __cast_cd4240 = (java.util.List<imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingGroupIndexingConfigurationManagedField>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingGroupIndexingConfigurationManagedField __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putManagedField", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCustomField() {
        software.amazon.jsii.Kernel.call(this, "resetCustomField", software.amazon.jsii.NativeType.VOID);
    }

    public void resetManagedField() {
        software.amazon.jsii.Kernel.call(this, "resetManagedField", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingGroupIndexingConfigurationCustomFieldList getCustomField() {
        return software.amazon.jsii.Kernel.get(this, "customField", software.amazon.jsii.NativeType.forClass(imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingGroupIndexingConfigurationCustomFieldList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingGroupIndexingConfigurationManagedFieldList getManagedField() {
        return software.amazon.jsii.Kernel.get(this, "managedField", software.amazon.jsii.NativeType.forClass(imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingGroupIndexingConfigurationManagedFieldList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCustomFieldInput() {
        return software.amazon.jsii.Kernel.get(this, "customFieldInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getManagedFieldInput() {
        return software.amazon.jsii.Kernel.get(this, "managedFieldInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getThingGroupIndexingModeInput() {
        return software.amazon.jsii.Kernel.get(this, "thingGroupIndexingModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getThingGroupIndexingMode() {
        return software.amazon.jsii.Kernel.get(this, "thingGroupIndexingMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setThingGroupIndexingMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "thingGroupIndexingMode", java.util.Objects.requireNonNull(value, "thingGroupIndexingMode is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingGroupIndexingConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingGroupIndexingConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingGroupIndexingConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
