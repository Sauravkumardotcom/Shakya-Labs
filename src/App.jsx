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
          const setMeta = (selector, attribute, value) => { if (!value) return; let element = document.querySelector(selector); if (!element) { element = document.createElement('meta'); element.setAttribute(attribute, selector.includes('property=') ? selector.split('"')[1] : selector.split('"')[1]); document.head.appendChild(element); } element.setAttribute('content', value); };
          setMeta('meta[name="description"]', 'name', homeSeo.metaDescription || data.seo.metaDescription);
          setMeta('meta[property="og:title"]', 'property', homeSeo.ogTitle || data.seo.ogTitle || homeSeo.metaTitle);
          setMeta('meta[property="og:description"]', 'property', homeSeo.ogDescription || data.seo.ogDescription || homeSeo.metaDescription);
          setMeta('meta[property="og:image"]', 'property', homeSeo.ogImage || data.seo.ogImage);
          setMeta('meta[name="twitter:card"]', 'name', 'summary_large_image');
          setMeta('meta[name="twitter:title"]', 'name', homeSeo.twitterTitle || homeSeo.ogTitle || data.seo.ogTitle || homeSeo.metaTitle);
          setMeta('meta[name="twitter:description"]', 'name', homeSeo.twitterDescription || homeSeo.ogDescription || data.seo.ogDescription || homeSeo.metaDescription);
          setMeta('meta[name="twitter:image"]', 'name', homeSeo.twitterImage || homeSeo.ogImage || data.seo.ogImage);
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
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="*" element={<PublicSite />} />
    </Routes>
  );
}

export default App;
