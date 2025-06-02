// Enhanced database schema to support class-specific subjects
const Database = require('better-sqlite3');

const db = new Database('school.db');

console.log('=== Creating Class-Subjects Relationship ===\n');

try {
    // 1. Create class_subjects table to define which subjects are offered in each class
    console.log('1. Creating class_subjects table...');
    db.exec(`
        CREATE TABLE IF NOT EXISTS class_subjects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            class_id INTEGER NOT NULL,
            subject_id INTEGER NOT NULL,
            is_mandatory BOOLEAN DEFAULT true,
            credits INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
            FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
            UNIQUE(class_id, subject_id)
        )
    `);
    console.log('✅ class_subjects table created');

    // 2. Populate class_subjects based on current class structure
    console.log('\n2. Populating class_subjects with appropriate subjects...');
    
    // Get all classes
    const classes = db.prepare('SELECT * FROM classes').all();
    
    // Define subjects for each grade level
    const gradeSubjects = {
        9: [1, 2, 3, 4, 5, 6, 7, 8], // Grade 9: Math, Physics, Chemistry, Biology, English, Hindi, History, Geography
        10: [1, 2, 3, 4, 5, 6, 9, 10] // Grade 10: Math, Physics, Chemistry, Biology, English, Hindi, Computer Science, PE
    };
    
    // Insert class-subject relationships
    const insertClassSubject = db.prepare(`
        INSERT OR IGNORE INTO class_subjects (class_id, subject_id, is_mandatory, credits)
        VALUES (?, ?, ?, ?)
    `);
    
    let insertCount = 0;
    for (const classItem of classes) {
        const subjects = gradeSubjects[classItem.grade_level] || [];
          for (const subjectId of subjects) {
            // Core subjects are mandatory, others are optional
            const isMandatory = subjectId <= 6 ? 1 : 0; // Math, Physics, Chemistry, Biology, English, Hindi
            const credits = subjectId === 10 ? 0.5 : 1; // PE has 0.5 credits
            
            insertClassSubject.run(classItem.id, subjectId, isMandatory, credits);
            insertCount++;
        }
    }
    
    console.log(`✅ Inserted ${insertCount} class-subject relationships`);

    // 3. Display the class-subjects mapping
    console.log('\n3. Class-Subject Assignments:');
    const classSubjects = db.prepare(`
        SELECT 
            c.name as class_name,
            s.name as subject_name,
            s.code as subject_code,
            cs.is_mandatory,
            cs.credits
        FROM class_subjects cs
        JOIN classes c ON cs.class_id = c.id
        JOIN subjects s ON cs.subject_id = s.id
        ORDER BY c.grade_level, c.section, s.name
    `).all();

    // Group by class
    const classMappings = {};
    classSubjects.forEach(item => {
        if (!classMappings[item.class_name]) {
            classMappings[item.class_name] = [];
        }
        classMappings[item.class_name].push({
            subject: `${item.subject_name} (${item.subject_code})`,
            mandatory: item.is_mandatory ? 'Yes' : 'No',
            credits: item.credits
        });
    });

    for (const [className, subjects] of Object.entries(classMappings)) {
        console.log(`\n${className}:`);
        subjects.forEach(subject => {
            console.log(`  - ${subject.subject} | Mandatory: ${subject.mandatory} | Credits: ${subject.credits}`);
        });
    }

    // 4. Verify teacher assignments align with class subjects
    console.log('\n4. Verifying Teacher-Subject-Class Alignments:');
    const teacherAlignments = db.prepare(`
        SELECT 
            u.first_name || ' ' || u.last_name as teacher_name,
            c.name as class_name,
            s.name as subject_name,
            CASE 
                WHEN cs.id IS NOT NULL THEN 'Aligned' 
                ELSE 'Misaligned' 
            END as status
        FROM teacher_subjects ts
        JOIN teachers t ON ts.teacher_id = t.id
        JOIN users u ON t.user_id = u.id
        JOIN classes c ON ts.class_id = c.id
        JOIN subjects s ON ts.subject_id = s.id
        LEFT JOIN class_subjects cs ON ts.class_id = cs.class_id AND ts.subject_id = cs.subject_id
        ORDER BY u.first_name, c.name, s.name
    `).all();

    const alignedCount = teacherAlignments.filter(a => a.status === 'Aligned').length;
    const totalCount = teacherAlignments.length;
    
    console.log(`✅ Teacher assignments: ${alignedCount}/${totalCount} properly aligned`);
    
    if (alignedCount < totalCount) {
        console.log('\nMisaligned assignments:');
        teacherAlignments.filter(a => a.status === 'Misaligned').forEach(assignment => {
            console.log(`  ⚠️  ${assignment.teacher_name} teaching ${assignment.subject_name} in ${assignment.class_name}`);
        });
    }

    // 5. Create indexes for better performance
    console.log('\n5. Creating performance indexes...');
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_class_subjects_class ON class_subjects(class_id);
        CREATE INDEX IF NOT EXISTS idx_class_subjects_subject ON class_subjects(subject_id);
        CREATE INDEX IF NOT EXISTS idx_teacher_subjects_class ON teacher_subjects(class_id);
    `);
    console.log('✅ Performance indexes created');

    console.log('\n=== Class-Subjects Enhancement Complete ===');
    console.log('✅ Each class now has its own set of subjects');
    console.log('✅ Teacher assignments verified against class subjects');
    console.log('✅ Database schema enhanced for better organization');
    
} catch (error) {
    console.error('❌ Error enhancing class-subjects schema:', error.message);
} finally {
    db.close();
}
