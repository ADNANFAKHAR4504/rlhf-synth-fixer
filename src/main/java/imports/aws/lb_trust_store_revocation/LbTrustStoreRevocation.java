package imports.aws.lb_trust_store_revocation;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_trust_store_revocation aws_lb_trust_store_revocation}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.539Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lbTrustStoreRevocation.LbTrustStoreRevocation")
public class LbTrustStoreRevocation extends com.hashicorp.cdktf.TerraformResource {

    protected LbTrustStoreRevocation(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LbTrustStoreRevocation(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.lb_trust_store_revocation.LbTrustStoreRevocation.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_trust_store_revocation aws_lb_trust_store_revocation} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public LbTrustStoreRevocation(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.lb_trust_store_revocation.LbTrustStoreRevocationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a LbTrustStoreRevocation resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the LbTrustStoreRevocation to import. This parameter is required.
     * @param importFromId The id of the existing LbTrustStoreRevocation that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the LbTrustStoreRevocation to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.lb_trust_store_revocation.LbTrustStoreRevocation.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a LbTrustStoreRevocation resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the LbTrustStoreRevocation to import. This parameter is required.
     * @param importFromId The id of the existing LbTrustStoreRevocation that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.lb_trust_store_revocation.LbTrustStoreRevocation.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.lb_trust_store_revocation.LbTrustStoreRevocationTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRevocationsS3ObjectVersion() {
        software.amazon.jsii.Kernel.call(this, "resetRevocationsS3ObjectVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.Number getRevocationId() {
        return software.amazon.jsii.Kernel.get(this, "revocationId", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lb_trust_store_revocation.LbTrustStoreRevocationTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.lb_trust_store_revocation.LbTrustStoreRevocationTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRevocationsS3BucketInput() {
        return software.amazon.jsii.Kernel.get(this, "revocationsS3BucketInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRevocationsS3KeyInput() {
        return software.amazon.jsii.Kernel.get(this, "revocationsS3KeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRevocationsS3ObjectVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "revocationsS3ObjectVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTrustStoreArnInput() {
        return software.amazon.jsii.Kernel.get(this, "trustStoreArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRevocationsS3Bucket() {
        return software.amazon.jsii.Kernel.get(this, "revocationsS3Bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRevocationsS3Bucket(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "revocationsS3Bucket", java.util.Objects.requireNonNull(value, "revocationsS3Bucket is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRevocationsS3Key() {
        return software.amazon.jsii.Kernel.get(this, "revocationsS3Key", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRevocationsS3Key(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "revocationsS3Key", java.util.Objects.requireNonNull(value, "revocationsS3Key is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRevocationsS3ObjectVersion() {
        return software.amazon.jsii.Kernel.get(this, "revocationsS3ObjectVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRevocationsS3ObjectVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "revocationsS3ObjectVersion", java.util.Objects.requireNonNull(value, "revocationsS3ObjectVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTrustStoreArn() {
        return software.amazon.jsii.Kernel.get(this, "trustStoreArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTrustStoreArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "trustStoreArn", java.util.Objects.requireNonNull(value, "trustStoreArn is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.lb_trust_store_revocation.LbTrustStoreRevocation}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.lb_trust_store_revocation.LbTrustStoreRevocation> {
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
        private final imports.aws.lb_trust_store_revocation.LbTrustStoreRevocationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.lb_trust_store_revocation.LbTrustStoreRevocationConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_trust_store_revocation#revocations_s3_bucket LbTrustStoreRevocation#revocations_s3_bucket}.
         * <p>
         * @return {@code this}
         * @param revocationsS3Bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_trust_store_revocation#revocations_s3_bucket LbTrustStoreRevocation#revocations_s3_bucket}. This parameter is required.
         */
        public Builder revocationsS3Bucket(final java.lang.String revocationsS3Bucket) {
            this.config.revocationsS3Bucket(revocationsS3Bucket);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_trust_store_revocation#revocations_s3_key LbTrustStoreRevocation#revocations_s3_key}.
         * <p>
         * @return {@code this}
         * @param revocationsS3Key Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_trust_store_revocation#revocations_s3_key LbTrustStoreRevocation#revocations_s3_key}. This parameter is required.
         */
        public Builder revocationsS3Key(final java.lang.String revocationsS3Key) {
            this.config.revocationsS3Key(revocationsS3Key);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_trust_store_revocation#trust_store_arn LbTrustStoreRevocation#trust_store_arn}.
         * <p>
         * @return {@code this}
         * @param trustStoreArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_trust_store_revocation#trust_store_arn LbTrustStoreRevocation#trust_store_arn}. This parameter is required.
         */
        public Builder trustStoreArn(final java.lang.String trustStoreArn) {
            this.config.trustStoreArn(trustStoreArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_trust_store_revocation#id LbTrustStoreRevocation#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_trust_store_revocation#id LbTrustStoreRevocation#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_trust_store_revocation#revocations_s3_object_version LbTrustStoreRevocation#revocations_s3_object_version}.
         * <p>
         * @return {@code this}
         * @param revocationsS3ObjectVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_trust_store_revocation#revocations_s3_object_version LbTrustStoreRevocation#revocations_s3_object_version}. This parameter is required.
         */
        public Builder revocationsS3ObjectVersion(final java.lang.String revocationsS3ObjectVersion) {
            this.config.revocationsS3ObjectVersion(revocationsS3ObjectVersion);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_trust_store_revocation#timeouts LbTrustStoreRevocation#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.lb_trust_store_revocation.LbTrustStoreRevocationTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.lb_trust_store_revocation.LbTrustStoreRevocation}.
         */
        @Override
        public imports.aws.lb_trust_store_revocation.LbTrustStoreRevocation build() {
            return new imports.aws.lb_trust_store_revocation.LbTrustStoreRevocation(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
