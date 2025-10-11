import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo organization
  const org = await prisma.org.upsert({
    where: { id: 'demo-org-1' },
    update: {},
    create: {
      id: 'demo-org-1',
      name: 'Acme Corporation',
      plan: 'ENTERPRISE',
      settings: {
        timezone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY',
        currency: 'USD',
        features: {
          llmFallback: true,
          ocrCloud: true,
          sandboxMode: true,
        },
        retention: {
          runs: 90,
          artifacts: 365,
          audit: 2555,
        },
        notifications: {
          email: true,
          slack: false,
          webhook: false,
        },
        security: {
          requireMfa: false,
          sessionTimeout: 3600,
          ipWhitelist: [],
        },
      },
      domain: 'acme.com',
      billingEmail: 'billing@acme.com',
    },
  });

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: {},
    create: {
      id: 'admin-user-1',
      email: 'admin@acme.com',
      name: 'Admin User',
      role: 'ADMIN',
      orgId: org.id,
      providerId: 'admin-provider-1',
      isActive: true,
    },
  });

  // Create demo users
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@acme.com' },
    update: {},
    create: {
      id: 'manager-user-1',
      email: 'manager@acme.com',
      name: 'Manager User',
      role: 'MANAGER',
      orgId: org.id,
      providerId: 'manager-provider-1',
      isActive: true,
    },
  });

  const operatorUser = await prisma.user.upsert({
    where: { email: 'operator@acme.com' },
    update: {},
    create: {
      id: 'operator-user-1',
      email: 'operator@acme.com',
      name: 'Operator User',
      role: 'OPERATOR',
      orgId: org.id,
      providerId: 'operator-provider-1',
      isActive: true,
    },
  });

  // Create demo connectors
  const slackConnector = await prisma.connector.upsert({
    where: { id: 'slack-connector-1' },
    update: {},
    create: {
      id: 'slack-connector-1',
      orgId: org.id,
      type: 'SLACK',
      name: 'Slack Production',
      status: 'ACTIVE',
      settings: {
        workspace: 'acme-corp',
        channels: ['#automation', '#alerts'],
      },
      isSandbox: false,
    },
  });

  const gmailConnector = await prisma.connector.upsert({
    where: { id: 'gmail-connector-1' },
    update: {},
    create: {
      id: 'gmail-connector-1',
      orgId: org.id,
      type: 'GMAIL',
      name: 'Gmail Production',
      status: 'ACTIVE',
      settings: {
        domain: 'acme.com',
        labels: ['INBOX', 'AUTOMATION'],
      },
      isSandbox: false,
    },
  });

  // Create demo workflows
  const apWorkflow = await prisma.workflow.upsert({
    where: { id: 'ap-workflow-1' },
    update: {},
    create: {
      id: 'ap-workflow-1',
      orgId: org.id,
      name: 'AP Invoice Processing',
      version: '1.0.0',
      spec: {
        name: 'AP Invoice Processing',
        description: 'Automated accounts payable invoice processing with 2/3-way matching',
        version: '1.0.0',
        trigger: {
          type: 'webhook',
          config: {
            source: 'gmail',
            event: 'email.received',
            filters: {
              subject: 'Invoice',
              from: '@vendor.com',
            },
          },
        },
        steps: [
          {
            id: 'ingest',
            name: 'Ingest Email',
            type: 'gmail_ingest',
            config: {
              connectorId: gmailConnector.id,
              labels: ['INBOX'],
            },
          },
          {
            id: 'ocr',
            name: 'Extract Text',
            type: 'ocr_extract',
            config: {
              providers: ['tesseract', 'aws_textract'],
            },
          },
          {
            id: 'normalize',
            name: 'Normalize Data',
            type: 'data_normalize',
            config: {
              schema: 'invoice',
            },
          },
          {
            id: 'match',
            name: '2/3-Way Match',
            type: 'po_match',
            config: {
              tolerance: 0.05,
            },
            requiresApproval: true,
          },
          {
            id: 'approve',
            name: 'Approval',
            type: 'approval',
            config: {
              approvers: ['manager@acme.com'],
              slaHours: 24,
            },
          },
          {
            id: 'payment',
            name: 'Generate Payment',
            type: 'payment_generate',
            config: {
              format: 'ach',
            },
          },
        ],
        variables: {
          maxAmount: 10000,
          autoApproveThreshold: 1000,
        },
        tags: ['finance', 'ap', 'invoice'],
      },
      status: 'ACTIVE',
      enabled: true,
      createdBy: adminUser.id,
    },
  });

  const interviewWorkflow = await prisma.workflow.upsert({
    where: { id: 'interview-workflow-1' },
    update: {},
    create: {
      id: 'interview-workflow-1',
      orgId: org.id,
      name: 'Interview Scheduling',
      version: '1.0.0',
      spec: {
        name: 'Interview Scheduling',
        description: 'Automated interview scheduling with calendar integration',
        version: '1.0.0',
        trigger: {
          type: 'webhook',
          config: {
            source: 'webhook',
            event: 'interview.request',
          },
        },
        steps: [
          {
            id: 'validate',
            name: 'Validate Request',
            type: 'data_validate',
            config: {
              schema: 'interview_request',
            },
          },
          {
            id: 'find_slots',
            name: 'Find Available Slots',
            type: 'calendar_find_slots',
            config: {
              duration: 60,
              buffer: 15,
              workingHours: '9:00-17:00',
            },
          },
          {
            id: 'book',
            name: 'Book Interview',
            type: 'calendar_book',
            config: {
              sendInvites: true,
            },
          },
          {
            id: 'notify',
            name: 'Send Notifications',
            type: 'notification_send',
            config: {
              channels: ['email', 'slack'],
            },
          },
        ],
        variables: {
          timezone: 'America/New_York',
          workingDays: [1, 2, 3, 4, 5],
        },
        tags: ['hr', 'interview', 'scheduling'],
      },
      status: 'ACTIVE',
      enabled: true,
      createdBy: managerUser.id,
    },
  });

  const ticketWorkflow = await prisma.workflow.upsert({
    where: { id: 'ticket-workflow-1' },
    update: {},
    create: {
      id: 'ticket-workflow-1',
      orgId: org.id,
      name: 'Ticket Triage & SLA',
      version: '1.0.0',
      spec: {
        name: 'Ticket Triage & SLA',
        description: 'Automated ticket classification and SLA management',
        version: '1.0.0',
        trigger: {
          type: 'webhook',
          config: {
            source: 'zendesk',
            event: 'ticket.created',
          },
        },
        steps: [
          {
            id: 'classify',
            name: 'Classify Ticket',
            type: 'llm_classify',
            config: {
              model: 'gpt-4',
              categories: ['bug', 'feature', 'question', 'incident'],
            },
          },
          {
            id: 'assign',
            name: 'Assign to Queue',
            type: 'ticket_assign',
            config: {
              rules: 'classification_rules',
            },
          },
          {
            id: 'sla',
            name: 'Set SLA Timers',
            type: 'sla_set',
            config: {
              firstResponse: 4, // hours
              resolution: 24, // hours
            },
          },
          {
            id: 'notify',
            name: 'Notify Team',
            type: 'notification_send',
            config: {
              channels: ['slack'],
              template: 'ticket_assigned',
            },
          },
        ],
        variables: {
          escalationLevels: ['team_lead', 'manager', 'director'],
          businessHours: '9:00-17:00',
        },
        tags: ['support', 'ticket', 'sla'],
      },
      status: 'ACTIVE',
      enabled: true,
      createdBy: operatorUser.id,
    },
  });

  // Create demo runs
  const apRun = await prisma.run.create({
    data: {
      id: 'ap-run-1',
      orgId: org.id,
      workflowId: apWorkflow.id,
      status: 'SUCCEEDED',
      input: {
        emailId: 'email-123',
        subject: 'Invoice #INV-2024-001',
        from: 'billing@vendor.com',
        amount: 1500.00,
        currency: 'USD',
      },
      output: {
        invoiceNumber: 'INV-2024-001',
        vendor: 'Vendor Corp',
        amount: 1500.00,
        poNumber: 'PO-2024-001',
        matchStatus: 'matched',
        approvalStatus: 'approved',
        paymentFile: 'payment-ach-001.txt',
      },
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      finishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      duration: 60 * 60 * 1000, // 1 hour
      createdBy: adminUser.id,
      priority: 5,
      tags: ['invoice', 'ap', 'approved'],
    },
  });

  const interviewRun = await prisma.run.create({
    data: {
      id: 'interview-run-1',
      orgId: org.id,
      workflowId: interviewWorkflow.id,
      status: 'RUNNING',
      input: {
        candidateName: 'John Doe',
        candidateEmail: 'john@example.com',
        position: 'Senior Developer',
        timezone: 'America/New_York',
        preferredTimes: ['9:00-12:00', '14:00-17:00'],
      },
      startedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      createdBy: managerUser.id,
      priority: 7,
      tags: ['interview', 'scheduling'],
    },
  });

  const ticketRun = await prisma.run.create({
    data: {
      id: 'ticket-run-1',
      orgId: org.id,
      workflowId: ticketWorkflow.id,
      status: 'NEEDS_APPROVAL',
      input: {
        ticketId: 'ZD-12345',
        subject: 'Login issues after update',
        description: 'Users cannot login after the latest update',
        priority: 'high',
        category: 'bug',
      },
      startedAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      createdBy: operatorUser.id,
      priority: 8,
      tags: ['ticket', 'bug', 'high-priority'],
    },
  });

  // Create run steps
  await prisma.runStep.createMany({
    data: [
      {
        id: 'ap-step-1',
        runId: apRun.id,
        name: 'Ingest Email',
        status: 'SUCCEEDED',
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        finishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000),
        logsUrl: 'https://logs.example.com/ap-run-1/step-1',
        metrics: { duration: 300000, memoryUsage: 50 },
      },
      {
        id: 'ap-step-2',
        runId: apRun.id,
        name: 'Extract Text',
        status: 'SUCCEEDED',
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000),
        finishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 10 * 60 * 1000),
        logsUrl: 'https://logs.example.com/ap-run-1/step-2',
        metrics: { duration: 300000, confidence: 0.95 },
      },
      {
        id: 'ap-step-3',
        runId: apRun.id,
        name: 'Normalize Data',
        status: 'SUCCEEDED',
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 10 * 60 * 1000),
        finishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 15 * 60 * 1000),
        logsUrl: 'https://logs.example.com/ap-run-1/step-3',
        metrics: { duration: 300000, fieldsExtracted: 12 },
      },
      {
        id: 'ap-step-4',
        runId: apRun.id,
        name: '2/3-Way Match',
        status: 'SUCCEEDED',
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 15 * 60 * 1000),
        finishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 20 * 60 * 1000),
        logsUrl: 'https://logs.example.com/ap-run-1/step-4',
        metrics: { duration: 300000, matchScore: 0.98 },
        requiresApproval: true,
      },
      {
        id: 'ap-step-5',
        runId: apRun.id,
        name: 'Approval',
        status: 'SUCCEEDED',
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 20 * 60 * 1000),
        finishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 25 * 60 * 1000),
        logsUrl: 'https://logs.example.com/ap-run-1/step-5',
        metrics: { duration: 300000, approvedBy: 'manager@acme.com' },
      },
      {
        id: 'ap-step-6',
        runId: apRun.id,
        name: 'Generate Payment',
        status: 'SUCCEEDED',
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 25 * 60 * 1000),
        finishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30 * 60 * 1000),
        logsUrl: 'https://logs.example.com/ap-run-1/step-6',
        metrics: { duration: 300000, fileSize: 1024 },
        artifactUrl: 'https://artifacts.example.com/payment-ach-001.txt',
      },
    ],
  });

  // Create demo rules
  await prisma.rule.createMany({
    data: [
      {
        id: 'rule-1',
        orgId: org.id,
        name: 'High Priority Ticket',
        description: 'Classify tickets as high priority based on keywords',
        jsonLogic: {
          or: [
            { contains: [{ var: 'subject' }, 'urgent'] },
            { contains: [{ var: 'subject' }, 'critical'] },
            { contains: [{ var: 'description' }, 'down'] },
            { contains: [{ var: 'description' }, 'broken'] },
          ],
        },
        enabled: true,
        priority: 90,
        tags: ['ticket', 'priority'],
        createdBy: adminUser.id,
      },
      {
        id: 'rule-2',
        orgId: org.id,
        name: 'Invoice Auto-Approval',
        description: 'Auto-approve invoices under $1000',
        jsonLogic: {
          and: [
            { '<': [{ var: 'amount' }, 1000] },
            { '==': [{ var: 'currency' }, 'USD'] },
            { '==': [{ var: 'matchStatus' }, 'matched'] },
          ],
        },
        enabled: true,
        priority: 80,
        tags: ['invoice', 'approval'],
        createdBy: managerUser.id,
      },
      {
        id: 'rule-3',
        orgId: org.id,
        name: 'Interview Scheduling',
        description: 'Schedule interviews during business hours',
        jsonLogic: {
          and: [
            { '>=': [{ var: 'hour' }, 9] },
            { '<=': [{ var: 'hour' }, 17] },
            { 'in': [{ var: 'dayOfWeek' }, [1, 2, 3, 4, 5]] },
          ],
        },
        enabled: true,
        priority: 70,
        tags: ['interview', 'scheduling'],
        createdBy: operatorUser.id,
      },
    ],
  });

  // Create demo schedules
  await prisma.schedule.createMany({
    data: [
      {
        id: 'schedule-1',
        orgId: org.id,
        workflowId: apWorkflow.id,
        name: 'Daily AP Processing',
        description: 'Process AP invoices daily at 9 AM',
        cron: '0 9 * * 1-5',
        timezone: 'America/New_York',
        enabled: true,
        createdBy: adminUser.id,
        nextRunAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      },
      {
        id: 'schedule-2',
        orgId: org.id,
        workflowId: ticketWorkflow.id,
        name: 'Hourly Ticket Check',
        description: 'Check for new tickets every hour',
        cron: '0 * * * *',
        timezone: 'UTC',
        enabled: true,
        createdBy: operatorUser.id,
        nextRunAt: new Date(Date.now() + 60 * 60 * 1000), // Next hour
      },
    ],
  });

  // Create demo evidence
  await prisma.evidence.createMany({
    data: [
      {
        id: 'evidence-1',
        runId: apRun.id,
        stepId: 'ap-step-2',
        type: 'PDF',
        name: 'invoice-2024-001.pdf',
        description: 'Original invoice PDF',
        s3Key: 'evidence/invoice-2024-001.pdf',
        s3Bucket: 'automation-artifacts',
        s3Region: 'us-east-1',
        url: 'https://artifacts.example.com/evidence/invoice-2024-001.pdf',
        size: 245760,
        hash: 'sha256:abc123...',
        mimeType: 'application/pdf',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        createdBy: adminUser.id,
        tags: ['invoice', 'pdf'],
      },
      {
        id: 'evidence-2',
        runId: apRun.id,
        stepId: 'ap-step-6',
        type: 'TEXT',
        name: 'payment-ach-001.txt',
        description: 'ACH payment file',
        s3Key: 'evidence/payment-ach-001.txt',
        s3Bucket: 'automation-artifacts',
        s3Region: 'us-east-1',
        url: 'https://artifacts.example.com/evidence/payment-ach-001.txt',
        size: 1024,
        hash: 'sha256:def456...',
        mimeType: 'text/plain',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        createdBy: adminUser.id,
        tags: ['payment', 'ach'],
      },
    ],
  });

  // Create demo webhooks
  await prisma.webhook.createMany({
    data: [
      {
        id: 'webhook-1',
        orgId: org.id,
        source: 'GMAIL',
        event: 'EMAIL_RECEIVED',
        url: 'https://api.acme.com/webhooks/gmail',
        secret: 'webhook-secret-1',
        enabled: true,
        createdBy: adminUser.id,
        triggerCount: 15,
        successCount: 14,
        failureCount: 1,
      },
      {
        id: 'webhook-2',
        orgId: org.id,
        source: 'SLACK',
        event: 'SLACK_MESSAGE',
        url: 'https://api.acme.com/webhooks/slack',
        secret: 'webhook-secret-2',
        enabled: true,
        createdBy: managerUser.id,
        triggerCount: 8,
        successCount: 8,
        failureCount: 0,
      },
    ],
  });

  console.log('✅ Database seeded successfully!');
  console.log('\n📊 Demo Data Summary:');
  console.log(`- Organization: ${org.name} (${org.plan})`);
  console.log(`- Users: 3 (Admin, Manager, Operator)`);
  console.log(`- Connectors: 2 (Slack, Gmail)`);
  console.log(`- Workflows: 3 (AP, Interview, Ticket)`);
  console.log(`- Runs: 3 (1 succeeded, 1 running, 1 needs approval)`);
  console.log(`- Rules: 3 (Priority, Auto-approval, Scheduling)`);
  console.log(`- Schedules: 2 (Daily AP, Hourly Tickets)`);
  console.log(`- Evidence: 2 (PDF invoice, ACH payment)`);
  console.log(`- Webhooks: 2 (Gmail, Slack)`);
  console.log('\n🔑 Demo Credentials:');
  console.log('Admin: admin@acme.com');
  console.log('Manager: manager@acme.com');
  console.log('Operator: operator@acme.com');
  console.log('\n🚀 Ready to start the application!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });