USE ai_disaster_response;

-- ============================================================
-- 1. USER
-- ============================================================

CREATE TABLE IF NOT EXISTS USER (
    USER_ID INTEGER PRIMARY KEY,
    USER_NAME VARCHAR(100),
    EMAIL VARCHAR(100),
    PHONE VARCHAR(15),
    ROLE VARCHAR(20),
    PASSWORD VARCHAR(255)
);

-- ============================================================
-- 2. INCIDENT
-- ============================================================

CREATE TABLE IF NOT EXISTS INCIDENT (
    INCIDENT_ID INTEGER PRIMARY KEY,
    INCIDENT_TYPE VARCHAR(50),
    SEVERITY VARCHAR(20),
    DESCRIPTION VARCHAR(255),
    LATITUDE DECIMAL(10,6),
    LONGITUDE DECIMAL(10,6),
    STATUS VARCHAR(20),
    REPORTED_TIME DATETIME
);

-- ============================================================
-- 3. ALERT
-- ============================================================

CREATE TABLE IF NOT EXISTS ALERT (
    ALERT_ID INTEGER PRIMARY KEY,
    TITLE VARCHAR(150),
    MESSAGE VARCHAR(255),
    PRIORITY VARCHAR(20),
    ALERT_TIME DATETIME
);

-- ============================================================
-- 4. RESPONSE_TEAM
-- ============================================================

CREATE TABLE IF NOT EXISTS RESPONSE_TEAM (
    TEAM_ID INTEGER PRIMARY KEY,
    TEAM_NAME VARCHAR(100),
    LEADER VARCHAR(100),
    SPECIALIZATION VARCHAR(100),
    AVAILABILITY VARCHAR(20),
    LATITUDE DECIMAL(10,6),
    LONGITUDE DECIMAL(10,6)
);

-- ============================================================
-- 5. VOLUNTEER
-- ============================================================

CREATE TABLE IF NOT EXISTS VOLUNTEER (
    VOLUNTEER_ID INTEGER PRIMARY KEY,
    VOLUNTEER_NAME VARCHAR(100),
    PHONE VARCHAR(15),
    SKILLS VARCHAR(200),
    AVAILABILITY VARCHAR(20),
    TEAM_ID INTEGER,

    CONSTRAINT FK_VOLUNTEER_TEAM
        FOREIGN KEY (TEAM_ID)
        REFERENCES RESPONSE_TEAM(TEAM_ID)
);

-- ============================================================
-- 6. SHELTER
-- ============================================================

CREATE TABLE IF NOT EXISTS SHELTER (
    SHELTER_ID INTEGER PRIMARY KEY,
    SHELTER_NAME VARCHAR(150),
    CAPACITY INTEGER,
    AVAILABLE_SPACES INTEGER,
    LOCATION VARCHAR(150)
);

-- ============================================================
-- 7. RESOURCE
-- ============================================================

CREATE TABLE IF NOT EXISTS RESOURCE (
    RESOURCE_ID INTEGER PRIMARY KEY,
    RESOURCE_NAME VARCHAR(150),
    CATEGORY VARCHAR(100),
    QUANTITY INTEGER,
    AVAILABILITY VARCHAR(20),
    LOCATION VARCHAR(150)
);

-- ============================================================
-- 8. RESOURCE_ALLOCATION
-- ============================================================

CREATE TABLE IF NOT EXISTS RESOURCE_ALLOCATION (
    ALLOCATION_ID INTEGER PRIMARY KEY,
    INCIDENT_ID INTEGER,
    RESOURCE_ID INTEGER,
    QUANTITY INTEGER,
    ASSIGNED_TIME DATETIME,
    STATUS VARCHAR(20),

    CONSTRAINT FK_ALLOCATION_INCIDENT
        FOREIGN KEY (INCIDENT_ID)
        REFERENCES INCIDENT(INCIDENT_ID),

    CONSTRAINT FK_ALLOCATION_RESOURCE
        FOREIGN KEY (RESOURCE_ID)
        REFERENCES RESOURCE(RESOURCE_ID)
);

-- ============================================================
-- 9. AI_PREDICTION
-- ============================================================

CREATE TABLE IF NOT EXISTS AI_PREDICTION (
    PREDICTION_ID INTEGER PRIMARY KEY,
    INCIDENT_ID INTEGER,
    RISK_LEVEL VARCHAR(20),
    CONFIDENCE DECIMAL(5,2),
    SUGGESTED_ACTION VARCHAR(255),
    PREDICTION_TIME DATETIME,

    CONSTRAINT FK_PREDICTION_INCIDENT
        FOREIGN KEY (INCIDENT_ID)
        REFERENCES INCIDENT(INCIDENT_ID)
);

-- ============================================================
-- 10. DAMAGE_REPORT
-- ============================================================

CREATE TABLE IF NOT EXISTS DAMAGE_REPORT (
    REPORT_ID INTEGER PRIMARY KEY,
    DAMAGE_LEVEL VARCHAR(20),
    ESTIMATED_LOSS DECIMAL(12,2),
    DESCRIPTION VARCHAR(255),
    PHOTO VARCHAR(255)
);

-- ============================================================
-- 11. INCIDENT_DISPATCH (Phase 5 Approved Junction Table)
-- ============================================================

CREATE TABLE IF NOT EXISTS INCIDENT_DISPATCH (
    DISPATCH_ID INTEGER PRIMARY KEY,
    INCIDENT_ID INTEGER NOT NULL,
    TEAM_ID INTEGER NOT NULL,
    DISPATCH_TIME DATETIME,
    STATUS VARCHAR(20),

    CONSTRAINT FK_DISPATCH_INCIDENT
        FOREIGN KEY (INCIDENT_ID)
        REFERENCES INCIDENT(INCIDENT_ID),

    CONSTRAINT FK_DISPATCH_TEAM
        FOREIGN KEY (TEAM_ID)
        REFERENCES RESPONSE_TEAM(TEAM_ID)
);

-- ============================================================
-- 12. INCIDENT_SHELTER (Phase 7 Approved Junction Table)
-- ============================================================

CREATE TABLE IF NOT EXISTS INCIDENT_SHELTER (
    ASSIGNMENT_ID INTEGER PRIMARY KEY,
    INCIDENT_ID INTEGER NOT NULL,
    SHELTER_ID INTEGER NOT NULL,
    ASSIGNED_SPACES INTEGER NOT NULL,
    ASSIGNED_TIME DATETIME,
    STATUS VARCHAR(20),

    CONSTRAINT FK_INCIDENT_SHELTER_INCIDENT
        FOREIGN KEY (INCIDENT_ID)
        REFERENCES INCIDENT(INCIDENT_ID),

    CONSTRAINT FK_INCIDENT_SHELTER_SHELTER
        FOREIGN KEY (SHELTER_ID)
        REFERENCES SHELTER(SHELTER_ID)
);
