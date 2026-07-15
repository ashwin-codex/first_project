# Software Architecture Document (SAD)

## Project Title: LLM-Powered AI Security Copilot for Intelligent Threat Detection and Incident Response

---

## 1. Requirement Analysis

### 1.1 Functional Requirements (FR)
*   **FR-1: Automated Log Ingestion & Parsing**
    *   **FR-1.1:** The system must ingest raw logs in CSV, JSON, and Syslog formats.
    *   **FR-1.2:** The system must normalize raw logs into a standardized Schema based on the Elastic Common Schema (ECS).
    *   **FR-1.3:** The system must support manual file uploads and API-driven log submissions.
*   **FR-2: Log Redaction & Data Privacy**
    *   **FR-2.1:** An anonymizer component must scan incoming logs for PII (emails, names, phone numbers) and credentials prior to sending data to the LLM engine.
    *   **FR-2.2:** Redacted entities must be replaced with deterministic tokens (UUIDs), mapping the original values in a secure, transient cache.
*   **FR-3: Threat Detection & Semantic Enrichment**
    *   **FR-3.1:** The system must compute vector embeddings of incoming alerts and perform similarity searches against the MITRE ATT&CK database.
    *   **FR-3.2:** The system must query third-party threat intelligence services (VirusTotal, AlienVault OTX) for suspicious IPs, domains, and file hashes.
    *   **FR-3.3:** The system must assign a dynamic Risk Score (1-100) based on severity, threat intelligence hits, and critical asset classification.
*   **FR-4: Natural Language to Security Query Translation (NL-to-Query)**
    *   **FR-4.1:** The system must allow analysts to write queries in plain English (e.g., "Find all failed logins from user admin in the last hour").
    *   **FR-4.2:** The system must compile the natural language input into target database queries (KQL, Elasticsearch DSL, SQL) with syntactical validation.
*   **FR-5: Interactive AI Copilot & Incident Investigation**
    *   **FR-5.1:** The system must feature a persistent conversational session interface allowing follow-up investigations.
    *   **FR-5.2:** The Copilot must offer explanation logic mapping malware process trees and command-line execution parameters.
    *   **FR-5.3:** The Copilot must provide direct citations and links to internal knowledge base entries and vector sources for auditing.
*   **FR-6: Semi-Automated Containment & Incident Response**
    *   **FR-6.1:** The system must recommend playbooks (e.g., host isolation, account lockout) mapped to identified threats.
    *   **FR-6.2:** Destructive orchestration commands (host isolation, credential revocation) must require explicit manual approval from authorized roles (Tier-2/3 Analysts).
    *   **FR-6.3:** The system must provide real-time status updates of active remediation playbooks.
*   **FR-7: Report Generation & Auditing**
    *   **FR-7.1:** The system must compile complete incident files into downloadable PDF reports containing an executive summary, chronological timeline, root cause analysis (RCA), and preventative actions.
    *   **FR-7.2:** The system must write every analyst prompt, LLM response, and remediation action to an immutable audit ledger.

### 1.2 Non-Functional Requirements (NFR)
*   **NFR-1: Security & Compliance**
    *   **NFR-1.1:** All communication channels must enforce TLS 1.3 in transit.
    *   **NFR-1.2:** Passive data (database tables, files) must be encrypted using AES-256 keys.
    *   **NFR-1.3:** Credentials and external API tokens must be stored in a system keystore or hashed securely using Argon2id.
*   **NFR-2: Performance & Latency**
    *   **NFR-2.1:** The pipeline must support log ingestion throughputs of up to 1,000 Events Per Second (EPS) without data loss.
    *   **NFR-2.2:** The NL-to-Query compilation must return a executable statement in under 2.5 seconds.
    *   **NFR-2.3:** The conversational agent response must stream its initial characters within 1.0 second of query dispatch.
*   **NFR-3: Reliability & High Availability**
    *   **NFR-3.1:** The core console and API gateway must maintain 99.9% uptime.
    *   **NFR-3.2:** In the event of downstream LLM outage, the system must degrade gracefully, allowing normal SIEM query execution and manual playbook triggers.
*   **NFR-4: Scalability & Portability**
    *   **NFR-4.1:** The system backend must run inside containerized environments (Docker, Kubernetes) to support multi-cloud deployments.
    *   **NFR-4.2:** The LLM integration tier must utilize an abstract adapter layer supporting rapid model swaps (OpenAI, Anthropic, local vLLM instances).

### 1.3 User, System, Assumptions, Constraints, and Scope
*   **User Requirements:** Security analysts require an intuitive, low-latency web workspace where they can ingest alerts, threat-hunt using normal language, see unified timeline graphs, get AI descriptions of security events, and execute playbooks via simple controls.
*   **System Requirements:** The system requires a backend environment running Python 3.11+, Node.js 18+ for frontend UI rendering, a relational database (PostgreSQL 15+), a search index storage (Elasticsearch/OpenSearch), a vector store (ChromaDB or pgvector), a caching layer (Redis), and connection to external/internal inference APIs.
*   **Assumptions:**
    *   Log sources are valid, chronologically reliable, and free from deliberate integrity modification before ingestion.
    *   Network gateways permit outbound SSL channels to public LLM endpoints, or the local environment features GPU capabilities to run on-premise model weights.
*   **Constraints:**
    *   No raw credential details or PII can be sent to external networks.
    *   Inference calls are bound by rate-limiting rules (Tokens per minute/Requests per minute) of LLM provider contracts.
    *   Local hosting of model weights (e.g., Llama-3-70B) is bound by available high-performance VRAM hardware budgets (e.g., NVIDIA A100/H100).
*   **Scope:**
    *   *In-Scope:* Log normalization; PII scrubbing; vector correlation; conversational agent interactions; query compilation; execution metrics; Human-in-the-Loop response approval; and PDF reporting.
    *   *Out-of-Scope:* Building host agents from scratch (relies on EDR webhooks); self-healing networks that automate containment without analyst validation; and base training or fine-tuning of foundational LLM parameters from raw weights.

---

## 2. User Roles & Access Control

The platform enforces a strict Role-Based Access Control (RBAC) strategy to segregate operational responsibilities within the SOC.

| Role | System Scope & Permissions | Specific Capabilities |
| :--- | :--- | :--- |
| **Tier-1 SOC Analyst** | Read-Only Incident Queue, Read-Only Logs, Write Chat Session | Triages raw alerts; interrogates the conversational Copilot; designs custom threat-hunting scripts via NL-to-Query translation; drafts incident reports. Cannot approve remediation playbooks or edit platform settings. |
| **Tier-2/3 Incident Responder** | Read/Write Incidents, Execute Playbooks, Approve Actions | Conducts deep forensic mapping; overrides automated playbook recommendations; executes host containment, process termination, and account locks; reviews raw configuration APIs. |
| **SOC Manager / Admin** | Complete Administrative Control, Read Audits | Registers/revokes user accounts; modifies threat intelligence API keys; alters baseline LLM prompt templates; updates system integrations; views immutable forensic audit logs. |
| **Compliance Auditor** | Read-Only Reports & Audits | Accesses generated post-incident investigation reports and reads system action history to validate regulatory compliance (GDPR, HIPAA, SOC 2). |

### RBAC Permissions Matrix

```
+------------------------------------+--------+--------+--------+--------+
| Operation / Endpoint Group         | Tier-1 | Tier-2 | Admin  | Auditor|
+------------------------------------+--------+--------+--------+--------+
| View Alerts & Incidents            |   X    |   X    |   X    |   X    |
| Ingest Raw Logs (API Key / Upload) |   X    |   X    |   X    |    -   |
| Interact with Copilot Chat         |   X    |   X    |   X    |    -   |
| Translate NL to SIEM Queries       |   X    |   X    |   X    |    -   |
| Trigger Remediation Playbook       |   -    |   X    |   X    |    -   |
| Approve/Execute Destructive Action |   -    |   X    |    -   |    -   |
| Modify Prompt Templates            |   -    |   -    |   X    |    -   |
| View Immutable Audit Logs          |   -    |   -    |   X    |   X    |
| Manage Integrations & API Keys     |   -    |   -    |   X    |    -   |
+------------------------------------+--------+--------+--------+--------+
```

---

## 3. Complete Module Breakdown

The system is designed as a series of decoupled service boundaries to allow independent scaling, localized testing, and modular configuration.

```
+---------------------------------------------------------------------------------------------------+
|                                      SOC COPILOT MODULE MAP                                       |
+-------------------+--------------------+--------------------+--------------------+----------------+
| Auth & User Mgmt  | Ingestion Gateway  | Log Parser & Red.  | Threat Intel Engine| Vectorizer     |
+-------------------+--------------------+--------------------+--------------------+----------------+
| MITRE ATT&CK Map  | Query Translator   | Risk Analyzer      | LLM Copilot Orche. | Playbook Exec. |
+-------------------+--------------------+--------------------+--------------------+----------------+
| Audit & Analytics | UI Controller      | Notification Sys.  | Incident Reporter  | Configuration  |
+-------------------+--------------------+--------------------+--------------------+----------------+
```

