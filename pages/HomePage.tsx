import React from 'react';
import HomeView from '../views/Home';

// Pattern: The "Page" acts as the Route Container.
// In a larger app, this file would handle:
// 1. URL Parameter extraction (useParams)
// 2. SEO / Meta Tags (Helmet)
// 3. Route-specific permission checks
// 4. Initial Data Fetching (if passing down as props)

const HomePage: React.FC = () => {
  return (
    <>
      {/* Example: <Helmet><title>LeoPictos - Inicio</title></Helmet> */}
      <HomeView />
    </>
  );
};

export default HomePage;