# Education Platform - Node.js

A full-featured educational platform for displaying and selling courses. The system includes 3 types of users:
- Student
- Teacher
- Admin

## 🚀 Key Features

- Authentication system (register, login, logout)
- **Admin Dashboard**:
  - Manage students (list, edit, delete, view, change status, search)
  - Manage teachers (list, add, edit, delete, view)
  - Manage courses (list, add, edit, delete, view details with lessons)
  - Approve/reject pending courses and lessons with rejection reasons
  - Manage categories (list, add, edit, delete, change status, search)
- **Teacher Dashboard**:
  - View and manage own courses and lessons
  - Add new courses and lessons
  - **Student Enrollment Page**: A new page for teachers to view and manage their students' enrollments.

- **Student Dashboard**:
  - View enrolled courses with details and progress
  - Browse and search all courses on the platform
  - Payment system with history view

## 🛠️ Tech Stack

- **Backend**: Node.js, Express
- **Database**: MongoDB with Mongoose
- **Templating Engine**: EJS
- **File Uploads**: Cloudinary
- **UI**: Bootstrap, Admin Templates

## 📌 Project Status

✅ About 80% of the core features are complete  
🔧 **Recent Updates**: 
  - Fixed issues with course enrollment and payment processing
  - Improved user flow for student course enrollment (both free and paid courses)
  - Enhanced the admin dashboard for better management of courses and users
  - Fixed bugs related to course payment redirection
  - **New Page**: Added a "Student Enrollment" page in the teacher dashboard to manage student enrollments.
🔧 Remaining: enrollment features, visitor page backend, and additional enhancements

## 📁 Structure & Notes

- The project is under active development
- More improvements, validation, and optimizations will be added soon

---

Feel free to fork, contribute, or suggest improvements!
