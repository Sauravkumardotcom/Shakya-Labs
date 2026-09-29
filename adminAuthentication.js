import bcrypt from 'bcryptjs'

const normalizeAdminEmail = (value) => typeof value === 'string' ? value.trim().toLowerCase() : ''

const findAdminByEmail = (admins, email) => {
  const normalizedEmail = normalizeAdminEmail(email)
  if (!normalizedEmail || !Array.isArray(admins)) return null
  return admins.find((admin) => normalizeAdminEmail(admin?.email) === normalizedEmail) || null
}

const verifyAdminCredentials = (admins, email, password) => {
  if (typeof password !== 'string') return null
  const admin = findAdminByEmail(admins, email)
  if (!admin || typeof admin.passwordHash !== 'string') return null
  try {
    return bcrypt.compareSync(password, admin.passwordHash) ? admin : null
  } catch {
    return null
  }
}

const seedInitialAdmin = ({ admins, email, password, production, createHash, createId, createdAt }) => {
  const existingAdmins = Array.isArray(admins) ? admins : []
  if (existingAdmins.length) return { admins: existingAdmins, created: false }
  if (production && (!email || !password)) return { error: 'missing_configuration' }

  const seedEmail = email || 'admin@shakyalabs.com'
  const seedPassword = password || 'admin123'
  return {
    created: true,
    admins: [{
      id: createId(),
      email: seedEmail,
      passwordHash: createHash(seedPassword),
      role: 'super_admin',
      createdAt
    }]
  }
}

export { normalizeAdminEmail, findAdminByEmail, verifyAdminCredentials, seedInitialAdmin }