### 3.1 Authentication & User Management Module
*   **Purpose:** Handles user registration, credentials validation, session tokens issue, and role verification.
*   **Inputs:** Login requests (username, password), session credentials, registration payloads.
*   **Outputs:** JSON Web Tokens (JWT), session cookies, account status confirmations.
*   **Internal Workflow:** Authenticates credential integrity using Argon2id, signs standard JWT tokens containing username and assigned scopes, and verifies token status on protected REST endpoints.
*   **Dependencies:** Database Connector (PostgreSQL).

### 3.2 Log Upload & Ingestion Gateway Module
*   **Purpose:** Exposes endpoints to receive bulk security logs and real-time alerts from EDRs, firewalls, and manual dashboard uploads.
*   **Inputs:** Raw JSON payloads, CSV streams, Syslog streams, file metadata.
*   **Outputs:** Enqueued raw ingestion messages.
*   **Internal Workflow:** Validates ingestion API keys, processes file sizing metrics, and routes raw inputs to the message queue broker.
*   **Dependencies:** Redis / RabbitMQ Queue.

### 3.3 Log Parser & Redactor Module
*   **Purpose:** Normalizes raw events to a standard schema and removes PII and sensitive credentials.
*   **Inputs:** Raw log data from the queue.
*   **Outputs:** ECS-normalized, redacted JSON logs.
*   **Internal Workflow:** Runs target mappings to structure keys into standard fields. Scans data using regular expressions and Name Entity Recognition (NER) to find PII. Replaces matches with random UUID tokens and caches mapping pairs in Redis.
*   **Dependencies:** Redis (for redacting lookup storage).

### 3.4 Threat Intelligence Engine Module
*   **Purpose:** Enriches security events with indicators of compromise (IoC) evaluations from external threat feeds.
*   **Inputs:** Log entities (IP addresses, domain names, file hashes).
*   **Outputs:** Reputation scores, malicious category tags.
*   **Internal Workflow:** Queries threat databases (VirusTotal, AlienVault OTX) and caches responses to avoid rate limit saturation.
*   **Dependencies:** Threat Intel Caching database.

### 3.5 Vectorizer & Embeddings Generator Module
*   **Purpose:** Converts security alert signatures and text descriptions into semantic vectors.
*   **Inputs:** Cleaned event parameters, descriptions, and log timelines.
*   **Outputs:** 1536-dimensional vector arrays.
*   **Internal Workflow:** Formats text sequences and requests embeddings via local models or API channels.
*   **Dependencies:** Local embedding libraries or external endpoints.

### 3.6 MITRE ATT&CK Mapping Engine Module
*   **Purpose:** Mapped normalized alert patterns to specific adversary tactics, techniques, and procedures (TTPs).
*   **Inputs:** Event vectors, process logs.
*   **Outputs:** MITRE technique identifiers (e.g., T1003.001) and mitigations context.
*   **Internal Workflow:** Queries the local vector database using cosine similarity to locate closely-aligned threat techniques.
*   **Dependencies:** Vector Database (ChromaDB / pgvector).

### 3.7 LLM Copilot Orchestration Module (RAG Core)
*   **Purpose:** The coordinator that collects threat data, historical logs, playbooks, and conversational history to format prompts for the LLM.
*   **Inputs:** User requests, current incident metrics, chat history.
*   **Outputs:** Synthesized summaries, chat answers, suggested workflows.
*   **Internal Workflow:** Merges user prompts with matching RAG contexts, retrieves session memory cache, filters formatting through the Prompt Registry, and streams inference results.
*   **Dependencies:** LiteLLM Adapter, Vector Database, Redis cache.

### 3.8 Query Translation Engine Module (NL-to-Query)
*   **Purpose:** Translates plain English instructions into syntax-valid queries for database backends.
*   **Inputs:** Natural language instructions, target language schema (KQL, SQL, ES DSL).
*   **Outputs:** Synthesized query string, syntax validation status, confidence metric.
*   **Internal Workflow:** Formats requests with database schema contexts, obtains LLM query candidates, and parses statements through an Abstract Syntax Tree (AST) validator to prevent injections.
*   **Dependencies:** LLM adapter, parsing libraries.

### 3.9 Playbook Executor & Orchestration Module
*   **Purpose:** Executes response procedures (such as containment steps) on enterprise networks.
*   **Inputs:** Mapped playbook instructions, entity ids, responder validation tokens.
*   **Outputs:** Remediation status updates, execution outputs.
*   **Internal Workflow:** Locates correct playbooks, maps parameters to REST payloads, flags steps needing human approval, and invokes connectors (CrowdStrike API, AWS IAM) once authorized.
*   **Dependencies:** External EDR/Cloud APIs, relational database status trackers.

### 3.10 Risk Analysis Engine Module
*   **Purpose:** Calculates system-wide risk metrics based on logs and environmental classifications.
*   **Inputs:** Incident data, asset tags, threat reputation values.
*   **Outputs:** Risk score (1-100), alert priorities.
*   **Internal Workflow:** Combines indicators (e.g., Critical database host + external IP connection + malicious reputation) into a weighted formula.
*   **Dependencies:** Relational database.

### 3.11 Dashboard UI Controller Module
*   **Purpose:** Supports dashboard view metrics, alert aggregations, timeline tracking, and telemetry streaming.
*   **Inputs:** User session requests.
*   **Outputs:** Aggregated metrics, charts telemetry, and server status.
*   **Internal Workflow:** Reads from relational, search, and caching databases to return real-time graphs and live alerts queues.
*   **Dependencies:** PostgreSQL, Elasticsearch, Redis.

### 3.12 Incident Report Generator Module
*   **Purpose:** Compiles incident investigations into documentation files.
*   **Inputs:** Incident database ID, timeline records, Copilot summaries, audit logs.
*   **Outputs:** Downloadeable PDF reports.
*   **Internal Workflow:** Queries incident metrics, renders chronological tables, pulls AI root cause statements, and formats files into branded corporate layouts.
*   **Dependencies:** PDF rendering library.

### 3.13 Notification System Module
*   **Purpose:** Sends security alerts to communication tools and dashboards.
*   **Inputs:** High-priority incidents, system alerts, containment approvals.
*   **Outputs:** Integration messages (Slack webhooks, email triggers).
*   **Internal Workflow:** Compiles alert parameters, designs custom message objects, and transmits data to registered endpoints.
*   **Dependencies:** Communication gateways.

### 3.14 Audit Logger Module
*   **Purpose:** Writes detailed audit trails of system activities for security compliance.
*   **Inputs:** System actions (prompts, user sessions, playbook execution, auth changes).
*   **Outputs:** Relational audit rows, write-once storage tracks.
*   **Internal Workflow:** Standardizes action metadata, writes entries to database records, and validates integrity signatures.
*   **Dependencies:** Relational Database (PostgreSQL).

### 3.15 Configuration & Settings Module
*   **Purpose:** Manages system integration keys, playbook definitions, and model configs.
*   **Inputs:** Administrative setting changes.
*   **Outputs:** Updated state records.
*   **Internal Workflow:** Saves and loads settings files, manages local configuration parameters, and controls credential storage integrations.
*   **Dependencies:** Keystore, Relational database.

---

## 4. High-Level Architecture

The architecture uses an event-driven design to isolate high-frequency log ingestion flows from interactive, low-latency LLM agent workloads.

```mermaid
graph TB
    subgraph DataSources ["Data Ingestion Layer"]
        Syslog[Syslog Stream]
        CloudTrail[AWS CloudTrail]
        EDRAlerts[EDR Alerts Webhook]
    end

    subgraph API_Gateway_Zone ["Gateway & Routing Tier"]
        Nginx[Nginx Reverse Proxy]
        FastAPI[Core FastAPI Engine]
        Celery[(Celery Message Broker)]
    end

    subgraph Processing_Tier ["Data Processing Workers"]
        Parser[Log Parser & PII Redactor]
        ThreatIntel[Threat Intel Enricher]
        VectorEngine[Vectorizer Engine]
    end

    subgraph Database_Tier ["Data Storage Tier"]
        Elastic[(Elasticsearch LogStore)]
        Postgres[(PostgreSQL Relational DB)]
        Redis[(Redis Session & Token Cache)]
        Chroma[(ChromaDB Vector Store)]
    end

    subgraph Copilot_Orchestrator ["AI Orchestration Tier"]
        LangChain[LangChain Agent Core]
        LiteLLM[LiteLLM Adapter Layer]
        PromptRegistry[Prompt Template Registry]
    end

    subgraph External_Models ["AI Inference Providers"]
        OpenAI[Cloud LLM - OpenAI]
        vLLM[Local LLM - Llama 3 on vLLM]
    end

    subgraph Integrations ["Response Orchestration"]
        CrowdStrike[CrowdStrike EDR API]
        AWS_IAM[AWS IAM API]
    end

    subgraph Client_Zone ["User Presentation Layer"]
        ReactUI[React / Next.js SOC Dashboard]
    end

    %% Ingestion Data Flow
    Syslog --> Nginx
    CloudTrail --> Nginx
    EDRAlerts --> Nginx
    Nginx --> FastAPI
    FastAPI --> Celery
    
    %% Processing Data Flow
    Celery --> Parser
    Parser --> ThreatIntel
    ThreatIntel --> VectorEngine
    VectorEngine --> Elastic
    VectorEngine --> Chroma

    %% User Interaction Flow
    ReactUI <--> Nginx
    FastAPI <--> Postgres
    FastAPI <--> Redis
    FastAPI <--> LangChain

    %% AI Query Flow
    LangChain <--> Chroma
    LangChain <--> Elastic
    LangChain <--> PromptRegistry
    LangChain <--> LiteLLM
    LiteLLM <--> OpenAI
    LiteLLM <--> vLLM

    %% Remediation Actions Flow
    FastAPI <--> CrowdStrike
    FastAPI <--> AWS_IAM
```

