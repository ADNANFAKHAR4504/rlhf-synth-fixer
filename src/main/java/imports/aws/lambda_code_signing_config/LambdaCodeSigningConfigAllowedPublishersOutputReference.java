package imports.aws.lambda_code_signing_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.500Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lambdaCodeSigningConfig.LambdaCodeSigningConfigAllowedPublishersOutputReference")
public class LambdaCodeSigningConfigAllowedPublishersOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LambdaCodeSigningConfigAllowedPublishersOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LambdaCodeSigningConfigAllowedPublishersOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public LambdaCodeSigningConfigAllowedPublishersOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSigningProfileVersionArnsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "signingProfileVersionArnsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSigningProfileVersionArns() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "signingProfileVersionArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSigningProfileVersionArns(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "signingProfileVersionArns", java.util.Objects.requireNonNull(value, "signingProfileVersionArns is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lambda_code_signing_config.LambdaCodeSigningConfigAllowedPublishers getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_code_signing_config.LambdaCodeSigningConfigAllowedPublishers.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lambda_code_signing_config.LambdaCodeSigningConfigAllowedPublishers value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
