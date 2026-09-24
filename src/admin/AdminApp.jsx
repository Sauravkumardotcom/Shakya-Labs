import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import ShakyaLabsLogo from '../components/ShakyaLabsLogo';
import JobsAdmin from './JobsAdmin';
import './AdminApp.css';

const API_URL = import.meta.env.VITE_API_URL || '';
const token = () => localStorage.getItem('shakya_admin_token');
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token() || ''}` });
const api = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { ...headers(), ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) {
    localStorage.removeItem('shakya_admin_token');
    window.location.href = '/admin/login';
  }
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
};

const navGroups = [
  { label: 'Overview', items: [['Dashboard', '/admin/dashboard', '⌂']] },
  { label: 'Website', items: [['Hero', '/admin/website/hero', '✦'], ['About', '/admin/website/about', '◈'], ['Statistics', '/admin/website/statistics', '#'], ['Footer', '/admin/website/footer', '⌄']] },
  { label: 'Content', items: [['Services', '/admin/services', '◫'], ['Products', '/admin/products', '▣'], ['Projects', '/admin/projects', '◇'], ['Testimonials', '/admin/testimonials', '❝'], ['Founder', '/admin/founder', '◎'], ['Certifications', '/admin/certifications', '✓']] },
  { label: 'Jobs Portal', items: [['Jobs', '/admin/jobs', '↗', 'editor'], ['Companies', '/admin/jobs/companies', '▤', 'admin'], ['Categories', '/admin/jobs/categories', '⊞', 'admin'], ['Applications', '/admin/jobs/applications', '✉', 'admin'], ['Job settings', '/admin/jobs/settings', '⚙', 'admin']] },
  { label: 'Management', items: [['Media Library', '/admin/media', '▧'], ['Messages', '/admin/messages', '✉'], ['SEO', '/admin/seo', '⌕']] },
  { label: 'System', items: [['Activity Logs', '/admin/activity-logs', '◷'], ['Users', '/admin/users', '♙'], ['Settings', '/admin/settings', '⚙']] }
];

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setLoading(true); setError('');
    try {
      const response = await fetch(`${API_URL}/api/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Unable to sign in');
      localStorage.setItem('shakya_admin_token', data.token); window.location.href = '/admin/dashboard';
    } catch (errorValue) { setError(errorValue.message); } finally { setLoading(false); }
  };
  return <div className="admin-login"><div className="login-panel"><ShakyaLabsLogo variant="login" className="login-logo" /><p className="eyebrow">Shakya Labs / control room</p><h1>Sign in to your workspace</h1><p className="muted">Manage the content that powers your public website.</p><form onSubmit={submit} className="admin-form"><Field label="Email" value={email} onChange={setEmail} type="email" required /><Field label="Password" value={password} onChange={setPassword} type="password" required />{error && <div className="form-error">{error}</div>}<button className="primary-button" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button></form></div></div>;
}

function AdminShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  useEffect(() => { api('/api/admin/me').then((data) => setUser(data.user)).catch(() => {}); }, []);
  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === 'Escape') setMobileOpen(false); };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, []);
  const roleRank = { viewer: 0, editor: 1, admin: 2, super_admin: 3 };
  const visibleGroups = navGroups.map((group) => ({ ...group, items: group.items.filter(([, , , minimumRole]) => !minimumRole || (roleRank[user?.role] || 0) >= roleRank[minimumRole]) })).filter((group) => group.items.length);
  const current = visibleGroups.flatMap((group) => group.items).find((item) => location.pathname === item[1]);
  const logout = () => { localStorage.removeItem('shakya_admin_token'); navigate('/admin/login'); };
  return <div className={`admin-shell ${collapsed ? 'is-collapsed' : ''}`}>
    <aside className={`admin-sidebar ${mobileOpen ? 'is-open' : ''}`}>
      <div className="sidebar-brand"><Link to="/admin/dashboard" onClick={() => setMobileOpen(false)}><ShakyaLabsLogo variant="admin" /></Link><button className="icon-button mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation">×</button></div>
      <nav className="admin-nav" aria-label="Admin navigation">{visibleGroups.map((group) => <div className="nav-group" key={group.label}><div className="nav-label">{group.label}</div>{group.items.map(([label, path, icon]) => <Link key={path} title={collapsed ? label : undefined} className={location.pathname === path ? 'active' : ''} to={path} onClick={() => setMobileOpen(false)}><span className="nav-icon" aria-hidden="true">{icon}</span><span>{label}</span></Link>)}</div>)}</nav>
      <div className="sidebar-user"><div className="avatar">{(user?.email || 'A').slice(0, 1).toUpperCase()}</div><div className="user-copy"><strong>{user?.email || 'Administrator'}</strong><small>{user?.role || 'Admin'}</small></div><button className="icon-button" onClick={logout} title="Logout" aria-label="Logout">↪</button></div>
    </aside>
    {mobileOpen && <button className="admin-overlay" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
    <div className="admin-content"><header className="admin-header"><button className="icon-button" onClick={() => { setMobileOpen(true); setCollapsed(false); }} aria-label="Open navigation">☰</button><button className="icon-button desktop-toggle" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">◧</button><div className="breadcrumbs"><span>Admin</span><b>/</b><strong>{current?.[0] || 'Dashboard'}</strong></div><div className="header-actions"><span className="status-dot">● Live</span><Link className="view-site" to="/">View site ↗</Link></div></header><main className="admin-main"><AdminPageBoundary><AdminPage user={user} /></AdminPageBoundary></main></div>
  </div>;
}

class AdminPageBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error) { console.error('Admin page failed to render:', error); }
  render() {
    if (this.state.hasError) return <div className="page-error"><h1>Admin page unavailable</h1><p>Something went wrong while rendering this page.</p><button className="primary-button" onClick={() => window.location.reload()}>Reload page</button></div>;
    return this.props.children;
  }
}

function AdminPage({ user }) {
  const path = useLocation().pathname;
  if (path === '/admin/jobs' || path.startsWith('/admin/jobs/')) return <JobsAdmin user={user} />;
  const previewMatch = path.match(/^\/admin\/preview\/([^/]+)(?:\/([^/]+))?$/);
  if (previewMatch) return <PreviewPage resource={previewMatch[1]} id={previewMatch[2]} />;
  if (path === '/admin' || path === '/admin/dashboard') return <Dashboard />;
  if (path === '/admin/website/hero' || path === '/admin/website' || path === '/admin/hero') return <SingletonEditor title="Hero" description="Shape the first impression of your website." endpoint="/api/admin/hero" fields={heroFields} />;
  if (path === '/admin/website/about' || path === '/admin/about') return <SingletonEditor title="About" description="Manage the story and supporting content for the About section." endpoint="/api/admin/about" fields={aboutFields} />;
  if (path === '/admin/website/footer' || path === '/admin/footer') return <SingletonEditor title="Footer" description="Manage contact and social details displayed across the site." endpoint="/api/admin/settings" fields={footerFields} />;
  if (path === '/admin/website/statistics' || path === '/admin/statistics') return <ResourceEditor title="Statistics" description="Control the proof points shown in the homepage Hero." endpoint="/api/admin/stats" fields={statFields} />;
  if (path === '/admin/founder') return <SingletonEditor title="Founder" description="Edit the founder profile without touching source code." endpoint="/api/admin/founder" fields={founderFields} />;
  if (path === '/admin/seo') return <SingletonEditor title="SEO" description="Manage global metadata and page-level search previews." endpoint="/api/admin/seo" fields={seoFields} />;
  if (path === '/admin/messages') return <MessagesPage />;
  if (path === '/admin/media') return <MediaPage />;
  if (path === '/admin/activity-logs' || path === '/admin/activity') return <ActivityPage />;
  if (path === '/admin/users') return <UsersPage />;
  if (path === '/admin/settings') return <><SingletonEditor title="Settings" description="Configure the site identity, contact details, and social links." endpoint="/api/admin/settings" fields={settingsFields} /><PasswordEditor /></>;
  if (path === '/admin/services') return <ResourceEditor title="Services" description="Manage the capabilities presented to prospective clients." endpoint="/api/admin/services" fields={serviceFields} />;
  if (path === '/admin/products') return <ResourceEditor title="Products" description="Manage products and platforms shown on the public website." endpoint="/api/admin/products" fields={productFields} />;
  if (path === '/admin/projects') return <ResourceEditor title="Projects" description="Manage the Shakya Labs portfolio." endpoint="/api/admin/projects" fields={projectFields} />;
  if (path === '/admin/testimonials') return <ResourceEditor title="Testimonials" description="Manage social proof and client voices." endpoint="/api/admin/testimonials" fields={testimonialFields} />;
  if (path === '/admin/certifications') return <ResourceEditor title="Certifications" description="Keep founder credentials and supporting documents current." endpoint="/api/admin/certifications" fields={certificationFields} />;
  return <Navigate to="/admin/dashboard" replace />;
}

