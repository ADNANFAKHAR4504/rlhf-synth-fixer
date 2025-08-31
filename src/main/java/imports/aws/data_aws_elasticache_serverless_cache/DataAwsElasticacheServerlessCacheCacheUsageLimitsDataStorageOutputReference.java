package imports.aws.data_aws_elasticache_serverless_cache;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.648Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsElasticacheServerlessCache.DataAwsElasticacheServerlessCacheCacheUsageLimitsDataStorageOutputReference")
public class DataAwsElasticacheServerlessCacheCacheUsageLimitsDataStorageOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsElasticacheServerlessCacheCacheUsageLimitsDataStorageOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsElasticacheServerlessCacheCacheUsageLimitsDataStorageOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DataAwsElasticacheServerlessCacheCacheUsageLimitsDataStorageOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaximum() {
        return software.amazon.jsii.Kernel.get(this, "maximum", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinimum() {
        return software.amazon.jsii.Kernel.get(this, "minimum", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUnit() {
        return software.amazon.jsii.Kernel.get(this, "unit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_elasticache_serverless_cache.DataAwsElasticacheServerlessCacheCacheUsageLimitsDataStorage getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_elasticache_serverless_cache.DataAwsElasticacheServerlessCacheCacheUsageLimitsDataStorage.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_elasticache_serverless_cache.DataAwsElasticacheServerlessCacheCacheUsageLimitsDataStorage value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
