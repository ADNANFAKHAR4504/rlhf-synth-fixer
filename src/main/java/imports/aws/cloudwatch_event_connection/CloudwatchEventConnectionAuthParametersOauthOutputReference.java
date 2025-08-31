package imports.aws.cloudwatch_event_connection;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.272Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchEventConnection.CloudwatchEventConnectionAuthParametersOauthOutputReference")
public class CloudwatchEventConnectionAuthParametersOauthOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudwatchEventConnectionAuthParametersOauthOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudwatchEventConnectionAuthParametersOauthOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CloudwatchEventConnectionAuthParametersOauthOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putClientParameters(final @org.jetbrains.annotations.NotNull imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauthClientParameters value) {
        software.amazon.jsii.Kernel.call(this, "putClientParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOauthHttpParameters(final @org.jetbrains.annotations.NotNull imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauthOauthHttpParameters value) {
        software.amazon.jsii.Kernel.call(this, "putOauthHttpParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetClientParameters() {
        software.amazon.jsii.Kernel.call(this, "resetClientParameters", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauthClientParametersOutputReference getClientParameters() {
        return software.amazon.jsii.Kernel.get(this, "clientParameters", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauthClientParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauthOauthHttpParametersOutputReference getOauthHttpParameters() {
        return software.amazon.jsii.Kernel.get(this, "oauthHttpParameters", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauthOauthHttpParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAuthorizationEndpointInput() {
        return software.amazon.jsii.Kernel.get(this, "authorizationEndpointInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauthClientParameters getClientParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "clientParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauthClientParameters.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHttpMethodInput() {
        return software.amazon.jsii.Kernel.get(this, "httpMethodInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauthOauthHttpParameters getOauthHttpParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "oauthHttpParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauthOauthHttpParameters.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAuthorizationEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "authorizationEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAuthorizationEndpoint(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "authorizationEndpoint", java.util.Objects.requireNonNull(value, "authorizationEndpoint is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHttpMethod() {
        return software.amazon.jsii.Kernel.get(this, "httpMethod", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHttpMethod(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "httpMethod", java.util.Objects.requireNonNull(value, "httpMethod is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauth getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauth.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauth value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
