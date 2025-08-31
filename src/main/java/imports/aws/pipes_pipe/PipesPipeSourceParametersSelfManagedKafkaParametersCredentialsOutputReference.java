package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.068Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeSourceParametersSelfManagedKafkaParametersCredentialsOutputReference")
public class PipesPipeSourceParametersSelfManagedKafkaParametersCredentialsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected PipesPipeSourceParametersSelfManagedKafkaParametersCredentialsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected PipesPipeSourceParametersSelfManagedKafkaParametersCredentialsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public PipesPipeSourceParametersSelfManagedKafkaParametersCredentialsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetBasicAuth() {
        software.amazon.jsii.Kernel.call(this, "resetBasicAuth", software.amazon.jsii.NativeType.VOID);
    }

    public void resetClientCertificateTlsAuth() {
        software.amazon.jsii.Kernel.call(this, "resetClientCertificateTlsAuth", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSaslScram256Auth() {
        software.amazon.jsii.Kernel.call(this, "resetSaslScram256Auth", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSaslScram512Auth() {
        software.amazon.jsii.Kernel.call(this, "resetSaslScram512Auth", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBasicAuthInput() {
        return software.amazon.jsii.Kernel.get(this, "basicAuthInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClientCertificateTlsAuthInput() {
        return software.amazon.jsii.Kernel.get(this, "clientCertificateTlsAuthInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSaslScram256AuthInput() {
        return software.amazon.jsii.Kernel.get(this, "saslScram256AuthInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSaslScram512AuthInput() {
        return software.amazon.jsii.Kernel.get(this, "saslScram512AuthInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBasicAuth() {
        return software.amazon.jsii.Kernel.get(this, "basicAuth", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBasicAuth(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "basicAuth", java.util.Objects.requireNonNull(value, "basicAuth is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClientCertificateTlsAuth() {
        return software.amazon.jsii.Kernel.get(this, "clientCertificateTlsAuth", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClientCertificateTlsAuth(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "clientCertificateTlsAuth", java.util.Objects.requireNonNull(value, "clientCertificateTlsAuth is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSaslScram256Auth() {
        return software.amazon.jsii.Kernel.get(this, "saslScram256Auth", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSaslScram256Auth(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "saslScram256Auth", java.util.Objects.requireNonNull(value, "saslScram256Auth is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSaslScram512Auth() {
        return software.amazon.jsii.Kernel.get(this, "saslScram512Auth", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSaslScram512Auth(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "saslScram512Auth", java.util.Objects.requireNonNull(value, "saslScram512Auth is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParametersCredentials getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParametersCredentials.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParametersCredentials value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
