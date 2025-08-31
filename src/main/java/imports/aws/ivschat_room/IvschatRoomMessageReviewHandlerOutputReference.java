package imports.aws.ivschat_room;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.426Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ivschatRoom.IvschatRoomMessageReviewHandlerOutputReference")
public class IvschatRoomMessageReviewHandlerOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected IvschatRoomMessageReviewHandlerOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected IvschatRoomMessageReviewHandlerOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public IvschatRoomMessageReviewHandlerOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetFallbackResult() {
        software.amazon.jsii.Kernel.call(this, "resetFallbackResult", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUri() {
        software.amazon.jsii.Kernel.call(this, "resetUri", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFallbackResultInput() {
        return software.amazon.jsii.Kernel.get(this, "fallbackResultInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUriInput() {
        return software.amazon.jsii.Kernel.get(this, "uriInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFallbackResult() {
        return software.amazon.jsii.Kernel.get(this, "fallbackResult", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFallbackResult(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fallbackResult", java.util.Objects.requireNonNull(value, "fallbackResult is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUri() {
        return software.amazon.jsii.Kernel.get(this, "uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUri(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "uri", java.util.Objects.requireNonNull(value, "uri is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ivschat_room.IvschatRoomMessageReviewHandler getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ivschat_room.IvschatRoomMessageReviewHandler.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ivschat_room.IvschatRoomMessageReviewHandler value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
