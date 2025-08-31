package imports.aws.sesv2_configuration_set_event_destination;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.457Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesv2ConfigurationSetEventDestination.Sesv2ConfigurationSetEventDestinationEventDestinationKinesisFirehoseDestinationOutputReference")
public class Sesv2ConfigurationSetEventDestinationEventDestinationKinesisFirehoseDestinationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Sesv2ConfigurationSetEventDestinationEventDestinationKinesisFirehoseDestinationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Sesv2ConfigurationSetEventDestinationEventDestinationKinesisFirehoseDestinationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Sesv2ConfigurationSetEventDestinationEventDestinationKinesisFirehoseDestinationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeliveryStreamArnInput() {
        return software.amazon.jsii.Kernel.get(this, "deliveryStreamArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIamRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "iamRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeliveryStreamArn() {
        return software.amazon.jsii.Kernel.get(this, "deliveryStreamArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeliveryStreamArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deliveryStreamArn", java.util.Objects.requireNonNull(value, "deliveryStreamArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIamRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "iamRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIamRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "iamRoleArn", java.util.Objects.requireNonNull(value, "iamRoleArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationKinesisFirehoseDestination getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationKinesisFirehoseDestination.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationKinesisFirehoseDestination value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
