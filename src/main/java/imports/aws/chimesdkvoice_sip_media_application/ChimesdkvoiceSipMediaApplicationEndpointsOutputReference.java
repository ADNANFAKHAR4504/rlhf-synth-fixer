package imports.aws.chimesdkvoice_sip_media_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.211Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.chimesdkvoiceSipMediaApplication.ChimesdkvoiceSipMediaApplicationEndpointsOutputReference")
public class ChimesdkvoiceSipMediaApplicationEndpointsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ChimesdkvoiceSipMediaApplicationEndpointsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ChimesdkvoiceSipMediaApplicationEndpointsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ChimesdkvoiceSipMediaApplicationEndpointsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLambdaArnInput() {
        return software.amazon.jsii.Kernel.get(this, "lambdaArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLambdaArn() {
        return software.amazon.jsii.Kernel.get(this, "lambdaArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLambdaArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "lambdaArn", java.util.Objects.requireNonNull(value, "lambdaArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.chimesdkvoice_sip_media_application.ChimesdkvoiceSipMediaApplicationEndpoints getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.chimesdkvoice_sip_media_application.ChimesdkvoiceSipMediaApplicationEndpoints.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.chimesdkvoice_sip_media_application.ChimesdkvoiceSipMediaApplicationEndpoints value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
