package imports.aws.wafv2_web_acl;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.670Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2WebAcl.Wafv2WebAclAssociationConfigRequestBodyOutputReference")
public class Wafv2WebAclAssociationConfigRequestBodyOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Wafv2WebAclAssociationConfigRequestBodyOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Wafv2WebAclAssociationConfigRequestBodyOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public Wafv2WebAclAssociationConfigRequestBodyOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putApiGateway(final @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyApiGateway value) {
        software.amazon.jsii.Kernel.call(this, "putApiGateway", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putAppRunnerService(final @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyAppRunnerService value) {
        software.amazon.jsii.Kernel.call(this, "putAppRunnerService", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCloudfront(final @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyCloudfront value) {
        software.amazon.jsii.Kernel.call(this, "putCloudfront", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCognitoUserPool(final @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyCognitoUserPool value) {
        software.amazon.jsii.Kernel.call(this, "putCognitoUserPool", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVerifiedAccessInstance(final @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstance value) {
        software.amazon.jsii.Kernel.call(this, "putVerifiedAccessInstance", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetApiGateway() {
        software.amazon.jsii.Kernel.call(this, "resetApiGateway", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAppRunnerService() {
        software.amazon.jsii.Kernel.call(this, "resetAppRunnerService", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCloudfront() {
        software.amazon.jsii.Kernel.call(this, "resetCloudfront", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCognitoUserPool() {
        software.amazon.jsii.Kernel.call(this, "resetCognitoUserPool", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVerifiedAccessInstance() {
        software.amazon.jsii.Kernel.call(this, "resetVerifiedAccessInstance", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyApiGatewayOutputReference getApiGateway() {
        return software.amazon.jsii.Kernel.get(this, "apiGateway", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyApiGatewayOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyAppRunnerServiceOutputReference getAppRunnerService() {
        return software.amazon.jsii.Kernel.get(this, "appRunnerService", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyAppRunnerServiceOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyCloudfrontOutputReference getCloudfront() {
        return software.amazon.jsii.Kernel.get(this, "cloudfront", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyCloudfrontOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyCognitoUserPoolOutputReference getCognitoUserPool() {
        return software.amazon.jsii.Kernel.get(this, "cognitoUserPool", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyCognitoUserPoolOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstanceOutputReference getVerifiedAccessInstance() {
        return software.amazon.jsii.Kernel.get(this, "verifiedAccessInstance", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstanceOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyApiGateway getApiGatewayInput() {
        return software.amazon.jsii.Kernel.get(this, "apiGatewayInput", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyApiGateway.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyAppRunnerService getAppRunnerServiceInput() {
        return software.amazon.jsii.Kernel.get(this, "appRunnerServiceInput", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyAppRunnerService.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyCloudfront getCloudfrontInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudfrontInput", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyCloudfront.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyCognitoUserPool getCognitoUserPoolInput() {
        return software.amazon.jsii.Kernel.get(this, "cognitoUserPoolInput", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyCognitoUserPool.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstance getVerifiedAccessInstanceInput() {
        return software.amazon.jsii.Kernel.get(this, "verifiedAccessInstanceInput", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstance.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBody value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
