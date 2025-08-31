package imports.aws.glue_trigger;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.306Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueTrigger.GlueTriggerActionsOutputReference")
public class GlueTriggerActionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GlueTriggerActionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GlueTriggerActionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public GlueTriggerActionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putNotificationProperty(final @org.jetbrains.annotations.NotNull imports.aws.glue_trigger.GlueTriggerActionsNotificationProperty value) {
        software.amazon.jsii.Kernel.call(this, "putNotificationProperty", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetArguments() {
        software.amazon.jsii.Kernel.call(this, "resetArguments", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCrawlerName() {
        software.amazon.jsii.Kernel.call(this, "resetCrawlerName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetJobName() {
        software.amazon.jsii.Kernel.call(this, "resetJobName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNotificationProperty() {
        software.amazon.jsii.Kernel.call(this, "resetNotificationProperty", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecurityConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetSecurityConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeout() {
        software.amazon.jsii.Kernel.call(this, "resetTimeout", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.glue_trigger.GlueTriggerActionsNotificationPropertyOutputReference getNotificationProperty() {
        return software.amazon.jsii.Kernel.get(this, "notificationProperty", software.amazon.jsii.NativeType.forClass(imports.aws.glue_trigger.GlueTriggerActionsNotificationPropertyOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getArgumentsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "argumentsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCrawlerNameInput() {
        return software.amazon.jsii.Kernel.get(this, "crawlerNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getJobNameInput() {
        return software.amazon.jsii.Kernel.get(this, "jobNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_trigger.GlueTriggerActionsNotificationProperty getNotificationPropertyInput() {
        return software.amazon.jsii.Kernel.get(this, "notificationPropertyInput", software.amazon.jsii.NativeType.forClass(imports.aws.glue_trigger.GlueTriggerActionsNotificationProperty.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSecurityConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "securityConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTimeoutInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getArguments() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "arguments", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setArguments(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "arguments", java.util.Objects.requireNonNull(value, "arguments is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCrawlerName() {
        return software.amazon.jsii.Kernel.get(this, "crawlerName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCrawlerName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "crawlerName", java.util.Objects.requireNonNull(value, "crawlerName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getJobName() {
        return software.amazon.jsii.Kernel.get(this, "jobName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setJobName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "jobName", java.util.Objects.requireNonNull(value, "jobName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSecurityConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "securityConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSecurityConfiguration(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "securityConfiguration", java.util.Objects.requireNonNull(value, "securityConfiguration is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTimeout() {
        return software.amazon.jsii.Kernel.get(this, "timeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTimeout(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "timeout", java.util.Objects.requireNonNull(value, "timeout is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.glue_trigger.GlueTriggerActions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
