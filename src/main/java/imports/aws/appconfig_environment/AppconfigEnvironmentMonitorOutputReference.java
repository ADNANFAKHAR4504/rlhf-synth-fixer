package imports.aws.appconfig_environment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.984Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appconfigEnvironment.AppconfigEnvironmentMonitorOutputReference")
public class AppconfigEnvironmentMonitorOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppconfigEnvironmentMonitorOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppconfigEnvironmentMonitorOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public AppconfigEnvironmentMonitorOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetAlarmRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetAlarmRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAlarmArnInput() {
        return software.amazon.jsii.Kernel.get(this, "alarmArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAlarmRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "alarmRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAlarmArn() {
        return software.amazon.jsii.Kernel.get(this, "alarmArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAlarmArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "alarmArn", java.util.Objects.requireNonNull(value, "alarmArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAlarmRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "alarmRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAlarmRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "alarmRoleArn", java.util.Objects.requireNonNull(value, "alarmRoleArn is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appconfig_environment.AppconfigEnvironmentMonitor value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
