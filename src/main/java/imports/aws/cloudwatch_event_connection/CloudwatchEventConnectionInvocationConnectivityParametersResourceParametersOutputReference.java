package imports.aws.cloudwatch_event_connection;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.272Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchEventConnection.CloudwatchEventConnectionInvocationConnectivityParametersResourceParametersOutputReference")
public class CloudwatchEventConnectionInvocationConnectivityParametersResourceParametersOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudwatchEventConnectionInvocationConnectivityParametersResourceParametersOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudwatchEventConnectionInvocationConnectivityParametersResourceParametersOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CloudwatchEventConnectionInvocationConnectivityParametersResourceParametersOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getResourceAssociationArn() {
        return software.amazon.jsii.Kernel.get(this, "resourceAssociationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getResourceConfigurationArnInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceConfigurationArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getResourceConfigurationArn() {
        return software.amazon.jsii.Kernel.get(this, "resourceConfigurationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setResourceConfigurationArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "resourceConfigurationArn", java.util.Objects.requireNonNull(value, "resourceConfigurationArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionInvocationConnectivityParametersResourceParameters getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionInvocationConnectivityParametersResourceParameters.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionInvocationConnectivityParametersResourceParameters value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
