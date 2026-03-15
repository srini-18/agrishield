# IEEE-Style Project Documentation
## AgriShield AI: Agricultural Intelligence Platform (MERN)

**Abstract**  
AgriShield AI is a MERN-based agricultural intelligence platform that unifies farm registration, satellite-derived crop health monitoring, weather intelligence, AI-driven yield and risk prediction, and parametric crop insurance workflows. The system delivers role-based dashboards for farmers, insurers, and administrators, and integrates geospatial data, simulated or live weather sources, and market price intelligence. This document describes the system architecture, core components, data models, APIs, and business logic implemented in the platform.

**Keywords**  
MERN, Agriculture, Geospatial, NDVI, Prediction, Parametric Insurance, Weather Intelligence, Market Prices

---

## 1. Introduction
Agricultural decision-making relies on timely intelligence about crop health, weather, and market dynamics. AgriShield AI provides a full-stack solution that captures farm data, overlays satellite and weather insights, and generates actionable predictions. It further enables automated parametric insurance claims based on trigger conditions, reducing the time from disaster to payout.

## 2. Objectives
- Provide a unified farmer dashboard for farm registration, monitoring, and analytics.
- Use satellite and weather indicators to compute crop health, risk, and yield predictions.
- Enable parametric insurance policies with automated trigger evaluation.
- Expose market price intelligence for crops across regions.
- Enforce role-based access and secure authentication.

## 3. System Architecture (MERN Stack)
### 3.1 Data Layer (MongoDB)
The system uses MongoDB for persistent storage, leveraging its document-based model for flexible data structures. Key schemas include:
- **User**: Authentication and RBAC (farmer, insurer, admin, bank).
- **Farm**: Geospatial boundaries using GeoJSON `Polygon` or `Point` for mapping.
- **SatelliteData/WeatherData**: Time-series data storing NDVI, soil moisture, and atmospheric conditions.
- **InsurancePolicy/Claim**: Parametric trigger definitions and auto-generated claim records.

### 3.2 Backend Layer (Node.js & Express.js)
The RESTful API is built on Express, handling:
- **Middleware**: JWT verification, role-based authorization, rate limiting, and security hardening (Helmet/CORS).
- **Services**: Encapsulated business logic for predictions, insurance, and data ingestion.
- **Routing**: Domain-specific endpoints for system functionalities.

### 3.3 Frontend Layer (React.js)
The UI is a single-page application (SPA) built with React and Vite:
- **State Management**: Context API for authentication and localization.
- **Mapping**: Leaflet/React-Leaflet for visualizing farm boundaries and heatmaps.
- **Visuals**: Recharts for time-series analysis of crop health and weather.
- **Styling**: Tailwind CSS for a modern, responsive interface.

---

## 4. Technical Logic and Workflows

### 4.1 AI Prediction Engine Logic
The system employs a weighted heuristic algorithm to estimate crop yield and assess risks.

#### 4.1.1 Yield Prediction Algorithm
The yield is calculated based on a `YieldScore` derived from weighted parameters:
- **Calculation**: $YieldScore = (NDVI_{avg} * 40\%) + (Moisture_{avg} * 20\%) + (Temp_{avg} * 20\%) + (Rain_{avg} * 20\%)$
- **NDVI Score**: Normalized difference vegetation index, scaled 0-100.
- **Moisture/Temp/Rain Scores**: Graded based on optimality ranges for the specific crop type.
- **Final Estimate**: `BaseYield * (YieldScore / 100) * AdjustmentFactor` where BaseYield is crop-specific (e.g., Rice: 4.5 t/ha).

#### 4.1.2 Environmental Risk Assessment
Risk levels (Low, Moderate, High, Critical) are determined by:
- **Drought**: Analyzes rainfall deficit (<5mm), soil moisture below 25%, and temperature stress (>38°C).
- **Flood**: Monitors excessive rainfall (>80mm) and high soil saturation (>85%).
- **Disease**: Evaluates humidity (>80%) and optimal temperature ranges (22-30°C) for pest/pathogen growth.

### 4.2 Parametric Insurance Logic
Unlike traditional insurance, AgriShield uses data-triggered payouts.

#### 4.2.1 Trigger Evaluation
The `InsuranceService` continuously evaluates policy conditions:
- **Rainfall**: Triggers if rainfall is `above` (flood) or `below` (drought) a threshold.
- **NDVI**: Triggers on absolute low values or a significant `drop_by` percentage.
- **Payout Calculation**: `CoverageAmount * (TriggeredConditions / TotalConditions) * ScalingFactor`.

---

## 5. Full-Stack Data Flow
1. **Request**: Frontend initiates an API call via Axios interceptor (injects JWT).
2. **Auth**: Backend `auth` middleware verifies token and user role.
3. **Logic**: Controller calls specific `Service` (e.g., `predictionService`) to compute data.
4. **Data**: Service queries MongoDB via Mongoose models.
5. **Response**: JSON payload returned to Frontend, updating the React state and triggering UI re-renders.

---

## 6. Deployment and Operations
### 6.1 Configuration
The system relies on environment variables for security and integration:
- `MONGODB_URI`: Connection string for the database.
- `JWT_SECRET`: Secret for signing authentication tokens.
- `OPENWEATHER_API_KEY`: Key for real-time weather data.
- `FRONTEND_URL`: Allowed origin for production CORS settings.

### 6.2 Build Pipeline
1. **Frontend**: `vite build` generates optimized static assets in `/frontend/dist`.
2. **Backend**: Express serves the static assets and handles API requests.

---

## 7. Security and Compliance
- **Authentication**: JWT tokens stored securely and injected in API headers.
- **Input Validation**: `express-validator` prevents injection and malformed requests.
- **Rate Limiting**: Protects against Brute Force and DoS attacks on critical endpoints.
- **Data Privacy**: Encrypted password storage via `bcryptjs`.

## 8. Conclusion
AgriShield AI demonstrates a robust application of the MERN stack for solving complex agricultural challenges. By integrating geospatial data with AI-driven heuristics and parametric insurance, the platform provides a scalable and transparent ecosystem for farmers and insurers alike.
