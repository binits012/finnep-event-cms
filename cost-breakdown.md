# Development Cost Breakdown - Finnep Event App CMS
## Internal Employee Costs (Finnish Market)

### Executive Summary

**Total Project Cost: €20,000 - €28,000**

This document provides a detailed cost breakdown for developing the Finnep Event App CMS (Content Management System) using internal employees in the Finnish market, including all employer costs and overhead.

---

## Application Overview

### What is Finnep Event App CMS?

Finnep Event App CMS is a comprehensive content management system built with Next.js 14 and React 18, designed to provide administrators and staff with a powerful interface to manage events, tickets, users, photos, notifications, and other content for the Finnep Event App platform.

### Key Features

#### 1. Dashboard & Analytics
- **Comprehensive Dashboard:** Real-time dashboard with key metrics and statistics
- **Chart Visualizations:** Bar charts and line charts using Chart.js
- **Event Statistics:** Upcoming events, past events, and event status tracking
- **Ticket Analytics:** Ticket sales trends, ticket type distribution
- **Sales Trends:** Time-based sales trend visualization
- **Revenue Tracking:** Revenue and sales performance metrics
- **Data Aggregation:** Real-time data aggregation from backend API

#### 2. Event Management
- **Event CRUD Operations:** Create, read, update, and delete events
- **Event Listing:** Paginated event list with search and filtering
- **Event Cards:** Visual event cards with images and details
- **Event Search:** Advanced search functionality
- **Event Filtering:** Filter by country, merchant, status, date
- **Event Sorting:** Sort by date, title, status, and other criteria
- **Event Status Management:** Active/inactive event status toggle
- **Featured Events:** Featured event configuration with priority and types
- **Event Photos:** Multiple photo upload and management
- **Event Details:** Comprehensive event information management
- **Timezone Support:** Timezone-aware event date/time handling
- **Rich Text Editor:** Rich text editing for event descriptions (React Quill)
- **Date/Time Pickers:** Advanced date and time picker components (MUI X Date Pickers)

#### 3. Ticket Management
- **Ticket Listing:** View all tickets with event association
- **Ticket Issuance:** Issue tickets for events
- **Ticket Search:** Search tickets by event
- **Ticket Details:** View detailed ticket information
- **Ticket Status:** Track ticket status and availability
- **Data Grid:** Advanced data grid with sorting and filtering (MUI X Data Grid)

#### 4. User Management
- **User CRUD Operations:** Create, read, update, and delete users
- **User Roles:** Admin, Staff, and Member role management
- **User Status:** Enable/disable user accounts
- **User Search:** Search users by name, email, role
- **User Details:** View and edit user information
- **User Permissions:** Role-based permission management
- **User Data Grid:** Advanced user data grid with actions

#### 5. Photo/Gallery Management
- **Photo Upload:** Multiple photo upload with drag-and-drop
- **Photo Gallery:** Visual photo gallery with lightbox
- **Photo Management:** Add, edit, delete photos
- **Photo Preview:** Image preview and editing capabilities
- **File Upload:** FilePond integration for advanced file uploads
- **Image Editing:** Image editing with Pintura integration
- **Photo Modal:** Photo viewing modal with navigation

#### 6. Notification Management
- **Notification CRUD:** Create, read, update, delete notifications
- **Notification List:** List all notifications
- **Notification Status:** Active/inactive notification management
- **Notification Preview:** Preview notification content

#### 7. Merchant Management
- **Merchant Listing:** View all merchants
- **Merchant Details:** View merchant information
- **Merchant Filtering:** Filter events by merchant

#### 8. Front Page Management
- **Front Page Content:** Manage front page content
- **Content Editing:** Edit front page sections

#### 9. Lineup Management
- **Lineup Content:** Manage event lineup information
- **Lineup Editing:** Edit lineup details

#### 10. Authentication & Authorization
- **Login System:** Secure login with JWT tokens
- **Role-Based Access:** Role-based access control (RBAC)
- **Session Management:** Cookie-based session management
- **Protected Routes:** Route protection with gateway component
- **Token Management:** JWT token handling and validation

