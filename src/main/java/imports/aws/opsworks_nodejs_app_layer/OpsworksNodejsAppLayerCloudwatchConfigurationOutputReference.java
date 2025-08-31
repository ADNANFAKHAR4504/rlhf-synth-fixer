package imports.aws.opsworks_nodejs_app_layer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.029Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opsworksNodejsAppLayer.OpsworksNodejsAppLayerCloudwatchConfigurationOutputReference")
public class OpsworksNodejsAppLayerCloudwatchConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected OpsworksNodejsAppLayerCloudwatchConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected OpsworksNodejsAppLayerCloudwatchConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public OpsworksNodejsAppLayerCloudwatchConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putLogStreams(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.opsworks_nodejs_app_layer.OpsworksNodejsAppLayerCloudwatchConfigurationLogStreams>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.opsworks_nodejs_app_layer.OpsworksNodejsAppLayerCloudwatchConfigurationLogStreams> __cast_cd4240 = (java.util.List<imports.aws.opsworks_nodejs_app_layer.OpsworksNodejsAppLayerCloudwatchConfigurationLogStreams>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.opsworks_nodejs_app_layer.OpsworksNodejsAppLayerCloudwatchConfigurationLogStreams __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putLogStreams", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLogStreams() {
        software.amazon.jsii.Kernel.call(this, "resetLogStreams", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.opsworks_nodejs_app_layer.OpsworksNodejsAppLayerCloudwatchConfigurationLogStreamsList getLogStreams() {
        return software.amazon.jsii.Kernel.get(this, "logStreams", software.amazon.jsii.NativeType.forClass(imports.aws.opsworks_nodejs_app_layer.OpsworksNodejsAppLayerCloudwatchConfigurationLogStreamsList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "enabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLogStreamsInput() {
        return software.amazon.jsii.Kernel.get(this, "logStreamsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnabled() {
        return software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.opsworks_nodejs_app_layer.OpsworksNodejsAppLayerCloudwatchConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.opsworks_nodejs_app_layer.OpsworksNodejsAppLayerCloudwatchConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.opsworks_nodejs_app_layer.OpsworksNodejsAppLayerCloudwatchConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
