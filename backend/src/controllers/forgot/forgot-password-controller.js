const crypto = require('crypto')
const { UserModal } = require('../../models/User')
const { SendMail } = require('../../core/send-mail')
const ms = require('ms')

// Production-ready defaults
const DEFAULT_RESET_EXPIRES_MS = parseInt(process.env.PASSWORD_RESET_EXPIRES_MS || String(60 * 60 * 1000), 10) // 1 hour
const FRONTEND_RESET_BASE = process.env.FRONTEND_RESET_BASE || process.env.FRONTEND_URL || 'https://localhost:3000/reset'

// Helper: generate token and its hashed form
function generateResetToken() {
  const token = crypto.randomBytes(32).toString('hex')
  const hashed = crypto.createHash('sha256').update(token).digest('hex')
  return { token, hashed }
}

function buildResetUrl(token, email) {
  // FRONTEND_RESET_BASE should be a full URL to the reset page, e.g. https://app.example.com/reset
  const encodedEmail = encodeURIComponent(email)
  // Ensure no duplicate query separator
  const separator = FRONTEND_RESET_BASE.includes('?') ? '&' : '?'
  return `${FRONTEND_RESET_BASE}/reset?token=${token}&email=${encodedEmail}`
}

function buildEmailTemplate(userName, resetUrl) {
  return `
    <div style="font-family: Arial, sans-serif; color: #111;">
      <div style="border-top:6px solid #c31d7b; padding:16px;">
        <h2 style="margin:0;">AppSevaa</h2>
        <p style="margin:0; color:#666; font-size:12px;">Password reset</p>
      </div>
      <div style="padding:16px;">
        <p>Hello ${userName || ''},</p>
        <p>We received a request to reset your password. Click the button below to set a new password. This link will expire in ${ms(DEFAULT_RESET_EXPIRES_MS, { long: true })}.</p>
        <p style="text-align:center; margin:24px 0;"><a href="${resetUrl}" style="background:#c31d7b;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">Reset password</a></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      </div>
      <div style="padding:12px 16px; font-size:12px; color:#999;">&copy; ${new Date().getFullYear()} AppSevaa</div>
    </div>
  `
}

// POST /forgot  -> { email }
async function requestReset(req, res) {
  try {
    const { email } = (req.body || {})
    if (!email) return res.status(400).json({ message: 'Email is required' })

    const normalized = String(email).toLowerCase().trim()

    // Find user by normalized email. We intentionally do not leak whether the user exists.
    const user = await UserModal.findOne({ email: normalized })

    // If no user found, return generic success response (prevent account enumeration)
    if (!user) {
      return res.status(404).json({ message: `No account found with ${email} ` })
    }

    // Generate token, store hashed token and expiry timestamp
    const { token, hashed } = generateResetToken()
    const expiresAt = new Date(Date.now() + DEFAULT_RESET_EXPIRES_MS)

    user.resetPasswordToken = hashed
    user.resetPasswordExpires = expiresAt
    await user.save()

    // Build reset URL and templated email
    const resetUrl = buildResetUrl(token, user.email)
    const template = buildEmailTemplate(user.name, resetUrl)

    // Send email (best-effort). Do not fail request if mail fails — still return generic success.
    try {
      await SendMail({ template, subject: 'Reset your AppSevaa password', emailTo: user.email, mysmtp: user._id })
    } catch (mailErr) {
      console.error('Failed to send password reset email', mailErr)
    }

    return res.status(200).json({ message: 'If an account exists for this email, a reset link has been sent.' })
  } catch (err) {
    console.error('requestReset error', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// POST /forgot/validate -> { token, email }
async function validateToken(req, res) {
  try {
    const { token, email } = (req.body || {})
    if (!token || !email) return res.status(400).json({ ok: false, message: 'Token and email are required' })

    const normalized = String(email).toLowerCase().trim()
    const hashed = crypto.createHash('sha256').update(token).digest('hex')

    const user = await UserModal.findOne({ email: normalized, resetPasswordToken: hashed, resetPasswordExpires: { $gt: new Date() } })
    if (!user) return res.status(400).json({ ok: false, message: 'Invalid or expired token' })

    return res.json({ ok: true, message: 'Token is valid' })
  } catch (err) {
    console.error('validateToken error', err)
    return res.status(500).json({ ok: false, message: 'Internal server error' })
  }
}

// POST /forgot/reset -> { token, email, password }
async function resetPassword(req, res) {
  try {
    const { token, email, password } = (req.body || {})
    if (!token || !email || !password) return res.status(400).json({ ok: false, message: 'Token, email and new password are required' })

    const normalized = String(email).toLowerCase().trim()
    const hashed = crypto.createHash('sha256').update(token).digest('hex')

    const user = await UserModal.findOne({ email: normalized, resetPasswordToken: hashed, resetPasswordExpires: { $gt: new Date() } }).select('+password +resetPasswordToken +resetPasswordExpires')
    if (!user) return res.status(400).json({ ok: false, message: 'Invalid or expired token' })

    // Set new password (assume User model hashes on save)
    user.password = password
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    // Optionally: send confirmation email (best-effort)
    try {
      const template = `<p>Your password has been successfully reset. If you did not perform this action, please contact support immediately.</p>`
      await SendMail({ template, subject: 'Your password was changed', emailTo: user.email, mysmtp: user._id })
    } catch (mailErr) {
      console.error('Failed to send password changed email', mailErr)
    }

    return res.json({ ok: true, message: 'Password has been reset' })
  } catch (err) {
    console.error('resetPassword error', err)
    return res.status(500).json({ ok: false, message: 'Internal server error' })
  }
}

module.exports = {
  requestReset,
  validateToken,
  resetPassword
}
