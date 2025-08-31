package imports.aws.gamelift_game_session_queue;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.267Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.gameliftGameSessionQueue.GameliftGameSessionQueuePlayerLatencyPolicyOutputReference")
public class GameliftGameSessionQueuePlayerLatencyPolicyOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GameliftGameSessionQueuePlayerLatencyPolicyOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GameliftGameSessionQueuePlayerLatencyPolicyOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public GameliftGameSessionQueuePlayerLatencyPolicyOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetPolicyDurationSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetPolicyDurationSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaximumIndividualPlayerLatencyMillisecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "maximumIndividualPlayerLatencyMillisecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPolicyDurationSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "policyDurationSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaximumIndividualPlayerLatencyMilliseconds() {
        return software.amazon.jsii.Kernel.get(this, "maximumIndividualPlayerLatencyMilliseconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaximumIndividualPlayerLatencyMilliseconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maximumIndividualPlayerLatencyMilliseconds", java.util.Objects.requireNonNull(value, "maximumIndividualPlayerLatencyMilliseconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPolicyDurationSeconds() {
        return software.amazon.jsii.Kernel.get(this, "policyDurationSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPolicyDurationSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "policyDurationSeconds", java.util.Objects.requireNonNull(value, "policyDurationSeconds is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.gamelift_game_session_queue.GameliftGameSessionQueuePlayerLatencyPolicy value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
