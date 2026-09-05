# FarmConnect: UI/UX Design Specifications

**Document Purpose:** To outline the visual identity, navigation structures, and core screen layouts for the FarmConnect React Native application.

---

## 🎨 1. Brand Identity & Design System

### 1.1 Color Palette: Greens & Earth Tones
*   **Primary Action (Buttons, Active Tabs, Highlights):** Pine Green (`#2C5F2D`) - A rich, deeply saturated green that grounds the app and signifies freshness and reliability.
*   **Secondary Action / Accents:** Terracotta Clay (`#E27D60`) - A warm, earthy red-orange for sale tags, urgent alerts, and subtle badge highlights.
*   **Tertiary Accent (Illustrations/Icons):** Golden Ochre (`#D4A373`) - Represents wheat, grain, and warmth, used sparingly for active states or star ratings.
*   **Background (App Base):** Oatmeal/Warm Sand (`#F9F6F0`) - A soft, earthy off-white that reduces eye strain and makes product photography stand out.
*   **Surface/Cards:** Pure White (`#FFFFFF`) - Creates clean separation and contrast against the oatmeal background for farm and product cards.
*   **Text (Primary):** Espresso Brown (`#3E2723`) or Deep Charcoal (`#1C1C1C`) - A harsh pure black is too stark for an earthy theme; a very dark brown or charcoal maintains high legibility while fitting the natural aesthetic.
*   **Text (Secondary/Muted):** Moss Gray (`#7B8775`) - Used for subtitles, distances (e.g., "3.2 km away"), and secondary descriptions.

### 1.2 Typography
*   **Font Family:** *Inter* or *Poppins* (Clean, modern sans-serif).
*   **Headers:** Bold, large sizing for farm names and prices to ensure quick scanning.
*   **Body Text:** Regular weight, high legibility for produce descriptions and weights.

### 1.3 UI Components
*   **Cards:** Slightly rounded corners (e.g., 8px - 12px radius) with a subtle drop shadow to lift them off the background.
*   **Badges:** Small, pill-shaped tags used on farm cards for certifications (e.g., **Halal**, **Grass-Fed**).
*   **Buttons:** Large, thumb-friendly tap targets (minimum 44x44 points) with rounded edges. 
*   **Imagery:** Edge-to-edge hero images on farm profiles. High emphasis on vendor-uploaded photography.

---

## 📱 2. Customer (User) App Interfaces

### 2.1 Customer Bottom Navigation
1.  **Home** (House Icon)
2.  **Map** (Map/Pin Icon)
3.  **Bookings** (Calendar Icon)
4.  **Cart** (Basket Icon)
5.  **Profile** (User Silhouette Icon)

### 2.2 Screen: Home Discovery Feed
*   **Header:** Location selector (e.g., "Delivering to / Searching near: Montreal").
*   **Main Feed (Horizontal Scroll Categories):** The home page consists of vertically stacked categories, where the items within each category scroll horizontally (Uber Eats style).
    *   *Example Categories:* "Featured Deals", "Farms Near You", "Fresh Produce & Meats".
*   **Horizontal Card Layout:**
    *   *Thumbnail:* Wide, landscape-oriented image taking up the top half of the card.
    *   *Overlay Tags:* Top-left corner of the image features a bright tag (e.g., a Terracotta tag for "Sale" or Pine Green for "Halal Certified").
    *   *Header Row (Below Image):* Farm Name aligned to the left, with a Heart (Favorite) icon aligned to the far right.
    *   *Details Row:* Delivery fee/Pickup info and distance (e.g., "$5 Delivery • 3.2 km away").
    *   *Stats Row:* Golden Ochre Star rating, review count, and travel time (e.g., "4.6★ (300+) • 15 min").

### 2.3 Screen: Map View
*   **Map Interface:** Standard map view (Google Maps/Mapbox integration) with custom map pins representing farms.
*   **Pin Interaction:** Tapping a pin reveals a bottom-sheet preview card of the farm, with a button to "View Full Profile."

### 2.4 Screen: Farm Profile
*   **Hero Section:** Full-width farm image, farm name, location, and rating.
*   **Sticky Tab Bar:**
    *   `Produce & Meats` | `Slaughter` | `Activities`
*   **Produce Tab Layout:** Two-column grid of product cards (Image, Name, Price per lb/kg, "+" Add to Cart button).
*   **Slaughter Tab Layout (The Split Flow):**
    *   List of available animals.
    *   *Split Action:* Checkbox for "Split this booking with others." 
    *   *Invite UI:* Opens a contact selection modal to divide the cost and yield into fractions (e.g., 1/2, 1/3, 1/4).

---

## 🚜 3. Vendor (Farmer) App Interfaces

### 3.1 Vendor Bottom Navigation
1.  **Dashboard** (Clipboard/Home Icon)
2.  **Inventory** (Box/Stock Icon)
3.  **Schedule** (Clock/Calendar Icon)
4.  **Messages** (Chat Bubble Icon)

### 3.2 Screen: Daily Dashboard
*   **Header:** "Today's Overview" with the current date.
*   **Quick Stats Widgets:** 
    *   "Pending Orders: [ X ]"
    *   "Slaughter Appointments: [ Y ]"
*   **Action List:** A chronological list of immediate tasks or arrivals expected for the day. High-contrast, easy to read outdoors.

### 3.3 Screen: Rapid Inventory Editor
*   **Layout:** Simple vertical list of all farm offerings.
*   **Quick Toggles:** A large, easily tappable toggle switch next to each item (`In Stock` / `Out of Stock`).
*   **Stepper Controls:** Large `[ - ]` and `[ + ]` buttons next to quantity fields (e.g., `[ - ] 50 kg [ + ]`) to adjust stock without triggering the device keyboard.

### 3.4 Screen: Eid al-Adha Event Dashboard
*   **Activation:** Prominent toggle in settings: "Enable Eid Ticketing Mode".
*   **Queue View:** Time blocks displayed as distinct, full-width cards (e.g., "08:00 - 09:00 AM").
*   **Customer Management:** Inside each block, a list of registered customers. 
*   **Swipe Actions:** The farmer can swipe right on a customer's name to mark the slaughter as "Completed" and trigger a notification to the customer to pick up their meat.
