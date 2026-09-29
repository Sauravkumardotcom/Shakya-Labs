import crypto from 'crypto'

const INTAKE_STATUSES = ['received', 'processing', 'draft', 'needs_review', 'approved', 'rejected', 'error']
const TERMINAL_STATUSES = new Set(['approved', 'rejected'])
const WORK_MODES = ['remote', 'hybrid', 'onsite']
const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'internship', 'freelance']
const FIELD_LABELS = {
  title: 'title',
  role: 'title',
  position: 'title',
  company: 'companyName',
  'company name': 'companyName',
  location: 'location',
  'work mode': 'workMode',
  mode: 'workMode',
  'employment type': 'employmentType',
  employment: 'employmentType',
  experience: 'experienceLevel',
  'experience level': 'experienceLevel',
  salary: 'salary',
  skills: 'skills',
  category: 'category',
  description: 'description',
  responsibilities: 'responsibilities',
  requirements: 'requirements',
  qualifications: 'qualifications',
  benefits: 'benefits',
  apply: 'applicationDetails',
  'application url': 'applicationUrl',
  url: 'applicationUrl',
  'application email': 'applicationEmail',
  email: 'applicationEmail',
  whatsapp: 'whatsappContact',
  phone: 'whatsappContact',
  deadline: 'deadline',
  source: 'source',
  'source url': 'sourceUrl'
}
const LIST_FIELDS = new Set(['skills', 'responsibilities', 'requirements', 'qualifications', 'benefits'])
const REQUIRED_JOB_FIELDS = ['title', 'companyName', 'location', 'description']

const cleanText = (value) => String(value || '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
const normalizeSourceUrls = (values) => [...new Set((Array.isArray(values) ? values : []).flatMap((value) => {
  if (typeof value !== 'string') return []
  const url = value.trim()
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol) ? [url] : []
  } catch { return [] }
}))]
const unique = (items) => [...new Set(items.map((item) => cleanText(item)).filter(Boolean))]
const listValue = (value) => unique(String(value || '').split(/[,;|\n]|\s+•\s+/).map((item) => item.replace(/^[-*•]\s*/, '')))
const normalizeUrl = (value) => { const match = String(value || '').match(/https?:\/\/[^\s<]+/i); return match ? match[0].replace(/[),.;]+$/, '') : '' }
const normalizeEmail = (value) => { const match = String(value || '').match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/); return match ? match[0].toLowerCase() : '' }
const normalizePhone = (value) => String(value || '').replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '').slice(0, 30)
const normalizeMode = (value) => { const normalized = String(value || '').toLowerCase(); return normalized.includes('remote') ? 'remote' : normalized.includes('hybrid') ? 'hybrid' : normalized.includes('on') ? 'onsite' : '' }
const normalizeEmployment = (value) => { const normalized = String(value || '').toLowerCase(); return EMPLOYMENT_TYPES.find((type) => normalized.includes(type)) || '' }
const normalizeExperience = (value) => { const normalized = cleanText(value).toLowerCase(); if (!normalized) return ''; if (/entry|junior|fresher|0\s*[-to]\s*2/.test(normalized)) return 'entry'; if (/mid|intermediate|2\s*[-to]\s*5/.test(normalized)) return 'mid'; if (/senior|lead|principal|5\+/.test(normalized)) return normalized.includes('lead') ? 'lead' : 'senior'; return cleanText(value) }
const normalizeDate = (value) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? '' : date.toISOString() }
const normalizeSalary = (value) => {
  const text = String(value || '').replace(/,/g, '')
  const currency = (text.match(/\b(USD|EUR|GBP|INR|NPR|AUD|CAD)\b/i)?.[1] || '').toUpperCase()
  const numbers = [...text.matchAll(/\d+(?:\.\d+)?/g)].map((match) => Number(match[0])).filter(Number.isFinite)
  const period = /hour|hr/i.test(text) ? 'hour' : /month|mo/i.test(text) ? 'month' : 'year'
  return { salaryMin: numbers[0] ?? null, salaryMax: numbers[1] ?? numbers[0] ?? null, salaryCurrency: currency || 'USD', salaryPeriod: period }
}

const emptyDraft = () => ({ title: '', companyName: '', companyId: '', companyLogo: '', location: '', workMode: '', employmentType: '', experienceLevel: '', salaryMin: null, salaryMax: null, salaryCurrency: 'USD', salaryPeriod: 'year', skills: [], category: '', description: '', responsibilities: [], requirements: [], qualifications: [], benefits: [], applicationUrl: '', applicationEmail: '', whatsappContact: '', deadline: '', source: 'whatsapp', sourceUrl: '' })
const missingFieldsForDraft = (draft) => { const missing = REQUIRED_JOB_FIELDS.filter((field) => !draft[field]); if (!draft.workMode) missing.push('workMode'); if (!draft.employmentType) missing.push('employmentType'); return [...new Set(missing)] }
const parseLabeledMessage = (message) => {
  const lines = cleanText(message).split('\n').map((line) => line.trim()).filter(Boolean)
  const values = {}; let current = ''
  for (const line of lines) {
    const match = line.match(/^\s*[-*•]?\s*([^:]{2,40}):\s*(.*)$/i)
    if (match) {
      const key = FIELD_LABELS[match[1].trim().toLowerCase()]
      if (key) { current = key; values[key] = match[2].trim(); continue }
    }
    if (current) values[current] = values[current] ? `${values[current]}\n${line}` : line
  }
  return values
}

