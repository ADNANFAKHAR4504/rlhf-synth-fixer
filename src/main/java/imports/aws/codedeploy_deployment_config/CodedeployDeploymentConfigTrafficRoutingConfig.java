package imports.aws.codedeploy_deployment_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.318Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codedeployDeploymentConfig.CodedeployDeploymentConfigTrafficRoutingConfig")
@software.amazon.jsii.Jsii.Proxy(CodedeployDeploymentConfigTrafficRoutingConfig.Jsii$Proxy.class)
public interface CodedeployDeploymentConfigTrafficRoutingConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * time_based_canary block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#time_based_canary CodedeployDeploymentConfig#time_based_canary}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedCanary getTimeBasedCanary() {
        return null;
    }

    /**
     * time_based_linear block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#time_based_linear CodedeployDeploymentConfig#time_based_linear}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinear getTimeBasedLinear() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#type CodedeployDeploymentConfig#type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodedeployDeploymentConfigTrafficRoutingConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodedeployDeploymentConfigTrafficRoutingConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodedeployDeploymentConfigTrafficRoutingConfig> {
        imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedCanary timeBasedCanary;
        imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinear timeBasedLinear;
        java.lang.String type;

        /**
         * Sets the value of {@link CodedeployDeploymentConfigTrafficRoutingConfig#getTimeBasedCanary}
         * @param timeBasedCanary time_based_canary block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#time_based_canary CodedeployDeploymentConfig#time_based_canary}
         * @return {@code this}
         */
        public Builder timeBasedCanary(imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedCanary timeBasedCanary) {
            this.timeBasedCanary = timeBasedCanary;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentConfigTrafficRoutingConfig#getTimeBasedLinear}
         * @param timeBasedLinear time_based_linear block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#time_based_linear CodedeployDeploymentConfig#time_based_linear}
         * @return {@code this}
         */
        public Builder timeBasedLinear(imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinear timeBasedLinear) {
            this.timeBasedLinear = timeBasedLinear;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentConfigTrafficRoutingConfig#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#type CodedeployDeploymentConfig#type}.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodedeployDeploymentConfigTrafficRoutingConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodedeployDeploymentConfigTrafficRoutingConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodedeployDeploymentConfigTrafficRoutingConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodedeployDeploymentConfigTrafficRoutingConfig {
        private final imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedCanary timeBasedCanary;
        private final imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinear timeBasedLinear;
        private final java.lang.String type;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.timeBasedCanary = software.amazon.jsii.Kernel.get(this, "timeBasedCanary", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedCanary.class));
            this.timeBasedLinear = software.amazon.jsii.Kernel.get(this, "timeBasedLinear", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinear.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.timeBasedCanary = builder.timeBasedCanary;
            this.timeBasedLinear = builder.timeBasedLinear;
            this.type = builder.type;
        }

        @Override
        public final imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedCanary getTimeBasedCanary() {
            return this.timeBasedCanary;
        }

        @Override
        public final imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigTrafficRoutingConfigTimeBasedLinear getTimeBasedLinear() {
            return this.timeBasedLinear;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getTimeBasedCanary() != null) {
                data.set("timeBasedCanary", om.valueToTree(this.getTimeBasedCanary()));
            }
            if (this.getTimeBasedLinear() != null) {
                data.set("timeBasedLinear", om.valueToTree(this.getTimeBasedLinear()));
            }
            if (this.getType() != null) {
                data.set("type", om.valueToTree(this.getType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codedeployDeploymentConfig.CodedeployDeploymentConfigTrafficRoutingConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodedeployDeploymentConfigTrafficRoutingConfig.Jsii$Proxy that = (CodedeployDeploymentConfigTrafficRoutingConfig.Jsii$Proxy) o;

            if (this.timeBasedCanary != null ? !this.timeBasedCanary.equals(that.timeBasedCanary) : that.timeBasedCanary != null) return false;
            if (this.timeBasedLinear != null ? !this.timeBasedLinear.equals(that.timeBasedLinear) : that.timeBasedLinear != null) return false;
            return this.type != null ? this.type.equals(that.type) : that.type == null;
        }

        @Override
        public final int hashCode() {
            int result = this.timeBasedCanary != null ? this.timeBasedCanary.hashCode() : 0;
            result = 31 * result + (this.timeBasedLinear != null ? this.timeBasedLinear.hashCode() : 0);
            result = 31 * result + (this.type != null ? this.type.hashCode() : 0);
            return result;
        }
    }
}
