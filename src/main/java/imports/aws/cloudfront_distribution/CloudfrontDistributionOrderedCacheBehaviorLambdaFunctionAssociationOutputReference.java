package imports.aws.cloudfront_distribution;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.235Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontDistribution.CloudfrontDistributionOrderedCacheBehaviorLambdaFunctionAssociationOutputReference")
public class CloudfrontDistributionOrderedCacheBehaviorLambdaFunctionAssociationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudfrontDistributionOrderedCacheBehaviorLambdaFunctionAssociationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudfrontDistributionOrderedCacheBehaviorLambdaFunctionAssociationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public CloudfrontDistributionOrderedCacheBehaviorLambdaFunctionAssociationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetIncludeBody() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeBody", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEventTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "eventTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludeBodyInput() {
        return software.amazon.jsii.Kernel.get(this, "includeBodyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLambdaArnInput() {
        return software.amazon.jsii.Kernel.get(this, "lambdaArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEventType() {
        return software.amazon.jsii.Kernel.get(this, "eventType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEventType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "eventType", java.util.Objects.requireNonNull(value, "eventType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludeBody() {
        return software.amazon.jsii.Kernel.get(this, "includeBody", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludeBody(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includeBody", java.util.Objects.requireNonNull(value, "includeBody is required"));
    }

    public void setIncludeBody(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includeBody", java.util.Objects.requireNonNull(value, "includeBody is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLambdaArn() {
        return software.amazon.jsii.Kernel.get(this, "lambdaArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLambdaArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "lambdaArn", java.util.Objects.requireNonNull(value, "lambdaArn is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudfront_distribution.CloudfrontDistributionOrderedCacheBehaviorLambdaFunctionAssociation value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