#### 11. State Management
- **Redux Toolkit:** Modern Redux with Redux Toolkit
- **Redux Saga:** Side effect management with Redux Saga
- **State Slices:** User and photo type state slices
- **Store Configuration:** Centralized store configuration
- **Middleware:** Saga middleware for async operations

#### 12. Form Management
- **Formik Integration:** Form handling with Formik
- **Form Validation:** Yup schema validation
- **Form Components:** Reusable form components
- **Form Sections:** Organized form sections
- **Form Error Handling:** Comprehensive error handling
- **Dynamic Forms:** Dynamic form fields for tickets and other data

#### 13. UI Components & Design
- **Material-UI (MUI):** Comprehensive MUI component library
- **Styled Components:** CSS-in-JS styling with styled-components
- **Custom Components:** Custom reusable components
- **Responsive Design:** Fully responsive design for all screen sizes
- **Mobile Sidebar:** Mobile-responsive sidebar navigation
- **Navigation Bar:** Top navigation bar with user info
- **Sidebar:** Collapsible sidebar with menu items
- **Breadcrumbs:** Custom breadcrumb navigation
- **Modals:** Reusable modal components
- **Loading States:** Loading indicators and backdrops
- **Error Boundaries:** Error boundary components

#### 14. File Upload & Image Handling
- **FilePond Integration:** Advanced file upload with FilePond
- **Image Preview:** Image preview before upload
- **Image Editing:** Pintura image editor integration
- **Drag & Drop:** Drag-and-drop file upload
- **Multiple Files:** Support for multiple file uploads
- **File Validation:** File type and size validation
- **Upload Progress:** Upload progress indicators

#### 15. Data Visualization
- **Chart.js Integration:** Chart.js for data visualization
- **Bar Charts:** Bar chart components
- **Line Charts:** Line chart components
- **Chart Configuration:** Customizable chart configurations
- **Real-time Data:** Real-time data updates for charts

#### 16. Rich Text Editing
- **React Quill:** Rich text editor integration
- **Text Formatting:** Text formatting options
- **HTML Content:** HTML content editing
- **Content Preview:** Content preview functionality

#### 17. Date & Time Management
- **Day.js Integration:** Date manipulation with Day.js
- **MUI X Date Pickers:** Advanced date/time picker components
- **Timezone Support:** Timezone-aware date handling
- **Date Formatting:** Date formatting utilities
- **Date Validation:** Date validation and constraints

#### 18. API Integration
- **Axios Integration:** HTTP client with Axios
- **API Handler:** Centralized API request handler
- **Error Handling:** Comprehensive API error handling
- **Request Interceptors:** Request/response interceptors
- **Authentication Headers:** Automatic authentication header injection

#### 19. Notifications & Alerts
- **React Toastify:** Toast notifications
- **React Hot Toast:** Hot toast notifications
- **SweetAlert2:** Beautiful alert dialogs
- **Success Messages:** Success notification handling
- **Error Messages:** Error notification handling
- **Warning Messages:** Warning notification handling

#### 20. Testing
- **Jest Testing:** Unit testing with Jest
- **React Testing Library:** Component testing
- **Test Coverage:** Test coverage for key components
- **Test Utilities:** Testing utilities and helpers

#### 21. Additional Features
- **PDF Generation:** PDF generation with jsPDF
- **Copy to Clipboard:** Copy functionality for data
- **JSON Viewer:** JSON data viewer component
- **Lightbox:** Image lightbox with navigation
- **Error Fallback:** Error fallback UI components
- **Loading Spinners:** Various loading spinner components

### Technical Architecture

- **Framework:** Next.js 14 with App Router
- **UI Library:** React 18
- **State Management:** Redux Toolkit with Redux Saga
- **UI Components:** Material-UI (MUI) v5
- **Styling:** Styled Components
- **Form Handling:** Formik with Yup validation
- **HTTP Client:** Axios
- **Charts:** Chart.js with react-chartjs-2
- **File Upload:** FilePond
- **Image Editing:** Pintura
- **Rich Text Editor:** React Quill
- **Date Handling:** Day.js and MUI X Date Pickers
- **Notifications:** React Toastify, React Hot Toast, SweetAlert2
- **Testing:** Jest with React Testing Library

