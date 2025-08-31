package imports.aws.data_aws_alb_listener;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.411Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsAlbListener.DataAwsAlbListenerDefaultActionOutputReference")
public class DataAwsAlbListenerDefaultActionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsAlbListenerDefaultActionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsAlbListenerDefaultActionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsAlbListenerDefaultActionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_alb_listener.DataAwsAlbListenerDefaultActionAuthenticateCognitoList getAuthenticateCognito() {
        return software.amazon.jsii.Kernel.get(this, "authenticateCognito", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_alb_listener.DataAwsAlbListenerDefaultActionAuthenticateCognitoList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_alb_listener.DataAwsAlbListenerDefaultActionAuthenticateOidcList getAuthenticateOidc() {
        return software.amazon.jsii.Kernel.get(this, "authenticateOidc", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_alb_listener.DataAwsAlbListenerDefaultActionAuthenticateOidcList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_alb_listener.DataAwsAlbListenerDefaultActionFixedResponseList getFixedResponse() {
        return software.amazon.jsii.Kernel.get(this, "fixedResponse", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_alb_listener.DataAwsAlbListenerDefaultActionFixedResponseList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_alb_listener.DataAwsAlbListenerDefaultActionForwardList getForward() {
        return software.amazon.jsii.Kernel.get(this, "forward", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_alb_listener.DataAwsAlbListenerDefaultActionForwardList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getOrder() {
        return software.amazon.jsii.Kernel.get(this, "order", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_alb_listener.DataAwsAlbListenerDefaultActionRedirectList getRedirect() {
        return software.amazon.jsii.Kernel.get(this, "redirect", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_alb_listener.DataAwsAlbListenerDefaultActionRedirectList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTargetGroupArn() {
        return software.amazon.jsii.Kernel.get(this, "targetGroupArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_alb_listener.DataAwsAlbListenerDefaultAction getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_alb_listener.DataAwsAlbListenerDefaultAction.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_alb_listener.DataAwsAlbListenerDefaultAction value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
