package imports.aws.sesv2_configuration_set_event_destination;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.457Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesv2ConfigurationSetEventDestination.Sesv2ConfigurationSetEventDestinationEventDestinationOutputReference")
public class Sesv2ConfigurationSetEventDestinationEventDestinationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Sesv2ConfigurationSetEventDestinationEventDestinationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Sesv2ConfigurationSetEventDestinationEventDestinationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Sesv2ConfigurationSetEventDestinationEventDestinationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCloudWatchDestination(final @org.jetbrains.annotations.NotNull imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestination value) {
        software.amazon.jsii.Kernel.call(this, "putCloudWatchDestination", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEventBridgeDestination(final @org.jetbrains.annotations.NotNull imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationEventBridgeDestination value) {
        software.amazon.jsii.Kernel.call(this, "putEventBridgeDestination", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putKinesisFirehoseDestination(final @org.jetbrains.annotations.NotNull imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationKinesisFirehoseDestination value) {
        software.amazon.jsii.Kernel.call(this, "putKinesisFirehoseDestination", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPinpointDestination(final @org.jetbrains.annotations.NotNull imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationPinpointDestination value) {
        software.amazon.jsii.Kernel.call(this, "putPinpointDestination", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSnsDestination(final @org.jetbrains.annotations.NotNull imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationSnsDestination value) {
        software.amazon.jsii.Kernel.call(this, "putSnsDestination", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCloudWatchDestination() {
        software.amazon.jsii.Kernel.call(this, "resetCloudWatchDestination", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEventBridgeDestination() {
        software.amazon.jsii.Kernel.call(this, "resetEventBridgeDestination", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKinesisFirehoseDestination() {
        software.amazon.jsii.Kernel.call(this, "resetKinesisFirehoseDestination", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPinpointDestination() {
        software.amazon.jsii.Kernel.call(this, "resetPinpointDestination", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSnsDestination() {
        software.amazon.jsii.Kernel.call(this, "resetSnsDestination", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestinationOutputReference getCloudWatchDestination() {
        return software.amazon.jsii.Kernel.get(this, "cloudWatchDestination", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestinationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationEventBridgeDestinationOutputReference getEventBridgeDestination() {
        return software.amazon.jsii.Kernel.get(this, "eventBridgeDestination", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationEventBridgeDestinationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationKinesisFirehoseDestinationOutputReference getKinesisFirehoseDestination() {
        return software.amazon.jsii.Kernel.get(this, "kinesisFirehoseDestination", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationKinesisFirehoseDestinationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationPinpointDestinationOutputReference getPinpointDestination() {
        return software.amazon.jsii.Kernel.get(this, "pinpointDestination", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationPinpointDestinationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationSnsDestinationOutputReference getSnsDestination() {
        return software.amazon.jsii.Kernel.get(this, "snsDestination", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationSnsDestinationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestination getCloudWatchDestinationInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudWatchDestinationInput", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestination.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "enabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationEventBridgeDestination getEventBridgeDestinationInput() {
        return software.amazon.jsii.Kernel.get(this, "eventBridgeDestinationInput", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationEventBridgeDestination.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationKinesisFirehoseDestination getKinesisFirehoseDestinationInput() {
        return software.amazon.jsii.Kernel.get(this, "kinesisFirehoseDestinationInput", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationKinesisFirehoseDestination.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getMatchingEventTypesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "matchingEventTypesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationPinpointDestination getPinpointDestinationInput() {
        return software.amazon.jsii.Kernel.get(this, "pinpointDestinationInput", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationPinpointDestination.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationSnsDestination getSnsDestinationInput() {
        return software.amazon.jsii.Kernel.get(this, "snsDestinationInput", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationSnsDestination.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnabled() {
        return software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getMatchingEventTypes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "matchingEventTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setMatchingEventTypes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "matchingEventTypes", java.util.Objects.requireNonNull(value, "matchingEventTypes is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestination getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestination.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestination value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
