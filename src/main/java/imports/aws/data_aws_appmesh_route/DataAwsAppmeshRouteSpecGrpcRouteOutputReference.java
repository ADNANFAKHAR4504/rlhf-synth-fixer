package imports.aws.data_aws_appmesh_route;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.433Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsAppmeshRoute.DataAwsAppmeshRouteSpecGrpcRouteOutputReference")
public class DataAwsAppmeshRouteSpecGrpcRouteOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsAppmeshRouteSpecGrpcRouteOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsAppmeshRouteSpecGrpcRouteOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsAppmeshRouteSpecGrpcRouteOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_appmesh_route.DataAwsAppmeshRouteSpecGrpcRouteActionList getAction() {
        return software.amazon.jsii.Kernel.get(this, "action", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_appmesh_route.DataAwsAppmeshRouteSpecGrpcRouteActionList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_appmesh_route.DataAwsAppmeshRouteSpecGrpcRouteMatchList getMatch() {
        return software.amazon.jsii.Kernel.get(this, "match", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_appmesh_route.DataAwsAppmeshRouteSpecGrpcRouteMatchList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_appmesh_route.DataAwsAppmeshRouteSpecGrpcRouteRetryPolicyList getRetryPolicy() {
        return software.amazon.jsii.Kernel.get(this, "retryPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_appmesh_route.DataAwsAppmeshRouteSpecGrpcRouteRetryPolicyList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_appmesh_route.DataAwsAppmeshRouteSpecGrpcRouteTimeoutList getTimeout() {
        return software.amazon.jsii.Kernel.get(this, "timeout", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_appmesh_route.DataAwsAppmeshRouteSpecGrpcRouteTimeoutList.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_appmesh_route.DataAwsAppmeshRouteSpecGrpcRoute getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_appmesh_route.DataAwsAppmeshRouteSpecGrpcRoute.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_appmesh_route.DataAwsAppmeshRouteSpecGrpcRoute value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
