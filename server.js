import express from 'express'
import nodemailer from 'nodemailer'
import cors from 'cors'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const JWT_SECRET = process.env.JWT_SECRET
const IS_VERCEL = process.env.VERCEL === '1'
const SOURCE_DATA_PATH = path.join(process.cwd(), 'site-content.json')
const DATA_PATH = IS_VERCEL ? path.join('/tmp', 'shakya-site-content.json') : SOURCE_DATA_PATH
const MEDIA_DIR = IS_VERCEL ? path.join('/tmp', 'shakya-media') : path.join(process.cwd(), 'public', 'media')
const loginAttempts = new Map()
const roleRank = { viewer: 0, editor: 1, admin: 2, super_admin: 3 }
const writeAccess = {
  users: 'super_admin',
  settings: 'admin',
  seo: 'admin',
  messages: 'admin',
  media: 'editor'
}

if (!JWT_SECRET) throw new Error('JWT_SECRET must be configured before starting the server')

const defaultData = {
  settings: {
    companyName: 'Shakya Labs',
    tagline: 'Ancient Wisdom × Modern Engineering',
    email: 'Souravshakya951@gmail.com',
    phone: '+977-9800000000',
    address: 'Nepal',
    copyright: '© 2026 Shakya Labs. All rights reserved.',
    socialLinks: { github: '', linkedin: '', twitter: '' }
  },
  hero: {
    badge: 'Ancient Wisdom × Modern Engineering',
    heading: 'Engineering Digital Systems with Clarity and Purpose',
    description: 'Shakya Labs builds products, platforms, and scalable software solutions that transform complex business challenges into elegant systems.',
    primaryButtonText: 'Explore Products',
    primaryButtonUrl: '#products',
    secondaryButtonText: 'Work With Us',
    secondaryButtonUrl: '#contact',
    published: true
  },
  stats: [
    { id: '1', value: '50+', label: 'Projects Delivered', icon: '⚙️', active: true },
    { id: '2', value: '100%', label: 'Client Satisfaction', icon: '✅', active: true },
    { id: '3', value: '8+', label: 'Years Experience', icon: '🚀', active: true }
  ],
  about: {
    title: 'About Shakya Labs',
    description: 'Founded by Saurav Kumar Shakya, Shakya Labs is a technology innovation lab dedicated to building exceptional software systems that drive business success.',
    supportingText: 'We build digital platforms, software products, automation systems, and scalable experiences for modern businesses.',
    published: true
  },
  services: [
    { id: 'svc-1', title: 'Custom Web Application Development', description: 'Bespoke web applications engineered from the ground up to fit your unique business requirements and workflows perfectly.', icon: '⚙️', published: true },
    { id: 'svc-2', title: 'Backend System Design', description: 'Robust, scalable backend architectures with performant APIs designed for enterprise-grade reliability and growth.', icon: '🔌', published: true },
    { id: 'svc-3', title: 'Database Architecture', description: 'Strategic database design and optimization for data integrity, performance, and scalability at any volume.', icon: '💾', published: true },
    { id: 'svc-4', title: 'UI/UX Design', description: 'User-centered interface design that balances aesthetics with functionality for exceptional user experiences.', icon: '🎨', published: true },
    { id: 'svc-5', title: 'Automation Development', description: 'Custom automation solutions that streamline workflows, reduce manual effort, and increase operational efficiency.', icon: '🤖', published: true },
    { id: 'svc-6', title: 'Software Consulting', description: 'Expert guidance on technology decisions, architecture reviews, and modernization strategies for your tech stack.', icon: '💡', published: true }
  ],
  products: [
    { id: 'prod-1', title: 'College Management System', description: 'A multi-dashboard platform for Students, Faculty, Admin, and Parents', features: ['Attendance tracking and management', 'Examination and grading system', 'Internal messaging platform'], techStack: ['Java', 'MySQL', 'Spring Boot', 'React'], icon: '🎓', published: true },
    { id: 'prod-2', title: 'Movie Space Platform', description: 'A movie discovery platform with modern UI and robust backend', features: ['Comprehensive backend API', 'User authentication and authorization', 'Modern, responsive UI design'], techStack: ['React', 'Node.js', 'MongoDB', 'Express'], icon: '🎬', published: true },
    { id: 'prod-3', title: 'AI Chatbot System', description: 'Intelligent chatbot platform with automation workflows', features: ['Secure login authentication', 'MySQL database integration', 'Automated response workflows'], techStack: ['Python', 'MySQL', 'NLP', 'Flask'], icon: '🤖', published: true }
  ],
  projects: [
    { id: 'proj-1', title: 'College Management System', description: 'Comprehensive platform managing students, faculty, courses, and administration with real-time analytics.', techStack: ['Java', 'Spring Boot', 'MySQL', 'React', 'REST API'], category: 'Enterprise Software', url: 'https://example.com', published: true },
    { id: 'proj-2', title: 'Event Management System', description: 'End-to-end event planning and management platform with attendee tracking and automated communications.', techStack: ['Node.js', 'Express', 'MongoDB', 'Vue.js'], category: 'Web Application', published: true },
    { id: 'proj-3', title: 'Pilgrim Tour Website', description: 'Modern tourism website with booking system, itinerary management, and payment integration.', techStack: ['React', 'Tailwind CSS', 'Node.js', 'Stripe'], category: 'E-Commerce', published: true }
  ],
  testimonials: [
    { id: 't-1', quote: 'Working with Shakya Labs transformed our operations...', name: 'Dr. Rajesh Kumar', role: 'Academic Director', rating: 5, published: true },
    { id: 't-2', quote: 'The technical expertise and clear communication...', name: 'Priya Sharma', role: 'Product Manager', rating: 5, published: true }
  ],
  founder: {
    name: 'Saurav Kumar Shakya',
    title: 'Founder & Software Developer',
    bio: 'Saurav focuses on building scalable systems, product platforms, and real-world applications that solve meaningful problems.',
    skills: ['Java', 'Web Development', 'Google Apps Script', 'System Design', 'Backend Development', 'UI/UX Thinking'],
    certifications: ['Java Certification (NSDC)', 'Communication & Customer Relationship Certification (Teleperformance)'],
    published: true
  },
  seo: {
    siteTitle: 'Shakya Labs',
    metaDescription: 'Shakya Labs builds products, platforms, and scalable software solutions.',
    keywords: 'Shakya Labs, software development, backend engineering',
    canonicalUrl: 'https://www.shakyalabs.com/',
    ogTitle: 'Shakya Labs',
    ogDescription: 'Ancient Wisdom × Modern Engineering',
    ogImage: '/branding/shakyalabswithprofilelogo.png',
    pages: {}
  },
  certifications: [],
  media: [],
  versions: [],
  messages: [],
  admins: [],
  activity: []
}

