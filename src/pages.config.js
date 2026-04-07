/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import About from './pages/About';
import AccessibilitySettings from './pages/AccessibilitySettings';
import AccountSettings from './pages/AccountSettings';
import Achievements from './pages/Achievements';
import Admin from './pages/Admin';
import Apply from './pages/Apply';
import Catalog from './pages/Catalog';
import Contact from './pages/Contact';
import Course from './pages/Course';
import CourseEditor from './pages/CourseEditor';
import CourseForum from './pages/CourseForum';
import CourseInstanceCatalog from './pages/CourseInstanceCatalog';
import CourseView from './pages/CourseView';
import Dashboard from './pages/Dashboard';
import FAQ from './pages/FAQ';
import Faculty from './pages/Faculty';
import ForumPost from './pages/ForumPost';
import Gradebook from './pages/Gradebook';
import Home from './pages/Home';
import HowItWorks from './pages/HowItWorks';
import InstructorDashboard from './pages/InstructorDashboard';
import InstructorGradebook from './pages/InstructorGradebook';
import InstructorProfile from './pages/InstructorProfile';
import Lesson from './pages/Lesson';
import Library from './pages/Library';
import Pathway from './pages/Pathway';
import Pathways from './pages/Pathways';
import Profile from './pages/Profile';
import Support from './pages/Support';
import Transcript from './pages/Transcript';
import Week from './pages/Week';


export const PAGES = {
    "About": About,
    "AccessibilitySettings": AccessibilitySettings,
    "AccountSettings": AccountSettings,
    "Achievements": Achievements,
    "Admin": Admin,
    "Apply": Apply,
    "Catalog": Catalog,
    "Contact": Contact,
    "Course": Course,
    "CourseEditor": CourseEditor,
    "CourseForum": CourseForum,
    "CourseInstanceCatalog": CourseInstanceCatalog,
    "CourseView": CourseView,
    "Dashboard": Dashboard,
    "FAQ": FAQ,
    "Faculty": Faculty,
    "ForumPost": ForumPost,
    "Gradebook": Gradebook,
    "Home": Home,
    "HowItWorks": HowItWorks,
    "InstructorDashboard": InstructorDashboard,
    "InstructorGradebook": InstructorGradebook,
    "InstructorProfile": InstructorProfile,
    "Lesson": Lesson,
    "Library": Library,
    "Pathway": Pathway,
    "Pathways": Pathways,
    "Profile": Profile,
    "Support": Support,
    "Transcript": Transcript,
    "Week": Week,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
};