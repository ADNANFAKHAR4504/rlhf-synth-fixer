package imports.aws.cloudwatch_event_connection;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.272Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchEventConnection.CloudwatchEventConnectionAuthParametersOutputReference")
public class CloudwatchEventConnectionAuthParametersOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudwatchEventConnectionAuthParametersOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudwatchEventConnectionAuthParametersOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CloudwatchEventConnectionAuthParametersOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putApiKey(final @org.jetbrains.annotations.NotNull imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersApiKey value) {
        software.amazon.jsii.Kernel.call(this, "putApiKey", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putBasic(final @org.jetbrains.annotations.NotNull imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersBasic value) {
        software.amazon.jsii.Kernel.call(this, "putBasic", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putInvocationHttpParameters(final @org.jetbrains.annotations.NotNull imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersInvocationHttpParameters value) {
        software.amazon.jsii.Kernel.call(this, "putInvocationHttpParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOauth(final @org.jetbrains.annotations.NotNull imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauth value) {
        software.amazon.jsii.Kernel.call(this, "putOauth", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetApiKey() {
        software.amazon.jsii.Kernel.call(this, "resetApiKey", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBasic() {
        software.amazon.jsii.Kernel.call(this, "resetBasic", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInvocationHttpParameters() {
        software.amazon.jsii.Kernel.call(this, "resetInvocationHttpParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOauth() {
        software.amazon.jsii.Kernel.call(this, "resetOauth", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersApiKeyOutputReference getApiKey() {
        return software.amazon.jsii.Kernel.get(this, "apiKey", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersApiKeyOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersBasicOutputReference getBasic() {
        return software.amazon.jsii.Kernel.get(this, "basic", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersBasicOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersInvocationHttpParametersOutputReference getInvocationHttpParameters() {
        return software.amazon.jsii.Kernel.get(this, "invocationHttpParameters", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersInvocationHttpParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauthOutputReference getOauth() {
        return software.amazon.jsii.Kernel.get(this, "oauth", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauthOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersApiKey getApiKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "apiKeyInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersApiKey.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersBasic getBasicInput() {
        return software.amazon.jsii.Kernel.get(this, "basicInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersBasic.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersInvocationHttpParameters getInvocationHttpParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "invocationHttpParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersInvocationHttpParameters.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauth getOauthInput() {
        return software.amazon.jsii.Kernel.get(this, "oauthInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParametersOauth.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParameters getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParameters.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_connection.CloudwatchEventConnectionAuthParameters value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
