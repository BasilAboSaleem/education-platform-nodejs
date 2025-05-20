# Education Platform - Node.js

A full-featured educational platform for displaying and selling courses. The system includes 3 types of users:  
- Student  
- Teacher  
- Admin

## 🚀 Key Features

- Authentication system (register, login, logout)

- **Profile Section (New)**:  
  - All users (Admin, Teacher, Student) now have access to a dedicated **Profile Page**  
  - The profile displays full user information: name, email, address, phone number, join date, role, and profile image  
  - Users can **edit** the following fields:  
    - Name  
    - Email  
    - Password  
    - Phone Number  
    - Address  
    - Profile Picture

- **Admin Dashboard**:  
  - Manage students (list, edit, delete, view, change status, search)  
  - Manage teachers (list, add, edit, delete, view)  
  - Manage courses (list, add, edit, delete, view details with lessons)  
  - Approve/reject pending courses and lessons with rejection reasons  
  - Manage categories (list, add, edit, delete, change status, search)  
  - **Notification System**:  
    - Admin can send notifications to:  
      - All students on the platform  
      - All teachers on the platform  
      - A specific student  
      - A specific teacher  
      - All students enrolled in a specific course  
    - Admin can view all sent notifications in a dedicated page showing the message, target, and course info (if applicable)  
    - Automatic notifications are triggered in the following scenarios:  
      - When a teacher adds or updates a course → the admin receives a notification  
      - When the admin approves/rejects a course or lesson → the teacher receives a notification  
      - When a course/lesson is approved → all enrolled students receive a notification

  - **Payment Report Section**: Fully integrated section to view, filter, and analyze all course payments, with internal tabs and branches for detailed reports:  
    - All Payments  
    - Payments by Course  
    - Pending Payments  
    - Successful Payments

  - **System Settings (New)**:  
    - Added a **Settings model** to store site-wide configurations  
    - Admin Dashboard now includes a **System Settings** section UI to display and edit settings such as About Section (title, heading, description, button text), Slider items, and more  
    - Frontend form for managing system settings is completed  
    - ✅ **Backend Logic for Settings** is now fully implemented:  
      - Admin can now **fully manage system settings** via the dashboard  
      - This includes editing the **About Section**, **Sliders**, and other key homepage content  
      - Settings are stored persistently in the database and affect what visitors see on the main site

- **Teacher Dashboard**:  
  - View and manage own courses and lessons  
  - Add new courses and lessons  
  - **Notification System**:  
    - A page to **send notifications** to all students enrolled in a specific course  
    - A notification inbox with two tabs:  
      - **Received Notifications**  
      - **Sent Notifications**  
    - Automatic notifications for teachers:  
      - When their course or lesson is approved/rejected by the admin  
      - When a course update is approved or rejected  
  - **Payment Report Section**:  
    - All Payments  
    - Payments by Course  
    - Pending Payments  
    - Successful Payments  
  - **Student Enrollment Page**: A new page for teachers to view and manage their students' enrollments  
  - **Enrollment Details Page**: New page to show detailed enrollment information for students  

- **Student Dashboard**:  
  - View enrolled courses with details and progress  
  - Browse and search all courses on the platform  
  - Payment system with history view  
  - **Notification System**:  
    - A dedicated page to view all received notifications  
    - Automatic notifications are triggered in the following scenarios:  
      - When the student enrolls in any course → the **teacher** of that course receives a notification  
      - When the student completes a payment → the **admin** receives a notification  

## 🛠️ Tech Stack

- **Backend**: Node.js, Express  
- **Database**: MongoDB with Mongoose  
- **Templating Engine**: EJS  
- **File Uploads**: Cloudinary  
- **UI**: Bootstrap, Admin Templates  

## 📌 Project Status

✅ About 90% of the core features are complete  
🔧 **Recent Updates**:  
- Fixed issues with course enrollment and payment processing  
- Improved user flow for student course enrollment (both free and paid courses)  
- Enhanced the admin dashboard for better management of courses and users  
- Fixed bugs related to course payment redirection  
- **New Page**: Added a "Student Enrollment" page in the teacher dashboard to manage student enrollments  
- **New Page**: Added an "Enrollment Details" page to manage student enrollment information for teachers  
- **New Section**: Implemented the complete **Payment Report** section in the admin dashboard, with all subpages and detailed tabs  
- **New Feature**: Added a complete **Notification System** for admin, teacher, and student dashboards, with support for automatic and manual notifications based on actions across the platform  
- **New Feature**: **Profile Pages for All Users** with ability to edit key personal information including name, email, password, phone number, address, and profile picture  
- **New Feature**: **Settings model and Admin System Settings UI** to manage global platform settings like About Section, Sliders, etc.  
- ✅ **Backend Logic for Settings** is now fully implemented:  
  - Admin can now **fully manage system settings** via the dashboard  
  - This includes editing the **About Section**, **Sliders**, and other key homepage content  
  - Settings are stored persistently in the database and affect what visitors see on the main site

🔧 Remaining:  
- Final visitor page dynamic rendering based on settings data  
- Final enrollment features and additional enhancements  

## 🧩 Planned Features

- Platform Earnings Dashboard: A future section to analyze the platform's net revenue by calculating commissions from each transaction.

## 📁 Structure & Notes

- The project is under active development  
- More improvements, validation, and optimizations will be added soon  

---

Feel free to fork, contribute, or suggest improvements!
