@AGENTS.md
**A React Native App for Local Produce, Meats, and Farm Experiences**

---

## 🌾 Core Concept
Currently, people discover local farms primarily through fragmented WhatsApp or Facebook groups, and word-of-mouth. **FarmConnect** provides a streamlined, centralized platform offering an alternative for local farmers to sell produce, meats, and host activities directly to consumers. 

**Tech Stack:** React Native (iOS, Android, Web), supabase, clerk, hero.ui

---

## 🚀 Onboarding
Upon downloading the app, users are presented with a role selection screen:
- **Customer (User):** Looking to buy produce, book slaughter appointments, or find farm activities.
- **Vendor (Farmer):** Looking to list their farm, manage inventory, and schedule bookings.

---

## 🛒 Customer (User) Side

### 1. Account Creation & Home Page
*   **Sign-Up:** Standard user account creation (Email, Social Login).
*   **"What's New" Banner:** At the top of the Home Page, a swipeable carousel displays produce and meats currently on sale from nearby farms.
*   **Card-View Feed:** Inspired by Airbnb and UberEats, the main feed displays local farms as visual cards.
    *   Each card includes a thumbnail, farm name, and a small-font review rating (e.g., ⭐ 4.6).
    *   **Badges/Tags:** Farms display verified certificates directly on their cards (e.g., *Halal Certified*, *Grass-Fed*, *Organic*).

### 2. Map View
*   Accessible via the bottom navigation bar.
*   Displays a geographical map pinning all nearby participating farms for easy local discovery.

### 3. Farm Profile Page
When a user clicks on a farm card, they are taken to the farm's profile, which is divided into three distinct tabs:
*   **Tab 1: Produce and Meats (Default)** 
    *   A card-style grid displaying all available items for purchase.
*   **Tab 2: Slaughter**
    *   Allows users to book slaughtering appointments.
    *   **Split Feature:** Users can add invitees to their booking to easily split the cost and yield of a whole animal.
*   **Tab 3: Activities**
    *   View and book on-farm activities (e.g., petting zoos, farm tours, fruit picking).

---

## 🚜 Vendor (Farmer) Side

### 1. Farm Profile Creation
*   Farmers set up their dedicated profile.
*   **Categorization:** They can define their farm type (e.g., *Slaughter Only*, *Produce & Meats*, *Mixed*).
*   **Certifications:** Upload and display credentials (like Halal Certification).

### 2. Inventory & Product Management
*   Add offerings for produce, meats, and activities.
*   **Flexible Pricing:** Set prices based on weight (e.g., per lb/kg) or fixed amount (e.g., per item/basket).
*   **Inventory Tracking:** Set and manage stock limits to prevent overselling.

### 3. Booking & Schedule Management
*   Farmers can create and customize a schedule for available bookings and activities.
*   A dedicated dashboard allows them to view, accept, and manage upcoming customer bookings.

---

## 🕋 Special Feature: Eid al-Adha Management
A dedicated high-volume ticketing and scheduling system tailored for the Eid al-Adha rush.
*   **Customer Registration:** Users can pre-register for Eid al-Adha slaughtering.
*   **Ticketing System:** Farmers manage the influx of requests via a queue/ticketing interface.
*   **Date Assignment:** Farmers can officially assign specific dates and time slots to registered customers, ensuring a smooth, organized process during the busy holiday season.