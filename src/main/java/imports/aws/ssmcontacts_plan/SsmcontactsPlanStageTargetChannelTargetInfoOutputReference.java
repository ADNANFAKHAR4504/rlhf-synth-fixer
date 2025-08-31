package imports.aws.ssmcontacts_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.508Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmcontactsPlan.SsmcontactsPlanStageTargetChannelTargetInfoOutputReference")
public class SsmcontactsPlanStageTargetChannelTargetInfoOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SsmcontactsPlanStageTargetChannelTargetInfoOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SsmcontactsPlanStageTargetChannelTargetInfoOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SsmcontactsPlanStageTargetChannelTargetInfoOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetRetryIntervalInMinutes() {
        software.amazon.jsii.Kernel.call(this, "resetRetryIntervalInMinutes", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getContactChannelIdInput() {
        return software.amazon.jsii.Kernel.get(this, "contactChannelIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRetryIntervalInMinutesInput() {
        return software.amazon.jsii.Kernel.get(this, "retryIntervalInMinutesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getContactChannelId() {
        return software.amazon.jsii.Kernel.get(this, "contactChannelId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setContactChannelId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "contactChannelId", java.util.Objects.requireNonNull(value, "contactChannelId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRetryIntervalInMinutes() {
        return software.amazon.jsii.Kernel.get(this, "retryIntervalInMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRetryIntervalInMinutes(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "retryIntervalInMinutes", java.util.Objects.requireNonNull(value, "retryIntervalInMinutes is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ssmcontacts_plan.SsmcontactsPlanStageTargetChannelTargetInfo getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ssmcontacts_plan.SsmcontactsPlanStageTargetChannelTargetInfo.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ssmcontacts_plan.SsmcontactsPlanStageTargetChannelTargetInfo value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