const ensureStore = () => {
  if (!fs.existsSync(DATA_PATH)) {
    if (DATA_PATH !== SOURCE_DATA_PATH && fs.existsSync(SOURCE_DATA_PATH)) fs.copyFileSync(SOURCE_DATA_PATH, DATA_PATH)
    else {
      fs.writeFileSync(DATA_PATH, JSON.stringify(defaultData, null, 2))
      return defaultData
    }
  }

  const raw = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))
  const merged = { ...defaultData, ...raw }
  merged.settings = { ...defaultData.settings, ...(raw.settings || {}) }
  merged.hero = { ...defaultData.hero, ...(raw.hero || {}) }
  merged.about = { ...defaultData.about, ...(raw.about || {}) }
  merged.seo = { ...defaultData.seo, ...(raw.seo || {}) }
  merged.seo.pages = { ...(defaultData.seo.pages || {}), ...((raw.seo && raw.seo.pages) || {}) }
  merged.stats = raw.stats || defaultData.stats
  merged.services = raw.services || defaultData.services
  merged.products = raw.products || defaultData.products
  merged.projects = raw.projects || defaultData.projects
  merged.testimonials = raw.testimonials || defaultData.testimonials
  merged.founder = { ...defaultData.founder, ...(raw.founder || {}) }
  merged.messages = raw.messages || []
  merged.activity = raw.activity || []
  merged.admins = raw.admins || []
  merged.certifications = raw.certifications || []
  merged.media = raw.media || []
  merged.versions = raw.versions || []

  const workflowCollections = ['hero', 'about', 'services', 'products', 'projects', 'testimonials', 'founder', 'certifications']
  workflowCollections.forEach((collection) => {
    const value = merged[collection]
    if (Array.isArray(value)) {
      value.forEach((item) => {
        item.status = item.status || (item.published === false ? 'draft' : 'published')
        item.createdAt = item.createdAt || new Date().toISOString()
        item.updatedAt = item.updatedAt || item.createdAt
      })
    } else if (value && typeof value === 'object') {
      value.status = value.status || (value.published === false ? 'draft' : 'published')
      value.createdAt = value.createdAt || new Date().toISOString()
      value.updatedAt = value.updatedAt || value.createdAt
    }
  })

  if (!merged.admins.length) {
    const email = process.env.ADMIN_EMAIL
    const password = process.env.ADMIN_PASSWORD
    if (!email || !password) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be configured before creating the first admin')
    if (password.length < 10 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) throw new Error('ADMIN_PASSWORD must be at least 10 characters with upper, lower, and numeric characters')
    merged.admins = [{
      id: crypto.randomUUID(),
      email,
      passwordHash: bcrypt.hashSync(password, 10),
      role: 'super_admin',
      createdAt: new Date().toISOString()
    }]
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(merged, null, 2))
  return merged
}

const readStore = () => ensureStore()
const writeStore = (data) => fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2))

const logActivity = (userEmail, action, entity, metadata = {}) => {
  const data = readStore()
  data.activity.unshift({
    id: crypto.randomUUID(),
    user: userEmail || 'system',
    action,
    entity,
    metadata,
    createdAt: new Date().toISOString()
  })
  data.activity = data.activity.slice(0, 100)
  writeStore(data)
}

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  })
}

const transporter = createTransporter()
if (transporter) {
  transporter.verify((error) => {
    if (error) console.log('❌ Email service error:', error)
    else console.log('✅ Email service ready to send messages')
  })
}

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    return next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

const validatePayload = (req, res, next) => {
  const body = req.body || {}
  const serialized = JSON.stringify(body)
  if (serialized.length > 250000) return res.status(422).json({ message: 'Payload is too large' })
  const hasOversizedText = Object.values(body).some((value) => typeof value === 'string' && value.length > 10000)
  if (hasOversizedText) return res.status(422).json({ message: 'One or more fields are too long' })
  return next()
}

