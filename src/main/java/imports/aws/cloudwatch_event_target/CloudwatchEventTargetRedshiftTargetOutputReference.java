package imports.aws.cloudwatch_event_target;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.280Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchEventTarget.CloudwatchEventTargetRedshiftTargetOutputReference")
public class CloudwatchEventTargetRedshiftTargetOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudwatchEventTargetRedshiftTargetOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudwatchEventTargetRedshiftTargetOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CloudwatchEventTargetRedshiftTargetOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDbUser() {
        software.amazon.jsii.Kernel.call(this, "resetDbUser", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecretsManagerArn() {
        software.amazon.jsii.Kernel.call(this, "resetSecretsManagerArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSql() {
        software.amazon.jsii.Kernel.call(this, "resetSql", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStatementName() {
        software.amazon.jsii.Kernel.call(this, "resetStatementName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWithEvent() {
        software.amazon.jsii.Kernel.call(this, "resetWithEvent", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDatabaseInput() {
        return software.amazon.jsii.Kernel.get(this, "databaseInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDbUserInput() {
        return software.amazon.jsii.Kernel.get(this, "dbUserInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSecretsManagerArnInput() {
        return software.amazon.jsii.Kernel.get(this, "secretsManagerArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSqlInput() {
        return software.amazon.jsii.Kernel.get(this, "sqlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStatementNameInput() {
        return software.amazon.jsii.Kernel.get(this, "statementNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getWithEventInput() {
        return software.amazon.jsii.Kernel.get(this, "withEventInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDatabase() {
        return software.amazon.jsii.Kernel.get(this, "database", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDatabase(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "database", java.util.Objects.requireNonNull(value, "database is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDbUser() {
        return software.amazon.jsii.Kernel.get(this, "dbUser", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDbUser(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dbUser", java.util.Objects.requireNonNull(value, "dbUser is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSecretsManagerArn() {
        return software.amazon.jsii.Kernel.get(this, "secretsManagerArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSecretsManagerArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "secretsManagerArn", java.util.Objects.requireNonNull(value, "secretsManagerArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSql() {
        return software.amazon.jsii.Kernel.get(this, "sql", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSql(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sql", java.util.Objects.requireNonNull(value, "sql is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatementName() {
        return software.amazon.jsii.Kernel.get(this, "statementName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStatementName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "statementName", java.util.Objects.requireNonNull(value, "statementName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getWithEvent() {
        return software.amazon.jsii.Kernel.get(this, "withEvent", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setWithEvent(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "withEvent", java.util.Objects.requireNonNull(value, "withEvent is required"));
    }

    public void setWithEvent(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "withEvent", java.util.Objects.requireNonNull(value, "withEvent is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_target.CloudwatchEventTargetRedshiftTarget getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_target.CloudwatchEventTargetRedshiftTarget.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_target.CloudwatchEventTargetRedshiftTarget value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
