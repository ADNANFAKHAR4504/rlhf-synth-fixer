package imports.aws.rds_cluster_parameter_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.143Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rdsClusterParameterGroup.RdsClusterParameterGroupParameter")
@software.amazon.jsii.Jsii.Proxy(RdsClusterParameterGroupParameter.Jsii$Proxy.class)
public interface RdsClusterParameterGroupParameter extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_parameter_group#name RdsClusterParameterGroup#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_parameter_group#value RdsClusterParameterGroup#value}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getValue();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_parameter_group#apply_method RdsClusterParameterGroup#apply_method}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getApplyMethod() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RdsClusterParameterGroupParameter}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RdsClusterParameterGroupParameter}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RdsClusterParameterGroupParameter> {
        java.lang.String name;
        java.lang.String value;
        java.lang.String applyMethod;

        /**
         * Sets the value of {@link RdsClusterParameterGroupParameter#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_parameter_group#name RdsClusterParameterGroup#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterParameterGroupParameter#getValue}
         * @param value Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_parameter_group#value RdsClusterParameterGroup#value}. This parameter is required.
         * @return {@code this}
         */
        public Builder value(java.lang.String value) {
            this.value = value;
            return this;
        }

        /**
         * Sets the value of {@link RdsClusterParameterGroupParameter#getApplyMethod}
         * @param applyMethod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rds_cluster_parameter_group#apply_method RdsClusterParameterGroup#apply_method}.
         * @return {@code this}
         */
        public Builder applyMethod(java.lang.String applyMethod) {
            this.applyMethod = applyMethod;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link RdsClusterParameterGroupParameter}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RdsClusterParameterGroupParameter build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RdsClusterParameterGroupParameter}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RdsClusterParameterGroupParameter {
        private final java.lang.String name;
        private final java.lang.String value;
        private final java.lang.String applyMethod;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.value = software.amazon.jsii.Kernel.get(this, "value", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.applyMethod = software.amazon.jsii.Kernel.get(this, "applyMethod", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.value = java.util.Objects.requireNonNull(builder.value, "value is required");
            this.applyMethod = builder.applyMethod;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getValue() {
            return this.value;
        }

        @Override
        public final java.lang.String getApplyMethod() {
            return this.applyMethod;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            data.set("value", om.valueToTree(this.getValue()));
            if (this.getApplyMethod() != null) {
                data.set("applyMethod", om.valueToTree(this.getApplyMethod()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.rdsClusterParameterGroup.RdsClusterParameterGroupParameter"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RdsClusterParameterGroupParameter.Jsii$Proxy that = (RdsClusterParameterGroupParameter.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!value.equals(that.value)) return false;
            return this.applyMethod != null ? this.applyMethod.equals(that.applyMethod) : that.applyMethod == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.value.hashCode());
            result = 31 * result + (this.applyMethod != null ? this.applyMethod.hashCode() : 0);
            return result;
        }
    }
}
