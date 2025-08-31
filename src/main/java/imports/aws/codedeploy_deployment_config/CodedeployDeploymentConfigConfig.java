package imports.aws.codedeploy_deployment_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.318Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codedeployDeploymentConfig.CodedeployDeploymentConfigConfig")
@software.amazon.jsii.Jsii.Proxy(CodedeployDeploymentConfigConfig.Jsii$Proxy.class)
public interface CodedeployDeploymentConfigConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#deployment_config_name CodedeployDeploymentConfig#deployment_config_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDeploymentConfigName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#compute_platform CodedeployDeploymentConfig#compute_platform}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getComputePlatform() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#id CodedeployDeploymentConfig#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * minimum_healthy_hosts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#minimum_healthy_hosts CodedeployDeploymentConfig#minimum_healthy_hosts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigMinimumHealthyHosts getMinimumHealthyHosts() {
        return null;
    }

    /**
     * traffic_routing_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#traffic_routing_config CodedeployDeploymentConfig#traffic_routing_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigTrafficRoutingConfig getTrafficRoutingConfig() {
        return null;
    }

    /**
     * zonal_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#zonal_config CodedeployDeploymentConfig#zonal_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigZonalConfig getZonalConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodedeployDeploymentConfigConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodedeployDeploymentConfigConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodedeployDeploymentConfigConfig> {
        java.lang.String deploymentConfigName;
        java.lang.String computePlatform;
        java.lang.String id;
        imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigMinimumHealthyHosts minimumHealthyHosts;
        imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigTrafficRoutingConfig trafficRoutingConfig;
        imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigZonalConfig zonalConfig;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link CodedeployDeploymentConfigConfig#getDeploymentConfigName}
         * @param deploymentConfigName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#deployment_config_name CodedeployDeploymentConfig#deployment_config_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder deploymentConfigName(java.lang.String deploymentConfigName) {
            this.deploymentConfigName = deploymentConfigName;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentConfigConfig#getComputePlatform}
         * @param computePlatform Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#compute_platform CodedeployDeploymentConfig#compute_platform}.
         * @return {@code this}
         */
        public Builder computePlatform(java.lang.String computePlatform) {
            this.computePlatform = computePlatform;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentConfigConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#id CodedeployDeploymentConfig#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentConfigConfig#getMinimumHealthyHosts}
         * @param minimumHealthyHosts minimum_healthy_hosts block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#minimum_healthy_hosts CodedeployDeploymentConfig#minimum_healthy_hosts}
         * @return {@code this}
         */
        public Builder minimumHealthyHosts(imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigMinimumHealthyHosts minimumHealthyHosts) {
            this.minimumHealthyHosts = minimumHealthyHosts;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentConfigConfig#getTrafficRoutingConfig}
         * @param trafficRoutingConfig traffic_routing_config block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#traffic_routing_config CodedeployDeploymentConfig#traffic_routing_config}
         * @return {@code this}
         */
        public Builder trafficRoutingConfig(imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigTrafficRoutingConfig trafficRoutingConfig) {
            this.trafficRoutingConfig = trafficRoutingConfig;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentConfigConfig#getZonalConfig}
         * @param zonalConfig zonal_config block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#zonal_config CodedeployDeploymentConfig#zonal_config}
         * @return {@code this}
         */
        public Builder zonalConfig(imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigZonalConfig zonalConfig) {
            this.zonalConfig = zonalConfig;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentConfigConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentConfigConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentConfigConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentConfigConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentConfigConfig#getDependsOn}
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
         * Sets the value of {@link CodedeployDeploymentConfigConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentConfigConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentConfigConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentConfigConfig#getProvisioners}
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
         * @return a new instance of {@link CodedeployDeploymentConfigConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodedeployDeploymentConfigConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodedeployDeploymentConfigConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodedeployDeploymentConfigConfig {
        private final java.lang.String deploymentConfigName;
        private final java.lang.String computePlatform;
        private final java.lang.String id;
        private final imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigMinimumHealthyHosts minimumHealthyHosts;
        private final imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigTrafficRoutingConfig trafficRoutingConfig;
        private final imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigZonalConfig zonalConfig;
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
            this.deploymentConfigName = software.amazon.jsii.Kernel.get(this, "deploymentConfigName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.computePlatform = software.amazon.jsii.Kernel.get(this, "computePlatform", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.minimumHealthyHosts = software.amazon.jsii.Kernel.get(this, "minimumHealthyHosts", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigMinimumHealthyHosts.class));
            this.trafficRoutingConfig = software.amazon.jsii.Kernel.get(this, "trafficRoutingConfig", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigTrafficRoutingConfig.class));
            this.zonalConfig = software.amazon.jsii.Kernel.get(this, "zonalConfig", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigZonalConfig.class));
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
            this.deploymentConfigName = java.util.Objects.requireNonNull(builder.deploymentConfigName, "deploymentConfigName is required");
            this.computePlatform = builder.computePlatform;
            this.id = builder.id;
            this.minimumHealthyHosts = builder.minimumHealthyHosts;
            this.trafficRoutingConfig = builder.trafficRoutingConfig;
            this.zonalConfig = builder.zonalConfig;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getDeploymentConfigName() {
            return this.deploymentConfigName;
        }

        @Override
        public final java.lang.String getComputePlatform() {
            return this.computePlatform;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigMinimumHealthyHosts getMinimumHealthyHosts() {
            return this.minimumHealthyHosts;
        }

        @Override
        public final imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigTrafficRoutingConfig getTrafficRoutingConfig() {
            return this.trafficRoutingConfig;
        }

        @Override
        public final imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigZonalConfig getZonalConfig() {
            return this.zonalConfig;
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

            data.set("deploymentConfigName", om.valueToTree(this.getDeploymentConfigName()));
            if (this.getComputePlatform() != null) {
                data.set("computePlatform", om.valueToTree(this.getComputePlatform()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getMinimumHealthyHosts() != null) {
                data.set("minimumHealthyHosts", om.valueToTree(this.getMinimumHealthyHosts()));
            }
            if (this.getTrafficRoutingConfig() != null) {
                data.set("trafficRoutingConfig", om.valueToTree(this.getTrafficRoutingConfig()));
            }
            if (this.getZonalConfig() != null) {
                data.set("zonalConfig", om.valueToTree(this.getZonalConfig()));
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
            struct.set("fqn", om.valueToTree("aws.codedeployDeploymentConfig.CodedeployDeploymentConfigConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodedeployDeploymentConfigConfig.Jsii$Proxy that = (CodedeployDeploymentConfigConfig.Jsii$Proxy) o;

            if (!deploymentConfigName.equals(that.deploymentConfigName)) return false;
            if (this.computePlatform != null ? !this.computePlatform.equals(that.computePlatform) : that.computePlatform != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.minimumHealthyHosts != null ? !this.minimumHealthyHosts.equals(that.minimumHealthyHosts) : that.minimumHealthyHosts != null) return false;
            if (this.trafficRoutingConfig != null ? !this.trafficRoutingConfig.equals(that.trafficRoutingConfig) : that.trafficRoutingConfig != null) return false;
            if (this.zonalConfig != null ? !this.zonalConfig.equals(that.zonalConfig) : that.zonalConfig != null) return false;
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
            int result = this.deploymentConfigName.hashCode();
            result = 31 * result + (this.computePlatform != null ? this.computePlatform.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.minimumHealthyHosts != null ? this.minimumHealthyHosts.hashCode() : 0);
            result = 31 * result + (this.trafficRoutingConfig != null ? this.trafficRoutingConfig.hashCode() : 0);
            result = 31 * result + (this.zonalConfig != null ? this.zonalConfig.hashCode() : 0);
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
