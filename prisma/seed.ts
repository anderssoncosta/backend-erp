import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── TENANT ────────────────────────────────────────────────────────────────

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Serviços LTDA',
      slug: 'demo',
      cnpj: '12.345.678/0001-90',
      email: 'contato@demo.com.br',
      phone: '(11) 3000-0000',
      plan: 'ENTERPRISE',
      status: 'ACTIVE',
    },
  });

  console.log(`✅ Tenant: ${tenant.name}`);

  // ─── BRANCHES ──────────────────────────────────────────────────────────────

  const hq = await prisma.branch.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'HQ' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Matriz São Paulo',
      code: 'HQ',
      email: 'matriz@demo.com.br',
      phone: '(11) 3000-0001',
      address: { city: 'São Paulo', state: 'SP', street: 'Av. Paulista, 1000' },
      isActive: true,
    },
  });

  const filial = await prisma.branch.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'SP-CAMP' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Filial Campinas',
      code: 'SP-CAMP',
      email: 'campinas@demo.com.br',
      phone: '(19) 3000-0002',
      address: { city: 'Campinas', state: 'SP', street: 'Av. Brasil, 200' },
      isActive: true,
    },
  });

  console.log(`✅ Branches: ${hq.name}, ${filial.name}`);

  // ─── USERS ─────────────────────────────────────────────────────────────────

  const passwordHash = await bcrypt.hash('Admin@123', 10);
  const userHash = await bcrypt.hash('User@123', 10);

  const adminUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@demo.com.br' } },
    update: {},
    create: {
      tenantId: tenant.id,
      branchId: hq.id,
      name: 'Administrador Sistema',
      email: 'admin@demo.com.br',
      password: passwordHash,
      phone: '(11) 99000-0001',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });

  const managerUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'gerente@demo.com.br' } },
    update: {},
    create: {
      tenantId: tenant.id,
      branchId: hq.id,
      name: 'Carlos Gerente',
      email: 'gerente@demo.com.br',
      password: userHash,
      phone: '(11) 99000-0002',
      role: 'MANAGER',
      status: 'ACTIVE',
    },
  });

  const techUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'tecnico1@demo.com.br' } },
    update: {},
    create: {
      tenantId: tenant.id,
      branchId: hq.id,
      name: 'João Técnico',
      email: 'tecnico1@demo.com.br',
      password: userHash,
      phone: '(11) 99000-0003',
      role: 'TECHNICIAN',
      status: 'ACTIVE',
    },
  });

  const techUser2 = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'tecnico2@demo.com.br' } },
    update: {},
    create: {
      tenantId: tenant.id,
      branchId: filial.id,
      name: 'Maria Técnica',
      email: 'tecnico2@demo.com.br',
      password: userHash,
      phone: '(19) 99000-0004',
      role: 'TECHNICIAN',
      status: 'ACTIVE',
    },
  });

  const operatorUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'operador@demo.com.br' } },
    update: {},
    create: {
      tenantId: tenant.id,
      branchId: hq.id,
      name: 'Ana Operadora',
      email: 'operador@demo.com.br',
      password: userHash,
      phone: '(11) 99000-0005',
      role: 'OPERATOR',
      status: 'ACTIVE',
    },
  });

  console.log(`✅ Users: 5 created`);

  // ─── PERMISSIONS ───────────────────────────────────────────────────────────

  const modules = [
    'auth', 'tenants', 'users', 'clients', 'contracts',
    'service-orders', 'field-execution', 'materials', 'inventory',
    'fleet', 'scheduling', 'projects', 'assets', 'helpdesk',
    'call-center', 'reports', 'financial', 'hr', 'time-tracking',
    'safety', 'works', 'public-lighting', 'notifications', 'audit',
    'settings', 'vehicle-tracking',
  ];
  const actions = ['create', 'read', 'update', 'delete', 'list'];

  for (const module of modules) {
    for (const action of actions) {
      await prisma.permission.upsert({
        where: { tenantId_module_action: { tenantId: tenant.id, module, action } },
        update: {},
        create: { tenantId: tenant.id, module, action, label: `${module}:${action}` },
      });
    }
  }

  console.log(`✅ Permissions: ${modules.length * actions.length}`);

  // ─── COST CENTERS ──────────────────────────────────────────────────────────

  const ccOps = await prisma.costCenter.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'CC-OPS' } },
    update: {},
    create: { tenantId: tenant.id, code: 'CC-OPS', name: 'Operações de Campo', type: 'OPERATIONAL', budget: 500000, isActive: true },
  });

  const ccAdm = await prisma.costCenter.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'CC-ADM' } },
    update: {},
    create: { tenantId: tenant.id, code: 'CC-ADM', name: 'Administrativo', type: 'ADMINISTRATIVE', budget: 200000, isActive: true },
  });

  await prisma.costCenter.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'CC-TEC' } },
    update: {},
    create: { tenantId: tenant.id, code: 'CC-TEC', name: 'Tecnologia', type: 'OPERATIONAL', budget: 150000, isActive: true },
  });

  const ccVen = await prisma.costCenter.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'CC-VEN' } },
    update: {},
    create: { tenantId: tenant.id, code: 'CC-VEN', name: 'Vendas', type: 'REVENUE', budget: 80000, isActive: true },
  });

  console.log(`✅ Cost Centers: 4`);

  // ─── CLIENTS ───────────────────────────────────────────────────────────────

  const client1 = await prisma.client.create({
    data: {
      tenantId: tenant.id,
      name: 'Prefeitura Municipal de São Paulo',
      tradeName: 'PMSP',
      document: '46.395.000/0001-39',
      type: 'PUBLIC',
      email: 'contratos@pmsp.sp.gov.br',
      phone: '(11) 3396-0000',
      status: 'ACTIVE',
    },
  });

  const client2 = await prisma.client.create({
    data: {
      tenantId: tenant.id,
      name: 'Vivo Telecomunicações S.A.',
      tradeName: 'Vivo',
      document: '02.558.157/0001-62',
      type: 'COMPANY',
      email: 'fornecedores@vivo.com.br',
      phone: '(11) 3906-0000',
      status: 'ACTIVE',
    },
  });

  await prisma.client.create({
    data: {
      tenantId: tenant.id,
      name: 'Comgás Distribuidora de Gás S.A.',
      tradeName: 'Comgás',
      document: '61.856.571/0001-17',
      type: 'COMPANY',
      email: 'servicos@comgas.com.br',
      phone: '(11) 3337-0000',
      status: 'ACTIVE',
    },
  });

  await prisma.clientContact.create({
    data: { clientId: client1.id, name: 'Fernanda Lima', role: 'Diretora de Contratos', email: 'fernanda.lima@pmsp.sp.gov.br', phone: '(11) 3396-1234', isPrimary: true },
  });
  await prisma.clientContact.create({
    data: { clientId: client2.id, name: 'Roberto Alves', role: 'Gerente de Fornecedores', email: 'r.alves@vivo.com.br', phone: '(11) 3906-5678', isPrimary: true },
  });

  await prisma.clientAddress.create({
    data: { clientId: client1.id, label: 'Sede', street: 'Viaduto do Chá', number: '15', city: 'São Paulo', state: 'SP', zipCode: '01002-020', isPrimary: true },
  });

  console.log(`✅ Clients: 3`);

  // ─── CONTRACTS ─────────────────────────────────────────────────────────────

  const contract1 = await prisma.contract.create({
    data: {
      tenantId: tenant.id,
      clientId: client1.id,
      number: 'CONT-2024-001',
      title: 'Manutenção de Iluminação Pública',
      type: 'SERVICE',
      status: 'ACTIVE',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2026-12-31'),
      value: 2500000,
    },
  });

  const contract2 = await prisma.contract.create({
    data: {
      tenantId: tenant.id,
      clientId: client2.id,
      number: 'CONT-2024-002',
      title: 'Instalação de Infraestrutura Telecom',
      type: 'SERVICE',
      status: 'ACTIVE',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2025-12-31'),
      value: 1800000,
    },
  });

  console.log(`✅ Contracts: 2`);

  // ─── MATERIAL GROUPS ───────────────────────────────────────────────────────

  const groupEle = await prisma.materialGroup.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'ELE' } },
    update: {},
    create: { tenantId: tenant.id, code: 'ELE', name: 'Elétrico', isActive: true },
  });

  const groupMec = await prisma.materialGroup.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'MEC' } },
    update: {},
    create: { tenantId: tenant.id, code: 'MEC', name: 'Mecânico', isActive: true },
  });

  const groupEpi = await prisma.materialGroup.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'EPI' } },
    update: {},
    create: { tenantId: tenant.id, code: 'EPI', name: 'EPI / Segurança', isActive: true },
  });

  console.log(`✅ Material Groups: 3`);

  // ─── MATERIALS ─────────────────────────────────────────────────────────────

  const matLamp = await prisma.material.create({
    data: { tenantId: tenant.id, groupId: groupEle.id, code: 'MAT-ELE-001', name: 'Lâmpada LED 70W', unit: 'UN', minStock: 50, maxStock: 500, costPrice: 45.90 },
  });

  const matCabo = await prisma.material.create({
    data: { tenantId: tenant.id, groupId: groupEle.id, code: 'MAT-ELE-002', name: 'Cabo Elétrico 2.5mm', unit: 'MT', minStock: 200, maxStock: 2000, costPrice: 3.50 },
  });

  await prisma.material.create({
    data: { tenantId: tenant.id, groupId: groupMec.id, code: 'MAT-MEC-001', name: 'Braço de Luminária', unit: 'UN', minStock: 20, maxStock: 100, costPrice: 85.00 },
  });

  const matCapacete = await prisma.material.create({
    data: { tenantId: tenant.id, groupId: groupEpi.id, code: 'MAT-EPI-001', name: 'Capacete de Segurança', unit: 'UN', minStock: 10, maxStock: 50, costPrice: 32.00 },
  });

  const matLuva = await prisma.material.create({
    data: { tenantId: tenant.id, groupId: groupEpi.id, code: 'MAT-EPI-002', name: 'Luva Isolante 1000V', unit: 'PAR', minStock: 10, maxStock: 60, costPrice: 78.00 },
  });

  // Stock items
  await prisma.stockItem.create({
    data: { tenantId: tenant.id, branchId: hq.id, materialId: matLamp.id, quantity: 320, availableQty: 300, reservedQty: 20, averageCost: 45.90 },
  });
  await prisma.stockItem.create({
    data: { tenantId: tenant.id, branchId: hq.id, materialId: matCabo.id, quantity: 1500, availableQty: 1500, averageCost: 3.50 },
  });
  await prisma.stockItem.create({
    data: { tenantId: tenant.id, branchId: hq.id, materialId: matCapacete.id, quantity: 25, availableQty: 25, averageCost: 32.00 },
  });
  await prisma.stockItem.create({
    data: { tenantId: tenant.id, branchId: hq.id, materialId: matLuva.id, quantity: 18, availableQty: 18, averageCost: 78.00 },
  });

  // Stock movements — requires unitCost, totalCost, balanceBefore, balanceAfter, performedById
  await prisma.stockMovement.create({
    data: {
      tenantId: tenant.id, branchId: hq.id, materialId: matLamp.id,
      type: 'ENTRY', quantity: 200, unitCost: 45.90, totalCost: 9180.00,
      balanceBefore: 120, balanceAfter: 320, performedById: adminUser.id, notes: 'Compra inicial',
    },
  });
  await prisma.stockMovement.create({
    data: {
      tenantId: tenant.id, branchId: hq.id, materialId: matLamp.id,
      type: 'EXIT', quantity: 20, unitCost: 45.90, totalCost: 918.00,
      balanceBefore: 320, balanceAfter: 300, performedById: techUser.id, notes: 'Consumo OS-2024-00001',
    },
  });

  console.log(`✅ Materials + Stock: 5 materials, 4 stock items, 2 movements`);

  // ─── SERVICE ORDERS ────────────────────────────────────────────────────────

  const so1 = await prisma.serviceOrder.create({
    data: {
      tenantId: tenant.id,
      branchId: hq.id,
      clientId: client1.id,
      contractId: contract1.id,
      orderNumber: 'OS-2024-00001',
      title: 'Manutenção preventiva poste Av. Paulista 1000',
      description: 'Substituição de lâmpada queimada e verificação das instalações',
      type: 'MAINTENANCE',
      status: 'COMPLETED',
      priority: 'HIGH',
      scheduledAt: new Date('2024-11-15T08:00:00'),
      startedAt: new Date('2024-11-15T08:30:00'),
      completedAt: new Date('2024-11-15T11:45:00'),
      createdById: managerUser.id,
    },
  });

  const so2 = await prisma.serviceOrder.create({
    data: {
      tenantId: tenant.id,
      branchId: hq.id,
      clientId: client2.id,
      contractId: contract2.id,
      orderNumber: 'OS-2024-00002',
      title: 'Instalação de armário telecom – Unidade Moema',
      description: 'Instalação de novo armário de telecomunicações com splitter',
      type: 'INSTALLATION',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      scheduledAt: new Date('2024-12-10T07:00:00'),
      startedAt: new Date('2024-12-10T07:30:00'),
      createdById: managerUser.id,
    },
  });

  const so3 = await prisma.serviceOrder.create({
    data: {
      tenantId: tenant.id,
      branchId: hq.id,
      orderNumber: 'OS-2024-00003',
      title: 'Reparo urgente – poste tombado Rua Augusta',
      description: 'Poste caiu após acidente de trânsito',
      type: 'CORRECTIVE',
      status: 'OPEN',
      priority: 'CRITICAL',
      dueDate: new Date(Date.now() + 4 * 3600000),
      createdById: operatorUser.id,
    },
  });

  // Assignments — no startedAt/endedAt on ServiceOrderAssignment
  await prisma.serviceOrderAssignment.create({
    data: { serviceOrderId: so1.id, userId: techUser.id, assignedById: managerUser.id },
  });
  await prisma.serviceOrderAssignment.create({
    data: { serviceOrderId: so2.id, userId: techUser.id, assignedById: managerUser.id },
  });

  // Comments — authorId, not userId
  await prisma.serviceOrderComment.create({
    data: { serviceOrderId: so1.id, authorId: techUser.id, content: 'Lâmpada substituída. Testado e aprovado.' },
  });
  await prisma.serviceOrderComment.create({
    data: { serviceOrderId: so2.id, authorId: managerUser.id, content: 'Material já separado. Técnico a caminho.', isInternal: true },
  });

  // History — actorId, action, fromValue/toValue
  await prisma.serviceOrderHistory.create({
    data: { serviceOrderId: so1.id, actorId: adminUser.id, action: 'STATUS_CHANGED', fromValue: 'OPEN', toValue: 'COMPLETED' },
  });

  console.log(`✅ Service Orders: 3`);

  // ─── FLEET ─────────────────────────────────────────────────────────────────

  const vehicle1 = await prisma.vehicle.create({
    data: {
      tenantId: tenant.id,
      branchId: hq.id,
      plate: 'ABC-1D23',
      model: 'Sprinter',
      brand: 'Mercedes-Benz',
      year: 2022,
      type: 'VAN',
      status: 'AVAILABLE',
      fuelType: 'DIESEL',
      mileage: 45000,
      color: 'Branco',
      assignedToId: techUser.id,
    },
  });

  const vehicle2 = await prisma.vehicle.create({
    data: {
      tenantId: tenant.id,
      branchId: hq.id,
      plate: 'DEF-2E34',
      model: 'Hilux',
      brand: 'Toyota',
      year: 2023,
      type: 'PICKUP',
      status: 'IN_USE',
      fuelType: 'DIESEL',
      mileage: 18000,
      color: 'Prata',
    },
  });

  await prisma.vehicleMaintenance.create({
    data: {
      tenantId: tenant.id,
      vehicleId: vehicle1.id,
      type: 'PREVENTIVE',
      description: 'Troca de óleo e filtros — revisão 45.000km',
      cost: 850.00,
      mileage: 45000,
      performedAt: new Date('2024-10-20'),
      nextAt: new Date('2025-04-20'),
      performedById: managerUser.id,
      workshopName: 'Oficina Star',
    },
  });

  await prisma.vehiclePosition.create({
    data: { tenantId: tenant.id, vehicleId: vehicle2.id, latitude: -23.561684, longitude: -46.655981, speed: 45.5, heading: 180, source: 'GPS', timestamp: new Date() },
  });

  console.log(`✅ Fleet: 2 vehicles`);

  // ─── HR ────────────────────────────────────────────────────────────────────

  const positionTech = await prisma.position.create({
    data: { tenantId: tenant.id, name: 'Técnico de Campo', description: 'Execução de serviços técnicos em campo', level: 'OPERATIONAL', isActive: true },
  });

  const positionManager = await prisma.position.create({
    data: { tenantId: tenant.id, name: 'Gerente Operacional', description: 'Gestão das operações de campo', level: 'MANAGEMENT', isActive: true },
  });

  const positionElec = await prisma.position.create({
    data: { tenantId: tenant.id, name: 'Eletricista', description: 'Serviços elétricos em campo', level: 'OPERATIONAL', isActive: true },
  });

  await prisma.employee.create({
    data: {
      tenantId: tenant.id,
      branchId: hq.id,
      userId: techUser.id,
      positionId: positionTech.id,
      name: 'João Técnico',
      cpf: '123.456.789-00',
      phone: '(11) 99000-0003',
      email: 'tecnico1@demo.com.br',
      status: 'ACTIVE',
      admissionDate: new Date('2021-03-01'),
      salary: 3500.00,
    },
  });

  await prisma.employee.create({
    data: {
      tenantId: tenant.id,
      branchId: hq.id,
      userId: managerUser.id,
      positionId: positionManager.id,
      name: 'Carlos Gerente',
      cpf: '987.654.321-00',
      phone: '(11) 99000-0002',
      email: 'gerente@demo.com.br',
      status: 'ACTIVE',
      admissionDate: new Date('2019-06-15'),
      salary: 8500.00,
    },
  });

  await prisma.employee.create({
    data: {
      tenantId: tenant.id,
      branchId: filial.id,
      userId: techUser2.id,
      positionId: positionElec.id,
      name: 'Maria Técnica',
      cpf: '111.222.333-44',
      phone: '(19) 99000-0004',
      email: 'tecnico2@demo.com.br',
      status: 'ACTIVE',
      admissionDate: new Date('2022-08-10'),
      salary: 4200.00,
    },
  });

  console.log(`✅ HR: 3 positions, 3 employees`);

  // ─── TIME TRACKING ─────────────────────────────────────────────────────────

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  await prisma.timeEntry.create({
    data: {
      tenantId: tenant.id,
      branchId: hq.id,
      userId: techUser.id,
      serviceOrderId: so1.id,
      description: 'Execução OS-2024-00001',
      startedAt: new Date(new Date(yesterday).setHours(8, 30, 0, 0)),
      endedAt: new Date(new Date(yesterday).setHours(11, 45, 0, 0)),
      durationMinutes: 195,
      type: 'FIELD',
      status: 'COMPLETED',
      approvedById: managerUser.id,
      approvedAt: new Date(),
    },
  });

  await prisma.timeEntry.create({
    data: {
      tenantId: tenant.id,
      branchId: hq.id,
      userId: techUser.id,
      serviceOrderId: so2.id,
      description: 'Execução OS-2024-00002',
      startedAt: new Date(Date.now() - 3600000 * 2),
      type: 'FIELD',
      status: 'RUNNING',
    },
  });

  console.log(`✅ Time Tracking: 2 entries`);

  // ─── SCHEDULING ────────────────────────────────────────────────────────────

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  await prisma.schedule.create({
    data: {
      tenantId: tenant.id,
      branchId: hq.id,
      userId: techUser.id,
      serviceOrderId: so3.id,
      title: 'Reparo Rua Augusta',
      description: 'Poste tombado — atendimento urgente',
      scheduledDate: new Date(new Date(tomorrow).setHours(7, 0, 0, 0)),
      endDate: new Date(new Date(tomorrow).setHours(11, 0, 0, 0)),
      priority: 'CRITICAL',
      status: 'SCHEDULED',
      createdById: managerUser.id,
    },
  });

  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);

  await prisma.schedule.create({
    data: {
      tenantId: tenant.id,
      branchId: filial.id,
      userId: techUser2.id,
      title: 'Inspeção Filial Campinas',
      description: 'Inspeção periódica dos pontos de iluminação',
      scheduledDate: new Date(new Date(dayAfter).setHours(9, 0, 0, 0)),
      endDate: new Date(new Date(dayAfter).setHours(17, 0, 0, 0)),
      priority: 'MEDIUM',
      status: 'SCHEDULED',
      createdById: managerUser.id,
    },
  });

  console.log(`✅ Scheduling: 2 schedules`);

  // ─── FINANCIAL ─────────────────────────────────────────────────────────────

  const invoice1 = await prisma.invoice.create({
    data: {
      tenantId: tenant.id,
      branchId: hq.id,
      costCenterId: ccOps.id,
      clientId: client1.id,
      contractId: contract1.id,
      invoiceNumber: 'NF-2024-00001',
      referenceMonth: '2024-11',
      type: 'SERVICE',
      status: 'PAID',
      issueDate: new Date('2024-11-30'),
      dueDate: new Date('2024-12-15'),
      paidDate: new Date('2024-12-10'),
      subtotal: 85000.00,
      taxAmount: 5525.00,
      discountAmount: 0,
      totalAmount: 90525.00,
      paidAmount: 90525.00,
      createdById: adminUser.id,
    },
  });

  await prisma.invoiceItem.create({
    data: { invoiceId: invoice1.id, tenantId: tenant.id, description: 'Manutenção preventiva – 170 pontos de iluminação', quantity: 170, unitPrice: 500.00, total: 85000.00 },
  });

  await prisma.payment.create({
    data: { invoiceId: invoice1.id, tenantId: tenant.id, amount: 90525.00, method: 'TRANSFER', paidAt: new Date('2024-12-10'), reference: 'TED-20241210-001', registeredById: adminUser.id },
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      tenantId: tenant.id,
      branchId: hq.id,
      costCenterId: ccOps.id,
      clientId: client2.id,
      contractId: contract2.id,
      invoiceNumber: 'NF-2024-00002',
      referenceMonth: '2024-12',
      type: 'SERVICE',
      status: 'ISSUED',
      issueDate: new Date('2024-12-31'),
      dueDate: new Date('2025-01-20'),
      subtotal: 62000.00,
      taxAmount: 4030.00,
      discountAmount: 0,
      totalAmount: 66030.00,
      paidAmount: 0,
      createdById: adminUser.id,
    },
  });

  await prisma.invoiceItem.create({
    data: { invoiceId: invoice2.id, tenantId: tenant.id, serviceOrderId: so2.id, description: 'Instalação armário telecom – 4 unidades', quantity: 4, unitPrice: 15500.00, total: 62000.00 },
  });

  await prisma.expense.create({
    data: {
      tenantId: tenant.id, branchId: hq.id, costCenterId: ccOps.id,
      category: 'FUEL', description: 'Abastecimento frota – novembro 2024',
      amount: 4850.00, competenceDate: new Date('2024-11-30'),
      status: 'PAID', approvedById: managerUser.id, approvedAt: new Date('2024-12-01'), paidAt: new Date('2024-12-05'),
      requestedById: operatorUser.id,
    },
  });

  await prisma.expense.create({
    data: {
      tenantId: tenant.id, branchId: hq.id, costCenterId: ccOps.id,
      category: 'MATERIALS', description: 'Compra de lâmpadas LED – lote 200un',
      amount: 9180.00, competenceDate: new Date('2024-12-01'),
      status: 'APPROVED', approvedById: managerUser.id, approvedAt: new Date('2024-12-02'),
      requestedById: operatorUser.id,
    },
  });

  await prisma.expense.create({
    data: {
      tenantId: tenant.id, branchId: hq.id, costCenterId: ccAdm.id,
      category: 'TRAVEL', description: 'Deslocamento técnico Campinas',
      amount: 380.00, competenceDate: new Date('2024-12-10'),
      status: 'PENDING', requestedById: techUser.id,
    },
  });

  await prisma.revenue.create({
    data: {
      tenantId: tenant.id, branchId: hq.id, costCenterId: ccVen.id,
      category: 'SERVICE', description: 'Receita NF-2024-00001',
      amount: 90525.00, competenceDate: new Date('2024-12-10'),
      createdById: adminUser.id,
    },
  });

  console.log(`✅ Financial: 2 invoices, 1 payment, 3 expenses, 1 revenue`);

  // ─── PROJECTS ──────────────────────────────────────────────────────────────

  const project1 = await prisma.project.create({
    data: {
      tenantId: tenant.id,
      branchId: hq.id,
      clientId: client1.id,
      contractId: contract1.id,
      code: 'PROJ-2024-001',
      name: 'Modernização Iluminação Pública – Fase 1',
      description: 'Substituição de 2.000 pontos de iluminação por LED',
      status: 'IN_PROGRESS',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-06-30'),
      budget: 1800000,
      progress: 35,
      managerId: managerUser.id,
    },
  });

  const phase1 = await prisma.projectPhase.create({
    data: { projectId: project1.id, name: 'Levantamento e Diagnóstico', order: 1, status: 'COMPLETED', progress: 100, startDate: new Date('2024-09-01'), endDate: new Date('2024-10-31') },
  });

  const phase2 = await prisma.projectPhase.create({
    data: { projectId: project1.id, name: 'Execução – Zona Sul', order: 2, status: 'IN_PROGRESS', progress: 60, startDate: new Date('2024-11-01') },
  });

  await prisma.projectTask.create({
    data: { projectId: project1.id, phaseId: phase1.id, tenantId: tenant.id, title: 'Mapeamento dos pontos existentes', status: 'DONE', priority: 'HIGH', completedAt: new Date('2024-10-15') },
  });

  await prisma.projectTask.create({
    data: { projectId: project1.id, phaseId: phase2.id, tenantId: tenant.id, title: 'Instalação lote A – 500 pontos', status: 'IN_PROGRESS', priority: 'HIGH', assignedToId: techUser.id, dueDate: new Date('2025-01-31') },
  });

  await prisma.projectTask.create({
    data: { projectId: project1.id, phaseId: phase2.id, tenantId: tenant.id, title: 'Instalação lote B – 500 pontos', status: 'TODO', priority: 'MEDIUM', assignedToId: techUser2.id, dueDate: new Date('2025-03-31') },
  });

  console.log(`✅ Projects: 1 project, 2 phases, 3 tasks`);

  // ─── ASSETS ────────────────────────────────────────────────────────────────

  const asset1 = await prisma.asset.create({
    data: {
      tenantId: tenant.id, branchId: hq.id,
      code: 'ASSET-GEN-001', name: 'Gerador 150kVA', type: 'EQUIPMENT', category: 'POWER',
      brand: 'Stemac', model: 'GGE 150S', serialNumber: 'STM-2021-045123',
      status: 'ACTIVE', location: 'Pátio Matriz',
      installDate: new Date('2021-05-10'), warrantyUntil: new Date('2026-05-10'),
      specifications: { power: '150kVA', fuel: 'Diesel', autonomy: '8h' },
    },
  });

  const asset2 = await prisma.asset.create({
    data: {
      tenantId: tenant.id, branchId: hq.id,
      code: 'ASSET-ELC-001', name: 'Elevador de Tesoura 12m', type: 'EQUIPMENT', category: 'LIFTING',
      brand: 'Manitou', model: '180 TJ+', serialNumber: 'MAN-2022-089456',
      status: 'ACTIVE', location: 'Garagem Matriz',
      installDate: new Date('2022-03-15'), warrantyUntil: new Date('2025-03-15'),
    },
  });

  await prisma.assetHistory.create({
    data: { assetId: asset1.id, tenantId: tenant.id, type: 'MAINTENANCE', description: 'Manutenção preventiva – troca de filtros', performedAt: new Date('2024-11-01'), performedById: managerUser.id, cost: 1200.00, nextActionAt: new Date('2025-05-01') },
  });

  await prisma.assetHistory.create({
    data: { assetId: asset2.id, tenantId: tenant.id, type: 'INSPECTION', description: 'Inspeção NR-12 – aprovado', performedAt: new Date('2024-10-15'), performedById: techUser.id },
  });

  console.log(`✅ Assets: 2 assets, 2 history`);

  // ─── WORKS ─────────────────────────────────────────────────────────────────

  const work1 = await prisma.work.create({
    data: {
      tenantId: tenant.id, branchId: hq.id, clientId: client1.id, contractId: contract1.id,
      code: 'OBRA-2024-001', name: 'Reforma Rede Distribuição – Zona Norte', type: 'CIVIL',
      status: 'IN_PROGRESS', startDate: new Date('2024-10-01'), endDate: new Date('2025-04-30'),
      budget: 650000, progress: 42, managerId: managerUser.id,
    },
  });

  await prisma.workFront.create({
    data: { workId: work1.id, tenantId: tenant.id, name: 'Frente Norte – Trecho 1', supervisorId: techUser.id, status: 'ACTIVE', progress: 55, startDate: new Date('2024-10-01') },
  });

  await prisma.workMeasurement.create({
    data: {
      workId: work1.id, tenantId: tenant.id, measuredById: techUser.id,
      period: '2024-11', description: 'Medição novembro – 42% execução',
      value: 273000, status: 'APPROVED', approvedById: managerUser.id, approvedAt: new Date('2024-12-02'),
    },
  });

  console.log(`✅ Works: 1 work, 1 front, 1 measurement`);

  // ─── PUBLIC LIGHTING ───────────────────────────────────────────────────────

  const lp1 = await prisma.lightingPoint.create({
    data: { tenantId: tenant.id, branchId: hq.id, code: 'LP-AV-PAU-001', address: 'Av. Paulista, 1000', neighborhood: 'Bela Vista', city: 'São Paulo', state: 'SP', type: 'POLE', lampType: 'LED', power: 70, status: 'ACTIVE', latitude: -23.5614, longitude: -46.6558 },
  });

  const lp2 = await prisma.lightingPoint.create({
    data: { tenantId: tenant.id, branchId: hq.id, code: 'LP-RU-AUG-001', address: 'Rua Augusta, 500', neighborhood: 'Consolação', city: 'São Paulo', state: 'SP', type: 'POLE', lampType: 'SODIUM', power: 150, status: 'FAULT', latitude: -23.5523, longitude: -46.6563 },
  });

  await prisma.lightingPoint.create({
    data: { tenantId: tenant.id, branchId: filial.id, code: 'LP-AV-BRA-001', address: 'Av. Brasil, 200', neighborhood: 'Centro', city: 'Campinas', state: 'SP', type: 'POLE', lampType: 'LED', power: 100, status: 'ACTIVE', latitude: -22.9027, longitude: -47.0613 },
  });

  await prisma.lightingOrder.create({
    data: { tenantId: tenant.id, lightingPointId: lp2.id, type: 'CORRECTIVE', priority: 'HIGH', description: 'Lâmpada com defeito – apagou completamente', status: 'PENDING', technicianId: techUser.id },
  });

  await prisma.lightingOrder.create({
    data: { tenantId: tenant.id, lightingPointId: lp1.id, type: 'PREVENTIVE', priority: 'LOW', description: 'Inspeção preventiva trimestral', status: 'COMPLETED', completedAt: new Date('2024-11-15'), technicianId: techUser.id },
  });

  console.log(`✅ Public Lighting: 3 points, 2 orders`);

  // ─── SAFETY ────────────────────────────────────────────────────────────────

  await prisma.safetyDocument.create({
    data: { tenantId: tenant.id, userId: techUser.id, type: 'NR10', title: 'Certificado NR-10 Básico – João Técnico', issuedAt: new Date('2023-06-01'), expiresAt: new Date('2025-06-01'), status: 'VALID' },
  });

  await prisma.safetyDocument.create({
    data: { tenantId: tenant.id, userId: techUser2.id, type: 'NR35', title: 'Certificado NR-35 Trabalho em Altura – Maria Técnica', issuedAt: new Date('2024-02-15'), expiresAt: new Date('2026-02-15'), status: 'VALID' },
  });

  await prisma.pPEDelivery.create({
    data: { tenantId: tenant.id, userId: techUser.id, receivedById: adminUser.id, item: 'Capacete de Segurança', quantity: 1, deliveredAt: new Date('2024-01-15') },
  });

  await prisma.pPEDelivery.create({
    data: { tenantId: tenant.id, userId: techUser.id, receivedById: adminUser.id, item: 'Luva Isolante 1000V', quantity: 2, deliveredAt: new Date('2024-01-15') },
  });

  await prisma.pPEDelivery.create({
    data: { tenantId: tenant.id, userId: techUser2.id, receivedById: adminUser.id, item: 'Cinto de Segurança Tipo Paraquedista', quantity: 1, deliveredAt: new Date('2024-03-01') },
  });

  await prisma.incident.create({
    data: {
      tenantId: tenant.id, branchId: hq.id, reportedById: techUser.id,
      type: 'NEAR_MISS', severity: 'LOW',
      description: 'Quase acidente – fio solto durante manutenção em poste',
      location: 'Av. Paulista, 1000',
      occurredAt: new Date('2024-11-10T10:30:00'),
      injuries: false, status: 'CLOSED',
      correctiveAction: 'Reforço no procedimento de isolamento. Técnicos retreinados.',
      resolvedAt: new Date('2024-11-11'),
    },
  });

  console.log(`✅ Safety: 2 documents, 3 PPE deliveries, 1 incident`);

  // ─── HELPDESK ──────────────────────────────────────────────────────────────

  const ticket1 = await prisma.ticket.create({
    data: {
      tenantId: tenant.id, branchId: hq.id,
      requesterId: operatorUser.id, assignedToId: techUser.id,
      title: 'Sistema de estoque não carrega no Chrome',
      description: 'Ao acessar a tela de estoque pelo Chrome o sistema trava. Firefox funciona.',
      category: 'BUG', priority: 'HIGH', status: 'IN_PROGRESS',
      slaDeadline: new Date(Date.now() + 8 * 3600000),
    },
  });

  await prisma.ticket.create({
    data: {
      tenantId: tenant.id, branchId: hq.id,
      requesterId: managerUser.id,
      title: 'Solicitar acesso ao módulo de Relatórios',
      description: 'Preciso de acesso de leitura ao módulo de relatórios financeiros.',
      category: 'ACCESS', priority: 'MEDIUM', status: 'OPEN',
    },
  });

  // TicketComment — no tenantId
  await prisma.ticketComment.create({
    data: { ticketId: ticket1.id, authorId: techUser.id, content: 'Identificado conflito de cache. Vou liberar fix ainda hoje.' },
  });

  await prisma.ticketComment.create({
    data: { ticketId: ticket1.id, authorId: managerUser.id, content: 'Usuário impactado aguarda resolução.', isInternal: true },
  });

  console.log(`✅ Helpdesk: 2 tickets, 2 comments`);

  // ─── CALL CENTER ───────────────────────────────────────────────────────────

  await prisma.callRecord.create({
    data: {
      tenantId: tenant.id, attendantId: operatorUser.id,
      clientId: client1.id, clientName: 'Fernanda Lima', clientPhone: '(11) 3396-1234',
      subject: 'Consulta sobre prazo de atendimento OS-2024-00003',
      description: 'Cliente questionou prazo para reparo do poste tombado na Rua Augusta.',
      channel: 'PHONE', status: 'COMPLETED', duration: 420, outcome: 'INFORMED',
      startedAt: new Date(Date.now() - 3600000),
      endedAt: new Date(Date.now() - 3600000 + 420000),
    },
  });

  await prisma.callRecord.create({
    data: {
      tenantId: tenant.id, attendantId: operatorUser.id,
      clientPhone: '(11) 98765-4321', clientName: 'Cidadão – anônimo',
      subject: 'Reclamação – poste apagado Rua da Consolação',
      description: 'Morador informa que há 3 dias o poste da rua está apagado.',
      channel: 'PHONE', status: 'COMPLETED', duration: 185, outcome: 'OS_CREATED',
      startedAt: new Date(Date.now() - 7200000),
      endedAt: new Date(Date.now() - 7200000 + 185000),
    },
  });

  console.log(`✅ Call Center: 2 records`);

  // ─── NOTIFICATIONS ─────────────────────────────────────────────────────────

  await prisma.notification.create({
    data: { tenantId: tenant.id, userId: techUser.id, type: 'NEW_SERVICE_ORDER', title: 'Nova OS atribuída', body: 'A OS OS-2024-00003 foi atribuída a você. Atendimento urgente.', channel: 'IN_APP', sentAt: new Date() },
  });

  await prisma.notification.create({
    data: { tenantId: tenant.id, userId: managerUser.id, type: 'EXPENSE_PENDING', title: 'Despesa aguarda aprovação', body: 'A despesa "Deslocamento técnico Campinas" de R$ 380,00 aguarda aprovação.', channel: 'IN_APP', sentAt: new Date() },
  });

  await prisma.notification.create({
    data: { tenantId: tenant.id, userId: techUser.id, type: 'SCHEDULE_REMINDER', title: 'Lembrete de agendamento', body: 'Agendamento amanhã às 07:00 – Reparo Rua Augusta.', channel: 'IN_APP', isRead: false, sentAt: new Date() },
  });

  console.log(`✅ Notifications: 3`);

  // ─── AUDIT LOGS ────────────────────────────────────────────────────────────

  await prisma.auditLog.create({
    data: { tenantId: tenant.id, userId: adminUser.id, module: 'auth', action: 'LOGIN', entityType: 'User', entityId: adminUser.id, ipAddress: '127.0.0.1', severity: 'INFO' },
  });

  await prisma.auditLog.create({
    data: { tenantId: tenant.id, userId: adminUser.id, module: 'service-orders', action: 'CREATE', entityType: 'ServiceOrder', entityId: so1.id, after: { status: 'OPEN' }, severity: 'INFO' },
  });

  console.log(`✅ Audit Logs: 2`);

  // ─── SETTINGS (SystemSetting) ──────────────────────────────────────────────

  const settings = [
    { module: 'service-orders', key: 'sla_default_hours', value: '24', label: 'SLA padrão (horas)' },
    { module: 'service-orders', key: 'max_open_per_technician', value: '5', label: 'Máx. OS abertas por técnico' },
    { module: 'notifications', key: 'email_enabled', value: 'true', label: 'Notificações por e-mail ativas' },
    { module: 'notifications', key: 'push_enabled', value: 'false', label: 'Notificações push ativas' },
    { module: 'financial', key: 'default_payment_terms', value: '30', label: 'Prazo padrão de pagamento (dias)' },
    { module: 'inventory', key: 'low_stock_alert_enabled', value: 'true', label: 'Alerta de estoque baixo ativo' },
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { tenantId_module_key: { tenantId: tenant.id, module: s.module, key: s.key } },
      update: {},
      create: { tenantId: tenant.id, module: s.module, key: s.key, value: s.value, label: s.label },
    });
  }

  console.log(`✅ Settings: ${settings.length}`);

  // ─── SUMMARY ───────────────────────────────────────────────────────────────

  console.log('\n🎉 Seeding complete!');
  console.log('\n📋 Login credentials:');
  console.log('   Admin:    admin@demo.com.br    / Admin@123');
  console.log('   Gerente:  gerente@demo.com.br  / User@123');
  console.log('   Técnico:  tecnico1@demo.com.br / User@123');
  console.log('   Operador: operador@demo.com.br / User@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