const requireMinimumRole = (minimumRole) => (req, res, next) => {
  if ((roleRank[req.user?.role] || -1) < (roleRank[minimumRole] || 0)) {
    return res.status(403).json({ message: 'You do not have permission to perform this action' })
  }
  return next()
}

const protectAdminApi = (req, res, next) => {
  if (req.path === '/login') return next()
  return requireAuth(req, res, () => {
    if (req.method === 'GET' || req.method === 'HEAD') return next()
    const resource = req.path.split('/').filter(Boolean)[0]
    const minimumRole = writeAccess[resource] || 'editor'
    return requireMinimumRole(minimumRole)(req, res, () => {
      if (versionedCollections.has(resource)) {
        const store = readStore()
        const existing = getCollectionItem(store, resource, req.path.split('/').filter(Boolean)[1])
        if (req.method === 'PUT' && existing) saveVersion(req.user.email, resource, existing)
        req.body = workflowBody(req.body || {}, existing, req.user.email)
      }
      return validatePayload(req, res, next)
    })
  })
}

const versionedCollections = new Set(['hero', 'about', 'services', 'products', 'projects', 'testimonials', 'founder', 'certifications'])
const getCollectionItem = (store, resource, id) => {
  const collection = store[resource]
  if (Array.isArray(collection)) return collection.find((item) => item.id === id)
  return collection
}
const saveVersion = (userEmail, resource, item) => {
  if (!item || !versionedCollections.has(resource)) return
  const data = readStore()
  data.versions.unshift({ versionId: crypto.randomUUID(), contentId: item.id || resource, contentType: resource, data: JSON.parse(JSON.stringify(item)), createdAt: new Date().toISOString(), createdBy: userEmail || 'system' })
  data.versions = data.versions.slice(0, 250)
  writeStore(data)
}
const workflowBody = (body, existing, userEmail) => {
  const status = body.status || (body.published === false ? 'draft' : existing?.status || 'published')
  const now = new Date().toISOString()
  const next = { ...body, status, published: status === 'published', updatedAt: now, updatedBy: userEmail }
  if (status === 'published') next.publishedAt = existing?.publishedAt || now
  return next
}

const passwordIsStrong = (password) => typeof password === 'string' && password.length >= 10 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password)
const mediaExtensions = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'application/pdf': '.pdf' }
const parseMediaUpload = ({ filename, mime, data }) => {
  if (!filename || !data || !mediaExtensions[mime] || !new RegExp(`^data:${mime};base64,`).test(data)) throw new Error('Unsupported or invalid media upload')
  const safeBase = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '-').replace(/\.{2,}/g, '.')
  if (path.extname(safeBase).toLowerCase() !== mediaExtensions[mime]) throw new Error('Invalid file extension')
  const buffer = Buffer.from(data.split(',')[1], 'base64')
  if (buffer.length > 5 * 1024 * 1024) throw new Error('File exceeds the 5MB size limit')
  return { safeBase, buffer }
}
const paginate = (source, query, filter = () => true) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1)
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20))
  const filtered = source.filter(filter)
  const pages = Math.max(1, Math.ceil(filtered.length / limit))
  const safePage = Math.min(page, pages)
  const start = (safePage - 1) * limit
  return { items: filtered.slice(start, start + limit), pagination: { page: safePage, limit, total: filtered.length, pages } }
}

app.use(cors(process.env.CORS_ORIGIN ? { origin: process.env.CORS_ORIGIN } : undefined))
app.use(express.json({ limit: '10mb' }))
fs.mkdirSync(MEDIA_DIR, { recursive: true })
app.use(['/media', '/api/media'], express.static(MEDIA_DIR))
app.use('/api/admin', protectAdminApi)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/site', (req, res) => {
  const store = readStore()
  res.json({
    hero: store.hero,
    stats: store.stats.filter((s) => s.active !== false),
    about: store.about,
    services: store.services.filter((s) => s.published !== false),
    products: store.products.filter((s) => s.published !== false),
    projects: store.projects.filter((s) => s.published !== false),
    testimonials: store.testimonials.filter((s) => s.published !== false),
    founder: store.founder,
    settings: store.settings,
    seo: store.seo
    , certifications: store.certifications
  })
})

app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body || {}
  const attemptKey = String(email || '').trim().toLowerCase() || req.ip
  const previousAttempts = loginAttempts.get(attemptKey) || { count: 0, firstAttempt: Date.now() }
  if (Date.now() - previousAttempts.firstAttempt > 15 * 60 * 1000) {
    previousAttempts.count = 0
    previousAttempts.firstAttempt = Date.now()
  }
  if (previousAttempts.count >= 5) return res.status(429).json({ message: 'Too many login attempts. Try again later.' })
  const store = readStore()
  const admin = store.admins.find((entry) => entry.email === email)

  if (!admin || !bcrypt.compareSync(password || '', admin.passwordHash)) {
    previousAttempts.count += 1
    loginAttempts.set(attemptKey, previousAttempts)
    logActivity(email, 'failed_login', 'security')
    return res.status(401).json({ message: 'Invalid email or password' })
  }

  loginAttempts.delete(attemptKey)
  admin.lastLogin = new Date().toISOString()
  writeStore(store)
  const token = jwt.sign({ email: admin.email, role: admin.role }, JWT_SECRET, { expiresIn: '8h' })
  logActivity(admin.email, 'login', 'admin')

  return res.json({
    token,
    user: { email: admin.email, role: admin.role }
  })
})

