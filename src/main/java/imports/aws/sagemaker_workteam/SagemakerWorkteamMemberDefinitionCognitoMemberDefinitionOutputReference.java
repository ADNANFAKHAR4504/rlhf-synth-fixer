package imports.aws.sagemaker_workteam;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.357Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerWorkteam.SagemakerWorkteamMemberDefinitionCognitoMemberDefinitionOutputReference")
public class SagemakerWorkteamMemberDefinitionCognitoMemberDefinitionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerWorkteamMemberDefinitionCognitoMemberDefinitionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerWorkteamMemberDefinitionCognitoMemberDefinitionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerWorkteamMemberDefinitionCognitoMemberDefinitionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClientIdInput() {
        return software.amazon.jsii.Kernel.get(this, "clientIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUserGroupInput() {
        return software.amazon.jsii.Kernel.get(this, "userGroupInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUserPoolInput() {
        return software.amazon.jsii.Kernel.get(this, "userPoolInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClientId() {
        return software.amazon.jsii.Kernel.get(this, "clientId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClientId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "clientId", java.util.Objects.requireNonNull(value, "clientId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserGroup() {
        return software.amazon.jsii.Kernel.get(this, "userGroup", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUserGroup(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "userGroup", java.util.Objects.requireNonNull(value, "userGroup is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserPool() {
        return software.amazon.jsii.Kernel.get(this, "userPool", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUserPool(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "userPool", java.util.Objects.requireNonNull(value, "userPool is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_workteam.SagemakerWorkteamMemberDefinitionCognitoMemberDefinition getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_workteam.SagemakerWorkteamMemberDefinitionCognitoMemberDefinition.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_workteam.SagemakerWorkteamMemberDefinitionCognitoMemberDefinition value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
