package imports.aws.config_conformance_pack;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.376Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.configConformancePack.ConfigConformancePackConfig")
@software.amazon.jsii.Jsii.Proxy(ConfigConformancePackConfig.Jsii$Proxy.class)
public interface ConfigConformancePackConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_conformance_pack#name ConfigConformancePack#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_conformance_pack#delivery_s3_bucket ConfigConformancePack#delivery_s3_bucket}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeliveryS3Bucket() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_conformance_pack#delivery_s3_key_prefix ConfigConformancePack#delivery_s3_key_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeliveryS3KeyPrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_conformance_pack#id ConfigConformancePack#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * input_parameter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_conformance_pack#input_parameter ConfigConformancePack#input_parameter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getInputParameter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_conformance_pack#template_body ConfigConformancePack#template_body}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTemplateBody() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_conformance_pack#template_s3_uri ConfigConformancePack#template_s3_uri}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTemplateS3Uri() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ConfigConformancePackConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ConfigConformancePackConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ConfigConformancePackConfig> {
        java.lang.String name;
        java.lang.String deliveryS3Bucket;
        java.lang.String deliveryS3KeyPrefix;
        java.lang.String id;
        java.lang.Object inputParameter;
        java.lang.String templateBody;
        java.lang.String templateS3Uri;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link ConfigConformancePackConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_conformance_pack#name ConfigConformancePack#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link ConfigConformancePackConfig#getDeliveryS3Bucket}
         * @param deliveryS3Bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_conformance_pack#delivery_s3_bucket ConfigConformancePack#delivery_s3_bucket}.
         * @return {@code this}
         */
        public Builder deliveryS3Bucket(java.lang.String deliveryS3Bucket) {
            this.deliveryS3Bucket = deliveryS3Bucket;
            return this;
        }

        /**
         * Sets the value of {@link ConfigConformancePackConfig#getDeliveryS3KeyPrefix}
         * @param deliveryS3KeyPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_conformance_pack#delivery_s3_key_prefix ConfigConformancePack#delivery_s3_key_prefix}.
         * @return {@code this}
         */
        public Builder deliveryS3KeyPrefix(java.lang.String deliveryS3KeyPrefix) {
            this.deliveryS3KeyPrefix = deliveryS3KeyPrefix;
            return this;
        }

        /**
         * Sets the value of {@link ConfigConformancePackConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_conformance_pack#id ConfigConformancePack#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link ConfigConformancePackConfig#getInputParameter}
         * @param inputParameter input_parameter block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_conformance_pack#input_parameter ConfigConformancePack#input_parameter}
         * @return {@code this}
         */
        public Builder inputParameter(com.hashicorp.cdktf.IResolvable inputParameter) {
            this.inputParameter = inputParameter;
            return this;
        }

        /**
         * Sets the value of {@link ConfigConformancePackConfig#getInputParameter}
         * @param inputParameter input_parameter block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_conformance_pack#input_parameter ConfigConformancePack#input_parameter}
         * @return {@code this}
         */
        public Builder inputParameter(java.util.List<? extends imports.aws.config_conformance_pack.ConfigConformancePackInputParameter> inputParameter) {
            this.inputParameter = inputParameter;
            return this;
        }

        /**
         * Sets the value of {@link ConfigConformancePackConfig#getTemplateBody}
         * @param templateBody Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_conformance_pack#template_body ConfigConformancePack#template_body}.
         * @return {@code this}
         */
        public Builder templateBody(java.lang.String templateBody) {
            this.templateBody = templateBody;
            return this;
        }

        /**
         * Sets the value of {@link ConfigConformancePackConfig#getTemplateS3Uri}
         * @param templateS3Uri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_conformance_pack#template_s3_uri ConfigConformancePack#template_s3_uri}.
         * @return {@code this}
         */
        public Builder templateS3Uri(java.lang.String templateS3Uri) {
            this.templateS3Uri = templateS3Uri;
            return this;
        }

        /**
         * Sets the value of {@link ConfigConformancePackConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ConfigConformancePackConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ConfigConformancePackConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ConfigConformancePackConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ConfigConformancePackConfig#getDependsOn}
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
         * Sets the value of {@link ConfigConformancePackConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link ConfigConformancePackConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link ConfigConformancePackConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link ConfigConformancePackConfig#getProvisioners}
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
         * @return a new instance of {@link ConfigConformancePackConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ConfigConformancePackConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ConfigConformancePackConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ConfigConformancePackConfig {
        private final java.lang.String name;
        private final java.lang.String deliveryS3Bucket;
        private final java.lang.String deliveryS3KeyPrefix;
        private final java.lang.String id;
        private final java.lang.Object inputParameter;
        private final java.lang.String templateBody;
        private final java.lang.String templateS3Uri;
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
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deliveryS3Bucket = software.amazon.jsii.Kernel.get(this, "deliveryS3Bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deliveryS3KeyPrefix = software.amazon.jsii.Kernel.get(this, "deliveryS3KeyPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.inputParameter = software.amazon.jsii.Kernel.get(this, "inputParameter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.templateBody = software.amazon.jsii.Kernel.get(this, "templateBody", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.templateS3Uri = software.amazon.jsii.Kernel.get(this, "templateS3Uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.deliveryS3Bucket = builder.deliveryS3Bucket;
            this.deliveryS3KeyPrefix = builder.deliveryS3KeyPrefix;
            this.id = builder.id;
            this.inputParameter = builder.inputParameter;
            this.templateBody = builder.templateBody;
            this.templateS3Uri = builder.templateS3Uri;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getDeliveryS3Bucket() {
            return this.deliveryS3Bucket;
        }

        @Override
        public final java.lang.String getDeliveryS3KeyPrefix() {
            return this.deliveryS3KeyPrefix;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getInputParameter() {
            return this.inputParameter;
        }

        @Override
        public final java.lang.String getTemplateBody() {
            return this.templateBody;
        }

        @Override
        public final java.lang.String getTemplateS3Uri() {
            return this.templateS3Uri;
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

            data.set("name", om.valueToTree(this.getName()));
            if (this.getDeliveryS3Bucket() != null) {
                data.set("deliveryS3Bucket", om.valueToTree(this.getDeliveryS3Bucket()));
            }
            if (this.getDeliveryS3KeyPrefix() != null) {
                data.set("deliveryS3KeyPrefix", om.valueToTree(this.getDeliveryS3KeyPrefix()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getInputParameter() != null) {
                data.set("inputParameter", om.valueToTree(this.getInputParameter()));
            }
            if (this.getTemplateBody() != null) {
                data.set("templateBody", om.valueToTree(this.getTemplateBody()));
            }
            if (this.getTemplateS3Uri() != null) {
                data.set("templateS3Uri", om.valueToTree(this.getTemplateS3Uri()));
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
            struct.set("fqn", om.valueToTree("aws.configConformancePack.ConfigConformancePackConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ConfigConformancePackConfig.Jsii$Proxy that = (ConfigConformancePackConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (this.deliveryS3Bucket != null ? !this.deliveryS3Bucket.equals(that.deliveryS3Bucket) : that.deliveryS3Bucket != null) return false;
            if (this.deliveryS3KeyPrefix != null ? !this.deliveryS3KeyPrefix.equals(that.deliveryS3KeyPrefix) : that.deliveryS3KeyPrefix != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.inputParameter != null ? !this.inputParameter.equals(that.inputParameter) : that.inputParameter != null) return false;
            if (this.templateBody != null ? !this.templateBody.equals(that.templateBody) : that.templateBody != null) return false;
            if (this.templateS3Uri != null ? !this.templateS3Uri.equals(that.templateS3Uri) : that.templateS3Uri != null) return false;
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
            int result = this.name.hashCode();
            result = 31 * result + (this.deliveryS3Bucket != null ? this.deliveryS3Bucket.hashCode() : 0);
            result = 31 * result + (this.deliveryS3KeyPrefix != null ? this.deliveryS3KeyPrefix.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.inputParameter != null ? this.inputParameter.hashCode() : 0);
            result = 31 * result + (this.templateBody != null ? this.templateBody.hashCode() : 0);
            result = 31 * result + (this.templateS3Uri != null ? this.templateS3Uri.hashCode() : 0);
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