app.get('/api/admin/me', requireAuth, (req, res) => {
  const store = readStore()
  const admin = store.admins.find((entry) => entry.email === req.user.email)
  if (!admin) return res.status(401).json({ message: 'Admin account not found' })
  return res.json({ user: { email: admin.email, role: admin.role } })
})

app.put('/api/admin/password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body || {}
  if (!currentPassword || typeof newPassword !== 'string' || newPassword.length < 10) {
    return res.status(422).json({ message: 'New password must be at least 10 characters' })
  }
  const store = readStore(); const admin = store.admins.find((entry) => entry.email === req.user.email)
  if (!admin || !bcrypt.compareSync(currentPassword, admin.passwordHash)) return res.status(401).json({ message: 'Current password is incorrect' })
  admin.passwordHash = bcrypt.hashSync(newPassword, 12)
  writeStore(store); logActivity(req.user.email, 'changed_password', 'security'); res.json({ ok: true })
})

app.get('/api/admin/dashboard', requireAuth, (req, res) => {
  const store = readStore()
  const workflowItems = [...store.hero ? [store.hero] : [], ...store.about ? [store.about] : [], ...store.services, ...store.products, ...store.projects, ...store.testimonials, ...store.founder ? [store.founder] : [], ...store.certifications]
  res.json({
    metrics: {
      projects: store.projects.length,
      products: store.products.length,
      services: store.services.length,
      testimonials: store.testimonials.length,
      messages: store.messages.length,
      published: workflowItems.filter((item) => item.status === 'published' || (item.status == null && item.published !== false)).length,
      drafts: workflowItems.filter((item) => item.status === 'draft' || (item.status == null && item.published === false)).length,
      review: workflowItems.filter((item) => item.status === 'review').length,
      unreadMessages: store.messages.filter((item) => !item.status || item.status === 'new' || item.status === 'unread').length
    },
    recentActivity: store.activity.slice(0, 8),
    recentlyUpdated: workflowItems.filter((item) => item.updatedAt).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5),
    needsReview: workflowItems.filter((item) => item.status === 'review').slice(0, 5)
  })
})

app.get('/api/admin/services', requireAuth, (req, res) => {
  const store = readStore()
  res.json(store.services)
})

app.post('/api/admin/services', requireAuth, (req, res) => {
  const store = readStore()
  const item = { id: crypto.randomUUID(), ...req.body, createdAt: new Date().toISOString() }
  store.services.unshift(item)
  writeStore(store)
  logActivity(req.user.email, 'created', 'service', { id: item.id })
  res.status(201).json(item)
})

app.put('/api/admin/services/:id', requireAuth, (req, res) => {
  const store = readStore()
  const index = store.services.findIndex((item) => item.id === req.params.id)
  if (index === -1) return res.status(404).json({ message: 'Service not found' })
  store.services[index] = { ...store.services[index], ...req.body }
  writeStore(store)
  logActivity(req.user.email, 'updated', 'service', { id: req.params.id })
  res.json(store.services[index])
})

app.delete('/api/admin/services/:id', requireAuth, (req, res) => {
  const store = readStore()
  store.services = store.services.filter((item) => item.id !== req.params.id)
  writeStore(store)
  logActivity(req.user.email, 'deleted', 'service', { id: req.params.id })
  res.json({ ok: true })
})

app.get('/api/admin/products', requireAuth, (req, res) => {
  const store = readStore(); res.json(store.products)
})
app.post('/api/admin/products', requireAuth, (req, res) => {
  const store = readStore(); const item = { id: crypto.randomUUID(), ...req.body, createdAt: new Date().toISOString() }; store.products.unshift(item); writeStore(store); logActivity(req.user.email, 'created', 'product', { id: item.id }); res.status(201).json(item)
})
app.put('/api/admin/products/:id', requireAuth, (req, res) => {
  const store = readStore(); const index = store.products.findIndex((i) => i.id === req.params.id); if (index === -1) return res.status(404).json({ message: 'Product not found' }); store.products[index] = { ...store.products[index], ...req.body }; writeStore(store); logActivity(req.user.email, 'updated', 'product', { id: req.params.id }); res.json(store.products[index])
})
app.delete('/api/admin/products/:id', requireAuth, (req, res) => {
  const store = readStore(); store.products = store.products.filter((i) => i.id !== req.params.id); writeStore(store); logActivity(req.user.email, 'deleted', 'product', { id: req.params.id }); res.json({ ok: true })
})

