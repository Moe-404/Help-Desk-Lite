import { tickets as demoTickets } from '../data'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

const tones = ['pink', 'blue', 'purple', 'green', 'gold']

function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '??'
}

function relativeTime(value) {
  const timestamp = new Date(value).getTime()
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function mapTicket(row, index = 0) {
  if (!row) return null
  return {
    id: row.id,
    subject: row.subject,
    description: row.description,
    requester: row.requester_name,
    requesterEmail: row.requester_email,
    requesterId: row.requester_id,
    initials: initials(row.requester_name),
    category: row.category,
    priority: row.priority,
    status: row.status,
    assignedTo: row.assigned_to,
    updated: relativeTime(row.updated_at),
    tone: tones[index % tones.length],
  }
}

function assertConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Copy .env.example to .env.local and add your project credentials.')
  }
}

export async function listTickets() {
  if (!isSupabaseConfigured) return demoTickets
  const { data, error } = await supabase.from('tickets').select('*').order('updated_at', { ascending: false })
  if (error) throw error
  return data.map(mapTicket)
}

export async function getTicket(id) {
  if (!isSupabaseConfigured) return demoTickets.find(ticket => ticket.id === id) || null
  const { data, error } = await supabase.from('tickets').select('*').eq('id', id).single()
  if (error) throw error
  return mapTicket(data)
}

export async function createTicket(input) {
  if (!isSupabaseConfigured) {
    return {
      id: 'HD-DEMO',
      subject: input.subject,
      description: input.description,
      requester: input.requesterName,
      requesterEmail: input.requesterEmail,
      initials: initials(input.requesterName),
      category: input.category,
      priority: input.priority,
      status: 'Open',
      updated: 'just now',
      tone: 'blue',
    }
  }
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw userError || new Error('You must be signed in to create a ticket.')
  const { data, error } = await supabase.from('tickets').insert({
    subject: input.subject,
    description: input.description,
    requester_name: input.requesterName,
    requester_email: input.requesterEmail,
    category: input.category,
    priority: input.priority,
    requester_id: user.id,
  }).select().single()
  if (error) throw error
  return mapTicket(data)
}

export async function updateTicket(id, changes) {
  assertConfigured()
  const values = {}
  if (changes.status) values.status = changes.status
  if ('assignedTo' in changes) values.assigned_to = changes.assignedTo
  const { data, error } = await supabase.from('tickets').update(values).eq('id', id).select().single()
  if (error) throw error
  return mapTicket(data)
}

export async function listMessages(ticketId) {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase.from('ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at')
  if (error) throw error
  return data
}

export async function createMessage(ticketId, body, kind, author) {
  assertConfigured()
  const { data, error } = await supabase.from('ticket_messages').insert({
    ticket_id: ticketId,
    body,
    kind,
    author_id: author.id,
    author_name: author.name,
    author_role: author.isStaff ? 'agent' : 'requester',
  }).select().single()
  if (error) throw error
  return data
}

export async function uploadTicketAttachment(ticketId, file) {
  assertConfigured()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
  const storagePath = `${ticketId}/${crypto.randomUUID()}-${safeName}`
  const { error: uploadError } = await supabase.storage.from('ticket-attachments').upload(storagePath, file)
  if (uploadError) throw uploadError

  const { data, error } = await supabase.from('ticket_attachments').insert({
    ticket_id: ticketId,
    storage_path: storagePath,
    file_name: file.name,
    mime_type: file.type || 'application/octet-stream',
    size_bytes: file.size,
  }).select().single()
  if (error) {
    await supabase.storage.from('ticket-attachments').remove([storagePath])
    throw error
  }
  return data
}

export async function listAttachments(ticketId) {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase.from('ticket_attachments').select('*').eq('ticket_id', ticketId).order('created_at')
  if (error) throw error
  return data
}

export async function downloadAttachment(attachment) {
  assertConfigured()
  const { data, error } = await supabase.storage.from('ticket-attachments').download(attachment.storage_path)
  if (error) throw error
  const url = URL.createObjectURL(data)
  const link = document.createElement('a')
  link.href = url
  link.download = attachment.file_name
  link.click()
  URL.revokeObjectURL(url)
}

export function subscribeToTickets(onChange) {
  if (!isSupabaseConfigured) return () => {}
  const channel = supabase.channel('helpdesk-ticket-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, onChange)
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}

export { isSupabaseConfigured }
