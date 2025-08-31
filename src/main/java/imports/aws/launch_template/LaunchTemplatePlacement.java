package imports.aws.launch_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.523Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.launchTemplate.LaunchTemplatePlacement")
@software.amazon.jsii.Jsii.Proxy(LaunchTemplatePlacement.Jsii$Proxy.class)
public interface LaunchTemplatePlacement extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#affinity LaunchTemplate#affinity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAffinity() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#availability_zone LaunchTemplate#availability_zone}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityZone() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#group_name LaunchTemplate#group_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGroupName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#host_id LaunchTemplate#host_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHostId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#host_resource_group_arn LaunchTemplate#host_resource_group_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHostResourceGroupArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#partition_number LaunchTemplate#partition_number}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPartitionNumber() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#spread_domain LaunchTemplate#spread_domain}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSpreadDomain() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#tenancy LaunchTemplate#tenancy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTenancy() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LaunchTemplatePlacement}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LaunchTemplatePlacement}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LaunchTemplatePlacement> {
        java.lang.String affinity;
        java.lang.String availabilityZone;
        java.lang.String groupName;
        java.lang.String hostId;
        java.lang.String hostResourceGroupArn;
        java.lang.Number partitionNumber;
        java.lang.String spreadDomain;
        java.lang.String tenancy;

        /**
         * Sets the value of {@link LaunchTemplatePlacement#getAffinity}
         * @param affinity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#affinity LaunchTemplate#affinity}.
         * @return {@code this}
         */
        public Builder affinity(java.lang.String affinity) {
            this.affinity = affinity;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplatePlacement#getAvailabilityZone}
         * @param availabilityZone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#availability_zone LaunchTemplate#availability_zone}.
         * @return {@code this}
         */
        public Builder availabilityZone(java.lang.String availabilityZone) {
            this.availabilityZone = availabilityZone;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplatePlacement#getGroupName}
         * @param groupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#group_name LaunchTemplate#group_name}.
         * @return {@code this}
         */
        public Builder groupName(java.lang.String groupName) {
            this.groupName = groupName;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplatePlacement#getHostId}
         * @param hostId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#host_id LaunchTemplate#host_id}.
         * @return {@code this}
         */
        public Builder hostId(java.lang.String hostId) {
            this.hostId = hostId;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplatePlacement#getHostResourceGroupArn}
         * @param hostResourceGroupArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#host_resource_group_arn LaunchTemplate#host_resource_group_arn}.
         * @return {@code this}
         */
        public Builder hostResourceGroupArn(java.lang.String hostResourceGroupArn) {
            this.hostResourceGroupArn = hostResourceGroupArn;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplatePlacement#getPartitionNumber}
         * @param partitionNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#partition_number LaunchTemplate#partition_number}.
         * @return {@code this}
         */
        public Builder partitionNumber(java.lang.Number partitionNumber) {
            this.partitionNumber = partitionNumber;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplatePlacement#getSpreadDomain}
         * @param spreadDomain Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#spread_domain LaunchTemplate#spread_domain}.
         * @return {@code this}
         */
        public Builder spreadDomain(java.lang.String spreadDomain) {
            this.spreadDomain = spreadDomain;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplatePlacement#getTenancy}
         * @param tenancy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#tenancy LaunchTemplate#tenancy}.
         * @return {@code this}
         */
        public Builder tenancy(java.lang.String tenancy) {
            this.tenancy = tenancy;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LaunchTemplatePlacement}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LaunchTemplatePlacement build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LaunchTemplatePlacement}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LaunchTemplatePlacement {
        private final java.lang.String affinity;
        private final java.lang.String availabilityZone;
        private final java.lang.String groupName;
        private final java.lang.String hostId;
        private final java.lang.String hostResourceGroupArn;
        private final java.lang.Number partitionNumber;
        private final java.lang.String spreadDomain;
        private final java.lang.String tenancy;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.affinity = software.amazon.jsii.Kernel.get(this, "affinity", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.availabilityZone = software.amazon.jsii.Kernel.get(this, "availabilityZone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.groupName = software.amazon.jsii.Kernel.get(this, "groupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.hostId = software.amazon.jsii.Kernel.get(this, "hostId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.hostResourceGroupArn = software.amazon.jsii.Kernel.get(this, "hostResourceGroupArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.partitionNumber = software.amazon.jsii.Kernel.get(this, "partitionNumber", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.spreadDomain = software.amazon.jsii.Kernel.get(this, "spreadDomain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tenancy = software.amazon.jsii.Kernel.get(this, "tenancy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.affinity = builder.affinity;
            this.availabilityZone = builder.availabilityZone;
            this.groupName = builder.groupName;
            this.hostId = builder.hostId;
            this.hostResourceGroupArn = builder.hostResourceGroupArn;
            this.partitionNumber = builder.partitionNumber;
            this.spreadDomain = builder.spreadDomain;
            this.tenancy = builder.tenancy;
        }

        @Override
        public final java.lang.String getAffinity() {
            return this.affinity;
        }

        @Override
        public final java.lang.String getAvailabilityZone() {
            return this.availabilityZone;
        }

        @Override
        public final java.lang.String getGroupName() {
            return this.groupName;
        }

        @Override
        public final java.lang.String getHostId() {
            return this.hostId;
        }

        @Override
        public final java.lang.String getHostResourceGroupArn() {
            return this.hostResourceGroupArn;
        }

        @Override
        public final java.lang.Number getPartitionNumber() {
            return this.partitionNumber;
        }

        @Override
        public final java.lang.String getSpreadDomain() {
            return this.spreadDomain;
        }

        @Override
        public final java.lang.String getTenancy() {
            return this.tenancy;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAffinity() != null) {
                data.set("affinity", om.valueToTree(this.getAffinity()));
            }
            if (this.getAvailabilityZone() != null) {
                data.set("availabilityZone", om.valueToTree(this.getAvailabilityZone()));
            }
            if (this.getGroupName() != null) {
                data.set("groupName", om.valueToTree(this.getGroupName()));
            }
            if (this.getHostId() != null) {
                data.set("hostId", om.valueToTree(this.getHostId()));
            }
            if (this.getHostResourceGroupArn() != null) {
                data.set("hostResourceGroupArn", om.valueToTree(this.getHostResourceGroupArn()));
            }
            if (this.getPartitionNumber() != null) {
                data.set("partitionNumber", om.valueToTree(this.getPartitionNumber()));
            }
            if (this.getSpreadDomain() != null) {
                data.set("spreadDomain", om.valueToTree(this.getSpreadDomain()));
            }
            if (this.getTenancy() != null) {
                data.set("tenancy", om.valueToTree(this.getTenancy()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.launchTemplate.LaunchTemplatePlacement"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LaunchTemplatePlacement.Jsii$Proxy that = (LaunchTemplatePlacement.Jsii$Proxy) o;

            if (this.affinity != null ? !this.affinity.equals(that.affinity) : that.affinity != null) return false;
            if (this.availabilityZone != null ? !this.availabilityZone.equals(that.availabilityZone) : that.availabilityZone != null) return false;
            if (this.groupName != null ? !this.groupName.equals(that.groupName) : that.groupName != null) return false;
            if (this.hostId != null ? !this.hostId.equals(that.hostId) : that.hostId != null) return false;
            if (this.hostResourceGroupArn != null ? !this.hostResourceGroupArn.equals(that.hostResourceGroupArn) : that.hostResourceGroupArn != null) return false;
            if (this.partitionNumber != null ? !this.partitionNumber.equals(that.partitionNumber) : that.partitionNumber != null) return false;
            if (this.spreadDomain != null ? !this.spreadDomain.equals(that.spreadDomain) : that.spreadDomain != null) return false;
            return this.tenancy != null ? this.tenancy.equals(that.tenancy) : that.tenancy == null;
        }

        @Override
        public final int hashCode() {
            int result = this.affinity != null ? this.affinity.hashCode() : 0;
            result = 31 * result + (this.availabilityZone != null ? this.availabilityZone.hashCode() : 0);
            result = 31 * result + (this.groupName != null ? this.groupName.hashCode() : 0);
            result = 31 * result + (this.hostId != null ? this.hostId.hashCode() : 0);
            result = 31 * result + (this.hostResourceGroupArn != null ? this.hostResourceGroupArn.hashCode() : 0);
            result = 31 * result + (this.partitionNumber != null ? this.partitionNumber.hashCode() : 0);
            result = 31 * result + (this.spreadDomain != null ? this.spreadDomain.hashCode() : 0);
            result = 31 * result + (this.tenancy != null ? this.tenancy.hashCode() : 0);
            return result;
        }
    }
}
