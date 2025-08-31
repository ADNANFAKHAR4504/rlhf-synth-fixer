package imports.aws.redshift_hsm_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.163Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.redshiftHsmConfiguration.RedshiftHsmConfigurationConfig")
@software.amazon.jsii.Jsii.Proxy(RedshiftHsmConfigurationConfig.Jsii$Proxy.class)
public interface RedshiftHsmConfigurationConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_hsm_configuration#description RedshiftHsmConfiguration#description}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDescription();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_hsm_configuration#hsm_configuration_identifier RedshiftHsmConfiguration#hsm_configuration_identifier}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getHsmConfigurationIdentifier();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_hsm_configuration#hsm_ip_address RedshiftHsmConfiguration#hsm_ip_address}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getHsmIpAddress();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_hsm_configuration#hsm_partition_name RedshiftHsmConfiguration#hsm_partition_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getHsmPartitionName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_hsm_configuration#hsm_partition_password RedshiftHsmConfiguration#hsm_partition_password}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getHsmPartitionPassword();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_hsm_configuration#hsm_server_public_certificate RedshiftHsmConfiguration#hsm_server_public_certificate}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getHsmServerPublicCertificate();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_hsm_configuration#id RedshiftHsmConfiguration#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_hsm_configuration#tags RedshiftHsmConfiguration#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_hsm_configuration#tags_all RedshiftHsmConfiguration#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RedshiftHsmConfigurationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RedshiftHsmConfigurationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RedshiftHsmConfigurationConfig> {
        java.lang.String description;
        java.lang.String hsmConfigurationIdentifier;
        java.lang.String hsmIpAddress;
        java.lang.String hsmPartitionName;
        java.lang.String hsmPartitionPassword;
        java.lang.String hsmServerPublicCertificate;
        java.lang.String id;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link RedshiftHsmConfigurationConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_hsm_configuration#description RedshiftHsmConfiguration#description}. This parameter is required.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftHsmConfigurationConfig#getHsmConfigurationIdentifier}
         * @param hsmConfigurationIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_hsm_configuration#hsm_configuration_identifier RedshiftHsmConfiguration#hsm_configuration_identifier}. This parameter is required.
         * @return {@code this}
         */
        public Builder hsmConfigurationIdentifier(java.lang.String hsmConfigurationIdentifier) {
            this.hsmConfigurationIdentifier = hsmConfigurationIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftHsmConfigurationConfig#getHsmIpAddress}
         * @param hsmIpAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_hsm_configuration#hsm_ip_address RedshiftHsmConfiguration#hsm_ip_address}. This parameter is required.
         * @return {@code this}
         */
        public Builder hsmIpAddress(java.lang.String hsmIpAddress) {
            this.hsmIpAddress = hsmIpAddress;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftHsmConfigurationConfig#getHsmPartitionName}
         * @param hsmPartitionName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_hsm_configuration#hsm_partition_name RedshiftHsmConfiguration#hsm_partition_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder hsmPartitionName(java.lang.String hsmPartitionName) {
            this.hsmPartitionName = hsmPartitionName;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftHsmConfigurationConfig#getHsmPartitionPassword}
         * @param hsmPartitionPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_hsm_configuration#hsm_partition_password RedshiftHsmConfiguration#hsm_partition_password}. This parameter is required.
         * @return {@code this}
         */
        public Builder hsmPartitionPassword(java.lang.String hsmPartitionPassword) {
            this.hsmPartitionPassword = hsmPartitionPassword;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftHsmConfigurationConfig#getHsmServerPublicCertificate}
         * @param hsmServerPublicCertificate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_hsm_configuration#hsm_server_public_certificate RedshiftHsmConfiguration#hsm_server_public_certificate}. This parameter is required.
         * @return {@code this}
         */
        public Builder hsmServerPublicCertificate(java.lang.String hsmServerPublicCertificate) {
            this.hsmServerPublicCertificate = hsmServerPublicCertificate;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftHsmConfigurationConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_hsm_configuration#id RedshiftHsmConfiguration#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftHsmConfigurationConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_hsm_configuration#tags RedshiftHsmConfiguration#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftHsmConfigurationConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshift_hsm_configuration#tags_all RedshiftHsmConfiguration#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftHsmConfigurationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftHsmConfigurationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftHsmConfigurationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftHsmConfigurationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftHsmConfigurationConfig#getDependsOn}
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
         * Sets the value of {@link RedshiftHsmConfigurationConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftHsmConfigurationConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftHsmConfigurationConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftHsmConfigurationConfig#getProvisioners}
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
         * @return a new instance of {@link RedshiftHsmConfigurationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RedshiftHsmConfigurationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RedshiftHsmConfigurationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RedshiftHsmConfigurationConfig {
        private final java.lang.String description;
        private final java.lang.String hsmConfigurationIdentifier;
        private final java.lang.String hsmIpAddress;
        private final java.lang.String hsmPartitionName;
        private final java.lang.String hsmPartitionPassword;
        private final java.lang.String hsmServerPublicCertificate;
        private final java.lang.String id;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
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
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.hsmConfigurationIdentifier = software.amazon.jsii.Kernel.get(this, "hsmConfigurationIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.hsmIpAddress = software.amazon.jsii.Kernel.get(this, "hsmIpAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.hsmPartitionName = software.amazon.jsii.Kernel.get(this, "hsmPartitionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.hsmPartitionPassword = software.amazon.jsii.Kernel.get(this, "hsmPartitionPassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.hsmServerPublicCertificate = software.amazon.jsii.Kernel.get(this, "hsmServerPublicCertificate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.description = java.util.Objects.requireNonNull(builder.description, "description is required");
            this.hsmConfigurationIdentifier = java.util.Objects.requireNonNull(builder.hsmConfigurationIdentifier, "hsmConfigurationIdentifier is required");
            this.hsmIpAddress = java.util.Objects.requireNonNull(builder.hsmIpAddress, "hsmIpAddress is required");
            this.hsmPartitionName = java.util.Objects.requireNonNull(builder.hsmPartitionName, "hsmPartitionName is required");
            this.hsmPartitionPassword = java.util.Objects.requireNonNull(builder.hsmPartitionPassword, "hsmPartitionPassword is required");
            this.hsmServerPublicCertificate = java.util.Objects.requireNonNull(builder.hsmServerPublicCertificate, "hsmServerPublicCertificate is required");
            this.id = builder.id;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getHsmConfigurationIdentifier() {
            return this.hsmConfigurationIdentifier;
        }

        @Override
        public final java.lang.String getHsmIpAddress() {
            return this.hsmIpAddress;
        }

        @Override
        public final java.lang.String getHsmPartitionName() {
            return this.hsmPartitionName;
        }

        @Override
        public final java.lang.String getHsmPartitionPassword() {
            return this.hsmPartitionPassword;
        }

        @Override
        public final java.lang.String getHsmServerPublicCertificate() {
            return this.hsmServerPublicCertificate;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
            return this.tagsAll;
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

            data.set("description", om.valueToTree(this.getDescription()));
            data.set("hsmConfigurationIdentifier", om.valueToTree(this.getHsmConfigurationIdentifier()));
            data.set("hsmIpAddress", om.valueToTree(this.getHsmIpAddress()));
            data.set("hsmPartitionName", om.valueToTree(this.getHsmPartitionName()));
            data.set("hsmPartitionPassword", om.valueToTree(this.getHsmPartitionPassword()));
            data.set("hsmServerPublicCertificate", om.valueToTree(this.getHsmServerPublicCertificate()));
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
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
            struct.set("fqn", om.valueToTree("aws.redshiftHsmConfiguration.RedshiftHsmConfigurationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RedshiftHsmConfigurationConfig.Jsii$Proxy that = (RedshiftHsmConfigurationConfig.Jsii$Proxy) o;

            if (!description.equals(that.description)) return false;
            if (!hsmConfigurationIdentifier.equals(that.hsmConfigurationIdentifier)) return false;
            if (!hsmIpAddress.equals(that.hsmIpAddress)) return false;
            if (!hsmPartitionName.equals(that.hsmPartitionName)) return false;
            if (!hsmPartitionPassword.equals(that.hsmPartitionPassword)) return false;
            if (!hsmServerPublicCertificate.equals(that.hsmServerPublicCertificate)) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
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
            int result = this.description.hashCode();
            result = 31 * result + (this.hsmConfigurationIdentifier.hashCode());
            result = 31 * result + (this.hsmIpAddress.hashCode());
            result = 31 * result + (this.hsmPartitionName.hashCode());
            result = 31 * result + (this.hsmPartitionPassword.hashCode());
            result = 31 * result + (this.hsmServerPublicCertificate.hashCode());
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
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
