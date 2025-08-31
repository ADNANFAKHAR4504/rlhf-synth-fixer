package imports.aws.amplify_domain_association;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.935Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.amplifyDomainAssociation.AmplifyDomainAssociationConfig")
@software.amazon.jsii.Jsii.Proxy(AmplifyDomainAssociationConfig.Jsii$Proxy.class)
public interface AmplifyDomainAssociationConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#app_id AmplifyDomainAssociation#app_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAppId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#domain_name AmplifyDomainAssociation#domain_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDomainName();

    /**
     * sub_domain block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#sub_domain AmplifyDomainAssociation#sub_domain}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getSubDomain();

    /**
     * certificate_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#certificate_settings AmplifyDomainAssociation#certificate_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.amplify_domain_association.AmplifyDomainAssociationCertificateSettings getCertificateSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#enable_auto_sub_domain AmplifyDomainAssociation#enable_auto_sub_domain}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableAutoSubDomain() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#id AmplifyDomainAssociation#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#wait_for_verification AmplifyDomainAssociation#wait_for_verification}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getWaitForVerification() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AmplifyDomainAssociationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AmplifyDomainAssociationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AmplifyDomainAssociationConfig> {
        java.lang.String appId;
        java.lang.String domainName;
        java.lang.Object subDomain;
        imports.aws.amplify_domain_association.AmplifyDomainAssociationCertificateSettings certificateSettings;
        java.lang.Object enableAutoSubDomain;
        java.lang.String id;
        java.lang.Object waitForVerification;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link AmplifyDomainAssociationConfig#getAppId}
         * @param appId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#app_id AmplifyDomainAssociation#app_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder appId(java.lang.String appId) {
            this.appId = appId;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyDomainAssociationConfig#getDomainName}
         * @param domainName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#domain_name AmplifyDomainAssociation#domain_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder domainName(java.lang.String domainName) {
            this.domainName = domainName;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyDomainAssociationConfig#getSubDomain}
         * @param subDomain sub_domain block. This parameter is required.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#sub_domain AmplifyDomainAssociation#sub_domain}
         * @return {@code this}
         */
        public Builder subDomain(com.hashicorp.cdktf.IResolvable subDomain) {
            this.subDomain = subDomain;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyDomainAssociationConfig#getSubDomain}
         * @param subDomain sub_domain block. This parameter is required.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#sub_domain AmplifyDomainAssociation#sub_domain}
         * @return {@code this}
         */
        public Builder subDomain(java.util.List<? extends imports.aws.amplify_domain_association.AmplifyDomainAssociationSubDomain> subDomain) {
            this.subDomain = subDomain;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyDomainAssociationConfig#getCertificateSettings}
         * @param certificateSettings certificate_settings block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#certificate_settings AmplifyDomainAssociation#certificate_settings}
         * @return {@code this}
         */
        public Builder certificateSettings(imports.aws.amplify_domain_association.AmplifyDomainAssociationCertificateSettings certificateSettings) {
            this.certificateSettings = certificateSettings;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyDomainAssociationConfig#getEnableAutoSubDomain}
         * @param enableAutoSubDomain Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#enable_auto_sub_domain AmplifyDomainAssociation#enable_auto_sub_domain}.
         * @return {@code this}
         */
        public Builder enableAutoSubDomain(java.lang.Boolean enableAutoSubDomain) {
            this.enableAutoSubDomain = enableAutoSubDomain;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyDomainAssociationConfig#getEnableAutoSubDomain}
         * @param enableAutoSubDomain Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#enable_auto_sub_domain AmplifyDomainAssociation#enable_auto_sub_domain}.
         * @return {@code this}
         */
        public Builder enableAutoSubDomain(com.hashicorp.cdktf.IResolvable enableAutoSubDomain) {
            this.enableAutoSubDomain = enableAutoSubDomain;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyDomainAssociationConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#id AmplifyDomainAssociation#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyDomainAssociationConfig#getWaitForVerification}
         * @param waitForVerification Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#wait_for_verification AmplifyDomainAssociation#wait_for_verification}.
         * @return {@code this}
         */
        public Builder waitForVerification(java.lang.Boolean waitForVerification) {
            this.waitForVerification = waitForVerification;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyDomainAssociationConfig#getWaitForVerification}
         * @param waitForVerification Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_domain_association#wait_for_verification AmplifyDomainAssociation#wait_for_verification}.
         * @return {@code this}
         */
        public Builder waitForVerification(com.hashicorp.cdktf.IResolvable waitForVerification) {
            this.waitForVerification = waitForVerification;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyDomainAssociationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyDomainAssociationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyDomainAssociationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyDomainAssociationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyDomainAssociationConfig#getDependsOn}
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
         * Sets the value of {@link AmplifyDomainAssociationConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyDomainAssociationConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyDomainAssociationConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link AmplifyDomainAssociationConfig#getProvisioners}
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
         * @return a new instance of {@link AmplifyDomainAssociationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AmplifyDomainAssociationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AmplifyDomainAssociationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AmplifyDomainAssociationConfig {
        private final java.lang.String appId;
        private final java.lang.String domainName;
        private final java.lang.Object subDomain;
        private final imports.aws.amplify_domain_association.AmplifyDomainAssociationCertificateSettings certificateSettings;
        private final java.lang.Object enableAutoSubDomain;
        private final java.lang.String id;
        private final java.lang.Object waitForVerification;
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
            this.appId = software.amazon.jsii.Kernel.get(this, "appId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.domainName = software.amazon.jsii.Kernel.get(this, "domainName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.subDomain = software.amazon.jsii.Kernel.get(this, "subDomain", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.certificateSettings = software.amazon.jsii.Kernel.get(this, "certificateSettings", software.amazon.jsii.NativeType.forClass(imports.aws.amplify_domain_association.AmplifyDomainAssociationCertificateSettings.class));
            this.enableAutoSubDomain = software.amazon.jsii.Kernel.get(this, "enableAutoSubDomain", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.waitForVerification = software.amazon.jsii.Kernel.get(this, "waitForVerification", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.appId = java.util.Objects.requireNonNull(builder.appId, "appId is required");
            this.domainName = java.util.Objects.requireNonNull(builder.domainName, "domainName is required");
            this.subDomain = java.util.Objects.requireNonNull(builder.subDomain, "subDomain is required");
            this.certificateSettings = builder.certificateSettings;
            this.enableAutoSubDomain = builder.enableAutoSubDomain;
            this.id = builder.id;
            this.waitForVerification = builder.waitForVerification;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getAppId() {
            return this.appId;
        }

        @Override
        public final java.lang.String getDomainName() {
            return this.domainName;
        }

        @Override
        public final java.lang.Object getSubDomain() {
            return this.subDomain;
        }

        @Override
        public final imports.aws.amplify_domain_association.AmplifyDomainAssociationCertificateSettings getCertificateSettings() {
            return this.certificateSettings;
        }

        @Override
        public final java.lang.Object getEnableAutoSubDomain() {
            return this.enableAutoSubDomain;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getWaitForVerification() {
            return this.waitForVerification;
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

            data.set("appId", om.valueToTree(this.getAppId()));
            data.set("domainName", om.valueToTree(this.getDomainName()));
            data.set("subDomain", om.valueToTree(this.getSubDomain()));
            if (this.getCertificateSettings() != null) {
                data.set("certificateSettings", om.valueToTree(this.getCertificateSettings()));
            }
            if (this.getEnableAutoSubDomain() != null) {
                data.set("enableAutoSubDomain", om.valueToTree(this.getEnableAutoSubDomain()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getWaitForVerification() != null) {
                data.set("waitForVerification", om.valueToTree(this.getWaitForVerification()));
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
            struct.set("fqn", om.valueToTree("aws.amplifyDomainAssociation.AmplifyDomainAssociationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AmplifyDomainAssociationConfig.Jsii$Proxy that = (AmplifyDomainAssociationConfig.Jsii$Proxy) o;

            if (!appId.equals(that.appId)) return false;
            if (!domainName.equals(that.domainName)) return false;
            if (!subDomain.equals(that.subDomain)) return false;
            if (this.certificateSettings != null ? !this.certificateSettings.equals(that.certificateSettings) : that.certificateSettings != null) return false;
            if (this.enableAutoSubDomain != null ? !this.enableAutoSubDomain.equals(that.enableAutoSubDomain) : that.enableAutoSubDomain != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.waitForVerification != null ? !this.waitForVerification.equals(that.waitForVerification) : that.waitForVerification != null) return false;
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
            int result = this.appId.hashCode();
            result = 31 * result + (this.domainName.hashCode());
            result = 31 * result + (this.subDomain.hashCode());
            result = 31 * result + (this.certificateSettings != null ? this.certificateSettings.hashCode() : 0);
            result = 31 * result + (this.enableAutoSubDomain != null ? this.enableAutoSubDomain.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.waitForVerification != null ? this.waitForVerification.hashCode() : 0);
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
