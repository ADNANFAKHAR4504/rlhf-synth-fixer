package imports.aws.data_aws_cognito_user_pool;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.522Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsCognitoUserPool.DataAwsCognitoUserPoolLambdaConfigOutputReference")
public class DataAwsCognitoUserPoolLambdaConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsCognitoUserPoolLambdaConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsCognitoUserPoolLambdaConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsCognitoUserPoolLambdaConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCreateAuthChallenge() {
        return software.amazon.jsii.Kernel.get(this, "createAuthChallenge", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_cognito_user_pool.DataAwsCognitoUserPoolLambdaConfigCustomEmailSenderList getCustomEmailSender() {
        return software.amazon.jsii.Kernel.get(this, "customEmailSender", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_cognito_user_pool.DataAwsCognitoUserPoolLambdaConfigCustomEmailSenderList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomMessage() {
        return software.amazon.jsii.Kernel.get(this, "customMessage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_cognito_user_pool.DataAwsCognitoUserPoolLambdaConfigCustomSmsSenderList getCustomSmsSender() {
        return software.amazon.jsii.Kernel.get(this, "customSmsSender", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_cognito_user_pool.DataAwsCognitoUserPoolLambdaConfigCustomSmsSenderList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDefineAuthChallenge() {
        return software.amazon.jsii.Kernel.get(this, "defineAuthChallenge", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPostAuthentication() {
        return software.amazon.jsii.Kernel.get(this, "postAuthentication", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPostConfirmation() {
        return software.amazon.jsii.Kernel.get(this, "postConfirmation", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPreAuthentication() {
        return software.amazon.jsii.Kernel.get(this, "preAuthentication", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPreSignUp() {
        return software.amazon.jsii.Kernel.get(this, "preSignUp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPreTokenGeneration() {
        return software.amazon.jsii.Kernel.get(this, "preTokenGeneration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_cognito_user_pool.DataAwsCognitoUserPoolLambdaConfigPreTokenGenerationConfigList getPreTokenGenerationConfig() {
        return software.amazon.jsii.Kernel.get(this, "preTokenGenerationConfig", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_cognito_user_pool.DataAwsCognitoUserPoolLambdaConfigPreTokenGenerationConfigList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserMigration() {
        return software.amazon.jsii.Kernel.get(this, "userMigration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVerifyAuthChallengeResponse() {
        return software.amazon.jsii.Kernel.get(this, "verifyAuthChallengeResponse", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_cognito_user_pool.DataAwsCognitoUserPoolLambdaConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_cognito_user_pool.DataAwsCognitoUserPoolLambdaConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_cognito_user_pool.DataAwsCognitoUserPoolLambdaConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
