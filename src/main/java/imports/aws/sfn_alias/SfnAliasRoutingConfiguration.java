package imports.aws.sfn_alias;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.464Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sfnAlias.SfnAliasRoutingConfiguration")
@software.amazon.jsii.Jsii.Proxy(SfnAliasRoutingConfiguration.Jsii$Proxy.class)
public interface SfnAliasRoutingConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sfn_alias#state_machine_version_arn SfnAlias#state_machine_version_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStateMachineVersionArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sfn_alias#weight SfnAlias#weight}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getWeight();

    /**
     * @return a {@link Builder} of {@link SfnAliasRoutingConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SfnAliasRoutingConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SfnAliasRoutingConfiguration> {
        java.lang.String stateMachineVersionArn;
        java.lang.Number weight;

        /**
         * Sets the value of {@link SfnAliasRoutingConfiguration#getStateMachineVersionArn}
         * @param stateMachineVersionArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sfn_alias#state_machine_version_arn SfnAlias#state_machine_version_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder stateMachineVersionArn(java.lang.String stateMachineVersionArn) {
            this.stateMachineVersionArn = stateMachineVersionArn;
            return this;
        }

        /**
         * Sets the value of {@link SfnAliasRoutingConfiguration#getWeight}
         * @param weight Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sfn_alias#weight SfnAlias#weight}. This parameter is required.
         * @return {@code this}
         */
        public Builder weight(java.lang.Number weight) {
            this.weight = weight;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SfnAliasRoutingConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SfnAliasRoutingConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SfnAliasRoutingConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SfnAliasRoutingConfiguration {
        private final java.lang.String stateMachineVersionArn;
        private final java.lang.Number weight;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.stateMachineVersionArn = software.amazon.jsii.Kernel.get(this, "stateMachineVersionArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.weight = software.amazon.jsii.Kernel.get(this, "weight", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.stateMachineVersionArn = java.util.Objects.requireNonNull(builder.stateMachineVersionArn, "stateMachineVersionArn is required");
            this.weight = java.util.Objects.requireNonNull(builder.weight, "weight is required");
        }

        @Override
        public final java.lang.String getStateMachineVersionArn() {
            return this.stateMachineVersionArn;
        }

        @Override
        public final java.lang.Number getWeight() {
            return this.weight;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("stateMachineVersionArn", om.valueToTree(this.getStateMachineVersionArn()));
            data.set("weight", om.valueToTree(this.getWeight()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sfnAlias.SfnAliasRoutingConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SfnAliasRoutingConfiguration.Jsii$Proxy that = (SfnAliasRoutingConfiguration.Jsii$Proxy) o;

            if (!stateMachineVersionArn.equals(that.stateMachineVersionArn)) return false;
            return this.weight.equals(that.weight);
        }

        @Override
        public final int hashCode() {
            int result = this.stateMachineVersionArn.hashCode();
            result = 31 * result + (this.weight.hashCode());
            return result;
        }
    }
}
