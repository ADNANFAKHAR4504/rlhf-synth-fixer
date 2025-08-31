package imports.aws.cognito_user_pool;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.356Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoUserPool.CognitoUserPoolLambdaConfigOutputReference")
public class CognitoUserPoolLambdaConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CognitoUserPoolLambdaConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CognitoUserPoolLambdaConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CognitoUserPoolLambdaConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCustomEmailSender(final @org.jetbrains.annotations.NotNull imports.aws.cognito_user_pool.CognitoUserPoolLambdaConfigCustomEmailSender value) {
        software.amazon.jsii.Kernel.call(this, "putCustomEmailSender", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCustomSmsSender(final @org.jetbrains.annotations.NotNull imports.aws.cognito_user_pool.CognitoUserPoolLambdaConfigCustomSmsSender value) {
        software.amazon.jsii.Kernel.call(this, "putCustomSmsSender", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPreTokenGenerationConfig(final @org.jetbrains.annotations.NotNull imports.aws.cognito_user_pool.CognitoUserPoolLambdaConfigPreTokenGenerationConfig value) {
        software.amazon.jsii.Kernel.call(this, "putPreTokenGenerationConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCreateAuthChallenge() {
        software.amazon.jsii.Kernel.call(this, "resetCreateAuthChallenge", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomEmailSender() {
        software.amazon.jsii.Kernel.call(this, "resetCustomEmailSender", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomMessage() {
        software.amazon.jsii.Kernel.call(this, "resetCustomMessage", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomSmsSender() {
        software.amazon.jsii.Kernel.call(this, "resetCustomSmsSender", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDefineAuthChallenge() {
        software.amazon.jsii.Kernel.call(this, "resetDefineAuthChallenge", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKmsKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetKmsKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPostAuthentication() {
        software.amazon.jsii.Kernel.call(this, "resetPostAuthentication", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPostConfirmation() {
        software.amazon.jsii.Kernel.call(this, "resetPostConfirmation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPreAuthentication() {
        software.amazon.jsii.Kernel.call(this, "resetPreAuthentication", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPreSignUp() {
        software.amazon.jsii.Kernel.call(this, "resetPreSignUp", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPreTokenGeneration() {
        software.amazon.jsii.Kernel.call(this, "resetPreTokenGeneration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPreTokenGenerationConfig() {
        software.amazon.jsii.Kernel.call(this, "resetPreTokenGenerationConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUserMigration() {
        software.amazon.jsii.Kernel.call(this, "resetUserMigration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVerifyAuthChallengeResponse() {
        software.amazon.jsii.Kernel.call(this, "resetVerifyAuthChallengeResponse", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cognito_user_pool.CognitoUserPoolLambdaConfigCustomEmailSenderOutputReference getCustomEmailSender() {
        return software.amazon.jsii.Kernel.get(this, "customEmailSender", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolLambdaConfigCustomEmailSenderOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cognito_user_pool.CognitoUserPoolLambdaConfigCustomSmsSenderOutputReference getCustomSmsSender() {
        return software.amazon.jsii.Kernel.get(this, "customSmsSender", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolLambdaConfigCustomSmsSenderOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cognito_user_pool.CognitoUserPoolLambdaConfigPreTokenGenerationConfigOutputReference getPreTokenGenerationConfig() {
        return software.amazon.jsii.Kernel.get(this, "preTokenGenerationConfig", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolLambdaConfigPreTokenGenerationConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCreateAuthChallengeInput() {
        return software.amazon.jsii.Kernel.get(this, "createAuthChallengeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolLambdaConfigCustomEmailSender getCustomEmailSenderInput() {
        return software.amazon.jsii.Kernel.get(this, "customEmailSenderInput", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolLambdaConfigCustomEmailSender.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomMessageInput() {
        return software.amazon.jsii.Kernel.get(this, "customMessageInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolLambdaConfigCustomSmsSender getCustomSmsSenderInput() {
        return software.amazon.jsii.Kernel.get(this, "customSmsSenderInput", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolLambdaConfigCustomSmsSender.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDefineAuthChallengeInput() {
        return software.amazon.jsii.Kernel.get(this, "defineAuthChallengeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPostAuthenticationInput() {
        return software.amazon.jsii.Kernel.get(this, "postAuthenticationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPostConfirmationInput() {
        return software.amazon.jsii.Kernel.get(this, "postConfirmationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPreAuthenticationInput() {
        return software.amazon.jsii.Kernel.get(this, "preAuthenticationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPreSignUpInput() {
        return software.amazon.jsii.Kernel.get(this, "preSignUpInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolLambdaConfigPreTokenGenerationConfig getPreTokenGenerationConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "preTokenGenerationConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolLambdaConfigPreTokenGenerationConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPreTokenGenerationInput() {
        return software.amazon.jsii.Kernel.get(this, "preTokenGenerationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUserMigrationInput() {
        return software.amazon.jsii.Kernel.get(this, "userMigrationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVerifyAuthChallengeResponseInput() {
        return software.amazon.jsii.Kernel.get(this, "verifyAuthChallengeResponseInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCreateAuthChallenge() {
        return software.amazon.jsii.Kernel.get(this, "createAuthChallenge", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCreateAuthChallenge(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "createAuthChallenge", java.util.Objects.requireNonNull(value, "createAuthChallenge is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomMessage() {
        return software.amazon.jsii.Kernel.get(this, "customMessage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomMessage(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customMessage", java.util.Objects.requireNonNull(value, "customMessage is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDefineAuthChallenge() {
        return software.amazon.jsii.Kernel.get(this, "defineAuthChallenge", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDefineAuthChallenge(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "defineAuthChallenge", java.util.Objects.requireNonNull(value, "defineAuthChallenge is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsKeyId", java.util.Objects.requireNonNull(value, "kmsKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPostAuthentication() {
        return software.amazon.jsii.Kernel.get(this, "postAuthentication", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPostAuthentication(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "postAuthentication", java.util.Objects.requireNonNull(value, "postAuthentication is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPostConfirmation() {
        return software.amazon.jsii.Kernel.get(this, "postConfirmation", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPostConfirmation(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "postConfirmation", java.util.Objects.requireNonNull(value, "postConfirmation is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPreAuthentication() {
        return software.amazon.jsii.Kernel.get(this, "preAuthentication", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPreAuthentication(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "preAuthentication", java.util.Objects.requireNonNull(value, "preAuthentication is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPreSignUp() {
        return software.amazon.jsii.Kernel.get(this, "preSignUp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPreSignUp(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "preSignUp", java.util.Objects.requireNonNull(value, "preSignUp is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPreTokenGeneration() {
        return software.amazon.jsii.Kernel.get(this, "preTokenGeneration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPreTokenGeneration(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "preTokenGeneration", java.util.Objects.requireNonNull(value, "preTokenGeneration is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserMigration() {
        return software.amazon.jsii.Kernel.get(this, "userMigration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUserMigration(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "userMigration", java.util.Objects.requireNonNull(value, "userMigration is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVerifyAuthChallengeResponse() {
        return software.amazon.jsii.Kernel.get(this, "verifyAuthChallengeResponse", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVerifyAuthChallengeResponse(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "verifyAuthChallengeResponse", java.util.Objects.requireNonNull(value, "verifyAuthChallengeResponse is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolLambdaConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_user_pool.CognitoUserPoolLambdaConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cognito_user_pool.CognitoUserPoolLambdaConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
