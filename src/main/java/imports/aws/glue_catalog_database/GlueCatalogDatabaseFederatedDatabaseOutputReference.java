package imports.aws.glue_catalog_database;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.278Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCatalogDatabase.GlueCatalogDatabaseFederatedDatabaseOutputReference")
public class GlueCatalogDatabaseFederatedDatabaseOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GlueCatalogDatabaseFederatedDatabaseOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GlueCatalogDatabaseFederatedDatabaseOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public GlueCatalogDatabaseFederatedDatabaseOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetConnectionName() {
        software.amazon.jsii.Kernel.call(this, "resetConnectionName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIdentifier() {
        software.amazon.jsii.Kernel.call(this, "resetIdentifier", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConnectionNameInput() {
        return software.amazon.jsii.Kernel.get(this, "connectionNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "identifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConnectionName() {
        return software.amazon.jsii.Kernel.get(this, "connectionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConnectionName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "connectionName", java.util.Objects.requireNonNull(value, "connectionName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "identifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "identifier", java.util.Objects.requireNonNull(value, "identifier is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_catalog_database.GlueCatalogDatabaseFederatedDatabase getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.glue_catalog_database.GlueCatalogDatabaseFederatedDatabase.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.glue_catalog_database.GlueCatalogDatabaseFederatedDatabase value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