### Target Market

The CMS serves:
- **Administrators:** System administrators managing the platform
- **Staff Members:** Staff managing events and content
- **Content Managers:** Content managers creating and editing events
- **Event Organizers:** Event organizers managing their events

### Business Value

The CMS enables:
- **Efficient Content Management:** Streamlined content creation and editing
- **User Management:** Comprehensive user and role management
- **Event Control:** Full control over event creation and management
- **Analytics & Insights:** Dashboard with key metrics and analytics
- **Scalability:** Handles large amounts of content and users
- **User-Friendly Interface:** Intuitive UI for non-technical users
- **Real-time Updates:** Real-time data updates and synchronization

---

## 1. Finnish Market Rates (2024-2025)

### Monthly Salaries
- **Junior Developer:** €3,500 - €4,400/month
- **Mid-Level Developer:** €4,200 - €5,500/month
- **Senior Developer:** €5,300 - €7,000/month

### Hourly Rates (160 working hours/month)
- **Junior Developer:** €21.88 - €27.50/hour
- **Mid-Level Developer:** €26.25 - €34.38/hour
- **Senior Developer:** €33.13 - €43.75/hour

### Total Employer Cost (Salary + 25% Employer Contributions)
- **Junior Developer:** €27.34 - €34.38/hour
- **Mid-Level Developer:** €32.81 - €42.98/hour
- **Senior Developer:** €41.41 - €54.69/hour

> **Note:** Employer contributions include:
> - Social security (TyEL): ~17%
> - Unemployment insurance: ~1.5%
> - Accident insurance: ~0.5%
> - Other statutory costs: ~6%
> - **Total: ~25%**

---

## 2. Detailed Cost Breakdown by Component

### 2.1 Core Infrastructure & Setup
- **Description:** Next.js 14 setup, project structure, environment configuration, routing
- **Hours:** 18-22 hours
- **Rate:** €35/hour (Mid-level)
- **Cost:** €630 - €770

### 2.2 Authentication & Authorization
- **Description:** Login system, JWT handling, protected routes, role-based access
- **Hours:** 25-32 hours
- **Rate:** €40/hour (Senior)
- **Cost:** €1,000 - €1,280

### 2.3 Dashboard & Analytics
- **Description:** Dashboard layout, Chart.js integration, data visualization, metrics
- **Hours:** 35-45 hours
- **Rate:** €35/hour (Mid-level)
- **Cost:** €1,225 - €1,575

### 2.4 Event Management
- **Description:** Event CRUD, listing, search, filtering, sorting, featured events, forms
- **Hours:** 60-75 hours
- **Rate:** €35/hour (Mid-level)
- **Cost:** €2,100 - €2,625

### 2.5 Ticket Management
- **Description:** Ticket listing, issuance, search, data grid, ticket details
- **Hours:** 30-40 hours
- **Rate:** €35/hour (Mid-level)
- **Cost:** €1,050 - €1,400

### 2.6 User Management
- **Description:** User CRUD, role management, status toggle, search, data grid
- **Hours:** 35-45 hours
- **Rate:** €35/hour (Mid-level)
- **Cost:** €1,225 - €1,575

### 2.7 Photo/Gallery Management
- **Description:** Photo upload, gallery, FilePond integration, image editing, lightbox
- **Hours:** 40-50 hours
- **Rate:** €35/hour (Mid-level)
- **Cost:** €1,400 - €1,750

### 2.8 Notification Management
- **Description:** Notification CRUD, listing, status management
- **Hours:** 20-28 hours
- **Rate:** €35/hour (Mid-level)
- **Cost:** €700 - €980

### 2.9 Merchant Management
- **Description:** Merchant listing, details, filtering
- **Hours:** 15-20 hours
- **Rate:** €35/hour (Mid-level)
- **Cost:** €525 - €700

### 2.10 State Management (Redux)
- **Description:** Redux Toolkit setup, Redux Saga, state slices, store configuration
- **Hours:** 30-40 hours
- **Rate:** €40/hour (Senior)
- **Cost:** €1,200 - €1,600

