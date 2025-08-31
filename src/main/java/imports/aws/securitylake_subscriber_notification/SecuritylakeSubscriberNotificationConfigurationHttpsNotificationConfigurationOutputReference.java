package imports.aws.securitylake_subscriber_notification;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.422Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securitylakeSubscriberNotification.SecuritylakeSubscriberNotificationConfigurationHttpsNotificationConfigurationOutputReference")
public class SecuritylakeSubscriberNotificationConfigurationHttpsNotificationConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SecuritylakeSubscriberNotificationConfigurationHttpsNotificationConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SecuritylakeSubscriberNotificationConfigurationHttpsNotificationConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public SecuritylakeSubscriberNotificationConfigurationHttpsNotificationConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetAuthorizationApiKeyName() {
        software.amazon.jsii.Kernel.call(this, "resetAuthorizationApiKeyName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAuthorizationApiKeyValue() {
        software.amazon.jsii.Kernel.call(this, "resetAuthorizationApiKeyValue", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHttpMethod() {
        software.amazon.jsii.Kernel.call(this, "resetHttpMethod", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAuthorizationApiKeyNameInput() {
        return software.amazon.jsii.Kernel.get(this, "authorizationApiKeyNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAuthorizationApiKeyValueInput() {
        return software.amazon.jsii.Kernel.get(this, "authorizationApiKeyValueInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEndpointInput() {
        return software.amazon.jsii.Kernel.get(this, "endpointInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHttpMethodInput() {
        return software.amazon.jsii.Kernel.get(this, "httpMethodInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTargetRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "targetRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAuthorizationApiKeyName() {
        return software.amazon.jsii.Kernel.get(this, "authorizationApiKeyName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAuthorizationApiKeyName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "authorizationApiKeyName", java.util.Objects.requireNonNull(value, "authorizationApiKeyName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAuthorizationApiKeyValue() {
        return software.amazon.jsii.Kernel.get(this, "authorizationApiKeyValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAuthorizationApiKeyValue(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "authorizationApiKeyValue", java.util.Objects.requireNonNull(value, "authorizationApiKeyValue is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "endpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEndpoint(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "endpoint", java.util.Objects.requireNonNull(value, "endpoint is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHttpMethod() {
        return software.amazon.jsii.Kernel.get(this, "httpMethod", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHttpMethod(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "httpMethod", java.util.Objects.requireNonNull(value, "httpMethod is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTargetRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "targetRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTargetRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "targetRoleArn", java.util.Objects.requireNonNull(value, "targetRoleArn is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.securitylake_subscriber_notification.SecuritylakeSubscriberNotificationConfigurationHttpsNotificationConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
