USE ai_disaster_response;

-- ============================================================
-- PHASE 9 SCHEMA ENHANCEMENT: AUDIT LOG SYSTEM
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
    AUDIT_ID INT NOT NULL,
    USER_ID INT NULL,
    ACTION VARCHAR(100) NOT NULL,
    ENTITY_TYPE VARCHAR(100),
    ENTITY_ID INT NULL,
    DETAILS VARCHAR(500),
    CREATED_TIME DATETIME,
    PRIMARY KEY (AUDIT_ID),
    KEY FK_AUDIT_USER (USER_ID),
    CONSTRAINT FK_AUDIT_USER
        FOREIGN KEY (USER_ID)
        REFERENCES user(USER_ID)
);
