import crypto from 'crypto'

const JOB_STATUSES = ['draft', 'pending_review', 'published', 'closed', 'archived']
const WORK_MODES = ['remote', 'hybrid', 'onsite']
const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'internship', 'freelance']

const asArray = (value) => Array.isArray(value) ? value.filter(Boolean).map((item) => String(item).trim()).filter(Boolean) : []
const slugify = (value) => String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120)
const normalizeDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}
const isHttpUrl = (value) => !value || (() => { try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) } catch { return false } })()

const normalizeJob = (input = {}, existing = {}) => {
  const title = String(input.title ?? existing.title ?? '').trim()
  const companyName = String(input.companyName ?? existing.companyName ?? '').trim()
  const status = JOB_STATUSES.includes(input.status ?? existing.status) ? (input.status ?? existing.status) : 'draft'
  const rawDeadline = input.deadline ?? existing.deadline
  const normalizedDeadline = rawDeadline === '' ? null : normalizeDate(rawDeadline)
  const now = new Date().toISOString()
  return {
    id: existing.id || input.id,
    slug: slugify(input.slug ?? existing.slug ?? title),
    title,
    companyId: String(input.companyId ?? existing.companyId ?? '').trim(),
    companyName,
    companyLogo: String(input.companyLogo ?? existing.companyLogo ?? '').trim(),
    location: String(input.location ?? existing.location ?? '').trim(),
    workMode: WORK_MODES.includes(input.workMode ?? existing.workMode) ? (input.workMode ?? existing.workMode) : 'onsite',
    employmentType: EMPLOYMENT_TYPES.includes(input.employmentType ?? existing.employmentType) ? (input.employmentType ?? existing.employmentType) : 'full-time',
    experienceLevel: String(input.experienceLevel ?? existing.experienceLevel ?? '').trim(),
    salaryMin: input.salaryMin === '' || input.salaryMin == null ? (existing.salaryMin ?? null) : Number(input.salaryMin),
    salaryMax: input.salaryMax === '' || input.salaryMax == null ? (existing.salaryMax ?? null) : Number(input.salaryMax),
    salaryCurrency: String(input.salaryCurrency ?? existing.salaryCurrency ?? 'USD').trim().toUpperCase(),
    salaryPeriod: String(input.salaryPeriod ?? existing.salaryPeriod ?? 'year').trim(),
    skills: asArray(input.skills ?? existing.skills),
    category: String(input.category ?? existing.category ?? '').trim(),
    description: String(input.description ?? existing.description ?? '').trim(),
    responsibilities: asArray(input.responsibilities ?? existing.responsibilities),
    requirements: asArray(input.requirements ?? existing.requirements),
    qualifications: asArray(input.qualifications ?? existing.qualifications),
    benefits: asArray(input.benefits ?? existing.benefits),
    applicationUrl: String(input.applicationUrl ?? existing.applicationUrl ?? '').trim(),
    applicationEmail: String(input.applicationEmail ?? existing.applicationEmail ?? '').trim(),
    whatsappContact: String(input.whatsappContact ?? existing.whatsappContact ?? '').trim(),
    deadline: normalizedDeadline || (rawDeadline ? String(rawDeadline) : null),
    source: String(input.source ?? existing.source ?? 'manual').trim(),
    sourceUrl: String(input.sourceUrl ?? existing.sourceUrl ?? '').trim(),
    sourceMessage: String(input.sourceMessage ?? existing.sourceMessage ?? '').trim(),
    featured: input.featured ?? existing.featured ?? false,
    views: Number(input.views ?? existing.views ?? 0) || 0,
    status,
    createdAt: existing.createdAt || input.createdAt || now,
    updatedAt: now,
    publishedAt: status === 'published' ? (existing.publishedAt || now) : (existing.publishedAt || null)
  }
}

const validateJob = (job) => {
  const errors = []
  if (!job.title || job.title.length < 3 || job.title.length > 160) errors.push('Job title must be 3 to 160 characters')
  if (!job.companyName) errors.push('Company name is required')
  if (!job.location) errors.push('Location is required')
  if (!job.description || job.description.length < 20 || job.description.length > 10000) errors.push('Description must be 20 to 10000 characters')
  if (!JOB_STATUSES.includes(job.status)) errors.push('Invalid job status')
  if (!WORK_MODES.includes(job.workMode)) errors.push('Invalid work mode')
  if (!EMPLOYMENT_TYPES.includes(job.employmentType)) errors.push('Invalid employment type')
  if ([job.salaryMin, job.salaryMax].some((value) => value != null && (!Number.isFinite(value) || value < 0))) errors.push('Salary values must be non-negative numbers')
  if (job.salaryMin != null && job.salaryMax != null && job.salaryMin > job.salaryMax) errors.push('Minimum salary cannot exceed maximum salary')
  if (typeof job.featured !== 'boolean') errors.push('Featured must be a boolean')
  if (!/^[A-Z]{3}$/.test(job.salaryCurrency)) errors.push('Salary currency must be a three-letter code')
  if (!['hour', 'month', 'year'].includes(job.salaryPeriod)) errors.push('Salary period is invalid')
  if (job.deadline && Number.isNaN(new Date(job.deadline).getTime())) errors.push('Deadline must be a valid date')
  if (![job.applicationUrl, job.sourceUrl, job.companyLogo].every(isHttpUrl)) errors.push('External URLs must use http or https')
  if (job.applicationEmail && !/^\S+@\S+\.\S+$/.test(job.applicationEmail)) errors.push('Application email is invalid')
  if ([job.skills, job.responsibilities, job.requirements, job.qualifications, job.benefits].some((items) => items.length > 30) || [...job.skills, ...job.responsibilities, ...job.requirements, ...job.qualifications, ...job.benefits].some((item) => item.length > 500)) errors.push('Job lists contain an invalid item')
  return errors
}