const extractJob = (rawMessage, receivedAt = new Date().toISOString()) => {
  const message = cleanText(rawMessage); const values = parseLabeledMessage(message); const draft = emptyDraft()
  draft.title = cleanText(values.title); draft.companyName = cleanText(values.companyName); draft.location = cleanText(values.location); draft.workMode = normalizeMode(values.workMode); draft.employmentType = normalizeEmployment(values.employmentType); draft.experienceLevel = normalizeExperience(values.experienceLevel); draft.skills = listValue(values.skills); draft.category = cleanText(values.category); draft.description = cleanText(values.description); draft.responsibilities = listValue(values.responsibilities); draft.requirements = listValue(values.requirements); draft.qualifications = listValue(values.qualifications); draft.benefits = listValue(values.benefits); draft.applicationUrl = normalizeUrl(values.applicationUrl); draft.applicationEmail = normalizeEmail(values.applicationEmail); draft.whatsappContact = normalizePhone(values.whatsappContact); draft.deadline = normalizeDate(values.deadline); draft.sourceUrl = normalizeUrl(values.sourceUrl)
  if (values.salary) Object.assign(draft, normalizeSalary(values.salary))
  if (!draft.applicationEmail) draft.applicationEmail = normalizeEmail(message)
  if (!draft.applicationUrl) draft.applicationUrl = normalizeUrl(message)
  return { draft, missingFields: missingFieldsForDraft(draft), receivedAt }
}

const likelyDuplicates = (draft, jobs = []) => jobs.filter((job) => {
  const sameCompany = draft.companyName && job.companyName && draft.companyName.toLowerCase() === job.companyName.toLowerCase()
  const sameTitle = draft.title && job.title && draft.title.toLowerCase() === job.title.toLowerCase()
  const sameLocation = draft.location && job.location && draft.location.toLowerCase() === job.location.toLowerCase()
  const sameContact = (draft.applicationUrl && draft.applicationUrl === job.applicationUrl) || (draft.applicationEmail && draft.applicationEmail === job.applicationEmail)
  const sameSourceUrl = [draft.sourceUrl, draft.applicationUrl].some((url) => url && (url === job.sourceUrl || url === job.applicationUrl))
  return sameContact || sameSourceUrl || (sameCompany && sameTitle) || (sameCompany && sameLocation && sameTitle)
}).map(({ sourceMessage, createdBy, updatedBy, ...job }) => job)

