package imports.aws.glue_trigger;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.306Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueTrigger.GlueTriggerActionsNotificationPropertyOutputReference")
public class GlueTriggerActionsNotificationPropertyOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GlueTriggerActionsNotificationPropertyOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GlueTriggerActionsNotificationPropertyOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public GlueTriggerActionsNotificationPropertyOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetNotifyDelayAfter() {
        software.amazon.jsii.Kernel.call(this, "resetNotifyDelayAfter", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getNotifyDelayAfterInput() {
        return software.amazon.jsii.Kernel.get(this, "notifyDelayAfterInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getNotifyDelayAfter() {
        return software.amazon.jsii.Kernel.get(this, "notifyDelayAfter", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setNotifyDelayAfter(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "notifyDelayAfter", java.util.Objects.requireNonNull(value, "notifyDelayAfter is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_trigger.GlueTriggerActionsNotificationProperty getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.glue_trigger.GlueTriggerActionsNotificationProperty.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.glue_trigger.GlueTriggerActionsNotificationProperty value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
