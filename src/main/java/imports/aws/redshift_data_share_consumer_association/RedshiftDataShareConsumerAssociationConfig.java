package imports.aws.redshift_data_share_consumer_association;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.156Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.redshiftDataShareConsumerAssociation.RedshiftDataShareConsumerAssociationConfig")
@software.amazon.jsii.Jsii.Proxy(RedshiftDataShareConsumerAssociationConfig.Jsii$Proxy.class)
public interface RedshiftDataShareConsumerAssociationConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_consumer_association#data_share_arn RedshiftDataShareConsumerAssociation#data_share_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDataShareArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_consumer_association#allow_writes RedshiftDataShareConsumerAssociation#allow_writes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAllowWrites() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_consumer_association#associate_entire_account RedshiftDataShareConsumerAssociation#associate_entire_account}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAssociateEntireAccount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_consumer_association#consumer_arn RedshiftDataShareConsumerAssociation#consumer_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getConsumerArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_consumer_association#consumer_region RedshiftDataShareConsumerAssociation#consumer_region}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getConsumerRegion() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RedshiftDataShareConsumerAssociationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RedshiftDataShareConsumerAssociationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RedshiftDataShareConsumerAssociationConfig> {
        java.lang.String dataShareArn;
        java.lang.Object allowWrites;
        java.lang.Object associateEntireAccount;
        java.lang.String consumerArn;
        java.lang.String consumerRegion;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link RedshiftDataShareConsumerAssociationConfig#getDataShareArn}
         * @param dataShareArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_consumer_association#data_share_arn RedshiftDataShareConsumerAssociation#data_share_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder dataShareArn(java.lang.String dataShareArn) {
            this.dataShareArn = dataShareArn;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftDataShareConsumerAssociationConfig#getAllowWrites}
         * @param allowWrites Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_consumer_association#allow_writes RedshiftDataShareConsumerAssociation#allow_writes}.
         * @return {@code this}
         */
        public Builder allowWrites(java.lang.Boolean allowWrites) {
            this.allowWrites = allowWrites;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftDataShareConsumerAssociationConfig#getAllowWrites}
         * @param allowWrites Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_consumer_association#allow_writes RedshiftDataShareConsumerAssociation#allow_writes}.
         * @return {@code this}
         */
        public Builder allowWrites(com.hashicorp.cdktf.IResolvable allowWrites) {
            this.allowWrites = allowWrites;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftDataShareConsumerAssociationConfig#getAssociateEntireAccount}
         * @param associateEntireAccount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_consumer_association#associate_entire_account RedshiftDataShareConsumerAssociation#associate_entire_account}.
         * @return {@code this}
         */
        public Builder associateEntireAccount(java.lang.Boolean associateEntireAccount) {
            this.associateEntireAccount = associateEntireAccount;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftDataShareConsumerAssociationConfig#getAssociateEntireAccount}
         * @param associateEntireAccount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_consumer_association#associate_entire_account RedshiftDataShareConsumerAssociation#associate_entire_account}.
         * @return {@code this}
         */
        public Builder associateEntireAccount(com.hashicorp.cdktf.IResolvable associateEntireAccount) {
            this.associateEntireAccount = associateEntireAccount;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftDataShareConsumerAssociationConfig#getConsumerArn}
         * @param consumerArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_consumer_association#consumer_arn RedshiftDataShareConsumerAssociation#consumer_arn}.
         * @return {@code this}
         */
        public Builder consumerArn(java.lang.String consumerArn) {
            this.consumerArn = consumerArn;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftDataShareConsumerAssociationConfig#getConsumerRegion}
         * @param consumerRegion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_consumer_association#consumer_region RedshiftDataShareConsumerAssociation#consumer_region}.
         * @return {@code this}
         */
        public Builder consumerRegion(java.lang.String consumerRegion) {
            this.consumerRegion = consumerRegion;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftDataShareConsumerAssociationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftDataShareConsumerAssociationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftDataShareConsumerAssociationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftDataShareConsumerAssociationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftDataShareConsumerAssociationConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftDataShareConsumerAssociationConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftDataShareConsumerAssociationConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftDataShareConsumerAssociationConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftDataShareConsumerAssociationConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link RedshiftDataShareConsumerAssociationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RedshiftDataShareConsumerAssociationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RedshiftDataShareConsumerAssociationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RedshiftDataShareConsumerAssociationConfig {
        private final java.lang.String dataShareArn;
        private final java.lang.Object allowWrites;
        private final java.lang.Object associateEntireAccount;
        private final java.lang.String consumerArn;
        private final java.lang.String consumerRegion;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dataShareArn = software.amazon.jsii.Kernel.get(this, "dataShareArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.allowWrites = software.amazon.jsii.Kernel.get(this, "allowWrites", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.associateEntireAccount = software.amazon.jsii.Kernel.get(this, "associateEntireAccount", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.consumerArn = software.amazon.jsii.Kernel.get(this, "consumerArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.consumerRegion = software.amazon.jsii.Kernel.get(this, "consumerRegion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dataShareArn = java.util.Objects.requireNonNull(builder.dataShareArn, "dataShareArn is required");
            this.allowWrites = builder.allowWrites;
            this.associateEntireAccount = builder.associateEntireAccount;
            this.consumerArn = builder.consumerArn;
            this.consumerRegion = builder.consumerRegion;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getDataShareArn() {
            return this.dataShareArn;
        }

        @Override
        public final java.lang.Object getAllowWrites() {
            return this.allowWrites;
        }

        @Override
        public final java.lang.Object getAssociateEntireAccount() {
            return this.associateEntireAccount;
        }

        @Override
        public final java.lang.String getConsumerArn() {
            return this.consumerArn;
        }

        @Override
        public final java.lang.String getConsumerRegion() {
            return this.consumerRegion;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("dataShareArn", om.valueToTree(this.getDataShareArn()));
            if (this.getAllowWrites() != null) {
                data.set("allowWrites", om.valueToTree(this.getAllowWrites()));
            }
            if (this.getAssociateEntireAccount() != null) {
                data.set("associateEntireAccount", om.valueToTree(this.getAssociateEntireAccount()));
            }
            if (this.getConsumerArn() != null) {
                data.set("consumerArn", om.valueToTree(this.getConsumerArn()));
            }
            if (this.getConsumerRegion() != null) {
                data.set("consumerRegion", om.valueToTree(this.getConsumerRegion()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.redshiftDataShareConsumerAssociation.RedshiftDataShareConsumerAssociationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RedshiftDataShareConsumerAssociationConfig.Jsii$Proxy that = (RedshiftDataShareConsumerAssociationConfig.Jsii$Proxy) o;

            if (!dataShareArn.equals(that.dataShareArn)) return false;
            if (this.allowWrites != null ? !this.allowWrites.equals(that.allowWrites) : that.allowWrites != null) return false;
            if (this.associateEntireAccount != null ? !this.associateEntireAccount.equals(that.associateEntireAccount) : that.associateEntireAccount != null) return false;
            if (this.consumerArn != null ? !this.consumerArn.equals(that.consumerArn) : that.consumerArn != null) return false;
            if (this.consumerRegion != null ? !this.consumerRegion.equals(that.consumerRegion) : that.consumerRegion != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dataShareArn.hashCode();
            result = 31 * result + (this.allowWrites != null ? this.allowWrites.hashCode() : 0);
            result = 31 * result + (this.associateEntireAccount != null ? this.associateEntireAccount.hashCode() : 0);
            result = 31 * result + (this.consumerArn != null ? this.consumerArn.hashCode() : 0);
            result = 31 * result + (this.consumerRegion != null ? this.consumerRegion.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
