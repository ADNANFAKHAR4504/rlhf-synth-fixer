package imports.aws.cleanrooms_membership;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.216Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cleanroomsMembership.CleanroomsMembershipDefaultResultConfiguration")
@software.amazon.jsii.Jsii.Proxy(CleanroomsMembershipDefaultResultConfiguration.Jsii$Proxy.class)
public interface CleanroomsMembershipDefaultResultConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * output_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_membership#output_configuration CleanroomsMembership#output_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getOutputConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_membership#role_arn CleanroomsMembership#role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoleArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CleanroomsMembershipDefaultResultConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CleanroomsMembershipDefaultResultConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CleanroomsMembershipDefaultResultConfiguration> {
        java.lang.Object outputConfiguration;
        java.lang.String roleArn;

        /**
         * Sets the value of {@link CleanroomsMembershipDefaultResultConfiguration#getOutputConfiguration}
         * @param outputConfiguration output_configuration block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_membership#output_configuration CleanroomsMembership#output_configuration}
         * @return {@code this}
         */
        public Builder outputConfiguration(com.hashicorp.cdktf.IResolvable outputConfiguration) {
            this.outputConfiguration = outputConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link CleanroomsMembershipDefaultResultConfiguration#getOutputConfiguration}
         * @param outputConfiguration output_configuration block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_membership#output_configuration CleanroomsMembership#output_configuration}
         * @return {@code this}
         */
        public Builder outputConfiguration(java.util.List<? extends imports.aws.cleanrooms_membership.CleanroomsMembershipDefaultResultConfigurationOutputConfiguration> outputConfiguration) {
            this.outputConfiguration = outputConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link CleanroomsMembershipDefaultResultConfiguration#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_membership#role_arn CleanroomsMembership#role_arn}.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CleanroomsMembershipDefaultResultConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CleanroomsMembershipDefaultResultConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CleanroomsMembershipDefaultResultConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CleanroomsMembershipDefaultResultConfiguration {
        private final java.lang.Object outputConfiguration;
        private final java.lang.String roleArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.outputConfiguration = software.amazon.jsii.Kernel.get(this, "outputConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.outputConfiguration = builder.outputConfiguration;
            this.roleArn = builder.roleArn;
        }

        @Override
        public final java.lang.Object getOutputConfiguration() {
            return this.outputConfiguration;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getOutputConfiguration() != null) {
                data.set("outputConfiguration", om.valueToTree(this.getOutputConfiguration()));
            }
            if (this.getRoleArn() != null) {
                data.set("roleArn", om.valueToTree(this.getRoleArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cleanroomsMembership.CleanroomsMembershipDefaultResultConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CleanroomsMembershipDefaultResultConfiguration.Jsii$Proxy that = (CleanroomsMembershipDefaultResultConfiguration.Jsii$Proxy) o;

            if (this.outputConfiguration != null ? !this.outputConfiguration.equals(that.outputConfiguration) : that.outputConfiguration != null) return false;
            return this.roleArn != null ? this.roleArn.equals(that.roleArn) : that.roleArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.outputConfiguration != null ? this.outputConfiguration.hashCode() : 0;
            result = 31 * result + (this.roleArn != null ? this.roleArn.hashCode() : 0);
            return result;
        }
    }
}