const PUBLIC_JOB_FIELDS = ['id', 'slug', 'title', 'companyId', 'companyName', 'companyLogo', 'location', 'workMode', 'employmentType', 'experienceLevel', 'salaryMin', 'salaryMax', 'salaryCurrency', 'salaryPeriod', 'skills', 'category', 'description', 'responsibilities', 'requirements', 'qualifications', 'benefits', 'applicationUrl', 'applicationEmail', 'whatsappContact', 'deadline', 'source', 'sourceUrl', 'featured', 'views', 'status', 'createdAt', 'updatedAt', 'publishedAt']
const publicJob = (job) => Object.fromEntries(PUBLIC_JOB_FIELDS.filter((field) => Object.hasOwn(job, field)).map((field) => [field, job[field]]))

const createJobsRepository = ({ readStore, writeStore, logActivity }) => ({
  listPublic(query = {}) {
    const store = readStore()
    let items = (store.jobs || []).filter((job) => job.status === 'published')
    const search = String(query.search || query.keyword || '').toLowerCase().trim()
    if (search) items = items.filter((job) => [job.title, job.companyName, job.location, job.category, ...job.skills].join(' ').toLowerCase().includes(search))
    for (const [key, value] of [['location', query.location], ['workMode', query.workMode], ['employmentType', query.employmentType], ['experienceLevel', query.experienceLevel], ['category', query.category]]) {
      if (value) items = items.filter((job) => String(job[key] || '').toLowerCase() === String(value).toLowerCase())
    }
    if (query.skill) items = items.filter((job) => job.skills.some((skill) => skill.toLowerCase() === String(query.skill).toLowerCase()))
    const minSalary = Number(query.minSalary); const maxSalary = Number(query.maxSalary)
    if (Number.isFinite(minSalary)) items = items.filter((job) => job.salaryMax == null || job.salaryMax >= minSalary)
    if (Number.isFinite(maxSalary)) items = items.filter((job) => job.salaryMin == null || job.salaryMin <= maxSalary)
    items.sort((a, b) => query.sort === 'relevance' ? Number(b.featured) - Number(a.featured) : new Date(b.createdAt) - new Date(a.createdAt))
    return items.map(publicJob)
  },
  getPublic(slug) {
    return this.listPublic({}).find((job) => job.slug === slug) || null
  },
  listAll() { return readStore().jobs || [] },
  get(id) { return (readStore().jobs || []).find((job) => job.id === id) || null },
  save(input, existing = null, userEmail = 'system') {
    const job = normalizeJob(input, existing || {})
    const errors = validateJob(job)
    if (errors.length) return { error: errors.join('. ') }
    const store = readStore()
    if (store.jobs.some((item) => item.slug === job.slug && item.id !== job.id)) return { error: 'A job with this slug already exists', conflict: true }
    if (existing) {
      const index = store.jobs.findIndex((item) => item.id === existing.id)
      store.jobs[index] = { ...existing, ...job, updatedBy: userEmail }
    } else {
      job.id = crypto.randomUUID()
      store.jobs.unshift({ ...job, createdBy: userEmail })
    }
    writeStore(store)
    logActivity(userEmail, existing ? 'updated' : 'created', 'job', { id: job.id })
    return { item: existing ? store.jobs.find((item) => item.id === job.id) : store.jobs[0] }
  },
  remove(id, userEmail) {
    const store = readStore(); const item = store.jobs.find((job) => job.id === id)
    if (!item) return false
    store.jobs = store.jobs.filter((job) => job.id !== id)
    writeStore(store); logActivity(userEmail, 'deleted', 'job', { id }); return true
  },
  setStatus(id, status, userEmail) {
    if (!JOB_STATUSES.includes(status)) return { error: 'Invalid job status' }
    const store = readStore(); const item = store.jobs.find((job) => job.id === id)
    if (!item) return { error: 'Job not found' }
    Object.assign(item, { status, updatedAt: new Date().toISOString(), updatedBy: userEmail, publishedAt: status === 'published' ? (item.publishedAt || new Date().toISOString()) : item.publishedAt })
    writeStore(store); logActivity(userEmail, status, 'job', { id }); return { item }
  }
})

export { JOB_STATUSES, EMPLOYMENT_TYPES, WORK_MODES, PUBLIC_JOB_FIELDS, createJobsRepository, normalizeJob, publicJob, validateJob }
