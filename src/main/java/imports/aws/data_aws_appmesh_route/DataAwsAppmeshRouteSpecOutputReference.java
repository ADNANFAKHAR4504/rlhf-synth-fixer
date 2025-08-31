package imports.aws.data_aws_appmesh_route;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.439Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsAppmeshRoute.DataAwsAppmeshRouteSpecOutputReference")
public class DataAwsAppmeshRouteSpecOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsAppmeshRouteSpecOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsAppmeshRouteSpecOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsAppmeshRouteSpecOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_appmesh_route.DataAwsAppmeshRouteSpecGrpcRouteList getGrpcRoute() {
        return software.amazon.jsii.Kernel.get(this, "grpcRoute", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_appmesh_route.DataAwsAppmeshRouteSpecGrpcRouteList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_appmesh_route.DataAwsAppmeshRouteSpecHttp2RouteList getHttp2Route() {
        return software.amazon.jsii.Kernel.get(this, "http2Route", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_appmesh_route.DataAwsAppmeshRouteSpecHttp2RouteList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_appmesh_route.DataAwsAppmeshRouteSpecHttpRouteList getHttpRoute() {
        return software.amazon.jsii.Kernel.get(this, "httpRoute", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_appmesh_route.DataAwsAppmeshRouteSpecHttpRouteList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPriority() {
        return software.amazon.jsii.Kernel.get(this, "priority", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_appmesh_route.DataAwsAppmeshRouteSpecTcpRouteList getTcpRoute() {
        return software.amazon.jsii.Kernel.get(this, "tcpRoute", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_appmesh_route.DataAwsAppmeshRouteSpecTcpRouteList.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_appmesh_route.DataAwsAppmeshRouteSpec getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_appmesh_route.DataAwsAppmeshRouteSpec.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_appmesh_route.DataAwsAppmeshRouteSpec value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
