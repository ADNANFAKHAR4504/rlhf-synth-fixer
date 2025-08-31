package imports.aws.redshift_data_share_authorization;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.156Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.redshiftDataShareAuthorization.RedshiftDataShareAuthorizationConfig")
@software.amazon.jsii.Jsii.Proxy(RedshiftDataShareAuthorizationConfig.Jsii$Proxy.class)
public interface RedshiftDataShareAuthorizationConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_authorization#consumer_identifier RedshiftDataShareAuthorization#consumer_identifier}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getConsumerIdentifier();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_authorization#data_share_arn RedshiftDataShareAuthorization#data_share_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDataShareArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_authorization#allow_writes RedshiftDataShareAuthorization#allow_writes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAllowWrites() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RedshiftDataShareAuthorizationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RedshiftDataShareAuthorizationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RedshiftDataShareAuthorizationConfig> {
        java.lang.String consumerIdentifier;
        java.lang.String dataShareArn;
        java.lang.Object allowWrites;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link RedshiftDataShareAuthorizationConfig#getConsumerIdentifier}
         * @param consumerIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_authorization#consumer_identifier RedshiftDataShareAuthorization#consumer_identifier}. This parameter is required.
         * @return {@code this}
         */
        public Builder consumerIdentifier(java.lang.String consumerIdentifier) {
            this.consumerIdentifier = consumerIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftDataShareAuthorizationConfig#getDataShareArn}
         * @param dataShareArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_authorization#data_share_arn RedshiftDataShareAuthorization#data_share_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder dataShareArn(java.lang.String dataShareArn) {
            this.dataShareArn = dataShareArn;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftDataShareAuthorizationConfig#getAllowWrites}
         * @param allowWrites Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_authorization#allow_writes RedshiftDataShareAuthorization#allow_writes}.
         * @return {@code this}
         */
        public Builder allowWrites(java.lang.Boolean allowWrites) {
            this.allowWrites = allowWrites;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftDataShareAuthorizationConfig#getAllowWrites}
         * @param allowWrites Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_data_share_authorization#allow_writes RedshiftDataShareAuthorization#allow_writes}.
         * @return {@code this}
         */
        public Builder allowWrites(com.hashicorp.cdktf.IResolvable allowWrites) {
            this.allowWrites = allowWrites;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftDataShareAuthorizationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftDataShareAuthorizationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftDataShareAuthorizationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftDataShareAuthorizationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftDataShareAuthorizationConfig#getDependsOn}
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
         * Sets the value of {@link RedshiftDataShareAuthorizationConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftDataShareAuthorizationConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftDataShareAuthorizationConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftDataShareAuthorizationConfig#getProvisioners}
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
         * @return a new instance of {@link RedshiftDataShareAuthorizationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RedshiftDataShareAuthorizationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RedshiftDataShareAuthorizationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RedshiftDataShareAuthorizationConfig {
        private final java.lang.String consumerIdentifier;
        private final java.lang.String dataShareArn;
        private final java.lang.Object allowWrites;
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
            this.consumerIdentifier = software.amazon.jsii.Kernel.get(this, "consumerIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dataShareArn = software.amazon.jsii.Kernel.get(this, "dataShareArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.allowWrites = software.amazon.jsii.Kernel.get(this, "allowWrites", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.consumerIdentifier = java.util.Objects.requireNonNull(builder.consumerIdentifier, "consumerIdentifier is required");
            this.dataShareArn = java.util.Objects.requireNonNull(builder.dataShareArn, "dataShareArn is required");
            this.allowWrites = builder.allowWrites;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getConsumerIdentifier() {
            return this.consumerIdentifier;
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

            data.set("consumerIdentifier", om.valueToTree(this.getConsumerIdentifier()));
            data.set("dataShareArn", om.valueToTree(this.getDataShareArn()));
            if (this.getAllowWrites() != null) {
                data.set("allowWrites", om.valueToTree(this.getAllowWrites()));
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
            struct.set("fqn", om.valueToTree("aws.redshiftDataShareAuthorization.RedshiftDataShareAuthorizationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RedshiftDataShareAuthorizationConfig.Jsii$Proxy that = (RedshiftDataShareAuthorizationConfig.Jsii$Proxy) o;

            if (!consumerIdentifier.equals(that.consumerIdentifier)) return false;
            if (!dataShareArn.equals(that.dataShareArn)) return false;
            if (this.allowWrites != null ? !this.allowWrites.equals(that.allowWrites) : that.allowWrites != null) return false;
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
            int result = this.consumerIdentifier.hashCode();
            result = 31 * result + (this.dataShareArn.hashCode());
            result = 31 * result + (this.allowWrites != null ? this.allowWrites.hashCode() : 0);
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
