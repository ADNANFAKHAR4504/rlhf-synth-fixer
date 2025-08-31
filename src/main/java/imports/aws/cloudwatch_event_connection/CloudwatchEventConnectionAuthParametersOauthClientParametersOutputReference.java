package imports.aws.cloudwatch_event_connection;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.271Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchEventConnection.CloudwatchEventConnectionAuthParametersOauthClientParametersOutputReference")
public class CloudwatchEventConnectionAuthParametersOauthClientParametersOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudwatchEventConnectionAuthParametersOauthClientParametersOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudwatchEventConnectionAuthParametersOauthClientParametersOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CloudwatchEventConnectionAuthParametersOauthClientParametersOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClientIdInput() {
        return software.amazon.jsii.Kernel.get(this, "clientIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClientSecretInput() {
        return software.amazon.jsii.Kernel.get(this, "clientSecretInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClientId() {
        return software.amazon.jsii.Kernel.get(this, "clientId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClientId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "clientId", java.util.Objects.requireNonNull(value, "clientId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClientSecret() {
        return software.amazon.jsii.Kernel.get(this, "clientSecret", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClientSecret(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "clientSecret", java.util.Objects.requireNonNull(value, "clientSecret is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauthClientParameters getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauthClientParameters.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauthClientParameters value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