### 2.11 Form Management
- **Description:** Formik integration, Yup validation, form components, dynamic forms
- **Hours:** 35-45 hours
- **Rate:** €35/hour (Mid-level)
- **Cost:** €1,225 - €1,575

### 2.12 UI Components & Design
- **Description:** MUI integration, styled components, custom components, responsive design
- **Hours:** 50-65 hours
- **Rate:** €35/hour (Mid-level)
- **Cost:** €1,750 - €2,275

### 2.13 File Upload & Image Handling
- **Description:** FilePond setup, image preview, Pintura integration, drag & drop
- **Hours:** 30-40 hours
- **Rate:** €35/hour (Mid-level)
- **Cost:** €1,050 - €1,400

### 2.14 Rich Text Editing
- **Description:** React Quill integration, text formatting, HTML content editing
- **Hours:** 20-28 hours
- **Rate:** €35/hour (Mid-level)
- **Cost:** €700 - €980

### 2.15 Date & Time Management
- **Description:** Day.js setup, MUI X Date Pickers, timezone support, date utilities
- **Hours:** 25-35 hours
- **Rate:** €35/hour (Mid-level)
- **Cost:** €875 - €1,225

### 2.16 API Integration
- **Description:** Axios setup, API handler, error handling, interceptors
- **Hours:** 25-32 hours
- **Rate:** €35/hour (Mid-level)
- **Cost:** €875 - €1,120

### 2.17 Notifications & Alerts
- **Description:** React Toastify, React Hot Toast, SweetAlert2 integration
- **Hours:** 15-20 hours
- **Rate:** €35/hour (Mid-level)
- **Cost:** €525 - €700

### 2.18 Additional Features
- **Description:** PDF generation, copy to clipboard, JSON viewer, lightbox, error fallback
- **Hours:** 25-35 hours
- **Rate:** €35/hour (Mid-level)
- **Cost:** €875 - €1,225

### 2.19 Testing & QA
- **Description:** Jest setup, React Testing Library, test coverage, bug fixes
- **Hours:** 30-40 hours
- **Rate:** €35/hour (Mid-level)
- **Cost:** €1,050 - €1,400

### 2.20 Documentation
- **Description:** Code documentation, component documentation, setup guides
- **Hours:** 12-18 hours
- **Rate:** €30/hour (Junior/Mid)
- **Cost:** €360 - €540

---

## 3. Cost Summary Table

| Component | Low (€) | High (€) |
|-----------|---------|----------|
| Core Infrastructure | 630 | 770 |
| Authentication & Authorization | 1,000 | 1,280 |
| Dashboard & Analytics | 1,225 | 1,575 |
| Event Management | 2,100 | 2,625 |
| Ticket Management | 1,050 | 1,400 |
| User Management | 1,225 | 1,575 |
| Photo/Gallery Management | 1,400 | 1,750 |
| Notification Management | 700 | 980 |
| Merchant Management | 525 | 700 |
| State Management (Redux) | 1,200 | 1,600 |
| Form Management | 1,225 | 1,575 |
| UI Components & Design | 1,750 | 2,275 |
| File Upload & Image Handling | 1,050 | 1,400 |
| Rich Text Editing | 700 | 980 |
| Date & Time Management | 875 | 1,225 |
| API Integration | 875 | 1,120 |
| Notifications & Alerts | 525 | 700 |
| Additional Features | 875 | 1,225 |
| Testing & QA | 1,050 | 1,400 |
| Documentation | 360 | 540 |
| **SUBTOTAL** | **18,245** | **23,530** |

---

## 4. Additional Costs

### 4.1 Project Management (10%)
- **Cost:** €1,825 - €2,353

### 4.2 Code Reviews & Quality Assurance (5%)
- **Cost:** €912 - €1,177

### 4.3 Meetings & Coordination (5%)
- **Cost:** €912 - €1,177

### 4.4 Contingency (10%)
- **Cost:** €1,825 - €2,353

**Total Additional Costs:** €5,474 - €7,060

---

## 5. Total Project Cost

