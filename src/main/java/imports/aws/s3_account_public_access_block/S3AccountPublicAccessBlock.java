package imports.aws.s3_account_public_access_block;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block aws_s3_account_public_access_block}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.239Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3AccountPublicAccessBlock.S3AccountPublicAccessBlock")
public class S3AccountPublicAccessBlock extends com.hashicorp.cdktf.TerraformResource {

    protected S3AccountPublicAccessBlock(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3AccountPublicAccessBlock(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.s3_account_public_access_block.S3AccountPublicAccessBlock.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block aws_s3_account_public_access_block} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public S3AccountPublicAccessBlock(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.s3_account_public_access_block.S3AccountPublicAccessBlockConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block aws_s3_account_public_access_block} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public S3AccountPublicAccessBlock(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a S3AccountPublicAccessBlock resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the S3AccountPublicAccessBlock to import. This parameter is required.
     * @param importFromId The id of the existing S3AccountPublicAccessBlock that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the S3AccountPublicAccessBlock to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.s3_account_public_access_block.S3AccountPublicAccessBlock.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a S3AccountPublicAccessBlock resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the S3AccountPublicAccessBlock to import. This parameter is required.
     * @param importFromId The id of the existing S3AccountPublicAccessBlock that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.s3_account_public_access_block.S3AccountPublicAccessBlock.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetAccountId() {
        software.amazon.jsii.Kernel.call(this, "resetAccountId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBlockPublicAcls() {
        software.amazon.jsii.Kernel.call(this, "resetBlockPublicAcls", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBlockPublicPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetBlockPublicPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIgnorePublicAcls() {
        software.amazon.jsii.Kernel.call(this, "resetIgnorePublicAcls", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRestrictPublicBuckets() {
        software.amazon.jsii.Kernel.call(this, "resetRestrictPublicBuckets", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.Nullable java.lang.String getAccountIdInput() {
        return software.amazon.jsii.Kernel.get(this, "accountIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getBlockPublicAclsInput() {
        return software.amazon.jsii.Kernel.get(this, "blockPublicAclsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getBlockPublicPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "blockPublicPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIgnorePublicAclsInput() {
        return software.amazon.jsii.Kernel.get(this, "ignorePublicAclsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRestrictPublicBucketsInput() {
        return software.amazon.jsii.Kernel.get(this, "restrictPublicBucketsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAccountId() {
        return software.amazon.jsii.Kernel.get(this, "accountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAccountId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "accountId", java.util.Objects.requireNonNull(value, "accountId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getBlockPublicAcls() {
        return software.amazon.jsii.Kernel.get(this, "blockPublicAcls", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setBlockPublicAcls(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "blockPublicAcls", java.util.Objects.requireNonNull(value, "blockPublicAcls is required"));
    }

    public void setBlockPublicAcls(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "blockPublicAcls", java.util.Objects.requireNonNull(value, "blockPublicAcls is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getBlockPublicPolicy() {
        return software.amazon.jsii.Kernel.get(this, "blockPublicPolicy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setBlockPublicPolicy(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "blockPublicPolicy", java.util.Objects.requireNonNull(value, "blockPublicPolicy is required"));
    }

    public void setBlockPublicPolicy(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "blockPublicPolicy", java.util.Objects.requireNonNull(value, "blockPublicPolicy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIgnorePublicAcls() {
        return software.amazon.jsii.Kernel.get(this, "ignorePublicAcls", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIgnorePublicAcls(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "ignorePublicAcls", java.util.Objects.requireNonNull(value, "ignorePublicAcls is required"));
    }

    public void setIgnorePublicAcls(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "ignorePublicAcls", java.util.Objects.requireNonNull(value, "ignorePublicAcls is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getRestrictPublicBuckets() {
        return software.amazon.jsii.Kernel.get(this, "restrictPublicBuckets", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setRestrictPublicBuckets(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "restrictPublicBuckets", java.util.Objects.requireNonNull(value, "restrictPublicBuckets is required"));
    }

    public void setRestrictPublicBuckets(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "restrictPublicBuckets", java.util.Objects.requireNonNull(value, "restrictPublicBuckets is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.s3_account_public_access_block.S3AccountPublicAccessBlock}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.s3_account_public_access_block.S3AccountPublicAccessBlock> {
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
        private imports.aws.s3_account_public_access_block.S3AccountPublicAccessBlockConfig.Builder config;

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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#account_id S3AccountPublicAccessBlock#account_id}.
         * <p>
         * @return {@code this}
         * @param accountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#account_id S3AccountPublicAccessBlock#account_id}. This parameter is required.
         */
        public Builder accountId(final java.lang.String accountId) {
            this.config().accountId(accountId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#block_public_acls S3AccountPublicAccessBlock#block_public_acls}.
         * <p>
         * @return {@code this}
         * @param blockPublicAcls Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#block_public_acls S3AccountPublicAccessBlock#block_public_acls}. This parameter is required.
         */
        public Builder blockPublicAcls(final java.lang.Boolean blockPublicAcls) {
            this.config().blockPublicAcls(blockPublicAcls);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#block_public_acls S3AccountPublicAccessBlock#block_public_acls}.
         * <p>
         * @return {@code this}
         * @param blockPublicAcls Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#block_public_acls S3AccountPublicAccessBlock#block_public_acls}. This parameter is required.
         */
        public Builder blockPublicAcls(final com.hashicorp.cdktf.IResolvable blockPublicAcls) {
            this.config().blockPublicAcls(blockPublicAcls);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#block_public_policy S3AccountPublicAccessBlock#block_public_policy}.
         * <p>
         * @return {@code this}
         * @param blockPublicPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#block_public_policy S3AccountPublicAccessBlock#block_public_policy}. This parameter is required.
         */
        public Builder blockPublicPolicy(final java.lang.Boolean blockPublicPolicy) {
            this.config().blockPublicPolicy(blockPublicPolicy);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#block_public_policy S3AccountPublicAccessBlock#block_public_policy}.
         * <p>
         * @return {@code this}
         * @param blockPublicPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#block_public_policy S3AccountPublicAccessBlock#block_public_policy}. This parameter is required.
         */
        public Builder blockPublicPolicy(final com.hashicorp.cdktf.IResolvable blockPublicPolicy) {
            this.config().blockPublicPolicy(blockPublicPolicy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#id S3AccountPublicAccessBlock#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#id S3AccountPublicAccessBlock#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config().id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#ignore_public_acls S3AccountPublicAccessBlock#ignore_public_acls}.
         * <p>
         * @return {@code this}
         * @param ignorePublicAcls Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#ignore_public_acls S3AccountPublicAccessBlock#ignore_public_acls}. This parameter is required.
         */
        public Builder ignorePublicAcls(final java.lang.Boolean ignorePublicAcls) {
            this.config().ignorePublicAcls(ignorePublicAcls);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#ignore_public_acls S3AccountPublicAccessBlock#ignore_public_acls}.
         * <p>
         * @return {@code this}
         * @param ignorePublicAcls Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#ignore_public_acls S3AccountPublicAccessBlock#ignore_public_acls}. This parameter is required.
         */
        public Builder ignorePublicAcls(final com.hashicorp.cdktf.IResolvable ignorePublicAcls) {
            this.config().ignorePublicAcls(ignorePublicAcls);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#restrict_public_buckets S3AccountPublicAccessBlock#restrict_public_buckets}.
         * <p>
         * @return {@code this}
         * @param restrictPublicBuckets Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#restrict_public_buckets S3AccountPublicAccessBlock#restrict_public_buckets}. This parameter is required.
         */
        public Builder restrictPublicBuckets(final java.lang.Boolean restrictPublicBuckets) {
            this.config().restrictPublicBuckets(restrictPublicBuckets);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#restrict_public_buckets S3AccountPublicAccessBlock#restrict_public_buckets}.
         * <p>
         * @return {@code this}
         * @param restrictPublicBuckets Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_account_public_access_block#restrict_public_buckets S3AccountPublicAccessBlock#restrict_public_buckets}. This parameter is required.
         */
        public Builder restrictPublicBuckets(final com.hashicorp.cdktf.IResolvable restrictPublicBuckets) {
            this.config().restrictPublicBuckets(restrictPublicBuckets);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.s3_account_public_access_block.S3AccountPublicAccessBlock}.
         */
        @Override
        public imports.aws.s3_account_public_access_block.S3AccountPublicAccessBlock build() {
            return new imports.aws.s3_account_public_access_block.S3AccountPublicAccessBlock(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.s3_account_public_access_block.S3AccountPublicAccessBlockConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.s3_account_public_access_block.S3AccountPublicAccessBlockConfig.Builder();
            }
            return this.config;
        }
    }
}
