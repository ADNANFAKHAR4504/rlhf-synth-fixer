package imports.aws.appflow_connector_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.002Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowConnectorProfile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsDatadogOutputReference")
public class AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsDatadogOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsDatadogOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsDatadogOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsDatadogOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getApiKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "apiKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getApplicationKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "applicationKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getApiKey() {
        return software.amazon.jsii.Kernel.get(this, "apiKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setApiKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "apiKey", java.util.Objects.requireNonNull(value, "apiKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getApplicationKey() {
        return software.amazon.jsii.Kernel.get(this, "applicationKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setApplicationKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "applicationKey", java.util.Objects.requireNonNull(value, "applicationKey is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsDatadog getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsDatadog.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appflow_connector_profile.AppflowConnectorProfileConnectorProfileConfigConnectorProfileCredentialsDatadog value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
