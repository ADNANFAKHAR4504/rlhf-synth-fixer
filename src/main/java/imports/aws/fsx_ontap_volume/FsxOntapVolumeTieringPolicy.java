package imports.aws.fsx_ontap_volume;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.254Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxOntapVolume.FsxOntapVolumeTieringPolicy")
@software.amazon.jsii.Jsii.Proxy(FsxOntapVolumeTieringPolicy.Jsii$Proxy.class)
public interface FsxOntapVolumeTieringPolicy extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#cooling_period FsxOntapVolume#cooling_period}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getCoolingPeriod() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#name FsxOntapVolume#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FsxOntapVolumeTieringPolicy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FsxOntapVolumeTieringPolicy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FsxOntapVolumeTieringPolicy> {
        java.lang.Number coolingPeriod;
        java.lang.String name;

        /**
         * Sets the value of {@link FsxOntapVolumeTieringPolicy#getCoolingPeriod}
         * @param coolingPeriod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#cooling_period FsxOntapVolume#cooling_period}.
         * @return {@code this}
         */
        public Builder coolingPeriod(java.lang.Number coolingPeriod) {
            this.coolingPeriod = coolingPeriod;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeTieringPolicy#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#name FsxOntapVolume#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FsxOntapVolumeTieringPolicy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FsxOntapVolumeTieringPolicy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FsxOntapVolumeTieringPolicy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FsxOntapVolumeTieringPolicy {
        private final java.lang.Number coolingPeriod;
        private final java.lang.String name;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.coolingPeriod = software.amazon.jsii.Kernel.get(this, "coolingPeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.coolingPeriod = builder.coolingPeriod;
            this.name = builder.name;
        }

        @Override
        public final java.lang.Number getCoolingPeriod() {
            return this.coolingPeriod;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCoolingPeriod() != null) {
                data.set("coolingPeriod", om.valueToTree(this.getCoolingPeriod()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fsxOntapVolume.FsxOntapVolumeTieringPolicy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FsxOntapVolumeTieringPolicy.Jsii$Proxy that = (FsxOntapVolumeTieringPolicy.Jsii$Proxy) o;

            if (this.coolingPeriod != null ? !this.coolingPeriod.equals(that.coolingPeriod) : that.coolingPeriod != null) return false;
            return this.name != null ? this.name.equals(that.name) : that.name == null;
        }

        @Override
        public final int hashCode() {
            int result = this.coolingPeriod != null ? this.coolingPeriod.hashCode() : 0;
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            return result;
        }
    }
}
