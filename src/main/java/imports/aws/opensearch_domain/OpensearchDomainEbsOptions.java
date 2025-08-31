package imports.aws.opensearch_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.990Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opensearchDomain.OpensearchDomainEbsOptions")
@software.amazon.jsii.Jsii.Proxy(OpensearchDomainEbsOptions.Jsii$Proxy.class)
public interface OpensearchDomainEbsOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#ebs_enabled OpensearchDomain#ebs_enabled}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getEbsEnabled();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#iops OpensearchDomain#iops}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIops() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#throughput OpensearchDomain#throughput}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getThroughput() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#volume_size OpensearchDomain#volume_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getVolumeSize() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#volume_type OpensearchDomain#volume_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVolumeType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link OpensearchDomainEbsOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link OpensearchDomainEbsOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<OpensearchDomainEbsOptions> {
        java.lang.Object ebsEnabled;
        java.lang.Number iops;
        java.lang.Number throughput;
        java.lang.Number volumeSize;
        java.lang.String volumeType;

        /**
         * Sets the value of {@link OpensearchDomainEbsOptions#getEbsEnabled}
         * @param ebsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#ebs_enabled OpensearchDomain#ebs_enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder ebsEnabled(java.lang.Boolean ebsEnabled) {
            this.ebsEnabled = ebsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchDomainEbsOptions#getEbsEnabled}
         * @param ebsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#ebs_enabled OpensearchDomain#ebs_enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder ebsEnabled(com.hashicorp.cdktf.IResolvable ebsEnabled) {
            this.ebsEnabled = ebsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchDomainEbsOptions#getIops}
         * @param iops Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#iops OpensearchDomain#iops}.
         * @return {@code this}
         */
        public Builder iops(java.lang.Number iops) {
            this.iops = iops;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchDomainEbsOptions#getThroughput}
         * @param throughput Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#throughput OpensearchDomain#throughput}.
         * @return {@code this}
         */
        public Builder throughput(java.lang.Number throughput) {
            this.throughput = throughput;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchDomainEbsOptions#getVolumeSize}
         * @param volumeSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#volume_size OpensearchDomain#volume_size}.
         * @return {@code this}
         */
        public Builder volumeSize(java.lang.Number volumeSize) {
            this.volumeSize = volumeSize;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchDomainEbsOptions#getVolumeType}
         * @param volumeType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#volume_type OpensearchDomain#volume_type}.
         * @return {@code this}
         */
        public Builder volumeType(java.lang.String volumeType) {
            this.volumeType = volumeType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link OpensearchDomainEbsOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public OpensearchDomainEbsOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link OpensearchDomainEbsOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements OpensearchDomainEbsOptions {
        private final java.lang.Object ebsEnabled;
        private final java.lang.Number iops;
        private final java.lang.Number throughput;
        private final java.lang.Number volumeSize;
        private final java.lang.String volumeType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.ebsEnabled = software.amazon.jsii.Kernel.get(this, "ebsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.iops = software.amazon.jsii.Kernel.get(this, "iops", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.throughput = software.amazon.jsii.Kernel.get(this, "throughput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.volumeSize = software.amazon.jsii.Kernel.get(this, "volumeSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.volumeType = software.amazon.jsii.Kernel.get(this, "volumeType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.ebsEnabled = java.util.Objects.requireNonNull(builder.ebsEnabled, "ebsEnabled is required");
            this.iops = builder.iops;
            this.throughput = builder.throughput;
            this.volumeSize = builder.volumeSize;
            this.volumeType = builder.volumeType;
        }

        @Override
        public final java.lang.Object getEbsEnabled() {
            return this.ebsEnabled;
        }

        @Override
        public final java.lang.Number getIops() {
            return this.iops;
        }

        @Override
        public final java.lang.Number getThroughput() {
            return this.throughput;
        }

        @Override
        public final java.lang.Number getVolumeSize() {
            return this.volumeSize;
        }

        @Override
        public final java.lang.String getVolumeType() {
            return this.volumeType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("ebsEnabled", om.valueToTree(this.getEbsEnabled()));
            if (this.getIops() != null) {
                data.set("iops", om.valueToTree(this.getIops()));
            }
            if (this.getThroughput() != null) {
                data.set("throughput", om.valueToTree(this.getThroughput()));
            }
            if (this.getVolumeSize() != null) {
                data.set("volumeSize", om.valueToTree(this.getVolumeSize()));
            }
            if (this.getVolumeType() != null) {
                data.set("volumeType", om.valueToTree(this.getVolumeType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.opensearchDomain.OpensearchDomainEbsOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            OpensearchDomainEbsOptions.Jsii$Proxy that = (OpensearchDomainEbsOptions.Jsii$Proxy) o;

            if (!ebsEnabled.equals(that.ebsEnabled)) return false;
            if (this.iops != null ? !this.iops.equals(that.iops) : that.iops != null) return false;
            if (this.throughput != null ? !this.throughput.equals(that.throughput) : that.throughput != null) return false;
            if (this.volumeSize != null ? !this.volumeSize.equals(that.volumeSize) : that.volumeSize != null) return false;
            return this.volumeType != null ? this.volumeType.equals(that.volumeType) : that.volumeType == null;
        }

        @Override
        public final int hashCode() {
            int result = this.ebsEnabled.hashCode();
            result = 31 * result + (this.iops != null ? this.iops.hashCode() : 0);
            result = 31 * result + (this.throughput != null ? this.throughput.hashCode() : 0);
            result = 31 * result + (this.volumeSize != null ? this.volumeSize.hashCode() : 0);
            result = 31 * result + (this.volumeType != null ? this.volumeType.hashCode() : 0);
            return result;
        }
    }
}
