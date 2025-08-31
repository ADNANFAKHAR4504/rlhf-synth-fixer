package imports.aws.appsync_graphql_api;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.076Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncGraphqlApi.AppsyncGraphqlApiEnhancedMetricsConfigOutputReference")
public class AppsyncGraphqlApiEnhancedMetricsConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppsyncGraphqlApiEnhancedMetricsConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppsyncGraphqlApiEnhancedMetricsConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppsyncGraphqlApiEnhancedMetricsConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDataSourceLevelMetricsBehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "dataSourceLevelMetricsBehaviorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOperationLevelMetricsConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "operationLevelMetricsConfigInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getResolverLevelMetricsBehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "resolverLevelMetricsBehaviorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDataSourceLevelMetricsBehavior() {
        return software.amazon.jsii.Kernel.get(this, "dataSourceLevelMetricsBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDataSourceLevelMetricsBehavior(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dataSourceLevelMetricsBehavior", java.util.Objects.requireNonNull(value, "dataSourceLevelMetricsBehavior is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOperationLevelMetricsConfig() {
        return software.amazon.jsii.Kernel.get(this, "operationLevelMetricsConfig", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOperationLevelMetricsConfig(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "operationLevelMetricsConfig", java.util.Objects.requireNonNull(value, "operationLevelMetricsConfig is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getResolverLevelMetricsBehavior() {
        return software.amazon.jsii.Kernel.get(this, "resolverLevelMetricsBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setResolverLevelMetricsBehavior(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "resolverLevelMetricsBehavior", java.util.Objects.requireNonNull(value, "resolverLevelMetricsBehavior is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appsync_graphql_api.AppsyncGraphqlApiEnhancedMetricsConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_graphql_api.AppsyncGraphqlApiEnhancedMetricsConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appsync_graphql_api.AppsyncGraphqlApiEnhancedMetricsConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
