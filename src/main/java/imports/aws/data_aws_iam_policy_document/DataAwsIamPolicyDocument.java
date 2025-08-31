package imports.aws.data_aws_iam_policy_document;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document aws_iam_policy_document}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.672Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsIamPolicyDocument.DataAwsIamPolicyDocument")
public class DataAwsIamPolicyDocument extends com.hashicorp.cdktf.TerraformDataSource {

    protected DataAwsIamPolicyDocument(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsIamPolicyDocument(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocument.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document aws_iam_policy_document} Data Source.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public DataAwsIamPolicyDocument(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document aws_iam_policy_document} Data Source.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public DataAwsIamPolicyDocument(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a DataAwsIamPolicyDocument resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsIamPolicyDocument to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsIamPolicyDocument that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DataAwsIamPolicyDocument to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocument.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DataAwsIamPolicyDocument resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsIamPolicyDocument to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsIamPolicyDocument that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocument.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putStatement(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentStatement>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentStatement> __cast_cd4240 = (java.util.List<imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentStatement>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentStatement __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putStatement", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOverrideJson() {
        software.amazon.jsii.Kernel.call(this, "resetOverrideJson", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOverridePolicyDocuments() {
        software.amazon.jsii.Kernel.call(this, "resetOverridePolicyDocuments", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPolicyId() {
        software.amazon.jsii.Kernel.call(this, "resetPolicyId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceJson() {
        software.amazon.jsii.Kernel.call(this, "resetSourceJson", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourcePolicyDocuments() {
        software.amazon.jsii.Kernel.call(this, "resetSourcePolicyDocuments", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStatement() {
        software.amazon.jsii.Kernel.call(this, "resetStatement", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVersion() {
        software.amazon.jsii.Kernel.call(this, "resetVersion", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getJson() {
        return software.amazon.jsii.Kernel.get(this, "json", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMinifiedJson() {
        return software.amazon.jsii.Kernel.get(this, "minifiedJson", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentStatementList getStatement() {
        return software.amazon.jsii.Kernel.get(this, "statement", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentStatementList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOverrideJsonInput() {
        return software.amazon.jsii.Kernel.get(this, "overrideJsonInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getOverridePolicyDocumentsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "overridePolicyDocumentsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPolicyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "policyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceJsonInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceJsonInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSourcePolicyDocumentsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "sourcePolicyDocumentsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getStatementInput() {
        return software.amazon.jsii.Kernel.get(this, "statementInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "versionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOverrideJson() {
        return software.amazon.jsii.Kernel.get(this, "overrideJson", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOverrideJson(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "overrideJson", java.util.Objects.requireNonNull(value, "overrideJson is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getOverridePolicyDocuments() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "overridePolicyDocuments", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setOverridePolicyDocuments(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "overridePolicyDocuments", java.util.Objects.requireNonNull(value, "overridePolicyDocuments is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPolicyId() {
        return software.amazon.jsii.Kernel.get(this, "policyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPolicyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "policyId", java.util.Objects.requireNonNull(value, "policyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceJson() {
        return software.amazon.jsii.Kernel.get(this, "sourceJson", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceJson(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceJson", java.util.Objects.requireNonNull(value, "sourceJson is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSourcePolicyDocuments() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "sourcePolicyDocuments", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSourcePolicyDocuments(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "sourcePolicyDocuments", java.util.Objects.requireNonNull(value, "sourcePolicyDocuments is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVersion() {
        return software.amazon.jsii.Kernel.get(this, "version", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "version", java.util.Objects.requireNonNull(value, "version is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocument}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocument> {
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
        private imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config().count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config().count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config().dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config().forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config().lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config().provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config().provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#id DataAwsIamPolicyDocument#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#id DataAwsIamPolicyDocument#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config().id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#override_json DataAwsIamPolicyDocument#override_json}.
         * <p>
         * @return {@code this}
         * @param overrideJson Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#override_json DataAwsIamPolicyDocument#override_json}. This parameter is required.
         */
        public Builder overrideJson(final java.lang.String overrideJson) {
            this.config().overrideJson(overrideJson);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#override_policy_documents DataAwsIamPolicyDocument#override_policy_documents}.
         * <p>
         * @return {@code this}
         * @param overridePolicyDocuments Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#override_policy_documents DataAwsIamPolicyDocument#override_policy_documents}. This parameter is required.
         */
        public Builder overridePolicyDocuments(final java.util.List<java.lang.String> overridePolicyDocuments) {
            this.config().overridePolicyDocuments(overridePolicyDocuments);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#policy_id DataAwsIamPolicyDocument#policy_id}.
         * <p>
         * @return {@code this}
         * @param policyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#policy_id DataAwsIamPolicyDocument#policy_id}. This parameter is required.
         */
        public Builder policyId(final java.lang.String policyId) {
            this.config().policyId(policyId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#source_json DataAwsIamPolicyDocument#source_json}.
         * <p>
         * @return {@code this}
         * @param sourceJson Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#source_json DataAwsIamPolicyDocument#source_json}. This parameter is required.
         */
        public Builder sourceJson(final java.lang.String sourceJson) {
            this.config().sourceJson(sourceJson);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#source_policy_documents DataAwsIamPolicyDocument#source_policy_documents}.
         * <p>
         * @return {@code this}
         * @param sourcePolicyDocuments Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#source_policy_documents DataAwsIamPolicyDocument#source_policy_documents}. This parameter is required.
         */
        public Builder sourcePolicyDocuments(final java.util.List<java.lang.String> sourcePolicyDocuments) {
            this.config().sourcePolicyDocuments(sourcePolicyDocuments);
            return this;
        }

        /**
         * statement block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#statement DataAwsIamPolicyDocument#statement}
         * <p>
         * @return {@code this}
         * @param statement statement block. This parameter is required.
         */
        public Builder statement(final com.hashicorp.cdktf.IResolvable statement) {
            this.config().statement(statement);
            return this;
        }
        /**
         * statement block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#statement DataAwsIamPolicyDocument#statement}
         * <p>
         * @return {@code this}
         * @param statement statement block. This parameter is required.
         */
        public Builder statement(final java.util.List<? extends imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentStatement> statement) {
            this.config().statement(statement);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#version DataAwsIamPolicyDocument#version}.
         * <p>
         * @return {@code this}
         * @param version Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#version DataAwsIamPolicyDocument#version}. This parameter is required.
         */
        public Builder version(final java.lang.String version) {
            this.config().version(version);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocument}.
         */
        @Override
        public imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocument build() {
            return new imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocument(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentConfig.Builder();
            }
            return this.config;
        }
    }
}
