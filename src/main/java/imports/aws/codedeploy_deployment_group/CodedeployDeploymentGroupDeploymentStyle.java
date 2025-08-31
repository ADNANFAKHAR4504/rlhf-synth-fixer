package imports.aws.codedeploy_deployment_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.320Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codedeployDeploymentGroup.CodedeployDeploymentGroupDeploymentStyle")
@software.amazon.jsii.Jsii.Proxy(CodedeployDeploymentGroupDeploymentStyle.Jsii$Proxy.class)
public interface CodedeployDeploymentGroupDeploymentStyle extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#deployment_option CodedeployDeploymentGroup#deployment_option}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeploymentOption() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#deployment_type CodedeployDeploymentGroup#deployment_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeploymentType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodedeployDeploymentGroupDeploymentStyle}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodedeployDeploymentGroupDeploymentStyle}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodedeployDeploymentGroupDeploymentStyle> {
        java.lang.String deploymentOption;
        java.lang.String deploymentType;

        /**
         * Sets the value of {@link CodedeployDeploymentGroupDeploymentStyle#getDeploymentOption}
         * @param deploymentOption Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#deployment_option CodedeployDeploymentGroup#deployment_option}.
         * @return {@code this}
         */
        public Builder deploymentOption(java.lang.String deploymentOption) {
            this.deploymentOption = deploymentOption;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupDeploymentStyle#getDeploymentType}
         * @param deploymentType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#deployment_type CodedeployDeploymentGroup#deployment_type}.
         * @return {@code this}
         */
        public Builder deploymentType(java.lang.String deploymentType) {
            this.deploymentType = deploymentType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodedeployDeploymentGroupDeploymentStyle}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodedeployDeploymentGroupDeploymentStyle build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodedeployDeploymentGroupDeploymentStyle}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodedeployDeploymentGroupDeploymentStyle {
        private final java.lang.String deploymentOption;
        private final java.lang.String deploymentType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.deploymentOption = software.amazon.jsii.Kernel.get(this, "deploymentOption", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deploymentType = software.amazon.jsii.Kernel.get(this, "deploymentType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.deploymentOption = builder.deploymentOption;
            this.deploymentType = builder.deploymentType;
        }

        @Override
        public final java.lang.String getDeploymentOption() {
            return this.deploymentOption;
        }

        @Override
        public final java.lang.String getDeploymentType() {
            return this.deploymentType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDeploymentOption() != null) {
                data.set("deploymentOption", om.valueToTree(this.getDeploymentOption()));
            }
            if (this.getDeploymentType() != null) {
                data.set("deploymentType", om.valueToTree(this.getDeploymentType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codedeployDeploymentGroup.CodedeployDeploymentGroupDeploymentStyle"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodedeployDeploymentGroupDeploymentStyle.Jsii$Proxy that = (CodedeployDeploymentGroupDeploymentStyle.Jsii$Proxy) o;

            if (this.deploymentOption != null ? !this.deploymentOption.equals(that.deploymentOption) : that.deploymentOption != null) return false;
            return this.deploymentType != null ? this.deploymentType.equals(that.deploymentType) : that.deploymentType == null;
        }

        @Override
        public final int hashCode() {
            int result = this.deploymentOption != null ? this.deploymentOption.hashCode() : 0;
            result = 31 * result + (this.deploymentType != null ? this.deploymentType.hashCode() : 0);
            return result;
        }
    }
}