const createWhatsappIntakeRepository = ({ readStore, writeStore, logActivity }) => ({
  list() { return readStore().whatsappIntakes || [] },
  get(id) { return (readStore().whatsappIntakes || []).find((item) => item.id === id) || null },
  receive(input = {}, userEmail) {
    const rawMessage = cleanText(input.rawMessage)
    const sourceUrls = normalizeSourceUrls(input.sourceUrls)
    if ((!rawMessage && !sourceUrls.length) || rawMessage.length > 20000) return { error: 'A raw WhatsApp message or source URL is required; message text must be under 20000 characters' }
    const now = new Date().toISOString(); const store = readStore(); const provider = cleanText(input.provider || 'whatsapp').slice(0, 40); const providerEventId = cleanText(input.providerEventId).slice(0, 200)
    if (providerEventId) {
      const duplicate = (store.whatsappIntakes || []).find((entry) => entry.provider === provider && entry.providerEventId === providerEventId)
      if (duplicate) return { item: duplicate, duplicate: true }
    }
    const item = { id: crypto.randomUUID(), rawMessage, sourceUrls, senderName: cleanText(input.senderName).slice(0, 120), senderPhone: normalizePhone(input.senderPhone), senderId: cleanText(input.senderId).slice(0, 160), receivedAt: input.receivedAt && !Number.isNaN(new Date(input.receivedAt).getTime()) ? new Date(input.receivedAt).toISOString() : now, source: 'whatsapp', provider, providerEventId, providerMessageId: cleanText(input.providerMessageId).slice(0, 200), providerMetadata: input.providerMetadata && typeof input.providerMetadata === 'object' ? input.providerMetadata : {}, status: 'received', extracted: null, missingFields: [], duplicateCandidates: [], errorMessage: '', createdAt: now, updatedAt: now, createdBy: userEmail }
    store.whatsappIntakes.unshift(item); writeStore(store); logActivity(userEmail, 'received', 'whatsapp_intake', { id: item.id }); return { item }
  },
  receiveFromListener(input = {}, jobs = [], userEmail = 'whatsapp:listener') {
    const sourceUrls = normalizeSourceUrls(input.sourceUrls)
    if (!sourceUrls.length) return { error: 'At least one trusted HTTP/HTTPS source URL is required' }
    const result = this.receive({ ...input, provider: 'whatsapp-web', sourceUrls }, userEmail)
    if (result.error || result.duplicate) return result
    const store = readStore()
    const item = store.whatsappIntakes.find((entry) => entry.id === result.item.id)
    if (!item) return { error: 'WhatsApp intake was not available after receipt' }
    const extracted = { ...emptyDraft(), sourceUrl: sourceUrls[0] }
    const duplicateCandidates = [...new Map(sourceUrls
      .flatMap((sourceUrl) => likelyDuplicates({ ...extracted, sourceUrl }, jobs))
      .map((job) => [job.id || job.slug || `${job.title}:${job.companyName}`, job])).values()]
    Object.assign(item, {
      source: 'whatsapp',
      status: 'draft',
      extracted,
      missingFields: missingFieldsForDraft(extracted),
      duplicateCandidates,
      updatedAt: new Date().toISOString(),
      updatedBy: userEmail
    })
    writeStore(store)
    return { item }
  },
  process(id, jobs, userEmail) {
    const store = readStore(); const item = store.whatsappIntakes.find((entry) => entry.id === id); if (!item) return { error: 'WhatsApp intake not found' }
    if (TERMINAL_STATUSES.has(item.status)) return { error: `WhatsApp intake is already ${item.status} and cannot be reprocessed` }
    const extraction = extractJob(item.rawMessage, item.receivedAt); const duplicateCandidates = likelyDuplicates(extraction.draft, jobs); Object.assign(item, { status: extraction.missingFields.length ? 'needs_review' : 'draft', extracted: extraction.draft, missingFields: extraction.missingFields, duplicateCandidates, errorMessage: '', updatedAt: new Date().toISOString(), updatedBy: userEmail }); writeStore(store); logActivity(userEmail, 'processed', 'whatsapp_intake', { id, status: item.status }); return { item }
  },
  updateDraft(id, draft, jobs, userEmail) {
    const store = readStore(); const item = store.whatsappIntakes.find((entry) => entry.id === id); if (!item) return { error: 'WhatsApp intake not found' }; if (TERMINAL_STATUSES.has(item.status)) return { error: `WhatsApp intake is already ${item.status} and cannot be edited` }; if (!item.extracted) return { error: 'Process the intake before editing its draft' }; const normalized = { ...item.extracted, ...draft, source: 'whatsapp' }; const missingFields = missingFieldsForDraft(normalized); const duplicateCandidates = likelyDuplicates(normalized, jobs); Object.assign(item, { extracted: normalized, missingFields, duplicateCandidates, status: missingFields.length ? 'needs_review' : 'draft', updatedAt: new Date().toISOString(), updatedBy: userEmail }); writeStore(store); logActivity(userEmail, 'updated', 'whatsapp_intake', { id }); return { item }
  },
  reject(id, userEmail) { const store = readStore(); const item = store.whatsappIntakes.find((entry) => entry.id === id); if (!item) return { error: 'WhatsApp intake not found' }; if (TERMINAL_STATUSES.has(item.status)) return { error: `WhatsApp intake is already ${item.status}` }; item.status = 'rejected'; item.updatedAt = new Date().toISOString(); item.updatedBy = userEmail; writeStore(store); logActivity(userEmail, 'rejected', 'whatsapp_intake', { id }); return { item } },
  approve(id, jobsRepository, userEmail) { const store = readStore(); const item = store.whatsappIntakes.find((entry) => entry.id === id); if (!item) return { error: 'WhatsApp intake not found' }; if (TERMINAL_STATUSES.has(item.status)) return { error: `WhatsApp intake is already ${item.status} and cannot be approved` }; if (!item.extracted) return { error: 'Process the intake before approval' }; const result = jobsRepository.save({ ...item.extracted, source: 'whatsapp', sourceMessage: item.rawMessage, status: 'draft' }, null, userEmail); if (result.error) return { error: result.error, conflict: result.conflict }; const updatedStore = readStore(); const updatedItem = updatedStore.whatsappIntakes.find((entry) => entry.id === id); Object.assign(updatedItem, { status: 'approved', jobId: result.item.id, updatedAt: new Date().toISOString(), updatedBy: userEmail }); writeStore(updatedStore); logActivity(userEmail, 'approved', 'whatsapp_intake', { id, jobId: updatedItem.jobId }); return { item: updatedItem, job: result.item } }
})

export { INTAKE_STATUSES, createWhatsappIntakeRepository, extractJob, likelyDuplicates }
