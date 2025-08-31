package imports.aws.appsync_graphql_api;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.077Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncGraphqlApi.AppsyncGraphqlApiLogConfigOutputReference")
public class AppsyncGraphqlApiLogConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppsyncGraphqlApiLogConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppsyncGraphqlApiLogConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppsyncGraphqlApiLogConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetExcludeVerboseContent() {
        software.amazon.jsii.Kernel.call(this, "resetExcludeVerboseContent", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCloudwatchLogsRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLogsRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getExcludeVerboseContentInput() {
        return software.amazon.jsii.Kernel.get(this, "excludeVerboseContentInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFieldLogLevelInput() {
        return software.amazon.jsii.Kernel.get(this, "fieldLogLevelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCloudwatchLogsRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLogsRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCloudwatchLogsRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cloudwatchLogsRoleArn", java.util.Objects.requireNonNull(value, "cloudwatchLogsRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getExcludeVerboseContent() {
        return software.amazon.jsii.Kernel.get(this, "excludeVerboseContent", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setExcludeVerboseContent(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "excludeVerboseContent", java.util.Objects.requireNonNull(value, "excludeVerboseContent is required"));
    }

    public void setExcludeVerboseContent(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "excludeVerboseContent", java.util.Objects.requireNonNull(value, "excludeVerboseContent is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFieldLogLevel() {
        return software.amazon.jsii.Kernel.get(this, "fieldLogLevel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFieldLogLevel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fieldLogLevel", java.util.Objects.requireNonNull(value, "fieldLogLevel is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appsync_graphql_api.AppsyncGraphqlApiLogConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_graphql_api.AppsyncGraphqlApiLogConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appsync_graphql_api.AppsyncGraphqlApiLogConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