function PageHeader({ title, description, action }) { return <div className="page-header"><div><p className="eyebrow">Shakya Labs CMS</p><h1>{title}</h1><p className="muted">{description}</p></div>{action}</div>; }
function Field({ label, value, onChange, type = 'text', required = false, placeholder = '', multiline = false, maxLength }) { const textLength = String(value ?? '').length; return <label className="field"><span>{label}{required && <em> *</em>}{maxLength && <small className="field-counter">{textLength} / {maxLength}</small>}</span>{multiline ? <textarea value={value ?? ''} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={4} maxLength={maxLength} required={required} /> : <input type={type} value={value ?? ''} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} maxLength={maxLength} required={required} />}</label>; }
function Toggle({ label, checked, onChange }) { return <label className="toggle"><input type="checkbox" checked={checked !== false} onChange={(event) => onChange(event.target.checked)} /><span>{label}</span></label>; }

function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api('/api/admin/dashboard').then(setData).catch(() => setData({ metrics: {}, recentActivity: [] })); }, []);
  const metrics = data?.metrics || {};
  const cards = [['projects', 'Projects', '◇'], ['products', 'Products', '▣'], ['services', 'Services', '◫'], ['testimonials', 'Testimonials', '❝'], ['messages', 'Messages', '✉'], ['published', 'Published content', '✓'], ['drafts', 'Draft content', '◌']];
  return <><PageHeader title="Dashboard" description="A live overview of your Shakya Labs content workspace." /><section className="metric-grid">{cards.map(([key, label, icon]) => <div className="metric-card" key={key}><span className="metric-icon">{icon}</span><span className="muted">{label}</span><strong>{metrics[key] || 0}</strong></div>)}</section><section className="dashboard-grid"><div className="panel"><div className="panel-heading"><div><h2>Quick actions</h2><p className="muted">Create content without leaving your workspace.</p></div></div><div className="quick-actions"><QuickAction to="/admin/projects" label="New project" /><QuickAction to="/admin/products" label="New product" /><QuickAction to="/admin/services" label="New service" /><QuickAction to="/admin/testimonials" label="New testimonial" /></div></div><div className="panel"><div className="panel-heading"><h2>Recent activity</h2><Link to="/admin/activity-logs">View all</Link></div>{data?.recentActivity?.length ? <div className="activity-list">{data.recentActivity.map((item) => <div className="activity-item" key={item.id}><span className="activity-dot" /><div><strong>{item.action} {item.entity}</strong><small>{item.user} · {new Date(item.createdAt).toLocaleString()}</small></div></div>)}</div> : <EmptyState text="No activity recorded yet." />}</div></section></>;
}
function QuickAction({ to, label }) { return <Link className="quick-action" to={to}><span>＋</span>{label}</Link>; }
function EmptyState({ text = 'Nothing here yet.', action }) { return <div className="empty-state"><span>◌</span><p>{text}</p>{action}</div>; }
function PreviewPage({ resource, id }) {
  const [content, setContent] = useState(null); const [error, setError] = useState('');
  const endpointMap = { hero: '/api/admin/hero', about: '/api/admin/about', founder: '/api/admin/founder', footer: '/api/admin/settings', projects: '/api/admin/projects', products: '/api/admin/products', services: '/api/admin/services', testimonials: '/api/admin/testimonials', certifications: '/api/admin/certifications' };
  useEffect(() => { api(endpointMap[resource] || `/api/admin/${resource}`).then((data) => setContent(id && Array.isArray(data) ? data.find((item) => item.id === id) : data)).catch((errorValue) => setError(errorValue.message)); }, [resource, id]);
  if (error) return <div className="page-error"><h1>Preview unavailable</h1><p>{error}</p></div>;
  if (!content) return <Loading text="Loading draft preview..." />;
  return <div className="preview-page"><div className="preview-banner"><strong>DRAFT PREVIEW</strong><span>This content is not published to the public website.</span></div><PageHeader title={content.title || content.name || resource} description="Preview of the currently saved CMS content." /><div className="panel preview-content"><h2>{content.heading || content.title || content.name || 'Untitled content'}</h2><p>{content.description || content.bio || content.quote || content.supportingText || 'No description provided.'}</p><pre>{JSON.stringify(content, null, 2)}</pre></div></div>;
}

