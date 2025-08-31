package imports.aws.data_aws_iam_principal_policy_simulation;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.674Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsIamPrincipalPolicySimulation.DataAwsIamPrincipalPolicySimulationContext")
@software.amazon.jsii.Jsii.Proxy(DataAwsIamPrincipalPolicySimulationContext.Jsii$Proxy.class)
public interface DataAwsIamPrincipalPolicySimulationContext extends software.amazon.jsii.JsiiSerializable {

    /**
     * The key name of the context entry, such as "aws:CurrentTime".
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#key DataAwsIamPrincipalPolicySimulation#key}
     */
    @org.jetbrains.annotations.NotNull java.lang.String getKey();

    /**
     * The type that the simulator should use to interpret the strings given in argument "values".
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#type DataAwsIamPrincipalPolicySimulation#type}
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * One or more values to assign to the context key, given as a string in a syntax appropriate for the selected value type.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#values DataAwsIamPrincipalPolicySimulation#values}
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getValues();

    /**
     * @return a {@link Builder} of {@link DataAwsIamPrincipalPolicySimulationContext}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsIamPrincipalPolicySimulationContext}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsIamPrincipalPolicySimulationContext> {
        java.lang.String key;
        java.lang.String type;
        java.util.List<java.lang.String> values;

        /**
         * Sets the value of {@link DataAwsIamPrincipalPolicySimulationContext#getKey}
         * @param key The key name of the context entry, such as "aws:CurrentTime". This parameter is required.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#key DataAwsIamPrincipalPolicySimulation#key}
         * @return {@code this}
         */
        public Builder key(java.lang.String key) {
            this.key = key;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPrincipalPolicySimulationContext#getType}
         * @param type The type that the simulator should use to interpret the strings given in argument "values". This parameter is required.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#type DataAwsIamPrincipalPolicySimulation#type}
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPrincipalPolicySimulationContext#getValues}
         * @param values One or more values to assign to the context key, given as a string in a syntax appropriate for the selected value type. This parameter is required.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_principal_policy_simulation#values DataAwsIamPrincipalPolicySimulation#values}
         * @return {@code this}
         */
        public Builder values(java.util.List<java.lang.String> values) {
            this.values = values;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsIamPrincipalPolicySimulationContext}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsIamPrincipalPolicySimulationContext build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsIamPrincipalPolicySimulationContext}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsIamPrincipalPolicySimulationContext {
        private final java.lang.String key;
        private final java.lang.String type;
        private final java.util.List<java.lang.String> values;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.key = software.amazon.jsii.Kernel.get(this, "key", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.values = software.amazon.jsii.Kernel.get(this, "values", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.key = java.util.Objects.requireNonNull(builder.key, "key is required");
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.values = java.util.Objects.requireNonNull(builder.values, "values is required");
        }

        @Override
        public final java.lang.String getKey() {
            return this.key;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.util.List<java.lang.String> getValues() {
            return this.values;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("key", om.valueToTree(this.getKey()));
            data.set("type", om.valueToTree(this.getType()));
            data.set("values", om.valueToTree(this.getValues()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsIamPrincipalPolicySimulation.DataAwsIamPrincipalPolicySimulationContext"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsIamPrincipalPolicySimulationContext.Jsii$Proxy that = (DataAwsIamPrincipalPolicySimulationContext.Jsii$Proxy) o;

            if (!key.equals(that.key)) return false;
            if (!type.equals(that.type)) return false;
            return this.values.equals(that.values);
        }

        @Override
        public final int hashCode() {
            int result = this.key.hashCode();
            result = 31 * result + (this.type.hashCode());
            result = 31 * result + (this.values.hashCode());
            return result;
        }
    }
}