app.get('/api/admin/projects', requireAuth, (req, res) => {
  const store = readStore(); res.json(store.projects)
})
app.post('/api/admin/projects', requireAuth, (req, res) => {
  const store = readStore(); const item = { id: crypto.randomUUID(), ...req.body, createdAt: new Date().toISOString() }; store.projects.unshift(item); writeStore(store); logActivity(req.user.email, 'created', 'project', { id: item.id }); res.status(201).json(item)
})
app.put('/api/admin/projects/:id', requireAuth, (req, res) => {
  const store = readStore(); const index = store.projects.findIndex((i) => i.id === req.params.id); if (index === -1) return res.status(404).json({ message: 'Project not found' }); store.projects[index] = { ...store.projects[index], ...req.body }; writeStore(store); logActivity(req.user.email, 'updated', 'project', { id: req.params.id }); res.json(store.projects[index])
})
app.delete('/api/admin/projects/:id', requireAuth, (req, res) => {
  const store = readStore(); store.projects = store.projects.filter((i) => i.id !== req.params.id); writeStore(store); logActivity(req.user.email, 'deleted', 'project', { id: req.params.id }); res.json({ ok: true })
})

app.get('/api/admin/testimonials', requireAuth, (req, res) => {
  const store = readStore(); res.json(store.testimonials)
})
app.post('/api/admin/testimonials', requireAuth, (req, res) => {
  const store = readStore(); const item = { id: crypto.randomUUID(), ...req.body, createdAt: new Date().toISOString() }; store.testimonials.unshift(item); writeStore(store); logActivity(req.user.email, 'created', 'testimonial', { id: item.id }); res.status(201).json(item)
})
app.put('/api/admin/testimonials/:id', requireAuth, (req, res) => {
  const store = readStore(); const index = store.testimonials.findIndex((i) => i.id === req.params.id); if (index === -1) return res.status(404).json({ message: 'Testimonial not found' }); store.testimonials[index] = { ...store.testimonials[index], ...req.body }; writeStore(store); logActivity(req.user.email, 'updated', 'testimonial', { id: req.params.id }); res.json(store.testimonials[index])
})
app.delete('/api/admin/testimonials/:id', requireAuth, (req, res) => {
  const store = readStore(); store.testimonials = store.testimonials.filter((i) => i.id !== req.params.id); writeStore(store); logActivity(req.user.email, 'deleted', 'testimonial', { id: req.params.id }); res.json({ ok: true })
})

app.get('/api/admin/founder', requireAuth, (req, res) => {
  const store = readStore(); res.json(store.founder)
})
app.get('/api/admin/hero', requireAuth, (req, res) => {
  const store = readStore(); res.json(store.hero)
})
app.put('/api/admin/hero', requireAuth, (req, res) => {
  const store = readStore(); store.hero = { ...store.hero, ...req.body }; writeStore(store); logActivity(req.user.email, 'updated', 'hero'); res.json(store.hero)
})
app.put('/api/admin/founder', requireAuth, (req, res) => {
  const store = readStore(); store.founder = { ...store.founder, ...req.body }; writeStore(store); logActivity(req.user.email, 'updated', 'founder'); res.json(store.founder)
})

app.get('/api/admin/settings', requireAuth, (req, res) => {
  const store = readStore(); res.json(store.settings)
})
app.put('/api/admin/settings', requireAuth, (req, res) => {
  const store = readStore(); store.settings = { ...store.settings, ...req.body }; writeStore(store); logActivity(req.user.email, 'updated', 'settings'); res.json(store.settings)
})

app.get('/api/admin/messages', requireAuth, (req, res) => {
  const store = readStore(); const status = req.query.status; const query = String(req.query.search || '').toLowerCase()
  const result = paginate(store.messages, req.query, (item) => (!status || status === 'all' || (item.status || 'new') === status) && (!query || JSON.stringify(item).toLowerCase().includes(query)))
  res.json(result)
})
app.put('/api/admin/messages/:id', requireAuth, (req, res) => {
  const store = readStore(); const index = store.messages.findIndex((m) => m.id === req.params.id); if (index === -1) return res.status(404).json({ message: 'Message not found' }); store.messages[index] = { ...store.messages[index], ...req.body }; writeStore(store); logActivity(req.user.email, 'updated', 'message', { id: req.params.id }); res.json(store.messages[index])
})
app.delete('/api/admin/messages/:id', requireAuth, (req, res) => {
  const store = readStore(); store.messages = store.messages.filter((m) => m.id !== req.params.id); writeStore(store); logActivity(req.user.email, 'deleted', 'message', { id: req.params.id }); res.json({ ok: true })
})

app.get('/api/admin/activity', requireAuth, (req, res) => {
  const store = readStore(); const query = String(req.query.search || '').toLowerCase(); const action = String(req.query.action || '')
  const result = paginate(store.activity, req.query, (item) => (!action || item.action === action) && (!req.query.user || item.user === req.query.user) && (!req.query.dateFrom || item.createdAt >= `${req.query.dateFrom}T00:00:00.000Z`) && (!req.query.dateTo || item.createdAt <= `${req.query.dateTo}T23:59:59.999Z`) && (!query || JSON.stringify(item).toLowerCase().includes(query)))
  res.json(result)
})

app.get('/api/admin/about', requireAuth, (req, res) => {
  res.json(readStore().about)
})
app.put('/api/admin/about', requireAuth, (req, res) => {
  const store = readStore()
  const allowed = ['title', 'heading', 'description', 'supportingText', 'image', 'ctaText', 'ctaUrl', 'published']
  store.about = { ...store.about, ...Object.fromEntries(allowed.filter((key) => key in (req.body || {})).map((key) => [key, req.body[key]])) }
  writeStore(store); logActivity(req.user.email, 'updated', 'about'); res.json(store.about)
})

