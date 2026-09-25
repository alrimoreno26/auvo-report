#!/usr/bin/env node
// Vista previa local del correo de acceso (misma plantilla que usa la Edge Function).
// Uso: node scripts/preview-email.mjs   → data/email-preview.html y data/email-preview.txt
import { mkdirSync, writeFileSync } from 'node:fs'
import { renderAccessEmail } from '../supabase/functions/admin-users/email.ts'

const mail = renderAccessEmail({
  name: 'María López',
  email: 'maria.lopez@empresa.com',
  role: 'viewer',
  link: 'https://auvo-report.vercel.app/crear-contrasena?token_hash=pkce_3f9a1c7e2b8d4a6f0e5c9b1d7a3e8f2c&type=recovery',
  appUrl: 'https://auvo-report.vercel.app',
  invitedBy: 'Alejandro',
  expiresInHours: 24,
  kind: process.argv[2] === 'resend' ? 'resend' : 'invite',
})

mkdirSync('data', { recursive: true })
writeFileSync('data/email-preview.html', mail.html)
writeFileSync('data/email-preview.txt', `Asunto: ${mail.subject}\n\n${mail.text}`)
console.log(`✓ data/email-preview.html · Asunto: ${mail.subject}`)
