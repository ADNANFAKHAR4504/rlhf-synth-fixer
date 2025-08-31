package imports.aws.keyspaces_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.441Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.keyspacesTable.KeyspacesTableSchemaDefinitionOutputReference")
public class KeyspacesTableSchemaDefinitionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KeyspacesTableSchemaDefinitionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KeyspacesTableSchemaDefinitionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KeyspacesTableSchemaDefinitionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putClusteringKey(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.keyspaces_table.KeyspacesTableSchemaDefinitionClusteringKey>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.keyspaces_table.KeyspacesTableSchemaDefinitionClusteringKey> __cast_cd4240 = (java.util.List<imports.aws.keyspaces_table.KeyspacesTableSchemaDefinitionClusteringKey>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.keyspaces_table.KeyspacesTableSchemaDefinitionClusteringKey __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putClusteringKey", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putColumn(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.keyspaces_table.KeyspacesTableSchemaDefinitionColumn>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.keyspaces_table.KeyspacesTableSchemaDefinitionColumn> __cast_cd4240 = (java.util.List<imports.aws.keyspaces_table.KeyspacesTableSchemaDefinitionColumn>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.keyspaces_table.KeyspacesTableSchemaDefinitionColumn __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putColumn", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPartitionKey(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.keyspaces_table.KeyspacesTableSchemaDefinitionPartitionKey>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.keyspaces_table.KeyspacesTableSchemaDefinitionPartitionKey> __cast_cd4240 = (java.util.List<imports.aws.keyspaces_table.KeyspacesTableSchemaDefinitionPartitionKey>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.keyspaces_table.KeyspacesTableSchemaDefinitionPartitionKey __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putPartitionKey", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putStaticColumn(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.keyspaces_table.KeyspacesTableSchemaDefinitionStaticColumn>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.keyspaces_table.KeyspacesTableSchemaDefinitionStaticColumn> __cast_cd4240 = (java.util.List<imports.aws.keyspaces_table.KeyspacesTableSchemaDefinitionStaticColumn>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.keyspaces_table.KeyspacesTableSchemaDefinitionStaticColumn __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putStaticColumn", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetClusteringKey() {
        software.amazon.jsii.Kernel.call(this, "resetClusteringKey", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStaticColumn() {
        software.amazon.jsii.Kernel.call(this, "resetStaticColumn", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.keyspaces_table.KeyspacesTableSchemaDefinitionClusteringKeyList getClusteringKey() {
        return software.amazon.jsii.Kernel.get(this, "clusteringKey", software.amazon.jsii.NativeType.forClass(imports.aws.keyspaces_table.KeyspacesTableSchemaDefinitionClusteringKeyList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.keyspaces_table.KeyspacesTableSchemaDefinitionColumnList getColumn() {
        return software.amazon.jsii.Kernel.get(this, "column", software.amazon.jsii.NativeType.forClass(imports.aws.keyspaces_table.KeyspacesTableSchemaDefinitionColumnList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.keyspaces_table.KeyspacesTableSchemaDefinitionPartitionKeyList getPartitionKey() {
        return software.amazon.jsii.Kernel.get(this, "partitionKey", software.amazon.jsii.NativeType.forClass(imports.aws.keyspaces_table.KeyspacesTableSchemaDefinitionPartitionKeyList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.keyspaces_table.KeyspacesTableSchemaDefinitionStaticColumnList getStaticColumn() {
        return software.amazon.jsii.Kernel.get(this, "staticColumn", software.amazon.jsii.NativeType.forClass(imports.aws.keyspaces_table.KeyspacesTableSchemaDefinitionStaticColumnList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getClusteringKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "clusteringKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getColumnInput() {
        return software.amazon.jsii.Kernel.get(this, "columnInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPartitionKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "partitionKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getStaticColumnInput() {
        return software.amazon.jsii.Kernel.get(this, "staticColumnInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.keyspaces_table.KeyspacesTableSchemaDefinition getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.keyspaces_table.KeyspacesTableSchemaDefinition.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.keyspaces_table.KeyspacesTableSchemaDefinition value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