**Development Cost:**
- Low: €18,245
- High: €23,530

**Additional Costs:**
- €5,474 - €7,060

**TOTAL PROJECT COST:**
- **Low: €23,719**
- **High: €30,590**

**Most Likely Scenario: €25,000 - €28,000**

---

## 6. Team Structure Options

### Option 1: 1 Mid-Level Developer
- **Rate:** €35/hour
- **Hours:** 500-650 hours
- **Cost:** €17,500 - €22,750
- **Timeline:** 4.5-6 months
- **Monthly Cost:** €6,062.50 (including employer costs)

### Option 2: 1 Senior Developer
- **Rate:** €45/hour
- **Hours:** 500-650 hours
- **Cost:** €22,500 - €29,250
- **Timeline:** 4.5-6 months
- **Monthly Cost:** €7,687.50 (including employer costs)

### Option 3: 1 Senior + 1 Mid-Level
- **Senior:** €45/hour × 250h = €11,250
- **Mid-Level:** €35/hour × 300h = €10,500
- **Total:** €21,750
- **Timeline:** 3-4 months
- **Monthly Cost:** €13,750 (including employer costs)

### Option 4: 2 Mid-Level Developers
- **Rate:** €35/hour each
- **Hours:** 500-650 hours total
- **Cost:** €17,500 - €22,750
- **Timeline:** 3-4 months
- **Monthly Cost:** €12,125 (including employer costs)

---

## 7. Timeline & Cost Summary

| Team Structure | Duration | Total Cost (€) |
|----------------|----------|----------------|
| 1 Mid-level | 4.5-6 months | 23,719 - 30,590 |
| 1 Senior | 4.5-6 months | 28,219 - 36,340 |
| 1 Senior + 1 Mid | 3-4 months | 27,224 - 35,060 |
| 2 Mid-level | 3-4 months | 22,974 - 29,810 |

---

## 8. Assumptions & Notes

### 8.1 Assumptions
- Based on Finnish market rates for 2024-2025
- Includes all employer costs (25% overhead)
- Assumes standard 160 working hours per month
- Based on existing codebase analysis
- Includes testing and documentation

### 8.2 Not Included
- Office space/equipment (assumes remote work or existing infrastructure)
- Software licenses (assumes company-provided)
- Third-party service costs (hosting, CDN, etc.)
- Ongoing maintenance costs (15-20% annually)

### 8.3 Risk Factors
- Complex form handling with Formik and Yup may require additional time
- Redux Saga setup and side effect management can be time-consuming
- File upload and image editing integration may require additional testing
- Material-UI customization may require additional time

### 8.4 Efficiency Factors
- Internal teams may be 10-20% more efficient due to:
  - Better context understanding
  - Existing tooling and infrastructure
  - Direct communication channels

---

## 9. Recommendations

### Recommended Approach
**Option 3: 1 Senior + 1 Mid-Level Developer**
- **Timeline:** 3-4 months
- **Cost:** €27,224 - €35,060
- **Benefits:**
  - Faster delivery
  - Senior oversight for complex features (Redux, authentication)
  - Mid-level handles standard components and forms
  - Good balance of cost and quality

### Alternative Approach
**Option 4: 2 Mid-Level Developers**
- **Timeline:** 3-4 months
- **Cost:** €22,974 - €29,810
- **Benefits:**
  - Lower cost
  - Faster delivery than single developer
  - Good for standard CMS features
- **Considerations:**
  - May need senior review for complex state management
  - Authentication and Redux setup may require senior oversight

---

## 10. Next Steps

1. **Review and Approve Budget:** €25,000 - €28,000
2. **Select Team Structure:** Based on timeline and budget constraints
3. **Define Project Timeline:** 3-6 months depending on team size
4. **Set Up Project Management:** Track hours and milestones
5. **Plan for Contingencies:** Reserve 10-15% for unexpected issues

---

## Document Information

**Prepared for:** Finnep Event App CMS Development
**Date:** 2025
**Market:** Finland
**Cost Basis:** Internal Employee Costs (including employer contributions)
**Currency:** EUR (€)

---

**End of Document**