app.get('/api/admin/stats', requireAuth, (req, res) => res.json(readStore().stats))
app.post('/api/admin/stats', requireAuth, (req, res) => {
  const store = readStore(); const item = { id: crypto.randomUUID(), value: '', label: '', icon: '', active: true, ...req.body }
  store.stats.push(item); writeStore(store); logActivity(req.user.email, 'created', 'stat', { id: item.id }); res.status(201).json(item)
})
app.put('/api/admin/stats/:id', requireAuth, (req, res) => {
  const store = readStore(); const index = store.stats.findIndex((item) => item.id === req.params.id)
  if (index === -1) return res.status(404).json({ message: 'Statistic not found' })
  store.stats[index] = { ...store.stats[index], value: req.body.value ?? store.stats[index].value, label: req.body.label ?? store.stats[index].label, icon: req.body.icon ?? store.stats[index].icon, active: req.body.active !== false }
  writeStore(store); logActivity(req.user.email, 'updated', 'stat', { id: req.params.id }); res.json(store.stats[index])
})
app.delete('/api/admin/stats/:id', requireAuth, (req, res) => {
  const store = readStore(); store.stats = store.stats.filter((item) => item.id !== req.params.id); writeStore(store); logActivity(req.user.email, 'deleted', 'stat', { id: req.params.id }); res.json({ ok: true })
})

app.get('/api/admin/seo', requireAuth, (req, res) => res.json(readStore().seo))
app.put('/api/admin/seo', requireAuth, (req, res) => {
  const store = readStore(); store.seo = { ...store.seo, ...req.body }; writeStore(store); logActivity(req.user.email, 'updated', 'seo'); res.json(store.seo)
})

app.get('/api/admin/certifications', requireAuth, (req, res) => res.json(readStore().certifications))
app.post('/api/admin/certifications', requireAuth, (req, res) => {
  const store = readStore(); const item = { id: crypto.randomUUID(), published: true, ...req.body, createdAt: new Date().toISOString() }
  store.certifications.unshift(item); writeStore(store); logActivity(req.user.email, 'created', 'certification', { id: item.id }); res.status(201).json(item)
})
app.put('/api/admin/certifications/:id', requireAuth, (req, res) => {
  const store = readStore(); const index = store.certifications.findIndex((item) => item.id === req.params.id)
  if (index === -1) return res.status(404).json({ message: 'Certification not found' })
  store.certifications[index] = { ...store.certifications[index], ...req.body }; writeStore(store); logActivity(req.user.email, 'updated', 'certification', { id: req.params.id }); res.json(store.certifications[index])
})
app.delete('/api/admin/certifications/:id', requireAuth, (req, res) => {
  const store = readStore(); store.certifications = store.certifications.filter((item) => item.id !== req.params.id); writeStore(store); logActivity(req.user.email, 'deleted', 'certification', { id: req.params.id }); res.json({ ok: true })
})

app.get('/api/admin/media', requireAuth, (req, res) => {
  const store = readStore(); const query = String(req.query.search || '').toLowerCase(); const category = String(req.query.category || '')
  res.json(paginate(store.media, req.query, (item) => (!category || (item.category || 'General') === category) && (!query || JSON.stringify(item).toLowerCase().includes(query))))
})
app.post('/api/admin/media', requireAuth, (req, res) => {
  const { filename, mime, data, alt = '', category = 'General', dimensions = '' } = req.body || {}
  let parsed
  try { parsed = parseMediaUpload({ filename, mime, data }) } catch (error) { return res.status(422).json({ message: error.message }) }
  const { safeBase, buffer } = parsed
  fs.mkdirSync(MEDIA_DIR, { recursive: true })
  const storedName = `${crypto.randomUUID()}${mediaExtensions[mime]}`; fs.writeFileSync(path.join(MEDIA_DIR, storedName), buffer)
  const categories = ['Branding', 'Projects', 'Products', 'Services', 'Founder', 'Testimonials', 'General']
  if (!categories.includes(category)) return res.status(422).json({ message: 'Invalid media category' })
  const item = { id: crypto.randomUUID(), filename: safeBase, mime, size: buffer.length, url: `/media/${storedName}`, alt, category, dimensions, uploader: req.user.email, createdAt: new Date().toISOString() }
  const store = readStore(); store.media.unshift(item); writeStore(store); logActivity(req.user.email, 'created', 'media', { id: item.id }); res.status(201).json(item)
})
app.put('/api/admin/media/:id', requireAuth, (req, res) => {
  const store = readStore(); const index = store.media.findIndex((entry) => entry.id === req.params.id)
  if (index === -1) return res.status(404).json({ message: 'Media not found' })
  const categories = ['Branding', 'Projects', 'Products', 'Services', 'Founder', 'Testimonials', 'General']
  const { alt, category, filename } = req.body || {}
  if (category && !categories.includes(category)) return res.status(422).json({ message: 'Invalid media category' })
  if (filename && (path.basename(filename) !== filename || !/^[a-zA-Z0-9._-]+$/.test(filename))) return res.status(422).json({ message: 'Invalid filename' })
  store.media[index] = { ...store.media[index], ...(alt !== undefined ? { alt } : {}), ...(category ? { category } : {}), ...(filename ? { filename } : {}) }
  writeStore(store); logActivity(req.user.email, 'updated', 'media', { id: req.params.id }); res.json(store.media[index])
})
app.put('/api/admin/media/:id/replace', requireAuth, (req, res) => {
  const store = readStore(); const index = store.media.findIndex((entry) => entry.id === req.params.id)
  if (index === -1) return res.status(404).json({ message: 'Media not found' })
  const item = store.media[index]; const { filename, mime, data } = req.body || {}
  if (mime !== item.mime) return res.status(422).json({ message: 'Replacement must use the same file type to preserve existing references' })
  let parsed
  try { parsed = parseMediaUpload({ filename, mime, data }) } catch (error) { return res.status(422).json({ message: error.message }) }
  if (!item.url.startsWith('/media/')) return res.status(422).json({ message: 'Media reference cannot be safely replaced' })
  const mediaRoot = MEDIA_DIR; const target = path.join(MEDIA_DIR, path.basename(item.url))
  if (!target.startsWith(`${mediaRoot}${path.sep}`)) return res.status(422).json({ message: 'Invalid media path' })
  fs.writeFileSync(target, parsed.buffer)
  store.media[index] = { ...item, filename: parsed.safeBase, size: parsed.buffer.length, updatedAt: new Date().toISOString(), updatedBy: req.user.email }
  writeStore(store); logActivity(req.user.email, 'updated', 'media', { id: item.id, replacement: true }); res.json(store.media[index])
})
app.delete('/api/admin/media/:id', requireAuth, (req, res) => {
  const store = readStore(); const item = store.media.find((entry) => entry.id === req.params.id)
  if (!item) return res.status(404).json({ message: 'Media not found' })
  const serialized = JSON.stringify(store)
  if (serialized.includes(item.url)) return res.status(409).json({ message: 'This media is referenced by CMS content. Remove the reference before deleting it.' })
  if (item.url.startsWith('/media/')) fs.rmSync(path.join(MEDIA_DIR, path.basename(item.url)), { force: true })
  store.media = store.media.filter((entry) => entry.id !== req.params.id); writeStore(store); logActivity(req.user.email, 'deleted', 'media', { id: req.params.id }); res.json({ ok: true })
})

