const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

let _db = null;

async function initDb() {
    const SQL = await initSqlJs();
    const DATA_DIR = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const DB_PATH = process.env.DATABASE_PATH || path.join(DATA_DIR, 'job_assistant.db');

    let sqlDb;
    if (fs.existsSync(DB_PATH)) {
        const buffer = fs.readFileSync(DB_PATH);
        sqlDb = new SQL.Database(buffer);
    } else {
        sqlDb = new SQL.Database();
    }

    sqlDb.run('PRAGMA foreign_keys = ON');

    const schemaSQL = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            email TEXT UNIQUE,
            hashed_password TEXT,
            full_name TEXT,
            phone TEXT,
            location TEXT,
            headline TEXT,
            summary TEXT,
            skills TEXT,
            experience_years INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at TEXT,
            updated_at TEXT
        );

        CREATE TABLE IF NOT EXISTS resumes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT,
            original_filename TEXT,
            parsed_content TEXT,
            ats_score INTEGER,
            is_base INTEGER DEFAULT 0,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS tailored_resumes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            resume_id INTEGER,
            job_id INTEGER,
            tailored_content TEXT,
            changes_summary TEXT,
            ats_score INTEGER,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            company TEXT,
            location TEXT,
            description TEXT,
            requirements TEXT,
            salary_range TEXT,
            job_type TEXT,
            experience_level TEXT,
            industry TEXT,
            source TEXT,
            source_url TEXT,
            posted_date TEXT,
            skills_required TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            job_id INTEGER,
            tailored_resume_id INTEGER,
            cover_letter_id INTEGER,
            status TEXT DEFAULT 'draft',
            notes TEXT,
            applied_date TEXT,
            interview_date TEXT,
            follow_up_date TEXT,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS cover_letters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            job_id INTEGER,
            content TEXT,
            tone TEXT,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS interviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            application_id INTEGER,
            user_id INTEGER,
            company TEXT,
            position TEXT,
            interview_date TEXT,
            duration_minutes INTEGER DEFAULT 60,
            interview_type TEXT,
            status TEXT DEFAULT 'scheduled',
            location TEXT,
            notes TEXT,
            prep_notes TEXT,
            follow_up_sent INTEGER DEFAULT 0,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS interview_feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            interview_id INTEGER,
            user_id INTEGER,
            rating INTEGER,
            feedback_notes TEXT,
            questions_asked TEXT,
            next_steps TEXT,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS job_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            name TEXT,
            keywords TEXT,
            location TEXT,
            job_type TEXT,
            experience_level TEXT,
            salary_min REAL,
            industry TEXT,
            frequency TEXT DEFAULT 'daily',
            is_active INTEGER DEFAULT 1,
            last_triggered TEXT,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT,
            message TEXT,
            notification_type TEXT,
            reference_type TEXT,
            reference_id INTEGER,
            is_read INTEGER DEFAULT 0,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS otps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            email TEXT,
            otp_code TEXT,
            reset_token TEXT,
            is_used INTEGER DEFAULT 0,
            expires_at TEXT,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS email_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email_type TEXT,
            name TEXT,
            subject_template TEXT,
            body_template TEXT,
            is_default INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS email_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            email_type TEXT,
            recipient_name TEXT,
            company_name TEXT,
            job_title TEXT,
            subject TEXT,
            body TEXT,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS interview_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            job_title TEXT,
            company TEXT,
            category TEXT,
            question TEXT,
            sample_answer TEXT,
            difficulty TEXT,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS interview_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            job_title TEXT,
            company TEXT,
            question TEXT,
            category TEXT,
            user_answer TEXT,
            score INTEGER,
            feedback TEXT,
            suggestions TEXT,
            confidence_assessment TEXT,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS portfolios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            theme TEXT DEFAULT 'modern',
            custom_css TEXT,
            sections TEXT,
            section_order TEXT,
            generated_html TEXT,
            is_published INTEGER DEFAULT 0,
            created_at TEXT,
            updated_at TEXT
        );

        CREATE TABLE IF NOT EXISTS linkedin_optimizations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            section_name TEXT,
            original_content TEXT,
            optimized_content TEXT,
            suggestions TEXT,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS linkedin_keywords (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            job_title TEXT,
            industry TEXT,
            keywords TEXT,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS career_advice (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            advice_type TEXT,
            input_data TEXT,
            result_data TEXT,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS salary_predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            job_title TEXT,
            location TEXT,
            experience_years INTEGER,
            predicted_min_salary REAL,
            predicted_max_salary REAL,
            predicted_avg_salary REAL,
            currency TEXT,
            percentile_25 REAL,
            percentile_75 REAL,
            confidence_score TEXT
        );

        CREATE TABLE IF NOT EXISTS analytics_snapshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            snapshot_type TEXT,
            data TEXT,
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS user_saved_jobs (
            user_id INTEGER,
            job_id INTEGER,
            saved_at TEXT,
            PRIMARY KEY (user_id, job_id)
        );
    `;

    sqlDb.run(schemaSQL);

    // Persist the initial schema to disk
    const initialData = sqlDb.export();
    const initialBuffer = Buffer.from(initialData);
    fs.writeFileSync(DB_PATH, initialBuffer);

    _db = createWrapper(sqlDb, DB_PATH);
    return _db;
}

function createWrapper(sqlDb, dbPath) {
    function save() {
        const data = sqlDb.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbPath, buffer);
    }

    return {
        prepare(sql) {
            const stmt = sqlDb.prepare(sql);
            return {
                get(...params) {
                    try {
                        if (params.length > 0) {
                            stmt.bind(params);
                        }
                        if (stmt.step()) {
                            const row = stmt.getAsObject();
                            stmt.free();
                            return row;
                        }
                        stmt.free();
                        return undefined;
                    } catch (e) {
                        stmt.free();
                        throw e;
                    }
                },
                all(...params) {
                    try {
                        if (params.length > 0) {
                            stmt.bind(params);
                        }
                        const rows = [];
                        while (stmt.step()) {
                            rows.push(stmt.getAsObject());
                        }
                        stmt.free();
                        return rows;
                    } catch (e) {
                        stmt.free();
                        throw e;
                    }
                },
                run(...params) {
                    try {
                        if (params.length > 0) {
                            stmt.bind(params);
                        }
                        stmt.step();
                        stmt.free();
                        const rowIdResult = sqlDb.exec("SELECT last_insert_rowid() as id");
                        const lastInsertRowid = rowIdResult && rowIdResult[0] && rowIdResult[0].values ? rowIdResult[0].values[0][0] : 0;
                        const changes = sqlDb.getRowsModified();
                        save();
                        return { changes, lastInsertRowid };
                    } catch (e) {
                        stmt.free();
                        throw e;
                    }
                }
            };
        },
        exec(sql) {
            sqlDb.exec(sql);
            save();
        },
        run(sql, params) {
            if (params) {
                sqlDb.run(sql, params);
            } else {
                sqlDb.run(sql);
            }
            save();
        }
    };
}

module.exports = {
    get db() { return _db; },
    initDb
};
