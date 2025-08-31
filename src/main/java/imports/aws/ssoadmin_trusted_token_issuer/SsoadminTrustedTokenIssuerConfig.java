package imports.aws.ssoadmin_trusted_token_issuer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.526Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssoadminTrustedTokenIssuer.SsoadminTrustedTokenIssuerConfig")
@software.amazon.jsii.Jsii.Proxy(SsoadminTrustedTokenIssuerConfig.Jsii$Proxy.class)
public interface SsoadminTrustedTokenIssuerConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_trusted_token_issuer#instance_arn SsoadminTrustedTokenIssuer#instance_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getInstanceArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_trusted_token_issuer#name SsoadminTrustedTokenIssuer#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_trusted_token_issuer#trusted_token_issuer_type SsoadminTrustedTokenIssuer#trusted_token_issuer_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTrustedTokenIssuerType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_trusted_token_issuer#client_token SsoadminTrustedTokenIssuer#client_token}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getClientToken() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_trusted_token_issuer#tags SsoadminTrustedTokenIssuer#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * trusted_token_issuer_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_trusted_token_issuer#trusted_token_issuer_configuration SsoadminTrustedTokenIssuer#trusted_token_issuer_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTrustedTokenIssuerConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SsoadminTrustedTokenIssuerConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsoadminTrustedTokenIssuerConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsoadminTrustedTokenIssuerConfig> {
        java.lang.String instanceArn;
        java.lang.String name;
        java.lang.String trustedTokenIssuerType;
        java.lang.String clientToken;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.lang.Object trustedTokenIssuerConfiguration;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link SsoadminTrustedTokenIssuerConfig#getInstanceArn}
         * @param instanceArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_trusted_token_issuer#instance_arn SsoadminTrustedTokenIssuer#instance_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder instanceArn(java.lang.String instanceArn) {
            this.instanceArn = instanceArn;
            return this;
        }

        /**
         * Sets the value of {@link SsoadminTrustedTokenIssuerConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_trusted_token_issuer#name SsoadminTrustedTokenIssuer#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link SsoadminTrustedTokenIssuerConfig#getTrustedTokenIssuerType}
         * @param trustedTokenIssuerType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_trusted_token_issuer#trusted_token_issuer_type SsoadminTrustedTokenIssuer#trusted_token_issuer_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder trustedTokenIssuerType(java.lang.String trustedTokenIssuerType) {
            this.trustedTokenIssuerType = trustedTokenIssuerType;
            return this;
        }

        /**
         * Sets the value of {@link SsoadminTrustedTokenIssuerConfig#getClientToken}
         * @param clientToken Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_trusted_token_issuer#client_token SsoadminTrustedTokenIssuer#client_token}.
         * @return {@code this}
         */
        public Builder clientToken(java.lang.String clientToken) {
            this.clientToken = clientToken;
            return this;
        }

        /**
         * Sets the value of {@link SsoadminTrustedTokenIssuerConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_trusted_token_issuer#tags SsoadminTrustedTokenIssuer#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link SsoadminTrustedTokenIssuerConfig#getTrustedTokenIssuerConfiguration}
         * @param trustedTokenIssuerConfiguration trusted_token_issuer_configuration block.
         *                                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_trusted_token_issuer#trusted_token_issuer_configuration SsoadminTrustedTokenIssuer#trusted_token_issuer_configuration}
         * @return {@code this}
         */
        public Builder trustedTokenIssuerConfiguration(com.hashicorp.cdktf.IResolvable trustedTokenIssuerConfiguration) {
            this.trustedTokenIssuerConfiguration = trustedTokenIssuerConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link SsoadminTrustedTokenIssuerConfig#getTrustedTokenIssuerConfiguration}
         * @param trustedTokenIssuerConfiguration trusted_token_issuer_configuration block.
         *                                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_trusted_token_issuer#trusted_token_issuer_configuration SsoadminTrustedTokenIssuer#trusted_token_issuer_configuration}
         * @return {@code this}
         */
        public Builder trustedTokenIssuerConfiguration(java.util.List<? extends imports.aws.ssoadmin_trusted_token_issuer.SsoadminTrustedTokenIssuerTrustedTokenIssuerConfiguration> trustedTokenIssuerConfiguration) {
            this.trustedTokenIssuerConfiguration = trustedTokenIssuerConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link SsoadminTrustedTokenIssuerConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SsoadminTrustedTokenIssuerConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SsoadminTrustedTokenIssuerConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SsoadminTrustedTokenIssuerConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SsoadminTrustedTokenIssuerConfig#getDependsOn}
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
         * Sets the value of {@link SsoadminTrustedTokenIssuerConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link SsoadminTrustedTokenIssuerConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link SsoadminTrustedTokenIssuerConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link SsoadminTrustedTokenIssuerConfig#getProvisioners}
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
         * @return a new instance of {@link SsoadminTrustedTokenIssuerConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsoadminTrustedTokenIssuerConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsoadminTrustedTokenIssuerConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsoadminTrustedTokenIssuerConfig {
        private final java.lang.String instanceArn;
        private final java.lang.String name;
        private final java.lang.String trustedTokenIssuerType;
        private final java.lang.String clientToken;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.lang.Object trustedTokenIssuerConfiguration;
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
            this.instanceArn = software.amazon.jsii.Kernel.get(this, "instanceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.trustedTokenIssuerType = software.amazon.jsii.Kernel.get(this, "trustedTokenIssuerType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.clientToken = software.amazon.jsii.Kernel.get(this, "clientToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.trustedTokenIssuerConfiguration = software.amazon.jsii.Kernel.get(this, "trustedTokenIssuerConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.instanceArn = java.util.Objects.requireNonNull(builder.instanceArn, "instanceArn is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.trustedTokenIssuerType = java.util.Objects.requireNonNull(builder.trustedTokenIssuerType, "trustedTokenIssuerType is required");
            this.clientToken = builder.clientToken;
            this.tags = builder.tags;
            this.trustedTokenIssuerConfiguration = builder.trustedTokenIssuerConfiguration;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getInstanceArn() {
            return this.instanceArn;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getTrustedTokenIssuerType() {
            return this.trustedTokenIssuerType;
        }

        @Override
        public final java.lang.String getClientToken() {
            return this.clientToken;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.lang.Object getTrustedTokenIssuerConfiguration() {
            return this.trustedTokenIssuerConfiguration;
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

            data.set("instanceArn", om.valueToTree(this.getInstanceArn()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("trustedTokenIssuerType", om.valueToTree(this.getTrustedTokenIssuerType()));
            if (this.getClientToken() != null) {
                data.set("clientToken", om.valueToTree(this.getClientToken()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTrustedTokenIssuerConfiguration() != null) {
                data.set("trustedTokenIssuerConfiguration", om.valueToTree(this.getTrustedTokenIssuerConfiguration()));
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
            struct.set("fqn", om.valueToTree("aws.ssoadminTrustedTokenIssuer.SsoadminTrustedTokenIssuerConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsoadminTrustedTokenIssuerConfig.Jsii$Proxy that = (SsoadminTrustedTokenIssuerConfig.Jsii$Proxy) o;

            if (!instanceArn.equals(that.instanceArn)) return false;
            if (!name.equals(that.name)) return false;
            if (!trustedTokenIssuerType.equals(that.trustedTokenIssuerType)) return false;
            if (this.clientToken != null ? !this.clientToken.equals(that.clientToken) : that.clientToken != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.trustedTokenIssuerConfiguration != null ? !this.trustedTokenIssuerConfiguration.equals(that.trustedTokenIssuerConfiguration) : that.trustedTokenIssuerConfiguration != null) return false;
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
            int result = this.instanceArn.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.trustedTokenIssuerType.hashCode());
            result = 31 * result + (this.clientToken != null ? this.clientToken.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.trustedTokenIssuerConfiguration != null ? this.trustedTokenIssuerConfiguration.hashCode() : 0);
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
