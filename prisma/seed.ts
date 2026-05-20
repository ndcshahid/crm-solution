import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const PERMISSIONS = [
  { name: 'can_view_dashboard',     label: 'View Dashboard',      module: 'Dashboard' },
  { name: 'can_create_lead',        label: 'Create Lead',         module: 'Leads' },
  { name: 'can_edit_lead',          label: 'Edit Lead',           module: 'Leads' },
  { name: 'can_delete_lead',        label: 'Delete Lead',         module: 'Leads' },
  { name: 'can_assign_lead',        label: 'Assign Lead',         module: 'Leads' },
  { name: 'can_view_all_leads',     label: 'View All Leads',      module: 'Leads' },
  { name: 'can_view_team_leads',    label: 'View Team Leads',     module: 'Leads' },
  { name: 'can_view_own_leads',     label: 'View Own Leads',      module: 'Leads' },
  { name: 'can_create_user',        label: 'Create User',         module: 'Users' },
  { name: 'can_edit_user',          label: 'Edit User',           module: 'Users' },
  { name: 'can_deactivate_user',    label: 'Deactivate User',     module: 'Users' },
  { name: 'can_assign_role',        label: 'Assign Role',         module: 'Users' },
  { name: 'can_create_appointment', label: 'Create Appointment',  module: 'Appointments' },
  { name: 'can_edit_appointment',   label: 'Edit Appointment',    module: 'Appointments' },
  { name: 'can_delete_appointment', label: 'Delete Appointment',  module: 'Appointments' },
  { name: 'can_add_follow_up',      label: 'Add Follow Up',       module: 'FollowUps' },
  { name: 'can_view_reports',       label: 'View Reports',        module: 'Reports' },
  { name: 'can_export_reports',     label: 'Export Reports',      module: 'Reports' },
  { name: 'can_manage_settings',    label: 'Manage Settings',     module: 'Settings' },
  { name: 'can_manage_company',     label: 'Manage Company',      module: 'Settings' },
  { name: 'can_manage_teams',       label: 'Manage Teams',        module: 'Teams' },
]

const ALL = PERMISSIONS.map(p => p.name)

const ROLE_PERMS: Record<string, string[]> = {
  super_admin:     ALL,
  admin:           ALL.filter(p => p !== 'can_manage_company' || true), // all except system-level
  sales_manager:   ['can_view_dashboard','can_create_lead','can_edit_lead','can_assign_lead','can_view_team_leads','can_create_appointment','can_edit_appointment','can_add_follow_up','can_view_reports','can_export_reports','can_manage_teams'],
  sales_executive: ['can_view_dashboard','can_edit_lead','can_view_own_leads','can_create_appointment','can_add_follow_up','can_view_reports'],
  viewer:          ['can_view_dashboard','can_view_reports','can_view_own_leads'],
}

