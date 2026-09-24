import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import HeroSection from './components/sections/HeroSection';
import AboutSection from './components/sections/AboutSection';
import ProductsSection from './components/sections/ProductsSection';
import ServicesSection from './components/sections/ServicesSection';
import ProjectsSection from './components/sections/ProjectsSection';
import TestimonialsSection from './components/sections/TestimonialsSection';
import FounderSection from './components/sections/FounderSection';
import ContactSection from './components/sections/ContactSection';
import AdminApp from './admin/AdminApp';
import ShakyaLabsLogo from './components/ShakyaLabsLogo';
import JobsPortal from './jobs/JobsPortal';

const API_URL = import.meta.env.VITE_API_URL || '';

function PublicSite() {
  const [site, setSite] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/site`)
      .then((response) => response.json())
      .then((data) => {
        setSite(data);
        if (data.seo) {
          const homeSeo = data.seo.pages?.home || data.seo;
          document.title = homeSeo.metaTitle || data.seo.siteTitle || document.title;
          const description = document.querySelector('meta[name="description"]');
          if (description && homeSeo.metaDescription) description.setAttribute('content', homeSeo.metaDescription);
          if (homeSeo.canonicalUrl) {
            let canonical = document.querySelector('link[rel="canonical"]');
            if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
            canonical.href = homeSeo.canonicalUrl;
          }
        }
      })
      .catch(() => setSite(null));
  }, []);

  if (!site) {
    return <div className="min-h-screen bg-shakya-bg-primary text-white p-10 flex items-center justify-center"><ShakyaLabsLogo variant="admin" /></div>;
  }

  return (
    <div className="min-h-screen bg-shakya-bg-primary text-white">
      <Header settings={site.settings} />
      <main>
        <HeroSection data={site.hero} stats={site.stats} />
        <AboutSection data={site.about} />
        <ProductsSection products={site.products} />
        <ServicesSection services={site.services} />
        <ProjectsSection projects={site.projects} />
        <TestimonialsSection testimonials={site.testimonials} />
        <FounderSection founder={site.founder} />
        <ContactSection settings={site.settings} />
      </main>
      <Footer settings={site.settings} />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicSite />} />
      <Route path="/jobs/*" element={<JobsPortal />} />
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="*" element={<PublicSite />} />
    </Routes>
  );
}

export default App;