### 4.1 Architecture Communication Protocols
*   **HTTPS (REST APIs):** Used for client authentication, incident queue triage, API configuration changes, manual file uploads, and playbook execution approvals.
*   **WebSockets (WS):** Emitted from the Gateway to client applications for real-time alert updates and interactive terminal log streaming.
*   **Server-Sent Events (SSE):** Used by the LLM Orchestrator to stream conversational responses character-by-character back to the React UI, minimizing apparent latency.
*   **AMQP (Celery/RabbitMQ):** Asynchronous message passing protocol ensuring reliable communication between the Gateway API and background processing worker fleets.
*   **gRPC / TCP:** Direct connection protocols used to interface with the Elasticsearch indices, PostgreSQL database, and ChromaDB vector pools.

---

## 5. Low-Level Architecture

Inside each container instance, specific software sub-modules coordinate log sanitization, search translation, and security enforcement.

```
+-----------------------------------------------------------------------------------------------+
|                                      LOW-LEVEL PIPELINE                                       |
|                                                                                               |
|  [Raw Event] ---> [Normalizer (ECS)] ---> [PII Redactor] ---> [Threat Intel] ---> [Index DB]  |
|                                                  |                                            |
|                                            (UUID Mapping)                                     |
|                                                  v                                            |
|  [Analyst Chat] -> [Retrieve Memory] ----> [Redis Cache] ----> [Assemble Prompt] -> [LLM vLLM]|
+-----------------------------------------------------------------------------------------------+
```

### 5.1 Ingestion & Parsing Processing Pipeline
1.  **Syslog / Webhook Receiver:** Binds to standard ports (e.g., UDP 514) or exposes HTTPS endpoints. Collects payloads and writes them immediately to the background message queue to prevent network buffer overflow.
2.  **ECS Mapper:** Translates key-value structures. For example, mapping firewall fields `src` and `dst_port` to standard ECS schemas `source.ip` and `destination.port`.
3.  **PII Redactor:**
    *   **Parser regex:** Detects strings matching emails, credit card formats, and system passwords.
    *   **Named Entity Recognition (NER) Classifier:** Runs space-efficient local models (e.g., SpaCy or custom models) to detect user names, physical addresses, and organization titles.
    *   **Token mapping cache:** Replaces identified PII with UUIDv4 tokens. Stores the mapping (`UUID -> Original Value`) in Redis with a 24-hour expiration time.
4.  **Threat Intel Correlator:** Queries local memory cache databases. If there is a cache miss, it sends calls to the APIs of VirusTotal or AlienVault. It updates the log with reputation indicators.
5.  **ChromaDB Vectorizer:** Combines event values into a descriptive text representation, creates embeddings via the vectorizer, and inserts records into pgvector/ChromaDB.

### 5.2 Conversational Retrieval-Augmented Generation (RAG) Architecture
1.  **Analyst Prompt Submission:** Analyst submits a text query relative to an alert.
2.  **Memory Reconstruction:** The Orchestrator queries Redis to pull past chat events using the current session ID, rebuilding the context window.
3.  **Context Document Fetching:**
    *   Queries ChromaDB for MITRE ATT&CK mitigation documents matching the threat vectors.
    *   Queries Elasticsearch for host events from the 30-minute window surrounding the incident timeline.
4.  **Anonymizer Filter:** Runs the analyst prompt through the redactor to scrub sensitive entities.
5.  **Prompt Hydration:** Blends the system prompt, conversational context memory, retrieved logs, threat reputation metadata, and the scrubbed analyst query into a unified context template.
6.  **LiteLLM Dispatcher:** Determines routing rules. Sends queries to the target inference system (local vLLM or public cloud LLM) using streaming tokens.
7.  **De-Anonymizer & Client Presenter:** Intercepts the stream. Replaces the UUID tokens in the LLM response with original credentials using the Redis cache mapping, and streams the decrypted results back to the dashboard UI.

---

## 6. Data Flow Design (DFD)

### 6.1 DFD Level 0 - Context Diagram

The Context Diagram maps system input and output boundaries with external entities.

```mermaid
graph LR
    LogSources[Security Log Sources]
    Analyst[SOC Analyst]
    SecurityAdmin[Security Admin]
    ExternalInference[Inference Provider APIs]
    RemediationAPIs[EDR / Cloud Infrastructure APIs]
    
    subgraph Copilot_System ["AI Security Copilot System"]
        Core[Copilot Core Processing Engine]
    end

    LogSources -->|1. Transmit raw logs & alerts| Core
    Analyst -->|2. Natural language queries / Chat| Core
    Core -->|3. UI telemetry & Chat stream| Analyst
    SecurityAdmin -->|4. Update settings & prompts| Core
    Core -->|5. Scrubbed Prompts| ExternalInference
    ExternalInference -->|6. Diagnostic completion response| Core
    Core -->|7. Containment payloads| RemediationAPIs
    RemediationAPIs -->|8. Remediations status updates| Core
```

### 6.2 DFD Level 1 - Detailed Data Flow Diagram

The Level 1 diagram traces data transitions between processing modules and internal storage.

```mermaid
graph TD
    %% Source Ingestion
    Source[Security Log Source] -->|1. Submit raw event| P1[Process 1.0: Log Ingest & Normalize]
    
    %% Normalization & Redaction
    P1 -->|2. Normalized ECS event| P2[Process 2.0: PII Redactor]
    P2 -->|3. Cache credentials mapping| D1[(Redis Cache)]
    P2 -->|4. Clean event logs| P3[Process 3.0: Intel & Threat Vectorizer]
    
    %% Enrichment & Storage
    P3 -->|5. Fetch reputation data| ExtIntel[External Threat Intelligence APIs]
    ExtIntel -->|6. Return IoC indicators| P3
    P3 -->|7. Indexed log document| D2[(Elasticsearch LogStore)]
    P3 -->|8. Embeddings vector| D3[(ChromaDB Vector DB)]
    
    %% Query & Analysis
    Analyst[SOC Analyst] -->|9. Natural language query| P4[Process 4.0: Conversational Orchestrator]
    P4 -->|10. Query text context| D3
    D3 -->|11. MITRE technique data| P4
    P4 -->|12. Log history search| D2
    D2 -->|13. Targeted event logs| P4
    P4 -->|14. Anonymized prompt| P5[Process 5.0: Query Translator]
    P5 -->|15. Prompt structure| ExtLLM[External/Local LLM Inference]
    ExtLLM -->|16. Compiled DB query & raw answer| P5
    P5 -->|17. DB query validation| P5
    P5 -->|18. Formatted response payload| P4
    P4 -->|19. Decode UUID tokens| D1
    D1 -->|20. De-anonymized entity data| P4
    P4 -->|21. Interactive answer stream & alerts| Analyst
    
    %% Containment execution
    Analyst -->|22. Approve playbook containment| P6[Process 6.0: Playbook Action Router]
    P6 -->|23. Update execution records| D4[(PostgreSQL Transaction DB)]
    P6 -->|24. Fire containment REST commands| EDR[EDR / Cloud Remediation APIs]
    EDR -->|25. Containment success state| P6
    P6 -->|26. Status notifications| Analyst
```

---

## 7. Database Design

The database uses PostgreSQL for structured transactional metadata and ChromaDB (or pgvector) for RAG embedding mappings.