const heroFields = [{ key: 'badge', label: 'Badge', required: true }, { key: 'heading', label: 'Heading', required: true }, { key: 'description', label: 'Description', multiline: true, required: true }, { key: 'primaryButtonText', label: 'Primary button text' }, { key: 'primaryButtonUrl', label: 'Primary button URL' }, { key: 'secondaryButtonText', label: 'Secondary button text' }, { key: 'secondaryButtonUrl', label: 'Secondary button URL' }, { key: 'published', label: 'Published', boolean: true }];
const aboutFields = [{ key: 'title', label: 'Section title' }, { key: 'heading', label: 'Heading' }, { key: 'description', label: 'Description', multiline: true }, { key: 'supportingText', label: 'Supporting text', multiline: true }, { key: 'image', label: 'Image URL' }, { key: 'ctaText', label: 'CTA text' }, { key: 'ctaUrl', label: 'CTA URL' }, { key: 'published', label: 'Visible on public site', boolean: true }];
const footerFields = [{ key: 'companyName', label: 'Site name', required: true }, { key: 'tagline', label: 'Tagline' }, { key: 'email', label: 'Contact email', type: 'email' }, { key: 'phone', label: 'Phone' }, { key: 'address', label: 'Address' }, { key: 'copyright', label: 'Copyright' }];
const settingsFields = [...footerFields, { key: 'socialLinks.github', label: 'GitHub URL' }, { key: 'socialLinks.linkedin', label: 'LinkedIn URL' }, { key: 'socialLinks.twitter', label: 'Twitter URL' }];
const founderFields = [{ key: 'name', label: 'Name', required: true }, { key: 'title', label: 'Title' }, { key: 'bio', label: 'Biography', multiline: true }, { key: 'image', label: 'Profile image URL' }, { key: 'skills', label: 'Skills', array: true }, { key: 'github', label: 'GitHub URL' }, { key: 'linkedin', label: 'LinkedIn URL' }, { key: 'portfolio', label: 'Portfolio URL' }, { key: 'quote', label: 'Quote', multiline: true }, { key: 'published', label: 'Visible on public site', boolean: true }];
const seoPageFields = ['home', 'about', 'services', 'products', 'projects', 'founder', 'contact'].flatMap((page) => [{ key: `pages.${page}.metaTitle`, label: `${page[0].toUpperCase() + page.slice(1)} meta title`, maxLength: 60 }, { key: `pages.${page}.metaDescription`, label: `${page[0].toUpperCase() + page.slice(1)} meta description`, multiline: true, maxLength: 160 }, { key: `pages.${page}.canonicalUrl`, label: `${page[0].toUpperCase() + page.slice(1)} canonical URL`, type: 'url' }, { key: `pages.${page}.ogTitle`, label: `${page[0].toUpperCase() + page.slice(1)} OG title` }, { key: `pages.${page}.ogDescription`, label: `${page[0].toUpperCase() + page.slice(1)} OG description`, multiline: true }, { key: `pages.${page}.ogImage`, label: `${page[0].toUpperCase() + page.slice(1)} OG image URL` }, { key: `pages.${page}.twitterTitle`, label: `${page[0].toUpperCase() + page.slice(1)} Twitter/X title` }, { key: `pages.${page}.twitterDescription`, label: `${page[0].toUpperCase() + page.slice(1)} Twitter/X description`, multiline: true }, { key: `pages.${page}.twitterImage`, label: `${page[0].toUpperCase() + page.slice(1)} Twitter/X image URL` }, { key: `pages.${page}.robots`, label: `${page[0].toUpperCase() + page.slice(1)} robots` }]);
const seoFields = [{ key: 'siteTitle', label: 'Global site title', required: true, maxLength: 60 }, { key: 'metaDescription', label: 'Global meta description', multiline: true, maxLength: 160 }, { key: 'keywords', label: 'Keywords' }, { key: 'canonicalUrl', label: 'Global canonical URL', type: 'url' }, { key: 'ogTitle', label: 'Global OG title' }, { key: 'ogDescription', label: 'Global OG description', multiline: true }, { key: 'ogImage', label: 'Global OG image URL' }, ...seoPageFields];
const serviceFields = [{ key: 'title', label: 'Service name', required: true }, { key: 'description', label: 'Short description', multiline: true, required: true }, { key: 'fullDescription', label: 'Full description', multiline: true }, { key: 'icon', label: 'Icon' }, { key: 'features', label: 'Features', array: true }, { key: 'technologies', label: 'Technologies', array: true }, { key: 'order', label: 'Display order', type: 'number' }, { key: 'published', label: 'Published', boolean: true }];
const productFields = [{ key: 'title', label: 'Product name', required: true }, { key: 'slug', label: 'Slug' }, { key: 'description', label: 'Short description', multiline: true, required: true }, { key: 'fullDescription', label: 'Full description', multiline: true }, { key: 'features', label: 'Features', array: true }, { key: 'techStack', label: 'Technology stack', array: true }, { key: 'coverImage', label: 'Cover image URL' }, { key: 'demoUrl', label: 'Demo URL', type: 'url' }, { key: 'productUrl', label: 'Product URL', type: 'url' }, { key: 'githubUrl', label: 'GitHub URL', type: 'url' }, { key: 'featured', label: 'Featured', boolean: true }, { key: 'published', label: 'Published', boolean: true }];
const projectFields = [{ key: 'title', label: 'Project name', required: true }, { key: 'slug', label: 'Slug' }, { key: 'description', label: 'Short description', multiline: true, required: true }, { key: 'fullDescription', label: 'Full description', multiline: true }, { key: 'category', label: 'Category' }, { key: 'thumbnail', label: 'Thumbnail URL' }, { key: 'gallery', label: 'Gallery URLs', array: true }, { key: 'techStack', label: 'Technologies', array: true }, { key: 'features', label: 'Features', array: true }, { key: 'url', label: 'Live URL', type: 'url' }, { key: 'githubUrl', label: 'GitHub URL', type: 'url' }, { key: 'client', label: 'Client' }, { key: 'completionDate', label: 'Completion date', type: 'date' }, { key: 'featured', label: 'Featured', boolean: true }, { key: 'published', label: 'Published', boolean: true }];
const testimonialFields = [{ key: 'name', label: 'Client name', required: true }, { key: 'role', label: 'Role' }, { key: 'company', label: 'Company' }, { key: 'quote', label: 'Testimonial', multiline: true, required: true }, { key: 'profileImage', label: 'Profile image URL' }, { key: 'rating', label: 'Rating', type: 'number' }, { key: 'featured', label: 'Featured', boolean: true }, { key: 'published', label: 'Published', boolean: true }];
const statFields = [{ key: 'value', label: 'Value', required: true }, { key: 'label', label: 'Label', required: true }, { key: 'icon', label: 'Icon' }, { key: 'active', label: 'Active', boolean: true }];
const certificationFields = [{ key: 'name', label: 'Certification name', required: true }, { key: 'issuer', label: 'Issuer' }, { key: 'credentialId', label: 'Credential ID' }, { key: 'credentialUrl', label: 'Credential URL', type: 'url' }, { key: 'issueDate', label: 'Issue date', type: 'date' }, { key: 'expirationDate', label: 'Expiration date', type: 'date' }, { key: 'certificateUrl', label: 'Certificate URL' }, { key: 'description', label: 'Description', multiline: true }, { key: 'published', label: 'Published', boolean: true }];