async function main() {
  console.log('🌱 Seeding...')

  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({ where: { name: p.name }, update: {}, create: p })
  }

  const roleDefs = [
    { name: 'super_admin',     label: 'Super Admin',      description: 'Full platform access' },
    { name: 'admin',           label: 'Admin',            description: 'Full company admin' },
    { name: 'sales_manager',   label: 'Sales Manager',    description: 'Manages a team' },
    { name: 'sales_executive', label: 'Sales Executive',  description: 'Handles own leads' },
    { name: 'viewer',          label: 'Viewer',           description: 'Read-only access' },
  ]
  const roles: Record<string, any> = {}
  for (const r of roleDefs) {
    roles[r.name] = await prisma.role.upsert({ where: { name: r.name }, update: {}, create: r })
    // assign permissions
    const perms = ROLE_PERMS[r.name] || []
    for (const pn of perms) {
      const perm = await prisma.permission.findUnique({ where: { name: pn } })
      if (!perm) continue
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: roles[r.name].id, permissionId: perm.id } },
        update: {},
        create: { roleId: roles[r.name].id, permissionId: perm.id },
      })
    }
  }
  console.log('✅ Roles & permissions')

  const pw = await bcrypt.hash('Admin@123', 12)

  // System company (super admin home)
  const systemCo = await prisma.company.upsert({
    where: { email: 'platform@crm.local' }, update: {},
    create: { name: 'CRM Platform', email: 'platform@crm.local', plan: 'Enterprise', status: 'active' },
  })
  await prisma.user.upsert({
    where: { email: 'superadmin@crm.com' }, update: {},
    create: { name: 'Alex Carter', email: 'superadmin@crm.com', password: pw, phone: '+1-555-0001', roleId: roles.super_admin.id, companyId: systemCo.id },
  })

  // Company 1 — TechCorp
  const co1 = await prisma.company.upsert({
    where: { email: 'info@techcorp.com' }, update: {},
    create: { name: 'TechCorp Ltd', email: 'info@techcorp.com', phone: '+1-555-1000', address: '123 Tech Ave, New York, NY 10001', plan: 'Professional', currency: 'USD' },
  })

  const dept_sales = await prisma.department.create({ data: { name: 'Sales', companyId: co1.id } })
  const dept_mkt   = await prisma.department.create({ data: { name: 'Marketing', companyId: co1.id } })
  const dept_mgmt  = await prisma.department.create({ data: { name: 'Management', companyId: co1.id } })

  const admin1 = await prisma.user.upsert({
    where: { email: 'admin@crm.com' }, update: {},
    create: { name: 'Sarah Johnson', email: 'admin@crm.com', password: pw, phone: '+1-555-1001', roleId: roles.admin.id, companyId: co1.id, departmentId: dept_mgmt.id },
  })
  const mgr1 = await prisma.user.upsert({
    where: { email: 'manager@crm.com' }, update: {},
    create: { name: 'Mike Chen', email: 'manager@crm.com', password: pw, phone: '+1-555-1002', roleId: roles.sales_manager.id, companyId: co1.id, departmentId: dept_sales.id, managerId: admin1.id },
  })
  const mgr2 = await prisma.user.upsert({
    where: { email: 'manager2@crm.com' }, update: {},
    create: { name: 'Priya Sharma', email: 'manager2@crm.com', password: pw, phone: '+1-555-1003', roleId: roles.sales_manager.id, companyId: co1.id, departmentId: dept_sales.id, managerId: admin1.id },
  })

  const teamA = await prisma.team.create({ data: { name: 'Team Alpha', companyId: co1.id, managerId: mgr1.id } })
  const teamB = await prisma.team.create({ data: { name: 'Team Beta',  companyId: co1.id, managerId: mgr2.id } })

  await prisma.userTeam.createMany({
    data: [{ userId: mgr1.id, teamId: teamA.id }, { userId: mgr2.id, teamId: teamB.id }],
    skipDuplicates: true,
  })

  const execDefs = [
    { name: 'Emily Davis',   email: 'exec@crm.com',  team: teamA.id, mgr: mgr1.id },
    { name: 'Tom Parker',    email: 'exec2@crm.com', team: teamA.id, mgr: mgr1.id },
    { name: 'Lisa Park',     email: 'exec3@crm.com', team: teamB.id, mgr: mgr2.id },
    { name: 'James Brown',   email: 'exec4@crm.com', team: teamB.id, mgr: mgr2.id },
    { name: 'Anna Williams', email: 'exec5@crm.com', team: teamA.id, mgr: mgr1.id },
  ]
  const execs: any[] = []
  for (const e of execDefs) {
    const u = await prisma.user.upsert({
      where: { email: e.email }, update: {},
      create: { name: e.name, email: e.email, password: pw, roleId: roles.sales_executive.id, companyId: co1.id, departmentId: dept_sales.id, managerId: e.mgr },
    })
    await prisma.userTeam.create({ data: { userId: u.id, teamId: e.team } })
    execs.push(u)
  }

  await prisma.user.upsert({
    where: { email: 'viewer@crm.com' }, update: {},
    create: { name: 'David Kim', email: 'viewer@crm.com', password: pw, roleId: roles.viewer.id, companyId: co1.id, departmentId: dept_mkt.id },
  })

  console.log('✅ Users')

  const leadDefs = [
    { name: 'Quantum Dynamics',   contact: 'Robert Hall',    email: 'robert@quantum.com',    phone: '+1-555-2001', city: 'New York',    src: 'LinkedIn',       status: 'Qualified',     pri: 'High',   val: 45000, exec: execs[0], team: teamA.id },
    { name: 'Apex Solutions',     contact: 'Maria Torres',   email: 'maria@apex.com',         phone: '+1-555-2002', city: 'Los Angeles', src: 'Website',        status: 'Proposal Sent', pri: 'Urgent', val: 78000, exec: execs[0], team: teamA.id },
    { name: 'NovaTech Systems',   contact: 'David Kim',      email: 'david@novatech.com',     phone: '+1-555-2003', city: 'Chicago',     src: 'Referral',       status: 'Contacted',     pri: 'Medium', val: 32000, exec: execs[2], team: teamB.id },
    { name: 'Stellar Marketing',  contact: 'Jessica Lee',    email: 'jessica@stellar.com',    phone: '+1-555-2004', city: 'Houston',     src: 'Facebook',       status: 'New',           pri: 'Low',    val: 15000, exec: execs[2], team: teamB.id },
    { name: 'Pioneer Industries', contact: 'Chris Anderson', email: 'chris@pioneer.com',      phone: '+1-555-2005', city: 'Phoenix',     src: 'Cold Call',      status: 'Won',           pri: 'High',   val: 92000, exec: execs[0], team: teamA.id },
    { name: 'Summit Corp',        contact: 'Amy Zhang',      email: 'amy@summit.com',          phone: '+1-555-2006', city: 'Dallas',      src: 'Email Campaign', status: 'Lost',          pri: 'Medium', val: 28000, exec: execs[2], team: teamB.id },
    { name: 'Horizon Ventures',   contact: 'Ryan Moore',     email: 'ryan@horizon.com',        phone: '+1-555-2007', city: 'San Diego',   src: 'WhatsApp',       status: 'Qualified',     pri: 'High',   val: 56000, exec: execs[1], team: teamA.id },
    { name: 'Pinnacle Group',     contact: 'Sandra White',   email: 'sandra@pinnacle.com',     phone: '+1-555-2008', city: 'Seattle',     src: 'Walk In',        status: 'Contacted',     pri: 'Urgent', val: 41000, exec: execs[2], team: teamB.id },
    { name: 'Blue Ocean Tech',    contact: 'Marcus Johnson', email: 'marcus@blueocean.com',    phone: '+1-555-2009', city: 'Miami',       src: 'Referral',       status: 'New',           pri: 'Medium', val: 23000, exec: execs[3], team: teamB.id },
    { name: 'Everest Digital',    contact: 'Olivia Smith',   email: 'olivia@everest.com',      phone: '+1-555-2010', city: 'Denver',      src: 'LinkedIn',       status: 'Qualified',     pri: 'High',   val: 67000, exec: execs[4], team: teamA.id },
    { name: 'CloudBase Inc',      contact: 'Sam Wilson',     email: 'sam@cloudbase.com',        phone: '+1-555-2011', city: 'Austin',      src: 'Referral',       status: 'New',           pri: 'Medium', val: 34000, exec: execs[1], team: teamA.id },
    { name: 'DataStream LLC',     contact: 'Kim Lee',        email: 'kim@datastream.com',       phone: '+1-555-2012', city: 'Boston',      src: 'Website',        status: 'Contacted',     pri: 'Low',    val: 19000, exec: execs[3], team: teamB.id },
  ]

  const leads: any[] = []
  const now = new Date()
  for (const l of leadDefs) {
    const lead = await prisma.lead.create({
      data: {
        name: l.name, contactName: l.contact, email: l.email, phone: l.phone,
        city: l.city, source: l.src, status: l.status, priority: l.pri, dealValue: l.val,
        companyId: co1.id, assignedToId: l.exec.id, teamId: l.team, createdById: admin1.id,
        nextFollowUpAt: !['Won','Lost'].includes(l.status) ? new Date(now.getTime() + 3*86400000) : null,
        notes: `Initial opportunity notes for ${l.name}.`,
      },
    })
    leads.push(lead)
  }
  console.log('✅ Leads')

  const fuDefs = [
    { lead: leads[0], user: execs[0], offset: 0,  note: 'Check if they reviewed the proposal',   status: 'Pending' },
    { lead: leads[1], user: execs[0], offset: -1, note: 'Send updated pricing document',          status: 'Completed' },
    { lead: leads[6], user: execs[1], offset: -2, note: 'Discovery call follow-up',               status: 'Missed' },
    { lead: leads[2], user: execs[2], offset: 1,  note: 'Schedule product demonstration',         status: 'Pending' },
    { lead: leads[7], user: execs[2], offset: 0,  note: 'Technical requirements discussion',      status: 'Pending' },
    { lead: leads[4], user: execs[0], offset: -5, note: 'Contract signing — completed',           status: 'Completed' },
    { lead: leads[9], user: execs[4], offset: 3,  note: 'Discuss enterprise pricing tier',        status: 'Pending' },
    { lead: leads[3], user: execs[2], offset: 2,  note: 'First contact call',                     status: 'Pending' },
  ]
  for (const f of fuDefs) {
    const d = new Date(now)
    d.setDate(d.getDate() + f.offset)
    d.setHours(10, 0, 0, 0)
    await prisma.followUp.create({ data: { leadId: f.lead.id, userId: f.user.id, scheduledAt: d, note: f.note, status: f.status } })
  }
  console.log('✅ Follow-ups')

  const apptDefs = [
    { lead: leads[0], user: execs[0], days: 1,  type: 'Online Meeting', status: 'Scheduled', notes: 'Product demo presentation' },
    { lead: leads[1], user: execs[0], days: 2,  type: 'Phone Call',     status: 'Scheduled', notes: 'Proposal follow-up call' },
    { lead: leads[4], user: execs[0], days: -4, type: 'Office Visit',   status: 'Completed', notes: 'Contract signed successfully' },
    { lead: leads[2], user: execs[2], days: 4,  type: 'Demo',           status: 'Scheduled', notes: 'Platform demonstration' },
    { lead: leads[9], user: execs[4], days: 6,  type: 'Client Visit',   status: 'Scheduled', notes: 'Visit client HQ' },
    { lead: leads[7], user: execs[2], days: -1, type: 'Phone Call',     status: 'Missed',    notes: 'Initial discovery call' },
  ]
  for (const a of apptDefs) {
    const d = new Date(now)
    d.setDate(d.getDate() + a.days)
    d.setHours(10, 0, 0, 0)
    await prisma.appointment.create({ data: { leadId: a.lead.id, userId: a.user.id, scheduledAt: d, meetingType: a.type, status: a.status, notes: a.notes } })
  }
  console.log('✅ Appointments')

  const actDefs = [
    { user: execs[0], action: 'Lead Created',       module: 'Leads',        name: 'Quantum Dynamics',                  leadId: leads[0].id },
    { user: admin1,   action: 'Lead Assigned',       module: 'Leads',        name: 'Apex Solutions → Emily Davis',      leadId: leads[1].id },
    { user: execs[0], action: 'Status Updated',      module: 'Leads',        name: 'Pioneer Industries → Won',          leadId: leads[4].id, old: 'Proposal Sent', nw: 'Won' },
    { user: execs[2], action: 'Appointment Created', module: 'Appointments', name: 'NovaTech Systems',                   leadId: leads[2].id },
    { user: admin1,   action: 'User Created',         module: 'Users',        name: 'David Kim' },
    { user: mgr1,     action: 'Lead Assigned',        module: 'Leads',        name: 'Blue Ocean Tech → James Brown',     leadId: leads[8].id },
    { user: execs[0], action: 'Follow Up Added',      module: 'Follow Ups',   name: 'Quantum Dynamics',                  leadId: leads[0].id },
    { user: execs[4], action: 'Lead Created',         module: 'Leads',        name: 'Everest Digital',                   leadId: leads[9].id },
    { user: execs[1], action: 'Status Updated',       module: 'Leads',        name: 'Horizon Ventures → Qualified',      leadId: leads[6].id, old: 'Contacted', nw: 'Qualified' },
    { user: admin1,   action: 'Team Created',          module: 'Teams',        name: 'Team Alpha' },
  ]
  for (const a of actDefs) {
    await prisma.activity.create({
      data: { userId: a.user.id, companyId: co1.id, leadId: a.leadId ?? null, action: a.action, module: a.module, recordName: a.name, oldValue: a.old ?? null, newValue: a.nw ?? null },
    })
  }
  console.log('✅ Activities')

  // Company 2
  const co2 = await prisma.company.upsert({
    where: { email: 'contact@globalventures.com' }, update: {},
    create: { name: 'Global Ventures', email: 'contact@globalventures.com', phone: '+1-555-2000', plan: 'Enterprise' },
  })
  await prisma.user.upsert({
    where: { email: 'admin2@crm.com' }, update: {},
    create: { name: 'Rachel Green', email: 'admin2@crm.com', password: pw, roleId: roles.admin.id, companyId: co2.id },
  })
  console.log('✅ Company 2')

  console.log('\n🎉 Seed complete!\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🔑 CREDENTIALS  (all passwords: Admin@123)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  superadmin@crm.com  — Super Admin')
  console.log('  admin@crm.com       — Admin (TechCorp)')
  console.log('  manager@crm.com     — Sales Manager')
  console.log('  exec@crm.com        — Sales Executive')
  console.log('  viewer@crm.com      — Viewer')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