### 7.1 Entity Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o{ USER_ROLES : has
    ROLES ||--o{ USER_ROLES : contains
    
    USERS ||--o{ CHAT_SESSIONS : "initiates"
    CHAT_SESSIONS ||--o{ CHAT_MESSAGES : "contains"
    CHAT_MESSAGES ||--o{ TOKEN_LOGS : "logs tokens"
    
    USERS ||--o{ INCIDENTS : "assigns to"
    INCIDENTS ||--o{ INCIDENT_LOGS : "references logs"
    INCIDENTS ||--o{ PLAYBOOK_EXECUTIONS : "executes"
    
    PLAYBOOKS ||--o{ PLAYBOOK_EXECUTIONS : "defines steps"
    PLAYBOOK_EXECUTIONS ||--o{ HUMAN_APPROVALS : "authorizes"
    
    USERS ||--o{ HUMAN_APPROVALS : "requests/approves"
    USERS ||--o{ AUDIT_LOGS : "records action"
```

### 7.2 Database Schema (PostgreSQL DDL)

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: roles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(30) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: user_roles (Many-to-Many Mapping)
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Table: chat_sessions
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'New Triage Investigation',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: chat_messages
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    sender VARCHAR(10) NOT NULL CHECK (sender IN ('USER', 'SYSTEM')),
    raw_content TEXT NOT NULL,
    tokens_used INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: token_logs
CREATE TABLE token_logs (
    id BIGSERIAL PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    model_name VARCHAR(50) NOT NULL,
    prompt_tokens INT NOT NULL,
    completion_tokens INT NOT NULL,
    latency_ms INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: incidents
CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    severity VARCHAR(10) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('NEW', 'UNDER_INVESTIGATION', 'CONTAINED', 'CLOSED')),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    risk_score INT NOT NULL CHECK (risk_score BETWEEN 1 AND 100),
    summary_report TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: incident_logs (JSONB format for elastic correlation)
CREATE TABLE incident_logs (
    id BIGSERIAL PRIMARY KEY,
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    source_name VARCHAR(50) NOT NULL,
    raw_log_payload JSONB NOT NULL,
    ingested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: playbooks
CREATE TABLE playbooks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    trigger_condition VARCHAR(255) NOT NULL,
    steps_definition JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: playbook_executions
CREATE TABLE playbook_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playbook_id INT NOT NULL REFERENCES playbooks(id) ON DELETE RESTRICT,
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('RUNNING', 'SUSPENDED_APPROVAL', 'COMPLETED', 'FAILED')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Table: human_approvals (Containment Gate)
CREATE TABLE human_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID NOT NULL REFERENCES playbook_executions(id) ON DELETE CASCADE,
    action_name VARCHAR(100) NOT NULL,
    target_payload JSONB NOT NULL,
    requested_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    justification TEXT,
    action_taken_at TIMESTAMP WITH TIME ZONE
);

-- Table: audit_logs (Immutable audit ledger)
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    details JSONB NOT NULL,
    integrity_signature VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: threat_intel_cache
CREATE TABLE threat_intel_cache (
    ioc_value VARCHAR(255) PRIMARY KEY,
    ioc_type VARCHAR(10) NOT NULL CHECK (ioc_type IN ('IP', 'DOMAIN', 'HASH')),
    reputation_data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Indexes for performance & quick searches
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incident_logs_jsonb_gin ON incident_logs USING gin (raw_log_payload);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_threat_intel_expires ON threat_intel_cache(expires_at);
```

### 7.3 Database Normalization Analysis
*   **First Normal Form (1NF):** All tables exhibit atomic column definitions. No nested tables or dynamic repeating values are written inside standard columns. In complex, dynamic security logs (e.g., `incident_logs.raw_log_payload`), structured JSONB columns are used rather than variable schema layouts. This allows key-value lookups within structured indexes without breaking relational normalization.
*   **Second Normal Form (2NF):** Compiles with 1NF. All primary keys are single identifier fields (UUIDs, auto-increment serials) or mapped explicitly. In relational mapping tables (e.g., `user_roles`), the fields `(user_id, role_id)` function as a composite primary key. There are no partial functional dependencies: all non-key columns depend wholly on the designated primary identifiers.
*   **Third Normal Form (3NF):** Compiles with 2NF. Transitive dependencies are eliminated. For instance, in the `incidents` table, we reference only the UUID identifier of the analyst (`assigned_to`) instead of writing user metadata like names or emails directly. This isolates updates to user parameters within the core `users` table.

---

## 8. REST API Specification

### 8.1 API Documentation & Endpoints

All endpoints use JSON payloads and authenticate via JWT tokens passed inside HTTP headers.

```
Authentication Header:
Authorization: Bearer <JWT_Token_Here>
```

#### 8.1.1 Authentication Endpoints
*   **POST** `/api/v1/auth/login`
    *   *Authentication:* None (Public)
    *   *Request Body:*
        ```json
        {
          "username": "j.doe",
          "password": "securepassword123"
        }
        ```
    *   *Success Response (200 OK):*
        ```json
        {
          "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          "token_type": "bearer",
          "expires_in": 3600,
          "user": {
            "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
            "username": "j.doe",
            "roles": ["TIER_1_ANALYST"]
          }
        }
        ```
    *   *Error Response (401 Unauthorized):*
        ```json
        {
          "error_code": "INVALID_CREDENTIALS",
          "message": "Username or password incorrect."
        }
        ```

*   **POST** `/api/v1/auth/register`
    *   *Authentication:* Required (`SOC_MANAGER` role only)
    *   *Request Body:*
        ```json
        {
          "username": "s.smith",
          "email": "s.smith@enterprise.com",
          "password": "TemporaryPassword99!",
          "roles": ["TIER_2_3_RESOLVER"]
        }
        ```
    *   *Success Response (201 Created):*
        ```json
        {
          "user_id": "8c2deb4d-3b7d-4bad-9bdd-2b0d7b3dcb7e",
          "message": "User registered successfully."
        }
        ```

#### 8.1.2 Incident Management Endpoints
*   **GET** `/api/v1/incidents`
    *   *Authentication:* Required (`TIER_1_ANALYST`, `TIER_2_3_RESOLVER`, `SOC_MANAGER`)
    *   *Query Parameters:*
        *   `status` (string, optional: e.g., `NEW`, `CLOSED`)
        *   `severity` (string, optional: e.g., `CRITICAL`, `HIGH`)
    *   *Success Response (200 OK):*
        ```json
        {
          "incidents": [
            {
              "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
              "title": "Ransomware Execution Flow",
              "severity": "CRITICAL",
              "status": "UNDER_INVESTIGATION",
              "assigned_to": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
              "risk_score": 95,
              "created_at": "2026-07-12T16:30:00Z"
            }
          ],
          "total_count": 1
        }
        ```

*   **POST** `/api/v1/incidents/ingest`
    *   *Authentication:* Required (API Key authenticated: `X-API-Key`)
    *   *Request Body:*
        ```json
        {
          "source_name": "EDR_System",
          "severity": "CRITICAL",
          "alert_title": "Mimikatz LSASS Access",
          "raw_log_payload": {
            "hostname": "WS-FIN-992",
            "target_ip": "192.168.1.45",
            "process_name": "mimikatz.exe",
            "process_id": 4812,
            "hash": "8754b2a77f98e720e2e2a7b8e1a129d2"
          }
        }
        ```
    *   *Success Response (201 Created):*
        ```json
        {
          "incident_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
          "status": "NEW",
          "message": "Incident logged and enqueued for vector enrichment."
        }
        ```

#### 8.1.3 AI Copilot & Query Translators Endpoints
*   **POST** `/api/v1/copilot/sessions`
    *   *Authentication:* Required (Any authenticated user)
    *   *Request Body:*
        ```json
        {
          "title": "Investigate Mimikatz Execution"
        }
        ```
    *   *Success Response (201 Created):*
        ```json
        {
          "session_id": "e5f4d3c2-b1a0-9c8d-7e6f-5a4b3c2b1a0b",
          "title": "Investigate Mimikatz Execution",
          "created_at": "2026-07-12T22:20:00Z"
        }
        ```

*   **POST** `/api/v1/copilot/chat`
    *   *Authentication:* Required (Any authenticated user)
    *   *Request Body:*
        ```json
        {
          "session_id": "e5f4d3c2-b1a0-9c8d-7e6f-5a4b3c2b1a0b",
          "prompt": "Identify malicious commands executed on host WS-FIN-992."
        }
        ```
    *   *Success Response (200 OK - Streaming HTTP text/event-stream supported):*
        ```json
        {
          "message_id": "d3c2b1a0-b1a0-9c8d-7e6f-5a4b3c2b1a0b",
          "response": "Host WS-FIN-992 ran command 'mimikatz.exe sekurlsa::logonpasswords' at 14:02:10. This technique correlates with MITRE T1003.001 (Credential Dumping). System suggests isolating host.",
          "citations": [
            {
              "source": "mitre_attack_vectors",
              "reference_id": "T1003.001",
              "context": "Adversaries may attempt to access credential material via LSASS..."
            }
          ],
          "token_usage": {
            "prompt_tokens": 512,
            "completion_tokens": 98
          }
        }
        ```

*   **POST** `/api/v1/copilot/translate-query`
    *   *Authentication:* Required (`TIER_1_ANALYST`, `TIER_2_3_RESOLVER`)
    *   *Request Body:*
        ```json
        {
          "natural_language_query": "Find all processes spawned by user admin containing powershell in the path",
          "target_syntax": "KQL"
        }
        ```
    *   *Success Response (200 OK):*
        ```json
        {
          "translated_query": "SecurityEvent | where Account == 'admin' and ProcessName contains 'powershell' | project TimeGenerated, Computer, ProcessName, CommandLine",
          "confidence_score": 0.96,
          "syntax_valid": true
        }
        ```

#### 8.1.4 Playbook Execution & Approval Endpoints
*   **GET** `/api/v1/remediation/suggestions`
    *   *Authentication:* Required (`TIER_1_ANALYST`, `TIER_2_3_RESOLVER`)
    *   *Query Parameters:*
        *   `incident_id` (UUID, required)
    *   *Success Response (200 OK):*
        ```json
        {
          "incident_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
          "suggested_actions": [
            {
              "approval_id": "f5e4d3c2-b1a0-9c8d-7e6f-5a4b3c2b1a0b",
              "action_name": "ISOLATE_HOST_CROWDSTRIKE",
              "target_entity": "WS-FIN-992",
              "requires_approval": true,
              "risk_level": "HIGH",
              "description": "Disconnect host WS-FIN-992 from the corporate network."
            }
          ]
        }
        ```

*   **POST** `/api/v1/remediation/approve`
    *   *Authentication:* Required (Restricted to `TIER_2_3_RESOLVER` only)
    *   *Request Body:*
        ```json
        {
          "approval_id": "f5e4d3c2-b1a0-9c8d-7e6f-5a4b3c2b1a0b",
          "justification": "Threat behavior is verified host encryption, starting immediate isolation."
        }
        ```
    *   *Success Response (200 OK):*
        ```json
        {
          "approval_id": "f5e4d3c2-b1a0-9c8d-7e6f-5a4b3c2b1a0b",
          "status": "APPROVED",
          "triggered_action": "ISOLATE_HOST_CROWDSTRIKE",
          "target": "WS-FIN-992",
          "executed_at": "2026-07-12T22:25:00Z"
        }
        ```

#### 8.1.5 Reporting & Audits Endpoints
*   **GET** `/api/v1/reports/incidents/{id}`
    *   *Authentication:* Required (Any authenticated user)
    *   *Success Response (200 OK - Return PDF payload stream):*
        *   *Headers:* `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="incident-report-a1b2c3d4.pdf"`
*   **GET** `/api/v1/audit/logs`
    *   *Authentication:* Required (`SOC_MANAGER`, `Compliance Auditor` only)
    *   *Query Parameters:*
        *   `limit` (integer, default 100)
        *   `offset` (integer, default 0)
    *   *Success Response (200 OK):*
        ```json
        {
          "audit_logs": [
            {
              "id": 48102,
              "user_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
              "action": "EXECUTE_REMEDIATION_APPROVAL",
              "ip_address": "10.0.4.15",
              "details": {
                "approval_id": "f5e4d3c2-b1a0-9c8d-7e6f-5a4b3c2b1a0b",
                "action_name": "ISOLATE_HOST_CROWDSTRIKE",
                "target": "WS-FIN-992"
              },
              "created_at": "2026-07-12T22:25:01Z"
            }
          ]
        }
        ```

---

## 9. End-to-End System Workflow

The following pipeline maps operations from user login to threat ingestion, analysis, recommendation, dashboard display, containment, and final post-incident summary compilation.

```mermaid
flowchart TD
    Start([User Logs in via Console]) --> Ingest[Ingest Raw Security Alert via API]
    Ingest --> Validate{Payload Schema Validation}
    
    Validate -- Invalid --> Err[Log Ingest Rejection Error]
    Validate -- Valid --> Redact[Run PII Redactor & Store Tokens Mapping]
    
    Redact --> Enqueue[Enqueue Cleaned Log on Message Broker]
    Enqueue --> ThreadIntel[Threat Intel Enricher: Query VT / AlienVault]
    
    ThreadIntel --> Vectorize[Generate Vector Embeddings of Alert Details]
    Vectorize --> RAG_DB[Query ChromaDB for MITRE ATT&CK Matrix Techniques]
    
    RAG_DB --> RiskCalc[Compute Asset Risk Score & Priority]
    RiskCalc --> Storage[Store Enriched Alerts in Elasticsearch & PostgreSQL]
    
    Storage --> DashUpdate[Emit Alert Event via WebSockets to SOC Dashboard]
    DashUpdate --> AnalystView[Analyst Reviews Threat on UI Timeline]
    
    AnalystView --> CopilotQuery[Analyst Chat: Ask Copilot context details]
    CopilotQuery --> Assembly[Orchestrator Assembles Context System Prompt]
    
    Assembly --> LLMCall[LiteLLM: Query Model weight parameters]
    LLMCall --> Decrypt[De-Anonymizer: Restores PII Mapping from Redis]
    
    Decrypt --> Response[Render Explanation and Containment suggestion on Chat]
    Response --> Action{Analyst triggers suggested containment action?}
    
    Action -- No --> Report[Manual Review & Resolve incident]
    Action -- Yes --> AuthVerify{Verify user scope is Tier-2/3 Responder?}
    
    AuthVerify -- Fail --> AuthErr[Access Denied Security Alert]
    AuthVerify -- Pass --> Dispatch[Dispatch containment REST call to EDR Client]
    
    Dispatch --> ExecCheck{EDR Action status returns Success?}
    
    ExecCheck -- Fail --> Retry[Notify Analyst & Log System Failure Exception]
    ExecCheck -- Pass --> Audit[Write Action Signature to Audit Ledger]
    
    Audit --> Compile[Compile Post-Incident RCA & Executive PDF Report]
    Compile --> End([Close Incident File])
```

### Detailed Workflow Step Breakdown
1.  **User Authentication:** The analyst accesses the React UI, inputs credentials, receives a signed JWT token containing active authorization scopes, and starts a secure session.
2.  **Alert Ingestion:** An external EDR hook fires a POST call to the gateway `/api/v1/incidents/ingest`. The gateway validates schemas, checking for structural integrity.
3.  **Sanitization & Parsing:** The parsing pipeline maps values to Elastic Common Schema (ECS). The PII Redactor replaces names and target IPs with UUIDs, writing the translations securely to Redis storage.
4.  **Enrichment & Vector Mapping:** The worker fleet queries Threat Intelligence caches for IoCs. Simultaneously, alert descriptions are vectorized and compared against MITRE ATT&CK collections in ChromaDB.
5.  **Priority Calculation & Storage:** The Risk Engine calculates risk scores. Complete records are saved to Elasticsearch indices, and incidents metadata are logged in PostgreSQL.
6.  **Dashboard Alerting:** WebSockets stream the new incident to active SOC consoles. A warning card pulses in red on the Dashboard console.
7.  **Copilot Investigation:** The analyst opens the incident and runs the chat panel. The prompt triggers a RAG context retrieval, fetching related firewall logs and mitigation guides.
8.  **Model Inference & Verification:** The request, sanitized of PII, is processed by vLLM/OpenAI. The response is de-anonymized via Redis maps and rendered to the analyst, suggesting host isolation.
9.  **Containment Authorization:** The Tier-2 analyst hits the "Approve Isolation" button. The backend validates permissions, logs details, and calls the EDR API to isolate the host.
10. **Report Compilation:** Once isolated, the system triggers the PDF Generator, creating a signed incident report containing the timeline, threat intel, and remediation signatures.

---

## 10. UI/UX Interface Planning & Wireframes

### 10.1 UI/UX Screen Designs

*   **Login Interface:** Focused login pane featuring email/username inputs, password fields, security warning messages, and integration for hardware security keys (WebAuthn/MFA).
*   **SOC Dashboard Main Console:** The principal tracking room. Displays system health, alerts queue, risk levels, threat categories, and target assets tables.
*   **Log Ingestion Management:** Admin dashboard enabling raw JSON/CSV log file uploads and API keys generation.
*   **Incident Queue Hub:** Multi-column tracking workspace showing all open cases, with severity filters, owner dropdowns, and incident status buttons.
*   **Split-Screen Workspace:** The center of investigations. Pane 1 (left) displays the EDR event tree and logs timeline. Pane 2 (right) holds the conversational Copilot chat thread and containment action controls.
*   **Incident Reports Center:** Table showcasing past incidents, with options to download compiled PDF investigations.
*   **Prompt Registry Settings:** Admin-only view to configure integration credentials and modify LLM system instructions.

### 10.2 UI ASCII Wireframe Layouts

#### 10.2.1 Main SOC Console `/dashboard`
```
+--------------------------------------------------------------------------------------------------+
| LOGO | AI SECURITY COPILOT CORE                                [HEALTH: OK] [ROLE: TIER-2] [v] |
+--------------------------------------------------------------------------------------------------+
| (D) Dash   |  +--------------------+  +--------------------+  +--------------------+             |
| (I) Inci   |  | Open Incidents     |  | System Risk Score  |  | Mean Contain MTTR  |             |
| (P) Play   |  |   12   [CRIT: 3]   |  |   74 / 100 [HIGH]  |  |   5.2 Mins  [-12%] |             |
| (S) Sett   |  +--------------------+  +--------------------+  +--------------------+             |
|            |                                                                                     |
|            |  +-------------------------------------------------------------------------------+  |
|            |  | ACTIVE THREATS QUEUE                                           [Filter: Crit] |  |
|            |  +-------------------------------------------------------------------------------+  |
|            |  | SEV      | INCIDENT DESCRIPTION         | TARGET HOST | ASSIGNEE | ACTION     |  |
|            |  |----------|------------------------------|-------------|----------|------------|  |
|            |  | CRITICAL | Ransomware Execution Flow    | WS-FIN-992  | Unassigned| [AI COPI] |  |
|            |  | HIGH     | AWS IAM Policy Bypass        | cloud-prod  | j.doe    | [AI COPI]  |  |
|            |  | MEDIUM   | Persistent SQL Injection     | db-web-01   | s.smith  | [AI COPI]  |  |
|            |  +-------------------------------------------------------------------------------+  |
+--------------------------------------------------------------------------------------------------+
```

#### 10.2.2 Interactive Investigation Split-Screen `/incidents/[id]/investigate`
```
+--------------------------------------------------------------------------------------------------+
| [BACK] | Incident #INC-99120: Ransomware Execution Flow                        [STATUS: PENDING] |
+--------------------------------------------------------------------------------------------------+
| (D) Dash   | PANE 1: SIEM Log Event Timeline          | PANE 2: AI Security Copilot Assistant    |
| (I) Inci   |------------------------------------------|------------------------------------------|
| (P) Play   | - 14:02:01 Host IP lookup from internal  | COPLOT: I ran vector similarity searches |
| (S) Sett   | - 14:02:10 PowerShell Base64 execution   | on this PowerShell command. It matches   |
|            | - 14:02:15 Connection to 185.112.145.2   | MITRE T1059.001 (PowerShell Execution).   |
|            |                                          | The payload was run by user 'admin'.     |
|            | +--------------------------------------+ |                                          |
|            | | Associated Process Tree              | | Suggested Containment Playbook:          |
|            | |  explorer.exe                        | | - Action 1: Isolate Host WS-FIN-992      |
|            | |    └─ powershell.exe                 | | - Action 2: Reset credentials 'admin'    |
|            | |        └─ cmd.exe                    | |                                          |
|            | +--------------------------------------+ | +--------------------------------------+ |
|            |                                          | | CONTAINMENT GATEWAY                  | |
|            | Threat Reputation:                       | | [APPROVE CONTAINMENT]  [DISMISS]     | |
|            | Destination IP: 185.112.145.2 (Malicious) | +--------------------------------------+ |
|            | MD5: 9a8b7c6d5e... (Trojan.Downloader)   | Prompt: [ Type hunting instruction... ]  |
+--------------------------------------------------------------------------------------------------+
```

---

## 11. SOC Dashboard Widget Design

The landing console uses graphical widgets to present real-time threat landscapes and metrics.

```
+-------------------------------------------------------------------------------------+
|                               SOC DASHBOARD WIDGETS                                 |
+--------------------------+---------------------------+------------------------------+
| 1. Active Threats Count  | 2. Risk Score Radial      | 3. Threat Timeline           |
+--------------------------+---------------------------+------------------------------+
| 4. Severity Distribution | 5. Attack Categories      | 6. Source IPs Reputation     |
+--------------------------+---------------------------+------------------------------+
| 7. Top Target Users      | 8. AI Performance Metrics | 9. Remediations Status Steps |
+--------------------------+---------------------------+------------------------------+
```

1.  **Active Threats Count:** Metric summary displaying the number of unresolved incidents. Colors transition dynamically based on criticality (red for critical, orange for high).
2.  **Risk Score Radial:** Graphical indicator showing general enterprise risk score (1-100). Higher weights are assigned for alerts targeting core infrastructure.
3.  **Threat Timeline:** Dynamic bar graph illustrating alert volumes over time, helping analysts detect scanning waves and attack phases.
4.  **Severity Distribution:** Donut chart separating active alerts into Low, Medium, High, and Critical classes.
5.  **Attack Categories:** Vertical bar graph classifying alerts by attack family (e.g., Exfiltration, Privilege Escalation, Command & Control).
6.  **Top Source IPs Table:** List mapping remote IP addresses showing high malicious event ratios, integrated with threat intel shortcuts.
7.  **Top Targeted Users:** Ranks corporate accounts experiencing frequent login failures or privilege modifications.
8.  **AI Performance Panel:** Tracks LLM latency trends, RAG database match confidence, and user feedback ratings for query translations.
9.  **Remediation Status Steps:** Sequential progress tracker displaying ongoing actions (e.g., `Locking AD Account... [OK] -> Sending EDR Isolation API... [PENDING]`).

---

## 12. Scalable Directory Structure

This monorepo layout isolates development files while organizing documentation, playbooks, configuration settings, and deployment pipelines.

```
ai-security-copilot/
├── .github/                        # CI/CD Workflows & actions
├── config/                         # System settings configuration
│   ├── settings.yaml               # Application environment configurations
│   ├── prompts_registry.json       # Versioned system prompt instructions
│   └── elasticsearch_mappings.json # Schema indices mapping structures
├── database/                       # Relational DDL & Vector collections configuration
│   ├── postgresql/
│   │   ├── migrations/             # Schema migration scripts
│   │   └── schema.sql              # Clean installation schemas script
│   └── vector_db/
│       ├── mitre_fixtures.json     # Baseline MITRE ATT&CK JSON vectors
│       └── initialization_run.py   # Embedding seed scripting
├── deployment/                     # Multi-host deployment orchestrations
│   ├── docker-compose.yml          # Local container orchestration file
│   ├── nginx.conf                  # Gateway reverse proxy configurations
│   └── kubernetes/                 # K8s manifest files
├── docs/                           # Architecture specs & diagrams
│   └── software_architecture_document.md
├── frontend/                       # Presentation SPA
│   ├── public/                     # Static media files
│   ├── src/
│   │   ├── assets/                 # Brand styles & layouts files
│   │   ├── components/             # Reusable UI cards, tables, terminals
│   │   ├── hooks/                  # Custom state hooks
│   │   ├── pages/                  # Route layouts
│   │   ├── services/               # Gateway client interfaces
│   │   └── types/                  # TypeScript interface specifications
│   ├── package.json
│   └── tsconfig.json
├── backend/                        # REST Gateway API
│   ├── src/
│   │   ├── api/                    # Route controllers & endpoints
│   │   ├── core/                   # Normalization engines & anonymizers
│   │   ├── models/                 # SQLAlchemy structural models
│   │   ├── schemas/                # Pydantic validation request schemas
│   │   └── services/               # Relational operations & database helpers
│   ├── main.py                     # App execution entrypoint
│   ├── requirements.txt
│   └── Dockerfile
├── workers/                        # Background ingestion processing
│   ├── tasks/
│   │   ├── parser.py               # Normalizer & PII scrub tasks
│   │   ├── enrichment.py           # Threat intel API caller scripts
│   │   └── playbooks.py            # API containment connectors tasks
│   └── celery_app.py               # Celery loop setup
└── ai_engine/                      # RAG & Translation adapter models
    ├── models/
    │   └── adapter.py              # LiteLLM routing layers
    └── translation/
        └── ast_validator.py        # KQL/SQL execution safety parsers
```

---

## 13. Unified Modeling Language (UML) Diagrams

### 13.1 Use Case Diagram

```mermaid
graph TD
    %% Actors
    T1[Tier-1 SOC Analyst]
    T2[Tier-2/3 Incident Responder]
    SM[SOC Manager / Admin]
    Auditor[Compliance Auditor]

    %% Use Cases
    subgraph Use_Cases ["AI Security Copilot System Boundaries"]
        UC_Triage[Investigate Security Alert & Chat]
        UC_Query[Convert NL to SIEM Queries]
        UC_Remediate[Approve & Run Containment Actions]
        UC_Reports[Compile Incident PDF Reports]
        UC_Audits[Audit Prompt History & Settings]
        UC_Prompts[Modify System Prompt Registry]
    end

    %% Mappings
    T1 --> UC_Triage
    T1 --> UC_Query
    T1 --> UC_Reports

    T2 --> UC_Triage
    T2 --> UC_Remediate
    T2 --> UC_Reports

    SM --> UC_Audits
    SM --> UC_Prompts

    Auditor --> UC_Reports
    Auditor --> UC_Audits
```

*   **Explanation:** Highlights actor boundaries. Analysts run alert triage, threat-hunt via query translations, and compile reports. Responders authorize containment playbooks. Administrators edit prompts and view audit histories.

### 13.2 Class Diagram

```mermaid
classDiagram
    class User {
        +UUID id
        +String username
        +String email
        +String password_hash
        +Boolean is_active
        +authenticate() Boolean
        +has_role(role_name) Boolean
    }

    class Role {
        +Int id
        +String name
        +String description
    }

    class Incident {
        +UUID id
        +String title
        +String severity
        +String status
        +Int risk_score
        +Text summary_report
        +assign_to(user_id)
        +update_status(status)
        +compile_report() String
    }

    class IncidentLog {
        +BigInt id
        +String source_name
        +JSONB raw_payload
        +normalize_to_ecs() JSONB
    }

    class ChatSession {
        +UUID id
        +String title
        +DateTime created_at
        +get_memory_buffer(limit) List
    }

    class ChatMessage {
        +UUID id
        +String sender
        +Text raw_content
        +Int tokens_used
        +redact_pii() String
    }

    class Playbook {
        +Int id
        +String name
        +JSONB steps_definition
        +validate_schema() Boolean
    }

    class PlaybookExecution {
        +UUID id
        +String status
        +start_run()
        +execute_step(step_index)
    }

    class HumanApproval {
        +UUID id
        +String action_name
        +JSONB target_payload
        +String status
        +approve(user_id, justification)
        +reject(user_id, justification)
    }

    User "1" *-- "many" UserRole
    Role "1" *-- "many" UserRole
    User "1" -- "many" ChatSession : "starts"
    ChatSession "1" *-- "many" ChatMessage : "contains"
    User "1" -- "many" Incident : "manages"
    Incident "1" *-- "many" IncidentLog : "references"
    Incident "1" -- "many" PlaybookExecution : "triggers"
    Playbook "1" -- "many" PlaybookExecution : "runs"
    PlaybookExecution "1" -- "1" HumanApproval : "requires"
    User "1" -- "many" HumanApproval : "decides"
```

*   **Explanation:** Maps structural tables. An Incident contains many IncidentLogs, and user actions are tied back to base credentials for security logging.

### 13.3 Sequence Diagram: Incident Investigation & Remediation

```mermaid
sequenceDiagram
    autonumber
    actor Analyst as Tier-2 Responder
    participant UI as Dashboard Console
    participant API as FastAPI Engine
    participant Cache as Redis Session
    participant DB as Postgres Relational
    participant LLM as LiteLLM Engine
    participant EDR as EDR Agent API

    Analyst->>UI: Selects incident, click "Investigate"
    UI->>API: GET /api/v1/incidents/{id}/logs
    API->>DB: Query incident logs mapping
    DB-->>API: Return ECS log entities
    API-->>UI: Display event timeline graphics
    
    Analyst->>UI: Types chat: "Isolate host and explain attack"
    UI->>API: POST /api/v1/copilot/chat
    API->>Cache: Pull session context history
    API->>LLM: Dispatch sanitized prompt with context
    LLM-->>API: Return summary & Playbook suggestion
    API-->>UI: Render explanation & "APPROVE ISOLATION" button
    
    Analyst->>UI: Clicks "APPROVE ISOLATION" with reason
    UI->>API: POST /api/v1/remediation/approve {approval_id}
    API->>API: Verify Analyst JWT role scopes
    API->>EDR: Call isolate API endpoint (host ID)
    EDR-->>API: Action response status: Success
    API->>DB: Log action to relational audit database
    API-->>UI: Update containment status stepper: Host Isolated
```

*   **Explanation:** Details processing pathways from the client UI interface, through backend APIs, and out to downstream security controllers.

### 13.4 Activity Diagram: Alert Ingestion and AI Triage

```mermaid
stateDiagram-v2
    [*] --> IngestRawAlert: Alert Received via Webhook
    
    state IngestRawAlert {
        --> SchemaValidation: Validate JSON parameters
    }
    
    SchemaValidation --> DiscardAlert: Validation Failed
    DiscardAlert --> [*]
    
    SchemaValidation --> NormalizeECS: Validation Succeeded
    
    state NormalizeECS {
        --> ExtractEntities: Parse IP, Domain, Hash
        --> RunPIIRedaction: Replace PII fields with UUIDs
    }
    
    RunPIIRedaction --> WriteCache: Write original PII maps to Redis
    WriteCache --> QueueTask: Enqueue Clean alert for processing
    
    state IngestionProcessingWorker {
        QueueTask --> QueryThreatIntel: Call VirusTotal API
        QueryThreatIntel --> VectorizeContext: Calculate embedding string
        VectorizeContext --> MatchMitre: Vector lookup in ChromaDB
    }
    
    MatchMitre --> SaveAlertData: Write enriched document
    
    state SaveAlertData {
        --> WritePostgreSQL: Insert Incident Metadata
        --> WriteElasticsearch: Index Log Data
    }
    
    WriteElasticsearch --> BroadcastWebSocket: Stream Alert Event to UI
    BroadcastWebSocket --> [*]: Dashboard Display Updated
```

*   **Explanation:** Visualizes backend stages. Logs are normalized, sanitized, enriched with external intelligence, mapped to MITRE vectors, and stored.

### 13.5 Component Diagram: API Gateway and Orchestrator

```mermaid
graph TB
    subgraph Gateway_Service ["API Gateway Engine"]
        API[Core API Gateway Controller]
        Auth[JWT Guard / Auth Manager]
        RateLimiter[Token Bucket Rate Limiter]
    end

    subgraph Operations_Core ["Operational Core components"]
        Redactor[PII Anonymizer]
        RAG[Context Retriever Engine]
        Trans[NL-to-Query compiler]
        Remed[Playbook Orchestrator]
    end

    subgraph Storage_Components ["Storage Connectors"]
        Relational[PostgreSQL Client]
        SearchDB[Elasticsearch Client]
        Vector[ChromaDB Client]
        CacheDB[Redis Cache Client]
    end

    %% Connections
    API --> Auth
    API --> RateLimiter
    API --> Redactor
    API --> RAG
    API --> Trans
    API --> Remed
    
    Redactor --> CacheDB
    RAG --> SearchDB
    RAG --> Vector
    Remed --> Relational
```

*   **Explanation:** Details runtime components within the application. The gateway relies on security filters before passing tasks to processing components.

### 13.6 Deployment Diagram: Enterprise Topology

```mermaid
graph TB
    subgraph Client_Enclave ["User Access Domain"]
        Browser[Client Web Browser]
    end

    subgraph DMZ_Network ["Public Demilitarized Zone"]
        NginxProxy[Nginx Load Balancer / TLS Gateway]
    end

    subgraph Private_App_Subnet ["Internal Application Domain"]
        API_App[FastAPI application container nodes]
        Celery_Fleet[Celery Worker engines fleet]
    end

    subgraph Data_Storage_Subnet ["Internal Datastore Domain"]
        Postgres_DB[(PostgreSQL Primary DB)]
        Elastic_DB[(Elasticsearch Index DB)]
        Redis_DB[(Redis cache & Queue)]
        Chroma_DB[(ChromaDB Vector DB)]
    end

    subgraph Isolated_AI_Subnet ["Secure Inference Enclave"]
        LocalInference[Local vLLM Model Server]
    end

    %% Network flows
    Browser -->|HTTPS TLS 1.3| NginxProxy
    NginxProxy -->|Port 8000| API_App
    API_App -->|AMQP| Redis_DB
    Redis_DB -->|Queue fetch| Celery_Fleet
    
    API_App & Celery_Fleet -->|TCP Port 5432| Postgres_DB
    API_App & Celery_Fleet -->|TCP Port 9200| Elastic_DB
    API_App & Celery_Fleet -->|TCP Port 8000| Chroma_DB
    API_App & Celery_Fleet -->|TCP Port 6379| Redis_DB
    
    API_App -->|HTTP Port 8000| LocalInference
```

*   **Explanation:** Maps network segments. Internal database tiers and AI engines are isolated from direct public internet access.

---

## 14. Technology Architecture

To build a reliable platform, we select components that provide high processing performance, secure execution boundaries, and modular compatibility.

```
+---------------------------------------------------------------------------------------+
|                                  TECHNOLOGY STACK                                     |
+--------------------------+---------------------------+--------------------------------+
| Frontend: React/Next.js  | Backend: Python / FastAPI | Database: Postgres / pgvector  |
+--------------------------+---------------------------+--------------------------------+
| Queue: Redis / RabbitMQ  | Log Store: Elasticsearch  | Orchestrator: LangChain        |
+--------------------------+---------------------------+--------------------------------+
| AI Adapt: LiteLLM        | Local Engine: vLLM        | Proxy/WS: Nginx                |
+--------------------------+---------------------------+--------------------------------+
```

### 14.1 Technical Stack & Component Selection

*   **Frontend SPA Framework:** **React / Next.js**
    *   *Justification:* Provides structured server-side rendering pathways and responsive layouts. Simplifies building dynamic components (such as real-time terminal logs and split investigation screens).
*   **API Gateway & Backend:** **Python 3.11 with FastAPI**
    *   *Justification:* Fast performance through python asynchronous concurrency. Built-in OpenAPI compliance provides rapid API key validation and automated model documentation generation.
*   **Background Task Orchestrator:** **Celery with Redis**
    *   *Justification:* Separates long-running log analysis, Threat Intel API queries, and playbook execution steps from client request loops, preventing dashboard freezing.
*   **Search Store & Log Indexer:** **Elasticsearch / OpenSearch**
    *   *Justification:* Standard datastore database for searching massive structured JSON log payloads at high speeds.
*   **Relational Datastore:** **PostgreSQL**
    *   *Justification:* Relational database for core transactional records (users, roles, sessions, incident metadata) requiring strict ACID compliance.
*   **Vector Database:** **pgvector (extension of PostgreSQL) or ChromaDB**
    *   *Justification:* Provides fast cosine-similarity lookups on text embeddings, allowing rapid matching of security alerts against MITRE ATT&CK techniques.
*   **Caching & State Cache:** **Redis**
    *   *Justification:* Low-latency memory store used for session state retention, rate-limiting counters, and storing transient PII redaction maps.
*   **LLM Router Middleware:** **LiteLLM**
    *   *Justification:* Abstract translation layer that exposes a unified API format, allowing administrators to swap LLM backends (OpenAI API to local Llama-3 endpoints) without editing code.
*   **Local Inference Engine:** **vLLM**
    *   *Justification:* High-performance local serving system that optimizes GPU utilization through page-attention techniques, facilitating self-hosted LLM execution.

---

## 15. Security Design

The security design integrates protection layers across authentication, input processing, API routing, and system auditing.

```
+---------------------------------------------------------------------------------------+
|                                    SECURITY LAYERS                                    |
|                                                                                       |
|  [TLS 1.3 Client] --> [Nginx Rate Limiting] --> [JWT RBAC checks] --> [Pydantic Val]  |
|                                                                               |       |
|  [Immutable DB] <--- [Sign Audit Row] <--- [EDR Active Action] <------ [Human Gate]   |
+---------------------------------------------------------------------------------------+
```

### 15.1 Core Security Specifications
*   **JWT Session Authentication:** Users obtain signed JWT tokens using HMAC-SHA256 signatures. Access tokens expire after 60 minutes, requiring rotation keys.
*   **Role-Based Access Control (RBAC):** Backend route handlers enforce role checks (e.g., `@require_role('TIER_2_3_RESOLVER')`) before routing actions to execution APIs.
*   **Data Masking & PII Redactor:** Raw log properties are checked against regex templates and NER models. Discovered emails, credentials, and names are replaced with UUID tokens prior to external AI routing.
*   **API Security & Rate Limiting:**
    *   Requests are filtered by Nginx load limiters using token-bucket checks.
    *   External alert ingest interfaces use cryptographic API keys, rotated monthly.
*   **Input Sanitation & SQL Injection Prevention:** Databases are accessed through SQLalchemy ORM patterns using parameterized queries, preventing payload injection attacks. Input schemas are validated via strict Pydantic structures.
*   **Secure File Ingest Constraints:** File uploads are limited to 50MB, restricted to JSON/CSV formats, scanned for malicious content, and processed in isolated worker threads.
*   **Cryptographic Audit Trail:** To prevent log alteration, each row in the `audit_logs` table features an SHA-256 integrity signature containing the properties of the preceding record, forming an audit chain.
*   **XSS & CSRF Mitigation:** Browser pages use standard security headers:
    ```
    Content-Security-Policy: default-src 'self';
    X-Frame-Options: DENY
    X-Content-Type-Options: nosniff
    ```

---

## 16. Scalability Design

The system must scale dynamically during major cyber attack campaigns, handling alert surges without dashboard degradation.

```mermaid
graph TD
    %% Ingestion Decoupling
    LogTraffic[High EPS Log Traffic] --> IngestGateway[Ingest Gateway API]
    IngestGateway --> QueueBroker[(Celery / Redis Message Queue)]
    
    %% Worker Scaling
    QueueBroker --> Worker1[Worker Pod 1]
    QueueBroker --> Worker2[Worker Pod 2]
    QueueBroker --> Worker3[Worker Pod 3]
    
    %% Compute Isolation
    Worker1 & Worker2 & Worker3 --> DatabaseIndices[(Elasticsearch Index Cluster)]
    
    %% Web Scaling
    AnalystUser[Analyst User Query] --> API_Gateway[FastAPI Web Instance]
    API_Gateway --> CacheStore[(Redis Session Cache)]
    API_Gateway --> LLM_Inference[LiteLLM Router / vLLM Server]
```

### 16.1 Scalability Architectures & Configurations
*   **Decoupled Log Ingestion Queue:** Raw logs are accepted by thin, asynchronous gateway endpoints and written directly to Redis queues. The parsing and threat scoring workloads are processed by separate background worker nodes.
*   **Horizontal Autoscaling Pods:** Application and Worker nodes run in stateless Docker containers. If queue depth exceeds predefined limits, Kubernetes autoscalers scale worker pods.
*   **Database Search Sharding:** Elasticsearch indices are sharded by date fields. Queries targeting specific alert timelines are directed to corresponding database index partitions, avoiding full-table scans.
*   **Caching Strategy:** Threat intelligence reputation calls are cached in Redis for 24 hours. Frequent lookups on identical IP addresses do not trigger API requests to external servers, protecting budgets and rate-limits.
*   **Model Performance Optimizations (vLLM):** Local inference nodes use vLLM servers configured with PagedAttention and continuous batching, allowing the system to handle concurrent analyst chat queries on single GPU systems.

---

## 17. Deployment Architecture

The production setup uses containerized enclaves to isolate application gateways, analytics databases, and inference systems.

### 17.1 Production Environment Variables Template

```ini
# System Core Configuration
ENVIRONMENT=production
SECRET_KEY=c2VjcmV0X2tleV9mb3Jfand0X3NpZ25pbmdfMjAyNl9jb3BpbG90
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Datastores Connections URLs
DATABASE_URL=postgresql://copilot_user:Pr0d_Sec_Db_Pass_2026@pg-db-prod.internal:5432/copilot_metadata
ELASTICSEARCH_URL=https://elastic-cluster.internal:9200
REDIS_URL=redis://:Redis_Secure_Pass_2026@redis-cache.internal:6379/0
VECTOR_DB_PATH=/opt/copilot/chromadb_store

# AI System Configuration Adapter
LLM_PROVIDER=vllm
LLM_MODEL_NAME=meta-llama/Meta-Llama-3-70B-Instruct
VLLM_API_BASE=http://vllm-inference.internal:8000/v1
LITELLM_API_KEY=local-vllm-token-bypass

# External API Integrations (Hashed in Vault)
VIRUSTOTAL_API_KEY=vt_sec_key_48102a77f9
ALIENVAULT_API_KEY=av_otx_secret_99210b35e2
CROWDSTRIKE_CLIENT_ID=cs_client_prod_id_81a
CROWDSTRIKE_CLIENT_SECRET=cs_client_prod_secret_f92

# Ingestion Constraints Settings
MAX_INGEST_FILE_SIZE_MB=50
RATE_LIMIT_REQUESTS_PER_MINUTE=120
```

### 17.2 Enterprise Network Architecture & Deployment Diagram

The network topology separates public interfaces, database tiers, and local inference nodes into distinct virtual networks.

```mermaid
graph TB
    Internet([Public Internet])

    subgraph VPC_Enterprise ["Enterprise Cloud Network VPC (10.0.0.0/16)"]
        
        subgraph DMZ_Subnet ["DMZ Public Subnet (10.0.1.0/24)"]
            LB[Nginx Load Balancer / WAF]
        end

        subgraph Private_App_Subnet ["App Private Subnet (10.0.2.0/24)"]
            API[FastAPI Gateway Instances]
            Celery[Celery Processing Workers]
        end

        subgraph Database_Private_Subnet ["Datastores Private Subnet (10.0.3.0/24)"]
            Postgres[(PostgreSQL Cluster)]
            Elastic[(Elasticsearch Cluster)]
            Redis[(Redis Cache & Queue)]
        end

        subgraph AI_Inference_Subnet ["AI Inference Private Subnet (10.0.4.0/24)"]
            VLLM[vLLM GPU Server Cluster]
        end
    end

    %% Routing
    Internet -->|HTTPS Port 443| LB
    LB -->|HTTP Port 8000| API
    API --> Redis
    Celery --> Redis
    
    API & Celery --> Postgres
    API & Celery --> Elastic
    API & Celery --> VLLM
```

*   **Explanation:** Highlights security zoning. The Nginx reverse proxy sits in the public subnet, while all application nodes, databases, and GPU inference systems are hidden within private subnets, accessible only through defined network ports.

---

## 18. Roadmap & Future System Expansions

To transition the Tier-1 college project into an enterprise security system, several future integrations are planned:

```
+---------------------------------------------------------------------------------------+
|                                    FUTURE ROADMAP                                     |
+--------------------------+---------------------------+--------------------------------+
| 1. Kafka Live Stream     | 2. Multi-Tenant Enclaves  | 3. SIEM Bi-Directional Sync    |
+--------------------------+---------------------------+--------------------------------+
| 4. SOAR Playbooks        | 5. STIX/TAXII Feeds       | 6. Cloud-Native Audits         |
+--------------------------+---------------------------+--------------------------------+
```

1.  **Distributed Stream Processing (Kafka):** Replace Celery log ingestion queues with Apache Kafka to support live event processing speeds exceeding 50,000 Events Per Second (EPS).
2.  **Multi-Tenant Architecture:** Implement row-level security (RLS) policies within the PostgreSQL database to segregate data access profiles for multiple client corporations.
3.  **Bi-directional SIEM Integrations:** Build sync adaptors for popular commercial SIEM solutions (Splunk, Microsoft Sentinel) to read, update, and close alerts directly from the Copilot UI.
4.  **SOAR Orchestration Engines:** Expand the playbook execution module into a Security Orchestration, Automation, and Response (SOAR) engine that can execute complex mitigation workflows.
5.  **Standardized Threat Intel sharing (STIX/TAXII):** Integrate threat sharing feeds to automatically import adversary indicators of compromise.
6.  **Multi-Cloud Incident Auditing:** Design ingestion adaptors that map IAM event traces from AWS, Microsoft Azure, and Google Cloud Platform, providing unified security timelines.
