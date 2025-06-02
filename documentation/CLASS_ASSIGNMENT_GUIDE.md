# Class Assignment Management Guide

## Overview
The School Management System now includes comprehensive functionality for managing class teacher assignments and student class assignments. This feature allows principals to efficiently organize the school's structure by assigning teachers as class teachers and students to their respective classes.

## Features Implemented

### 1. Class Teacher Assignment
- **Purpose**: Assign teachers as class teachers for specific classes
- **Access**: Principal only
- **Functionality**:
  - View all teachers and their current class assignments
  - Assign unassigned teachers to classes
  - Remove existing class teacher assignments
  - Reassign teachers to different classes

### 2. Student Class Assignment
- **Purpose**: Assign students to their respective classes
- **Access**: Principal only
- **Functionality**:
  - View all students and their current class assignments
  - Assign unassigned students to classes
  - Transfer students between classes
  - Remove students from classes

### 3. Enhanced Class Management
- **Purpose**: Create and manage classes with integrated teacher assignment
- **Access**: Principal only
- **Functionality**:
  - Create new classes with optional class teacher assignment
  - View class details including assigned class teacher
  - Quick access to assignment management

## How to Use

### Accessing Class Assignments

1. **Login as Principal**
   - Username: `principal`
   - Password: `password123`

2. **Navigate to Class Assignments**
   - Option 1: Use the sidebar navigation → "Class Assignments"
   - Option 2: From Classes page → "Manage Assignments" button

### Managing Class Teachers

1. **View Current Assignments**
   - Go to Class Assignments page
   - Select "Class Teachers" tab
   - View table showing all teachers and their assignments

2. **Assign a Teacher as Class Teacher**
   - Find an unassigned teacher in the list
   - Click "Assign Class" button
   - Select the desired class from the modal
   - Confirm assignment

3. **Remove Class Teacher Assignment**
   - Find the assigned teacher in the list
   - Click "Remove" button
   - Assignment will be removed immediately

### Managing Student Classes

1. **View Current Assignments**
   - Go to Class Assignments page
   - Select "Student Classes" tab
   - View table showing all students and their class assignments

2. **Assign Student to Class**
   - Find an unassigned student in the list
   - Click "Assign Class" button
   - Select the desired class from the modal
   - Confirm assignment

3. **Transfer Student to Different Class**
   - Find the assigned student in the list
   - Click "Change Class" button
   - Select the new class from the modal
   - Confirm assignment (old assignment is automatically removed)

4. **Remove Student from Class**
   - Find the assigned student in the list
   - Click "Remove" button
   - Student will be unassigned from their class

### Creating Classes with Teacher Assignment

1. **Navigate to Classes Page**
   - Use sidebar navigation → "Classes"

2. **Create New Class**
   - Click "Add Class" button
   - Fill in required information:
     - Class Name (e.g., "Grade 10-A")
     - Grade Level (1-12)
     - Section (optional, e.g., "A", "Science")
     - Academic Year (e.g., "2024-2025")
     - Class Teacher (optional dropdown)
   - Click "Create Class"

## API Endpoints

### Class Assignments API (`/api/class-assignments`)

#### GET Requests
- `GET /api/class-assignments` - Get all classes
- `GET /api/class-assignments?type=teachers` - Get all teachers with assignments
- `GET /api/class-assignments?type=students` - Get all students with assignments

#### POST Requests
```json
// Assign class teacher
POST /api/class-assignments
{
  "type": "class_teacher",
  "class_id": 1,
  "user_id": 2
}

// Assign student to class
POST /api/class-assignments
{
  "type": "student_class",
  "class_id": 1,
  "user_id": 3
}
```

#### DELETE Requests
- `DELETE /api/class-assignments?type=class_teacher&class_id=1` - Remove class teacher
- `DELETE /api/class-assignments?type=student_class&user_id=3` - Remove student from class

### Enhanced Classes API (`/api/classes`)

#### GET Request
- Returns classes with class teacher information

#### POST Request
```json
POST /api/classes
{
  "name": "Grade 11-Science",
  "grade_level": 11,
  "section": "Science",
  "academic_year": "2024-2025",
  "class_teacher_id": 2
}
```

#### PUT Request
```json
PUT /api/classes
{
  "id": 1,
  "name": "Grade 10-A",
  "grade_level": 10,
  "section": "A",
  "academic_year": "2024-2025",
  "class_teacher_id": 3
}
```

## Database Schema

### Key Relationships
- `classes.class_teacher_id` → `users.id` (Teacher as class teacher)
- `students.class_id` → `classes.id` (Student belongs to class)
- `teachers.user_id` → `users.id` (Teacher profile linked to user)
- `students.user_id` → `users.id` (Student profile linked to user)

### Assignment Rules
1. **Class Teacher Assignment**:
   - Only teachers (users with role='teacher') can be assigned as class teachers
   - Each class can have at most one class teacher
   - A teacher can be class teacher for multiple classes

2. **Student Class Assignment**:
   - Only students (users with role='student') can be assigned to classes
   - Each student can be in at most one class
   - A class can have multiple students

## Security & Authorization

- **Principal Only**: All assignment management features are restricted to users with role='principal'
- **Authentication Required**: All API endpoints require valid authentication tokens
- **Data Validation**: 
  - Validates user roles before assignments
  - Checks if users/classes exist before creating assignments
  - Prevents invalid assignments (e.g., assigning student as class teacher)

## UI Features

### Class Assignments Page
- **Tabbed Interface**: Switch between Class Teachers and Student Classes
- **Search Functionality**: Search teachers/students by name or ID
- **Modal Dialogs**: User-friendly assignment interface
- **Real-time Updates**: Data refreshes after assignments
- **Status Indicators**: Clear visual indicators for assigned/unassigned status

### Enhanced Classes Page
- **Assignment Button**: Quick access to assignment management
- **Class Details**: Shows assigned class teacher information
- **Create Modal**: Integrated class teacher selection during class creation

## Sample Data

The system comes with sample data:
- **Principal**: username: `principal`, password: `password123`
- **Teachers**: 
  - Sarah Johnson (teacher1/password123) - Employee ID: T001
  - Michael Brown (teacher2/password123) - Employee ID: T002
- **Students**:
  - Emma Davis (student1/password123) - Student ID: S001
  - Alex Wilson (student2/password123) - Student ID: S002
- **Classes**:
  - Grade 10-A (assigned to Sarah Johnson)
  - Grade 9-B (no class teacher assigned)

## Testing the Functionality

1. **Login as Principal**
2. **Test Class Teacher Assignment**:
   - Go to Class Assignments → Class Teachers tab
   - Assign Michael Brown to Grade 9-B
   - Verify assignment appears in the table
3. **Test Student Assignment**:
   - Go to Class Assignments → Student Classes tab
   - Assign Alex Wilson to Grade 9-B
   - Verify assignment appears in the table
4. **Test Class Creation**:
   - Go to Classes page
   - Create new class with teacher assignment
   - Verify class appears with assigned teacher

## Troubleshooting

### Common Issues
1. **403 Forbidden**: Ensure you're logged in as principal
2. **Assignment Fails**: Check that users exist and have correct roles
3. **Data Not Updating**: Refresh the page or check browser console for errors

### Error Messages
- "Only principals can manage class assignments" - Login as principal
- "Selected user is not a teacher" - Ensure you're assigning a teacher as class teacher
- "Selected user is not a student" - Ensure you're assigning a student to a class

This comprehensive class assignment system provides a solid foundation for managing the organizational structure of the school, with intuitive interfaces and robust backend validation.
