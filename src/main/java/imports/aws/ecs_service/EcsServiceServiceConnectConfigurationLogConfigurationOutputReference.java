package imports.aws.ecs_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.132Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsService.EcsServiceServiceConnectConfigurationLogConfigurationOutputReference")
public class EcsServiceServiceConnectConfigurationLogConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EcsServiceServiceConnectConfigurationLogConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EcsServiceServiceConnectConfigurationLogConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EcsServiceServiceConnectConfigurationLogConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putSecretOption(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ecs_service.EcsServiceServiceConnectConfigurationLogConfigurationSecretOption>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ecs_service.EcsServiceServiceConnectConfigurationLogConfigurationSecretOption> __cast_cd4240 = (java.util.List<imports.aws.ecs_service.EcsServiceServiceConnectConfigurationLogConfigurationSecretOption>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ecs_service.EcsServiceServiceConnectConfigurationLogConfigurationSecretOption __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSecretOption", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetOptions() {
        software.amazon.jsii.Kernel.call(this, "resetOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecretOption() {
        software.amazon.jsii.Kernel.call(this, "resetSecretOption", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ecs_service.EcsServiceServiceConnectConfigurationLogConfigurationSecretOptionList getSecretOption() {
        return software.amazon.jsii.Kernel.get(this, "secretOption", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_service.EcsServiceServiceConnectConfigurationLogConfigurationSecretOptionList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLogDriverInput() {
        return software.amazon.jsii.Kernel.get(this, "logDriverInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getOptionsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "optionsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSecretOptionInput() {
        return software.amazon.jsii.Kernel.get(this, "secretOptionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLogDriver() {
        return software.amazon.jsii.Kernel.get(this, "logDriver", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLogDriver(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "logDriver", java.util.Objects.requireNonNull(value, "logDriver is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getOptions() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "options", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setOptions(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "options", java.util.Objects.requireNonNull(value, "options is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ecs_service.EcsServiceServiceConnectConfigurationLogConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_service.EcsServiceServiceConnectConfigurationLogConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ecs_service.EcsServiceServiceConnectConfigurationLogConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
