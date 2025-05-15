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
  - **Notification System**: Admin can send notifications to:
    - All students on the platform
    - All teachers on the platform
    - A specific student
    - A specific teacher
    - All students enrolled in a specific course  
    Admin can also view all sent notifications in a dedicated page showing message, target, and course info if applicable.
  - **Payment Report Section**: Fully integrated section to view, filter, and analyze all course payments, with internal tabs and branches for detailed reports.
    - All Payments
    - Payments by Course
    - Pending Payments
    - Successful Payments

- **Teacher Dashboard**:
  - View and manage own courses and lessons
  - Add new courses and lessons
  - **Payment Report Section**: Fully integrated section to view, filter, and analyze all course payments, with internal tabs and branches for detailed reports.
    - All Payments
    - Payments by Course
    - Pending Payments
    - Successful Payments
  - **Student Enrollment Page**: A new page for teachers to view and manage their students' enrollments.
  - **Enrollment Details Page**: New page to show detailed enrollment information for students.

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

✅ About 85% of the core features are complete  
🔧 **Recent Updates**:
  - Fixed issues with course enrollment and payment processing
  - Improved user flow for student course enrollment (both free and paid courses)
  - Enhanced the admin dashboard for better management of courses and users
  - Fixed bugs related to course payment redirection
  - **New Page**: Added a "Student Enrollment" page in the teacher dashboard to manage student enrollments
  - **New Page**: Added an "Enrollment Details" page to manage student enrollment information for teachers
  - **New Section**: Implemented the complete **Payment Report** section in the admin dashboard, with all subpages and detailed tabs

🔧 Remaining: enrollment features, visitor page backend, and additional enhancements

## 🧩 Planned Features

- Platform Earnings Dashboard: A future section to analyze the platform's net revenue by calculating commissions from each transaction.

## 📁 Structure & Notes

- The project is under active development
- More improvements, validation, and optimizations will be added soon

---

Feel free to fork, contribute, or suggest improvements!
