package imports.aws.lambda_code_signing_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.501Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lambdaCodeSigningConfig.LambdaCodeSigningConfigPoliciesOutputReference")
public class LambdaCodeSigningConfigPoliciesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LambdaCodeSigningConfigPoliciesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LambdaCodeSigningConfigPoliciesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public LambdaCodeSigningConfigPoliciesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUntrustedArtifactOnDeploymentInput() {
        return software.amazon.jsii.Kernel.get(this, "untrustedArtifactOnDeploymentInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUntrustedArtifactOnDeployment() {
        return software.amazon.jsii.Kernel.get(this, "untrustedArtifactOnDeployment", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUntrustedArtifactOnDeployment(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "untrustedArtifactOnDeployment", java.util.Objects.requireNonNull(value, "untrustedArtifactOnDeployment is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lambda_code_signing_config.LambdaCodeSigningConfigPolicies getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_code_signing_config.LambdaCodeSigningConfigPolicies.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lambda_code_signing_config.LambdaCodeSigningConfigPolicies value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
