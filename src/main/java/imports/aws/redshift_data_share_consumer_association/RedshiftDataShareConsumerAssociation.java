package imports.aws.redshift_data_share_consumer_association;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_consumer_association aws_redshift_data_share_consumer_association}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.156Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.redshiftDataShareConsumerAssociation.RedshiftDataShareConsumerAssociation")
public class RedshiftDataShareConsumerAssociation extends com.hashicorp.cdktf.TerraformResource {

    protected RedshiftDataShareConsumerAssociation(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected RedshiftDataShareConsumerAssociation(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.redshift_data_share_consumer_association.RedshiftDataShareConsumerAssociation.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_consumer_association aws_redshift_data_share_consumer_association} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public RedshiftDataShareConsumerAssociation(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.redshift_data_share_consumer_association.RedshiftDataShareConsumerAssociationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a RedshiftDataShareConsumerAssociation resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the RedshiftDataShareConsumerAssociation to import. This parameter is required.
     * @param importFromId The id of the existing RedshiftDataShareConsumerAssociation that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the RedshiftDataShareConsumerAssociation to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.redshift_data_share_consumer_association.RedshiftDataShareConsumerAssociation.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a RedshiftDataShareConsumerAssociation resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the RedshiftDataShareConsumerAssociation to import. This parameter is required.
     * @param importFromId The id of the existing RedshiftDataShareConsumerAssociation that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.redshift_data_share_consumer_association.RedshiftDataShareConsumerAssociation.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetAllowWrites() {
        software.amazon.jsii.Kernel.call(this, "resetAllowWrites", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAssociateEntireAccount() {
        software.amazon.jsii.Kernel.call(this, "resetAssociateEntireAccount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetConsumerArn() {
        software.amazon.jsii.Kernel.call(this, "resetConsumerArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetConsumerRegion() {
        software.amazon.jsii.Kernel.call(this, "resetConsumerRegion", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.Nullable java.lang.Object getAssociateEntireAccountInput() {
        return software.amazon.jsii.Kernel.get(this, "associateEntireAccountInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConsumerArnInput() {
        return software.amazon.jsii.Kernel.get(this, "consumerArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConsumerRegionInput() {
        return software.amazon.jsii.Kernel.get(this, "consumerRegionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.Object getAssociateEntireAccount() {
        return software.amazon.jsii.Kernel.get(this, "associateEntireAccount", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAssociateEntireAccount(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "associateEntireAccount", java.util.Objects.requireNonNull(value, "associateEntireAccount is required"));
    }

    public void setAssociateEntireAccount(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "associateEntireAccount", java.util.Objects.requireNonNull(value, "associateEntireAccount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConsumerArn() {
        return software.amazon.jsii.Kernel.get(this, "consumerArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConsumerArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "consumerArn", java.util.Objects.requireNonNull(value, "consumerArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConsumerRegion() {
        return software.amazon.jsii.Kernel.get(this, "consumerRegion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConsumerRegion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "consumerRegion", java.util.Objects.requireNonNull(value, "consumerRegion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDataShareArn() {
        return software.amazon.jsii.Kernel.get(this, "dataShareArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDataShareArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dataShareArn", java.util.Objects.requireNonNull(value, "dataShareArn is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.redshift_data_share_consumer_association.RedshiftDataShareConsumerAssociation}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.redshift_data_share_consumer_association.RedshiftDataShareConsumerAssociation> {
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
        private final imports.aws.redshift_data_share_consumer_association.RedshiftDataShareConsumerAssociationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.redshift_data_share_consumer_association.RedshiftDataShareConsumerAssociationConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_consumer_association#data_share_arn RedshiftDataShareConsumerAssociation#data_share_arn}.
         * <p>
         * @return {@code this}
         * @param dataShareArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_consumer_association#data_share_arn RedshiftDataShareConsumerAssociation#data_share_arn}. This parameter is required.
         */
        public Builder dataShareArn(final java.lang.String dataShareArn) {
            this.config.dataShareArn(dataShareArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_consumer_association#allow_writes RedshiftDataShareConsumerAssociation#allow_writes}.
         * <p>
         * @return {@code this}
         * @param allowWrites Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_consumer_association#allow_writes RedshiftDataShareConsumerAssociation#allow_writes}. This parameter is required.
         */
        public Builder allowWrites(final java.lang.Boolean allowWrites) {
            this.config.allowWrites(allowWrites);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_consumer_association#allow_writes RedshiftDataShareConsumerAssociation#allow_writes}.
         * <p>
         * @return {@code this}
         * @param allowWrites Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_consumer_association#allow_writes RedshiftDataShareConsumerAssociation#allow_writes}. This parameter is required.
         */
        public Builder allowWrites(final com.hashicorp.cdktf.IResolvable allowWrites) {
            this.config.allowWrites(allowWrites);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_consumer_association#associate_entire_account RedshiftDataShareConsumerAssociation#associate_entire_account}.
         * <p>
         * @return {@code this}
         * @param associateEntireAccount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_consumer_association#associate_entire_account RedshiftDataShareConsumerAssociation#associate_entire_account}. This parameter is required.
         */
        public Builder associateEntireAccount(final java.lang.Boolean associateEntireAccount) {
            this.config.associateEntireAccount(associateEntireAccount);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_consumer_association#associate_entire_account RedshiftDataShareConsumerAssociation#associate_entire_account}.
         * <p>
         * @return {@code this}
         * @param associateEntireAccount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_consumer_association#associate_entire_account RedshiftDataShareConsumerAssociation#associate_entire_account}. This parameter is required.
         */
        public Builder associateEntireAccount(final com.hashicorp.cdktf.IResolvable associateEntireAccount) {
            this.config.associateEntireAccount(associateEntireAccount);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_consumer_association#consumer_arn RedshiftDataShareConsumerAssociation#consumer_arn}.
         * <p>
         * @return {@code this}
         * @param consumerArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_consumer_association#consumer_arn RedshiftDataShareConsumerAssociation#consumer_arn}. This parameter is required.
         */
        public Builder consumerArn(final java.lang.String consumerArn) {
            this.config.consumerArn(consumerArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_consumer_association#consumer_region RedshiftDataShareConsumerAssociation#consumer_region}.
         * <p>
         * @return {@code this}
         * @param consumerRegion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_consumer_association#consumer_region RedshiftDataShareConsumerAssociation#consumer_region}. This parameter is required.
         */
        public Builder consumerRegion(final java.lang.String consumerRegion) {
            this.config.consumerRegion(consumerRegion);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.redshift_data_share_consumer_association.RedshiftDataShareConsumerAssociation}.
         */
        @Override
        public imports.aws.redshift_data_share_consumer_association.RedshiftDataShareConsumerAssociation build() {
            return new imports.aws.redshift_data_share_consumer_association.RedshiftDataShareConsumerAssociation(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
