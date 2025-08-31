package imports.aws.media_convert_queue;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.857Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mediaConvertQueue.MediaConvertQueueReservationPlanSettingsOutputReference")
public class MediaConvertQueueReservationPlanSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MediaConvertQueueReservationPlanSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MediaConvertQueueReservationPlanSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MediaConvertQueueReservationPlanSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCommitmentInput() {
        return software.amazon.jsii.Kernel.get(this, "commitmentInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRenewalTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "renewalTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getReservedSlotsInput() {
        return software.amazon.jsii.Kernel.get(this, "reservedSlotsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCommitment() {
        return software.amazon.jsii.Kernel.get(this, "commitment", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCommitment(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "commitment", java.util.Objects.requireNonNull(value, "commitment is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRenewalType() {
        return software.amazon.jsii.Kernel.get(this, "renewalType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRenewalType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "renewalType", java.util.Objects.requireNonNull(value, "renewalType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getReservedSlots() {
        return software.amazon.jsii.Kernel.get(this, "reservedSlots", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setReservedSlots(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "reservedSlots", java.util.Objects.requireNonNull(value, "reservedSlots is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.media_convert_queue.MediaConvertQueueReservationPlanSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.media_convert_queue.MediaConvertQueueReservationPlanSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.media_convert_queue.MediaConvertQueueReservationPlanSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
