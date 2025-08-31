package imports.aws.cloudwatch_event_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.277Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchEventEndpoint.CloudwatchEventEndpointRoutingConfigFailoverConfigOutputReference")
public class CloudwatchEventEndpointRoutingConfigFailoverConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudwatchEventEndpointRoutingConfigFailoverConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudwatchEventEndpointRoutingConfigFailoverConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CloudwatchEventEndpointRoutingConfigFailoverConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putPrimary(final @org.jetbrains.annotations.NotNull imports.aws.cloudwatch_event_endpoint.CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary value) {
        software.amazon.jsii.Kernel.call(this, "putPrimary", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSecondary(final @org.jetbrains.annotations.NotNull imports.aws.cloudwatch_event_endpoint.CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary value) {
        software.amazon.jsii.Kernel.call(this, "putSecondary", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudwatch_event_endpoint.CloudwatchEventEndpointRoutingConfigFailoverConfigPrimaryOutputReference getPrimary() {
        return software.amazon.jsii.Kernel.get(this, "primary", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_endpoint.CloudwatchEventEndpointRoutingConfigFailoverConfigPrimaryOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudwatch_event_endpoint.CloudwatchEventEndpointRoutingConfigFailoverConfigSecondaryOutputReference getSecondary() {
        return software.amazon.jsii.Kernel.get(this, "secondary", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_endpoint.CloudwatchEventEndpointRoutingConfigFailoverConfigSecondaryOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_endpoint.CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary getPrimaryInput() {
        return software.amazon.jsii.Kernel.get(this, "primaryInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_endpoint.CloudwatchEventEndpointRoutingConfigFailoverConfigPrimary.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_endpoint.CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary getSecondaryInput() {
        return software.amazon.jsii.Kernel.get(this, "secondaryInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_endpoint.CloudwatchEventEndpointRoutingConfigFailoverConfigSecondary.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_endpoint.CloudwatchEventEndpointRoutingConfigFailoverConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_endpoint.CloudwatchEventEndpointRoutingConfigFailoverConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_endpoint.CloudwatchEventEndpointRoutingConfigFailoverConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
