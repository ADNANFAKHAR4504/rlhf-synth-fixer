package imports.aws.msk_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.910Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskCluster.MskClusterConfigurationInfo")
@software.amazon.jsii.Jsii.Proxy(MskClusterConfigurationInfo.Jsii$Proxy.class)
public interface MskClusterConfigurationInfo extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#arn MskCluster#arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#revision MskCluster#revision}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getRevision();

    /**
     * @return a {@link Builder} of {@link MskClusterConfigurationInfo}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MskClusterConfigurationInfo}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MskClusterConfigurationInfo> {
        java.lang.String arn;
        java.lang.Number revision;

        /**
         * Sets the value of {@link MskClusterConfigurationInfo#getArn}
         * @param arn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#arn MskCluster#arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder arn(java.lang.String arn) {
            this.arn = arn;
            return this;
        }

        /**
         * Sets the value of {@link MskClusterConfigurationInfo#getRevision}
         * @param revision Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#revision MskCluster#revision}. This parameter is required.
         * @return {@code this}
         */
        public Builder revision(java.lang.Number revision) {
            this.revision = revision;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MskClusterConfigurationInfo}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MskClusterConfigurationInfo build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MskClusterConfigurationInfo}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MskClusterConfigurationInfo {
        private final java.lang.String arn;
        private final java.lang.Number revision;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.arn = software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.revision = software.amazon.jsii.Kernel.get(this, "revision", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.arn = java.util.Objects.requireNonNull(builder.arn, "arn is required");
            this.revision = java.util.Objects.requireNonNull(builder.revision, "revision is required");
        }

        @Override
        public final java.lang.String getArn() {
            return this.arn;
        }

        @Override
        public final java.lang.Number getRevision() {
            return this.revision;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("arn", om.valueToTree(this.getArn()));
            data.set("revision", om.valueToTree(this.getRevision()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.mskCluster.MskClusterConfigurationInfo"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MskClusterConfigurationInfo.Jsii$Proxy that = (MskClusterConfigurationInfo.Jsii$Proxy) o;

            if (!arn.equals(that.arn)) return false;
            return this.revision.equals(that.revision);
        }

        @Override
        public final int hashCode() {
            int result = this.arn.hashCode();
            result = 31 * result + (this.revision.hashCode());
            return result;
        }
    }
}
