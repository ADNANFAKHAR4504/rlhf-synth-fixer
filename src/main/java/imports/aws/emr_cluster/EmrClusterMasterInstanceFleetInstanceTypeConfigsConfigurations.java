package imports.aws.emr_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.198Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrCluster.EmrClusterMasterInstanceFleetInstanceTypeConfigsConfigurations")
@software.amazon.jsii.Jsii.Proxy(EmrClusterMasterInstanceFleetInstanceTypeConfigsConfigurations.Jsii$Proxy.class)
public interface EmrClusterMasterInstanceFleetInstanceTypeConfigsConfigurations extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#classification EmrCluster#classification}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getClassification() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#properties EmrCluster#properties}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getProperties() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EmrClusterMasterInstanceFleetInstanceTypeConfigsConfigurations}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EmrClusterMasterInstanceFleetInstanceTypeConfigsConfigurations}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EmrClusterMasterInstanceFleetInstanceTypeConfigsConfigurations> {
        java.lang.String classification;
        java.util.Map<java.lang.String, java.lang.String> properties;

        /**
         * Sets the value of {@link EmrClusterMasterInstanceFleetInstanceTypeConfigsConfigurations#getClassification}
         * @param classification Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#classification EmrCluster#classification}.
         * @return {@code this}
         */
        public Builder classification(java.lang.String classification) {
            this.classification = classification;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterMasterInstanceFleetInstanceTypeConfigsConfigurations#getProperties}
         * @param properties Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#properties EmrCluster#properties}.
         * @return {@code this}
         */
        public Builder properties(java.util.Map<java.lang.String, java.lang.String> properties) {
            this.properties = properties;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EmrClusterMasterInstanceFleetInstanceTypeConfigsConfigurations}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EmrClusterMasterInstanceFleetInstanceTypeConfigsConfigurations build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EmrClusterMasterInstanceFleetInstanceTypeConfigsConfigurations}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EmrClusterMasterInstanceFleetInstanceTypeConfigsConfigurations {
        private final java.lang.String classification;
        private final java.util.Map<java.lang.String, java.lang.String> properties;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.classification = software.amazon.jsii.Kernel.get(this, "classification", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.properties = software.amazon.jsii.Kernel.get(this, "properties", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.classification = builder.classification;
            this.properties = builder.properties;
        }

        @Override
        public final java.lang.String getClassification() {
            return this.classification;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getProperties() {
            return this.properties;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getClassification() != null) {
                data.set("classification", om.valueToTree(this.getClassification()));
            }
            if (this.getProperties() != null) {
                data.set("properties", om.valueToTree(this.getProperties()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.emrCluster.EmrClusterMasterInstanceFleetInstanceTypeConfigsConfigurations"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EmrClusterMasterInstanceFleetInstanceTypeConfigsConfigurations.Jsii$Proxy that = (EmrClusterMasterInstanceFleetInstanceTypeConfigsConfigurations.Jsii$Proxy) o;

            if (this.classification != null ? !this.classification.equals(that.classification) : that.classification != null) return false;
            return this.properties != null ? this.properties.equals(that.properties) : that.properties == null;
        }

        @Override
        public final int hashCode() {
            int result = this.classification != null ? this.classification.hashCode() : 0;
            result = 31 * result + (this.properties != null ? this.properties.hashCode() : 0);
            return result;
        }
    }
}
