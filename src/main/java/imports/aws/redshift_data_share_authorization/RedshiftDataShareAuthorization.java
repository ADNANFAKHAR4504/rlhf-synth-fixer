package imports.aws.redshift_data_share_authorization;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_authorization aws_redshift_data_share_authorization}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.156Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.redshiftDataShareAuthorization.RedshiftDataShareAuthorization")
public class RedshiftDataShareAuthorization extends com.hashicorp.cdktf.TerraformResource {

    protected RedshiftDataShareAuthorization(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected RedshiftDataShareAuthorization(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.redshift_data_share_authorization.RedshiftDataShareAuthorization.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_authorization aws_redshift_data_share_authorization} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public RedshiftDataShareAuthorization(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.redshift_data_share_authorization.RedshiftDataShareAuthorizationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a RedshiftDataShareAuthorization resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the RedshiftDataShareAuthorization to import. This parameter is required.
     * @param importFromId The id of the existing RedshiftDataShareAuthorization that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the RedshiftDataShareAuthorization to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.redshift_data_share_authorization.RedshiftDataShareAuthorization.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a RedshiftDataShareAuthorization resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the RedshiftDataShareAuthorization to import. This parameter is required.
     * @param importFromId The id of the existing RedshiftDataShareAuthorization that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.redshift_data_share_authorization.RedshiftDataShareAuthorization.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetAllowWrites() {
        software.amazon.jsii.Kernel.call(this, "resetAllowWrites", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getManagedBy() {
        return software.amazon.jsii.Kernel.get(this, "managedBy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProducerArn() {
        return software.amazon.jsii.Kernel.get(this, "producerArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAllowWritesInput() {
        return software.amazon.jsii.Kernel.get(this, "allowWritesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConsumerIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "consumerIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDataShareArnInput() {
        return software.amazon.jsii.Kernel.get(this, "dataShareArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAllowWrites() {
        return software.amazon.jsii.Kernel.get(this, "allowWrites", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAllowWrites(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "allowWrites", java.util.Objects.requireNonNull(value, "allowWrites is required"));
    }

    public void setAllowWrites(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "allowWrites", java.util.Objects.requireNonNull(value, "allowWrites is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConsumerIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "consumerIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConsumerIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "consumerIdentifier", java.util.Objects.requireNonNull(value, "consumerIdentifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDataShareArn() {
        return software.amazon.jsii.Kernel.get(this, "dataShareArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDataShareArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dataShareArn", java.util.Objects.requireNonNull(value, "dataShareArn is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.redshift_data_share_authorization.RedshiftDataShareAuthorization}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.redshift_data_share_authorization.RedshiftDataShareAuthorization> {
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
        private final imports.aws.redshift_data_share_authorization.RedshiftDataShareAuthorizationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.redshift_data_share_authorization.RedshiftDataShareAuthorizationConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_authorization#consumer_identifier RedshiftDataShareAuthorization#consumer_identifier}.
         * <p>
         * @return {@code this}
         * @param consumerIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_authorization#consumer_identifier RedshiftDataShareAuthorization#consumer_identifier}. This parameter is required.
         */
        public Builder consumerIdentifier(final java.lang.String consumerIdentifier) {
            this.config.consumerIdentifier(consumerIdentifier);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_authorization#data_share_arn RedshiftDataShareAuthorization#data_share_arn}.
         * <p>
         * @return {@code this}
         * @param dataShareArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_authorization#data_share_arn RedshiftDataShareAuthorization#data_share_arn}. This parameter is required.
         */
        public Builder dataShareArn(final java.lang.String dataShareArn) {
            this.config.dataShareArn(dataShareArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_authorization#allow_writes RedshiftDataShareAuthorization#allow_writes}.
         * <p>
         * @return {@code this}
         * @param allowWrites Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_authorization#allow_writes RedshiftDataShareAuthorization#allow_writes}. This parameter is required.
         */
        public Builder allowWrites(final java.lang.Boolean allowWrites) {
            this.config.allowWrites(allowWrites);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_authorization#allow_writes RedshiftDataShareAuthorization#allow_writes}.
         * <p>
         * @return {@code this}
         * @param allowWrites Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_authorization#allow_writes RedshiftDataShareAuthorization#allow_writes}. This parameter is required.
         */
        public Builder allowWrites(final com.hashicorp.cdktf.IResolvable allowWrites) {
            this.config.allowWrites(allowWrites);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.redshift_data_share_authorization.RedshiftDataShareAuthorization}.
         */
        @Override
        public imports.aws.redshift_data_share_authorization.RedshiftDataShareAuthorization build() {
            return new imports.aws.redshift_data_share_authorization.RedshiftDataShareAuthorization(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