function defaultValue(fields) { return fields.reduce((result, field) => ({ ...result, [field.key]: field.boolean ? true : field.array ? [] : '' }), {}); }
function readNested(object, key) { return key.split('.').reduce((value, part) => value?.[part], object); }
function writeNested(object, key, value) { const parts = key.split('.'); if (parts.length === 1) return { ...object, [key]: value }; const [head, ...tail] = parts; return { ...object, [head]: writeNested(object[head] || {}, tail.join('.'), value) }; }

function SingletonEditor({ title, description, endpoint, fields }) {
  const [form, setForm] = useState(defaultValue(fields)); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [notice, setNotice] = useState(null);
  useEffect(() => { api(endpoint).then((data) => setForm({ ...defaultValue(fields), ...data })).catch((error) => setNotice({ type: 'error', text: error.message })).finally(() => setLoading(false)); }, [endpoint]);
  const update = (field, value) => setForm((current) => writeNested(current, field.key, field.array ? value.split(',').map((item) => item.trim()).filter(Boolean) : value));
  const save = async (event) => { event.preventDefault(); setSaving(true); setNotice(null); try { await api(endpoint, { method: 'PUT', body: JSON.stringify(form) }); setNotice({ type: 'success', text: `${title} updated successfully.` }); } catch (error) { setNotice({ type: 'error', text: error.message }); } finally { setSaving(false); } };
  if (loading) return <Loading text={`Loading ${title.toLowerCase()}...`} />;
  return <><PageHeader title={title} description={description} /><form className="panel editor-form" onSubmit={save}>{notice && <div className={`notice ${notice.type}`}>{notice.text}</div>}<div className="form-grid">{fields.map((field) => <EditorField key={field.key} field={field} value={readNested(form, field.key)} onChange={(value) => update(field, value)} />)}</div><FormActions saving={saving} /></form></>;
}

