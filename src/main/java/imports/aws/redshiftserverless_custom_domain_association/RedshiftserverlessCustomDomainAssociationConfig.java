package imports.aws.redshiftserverless_custom_domain_association;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.173Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.redshiftserverlessCustomDomainAssociation.RedshiftserverlessCustomDomainAssociationConfig")
@software.amazon.jsii.Jsii.Proxy(RedshiftserverlessCustomDomainAssociationConfig.Jsii$Proxy.class)
public interface RedshiftserverlessCustomDomainAssociationConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_custom_domain_association#custom_domain_certificate_arn RedshiftserverlessCustomDomainAssociation#custom_domain_certificate_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCustomDomainCertificateArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_custom_domain_association#custom_domain_name RedshiftserverlessCustomDomainAssociation#custom_domain_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCustomDomainName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_custom_domain_association#workgroup_name RedshiftserverlessCustomDomainAssociation#workgroup_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getWorkgroupName();

    /**
     * @return a {@link Builder} of {@link RedshiftserverlessCustomDomainAssociationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RedshiftserverlessCustomDomainAssociationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RedshiftserverlessCustomDomainAssociationConfig> {
        java.lang.String customDomainCertificateArn;
        java.lang.String customDomainName;
        java.lang.String workgroupName;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link RedshiftserverlessCustomDomainAssociationConfig#getCustomDomainCertificateArn}
         * @param customDomainCertificateArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_custom_domain_association#custom_domain_certificate_arn RedshiftserverlessCustomDomainAssociation#custom_domain_certificate_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder customDomainCertificateArn(java.lang.String customDomainCertificateArn) {
            this.customDomainCertificateArn = customDomainCertificateArn;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessCustomDomainAssociationConfig#getCustomDomainName}
         * @param customDomainName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_custom_domain_association#custom_domain_name RedshiftserverlessCustomDomainAssociation#custom_domain_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder customDomainName(java.lang.String customDomainName) {
            this.customDomainName = customDomainName;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessCustomDomainAssociationConfig#getWorkgroupName}
         * @param workgroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_custom_domain_association#workgroup_name RedshiftserverlessCustomDomainAssociation#workgroup_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder workgroupName(java.lang.String workgroupName) {
            this.workgroupName = workgroupName;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessCustomDomainAssociationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessCustomDomainAssociationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessCustomDomainAssociationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessCustomDomainAssociationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessCustomDomainAssociationConfig#getDependsOn}
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
         * Sets the value of {@link RedshiftserverlessCustomDomainAssociationConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessCustomDomainAssociationConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessCustomDomainAssociationConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessCustomDomainAssociationConfig#getProvisioners}
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
         * @return a new instance of {@link RedshiftserverlessCustomDomainAssociationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RedshiftserverlessCustomDomainAssociationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RedshiftserverlessCustomDomainAssociationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RedshiftserverlessCustomDomainAssociationConfig {
        private final java.lang.String customDomainCertificateArn;
        private final java.lang.String customDomainName;
        private final java.lang.String workgroupName;
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
            this.customDomainCertificateArn = software.amazon.jsii.Kernel.get(this, "customDomainCertificateArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.customDomainName = software.amazon.jsii.Kernel.get(this, "customDomainName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.workgroupName = software.amazon.jsii.Kernel.get(this, "workgroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.customDomainCertificateArn = java.util.Objects.requireNonNull(builder.customDomainCertificateArn, "customDomainCertificateArn is required");
            this.customDomainName = java.util.Objects.requireNonNull(builder.customDomainName, "customDomainName is required");
            this.workgroupName = java.util.Objects.requireNonNull(builder.workgroupName, "workgroupName is required");
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getCustomDomainCertificateArn() {
            return this.customDomainCertificateArn;
        }

        @Override
        public final java.lang.String getCustomDomainName() {
            return this.customDomainName;
        }

        @Override
        public final java.lang.String getWorkgroupName() {
            return this.workgroupName;
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

            data.set("customDomainCertificateArn", om.valueToTree(this.getCustomDomainCertificateArn()));
            data.set("customDomainName", om.valueToTree(this.getCustomDomainName()));
            data.set("workgroupName", om.valueToTree(this.getWorkgroupName()));
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
            struct.set("fqn", om.valueToTree("aws.redshiftserverlessCustomDomainAssociation.RedshiftserverlessCustomDomainAssociationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RedshiftserverlessCustomDomainAssociationConfig.Jsii$Proxy that = (RedshiftserverlessCustomDomainAssociationConfig.Jsii$Proxy) o;

            if (!customDomainCertificateArn.equals(that.customDomainCertificateArn)) return false;
            if (!customDomainName.equals(that.customDomainName)) return false;
            if (!workgroupName.equals(that.workgroupName)) return false;
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
            int result = this.customDomainCertificateArn.hashCode();
            result = 31 * result + (this.customDomainName.hashCode());
            result = 31 * result + (this.workgroupName.hashCode());
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
