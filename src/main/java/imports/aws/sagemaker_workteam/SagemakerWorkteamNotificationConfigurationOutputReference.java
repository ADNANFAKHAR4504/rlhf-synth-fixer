package imports.aws.sagemaker_workteam;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.357Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerWorkteam.SagemakerWorkteamNotificationConfigurationOutputReference")
public class SagemakerWorkteamNotificationConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerWorkteamNotificationConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerWorkteamNotificationConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerWorkteamNotificationConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetNotificationTopicArn() {
        software.amazon.jsii.Kernel.call(this, "resetNotificationTopicArn", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNotificationTopicArnInput() {
        return software.amazon.jsii.Kernel.get(this, "notificationTopicArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNotificationTopicArn() {
        return software.amazon.jsii.Kernel.get(this, "notificationTopicArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNotificationTopicArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "notificationTopicArn", java.util.Objects.requireNonNull(value, "notificationTopicArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_workteam.SagemakerWorkteamNotificationConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_workteam.SagemakerWorkteamNotificationConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_workteam.SagemakerWorkteamNotificationConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
