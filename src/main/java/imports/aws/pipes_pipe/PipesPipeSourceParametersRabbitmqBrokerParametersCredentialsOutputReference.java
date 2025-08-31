package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.068Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeSourceParametersRabbitmqBrokerParametersCredentialsOutputReference")
public class PipesPipeSourceParametersRabbitmqBrokerParametersCredentialsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected PipesPipeSourceParametersRabbitmqBrokerParametersCredentialsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected PipesPipeSourceParametersRabbitmqBrokerParametersCredentialsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public PipesPipeSourceParametersRabbitmqBrokerParametersCredentialsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBasicAuthInput() {
        return software.amazon.jsii.Kernel.get(this, "basicAuthInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBasicAuth() {
        return software.amazon.jsii.Kernel.get(this, "basicAuth", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBasicAuth(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "basicAuth", java.util.Objects.requireNonNull(value, "basicAuth is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParametersRabbitmqBrokerParametersCredentials getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersRabbitmqBrokerParametersCredentials.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParametersRabbitmqBrokerParametersCredentials value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