app.get('/api/admin/users', requireAuth, (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ message: 'Super Admin access required' })
  const store = readStore(); const query = String(req.query.search || '').toLowerCase(); const status = String(req.query.status || '')
  const result = paginate(store.admins, req.query, (item) => (!status || item.status === status) && (!query || JSON.stringify(item).toLowerCase().includes(query)))
  result.items = result.items.map(({ passwordHash, ...user }) => user)
  res.json(result)
})
app.post('/api/admin/users', requireAuth, (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ message: 'Super Admin access required' })
  const { email, password, role = 'viewer', status = 'active', name = '' } = req.body || {}
  if (!email || !/^\S+@\S+\.\S+$/.test(email) || !passwordIsStrong(password) || !roleRank.hasOwnProperty(role) || !['active', 'inactive'].includes(status)) return res.status(422).json({ message: 'Provide a valid email, strong password (10+ chars with upper, lower, and number), role, and status' })
  const store = readStore()
  if (store.admins.some((admin) => admin.email.toLowerCase() === email.toLowerCase())) return res.status(409).json({ message: 'An account with this email already exists' })
  const user = { id: crypto.randomUUID(), email, name, role, status, passwordHash: bcrypt.hashSync(password, 12), createdAt: new Date().toISOString(), lastLogin: null }
  store.admins.unshift(user); writeStore(store); logActivity(req.user.email, 'created', 'user', { id: user.id }); const { passwordHash, ...safeUser } = user; res.status(201).json(safeUser)
})
app.put('/api/admin/users/:id', requireAuth, (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ message: 'Super Admin access required' })
  const store = readStore(); const index = store.admins.findIndex((item) => item.id === req.params.id)
  if (index === -1) return res.status(404).json({ message: 'User not found' })
  const current = store.admins[index]; const superAdminCount = store.admins.filter((admin) => admin.role === 'super_admin' && admin.status !== 'inactive').length
  if (current.role === 'super_admin' && superAdminCount <= 1 && ['role', 'status'].some((key) => key in (req.body || {}) && (key === 'status' ? req.body[key] !== 'active' : req.body[key] !== 'super_admin'))) return res.status(409).json({ message: 'The final active Super Admin cannot be demoted or deactivated' })
  if (req.body.password && !passwordIsStrong(req.body.password)) return res.status(422).json({ message: 'Password must be strong (10+ chars with upper, lower, and number)' })
  if (req.body.role && !Object.prototype.hasOwnProperty.call(roleRank, req.body.role)) return res.status(422).json({ message: 'Invalid role' })
  if (req.body.status && !['active', 'inactive'].includes(req.body.status)) return res.status(422).json({ message: 'Invalid status' })
  const allowed = ['email', 'role', 'status', 'name']; store.admins[index] = { ...current, ...Object.fromEntries(allowed.filter((key) => key in (req.body || {})).map((key) => [key, req.body[key]])) }
  if (req.body.password) store.admins[index].passwordHash = bcrypt.hashSync(req.body.password, 12)
  writeStore(store); logActivity(req.user.email, 'updated', 'user', { id: req.params.id }); const { passwordHash, ...user } = store.admins[index]; res.json(user)
})
app.delete('/api/admin/users/:id', requireAuth, (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ message: 'Super Admin access required' })
  const store = readStore(); const user = store.admins.find((admin) => admin.id === req.params.id)
  if (!user) return res.status(404).json({ message: 'User not found' })
  if (user.role === 'super_admin' && store.admins.filter((admin) => admin.role === 'super_admin' && admin.status !== 'inactive').length <= 1) return res.status(409).json({ message: 'The final Super Admin cannot be deleted' })
  store.admins = store.admins.filter((admin) => admin.id !== req.params.id); writeStore(store); logActivity(req.user.email, 'deleted', 'user', { id: req.params.id }); res.json({ ok: true })
})

