export const powerdnsKnowledge = `# PowerDNS - Authoritative and Recursive DNS

## Overview
PowerDNS is a high-performance DNS suite offering both authoritative (PowerDNS Authoritative Server) and recursive (PowerDNS Recursor) components. Known for flexibility, powerful API, and backend database support, it's widely used by large-scale DNS operations.

## Key Features
- **Authoritative Server**: Master/slave zones with multiple backends
- **Recursor**: Recursive resolver with caching and DNSSEC validation
- **Flexible Backends**: MySQL, PostgreSQL, SQLite, LDAP, native file format
- **REST API**: Full-featured API for zone and record management
- **DNSSEC**: Full support for signing and validation
- **Zone Transfer**: AXFR, IXFR, and TSIG
- **Rate Limiting**: Query and response rate control
- **Web GUI**: PowerDNS Admin (separate project)

## Current Versions
- PowerDNS Authoritative 4.8+ (Current Stable)
- PowerDNS Recursor 5.0+ (Current Stable)
- Regular releases with security updates

## Installation

### Linux (Debian/Ubuntu)

#### Authoritative Server
\`\`\`bash
apt-get update
apt-get install pdns-server pdns-tools

# With MySQL backend
apt-get install pdns-backend-mysql

# With PostgreSQL backend
apt-get install pdns-backend-pgsql

# With SQLite backend
apt-get install pdns-backend-sqlite3
\`\`\`

#### Recursor
\`\`\`bash
apt-get install pdns-recursor
\`\`\`

### Linux (RHEL/CentOS)
\`\`\`bash
yum install pdns pdns-tools

# MySQL backend
yum install pdns-backend-mysql

# PostgreSQL backend
yum install pdns-backend-pgsql
\`\`\`

### From Repository
\`\`\`bash
# Add PowerDNS repository
curl https://repo.powerdns.com/FD380FBB-FA3DFA16.asc | apt-key add -
echo "deb [arch=amd64] http://repo.powerdns.com/ubuntu focal-auth-48 main" > \\
    /etc/apt/sources.list.d/powerdns.list
apt-get update
apt-get install pdns-server
\`\`\`

## PowerDNS Authoritative Server

### Basic Configuration: /etc/powerdns/pdns.conf

#### Minimal Setup
\`\`\`ini
[Authoritative]
# Listening
listen=0.0.0.0:53
listen-ipv6=[::]:53

# Backend
launch=native
native-dir=/etc/powerdns/zones

# Logging
loglevel=3
logging-facility=0
\`\`\`

#### Production Configuration
\`\`\`ini
[Authoritative]
# Identity
version-string=PowerDNS 4.8
api=yes
api-key=your-secret-api-key-here

# Listening addresses
listen=192.0.2.1:53
listen=192.0.2.2:53
listen-ipv6=[2001:db8::1]:53
listen-ipv6=[2001:db8::2]:53

# Backend type
launch=gmysql

# MySQL backend
gmysql-host=localhost
gmysql-port=3306
gmysql-user=pdns
gmysql-password=secretpassword
gmysql-dbname=powerdns

# Performance tuning
num-threads=8
allow-tcp-from=0.0.0.0/0
allow-axfr-ips=192.0.2.2,192.0.2.3

# Zone transfers
dnsupdate=yes
dnssec=yes

# Rate limiting
rrl=yes
rrl-size=67108864
rrl-limit=100

# Logging
loglevel=3
log-dns-details=no
log-dns-queries=no

# Cache settings
cache-ttl=20

# Query processing
recursive-cache-ttl=10

# Security
hide-version=yes
hide-soa=no

# Slaves
slave-cycle-interval=60
slave-renotify=no

# Lua scripting (optional)
lua-api=yes
\`\`\`

### Native Backend (Zone Files)

#### Zone File Format
\`\`\`
; Zone file for example.com
\$TTL 86400
\$ORIGIN example.com.

@       IN  SOA ns1.example.com. admin.example.com. (
            2024011701
            3600
            1800
            604800
            86400
)

@       IN  NS  ns1.example.com.
@       IN  NS  ns2.example.com.

ns1     IN  A   192.0.2.1
ns2     IN  A   192.0.2.2

@       IN  A   192.0.2.10
www     IN  A   192.0.2.10

@       IN  AAAA    2001:db8::10
www     IN  AAAA    2001:db8::10

@       IN  MX  10  mail.example.com.
mail    IN  A   192.0.2.20

ftp     IN  CNAME   www.example.com.

@       IN  TXT "v=spf1 mx -all"
_dmarc  IN  TXT "v=DMARC1; p=quarantine"

@       IN  CAA 0 issue "letsencrypt.org"

_sip._tcp   IN  SRV 10 60 5060 sipserver.example.com.
\`\`\`

#### Using Native Backend
\`\`\`bash
# Create zone directory
mkdir -p /etc/powerdns/zones

# Place zone file in directory
cp zones/db.example.com /etc/powerdns/zones/example.com

# Configuration
cat >> /etc/powerdns/pdns.conf << 'EOF'
launch=native
native-dir=/etc/powerdns/zones
EOF

# Restart service
systemctl restart pdns
\`\`\`

### MySQL Backend

#### Database Setup
\`\`\`sql
-- Create database
CREATE DATABASE powerdns;
USE powerdns;

-- Create tables
CREATE TABLE domains (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    master VARCHAR(20) DEFAULT NULL,
    last_check INT DEFAULT NULL,
    type VARCHAR(6) NOT NULL DEFAULT 'Native',
    notified_serial INT DEFAULT NULL,
    account VARCHAR(40) DEFAULT NULL,
    dnssec INT DEFAULT 0,
    nsec3param VARCHAR(255) DEFAULT NULL,
    nsec3narrow INT DEFAULT 0,
    presigned INT DEFAULT 0,
    soa_edit INT DEFAULT 0,
    soa_edit_api VARCHAR(10) DEFAULT 'DEFAULT'
) ENGINE=InnoDB;

CREATE TABLE records (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    domain_id INT NOT NULL,
    name VARCHAR(255) DEFAULT NULL,
    type VARCHAR(10) DEFAULT NULL,
    content TEXT DEFAULT NULL,
    ttl INT DEFAULT NULL,
    prio INT DEFAULT NULL,
    disabled INT DEFAULT 0,
    ordername VARCHAR(255) BINARY DEFAULT NULL,
    auth INT DEFAULT 1,
    FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE,
    INDEX idx_name_type (name, type),
    INDEX idx_domain_id (domain_id)
) ENGINE=InnoDB;

CREATE TABLE supermasters (
    ip VARCHAR(64) NOT NULL,
    nameserver VARCHAR(255) NOT NULL,
    account VARCHAR(40) NOT NULL
) ENGINE=InnoDB;

-- Create user
CREATE USER 'pdns'@'localhost' IDENTIFIED BY 'secretpassword';
GRANT ALL PRIVILEGES ON powerdns.* TO 'pdns'@'localhost';
FLUSH PRIVILEGES;
\`\`\`

#### Configuration
\`\`\`ini
[Authoritative]
launch=gmysql

gmysql-host=localhost
gmysql-port=3306
gmysql-user=pdns
gmysql-password=secretpassword
gmysql-dbname=powerdns

# Connection pooling
gmysql-connections=5
gmysql-timeout=5
\`\`\`

### PostgreSQL Backend

#### Database Setup
\`\`\`sql
-- Create database
CREATE DATABASE powerdns OWNER pdns;
\\c powerdns

-- Create tables
CREATE TABLE domains (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    master VARCHAR(20),
    last_check INTEGER,
    type VARCHAR(6) NOT NULL DEFAULT 'Native',
    notified_serial INTEGER,
    account VARCHAR(40),
    dnssec INTEGER DEFAULT 0,
    nsec3param VARCHAR(255),
    nsec3narrow INTEGER DEFAULT 0,
    presigned INTEGER DEFAULT 0,
    soa_edit INTEGER DEFAULT 0,
    soa_edit_api VARCHAR(10) DEFAULT 'DEFAULT'
);

CREATE TABLE records (
    id BIGSERIAL PRIMARY KEY,
    domain_id INTEGER NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    name VARCHAR(255),
    type VARCHAR(10),
    content TEXT,
    ttl INTEGER,
    prio INTEGER,
    disabled INTEGER DEFAULT 0,
    ordername VARCHAR(255),
    auth INTEGER DEFAULT 1
);

CREATE INDEX idx_records_domain_id ON records(domain_id);
CREATE INDEX idx_records_name_type ON records(name, type);

-- Create user
CREATE USER pdns WITH PASSWORD 'secretpassword';
GRANT ALL PRIVILEGES ON DATABASE powerdns TO pdns;
GRANT ALL ON TABLE domains TO pdns;
GRANT ALL ON TABLE records TO pdns;
\`\`\`

#### Configuration
\`\`\`ini
[Authoritative]
launch=gpgsql

gpgsql-host=localhost
gpgsql-port=5432
gpgsql-user=pdns
gpgsql-password=secretpassword
gpgsql-dbname=powerdns
\`\`\`

## PowerDNS API

### Enabling the API
\`\`\`ini
api=yes
api-key=your-super-secret-api-key-12345
webserver=yes
webserver-port=8081
webserver-address=127.0.0.1
\`\`\`

### API Examples

#### List All Zones
\`\`\`bash
curl -H "X-API-Key: your-api-key" \\
    http://localhost:8081/api/v1/servers/localhost/zones
\`\`\`

#### Get Zone Details
\`\`\`bash
curl -H "X-API-Key: your-api-key" \\
    http://localhost:8081/api/v1/servers/localhost/zones/example.com
\`\`\`

#### Add a Record
\`\`\`bash
curl -X PATCH -H "X-API-Key: your-api-key" \\
    -H "Content-Type: application/json" \\
    -d '{
        "rrsets": [{
            "name": "www.example.com.",
            "type": "A",
            "changetype": "REPLACE",
            "ttl": 3600,
            "records": [{
                "content": "192.0.2.10",
                "disabled": false
            }]
        }]
    }' \\
    http://localhost:8081/api/v1/servers/localhost/zones/example.com
\`\`\`

#### Delete a Record
\`\`\`bash
curl -X PATCH -H "X-API-Key: your-api-key" \\
    -H "Content-Type: application/json" \\
    -d '{
        "rrsets": [{
            "name": "old.example.com.",
            "type": "A",
            "changetype": "DELETE"
        }]
    }' \\
    http://localhost:8081/api/v1/servers/localhost/zones/example.com
\`\`\`

## DNSSEC Configuration

### Enable DNSSEC
\`\`\`bash
# Create zone in database
mysql -u pdns -ppassword powerdns << 'EOF'
INSERT INTO domains (name, type, dnssec)
VALUES ('example.com', 'Native', 1);
EOF

# or with API
curl -X POST -H "X-API-Key: your-api-key" \\
    -H "Content-Type: application/json" \\
    -d '{
        "name": "example.com",
        "kind": "Native",
        "dnssec": true
    }' \\
    http://localhost:8081/api/v1/servers/localhost/zones
\`\`\`

### Secure a Zone
\`\`\`bash
# Retrieve zone
pdnsutil retrieve-zone example.com

# Secure zone (generates keys)
pdnsutil secure-zone example.com

# Check DNSSEC status
pdnsutil check-zone example.com

# Get DS records
pdnsutil get-zone-ds-records example.com
\`\`\`

## Zone Management

### Adding Zones via API
\`\`\`bash
#!/bin/bash
API_KEY="your-api-key"
API_ENDPOINT="http://localhost:8081"

# Create new zone
curl -X POST \\
    -H "X-API-Key: \$API_KEY" \\
    -H "Content-Type: application/json" \\
    -d '{
        "name": "newzone.com.",
        "kind": "Native",
        "dnssec": false
    }' \\
    \${API_ENDPOINT}/api/v1/servers/localhost/zones
\`\`\`

### Zone Transfers

#### Master Configuration
\`\`\`ini
# Allow zone transfers to slave
allow-axfr-ips=192.0.2.2,192.0.2.3

# Zone in database/file with type "Master"
# Records will be replicated
\`\`\`

#### Slave Configuration
\`\`\`ini
[Authoritative]
# Zone with master server IP
# Configure in database: type = "Slave", master = "192.0.2.1"

# Or via API
\`\`\`

## PowerDNS Recursor

### Basic Configuration: /etc/powerdns/recursor.conf
\`\`\`ini
# Listening
local-address=0.0.0.0:53
local-ipv6=[::]:53

# Security
allow-from=127.0.0.1/8,::1/128,192.168.1.0/24

# Forwarding
forward-zones=corp.example.com=192.168.1.10:53

# Cache
max-cache-entries=1000000

# DNSSEC
dnssec=validate

# Threads
threads=4

# Query logging
query-logging=no

# API
webserver=yes
webserver-port=8082
api-key=your-api-key-recursor
\`\`\`

### Forwarding Configuration
\`\`\`ini
# Forward specific domain
forward-zones=example.com=ns1.example.com:53,ns2.example.com:53

# Forward with DNSSEC
forward-zones-recurse=internal.corp=192.168.1.10:53

# Conditional forwarding
forward-zones=internal.corp=192.168.1.10

# Fallback to AXFR
forward-zones-file=/etc/powerdns/forward-zones.conf
\`\`\`

## Useful Commands

### Zone Operations
\`\`\`bash
# List zones
pdnsutil list-zones

# Retrieve zone
pdnsutil retrieve-zone example.com

# Check zone
pdnsutil check-zone example.com

# Reload zone
pdnsutil reload-zone example.com

# Delete zone
pdnsutil delete-zone example.com
\`\`\`

### DNSSEC Operations
\`\`\`bash
# Secure zone
pdnsutil secure-zone example.com

# Show keys
pdnsutil show-zone example.com

# Get DS records
pdnsutil get-zone-ds-records example.com

# Export zone with DNSSEC
pdnsutil export-zone example.com
\`\`\`

### Service Management
\`\`\`bash
# Start/stop/restart
systemctl start pdns
systemctl stop pdns
systemctl restart pdns

# Check status
systemctl status pdns

# View logs
journalctl -u pdns -f
\`\`\`

## Performance Tuning

### Database Optimization
\`\`\`ini
# Connection pooling
gmysql-connections=10

# Cache settings
cache-ttl=20
query-cache-ttl=20

# Zone cache
zone-cache-refresh-interval=0
\`\`\`

### Threading
\`\`\`ini
num-threads=8
allow-tcp-from=0.0.0.0/0
\`\`\`

## Monitoring

### Statistics
\`\`\`bash
# Get server statistics
curl -H "X-API-Key: your-api-key" \\
    http://localhost:8081/api/v1/servers/localhost/stats

# View via command line
pdns_control stats
\`\`\`

### Logging
\`\`\`ini
loglevel=3
log-dns-queries=yes
log-dns-details=yes

# Syslog
logging-facility=0
\`\`\`

## Common Issues and Solutions

### 1. Zone Transfer Failures
- Verify master IP in slave configuration
- Check allow-axfr-ips on master
- Ensure network connectivity
- Review logs for authentication errors

### 2. API Connection Issues
- Verify API key is correct
- Check webserver is enabled
- Verify firewall allows port 8081
- Check logs for API errors

### 3. Database Connection Problems
- Verify database credentials
- Check database server is running
- Verify tables exist and have data
- Monitor database connections

### 4. DNSSEC Validation Failures
- Ensure DS records are in parent zone
- Verify zone is properly signed
- Check trust anchors are up to date
- Review validation logs

### 5. High Query Latency
- Increase num-threads
- Optimize database queries
- Increase cache sizes
- Monitor system resources

## References
- PowerDNS Official: https://www.powerdns.com/
- PowerDNS Authoritative Manual: https://doc.powerdns.com/authoritative/
- PowerDNS Recursor Manual: https://doc.powerdns.com/recursor/
- PowerDNS API Documentation: https://doc.powerdns.com/authoritative/api/
- PowerDNS Admin: https://github.com/PowerDNS-Admin/PowerDNS-Admin
`;
