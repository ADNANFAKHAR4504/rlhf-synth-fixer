# Source Network Environment - Simple Office Network

## Current On-Premises Setup

```
Small Business Network - "TechCorp Office"

Single Office Location:
- Office Network: 192.168.1.0/24
  - Web Servers: 192.168.1.10-20 (DMZ zone)
  - Application Servers: 192.168.1.100-110 (Internal zone)
  - Database Server: 192.168.1.200 (Secure zone)
```

## Network Configuration

### Security Zones

**DMZ Zone (192.168.1.10-20):**
- Web servers serving public traffic
- Allows inbound HTTP (80) and HTTPS (443) from internet
- Can connect to application servers on port 8080

**Internal Zone (192.168.1.100-110):**
- Application servers for business logic
- Accepts connections from DMZ on port 8080
- Can connect to database on port 5432
- No direct internet access

**Secure Zone (192.168.1.200):**
- Database server with sensitive data
- Only accepts connections from application servers
- No internet access
- Admin access via SSH (22) from management station

### Internet Connection
- Single broadband connection (100Mbps)
- Firewall controls access between zones