function ResourceEditor({ title, description, endpoint, fields }) {
  const [items, setItems] = useState([]); const [form, setForm] = useState(defaultValue(fields)); const [editing, setEditing] = useState(null); const [query, setQuery] = useState(''); const [page, setPage] = useState(1); const pageSize = 10; const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [notice, setNotice] = useState(null);
  const load = () => api(endpoint).then(setItems).catch((error) => setNotice({ type: 'error', text: error.message })).finally(() => setLoading(false));
  useEffect(() => { load(); }, [endpoint]);
  const filteredItems = useMemo(() => items.filter((item) => JSON.stringify(item).toLowerCase().includes(query.toLowerCase())), [items, query]);
  const visible = filteredItems.slice((page - 1) * pageSize, page * pageSize);
  const update = (field, value) => setForm((current) => ({ ...current, [field.key]: field.array ? value.split(',').map((item) => item.trim()).filter(Boolean) : value }));
  const edit = (item) => { setEditing(item.id); setForm({ ...defaultValue(fields), ...item }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const reset = () => { setEditing(null); setForm(defaultValue(fields)); };
  const save = async (event) => { event.preventDefault(); setSaving(true); setNotice(null); try { await api(`${endpoint}${editing ? `/${editing}` : ''}`, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(form) }); await load(); reset(); setNotice({ type: 'success', text: `${title.slice(0, -1)} ${editing ? 'updated' : 'created'} successfully.` }); } catch (error) { setNotice({ type: 'error', text: error.message }); } finally { setSaving(false); } };
  const remove = async (id) => { if (!window.confirm(`Delete this ${title.slice(0, -1).toLowerCase()}? This action cannot be undone.`)) return; try { await api(`${endpoint}/${id}`, { method: 'DELETE' }); await load(); setNotice({ type: 'success', text: 'Deleted successfully.' }); } catch (error) { setNotice({ type: 'error', text: error.message }); } };
  if (loading) return <Loading text={`Loading ${title.toLowerCase()}...`} />;
  return <><PageHeader title={title} description={description} action={<button className="primary-button" onClick={reset}>＋ New {title.slice(0, -1)}</button>} />{notice && <div className={`notice ${notice.type}`}>{notice.text}</div>}<form className="panel editor-form" onSubmit={save}><div className="panel-heading"><h2>{editing ? `Edit ${title.slice(0, -1)}` : `New ${title.slice(0, -1)}`}</h2>{editing && <button type="button" className="text-button" onClick={reset}>Cancel edit</button>}</div><div className="form-grid">{fields.map((field) => <EditorField key={field.key} field={field} value={form[field.key]} onChange={(value) => update(field, value)} />)}</div><FormActions saving={saving} /></form><div className="panel collection-panel"><div className="panel-heading"><h2>All {title}</h2><input className="search-input" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={`Search ${title.toLowerCase()}...`} aria-label={`Search ${title}`} /></div>{visible.length ? <div className="resource-list">{visible.map((item) => <div className="resource-row" key={item.id}><div className="resource-copy"><strong>{item.title || item.name || item.label || item.value || 'Untitled'}</strong><span>{item.description || item.quote || item.issuer || (item.published === false ? 'Draft' : 'Published')}</span><StatusBadge status={item.status} published={item.published} active={item.active} /><small>Updated {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'not yet'}</small></div><div className="row-actions"><Link className="secondary-button" to={`/admin/preview/${endpoint.split('/').pop()}/${item.id}`}>Preview</Link><button type="button" className="secondary-button" onClick={() => edit(item)}>Edit</button><WorkflowActions endpoint={endpoint} item={item} onDone={load} onError={(message) => setNotice({ type: 'error', text: message })} /><button type="button" className="danger-button" onClick={() => remove(item.id)}>Delete</button></div></div>)}</div> : <EmptyState text={query ? 'No matching content.' : `No ${title.toLowerCase()} yet.`} />}{filteredItems.length > pageSize && <Pagination page={page} pageSize={pageSize} total={filteredItems.length} onChange={setPage} />}</div></>;
}
function EditorField({ field, value, onChange }) { if (field.boolean) return <Toggle label={field.label} checked={value} onChange={onChange} />; const display = field.array ? (value || []).join(', ') : value ?? ''; return <Field label={field.label} value={display} onChange={onChange} type={field.type} required={field.required} multiline={field.multiline} maxLength={field.maxLength} placeholder={field.array ? 'Separate values with commas' : ''} />; }
function StatusBadge({ status, published, active }) { const value = status || (published === false || active === false ? 'draft' : 'published'); return <small className={`status-badge status-${value}`}>{value === 'review' ? 'In Review' : value[0].toUpperCase() + value.slice(1)}</small>; }
function Pagination({ page, pageSize, total, onChange }) { const pages = Math.ceil(total / pageSize); return <div className="pagination"><button type="button" className="secondary-button" disabled={page === 1} onClick={() => onChange(page - 1)}>Previous</button><span>Page {page} of {pages}</span><button type="button" className="secondary-button" disabled={page === pages} onClick={() => onChange(page + 1)}>Next</button></div>; }
function WorkflowActions({ endpoint, item, onDone, onError }) {
  const resource = endpoint.split('/').pop(); const status = item.status || (item.published === false ? 'draft' : 'published');
  const action = status === 'draft' ? 'review' : status === 'review' ? 'publish' : 'unpublish';
  const [versions, setVersions] = useState(null);
  const run = async () => { try { await api(`/api/admin/workflow/${resource}/${item.id}`, { method: 'POST', body: JSON.stringify({ action }) }); onDone(); } catch (error) { onError(error.message); } };
  const loadVersions = async () => { try { setVersions(await api(`/api/admin/versions/${resource}/${item.id}`)); } catch (error) { onError(error.message); } };
  const restore = async (versionId) => { if (!window.confirm('Restore this version as a draft?')) return; try { await api(`/api/admin/versions/${resource}/${item.id}/${versionId}/restore`, { method: 'POST' }); onDone(); setVersions(null); } catch (error) { onError(error.message); } };
  return <><button type="button" className="secondary-button workflow-button" onClick={run}>{action === 'review' ? 'Submit review' : action[0].toUpperCase() + action.slice(1)}</button><button type="button" className="text-button history-button" onClick={loadVersions}>History</button>{versions && <div className="version-popover"><strong>Version history</strong>{versions.length ? versions.map((version) => <div key={version.versionId}><span>{new Date(version.createdAt).toLocaleString()}</span><button type="button" className="text-button" onClick={() => restore(version.versionId)}>Restore</button></div>) : <small>No previous versions.</small>}</div>}</>;
}
function FormActions({ saving }) { return <div className="form-actions"><button className="primary-button" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button><button type="button" className="secondary-button" onClick={() => window.history.back()}>Cancel</button></div>; }
function Loading({ text }) { return <div className="loading-state"><span className="spinner" />{text}</div>; }
function PasswordEditor() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false); const [notice, setNotice] = useState(null);
  const save = async (event) => {
    event.preventDefault(); setNotice(null);
    if (form.newPassword !== form.confirmPassword) return setNotice({ type: 'error', text: 'New passwords do not match.' });
    setSaving(true);
    try { await api('/api/admin/password', { method: 'PUT', body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }) }); setForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setNotice({ type: 'success', text: 'Password changed successfully.' }); } catch (error) { setNotice({ type: 'error', text: error.message }); } finally { setSaving(false); }
  };
  return <form className="panel editor-form security-panel" onSubmit={save}><div className="panel-heading"><div><h2>Security</h2><p className="muted">Use at least 10 characters for your new password.</p></div></div>{notice && <div className={`notice ${notice.type}`}>{notice.text}</div>}<div className="form-grid"><Field label="Current password" value={form.currentPassword} onChange={(value) => setForm({ ...form, currentPassword: value })} type="password" required /><Field label="New password" value={form.newPassword} onChange={(value) => setForm({ ...form, newPassword: value })} type="password" required /><Field label="Confirm new password" value={form.confirmPassword} onChange={(value) => setForm({ ...form, confirmPassword: value })} type="password" required /></div><div className="form-actions"><button className="primary-button" disabled={saving}>{saving ? 'Updating...' : 'Change password'}</button></div></form>;
}

