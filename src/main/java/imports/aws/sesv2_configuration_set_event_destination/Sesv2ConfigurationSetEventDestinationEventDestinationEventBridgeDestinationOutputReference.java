package imports.aws.sesv2_configuration_set_event_destination;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.457Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesv2ConfigurationSetEventDestination.Sesv2ConfigurationSetEventDestinationEventDestinationEventBridgeDestinationOutputReference")
public class Sesv2ConfigurationSetEventDestinationEventDestinationEventBridgeDestinationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Sesv2ConfigurationSetEventDestinationEventDestinationEventBridgeDestinationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Sesv2ConfigurationSetEventDestinationEventDestinationEventBridgeDestinationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Sesv2ConfigurationSetEventDestinationEventDestinationEventBridgeDestinationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEventBusArnInput() {
        return software.amazon.jsii.Kernel.get(this, "eventBusArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEventBusArn() {
        return software.amazon.jsii.Kernel.get(this, "eventBusArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEventBusArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "eventBusArn", java.util.Objects.requireNonNull(value, "eventBusArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationEventBridgeDestination getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationEventBridgeDestination.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationEventBridgeDestination value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
