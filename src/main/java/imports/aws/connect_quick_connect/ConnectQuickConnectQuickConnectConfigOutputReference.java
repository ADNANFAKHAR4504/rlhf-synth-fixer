package imports.aws.connect_quick_connect;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.388Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.connectQuickConnect.ConnectQuickConnectQuickConnectConfigOutputReference")
public class ConnectQuickConnectQuickConnectConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ConnectQuickConnectQuickConnectConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ConnectQuickConnectQuickConnectConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ConnectQuickConnectQuickConnectConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putPhoneConfig(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.connect_quick_connect.ConnectQuickConnectQuickConnectConfigPhoneConfig>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.connect_quick_connect.ConnectQuickConnectQuickConnectConfigPhoneConfig> __cast_cd4240 = (java.util.List<imports.aws.connect_quick_connect.ConnectQuickConnectQuickConnectConfigPhoneConfig>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.connect_quick_connect.ConnectQuickConnectQuickConnectConfigPhoneConfig __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putPhoneConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putQueueConfig(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.connect_quick_connect.ConnectQuickConnectQuickConnectConfigQueueConfig>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.connect_quick_connect.ConnectQuickConnectQuickConnectConfigQueueConfig> __cast_cd4240 = (java.util.List<imports.aws.connect_quick_connect.ConnectQuickConnectQuickConnectConfigQueueConfig>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.connect_quick_connect.ConnectQuickConnectQuickConnectConfigQueueConfig __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putQueueConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putUserConfig(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.connect_quick_connect.ConnectQuickConnectQuickConnectConfigUserConfig>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.connect_quick_connect.ConnectQuickConnectQuickConnectConfigUserConfig> __cast_cd4240 = (java.util.List<imports.aws.connect_quick_connect.ConnectQuickConnectQuickConnectConfigUserConfig>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.connect_quick_connect.ConnectQuickConnectQuickConnectConfigUserConfig __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putUserConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetPhoneConfig() {
        software.amazon.jsii.Kernel.call(this, "resetPhoneConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetQueueConfig() {
        software.amazon.jsii.Kernel.call(this, "resetQueueConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUserConfig() {
        software.amazon.jsii.Kernel.call(this, "resetUserConfig", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.connect_quick_connect.ConnectQuickConnectQuickConnectConfigPhoneConfigList getPhoneConfig() {
        return software.amazon.jsii.Kernel.get(this, "phoneConfig", software.amazon.jsii.NativeType.forClass(imports.aws.connect_quick_connect.ConnectQuickConnectQuickConnectConfigPhoneConfigList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.connect_quick_connect.ConnectQuickConnectQuickConnectConfigQueueConfigList getQueueConfig() {
        return software.amazon.jsii.Kernel.get(this, "queueConfig", software.amazon.jsii.NativeType.forClass(imports.aws.connect_quick_connect.ConnectQuickConnectQuickConnectConfigQueueConfigList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.connect_quick_connect.ConnectQuickConnectQuickConnectConfigUserConfigList getUserConfig() {
        return software.amazon.jsii.Kernel.get(this, "userConfig", software.amazon.jsii.NativeType.forClass(imports.aws.connect_quick_connect.ConnectQuickConnectQuickConnectConfigUserConfigList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPhoneConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "phoneConfigInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getQueueConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "queueConfigInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getQuickConnectTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "quickConnectTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getUserConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "userConfigInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getQuickConnectType() {
        return software.amazon.jsii.Kernel.get(this, "quickConnectType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setQuickConnectType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "quickConnectType", java.util.Objects.requireNonNull(value, "quickConnectType is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.connect_quick_connect.ConnectQuickConnectQuickConnectConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.connect_quick_connect.ConnectQuickConnectQuickConnectConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.connect_quick_connect.ConnectQuickConnectQuickConnectConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
