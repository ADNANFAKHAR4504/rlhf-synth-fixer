package imports.aws.securitylake_subscriber_notification;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.423Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securitylakeSubscriberNotification.SecuritylakeSubscriberNotificationConfigurationOutputReference")
public class SecuritylakeSubscriberNotificationConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SecuritylakeSubscriberNotificationConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SecuritylakeSubscriberNotificationConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public SecuritylakeSubscriberNotificationConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putHttpsNotificationConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securitylake_subscriber_notification.SecuritylakeSubscriberNotificationConfigurationHttpsNotificationConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securitylake_subscriber_notification.SecuritylakeSubscriberNotificationConfigurationHttpsNotificationConfiguration> __cast_cd4240 = (java.util.List<imports.aws.securitylake_subscriber_notification.SecuritylakeSubscriberNotificationConfigurationHttpsNotificationConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securitylake_subscriber_notification.SecuritylakeSubscriberNotificationConfigurationHttpsNotificationConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putHttpsNotificationConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSqsNotificationConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securitylake_subscriber_notification.SecuritylakeSubscriberNotificationConfigurationSqsNotificationConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securitylake_subscriber_notification.SecuritylakeSubscriberNotificationConfigurationSqsNotificationConfiguration> __cast_cd4240 = (java.util.List<imports.aws.securitylake_subscriber_notification.SecuritylakeSubscriberNotificationConfigurationSqsNotificationConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securitylake_subscriber_notification.SecuritylakeSubscriberNotificationConfigurationSqsNotificationConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSqsNotificationConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetHttpsNotificationConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetHttpsNotificationConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSqsNotificationConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetSqsNotificationConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securitylake_subscriber_notification.SecuritylakeSubscriberNotificationConfigurationHttpsNotificationConfigurationList getHttpsNotificationConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "httpsNotificationConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.securitylake_subscriber_notification.SecuritylakeSubscriberNotificationConfigurationHttpsNotificationConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securitylake_subscriber_notification.SecuritylakeSubscriberNotificationConfigurationSqsNotificationConfigurationList getSqsNotificationConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "sqsNotificationConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.securitylake_subscriber_notification.SecuritylakeSubscriberNotificationConfigurationSqsNotificationConfigurationList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getHttpsNotificationConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "httpsNotificationConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSqsNotificationConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "sqsNotificationConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.securitylake_subscriber_notification.SecuritylakeSubscriberNotificationConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
