package imports.aws.codedeploy_deployment_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.320Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codedeployDeploymentGroup.CodedeployDeploymentGroupBlueGreenDeploymentConfigGreenFleetProvisioningOption")
@software.amazon.jsii.Jsii.Proxy(CodedeployDeploymentGroupBlueGreenDeploymentConfigGreenFleetProvisioningOption.Jsii$Proxy.class)
public interface CodedeployDeploymentGroupBlueGreenDeploymentConfigGreenFleetProvisioningOption extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#action CodedeployDeploymentGroup#action}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAction() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodedeployDeploymentGroupBlueGreenDeploymentConfigGreenFleetProvisioningOption}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodedeployDeploymentGroupBlueGreenDeploymentConfigGreenFleetProvisioningOption}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodedeployDeploymentGroupBlueGreenDeploymentConfigGreenFleetProvisioningOption> {
        java.lang.String action;

        /**
         * Sets the value of {@link CodedeployDeploymentGroupBlueGreenDeploymentConfigGreenFleetProvisioningOption#getAction}
         * @param action Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#action CodedeployDeploymentGroup#action}.
         * @return {@code this}
         */
        public Builder action(java.lang.String action) {
            this.action = action;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodedeployDeploymentGroupBlueGreenDeploymentConfigGreenFleetProvisioningOption}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodedeployDeploymentGroupBlueGreenDeploymentConfigGreenFleetProvisioningOption build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodedeployDeploymentGroupBlueGreenDeploymentConfigGreenFleetProvisioningOption}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodedeployDeploymentGroupBlueGreenDeploymentConfigGreenFleetProvisioningOption {
        private final java.lang.String action;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.action = software.amazon.jsii.Kernel.get(this, "action", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.action = builder.action;
        }

        @Override
        public final java.lang.String getAction() {
            return this.action;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAction() != null) {
                data.set("action", om.valueToTree(this.getAction()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codedeployDeploymentGroup.CodedeployDeploymentGroupBlueGreenDeploymentConfigGreenFleetProvisioningOption"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodedeployDeploymentGroupBlueGreenDeploymentConfigGreenFleetProvisioningOption.Jsii$Proxy that = (CodedeployDeploymentGroupBlueGreenDeploymentConfigGreenFleetProvisioningOption.Jsii$Proxy) o;

            return this.action != null ? this.action.equals(that.action) : that.action == null;
        }

        @Override
        public final int hashCode() {
            int result = this.action != null ? this.action.hashCode() : 0;
            return result;
        }
    }
}
