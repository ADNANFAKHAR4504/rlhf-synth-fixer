package imports.aws.cloudsearch_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.260Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudsearchDomain.CloudsearchDomainConfig")
@software.amazon.jsii.Jsii.Proxy(CloudsearchDomainConfig.Jsii$Proxy.class)
public interface CloudsearchDomainConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#name CloudsearchDomain#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * endpoint_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#endpoint_options CloudsearchDomain#endpoint_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudsearch_domain.CloudsearchDomainEndpointOptions getEndpointOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#id CloudsearchDomain#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * index_field block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#index_field CloudsearchDomain#index_field}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIndexField() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#multi_az CloudsearchDomain#multi_az}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMultiAz() {
        return null;
    }

    /**
     * scaling_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#scaling_parameters CloudsearchDomain#scaling_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudsearch_domain.CloudsearchDomainScalingParameters getScalingParameters() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#timeouts CloudsearchDomain#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudsearch_domain.CloudsearchDomainTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudsearchDomainConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudsearchDomainConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudsearchDomainConfig> {
        java.lang.String name;
        imports.aws.cloudsearch_domain.CloudsearchDomainEndpointOptions endpointOptions;
        java.lang.String id;
        java.lang.Object indexField;
        java.lang.Object multiAz;
        imports.aws.cloudsearch_domain.CloudsearchDomainScalingParameters scalingParameters;
        imports.aws.cloudsearch_domain.CloudsearchDomainTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link CloudsearchDomainConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#name CloudsearchDomain#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link CloudsearchDomainConfig#getEndpointOptions}
         * @param endpointOptions endpoint_options block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#endpoint_options CloudsearchDomain#endpoint_options}
         * @return {@code this}
         */
        public Builder endpointOptions(imports.aws.cloudsearch_domain.CloudsearchDomainEndpointOptions endpointOptions) {
            this.endpointOptions = endpointOptions;
            return this;
        }

        /**
         * Sets the value of {@link CloudsearchDomainConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#id CloudsearchDomain#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link CloudsearchDomainConfig#getIndexField}
         * @param indexField index_field block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#index_field CloudsearchDomain#index_field}
         * @return {@code this}
         */
        public Builder indexField(com.hashicorp.cdktf.IResolvable indexField) {
            this.indexField = indexField;
            return this;
        }

        /**
         * Sets the value of {@link CloudsearchDomainConfig#getIndexField}
         * @param indexField index_field block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#index_field CloudsearchDomain#index_field}
         * @return {@code this}
         */
        public Builder indexField(java.util.List<? extends imports.aws.cloudsearch_domain.CloudsearchDomainIndexField> indexField) {
            this.indexField = indexField;
            return this;
        }

        /**
         * Sets the value of {@link CloudsearchDomainConfig#getMultiAz}
         * @param multiAz Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#multi_az CloudsearchDomain#multi_az}.
         * @return {@code this}
         */
        public Builder multiAz(java.lang.Boolean multiAz) {
            this.multiAz = multiAz;
            return this;
        }

        /**
         * Sets the value of {@link CloudsearchDomainConfig#getMultiAz}
         * @param multiAz Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#multi_az CloudsearchDomain#multi_az}.
         * @return {@code this}
         */
        public Builder multiAz(com.hashicorp.cdktf.IResolvable multiAz) {
            this.multiAz = multiAz;
            return this;
        }

        /**
         * Sets the value of {@link CloudsearchDomainConfig#getScalingParameters}
         * @param scalingParameters scaling_parameters block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#scaling_parameters CloudsearchDomain#scaling_parameters}
         * @return {@code this}
         */
        public Builder scalingParameters(imports.aws.cloudsearch_domain.CloudsearchDomainScalingParameters scalingParameters) {
            this.scalingParameters = scalingParameters;
            return this;
        }

        /**
         * Sets the value of {@link CloudsearchDomainConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#timeouts CloudsearchDomain#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.cloudsearch_domain.CloudsearchDomainTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link CloudsearchDomainConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CloudsearchDomainConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CloudsearchDomainConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CloudsearchDomainConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CloudsearchDomainConfig#getDependsOn}
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
         * Sets the value of {@link CloudsearchDomainConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link CloudsearchDomainConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link CloudsearchDomainConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link CloudsearchDomainConfig#getProvisioners}
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
         * @return a new instance of {@link CloudsearchDomainConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudsearchDomainConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudsearchDomainConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudsearchDomainConfig {
        private final java.lang.String name;
        private final imports.aws.cloudsearch_domain.CloudsearchDomainEndpointOptions endpointOptions;
        private final java.lang.String id;
        private final java.lang.Object indexField;
        private final java.lang.Object multiAz;
        private final imports.aws.cloudsearch_domain.CloudsearchDomainScalingParameters scalingParameters;
        private final imports.aws.cloudsearch_domain.CloudsearchDomainTimeouts timeouts;
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
            this.endpointOptions = software.amazon.jsii.Kernel.get(this, "endpointOptions", software.amazon.jsii.NativeType.forClass(imports.aws.cloudsearch_domain.CloudsearchDomainEndpointOptions.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.indexField = software.amazon.jsii.Kernel.get(this, "indexField", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.multiAz = software.amazon.jsii.Kernel.get(this, "multiAz", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.scalingParameters = software.amazon.jsii.Kernel.get(this, "scalingParameters", software.amazon.jsii.NativeType.forClass(imports.aws.cloudsearch_domain.CloudsearchDomainScalingParameters.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.cloudsearch_domain.CloudsearchDomainTimeouts.class));
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
            this.endpointOptions = builder.endpointOptions;
            this.id = builder.id;
            this.indexField = builder.indexField;
            this.multiAz = builder.multiAz;
            this.scalingParameters = builder.scalingParameters;
            this.timeouts = builder.timeouts;
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
        public final imports.aws.cloudsearch_domain.CloudsearchDomainEndpointOptions getEndpointOptions() {
            return this.endpointOptions;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getIndexField() {
            return this.indexField;
        }

        @Override
        public final java.lang.Object getMultiAz() {
            return this.multiAz;
        }

        @Override
        public final imports.aws.cloudsearch_domain.CloudsearchDomainScalingParameters getScalingParameters() {
            return this.scalingParameters;
        }

        @Override
        public final imports.aws.cloudsearch_domain.CloudsearchDomainTimeouts getTimeouts() {
            return this.timeouts;
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
            if (this.getEndpointOptions() != null) {
                data.set("endpointOptions", om.valueToTree(this.getEndpointOptions()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIndexField() != null) {
                data.set("indexField", om.valueToTree(this.getIndexField()));
            }
            if (this.getMultiAz() != null) {
                data.set("multiAz", om.valueToTree(this.getMultiAz()));
            }
            if (this.getScalingParameters() != null) {
                data.set("scalingParameters", om.valueToTree(this.getScalingParameters()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
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
            struct.set("fqn", om.valueToTree("aws.cloudsearchDomain.CloudsearchDomainConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudsearchDomainConfig.Jsii$Proxy that = (CloudsearchDomainConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (this.endpointOptions != null ? !this.endpointOptions.equals(that.endpointOptions) : that.endpointOptions != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.indexField != null ? !this.indexField.equals(that.indexField) : that.indexField != null) return false;
            if (this.multiAz != null ? !this.multiAz.equals(that.multiAz) : that.multiAz != null) return false;
            if (this.scalingParameters != null ? !this.scalingParameters.equals(that.scalingParameters) : that.scalingParameters != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
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
            result = 31 * result + (this.endpointOptions != null ? this.endpointOptions.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.indexField != null ? this.indexField.hashCode() : 0);
            result = 31 * result + (this.multiAz != null ? this.multiAz.hashCode() : 0);
            result = 31 * result + (this.scalingParameters != null ? this.scalingParameters.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
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
