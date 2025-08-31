package imports.aws.autoscaling_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.096Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingGroup.AutoscalingGroupInitialLifecycleHookOutputReference")
public class AutoscalingGroupInitialLifecycleHookOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AutoscalingGroupInitialLifecycleHookOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AutoscalingGroupInitialLifecycleHookOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public AutoscalingGroupInitialLifecycleHookOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetDefaultResult() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultResult", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHeartbeatTimeout() {
        software.amazon.jsii.Kernel.call(this, "resetHeartbeatTimeout", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNotificationMetadata() {
        software.amazon.jsii.Kernel.call(this, "resetNotificationMetadata", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNotificationTargetArn() {
        software.amazon.jsii.Kernel.call(this, "resetNotificationTargetArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDefaultResultInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultResultInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getHeartbeatTimeoutInput() {
        return software.amazon.jsii.Kernel.get(this, "heartbeatTimeoutInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLifecycleTransitionInput() {
        return software.amazon.jsii.Kernel.get(this, "lifecycleTransitionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNotificationMetadataInput() {
        return software.amazon.jsii.Kernel.get(this, "notificationMetadataInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNotificationTargetArnInput() {
        return software.amazon.jsii.Kernel.get(this, "notificationTargetArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "roleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDefaultResult() {
        return software.amazon.jsii.Kernel.get(this, "defaultResult", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDefaultResult(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "defaultResult", java.util.Objects.requireNonNull(value, "defaultResult is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getHeartbeatTimeout() {
        return software.amazon.jsii.Kernel.get(this, "heartbeatTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setHeartbeatTimeout(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "heartbeatTimeout", java.util.Objects.requireNonNull(value, "heartbeatTimeout is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLifecycleTransition() {
        return software.amazon.jsii.Kernel.get(this, "lifecycleTransition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLifecycleTransition(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "lifecycleTransition", java.util.Objects.requireNonNull(value, "lifecycleTransition is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNotificationMetadata() {
        return software.amazon.jsii.Kernel.get(this, "notificationMetadata", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNotificationMetadata(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "notificationMetadata", java.util.Objects.requireNonNull(value, "notificationMetadata is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNotificationTargetArn() {
        return software.amazon.jsii.Kernel.get(this, "notificationTargetArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNotificationTargetArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "notificationTargetArn", java.util.Objects.requireNonNull(value, "notificationTargetArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "roleArn", java.util.Objects.requireNonNull(value, "roleArn is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupInitialLifecycleHook value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
