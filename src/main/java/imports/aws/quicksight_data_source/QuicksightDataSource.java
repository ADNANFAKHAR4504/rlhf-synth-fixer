package imports.aws.quicksight_data_source;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source aws_quicksight_data_source}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.113Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSource.QuicksightDataSource")
public class QuicksightDataSource extends com.hashicorp.cdktf.TerraformResource {

    protected QuicksightDataSource(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightDataSource(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.quicksight_data_source.QuicksightDataSource.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source aws_quicksight_data_source} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public QuicksightDataSource(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a QuicksightDataSource resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the QuicksightDataSource to import. This parameter is required.
     * @param importFromId The id of the existing QuicksightDataSource that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the QuicksightDataSource to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.quicksight_data_source.QuicksightDataSource.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a QuicksightDataSource resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the QuicksightDataSource to import. This parameter is required.
     * @param importFromId The id of the existing QuicksightDataSource that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.quicksight_data_source.QuicksightDataSource.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putCredentials(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceCredentials value) {
        software.amazon.jsii.Kernel.call(this, "putCredentials", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putParameters(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParameters value) {
        software.amazon.jsii.Kernel.call(this, "putParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPermission(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.quicksight_data_source.QuicksightDataSourcePermission>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.quicksight_data_source.QuicksightDataSourcePermission> __cast_cd4240 = (java.util.List<imports.aws.quicksight_data_source.QuicksightDataSourcePermission>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.quicksight_data_source.QuicksightDataSourcePermission __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putPermission", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSslProperties(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceSslProperties value) {
        software.amazon.jsii.Kernel.call(this, "putSslProperties", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVpcConnectionProperties(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceVpcConnectionProperties value) {
        software.amazon.jsii.Kernel.call(this, "putVpcConnectionProperties", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAwsAccountId() {
        software.amazon.jsii.Kernel.call(this, "resetAwsAccountId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCredentials() {
        software.amazon.jsii.Kernel.call(this, "resetCredentials", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPermission() {
        software.amazon.jsii.Kernel.call(this, "resetPermission", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSslProperties() {
        software.amazon.jsii.Kernel.call(this, "resetSslProperties", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVpcConnectionProperties() {
        software.amazon.jsii.Kernel.call(this, "resetVpcConnectionProperties", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceCredentialsOutputReference getCredentials() {
        return software.amazon.jsii.Kernel.get(this, "credentials", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceCredentialsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParametersOutputReference getParameters() {
        return software.amazon.jsii.Kernel.get(this, "parameters", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourcePermissionList getPermission() {
        return software.amazon.jsii.Kernel.get(this, "permission", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourcePermissionList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceSslPropertiesOutputReference getSslProperties() {
        return software.amazon.jsii.Kernel.get(this, "sslProperties", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceSslPropertiesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceVpcConnectionPropertiesOutputReference getVpcConnectionProperties() {
        return software.amazon.jsii.Kernel.get(this, "vpcConnectionProperties", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceVpcConnectionPropertiesOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAwsAccountIdInput() {
        return software.amazon.jsii.Kernel.get(this, "awsAccountIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceCredentials getCredentialsInput() {
        return software.amazon.jsii.Kernel.get(this, "credentialsInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceCredentials.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDataSourceIdInput() {
        return software.amazon.jsii.Kernel.get(this, "dataSourceIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceParameters getParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "parametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParameters.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPermissionInput() {
        return software.amazon.jsii.Kernel.get(this, "permissionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceSslProperties getSslPropertiesInput() {
        return software.amazon.jsii.Kernel.get(this, "sslPropertiesInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceSslProperties.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceVpcConnectionProperties getVpcConnectionPropertiesInput() {
        return software.amazon.jsii.Kernel.get(this, "vpcConnectionPropertiesInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceVpcConnectionProperties.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAwsAccountId() {
        return software.amazon.jsii.Kernel.get(this, "awsAccountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAwsAccountId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "awsAccountId", java.util.Objects.requireNonNull(value, "awsAccountId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDataSourceId() {
        return software.amazon.jsii.Kernel.get(this, "dataSourceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDataSourceId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dataSourceId", java.util.Objects.requireNonNull(value, "dataSourceId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsAll(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsAll", java.util.Objects.requireNonNull(value, "tagsAll is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.quicksight_data_source.QuicksightDataSource}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.quicksight_data_source.QuicksightDataSource> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private final imports.aws.quicksight_data_source.QuicksightDataSourceConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.quicksight_data_source.QuicksightDataSourceConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#data_source_id QuicksightDataSource#data_source_id}.
         * <p>
         * @return {@code this}
         * @param dataSourceId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#data_source_id QuicksightDataSource#data_source_id}. This parameter is required.
         */
        public Builder dataSourceId(final java.lang.String dataSourceId) {
            this.config.dataSourceId(dataSourceId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#name QuicksightDataSource#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#name QuicksightDataSource#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * parameters block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#parameters QuicksightDataSource#parameters}
         * <p>
         * @return {@code this}
         * @param parameters parameters block. This parameter is required.
         */
        public Builder parameters(final imports.aws.quicksight_data_source.QuicksightDataSourceParameters parameters) {
            this.config.parameters(parameters);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#type QuicksightDataSource#type}.
         * <p>
         * @return {@code this}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#type QuicksightDataSource#type}. This parameter is required.
         */
        public Builder type(final java.lang.String type) {
            this.config.type(type);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#aws_account_id QuicksightDataSource#aws_account_id}.
         * <p>
         * @return {@code this}
         * @param awsAccountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#aws_account_id QuicksightDataSource#aws_account_id}. This parameter is required.
         */
        public Builder awsAccountId(final java.lang.String awsAccountId) {
            this.config.awsAccountId(awsAccountId);
            return this;
        }

        /**
         * credentials block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#credentials QuicksightDataSource#credentials}
         * <p>
         * @return {@code this}
         * @param credentials credentials block. This parameter is required.
         */
        public Builder credentials(final imports.aws.quicksight_data_source.QuicksightDataSourceCredentials credentials) {
            this.config.credentials(credentials);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#id QuicksightDataSource#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#id QuicksightDataSource#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * permission block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#permission QuicksightDataSource#permission}
         * <p>
         * @return {@code this}
         * @param permission permission block. This parameter is required.
         */
        public Builder permission(final com.hashicorp.cdktf.IResolvable permission) {
            this.config.permission(permission);
            return this;
        }
        /**
         * permission block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#permission QuicksightDataSource#permission}
         * <p>
         * @return {@code this}
         * @param permission permission block. This parameter is required.
         */
        public Builder permission(final java.util.List<? extends imports.aws.quicksight_data_source.QuicksightDataSourcePermission> permission) {
            this.config.permission(permission);
            return this;
        }

        /**
         * ssl_properties block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#ssl_properties QuicksightDataSource#ssl_properties}
         * <p>
         * @return {@code this}
         * @param sslProperties ssl_properties block. This parameter is required.
         */
        public Builder sslProperties(final imports.aws.quicksight_data_source.QuicksightDataSourceSslProperties sslProperties) {
            this.config.sslProperties(sslProperties);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#tags QuicksightDataSource#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#tags QuicksightDataSource#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#tags_all QuicksightDataSource#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#tags_all QuicksightDataSource#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * vpc_connection_properties block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#vpc_connection_properties QuicksightDataSource#vpc_connection_properties}
         * <p>
         * @return {@code this}
         * @param vpcConnectionProperties vpc_connection_properties block. This parameter is required.
         */
        public Builder vpcConnectionProperties(final imports.aws.quicksight_data_source.QuicksightDataSourceVpcConnectionProperties vpcConnectionProperties) {
            this.config.vpcConnectionProperties(vpcConnectionProperties);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.quicksight_data_source.QuicksightDataSource}.
         */
        @Override
        public imports.aws.quicksight_data_source.QuicksightDataSource build() {
            return new imports.aws.quicksight_data_source.QuicksightDataSource(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