app.get('/api/admin/versions/:resource/:id', requireAuth, (req, res) => {
  if (!versionedCollections.has(req.params.resource)) return res.status(404).json({ message: 'Version history is unavailable for this resource' })
  const store = readStore()
  res.json(store.versions.filter((version) => version.contentType === req.params.resource && version.contentId === req.params.id))
})

app.post('/api/admin/workflow/:resource/:id', requireAuth, (req, res) => {
  const { resource, id } = req.params
  const action = req.body?.action
  const allowedActions = ['draft', 'review', 'publish', 'unpublish']
  if (!versionedCollections.has(resource) || !allowedActions.includes(action)) return res.status(422).json({ message: 'Unsupported workflow action' })
  if (['publish', 'unpublish'].includes(action) && (roleRank[req.user.role] || -1) < roleRank.admin) return res.status(403).json({ message: 'Admin access required to publish content' })
  let store = readStore(); let item = getCollectionItem(store, resource, id)
  if (!item) return res.status(404).json({ message: 'Content not found' })
  saveVersion(req.user.email, resource, item)
  store = readStore(); item = getCollectionItem(store, resource, id)
  const status = action === 'review' ? 'review' : action === 'publish' ? 'published' : 'draft'
  const now = new Date().toISOString()
  Object.assign(item, { status, published: status === 'published', updatedAt: now, updatedBy: req.user.email })
  if (status === 'published') Object.assign(item, { publishedAt: now, publishedBy: req.user.email })
  writeStore(store); logActivity(req.user.email, action, resource, { id }); res.json(item)
})

app.post('/api/admin/versions/:resource/:id/:versionId/restore', requireAuth, (req, res) => {
  if (!versionedCollections.has(req.params.resource) || (roleRank[req.user.role] || -1) < roleRank.editor) return res.status(403).json({ message: 'Editor access required to restore content' })
  let store = readStore(); const version = store.versions.find((entry) => entry.versionId === req.params.versionId && entry.contentType === req.params.resource && entry.contentId === req.params.id)
  if (!version) return res.status(404).json({ message: 'Version not found' })
  const current = getCollectionItem(store, req.params.resource, req.params.id)
  if (!current) return res.status(404).json({ message: 'Content not found' })
  saveVersion(req.user.email, req.params.resource, current)
  store = readStore()
  const restored = getCollectionItem(store, req.params.resource, req.params.id)
  Object.assign(restored, JSON.parse(JSON.stringify(version.data)), { status: 'draft', published: false, updatedAt: new Date().toISOString(), updatedBy: req.user.email })
  writeStore(store); logActivity(req.user.email, 'restored', req.params.resource, { id: req.params.id, versionId: req.params.versionId }); res.json(current)
})

app.get('/api/admin/paginated/:resource', requireAuth, (req, res) => {
  const allowed = ['services', 'products', 'projects', 'testimonials', 'messages', 'activity', 'media', 'admins', 'certifications', 'stats']
  if (!allowed.includes(req.params.resource)) return res.status(404).json({ message: 'Resource not found' })
  if (req.params.resource === 'admins' && req.user.role !== 'super_admin') return res.status(403).json({ message: 'Super Admin access required' })
  const store = readStore(); const source = store[req.params.resource] || []; const query = String(req.query.search || '').toLowerCase()
  const result = paginate(source, req.query, (item) => !query || JSON.stringify(item).toLowerCase().includes(query))
  result.items = result.items.map((item) => req.params.resource === 'admins' ? (({ passwordHash, ...user }) => user)(item) : item)
  res.json(result)
})

app.post('/api/sendMail', async (req, res) => {
  const { name, email, message } = req.body || {}
  if (!name || !email || !message) {
    return res.status(400).json({ status: 'error', message: 'All fields are required' })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ status: 'error', message: 'Invalid email format' })
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return res.status(503).json({ status: 'error', message: 'Email service is not configured.' })
  }

  try {
    const sendVia = createTransporter()
    const store = readStore()
    const incomingMessage = {
      id: crypto.randomUUID(),
      name,
      email,
      message,
      status: 'new',
      createdAt: new Date().toISOString()
    }
    store.messages.unshift(incomingMessage)
    writeStore(store)
    logActivity('website-form', 'contact_message', 'message', { email })

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'Souravshakya951@gmail.com',
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        </div>
      `
    }

    await sendVia.sendMail(mailOptions)
    return res.status(200).json({ status: 'success', message: 'Email sent successfully! We will get back to you soon.' })
  } catch (error) {
    console.error('Error sending email:', error)
    return res.status(500).json({ status: 'error', message: 'Failed to send email. Please try again later.' })
  }
})

if (!IS_VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  })
}

export default app