function MessagesPage() { const [items, setItems] = useState([]); const [query, setQuery] = useState(''); const [loading, setLoading] = useState(true); const load = () => api('/api/admin/messages').then(setItems).finally(() => setLoading(false)); useEffect(() => { load(); }, []); const update = async (id, status) => { await api(`/api/admin/messages/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }); load(); }; const remove = async (id) => { if (window.confirm('Delete this message? This action cannot be undone.')) { await api(`/api/admin/messages/${id}`, { method: 'DELETE' }); load(); } }; const filtered = items.filter((item) => JSON.stringify(item).toLowerCase().includes(query.toLowerCase())); return <><PageHeader title="Messages" description="Review real contact form submissions from your website." /><div className="panel collection-panel"><div className="panel-heading"><h2>Inbox</h2><input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search messages..." /></div>{loading ? <Loading text="Loading messages..." /> : filtered.length ? <div className="message-list">{filtered.map((item) => <article className="message-card" key={item.id}><div><strong>{item.name}</strong><a href={`mailto:${item.email}`}>{item.email}</a><small>{new Date(item.createdAt).toLocaleString()}</small></div><p>{item.message}</p><div className="row-actions"><select value={item.status || 'new'} onChange={(event) => update(item.id, event.target.value)} aria-label={`Status for ${item.name}`}><option value="new">New</option><option value="read">Read</option><option value="replied">Replied</option><option value="archived">Archived</option></select><button className="danger-button" onClick={() => remove(item.id)}>Delete</button></div></article>)}</div> : <EmptyState text="No contact messages yet." />}</div></>; }
function ActivityPage() { const [items, setItems] = useState([]); useEffect(() => { api('/api/admin/activity').then(setItems); }, []); return <><PageHeader title="Activity Logs" description="A chronological record of administrative changes." /><div className="panel collection-panel"><div className="activity-list">{items.length ? items.map((item) => <div className="activity-item" key={item.id}><span className="activity-dot" /><div><strong>{item.action} {item.entity}</strong><small>{item.user} · {new Date(item.createdAt).toLocaleString()}</small></div></div>) : <EmptyState text="No activity recorded yet." />}</div></div></>; }
function UsersPage() { const [items, setItems] = useState([]); const [notice, setNotice] = useState(''); useEffect(() => { api('/api/admin/users').then(setItems).catch((error) => setNotice(error.message)); }, []); const update = async (id, role) => { try { await api(`/api/admin/users/${id}`, { method: 'PUT', body: JSON.stringify({ role }) }); setNotice('User role updated successfully.'); } catch (error) { setNotice(error.message); } }; return <><PageHeader title="Users" description="Manage administrator roles with server-enforced permissions." />{notice && <div className="notice success">{notice}</div>}<div className="panel collection-panel"><div className="resource-list">{items.map((item) => <div className="resource-row" key={item.id}><div className="resource-copy"><strong>{item.name || item.email}</strong><span>{item.email}</span></div><select value={item.role || 'admin'} onChange={(event) => update(item.id, event.target.value)}><option value="super_admin">Super Admin</option><option value="admin">Admin</option><option value="editor">Editor</option></select></div>)}</div></div></>; }
function MediaPage() { const [items, setItems] = useState([]); const [notice, setNotice] = useState(''); const load = () => api('/api/admin/media').then(setItems); useEffect(() => { load(); }, []); const upload = (event) => { const file = event.target.files?.[0]; if (!file) return; const allowed = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']; if (!allowed.includes(file.type) || file.size > 5 * 1024 * 1024) { setNotice('Use PNG, JPG, WEBP, or PDF files under 5MB.'); return; } const reader = new FileReader(); reader.onload = async () => { try { await api('/api/admin/media', { method: 'POST', body: JSON.stringify({ filename: file.name, mime: file.type, data: reader.result, alt: file.name }) }); setNotice('Media uploaded successfully.'); load(); } catch (error) { setNotice(error.message); } }; reader.readAsDataURL(file); }; const remove = async (id) => { if (window.confirm('Remove this media? This action cannot be undone.')) { await api(`/api/admin/media/${id}`, { method: 'DELETE' }); load(); } }; return <><PageHeader title="Media Library" description="Upload safe, reusable assets for your content." action={<label className="primary-button upload-button">＋ Upload media<input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={upload} hidden /></label>} />{notice && <div className="notice success">{notice}</div>}<div className="media-grid">{items.length ? items.map((item) => <div className="media-card" key={item.id}>{item.mime.startsWith('image/') ? <img src={item.url} alt={item.alt || item.filename} /> : <div className="file-preview">PDF</div>}<strong>{item.filename}</strong><small>{Math.round(item.size / 1024)} KB</small><div className="row-actions"><button className="secondary-button" onClick={() => navigator.clipboard?.writeText(item.url)}>Copy URL</button><button className="danger-button" onClick={() => remove(item.id)}>Delete</button></div></div>) : <EmptyState text="No uploaded media yet." />}</div></>; }

function RequireAuth({ children }) { return localStorage.getItem('shakya_admin_token') ? children : <Navigate to="login" replace />; }
export default function AdminApp() { return <Routes><Route path="login" element={<AdminLogin />} /><Route path="*" element={<RequireAuth><AdminShell /></RequireAuth>} /></Routes>; }
